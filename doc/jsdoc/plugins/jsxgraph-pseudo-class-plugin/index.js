
// const STATE = {
//     isAttribute: false
// };

// Registers the @signature tag in JSDoc
exports.defineTags = function (dictionary) {
    dictionary.defineTag("pseudo", {
        mustNotHaveValue: true,
        onTagged: function (doclet, tag) {
            doclet.isPseudo = true;
        }
    });

    dictionary.defineTag("visprop", {
        mustNotHaveValue: true,
        onTagged: function (doclet, tag) {
            // STATE.isAttribute = true;
            // console.log(doclet, tag)
        }
    });
    dictionary.defineTag("attribute", {
        mustNoteHaveValue: true,
        onTagged: function (doclet, tag) {
            // STATE.isAttribute = true;
            // doclet.isAttribute = true;
            doclet.kind = "attribute";
            // console.log(doclet)
        }
    });
};

// Plugin Hooks for JSDoc
exports.handlers = {
    newDoclet: function (e) {
        // e.doclet.isAttribute = STATE.isAttribute;
    },

    symbolFound(e) {
        // console.log('>', e)
    },

    // Called after all doclets have been created
    processingComplete(e) {
        const doclets = e.doclets || [];

        for (let i = 0; i < doclets.length; i++) {
            if (!doclets[i].isAttribute && doclets[i].memberof && doclets[i].inherits === undefined
                // && doclets[i].memberof.indexOf('Line') >= 0
            ) {
                // console.log(doclets[i].memberof, '\t', doclets[i].name, '\t', doclets[i].isAttribute, doclets[i].inherits)
                //doclets[i].longname, doclets[i].isAttribute)
            }
        }
    }
};

/*
JSDOC.PluginManager.registerPlugin(
    "JSDOC.jsxPseudoClass",
    {
        onSymbol: function(classCreator) {
            // Interpret elements
            classCreator.isPseudo = false;
            if(classCreator.comment.toString().indexOf("@pseudo") != -1) {
                classCreator.isPseudo = true;
            }

            // Interpret elements
            classCreator.isAttribute = false;
            if(classCreator.comment.toString().indexOf("@visprop") != -1) {
                classCreator.isAttribute = true;
            }

            // Ignore symbols with neither a description nor a class description
            if((classCreator.desc.toString() == "") && (classCreator.classDesc.toString() == "") && !JSDOC.opt.p) {
                classCreator.isIgnored = true;
            }

        }
    }
);
*/