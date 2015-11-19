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

            function findGreatest(curr, heads, idx) {
                var i;

                for (i = 0; i < heads.length; i += 1) {
                    if (curr.time < heads[i].time) {
                        return i;
                    }
                }

                return -1;
            }

            for (i = 0; i < commits.length; i += 1) {
                commitsMap[commits[i]._id] = commits[i];
                for (j = 0; j < commits[i].parents; j += 1) {
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
            while (true) {
                i = (i + 1) % nbrOfHeads;
                result.push(heads[i]);
                curr = heads[i];
                //TODO: Multiple parents
                curr = commitsMap[heads[i].parents[0]];

                while (curr) {
                    heads[i] = curr;
                    if (findGreatest(curr, heads, i) === -1) {
                        result.push(curr);
                    } else {

                    }
                    curr = commitsMap[heads[i].parents[0]];
                }
            }
        }
    };
});
