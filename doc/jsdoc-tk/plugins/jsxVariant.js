'use strict';
  
exports.defineTags = function(dictionary) {
    dictionary.defineTag("variant", {
        mustHaveValue: false,
        canHaveType: false,
        canHaveName: false,
        onTagged: function(doclet, tag) {
            doclet.variant = true;
        }
    });
};
