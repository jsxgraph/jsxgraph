// var mode = {
//     status: false,
//     params: [],
//     end: true
// };

// Registers the @attribute and @pseudo tag in JSDoc
exports.defineTags = function (dictionary) {
    dictionary.defineTag("pseudo", {
        mustNotHaveValue: true,
        onTagged: function (doclet, tag) {
            doclet.isPseudo = true;
        }
    });

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

    // // Test parsing of signatures
    // dictionary.defineTag("signature", {
    //     mustHaveValue: true,
    //     onTagged: function (doclet, tag) {
    //         mode.status = !mode.status;

    //     //     doclet.comment = '';
    //     //     if (mode.status === true) {
    //     //     } else if (mode.status === false) {
    //     //         // console.log("\nSignature toggled:", mode, "\n")
    //     //         mode.params.push(doclet.params.slice());
    //     //     }
    //         console.log("\nSignature toggled:", tag)
    //     }
    // });

    // dictionary.defineTag("endsignature", {
    //     onTagged: function (doclet, tag) {
    //         mode.end = !mode.end;
    //         // if (mode.end) {
    //         //     mode.status = false;
    //         //     mode.params.push(doclet.params.slice());
    //         // }
    //         console.log("endsignatures", doclet)
    //     }
    // });

};

// Plugin Hooks for JSDoc
exports.handlers = {
    // newDoclet: function (e) {
    //     // var d = e.doclet;
    //     // // console.log(d)
    //     // if (d.kind === 'class') {
    //     //     // console.log(d)
    //     // }
    // },

    // symbolFound(e) {
    //     // console.log('>', e)
    // },

    // // Called after all doclets have been created
    // processingComplete(e) {
    //     const doclets = e.doclets || [];

    //     for (let i = 0; i < doclets.length; i++) {
    //         if (!doclets[i].isAttribute && doclets[i].memberof && doclets[i].inherits === undefined
    //             // && doclets[i].memberof.indexOf('Line') >= 0
    //         ) {
    //             // console.log(doclets[i].memberof, '\t', doclets[i].name, '\t', doclets[i].isAttribute, doclets[i].inherits)
    //             //doclets[i].longname, doclets[i].isAttribute)
    //         }
    //     }
    // }
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