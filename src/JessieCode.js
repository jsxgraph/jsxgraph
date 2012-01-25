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

/**
 * @fileoverview JessieCode is a scripting language designed to provide a simple scripting language to build constructions
 * with JSXGraph. It is similar to JavaScript, but prevents access to the DOM. Hence, it can be used in community driven
 * Math portals which want to use JSXGraph to display interactive math graphics.
 */

/**
 * A JessieCode object provides an interfacce to the parser and stores all variables and objects used within a JessieCode script.
 * The optional argument <tt>code</tt> is interpreted after initializing. To evaluate more code after initializing a JessieCode instance
 * please use {@link JXG.JessieCode#parse}. For code snippets like single expressions use {@link JXG.JessieCode#snippet}.
 * @constructor
 * @param {String} [code] Code to parse.
 * @param {Boolean} [geonext=false] Geonext compatibility mode.
 */
JXG.JessieCode = function(code, geonext) {
    var i;

    // Control structures

    /**
     * Stores all variables, local and global. The current scope is determined by {@link JXG.JessieCode#scope}.
     * @type Array
     * @private
     */
    this.sstack = [{
        PI: Math.PI
    }];

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
     * Element attributes that are not allowed to be set in JessieCode.
     * @type Array
     */
    this.visPropBlacklist = ['cssclass', 'highlightcssclass'];

    /**
     * Built-in functions and constants
     * @type Object
     */
    this.builtIn = {
        PI: Math.PI,
        EULER: Math.E,
        X: function (el) {
            return el.X();
        },
        Y: function (el) {
            return el.Y();
        },
        V: function (el) {
            return el.Value();
        },
        L: function (el) {
            return el.L();
        },
        dist: function (p1, p2) {
            if (!JXG.exists(p1) || !JXG.exists(p1.Dist)) {
                this._error('Error: Can\'t calculate distance.');
            }

            return p1.Dist(p2);
        },
        rad: JXG.Math.Geometry.rad,
        deg: JXG.Math.Geometry.trueAngle,
        factorial: JXG.Math.factorial,
        trunc: JXG.trunc,
        '$': this.getElementById
    };

    // special scopes for factorial, deg, and rad
    this.builtIn.rad.sc = JXG.Math.Geometry;
    this.builtIn.deg.sc = JXG.Math.Geometry;
    this.builtIn.factorial.sc = JXG.Math;

    // set the javascript equivalent for the builtIns
    // some of the anonymous functions should be replaced by global methods later on
    this.builtIn.PI.src = 'Math.PI';
    this.builtIn.X.src = '(function (e) { return e.X(); })';
    this.builtIn.Y.src = '(function (e) { return e.Y(); })';
    this.builtIn.V.src = '(function (e) { return e.Value(); })';
    this.builtIn.L.src = '(function (e) { return e.L(); })';
    this.builtIn.dist.src = '(function (e1, e2) { return e1.Dist(e2); })';
    this.builtIn.rad.src = 'JXG.Math.Geometry.rad';
    this.builtIn.deg.src = 'JXG.Math.Geometry.trueAngle';
    this.builtIn.factorial.src = 'JXG.Math.factorial';
    this.builtIn.trunc.src = 'JXG.trunc';
    this.builtIn['$'].src = '(function (n) { return JXG.getRef(JXG.JSXGraph.boards[$jc$.board.id], n); })';

    /**
     * The board which currently is used to create and look up elements.
     * @type JXG.Board
     */
    this.board = null;

    if (typeof code === 'string') {
        this.parse(code);
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
     * Output a debugging message. Uses debug console, if available. Otherwise an HTML element with the
     * id "debug" and an innerHTML property is used.
     * @param {String} log
     * @private
     */
    _debug: function (log) {
        if(typeof console !== "undefined") {
            JXG.debug(log);
        } else if(document.getElementById('debug') !== null) {
            document.getElementById('debug').innerHTML += log + '<br />';
        }
    },

    /**
     * Throws an exception with the given error message.
     * @param {String} msg Error message
     */
    _error: function (msg) {
        throw new Error(msg);
    },

    _warn: function (msg) {
        if(typeof console !== "undefined") {
            JXG.debug('Warning: ' + msg);
        } else if(document.getElementById(this.warnLog) !== null) {
            document.getElementById(this.warnLog).innerHTML += 'Warning: ' + msg + '<br />';
        }
    },

    /**
     * Checks if the given string is a valid identifier.
     * @param {String} s
     * @returns {Boolean}
     */
    isIdentifier: function (s) {
        return /[A-Za-z_\$][A-Za-z0-9_\$]*/.test(s);
    },

    /**
     * Looks up an {@link JXG.GeometryElement} by its id.
     * @param {String} id
     * @returns {JXG.GeometryElement}
     */
    getElementById: function (id) {
        return this.board.objects[id];
    },

    /**
     * Returns a element creator function which takes two parameters: the parents array and the attributes object.
     * @param {String} vname The element type, e.g. 'point', 'line', 'midpoint'
     * @returns {function}
     */
    creator: (function () {
        // stores the already defined creators
        var _ccache = {};

        return function (vname) {
            var f;

            // _ccache is global, i.e. it is the same for ALL JessieCode instances.
            // That's why we need the board id here
            if (typeof _ccache[this.board.id + vname] === 'function') {
                return _ccache[this.board.id + vname];
            } else {
                f = (function (that) {
                    return function (parameters, attributes) {
                        var attr;

                        if (JXG.exists(attributes)) {
                            attr = attributes;
                        } else {
                            attr = {name: (that.lhs[that.scope] !== 0 ? that.lhs[that.scope] : '')};
                        }
                        return that.board.create(vname, parameters, attr);
                    }
                })(this);

                f.creator = true;
                _ccache[this.board.id + vname] = f;

                return f;
            }

        };
    })(),

    /**
     * Assigns a value to a variable in the current scope.
     * @param {String} vname Variable name
     * @param {%} value Anything
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
            if (JXG.exists(this.sstack[s][vname])) {
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
        return !!JXG.JSXGraph.elements[vname];
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
     * @paran {Boolean} [local=false] Only look up the internal symbol table and don't look for
     * the <tt>vname</tt> in Math or the element list.
     */
    getvar: function (vname, local) {
        var s, undef;

        local = JXG.def(local, false);

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
            s = JXG.getRef(this.board, vname);
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
     */
    getvarJS: function (vname, local) {
        var s;

        local = JXG.def(local, false);

        if (JXG.indexOf(this.pstack[this.pscope], vname) > -1) {
            return vname;
        }

        s = this.isLocalVariable(vname);
        if (s > -1) {
            return '$jc$.sstack[' + s + '][\'' + vname + '\']';
        }

        // check for an element with this name
        if (this.isCreator(vname)) {
            return '(function () { var a = Array.prototype.slice.call(arguments, 0); return $jc$.board.create.apply(this, [\'' + vname + '\'].concat(a)); })';
        }

        if (this.isMathMethod(vname)) {
            return 'Math.' + vname;
        }

        if (this.isBuiltIn(vname)) {
            return this.builtIn[vname].src;
        }

        if (!local) {
            if (JXG.isId(this.board, vname)) {
                return '$jc$.board.objects[\'' + vname + '\']';
            } else if (JXG.isName(this.board, vname)) {
                return '$jc$.board.elementsByName[\'' + vname + '\']';
            } else if (JXG.isGroup(this.board, vname)) {
                return '$jc$.board.groups[\'' + vname + '\']';
            }
            //return 'JXG.getRef(JXG.JSXGraph.boards[$jc$.board.id], \'' + vname + '\')';
        }

        return '';
    },

    /**
     * Sets the property <tt>what</tt> of {@link JXG.JessieCode#propobj} to <tt>value</tt>
     * @param {String} what
     * @param {%} value
     */
    setProp: function (o, what, value) {
        var par = {}, x, y;

        // TODO jessiecode to javascript compiler

        if (o.elementClass === JXG.OBJECT_CLASS_POINT && (what === 'X' || what === 'Y')) {
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

                //o.XEval = function() { return this.coords.usrCoords[1]; };
                //o.YEval = function() { return this.coords.usrCoords[2]; };
                o.setPosition(JXG.COORDS_BY_USER, x, y);
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
        } else if (o.type === JXG.OBJECT_TYPE_TEXT && (what === 'X' || what === 'Y')) {
            if (typeof value === 'number') {
                o[what] = function () { return value; };
            } else if (typeof value === 'function') {
                o.isDraggable = false;
                o[what] = value;
            } else if (typeof value === 'string') {
                o.isDraggable = false;
                o[what] = JXG.createFunction(value, this.board, null, true);
                o[what + 'jc'] = value;
            }

            o[what].origin = value;

            this.board.update();
        } else if (o.type && o.elementClass && o.visProp) {
            if (JXG.indexOf(this.visPropBlacklist, what.toLowerCase && what.toLowerCase()) === -1) {
                par[what] = value;
                o.setProperty(par);
            } else {
                this._warn('Attribute "' + what + '" can not be set with JessieCode.');
            }
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
     */
    parse: function (code, geonext) {
        var error_cnt = 0,
            error_off = [],
            error_la = [],
            replacegxt = ['Abs', 'ACos', 'ASin', 'ATan','Ceil','Cos','Exp','Factorial','Floor','Log','Max','Min','Random','Round','Sin','Sqrt','Tan','Trunc', 'If', 'Deg', 'Rad', 'Dist'],
            regex,
            ccode = code.replace(/\r\n/g,'\n').split('\n'), i, j, cleaned = [];

        if (!JXG.exists(geonext)) {
            geonext = false;
        }

        for (i = 0; i < ccode.length; i++) {
            if (!(JXG.trim(ccode[i])[0] === '/' && JXG.trim(ccode[i])[1] === '/')) {
                if (geonext) {
                    for (j = 0; j < replacegxt.length; j++) {
                        regex = new RegExp(replacegxt[j] + "\\(", 'g');
                        ccode[i] = ccode[i].replace(regex, replacegxt[j].toLowerCase() + '(');
                    }
                }

                cleaned.push(ccode[i]);
            }
        }
        code = cleaned.join('\n');
        code = this.utf8_encode(code);

        if((error_cnt = this._parse(code, error_off, error_la)) > 0) {
            for(i = 0; i < error_cnt; i++)
                this._error("Parse error near >"  + code.substr( error_off[i], 30 ) + "<, expecting \"" + error_la[i].join() + "\"");
        }

        this.board.update();
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

        vname = 'jxg__tmp__intern_' + JXG.Util.genUUID().replace(/\-/g, '');

        if (!JXG.exists(funwrap)) {
            funwrap = true;
        }

        if (!JXG.exists(varname)) {
            varname = '';
        }

        if (!JXG.exists(geonext)) {
            geonext = false;
        }

        // just in case...
        tmp = this.sstack[0][vname];

        c = vname + ' = ' + (funwrap ? ' function (' + varname + ') { return ' : '') + code + (funwrap ? '; }' : '') + ';';
        this.parse(c, geonext);

        result = this.sstack[0][vname];
        if (JXG.exists(tmp)) {
            this.sstack[0][vname] = tmp;
        } else {
            delete this.sstack[0][vname];
        }

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
            if (JXG.exists(v) && JXG.exists(v) && v.name !== '') {
                node.type = 'node_var';
                node.value = v.name;
                // maybe it's not necessary, but just to be sure that everything's cleaned up we better delete all
                // children and the replaced flag
                node.children.length = 0;
                delete node.replaced;
            }
        }

        if (node.children) {
            // assignments are first evaluated on the right hand side
            for (i = node.children.length ; i > 0; i--) {
                if (JXG.exists(node.children[i-1])) {
                    node.children[i-1] = this.replaceIDs(node.children[i-1]);
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

        if (node.type == 'node_op' && v == 'op_lhs' && node.children.length === 1) {
            this.isLHS = true;
        } else if (node.type == 'node_var') {
            if (this.isLHS) {
                this.letvar(v, true);
            } else if (!JXG.exists(this.getvar(v, true)) && JXG.exists(this.board.elementsByName[v])) {
                node = this.createReplacementNode(node);
            }
        }

        if (node.children) {
            // assignments are first evaluated on the right hand side
            for (i = node.children.length ; i > 0; i--) {
                if (JXG.exists(node.children[i-1])) {
                    node.children[i-1] = this.replaceNames(node.children[i-1]);
                }

            }
        }

        if (node.type == 'node_op' && node.value == 'op_lhs' && node.children.length === 1) {
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
            this.createNode('node_op', 'op_param',
                this.createNode('node_str', el.id)
            )
        );

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

        if (node.type == 'node_var') {
            e = this.getvar(v);
            if (e && e.visProp && e.type && e.elementClass && e.id) {
                result[e.id] = e;
            }
        }

        // the $()-function-calls are special because their parameter is given as a string, not as a node_var.
        if (node.type == 'node_op' && node.value == 'op_execfun' && node.children.length > 1 && node.children[0].value == '$' && node.children[1].children.length > 0) {
            e = node.children[1].children[0].value;
            result[e] = this.board.objects[e];
        }

        if (node.children) {
            for (i = node.children.length; i > 0; i--) {
                if (JXG.exists(node.children[i-1])) {
                    this.collectDependencies(node.children[i-1], result);
                }

            }
        }
    },

    /**
     * Executes a parse subtree.
     * @param {Object} node
     * @returns Something
     * @private
     */
    execute: function (node) {
        var ret, v, i, e, parents = [];

        ret = 0;

        if (!node)
            return ret;

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
                            this._error('Error: Left-hand side of assignment is read-only.');
                        }

                        if (v[0] !== this.sstack[this.scope] || (JXG.isArray(v[0]) && typeof v[1] === 'number')) {
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
                        var l;

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
                        var undef;

                        ret = this.execute(node.children[0]);
                        i = this.execute(node.children[1]);

                        if (typeof i === 'number' && Math.abs(Math.round(i) - i) < JXG.Math.eps) {
                            ret = ret[i];
                        } else {
                            ret = undef;
                        }
                        break;
                    case 'op_return':
                        if (this.scope === 0) {
                            this._error('Error: Unexpected return.');
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

                        // begin replacement candidate

                        /*ret = (function(_pstack, that) { return function() {
                            var r;

                            that.sstack.push({});
                            that.scope++;
                            for(r = 0; r < _pstack.length; r++) {
                                that.sstack[that.scope][_pstack[r]] = arguments[r];
                            }

                            r = that.execute(node.children[1]);

                            that.sstack.pop();
                            that.scope--;
                            return r;
                        }; })(this.pstack[this.pscope], this);*/

                        // end replacement candidate


                        // new begin

                        this.sstack.push({});
                        this.scope++;

                        this.isLHS = false;

                        for(i = 0; i < this.pstack[this.pscope].length; i++) {
                            this.sstack[this.scope][this.pstack[this.pscope][i]] = this.pstack[this.pscope][i];
                        }

                        this.replaceNames(node.children[1]);

                        ret = (function ($jc$) {
                            var p = $jc$.pstack[$jc$.pscope].join(', '),
                                str = 'var f = function (' + p + ') {\n$jc$.sstack.push([]);\n$jc$.scope++;\nvar r = (function () {' + $jc$.compile(node.children[1], true) + '})();\n$jc$.sstack.pop();\n$jc$.scope--;\nreturn r;\n}; f;';

                            // the function code formatted:
                            /*var f = function (_parameters_) {
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
                            f;   // the return value of eval() */


                            return eval(str);
                        })(this);

                        // clean up scope
                        this.sstack.pop();
                        this.scope--;

                        ret.toString = (function (_that) {
                            return function () {
                                return _that.compile(_that.replaceIDs(JXG.deepCopy(node)));
                            };
                        })(this);

                        ret.deps = {};
                        this.collectDependencies(node.children[1], ret.deps);

                        this.pstack.pop();
                        this.pscope--;
                        break;
                    case 'op_execfun':
                        // node.children:
                        //   [0]: Name of the function
                        //   [1]: Parameter list as a parse subtree
                        //   [2]: Properties, only used in case of a create function
                        var fun, props, attr, sc;

                        this.pstack.push([]);
                        this.pscope++;

                        // assume there are no properties given
                        props = false;

                        // parse the parameter list
                        // after this, the parameters are in pstack
                        this.execute(node.children[1]);

                        // parse the properties only if given
                        if (typeof node.children[2] !== 'undefined') {
                            this.propstack.push({});
                            this.propscope++;

                            props = true;
                            this.execute(node.children[2]);
                        }

                        // look up the variables name in the variable table
                        fun = this.execute(node.children[0]);

                        // determine the scope the function wants to run in
                        if (fun.sc) {
                            sc = fun.sc;
                        } else {
                            sc = this;
                        }

                        // interpret ALL the parameters
                        for(i = 0; i < this.pstack[this.pscope].length; i++) {
                            parents[i] = this.execute(this.pstack[this.pscope][i]);
                        }

                        // get the properties from the propstack
                        if (props) {
                            attr = this.propstack[this.propscope];
                            for (i in attr) {
                                if (JXG.indexOf(this.visPropBlacklist, i.toLowerCase()) > -1) {
                                    this._warn('Attribute "' + i + '" can not be set with JessieCode.');
                                    delete attr[i];
                                }
                            }
                        }

                        // check for the function in the variable table
                        if (typeof fun === 'function' && !fun.creator) {
                            ret = fun.apply(sc, parents);
                        } else if (typeof fun === 'function' && !!fun.creator) {
                            // creator methods are the only ones that take properties, hence this special case
                            ret = fun(parents, attr);
                        } else {
                            this._error('Error: Function \'' + node.children[0] + '\' is undefined.');
                        }

                        // clear props stack
                        if (props) {
                            this.propstack.pop();
                            this.propscope--;
                        }

                        // clear parameter stack
                        this.pstack.pop();
                        this.pscope--;
                        break;
                    case 'op_property':
                        e = this.execute(node.children[0]);
                        v = node.children[1];

                        // is it a geometry element?
                        if (e && e.type && e.elementClass && e.methodMap) {
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
                                if (JXG.exists(e.subs[v])) {
                                    // a subelement it is, good sir.
                                    e = e.subs;
                                } else if (JXG.exists(e.methodMap[v])) {
                                    // the user wants to call a method
                                    v = e.methodMap[v];
                                } else {
                                    // the user wants to change an attribute
                                    e = e.visProp;
                                    v = v.toLowerCase();
                                }
                            }
                        }

                        if (!JXG.exists(e)) {
                            this._error('Error: ' + e + ' is not an object.');
                        }

                        if (!JXG.exists(e[v])) {
                            this._error('Error: unknown property ' + v + '.');
                        }

                        ret = e[v];

                        // set the scope, in case this is a method the user wants to call
                        ret.sc = e;
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
                        var found = false;

                        // search all the boards for the one with the appropriate container div
                        for(var b in JXG.JSXGraph.boards) {
                            if(JXG.JSXGraph.boards[b].container === node.children[0].toString()) {
                                this.board = JXG.JSXGraph.boards[b];
                                found = true;
                            }
                        }

                        if(!found)
                            this._error('Board \'' + node.children[0].toString() + '\' not found!');
                        break;
                    case 'op_delete':
                        v = this.getvar(node.children[0]);

                        if (typeof v === 'object' && JXG.exists(v.type) && JXG.exists(v.elementClass)) {
                            this.board.removeObject(v);
                        }
                        break;
                    case 'op_equ':
                        ret = this.execute(node.children[0]) == this.execute(node.children[1]);
                        break;
                    case 'op_neq':
                        ret = this.execute(node.children[0]) != this.execute(node.children[1]);
                        break;
                    case 'op_approx':
                        ret = Math.abs(this.execute(node.children[0]) - this.execute(node.children[1])) < JXG.Math.eps;
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
                        ret = this.execute(node.children[0]) + this.execute(node.children[1]);
                        break;
                    case 'op_sub':
                        ret = this.execute(node.children[0]) - this.execute(node.children[1]);
                        break;
                    case 'op_div':
                        ret = this.execute(node.children[0]) / this.execute(node.children[1]);
                        break;
                    case 'op_mod':
                        ret = this.execute(node.children[0]) % this.execute(node.children[1]);
                        break;
                    case 'op_mul':
                        ret = this.execute(node.children[0]) * this.execute(node.children[1]);
                        break;
                    case 'op_exp':
                        ret = Math.pow(this.execute(node.children[0]),  this.execute(node.children[1]));
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
        var ret, i, e, v;

        ret = '';

        if (!JXG.exists(js)) {
            js = false
        }

        if (!node)
            return ret;

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
                            if (this.isLocalVariable(e) !== this.scope) {
                                this.sstack[this.scope][e] = true;
                            }
                            ret = '$jc$.sstack[' + this.scope + '][\'' + e + '\'] = ' + this.compile(node.children[1], js) + ';\n';
                        } else {
                            ret = e + ' = ' + this.compile(node.children[1], js) + ';\n';
                        }

                        break;
                    case 'op_noassign':
                        ret = this.compile(node.children[0], js);
                        break;
                    case 'op_if':
                        ret = ' if (' + this.compile(node.children[0], js) + ') ' + this.compile(node.children[1], js);
                        break;
                    case 'op_if_else':
                        ret = ' if (' + this.compile(node.children[0], js) + ')' + this.compile(node.children[1], js);
                        ret += ' else ' + this.compile(node.children[2], js);
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
                        ret = (js ? '{' : '<<') + this.compile(node.children[0], js) + (js ? '}' : '>>');
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
                            e = (js ? '{' : '<<') + this.compile(node.children[2], js) + (js ? '}' : '>>');
                        }

                        ret = this.compile(node.children[0], js) + '(' + this.compile(node.children[1], js) + (node.children[2] ? ', ' + e : '') + ')';

                        // save us a function call when compiled to javascript
                        if (js && node.children[0].value === '$') {
                            ret = '$jc$.board.objects[' + this.compile(node.children[1], js) + ']';
                        }

                        break;
                    case 'op_property':
                        ret = this.compile(node.children[0], js) + '.' + node.children[1];
                        break;
                    case 'op_lhs':
                        if (node.children.length === 1) {
                            ret = node.children[0];
                        } else if (node.children[2] === 'dot') {
                            ret = this.compile(node.children[1], js) + '.' + node.children[0];
                        } else if (node.children[2] === 'bracket') {
                            ret = this.compile(node.children[1], js) + '[' + this.compile(node.children[0], js) + ']';
                        }
                        break;
                    case 'op_use':
                        if (js) {
                            ret = '$jc$.board = JXG.JSXGraph.boards[\'' + node.children[0] + '\']';
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
                        ret = '(' + this.compile(node.children[0], js) + ' + ' + this.compile(node.children[1], js) + ')';
                        break;
                    case 'op_sub':
                        ret = '(' + this.compile(node.children[0], js) + ' - ' + this.compile(node.children[1], js) + ')';
                        break;
                    case 'op_div':
                        ret = '(' + this.compile(node.children[0], js) + ' / ' + this.compile(node.children[1], js) + ')';
                        break;
                    case 'op_mod':
                        ret = '(' + this.compile(node.children[0], js) + ' % ' + this.compile(node.children[1], js) + ')';
                        break;
                    case 'op_mul':
                        ret = '(' + this.compile(node.children[0], js) + ' * ' + this.compile(node.children[1], js) + ')';
                        break;
                    case 'op_exp':
                        if (js) {
                            ret = 'Math.pow(' + this.compile(node.children[0], js) + ', ' + this.compile(node.children[1], js) + ')';
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
                    //ret = '$jc$.getvar(\'' + node.value + '\')';
                    ret = this.getvarJS(node.value);
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

        for(i = 2; i < arguments.length; i++)
            n.children.push( arguments[i] );

        return n;
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
     * JS/CC interna
     * @type Boolean
     * @private
     */
    _dbg_withtrace: false,

    /**
     * JS/CC interna
     * @type String
     * @private
     */
    _dbg_string: '',

    /**
     * JS/CC interna
     * @param {String} text
     * @private
     */
    _dbg_print: function (text) {
        this._dbg_string += text + "\n";
    },

    /**
     * Internal lexer method.
     * @private
     */
    _lex: function (info) {
        var state = 0,
            match = -1,
            match_pos = 0,
            start = 0,
            pos = info.offset + 1;

        do {
            pos--;
            state = 0;
            match = -2;
            start = pos;

            if (info.src.length <= start) {
                return 65;
            }

            do {

switch( state )
{
	case 0:
		if( ( info.src.charCodeAt( pos ) >= 9 && info.src.charCodeAt( pos ) <= 10 ) || info.src.charCodeAt( pos ) == 13 || info.src.charCodeAt( pos ) == 32 ) state = 1;
		else if( info.src.charCodeAt( pos ) == 33 ) state = 2;
		else if( info.src.charCodeAt( pos ) == 35 ) state = 3;
		else if( info.src.charCodeAt( pos ) == 36 || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 67 ) || ( info.src.charCodeAt( pos ) >= 71 && info.src.charCodeAt( pos ) <= 72 ) || ( info.src.charCodeAt( pos ) >= 74 && info.src.charCodeAt( pos ) <= 81 ) || info.src.charCodeAt( pos ) == 83 || info.src.charCodeAt( pos ) == 86 || ( info.src.charCodeAt( pos ) >= 88 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 99 ) || ( info.src.charCodeAt( pos ) >= 103 && info.src.charCodeAt( pos ) <= 104 ) || ( info.src.charCodeAt( pos ) >= 106 && info.src.charCodeAt( pos ) <= 113 ) || info.src.charCodeAt( pos ) == 115 || info.src.charCodeAt( pos ) == 118 || ( info.src.charCodeAt( pos ) >= 120 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 37 ) state = 5;
		else if( info.src.charCodeAt( pos ) == 40 ) state = 6;
		else if( info.src.charCodeAt( pos ) == 41 ) state = 7;
		else if( info.src.charCodeAt( pos ) == 42 ) state = 8;
		else if( info.src.charCodeAt( pos ) == 43 ) state = 9;
		else if( info.src.charCodeAt( pos ) == 44 ) state = 10;
		else if( info.src.charCodeAt( pos ) == 45 ) state = 11;
		else if( info.src.charCodeAt( pos ) == 46 ) state = 12;
		else if( info.src.charCodeAt( pos ) == 47 ) state = 13;
		else if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) ) state = 14;
		else if( info.src.charCodeAt( pos ) == 58 ) state = 15;
		else if( info.src.charCodeAt( pos ) == 59 ) state = 16;
		else if( info.src.charCodeAt( pos ) == 60 ) state = 17;
		else if( info.src.charCodeAt( pos ) == 61 ) state = 18;
		else if( info.src.charCodeAt( pos ) == 62 ) state = 19;
		else if( info.src.charCodeAt( pos ) == 91 ) state = 20;
		else if( info.src.charCodeAt( pos ) == 93 ) state = 21;
		else if( info.src.charCodeAt( pos ) == 94 ) state = 22;
		else if( info.src.charCodeAt( pos ) == 123 ) state = 23;
		else if( info.src.charCodeAt( pos ) == 124 ) state = 24;
		else if( info.src.charCodeAt( pos ) == 125 ) state = 25;
		else if( info.src.charCodeAt( pos ) == 38 ) state = 48;
		else if( info.src.charCodeAt( pos ) == 68 || info.src.charCodeAt( pos ) == 100 ) state = 49;
		else if( info.src.charCodeAt( pos ) == 39 ) state = 51;
		else if( info.src.charCodeAt( pos ) == 73 || info.src.charCodeAt( pos ) == 105 ) state = 52;
		else if( info.src.charCodeAt( pos ) == 126 ) state = 53;
		else if( info.src.charCodeAt( pos ) == 70 || info.src.charCodeAt( pos ) == 102 ) state = 64;
		else if( info.src.charCodeAt( pos ) == 85 || info.src.charCodeAt( pos ) == 117 ) state = 65;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 73;
		else if( info.src.charCodeAt( pos ) == 84 || info.src.charCodeAt( pos ) == 116 ) state = 74;
		else if( info.src.charCodeAt( pos ) == 87 || info.src.charCodeAt( pos ) == 119 ) state = 80;
		else if( info.src.charCodeAt( pos ) == 82 || info.src.charCodeAt( pos ) == 114 ) state = 84;
		else state = -1;
		break;

	case 1:
		state = -1;
		match = 1;
		match_pos = pos;
		break;

	case 2:
		if( info.src.charCodeAt( pos ) == 61 ) state = 26;
		else state = -1;
		match = 30;
		match_pos = pos;
		break;

	case 3:
		state = -1;
		match = 40;
		match_pos = pos;
		break;

	case 4:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 5:
		state = -1;
		match = 34;
		match_pos = pos;
		break;

	case 6:
		state = -1;
		match = 37;
		match_pos = pos;
		break;

	case 7:
		state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 8:
		state = -1;
		match = 35;
		match_pos = pos;
		break;

	case 9:
		state = -1;
		match = 31;
		match_pos = pos;
		break;

	case 10:
		state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 11:
		state = -1;
		match = 32;
		match_pos = pos;
		break;

	case 12:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) ) state = 29;
		else state = -1;
		match = 43;
		match_pos = pos;
		break;

	case 13:
		state = -1;
		match = 33;
		match_pos = pos;
		break;

	case 14:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) ) state = 14;
		else if( info.src.charCodeAt( pos ) == 46 ) state = 29;
		else state = -1;
		match = 46;
		match_pos = pos;
		break;

	case 15:
		state = -1;
		match = 41;
		match_pos = pos;
		break;

	case 16:
		state = -1;
		match = 19;
		match_pos = pos;
		break;

	case 17:
		if( info.src.charCodeAt( pos ) == 60 ) state = 30;
		else if( info.src.charCodeAt( pos ) == 61 ) state = 31;
		else state = -1;
		match = 27;
		match_pos = pos;
		break;

	case 18:
		if( info.src.charCodeAt( pos ) == 61 ) state = 32;
		else state = -1;
		match = 20;
		match_pos = pos;
		break;

	case 19:
		if( info.src.charCodeAt( pos ) == 61 ) state = 33;
		else if( info.src.charCodeAt( pos ) == 62 ) state = 34;
		else state = -1;
		match = 26;
		match_pos = pos;
		break;

	case 20:
		state = -1;
		match = 15;
		match_pos = pos;
		break;

	case 21:
		state = -1;
		match = 16;
		match_pos = pos;
		break;

	case 22:
		state = -1;
		match = 36;
		match_pos = pos;
		break;

	case 23:
		state = -1;
		match = 17;
		match_pos = pos;
		break;

	case 24:
		if( info.src.charCodeAt( pos ) == 124 ) state = 37;
		else state = -1;
		match = 42;
		match_pos = pos;
		break;

	case 25:
		state = -1;
		match = 18;
		match_pos = pos;
		break;

	case 26:
		state = -1;
		match = 22;
		match_pos = pos;
		break;

	case 27:
		state = -1;
		match = 29;
		match_pos = pos;
		break;

	case 28:
		state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 29:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) ) state = 29;
		else state = -1;
		match = 47;
		match_pos = pos;
		break;

	case 30:
		state = -1;
		match = 13;
		match_pos = pos;
		break;

	case 31:
		state = -1;
		match = 24;
		match_pos = pos;
		break;

	case 32:
		state = -1;
		match = 21;
		match_pos = pos;
		break;

	case 33:
		state = -1;
		match = 25;
		match_pos = pos;
		break;

	case 34:
		state = -1;
		match = 14;
		match_pos = pos;
		break;

	case 35:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else state = -1;
		match = 5;
		match_pos = pos;
		break;

	case 36:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else state = -1;
		match = 2;
		match_pos = pos;
		break;

	case 37:
		state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 38:
		state = -1;
		match = 23;
		match_pos = pos;
		break;

	case 39:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else state = -1;
		match = 6;
		match_pos = pos;
		break;

	case 40:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else state = -1;
		match = 8;
		match_pos = pos;
		break;

	case 41:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else state = -1;
		match = 3;
		match_pos = pos;
		break;

	case 42:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else state = -1;
		match = 11;
		match_pos = pos;
		break;

	case 43:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else state = -1;
		match = 12;
		match_pos = pos;
		break;

	case 44:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else state = -1;
		match = 4;
		match_pos = pos;
		break;

	case 45:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else state = -1;
		match = 10;
		match_pos = pos;
		break;

	case 46:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else state = -1;
		match = 9;
		match_pos = pos;
		break;

	case 47:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else state = -1;
		match = 7;
		match_pos = pos;
		break;

	case 48:
		if( info.src.charCodeAt( pos ) == 38 ) state = 27;
		else state = -1;
		break;

	case 49:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 68 ) || ( info.src.charCodeAt( pos ) >= 70 && info.src.charCodeAt( pos ) <= 78 ) || ( info.src.charCodeAt( pos ) >= 80 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 110 ) || ( info.src.charCodeAt( pos ) >= 112 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 79 || info.src.charCodeAt( pos ) == 111 ) state = 35;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 81;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 50:
		if( info.src.charCodeAt( pos ) == 39 ) state = 28;
		else if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 38 ) || ( info.src.charCodeAt( pos ) >= 40 && info.src.charCodeAt( pos ) <= 91 ) || ( info.src.charCodeAt( pos ) >= 93 && info.src.charCodeAt( pos ) <= 254 ) ) state = 51;
		else if( info.src.charCodeAt( pos ) == 92 ) state = 55;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 51:
		if( info.src.charCodeAt( pos ) == 39 ) state = 28;
		else if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 38 ) || ( info.src.charCodeAt( pos ) >= 40 && info.src.charCodeAt( pos ) <= 91 ) || ( info.src.charCodeAt( pos ) >= 93 && info.src.charCodeAt( pos ) <= 254 ) ) state = 51;
		else if( info.src.charCodeAt( pos ) == 92 ) state = 55;
		else state = -1;
		break;

	case 52:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 69 ) || ( info.src.charCodeAt( pos ) >= 71 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 101 ) || ( info.src.charCodeAt( pos ) >= 103 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 70 || info.src.charCodeAt( pos ) == 102 ) state = 36;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 53:
		if( info.src.charCodeAt( pos ) == 61 ) state = 38;
		else state = -1;
		break;

	case 54:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 81 ) || ( info.src.charCodeAt( pos ) >= 83 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 113 ) || ( info.src.charCodeAt( pos ) >= 115 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 82 || info.src.charCodeAt( pos ) == 114 ) state = 39;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 55:
		if( info.src.charCodeAt( pos ) == 39 ) state = 50;
		else if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 38 ) || ( info.src.charCodeAt( pos ) >= 40 && info.src.charCodeAt( pos ) <= 91 ) || ( info.src.charCodeAt( pos ) >= 93 && info.src.charCodeAt( pos ) <= 254 ) ) state = 51;
		else if( info.src.charCodeAt( pos ) == 92 ) state = 55;
		else state = -1;
		break;

	case 56:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 68 ) || ( info.src.charCodeAt( pos ) >= 70 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 40;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 57:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 68 ) || ( info.src.charCodeAt( pos ) >= 70 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 41;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 58:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 68 ) || ( info.src.charCodeAt( pos ) >= 70 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 42;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 59:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 68 ) || ( info.src.charCodeAt( pos ) >= 70 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 43;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 60:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 68 ) || ( info.src.charCodeAt( pos ) >= 70 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 44;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 61:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 68 ) || ( info.src.charCodeAt( pos ) >= 70 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 45;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 62:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 77 ) || ( info.src.charCodeAt( pos ) >= 79 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 109 ) || ( info.src.charCodeAt( pos ) >= 111 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 78 || info.src.charCodeAt( pos ) == 110 ) state = 46;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 63:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 77 ) || ( info.src.charCodeAt( pos ) >= 79 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 109 ) || ( info.src.charCodeAt( pos ) >= 111 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 78 || info.src.charCodeAt( pos ) == 110 ) state = 47;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 64:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 66 && info.src.charCodeAt( pos ) <= 78 ) || ( info.src.charCodeAt( pos ) >= 80 && info.src.charCodeAt( pos ) <= 84 ) || ( info.src.charCodeAt( pos ) >= 86 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 98 && info.src.charCodeAt( pos ) <= 110 ) || ( info.src.charCodeAt( pos ) >= 112 && info.src.charCodeAt( pos ) <= 116 ) || ( info.src.charCodeAt( pos ) >= 118 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 79 || info.src.charCodeAt( pos ) == 111 ) state = 54;
		else if( info.src.charCodeAt( pos ) == 65 || info.src.charCodeAt( pos ) == 97 ) state = 75;
		else if( info.src.charCodeAt( pos ) == 85 || info.src.charCodeAt( pos ) == 117 ) state = 86;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 65:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 82 ) || ( info.src.charCodeAt( pos ) >= 84 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 114 ) || ( info.src.charCodeAt( pos ) >= 116 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 83 || info.src.charCodeAt( pos ) == 115 ) state = 56;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 66:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 82 ) || ( info.src.charCodeAt( pos ) >= 84 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 114 ) || ( info.src.charCodeAt( pos ) >= 116 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 83 || info.src.charCodeAt( pos ) == 115 ) state = 57;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 67:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 84 ) || ( info.src.charCodeAt( pos ) >= 86 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 116 ) || ( info.src.charCodeAt( pos ) >= 118 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 85 || info.src.charCodeAt( pos ) == 117 ) state = 58;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 68:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 82 ) || ( info.src.charCodeAt( pos ) >= 84 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 114 ) || ( info.src.charCodeAt( pos ) >= 116 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 83 || info.src.charCodeAt( pos ) == 115 ) state = 59;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 69:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 75 ) || ( info.src.charCodeAt( pos ) >= 77 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 107 ) || ( info.src.charCodeAt( pos ) >= 109 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 76 || info.src.charCodeAt( pos ) == 108 ) state = 60;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 70:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 83 ) || ( info.src.charCodeAt( pos ) >= 85 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 115 ) || ( info.src.charCodeAt( pos ) >= 117 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 84 || info.src.charCodeAt( pos ) == 116 ) state = 61;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 71:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 81 ) || ( info.src.charCodeAt( pos ) >= 83 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 113 ) || ( info.src.charCodeAt( pos ) >= 115 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 82 || info.src.charCodeAt( pos ) == 114 ) state = 62;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 72:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 78 ) || ( info.src.charCodeAt( pos ) >= 80 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 110 ) || ( info.src.charCodeAt( pos ) >= 112 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 79 || info.src.charCodeAt( pos ) == 111 ) state = 63;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 73:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 75 ) || ( info.src.charCodeAt( pos ) >= 77 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 107 ) || ( info.src.charCodeAt( pos ) >= 109 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 76 || info.src.charCodeAt( pos ) == 108 ) state = 66;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 74:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 81 ) || ( info.src.charCodeAt( pos ) >= 83 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 113 ) || ( info.src.charCodeAt( pos ) >= 115 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 82 || info.src.charCodeAt( pos ) == 114 ) state = 67;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 75:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 75 ) || ( info.src.charCodeAt( pos ) >= 77 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 107 ) || ( info.src.charCodeAt( pos ) >= 109 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 76 || info.src.charCodeAt( pos ) == 108 ) state = 68;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 76:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 72 ) || ( info.src.charCodeAt( pos ) >= 74 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 104 ) || ( info.src.charCodeAt( pos ) >= 106 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 73 || info.src.charCodeAt( pos ) == 105 ) state = 69;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 77:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 68 ) || ( info.src.charCodeAt( pos ) >= 70 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 70;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 78:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 84 ) || ( info.src.charCodeAt( pos ) >= 86 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 116 ) || ( info.src.charCodeAt( pos ) >= 118 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 85 || info.src.charCodeAt( pos ) == 117 ) state = 71;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 79:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 72 ) || ( info.src.charCodeAt( pos ) >= 74 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 104 ) || ( info.src.charCodeAt( pos ) >= 106 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 73 || info.src.charCodeAt( pos ) == 105 ) state = 72;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 80:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 71 ) || ( info.src.charCodeAt( pos ) >= 73 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 103 ) || ( info.src.charCodeAt( pos ) >= 105 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 72 || info.src.charCodeAt( pos ) == 104 ) state = 76;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 81:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 75 ) || ( info.src.charCodeAt( pos ) >= 77 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 107 ) || ( info.src.charCodeAt( pos ) >= 109 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 76 || info.src.charCodeAt( pos ) == 108 ) state = 77;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 82:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 83 ) || ( info.src.charCodeAt( pos ) >= 85 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 115 ) || ( info.src.charCodeAt( pos ) >= 117 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 84 || info.src.charCodeAt( pos ) == 116 ) state = 78;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 83:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 83 ) || ( info.src.charCodeAt( pos ) >= 85 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 115 ) || ( info.src.charCodeAt( pos ) >= 117 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 84 || info.src.charCodeAt( pos ) == 116 ) state = 79;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 84:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 68 ) || ( info.src.charCodeAt( pos ) >= 70 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 82;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 85:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 66 ) || ( info.src.charCodeAt( pos ) >= 68 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 98 ) || ( info.src.charCodeAt( pos ) >= 100 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 67 || info.src.charCodeAt( pos ) == 99 ) state = 83;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 86:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 77 ) || ( info.src.charCodeAt( pos ) >= 79 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 109 ) || ( info.src.charCodeAt( pos ) >= 111 && info.src.charCodeAt( pos ) <= 122 ) ) state = 4;
		else if( info.src.charCodeAt( pos ) == 78 || info.src.charCodeAt( pos ) == 110 ) state = 85;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

}


                pos++;

            } while( state > -1 );

        } while (1 > -1 && match == 1);

        if (match > -1) {
            info.att = info.src.substr( start, match_pos - start );
            info.offset = match_pos;
        
switch( match )
{
	case 45:
		{
		 info.att = info.att.substr( 1, info.att.length - 2 );
                                                                                info.att = info.att.replace( /\\\'/g, "\'" );    
		}
		break;

}


        } else {
            info.att = new String();
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
    _parse: function (src, err_off, err_la) {
        var sstack = [],
            vstack = [],
            err_cnt = 0,
            act,
            go,
            la,
            rval,
            i,
            parseinfo = new Function( "", "var offset; var src; var att;" ),
            info = new parseinfo();

/* Pop-Table */
var pop_tab = new Array(
	new Array( 0/* Program' */, 1 ),
	new Array( 48/* Program */, 2 ),
	new Array( 48/* Program */, 0 ),
	new Array( 50/* Stmt_List */, 2 ),
	new Array( 50/* Stmt_List */, 0 ),
	new Array( 51/* Param_List */, 3 ),
	new Array( 51/* Param_List */, 1 ),
	new Array( 51/* Param_List */, 0 ),
	new Array( 53/* Prop_List */, 3 ),
	new Array( 53/* Prop_List */, 1 ),
	new Array( 53/* Prop_List */, 0 ),
	new Array( 54/* Prop */, 3 ),
	new Array( 55/* Param_Def_List */, 3 ),
	new Array( 55/* Param_Def_List */, 1 ),
	new Array( 55/* Param_Def_List */, 0 ),
	new Array( 57/* Assign */, 3 ),
	new Array( 49/* Stmt */, 3 ),
	new Array( 49/* Stmt */, 5 ),
	new Array( 49/* Stmt */, 3 ),
	new Array( 49/* Stmt */, 5 ),
	new Array( 49/* Stmt */, 9 ),
	new Array( 49/* Stmt */, 3 ),
	new Array( 49/* Stmt */, 2 ),
	new Array( 49/* Stmt */, 2 ),
	new Array( 49/* Stmt */, 2 ),
	new Array( 49/* Stmt */, 2 ),
	new Array( 49/* Stmt */, 3 ),
	new Array( 49/* Stmt */, 1 ),
	new Array( 56/* Lhs */, 3 ),
	new Array( 56/* Lhs */, 4 ),
	new Array( 56/* Lhs */, 1 ),
	new Array( 52/* Expression */, 3 ),
	new Array( 52/* Expression */, 3 ),
	new Array( 52/* Expression */, 3 ),
	new Array( 52/* Expression */, 3 ),
	new Array( 52/* Expression */, 3 ),
	new Array( 52/* Expression */, 3 ),
	new Array( 52/* Expression */, 3 ),
	new Array( 52/* Expression */, 1 ),
	new Array( 60/* LogExp */, 3 ),
	new Array( 60/* LogExp */, 3 ),
	new Array( 60/* LogExp */, 2 ),
	new Array( 60/* LogExp */, 1 ),
	new Array( 59/* AddSubExp */, 3 ),
	new Array( 59/* AddSubExp */, 3 ),
	new Array( 59/* AddSubExp */, 1 ),
	new Array( 61/* MulDivExp */, 3 ),
	new Array( 61/* MulDivExp */, 3 ),
	new Array( 61/* MulDivExp */, 3 ),
	new Array( 61/* MulDivExp */, 1 ),
	new Array( 62/* ExpExp */, 3 ),
	new Array( 62/* ExpExp */, 1 ),
	new Array( 63/* NegExp */, 2 ),
	new Array( 63/* NegExp */, 1 ),
	new Array( 58/* ExtValue */, 4 ),
	new Array( 58/* ExtValue */, 4 ),
	new Array( 58/* ExtValue */, 7 ),
	new Array( 58/* ExtValue */, 3 ),
	new Array( 58/* ExtValue */, 1 ),
	new Array( 64/* Value */, 1 ),
	new Array( 64/* Value */, 1 ),
	new Array( 64/* Value */, 1 ),
	new Array( 64/* Value */, 3 ),
	new Array( 64/* Value */, 1 ),
	new Array( 64/* Value */, 7 ),
	new Array( 64/* Value */, 3 ),
	new Array( 64/* Value */, 3 ),
	new Array( 64/* Value */, 1 ),
	new Array( 64/* Value */, 1 )
);

/* Action-Table */
var act_tab = new Array(
	/* State 0 */ new Array( 65/* "$$" */,-2 , 2/* "IF" */,-2 , 4/* "WHILE" */,-2 , 5/* "DO" */,-2 , 6/* "FOR" */,-2 , 8/* "USE" */,-2 , 10/* "DELETE" */,-2 , 9/* "RETURN" */,-2 , 17/* "{" */,-2 , 19/* ";" */,-2 , 44/* "Identifier" */,-2 , 30/* "!" */,-2 , 46/* "Integer" */,-2 , 47/* "Float" */,-2 , 37/* "(" */,-2 , 45/* "String" */,-2 , 7/* "FUNCTION" */,-2 , 13/* "<<" */,-2 , 15/* "[" */,-2 , 11/* "TRUE" */,-2 , 12/* "FALSE" */,-2 , 32/* "-" */,-2 ),
	/* State 1 */ new Array( 2/* "IF" */,3 , 4/* "WHILE" */,4 , 5/* "DO" */,5 , 6/* "FOR" */,6 , 8/* "USE" */,7 , 10/* "DELETE" */,8 , 9/* "RETURN" */,9 , 17/* "{" */,12 , 19/* ";" */,13 , 44/* "Identifier" */,17 , 30/* "!" */,18 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 , 32/* "-" */,33 , 65/* "$$" */,0 ),
	/* State 2 */ new Array( 65/* "$$" */,-1 , 2/* "IF" */,-1 , 4/* "WHILE" */,-1 , 5/* "DO" */,-1 , 6/* "FOR" */,-1 , 8/* "USE" */,-1 , 10/* "DELETE" */,-1 , 9/* "RETURN" */,-1 , 17/* "{" */,-1 , 19/* ";" */,-1 , 44/* "Identifier" */,-1 , 30/* "!" */,-1 , 46/* "Integer" */,-1 , 47/* "Float" */,-1 , 37/* "(" */,-1 , 45/* "String" */,-1 , 7/* "FUNCTION" */,-1 , 13/* "<<" */,-1 , 15/* "[" */,-1 , 11/* "TRUE" */,-1 , 12/* "FALSE" */,-1 , 32/* "-" */,-1 ),
	/* State 3 */ new Array( 30/* "!" */,18 , 32/* "-" */,33 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 44/* "Identifier" */,36 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 ),
	/* State 4 */ new Array( 30/* "!" */,18 , 32/* "-" */,33 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 44/* "Identifier" */,36 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 ),
	/* State 5 */ new Array( 2/* "IF" */,3 , 4/* "WHILE" */,4 , 5/* "DO" */,5 , 6/* "FOR" */,6 , 8/* "USE" */,7 , 10/* "DELETE" */,8 , 9/* "RETURN" */,9 , 17/* "{" */,12 , 19/* ";" */,13 , 44/* "Identifier" */,17 , 30/* "!" */,18 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 , 32/* "-" */,33 ),
	/* State 6 */ new Array( 37/* "(" */,39 ),
	/* State 7 */ new Array( 44/* "Identifier" */,40 ),
	/* State 8 */ new Array( 44/* "Identifier" */,41 ),
	/* State 9 */ new Array( 2/* "IF" */,3 , 4/* "WHILE" */,4 , 5/* "DO" */,5 , 6/* "FOR" */,6 , 8/* "USE" */,7 , 10/* "DELETE" */,8 , 9/* "RETURN" */,9 , 17/* "{" */,12 , 19/* ";" */,13 , 44/* "Identifier" */,17 , 30/* "!" */,18 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 , 32/* "-" */,33 ),
	/* State 10 */ new Array( 19/* ";" */,43 ),
	/* State 11 */ new Array( 23/* "~=" */,44 , 22/* "!=" */,45 , 25/* ">=" */,46 , 24/* "<=" */,47 , 26/* ">" */,48 , 27/* "<" */,49 , 21/* "==" */,50 , 19/* ";" */,51 ),
	/* State 12 */ new Array( 18/* "}" */,-4 , 2/* "IF" */,-4 , 4/* "WHILE" */,-4 , 5/* "DO" */,-4 , 6/* "FOR" */,-4 , 8/* "USE" */,-4 , 10/* "DELETE" */,-4 , 9/* "RETURN" */,-4 , 17/* "{" */,-4 , 19/* ";" */,-4 , 44/* "Identifier" */,-4 , 30/* "!" */,-4 , 46/* "Integer" */,-4 , 47/* "Float" */,-4 , 37/* "(" */,-4 , 45/* "String" */,-4 , 7/* "FUNCTION" */,-4 , 13/* "<<" */,-4 , 15/* "[" */,-4 , 11/* "TRUE" */,-4 , 12/* "FALSE" */,-4 , 32/* "-" */,-4 ),
	/* State 13 */ new Array( 65/* "$$" */,-27 , 2/* "IF" */,-27 , 4/* "WHILE" */,-27 , 5/* "DO" */,-27 , 6/* "FOR" */,-27 , 8/* "USE" */,-27 , 10/* "DELETE" */,-27 , 9/* "RETURN" */,-27 , 17/* "{" */,-27 , 19/* ";" */,-27 , 44/* "Identifier" */,-27 , 30/* "!" */,-27 , 46/* "Integer" */,-27 , 47/* "Float" */,-27 , 37/* "(" */,-27 , 45/* "String" */,-27 , 7/* "FUNCTION" */,-27 , 13/* "<<" */,-27 , 15/* "[" */,-27 , 11/* "TRUE" */,-27 , 12/* "FALSE" */,-27 , 32/* "-" */,-27 , 3/* "ELSE" */,-27 , 18/* "}" */,-27 ),
	/* State 14 */ new Array( 20/* "=" */,53 ),
	/* State 15 */ new Array( 29/* "&&" */,54 , 28/* "||" */,55 , 19/* ";" */,-38 , 21/* "==" */,-38 , 27/* "<" */,-38 , 26/* ">" */,-38 , 24/* "<=" */,-38 , 25/* ">=" */,-38 , 22/* "!=" */,-38 , 23/* "~=" */,-38 , 2/* "IF" */,-38 , 4/* "WHILE" */,-38 , 5/* "DO" */,-38 , 6/* "FOR" */,-38 , 8/* "USE" */,-38 , 10/* "DELETE" */,-38 , 9/* "RETURN" */,-38 , 17/* "{" */,-38 , 44/* "Identifier" */,-38 , 30/* "!" */,-38 , 46/* "Integer" */,-38 , 47/* "Float" */,-38 , 37/* "(" */,-38 , 45/* "String" */,-38 , 7/* "FUNCTION" */,-38 , 13/* "<<" */,-38 , 15/* "[" */,-38 , 11/* "TRUE" */,-38 , 12/* "FALSE" */,-38 , 32/* "-" */,-38 , 38/* ")" */,-38 , 16/* "]" */,-38 , 39/* "," */,-38 , 14/* ">>" */,-38 ),
	/* State 16 */ new Array( 43/* "." */,56 , 37/* "(" */,57 , 15/* "[" */,58 , 36/* "^" */,-53 , 19/* ";" */,-53 , 21/* "==" */,-53 , 27/* "<" */,-53 , 26/* ">" */,-53 , 24/* "<=" */,-53 , 25/* ">=" */,-53 , 22/* "!=" */,-53 , 23/* "~=" */,-53 , 28/* "||" */,-53 , 29/* "&&" */,-53 , 32/* "-" */,-53 , 31/* "+" */,-53 , 35/* "*" */,-53 , 33/* "/" */,-53 , 34/* "%" */,-53 ),
	/* State 17 */ new Array( 20/* "=" */,-30 , 43/* "." */,-61 , 15/* "[" */,-61 , 37/* "(" */,-61 , 36/* "^" */,-61 , 19/* ";" */,-61 , 21/* "==" */,-61 , 27/* "<" */,-61 , 26/* ">" */,-61 , 24/* "<=" */,-61 , 25/* ">=" */,-61 , 22/* "!=" */,-61 , 23/* "~=" */,-61 , 28/* "||" */,-61 , 29/* "&&" */,-61 , 32/* "-" */,-61 , 31/* "+" */,-61 , 35/* "*" */,-61 , 33/* "/" */,-61 , 34/* "%" */,-61 ),
	/* State 18 */ new Array( 30/* "!" */,18 , 32/* "-" */,33 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 44/* "Identifier" */,36 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 ),
	/* State 19 */ new Array( 31/* "+" */,60 , 32/* "-" */,61 , 19/* ";" */,-42 , 21/* "==" */,-42 , 27/* "<" */,-42 , 26/* ">" */,-42 , 24/* "<=" */,-42 , 25/* ">=" */,-42 , 22/* "!=" */,-42 , 23/* "~=" */,-42 , 28/* "||" */,-42 , 29/* "&&" */,-42 , 2/* "IF" */,-42 , 4/* "WHILE" */,-42 , 5/* "DO" */,-42 , 6/* "FOR" */,-42 , 8/* "USE" */,-42 , 10/* "DELETE" */,-42 , 9/* "RETURN" */,-42 , 17/* "{" */,-42 , 44/* "Identifier" */,-42 , 30/* "!" */,-42 , 46/* "Integer" */,-42 , 47/* "Float" */,-42 , 37/* "(" */,-42 , 45/* "String" */,-42 , 7/* "FUNCTION" */,-42 , 13/* "<<" */,-42 , 15/* "[" */,-42 , 11/* "TRUE" */,-42 , 12/* "FALSE" */,-42 , 38/* ")" */,-42 , 16/* "]" */,-42 , 39/* "," */,-42 , 14/* ">>" */,-42 ),
	/* State 20 */ new Array( 43/* "." */,-58 , 15/* "[" */,-58 , 37/* "(" */,-58 , 36/* "^" */,-58 , 19/* ";" */,-58 , 21/* "==" */,-58 , 27/* "<" */,-58 , 26/* ">" */,-58 , 24/* "<=" */,-58 , 25/* ">=" */,-58 , 22/* "!=" */,-58 , 23/* "~=" */,-58 , 28/* "||" */,-58 , 29/* "&&" */,-58 , 32/* "-" */,-58 , 31/* "+" */,-58 , 35/* "*" */,-58 , 33/* "/" */,-58 , 34/* "%" */,-58 , 2/* "IF" */,-58 , 4/* "WHILE" */,-58 , 5/* "DO" */,-58 , 6/* "FOR" */,-58 , 8/* "USE" */,-58 , 10/* "DELETE" */,-58 , 9/* "RETURN" */,-58 , 17/* "{" */,-58 , 44/* "Identifier" */,-58 , 30/* "!" */,-58 , 46/* "Integer" */,-58 , 47/* "Float" */,-58 , 45/* "String" */,-58 , 7/* "FUNCTION" */,-58 , 13/* "<<" */,-58 , 11/* "TRUE" */,-58 , 12/* "FALSE" */,-58 , 38/* ")" */,-58 , 16/* "]" */,-58 , 39/* "," */,-58 , 14/* ">>" */,-58 ),
	/* State 21 */ new Array( 34/* "%" */,62 , 33/* "/" */,63 , 35/* "*" */,64 , 19/* ";" */,-45 , 21/* "==" */,-45 , 27/* "<" */,-45 , 26/* ">" */,-45 , 24/* "<=" */,-45 , 25/* ">=" */,-45 , 22/* "!=" */,-45 , 23/* "~=" */,-45 , 28/* "||" */,-45 , 29/* "&&" */,-45 , 32/* "-" */,-45 , 31/* "+" */,-45 , 2/* "IF" */,-45 , 4/* "WHILE" */,-45 , 5/* "DO" */,-45 , 6/* "FOR" */,-45 , 8/* "USE" */,-45 , 10/* "DELETE" */,-45 , 9/* "RETURN" */,-45 , 17/* "{" */,-45 , 44/* "Identifier" */,-45 , 30/* "!" */,-45 , 46/* "Integer" */,-45 , 47/* "Float" */,-45 , 37/* "(" */,-45 , 45/* "String" */,-45 , 7/* "FUNCTION" */,-45 , 13/* "<<" */,-45 , 15/* "[" */,-45 , 11/* "TRUE" */,-45 , 12/* "FALSE" */,-45 , 38/* ")" */,-45 , 16/* "]" */,-45 , 39/* "," */,-45 , 14/* ">>" */,-45 ),
	/* State 22 */ new Array( 43/* "." */,-59 , 15/* "[" */,-59 , 37/* "(" */,-59 , 36/* "^" */,-59 , 19/* ";" */,-59 , 21/* "==" */,-59 , 27/* "<" */,-59 , 26/* ">" */,-59 , 24/* "<=" */,-59 , 25/* ">=" */,-59 , 22/* "!=" */,-59 , 23/* "~=" */,-59 , 28/* "||" */,-59 , 29/* "&&" */,-59 , 32/* "-" */,-59 , 31/* "+" */,-59 , 35/* "*" */,-59 , 33/* "/" */,-59 , 34/* "%" */,-59 , 2/* "IF" */,-59 , 4/* "WHILE" */,-59 , 5/* "DO" */,-59 , 6/* "FOR" */,-59 , 8/* "USE" */,-59 , 10/* "DELETE" */,-59 , 9/* "RETURN" */,-59 , 17/* "{" */,-59 , 44/* "Identifier" */,-59 , 30/* "!" */,-59 , 46/* "Integer" */,-59 , 47/* "Float" */,-59 , 45/* "String" */,-59 , 7/* "FUNCTION" */,-59 , 13/* "<<" */,-59 , 11/* "TRUE" */,-59 , 12/* "FALSE" */,-59 , 38/* ")" */,-59 , 16/* "]" */,-59 , 39/* "," */,-59 , 14/* ">>" */,-59 ),
	/* State 23 */ new Array( 43/* "." */,-60 , 15/* "[" */,-60 , 37/* "(" */,-60 , 36/* "^" */,-60 , 19/* ";" */,-60 , 21/* "==" */,-60 , 27/* "<" */,-60 , 26/* ">" */,-60 , 24/* "<=" */,-60 , 25/* ">=" */,-60 , 22/* "!=" */,-60 , 23/* "~=" */,-60 , 28/* "||" */,-60 , 29/* "&&" */,-60 , 32/* "-" */,-60 , 31/* "+" */,-60 , 35/* "*" */,-60 , 33/* "/" */,-60 , 34/* "%" */,-60 , 2/* "IF" */,-60 , 4/* "WHILE" */,-60 , 5/* "DO" */,-60 , 6/* "FOR" */,-60 , 8/* "USE" */,-60 , 10/* "DELETE" */,-60 , 9/* "RETURN" */,-60 , 17/* "{" */,-60 , 44/* "Identifier" */,-60 , 30/* "!" */,-60 , 46/* "Integer" */,-60 , 47/* "Float" */,-60 , 45/* "String" */,-60 , 7/* "FUNCTION" */,-60 , 13/* "<<" */,-60 , 11/* "TRUE" */,-60 , 12/* "FALSE" */,-60 , 38/* ")" */,-60 , 16/* "]" */,-60 , 39/* "," */,-60 , 14/* ">>" */,-60 ),
	/* State 24 */ new Array( 30/* "!" */,18 , 32/* "-" */,33 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 44/* "Identifier" */,36 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 ),
	/* State 25 */ new Array( 43/* "." */,-63 , 15/* "[" */,-63 , 37/* "(" */,-63 , 36/* "^" */,-63 , 19/* ";" */,-63 , 21/* "==" */,-63 , 27/* "<" */,-63 , 26/* ">" */,-63 , 24/* "<=" */,-63 , 25/* ">=" */,-63 , 22/* "!=" */,-63 , 23/* "~=" */,-63 , 28/* "||" */,-63 , 29/* "&&" */,-63 , 32/* "-" */,-63 , 31/* "+" */,-63 , 35/* "*" */,-63 , 33/* "/" */,-63 , 34/* "%" */,-63 , 2/* "IF" */,-63 , 4/* "WHILE" */,-63 , 5/* "DO" */,-63 , 6/* "FOR" */,-63 , 8/* "USE" */,-63 , 10/* "DELETE" */,-63 , 9/* "RETURN" */,-63 , 17/* "{" */,-63 , 44/* "Identifier" */,-63 , 30/* "!" */,-63 , 46/* "Integer" */,-63 , 47/* "Float" */,-63 , 45/* "String" */,-63 , 7/* "FUNCTION" */,-63 , 13/* "<<" */,-63 , 11/* "TRUE" */,-63 , 12/* "FALSE" */,-63 , 38/* ")" */,-63 , 16/* "]" */,-63 , 39/* "," */,-63 , 14/* ">>" */,-63 ),
	/* State 26 */ new Array( 37/* "(" */,66 ),
	/* State 27 */ new Array( 44/* "Identifier" */,69 , 14/* ">>" */,-10 , 39/* "," */,-10 ),
	/* State 28 */ new Array( 30/* "!" */,18 , 32/* "-" */,33 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 44/* "Identifier" */,36 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 , 16/* "]" */,-7 , 39/* "," */,-7 ),
	/* State 29 */ new Array( 43/* "." */,-67 , 15/* "[" */,-67 , 37/* "(" */,-67 , 36/* "^" */,-67 , 19/* ";" */,-67 , 21/* "==" */,-67 , 27/* "<" */,-67 , 26/* ">" */,-67 , 24/* "<=" */,-67 , 25/* ">=" */,-67 , 22/* "!=" */,-67 , 23/* "~=" */,-67 , 28/* "||" */,-67 , 29/* "&&" */,-67 , 32/* "-" */,-67 , 31/* "+" */,-67 , 35/* "*" */,-67 , 33/* "/" */,-67 , 34/* "%" */,-67 , 2/* "IF" */,-67 , 4/* "WHILE" */,-67 , 5/* "DO" */,-67 , 6/* "FOR" */,-67 , 8/* "USE" */,-67 , 10/* "DELETE" */,-67 , 9/* "RETURN" */,-67 , 17/* "{" */,-67 , 44/* "Identifier" */,-67 , 30/* "!" */,-67 , 46/* "Integer" */,-67 , 47/* "Float" */,-67 , 45/* "String" */,-67 , 7/* "FUNCTION" */,-67 , 13/* "<<" */,-67 , 11/* "TRUE" */,-67 , 12/* "FALSE" */,-67 , 38/* ")" */,-67 , 16/* "]" */,-67 , 39/* "," */,-67 , 14/* ">>" */,-67 ),
	/* State 30 */ new Array( 43/* "." */,-68 , 15/* "[" */,-68 , 37/* "(" */,-68 , 36/* "^" */,-68 , 19/* ";" */,-68 , 21/* "==" */,-68 , 27/* "<" */,-68 , 26/* ">" */,-68 , 24/* "<=" */,-68 , 25/* ">=" */,-68 , 22/* "!=" */,-68 , 23/* "~=" */,-68 , 28/* "||" */,-68 , 29/* "&&" */,-68 , 32/* "-" */,-68 , 31/* "+" */,-68 , 35/* "*" */,-68 , 33/* "/" */,-68 , 34/* "%" */,-68 , 2/* "IF" */,-68 , 4/* "WHILE" */,-68 , 5/* "DO" */,-68 , 6/* "FOR" */,-68 , 8/* "USE" */,-68 , 10/* "DELETE" */,-68 , 9/* "RETURN" */,-68 , 17/* "{" */,-68 , 44/* "Identifier" */,-68 , 30/* "!" */,-68 , 46/* "Integer" */,-68 , 47/* "Float" */,-68 , 45/* "String" */,-68 , 7/* "FUNCTION" */,-68 , 13/* "<<" */,-68 , 11/* "TRUE" */,-68 , 12/* "FALSE" */,-68 , 38/* ")" */,-68 , 16/* "]" */,-68 , 39/* "," */,-68 , 14/* ">>" */,-68 ),
	/* State 31 */ new Array( 19/* ";" */,-49 , 21/* "==" */,-49 , 27/* "<" */,-49 , 26/* ">" */,-49 , 24/* "<=" */,-49 , 25/* ">=" */,-49 , 22/* "!=" */,-49 , 23/* "~=" */,-49 , 28/* "||" */,-49 , 29/* "&&" */,-49 , 32/* "-" */,-49 , 31/* "+" */,-49 , 35/* "*" */,-49 , 33/* "/" */,-49 , 34/* "%" */,-49 , 2/* "IF" */,-49 , 4/* "WHILE" */,-49 , 5/* "DO" */,-49 , 6/* "FOR" */,-49 , 8/* "USE" */,-49 , 10/* "DELETE" */,-49 , 9/* "RETURN" */,-49 , 17/* "{" */,-49 , 44/* "Identifier" */,-49 , 30/* "!" */,-49 , 46/* "Integer" */,-49 , 47/* "Float" */,-49 , 37/* "(" */,-49 , 45/* "String" */,-49 , 7/* "FUNCTION" */,-49 , 13/* "<<" */,-49 , 15/* "[" */,-49 , 11/* "TRUE" */,-49 , 12/* "FALSE" */,-49 , 38/* ")" */,-49 , 16/* "]" */,-49 , 39/* "," */,-49 , 14/* ">>" */,-49 ),
	/* State 32 */ new Array( 36/* "^" */,72 , 19/* ";" */,-51 , 21/* "==" */,-51 , 27/* "<" */,-51 , 26/* ">" */,-51 , 24/* "<=" */,-51 , 25/* ">=" */,-51 , 22/* "!=" */,-51 , 23/* "~=" */,-51 , 28/* "||" */,-51 , 29/* "&&" */,-51 , 32/* "-" */,-51 , 31/* "+" */,-51 , 35/* "*" */,-51 , 33/* "/" */,-51 , 34/* "%" */,-51 , 2/* "IF" */,-51 , 4/* "WHILE" */,-51 , 5/* "DO" */,-51 , 6/* "FOR" */,-51 , 8/* "USE" */,-51 , 10/* "DELETE" */,-51 , 9/* "RETURN" */,-51 , 17/* "{" */,-51 , 44/* "Identifier" */,-51 , 30/* "!" */,-51 , 46/* "Integer" */,-51 , 47/* "Float" */,-51 , 37/* "(" */,-51 , 45/* "String" */,-51 , 7/* "FUNCTION" */,-51 , 13/* "<<" */,-51 , 15/* "[" */,-51 , 11/* "TRUE" */,-51 , 12/* "FALSE" */,-51 , 38/* ")" */,-51 , 16/* "]" */,-51 , 39/* "," */,-51 , 14/* ">>" */,-51 ),
	/* State 33 */ new Array( 46/* "Integer" */,22 , 47/* "Float" */,23 , 44/* "Identifier" */,36 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 ),
	/* State 34 */ new Array( 23/* "~=" */,44 , 22/* "!=" */,45 , 25/* ">=" */,46 , 24/* "<=" */,47 , 26/* ">" */,48 , 27/* "<" */,49 , 21/* "==" */,50 , 2/* "IF" */,3 , 4/* "WHILE" */,4 , 5/* "DO" */,5 , 6/* "FOR" */,6 , 8/* "USE" */,7 , 10/* "DELETE" */,8 , 9/* "RETURN" */,9 , 17/* "{" */,12 , 19/* ";" */,13 , 44/* "Identifier" */,17 , 30/* "!" */,18 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 , 32/* "-" */,33 ),
	/* State 35 */ new Array( 43/* "." */,75 , 37/* "(" */,57 , 15/* "[" */,76 , 36/* "^" */,-53 , 2/* "IF" */,-53 , 4/* "WHILE" */,-53 , 5/* "DO" */,-53 , 6/* "FOR" */,-53 , 8/* "USE" */,-53 , 10/* "DELETE" */,-53 , 9/* "RETURN" */,-53 , 17/* "{" */,-53 , 19/* ";" */,-53 , 44/* "Identifier" */,-53 , 30/* "!" */,-53 , 46/* "Integer" */,-53 , 47/* "Float" */,-53 , 45/* "String" */,-53 , 7/* "FUNCTION" */,-53 , 13/* "<<" */,-53 , 11/* "TRUE" */,-53 , 12/* "FALSE" */,-53 , 32/* "-" */,-53 , 21/* "==" */,-53 , 27/* "<" */,-53 , 26/* ">" */,-53 , 24/* "<=" */,-53 , 25/* ">=" */,-53 , 22/* "!=" */,-53 , 23/* "~=" */,-53 , 28/* "||" */,-53 , 29/* "&&" */,-53 , 31/* "+" */,-53 , 35/* "*" */,-53 , 33/* "/" */,-53 , 34/* "%" */,-53 , 38/* ")" */,-53 , 16/* "]" */,-53 , 39/* "," */,-53 , 14/* ">>" */,-53 ),
	/* State 36 */ new Array( 36/* "^" */,-61 , 2/* "IF" */,-61 , 4/* "WHILE" */,-61 , 5/* "DO" */,-61 , 6/* "FOR" */,-61 , 8/* "USE" */,-61 , 10/* "DELETE" */,-61 , 9/* "RETURN" */,-61 , 17/* "{" */,-61 , 19/* ";" */,-61 , 44/* "Identifier" */,-61 , 30/* "!" */,-61 , 46/* "Integer" */,-61 , 47/* "Float" */,-61 , 37/* "(" */,-61 , 45/* "String" */,-61 , 7/* "FUNCTION" */,-61 , 13/* "<<" */,-61 , 15/* "[" */,-61 , 11/* "TRUE" */,-61 , 12/* "FALSE" */,-61 , 32/* "-" */,-61 , 21/* "==" */,-61 , 27/* "<" */,-61 , 26/* ">" */,-61 , 24/* "<=" */,-61 , 25/* ">=" */,-61 , 22/* "!=" */,-61 , 23/* "~=" */,-61 , 28/* "||" */,-61 , 29/* "&&" */,-61 , 31/* "+" */,-61 , 35/* "*" */,-61 , 33/* "/" */,-61 , 34/* "%" */,-61 , 43/* "." */,-61 , 38/* ")" */,-61 , 16/* "]" */,-61 , 39/* "," */,-61 , 14/* ">>" */,-61 ),
	/* State 37 */ new Array( 23/* "~=" */,44 , 22/* "!=" */,45 , 25/* ">=" */,46 , 24/* "<=" */,47 , 26/* ">" */,48 , 27/* "<" */,49 , 21/* "==" */,50 , 2/* "IF" */,3 , 4/* "WHILE" */,4 , 5/* "DO" */,5 , 6/* "FOR" */,6 , 8/* "USE" */,7 , 10/* "DELETE" */,8 , 9/* "RETURN" */,9 , 17/* "{" */,12 , 19/* ";" */,13 , 44/* "Identifier" */,17 , 30/* "!" */,18 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 , 32/* "-" */,33 ),
	/* State 38 */ new Array( 4/* "WHILE" */,78 ),
	/* State 39 */ new Array( 44/* "Identifier" */,17 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 ),
	/* State 40 */ new Array( 19/* ";" */,81 ),
	/* State 41 */ new Array( 65/* "$$" */,-22 , 2/* "IF" */,-22 , 4/* "WHILE" */,-22 , 5/* "DO" */,-22 , 6/* "FOR" */,-22 , 8/* "USE" */,-22 , 10/* "DELETE" */,-22 , 9/* "RETURN" */,-22 , 17/* "{" */,-22 , 19/* ";" */,-22 , 44/* "Identifier" */,-22 , 30/* "!" */,-22 , 46/* "Integer" */,-22 , 47/* "Float" */,-22 , 37/* "(" */,-22 , 45/* "String" */,-22 , 7/* "FUNCTION" */,-22 , 13/* "<<" */,-22 , 15/* "[" */,-22 , 11/* "TRUE" */,-22 , 12/* "FALSE" */,-22 , 32/* "-" */,-22 , 3/* "ELSE" */,-22 , 18/* "}" */,-22 ),
	/* State 42 */ new Array( 65/* "$$" */,-23 , 2/* "IF" */,-23 , 4/* "WHILE" */,-23 , 5/* "DO" */,-23 , 6/* "FOR" */,-23 , 8/* "USE" */,-23 , 10/* "DELETE" */,-23 , 9/* "RETURN" */,-23 , 17/* "{" */,-23 , 19/* ";" */,-23 , 44/* "Identifier" */,-23 , 30/* "!" */,-23 , 46/* "Integer" */,-23 , 47/* "Float" */,-23 , 37/* "(" */,-23 , 45/* "String" */,-23 , 7/* "FUNCTION" */,-23 , 13/* "<<" */,-23 , 15/* "[" */,-23 , 11/* "TRUE" */,-23 , 12/* "FALSE" */,-23 , 32/* "-" */,-23 , 3/* "ELSE" */,-23 , 18/* "}" */,-23 ),
	/* State 43 */ new Array( 65/* "$$" */,-24 , 2/* "IF" */,-24 , 4/* "WHILE" */,-24 , 5/* "DO" */,-24 , 6/* "FOR" */,-24 , 8/* "USE" */,-24 , 10/* "DELETE" */,-24 , 9/* "RETURN" */,-24 , 17/* "{" */,-24 , 19/* ";" */,-24 , 44/* "Identifier" */,-24 , 30/* "!" */,-24 , 46/* "Integer" */,-24 , 47/* "Float" */,-24 , 37/* "(" */,-24 , 45/* "String" */,-24 , 7/* "FUNCTION" */,-24 , 13/* "<<" */,-24 , 15/* "[" */,-24 , 11/* "TRUE" */,-24 , 12/* "FALSE" */,-24 , 32/* "-" */,-24 , 3/* "ELSE" */,-24 , 18/* "}" */,-24 ),
	/* State 44 */ new Array( 30/* "!" */,18 , 32/* "-" */,33 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 44/* "Identifier" */,36 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 ),
	/* State 45 */ new Array( 30/* "!" */,18 , 32/* "-" */,33 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 44/* "Identifier" */,36 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 ),
	/* State 46 */ new Array( 30/* "!" */,18 , 32/* "-" */,33 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 44/* "Identifier" */,36 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 ),
	/* State 47 */ new Array( 30/* "!" */,18 , 32/* "-" */,33 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 44/* "Identifier" */,36 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 ),
	/* State 48 */ new Array( 30/* "!" */,18 , 32/* "-" */,33 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 44/* "Identifier" */,36 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 ),
	/* State 49 */ new Array( 30/* "!" */,18 , 32/* "-" */,33 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 44/* "Identifier" */,36 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 ),
	/* State 50 */ new Array( 30/* "!" */,18 , 32/* "-" */,33 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 44/* "Identifier" */,36 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 ),
	/* State 51 */ new Array( 65/* "$$" */,-25 , 2/* "IF" */,-25 , 4/* "WHILE" */,-25 , 5/* "DO" */,-25 , 6/* "FOR" */,-25 , 8/* "USE" */,-25 , 10/* "DELETE" */,-25 , 9/* "RETURN" */,-25 , 17/* "{" */,-25 , 19/* ";" */,-25 , 44/* "Identifier" */,-25 , 30/* "!" */,-25 , 46/* "Integer" */,-25 , 47/* "Float" */,-25 , 37/* "(" */,-25 , 45/* "String" */,-25 , 7/* "FUNCTION" */,-25 , 13/* "<<" */,-25 , 15/* "[" */,-25 , 11/* "TRUE" */,-25 , 12/* "FALSE" */,-25 , 32/* "-" */,-25 , 3/* "ELSE" */,-25 , 18/* "}" */,-25 ),
	/* State 52 */ new Array( 18/* "}" */,90 , 2/* "IF" */,3 , 4/* "WHILE" */,4 , 5/* "DO" */,5 , 6/* "FOR" */,6 , 8/* "USE" */,7 , 10/* "DELETE" */,8 , 9/* "RETURN" */,9 , 17/* "{" */,12 , 19/* ";" */,13 , 44/* "Identifier" */,17 , 30/* "!" */,18 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 , 32/* "-" */,33 ),
	/* State 53 */ new Array( 30/* "!" */,18 , 32/* "-" */,33 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 44/* "Identifier" */,36 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 ),
	/* State 54 */ new Array( 32/* "-" */,33 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 44/* "Identifier" */,36 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 ),
	/* State 55 */ new Array( 32/* "-" */,33 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 44/* "Identifier" */,36 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 ),
	/* State 56 */ new Array( 44/* "Identifier" */,94 ),
	/* State 57 */ new Array( 30/* "!" */,18 , 32/* "-" */,33 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 44/* "Identifier" */,36 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 , 38/* ")" */,-7 , 39/* "," */,-7 ),
	/* State 58 */ new Array( 32/* "-" */,33 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 44/* "Identifier" */,36 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 ),
	/* State 59 */ new Array( 29/* "&&" */,54 , 28/* "||" */,55 , 19/* ";" */,-41 , 21/* "==" */,-41 , 27/* "<" */,-41 , 26/* ">" */,-41 , 24/* "<=" */,-41 , 25/* ">=" */,-41 , 22/* "!=" */,-41 , 23/* "~=" */,-41 , 2/* "IF" */,-41 , 4/* "WHILE" */,-41 , 5/* "DO" */,-41 , 6/* "FOR" */,-41 , 8/* "USE" */,-41 , 10/* "DELETE" */,-41 , 9/* "RETURN" */,-41 , 17/* "{" */,-41 , 44/* "Identifier" */,-41 , 30/* "!" */,-41 , 46/* "Integer" */,-41 , 47/* "Float" */,-41 , 37/* "(" */,-41 , 45/* "String" */,-41 , 7/* "FUNCTION" */,-41 , 13/* "<<" */,-41 , 15/* "[" */,-41 , 11/* "TRUE" */,-41 , 12/* "FALSE" */,-41 , 32/* "-" */,-41 , 38/* ")" */,-41 , 16/* "]" */,-41 , 39/* "," */,-41 , 14/* ">>" */,-41 ),
	/* State 60 */ new Array( 32/* "-" */,33 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 44/* "Identifier" */,36 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 ),
	/* State 61 */ new Array( 32/* "-" */,33 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 44/* "Identifier" */,36 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 ),
	/* State 62 */ new Array( 32/* "-" */,33 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 44/* "Identifier" */,36 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 ),
	/* State 63 */ new Array( 32/* "-" */,33 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 44/* "Identifier" */,36 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 ),
	/* State 64 */ new Array( 32/* "-" */,33 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 44/* "Identifier" */,36 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 ),
	/* State 65 */ new Array( 23/* "~=" */,44 , 22/* "!=" */,45 , 25/* ">=" */,46 , 24/* "<=" */,47 , 26/* ">" */,48 , 27/* "<" */,49 , 21/* "==" */,50 , 38/* ")" */,102 ),
	/* State 66 */ new Array( 44/* "Identifier" */,104 , 38/* ")" */,-14 , 39/* "," */,-14 ),
	/* State 67 */ new Array( 39/* "," */,105 , 14/* ">>" */,106 ),
	/* State 68 */ new Array( 14/* ">>" */,-9 , 39/* "," */,-9 ),
	/* State 69 */ new Array( 41/* ":" */,107 ),
	/* State 70 */ new Array( 39/* "," */,108 , 16/* "]" */,109 ),
	/* State 71 */ new Array( 23/* "~=" */,44 , 22/* "!=" */,45 , 25/* ">=" */,46 , 24/* "<=" */,47 , 26/* ">" */,48 , 27/* "<" */,49 , 21/* "==" */,50 , 16/* "]" */,-6 , 39/* "," */,-6 , 38/* ")" */,-6 ),
	/* State 72 */ new Array( 32/* "-" */,33 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 44/* "Identifier" */,36 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 ),
	/* State 73 */ new Array( 43/* "." */,75 , 37/* "(" */,57 , 15/* "[" */,76 , 36/* "^" */,-52 , 19/* ";" */,-52 , 21/* "==" */,-52 , 27/* "<" */,-52 , 26/* ">" */,-52 , 24/* "<=" */,-52 , 25/* ">=" */,-52 , 22/* "!=" */,-52 , 23/* "~=" */,-52 , 28/* "||" */,-52 , 29/* "&&" */,-52 , 32/* "-" */,-52 , 31/* "+" */,-52 , 35/* "*" */,-52 , 33/* "/" */,-52 , 34/* "%" */,-52 , 2/* "IF" */,-52 , 4/* "WHILE" */,-52 , 5/* "DO" */,-52 , 6/* "FOR" */,-52 , 8/* "USE" */,-52 , 10/* "DELETE" */,-52 , 9/* "RETURN" */,-52 , 17/* "{" */,-52 , 44/* "Identifier" */,-52 , 30/* "!" */,-52 , 46/* "Integer" */,-52 , 47/* "Float" */,-52 , 45/* "String" */,-52 , 7/* "FUNCTION" */,-52 , 13/* "<<" */,-52 , 11/* "TRUE" */,-52 , 12/* "FALSE" */,-52 , 38/* ")" */,-52 , 16/* "]" */,-52 , 39/* "," */,-52 , 14/* ">>" */,-52 ),
	/* State 74 */ new Array( 3/* "ELSE" */,111 , 65/* "$$" */,-16 , 2/* "IF" */,-16 , 4/* "WHILE" */,-16 , 5/* "DO" */,-16 , 6/* "FOR" */,-16 , 8/* "USE" */,-16 , 10/* "DELETE" */,-16 , 9/* "RETURN" */,-16 , 17/* "{" */,-16 , 19/* ";" */,-16 , 44/* "Identifier" */,-16 , 30/* "!" */,-16 , 46/* "Integer" */,-16 , 47/* "Float" */,-16 , 37/* "(" */,-16 , 45/* "String" */,-16 , 7/* "FUNCTION" */,-16 , 13/* "<<" */,-16 , 15/* "[" */,-16 , 11/* "TRUE" */,-16 , 12/* "FALSE" */,-16 , 32/* "-" */,-16 , 18/* "}" */,-16 ),
	/* State 75 */ new Array( 44/* "Identifier" */,112 ),
	/* State 76 */ new Array( 32/* "-" */,33 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 44/* "Identifier" */,36 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 ),
	/* State 77 */ new Array( 65/* "$$" */,-18 , 2/* "IF" */,-18 , 4/* "WHILE" */,-18 , 5/* "DO" */,-18 , 6/* "FOR" */,-18 , 8/* "USE" */,-18 , 10/* "DELETE" */,-18 , 9/* "RETURN" */,-18 , 17/* "{" */,-18 , 19/* ";" */,-18 , 44/* "Identifier" */,-18 , 30/* "!" */,-18 , 46/* "Integer" */,-18 , 47/* "Float" */,-18 , 37/* "(" */,-18 , 45/* "String" */,-18 , 7/* "FUNCTION" */,-18 , 13/* "<<" */,-18 , 15/* "[" */,-18 , 11/* "TRUE" */,-18 , 12/* "FALSE" */,-18 , 32/* "-" */,-18 , 3/* "ELSE" */,-18 , 18/* "}" */,-18 ),
	/* State 78 */ new Array( 30/* "!" */,18 , 32/* "-" */,33 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 44/* "Identifier" */,36 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 ),
	/* State 79 */ new Array( 19/* ";" */,115 ),
	/* State 80 */ new Array( 43/* "." */,56 , 37/* "(" */,57 , 15/* "[" */,58 ),
	/* State 81 */ new Array( 65/* "$$" */,-21 , 2/* "IF" */,-21 , 4/* "WHILE" */,-21 , 5/* "DO" */,-21 , 6/* "FOR" */,-21 , 8/* "USE" */,-21 , 10/* "DELETE" */,-21 , 9/* "RETURN" */,-21 , 17/* "{" */,-21 , 19/* ";" */,-21 , 44/* "Identifier" */,-21 , 30/* "!" */,-21 , 46/* "Integer" */,-21 , 47/* "Float" */,-21 , 37/* "(" */,-21 , 45/* "String" */,-21 , 7/* "FUNCTION" */,-21 , 13/* "<<" */,-21 , 15/* "[" */,-21 , 11/* "TRUE" */,-21 , 12/* "FALSE" */,-21 , 32/* "-" */,-21 , 3/* "ELSE" */,-21 , 18/* "}" */,-21 ),
	/* State 82 */ new Array( 29/* "&&" */,54 , 28/* "||" */,55 , 19/* ";" */,-37 , 21/* "==" */,-37 , 27/* "<" */,-37 , 26/* ">" */,-37 , 24/* "<=" */,-37 , 25/* ">=" */,-37 , 22/* "!=" */,-37 , 23/* "~=" */,-37 , 2/* "IF" */,-37 , 4/* "WHILE" */,-37 , 5/* "DO" */,-37 , 6/* "FOR" */,-37 , 8/* "USE" */,-37 , 10/* "DELETE" */,-37 , 9/* "RETURN" */,-37 , 17/* "{" */,-37 , 44/* "Identifier" */,-37 , 30/* "!" */,-37 , 46/* "Integer" */,-37 , 47/* "Float" */,-37 , 37/* "(" */,-37 , 45/* "String" */,-37 , 7/* "FUNCTION" */,-37 , 13/* "<<" */,-37 , 15/* "[" */,-37 , 11/* "TRUE" */,-37 , 12/* "FALSE" */,-37 , 32/* "-" */,-37 , 38/* ")" */,-37 , 16/* "]" */,-37 , 39/* "," */,-37 , 14/* ">>" */,-37 ),
	/* State 83 */ new Array( 29/* "&&" */,54 , 28/* "||" */,55 , 19/* ";" */,-36 , 21/* "==" */,-36 , 27/* "<" */,-36 , 26/* ">" */,-36 , 24/* "<=" */,-36 , 25/* ">=" */,-36 , 22/* "!=" */,-36 , 23/* "~=" */,-36 , 2/* "IF" */,-36 , 4/* "WHILE" */,-36 , 5/* "DO" */,-36 , 6/* "FOR" */,-36 , 8/* "USE" */,-36 , 10/* "DELETE" */,-36 , 9/* "RETURN" */,-36 , 17/* "{" */,-36 , 44/* "Identifier" */,-36 , 30/* "!" */,-36 , 46/* "Integer" */,-36 , 47/* "Float" */,-36 , 37/* "(" */,-36 , 45/* "String" */,-36 , 7/* "FUNCTION" */,-36 , 13/* "<<" */,-36 , 15/* "[" */,-36 , 11/* "TRUE" */,-36 , 12/* "FALSE" */,-36 , 32/* "-" */,-36 , 38/* ")" */,-36 , 16/* "]" */,-36 , 39/* "," */,-36 , 14/* ">>" */,-36 ),
	/* State 84 */ new Array( 29/* "&&" */,54 , 28/* "||" */,55 , 19/* ";" */,-35 , 21/* "==" */,-35 , 27/* "<" */,-35 , 26/* ">" */,-35 , 24/* "<=" */,-35 , 25/* ">=" */,-35 , 22/* "!=" */,-35 , 23/* "~=" */,-35 , 2/* "IF" */,-35 , 4/* "WHILE" */,-35 , 5/* "DO" */,-35 , 6/* "FOR" */,-35 , 8/* "USE" */,-35 , 10/* "DELETE" */,-35 , 9/* "RETURN" */,-35 , 17/* "{" */,-35 , 44/* "Identifier" */,-35 , 30/* "!" */,-35 , 46/* "Integer" */,-35 , 47/* "Float" */,-35 , 37/* "(" */,-35 , 45/* "String" */,-35 , 7/* "FUNCTION" */,-35 , 13/* "<<" */,-35 , 15/* "[" */,-35 , 11/* "TRUE" */,-35 , 12/* "FALSE" */,-35 , 32/* "-" */,-35 , 38/* ")" */,-35 , 16/* "]" */,-35 , 39/* "," */,-35 , 14/* ">>" */,-35 ),
	/* State 85 */ new Array( 29/* "&&" */,54 , 28/* "||" */,55 , 19/* ";" */,-34 , 21/* "==" */,-34 , 27/* "<" */,-34 , 26/* ">" */,-34 , 24/* "<=" */,-34 , 25/* ">=" */,-34 , 22/* "!=" */,-34 , 23/* "~=" */,-34 , 2/* "IF" */,-34 , 4/* "WHILE" */,-34 , 5/* "DO" */,-34 , 6/* "FOR" */,-34 , 8/* "USE" */,-34 , 10/* "DELETE" */,-34 , 9/* "RETURN" */,-34 , 17/* "{" */,-34 , 44/* "Identifier" */,-34 , 30/* "!" */,-34 , 46/* "Integer" */,-34 , 47/* "Float" */,-34 , 37/* "(" */,-34 , 45/* "String" */,-34 , 7/* "FUNCTION" */,-34 , 13/* "<<" */,-34 , 15/* "[" */,-34 , 11/* "TRUE" */,-34 , 12/* "FALSE" */,-34 , 32/* "-" */,-34 , 38/* ")" */,-34 , 16/* "]" */,-34 , 39/* "," */,-34 , 14/* ">>" */,-34 ),
	/* State 86 */ new Array( 29/* "&&" */,54 , 28/* "||" */,55 , 19/* ";" */,-33 , 21/* "==" */,-33 , 27/* "<" */,-33 , 26/* ">" */,-33 , 24/* "<=" */,-33 , 25/* ">=" */,-33 , 22/* "!=" */,-33 , 23/* "~=" */,-33 , 2/* "IF" */,-33 , 4/* "WHILE" */,-33 , 5/* "DO" */,-33 , 6/* "FOR" */,-33 , 8/* "USE" */,-33 , 10/* "DELETE" */,-33 , 9/* "RETURN" */,-33 , 17/* "{" */,-33 , 44/* "Identifier" */,-33 , 30/* "!" */,-33 , 46/* "Integer" */,-33 , 47/* "Float" */,-33 , 37/* "(" */,-33 , 45/* "String" */,-33 , 7/* "FUNCTION" */,-33 , 13/* "<<" */,-33 , 15/* "[" */,-33 , 11/* "TRUE" */,-33 , 12/* "FALSE" */,-33 , 32/* "-" */,-33 , 38/* ")" */,-33 , 16/* "]" */,-33 , 39/* "," */,-33 , 14/* ">>" */,-33 ),
	/* State 87 */ new Array( 29/* "&&" */,54 , 28/* "||" */,55 , 19/* ";" */,-32 , 21/* "==" */,-32 , 27/* "<" */,-32 , 26/* ">" */,-32 , 24/* "<=" */,-32 , 25/* ">=" */,-32 , 22/* "!=" */,-32 , 23/* "~=" */,-32 , 2/* "IF" */,-32 , 4/* "WHILE" */,-32 , 5/* "DO" */,-32 , 6/* "FOR" */,-32 , 8/* "USE" */,-32 , 10/* "DELETE" */,-32 , 9/* "RETURN" */,-32 , 17/* "{" */,-32 , 44/* "Identifier" */,-32 , 30/* "!" */,-32 , 46/* "Integer" */,-32 , 47/* "Float" */,-32 , 37/* "(" */,-32 , 45/* "String" */,-32 , 7/* "FUNCTION" */,-32 , 13/* "<<" */,-32 , 15/* "[" */,-32 , 11/* "TRUE" */,-32 , 12/* "FALSE" */,-32 , 32/* "-" */,-32 , 38/* ")" */,-32 , 16/* "]" */,-32 , 39/* "," */,-32 , 14/* ">>" */,-32 ),
	/* State 88 */ new Array( 29/* "&&" */,54 , 28/* "||" */,55 , 19/* ";" */,-31 , 21/* "==" */,-31 , 27/* "<" */,-31 , 26/* ">" */,-31 , 24/* "<=" */,-31 , 25/* ">=" */,-31 , 22/* "!=" */,-31 , 23/* "~=" */,-31 , 2/* "IF" */,-31 , 4/* "WHILE" */,-31 , 5/* "DO" */,-31 , 6/* "FOR" */,-31 , 8/* "USE" */,-31 , 10/* "DELETE" */,-31 , 9/* "RETURN" */,-31 , 17/* "{" */,-31 , 44/* "Identifier" */,-31 , 30/* "!" */,-31 , 46/* "Integer" */,-31 , 47/* "Float" */,-31 , 37/* "(" */,-31 , 45/* "String" */,-31 , 7/* "FUNCTION" */,-31 , 13/* "<<" */,-31 , 15/* "[" */,-31 , 11/* "TRUE" */,-31 , 12/* "FALSE" */,-31 , 32/* "-" */,-31 , 38/* ")" */,-31 , 16/* "]" */,-31 , 39/* "," */,-31 , 14/* ">>" */,-31 ),
	/* State 89 */ new Array( 18/* "}" */,-3 , 2/* "IF" */,-3 , 4/* "WHILE" */,-3 , 5/* "DO" */,-3 , 6/* "FOR" */,-3 , 8/* "USE" */,-3 , 10/* "DELETE" */,-3 , 9/* "RETURN" */,-3 , 17/* "{" */,-3 , 19/* ";" */,-3 , 44/* "Identifier" */,-3 , 30/* "!" */,-3 , 46/* "Integer" */,-3 , 47/* "Float" */,-3 , 37/* "(" */,-3 , 45/* "String" */,-3 , 7/* "FUNCTION" */,-3 , 13/* "<<" */,-3 , 15/* "[" */,-3 , 11/* "TRUE" */,-3 , 12/* "FALSE" */,-3 , 32/* "-" */,-3 ),
	/* State 90 */ new Array( 65/* "$$" */,-26 , 2/* "IF" */,-26 , 4/* "WHILE" */,-26 , 5/* "DO" */,-26 , 6/* "FOR" */,-26 , 8/* "USE" */,-26 , 10/* "DELETE" */,-26 , 9/* "RETURN" */,-26 , 17/* "{" */,-26 , 19/* ";" */,-26 , 44/* "Identifier" */,-26 , 30/* "!" */,-26 , 46/* "Integer" */,-26 , 47/* "Float" */,-26 , 37/* "(" */,-26 , 45/* "String" */,-26 , 7/* "FUNCTION" */,-26 , 13/* "<<" */,-26 , 15/* "[" */,-26 , 11/* "TRUE" */,-26 , 12/* "FALSE" */,-26 , 32/* "-" */,-26 , 3/* "ELSE" */,-26 , 18/* "}" */,-26 ),
	/* State 91 */ new Array( 23/* "~=" */,44 , 22/* "!=" */,45 , 25/* ">=" */,46 , 24/* "<=" */,47 , 26/* ">" */,48 , 27/* "<" */,49 , 21/* "==" */,50 , 19/* ";" */,-15 , 38/* ")" */,-15 ),
	/* State 92 */ new Array( 31/* "+" */,60 , 32/* "-" */,61 , 19/* ";" */,-40 , 21/* "==" */,-40 , 27/* "<" */,-40 , 26/* ">" */,-40 , 24/* "<=" */,-40 , 25/* ">=" */,-40 , 22/* "!=" */,-40 , 23/* "~=" */,-40 , 28/* "||" */,-40 , 29/* "&&" */,-40 , 2/* "IF" */,-40 , 4/* "WHILE" */,-40 , 5/* "DO" */,-40 , 6/* "FOR" */,-40 , 8/* "USE" */,-40 , 10/* "DELETE" */,-40 , 9/* "RETURN" */,-40 , 17/* "{" */,-40 , 44/* "Identifier" */,-40 , 30/* "!" */,-40 , 46/* "Integer" */,-40 , 47/* "Float" */,-40 , 37/* "(" */,-40 , 45/* "String" */,-40 , 7/* "FUNCTION" */,-40 , 13/* "<<" */,-40 , 15/* "[" */,-40 , 11/* "TRUE" */,-40 , 12/* "FALSE" */,-40 , 38/* ")" */,-40 , 16/* "]" */,-40 , 39/* "," */,-40 , 14/* ">>" */,-40 ),
	/* State 93 */ new Array( 31/* "+" */,60 , 32/* "-" */,61 , 19/* ";" */,-39 , 21/* "==" */,-39 , 27/* "<" */,-39 , 26/* ">" */,-39 , 24/* "<=" */,-39 , 25/* ">=" */,-39 , 22/* "!=" */,-39 , 23/* "~=" */,-39 , 28/* "||" */,-39 , 29/* "&&" */,-39 , 2/* "IF" */,-39 , 4/* "WHILE" */,-39 , 5/* "DO" */,-39 , 6/* "FOR" */,-39 , 8/* "USE" */,-39 , 10/* "DELETE" */,-39 , 9/* "RETURN" */,-39 , 17/* "{" */,-39 , 44/* "Identifier" */,-39 , 30/* "!" */,-39 , 46/* "Integer" */,-39 , 47/* "Float" */,-39 , 37/* "(" */,-39 , 45/* "String" */,-39 , 7/* "FUNCTION" */,-39 , 13/* "<<" */,-39 , 15/* "[" */,-39 , 11/* "TRUE" */,-39 , 12/* "FALSE" */,-39 , 38/* ")" */,-39 , 16/* "]" */,-39 , 39/* "," */,-39 , 14/* ">>" */,-39 ),
	/* State 94 */ new Array( 20/* "=" */,-28 , 43/* "." */,-57 , 15/* "[" */,-57 , 37/* "(" */,-57 , 36/* "^" */,-57 , 19/* ";" */,-57 , 21/* "==" */,-57 , 27/* "<" */,-57 , 26/* ">" */,-57 , 24/* "<=" */,-57 , 25/* ">=" */,-57 , 22/* "!=" */,-57 , 23/* "~=" */,-57 , 28/* "||" */,-57 , 29/* "&&" */,-57 , 32/* "-" */,-57 , 31/* "+" */,-57 , 35/* "*" */,-57 , 33/* "/" */,-57 , 34/* "%" */,-57 ),
	/* State 95 */ new Array( 39/* "," */,108 , 38/* ")" */,116 ),
	/* State 96 */ new Array( 31/* "+" */,60 , 32/* "-" */,61 , 16/* "]" */,117 ),
	/* State 97 */ new Array( 34/* "%" */,62 , 33/* "/" */,63 , 35/* "*" */,64 , 19/* ";" */,-44 , 21/* "==" */,-44 , 27/* "<" */,-44 , 26/* ">" */,-44 , 24/* "<=" */,-44 , 25/* ">=" */,-44 , 22/* "!=" */,-44 , 23/* "~=" */,-44 , 28/* "||" */,-44 , 29/* "&&" */,-44 , 32/* "-" */,-44 , 31/* "+" */,-44 , 2/* "IF" */,-44 , 4/* "WHILE" */,-44 , 5/* "DO" */,-44 , 6/* "FOR" */,-44 , 8/* "USE" */,-44 , 10/* "DELETE" */,-44 , 9/* "RETURN" */,-44 , 17/* "{" */,-44 , 44/* "Identifier" */,-44 , 30/* "!" */,-44 , 46/* "Integer" */,-44 , 47/* "Float" */,-44 , 37/* "(" */,-44 , 45/* "String" */,-44 , 7/* "FUNCTION" */,-44 , 13/* "<<" */,-44 , 15/* "[" */,-44 , 11/* "TRUE" */,-44 , 12/* "FALSE" */,-44 , 38/* ")" */,-44 , 16/* "]" */,-44 , 39/* "," */,-44 , 14/* ">>" */,-44 ),
	/* State 98 */ new Array( 34/* "%" */,62 , 33/* "/" */,63 , 35/* "*" */,64 , 19/* ";" */,-43 , 21/* "==" */,-43 , 27/* "<" */,-43 , 26/* ">" */,-43 , 24/* "<=" */,-43 , 25/* ">=" */,-43 , 22/* "!=" */,-43 , 23/* "~=" */,-43 , 28/* "||" */,-43 , 29/* "&&" */,-43 , 32/* "-" */,-43 , 31/* "+" */,-43 , 2/* "IF" */,-43 , 4/* "WHILE" */,-43 , 5/* "DO" */,-43 , 6/* "FOR" */,-43 , 8/* "USE" */,-43 , 10/* "DELETE" */,-43 , 9/* "RETURN" */,-43 , 17/* "{" */,-43 , 44/* "Identifier" */,-43 , 30/* "!" */,-43 , 46/* "Integer" */,-43 , 47/* "Float" */,-43 , 37/* "(" */,-43 , 45/* "String" */,-43 , 7/* "FUNCTION" */,-43 , 13/* "<<" */,-43 , 15/* "[" */,-43 , 11/* "TRUE" */,-43 , 12/* "FALSE" */,-43 , 38/* ")" */,-43 , 16/* "]" */,-43 , 39/* "," */,-43 , 14/* ">>" */,-43 ),
	/* State 99 */ new Array( 19/* ";" */,-48 , 21/* "==" */,-48 , 27/* "<" */,-48 , 26/* ">" */,-48 , 24/* "<=" */,-48 , 25/* ">=" */,-48 , 22/* "!=" */,-48 , 23/* "~=" */,-48 , 28/* "||" */,-48 , 29/* "&&" */,-48 , 32/* "-" */,-48 , 31/* "+" */,-48 , 35/* "*" */,-48 , 33/* "/" */,-48 , 34/* "%" */,-48 , 2/* "IF" */,-48 , 4/* "WHILE" */,-48 , 5/* "DO" */,-48 , 6/* "FOR" */,-48 , 8/* "USE" */,-48 , 10/* "DELETE" */,-48 , 9/* "RETURN" */,-48 , 17/* "{" */,-48 , 44/* "Identifier" */,-48 , 30/* "!" */,-48 , 46/* "Integer" */,-48 , 47/* "Float" */,-48 , 37/* "(" */,-48 , 45/* "String" */,-48 , 7/* "FUNCTION" */,-48 , 13/* "<<" */,-48 , 15/* "[" */,-48 , 11/* "TRUE" */,-48 , 12/* "FALSE" */,-48 , 38/* ")" */,-48 , 16/* "]" */,-48 , 39/* "," */,-48 , 14/* ">>" */,-48 ),
	/* State 100 */ new Array( 19/* ";" */,-47 , 21/* "==" */,-47 , 27/* "<" */,-47 , 26/* ">" */,-47 , 24/* "<=" */,-47 , 25/* ">=" */,-47 , 22/* "!=" */,-47 , 23/* "~=" */,-47 , 28/* "||" */,-47 , 29/* "&&" */,-47 , 32/* "-" */,-47 , 31/* "+" */,-47 , 35/* "*" */,-47 , 33/* "/" */,-47 , 34/* "%" */,-47 , 2/* "IF" */,-47 , 4/* "WHILE" */,-47 , 5/* "DO" */,-47 , 6/* "FOR" */,-47 , 8/* "USE" */,-47 , 10/* "DELETE" */,-47 , 9/* "RETURN" */,-47 , 17/* "{" */,-47 , 44/* "Identifier" */,-47 , 30/* "!" */,-47 , 46/* "Integer" */,-47 , 47/* "Float" */,-47 , 37/* "(" */,-47 , 45/* "String" */,-47 , 7/* "FUNCTION" */,-47 , 13/* "<<" */,-47 , 15/* "[" */,-47 , 11/* "TRUE" */,-47 , 12/* "FALSE" */,-47 , 38/* ")" */,-47 , 16/* "]" */,-47 , 39/* "," */,-47 , 14/* ">>" */,-47 ),
	/* State 101 */ new Array( 19/* ";" */,-46 , 21/* "==" */,-46 , 27/* "<" */,-46 , 26/* ">" */,-46 , 24/* "<=" */,-46 , 25/* ">=" */,-46 , 22/* "!=" */,-46 , 23/* "~=" */,-46 , 28/* "||" */,-46 , 29/* "&&" */,-46 , 32/* "-" */,-46 , 31/* "+" */,-46 , 35/* "*" */,-46 , 33/* "/" */,-46 , 34/* "%" */,-46 , 2/* "IF" */,-46 , 4/* "WHILE" */,-46 , 5/* "DO" */,-46 , 6/* "FOR" */,-46 , 8/* "USE" */,-46 , 10/* "DELETE" */,-46 , 9/* "RETURN" */,-46 , 17/* "{" */,-46 , 44/* "Identifier" */,-46 , 30/* "!" */,-46 , 46/* "Integer" */,-46 , 47/* "Float" */,-46 , 37/* "(" */,-46 , 45/* "String" */,-46 , 7/* "FUNCTION" */,-46 , 13/* "<<" */,-46 , 15/* "[" */,-46 , 11/* "TRUE" */,-46 , 12/* "FALSE" */,-46 , 38/* ")" */,-46 , 16/* "]" */,-46 , 39/* "," */,-46 , 14/* ">>" */,-46 ),
	/* State 102 */ new Array( 43/* "." */,-62 , 15/* "[" */,-62 , 37/* "(" */,-62 , 36/* "^" */,-62 , 19/* ";" */,-62 , 21/* "==" */,-62 , 27/* "<" */,-62 , 26/* ">" */,-62 , 24/* "<=" */,-62 , 25/* ">=" */,-62 , 22/* "!=" */,-62 , 23/* "~=" */,-62 , 28/* "||" */,-62 , 29/* "&&" */,-62 , 32/* "-" */,-62 , 31/* "+" */,-62 , 35/* "*" */,-62 , 33/* "/" */,-62 , 34/* "%" */,-62 , 2/* "IF" */,-62 , 4/* "WHILE" */,-62 , 5/* "DO" */,-62 , 6/* "FOR" */,-62 , 8/* "USE" */,-62 , 10/* "DELETE" */,-62 , 9/* "RETURN" */,-62 , 17/* "{" */,-62 , 44/* "Identifier" */,-62 , 30/* "!" */,-62 , 46/* "Integer" */,-62 , 47/* "Float" */,-62 , 45/* "String" */,-62 , 7/* "FUNCTION" */,-62 , 13/* "<<" */,-62 , 11/* "TRUE" */,-62 , 12/* "FALSE" */,-62 , 38/* ")" */,-62 , 16/* "]" */,-62 , 39/* "," */,-62 , 14/* ">>" */,-62 ),
	/* State 103 */ new Array( 39/* "," */,118 , 38/* ")" */,119 ),
	/* State 104 */ new Array( 38/* ")" */,-13 , 39/* "," */,-13 ),
	/* State 105 */ new Array( 44/* "Identifier" */,69 ),
	/* State 106 */ new Array( 43/* "." */,-65 , 15/* "[" */,-65 , 37/* "(" */,-65 , 36/* "^" */,-65 , 19/* ";" */,-65 , 21/* "==" */,-65 , 27/* "<" */,-65 , 26/* ">" */,-65 , 24/* "<=" */,-65 , 25/* ">=" */,-65 , 22/* "!=" */,-65 , 23/* "~=" */,-65 , 28/* "||" */,-65 , 29/* "&&" */,-65 , 32/* "-" */,-65 , 31/* "+" */,-65 , 35/* "*" */,-65 , 33/* "/" */,-65 , 34/* "%" */,-65 , 2/* "IF" */,-65 , 4/* "WHILE" */,-65 , 5/* "DO" */,-65 , 6/* "FOR" */,-65 , 8/* "USE" */,-65 , 10/* "DELETE" */,-65 , 9/* "RETURN" */,-65 , 17/* "{" */,-65 , 44/* "Identifier" */,-65 , 30/* "!" */,-65 , 46/* "Integer" */,-65 , 47/* "Float" */,-65 , 45/* "String" */,-65 , 7/* "FUNCTION" */,-65 , 13/* "<<" */,-65 , 11/* "TRUE" */,-65 , 12/* "FALSE" */,-65 , 38/* ")" */,-65 , 16/* "]" */,-65 , 39/* "," */,-65 , 14/* ">>" */,-65 ),
	/* State 107 */ new Array( 30/* "!" */,18 , 32/* "-" */,33 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 44/* "Identifier" */,36 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 ),
	/* State 108 */ new Array( 30/* "!" */,18 , 32/* "-" */,33 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 44/* "Identifier" */,36 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 ),
	/* State 109 */ new Array( 43/* "." */,-66 , 15/* "[" */,-66 , 37/* "(" */,-66 , 36/* "^" */,-66 , 19/* ";" */,-66 , 21/* "==" */,-66 , 27/* "<" */,-66 , 26/* ">" */,-66 , 24/* "<=" */,-66 , 25/* ">=" */,-66 , 22/* "!=" */,-66 , 23/* "~=" */,-66 , 28/* "||" */,-66 , 29/* "&&" */,-66 , 32/* "-" */,-66 , 31/* "+" */,-66 , 35/* "*" */,-66 , 33/* "/" */,-66 , 34/* "%" */,-66 , 2/* "IF" */,-66 , 4/* "WHILE" */,-66 , 5/* "DO" */,-66 , 6/* "FOR" */,-66 , 8/* "USE" */,-66 , 10/* "DELETE" */,-66 , 9/* "RETURN" */,-66 , 17/* "{" */,-66 , 44/* "Identifier" */,-66 , 30/* "!" */,-66 , 46/* "Integer" */,-66 , 47/* "Float" */,-66 , 45/* "String" */,-66 , 7/* "FUNCTION" */,-66 , 13/* "<<" */,-66 , 11/* "TRUE" */,-66 , 12/* "FALSE" */,-66 , 38/* ")" */,-66 , 16/* "]" */,-66 , 39/* "," */,-66 , 14/* ">>" */,-66 ),
	/* State 110 */ new Array( 19/* ";" */,-50 , 21/* "==" */,-50 , 27/* "<" */,-50 , 26/* ">" */,-50 , 24/* "<=" */,-50 , 25/* ">=" */,-50 , 22/* "!=" */,-50 , 23/* "~=" */,-50 , 28/* "||" */,-50 , 29/* "&&" */,-50 , 32/* "-" */,-50 , 31/* "+" */,-50 , 35/* "*" */,-50 , 33/* "/" */,-50 , 34/* "%" */,-50 , 2/* "IF" */,-50 , 4/* "WHILE" */,-50 , 5/* "DO" */,-50 , 6/* "FOR" */,-50 , 8/* "USE" */,-50 , 10/* "DELETE" */,-50 , 9/* "RETURN" */,-50 , 17/* "{" */,-50 , 44/* "Identifier" */,-50 , 30/* "!" */,-50 , 46/* "Integer" */,-50 , 47/* "Float" */,-50 , 37/* "(" */,-50 , 45/* "String" */,-50 , 7/* "FUNCTION" */,-50 , 13/* "<<" */,-50 , 15/* "[" */,-50 , 11/* "TRUE" */,-50 , 12/* "FALSE" */,-50 , 38/* ")" */,-50 , 16/* "]" */,-50 , 39/* "," */,-50 , 14/* ">>" */,-50 ),
	/* State 111 */ new Array( 2/* "IF" */,3 , 4/* "WHILE" */,4 , 5/* "DO" */,5 , 6/* "FOR" */,6 , 8/* "USE" */,7 , 10/* "DELETE" */,8 , 9/* "RETURN" */,9 , 17/* "{" */,12 , 19/* ";" */,13 , 44/* "Identifier" */,17 , 30/* "!" */,18 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 , 32/* "-" */,33 ),
	/* State 112 */ new Array( 36/* "^" */,-57 , 2/* "IF" */,-57 , 4/* "WHILE" */,-57 , 5/* "DO" */,-57 , 6/* "FOR" */,-57 , 8/* "USE" */,-57 , 10/* "DELETE" */,-57 , 9/* "RETURN" */,-57 , 17/* "{" */,-57 , 19/* ";" */,-57 , 44/* "Identifier" */,-57 , 30/* "!" */,-57 , 46/* "Integer" */,-57 , 47/* "Float" */,-57 , 37/* "(" */,-57 , 45/* "String" */,-57 , 7/* "FUNCTION" */,-57 , 13/* "<<" */,-57 , 15/* "[" */,-57 , 11/* "TRUE" */,-57 , 12/* "FALSE" */,-57 , 32/* "-" */,-57 , 21/* "==" */,-57 , 27/* "<" */,-57 , 26/* ">" */,-57 , 24/* "<=" */,-57 , 25/* ">=" */,-57 , 22/* "!=" */,-57 , 23/* "~=" */,-57 , 28/* "||" */,-57 , 29/* "&&" */,-57 , 31/* "+" */,-57 , 35/* "*" */,-57 , 33/* "/" */,-57 , 34/* "%" */,-57 , 43/* "." */,-57 , 38/* ")" */,-57 , 16/* "]" */,-57 , 39/* "," */,-57 , 14/* ">>" */,-57 ),
	/* State 113 */ new Array( 31/* "+" */,60 , 32/* "-" */,61 , 16/* "]" */,124 ),
	/* State 114 */ new Array( 23/* "~=" */,44 , 22/* "!=" */,45 , 25/* ">=" */,46 , 24/* "<=" */,47 , 26/* ">" */,48 , 27/* "<" */,49 , 21/* "==" */,50 , 19/* ";" */,125 ),
	/* State 115 */ new Array( 30/* "!" */,18 , 32/* "-" */,33 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 44/* "Identifier" */,36 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 ),
	/* State 116 */ new Array( 13/* "<<" */,127 , 43/* "." */,-55 , 15/* "[" */,-55 , 37/* "(" */,-55 , 36/* "^" */,-55 , 19/* ";" */,-55 , 21/* "==" */,-55 , 27/* "<" */,-55 , 26/* ">" */,-55 , 24/* "<=" */,-55 , 25/* ">=" */,-55 , 22/* "!=" */,-55 , 23/* "~=" */,-55 , 28/* "||" */,-55 , 29/* "&&" */,-55 , 32/* "-" */,-55 , 31/* "+" */,-55 , 35/* "*" */,-55 , 33/* "/" */,-55 , 34/* "%" */,-55 , 2/* "IF" */,-55 , 4/* "WHILE" */,-55 , 5/* "DO" */,-55 , 6/* "FOR" */,-55 , 8/* "USE" */,-55 , 10/* "DELETE" */,-55 , 9/* "RETURN" */,-55 , 17/* "{" */,-55 , 44/* "Identifier" */,-55 , 30/* "!" */,-55 , 46/* "Integer" */,-55 , 47/* "Float" */,-55 , 45/* "String" */,-55 , 7/* "FUNCTION" */,-55 , 11/* "TRUE" */,-55 , 12/* "FALSE" */,-55 , 38/* ")" */,-55 , 16/* "]" */,-55 , 39/* "," */,-55 , 14/* ">>" */,-55 ),
	/* State 117 */ new Array( 43/* "." */,-54 , 15/* "[" */,-54 , 37/* "(" */,-54 , 36/* "^" */,-54 , 19/* ";" */,-54 , 21/* "==" */,-54 , 27/* "<" */,-54 , 26/* ">" */,-54 , 24/* "<=" */,-54 , 25/* ">=" */,-54 , 22/* "!=" */,-54 , 23/* "~=" */,-54 , 28/* "||" */,-54 , 29/* "&&" */,-54 , 32/* "-" */,-54 , 31/* "+" */,-54 , 35/* "*" */,-54 , 33/* "/" */,-54 , 34/* "%" */,-54 , 20/* "=" */,-29 ),
	/* State 118 */ new Array( 44/* "Identifier" */,128 ),
	/* State 119 */ new Array( 17/* "{" */,129 ),
	/* State 120 */ new Array( 14/* ">>" */,-8 , 39/* "," */,-8 ),
	/* State 121 */ new Array( 23/* "~=" */,44 , 22/* "!=" */,45 , 25/* ">=" */,46 , 24/* "<=" */,47 , 26/* ">" */,48 , 27/* "<" */,49 , 21/* "==" */,50 , 14/* ">>" */,-11 , 39/* "," */,-11 ),
	/* State 122 */ new Array( 23/* "~=" */,44 , 22/* "!=" */,45 , 25/* ">=" */,46 , 24/* "<=" */,47 , 26/* ">" */,48 , 27/* "<" */,49 , 21/* "==" */,50 , 16/* "]" */,-5 , 39/* "," */,-5 , 38/* ")" */,-5 ),
	/* State 123 */ new Array( 65/* "$$" */,-17 , 2/* "IF" */,-17 , 4/* "WHILE" */,-17 , 5/* "DO" */,-17 , 6/* "FOR" */,-17 , 8/* "USE" */,-17 , 10/* "DELETE" */,-17 , 9/* "RETURN" */,-17 , 17/* "{" */,-17 , 19/* ";" */,-17 , 44/* "Identifier" */,-17 , 30/* "!" */,-17 , 46/* "Integer" */,-17 , 47/* "Float" */,-17 , 37/* "(" */,-17 , 45/* "String" */,-17 , 7/* "FUNCTION" */,-17 , 13/* "<<" */,-17 , 15/* "[" */,-17 , 11/* "TRUE" */,-17 , 12/* "FALSE" */,-17 , 32/* "-" */,-17 , 3/* "ELSE" */,-17 , 18/* "}" */,-17 ),
	/* State 124 */ new Array( 36/* "^" */,-54 , 2/* "IF" */,-54 , 4/* "WHILE" */,-54 , 5/* "DO" */,-54 , 6/* "FOR" */,-54 , 8/* "USE" */,-54 , 10/* "DELETE" */,-54 , 9/* "RETURN" */,-54 , 17/* "{" */,-54 , 19/* ";" */,-54 , 44/* "Identifier" */,-54 , 30/* "!" */,-54 , 46/* "Integer" */,-54 , 47/* "Float" */,-54 , 37/* "(" */,-54 , 45/* "String" */,-54 , 7/* "FUNCTION" */,-54 , 13/* "<<" */,-54 , 15/* "[" */,-54 , 11/* "TRUE" */,-54 , 12/* "FALSE" */,-54 , 32/* "-" */,-54 , 21/* "==" */,-54 , 27/* "<" */,-54 , 26/* ">" */,-54 , 24/* "<=" */,-54 , 25/* ">=" */,-54 , 22/* "!=" */,-54 , 23/* "~=" */,-54 , 28/* "||" */,-54 , 29/* "&&" */,-54 , 31/* "+" */,-54 , 35/* "*" */,-54 , 33/* "/" */,-54 , 34/* "%" */,-54 , 43/* "." */,-54 , 38/* ")" */,-54 , 16/* "]" */,-54 , 39/* "," */,-54 , 14/* ">>" */,-54 ),
	/* State 125 */ new Array( 65/* "$$" */,-19 , 2/* "IF" */,-19 , 4/* "WHILE" */,-19 , 5/* "DO" */,-19 , 6/* "FOR" */,-19 , 8/* "USE" */,-19 , 10/* "DELETE" */,-19 , 9/* "RETURN" */,-19 , 17/* "{" */,-19 , 19/* ";" */,-19 , 44/* "Identifier" */,-19 , 30/* "!" */,-19 , 46/* "Integer" */,-19 , 47/* "Float" */,-19 , 37/* "(" */,-19 , 45/* "String" */,-19 , 7/* "FUNCTION" */,-19 , 13/* "<<" */,-19 , 15/* "[" */,-19 , 11/* "TRUE" */,-19 , 12/* "FALSE" */,-19 , 32/* "-" */,-19 , 3/* "ELSE" */,-19 , 18/* "}" */,-19 ),
	/* State 126 */ new Array( 23/* "~=" */,44 , 22/* "!=" */,45 , 25/* ">=" */,46 , 24/* "<=" */,47 , 26/* ">" */,48 , 27/* "<" */,49 , 21/* "==" */,50 , 19/* ";" */,130 ),
	/* State 127 */ new Array( 44/* "Identifier" */,69 , 14/* ">>" */,-10 , 39/* "," */,-10 ),
	/* State 128 */ new Array( 38/* ")" */,-12 , 39/* "," */,-12 ),
	/* State 129 */ new Array( 18/* "}" */,-4 , 2/* "IF" */,-4 , 4/* "WHILE" */,-4 , 5/* "DO" */,-4 , 6/* "FOR" */,-4 , 8/* "USE" */,-4 , 10/* "DELETE" */,-4 , 9/* "RETURN" */,-4 , 17/* "{" */,-4 , 19/* ";" */,-4 , 44/* "Identifier" */,-4 , 30/* "!" */,-4 , 46/* "Integer" */,-4 , 47/* "Float" */,-4 , 37/* "(" */,-4 , 45/* "String" */,-4 , 7/* "FUNCTION" */,-4 , 13/* "<<" */,-4 , 15/* "[" */,-4 , 11/* "TRUE" */,-4 , 12/* "FALSE" */,-4 , 32/* "-" */,-4 ),
	/* State 130 */ new Array( 44/* "Identifier" */,17 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 ),
	/* State 131 */ new Array( 39/* "," */,105 , 14/* ">>" */,134 ),
	/* State 132 */ new Array( 18/* "}" */,135 , 2/* "IF" */,3 , 4/* "WHILE" */,4 , 5/* "DO" */,5 , 6/* "FOR" */,6 , 8/* "USE" */,7 , 10/* "DELETE" */,8 , 9/* "RETURN" */,9 , 17/* "{" */,12 , 19/* ";" */,13 , 44/* "Identifier" */,17 , 30/* "!" */,18 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 , 32/* "-" */,33 ),
	/* State 133 */ new Array( 38/* ")" */,136 ),
	/* State 134 */ new Array( 43/* "." */,-56 , 15/* "[" */,-56 , 37/* "(" */,-56 , 36/* "^" */,-56 , 19/* ";" */,-56 , 21/* "==" */,-56 , 27/* "<" */,-56 , 26/* ">" */,-56 , 24/* "<=" */,-56 , 25/* ">=" */,-56 , 22/* "!=" */,-56 , 23/* "~=" */,-56 , 28/* "||" */,-56 , 29/* "&&" */,-56 , 32/* "-" */,-56 , 31/* "+" */,-56 , 35/* "*" */,-56 , 33/* "/" */,-56 , 34/* "%" */,-56 , 2/* "IF" */,-56 , 4/* "WHILE" */,-56 , 5/* "DO" */,-56 , 6/* "FOR" */,-56 , 8/* "USE" */,-56 , 10/* "DELETE" */,-56 , 9/* "RETURN" */,-56 , 17/* "{" */,-56 , 44/* "Identifier" */,-56 , 30/* "!" */,-56 , 46/* "Integer" */,-56 , 47/* "Float" */,-56 , 45/* "String" */,-56 , 7/* "FUNCTION" */,-56 , 13/* "<<" */,-56 , 11/* "TRUE" */,-56 , 12/* "FALSE" */,-56 , 38/* ")" */,-56 , 16/* "]" */,-56 , 39/* "," */,-56 , 14/* ">>" */,-56 ),
	/* State 135 */ new Array( 43/* "." */,-64 , 15/* "[" */,-64 , 37/* "(" */,-64 , 36/* "^" */,-64 , 19/* ";" */,-64 , 21/* "==" */,-64 , 27/* "<" */,-64 , 26/* ">" */,-64 , 24/* "<=" */,-64 , 25/* ">=" */,-64 , 22/* "!=" */,-64 , 23/* "~=" */,-64 , 28/* "||" */,-64 , 29/* "&&" */,-64 , 32/* "-" */,-64 , 31/* "+" */,-64 , 35/* "*" */,-64 , 33/* "/" */,-64 , 34/* "%" */,-64 , 2/* "IF" */,-64 , 4/* "WHILE" */,-64 , 5/* "DO" */,-64 , 6/* "FOR" */,-64 , 8/* "USE" */,-64 , 10/* "DELETE" */,-64 , 9/* "RETURN" */,-64 , 17/* "{" */,-64 , 44/* "Identifier" */,-64 , 30/* "!" */,-64 , 46/* "Integer" */,-64 , 47/* "Float" */,-64 , 45/* "String" */,-64 , 7/* "FUNCTION" */,-64 , 13/* "<<" */,-64 , 11/* "TRUE" */,-64 , 12/* "FALSE" */,-64 , 38/* ")" */,-64 , 16/* "]" */,-64 , 39/* "," */,-64 , 14/* ">>" */,-64 ),
	/* State 136 */ new Array( 2/* "IF" */,3 , 4/* "WHILE" */,4 , 5/* "DO" */,5 , 6/* "FOR" */,6 , 8/* "USE" */,7 , 10/* "DELETE" */,8 , 9/* "RETURN" */,9 , 17/* "{" */,12 , 19/* ";" */,13 , 44/* "Identifier" */,17 , 30/* "!" */,18 , 46/* "Integer" */,22 , 47/* "Float" */,23 , 37/* "(" */,24 , 45/* "String" */,25 , 7/* "FUNCTION" */,26 , 13/* "<<" */,27 , 15/* "[" */,28 , 11/* "TRUE" */,29 , 12/* "FALSE" */,30 , 32/* "-" */,33 ),
	/* State 137 */ new Array( 65/* "$$" */,-20 , 2/* "IF" */,-20 , 4/* "WHILE" */,-20 , 5/* "DO" */,-20 , 6/* "FOR" */,-20 , 8/* "USE" */,-20 , 10/* "DELETE" */,-20 , 9/* "RETURN" */,-20 , 17/* "{" */,-20 , 19/* ";" */,-20 , 44/* "Identifier" */,-20 , 30/* "!" */,-20 , 46/* "Integer" */,-20 , 47/* "Float" */,-20 , 37/* "(" */,-20 , 45/* "String" */,-20 , 7/* "FUNCTION" */,-20 , 13/* "<<" */,-20 , 15/* "[" */,-20 , 11/* "TRUE" */,-20 , 12/* "FALSE" */,-20 , 32/* "-" */,-20 , 3/* "ELSE" */,-20 , 18/* "}" */,-20 )
);

/* Goto-Table */
var goto_tab = new Array(
	/* State 0 */ new Array( 48/* Program */,1 ),
	/* State 1 */ new Array( 49/* Stmt */,2 , 57/* Assign */,10 , 52/* Expression */,11 , 56/* Lhs */,14 , 60/* LogExp */,15 , 58/* ExtValue */,16 , 59/* AddSubExp */,19 , 64/* Value */,20 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 ),
	/* State 2 */ new Array(  ),
	/* State 3 */ new Array( 52/* Expression */,34 , 60/* LogExp */,15 , 59/* AddSubExp */,19 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 , 58/* ExtValue */,35 , 64/* Value */,20 ),
	/* State 4 */ new Array( 52/* Expression */,37 , 60/* LogExp */,15 , 59/* AddSubExp */,19 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 , 58/* ExtValue */,35 , 64/* Value */,20 ),
	/* State 5 */ new Array( 49/* Stmt */,38 , 57/* Assign */,10 , 52/* Expression */,11 , 56/* Lhs */,14 , 60/* LogExp */,15 , 58/* ExtValue */,16 , 59/* AddSubExp */,19 , 64/* Value */,20 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 ),
	/* State 6 */ new Array(  ),
	/* State 7 */ new Array(  ),
	/* State 8 */ new Array(  ),
	/* State 9 */ new Array( 49/* Stmt */,42 , 57/* Assign */,10 , 52/* Expression */,11 , 56/* Lhs */,14 , 60/* LogExp */,15 , 58/* ExtValue */,16 , 59/* AddSubExp */,19 , 64/* Value */,20 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 ),
	/* State 10 */ new Array(  ),
	/* State 11 */ new Array(  ),
	/* State 12 */ new Array( 50/* Stmt_List */,52 ),
	/* State 13 */ new Array(  ),
	/* State 14 */ new Array(  ),
	/* State 15 */ new Array(  ),
	/* State 16 */ new Array(  ),
	/* State 17 */ new Array(  ),
	/* State 18 */ new Array( 60/* LogExp */,59 , 59/* AddSubExp */,19 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 , 58/* ExtValue */,35 , 64/* Value */,20 ),
	/* State 19 */ new Array(  ),
	/* State 20 */ new Array(  ),
	/* State 21 */ new Array(  ),
	/* State 22 */ new Array(  ),
	/* State 23 */ new Array(  ),
	/* State 24 */ new Array( 52/* Expression */,65 , 60/* LogExp */,15 , 59/* AddSubExp */,19 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 , 58/* ExtValue */,35 , 64/* Value */,20 ),
	/* State 25 */ new Array(  ),
	/* State 26 */ new Array(  ),
	/* State 27 */ new Array( 53/* Prop_List */,67 , 54/* Prop */,68 ),
	/* State 28 */ new Array( 51/* Param_List */,70 , 52/* Expression */,71 , 60/* LogExp */,15 , 59/* AddSubExp */,19 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 , 58/* ExtValue */,35 , 64/* Value */,20 ),
	/* State 29 */ new Array(  ),
	/* State 30 */ new Array(  ),
	/* State 31 */ new Array(  ),
	/* State 32 */ new Array(  ),
	/* State 33 */ new Array( 58/* ExtValue */,73 , 64/* Value */,20 ),
	/* State 34 */ new Array( 49/* Stmt */,74 , 57/* Assign */,10 , 52/* Expression */,11 , 56/* Lhs */,14 , 60/* LogExp */,15 , 58/* ExtValue */,16 , 59/* AddSubExp */,19 , 64/* Value */,20 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 ),
	/* State 35 */ new Array(  ),
	/* State 36 */ new Array(  ),
	/* State 37 */ new Array( 49/* Stmt */,77 , 57/* Assign */,10 , 52/* Expression */,11 , 56/* Lhs */,14 , 60/* LogExp */,15 , 58/* ExtValue */,16 , 59/* AddSubExp */,19 , 64/* Value */,20 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 ),
	/* State 38 */ new Array(  ),
	/* State 39 */ new Array( 57/* Assign */,79 , 56/* Lhs */,14 , 58/* ExtValue */,80 , 64/* Value */,20 ),
	/* State 40 */ new Array(  ),
	/* State 41 */ new Array(  ),
	/* State 42 */ new Array(  ),
	/* State 43 */ new Array(  ),
	/* State 44 */ new Array( 60/* LogExp */,82 , 59/* AddSubExp */,19 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 , 58/* ExtValue */,35 , 64/* Value */,20 ),
	/* State 45 */ new Array( 60/* LogExp */,83 , 59/* AddSubExp */,19 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 , 58/* ExtValue */,35 , 64/* Value */,20 ),
	/* State 46 */ new Array( 60/* LogExp */,84 , 59/* AddSubExp */,19 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 , 58/* ExtValue */,35 , 64/* Value */,20 ),
	/* State 47 */ new Array( 60/* LogExp */,85 , 59/* AddSubExp */,19 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 , 58/* ExtValue */,35 , 64/* Value */,20 ),
	/* State 48 */ new Array( 60/* LogExp */,86 , 59/* AddSubExp */,19 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 , 58/* ExtValue */,35 , 64/* Value */,20 ),
	/* State 49 */ new Array( 60/* LogExp */,87 , 59/* AddSubExp */,19 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 , 58/* ExtValue */,35 , 64/* Value */,20 ),
	/* State 50 */ new Array( 60/* LogExp */,88 , 59/* AddSubExp */,19 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 , 58/* ExtValue */,35 , 64/* Value */,20 ),
	/* State 51 */ new Array(  ),
	/* State 52 */ new Array( 49/* Stmt */,89 , 57/* Assign */,10 , 52/* Expression */,11 , 56/* Lhs */,14 , 60/* LogExp */,15 , 58/* ExtValue */,16 , 59/* AddSubExp */,19 , 64/* Value */,20 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 ),
	/* State 53 */ new Array( 52/* Expression */,91 , 60/* LogExp */,15 , 59/* AddSubExp */,19 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 , 58/* ExtValue */,35 , 64/* Value */,20 ),
	/* State 54 */ new Array( 59/* AddSubExp */,92 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 , 58/* ExtValue */,35 , 64/* Value */,20 ),
	/* State 55 */ new Array( 59/* AddSubExp */,93 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 , 58/* ExtValue */,35 , 64/* Value */,20 ),
	/* State 56 */ new Array(  ),
	/* State 57 */ new Array( 51/* Param_List */,95 , 52/* Expression */,71 , 60/* LogExp */,15 , 59/* AddSubExp */,19 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 , 58/* ExtValue */,35 , 64/* Value */,20 ),
	/* State 58 */ new Array( 59/* AddSubExp */,96 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 , 58/* ExtValue */,35 , 64/* Value */,20 ),
	/* State 59 */ new Array(  ),
	/* State 60 */ new Array( 61/* MulDivExp */,97 , 62/* ExpExp */,31 , 63/* NegExp */,32 , 58/* ExtValue */,35 , 64/* Value */,20 ),
	/* State 61 */ new Array( 61/* MulDivExp */,98 , 62/* ExpExp */,31 , 63/* NegExp */,32 , 58/* ExtValue */,35 , 64/* Value */,20 ),
	/* State 62 */ new Array( 62/* ExpExp */,99 , 63/* NegExp */,32 , 58/* ExtValue */,35 , 64/* Value */,20 ),
	/* State 63 */ new Array( 62/* ExpExp */,100 , 63/* NegExp */,32 , 58/* ExtValue */,35 , 64/* Value */,20 ),
	/* State 64 */ new Array( 62/* ExpExp */,101 , 63/* NegExp */,32 , 58/* ExtValue */,35 , 64/* Value */,20 ),
	/* State 65 */ new Array(  ),
	/* State 66 */ new Array( 55/* Param_Def_List */,103 ),
	/* State 67 */ new Array(  ),
	/* State 68 */ new Array(  ),
	/* State 69 */ new Array(  ),
	/* State 70 */ new Array(  ),
	/* State 71 */ new Array(  ),
	/* State 72 */ new Array( 62/* ExpExp */,110 , 63/* NegExp */,32 , 58/* ExtValue */,35 , 64/* Value */,20 ),
	/* State 73 */ new Array(  ),
	/* State 74 */ new Array(  ),
	/* State 75 */ new Array(  ),
	/* State 76 */ new Array( 59/* AddSubExp */,113 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 , 58/* ExtValue */,35 , 64/* Value */,20 ),
	/* State 77 */ new Array(  ),
	/* State 78 */ new Array( 52/* Expression */,114 , 60/* LogExp */,15 , 59/* AddSubExp */,19 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 , 58/* ExtValue */,35 , 64/* Value */,20 ),
	/* State 79 */ new Array(  ),
	/* State 80 */ new Array(  ),
	/* State 81 */ new Array(  ),
	/* State 82 */ new Array(  ),
	/* State 83 */ new Array(  ),
	/* State 84 */ new Array(  ),
	/* State 85 */ new Array(  ),
	/* State 86 */ new Array(  ),
	/* State 87 */ new Array(  ),
	/* State 88 */ new Array(  ),
	/* State 89 */ new Array(  ),
	/* State 90 */ new Array(  ),
	/* State 91 */ new Array(  ),
	/* State 92 */ new Array(  ),
	/* State 93 */ new Array(  ),
	/* State 94 */ new Array(  ),
	/* State 95 */ new Array(  ),
	/* State 96 */ new Array(  ),
	/* State 97 */ new Array(  ),
	/* State 98 */ new Array(  ),
	/* State 99 */ new Array(  ),
	/* State 100 */ new Array(  ),
	/* State 101 */ new Array(  ),
	/* State 102 */ new Array(  ),
	/* State 103 */ new Array(  ),
	/* State 104 */ new Array(  ),
	/* State 105 */ new Array( 54/* Prop */,120 ),
	/* State 106 */ new Array(  ),
	/* State 107 */ new Array( 52/* Expression */,121 , 60/* LogExp */,15 , 59/* AddSubExp */,19 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 , 58/* ExtValue */,35 , 64/* Value */,20 ),
	/* State 108 */ new Array( 52/* Expression */,122 , 60/* LogExp */,15 , 59/* AddSubExp */,19 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 , 58/* ExtValue */,35 , 64/* Value */,20 ),
	/* State 109 */ new Array(  ),
	/* State 110 */ new Array(  ),
	/* State 111 */ new Array( 49/* Stmt */,123 , 57/* Assign */,10 , 52/* Expression */,11 , 56/* Lhs */,14 , 60/* LogExp */,15 , 58/* ExtValue */,16 , 59/* AddSubExp */,19 , 64/* Value */,20 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 ),
	/* State 112 */ new Array(  ),
	/* State 113 */ new Array(  ),
	/* State 114 */ new Array(  ),
	/* State 115 */ new Array( 52/* Expression */,126 , 60/* LogExp */,15 , 59/* AddSubExp */,19 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 , 58/* ExtValue */,35 , 64/* Value */,20 ),
	/* State 116 */ new Array(  ),
	/* State 117 */ new Array(  ),
	/* State 118 */ new Array(  ),
	/* State 119 */ new Array(  ),
	/* State 120 */ new Array(  ),
	/* State 121 */ new Array(  ),
	/* State 122 */ new Array(  ),
	/* State 123 */ new Array(  ),
	/* State 124 */ new Array(  ),
	/* State 125 */ new Array(  ),
	/* State 126 */ new Array(  ),
	/* State 127 */ new Array( 53/* Prop_List */,131 , 54/* Prop */,68 ),
	/* State 128 */ new Array(  ),
	/* State 129 */ new Array( 50/* Stmt_List */,132 ),
	/* State 130 */ new Array( 57/* Assign */,133 , 56/* Lhs */,14 , 58/* ExtValue */,80 , 64/* Value */,20 ),
	/* State 131 */ new Array(  ),
	/* State 132 */ new Array( 49/* Stmt */,89 , 57/* Assign */,10 , 52/* Expression */,11 , 56/* Lhs */,14 , 60/* LogExp */,15 , 58/* ExtValue */,16 , 59/* AddSubExp */,19 , 64/* Value */,20 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 ),
	/* State 133 */ new Array(  ),
	/* State 134 */ new Array(  ),
	/* State 135 */ new Array(  ),
	/* State 136 */ new Array( 49/* Stmt */,137 , 57/* Assign */,10 , 52/* Expression */,11 , 56/* Lhs */,14 , 60/* LogExp */,15 , 58/* ExtValue */,16 , 59/* AddSubExp */,19 , 64/* Value */,20 , 61/* MulDivExp */,21 , 62/* ExpExp */,31 , 63/* NegExp */,32 ),
	/* State 137 */ new Array(  )
);



/* Symbol labels */
var labels = new Array(
	"Program'" /* Non-terminal symbol */,
	"WHITESPACE" /* Terminal symbol */,
	"IF" /* Terminal symbol */,
	"ELSE" /* Terminal symbol */,
	"WHILE" /* Terminal symbol */,
	"DO" /* Terminal symbol */,
	"FOR" /* Terminal symbol */,
	"FUNCTION" /* Terminal symbol */,
	"USE" /* Terminal symbol */,
	"RETURN" /* Terminal symbol */,
	"DELETE" /* Terminal symbol */,
	"TRUE" /* Terminal symbol */,
	"FALSE" /* Terminal symbol */,
	"<<" /* Terminal symbol */,
	">>" /* Terminal symbol */,
	"[" /* Terminal symbol */,
	"]" /* Terminal symbol */,
	"{" /* Terminal symbol */,
	"}" /* Terminal symbol */,
	";" /* Terminal symbol */,
	"=" /* Terminal symbol */,
	"==" /* Terminal symbol */,
	"!=" /* Terminal symbol */,
	"~=" /* Terminal symbol */,
	"<=" /* Terminal symbol */,
	">=" /* Terminal symbol */,
	">" /* Terminal symbol */,
	"<" /* Terminal symbol */,
	"||" /* Terminal symbol */,
	"&&" /* Terminal symbol */,
	"!" /* Terminal symbol */,
	"+" /* Terminal symbol */,
	"-" /* Terminal symbol */,
	"/" /* Terminal symbol */,
	"%" /* Terminal symbol */,
	"*" /* Terminal symbol */,
	"^" /* Terminal symbol */,
	"(" /* Terminal symbol */,
	")" /* Terminal symbol */,
	"," /* Terminal symbol */,
	"#" /* Terminal symbol */,
	":" /* Terminal symbol */,
	"|" /* Terminal symbol */,
	"." /* Terminal symbol */,
	"Identifier" /* Terminal symbol */,
	"String" /* Terminal symbol */,
	"Integer" /* Terminal symbol */,
	"Float" /* Terminal symbol */,
	"Program" /* Non-terminal symbol */,
	"Stmt" /* Non-terminal symbol */,
	"Stmt_List" /* Non-terminal symbol */,
	"Param_List" /* Non-terminal symbol */,
	"Expression" /* Non-terminal symbol */,
	"Prop_List" /* Non-terminal symbol */,
	"Prop" /* Non-terminal symbol */,
	"Param_Def_List" /* Non-terminal symbol */,
	"Lhs" /* Non-terminal symbol */,
	"Assign" /* Non-terminal symbol */,
	"ExtValue" /* Non-terminal symbol */,
	"AddSubExp" /* Non-terminal symbol */,
	"LogExp" /* Non-terminal symbol */,
	"MulDivExp" /* Non-terminal symbol */,
	"ExpExp" /* Non-terminal symbol */,
	"NegExp" /* Non-terminal symbol */,
	"Value" /* Non-terminal symbol */,
	"$$" /* Terminal symbol */
);


    
        info.offset = 0;
        info.src = src;
        info.att = '';
    
        if( !err_off ) {
            err_off = [];
        }
        if( !err_la ) {
            err_la = [];
        }
    
        sstack.push(0);
        vstack.push(0);
    
        la = this._lex(info);

        while (true) {
            act = 139;
            for (i = 0; i < act_tab[sstack[sstack.length-1]].length; i+=2) {
                if (act_tab[sstack[sstack.length-1]][i] == la) {
                    act = act_tab[sstack[sstack.length-1]][i+1];
                    break;
                }
            }

            if (this._dbg_withtrace && sstack.length > 0) {
                this._dbg_print("\nState " + sstack[sstack.length-1] + "\n" +
                                "\tLookahead: " + labels[la] + " (\"" + info.att + "\")\n" +
                                "\tAction: " + act + "\n" +
                                "\tSource: \"" + info.src.substr( info.offset, 30 ) + ( ( info.offset + 30 < info.src.length ) ?
                                        "..." : "" ) + "\"\n" +
                                "\tStack: " + sstack.join() + "\n" +
                                "\tValue stack: " + vstack.join() + "\n");
            }
        
            //Panic-mode: Try recovery when parse-error occurs!
            if (act == 139) {
                if (this._dbg_withtrace)
                    this._dbg_print("Error detected: There is no reduce or shift on the symbol " + labels[la]);
            
                err_cnt++;
                err_off.push(info.offset - info.att.length);
                err_la.push([]);
                for (i = 0; i < act_tab[sstack[sstack.length-1]].length; i+=2) {
                    err_la[err_la.length-1].push( labels[act_tab[sstack[sstack.length-1]][i]] );
                }
            
                //Remember the original stack!
                var rsstack = [];
                var rvstack = [];
                for (i = 0; i < sstack.length; i++) {
                    rsstack[i] = sstack[i];
                    rvstack[i] = vstack[i];
                }

                while (act == 139 && la != 65) {
                    if (this._dbg_withtrace) {
                        this._dbg_print("\tError recovery\n" +
                                        "Current lookahead: " + labels[la] + " (" + info.att + ")\n" +
                                        "Action: " + act + "\n\n");
                    }
                    if (la == -1) {
                        info.offset++;
                    }

                    while (act == 139 && sstack.length > 0) {
                        sstack.pop();
                        vstack.pop();

                        if (sstack.length == 0) {
                            break;
                        }

                        act = 139;
                        for (i = 0; i < act_tab[sstack[sstack.length-1]].length; i+=2) {
                            if (act_tab[sstack[sstack.length-1]][i] == la) {
                                act = act_tab[sstack[sstack.length-1]][i+1];
                                break;
                            }
                        }
                    }

                    if (act != 139) {
                        break;
                    }

                    for (i = 0; i < rsstack.length; i++) {
                        sstack.push(rsstack[i]);
                        vstack.push(rvstack[i]);
                    }

                    la = this._lex(info);
                }

                if (act == 139) {
                    if (this._dbg_withtrace ) {
                        this._dbg_print("\tError recovery failed, terminating parse process...");
                    }
                    break;
                }

                if (this._dbg_withtrace) {
                    this._dbg_print("\tError recovery succeeded, continuing");
                }
            }

            //Shift
            if (act > 0) {
                if (this._dbg_withtrace) {
                    this._dbg_print("Shifting symbol: " + labels[la] + " (" + info.att + ")");
                }

                sstack.push(act);
                vstack.push(info.att);

                la = this._lex(info);

                if (this._dbg_withtrace) {
                    this._dbg_print("\tNew lookahead symbol: " + labels[la] + " (" + info.att + ")");
                }
            }
            //Reduce
            else {
                act *= -1;

                if (this._dbg_withtrace) {
                    this._dbg_print("Reducing by producution: " + act);
                }

                rval = void(0);

                if (this._dbg_withtrace) {
                    this._dbg_print("\tPerforming semantic action...");
                }

switch( act )
{
	case 0:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 1:
	{
		 this.execute( vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 2:
	{
		rval = vstack[ vstack.length - 0 ];
	}
	break;
	case 3:
	{
		 rval = this.createNode('node_op', 'op_none', vstack[ vstack.length - 2 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 4:
	{
		rval = vstack[ vstack.length - 0 ];
	}
	break;
	case 5:
	{
		 rval = this.createNode('node_op', 'op_param', vstack[ vstack.length - 1 ], vstack[ vstack.length - 3 ] ); 
	}
	break;
	case 6:
	{
		 rval = this.createNode('node_op', 'op_param', vstack[ vstack.length - 1 ]); 
	}
	break;
	case 7:
	{
		rval = vstack[ vstack.length - 0 ];
	}
	break;
	case 8:
	{
		 rval = this.createNode('node_op', 'op_proplst', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 9:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 10:
	{
		rval = vstack[ vstack.length - 0 ];
	}
	break;
	case 11:
	{
		 rval = this.createNode('node_op', 'op_prop', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 12:
	{
		 rval = this.createNode('node_op', 'op_paramdef', vstack[ vstack.length - 1 ], vstack[ vstack.length - 3 ]); 
	}
	break;
	case 13:
	{
		 rval = this.createNode('node_op', 'op_paramdef', vstack[ vstack.length - 1 ]); 
	}
	break;
	case 14:
	{
		rval = vstack[ vstack.length - 0 ];
	}
	break;
	case 15:
	{
		 rval = this.createNode('node_op', 'op_assign', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 16:
	{
		 rval = this.createNode('node_op', 'op_if', vstack[ vstack.length - 2 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 17:
	{
		 rval = this.createNode('node_op', 'op_if_else', vstack[ vstack.length - 4 ], vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 18:
	{
		 rval = this.createNode('node_op', 'op_while', vstack[ vstack.length - 2 ], vstack[ vstack.length - 0 ] ); 
	}
	break;
	case 19:
	{
		 rval = this.createNode('node_op', 'op_do', vstack[ vstack.length - 4 ], vstack[ vstack.length - 2 ] ); 
	}
	break;
	case 20:
	{
		 rval = this.createNode('node_op', 'op_for', vstack[ vstack.length - 7 ], vstack[ vstack.length - 5 ], vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 21:
	{
		 rval = this.createNode('node_op', 'op_use', vstack[ vstack.length - 2 ] ); 
	}
	break;
	case 22:
	{
		 rval = this.createNode('node_op', 'op_delete', vstack[ vstack.length - 1 ]); 
	}
	break;
	case 23:
	{
		 rval = this.createNode('node_op', 'op_return', vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 24:
	{
		rval = vstack[ vstack.length - 2 ];
	}
	break;
	case 25:
	{
		 rval = this.createNode('node_op', 'op_noassign', vstack[ vstack.length - 2 ] ); 
	}
	break;
	case 26:
	{
		 rval = vstack[ vstack.length - 2 ]; rval.needsBrackets = true; 
	}
	break;
	case 27:
	{
		 rval = this.createNode('node_op', 'op_none' ); 
	}
	break;
	case 28:
	{
		 rval = this.createNode('node_op', 'op_lhs', vstack[ vstack.length - 1 ], vstack[ vstack.length - 3 ], 'dot'); 
	}
	break;
	case 29:
	{
		 rval = this.createNode('node_op', 'op_lhs', vstack[ vstack.length - 2 ], vstack[ vstack.length - 4 ], 'bracket'); 
	}
	break;
	case 30:
	{
		 rval = this.createNode('node_op', 'op_lhs', vstack[ vstack.length - 1 ]); 
	}
	break;
	case 31:
	{
		 rval = this.createNode('node_op', 'op_equ', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 32:
	{
		 rval = this.createNode('node_op', 'op_lot', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 33:
	{
		 rval = this.createNode('node_op', 'op_grt', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 34:
	{
		 rval = this.createNode('node_op', 'op_loe', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 35:
	{
		 rval = this.createNode('node_op', 'op_gre', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 36:
	{
		 rval = this.createNode('node_op', 'op_neq', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 37:
	{
		 rval = this.createNode('node_op', 'op_approx', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 38:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 39:
	{
		 rval = this.createNode('node_op', 'op_or', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 40:
	{
		 rval = this.createNode('node_op', 'op_and', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 41:
	{
		 rval = this.createNode('node_op', 'op_not', vstack[ vstack.length - 1 ]); 
	}
	break;
	case 42:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 43:
	{
		 rval = this.createNode('node_op', 'op_sub', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 44:
	{
		 rval = this.createNode('node_op', 'op_add', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 45:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 46:
	{
		 rval = this.createNode('node_op', 'op_mul', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 47:
	{
		 rval = this.createNode('node_op', 'op_div', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 48:
	{
		 rval = this.createNode('node_op', 'op_mod', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 49:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 50:
	{
		 rval = this.createNode('node_op', 'op_exp', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 51:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 52:
	{
		 rval = this.createNode('node_op', 'op_neg', vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 53:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 54:
	{
		 rval = this.createNode('node_op', 'op_extvalue', vstack[ vstack.length - 4 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 55:
	{
		 rval = this.createNode('node_op', 'op_execfun', vstack[ vstack.length - 4 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 56:
	{
		 rval = this.createNode('node_op', 'op_execfun', vstack[ vstack.length - 7 ], vstack[ vstack.length - 5 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 57:
	{
		 rval = this.createNode('node_op', 'op_property', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 58:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 59:
	{
		 rval = this.createNode('node_const', vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 60:
	{
		 rval = this.createNode('node_const', vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 61:
	{
		 rval = this.createNode('node_var', vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 62:
	{
		 rval = vstack[ vstack.length - 2 ]; 
	}
	break;
	case 63:
	{
		 rval = this.createNode('node_str', vstack[ vstack.length - 1 ]); 
	}
	break;
	case 64:
	{
		 rval = this.createNode('node_op', 'op_function', vstack[ vstack.length - 5 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 65:
	{
		 rval = this.createNode('node_op', 'op_proplst_val', vstack[ vstack.length - 2 ]); 
	}
	break;
	case 66:
	{
		 rval = this.createNode('node_op', 'op_array', vstack[ vstack.length - 2 ]); 
	}
	break;
	case 67:
	{
		 rval = this.createNode('node_const_bool', vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 68:
	{
		 rval = this.createNode('node_const_bool', vstack[ vstack.length - 1 ] ); 
	}
	break;
}



                if (this._dbg_withtrace) {
                    this._dbg_print("\tPopping " + pop_tab[act][1] + " off the stack...");
                }

                for (i = 0; i < pop_tab[act][1]; i++) {
                    sstack.pop();
                    vstack.pop();
                }

                go = -1;
                for (i = 0; i < goto_tab[sstack[sstack.length-1]].length; i+=2) {
                    if (goto_tab[sstack[sstack.length-1]][i] == pop_tab[act][0]) {
                        go = goto_tab[sstack[sstack.length-1]][i+1];
                        break;
                    }
                }

                if (act == 0) {
                    break;
                }

                if (this._dbg_withtrace) {
                    this._dbg_print("\tPushing non-terminal " + labels[pop_tab[act][0]]);
                }

                sstack.push(go);
                vstack.push(rval);
            }

            if (this._dbg_withtrace ) {
                alert(this._dbg_string);
                this._dbg_string = '';
            }
        }

        if (this._dbg_withtrace) {
            this._dbg_print("\nParse complete.");
            alert(this._dbg_string);
        }

        return err_cnt;
    }
});


