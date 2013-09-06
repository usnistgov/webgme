/*
 * Copyright (C) 2013 Vanderbilt University, All rights reserved.
 *
 * Author: Tamas Kecskes
 */

define([], function () {
    "use strict";

    var DESCR_ID = "_desc";

    function descriptorCore (_innerCore) {

        var _core = {};
        for(var i in _innerCore){
            _core[i] = _innerCore[i]
        }

        //extra functions
        _core.getAttributeDescriptor = function(node,attributename){
            var descriptors = _innerCore.getChild(node,DESCR_ID);
            var descriptor = _innerCore.getChild(descriptors,"a_"+attributename);
            return _innerCore.getRegistry(descriptor,'descriptor') || {};
        };
        _core.setAttributeDescriptor = function(node,attributename,descobject){
            var descriptors = _innerCore.getChild(node,DESCR_ID);
            var descriptor = _innerCore.getChild(descriptors,"a_"+attributename);
            _innerCore.setRegistry(descriptor,'descriptor',descobject);
        };

        _core.getPointerDescriptor = function(node,pointername){
            var descriptors = _innerCore.getChild(node,DESCR_ID);
            var descriptor = _innerCore.getChild(descriptors,"p_"+pointername);
            return _innerCore.getRegistry(descriptor,'descriptor') || {};
        };
        _core.setPointerDescriptor = function(node,pointername,descobject){
            var descriptors = _innerCore.getChild(node,DESCR_ID);
            var descriptor = _innerCore.getChild(descriptors,"p_"+pointername);
            _innerCore.setRegistry(descriptor,'descriptor',descobject);
        };


        _core.getNodeDescriptor = function(node){
            var descriptors = _innerCore.getChild(node,DESCR_ID);
            var descriptor = _innerCore.getChild(descriptors,"n_");
            return _innerCore.getRegistry(descriptor,'descriptor') || {};
        };
        _core.setNodeDescriptor = function(node,descobject){
            var descriptors = _innerCore.getChild(node,DESCR_ID);
            var descriptor = _innerCore.getChild(descriptors,"n_");
            _innerCore.setRegistry(descriptor,'descriptor',descobject);
        };


        return _core;
    }

    return descriptorCore;
});
