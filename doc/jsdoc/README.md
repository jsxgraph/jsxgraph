# JSXGraph API Reference

*JSXGraph version 1.13.3, API reference generated 2026-09-26*

[JSXGraph](https://jsxgraph.org) is a cross-platform library for interactive geometry, function
plotting and data visualisation in the web browser. It turns abstract concepts
into graphics that can be dragged, animated and explored — for teaching,
learning, assessment and research alike.

<p style="text-align: center; margin: 1.5rem 0 2rem;">
  <picture>
    <source media="(prefers-color-scheme: dark)"
            srcset="images/jsxgraph-logo_white-text-solid.png">
    <img src="images/jsxgraph-logo_blue-text-solid.png"
         alt="JSXGraph API" width="250">
  </picture>
</p>

It covers Euclidean and projective geometry in 2D and 3D, curve and surface
plotting, vector fields, implicit curves, differential equations, charts and
statistics, and animations. The library is standalone and needs no server-side
processing, renders as SVG or canvas, supports multi-touch, symbolic math and
MathJax, and lets authors enrich constructions with ARIA attributes and
keyboard navigation.

<div id="home-continuity" class="jxgbox" style="width: 300px; height: 300px;"></div>

<script type="module">
    (function () {
        /*@formatter:off*/

JXG.Options.text.useMathJax = true;
JXG.Options.axis.ticks.insertTicks = false;
JXG.Options.axis.ticks.majorHeight = 0;
JXG.Options.axis.ticks.minorHeight = 0;
JXG.Options.axis.ticks.drawLabels = false;
JXG.Options.axis.ticks.insertTicks = false;
JXG.Options.point.showInfobox = false;

var board = JXG.JSXGraph.initBoard('home-continuity', {
    axis: false,
    boundingbox: [-3, 5, 5.5, -2],
    infoboxText: '',
    showCopyright: false,
    showNavigation: false,
    pan: { enabled: false },
    zoom: { enabled: false }
});

// global epsilon
var global_epsilon = 0.00000001;

/*
 * axis
 */

// x-axis
var x_axis = board.create('axis', [[0, 0], [1, 0]],
    {
        label: {
            position: 'rt',
            offset: [-10, -15]
        },
        name: '\\(x\\)',
        straightFirst: false,
        withLabel: true
    });

// highlight D
highlightElement(x_axis, "xaxis", "highlightGrey");

// y-axis
var y_axis = board.create('axis', [[0, 0], [0, 1]],
    {
        label: {
            position: 'lft',
            offset: [-40, -5]
        },
        name: '\\(f(x)\\)',
        straightFirst: false,
        withLabel: true
    });

/*
 * function
 */

// specific point
var specific_point = 0;

// x0 start value for glider (x0;0)
var x0_init = 2;

// function term f
var term_f = function (x) {
    // discontinuous function (polynoms)
    specific_point = 3.25;
    x0_init = 3.25;
    if (x < specific_point) {
        return 0.2 * x * x;
    } else {
        return x - 0.5;
    }
};

// graph of f
var graph_f = board.create('functiongraph', [term_f, 0.25, 4.1], {
    dash: 0,
    layer: 8,
    strokeColor: '#4080aa',
    strokeWidth: 2
});

// piecewise-defined discontinuous function
if (Math.abs(term_f(specific_point - global_epsilon) - term_f(specific_point)) > global_epsilon) {
    // point (specific_point-0;f(specific_point-0))
    var point_specific_point_minus_global_epsilon_fspecific_point_minus_global_epsilon = board.create('point', [specific_point - global_epsilon, term_f(specific_point - global_epsilon)], {
        fillColor: '#ffffff',
        name: '',
        size: 1,
        strokeColor: '#4080aa',
        strokeWidth: 2
    });

    // point (specific_point;f(specific_point))
    var point_specific_point_fspecific_point = board.create('point', [specific_point, term_f(specific_point)], {
        fillColor: '#4080aa',
        name: '',
        size: 1,
        strokeColor: '#4080aa',
        strokeWidth: 2
    });

    // dashed line (specific_point;0) - (specific_point;max(...))
    var line_specific_point_0_specific_point_fmax_specific_point_or_specific_point_minus_0 = board.create('line',[[specific_point,0],[specific_point,Math.max(term_f(specific_point),term_f(specific_point - global_epsilon))]],{
        dash: 1,
        name:'',
        straightFirst: false,
        straightLast: false,
        strokeColor: '#4080aa',
        strokeWidth: 1
    });
}

// highlight function
highlightElement(graph_f, "graph", "highlightDarkBlue");

/*
 * x0 and f(x0)
 */

// coordonate for parallel line to x-axis
var cx = -0.5;

// start x0
var x0_start = 0.5;

// end x0
var x0_end = 4;

// line parallel to x-axis for x0 glider
var line_parallel_x_axis = board.create('line', [[x0_start, cx], [x0_end, cx]], {
    straightFirst: false,
    straightLast: false,
    visible: false
});

// x0 glider (not on x-axis for better visibility)
var glider_x0_0 = board.create('glider', [x0_init, 0, line_parallel_x_axis], {
    fillColor: '#ff00ff',
    label: {
        offset: [-5, -15]
    },
    name: '\\(x_0\\)',
    size: 2,
    strokeColor: '#000000',
    strokeWidth: 1
});

// highlight x0
highlightElement(glider_x0_0, 'x0', 'highlightMagenta');

// point (x0;f(x0))
var point_x0_fx0 = board.create('point', [
    function () {
        return glider_x0_0.X();
    },
    function () {
        return term_f(glider_x0_0.X());
    }], {
    fillColor: '#000000',
    name: '',
    size: 2,
    strokeWidth: 0
});

// point (0;f(x))
var point_0_fx0 = board.create('point', [0,
    function () {
        return term_f(glider_x0_0.X());
    }], {
    fillColor: '#000000',
    name: '',
    size: 2,
    strokeWidth: 0
});

// dashed line (x0;0) - (x0;f(x0))
var line_x0_0_x0_fx0 = board.create('line', [glider_x0_0, point_x0_fx0], {
    dash: 2,
    straightFirst: false,
    straightLast: false,
    strokeColor: '#000000',
    strokeWidth: 1
});

// point (x0;0) on x-axis (refers to glider_x0_0)
var point_x0_0 = board.create('intersection', [x_axis, line_x0_0_x0_fx0], {
    fillColor: '#000000',
    label: {
        offset: [-20, -35]
    },
    name: '',
    size: 1,
    strokeWidth: 0
});

// dashed line (x0;f(x0)) - (0;f(x0))
var line_x0_fx0_0_fx0 = board.create('line', [point_x0_fx0, point_0_fx0], {
    dash: 2,
    straightFirst: false,
    straightLast: false,
    strokeColor: '#000000',
    strokeWidth: 1
});

/*
 * epsilon
 */

// coordonate for parallel line to y-axis
var cx = -1.1;

// point (cx;f(x0))
var point_cx_fx0 = board.create('point', [function () {
    return point_0_fx0.X() + cx;
}, function () {
    return point_0_fx0.Y();
}], {
    fillColor: '#000000',
    label: {
        offset: [-55, 0]
    },
    name: '\\(f(x_0)\\)',
    size: 2,
    strokeWidth: 0
});

// point (cx,f(x0)+1)
var point_cx_fx01 = board.create('point', [function () {
    return point_cx_fx0.X();
}, function () {
    return point_cx_fx0.Y() + 1;
}], {
    visible: false
});

// dashed line (0;f(x0)) - (cx;f(x0))
var line_0_fx0_cx_fx0 = board.create('line', [point_0_fx0, point_cx_fx0], {
    dash: 2,
    straightFirst: false,
    straightLast: false,
    strokeColor: '#000000',
    strokeWidth: 1
});

// line (cx;f(x0)) - (cx,f(x0)+1) for epsilon glider
var line_cx_fx0_cx_fx01 = board.create('line', [point_cx_fx0, point_cx_fx01], {
    straightFirst: false,
    visible: false
});

// epsilon
var epsilon = 1;

// epsilon glider
var glider_cx_fx0_espilon = board.create('glider', [0, (function () {
    return point_0_fx0.Y() + epsilon;
})(), line_cx_fx0_cx_fx01], {
    fillColor: '#00dd66',
    label: {
        offset: [-55, 20]
    },
    name: '\\(f(x_0)+\\epsilon\\)',
    size: 2,
    strokeColor: '#000000',
    strokeWidth: 1
});

// highlight epsilon point
highlightElement(glider_cx_fx0_espilon, "epsilon", "highlightGreen");

// epsilon as line length
var line_cx_fx0_cx_fx0_epsilon = board.create('line', [point_cx_fx0, glider_cx_fx0_espilon], {
    straightFirst: false,
    straightLast: false,
    strokeColor: '#00dd66',
    strokeWidth: 3
});

// highlight epsilon line
highlightElement(line_cx_fx0_cx_fx0_epsilon, "epsilon", "highlightGreen");

// point for epsilon label
var point_label_epsilon = board.create('midpoint', [point_cx_fx0, glider_cx_fx0_espilon], {
    label: {
        offset: [5, 1]
    },
    name: '\\(\\epsilon\\)',
    size: 0
});

// point (cx;f(x0)-epsilon)
var point_cx_fx0_minus_epsilon = board.create('mirrorpoint', [glider_cx_fx0_espilon, point_cx_fx0], {
    fillColor: '#000000',
    label: {
        offset: [-55, -20]
    },
    name: '\\(f(x_0)-\\epsilon\\)',
    size: 2,
    strokeWidth: 0
});

// dotted line (cx;f(x0)) - (cx;f(x0)-epsilon)
var line_cx_fx0_cx_fx0_minus_epsilon = board.create('line', [point_cx_fx0, point_cx_fx0_minus_epsilon], {
    dash: 1,
    straightFirst: false,
    straightLast: false,
    strokeColor: '#00dd66'
});

// point (0,f(x0)+epsilon)
var point_0_fx0_epsilon = board.create('point', [0,
    function () {
        return glider_cx_fx0_espilon.Y();
    }], {
    fillColor: '#000000',
    name: '',
    size: 1,
    strokeWidth: 0
});

// point (0,f(x0)-epsilon)
var point_0_fx0_minus_epsilon = board.create('point', [0,
    function () {
        return point_cx_fx0_minus_epsilon.Y();
    }], {
    fillColor: '#000000',
    name: '',
    size: 1,
    strokeWidth: 0
});

// line (cx;f(x0)+epsilon) - (0;f(x0)+epsilon)
var line_cx_fx0_epsilon_0_fx0_epsilon = board.create('line', [glider_cx_fx0_espilon, point_0_fx0_epsilon], {
    dash: 1,
    straightFirst: false,
    straightLast: true,
    strokeColor: '#cccccc'
});

// line (cx;f(x0)-epsilon) - (0;f(x0)-epsilon)
var line_cx_fx0_minus_epsilon_0_fx0_minus_epsilon = board.create('line', [point_cx_fx0_minus_epsilon, point_0_fx0_minus_epsilon], {
    dash: 1,
    straightFirst: false,
    straightLast: true,
    strokeColor: '#cccccc'
});

/*
 * delta
 */

// coordonate for parallel line to x-axis
var cy = -1.25;

// point (x0;cy)
var point_x0_cy = board.create('point', [function () {
    return glider_x0_0.X();
}, cy], {
    fillColor: '#000000',
    name: '',
    size: 2,
    strokeWidth: 0
});

// point (x0+1;cy)
var point_x01_cy = board.create('point', [function () {
    return glider_x0_0.X() + 1;
}, cy], {
    visible: false
});

// line (x0;cy) - (x0+1,cy) for delta glider
var line_x0_cy_x01_cy = board.create('line', [point_x0_cy, point_x01_cy], {
    straightFirst: false,
    visible: false
});

// delta
var delta = 0.75;

// delta glider
var glider_x0_delta_cy = board.create('glider', [(function () {
    return point_x0_0.X() + delta;
})(), cy, line_x0_cy_x01_cy], {
    fillColor: '#ffaa33',
    label: {
        offset: [10, -10]
    },
    name: '\\(x_0+\\delta\\)',
    size: 2,
    strokeColor: '#000000',
    strokeWidth: 1
});

// highlight delta point
highlightElement(glider_x0_delta_cy, "delta", "highlightOrange");

// delta as line length
var line_x0_cy_x0_delta_cy = board.create('line', [point_x0_cy, glider_x0_delta_cy], {
    straightFirst: false,
    straightLast: false,
    strokeColor: '#ffaa33',
    strokeWidth: 3
});

// highlight delta line
highlightElement(line_x0_cy_x0_delta_cy, "delta", "highlightOrange");

// point (x0-delta;cy)
var point_x0_minus_delta_cy = board.create('mirrorpoint', [glider_x0_delta_cy, point_x0_cy], {
    fillColor: '#000000',
    label: {
        offset: [-50, -10]
    },
    name: '\\(x_0-\\delta\\)',
    size: 2,
    strokeWidth: 0
});

// dotted line (x0;cy) - (x0-delta;cy)
var line_x0_cy_x0_minus_delta_cy = board.create('line', [point_x0_cy, point_x0_minus_delta_cy], {
    dash: 1,
    straightFirst: false,
    straightLast: false,
    strokeColor: '#ffaa33'
});

// point for delta label
var point_label_delta = board.create('midpoint', [point_x0_cy, glider_x0_delta_cy], {
    label: {
        offset: [-2, 12]
    },
    name: '\\(\\delta\\)',
    size: 0
});

// point (x0+delta;0)
var point_x0_delta_0 = board.create('point', [
    function () {
        return glider_x0_delta_cy.X();
    }, 0], {
    fillColor: '#000000',
    name: '',
    size: 1,
    strokeWidth: 0
});

// point (x0-delta;0)
var point_x0_minus_delta_0 = board.create('point', [
    function () {
        return point_x0_minus_delta_cy.X();
    }, 0], {
    fillColor: '#000000',
    name: '',
    size: 1,
    strokeWidth: 0
});

// end point y for vertical dotted line
var cym = 4.75;

// point (x0+delta;cym)
var point_x0_delta_cym = board.create('point', [
    function () {
        return glider_x0_delta_cy.X();
    }, cym], {
    visible: false
});

// point (x0-delta;cym)
var point_x0_minus_delta_cym = board.create('point', [
    function () {
        return point_x0_minus_delta_cy.X();
    }, cym], {
    visible: false
});

// dotted line (x0+delta;cy) - (x0+delta;cym)
var line_x0_delta_cy_x0_delta_cym = board.create('line', [glider_x0_delta_cy, point_x0_delta_cym], {
    dash: 1,
    straightFirst: false,
    straightLast: false,
    strokeColor: '#cccccc'
});

// dotted line (x0-delta;cy) - (x0-delta;cym)
var line_x0_minus_delta_cy_x0_minus_delta_cym = board.create('line', [point_x0_minus_delta_cy, point_x0_minus_delta_cym], {
    dash: 1,
    straightFirst: false,
    straightLast: false,
    strokeColor: '#cccccc'
});

/*
 * intersections delta and epsilon lines
 */

board.create('intersection', [line_x0_delta_cy_x0_delta_cym, line_cx_fx0_epsilon_0_fx0_epsilon, 0], {
    fillColor: '#000000', name: '', size: 1, strokeWidth: 0
});
board.create('intersection', [line_x0_minus_delta_cy_x0_minus_delta_cym, line_cx_fx0_epsilon_0_fx0_epsilon, 0], {
    fillColor: '#000000', name: '', size: 1, strokeWidth: 0
});
board.create('intersection', [line_x0_delta_cy_x0_delta_cym, line_cx_fx0_minus_epsilon_0_fx0_minus_epsilon, 0], {
    fillColor: '#000000', name: '', size: 1, strokeWidth: 0
});
board.create('intersection', [line_x0_minus_delta_cy_x0_minus_delta_cym, line_cx_fx0_minus_epsilon_0_fx0_minus_epsilon, 0], {
    fillColor: '#000000', name: '', size: 1, strokeWidth: 0
});

/*
 * x
 */

// line (x0-delta;0) - (x0+delta;0) for x glider
var line_x0_minus_delta_0_x0_delta_0 = board.create('line', [point_x0_minus_delta_0, point_x0_delta_0], {
    straightFirst: false,
    straightLast: false,
    visible: false
});

// x glider
var glider_x_0 = board.create('glider', [glider_x0_0.X() + delta / 2, 0, line_x0_minus_delta_0_x0_delta_0], {
    fillColor: '#3366ff',
    label: {
        offset: [-4, -15]
    },
    name: '\\(x\\)',
    size: 2,
    strokeColor: '#000000',
    strokeWidth: 1
});

// highlight x
highlightElement(glider_x_0, 'xed', 'highlightBlue');

// point (x;f(x))
var point_x_fx = board.create('point', [
    function () {
        return glider_x_0.X();
    },
    function () {
        return term_f(glider_x_0.X());
    }], {
    fillColor: '#000000',
    name: '',
    size: 2,
    strokeWidth: 0
});

// point (0;f(x))
var point_0_fx = board.create('point', [0,
    function () {
        return term_f(glider_x_0.X());
    }], {
    fillColor: '#000000',
    label: {
        offset: [-30, 0]
    },
    name: '\\(f(x)\\)',
    size: 2,
    strokeWidth: 0
});

// dotted line (x;0) - (x,f(x))
var line_x_0_x_fx = board.create('line', [glider_x_0, point_x_fx], {
    dash: 2,
    straightFirst: false,
    straightLast: false,
    strokeColor: '#000000',
    strokeWidth: 1
});

// dotted line (x;f(x)) - (0;f(x))
var line_x_fx_0_fx = board.create('line', [point_x_fx, point_0_fx], {
    dash: 2,
    straightFirst: false,
    straightLast: false,
    strokeColor: '#000000',
    strokeWidth: 1
});

/*
 * line for |x-x0| < delta
 */

var line_x0_0_x_0 = board.create('line', [point_x0_0, glider_x_0], {
    straightFirst: false,
    straightLast: false,
    strokeColor: '#3366ff',
    strokeWidth: 3
});

highlightElement(line_x0_0_x_0, 'xx0d', 'highlightBlue');

/*
 * line for |f(x)-f(x0)| < epsilon
 */

var line_0_fx_0_fx0 = board.create('line', [point_0_fx0, point_0_fx], {
    straightFirst: false,
    straightLast: false,
    strokeColor: function () {
        if (line_cx_fx0_cx_fx0_epsilon.L() > point_0_fx0.Dist(point_0_fx))
            return '#993333';
        else
            return '#ff00ff';
    },
    strokeWidth: 3
});

highlightElement(line_0_fx_0_fx0, 'fxfx0', 'highlightDarkRed');

// area with epsilon-delta-condition
var polygon_delta_epsilon = board.create('polygon', [
    point_x0_0,
    glider_x_0,
    point_x_fx,
    point_0_fx,
    point_0_fx0,
    point_x0_fx0
], {
    borders: {
        visible: false
    },
    fillColor: function () {
        if (line_cx_fx0_cx_fx0_epsilon.L() > point_0_fx0.Dist(point_0_fx))
            return '#dddddd';
        else
            return '#ff00ff';
    },
    highlightFillColor: '#dddddd'
});

function highlightElement(el, id, cl) {
}

        /*@formatter:on*/
    })();
</script>

---

##### Who this documentation is for

- *Building constructions* — which parameters exist, which attributes change
  the behaviour → *Elements*
- *Extending JSXGraph* — internal interfaces, private members included
  → *Classes*, *Namespaces*
<!-- - *Getting started* — tutorials, first steps → *Tutorials*-->

---

##### What this documentation contains

- *Usage signatures* — every parameter combination `board.create()` accepts
- *Attributes* — name, type, default value, own and inherited
- *Members, methods, events* — the interface of each element
- *Live examples* — runnable constructions next to their code
- *Classes and namespaces* — the objects behind the elements
- *Source links* — every entry points at the line it came from

---

<div id="home-euler" class="jxgbox" style="width: 300px; height: 300px;"></div>

<script type="module">
    (function () {
        /*@formatter:off*/
JXG.Options.text.useMathJax = true;

const board = JXG.JSXGraph.initBoard("home-euler", {
    boundingbox: [-6, 6, 6, -6],
    keepaspectratio: true,
    showCopyright: false,
    showNavigation: false,
    pan: { enabled: false },
    zoom: { enabled: false }
});

// Construct triangle ABC
var
    A = board.create('point', [-2, -4], { name: '\\(A\\)', label: { offset:[0, -20] }, showInfobox: false }),
    B = board.create('point', [4, 0], { name: '\\(B\\)', label: { offset:[5, -15] }, showInfobox: false }),
    C = board.create('point', [-4, 4], { name: '\\(C\\)', label: { offset:[0, 20] }, showInfobox: false }),
    pol = board.create('polygon', [A, B, C], {
        fillColor: '#FFFF00',
        borders: {
            strokeWidth: 2,
            strokeColor: '#eedd66'
        }
    });

// Orthocenter H
var
pABC = board.create('perpendicular', [pol.borders[0], C], { dash: 2, strokeWidth: 1, strokeColor: '#8000c0'}),
pBCA = board.create('perpendicular', [pol.borders[1], A], { dash: 2, strokeWidth: 1, strokeColor: '#8000c0'}),
pCAB = board.create('perpendicular', [pol.borders[2], B], { dash: 2, strokeWidth: 1, strokeColor: '#8000c0'}),
i1 = board.create('intersection', [pABC, pCAB, 0], { name: '\\(H\\)', size: 3, strokeColor: '#8000c0', fillColor: '#8000c0' }),
pi1 = board.create('intersection', [pABC, pol.borders[0], 0], { name: '', size: 1, strokeColor: '#8000c0', fillColor: '#8000c0' }),
pi2 = board.create('intersection', [pBCA, pol.borders[1], 0], { name: '', size: 1, strokeColor: '#8000c0', fillColor: '#8000c0' }),
pi3 = board.create('intersection', [pCAB, pol.borders[2], 0], { name: '', size: 1, strokeColor: '#8000c0', fillColor: '#8000c0' }),
a1 = board.create('nonreflexangle', [B, pi1, C], { name: '', size: 1, strokeColor: '#8000c0', fillColor: 'none', radius:0.4 }),
a2 = board.create('nonreflexangle', [A, pi2, C], { name: '', size: 1, strokeColor: '#8000c0', fillColor: 'none', radius:0.4 }),
a3 = board.create('nonreflexangle', [A, pi3, B], { name: '', size: 1, strokeColor: '#8000c0', fillColor: 'none', radius:0.4 });

// Centroid S
var
mAB = board.create('midpoint', [A, B], { name: '', size: 1, strokeColor: '#0080c0', fillColor: '#0080c0' }),
mBC = board.create('midpoint', [B, C], { name: '', size: 1, strokeColor: '#0080c0', fillColor: '#0080c0' }),
mCA = board.create('midpoint', [C, A], { name: '', size: 1, strokeColor: '#0080c0', fillColor: '#0080c0' });

var
ma = board.create('segment', [mBC, A], { dash: 1, strokeWidth: 1, strokeColor: '#0080c0' }),
mb = board.create('segment', [mCA, B], { dash: 1, strokeWidth: 1, strokeColor: '#0080c0'  }),
mc = board.create('segment', [mAB, C], { dash: 1, strokeWidth: 1, strokeColor: '#0080c0'  }),
i2 = board.create('intersection', [ma, mc, 0], { name: '\\(S\\)', size: 3, strokeColor: '#0080c0', fillColor: '#0080c0'  });

// Circumcenter U
var c = board.create('circumcircle', [A, B, C], {
    strokeColor: '#ffaa00',
    dash: 0,
    strokeWidth: 1,
    center: { name: '\\(U\\)', visible: true, withLabel: true, size: 3, strokeColor: '#ffaa00', fillColor: '#ffaa00'  }
});

// Euler line: U, H and S are collinear
var euler = board.create('line', [i1, i2], {
    strokeWidth: 3,
    strokeColor: '#33aa66'
});
        /*@formatter:on*/
    })();
</script>

---

##### How to navigate this documentation

- *Search* — filters all entries as you type
- *Elements* — grouped by topic: 3D, Circle, Control, Curve, Line, Point,
  Polygon, Text, Transformation …
- *Classes* — `JXG.Board`, `JXG.GeometryElement`, `JXG.Point` …
- *Namespaces* — `JXG`, `JXG.Math`, `JXG.Options` …
- *Modules* — the source files
<!-- - *Tutorials* — how to read this documentation, first steps -->

---

##### Beyond this documentation

- <a href="https://github.com/jsxgraph/jsxgraph" target="_blank" rel="noopener">GitHub</a> — source code, releases and
  issue tracker
- <a href="https://www.npmjs.com/package/jsxgraph" target="_blank" rel="noopener">npm</a> — install with
  `npm install jsxgraph` for use with Node.js or a bundler
- <a href="https://jsxgraph.org/share" target="_blank" rel="noopener">Examples database</a> — several hundred ready
  made constructions, each with its source
- <a href="https://jsfiddle.net/my0fkdb6/1/" target="_blank" rel="noopener">jsFiddle</a> — a prepared sandbox for
  trying things out without a local setup
- <a href="https://forum.jsxgraph.org/" target="_blank" rel="noopener">Forum</a> — questions, answers and
  announcements



<div id="home-surface" class="jxgbox" style="width: 300px; height: 300px;"></div>

<script type="module">
    (function () {
        /*@formatter:off*/
var board = JXG.JSXGraph.initBoard("home-surface", {
    boundingbox: [-5, 5, 5, -5],
    axis: false,
    keepaspectratio: true,
    showCopyright: false,
    showNavigation: false,
    pan: { enabled: false },
    zoom: { enabled: false }
});
var box = [-2, 2],
    view = board.create('view3d', [[-3, -1], [6, 6], [box, box, box]], {
        projection: 'central',
        xPlaneRear: { visible: false },
        yPlaneRear: { visible: false }
    });

// Define the 3D function graph
var F_txt = 'cos(1 * x) * cos(2 * y)';
var F = board.jc.snippet(F_txt, true, 'x,y');

// Partial derivatives, computed symbolically
var Fdx_txt = 'D(cos(1 * x) * cos(2 * y), x)';
var Fdy_txt = 'D(cos(1 * x) * cos(2 * y), y)';
var Fdx = board.jc.snippet(Fdx_txt, true, 'x,y');
var Fdy = board.jc.snippet(Fdy_txt, true, 'x,y');

// 3D function graph
var c = view.create("functiongraph3d", [F, box, box], { strokeWidth: .5, stepsU: 100, stepsV: 100 });

// The two points
var Axy = view.create("point3d", [0.75, 1.25, -2], { withLabel: false, fillColor: '#aaaaaa', showInfobox: false }),
    A = view.create("point3d", [function() { return [Axy.X(), Axy.Y(), F(Axy.X(), Axy.Y())] }], {
        withLabel: false,
        fixed: true, fillColor: '#aaaaaa', showInfobox: false
    }),
    Ax = view.create("point3d", [function() { return [Axy.X(), 0, -2 ]}], { size:1, fillColor: '#aaaaaa', withLabel: false, showInfobox: false }),
    Ay = view.create("point3d", [function() { return [0, Axy.Y(), -2 ]}], { size:1, fillColor: '#aaaaaa', withLabel: false, showInfobox: false });
view.create("line3d", [Axy, A], { dash: 1 });
view.create("line3d", [Axy, Ax], { dash: 1 });
view.create("line3d", [Axy, Ay], { dash: 1 });

// Determine tangent vectors
var dFx = () => Fdx(A.X(), A.Y()),
    dFy = () => Fdy(A.X(), A.Y()),
    dFx_norm = () => Math.sqrt(1 + Fdx(A.X(), A.Y()) ** 2),
    dFy_norm = () => Math.sqrt(1 + Fdy(A.X(), A.Y()) ** 2),
    dFx1 = () => 1 / dFx_norm(),
    dFx2 = () => Fdx(A.X(), A.Y()) / dFx_norm(),
    dFy1 = () => 1 / dFy_norm(),
    dFy2 = () => Fdy(A.X(), A.Y()) / dFy_norm(),
    dFx_vec = [dFx1, 0, dFx2],
    dFy_vec = [0, dFy1, dFy2],

    // Tangent plane
    plane1 = view.create("plane3d", [A, dFx_vec, dFy_vec, [-.5, .5], [-.5, .5]], { fillOpacity: .8, fillColor: "#0080c0", strokeWidth: .5 }),
    // Tangent vectors of length 1
    a = view.create("line3d", [A, dFx_vec, [0, 1]]),
    b = view.create("line3d", [A, dFy_vec, [0, 1]]);
        /*@formatter:on*/
    })();
</script>

---

Developed at the [Center for Mobile Learning with Digital Technology](https://mobile-learning.uni-bayreuth.de/),
[University of Bayreuth](https://www.uni-bayreuth.de/en). Dual licensed under the
<a href="http://www.gnu.org/licenses/licenses.html#LGPL" target="_blank" rel="noopener">LGPL</a> and the
<a href="https://github.com/jsxgraph/jsxgraph/blob/master/LICENSE.MIT" target="_blank" rel="noopener">MIT licence</a> —
free to use, modify and distribute, commercial use included.
