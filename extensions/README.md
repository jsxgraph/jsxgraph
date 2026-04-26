# JSXGraph Extensions

You can easily extend JSXGraph on your own with new elements. In this folder are
examples on how to do this.

Please note that the examples given in this directory currently can only be used
when JSXGraph is loaded as a requirejs module. This means these extensions can
not be used with jsxgraphcore.js at the moment.

## Create your own extension

To write your own element define a function that takes three arguments:

    board

A reference to the board the element will be created on. This can be used to
add all subelements.

    parents

This is an array that holds all required depdendencies of your element.

    attributes

An attributes object that contains all visual properties of your element and
all subelements.

Use `JXG.registerElement()` to let JSXGraph know about your new element and
to make it available through our `JXG.Board.create()` interface:

    JXG.registerElement(elementName, creatorFunction);

where `elementName` is the name of your new element and `creatorFunction`
references the function mentioned above.

Now you can create instances of your element with

    var board = JXG.JSXGraph.initBoard(...);
    board.create(elementName, [parent1, parent2], {strokeColor: 'red'});

## Change the default appearance

If you want to change the default appearance of your element's subelements, e.g.
if you create a new triangle element that should have a nice red filling and
green lines as borders do not change the defaults of `JXG.Options.line` and
`JXG.Options.polygon`. Instead, introduce a new branch

    JXG.Options.triangle = {
        lines: {
        	strokeColor: 'green'
        },
        fillColor: 'red'
    };

Before you create your subelements merge the attributes using
`JXG.copyAttributes`:

    lattr = JXG.copyAttributes(attributes, board.options, 'triangle', 'lines');
    board.create('line', [point1, point2], lattr);
