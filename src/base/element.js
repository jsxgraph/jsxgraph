/*
    Copyright 2008-2015
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software dual licensed under the GNU LGPL or MIT License.

    You can redistribute it and/or modify it under the terms of the

      * GNU Lesser General Public License as published by
        the Free Software Foundation, either version 3 of the License, or
        (at your option) any later version
      OR
      * MIT License: https://github.com/jsxgraph/jsxgraph/blob/master/LICENSE.MIT

    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License and
    the MIT License along with JSXGraph. If not, see <http://www.gnu.org/licenses/>
    and <http://opensource.org/licenses/MIT/>.
 */


/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/* depends:
 jxg
 base/constants
 base/coords
 math/math
 options
 parser/geonext
 utils/event
 utils/color
 utils/type
 */

define([
    'jxg', 'base/constants', 'base/coords', 'math/math', 'math/statistics', 'options', 'parser/geonext', 'utils/event', 'utils/color', 'utils/type'
], function (JXG, Const, Coords, Mat, Statistics, Options, GeonextParser, EventEmitter, Color, Type) {

    "use strict";

    /**
     * Constructs a new GeometryElement object.
     * @class This is the basic class for geometry elements like points, circles and lines.
     * @constructor
     * @param {JXG.Board} board Reference to the board the element is constructed on.
     * @param {Object} attributes Hash of attributes and their values.
     * @param {Number} type Element type (a <tt>JXG.OBJECT_TYPE_</tt> value).
     * @param {Number} oclass The element's class (a <tt>JXG.OBJECT_CLASS_</tt> value).
     * @borrows JXG.EventEmitter#on as this.on
     * @borrows JXG.EventEmitter#off as this.off
     * @borrows JXG.EventEmitter#triggerEventHandlers as this.triggerEventHandlers
     * @borrows JXG.EventEmitter#eventHandlers as this.eventHandlers
     */
    JXG.GeometryElement = function (board, attributes, type, oclass) {
        var name, key, attr;

        /**
         * Controls if updates are necessary
         * @type Boolean
         * @default true
         */
        this.needsUpdate = true;

        /**
         * Controls if this element can be dragged. In GEONExT only
         * free points and gliders can be dragged.
         * @type Boolean
         * @default false
         */
        this.isDraggable = false;

        /**
         * If element is in two dimensional real space this is true, else false.
         * @type Boolean
         * @default true
         */
        this.isReal = true;

        /**
         * Stores all dependent objects to be updated when this point is moved.
         * @type Object
         */
        this.childElements = {};

        /**
         * If element has a label subelement then this property will be set to true.
         * @type Boolean
         * @default false
         */
        this.hasLabel = false;

        /**
         * True, if the element is currently highlighted.
         * @type Boolean
         * @default false
         */
        this.highlighted = false;

        /**
         * Stores all Intersection Objects which in this moment are not real and
         * so hide this element.
         * @type Object
         */
        this.notExistingParents = {};

        /**
         * Keeps track of all objects drawn as part of the trace of the element.
         * @see JXG.GeometryElement#traced
         * @see JXG.GeometryElement#clearTrace
         * @see JXG.GeometryElement#numTraces
         * @type Object
         */
        this.traces = {};

        /**
         * Counts the number of objects drawn as part of the trace of the element.
         * @see JXG.GeometryElement#traced
         * @see JXG.GeometryElement#clearTrace
         * @see JXG.GeometryElement#traces
         * @type Number
         */
        this.numTraces = 0;

        /**
         * Stores the  transformations which are applied during update in an array
         * @type Array
         * @see JXG.Transformation
         */
        this.transformations = [];

        /**
         * @type JXG.GeometryElement
         * @default null
         * @private
         */
        this.baseElement = null;

        /**
         * Elements depending on this element are stored here.
         * @type Object
         */
        this.descendants = {};

        /**
         * Elements on which this element depends on are stored here.
         * @type Object
         */
        this.ancestors = {};

        /**
         * Ids of elements on which this element depends directly are stored here.
         * @type Object
         */
        this.parents = [];

        /**
         * Stores variables for symbolic computations
         * @type Object
         */
        this.symbolic = {};

        /**
         * Stores the rendering node for the element.
         * @type Object
         */
        this.rendNode = null;

        /**
         * The string used with {@link JXG.Board#create}
         * @type String
         */
        this.elType = '';

        /**
         * The element is saved with an explicit entry in the file (<tt>true</tt>) or implicitly
         * via a composition.
         * @type Boolean
         * @default true
         */
        this.dump = true;

        /**
         * Subs contains the subelements, created during the create method.
         * @type Object
         */
        this.subs = {};

        /**
         * The position of this element inside the {@link JXG.Board#objectsList}.
         * @type {Number}
         * @default -1
         * @private
         */
        this._pos = -1;

        /**
         * [c,b0,b1,a,k,r,q0,q1]
         *
         * See
         * A.E. Middleditch, T.W. Stacey, and S.B. Tor:
         * "Intersection Algorithms for Lines and Circles",
         * ACM Transactions on Graphics, Vol. 8, 1, 1989, pp 25-40.
         *
         * The meaning of the parameters is:
         * Circle: points p=[p0,p1] on the circle fulfill
         *  a&lt;p,p&gt; + &lt;b,p&gt; + c = 0
         * For convenience we also store
         *  r: radius
         *  k: discriminant = sqrt(&lt;b,b&gt;-4ac)
         *  q=[q0,q1] center
         *
         * Points have radius = 0.
         * Lines have radius = infinity.
         * b: normalized vector, representing the direction of the line.
         *
         * Should be put into Coords, when all elements possess Coords.
         * @type Array
         * @default [1, 0, 0, 0, 1, 1, 0, 0]
         */
        this.stdform = [1, 0, 0, 0, 1, 1, 0, 0];

        /**
         * The methodMap determines which methods can be called from within JessieCode and under which name it
         * can be used. The map is saved in an object, the name of a property is the name of the method used in JessieCode,
         * the value of a property is the name of the method in JavaScript.
         * @type Object
         */
        this.methodMap = {
            setLabel: 'setLabelText',
            label: 'label',
            setName: 'setName',
            getName: 'getName',
            addTransform: 'addTransform',
            setProperty: 'setAttribute',
            setAttribute: 'setAttribute',
            addChild: 'addChild',
            animate: 'animate',
            on: 'on',
            off: 'off',
            trigger: 'trigger'
        };

        /**
         * Quadratic form representation of circles (and conics)
         * @type Array
         * @default [[1,0,0],[0,1,0],[0,0,1]]
         */
        this.quadraticform = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

        /**
         * An associative array containing all visual properties.
         * @type Object
         * @default empty object
         */
        this.visProp = {};

        EventEmitter.eventify(this);

        /**
         * Is the mouse over this element?
         * @type Boolean
         * @default false
         */
        this.mouseover = false;

        /**
         * Time stamp containing the last time this element has been dragged.
         * @type Date
         * @default creation time
         */
        this.lastDragTime = new Date();

        if (arguments.length > 0) {
            /**
             * Reference to the board associated with the element.
             * @type JXG.Board
             */
            this.board = board;

            /**
             * Type of the element.
             * @constant
             * @type number
             */
            this.type = type;

            /**
             * Original type of the element at construction time. Used for removing glider property.
             * @constant
             * @type number
             */
            this._org_type = type;

            /**
             * The element's class.
             * @constant
             * @type number
             */
            this.elementClass = oclass || Const.OBJECT_CLASS_OTHER;

            /**
             * Unique identifier for the element. Equivalent to id-attribute of renderer element.
             * @type String
             */
            this.id = attributes.id;

            name = attributes.name;
            /* If name is not set or null or even undefined, generate an unique name for this object */
            if (!Type.exists(name)) {
                name = this.board.generateName(this);
            }

            if (name !== '') {
                this.board.elementsByName[name] = this;
            }

            /**
             * Not necessarily unique name for the element.
             * @type String
             * @default Name generated by {@link JXG.Board#generateName}.
             * @see JXG.Board#generateName
             */
            this.name = name;

            this.needsRegularUpdate = attributes.needsregularupdate;

            // create this.visPropOld and set default values
            Type.clearVisPropOld(this);

            attr = this.resolveShortcuts(attributes);
            for (key in attr) {
                if (attr.hasOwnProperty(key)) {
                    this._set(key, attr[key]);
                }
            }

            this.visProp.draft = attr.draft && attr.draft.draft;
            this.visProp.gradientangle = '270';
            this.visProp.gradientsecondopacity = this.visProp.fillopacity;
            this.visProp.gradientpositionx = 0.5;
            this.visProp.gradientpositiony = 0.5;
        }
    };

    JXG.extend(JXG.GeometryElement.prototype, /** @lends JXG.GeometryElement.prototype */ {
        /**
         * Add an element as a child to the current element. Can be used to model dependencies between geometry elements.
         * @param {JXG.GeometryElement} obj The dependent object.
         */
        addChild: function (obj) {
            var el, el2;

            this.childElements[obj.id] = obj;
            this.addDescendants(obj);
            obj.ancestors[this.id] = this;

            for (el in this.descendants) {
                if (this.descendants.hasOwnProperty(el)) {
                    this.descendants[el].ancestors[this.id] = this;

                    for (el2 in this.ancestors) {
                        if (this.ancestors.hasOwnProperty(el2)) {
                            this.descendants[el].ancestors[this.ancestors[el2].id] = this.ancestors[el2];
                        }
                    }
                }
            }

            for (el in this.ancestors) {
                if (this.ancestors.hasOwnProperty(el)) {
                    for (el2 in this.descendants) {
                        if (this.descendants.hasOwnProperty(el2)) {
                            this.ancestors[el].descendants[this.descendants[el2].id] = this.descendants[el2];
                        }
                    }
                }
            }
            return this;
        },

        /**
         * Adds the given object to the descendants list of this object and all its child objects.
         * @param {JXG.GeometryElement} obj The element that is to be added to the descendants list.
         * @private
         * @return
         */
        addDescendants: function (obj) {
            var el;

            this.descendants[obj.id] = obj;
            for (el in obj.childElements) {
                if (obj.childElements.hasOwnProperty(el)) {
                    this.addDescendants(obj.childElements[el]);
                }
            }
            return this;
        },

        /**
         * Adds ids of elements to the array this.parents.
         * @param {Array} parents Array of elements or ids of elements.
         * Alternatively, one can give a list of objects as parameters.
         * @returns {JXG.Object} reference to the object itself.
         **/
        addParents: function (parents) {
            var i, len, par;

            if (Type.isArray(parents)) {
                par = parents;
            } else {
                par = arguments;
            }

            len = par.length;
            for (i = 0; i < len; ++i) {
                if (Type.isId(par[i])) {
                    this.parents.push(par[i]);
                } else if (Type.exists(par[i].id)) {
                    this.parents.push(par[i].id);
                }
            }

            this.parents = Type.uniqueArray(this.parents);
        },

        /**
         * Remove an element as a child from the current element.
         * @param {JXG.GeometryElement} obj The dependent object.
         */
        removeChild: function (obj) {
            var el, el2;

            delete this.childElements[obj.id];
            this.removeDescendants(obj);
            delete obj.ancestors[this.id];

            /*
             // I do not know if these addDescendants stuff has to be adapted to removeChild. A.W.
            for (el in this.descendants) {
                if (this.descendants.hasOwnProperty(el)) {
                    delete this.descendants[el].ancestors[this.id];

                    for (el2 in this.ancestors) {
                        if (this.ancestors.hasOwnProperty(el2)) {
                            this.descendants[el].ancestors[this.ancestors[el2].id] = this.ancestors[el2];
                        }
                    }
                }
            }

            for (el in this.ancestors) {
                if (this.ancestors.hasOwnProperty(el)) {
                    for (el2 in this.descendants) {
                        if (this.descendants.hasOwnProperty(el2)) {
                            this.ancestors[el].descendants[this.descendants[el2].id] = this.descendants[el2];
                        }
                    }
                }
            }
            */
            return this;
        },

        /**
         * Removes the given object from the descendants list of this object and all its child objects.
         * @param {JXG.GeometryElement} obj The element that is to be removed from the descendants list.
         * @private
         * @return
         */
        removeDescendants: function (obj) {
            var el;

            delete this.descendants[obj.id];
            for (el in obj.childElements) {
                if (obj.childElements.hasOwnProperty(el)) {
                    this.removeDescendants(obj.childElements[el]);
                }
            }
            return this;
        },

        /**
         * Counts the direct children of an object without counting labels.
         * @private
         * @return {number} Number of children
         */
        countChildren: function () {
            var prop, d,
                s = 0;

            d = this.childElements;
            for (prop in d) {
                if (d.hasOwnProperty(prop) && prop.indexOf('Label') < 0) {
                    s++;
                }
            }
            return s;
        },

        /**
         * Returns the elements name, Used in JessieCode.
         * @returns {String}
         */
        getName: function () {
            return this.name;
        },

        /**
         * Add transformations to this element.
         * @param {JXG.Transformation|Array} transform Either one {@link JXG.Transformation} or an array of {@link JXG.Transformation}s.
         * @returns {JXG.GeometryElement} Reference to the element.
         */
        addTransform: function (transform) {
            return this;
        },

        /**
         * Decides whether an element can be dragged. This is used in {@link JXG.GeometryElement#setPositionDirectly} methods
         * where all parent elements are checked if they may be dragged, too.
         * @private
         * @return {boolean}
         */
        draggable: function () {
            return this.isDraggable && !this.visProp.fixed &&
                !this.visProp.frozen && this.type !== Const.OBJECT_TYPE_GLIDER;
        },

        /**
         * Translates the object by <tt>(x, y)</tt>. In case the element is defined by points, the defining points are
         * translated, e.g. a circle constructed by a center point and a point on the circle line.
         * @param {Number} method The type of coordinates used here. 
         * Possible values are {@link JXG.COORDS_BY_USER} and {@link JXG.COORDS_BY_SCREEN}.
         * @param {Array} coords array of translation vector.
         * @returns {JXG.GeometryElement} Reference to the element object.
         */
        setPosition: function (method, coords) {
            var parents = [], el, i, len, t;

            if (!JXG.exists(this.parents)) {
                return this;
            }

            len = this.parents.length;
            for (i = 0; i < len; ++i) {
                el = this.board.select(this.parents[i]);
                if (Type.isPoint(el)) {
                    if (!el.draggable()) {
                        return this;
                    } else {
                        parents.push(el);
                    }
                }
            }

            if (coords.length === 3) {
                coords = coords.slice(1);
            }

            t = this.board.create('transform', coords, {type: 'translate'});

            // We distinguish two cases:
            // 1) elements which depend on free elements, i.e. arcs and sectors
            // 2) other elements
            //
            // In the first case we simply transform the parents elements
            // In the second case we add a transform to the element.
            //
            len = parents.length;
            if (len > 0) {
                t.applyOnce(parents);
            } else {
                if (this.transformations.length > 0 &&
                        this.transformations[this.transformations.length - 1].isNumericMatrix) {
                    this.transformations[this.transformations.length - 1].melt(t);
                } else {
                    this.addTransform(t);
                }
            }

            /*
             * If - against the default configuration - defining gliders are marked as 
             * draggable, then their position has to be updated now.
             */
            for (i = 0; i < len; ++i) {
                if (parents[i].type === Const.OBJECT_TYPE_GLIDER) {
                    parents[i].updateGlider();
                }
            }

            return this;
        },

        /**
         * Moves an by the difference of two coordinates.
         * @param {Number} method The type of coordinates used here. Possible values are {@link JXG.COORDS_BY_USER} and {@link JXG.COORDS_BY_SCREEN}.
         * @param {Array} coords coordinates in screen/user units
         * @param {Array} oldcoords previous coordinates in screen/user units
         * @returns {JXG.GeometryElement} this element
         */
        setPositionDirectly: function (method, coords, oldcoords) {
            var c = new Coords(method, coords, this.board, false),
                oldc = new Coords(method, oldcoords, this.board, false),
                dc = Statistics.subtract(c.usrCoords, oldc.usrCoords);

            this.setPosition(Const.COORDS_BY_USER, dc);

            return this;
        },

        /**
         * Array of strings containing the polynomials defining the element.
         * Used for determining geometric loci the groebner way.
         * @returns {Array} An array containing polynomials describing the locus of the current object.
         * @public
         */
        generatePolynomial: function () {
            return [];
        },

        /**
         * Animates properties for that object like stroke or fill color, opacity and maybe
         * even more later.
         * @param {Object} hash Object containing properties with target values for the animation.
         * @param {number} time Number of milliseconds to complete the animation.
         * @param {Object} [options] Optional settings for the animation:<ul><li>callback: A function that is called as soon as the animation is finished.</li></ul>
         * @returns {JXG.GeometryElement} A reference to the object
         */
        animate: function (hash, time, options) {
            options = options || {};
            var r, p, i,
                delay = this.board.attr.animationdelay,
                steps = Math.ceil(time / delay),
                self = this,

                animateColor = function (startRGB, endRGB, property) {
                    var hsv1, hsv2, sh, ss, sv;
                    hsv1 = Color.rgb2hsv(startRGB);
                    hsv2 = Color.rgb2hsv(endRGB);

                    sh = (hsv2[0] - hsv1[0]) / steps;
                    ss = (hsv2[1] - hsv1[1]) / steps;
                    sv = (hsv2[2] - hsv1[2]) / steps;
                    self.animationData[property] = [];

                    for (i = 0; i < steps; i++) {
                        self.animationData[property][steps - i - 1] = Color.hsv2rgb(hsv1[0] + (i + 1) * sh, hsv1[1] + (i + 1) * ss, hsv1[2] + (i + 1) * sv);
                    }
                },

                animateFloat = function (start, end, property, round) {
                    var tmp, s;

                    start = parseFloat(start);
                    end = parseFloat(end);

                    // we can't animate without having valid numbers.
                    // And parseFloat returns NaN if the given string doesn't contain
                    // a valid float number.
                    if (isNaN(start) || isNaN(end)) {
                        return;
                    }

                    s = (end - start) / steps;
                    self.animationData[property] = [];

                    for (i = 0; i < steps; i++) {
                        tmp = start + (i + 1) * s;
                        self.animationData[property][steps - i - 1] = round ? Math.floor(tmp) : tmp;
                    }
                };

            this.animationData = {};

            for (r in hash) {
                if (hash.hasOwnProperty(r)) {
                    p = r.toLowerCase();

                    switch (p) {
                    case 'strokecolor':
                    case 'fillcolor':
                        animateColor(this.visProp[p], hash[r], p);
                        break;
                    case 'size':
                        if (!Type.isPoint(this)) {
                            break;
                        }
                        animateFloat(this.visProp[p], hash[r], p, true);
                        break;
                    case 'strokeopacity':
                    case 'strokewidth':
                    case 'fillopacity':
                        animateFloat(this.visProp[p], hash[r], p, false);
                        break;
                    }
                }
            }

            this.animationCallback = options.callback;
            this.board.addAnimation(this);
            return this;
        },

        /**
         * General update method. Should be overwritten by the element itself.
         * Can be used sometimes to commit changes to the object.
         */
        update: function () {
            if (this.visProp.trace) {
                this.cloneToBackground();
            }
            return this;
        },

        /**
         * Provide updateRenderer method.
         * @private
         */
        updateRenderer: function () {
            return this;
        },

        /**
         * Hide the element. It will still exist but not visible on the board.
         */
        hideElement: function () {
            this.visProp.visible = false;
            this.board.renderer.hide(this);

            if (Type.exists(this.label) && this.hasLabel) {
                this.label.hiddenByParent = true;
                if (this.label.visProp.visible) {
                    this.label.hideElement();
                }
            }
            return this;
        },

        /**
         * Make the element visible.
         */
        showElement: function () {
            this.visProp.visible = true;
            this.board.renderer.show(this);

            if (Type.exists(this.label) && this.hasLabel && this.label.hiddenByParent) {
                this.label.hiddenByParent = false;
                if (!this.label.visProp.visible) {
                    this.label.showElement().updateRenderer();
                }
            }
            return this;
        },

        /**
         * Sets the value of property <tt>property</tt> to <tt>value</tt>.
         * @param {String} property The property's name.
         * @param value The new value
         * @private
         */
        _set: function (property, value) {
            property = property.toLocaleLowerCase();

            // Search for entries in visProp with "color" as part of the property name
            // and containing a RGBA string
            if (this.visProp.hasOwnProperty(property) && property.indexOf('color') >= 0 &&
                    Type.isString(value) && value.length === 9 && value.charAt(0) === '#') {
                value = Color.rgba2rgbo(value);
                this.visProp[property] = value[0];
                // Previously: *=. But then, we can only decrease opacity.
                this.visProp[property.replace('color', 'opacity')] = value[1];
            } else {
                this.visProp[property] = value;
            }
        },

        /**
         * Resolves property shortcuts like <tt>color</tt> and expands them, e.g. <tt>strokeColor</tt> and <tt>fillColor</tt>.
         * Writes the expanded properties back to the given <tt>properties</tt>.
         * @param {Object} properties
         * @returns {Object} The given parameter with shortcuts expanded.
         */
        resolveShortcuts: function (properties) {
            var key, i;

            for (key in Options.shortcuts) {
                if (Options.shortcuts.hasOwnProperty(key)) {
                    if (Type.exists(properties[key])) {
                        for (i = 0; i < Options.shortcuts[key].length; i++) {
                            if (!Type.exists(properties[Options.shortcuts[key][i]])) {
                                properties[Options.shortcuts[key][i]] = properties[key];
                            }
                        }
                    }
                }
            }
            return properties;
        },

        /**
         * Updates the element's label text, strips all html.
         * @param {String} str
         */
        setLabelText: function (str) {

            if (Type.exists(this.label)) {
                str = str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                this.label.setText(str);
            }

            return this;
        },

        /**
         * Updates the element's label text and the element's attribute "name", strips all html.
         * @param {String} str
         */
        setName: function (str) {
            str = str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            if (this.elType !== 'slider') {
                this.setLabelText(str);
            }
            this.setAttribute({name: str});
        },

        /**
         * Deprecated alias for {@link JXG.GeometryElement#setAttribute}.
         * @deprecated Use {@link JXG.GeometryElement#setAttribute}.
         */
        setProperty: JXG.shortcut(JXG.GeometryElement.prototype, 'setAttribute'),

        /**
         * Sets an arbitrary number of attributes.
         * @param {Object} attributes An object with attributes.
         * @function
         * @example
         * // Set property directly on creation of an element using the attributes object parameter
         * var board = JXG.JSXGraph.initBoard('jxgbox', {boundingbox: [-1, 5, 5, 1]};
         * var p = board.create('point', [2, 2], {visible: false});
         *
         * // Now make this point visible and fixed:
         * p.setAttribute({
         *     fixed: true,
         *     visible: true
         * });
         */
        setAttribute: function (attributes) {
            var i, key, value, arg, opacity, pair, oldvalue,
                properties = {},
                makeTicksFunction = function (v) {
                    return function (i) {
                        return v;
                    };
                };

            // normalize the user input
            for (i = 0; i < arguments.length; i++) {
                arg = arguments[i];
                if (Type.isString(arg)) {
                    // pairRaw is string of the form 'key:value'
                    pair = arg.split(':');
                    properties[Type.trim(pair[0])] = Type.trim(pair[1]);
                } else if (!Type.isArray(arg)) {
                    // pairRaw consists of objects of the form {key1:value1,key2:value2,...}
                    JXG.extend(properties, arg);
                } else {
                    // pairRaw consists of array [key,value]
                    properties[arg[0]] = arg[1];
                }
            }

            // handle shortcuts
            properties = this.resolveShortcuts(properties);

            for (i in properties) {
                if (properties.hasOwnProperty(i)) {
                    key = i.replace(/\s+/g, '').toLowerCase();
                    value = properties[i];
                    oldvalue = this.visProp[key];

                    switch (key) {
                    case 'name':
                        oldvalue = this.name;
                        delete this.board.elementsByName[this.name];
                        this.name = value;
                        this.board.elementsByName[this.name] = this;
                        break;
                    case 'needsregularupdate':
                        this.needsRegularUpdate = !(value === 'false' || value === false);
                        this.board.renderer.setBuffering(this, this.needsRegularUpdate ? 'auto' : 'static');
                        break;
                    case 'labelcolor':
                        value = Color.rgba2rgbo(value);
                        opacity = value[1];
                        value = value[0];
                        if (opacity === 0) {
                            if (Type.exists(this.label) && this.hasLabel) {
                                this.label.hideElement();
                            }
                        }
                        if (Type.exists(this.label) && this.hasLabel) {
                            this.label.visProp.strokecolor = value;
                            this.board.renderer.setObjectStrokeColor(this.label, value, opacity);
                        }
                        if (this.elementClass === Const.OBJECT_CLASS_TEXT) {
                            this.visProp.strokecolor = value;
                            this.visProp.strokeopacity = opacity;
                            this.board.renderer.setObjectStrokeColor(this, this.visProp.strokecolor, this.visProp.strokeopacity);
                        }
                        break;
                    case 'infoboxtext':
                        if (typeof value === 'string') {
                            this.infoboxText = value;
                        } else {
                            this.infoboxText = false;
                        }
                        break;
                    case 'visible':
                        if (value === 'false' || value === false) {
                            this.visProp.visible = false;
                            this.hideElement();
                        } else if (value === 'true' || value === true) {
                            this.visProp.visible = true;
                            this.showElement();
                        }
                        break;
                    case 'face':
                        if (Type.isPoint(this)) {
                            this.visProp.face = value;
                            this.board.renderer.changePointStyle(this);
                        }
                        break;
                    case 'trace':
                        if (value === 'false' || value === false) {
                            this.clearTrace();
                            this.visProp.trace = false;
                        } else {
                            this.visProp.trace = true;
                        }
                        break;
                    case 'gradient':
                        this.visProp.gradient = value;
                        this.board.renderer.setGradient(this);
                        break;
                    case 'gradientsecondcolor':
                        value = Color.rgba2rgbo(value);
                        this.visProp.gradientsecondcolor = value[0];
                        this.visProp.gradientsecondopacity = value[1];
                        this.board.renderer.updateGradient(this);
                        break;
                    case 'gradientsecondopacity':
                        this.visProp.gradientsecondopacity = value;
                        this.board.renderer.updateGradient(this);
                        break;
                    case 'withlabel':
                        this.visProp.withlabel = value;
                        if (!value) {
                            if (this.label && this.hasLabel) {
                                this.label.hideElement();
                            }
                        } else {
                            if (this.label) {
                                if (this.visProp.visible) {
                                    this.label.showElement();
                                }
                            } else {
                                this.createLabel();
                                if (!this.visProp.visible) {
                                    this.label.hideElement();
                                }
                            }
                        }
                        this.hasLabel = value;
                        break;
                    case 'radius':
                        if (this.type === Const.OBJECT_TYPE_ANGLE || this.type === Const.OBJECT_TYPE_SECTOR) {
                            this.setRadius(value);
                        }
                        break;
                    case 'rotate':
                        if ((this.elementClass === Const.OBJECT_CLASS_TEXT && this.visProp.display === 'internal') ||
                                this.type === Const.OBJECT_TYPE_IMAGE) {
                            this.addRotation(value);
                        }
                        break;
                    case 'ticksdistance':
                        if (this.type === Const.OBJECT_TYPE_TICKS && typeof value === 'number') {
                            this.ticksFunction = makeTicksFunction(value);
                        }
                        break;
                    case 'generatelabelvalue':
                        if (this.type === Const.OBJECT_TYPE_TICKS && typeof value === 'function') {
                            this.generateLabelValue = value;
                        }
                        break;
                    case 'onpolygon':
                        if (this.type === Const.OBJECT_TYPE_GLIDER) {
                            this.onPolygon = !!value;
                        }
                        break;
                    default:
                        if (Type.exists(this.visProp[key]) && (!JXG.Validator[key] || (JXG.Validator[key] &&
                                JXG.Validator[key](value)) || (JXG.Validator[key] &&
                                Type.isFunction(value) && JXG.Validator[key](value())))) {
                            value = value.toLowerCase && value.toLowerCase() === 'false' ? false : value;
                            this._set(key, value);
                        }
                        break;
                    }
                    this.triggerEventHandlers(['attribute:' + key], [oldvalue, value, this]);
                }
            }

            this.triggerEventHandlers(['attribute'], [properties, this]);

            if (!this.visProp.needsregularupdate) {
                this.board.fullUpdate();
            } else {
                this.board.update(this);
            }

            return this;
        },

        /**
         * Deprecated alias for {@link JXG.GeometryElement#getAttribute}.
         * @deprecated Use {@link JXG.GeometryElement#getAttribute}.
         */
        getProperty: JXG.shortcut(JXG.GeometryElement.prototype, 'getAttribute'),

        /**
         * Get the value of the property <tt>key</tt>.
         * @param {String} key The name of the property you are looking for
         * @returns The value of the property
         */
        getAttribute: function (key) {
            var result;
            key = key.toLowerCase();

            switch (key) {
            case 'needsregularupdate':
                result = this.needsRegularUpdate;
                break;
            case 'labelcolor':
                result = this.label.visProp.strokecolor;
                break;
            case 'infoboxtext':
                result = this.infoboxText;
                break;
            case 'withlabel':
                result = this.hasLabel;
                break;
            default:
                result = this.visProp[key];
                break;
            }

            return result;
        },

        /**
         * Set the dash style of an object. See {@link #dash} for a list of available dash styles.
         * You should use {@link #setAttribute} instead of this method.
         * @param {number} dash Indicates the new dash style
         * @private
         */
        setDash: function (dash) {
            this.setAttribute({dash: dash});
            return this;
        },

        /**
         * Notify all child elements for updates.
         * @private
         */
        prepareUpdate: function () {
            this.needsUpdate = true;
            return this;
        },

        /**
         * Removes the element from the construction.  This only removes the SVG or VML node of the element and its label (if available) from
         * the renderer, to remove the element completely you should use {@link JXG.Board#removeObject}.
         */
        remove: function () {
            this.board.renderer.remove(this.board.renderer.getElementById(this.id));

            if (this.hasLabel) {
                this.board.renderer.remove(this.board.renderer.getElementById(this.label.id));
            }
            return this;
        },

        /**
         * Returns the coords object where a text that is bound to the element shall be drawn.
         * Differs in some cases from the values that getLabelAnchor returns.
         * @returns {JXG.Coords} JXG.Coords Place where the text shall be drawn.
         * @see JXG.GeometryElement#getLabelAnchor
         */
        getTextAnchor: function () {
            return new Coords(Const.COORDS_BY_USER, [0, 0], this.board);
        },

        /**
         * Returns the coords object where the label of the element shall be drawn.
         * Differs in some cases from the values that getTextAnchor returns.
         * @returns {JXG.Coords} JXG.Coords Place where the text shall be drawn.
         * @see JXG.GeometryElement#getTextAnchor
         */
        getLabelAnchor: function () {
            return new Coords(Const.COORDS_BY_USER, [0, 0], this.board);
        },

        /**
         * Determines whether the element has arrows at start or end of the arc.
         * @param {Boolean} firstArrow True if there is an arrow at the start of the arc, false otherwise.
         * @param {Boolean} lastArrow True if there is an arrow at the end of the arc, false otherwise.
         */
        setArrow: function (firstArrow, lastArrow) {
            this.visProp.firstarrow = firstArrow;
            this.visProp.lastarrow = lastArrow;
            this.prepareUpdate().update();
            return this;
        },

        /**
         * Creates a gradient nodes in the renderer.
         * @see JXG.SVGRenderer#setGradient
         * @private
         */
        createGradient: function () {
            if (this.visProp.gradient === 'linear' || this.visProp.gradient === 'radial') {
                this.board.renderer.setGradient(this);
            }
        },

        /**
         * Creates a label element for this geometry element.
         * @see #addLabelToElement
         */
        createLabel: function () {
            var attr,
                that = this;

            // this is a dirty hack to resolve the text-dependency. If there is no text element available,
            // just don't create a label. This method is usually not called by a user, so we won't throw
            // an exception here and simply output a warning via JXG.debug.
            if (JXG.elements.text) {
                attr =  Type.deepCopy(this.visProp.label, null);
                attr.id = this.id + 'Label';
                attr.isLabel = true;
                attr.visible = this.visProp.visible;
                attr.anchor = this;
                attr.priv = this.visProp.priv;

                if (this.visProp.withlabel) {
                    this.label = JXG.elements.text(this.board, [0, 0, function () {
                        if (typeof that.name === 'function') {
                            return that.name();
                        }
                        return that.name;
                    }], attr);
                    this.label.needsUpdate = true;
                    this.label.update();

                    this.label.dump = false;

                    if (!this.visProp.visible) {
                        this.label.hiddenByParent = true;
                        this.label.visProp.visible = false;
                    }
                    this.hasLabel = true;
                }
            } else {
                JXG.debug('JSXGraph: Can\'t create label: text element is not available. Make sure you include base/text');
            }

            return this;
        },

        /**
         * Highlights the element.
         * @param {Boolean} [force=false] Force the highlighting
         * @returns {JXG.Board}
         */
        highlight: function (force) {
            force = Type.def(force, false);
            // I know, we have the JXG.Board.highlightedObjects AND JXG.GeometryElement.highlighted and YES we need both.
            // Board.highlightedObjects is for the internal highlighting and GeometryElement.highlighted is for user highlighting
            // initiated by the user, e.g. through custom DOM events. We can't just pick one because this would break user
            // defined highlighting in many ways:
            //  * if overriding the highlight() methods the user had to handle the highlightedObjects stuff, otherwise he'd break
            //    everything (e.g. the pie chart example http://jsxgraph.uni-bayreuth.de/wiki/index.php/Pie_chart (not exactly
            //    user defined but for this type of chart the highlight method was overridden and not adjusted to the changes in here)
            //    where it just kept highlighting until the radius of the pie was far beyond infinity...
            //  * user defined highlighting would get pointless, everytime the user highlights something using .highlight(), it would get
            //    dehighlighted immediately, because highlight puts the element into highlightedObjects and from there it gets dehighlighted
            //    through dehighlightAll.

            // highlight only if not highlighted
            if (this.visProp.highlight && (!this.highlighted || force)) {
                this.highlighted = true;
                this.board.highlightedObjects[this.id] = this;
                this.board.renderer.highlight(this);
            }
            return this;
        },

        /**
         * Uses the "normal" properties of the element.
         * @returns {JXG.Board}
         */
        noHighlight: function () {
            // see comment in JXG.GeometryElement.highlight()

            // dehighlight only if not highlighted
            if (this.highlighted) {
                this.highlighted = false;
                delete this.board.highlightedObjects[this.id];
                this.board.renderer.noHighlight(this);
            }
            return this;
        },

        /**
         * Removes all objects generated by the trace function.
         */
        clearTrace: function () {
            var obj;

            for (obj in this.traces) {
                if (this.traces.hasOwnProperty(obj)) {
                    this.board.renderer.remove(this.traces[obj]);
                }
            }

            this.numTraces = 0;
            return this;
        },

        /**
         * Copy the element to background. This is used for tracing elements.
         * @returns {JXG.GeometryElement} A reference to the element
         */
        cloneToBackground: function () {
            return this;
        },

        /**
         * Dimensions of the smallest rectangle enclosing the element.
         * @returns {Array} The coordinates of the enclosing rectangle in a format like the bounding box in {@link JXG.Board#setBoundingBox}.
         */
        bounds: function () {
            return [0, 0, 0, 0];
        },

        /**
         * Normalize the element's standard form.
         * @private
         */
        normalize: function () {
            this.stdform = Mat.normalize(this.stdform);
            return this;
        },

        /**
         * EXPERIMENTAL. Generate JSON object code of visProp and other properties.
         * @type string
         * @private
         * @ignore
         * @return JSON string containing element's properties.
         */
        toJSON: function () {
            var vis, key,
                json = ['{"name":', this.name];

            json.push(', ' + '"id":' + this.id);

            vis = [];
            for (key in this.visProp) {
                if (this.visProp.hasOwnProperty(key)) {
                    if (Type.exists(this.visProp[key])) {
                        vis.push('"' + key + '":' + this.visProp[key]);
                    }
                }
            }
            json.push(', "visProp":{' + vis.toString() + '}');
            json.push('}');

            return json.join('');
        },


        /**
         * Rotate texts or images by a given degree. Works only for texts where JXG.Text#display equal to "internal".
         * @param {number} angle The degree of the rotation (90 means vertical text).
         * @see JXG.GeometryElement#rotate
         */
        addRotation: function (angle) {
            var tOffInv, tOff, tS, tSInv, tRot,
                that = this;

            if (((this.elementClass === Const.OBJECT_CLASS_TEXT && this.visProp.display === 'internal') ||
                    this.type === Const.OBJECT_TYPE_IMAGE) && angle !== 0) {

                tOffInv = this.board.create('transform', [
                    function () {
                        return -that.X();
                    }, function () {
                        return -that.Y();
                    }
                ], {type: 'translate'});

                tOff = this.board.create('transform', [
                    function () {
                        return that.X();
                    }, function () {
                        return that.Y();
                    }
                ], {type: 'translate'});

                tS = this.board.create('transform', [
                    function () {
                        return that.board.unitX / that.board.unitY;
                    }, function () {
                        return 1;
                    }
                ], {type: 'scale'});

                tSInv = this.board.create('transform', [
                    function () {
                        return that.board.unitY / that.board.unitX;
                    }, function () {
                        return 1;
                    }
                ], {type: 'scale'});

                tRot = this.board.create('transform', [angle * Math.PI / 180], {type: 'rotate'});

                tOffInv.bindTo(this);
                tS.bindTo(this);
                tRot.bindTo(this);
                tSInv.bindTo(this);
                tOff.bindTo(this);
            }

            return this;
        },

        /**
         * Set the highlightStrokeColor of an element
         * @param {String} sColor String which determines the stroke color of an object when its highlighted.
         * @see JXG.GeometryElement#highlightStrokeColor
         * @deprecated Use {@link #setAttribute}
         */
        highlightStrokeColor: function (sColor) {
            this.setAttribute({highlightStrokeColor: sColor});
            return this;
        },

        /**
         * Set the strokeColor of an element
         * @param {String} sColor String which determines the stroke color of an object.
         * @see JXG.GeometryElement#strokeColor
         * @deprecated Use {@link #setAttribute}
         */
        strokeColor: function (sColor) {
            this.setAttribute({strokeColor: sColor});
            return this;
        },

        /**
         * Set the strokeWidth of an element
         * @param {Number} width Integer which determines the stroke width of an outline.
         * @see JXG.GeometryElement#strokeWidth
         * @deprecated Use {@link #setAttribute}
         */
        strokeWidth: function (width) {
            this.setAttribute({strokeWidth: width});
            return this;
        },


        /**
         * Set the fillColor of an element
         * @param {String} fColor String which determines the fill color of an object.
         * @see JXG.GeometryElement#fillColor
         * @deprecated Use {@link #setAttribute}
         */
        fillColor: function (fColor) {
            this.setAttribute({fillColor: fColor});
            return this;
        },

        /**
         * Set the highlightFillColor of an element
         * @param {String} fColor String which determines the fill color of an object when its highlighted.
         * @see JXG.GeometryElement#highlightFillColor
         * @deprecated Use {@link #setAttribute}
         */
        highlightFillColor: function (fColor) {
            this.setAttribute({highlightFillColor: fColor});
            return this;
        },

        /**
         * Set the labelColor of an element
         * @param {String} lColor String which determines the text color of an object's label.
         * @see JXG.GeometryElement#labelColor
         * @deprecated Use {@link #setAttribute}
         */
        labelColor: function (lColor) {
            this.setAttribute({labelColor: lColor});
            return this;
        },

        /**
         * Set the dash type of an element
         * @param {Number} d Integer which determines the way of dashing an element's outline.
         * @see JXG.GeometryElement#dash
         * @deprecated Use {@link #setAttribute}
         */
        dash: function (d) {
            this.setAttribute({dash: d});
            return this;
        },

        /**
         * Set the visibility of an element
         * @param {Boolean} v Boolean which determines whether the element is drawn.
         * @see JXG.GeometryElement#visible
         * @deprecated Use {@link #setAttribute}
         */
        visible: function (v) {
            this.setAttribute({visible: v});
            return this;
        },

        /**
         * Set the shadow of an element
         * @param {Boolean} s Boolean which determines whether the element has a shadow or not.
         * @see JXG.GeometryElement#shadow
         * @deprecated Use {@link #setAttribute}
         */
        shadow: function (s) {
            this.setAttribute({shadow: s});
            return this;
        },

        /**
         * The type of the element as used in {@link JXG.Board#create}.
         * @returns {String}
         */
        getType: function () {
            return this.elType;
        },

        /**
         * List of the element ids resp. values used as parents in {@link JXG.Board#create}.
         * @returns {Array}
         */
        getParents: function () {
            return Type.isArray(this.parents) ? this.parents : [];
        },

        /**
         * Snaps the element to the grid. Only works for points, lines and circles. Points will snap to the grid
         * as defined in their properties {@link JXG.Point#snapSizeX} and {@link JXG.Point#snapSizeY}. Lines and circles
         * will snap their parent points to the grid, if they have {@link JXG.Point#snapToGrid} set to true.
         * @returns {JXG.GeometryElement} Reference to the element.
         */
        snapToGrid: function () {
            return this;
        },

        /**
         * Snaps the element to points. Only works for points. Points will snap to the next point
         * as defined in their properties {@link JXG.Point#attractorDistance} and {@link JXG.Point#attractorUnit}.
         * Lines and circles
         * will snap their parent points to points.
         * @returns {JXG.GeometryElement} Reference to the element.
         */
        snapToPoints: function () {
            return this;
        },

        /**
         * Retrieve a copy of the current visProp.
         * @returns {Object}
         */
        getAttributes: function () {
            var attributes = Type.deepCopy(this.visProp),
                cleanThis = ['attractors', 'snatchdistance', 'traceattributes', 'frozen',
                    'shadow', 'gradientangle', 'gradientsecondopacity', 'gradientpositionx', 'gradientpositiony',
                    'needsregularupdate', 'zoom', 'layer', 'offset'],
                i;

            attributes.id = this.id;
            attributes.name = this.name;

            for (i = 0; i < cleanThis.length; i++) {
                delete attributes[cleanThis[i]];
            }

            return attributes;
        },

        /**
         * Checks whether (x,y) is near the element.
         * @param {Number} x Coordinate in x direction, screen coordinates.
         * @param {Number} y Coordinate in y direction, screen coordinates.
         * @returns {Boolean} True if (x,y) is near the element, False otherwise.
         */
        hasPoint: function (x, y) {
            return false;
        },

        /**
         * Move an element to its nearest grid point.
         * The function uses the coords object of the element as
         * its actual position. If there is no coords object, nothing is done.
         * @param {Boolean} force force snapping independent from what the snaptogrid attribute says
         * @returns {JXG.GeometryElement} Reference to this element
         */
        handleSnapToGrid: function (force) {
            var x, y, ticks,
                sX = this.visProp.snapsizex,
                sY = this.visProp.snapsizey;

            if (!JXG.exists(this.coords)) {
                return this;
            }

            if (this.visProp.snaptogrid || force === true) {
                x = this.coords.usrCoords[1];
                y = this.coords.usrCoords[2];

                if (sX <= 0 && this.board.defaultAxes && this.board.defaultAxes.x.defaultTicks) {
                    ticks = this.board.defaultAxes.x.defaultTicks;
                    sX = ticks.ticksDelta * (ticks.visProp.minorticks + 1);
                }

                if (sY <= 0 && this.board.defaultAxes && this.board.defaultAxes.y.defaultTicks) {
                    ticks = this.board.defaultAxes.y.defaultTicks;
                    sY = ticks.ticksDelta * (ticks.visProp.minorticks + 1);
                }

                // if no valid snap sizes are available, don't change the coords.
                if (sX > 0 && sY > 0) {
                    this.coords.setCoordinates(Const.COORDS_BY_USER, [Math.round(x / sX) * sX, Math.round(y / sY) * sY]);
                }
            }
            return this;
        },

        /**
         * Alias of {@link JXG.GeometryElement#on}.
         */
        addEvent: JXG.shortcut(JXG.GeometryElement.prototype, 'on'),

        /**
         * Alias of {@link JXG.GeometryElement#off}.
         */
        removeEvent: JXG.shortcut(JXG.GeometryElement.prototype, 'off'),

        /* **************************
         *     EVENT DEFINITION
         * for documentation purposes
         * ************************** */

        //region Event handler documentation
        /**
         * @event
         * @description This event is fired whenever the user is hovering over an element.
         * @name JXG.GeometryElement#over
         * @param {Event} e The browser's event object.
         */
        __evt__over: function (e) { },

        /**
         * @event
         * @description This event is fired whenever the user puts the mouse over an element.
         * @name JXG.GeometryElement#mouseover
         * @param {Event} e The browser's event object.
         */
        __evt__mouseover: function (e) { },

        /**
         * @event
         * @description This event is fired whenever the user is leaving an element.
         * @name JXG.GeometryElement#out
         * @param {Event} e The browser's event object.
         */
        __evt__out: function (e) { },

        /**
         * @event
         * @description This event is fired whenever the user puts the mouse away from an element.
         * @name JXG.GeometryElement#mouseout
         * @param {Event} e The browser's event object.
         */
        __evt__mouseout: function (e) { },

        /**
         * @event
         * @description This event is fired whenever the user is moving over an element.
         * @name JXG.GeometryElement#move
         * @param {Event} e The browser's event object.
         */
        __evt__move: function (e) { },

        /**
         * @event
         * @description This event is fired whenever the user is moving the mouse over an element.
         * @name JXG.GeometryElement#mousemove
         * @param {Event} e The browser's event object.
         */
        __evt__mousemove: function (e) { },

        /**
         * @event
         * @description This event is fired whenever the user drags an element.
         * @name JXG.GeometryElement#drag
         * @param {Event} e The browser's event object.
         */
        __evt__drag: function (e) { },

        /**
         * @event
         * @description This event is fired whenever the user drags the element with a mouse.
         * @name JXG.GeometryElement#mousedrag
         * @param {Event} e The browser's event object.
         */
        __evt__mousedrag: function (e) { },

        /**
         * @event
         * @description This event is fired whenever the user drags the element on a touch device.
         * @name JXG.GeometryElement#touchdrag
         * @param {Event} e The browser's event object.
         */
        __evt__touchdrag: function (e) { },

        /**
         * @event
         * @description Whenever the user starts to touch or click an element.
         * @name JXG.GeometryElement#down
         * @param {Event} e The browser's event object.
         */
        __evt__down: function (e) { },

        /**
         * @event
         * @description Whenever the user starts to click an element.
         * @name JXG.GeometryElement#mousedown
         * @param {Event} e The browser's event object.
         */
        __evt__mousedown: function (e) { },

        /**
         * @event
         * @description Whenever the user starts to touch an element.
         * @name JXG.GeometryElement#touchdown
         * @param {Event} e The browser's event object.
         */
        __evt__touchdown: function (e) { },

        /**
         * @event
         * @description Whenever the user stops to touch or click an element.
         * @name JXG.GeometryElement#up
         * @param {Event} e The browser's event object.
         */
        __evt__up: function (e) { },

        /**
         * @event
         * @description Whenever the user releases the mousebutton over an element.
         * @name JXG.GeometryElement#mouseup
         * @param {Event} e The browser's event object.
         */
        __evt__mouseup: function (e) { },

        /**
         * @event
         * @description Whenever the user stops touching an element.
         * @name JXG.GeometryElement#touchup
         * @param {Event} e The browser's event object.
         */
        __evt__touchup: function (e) {},

        /**
         * @event
         * @description Notify everytime an attribute is changed.
         * @name JXG.GeometryElement#attribute
         * @param {Object} o A list of changed attributes and their new value.
         * @param {Object} el Reference to the element
         */
        __evt__attribute: function (o, el) {},

        /**
         * @event
         * @description This is a generic event handler. It exists for every possible attribute that can be set for
         * any element, e.g. if you want to be notified everytime an element's strokecolor is changed, is the event
         * <tt>attribute:strokecolor</tt>.
         * @name JXG.GeometryElement#attribute:&lt;attribute&gt;
         * @param val The old value.
         * @param nval The new value
         * @param {Object} el Reference to the element
         */
        __evt__attribute_: function (val, nval, el) {},

        /**
         * @ignore
         */
        __evt: function () {}
        //endregion

    });

    return JXG.GeometryElement;
});
