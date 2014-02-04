"use strict";

define(['js/Utils/GMEConcepts',
    'js/DragDrop/DragHelper',
    'js/NodePropertyNames',
    './../ManualAspect/ManualAspectConstants',
    'js/Panels/ControllerBase/DiagramDesignerWidgetMultiTabMemberListControllerBase'], function (
                                               GMEConcepts,
                                               DragHelper,
                                               nodePropertyNames,
                                               ManualAspectConstants,
                                               DiagramDesignerWidgetMultiTabMemberListControllerBase) {

    var PointerListEditorController;

    PointerListEditorController = function (options) {
        options = options || {};
        options.loggerName = "PointerListEditorController";

        DiagramDesignerWidgetMultiTabMemberListControllerBase.call(this, options);

        this.logger.debug("PointerListEditorController ctor finished");
    };

    _.extend(PointerListEditorController.prototype, DiagramDesignerWidgetMultiTabMemberListControllerBase.prototype);

    PointerListEditorController.prototype.getOrderedMemberListInfo = function (memberListContainerObject) {
        var result = [],
            setNames = memberListContainerObject.getSetNames() || [],
            manualAspectsRegistry = memberListContainerObject.getRegistry(ManualAspectConstants.MANUAL_ASPECTS_REGISTRY_KEY) || [],
            manualAspectSetNames = [],
            len;

        //filter out ManualAspects from the list
        _.each(manualAspectsRegistry, function (element/*, index, list*/) {
            manualAspectSetNames.push(element.SetID);
        });

        setNames = _.difference(setNames, manualAspectSetNames);

        len = setNames.length;
        while (len--) {
            result.push({'memberListID': setNames[len],
                'title': setNames[len],
                'enableDeleteTab': false,
                'enableRenameTab': false});
        }

        result.sort(function (a,b) {
            if (a.title.toLowerCase() < b.title.toLowerCase()) {
                return -1;
            } else {
                return 1;
            }
        });

        return result;
    };


    /**********************************************************/
    /*         HANDLE OBJECT DRAG & DROP ACCEPTANCE           */
    /**********************************************************/
    PointerListEditorController.prototype._onBackgroundDroppableAccept = function(event, dragInfo) {
        var gmeIDList = DragHelper.getDragItems(dragInfo),
            accept = DiagramDesignerWidgetMultiTabMemberListControllerBase.prototype._onBackgroundDroppableAccept.call(this, event, dragInfo);

        if (accept === true) {
            //if based on the DiagramDesignerWidgetMultiTabMemberListControllerBase check it could be accepted, ie items are not members of the set so far
            //we need to see if we can accept them based on the META rules
            accept = GMEConcepts.canAddToPointerList(this._memberListContainerID, this._selectedMemberListID, gmeIDList);
        }

        return accept;
    };
    /**********************************************************/
    /*  END OF --- HANDLE OBJECT DRAG & DROP ACCEPTANCE       */
    /**********************************************************/

    /*
     * Overwrite 'no tab' warning message to the user
     */
    PointerListEditorController.prototype.displayNoTabMessage = function () {
        var setContainerObj = this._client.getNode(this._memberListContainerID),
            msg = 'The currently selected object does not contain any pointer lists.';

        if (setContainerObj) {
            var name = setContainerObj.getAttribute(nodePropertyNames.Attributes.name);
            if (name && name !== "") {
                msg = name + ' does not contain any pointer lists. You can define one in the Meta Aspect.';
            }
        }

        this._widget.setBackgroundText(msg);
    };

    return PointerListEditorController;
});