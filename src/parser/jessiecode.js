/*
 JessieCode Interpreter and Compiler

    Copyright 2011-2013
        Michael Gerhaeuser,
        Alfred Wassermann

    JessieCode is free software dual licensed under the GNU LGPL or MIT License.

    You can redistribute it and/or modify it under the terms of the

      * GNU Lesser General Public License as published by
        the Free Software Foundation, either version 3 of the License, or
        (at your option) any later version
      OR
      * MIT License: https://github.com/jsxgraph/jsxgraph/blob/master/LICENSE.MIT

    JessieCode is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License and
    the MIT License along with JessieCode. If not, see <http://www.gnu.org/licenses/>
    and <http://opensource.org/licenses/MIT/>.
 */

/*global JXG: true, define: true, window: true, console: true, self: true, document: true, parser: true*/
/*jslint nomen: true, plusplus: true*/

/* depends:
 jxg
 parser/geonext
 base/constants
 base/text
 math/math
 math/geometry
 math/statistics
 utils/type
 utils/uuid
 */

/**
 * @fileoverview JessieCode is a scripting language designed to provide a simple scripting language to build constructions
 * with JSXGraph. It is similar to JavaScript, but prevents access to the DOM. Hence, it can be used in community driven
 * Math portals which want to use JSXGraph to display interactive math graphics.
 */

define([
    'jxg', 'base/constants', 'base/text', 'math/math', 'math/geometry', 'math/statistics', 'utils/type', 'utils/uuid', 'utils/env'
], function (JXG, Const, Text, Mat, Geometry, Statistics, Type, UUID, Env) {

    ;

    /**
     * A JessieCode object provides an interfacce to the parser and stores all variables and objects used within a JessieCode script.
     * The optional argument <tt>code</tt> is interpreted after initializing. To evaluate more code after initializing a JessieCode instance
     * please use {@link JXG.JessieCode#parse}. For code snippets like single expressions use {@link JXG.JessieCode#snippet}.
     * @constructor
     * @param {String} [code] Code to parse.
     * @param {Boolean} [geonext=false] Geonext compatibility mode.
     */
    JXG.JessieCode = function (code, geonext) {
        // Control structures

        /**
         * Stores all variables, local and global. The current scope is determined by {@link JXG.JessieCode#scope}.
         * @type Array
         * @private
         */
        this.sstack = [{}];

        /**
         * Defines the current variable scope.
         * @type Number
         * @private
         */
        this.scope = 0;

        /**
         * A stack used to store the parameter lists for function definitions and calls.
         * @type Array
         * @private
         */
        this.plist = [];

        /**
         * A stack to store debug information (like line and column where it was defined) of a parameter
         * @type Array
         * @private
         */
        this.dpstack = [[]];

        /**
         * Determines the parameter stack scope.
         * @type Number
         * @private
         */
        this.pscope = 0;

        /**
         * Used to store the property-value definition while parsing an object literal.
         * @type Array
         * @private
         */
        this.propstack = [{}];

        /**
         * The current scope of the object literal stack {@link JXG.JessieCode#propstack}.
         * @type Number
         * @private
         */
        this.propscope = 0;

        /**
         * Whenever an element attribute is set via <tt>element.attribute = 'something';</tt>, the element is stored
         * in here, so following attribute changes can be set without the element: <tt>.attribute = 'something else';</tt>.
         * @type JXG.GeometryElement
         * @private
         */
        this.propobj = 0;

        /**
         * Store the left hand side of an assignment. If an element is constructed and no attributes are given, this is
         * used as the element's name.
         * @type Array
         * @private
         */
        this.lhs = [];

        /**
         * lhs flag, used by JXG.JessieCode#replaceNames
         * @type Boolean
         * @default false
         */
        this.isLHS = false;

        /**
         * The id of an HTML node in which innerHTML all warnings are stored (if no <tt>console</tt> object is available).
         * @type String
         * @default 'jcwarn'
         */
        this.warnLog = 'jcwarn';

        /**
         * Store $log messages in case there's no console.
         * @type {Array}
         */
        this.$log = [];

        /**
         * Built-in functions and constants
         * @type Object
         */
        this.builtIn = this.defineBuiltIn();

        /**
         * The board which currently is used to create and look up elements.
         * @type JXG.Board
         */
        this.board = null;

        /**
         * Keep track of which element is created in which line.
         * @type Object
         */
        this.lineToElement = {};

        this.parCurLine = 1;
        this.parCurColumn = 0;
        this.line = 1;
        this.col = 1;

        this.code = '';

        if (typeof code === 'string') {
            this.parse(code, geonext);
        }
    };


    JXG.extend(JXG.JessieCode.prototype, /** @lends JXG.JessieCode.prototype */ {
        /**
         * Create a new parse tree node.
         * @param {String} type Type of node, e.g. node_op, node_var, or node_const
         * @param value The nodes value, e.g. a variables value or a functions body.
         * @param {Array} children Arbitrary number of child nodes.
         */
        node: function (type, value, children) {
            return {
                type: type,
                value: value,
                children: children
            };
        },

        /**
         * Create a new parse tree node. Basically the same as node(), but this builds
         * the children part out of an arbitrary number of parameters, instead of one
         * array parameter.
         * @param {String} type Type of node, e.g. node_op, node_var, or node_const
         * @param value The nodes value, e.g. a variables value or a functions body.
         * @param children Arbitrary number of parameters; define the child nodes.
         */
        createNode: function (type, value, children) {
            var n = this.node(type, value, []),
                i;

            for (i = 2; i < arguments.length; i++) {
                n.children.push(arguments[i]);
            }

            n.line = this.parCurLine;
            n.col = this.parCurColumn;

            return n;
        },

        /**
         * Looks up an {@link JXG.GeometryElement} by its id.
         * @param {String} id
         * @returns {JXG.GeometryElement}
         */
        getElementById: function (id) {
            return this.board.objects[id];
        },

        log: function () {
            this.$log.push(arguments);

            if (typeof console === 'object' && console.log) {
                console.log.apply(console, arguments);
            }
        },

        /**
         * Returns a element creator function which takes two parameters: the parents array and the attributes object.
         * @param {String} vname The element type, e.g. 'point', 'line', 'midpoint'
         * @returns {function}
         */
        creator: (function () {
            // stores the already defined creators
            var _ccache = {}, r;

            r = function (vname) {
                var f;

                // _ccache is global, i.e. it is the same for ALL JessieCode instances.
                // That's why we need the board id here
                if (typeof _ccache[this.board.id + vname] === 'function') {
                    f =  _ccache[this.board.id + vname];
                } else {
                    f = (function (that) {
                        return function (parameters, attributes) {
                            var attr;

                            if (Type.exists(attributes)) {
                                attr = attributes;
                            } else {
                                attr = {name: (that.lhs[that.scope] !== 0 ? that.lhs[that.scope] : '')};
                            }
                            return that.board.create(vname, parameters, attr);
                        };
                    }(this));

                    f.creator = true;
                    _ccache[this.board.id + vname] = f;
                }

                return f;
            };

            r.clearCache = function () {
                _ccache = {};
            };

            return r;
        }()),

        /**
         * Assigns a value to a variable in the current scope.
         * @param {String} vname Variable name
         * @param value Anything
         * @see JXG.JessieCode#sstack
         * @see JXG.JessieCode#scope
         */
        letvar: function (vname, value) {
            if (this.builtIn[vname]) {
                this._warn('"' + vname + '" is a predefined value.');
            }

            this.sstack[this.scope][vname] = value;
        },

        /**
         * Checks if the given variable name can be found in {@link JXG.JessieCode#sstack}.
         * @param {String} vname
         * @returns {Number} The position in the local variable stack where the variable can be found. <tt>-1</tt> if it couldn't be found.
         */
        isLocalVariable: function (vname) {
            var s;
            for (s = this.scope; s > -1; s--) {
                if (Type.exists(this.sstack[s][vname])) {
                    return s;
                }
            }

            return -1;
        },

        /**
         * Checks if the given variable name is a valid creator method.
         * @param {String} vname
         * @returns {Boolean}
         */
        isCreator: function (vname) {
            // check for an element with this name
            return !!JXG.elements[vname];
        },

        /**
         * Checks if the given variable identifier is a valid member of the JavaScript Math Object.
         * @param {String} vname
         * @returns {Boolean}
         */
        isMathMethod: function (vname) {
            return vname !== 'E' && !!Math[vname];
        },

        /**
         * Returns true if the given identifier is a builtIn variable/function.
         * @param {String} vname
         * @returns {Boolean}
         */
        isBuiltIn: function (vname) {
            return !!this.builtIn[vname];
        },

        /**
         * Looks up the value of the given variable.
         * @param {String} vname Name of the variable
         * @param {Boolean} [local=false] Only look up the internal symbol table and don't look for
         * the <tt>vname</tt> in Math or the element list.
         */
        getvar: function (vname, local) {
            var s, undef;

            local = Type.def(local, false);

            s = this.isLocalVariable(vname);
            if (s > -1) {
                return this.sstack[s][vname];
            }

            // check for an element with this name
            if (this.isCreator(vname)) {
                return this.creator(vname);
            }

            if (this.isMathMethod(vname)) {
                return Math[vname];
            }

            if (this.isBuiltIn(vname)) {
                return this.builtIn[vname];
            }

            if (!local) {
                s = this.board.select(vname);
                if (s !== vname) {
                    return s;
                }
            }

            return undef;
        },

        /**
         * Looks up a variable identifier in various tables and generates JavaScript code that could be eval'd to get the value.
         * @param {String} vname Identifier
         * @param {Boolean} [local=false] Don't resolve ids and names of elements
         * @param {Boolean} [withProps=false]
         */
        getvarJS: function (vname, local, withProps) {
            var s, r = '';

            local = Type.def(local, false);
            withProps = Type.def(withProps, false);

            if (Type.indexOf(this.plist[this.plist.length - 1], vname) > -1) {
                return vname;
            }

            s = this.isLocalVariable(vname);
            if (s > -1 && !withProps) {
                return '$jc$.sstack[' + s + '][\'' + vname + '\']';
            }

            // check for an element with this name
            if (this.isCreator(vname)) {
                return '(function () { var a = Array.prototype.slice.call(arguments, 0), props = ' + (withProps ? 'a.pop()' : '{}') + '; return $jc$.board.create.apply($jc$.board, [\'' + vname + '\'].concat([a, props])); })';
            }

            if (withProps) {
                this._error('Syntax error (attribute values are allowed with element creators only)');
            }

            if (this.isMathMethod(vname)) {
                return 'Math.' + vname;
            }

            if (this.isBuiltIn(vname)) {
                // if src does not exist, it is a number. in that case, just return the value.
                return this.builtIn[vname].src || this.builtIn[vname];
            }

            if (!local) {
                if (Type.isId(this.board, vname)) {
                    r = '$jc$.board.objects[\'' + vname + '\']';
                } else if (Type.isName(this.board, vname)) {
                    r = '$jc$.board.elementsByName[\'' + vname + '\']';
                } else if (Type.isGroup(this.board, vname)) {
                    r = '$jc$.board.groups[\'' + vname + '\']';
                }

                return r;
            }

            return '';
        },

        /**
         * Merge all atribute values given with an element creator into one object.
         * @param {Object} o An arbitrary number of objects
         * @returns {Object} All given objects merged into one. If properties appear in more (case sensitive) than one
         * object the last value is taken.
         */
        mergeAttributes: function (o) {
            var i, attr = {};

            for (i = 0; i < arguments.length; i++) {
                attr = Type.deepCopy(attr, arguments[i], true);
            }

            return attr;
        },

        /**
         * Sets the property <tt>what</tt> of {@link JXG.JessieCode#propobj} to <tt>value</tt>
         * @param {JXG.Point|JXG.Text} o
         * @param {String} what
         * @param value
         */
        setProp: function (o, what, value) {
            var par = {}, x, y;

            if (o.elementClass === Const.OBJECT_CLASS_POINT && (what === 'X' || what === 'Y')) {
                // set coords

                what = what.toLowerCase();

                // be advised, we've spotted three cases in your AO:
                // o.isDraggable && typeof value === number:
                //   stay draggable, just set the new coords (e.g. via moveTo)
                // o.isDraggable && typeof value === function:
                //   convert to !o.isDraggable, set the new coords via o.addConstraint()
                // !o.isDraggable:
                //   stay !o.isDraggable, update the given coord by overwriting X/YEval

                if (o.isDraggable && typeof value === 'number') {
                    x = what === 'x' ? value : o.X();
                    y = what === 'y' ? value : o.Y();

                    o.setPosition(Const.COORDS_BY_USER, [x, y]);
                } else if (o.isDraggable && (typeof value === 'function' || typeof value === 'string')) {
                    x = what === 'x' ? value : o.coords.usrCoords[1];
                    y = what === 'y' ? value : o.coords.usrCoords[2];

                    o.addConstraint([x, y]);
                } else if (!o.isDraggable) {
                    x = what === 'x' ? value : o.XEval.origin;
                    y = what === 'y' ? value : o.YEval.origin;

                    o.addConstraint([x, y]);
                }

                this.board.update();
            } else if (o.type === Const.OBJECT_TYPE_TEXT && (what === 'X' || what === 'Y')) {
                if (typeof value === 'number') {
                    o[what] = function () { return value; };
                } else if (typeof value === 'function') {
                    o.isDraggable = false;
                    o[what] = value;
                } else if (typeof value === 'string') {
                    o.isDraggable = false;
                    o[what] = Type.createFunction(value, this.board, null, true);
                    o[what + 'jc'] = value;
                }

                o[what].origin = value;

                this.board.update();
            } else if (o.type && o.elementClass && o.visProp) {
                if (Type.exists(o[o.methodMap[what]]) && typeof o[o.methodMap[what]] !== 'function') {
                    o[o.methodMap[what]] = value;
                } else {
                    par[what] = value;
                    o.setProperty(par);
                }
            } else {
                o[what] = value;
            }
        },

        /**
         * Parses JessieCode
         * @param {String} code
         * @param {Boolean} [geonext=false] Geonext compatibility mode.
         * @param {Boolean} dontstore
         */
        parse: function (code, geonext, dontstore) {
            var i, setTextBackup, ast, result,
                ccode = code.replace(/\r\n/g, '\n').split('\n'),
                cleaned = [];

            if (!dontstore) {
                this.code += code + '\n';
            }

            if (Text) {
                setTextBackup = Text.Text.prototype.setText;
                Text.Text.prototype.setText = Text.Text.prototype.setTextJessieCode;
            }

            try {
                if (!Type.exists(geonext)) {
                    geonext = false;
                }

                for (i = 0; i < ccode.length; i++) {
                    if (geonext) {
                        ccode[i] = JXG.GeonextParser.geonext2JS(ccode[i], this.board);
                    }
                    cleaned.push(ccode[i]);
                }

                code = cleaned.join('\n');
                ast = parser.parse(code);
                result = this.execute(ast);
            } finally {
                // make sure the original text method is back in place
                if (Text) {
                    Text.Text.prototype.setText = setTextBackup;
                }
            }

            return result;
        },

        /**
         * Parses a JessieCode snippet, e.g. "3+4", and wraps it into a function, if desired.
         * @param {String} code A small snippet of JessieCode. Must not be an assignment.
         * @param {Boolean} funwrap If true, the code is wrapped in a function.
         * @param {String} varname Name of the parameter(s)
         * @param {Boolean} [geonext=false] Geonext compatibility mode.
         */
        snippet: function (code, funwrap, varname, geonext) {
            var c, result;

            funwrap = Type.def(funwrap, true);
            varname = Type.def(varname, '');
            geonext = Type.def(geonext, false);

            c = (funwrap ? ' function (' + varname + ') { return ' : '') + code + (funwrap ? '; }' : '') + ';';

            return this.parse(c, geonext, true);
        },

        /**
         * Traverses through the given subtree and changes all values of nodes with the replaced flag set by
         * {@link JXG.JessieCode#replaceNames} to the name of the element (if not empty).
         * @param {Object} node
         */
        replaceIDs: function (node) {
            var i, v;

            if (node.replaced) {
                // these children exist, if node.replaced is set.
                v = this.board.objects[node.children[1][0].value];

                if (Type.exists(v) && v.name !== "") {
                    node.type = 'node_var';
                    node.value = v.name;

                    // maybe it's not necessary, but just to be sure that everything is cleaned up we better delete all
                    // children and the replaced flag
                    node.children.length = 0;
                    delete node.replaced;
                }
            }

            if (node.children) {
                // assignments are first evaluated on the right hand side
                for (i = node.children.length; i > 0; i--) {
                    if (Type.exists(node.children[i - 1])) {
                        node.children[i - 1] = this.replaceIDs(node.children[i - 1]);
                    }

                }
            }

            return node;
        },

        /**
         * Traverses through the given subtree and changes all elements referenced by names through referencing them by ID.
         * An identifier is only replaced if it is not found in all scopes above the current scope and if it
         * has not been blacklisted within the codeblock determined by the given subtree.
         * @param {Object} node
         */
        replaceNames: function (node) {
            var i, v;

            v = node.value;

            // we are interested only in nodes of type node_var and node_op > op_lhs.
            // currently, we are not checking if the id is a local variable. in this case, we're stuck anyway.

            if (node.type === 'node_op' && v === 'op_lhs' && node.children.length === 1) {
                this.isLHS = true;
            } else if (node.type === 'node_var') {
                if (this.isLHS) {
                    this.letvar(v, true);
                } else if (!Type.exists(this.getvar(v, true)) && Type.exists(this.board.elementsByName[v])) {
                    node = this.createReplacementNode(node);
                }
            }

            if (node.children) {
                // assignments are first evaluated on the right hand side
                for (i = node.children.length; i > 0; i--) {
                    if (Type.exists(node.children[i - 1])) {
                        node.children[i - 1] = this.replaceNames(node.children[i - 1]);
                    }
                }
            }

            if (node.type === 'node_op' && node.value === 'op_lhs' && node.children.length === 1) {
                this.isLHS = false;
            }

            return node;
        },

        /**
         * Replaces node_var nodes with node_op&gt;op_execfun nodes, calling the internal $() function with the id of the
         * element accessed by the node_var node.
         * @param {Object} node
         * @returns {Object} op_execfun node
         */
        createReplacementNode: function (node) {
            var v = node.value,
                el = this.board.elementsByName[v];

            node = this.createNode('node_op', 'op_execfun',
                this.createNode('node_var', '$'),
                [this.createNode('node_str', el.id)]);

            node.replaced = true;

            return node;
        },

        /**
         * Search the parse tree below <tt>node</tt> for <em>stationary</em> dependencies, i.e. dependencies hard coded into
         * the function.
         * @param {Object} node
         * @param {Object} result An object where the referenced elements will be stored. Access key is their id.
         */
        collectDependencies: function (node, result) {
            var i, v, e;

            v = node.value;

            if (node.type === 'node_var') {
                e = this.getvar(v);
                if (e && e.visProp && e.type && e.elementClass && e.id) {
                    result[e.id] = e;
                }
            }

            // the $()-function-calls are special because their parameter is given as a string, not as a node_var.
            if (node.type === 'node_op' && node.value === 'op_execfun' && node.children.length > 1 && node.children[0].value === '$' && node.children[1].length > 0) {
                e = node.children[1][0].value;
                result[e] = this.board.objects[e];
            }

            if (node.children) {
                for (i = node.children.length; i > 0; i--) {
                    if (Type.exists(node.children[i - 1])) {
                        this.collectDependencies(node.children[i - 1], result);
                    }

                }
            }
        },

        resolveProperty: function (e, v, compile) {
            compile = Type.def(compile, false);

            // is it a geometry element or a board?
            if (e /*&& e.type && e.elementClass*/ && e.methodMap) {
                // yeah, it is. but what does the user want?
                if (Type.exists(e.subs) && Type.exists(e.subs[v])) {
                    // a subelement it is, good sir.
                    e = e.subs;
                } else if (Type.exists(e.methodMap[v])) {
                    // the user wants to call a method
                    v = e.methodMap[v];
                } else {
                    // the user wants to change an attribute
                    e = e.visProp;
                    v = v.toLowerCase();
                }
            }

            if (!Type.exists(e)) {
                this._error(e + ' is not an object');
            }

            if (!Type.exists(e[v])) {
                this._error('unknown property ' + v);
            }

            if (compile && typeof e[v] === 'function') {
                return function () { return e[v].apply(e, arguments); };
            }

            return e[v];
        },

        /**
         * Resolves the lefthand side of an assignment operation
         * @param node
         * @returns {Object} An object with two properties. <strong>o</strong> which contains the object, and
         * a string <strong>what</strong> which contains the property name.
         */
        getLHS: function (node) {
            var res;

            if (node.type === 'node_var') {
                res = {
                    o: this.sstack[this.scope],
                    what: node.value
                };
            } else if (node.type === 'node_op' && node.value === 'op_property') {
                res = {
                    o: this.execute(node.children[0]),
                    what: node.children[1]
                };
            } else if (node.type === 'node_op' && node.value === 'op_extvalue') {
                res = {
                    o: this.execute(node.children[0]),
                    what: this.execute(node.children[1])
                };
            } else {
                throw new Error('Syntax error: Invalid left-hand side of assignment.');
            }

            return res;
        },

        getLHSCompiler: function (node, js) {
            var res, t;

            if (node.type === 'node_var') {
                res = node.value;
            } else if (node.type === 'node_op' && node.value === 'op_property') {
                res = [
                    this.compile(node.children[0], js),
                    "'" + node.children[1] + "'"
                ];
            } else if (node.type === 'node_op' && node.value === 'op_extvalue') {
                res = [
                    this.compile(node.children[0]),
                    node.children[1].type === 'node_const' ? node.children[1].value : this.compile(node.children[1], js)
                ];
            } else {
                throw new Error('Syntax error: Invalid left-hand side of assignment.');
            }

            return res;
        },

        /**
         * Executes a parse subtree.
         * @param {Object} node
         * @returns {Number|String|Object|Boolean} Something
         * @private
         */
        execute: function (node) {
            var ret, v, i, e, l, undef, list, ilist,
                parents = [],
                // exec fun
                fun, attr, sc,
                // op_use
                b,
                found = false;

            ret = 0;

            if (!node) {
                return ret;
            }

            this.line = node.line;
            this.col = node.col;

            switch (node.type) {
            case 'node_op':
                switch (node.value) {
                case 'op_none':
                    if (node.children[0]) {
                        this.execute(node.children[0]);
                    }
                    if (node.children[1]) {
                        ret = this.execute(node.children[1]);
                    }
                    break;
                case 'op_assign':
                    v = this.getLHS(node.children[0]);

                    this.lhs[this.scope] = v[1];

                    if (v.o.type && v.o.elementClass && v.o.methodMap && v.what === 'label') {
                        this._error('Left-hand side of assignment is read-only.');
                    }

                    ret = this.execute(node.children[1]);
                    if (v.o !== this.sstack[this.scope] || (Type.isArray(v.o) && typeof v.what === 'number')) {
                        // it is either an array component being set or a property of an object.
                        this.setProp(v.o, v.what, ret);
                    } else {
                        // this is just a local variable inside JessieCode
                        this.letvar(v.what, ret);
                    }

                    this.lhs[this.scope] = 0;
                    break;
                case 'op_if':
                    if (this.execute(node.children[0])) {
                        ret = this.execute(node.children[1]);
                    }
                    break;
                case 'op_conditional':
                    // fall through
                case 'op_if_else':
                    if (this.execute(node.children[0])) {
                        ret = this.execute(node.children[1]);
                    } else {
                        ret = this.execute(node.children[2]);
                    }
                    break;
                case 'op_while':
                    while (this.execute(node.children[0])) {
                        this.execute(node.children[1]);
                    }
                    break;
                case 'op_do':
                    do {
                        this.execute(node.children[0]);
                    } while (this.execute(node.children[1]));
                    break;
                case 'op_for':
                    for (this.execute(node.children[0]); this.execute(node.children[1]); this.execute(node.children[2])) {
                        this.execute(node.children[3]);
                    }
                    break;
                case 'op_proplst':
                    if (node.children[0]) {
                        this.execute(node.children[0]);
                    }
                    if (node.children[1]) {
                        this.execute(node.children[1]);
                    }
                    break;
                case 'op_emptyobject':
                    ret = {};
                    break;
                case 'op_proplst_val':
                    this.propstack.push({});
                    this.propscope++;

                    this.execute(node.children[0]);
                    ret = this.propstack[this.propscope];

                    this.propstack.pop();
                    this.propscope--;
                    break;
                case 'op_prop':
                    // child 0: Identifier
                    // child 1: Value
                    this.propstack[this.propscope][node.children[0]] = this.execute(node.children[1]);
                    break;
                case 'op_array':
                    ret = [];
                    l = node.children[0].length;

                    for (i = 0; i < l; i++) {
                        ret.push(this.execute(node.children[0][i]));
                    }

                    break;
                case 'op_extvalue':
                    ret = this.execute(node.children[0]);
                    i = this.execute(node.children[1]);

                    if (typeof i === 'number' && Math.abs(Math.round(i) - i) < Mat.eps) {
                        ret = ret[i];
                    } else {
                        ret = undef;
                    }
                    break;
                case 'op_return':
                    if (this.scope === 0) {
                        this._error('Unexpected return.');
                    } else {
                        return this.execute(node.children[0]);
                    }
                    break;
                case 'op_map':
                    console.log('DEFINE A MAP');
                    ret = function () {};
                    break;
                case 'op_function':
                    // parse the parameter list
                    // after this, the parameters are in pstack

                    list = node.children[0];
                    this.plist.push(list);

                    if (this.board.options.jc.compile) {
                        this.sstack.push({});
                        this.scope++;

                        this.isLHS = false;

                        for (i = 0; i < list.length; i++) {
                            this.sstack[this.scope][list[i]] = list[i];
                        }

                        this.replaceNames(node.children[1]);

                        fun = (function ($jc$, list) {
                            var fun,
                                p = list.join(', '),
                                str = 'var f = function (' + p + ') {\n$jc$.sstack.push([]);\nvar $scope$ = ++$jc$.scope;\nvar r = (function () ' + $jc$.compile(node.children[1], true) + ')();\n$jc$.sstack.pop();\n$jc$.scope--;\nreturn r;\n}; f;';
                            // the function code formatted:
                            /*
                             var f = function (_parameters_) {
                                 // handle the stack
                                 $jc$.sstack.push([]);
                                 $jc$.scope++;

                                 // this is required for stack handling: usually at some point in a function
                                 // there's a return statement, that prevents the cleanup of the stack.
                                 var r = (function () {
                                     _compiledcode_;
                                })();

                                 // clean up the stack
                                 $jc$.sstack.pop();
                                 $jc$.scope--;

                                 // return the result
                                 return r;
                             };
                             f;   // the return value of eval()
                             */

                            try {
                                // yeah, eval is evil, but we don't have much choice here.
                                // the str is well defined and there is no user input in it that we didn't check before

                                /*jslint evil:true*/
                                fun = eval(str);
                                /*jslint evil:false*/

                                return fun;
                            } catch (e) {
                                $jc$._warn('error compiling function\n\n' + str + '\n\n' + e.toString());
                                return function () {};
                            }
                        }(this, list));

                        // clean up scope
                        this.sstack.pop();
                        this.scope--;
                    } else {
                        fun = (function (_pstack, that) {
                            return function () {
                                var r;

                                that.sstack.push({});
                                that.scope++;
                                for (r = 0; r < _pstack.length; r++) {
                                    that.sstack[that.scope][_pstack[r]] = arguments[r];
                                }

                                r = that.execute(node.children[1]);

                                that.sstack.pop();
                                that.scope--;
                                return r;
                            };
                        }(list, this));
                    }

                    fun.node = node;
                    fun.toJS = fun.toString;
                    fun.toString = (function (_that) {
                        return function () {
                            return _that.compile(_that.replaceIDs(Type.deepCopy(node)));
                        };
                    }(this));

                    fun.deps = {};
                    this.collectDependencies(node.children[1], fun.deps);

                    this.plist.pop();

                    ret = fun;
                    break;
                case 'op_execfunmath':
                    console.log('TODO');
                    ret = -1;
                    break;
                case 'op_execfun':
                    // node.children:
                    //   [0]: Name of the function
                    //   [1]: Parameter list as a parse subtree
                    //   [2]: Properties, only used in case of a create function
                    this.dpstack.push([]);
                    this.pscope++;

                    // parameter parsing is done below
                    list = node.children[1];

                    // parse the properties only if given
                    if (Type.exists(node.children[2])) {
                        if (node.children[3]) {
                            ilist = node.children[2];
                            attr = {};

                            for (i = 0; i < ilist.length; i++) {
                                attr = Type.deepCopy(attr, this.execute(ilist[i]), true);
                            }
                        } else {
                            attr = this.execute(node.children[2]);
                        }
                    }

                    // look up the variables name in the variable table
                    fun = this.execute(node.children[0]);

                    // determine the scope the function wants to run in
                    if (fun && fun.sc) {
                        sc = fun.sc;
                    } else {
                        sc = this;
                    }

                    if (!fun.creator && Type.exists(node.children[2])) {
                        this._error('Unexpected value. Only element creators are allowed to have a value after the function call.');
                    }

                    // interpret ALL the parameters
                    for (i = 0; i < list.length; i++) {
                        parents[i] = this.execute(list[i]);
                        this.dpstack.push({
                            line: node.children[1][i].line,
                            col: node.children[1][i].col
                        });
                    }
                    // check for the function in the variable table
                    if (typeof fun === 'function' && !fun.creator) {
                        ret = fun.apply(sc, parents);
                    } else if (typeof fun === 'function' && !!fun.creator) {
                        e = this.line;

                        // creator methods are the only ones that take properties, hence this special case
                        try {
                            ret = fun(parents, attr);
                            ret.jcLineStart = e;
                            ret.jcLineEnd = node.line;

                            for (i = e; i <= node.line; i++) {
                                this.lineToElement[i] = ret;
                            }

                            ret.debugParents = this.dpstack[this.pscope];
                        } catch (ex) {
                            this._error(ex.toString());
                        }
                    } else {
                        this._error('Function \'' + fun + '\' is undefined.');
                    }

                    // clear parameter stack
                    this.dpstack.pop();
                    this.pscope--;
                    break;
                case 'op_property':
                    e = this.execute(node.children[0]);
                    v = node.children[1];

                    ret = this.resolveProperty(e, v, false);

                    // set the scope, in case this is a method the user wants to call
                    if (Type.exists(ret)) {
                        ret.sc = e;
                    }

                    break;
                case 'op_use':
                    // node.children:
                    //   [0]: A string providing the id of the div the board is in.
                    found = false;

                    // search all the boards for the one with the appropriate container div
                    for (b in JXG.boards) {
                        if (JXG.boards.hasOwnProperty(b) && JXG.boards[b].container === node.children[0].toString()) {
                            this.use(JXG.boards[b]);
                            found = true;
                        }
                    }

                    if (!found) {
                        this._error('Board \'' + node.children[0].toString() + '\' not found!');
                    }

                    break;
                case 'op_delete':
                    v = this.getvar(node.children[0]);

                    if (typeof v === 'object' && JXG.exists(v.type) && JXG.exists(v.elementClass)) {
                        this.board.removeObject(v);
                    }
                    break;
                case 'op_equ':
                    // == is intentional
                    /*jslint eqeq:true*/
                    ret = this.execute(node.children[0]) == this.execute(node.children[1]);
                    /*jslint eqeq:false*/
                    break;
                case 'op_neq':
                    // != is intentional
                    /*jslint eqeq:true*/
                    ret = this.execute(node.children[0]) != this.execute(node.children[1]);
                    /*jslint eqeq:true*/
                    break;
                case 'op_approx':
                    ret = Math.abs(this.execute(node.children[0]) - this.execute(node.children[1])) < Mat.eps;
                    break;
                case 'op_grt':
                    ret = this.execute(node.children[0]) > this.execute(node.children[1]);
                    break;
                case 'op_lot':
                    ret = this.execute(node.children[0]) < this.execute(node.children[1]);
                    break;
                case 'op_gre':
                    ret = this.execute(node.children[0]) >= this.execute(node.children[1]);
                    break;
                case 'op_loe':
                    ret = this.execute(node.children[0]) <= this.execute(node.children[1]);
                    break;
                case 'op_or':
                    ret = this.execute(node.children[0]) || this.execute(node.children[1]);
                    break;
                case 'op_and':
                    ret = this.execute(node.children[0]) && this.execute(node.children[1]);
                    break;
                case 'op_not':
                    ret = !this.execute(node.children[0]);
                    break;
                case 'op_add':
                    ret = Statistics.add(this.execute(node.children[0]), this.execute(node.children[1]));
                    break;
                case 'op_sub':
                    ret = Statistics.subtract(this.execute(node.children[0]), this.execute(node.children[1]));
                    break;
                case 'op_div':
                    ret = Statistics.div(this.execute(node.children[0]), this.execute(node.children[1]));
                    break;
                case 'op_mod':
                    // use mathematical modulo, JavaScript implements the symmetric modulo.
                    ret = Statistics.mod(this.execute(node.children[0]), this.execute(node.children[1]), true);
                    break;
                case 'op_mul':
                    ret = this.mul(this.execute(node.children[0]), this.execute(node.children[1]));
                    break;
                case 'op_exp':
                    ret = this.pow(this.execute(node.children[0]),  this.execute(node.children[1]));
                    break;
                case 'op_neg':
                    ret = this.execute(node.children[0]) * -1;
                    break;
                }
                break;

            case 'node_var':
                ret = this.getvar(node.value);
                break;

            case 'node_const':
                ret = Number(node.value);
                break;

            case 'node_const_bool':
                ret = node.value;
                break;

            case 'node_str':
                ret = node.value;
                break;
            }

            return ret;
        },

        /**
         * Compiles a parse tree back to JessieCode.
         * @param {Object} node
         * @param {Boolean} [js=false] Currently ignored. Compile either to JavaScript or back to JessieCode (required for the UI).
         * @returns Something
         * @private
         */
        compile: function (node, js) {
            var e, i, list,
                ret = '';

            if (!Type.exists(js)) {
                js = false;
            }

            if (!node) {
                return ret;
            }

            switch (node.type) {
            case 'node_op':
                switch (node.value) {
                case 'op_none':
                    if (node.children[0]) {
                        ret = this.compile(node.children[0], js);
                    }
                    if (node.children[1]) {
                        ret += this.compile(node.children[1], js);
                    }
                    break;
                case 'op_assign':
                    //e = this.compile(node.children[0], js);
                    if (js) {
                        e = this.getLHSCompiler(node.children[0]);
                        if (Type.isArray(e)) {
                            ret = '$jc$.setProp(' + e[0] + ', ' + e[1] + ', ' + this.compile(node.children[1], js) + ');\n';
                        } else {
                            if (this.isLocalVariable(e) !== this.scope) {
                                this.sstack[this.scope][e] = true;
                            }
                            ret = '$jc$.sstack[' + this.scope + '][\'' + e + '\'] = ' + this.compile(node.children[1], js) + ';\n';
                        }
                    } else {
                        e = this.compile(node.children[0]);
                        ret = e + ' = ' + this.compile(node.children[1], js) + ';\n';
                    }

                    break;
                case 'op_if':
                    ret = ' if (' + this.compile(node.children[0], js) + ') ' + this.compile(node.children[1], js);
                    break;
                case 'op_if_else':
                    ret = ' if (' + this.compile(node.children[0], js) + ')' + this.compile(node.children[1], js);
                    ret += ' else ' + this.compile(node.children[2], js);
                    break;
                case 'op_conditional':
                    ret = '((' + this.compile(node.children[0], js) + ')?(' + this.compile(node.children[1], js);
                    ret += '):(' + this.compile(node.children[2], js) + '))';
                    break;
                case 'op_while':
                    ret = ' while (' + this.compile(node.children[0], js) + ') {\n' + this.compile(node.children[1], js) + '}\n';
                    break;
                case 'op_do':
                    ret = ' do {\n' + this.compile(node.children[0], js) + '} while (' + this.compile(node.children[1], js) + ');\n';
                    break;
                case 'op_for':
                    ret = ' for (' + this.compile(node.children[0], js) + '; ' + this.compile(node.children[1], js) + '; ' + this.compile(node.children[2], js) + ') {\n' + this.compile(node.children[3], js) + '\n}\n';
                    break;
                case 'op_proplst':
                    if (node.children[0]) {
                        ret = this.compile(node.children[0], js) + ', ';
                    }

                    ret += this.compile(node.children[1], js);
                    break;
                case 'op_prop':
                    // child 0: Identifier
                    // child 1: Value
                    ret = node.children[0] + ': ' + this.compile(node.children[1], js);
                    break;
                case 'op_emptyobject':
                    ret = js ? '{}' : '<< >>';
                    break;
                case 'op_proplst_val':
                    ret = this.compile(node.children[0], js);
                    break;
                case 'op_array':
                    list = [];
                    for (i = 0; i < node.children[0].length; i++) {
                        list.push(this.compile(node.children[0][i]), js);
                    }
                    ret = '[' + list.join(', ') + ']';
                    break;
                case 'op_extvalue':
                    ret = this.compile(node.children[0], js) + '[' + this.compile(node.children[1], js) + ']';
                    break;
                case 'op_return':
                    ret = ' return ' + this.compile(node.children[0], js) + ';\n';
                    break;
                case 'op_map':
                    console.log('DEFINE A MAP');
                    ret = '';
                    break;
                case 'op_function':
                    list = node.children[0];
                    ret = ' function (' + list.join(', ') + ') ' + this.compile(node.children[1], js);
                    break;
                case 'op_execfunmath':
                    console.log('TODO');
                    ret = '-1';
                    break;
                case 'op_execfun':
                    // parse the properties only if given
                    if (node.children[2]) {
                        list = [];
                        for (i = 0; i < node.children[2].length; i++) {
                            list.push(this.compile(node.children[2][i], js));
                        }

                        if (js) {
                            e = '$jc$.mergeAttributes(' + list.join(', ') + ')';
                        }
                    }
                    node.children[0].withProps = !!node.children[2];
                    list = [];
                    for (i = 0; i < node.children[1].length; i++) {
                        list.push(this.compile(node.children[1][i], js));
                    }
                    ret = this.compile(node.children[0], js) + '(' + list.join(', ') + (node.children[2] && js ? ', ' + e : '') + ')' + (node.children[2] && !js ? e : '');

                    // save us a function call when compiled to javascript
                    if (js && node.children[0].value === '$') {
                        ret = '$jc$.board.objects[' + this.compile(node.children[1][0], js) + ']';
                    }

                    break;
                case 'op_property':
                    if (js && node.children[1] !== 'X' && node.children[1] !== 'Y') {
                        ret = '$jc$.resolveProperty(' + this.compile(node.children[0], js) + ', \'' + node.children[1] + '\', true)';
                    } else {
                        ret = this.compile(node.children[0], js) + '.' + node.children[1];
                    }
                    break;
                case 'op_use':
                    if (js) {
                        ret = '$jc$.use(JXG.boards[\'' + node.children[0] + '\'])';
                    } else {
                        ret = 'use ' + node.children[0] + ';';
                    }
                    break;
                case 'op_delete':
                    ret = 'delete ' + node.children[0];
                    break;
                case 'op_equ':
                    ret = '(' + this.compile(node.children[0], js) + ' == ' + this.compile(node.children[1], js) + ')';
                    break;
                case 'op_neq':
                    ret = '(' + this.compile(node.children[0], js) + ' != ' + this.compile(node.children[1], js) + ')';
                    break;
                case 'op_approx':
                    ret = '(' + this.compile(node.children[0], js) + ' ~= ' + this.compile(node.children[1], js) + ')';
                    break;
                case 'op_grt':
                    ret = '(' + this.compile(node.children[0], js) + ' > ' + this.compile(node.children[1], js) + ')';
                    break;
                case 'op_lot':
                    ret = '(' + this.compile(node.children[0], js) + ' < ' + this.compile(node.children[1], js) + ')';
                    break;
                case 'op_gre':
                    ret = '(' + this.compile(node.children[0], js) + ' >= ' + this.compile(node.children[1], js) + ')';
                    break;
                case 'op_loe':
                    ret = '(' + this.compile(node.children[0], js) + ' <= ' + this.compile(node.children[1], js) + ')';
                    break;
                case 'op_or':
                    ret = '(' + this.compile(node.children[0], js) + ' || ' + this.compile(node.children[1], js) + ')';
                    break;
                case 'op_and':
                    ret = '(' + this.compile(node.children[0], js) + ' && ' + this.compile(node.children[1], js) + ')';
                    break;
                case 'op_not':
                    ret = '!(' + this.compile(node.children[0], js) + ')';
                    break;
                case 'op_add':
                    if (js) {
                        ret = 'JXG.Math.Statistics.add(' + this.compile(node.children[0], js) + ', ' + this.compile(node.children[1], js) + ')';
                    } else {
                        ret = '(' + this.compile(node.children[0], js) + ' + ' + this.compile(node.children[1], js) + ')';
                    }
                    break;
                case 'op_sub':
                    if (js) {
                        ret = 'JXG.Math.Statistics.subtract(' + this.compile(node.children[0], js) + ', ' + this.compile(node.children[1], js) + ')';
                    } else {
                        ret = '(' + this.compile(node.children[0], js) + ' - ' + this.compile(node.children[1], js) + ')';
                    }
                    break;
                case 'op_div':
                    if (js) {
                        ret = 'JXG.Math.Statistics.div(' + this.compile(node.children[0], js) + ', ' + this.compile(node.children[1], js) + ')';
                    } else {
                        ret = '(' + this.compile(node.children[0], js) + ' / ' + this.compile(node.children[1], js) + ')';
                    }
                    break;
                case 'op_mod':
                    if (js) {
                        ret = 'JXG.Math.mod(' + this.compile(node.children[0], js) + ', ' + this.compile(node.children[1], js) + ', true)';
                    } else {
                        ret = '(' + this.compile(node.children[0], js) + ' % ' + this.compile(node.children[1], js) + ')';
                    }
                    break;
                case 'op_mul':
                    if (js) {
                        ret = '$jc$.mul(' + this.compile(node.children[0], js) + ', ' + this.compile(node.children[1], js) + ')';
                    } else {
                        ret = '(' + this.compile(node.children[0], js) + ' * ' + this.compile(node.children[1], js) + ')';
                    }
                    break;
                case 'op_exp':
                    if (js) {
                        ret = '$jc$.pow(' + this.compile(node.children[0], js) + ', ' + this.compile(node.children[1], js) + ')';
                    } else {
                        ret = '(' + this.compile(node.children[0], js) + '^' + this.compile(node.children[1], js) + ')';
                    }
                    break;
                case 'op_neg':
                    ret = '(-' + this.compile(node.children[0], js) + ')';
                    break;
                }
                break;

            case 'node_var':
                if (js) {
                    ret = this.getvarJS(node.value, false, node.withProps);
                } else {
                    ret = node.value;
                }
                break;

            case 'node_const':
                ret = node.value;
                break;

            case 'node_const_bool':
                ret = node.value;
                break;

            case 'node_str':
                ret = '\'' + node.value.replace(/'/g, '\\\'') + '\'';
                break;
            }

            if (node.needsBrackets) {
                ret = '{\n' + ret + '}\n';
            }

            return ret;
        },

        /**
         * This is used as the global X() function.
         * @param {JXG.Point|JXG.Text} e
         * @returns {Number}
         */
        X: function (e) {
            return e.X();
        },

        /**
         * This is used as the global Y() function.
         * @param {JXG.Point|JXG.Text} e
         * @returns {Number}
         */
        Y: function (e) {
            return e.Y();
        },

        /**
         * This is used as the global V() function.
         * @param {Glider|Slider} e
         * @returns {Number}
         */
        V: function (e) {
            return e.Value();
        },

        /**
         * This is used as the global L() function.
         * @param {JXG.Line} e
         * @returns {Number}
         */
        L: function (e) {
            return e.L();
        },

        /**
         * This is used as the global dist() function.
         * @param {JXG.Point} p1
         * @param {JXG.Point} p2
         * @returns {Number}
         */
        dist: function (p1, p2) {
            if (!Type.exists(p1) || !Type.exists(p1.Dist)) {
                this._error('Error: Can\'t calculate distance.');
            }

            return p1.Dist(p2);
        },

        /**
         * Multiplication of vectors and numbers
         * @param {Number|Array} a
         * @param {Number|Array} b
         * @returns {Number|Array} (Inner) product of the given input values.
         */
        mul: function (a, b) {
            if (Type.isArray(a) * Type.isArray(b)) {
                return Mat.innerProduct(a, b, Math.min(a.length, b.length));
            }

            return Statistics.multiply(a, b);
        },

        /**
         * Pow function wrapper to allow direct usage of sliders.
         * @param {Number|Slider} a
         * @param {Number|Slider} b
         * @returns {Number}
         */
        pow: function (a, b) {
            a = Type.evalSlider(a);
            b = Type.evalSlider(b);

            return Math.pow(a, b);
        },

        ifthen: function (cond, v1, v2) {
            if (cond) {
                return v1;
            }

            return v2;
        },

        use: function (board) {
            this.board = board;
            this.builtIn.$board = board;
            this.builtIn.$board.src = '$jc$.board';
        },

        /**
         * Find the first symbol to the given value from the given scope upwards.
         * @param v Value
         * @param {Number} [scope=-1] The scope, default is to start with current scope (-1).
         * @returns {Array} An array containing the symbol and the scope if a symbol could be found,
         * an empty array otherwise;
         */
        findSymbol: function (v, scope) {
            var s, i;

            scope = Type.def(scope, -1);

            if (scope === -1) {
                scope = this.scope;
            }

            for (s = scope; s >= 0; s--) {
                for (i in this.sstack[s]) {
                    if (this.sstack[s].hasOwnProperty(i) && this.sstack[s][i] === v) {
                        return [i, s];
                    }
                }
            }

            return [];
        },

        /**
         * Defines built in methods and constants.
         * @returns {Object} BuiltIn control object
         */
        defineBuiltIn: function () {
            var that = this,
                builtIn = {
                    PI: Math.PI,
                    EULER: Math.E,
                    X: that.X,
                    Y: that.Y,
                    V: that.V,
                    L: that.L,
                    dist: that.dist,
                    rad: Geometry.rad,
                    deg: Geometry.trueAngle,
                    factorial: Mat.factorial,
                    trunc: Type.trunc,
                    IfThen: that.ifthen,
                    '$': that.getElementById,
                    '$board': that.board,
                    '$log': that.log
                };

            // special scopes for factorial, deg, and rad
            builtIn.rad.sc = Geometry;
            builtIn.deg.sc = Geometry;
            builtIn.factorial.sc = Mat;

            // set the javascript equivalent for the builtIns
            // some of the anonymous functions should be replaced by global methods later on
            // EULER and PI don't get a source attribute - they will be lost anyways and apparently
            // some browser will throw an exception when a property is assigned to a primitive value.
            builtIn.X.src = '$jc$.X';
            builtIn.Y.src = '$jc$.Y';
            builtIn.V.src = '$jc$.V';
            builtIn.L.src = '$jc$.L';
            builtIn.dist.src = '$jc$.dist';
            builtIn.rad.src = 'JXG.Math.Geometry.rad';
            builtIn.deg.src = 'JXG.Math.Geometry.trueAngle';
            builtIn.factorial.src = 'JXG.Math.factorial';
            builtIn.trunc.src = 'JXG.trunc';
            builtIn.IfThen.src = '$jc$.ifthen';
            // usually unused, see node_op > op_execfun
            builtIn.$.src = '(function (n) { return $jc$.board.select(n); })';
            if (builtIn.$board) {
                builtIn.$board.src = '$jc$.board';
            }
            builtIn.$log.src = '$jc$.log';

            return builtIn;
        },

        /**
         * Output a debugging message. Uses debug console, if available. Otherwise an HTML element with the
         * id "debug" and an innerHTML property is used.
         * @param {String} log
         * @private
         */
        _debug: function (log) {
            if (typeof console === 'object') {
                console.log(log);
            } else if (Env.isBrowser && document && document.getElementById('debug') !== null) {
                document.getElementById('debug').innerHTML += log + '<br />';
            }
        },

        /**
         * Throws an exception with the given error message.
         * @param {String} msg Error message
         */
        _error: function (msg) {
            var e = new Error('Error(' + this.line + '): ' + msg);
            e.line = this.line;
            throw e;
        },

        /**
         * Output a warning message using {@link JXG#debug} and precedes the message with "Warning: ".
         * @param {String} msg
         */
        _warn: function (msg) {
            if (typeof console === 'object') {
                console.log('Warning(' + this.line + '): ' + msg);
            } else if (Env.isBrowser && document && document.getElementById(this.warnLog) !== null) {
                document.getElementById(this.warnLog).innerHTML += 'Warning(' + this.line + '): ' + msg + '<br />';
            }
        },

        _log: function (msg) {
            if (typeof window !== 'object' && typeof self === 'object' && self.postMessage) {
                self.postMessage({type: 'log', msg: 'Log: ' + msg.toString()});
            } else {
                console.log('Log: ', arguments);
            }
        }

    });

/* parser generated by jison 0.4.4 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"Program":3,"StatementList":4,"EOF":5,"IfStatement":6,"IF":7,"(":8,"Expression":9,")":10,"Statement":11,"ELSE":12,"LoopStatement":13,"WHILE":14,"FOR":15,";":16,"DO":17,"UnaryStatement":18,"USE":19,"IDENTIFIER":20,"DELETE":21,"ReturnStatement":22,"RETURN":23,"EmptyStatement":24,"StatementBlock":25,"{":26,"}":27,"ExpressionStatement":28,"AssignmentExpression":29,",":30,"ConditionalExpression":31,"LeftHandSideExpression":32,"=":33,"LogicalORExpression":34,"?":35,":":36,"LogicalANDExpression":37,"||":38,"EqualityExpression":39,"&&":40,"RelationalExpression":41,"==":42,"!=":43,"~=":44,"AdditiveExpression":45,"<":46,">":47,"<=":48,">=":49,"MultiplicativeExpression":50,"+":51,"-":52,"ExponentExpression":53,"*":54,"/":55,"%":56,"UnaryExpression":57,"^":58,"!":59,"MemberExpression":60,"CallExpression":61,"PrimaryExpression":62,"FunctionExpression":63,".":64,"[":65,"]":66,"BasicLiteral":67,"ObjectLiteral":68,"ArrayLiteral":69,"NullLiteral":70,"BooleanLiteral":71,"StringLiteral":72,"NumberLiteral":73,"NULL":74,"TRUE":75,"FALSE":76,"STRING":77,"NUMBER":78,"NAN":79,"INFINITY":80,"ElementList":81,"<<":82,">>":83,"PropertyList":84,"Property":85,"PropertyName":86,"Arguments":87,"AttributeList":88,"Attribute":89,"FUNCTION":90,"ParameterDefinitionList":91,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",7:"IF",8:"(",10:")",12:"ELSE",14:"WHILE",15:"FOR",16:";",17:"DO",19:"USE",20:"IDENTIFIER",21:"DELETE",23:"RETURN",26:"{",27:"}",30:",",33:"=",35:"?",36:":",38:"||",40:"&&",42:"==",43:"!=",44:"~=",46:"<",47:">",48:"<=",49:">=",51:"+",52:"-",54:"*",55:"/",56:"%",58:"^",59:"!",64:".",65:"[",66:"]",74:"NULL",75:"TRUE",76:"FALSE",77:"STRING",78:"NUMBER",79:"NAN",80:"INFINITY",82:"<<",83:">>",90:"FUNCTION"},
productions_: [0,[3,2],[6,5],[6,7],[13,5],[13,9],[13,7],[18,2],[18,2],[22,2],[22,3],[24,1],[25,3],[4,2],[4,0],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[28,2],[9,1],[9,3],[29,1],[29,3],[31,1],[31,5],[34,1],[34,3],[37,1],[37,3],[39,1],[39,3],[39,3],[39,3],[41,1],[41,3],[41,3],[41,3],[41,3],[45,1],[45,3],[45,3],[50,1],[50,3],[50,3],[50,3],[53,1],[53,3],[57,1],[57,2],[57,2],[57,2],[32,1],[32,1],[60,1],[60,1],[60,3],[60,4],[62,1],[62,1],[62,1],[62,1],[62,3],[67,1],[67,1],[67,1],[67,1],[70,1],[71,1],[71,1],[72,1],[73,1],[73,1],[73,1],[69,2],[69,3],[68,2],[68,3],[84,1],[84,3],[85,3],[86,1],[86,1],[86,1],[61,2],[61,3],[61,2],[61,4],[61,3],[87,2],[87,3],[88,1],[88,3],[89,1],[89,1],[81,1],[81,3],[63,4],[63,5],[91,1],[91,3]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1: return $$[$0-1];
break;
case 2: this.$ = AST.createNode(lc(_$[$0-4]), 'node_op', 'op_if', $$[$0-2], $$[$0]);
break;
case 3: this.$ = AST.createNode(lc(_$[$0-6]), 'node_op', 'op_if_else', $$[$0-4], $$[$0-2], $$[$0]);
break;
case 4: this.$ = AST.createNode(lc(_$[$0-4]), 'node_op', 'op_while', $$[$0-2], $$[$0]);
break;
case 5: this.$ = AST.createNode(lc(_$[$0-8]), 'node_op', 'op_for', $$[$0-6], $$[$0-4], $$[$0-2], $$[$0]);
break;
case 6: this.$ = AST.createNode(lc(_$[$0-6]), 'node_op', 'op_do', $$[$0-5], $$[$0-2]);
break;
case 7: this.$ = AST.createNode(lc(_$[$0-1]), 'node_op', 'op_use', $$[$0]);
break;
case 8: this.$ = AST.createNode(lc(_$[$0-1]), 'node_op', 'op_delete', $$[$0]);
break;
case 9: this.$ = AST.createNode(lc(_$[$0-1]), 'node_op', 'op_return', undefined);
break;
case 10: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_return', $$[$0-1]);
break;
case 11: this.$ = AST.createNode(lc(_$[$0]), 'node_op', 'op_none');
break;
case 12: this.$ = $$[$0-1]; this.$.needsBrackets = true;
break;
case 13: this.$ = AST.createNode(lc(_$[$0-1]), 'node_op', 'op_none', $$[$0-1], $$[$0]);
break;
case 14: this.$ = AST.createNode(lc(_$[$0]), 'node_op', 'op_none');
break;
case 15: this.$ = $$[$0];
break;
case 16: this.$ = $$[$0];
break;
case 17: this.$ = $$[$0];
break;
case 18: this.$ = $$[$0];
break;
case 19: this.$ = $$[$0];
break;
case 20: this.$ = $$[$0];
break;
case 21: this.$ = $$[$0];
break;
case 22: this.$ = $$[$0-1];
break;
case 23: this.$ = $$[$0];
break;
case 24: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_none', $$[$0-2], $$[$0]);
break;
case 25: this.$ = $$[$0];
break;
case 26: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_assign', $$[$0-2], $$[$0]);
break;
case 27: this.$ = $$[$0];
break;
case 28: this.$ = AST.createNode(lc(_$[$0-4]), 'node_op', 'op_conditional', $$[$0-4], $$[$0-2], $$[$0]);
break;
case 29: this.$ = $$[$0];
break;
case 30: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_or', $$[$0-2], $$[$0]);
break;
case 31: this.$ = $$[$0];
break;
case 32: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_and', $$[$0-2], $$[$0]);
break;
case 33: this.$ = $$[$0];
break;
case 34: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_equ', $$[$0-2], $$[$0]);
break;
case 35: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_neq', $$[$0-2], $$[$0]);
break;
case 36: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_approx', $$[$0-2], $$[$0]);
break;
case 37: this.$ = $$[$0];
break;
case 38: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_lot', $$[$0-2], $$[$0]);
break;
case 39: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_grt', $$[$0-2], $$[$0]);
break;
case 40: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_loe', $$[$0-2], $$[$0]);
break;
case 41: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_gre', $$[$0-2], $$[$0]);
break;
case 42: this.$ = $$[$0];
break;
case 43: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_add', $$[$0-2], $$[$0]);
break;
case 44: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_sub', $$[$0-2], $$[$0]);
break;
case 45: this.$ = $$[$0];
break;
case 46: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_mul', $$[$0-2], $$[$0]);
break;
case 47: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_div', $$[$0-2], $$[$0]);
break;
case 48: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_mod', $$[$0-2], $$[$0]);
break;
case 49: this.$ = $$[$0];
break;
case 50: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_exp', $$[$0-2], $$[$0]);
break;
case 51: this.$ = $$[$0];
break;
case 52: this.$ = AST.createNode(lc(_$[$0-1]), 'node_op', 'op_not', $$[$0]);
break;
case 53: this.$ = $$[$0];
break;
case 54: this.$ = AST.createNode(lc(_$[$0-1]), 'node_op', 'op_neg', $$[$0]);
break;
case 55: this.$ = $$[$0];
break;
case 56: this.$ = $$[$0];
break;
case 57: this.$ = $$[$0];
break;
case 58: this.$ = $$[$0];
break;
case 59: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_property', $$[$0-2], $$[$0]);
break;
case 60: this.$ = AST.createNode(lc(_$[$0-3]), 'node_op', 'op_extvalue', $$[$0-3], $$[$0-1]);
break;
case 61: this.$ = AST.createNode(lc(_$[$0]), 'node_var', $$[$0]);
break;
case 62: this.$ = $$[$0];
break;
case 63: this.$ = $$[$0];
break;
case 64: this.$ = $$[$0];
break;
case 65: this.$ = $$[$0-1];
break;
case 66: this.$ = $$[$0];
break;
case 67: this.$ = $$[$0];
break;
case 68: this.$ = $$[$0];
break;
case 69: this.$ = $$[$0];
break;
case 70: this.$ = AST.createNode(lc(_$[$0]), 'node_const', null);
break;
case 71: this.$ = AST.createNode(lc(_$[$0]), 'node_const_bool', true);
break;
case 72: this.$ = AST.createNode(lc(_$[$0]), 'node_const_bool', false);
break;
case 73: this.$ = AST.createNode(lc(_$[$0]), 'node_str', $$[$0].substring(1, $$[$0].length - 1));
break;
case 74: this.$ = AST.createNode(lc(_$[$0]), 'node_const', parseFloat($$[$0]));
break;
case 75: this.$ = AST.createNode(lc(_$[$0]), 'node_const', NaN);
break;
case 76: this.$ = AST.createNode(lc(_$[$0]), 'node_const', Infinity);
break;
case 77: this.$ = AST.createNode(lc(_$[$0-1]), 'node_op', 'op_array', []);
break;
case 78: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_array', $$[$0-1]);
break;
case 79: this.$ = AST.createNode(lc(_$[$0-1]), 'node_op', 'op_emptyobject', {});
break;
case 80: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_proplst_val', $$[$0-1]);
break;
case 81: this.$ = $$[$0];
break;
case 82: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_proplst', $$[$0-2], $$[$0]);
break;
case 83: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_prop', $$[$0-2], $$[$0]);
break;
case 84: this.$ = $$[$0];
break;
case 85: this.$ = $$[$0];
break;
case 86: this.$ = $$[$0];
break;
case 87: this.$ = AST.createNode(lc(_$[$0-1]), 'node_op', 'op_execfun', $$[$0-1], $$[$0]);
break;
case 88: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_execfun', $$[$0-2], $$[$0-1], $$[$0], true);
break;
case 89: this.$ = AST.createNode(lc(_$[$0-1]), 'node_op', 'op_execfun', $$[$0-1], $$[$0]);
break;
case 90: this.$ = AST.createNode(lc(_$[$0-3]), 'node_op', 'op_extvalue', $$[$0-3], $$[$0-1]);
break;
case 91: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_property', $$[$0-2], $$[$0]);
break;
case 92: this.$ = [];
break;
case 93: this.$ = $$[$0-1];
break;
case 94: this.$ = [$$[$0]];
break;
case 95: this.$ = $$[$0-2].concat($$[$0]);
break;
case 96: this.$ = AST.createNode(lc(_$[$0]), 'node_var', $$[$0]);
break;
case 97: this.$ = $$[$0];
break;
case 98: this.$ = [$$[$0]];
break;
case 99: this.$ = $$[$0-2].concat($$[$0]);
break;
case 100: this.$ = AST.createNode(lc(_$[$0-3]), 'node_op', 'op_function', [], $$[$0]);
break;
case 101: this.$ = AST.createNode(lc(_$[$0-4]), 'node_op', 'op_function', $$[$0-2], $$[$0]);
break;
case 102: this.$ = [$$[$0]];
break;
case 103: this.$ = $$[$0-2].concat($$[$0]);
break;
}
},
table: [{3:1,4:2,5:[2,14],7:[2,14],8:[2,14],14:[2,14],15:[2,14],16:[2,14],17:[2,14],19:[2,14],20:[2,14],21:[2,14],23:[2,14],26:[2,14],51:[2,14],52:[2,14],59:[2,14],65:[2,14],74:[2,14],75:[2,14],76:[2,14],77:[2,14],78:[2,14],79:[2,14],80:[2,14],82:[2,14],90:[2,14]},{1:[3]},{5:[1,3],6:6,7:[1,13],8:[1,36],9:20,11:4,13:7,14:[1,14],15:[1,15],16:[1,21],17:[1,16],18:8,19:[1,17],20:[1,32],21:[1,18],22:9,23:[1,19],24:11,25:5,26:[1,12],28:10,29:22,31:23,32:24,34:25,37:28,39:31,41:38,45:45,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{1:[2,1]},{5:[2,13],7:[2,13],8:[2,13],14:[2,13],15:[2,13],16:[2,13],17:[2,13],19:[2,13],20:[2,13],21:[2,13],23:[2,13],26:[2,13],27:[2,13],51:[2,13],52:[2,13],59:[2,13],65:[2,13],74:[2,13],75:[2,13],76:[2,13],77:[2,13],78:[2,13],79:[2,13],80:[2,13],82:[2,13],90:[2,13]},{5:[2,15],7:[2,15],8:[2,15],12:[2,15],14:[2,15],15:[2,15],16:[2,15],17:[2,15],19:[2,15],20:[2,15],21:[2,15],23:[2,15],26:[2,15],27:[2,15],51:[2,15],52:[2,15],59:[2,15],65:[2,15],74:[2,15],75:[2,15],76:[2,15],77:[2,15],78:[2,15],79:[2,15],80:[2,15],82:[2,15],90:[2,15]},{5:[2,16],7:[2,16],8:[2,16],12:[2,16],14:[2,16],15:[2,16],16:[2,16],17:[2,16],19:[2,16],20:[2,16],21:[2,16],23:[2,16],26:[2,16],27:[2,16],51:[2,16],52:[2,16],59:[2,16],65:[2,16],74:[2,16],75:[2,16],76:[2,16],77:[2,16],78:[2,16],79:[2,16],80:[2,16],82:[2,16],90:[2,16]},{5:[2,17],7:[2,17],8:[2,17],12:[2,17],14:[2,17],15:[2,17],16:[2,17],17:[2,17],19:[2,17],20:[2,17],21:[2,17],23:[2,17],26:[2,17],27:[2,17],51:[2,17],52:[2,17],59:[2,17],65:[2,17],74:[2,17],75:[2,17],76:[2,17],77:[2,17],78:[2,17],79:[2,17],80:[2,17],82:[2,17],90:[2,17]},{5:[2,18],7:[2,18],8:[2,18],12:[2,18],14:[2,18],15:[2,18],16:[2,18],17:[2,18],19:[2,18],20:[2,18],21:[2,18],23:[2,18],26:[2,18],27:[2,18],51:[2,18],52:[2,18],59:[2,18],65:[2,18],74:[2,18],75:[2,18],76:[2,18],77:[2,18],78:[2,18],79:[2,18],80:[2,18],82:[2,18],90:[2,18]},{5:[2,19],7:[2,19],8:[2,19],12:[2,19],14:[2,19],15:[2,19],16:[2,19],17:[2,19],19:[2,19],20:[2,19],21:[2,19],23:[2,19],26:[2,19],27:[2,19],51:[2,19],52:[2,19],59:[2,19],65:[2,19],74:[2,19],75:[2,19],76:[2,19],77:[2,19],78:[2,19],79:[2,19],80:[2,19],82:[2,19],90:[2,19]},{5:[2,20],7:[2,20],8:[2,20],12:[2,20],14:[2,20],15:[2,20],16:[2,20],17:[2,20],19:[2,20],20:[2,20],21:[2,20],23:[2,20],26:[2,20],27:[2,20],51:[2,20],52:[2,20],59:[2,20],65:[2,20],74:[2,20],75:[2,20],76:[2,20],77:[2,20],78:[2,20],79:[2,20],80:[2,20],82:[2,20],90:[2,20]},{5:[2,21],7:[2,21],8:[2,21],12:[2,21],14:[2,21],15:[2,21],16:[2,21],17:[2,21],19:[2,21],20:[2,21],21:[2,21],23:[2,21],26:[2,21],27:[2,21],51:[2,21],52:[2,21],59:[2,21],65:[2,21],74:[2,21],75:[2,21],76:[2,21],77:[2,21],78:[2,21],79:[2,21],80:[2,21],82:[2,21],90:[2,21]},{4:59,7:[2,14],8:[2,14],14:[2,14],15:[2,14],16:[2,14],17:[2,14],19:[2,14],20:[2,14],21:[2,14],23:[2,14],26:[2,14],27:[2,14],51:[2,14],52:[2,14],59:[2,14],65:[2,14],74:[2,14],75:[2,14],76:[2,14],77:[2,14],78:[2,14],79:[2,14],80:[2,14],82:[2,14],90:[2,14]},{8:[1,60]},{8:[1,61]},{8:[1,62]},{6:6,7:[1,13],8:[1,36],9:20,11:63,13:7,14:[1,14],15:[1,15],16:[1,21],17:[1,16],18:8,19:[1,17],20:[1,32],21:[1,18],22:9,23:[1,19],24:11,25:5,26:[1,12],28:10,29:22,31:23,32:24,34:25,37:28,39:31,41:38,45:45,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{20:[1,64]},{20:[1,65]},{8:[1,36],9:67,16:[1,66],20:[1,32],29:22,31:23,32:24,34:25,37:28,39:31,41:38,45:45,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{16:[1,68],30:[1,69]},{5:[2,11],7:[2,11],8:[2,11],12:[2,11],14:[2,11],15:[2,11],16:[2,11],17:[2,11],19:[2,11],20:[2,11],21:[2,11],23:[2,11],26:[2,11],27:[2,11],51:[2,11],52:[2,11],59:[2,11],65:[2,11],74:[2,11],75:[2,11],76:[2,11],77:[2,11],78:[2,11],79:[2,11],80:[2,11],82:[2,11],90:[2,11]},{10:[2,23],16:[2,23],30:[2,23],66:[2,23]},{10:[2,25],16:[2,25],30:[2,25],36:[2,25],66:[2,25],83:[2,25]},{10:[2,51],16:[2,51],30:[2,51],33:[1,70],35:[2,51],36:[2,51],38:[2,51],40:[2,51],42:[2,51],43:[2,51],44:[2,51],46:[2,51],47:[2,51],48:[2,51],49:[2,51],51:[2,51],52:[2,51],54:[2,51],55:[2,51],56:[2,51],58:[2,51],66:[2,51],83:[2,51]},{10:[2,27],16:[2,27],30:[2,27],35:[1,71],36:[2,27],38:[1,72],66:[2,27],83:[2,27]},{8:[1,76],10:[2,55],16:[2,55],30:[2,55],33:[2,55],35:[2,55],36:[2,55],38:[2,55],40:[2,55],42:[2,55],43:[2,55],44:[2,55],46:[2,55],47:[2,55],48:[2,55],49:[2,55],51:[2,55],52:[2,55],54:[2,55],55:[2,55],56:[2,55],58:[2,55],64:[1,73],65:[1,74],66:[2,55],83:[2,55],87:75},{8:[1,76],10:[2,56],16:[2,56],30:[2,56],33:[2,56],35:[2,56],36:[2,56],38:[2,56],40:[2,56],42:[2,56],43:[2,56],44:[2,56],46:[2,56],47:[2,56],48:[2,56],49:[2,56],51:[2,56],52:[2,56],54:[2,56],55:[2,56],56:[2,56],58:[2,56],64:[1,79],65:[1,78],66:[2,56],83:[2,56],87:77},{10:[2,29],16:[2,29],30:[2,29],35:[2,29],36:[2,29],38:[2,29],40:[1,80],66:[2,29],83:[2,29]},{8:[2,57],10:[2,57],16:[2,57],30:[2,57],33:[2,57],35:[2,57],36:[2,57],38:[2,57],40:[2,57],42:[2,57],43:[2,57],44:[2,57],46:[2,57],47:[2,57],48:[2,57],49:[2,57],51:[2,57],52:[2,57],54:[2,57],55:[2,57],56:[2,57],58:[2,57],64:[2,57],65:[2,57],66:[2,57],83:[2,57]},{8:[2,58],10:[2,58],16:[2,58],30:[2,58],33:[2,58],35:[2,58],36:[2,58],38:[2,58],40:[2,58],42:[2,58],43:[2,58],44:[2,58],46:[2,58],47:[2,58],48:[2,58],49:[2,58],51:[2,58],52:[2,58],54:[2,58],55:[2,58],56:[2,58],58:[2,58],64:[2,58],65:[2,58],66:[2,58],83:[2,58]},{10:[2,31],16:[2,31],30:[2,31],35:[2,31],36:[2,31],38:[2,31],40:[2,31],42:[1,81],43:[1,82],44:[1,83],66:[2,31],83:[2,31]},{8:[2,61],10:[2,61],16:[2,61],30:[2,61],33:[2,61],35:[2,61],36:[2,61],38:[2,61],40:[2,61],42:[2,61],43:[2,61],44:[2,61],46:[2,61],47:[2,61],48:[2,61],49:[2,61],51:[2,61],52:[2,61],54:[2,61],55:[2,61],56:[2,61],58:[2,61],64:[2,61],65:[2,61],66:[2,61],83:[2,61]},{8:[2,62],10:[2,62],16:[2,62],30:[2,62],33:[2,62],35:[2,62],36:[2,62],38:[2,62],40:[2,62],42:[2,62],43:[2,62],44:[2,62],46:[2,62],47:[2,62],48:[2,62],49:[2,62],51:[2,62],52:[2,62],54:[2,62],55:[2,62],56:[2,62],58:[2,62],64:[2,62],65:[2,62],66:[2,62],83:[2,62]},{8:[2,63],10:[2,63],16:[2,63],30:[2,63],33:[2,63],35:[2,63],36:[2,63],38:[2,63],40:[2,63],42:[2,63],43:[2,63],44:[2,63],46:[2,63],47:[2,63],48:[2,63],49:[2,63],51:[2,63],52:[2,63],54:[2,63],55:[2,63],56:[2,63],58:[2,63],64:[2,63],65:[2,63],66:[2,63],83:[2,63]},{8:[2,64],10:[2,64],16:[2,64],30:[2,64],33:[2,64],35:[2,64],36:[2,64],38:[2,64],40:[2,64],42:[2,64],43:[2,64],44:[2,64],46:[2,64],47:[2,64],48:[2,64],49:[2,64],51:[2,64],52:[2,64],54:[2,64],55:[2,64],56:[2,64],58:[2,64],64:[2,64],65:[2,64],66:[2,64],83:[2,64]},{8:[1,36],9:84,20:[1,32],29:22,31:23,32:24,34:25,37:28,39:31,41:38,45:45,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{8:[1,85]},{10:[2,33],16:[2,33],30:[2,33],35:[2,33],36:[2,33],38:[2,33],40:[2,33],42:[2,33],43:[2,33],44:[2,33],46:[1,86],47:[1,87],48:[1,88],49:[1,89],66:[2,33],83:[2,33]},{8:[2,66],10:[2,66],16:[2,66],30:[2,66],33:[2,66],35:[2,66],36:[2,66],38:[2,66],40:[2,66],42:[2,66],43:[2,66],44:[2,66],46:[2,66],47:[2,66],48:[2,66],49:[2,66],51:[2,66],52:[2,66],54:[2,66],55:[2,66],56:[2,66],58:[2,66],64:[2,66],65:[2,66],66:[2,66],83:[2,66]},{8:[2,67],10:[2,67],16:[2,67],30:[2,67],33:[2,67],35:[2,67],36:[2,67],38:[2,67],40:[2,67],42:[2,67],43:[2,67],44:[2,67],46:[2,67],47:[2,67],48:[2,67],49:[2,67],51:[2,67],52:[2,67],54:[2,67],55:[2,67],56:[2,67],58:[2,67],64:[2,67],65:[2,67],66:[2,67],83:[2,67]},{8:[2,68],10:[2,68],16:[2,68],30:[2,68],33:[2,68],35:[2,68],36:[2,68],38:[2,68],40:[2,68],42:[2,68],43:[2,68],44:[2,68],46:[2,68],47:[2,68],48:[2,68],49:[2,68],51:[2,68],52:[2,68],54:[2,68],55:[2,68],56:[2,68],58:[2,68],64:[2,68],65:[2,68],66:[2,68],83:[2,68]},{8:[2,69],10:[2,69],16:[2,69],30:[2,69],33:[2,69],35:[2,69],36:[2,69],38:[2,69],40:[2,69],42:[2,69],43:[2,69],44:[2,69],46:[2,69],47:[2,69],48:[2,69],49:[2,69],51:[2,69],52:[2,69],54:[2,69],55:[2,69],56:[2,69],58:[2,69],64:[2,69],65:[2,69],66:[2,69],83:[2,69]},{20:[1,94],72:95,73:96,77:[1,49],78:[1,50],79:[1,51],80:[1,52],83:[1,90],84:91,85:92,86:93},{8:[1,36],20:[1,32],29:99,31:23,32:24,34:25,37:28,39:31,41:38,45:45,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],66:[1,97],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],81:98,82:[1,43],90:[1,37]},{10:[2,37],16:[2,37],30:[2,37],35:[2,37],36:[2,37],38:[2,37],40:[2,37],42:[2,37],43:[2,37],44:[2,37],46:[2,37],47:[2,37],48:[2,37],49:[2,37],51:[1,100],52:[1,101],66:[2,37],83:[2,37]},{8:[2,70],10:[2,70],16:[2,70],30:[2,70],33:[2,70],35:[2,70],36:[2,70],38:[2,70],40:[2,70],42:[2,70],43:[2,70],44:[2,70],46:[2,70],47:[2,70],48:[2,70],49:[2,70],51:[2,70],52:[2,70],54:[2,70],55:[2,70],56:[2,70],58:[2,70],64:[2,70],65:[2,70],66:[2,70],83:[2,70]},{8:[2,71],10:[2,71],16:[2,71],30:[2,71],33:[2,71],35:[2,71],36:[2,71],38:[2,71],40:[2,71],42:[2,71],43:[2,71],44:[2,71],46:[2,71],47:[2,71],48:[2,71],49:[2,71],51:[2,71],52:[2,71],54:[2,71],55:[2,71],56:[2,71],58:[2,71],64:[2,71],65:[2,71],66:[2,71],83:[2,71]},{8:[2,72],10:[2,72],16:[2,72],30:[2,72],33:[2,72],35:[2,72],36:[2,72],38:[2,72],40:[2,72],42:[2,72],43:[2,72],44:[2,72],46:[2,72],47:[2,72],48:[2,72],49:[2,72],51:[2,72],52:[2,72],54:[2,72],55:[2,72],56:[2,72],58:[2,72],64:[2,72],65:[2,72],66:[2,72],83:[2,72]},{8:[2,73],10:[2,73],16:[2,73],30:[2,73],33:[2,73],35:[2,73],36:[2,73],38:[2,73],40:[2,73],42:[2,73],43:[2,73],44:[2,73],46:[2,73],47:[2,73],48:[2,73],49:[2,73],51:[2,73],52:[2,73],54:[2,73],55:[2,73],56:[2,73],58:[2,73],64:[2,73],65:[2,73],66:[2,73],83:[2,73]},{8:[2,74],10:[2,74],16:[2,74],30:[2,74],33:[2,74],35:[2,74],36:[2,74],38:[2,74],40:[2,74],42:[2,74],43:[2,74],44:[2,74],46:[2,74],47:[2,74],48:[2,74],49:[2,74],51:[2,74],52:[2,74],54:[2,74],55:[2,74],56:[2,74],58:[2,74],64:[2,74],65:[2,74],66:[2,74],83:[2,74]},{8:[2,75],10:[2,75],16:[2,75],30:[2,75],33:[2,75],35:[2,75],36:[2,75],38:[2,75],40:[2,75],42:[2,75],43:[2,75],44:[2,75],46:[2,75],47:[2,75],48:[2,75],49:[2,75],51:[2,75],52:[2,75],54:[2,75],55:[2,75],56:[2,75],58:[2,75],64:[2,75],65:[2,75],66:[2,75],83:[2,75]},{8:[2,76],10:[2,76],16:[2,76],30:[2,76],33:[2,76],35:[2,76],36:[2,76],38:[2,76],40:[2,76],42:[2,76],43:[2,76],44:[2,76],46:[2,76],47:[2,76],48:[2,76],49:[2,76],51:[2,76],52:[2,76],54:[2,76],55:[2,76],56:[2,76],58:[2,76],64:[2,76],65:[2,76],66:[2,76],83:[2,76]},{10:[2,42],16:[2,42],30:[2,42],35:[2,42],36:[2,42],38:[2,42],40:[2,42],42:[2,42],43:[2,42],44:[2,42],46:[2,42],47:[2,42],48:[2,42],49:[2,42],51:[2,42],52:[2,42],54:[1,102],55:[1,103],56:[1,104],66:[2,42],83:[2,42]},{10:[2,45],16:[2,45],30:[2,45],35:[2,45],36:[2,45],38:[2,45],40:[2,45],42:[2,45],43:[2,45],44:[2,45],46:[2,45],47:[2,45],48:[2,45],49:[2,45],51:[2,45],52:[2,45],54:[2,45],55:[2,45],56:[2,45],66:[2,45],83:[2,45]},{10:[2,49],16:[2,49],30:[2,49],35:[2,49],36:[2,49],38:[2,49],40:[2,49],42:[2,49],43:[2,49],44:[2,49],46:[2,49],47:[2,49],48:[2,49],49:[2,49],51:[2,49],52:[2,49],54:[2,49],55:[2,49],56:[2,49],58:[1,105],66:[2,49],83:[2,49]},{8:[1,36],20:[1,32],32:107,51:[1,57],52:[1,58],57:106,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{8:[1,36],20:[1,32],32:107,51:[1,57],52:[1,58],57:108,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{8:[1,36],20:[1,32],32:107,51:[1,57],52:[1,58],57:109,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{6:6,7:[1,13],8:[1,36],9:20,11:4,13:7,14:[1,14],15:[1,15],16:[1,21],17:[1,16],18:8,19:[1,17],20:[1,32],21:[1,18],22:9,23:[1,19],24:11,25:5,26:[1,12],27:[1,110],28:10,29:22,31:23,32:24,34:25,37:28,39:31,41:38,45:45,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{8:[1,36],9:111,20:[1,32],29:22,31:23,32:24,34:25,37:28,39:31,41:38,45:45,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{8:[1,36],9:112,20:[1,32],29:22,31:23,32:24,34:25,37:28,39:31,41:38,45:45,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{8:[1,36],9:113,20:[1,32],29:22,31:23,32:24,34:25,37:28,39:31,41:38,45:45,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{14:[1,114]},{5:[2,7],7:[2,7],8:[2,7],12:[2,7],14:[2,7],15:[2,7],16:[2,7],17:[2,7],19:[2,7],20:[2,7],21:[2,7],23:[2,7],26:[2,7],27:[2,7],51:[2,7],52:[2,7],59:[2,7],65:[2,7],74:[2,7],75:[2,7],76:[2,7],77:[2,7],78:[2,7],79:[2,7],80:[2,7],82:[2,7],90:[2,7]},{5:[2,8],7:[2,8],8:[2,8],12:[2,8],14:[2,8],15:[2,8],16:[2,8],17:[2,8],19:[2,8],20:[2,8],21:[2,8],23:[2,8],26:[2,8],27:[2,8],51:[2,8],52:[2,8],59:[2,8],65:[2,8],74:[2,8],75:[2,8],76:[2,8],77:[2,8],78:[2,8],79:[2,8],80:[2,8],82:[2,8],90:[2,8]},{5:[2,9],7:[2,9],8:[2,9],12:[2,9],14:[2,9],15:[2,9],16:[2,9],17:[2,9],19:[2,9],20:[2,9],21:[2,9],23:[2,9],26:[2,9],27:[2,9],51:[2,9],52:[2,9],59:[2,9],65:[2,9],74:[2,9],75:[2,9],76:[2,9],77:[2,9],78:[2,9],79:[2,9],80:[2,9],82:[2,9],90:[2,9]},{16:[1,115],30:[1,69]},{5:[2,22],7:[2,22],8:[2,22],12:[2,22],14:[2,22],15:[2,22],16:[2,22],17:[2,22],19:[2,22],20:[2,22],21:[2,22],23:[2,22],26:[2,22],27:[2,22],51:[2,22],52:[2,22],59:[2,22],65:[2,22],74:[2,22],75:[2,22],76:[2,22],77:[2,22],78:[2,22],79:[2,22],80:[2,22],82:[2,22],90:[2,22]},{8:[1,36],20:[1,32],29:116,31:23,32:24,34:25,37:28,39:31,41:38,45:45,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{8:[1,36],20:[1,32],29:117,31:23,32:24,34:25,37:28,39:31,41:38,45:45,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{8:[1,36],20:[1,32],29:118,31:23,32:24,34:25,37:28,39:31,41:38,45:45,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{8:[1,36],20:[1,32],32:107,37:119,39:31,41:38,45:45,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{20:[1,120]},{8:[1,36],9:121,20:[1,32],29:22,31:23,32:24,34:25,37:28,39:31,41:38,45:45,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{8:[2,87],10:[2,87],16:[2,87],20:[1,124],30:[2,87],33:[2,87],35:[2,87],36:[2,87],38:[2,87],40:[2,87],42:[2,87],43:[2,87],44:[2,87],46:[2,87],47:[2,87],48:[2,87],49:[2,87],51:[2,87],52:[2,87],54:[2,87],55:[2,87],56:[2,87],58:[2,87],64:[2,87],65:[2,87],66:[2,87],68:125,82:[1,43],83:[2,87],88:122,89:123},{8:[1,36],10:[1,126],20:[1,32],29:99,31:23,32:24,34:25,37:28,39:31,41:38,45:45,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],81:127,82:[1,43],90:[1,37]},{8:[2,89],10:[2,89],16:[2,89],30:[2,89],33:[2,89],35:[2,89],36:[2,89],38:[2,89],40:[2,89],42:[2,89],43:[2,89],44:[2,89],46:[2,89],47:[2,89],48:[2,89],49:[2,89],51:[2,89],52:[2,89],54:[2,89],55:[2,89],56:[2,89],58:[2,89],64:[2,89],65:[2,89],66:[2,89],83:[2,89]},{8:[1,36],9:128,20:[1,32],29:22,31:23,32:24,34:25,37:28,39:31,41:38,45:45,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{20:[1,129]},{8:[1,36],20:[1,32],32:107,39:130,41:38,45:45,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{8:[1,36],20:[1,32],32:107,41:131,45:45,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{8:[1,36],20:[1,32],32:107,41:132,45:45,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{8:[1,36],20:[1,32],32:107,41:133,45:45,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{10:[1,134],30:[1,69]},{10:[1,135],20:[1,137],91:136},{8:[1,36],20:[1,32],32:107,45:138,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{8:[1,36],20:[1,32],32:107,45:139,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{8:[1,36],20:[1,32],32:107,45:140,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{8:[1,36],20:[1,32],32:107,45:141,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{8:[2,79],10:[2,79],16:[2,79],30:[2,79],33:[2,79],35:[2,79],36:[2,79],38:[2,79],40:[2,79],42:[2,79],43:[2,79],44:[2,79],46:[2,79],47:[2,79],48:[2,79],49:[2,79],51:[2,79],52:[2,79],54:[2,79],55:[2,79],56:[2,79],58:[2,79],64:[2,79],65:[2,79],66:[2,79],83:[2,79]},{30:[1,143],83:[1,142]},{30:[2,81],83:[2,81]},{36:[1,144]},{36:[2,84]},{36:[2,85]},{36:[2,86]},{8:[2,77],10:[2,77],16:[2,77],30:[2,77],33:[2,77],35:[2,77],36:[2,77],38:[2,77],40:[2,77],42:[2,77],43:[2,77],44:[2,77],46:[2,77],47:[2,77],48:[2,77],49:[2,77],51:[2,77],52:[2,77],54:[2,77],55:[2,77],56:[2,77],58:[2,77],64:[2,77],65:[2,77],66:[2,77],83:[2,77]},{30:[1,146],66:[1,145]},{10:[2,98],30:[2,98],66:[2,98]},{8:[1,36],20:[1,32],32:107,50:147,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{8:[1,36],20:[1,32],32:107,50:148,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{8:[1,36],20:[1,32],32:107,51:[1,57],52:[1,58],53:149,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{8:[1,36],20:[1,32],32:107,51:[1,57],52:[1,58],53:150,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{8:[1,36],20:[1,32],32:107,51:[1,57],52:[1,58],53:151,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{8:[1,36],20:[1,32],32:107,51:[1,57],52:[1,58],53:152,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{10:[2,52],16:[2,52],30:[2,52],35:[2,52],36:[2,52],38:[2,52],40:[2,52],42:[2,52],43:[2,52],44:[2,52],46:[2,52],47:[2,52],48:[2,52],49:[2,52],51:[2,52],52:[2,52],54:[2,52],55:[2,52],56:[2,52],58:[2,52],66:[2,52],83:[2,52]},{10:[2,51],16:[2,51],30:[2,51],35:[2,51],36:[2,51],38:[2,51],40:[2,51],42:[2,51],43:[2,51],44:[2,51],46:[2,51],47:[2,51],48:[2,51],49:[2,51],51:[2,51],52:[2,51],54:[2,51],55:[2,51],56:[2,51],58:[2,51],66:[2,51],83:[2,51]},{10:[2,53],16:[2,53],30:[2,53],35:[2,53],36:[2,53],38:[2,53],40:[2,53],42:[2,53],43:[2,53],44:[2,53],46:[2,53],47:[2,53],48:[2,53],49:[2,53],51:[2,53],52:[2,53],54:[2,53],55:[2,53],56:[2,53],58:[2,53],66:[2,53],83:[2,53]},{10:[2,54],16:[2,54],30:[2,54],35:[2,54],36:[2,54],38:[2,54],40:[2,54],42:[2,54],43:[2,54],44:[2,54],46:[2,54],47:[2,54],48:[2,54],49:[2,54],51:[2,54],52:[2,54],54:[2,54],55:[2,54],56:[2,54],58:[2,54],66:[2,54],83:[2,54]},{5:[2,12],7:[2,12],8:[2,12],10:[2,12],12:[2,12],14:[2,12],15:[2,12],16:[2,12],17:[2,12],19:[2,12],20:[2,12],21:[2,12],23:[2,12],26:[2,12],27:[2,12],30:[2,12],33:[2,12],35:[2,12],36:[2,12],38:[2,12],40:[2,12],42:[2,12],43:[2,12],44:[2,12],46:[2,12],47:[2,12],48:[2,12],49:[2,12],51:[2,12],52:[2,12],54:[2,12],55:[2,12],56:[2,12],58:[2,12],59:[2,12],64:[2,12],65:[2,12],66:[2,12],74:[2,12],75:[2,12],76:[2,12],77:[2,12],78:[2,12],79:[2,12],80:[2,12],82:[2,12],83:[2,12],90:[2,12]},{10:[1,153],30:[1,69]},{10:[1,154],30:[1,69]},{16:[1,155],30:[1,69]},{8:[1,156]},{5:[2,10],7:[2,10],8:[2,10],12:[2,10],14:[2,10],15:[2,10],16:[2,10],17:[2,10],19:[2,10],20:[2,10],21:[2,10],23:[2,10],26:[2,10],27:[2,10],51:[2,10],52:[2,10],59:[2,10],65:[2,10],74:[2,10],75:[2,10],76:[2,10],77:[2,10],78:[2,10],79:[2,10],80:[2,10],82:[2,10],90:[2,10]},{10:[2,24],16:[2,24],30:[2,24],66:[2,24]},{10:[2,26],16:[2,26],30:[2,26],36:[2,26],66:[2,26],83:[2,26]},{36:[1,157]},{10:[2,30],16:[2,30],30:[2,30],35:[2,30],36:[2,30],38:[2,30],40:[1,80],66:[2,30],83:[2,30]},{8:[2,59],10:[2,59],16:[2,59],30:[2,59],33:[2,59],35:[2,59],36:[2,59],38:[2,59],40:[2,59],42:[2,59],43:[2,59],44:[2,59],46:[2,59],47:[2,59],48:[2,59],49:[2,59],51:[2,59],52:[2,59],54:[2,59],55:[2,59],56:[2,59],58:[2,59],64:[2,59],65:[2,59],66:[2,59],83:[2,59]},{30:[1,69],66:[1,158]},{8:[2,88],10:[2,88],16:[2,88],30:[1,159],33:[2,88],35:[2,88],36:[2,88],38:[2,88],40:[2,88],42:[2,88],43:[2,88],44:[2,88],46:[2,88],47:[2,88],48:[2,88],49:[2,88],51:[2,88],52:[2,88],54:[2,88],55:[2,88],56:[2,88],58:[2,88],64:[2,88],65:[2,88],66:[2,88],83:[2,88]},{8:[2,94],10:[2,94],16:[2,94],30:[2,94],33:[2,94],35:[2,94],36:[2,94],38:[2,94],40:[2,94],42:[2,94],43:[2,94],44:[2,94],46:[2,94],47:[2,94],48:[2,94],49:[2,94],51:[2,94],52:[2,94],54:[2,94],55:[2,94],56:[2,94],58:[2,94],64:[2,94],65:[2,94],66:[2,94],83:[2,94]},{8:[2,96],10:[2,96],16:[2,96],30:[2,96],33:[2,96],35:[2,96],36:[2,96],38:[2,96],40:[2,96],42:[2,96],43:[2,96],44:[2,96],46:[2,96],47:[2,96],48:[2,96],49:[2,96],51:[2,96],52:[2,96],54:[2,96],55:[2,96],56:[2,96],58:[2,96],64:[2,96],65:[2,96],66:[2,96],83:[2,96]},{8:[2,97],10:[2,97],16:[2,97],30:[2,97],33:[2,97],35:[2,97],36:[2,97],38:[2,97],40:[2,97],42:[2,97],43:[2,97],44:[2,97],46:[2,97],47:[2,97],48:[2,97],49:[2,97],51:[2,97],52:[2,97],54:[2,97],55:[2,97],56:[2,97],58:[2,97],64:[2,97],65:[2,97],66:[2,97],83:[2,97]},{8:[2,92],10:[2,92],16:[2,92],20:[2,92],30:[2,92],33:[2,92],35:[2,92],36:[2,92],38:[2,92],40:[2,92],42:[2,92],43:[2,92],44:[2,92],46:[2,92],47:[2,92],48:[2,92],49:[2,92],51:[2,92],52:[2,92],54:[2,92],55:[2,92],56:[2,92],58:[2,92],64:[2,92],65:[2,92],66:[2,92],82:[2,92],83:[2,92]},{10:[1,160],30:[1,146]},{30:[1,69],66:[1,161]},{8:[2,91],10:[2,91],16:[2,91],30:[2,91],33:[2,91],35:[2,91],36:[2,91],38:[2,91],40:[2,91],42:[2,91],43:[2,91],44:[2,91],46:[2,91],47:[2,91],48:[2,91],49:[2,91],51:[2,91],52:[2,91],54:[2,91],55:[2,91],56:[2,91],58:[2,91],64:[2,91],65:[2,91],66:[2,91],83:[2,91]},{10:[2,32],16:[2,32],30:[2,32],35:[2,32],36:[2,32],38:[2,32],40:[2,32],42:[1,81],43:[1,82],44:[1,83],66:[2,32],83:[2,32]},{10:[2,34],16:[2,34],30:[2,34],35:[2,34],36:[2,34],38:[2,34],40:[2,34],42:[2,34],43:[2,34],44:[2,34],46:[1,86],47:[1,87],48:[1,88],49:[1,89],66:[2,34],83:[2,34]},{10:[2,35],16:[2,35],30:[2,35],35:[2,35],36:[2,35],38:[2,35],40:[2,35],42:[2,35],43:[2,35],44:[2,35],46:[1,86],47:[1,87],48:[1,88],49:[1,89],66:[2,35],83:[2,35]},{10:[2,36],16:[2,36],30:[2,36],35:[2,36],36:[2,36],38:[2,36],40:[2,36],42:[2,36],43:[2,36],44:[2,36],46:[1,86],47:[1,87],48:[1,88],49:[1,89],66:[2,36],83:[2,36]},{8:[2,65],10:[2,65],16:[2,65],30:[2,65],33:[2,65],35:[2,65],36:[2,65],38:[2,65],40:[2,65],42:[2,65],43:[2,65],44:[2,65],46:[2,65],47:[2,65],48:[2,65],49:[2,65],51:[2,65],52:[2,65],54:[2,65],55:[2,65],56:[2,65],58:[2,65],64:[2,65],65:[2,65],66:[2,65],83:[2,65]},{25:162,26:[1,12]},{10:[1,163],30:[1,164]},{10:[2,102],30:[2,102]},{10:[2,38],16:[2,38],30:[2,38],35:[2,38],36:[2,38],38:[2,38],40:[2,38],42:[2,38],43:[2,38],44:[2,38],46:[2,38],47:[2,38],48:[2,38],49:[2,38],51:[1,100],52:[1,101],66:[2,38],83:[2,38]},{10:[2,39],16:[2,39],30:[2,39],35:[2,39],36:[2,39],38:[2,39],40:[2,39],42:[2,39],43:[2,39],44:[2,39],46:[2,39],47:[2,39],48:[2,39],49:[2,39],51:[1,100],52:[1,101],66:[2,39],83:[2,39]},{10:[2,40],16:[2,40],30:[2,40],35:[2,40],36:[2,40],38:[2,40],40:[2,40],42:[2,40],43:[2,40],44:[2,40],46:[2,40],47:[2,40],48:[2,40],49:[2,40],51:[1,100],52:[1,101],66:[2,40],83:[2,40]},{10:[2,41],16:[2,41],30:[2,41],35:[2,41],36:[2,41],38:[2,41],40:[2,41],42:[2,41],43:[2,41],44:[2,41],46:[2,41],47:[2,41],48:[2,41],49:[2,41],51:[1,100],52:[1,101],66:[2,41],83:[2,41]},{8:[2,80],10:[2,80],16:[2,80],30:[2,80],33:[2,80],35:[2,80],36:[2,80],38:[2,80],40:[2,80],42:[2,80],43:[2,80],44:[2,80],46:[2,80],47:[2,80],48:[2,80],49:[2,80],51:[2,80],52:[2,80],54:[2,80],55:[2,80],56:[2,80],58:[2,80],64:[2,80],65:[2,80],66:[2,80],83:[2,80]},{20:[1,94],72:95,73:96,77:[1,49],78:[1,50],79:[1,51],80:[1,52],85:165,86:93},{8:[1,36],20:[1,32],29:166,31:23,32:24,34:25,37:28,39:31,41:38,45:45,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{8:[2,78],10:[2,78],16:[2,78],30:[2,78],33:[2,78],35:[2,78],36:[2,78],38:[2,78],40:[2,78],42:[2,78],43:[2,78],44:[2,78],46:[2,78],47:[2,78],48:[2,78],49:[2,78],51:[2,78],52:[2,78],54:[2,78],55:[2,78],56:[2,78],58:[2,78],64:[2,78],65:[2,78],66:[2,78],83:[2,78]},{8:[1,36],20:[1,32],29:167,31:23,32:24,34:25,37:28,39:31,41:38,45:45,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{10:[2,43],16:[2,43],30:[2,43],35:[2,43],36:[2,43],38:[2,43],40:[2,43],42:[2,43],43:[2,43],44:[2,43],46:[2,43],47:[2,43],48:[2,43],49:[2,43],51:[2,43],52:[2,43],54:[1,102],55:[1,103],56:[1,104],66:[2,43],83:[2,43]},{10:[2,44],16:[2,44],30:[2,44],35:[2,44],36:[2,44],38:[2,44],40:[2,44],42:[2,44],43:[2,44],44:[2,44],46:[2,44],47:[2,44],48:[2,44],49:[2,44],51:[2,44],52:[2,44],54:[1,102],55:[1,103],56:[1,104],66:[2,44],83:[2,44]},{10:[2,46],16:[2,46],30:[2,46],35:[2,46],36:[2,46],38:[2,46],40:[2,46],42:[2,46],43:[2,46],44:[2,46],46:[2,46],47:[2,46],48:[2,46],49:[2,46],51:[2,46],52:[2,46],54:[2,46],55:[2,46],56:[2,46],66:[2,46],83:[2,46]},{10:[2,47],16:[2,47],30:[2,47],35:[2,47],36:[2,47],38:[2,47],40:[2,47],42:[2,47],43:[2,47],44:[2,47],46:[2,47],47:[2,47],48:[2,47],49:[2,47],51:[2,47],52:[2,47],54:[2,47],55:[2,47],56:[2,47],66:[2,47],83:[2,47]},{10:[2,48],16:[2,48],30:[2,48],35:[2,48],36:[2,48],38:[2,48],40:[2,48],42:[2,48],43:[2,48],44:[2,48],46:[2,48],47:[2,48],48:[2,48],49:[2,48],51:[2,48],52:[2,48],54:[2,48],55:[2,48],56:[2,48],66:[2,48],83:[2,48]},{10:[2,50],16:[2,50],30:[2,50],35:[2,50],36:[2,50],38:[2,50],40:[2,50],42:[2,50],43:[2,50],44:[2,50],46:[2,50],47:[2,50],48:[2,50],49:[2,50],51:[2,50],52:[2,50],54:[2,50],55:[2,50],56:[2,50],66:[2,50],83:[2,50]},{6:6,7:[1,13],8:[1,36],9:20,11:168,13:7,14:[1,14],15:[1,15],16:[1,21],17:[1,16],18:8,19:[1,17],20:[1,32],21:[1,18],22:9,23:[1,19],24:11,25:5,26:[1,12],28:10,29:22,31:23,32:24,34:25,37:28,39:31,41:38,45:45,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{6:6,7:[1,13],8:[1,36],9:20,11:169,13:7,14:[1,14],15:[1,15],16:[1,21],17:[1,16],18:8,19:[1,17],20:[1,32],21:[1,18],22:9,23:[1,19],24:11,25:5,26:[1,12],28:10,29:22,31:23,32:24,34:25,37:28,39:31,41:38,45:45,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{8:[1,36],9:170,20:[1,32],29:22,31:23,32:24,34:25,37:28,39:31,41:38,45:45,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{8:[1,36],9:171,20:[1,32],29:22,31:23,32:24,34:25,37:28,39:31,41:38,45:45,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{8:[1,36],20:[1,32],29:172,31:23,32:24,34:25,37:28,39:31,41:38,45:45,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{8:[2,60],10:[2,60],16:[2,60],30:[2,60],33:[2,60],35:[2,60],36:[2,60],38:[2,60],40:[2,60],42:[2,60],43:[2,60],44:[2,60],46:[2,60],47:[2,60],48:[2,60],49:[2,60],51:[2,60],52:[2,60],54:[2,60],55:[2,60],56:[2,60],58:[2,60],64:[2,60],65:[2,60],66:[2,60],83:[2,60]},{20:[1,124],68:125,82:[1,43],89:173},{8:[2,93],10:[2,93],16:[2,93],20:[2,93],30:[2,93],33:[2,93],35:[2,93],36:[2,93],38:[2,93],40:[2,93],42:[2,93],43:[2,93],44:[2,93],46:[2,93],47:[2,93],48:[2,93],49:[2,93],51:[2,93],52:[2,93],54:[2,93],55:[2,93],56:[2,93],58:[2,93],64:[2,93],65:[2,93],66:[2,93],82:[2,93],83:[2,93]},{8:[2,90],10:[2,90],16:[2,90],30:[2,90],33:[2,90],35:[2,90],36:[2,90],38:[2,90],40:[2,90],42:[2,90],43:[2,90],44:[2,90],46:[2,90],47:[2,90],48:[2,90],49:[2,90],51:[2,90],52:[2,90],54:[2,90],55:[2,90],56:[2,90],58:[2,90],64:[2,90],65:[2,90],66:[2,90],83:[2,90]},{8:[2,100],10:[2,100],16:[2,100],30:[2,100],33:[2,100],35:[2,100],36:[2,100],38:[2,100],40:[2,100],42:[2,100],43:[2,100],44:[2,100],46:[2,100],47:[2,100],48:[2,100],49:[2,100],51:[2,100],52:[2,100],54:[2,100],55:[2,100],56:[2,100],58:[2,100],64:[2,100],65:[2,100],66:[2,100],83:[2,100]},{25:174,26:[1,12]},{20:[1,175]},{30:[2,82],83:[2,82]},{30:[2,83],83:[2,83]},{10:[2,99],30:[2,99],66:[2,99]},{5:[2,2],7:[2,2],8:[2,2],12:[1,176],14:[2,2],15:[2,2],16:[2,2],17:[2,2],19:[2,2],20:[2,2],21:[2,2],23:[2,2],26:[2,2],27:[2,2],51:[2,2],52:[2,2],59:[2,2],65:[2,2],74:[2,2],75:[2,2],76:[2,2],77:[2,2],78:[2,2],79:[2,2],80:[2,2],82:[2,2],90:[2,2]},{5:[2,4],7:[2,4],8:[2,4],12:[2,4],14:[2,4],15:[2,4],16:[2,4],17:[2,4],19:[2,4],20:[2,4],21:[2,4],23:[2,4],26:[2,4],27:[2,4],51:[2,4],52:[2,4],59:[2,4],65:[2,4],74:[2,4],75:[2,4],76:[2,4],77:[2,4],78:[2,4],79:[2,4],80:[2,4],82:[2,4],90:[2,4]},{16:[1,177],30:[1,69]},{10:[1,178],30:[1,69]},{10:[2,28],16:[2,28],30:[2,28],36:[2,28],66:[2,28],83:[2,28]},{8:[2,95],10:[2,95],16:[2,95],30:[2,95],33:[2,95],35:[2,95],36:[2,95],38:[2,95],40:[2,95],42:[2,95],43:[2,95],44:[2,95],46:[2,95],47:[2,95],48:[2,95],49:[2,95],51:[2,95],52:[2,95],54:[2,95],55:[2,95],56:[2,95],58:[2,95],64:[2,95],65:[2,95],66:[2,95],83:[2,95]},{8:[2,101],10:[2,101],16:[2,101],30:[2,101],33:[2,101],35:[2,101],36:[2,101],38:[2,101],40:[2,101],42:[2,101],43:[2,101],44:[2,101],46:[2,101],47:[2,101],48:[2,101],49:[2,101],51:[2,101],52:[2,101],54:[2,101],55:[2,101],56:[2,101],58:[2,101],64:[2,101],65:[2,101],66:[2,101],83:[2,101]},{10:[2,103],30:[2,103]},{6:6,7:[1,13],8:[1,36],9:20,11:179,13:7,14:[1,14],15:[1,15],16:[1,21],17:[1,16],18:8,19:[1,17],20:[1,32],21:[1,18],22:9,23:[1,19],24:11,25:5,26:[1,12],28:10,29:22,31:23,32:24,34:25,37:28,39:31,41:38,45:45,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{8:[1,36],9:180,20:[1,32],29:22,31:23,32:24,34:25,37:28,39:31,41:38,45:45,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{16:[1,181]},{5:[2,3],7:[2,3],8:[2,3],12:[2,3],14:[2,3],15:[2,3],16:[2,3],17:[2,3],19:[2,3],20:[2,3],21:[2,3],23:[2,3],26:[2,3],27:[2,3],51:[2,3],52:[2,3],59:[2,3],65:[2,3],74:[2,3],75:[2,3],76:[2,3],77:[2,3],78:[2,3],79:[2,3],80:[2,3],82:[2,3],90:[2,3]},{10:[1,182],30:[1,69]},{5:[2,6],7:[2,6],8:[2,6],12:[2,6],14:[2,6],15:[2,6],16:[2,6],17:[2,6],19:[2,6],20:[2,6],21:[2,6],23:[2,6],26:[2,6],27:[2,6],51:[2,6],52:[2,6],59:[2,6],65:[2,6],74:[2,6],75:[2,6],76:[2,6],77:[2,6],78:[2,6],79:[2,6],80:[2,6],82:[2,6],90:[2,6]},{6:6,7:[1,13],8:[1,36],9:20,11:183,13:7,14:[1,14],15:[1,15],16:[1,21],17:[1,16],18:8,19:[1,17],20:[1,32],21:[1,18],22:9,23:[1,19],24:11,25:5,26:[1,12],28:10,29:22,31:23,32:24,34:25,37:28,39:31,41:38,45:45,50:53,51:[1,57],52:[1,58],53:54,57:55,59:[1,56],60:26,61:27,62:29,63:30,65:[1,44],67:33,68:34,69:35,70:39,71:40,72:41,73:42,74:[1,46],75:[1,47],76:[1,48],77:[1,49],78:[1,50],79:[1,51],80:[1,52],82:[1,43],90:[1,37]},{5:[2,5],7:[2,5],8:[2,5],12:[2,5],14:[2,5],15:[2,5],16:[2,5],17:[2,5],19:[2,5],20:[2,5],21:[2,5],23:[2,5],26:[2,5],27:[2,5],51:[2,5],52:[2,5],59:[2,5],65:[2,5],74:[2,5],75:[2,5],76:[2,5],77:[2,5],78:[2,5],79:[2,5],80:[2,5],82:[2,5],90:[2,5]}],
defaultActions: {3:[2,1],94:[2,84],95:[2,85],96:[2,86]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        throw new Error(str);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    this.yy.parser = this;
    if (typeof this.lexer.yylloc == 'undefined') {
        this.lexer.yylloc = {};
    }
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
    var ranges = this.lexer.options && this.lexer.options.ranges;
    if (typeof this.yy.parseError === 'function') {
        this.parseError = this.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    function lex() {
        var token;
        token = self.lexer.lex() || EOF;
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (this.lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + this.lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: this.lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: this.lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(this.lexer.yytext);
            lstack.push(this.lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};


    var AST = {
        node: function (type, value, children) {
            return {
                type: type,
                value: value,
                children: children
            };
        },

        createNode: function (pos, type, value, children) {
            var i,
                n = this.node(type, value, []);

            for (i = 3; i < arguments.length; i++) {
                n.children.push(arguments[i]);
            }

            n.line = pos[0];
            n.col = pos[1];

            return n;
        }
    };

    var lc = function (lc1) {
        return [lc1.first_line, lc1.first_column];
    };

/* generated by jison-lex 0.2.0 */
var lexer = (function(){
var lexer = {

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input) {
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len - 1);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            if (this.options.backtrack_lexer) {
                delete backup;
            }
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        if (this.options.backtrack_lexer) {
            delete backup;
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {

var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:/* ignore */
break;
case 1:return 78
break;
case 2:return 78
break;
case 3: return 77;
break;
case 4: return 77;
break;
case 5:/* ignore comment */
break;
case 6:/* ignore multiline comment */
break;
case 7:return 7
break;
case 8:return 12
break;
case 9:return 14
break;
case 10:return 17
break;
case 11:return 15
break;
case 12:return 90
break;
case 13:return 19
break;
case 14:return 23
break;
case 15:return 21
break;
case 16:return 75
break;
case 17:return 76
break;
case 18:return 74
break;
case 19:return 80
break;
case 20:return 82
break;
case 21:return 83
break;
case 22:return 26
break;
case 23:return 27
break;
case 24:return 16
break;
case 25:return '#'
break;
case 26:return 35
break;
case 27:return 36
break;
case 28:return 79
break;
case 29:return 64
break;
case 30:return 65
break;
case 31:return 66
break;
case 32:return 8
break;
case 33:return 10
break;
case 34:return 59
break;
case 35:return 58
break;
case 36:return 54
break;
case 37:return 55
break;
case 38:return 56
break;
case 39:return 51
break;
case 40:return 52
break;
case 41:return 48
break;
case 42:return 46
break;
case 43:return 49
break;
case 44:return 47
break;
case 45:return 42
break;
case 46:return 44
break;
case 47:return 43
break;
case 48:return 40
break;
case 49:return 38
break;
case 50:return 33
break;
case 51:return 30
break;
case 52:return 5
break;
case 53:return 20
break;
case 54:return 'INVALID'
break;
}
},
rules: [/^(?:\s+)/,/^(?:[0-9]+\.[0-9]*|[0-9]*\.[0-9]+\b)/,/^(?:[0-9]+)/,/^(?:"(\\["]|[^"])*")/,/^(?:'(\\[']|[^'])*')/,/^(?:\/\/.*)/,/^(?:\/\*(.|\n|\r)*?\*\/)/,/^(?:if\b)/,/^(?:else\b)/,/^(?:while\b)/,/^(?:do\b)/,/^(?:for\b)/,/^(?:function\b)/,/^(?:use\b)/,/^(?:return\b)/,/^(?:delete\b)/,/^(?:true\b)/,/^(?:false\b)/,/^(?:null\b)/,/^(?:Infinity\b)/,/^(?:<<)/,/^(?:>>)/,/^(?:\{)/,/^(?:\})/,/^(?:;)/,/^(?:#)/,/^(?:\?)/,/^(?::)/,/^(?:NaN\b)/,/^(?:\.)/,/^(?:\[)/,/^(?:\])/,/^(?:\()/,/^(?:\))/,/^(?:!)/,/^(?:\^)/,/^(?:\*)/,/^(?:\/)/,/^(?:%)/,/^(?:\+)/,/^(?:-)/,/^(?:<=)/,/^(?:<)/,/^(?:>=)/,/^(?:>)/,/^(?:==)/,/^(?:~=)/,/^(?:!=)/,/^(?:&&)/,/^(?:\|\|)/,/^(?:=)/,/^(?:,)/,/^(?:$)/,/^(?:[A-Za-z_\$][A-Za-z0-9_]*)/,/^(?:.)/],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54],"inclusive":true}}
};
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}

    return JXG.JessieCode;
});
