Using the JSXGraph filter makes it a lot easier to embed JSXGraph constructions into moodle online documents.

Caution:
The current version has to be regarded as a pre alpha development version. Use with caution!

Installation: (by Moodle Admin)
1. Upload the complete folder "jsxgraph" into the folder  moodle-->filter
2. In Moodle, navigate to 
    * Moodle->Administration->Configuration->"Filter" for moodle < 2.0 and click on the entry "jsxgraph" to activate the filter
    * Moodle->Administration->Plugins->"Filter" for moodle >= 2.0 and change "Disabled" to "On" to activate the filter
   

Usage:
1. In a Moodle course: -> Add a resource -> Compose a website
2. Write content. At the position the construction should appear, create a construction by:
	* switching to the code input
	* inserting a <jsxgraph>-tag with all required parameters

Be aware of the fact, that you dont't see the construction unless you leave the editor and save your document.
On reopening it later, you will notice the code rather than the jsxgraph-tag.
