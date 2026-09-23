// Registers the @attribute and @pseudo tag in JSDoc
exports.defineTags = function (dictionary) {

    dictionary.defineTag("pseudo", {
        mustNotHaveValue: true,
        onTagged: function (doclet, tag) {
            doclet.isPseudo = true;
        }
    });

    // Unused, could be removed in options.js and options3d.js
    // dictionary.defineTag("visprop", {
    //     mustNotHaveValue: true,
    //     onTagged: function (doclet, tag) {
    //         // console.log(doclet, tag)
    //     }
    // });

    dictionary.defineTag("attribute", {
        mustNotHaveValue: true,
        onTagged: function (doclet, tag) {
            doclet.kind = "attribute";
        }
    });

    dictionary.defineTag("elementclass", {
        mustHaveValue: true,
        onTagged: function (doclet, tag) {
            // console.log(tag)
            doclet.elementclass = tag.text;
        }
    });

};

// Plugin Hooks for JSDoc
exports.handlers = {
    newDoclet: function (e) {
        var d = e.doclet;
        // console.log(d)
        // if (d.kind === 'class') {
        //     // console.log(d)
        // }
    }
};
