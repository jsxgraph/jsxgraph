/*
 JessieCode Interpreter and Compiler

    Copyright 2011-2023
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
        this.scope = s !== null ? s : this.scope;

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
                            attr.name = (that.lhs[that.scope.id] !== 0 ? that.lhs[that.scope.id] : '');
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
     * @param {Boolean} [geonext=false] Geonext compatibility mode.
     * @param {Boolean} [dontstore=false] If false, the code string is stored in this.code,
     *  i.e. in the JessieCode object, e.g. in board.jc.
     * @return {Object} Returns result of computation as directed in cmd.
     */
    _genericParse: function (code, cmd, geonext, dontstore) {
        var i, setTextBackup, ast, result,
            ccode = code.replace(/\r\n/g, '\n').split('\n'),
            options = {},
            cleaned = [];

        if (!dontstore) {
            this.code += code + '\n';
        }

        if (Text) {
            setTextBackup = Text.prototype.setText;
            Text.prototype.setText = Text.prototype.setTextJessieCode;
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
        return this._genericParse(code, 'parse', geonext, dontstore);
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
        return this._genericParse(code, 'manipulate', geonext, dontstore);
    },

    /**
     * Manipulate JessieCode.
     * This consists of generating an AST with parser.parse,
     * apply simplifying rules from CAS
     * and compile the AST back to JessieCode with minimal number of parentheses.
     *
     * @param {String} code             JessieCode code to be parsed
     * @param {Boolean} [geonext=false] Geonext compatibility mode.
     * @param {Boolean} [dontstore=false] If false, the code string is stored in this.code.
     * @return {String}                 Simplified JessieCode code
     */
    simplify: function (code) {
        return this._genericParse(code, 'simplify');
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
        return this._genericParse(code, 'getAst', geonext, dontstore);
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
            this.createNode('node_var', (callValue === true ? '$value' : '$')),
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
     * @param {Object} node
     * @param {Boolean} [js=false] Compile either to JavaScript or back to JessieCode (required for the UI).
     * @returns Something
     * @private
     */
    compile: function (node, js) {
        var e, i, list, scope,
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
                    case 'op_block':
                        ret = '{\n' + this.compile(node.children[0], js) + ' }\n';
                        break;
                    case 'op_assign':
                        //e = this.compile(node.children[0], js);
                        if (js) {
                            e = this.getLHSCompiler(node.children[0], js);
                            if (Type.isArray(e)) {
                                ret = '$jc$.setProp(' + e[0] + ', ' + e[1] + ', ' + this.compile(node.children[1], js) + ');\n';
                            } else {
                                if (this.isLocalVariable(e) !== this.scope) {
                                    this.scope.locals[e] = true;
                                }
                                ret = '$jc$.scopes[' + this.scope.id + '].locals[\'' + e + '\'] = ' + this.compile(node.children[1], js) + ';\n';
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
                        //ret = ' for (' + this.compile(node.children[0], js) + '; ' + this.compile(node.children[1], js) + '; ' + this.compile(node.children[2], js) + ') {\n' + this.compile(node.children[3], js) + '\n}\n';
                        ret = ' for (' + this.compile(node.children[0], js) +               // Assignment ends with ";"
                            this.compile(node.children[1], js) + '; ' +         // Logical test comes without ";"
                            this.compile(node.children[2], js).slice(0, -2) +   // Counting comes with ";" which has to be removed
                            ') {\n' + this.compile(node.children[3], js) + '\n}\n';
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
                            list.push(this.compile(node.children[0][i], js));
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
                        if (!node.children[1].isMath && node.children[1].type !== 'node_var') {
                            this._error('compile: In a map only function calls and mathematical expressions are allowed.');
                        }

                        list = node.children[0];
                        if (js) {
                            ret = ' $jc$.makeMap(function (' + list.join(', ') + ') { return ' + this.compile(node.children[1], js) + '; })';
                        } else {
                            ret = 'map (' + list.join(', ') + ') -> ' + this.compile(node.children[1], js);
                        }

                        break;
                    case 'op_function':
                        list = node.children[0];
                        scope = this.pushScope(list);
                        if (js) {
                            ret = this.functionCodeJS(node);
                        } else {
                            ret = ' function (' + list.join(', ') + ') ' + this.compile(node.children[1], js);
                        }
                        this.popScope();
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
                                list.push(this.compile(node.children[2][i], js));
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
                            list.push(this.compile(node.children[1][i], js));
                        }
                        ret = this.compile(node.children[0], js) + '(' + list.join(', ') + (node.children[2] && js ? ', ' + e : '') + ')' + (node.children[2] && !js ? ' ' + e : '');
                        if (js) {
                            // Inserting a newline here allows simultaneously
                            // - procedural calls like Q.moveTo(...); and
                            // - function calls in expressions like log(x) + 1;
                            // Problem: procedural calls will not be ended by a semicolon.
                            ret += '\n';
                        }

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
                        this._warn('Use of the \'use\' operator is deprecated.');
                        if (js) {
                            ret = '$jc$.use(\'';
                        } else {
                            ret = 'use(\'';
                        }

                        ret += node.children[0].toString() + '\');';
                        break;
                    case 'op_delete':
                        this._warn('Use of the \'delete\' operator is deprecated. Please use the remove() function.');
                        if (js) {
                            ret = '$jc$.del(';
                        } else {
                            ret = 'remove(';
                        }

                        ret += this.compile(node.children[0], js) + ')';
                        break;
                    case 'op_eq':
                        ret = '(' + this.compile(node.children[0], js) + ' === ' + this.compile(node.children[1], js) + ')';
                        break;
                    case 'op_neq':
                        ret = '(' + this.compile(node.children[0], js) + ' !== ' + this.compile(node.children[1], js) + ')';
                        break;
                    case 'op_approx':
                        ret = '(' + this.compile(node.children[0], js) + ' ~= ' + this.compile(node.children[1], js) + ')';
                        break;
                    case 'op_gt':
                        if (js) {
                            ret = '$jc$.gt(' + this.compile(node.children[0], js) + ', ' + this.compile(node.children[1], js) + ')';
                        } else {
                            ret = '(' + this.compile(node.children[0], js) + ' > ' + this.compile(node.children[1], js) + ')';
                        }
                        break;
                    case 'op_lt':
                        if (js) {
                            ret = '$jc$.lt(' + this.compile(node.children[0], js) + ', ' + this.compile(node.children[1], js) + ')';
                        } else {
                            ret = '(' + this.compile(node.children[0], js) + ' < ' + this.compile(node.children[1], js) + ')';
                        }
                        break;
                    case 'op_geq':
                        if (js) {
                            ret = '$jc$.geq(' + this.compile(node.children[0], js) + ', ' + this.compile(node.children[1], js) + ')';
                        } else {
                            ret = '(' + this.compile(node.children[0], js) + ' >= ' + this.compile(node.children[1], js) + ')';
                        }
                        break;
                    case 'op_leq':
                        if (js) {
                            ret = '$jc$.leq(' + this.compile(node.children[0], js) + ', ' + this.compile(node.children[1], js) + ')';
                        } else {
                            ret = '(' + this.compile(node.children[0], js) + ' <= ' + this.compile(node.children[1], js) + ')';
                        }
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
                            ret = '$jc$.add(' + this.compile(node.children[0], js) + ', ' + this.compile(node.children[1], js) + ')';
                        } else {
                            ret = '(' + this.compile(node.children[0], js) + ' + ' + this.compile(node.children[1], js) + ')';
                        }
                        break;
                    case 'op_sub':
                        if (js) {
                            ret = '$jc$.sub(' + this.compile(node.children[0], js) + ', ' + this.compile(node.children[1], js) + ')';
                        } else {
                            ret = '(' + this.compile(node.children[0], js) + ' - ' + this.compile(node.children[1], js) + ')';
                        }
                        break;
                    case 'op_div':
                        if (js) {
                            ret = '$jc$.div(' + this.compile(node.children[0], js) + ', ' + this.compile(node.children[1], js) + ')';
                        } else {
                            ret = '(' + this.compile(node.children[0], js) + ' / ' + this.compile(node.children[1], js) + ')';
                        }
                        break;
                    case 'op_mod':
                        if (js) {
                            ret = '$jc$.mod(' + this.compile(node.children[0], js) + ', ' + this.compile(node.children[1], js) + ', true)';
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
                        if (js) {
                            ret = '$jc$.neg(' + this.compile(node.children[0], js) + ')';
                        } else {
                            ret = '(-' + this.compile(node.children[0], js) + ')';
                        }
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

        return ret;
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

/* parser generated by jison 0.4.18 */
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
/**
 * @class
 * @ignore
 */
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[2,14],$V1=[1,13],$V2=[1,37],$V3=[1,14],$V4=[1,15],$V5=[1,21],$V6=[1,16],$V7=[1,17],$V8=[1,33],$V9=[1,18],$Va=[1,19],$Vb=[1,12],$Vc=[1,59],$Vd=[1,60],$Ve=[1,58],$Vf=[1,46],$Vg=[1,48],$Vh=[1,49],$Vi=[1,50],$Vj=[1,51],$Vk=[1,52],$Vl=[1,53],$Vm=[1,54],$Vn=[1,45],$Vo=[1,38],$Vp=[1,39],$Vq=[5,7,8,14,15,16,17,19,20,21,23,26,27,50,51,58,65,74,75,76,77,78,79,80,82,91,93],$Vr=[5,7,8,12,14,15,16,17,19,20,21,23,26,27,50,51,58,65,74,75,76,77,78,79,80,82,91,93],$Vs=[8,10,16,32,34,35,37,39,41,42,43,45,46,47,48,50,51,53,54,55,57,64,65,66,83,86],$Vt=[2,48],$Vu=[1,72],$Vv=[10,16,32,34,35,37,39,41,42,43,45,46,47,48,50,51,53,54,55,57,66,83,86],$Vw=[1,78],$Vx=[8,10,16,32,34,35,37,41,42,43,45,46,47,48,50,51,53,54,55,57,64,65,66,83,86],$Vy=[1,82],$Vz=[8,10,16,32,34,35,37,39,45,46,47,48,50,51,53,54,55,57,64,65,66,83,86],$VA=[1,83],$VB=[1,84],$VC=[1,85],$VD=[8,10,16,32,34,35,37,39,41,42,43,50,51,53,54,55,57,64,65,66,83,86],$VE=[1,89],$VF=[1,90],$VG=[1,91],$VH=[1,92],$VI=[1,97],$VJ=[8,10,16,32,34,35,37,39,41,42,43,45,46,47,48,53,54,55,57,64,65,66,83,86],$VK=[1,103],$VL=[1,104],$VM=[8,10,16,32,34,35,37,39,41,42,43,45,46,47,48,50,51,57,64,65,66,83,86],$VN=[1,105],$VO=[1,106],$VP=[1,107],$VQ=[1,126],$VR=[1,139],$VS=[83,86],$VT=[1,150],$VU=[10,66,86],$VV=[8,10,16,20,32,34,35,37,39,41,42,43,45,46,47,48,50,51,53,54,55,57,64,65,66,82,83,86],$VW=[1,167],$VX=[10,86];
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
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:
 return $$[$0-1];
break;
case 2:
 this.$ = AST.createNode(lc(_$[$0-4]), 'node_op', 'op_if', $$[$0-2], $$[$0]);
break;
case 3:
 this.$ = AST.createNode(lc(_$[$0-6]), 'node_op', 'op_if_else', $$[$0-4], $$[$0-2], $$[$0]);
break;
case 4:
 this.$ = AST.createNode(lc(_$[$0-4]), 'node_op', 'op_while', $$[$0-2], $$[$0]);
break;
case 5:
 this.$ = AST.createNode(lc(_$[$0-8]), 'node_op', 'op_for', $$[$0-6], $$[$0-4], $$[$0-2], $$[$0]);
break;
case 6:
 this.$ = AST.createNode(lc(_$[$0-6]), 'node_op', 'op_do', $$[$0-5], $$[$0-2]);
break;
case 7:
 this.$ = AST.createNode(lc(_$[$0-1]), 'node_op', 'op_use', $$[$0]);
break;
case 8:
 this.$ = AST.createNode(lc(_$[$0-1]), 'node_op', 'op_delete', $$[$0]);
break;
case 9:
 this.$ = AST.createNode(lc(_$[$0-1]), 'node_op', 'op_return', undefined);
break;
case 10:
 this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_return', $$[$0-1]);
break;
case 11: case 14:
 this.$ = AST.createNode(lc(_$[$0]), 'node_op', 'op_none');
break;
case 12:
 this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_block', $$[$0-1]);
break;
case 13:
 this.$ = AST.createNode(lc(_$[$0-1]), 'node_op', 'op_none', $$[$0-1], $$[$0]);
break;
case 15: case 16: case 17: case 18: case 19: case 20: case 21: case 23: case 24: case 26: case 28: case 30: case 32: case 36: case 41: case 44: case 48: case 50: case 52: case 54: case 55: case 56: case 58: case 62: case 81: case 84: case 85: case 86:
 this.$ = $$[$0];
break;
case 22: case 65: case 93:
 this.$ = $$[$0-1];
break;
case 25:
 this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_assign', $$[$0-2], $$[$0]); this.$.isMath = false;
break;
case 27:
 this.$ = AST.createNode(lc(_$[$0-4]), 'node_op', 'op_conditional', $$[$0-4], $$[$0-2], $$[$0]); this.$.isMath = false;
break;
case 29:
 this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_or', $$[$0-2], $$[$0]); this.$.isMath = false;
break;
case 31:
 this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_and', $$[$0-2], $$[$0]); this.$.isMath = false;
break;
case 33:
 this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_eq', $$[$0-2], $$[$0]); this.$.isMath = false;
break;
case 34:
 this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_neq', $$[$0-2], $$[$0]); this.$.isMath = false;
break;
case 35:
 this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_approx', $$[$0-2], $$[$0]); this.$.isMath = false;
break;
case 37:
 this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_lt', $$[$0-2], $$[$0]); this.$.isMath = false;
break;
case 38:
 this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_gt', $$[$0-2], $$[$0]); this.$.isMath = false;
break;
case 39:
 this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_leq', $$[$0-2], $$[$0]); this.$.isMath = false;
break;
case 40:
 this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_geq', $$[$0-2], $$[$0]); this.$.isMath = false;
break;
case 42:
 this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_add', $$[$0-2], $$[$0]); this.$.isMath = true;
break;
case 43:
 this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_sub', $$[$0-2], $$[$0]); this.$.isMath = true;
break;
case 45:
 this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_mul', $$[$0-2], $$[$0]); this.$.isMath = true;
break;
case 46:
 this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_div', $$[$0-2], $$[$0]); this.$.isMath = true;
break;
case 47:
 this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_mod', $$[$0-2], $$[$0]); this.$.isMath = true;
break;
case 49:
 this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_exp', $$[$0-2], $$[$0]); this.$.isMath = true;
break;
case 51:
 this.$ = AST.createNode(lc(_$[$0-1]), 'node_op', 'op_not', $$[$0]); this.$.isMath = false;
break;
case 53:
 this.$ = AST.createNode(lc(_$[$0-1]), 'node_op', 'op_neg', $$[$0]); this.$.isMath = true;
break;
case 57: case 63: case 64: case 66: case 67: case 68: case 97:
 this.$ = $$[$0]; this.$.isMath = false;
break;
case 59: case 91:
 this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_property', $$[$0-2], $$[$0]); this.$.isMath = true;
break;
case 60: case 90:
 this.$ = AST.createNode(lc(_$[$0-3]), 'node_op', 'op_extvalue', $$[$0-3], $$[$0-1]); this.$.isMath = true;
break;
case 61:
 this.$ = AST.createNode(lc(_$[$0]), 'node_var', $$[$0]);
break;
case 69:
 this.$ = $$[$0]; this.$.isMath = true;
break;
case 70:
 this.$ = AST.createNode(lc(_$[$0]), 'node_const', null);
break;
case 71:
 this.$ = AST.createNode(lc(_$[$0]), 'node_const_bool', true);
break;
case 72:
 this.$ = AST.createNode(lc(_$[$0]), 'node_const_bool', false);
break;
case 73:
 this.$ = AST.createNode(lc(_$[$0]), 'node_str', $$[$0].substring(1, $$[$0].length - 1));
break;
case 74:
 this.$ = AST.createNode(lc(_$[$0]), 'node_const', parseFloat($$[$0]));
break;
case 75:
 this.$ = AST.createNode(lc(_$[$0]), 'node_const', NaN);
break;
case 76:
 this.$ = AST.createNode(lc(_$[$0]), 'node_const', Infinity);
break;
case 77:
 this.$ = AST.createNode(lc(_$[$0-1]), 'node_op', 'op_array', []);
break;
case 78:
 this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_array', $$[$0-1]);
break;
case 79:
 this.$ = AST.createNode(lc(_$[$0-1]), 'node_op', 'op_emptyobject', {}); this.$.needsAngleBrackets = true;
break;
case 80:
 this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_proplst_val', $$[$0-1]); this.$.needsAngleBrackets = true;
break;
case 82:
 this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_proplst', $$[$0-2], $$[$0]);
break;
case 83:
 this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_prop', $$[$0-2], $$[$0]);
break;
case 87: case 89:
 this.$ = AST.createNode(lc(_$[$0-1]), 'node_op', 'op_execfun', $$[$0-1], $$[$0]); this.$.isMath = true;
break;
case 88:
 this.$ = AST.createNode(lc(_$[$0-2]), 'node_op', 'op_execfun', $$[$0-2], $$[$0-1], $$[$0], true); this.$.isMath = false;
break;
case 92:
 this.$ = [];
break;
case 94: case 98: case 104:
 this.$ = [$$[$0]];
break;
case 95: case 99: case 105:
 this.$ = $$[$0-2].concat($$[$0]);
break;
case 96:
 this.$ = AST.createNode(lc(_$[$0]), 'node_var', $$[$0]); this.$.isMath = true;
break;
case 100:
 this.$ = AST.createNode(lc(_$[$0-3]), 'node_op', 'op_function', [], $$[$0]); this.$.isMath = false;
break;
case 101:
 this.$ = AST.createNode(lc(_$[$0-4]), 'node_op', 'op_function', $$[$0-2], $$[$0]); this.$.isMath = false;
break;
case 102:
 this.$ = AST.createNode(lc(_$[$0-4]), 'node_op', 'op_map', [], $$[$0]);
break;
case 103:
 this.$ = AST.createNode(lc(_$[$0-5]), 'node_op', 'op_map', $$[$0-3], $$[$0]);
break;
}
},
table: [o([5,7,8,14,15,16,17,19,20,21,23,26,50,51,58,65,74,75,76,77,78,79,80,82,91,93],$V0,{3:1,4:2}),{1:[3]},{5:[1,3],6:6,7:$V1,8:$V2,9:20,11:4,13:7,14:$V3,15:$V4,16:$V5,17:$V6,18:8,19:$V7,20:$V8,21:$V9,22:9,23:$Va,24:11,25:5,26:$Vb,28:10,29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{1:[2,1]},o($Vq,[2,13]),o($Vr,[2,15]),o($Vr,[2,16]),o($Vr,[2,17]),o($Vr,[2,18]),o($Vr,[2,19]),o($Vr,[2,20]),o($Vr,[2,21]),o([7,8,14,15,16,17,19,20,21,23,26,27,50,51,58,65,74,75,76,77,78,79,80,82,91,93],$V0,{4:61}),{8:[1,62]},{8:[1,63]},{8:[1,64]},{6:6,7:$V1,8:$V2,9:20,11:65,13:7,14:$V3,15:$V4,16:$V5,17:$V6,18:8,19:$V7,20:$V8,21:$V9,22:9,23:$Va,24:11,25:5,26:$Vb,28:10,29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{20:[1,66]},{20:[1,67]},{8:$V2,9:69,16:[1,68],20:$V8,29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{16:[1,70]},o($Vr,[2,11]),o($Vs,[2,23]),o($Vs,[2,24]),o([8,10,16,34,35,37,39,41,42,43,45,46,47,48,50,51,53,54,55,64,65,66,83,86],$Vt,{32:[1,71],57:$Vu}),o([8,10,16,32,35,39,41,42,43,45,46,47,48,50,51,53,54,55,57,64,65,66,83,86],[2,26],{34:[1,73],37:[1,74]}),o($Vv,[2,54],{88:77,8:$Vw,64:[1,75],65:[1,76]}),o($Vv,[2,55],{88:79,8:$Vw,64:[1,81],65:[1,80]}),o($Vx,[2,28],{39:$Vy}),o($Vs,[2,56]),o($Vs,[2,57]),o($Vs,[2,58]),o($Vz,[2,30],{41:$VA,42:$VB,43:$VC}),o($Vs,[2,61]),o($Vs,[2,62]),o($Vs,[2,63]),o($Vs,[2,64]),{8:$V2,9:86,20:$V8,29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{8:[1,87]},{8:[1,88]},o($VD,[2,32],{45:$VE,46:$VF,47:$VG,48:$VH}),o($Vs,[2,66]),o($Vs,[2,67]),o($Vs,[2,68]),o($Vs,[2,69]),{20:$VI,72:98,73:99,77:$Vj,78:$Vk,79:$Vl,80:$Vm,83:[1,93],84:94,85:95,87:96},{8:$V2,20:$V8,29:102,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,66:[1,100],67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,81:101,82:$Vn,91:$Vo,93:$Vp},o($VJ,[2,36],{50:$VK,51:$VL}),o($Vs,[2,70]),o($Vs,[2,71]),o($Vs,[2,72]),o($Vs,[2,73]),o($Vs,[2,74]),o($Vs,[2,75]),o($Vs,[2,76]),o($VM,[2,41],{53:$VN,54:$VO,55:$VP}),o($Vs,[2,44]),o($Vs,[2,50]),{8:$V2,20:$V8,31:109,50:$Vc,51:$Vd,52:108,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{8:$V2,20:$V8,31:109,50:$Vc,51:$Vd,52:110,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{8:$V2,20:$V8,31:109,50:$Vc,51:$Vd,52:111,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{6:6,7:$V1,8:$V2,9:20,11:4,13:7,14:$V3,15:$V4,16:$V5,17:$V6,18:8,19:$V7,20:$V8,21:$V9,22:9,23:$Va,24:11,25:5,26:$Vb,27:[1,112],28:10,29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{8:$V2,9:113,20:$V8,29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{8:$V2,9:114,20:$V8,29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{8:$V2,9:115,20:$V8,29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{14:[1,116]},o($Vr,[2,7]),o($Vr,[2,8]),o($Vr,[2,9]),{16:[1,117]},o($Vr,[2,22]),{8:$V2,20:$V8,29:118,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{8:$V2,20:$V8,31:109,50:$Vc,51:$Vd,52:119,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{8:$V2,20:$V8,29:120,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{8:$V2,20:$V8,31:109,36:121,38:32,40:40,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{20:[1,122]},{8:$V2,9:123,20:$V8,29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},o($Vs,[2,87],{89:124,90:125,68:127,20:$VQ,82:$Vn}),{8:$V2,10:[1,128],20:$V8,29:102,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,81:129,82:$Vn,91:$Vo,93:$Vp},o($Vs,[2,89]),{8:$V2,9:130,20:$V8,29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{20:[1,131]},{8:$V2,20:$V8,31:109,38:132,40:40,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{8:$V2,20:$V8,31:109,40:133,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{8:$V2,20:$V8,31:109,40:134,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{8:$V2,20:$V8,31:109,40:135,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{10:[1,136]},{10:[1,137],20:$VR,92:138},{10:[1,140],20:$VR,92:141},{8:$V2,20:$V8,31:109,44:142,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{8:$V2,20:$V8,31:109,44:143,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{8:$V2,20:$V8,31:109,44:144,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{8:$V2,20:$V8,31:109,44:145,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},o($Vs,[2,79]),{83:[1,146],86:[1,147]},o($VS,[2,81]),{35:[1,148]},{35:[2,84]},{35:[2,85]},{35:[2,86]},o($Vs,[2,77]),{66:[1,149],86:$VT},o($VU,[2,98]),{8:$V2,20:$V8,31:109,49:151,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{8:$V2,20:$V8,31:109,49:152,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{8:$V2,20:$V8,31:109,50:$Vc,51:$Vd,52:153,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{8:$V2,20:$V8,31:109,50:$Vc,51:$Vd,52:154,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{8:$V2,20:$V8,31:109,50:$Vc,51:$Vd,52:155,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},o($Vs,[2,51]),o([8,10,16,32,34,35,37,39,41,42,43,45,46,47,48,50,51,53,54,55,64,65,66,83,86],$Vt,{57:$Vu}),o($Vs,[2,52]),o($Vs,[2,53]),o([5,7,8,10,12,14,15,16,17,19,20,21,23,26,27,32,34,35,37,39,41,42,43,45,46,47,48,50,51,53,54,55,57,58,64,65,66,74,75,76,77,78,79,80,82,83,86,91,93],[2,12]),{10:[1,156]},{10:[1,157]},{16:[1,158]},{8:[1,159]},o($Vr,[2,10]),o($Vs,[2,25]),o($Vs,[2,49]),{35:[1,160]},o($Vx,[2,29],{39:$Vy}),o($Vs,[2,59]),{66:[1,161]},o([8,10,16,32,34,35,37,39,41,42,43,45,46,47,48,50,51,53,54,55,57,64,65,66,83],[2,88],{86:[1,162]}),o($Vs,[2,94]),o($Vs,[2,96]),o($Vs,[2,97]),o($VV,[2,92]),{10:[1,163],86:$VT},{66:[1,164]},o($Vs,[2,91]),o($Vz,[2,31],{41:$VA,42:$VB,43:$VC}),o($VD,[2,33],{45:$VE,46:$VF,47:$VG,48:$VH}),o($VD,[2,34],{45:$VE,46:$VF,47:$VG,48:$VH}),o($VD,[2,35],{45:$VE,46:$VF,47:$VG,48:$VH}),o($Vs,[2,65]),{25:165,26:$Vb},{10:[1,166],86:$VW},o($VX,[2,104]),{94:[1,168]},{10:[1,169],86:$VW},o($VJ,[2,37],{50:$VK,51:$VL}),o($VJ,[2,38],{50:$VK,51:$VL}),o($VJ,[2,39],{50:$VK,51:$VL}),o($VJ,[2,40],{50:$VK,51:$VL}),o($Vs,[2,80]),{20:$VI,72:98,73:99,77:$Vj,78:$Vk,79:$Vl,80:$Vm,85:170,87:96},{8:$V2,20:$V8,29:171,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},o($Vs,[2,78]),{8:$V2,20:$V8,29:172,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},o($VM,[2,42],{53:$VN,54:$VO,55:$VP}),o($VM,[2,43],{53:$VN,54:$VO,55:$VP}),o($Vs,[2,45]),o($Vs,[2,46]),o($Vs,[2,47]),{6:6,7:$V1,8:$V2,9:20,11:173,13:7,14:$V3,15:$V4,16:$V5,17:$V6,18:8,19:$V7,20:$V8,21:$V9,22:9,23:$Va,24:11,25:5,26:$Vb,28:10,29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{6:6,7:$V1,8:$V2,9:20,11:174,13:7,14:$V3,15:$V4,16:$V5,17:$V6,18:8,19:$V7,20:$V8,21:$V9,22:9,23:$Va,24:11,25:5,26:$Vb,28:10,29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{8:$V2,9:175,20:$V8,29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{8:$V2,9:176,20:$V8,29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{8:$V2,20:$V8,29:177,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},o($Vs,[2,60]),{20:$VQ,68:127,82:$Vn,90:178},o($VV,[2,93]),o($Vs,[2,90]),o($Vs,[2,100]),{25:179,26:$Vb},{20:[1,180]},{8:$V2,9:181,20:$V8,29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{94:[1,182]},o($VS,[2,82]),o($VS,[2,83]),o($VU,[2,99]),o($Vq,[2,2],{12:[1,183]}),o($Vr,[2,4]),{16:[1,184]},{10:[1,185]},o($Vs,[2,27]),o($Vs,[2,95]),o($Vs,[2,101]),o($VX,[2,105]),o($Vs,[2,102]),{8:$V2,9:186,20:$V8,29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{6:6,7:$V1,8:$V2,9:20,11:187,13:7,14:$V3,15:$V4,16:$V5,17:$V6,18:8,19:$V7,20:$V8,21:$V9,22:9,23:$Va,24:11,25:5,26:$Vb,28:10,29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{8:$V2,9:188,20:$V8,29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},{16:[1,189]},o($Vs,[2,103]),o($Vr,[2,3]),{10:[1,190]},o($Vr,[2,6]),{6:6,7:$V1,8:$V2,9:20,11:191,13:7,14:$V3,15:$V4,16:$V5,17:$V6,18:8,19:$V7,20:$V8,21:$V9,22:9,23:$Va,24:11,25:5,26:$Vb,28:10,29:22,30:23,31:24,33:25,36:28,38:32,40:40,44:47,49:55,50:$Vc,51:$Vd,52:56,56:57,58:$Ve,59:26,60:27,61:29,62:30,63:31,65:$Vf,67:34,68:35,69:36,70:41,71:42,72:43,73:44,74:$Vg,75:$Vh,76:$Vi,77:$Vj,78:$Vk,79:$Vl,80:$Vm,82:$Vn,91:$Vo,93:$Vp},o($Vr,[2,5])],
defaultActions: {3:[2,1],97:[2,84],98:[2,85],99:[2,86]},
parseError: function parseError (str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        var error = new Error(str);
        error.hash = hash;
        throw error;
    }
},
/**
 * @class
 * @ignore
 */
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    _token_stack:
        var lex = function () {
            var token;
            token = lexer.lex() || EOF;
            if (typeof token !== 'number') {
                token = self.symbols_[token] || token;
            }
            return token;
        };
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
                if (lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: lexer.yylineno,
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
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
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
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
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
            n.eline = pos[2];
            n.ecol = pos[3];

            return n;
        }
    };

    var lc = function (lc1) {
        return [lc1.first_line, lc1.first_column, lc1.last_line, lc1.last_column];
    };

/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
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
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
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
test_match:function(match, indexed_rule) {
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
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
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
lex:function lex () {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin (condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState () {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules () {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState (n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState (condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
/**
 * @class
 * @ignore
 */
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
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
},
rules: [/^(?:\s+)/,/^(?:[0-9]*\.?[0-9]+([eE][-+]?[0-9]+))/,/^(?:[0-9]+\.[0-9]*|[0-9]*\.[0-9]+\b)/,/^(?:[0-9]+)/,/^(?:"(\\["]|[^"])*")/,/^(?:'(\\[']|[^'])*')/,/^(?:\/\/.*)/,/^(?:\/\*(.|\n|\r)*?\*\/)/,/^(?:if\b)/,/^(?:else\b)/,/^(?:while\b)/,/^(?:do\b)/,/^(?:for\b)/,/^(?:function\b)/,/^(?:map\b)/,/^(?:use\b)/,/^(?:return\b)/,/^(?:delete\b)/,/^(?:true\b)/,/^(?:false\b)/,/^(?:null\b)/,/^(?:Infinity\b)/,/^(?:->)/,/^(?:=>)/,/^(?:<<)/,/^(?:>>)/,/^(?:\{)/,/^(?:\})/,/^(?:;)/,/^(?:#)/,/^(?:\?)/,/^(?::)/,/^(?:NaN\b)/,/^(?:\.)/,/^(?:\[)/,/^(?:\])/,/^(?:\()/,/^(?:\))/,/^(?:!)/,/^(?:\^)/,/^(?:\*\*)/,/^(?:\*)/,/^(?:\/)/,/^(?:%)/,/^(?:\+)/,/^(?:-)/,/^(?:<=)/,/^(?:<)/,/^(?:>=)/,/^(?:>)/,/^(?:==)/,/^(?:~=)/,/^(?:!=)/,/^(?:&&)/,/^(?:\|\|)/,/^(?:=)/,/^(?:,)/,/^(?:$)/,/^(?:[A-Za-z_\$][A-Za-z0-9_]*)/,/^(?:.)/],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
/**
 * @class
 * @ignore
 */
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();
// Work around an issue with browsers that don't support Object.getPrototypeOf()
parser.yy.parseError = parser.parseError;

export default JXG.JessieCode;
