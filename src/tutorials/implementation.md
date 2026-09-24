To integrate JSXGraph {{ const.version }} into your HTML project, include the following files:

- [jsxgraphcore.js](https://jsxgraph.org/distrib/jsxgraphcore.js)
- [jsxgraph.css](https://jsxgraph.org/distrib/jsxgraph.css)

You can download JSXGraph from
[jsDelivr](https://www.jsdelivr.com/package/npm/jsxgraph),
[cdnjs](https://cdnjs.com/libraries/jsxgraph),
[Node.js (npm)](https://www.npmjs.com/package/jsxgraph), or
the JSXGraph server hosted at the University of Bayreuth.

### Step Into JSXGraph

You can work with JSXGraph either directly in a web browser using online resources, or offline by downloading the required files on your local
machine.

We recommend using a modern code editor to write and test your HTML file with the JSXGraph code efficiently.

#### JSXGraph Hosted Via CDN

The preferred way is to include JSXGraph online from one of the CDNs (Content Delivery Network).
Add the following lines into the HTML document head:

```html
<script src="https://cdn.jsdelivr.net/npm/jsxgraph/distrib/jsxgraphcore.js"></script>
<link rel="stylesheet" type="text/css"
      href="https://cdn.jsdelivr.net/npm/jsxgraph/distrib/jsxgraph.css">
```

##### HTML Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My JSXGraph Example</title>
    <script src="https://cdn.jsdelivr.net/npm/jsxgraph/distrib/jsxgraphcore.js"></script>
    <link rel="stylesheet" type="text/css"
          href="https://cdn.jsdelivr.net/npm/jsxgraph/distrib/jsxgraph.css">
</head>
<body>
    ...
</body>
</html>
```

<br>

#### JSXGraph Locally Hosted

If you want to include a local copy of JSXGraph in your HTML file, download the following files and save them in the same folder as your HTML file:

- <https://jsxgraph.org/distrib/jsxgraphcore.js>
- <https://jsxgraph.org/distrib/jsxgraph.css>

and add the following lines into the document head:

```html
<script src="jsxgraphcore.js"></script>
<link rel="stylesheet" type="text/css" href="jsxgraph.css">
```

##### HTML Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My JSXGraph Example</title>
    <script src="jsxgraphcore.js"></script>
    <link rel="stylesheet" type="text/css" href="jsxgraph.css">
</head>
<body>
    ...
</body>
</html>
```

#### Step 2 – Integrate JSXGraph Board

The construction which is displayed by JSXGraph resides in an HTML element. Usually, a div-element is taken.
This division needs an ID. Using this ID, we declare this element to be a board of JSXGraph.

The following code has to be placed into the body part of an HTML file:

```html
<div id="box" class="jxgbox" style="width:500px; aspect-ratio: 1/1;"></div>
<script>
    var board = JXG.JSXGraph.initBoard(
            'box', {
                boundingbox: [-10, 10, 10, -10],
                axis: true
            });
</script>
```

##### HTML Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My JSXGraph Example</title>
    <script src="https://cdn.jsdelivr.net/npm/jsxgraph/distrib/jsxgraphcore.js"></script>
    <link rel="stylesheet" type="text/css"
          href="https://cdn.jsdelivr.net/npm/jsxgraph/distrib/jsxgraph.css">
</head>
<body>
    <div id="box" class="jxgbox" style="width:500px; aspect-ratio: 1/1;"></div>
    <script>
        var board = JXG.JSXGraph.initBoard(
                'box', {
                    boundingbox: [-10, 10, 10, -10],
                    axis: true
                });
    </script>
</body>
</html>
```

#### Step 3 – Add JSXGraph Elements

Once the board is initialized, you can add geometric elements such as points, circles, or function graphs.

To create a point in your JSXGraph construction, just add the following line to your code:

```js
var A = board.create('point', [2, 1], {name: 'A'});
```

A function graph can be included by adding:

```js
var f = board.create(
    'functiongraph',
    [(x) => 0.5 * x ** 2 - 2 * x],
    {strokeWidth: 3}
);
```

##### HTML Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My JSXGraph Example</title>
    <script src="https://cdn.jsdelivr.net/npm/jsxgraph/distrib/jsxgraphcore.js"></script>
    <link rel="stylesheet" type="text/css"
          href="https://cdn.jsdelivr.net/npm/jsxgraph/distrib/jsxgraph.css">
</head>
<body>
    <div id="box" class="jxgbox" style="width:500px; aspect-ratio: 1/1;"></div>
    <script>
        var board = JXG.JSXGraph.initBoard(
                'box', {
                    boundingbox: [-10, 10, 10, -10],
                    axis: true
                });
        var A = board.create('point', [2, 1], {name: 'A'});
        var f = board.create(
                'functiongraph',
                [(x) => 0.5 * x ** 2 - 2 * x],
                {strokeWidth: 3}
        );
    </script>
</body>
</html>
```

#### Dependent Elements

The command `board.create(elementType, [parameters], attributes)` is the central method in JSXGraph for adding new elements to a construction.
It takes at least two arguments: a string `elementType` specifying the type of element (e.g., `'point'`, `'circle'`, `'functiongraph'`) and an array
of
parameters the element depends on, optionally followed by an attributes object .

Add two additional points:

```js
var B = board.create('point', [-4, 5], {name: 'B'});
var C = board.create('point', [-6, -5], {name: 'C'});
```

The three points define the vertices of a triangle, which can then be created using these points as parameters:

```js
var p = board.create('polygon', [A, B, C]);
```

The circumcircle of a triangle can be created as follows:

```js
var c = board.create('circle', [A, B, C]);
```

##### HTML Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My JSXGraph Example</title>
    <script src="https://cdn.jsdelivr.net/npm/jsxgraph/distrib/jsxgraphcore.js"></script>
    <link rel="stylesheet" type="text/css"
          href="https://cdn.jsdelivr.net/npm/jsxgraph/distrib/jsxgraph.css">
</head>
<body>
    <div id="box" class="jxgbox" style="width:500px; aspect-ratio: 1/1;"></div>
    <script>
        var board = JXG.JSXGraph.initBoard(
                'box', {
                    boundingbox: [-10, 10, 10, -10],
                    axis: true
                });
        var A = board.create('point', [2, 1], {name: 'A'});
        var f = board.create(
                'functiongraph',
                [(x) => 0.5 * x ** 2 - 2 * x],
                {strokeWidth: 3}
        );
        var B = board.create('point', [-4, 5], {name: 'B'});
        var C = board.create('point', [-6, -5], {name: 'C'});
        var p = board.create('polygon', [A, B, C]);
        var c = board.create('circle', [A, B, C]);
    </script>
</body>
</html>
```

#### Styling of Elements

The optional attributes object allows you to customize the appearance and behavior of an element, such as its color, size, label, or whether it is
draggable.

##### Attributes

To make a point non-movable, you can set the attribute `fixed`, which prevents users from dragging it on the board:

```js
var A = board.create('point', [2, 1], {name: 'A', fixed: true});
```

The fill color of a polygon can be set using the `fillColor` attribute:

```js
var p = board.create('polygon', [A, B, C], {fillcolor: '#ff0099'});
```

You can customize the stroke of a circle using attributes like `strokeColor`, `strokeWidth` for line thickness and `dash` for dashed or dotted styles:

```js
var c = board.create('circle', [A, B, C], {
    strokeColor: 'orange',
    strokeWidth: 5,
    dash: 3
});
```

###### HTML Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My JSXGraph Example</title>
    <script src="https://cdn.jsdelivr.net/npm/jsxgraph/distrib/jsxgraphcore.js"></script>
    <link rel="stylesheet" type="text/css"
          href="https://cdn.jsdelivr.net/npm/jsxgraph/distrib/jsxgraph.css">
</head>
<body>
    <div id="box" class="jxgbox" style="width:500px; aspect-ratio: 1/1;"></div>
    <script>
        var board = JXG.JSXGraph.initBoard(
                'box', {
                    boundingbox: [-10, 10, 10, -10],
                    axis: true
                });
        var A = board.create('point', [2, 1], {name: 'A', fixed: true});
        var f = board.create(
                'functiongraph',
                [(x) => 0.5 * x ** 2 - 2 * x],
                {strokeWidth: 3}
        );
        var B = board.create('point', [-4, 5], {name: 'B'});
        var C = board.create('point', [-6, -5], {name: 'C'});
        var p = board.create('polygon', [A, B, C], {fillcolor: '#ff0099'});
        var c = board.create('circle', [A, B, C], {
            strokeColor: 'orange',
            strokeWidth: 5,
            dash: 3
        });
    </script>
</body>
</html>
```
