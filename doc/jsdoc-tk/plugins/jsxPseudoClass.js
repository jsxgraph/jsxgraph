JSDOC.PluginManager.registerPlugin(
	"JSDOC.jsxPseudoClass",
	{
		onSymbol: function(classCreator) {
            classCreator.isPseudo = false;
            if(classCreator.comment.toString().indexOf("@pseudo") != -1) {
                classCreator.isPseudo = true;
            }
		}
	}
);
