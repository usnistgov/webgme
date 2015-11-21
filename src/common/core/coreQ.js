/*globals define*/
/**
 * @author pmeijer / https://github.com/pmeijer
 */

define(['common/core/core', 'Q'], function (Core, Q) {

    'use strict';
    /**
     * @param {object} storage
     * @param {object} options - contains logging information
     * @extends Core
     * @constructor
     */
    function CoreQ(storage, options) {
        Core.call(this, storage, options);
    }

    CoreQ.prototype = Object.create(Core.prototype);
    CoreQ.prototype.constructor = CoreQ;

    return CoreQ;
});