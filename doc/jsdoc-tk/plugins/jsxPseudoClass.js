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
            classCreator.isSubelement = false;
            if(classCreator.comment.toString().indexOf("@subelement") != -1) {
                classCreator.isSubelement = true;
            }

            // Ignore symbols with neither a description nor a class description
            if((classCreator.desc.toString() == "") && (classCreator.classDesc.toString() == "") && !JSDOC.opt.p) {
            	classCreator.isIgnored = true;
            }
            
//            if(JSDOC.opt.p) {
//            	@private stuff flag is set
//            	but do nothing yet
//				this is to get back the overwritten visProp entities if the -p
//              flag is set. maybe we need this. 
//            }
		}
	}
);
