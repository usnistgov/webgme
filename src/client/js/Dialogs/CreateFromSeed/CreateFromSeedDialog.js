/*globals define, $, WebGMEGlobal*/
/*jshint browser: true*/
/**
 * @author lattmann / https://github.com/lattmann
 */

define(['js/Loader/LoaderCircles',
    'common/storage/util',
    'js/Controls/PropertyGrid/Widgets/AssetWidget',
    'text!./templates/CreateFromSeed.html',

    'css!./styles/CreateProjectDialog.css'
], function (LoaderCircles, StorageUtil, AssetWidget, createFromSeedDialogTemplate) {

    'use strict';

    var CreateFromSeed;

    CreateFromSeed = function (client, newProjectId, logger) {
        this._client = client;
        this._logger = logger;

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
        var self = this,
            blobEl;

        this._dialog = $(createFromSeedDialogTemplate);
        blobEl = this._dialog.find('.selection-blob');
        this._btnCreateBlob = $('<button class="btn btn-default btn-create btn-create-blob pull-left">GO</button>');
        blobEl.append(this.assetWidget.el);
        blobEl.append(this._btnCreateBlob);

        this._btnCreateSnapShot = this._dialog.find('.btn-create-snap-shot');
        this._btnCancel = this._dialog.find('.btn-cancel');

        this._btnDuplicate = this._dialog.find('.btn-duplicate');

        this._option = this._dialog.find('select.seed-project');
        this._optGroupFile = this._dialog.find('optgroup.file');
        this._optGroupDb = this._dialog.find('optgroup.db');

        this._option.children().remove();

        this._optGroupFile.children().remove();
        this._option.append(this._optGroupFile);
        this._optGroupDb.children().remove();
        this._option.append(this._optGroupDb);

        this._loader = new LoaderCircles({containerElement: this._dialog});

        this._btnToggleInfo = this._dialog.find('.toggle-info-btn').on('click', function (event) {
            var el = $(this),
                infoEl;

            if (el.hasClass('snap-shot-info')) {
                infoEl = self._dialog.find('span.snap-shot-info');
            }

            if (infoEl.hasClass('hidden')) {
                infoEl.removeClass('hidden');
            } else {
                infoEl.addClass('hidden');
            }

            event.preventDefault();
            event.stopPropagation();

        });
        // attach handlers
        this._btnCreateSnapShot.on('click', function (event) {
            event.preventDefault();
            event.stopPropagation();

            self._dialog.modal('hide');

            if (self._fnCallback) {
                self._logger.debug(self._option.val());
                self.seedProjectType = self._option.val().slice(0, self._option.val().indexOf(':'));
                self.seedProjectName = self._option.val().slice(self._option.val().indexOf(':') + 1);

                if (self.seedProjectType === 'db') {
                    self.seedProjectName = self._option.val().slice(self._option.val().indexOf(':') + 1,
                        self._option.val().indexOf('#'));
                    self.seedCommitHash = self._option.val().slice(self._option.val().indexOf('#'));
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

        this._btnDuplicate.on('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            self._dialog.modal('hide');
            if (self._fnCallback) {
                self._fnCallback('duplicate',
                    self.assetWidget.propertyValue,
                    null,
                    null);
            }
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
                    self._option.append(projectGroup);

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
                self._option.val(defaultOption);
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