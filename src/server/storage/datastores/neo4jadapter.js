/*jshint node:true, newcap:false*/

/**
 * @module Server:Storage:Neo4j
 * @author pmeijer / https://github.com/pmeijer
 */

'use strict';

var neo4j = require('node-neo4j'),
    Q = require('q'),
    Neo4jProject = require('./neo4jproject');

// Data structure (for projectId guest+test):
// guest+test = hashMap(objectHash, objectStr)
// guest+test:branches = hashMap(branchName, branchHash)
// guest+test:commits = hashMap(objectHash, timestamp)

/**
 * @param mainLogger
 * @param gmeConfig
 * @constructor
 */
function Neo4jAdapter(mainLogger, gmeConfig) {
    var self = this,
        connectionCnt = 0,
        connectDeferred,
        disconnectDeferred,
        logger = mainLogger.fork('Neo4jAdapter');

    this.client = null;
    this.logger = logger;
    this.CONSTANTS = {
        PROJECT_LABEL: 'project',
        COMMITS: ':commits'
    };

    function openDatabase(callback) {
        connectionCnt += 1;
        logger.debug('openDatabase, connection counter:', connectionCnt);

        if (connectionCnt === 1) {
            if (self.client === null) {
                logger.debug('Connecting to database...');
                connectDeferred = Q.defer();
                //self.client = new neo4j.GraphDatabase(gmeConfig.storage.database.options);
                self.client = new neo4j('http://localhost:7474');
                connectDeferred.resolve();
            } else {
                logger.debug('Count is 1 but neo4j is not null');
            }
        } else {
            // we are already connected
            logger.debug('Reusing neo4j connection.');
        }

        return connectDeferred.promise.nodeify(callback);
    }

    function closeDatabase(callback) {
        connectionCnt -= 1;
        logger.debug('closeDatabase, connection counter:', connectionCnt);

        if (connectionCnt < 0) {
            logger.error('connection counter became negative, too many closeDatabase. Setting it to 0.', connectionCnt);
            connectionCnt = 0;
        }

        if (!disconnectDeferred) {
            disconnectDeferred = Q.defer();
        }

        if (connectionCnt === 0) {
            if (self.client) {
                logger.debug('Closing connection to neo4j...');
                self.client = null;
                logger.debug('Closed.');
                disconnectDeferred.resolve();
            } else {
                disconnectDeferred.resolve();
            }
        } else {
            logger.debug('Connections still alive.');
        }

        return disconnectDeferred.promise.nodeify(callback);
    }

    function deleteProject(projectId, callback) {
        var deferred = Q.defer();

        if (self.client) {
            Q.ninvoke(self.client, 'deleteNodesWithLabelsAndProperties', self.CONSTANTS.PROJECT_LABEL, {
                projectId: projectId
            })
                .then(function (result) {
                    if (result > 0) {
                        deferred.resolve(true);
                    } else {
                        deferred.reject(false);
                    }
                })
                .catch(deferred.reject);
        } else {
            deferred.reject(new Error('Database is not open.'));
        }

        return deferred.promise.nodeify(callback);
    }

    function openProject(projectId, callback) {
        var deferred = Q.defer();

        logger.debug('openProject', projectId);

        if (self.client) {
            Q.ninvoke(self.client, 'readNodesWithLabelsAndProperties', self.CONSTANTS.PROJECT_LABEL, {
                projectId: projectId
            })
                .then(function (result) {
                    logger.debug('openProject, result', result);
                    if (result.length > 0) {
                        deferred.resolve(new Neo4jProject(projectId, self));
                    } else {
                        deferred.reject(new Error('Project does not exist ' + projectId));
                    }
                })
                .catch(deferred.reject);

        } else {
            deferred.reject(new Error('Database is not open.'));
        }

        return deferred.promise.nodeify(callback);
    }

    function createProject(projectId, callback) {
        var deferred = Q.defer();

        logger.debug('createProject', projectId);

        if (self.client) {
            // TODO: This should happen in one transaction..
            Q.ninvoke(self.client, 'readNodesWithLabelsAndProperties', self.CONSTANTS.PROJECT_LABEL, {
                projectId: projectId
            })
                .then(function (result) {
                    if (result.length === 0) {
                        return Q.ninvoke(self.client, 'insertNode', {projectId: projectId}, self.CONSTANTS.PROJECT_LABEL);
                    }
                })
                .then(function (result) {
                    if (result) {
                        deferred.resolve(new Neo4jProject(projectId, self));
                    } else {
                        deferred.reject(new Error('Project already exists ' + projectId));
                    }
                })
                .catch(deferred.reject);
        } else {
            deferred.reject(new Error('Database is not open.'));
        }

        return deferred.promise.nodeify(callback);
    }

    function renameProject(projectId, newProjectId, callback) {
        var deferred = Q.defer();

        if (self.client) {
            Q.ninvoke(self.client, 'renamenx', projectId, newProjectId)
                .then(function (result) {
                    // 1 if key was renamed to newkey.
                    // 0 if newkey already exists.
                    if (result === 1) {
                        // Force rename for branches and commits.
                        Q.allSettled([
                            Q.ninvoke(self.client, 'rename',
                                projectId + self.CONSTANTS.BRANCHES, newProjectId + self.CONSTANTS.BRANCHES),
                            Q.ninvoke(self.client, 'rename',
                                projectId + self.CONSTANTS.COMMITS, newProjectId + self.CONSTANTS.COMMITS)
                        ])
                            .then(function (/*result*/) {
                                // Result may contain errors if no branches or commits were created,
                                // these do not matter.
                                deferred.resolve();
                            });
                    } else {
                        deferred.reject(new Error('Project already exists ' + newProjectId));
                    }
                })
                .catch(function (err) {
                    if (err.message === 'ERR no such key') {
                        deferred.reject(new Error('Project does not exist ' + projectId));
                    } else {
                        deferred.reject(err);
                    }
                });
        } else {
            deferred.reject(new Error('Database is not open.'));
        }

        return deferred.promise.nodeify(callback);
    }

    this.openDatabase = openDatabase;
    this.closeDatabase = closeDatabase;

    this.openProject = openProject;
    this.deleteProject = deleteProject;
    this.createProject = createProject;
    this.renameProject = renameProject;
}

module.exports = Neo4jAdapter;
