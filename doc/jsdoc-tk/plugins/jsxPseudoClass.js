JSDOC.PluginManager.registerPlugin(
	"JSDOC.jsxPseudoClass",
	{
		onSymbol: function(classCreator) {
//                print(":" + classCreator.name + ": -> :" + classCreator._name + ":");

            classCreator.isPseudo = false;
            if(classCreator.comment.toString().indexOf("@pseudo") != -1) {
                classCreator.isPseudo = true;
                classCreator.parents = [];
print("PARAMS");
for(var p in classCreator._params)
    print(p + " -> " + classCreator._params[p]);
print("ARGS");
for(var p in classCreator.params[0])
    print(p + " -> " + classCreator.params[0][p]);
print("ALL");
for(var p in classCreator)
    print(p + " -> " + classCreator[p]);
            }
		}
/*
        onDocCommentTags: function(comment) {
            for (var i = 0, l = comment.tags.length; i < l; i++) {
                var title = comment.tags[i].title.toLowerCase();
                var syn;
                if ((syn = JSDOC.tagSynonyms.synonyms["="+title])) {
                    comment.tags[i].title = syn;
                }
            }
        }
*/
	}
);
