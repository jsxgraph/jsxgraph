var signatur_counter = 0;

// Registers the @jsxgraphsignature tag in JSDoc
exports.defineTags = function (dictionary) {
  dictionary.defineTag("jsxgraphsignature", {
    mustHaveValue: true,
    // mustNotHaveValue: true,
    onTagged: function (doclet, tag) {
      doclet.kind = "jsxgraphsignature";

      doclet.description = tag.text;
      let lines = tag.text.split("\n");   // split all lines into array
      doclet.memberof = lines.shift();    // first line is text in line jsxgraphsignature
      doclet.description = lines.join("\n");

      // Make signature names unique
      doclet.name += "_" + signatur_counter++;
      doclet.scope = "instance";
    }
  });
};

// Plugin Hooks for JSDoc
exports.handlers = {
  // // Called as soon as a doclet has been created
  // newDoclet(e) {
  //   const d = e.doclet;
  //   if (d.kind === 'typedef') {
  //     console.log(d)
  //   }
  // }
};
