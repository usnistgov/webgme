/*globals define*/
/*jshint node:true, browser: true*/
/**
 * @author lattmann / https://github.com/lattmann
 */

define(['common/storage/constants'], function (CONSTANTS) {
    'use strict';
    return {
        CONSTANTS: CONSTANTS,
        getProjectFullNameFromProjectId: function (projectId) {
            if (projectId) {
                return projectId.replace(CONSTANTS.PROJECT_ID_SEP, CONSTANTS.PROJECT_DISPLAYED_NAME_SEP);
            }
        },
        getProjectDisplayedNameFromProjectId: function (projectId) {
            if (projectId) {
                return projectId.replace(CONSTANTS.PROJECT_ID_SEP, ' ' + CONSTANTS.PROJECT_DISPLAYED_NAME_SEP + ' ');
            }
        },
        getProjectIdFromProjectFullName: function (projectFullName) {
            if (projectFullName) {
                return projectFullName.replace(CONSTANTS.PROJECT_DISPLAYED_NAME_SEP, CONSTANTS.PROJECT_ID_SEP);
            }
        },
        getProjectIdFromOwnerIdAndProjectName: function (userId, projectName) {
            return userId + CONSTANTS.PROJECT_ID_SEP + projectName;
        },
        getProjectNameFromProjectId: function (projectId) {
            if (projectId) {
                return projectId.substring(projectId.indexOf(CONSTANTS.PROJECT_ID_SEP) + 1);
            }
        },
        getOwnerFromProjectId: function (projectId) {
            if (projectId) {
                return projectId.substring(0, projectId.indexOf(CONSTANTS.PROJECT_ID_SEP));
            }
        },
        getHashTaggedHash: function (hash) {
            if (typeof hash === 'string') {
                return hash[0] === '#' ? hash : '#' + hash;
            }
            return hash;
        },
        orderCommits: function (commits) {
            var parents = {},
                heads = [],
                commitsMap = {},
                result = [],
                curr,
                i,
                j;

            function sortByTime(arr) {
                arr.sort(function (a, b) {
                    if (a.time > b.time) {
                        return -1;
                    }
                    if (a.time < b.time) {
                        return 1;
                    }
                    return 0;
                });
            }

            function getCommit(id) {
                var result = commitsMap[id];

                if (result) {
                    commitsMap[id] = null;
                }

                return result;
            }

            for (i = 0; i < commits.length; i += 1) {
                commitsMap[commits[i]._id] = commits[i];
                for (j = 0; j < commits[i].parents.length; j += 1) {
                    parents[commits[i].parents[j]] = true;
                }
            }

            for (i = 0; i < commits.length; i += 1) {
                if (!parents[commits[i]._id]) {
                    heads.push(commits[i]);
                }
            }

            sortByTime(heads);

            //result.push(heads[0]);
            i = -1;
            var n,
                k,
                tic = 0,
                newHead;

            while (heads.length > 0 && result.length < commits.length) {
                tic += 1;
                i = (i + 1) % heads.length;
                n = (i + 1) % heads.length;
                result.push(heads[i]);
                console.log('i, heads, result', i, heads.map(function (c) { return c.time; }), result.map(function (c) { return c.time; }));
                do {
                    curr = null;
                    newHead = null;
                    console.log('new do, i', i);

                    if (heads[i].parents.length > 1) {
                        // There is a new head.
                        // TODO: Currently assumes max two parents.
                        console.log('two heads');
                        if (heads[i].parents[0].time > heads[i].parents[1].time) {
                            newHead = getCommit(heads[i].parents[1]);
                            curr = getCommit(heads[i].parents[0]);
                        } else {
                            newHead = getCommit(heads[i].parents[0]);
                            curr = getCommit(heads[i].parents[1]);
                        }
                        if (newHead) {
                            // Starting from the next head of the current
                            for (j = 1; j < heads.length + 1; j += 1) {
                                k = (i + j) % heads.length;
                                // the first head that is older
                                if (newHead.time > heads[k].time) {
                                    // will be the place of the new head.
                                    break;
                                }
                            }
                            console.log('new head there, k, heads', k, heads.map(function (c) { return c.time; }));
                            heads.splice(k, 0, newHead);
                            if (k <= i) {
                                // New head was insert before the current - i must increase to stay at same.
                                i += 1;
                            }
                            console.log('new head added, i, heads', i, heads.map(function (c) { return c.time; }));
                        }
                    } else {
                        curr = getCommit(heads[i].parents[0]);
                    }
                    if (curr) {
                        heads[i] = curr;
                        if (curr.time > heads[n].time) {
                            result.push(curr);
                            curr = getCommit(heads[i].parents[0]);
                        } else {
                            curr = null;
                            // proceed with n
                        }
                    } else {
                        // The head is drained - remove it.
                        console.log('head is drained', i, heads.map(function (c) { return c.time; }));
                        heads.splice(i, 1);
                        console.log('removed head', heads.map(function (c) { return c.time; }));
                        i -= 1;
                    }
                } while (curr);
            }

            if (result.length < commits.length) {
                throw new Error('Result not full: ' + result.length + ' , ' + commits.length);
            } else if (result.length > commits.length) {
                throw new Error('Result over full: ' + result.length + ' , ' +  commits.length);
            }

            return result;
        }
    };
});
