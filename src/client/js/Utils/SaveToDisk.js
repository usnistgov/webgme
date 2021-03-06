/*globals define*/
/*jshint node: true, browser: true, bitwise: false*/

/**
 * @author kecso / https://github.com/kecso
 */
define(['blob/BlobClient'], function (BlobClient) {
    'use strict';

    function saveJsonToDisk(fileName, data, callback) {
        saveJsonToBlobStorage(fileName, data, function (err, downloadUrl) {
            if (err) {
                return callback(err);
            }

            saveUrlToDisk(downloadUrl, fileName);
            callback(null);
        });
    }

    function saveUrlToDisk(fileURL, fileName) {
        // for non-IE
        if (!window.ActiveXObject) {
            var save = document.createElement('a'),
                event = document.createEvent('Event');

            save.href = fileURL;
            save.target = '_self';

            if(fileName){
                save.download = fileName;
            }

            event.initEvent('click', true, true);
            save.dispatchEvent(event);
            (window.URL || window.webkitURL).revokeObjectURL(save.href);
        }

        // for IE
        else if (!!window.ActiveXObject && document.execCommand) {
            var _window = window.open(fileURL, '_self');
            _window.document.close();
            _window.document.execCommand('SaveAs', true, fileName || fileURL)
            _window.close();
        }
    }

    function saveJsonToBlobStorage(fileName, data, callback) {
        var bc = new BlobClient(),
            artifact = bc.createArtifact('uploaded');

        artifact.addFile(fileName, JSON.stringify(data, null, 4), function (err, fileHash) {
            callback(err, bc.getDownloadURL(fileHash));
        });
    }


    return {
        saveToBlobStorage: saveJsonToBlobStorage,
        saveUrlToDisk: saveUrlToDisk,
        saveJsonToDisk: saveJsonToDisk
    };
});