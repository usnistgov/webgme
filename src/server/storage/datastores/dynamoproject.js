/*globals requireJS*/
/*jshint node:true, newcap:false*/

/**
 * @author pmeijer / https://github.com/pmeijer
 */

'use strict';

var Q = require('q'),

    CANON = requireJS('common/util/canon'),
    REGEXP = requireJS('common/regexp');

/**
 * Provides methods related to a specific project.
 *
 * @param {string} projectId - identifier of the project (ownerId + '.' + projectName).
 * @constructor
 * @private
 */
function DynamoProject(projectId, adapter) {
    var logger = adapter.logger.fork(projectId),
        rawProjectId = projectId.replace('+', adapter.CONSTANTS.PROJECT_ID_DIV);
    this.projectId = projectId;

    this.closeProject = function (callback) {
        var deferred = Q.defer();
        deferred.resolve();
        return deferred.promise.nodeify(callback);
    };

    this.loadObject = function (hash, callback) {
        var deferred = Q.defer(),
            params;
        if (typeof hash !== 'string') {
            deferred.reject(new Error('loadObject - given hash is not a string : ' + typeof hash));
        } else if (!REGEXP.HASH.test(hash)) {
            deferred.reject(new Error('loadObject - invalid hash :' + hash));
        } else {
            params = {
                TableName: rawProjectId,
                Key: {
                    ID: {
                        S: hash
                    }
                }
            };
            adapter.client.getItem(params, function (err, result) {
                if (err) {
                    deferred.reject(err);
                    return;
                }
                if (result.Item && result.Item.data && result.Item.data.S) {
                    deferred.resolve(JSON.parse(result.Item.data.S));
                } else {
                    logger.error('object does not exist ', hash, result);
                    deferred.reject(new Error('object does not exist ' + hash));
                }
            });
        }

        return deferred.promise.nodeify(callback);
    };

    this.insertObject = function (object, callback) {
        var deferred = Q.defer(),
            params;
        if (object === null || typeof object !== 'object') {
            deferred.reject(new Error('object is not an object'));
        } else if (typeof object._id !== 'string' || !REGEXP.HASH.test(object._id)) {
            deferred.reject(new Error('object._id is not a valid hash.'));
        } else {
            params = {
                TableName: rawProjectId,
                Item: {
                    ID: {
                        S: object._id
                    },
                    data: {
                        S: JSON.stringify(object)
                    }
                },
                ConditionExpression: 'attribute_not_exists(ID)',
                ReturnValues: 'ALL_OLD'
            };

            //if (object.type === 'commit') {
            //    params.Item.time = {
            //        N: object.time.toString()
            //    };
            //} else {
            //    params.Item.time = {
            //        N: '9999999999999'
            //    };
            //}

            adapter.client.putItem(params, function (err, result) {
                if (err) {
                    deferred.reject(err);
                    return;
                }
                console.log(result);
                if (result.Attributes && result.Attributes.data && result.Attributes.data.S) {
                    var objectStr = result.Attributes.data.S,
                        errMsg;
                    if (CANON.stringify(object) === CANON.stringify(JSON.parse(objectStr))) {
                        logger.info('tried to insert existing hash - the two objects were equal',
                            object._id);
                        deferred.resolve();
                    } else {
                        errMsg = 'tried to insert existing hash - the two objects were NOT equal ';
                        logger.error(errMsg, {
                            metadata: {
                                newObject: CANON.stringify(object),
                                oldObject: CANON.stringify(JSON.parse(objectStr))
                            }
                        });
                        deferred.reject(new Error(errMsg + object._id));
                    }
                } else {
                    deferred.resolve();
                }
            });
        }

        return deferred.promise.nodeify(callback);
    };

    this.getBranches = function (callback) {
        return Q.ninvoke(adapter.client, 'hgetall', projectId + adapter.CONSTANTS.BRANCHES)
            .then(function (result) {
                return result || {};
            })
            .nodeify(callback);
    };

    this.getBranchHash = function (branch, callback) {
        return Q.ninvoke(adapter.client, 'hget', projectId + adapter.CONSTANTS.BRANCHES, branch)
            .then(function (branchHash) {
                return branchHash || '';
            }).nodeify(callback);
    };

    this.setBranchHash = function (branch, oldhash, newhash, callback) {
        var deferred = Q.defer(),
            branchesHashMap = projectId + adapter.CONSTANTS.BRANCHES;

        if (oldhash === newhash) {
            Q.ninvoke(adapter.client, 'hget', branchesHashMap, branch)
                .then(function (branchHash) {
                    branchHash = branchHash || '';
                    if (branchHash === oldhash) {
                        deferred.resolve();
                    } else {
                        deferred.reject(new Error('branch hash mismatch'));
                    }
                })
                .catch(deferred.reject);
        } else if (newhash === '') {
            Q.ninvoke(adapter.client, 'hget', branchesHashMap, branch)
                .then(function (branchHash) {
                    if (branchHash === oldhash) {
                        Q.ninvoke(adapter.client, 'hdel', branchesHashMap, branch)
                            .then(deferred.resolve);
                    } else {
                        deferred.reject(new Error('branch hash mismatch'));
                    }
                })
                .catch(deferred.reject);
        } else if (oldhash === '') {
            Q.ninvoke(adapter.client, 'hsetnx', branchesHashMap, branch, newhash)
                .then(function (result) {
                    // 1 if field is a new field in the hash and value was set.
                    // 0 if field already exists in the hash and no operation was performed.
                    if (result === 1) {
                        deferred.resolve();
                    } else {
                        deferred.reject(new Error('branch hash mismatch'));
                    }
                })
                .catch(deferred.reject);
        } else {
            Q.ninvoke(adapter.client, 'hget', branchesHashMap, branch)
                .then(function (branchHash) {
                    if (branchHash === oldhash) {
                        Q.ninvoke(adapter.client, 'hset', branchesHashMap, branch, newhash)
                            .then(function () {
                                deferred.resolve();
                            })
                            .catch(deferred.reject);
                    } else {
                        deferred.reject(new Error('branch hash mismatch'));
                    }
                })
                .catch(deferred.reject);
        }

        return deferred.promise.nodeify(callback);
    };

    this.getCommits = function (before, number, callback) {
        var deferred = Q.defer(),
            params = {
                TableName: rawProjectId,
                KeyConditionExpression: 'ID = # and time < :before',
                ExpressionAttributeValues: {
                    ':before': {
                        N: before.toString()
                    }
                },
                Select: 'SPECIFIC_ATTRIBUTES',
                ProjectionExpression: 'data'
            };

        adapter.client.query(params, function (err, result) {
            if (err) {
                deferred.reject(err);
                return;
            }
            if (result.Item && result.Item.data && result.Item.data.S) {
                deferred.resolve(JSON.parse(result.Item.data.S));
            } else {
                logger.error('object does not exist ', hash, result);
                deferred.reject(new Error('object does not exist ' + hash));
            }
        });

        return deferred.promise.nodeify(callback);
    };
}

module.exports = DynamoProject;
