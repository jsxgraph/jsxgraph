/*
    JessieCode Parser and Compiler

    Copyright 2011-2012
        Michael Gerhäuser
        Alfred Wassermann

    Licensed under the LGPL v3
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
     * Maximum number of seconds the parser is allowed to run. After that the interpreter is stopped.
     * @type Number
     * @default 10000
     */
    this.maxRuntime = 10000;

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

        r.clearCache = function () {
            _ccache = {};
        };

        return r;
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
     */
    parse: function (code, geonext) {
        var error_cnt = 0,
            error_off = [],
            error_la = [],
            that = this,
            to,
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

        /*to = window.setTimeout(function () {
            console.log('CANCEL!');
            that.cancel = true;
        }, this.maxRuntime);
        this.cancel = false;*/

        if((error_cnt = this._parse(code, error_off, error_la)) > 0) {
            for(i = 0; i < error_cnt; i++)
                this._error("Parse error in line " + error_off[i].line + " near >"  + code.substr( error_off[i].offset, 30 ) + "<, expecting \"" + error_la[i].join() + "\"");
        }

        /*window.clearTimeout(to);*/

        //this.board.update();
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

    resolveProperty: function (e, v, compile) {
        compile = JXG.def(compile, false);

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

        if (compile && typeof e[v] === 'function') {
            return function () { return e[v].apply(e, arguments); };
        }

        return e[v];
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

        if (this.cancel) {
            this._error('Max runtime exceeded');
        }

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
                        i = new Date().getTime();
                        for (this.execute(node.children[0]); this.execute(node.children[1]); this.execute(node.children[2])) {
                            if (new Date().getTime() - i > this.maxRuntime || this.cancel) {
                                this._error('for: max runtime exceeded');
                                break;
                            }
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

                        if (this.board.options.jc.compile) {
                            this.sstack.push({});
                            this.scope++;

                            this.isLHS = false;

                            for (i = 0; i < this.pstack[this.pscope].length; i++) {
                                this.sstack[this.scope][this.pstack[this.pscope][i]] = this.pstack[this.pscope][i];
                            }

                            this.replaceNames(node.children[1]);

                            ret = (function ($jc$) {
                                var p = $jc$.pstack[$jc$.pscope].join(', '),
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

                                return eval(str);
                            })(this);

                            // clean up scope
                            this.sstack.pop();
                            this.scope--;
                        } else {
                            ret = (function (_pstack, that) {
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
                            })(this.pstack[this.pscope], this);
                        }

                        ret.toJS = ret.toString;
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
                        var fun, attr, sc;

                        this.pstack.push([]);
                        this.pscope++;

                        // parse the parameter list
                        // after this, the parameters are in pstack
                        this.execute(node.children[1]);

                        // parse the properties only if given
                        if (typeof node.children[2] !== 'undefined') {
                            attr = this.execute(node.children[2]);
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

                        // check for the function in the variable table
                        if (typeof fun === 'function' && !fun.creator) {
                            ret = fun.apply(sc, parents);
                        } else if (typeof fun === 'function' && !!fun.creator) {
                            // creator methods are the only ones that take properties, hence this special case
                            ret = fun(parents, attr);
                        } else {
                            this._error('Error: Function \'' + fun + '\' is undefined.');
                        }

                        // clear parameter stack
                        this.pstack.pop();
                        this.pscope--;
                        break;
                    case 'op_property':
                        e = this.execute(node.children[0]);
                        v = node.children[1];

                        ret = this.resolveProperty(e, v, false);

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
                        ret = JXG.Math.Statistics.add(this.execute(node.children[0]), this.execute(node.children[1]));
                        break;
                    case 'op_sub':
                        ret = JXG.Math.Statistics.subtract(this.execute(node.children[0]), this.execute(node.children[1]));
                        break;
                    case 'op_div':
                        ret = JXG.Math.Statistics.div(this.execute(node.children[0]), this.execute(node.children[1]));
                        break;
                    case 'op_mod':
                        // use mathematical modulo, JavaScript implements the symmetric modulo.
                        ret = JXG.Math.Statistics.mod(this.execute(node.children[0]), this.execute(node.children[1]), true);
                        break;
                    case 'op_mul':
                        ret = this.mul(this.execute(node.children[0]), this.execute(node.children[1]));
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
                            if (JXG.isArray(e)) {
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
     * @returns {%}
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
        if (!JXG.exists(p1) || !JXG.exists(p1.Dist)) {
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
        if (JXG.isArray(a) * JXG.isArray(b)) {
            return JXG.Math.innerProduct(a, b, Math.min(a.length, b.length));
        } else {
            return JXG.Math.Statistics.multiply(a, b);
        }
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
                rad: JXG.Math.Geometry.rad,
                deg: JXG.Math.Geometry.trueAngle,
                factorial: JXG.Math.factorial,
                trunc: JXG.trunc,
                '$': that.getElementById
            };

        // special scopes for factorial, deg, and rad
        builtIn.rad.sc = JXG.Math.Geometry;
        builtIn.deg.sc = JXG.Math.Geometry;
        builtIn.factorial.sc = JXG.Math;

        // set the javascript equivalent for the builtIns
        // some of the anonymous functions should be replaced by global methods later on
        builtIn.PI.src = 'Math.PI';
        builtIn.EULER.src = 'Math.E';
        builtIn.X.src = '$jc$.X';
        builtIn.Y.src = '$jc$.Y';
        builtIn.V.src = '$jc$.V';
        builtIn.L.src = '$jc$.L';
        builtIn.dist.src = '$jc$.dist';
        builtIn.rad.src = 'JXG.Math.Geometry.rad';
        builtIn.deg.src = 'JXG.Math.Geometry.trueAngle';
        builtIn.factorial.src = 'JXG.Math.factorial';
        builtIn.trunc.src = 'JXG.trunc';
        // usually unused, see node_op > op_execfun
        builtIn['$'].src = '(function (n) { return JXG.getRef($jc$.board, n); })';

        return builtIn;
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
     * Output a warning message using {@link JXG#debug} and precedes the message with "Warning: ".
     * @param {String} msg
     */
    _warn: function (msg) {
        if(typeof console !== "undefined") {
            console.log('Warning: ' + msg);
        } else if(document.getElementById(this.warnLog) !== null) {
            document.getElementById(this.warnLog).innerHTML += 'Warning: ' + msg + '<br />';
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
     * JS/CC interna
     * @type Boolean
     * @private
     */
    _dbg_withtrace: false,

    _dbg_withparsetree: false,

    _dbg_withstepbystep: false,

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

    _dbg_flush: function () {
        alert(this._dbg_string);
    },

    _dbg_wait: function () {
        // Not implemented for Web.
    },

    _dbg_parsetree: function (indent, nodes, tree) {
        //Not implemented for Web.
    },

    /**
     * Internal lexer method.
     * @private
     */
    _lex: function (PCB) {
        var state,
            match = -1,
            match_pos = 0,
            start = 0,
            pos,
            chr;

        while (1) {
            state = 0;
            match = -1;
            match_pos = 0;
            start = 0;
            pos = PCB.offset + 1 + ( match_pos - start );

            do {

                pos--;
                state = 0;
                match = -2;
                start = pos;

                if( PCB.src.length <= start )
                    return 66;

                do {
                    chr = PCB.src.charCodeAt( pos );

switch( state )
{
	case 0:
		if( ( chr >= 9 && chr <= 10 ) || chr == 13 || chr == 32 ) state = 1;
		else if( chr == 33 ) state = 2;
		else if( chr == 35 ) state = 3;
		else if( chr == 36 || ( chr >= 65 && chr <= 67 ) || ( chr >= 71 && chr <= 72 ) || ( chr >= 74 && chr <= 81 ) || chr == 83 || chr == 86 || ( chr >= 88 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 99 ) || ( chr >= 103 && chr <= 104 ) || ( chr >= 106 && chr <= 113 ) || chr == 115 || chr == 118 || ( chr >= 120 && chr <= 122 ) ) state = 4;
		else if( chr == 37 ) state = 5;
		else if( chr == 40 ) state = 6;
		else if( chr == 41 ) state = 7;
		else if( chr == 42 ) state = 8;
		else if( chr == 43 ) state = 9;
		else if( chr == 44 ) state = 10;
		else if( chr == 45 ) state = 11;
		else if( chr == 46 ) state = 12;
		else if( chr == 47 ) state = 13;
		else if( ( chr >= 48 && chr <= 57 ) ) state = 14;
		else if( chr == 58 ) state = 15;
		else if( chr == 59 ) state = 16;
		else if( chr == 60 ) state = 17;
		else if( chr == 61 ) state = 18;
		else if( chr == 62 ) state = 19;
		else if( chr == 91 ) state = 20;
		else if( chr == 93 ) state = 21;
		else if( chr == 94 ) state = 22;
		else if( chr == 123 ) state = 23;
		else if( chr == 124 ) state = 24;
		else if( chr == 125 ) state = 25;
		else if( chr == 38 ) state = 48;
		else if( chr == 68 || chr == 100 ) state = 49;
		else if( chr == 39 ) state = 51;
		else if( chr == 73 || chr == 105 ) state = 52;
		else if( chr == 126 ) state = 53;
		else if( chr == 70 || chr == 102 ) state = 64;
		else if( chr == 85 || chr == 117 ) state = 65;
		else if( chr == 69 || chr == 101 ) state = 73;
		else if( chr == 84 || chr == 116 ) state = 74;
		else if( chr == 87 || chr == 119 ) state = 80;
		else if( chr == 82 || chr == 114 ) state = 84;
		else state = -1;
		break;

	case 1:
		state = -1;
		match = 2;
		match_pos = pos;
		break;

	case 2:
		if( chr == 61 ) state = 26;
		else state = -1;
		match = 31;
		match_pos = pos;
		break;

	case 3:
		state = -1;
		match = 41;
		match_pos = pos;
		break;

	case 4:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 122 ) ) state = 4;
		else state = -1;
		match = 45;
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
		if( ( chr >= 48 && chr <= 57 ) ) state = 29;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 13:
		state = -1;
		match = 34;
		match_pos = pos;
		break;

	case 14:
		if( ( chr >= 48 && chr <= 57 ) ) state = 14;
		else if( chr == 46 ) state = 29;
		else state = -1;
		match = 47;
		match_pos = pos;
		break;

	case 15:
		state = -1;
		match = 42;
		match_pos = pos;
		break;

	case 16:
		state = -1;
		match = 20;
		match_pos = pos;
		break;

	case 17:
		if( chr == 60 ) state = 30;
		else if( chr == 61 ) state = 31;
		else state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 18:
		if( chr == 61 ) state = 32;
		else state = -1;
		match = 21;
		match_pos = pos;
		break;

	case 19:
		if( chr == 61 ) state = 33;
		else if( chr == 62 ) state = 34;
		else state = -1;
		match = 27;
		match_pos = pos;
		break;

	case 20:
		state = -1;
		match = 16;
		match_pos = pos;
		break;

	case 21:
		state = -1;
		match = 17;
		match_pos = pos;
		break;

	case 22:
		state = -1;
		match = 37;
		match_pos = pos;
		break;

	case 23:
		state = -1;
		match = 18;
		match_pos = pos;
		break;

	case 24:
		if( chr == 124 ) state = 37;
		else state = -1;
		match = 43;
		match_pos = pos;
		break;

	case 25:
		state = -1;
		match = 19;
		match_pos = pos;
		break;

	case 26:
		state = -1;
		match = 23;
		match_pos = pos;
		break;

	case 27:
		state = -1;
		match = 30;
		match_pos = pos;
		break;

	case 28:
		state = -1;
		match = 46;
		match_pos = pos;
		break;

	case 29:
		if( ( chr >= 48 && chr <= 57 ) ) state = 29;
		else state = -1;
		match = 48;
		match_pos = pos;
		break;

	case 30:
		state = -1;
		match = 14;
		match_pos = pos;
		break;

	case 31:
		state = -1;
		match = 25;
		match_pos = pos;
		break;

	case 32:
		state = -1;
		match = 22;
		match_pos = pos;
		break;

	case 33:
		state = -1;
		match = 26;
		match_pos = pos;
		break;

	case 34:
		state = -1;
		match = 15;
		match_pos = pos;
		break;

	case 35:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 122 ) ) state = 4;
		else state = -1;
		match = 6;
		match_pos = pos;
		break;

	case 36:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 122 ) ) state = 4;
		else state = -1;
		match = 3;
		match_pos = pos;
		break;

	case 37:
		state = -1;
		match = 29;
		match_pos = pos;
		break;

	case 38:
		state = -1;
		match = 24;
		match_pos = pos;
		break;

	case 39:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 122 ) ) state = 4;
		else state = -1;
		match = 7;
		match_pos = pos;
		break;

	case 40:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 122 ) ) state = 4;
		else state = -1;
		match = 9;
		match_pos = pos;
		break;

	case 41:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 122 ) ) state = 4;
		else state = -1;
		match = 4;
		match_pos = pos;
		break;

	case 42:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 122 ) ) state = 4;
		else state = -1;
		match = 12;
		match_pos = pos;
		break;

	case 43:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 122 ) ) state = 4;
		else state = -1;
		match = 13;
		match_pos = pos;
		break;

	case 44:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 122 ) ) state = 4;
		else state = -1;
		match = 5;
		match_pos = pos;
		break;

	case 45:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 122 ) ) state = 4;
		else state = -1;
		match = 11;
		match_pos = pos;
		break;

	case 46:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 122 ) ) state = 4;
		else state = -1;
		match = 10;
		match_pos = pos;
		break;

	case 47:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 122 ) ) state = 4;
		else state = -1;
		match = 8;
		match_pos = pos;
		break;

	case 48:
		if( chr == 38 ) state = 27;
		else state = -1;
		break;

	case 49:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 68 ) || ( chr >= 70 && chr <= 78 ) || ( chr >= 80 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 100 ) || ( chr >= 102 && chr <= 110 ) || ( chr >= 112 && chr <= 122 ) ) state = 4;
		else if( chr == 79 || chr == 111 ) state = 35;
		else if( chr == 69 || chr == 101 ) state = 81;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 50:
		if( chr == 39 ) state = 28;
		else if( ( chr >= 0 && chr <= 38 ) || ( chr >= 40 && chr <= 91 ) || ( chr >= 93 && chr <= 254 ) ) state = 51;
		else if( chr == 92 ) state = 55;
		else state = -1;
		match = 46;
		match_pos = pos;
		break;

	case 51:
		if( chr == 39 ) state = 28;
		else if( ( chr >= 0 && chr <= 38 ) || ( chr >= 40 && chr <= 91 ) || ( chr >= 93 && chr <= 254 ) ) state = 51;
		else if( chr == 92 ) state = 55;
		else state = -1;
		break;

	case 52:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 69 ) || ( chr >= 71 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 101 ) || ( chr >= 103 && chr <= 122 ) ) state = 4;
		else if( chr == 70 || chr == 102 ) state = 36;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 53:
		if( chr == 61 ) state = 38;
		else state = -1;
		break;

	case 54:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 81 ) || ( chr >= 83 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 113 ) || ( chr >= 115 && chr <= 122 ) ) state = 4;
		else if( chr == 82 || chr == 114 ) state = 39;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 55:
		if( chr == 39 ) state = 50;
		else if( ( chr >= 0 && chr <= 38 ) || ( chr >= 40 && chr <= 91 ) || ( chr >= 93 && chr <= 254 ) ) state = 51;
		else if( chr == 92 ) state = 55;
		else state = -1;
		break;

	case 56:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 68 ) || ( chr >= 70 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 100 ) || ( chr >= 102 && chr <= 122 ) ) state = 4;
		else if( chr == 69 || chr == 101 ) state = 40;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 57:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 68 ) || ( chr >= 70 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 100 ) || ( chr >= 102 && chr <= 122 ) ) state = 4;
		else if( chr == 69 || chr == 101 ) state = 41;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 58:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 68 ) || ( chr >= 70 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 100 ) || ( chr >= 102 && chr <= 122 ) ) state = 4;
		else if( chr == 69 || chr == 101 ) state = 42;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 59:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 68 ) || ( chr >= 70 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 100 ) || ( chr >= 102 && chr <= 122 ) ) state = 4;
		else if( chr == 69 || chr == 101 ) state = 43;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 60:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 68 ) || ( chr >= 70 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 100 ) || ( chr >= 102 && chr <= 122 ) ) state = 4;
		else if( chr == 69 || chr == 101 ) state = 44;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 61:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 68 ) || ( chr >= 70 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 100 ) || ( chr >= 102 && chr <= 122 ) ) state = 4;
		else if( chr == 69 || chr == 101 ) state = 45;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 62:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 77 ) || ( chr >= 79 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 109 ) || ( chr >= 111 && chr <= 122 ) ) state = 4;
		else if( chr == 78 || chr == 110 ) state = 46;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 63:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 77 ) || ( chr >= 79 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 109 ) || ( chr >= 111 && chr <= 122 ) ) state = 4;
		else if( chr == 78 || chr == 110 ) state = 47;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 64:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 66 && chr <= 78 ) || ( chr >= 80 && chr <= 84 ) || ( chr >= 86 && chr <= 90 ) || chr == 95 || ( chr >= 98 && chr <= 110 ) || ( chr >= 112 && chr <= 116 ) || ( chr >= 118 && chr <= 122 ) ) state = 4;
		else if( chr == 79 || chr == 111 ) state = 54;
		else if( chr == 65 || chr == 97 ) state = 75;
		else if( chr == 85 || chr == 117 ) state = 86;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 65:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 82 ) || ( chr >= 84 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 114 ) || ( chr >= 116 && chr <= 122 ) ) state = 4;
		else if( chr == 83 || chr == 115 ) state = 56;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 66:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 82 ) || ( chr >= 84 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 114 ) || ( chr >= 116 && chr <= 122 ) ) state = 4;
		else if( chr == 83 || chr == 115 ) state = 57;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 67:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 84 ) || ( chr >= 86 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 116 ) || ( chr >= 118 && chr <= 122 ) ) state = 4;
		else if( chr == 85 || chr == 117 ) state = 58;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 68:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 82 ) || ( chr >= 84 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 114 ) || ( chr >= 116 && chr <= 122 ) ) state = 4;
		else if( chr == 83 || chr == 115 ) state = 59;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 69:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 75 ) || ( chr >= 77 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 107 ) || ( chr >= 109 && chr <= 122 ) ) state = 4;
		else if( chr == 76 || chr == 108 ) state = 60;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 70:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 83 ) || ( chr >= 85 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 115 ) || ( chr >= 117 && chr <= 122 ) ) state = 4;
		else if( chr == 84 || chr == 116 ) state = 61;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 71:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 81 ) || ( chr >= 83 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 113 ) || ( chr >= 115 && chr <= 122 ) ) state = 4;
		else if( chr == 82 || chr == 114 ) state = 62;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 72:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 78 ) || ( chr >= 80 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 110 ) || ( chr >= 112 && chr <= 122 ) ) state = 4;
		else if( chr == 79 || chr == 111 ) state = 63;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 73:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 75 ) || ( chr >= 77 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 107 ) || ( chr >= 109 && chr <= 122 ) ) state = 4;
		else if( chr == 76 || chr == 108 ) state = 66;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 74:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 81 ) || ( chr >= 83 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 113 ) || ( chr >= 115 && chr <= 122 ) ) state = 4;
		else if( chr == 82 || chr == 114 ) state = 67;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 75:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 75 ) || ( chr >= 77 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 107 ) || ( chr >= 109 && chr <= 122 ) ) state = 4;
		else if( chr == 76 || chr == 108 ) state = 68;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 76:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 72 ) || ( chr >= 74 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 104 ) || ( chr >= 106 && chr <= 122 ) ) state = 4;
		else if( chr == 73 || chr == 105 ) state = 69;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 77:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 68 ) || ( chr >= 70 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 100 ) || ( chr >= 102 && chr <= 122 ) ) state = 4;
		else if( chr == 69 || chr == 101 ) state = 70;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 78:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 84 ) || ( chr >= 86 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 116 ) || ( chr >= 118 && chr <= 122 ) ) state = 4;
		else if( chr == 85 || chr == 117 ) state = 71;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 79:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 72 ) || ( chr >= 74 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 104 ) || ( chr >= 106 && chr <= 122 ) ) state = 4;
		else if( chr == 73 || chr == 105 ) state = 72;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 80:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 71 ) || ( chr >= 73 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 103 ) || ( chr >= 105 && chr <= 122 ) ) state = 4;
		else if( chr == 72 || chr == 104 ) state = 76;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 81:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 75 ) || ( chr >= 77 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 107 ) || ( chr >= 109 && chr <= 122 ) ) state = 4;
		else if( chr == 76 || chr == 108 ) state = 77;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 82:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 83 ) || ( chr >= 85 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 115 ) || ( chr >= 117 && chr <= 122 ) ) state = 4;
		else if( chr == 84 || chr == 116 ) state = 78;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 83:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 83 ) || ( chr >= 85 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 115 ) || ( chr >= 117 && chr <= 122 ) ) state = 4;
		else if( chr == 84 || chr == 116 ) state = 79;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 84:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 68 ) || ( chr >= 70 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 100 ) || ( chr >= 102 && chr <= 122 ) ) state = 4;
		else if( chr == 69 || chr == 101 ) state = 82;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 85:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 66 ) || ( chr >= 68 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 98 ) || ( chr >= 100 && chr <= 122 ) ) state = 4;
		else if( chr == 67 || chr == 99 ) state = 83;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 86:
		if( ( chr >= 48 && chr <= 57 ) || ( chr >= 65 && chr <= 77 ) || ( chr >= 79 && chr <= 90 ) || chr == 95 || ( chr >= 97 && chr <= 109 ) || ( chr >= 111 && chr <= 122 ) ) state = 4;
		else if( chr == 78 || chr == 110 ) state = 85;
		else state = -1;
		match = 45;
		match_pos = pos;
		break;

}




                    //Line- and column-counter
                    if( state > -1 ) {
                        if( chr == 10 ) {
                            PCB.line++;
                            PCB.column = 0;
                            this.parCurLine = PCB.line;
                            this.parCurColumn = PCB.column;
                        }
                        PCB.column++;
                    }

                    pos++;

                } while( state > -1 );

            } while (2 > -1 && match == 2);

            if (match > -1) {
                PCB.att = PCB.src.substr( start, match_pos - start );
                PCB.offset = match_pos;
        
	if( match == 46 )
	{
		 PCB.att = PCB.att.substr( 1, PCB.att.length - 2 );
                                                                                PCB.att = PCB.att.replace( /\\\'/g, "\'" );    
		}

            } else {
                PCB.att = new String();
                match = -1;
            }

            break;
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
            i,

            //PCB: Parser Control Block
            parsercontrol = new Function( "",
                                "var la;" +
                                "var act;" +
                                "var offset;" +
                                "var src;" +
                                "var att;" +
                                "var line;" +
                                "var column;" +
                                "var error_step;" ),
            PCB = new parsercontrol(),

            //Visual parse tree generation
            treenode = new Function( "",
                                "var sym;"+
                                "var att;"+
                                "var child;" ),
            treenodes = new Array(),
            tree = new Array(),
            tmptree = null;


/* Pop-Table */
var pop_tab = new Array(
	new Array( 0/* Program' */, 1 ),
	new Array( 49/* Program */, 2 ),
	new Array( 49/* Program */, 0 ),
	new Array( 51/* Stmt_List */, 2 ),
	new Array( 51/* Stmt_List */, 0 ),
	new Array( 52/* Param_List */, 3 ),
	new Array( 52/* Param_List */, 1 ),
	new Array( 52/* Param_List */, 0 ),
	new Array( 54/* Prop_List */, 3 ),
	new Array( 54/* Prop_List */, 1 ),
	new Array( 54/* Prop_List */, 0 ),
	new Array( 55/* Prop */, 3 ),
	new Array( 56/* Param_Def_List */, 3 ),
	new Array( 56/* Param_Def_List */, 1 ),
	new Array( 56/* Param_Def_List */, 0 ),
	new Array( 58/* Assign */, 3 ),
	new Array( 50/* Stmt */, 3 ),
	new Array( 50/* Stmt */, 5 ),
	new Array( 50/* Stmt */, 3 ),
	new Array( 50/* Stmt */, 5 ),
	new Array( 50/* Stmt */, 9 ),
	new Array( 50/* Stmt */, 3 ),
	new Array( 50/* Stmt */, 2 ),
	new Array( 50/* Stmt */, 2 ),
	new Array( 50/* Stmt */, 2 ),
	new Array( 50/* Stmt */, 2 ),
	new Array( 50/* Stmt */, 3 ),
	new Array( 50/* Stmt */, 1 ),
	new Array( 57/* Lhs */, 3 ),
	new Array( 57/* Lhs */, 4 ),
	new Array( 57/* Lhs */, 1 ),
	new Array( 53/* Expression */, 3 ),
	new Array( 53/* Expression */, 3 ),
	new Array( 53/* Expression */, 3 ),
	new Array( 53/* Expression */, 3 ),
	new Array( 53/* Expression */, 3 ),
	new Array( 53/* Expression */, 3 ),
	new Array( 53/* Expression */, 3 ),
	new Array( 53/* Expression */, 1 ),
	new Array( 61/* LogExp */, 3 ),
	new Array( 61/* LogExp */, 3 ),
	new Array( 61/* LogExp */, 2 ),
	new Array( 61/* LogExp */, 1 ),
	new Array( 60/* AddSubExp */, 3 ),
	new Array( 60/* AddSubExp */, 3 ),
	new Array( 60/* AddSubExp */, 1 ),
	new Array( 62/* MulDivExp */, 3 ),
	new Array( 62/* MulDivExp */, 3 ),
	new Array( 62/* MulDivExp */, 3 ),
	new Array( 62/* MulDivExp */, 1 ),
	new Array( 63/* ExpExp */, 3 ),
	new Array( 63/* ExpExp */, 1 ),
	new Array( 64/* NegExp */, 2 ),
	new Array( 64/* NegExp */, 2 ),
	new Array( 64/* NegExp */, 1 ),
	new Array( 59/* ExtValue */, 4 ),
	new Array( 59/* ExtValue */, 4 ),
	new Array( 59/* ExtValue */, 5 ),
	new Array( 59/* ExtValue */, 3 ),
	new Array( 59/* ExtValue */, 1 ),
	new Array( 65/* Value */, 1 ),
	new Array( 65/* Value */, 1 ),
	new Array( 65/* Value */, 1 ),
	new Array( 65/* Value */, 3 ),
	new Array( 65/* Value */, 1 ),
	new Array( 65/* Value */, 7 ),
	new Array( 65/* Value */, 3 ),
	new Array( 65/* Value */, 3 ),
	new Array( 65/* Value */, 1 ),
	new Array( 65/* Value */, 1 )
);

/* Action-Table */
var act_tab = new Array(
	/* State 0 */ new Array(  ),
	/* State 1 */ new Array( 3/* "IF" */,3 , 5/* "WHILE" */,4 , 6/* "DO" */,5 , 7/* "FOR" */,6 , 9/* "USE" */,7 , 11/* "DELETE" */,8 , 10/* "RETURN" */,9 , 18/* "{" */,12 , 20/* ";" */,13 , 45/* "Identifier" */,17 , 31/* "!" */,18 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 , 33/* "-" */,33 , 32/* "+" */,34 ),
	/* State 2 */ new Array(  ),
	/* State 3 */ new Array( 31/* "!" */,18 , 33/* "-" */,33 , 32/* "+" */,34 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 4 */ new Array( 31/* "!" */,18 , 33/* "-" */,33 , 32/* "+" */,34 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 5 */ new Array( 3/* "IF" */,3 , 5/* "WHILE" */,4 , 6/* "DO" */,5 , 7/* "FOR" */,6 , 9/* "USE" */,7 , 11/* "DELETE" */,8 , 10/* "RETURN" */,9 , 18/* "{" */,12 , 20/* ";" */,13 , 45/* "Identifier" */,17 , 31/* "!" */,18 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 , 33/* "-" */,33 , 32/* "+" */,34 ),
	/* State 6 */ new Array( 38/* "(" */,40 ),
	/* State 7 */ new Array( 45/* "Identifier" */,41 ),
	/* State 8 */ new Array( 45/* "Identifier" */,42 ),
	/* State 9 */ new Array( 3/* "IF" */,3 , 5/* "WHILE" */,4 , 6/* "DO" */,5 , 7/* "FOR" */,6 , 9/* "USE" */,7 , 11/* "DELETE" */,8 , 10/* "RETURN" */,9 , 18/* "{" */,12 , 20/* ";" */,13 , 45/* "Identifier" */,17 , 31/* "!" */,18 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 , 33/* "-" */,33 , 32/* "+" */,34 ),
	/* State 10 */ new Array( 20/* ";" */,44 ),
	/* State 11 */ new Array( 24/* "~=" */,45 , 23/* "!=" */,46 , 26/* ">=" */,47 , 25/* "<=" */,48 , 27/* ">" */,49 , 28/* "<" */,50 , 22/* "==" */,51 , 20/* ";" */,52 ),
	/* State 12 */ new Array(  ),
	/* State 13 */ new Array(  ),
	/* State 14 */ new Array( 21/* "=" */,54 ),
	/* State 15 */ new Array( 30/* "&&" */,55 , 29/* "||" */,56 ),
	/* State 16 */ new Array( 44/* "." */,57 , 38/* "(" */,58 , 16/* "[" */,59 ),
	/* State 17 */ new Array( 21/* "=" */,-30 ),
	/* State 18 */ new Array( 31/* "!" */,18 , 33/* "-" */,33 , 32/* "+" */,34 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 19 */ new Array( 32/* "+" */,61 , 33/* "-" */,62 ),
	/* State 20 */ new Array(  ),
	/* State 21 */ new Array( 35/* "%" */,63 , 34/* "/" */,64 , 36/* "*" */,65 ),
	/* State 22 */ new Array(  ),
	/* State 23 */ new Array(  ),
	/* State 24 */ new Array( 31/* "!" */,18 , 33/* "-" */,33 , 32/* "+" */,34 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 25 */ new Array(  ),
	/* State 26 */ new Array( 38/* "(" */,67 ),
	/* State 27 */ new Array( 45/* "Identifier" */,70 ),
	/* State 28 */ new Array( 31/* "!" */,18 , 33/* "-" */,33 , 32/* "+" */,34 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 29 */ new Array(  ),
	/* State 30 */ new Array(  ),
	/* State 31 */ new Array(  ),
	/* State 32 */ new Array( 37/* "^" */,73 ),
	/* State 33 */ new Array( 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 34 */ new Array( 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 35 */ new Array( 24/* "~=" */,45 , 23/* "!=" */,46 , 26/* ">=" */,47 , 25/* "<=" */,48 , 27/* ">" */,49 , 28/* "<" */,50 , 22/* "==" */,51 , 3/* "IF" */,3 , 5/* "WHILE" */,4 , 6/* "DO" */,5 , 7/* "FOR" */,6 , 9/* "USE" */,7 , 11/* "DELETE" */,8 , 10/* "RETURN" */,9 , 18/* "{" */,12 , 20/* ";" */,13 , 45/* "Identifier" */,17 , 31/* "!" */,18 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 , 33/* "-" */,33 , 32/* "+" */,34 ),
	/* State 36 */ new Array( 44/* "." */,77 , 38/* "(" */,58 , 16/* "[" */,78 ),
	/* State 37 */ new Array(  ),
	/* State 38 */ new Array( 24/* "~=" */,45 , 23/* "!=" */,46 , 26/* ">=" */,47 , 25/* "<=" */,48 , 27/* ">" */,49 , 28/* "<" */,50 , 22/* "==" */,51 , 3/* "IF" */,3 , 5/* "WHILE" */,4 , 6/* "DO" */,5 , 7/* "FOR" */,6 , 9/* "USE" */,7 , 11/* "DELETE" */,8 , 10/* "RETURN" */,9 , 18/* "{" */,12 , 20/* ";" */,13 , 45/* "Identifier" */,17 , 31/* "!" */,18 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 , 33/* "-" */,33 , 32/* "+" */,34 ),
	/* State 39 */ new Array( 5/* "WHILE" */,80 ),
	/* State 40 */ new Array( 45/* "Identifier" */,17 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 41 */ new Array( 20/* ";" */,83 ),
	/* State 42 */ new Array(  ),
	/* State 43 */ new Array(  ),
	/* State 44 */ new Array(  ),
	/* State 45 */ new Array( 31/* "!" */,18 , 33/* "-" */,33 , 32/* "+" */,34 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 46 */ new Array( 31/* "!" */,18 , 33/* "-" */,33 , 32/* "+" */,34 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 47 */ new Array( 31/* "!" */,18 , 33/* "-" */,33 , 32/* "+" */,34 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 48 */ new Array( 31/* "!" */,18 , 33/* "-" */,33 , 32/* "+" */,34 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 49 */ new Array( 31/* "!" */,18 , 33/* "-" */,33 , 32/* "+" */,34 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 50 */ new Array( 31/* "!" */,18 , 33/* "-" */,33 , 32/* "+" */,34 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 51 */ new Array( 31/* "!" */,18 , 33/* "-" */,33 , 32/* "+" */,34 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 52 */ new Array(  ),
	/* State 53 */ new Array( 19/* "}" */,91 , 3/* "IF" */,3 , 5/* "WHILE" */,4 , 6/* "DO" */,5 , 7/* "FOR" */,6 , 9/* "USE" */,7 , 11/* "DELETE" */,8 , 10/* "RETURN" */,9 , 18/* "{" */,12 , 20/* ";" */,13 , 45/* "Identifier" */,17 , 31/* "!" */,18 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 , 33/* "-" */,33 , 32/* "+" */,34 ),
	/* State 54 */ new Array( 31/* "!" */,18 , 33/* "-" */,33 , 32/* "+" */,34 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 55 */ new Array( 33/* "-" */,33 , 32/* "+" */,34 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 56 */ new Array( 33/* "-" */,33 , 32/* "+" */,34 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 57 */ new Array( 45/* "Identifier" */,96 ),
	/* State 58 */ new Array( 31/* "!" */,18 , 33/* "-" */,33 , 32/* "+" */,34 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 59 */ new Array( 33/* "-" */,33 , 32/* "+" */,34 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 60 */ new Array( 30/* "&&" */,55 , 29/* "||" */,56 ),
	/* State 61 */ new Array( 33/* "-" */,33 , 32/* "+" */,34 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 62 */ new Array( 33/* "-" */,33 , 32/* "+" */,34 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 63 */ new Array( 33/* "-" */,33 , 32/* "+" */,34 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 64 */ new Array( 33/* "-" */,33 , 32/* "+" */,34 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 65 */ new Array( 33/* "-" */,33 , 32/* "+" */,34 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 66 */ new Array( 39/* ")" */,104 , 24/* "~=" */,45 , 23/* "!=" */,46 , 26/* ">=" */,47 , 25/* "<=" */,48 , 27/* ">" */,49 , 28/* "<" */,50 , 22/* "==" */,51 ),
	/* State 67 */ new Array( 45/* "Identifier" */,106 ),
	/* State 68 */ new Array( 15/* ">>" */,107 , 40/* "," */,108 ),
	/* State 69 */ new Array(  ),
	/* State 70 */ new Array( 42/* ":" */,109 ),
	/* State 71 */ new Array( 17/* "]" */,110 , 40/* "," */,111 ),
	/* State 72 */ new Array( 24/* "~=" */,45 , 23/* "!=" */,46 , 26/* ">=" */,47 , 25/* "<=" */,48 , 27/* ">" */,49 , 28/* "<" */,50 , 22/* "==" */,51 ),
	/* State 73 */ new Array( 33/* "-" */,33 , 32/* "+" */,34 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 74 */ new Array( 44/* "." */,77 , 38/* "(" */,58 , 16/* "[" */,78 ),
	/* State 75 */ new Array( 44/* "." */,77 , 38/* "(" */,58 , 16/* "[" */,78 ),
	/* State 76 */ new Array( 4/* "ELSE" */,113 ),
	/* State 77 */ new Array( 45/* "Identifier" */,114 ),
	/* State 78 */ new Array( 33/* "-" */,33 , 32/* "+" */,34 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 79 */ new Array(  ),
	/* State 80 */ new Array( 31/* "!" */,18 , 33/* "-" */,33 , 32/* "+" */,34 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 81 */ new Array( 20/* ";" */,117 ),
	/* State 82 */ new Array( 44/* "." */,57 , 38/* "(" */,58 , 16/* "[" */,59 ),
	/* State 83 */ new Array(  ),
	/* State 84 */ new Array( 30/* "&&" */,55 , 29/* "||" */,56 ),
	/* State 85 */ new Array( 30/* "&&" */,55 , 29/* "||" */,56 ),
	/* State 86 */ new Array( 30/* "&&" */,55 , 29/* "||" */,56 ),
	/* State 87 */ new Array( 30/* "&&" */,55 , 29/* "||" */,56 ),
	/* State 88 */ new Array( 30/* "&&" */,55 , 29/* "||" */,56 ),
	/* State 89 */ new Array( 30/* "&&" */,55 , 29/* "||" */,56 ),
	/* State 90 */ new Array( 30/* "&&" */,55 , 29/* "||" */,56 ),
	/* State 91 */ new Array(  ),
	/* State 92 */ new Array(  ),
	/* State 93 */ new Array( 24/* "~=" */,45 , 23/* "!=" */,46 , 26/* ">=" */,47 , 25/* "<=" */,48 , 27/* ">" */,49 , 28/* "<" */,50 , 22/* "==" */,51 ),
	/* State 94 */ new Array( 32/* "+" */,61 , 33/* "-" */,62 ),
	/* State 95 */ new Array( 32/* "+" */,61 , 33/* "-" */,62 ),
	/* State 96 */ new Array( 21/* "=" */,-28 ),
	/* State 97 */ new Array( 39/* ")" */,118 , 40/* "," */,111 ),
	/* State 98 */ new Array( 17/* "]" */,119 , 32/* "+" */,61 , 33/* "-" */,62 ),
	/* State 99 */ new Array( 35/* "%" */,63 , 34/* "/" */,64 , 36/* "*" */,65 ),
	/* State 100 */ new Array( 35/* "%" */,63 , 34/* "/" */,64 , 36/* "*" */,65 ),
	/* State 101 */ new Array(  ),
	/* State 102 */ new Array(  ),
	/* State 103 */ new Array(  ),
	/* State 104 */ new Array(  ),
	/* State 105 */ new Array( 39/* ")" */,120 , 40/* "," */,121 ),
	/* State 106 */ new Array(  ),
	/* State 107 */ new Array(  ),
	/* State 108 */ new Array( 45/* "Identifier" */,70 ),
	/* State 109 */ new Array( 31/* "!" */,18 , 33/* "-" */,33 , 32/* "+" */,34 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 110 */ new Array(  ),
	/* State 111 */ new Array( 31/* "!" */,18 , 33/* "-" */,33 , 32/* "+" */,34 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 112 */ new Array(  ),
	/* State 113 */ new Array( 3/* "IF" */,3 , 5/* "WHILE" */,4 , 6/* "DO" */,5 , 7/* "FOR" */,6 , 9/* "USE" */,7 , 11/* "DELETE" */,8 , 10/* "RETURN" */,9 , 18/* "{" */,12 , 20/* ";" */,13 , 45/* "Identifier" */,17 , 31/* "!" */,18 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 , 33/* "-" */,33 , 32/* "+" */,34 ),
	/* State 114 */ new Array(  ),
	/* State 115 */ new Array( 17/* "]" */,126 , 32/* "+" */,61 , 33/* "-" */,62 ),
	/* State 116 */ new Array( 24/* "~=" */,45 , 23/* "!=" */,46 , 26/* ">=" */,47 , 25/* "<=" */,48 , 27/* ">" */,49 , 28/* "<" */,50 , 22/* "==" */,51 , 20/* ";" */,127 ),
	/* State 117 */ new Array( 31/* "!" */,18 , 33/* "-" */,33 , 32/* "+" */,34 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 118 */ new Array( 47/* "Integer" */,22 , 48/* "Float" */,23 , 45/* "Identifier" */,37 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 119 */ new Array( 21/* "=" */,-29 ),
	/* State 120 */ new Array( 18/* "{" */,130 ),
	/* State 121 */ new Array( 45/* "Identifier" */,131 ),
	/* State 122 */ new Array(  ),
	/* State 123 */ new Array( 24/* "~=" */,45 , 23/* "!=" */,46 , 26/* ">=" */,47 , 25/* "<=" */,48 , 27/* ">" */,49 , 28/* "<" */,50 , 22/* "==" */,51 ),
	/* State 124 */ new Array( 24/* "~=" */,45 , 23/* "!=" */,46 , 26/* ">=" */,47 , 25/* "<=" */,48 , 27/* ">" */,49 , 28/* "<" */,50 , 22/* "==" */,51 ),
	/* State 125 */ new Array(  ),
	/* State 126 */ new Array(  ),
	/* State 127 */ new Array(  ),
	/* State 128 */ new Array( 24/* "~=" */,45 , 23/* "!=" */,46 , 26/* ">=" */,47 , 25/* "<=" */,48 , 27/* ">" */,49 , 28/* "<" */,50 , 22/* "==" */,51 , 20/* ";" */,132 ),
	/* State 129 */ new Array( 44/* "." */,77 , 38/* "(" */,58 , 16/* "[" */,78 ),
	/* State 130 */ new Array(  ),
	/* State 131 */ new Array(  ),
	/* State 132 */ new Array( 45/* "Identifier" */,17 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 ),
	/* State 133 */ new Array( 19/* "}" */,135 , 3/* "IF" */,3 , 5/* "WHILE" */,4 , 6/* "DO" */,5 , 7/* "FOR" */,6 , 9/* "USE" */,7 , 11/* "DELETE" */,8 , 10/* "RETURN" */,9 , 18/* "{" */,12 , 20/* ";" */,13 , 45/* "Identifier" */,17 , 31/* "!" */,18 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 , 33/* "-" */,33 , 32/* "+" */,34 ),
	/* State 134 */ new Array( 39/* ")" */,136 ),
	/* State 135 */ new Array(  ),
	/* State 136 */ new Array( 3/* "IF" */,3 , 5/* "WHILE" */,4 , 6/* "DO" */,5 , 7/* "FOR" */,6 , 9/* "USE" */,7 , 11/* "DELETE" */,8 , 10/* "RETURN" */,9 , 18/* "{" */,12 , 20/* ";" */,13 , 45/* "Identifier" */,17 , 31/* "!" */,18 , 47/* "Integer" */,22 , 48/* "Float" */,23 , 38/* "(" */,24 , 46/* "String" */,25 , 8/* "FUNCTION" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 12/* "TRUE" */,29 , 13/* "FALSE" */,30 , 33/* "-" */,33 , 32/* "+" */,34 ),
	/* State 137 */ new Array(  )
);

/* Goto-Table */
var goto_tab = new Array(
	/* State 0 */ new Array( 49/* Program */,1 ),
	/* State 1 */ new Array( 50/* Stmt */,2 , 58/* Assign */,10 , 53/* Expression */,11 , 57/* Lhs */,14 , 61/* LogExp */,15 , 59/* ExtValue */,16 , 60/* AddSubExp */,19 , 65/* Value */,20 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 ),
	/* State 2 */ new Array(  ),
	/* State 3 */ new Array( 53/* Expression */,35 , 61/* LogExp */,15 , 60/* AddSubExp */,19 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 , 59/* ExtValue */,36 , 65/* Value */,20 ),
	/* State 4 */ new Array( 53/* Expression */,38 , 61/* LogExp */,15 , 60/* AddSubExp */,19 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 , 59/* ExtValue */,36 , 65/* Value */,20 ),
	/* State 5 */ new Array( 50/* Stmt */,39 , 58/* Assign */,10 , 53/* Expression */,11 , 57/* Lhs */,14 , 61/* LogExp */,15 , 59/* ExtValue */,16 , 60/* AddSubExp */,19 , 65/* Value */,20 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 ),
	/* State 6 */ new Array(  ),
	/* State 7 */ new Array(  ),
	/* State 8 */ new Array(  ),
	/* State 9 */ new Array( 50/* Stmt */,43 , 58/* Assign */,10 , 53/* Expression */,11 , 57/* Lhs */,14 , 61/* LogExp */,15 , 59/* ExtValue */,16 , 60/* AddSubExp */,19 , 65/* Value */,20 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 ),
	/* State 10 */ new Array(  ),
	/* State 11 */ new Array(  ),
	/* State 12 */ new Array( 51/* Stmt_List */,53 ),
	/* State 13 */ new Array(  ),
	/* State 14 */ new Array(  ),
	/* State 15 */ new Array(  ),
	/* State 16 */ new Array(  ),
	/* State 17 */ new Array(  ),
	/* State 18 */ new Array( 61/* LogExp */,60 , 60/* AddSubExp */,19 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 , 59/* ExtValue */,36 , 65/* Value */,20 ),
	/* State 19 */ new Array(  ),
	/* State 20 */ new Array(  ),
	/* State 21 */ new Array(  ),
	/* State 22 */ new Array(  ),
	/* State 23 */ new Array(  ),
	/* State 24 */ new Array( 53/* Expression */,66 , 61/* LogExp */,15 , 60/* AddSubExp */,19 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 , 59/* ExtValue */,36 , 65/* Value */,20 ),
	/* State 25 */ new Array(  ),
	/* State 26 */ new Array(  ),
	/* State 27 */ new Array( 54/* Prop_List */,68 , 55/* Prop */,69 ),
	/* State 28 */ new Array( 52/* Param_List */,71 , 53/* Expression */,72 , 61/* LogExp */,15 , 60/* AddSubExp */,19 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 , 59/* ExtValue */,36 , 65/* Value */,20 ),
	/* State 29 */ new Array(  ),
	/* State 30 */ new Array(  ),
	/* State 31 */ new Array(  ),
	/* State 32 */ new Array(  ),
	/* State 33 */ new Array( 59/* ExtValue */,74 , 65/* Value */,20 ),
	/* State 34 */ new Array( 59/* ExtValue */,75 , 65/* Value */,20 ),
	/* State 35 */ new Array( 50/* Stmt */,76 , 58/* Assign */,10 , 53/* Expression */,11 , 57/* Lhs */,14 , 61/* LogExp */,15 , 59/* ExtValue */,16 , 60/* AddSubExp */,19 , 65/* Value */,20 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 ),
	/* State 36 */ new Array(  ),
	/* State 37 */ new Array(  ),
	/* State 38 */ new Array( 50/* Stmt */,79 , 58/* Assign */,10 , 53/* Expression */,11 , 57/* Lhs */,14 , 61/* LogExp */,15 , 59/* ExtValue */,16 , 60/* AddSubExp */,19 , 65/* Value */,20 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 ),
	/* State 39 */ new Array(  ),
	/* State 40 */ new Array( 58/* Assign */,81 , 57/* Lhs */,14 , 59/* ExtValue */,82 , 65/* Value */,20 ),
	/* State 41 */ new Array(  ),
	/* State 42 */ new Array(  ),
	/* State 43 */ new Array(  ),
	/* State 44 */ new Array(  ),
	/* State 45 */ new Array( 61/* LogExp */,84 , 60/* AddSubExp */,19 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 , 59/* ExtValue */,36 , 65/* Value */,20 ),
	/* State 46 */ new Array( 61/* LogExp */,85 , 60/* AddSubExp */,19 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 , 59/* ExtValue */,36 , 65/* Value */,20 ),
	/* State 47 */ new Array( 61/* LogExp */,86 , 60/* AddSubExp */,19 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 , 59/* ExtValue */,36 , 65/* Value */,20 ),
	/* State 48 */ new Array( 61/* LogExp */,87 , 60/* AddSubExp */,19 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 , 59/* ExtValue */,36 , 65/* Value */,20 ),
	/* State 49 */ new Array( 61/* LogExp */,88 , 60/* AddSubExp */,19 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 , 59/* ExtValue */,36 , 65/* Value */,20 ),
	/* State 50 */ new Array( 61/* LogExp */,89 , 60/* AddSubExp */,19 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 , 59/* ExtValue */,36 , 65/* Value */,20 ),
	/* State 51 */ new Array( 61/* LogExp */,90 , 60/* AddSubExp */,19 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 , 59/* ExtValue */,36 , 65/* Value */,20 ),
	/* State 52 */ new Array(  ),
	/* State 53 */ new Array( 50/* Stmt */,92 , 58/* Assign */,10 , 53/* Expression */,11 , 57/* Lhs */,14 , 61/* LogExp */,15 , 59/* ExtValue */,16 , 60/* AddSubExp */,19 , 65/* Value */,20 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 ),
	/* State 54 */ new Array( 53/* Expression */,93 , 61/* LogExp */,15 , 60/* AddSubExp */,19 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 , 59/* ExtValue */,36 , 65/* Value */,20 ),
	/* State 55 */ new Array( 60/* AddSubExp */,94 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 , 59/* ExtValue */,36 , 65/* Value */,20 ),
	/* State 56 */ new Array( 60/* AddSubExp */,95 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 , 59/* ExtValue */,36 , 65/* Value */,20 ),
	/* State 57 */ new Array(  ),
	/* State 58 */ new Array( 52/* Param_List */,97 , 53/* Expression */,72 , 61/* LogExp */,15 , 60/* AddSubExp */,19 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 , 59/* ExtValue */,36 , 65/* Value */,20 ),
	/* State 59 */ new Array( 60/* AddSubExp */,98 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 , 59/* ExtValue */,36 , 65/* Value */,20 ),
	/* State 60 */ new Array(  ),
	/* State 61 */ new Array( 62/* MulDivExp */,99 , 63/* ExpExp */,31 , 64/* NegExp */,32 , 59/* ExtValue */,36 , 65/* Value */,20 ),
	/* State 62 */ new Array( 62/* MulDivExp */,100 , 63/* ExpExp */,31 , 64/* NegExp */,32 , 59/* ExtValue */,36 , 65/* Value */,20 ),
	/* State 63 */ new Array( 63/* ExpExp */,101 , 64/* NegExp */,32 , 59/* ExtValue */,36 , 65/* Value */,20 ),
	/* State 64 */ new Array( 63/* ExpExp */,102 , 64/* NegExp */,32 , 59/* ExtValue */,36 , 65/* Value */,20 ),
	/* State 65 */ new Array( 63/* ExpExp */,103 , 64/* NegExp */,32 , 59/* ExtValue */,36 , 65/* Value */,20 ),
	/* State 66 */ new Array(  ),
	/* State 67 */ new Array( 56/* Param_Def_List */,105 ),
	/* State 68 */ new Array(  ),
	/* State 69 */ new Array(  ),
	/* State 70 */ new Array(  ),
	/* State 71 */ new Array(  ),
	/* State 72 */ new Array(  ),
	/* State 73 */ new Array( 63/* ExpExp */,112 , 64/* NegExp */,32 , 59/* ExtValue */,36 , 65/* Value */,20 ),
	/* State 74 */ new Array(  ),
	/* State 75 */ new Array(  ),
	/* State 76 */ new Array(  ),
	/* State 77 */ new Array(  ),
	/* State 78 */ new Array( 60/* AddSubExp */,115 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 , 59/* ExtValue */,36 , 65/* Value */,20 ),
	/* State 79 */ new Array(  ),
	/* State 80 */ new Array( 53/* Expression */,116 , 61/* LogExp */,15 , 60/* AddSubExp */,19 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 , 59/* ExtValue */,36 , 65/* Value */,20 ),
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
	/* State 105 */ new Array(  ),
	/* State 106 */ new Array(  ),
	/* State 107 */ new Array(  ),
	/* State 108 */ new Array( 55/* Prop */,122 ),
	/* State 109 */ new Array( 53/* Expression */,123 , 61/* LogExp */,15 , 60/* AddSubExp */,19 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 , 59/* ExtValue */,36 , 65/* Value */,20 ),
	/* State 110 */ new Array(  ),
	/* State 111 */ new Array( 53/* Expression */,124 , 61/* LogExp */,15 , 60/* AddSubExp */,19 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 , 59/* ExtValue */,36 , 65/* Value */,20 ),
	/* State 112 */ new Array(  ),
	/* State 113 */ new Array( 50/* Stmt */,125 , 58/* Assign */,10 , 53/* Expression */,11 , 57/* Lhs */,14 , 61/* LogExp */,15 , 59/* ExtValue */,16 , 60/* AddSubExp */,19 , 65/* Value */,20 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 ),
	/* State 114 */ new Array(  ),
	/* State 115 */ new Array(  ),
	/* State 116 */ new Array(  ),
	/* State 117 */ new Array( 53/* Expression */,128 , 61/* LogExp */,15 , 60/* AddSubExp */,19 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 , 59/* ExtValue */,36 , 65/* Value */,20 ),
	/* State 118 */ new Array( 59/* ExtValue */,129 , 65/* Value */,20 ),
	/* State 119 */ new Array(  ),
	/* State 120 */ new Array(  ),
	/* State 121 */ new Array(  ),
	/* State 122 */ new Array(  ),
	/* State 123 */ new Array(  ),
	/* State 124 */ new Array(  ),
	/* State 125 */ new Array(  ),
	/* State 126 */ new Array(  ),
	/* State 127 */ new Array(  ),
	/* State 128 */ new Array(  ),
	/* State 129 */ new Array(  ),
	/* State 130 */ new Array( 51/* Stmt_List */,133 ),
	/* State 131 */ new Array(  ),
	/* State 132 */ new Array( 58/* Assign */,134 , 57/* Lhs */,14 , 59/* ExtValue */,82 , 65/* Value */,20 ),
	/* State 133 */ new Array( 50/* Stmt */,92 , 58/* Assign */,10 , 53/* Expression */,11 , 57/* Lhs */,14 , 61/* LogExp */,15 , 59/* ExtValue */,16 , 60/* AddSubExp */,19 , 65/* Value */,20 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 ),
	/* State 134 */ new Array(  ),
	/* State 135 */ new Array(  ),
	/* State 136 */ new Array( 50/* Stmt */,137 , 58/* Assign */,10 , 53/* Expression */,11 , 57/* Lhs */,14 , 61/* LogExp */,15 , 59/* ExtValue */,16 , 60/* AddSubExp */,19 , 65/* Value */,20 , 62/* MulDivExp */,21 , 63/* ExpExp */,31 , 64/* NegExp */,32 ),
	/* State 137 */ new Array(  )
);

/* Default-Actions-Table */
var defact_tab = new Array(
	 /* State 0 */ 2 ,
	 /* State 1 */ 0 ,
	 /* State 2 */ 1 ,
	 /* State 3 */ -1 ,
	 /* State 4 */ -1 ,
	 /* State 5 */ -1 ,
	 /* State 6 */ -1 ,
	 /* State 7 */ -1 ,
	 /* State 8 */ -1 ,
	 /* State 9 */ -1 ,
	 /* State 10 */ -1 ,
	 /* State 11 */ -1 ,
	 /* State 12 */ 4 ,
	 /* State 13 */ 27 ,
	 /* State 14 */ -1 ,
	 /* State 15 */ 38 ,
	 /* State 16 */ 54 ,
	 /* State 17 */ 62 ,
	 /* State 18 */ -1 ,
	 /* State 19 */ 42 ,
	 /* State 20 */ 59 ,
	 /* State 21 */ 45 ,
	 /* State 22 */ 60 ,
	 /* State 23 */ 61 ,
	 /* State 24 */ -1 ,
	 /* State 25 */ 64 ,
	 /* State 26 */ -1 ,
	 /* State 27 */ 10 ,
	 /* State 28 */ 7 ,
	 /* State 29 */ 68 ,
	 /* State 30 */ 69 ,
	 /* State 31 */ 49 ,
	 /* State 32 */ 51 ,
	 /* State 33 */ -1 ,
	 /* State 34 */ -1 ,
	 /* State 35 */ -1 ,
	 /* State 36 */ 54 ,
	 /* State 37 */ 62 ,
	 /* State 38 */ -1 ,
	 /* State 39 */ -1 ,
	 /* State 40 */ -1 ,
	 /* State 41 */ -1 ,
	 /* State 42 */ 22 ,
	 /* State 43 */ 23 ,
	 /* State 44 */ 24 ,
	 /* State 45 */ -1 ,
	 /* State 46 */ -1 ,
	 /* State 47 */ -1 ,
	 /* State 48 */ -1 ,
	 /* State 49 */ -1 ,
	 /* State 50 */ -1 ,
	 /* State 51 */ -1 ,
	 /* State 52 */ 25 ,
	 /* State 53 */ -1 ,
	 /* State 54 */ -1 ,
	 /* State 55 */ -1 ,
	 /* State 56 */ -1 ,
	 /* State 57 */ -1 ,
	 /* State 58 */ 7 ,
	 /* State 59 */ -1 ,
	 /* State 60 */ 41 ,
	 /* State 61 */ -1 ,
	 /* State 62 */ -1 ,
	 /* State 63 */ -1 ,
	 /* State 64 */ -1 ,
	 /* State 65 */ -1 ,
	 /* State 66 */ -1 ,
	 /* State 67 */ 14 ,
	 /* State 68 */ -1 ,
	 /* State 69 */ 9 ,
	 /* State 70 */ -1 ,
	 /* State 71 */ -1 ,
	 /* State 72 */ 6 ,
	 /* State 73 */ -1 ,
	 /* State 74 */ 52 ,
	 /* State 75 */ 53 ,
	 /* State 76 */ 16 ,
	 /* State 77 */ -1 ,
	 /* State 78 */ -1 ,
	 /* State 79 */ 18 ,
	 /* State 80 */ -1 ,
	 /* State 81 */ -1 ,
	 /* State 82 */ -1 ,
	 /* State 83 */ 21 ,
	 /* State 84 */ 37 ,
	 /* State 85 */ 36 ,
	 /* State 86 */ 35 ,
	 /* State 87 */ 34 ,
	 /* State 88 */ 33 ,
	 /* State 89 */ 32 ,
	 /* State 90 */ 31 ,
	 /* State 91 */ 26 ,
	 /* State 92 */ 3 ,
	 /* State 93 */ 15 ,
	 /* State 94 */ 40 ,
	 /* State 95 */ 39 ,
	 /* State 96 */ 58 ,
	 /* State 97 */ -1 ,
	 /* State 98 */ -1 ,
	 /* State 99 */ 44 ,
	 /* State 100 */ 43 ,
	 /* State 101 */ 48 ,
	 /* State 102 */ 47 ,
	 /* State 103 */ 46 ,
	 /* State 104 */ 63 ,
	 /* State 105 */ -1 ,
	 /* State 106 */ 13 ,
	 /* State 107 */ 66 ,
	 /* State 108 */ -1 ,
	 /* State 109 */ -1 ,
	 /* State 110 */ 67 ,
	 /* State 111 */ -1 ,
	 /* State 112 */ 50 ,
	 /* State 113 */ -1 ,
	 /* State 114 */ 58 ,
	 /* State 115 */ -1 ,
	 /* State 116 */ -1 ,
	 /* State 117 */ -1 ,
	 /* State 118 */ 56 ,
	 /* State 119 */ 55 ,
	 /* State 120 */ -1 ,
	 /* State 121 */ -1 ,
	 /* State 122 */ 8 ,
	 /* State 123 */ 11 ,
	 /* State 124 */ 5 ,
	 /* State 125 */ 17 ,
	 /* State 126 */ 55 ,
	 /* State 127 */ 19 ,
	 /* State 128 */ -1 ,
	 /* State 129 */ 57 ,
	 /* State 130 */ 4 ,
	 /* State 131 */ 12 ,
	 /* State 132 */ -1 ,
	 /* State 133 */ -1 ,
	 /* State 134 */ -1 ,
	 /* State 135 */ 65 ,
	 /* State 136 */ -1 ,
	 /* State 137 */ 20 
);



/* Symbol labels */
var labels = new Array(
	"Program'" /* Non-terminal symbol */,
	"ERROR_RESYNC" /* Terminal symbol */,
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
	"$" /* Terminal symbol */
);



        PCB.line = 1;
        PCB.column = 1;
        PCB.offset = 0;
        PCB.error_step = 0;
        PCB.src = src;
        PCB.att = new String();
    
        if( !err_off ) {
            err_off = new Array();
        }
        if( !err_la ) {
            err_la = new Array();
        }

        sstack.push( 0 );
        vstack.push( 0 );
    
        PCB.la = this._lex(PCB);
            
        while( true ) {
            PCB.act = 139;
            for( var i = 0; i < act_tab[sstack[sstack.length-1]].length; i+=2 ) {
                if( act_tab[sstack[sstack.length-1]][i] == PCB.la ) {
                    PCB.act = act_tab[sstack[sstack.length-1]][i+1];
                    break;
                }
            }
        
            if( PCB.act == 139 ) {
                if( ( PCB.act = defact_tab[ sstack[sstack.length-1] ] ) < 0 )
                    PCB.act = 139;
                else
                    PCB.act *= -1;
            }

        if( this._dbg_withtrace && sstack.length > 0 )
        {
            this._dbg_print( "\nState " + sstack[sstack.length-1] + "\n" +
                            "\tLookahead: " + labels[PCB.la] +
                                " (\"" + PCB.att + "\")\n" +
                            "\tAction: " + PCB.act + "\n" + 
                            "\tSource: \"" + PCB.src.substr( PCB.offset, 30 ) +
                                    ( ( PCB.offset + 30 < PCB.src.length ) ?
                                        "..." : "" ) + "\"\n" +
                            "\tStack: " + sstack.join() + "\n" +
                            "\tValue stack: " + vstack.join() + "\n" );
            
            if( this._dbg_withstepbystep )
                this._dbg_wait();
        }
        
            
        //Parse error? Try to recover!
        if( PCB.act == 139 )
        {
            if( this._dbg_withtrace )
            {
                var expect = new String();
                
                this._dbg_print( "Error detected: " +
                    "There is no reduce or shift on the symbol " +
                        labels[PCB.la] );
                
                for( var i = 0; i < act_tab[sstack[sstack.length-1]].length;
                        i+=2 )
                {
                    if( expect != "" )
                        expect += ", ";
                        
                    expect += "\"" +
                                labels[ act_tab[sstack[sstack.length-1]][i] ]
                                    + "\"";
                }
                
                this._dbg_print( "Expecting: " + expect );
            }
            
            //Report errors only when error_step is 0, and this is not a
            //subsequent error from a previous parse
            if( PCB.error_step == 0 )
            {
                err_cnt++;
                err_off.push( {offset: PCB.offset - PCB.att.length, line: PCB.line} );
                err_la.push( new Array() );
                for( var i = 0; i < act_tab[sstack[sstack.length-1]].length;
                        i+=2 )
                    err_la[err_la.length-1].push(
                            labels[act_tab[sstack[sstack.length-1]][i]] );
            }
            
            //Perform error recovery            
            while( sstack.length > 1 && PCB.act == 139 )
            {
                sstack.pop();
                vstack.pop();
                
                //Try to shift on error token
                for( var i = 0; i < act_tab[sstack[sstack.length-1]].length;
                        i+=2 )
                {
                    if( act_tab[sstack[sstack.length-1]][i] == 1 )
                    {
                        PCB.act = act_tab[sstack[sstack.length-1]][i+1];
                        
                        sstack.push( PCB.act );
                        vstack.push( new String() );
                        
                        if( this._dbg_withtrace )
                        {
                            this._dbg_print(
                                "Error recovery: error token " +
                                    "could be shifted!" );
                            this._dbg_print( "Error recovery: " +
                                    "current stack is " + sstack.join() );
                        }

                        break;
                    }
                }
            }
            
            //Is it better to leave the parser now?
            if( sstack.length > 1 && PCB.act != 139 )
            {
                //Ok, now try to shift on the next tokens
                while( PCB.la != 66 )
                {
                    if( this._dbg_withtrace )
                        this._dbg_print( "Error recovery: " +
                            "Trying to shift on \""
                                + labels[ PCB.la ] + "\"" );

                    PCB.act = 139;
                    
                    for( var i = 0; i < act_tab[sstack[sstack.length-1]].length;
                            i+=2 )
                    {
                        if( act_tab[sstack[sstack.length-1]][i] == PCB.la )
                        {
                            PCB.act = act_tab[sstack[sstack.length-1]][i+1];
                            break;
                        }
                    }
                    
                    if( PCB.act != 139 )
                        break;
                        
                    if( this._dbg_withtrace )
                        this._dbg_print( "Error recovery: Discarding \""
                            + labels[ PCB.la ] + "\"" );
                    
                    while( ( PCB.la = this._lex( PCB ) )
                                < 0 )
                        PCB.offset++;
                
                    if( this._dbg_withtrace )
                        this._dbg_print( "Error recovery: New token \""
                            + labels[ PCB.la ] + "\"" );
                }
                while( PCB.la != 66 && PCB.act == 139 );
            }
            
            if( PCB.act == 139 || PCB.la == 66 )
            {
                if( this._dbg_withtrace )
                    this._dbg_print( "\tError recovery failed, " +
                            "terminating parse process..." );
                break;
            }

            if( this._dbg_withtrace )
                this._dbg_print( "\tError recovery succeeded, " +
                                            "continuing" );
            
            //Try to parse the next three tokens successfully...
            PCB.error_step = 3;
        }

        //Shift
        if( PCB.act > 0 )
        {
            //Parse tree generation
            if( this._dbg_withparsetree )
            {
                var node = new treenode();
                node.sym = labels[ PCB.la ];
                node.att = PCB.att;
                node.child = new Array();
                tree.push( treenodes.length );
                treenodes.push( node );
            }
            
            if( this._dbg_withtrace )
                this._dbg_print( "Shifting symbol: " +
                        labels[PCB.la] + " (" + PCB.att + ")" );
        
            sstack.push( PCB.act );
            vstack.push( PCB.att );
            
            PCB.la = this._lex( PCB );
            
            if( this._dbg_withtrace )
                this._dbg_print( "\tNew lookahead symbol: " +
                        labels[PCB.la] + " (" + PCB.att + ")" );
                
            //Successfull shift and right beyond error recovery?
            if( PCB.error_step > 0 )
                PCB.error_step--;
        }
        //Reduce
        else
        {        
            act = PCB.act * -1;
            
            if( this._dbg_withtrace )
                this._dbg_print( "Reducing by production: " + act );
            
            rval = void( 0 );
            
            if( this._dbg_withtrace )
                this._dbg_print( "\tPerforming semantic action..." );
            
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
		 rval = this.createNode('node_op', 'op_while', vstack[ vstack.length - 2 ], vstack[ vstack.length - 1 ] ); 
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
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 55:
	{
		 rval = this.createNode('node_op', 'op_extvalue', vstack[ vstack.length - 4 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 56:
	{
		 rval = this.createNode('node_op', 'op_execfun', vstack[ vstack.length - 4 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 57:
	{
		 rval = this.createNode('node_op', 'op_execfun', vstack[ vstack.length - 5 ], vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 58:
	{
		 rval = this.createNode('node_op', 'op_property', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 59:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 60:
	{
		 rval = this.createNode('node_const', vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 61:
	{
		 rval = this.createNode('node_const', vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 62:
	{
		 rval = this.createNode('node_var', vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 63:
	{
		 rval = vstack[ vstack.length - 2 ]; 
	}
	break;
	case 64:
	{
		 rval = this.createNode('node_str', vstack[ vstack.length - 1 ]); 
	}
	break;
	case 65:
	{
		 rval = this.createNode('node_op', 'op_function', vstack[ vstack.length - 5 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 66:
	{
		 rval = this.createNode('node_op', 'op_proplst_val', vstack[ vstack.length - 2 ]); 
	}
	break;
	case 67:
	{
		 rval = this.createNode('node_op', 'op_array', vstack[ vstack.length - 2 ]); 
	}
	break;
	case 68:
	{
		 rval = this.createNode('node_const_bool', vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 69:
	{
		 rval = this.createNode('node_const_bool', vstack[ vstack.length - 1 ] ); 
	}
	break;
}


            
            if( this._dbg_withparsetree )
                tmptree = new Array();

            if( this._dbg_withtrace )
                this._dbg_print( "\tPopping " +
                                    pop_tab[act][1] +  " off the stack..." );
                
            for( var i = 0; i < pop_tab[act][1]; i++ )
            {
                if( this._dbg_withparsetree )
                    tmptree.push( tree.pop() );
                    
                sstack.pop();
                vstack.pop();
            }

            //Get goto-table entry
            PCB.act = 139;
            for( var i = 0; i < goto_tab[sstack[sstack.length-1]].length; i+=2 )
            {
                if( goto_tab[sstack[sstack.length-1]][i] == pop_tab[act][0] )
                {
                    PCB.act = goto_tab[sstack[sstack.length-1]][i+1];
                    break;
                }
            }
            
            //Do some parse tree construction if desired
            if( this._dbg_withparsetree )
            {
                var node = new treenode();
                node.sym = labels[ pop_tab[act][0] ];
                node.att = rval;
                node.child = tmptree.reverse();
                tree.push( treenodes.length );
                treenodes.push( node );
            }
            
            //Goal symbol match?
            if( act == 0 ) //Don't use PCB.act here!
                break;
                
            if( this._dbg_withtrace )
                this._dbg_print( "\tPushing non-terminal " +
                        labels[ pop_tab[act][0] ] );
            
            //...and push it!
            sstack.push( PCB.act );
            vstack.push( rval );
        }
    }

    if( this._dbg_withtrace )
    {
        this._dbg_print( "\nParse complete." );
        
        //This function is used for parser drivers that will output
        //the entire debug messages in a row.
        this._dbg_flush();
    }

    if( this._dbg_withparsetree )
    {
        if( err_cnt == 0 )
        {
            this._dbg_print( "\n\n--- Parse tree ---" );
            this._dbg_parsetree( 0, treenodes, tree );
        }
        else
        {
            this._dbg_print( "\n\nParse tree cannot be viewed. " +
                                    "There where parse errors." );
        }
    }
    
    return err_cnt;
}

});




