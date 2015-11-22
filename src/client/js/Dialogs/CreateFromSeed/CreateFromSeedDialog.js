/*globals define, $, WebGMEGlobal*/
/*jshint browser: true*/
/**
 * @author lattmann / https://github.com/lattmann
 */

define(['js/Loader/LoaderCircles',
    'common/storage/util',
    'js/Controls/PropertyGrid/Widgets/AssetWidget',
    'blob/BlobClient',
    'text!./templates/CreateFromSeed.html',

    'css!./styles/CreateProjectDialog.css'
], function (LoaderCircles, StorageUtil, AssetWidget, BlobClient, createFromSeedDialogTemplate) {

    'use strict';

    var CreateFromSeed;

    CreateFromSeed = function (client, newProjectId, logger) {
        this._client = client;
        this._logger = logger;
        this.blobClient = new BlobClient();

        this.newProjectId = newProjectId;
        this.seedProjectName = WebGMEGlobal.gmeConfig.seedProjects.defaultProject;
        this.seedProjectType = 'file';
        this.seedProjectBranch = 'master';
        this.seedCommitHash = null;
        this.assetWidget = new AssetWidget({
            propertyName: 'ImportFile',
            propertyValue: ''
        });
        this.assetWidget.el.addClass('form-control selector pull-left');

        this._logger.debug('Create form seed ctor');
    };

    CreateFromSeed.prototype.show = function (fnCallback) {
        var self = this;

        this._fnCallback = fnCallback;

        this._initDialog();

        this._dialog.on('hide.bs.modal', function () {
            self._dialog.remove();
            self._dialog.empty();
            self._dialog = undefined;
        });

        this._dialog.modal('show');
    };

    CreateFromSeed.prototype._initDialog = function () {
        var self = this;

        this._dialog = $(createFromSeedDialogTemplate);
        this._dialog.find('.selection-blob').append(this.assetWidget.el);

        // Forms
        this._formSnapShot = this._dialog.find('form.snap-shot');
        this._formDuplicate = this._dialog.find('form.duplicate');
        this._formBlob = this._dialog.find('form.blob');

        // Assign buttons
        this._btnCreateSnapShot = this._dialog.find('.btn-create-snap-shot');
        this._btnDuplicate = this._dialog.find('.btn-duplicate');
        this._btnCreateBlob = this._dialog.find('.btn-create-blob');

        // Snap-shot selector
        this._selectSnapShot = this._formSnapShot.find('select.snap-shot');
        this._optGroupFile = this._selectSnapShot.find('optgroup.file');
        this._optGroupDb = this._selectSnapShot.find('optgroup.db');
        this._selectSnapShot.children().remove();
        this._optGroupFile.children().remove();
        this._selectSnapShot.append(this._optGroupFile);
        this._optGroupDb.children().remove();
        this._selectSnapShot.append(this._optGroupDb);
        // Duplicate selector
        this._selectDuplicate = this._formDuplicate.find('select.duplicate-project');
        this._optGroupDuplicate = this._selectDuplicate.find('optgroup.project-id');
        this._optGroupDuplicate.children().remove();
        this._selectDuplicate.append(this._optGroupDuplicate);

        // Tab toggling
        this._dialog.find('li.tab').on('click', function () {
            var tabEl = $(this);
            self._formSnapShot.removeClass('active');
            self._formDuplicate.removeClass('active');
            self._formBlob.removeClass('active');
            self._btnCreateSnapShot.removeClass('active');
            self._btnDuplicate.removeClass('active');
            self._btnCreateBlob.removeClass('active');

            if (tabEl.hasClass('snap-shot')) {
                self._formSnapShot.addClass('active');
                self._btnCreateSnapShot.addClass('active');
            } else if (tabEl.hasClass('duplicate')) {
                self._formDuplicate.addClass('active');
                self._btnDuplicate.addClass('active');
            } else if (tabEl.hasClass('blob')) {
                self._formBlob.addClass('active');
                self._btnCreateBlob.addClass('active');
            } else {
                return;
            }
        });

        this._loader = new LoaderCircles({containerElement: this._dialog});

        this._btnCancel = this._dialog.find('.btn-cancel');

        this._dialog.find('.toggle-info-btn').on('click', function (event) {
            var el = $(this),
                infoEl;
            event.preventDefault();
            event.stopPropagation();

            if (el.hasClass('snap-shot-info')) {
                infoEl = self._dialog.find('span.snap-shot-info');
            } else if (el.hasClass('duplicate-info')) {
                infoEl = self._dialog.find('span.duplicate-info');
            } else if (el.hasClass('blob-info')) {
                infoEl = self._dialog.find('span.blob-info');
            } else {
                return;
            }

            if (infoEl.hasClass('hidden')) {
                infoEl.removeClass('hidden');
            } else {
                infoEl.addClass('hidden');
            }
        });
        // attach handlers
        this._btnCreateSnapShot.on('click', function (event) {
            event.preventDefault();
            event.stopPropagation();

            self._dialog.modal('hide');

            if (self._fnCallback) {
                self._logger.debug(self._selectSnapShot.val());
                self.seedProjectType = self._selectSnapShot.val().slice(0, self._selectSnapShot.val().indexOf(':'));
                self.seedProjectName = self._selectSnapShot.val().slice(self._selectSnapShot.val().indexOf(':') + 1);

                if (self.seedProjectType === 'db') {
                    self.seedProjectName = self._selectSnapShot.val().slice(self._selectSnapShot.val().indexOf(':') + 1,
                        self._selectSnapShot.val().indexOf('#'));
                    self.seedCommitHash = self._selectSnapShot.val().slice(self._selectSnapShot.val().indexOf('#'));
                }

                self._fnCallback(self.seedProjectType,
                    self.seedProjectName,
                    self.seedProjectBranch,
                    self.seedCommitHash);
            }
        });

        this._btnCreateBlob.on('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            self._dialog.modal('hide');
            if (self._fnCallback && self.assetWidget.propertyValue) {
                self._fnCallback('blob',
                    self.assetWidget.propertyValue,
                    null,
                    null);
            }
        });

        this._btnCreateBlob.disable(true);

        this.assetWidget.onFinishChange(function (data) {
            self._btnCreateBlob.disable(true);

            if (data.newValue) {
                self.blobClient.getMetadata(data.newValue, function (err, metadata) {
                    if (err) {
                        self._logger.error(err);
                        return;
                    }

                    // TODO: Support exported zip file too.
                    if (metadata.mime === 'application/json') {
                        self._btnCreateBlob.disable(false);
                    } else {
                        //TODO: Better feedback here.
                        alert('Uploaded file must be a json file (from Export branch)');
                    }
                });
            }
        });

        this._btnDuplicate.on('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            self._logger.debug('Duplicate not yet supported', self._selectDuplicate.val);
            //self._dialog.modal('hide');
            //if (self._fnCallback) {
            //    self._fnCallback('duplicate',
            //        self.assetWidget.propertyValue,
            //        null,
            //        null);
            //}
        });

        // get seed project list
        self._loader.start();
        self._client.getProjects({branches: true}, function (err, projectList) {
            var projectId,
                displayedProjectName,
                branchId,
                projectGroup,
                i,
                defaultOption,
                fileSeeds = WebGMEGlobal.allSeeds || [];

            for (i = 0; i < fileSeeds.length; i += 1) {
                self._optGroupFile.append($('<option>', {text: fileSeeds[i], value: 'file:' + fileSeeds[i]}));
                if (self.seedProjectName === fileSeeds[i]) {
                    defaultOption = 'file:' + fileSeeds[i];
                }
            }

            if (err) {
                self.logger.error(err);
                self._loader.stop();
                return;
            }

            for (i = 0; i < projectList.length; i += 1) {
                projectId = projectList[i]._id;
                displayedProjectName = StorageUtil.getProjectDisplayedNameFromProjectId(projectId);
                self._optGroupDuplicate.append($('<option>', {
                        text: displayedProjectName,
                        value: projectId
                    }
                ));

                if (Object.keys(projectList[i].branches).length === 1) {
                    branchId = Object.keys(projectList[i].branches)[0];
                    self._optGroupDb.append($('<option>', {
                            text: displayedProjectName + ' (' + branchId + ' ' +
                            projectList[i].branches[branchId].slice(0, 8) + ')',
                            value: 'db:' + projectId + projectList[i].branches[branchId]
                        }
                    ));
                    if (!defaultOption && self.seedProjectName === projectId) { //File seed has precedence.
                        defaultOption = 'db:' + projectId + projectList[i].branches[branchId];
                    }
                } else {
                    // more than one branches
                    projectGroup = $('<optgroup>', {
                            label: displayedProjectName
                        }
                    );
                    self._selectSnapShot.append(projectGroup);

                    for (branchId in projectList[i].branches) {
                        if (projectList[i].branches.hasOwnProperty(branchId)) {
                            projectGroup.append($('<option>', {
                                    text: displayedProjectName + ' (' + branchId + ' ' +
                                    projectList[i].branches[branchId].slice(0, 8) + ')',
                                    value: 'db:' + projectId +
                                    projectList[i].branches[branchId]
                                }
                            ));
                        }
                    }

                    if (projectList[i].branches.hasOwnProperty('master')) {
                        branchId = 'master';
                    } else {
                        branchId = Object.keys(projectList[i].branches)[0];
                    }

                    if (!defaultOption && self.seedProjectName === projectId) { //File seed has precedence.
                        defaultOption = 'db:' + projectId + branchId;
                    }
                }

            }

            if (defaultOption) {
                self._selectSnapShot.val(defaultOption);
            }
            self._loader.stop();
        });

    };

    CreateFromSeed.prototype._displayMessage = function (msg, isError) {
        this._importErrorLabel.removeClass('alert-success').removeClass('alert-danger');

        if (isError === true) {
            this._importErrorLabel.addClass('alert-danger');
        } else {
            this._importErrorLabel.addClass('alert-success');
        }

        this._importErrorLabel.html(msg);
        this._importErrorLabel.hide();
        this._importErrorLabel.fadeIn();
    };

    return CreateFromSeed;
});