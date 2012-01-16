/*
    Copyright 2008,2009
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with JSXGraph.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * @fileoverview The geometry object Line is defined in this file. Line stores all
 * style and functional properties that are required to draw and move a line on
 * a board.
 */


/**
 * @class A slider can be used to choose values from a given range of numbers.
 * @pseudo
 * @description
 * @name Slider
 * @augments Glider
 * @constructor
 * @type JXG.Point
 * @throws {Exception} If the element cannot be constructed with the given parent objects an exception is thrown.
 * @param {Array_Array_Array} start,end,data The first two arrays give the start and the end where the slider is drawn
 * on the board. The third array gives the start and the end of the range the slider operates as the first resp. the
 * third component of the array. The second component of the third array gives its start value.
 * @example
 * // Create a free point using affine euclidean coordinates
 * var s = board.create('slider', [[1, 2], [3, 2], [1, 5, 10]]);
 * </pre><div id="cfb51cde-2603-4f18-9cc4-1afb452b374d" style="width: 200px; height: 200px;"></div>
 * <script type="text/javascript">
 *   (function () {
 *     var board = JXG.JSXGraph.initBoard('cfb51cde-2603-4f18-9cc4-1afb452b374d', {boundingbox: [-1, 5, 5, -1], axis: true, showcopyright: false, shownavigation: false});
 *     var s = board.create('slider', [[1, 2], [3, 2], [1, 5, 10]]);
 *   })();
 * </script><pre>
 * @example
 * // Create a constrained point using anonymous function
 * var s = board.create('slider', [[1, 3], [3, 1], [1, 10, 50]], {snapWidth: 1});
 * </pre><div id="e17128e6-a25d-462a-9074-49460b0d66f4" style="width: 200px; height: 200px;"></div>
 * <script type="text/javascript">
 *   (function () {
 *     var board = JXG.JSXGraph.initBoard('e17128e6-a25d-462a-9074-49460b0d66f4', {boundingbox: [-1, 5, 5, -1], axis: true, showcopyright: false, shownavigation: false});
 *     var s = board.create('slider', [[1, 3], [3, 1], [1, 10, 50]], {snapWidth: 1});
 *   })();
 * </script><pre>
 */
JXG.createSlider = function(board, parents, attributes) {
    var pos0, pos1, smin, start, smax, sdiff, 
           p1, p2, l1, ticks, ti, startx, starty, p3, l2, n, t,
           withText, withTicks, snapWidth, attr, precision;

    pos0 = parents[0];
    pos1 = parents[1];
    smin = parents[2][0];
    start = parents[2][1];
    smax = parents[2][2];
    sdiff = smax -smin;

    attr = JXG.copyAttributes(attributes, board.options, 'slider');
    withTicks = attr['withticks'];
    withText = attr['withlabel'];
    snapWidth = attr['snapwidth'];
    precision = attr['precision'];
    
    attr = JXG.copyAttributes(attributes, board.options, 'slider', 'point1');
    p1 = board.create('point', pos0,  attr);

    attr = JXG.copyAttributes(attributes, board.options, 'slider', 'point2');
    p2 = board.create('point', pos1,  attr);
    board.create('group',[p1,p2]);
    
    attr = JXG.copyAttributes(attributes, board.options, 'slider', 'baseline');
    l1 = board.create('segment', [p1,p2], attr);

    // this is required for a correct projection of the glider onto the segment below
    l1.updateStdform();
    
    if (withTicks) {
        attr = JXG.copyAttributes(attributes, board.options, 'slider', 'ticks');
        ticks  = 2;
        ti = board.create('ticks', [l1, p2.Dist(p1)/ticks], attr);
    }

    startx = pos0[0]+(pos1[0]-pos0[0])*(start-smin)/(smax-smin);
    starty = pos0[1]+(pos1[1]-pos0[1])*(start-smin)/(smax-smin);

    attr = JXG.copyAttributes(attributes, board.options, 'slider', 'glider');
    /*
     * Special naming convention for sliders:
     * p3 (which is the glider) receives the sliders name
     */
    if (attributes['name'] && attributes['name']!='') {
        attr['name'] = attributes['name'];
    }    
    p3 = board.create('glider', [startx, starty, l1], attr);   // gliders set snapwidth=-1 by default (i.e. deactivate them)
    p3.setProperty({snapwidth:snapWidth});
    
    attr = JXG.copyAttributes(attributes, board.options, 'slider', 'highline');
    l2 = board.create('segment', [p1,p3],  attr);
                 
    p3.Value = function() { 
        return p3.visProp.snapwidth === -1 ? this.position*sdiff+smin : Math.round((this.position*sdiff+smin)/this.visProp.snapwidth)*this.visProp.snapwidth;
    };

    p3.methodMap = JXG.deepCopy(p3.methodMap, {
        Value: 'Value'
    });

    /**
     * End value of the slider range.
     * @memberOf Slider.prototype
     * @name _smax
     * @type Number
     */
    p3._smax = smax;

    /**
     * Start value of the slider range.
     * @memberOf Slider.prototype
     * @name _smin
     * @type Number
     */
    p3._smin = smin;

    if (withText) {
        if (attributes['name'] && attributes['name']!='') {
            n = attributes['name'] + ' = ';
        } else {
            n = '';
        }
        attr = JXG.copyAttributes(attributes, board.options, 'slider', 'label');
        t = board.create('text', [function(){return (p2.X()-p1.X())*0.05+p2.X();},
                                  function(){return (p2.Y()-p1.Y())*0.05+p2.Y();},
                                  function(){return n+(p3.Value()).toFixed(precision);}],
                         attr); 
        /**
         * The text element to the right of the slider, indicating its current value.
         * @memberOf Slider.prototype
         * @name text
         * @type JXG.Text
         */
        p3.text = t;
    }

    /**
     * Start point of the base line.
     * @memberOf Slider.prototype
     * @name point1
     * @type JXG.Point
     */
    p3.point1 = p1;
    /**
     * End point of the base line.
     * @memberOf Slider.prototype
     * @name point2
     * @type JXG.Point
     */
    p3.point2 = p2;

    /**
     * The baseline the glider is bound to.
     * @memberOf Slider.prototype
     * @name baseline
     * @type JXG.Line
     */
    p3.baseline = l1;
    /**
     * A line on top of the baseline, indicating the slider's progress.
     * @memberOf Slider.prototype
     * @name highline
     * @type JXG.Line
     */
    p3.highline = l2;

    if (withTicks) {
        /**
         * Ticks give a rough indication about the slider's current value.
         * @memberOf Slider.prototype
         * @name ticks
         * @type JXG.Ticks
         */
        p3.ticks = ti;
    }

    // override the point's remove method to ensure the removal of all elements
    p3.remove = function () {
        if (withText) {
            board.removeObject(t);
        }
        
        board.removeObject(l2);

        if (withTicks) {
            l1.removeTicks(ti);
        }

        board.removeObject(l1);
        board.removeObject(p2);
        board.removeObject(p1);


        JXG.Point.prototype.remove.call(p3);
    };

    p1.dump = false;
    p2.dump = false;
    l1.dump = false;
    l2.dump = false;

    p3.elType = 'slider';
    p3.parents = parents;
    p3.subs = {
        point1: p1,
        point2: p2,
        baseLine: l1,
        highLine: l2
    };

    if (withTicks) {
        ti.dump = false;
        p3.subs.ticks = ti;
    }
    
    return p3;
};    

JXG.JSXGraph.registerElement('slider', JXG.createSlider);
