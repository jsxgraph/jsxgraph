/*
 JessieCode Parser and Compiler

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

/*global JXG: true, define: true, window: true, console: true, self: true, document: true*/
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

    "use strict";

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
        this.pstack = [[]];

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

        this.countLines = true;
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

            if (Type.indexOf(this.pstack[this.pscope], vname) > -1) {
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
                par[what] = value;
                o.setProperty(par);
            } else {
                o[what] = value;
            }
        },

        /**
         * Encode characters outside the ASCII table into HTML Entities, because JavaScript or JS/CC can't handle a RegEx
         * applied to a string with unicode characters.
         * @param {String} string
         * @returns {String}
         */
        utf8_encode : function (string) {
            var utftext = [], n, c;

            for (n = 0; n < string.length; n++) {
                c = string.charCodeAt(n);

                if (c < 128) {
                    utftext.push(String.fromCharCode(c));
                } else {
                    utftext.push('&#x' + c.toString(16) + ';');
                }
            }

            return utftext.join('');
        },

        /**
         * Parses JessieCode
         * @param {String} code
         * @param {Boolean} [geonext=false] Geonext compatibility mode.
         * @param {Boolean} dontstore
         */
        parse: function (code, geonext, dontstore) {
            var to, i, j, regex, setTextBackup,
                error_cnt = 0,
                error_off = [],
                error_la = [],
                /*replacegxt = ['Abs', 'ACos', 'ASin', 'ATan', 'Ceil', 'Cos', 'Exp', 'Factorial', 'Floor', 'Log', 'Max',
                    'Min', 'Random', 'Round', 'Sin', 'Sqrt', 'Tan', 'Trunc', 'If', 'Deg', 'Rad', 'Dist'],*/
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
                    if (!(Type.trim(ccode[i])[0] === '/' && Type.trim(ccode[i])[1] === '/')) {
                        if (geonext) {
                            ccode[i] = JXG.GeonextParser.geonext2JS(ccode[i], this.board);
                            /*for (j = 0; j < replacegxt.length; j++) {
                                regex = new RegExp(replacegxt[j] + "\\(", 'g');
                                ccode[i] = ccode[i].replace(regex, replacegxt[j].toLowerCase() + '(');
                            }*/
                        }

                        cleaned.push(ccode[i]);
                    } else {
                        cleaned.push('');
                    }
                }
                code = cleaned.join('\n');
                code = this.utf8_encode(code);

                if ((error_cnt = this.genTree(code, error_off, error_la)) > 0) {
                    for (i = 0; i < error_cnt; i++) {
                        this.line = error_off[i].line;
                        this._error("Parse error in line " + error_off[i].line + " near >"  + code.substr(error_off[i].offset, 30) + "<, expecting \"" + error_la[i].join() + "\"");
                    }
                }
            } finally {
                // make sure the original text method is back in place
                if (Text) {
                    Text.Text.prototype.setText = setTextBackup;
                }
            }
        },

        /**
         * Parses a JessieCode snippet, e.g. "3+4", and wraps it into a function, if desired.
         * @param {String} code A small snippet of JessieCode. Must not be an assignment.
         * @param {Boolean} funwrap If true, the code is wrapped in a function.
         * @param {String} varname Name of the parameter(s)
         * @param {Boolean} [geonext=false] Geonext compatibility mode.
         */
        snippet: function (code, funwrap, varname, geonext) {
            var vname, c, tmp, result;

            vname = 'jxg__tmp__intern_' + UUID.genUUID().replace(/\-/g, '');

            if (!Type.exists(funwrap)) {
                funwrap = true;
            }

            if (!Type.exists(varname)) {
                varname = '';
            }

            if (!Type.exists(geonext)) {
                geonext = false;
            }

            // just in case...
            tmp = this.sstack[0][vname];

            this.countLines = false;

            c = vname + ' = ' + (funwrap ? ' function (' + varname + ') { return ' : '') + code + (funwrap ? '; }' : '') + ';';
            this.parse(c, geonext, true);

            result = this.sstack[0][vname];
            if (Type.exists(tmp)) {
                this.sstack[0][vname] = tmp;
            } else {
                delete this.sstack[0][vname];
            }

            this.countLines = true;

            return result;
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
                v = this.board.objects[node.children[1].children[0].value];

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
                this.createNode('node_op', 'op_param', this.createNode('node_str', el.id)));

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
            if (node.type === 'node_op' && node.value === 'op_execfun' && node.children.length > 1 && node.children[0].value === '$' && node.children[1].children.length > 0) {
                e = node.children[1].children[0].value;
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
                if (v === 'label') {
                    // he wants to access the label properties!
                    // adjust the base object...
                    e = e.label;
                    // and the property we are accessing
                    v = 'content';
                } else {
                    // ok, it's not the label he wants to change
                    // well, what then?
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
         * Executes a parse subtree.
         * @param {Object} node
         * @returns {Number|String|Object|Boolean} Something
         * @private
         */
        execute: function (node) {
            var ret, v, i, e, l, undef,
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
                    v = this.execute(node.children[0]);
                    this.lhs[this.scope] = v[1];

                    if (v[0].type && v[0].elementClass && v[0].methodMap && v[1] === 'label') {
                        this._error('Left-hand side of assignment is read-only.');
                    }

                    if (v[0] !== this.sstack[this.scope] || (Type.isArray(v[0]) && typeof v[1] === 'number')) {
                        // it is either an array component being set or a property of an object.
                        this.setProp(v[0], v[1], this.execute(node.children[1]));
                    } else {
                        // this is just a local variable inside JessieCode
                        this.letvar(v[1], this.execute(node.children[1]));
                    }

                    this.lhs[this.scope] = 0;
                    break;
                case 'op_noassign':
                    ret = this.execute(node.children[0]);
                    break;
                case 'op_if':
                    if (this.execute(node.children[0])) {
                        ret = this.execute(node.children[1]);
                    }
                    break;
                case 'op_conditional':
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
                case 'op_param':
                    if (node.children[1]) {
                        this.execute(node.children[1]);
                    }

                    ret = node.children[0];
                    this.pstack[this.pscope].push(ret);
                    if (this.dpstack[this.pscope]) {
                        this.dpstack[this.pscope].push({
                            line: node.children[0].line,
                            col: node.children[0].col
                        });
                    }
                    break;
                case 'op_paramdef':
                    if (node.children[1]) {
                        this.execute(node.children[1]);
                    }

                    ret = node.children[0];
                    this.pstack[this.pscope].push(ret);
                    break;
                case 'op_proplst':
                    if (node.children[0]) {
                        this.execute(node.children[0]);
                    }
                    if (node.children[1]) {
                        this.execute(node.children[1]);
                    }
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
                    this.pstack.push([]);
                    this.pscope++;

                    this.execute(node.children[0]);

                    ret = [];
                    l = this.pstack[this.pscope].length;

                    for (i = 0; i < l; i++) {
                        ret.push(this.execute(this.pstack[this.pscope][i]));
                    }

                    this.pstack.pop();
                    this.pscope--;

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
                case 'op_function':
                    this.pstack.push([]);
                    this.pscope++;

                    // parse the parameter list
                    // after this, the parameters are in pstack
                    this.execute(node.children[0]);

                    if (this.board.options.jc.compile) {
                        this.sstack.push({});
                        this.scope++;

                        this.isLHS = false;

                        for (i = 0; i < this.pstack[this.pscope].length; i++) {
                            this.sstack[this.scope][this.pstack[this.pscope][i]] = this.pstack[this.pscope][i];
                        }

                        this.replaceNames(node.children[1]);

                        fun = (function ($jc$) {
                            var fun,
                                p = $jc$.pstack[$jc$.pscope].join(', '),
                                str = 'var f = function (' + p + ') {\n$jc$.sstack.push([]);\n$jc$.scope++;\nvar r = (function () {\n' + $jc$.compile(node.children[1], true) + '})();\n$jc$.sstack.pop();\n$jc$.scope--;\nreturn r;\n}; f;';
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
                                return function () {};
                            }
                        }(this));

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
                        }(this.pstack[this.pscope], this));
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

                    this.pstack.pop();
                    this.pscope--;

                    ret = fun;
                    break;
                case 'op_execfun':
                    // node.children:
                    //   [0]: Name of the function
                    //   [1]: Parameter list as a parse subtree
                    //   [2]: Properties, only used in case of a create function
                    this.pstack.push([]);
                    this.dpstack.push([]);
                    this.pscope++;

                    // parse the parameter list
                    // after this, the parameters are in pstack
                    this.execute(node.children[1]);

                    // parse the properties only if given
                    if (Type.exists(node.children[2])) {
                        if (node.children[3]) {
                            this.pstack.push([]);
                            this.dpstack.push([]);
                            this.pscope++;

                            this.execute(node.children[2]);
                            attr = {};
                            for (i = 0; i < this.pstack[this.pscope].length; i++) {
                                attr = Type.deepCopy(attr, this.execute(this.pstack[this.pscope][i]), true);
                            }

                            this.pscope--;
                            this.pstack.pop();
                            this.dpstack.pop();
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
                    for (i = 0; i < this.pstack[this.pscope].length; i++) {
                        parents[i] = this.execute(this.pstack[this.pscope][i]);
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
                    this.pstack.pop();
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
                case 'op_lhs':
                    v = node.children[0];

                    // we have a subtree here (in case this is an array component)
                    if (v.children && v.type && v.value) {
                        v = this.execute(v);
                    }

                    if (node.children.length === 1) {
                        e = this.sstack[this.scope];
                    } else {
                        e = this.execute(node.children[1]);

                        if (e.type && e.elementClass && v.toLowerCase && v.toLowerCase() !== 'x' && v.toLowerCase() !== 'y') {
                            v = v.toLowerCase();
                        }
                    }

                    ret = [e, v];
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
                ret = node.value.toLowerCase() !== 'false';
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
            var e,
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
                    e = this.compile(node.children[0], js);
                    if (js) {
                        if (Type.isArray(e)) {
                            ret = '$jc$.setProp(' + e[0] + ', \'' + e[1] + '\', ' + this.compile(node.children[1], js) + ');\n';
                        } else {
                            if (this.isLocalVariable(e) !== this.scope) {
                                this.sstack[this.scope][e] = true;
                            }
                            ret = '$jc$.sstack[' + this.scope + '][\'' + e + '\'] = ' + this.compile(node.children[1], js) + ';\n';
                        }
                    } else {
                        ret = e + ' = ' + this.compile(node.children[1], js) + ';\n';
                    }

                    break;
                case 'op_noassign':
                    ret = this.compile(node.children[0], js) + ';\n';
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
                case 'op_param':
                    if (node.children[1]) {
                        ret = this.compile(node.children[1], js) + ', ';
                    }

                    ret += this.compile(node.children[0], js);
                    break;
                case 'op_paramdef':
                    if (node.children[1]) {
                        ret = this.compile(node.children[1], js) + ', ';
                    }

                    ret += node.children[0];
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
                case 'op_proplst_val':
                    ret = this.compile(node.children[0], js);
                    break;
                case 'op_array':
                    ret = '[' + this.compile(node.children[0], js) + ']';
                    break;
                case 'op_extvalue':
                    ret = this.compile(node.children[0], js) + '[' + this.compile(node.children[1], js) + ']';
                    break;
                case 'op_return':
                    ret = ' return ' + this.compile(node.children[0], js) + ';\n';
                    break;
                case 'op_function':
                    ret = ' function (' + this.compile(node.children[0], js) + ') {\n' + this.compile(node.children[1], js) + '}';
                    break;
                case 'op_execfun':
                    // parse the properties only if given
                    if (node.children[2]) {
                        e = this.compile(node.children[2], js);

                        if (js) {
                            e = '$jc$.mergeAttributes(' + e + ')';
                        }
                    }
                    node.children[0].withProps = !!node.children[2];
                    ret = this.compile(node.children[0], js) + '(' + this.compile(node.children[1], js) + (node.children[2] && js ? ', ' + e : '') + ')' + (node.children[2] && !js ? e : '');

                    // save us a function call when compiled to javascript
                    if (js && node.children[0].value === '$') {
                        ret = '$jc$.board.objects[' + this.compile(node.children[1], js) + ']';
                    }

                    break;
                case 'op_property':
                    if (js && node.children[1] !== 'X' && node.children[1] !== 'Y') {
                        ret = '$jc$.resolveProperty(' + this.compile(node.children[0], js) + ', \'' + node.children[1] + '\', true)';
                    } else {
                        ret = this.compile(node.children[0], js) + '.' + node.children[1];
                    }
                    break;
                case 'op_lhs':
                    if (node.children.length === 1) {
                        ret = node.children[0];
                    } else if (node.children[2] === 'dot') {
                        if (js) {
                            ret = [this.compile(node.children[1], js), node.children[0]];
                        } else {
                            ret = this.compile(node.children[1], js) + '.' + node.children[0];
                        }
                    } else if (node.children[2] === 'bracket') {
                        if (js) {
                            ret = [this.compile(node.children[1], js), this.compile(node.children[0], js)];
                        } else {
                            ret = this.compile(node.children[1], js) + '[' + this.compile(node.children[0], js) + ']';
                        }
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

/*
    Copyright 2008-2011
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



/*
    Default template driver for JS/CC generated parsers running as
    browser-based JavaScript/ECMAScript applications.
    
    WARNING:     This parser template will only run together with JSXGraph on a website.
    
    Features:
    - Parser trace messages
    - Integrated panic-mode error recovery
    
    Written 2007, 2008 by Jan Max Meyer, J.M.K S.F. Software Technologies
    Modified 2011 by Michael Gerhaeuser, JSXGraph
    
    This is in the public domain.
*/

    JXG.extend(JXG.JessieCode.prototype, /** @lends JXG.JessieCode.prototype */ {
        /**
         * Internal lexer method.
         * @private
         */
        lex: function (PCB) {
            var state, match, match_pos, start, pos, chr;

            state = 0;
            match = -1;
            match_pos = 0;
            start = 0;
            pos = PCB.offset + 1 + (match_pos - start);

            do {
                pos -= 1;
                state = 0;
                match = -2;
                start = pos;

                if (PCB.src.length <= start) {
                    return 69;
                }

                do {
                    chr = PCB.src.charCodeAt(pos);

                    switch (state) {
                    case 0:
                        if ((chr >= 9 && chr <= 10) || chr === 13 || chr === 32) {
                            state = 1;
                        } else if (chr === 33) {
                            state = 2;
                        } else if (chr === 35) {
                            state = 3;
                        } else if (chr === 36 || (chr >= 65 && chr <= 67) || (chr >= 71 && chr <= 72) || (chr >= 74 && chr <= 77) || (chr >= 79 && chr <= 81) || chr === 83 || chr === 86 || (chr >= 88 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 99) || (chr >= 103 && chr <= 104) || (chr >= 106 && chr <= 113) || chr === 115 || chr === 118 || (chr >= 120 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 37) {
                            state = 5;
                        } else if (chr === 40) {
                            state = 6;
                        } else if (chr === 41) {
                            state = 7;
                        } else if (chr === 42) {
                            state = 8;
                        } else if (chr === 43) {
                            state = 9;
                        } else if (chr === 44) {
                            state = 10;
                        } else if (chr === 45) {
                            state = 11;
                        } else if (chr === 46) {
                            state = 12;
                        } else if (chr === 47) {
                            state = 13;
                        } else if ((chr >= 48 && chr <= 57)) {
                            state = 14;
                        } else if (chr === 58) {
                            state = 15;
                        } else if (chr === 59) {
                            state = 16;
                        } else if (chr === 60) {
                            state = 17;
                        } else if (chr === 61) {
                            state = 18;
                        } else if (chr === 62) {
                            state = 19;
                        } else if (chr === 63) {
                            state = 20;
                        } else if (chr === 91) {
                            state = 21;
                        } else if (chr === 93) {
                            state = 22;
                        } else if (chr === 94) {
                            state = 23;
                        } else if (chr === 123) {
                            state = 24;
                        } else if (chr === 124) {
                            state = 25;
                        } else if (chr === 125) {
                            state = 26;
                        } else if (chr === 38) {
                            state = 50;
                        } else if (chr === 68 || chr === 100) {
                            state = 51;
                        } else if (chr === 39) {
                            state = 53;
                        } else if (chr === 73 || chr === 105) {
                            state = 54;
                        } else if (chr === 126) {
                            state = 55;
                        } else if (chr === 70 || chr === 102) {
                            state = 67;
                        } else if (chr === 78) {
                            state = 68;
                        } else if (chr === 85 || chr === 117) {
                            state = 69;
                        } else if (chr === 69 || chr === 101) {
                            state = 77;
                        } else if (chr === 84 || chr === 116) {
                            state = 78;
                        } else if (chr === 87 || chr === 119) {
                            state = 84;
                        } else if (chr === 82 || chr === 114) {
                            state = 88;
                        } else {
                            state = -1;
                        }
                        break;

                    case 1:
                        state = -1;
                        match = 2;
                        match_pos = pos;
                        break;

                    case 2:
                        if (chr === 61) {
                            state = 27;
                        } else {
                            state = -1;
                        }
                        match = 31;
                        match_pos = pos;
                        break;

                    case 3:
                        state = -1;
                        match = 41;
                        match_pos = pos;
                        break;

                    case 4:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 122)) {
                            state = 4;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 5:
                        state = -1;
                        match = 35;
                        match_pos = pos;
                        break;

                    case 6:
                        state = -1;
                        match = 38;
                        match_pos = pos;
                        break;

                    case 7:
                        state = -1;
                        match = 39;
                        match_pos = pos;
                        break;

                    case 8:
                        state = -1;
                        match = 36;
                        match_pos = pos;
                        break;

                    case 9:
                        state = -1;
                        match = 32;
                        match_pos = pos;
                        break;

                    case 10:
                        state = -1;
                        match = 40;
                        match_pos = pos;
                        break;

                    case 11:
                        state = -1;
                        match = 33;
                        match_pos = pos;
                        break;

                    case 12:
                        if ((chr >= 48 && chr <= 57)) {
                            state = 30;
                        } else {
                            state = -1;
                        }
                        match = 45;
                        match_pos = pos;
                        break;

                    case 13:
                        state = -1;
                        match = 34;
                        match_pos = pos;
                        break;

                    case 14:
                        if ((chr >= 48 && chr <= 57)) {
                            state = 14;
                        } else if (chr === 46) {
                            state = 30;
                        } else {
                            state = -1;
                        }
                        match = 49;
                        match_pos = pos;
                        break;

                    case 15:
                        state = -1;
                        match = 43;
                        match_pos = pos;
                        break;

                    case 16:
                        state = -1;
                        match = 20;
                        match_pos = pos;
                        break;

                    case 17:
                        if (chr === 60) {
                            state = 31;
                        } else if (chr === 61) {
                            state = 32;
                        } else {
                            state = -1;
                        }
                        match = 28;
                        match_pos = pos;
                        break;

                    case 18:
                        if (chr === 61) {
                            state = 33;
                        } else {
                            state = -1;
                        }
                        match = 21;
                        match_pos = pos;
                        break;

                    case 19:
                        if (chr === 61) {
                            state = 34;
                        } else if (chr === 62) {
                            state = 35;
                        } else {
                            state = -1;
                        }
                        match = 27;
                        match_pos = pos;
                        break;

                    case 20:
                        state = -1;
                        match = 42;
                        match_pos = pos;
                        break;

                    case 21:
                        state = -1;
                        match = 16;
                        match_pos = pos;
                        break;

                    case 22:
                        state = -1;
                        match = 17;
                        match_pos = pos;
                        break;

                    case 23:
                        state = -1;
                        match = 37;
                        match_pos = pos;
                        break;

                    case 24:
                        state = -1;
                        match = 18;
                        match_pos = pos;
                        break;

                    case 25:
                        if (chr === 124) {
                            state = 38;
                        } else {
                            state = -1;
                        }
                        match = 44;
                        match_pos = pos;
                        break;

                    case 26:
                        state = -1;
                        match = 19;
                        match_pos = pos;
                        break;

                    case 27:
                        state = -1;
                        match = 23;
                        match_pos = pos;
                        break;

                    case 28:
                        state = -1;
                        match = 30;
                        match_pos = pos;
                        break;

                    case 29:
                        state = -1;
                        match = 48;
                        match_pos = pos;
                        break;

                    case 30:
                        if ((chr >= 48 && chr <= 57)) {
                            state = 30;
                        } else {
                            state = -1;
                        }
                        match = 50;
                        match_pos = pos;
                        break;

                    case 31:
                        state = -1;
                        match = 14;
                        match_pos = pos;
                        break;

                    case 32:
                        state = -1;
                        match = 25;
                        match_pos = pos;
                        break;

                    case 33:
                        state = -1;
                        match = 22;
                        match_pos = pos;
                        break;

                    case 34:
                        state = -1;
                        match = 26;
                        match_pos = pos;
                        break;

                    case 35:
                        state = -1;
                        match = 15;
                        match_pos = pos;
                        break;

                    case 36:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 122)) {
                            state = 4;
                        } else {
                            state = -1;
                        }
                        match = 6;
                        match_pos = pos;
                        break;

                    case 37:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 122)) {
                            state = 4;
                        } else {
                            state = -1;
                        }
                        match = 3;
                        match_pos = pos;
                        break;

                    case 38:
                        state = -1;
                        match = 29;
                        match_pos = pos;
                        break;

                    case 39:
                        state = -1;
                        match = 24;
                        match_pos = pos;
                        break;

                    case 40:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 122)) {
                            state = 4;
                        } else {
                            state = -1;
                        }
                        match = 7;
                        match_pos = pos;
                        break;

                    case 41:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 122)) {
                            state = 4;
                        } else {
                            state = -1;
                        }
                        match = 46;
                        match_pos = pos;
                        break;

                    case 42:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 122)) {
                            state = 4;
                        } else {
                            state = -1;
                        }
                        match = 9;
                        match_pos = pos;
                        break;

                    case 43:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 122)) {
                            state = 4;
                        } else {
                            state = -1;
                        }
                        match = 4;
                        match_pos = pos;
                        break;

                    case 44:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 122)) {
                            state = 4;
                        } else {
                            state = -1;
                        }
                        match = 12;
                        match_pos = pos;
                        break;

                    case 45:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 122)) {
                            state = 4;
                        } else {
                            state = -1;
                        }
                        match = 13;
                        match_pos = pos;
                        break;

                    case 46:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 122)) {
                            state = 4;
                        } else {
                            state = -1;
                        }
                        match = 5;
                        match_pos = pos;
                        break;

                    case 47:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 122)) {
                            state = 4;
                        } else {
                            state = -1;
                        }
                        match = 11;
                        match_pos = pos;
                        break;

                    case 48:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 122)) {
                            state = 4;
                        } else {
                            state = -1;
                        }
                        match = 10;
                        match_pos = pos;
                        break;

                    case 49:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 122)) {
                            state = 4;
                        } else {
                            state = -1;
                        }
                        match = 8;
                        match_pos = pos;
                        break;

                    case 50:
                        if (chr === 38) {
                            state = 28;
                        } else {
                            state = -1;
                        }
                        break;

                    case 51:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 68) || (chr >= 70 && chr <= 78) || (chr >= 80 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 100) || (chr >= 102 && chr <= 110) || (chr >= 112 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 79 || chr === 111) {
                            state = 36;
                        } else if (chr === 69 || chr === 101) {
                            state = 85;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 52:
                        if (chr === 39) {
                            state = 29;
                        } else if ((chr >= 0 && chr <= 38) || (chr >= 40 && chr <= 91) || (chr >= 93 && chr <= 254)) {
                            state = 53;
                        } else if (chr === 92) {
                            state = 57;
                        } else {
                            state = -1;
                        }
                        match = 48;
                        match_pos = pos;
                        break;

                    case 53:
                        if (chr === 39) {
                            state = 29;
                        } else if ((chr >= 0 && chr <= 38) || (chr >= 40 && chr <= 91) || (chr >= 93 && chr <= 254)) {
                            state = 53;
                        } else if (chr === 92) {
                            state = 57;
                        } else {
                            state = -1;
                        }
                        break;

                    case 54:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 69) || (chr >= 71 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 101) || (chr >= 103 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 70 || chr === 102) {
                            state = 37;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 55:
                        if (chr === 61) {
                            state = 39;
                        } else {
                            state = -1;
                        }
                        break;

                    case 56:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 81) || (chr >= 83 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 113) || (chr >= 115 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 82 || chr === 114) {
                            state = 40;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 57:
                        if (chr === 39) {
                            state = 52;
                        } else if ((chr >= 0 && chr <= 38) || (chr >= 40 && chr <= 91) || (chr >= 93 && chr <= 254)) {
                            state = 53;
                        } else if (chr === 92) {
                            state = 57;
                        } else {
                            state = -1;
                        }
                        break;

                    case 58:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 77) || (chr >= 79 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 78) {
                            state = 41;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 59:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 68) || (chr >= 70 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 100) || (chr >= 102 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 69 || chr === 101) {
                            state = 42;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 60:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 68) || (chr >= 70 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 100) || (chr >= 102 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 69 || chr === 101) {
                            state = 43;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 61:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 68) || (chr >= 70 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 100) || (chr >= 102 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 69 || chr === 101) {
                            state = 44;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 62:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 68) || (chr >= 70 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 100) || (chr >= 102 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 69 || chr === 101) {
                            state = 45;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 63:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 68) || (chr >= 70 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 100) || (chr >= 102 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 69 || chr === 101) {
                            state = 46;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 64:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 68) || (chr >= 70 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 100) || (chr >= 102 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 69 || chr === 101) {
                            state = 47;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 65:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 77) || (chr >= 79 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 109) || (chr >= 111 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 78 || chr === 110) {
                            state = 48;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 66:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 77) || (chr >= 79 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 109) || (chr >= 111 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 78 || chr === 110) {
                            state = 49;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 67:
                        if ((chr >= 48 && chr <= 57) || (chr >= 66 && chr <= 78) || (chr >= 80 && chr <= 84) || (chr >= 86 && chr <= 90) || chr === 95 || (chr >= 98 && chr <= 110) || (chr >= 112 && chr <= 116) || (chr >= 118 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 79 || chr === 111) {
                            state = 56;
                        } else if (chr === 65 || chr === 97) {
                            state = 79;
                        } else if (chr === 85 || chr === 117) {
                            state = 90;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 68:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 90) || chr === 95 || (chr >= 98 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 97) {
                            state = 58;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 69:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 82) || (chr >= 84 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 114) || (chr >= 116 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 83 || chr === 115) {
                            state = 59;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 70:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 82) || (chr >= 84 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 114) || (chr >= 116 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 83 || chr === 115) {
                            state = 60;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 71:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 84) || (chr >= 86 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 116) || (chr >= 118 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 85 || chr === 117) {
                            state = 61;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 72:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 82) || (chr >= 84 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 114) || (chr >= 116 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 83 || chr === 115) {
                            state = 62;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 73:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 75) || (chr >= 77 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 107) || (chr >= 109 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 76 || chr === 108) {
                            state = 63;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 74:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 83) || (chr >= 85 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 115) || (chr >= 117 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 84 || chr === 116) {
                            state = 64;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 75:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 81) || (chr >= 83 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 113) || (chr >= 115 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 82 || chr === 114) {
                            state = 65;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 76:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 78) || (chr >= 80 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 110) || (chr >= 112 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 79 || chr === 111) {
                            state = 66;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 77:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 75) || (chr >= 77 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 107) || (chr >= 109 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 76 || chr === 108) {
                            state = 70;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 78:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 81) || (chr >= 83 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 113) || (chr >= 115 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 82 || chr === 114) {
                            state = 71;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 79:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 75) || (chr >= 77 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 107) || (chr >= 109 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 76 || chr === 108) {
                            state = 72;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 80:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 72) || (chr >= 74 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 104) || (chr >= 106 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 73 || chr === 105) {
                            state = 73;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 81:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 68) || (chr >= 70 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 100) || (chr >= 102 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 69 || chr === 101) {
                            state = 74;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 82:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 84) || (chr >= 86 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 116) || (chr >= 118 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 85 || chr === 117) {
                            state = 75;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 83:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 72) || (chr >= 74 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 104) || (chr >= 106 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 73 || chr === 105) {
                            state = 76;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 84:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 71) || (chr >= 73 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 103) || (chr >= 105 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 72 || chr === 104) {
                            state = 80;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 85:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 75) || (chr >= 77 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 107) || (chr >= 109 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 76 || chr === 108) {
                            state = 81;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 86:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 83) || (chr >= 85 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 115) || (chr >= 117 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 84 || chr === 116) {
                            state = 82;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 87:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 83) || (chr >= 85 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 115) || (chr >= 117 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 84 || chr === 116) {
                            state = 83;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 88:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 68) || (chr >= 70 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 100) || (chr >= 102 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 69 || chr === 101) {
                            state = 86;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 89:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 66) || (chr >= 68 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 98) || (chr >= 100 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 67 || chr === 99) {
                            state = 87;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    case 90:
                        if ((chr >= 48 && chr <= 57) || (chr >= 65 && chr <= 77) || (chr >= 79 && chr <= 90) || chr === 95 || (chr >= 97 && chr <= 109) || (chr >= 111 && chr <= 122)) {
                            state = 4;
                        } else if (chr === 78 || chr === 110) {
                            state = 89;
                        } else {
                            state = -1;
                        }
                        match = 47;
                        match_pos = pos;
                        break;

                    }

                    //Line- and column-counter
                    if (state > -1) {
                        if (chr === 10) {
                            PCB.line += 1;
                            PCB.column = 0;
                            if (this.countLines) {
                                this.parCurLine = PCB.line;
                            }
                        }
                        PCB.column += 1;
                        if (this.countLines) {
                            this.parCurColumn = PCB.column;
                        }
                    }

                    pos += 1;

                } while (state > -1);

            } while (2 > -1 && match === 2);

            if (match > -1) {
                PCB.att = PCB.src.substr(start, match_pos - start);
                PCB.offset = match_pos;

                if (match === 48) {
                    PCB.att = PCB.att.substr(1, PCB.att.length - 2);
                    PCB.att = PCB.att.replace(/\\\'/g, "\'");
                }
            } else {
                PCB.att = '';
                match = -1;
            }

            return match;
        },

        /**
         * Internal parse tree generator.
         * @param {String} src source code
         * @param {Array} err_off The positions where the errors occured are stored here.
         * @param {Array} err_la What the parser expected will be stored here.
         * @private
         */
        genTree: function (src, err_off, err_la) {
            var act, undef, rval, i, pop_tab, act_tab, goto_tab, defact_tab, labels,
                sstack = [],
                vstack = [],
                err_cnt = 0,
                PCB = {
                    la: 0,
                    act: 0,
                    offset: 0,
                    src: src,
                    att: '',
                    line: 1,
                    column: 1,
                    error_step: 0
                };

            // Pop-Table
            pop_tab = [
                [/* Program' */0, 1],
                [/* Program */51, 2],
                [/* Program */51, 0],
                [/* Stmt_List */53, 2],
                [/* Stmt_List */53, 0],
                [/* Param_List */54, 3],
                [/* Param_List */54, 1],
                [/* Param_List */54, 0],
                [/* Prop_List */56, 3],
                [/* Prop_List */56, 1],
                [/* Prop_List */56, 0],
                [/* Prop */57, 3],
                [/* Param_Def_List */58, 3],
                [/* Param_Def_List */58, 1],
                [/* Param_Def_List */58, 0],
                [/* Attr_List */59, 3],
                [/* Attr_List */59, 1],
                [/* Assign */62, 3],
                [/* Stmt */52, 3],
                [/* Stmt */52, 5],
                [/* Stmt */52, 3],
                [/* Stmt */52, 5],
                [/* Stmt */52, 9],
                [/* Stmt */52, 3],
                [/* Stmt */52, 2],
                [/* Stmt */52, 2],
                [/* Stmt */52, 2],
                [/* Stmt */52, 2],
                [/* Stmt */52, 3],
                [/* Stmt */52, 1],
                [/* Lhs */61, 3],
                [/* Lhs */61, 4],
                [/* Lhs */61, 1],
                [/* Expression */55, 3],
                [/* Expression */55, 3],
                [/* Expression */55, 3],
                [/* Expression */55, 3],
                [/* Expression */55, 3],
                [/* Expression */55, 3],
                [/* Expression */55, 3],
                [/* Expression */55, 5],
                [/* Expression */55, 1],
                [/* LogExp */64, 3],
                [/* LogExp */64, 3],
                [/* LogExp */64, 2],
                [/* LogExp */64, 1],
                [/* AddSubExp */63, 3],
                [/* AddSubExp */63, 3],
                [/* AddSubExp */63, 1],
                [/* MulDivExp */66, 3],
                [/* MulDivExp */66, 3],
                [/* MulDivExp */66, 3],
                [/* MulDivExp */66, 1],
                [/* ExpExp */68, 3],
                [/* ExpExp */68, 1],
                [/* NegExp */67, 2],
                [/* NegExp */67, 2],
                [/* NegExp */67, 1],
                [/* ExtValue */60, 4],
                [/* ExtValue */60, 7],
                [/* ExtValue */60, 4],
                [/* ExtValue */60, 5],
                [/* ExtValue */60, 3],
                [/* ExtValue */60, 1],
                [/* Value */65, 1],
                [/* Value */65, 1],
                [/* Value */65, 1],
                [/* Value */65, 3],
                [/* Value */65, 1],
                [/* Value */65, 7],
                [/* Value */65, 3],
                [/* Value */65, 3],
                [/* Value */65, 1],
                [/* Value */65, 1],
                [/* Value */65, 1]
            ];

            // Action-Table
            act_tab = [
                /* State 0 */
                [],
                /* State 1 */
                [/* "IF" */3, 3, /* "WHILE" */5, 4, /* "DO" */6, 5, /* "FOR" */7, 6, /* "USE" */9, 7, /* "DELETE" */11, 8, /* "RETURN" */10, 9, /* "{" */18, 12, /* ";" */20, 13, /* "Identifier" */47, 17, /* "!" */31, 18, /* "Integer" */49, 22, /* "Float" */50, 23, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31, /* "-" */33, 33, /* "+" */32, 34],
                /* State 2 */
                [],
                /* State 3 */
                [/* "!" */31, 18, /* "-" */33, 33, /* "+" */32, 34, /* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 4 */
                [/* "!" */31, 18, /* "-" */33, 33, /* "+" */32, 34, /* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 5 */
                [/* "IF" */3, 3, /* "WHILE" */5, 4, /* "DO" */6, 5, /* "FOR" */7, 6, /* "USE" */9, 7, /* "DELETE" */11, 8, /* "RETURN" */10, 9, /* "{" */18, 12, /* ";" */20, 13, /* "Identifier" */47, 17, /* "!" */31, 18, /* "Integer" */49, 22, /* "Float" */50, 23, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31, /* "-" */33, 33, /* "+" */32, 34],
                /* State 6 */
                [/* "(" */38, 41],
                /* State 7 */
                [/* "Identifier" */47, 42],
                /* State 8 */
                [/* "Identifier" */47, 43],
                /* State 9 */
                [/* "IF" */3, 3, /* "WHILE" */5, 4, /* "DO" */6, 5, /* "FOR" */7, 6, /* "USE" */9, 7, /* "DELETE" */11, 8, /* "RETURN" */10, 9, /* "{" */18, 12, /* ";" */20, 13, /* "Identifier" */47, 17, /* "!" */31, 18, /* "Integer" */49, 22, /* "Float" */50, 23, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31, /* "-" */33, 33, /* "+" */32, 34],
                /* State 10 */
                [/* ";" */20, 45],
                /* State 11 */
                [/* "?" */42, 46, /* "~=" */24, 47, /* "!=" */23, 48, /* ">=" */26, 49, /* "<=" */25, 50, /* ">" */27, 51, /* "<" */28, 52, /* "==" */22, 53, /* ";" */20, 54],
                /* State 12 */
                [],
                /* State 13 */
                [],
                /* State 14 */
                [/* "=" */21, 56],
                /* State 15 */
                [/* "&&" */30, 57, /* "||" */29, 58],
                /* State 16 */
                [/* "." */45, 59, /* "(" */38, 60, /* "[" */16, 61, /* "^" */37, 62],
                /* State 17 */
                [/* "=" */21, -32],
                /* State 18 */
                [/* "!" */31, 18, /* "-" */33, 33, /* "+" */32, 34, /* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 19 */
                [/* "+" */32, 64, /* "-" */33, 65],
                /* State 20 */
                [],
                /* State 21 */
                [/* "%" */35, 66, /* "/" */34, 67, /* "*" */36, 68],
                /* State 22 */
                [],
                /* State 23 */
                [],
                /* State 24 */
                [/* "!" */31, 18, /* "-" */33, 33, /* "+" */32, 34, /* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 25 */
                [],
                /* State 26 */
                [/* "(" */38, 70],
                /* State 27 */
                [/* "Identifier" */47, 73],
                /* State 28 */
                [/* "!" */31, 18, /* "-" */33, 33, /* "+" */32, 34, /* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 29 */
                [],
                /* State 30 */
                [],
                /* State 31 */
                [],
                /* State 32 */
                [],
                /* State 33 */
                [/* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 34 */
                [/* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 35 */
                [],
                /* State 36 */
                [/* "?" */42, 46, /* "~=" */24, 47, /* "!=" */23, 48, /* ">=" */26, 49, /* "<=" */25, 50, /* ">" */27, 51, /* "<" */28, 52, /* "==" */22, 53, /* "IF" */3, 3, /* "WHILE" */5, 4, /* "DO" */6, 5, /* "FOR" */7, 6, /* "USE" */9, 7, /* "DELETE" */11, 8, /* "RETURN" */10, 9, /* "{" */18, 12, /* ";" */20, 13, /* "Identifier" */47, 17, /* "!" */31, 18, /* "Integer" */49, 22, /* "Float" */50, 23, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31, /* "-" */33, 33, /* "+" */32, 34],
                /* State 37 */
                [/* "." */45, 79, /* "(" */38, 60, /* "[" */16, 80, /* "^" */37, 62],
                /* State 38 */
                [],
                /* State 39 */
                [/* "?" */42, 46, /* "~=" */24, 47, /* "!=" */23, 48, /* ">=" */26, 49, /* "<=" */25, 50, /* ">" */27, 51, /* "<" */28, 52, /* "==" */22, 53, /* "IF" */3, 3, /* "WHILE" */5, 4, /* "DO" */6, 5, /* "FOR" */7, 6, /* "USE" */9, 7, /* "DELETE" */11, 8, /* "RETURN" */10, 9, /* "{" */18, 12, /* ";" */20, 13, /* "Identifier" */47, 17, /* "!" */31, 18, /* "Integer" */49, 22, /* "Float" */50, 23, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31, /* "-" */33, 33, /* "+" */32, 34],
                /* State 40 */
                [/* "WHILE" */5, 82],
                /* State 41 */
                [/* "Identifier" */47, 17, /* "Integer" */49, 22, /* "Float" */50, 23, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 42 */
                [/* ";" */20, 85],
                /* State 43 */
                [],
                /* State 44 */
                [],
                /* State 45 */
                [],
                /* State 46 */
                [/* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 47 */
                [/* "!" */31, 18, /* "-" */33, 33, /* "+" */32, 34, /* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 48 */
                [/* "!" */31, 18, /* "-" */33, 33, /* "+" */32, 34, /* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 49 */
                [/* "!" */31, 18, /* "-" */33, 33, /* "+" */32, 34, /* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 50 */
                [/* "!" */31, 18, /* "-" */33, 33, /* "+" */32, 34, /* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 51 */
                [/* "!" */31, 18, /* "-" */33, 33, /* "+" */32, 34, /* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 52 */
                [/* "!" */31, 18, /* "-" */33, 33, /* "+" */32, 34, /* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 53 */
                [/* "!" */31, 18, /* "-" */33, 33, /* "+" */32, 34, /* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 54 */
                [],
                /* State 55 */
                [/* "}" */19, 94, /* "IF" */3, 3, /* "WHILE" */5, 4, /* "DO" */6, 5, /* "FOR" */7, 6, /* "USE" */9, 7, /* "DELETE" */11, 8, /* "RETURN" */10, 9, /* "{" */18, 12, /* ";" */20, 13, /* "Identifier" */47, 17, /* "!" */31, 18, /* "Integer" */49, 22, /* "Float" */50, 23, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31, /* "-" */33, 33, /* "+" */32, 34],
                /* State 56 */
                [/* "!" */31, 18, /* "-" */33, 33, /* "+" */32, 34, /* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 57 */
                [/* "-" */33, 33, /* "+" */32, 34, /* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 58 */
                [/* "-" */33, 33, /* "+" */32, 34, /* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 59 */
                [/* "Identifier" */47, 99],
                /* State 60 */
                [/* "!" */31, 18, /* "-" */33, 33, /* "+" */32, 34, /* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 61 */
                [/* "-" */33, 33, /* "+" */32, 34, /* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 62 */
                [/* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 63 */
                [/* "&&" */30, 57, /* "||" */29, 58],
                /* State 64 */
                [/* "-" */33, 33, /* "+" */32, 34, /* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 65 */
                [/* "-" */33, 33, /* "+" */32, 34, /* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 66 */
                [/* "-" */33, 33, /* "+" */32, 34, /* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 67 */
                [/* "-" */33, 33, /* "+" */32, 34, /* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 68 */
                [/* "-" */33, 33, /* "+" */32, 34, /* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 69 */
                [/* ")" */39, 108, /* "?" */42, 46, /* "~=" */24, 47, /* "!=" */23, 48, /* ">=" */26, 49, /* "<=" */25, 50, /* ">" */27, 51, /* "<" */28, 52, /* "==" */22, 53],
                /* State 70 */
                [/* "Identifier" */47, 110],
                /* State 71 */
                [/* ">>" */15, 111, /* "," */40, 112],
                /* State 72 */
                [],
                /* State 73 */
                [/* ":" */43, 113],
                /* State 74 */
                [/* "]" */17, 114, /* "," */40, 115],
                /* State 75 */
                [/* "?" */42, 46, /* "~=" */24, 47, /* "!=" */23, 48, /* ">=" */26, 49, /* "<=" */25, 50, /* ">" */27, 51, /* "<" */28, 52, /* "==" */22, 53],
                /* State 76 */
                [],
                /* State 77 */
                [],
                /* State 78 */
                [/* "ELSE" */4, 116],
                /* State 79 */
                [/* "Identifier" */47, 117],
                /* State 80 */
                [/* "-" */33, 33, /* "+" */32, 34, /* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 81 */
                [],
                /* State 82 */
                [/* "!" */31, 18, /* "-" */33, 33, /* "+" */32, 34, /* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 83 */
                [/* ";" */20, 120],
                /* State 84 */
                [/* "." */45, 59, /* "(" */38, 60, /* "[" */16, 61],
                /* State 85 */
                [],
                /* State 86 */
                [/* ":" */43, 121],
                /* State 87 */
                [/* "&&" */30, 57, /* "||" */29, 58],
                /* State 88 */
                [/* "&&" */30, 57, /* "||" */29, 58],
                /* State 89 */
                [/* "&&" */30, 57, /* "||" */29, 58],
                /* State 90 */
                [/* "&&" */30, 57, /* "||" */29, 58],
                /* State 91 */
                [/* "&&" */30, 57, /* "||" */29, 58],
                /* State 92 */
                [/* "&&" */30, 57, /* "||" */29, 58],
                /* State 93 */
                [/* "&&" */30, 57, /* "||" */29, 58],
                /* State 94 */
                [],
                /* State 95 */
                [],
                /* State 96 */
                [/* "?" */42, 46, /* "~=" */24, 47, /* "!=" */23, 48, /* ">=" */26, 49, /* "<=" */25, 50, /* ">" */27, 51, /* "<" */28, 52, /* "==" */22, 53],
                /* State 97 */
                [/* "+" */32, 64, /* "-" */33, 65],
                /* State 98 */
                [/* "+" */32, 64, /* "-" */33, 65],
                /* State 99 */
                [/* "=" */21, -30],
                /* State 100 */
                [/* ")" */39, 122, /* "," */40, 115],
                /* State 101 */
                [/* "]" */17, 123, /* "+" */32, 64, /* "-" */33, 65],
                /* State 102 */
                [],
                /* State 103 */
                [/* "%" */35, 66, /* "/" */34, 67, /* "*" */36, 68],
                /* State 104 */
                [/* "%" */35, 66, /* "/" */34, 67, /* "*" */36, 68],
                /* State 105 */
                [],
                /* State 106 */
                [],
                /* State 107 */
                [],
                /* State 108 */
                [],
                /* State 109 */
                [/* ")" */39, 124, /* "," */40, 125],
                /* State 110 */
                [],
                /* State 111 */
                [],
                /* State 112 */
                [/* "Identifier" */47, 73],
                /* State 113 */
                [/* "!" */31, 18, /* "-" */33, 33, /* "+" */32, 34, /* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 114 */
                [],
                /* State 115 */
                [/* "!" */31, 18, /* "-" */33, 33, /* "+" */32, 34, /* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 116 */
                [/* "IF" */3, 3, /* "WHILE" */5, 4, /* "DO" */6, 5, /* "FOR" */7, 6, /* "USE" */9, 7, /* "DELETE" */11, 8, /* "RETURN" */10, 9, /* "{" */18, 12, /* ";" */20, 13, /* "Identifier" */47, 17, /* "!" */31, 18, /* "Integer" */49, 22, /* "Float" */50, 23, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31, /* "-" */33, 33, /* "+" */32, 34],
                /* State 117 */
                [],
                /* State 118 */
                [/* "]" */17, 130, /* "+" */32, 64, /* "-" */33, 65],
                /* State 119 */
                [/* "?" */42, 46, /* "~=" */24, 47, /* "!=" */23, 48, /* ">=" */26, 49, /* "<=" */25, 50, /* ">" */27, 51, /* "<" */28, 52, /* "==" */22, 53, /* ";" */20, 131],
                /* State 120 */
                [/* "!" */31, 18, /* "-" */33, 33, /* "+" */32, 34, /* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 121 */
                [/* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 122 */
                [/* "[" */16, 135, /* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 123 */
                [/* "=" */21, -31],
                /* State 124 */
                [/* "{" */18, 137],
                /* State 125 */
                [/* "Identifier" */47, 138],
                /* State 126 */
                [],
                /* State 127 */
                [/* "?" */42, 46, /* "~=" */24, 47, /* "!=" */23, 48, /* ">=" */26, 49, /* "<=" */25, 50, /* ">" */27, 51, /* "<" */28, 52, /* "==" */22, 53],
                /* State 128 */
                [/* "?" */42, 46, /* "~=" */24, 47, /* "!=" */23, 48, /* ">=" */26, 49, /* "<=" */25, 50, /* ">" */27, 51, /* "<" */28, 52, /* "==" */22, 53],
                /* State 129 */
                [],
                /* State 130 */
                [],
                /* State 131 */
                [],
                /* State 132 */
                [/* "?" */42, 46, /* "~=" */24, 47, /* "!=" */23, 48, /* ">=" */26, 49, /* "<=" */25, 50, /* ">" */27, 51, /* "<" */28, 52, /* "==" */22, 53, /* ";" */20, 139],
                /* State 133 */
                [],
                /* State 134 */
                [/* "," */40, 140],
                /* State 135 */
                [/* "-" */33, 33, /* "+" */32, 34, /* "!" */31, 18, /* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 136 */
                [/* "." */45, 79, /* "(" */38, 60, /* "[" */16, 80],
                /* State 137 */
                [],
                /* State 138 */
                [],
                /* State 139 */
                [/* "Identifier" */47, 17, /* "Integer" */49, 22, /* "Float" */50, 23, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 140 */
                [/* "Integer" */49, 22, /* "Float" */50, 23, /* "Identifier" */47, 38, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31],
                /* State 141 */
                [/* "]" */17, 145, /* "+" */32, 64, /* "-" */33, 65],
                /* State 142 */
                [/* "}" */19, 146, /* "IF" */3, 3, /* "WHILE" */5, 4, /* "DO" */6, 5, /* "FOR" */7, 6, /* "USE" */9, 7, /* "DELETE" */11, 8, /* "RETURN" */10, 9, /* "{" */18, 12, /* ";" */20, 13, /* "Identifier" */47, 17, /* "!" */31, 18, /* "Integer" */49, 22, /* "Float" */50, 23, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31, /* "-" */33, 33, /* "+" */32, 34],
                /* State 143 */
                [/* ")" */39, 147],
                /* State 144 */
                [/* "." */45, 79, /* "(" */38, 60, /* "[" */16, 80],
                /* State 145 */
                [],
                /* State 146 */
                [],
                /* State 147 */
                [/* "IF" */3, 3, /* "WHILE" */5, 4, /* "DO" */6, 5, /* "FOR" */7, 6, /* "USE" */9, 7, /* "DELETE" */11, 8, /* "RETURN" */10, 9, /* "{" */18, 12, /* ";" */20, 13, /* "Identifier" */47, 17, /* "!" */31, 18, /* "Integer" */49, 22, /* "Float" */50, 23, /* "(" */38, 24, /* "String" */48, 25, /* "FUNCTION" */8, 26, /* "<<" */14, 27, /* "[" */16, 28, /* "TRUE" */12, 29, /* "FALSE" */13, 30, /* "NaN" */46, 31, /* "-" */33, 33, /* "+" */32, 34],
                /* State 148 */
                []
            ];

            // Goto-Table
            goto_tab = [
                /* State 0 */
                [/* Program */51, 1],
                /* State 1 */
                [/* Stmt */52, 2, /* Assign */62, 10, /* Expression */55, 11, /* Lhs */61, 14, /* LogExp */64, 15, /* ExtValue */60, 16, /* AddSubExp */63, 19, /* Value */65, 20, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35],
                /* State 2 */
                [],
                /* State 3 */
                [/* Expression */55, 36, /* LogExp */64, 15, /* AddSubExp */63, 19, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 4 */
                [/* Expression */55, 39, /* LogExp */64, 15, /* AddSubExp */63, 19, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 5 */
                [/* Stmt */52, 40, /* Assign */62, 10, /* Expression */55, 11, /* Lhs */61, 14, /* LogExp */64, 15, /* ExtValue */60, 16, /* AddSubExp */63, 19, /* Value */65, 20, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35],
                /* State 6 */
                [],
                /* State 7 */
                [],
                /* State 8 */
                [],
                /* State 9 */
                [/* Stmt */52, 44, /* Assign */62, 10, /* Expression */55, 11, /* Lhs */61, 14, /* LogExp */64, 15, /* ExtValue */60, 16, /* AddSubExp */63, 19, /* Value */65, 20, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35],
                /* State 10 */
                [],
                /* State 11 */
                [],
                /* State 12 */
                [/* Stmt_List */53, 55],
                /* State 13 */
                [],
                /* State 14 */
                [],
                /* State 15 */
                [],
                /* State 16 */
                [],
                /* State 17 */
                [],
                /* State 18 */
                [/* LogExp */64, 63, /* AddSubExp */63, 19, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 19 */
                [],
                /* State 20 */
                [],
                /* State 21 */
                [],
                /* State 22 */
                [],
                /* State 23 */
                [],
                /* State 24 */
                [/* Expression */55, 69, /* LogExp */64, 15, /* AddSubExp */63, 19, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 25 */
                [],
                /* State 26 */
                [],
                /* State 27 */
                [/* Prop_List */56, 71, /* Prop */57, 72],
                /* State 28 */
                [/* Param_List */54, 74, /* Expression */55, 75, /* LogExp */64, 15, /* AddSubExp */63, 19, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 29 */
                [],
                /* State 30 */
                [],
                /* State 31 */
                [],
                /* State 32 */
                [],
                /* State 33 */
                [/* ExpExp */68, 76, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 34 */
                [/* ExpExp */68, 77, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 35 */
                [],
                /* State 36 */
                [/* Stmt */52, 78, /* Assign */62, 10, /* Expression */55, 11, /* Lhs */61, 14, /* LogExp */64, 15, /* ExtValue */60, 16, /* AddSubExp */63, 19, /* Value */65, 20, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35],
                /* State 37 */
                [],
                /* State 38 */
                [],
                /* State 39 */
                [/* Stmt */52, 81, /* Assign */62, 10, /* Expression */55, 11, /* Lhs */61, 14, /* LogExp */64, 15, /* ExtValue */60, 16, /* AddSubExp */63, 19, /* Value */65, 20, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35],
                /* State 40 */
                [],
                /* State 41 */
                [/* Assign */62, 83, /* Lhs */61, 14, /* ExtValue */60, 84, /* Value */65, 20],
                /* State 42 */
                [],
                /* State 43 */
                [],
                /* State 44 */
                [],
                /* State 45 */
                [],
                /* State 46 */
                [/* Value */65, 86],
                /* State 47 */
                [/* LogExp */64, 87, /* AddSubExp */63, 19, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 48 */
                [/* LogExp */64, 88, /* AddSubExp */63, 19, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 49 */
                [/* LogExp */64, 89, /* AddSubExp */63, 19, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 50 */
                [/* LogExp */64, 90, /* AddSubExp */63, 19, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 51 */
                [/* LogExp */64, 91, /* AddSubExp */63, 19, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 52 */
                [/* LogExp */64, 92, /* AddSubExp */63, 19, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 53 */
                [/* LogExp */64, 93, /* AddSubExp */63, 19, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 54 */
                [],
                /* State 55 */
                [/* Stmt */52, 95, /* Assign */62, 10, /* Expression */55, 11, /* Lhs */61, 14, /* LogExp */64, 15, /* ExtValue */60, 16, /* AddSubExp */63, 19, /* Value */65, 20, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35],
                /* State 56 */
                [/* Expression */55, 96, /* LogExp */64, 15, /* AddSubExp */63, 19, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 57 */
                [/* AddSubExp */63, 97, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 58 */
                [/* AddSubExp */63, 98, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 59 */
                [],
                /* State 60 */
                [/* Param_List */54, 100, /* Expression */55, 75, /* LogExp */64, 15, /* AddSubExp */63, 19, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 61 */
                [/* AddSubExp */63, 101, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 62 */
                [/* ExpExp */68, 102, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 63 */
                [],
                /* State 64 */
                [/* MulDivExp */66, 103, /* NegExp */67, 32, /* ExpExp */68, 35, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 65 */
                [/* MulDivExp */66, 104, /* NegExp */67, 32, /* ExpExp */68, 35, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 66 */
                [/* NegExp */67, 105, /* ExpExp */68, 35, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 67 */
                [/* NegExp */67, 106, /* ExpExp */68, 35, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 68 */
                [/* NegExp */67, 107, /* ExpExp */68, 35, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 69 */
                [],
                /* State 70 */
                [/* Param_Def_List */58, 109],
                /* State 71 */
                [],
                /* State 72 */
                [],
                /* State 73 */
                [],
                /* State 74 */
                [],
                /* State 75 */
                [],
                /* State 76 */
                [],
                /* State 77 */
                [],
                /* State 78 */
                [],
                /* State 79 */
                [],
                /* State 80 */
                [/* AddSubExp */63, 118, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 81 */
                [],
                /* State 82 */
                [/* Expression */55, 119, /* LogExp */64, 15, /* AddSubExp */63, 19, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 83 */
                [],
                /* State 84 */
                [],
                /* State 85 */
                [],
                /* State 86 */
                [],
                /* State 87 */
                [],
                /* State 88 */
                [],
                /* State 89 */
                [],
                /* State 90 */
                [],
                /* State 91 */
                [],
                /* State 92 */
                [],
                /* State 93 */
                [],
                /* State 94 */
                [],
                /* State 95 */
                [],
                /* State 96 */
                [],
                /* State 97 */
                [],
                /* State 98 */
                [],
                /* State 99 */
                [],
                /* State 100 */
                [],
                /* State 101 */
                [],
                /* State 102 */
                [],
                /* State 103 */
                [],
                /* State 104 */
                [],
                /* State 105 */
                [],
                /* State 106 */
                [],
                /* State 107 */
                [],
                /* State 108 */
                [],
                /* State 109 */
                [],
                /* State 110 */
                [],
                /* State 111 */
                [],
                /* State 112 */
                [/* Prop */57, 126],
                /* State 113 */
                [/* Expression */55, 127, /* LogExp */64, 15, /* AddSubExp */63, 19, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 114 */
                [],
                /* State 115 */
                [/* Expression */55, 128, /* LogExp */64, 15, /* AddSubExp */63, 19, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 116 */
                [/* Stmt */52, 129, /* Assign */62, 10, /* Expression */55, 11, /* Lhs */61, 14, /* LogExp */64, 15, /* ExtValue */60, 16, /* AddSubExp */63, 19, /* Value */65, 20, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35],
                /* State 117 */
                [],
                /* State 118 */
                [],
                /* State 119 */
                [],
                /* State 120 */
                [/* Expression */55, 132, /* LogExp */64, 15, /* AddSubExp */63, 19, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 121 */
                [/* Value */65, 133],
                /* State 122 */
                [/* Attr_List */59, 134, /* ExtValue */60, 136, /* Value */65, 20],
                /* State 123 */
                [],
                /* State 124 */
                [],
                /* State 125 */
                [],
                /* State 126 */
                [],
                /* State 127 */
                [],
                /* State 128 */
                [],
                /* State 129 */
                [],
                /* State 130 */
                [],
                /* State 131 */
                [],
                /* State 132 */
                [],
                /* State 133 */
                [],
                /* State 134 */
                [],
                /* State 135 */
                [/* Param_List */54, 74, /* AddSubExp */63, 141, /* MulDivExp */66, 21, /* Expression */55, 75, /* NegExp */67, 32, /* LogExp */64, 15, /* ExpExp */68, 35, /* ExtValue */60, 37, /* Value */65, 20],
                /* State 136 */
                [],
                /* State 137 */
                [/* Stmt_List */53, 142],
                /* State 138 */
                [],
                /* State 139 */
                [/* Assign */62, 143, /* Lhs */61, 14, /* ExtValue */60, 84, /* Value */65, 20],
                /* State 140 */
                [/* ExtValue */60, 144, /* Value */65, 20],
                /* State 141 */
                [],
                /* State 142 */
                [/* Stmt */52, 95, /* Assign */62, 10, /* Expression */55, 11, /* Lhs */61, 14, /* LogExp */64, 15, /* ExtValue */60, 16, /* AddSubExp */63, 19, /* Value */65, 20, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35],
                /* State 143 */
                [],
                /* State 144 */
                [],
                /* State 145 */
                [],
                /* State 146 */
                [],
                /* State 147 */
                [/* Stmt */52, 148, /* Assign */62, 10, /* Expression */55, 11, /* Lhs */61, 14, /* LogExp */64, 15, /* ExtValue */60, 16, /* AddSubExp */63, 19, /* Value */65, 20, /* MulDivExp */66, 21, /* NegExp */67, 32, /* ExpExp */68, 35],
                /* State 148 */
                []
            ];

            // Default-Actions-Table
            defact_tab = [
                2,/* State 0 */
                0,/* State 1 */
                1,/* State 2 */
                -1,/* State 3 */
                -1,/* State 4 */
                -1,/* State 5 */
                -1,/* State 6 */
                -1,/* State 7 */
                -1,/* State 8 */
                -1,/* State 9 */
                -1,/* State 10 */
                -1,/* State 11 */
                4,/* State 12 */
                29,/* State 13 */
                -1,/* State 14 */
                41,/* State 15 */
                54,/* State 16 */
                66,/* State 17 */
                -1,/* State 18 */
                45,/* State 19 */
                63,/* State 20 */
                48,/* State 21 */
                64,/* State 22 */
                65,/* State 23 */
                -1,/* State 24 */
                68,/* State 25 */
                -1,/* State 26 */
                10,/* State 27 */
                7,/* State 28 */
                72,/* State 29 */
                73,/* State 30 */
                74,/* State 31 */
                52,/* State 32 */
                -1,/* State 33 */
                -1,/* State 34 */
                57,/* State 35 */
                -1,/* State 36 */
                54,/* State 37 */
                66,/* State 38 */
                -1,/* State 39 */
                -1,/* State 40 */
                -1,/* State 41 */
                -1,/* State 42 */
                24,/* State 43 */
                25,/* State 44 */
                26,/* State 45 */
                -1,/* State 46 */
                -1,/* State 47 */
                -1,/* State 48 */
                -1,/* State 49 */
                -1,/* State 50 */
                -1,/* State 51 */
                -1,/* State 52 */
                -1,/* State 53 */
                27,/* State 54 */
                -1,/* State 55 */
                -1,/* State 56 */
                -1,/* State 57 */
                -1,/* State 58 */
                -1,/* State 59 */
                7,/* State 60 */
                -1,/* State 61 */
                -1,/* State 62 */
                44,/* State 63 */
                -1,/* State 64 */
                -1,/* State 65 */
                -1,/* State 66 */
                -1,/* State 67 */
                -1,/* State 68 */
                -1,/* State 69 */
                14,/* State 70 */
                -1,/* State 71 */
                9,/* State 72 */
                -1,/* State 73 */
                -1,/* State 74 */
                6,/* State 75 */
                55,/* State 76 */
                56,/* State 77 */
                18,/* State 78 */
                -1,/* State 79 */
                -1,/* State 80 */
                20,/* State 81 */
                -1,/* State 82 */
                -1,/* State 83 */
                -1,/* State 84 */
                23,/* State 85 */
                -1,/* State 86 */
                39,/* State 87 */
                38,/* State 88 */
                37,/* State 89 */
                36,/* State 90 */
                35,/* State 91 */
                34,/* State 92 */
                33,/* State 93 */
                28,/* State 94 */
                3,/* State 95 */
                17,/* State 96 */
                43,/* State 97 */
                42,/* State 98 */
                62,/* State 99 */
                -1,/* State 100 */
                -1,/* State 101 */
                53,/* State 102 */
                47,/* State 103 */
                46,/* State 104 */
                51,/* State 105 */
                50,/* State 106 */
                49,/* State 107 */
                67,/* State 108 */
                -1,/* State 109 */
                13,/* State 110 */
                70,/* State 111 */
                -1,/* State 112 */
                -1,/* State 113 */
                71,/* State 114 */
                -1,/* State 115 */
                -1,/* State 116 */
                62,/* State 117 */
                -1,/* State 118 */
                -1,/* State 119 */
                -1,/* State 120 */
                -1,/* State 121 */
                60,/* State 122 */
                58,/* State 123 */
                -1,/* State 124 */
                -1,/* State 125 */
                8,/* State 126 */
                11,/* State 127 */
                5,/* State 128 */
                19,/* State 129 */
                58,/* State 130 */
                21,/* State 131 */
                -1,/* State 132 */
                40,/* State 133 */
                61,/* State 134 */
                7,/* State 135 */
                16,/* State 136 */
                4,/* State 137 */
                12,/* State 138 */
                -1,/* State 139 */
                -1,/* State 140 */
                45,/* State 141 */
                -1,/* State 142 */
                -1,/* State 143 */
                15,/* State 144 */
                59,/* State 145 */
                69,/* State 146 */
                -1,/* State 147 */
                22/* State 148 */
            ];



                // Symbol labels
            labels = [
                /* Non-terminal symbol */
                "Program'",
                /* Terminal symbol */
                "ERROR_RESYNC",
                /* Terminal symbol */
                "WHITESPACE",
                /* Terminal symbol */
                "IF",
                /* Terminal symbol */
                "ELSE",
                /* Terminal symbol */
                "WHILE",
                /* Terminal symbol */
                "DO",
                /* Terminal symbol */
                "FOR",
                /* Terminal symbol */
                "FUNCTION",
                /* Terminal symbol */
                "USE",
                /* Terminal symbol */
                "RETURN",
                /* Terminal symbol */
                "DELETE",
                /* Terminal symbol */
                "TRUE",
                /* Terminal symbol */
                "FALSE",
                /* Terminal symbol */
                "<<",
                /* Terminal symbol */
                ">>",
                /* Terminal symbol */
                "[",
                /* Terminal symbol */
                "]",
                /* Terminal symbol */
                "{",
                /* Terminal symbol */
                "}",
                /* Terminal symbol */
                ";",
                /* Terminal symbol */
                "=",
                /* Terminal symbol */
                "==",
                /* Terminal symbol */
                "!=",
                /* Terminal symbol */
                "~=",
                /* Terminal symbol */
                "<=",
                /* Terminal symbol */
                ">=",
                /* Terminal symbol */
                ">",
                /* Terminal symbol */
                "<",
                /* Terminal symbol */
                "||",
                /* Terminal symbol */
                "&&",
                /* Terminal symbol */
                "!",
                /* Terminal symbol */
                "+",
                /* Terminal symbol */
                "-",
                /* Terminal symbol */
                "/",
                /* Terminal symbol */
                "%",
                /* Terminal symbol */
                "*",
                /* Terminal symbol */
                "^",
                /* Terminal symbol */
                "(",
                /* Terminal symbol */
                ")",
                /* Terminal symbol */
                ",",
                /* Terminal symbol */
                "#",
                /* Terminal symbol */
                "?",
                /* Terminal symbol */
                ":",
                /* Terminal symbol */
                "|",
                /* Terminal symbol */
                ".",
                /* Terminal symbol */
                "NaN",
                /* Terminal symbol */
                "Identifier",
                /* Terminal symbol */
                "String",
                /* Terminal symbol */
                "Integer",
                /* Terminal symbol */
                "Float",
                /* Non-terminal symbol */
                "Program",
                /* Non-terminal symbol */
                "Stmt",
                /* Non-terminal symbol */
                "Stmt_List",
                /* Non-terminal symbol */
                "Param_List",
                /* Non-terminal symbol */
                "Expression",
                /* Non-terminal symbol */
                "Prop_List",
                /* Non-terminal symbol */
                "Prop",
                /* Non-terminal symbol */
                "Param_Def_List",
                /* Non-terminal symbol */
                "Attr_List",
                /* Non-terminal symbol */
                "ExtValue",
                /* Non-terminal symbol */
                "Lhs",
                /* Non-terminal symbol */
                "Assign",
                /* Non-terminal symbol */
                "AddSubExp",
                /* Non-terminal symbol */
                "LogExp",
                /* Non-terminal symbol */
                "Value",
                /* Non-terminal symbol */
                "MulDivExp",
                /* Non-terminal symbol */
                "NegExp",
                /* Non-terminal symbol */
                "ExpExp",
                /* Terminal symbol */
                "$"
            ];



            if (!err_off) {
                err_off = [];
            }
            if (!err_la) {
                err_la = [];
            }

            sstack.push(0);
            vstack.push(0);

            PCB.la = this.lex(PCB);

            while (true) {
                PCB.act = 150;
                for (i = 0; i < act_tab[sstack[sstack.length - 1]].length; i += 2) {
                    if (act_tab[sstack[sstack.length - 1]][i] === PCB.la) {
                        PCB.act = act_tab[sstack[sstack.length - 1]][i + 1];
                        break;
                    }
                }

                if (PCB.act === 150) {
                    if ((PCB.act = defact_tab[sstack[sstack.length - 1]]) < 0) {
                        PCB.act = 150;
                    } else {
                        PCB.act *= -1;
                    }
                }

                //Parse error? Try to recover!
                if (PCB.act === 150) {
                    //Report errors only when error_step is 0, and this is not a
                    //subsequent error from a previous parse
                    if (PCB.error_step === 0) {
                        err_cnt += 1;
                        err_off.push({offset: PCB.offset - PCB.att.length, line: PCB.line});
                        err_la.push([]);
                        for (i = 0; i < act_tab[sstack[sstack.length - 1]].length; i += 2) {
                            err_la[err_la.length - 1].push(labels[act_tab[sstack[sstack.length - 1]][i]]);
                        }
                    }

                    //Perform error recovery
                    while (sstack.length > 1 && PCB.act === 150) {
                        sstack.pop();
                        vstack.pop();

                        //Try to shift on error token
                        for (i = 0; i < act_tab[sstack[sstack.length - 1]].length; i += 2) {
                            if (act_tab[sstack[sstack.length - 1]][i] === 1) {
                                PCB.act = act_tab[sstack[sstack.length - 1]][i + 1];

                                sstack.push(PCB.act);
                                vstack.push('');

                                break;
                            }
                        }
                    }

                    //Is it better to leave the parser now?
                    if (sstack.length > 1 && PCB.act !== 150) {
                        //Ok, now try to shift on the next tokens
                        while (PCB.la !== 69) {
                            PCB.act = 150;

                            for (i = 0; i < act_tab[sstack[sstack.length - 1]].length; i += 2) {
                                if (act_tab[sstack[sstack.length - 1]][i] === PCB.la) {
                                    PCB.act = act_tab[sstack[sstack.length - 1]][i + 1];
                                    break;
                                }
                            }

                            if (PCB.act !== 150) {
                                break;
                            }

                            while ((PCB.la = this.lex(PCB)) < 0) {
                                PCB.offset += 1;
                            }
                        }

                        //while (PCB.la !== 69 && PCB.act === 150) {}
                    }

                    if (PCB.act === 150 || PCB.la === 69) {
                        break;
                    }

                    //Try to parse the next three tokens successfully...
                    PCB.error_step = 3;
                }

                //Shift
                if (PCB.act > 0) {
                    sstack.push(PCB.act);
                    vstack.push(PCB.att);

                    PCB.la = this.lex(PCB);

                    //Successfull shift and right beyond error recovery?
                    if (PCB.error_step > 0) {
                        PCB.error_step -= 1;
                    }
                //Reduce
                } else {
                    act = -PCB.act;
                    rval = undef;

                    switch (act) {
                    case 0:
                        rval = vstack[vstack.length - 1];
                        break;
                    case 1:
                        this.execute(vstack[vstack.length - 1]);
                        break;
                    case 2:
                        rval = vstack[vstack.length];
                        break;
                    case 3:
                        rval = this.createNode('node_op', 'op_none', vstack[vstack.length - 2], vstack[vstack.length - 1]);
                        break;
                    case 4:
                        rval = vstack[vstack.length];
                        break;
                    case 5:
                        rval = this.createNode('node_op', 'op_param', vstack[vstack.length - 1], vstack[vstack.length - 3]);
                        break;
                    case 6:
                        rval = this.createNode('node_op', 'op_param', vstack[vstack.length - 1]);
                        break;
                    case 7:
                        rval = vstack[vstack.length];
                        break;
                    case 8:
                        rval = this.createNode('node_op', 'op_proplst', vstack[vstack.length - 3], vstack[vstack.length - 1]);
                        break;
                    case 9:
                        rval = vstack[vstack.length - 1];
                        break;
                    case 10:
                        rval = vstack[vstack.length];
                        break;
                    case 11:
                        rval = this.createNode('node_op', 'op_prop', vstack[vstack.length - 3], vstack[vstack.length - 1]);
                        break;
                    case 12:
                        rval = this.createNode('node_op', 'op_paramdef', vstack[vstack.length - 1], vstack[vstack.length - 3]);
                        break;
                    case 13:
                        rval = this.createNode('node_op', 'op_paramdef', vstack[vstack.length - 1]);
                        break;
                    case 14:
                        rval = vstack[vstack.length];
                        break;
                    case 15:
                        rval = this.createNode('node_op', 'op_param', vstack[vstack.length - 1], vstack[vstack.length - 3]);
                        break;
                    case 16:
                        rval = this.createNode('node_op', 'op_param', vstack[vstack.length - 1]);
                        break;
                    case 17:
                        rval = this.createNode('node_op', 'op_assign', vstack[vstack.length - 3], vstack[vstack.length - 1]);
                        break;
                    case 18:
                        rval = this.createNode('node_op', 'op_if', vstack[vstack.length - 2], vstack[vstack.length - 1]);
                        break;
                    case 19:
                        rval = this.createNode('node_op', 'op_if_else', vstack[vstack.length - 4], vstack[vstack.length - 3], vstack[vstack.length - 1]);
                        break;
                    case 20:
                        rval = this.createNode('node_op', 'op_while', vstack[vstack.length - 2], vstack[vstack.length - 1]);
                        break;
                    case 21:
                        rval = this.createNode('node_op', 'op_do', vstack[vstack.length - 4], vstack[vstack.length - 2]);
                        break;
                    case 22:
                        rval = this.createNode('node_op', 'op_for', vstack[vstack.length - 7], vstack[vstack.length - 5], vstack[vstack.length - 3], vstack[vstack.length - 1]);
                        break;
                    case 23:
                        rval = this.createNode('node_op', 'op_use', vstack[vstack.length - 2]);
                        break;
                    case 24:
                        rval = this.createNode('node_op', 'op_delete', vstack[vstack.length - 1]);
                        break;
                    case 25:
                        rval = this.createNode('node_op', 'op_return', vstack[vstack.length - 1]);
                        break;
                    case 26:
                        rval = vstack[vstack.length - 2];
                        break;
                    case 27:
                        rval = this.createNode('node_op', 'op_noassign', vstack[vstack.length - 2]);
                        break;
                    case 28:
                        rval = vstack[vstack.length - 2];
                        rval.needsBrackets = true;
                        break;
                    case 29:
                        rval = this.createNode('node_op', 'op_none');
                        break;
                    case 30:
                        rval = this.createNode('node_op', 'op_lhs', vstack[vstack.length - 1], vstack[vstack.length - 3], 'dot');
                        break;
                    case 31:
                        rval = this.createNode('node_op', 'op_lhs', vstack[vstack.length - 2], vstack[vstack.length - 4], 'bracket');
                        break;
                    case 32:
                        rval = this.createNode('node_op', 'op_lhs', vstack[vstack.length - 1]);
                        break;
                    case 33:
                        rval = this.createNode('node_op', 'op_equ', vstack[vstack.length - 3], vstack[vstack.length - 1]);
                        break;
                    case 34:
                        rval = this.createNode('node_op', 'op_lot', vstack[vstack.length - 3], vstack[vstack.length - 1]);
                        break;
                    case 35:
                        rval = this.createNode('node_op', 'op_grt', vstack[vstack.length - 3], vstack[vstack.length - 1]);
                        break;
                    case 36:
                        rval = this.createNode('node_op', 'op_loe', vstack[vstack.length - 3], vstack[vstack.length - 1]);
                        break;
                    case 37:
                        rval = this.createNode('node_op', 'op_gre', vstack[vstack.length - 3], vstack[vstack.length - 1]);
                        break;
                    case 38:
                        rval = this.createNode('node_op', 'op_neq', vstack[vstack.length - 3], vstack[vstack.length - 1]);
                        break;
                    case 39:
                        rval = this.createNode('node_op', 'op_approx', vstack[vstack.length - 3], vstack[vstack.length - 1]);
                        break;
                    case 40:
                        rval = this.createNode('node_op', 'op_conditional', vstack[vstack.length - 5], vstack[vstack.length - 3], vstack[vstack.length - 1]);
                        break;
                    case 41:
                        rval = vstack[vstack.length - 1];
                        break;
                    case 42:
                        rval = this.createNode('node_op', 'op_or', vstack[vstack.length - 3], vstack[vstack.length - 1]);
                        break;
                    case 43:
                        rval = this.createNode('node_op', 'op_and', vstack[vstack.length - 3], vstack[vstack.length - 1]);
                        break;
                    case 44:
                        rval = this.createNode('node_op', 'op_not', vstack[vstack.length - 1]);
                        break;
                    case 45:
                        rval = vstack[vstack.length - 1];
                        break;
                    case 46:
                        rval = this.createNode('node_op', 'op_sub', vstack[vstack.length - 3], vstack[vstack.length - 1]);
                        break;
                    case 47:
                        rval = this.createNode('node_op', 'op_add', vstack[vstack.length - 3], vstack[vstack.length - 1]);
                        break;
                    case 48:
                        rval = vstack[vstack.length - 1];
                        break;
                    case 49:
                        rval = this.createNode('node_op', 'op_mul', vstack[vstack.length - 3], vstack[vstack.length - 1]);
                        break;
                    case 50:
                        rval = this.createNode('node_op', 'op_div', vstack[vstack.length - 3], vstack[vstack.length - 1]);
                        break;
                    case 51:
                        rval = this.createNode('node_op', 'op_mod', vstack[vstack.length - 3], vstack[vstack.length - 1]);
                        break;
                    case 52:
                        rval = vstack[vstack.length - 1];
                        break;
                    case 53:
                        rval = this.createNode('node_op', 'op_exp', vstack[vstack.length - 3], vstack[vstack.length - 1]);
                        break;
                    case 54:
                        rval = vstack[vstack.length - 1];
                        break;
                    case 55:
                        rval = this.createNode('node_op', 'op_neg', vstack[vstack.length - 1]);
                        break;
                    case 56:
                        rval = vstack[vstack.length - 1];
                        break;
                    case 57:
                        rval = vstack[vstack.length - 1];
                        break;
                    case 58:
                        rval = this.createNode('node_op', 'op_extvalue', vstack[vstack.length - 4], vstack[vstack.length - 2]);
                        break;
                    case 59:
                        rval = this.createNode('node_op', 'op_extvalue', this.createNode('node_op', 'op_execfun', vstack[vstack.length - 7], vstack[vstack.length - 5]), vstack[vstack.length - 2]);
                        break;
                    case 60:
                        rval = this.createNode('node_op', 'op_execfun', vstack[vstack.length - 4], vstack[vstack.length - 2]);
                        break;
                    case 61:
                        rval = this.createNode('node_op', 'op_execfun', vstack[vstack.length - 5], vstack[vstack.length - 3], vstack[vstack.length - 1], true);
                        break;
                    case 62:
                        rval = this.createNode('node_op', 'op_property', vstack[vstack.length - 3], vstack[vstack.length - 1]);
                        break;
                    case 63:
                        rval = vstack[vstack.length - 1];
                        break;
                    case 64:
                        rval = this.createNode('node_const', vstack[vstack.length - 1]);
                        break;
                    case 65:
                        rval = this.createNode('node_const', vstack[vstack.length - 1]);
                        break;
                    case 66:
                        rval = this.createNode('node_var', vstack[vstack.length - 1]);
                        break;
                    case 67:
                        rval = vstack[vstack.length - 2];
                        break;
                    case 68:
                        rval = this.createNode('node_str', vstack[vstack.length - 1]);
                        break;
                    case 69:
                        rval = this.createNode('node_op', 'op_function', vstack[vstack.length - 5], vstack[vstack.length - 2]);
                        break;
                    case 70:
                        rval = this.createNode('node_op', 'op_proplst_val', vstack[vstack.length - 2]);
                        break;
                    case 71:
                        rval = this.createNode('node_op', 'op_array', vstack[vstack.length - 2]);
                        break;
                    case 72:
                        rval = this.createNode('node_const_bool', vstack[vstack.length - 1]);
                        break;
                    case 73:
                        rval = this.createNode('node_const_bool', vstack[vstack.length - 1]);
                        break;
                    case 74:
                        rval = this.createNode('node_const', NaN);
                        break;
                    }



                    for (i = 0; i < pop_tab[act][1]; i++) {
                        sstack.pop();
                        vstack.pop();
                    }

                    //Get goto-table entry
                    PCB.act = 150;
                    for (i = 0; i < goto_tab[sstack[sstack.length - 1]].length; i += 2) {
                        if (goto_tab[sstack[sstack.length - 1]][i] === pop_tab[act][0]) {
                            PCB.act = goto_tab[sstack[sstack.length - 1]][i + 1];
                            break;
                        }
                    }

                    //Goal symbol match?

                    //Don't use PCB.act here!
                    if (act === 0) {
                        break;
                    }

                    //...and push it!
                    sstack.push(PCB.act);
                    vstack.push(rval);
                }
            }

            return err_cnt;
        }

    });

    return JXG.JessieCode;

});
