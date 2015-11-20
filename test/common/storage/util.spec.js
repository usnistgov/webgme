/*jshint node:true, mocha:true*/
/**
 * @author lattmann / https://github.com/lattmann
 */


var testFixture = require('../../_globals.js');

describe('storage util', function () {
    'use strict';
    var StorageUtil = testFixture.requirejs('common/storage/util'),
        expect = testFixture.expect;

    it('should get the full name from project Id', function () {
        expect(StorageUtil.getProjectFullNameFromProjectId('ownerId+projectName')).to.equal('ownerId/projectName');
    });

    it('should return undefined if project id is not given for getProjectFullNameFromProjectId', function () {
        expect(StorageUtil.getProjectFullNameFromProjectId()).to.equal(undefined);
    });

    it('should get project displayed name from project id', function () {
        expect(StorageUtil.getProjectDisplayedNameFromProjectId('ownerId+projectName'))
            .to.equal('ownerId / projectName');
    });

    it('should return undefined if project id is not given for getProjectDisplayedNameFromProjectId', function () {
        expect(StorageUtil.getProjectDisplayedNameFromProjectId()).to.equal(undefined);
    });

    it('should get project id from project full name', function () {
        expect(StorageUtil.getProjectIdFromProjectFullName('ownerId/projectName')).to.equal('ownerId+projectName');
    });

    it('should return undefined if project full name is not given for getProjectIdFromProjectFullName', function () {
        expect(StorageUtil.getProjectIdFromProjectFullName()).to.equal(undefined);
    });

    it('should get project id from owner id and project full name', function () {
        expect(StorageUtil.getProjectIdFromOwnerIdAndProjectName('ownerId', 'projectName'))
            .to.equal('ownerId+projectName');
    });

    it('should get projectName projectId', function () {
        expect(StorageUtil.getProjectNameFromProjectId('ownerId+projectName')).to.equal('projectName');
    });

    it('should return undefined if project projectId is not given for getProjectNameFromProjectId', function () {
        expect(StorageUtil.getProjectNameFromProjectId()).to.equal(undefined);
    });

    describe('orderCommits', function () {
        it('should return same order on simple chain', function () {
            var chain = [
                {
                    _id: '#3',
                    parents: ['#2'],
                    time: 3
                },
                {
                    _id: '#2',
                    parents: ['#1'],
                    time: 2
                },
                {
                    _id: '#1',
                    parents: ['#1'],
                    time: 1
                }
            ];

            expect(StorageUtil.orderCommits(chain)).to.deep.equal(chain);


        });
    });
});