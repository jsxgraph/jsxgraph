Using the JSXGraph filter makes it a lot easier to embed JSXGraph constructions into moodle online documents.

Caution:
The current version has to be regarded as a pre alpha development version. Use with caution!

Installation: (by Moodle Admin)
1. Upload the complete folder "jsxgraph" into the folder  moodle-->filter
2. In Moodle, navigate to Moodle->Administration->Configuration->"Filter" and click on the entry
   "jsxgraph" to activate the filter

Usage:
1. In a Moodle course: -> Add a resource -> Compose a website
2. Write content. At the position the construction should appear, create a construction by:
	* switching to the code input, i.e. to "HTML source editor"
	* inserting a <jsxgraph>-tag with all required parameters
    * Example: 
        <jsxgraph width="600" height="500">
            (function() {
                var brd = JXG.JSXGraph.initBoard('box0', {boundingbox:[-5,5,5,-5], axis:true});
                var p = brd.create('point', [1,2]);
            })();
        </jsxgraph>

        <jsxgraph width="600" height="500" box="mybox">
            (function() {
                var brd = JXG.JSXGraph.initBoard('mybox', {boundingbox:[-5,5,5,-5], axis:true});
                var p = brd.create('point', [1,2]);
            })();
        </jsxgraph>
 
Be aware of the fact, that you dont't see the construction unless you leave the editor and save your document.
On reopening it later, you will notice the code rather than the jsxgraph-tag.

Using JSXGraph in quiz questions needs a workaround since the HTML editor strips off the JSXGraph tag.
Here, the wy to go is:
The workaround is:
* turn off the HTML-editor in your profile: 
  ("When editing text" -> "Use standard web forms" instead of "Use HTML editor")
* When editing a question, insert the jsxgraph tag and choose "HTML format".

