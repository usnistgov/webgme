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
                nbrOfHeads,
                endsMap = {},
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

            result.push(heads[0]);
            i = -1;
            var n,
                k,
                headsRemain = true,
                newHead;

            while (heads.length > 0) {
                i = (i + 1) % heads.length;
                n = (i + 1) % heads.length;
                result.push(heads[i]);
                do {
                    curr = null;
                    newHead = null;

                    if (heads[i].parents.length > 1) {
                        // There is a new head.
                        // TODO: Currently assumes max two parents.
                        if (heads[i].parents[0].time > heads[i].parents[1].time) {
                            newHead = commitsMap[heads[i].parents[1]];
                            curr = commitsMap[heads[i].parents[0]];
                        } else {
                            newHead = commitsMap[heads[i].parents[0]];
                            curr = commitsMap[heads[i].parents[1]];
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
                            heads.splice(k, 0, newHead);
                            if (k < i) {
                                // New head was insert before the current - i must increase to stay at same.
                                i += 1;
                            }
                        }
                    } else {
                        curr = commitsMap[heads[i].parents[0]];
                    }
                    if (curr) {
                        heads[i] = curr;
                        if (curr.time > heads[n].time) {
                            result.push(curr);
                            curr = commitsMap[heads[i].parents[0]];
                        } else {
                            curr = null;
                            // proceed with n
                        }
                    } else {
                        // The head is drained - remove it.
                        heads.splice(i, 1);
                        i -= 1;
                    }
                } while (curr);
            }

            if (result.length < commits.length) {
                throw new Error('Result not full:', result.length, commits.length);
            } else {
                throw new Error('Result over full:', result.length, commits.length);
            }

            return result;
        }
    };
});
