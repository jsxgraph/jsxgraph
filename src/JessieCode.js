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


JXG.JessieCode = function(code) {
    // Control structures
    // scope stack
    this.sstack = [{}];
    this.scope = 0;
    // parameter stack
    this.pstack = [[]];
    this.pscope = 0;

    // properties stack
    this.propstack = [{}];
    this.propscope = 0;

    // array access list stack
    this.aalstack = [[]];
    this.aalscope = 0;

    // property object, if a property is set, the last object is saved and re-used, if there is no object given
    this.propobj = 0;

    // save left-hand-side of variable assignment
    this.lhs = [];

    // board currently in use
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

    _debug: function (log) {
        if(typeof console !== "undefined") {
            console.log(log);
        } else if(document.getElementById('debug') !== null) {
            document.getElementById('debug').innerHTML += log + '<br />';
        }
    },

    _error: function (msg) {
        throw new Error(msg);
    },

    letvar: function (vname, value) {
        this.sstack[this.scope][vname] = value;
    },

    getvar: function (vname) {
        var s;

        for (s = this.scope; s > -1; s--) {
            if (JXG.exists(this.sstack[s][vname])) {
                return this.sstack[s][vname];
            }
        }

        s = JXG.getRef(this.board, vname);
        if (s !== vname) {
            return s;
        }

        return 0;
    },

    parse: function (code) {
        var error_cnt = 0,
            error_off = [],
            error_la = [],
            ccode = code.split('\n'), i, cleaned = [];

        for (i = 0; i < ccode.length; i++) {
            if (!(JXG.trim(ccode[i])[0] === '/' && JXG.trim(ccode[i])[1] === '/')) {
                cleaned.push(ccode[i]);
            }
        }
        code = cleaned.join('\n');

        if((error_cnt = this._parse(code, error_off, error_la)) > 0) {
            for(i = 0; i < error_cnt; i++)
                alert("Parse error near >"  + code.substr( error_off[i], 30 ) + "<, expecting \"" + error_la[i].join() + "\"");
        }
    },

    snippet: function (code, funwrap, varname) {
        var vname, c, tmp, result;

        vname = 'jxg__tmp__intern_' + JXG.Util.genUUID().replace(/\-/g, '');

        if (!JXG.exists(funwrap)) {
            funwrap = true;
        }

        if (!JXG.exists(varname)) {
            varname = '';
        }

        // just in case...
        tmp = this.sstack[0][vname];

        c = vname + ' = ' + (funwrap ? ' function (' + varname + ') { return ' : '') + code + (funwrap ? '; }' : '') + ';';
        this.parse(c);

        result = this.sstack[0][vname];
        if (JXG.exists(tmp)) {
            this.sstack[0][vname] = tmp;
        } else {
            delete this.sstack[0][vname];
        }

        return result;
    },

    execute: function (node) {
        var ret, v, i, parents = [], par = {};

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
                        this.lhs[this.scope] = node.children[0];
                        this.letvar(node.children[0], this.execute(node.children[1]));
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
                    case 'op_for':
                        // todo
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
                            for(r = 0; r < _pstack.length; r++)
                                that.sstack[that.scope][_pstack[r]] = arguments[r];

                            r = that.execute(node.children[1]);

                            that.sstack.pop();
                            that.scope--;
                            return r;
                        }; })(this.pstack[this.pscope], this);

                        ret.functionCode = node.children[1];

                        this.pstack.pop();
                        this.pscope--;
                        break;
                    case 'op_execfun':
                        // node.children:
                        //   [0]: Name of the function
                        //   [1]: Parameter list as a parse subtree
                        //   [2]: Properties, only used in case of a create function
                        var fun, props, attr;

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
                        fun = this.getvar(node.children[0]);

                        // check for the function in the variable table
                        if(JXG.exists(fun) && typeof fun === 'function') {
                            for(i = 0; i < this.pstack[this.pscope].length; i++) {
                                parents[i] = this.execute(this.pstack[this.pscope][i]);
                            }
                            ret = fun.apply(this, parents);

                            // check for an element with this name
                        } else if (node.children[0] in JXG.JSXGraph.elements) {
                            for(i = 0; i < this.pstack[this.pscope].length; i++) {
                                if (node.children[0] === 'point' || node.children[0] === 'text') {
                                    if (this.pstack[this.pscope][i].type === 'node_const' || (this.pstack[this.pscope][i].value === 'op_neg' && this.pstack[this.pscope][i].children[0].type === 'node_const')) {
                                        parents[i] = (this.execute(this.pstack[this.pscope][i]));
                                    } else {
                                        parents[i] = ((function(stree, that) {
                                            return function() {
                                                return that.execute(stree)
                                            };
                                        })(this.pstack[this.pscope][i], this));
                                    }
                                } else {
                                    parents[i] = (this.execute(this.pstack[this.pscope][i]));
                                }
                            }

                            if (props) {
                                attr = this.propstack[this.propscope];
                            } else {
                                attr = {name: (this.lhs[this.scope] !== 0 ? this.lhs[this.scope] : '')};
                            }

                            ret = this.board.create(node.children[0], parents, attr);

                            // nothing found, throw an error
                            // todo: check for a valid identifier and appropriate parameters and create a point
                            //       this resembles the legacy JessieScript behaviour of A(1, 2);
                        } else if (typeof Math[node.children[0].toLowerCase()] !== 'undefined') {
                            for(i = 0; i < this.pstack[this.pscope].length; i++) {
                                parents[i] = this.execute(this.pstack[this.pscope][i]);
                            }
                            ret = Math[node.children[0].toLowerCase()].apply(this, parents);
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
                        var e = this.getvar(node.children[0]);

                        v = this.execute(node.children[2]);

                        this.propobj = e;
                        par[node.children[1]] = v;
                        e.setProperty(par);
                        break;
                    case 'op_method':
                        v = this.getvar(node.children[0]);

                        this.pstack.push([]);
                        this.pscope++;

                        this.execute(node.children[2]);

                        for(i = 0; i < this.pstack[this.pscope].length; i++) {
                            parents[i] = (this.execute(this.pstack[this.pscope][i]));
                        }

                        if (typeof v[node.children[1]] === 'function') {
                            v[node.children[1]].apply(v, parents);
                        } else {
                            this._error('Error: "' + node.children[0] + '" has no method "' + node.children[1] + '".');
                        }

                        this.pstack.pop();
                        this.pscope--;
                        break;
                    case 'op_propnoob':
                        v = this.execute(node.children[1]);

                        if (this.propobj === 0) {
                            this._error('Object <null> not found.');
                        } else {
                            par[node.children[0]] = v;
                            this.propobj.setProperty(par);
                        }
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
                    case 'op_neg':
                        ret = this.execute(node.children[0]) * -1;
                        break;
                }
                break;

            case 'node_property':
                v = this.getvar(node.value);

                ret = v.getProperty(node.children[0]);
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

            case 'node_method':
                v = this.getvar(node.children[0]);

                switch (node.value) {
                    case 'x':
                        if (v === 0) {
                            this._error(node.children[0] + ' is undefined.');
                            ret = NaN;
                        } else if (!JXG.exists(v.X)) {
                            this._error(node.children[0] + ' has no property \'X\'.');
                            ret = NaN;
                        } else {
                            ret = v.X();
                        }
                        break;
                    case 'y':
                        if (v === 0) {
                            this._error(node.children[0] + ' is undefined.');
                            ret = NaN;
                        } else if (!JXG.exists(v.Y)) {
                            this._error(node.children[0] + ' has no property \'Y\'.');
                            ret = NaN;
                        } else
                            ret = v.Y();
                        break;
                }
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

});
/*
    Default template driver for JS/CC generated parsers running as
    browser-based JavaScript/ECMAScript applications.
    
    WARNING:     This parser template will only run together with JSXGraph on a website.
    
    Features:
    - Parser trace messages
    - Integrated panic-mode error recovery
    
    Written 2007, 2008 by Jan Max Meyer, J.M.K S.F. Software Technologies
    
    This is in the public domain.
*/


JXG.extend(JXG.JessieCode.prototype, /** @lends JXG.JessieCode.prototype */ {
    _dbg_withtrace: false,
    _dbg_string: '',

    _dbg_print: function (text) {
        this._dbg_string += text + "\n";
    },

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
                return 56;
            }

            do {

switch( state )
{
	case 0:
		if( ( info.src.charCodeAt( pos ) >= 9 && info.src.charCodeAt( pos ) <= 10 ) || info.src.charCodeAt( pos ) == 13 || info.src.charCodeAt( pos ) == 32 ) state = 1;
		else if( info.src.charCodeAt( pos ) == 35 ) state = 2;
		else if( info.src.charCodeAt( pos ) == 40 ) state = 3;
		else if( info.src.charCodeAt( pos ) == 41 ) state = 4;
		else if( info.src.charCodeAt( pos ) == 42 ) state = 5;
		else if( info.src.charCodeAt( pos ) == 43 ) state = 6;
		else if( info.src.charCodeAt( pos ) == 44 ) state = 7;
		else if( info.src.charCodeAt( pos ) == 45 ) state = 8;
		else if( info.src.charCodeAt( pos ) == 46 ) state = 9;
		else if( info.src.charCodeAt( pos ) == 47 ) state = 10;
		else if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) ) state = 11;
		else if( info.src.charCodeAt( pos ) == 58 ) state = 12;
		else if( info.src.charCodeAt( pos ) == 59 ) state = 13;
		else if( info.src.charCodeAt( pos ) == 60 ) state = 14;
		else if( info.src.charCodeAt( pos ) == 61 ) state = 15;
		else if( info.src.charCodeAt( pos ) == 62 ) state = 16;
		else if( ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 67 ) || ( info.src.charCodeAt( pos ) >= 71 && info.src.charCodeAt( pos ) <= 72 ) || ( info.src.charCodeAt( pos ) >= 74 && info.src.charCodeAt( pos ) <= 81 ) || info.src.charCodeAt( pos ) == 83 || info.src.charCodeAt( pos ) == 86 || info.src.charCodeAt( pos ) == 90 || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 99 ) || ( info.src.charCodeAt( pos ) >= 103 && info.src.charCodeAt( pos ) <= 104 ) || ( info.src.charCodeAt( pos ) >= 106 && info.src.charCodeAt( pos ) <= 113 ) || info.src.charCodeAt( pos ) == 115 || info.src.charCodeAt( pos ) == 118 || ( info.src.charCodeAt( pos ) >= 120 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 88 ) state = 18;
		else if( info.src.charCodeAt( pos ) == 89 ) state = 19;
		else if( info.src.charCodeAt( pos ) == 91 ) state = 20;
		else if( info.src.charCodeAt( pos ) == 93 ) state = 21;
		else if( info.src.charCodeAt( pos ) == 123 ) state = 22;
		else if( info.src.charCodeAt( pos ) == 124 ) state = 23;
		else if( info.src.charCodeAt( pos ) == 125 ) state = 24;
		else if( info.src.charCodeAt( pos ) == 33 ) state = 43;
		else if( info.src.charCodeAt( pos ) == 68 || info.src.charCodeAt( pos ) == 100 ) state = 44;
		else if( info.src.charCodeAt( pos ) == 39 ) state = 45;
		else if( info.src.charCodeAt( pos ) == 73 || info.src.charCodeAt( pos ) == 105 ) state = 46;
		else if( info.src.charCodeAt( pos ) == 85 || info.src.charCodeAt( pos ) == 117 ) state = 55;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 63;
		else if( info.src.charCodeAt( pos ) == 84 || info.src.charCodeAt( pos ) == 116 ) state = 64;
		else if( info.src.charCodeAt( pos ) == 70 || info.src.charCodeAt( pos ) == 102 ) state = 70;
		else if( info.src.charCodeAt( pos ) == 87 || info.src.charCodeAt( pos ) == 119 ) state = 71;
		else if( info.src.charCodeAt( pos ) == 82 || info.src.charCodeAt( pos ) == 114 ) state = 75;
		else state = -1;
		break;

	case 1:
		state = -1;
		match = 1;
		match_pos = pos;
		break;

	case 2:
		state = -1;
		match = 35;
		match_pos = pos;
		break;

	case 3:
		state = -1;
		match = 33;
		match_pos = pos;
		break;

	case 4:
		state = -1;
		match = 34;
		match_pos = pos;
		break;

	case 5:
		state = -1;
		match = 31;
		match_pos = pos;
		break;

	case 6:
		state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 7:
		state = -1;
		match = 32;
		match_pos = pos;
		break;

	case 8:
		state = -1;
		match = 29;
		match_pos = pos;
		break;

	case 9:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) ) state = 27;
		else state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 10:
		state = -1;
		match = 30;
		match_pos = pos;
		break;

	case 11:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) ) state = 11;
		else if( info.src.charCodeAt( pos ) == 46 ) state = 27;
		else state = -1;
		match = 41;
		match_pos = pos;
		break;

	case 12:
		state = -1;
		match = 36;
		match_pos = pos;
		break;

	case 13:
		state = -1;
		match = 20;
		match_pos = pos;
		break;

	case 14:
		if( info.src.charCodeAt( pos ) == 60 ) state = 28;
		else if( info.src.charCodeAt( pos ) == 61 ) state = 29;
		else state = -1;
		match = 27;
		match_pos = pos;
		break;

	case 15:
		if( info.src.charCodeAt( pos ) == 61 ) state = 30;
		else state = -1;
		match = 21;
		match_pos = pos;
		break;

	case 16:
		if( info.src.charCodeAt( pos ) == 61 ) state = 31;
		else if( info.src.charCodeAt( pos ) == 62 ) state = 32;
		else state = -1;
		match = 26;
		match_pos = pos;
		break;

	case 17:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 18:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else state = -1;
		match = 12;
		match_pos = pos;
		break;

	case 19:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else state = -1;
		match = 13;
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
		match = 18;
		match_pos = pos;
		break;

	case 23:
		state = -1;
		match = 37;
		match_pos = pos;
		break;

	case 24:
		state = -1;
		match = 19;
		match_pos = pos;
		break;

	case 25:
		state = -1;
		match = 23;
		match_pos = pos;
		break;

	case 26:
		if( info.src.charCodeAt( pos ) == 39 ) state = 45;
		else state = -1;
		match = 40;
		match_pos = pos;
		break;

	case 27:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) ) state = 27;
		else state = -1;
		match = 42;
		match_pos = pos;
		break;

	case 28:
		state = -1;
		match = 14;
		match_pos = pos;
		break;

	case 29:
		state = -1;
		match = 24;
		match_pos = pos;
		break;

	case 30:
		state = -1;
		match = 22;
		match_pos = pos;
		break;

	case 31:
		state = -1;
		match = 25;
		match_pos = pos;
		break;

	case 32:
		state = -1;
		match = 15;
		match_pos = pos;
		break;

	case 33:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else state = -1;
		match = 5;
		match_pos = pos;
		break;

	case 34:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else state = -1;
		match = 2;
		match_pos = pos;
		break;

	case 35:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else state = -1;
		match = 7;
		match_pos = pos;
		break;

	case 36:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else state = -1;
		match = 3;
		match_pos = pos;
		break;

	case 37:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else state = -1;
		match = 9;
		match_pos = pos;
		break;

	case 38:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else state = -1;
		match = 10;
		match_pos = pos;
		break;

	case 39:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else state = -1;
		match = 4;
		match_pos = pos;
		break;

	case 40:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else state = -1;
		match = 11;
		match_pos = pos;
		break;

	case 41:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else state = -1;
		match = 8;
		match_pos = pos;
		break;

	case 42:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else state = -1;
		match = 6;
		match_pos = pos;
		break;

	case 43:
		if( info.src.charCodeAt( pos ) == 61 ) state = 25;
		else state = -1;
		break;

	case 44:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 68 ) || ( info.src.charCodeAt( pos ) >= 70 && info.src.charCodeAt( pos ) <= 78 ) || ( info.src.charCodeAt( pos ) >= 80 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 110 ) || ( info.src.charCodeAt( pos ) >= 112 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 79 || info.src.charCodeAt( pos ) == 111 ) state = 33;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 72;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 45:
		if( info.src.charCodeAt( pos ) == 39 ) state = 26;
		else if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 38 ) || ( info.src.charCodeAt( pos ) >= 40 && info.src.charCodeAt( pos ) <= 254 ) ) state = 45;
		else state = -1;
		break;

	case 46:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 69 ) || ( info.src.charCodeAt( pos ) >= 71 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 101 ) || ( info.src.charCodeAt( pos ) >= 103 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 70 || info.src.charCodeAt( pos ) == 102 ) state = 34;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 47:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 68 ) || ( info.src.charCodeAt( pos ) >= 70 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 35;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 48:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 68 ) || ( info.src.charCodeAt( pos ) >= 70 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 36;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 49:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 68 ) || ( info.src.charCodeAt( pos ) >= 70 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 37;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 50:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 68 ) || ( info.src.charCodeAt( pos ) >= 70 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 38;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 51:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 68 ) || ( info.src.charCodeAt( pos ) >= 70 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 39;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 52:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 68 ) || ( info.src.charCodeAt( pos ) >= 70 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 40;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 53:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 77 ) || ( info.src.charCodeAt( pos ) >= 79 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 109 ) || ( info.src.charCodeAt( pos ) >= 111 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 78 || info.src.charCodeAt( pos ) == 110 ) state = 41;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 54:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 77 ) || ( info.src.charCodeAt( pos ) >= 79 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 109 ) || ( info.src.charCodeAt( pos ) >= 111 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 78 || info.src.charCodeAt( pos ) == 110 ) state = 42;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 55:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 82 ) || ( info.src.charCodeAt( pos ) >= 84 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 114 ) || ( info.src.charCodeAt( pos ) >= 116 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 83 || info.src.charCodeAt( pos ) == 115 ) state = 47;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 56:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 82 ) || ( info.src.charCodeAt( pos ) >= 84 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 114 ) || ( info.src.charCodeAt( pos ) >= 116 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 83 || info.src.charCodeAt( pos ) == 115 ) state = 48;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 57:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 84 ) || ( info.src.charCodeAt( pos ) >= 86 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 116 ) || ( info.src.charCodeAt( pos ) >= 118 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 85 || info.src.charCodeAt( pos ) == 117 ) state = 49;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 58:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 82 ) || ( info.src.charCodeAt( pos ) >= 84 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 114 ) || ( info.src.charCodeAt( pos ) >= 116 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 83 || info.src.charCodeAt( pos ) == 115 ) state = 50;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 59:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 75 ) || ( info.src.charCodeAt( pos ) >= 77 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 107 ) || ( info.src.charCodeAt( pos ) >= 109 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 76 || info.src.charCodeAt( pos ) == 108 ) state = 51;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 60:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 83 ) || ( info.src.charCodeAt( pos ) >= 85 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 115 ) || ( info.src.charCodeAt( pos ) >= 117 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 84 || info.src.charCodeAt( pos ) == 116 ) state = 52;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 61:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 81 ) || ( info.src.charCodeAt( pos ) >= 83 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 113 ) || ( info.src.charCodeAt( pos ) >= 115 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 82 || info.src.charCodeAt( pos ) == 114 ) state = 53;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 62:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 78 ) || ( info.src.charCodeAt( pos ) >= 80 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 110 ) || ( info.src.charCodeAt( pos ) >= 112 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 79 || info.src.charCodeAt( pos ) == 111 ) state = 54;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 63:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 75 ) || ( info.src.charCodeAt( pos ) >= 77 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 107 ) || ( info.src.charCodeAt( pos ) >= 109 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 76 || info.src.charCodeAt( pos ) == 108 ) state = 56;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 64:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 81 ) || ( info.src.charCodeAt( pos ) >= 83 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 113 ) || ( info.src.charCodeAt( pos ) >= 115 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 82 || info.src.charCodeAt( pos ) == 114 ) state = 57;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 65:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 75 ) || ( info.src.charCodeAt( pos ) >= 77 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 107 ) || ( info.src.charCodeAt( pos ) >= 109 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 76 || info.src.charCodeAt( pos ) == 108 ) state = 58;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 66:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 72 ) || ( info.src.charCodeAt( pos ) >= 74 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 104 ) || ( info.src.charCodeAt( pos ) >= 106 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 73 || info.src.charCodeAt( pos ) == 105 ) state = 59;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 67:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 68 ) || ( info.src.charCodeAt( pos ) >= 70 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 60;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 68:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 84 ) || ( info.src.charCodeAt( pos ) >= 86 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 116 ) || ( info.src.charCodeAt( pos ) >= 118 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 85 || info.src.charCodeAt( pos ) == 117 ) state = 61;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 69:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 72 ) || ( info.src.charCodeAt( pos ) >= 74 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 104 ) || ( info.src.charCodeAt( pos ) >= 106 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 73 || info.src.charCodeAt( pos ) == 105 ) state = 62;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 70:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 66 && info.src.charCodeAt( pos ) <= 84 ) || ( info.src.charCodeAt( pos ) >= 86 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 98 && info.src.charCodeAt( pos ) <= 116 ) || ( info.src.charCodeAt( pos ) >= 118 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 65 || info.src.charCodeAt( pos ) == 97 ) state = 65;
		else if( info.src.charCodeAt( pos ) == 85 || info.src.charCodeAt( pos ) == 117 ) state = 77;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 71:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 71 ) || ( info.src.charCodeAt( pos ) >= 73 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 103 ) || ( info.src.charCodeAt( pos ) >= 105 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 72 || info.src.charCodeAt( pos ) == 104 ) state = 66;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 72:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 75 ) || ( info.src.charCodeAt( pos ) >= 77 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 107 ) || ( info.src.charCodeAt( pos ) >= 109 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 76 || info.src.charCodeAt( pos ) == 108 ) state = 67;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 73:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 83 ) || ( info.src.charCodeAt( pos ) >= 85 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 115 ) || ( info.src.charCodeAt( pos ) >= 117 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 84 || info.src.charCodeAt( pos ) == 116 ) state = 68;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 74:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 83 ) || ( info.src.charCodeAt( pos ) >= 85 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 115 ) || ( info.src.charCodeAt( pos ) >= 117 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 84 || info.src.charCodeAt( pos ) == 116 ) state = 69;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 75:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 68 ) || ( info.src.charCodeAt( pos ) >= 70 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || ( info.src.charCodeAt( pos ) >= 102 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 73;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 76:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 66 ) || ( info.src.charCodeAt( pos ) >= 68 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 98 ) || ( info.src.charCodeAt( pos ) >= 100 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 67 || info.src.charCodeAt( pos ) == 99 ) state = 74;
		else state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 77:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 77 ) || ( info.src.charCodeAt( pos ) >= 79 && info.src.charCodeAt( pos ) <= 90 ) || info.src.charCodeAt( pos ) == 95 || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 109 ) || ( info.src.charCodeAt( pos ) >= 111 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
		else if( info.src.charCodeAt( pos ) == 78 || info.src.charCodeAt( pos ) == 110 ) state = 76;
		else state = -1;
		match = 39;
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
	case 40:
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
	new Array( 43/* Program */, 2 ),
	new Array( 43/* Program */, 0 ),
	new Array( 45/* Stmt_List */, 2 ),
	new Array( 45/* Stmt_List */, 0 ),
	new Array( 46/* Param_List */, 3 ),
	new Array( 46/* Param_List */, 1 ),
	new Array( 48/* Prop_List */, 3 ),
	new Array( 48/* Prop_List */, 1 ),
	new Array( 48/* Prop_List */, 0 ),
	new Array( 49/* Prop */, 3 ),
	new Array( 50/* Param_Def_List */, 3 ),
	new Array( 50/* Param_Def_List */, 1 ),
	new Array( 50/* Param_Def_List */, 0 ),
	new Array( 44/* Stmt */, 3 ),
	new Array( 44/* Stmt */, 5 ),
	new Array( 44/* Stmt */, 3 ),
	new Array( 44/* Stmt */, 5 ),
	new Array( 44/* Stmt */, 3 ),
	new Array( 44/* Stmt */, 2 ),
	new Array( 44/* Stmt */, 2 ),
	new Array( 44/* Stmt */, 4 ),
	new Array( 44/* Stmt */, 6 ),
	new Array( 44/* Stmt */, 5 ),
	new Array( 44/* Stmt */, 2 ),
	new Array( 44/* Stmt */, 3 ),
	new Array( 44/* Stmt */, 1 ),
	new Array( 47/* Expression */, 3 ),
	new Array( 47/* Expression */, 3 ),
	new Array( 47/* Expression */, 3 ),
	new Array( 47/* Expression */, 3 ),
	new Array( 47/* Expression */, 3 ),
	new Array( 47/* Expression */, 3 ),
	new Array( 47/* Expression */, 1 ),
	new Array( 51/* AddSubExp */, 3 ),
	new Array( 51/* AddSubExp */, 3 ),
	new Array( 51/* AddSubExp */, 1 ),
	new Array( 52/* MulDivExp */, 3 ),
	new Array( 52/* MulDivExp */, 3 ),
	new Array( 52/* MulDivExp */, 1 ),
	new Array( 53/* NegExp */, 2 ),
	new Array( 53/* NegExp */, 1 ),
	new Array( 54/* ExtValue */, 4 ),
	new Array( 54/* ExtValue */, 1 ),
	new Array( 55/* Value */, 1 ),
	new Array( 55/* Value */, 1 ),
	new Array( 55/* Value */, 1 ),
	new Array( 55/* Value */, 3 ),
	new Array( 55/* Value */, 1 ),
	new Array( 55/* Value */, 4 ),
	new Array( 55/* Value */, 7 ),
	new Array( 55/* Value */, 7 ),
	new Array( 55/* Value */, 4 ),
	new Array( 55/* Value */, 4 ),
	new Array( 55/* Value */, 3 ),
	new Array( 55/* Value */, 6 ),
	new Array( 55/* Value */, 3 ),
	new Array( 55/* Value */, 3 ),
	new Array( 55/* Value */, 1 ),
	new Array( 55/* Value */, 1 )
);

/* Action-Table */
var act_tab = new Array(
	/* State 0 */ new Array( 56/* "$" */,-2 , 2/* "IF" */,-2 , 4/* "WHILE" */,-2 , 5/* "DO" */,-2 , 7/* "USE" */,-2 , 11/* "DELETE" */,-2 , 8/* "RETURN" */,-2 , 39/* "Identifier" */,-2 , 38/* "." */,-2 , 18/* "{" */,-2 , 20/* ";" */,-2 , 29/* "-" */,-2 , 41/* "Integer" */,-2 , 42/* "Float" */,-2 , 33/* "(" */,-2 , 40/* "String" */,-2 , 6/* "FUNCTION" */,-2 , 12/* "X" */,-2 , 13/* "Y" */,-2 , 14/* "<<" */,-2 , 16/* "[" */,-2 , 9/* "TRUE" */,-2 , 10/* "FALSE" */,-2 ),
	/* State 1 */ new Array( 2/* "IF" */,3 , 4/* "WHILE" */,4 , 5/* "DO" */,5 , 7/* "USE" */,6 , 11/* "DELETE" */,7 , 8/* "RETURN" */,8 , 39/* "Identifier" */,9 , 38/* "." */,10 , 18/* "{" */,12 , 20/* ";" */,13 , 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 , 56/* "$" */,0 ),
	/* State 2 */ new Array( 56/* "$" */,-1 , 2/* "IF" */,-1 , 4/* "WHILE" */,-1 , 5/* "DO" */,-1 , 7/* "USE" */,-1 , 11/* "DELETE" */,-1 , 8/* "RETURN" */,-1 , 39/* "Identifier" */,-1 , 38/* "." */,-1 , 18/* "{" */,-1 , 20/* ";" */,-1 , 29/* "-" */,-1 , 41/* "Integer" */,-1 , 42/* "Float" */,-1 , 33/* "(" */,-1 , 40/* "String" */,-1 , 6/* "FUNCTION" */,-1 , 12/* "X" */,-1 , 13/* "Y" */,-1 , 14/* "<<" */,-1 , 16/* "[" */,-1 , 9/* "TRUE" */,-1 , 10/* "FALSE" */,-1 ),
	/* State 3 */ new Array( 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 39/* "Identifier" */,32 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 4 */ new Array( 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 39/* "Identifier" */,32 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 5 */ new Array( 2/* "IF" */,3 , 4/* "WHILE" */,4 , 5/* "DO" */,5 , 7/* "USE" */,6 , 11/* "DELETE" */,7 , 8/* "RETURN" */,8 , 39/* "Identifier" */,9 , 38/* "." */,10 , 18/* "{" */,12 , 20/* ";" */,13 , 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 6 */ new Array( 39/* "Identifier" */,35 ),
	/* State 7 */ new Array( 39/* "Identifier" */,36 ),
	/* State 8 */ new Array( 2/* "IF" */,3 , 4/* "WHILE" */,4 , 5/* "DO" */,5 , 7/* "USE" */,6 , 11/* "DELETE" */,7 , 8/* "RETURN" */,8 , 39/* "Identifier" */,9 , 38/* "." */,10 , 18/* "{" */,12 , 20/* ";" */,13 , 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 9 */ new Array( 38/* "." */,38 , 33/* "(" */,39 , 21/* "=" */,40 , 20/* ";" */,-46 , 22/* "==" */,-46 , 27/* "<" */,-46 , 26/* ">" */,-46 , 24/* "<=" */,-46 , 25/* ">=" */,-46 , 23/* "!=" */,-46 , 29/* "-" */,-46 , 28/* "+" */,-46 , 31/* "*" */,-46 , 30/* "/" */,-46 , 16/* "[" */,-46 ),
	/* State 10 */ new Array( 39/* "Identifier" */,41 ),
	/* State 11 */ new Array( 23/* "!=" */,42 , 25/* ">=" */,43 , 24/* "<=" */,44 , 26/* ">" */,45 , 27/* "<" */,46 , 22/* "==" */,47 , 20/* ";" */,48 ),
	/* State 12 */ new Array( 19/* "}" */,-4 , 2/* "IF" */,-4 , 4/* "WHILE" */,-4 , 5/* "DO" */,-4 , 7/* "USE" */,-4 , 11/* "DELETE" */,-4 , 8/* "RETURN" */,-4 , 39/* "Identifier" */,-4 , 38/* "." */,-4 , 18/* "{" */,-4 , 20/* ";" */,-4 , 29/* "-" */,-4 , 41/* "Integer" */,-4 , 42/* "Float" */,-4 , 33/* "(" */,-4 , 40/* "String" */,-4 , 6/* "FUNCTION" */,-4 , 12/* "X" */,-4 , 13/* "Y" */,-4 , 14/* "<<" */,-4 , 16/* "[" */,-4 , 9/* "TRUE" */,-4 , 10/* "FALSE" */,-4 ),
	/* State 13 */ new Array( 56/* "$" */,-26 , 2/* "IF" */,-26 , 4/* "WHILE" */,-26 , 5/* "DO" */,-26 , 7/* "USE" */,-26 , 11/* "DELETE" */,-26 , 8/* "RETURN" */,-26 , 39/* "Identifier" */,-26 , 38/* "." */,-26 , 18/* "{" */,-26 , 20/* ";" */,-26 , 29/* "-" */,-26 , 41/* "Integer" */,-26 , 42/* "Float" */,-26 , 33/* "(" */,-26 , 40/* "String" */,-26 , 6/* "FUNCTION" */,-26 , 12/* "X" */,-26 , 13/* "Y" */,-26 , 14/* "<<" */,-26 , 16/* "[" */,-26 , 9/* "TRUE" */,-26 , 10/* "FALSE" */,-26 , 3/* "ELSE" */,-26 , 19/* "}" */,-26 ),
	/* State 14 */ new Array( 28/* "+" */,50 , 29/* "-" */,51 , 20/* ";" */,-33 , 22/* "==" */,-33 , 27/* "<" */,-33 , 26/* ">" */,-33 , 24/* "<=" */,-33 , 25/* ">=" */,-33 , 23/* "!=" */,-33 , 2/* "IF" */,-33 , 4/* "WHILE" */,-33 , 5/* "DO" */,-33 , 7/* "USE" */,-33 , 11/* "DELETE" */,-33 , 8/* "RETURN" */,-33 , 39/* "Identifier" */,-33 , 38/* "." */,-33 , 18/* "{" */,-33 , 41/* "Integer" */,-33 , 42/* "Float" */,-33 , 33/* "(" */,-33 , 40/* "String" */,-33 , 6/* "FUNCTION" */,-33 , 12/* "X" */,-33 , 13/* "Y" */,-33 , 14/* "<<" */,-33 , 16/* "[" */,-33 , 9/* "TRUE" */,-33 , 10/* "FALSE" */,-33 , 34/* ")" */,-33 , 17/* "]" */,-33 , 32/* "," */,-33 , 15/* ">>" */,-33 ),
	/* State 15 */ new Array( 30/* "/" */,52 , 31/* "*" */,53 , 20/* ";" */,-36 , 22/* "==" */,-36 , 27/* "<" */,-36 , 26/* ">" */,-36 , 24/* "<=" */,-36 , 25/* ">=" */,-36 , 23/* "!=" */,-36 , 29/* "-" */,-36 , 28/* "+" */,-36 , 2/* "IF" */,-36 , 4/* "WHILE" */,-36 , 5/* "DO" */,-36 , 7/* "USE" */,-36 , 11/* "DELETE" */,-36 , 8/* "RETURN" */,-36 , 39/* "Identifier" */,-36 , 38/* "." */,-36 , 18/* "{" */,-36 , 41/* "Integer" */,-36 , 42/* "Float" */,-36 , 33/* "(" */,-36 , 40/* "String" */,-36 , 6/* "FUNCTION" */,-36 , 12/* "X" */,-36 , 13/* "Y" */,-36 , 14/* "<<" */,-36 , 16/* "[" */,-36 , 9/* "TRUE" */,-36 , 10/* "FALSE" */,-36 , 34/* ")" */,-36 , 17/* "]" */,-36 , 32/* "," */,-36 , 15/* ">>" */,-36 ),
	/* State 16 */ new Array( 20/* ";" */,-39 , 22/* "==" */,-39 , 27/* "<" */,-39 , 26/* ">" */,-39 , 24/* "<=" */,-39 , 25/* ">=" */,-39 , 23/* "!=" */,-39 , 29/* "-" */,-39 , 28/* "+" */,-39 , 31/* "*" */,-39 , 30/* "/" */,-39 , 2/* "IF" */,-39 , 4/* "WHILE" */,-39 , 5/* "DO" */,-39 , 7/* "USE" */,-39 , 11/* "DELETE" */,-39 , 8/* "RETURN" */,-39 , 39/* "Identifier" */,-39 , 38/* "." */,-39 , 18/* "{" */,-39 , 41/* "Integer" */,-39 , 42/* "Float" */,-39 , 33/* "(" */,-39 , 40/* "String" */,-39 , 6/* "FUNCTION" */,-39 , 12/* "X" */,-39 , 13/* "Y" */,-39 , 14/* "<<" */,-39 , 16/* "[" */,-39 , 9/* "TRUE" */,-39 , 10/* "FALSE" */,-39 , 34/* ")" */,-39 , 17/* "]" */,-39 , 32/* "," */,-39 , 15/* ">>" */,-39 ),
	/* State 17 */ new Array( 41/* "Integer" */,20 , 42/* "Float" */,21 , 39/* "Identifier" */,32 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 18 */ new Array( 16/* "[" */,55 , 20/* ";" */,-41 , 22/* "==" */,-41 , 27/* "<" */,-41 , 26/* ">" */,-41 , 24/* "<=" */,-41 , 25/* ">=" */,-41 , 23/* "!=" */,-41 , 29/* "-" */,-41 , 28/* "+" */,-41 , 31/* "*" */,-41 , 30/* "/" */,-41 , 2/* "IF" */,-41 , 4/* "WHILE" */,-41 , 5/* "DO" */,-41 , 7/* "USE" */,-41 , 11/* "DELETE" */,-41 , 8/* "RETURN" */,-41 , 39/* "Identifier" */,-41 , 38/* "." */,-41 , 18/* "{" */,-41 , 41/* "Integer" */,-41 , 42/* "Float" */,-41 , 33/* "(" */,-41 , 40/* "String" */,-41 , 6/* "FUNCTION" */,-41 , 12/* "X" */,-41 , 13/* "Y" */,-41 , 14/* "<<" */,-41 , 9/* "TRUE" */,-41 , 10/* "FALSE" */,-41 , 34/* ")" */,-41 , 17/* "]" */,-41 , 32/* "," */,-41 , 15/* ">>" */,-41 ),
	/* State 19 */ new Array( 20/* ";" */,-43 , 22/* "==" */,-43 , 27/* "<" */,-43 , 26/* ">" */,-43 , 24/* "<=" */,-43 , 25/* ">=" */,-43 , 23/* "!=" */,-43 , 29/* "-" */,-43 , 28/* "+" */,-43 , 31/* "*" */,-43 , 30/* "/" */,-43 , 16/* "[" */,-43 , 2/* "IF" */,-43 , 4/* "WHILE" */,-43 , 5/* "DO" */,-43 , 7/* "USE" */,-43 , 11/* "DELETE" */,-43 , 8/* "RETURN" */,-43 , 39/* "Identifier" */,-43 , 38/* "." */,-43 , 18/* "{" */,-43 , 41/* "Integer" */,-43 , 42/* "Float" */,-43 , 33/* "(" */,-43 , 40/* "String" */,-43 , 6/* "FUNCTION" */,-43 , 12/* "X" */,-43 , 13/* "Y" */,-43 , 14/* "<<" */,-43 , 9/* "TRUE" */,-43 , 10/* "FALSE" */,-43 , 34/* ")" */,-43 , 17/* "]" */,-43 , 32/* "," */,-43 , 15/* ">>" */,-43 ),
	/* State 20 */ new Array( 20/* ";" */,-44 , 22/* "==" */,-44 , 27/* "<" */,-44 , 26/* ">" */,-44 , 24/* "<=" */,-44 , 25/* ">=" */,-44 , 23/* "!=" */,-44 , 29/* "-" */,-44 , 28/* "+" */,-44 , 31/* "*" */,-44 , 30/* "/" */,-44 , 16/* "[" */,-44 , 2/* "IF" */,-44 , 4/* "WHILE" */,-44 , 5/* "DO" */,-44 , 7/* "USE" */,-44 , 11/* "DELETE" */,-44 , 8/* "RETURN" */,-44 , 39/* "Identifier" */,-44 , 38/* "." */,-44 , 18/* "{" */,-44 , 41/* "Integer" */,-44 , 42/* "Float" */,-44 , 33/* "(" */,-44 , 40/* "String" */,-44 , 6/* "FUNCTION" */,-44 , 12/* "X" */,-44 , 13/* "Y" */,-44 , 14/* "<<" */,-44 , 9/* "TRUE" */,-44 , 10/* "FALSE" */,-44 , 34/* ")" */,-44 , 17/* "]" */,-44 , 32/* "," */,-44 , 15/* ">>" */,-44 ),
	/* State 21 */ new Array( 20/* ";" */,-45 , 22/* "==" */,-45 , 27/* "<" */,-45 , 26/* ">" */,-45 , 24/* "<=" */,-45 , 25/* ">=" */,-45 , 23/* "!=" */,-45 , 29/* "-" */,-45 , 28/* "+" */,-45 , 31/* "*" */,-45 , 30/* "/" */,-45 , 16/* "[" */,-45 , 2/* "IF" */,-45 , 4/* "WHILE" */,-45 , 5/* "DO" */,-45 , 7/* "USE" */,-45 , 11/* "DELETE" */,-45 , 8/* "RETURN" */,-45 , 39/* "Identifier" */,-45 , 38/* "." */,-45 , 18/* "{" */,-45 , 41/* "Integer" */,-45 , 42/* "Float" */,-45 , 33/* "(" */,-45 , 40/* "String" */,-45 , 6/* "FUNCTION" */,-45 , 12/* "X" */,-45 , 13/* "Y" */,-45 , 14/* "<<" */,-45 , 9/* "TRUE" */,-45 , 10/* "FALSE" */,-45 , 34/* ")" */,-45 , 17/* "]" */,-45 , 32/* "," */,-45 , 15/* ">>" */,-45 ),
	/* State 22 */ new Array( 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 39/* "Identifier" */,32 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 23 */ new Array( 20/* ";" */,-48 , 22/* "==" */,-48 , 27/* "<" */,-48 , 26/* ">" */,-48 , 24/* "<=" */,-48 , 25/* ">=" */,-48 , 23/* "!=" */,-48 , 29/* "-" */,-48 , 28/* "+" */,-48 , 31/* "*" */,-48 , 30/* "/" */,-48 , 16/* "[" */,-48 , 2/* "IF" */,-48 , 4/* "WHILE" */,-48 , 5/* "DO" */,-48 , 7/* "USE" */,-48 , 11/* "DELETE" */,-48 , 8/* "RETURN" */,-48 , 39/* "Identifier" */,-48 , 38/* "." */,-48 , 18/* "{" */,-48 , 41/* "Integer" */,-48 , 42/* "Float" */,-48 , 33/* "(" */,-48 , 40/* "String" */,-48 , 6/* "FUNCTION" */,-48 , 12/* "X" */,-48 , 13/* "Y" */,-48 , 14/* "<<" */,-48 , 9/* "TRUE" */,-48 , 10/* "FALSE" */,-48 , 34/* ")" */,-48 , 17/* "]" */,-48 , 32/* "," */,-48 , 15/* ">>" */,-48 ),
	/* State 24 */ new Array( 33/* "(" */,57 ),
	/* State 25 */ new Array( 33/* "(" */,58 ),
	/* State 26 */ new Array( 33/* "(" */,59 ),
	/* State 27 */ new Array( 39/* "Identifier" */,62 , 15/* ">>" */,-9 , 32/* "," */,-9 ),
	/* State 28 */ new Array( 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 39/* "Identifier" */,32 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 29 */ new Array( 20/* ";" */,-58 , 22/* "==" */,-58 , 27/* "<" */,-58 , 26/* ">" */,-58 , 24/* "<=" */,-58 , 25/* ">=" */,-58 , 23/* "!=" */,-58 , 29/* "-" */,-58 , 28/* "+" */,-58 , 31/* "*" */,-58 , 30/* "/" */,-58 , 16/* "[" */,-58 , 2/* "IF" */,-58 , 4/* "WHILE" */,-58 , 5/* "DO" */,-58 , 7/* "USE" */,-58 , 11/* "DELETE" */,-58 , 8/* "RETURN" */,-58 , 39/* "Identifier" */,-58 , 38/* "." */,-58 , 18/* "{" */,-58 , 41/* "Integer" */,-58 , 42/* "Float" */,-58 , 33/* "(" */,-58 , 40/* "String" */,-58 , 6/* "FUNCTION" */,-58 , 12/* "X" */,-58 , 13/* "Y" */,-58 , 14/* "<<" */,-58 , 9/* "TRUE" */,-58 , 10/* "FALSE" */,-58 , 34/* ")" */,-58 , 17/* "]" */,-58 , 32/* "," */,-58 , 15/* ">>" */,-58 ),
	/* State 30 */ new Array( 20/* ";" */,-59 , 22/* "==" */,-59 , 27/* "<" */,-59 , 26/* ">" */,-59 , 24/* "<=" */,-59 , 25/* ">=" */,-59 , 23/* "!=" */,-59 , 29/* "-" */,-59 , 28/* "+" */,-59 , 31/* "*" */,-59 , 30/* "/" */,-59 , 16/* "[" */,-59 , 2/* "IF" */,-59 , 4/* "WHILE" */,-59 , 5/* "DO" */,-59 , 7/* "USE" */,-59 , 11/* "DELETE" */,-59 , 8/* "RETURN" */,-59 , 39/* "Identifier" */,-59 , 38/* "." */,-59 , 18/* "{" */,-59 , 41/* "Integer" */,-59 , 42/* "Float" */,-59 , 33/* "(" */,-59 , 40/* "String" */,-59 , 6/* "FUNCTION" */,-59 , 12/* "X" */,-59 , 13/* "Y" */,-59 , 14/* "<<" */,-59 , 9/* "TRUE" */,-59 , 10/* "FALSE" */,-59 , 34/* ")" */,-59 , 17/* "]" */,-59 , 32/* "," */,-59 , 15/* ">>" */,-59 ),
	/* State 31 */ new Array( 23/* "!=" */,42 , 25/* ">=" */,43 , 24/* "<=" */,44 , 26/* ">" */,45 , 27/* "<" */,46 , 22/* "==" */,47 , 2/* "IF" */,3 , 4/* "WHILE" */,4 , 5/* "DO" */,5 , 7/* "USE" */,6 , 11/* "DELETE" */,7 , 8/* "RETURN" */,8 , 39/* "Identifier" */,9 , 38/* "." */,10 , 18/* "{" */,12 , 20/* ";" */,13 , 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 32 */ new Array( 38/* "." */,66 , 33/* "(" */,39 , 2/* "IF" */,-46 , 4/* "WHILE" */,-46 , 5/* "DO" */,-46 , 7/* "USE" */,-46 , 11/* "DELETE" */,-46 , 8/* "RETURN" */,-46 , 39/* "Identifier" */,-46 , 18/* "{" */,-46 , 20/* ";" */,-46 , 29/* "-" */,-46 , 41/* "Integer" */,-46 , 42/* "Float" */,-46 , 40/* "String" */,-46 , 6/* "FUNCTION" */,-46 , 12/* "X" */,-46 , 13/* "Y" */,-46 , 14/* "<<" */,-46 , 16/* "[" */,-46 , 9/* "TRUE" */,-46 , 10/* "FALSE" */,-46 , 22/* "==" */,-46 , 27/* "<" */,-46 , 26/* ">" */,-46 , 24/* "<=" */,-46 , 25/* ">=" */,-46 , 23/* "!=" */,-46 , 28/* "+" */,-46 , 31/* "*" */,-46 , 30/* "/" */,-46 , 34/* ")" */,-46 , 17/* "]" */,-46 , 32/* "," */,-46 , 15/* ">>" */,-46 ),
	/* State 33 */ new Array( 23/* "!=" */,42 , 25/* ">=" */,43 , 24/* "<=" */,44 , 26/* ">" */,45 , 27/* "<" */,46 , 22/* "==" */,47 , 2/* "IF" */,3 , 4/* "WHILE" */,4 , 5/* "DO" */,5 , 7/* "USE" */,6 , 11/* "DELETE" */,7 , 8/* "RETURN" */,8 , 39/* "Identifier" */,9 , 38/* "." */,10 , 18/* "{" */,12 , 20/* ";" */,13 , 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 34 */ new Array( 4/* "WHILE" */,68 ),
	/* State 35 */ new Array( 20/* ";" */,69 ),
	/* State 36 */ new Array( 56/* "$" */,-19 , 2/* "IF" */,-19 , 4/* "WHILE" */,-19 , 5/* "DO" */,-19 , 7/* "USE" */,-19 , 11/* "DELETE" */,-19 , 8/* "RETURN" */,-19 , 39/* "Identifier" */,-19 , 38/* "." */,-19 , 18/* "{" */,-19 , 20/* ";" */,-19 , 29/* "-" */,-19 , 41/* "Integer" */,-19 , 42/* "Float" */,-19 , 33/* "(" */,-19 , 40/* "String" */,-19 , 6/* "FUNCTION" */,-19 , 12/* "X" */,-19 , 13/* "Y" */,-19 , 14/* "<<" */,-19 , 16/* "[" */,-19 , 9/* "TRUE" */,-19 , 10/* "FALSE" */,-19 , 3/* "ELSE" */,-19 , 19/* "}" */,-19 ),
	/* State 37 */ new Array( 56/* "$" */,-20 , 2/* "IF" */,-20 , 4/* "WHILE" */,-20 , 5/* "DO" */,-20 , 7/* "USE" */,-20 , 11/* "DELETE" */,-20 , 8/* "RETURN" */,-20 , 39/* "Identifier" */,-20 , 38/* "." */,-20 , 18/* "{" */,-20 , 20/* ";" */,-20 , 29/* "-" */,-20 , 41/* "Integer" */,-20 , 42/* "Float" */,-20 , 33/* "(" */,-20 , 40/* "String" */,-20 , 6/* "FUNCTION" */,-20 , 12/* "X" */,-20 , 13/* "Y" */,-20 , 14/* "<<" */,-20 , 16/* "[" */,-20 , 9/* "TRUE" */,-20 , 10/* "FALSE" */,-20 , 3/* "ELSE" */,-20 , 19/* "}" */,-20 ),
	/* State 38 */ new Array( 39/* "Identifier" */,70 ),
	/* State 39 */ new Array( 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 39/* "Identifier" */,32 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 40 */ new Array( 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 39/* "Identifier" */,32 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 41 */ new Array( 21/* "=" */,73 ),
	/* State 42 */ new Array( 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 39/* "Identifier" */,32 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 43 */ new Array( 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 39/* "Identifier" */,32 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 44 */ new Array( 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 39/* "Identifier" */,32 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 45 */ new Array( 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 39/* "Identifier" */,32 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 46 */ new Array( 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 39/* "Identifier" */,32 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 47 */ new Array( 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 39/* "Identifier" */,32 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 48 */ new Array( 56/* "$" */,-24 , 2/* "IF" */,-24 , 4/* "WHILE" */,-24 , 5/* "DO" */,-24 , 7/* "USE" */,-24 , 11/* "DELETE" */,-24 , 8/* "RETURN" */,-24 , 39/* "Identifier" */,-24 , 38/* "." */,-24 , 18/* "{" */,-24 , 20/* ";" */,-24 , 29/* "-" */,-24 , 41/* "Integer" */,-24 , 42/* "Float" */,-24 , 33/* "(" */,-24 , 40/* "String" */,-24 , 6/* "FUNCTION" */,-24 , 12/* "X" */,-24 , 13/* "Y" */,-24 , 14/* "<<" */,-24 , 16/* "[" */,-24 , 9/* "TRUE" */,-24 , 10/* "FALSE" */,-24 , 3/* "ELSE" */,-24 , 19/* "}" */,-24 ),
	/* State 49 */ new Array( 19/* "}" */,81 , 2/* "IF" */,3 , 4/* "WHILE" */,4 , 5/* "DO" */,5 , 7/* "USE" */,6 , 11/* "DELETE" */,7 , 8/* "RETURN" */,8 , 39/* "Identifier" */,9 , 38/* "." */,10 , 18/* "{" */,12 , 20/* ";" */,13 , 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 50 */ new Array( 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 39/* "Identifier" */,32 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 51 */ new Array( 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 39/* "Identifier" */,32 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 52 */ new Array( 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 39/* "Identifier" */,32 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 53 */ new Array( 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 39/* "Identifier" */,32 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 54 */ new Array( 16/* "[" */,55 , 20/* ";" */,-40 , 22/* "==" */,-40 , 27/* "<" */,-40 , 26/* ">" */,-40 , 24/* "<=" */,-40 , 25/* ">=" */,-40 , 23/* "!=" */,-40 , 29/* "-" */,-40 , 28/* "+" */,-40 , 31/* "*" */,-40 , 30/* "/" */,-40 , 2/* "IF" */,-40 , 4/* "WHILE" */,-40 , 5/* "DO" */,-40 , 7/* "USE" */,-40 , 11/* "DELETE" */,-40 , 8/* "RETURN" */,-40 , 39/* "Identifier" */,-40 , 38/* "." */,-40 , 18/* "{" */,-40 , 41/* "Integer" */,-40 , 42/* "Float" */,-40 , 33/* "(" */,-40 , 40/* "String" */,-40 , 6/* "FUNCTION" */,-40 , 12/* "X" */,-40 , 13/* "Y" */,-40 , 14/* "<<" */,-40 , 9/* "TRUE" */,-40 , 10/* "FALSE" */,-40 , 34/* ")" */,-40 , 17/* "]" */,-40 , 32/* "," */,-40 , 15/* ">>" */,-40 ),
	/* State 55 */ new Array( 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 39/* "Identifier" */,32 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 56 */ new Array( 23/* "!=" */,42 , 25/* ">=" */,43 , 24/* "<=" */,44 , 26/* ">" */,45 , 27/* "<" */,46 , 22/* "==" */,47 , 34/* ")" */,87 ),
	/* State 57 */ new Array( 39/* "Identifier" */,89 , 34/* ")" */,-13 , 32/* "," */,-13 ),
	/* State 58 */ new Array( 39/* "Identifier" */,90 ),
	/* State 59 */ new Array( 39/* "Identifier" */,91 ),
	/* State 60 */ new Array( 32/* "," */,92 , 15/* ">>" */,93 ),
	/* State 61 */ new Array( 15/* ">>" */,-8 , 32/* "," */,-8 ),
	/* State 62 */ new Array( 36/* ":" */,94 ),
	/* State 63 */ new Array( 32/* "," */,95 , 17/* "]" */,96 ),
	/* State 64 */ new Array( 23/* "!=" */,42 , 25/* ">=" */,43 , 24/* "<=" */,44 , 26/* ">" */,45 , 27/* "<" */,46 , 22/* "==" */,47 , 17/* "]" */,-6 , 32/* "," */,-6 , 34/* ")" */,-6 ),
	/* State 65 */ new Array( 3/* "ELSE" */,97 , 56/* "$" */,-14 , 2/* "IF" */,-14 , 4/* "WHILE" */,-14 , 5/* "DO" */,-14 , 7/* "USE" */,-14 , 11/* "DELETE" */,-14 , 8/* "RETURN" */,-14 , 39/* "Identifier" */,-14 , 38/* "." */,-14 , 18/* "{" */,-14 , 20/* ";" */,-14 , 29/* "-" */,-14 , 41/* "Integer" */,-14 , 42/* "Float" */,-14 , 33/* "(" */,-14 , 40/* "String" */,-14 , 6/* "FUNCTION" */,-14 , 12/* "X" */,-14 , 13/* "Y" */,-14 , 14/* "<<" */,-14 , 16/* "[" */,-14 , 9/* "TRUE" */,-14 , 10/* "FALSE" */,-14 , 19/* "}" */,-14 ),
	/* State 66 */ new Array( 39/* "Identifier" */,98 ),
	/* State 67 */ new Array( 56/* "$" */,-16 , 2/* "IF" */,-16 , 4/* "WHILE" */,-16 , 5/* "DO" */,-16 , 7/* "USE" */,-16 , 11/* "DELETE" */,-16 , 8/* "RETURN" */,-16 , 39/* "Identifier" */,-16 , 38/* "." */,-16 , 18/* "{" */,-16 , 20/* ";" */,-16 , 29/* "-" */,-16 , 41/* "Integer" */,-16 , 42/* "Float" */,-16 , 33/* "(" */,-16 , 40/* "String" */,-16 , 6/* "FUNCTION" */,-16 , 12/* "X" */,-16 , 13/* "Y" */,-16 , 14/* "<<" */,-16 , 16/* "[" */,-16 , 9/* "TRUE" */,-16 , 10/* "FALSE" */,-16 , 3/* "ELSE" */,-16 , 19/* "}" */,-16 ),
	/* State 68 */ new Array( 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 39/* "Identifier" */,32 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 69 */ new Array( 56/* "$" */,-18 , 2/* "IF" */,-18 , 4/* "WHILE" */,-18 , 5/* "DO" */,-18 , 7/* "USE" */,-18 , 11/* "DELETE" */,-18 , 8/* "RETURN" */,-18 , 39/* "Identifier" */,-18 , 38/* "." */,-18 , 18/* "{" */,-18 , 20/* ";" */,-18 , 29/* "-" */,-18 , 41/* "Integer" */,-18 , 42/* "Float" */,-18 , 33/* "(" */,-18 , 40/* "String" */,-18 , 6/* "FUNCTION" */,-18 , 12/* "X" */,-18 , 13/* "Y" */,-18 , 14/* "<<" */,-18 , 16/* "[" */,-18 , 9/* "TRUE" */,-18 , 10/* "FALSE" */,-18 , 3/* "ELSE" */,-18 , 19/* "}" */,-18 ),
	/* State 70 */ new Array( 33/* "(" */,100 , 21/* "=" */,101 , 20/* ";" */,-54 , 22/* "==" */,-54 , 27/* "<" */,-54 , 26/* ">" */,-54 , 24/* "<=" */,-54 , 25/* ">=" */,-54 , 23/* "!=" */,-54 , 29/* "-" */,-54 , 28/* "+" */,-54 , 31/* "*" */,-54 , 30/* "/" */,-54 , 16/* "[" */,-54 ),
	/* State 71 */ new Array( 32/* "," */,95 , 34/* ")" */,102 ),
	/* State 72 */ new Array( 23/* "!=" */,42 , 25/* ">=" */,43 , 24/* "<=" */,44 , 26/* ">" */,45 , 27/* "<" */,46 , 22/* "==" */,47 , 20/* ";" */,103 ),
	/* State 73 */ new Array( 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 39/* "Identifier" */,32 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 74 */ new Array( 28/* "+" */,50 , 29/* "-" */,51 , 20/* ";" */,-32 , 22/* "==" */,-32 , 27/* "<" */,-32 , 26/* ">" */,-32 , 24/* "<=" */,-32 , 25/* ">=" */,-32 , 23/* "!=" */,-32 , 2/* "IF" */,-32 , 4/* "WHILE" */,-32 , 5/* "DO" */,-32 , 7/* "USE" */,-32 , 11/* "DELETE" */,-32 , 8/* "RETURN" */,-32 , 39/* "Identifier" */,-32 , 38/* "." */,-32 , 18/* "{" */,-32 , 41/* "Integer" */,-32 , 42/* "Float" */,-32 , 33/* "(" */,-32 , 40/* "String" */,-32 , 6/* "FUNCTION" */,-32 , 12/* "X" */,-32 , 13/* "Y" */,-32 , 14/* "<<" */,-32 , 16/* "[" */,-32 , 9/* "TRUE" */,-32 , 10/* "FALSE" */,-32 , 34/* ")" */,-32 , 17/* "]" */,-32 , 32/* "," */,-32 , 15/* ">>" */,-32 ),
	/* State 75 */ new Array( 28/* "+" */,50 , 29/* "-" */,51 , 20/* ";" */,-31 , 22/* "==" */,-31 , 27/* "<" */,-31 , 26/* ">" */,-31 , 24/* "<=" */,-31 , 25/* ">=" */,-31 , 23/* "!=" */,-31 , 2/* "IF" */,-31 , 4/* "WHILE" */,-31 , 5/* "DO" */,-31 , 7/* "USE" */,-31 , 11/* "DELETE" */,-31 , 8/* "RETURN" */,-31 , 39/* "Identifier" */,-31 , 38/* "." */,-31 , 18/* "{" */,-31 , 41/* "Integer" */,-31 , 42/* "Float" */,-31 , 33/* "(" */,-31 , 40/* "String" */,-31 , 6/* "FUNCTION" */,-31 , 12/* "X" */,-31 , 13/* "Y" */,-31 , 14/* "<<" */,-31 , 16/* "[" */,-31 , 9/* "TRUE" */,-31 , 10/* "FALSE" */,-31 , 34/* ")" */,-31 , 17/* "]" */,-31 , 32/* "," */,-31 , 15/* ">>" */,-31 ),
	/* State 76 */ new Array( 28/* "+" */,50 , 29/* "-" */,51 , 20/* ";" */,-30 , 22/* "==" */,-30 , 27/* "<" */,-30 , 26/* ">" */,-30 , 24/* "<=" */,-30 , 25/* ">=" */,-30 , 23/* "!=" */,-30 , 2/* "IF" */,-30 , 4/* "WHILE" */,-30 , 5/* "DO" */,-30 , 7/* "USE" */,-30 , 11/* "DELETE" */,-30 , 8/* "RETURN" */,-30 , 39/* "Identifier" */,-30 , 38/* "." */,-30 , 18/* "{" */,-30 , 41/* "Integer" */,-30 , 42/* "Float" */,-30 , 33/* "(" */,-30 , 40/* "String" */,-30 , 6/* "FUNCTION" */,-30 , 12/* "X" */,-30 , 13/* "Y" */,-30 , 14/* "<<" */,-30 , 16/* "[" */,-30 , 9/* "TRUE" */,-30 , 10/* "FALSE" */,-30 , 34/* ")" */,-30 , 17/* "]" */,-30 , 32/* "," */,-30 , 15/* ">>" */,-30 ),
	/* State 77 */ new Array( 28/* "+" */,50 , 29/* "-" */,51 , 20/* ";" */,-29 , 22/* "==" */,-29 , 27/* "<" */,-29 , 26/* ">" */,-29 , 24/* "<=" */,-29 , 25/* ">=" */,-29 , 23/* "!=" */,-29 , 2/* "IF" */,-29 , 4/* "WHILE" */,-29 , 5/* "DO" */,-29 , 7/* "USE" */,-29 , 11/* "DELETE" */,-29 , 8/* "RETURN" */,-29 , 39/* "Identifier" */,-29 , 38/* "." */,-29 , 18/* "{" */,-29 , 41/* "Integer" */,-29 , 42/* "Float" */,-29 , 33/* "(" */,-29 , 40/* "String" */,-29 , 6/* "FUNCTION" */,-29 , 12/* "X" */,-29 , 13/* "Y" */,-29 , 14/* "<<" */,-29 , 16/* "[" */,-29 , 9/* "TRUE" */,-29 , 10/* "FALSE" */,-29 , 34/* ")" */,-29 , 17/* "]" */,-29 , 32/* "," */,-29 , 15/* ">>" */,-29 ),
	/* State 78 */ new Array( 28/* "+" */,50 , 29/* "-" */,51 , 20/* ";" */,-28 , 22/* "==" */,-28 , 27/* "<" */,-28 , 26/* ">" */,-28 , 24/* "<=" */,-28 , 25/* ">=" */,-28 , 23/* "!=" */,-28 , 2/* "IF" */,-28 , 4/* "WHILE" */,-28 , 5/* "DO" */,-28 , 7/* "USE" */,-28 , 11/* "DELETE" */,-28 , 8/* "RETURN" */,-28 , 39/* "Identifier" */,-28 , 38/* "." */,-28 , 18/* "{" */,-28 , 41/* "Integer" */,-28 , 42/* "Float" */,-28 , 33/* "(" */,-28 , 40/* "String" */,-28 , 6/* "FUNCTION" */,-28 , 12/* "X" */,-28 , 13/* "Y" */,-28 , 14/* "<<" */,-28 , 16/* "[" */,-28 , 9/* "TRUE" */,-28 , 10/* "FALSE" */,-28 , 34/* ")" */,-28 , 17/* "]" */,-28 , 32/* "," */,-28 , 15/* ">>" */,-28 ),
	/* State 79 */ new Array( 28/* "+" */,50 , 29/* "-" */,51 , 20/* ";" */,-27 , 22/* "==" */,-27 , 27/* "<" */,-27 , 26/* ">" */,-27 , 24/* "<=" */,-27 , 25/* ">=" */,-27 , 23/* "!=" */,-27 , 2/* "IF" */,-27 , 4/* "WHILE" */,-27 , 5/* "DO" */,-27 , 7/* "USE" */,-27 , 11/* "DELETE" */,-27 , 8/* "RETURN" */,-27 , 39/* "Identifier" */,-27 , 38/* "." */,-27 , 18/* "{" */,-27 , 41/* "Integer" */,-27 , 42/* "Float" */,-27 , 33/* "(" */,-27 , 40/* "String" */,-27 , 6/* "FUNCTION" */,-27 , 12/* "X" */,-27 , 13/* "Y" */,-27 , 14/* "<<" */,-27 , 16/* "[" */,-27 , 9/* "TRUE" */,-27 , 10/* "FALSE" */,-27 , 34/* ")" */,-27 , 17/* "]" */,-27 , 32/* "," */,-27 , 15/* ">>" */,-27 ),
	/* State 80 */ new Array( 19/* "}" */,-3 , 2/* "IF" */,-3 , 4/* "WHILE" */,-3 , 5/* "DO" */,-3 , 7/* "USE" */,-3 , 11/* "DELETE" */,-3 , 8/* "RETURN" */,-3 , 39/* "Identifier" */,-3 , 38/* "." */,-3 , 18/* "{" */,-3 , 20/* ";" */,-3 , 29/* "-" */,-3 , 41/* "Integer" */,-3 , 42/* "Float" */,-3 , 33/* "(" */,-3 , 40/* "String" */,-3 , 6/* "FUNCTION" */,-3 , 12/* "X" */,-3 , 13/* "Y" */,-3 , 14/* "<<" */,-3 , 16/* "[" */,-3 , 9/* "TRUE" */,-3 , 10/* "FALSE" */,-3 ),
	/* State 81 */ new Array( 56/* "$" */,-25 , 2/* "IF" */,-25 , 4/* "WHILE" */,-25 , 5/* "DO" */,-25 , 7/* "USE" */,-25 , 11/* "DELETE" */,-25 , 8/* "RETURN" */,-25 , 39/* "Identifier" */,-25 , 38/* "." */,-25 , 18/* "{" */,-25 , 20/* ";" */,-25 , 29/* "-" */,-25 , 41/* "Integer" */,-25 , 42/* "Float" */,-25 , 33/* "(" */,-25 , 40/* "String" */,-25 , 6/* "FUNCTION" */,-25 , 12/* "X" */,-25 , 13/* "Y" */,-25 , 14/* "<<" */,-25 , 16/* "[" */,-25 , 9/* "TRUE" */,-25 , 10/* "FALSE" */,-25 , 3/* "ELSE" */,-25 , 19/* "}" */,-25 ),
	/* State 82 */ new Array( 30/* "/" */,52 , 31/* "*" */,53 , 20/* ";" */,-35 , 22/* "==" */,-35 , 27/* "<" */,-35 , 26/* ">" */,-35 , 24/* "<=" */,-35 , 25/* ">=" */,-35 , 23/* "!=" */,-35 , 29/* "-" */,-35 , 28/* "+" */,-35 , 2/* "IF" */,-35 , 4/* "WHILE" */,-35 , 5/* "DO" */,-35 , 7/* "USE" */,-35 , 11/* "DELETE" */,-35 , 8/* "RETURN" */,-35 , 39/* "Identifier" */,-35 , 38/* "." */,-35 , 18/* "{" */,-35 , 41/* "Integer" */,-35 , 42/* "Float" */,-35 , 33/* "(" */,-35 , 40/* "String" */,-35 , 6/* "FUNCTION" */,-35 , 12/* "X" */,-35 , 13/* "Y" */,-35 , 14/* "<<" */,-35 , 16/* "[" */,-35 , 9/* "TRUE" */,-35 , 10/* "FALSE" */,-35 , 34/* ")" */,-35 , 17/* "]" */,-35 , 32/* "," */,-35 , 15/* ">>" */,-35 ),
	/* State 83 */ new Array( 30/* "/" */,52 , 31/* "*" */,53 , 20/* ";" */,-34 , 22/* "==" */,-34 , 27/* "<" */,-34 , 26/* ">" */,-34 , 24/* "<=" */,-34 , 25/* ">=" */,-34 , 23/* "!=" */,-34 , 29/* "-" */,-34 , 28/* "+" */,-34 , 2/* "IF" */,-34 , 4/* "WHILE" */,-34 , 5/* "DO" */,-34 , 7/* "USE" */,-34 , 11/* "DELETE" */,-34 , 8/* "RETURN" */,-34 , 39/* "Identifier" */,-34 , 38/* "." */,-34 , 18/* "{" */,-34 , 41/* "Integer" */,-34 , 42/* "Float" */,-34 , 33/* "(" */,-34 , 40/* "String" */,-34 , 6/* "FUNCTION" */,-34 , 12/* "X" */,-34 , 13/* "Y" */,-34 , 14/* "<<" */,-34 , 16/* "[" */,-34 , 9/* "TRUE" */,-34 , 10/* "FALSE" */,-34 , 34/* ")" */,-34 , 17/* "]" */,-34 , 32/* "," */,-34 , 15/* ">>" */,-34 ),
	/* State 84 */ new Array( 20/* ";" */,-38 , 22/* "==" */,-38 , 27/* "<" */,-38 , 26/* ">" */,-38 , 24/* "<=" */,-38 , 25/* ">=" */,-38 , 23/* "!=" */,-38 , 29/* "-" */,-38 , 28/* "+" */,-38 , 31/* "*" */,-38 , 30/* "/" */,-38 , 2/* "IF" */,-38 , 4/* "WHILE" */,-38 , 5/* "DO" */,-38 , 7/* "USE" */,-38 , 11/* "DELETE" */,-38 , 8/* "RETURN" */,-38 , 39/* "Identifier" */,-38 , 38/* "." */,-38 , 18/* "{" */,-38 , 41/* "Integer" */,-38 , 42/* "Float" */,-38 , 33/* "(" */,-38 , 40/* "String" */,-38 , 6/* "FUNCTION" */,-38 , 12/* "X" */,-38 , 13/* "Y" */,-38 , 14/* "<<" */,-38 , 16/* "[" */,-38 , 9/* "TRUE" */,-38 , 10/* "FALSE" */,-38 , 34/* ")" */,-38 , 17/* "]" */,-38 , 32/* "," */,-38 , 15/* ">>" */,-38 ),
	/* State 85 */ new Array( 20/* ";" */,-37 , 22/* "==" */,-37 , 27/* "<" */,-37 , 26/* ">" */,-37 , 24/* "<=" */,-37 , 25/* ">=" */,-37 , 23/* "!=" */,-37 , 29/* "-" */,-37 , 28/* "+" */,-37 , 31/* "*" */,-37 , 30/* "/" */,-37 , 2/* "IF" */,-37 , 4/* "WHILE" */,-37 , 5/* "DO" */,-37 , 7/* "USE" */,-37 , 11/* "DELETE" */,-37 , 8/* "RETURN" */,-37 , 39/* "Identifier" */,-37 , 38/* "." */,-37 , 18/* "{" */,-37 , 41/* "Integer" */,-37 , 42/* "Float" */,-37 , 33/* "(" */,-37 , 40/* "String" */,-37 , 6/* "FUNCTION" */,-37 , 12/* "X" */,-37 , 13/* "Y" */,-37 , 14/* "<<" */,-37 , 16/* "[" */,-37 , 9/* "TRUE" */,-37 , 10/* "FALSE" */,-37 , 34/* ")" */,-37 , 17/* "]" */,-37 , 32/* "," */,-37 , 15/* ">>" */,-37 ),
	/* State 86 */ new Array( 28/* "+" */,50 , 29/* "-" */,51 , 17/* "]" */,105 ),
	/* State 87 */ new Array( 20/* ";" */,-47 , 22/* "==" */,-47 , 27/* "<" */,-47 , 26/* ">" */,-47 , 24/* "<=" */,-47 , 25/* ">=" */,-47 , 23/* "!=" */,-47 , 29/* "-" */,-47 , 28/* "+" */,-47 , 31/* "*" */,-47 , 30/* "/" */,-47 , 16/* "[" */,-47 , 2/* "IF" */,-47 , 4/* "WHILE" */,-47 , 5/* "DO" */,-47 , 7/* "USE" */,-47 , 11/* "DELETE" */,-47 , 8/* "RETURN" */,-47 , 39/* "Identifier" */,-47 , 38/* "." */,-47 , 18/* "{" */,-47 , 41/* "Integer" */,-47 , 42/* "Float" */,-47 , 33/* "(" */,-47 , 40/* "String" */,-47 , 6/* "FUNCTION" */,-47 , 12/* "X" */,-47 , 13/* "Y" */,-47 , 14/* "<<" */,-47 , 9/* "TRUE" */,-47 , 10/* "FALSE" */,-47 , 34/* ")" */,-47 , 17/* "]" */,-47 , 32/* "," */,-47 , 15/* ">>" */,-47 ),
	/* State 88 */ new Array( 32/* "," */,106 , 34/* ")" */,107 ),
	/* State 89 */ new Array( 34/* ")" */,-12 , 32/* "," */,-12 ),
	/* State 90 */ new Array( 34/* ")" */,108 ),
	/* State 91 */ new Array( 34/* ")" */,109 ),
	/* State 92 */ new Array( 39/* "Identifier" */,62 ),
	/* State 93 */ new Array( 20/* ";" */,-56 , 22/* "==" */,-56 , 27/* "<" */,-56 , 26/* ">" */,-56 , 24/* "<=" */,-56 , 25/* ">=" */,-56 , 23/* "!=" */,-56 , 29/* "-" */,-56 , 28/* "+" */,-56 , 31/* "*" */,-56 , 30/* "/" */,-56 , 16/* "[" */,-56 , 2/* "IF" */,-56 , 4/* "WHILE" */,-56 , 5/* "DO" */,-56 , 7/* "USE" */,-56 , 11/* "DELETE" */,-56 , 8/* "RETURN" */,-56 , 39/* "Identifier" */,-56 , 38/* "." */,-56 , 18/* "{" */,-56 , 41/* "Integer" */,-56 , 42/* "Float" */,-56 , 33/* "(" */,-56 , 40/* "String" */,-56 , 6/* "FUNCTION" */,-56 , 12/* "X" */,-56 , 13/* "Y" */,-56 , 14/* "<<" */,-56 , 9/* "TRUE" */,-56 , 10/* "FALSE" */,-56 , 34/* ")" */,-56 , 17/* "]" */,-56 , 32/* "," */,-56 , 15/* ">>" */,-56 ),
	/* State 94 */ new Array( 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 39/* "Identifier" */,32 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 95 */ new Array( 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 39/* "Identifier" */,32 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 96 */ new Array( 20/* ";" */,-57 , 22/* "==" */,-57 , 27/* "<" */,-57 , 26/* ">" */,-57 , 24/* "<=" */,-57 , 25/* ">=" */,-57 , 23/* "!=" */,-57 , 29/* "-" */,-57 , 28/* "+" */,-57 , 31/* "*" */,-57 , 30/* "/" */,-57 , 16/* "[" */,-57 , 2/* "IF" */,-57 , 4/* "WHILE" */,-57 , 5/* "DO" */,-57 , 7/* "USE" */,-57 , 11/* "DELETE" */,-57 , 8/* "RETURN" */,-57 , 39/* "Identifier" */,-57 , 38/* "." */,-57 , 18/* "{" */,-57 , 41/* "Integer" */,-57 , 42/* "Float" */,-57 , 33/* "(" */,-57 , 40/* "String" */,-57 , 6/* "FUNCTION" */,-57 , 12/* "X" */,-57 , 13/* "Y" */,-57 , 14/* "<<" */,-57 , 9/* "TRUE" */,-57 , 10/* "FALSE" */,-57 , 34/* ")" */,-57 , 17/* "]" */,-57 , 32/* "," */,-57 , 15/* ">>" */,-57 ),
	/* State 97 */ new Array( 2/* "IF" */,3 , 4/* "WHILE" */,4 , 5/* "DO" */,5 , 7/* "USE" */,6 , 11/* "DELETE" */,7 , 8/* "RETURN" */,8 , 39/* "Identifier" */,9 , 38/* "." */,10 , 18/* "{" */,12 , 20/* ";" */,13 , 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 98 */ new Array( 33/* "(" */,100 , 2/* "IF" */,-54 , 4/* "WHILE" */,-54 , 5/* "DO" */,-54 , 7/* "USE" */,-54 , 11/* "DELETE" */,-54 , 8/* "RETURN" */,-54 , 39/* "Identifier" */,-54 , 38/* "." */,-54 , 18/* "{" */,-54 , 20/* ";" */,-54 , 29/* "-" */,-54 , 41/* "Integer" */,-54 , 42/* "Float" */,-54 , 40/* "String" */,-54 , 6/* "FUNCTION" */,-54 , 12/* "X" */,-54 , 13/* "Y" */,-54 , 14/* "<<" */,-54 , 16/* "[" */,-54 , 9/* "TRUE" */,-54 , 10/* "FALSE" */,-54 , 22/* "==" */,-54 , 27/* "<" */,-54 , 26/* ">" */,-54 , 24/* "<=" */,-54 , 25/* ">=" */,-54 , 23/* "!=" */,-54 , 28/* "+" */,-54 , 31/* "*" */,-54 , 30/* "/" */,-54 , 34/* ")" */,-54 , 17/* "]" */,-54 , 32/* "," */,-54 , 15/* ">>" */,-54 ),
	/* State 99 */ new Array( 23/* "!=" */,42 , 25/* ">=" */,43 , 24/* "<=" */,44 , 26/* ">" */,45 , 27/* "<" */,46 , 22/* "==" */,47 , 20/* ";" */,114 ),
	/* State 100 */ new Array( 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 39/* "Identifier" */,32 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 101 */ new Array( 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 39/* "Identifier" */,32 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 102 */ new Array( 14/* "<<" */,117 , 20/* ";" */,-49 , 22/* "==" */,-49 , 27/* "<" */,-49 , 26/* ">" */,-49 , 24/* "<=" */,-49 , 25/* ">=" */,-49 , 23/* "!=" */,-49 , 29/* "-" */,-49 , 28/* "+" */,-49 , 31/* "*" */,-49 , 30/* "/" */,-49 , 16/* "[" */,-49 , 2/* "IF" */,-49 , 4/* "WHILE" */,-49 , 5/* "DO" */,-49 , 7/* "USE" */,-49 , 11/* "DELETE" */,-49 , 8/* "RETURN" */,-49 , 39/* "Identifier" */,-49 , 38/* "." */,-49 , 18/* "{" */,-49 , 41/* "Integer" */,-49 , 42/* "Float" */,-49 , 33/* "(" */,-49 , 40/* "String" */,-49 , 6/* "FUNCTION" */,-49 , 12/* "X" */,-49 , 13/* "Y" */,-49 , 9/* "TRUE" */,-49 , 10/* "FALSE" */,-49 , 34/* ")" */,-49 , 17/* "]" */,-49 , 32/* "," */,-49 , 15/* ">>" */,-49 ),
	/* State 103 */ new Array( 56/* "$" */,-21 , 2/* "IF" */,-21 , 4/* "WHILE" */,-21 , 5/* "DO" */,-21 , 7/* "USE" */,-21 , 11/* "DELETE" */,-21 , 8/* "RETURN" */,-21 , 39/* "Identifier" */,-21 , 38/* "." */,-21 , 18/* "{" */,-21 , 20/* ";" */,-21 , 29/* "-" */,-21 , 41/* "Integer" */,-21 , 42/* "Float" */,-21 , 33/* "(" */,-21 , 40/* "String" */,-21 , 6/* "FUNCTION" */,-21 , 12/* "X" */,-21 , 13/* "Y" */,-21 , 14/* "<<" */,-21 , 16/* "[" */,-21 , 9/* "TRUE" */,-21 , 10/* "FALSE" */,-21 , 3/* "ELSE" */,-21 , 19/* "}" */,-21 ),
	/* State 104 */ new Array( 23/* "!=" */,42 , 25/* ">=" */,43 , 24/* "<=" */,44 , 26/* ">" */,45 , 27/* "<" */,46 , 22/* "==" */,47 , 20/* ";" */,118 ),
	/* State 105 */ new Array( 20/* ";" */,-42 , 22/* "==" */,-42 , 27/* "<" */,-42 , 26/* ">" */,-42 , 24/* "<=" */,-42 , 25/* ">=" */,-42 , 23/* "!=" */,-42 , 29/* "-" */,-42 , 28/* "+" */,-42 , 31/* "*" */,-42 , 30/* "/" */,-42 , 16/* "[" */,-42 , 2/* "IF" */,-42 , 4/* "WHILE" */,-42 , 5/* "DO" */,-42 , 7/* "USE" */,-42 , 11/* "DELETE" */,-42 , 8/* "RETURN" */,-42 , 39/* "Identifier" */,-42 , 38/* "." */,-42 , 18/* "{" */,-42 , 41/* "Integer" */,-42 , 42/* "Float" */,-42 , 33/* "(" */,-42 , 40/* "String" */,-42 , 6/* "FUNCTION" */,-42 , 12/* "X" */,-42 , 13/* "Y" */,-42 , 14/* "<<" */,-42 , 9/* "TRUE" */,-42 , 10/* "FALSE" */,-42 , 34/* ")" */,-42 , 17/* "]" */,-42 , 32/* "," */,-42 , 15/* ">>" */,-42 ),
	/* State 106 */ new Array( 39/* "Identifier" */,119 ),
	/* State 107 */ new Array( 18/* "{" */,120 ),
	/* State 108 */ new Array( 20/* ";" */,-52 , 22/* "==" */,-52 , 27/* "<" */,-52 , 26/* ">" */,-52 , 24/* "<=" */,-52 , 25/* ">=" */,-52 , 23/* "!=" */,-52 , 29/* "-" */,-52 , 28/* "+" */,-52 , 31/* "*" */,-52 , 30/* "/" */,-52 , 16/* "[" */,-52 , 2/* "IF" */,-52 , 4/* "WHILE" */,-52 , 5/* "DO" */,-52 , 7/* "USE" */,-52 , 11/* "DELETE" */,-52 , 8/* "RETURN" */,-52 , 39/* "Identifier" */,-52 , 38/* "." */,-52 , 18/* "{" */,-52 , 41/* "Integer" */,-52 , 42/* "Float" */,-52 , 33/* "(" */,-52 , 40/* "String" */,-52 , 6/* "FUNCTION" */,-52 , 12/* "X" */,-52 , 13/* "Y" */,-52 , 14/* "<<" */,-52 , 9/* "TRUE" */,-52 , 10/* "FALSE" */,-52 , 34/* ")" */,-52 , 17/* "]" */,-52 , 32/* "," */,-52 , 15/* ">>" */,-52 ),
	/* State 109 */ new Array( 20/* ";" */,-53 , 22/* "==" */,-53 , 27/* "<" */,-53 , 26/* ">" */,-53 , 24/* "<=" */,-53 , 25/* ">=" */,-53 , 23/* "!=" */,-53 , 29/* "-" */,-53 , 28/* "+" */,-53 , 31/* "*" */,-53 , 30/* "/" */,-53 , 16/* "[" */,-53 , 2/* "IF" */,-53 , 4/* "WHILE" */,-53 , 5/* "DO" */,-53 , 7/* "USE" */,-53 , 11/* "DELETE" */,-53 , 8/* "RETURN" */,-53 , 39/* "Identifier" */,-53 , 38/* "." */,-53 , 18/* "{" */,-53 , 41/* "Integer" */,-53 , 42/* "Float" */,-53 , 33/* "(" */,-53 , 40/* "String" */,-53 , 6/* "FUNCTION" */,-53 , 12/* "X" */,-53 , 13/* "Y" */,-53 , 14/* "<<" */,-53 , 9/* "TRUE" */,-53 , 10/* "FALSE" */,-53 , 34/* ")" */,-53 , 17/* "]" */,-53 , 32/* "," */,-53 , 15/* ">>" */,-53 ),
	/* State 110 */ new Array( 15/* ">>" */,-7 , 32/* "," */,-7 ),
	/* State 111 */ new Array( 23/* "!=" */,42 , 25/* ">=" */,43 , 24/* "<=" */,44 , 26/* ">" */,45 , 27/* "<" */,46 , 22/* "==" */,47 , 15/* ">>" */,-10 , 32/* "," */,-10 ),
	/* State 112 */ new Array( 23/* "!=" */,42 , 25/* ">=" */,43 , 24/* "<=" */,44 , 26/* ">" */,45 , 27/* "<" */,46 , 22/* "==" */,47 , 17/* "]" */,-5 , 32/* "," */,-5 , 34/* ")" */,-5 ),
	/* State 113 */ new Array( 56/* "$" */,-15 , 2/* "IF" */,-15 , 4/* "WHILE" */,-15 , 5/* "DO" */,-15 , 7/* "USE" */,-15 , 11/* "DELETE" */,-15 , 8/* "RETURN" */,-15 , 39/* "Identifier" */,-15 , 38/* "." */,-15 , 18/* "{" */,-15 , 20/* ";" */,-15 , 29/* "-" */,-15 , 41/* "Integer" */,-15 , 42/* "Float" */,-15 , 33/* "(" */,-15 , 40/* "String" */,-15 , 6/* "FUNCTION" */,-15 , 12/* "X" */,-15 , 13/* "Y" */,-15 , 14/* "<<" */,-15 , 16/* "[" */,-15 , 9/* "TRUE" */,-15 , 10/* "FALSE" */,-15 , 3/* "ELSE" */,-15 , 19/* "}" */,-15 ),
	/* State 114 */ new Array( 56/* "$" */,-17 , 2/* "IF" */,-17 , 4/* "WHILE" */,-17 , 5/* "DO" */,-17 , 7/* "USE" */,-17 , 11/* "DELETE" */,-17 , 8/* "RETURN" */,-17 , 39/* "Identifier" */,-17 , 38/* "." */,-17 , 18/* "{" */,-17 , 20/* ";" */,-17 , 29/* "-" */,-17 , 41/* "Integer" */,-17 , 42/* "Float" */,-17 , 33/* "(" */,-17 , 40/* "String" */,-17 , 6/* "FUNCTION" */,-17 , 12/* "X" */,-17 , 13/* "Y" */,-17 , 14/* "<<" */,-17 , 16/* "[" */,-17 , 9/* "TRUE" */,-17 , 10/* "FALSE" */,-17 , 3/* "ELSE" */,-17 , 19/* "}" */,-17 ),
	/* State 115 */ new Array( 32/* "," */,95 , 34/* ")" */,121 ),
	/* State 116 */ new Array( 23/* "!=" */,42 , 25/* ">=" */,43 , 24/* "<=" */,44 , 26/* ">" */,45 , 27/* "<" */,46 , 22/* "==" */,47 , 20/* ";" */,122 ),
	/* State 117 */ new Array( 39/* "Identifier" */,62 , 15/* ">>" */,-9 , 32/* "," */,-9 ),
	/* State 118 */ new Array( 56/* "$" */,-23 , 2/* "IF" */,-23 , 4/* "WHILE" */,-23 , 5/* "DO" */,-23 , 7/* "USE" */,-23 , 11/* "DELETE" */,-23 , 8/* "RETURN" */,-23 , 39/* "Identifier" */,-23 , 38/* "." */,-23 , 18/* "{" */,-23 , 20/* ";" */,-23 , 29/* "-" */,-23 , 41/* "Integer" */,-23 , 42/* "Float" */,-23 , 33/* "(" */,-23 , 40/* "String" */,-23 , 6/* "FUNCTION" */,-23 , 12/* "X" */,-23 , 13/* "Y" */,-23 , 14/* "<<" */,-23 , 16/* "[" */,-23 , 9/* "TRUE" */,-23 , 10/* "FALSE" */,-23 , 3/* "ELSE" */,-23 , 19/* "}" */,-23 ),
	/* State 119 */ new Array( 34/* ")" */,-11 , 32/* "," */,-11 ),
	/* State 120 */ new Array( 19/* "}" */,-4 , 2/* "IF" */,-4 , 4/* "WHILE" */,-4 , 5/* "DO" */,-4 , 7/* "USE" */,-4 , 11/* "DELETE" */,-4 , 8/* "RETURN" */,-4 , 39/* "Identifier" */,-4 , 38/* "." */,-4 , 18/* "{" */,-4 , 20/* ";" */,-4 , 29/* "-" */,-4 , 41/* "Integer" */,-4 , 42/* "Float" */,-4 , 33/* "(" */,-4 , 40/* "String" */,-4 , 6/* "FUNCTION" */,-4 , 12/* "X" */,-4 , 13/* "Y" */,-4 , 14/* "<<" */,-4 , 16/* "[" */,-4 , 9/* "TRUE" */,-4 , 10/* "FALSE" */,-4 ),
	/* State 121 */ new Array( 20/* ";" */,-55 , 22/* "==" */,-55 , 27/* "<" */,-55 , 26/* ">" */,-55 , 24/* "<=" */,-55 , 25/* ">=" */,-55 , 23/* "!=" */,-55 , 29/* "-" */,-55 , 28/* "+" */,-55 , 31/* "*" */,-55 , 30/* "/" */,-55 , 16/* "[" */,-55 , 2/* "IF" */,-55 , 4/* "WHILE" */,-55 , 5/* "DO" */,-55 , 7/* "USE" */,-55 , 11/* "DELETE" */,-55 , 8/* "RETURN" */,-55 , 39/* "Identifier" */,-55 , 38/* "." */,-55 , 18/* "{" */,-55 , 41/* "Integer" */,-55 , 42/* "Float" */,-55 , 33/* "(" */,-55 , 40/* "String" */,-55 , 6/* "FUNCTION" */,-55 , 12/* "X" */,-55 , 13/* "Y" */,-55 , 14/* "<<" */,-55 , 9/* "TRUE" */,-55 , 10/* "FALSE" */,-55 , 34/* ")" */,-55 , 17/* "]" */,-55 , 32/* "," */,-55 , 15/* ">>" */,-55 ),
	/* State 122 */ new Array( 56/* "$" */,-22 , 2/* "IF" */,-22 , 4/* "WHILE" */,-22 , 5/* "DO" */,-22 , 7/* "USE" */,-22 , 11/* "DELETE" */,-22 , 8/* "RETURN" */,-22 , 39/* "Identifier" */,-22 , 38/* "." */,-22 , 18/* "{" */,-22 , 20/* ";" */,-22 , 29/* "-" */,-22 , 41/* "Integer" */,-22 , 42/* "Float" */,-22 , 33/* "(" */,-22 , 40/* "String" */,-22 , 6/* "FUNCTION" */,-22 , 12/* "X" */,-22 , 13/* "Y" */,-22 , 14/* "<<" */,-22 , 16/* "[" */,-22 , 9/* "TRUE" */,-22 , 10/* "FALSE" */,-22 , 3/* "ELSE" */,-22 , 19/* "}" */,-22 ),
	/* State 123 */ new Array( 32/* "," */,92 , 15/* ">>" */,125 ),
	/* State 124 */ new Array( 19/* "}" */,126 , 2/* "IF" */,3 , 4/* "WHILE" */,4 , 5/* "DO" */,5 , 7/* "USE" */,6 , 11/* "DELETE" */,7 , 8/* "RETURN" */,8 , 39/* "Identifier" */,9 , 38/* "." */,10 , 18/* "{" */,12 , 20/* ";" */,13 , 29/* "-" */,17 , 41/* "Integer" */,20 , 42/* "Float" */,21 , 33/* "(" */,22 , 40/* "String" */,23 , 6/* "FUNCTION" */,24 , 12/* "X" */,25 , 13/* "Y" */,26 , 14/* "<<" */,27 , 16/* "[" */,28 , 9/* "TRUE" */,29 , 10/* "FALSE" */,30 ),
	/* State 125 */ new Array( 20/* ";" */,-50 , 22/* "==" */,-50 , 27/* "<" */,-50 , 26/* ">" */,-50 , 24/* "<=" */,-50 , 25/* ">=" */,-50 , 23/* "!=" */,-50 , 29/* "-" */,-50 , 28/* "+" */,-50 , 31/* "*" */,-50 , 30/* "/" */,-50 , 16/* "[" */,-50 , 2/* "IF" */,-50 , 4/* "WHILE" */,-50 , 5/* "DO" */,-50 , 7/* "USE" */,-50 , 11/* "DELETE" */,-50 , 8/* "RETURN" */,-50 , 39/* "Identifier" */,-50 , 38/* "." */,-50 , 18/* "{" */,-50 , 41/* "Integer" */,-50 , 42/* "Float" */,-50 , 33/* "(" */,-50 , 40/* "String" */,-50 , 6/* "FUNCTION" */,-50 , 12/* "X" */,-50 , 13/* "Y" */,-50 , 14/* "<<" */,-50 , 9/* "TRUE" */,-50 , 10/* "FALSE" */,-50 , 34/* ")" */,-50 , 17/* "]" */,-50 , 32/* "," */,-50 , 15/* ">>" */,-50 ),
	/* State 126 */ new Array( 20/* ";" */,-51 , 22/* "==" */,-51 , 27/* "<" */,-51 , 26/* ">" */,-51 , 24/* "<=" */,-51 , 25/* ">=" */,-51 , 23/* "!=" */,-51 , 29/* "-" */,-51 , 28/* "+" */,-51 , 31/* "*" */,-51 , 30/* "/" */,-51 , 16/* "[" */,-51 , 2/* "IF" */,-51 , 4/* "WHILE" */,-51 , 5/* "DO" */,-51 , 7/* "USE" */,-51 , 11/* "DELETE" */,-51 , 8/* "RETURN" */,-51 , 39/* "Identifier" */,-51 , 38/* "." */,-51 , 18/* "{" */,-51 , 41/* "Integer" */,-51 , 42/* "Float" */,-51 , 33/* "(" */,-51 , 40/* "String" */,-51 , 6/* "FUNCTION" */,-51 , 12/* "X" */,-51 , 13/* "Y" */,-51 , 14/* "<<" */,-51 , 9/* "TRUE" */,-51 , 10/* "FALSE" */,-51 , 34/* ")" */,-51 , 17/* "]" */,-51 , 32/* "," */,-51 , 15/* ">>" */,-51 )
);

/* Goto-Table */
var goto_tab = new Array(
	/* State 0 */ new Array( 43/* Program */,1 ),
	/* State 1 */ new Array( 44/* Stmt */,2 , 47/* Expression */,11 , 51/* AddSubExp */,14 , 52/* MulDivExp */,15 , 53/* NegExp */,16 , 54/* ExtValue */,18 , 55/* Value */,19 ),
	/* State 2 */ new Array(  ),
	/* State 3 */ new Array( 47/* Expression */,31 , 51/* AddSubExp */,14 , 52/* MulDivExp */,15 , 53/* NegExp */,16 , 54/* ExtValue */,18 , 55/* Value */,19 ),
	/* State 4 */ new Array( 47/* Expression */,33 , 51/* AddSubExp */,14 , 52/* MulDivExp */,15 , 53/* NegExp */,16 , 54/* ExtValue */,18 , 55/* Value */,19 ),
	/* State 5 */ new Array( 44/* Stmt */,34 , 47/* Expression */,11 , 51/* AddSubExp */,14 , 52/* MulDivExp */,15 , 53/* NegExp */,16 , 54/* ExtValue */,18 , 55/* Value */,19 ),
	/* State 6 */ new Array(  ),
	/* State 7 */ new Array(  ),
	/* State 8 */ new Array( 44/* Stmt */,37 , 47/* Expression */,11 , 51/* AddSubExp */,14 , 52/* MulDivExp */,15 , 53/* NegExp */,16 , 54/* ExtValue */,18 , 55/* Value */,19 ),
	/* State 9 */ new Array(  ),
	/* State 10 */ new Array(  ),
	/* State 11 */ new Array(  ),
	/* State 12 */ new Array( 45/* Stmt_List */,49 ),
	/* State 13 */ new Array(  ),
	/* State 14 */ new Array(  ),
	/* State 15 */ new Array(  ),
	/* State 16 */ new Array(  ),
	/* State 17 */ new Array( 54/* ExtValue */,54 , 55/* Value */,19 ),
	/* State 18 */ new Array(  ),
	/* State 19 */ new Array(  ),
	/* State 20 */ new Array(  ),
	/* State 21 */ new Array(  ),
	/* State 22 */ new Array( 47/* Expression */,56 , 51/* AddSubExp */,14 , 52/* MulDivExp */,15 , 53/* NegExp */,16 , 54/* ExtValue */,18 , 55/* Value */,19 ),
	/* State 23 */ new Array(  ),
	/* State 24 */ new Array(  ),
	/* State 25 */ new Array(  ),
	/* State 26 */ new Array(  ),
	/* State 27 */ new Array( 48/* Prop_List */,60 , 49/* Prop */,61 ),
	/* State 28 */ new Array( 46/* Param_List */,63 , 47/* Expression */,64 , 51/* AddSubExp */,14 , 52/* MulDivExp */,15 , 53/* NegExp */,16 , 54/* ExtValue */,18 , 55/* Value */,19 ),
	/* State 29 */ new Array(  ),
	/* State 30 */ new Array(  ),
	/* State 31 */ new Array( 44/* Stmt */,65 , 47/* Expression */,11 , 51/* AddSubExp */,14 , 52/* MulDivExp */,15 , 53/* NegExp */,16 , 54/* ExtValue */,18 , 55/* Value */,19 ),
	/* State 32 */ new Array(  ),
	/* State 33 */ new Array( 44/* Stmt */,67 , 47/* Expression */,11 , 51/* AddSubExp */,14 , 52/* MulDivExp */,15 , 53/* NegExp */,16 , 54/* ExtValue */,18 , 55/* Value */,19 ),
	/* State 34 */ new Array(  ),
	/* State 35 */ new Array(  ),
	/* State 36 */ new Array(  ),
	/* State 37 */ new Array(  ),
	/* State 38 */ new Array(  ),
	/* State 39 */ new Array( 46/* Param_List */,71 , 47/* Expression */,64 , 51/* AddSubExp */,14 , 52/* MulDivExp */,15 , 53/* NegExp */,16 , 54/* ExtValue */,18 , 55/* Value */,19 ),
	/* State 40 */ new Array( 47/* Expression */,72 , 51/* AddSubExp */,14 , 52/* MulDivExp */,15 , 53/* NegExp */,16 , 54/* ExtValue */,18 , 55/* Value */,19 ),
	/* State 41 */ new Array(  ),
	/* State 42 */ new Array( 51/* AddSubExp */,74 , 52/* MulDivExp */,15 , 53/* NegExp */,16 , 54/* ExtValue */,18 , 55/* Value */,19 ),
	/* State 43 */ new Array( 51/* AddSubExp */,75 , 52/* MulDivExp */,15 , 53/* NegExp */,16 , 54/* ExtValue */,18 , 55/* Value */,19 ),
	/* State 44 */ new Array( 51/* AddSubExp */,76 , 52/* MulDivExp */,15 , 53/* NegExp */,16 , 54/* ExtValue */,18 , 55/* Value */,19 ),
	/* State 45 */ new Array( 51/* AddSubExp */,77 , 52/* MulDivExp */,15 , 53/* NegExp */,16 , 54/* ExtValue */,18 , 55/* Value */,19 ),
	/* State 46 */ new Array( 51/* AddSubExp */,78 , 52/* MulDivExp */,15 , 53/* NegExp */,16 , 54/* ExtValue */,18 , 55/* Value */,19 ),
	/* State 47 */ new Array( 51/* AddSubExp */,79 , 52/* MulDivExp */,15 , 53/* NegExp */,16 , 54/* ExtValue */,18 , 55/* Value */,19 ),
	/* State 48 */ new Array(  ),
	/* State 49 */ new Array( 44/* Stmt */,80 , 47/* Expression */,11 , 51/* AddSubExp */,14 , 52/* MulDivExp */,15 , 53/* NegExp */,16 , 54/* ExtValue */,18 , 55/* Value */,19 ),
	/* State 50 */ new Array( 52/* MulDivExp */,82 , 53/* NegExp */,16 , 54/* ExtValue */,18 , 55/* Value */,19 ),
	/* State 51 */ new Array( 52/* MulDivExp */,83 , 53/* NegExp */,16 , 54/* ExtValue */,18 , 55/* Value */,19 ),
	/* State 52 */ new Array( 53/* NegExp */,84 , 54/* ExtValue */,18 , 55/* Value */,19 ),
	/* State 53 */ new Array( 53/* NegExp */,85 , 54/* ExtValue */,18 , 55/* Value */,19 ),
	/* State 54 */ new Array(  ),
	/* State 55 */ new Array( 51/* AddSubExp */,86 , 52/* MulDivExp */,15 , 53/* NegExp */,16 , 54/* ExtValue */,18 , 55/* Value */,19 ),
	/* State 56 */ new Array(  ),
	/* State 57 */ new Array( 50/* Param_Def_List */,88 ),
	/* State 58 */ new Array(  ),
	/* State 59 */ new Array(  ),
	/* State 60 */ new Array(  ),
	/* State 61 */ new Array(  ),
	/* State 62 */ new Array(  ),
	/* State 63 */ new Array(  ),
	/* State 64 */ new Array(  ),
	/* State 65 */ new Array(  ),
	/* State 66 */ new Array(  ),
	/* State 67 */ new Array(  ),
	/* State 68 */ new Array( 47/* Expression */,99 , 51/* AddSubExp */,14 , 52/* MulDivExp */,15 , 53/* NegExp */,16 , 54/* ExtValue */,18 , 55/* Value */,19 ),
	/* State 69 */ new Array(  ),
	/* State 70 */ new Array(  ),
	/* State 71 */ new Array(  ),
	/* State 72 */ new Array(  ),
	/* State 73 */ new Array( 47/* Expression */,104 , 51/* AddSubExp */,14 , 52/* MulDivExp */,15 , 53/* NegExp */,16 , 54/* ExtValue */,18 , 55/* Value */,19 ),
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
	/* State 88 */ new Array(  ),
	/* State 89 */ new Array(  ),
	/* State 90 */ new Array(  ),
	/* State 91 */ new Array(  ),
	/* State 92 */ new Array( 49/* Prop */,110 ),
	/* State 93 */ new Array(  ),
	/* State 94 */ new Array( 47/* Expression */,111 , 51/* AddSubExp */,14 , 52/* MulDivExp */,15 , 53/* NegExp */,16 , 54/* ExtValue */,18 , 55/* Value */,19 ),
	/* State 95 */ new Array( 47/* Expression */,112 , 51/* AddSubExp */,14 , 52/* MulDivExp */,15 , 53/* NegExp */,16 , 54/* ExtValue */,18 , 55/* Value */,19 ),
	/* State 96 */ new Array(  ),
	/* State 97 */ new Array( 44/* Stmt */,113 , 47/* Expression */,11 , 51/* AddSubExp */,14 , 52/* MulDivExp */,15 , 53/* NegExp */,16 , 54/* ExtValue */,18 , 55/* Value */,19 ),
	/* State 98 */ new Array(  ),
	/* State 99 */ new Array(  ),
	/* State 100 */ new Array( 46/* Param_List */,115 , 47/* Expression */,64 , 51/* AddSubExp */,14 , 52/* MulDivExp */,15 , 53/* NegExp */,16 , 54/* ExtValue */,18 , 55/* Value */,19 ),
	/* State 101 */ new Array( 47/* Expression */,116 , 51/* AddSubExp */,14 , 52/* MulDivExp */,15 , 53/* NegExp */,16 , 54/* ExtValue */,18 , 55/* Value */,19 ),
	/* State 102 */ new Array(  ),
	/* State 103 */ new Array(  ),
	/* State 104 */ new Array(  ),
	/* State 105 */ new Array(  ),
	/* State 106 */ new Array(  ),
	/* State 107 */ new Array(  ),
	/* State 108 */ new Array(  ),
	/* State 109 */ new Array(  ),
	/* State 110 */ new Array(  ),
	/* State 111 */ new Array(  ),
	/* State 112 */ new Array(  ),
	/* State 113 */ new Array(  ),
	/* State 114 */ new Array(  ),
	/* State 115 */ new Array(  ),
	/* State 116 */ new Array(  ),
	/* State 117 */ new Array( 48/* Prop_List */,123 , 49/* Prop */,61 ),
	/* State 118 */ new Array(  ),
	/* State 119 */ new Array(  ),
	/* State 120 */ new Array( 45/* Stmt_List */,124 ),
	/* State 121 */ new Array(  ),
	/* State 122 */ new Array(  ),
	/* State 123 */ new Array(  ),
	/* State 124 */ new Array( 44/* Stmt */,80 , 47/* Expression */,11 , 51/* AddSubExp */,14 , 52/* MulDivExp */,15 , 53/* NegExp */,16 , 54/* ExtValue */,18 , 55/* Value */,19 ),
	/* State 125 */ new Array(  ),
	/* State 126 */ new Array(  )
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
	"TRUE" /* Terminal symbol */,
	"FALSE" /* Terminal symbol */,
	"DELETE" /* Terminal symbol */,
	"X" /* Terminal symbol */,
	"Y" /* Terminal symbol */,
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
	"," /* Terminal symbol */,
	"(" /* Terminal symbol */,
	")" /* Terminal symbol */,
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
	"AddSubExp" /* Non-terminal symbol */,
	"MulDivExp" /* Non-terminal symbol */,
	"NegExp" /* Non-terminal symbol */,
	"ExtValue" /* Non-terminal symbol */,
	"Value" /* Non-terminal symbol */,
	"$" /* Terminal symbol */
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
            act = 128;
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
            if (act == 128) {
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

                while (act == 128 && la != 56) {
                    if (this._dbg_withtrace) {
                        this._dbg_print("\tError recovery\n" +
                                        "Current lookahead: " + labels[la] + " (" + info.att + ")\n" +
                                        "Action: " + act + "\n\n");
                    }
                    if (la == -1) {
                        info.offset++;
                    }

                    while (act == 128 && sstack.length > 0) {
                        sstack.pop();
                        vstack.pop();

                        if (sstack.length == 0) {
                            break;
                        }

                        act = 128;
                        for (i = 0; i < act_tab[sstack[sstack.length-1]].length; i+=2) {
                            if (act_tab[sstack[sstack.length-1]][i] == la) {
                                act = act_tab[sstack[sstack.length-1]][i+1];
                                break;
                            }
                        }
                    }

                    if (act != 128) {
                        break;
                    }

                    for (i = 0; i < rsstack.length; i++) {
                        sstack.push(rsstack[i]);
                        vstack.push(rvstack[i]);
                    }

                    la = this._lex(info);
                }

                if (act == 128) {
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
		 rval = this.createNode('node_op', 'op_proplst', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 8:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 9:
	{
		rval = vstack[ vstack.length - 0 ];
	}
	break;
	case 10:
	{
		 rval = this.createNode('node_op', 'op_prop', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 11:
	{
		 rval = this.createNode('node_op', 'op_paramdeflst', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 12:
	{
		 rval = this.createNode('node_op', 'op_paramdef', vstack[ vstack.length - 1 ]); 
	}
	break;
	case 13:
	{
		rval = vstack[ vstack.length - 0 ];
	}
	break;
	case 14:
	{
		 rval = this.createNode('node_op', 'op_if', vstack[ vstack.length - 2 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 15:
	{
		 rval = this.createNode('node_op', 'op_if_else', vstack[ vstack.length - 4 ], vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 16:
	{
		 rval = this.createNode('node_op', 'op_while', vstack[ vstack.length - 2 ], vstack[ vstack.length - 0 ] ); 
	}
	break;
	case 17:
	{
		 rval = this.createNode('node_op', 'op_for', vstack[ vstack.length - 4 ], vstack[ vstack.length - 2 ] ); 
	}
	break;
	case 18:
	{
		 rval = this.createNode('node_op', 'op_use', vstack[ vstack.length - 2 ] ); 
	}
	break;
	case 19:
	{
		 rval = this.createNode('node_op', 'op_delete', vstack[ vstack.length - 1 ]); 
	}
	break;
	case 20:
	{
		 rval = this.createNode('node_op', 'op_return', vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 21:
	{
		 rval = this.createNode('node_op', 'op_assign', vstack[ vstack.length - 4 ], vstack[ vstack.length - 2 ] ); 
	}
	break;
	case 22:
	{
		 rval = this.createNode('node_op', 'op_property', vstack[ vstack.length - 6 ], vstack[ vstack.length - 4 ], vstack[ vstack.length - 2 ] ); 
	}
	break;
	case 23:
	{
		 rval = this.createNode('node_op', 'op_propnoob', vstack[ vstack.length - 4 ], vstack[ vstack.length - 2 ] ); 
	}
	break;
	case 24:
	{
		 rval = this.createNode('node_op', 'op_noassign', vstack[ vstack.length - 2 ] ); 
	}
	break;
	case 25:
	{
		 rval = vstack[ vstack.length - 2 ]; 
	}
	break;
	case 26:
	{
		 rval = this.createNode('node_op', 'op_none' ); 
	}
	break;
	case 27:
	{
		 rval = this.createNode('node_op', 'op_equ', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 28:
	{
		 rval = this.createNode('node_op', 'op_lot', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 29:
	{
		 rval = this.createNode('node_op', 'op_grt', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 30:
	{
		 rval = this.createNode('node_op', 'op_loe', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 31:
	{
		 rval = this.createNode('node_op', 'op_gre', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 32:
	{
		 rval = this.createNode('node_op', 'op_neq', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 33:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 34:
	{
		 rval = this.createNode('node_op', 'op_sub', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 35:
	{
		 rval = this.createNode('node_op', 'op_add', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 36:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 37:
	{
		 rval = this.createNode('node_op', 'op_mul', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 38:
	{
		 rval = this.createNode('node_op', 'op_div', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 39:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 40:
	{
		 rval = this.createNode('node_op', 'op_neg', vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 41:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 42:
	{
		 rval = this.createNode('node_op', 'op_extvalue', vstack[ vstack.length - 4 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 43:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 44:
	{
		 rval = this.createNode('node_const', vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 45:
	{
		 rval = this.createNode('node_const', vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 46:
	{
		 rval = this.createNode('node_var', vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 47:
	{
		 rval = vstack[ vstack.length - 2 ]; 
	}
	break;
	case 48:
	{
		 rval = this.createNode('node_str', vstack[ vstack.length - 1 ]); 
	}
	break;
	case 49:
	{
		 rval = this.createNode('node_op', 'op_execfun', vstack[ vstack.length - 4 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 50:
	{
		 rval = this.createNode('node_op', 'op_execfun', vstack[ vstack.length - 7 ], vstack[ vstack.length - 5 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 51:
	{
		 rval = this.createNode('node_op', 'op_function', vstack[ vstack.length - 5 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 52:
	{
		 rval = this.createNode('node_method', 'x', vstack[ vstack.length - 2 ]); 
	}
	break;
	case 53:
	{
		 rval = this.createNode('node_method', 'y', vstack[ vstack.length - 2 ]); 
	}
	break;
	case 54:
	{
		 rval = this.createNode('node_property', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 55:
	{
		 rval = this.createNode('node_op', 'op_method', vstack[ vstack.length - 6 ], vstack[ vstack.length - 4 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 56:
	{
		 rval = this.createNode('node_op', 'op_proplst_val', vstack[ vstack.length - 2 ]); 
	}
	break;
	case 57:
	{
		 rval = this.createNode('node_op', 'op_array', vstack[ vstack.length - 2 ]); 
	}
	break;
	case 58:
	{
		 rval = this.createNode('node_const_bool', vstack[ vstack.length - 1 ] ); 
	}
	break;
	case 59:
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


