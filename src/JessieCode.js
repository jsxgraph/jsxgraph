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
     * This is a stub that might be used later on.
     * @type Boolean
     * @private
     */
    this.isfuncall = true;

    /**
     * Reserved keywords
     */
    this.reserved = ['PI', 'X', 'Y', 'E', 'V', 'L'];

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
            console.log(log);
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
        if (this.reserved.indexOf(vname) > -1) {
            this._error('Error: ' + vname + ' is a reserved word.');
        }

        this.sstack[this.scope][vname] = value;
    },

    /**
     * Looks up the value of the given variable.
     * @param {String} vname Name of the variable
     */
    getvar: function (vname) {
        var s, undef;

        for (s = this.scope; s > -1; s--) {
            if (JXG.exists(this.sstack[s][vname])) {
                return this.sstack[s][vname];
            }
        }

        // check for an element with this name
        if (vname in JXG.JSXGraph.elements) {
            return this.creator(vname);
        }

        if (typeof Math[vname] !== 'undefined') {
            return Math[vname];
        }

        if (vname in {X: 1, Y: 1, L: 1}) {
            return function (el) {
                return el[vname]();
            }
        }

        if (vname === 'V') {
            return function (el) {
                return el.Value();
            }
        }

        if (vname === 'rad') {
            s = JXG.Math.Geometry.rad;
            s.sc = JXG.Math.Geometry;
            
            return s;
        }

        if (vname === 'deg') {
            s = JXG.Math.Geometry.trueAngle;
            s.sc = JXG.Math.Geometry;

            return s;
        }

        if (vname === '$') {
            return this.getElementById;
        }

        s = JXG.getRef(this.board, vname);
        if (s !== vname) {
            return s;
        }

        return undef;
    },

    /**
     * Sets the property <tt>what</tt> of {@link JXG.JessieCode#propobj} to <tt>value</tt>
     * @param {String} what
     * @param {%} value
     */
    setProp: function (o, what, value) {
        var par = {}, x, y;

        if (o.elementClass === JXG.OBJECT_CLASS_POINT && (what === 'X' || what === 'y')) {
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

                o.XEval = function() { return this.coords.usrCoords[1]; };
                o.YEval = function() { return this.coords.usrCoords[2]; };
                o.setPosition(JXG.COORDS_BY_USER, x, y);
            } else if (o.isDraggable && (typeof value === 'function' || typeof value === 'string')) {
                x = what === 'x' ? value : function () { return this.coords.usrCoords[1]; };
                y = what === 'y' ? value : function () { return this.coords.usrCoords[2]; };

                o.isDraggable = false;
                o.addConstraint([x, y]);
            } else if (!o.isDraggable) {
                x = what === 'x' ? value : o.XEval;
                y = what === 'y' ? value : o.YEval;

                o.addConstraint(x, y);
            }

            this.board.update();
        } else if (o.type && o.elementClass && o.visProp) {
            par[what] = value;
            o.setProperty(par);
        } else {
            o[what] = value;
        }
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
            ccode = code.split('\n'), i, cleaned = [];

        if (!JXG.exists(geonext)) {
            geonext = false;
        }

        for (i = 0; i < ccode.length; i++) {
            if (!(JXG.trim(ccode[i])[0] === '/' && JXG.trim(ccode[i])[1] === '/')) {
                cleaned.push(ccode[i]);
            }

            if (geonext) {
                ccode[i] = ccode[i].replace(/Deg\(/g, 'deg(')
                                   .replace(/Rad\(/g, 'rad(')
                                   .replace(/Dist/g, 'dist(')
                                   .replace(/Factorial\(/g, 'factorial(')
                                   .replace(/If\(/g, 'if(')
                                   .replace(/Round\(/, 'round(');
            }
        }
        code = cleaned.join('\n');

        if((error_cnt = this._parse(code, error_off, error_la)) > 0) {
            for(i = 0; i < error_cnt; i++)
                alert("Parse error near >"  + code.substr( error_off[i], 30 ) + "<, expecting \"" + error_la[i].join() + "\"");
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
                    case 'op_paramlst':
                        if (node.children[0]) {
                            this.execute(node.children[0]);
                        }

                        if (node.children[1]) {
                            ret = node.children[1];
                            this.pstack[this.pscope].push(ret);
                        }
                        break;
                    case 'op_param':
                        if (node.children[0]) {
                            ret = node.children[0];
                            this.pstack[this.pscope].push(ret);
                        }
                        break;
                    case 'op_paramdeflst':
                        if (node.children[0]) {
                            this.execute(node.children[0]);
                        }
                        if (node.children[1]) {
                            ret = node.children[1];
                            this.pstack[this.pscope].push(ret);
                        }
                        break;
                    case 'op_paramdef':
                        if (node.children[0]) {
                            ret = node.children[0];
                            this.pstack[this.pscope].push(ret);
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

                        ret = (function(_pstack, that) { return function() {
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
                        }; })(this.pstack[this.pscope], this);

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
                        if (e.type && e.elementClass && e.methodMap) {
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

                            if (e.type && e.elementClass && v.toLowerCase() !== 'x' && v.toLowerCase() !== 'y') {
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
                    case 'op_add':
                        ret = this.execute(node.children[0]) + this.execute(node.children[1]);
                        break;
                    case 'op_sub':
                        ret = this.execute(node.children[0]) - this.execute(node.children[1]);
                        break;
                    case 'op_div':
                        ret = this.execute(node.children[0]) / this.execute(node.children[1]);
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
                ret = node.value !== 'false';
                break;

            case 'node_str':
                ret = node.value;
                break;
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

});/*
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
                return 57;
            }

            do {

switch( state )
{
	case 0:
		if( ( info.src.charCodeAt( pos ) >= 9 && info.src.charCodeAt( pos ) <= 10 ) || info.src.charCodeAt( pos ) == 13 || info.src.charCodeAt( pos ) == 32 ) state = 1;
		else if( info.src.charCodeAt( pos ) == 35 ) state = 2;
		else if( info.src.charCodeAt( pos ) == 36 || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 67 ) || ( info.src.charCodeAt( pos ) >= 71 && info.src.charCodeAt( pos ) <= 72 ) || ( info.src.charCodeAt( pos ) >= 74 && info.src.charCodeAt( pos ) <= 81 ) || info.src.charCodeAt( pos ) == 83 || info.src.charCodeAt( pos ) == 86 || ( info.src.charCodeAt( pos ) >= 88 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 99 ) || ( info.src.charCodeAt( pos ) >= 103 && info.src.charCodeAt( pos ) <= 104 ) || ( info.src.charCodeAt( pos ) >= 106 && info.src.charCodeAt( pos ) <= 113 ) || info.src.charCodeAt( pos ) == 115 || info.src.charCodeAt( pos ) == 118 || ( info.src.charCodeAt( pos ) >= 120 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 40 ) state = 4;
		else if( info.src.charCodeAt( pos ) == 41 ) state = 5;
		else if( info.src.charCodeAt( pos ) == 42 ) state = 6;
		else if( info.src.charCodeAt( pos ) == 43 ) state = 7;
		else if( info.src.charCodeAt( pos ) == 44 ) state = 8;
		else if( info.src.charCodeAt( pos ) == 45 ) state = 9;
		else if( info.src.charCodeAt( pos ) == 46 ) state = 10;
		else if( info.src.charCodeAt( pos ) == 47 ) state = 11;
		else if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) ) state = 12;
		else if( info.src.charCodeAt( pos ) == 58 ) state = 13;
		else if( info.src.charCodeAt( pos ) == 59 ) state = 14;
		else if( info.src.charCodeAt( pos ) == 60 ) state = 15;
		else if( info.src.charCodeAt( pos ) == 61 ) state = 16;
		else if( info.src.charCodeAt( pos ) == 62 ) state = 17;
		else if( info.src.charCodeAt( pos ) == 91 ) state = 18;
		else if( info.src.charCodeAt( pos ) == 93 ) state = 19;
		else if( info.src.charCodeAt( pos ) == 94 ) state = 20;
		else if( info.src.charCodeAt( pos ) == 123 ) state = 21;
		else if( info.src.charCodeAt( pos ) == 124 ) state = 22;
		else if( info.src.charCodeAt( pos ) == 125 ) state = 23;
		else if( info.src.charCodeAt( pos ) == 33 ) state = 42;
		else if( info.src.charCodeAt( pos ) == 68 || info.src.charCodeAt( pos ) == 100 ) state = 43;
		else if( info.src.charCodeAt( pos ) == 39 ) state = 44;
		else if( info.src.charCodeAt( pos ) == 73 || info.src.charCodeAt( pos ) == 105 ) state = 45;
		else if( info.src.charCodeAt( pos ) == 85 || info.src.charCodeAt( pos ) == 117 ) state = 54;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 62;
		else if( info.src.charCodeAt( pos ) == 84 || info.src.charCodeAt( pos ) == 116 ) state = 63;
		else if( info.src.charCodeAt( pos ) == 70 || info.src.charCodeAt( pos ) == 102 ) state = 69;
		else if( info.src.charCodeAt( pos ) == 87 || info.src.charCodeAt( pos ) == 119 ) state = 70;
		else if( info.src.charCodeAt( pos ) == 82 || info.src.charCodeAt( pos ) == 114 ) state = 74;
		else state = -1;
		break;

	case 1:
		state = -1;
		match = 1;
		match_pos = pos;
		break;

	case 2:
		state = -1;
		match = 34;
		match_pos = pos;
		break;

	case 3:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 4:
		state = -1;
		match = 31;
		match_pos = pos;
		break;

	case 5:
		state = -1;
		match = 32;
		match_pos = pos;
		break;

	case 6:
		state = -1;
		match = 29;
		match_pos = pos;
		break;

	case 7:
		state = -1;
		match = 26;
		match_pos = pos;
		break;

	case 8:
		state = -1;
		match = 33;
		match_pos = pos;
		break;

	case 9:
		state = -1;
		match = 27;
		match_pos = pos;
		break;

	case 10:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) ) state = 26;
		else state = -1;
		match = 37;
		match_pos = pos;
		break;

	case 11:
		state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 12:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) ) state = 12;
		else if( info.src.charCodeAt( pos ) == 46 ) state = 26;
		else state = -1;
		match = 40;
		match_pos = pos;
		break;

	case 13:
		state = -1;
		match = 35;
		match_pos = pos;
		break;

	case 14:
		state = -1;
		match = 18;
		match_pos = pos;
		break;

	case 15:
		if( info.src.charCodeAt( pos ) == 60 ) state = 27;
		else if( info.src.charCodeAt( pos ) == 61 ) state = 28;
		else state = -1;
		match = 25;
		match_pos = pos;
		break;

	case 16:
		if( info.src.charCodeAt( pos ) == 61 ) state = 29;
		else state = -1;
		match = 19;
		match_pos = pos;
		break;

	case 17:
		if( info.src.charCodeAt( pos ) == 61 ) state = 30;
		else if( info.src.charCodeAt( pos ) == 62 ) state = 31;
		else state = -1;
		match = 24;
		match_pos = pos;
		break;

	case 18:
		state = -1;
		match = 14;
		match_pos = pos;
		break;

	case 19:
		state = -1;
		match = 15;
		match_pos = pos;
		break;

	case 20:
		state = -1;
		match = 30;
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
		state = -1;
		match = 21;
		match_pos = pos;
		break;

	case 25:
		if( info.src.charCodeAt( pos ) == 39 ) state = 44;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 26:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) ) state = 26;
		else state = -1;
		match = 41;
		match_pos = pos;
		break;

	case 27:
		state = -1;
		match = 12;
		match_pos = pos;
		break;

	case 28:
		state = -1;
		match = 22;
		match_pos = pos;
		break;

	case 29:
		state = -1;
		match = 20;
		match_pos = pos;
		break;

	case 30:
		state = -1;
		match = 23;
		match_pos = pos;
		break;

	case 31:
		state = -1;
		match = 13;
		match_pos = pos;
		break;

	case 32:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else state = -1;
		match = 5;
		match_pos = pos;
		break;

	case 33:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else state = -1;
		match = 2;
		match_pos = pos;
		break;

	case 34:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else state = -1;
		match = 7;
		match_pos = pos;
		break;

	case 35:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else state = -1;
		match = 3;
		match_pos = pos;
		break;

	case 36:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else state = -1;
		match = 10;
		match_pos = pos;
		break;

	case 37:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else state = -1;
		match = 11;
		match_pos = pos;
		break;

	case 38:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else state = -1;
		match = 4;
		match_pos = pos;
		break;

	case 39:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else state = -1;
		match = 9;
		match_pos = pos;
		break;

	case 40:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else state = -1;
		match = 8;
		match_pos = pos;
		break;

	case 41:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else state = -1;
		match = 6;
		match_pos = pos;
		break;

	case 42:
		if( info.src.charCodeAt( pos ) == 61 ) state = 24;
		else state = -1;
		break;

	case 43:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 68 ) || ( info.src.charCodeAt( pos ) >= 70 && info.src.charCodeAt( pos ) <= 78 ) || ( info.src.charCodeAt( pos ) >= 80 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 110 ) || ( info.src.charCodeAt( pos ) >= 112 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 79 || info.src.charCodeAt( pos ) == 111 ) state = 32;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 71;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 44:
		if( info.src.charCodeAt( pos ) == 39 ) state = 25;
		else if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 38 ) || ( info.src.charCodeAt( pos ) >= 40 && info.src.charCodeAt( pos ) <= 254 ) ) state = 44;
		else state = -1;
		break;

	case 45:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 69 ) || ( info.src.charCodeAt( pos ) >= 71 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 101 ) || ( info.src.charCodeAt( pos ) >= 103 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 70 || info.src.charCodeAt( pos ) == 102 ) state = 33;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 46:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 68 ) || ( info.src.charCodeAt( pos ) >= 70 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 34;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 47:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 68 ) || ( info.src.charCodeAt( pos ) >= 70 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 35;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 48:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 68 ) || ( info.src.charCodeAt( pos ) >= 70 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 36;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 49:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 68 ) || ( info.src.charCodeAt( pos ) >= 70 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 37;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 50:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 68 ) || ( info.src.charCodeAt( pos ) >= 70 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 38;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 51:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 68 ) || ( info.src.charCodeAt( pos ) >= 70 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 39;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 52:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 77 ) || ( info.src.charCodeAt( pos ) >= 79 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 109 ) || ( info.src.charCodeAt( pos ) >= 111 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 78 || info.src.charCodeAt( pos ) == 110 ) state = 40;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 53:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 77 ) || ( info.src.charCodeAt( pos ) >= 79 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 109 ) || ( info.src.charCodeAt( pos ) >= 111 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 78 || info.src.charCodeAt( pos ) == 110 ) state = 41;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 54:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 82 ) || ( info.src.charCodeAt( pos ) >= 84 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 114 ) || ( info.src.charCodeAt( pos ) >= 116 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 83 || info.src.charCodeAt( pos ) == 115 ) state = 46;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 55:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 82 ) || ( info.src.charCodeAt( pos ) >= 84 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 114 ) || ( info.src.charCodeAt( pos ) >= 116 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 83 || info.src.charCodeAt( pos ) == 115 ) state = 47;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 56:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 84 ) || ( info.src.charCodeAt( pos ) >= 86 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 116 ) || ( info.src.charCodeAt( pos ) >= 118 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 85 || info.src.charCodeAt( pos ) == 117 ) state = 48;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 57:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 82 ) || ( info.src.charCodeAt( pos ) >= 84 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 114 ) || ( info.src.charCodeAt( pos ) >= 116 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 83 || info.src.charCodeAt( pos ) == 115 ) state = 49;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 58:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 75 ) || ( info.src.charCodeAt( pos ) >= 77 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 107 ) || ( info.src.charCodeAt( pos ) >= 109 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 76 || info.src.charCodeAt( pos ) == 108 ) state = 50;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 59:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 83 ) || ( info.src.charCodeAt( pos ) >= 85 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 115 ) || ( info.src.charCodeAt( pos ) >= 117 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 84 || info.src.charCodeAt( pos ) == 116 ) state = 51;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 60:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 81 ) || ( info.src.charCodeAt( pos ) >= 83 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 113 ) || ( info.src.charCodeAt( pos ) >= 115 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 82 || info.src.charCodeAt( pos ) == 114 ) state = 52;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 61:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 78 ) || ( info.src.charCodeAt( pos ) >= 80 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 110 ) || ( info.src.charCodeAt( pos ) >= 112 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 79 || info.src.charCodeAt( pos ) == 111 ) state = 53;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 62:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 75 ) || ( info.src.charCodeAt( pos ) >= 77 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 107 ) || ( info.src.charCodeAt( pos ) >= 109 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 76 || info.src.charCodeAt( pos ) == 108 ) state = 55;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 63:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 81 ) || ( info.src.charCodeAt( pos ) >= 83 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 113 ) || ( info.src.charCodeAt( pos ) >= 115 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 82 || info.src.charCodeAt( pos ) == 114 ) state = 56;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 64:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 75 ) || ( info.src.charCodeAt( pos ) >= 77 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 107 ) || ( info.src.charCodeAt( pos ) >= 109 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 76 || info.src.charCodeAt( pos ) == 108 ) state = 57;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 65:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 72 ) || ( info.src.charCodeAt( pos ) >= 74 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 104 ) || ( info.src.charCodeAt( pos ) >= 106 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 73 || info.src.charCodeAt( pos ) == 105 ) state = 58;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 66:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 68 ) || ( info.src.charCodeAt( pos ) >= 70 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 59;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 67:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 84 ) || ( info.src.charCodeAt( pos ) >= 86 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 116 ) || ( info.src.charCodeAt( pos ) >= 118 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 85 || info.src.charCodeAt( pos ) == 117 ) state = 60;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 68:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 72 ) || ( info.src.charCodeAt( pos ) >= 74 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 104 ) || ( info.src.charCodeAt( pos ) >= 106 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 73 || info.src.charCodeAt( pos ) == 105 ) state = 61;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 69:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 66 && info.src.charCodeAt( pos ) <= 84 ) || ( info.src.charCodeAt( pos ) >= 86 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 98 && info.src.charCodeAt( pos ) <= 116 ) || ( info.src.charCodeAt( pos ) >= 118 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 65 || info.src.charCodeAt( pos ) == 97 ) state = 64;
		else if( info.src.charCodeAt( pos ) == 85 || info.src.charCodeAt( pos ) == 117 ) state = 76;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 70:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 71 ) || ( info.src.charCodeAt( pos ) >= 73 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 103 ) || ( info.src.charCodeAt( pos ) >= 105 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 72 || info.src.charCodeAt( pos ) == 104 ) state = 65;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 71:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 75 ) || ( info.src.charCodeAt( pos ) >= 77 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 107 ) || ( info.src.charCodeAt( pos ) >= 109 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 76 || info.src.charCodeAt( pos ) == 108 ) state = 66;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 72:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 83 ) || ( info.src.charCodeAt( pos ) >= 85 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 115 ) || ( info.src.charCodeAt( pos ) >= 117 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 84 || info.src.charCodeAt( pos ) == 116 ) state = 67;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 73:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 83 ) || ( info.src.charCodeAt( pos ) >= 85 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 115 ) || ( info.src.charCodeAt( pos ) >= 117 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 84 || info.src.charCodeAt( pos ) == 116 ) state = 68;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 74:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 68 ) || ( info.src.charCodeAt( pos ) >= 70 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 72;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 75:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 66 ) || ( info.src.charCodeAt( pos ) >= 68 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 98 ) || ( info.src.charCodeAt( pos ) >= 100 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 67 || info.src.charCodeAt( pos ) == 99 ) state = 73;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 76:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 77 ) || ( info.src.charCodeAt( pos ) >= 79 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 109 ) || ( info.src.charCodeAt( pos ) >= 111 && info.src.charCodeAt( pos ) <= 122 ) ) state = 3;
		else if( info.src.charCodeAt( pos ) == 78 || info.src.charCodeAt( pos ) == 110 ) state = 75;
		else state = -1;
		match = 38;
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
	case 39:
		{
		 info.att = info.att.substr( 1, info.att.length - 2 );
                                                                                info.att = info.att.replace( /''/g, "\'" );    
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
	new Array( 42/* Program */, 2 ),
	new Array( 42/* Program */, 0 ),
	new Array( 44/* Stmt_List */, 2 ),
	new Array( 44/* Stmt_List */, 0 ),
	new Array( 45/* Param_List */, 3 ),
	new Array( 45/* Param_List */, 1 ),
	new Array( 45/* Param_List */, 0 ),
	new Array( 47/* Prop_List */, 3 ),
	new Array( 47/* Prop_List */, 1 ),
	new Array( 47/* Prop_List */, 0 ),
	new Array( 48/* Prop */, 3 ),
	new Array( 49/* Param_Def_List */, 3 ),
	new Array( 49/* Param_Def_List */, 1 ),
	new Array( 49/* Param_Def_List */, 0 ),
	new Array( 43/* Stmt */, 3 ),
	new Array( 43/* Stmt */, 5 ),
	new Array( 43/* Stmt */, 3 ),
	new Array( 43/* Stmt */, 5 ),
	new Array( 43/* Stmt */, 3 ),
	new Array( 43/* Stmt */, 2 ),
	new Array( 43/* Stmt */, 2 ),
	new Array( 43/* Stmt */, 4 ),
	new Array( 43/* Stmt */, 2 ),
	new Array( 43/* Stmt */, 3 ),
	new Array( 43/* Stmt */, 1 ),
	new Array( 50/* Lhs */, 3 ),
	new Array( 50/* Lhs */, 4 ),
	new Array( 50/* Lhs */, 1 ),
	new Array( 46/* Expression */, 3 ),
	new Array( 46/* Expression */, 3 ),
	new Array( 46/* Expression */, 3 ),
	new Array( 46/* Expression */, 3 ),
	new Array( 46/* Expression */, 3 ),
	new Array( 46/* Expression */, 3 ),
	new Array( 46/* Expression */, 1 ),
	new Array( 52/* AddSubExp */, 3 ),
	new Array( 52/* AddSubExp */, 3 ),
	new Array( 52/* AddSubExp */, 1 ),
	new Array( 53/* MulDivExp */, 3 ),
	new Array( 53/* MulDivExp */, 3 ),
	new Array( 53/* MulDivExp */, 1 ),
	new Array( 54/* ExpExp */, 3 ),
	new Array( 54/* ExpExp */, 1 ),
	new Array( 55/* NegExp */, 2 ),
	new Array( 55/* NegExp */, 1 ),
	new Array( 51/* ExtValue */, 4 ),
	new Array( 51/* ExtValue */, 4 ),
	new Array( 51/* ExtValue */, 7 ),
	new Array( 51/* ExtValue */, 3 ),
	new Array( 51/* ExtValue */, 1 ),
	new Array( 56/* Value */, 1 ),
	new Array( 56/* Value */, 1 ),
	new Array( 56/* Value */, 1 ),
	new Array( 56/* Value */, 3 ),
	new Array( 56/* Value */, 1 ),
	new Array( 56/* Value */, 7 ),
	new Array( 56/* Value */, 3 ),
	new Array( 56/* Value */, 3 ),
	new Array( 56/* Value */, 1 ),
	new Array( 56/* Value */, 1 )
);

/* Action-Table */
var act_tab = new Array(
	/* State 0 */ new Array( 57/* "$$" */,-2 , 2/* "IF" */,-2 , 4/* "WHILE" */,-2 , 5/* "DO" */,-2 , 7/* "USE" */,-2 , 9/* "DELETE" */,-2 , 8/* "RETURN" */,-2 , 16/* "{" */,-2 , 18/* ";" */,-2 , 38/* "Identifier" */,-2 , 40/* "Integer" */,-2 , 41/* "Float" */,-2 , 31/* "(" */,-2 , 39/* "String" */,-2 , 6/* "FUNCTION" */,-2 , 12/* "<<" */,-2 , 14/* "[" */,-2 , 10/* "TRUE" */,-2 , 11/* "FALSE" */,-2 , 27/* "-" */,-2 ),
	/* State 1 */ new Array( 2/* "IF" */,3 , 4/* "WHILE" */,4 , 5/* "DO" */,5 , 7/* "USE" */,6 , 9/* "DELETE" */,7 , 8/* "RETURN" */,8 , 16/* "{" */,11 , 18/* ";" */,12 , 38/* "Identifier" */,14 , 40/* "Integer" */,18 , 41/* "Float" */,19 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 , 27/* "-" */,29 , 57/* "$$" */,0 ),
	/* State 2 */ new Array( 57/* "$$" */,-1 , 2/* "IF" */,-1 , 4/* "WHILE" */,-1 , 5/* "DO" */,-1 , 7/* "USE" */,-1 , 9/* "DELETE" */,-1 , 8/* "RETURN" */,-1 , 16/* "{" */,-1 , 18/* ";" */,-1 , 38/* "Identifier" */,-1 , 40/* "Integer" */,-1 , 41/* "Float" */,-1 , 31/* "(" */,-1 , 39/* "String" */,-1 , 6/* "FUNCTION" */,-1 , 12/* "<<" */,-1 , 14/* "[" */,-1 , 10/* "TRUE" */,-1 , 11/* "FALSE" */,-1 , 27/* "-" */,-1 ),
	/* State 3 */ new Array( 27/* "-" */,29 , 40/* "Integer" */,18 , 41/* "Float" */,19 , 38/* "Identifier" */,32 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 ),
	/* State 4 */ new Array( 27/* "-" */,29 , 40/* "Integer" */,18 , 41/* "Float" */,19 , 38/* "Identifier" */,32 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 ),
	/* State 5 */ new Array( 2/* "IF" */,3 , 4/* "WHILE" */,4 , 5/* "DO" */,5 , 7/* "USE" */,6 , 9/* "DELETE" */,7 , 8/* "RETURN" */,8 , 16/* "{" */,11 , 18/* ";" */,12 , 38/* "Identifier" */,14 , 40/* "Integer" */,18 , 41/* "Float" */,19 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 , 27/* "-" */,29 ),
	/* State 6 */ new Array( 38/* "Identifier" */,35 ),
	/* State 7 */ new Array( 38/* "Identifier" */,36 ),
	/* State 8 */ new Array( 2/* "IF" */,3 , 4/* "WHILE" */,4 , 5/* "DO" */,5 , 7/* "USE" */,6 , 9/* "DELETE" */,7 , 8/* "RETURN" */,8 , 16/* "{" */,11 , 18/* ";" */,12 , 38/* "Identifier" */,14 , 40/* "Integer" */,18 , 41/* "Float" */,19 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 , 27/* "-" */,29 ),
	/* State 9 */ new Array( 19/* "=" */,38 ),
	/* State 10 */ new Array( 21/* "!=" */,39 , 23/* ">=" */,40 , 22/* "<=" */,41 , 24/* ">" */,42 , 25/* "<" */,43 , 20/* "==" */,44 , 18/* ";" */,45 ),
	/* State 11 */ new Array( 17/* "}" */,-4 , 2/* "IF" */,-4 , 4/* "WHILE" */,-4 , 5/* "DO" */,-4 , 7/* "USE" */,-4 , 9/* "DELETE" */,-4 , 8/* "RETURN" */,-4 , 16/* "{" */,-4 , 18/* ";" */,-4 , 38/* "Identifier" */,-4 , 40/* "Integer" */,-4 , 41/* "Float" */,-4 , 31/* "(" */,-4 , 39/* "String" */,-4 , 6/* "FUNCTION" */,-4 , 12/* "<<" */,-4 , 14/* "[" */,-4 , 10/* "TRUE" */,-4 , 11/* "FALSE" */,-4 , 27/* "-" */,-4 ),
	/* State 12 */ new Array( 57/* "$$" */,-25 , 2/* "IF" */,-25 , 4/* "WHILE" */,-25 , 5/* "DO" */,-25 , 7/* "USE" */,-25 , 9/* "DELETE" */,-25 , 8/* "RETURN" */,-25 , 16/* "{" */,-25 , 18/* ";" */,-25 , 38/* "Identifier" */,-25 , 40/* "Integer" */,-25 , 41/* "Float" */,-25 , 31/* "(" */,-25 , 39/* "String" */,-25 , 6/* "FUNCTION" */,-25 , 12/* "<<" */,-25 , 14/* "[" */,-25 , 10/* "TRUE" */,-25 , 11/* "FALSE" */,-25 , 27/* "-" */,-25 , 3/* "ELSE" */,-25 , 17/* "}" */,-25 ),
	/* State 13 */ new Array( 37/* "." */,47 , 31/* "(" */,48 , 14/* "[" */,49 , 18/* ";" */,-45 , 20/* "==" */,-45 , 25/* "<" */,-45 , 24/* ">" */,-45 , 22/* "<=" */,-45 , 23/* ">=" */,-45 , 21/* "!=" */,-45 , 27/* "-" */,-45 , 26/* "+" */,-45 , 29/* "*" */,-45 , 28/* "/" */,-45 , 30/* "^" */,-45 ),
	/* State 14 */ new Array( 19/* "=" */,-28 , 37/* "." */,-53 , 14/* "[" */,-53 , 31/* "(" */,-53 , 18/* ";" */,-53 , 20/* "==" */,-53 , 25/* "<" */,-53 , 24/* ">" */,-53 , 22/* "<=" */,-53 , 23/* ">=" */,-53 , 21/* "!=" */,-53 , 27/* "-" */,-53 , 26/* "+" */,-53 , 29/* "*" */,-53 , 28/* "/" */,-53 , 30/* "^" */,-53 ),
	/* State 15 */ new Array( 26/* "+" */,50 , 27/* "-" */,51 , 18/* ";" */,-35 , 20/* "==" */,-35 , 25/* "<" */,-35 , 24/* ">" */,-35 , 22/* "<=" */,-35 , 23/* ">=" */,-35 , 21/* "!=" */,-35 , 2/* "IF" */,-35 , 4/* "WHILE" */,-35 , 5/* "DO" */,-35 , 7/* "USE" */,-35 , 9/* "DELETE" */,-35 , 8/* "RETURN" */,-35 , 16/* "{" */,-35 , 38/* "Identifier" */,-35 , 40/* "Integer" */,-35 , 41/* "Float" */,-35 , 31/* "(" */,-35 , 39/* "String" */,-35 , 6/* "FUNCTION" */,-35 , 12/* "<<" */,-35 , 14/* "[" */,-35 , 10/* "TRUE" */,-35 , 11/* "FALSE" */,-35 , 32/* ")" */,-35 , 15/* "]" */,-35 , 33/* "," */,-35 , 13/* ">>" */,-35 ),
	/* State 16 */ new Array( 37/* "." */,-50 , 14/* "[" */,-50 , 31/* "(" */,-50 , 18/* ";" */,-50 , 20/* "==" */,-50 , 25/* "<" */,-50 , 24/* ">" */,-50 , 22/* "<=" */,-50 , 23/* ">=" */,-50 , 21/* "!=" */,-50 , 27/* "-" */,-50 , 26/* "+" */,-50 , 29/* "*" */,-50 , 28/* "/" */,-50 , 30/* "^" */,-50 , 2/* "IF" */,-50 , 4/* "WHILE" */,-50 , 5/* "DO" */,-50 , 7/* "USE" */,-50 , 9/* "DELETE" */,-50 , 8/* "RETURN" */,-50 , 16/* "{" */,-50 , 38/* "Identifier" */,-50 , 40/* "Integer" */,-50 , 41/* "Float" */,-50 , 39/* "String" */,-50 , 6/* "FUNCTION" */,-50 , 12/* "<<" */,-50 , 10/* "TRUE" */,-50 , 11/* "FALSE" */,-50 , 32/* ")" */,-50 , 15/* "]" */,-50 , 33/* "," */,-50 , 13/* ">>" */,-50 ),
	/* State 17 */ new Array( 28/* "/" */,52 , 29/* "*" */,53 , 18/* ";" */,-38 , 20/* "==" */,-38 , 25/* "<" */,-38 , 24/* ">" */,-38 , 22/* "<=" */,-38 , 23/* ">=" */,-38 , 21/* "!=" */,-38 , 27/* "-" */,-38 , 26/* "+" */,-38 , 2/* "IF" */,-38 , 4/* "WHILE" */,-38 , 5/* "DO" */,-38 , 7/* "USE" */,-38 , 9/* "DELETE" */,-38 , 8/* "RETURN" */,-38 , 16/* "{" */,-38 , 38/* "Identifier" */,-38 , 40/* "Integer" */,-38 , 41/* "Float" */,-38 , 31/* "(" */,-38 , 39/* "String" */,-38 , 6/* "FUNCTION" */,-38 , 12/* "<<" */,-38 , 14/* "[" */,-38 , 10/* "TRUE" */,-38 , 11/* "FALSE" */,-38 , 32/* ")" */,-38 , 15/* "]" */,-38 , 33/* "," */,-38 , 13/* ">>" */,-38 ),
	/* State 18 */ new Array( 37/* "." */,-51 , 14/* "[" */,-51 , 31/* "(" */,-51 , 18/* ";" */,-51 , 20/* "==" */,-51 , 25/* "<" */,-51 , 24/* ">" */,-51 , 22/* "<=" */,-51 , 23/* ">=" */,-51 , 21/* "!=" */,-51 , 27/* "-" */,-51 , 26/* "+" */,-51 , 29/* "*" */,-51 , 28/* "/" */,-51 , 30/* "^" */,-51 , 2/* "IF" */,-51 , 4/* "WHILE" */,-51 , 5/* "DO" */,-51 , 7/* "USE" */,-51 , 9/* "DELETE" */,-51 , 8/* "RETURN" */,-51 , 16/* "{" */,-51 , 38/* "Identifier" */,-51 , 40/* "Integer" */,-51 , 41/* "Float" */,-51 , 39/* "String" */,-51 , 6/* "FUNCTION" */,-51 , 12/* "<<" */,-51 , 10/* "TRUE" */,-51 , 11/* "FALSE" */,-51 , 32/* ")" */,-51 , 15/* "]" */,-51 , 33/* "," */,-51 , 13/* ">>" */,-51 ),
	/* State 19 */ new Array( 37/* "." */,-52 , 14/* "[" */,-52 , 31/* "(" */,-52 , 18/* ";" */,-52 , 20/* "==" */,-52 , 25/* "<" */,-52 , 24/* ">" */,-52 , 22/* "<=" */,-52 , 23/* ">=" */,-52 , 21/* "!=" */,-52 , 27/* "-" */,-52 , 26/* "+" */,-52 , 29/* "*" */,-52 , 28/* "/" */,-52 , 30/* "^" */,-52 , 2/* "IF" */,-52 , 4/* "WHILE" */,-52 , 5/* "DO" */,-52 , 7/* "USE" */,-52 , 9/* "DELETE" */,-52 , 8/* "RETURN" */,-52 , 16/* "{" */,-52 , 38/* "Identifier" */,-52 , 40/* "Integer" */,-52 , 41/* "Float" */,-52 , 39/* "String" */,-52 , 6/* "FUNCTION" */,-52 , 12/* "<<" */,-52 , 10/* "TRUE" */,-52 , 11/* "FALSE" */,-52 , 32/* ")" */,-52 , 15/* "]" */,-52 , 33/* "," */,-52 , 13/* ">>" */,-52 ),
	/* State 20 */ new Array( 27/* "-" */,29 , 40/* "Integer" */,18 , 41/* "Float" */,19 , 38/* "Identifier" */,32 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 ),
	/* State 21 */ new Array( 37/* "." */,-55 , 14/* "[" */,-55 , 31/* "(" */,-55 , 18/* ";" */,-55 , 20/* "==" */,-55 , 25/* "<" */,-55 , 24/* ">" */,-55 , 22/* "<=" */,-55 , 23/* ">=" */,-55 , 21/* "!=" */,-55 , 27/* "-" */,-55 , 26/* "+" */,-55 , 29/* "*" */,-55 , 28/* "/" */,-55 , 30/* "^" */,-55 , 2/* "IF" */,-55 , 4/* "WHILE" */,-55 , 5/* "DO" */,-55 , 7/* "USE" */,-55 , 9/* "DELETE" */,-55 , 8/* "RETURN" */,-55 , 16/* "{" */,-55 , 38/* "Identifier" */,-55 , 40/* "Integer" */,-55 , 41/* "Float" */,-55 , 39/* "String" */,-55 , 6/* "FUNCTION" */,-55 , 12/* "<<" */,-55 , 10/* "TRUE" */,-55 , 11/* "FALSE" */,-55 , 32/* ")" */,-55 , 15/* "]" */,-55 , 33/* "," */,-55 , 13/* ">>" */,-55 ),
	/* State 22 */ new Array( 31/* "(" */,55 ),
	/* State 23 */ new Array( 38/* "Identifier" */,58 , 13/* ">>" */,-10 , 33/* "," */,-10 ),
	/* State 24 */ new Array( 27/* "-" */,29 , 40/* "Integer" */,18 , 41/* "Float" */,19 , 38/* "Identifier" */,32 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 , 15/* "]" */,-7 , 33/* "," */,-7 ),
	/* State 25 */ new Array( 37/* "." */,-59 , 14/* "[" */,-59 , 31/* "(" */,-59 , 18/* ";" */,-59 , 20/* "==" */,-59 , 25/* "<" */,-59 , 24/* ">" */,-59 , 22/* "<=" */,-59 , 23/* ">=" */,-59 , 21/* "!=" */,-59 , 27/* "-" */,-59 , 26/* "+" */,-59 , 29/* "*" */,-59 , 28/* "/" */,-59 , 30/* "^" */,-59 , 2/* "IF" */,-59 , 4/* "WHILE" */,-59 , 5/* "DO" */,-59 , 7/* "USE" */,-59 , 9/* "DELETE" */,-59 , 8/* "RETURN" */,-59 , 16/* "{" */,-59 , 38/* "Identifier" */,-59 , 40/* "Integer" */,-59 , 41/* "Float" */,-59 , 39/* "String" */,-59 , 6/* "FUNCTION" */,-59 , 12/* "<<" */,-59 , 10/* "TRUE" */,-59 , 11/* "FALSE" */,-59 , 32/* ")" */,-59 , 15/* "]" */,-59 , 33/* "," */,-59 , 13/* ">>" */,-59 ),
	/* State 26 */ new Array( 37/* "." */,-60 , 14/* "[" */,-60 , 31/* "(" */,-60 , 18/* ";" */,-60 , 20/* "==" */,-60 , 25/* "<" */,-60 , 24/* ">" */,-60 , 22/* "<=" */,-60 , 23/* ">=" */,-60 , 21/* "!=" */,-60 , 27/* "-" */,-60 , 26/* "+" */,-60 , 29/* "*" */,-60 , 28/* "/" */,-60 , 30/* "^" */,-60 , 2/* "IF" */,-60 , 4/* "WHILE" */,-60 , 5/* "DO" */,-60 , 7/* "USE" */,-60 , 9/* "DELETE" */,-60 , 8/* "RETURN" */,-60 , 16/* "{" */,-60 , 38/* "Identifier" */,-60 , 40/* "Integer" */,-60 , 41/* "Float" */,-60 , 39/* "String" */,-60 , 6/* "FUNCTION" */,-60 , 12/* "<<" */,-60 , 10/* "TRUE" */,-60 , 11/* "FALSE" */,-60 , 32/* ")" */,-60 , 15/* "]" */,-60 , 33/* "," */,-60 , 13/* ">>" */,-60 ),
	/* State 27 */ new Array( 30/* "^" */,61 , 18/* ";" */,-41 , 20/* "==" */,-41 , 25/* "<" */,-41 , 24/* ">" */,-41 , 22/* "<=" */,-41 , 23/* ">=" */,-41 , 21/* "!=" */,-41 , 27/* "-" */,-41 , 26/* "+" */,-41 , 29/* "*" */,-41 , 28/* "/" */,-41 , 2/* "IF" */,-41 , 4/* "WHILE" */,-41 , 5/* "DO" */,-41 , 7/* "USE" */,-41 , 9/* "DELETE" */,-41 , 8/* "RETURN" */,-41 , 16/* "{" */,-41 , 38/* "Identifier" */,-41 , 40/* "Integer" */,-41 , 41/* "Float" */,-41 , 31/* "(" */,-41 , 39/* "String" */,-41 , 6/* "FUNCTION" */,-41 , 12/* "<<" */,-41 , 14/* "[" */,-41 , 10/* "TRUE" */,-41 , 11/* "FALSE" */,-41 , 32/* ")" */,-41 , 15/* "]" */,-41 , 33/* "," */,-41 , 13/* ">>" */,-41 ),
	/* State 28 */ new Array( 18/* ";" */,-43 , 20/* "==" */,-43 , 25/* "<" */,-43 , 24/* ">" */,-43 , 22/* "<=" */,-43 , 23/* ">=" */,-43 , 21/* "!=" */,-43 , 27/* "-" */,-43 , 26/* "+" */,-43 , 29/* "*" */,-43 , 28/* "/" */,-43 , 30/* "^" */,-43 , 2/* "IF" */,-43 , 4/* "WHILE" */,-43 , 5/* "DO" */,-43 , 7/* "USE" */,-43 , 9/* "DELETE" */,-43 , 8/* "RETURN" */,-43 , 16/* "{" */,-43 , 38/* "Identifier" */,-43 , 40/* "Integer" */,-43 , 41/* "Float" */,-43 , 31/* "(" */,-43 , 39/* "String" */,-43 , 6/* "FUNCTION" */,-43 , 12/* "<<" */,-43 , 14/* "[" */,-43 , 10/* "TRUE" */,-43 , 11/* "FALSE" */,-43 , 32/* ")" */,-43 , 15/* "]" */,-43 , 33/* "," */,-43 , 13/* ">>" */,-43 ),
	/* State 29 */ new Array( 40/* "Integer" */,18 , 41/* "Float" */,19 , 38/* "Identifier" */,32 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 ),
	/* State 30 */ new Array( 21/* "!=" */,39 , 23/* ">=" */,40 , 22/* "<=" */,41 , 24/* ">" */,42 , 25/* "<" */,43 , 20/* "==" */,44 , 2/* "IF" */,3 , 4/* "WHILE" */,4 , 5/* "DO" */,5 , 7/* "USE" */,6 , 9/* "DELETE" */,7 , 8/* "RETURN" */,8 , 16/* "{" */,11 , 18/* ";" */,12 , 38/* "Identifier" */,14 , 40/* "Integer" */,18 , 41/* "Float" */,19 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 , 27/* "-" */,29 ),
	/* State 31 */ new Array( 37/* "." */,64 , 31/* "(" */,48 , 14/* "[" */,65 , 2/* "IF" */,-45 , 4/* "WHILE" */,-45 , 5/* "DO" */,-45 , 7/* "USE" */,-45 , 9/* "DELETE" */,-45 , 8/* "RETURN" */,-45 , 16/* "{" */,-45 , 18/* ";" */,-45 , 38/* "Identifier" */,-45 , 40/* "Integer" */,-45 , 41/* "Float" */,-45 , 39/* "String" */,-45 , 6/* "FUNCTION" */,-45 , 12/* "<<" */,-45 , 10/* "TRUE" */,-45 , 11/* "FALSE" */,-45 , 27/* "-" */,-45 , 20/* "==" */,-45 , 25/* "<" */,-45 , 24/* ">" */,-45 , 22/* "<=" */,-45 , 23/* ">=" */,-45 , 21/* "!=" */,-45 , 26/* "+" */,-45 , 29/* "*" */,-45 , 28/* "/" */,-45 , 30/* "^" */,-45 , 32/* ")" */,-45 , 15/* "]" */,-45 , 33/* "," */,-45 , 13/* ">>" */,-45 ),
	/* State 32 */ new Array( 2/* "IF" */,-53 , 4/* "WHILE" */,-53 , 5/* "DO" */,-53 , 7/* "USE" */,-53 , 9/* "DELETE" */,-53 , 8/* "RETURN" */,-53 , 16/* "{" */,-53 , 18/* ";" */,-53 , 38/* "Identifier" */,-53 , 40/* "Integer" */,-53 , 41/* "Float" */,-53 , 31/* "(" */,-53 , 39/* "String" */,-53 , 6/* "FUNCTION" */,-53 , 12/* "<<" */,-53 , 14/* "[" */,-53 , 10/* "TRUE" */,-53 , 11/* "FALSE" */,-53 , 27/* "-" */,-53 , 20/* "==" */,-53 , 25/* "<" */,-53 , 24/* ">" */,-53 , 22/* "<=" */,-53 , 23/* ">=" */,-53 , 21/* "!=" */,-53 , 26/* "+" */,-53 , 29/* "*" */,-53 , 28/* "/" */,-53 , 30/* "^" */,-53 , 37/* "." */,-53 , 32/* ")" */,-53 , 15/* "]" */,-53 , 33/* "," */,-53 , 13/* ">>" */,-53 ),
	/* State 33 */ new Array( 21/* "!=" */,39 , 23/* ">=" */,40 , 22/* "<=" */,41 , 24/* ">" */,42 , 25/* "<" */,43 , 20/* "==" */,44 , 2/* "IF" */,3 , 4/* "WHILE" */,4 , 5/* "DO" */,5 , 7/* "USE" */,6 , 9/* "DELETE" */,7 , 8/* "RETURN" */,8 , 16/* "{" */,11 , 18/* ";" */,12 , 38/* "Identifier" */,14 , 40/* "Integer" */,18 , 41/* "Float" */,19 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 , 27/* "-" */,29 ),
	/* State 34 */ new Array( 4/* "WHILE" */,67 ),
	/* State 35 */ new Array( 18/* ";" */,68 ),
	/* State 36 */ new Array( 57/* "$$" */,-20 , 2/* "IF" */,-20 , 4/* "WHILE" */,-20 , 5/* "DO" */,-20 , 7/* "USE" */,-20 , 9/* "DELETE" */,-20 , 8/* "RETURN" */,-20 , 16/* "{" */,-20 , 18/* ";" */,-20 , 38/* "Identifier" */,-20 , 40/* "Integer" */,-20 , 41/* "Float" */,-20 , 31/* "(" */,-20 , 39/* "String" */,-20 , 6/* "FUNCTION" */,-20 , 12/* "<<" */,-20 , 14/* "[" */,-20 , 10/* "TRUE" */,-20 , 11/* "FALSE" */,-20 , 27/* "-" */,-20 , 3/* "ELSE" */,-20 , 17/* "}" */,-20 ),
	/* State 37 */ new Array( 57/* "$$" */,-21 , 2/* "IF" */,-21 , 4/* "WHILE" */,-21 , 5/* "DO" */,-21 , 7/* "USE" */,-21 , 9/* "DELETE" */,-21 , 8/* "RETURN" */,-21 , 16/* "{" */,-21 , 18/* ";" */,-21 , 38/* "Identifier" */,-21 , 40/* "Integer" */,-21 , 41/* "Float" */,-21 , 31/* "(" */,-21 , 39/* "String" */,-21 , 6/* "FUNCTION" */,-21 , 12/* "<<" */,-21 , 14/* "[" */,-21 , 10/* "TRUE" */,-21 , 11/* "FALSE" */,-21 , 27/* "-" */,-21 , 3/* "ELSE" */,-21 , 17/* "}" */,-21 ),
	/* State 38 */ new Array( 27/* "-" */,29 , 40/* "Integer" */,18 , 41/* "Float" */,19 , 38/* "Identifier" */,32 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 ),
	/* State 39 */ new Array( 27/* "-" */,29 , 40/* "Integer" */,18 , 41/* "Float" */,19 , 38/* "Identifier" */,32 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 ),
	/* State 40 */ new Array( 27/* "-" */,29 , 40/* "Integer" */,18 , 41/* "Float" */,19 , 38/* "Identifier" */,32 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 ),
	/* State 41 */ new Array( 27/* "-" */,29 , 40/* "Integer" */,18 , 41/* "Float" */,19 , 38/* "Identifier" */,32 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 ),
	/* State 42 */ new Array( 27/* "-" */,29 , 40/* "Integer" */,18 , 41/* "Float" */,19 , 38/* "Identifier" */,32 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 ),
	/* State 43 */ new Array( 27/* "-" */,29 , 40/* "Integer" */,18 , 41/* "Float" */,19 , 38/* "Identifier" */,32 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 ),
	/* State 44 */ new Array( 27/* "-" */,29 , 40/* "Integer" */,18 , 41/* "Float" */,19 , 38/* "Identifier" */,32 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 ),
	/* State 45 */ new Array( 57/* "$$" */,-23 , 2/* "IF" */,-23 , 4/* "WHILE" */,-23 , 5/* "DO" */,-23 , 7/* "USE" */,-23 , 9/* "DELETE" */,-23 , 8/* "RETURN" */,-23 , 16/* "{" */,-23 , 18/* ";" */,-23 , 38/* "Identifier" */,-23 , 40/* "Integer" */,-23 , 41/* "Float" */,-23 , 31/* "(" */,-23 , 39/* "String" */,-23 , 6/* "FUNCTION" */,-23 , 12/* "<<" */,-23 , 14/* "[" */,-23 , 10/* "TRUE" */,-23 , 11/* "FALSE" */,-23 , 27/* "-" */,-23 , 3/* "ELSE" */,-23 , 17/* "}" */,-23 ),
	/* State 46 */ new Array( 17/* "}" */,77 , 2/* "IF" */,3 , 4/* "WHILE" */,4 , 5/* "DO" */,5 , 7/* "USE" */,6 , 9/* "DELETE" */,7 , 8/* "RETURN" */,8 , 16/* "{" */,11 , 18/* ";" */,12 , 38/* "Identifier" */,14 , 40/* "Integer" */,18 , 41/* "Float" */,19 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 , 27/* "-" */,29 ),
	/* State 47 */ new Array( 38/* "Identifier" */,78 ),
	/* State 48 */ new Array( 27/* "-" */,29 , 40/* "Integer" */,18 , 41/* "Float" */,19 , 38/* "Identifier" */,32 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 , 32/* ")" */,-7 , 33/* "," */,-7 ),
	/* State 49 */ new Array( 27/* "-" */,29 , 40/* "Integer" */,18 , 41/* "Float" */,19 , 38/* "Identifier" */,32 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 ),
	/* State 50 */ new Array( 27/* "-" */,29 , 40/* "Integer" */,18 , 41/* "Float" */,19 , 38/* "Identifier" */,32 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 ),
	/* State 51 */ new Array( 27/* "-" */,29 , 40/* "Integer" */,18 , 41/* "Float" */,19 , 38/* "Identifier" */,32 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 ),
	/* State 52 */ new Array( 27/* "-" */,29 , 40/* "Integer" */,18 , 41/* "Float" */,19 , 38/* "Identifier" */,32 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 ),
	/* State 53 */ new Array( 27/* "-" */,29 , 40/* "Integer" */,18 , 41/* "Float" */,19 , 38/* "Identifier" */,32 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 ),
	/* State 54 */ new Array( 21/* "!=" */,39 , 23/* ">=" */,40 , 22/* "<=" */,41 , 24/* ">" */,42 , 25/* "<" */,43 , 20/* "==" */,44 , 32/* ")" */,85 ),
	/* State 55 */ new Array( 38/* "Identifier" */,87 , 32/* ")" */,-14 , 33/* "," */,-14 ),
	/* State 56 */ new Array( 33/* "," */,88 , 13/* ">>" */,89 ),
	/* State 57 */ new Array( 13/* ">>" */,-9 , 33/* "," */,-9 ),
	/* State 58 */ new Array( 35/* ":" */,90 ),
	/* State 59 */ new Array( 33/* "," */,91 , 15/* "]" */,92 ),
	/* State 60 */ new Array( 21/* "!=" */,39 , 23/* ">=" */,40 , 22/* "<=" */,41 , 24/* ">" */,42 , 25/* "<" */,43 , 20/* "==" */,44 , 15/* "]" */,-6 , 33/* "," */,-6 , 32/* ")" */,-6 ),
	/* State 61 */ new Array( 27/* "-" */,29 , 40/* "Integer" */,18 , 41/* "Float" */,19 , 38/* "Identifier" */,32 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 ),
	/* State 62 */ new Array( 37/* "." */,64 , 31/* "(" */,48 , 14/* "[" */,65 , 18/* ";" */,-44 , 20/* "==" */,-44 , 25/* "<" */,-44 , 24/* ">" */,-44 , 22/* "<=" */,-44 , 23/* ">=" */,-44 , 21/* "!=" */,-44 , 27/* "-" */,-44 , 26/* "+" */,-44 , 29/* "*" */,-44 , 28/* "/" */,-44 , 30/* "^" */,-44 , 2/* "IF" */,-44 , 4/* "WHILE" */,-44 , 5/* "DO" */,-44 , 7/* "USE" */,-44 , 9/* "DELETE" */,-44 , 8/* "RETURN" */,-44 , 16/* "{" */,-44 , 38/* "Identifier" */,-44 , 40/* "Integer" */,-44 , 41/* "Float" */,-44 , 39/* "String" */,-44 , 6/* "FUNCTION" */,-44 , 12/* "<<" */,-44 , 10/* "TRUE" */,-44 , 11/* "FALSE" */,-44 , 32/* ")" */,-44 , 15/* "]" */,-44 , 33/* "," */,-44 , 13/* ">>" */,-44 ),
	/* State 63 */ new Array( 3/* "ELSE" */,94 , 57/* "$$" */,-15 , 2/* "IF" */,-15 , 4/* "WHILE" */,-15 , 5/* "DO" */,-15 , 7/* "USE" */,-15 , 9/* "DELETE" */,-15 , 8/* "RETURN" */,-15 , 16/* "{" */,-15 , 18/* ";" */,-15 , 38/* "Identifier" */,-15 , 40/* "Integer" */,-15 , 41/* "Float" */,-15 , 31/* "(" */,-15 , 39/* "String" */,-15 , 6/* "FUNCTION" */,-15 , 12/* "<<" */,-15 , 14/* "[" */,-15 , 10/* "TRUE" */,-15 , 11/* "FALSE" */,-15 , 27/* "-" */,-15 , 17/* "}" */,-15 ),
	/* State 64 */ new Array( 38/* "Identifier" */,95 ),
	/* State 65 */ new Array( 27/* "-" */,29 , 40/* "Integer" */,18 , 41/* "Float" */,19 , 38/* "Identifier" */,32 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 ),
	/* State 66 */ new Array( 57/* "$$" */,-17 , 2/* "IF" */,-17 , 4/* "WHILE" */,-17 , 5/* "DO" */,-17 , 7/* "USE" */,-17 , 9/* "DELETE" */,-17 , 8/* "RETURN" */,-17 , 16/* "{" */,-17 , 18/* ";" */,-17 , 38/* "Identifier" */,-17 , 40/* "Integer" */,-17 , 41/* "Float" */,-17 , 31/* "(" */,-17 , 39/* "String" */,-17 , 6/* "FUNCTION" */,-17 , 12/* "<<" */,-17 , 14/* "[" */,-17 , 10/* "TRUE" */,-17 , 11/* "FALSE" */,-17 , 27/* "-" */,-17 , 3/* "ELSE" */,-17 , 17/* "}" */,-17 ),
	/* State 67 */ new Array( 27/* "-" */,29 , 40/* "Integer" */,18 , 41/* "Float" */,19 , 38/* "Identifier" */,32 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 ),
	/* State 68 */ new Array( 57/* "$$" */,-19 , 2/* "IF" */,-19 , 4/* "WHILE" */,-19 , 5/* "DO" */,-19 , 7/* "USE" */,-19 , 9/* "DELETE" */,-19 , 8/* "RETURN" */,-19 , 16/* "{" */,-19 , 18/* ";" */,-19 , 38/* "Identifier" */,-19 , 40/* "Integer" */,-19 , 41/* "Float" */,-19 , 31/* "(" */,-19 , 39/* "String" */,-19 , 6/* "FUNCTION" */,-19 , 12/* "<<" */,-19 , 14/* "[" */,-19 , 10/* "TRUE" */,-19 , 11/* "FALSE" */,-19 , 27/* "-" */,-19 , 3/* "ELSE" */,-19 , 17/* "}" */,-19 ),
	/* State 69 */ new Array( 21/* "!=" */,39 , 23/* ">=" */,40 , 22/* "<=" */,41 , 24/* ">" */,42 , 25/* "<" */,43 , 20/* "==" */,44 , 18/* ";" */,98 ),
	/* State 70 */ new Array( 26/* "+" */,50 , 27/* "-" */,51 , 18/* ";" */,-34 , 20/* "==" */,-34 , 25/* "<" */,-34 , 24/* ">" */,-34 , 22/* "<=" */,-34 , 23/* ">=" */,-34 , 21/* "!=" */,-34 , 2/* "IF" */,-34 , 4/* "WHILE" */,-34 , 5/* "DO" */,-34 , 7/* "USE" */,-34 , 9/* "DELETE" */,-34 , 8/* "RETURN" */,-34 , 16/* "{" */,-34 , 38/* "Identifier" */,-34 , 40/* "Integer" */,-34 , 41/* "Float" */,-34 , 31/* "(" */,-34 , 39/* "String" */,-34 , 6/* "FUNCTION" */,-34 , 12/* "<<" */,-34 , 14/* "[" */,-34 , 10/* "TRUE" */,-34 , 11/* "FALSE" */,-34 , 32/* ")" */,-34 , 15/* "]" */,-34 , 33/* "," */,-34 , 13/* ">>" */,-34 ),
	/* State 71 */ new Array( 26/* "+" */,50 , 27/* "-" */,51 , 18/* ";" */,-33 , 20/* "==" */,-33 , 25/* "<" */,-33 , 24/* ">" */,-33 , 22/* "<=" */,-33 , 23/* ">=" */,-33 , 21/* "!=" */,-33 , 2/* "IF" */,-33 , 4/* "WHILE" */,-33 , 5/* "DO" */,-33 , 7/* "USE" */,-33 , 9/* "DELETE" */,-33 , 8/* "RETURN" */,-33 , 16/* "{" */,-33 , 38/* "Identifier" */,-33 , 40/* "Integer" */,-33 , 41/* "Float" */,-33 , 31/* "(" */,-33 , 39/* "String" */,-33 , 6/* "FUNCTION" */,-33 , 12/* "<<" */,-33 , 14/* "[" */,-33 , 10/* "TRUE" */,-33 , 11/* "FALSE" */,-33 , 32/* ")" */,-33 , 15/* "]" */,-33 , 33/* "," */,-33 , 13/* ">>" */,-33 ),
	/* State 72 */ new Array( 26/* "+" */,50 , 27/* "-" */,51 , 18/* ";" */,-32 , 20/* "==" */,-32 , 25/* "<" */,-32 , 24/* ">" */,-32 , 22/* "<=" */,-32 , 23/* ">=" */,-32 , 21/* "!=" */,-32 , 2/* "IF" */,-32 , 4/* "WHILE" */,-32 , 5/* "DO" */,-32 , 7/* "USE" */,-32 , 9/* "DELETE" */,-32 , 8/* "RETURN" */,-32 , 16/* "{" */,-32 , 38/* "Identifier" */,-32 , 40/* "Integer" */,-32 , 41/* "Float" */,-32 , 31/* "(" */,-32 , 39/* "String" */,-32 , 6/* "FUNCTION" */,-32 , 12/* "<<" */,-32 , 14/* "[" */,-32 , 10/* "TRUE" */,-32 , 11/* "FALSE" */,-32 , 32/* ")" */,-32 , 15/* "]" */,-32 , 33/* "," */,-32 , 13/* ">>" */,-32 ),
	/* State 73 */ new Array( 26/* "+" */,50 , 27/* "-" */,51 , 18/* ";" */,-31 , 20/* "==" */,-31 , 25/* "<" */,-31 , 24/* ">" */,-31 , 22/* "<=" */,-31 , 23/* ">=" */,-31 , 21/* "!=" */,-31 , 2/* "IF" */,-31 , 4/* "WHILE" */,-31 , 5/* "DO" */,-31 , 7/* "USE" */,-31 , 9/* "DELETE" */,-31 , 8/* "RETURN" */,-31 , 16/* "{" */,-31 , 38/* "Identifier" */,-31 , 40/* "Integer" */,-31 , 41/* "Float" */,-31 , 31/* "(" */,-31 , 39/* "String" */,-31 , 6/* "FUNCTION" */,-31 , 12/* "<<" */,-31 , 14/* "[" */,-31 , 10/* "TRUE" */,-31 , 11/* "FALSE" */,-31 , 32/* ")" */,-31 , 15/* "]" */,-31 , 33/* "," */,-31 , 13/* ">>" */,-31 ),
	/* State 74 */ new Array( 26/* "+" */,50 , 27/* "-" */,51 , 18/* ";" */,-30 , 20/* "==" */,-30 , 25/* "<" */,-30 , 24/* ">" */,-30 , 22/* "<=" */,-30 , 23/* ">=" */,-30 , 21/* "!=" */,-30 , 2/* "IF" */,-30 , 4/* "WHILE" */,-30 , 5/* "DO" */,-30 , 7/* "USE" */,-30 , 9/* "DELETE" */,-30 , 8/* "RETURN" */,-30 , 16/* "{" */,-30 , 38/* "Identifier" */,-30 , 40/* "Integer" */,-30 , 41/* "Float" */,-30 , 31/* "(" */,-30 , 39/* "String" */,-30 , 6/* "FUNCTION" */,-30 , 12/* "<<" */,-30 , 14/* "[" */,-30 , 10/* "TRUE" */,-30 , 11/* "FALSE" */,-30 , 32/* ")" */,-30 , 15/* "]" */,-30 , 33/* "," */,-30 , 13/* ">>" */,-30 ),
	/* State 75 */ new Array( 26/* "+" */,50 , 27/* "-" */,51 , 18/* ";" */,-29 , 20/* "==" */,-29 , 25/* "<" */,-29 , 24/* ">" */,-29 , 22/* "<=" */,-29 , 23/* ">=" */,-29 , 21/* "!=" */,-29 , 2/* "IF" */,-29 , 4/* "WHILE" */,-29 , 5/* "DO" */,-29 , 7/* "USE" */,-29 , 9/* "DELETE" */,-29 , 8/* "RETURN" */,-29 , 16/* "{" */,-29 , 38/* "Identifier" */,-29 , 40/* "Integer" */,-29 , 41/* "Float" */,-29 , 31/* "(" */,-29 , 39/* "String" */,-29 , 6/* "FUNCTION" */,-29 , 12/* "<<" */,-29 , 14/* "[" */,-29 , 10/* "TRUE" */,-29 , 11/* "FALSE" */,-29 , 32/* ")" */,-29 , 15/* "]" */,-29 , 33/* "," */,-29 , 13/* ">>" */,-29 ),
	/* State 76 */ new Array( 17/* "}" */,-3 , 2/* "IF" */,-3 , 4/* "WHILE" */,-3 , 5/* "DO" */,-3 , 7/* "USE" */,-3 , 9/* "DELETE" */,-3 , 8/* "RETURN" */,-3 , 16/* "{" */,-3 , 18/* ";" */,-3 , 38/* "Identifier" */,-3 , 40/* "Integer" */,-3 , 41/* "Float" */,-3 , 31/* "(" */,-3 , 39/* "String" */,-3 , 6/* "FUNCTION" */,-3 , 12/* "<<" */,-3 , 14/* "[" */,-3 , 10/* "TRUE" */,-3 , 11/* "FALSE" */,-3 , 27/* "-" */,-3 ),
	/* State 77 */ new Array( 57/* "$$" */,-24 , 2/* "IF" */,-24 , 4/* "WHILE" */,-24 , 5/* "DO" */,-24 , 7/* "USE" */,-24 , 9/* "DELETE" */,-24 , 8/* "RETURN" */,-24 , 16/* "{" */,-24 , 18/* ";" */,-24 , 38/* "Identifier" */,-24 , 40/* "Integer" */,-24 , 41/* "Float" */,-24 , 31/* "(" */,-24 , 39/* "String" */,-24 , 6/* "FUNCTION" */,-24 , 12/* "<<" */,-24 , 14/* "[" */,-24 , 10/* "TRUE" */,-24 , 11/* "FALSE" */,-24 , 27/* "-" */,-24 , 3/* "ELSE" */,-24 , 17/* "}" */,-24 ),
	/* State 78 */ new Array( 19/* "=" */,-26 , 37/* "." */,-49 , 14/* "[" */,-49 , 31/* "(" */,-49 , 18/* ";" */,-49 , 20/* "==" */,-49 , 25/* "<" */,-49 , 24/* ">" */,-49 , 22/* "<=" */,-49 , 23/* ">=" */,-49 , 21/* "!=" */,-49 , 27/* "-" */,-49 , 26/* "+" */,-49 , 29/* "*" */,-49 , 28/* "/" */,-49 , 30/* "^" */,-49 ),
	/* State 79 */ new Array( 33/* "," */,91 , 32/* ")" */,99 ),
	/* State 80 */ new Array( 26/* "+" */,50 , 27/* "-" */,51 , 15/* "]" */,100 ),
	/* State 81 */ new Array( 28/* "/" */,52 , 29/* "*" */,53 , 18/* ";" */,-37 , 20/* "==" */,-37 , 25/* "<" */,-37 , 24/* ">" */,-37 , 22/* "<=" */,-37 , 23/* ">=" */,-37 , 21/* "!=" */,-37 , 27/* "-" */,-37 , 26/* "+" */,-37 , 2/* "IF" */,-37 , 4/* "WHILE" */,-37 , 5/* "DO" */,-37 , 7/* "USE" */,-37 , 9/* "DELETE" */,-37 , 8/* "RETURN" */,-37 , 16/* "{" */,-37 , 38/* "Identifier" */,-37 , 40/* "Integer" */,-37 , 41/* "Float" */,-37 , 31/* "(" */,-37 , 39/* "String" */,-37 , 6/* "FUNCTION" */,-37 , 12/* "<<" */,-37 , 14/* "[" */,-37 , 10/* "TRUE" */,-37 , 11/* "FALSE" */,-37 , 32/* ")" */,-37 , 15/* "]" */,-37 , 33/* "," */,-37 , 13/* ">>" */,-37 ),
	/* State 82 */ new Array( 28/* "/" */,52 , 29/* "*" */,53 , 18/* ";" */,-36 , 20/* "==" */,-36 , 25/* "<" */,-36 , 24/* ">" */,-36 , 22/* "<=" */,-36 , 23/* ">=" */,-36 , 21/* "!=" */,-36 , 27/* "-" */,-36 , 26/* "+" */,-36 , 2/* "IF" */,-36 , 4/* "WHILE" */,-36 , 5/* "DO" */,-36 , 7/* "USE" */,-36 , 9/* "DELETE" */,-36 , 8/* "RETURN" */,-36 , 16/* "{" */,-36 , 38/* "Identifier" */,-36 , 40/* "Integer" */,-36 , 41/* "Float" */,-36 , 31/* "(" */,-36 , 39/* "String" */,-36 , 6/* "FUNCTION" */,-36 , 12/* "<<" */,-36 , 14/* "[" */,-36 , 10/* "TRUE" */,-36 , 11/* "FALSE" */,-36 , 32/* ")" */,-36 , 15/* "]" */,-36 , 33/* "," */,-36 , 13/* ">>" */,-36 ),
	/* State 83 */ new Array( 30/* "^" */,61 , 18/* ";" */,-40 , 20/* "==" */,-40 , 25/* "<" */,-40 , 24/* ">" */,-40 , 22/* "<=" */,-40 , 23/* ">=" */,-40 , 21/* "!=" */,-40 , 27/* "-" */,-40 , 26/* "+" */,-40 , 29/* "*" */,-40 , 28/* "/" */,-40 , 2/* "IF" */,-40 , 4/* "WHILE" */,-40 , 5/* "DO" */,-40 , 7/* "USE" */,-40 , 9/* "DELETE" */,-40 , 8/* "RETURN" */,-40 , 16/* "{" */,-40 , 38/* "Identifier" */,-40 , 40/* "Integer" */,-40 , 41/* "Float" */,-40 , 31/* "(" */,-40 , 39/* "String" */,-40 , 6/* "FUNCTION" */,-40 , 12/* "<<" */,-40 , 14/* "[" */,-40 , 10/* "TRUE" */,-40 , 11/* "FALSE" */,-40 , 32/* ")" */,-40 , 15/* "]" */,-40 , 33/* "," */,-40 , 13/* ">>" */,-40 ),
	/* State 84 */ new Array( 30/* "^" */,61 , 18/* ";" */,-39 , 20/* "==" */,-39 , 25/* "<" */,-39 , 24/* ">" */,-39 , 22/* "<=" */,-39 , 23/* ">=" */,-39 , 21/* "!=" */,-39 , 27/* "-" */,-39 , 26/* "+" */,-39 , 29/* "*" */,-39 , 28/* "/" */,-39 , 2/* "IF" */,-39 , 4/* "WHILE" */,-39 , 5/* "DO" */,-39 , 7/* "USE" */,-39 , 9/* "DELETE" */,-39 , 8/* "RETURN" */,-39 , 16/* "{" */,-39 , 38/* "Identifier" */,-39 , 40/* "Integer" */,-39 , 41/* "Float" */,-39 , 31/* "(" */,-39 , 39/* "String" */,-39 , 6/* "FUNCTION" */,-39 , 12/* "<<" */,-39 , 14/* "[" */,-39 , 10/* "TRUE" */,-39 , 11/* "FALSE" */,-39 , 32/* ")" */,-39 , 15/* "]" */,-39 , 33/* "," */,-39 , 13/* ">>" */,-39 ),
	/* State 85 */ new Array( 37/* "." */,-54 , 14/* "[" */,-54 , 31/* "(" */,-54 , 18/* ";" */,-54 , 20/* "==" */,-54 , 25/* "<" */,-54 , 24/* ">" */,-54 , 22/* "<=" */,-54 , 23/* ">=" */,-54 , 21/* "!=" */,-54 , 27/* "-" */,-54 , 26/* "+" */,-54 , 29/* "*" */,-54 , 28/* "/" */,-54 , 30/* "^" */,-54 , 2/* "IF" */,-54 , 4/* "WHILE" */,-54 , 5/* "DO" */,-54 , 7/* "USE" */,-54 , 9/* "DELETE" */,-54 , 8/* "RETURN" */,-54 , 16/* "{" */,-54 , 38/* "Identifier" */,-54 , 40/* "Integer" */,-54 , 41/* "Float" */,-54 , 39/* "String" */,-54 , 6/* "FUNCTION" */,-54 , 12/* "<<" */,-54 , 10/* "TRUE" */,-54 , 11/* "FALSE" */,-54 , 32/* ")" */,-54 , 15/* "]" */,-54 , 33/* "," */,-54 , 13/* ">>" */,-54 ),
	/* State 86 */ new Array( 33/* "," */,101 , 32/* ")" */,102 ),
	/* State 87 */ new Array( 32/* ")" */,-13 , 33/* "," */,-13 ),
	/* State 88 */ new Array( 38/* "Identifier" */,58 ),
	/* State 89 */ new Array( 37/* "." */,-57 , 14/* "[" */,-57 , 31/* "(" */,-57 , 18/* ";" */,-57 , 20/* "==" */,-57 , 25/* "<" */,-57 , 24/* ">" */,-57 , 22/* "<=" */,-57 , 23/* ">=" */,-57 , 21/* "!=" */,-57 , 27/* "-" */,-57 , 26/* "+" */,-57 , 29/* "*" */,-57 , 28/* "/" */,-57 , 30/* "^" */,-57 , 2/* "IF" */,-57 , 4/* "WHILE" */,-57 , 5/* "DO" */,-57 , 7/* "USE" */,-57 , 9/* "DELETE" */,-57 , 8/* "RETURN" */,-57 , 16/* "{" */,-57 , 38/* "Identifier" */,-57 , 40/* "Integer" */,-57 , 41/* "Float" */,-57 , 39/* "String" */,-57 , 6/* "FUNCTION" */,-57 , 12/* "<<" */,-57 , 10/* "TRUE" */,-57 , 11/* "FALSE" */,-57 , 32/* ")" */,-57 , 15/* "]" */,-57 , 33/* "," */,-57 , 13/* ">>" */,-57 ),
	/* State 90 */ new Array( 27/* "-" */,29 , 40/* "Integer" */,18 , 41/* "Float" */,19 , 38/* "Identifier" */,32 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 ),
	/* State 91 */ new Array( 27/* "-" */,29 , 40/* "Integer" */,18 , 41/* "Float" */,19 , 38/* "Identifier" */,32 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 ),
	/* State 92 */ new Array( 37/* "." */,-58 , 14/* "[" */,-58 , 31/* "(" */,-58 , 18/* ";" */,-58 , 20/* "==" */,-58 , 25/* "<" */,-58 , 24/* ">" */,-58 , 22/* "<=" */,-58 , 23/* ">=" */,-58 , 21/* "!=" */,-58 , 27/* "-" */,-58 , 26/* "+" */,-58 , 29/* "*" */,-58 , 28/* "/" */,-58 , 30/* "^" */,-58 , 2/* "IF" */,-58 , 4/* "WHILE" */,-58 , 5/* "DO" */,-58 , 7/* "USE" */,-58 , 9/* "DELETE" */,-58 , 8/* "RETURN" */,-58 , 16/* "{" */,-58 , 38/* "Identifier" */,-58 , 40/* "Integer" */,-58 , 41/* "Float" */,-58 , 39/* "String" */,-58 , 6/* "FUNCTION" */,-58 , 12/* "<<" */,-58 , 10/* "TRUE" */,-58 , 11/* "FALSE" */,-58 , 32/* ")" */,-58 , 15/* "]" */,-58 , 33/* "," */,-58 , 13/* ">>" */,-58 ),
	/* State 93 */ new Array( 18/* ";" */,-42 , 20/* "==" */,-42 , 25/* "<" */,-42 , 24/* ">" */,-42 , 22/* "<=" */,-42 , 23/* ">=" */,-42 , 21/* "!=" */,-42 , 27/* "-" */,-42 , 26/* "+" */,-42 , 29/* "*" */,-42 , 28/* "/" */,-42 , 30/* "^" */,-42 , 2/* "IF" */,-42 , 4/* "WHILE" */,-42 , 5/* "DO" */,-42 , 7/* "USE" */,-42 , 9/* "DELETE" */,-42 , 8/* "RETURN" */,-42 , 16/* "{" */,-42 , 38/* "Identifier" */,-42 , 40/* "Integer" */,-42 , 41/* "Float" */,-42 , 31/* "(" */,-42 , 39/* "String" */,-42 , 6/* "FUNCTION" */,-42 , 12/* "<<" */,-42 , 14/* "[" */,-42 , 10/* "TRUE" */,-42 , 11/* "FALSE" */,-42 , 32/* ")" */,-42 , 15/* "]" */,-42 , 33/* "," */,-42 , 13/* ">>" */,-42 ),
	/* State 94 */ new Array( 2/* "IF" */,3 , 4/* "WHILE" */,4 , 5/* "DO" */,5 , 7/* "USE" */,6 , 9/* "DELETE" */,7 , 8/* "RETURN" */,8 , 16/* "{" */,11 , 18/* ";" */,12 , 38/* "Identifier" */,14 , 40/* "Integer" */,18 , 41/* "Float" */,19 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 , 27/* "-" */,29 ),
	/* State 95 */ new Array( 2/* "IF" */,-49 , 4/* "WHILE" */,-49 , 5/* "DO" */,-49 , 7/* "USE" */,-49 , 9/* "DELETE" */,-49 , 8/* "RETURN" */,-49 , 16/* "{" */,-49 , 18/* ";" */,-49 , 38/* "Identifier" */,-49 , 40/* "Integer" */,-49 , 41/* "Float" */,-49 , 31/* "(" */,-49 , 39/* "String" */,-49 , 6/* "FUNCTION" */,-49 , 12/* "<<" */,-49 , 14/* "[" */,-49 , 10/* "TRUE" */,-49 , 11/* "FALSE" */,-49 , 27/* "-" */,-49 , 20/* "==" */,-49 , 25/* "<" */,-49 , 24/* ">" */,-49 , 22/* "<=" */,-49 , 23/* ">=" */,-49 , 21/* "!=" */,-49 , 26/* "+" */,-49 , 29/* "*" */,-49 , 28/* "/" */,-49 , 30/* "^" */,-49 , 37/* "." */,-49 , 32/* ")" */,-49 , 15/* "]" */,-49 , 33/* "," */,-49 , 13/* ">>" */,-49 ),
	/* State 96 */ new Array( 26/* "+" */,50 , 27/* "-" */,51 , 15/* "]" */,107 ),
	/* State 97 */ new Array( 21/* "!=" */,39 , 23/* ">=" */,40 , 22/* "<=" */,41 , 24/* ">" */,42 , 25/* "<" */,43 , 20/* "==" */,44 , 18/* ";" */,108 ),
	/* State 98 */ new Array( 57/* "$$" */,-22 , 2/* "IF" */,-22 , 4/* "WHILE" */,-22 , 5/* "DO" */,-22 , 7/* "USE" */,-22 , 9/* "DELETE" */,-22 , 8/* "RETURN" */,-22 , 16/* "{" */,-22 , 18/* ";" */,-22 , 38/* "Identifier" */,-22 , 40/* "Integer" */,-22 , 41/* "Float" */,-22 , 31/* "(" */,-22 , 39/* "String" */,-22 , 6/* "FUNCTION" */,-22 , 12/* "<<" */,-22 , 14/* "[" */,-22 , 10/* "TRUE" */,-22 , 11/* "FALSE" */,-22 , 27/* "-" */,-22 , 3/* "ELSE" */,-22 , 17/* "}" */,-22 ),
	/* State 99 */ new Array( 12/* "<<" */,109 , 37/* "." */,-47 , 14/* "[" */,-47 , 31/* "(" */,-47 , 18/* ";" */,-47 , 20/* "==" */,-47 , 25/* "<" */,-47 , 24/* ">" */,-47 , 22/* "<=" */,-47 , 23/* ">=" */,-47 , 21/* "!=" */,-47 , 27/* "-" */,-47 , 26/* "+" */,-47 , 29/* "*" */,-47 , 28/* "/" */,-47 , 30/* "^" */,-47 , 2/* "IF" */,-47 , 4/* "WHILE" */,-47 , 5/* "DO" */,-47 , 7/* "USE" */,-47 , 9/* "DELETE" */,-47 , 8/* "RETURN" */,-47 , 16/* "{" */,-47 , 38/* "Identifier" */,-47 , 40/* "Integer" */,-47 , 41/* "Float" */,-47 , 39/* "String" */,-47 , 6/* "FUNCTION" */,-47 , 10/* "TRUE" */,-47 , 11/* "FALSE" */,-47 , 32/* ")" */,-47 , 15/* "]" */,-47 , 33/* "," */,-47 , 13/* ">>" */,-47 ),
	/* State 100 */ new Array( 37/* "." */,-46 , 14/* "[" */,-46 , 31/* "(" */,-46 , 18/* ";" */,-46 , 20/* "==" */,-46 , 25/* "<" */,-46 , 24/* ">" */,-46 , 22/* "<=" */,-46 , 23/* ">=" */,-46 , 21/* "!=" */,-46 , 27/* "-" */,-46 , 26/* "+" */,-46 , 29/* "*" */,-46 , 28/* "/" */,-46 , 30/* "^" */,-46 , 19/* "=" */,-27 ),
	/* State 101 */ new Array( 38/* "Identifier" */,110 ),
	/* State 102 */ new Array( 16/* "{" */,111 ),
	/* State 103 */ new Array( 13/* ">>" */,-8 , 33/* "," */,-8 ),
	/* State 104 */ new Array( 21/* "!=" */,39 , 23/* ">=" */,40 , 22/* "<=" */,41 , 24/* ">" */,42 , 25/* "<" */,43 , 20/* "==" */,44 , 13/* ">>" */,-11 , 33/* "," */,-11 ),
	/* State 105 */ new Array( 21/* "!=" */,39 , 23/* ">=" */,40 , 22/* "<=" */,41 , 24/* ">" */,42 , 25/* "<" */,43 , 20/* "==" */,44 , 15/* "]" */,-5 , 33/* "," */,-5 , 32/* ")" */,-5 ),
	/* State 106 */ new Array( 57/* "$$" */,-16 , 2/* "IF" */,-16 , 4/* "WHILE" */,-16 , 5/* "DO" */,-16 , 7/* "USE" */,-16 , 9/* "DELETE" */,-16 , 8/* "RETURN" */,-16 , 16/* "{" */,-16 , 18/* ";" */,-16 , 38/* "Identifier" */,-16 , 40/* "Integer" */,-16 , 41/* "Float" */,-16 , 31/* "(" */,-16 , 39/* "String" */,-16 , 6/* "FUNCTION" */,-16 , 12/* "<<" */,-16 , 14/* "[" */,-16 , 10/* "TRUE" */,-16 , 11/* "FALSE" */,-16 , 27/* "-" */,-16 , 3/* "ELSE" */,-16 , 17/* "}" */,-16 ),
	/* State 107 */ new Array( 2/* "IF" */,-46 , 4/* "WHILE" */,-46 , 5/* "DO" */,-46 , 7/* "USE" */,-46 , 9/* "DELETE" */,-46 , 8/* "RETURN" */,-46 , 16/* "{" */,-46 , 18/* ";" */,-46 , 38/* "Identifier" */,-46 , 40/* "Integer" */,-46 , 41/* "Float" */,-46 , 31/* "(" */,-46 , 39/* "String" */,-46 , 6/* "FUNCTION" */,-46 , 12/* "<<" */,-46 , 14/* "[" */,-46 , 10/* "TRUE" */,-46 , 11/* "FALSE" */,-46 , 27/* "-" */,-46 , 20/* "==" */,-46 , 25/* "<" */,-46 , 24/* ">" */,-46 , 22/* "<=" */,-46 , 23/* ">=" */,-46 , 21/* "!=" */,-46 , 26/* "+" */,-46 , 29/* "*" */,-46 , 28/* "/" */,-46 , 30/* "^" */,-46 , 37/* "." */,-46 , 32/* ")" */,-46 , 15/* "]" */,-46 , 33/* "," */,-46 , 13/* ">>" */,-46 ),
	/* State 108 */ new Array( 57/* "$$" */,-18 , 2/* "IF" */,-18 , 4/* "WHILE" */,-18 , 5/* "DO" */,-18 , 7/* "USE" */,-18 , 9/* "DELETE" */,-18 , 8/* "RETURN" */,-18 , 16/* "{" */,-18 , 18/* ";" */,-18 , 38/* "Identifier" */,-18 , 40/* "Integer" */,-18 , 41/* "Float" */,-18 , 31/* "(" */,-18 , 39/* "String" */,-18 , 6/* "FUNCTION" */,-18 , 12/* "<<" */,-18 , 14/* "[" */,-18 , 10/* "TRUE" */,-18 , 11/* "FALSE" */,-18 , 27/* "-" */,-18 , 3/* "ELSE" */,-18 , 17/* "}" */,-18 ),
	/* State 109 */ new Array( 38/* "Identifier" */,58 , 13/* ">>" */,-10 , 33/* "," */,-10 ),
	/* State 110 */ new Array( 32/* ")" */,-12 , 33/* "," */,-12 ),
	/* State 111 */ new Array( 17/* "}" */,-4 , 2/* "IF" */,-4 , 4/* "WHILE" */,-4 , 5/* "DO" */,-4 , 7/* "USE" */,-4 , 9/* "DELETE" */,-4 , 8/* "RETURN" */,-4 , 16/* "{" */,-4 , 18/* ";" */,-4 , 38/* "Identifier" */,-4 , 40/* "Integer" */,-4 , 41/* "Float" */,-4 , 31/* "(" */,-4 , 39/* "String" */,-4 , 6/* "FUNCTION" */,-4 , 12/* "<<" */,-4 , 14/* "[" */,-4 , 10/* "TRUE" */,-4 , 11/* "FALSE" */,-4 , 27/* "-" */,-4 ),
	/* State 112 */ new Array( 33/* "," */,88 , 13/* ">>" */,114 ),
	/* State 113 */ new Array( 17/* "}" */,115 , 2/* "IF" */,3 , 4/* "WHILE" */,4 , 5/* "DO" */,5 , 7/* "USE" */,6 , 9/* "DELETE" */,7 , 8/* "RETURN" */,8 , 16/* "{" */,11 , 18/* ";" */,12 , 38/* "Identifier" */,14 , 40/* "Integer" */,18 , 41/* "Float" */,19 , 31/* "(" */,20 , 39/* "String" */,21 , 6/* "FUNCTION" */,22 , 12/* "<<" */,23 , 14/* "[" */,24 , 10/* "TRUE" */,25 , 11/* "FALSE" */,26 , 27/* "-" */,29 ),
	/* State 114 */ new Array( 37/* "." */,-48 , 14/* "[" */,-48 , 31/* "(" */,-48 , 18/* ";" */,-48 , 20/* "==" */,-48 , 25/* "<" */,-48 , 24/* ">" */,-48 , 22/* "<=" */,-48 , 23/* ">=" */,-48 , 21/* "!=" */,-48 , 27/* "-" */,-48 , 26/* "+" */,-48 , 29/* "*" */,-48 , 28/* "/" */,-48 , 30/* "^" */,-48 , 2/* "IF" */,-48 , 4/* "WHILE" */,-48 , 5/* "DO" */,-48 , 7/* "USE" */,-48 , 9/* "DELETE" */,-48 , 8/* "RETURN" */,-48 , 16/* "{" */,-48 , 38/* "Identifier" */,-48 , 40/* "Integer" */,-48 , 41/* "Float" */,-48 , 39/* "String" */,-48 , 6/* "FUNCTION" */,-48 , 12/* "<<" */,-48 , 10/* "TRUE" */,-48 , 11/* "FALSE" */,-48 , 32/* ")" */,-48 , 15/* "]" */,-48 , 33/* "," */,-48 , 13/* ">>" */,-48 ),
	/* State 115 */ new Array( 37/* "." */,-56 , 14/* "[" */,-56 , 31/* "(" */,-56 , 18/* ";" */,-56 , 20/* "==" */,-56 , 25/* "<" */,-56 , 24/* ">" */,-56 , 22/* "<=" */,-56 , 23/* ">=" */,-56 , 21/* "!=" */,-56 , 27/* "-" */,-56 , 26/* "+" */,-56 , 29/* "*" */,-56 , 28/* "/" */,-56 , 30/* "^" */,-56 , 2/* "IF" */,-56 , 4/* "WHILE" */,-56 , 5/* "DO" */,-56 , 7/* "USE" */,-56 , 9/* "DELETE" */,-56 , 8/* "RETURN" */,-56 , 16/* "{" */,-56 , 38/* "Identifier" */,-56 , 40/* "Integer" */,-56 , 41/* "Float" */,-56 , 39/* "String" */,-56 , 6/* "FUNCTION" */,-56 , 12/* "<<" */,-56 , 10/* "TRUE" */,-56 , 11/* "FALSE" */,-56 , 32/* ")" */,-56 , 15/* "]" */,-56 , 33/* "," */,-56 , 13/* ">>" */,-56 )
);

/* Goto-Table */
var goto_tab = new Array(
	/* State 0 */ new Array( 42/* Program */,1 ),
	/* State 1 */ new Array( 43/* Stmt */,2 , 50/* Lhs */,9 , 46/* Expression */,10 , 51/* ExtValue */,13 , 52/* AddSubExp */,15 , 56/* Value */,16 , 53/* MulDivExp */,17 , 54/* ExpExp */,27 , 55/* NegExp */,28 ),
	/* State 2 */ new Array(  ),
	/* State 3 */ new Array( 46/* Expression */,30 , 52/* AddSubExp */,15 , 53/* MulDivExp */,17 , 54/* ExpExp */,27 , 55/* NegExp */,28 , 51/* ExtValue */,31 , 56/* Value */,16 ),
	/* State 4 */ new Array( 46/* Expression */,33 , 52/* AddSubExp */,15 , 53/* MulDivExp */,17 , 54/* ExpExp */,27 , 55/* NegExp */,28 , 51/* ExtValue */,31 , 56/* Value */,16 ),
	/* State 5 */ new Array( 43/* Stmt */,34 , 50/* Lhs */,9 , 46/* Expression */,10 , 51/* ExtValue */,13 , 52/* AddSubExp */,15 , 56/* Value */,16 , 53/* MulDivExp */,17 , 54/* ExpExp */,27 , 55/* NegExp */,28 ),
	/* State 6 */ new Array(  ),
	/* State 7 */ new Array(  ),
	/* State 8 */ new Array( 43/* Stmt */,37 , 50/* Lhs */,9 , 46/* Expression */,10 , 51/* ExtValue */,13 , 52/* AddSubExp */,15 , 56/* Value */,16 , 53/* MulDivExp */,17 , 54/* ExpExp */,27 , 55/* NegExp */,28 ),
	/* State 9 */ new Array(  ),
	/* State 10 */ new Array(  ),
	/* State 11 */ new Array( 44/* Stmt_List */,46 ),
	/* State 12 */ new Array(  ),
	/* State 13 */ new Array(  ),
	/* State 14 */ new Array(  ),
	/* State 15 */ new Array(  ),
	/* State 16 */ new Array(  ),
	/* State 17 */ new Array(  ),
	/* State 18 */ new Array(  ),
	/* State 19 */ new Array(  ),
	/* State 20 */ new Array( 46/* Expression */,54 , 52/* AddSubExp */,15 , 53/* MulDivExp */,17 , 54/* ExpExp */,27 , 55/* NegExp */,28 , 51/* ExtValue */,31 , 56/* Value */,16 ),
	/* State 21 */ new Array(  ),
	/* State 22 */ new Array(  ),
	/* State 23 */ new Array( 47/* Prop_List */,56 , 48/* Prop */,57 ),
	/* State 24 */ new Array( 45/* Param_List */,59 , 46/* Expression */,60 , 52/* AddSubExp */,15 , 53/* MulDivExp */,17 , 54/* ExpExp */,27 , 55/* NegExp */,28 , 51/* ExtValue */,31 , 56/* Value */,16 ),
	/* State 25 */ new Array(  ),
	/* State 26 */ new Array(  ),
	/* State 27 */ new Array(  ),
	/* State 28 */ new Array(  ),
	/* State 29 */ new Array( 51/* ExtValue */,62 , 56/* Value */,16 ),
	/* State 30 */ new Array( 43/* Stmt */,63 , 50/* Lhs */,9 , 46/* Expression */,10 , 51/* ExtValue */,13 , 52/* AddSubExp */,15 , 56/* Value */,16 , 53/* MulDivExp */,17 , 54/* ExpExp */,27 , 55/* NegExp */,28 ),
	/* State 31 */ new Array(  ),
	/* State 32 */ new Array(  ),
	/* State 33 */ new Array( 43/* Stmt */,66 , 50/* Lhs */,9 , 46/* Expression */,10 , 51/* ExtValue */,13 , 52/* AddSubExp */,15 , 56/* Value */,16 , 53/* MulDivExp */,17 , 54/* ExpExp */,27 , 55/* NegExp */,28 ),
	/* State 34 */ new Array(  ),
	/* State 35 */ new Array(  ),
	/* State 36 */ new Array(  ),
	/* State 37 */ new Array(  ),
	/* State 38 */ new Array( 46/* Expression */,69 , 52/* AddSubExp */,15 , 53/* MulDivExp */,17 , 54/* ExpExp */,27 , 55/* NegExp */,28 , 51/* ExtValue */,31 , 56/* Value */,16 ),
	/* State 39 */ new Array( 52/* AddSubExp */,70 , 53/* MulDivExp */,17 , 54/* ExpExp */,27 , 55/* NegExp */,28 , 51/* ExtValue */,31 , 56/* Value */,16 ),
	/* State 40 */ new Array( 52/* AddSubExp */,71 , 53/* MulDivExp */,17 , 54/* ExpExp */,27 , 55/* NegExp */,28 , 51/* ExtValue */,31 , 56/* Value */,16 ),
	/* State 41 */ new Array( 52/* AddSubExp */,72 , 53/* MulDivExp */,17 , 54/* ExpExp */,27 , 55/* NegExp */,28 , 51/* ExtValue */,31 , 56/* Value */,16 ),
	/* State 42 */ new Array( 52/* AddSubExp */,73 , 53/* MulDivExp */,17 , 54/* ExpExp */,27 , 55/* NegExp */,28 , 51/* ExtValue */,31 , 56/* Value */,16 ),
	/* State 43 */ new Array( 52/* AddSubExp */,74 , 53/* MulDivExp */,17 , 54/* ExpExp */,27 , 55/* NegExp */,28 , 51/* ExtValue */,31 , 56/* Value */,16 ),
	/* State 44 */ new Array( 52/* AddSubExp */,75 , 53/* MulDivExp */,17 , 54/* ExpExp */,27 , 55/* NegExp */,28 , 51/* ExtValue */,31 , 56/* Value */,16 ),
	/* State 45 */ new Array(  ),
	/* State 46 */ new Array( 43/* Stmt */,76 , 50/* Lhs */,9 , 46/* Expression */,10 , 51/* ExtValue */,13 , 52/* AddSubExp */,15 , 56/* Value */,16 , 53/* MulDivExp */,17 , 54/* ExpExp */,27 , 55/* NegExp */,28 ),
	/* State 47 */ new Array(  ),
	/* State 48 */ new Array( 45/* Param_List */,79 , 46/* Expression */,60 , 52/* AddSubExp */,15 , 53/* MulDivExp */,17 , 54/* ExpExp */,27 , 55/* NegExp */,28 , 51/* ExtValue */,31 , 56/* Value */,16 ),
	/* State 49 */ new Array( 52/* AddSubExp */,80 , 53/* MulDivExp */,17 , 54/* ExpExp */,27 , 55/* NegExp */,28 , 51/* ExtValue */,31 , 56/* Value */,16 ),
	/* State 50 */ new Array( 53/* MulDivExp */,81 , 54/* ExpExp */,27 , 55/* NegExp */,28 , 51/* ExtValue */,31 , 56/* Value */,16 ),
	/* State 51 */ new Array( 53/* MulDivExp */,82 , 54/* ExpExp */,27 , 55/* NegExp */,28 , 51/* ExtValue */,31 , 56/* Value */,16 ),
	/* State 52 */ new Array( 54/* ExpExp */,83 , 55/* NegExp */,28 , 51/* ExtValue */,31 , 56/* Value */,16 ),
	/* State 53 */ new Array( 54/* ExpExp */,84 , 55/* NegExp */,28 , 51/* ExtValue */,31 , 56/* Value */,16 ),
	/* State 54 */ new Array(  ),
	/* State 55 */ new Array( 49/* Param_Def_List */,86 ),
	/* State 56 */ new Array(  ),
	/* State 57 */ new Array(  ),
	/* State 58 */ new Array(  ),
	/* State 59 */ new Array(  ),
	/* State 60 */ new Array(  ),
	/* State 61 */ new Array( 55/* NegExp */,93 , 51/* ExtValue */,31 , 56/* Value */,16 ),
	/* State 62 */ new Array(  ),
	/* State 63 */ new Array(  ),
	/* State 64 */ new Array(  ),
	/* State 65 */ new Array( 52/* AddSubExp */,96 , 53/* MulDivExp */,17 , 54/* ExpExp */,27 , 55/* NegExp */,28 , 51/* ExtValue */,31 , 56/* Value */,16 ),
	/* State 66 */ new Array(  ),
	/* State 67 */ new Array( 46/* Expression */,97 , 52/* AddSubExp */,15 , 53/* MulDivExp */,17 , 54/* ExpExp */,27 , 55/* NegExp */,28 , 51/* ExtValue */,31 , 56/* Value */,16 ),
	/* State 68 */ new Array(  ),
	/* State 69 */ new Array(  ),
	/* State 70 */ new Array(  ),
	/* State 71 */ new Array(  ),
	/* State 72 */ new Array(  ),
	/* State 73 */ new Array(  ),
	/* State 74 */ new Array(  ),
	/* State 75 */ new Array(  ),
	/* State 76 */ new Array(  ),
	/* State 77 */ new Array(  ),
	/* State 78 */ new Array(  ),
	/* State 79 */ new Array(  ),
	/* State 80 */ new Array(  ),
	/* State 81 */ new Array(  ),
	/* State 82 */ new Array(  ),
	/* State 83 */ new Array(  ),
	/* State 84 */ new Array(  ),
	/* State 85 */ new Array(  ),
	/* State 86 */ new Array(  ),
	/* State 87 */ new Array(  ),
	/* State 88 */ new Array( 48/* Prop */,103 ),
	/* State 89 */ new Array(  ),
	/* State 90 */ new Array( 46/* Expression */,104 , 52/* AddSubExp */,15 , 53/* MulDivExp */,17 , 54/* ExpExp */,27 , 55/* NegExp */,28 , 51/* ExtValue */,31 , 56/* Value */,16 ),
	/* State 91 */ new Array( 46/* Expression */,105 , 52/* AddSubExp */,15 , 53/* MulDivExp */,17 , 54/* ExpExp */,27 , 55/* NegExp */,28 , 51/* ExtValue */,31 , 56/* Value */,16 ),
	/* State 92 */ new Array(  ),
	/* State 93 */ new Array(  ),
	/* State 94 */ new Array( 43/* Stmt */,106 , 50/* Lhs */,9 , 46/* Expression */,10 , 51/* ExtValue */,13 , 52/* AddSubExp */,15 , 56/* Value */,16 , 53/* MulDivExp */,17 , 54/* ExpExp */,27 , 55/* NegExp */,28 ),
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
	/* State 105 */ new Array(  ),
	/* State 106 */ new Array(  ),
	/* State 107 */ new Array(  ),
	/* State 108 */ new Array(  ),
	/* State 109 */ new Array( 47/* Prop_List */,112 , 48/* Prop */,57 ),
	/* State 110 */ new Array(  ),
	/* State 111 */ new Array( 44/* Stmt_List */,113 ),
	/* State 112 */ new Array(  ),
	/* State 113 */ new Array( 43/* Stmt */,76 , 50/* Lhs */,9 , 46/* Expression */,10 , 51/* ExtValue */,13 , 52/* AddSubExp */,15 , 56/* Value */,16 , 53/* MulDivExp */,17 , 54/* ExpExp */,27 , 55/* NegExp */,28 ),
	/* State 114 */ new Array(  ),
	/* State 115 */ new Array(  )
);



/* Symbol labels */
var labels = new Array(
	"Program'" /* Non-terminal symbol */,
	"WHITESPACE" /* Terminal symbol */,
	"IF" /* Terminal symbol */,
	"ELSE" /* Terminal symbol */,
	"WHILE" /* Terminal symbol */,
	"DO" /* Terminal symbol */,
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
	"<=" /* Terminal symbol */,
	">=" /* Terminal symbol */,
	">" /* Terminal symbol */,
	"<" /* Terminal symbol */,
	"+" /* Terminal symbol */,
	"-" /* Terminal symbol */,
	"/" /* Terminal symbol */,
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
	"ExtValue" /* Non-terminal symbol */,
	"AddSubExp" /* Non-terminal symbol */,
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
            act = 117;
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
            if (act == 117) {
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

                while (act == 117 && la != 57) {
                    if (this._dbg_withtrace) {
                        this._dbg_print("\tError recovery\n" +
                                        "Current lookahead: " + labels[la] + " (" + info.att + ")\n" +
                                        "Action: " + act + "\n\n");
                    }
                    if (la == -1) {
                        info.offset++;
                    }

                    while (act == 117 && sstack.length > 0) {
                        sstack.pop();
                        vstack.pop();

                        if (sstack.length == 0) {
                            break;
                        }

                        act = 117;
                        for (i = 0; i < act_tab[sstack[sstack.length-1]].length; i+=2) {
                            if (act_tab[sstack[sstack.length-1]][i] == la) {
                                act = act_tab[sstack[sstack.length-1]][i+1];
                                break;
                            }
                        }
                    }

                    if (act != 117) {
                        break;
                    }

                    for (i = 0; i < rsstack.length; i++) {
                        sstack.push(rsstack[i]);
                        vstack.push(rvstack[i]);
                    }

                    la = this._lex(info);
                }

                if (act == 117) {
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
		 rval = this.createNode('node_op', 'op_paramlst', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
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
		 rval = this.createNode('node_op', 'op_paramdeflst', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
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
		 rval = this.createNode('node_op', 'op_if', vstack[ vstack.length - 2 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 16:
	{
		 rval = this.createNode('node_op', 'op_if_else', vstack[ vstack.length - 4 ], vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 17:
	{
		 rval = this.createNode('node_op', 'op_while', vstack[ vstack.length - 2 ], vstack[ vstack.length - 0 ] ); 
	}
	break;
	case 18:
	{
		 rval = this.createNode('node_op', 'op_do', vstack[ vstack.length - 4 ], vstack[ vstack.length - 2 ] ); 
	}
	break;
	case 19:
	{
		 rval = this.createNode('node_op', 'op_use', vstack[ vstack.length - 2 ] ); 
	}
	break;
	case 20:
	{
		 rval = this.createNode('node_op', 'op_delete', vstack[ vstack.length - 1 ]); 
	}
	break;
	case 21:
	{
		 rval = this.createNode('node_op', 'op_return', vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 22:
	{
		 rval = this.createNode('node_op', 'op_assign', vstack[ vstack.length - 4 ], vstack[ vstack.length - 2 ] ); 
	}
	break;
	case 23:
	{
		 rval = this.createNode('node_op', 'op_noassign', vstack[ vstack.length - 2 ] ); 
	}
	break;
	case 24:
	{
		 rval = vstack[ vstack.length - 2 ]; 
	}
	break;
	case 25:
	{
		 rval = this.createNode('node_op', 'op_none' ); 
	}
	break;
	case 26:
	{
		 rval = this.createNode('node_op', 'op_lhs', vstack[ vstack.length - 1 ], vstack[ vstack.length - 3 ]); 
	}
	break;
	case 27:
	{
		 rval = this.createNode('node_op', 'op_lhs', vstack[ vstack.length - 2 ], vstack[ vstack.length - 4 ]); 
	}
	break;
	case 28:
	{
		 rval = this.createNode('node_op', 'op_lhs', vstack[ vstack.length - 1 ]); 
	}
	break;
	case 29:
	{
		 rval = this.createNode('node_op', 'op_equ', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 30:
	{
		 rval = this.createNode('node_op', 'op_lot', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 31:
	{
		 rval = this.createNode('node_op', 'op_grt', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 32:
	{
		 rval = this.createNode('node_op', 'op_loe', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 33:
	{
		 rval = this.createNode('node_op', 'op_gre', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 34:
	{
		 rval = this.createNode('node_op', 'op_neq', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 35:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 36:
	{
		 rval = this.createNode('node_op', 'op_sub', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 37:
	{
		 rval = this.createNode('node_op', 'op_add', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 38:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 39:
	{
		 rval = this.createNode('node_op', 'op_mul', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 40:
	{
		 rval = this.createNode('node_op', 'op_div', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 41:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 42:
	{
		 rval = this.createNode('node_op', 'op_exp', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 43:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 44:
	{
		 rval = this.createNode('node_op', 'op_neg', vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 45:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 46:
	{
		 rval = this.createNode('node_op', 'op_extvalue', vstack[ vstack.length - 4 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 47:
	{
		 rval = this.createNode('node_op', 'op_execfun', vstack[ vstack.length - 4 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 48:
	{
		 rval = this.createNode('node_op', 'op_execfun', vstack[ vstack.length - 7 ], vstack[ vstack.length - 5 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 49:
	{
		 rval = this.createNode('node_op', 'op_property', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 50:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 51:
	{
		 rval = this.createNode('node_const', vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 52:
	{
		 rval = this.createNode('node_const', vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 53:
	{
		 rval = this.createNode('node_var', vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 54:
	{
		 rval = vstack[ vstack.length - 2 ]; 
	}
	break;
	case 55:
	{
		 rval = this.createNode('node_str', vstack[ vstack.length - 1 ]); 
	}
	break;
	case 56:
	{
		 rval = this.createNode('node_op', 'op_function', vstack[ vstack.length - 5 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 57:
	{
		 rval = this.createNode('node_op', 'op_proplst_val', vstack[ vstack.length - 2 ]); 
	}
	break;
	case 58:
	{
		 rval = this.createNode('node_op', 'op_array', vstack[ vstack.length - 2 ]); 
	}
	break;
	case 59:
	{
		 rval = this.createNode('node_const_bool', vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 60:
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


