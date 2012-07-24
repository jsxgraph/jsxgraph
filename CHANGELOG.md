0.95
====

Important Notes
---------------
 * We migrated from subversion to git. To access pre-git changesets you can use our trac system that is still online.
   You can use this url and append the revision number to see the changelog http://sourceforge.net/apps/trac/jsxgraph/changeset/,
   e.g. http://sourceforge.net/apps/trac/jsxgraph/changeset/1234 for revision r1234.
 * Merged coordinate parameters into arrays for all setPosition, setPositionDirectly, and setPositionByTransform methods (r2825)
 * Old intersection functions are now marked as deprecated, you should not rely on them being available in future releases (r2846)
 * Hooks have been refactored and improved. Please use on/addEvent resp off/removeEvent now to add or remove events to the board. The addHook, removeHook and updateHooks functions have been marked as deprecated and might be dropped in a future release (r2864, r2866 & r2867)
 * The behaviour of board event handlers have been changed. mousedown and touchstart events started outside a board do no longer trigger any mouseup resp. touchend events (r2886 & r2887)
 * Default names for texts, angles (af4701e, 18ac2ae)
 * The **offsets** property has been renamed to **offset** (5ea97f5)

New Features
------------
 * Attributes for grid and axis can be given on initBoard (r2841)
 * Scale ticks and represent the scale by appending a string to each tick label (r2842)
 * JSXGraph can now be used inside WebWorkers (r2807, r2811 & r2874)
 * Two finger manipulation of circles (r2896 & r2897)
 * objectsList in Board holds the elements in order of creation (r2898, r2899 & r2901)
 * added rgba values to RGBParser (r2912)
 * Allow in Curve.hasPoint() for plots to start search at an arbitrary position (r2939)
 * Animate the size of a point (r2950)
 * Implemented minor and major arcs. They can be constructed by using the element type **minorarc** and **majorarc** or by using
   the element type **arc** with property *type* set to *minor* or *major*.
 * New input specific events (877d5ac)
 * New board option *animationDelay* which controls the animation fps (d093a9e)
 * New options for texts: **anchorX** 'left', 'middle', or 'right' and **anchorY** 'top', or 'bottom' (78608c0, f1aa9de, 8d7f467, bc8cbd6, bbb607b, 7e69d11)
   and **rotate** (181ee73)
 * Circles and lines have a new property **snapToGrid**. Whenever a line or circle is moved and this property is set, the parent points with the snapToGrid 
   set to true will snap to grid once the users releases the circle or line (#3, 2a774e1)
 * New option **labels** for Ticks. In case of special ticks the *n* strings given in **labels** are taken as labels for the first *n* ticks (c188efe)
 * New options **type**, **orthoType** and **orthoSensitivity** for *angles*. See the docs for their meaning (8f0ed8c)
 * New options for infobox which shows the coordinates of a point. Beside the text options, the number of digits can be adjusted. Default css class is JXGinfobox.

Bug fixes
---------
 * Fixed flickering of gliders on plots (r2828 - r2829 & r2876)
 * Bugfix setPosition of text elements  (r2833)
 * Simplified creation of intersection points  (r2833)
 * Added error check in tangent creator (r2833)
 * Offsets for ticks (r2834)
 * Fixed ticks ($68, r2835, r2836, r2843, r2845, r2889, r2890 & r2925)
 * Fixed JXG.Text.getSize() (r2837)
 * Bug fix: createArrow, createArrowParallel: arrows are shown if strokeOpacity is a function with inital value 0 (r2849)
 * Disabled and re-enabled drag highlighting devices (r2860, r2934 & r2935)
 * Slowed down zooming with gestures (r2855)
 * Fixed placement of labels (r2863, r2911, r2913)
 * Transformation "reflect" on lines defined by ideal (infinite) points (r2872)
 * Jumpy scroll wheel zooming fixed (r2873)
 * Enhance sensitive area for points with non-default stroke width (r2877)
 * Fixed issues with gliders on lines with at least one ideal point (r2878, r2880, r2882)
 * Bugfix event handlers for elements (r2879)
 * Using the **touches** property of the event object instead of **targetTouches** fixes some bugs (r2888)
 * Fixed arrows (r2891)
 * Enlarge the drawing region slightly to hide the small sides of thick lines (r2892)
 * Rays through ideal points change their orientation (r2893)
 * Fixed reflections: instead of JXG.Math.Geometry.reflection use transformations (r2894)
 * Load all available renderers that could be used in the current host (r2900)
 * Bug fix: Filled polygon in CanvasRenderer? in case one point does not exist (r2907)
 * Use asynchronous Mathjax (r2914)
 * Fixed JXG.Curve.bounds() (r2918)
 * Remove deleted elements from their ancestors dependents list (r2919)
 * Bugfix event handler flags (r2923)
 * touchMoveHandler: Ignore slowpoke events (r2927 & r2929)
 * reset board mode if no more touches are found (r2931)
 * Bugfix: hide invisible grids (r2936 & r2938)
 * Fixed tick heights issue in boards where unitX != unitY (r2940)
 * Fixed move origin on touch devices (r2942)
 * Adjust size of arrow heads at least for small stroke width values (r2948)
 * Suspend update in JXG.freeBoard() to prevent dependency errors (r2949)
 * Bug fix: layer for gliders (r2952)
 * Bug fix: properties of gliders (r2953)
 * Pass event objects to internal event handlers, if available (929cb40)
 * Copy general element properties only when creating primitives (95603ef, d5f2b87, 1b54d9a, 5e0486d, 39b3e82)
 * Do a full update after changing the properties of an element with needsRegularUpdate set to false (6463b8c, ff4fe3a)
 * Angle texts are moving again (e9c68b1)
 * Set margin to zero if the line has arrows set (6582086, bd7518a)
 * Hide circles with non-real midpoints (381b287)
 * Don't update ticks if board height or width equals zero (c7c2e23)
 * Various fixes in GeonextReader (006c5da, 59ac4c2, 1fecf7a)
 * Ticks are now deleted when their line is removed (bda7e7f)
 * Text rendering speed improved (d4c0bf2, b955052, fa91ce0, 434c87b, 12b9922)
 * Speed improvements for arcs and sectors (d2fdee1, e0ee6c9, 572d123, fdabf15, c6a70a4, 8acbb60)
 * If no element is dragged or found, don't stop the event propagation (324f7c6)
 * The radius of an *angle* can be set via *setProperty()* (bc0e21c)


0.94
====

Important Notes
---------------
 * The property line.labelOffsets has been moved to element.label.offsets (r2765)


New Features
------------
 * Update build script: allow the user to choose the test server via --server (r2691)
 * Implemented mathematical modulo JXG.Math.mod (r2698)
 * Multitouch handling of lines in case one defining point is an ideal point and general improvement of multitouch dragging of lines (r2700, r2701)
 * Make normals and parallels (to a line) through one point draggable (r2706)
 * Improved gliders on lines defined by an ideal point (r2744)
 * Added hex2rgb conversion (r2745 & r2746)
 * Introduced the point options snapToPoints (r2758, r2759, 2760 & r2762)
 * Label positioning (r2764 - r2767, r2769, r2770)
 * Prevent reevaluation of a curve if neither the viewport nor the definition of the curve have changed (r2781)
 * GeonextReader: visibility of labels of lines and circles (r2792)
 * setProperty() called on a group sets the properties of all members of the group (r2794)
 * Internal event handling system (r2795)
 * Enabled transformations for data plot curves (r2799)

Bug fixes
---------
 * Fixed vertical navigation (r2684)
 * Fixed a problem with the artificial endpoints of Catmull-Rom splines (r2688)
 * Fixed typos regarding integral helper points in Options.js (r2690)
 * Disallow dragging of elements depending on a glider (r2693 & r2694)
 * fixes for circumcircle (r2695)
  * degenerated case (r2695)
  * circle should be draggable if defined by free points (r2695, r2696 & r2697)
 * Fixed translation of lines in case one of the defining points is an ideal point (r2699)
 * Fixed problems with degenerated circles (r2702)
 * Fixed a bug regarding multitouch dragging (r2704)
 * Use curve.Y() instead of curve.yterm() in the integral element (r2710)
 * Update text in JXG.Text.setText()
 * Deactivate mouse events as soon as the first touch events occurs to fix mixed mouse/touch events on the iPad (r2715, r2748-r2753)
 * Update the board after setting a new radius (r2716)
 * Created points in regularpolygon now have the type JXG.OBJECT_TYPE_CAS instead of the (free) JXG.OBJECT_TYPE_POINT (r2717)
 * Refactored glider update (r2719 - r2722, r2724 & r2725)
 * Fixed ids and names of parallel and normal far points (r2718 & r2723)
 * Fixed polygons in GeonextReader (r2726)
 * Fixed angles in GeonextReader (r2727)
 * Bugfix orthogonalprojection (r2730, r2731)
 * Fixed of lines as parametric curves (r2736)
 * Added missing board update in JXG.Text (r2737)
 * Glider on polygon fixed (r2761 & r2762)
 * JXG.Line.hasPoint() fixed (r2763)
 * Fixed Canvas- and SVGRenderer inside divs without explicit height/width (r2780 & r2801)
 * Ticks with ticksDistance set and insertTicks: false are now displayed correctly (r2782)
 * Fixed "undefined is not an error" bug on iPad (r2785)



0.93
====

Important Notes
---------------
 * Renamed element perpendicular to perpendicularsegment. perpendicular now is a straight line instead of a segment (r2360)
 * Mouse wheel zoom is disabled by default, you can enable it by setting the property zoom to true in JXG.JSXGraph.initBoard ($34 & r2369)
 * Hooks 'mousedown', 'mouseup', and 'mousemove' have been renamed to 'down', 'up', 'move'. Those hooks work on mouse & touch devices. Their mouse equivalents now only work on devices controlled by a mouse. The corresponding touch versions are called 'touchstart', 'touchend', and 'touchmove' (r2514, r2515 & r2516)
 * Removed obsolete method JXG.Turtle.evalCoords (r2378)
 * JXG.Curve.{doAdvancedPlot,numberPointsHigh,numberPointsLow} moved to JXG.Curve.visProp. Use JXG.Curve.setProperty() to set them (r2489)
 * Some of the subelements had to be renamed. Please check your constructions with this version and consult our documentation (http://jsxgraph.uni-bayreuth.de/docs/) if you're having trouble accessing any subelements. ($61 & r2623)

New Features
------------
 * New board properties to use in initBoard: zoom (Boolean, default *false*) and pan (Boolean, default *true*) ($34 & r2369)
 * Element 'perpendicularsegment' replaces 'perpendicular' which now is a straight line by default (r2360)
 * Element 'tracecurve' (r2372 to 2379)
 * New methods for JXG.Polygon: addPoints (attaches new vertices at the end of the vertex list), insertPoints (insert new points behind an arbitrary vertex) and removePoints (removes arbitrary set of vertices) ($39, r2398, r2400 and r2401)
 * Construction alternatives for lines: Use two functions returning the point's coordinates in an array or use one function returning the line's homogeneous coordinates ($9, r2407 & r2408)
 * Traces can now have different visual properties than the traced element they belong to. Use the *traceAttributes* property of the traced element just as an properties object like in setProperty ($17 & r2410)
 * The new Angle attribute **type** defines the look of the angle: *sector*, if it should be a sector all the time, *square* for a square (right angle)/parallelogram (general) to indicate a right angle, and *auto* for a sector in general and square if the angle is close to a right angle ($49, r2437, r2438 & r2479)
 * Parallel lines are now constructed without an invisible parallel point (r2451)
 * Label properties can now be given via a subelement *label* in the properties object given in create() ($43 & r2453)
 * JXG.Curve has a new attribute called *handdrawing* (r2458 & r2459)
 * Magnetized points, see the new point attributes *attractor*, *attractorDistance*, and *snatchDistance* for details (r2460-r2463)
 * *snapToGrid* is now an attribute of JXG.Point instead of JXG.Board. This way, it can be decided for every single point to snap onto a grid and what grid ($46, r2463 & r2487). If snapSize* is less or equal zero the axis is used (if available (r2611)
 * Highlighting can now be disabled with the element attribute *highlight*. Default value is *true* ($47 & r2476)
 * The radius of an angle can now be a function ($50 & r2481)
 * Preparations for polynomial arithmetics (r2484)
 * Preparations for a file format (r2485, r2488, r2495, r2499 - r2502, r2507, r2509)
 * Segments can have a fixed length now (r2492 - r2494)
 * Catmull-Rom-splines (r2510, r2512 & r2528)
 * Introducing themes (r2539, r2541 & r2545)
 * Angle has a new method called Value() that returns the currently displayed angle (r2548)
 * Set the zoom level of a board directly with JXG.Board.setZoom (r2563)
 * Attributes cssClass & highlightCssClass for texts (r2564 - r2567)
 * Method free() for JXG.Point and JXG.Text, to free a bound point/text (r2572 & 2612)
 * New method def() for JXG to ease default parameter handling (r2617)
 * JXG.indexOf() finds elements in an array (r2629)
 * New attribute for JXG.Polygon *hasInnerPoints* changes the behaviour of JXG.Polygon.hasPoint(): If true, hasPoint returns true if the user points inside the polygon (r2651 & r2652)

Bug fixes
---------
 * Fixed freeBoard issue ($35 & r2365)
 * Hide infobox on touchend (r2362)
 * Updated reference card (r2363)
 * Resizing the container now works with Canvas, too ($38 & r2368)
 * Disabling a label via setProperty({withLabel: false}) and re-enabling it won't cause a second label to appear ($37 & r2370)
 * A midpoint with complex parents could be misplaced (r2375)
 * Prevent dragging of axis points (r2391)
 * Fixed layer of the glider in a slider (r2397)
 * Fixed width and height computation of texts (r2399)
 * gradientSecondColor got lost during setProperty (r2415)
 * Set property withLabel to true on an element without a label produced an error ($40 & r2416)
 * Listen on the whole document for touchEnd events, not only on the board's container (r2420)
 * Enable navigation controls on touch devices (r2464)
 * The ids of the points used to generate a regular polygon can now be given in the attribute object ($48 & r2478)
 * Dragged objects are now highlighted (r2490)
 * Improved multitouch dragging of lines (r2497, r2498 & r2503)
 * Traces are deleted as soon as the element's trace attribute is set to false (r2511)
 * Sliders with snapWidth set to e.g. 1 not always returned an integer value (r2519 & r2520)
 * Fixed an issue with major ticks with height < 0 ($55, r2517, r2518 & r2522) and improved ticks in general (r2523, r2524, r2525 & r2553)
 * Fixed some bugs in Turtles ($56, r2526, r2527, r2529, r2533 & r2537)
 * JXG.trim now deletes whitespaces, not 'w's (r2543)
 * If a free point is converted to a glider with JXG.Point.makeGlider(), it is now located near its last position as a free point (r2544)
 * JXG.Legend had no visProp (r2561)
 * Constrained points were visible only after an update (r2584)
 * Hide Polygon if at least one of the vertices is non-real ($59 & r2585)
 * Fillcolor of a point was set to highlightStrokeColor on highlight (r2587)
 * The z-Index of the board's div is now added to the z-Index for html text elements (r2598)
 * Minor bug in GeometryElement fixed (r2602)
 * Set infobox to fixed (r2603)
 * Clear traces on object removal (r2610)
 * Repaired JXG.Point.visit() (r2631)
 * Fixed a bug in JXG.Polygon.remove() (r2634)
 * Fixed highlighting using custom DOM events (r2637)
 * Fixed a bug in JXG.addEvent() (r2638)
 * Set grid dash from 2 to 0, because 2 slows down the iPad considerably (r2641)
 * Fixed a bug in JXG.createGroup (r2653)
 * Fixed a bug preventing the automatic labeling of Angles (r2655 & r2656)



0.92
====

Important Notes
---------------
 * JXG.Math.Numerics.RamenDouglesPeucker has been renamed to JXG.Math.Numerics.RamerDouglasPeucker (r2317)
 * JXG.Board.getRelativeMouseCoordinates() has been renamed to JXG.Board.getCoordsTopLeftCorner (r2327 & r2329)

New Features
------------

Bug fixes
---------
 * Fixed restriction to max 34 Boards on a single HTML web page and raised it to 65535 (r2313)
 * Line with undefined endpoint is fixed ($15 & r2322)



0.91
====

Important Notes
---------------

JXG.Point.visit()'s parameter repeat has been replaced by the new parameter options
which can used to provide settings like a repeat value, a callback function or
speeding effects. It is however still possible to provide repeat as a third
parameter instead of an options object to support older mathlets ootb without the
author having to make readjustments. This behaviour might be dropped in future
releases, so please adjust your scripts accordingly.

New Features
------------
 * Zoom with mouse wheel (r2188 & r2272)
 * Optional dot for right angles ($18 & r2197)
 * Adjust the renderer size if the board is resized (r2207, r2208 & $21)
 * Callback functions for animated point movement ($25, r2211 & r2214)
 * Callback functions for visprop animation ($26 & r2222)
 * Point movement animations got the new option "effect" ($5, r2279)
 * User defined execution context for hooks ($29 & r2220)
 * New Slider attribute 'precision': manages precision of slider value displayed in its label (r2230)
 * Polygons can now be removed via board.removeObject() (r2240)
 * Improved zooming (r2231, r2241, r2242 & r2243)
 * Improved mouse and touch events and enabled dragging lines, circles and texts (r2251, r2253-r2254, r2256-r2264, r2266-r2271)
 * Max number of iterations in JXG.Math.Numerics.fminbr can be adjusted with JXG.Math.Numerics.maxIterationsMinimize (r2283 & r2288)
 * Max number of iterations in JXG.Math.Numerics.fzero can be adjusted with JXG.Math.Numerics.maxIterationsRoot (r2285)
 * Implemented remove() for sliders ($31 & r2296)

Bug fixes
---------
 * Element copies from tracing sent to background ($13 & r2190)
 * Traced intersections leave a copy at [0, 0] on initialization ($14 & r2191)
 * General elements should not be put into the highest layer but into the lowest ($16 & r2192)
 * Attribute 'withLabel' was missing in the docs (r2193)
 * Suppress error message caused by empty path strings (r2194 & r2205)
 * Draw segments correctly from the start (r2196)
 * CanvasRenderer: Don't draw invisible points (r2196)
 * Implement show/hideElement for JXG.Ticks (r2203 & $20)
 * createCircumcircle does not return arrays anymore (r2204)
 * Check if document.selection.empty is a function in Board.mouseDownListener (r2206)
 * Perpendiculars can now be constructed as straight lines ($23 & r2213)
 * Drag'n'Drop of elements bug on Android devices fixed ($27, r2215 & r2216)
 * initial position of helper point in createPerpendiculer fixed ($24 & r2223)
 * initial positions of axis labels fixed (r2232)
 * harmonized default tick distance attributes and documented ticks (r2234 & r2235)
 * fixed display of 0 with certain ticks distances (r2236 & r2237)
 * fixed using HTML tables as datasource for charts (r2238)
 * proper placement of axis labels ($1 & r2277)
 * GeonextReader: straightLines (r2284)
 * Adjusted Layers of Compositions: Polygons are now below lines (r2287)
 * IntergeoReader & CinderellaReader: Compositions are working now (r2289 & r2290)
