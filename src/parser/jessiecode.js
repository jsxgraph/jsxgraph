/*
 JessieCode Interpreter and Compiler

    Copyright 2011-2026
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
    the MIT License along with JessieCode. If not, see <https://www.gnu.org/licenses/>
    and <https://opensource.org/licenses/MIT/>.
 */

/*global JXG: true, define: true, window: true, console: true, self: true, document: true, parser: true*/
/*jslint nomen: true, plusplus: true*/

/**
 * @fileoverview JessieCode is a scripting language designed to provide a
 * simple scripting language to build constructions
 * with JSXGraph. It is similar to JavaScript, but prevents access to the DOM.
 * Hence, it can be used in community driven math portals which want to use
 * JSXGraph to display interactive math graphics.
 */

import JXG from "../jxg.js";
import Const from "../base/constants.js";
import Text from "../base/text.js";
import Mat from "../math/math.js";
import Interval from "../math/ia.js";
import Geometry from "../math/geometry.js";
import Statistics from "../math/statistics.js";
import Type from "../utils/type.js";
import Env from "../utils/env.js";

// IE 6-8 compatibility
if (!Object.create) {
    Object.create = function (o, properties) {
        if (typeof o !== 'object' && typeof o !== 'function') throw new TypeError('Object prototype may only be an Object: ' + o);
        else if (o === null) throw new Error("This browser's implementation of Object.create is a shim and doesn't support 'null' as the first argument.");

        if (typeof properties != 'undefined') throw new Error("This browser's implementation of Object.create is a shim and doesn't support a second argument.");

        function F() { }

        F.prototype = o;

        return new F();
    };
}

var priv = {
    modules: {
        'math': Mat,
        'math/geometry': Geometry,
        'math/statistics': Statistics,
        'math/numerics': Mat.Numerics
    }
};

/**
 * A JessieCode object provides an interface to the parser and stores all variables and objects used within a JessieCode script.
 * The optional argument <tt>code</tt> is interpreted after initializing. To evaluate more code after initializing a JessieCode instance
 * please use {@link JXG.JessieCode#parse}. For code snippets like single expressions use {@link JXG.JessieCode#snippet}.
 * @constructor
 * @param {String} [code] Code to parse.
 * @param {Boolean} [geonext=false] Geonext compatibility mode.
 */
JXG.JessieCode = function (code, geonext) {
    // Control structures

    /**
     * The global scope.
     * @type Object
     */
    this.scope = {
        id: 0,
        hasChild: true,
        args: [],
        locals: {},
        context: null,
        previous: null
    };

    /**
     * Keeps track of all possible scopes every required.
     * @type Array
     */
    this.scopes = [];
    this.scopes.push(this.scope);

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
     * The id of an HTML node in which innerText all warnings are stored (if no <tt>console</tt> object is available).
     * @type String
     * @default 'jcwarn'
     */
    this.warnLog = 'jcwarn';

    /**
     * Store $log messages in case there's no console.
     * @type Array
     */
    this.$log = [];

    /**
     * Built-in functions and constants
     * @type Object
     */
    this.builtIn = this.defineBuiltIn();

    /**
     * List of all possible operands in JessieCode (except of JSXGraph objects).
     * @type Object
     */
    this.operands = this.getPossibleOperands();

    /**
     * The board which currently is used to create and look up elements.
     * @type JXG.Board
     */
    this.board = null;

    /**
     * Force slider names to return value instead of node
     * @type Boolean
     */
    this.forceValueCall = false;

    /**
     * Keep track of which element is created in which line.
     * @type Object
     */
    this.lineToElement = {};

    this.parCurLine = 1;
    this.parCurColumn = 0;
    this.line = 1;
    this.col = 1;

    if (JXG.CA) {
        // Old simplifier
        this.CA = new JXG.CA(this.node, this.createNode, this);
    }
    if (JXG.CAS) {
        // New simplifier
        this.CAS = new JXG.CAS(this.node, this.createNode, this);
    }

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

        if (n.type === 'node_const' && Type.isNumber(n.value)) {
            n.isMath = true;
        }

        n.line = this.parCurLine;
        n.col = this.parCurColumn;

        return n;
    },

    /**
     * Create a new scope.
     * @param {Array} args
     * @returns {Object}
     */
    pushScope: function (args) {
        var scope = {
            args: args,
            locals: {},
            context: null,
            previous: this.scope
        };

        this.scope.hasChild = true;
        this.scope = scope;
        scope.id = this.scopes.push(scope) - 1;

        return scope;
    },

    /**
     * Remove the current scope and reinstate the previous scope
     * @returns {Object}
     */
    popScope: function () {
        var s = this.scope.previous;

        // make sure the global scope is not lost
        this.scope = (s !== null) ? s : this.scope;

        return this.scope;
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
                f = _ccache[this.board.id + vname];
            } else {
                f = (function (that) {
                    return function (parameters, attributes) {
                        var attr;

                        if (Type.exists(attributes)) {
                            attr = attributes;
                        } else {
                            attr = {};
                        }
                        if (attr.name === undefined && attr.id === undefined) {
                            attr.name = ((that.lhs[that.scope.id] !== 0) ? that.lhs[that.scope.id] : '');
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

        this.scope.locals[vname] = value;
    },

    /**
     * Checks if the given variable name can be found in the current scope chain.
     * @param {String} vname
     * @returns {Object} A reference to the scope object the variable can be found in or null if it can't be found.
     */
    isLocalVariable: function (vname) {
        var s = this.scope;

        while (s !== null) {
            if (Type.exists(s.locals[vname])) {
                return s;
            }

            s = s.previous;
        }

        return null;
    },

    /**
     * Checks if the given variable name is a parameter in any scope from the current to the global scope.
     * @param {String} vname
     * @returns {Object} A reference to the scope object that contains the variable in its arg list.
     */
    isParameter: function (vname) {
        var s = this.scope;

        while (s !== null) {
            if (Type.indexOf(s.args, vname) > -1) {
                return s;
            }

            s = s.previous;
        }

        return null;
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
     * Looks up the value of the given variable. We use a simple type inspection.
     *
     * @param {String} vname Name of the variable
     * @param {Boolean} [local=false] Only look up the internal symbol table and don't look for
     * the <tt>vname</tt> in Math or the element list.
     * @param {Boolean} [isFunctionName=false] Lookup function of type builtIn, Math.*, creator.
     *
     * @see JXG.JessieCode#resolveType
     */
    getvar: function (vname, local, isFunctionName) {
        var s;

        local = Type.def(local, false);

        // Local scope has always precedence
        s = this.isLocalVariable(vname);

        if (s !== null) {
            return s.locals[vname];
        }

        // Handle the - so far only - few constants by hard coding them.
        if (vname === '$board' || vname === 'EULER' || vname === 'PI') {
            return this.builtIn[vname];
        }

        if (isFunctionName) {
            if (this.isBuiltIn(vname)) {
                return this.builtIn[vname];
            }

            if (this.isMathMethod(vname)) {
                return Math[vname];
            }

            // check for an element with this name
            if (this.isCreator(vname)) {
                return this.creator(vname);
            }
        }

        if (!local) {
            s = this.board.select(vname);
            if (s !== vname) {
                return s;
            }
        }
    },

    /**
     * Look up the value of a local variable.
     * @param {string} vname
     * @returns {*}
     */
    resolve: function (vname) {
        var s = this.scope;

        while (s !== null) {
            if (Type.exists(s.locals[vname])) {
                return s.locals[vname];
            }

            s = s.previous;
        }
    },

    /**
     * TODO this needs to be called from JS and should not generate JS code
     * Looks up a variable identifier in various tables and generates JavaScript code that could be eval'd to get the value.
     * @param {String} vname Identifier
     * @param {Boolean} [local=false] Don't resolve ids and names of elements
     * @param {Boolean} [withProps=false]
     */
    getvarJS: function (vname, local, withProps) {
        var s, r = '', re;

        local = Type.def(local, false);
        withProps = Type.def(withProps, false);

        s = this.isParameter(vname);
        if (s !== null) {
            return vname;
        }

        s = this.isLocalVariable(vname);
        if (s !== null && !withProps) {
            return '$jc$.resolve(\'' + vname + '\')';
        }

        // check for an element with this name
        if (this.isCreator(vname)) {
            return '(function () { var a = Array.prototype.slice.call(arguments, 0), props = ' + (withProps ? 'a.pop()' : '{}') + '; return $jc$.board.create.apply($jc$.board, [\'' + vname + '\'].concat([a, props])); })';
        }

        if (withProps) {
            this._error('Syntax error (attribute values are allowed with element creators only)');
        }

        if (this.isBuiltIn(vname)) {
            // If src does not exist, it is a number. In that case, just return the value.
            r = this.builtIn[vname].src || this.builtIn[vname];

            // Get the "real" name of the function
            if (Type.isNumber(r)) {
                return r;
            }
            // Search a JSXGraph object in board
            if (r.match(/board\.select/)) {
                return r;
            }

            /* eslint-disable no-useless-escape */
            vname = r.split('.').pop();
            if (Type.exists(this.board.mathLib)) {
                // Handle builtin case: ln(x) -> Math.log
                re = new RegExp('^Math\.' + vname);
                if (re.exec(r) !== null) {
                    return r.replace(re, '$jc$.board.mathLib.' + vname);
                }
            }
            if (Type.exists(this.board.mathLibJXG)) {
                // Handle builtin case: factorial(x) -> JXG.Math.factorial
                re = new RegExp('^JXG\.Math\.');
                if (re.exec(r) !== null) {
                    return r.replace(re, '$jc$.board.mathLibJXG.');
                }
                return r;
            }
            /* eslint-enable no-useless-escape */
            return r;

            // return this.builtIn[vname].src || this.builtIn[vname];
        }

        if (this.isMathMethod(vname)) {
            return '$jc$.board.mathLib.' + vname;
            //                return 'Math.' + vname;
        }

        // if (!local) {
        //     if (Type.isId(this.board, vname)) {
        //         r = '$jc$.board.objects[\'' + vname + '\']';
        //     } else if (Type.isName(this.board, vname)) {
        //         r = '$jc$.board.elementsByName[\'' + vname + '\']';
        //     } else if (Type.isGroup(this.board, vname)) {
        //         r = '$jc$.board.groups[\'' + vname + '\']';
        //     }

        //     return r;
        // }
        if (!local) {
            if (Type.isId(this.board, vname)) {
                r = '$jc$.board.objects[\'' + vname + '\']';
                if (this.board.objects[vname].elType === 'slider') {
                    r += '.Value()';
                }
            } else if (Type.isName(this.board, vname)) {
                r = '$jc$.board.elementsByName[\'' + vname + '\']';
                if (this.board.elementsByName[vname].elType === 'slider') {
                    r += '.Value()';
                }
            } else if (Type.isGroup(this.board, vname)) {
                r = '$jc$.board.groups[\'' + vname + '\']';
            }

            return r;
        }

        return '';
    },

    /**
     * Adds the property <tt>isMap</tt> to a function and sets it to true.
     * @param {function} f
     * @returns {function}
     */
    makeMap: function (f) {
        f.isMap = true;

        return f;
    },

    functionCodeJS: function (node) {
        var p = node.children[0].join(', '),
            bo = '',
            bc = '';

        if (node.value === 'op_map') {
            bo = '{ return  ';
            bc = ' }';
        }

        return 'function (' + p + ') {\n' +
            'var $oldscope$ = $jc$.scope;\n' +
            '$jc$.scope = $jc$.scopes[' + this.scope.id + '];\n' +
            'var r = (function () ' + bo + this.compile(node.children[1], true) + bc + ')();\n' +
            '$jc$.scope = $oldscope$;\n' +
            'return r;\n' +
            '}';
    },

    /**
     * Converts a node type <tt>node_op</tt> and value <tt>op_map</tt> or <tt>op_function</tt> into a executable
     * function. Does a simple type inspection.
     * @param {Object} node
     * @returns {function}
     * @see JXG.JessieCode#resolveType
     */
    defineFunction: function (node) {
        var fun, i, that = this,
            list = node.children[0],
            scope = this.pushScope(list);

        if (this.board.options.jc.compile) {
            this.isLHS = false;

            // we currently need to put the parameters into the local scope
            // until the compiled JS variable lookup code is fixed
            for (i = 0; i < list.length; i++) {
                scope.locals[list[i]] = list[i];
            }

            this.replaceNames(node.children[1]);

            /** @ignore */
            fun = (function (jc) {
                var fun,
                    // str = 'var f = ' + $jc$.functionCodeJS(node) + '; f;';
                    str = 'var f = function($jc$) { return ' +
                        jc.functionCodeJS(node) +
                        '}; f;';

                try {
                    // yeah, eval is evil, but we don't have much choice here.
                    // the str is well defined and there is no user input in it that we didn't check before

                    /*jslint evil:true*/
                    // fun = eval(str);
                    fun = eval(str)(jc);
                    /*jslint evil:false*/

                    scope.argtypes = [];
                    for (i = 0; i < list.length; i++) {
                        scope.argtypes.push(that.resolveType(list[i], node));
                    }

                    return fun;
                } catch (e) {
                    // $jc$._warn('error compiling function\n\n' + str + '\n\n' + e.toString());
                    jc._warn("error compiling function\n\n" + str + "\n\n" + e.toString());
                    return function () { };
                }
            }(this));

            // clean up scope
            this.popScope();
        } else {
            /** @ignore */
            fun = (function (_pstack, that, id) {
                return function () {
                    var r, oldscope;

                    oldscope = that.scope;
                    that.scope = that.scopes[id];

                    for (r = 0; r < _pstack.length; r++) {
                        that.scope.locals[_pstack[r]] = arguments[r];
                    }

                    r = that.execute(node.children[1]);
                    that.scope = oldscope;

                    return r;
                };
            }(list, this, scope.id));
        }

        fun.node = node;
        fun.scope = scope;
        fun.toJS = fun.toString;
        fun.toString = (function (_that) {
            return function () {
                return _that.compile(_that.replaceIDs(Type.deepCopy(node)));
            };
        }(this));

        fun.deps = {};
        this.collectDependencies(node.children[1], node.children[0], fun.deps);

        return fun;
    },

    /**
     * Merge all attribute values given with an element creator into one object.
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
     * Sets the property <tt>what</tt> of <tt>o</tt> to <tt>value</tt>
     * @param {JXG.Point|JXG.Text} o
     * @param {String} what
     * @param value
     */
    setProp: function (o, what, value) {
        var par = {}, x, y;

        if (o.elementClass === Const.OBJECT_CLASS_POINT && (what === 'X' || what === 'Y')) {
            // set coords

            what = what.toLowerCase();

            // we have to deal with three cases here:
            // o.isDraggable && typeof value === number:
            //   stay draggable, just set the new coords (e.g. via moveTo)
            // o.isDraggable && typeof value === function:
            //   convert to !o.isDraggable, set the new coords via o.addConstraint()
            // !o.isDraggable:
            //   stay !o.isDraggable, update the given coord by overwriting X/YEval

            if (o.isDraggable && typeof value === 'number') {
                x = (what === 'x') ? value : o.X();
                y = (what === 'y') ? value : o.Y();

                o.setPosition(Const.COORDS_BY_USER, [x, y]);
            } else if (o.isDraggable && (typeof value === 'function' || typeof value === 'string')) {
                x = (what === 'x') ? value : o.coords.usrCoords[1];
                y = (what === 'y') ? value : o.coords.usrCoords[2];

                o.addConstraint([x, y]);
            } else if (!o.isDraggable) {
                x = (what === 'x') ? value : o.XEval.origin;
                y = (what === 'y') ? value : o.YEval.origin;

                o.addConstraint([x, y]);
            }

            this.board.update();
        } else if (o.elementClass === Const.OBJECT_CLASS_TEXT && (what === 'X' || what === 'Y')) {
            if (typeof value === 'number') {
                o[what] = function () { return value; };
            } else if (typeof value === 'function') {
                o.isDraggable = false;
                o[what] = value;
            } else if (typeof value === 'string') {
                o.isDraggable = false;
                o[what] = Type.createFunction(value, this.board);
                o[what + 'jc'] = value;
            }

            o[what].origin = value;

            this.board.update();
        } else if (o.type && o.elementClass && o.visProp) {
            if (Type.exists(o[o.methodMap[what]]) && typeof o[o.methodMap[what]] !== 'function') {
                o[o.methodMap[what]] = value;
            } else {
                par[what] = value;
                o.setAttribute(par);
            }
        } else {
            o[what] = value;
        }
    },

    /**
     * Generic method to parse JessieCode.
     * This consists of generating an AST with parser.parse,
     * apply simplifying rules from CA and
     * manipulate the AST according to the second parameter "cmd".
     * @param  {String} code      JessieCode code to be parsed
     * @param  {String} cmd       Type of manipulation to be done with AST
     * @param {Object} [options]  Object with attributes <ul>
     *     <li>{Boolean} [geonext=false]     Geonext compatibility mode.</li>
     *     <li>{Boolean} [dontstore=false]   If false, the code string is stored in this.code, i.e. in the JessieCode object, e.g. in board.jc.</li>
     *     </ul>
     * @return {Object} Returns result of computation as directed in cmd.
     */
    _genericParse: function (code, cmd, options) {
        var i, setTextBackup, ast, result,
            ccode = code.replace(/\r\n/g, '\n').split('\n'),
            cleaned = [];

        if (!Type.exists(options)) {
            options = {};
        }

        if (!options.dontstore) {
            this.code += code + '\n';
        }

        if (Text) {
            setTextBackup = Text.prototype.setText;
            Text.prototype.setText = Text.prototype.setTextJessieCode;
        }

        try {
            for (i = 0; i < ccode.length; i++) {
                if (!!options.geonext) {
                    ccode[i] = JXG.GeonextParser.geonext2JS(ccode[i], this.board);
                }
                cleaned.push(ccode[i]);
            }

            code = cleaned.join('\n');
            ast = parser.parse(code);
            if (this.CA) {
                ast = this.CA.expandDerivatives(ast, null, ast);
                ast = this.CA.removeTrivialNodes(ast);
            }
            if (this.CAS) {
                // Search for expression of form `D(f, x)` and determine the
                // the derivative symbolically.
                ast = this.CAS.expandDerivatives(ast, null, ast);

                // options.method = options.method || "strong";
                // options.form = options.form || "fractions";
                // options.steps = options.steps || [];
                // options.iterations = options.iterations || 1000;
                // ast = this.CAS._simplify_aux(ast, options);
            }
            switch (cmd) {
                case 'parse':
                    result = this.execute(ast);
                    break;
                case 'manipulate':
                    result = this.compile(ast);
                    break;
                case 'simplify':
                    if (Type.exists(this.CAS)) {
                        options.method = options.method || "strong";
                        options.form = options.form || "fractions";
                        options.steps = options.steps || [];
                        options.iterations = options.iterations || 1000;
                        ast = this.CAS.simplify(ast, options);
                        result = this.CAS.compile(ast);
                    } else {
                        result = this.compile(ast);
                    }
                    break;
                case 'format':
                    result = this.compile(ast, false, options);
                    break;
                case 'getAst':
                    result = ast;
                    break;
                default:
                    result = false;
            }
        } catch (e) {  // catch is mandatory in old IEs
            // console.log(e);
            // We throw the error again,
            // so the user can catch it.
            throw e;
        } finally {
            // make sure the original text method is back in place
            if (Text) {
                Text.prototype.setText = setTextBackup;
            }
        }

        return result;
    },

    /**
     * Parses JessieCode.
     * This consists of generating an AST with parser.parse, apply simplifying rules
     * from CA and executing the ast by calling this.execute(ast).
     *
     * @param {String} code             JessieCode code to be parsed
     * @param {Boolean} [geonext=false] Geonext compatibility mode.
     * @param {Boolean} [dontstore=false] If false, the code string is stored in this.code.
     * @return {Object}                 Parse JessieCode code and execute it.
     */
    parse: function (code, geonext, dontstore) {
        return this._genericParse(code, 'parse', {geonext: geonext, dontstore: dontstore});
    },

    /**
     * Manipulate JessieCode.
     * This consists of generating an AST with parser.parse,
     * apply simplifying rules from CA
     * and compile the AST back to JessieCode.
     *
     * @param {String} code             JessieCode code to be parsed
     * @param {Boolean} [geonext=false] Geonext compatibility mode.
     * @param {Boolean} [dontstore=false] If false, the code string is stored in this.code.
     * @return {String}                 Simplified JessieCode code
     */
    manipulate: function (code, geonext, dontstore) {
        return this._genericParse(code, 'manipulate', {geonext: geonext, dontstore: dontstore});
    },

    /**
     * Manipulate JessieCode.
     * This consists of generating an AST with parser.parse,
     * apply simplifying rules from CAS
     * and compile the AST back to JessieCode with minimal number of parentheses.
     *
     * @param {String} code             JessieCode code to be parsed
     * @return {String}                 Simplified JessieCode code
     */
    simplify: function (code) {
        return this._genericParse(code, 'simplify');
    },

    /**
     * Format JessieCode.
     * This consists of generating an AST with parser.parse,
     * and compile the AST back to JessieCode with options.
     *
     * @param {String} code      JessieCode code to be parsed.
     * @param {Object} options   For possible options see param "format" in {@link JXG.JessieCode#compile}.
     * @return {String}          Manipulated JessieCode string. This is no necessarily a parsable JessieCode code!
     */
    format: function (code, options) {
        return this._genericParse(code, 'format', options);
    },

    /**
     * Get abstract syntax tree (AST) from JessieCode code.
     * This consists of generating an AST with parser.parse.
     *
     * @param {String} code
     * @param {Boolean} [geonext=false] Geonext compatibility mode.
     * @param {Boolean} [dontstore=false] If false, the code string is stored in this.code.
     * @return {Node}  AST
     */
    getAST: function (code, geonext, dontstore) {
        return this._genericParse(code, 'getAst', {geonext: geonext, dontstore: dontstore});
    },

    /**
     * Parses a JessieCode snippet, e.g. "3+4", and wraps it into a function, if desired.
     * @param {String} code A small snippet of JessieCode. Must not be an assignment.
     * @param {Boolean} [funwrap=true] If true, the code is wrapped in a function.
     * @param {String} [varname=''] Name of the parameter(s)
     * @param {Boolean} [geonext=false] Geonext compatibility mode.
     * @param {Boolean} [forceValueCall=true] Force evaluation of value method of sliders.
     */
    snippet: function (code, funwrap, varname, geonext, forceValueCall) {
        var c;

        funwrap = Type.def(funwrap, true);
        varname = Type.def(varname, '');
        geonext = Type.def(geonext, false);
        this.forceValueCall = Type.def(forceValueCall, true);

        c = (funwrap ? ' function (' + varname + ') { return ' : '') +
                code +
            (funwrap ? '; }' : '') + ';';

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
            // These children exist, if node.replaced is set.
            v = this.board.objects[node.children[1][0].value];

            if (Type.exists(v) && v.name !== "") {
                node.type = 'node_var';
                node.value = v.name;

                // Maybe it's not necessary, but just to be sure that everything is cleaned up we better delete all
                // children and the replaced flag
                node.children.length = 0;
                delete node.replaced;
            }
        }

        if (Type.isArray(node)) {
            for (i = 0; i < node.length; i++) {
                node[i] = this.replaceIDs(node[i]);
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
     * @param {Boolean} [callValuePar=false] if true, uses $value() instead of $() in createReplacementNode
     */
    replaceNames: function (node, callValuePar) {
        var i, v,
            callValue = false;

        if (callValuePar !== undefined) {
            callValue = callValuePar;
        }

        v = node.value;

        // We are interested only in nodes of type node_var and node_op > op_lhs.
        // Currently, we are not checking if the id is a local variable. in this case, we're stuck anyway.

        if (node.type === 'node_op' && v === 'op_lhs' && node.children.length === 1) {
            this.isLHS = true;
        } else if (node.type === 'node_var') {
            if (this.isLHS) {
                this.letvar(v, true);
            } else if (!Type.exists(this.getvar(v, true)) && Type.exists(this.board.elementsByName[v])) {
                if (callValue && this.board.elementsByName[v].elType !== 'slider') {
                    callValue = false;
                }
                node = this.createReplacementNode(node, callValue);
            }
        }

        if (Type.isArray(node)) {
            for (i = 0; i < node.length; i++) {
                node[i] = this.replaceNames(node[i], callValue);
            }
        }

        if (node.children) {
            // Replace slider reference by call of slider.Value()
            if (this.forceValueCall &&              // It must be enforced, see snippet.
                (
                    // 1. case: sin(a), max(a, 0), ...
                    (node.value === "op_execfun" &&
                        // Not in cases V(a), $(a)
                        node.children[0].value !== 'V' && node.children[0].value !== '$' &&
                        // Function must be a math function. This ensures that a number is required as input.
                        (Type.exists(Math[node.children[0].value]) || Type.exists(Mat[node.children[0].value])) &&
                        // node.children[1].length === 1 &&
                        node.children[1][0].type === 'node_var'
                    ) ||
                    // 2. case: slider is the whole expression: 'a'
                    (node.value === "op_return" &&
                        node.children.length === 1 &&
                        node.children[0].type === 'node_var'
                    )
                )
            ) {
                    callValue = true;
            }

            // Assignments are first evaluated on the right hand side
            for (i = node.children.length; i > 0; i--) {
                if (Type.exists(node.children[i - 1])) {
                    node.children[i - 1] = this.replaceNames(node.children[i - 1], callValue);
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
     * @param {Boolean} [callValue=undefined] if true, uses $value() instead of $()
     * @returns {Object} op_execfun node
     */
    createReplacementNode: function (node, callValue) {
        var v = node.value,
            el = this.board.elementsByName[v];

        // If callValue: get handle to this node_var and call its Value method.
        // Otherwise return the object.
        node = this.createNode('node_op', 'op_execfun',
            this.createNode('node_var', ((callValue === true) ? '$value' : '$')),
            [this.createNode('node_str', el.id)]);

        node.replaced = true;

        return node;
    },

    /**
     * Search the parse tree below <tt>node</tt> for <em>stationary</em> dependencies, i.e. dependencies hard coded into
     * the function.
     * @param {Object} node
     * @param {Array} varnames List of variable names of the function
     * @param {Object} result An object where the referenced elements will be stored. Access key is their id.
     */
    collectDependencies: function (node, varnames, result) {
        var i, v, e, le;

        if (Type.isArray(node)) {
            le = node.length;
            for (i = 0; i < le; i++) {
                this.collectDependencies(node[i], varnames, result);
            }
            return;
        }

        v = node.value;

        if (node.type === 'node_var' &&
            varnames.indexOf(v) < 0 // v is not contained in the list of variables of that function
        ) {
            e = this.getvar(v);
            if (e && e.visProp && e.elType && e.elementClass && e.id
                // Sliders are the only elements which are given by names.
                // Wrong, a counter example is: circle(c, function() { return p1.Dist(p2); })
                // && e.elType === 'slider'
            ) {
                result[e.id] = e;
            }
        }

        // The $()-function-calls are special because their parameter is given as a string, not as a node_var.
        if (node.type === 'node_op' && node.value === 'op_execfun' &&
            node.children.length > 1 &&
            (node.children[0].value === '$' || node.children[0].value === '$value') &&
            node.children[1].length > 0) {

            e = node.children[1][0].value;
            result[e] = this.board.objects[e];
        }

        if (node.children) {
            for (i = node.children.length; i > 0; i--) {
                if (Type.exists(node.children[i - 1])) {
                    this.collectDependencies(node.children[i - 1], varnames, result);
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

        if (Type.isFunction(e)) {
            this._error('Accessing function properties is not allowed.');
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
     * Type inspection: check if the string vname appears as function name in the
     * AST node. Used in "op_execfun". This allows the JessieCode examples below.
     *
     * @private
     * @param {String} vname
     * @param {Object} node
     * @returns 'any' or 'function'
     * @see JXG.JessieCode#execute
     * @see JXG.JessieCode#getvar
     *
     * @example
     *  var p = board.create('point', [2, 0], {name: 'X'});
     *  var txt = 'X(X)';
     *  console.log(board.jc.parse(txt));
     *
     * @example
     *  var p = board.create('point', [2, 0], {name: 'X'});
     *  var txt = 'f = function(el, X) { return X(el); }; f(X, X);';
     *  console.log(board.jc.parse(txt));
     *
     * @example
     *  var p = board.create('point', [2, 0], {name: 'point'});
     *  var txt = 'B = point(1,3); X(point);';
     *  console.log(board.jc.parse(txt));
     *
     * @example
     *  var p = board.create('point', [2, 0], {name: 'A'});
     *  var q = board.create('point', [-2, 0], {name: 'X'});
     *  var txt = 'getCoord=function(p, f){ return f(p); }; getCoord(A, X);';
     *  console.log(board.jc.parse(txt));
     */
    resolveType: function (vname, node) {
        var i, t,
            type = 'any'; // Possible values: 'function', 'any'

        if (Type.isArray(node)) {
            // node contains the parameters of a function call or function declaration
            for (i = 0; i < node.length; i++) {
                t = this.resolveType(vname, node[i]);
                if (t !== 'any') {
                    type = t;
                    return type;
                }
            }
        }

        if (node.type === 'node_op' && node.value === 'op_execfun' &&
            node.children[0].type === 'node_var' && node.children[0].value === vname) {
            return 'function';
        }

        if (node.type === 'node_op') {
            for (i = 0; i < node.children.length; i++) {
                if (node.children[0].type === 'node_var' && node.children[0].value === vname &&
                    (node.value === 'op_add' || node.value === 'op_sub' || node.value === 'op_mul' ||
                        node.value === 'op_div' || node.value === 'op_mod' || node.value === 'op_exp' ||
                        node.value === 'op_neg')) {
                    return 'any';
                }
            }

            for (i = 0; i < node.children.length; i++) {
                t = this.resolveType(vname, node.children[i]);
                if (t !== 'any') {
                    type = t;
                    return type;
                }
            }
        }

        return 'any';
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
                o: this.scope.locals,
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
        var res;

        if (node.type === 'node_var') {
            res = node.value;
        } else if (node.type === 'node_op' && node.value === 'op_property') {
            res = [
                this.compile(node.children[0], js),
                "'" + node.children[1] + "'"
            ];
        } else if (node.type === 'node_op' && node.value === 'op_extvalue') {
            res = [
                this.compile(node.children[0], js),
                (node.children[1].type === 'node_const') ? node.children[1].value : this.compile(node.children[1], js)
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
            fun, attr, sc;

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
                        this.lhs[this.scope.id] = v.what;

                        if (v.o.type && v.o.elementClass && v.o.methodMap && v.what === 'label') {
                            this._error('Left-hand side of assignment is read-only.');
                        }

                        ret = this.execute(node.children[1]);
                        if (v.o !== this.scope.locals || (Type.isArray(v.o) && typeof v.what === 'number')) {
                            // it is either an array component being set or a property of an object.
                            this.setProp(v.o, v.what, ret);
                        } else {
                            // this is just a local variable inside JessieCode
                            this.letvar(v.what, ret);
                        }
                        this.lhs[this.scope.id] = 0;
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

                        if (typeof i === 'number' && Math.abs(Math.round(i) - i) < 1.e-12) {
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
                        if (!node.children[1].isMath && node.children[1].type !== 'node_var') {
                            this._error('execute: In a map only function calls and mathematical expressions are allowed.');
                        }

                        /** @ignore */
                        fun = this.defineFunction(node);
                        fun.isMap = true;

                        ret = fun;
                        break;
                    case 'op_function':
                        // parse the parameter list
                        // after this, the parameters are in pstack

                        /** @ignore */
                        fun = this.defineFunction(node);
                        fun.isMap = false;

                        ret = fun;
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
                        node.children[0]._isFunctionName = true;
                        fun = this.execute(node.children[0]);
                        delete node.children[0]._isFunctionName;

                        // determine the scope the function wants to run in
                        if (Type.exists(fun) && Type.exists(fun.sc)) {
                            sc = fun.sc;
                        } else {
                            sc = this;
                        }

                        if (!fun.creator && Type.exists(node.children[2])) {
                            this._error('Unexpected value. Only element creators are allowed to have a value after the function call.');
                        }

                        // interpret ALL the parameters
                        for (i = 0; i < list.length; i++) {
                            if (Type.exists(fun.scope) && Type.exists(fun.scope.argtypes) && fun.scope.argtypes[i] === 'function') {
                                // Type inspection
                                list[i]._isFunctionName = true;
                                parents[i] = this.execute(list[i]);
                                delete list[i]._isFunctionName;
                            } else {
                                parents[i] = this.execute(list[i]);
                            }
                            //parents[i] = Type.evalSlider(this.execute(list[i]));
                            this.dpstack[this.pscope].push({
                                line: node.children[1][i].line,
                                // SketchBin currently works only if the last column of the
                                // parent position is taken. This is due to how I patched JS/CC
                                // to count the lines and columns. So, ecol will do for now
                                col: node.children[1][i].ecol
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
                                ret.jcLineEnd = node.eline;

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
                        if (Type.exists(ret) && ['number', 'string', 'boolean'].indexOf(typeof ret) < 0) {
                            ret.sc = e;
                        }

                        break;
                    case 'op_use':
                        this._warn('Use of the \'use\' operator is deprecated.');
                        this.use(node.children[0].toString());
                        break;
                    case 'op_delete':
                        this._warn('Use of the \'delete\' operator is deprecated. Please use the remove() function.');
                        v = this.getvar(node.children[0]);
                        ret = this.del(v);
                        break;
                    case 'op_eq':
                        // == is intentional
                        /*jslint eqeq:true*/
                        /* eslint-disable eqeqeq */
                        ret = this.execute(node.children[0]) == this.execute(node.children[1]);
                        /*jslint eqeq:false*/
                        /* eslint-enable eqeqeq */
                        break;
                    case 'op_neq':
                        // != is intentional
                        /*jslint eqeq:true*/
                        /* eslint-disable eqeqeq */
                        ret = this.execute(node.children[0]) != this.execute(node.children[1]);
                        /*jslint eqeq:true*/
                        /* eslint-enable eqeqeq */
                        break;
                    case 'op_approx':
                        ret = Math.abs(this.execute(node.children[0]) - this.execute(node.children[1])) < Mat.eps;
                        break;
                    case 'op_gt':
                        ret = this.execute(node.children[0]) > this.execute(node.children[1]);
                        break;
                    case 'op_lt':
                        ret = this.execute(node.children[0]) < this.execute(node.children[1]);
                        break;
                    case 'op_geq':
                        ret = this.execute(node.children[0]) >= this.execute(node.children[1]);
                        break;
                    case 'op_leq':
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
                        ret = this.add(this.execute(node.children[0]), this.execute(node.children[1]));
                        break;
                    case 'op_sub':
                        ret = this.sub(this.execute(node.children[0]), this.execute(node.children[1]));
                        break;
                    case 'op_div':
                        ret = this.div(this.execute(node.children[0]), this.execute(node.children[1]));
                        break;
                    case 'op_mod':
                        // use mathematical modulo, JavaScript implements the symmetric modulo.
                        ret = this.mod(this.execute(node.children[0]), this.execute(node.children[1]), true);
                        break;
                    case 'op_mul':
                        ret = this.mul(this.execute(node.children[0]), this.execute(node.children[1]));
                        break;
                    case 'op_exp':
                        ret = this.pow(this.execute(node.children[0]), this.execute(node.children[1]));
                        break;
                    case 'op_neg':
                        ret = this.neg(this.execute(node.children[0]));
                        break;
                }
                break;

            case 'node_var':
                // node._isFunctionName is set in execute: at op_execfun.
                ret = this.getvar(node.value, false, node._isFunctionName);
                break;

            case 'node_const':
                if (node.value === null) {
                    ret = null;
                } else {
                    ret = Number(node.value);
                }
                break;

            case 'node_const_bool':
                ret = node.value;
                break;

            case 'node_str':
                //ret = node.value.replace(/\\'/, "'").replace(/\\"/, '"').replace(/\\\\/, '\\');
                /*jslint regexp:true*/
                ret = node.value.replace(/\\(.)/g, '$1'); // Remove backslash, important in JessieCode tags
                /*jslint regexp:false*/
                break;
        }

        return ret;
    },

    /**
     * Compiles a parse tree back to JessieCode.
     * @param {Object} ast
     * @param {Boolean} [js=false] Compile either to JavaScript or back to JessieCode (required for the UI).
     * @param {Object} [format] Options for formatting the output. Depending on some options, the function might return a not re-parsable string. This format options have only effect on JessieCode output.<ul>
     *     <li>{Boolean} [minParentheses=false]               Use minimal amount of parentheses?</li>
     *     <li>{Boolean|Number|Function} [constToFixed=false] Use this number or function to format constant values.</li>
     *     <li>{Boolean} [printable=false]                    Adds additional signs or parentheses, e.g. x^0.5 --> x^{0.5}.</li>
     *     </ul>
     * @returns Something
     * @private
     */
    compile: function (ast, js, format) {
        var that = this;

        if (!Type.exists(js)) {
            js = false;
        }
        if (!Type.exists(format) || !Type.isObject(format)) {
            format = {};
        }
        format = Type.deepCopy({
            minParentheses: false,
            constToFixed: false,
            printable: false
        }, format);

        // node_const/node_var >> op_execfun >> op_neg >> op_exp >> op_mul/op_div >> op_add/op_sub >> op_map >> op_assign
        function prio(node) {
            switch (node.type) {
                case "node_const":
                case "node_const_bool":
                case "node_str":
                case "node_var":
                    return 10;
                case "node_op":
                    switch (node.value) {
                        case "op_none":
                            return 0;
                        case "op_assign":
                            return 1;
                        case "op_map":
                        case "op_function":
                        case "op_return":
                            return 2;
                        case "op_add":
                        case "op_sub":
                            return 3;
                        case "op_mul":
                        case "op_div":
                        case "op_mod":
                            return 5;
                        case "op_neg":
                            return 4;
                        case "op_exp":
                            return 6;
                        case "op_array":
                        case "op_execfun":
                            return 7;
                        default:
                            return 0;
                    }
                default:
                    return 0;
            }
        }

        function compile(node, prevOp, position = -1) {
            var e, i, c, list, scope, prioParent, prioChild,
                ret = '';

            if (!node) {
                return ret;
            }

            switch (node.type) {
                case 'node_op':
                    switch (node.value) {
                        case 'op_none':
                            if (node.children[0]) {
                                ret = compile(node.children[0], "op_none");
                            }
                            if (node.children[1]) {
                                ret += compile(node.children[1], "op_none");
                            }
                            break;
                        case 'op_block':
                            ret = '{\n' + compile(node.children[0], "op_block") + ' }\n';
                            break;
                        case 'op_assign':
                            if (js) {
                                e = that.getLHSCompiler(node.children[0], js);
                                if (Type.isArray(e)) {
                                    ret = '$jc$.setProp(' + e[0] + ', ' + e[1] + ', ' + compile(node.children[1], "op_assign") + ');\n';
                                } else {
                                    if (that.isLocalVariable(e) !== that.scope) {
                                        that.scope.locals[e] = true;
                                    }
                                    ret = '$jc$.scopes[' + that.scope.id + '].locals[\'' + e + '\'] = ' + compile(node.children[1], "op_assign") + ';\n';
                                }
                            } else {
                                e = compile(node.children[0], "op_assign");
                                ret = e + ' = ' + compile(node.children[1], "op_assign") + ';\n';
                            }
                            break;
                        case 'op_if':
                            ret = ' if (' + compile(node.children[0], "op_if") + ') ' + compile(node.children[1], "op_if");
                            break;
                        case 'op_if_else':
                            ret = ' if (' + compile(node.children[0], "op_if_else") + ')' + compile(node.children[1], "op_if_else");
                            ret += ' else ' + compile(node.children[2], "op_if_else");
                            break;
                        case 'op_conditional':
                            ret = '((' + compile(node.children[0], "op_conditional") + ')?(' + compile(node.children[1], "op_conditional");
                            ret += '):(' + compile(node.children[2], "op_conditional") + '))';
                            break;
                        case 'op_while':
                            ret = ' while (' + compile(node.children[0], "op_while") + ') {\n' + compile(node.children[1], "op_while") + '}\n';
                            break;
                        case 'op_do':
                            ret = ' do {\n' + compile(node.children[0], "op_do") + '} while (' + compile(node.children[1], "op_do") + ');\n';
                            break;
                        case 'op_for':
                            //ret = ' for (' + compile(node.children[0]) + '; ' + compile(node.children[1]) + '; ' + compile(node.children[2]) + ') {\n' + compile(node.children[3]) + '\n}\n';
                            ret = ' for (' + compile(node.children[0], "op_for") +   // Assignment ends with ";"
                                compile(node.children[1], "op_for") + '; ' +         // Logical test comes without ";"
                                compile(node.children[2], "op_for").slice(0, -2) +   // Counting comes with ";" which has to be removed
                                ') {\n' + compile(node.children[3], "op_for") + '\n}\n';
                            break;
                        case 'op_proplst':
                            if (node.children[0]) {
                                ret = compile(node.children[0], "op_proplst") + ', ';
                            }

                            ret += compile(node.children[1], "op_proplst");
                            break;
                        case 'op_prop':
                            // child 0: Identifier
                            // child 1: Value
                            ret = node.children[0] + ': ' + compile(node.children[1], "op_prop");
                            break;
                        case 'op_emptyobject':
                            ret = js ? '{}' : '<< >>';
                            break;
                        case 'op_proplst_val':
                            ret = compile(node.children[0], "op_proplst_val");
                            break;
                        case 'op_array':
                            list = [];
                            for (i = 0; i < node.children[0].length; i++) {
                                list.push(compile(node.children[0][i], "op_array"));
                            }
                            ret = '[' + list.join(', ') + ']';
                            break;
                        case 'op_extvalue':
                            ret = compile(node.children[0], "op_extvalue") + '[' + compile(node.children[1], "op_extvalue") + ']';
                            break;
                        case 'op_return':
                            ret = ' return ' + compile(node.children[0], "op_return") + ';\n';
                            break;
                        case 'op_map':
                            if (!node.children[1].isMath && node.children[1].type !== 'node_var') {
                                that._error('compile: In a map only function calls and mathematical expressions are allowed.');
                            }

                            list = node.children[0];
                            if (js) {
                                ret = ' $jc$.makeMap(function (' + list.join(', ') + ') { return ' + compile(node.children[1], "op_map") + '; })';
                            } else {
                                ret = 'map (' + list.join(', ') + ') -> ' + compile(node.children[1], "op_map");
                            }

                            break;
                        case 'op_function':
                            list = node.children[0];
                            scope = that.pushScope(list);
                            if (js) {
                                ret = that.functionCodeJS(node);
                            } else {
                                ret = ' function (' + list.join(', ') + ') ' + compile(node.children[1], "op_function");
                            }
                            that.popScope();
                            break;
                        case 'op_execfunmath':
                            console.log('op_execfunmath: TODO');
                            ret = '-1';
                            break;
                        case 'op_execfun':
                            // parse the properties only if given
                            if (node.children[2]) {
                                list = [];
                                for (i = 0; i < node.children[2].length; i++) {
                                    list.push(compile(node.children[2][i], "op_execfun"));
                                }

                                if (js) {
                                    e = '$jc$.mergeAttributes(' + list.join(', ') + ')';
                                } else {
                                    e = list.join(', ');
                                }
                            }
                            node.children[0].withProps = !!node.children[2];
                            list = [];
                            for (i = 0; i < node.children[1].length; i++) {
                                list.push(compile(node.children[1][i], "op_execfun"));
                            }
                            ret = compile(node.children[0], "op_execfun") + '(' + list.join(', ') + (node.children[2] && js ? ', ' + e : '') + ')' + ((node.children[2] && !js) ? ' ' + e : '');
                            if (js) {
                                // Inserting a newline here allows simultaneously
                                // - procedural calls like Q.moveTo(...); and
                                // - function calls in expressions like log(x) + 1;
                                // Problem: procedural calls will not be ended by a semicolon.
                                ret += '\n';
                            }

                            // save us a function call when compiled to javascript
                            if (js && node.children[0].value === '$') {
                                ret = '$jc$.board.objects[' + compile(node.children[1][0], "op_execfun") + ']';
                            }
                            break;
                        case 'op_property':
                            if (js && node.children[1] !== 'X' && node.children[1] !== 'Y') {
                                ret = '$jc$.resolveProperty(' + compile(node.children[0], "op_property") + ', \'' + node.children[1] + '\', true)';
                            } else {
                                ret = compile(node.children[0], "op_property") + '.' + node.children[1];
                            }
                            break;
                        case 'op_use':
                            that._warn('Use of the \'use\' operator is deprecated.');
                            if (js) {
                                ret = '$jc$.use(\'';
                            } else {
                                ret = 'use(\'';
                            }

                            ret += node.children[0].toString() + '\');';
                            break;
                        case 'op_delete':
                            that._warn('Use of the \'delete\' operator is deprecated. Please use the remove() function.');
                            if (js) {
                                ret = '$jc$.del(';
                            } else {
                                ret = 'remove(';
                            }

                            ret += compile(node.children[0], "op_delete") + ')';
                            break;
                        case 'op_eq':
                            ret = '(' + compile(node.children[0], "op_eq") + ' === ' + compile(node.children[1], "op_eq") + ')';
                            break;
                        case 'op_neq':
                            ret = '(' + compile(node.children[0], "op_neq") + ' !== ' + compile(node.children[1], "op_neq") + ')';
                            break;
                        case 'op_approx':
                            ret = '(' + compile(node.children[0], "op_approx") + ' ~= ' + compile(node.children[1], "op_approx") + ')';
                            break;
                        case 'op_gt':
                            if (js) {
                                ret = '$jc$.gt(' + compile(node.children[0], "op_gt") + ', ' + compile(node.children[1], "op_gt") + ')';
                            } else {
                                ret = '(' + compile(node.children[0], "op_gt") + ' > ' + compile(node.children[1], "op_gt") + ')';
                            }
                            break;
                        case 'op_lt':
                            if (js) {
                                ret = '$jc$.lt(' + compile(node.children[0], "op_lt") + ', ' + compile(node.children[1], "op_lt") + ')';
                            } else {
                                ret = '(' + compile(node.children[0], "op_lt") + ' < ' + compile(node.children[1], "op_lt") + ')';
                            }
                            break;
                        case 'op_geq':
                            if (js) {
                                ret = '$jc$.geq(' + compile(node.children[0], "op_geq") + ', ' + compile(node.children[1], "op_geq") + ')';
                            } else {
                                ret = '(' + compile(node.children[0], "op_geq") + ' >= ' + compile(node.children[1], "op_geq") + ')';
                            }
                            break;
                        case 'op_leq':
                            if (js) {
                                ret = '$jc$.leq(' + compile(node.children[0], "op_leq") + ', ' + compile(node.children[1], "op_leq") + ')';
                            } else {
                                ret = '(' + compile(node.children[0], "op_leq") + ' <= ' + compile(node.children[1], "op_leq") + ')';
                            }
                            break;
                        case 'op_or':
                            ret = '(' + compile(node.children[0], "op_or") + ' || ' + compile(node.children[1], "op_or") + ')';
                            break;
                        case 'op_and':
                            ret = '(' + compile(node.children[0], "op_and") + ' && ' + compile(node.children[1], "op_and") + ')';
                            break;
                        case 'op_not':
                            ret = '!(' + compile(node.children[0], "op_not") + ')';
                            break;
                        case "op_add":
                            if (js) {
                                ret = '$jc$.add(' + compile(node.children[0], "op_add") + ', ' + compile(node.children[1], "op_add") + ')';
                            } else if (!format.minParentheses) {
                                ret = '(' + compile(node.children[0], "op_add") + ' + ' + compile(node.children[1], "op_add") + ')';
                            } else {
                                prioParent = prio(node);

                                e = compile(node.children[0], "op_add");
                                prioChild = prio(node.children[0]);
                                ret = (prioParent > prioChild) ? "(" + e + ")" : e;

                                ret += ' + ';

                                e = compile(node.children[1], "op_add");
                                prioChild = prio(node.children[1]);
                                ret += (prioParent > prioChild) ? "(" + e + ")" : e;
                            }
                            break;
                        case 'op_sub':
                            if (js) {
                                ret = '$jc$.sub(' + compile(node.children[0], "op_sub") + ', ' + compile(node.children[1], "op_sub") + ')';
                            } else if (!format.minParentheses) {
                                ret = '(' + compile(node.children[0], "op_sub") + ' - ' + compile(node.children[1], "op_sub") + ')';
                            } else {
                                prioParent = prio(node);

                                e = compile(node.children[0], "op_sub");
                                prioChild = prio(node.children[0]);
                                ret = (prioParent > prioChild) ? "(" + e + ")" : e;

                                ret += ' - ';

                                e = compile(node.children[1], "op_sub");
                                prioChild = prio(node.children[1]);
                                ret += (prioParent >= prioChild) ? "(" + e + ")" : e;
                            }
                            break;
                        case 'op_div':
                            if (js) {
                                ret = '$jc$.div(' + compile(node.children[0], "op_div") + ', ' + compile(node.children[1], "op_div") + ')';
                            } else if (!format.minParentheses) {
                                ret = '(' + compile(node.children[0], "op_div") + ' / ' + compile(node.children[1], "op_div") + ')';
                            } else {
                                prioParent = prio(node);

                                e = compile(node.children[0], "op_div");
                                prioChild = prio(node.children[0]);
                                ret = (prioParent > prioChild) ? "(" + e + ")" : e;

                                ret += ' / ';

                                e = compile(node.children[1], "op_div");
                                prioChild = prio(node.children[1]);
                                ret += (prioParent >= prioChild) ? "(" + e + ")" : e;
                            }
                            break;
                        case 'op_mod':
                            if (js) {
                                ret = '$jc$.mod(' + compile(node.children[0], "op_mod") + ', ' + compile(node.children[1], "op_mod") + ', true)';
                            } else if (!format.minParentheses) {
                                ret = '(' + compile(node.children[0], "op_mod") + ' % ' + compile(node.children[1], "op_mod") + ')';
                            } else {
                                prioParent = prio(node);

                                e = compile(node.children[0], "op_mod");
                                prioChild = prio(node.children[0]);
                                ret = (prioParent > prioChild) ? "(" + e + ")" : e;

                                ret += ' % ';

                                e = compile(node.children[1], "op_mod");
                                prioChild = prio(node.children[1]);
                                ret += (prioParent >= prioChild) ? "(" + e + ")" : e;
                            }
                            break;
                        case 'op_mul':
                            if (js) {
                                ret = '$jc$.mul(' + compile(node.children[0], "op_mul") + ', ' + compile(node.children[1], "op_mul") + ')';
                            } else if (!format.minParentheses) {
                                ret = '(' + compile(node.children[0], "op_mul") + ' * ' + compile(node.children[1], "op_mul") + ')';
                            } else {
                                prioParent = prio(node);

                                e = compile(node.children[0], "op_mul");
                                prioChild = prio(node.children[0]);
                                ret = (prioParent > prioChild) ? "(" + e + ")" : e;

                                ret += ' * ';

                                e = compile(node.children[1], "op_mul");
                                prioChild = prio(node.children[1]);
                                ret += (prioParent > prioChild) ? "(" + e + ")" : e;
                            }
                            break;
                        case 'op_exp':
                            if (js) {
                                ret = '$jc$.pow(' + compile(node.children[0], "op_exp", 0) + ', ' + compile(node.children[1], "op_exp", 1) + ')';
                            } else if (!format.minParentheses) {
                                ret = '('
                                    + compile(node.children[0], "op_exp", 0)
                                    + '^' + compile(node.children[1], "op_exp", 1)
                                    + ')';
                            } else {
                                prioParent = prio(node);

                                e = compile(node.children[0], "op_exp", 0);
                                prioChild = prio(node.children[0]);
                                ret = (prioParent >= prioChild)
                                    ? "(" + e + ")"
                                    : e;

                                ret += '^';

                                e = compile(node.children[1], "op_exp", 1);
                                prioChild = prio(node.children[1]);
                                ret += (prioParent > prioChild && !(format.printable && e[0] === '{' && e[e.length - 1] === '}'))
                                    ? "(" + e + ")"
                                    : e;
                            }
                            break;
                        case 'op_neg':
                            if (js) {
                                ret = '$jc$.neg(' + compile(node.children[0], "op_neg") + ')';
                            } else if (!format.minParentheses) {
                                ret = '(-' + compile(node.children[0], "op_neg") + ')';
                            } else {
                                prioParent = prio(node);
                                prioChild = prio(node.children[0]);
                                e = compile(node.children[0], "op_neg");
                                if (prioParent >= prioChild) {
                                    ret = '-(' + e + ')';
                                } else {
                                    ret = '-' + e;
                                }
                            }
                            break;
                    }
                    break;

                case 'node_var':
                    if (js) {
                        ret = that.getvarJS(node.value, false, node.withProps);
                    } else {
                        ret = node.value;
                    }
                    break;

                case 'node_const':
                    if (js) {
                        ret = node.value;
                        break;
                    }

                    c = node.value;
                    if (
                        format.constToFixed !== false &&
                        Type.isNumber(c) &&
                        !(prevOp === "op_exp" && position === 1) // exponents will not be formatted
                    ) {
                        c = parseFloat(c);
                        if (Type.isNumber(format.constToFixed)) {
                            c = Type.toFixed(c, format.constToFixed);
                        } else if (Type.isFunction(format.constToFixed)) {
                            c = format.constToFixed(c);
                        } else {
                            c = node.value;
                        }
                    }
                    if (format.minParentheses && parseFloat(c) < 0 && prevOp !== "op_execfun" && position !== 0) {
                        ret = "(" + c + ")";
                    } else {
                        ret = c;
                    }
                    break;

                case 'node_const_bool':
                    ret = node.value;
                    break;

                case 'node_str':
                    ret = '\'' + node.value + '\'';
                    break;
            }

            if (node.needsAngleBrackets) {
                if (js) {
                    ret = '{\n' + ret + ' }\n';
                } else {
                    ret = '<< ' + ret + ' >>\n';
                }
            }

            if (format.printable && prevOp === "op_exp" && position === 1) {
                ret = '{' + ret + '}';
            }

            if (format.printable && Type.isString(ret)) {
                ret = ret.replaceAll('\n', '');
            }

            return ret;
        }

        return compile(ast, "");
    },

    /**
     * This is used as the global getName() function.
     * @param {JXG.GeometryElement} obj
     * @param {Boolean} useId
     * @returns {String}
     */
    getName: function (obj, useId) {
        var name = '';

        if (Type.exists(obj) && Type.exists(obj.getName)) {
            name = obj.getName();
            if ((!Type.exists(name) || name === '') && useId) {
                name = obj.id;
            }
        } else if (useId) {
            name = obj.id;
        }

        return name;
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
     * This is used as the global area() function.
     * @param {JXG.Circle|JXG.Polygon} obj
     * @returns {Number}
     */
    area: function (obj) {
        if (!Type.exists(obj) || !Type.exists(obj.Area)) {
            this._error('Error: Can\'t calculate area.');
        }

        return obj.Area();
    },

    /**
     * This is used as the global perimeter() function.
     * @param {JXG.Circle|JXG.Polygon} obj
     * @returns {Number}
     */
    perimeter: function (obj) {
        if (!Type.exists(obj) || !Type.exists(obj.Perimeter)) {
            this._error('Error: Can\'t calculate perimeter.');
        }

        return obj.Perimeter();
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
     * This is used as the global radius() function.
     * @param {JXG.Circle|Sector} obj
     * @returns {Number}
     */
    radius: function (obj) {
        if (!Type.exists(obj) || !Type.exists(obj.Radius)) {
            this._error('Error: Can\'t calculate radius.');
        }

        return obj.Radius();
    },

    /**
     * This is used as the global slope() function.
     * @param {JXG.Line} obj
     * @returns {Number}
     */
    slope: function (obj) {
        if (!Type.exists(obj) || !Type.exists(obj.Slope)) {
            this._error('Error: Can\'t calculate slope.');
        }

        return obj.Slope();
    },

    /**
     * + operator implementation
     * @param {Number|Array|JXG.Point} a
     * @param {Number|Array|JXG.Point} b
     * @returns {Number|Array}
     */
    add: function (a, b) {
        var i, len, res;

        a = Type.evalSlider(a);
        b = Type.evalSlider(b);

        if (Interval.isInterval(a) || Interval.isInterval(b)) {
            res = Interval.add(a, b);
        } else if (Type.isArray(a) && Type.isArray(b)) {
            len = Math.min(a.length, b.length);
            res = [];

            for (i = 0; i < len; i++) {
                res[i] = a[i] + b[i];
            }
        } else if (Type.isNumber(a) && Type.isNumber(b)) {
            res = a + b;
        } else if (Type.isString(a) || Type.isString(b)) {
            res = a.toString() + b.toString();
        } else {
            this._error('Operation + not defined on operands ' + typeof a + ' and ' + typeof b);
        }

        return res;
    },

    /**
     * - operator implementation
     * @param {Number|Array|JXG.Point} a
     * @param {Number|Array|JXG.Point} b
     * @returns {Number|Array}
     */
    sub: function (a, b) {
        var i, len, res;

        a = Type.evalSlider(a);
        b = Type.evalSlider(b);

        if (Interval.isInterval(a) || Interval.isInterval(b)) {
            res = Interval.sub(a, b);
        } else if (Type.isArray(a) && Type.isArray(b)) {
            len = Math.min(a.length, b.length);
            res = [];

            for (i = 0; i < len; i++) {
                res[i] = a[i] - b[i];
            }
        } else if (Type.isNumber(a) && Type.isNumber(b)) {
            res = a - b;
        } else {
            this._error('Operation - not defined on operands ' + typeof a + ' and ' + typeof b);
        }

        return res;
    },

    /**
     * unary - operator implementation
     * @param {Number|Array|JXG.Point} a
     * @returns {Number|Array}
     */
    neg: function (a) {
        var i, len, res;

        a = Type.evalSlider(a);

        if (Interval.isInterval(a)) {
            res = Interval.negative(a);
        } else if (Type.isArray(a)) {
            len = a.length;
            res = [];

            for (i = 0; i < len; i++) {
                res[i] = -a[i];
            }
        } else if (Type.isNumber(a)) {
            res = -a;
        } else {
            this._error('Unary operation - not defined on operand ' + typeof a);
        }

        return res;
    },

    /**
     * Multiplication of vectors and numbers
     * @param {Number|Array} a
     * @param {Number|Array} b
     * @returns {Number|Array} (Inner) product of the given input values.
     */
    mul: function (a, b) {
        var i, len, res;

        a = Type.evalSlider(a);
        b = Type.evalSlider(b);

        if (Type.isArray(a) && Type.isNumber(b)) {
            // swap b and a
            i = a;
            a = b;
            b = a;
        }

        if (Interval.isInterval(a) || Interval.isInterval(b)) {
            res = Interval.mul(a, b);
        } else if (Type.isArray(a) && Type.isArray(b)) {
            len = Math.min(a.length, b.length);
            res = Mat.innerProduct(a, b, len);
        } else if (Type.isNumber(a) && Type.isArray(b)) {
            len = b.length;
            res = [];

            for (i = 0; i < len; i++) {
                res[i] = a * b[i];
            }
        } else if (Type.isNumber(a) && Type.isNumber(b)) {
            res = a * b;
        } else {
            this._error('Operation * not defined on operands ' + typeof a + ' and ' + typeof b);
        }

        return res;
    },

    /**
     * Implementation of the / operator.
     * @param {Number|Array} a
     * @param {Number} b
     * @returns {Number|Array}
     */
    div: function (a, b) {
        var i, len, res;

        a = Type.evalSlider(a);
        b = Type.evalSlider(b);

        if (Interval.isInterval(a) || Interval.isInterval(b)) {
            res = Interval.div(a, b);
        } else if (Type.isArray(a) && Type.isNumber(b)) {
            len = a.length;
            res = [];

            for (i = 0; i < len; i++) {
                res[i] = a[i] / b;
            }
        } else if (Type.isNumber(a) && Type.isNumber(b)) {
            res = a / b;
        } else {
            this._error('Operation * not defined on operands ' + typeof a + ' and ' + typeof b);
        }

        return res;
    },

    /**
     * Implementation of the % operator.
     * @param {Number|Array} a
     * @param {Number} b
     * @returns {Number|Array}
     */
    mod: function (a, b) {
        var i, len, res;

        a = Type.evalSlider(a);
        b = Type.evalSlider(b);

        if (Interval.isInterval(a) || Interval.isInterval(b)) {
            return Interval.fmod(a, b);
        } else if (Type.isArray(a) && Type.isNumber(b)) {
            len = a.length;
            res = [];

            for (i = 0; i < len; i++) {
                res[i] = Mat.mod(a[i], b, true);
            }
        } else if (Type.isNumber(a) && Type.isNumber(b)) {
            res = Mat.mod(a, b, true);
        } else {
            this._error('Operation * not defined on operands ' + typeof a + ' and ' + typeof b);
        }

        return res;
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

        if (Interval.isInterval(a) || Interval.isInterval(b)) {
            return Interval.pow(a, b);
        }
        return Mat.pow(a, b);
    },

    lt: function (a, b) {
        if (Interval.isInterval(a) || Interval.isInterval(b)) {
            return Interval.lt(a, b);
        }
        return a < b;
    },
    leq: function (a, b) {
        if (Interval.isInterval(a) || Interval.isInterval(b)) {
            return Interval.leq(a, b);
        }
        return a <= b;
    },
    gt: function (a, b) {
        if (Interval.isInterval(a) || Interval.isInterval(b)) {
            return Interval.gt(a, b);
        }
        return a > b;
    },
    geq: function (a, b) {
        if (Interval.isInterval(a) || Interval.isInterval(b)) {
            return Interval.geq(a, b);
        }
        return a >= b;
    },

    randint: function (min, max, step) {
        if (!Type.exists(step)) {
            step = 1;
        }
        return Math.round(Math.random() * (max - min) / step) * step + min;
    },

    DDD: function (f) {
        console.log('Dummy derivative function. This should never appear!');
    },

    /**
     * Implementation of the ?: operator
     * @param {Boolean} cond Condition
     * @param {*} v1
     * @param {*} v2
     * @returns {*} Either v1 or v2.
     */
    ifthen: function (cond, v1, v2) {
        if (cond) {
            return v1;
        }

        return v2;
    },

    /**
     * Implementation of the delete() builtin function
     * @param {JXG.GeometryElement} element
     */
    del: function (element) {
        if (typeof element === 'object' && JXG.exists(element.type) && JXG.exists(element.elementClass)) {
            this.board.removeObject(element);
        }
    },

    /**
     * Implementation of the eval() builtin function. Calls JXG.evaluate().
     * @param {String|Number|Function} v
     */
    eval: function (v) {
        return JXG.evaluate(v);
    },

    /**
     * Implementation of the use() builtin function
     * @param {String} board
     */
    use: function (board) {
        var b, ref,
            found = false;

        if (typeof board === 'string') {
            // search all the boards for the one with the appropriate container div
            for (b in JXG.boards) {
                if (JXG.boards.hasOwnProperty(b) && JXG.boards[b].container === board) {
                    ref = JXG.boards[b];
                    found = true;
                    break;
                }
            }
        } else {
            ref = board;
            found = true;
        }

        if (found) {
            this.board = ref;
            this.builtIn.$board = ref;
            this.builtIn.$board.src = '$jc$.board';
        } else {
            this._error('Board \'' + board + '\' not found!');
        }
    },

    /**
     * Find the first symbol to the given value from the given scope upwards.
     * @param v Value
     * @param {Number} [scope=-1] The scope, default is to start with current scope (-1).
     * @returns {Array} An array containing the symbol and the scope if a symbol could be found,
     * an empty array otherwise;
     */
    findSymbol: function (v, scope) {
        var i, s;

        scope = Type.def(scope, -1);

        if (scope === -1) {
            s = this.scope;
        } else {
            s = this.scopes[scope];
        }

        while (s !== null) {
            for (i in s.locals) {
                if (s.locals.hasOwnProperty(i) && s.locals[i] === v) {
                    return [i, s];
                }
            }

            s = s.previous;
        }

        return [];
    },

    /**
     * Import modules into a JessieCode script.
     * @param {String} module
     */
    importModule: function (module) {
        return priv.modules[module.toLowerCase()];
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
                D: that.DDD,
                X: that.X,
                Y: that.Y,
                V: that.V,
                Value: that.V,
                L: that.L,
                Length: that.L,

                acosh: Mat.acosh,
                acot: Mat.acot,
                asinh: Mat.asinh,
                binomial: Mat.binomial,
                cbrt: Mat.cbrt,
                cosh: Mat.cosh,
                cot: Mat.cot,
                deg: Geometry.trueAngle,
                A: that.area,
                area: that.area,
                Area: that.area,
                perimeter: that.perimeter,
                Perimeter: that.perimeter,
                dist: that.dist,
                Dist: that.dist,
                R: that.radius,
                radius: that.radius,
                Radius: that.radius,
                erf: Mat.erf,
                erfc: Mat.erfc,
                erfi: Mat.erfi,
                factorial: Mat.factorial,
                gcd: Mat.gcd,
                lb: Mat.log2,
                lcm: Mat.lcm,
                ld: Mat.log2,
                lg: Mat.log10,
                ln: Math.log,
                log: Mat.log,
                log10: Mat.log10,
                log2: Mat.log2,
                ndtr: Mat.ndtr,
                ndtri: Mat.ndtri,
                nthroot: Mat.nthroot,
                pow: Mat.pow,
                rad: Geometry.rad,
                ratpow: Mat.ratpow,
                trunc: Type.trunc,
                sinh: Mat.sinh,
                slope: that.slope,
                Slope: that.slope,

                randint: that.randint,

                IfThen: that.ifthen,
                'import': that.importModule,
                'eval': that.eval,
                'use': that.use,
                'remove': that.del,
                '$': that.getElementById,
                '$value': function(e) {return that.getElementById(e).Value(); },
                getName: that.getName,
                name: that.getName,
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
        builtIn.Value.src = '$jc$.V';
        builtIn.L.src = '$jc$.L';
        builtIn.Length.src = '$jc$.L';

        builtIn.acosh.src = 'JXG.Math.acosh';
        builtIn.acot.src = 'JXG.Math.acot';
        builtIn.asinh.src = 'JXG.Math.asinh';
        builtIn.binomial.src = 'JXG.Math.binomial';
        builtIn.cbrt.src = 'JXG.Math.cbrt';
        builtIn.cot.src = 'JXG.Math.cot';
        builtIn.cosh.src = 'JXG.Math.cosh';
        builtIn.deg.src = 'JXG.Math.Geometry.trueAngle';
        builtIn.erf.src = 'JXG.Math.erf';
        builtIn.erfc.src = 'JXG.Math.erfc';
        builtIn.erfi.src = 'JXG.Math.erfi';
        builtIn.A.src = '$jc$.area';
        builtIn.area.src = '$jc$.area';
        builtIn.Area.src = '$jc$.area';
        builtIn.perimeter.src = '$jc$.perimeter';
        builtIn.Perimeter.src = '$jc$.perimeter';
        builtIn.dist.src = '$jc$.dist';
        builtIn.Dist.src = '$jc$.dist';
        builtIn.R.src = '$jc$.radius';
        builtIn.radius.src = '$jc$.radius';
        builtIn.Radius.src = '$jc$.radius';
        builtIn.factorial.src = 'JXG.Math.factorial';
        builtIn.gcd.src = 'JXG.Math.gcd';
        builtIn.lb.src = 'JXG.Math.log2';
        builtIn.lcm.src = 'JXG.Math.lcm';
        builtIn.ld.src = 'JXG.Math.log2';
        builtIn.lg.src = 'JXG.Math.log10';
        builtIn.ln.src = 'Math.log';
        builtIn.log.src = 'JXG.Math.log';
        builtIn.log10.src = 'JXG.Math.log10';
        builtIn.log2.src = 'JXG.Math.log2';
        builtIn.ndtr.src = 'JXG.Math.ndtr';
        builtIn.ndtri.src = 'JXG.Math.ndtri';
        builtIn.nthroot.src = 'JXG.Math.nthroot';
        builtIn.pow.src = 'JXG.Math.pow';
        builtIn.rad.src = 'JXG.Math.Geometry.rad';
        builtIn.ratpow.src = 'JXG.Math.ratpow';
        builtIn.trunc.src = 'JXG.trunc';
        builtIn.sinh.src = 'JXG.Math.sinh';
        builtIn.slope.src = '$jc$.slope';
        builtIn.Slope.src = '$jc$.slope';

        builtIn.randint.src = '$jc$.randint';

        builtIn['import'].src = '$jc$.importModule';
        builtIn.eval.src = '$jc$.eval';
        builtIn.use.src = '$jc$.use';
        builtIn.remove.src = '$jc$.del';
        builtIn.IfThen.src = '$jc$.ifthen';
        // usually unused, see node_op > op_execfun
        builtIn.$.src = '(function (n) { return $jc$.board.select(n); })';
        builtIn.$value.src = '(function (n) { return $jc$.board.select(n).Value(); })';
        builtIn.getName.src = '$jc$.getName';
        builtIn.name.src = '$jc$.getName';
        if (builtIn.$board) {
            builtIn.$board.src = '$jc$.board';
        }
        builtIn.$log.src = '$jc$.log';

        builtIn = JXG.merge(builtIn, that._addedBuiltIn);

        return builtIn;
    },

    _addedBuiltIn: {},

    addBuiltIn: function (name, func) {
        if (Type.exists(this.builtIn)) {
            if (Type.exists(this.builtIn[name])) {
                return;
            }
            this.builtIn[name] = func;
            this.builtIn[name].src = '$jc$.' + name;
        }

        if (Type.exists(this._addedBuiltIn[name])) {
            return;
        }
        this._addedBuiltIn[name] = func;
        this._addedBuiltIn[name].src = '$jc$.' + name;

        JXG.JessieCode.prototype[name] = func;
    },

    /**
     * Returns information about the possible functions and constants.
     * @returns {Object}
     */
    getPossibleOperands: function () {
        var FORBIDDEN = ['E'],
            jessiecode = this.builtIn || this.defineBuiltIn(),
            math = Math,
            jc, ma, merge,
            i, j, p, len, e,
            funcs, funcsJC, consts, operands,
            sort, pack;

        sort = function (a, b) {
            return a.toLowerCase().localeCompare(b.toLowerCase());
        };

        pack = function (name, origin) {
            var that = null;

            if (origin === 'jc') that = jessiecode[name];
            else if (origin === 'Math') that = math[name];
            else return;

            if (FORBIDDEN.indexOf(name) >= 0) {
                return;
            } else if (JXG.isFunction(that)) {
                return {
                    name: name,
                    type: 'function',
                    numParams: that.length,
                    origin: origin,
                };
            } else if (JXG.isNumber(that)) {
                return {
                    name: name,
                    type: 'constant',
                    value: that,
                    origin: origin,
                };
            } else if (name.startsWith('$')) {
                // do nothing
            } else if (that !== undefined) {
                console.error('undefined type', that);
            }
        };

        jc = Object.getOwnPropertyNames(jessiecode).sort(sort);
        ma = Object.getOwnPropertyNames(math).sort(sort);
        merge = [];
        i = 0;
        j = 0;

        while (i < jc.length || j < ma.length) {
            if (jc[i] === ma[j]) {
                p = pack(ma[j], 'Math');
                if (JXG.exists(p)) merge.push(p);
                i++;
                j++;
            } else if (!JXG.exists(ma[j]) || jc[i].toLowerCase().localeCompare(ma[j].toLowerCase()) < 0) {
                p = pack(jc[i], 'jc');
                if (JXG.exists(p)) merge.push(p);
                i++;
            } else {
                p = pack(ma[j], 'Math');
                if (JXG.exists(p)) merge.push(p);
                j++;
            }
        }

        funcs = [];
        funcsJC = [];
        consts = [];
        operands = {};
        len = merge.length;
        for (i = 0; i < len; i++) {
            e = merge[i];
            switch (e.type) {
                case 'function':
                    funcs.push(e.name);
                    if (e.origin === 'jc')
                        funcsJC.push(e.name);
                    break;
                case 'constant':
                    consts.push(e.name);
                    break;
            }
            operands[e.name] = e;
        }

        return {
            all: operands,
            list: merge,
            functions: funcs,
            functions_jessiecode: funcsJC,
            constants: consts,
        };
    },

    /**
     * Output a debugging message. Uses debug console, if available. Otherwise an HTML element with the
     * id "debug" and an innerText property is used.
     * @param {String} log
     * @private
     */
    _debug: function (log) {
        if (typeof console === 'object' && console.log) {
            console.log(log);
        } else if (Env.isBrowser && document && document.getElementById('debug') !== null) {
            document.getElementById('debug').innerText += log + '\n';
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
        if (typeof console === 'object' && console.log) {
            console.log('Warning(' + this.line + '): ' + msg);
        } else if (Env.isBrowser && document && document.getElementById(this.warnLog) !== null) {
            document.getElementById(this.warnLog).innerText += 'Warning(' + this.line + '): ' + msg + '\n';
        }
    },

    _log: function (msg) {
        if (typeof window !== 'object' && typeof self === 'object' && self.postMessage) {
            self.postMessage({ type: 'log', msg: 'Log: ' + msg.toString() });
        } else {
            console.log('Log: ', arguments);
        }
    }

});

/* Jison generated parser */
/**
 * @class
 * @ignore
 */
var parser = (function(){
/**
 * @class
 * @ignore
 */
var parser = {trace: function trace () { },
yy: {},
symbols_: {"error":2,"Program":3,"StatementList":4,"EOF":5,"IfStatement":6,"IF":7,"(":8,"Expression":9,")":10,"Statement":11,"ELSE":12,"LoopStatement":13,"WHILE":14,"FOR":15,";":16,"DO":17,"UnaryStatement":18,"USE":19,"IDENTIFIER":20,"DELETE":21,"ReturnStatement":22,"RETURN":23,"EmptyStatement":24,"StatementBlock":25,"{":26,"}":27,"ExpressionStatement":28,"AssignmentExpression":29,"ConditionalExpression":30,"LeftHandSideExpression":31,"=":32,"LogicalORExpression":33,"?":34,":":35,"LogicalANDExpression":36,"||":37,"EqualityExpression":38,"&&":39,"RelationalExpression":40,"==":41,"!=":42,"~=":43,"AdditiveExpression":44,"<":45,">":46,"<=":47,">=":48,"MultiplicativeExpression":49,"+":50,"-":51,"UnaryExpression":52,"*":53,"/":54,"%":55,"ExponentExpression":56,"^":57,"!":58,"MemberExpression":59,"CallExpression":60,"PrimaryExpression":61,"FunctionExpression":62,"MapExpression":63,".":64,"[":65,"]":66,"BasicLiteral":67,"ObjectLiteral":68,"ArrayLiteral":69,"NullLiteral":70,"BooleanLiteral":71,"StringLiteral":72,"NumberLiteral":73,"NULL":74,"TRUE":75,"FALSE":76,"STRING":77,"NUMBER":78,"NAN":79,"INFINITY":80,"ElementList":81,"<<":82,">>":83,"PropertyList":84,"Property":85,",":86,"PropertyName":87,"Arguments":88,"AttributeList":89,"Attribute":90,"FUNCTION":91,"ParameterDefinitionList":92,"MAP":93,"->":94,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",7:"IF",8:"(",10:")",12:"ELSE",14:"WHILE",15:"FOR",16:";",17:"DO",19:"USE",20:"IDENTIFIER",21:"DELETE",23:"RETURN",26:"{",27:"}",32:"=",34:"?",35:":",37:"||",39:"&&",41:"==",42:"!=",43:"~=",45:"<",46:">",47:"<=",48:">=",50:"+",51:"-",53:"*",54:"/",55:"%",57:"^",58:"!",64:".",65:"[",66:"]",74:"NULL",75:"TRUE",76:"FALSE",77:"STRING",78:"NUMBER",79:"NAN",80:"INFINITY",82:"<<",83:">>",86:",",91:"FUNCTION",93:"MAP",94:"->"},
productions_: [0,[3,2],[6,5],[6,7],[13,5],[13,9],[13,7],[18,2],[18,2],[22,2],[22,3],[24,1],[25,3],[4,2],[4,0],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[28,2],[9,1],[29,1],[29,3],[30,1],[30,5],[33,1],[33,3],[36,1],[36,3],[38,1],[38,3],[38,3],[38,3],[40,1],[40,3],[40,3],[40,3],[40,3],[44,1],[44,3],[44,3],[49,1],[49,3],[49,3],[49,3],[56,1],[56,3],[52,1],[52,2],[52,2],[52,2],[31,1],[31,1],[59,1],[59,1],[59,1],[59,3],[59,4],[61,1],[61,1],[61,1],[61,1],[61,3],[67,1],[67,1],[67,1],[67,1],[70,1],[71,1],[71,1],[72,1],[73,1],[73,1],[73,1],[69,2],[69,3],[68,2],[68,3],[84,1],[84,3],[85,3],[87,1],[87,1],[87,1],[60,2],[60,3],[60,2],[60,4],[60,3],[88,2],[88,3],[89,1],[89,3],[90,1],[90,1],[81,1],[81,3],[62,4],[62,5],[63,5],[63,6],[92,1],[92,3]],
/**
 * @class
 * @ignore
 */
performAction: function anonymous(yytext,yyleng,yylineno,yy,yystate,$$,_$
) {

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
case 12: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_block', $$[$0-1]);
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
case 24: this.$ = $$[$0];
break;
case 25: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_assign', $$[$0-2], $$[$0]); this.$.isMath = false;
break;
case 26: this.$ = $$[$0];
break;
case 27: this.$ = AST.createNode(lc(_$[$0-4]), 'node_op', 'op_conditional', $$[$0-4], $$[$0-2], $$[$0]); this.$.isMath = false;
break;
case 28: this.$ = $$[$0];
break;
case 29: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_or', $$[$0-2], $$[$0]); this.$.isMath = false;
break;
case 30: this.$ = $$[$0];
break;
case 31: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_and', $$[$0-2], $$[$0]); this.$.isMath = false;
break;
case 32: this.$ = $$[$0];
break;
case 33: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_eq', $$[$0-2], $$[$0]); this.$.isMath = false;
break;
case 34: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_neq', $$[$0-2], $$[$0]); this.$.isMath = false;
break;
case 35: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_approx', $$[$0-2], $$[$0]); this.$.isMath = false;
break;
case 36: this.$ = $$[$0];
break;
case 37: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_lt', $$[$0-2], $$[$0]); this.$.isMath = false;
break;
case 38: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_gt', $$[$0-2], $$[$0]); this.$.isMath = false;
break;
case 39: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_leq', $$[$0-2], $$[$0]); this.$.isMath = false;
break;
case 40: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_geq', $$[$0-2], $$[$0]); this.$.isMath = false;
break;
case 41: this.$ = $$[$0];
break;
case 42: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_add', $$[$0-2], $$[$0]); this.$.isMath = true;
break;
case 43: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_sub', $$[$0-2], $$[$0]); this.$.isMath = true;
break;
case 44: this.$ = $$[$0];
break;
case 45: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_mul', $$[$0-2], $$[$0]); this.$.isMath = true;
break;
case 46: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_div', $$[$0-2], $$[$0]); this.$.isMath = true;
break;
case 47: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_mod', $$[$0-2], $$[$0]); this.$.isMath = true;
break;
case 48: this.$ = $$[$0];
break;
case 49: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_exp', $$[$0-2], $$[$0]); this.$.isMath = true;
break;
case 50: this.$ = $$[$0];
break;
case 51: this.$ = AST.createNode(lc(_$[$0-1]), 'node_op', 'op_not', $$[$0]); this.$.isMath = false;
break;
case 52: this.$ = $$[$0];
break;
case 53: this.$ = AST.createNode(lc(_$[$0-1]), 'node_op', 'op_neg', $$[$0]); this.$.isMath = true;
break;
case 54: this.$ = $$[$0];
break;
case 55: this.$ = $$[$0];
break;
case 56: this.$ = $$[$0];
break;
case 57: this.$ = $$[$0]; this.$.isMath = false;
break;
case 58: this.$ = $$[$0];
break;
case 59: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_property', $$[$0-2], $$[$0]); this.$.isMath = true;
break;
case 60: this.$ = AST.createNode(lc(_$[$0-3]), 'node_op', 'op_extvalue', $$[$0-3], $$[$0-1]); this.$.isMath = true;
break;
case 61: this.$ = AST.createNode(lc(_$[$0]), 'node_var', $$[$0]);
break;
case 62: this.$ = $$[$0];
break;
case 63: this.$ = $$[$0]; this.$.isMath = false;
break;
case 64: this.$ = $$[$0]; this.$.isMath = false;
break;
case 65: this.$ = $$[$0-1];
break;
case 66: this.$ = $$[$0]; this.$.isMath = false;
break;
case 67: this.$ = $$[$0]; this.$.isMath = false;
break;
case 68: this.$ = $$[$0]; this.$.isMath = false;
break;
case 69: this.$ = $$[$0]; this.$.isMath = true;
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
case 79: this.$ = AST.createNode(lc(_$[$0-1]), 'node_op', 'op_emptyobject', {}); this.$.needsAngleBrackets = true;
break;
case 80: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_proplst_val', $$[$0-1]); this.$.needsAngleBrackets = true;
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
case 87: this.$ = AST.createNode(lc(_$[$0-1]), 'node_op', 'op_execfun', $$[$0-1], $$[$0]); this.$.isMath = true;
break;
case 88: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_execfun', $$[$0-2], $$[$0-1], $$[$0], true); this.$.isMath = false;
break;
case 89: this.$ = AST.createNode(lc(_$[$0-1]), 'node_op', 'op_execfun', $$[$0-1], $$[$0]); this.$.isMath = true;
break;
case 90: this.$ = AST.createNode(lc(_$[$0-3]), 'node_op', 'op_extvalue', $$[$0-3], $$[$0-1]); this.$.isMath = true;
break;
case 91: this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_property', $$[$0-2], $$[$0]); this.$.isMath = true;
break;
case 92: this.$ = [];
break;
case 93: this.$ = $$[$0-1];
break;
case 94: this.$ = [$$[$0]];
break;
case 95: this.$ = $$[$0-2].concat($$[$0]);
break;
case 96: this.$ = AST.createNode(lc(_$[$0]), 'node_var', $$[$0]); this.$.isMath = true;
break;
case 97: this.$ = $$[$0]; this.$.isMath = false;
break;
case 98: this.$ = [$$[$0]];
break;
case 99: this.$ = $$[$0-2].concat($$[$0]);
break;
case 100: this.$ = AST.createNode(lc(_$[$0-3]), 'node_op', 'op_function', [], $$[$0]); this.$.isMath = false;
break;
case 101: this.$ = AST.createNode(lc(_$[$0-4]), 'node_op', 'op_function', $$[$0-2], $$[$0]); this.$.isMath = false;
break;
case 102: this.$ = AST.createNode(lc(_$[$0-4]), 'node_op', 'op_map', [], $$[$0]);
break;
case 103: this.$ = AST.createNode(lc(_$[$0-5]), 'node_op', 'op_map', $$[$0-3], $$[$0]);
break;
case 104: this.$ = [$$[$0]];
break;
case 105: this.$ = $$[$0-2].concat($$[$0]);
break;
}
},
table: [{3:1,4:2,5:[2,14],7:[2,14],8:[2,14],14:[2,14],15:[2,14],16:[2,14],17:[2,14],19:[2,14],20:[2,14],21:[2,14],23:[2,14],26:[2,14],50:[2,14],51:[2,14],58:[2,14],65:[2,14],74:[2,14],75:[2,14],76:[2,14],77:[2,14],78:[2,14],79:[2,14],80:[2,14],82:[2,14],91:[2,14],93:[2,14]},{1:[3]},{5:[1,3],6:6,7:[1,13],8:[1,37],9:20,11:4,13:7,14:[1,14],15:[1,15],16:[1,21],17:[1,16],18:8,19:[1,17],20:[1,33],21:[1,18],22:9,23:[1,19],24:11,25:5,26:[1,12],28:10,29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{1:[2,1]},{5:[2,13],7:[2,13],8:[2,13],14:[2,13],15:[2,13],16:[2,13],17:[2,13],19:[2,13],20:[2,13],21:[2,13],23:[2,13],26:[2,13],27:[2,13],50:[2,13],51:[2,13],58:[2,13],65:[2,13],74:[2,13],75:[2,13],76:[2,13],77:[2,13],78:[2,13],79:[2,13],80:[2,13],82:[2,13],91:[2,13],93:[2,13]},{5:[2,15],7:[2,15],8:[2,15],12:[2,15],14:[2,15],15:[2,15],16:[2,15],17:[2,15],19:[2,15],20:[2,15],21:[2,15],23:[2,15],26:[2,15],27:[2,15],50:[2,15],51:[2,15],58:[2,15],65:[2,15],74:[2,15],75:[2,15],76:[2,15],77:[2,15],78:[2,15],79:[2,15],80:[2,15],82:[2,15],91:[2,15],93:[2,15]},{5:[2,16],7:[2,16],8:[2,16],12:[2,16],14:[2,16],15:[2,16],16:[2,16],17:[2,16],19:[2,16],20:[2,16],21:[2,16],23:[2,16],26:[2,16],27:[2,16],50:[2,16],51:[2,16],58:[2,16],65:[2,16],74:[2,16],75:[2,16],76:[2,16],77:[2,16],78:[2,16],79:[2,16],80:[2,16],82:[2,16],91:[2,16],93:[2,16]},{5:[2,17],7:[2,17],8:[2,17],12:[2,17],14:[2,17],15:[2,17],16:[2,17],17:[2,17],19:[2,17],20:[2,17],21:[2,17],23:[2,17],26:[2,17],27:[2,17],50:[2,17],51:[2,17],58:[2,17],65:[2,17],74:[2,17],75:[2,17],76:[2,17],77:[2,17],78:[2,17],79:[2,17],80:[2,17],82:[2,17],91:[2,17],93:[2,17]},{5:[2,18],7:[2,18],8:[2,18],12:[2,18],14:[2,18],15:[2,18],16:[2,18],17:[2,18],19:[2,18],20:[2,18],21:[2,18],23:[2,18],26:[2,18],27:[2,18],50:[2,18],51:[2,18],58:[2,18],65:[2,18],74:[2,18],75:[2,18],76:[2,18],77:[2,18],78:[2,18],79:[2,18],80:[2,18],82:[2,18],91:[2,18],93:[2,18]},{5:[2,19],7:[2,19],8:[2,19],12:[2,19],14:[2,19],15:[2,19],16:[2,19],17:[2,19],19:[2,19],20:[2,19],21:[2,19],23:[2,19],26:[2,19],27:[2,19],50:[2,19],51:[2,19],58:[2,19],65:[2,19],74:[2,19],75:[2,19],76:[2,19],77:[2,19],78:[2,19],79:[2,19],80:[2,19],82:[2,19],91:[2,19],93:[2,19]},{5:[2,20],7:[2,20],8:[2,20],12:[2,20],14:[2,20],15:[2,20],16:[2,20],17:[2,20],19:[2,20],20:[2,20],21:[2,20],23:[2,20],26:[2,20],27:[2,20],50:[2,20],51:[2,20],58:[2,20],65:[2,20],74:[2,20],75:[2,20],76:[2,20],77:[2,20],78:[2,20],79:[2,20],80:[2,20],82:[2,20],91:[2,20],93:[2,20]},{5:[2,21],7:[2,21],8:[2,21],12:[2,21],14:[2,21],15:[2,21],16:[2,21],17:[2,21],19:[2,21],20:[2,21],21:[2,21],23:[2,21],26:[2,21],27:[2,21],50:[2,21],51:[2,21],58:[2,21],65:[2,21],74:[2,21],75:[2,21],76:[2,21],77:[2,21],78:[2,21],79:[2,21],80:[2,21],82:[2,21],91:[2,21],93:[2,21]},{4:61,7:[2,14],8:[2,14],14:[2,14],15:[2,14],16:[2,14],17:[2,14],19:[2,14],20:[2,14],21:[2,14],23:[2,14],26:[2,14],27:[2,14],50:[2,14],51:[2,14],58:[2,14],65:[2,14],74:[2,14],75:[2,14],76:[2,14],77:[2,14],78:[2,14],79:[2,14],80:[2,14],82:[2,14],91:[2,14],93:[2,14]},{8:[1,62]},{8:[1,63]},{8:[1,64]},{6:6,7:[1,13],8:[1,37],9:20,11:65,13:7,14:[1,14],15:[1,15],16:[1,21],17:[1,16],18:8,19:[1,17],20:[1,33],21:[1,18],22:9,23:[1,19],24:11,25:5,26:[1,12],28:10,29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{20:[1,66]},{20:[1,67]},{8:[1,37],9:69,16:[1,68],20:[1,33],29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{16:[1,70]},{5:[2,11],7:[2,11],8:[2,11],12:[2,11],14:[2,11],15:[2,11],16:[2,11],17:[2,11],19:[2,11],20:[2,11],21:[2,11],23:[2,11],26:[2,11],27:[2,11],50:[2,11],51:[2,11],58:[2,11],65:[2,11],74:[2,11],75:[2,11],76:[2,11],77:[2,11],78:[2,11],79:[2,11],80:[2,11],82:[2,11],91:[2,11],93:[2,11]},{8:[2,23],10:[2,23],16:[2,23],32:[2,23],34:[2,23],35:[2,23],37:[2,23],39:[2,23],41:[2,23],42:[2,23],43:[2,23],45:[2,23],46:[2,23],47:[2,23],48:[2,23],50:[2,23],51:[2,23],53:[2,23],54:[2,23],55:[2,23],57:[2,23],64:[2,23],65:[2,23],66:[2,23],83:[2,23],86:[2,23]},{8:[2,24],10:[2,24],16:[2,24],32:[2,24],34:[2,24],35:[2,24],37:[2,24],39:[2,24],41:[2,24],42:[2,24],43:[2,24],45:[2,24],46:[2,24],47:[2,24],48:[2,24],50:[2,24],51:[2,24],53:[2,24],54:[2,24],55:[2,24],57:[2,24],64:[2,24],65:[2,24],66:[2,24],83:[2,24],86:[2,24]},{8:[2,48],10:[2,48],16:[2,48],32:[1,71],34:[2,48],35:[2,48],37:[2,48],39:[2,48],41:[2,48],42:[2,48],43:[2,48],45:[2,48],46:[2,48],47:[2,48],48:[2,48],50:[2,48],51:[2,48],53:[2,48],54:[2,48],55:[2,48],57:[1,72],64:[2,48],65:[2,48],66:[2,48],83:[2,48],86:[2,48]},{8:[2,26],10:[2,26],16:[2,26],32:[2,26],34:[1,73],35:[2,26],37:[1,74],39:[2,26],41:[2,26],42:[2,26],43:[2,26],45:[2,26],46:[2,26],47:[2,26],48:[2,26],50:[2,26],51:[2,26],53:[2,26],54:[2,26],55:[2,26],57:[2,26],64:[2,26],65:[2,26],66:[2,26],83:[2,26],86:[2,26]},{8:[1,78],10:[2,54],16:[2,54],32:[2,54],34:[2,54],35:[2,54],37:[2,54],39:[2,54],41:[2,54],42:[2,54],43:[2,54],45:[2,54],46:[2,54],47:[2,54],48:[2,54],50:[2,54],51:[2,54],53:[2,54],54:[2,54],55:[2,54],57:[2,54],64:[1,75],65:[1,76],66:[2,54],83:[2,54],86:[2,54],88:77},{8:[1,78],10:[2,55],16:[2,55],32:[2,55],34:[2,55],35:[2,55],37:[2,55],39:[2,55],41:[2,55],42:[2,55],43:[2,55],45:[2,55],46:[2,55],47:[2,55],48:[2,55],50:[2,55],51:[2,55],53:[2,55],54:[2,55],55:[2,55],57:[2,55],64:[1,81],65:[1,80],66:[2,55],83:[2,55],86:[2,55],88:79},{8:[2,28],10:[2,28],16:[2,28],32:[2,28],34:[2,28],35:[2,28],37:[2,28],39:[1,82],41:[2,28],42:[2,28],43:[2,28],45:[2,28],46:[2,28],47:[2,28],48:[2,28],50:[2,28],51:[2,28],53:[2,28],54:[2,28],55:[2,28],57:[2,28],64:[2,28],65:[2,28],66:[2,28],83:[2,28],86:[2,28]},{8:[2,56],10:[2,56],16:[2,56],32:[2,56],34:[2,56],35:[2,56],37:[2,56],39:[2,56],41:[2,56],42:[2,56],43:[2,56],45:[2,56],46:[2,56],47:[2,56],48:[2,56],50:[2,56],51:[2,56],53:[2,56],54:[2,56],55:[2,56],57:[2,56],64:[2,56],65:[2,56],66:[2,56],83:[2,56],86:[2,56]},{8:[2,57],10:[2,57],16:[2,57],32:[2,57],34:[2,57],35:[2,57],37:[2,57],39:[2,57],41:[2,57],42:[2,57],43:[2,57],45:[2,57],46:[2,57],47:[2,57],48:[2,57],50:[2,57],51:[2,57],53:[2,57],54:[2,57],55:[2,57],57:[2,57],64:[2,57],65:[2,57],66:[2,57],83:[2,57],86:[2,57]},{8:[2,58],10:[2,58],16:[2,58],32:[2,58],34:[2,58],35:[2,58],37:[2,58],39:[2,58],41:[2,58],42:[2,58],43:[2,58],45:[2,58],46:[2,58],47:[2,58],48:[2,58],50:[2,58],51:[2,58],53:[2,58],54:[2,58],55:[2,58],57:[2,58],64:[2,58],65:[2,58],66:[2,58],83:[2,58],86:[2,58]},{8:[2,30],10:[2,30],16:[2,30],32:[2,30],34:[2,30],35:[2,30],37:[2,30],39:[2,30],41:[1,83],42:[1,84],43:[1,85],45:[2,30],46:[2,30],47:[2,30],48:[2,30],50:[2,30],51:[2,30],53:[2,30],54:[2,30],55:[2,30],57:[2,30],64:[2,30],65:[2,30],66:[2,30],83:[2,30],86:[2,30]},{8:[2,61],10:[2,61],16:[2,61],32:[2,61],34:[2,61],35:[2,61],37:[2,61],39:[2,61],41:[2,61],42:[2,61],43:[2,61],45:[2,61],46:[2,61],47:[2,61],48:[2,61],50:[2,61],51:[2,61],53:[2,61],54:[2,61],55:[2,61],57:[2,61],64:[2,61],65:[2,61],66:[2,61],83:[2,61],86:[2,61]},{8:[2,62],10:[2,62],16:[2,62],32:[2,62],34:[2,62],35:[2,62],37:[2,62],39:[2,62],41:[2,62],42:[2,62],43:[2,62],45:[2,62],46:[2,62],47:[2,62],48:[2,62],50:[2,62],51:[2,62],53:[2,62],54:[2,62],55:[2,62],57:[2,62],64:[2,62],65:[2,62],66:[2,62],83:[2,62],86:[2,62]},{8:[2,63],10:[2,63],16:[2,63],32:[2,63],34:[2,63],35:[2,63],37:[2,63],39:[2,63],41:[2,63],42:[2,63],43:[2,63],45:[2,63],46:[2,63],47:[2,63],48:[2,63],50:[2,63],51:[2,63],53:[2,63],54:[2,63],55:[2,63],57:[2,63],64:[2,63],65:[2,63],66:[2,63],83:[2,63],86:[2,63]},{8:[2,64],10:[2,64],16:[2,64],32:[2,64],34:[2,64],35:[2,64],37:[2,64],39:[2,64],41:[2,64],42:[2,64],43:[2,64],45:[2,64],46:[2,64],47:[2,64],48:[2,64],50:[2,64],51:[2,64],53:[2,64],54:[2,64],55:[2,64],57:[2,64],64:[2,64],65:[2,64],66:[2,64],83:[2,64],86:[2,64]},{8:[1,37],9:86,20:[1,33],29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{8:[1,87]},{8:[1,88]},{8:[2,32],10:[2,32],16:[2,32],32:[2,32],34:[2,32],35:[2,32],37:[2,32],39:[2,32],41:[2,32],42:[2,32],43:[2,32],45:[1,89],46:[1,90],47:[1,91],48:[1,92],50:[2,32],51:[2,32],53:[2,32],54:[2,32],55:[2,32],57:[2,32],64:[2,32],65:[2,32],66:[2,32],83:[2,32],86:[2,32]},{8:[2,66],10:[2,66],16:[2,66],32:[2,66],34:[2,66],35:[2,66],37:[2,66],39:[2,66],41:[2,66],42:[2,66],43:[2,66],45:[2,66],46:[2,66],47:[2,66],48:[2,66],50:[2,66],51:[2,66],53:[2,66],54:[2,66],55:[2,66],57:[2,66],64:[2,66],65:[2,66],66:[2,66],83:[2,66],86:[2,66]},{8:[2,67],10:[2,67],16:[2,67],32:[2,67],34:[2,67],35:[2,67],37:[2,67],39:[2,67],41:[2,67],42:[2,67],43:[2,67],45:[2,67],46:[2,67],47:[2,67],48:[2,67],50:[2,67],51:[2,67],53:[2,67],54:[2,67],55:[2,67],57:[2,67],64:[2,67],65:[2,67],66:[2,67],83:[2,67],86:[2,67]},{8:[2,68],10:[2,68],16:[2,68],32:[2,68],34:[2,68],35:[2,68],37:[2,68],39:[2,68],41:[2,68],42:[2,68],43:[2,68],45:[2,68],46:[2,68],47:[2,68],48:[2,68],50:[2,68],51:[2,68],53:[2,68],54:[2,68],55:[2,68],57:[2,68],64:[2,68],65:[2,68],66:[2,68],83:[2,68],86:[2,68]},{8:[2,69],10:[2,69],16:[2,69],32:[2,69],34:[2,69],35:[2,69],37:[2,69],39:[2,69],41:[2,69],42:[2,69],43:[2,69],45:[2,69],46:[2,69],47:[2,69],48:[2,69],50:[2,69],51:[2,69],53:[2,69],54:[2,69],55:[2,69],57:[2,69],64:[2,69],65:[2,69],66:[2,69],83:[2,69],86:[2,69]},{20:[1,97],72:98,73:99,77:[1,51],78:[1,52],79:[1,53],80:[1,54],83:[1,93],84:94,85:95,87:96},{8:[1,37],20:[1,33],29:102,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],66:[1,100],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],81:101,82:[1,45],91:[1,38],93:[1,39]},{8:[2,36],10:[2,36],16:[2,36],32:[2,36],34:[2,36],35:[2,36],37:[2,36],39:[2,36],41:[2,36],42:[2,36],43:[2,36],45:[2,36],46:[2,36],47:[2,36],48:[2,36],50:[1,103],51:[1,104],53:[2,36],54:[2,36],55:[2,36],57:[2,36],64:[2,36],65:[2,36],66:[2,36],83:[2,36],86:[2,36]},{8:[2,70],10:[2,70],16:[2,70],32:[2,70],34:[2,70],35:[2,70],37:[2,70],39:[2,70],41:[2,70],42:[2,70],43:[2,70],45:[2,70],46:[2,70],47:[2,70],48:[2,70],50:[2,70],51:[2,70],53:[2,70],54:[2,70],55:[2,70],57:[2,70],64:[2,70],65:[2,70],66:[2,70],83:[2,70],86:[2,70]},{8:[2,71],10:[2,71],16:[2,71],32:[2,71],34:[2,71],35:[2,71],37:[2,71],39:[2,71],41:[2,71],42:[2,71],43:[2,71],45:[2,71],46:[2,71],47:[2,71],48:[2,71],50:[2,71],51:[2,71],53:[2,71],54:[2,71],55:[2,71],57:[2,71],64:[2,71],65:[2,71],66:[2,71],83:[2,71],86:[2,71]},{8:[2,72],10:[2,72],16:[2,72],32:[2,72],34:[2,72],35:[2,72],37:[2,72],39:[2,72],41:[2,72],42:[2,72],43:[2,72],45:[2,72],46:[2,72],47:[2,72],48:[2,72],50:[2,72],51:[2,72],53:[2,72],54:[2,72],55:[2,72],57:[2,72],64:[2,72],65:[2,72],66:[2,72],83:[2,72],86:[2,72]},{8:[2,73],10:[2,73],16:[2,73],32:[2,73],34:[2,73],35:[2,73],37:[2,73],39:[2,73],41:[2,73],42:[2,73],43:[2,73],45:[2,73],46:[2,73],47:[2,73],48:[2,73],50:[2,73],51:[2,73],53:[2,73],54:[2,73],55:[2,73],57:[2,73],64:[2,73],65:[2,73],66:[2,73],83:[2,73],86:[2,73]},{8:[2,74],10:[2,74],16:[2,74],32:[2,74],34:[2,74],35:[2,74],37:[2,74],39:[2,74],41:[2,74],42:[2,74],43:[2,74],45:[2,74],46:[2,74],47:[2,74],48:[2,74],50:[2,74],51:[2,74],53:[2,74],54:[2,74],55:[2,74],57:[2,74],64:[2,74],65:[2,74],66:[2,74],83:[2,74],86:[2,74]},{8:[2,75],10:[2,75],16:[2,75],32:[2,75],34:[2,75],35:[2,75],37:[2,75],39:[2,75],41:[2,75],42:[2,75],43:[2,75],45:[2,75],46:[2,75],47:[2,75],48:[2,75],50:[2,75],51:[2,75],53:[2,75],54:[2,75],55:[2,75],57:[2,75],64:[2,75],65:[2,75],66:[2,75],83:[2,75],86:[2,75]},{8:[2,76],10:[2,76],16:[2,76],32:[2,76],34:[2,76],35:[2,76],37:[2,76],39:[2,76],41:[2,76],42:[2,76],43:[2,76],45:[2,76],46:[2,76],47:[2,76],48:[2,76],50:[2,76],51:[2,76],53:[2,76],54:[2,76],55:[2,76],57:[2,76],64:[2,76],65:[2,76],66:[2,76],83:[2,76],86:[2,76]},{8:[2,41],10:[2,41],16:[2,41],32:[2,41],34:[2,41],35:[2,41],37:[2,41],39:[2,41],41:[2,41],42:[2,41],43:[2,41],45:[2,41],46:[2,41],47:[2,41],48:[2,41],50:[2,41],51:[2,41],53:[1,105],54:[1,106],55:[1,107],57:[2,41],64:[2,41],65:[2,41],66:[2,41],83:[2,41],86:[2,41]},{8:[2,44],10:[2,44],16:[2,44],32:[2,44],34:[2,44],35:[2,44],37:[2,44],39:[2,44],41:[2,44],42:[2,44],43:[2,44],45:[2,44],46:[2,44],47:[2,44],48:[2,44],50:[2,44],51:[2,44],53:[2,44],54:[2,44],55:[2,44],57:[2,44],64:[2,44],65:[2,44],66:[2,44],83:[2,44],86:[2,44]},{8:[2,50],10:[2,50],16:[2,50],32:[2,50],34:[2,50],35:[2,50],37:[2,50],39:[2,50],41:[2,50],42:[2,50],43:[2,50],45:[2,50],46:[2,50],47:[2,50],48:[2,50],50:[2,50],51:[2,50],53:[2,50],54:[2,50],55:[2,50],57:[2,50],64:[2,50],65:[2,50],66:[2,50],83:[2,50],86:[2,50]},{8:[1,37],20:[1,33],31:109,50:[1,59],51:[1,60],52:108,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{8:[1,37],20:[1,33],31:109,50:[1,59],51:[1,60],52:110,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{8:[1,37],20:[1,33],31:109,50:[1,59],51:[1,60],52:111,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{6:6,7:[1,13],8:[1,37],9:20,11:4,13:7,14:[1,14],15:[1,15],16:[1,21],17:[1,16],18:8,19:[1,17],20:[1,33],21:[1,18],22:9,23:[1,19],24:11,25:5,26:[1,12],27:[1,112],28:10,29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{8:[1,37],9:113,20:[1,33],29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{8:[1,37],9:114,20:[1,33],29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{8:[1,37],9:115,20:[1,33],29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{14:[1,116]},{5:[2,7],7:[2,7],8:[2,7],12:[2,7],14:[2,7],15:[2,7],16:[2,7],17:[2,7],19:[2,7],20:[2,7],21:[2,7],23:[2,7],26:[2,7],27:[2,7],50:[2,7],51:[2,7],58:[2,7],65:[2,7],74:[2,7],75:[2,7],76:[2,7],77:[2,7],78:[2,7],79:[2,7],80:[2,7],82:[2,7],91:[2,7],93:[2,7]},{5:[2,8],7:[2,8],8:[2,8],12:[2,8],14:[2,8],15:[2,8],16:[2,8],17:[2,8],19:[2,8],20:[2,8],21:[2,8],23:[2,8],26:[2,8],27:[2,8],50:[2,8],51:[2,8],58:[2,8],65:[2,8],74:[2,8],75:[2,8],76:[2,8],77:[2,8],78:[2,8],79:[2,8],80:[2,8],82:[2,8],91:[2,8],93:[2,8]},{5:[2,9],7:[2,9],8:[2,9],12:[2,9],14:[2,9],15:[2,9],16:[2,9],17:[2,9],19:[2,9],20:[2,9],21:[2,9],23:[2,9],26:[2,9],27:[2,9],50:[2,9],51:[2,9],58:[2,9],65:[2,9],74:[2,9],75:[2,9],76:[2,9],77:[2,9],78:[2,9],79:[2,9],80:[2,9],82:[2,9],91:[2,9],93:[2,9]},{16:[1,117]},{5:[2,22],7:[2,22],8:[2,22],12:[2,22],14:[2,22],15:[2,22],16:[2,22],17:[2,22],19:[2,22],20:[2,22],21:[2,22],23:[2,22],26:[2,22],27:[2,22],50:[2,22],51:[2,22],58:[2,22],65:[2,22],74:[2,22],75:[2,22],76:[2,22],77:[2,22],78:[2,22],79:[2,22],80:[2,22],82:[2,22],91:[2,22],93:[2,22]},{8:[1,37],20:[1,33],29:118,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{8:[1,37],20:[1,33],31:109,50:[1,59],51:[1,60],52:119,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{8:[1,37],20:[1,33],29:120,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{8:[1,37],20:[1,33],31:109,36:121,38:32,40:40,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{20:[1,122]},{8:[1,37],9:123,20:[1,33],29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{8:[2,87],10:[2,87],16:[2,87],20:[1,126],32:[2,87],34:[2,87],35:[2,87],37:[2,87],39:[2,87],41:[2,87],42:[2,87],43:[2,87],45:[2,87],46:[2,87],47:[2,87],48:[2,87],50:[2,87],51:[2,87],53:[2,87],54:[2,87],55:[2,87],57:[2,87],64:[2,87],65:[2,87],66:[2,87],68:127,82:[1,45],83:[2,87],86:[2,87],89:124,90:125},{8:[1,37],10:[1,128],20:[1,33],29:102,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],81:129,82:[1,45],91:[1,38],93:[1,39]},{8:[2,89],10:[2,89],16:[2,89],32:[2,89],34:[2,89],35:[2,89],37:[2,89],39:[2,89],41:[2,89],42:[2,89],43:[2,89],45:[2,89],46:[2,89],47:[2,89],48:[2,89],50:[2,89],51:[2,89],53:[2,89],54:[2,89],55:[2,89],57:[2,89],64:[2,89],65:[2,89],66:[2,89],83:[2,89],86:[2,89]},{8:[1,37],9:130,20:[1,33],29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{20:[1,131]},{8:[1,37],20:[1,33],31:109,38:132,40:40,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{8:[1,37],20:[1,33],31:109,40:133,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{8:[1,37],20:[1,33],31:109,40:134,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{8:[1,37],20:[1,33],31:109,40:135,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{10:[1,136]},{10:[1,137],20:[1,139],92:138},{10:[1,140],20:[1,139],92:141},{8:[1,37],20:[1,33],31:109,44:142,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{8:[1,37],20:[1,33],31:109,44:143,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{8:[1,37],20:[1,33],31:109,44:144,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{8:[1,37],20:[1,33],31:109,44:145,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{8:[2,79],10:[2,79],16:[2,79],32:[2,79],34:[2,79],35:[2,79],37:[2,79],39:[2,79],41:[2,79],42:[2,79],43:[2,79],45:[2,79],46:[2,79],47:[2,79],48:[2,79],50:[2,79],51:[2,79],53:[2,79],54:[2,79],55:[2,79],57:[2,79],64:[2,79],65:[2,79],66:[2,79],83:[2,79],86:[2,79]},{83:[1,146],86:[1,147]},{83:[2,81],86:[2,81]},{35:[1,148]},{35:[2,84]},{35:[2,85]},{35:[2,86]},{8:[2,77],10:[2,77],16:[2,77],32:[2,77],34:[2,77],35:[2,77],37:[2,77],39:[2,77],41:[2,77],42:[2,77],43:[2,77],45:[2,77],46:[2,77],47:[2,77],48:[2,77],50:[2,77],51:[2,77],53:[2,77],54:[2,77],55:[2,77],57:[2,77],64:[2,77],65:[2,77],66:[2,77],83:[2,77],86:[2,77]},{66:[1,149],86:[1,150]},{10:[2,98],66:[2,98],86:[2,98]},{8:[1,37],20:[1,33],31:109,49:151,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{8:[1,37],20:[1,33],31:109,49:152,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{8:[1,37],20:[1,33],31:109,50:[1,59],51:[1,60],52:153,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{8:[1,37],20:[1,33],31:109,50:[1,59],51:[1,60],52:154,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{8:[1,37],20:[1,33],31:109,50:[1,59],51:[1,60],52:155,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{8:[2,51],10:[2,51],16:[2,51],32:[2,51],34:[2,51],35:[2,51],37:[2,51],39:[2,51],41:[2,51],42:[2,51],43:[2,51],45:[2,51],46:[2,51],47:[2,51],48:[2,51],50:[2,51],51:[2,51],53:[2,51],54:[2,51],55:[2,51],57:[2,51],64:[2,51],65:[2,51],66:[2,51],83:[2,51],86:[2,51]},{8:[2,48],10:[2,48],16:[2,48],32:[2,48],34:[2,48],35:[2,48],37:[2,48],39:[2,48],41:[2,48],42:[2,48],43:[2,48],45:[2,48],46:[2,48],47:[2,48],48:[2,48],50:[2,48],51:[2,48],53:[2,48],54:[2,48],55:[2,48],57:[1,72],64:[2,48],65:[2,48],66:[2,48],83:[2,48],86:[2,48]},{8:[2,52],10:[2,52],16:[2,52],32:[2,52],34:[2,52],35:[2,52],37:[2,52],39:[2,52],41:[2,52],42:[2,52],43:[2,52],45:[2,52],46:[2,52],47:[2,52],48:[2,52],50:[2,52],51:[2,52],53:[2,52],54:[2,52],55:[2,52],57:[2,52],64:[2,52],65:[2,52],66:[2,52],83:[2,52],86:[2,52]},{8:[2,53],10:[2,53],16:[2,53],32:[2,53],34:[2,53],35:[2,53],37:[2,53],39:[2,53],41:[2,53],42:[2,53],43:[2,53],45:[2,53],46:[2,53],47:[2,53],48:[2,53],50:[2,53],51:[2,53],53:[2,53],54:[2,53],55:[2,53],57:[2,53],64:[2,53],65:[2,53],66:[2,53],83:[2,53],86:[2,53]},{5:[2,12],7:[2,12],8:[2,12],10:[2,12],12:[2,12],14:[2,12],15:[2,12],16:[2,12],17:[2,12],19:[2,12],20:[2,12],21:[2,12],23:[2,12],26:[2,12],27:[2,12],32:[2,12],34:[2,12],35:[2,12],37:[2,12],39:[2,12],41:[2,12],42:[2,12],43:[2,12],45:[2,12],46:[2,12],47:[2,12],48:[2,12],50:[2,12],51:[2,12],53:[2,12],54:[2,12],55:[2,12],57:[2,12],58:[2,12],64:[2,12],65:[2,12],66:[2,12],74:[2,12],75:[2,12],76:[2,12],77:[2,12],78:[2,12],79:[2,12],80:[2,12],82:[2,12],83:[2,12],86:[2,12],91:[2,12],93:[2,12]},{10:[1,156]},{10:[1,157]},{16:[1,158]},{8:[1,159]},{5:[2,10],7:[2,10],8:[2,10],12:[2,10],14:[2,10],15:[2,10],16:[2,10],17:[2,10],19:[2,10],20:[2,10],21:[2,10],23:[2,10],26:[2,10],27:[2,10],50:[2,10],51:[2,10],58:[2,10],65:[2,10],74:[2,10],75:[2,10],76:[2,10],77:[2,10],78:[2,10],79:[2,10],80:[2,10],82:[2,10],91:[2,10],93:[2,10]},{8:[2,25],10:[2,25],16:[2,25],32:[2,25],34:[2,25],35:[2,25],37:[2,25],39:[2,25],41:[2,25],42:[2,25],43:[2,25],45:[2,25],46:[2,25],47:[2,25],48:[2,25],50:[2,25],51:[2,25],53:[2,25],54:[2,25],55:[2,25],57:[2,25],64:[2,25],65:[2,25],66:[2,25],83:[2,25],86:[2,25]},{8:[2,49],10:[2,49],16:[2,49],32:[2,49],34:[2,49],35:[2,49],37:[2,49],39:[2,49],41:[2,49],42:[2,49],43:[2,49],45:[2,49],46:[2,49],47:[2,49],48:[2,49],50:[2,49],51:[2,49],53:[2,49],54:[2,49],55:[2,49],57:[2,49],64:[2,49],65:[2,49],66:[2,49],83:[2,49],86:[2,49]},{35:[1,160]},{8:[2,29],10:[2,29],16:[2,29],32:[2,29],34:[2,29],35:[2,29],37:[2,29],39:[1,82],41:[2,29],42:[2,29],43:[2,29],45:[2,29],46:[2,29],47:[2,29],48:[2,29],50:[2,29],51:[2,29],53:[2,29],54:[2,29],55:[2,29],57:[2,29],64:[2,29],65:[2,29],66:[2,29],83:[2,29],86:[2,29]},{8:[2,59],10:[2,59],16:[2,59],32:[2,59],34:[2,59],35:[2,59],37:[2,59],39:[2,59],41:[2,59],42:[2,59],43:[2,59],45:[2,59],46:[2,59],47:[2,59],48:[2,59],50:[2,59],51:[2,59],53:[2,59],54:[2,59],55:[2,59],57:[2,59],64:[2,59],65:[2,59],66:[2,59],83:[2,59],86:[2,59]},{66:[1,161]},{8:[2,88],10:[2,88],16:[2,88],32:[2,88],34:[2,88],35:[2,88],37:[2,88],39:[2,88],41:[2,88],42:[2,88],43:[2,88],45:[2,88],46:[2,88],47:[2,88],48:[2,88],50:[2,88],51:[2,88],53:[2,88],54:[2,88],55:[2,88],57:[2,88],64:[2,88],65:[2,88],66:[2,88],83:[2,88],86:[1,162]},{8:[2,94],10:[2,94],16:[2,94],32:[2,94],34:[2,94],35:[2,94],37:[2,94],39:[2,94],41:[2,94],42:[2,94],43:[2,94],45:[2,94],46:[2,94],47:[2,94],48:[2,94],50:[2,94],51:[2,94],53:[2,94],54:[2,94],55:[2,94],57:[2,94],64:[2,94],65:[2,94],66:[2,94],83:[2,94],86:[2,94]},{8:[2,96],10:[2,96],16:[2,96],32:[2,96],34:[2,96],35:[2,96],37:[2,96],39:[2,96],41:[2,96],42:[2,96],43:[2,96],45:[2,96],46:[2,96],47:[2,96],48:[2,96],50:[2,96],51:[2,96],53:[2,96],54:[2,96],55:[2,96],57:[2,96],64:[2,96],65:[2,96],66:[2,96],83:[2,96],86:[2,96]},{8:[2,97],10:[2,97],16:[2,97],32:[2,97],34:[2,97],35:[2,97],37:[2,97],39:[2,97],41:[2,97],42:[2,97],43:[2,97],45:[2,97],46:[2,97],47:[2,97],48:[2,97],50:[2,97],51:[2,97],53:[2,97],54:[2,97],55:[2,97],57:[2,97],64:[2,97],65:[2,97],66:[2,97],83:[2,97],86:[2,97]},{8:[2,92],10:[2,92],16:[2,92],20:[2,92],32:[2,92],34:[2,92],35:[2,92],37:[2,92],39:[2,92],41:[2,92],42:[2,92],43:[2,92],45:[2,92],46:[2,92],47:[2,92],48:[2,92],50:[2,92],51:[2,92],53:[2,92],54:[2,92],55:[2,92],57:[2,92],64:[2,92],65:[2,92],66:[2,92],82:[2,92],83:[2,92],86:[2,92]},{10:[1,163],86:[1,150]},{66:[1,164]},{8:[2,91],10:[2,91],16:[2,91],32:[2,91],34:[2,91],35:[2,91],37:[2,91],39:[2,91],41:[2,91],42:[2,91],43:[2,91],45:[2,91],46:[2,91],47:[2,91],48:[2,91],50:[2,91],51:[2,91],53:[2,91],54:[2,91],55:[2,91],57:[2,91],64:[2,91],65:[2,91],66:[2,91],83:[2,91],86:[2,91]},{8:[2,31],10:[2,31],16:[2,31],32:[2,31],34:[2,31],35:[2,31],37:[2,31],39:[2,31],41:[1,83],42:[1,84],43:[1,85],45:[2,31],46:[2,31],47:[2,31],48:[2,31],50:[2,31],51:[2,31],53:[2,31],54:[2,31],55:[2,31],57:[2,31],64:[2,31],65:[2,31],66:[2,31],83:[2,31],86:[2,31]},{8:[2,33],10:[2,33],16:[2,33],32:[2,33],34:[2,33],35:[2,33],37:[2,33],39:[2,33],41:[2,33],42:[2,33],43:[2,33],45:[1,89],46:[1,90],47:[1,91],48:[1,92],50:[2,33],51:[2,33],53:[2,33],54:[2,33],55:[2,33],57:[2,33],64:[2,33],65:[2,33],66:[2,33],83:[2,33],86:[2,33]},{8:[2,34],10:[2,34],16:[2,34],32:[2,34],34:[2,34],35:[2,34],37:[2,34],39:[2,34],41:[2,34],42:[2,34],43:[2,34],45:[1,89],46:[1,90],47:[1,91],48:[1,92],50:[2,34],51:[2,34],53:[2,34],54:[2,34],55:[2,34],57:[2,34],64:[2,34],65:[2,34],66:[2,34],83:[2,34],86:[2,34]},{8:[2,35],10:[2,35],16:[2,35],32:[2,35],34:[2,35],35:[2,35],37:[2,35],39:[2,35],41:[2,35],42:[2,35],43:[2,35],45:[1,89],46:[1,90],47:[1,91],48:[1,92],50:[2,35],51:[2,35],53:[2,35],54:[2,35],55:[2,35],57:[2,35],64:[2,35],65:[2,35],66:[2,35],83:[2,35],86:[2,35]},{8:[2,65],10:[2,65],16:[2,65],32:[2,65],34:[2,65],35:[2,65],37:[2,65],39:[2,65],41:[2,65],42:[2,65],43:[2,65],45:[2,65],46:[2,65],47:[2,65],48:[2,65],50:[2,65],51:[2,65],53:[2,65],54:[2,65],55:[2,65],57:[2,65],64:[2,65],65:[2,65],66:[2,65],83:[2,65],86:[2,65]},{25:165,26:[1,12]},{10:[1,166],86:[1,167]},{10:[2,104],86:[2,104]},{94:[1,168]},{10:[1,169],86:[1,167]},{8:[2,37],10:[2,37],16:[2,37],32:[2,37],34:[2,37],35:[2,37],37:[2,37],39:[2,37],41:[2,37],42:[2,37],43:[2,37],45:[2,37],46:[2,37],47:[2,37],48:[2,37],50:[1,103],51:[1,104],53:[2,37],54:[2,37],55:[2,37],57:[2,37],64:[2,37],65:[2,37],66:[2,37],83:[2,37],86:[2,37]},{8:[2,38],10:[2,38],16:[2,38],32:[2,38],34:[2,38],35:[2,38],37:[2,38],39:[2,38],41:[2,38],42:[2,38],43:[2,38],45:[2,38],46:[2,38],47:[2,38],48:[2,38],50:[1,103],51:[1,104],53:[2,38],54:[2,38],55:[2,38],57:[2,38],64:[2,38],65:[2,38],66:[2,38],83:[2,38],86:[2,38]},{8:[2,39],10:[2,39],16:[2,39],32:[2,39],34:[2,39],35:[2,39],37:[2,39],39:[2,39],41:[2,39],42:[2,39],43:[2,39],45:[2,39],46:[2,39],47:[2,39],48:[2,39],50:[1,103],51:[1,104],53:[2,39],54:[2,39],55:[2,39],57:[2,39],64:[2,39],65:[2,39],66:[2,39],83:[2,39],86:[2,39]},{8:[2,40],10:[2,40],16:[2,40],32:[2,40],34:[2,40],35:[2,40],37:[2,40],39:[2,40],41:[2,40],42:[2,40],43:[2,40],45:[2,40],46:[2,40],47:[2,40],48:[2,40],50:[1,103],51:[1,104],53:[2,40],54:[2,40],55:[2,40],57:[2,40],64:[2,40],65:[2,40],66:[2,40],83:[2,40],86:[2,40]},{8:[2,80],10:[2,80],16:[2,80],32:[2,80],34:[2,80],35:[2,80],37:[2,80],39:[2,80],41:[2,80],42:[2,80],43:[2,80],45:[2,80],46:[2,80],47:[2,80],48:[2,80],50:[2,80],51:[2,80],53:[2,80],54:[2,80],55:[2,80],57:[2,80],64:[2,80],65:[2,80],66:[2,80],83:[2,80],86:[2,80]},{20:[1,97],72:98,73:99,77:[1,51],78:[1,52],79:[1,53],80:[1,54],85:170,87:96},{8:[1,37],20:[1,33],29:171,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{8:[2,78],10:[2,78],16:[2,78],32:[2,78],34:[2,78],35:[2,78],37:[2,78],39:[2,78],41:[2,78],42:[2,78],43:[2,78],45:[2,78],46:[2,78],47:[2,78],48:[2,78],50:[2,78],51:[2,78],53:[2,78],54:[2,78],55:[2,78],57:[2,78],64:[2,78],65:[2,78],66:[2,78],83:[2,78],86:[2,78]},{8:[1,37],20:[1,33],29:172,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{8:[2,42],10:[2,42],16:[2,42],32:[2,42],34:[2,42],35:[2,42],37:[2,42],39:[2,42],41:[2,42],42:[2,42],43:[2,42],45:[2,42],46:[2,42],47:[2,42],48:[2,42],50:[2,42],51:[2,42],53:[1,105],54:[1,106],55:[1,107],57:[2,42],64:[2,42],65:[2,42],66:[2,42],83:[2,42],86:[2,42]},{8:[2,43],10:[2,43],16:[2,43],32:[2,43],34:[2,43],35:[2,43],37:[2,43],39:[2,43],41:[2,43],42:[2,43],43:[2,43],45:[2,43],46:[2,43],47:[2,43],48:[2,43],50:[2,43],51:[2,43],53:[1,105],54:[1,106],55:[1,107],57:[2,43],64:[2,43],65:[2,43],66:[2,43],83:[2,43],86:[2,43]},{8:[2,45],10:[2,45],16:[2,45],32:[2,45],34:[2,45],35:[2,45],37:[2,45],39:[2,45],41:[2,45],42:[2,45],43:[2,45],45:[2,45],46:[2,45],47:[2,45],48:[2,45],50:[2,45],51:[2,45],53:[2,45],54:[2,45],55:[2,45],57:[2,45],64:[2,45],65:[2,45],66:[2,45],83:[2,45],86:[2,45]},{8:[2,46],10:[2,46],16:[2,46],32:[2,46],34:[2,46],35:[2,46],37:[2,46],39:[2,46],41:[2,46],42:[2,46],43:[2,46],45:[2,46],46:[2,46],47:[2,46],48:[2,46],50:[2,46],51:[2,46],53:[2,46],54:[2,46],55:[2,46],57:[2,46],64:[2,46],65:[2,46],66:[2,46],83:[2,46],86:[2,46]},{8:[2,47],10:[2,47],16:[2,47],32:[2,47],34:[2,47],35:[2,47],37:[2,47],39:[2,47],41:[2,47],42:[2,47],43:[2,47],45:[2,47],46:[2,47],47:[2,47],48:[2,47],50:[2,47],51:[2,47],53:[2,47],54:[2,47],55:[2,47],57:[2,47],64:[2,47],65:[2,47],66:[2,47],83:[2,47],86:[2,47]},{6:6,7:[1,13],8:[1,37],9:20,11:173,13:7,14:[1,14],15:[1,15],16:[1,21],17:[1,16],18:8,19:[1,17],20:[1,33],21:[1,18],22:9,23:[1,19],24:11,25:5,26:[1,12],28:10,29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{6:6,7:[1,13],8:[1,37],9:20,11:174,13:7,14:[1,14],15:[1,15],16:[1,21],17:[1,16],18:8,19:[1,17],20:[1,33],21:[1,18],22:9,23:[1,19],24:11,25:5,26:[1,12],28:10,29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{8:[1,37],9:175,20:[1,33],29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{8:[1,37],9:176,20:[1,33],29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{8:[1,37],20:[1,33],29:177,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{8:[2,60],10:[2,60],16:[2,60],32:[2,60],34:[2,60],35:[2,60],37:[2,60],39:[2,60],41:[2,60],42:[2,60],43:[2,60],45:[2,60],46:[2,60],47:[2,60],48:[2,60],50:[2,60],51:[2,60],53:[2,60],54:[2,60],55:[2,60],57:[2,60],64:[2,60],65:[2,60],66:[2,60],83:[2,60],86:[2,60]},{20:[1,126],68:127,82:[1,45],90:178},{8:[2,93],10:[2,93],16:[2,93],20:[2,93],32:[2,93],34:[2,93],35:[2,93],37:[2,93],39:[2,93],41:[2,93],42:[2,93],43:[2,93],45:[2,93],46:[2,93],47:[2,93],48:[2,93],50:[2,93],51:[2,93],53:[2,93],54:[2,93],55:[2,93],57:[2,93],64:[2,93],65:[2,93],66:[2,93],82:[2,93],83:[2,93],86:[2,93]},{8:[2,90],10:[2,90],16:[2,90],32:[2,90],34:[2,90],35:[2,90],37:[2,90],39:[2,90],41:[2,90],42:[2,90],43:[2,90],45:[2,90],46:[2,90],47:[2,90],48:[2,90],50:[2,90],51:[2,90],53:[2,90],54:[2,90],55:[2,90],57:[2,90],64:[2,90],65:[2,90],66:[2,90],83:[2,90],86:[2,90]},{8:[2,100],10:[2,100],16:[2,100],32:[2,100],34:[2,100],35:[2,100],37:[2,100],39:[2,100],41:[2,100],42:[2,100],43:[2,100],45:[2,100],46:[2,100],47:[2,100],48:[2,100],50:[2,100],51:[2,100],53:[2,100],54:[2,100],55:[2,100],57:[2,100],64:[2,100],65:[2,100],66:[2,100],83:[2,100],86:[2,100]},{25:179,26:[1,12]},{20:[1,180]},{8:[1,37],9:181,20:[1,33],29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{94:[1,182]},{83:[2,82],86:[2,82]},{83:[2,83],86:[2,83]},{10:[2,99],66:[2,99],86:[2,99]},{5:[2,2],7:[2,2],8:[2,2],12:[1,183],14:[2,2],15:[2,2],16:[2,2],17:[2,2],19:[2,2],20:[2,2],21:[2,2],23:[2,2],26:[2,2],27:[2,2],50:[2,2],51:[2,2],58:[2,2],65:[2,2],74:[2,2],75:[2,2],76:[2,2],77:[2,2],78:[2,2],79:[2,2],80:[2,2],82:[2,2],91:[2,2],93:[2,2]},{5:[2,4],7:[2,4],8:[2,4],12:[2,4],14:[2,4],15:[2,4],16:[2,4],17:[2,4],19:[2,4],20:[2,4],21:[2,4],23:[2,4],26:[2,4],27:[2,4],50:[2,4],51:[2,4],58:[2,4],65:[2,4],74:[2,4],75:[2,4],76:[2,4],77:[2,4],78:[2,4],79:[2,4],80:[2,4],82:[2,4],91:[2,4],93:[2,4]},{16:[1,184]},{10:[1,185]},{8:[2,27],10:[2,27],16:[2,27],32:[2,27],34:[2,27],35:[2,27],37:[2,27],39:[2,27],41:[2,27],42:[2,27],43:[2,27],45:[2,27],46:[2,27],47:[2,27],48:[2,27],50:[2,27],51:[2,27],53:[2,27],54:[2,27],55:[2,27],57:[2,27],64:[2,27],65:[2,27],66:[2,27],83:[2,27],86:[2,27]},{8:[2,95],10:[2,95],16:[2,95],32:[2,95],34:[2,95],35:[2,95],37:[2,95],39:[2,95],41:[2,95],42:[2,95],43:[2,95],45:[2,95],46:[2,95],47:[2,95],48:[2,95],50:[2,95],51:[2,95],53:[2,95],54:[2,95],55:[2,95],57:[2,95],64:[2,95],65:[2,95],66:[2,95],83:[2,95],86:[2,95]},{8:[2,101],10:[2,101],16:[2,101],32:[2,101],34:[2,101],35:[2,101],37:[2,101],39:[2,101],41:[2,101],42:[2,101],43:[2,101],45:[2,101],46:[2,101],47:[2,101],48:[2,101],50:[2,101],51:[2,101],53:[2,101],54:[2,101],55:[2,101],57:[2,101],64:[2,101],65:[2,101],66:[2,101],83:[2,101],86:[2,101]},{10:[2,105],86:[2,105]},{8:[2,102],10:[2,102],16:[2,102],32:[2,102],34:[2,102],35:[2,102],37:[2,102],39:[2,102],41:[2,102],42:[2,102],43:[2,102],45:[2,102],46:[2,102],47:[2,102],48:[2,102],50:[2,102],51:[2,102],53:[2,102],54:[2,102],55:[2,102],57:[2,102],64:[2,102],65:[2,102],66:[2,102],83:[2,102],86:[2,102]},{8:[1,37],9:186,20:[1,33],29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{6:6,7:[1,13],8:[1,37],9:20,11:187,13:7,14:[1,14],15:[1,15],16:[1,21],17:[1,16],18:8,19:[1,17],20:[1,33],21:[1,18],22:9,23:[1,19],24:11,25:5,26:[1,12],28:10,29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{8:[1,37],9:188,20:[1,33],29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{16:[1,189]},{8:[2,103],10:[2,103],16:[2,103],32:[2,103],34:[2,103],35:[2,103],37:[2,103],39:[2,103],41:[2,103],42:[2,103],43:[2,103],45:[2,103],46:[2,103],47:[2,103],48:[2,103],50:[2,103],51:[2,103],53:[2,103],54:[2,103],55:[2,103],57:[2,103],64:[2,103],65:[2,103],66:[2,103],83:[2,103],86:[2,103]},{5:[2,3],7:[2,3],8:[2,3],12:[2,3],14:[2,3],15:[2,3],16:[2,3],17:[2,3],19:[2,3],20:[2,3],21:[2,3],23:[2,3],26:[2,3],27:[2,3],50:[2,3],51:[2,3],58:[2,3],65:[2,3],74:[2,3],75:[2,3],76:[2,3],77:[2,3],78:[2,3],79:[2,3],80:[2,3],82:[2,3],91:[2,3],93:[2,3]},{10:[1,190]},{5:[2,6],7:[2,6],8:[2,6],12:[2,6],14:[2,6],15:[2,6],16:[2,6],17:[2,6],19:[2,6],20:[2,6],21:[2,6],23:[2,6],26:[2,6],27:[2,6],50:[2,6],51:[2,6],58:[2,6],65:[2,6],74:[2,6],75:[2,6],76:[2,6],77:[2,6],78:[2,6],79:[2,6],80:[2,6],82:[2,6],91:[2,6],93:[2,6]},{6:6,7:[1,13],8:[1,37],9:20,11:191,13:7,14:[1,14],15:[1,15],16:[1,21],17:[1,16],18:8,19:[1,17],20:[1,33],21:[1,18],22:9,23:[1,19],24:11,25:5,26:[1,12],28:10,29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:[1,59],51:[1,60],52:56,56:57,58:[1,58],59:26,60:27,61:29,62:30,63:31,65:[1,46],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:[1,48],75:[1,49],76:[1,50],77:[1,51],78:[1,52],79:[1,53],80:[1,54],82:[1,45],91:[1,38],93:[1,39]},{5:[2,5],7:[2,5],8:[2,5],12:[2,5],14:[2,5],15:[2,5],16:[2,5],17:[2,5],19:[2,5],20:[2,5],21:[2,5],23:[2,5],26:[2,5],27:[2,5],50:[2,5],51:[2,5],58:[2,5],65:[2,5],74:[2,5],75:[2,5],76:[2,5],77:[2,5],78:[2,5],79:[2,5],80:[2,5],82:[2,5],91:[2,5],93:[2,5]}],
defaultActions: {3:[2,1],97:[2,84],98:[2,85],99:[2,86]},
parseError: function parseError (str, hash) {
    throw new Error(str);
},
/**
 * @class
 * @ignore
 */
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = "", yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    this.yy.parser = this;
    if (typeof this.lexer.yylloc == "undefined")
        this.lexer.yylloc = {};
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
    var ranges = this.lexer.options && this.lexer.options.ranges;
    if (typeof this.yy.parseError === "function")
        this.parseError = this.yy.parseError;
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    function lex() {
        var token;
        token = self.lexer.lex() || 1;
        if (typeof token !== "number") {
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
            if (symbol === null || typeof symbol == "undefined") {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
        if (typeof action === "undefined" || !action.length || !action[0]) {
            var errStr = "";
            if (!recovering) {
                expected = [];
                for (p in table[state])
                    if (this.terminals_[p] && p > 2) {
                        expected.push("'" + this.terminals_[p] + "'");
                    }
                if (this.lexer.showPosition) {
                    errStr = "Parse error on line " + (yylineno + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + (this.terminals_[symbol] || symbol) + "'";
                } else {
                    errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == 1?"end of input":"'" + (this.terminals_[symbol] || symbol) + "'");
                }
                this.parseError(errStr, {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
            }
        }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
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
                if (recovering > 0)
                    recovering--;
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {first_line: lstack[lstack.length - (len || 1)].first_line, last_line: lstack[lstack.length - 1].last_line, first_column: lstack[lstack.length - (len || 1)].first_column, last_column: lstack[lstack.length - 1].last_column};
            if (ranges) {
                yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
            }
            r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
            if (typeof r !== "undefined") {
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
}
};


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
            n.eline = pos[2];
            n.ecol = pos[3];

            return n;
        }
    };

    var lc = function (lc1) {
        return [lc1.first_line, lc1.first_column, lc1.last_line, lc1.last_column];
    };

/* Jison generated lexer */
var lexer = (function(){
var lexer = ({EOF:1,
parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },
setInput:function (input) {
        this._input = input;
        this._more = this._less = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {first_line:1,first_column:0,last_line:1,last_column:0};
        if (this.options.ranges) this.yylloc.range = [0,0];
        this.offset = 0;
        return this;
    },
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
        if (this.options.ranges) this.yylloc.range[1]++;

        this._input = this._input.slice(1);
        return ch;
    },
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length-len-1);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length-1);
        this.matched = this.matched.substr(0, this.matched.length-1);

        if (lines.length-1) this.yylineno -= lines.length-1;
        var r = this.yylloc.range;

        this.yylloc = {first_line: this.yylloc.first_line,
          last_line: this.yylineno+1,
          first_column: this.yylloc.first_column,
          last_column: lines ?
              (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length:
              this.yylloc.first_column - len
          };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        return this;
    },
more:function () {
        this._more = true;
        return this;
    },
less:function (n) {
        this.unput(this.match.slice(n));
    },
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20)+(next.length > 20 ? '...':'')).replace(/\n/g, "");
    },
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c+"^";
    },
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) this.done = true;

        var token,
            match,
            tempMatch,
            index,
            col,
            lines;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i=0;i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (!this.options.flex) break;
            }
        }
        if (match) {
            lines = match[0].match(/(?:\r\n?|\n).*/g);
            if (lines) this.yylineno += lines.length;
            this.yylloc = {first_line: this.yylloc.last_line,
                           last_line: this.yylineno+1,
                           first_column: this.yylloc.last_column,
                           last_column: lines ? lines[lines.length-1].length-lines[lines.length-1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length};
            this.yytext += match[0];
            this.match += match[0];
            this.matches = match;
            this.yyleng = this.yytext.length;
            if (this.options.ranges) {
                this.yylloc.range = [this.offset, this.offset += this.yyleng];
            }
            this._more = false;
            this._input = this._input.slice(match[0].length);
            this.matched += match[0];
            token = this.performAction.call(this, this.yy, this, rules[index],this.conditionStack[this.conditionStack.length-1]);
            if (this.done && this._input) this.done = false;
            if (token) return token;
            else return;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line '+(this.yylineno+1)+'. Unrecognized text.\n'+this.showPosition(),
                    {text: "", token: null, line: this.yylineno});
        }
    },
lex:function lex () {
        var r = this.next();
        if (typeof r !== 'undefined') {
            return r;
        } else {
            return this.lex();
        }
    },
begin:function begin (condition) {
        this.conditionStack.push(condition);
    },
popState:function popState () {
        return this.conditionStack.pop();
    },
_currentRules:function _currentRules () {
        return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules;
    },
topState:function () {
        return this.conditionStack[this.conditionStack.length-2];
    },
pushState:function begin (condition) {
        this.begin(condition);
    }});
lexer.options = {};
lexer.performAction = function anonymous(yy,yy_,$avoiding_name_collisions,YY_START
) {

var YYSTATE=YY_START
switch($avoiding_name_collisions) {
case 0:/* ignore */
break;
case 1:return 78  /* New 123.1234e+-12 */
break;
case 2:return 78  /* Old 123.1234 or .1234 */
break;
case 3:return 78  /* Old 123 */
break;
case 4: return 77;
break;
case 5: return 77;
break;
case 6:/* ignore comment */
break;
case 7:/* ignore multiline comment */
break;
case 8:return 7
break;
case 9:return 12
break;
case 10:return 14
break;
case 11:return 17
break;
case 12:return 15
break;
case 13:return 91
break;
case 14:return 93
break;
case 15:return 19
break;
case 16:return 23
break;
case 17:return 21
break;
case 18:return 75
break;
case 19:return 76
break;
case 20:return 74
break;
case 21:return 80
break;
case 22:return 94
break;
case 23:return 94
break;
case 24:return 82
break;
case 25:return 83
break;
case 26:return 26
break;
case 27:return 27
break;
case 28:return 16
break;
case 29:return '#'
break;
case 30:return 34
break;
case 31:return 35
break;
case 32:return 79
break;
case 33:return 64
break;
case 34:return 65
break;
case 35:return 66
break;
case 36:return 8
break;
case 37:return 10
break;
case 38:return 58
break;
case 39:return 57
break;
case 40:return 57
break;
case 41:return 53
break;
case 42:return 54
break;
case 43:return 55
break;
case 44:return 50
break;
case 45:return 51
break;
case 46:return 47
break;
case 47:return 45
break;
case 48:return 48
break;
case 49:return 46
break;
case 50:return 41
break;
case 51:return 43
break;
case 52:return 42
break;
case 53:return 39
break;
case 54:return 37
break;
case 55:return 32
break;
case 56:return 86
break;
case 57:return 5
break;
case 58:return 20
break;
case 59:return 'INVALID'
break;
}
};
lexer.rules = [/^(?:\s+)/,/^(?:[0-9]*\.?[0-9]+([eE][-+]?[0-9]+))/,/^(?:[0-9]+\.[0-9]*|[0-9]*\.[0-9]+\b)/,/^(?:[0-9]+)/,/^(?:"(\\["]|[^"])*")/,/^(?:'(\\[']|[^'])*')/,/^(?:\/\/.*)/,/^(?:\/\*(.|\n|\r)*?\*\/)/,/^(?:if\b)/,/^(?:else\b)/,/^(?:while\b)/,/^(?:do\b)/,/^(?:for\b)/,/^(?:function\b)/,/^(?:map\b)/,/^(?:use\b)/,/^(?:return\b)/,/^(?:delete\b)/,/^(?:true\b)/,/^(?:false\b)/,/^(?:null\b)/,/^(?:Infinity\b)/,/^(?:->)/,/^(?:=>)/,/^(?:<<)/,/^(?:>>)/,/^(?:\{)/,/^(?:\})/,/^(?:;)/,/^(?:#)/,/^(?:\?)/,/^(?::)/,/^(?:NaN\b)/,/^(?:\.)/,/^(?:\[)/,/^(?:\])/,/^(?:\()/,/^(?:\))/,/^(?:!)/,/^(?:\^)/,/^(?:\*\*)/,/^(?:\*)/,/^(?:\/)/,/^(?:%)/,/^(?:\+)/,/^(?:-)/,/^(?:<=)/,/^(?:<)/,/^(?:>=)/,/^(?:>)/,/^(?:==)/,/^(?:~=)/,/^(?:!=)/,/^(?:&&)/,/^(?:\|\|)/,/^(?:=)/,/^(?:,)/,/^(?:$)/,/^(?:[A-Za-z_\$][A-Za-z0-9_]*)/,/^(?:.)/];
lexer.conditions = {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59],"inclusive":true}};
return lexer;})()
parser.lexer = lexer;
/**
 * @class
 * @ignore
 */
function Parser () { this.yy = {}; }Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();
// Work around an issue with browsers that don't support Object.getPrototypeOf()
parser.yy.parseError = parser.parseError;

export default JXG.JessieCode;
