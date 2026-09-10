var signatur_counter = 0;

// Removes leading JSDoc stars (*) and trims whitespace
function cleanLine(line) {
  return String(line || "")
    .replace(/^\s*\*\s?/, "")
    .trim();
}

// Parses @signature blocks from a JSDoc comment
function parseSignatureBlocks(comment) {
  const blocks = [];   // all found signature blocks
  let current = null;  // currently active signature block

  // Split comment into individual, cleaned-up lines
  const lines = String(comment || "")
    .split("\n")
    .map(cleanLine);

  for (const line of lines) {
    // Start of a new signature block
    const sig = line.match(/^@signature\s+(.+)$/);
    if (sig) {
      current = {
        signature: sig[1], // signatur text
        description: '',   // free text
        params: [],        // related @param
        returns: []        // related @returns
      };
      blocks.push(current);
      continue;
    }

    // If no signature block is active yet, do nothing
    if (!current) continue;

    // Assign @param line to the current signature block
    const p = line.match(/^@param\s+\{([^}]+)\}\s+(\S+)(?:\s+(.+))?/);
    if (p) {
      current.params.push({
        type: p[1],
        name: p[2],
        description: p[3] || ""
      });
      continue;
    }

    if (!line.match(/^@/)) {
      current.description += ' ' + line;
    }

    // Assign the @return/@returns line to the current signature block
    const r = line.match(/^@(return|returns)\s+\{([^}]+)\}(?:\s+(.+))?/);
    if (r) {
      current.returns.push({
        type: r[2],
        description: r[3] || ""
      });
    }

    // After the first tag different from @signature and @param
    // stop the signature block
    if (line.match(/^@(?!signature|param)\w+(?=\s|$)/)) {
      break;
    }

  }

  return blocks;
}

// Checks whether two doclets come from the same file
function sameFile(a, b) {
  return (
    a?.meta?.filename &&
    b?.meta?.filename &&
    a.meta.filename === b.meta.filename &&
    a.meta.path === b.meta.path
  );
}

// Registers the @jsxgraphsignature tag in JSDoc
exports.defineTags = function (dictionary) {
  // dictionary.defineTag("signature", { mustHaveValue: true });
  dictionary.defineTag("jsxgraphsignature", { 
    // mustHaveValue: true,
    // mustNotHaveValue: true,
    onTagged: function (doclet, tag) {
      doclet.kind = "jsxgraphsignature";
      doclet.description = tag.text;

      // Make signature names unique 
      doclet.name += "_" + signatur_counter++;

      // doclet.name = tag.text;
      // console.log(doclet)
      // console.log(tag)
    }
  });
};

// Plugin Hooks for JSDoc
exports.handlers = {

  // Called as soon as a doclet has been created
  newDoclet(e) {
    const d = e.doclet;
/*
    // Extract signature blocks from the comment
    const blocks = parseSignatureBlocks(d.comment || "");

    // If signatures are present, save them in the doclet
    if (blocks.length) {
      d.signatureBlocks = blocks;
    }
*/      
  },

/*  
  // Called after all doclets have been created
  processingComplete(e) {
    const doclets = e.doclets || [];

    // Determine all class doclets
    const classes = doclets.filter(d => d.kind === "class");

    classes.forEach(cls => {
      // If the class already has signatures, do nothing
      if (cls.signatureBlocks?.length) return;

      // Search for matching constructor doclet
      const ctor = doclets.find(d =>
        d.signatureBlocks?.length &&
        sameFile(d, cls) &&
        (
          d.name === "constructor" ||
          d.longname?.endsWith("#constructor")
        )
      );

      // Copy signatures from the constructor to the class
      if (ctor) {
        cls.signatureBlocks = ctor.signatureBlocks;
      }
    });
  }
*/    
};
