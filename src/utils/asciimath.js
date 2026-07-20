/*
    Copyright 2008-2025
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Andreas Walter,
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
    the MIT License along with JSXGraph. If not, see <https://www.gnu.org/licenses/>
    and <https://opensource.org/licenses/MIT/>.
 */


/*
    This page is adopted from https://github.com/asciimath/asciimathml 
    The original copyright notification follows:
        

    ASCIIMathML.js
    ==============
    
    Version 2.4 April 13 2026.
    Latest version at https://github.com/asciimath/asciimathml
    If you use it on a webpage, please send the URL to jipsen@chapman.edu
    
    Copyright (c) 2014 Peter Jipsen and other ASCIIMathML.js contributors
    
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    
    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
    */
    
    
    



/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/**
 * @fileoverview This file contains a library for rendering ASCIIMath to MathML.
 */

import JXG from "../jxg.js";

// AsciiMath namespace
JXG.AsciiMath = JXG.AsciiMath || {};


/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/**
 * @fileoverview This file contains a library for rendering ASCIIMath.
 * There are two classes:  AMNode andJXG.AMserver.  OnlyJXG.AMserver is exposed.
 */


let CONST = 0, UNARY = 1, BINARY = 2, INFIX = 3, LEFTBRACKET = 4, RIGHTBRACKET = 5, SPACE = 6, UNDEROVER = 7, DEFINITION = 8, LEFTRIGHT = 9, TEXT = 10, BIG = 11, LONG = 12, STRETCHY = 13, MATRIX = 14, UNARYUNDEROVER = 15; // token type[
let AMquote = { input: "\"", tag: "mtext", output: "mbox", tex: null, ttype: TEXT };
let fixphi = true; //false to return to legacy phi/varphi mapping

const AMNode = {

    appendChild(frag) {
        if (frag.nodeName === '') { // document fragment, don't copy head=
            for (let i = 0; i < frag.childNodes.length; i++) {
                this.childNodes.push(frag.childNodes[i]);
                if (frag.childNodes[i].nodeName !== '#text') {
                    this.children.push(frag.childNodes[i]);
                    frag.childNodes[i].parent = this;
                }
            }
            frag.childNodes = [];
            frag.children = [];
        } else {
            if (frag.parent !== null) { // if frag was part of another frag, we remove it (appendChild is a move, not a copy)
                frag.parent.removeChild(frag);
            }
            frag.parent = this;
            this.childNodes.push(frag); // includes any frag children
            if (frag.nodeName !== '#text') // exclude text nodes from children
                this.children.push(frag);
        }
        return frag;
    },
    setAttribute(key, value) {
        this.attributes[key] = value;
        return this;
    },
    get firstChild() {
        if (this.childNodes.length > 0)
            return this.childNodes[0];
        throw new Error('No firstChild available');
    },
    get lastChild() {
        if (this.childNodes.length > 0)
            return this.childNodes.at(-1);
        throw new Error('No lastChild available');
    },
    get tagName() {
        return this.nodeName;
    },
    get nextSibling() {
        if (this.parent !== null) {
            for (let i = 0; i < this.parent.childNodes.length - 1; i++) { // don't check the last one, it has no siblings
                if (this.parent.childNodes[i].unique === this.unique) {
                    return this.parent.childNodes[i + 1];
                }
            }
        }
        return null;
    },
    hasChildNodes() {
        return this.childNodes.length > 0;
    },
    replaceChildren(x) {
        this.childNodes = [x];
        this.children = (x.nodeName !== '#text') ? [x] : [];
    },
    replaceChild(newChild, oldChild) {
        for (let i = 0; i < this.childNodes.length; i++) {
            if (oldChild.unique === this.childNodes[i].unique) {
                this.childNodes[i] = newChild; // just reassigns the pointer
            }
        }
        if (newChild.nodeName !== '#text' && newChild.nodeName !== '') { // fragments don't go into children
            for (let i = 0; i < this.children.length; i++) {
                if (oldChild.unique === this.children[i].unique) {
                    this.children[i] = newChild;
                }
            }
        }
        oldChild.parent = null;
        return oldChild;
    },
    removeChild(node) {
        let removed = false;
        for (let i = 0; i < this.childNodes.length; i++) {
            if (node.unique === this.childNodes[i].unique) { // ||
                this.childNodes.splice(i, 1); // preserves iterator sequence
                removed = true;
            }
        }
        if (!removed)
            throw new Error(`Failed to execute 'removeChild'. The node to be removed is not a child of this node.)`);
        for (let i = 0; i < this.children.length; i++) {
            if (node.unique === this.children[i].unique) {
                this.children.splice(i, 1);
            }
        }
        node.parent = null;
        return node;
    },
    /** turn a tree of AMNodes into an HTML string */
    flatten() {
        let html = '';
        let style = this.style.length > 0 ? ` style="${this.style}"` : '';
        if (this.nodeName !== '#text' && this.nodeName !== '') {
            let attributes = '';
            for (let [key, value] of Object.entries(this.attributes))
                attributes += ` ${key}="${value}"`;
            html += `<${this.nodeName}${attributes}${style}>`;
        }
        if (this.hasChildNodes() && this.firstChild.nodeName === '#text') {
            html += this.firstChild.nodeValue;
        } else if (this.hasChildNodes()) {
            for (let i = 0; i < this.children.length; i++) {
                html += this.children[i].flatten();
            }
        }
        html += `</${this.nodeName}>`;
        return html;
    },

    create(t, content = '') {
        const node = Object.create(AMNode)  // new object with all methods
        node.nodeValue = '';
        node.parent = null;
        node.childNodes = [];
        node.children = [];
        node.attributes = {};
        node.style = '';
        node.nodeName = t;
        node.nodeValue = content;
        node.unique = Symbol();
        return node;
    }
}

JXG.AMserver = {

    // <mstyleJXG.AMserver.mathcolor="blue" fontsize="1em" mathsize="1em" fontfamily="serif" mathvariant="serif" displaystyle="true"><mrow><mo>[</mo><mtable columnlines="none none"><mtr><mtd><mi>a</mi></mtd><mtd><mi>b</mi></mtd></mtr></mtable><mo>]</mo></mrow></mstyle>
    mathcolor: "blue", // change it to "" (to inherit) or another color
    mathfontsize: "1em", // change to e.g. 1.2em for larger math
    mathfontfamily: "serif", // change to "" to inherit (works in IE)
    AMmathml: "http://www.w3.org/1998/Math/MathML",
    AMnestingDepth: 0,
    AMpreviousSymbol: -1, // eg: INFIX
    AMcurrentSymbol: -1,
    AMnames: [], //list of input symbols
    displaystyle: true, // puts limits above and below large operators
    showasciiformulaonhover: false, // helps students learn ASCIIMath
    listseparator: ",", // when decimalsign="," you can opt to use "," as listseparator
    decimalsign: ".", // if "," then when writing lists or matrices put
    addmathvariant: false, // true to add mathvariant on font changes.
    cancelColor: 'red', // sets default color for cancel


    // unicode characters for math variants. Alpha, alpha, numbers, Greek, greek, special mappings
    codemaps: {
        'script': [0x1D49C, 0x1D4B6, null, null, null, {
            0x42: 0x212C, 0x45: 0x2130, 0x46: 0x2131,
            0x48: 0x210B, 0x49: 0x2110, 0x4C: 0x2112, 0x4D: 0x2133, 0x52: 0x211B, 0x65: 0x212F,
            0x67: 0x210A, 0x6F: 0x2134
        }],
        'bold-script': [0x1D4D0, 0x1D4EA],
        'fraktur': [0x1D504, 0x1D51E, null, null, null, {
            0x43: 0x212D, 0x48: 0x210C, 0x49: 0x2111, 0x52: 0x211C, 0x5A: 0x2128,
        }],
        'bold-fraktur': [0x1D56C, 0x1D586],
        'double-struck': [0x1D538, 0x1D552, 0x1D7D8, null, null, {
            0x43: 0x2102, 0x48: 0x210D, 0x4E: 0x2115, 0x50: 0x2119, 0x51: 0x211A, 0x52: 0x211D,
            0x5A: 0x2124, 0x393: 0x213E, 0x3A0: 0x213F, 0x3B3: 0x213D, 0x3C0: 0x213C,
        }],
        'bold': [0x1D400, 0x1D41A, 0x1D7CE, 0x1D6A8, 0x1D6C2],
        'italic': [0x1D434, 0x1D44E, null, 0x1D6E2, 0x1D6FC, { 0x68: 0x210E }],
        'bold-italic': [0x1D468, 0x1D482, null, 0x1D71C, 0x1D736],
        'sans-serif': [0x1D5A0, 0x1D5BA, 0x1D7E2],
        'sans-serif-italic': [0x1D608, 0x1D622, 0x1D7E2],
        'bold-sans-serif': [0x1D5D4, 0x1D5EE, 0x1D7EC, 0x1D756, 0x1D770],
        'sans-serif-bold-italic': [0x1D63C, 0x1D656, 0x1D7EC, 0x1D790, 0x1D7AA],
        'monospace': [0x1D670, 0x1D68A, 0x1D7F6]
    },
    // based on https://docs.mathjax.org/en/latest/advanced/synchronize/filters.html#converting-full-width-characters-to-ascii-equivalents
    codemapranges: [
        [0x41, 0x5A],
        [0x61, 0x7A],
        [0x30, 0x39],
        [0x391, 0x3A9, { 0x3F4: 0x3A2, 0x2207: 0x3AA }],
        [0x3B1, 0x3C9, {
            0x2202: 0x3CA, 0x3F5: 0x3CB, 0x3D1: 0x3CC,
            0x3F0: 0x3CD, 0x3D5: 0x3CE, 0x3F1: 0x3CF, 0x3D6: 0x3D0
        }],
    ],
    AMsymbols: [
        //some greek symbols
        { input: "alpha", tag: "mi", output: "\u03B1", tex: null, ttype: CONST },
        { input: "beta", tag: "mi", output: "\u03B2", tex: null, ttype: CONST },
        { input: "chi", tag: "mi", output: "\u03C7", tex: null, ttype: CONST },
        { input: "delta", tag: "mi", output: "\u03B4", tex: null, ttype: CONST },
        { input: "Delta", tag: "mo", output: "\u0394", tex: null, ttype: CONST },
        { input: "epsi", tag: "mi", output: "\u03B5", tex: "epsilon", ttype: CONST },
        { input: "varepsilon", tag: "mi", output: "\u025B", tex: null, ttype: CONST },
        { input: "eta", tag: "mi", output: "\u03B7", tex: null, ttype: CONST },
        { input: "gamma", tag: "mi", output: "\u03B3", tex: null, ttype: CONST },
        { input: "Gamma", tag: "mo", output: "\u0393", tex: null, ttype: CONST },
        { input: "iota", tag: "mi", output: "\u03B9", tex: null, ttype: CONST },
        { input: "kappa", tag: "mi", output: "\u03BA", tex: null, ttype: CONST },
        { input: "lambda", tag: "mi", output: "\u03BB", tex: null, ttype: CONST },
        { input: "Lambda", tag: "mo", output: "\u039B", tex: null, ttype: CONST },
        { input: "lamda", tag: "mi", output: "\u03BB", tex: null, ttype: CONST },
        { input: "Lamda", tag: "mo", output: "\u039B", tex: null, ttype: CONST },
        { input: "mu", tag: "mi", output: "\u03BC", tex: null, ttype: CONST },
        { input: "nu", tag: "mi", output: "\u03BD", tex: null, ttype: CONST },
        { input: "omega", tag: "mi", output: "\u03C9", tex: null, ttype: CONST },
        { input: "Omega", tag: "mo", output: "\u03A9", tex: null, ttype: CONST },
        { input: "phi", tag: "mi", output: fixphi ? "\u03D5" : "\u03C6", tex: null, ttype: CONST },
        { input: "varphi", tag: "mi", output: fixphi ? "\u03C6" : "\u03D5", tex: null, ttype: CONST },
        { input: "Phi", tag: "mo", output: "\u03A6", tex: null, ttype: CONST },
        { input: "pi", tag: "mi", output: "\u03C0", tex: null, ttype: CONST },
        { input: "Pi", tag: "mo", output: "\u03A0", tex: null, ttype: CONST },
        { input: "psi", tag: "mi", output: "\u03C8", tex: null, ttype: CONST },
        { input: "Psi", tag: "mi", output: "\u03A8", tex: null, ttype: CONST },
        { input: "rho", tag: "mi", output: "\u03C1", tex: null, ttype: CONST },
        { input: "sigma", tag: "mi", output: "\u03C3", tex: null, ttype: CONST },
        { input: "Sigma", tag: "mo", output: "\u03A3", tex: null, ttype: CONST },
        { input: "tau", tag: "mi", output: "\u03C4", tex: null, ttype: CONST },
        { input: "theta", tag: "mi", output: "\u03B8", tex: null, ttype: CONST },
        { input: "vartheta", tag: "mi", output: "\u03D1", tex: null, ttype: CONST },
        { input: "Theta", tag: "mo", output: "\u0398", tex: null, ttype: CONST },
        { input: "upsilon", tag: "mi", output: "\u03C5", tex: null, ttype: CONST },
        { input: "xi", tag: "mi", output: "\u03BE", tex: null, ttype: CONST },
        { input: "Xi", tag: "mo", output: "\u039E", tex: null, ttype: CONST },
        { input: "zeta", tag: "mi", output: "\u03B6", tex: null, ttype: CONST },
        //binary operation symbols
        //{input:"-",  tag:"mo", output:"\u0096", tex:null, ttype:CONST},
        { input: "*", tag: "mo", output: "\u22C5", tex: "cdot", ttype: CONST },
        { input: "**", tag: "mo", output: "\u2217", tex: "ast", ttype: CONST },
        { input: "***", tag: "mo", output: "\u22C6", tex: "star", ttype: CONST },
        { input: "//", tag: "mo", output: "/", tex: null, ttype: CONST },
        { input: "\\\\", tag: "mo", output: "\\", tex: "backslash", ttype: CONST },
        { input: "setminus", tag: "mo", output: "\\", tex: null, ttype: CONST },
        { input: "xx", tag: "mo", output: "\u00D7", tex: "times", ttype: CONST },
        { input: "|><", tag: "mo", output: "\u22C9", tex: "ltimes", ttype: CONST },
        { input: "><|", tag: "mo", output: "\u22CA", tex: "rtimes", ttype: CONST },
        { input: "|><|", tag: "mo", output: "\u22C8", tex: "bowtie", ttype: CONST },
        { input: "-:", tag: "mo", output: "\u00F7", tex: "div", ttype: CONST },
        { input: "divide", tag: "mo", output: "-:", tex: null, ttype: DEFINITION },
        { input: "@", tag: "mo", output: "\u2218", tex: "circ", ttype: CONST },
        { input: "o+", tag: "mo", output: "\u2295", tex: "oplus", ttype: CONST },
        { input: "o-", tag: "mo", output: "\u2296", tex: "ominus", ttype: CONST },
        { input: "ox", tag: "mo", output: "\u2297", tex: "otimes", ttype: CONST },
        { input: "o.", tag: "mo", output: "\u2299", tex: "odot", ttype: CONST },
        { input: "sum", tag: "mo", output: "\u2211", tex: null, ttype: UNDEROVER },
        { input: "prod", tag: "mo", output: "\u220F", tex: null, ttype: UNDEROVER },
        { input: "^^", tag: "mo", output: "\u2227", tex: "wedge", ttype: CONST },
        { input: "^^^", tag: "mo", output: "\u22C0", tex: "bigwedge", ttype: UNDEROVER },
        { input: "vv", tag: "mo", output: "\u2228", tex: "vee", ttype: CONST },
        { input: "vvv", tag: "mo", output: "\u22C1", tex: "bigvee", ttype: UNDEROVER },
        { input: "nn", tag: "mo", output: "\u2229", tex: "cap", ttype: CONST },
        { input: "nnn", tag: "mo", output: "\u22C2", tex: "bigcap", ttype: UNDEROVER },
        { input: "uu", tag: "mo", output: "\u222A", tex: "cup", ttype: CONST },
        { input: "uuu", tag: "mo", output: "\u22C3", tex: "bigcup", ttype: UNDEROVER },
        { input: "dag", tag: "mo", output: "\u2020", tex: "dagger", ttype: CONST },
        { input: "ddag", tag: "mo", output: "\u2021", tex: "ddagger", ttype: CONST },
        //binary relation symbols
        { input: "!=", tag: "mo", output: "\u2260", tex: "ne", ttype: CONST },
        { input: ":=", tag: "mo", output: ":=", tex: null, ttype: CONST },
        { input: "lt", tag: "mo", output: "<", tex: null, ttype: CONST },
        { input: "<=", tag: "mo", output: "\u2264", tex: "le", ttype: CONST },
        { input: "lt=", tag: "mo", output: "\u2264", tex: "leq", ttype: CONST },
        { input: "gt", tag: "mo", output: ">", tex: null, ttype: CONST },
        { input: "mlt", tag: "mo", output: "\u226A", tex: "ll", ttype: CONST },
        { input: ">=", tag: "mo", output: "\u2265", tex: "ge", ttype: CONST },
        { input: "gt=", tag: "mo", output: "\u2265", tex: "geq", ttype: CONST },
        { input: "mgt", tag: "mo", output: "\u226B", tex: "gg", ttype: CONST },
        { input: "-<", tag: "mo", output: "\u227A", tex: "prec", ttype: CONST },
        { input: "-lt", tag: "mo", output: "\u227A", tex: null, ttype: CONST },
        { input: ">-", tag: "mo", output: "\u227B", tex: "succ", ttype: CONST },
        { input: "-<=", tag: "mo", output: "\u2AAF", tex: "preceq", ttype: CONST },
        { input: ">-=", tag: "mo", output: "\u2AB0", tex: "succeq", ttype: CONST },
        { input: "in", tag: "mo", output: "\u2208", tex: null, ttype: CONST },
        { input: "!in", tag: "mo", output: "\u2209", tex: "notin", ttype: CONST },
        { input: "sub", tag: "mo", output: "\u2282", tex: "subset", ttype: CONST },
        { input: "!sub", tag: "mo", output: "\u2284", tex: "not\\subset", ttype: CONST },
        { input: "notsubset", tag: "mo", output: "!sub", tex: null, ttype: DEFINITION },
        { input: "sup", tag: "mo", output: "\u2283", tex: "supset", ttype: CONST },
        { input: "!sup", tag: "mo", output: "\u2285", tex: "not\\supset", ttype: CONST },
        { input: "notsupset", tag: "mo", output: "!sup", tex: null, ttype: DEFINITION },
        { input: "sube", tag: "mo", output: "\u2286", tex: "subseteq", ttype: CONST },
        { input: "!sube", tag: "mo", output: "\u2288", tex: "not\\subseteq", ttype: CONST },
        { input: "notsubseteq", tag: "mo", output: "!sube", tex: null, ttype: DEFINITION },
        { input: "supe", tag: "mo", output: "\u2287", tex: "supseteq", ttype: CONST },
        { input: "!supe", tag: "mo", output: "\u2289", tex: "not\\supseteq", ttype: CONST },
        { input: "notsupseteq", tag: "mo", output: "!supe", tex: null, ttype: DEFINITION },
        { input: "-=", tag: "mo", output: "\u2261", tex: "equiv", ttype: CONST },
        { input: "!-=", tag: "mo", output: "\u2262", tex: "not\\equiv", ttype: CONST },
        { input: "notequiv", tag: "mo", output: "!-=", tex: null, ttype: DEFINITION },
        { input: "~=", tag: "mo", output: "\u2245", tex: "cong", ttype: CONST },
        { input: "~~", tag: "mo", output: "\u2248", tex: "approx", ttype: CONST },
        { input: "~", tag: "mo", output: "\u223C", tex: "sim", ttype: CONST },
        { input: "prop", tag: "mo", output: "\u221D", tex: "propto", ttype: CONST },
        //logical symbols
        { input: "and", tag: "mtext", output: "and", tex: null, ttype: SPACE },
        { input: "or", tag: "mtext", output: "or", tex: null, ttype: SPACE },
        { input: "not", tag: "mo", output: "\u00AC", tex: "neg", ttype: CONST },
        { input: "=>", tag: "mo", output: "\u21D2", tex: "implies", ttype: CONST },
        { input: "if", tag: "mo", output: "if", tex: null, ttype: SPACE },
        { input: "<=>", tag: "mo", output: "\u21D4", tex: "iff", ttype: CONST },
        { input: "AA", tag: "mo", output: "\u2200", tex: "forall", ttype: CONST },
        { input: "EE", tag: "mo", output: "\u2203", tex: "exists", ttype: CONST },
        { input: "_|_", tag: "mo", output: "\u22A5", tex: "bot", ttype: CONST },
        { input: "TT", tag: "mo", output: "\u22A4", tex: "top", ttype: CONST },
        { input: "|--", tag: "mo", output: "\u22A2", tex: "vdash", ttype: CONST },
        { input: "|==", tag: "mo", output: "\u22A8", tex: "models", ttype: CONST },
        //grouping brackets
        { input: "(", tag: "mo", output: "(", tex: "left(", ttype: LEFTBRACKET },
        { input: ")", tag: "mo", output: ")", tex: "right)", ttype: RIGHTBRACKET },
        { input: "[", tag: "mo", output: "[", tex: "left[", ttype: LEFTBRACKET },
        { input: "]", tag: "mo", output: "]", tex: "right]", ttype: RIGHTBRACKET },
        { input: "{", tag: "mo", output: "{", tex: null, ttype: LEFTBRACKET },
        { input: "}", tag: "mo", output: "}", tex: null, ttype: RIGHTBRACKET },
        { input: "|", tag: "mo", output: "|", tex: null, ttype: LEFTRIGHT },
        { input: ":|:", tag: "mo", output: "|", tex: null, ttype: CONST },
        { input: "|:", tag: "mo", output: "|", tex: null, ttype: LEFTBRACKET },
        { input: ":|", tag: "mo", output: "|", tex: null, ttype: RIGHTBRACKET },
        //{input:"||", tag:"mo", output:"||", tex:null, ttype:LEFTRIGHT},
        { input: "(:", tag: "mo", output: "\u2329", tex: "langle", ttype: LEFTBRACKET },
        { input: ":)", tag: "mo", output: "\u232A", tex: "rangle", ttype: RIGHTBRACKET },
        { input: "<<", tag: "mo", output: "\u2329", tex: null, ttype: LEFTBRACKET },
        { input: ">>", tag: "mo", output: "\u232A", tex: null, ttype: RIGHTBRACKET },
        { input: "{:", tag: "mo", output: "{:", tex: null, ttype: LEFTBRACKET, invisible: true },
        { input: ":}", tag: "mo", output: ":}", tex: null, ttype: RIGHTBRACKET, invisible: true },
        //miscellaneous symbols
        { input: "int", tag: "mo", output: "\u222B", tex: null, ttype: CONST },
        { input: "dx", tag: "mi", output: "{:d x:}", tex: null, ttype: DEFINITION },
        { input: "dy", tag: "mi", output: "{:d y:}", tex: null, ttype: DEFINITION },
        { input: "dz", tag: "mi", output: "{:d z:}", tex: null, ttype: DEFINITION },
        { input: "dt", tag: "mi", output: "{:d t:}", tex: null, ttype: DEFINITION },
        { input: "oint", tag: "mo", output: "\u222E", tex: null, ttype: CONST },
        { input: "del", tag: "mo", output: "\u2202", tex: "partial", ttype: CONST },
        { input: "grad", tag: "mo", output: "\u2207", tex: "nabla", ttype: CONST },
        { input: "+-", tag: "mo", output: "\u00B1", tex: "pm", ttype: CONST },
        { input: "-+", tag: "mo", output: "\u2213", tex: "mp", ttype: CONST },
        { input: "O/", tag: "mo", output: "\u2205", tex: "emptyset", ttype: CONST },
        { input: "oo", tag: "mo", output: "\u221E", tex: "infty", ttype: CONST },
        { input: "aleph", tag: "mo", output: "\u2135", tex: null, ttype: CONST },
        { input: "...", tag: "mo", output: "...", tex: "ldots", ttype: CONST },
        { input: ":.", tag: "mo", output: "\u2234", tex: "therefore", ttype: CONST },
        { input: ":'", tag: "mo", output: "\u2235", tex: "because", ttype: CONST },
        { input: "/_", tag: "mo", output: "\u2220", tex: "angle", ttype: CONST },
        { input: "/_\\", tag: "mo", output: "\u25B3", tex: "triangle", ttype: CONST },
        { input: "'", tag: "mo", output: "\u2032", tex: "prime", ttype: CONST },
        { input: "tilde", tag: "mover", output: "~", tex: null, ttype: UNARY, acc: true },
        { input: "\\ ", tag: "mo", output: "\u00A0", tex: null, ttype: CONST },
        { input: "frown", tag: "mo", output: "\u2322", tex: null, ttype: CONST },
        { input: "quad", tag: "mspace", output: "1", tex: null, ttype: CONST },
        { input: "qquad", tag: "mspace", output: "2", tex: null, ttype: CONST },
        { input: "enspace", tag: "mspace", output: "0.5", tex: null, ttype: CONST },
        { input: "thinspace", tag: "mspace", output: "0.17", tex: null, ttype: CONST },
        { input: "mspace", tag: "mspace", output: "mspace", tex: null, ttype: TEXT },
        { input: "vdots", tag: "mo", output: "\u22EE", tex: null, ttype: CONST },
        { input: "ddots", tag: "mo", output: "\u22F1", tex: null, ttype: CONST },
        { input: "diamond", tag: "mo", output: "\u22C4", tex: null, ttype: CONST },
        { input: "square", tag: "mo", output: "\u25A1", tex: null, ttype: CONST },
        { input: "|__", tag: "mo", output: "\u230A", tex: "lfloor", ttype: CONST },
        { input: "__|", tag: "mo", output: "\u230B", tex: "rfloor", ttype: CONST },
        { input: "|~", tag: "mo", output: "\u2308", tex: "lceiling", ttype: CONST },
        { input: "~|", tag: "mo", output: "\u2309", tex: "rceiling", ttype: CONST },
        { input: "CC", tag: "mo", output: "\u2102", tex: null, ttype: CONST },
        { input: "NN", tag: "mo", output: "\u2115", tex: null, ttype: CONST },
        { input: "QQ", tag: "mo", output: "\u211A", tex: null, ttype: CONST },
        { input: "RR", tag: "mo", output: "\u211D", tex: null, ttype: CONST },
        { input: "ZZ", tag: "mo", output: "\u2124", tex: null, ttype: CONST },
        { input: "f", tag: "mi", output: "f", tex: null, ttype: UNARY, func: true },
        { input: "g", tag: "mi", output: "g", tex: null, ttype: UNARY, func: true },
        { input: "hbar", tag: "mo", output: "\u210F", tex: null, ttype: CONST },
        //standard functions
        { input: "lim", tag: "mo", output: "lim", tex: null, ttype: UNDEROVER },
        { input: "Lim", tag: "mo", output: "Lim", tex: null, ttype: UNDEROVER },
        { input: "sin", tag: "mo", output: "sin", tex: null, ttype: UNARY, func: true },
        { input: "cos", tag: "mo", output: "cos", tex: null, ttype: UNARY, func: true },
        { input: "tan", tag: "mo", output: "tan", tex: null, ttype: UNARY, func: true },
        { input: "sinh", tag: "mo", output: "sinh", tex: null, ttype: UNARY, func: true },
        { input: "cosh", tag: "mo", output: "cosh", tex: null, ttype: UNARY, func: true },
        { input: "tanh", tag: "mo", output: "tanh", tex: null, ttype: UNARY, func: true },
        { input: "cot", tag: "mo", output: "cot", tex: null, ttype: UNARY, func: true },
        { input: "sec", tag: "mo", output: "sec", tex: null, ttype: UNARY, func: true },
        { input: "csc", tag: "mo", output: "csc", tex: null, ttype: UNARY, func: true },
        { input: "arcsin", tag: "mo", output: "arcsin", tex: null, ttype: UNARY, func: true },
        { input: "arccos", tag: "mo", output: "arccos", tex: null, ttype: UNARY, func: true },
        { input: "arctan", tag: "mo", output: "arctan", tex: null, ttype: UNARY, func: true },
        { input: "arcsec", tag: "mo", output: "arcsec", tex: null, ttype: UNARY, func: true },
        { input: "arccsc", tag: "mo", output: "arccsc", tex: null, ttype: UNARY, func: true },
        { input: "arccot", tag: "mo", output: "arccot", tex: null, ttype: UNARY, func: true },
        { input: "coth", tag: "mo", output: "coth", tex: null, ttype: UNARY, func: true },
        { input: "sech", tag: "mo", output: "sech", tex: null, ttype: UNARY, func: true },
        { input: "csch", tag: "mo", output: "csch", tex: null, ttype: UNARY, func: true },
        { input: "exp", tag: "mo", output: "exp", tex: null, ttype: UNARY, func: true },
        { input: "abs", tag: "mo", output: "abs", tex: null, ttype: UNARY, rewriteleftright: ["|", "|"] },
        { input: "norm", tag: "mo", output: "norm", tex: null, ttype: UNARY, rewriteleftright: ["\u2225", "\u2225"] },
        { input: "floor", tag: "mo", output: "floor", tex: null, ttype: UNARY, rewriteleftright: ["\u230A", "\u230B"] },
        { input: "ceil", tag: "mo", output: "ceil", tex: null, ttype: UNARY, rewriteleftright: ["\u2308", "\u2309"] },
        { input: "log", tag: "mo", output: "log", tex: null, ttype: UNARY, func: true },
        { input: "ln", tag: "mo", output: "ln", tex: null, ttype: UNARY, func: true },
        { input: "det", tag: "mo", output: "det", tex: null, ttype: UNARY, func: true },
        { input: "dim", tag: "mo", output: "dim", tex: null, ttype: CONST },
        { input: "mod", tag: "mo", output: "mod", tex: null, ttype: CONST },
        { input: "gcd", tag: "mo", output: "gcd", tex: null, ttype: UNARY, func: true },
        { input: "lcm", tag: "mo", output: "lcm", tex: null, ttype: UNARY, func: true },
        { input: "lub", tag: "mo", output: "lub", tex: null, ttype: CONST },
        { input: "glb", tag: "mo", output: "glb", tex: null, ttype: CONST },
        { input: "min", tag: "mo", output: "min", tex: null, ttype: UNDEROVER },
        { input: "max", tag: "mo", output: "max", tex: null, ttype: UNDEROVER },
        { input: "Sin", tag: "mo", output: "Sin", tex: null, ttype: UNARY, func: true },
        { input: "Cos", tag: "mo", output: "Cos", tex: null, ttype: UNARY, func: true },
        { input: "Tan", tag: "mo", output: "Tan", tex: null, ttype: UNARY, func: true },
        { input: "Arcsin", tag: "mo", output: "Arcsin", tex: null, ttype: UNARY, func: true },
        { input: "Arccos", tag: "mo", output: "Arccos", tex: null, ttype: UNARY, func: true },
        { input: "Arctan", tag: "mo", output: "Arctan", tex: null, ttype: UNARY, func: true },
        { input: "Sinh", tag: "mo", output: "Sinh", tex: null, ttype: UNARY, func: true },
        { input: "Cosh", tag: "mo", output: "Cosh", tex: null, ttype: UNARY, func: true },
        { input: "Tanh", tag: "mo", output: "Tanh", tex: null, ttype: UNARY, func: true },
        { input: "Cot", tag: "mo", output: "Cot", tex: null, ttype: UNARY, func: true },
        { input: "Sec", tag: "mo", output: "Sec", tex: null, ttype: UNARY, func: true },
        { input: "Csc", tag: "mo", output: "Csc", tex: null, ttype: UNARY, func: true },
        { input: "Log", tag: "mo", output: "Log", tex: null, ttype: UNARY, func: true },
        { input: "Ln", tag: "mo", output: "Ln", tex: null, ttype: UNARY, func: true },
        { input: "Abs", tag: "mo", output: "abs", tex: null, ttype: UNARY, notexcopy: true, rewriteleftright: ["|", "|"] },
        //arrows
        { input: "uarr", tag: "mo", output: "\u2191", tex: "uparrow", ttype: CONST },
        { input: "darr", tag: "mo", output: "\u2193", tex: "downarrow", ttype: CONST },
        { input: "rarr", tag: "mo", output: "\u2192", tex: "rightarrow", ttype: CONST },
        { input: "->", tag: "mo", output: "\u2192", tex: "to", ttype: CONST },
        { input: ">->", tag: "mo", output: "\u21A3", tex: "rightarrowtail", ttype: CONST },
        { input: "->>", tag: "mo", output: "\u21A0", tex: "twoheadrightarrow", ttype: CONST },
        { input: ">->>", tag: "mo", output: "\u2916", tex: "twoheadrightarrowtail", ttype: CONST },
        { input: "|->", tag: "mo", output: "\u21A6", tex: "mapsto", ttype: CONST },
        { input: "larr", tag: "mo", output: "\u2190", tex: "leftarrow", ttype: CONST },
        { input: "harr", tag: "mo", output: "\u2194", tex: "leftrightarrow", ttype: CONST },
        { input: "rArr", tag: "mo", output: "\u21D2", tex: "Rightarrow", ttype: CONST },
        { input: "lArr", tag: "mo", output: "\u21D0", tex: "Leftarrow", ttype: CONST },
        { input: "dArr", tag: "mo", output: "\u21D3", tex: "Downarrow", ttype: CONST },
        { input: "hArr", tag: "mo", output: "\u21D4", tex: "Leftrightarrow", ttype: CONST },
        { input: "rightleftharpoons", tag: "mo", output: "\u21CC", tex: null, ttype: CONST },
        //commands with argument
        { input: "sqrt", tag: "msqrt", output: "sqrt", tex: null, ttype: UNARY },
        { input: "root", tag: "mroot", output: "root", tex: null, ttype: BINARY },
        { input: "frac", tag: "mfrac", output: "/", tex: null, ttype: BINARY },
        { input: "/", tag: "mfrac", output: "/", tex: null, ttype: INFIX },
        { input: "stackrel", tag: "mover", output: "stackrel", tex: null, ttype: BINARY },
        { input: "overset", tag: "mover", output: "stackrel", tex: null, ttype: BINARY },
        { input: "underset", tag: "munder", output: "stackrel", tex: null, ttype: BINARY },
        { input: "_", tag: "msub", output: "_", tex: null, ttype: INFIX },
        { input: "^", tag: "msup", output: "^", tex: null, ttype: INFIX },
        { input: "hat", tag: "mover", output: "\u0302", tex: null, ttype: UNARY, acc: true },
        { input: "bar", tag: "mover", output: "\u00AF", tex: "overline", ttype: UNARY, acc: true },
        { input: "vec", tag: "mover", output: "\u2192", tex: null, ttype: UNARY, acc: true },
        { input: "dot", tag: "mover", output: ".", tex: null, ttype: UNARY, acc: true },
        { input: "ddot", tag: "mover", output: "..", tex: null, ttype: UNARY, acc: true },
        { input: "overarc", tag: "mover", output: "\u23DC", tex: "overparen", ttype: UNARY, acc: true },
        { input: "ul", tag: "munder", output: "\u0332", tex: "underline", ttype: UNARY, acc: true },
        { input: "ubrace", tag: "munder", output: "\u23DF", tex: "underbrace", ttype: UNARYUNDEROVER, acc: true },
        { input: "obrace", tag: "mover", output: "\u23DE", tex: "overbrace", ttype: UNARYUNDEROVER, acc: true },
        { input: "text", tag: "mtext", output: "text", tex: null, ttype: TEXT },
        { input: "mbox", tag: "mtext", output: "mbox", tex: null, ttype: TEXT },
        { input: "color", tag: "mrow", output: " ", ttype: BINARY },
        { input: "id", tag: "mrow", output: " ", ttype: BINARY },
        { input: "class", tag: "mrow", output: " ", ttype: BINARY },
        { input: "cancel", tag: "mrow", output: "cancel", tex: null, ttype: UNARY },
        AMquote,
        //TODO figure out why we require a space in 'output for these code commands to work
        { input: "bb", ttype: UNARY, tex: "mathbf", codes: "bold", tag: "", output: "bb" },
        { input: "sf", ttype: UNARY, tex: "mathsf", codes: "sans-serif", tag: "", output: "sf" },
        { input: "sfit", ttype: UNARY, tex: null, codes: "sans-serif-italic", tag: "", output: "sfit" },
        { input: "bbsf", ttype: UNARY, tex: null, codes: "bold-sans-serif", tag: "", output: "bbsf" },
        { input: "bbb", ttype: UNARY, tex: "mathbb", codes: "double-struck", tag: "", output: "bbb" },
        { input: "cc", ttype: UNARY, tex: "mathcal", codes: "script", tag: "", output: "cc" },
        { input: "bbcc", ttype: UNARY, tex: null, codes: "bold-script", tag: "", output: "bbcc" },
        { input: "tt", ttype: UNARY, tex: "mathtt", codes: "monospace", tag: "", output: "tt" },
        { input: "fr", ttype: UNARY, tex: "mathfrak", codes: "fraktur", tag: "", output: "fr" },
        { input: "bbfr", ttype: UNARY, tex: null, codes: "bold-fraktur", tag: "", output: "bbfr" },
        { input: "bbit", ttype: UNARY, tex: null, codes: "bold-italic", tag: "", output: "bbit" },
        { input: "bbsfit", ttype: UNARY, tex: null, codes: "sans-serif-bold-italic", tag: "", output: "bbsfit" },
        { input: "bold", tex: null, ttype: UNARY, codes: "bold", tag: "", output: "bold" },
    ],
    /*Parsing ASCII math expressions with the following grammar
    v ::= [A-Za-z] | greek letters | numbers | other constant symbols
    u ::= sqrt | text | bb | other unary symbols for font commands
    b ::= frac | root | stackrel         binary symbols
    l ::= ( | [ | { | (: | {:            left brackets
    r ::= ) | ] | } | :) | :}            right brackets
    S ::= v | lEr | uS | bSS             Simple expression
    I ::= S_S | S^S | S_S^S | S          Intermediate expression
    E ::= IE | I/I                       Expression
    Each terminal symbol is translated into a corresponding mathml node.*/

    constructor: () => {
       JXG.AMserver.initSymbols();
        returnJXG.AMserver;
    },

    cancelStyle: (color) => {
        return `
            padding-left:0.5em;
            padding-right:0.5em;
            background:linear-gradient(to top left,
                    white 0,
                    white calc(50% - 1px),
                    ${color},
                    white calc(50% + 1px)) `;
    },
    createMmlNode: (t, frag) => {
        let node = AMNode.create(t);
        if (frag) {
            node.appendChild(frag);
        }
        return node;
    },
    /** replaces document.createTextNode() */
    createTextNode: (content) => {
        let newNode = AMNode.create('#text', content);
        return newNode;
    },
    /** replaces document.createDocumentFragment() */
    createDocumentFragment: () => {
        let newNode = AMNode.create('');
        return newNode;
    },
    newcommand: (oldstr, newstr) => {
       JXG.AMserver.AMsymbols.push({ input: oldstr, tag: "mo", output: newstr, tex: null, ttype: DEFINITION });
       JXG.AMserver.refreshSymbols();
    },
    newsymbol: (symbolobj) => {
       JXG.AMserver.AMsymbols.push(symbolobj);
       JXG.AMserver.refreshSymbols();
    },
    compareNames: (s1, s2) => {
        if (s1.input > s2.input)
            return 1;
        else
            return -1;
    },
    initSymbols: () => {
        let i;
        let symlen =JXG.AMserver.AMsymbols.length;
        for (i = 0; i < symlen; i++) {
            if (JXG.AMserver.AMsymbols[i].tex) {
               JXG.AMserver.AMsymbols.push({
                    input: (JXG.AMserver.AMsymbols[i].tex),
                    tag:JXG.AMserver.AMsymbols[i].tag, output:JXG.AMserver.AMsymbols[i].output, ttype:JXG.AMserver.AMsymbols[i].ttype,
                    acc: (JXG.AMserver.AMsymbols[i].acc || false), codes: (JXG.AMserver.AMsymbols[i].codes || false)
                });
            }
        }
       JXG.AMserver.refreshSymbols();
    },
    refreshSymbols: () => {
        let i;
       JXG.AMserver.AMsymbols.sort(JXG.AMserver.compareNames);
        for (i = 0; i <JXG.AMserver.AMsymbols.length; i++)
           JXG.AMserver.AMnames[i] =JXG.AMserver.AMsymbols[i].input;
    },
    define: (oldstr, newstr) => {
       JXG.AMserver.AMsymbols.push({ input: oldstr, tag: "mo", output: newstr, tex: null, ttype: DEFINITION });
       JXG.AMserver.refreshSymbols(); // this may be a problem if many symbols are defined!
    },
    AMremoveCharsAndBlanks: (str, n) => {
        //remove n characters and any following blanks
        let st, i;
        if (str.charAt(n) == "\\" && str.charAt(n + 1) != "\\" && str.charAt(n + 1) != " ")
            st = str.slice(n + 1);
        else
            st = str.slice(n);
        for (i = 0; i < st.length && st.charCodeAt(i) <= 32; i = i + 1)
            ;
        return st.slice(i);
    },
    position: (arr, str, n) => {
        // return position >=n where str appears or would be inserted
        // assumes arr is sorted
        let i;
        if (n == 0) {
            let h, m;
            n = -1;
            h = arr.length;
            while (n + 1 < h) {
                m = (n + h) >> 1;
                if (arr[m] < str)
                    n = m;
                else
                    h = m;
            }
            return h;
        }
        else
            for (i = n; i < arr.length && arr[i] < str; i++)
                ;
        return i; // i=arr.length || arr[i]>=str
    },
    AMgetSymbol: (str) => {
        //return maximal initial substring of str that appears in names
        //return null if there is none
        let k = 0; //new pos
        let j = 0; //old pos
        let mk = -1; //match pos
        let st;
        let tagst;
        let match = "";
        let more = true;

        for (let i = 1; i <= str.length && more; i++) {
            st = str.slice(0, i); //initial substring of length i
            j = k;
            k =JXG.AMserver.position(JXG.AMserver.AMnames, st, j);
            if (k <JXG.AMserver.AMnames.length && str.slice(0,JXG.AMserver.AMnames[k].length) ==JXG.AMserver.AMnames[k]) {
                match =JXG.AMserver.AMnames[k];
                mk = k;
                i = match.length;
            }
            more = k <JXG.AMserver.AMnames.length && str.slice(0,JXG.AMserver.AMnames[k].length) >=JXG.AMserver.AMnames[k];
        }
       JXG.AMserver.AMpreviousSymbol =JXG.AMserver.AMcurrentSymbol;
        if (match != "") {
           JXG.AMserver.AMcurrentSymbol =JXG.AMserver.AMsymbols[mk].ttype;
            return JXG.AMserver.AMsymbols[mk];
        }
        // if str[0] is a digit or - return maxsubstring of digits.digits
       JXG.AMserver.AMcurrentSymbol = CONST;
        k = 1;
        let useddecimal = false;
        st = str.slice(0, 1);
        let integ = true;
        while ("0" <= st && st <= "9" && k <= str.length) {
            st = str.slice(k, k + 1);
            k++;
        }
        if (st ==JXG.AMserver.decimalsign) {
            st = str.slice(k, k + 1);
            if (k > 1 && (JXG.AMserver.decimalsign !=JXG.AMserver.listseparator || st != " ") && k < str.length) {
                k++;
                useddecimal = true;
            }
            if ("0" <= st && st <= "9") {
                integ = false;
                if (!useddecimal) {
                    k++;
                }
                while ("0" <= st && st <= "9" && k <= str.length) {
                    st = str.slice(k, k + 1);
                    k++;
                }
            }
        }
        if ((integ && k > 1) || k > 2) {
            st = str.slice(0, k - 1);
            tagst = "mn";
        }
        else {
            k = 2;
            st = str.slice(0, 1); //take 1 character
            tagst = (("A" > st || st > "Z") && ("a" > st || st > "z")) ? "mo" : "mi";
        }
        if (st == "-" && str.charAt(1) !== ' ' &&JXG.AMserver.AMpreviousSymbol == INFIX) {
           JXG.AMserver.AMcurrentSymbol = INFIX; //trick "/" into recognizing "-" on second parse
            return { input: st, tag: tagst, output: st == "-" ? "\u2212" : st, ttype: UNARY, func: true };
        }
        return { input: st, tag: tagst, output: st == "-" ? "\u2212" : st, ttype: CONST };
    },
    AMremoveBrackets: (node) => {
        let st;
        // inserted lots of ! overrides because if hasChildNodes() is true then firstChild and lastChild must exist
        if (!node.hasChildNodes()) {
            return;
        }
        if (node.firstChild.hasChildNodes() && (node.nodeName == "mrow" || node.nodeName == "M:MROW")) {
            if (node.firstChild.nextSibling && node.firstChild.nextSibling.nodeName == "mtable") {
                return;
            }
            st = node.firstChild.firstChild.nodeValue;
            if (st == "(" || st == "[" || st == "{")
                node.removeChild(node.firstChild);
        }
        if (node.lastChild.hasChildNodes() && (node.nodeName == "mrow" || node.nodeName == "M:MROW")) {
            st = node.lastChild.firstChild.nodeValue;
            if (st == ")" || st == "]" || st == "}") {
                node.removeChild(node.lastChild);
            }
        }
    },
    AMparseSexpr: (str) => {
        let symbol, node, result, i, st; // rightvert = false,
        str =JXG.AMserver.AMremoveCharsAndBlanks(str, 0);
        symbol =JXG.AMserver.AMgetSymbol(str); //either a token or a bracket or empty
        if (symbol == null || symbol.ttype == RIGHTBRACKET &&JXG.AMserver.AMnestingDepth > 0) {
            return [JXG.AMserver.createTextNode(' '), str]; // a bit of a hack, can't return null anymore
        }
        let newFrag =JXG.AMserver.createDocumentFragment();
        if (symbol.ttype == DEFINITION) {
            str = symbol.output +JXG.AMserver.AMremoveCharsAndBlanks(str, symbol.input.length);
            symbol =JXG.AMserver.AMgetSymbol(str);
        }
        switch (symbol.ttype) {
            case UNDEROVER:
            case CONST:
                str =JXG.AMserver.AMremoveCharsAndBlanks(str, symbol.input.length);
                if (symbol.tag === 'mspace') {
                    node =JXG.AMserver.createMmlNode(symbol.tag);
                    node.setAttribute("width", symbol.output + "em");
                    return [node, str];
                }
                else {
                    return [JXG.AMserver.createMmlNode(symbol.tag, //its a constant
                       JXG.AMserver.createTextNode(symbol.output)), str];
                }
            case LEFTBRACKET: //read (expr+)
               JXG.AMserver.AMnestingDepth++;
                str =JXG.AMserver.AMremoveCharsAndBlanks(str, symbol.input.length);
                result =JXG.AMserver.AMparseExpr(str, true);
               JXG.AMserver.AMnestingDepth--;
                if (typeof symbol.invisible == "boolean" && symbol.invisible)
                    node =JXG.AMserver.createMmlNode("mrow", result[0]);
                else {
                    node =JXG.AMserver.createMmlNode("mo",JXG.AMserver.createTextNode(symbol.output));
                    node =JXG.AMserver.createMmlNode("mrow", node);
                    node.appendChild(result[0]);
                }
                return [node, result[1]];
            case TEXT:
                if (symbol != AMquote)
                    str =JXG.AMserver.AMremoveCharsAndBlanks(str, symbol.input.length);
                if (str.charAt(0) == "{")
                    i = str.indexOf("}");
                else if (str.charAt(0) == "(")
                    i = str.indexOf(")");
                else if (str.charAt(0) == "[")
                    i = str.indexOf("]");
                else if (symbol == AMquote)
                    i = str.slice(1).indexOf("\"") + 1;
                else
                    i = 0;
                if (i == -1)
                    i = str.length;
                st = str.slice(1, i);
                if (symbol.input === 'mspace') { // special case
                    let m = st.match(/^(-?[\d\.]+)\s*(em|mu)?$/);
                    if (!m) {
                        st = "0em";
                    }
                    else if (!m[2] || m[2] == "mu") {
                        st = (parseInt(m[1]) / 16) + "em";
                    }
                    node =JXG.AMserver.createMmlNode(symbol.tag);
                    node.setAttribute("width", st);
                    str =JXG.AMserver.AMremoveCharsAndBlanks(str, i + 1);
                    return [node, str];
                }
                if (st.charAt(0) == " ") {
                    node =JXG.AMserver.createMmlNode("mspace");
                    node.setAttribute("width", "1ex");
                    newFrag.appendChild(node);
                }
                newFrag.appendChild(JXG.AMserver.createMmlNode(symbol.tag,JXG.AMserver.createTextNode(st)));
                if (st.charAt(st.length - 1) == " ") {
                    node =JXG.AMserver.createMmlNode("mspace");
                    node.setAttribute("width", "1ex");
                    newFrag.appendChild(node);
                }
                str =JXG.AMserver.AMremoveCharsAndBlanks(str, i + 1);
                return [JXG.AMserver.createMmlNode("mrow", newFrag), str];
            case UNARYUNDEROVER:
            case UNARY:
                str =JXG.AMserver.AMremoveCharsAndBlanks(str, symbol.input.length);
                result =JXG.AMserver.AMparseSexpr(str);
                if (result[0] == null) {
                    if (symbol.tag == "mi" || symbol.tag == "mo") {
                        return [JXG.AMserver.createMmlNode(symbol.tag,JXG.AMserver.createTextNode(symbol.output)), str];
                    }
                    else {
                        result[0] =JXG.AMserver.createMmlNode("mi");
                    }
                }
                if (typeof symbol.func == "boolean" && symbol.func) { // functions hack
                    st = str.charAt(0);
                    if (st == "^" || st == "_" || st == "/" || st == "|" || st ==JXG.AMserver.listseparator ||
                        (symbol.input.length == 1 && symbol.input.match(/\w/) && st != "(")) {
                        return [JXG.AMserver.createMmlNode(symbol.tag,JXG.AMserver.createTextNode(symbol.output)), str];
                    }
                    else {
                        node =JXG.AMserver.createMmlNode("mrow",JXG.AMserver.createMmlNode(symbol.tag,JXG.AMserver.createTextNode(symbol.output)));
                        node.appendChild(result[0]);
                        return [node, result[1]];
                    }
                }
               JXG.AMserver.AMremoveBrackets(result[0]);
                if (symbol.input == "sqrt") { // sqrt
                    return [JXG.AMserver.createMmlNode(symbol.tag, result[0]), result[1]];
                }
                else if (typeof symbol.rewriteleftright != "undefined") { // abs, floor, ceil
                    node =JXG.AMserver.createMmlNode("mrow",JXG.AMserver.createMmlNode("mo",JXG.AMserver.createTextNode(symbol.rewriteleftright[0])));
                    node.appendChild(result[0]);
                    node.appendChild(JXG.AMserver.createMmlNode("mo",JXG.AMserver.createTextNode(symbol.rewriteleftright[1])));
                    return [node, result[1]];
                }
                else if (symbol.input == "cancel") { // cancel
                    node =JXG.AMserver.createMmlNode(symbol.tag, result[0]);
                    node.style +=JXG.AMserver.cancelStyle(JXG.AMserver.cancelColor);
                    return [node, result[1]];
                }
                else if (typeof symbol.acc == "boolean" && symbol.acc) { // accent
                    node =JXG.AMserver.createMmlNode(symbol.tag, result[0]);
                    if (symbol.tag == 'mover' && symbol.ttype == UNARY) {
                        node.setAttribute("accent", "true");
                    }
                    else if (symbol.tag == 'munder' && symbol.ttype == UNARY) {
                        node.setAttribute("accentunder", "true");
                    }
                    let accnode =JXG.AMserver.createMmlNode("mo",JXG.AMserver.createTextNode(symbol.output));
                    if (symbol.input == "vec" && ((result[0].nodeName == "mrow" && result[0].childNodes.length == 1
                        && result[0].firstChild.firstChild.nodeValue !== null
                        && result[0].firstChild.firstChild.nodeValue.length == 1) ||
                        (result[0].firstChild && result[0].firstChild.nodeValue !== null
                            && result[0].firstChild.nodeValue.length == 1))) {
                        // special case of single character base for vector accent,
                        // where stretchy can make it look bad
                        accnode.setAttribute("stretchy", false);
                    }
                    else {
                        accnode.setAttribute("stretchy", true);
                    }
                    node.appendChild(accnode);
                    return [node, result[1]];
                }
                else if (symbol.input == "bold") {
                    result[0].style += "font-weight:bold;";
                    return [result[0], result[1]];
                }
                else if (symbol.input == "italic") {
                    result[0].style += "font-style: italic;";
                    return [result[0], result[1]];
                }
                else { // font change command
                    if (typeof symbol.codes === 'string') {
                       JXG.AMserver.AMmapChars(result[0], symbol.codes, symbol.input);
                    }
                    return [result[0], result[1]];
                }
            case BINARY:
                str =JXG.AMserver.AMremoveCharsAndBlanks(str, symbol.input.length);
                result =JXG.AMserver.AMparseSexpr(str);
                if (result[0] == null)
                    return [JXG.AMserver.createMmlNode("mo",JXG.AMserver.createTextNode(symbol.input)), str];
               JXG.AMserver.AMremoveBrackets(result[0]);
                let result2 =JXG.AMserver.AMparseSexpr(result[1]);
                if (result2[0] == null)
                    return [JXG.AMserver.createMmlNode("mo",JXG.AMserver.createTextNode(symbol.input)), str];
               JXG.AMserver.AMremoveBrackets(result2[0]);
                if (['color', 'class', 'id'].indexOf(symbol.input) >= 0) {
                    // Get the second argument
                    if (str.charAt(0) == "{")
                        i = str.indexOf("}");
                    else if (str.charAt(0) == "(")
                        i = str.indexOf(")");
                    else if (str.charAt(0) == "[")
                        i = str.indexOf("]");
                    st = str.slice(1, i);
                    // Make a mathml node
                    node =JXG.AMserver.createMmlNode(symbol.tag, result2[0]);
                    if (symbol.input === "color")
                        node.setAttribute("mathcolor", st);
                    else if (symbol.input === "class")
                        node.setAttribute("class", st);
                    else if (symbol.input === "id")
                        node.setAttribute("id", st);
                    return [node, result2[1]];
                }
                if (symbol.input == "root" || symbol.output == "stackrel")
                    newFrag.appendChild(result2[0]);
                newFrag.appendChild(result[0]);
                if (symbol.input == "frac")
                    newFrag.appendChild(result2[0]);
                return [JXG.AMserver.createMmlNode(symbol.tag, newFrag), result2[1]];
            case INFIX:
                str =JXG.AMserver.AMremoveCharsAndBlanks(str, symbol.input.length);
                return [JXG.AMserver.createMmlNode("mo",JXG.AMserver.createTextNode(symbol.output)), str];
            case SPACE:
                str =JXG.AMserver.AMremoveCharsAndBlanks(str, symbol.input.length);
                node =JXG.AMserver.createMmlNode("mspace");
                node.setAttribute("width", "1ex");
                newFrag.appendChild(node);
                newFrag.appendChild(JXG.AMserver.createMmlNode(symbol.tag,JXG.AMserver.createTextNode(symbol.output)));
                node =JXG.AMserver.createMmlNode("mspace");
                node.setAttribute("width", "1ex");
                newFrag.appendChild(node);
                return [JXG.AMserver.createMmlNode("mrow", newFrag), str];
            case LEFTRIGHT:
                //    if (rightvert) return [null,str]; else rightvert = true;
               JXG.AMserver.AMnestingDepth++;
                str =JXG.AMserver.AMremoveCharsAndBlanks(str, symbol.input.length);
                result =JXG.AMserver.AMparseExpr(str, false);
               JXG.AMserver.AMnestingDepth--;
                st = "";
                if (result[0].lastChild != null)
                    st = result[0].lastChild.firstChild.nodeValue;
                if (st == "|" && str.charAt(0) !==JXG.AMserver.listseparator) { // its an absolute value subterm
                    node =JXG.AMserver.createMmlNode("mo",JXG.AMserver.createTextNode(symbol.output));
                    node =JXG.AMserver.createMmlNode("mrow", node);
                    node.appendChild(result[0]);
                    return [node, result[1]];
                }
                else { // the "|" is a \mid so use unicode 2223 (divides) for spacing
                    node =JXG.AMserver.createMmlNode("mo",JXG.AMserver.createTextNode("\u2223"));
                    node =JXG.AMserver.createMmlNode("mrow", node);
                    return [node, str];
                }
            default:
                //alert("default");
                str =JXG.AMserver.AMremoveCharsAndBlanks(str, symbol.input.length);
                return [JXG.AMserver.createMmlNode(symbol.tag, //its a constant
                   JXG.AMserver.createTextNode(symbol.output)), str];
        }
    },
    // walks a node, and maps characters according to codemap
    AMmapChars: (node, variant, inputsym) => {
        let tag = '';
        let codemap = codemaps[variant];
        if (!codemap[2] && inputsym.substring(0, 2) == 'bb') {
            // bold but variant doesn't have symbol; use codepoint from bb codemap instead
            codemap[2] = codemaps['bold'][2];
        }
        let remap = codemap[5] || {};
        if (node.tagName) {
            tag = node.tagName.toUpperCase();
        }
        if (tag == "MI" || tag == "MO" || tag == "MN" || tag == "MTEXT") {
            if (JXG.AMserver.addmathvariant) {
                node.setAttribute("mathvariant", variant);
            }
            let st = node.firstChild.nodeValue.toString();
            let newst = "";
            let didmap, charcode;
            let map; // { [key: string]: any[] };
            for (let j = 0; j < st.length; j++) {
                didmap = false;
                charcode = st.charCodeAt(j);
                for (let k = 0; k < 5; k++) {
                    if (!codemap[k]) {
                        continue;
                    }
                    map = codemapranges[k][2] || {};
                    if (map[charcode]) {
                        newst += String.fromCodePoint(map[charcode] - codemapranges[k][0] + codemap[k]);
                        didmap = true;
                        break;
                    }
                    else if (charcode >= codemapranges[k][0] && charcode <= codemapranges[k][1]) {
                        newst += String.fromCodePoint(remap[charcode] || charcode - codemapranges[k][0] + codemap[k]);
                        didmap = true;
                        break;
                    }
                }
                if (!didmap) {
                    newst += st.charAt(j);
                }
            }
            node.replaceChild(JXG.AMserver.createTextNode(newst), node.firstChild);
        }
        else {
            for (let i = 0; i < node.childNodes.length; i++) {
               JXG.AMserver.AMmapChars(node.childNodes[i], variant, inputsym);
            }
        }
    },
    AMparseIexpr: (str) => {
        let symbol, sym1, sym2, node, result, underover;
        str =JXG.AMserver.AMremoveCharsAndBlanks(str, 0);
        sym1 =JXG.AMserver.AMgetSymbol(str);

        result =JXG.AMserver.AMparseSexpr(str);
        node = result[0];
        str = result[1];
        symbol =JXG.AMserver.AMgetSymbol(str);
        if (symbol.ttype == INFIX && symbol.input != "/") {
            str =JXG.AMserver.AMremoveCharsAndBlanks(str, symbol.input.length);
            result =JXG.AMserver.AMparseSexpr(str);
            if (result[0] == null) // show box in place of missing argument
                result[0] =JXG.AMserver.createMmlNode("mo",JXG.AMserver.createTextNode("\u25A1"));
            else
               JXG.AMserver.AMremoveBrackets(result[0]);
            str = result[1];
            //    if (symbol.input == "/") AMremoveBrackets(node);
            underover = (sym1.ttype == UNDEROVER || sym1.ttype == UNARYUNDEROVER);
            if (symbol.input == "_") {
                sym2 =JXG.AMserver.AMgetSymbol(str);
                if (sym2.input == "^") {
                    str =JXG.AMserver.AMremoveCharsAndBlanks(str, sym2.input.length);
                    let res2 =JXG.AMserver.AMparseSexpr(str);
                   JXG.AMserver.AMremoveBrackets(res2[0]);
                    str = res2[1];
                    node =JXG.AMserver.createMmlNode((underover ? "munderover" : "msubsup"), node);
                    node.appendChild(result[0]);
                    node.appendChild(res2[0]);
                    node =JXG.AMserver.createMmlNode("mrow", node); // so sum does not stretch
                }
                else {
                    node =JXG.AMserver.createMmlNode((underover ? "munder" : "msub"), node);
                    node.appendChild(result[0]);
                }
            }
            else if (symbol.input == "^" && underover) {
                node =JXG.AMserver.createMmlNode("mover", node);
                node.appendChild(result[0]);
            }
            else {
                node =JXG.AMserver.createMmlNode(symbol.tag, node);
                node.appendChild(result[0]);
            }
            if (typeof sym1.func != 'undefined' && sym1.func) {
                sym2 =JXG.AMserver.AMgetSymbol(str);
                if (sym2.ttype != INFIX && sym2.ttype != RIGHTBRACKET &&
                    (sym1.input.length > 1 || sym2.ttype == LEFTBRACKET)) {
                    result =JXG.AMserver.AMparseIexpr(str);
                    node =JXG.AMserver.createMmlNode("mrow", node);
                    node.appendChild(result[0]);
                    str = result[1];
                }
            }
        }
        return [node, str];
    },
    AMparseExpr: (str, rightbracket = false) => {
        var symbol, node, result, i, newFrag =JXG.AMserver.createDocumentFragment();
        let safety = 0;
        do {
            if (safety++ > 100)
                throw new Error('looping');
            str =JXG.AMserver.AMremoveCharsAndBlanks(str, 0);
            result =JXG.AMserver.AMparseIexpr(str);
            node = result[0];
            str = result[1];
            symbol =JXG.AMserver.AMgetSymbol(str);
            if (symbol.ttype == INFIX && symbol.input == "/") {
                str =JXG.AMserver.AMremoveCharsAndBlanks(str, symbol.input.length);
                result =JXG.AMserver.AMparseIexpr(str);
                if (result[0] == null) // show box in place of missing argument
                    result[0] =JXG.AMserver.createMmlNode("mo",JXG.AMserver.createTextNode("\u25A1"));
                else
                   JXG.AMserver.AMremoveBrackets(result[0]);
                str = result[1];
               JXG.AMserver.AMremoveBrackets(node);
                node =JXG.AMserver.createMmlNode(symbol.tag, node);
                node.appendChild(result[0]);
                newFrag.appendChild(node);
                symbol =JXG.AMserver.AMgetSymbol(str);
            }
            else if (node != undefined)
                newFrag.appendChild(node);
        } while ((symbol.ttype != RIGHTBRACKET &&
            (symbol.ttype != LEFTRIGHT || rightbracket)
            ||JXG.AMserver.AMnestingDepth == 0)
        && symbol != null && symbol.output != "");
        if (symbol.ttype == RIGHTBRACKET || symbol.ttype == LEFTRIGHT) {
            //    if (AMnestingDepth > 0) AMnestingDepth--;
            let res =JXG.AMserver.detectMatrix(newFrag, symbol.output);
            if (res.isMatrix) {
                let r, c, row;
                let columnlines = [];
                let table =JXG.AMserver.createMmlNode('mtable');
                for (r = 0; r < res.rows.length; r++) {
                    row =JXG.AMserver.createMmlNode('mtr');
                    for (c = 0; c < res.rows[r].length; c++) {
                        if (res.rows[r][c].length == 1 &&
                            res.rows[r][c][0].nodeName == "mrow" &&
                            res.rows[r][c][0].childNodes.length == 1 &&
                            res.rows[r][c][0].firstChild.firstChild.nodeValue == "\u2223") {
                            // found columnline marker
                            if (r == 0) {
                                columnlines.pop();
                                columnlines.push("solid");
                            }
                            if (c > 0) {
                                row.lastChild.style += `border-right: 1px solid ${AMserver.mathcolor};`;
                            }
                        }
                        else {
                            const cell =JXG.AMserver.createMmlNode('mtd');
                            for (i = 0; i < res.rows[r][c].length; i++) {
                                cell.appendChild(res.rows[r][c][i]);
                            }
                            row.appendChild(cell);
                            if (r == 0 && c < res.rows[r].length - 1) {
                                columnlines.push("none");
                            }
                        }
                    }
                    table.appendChild(row);
                }
                table.setAttribute("columnlines", columnlines.join(" "));
                if (typeof symbol.invisible == "boolean" && symbol.invisible) {
                    table.setAttribute("columnalign", "left");
                }
                newFrag.replaceChildren(table);
            }
            str =JXG.AMserver.AMremoveCharsAndBlanks(str, symbol.input.length);
            if (typeof symbol.invisible != "boolean" || !symbol.invisible) {
                node =JXG.AMserver.createMmlNode("mo",JXG.AMserver.createTextNode(symbol.output));
                newFrag.appendChild(node);
            }
        }
        return [newFrag, str];
    },
    detectMatrix: (newFrag, endsymbol) => {
        const BRACKET_PAIRS = { '(': ')', '[': ']' };
        const children = Array.from(newFrag.childNodes);
        if (children.length === 0)
            return { isMatrix: false, rows: [] };
        // Split children into segments divided by top-level comma <mo> nodes.
        // Valid shape: [mrow, mo(","), mrow, mo(","), mrow, ...]
        const rows = [];
        let expecting = 'mrow'; // alternates between 'mrow' and 'comma'
        for (const node of children) {
            if (expecting === 'mrow') {
                if (node.nodeName !== 'mrow') {
                    return { isMatrix: false, rows: [] };
                }
                rows.push(node);
                expecting = 'comma';
            }
            else {
                // Must be a top-level comma separator: <mo>,</mo>
                if (
                    // node.nodeType !== 1 ||
                    node.nodeName.toLowerCase() !== 'mo' ||
                    node.firstChild.nodeValue.trim() !==JXG.AMserver.listseparator) {
                    return { isMatrix: false, rows: [] };
                }
                expecting = 'mrow';
            }
        }
        // Must end on a row, not a dangling comma
        if (expecting !== 'comma')
            return { isMatrix: false, rows: [] };
        if (rows.length < 1)
            return { isMatrix: false, rows: [] };
        // Inspect each mrow: check opening bracket, closing bracket, and element count
        let expectedOpen = null;
        let expectedClose = null;
        let expectedCount = null;
        const rowsout = [];
        for (const row of rows) {
            const cells = Array.from(row.childNodes);
            if (cells.length < 2)
                return { isMatrix: false, rows: [] };
            // First child must be an <mo> with a recognized opening bracket
            const firstNode = cells[0];
            if (
                // firstNode.nodeType !== 1 ||
                firstNode.nodeName.toLowerCase() !== 'mo') {
                return { isMatrix: false, rows: [] };
            }
            const openBracket = firstNode.firstChild.nodeValue;
            if (!(openBracket in BRACKET_PAIRS))
                return { isMatrix: false, rows: [] };
            if (openBracket == '(' && endsymbol == '}') {
                // special treatment for set of ordered ntuples
                return { isMatrix: false, rows: [] };
            }
            // Last child must be the matching closing bracket
            const lastNode = cells[cells.length - 1];
            if (
                // lastNode.nodeType !== 1 ||
                lastNode.nodeName !== 'mo') {
                return { isMatrix: false, rows: [] };
            }
            const closeBracket = lastNode.firstChild.nodeValue;
            if (closeBracket !== BRACKET_PAIRS[openBracket]) {
                return { isMatrix: false, rows: [] };
            }
            // Count comma-separated elements between the brackets
            // and collect cells for return
            // (commas as direct <mo> children of this mrow are separators)
            const inner = cells.slice(1, -1);
            let elementCount = 1;
            const cellsout = [];
            const curcell = [];
            for (const cell of inner) {
                if (
                    // cell.nodeType === 1 &&
                    cell.nodeName.toLowerCase() === 'mo' &&
                    cell.firstChild.nodeValue ===JXG.AMserver.listseparator) {
                    elementCount++;
                    cellsout.push([...curcell]);
                    curcell.length = 0;
                }
                else {
                    curcell.push(cell);
                }
            }
            cellsout.push([...curcell]);
            // if 1 element inside braces and it's mtable, it's seeing a matrix, not a row
            // if 1 element and 1 row, it's just double-parens
            if (elementCount == 1 && cellsout[0].length > 0 && (cellsout[0][0].nodeName == 'mtable' || rows.length == 1)) {
                return { isMatrix: false, rows: [] };
            }
            rowsout.push(cellsout);
            // Check consistency across rows
            if (expectedOpen === null) {
                expectedOpen = openBracket;
                expectedClose = closeBracket;
                expectedCount = elementCount;
            }
            else {
                if (openBracket !== expectedOpen)
                    return { isMatrix: false, rows: [] };
                if (closeBracket !== expectedClose)
                    return { isMatrix: false, rows: [] };
                if (elementCount !== expectedCount)
                    return { isMatrix: false, rows: [] };
            }
        }
        return { isMatrix: true, rows: rowsout };
    },
    parseMath: (str) => {
        JXG.AMserver.AMnestingDepth = 0;
        //some basic cleanup for dealing with stuff editors like TinyMCE adds
        // str = str.replace(/&nbsp;/g, "");
        // str = str.replace(/&gt;/g, ">");
        // str = str.replace(/&lt;/g, "<");
        let frag =JXG.AMserver.AMparseExpr(str.replace(/^\s+/g, ""), false)[0];
        let node =JXG.AMserver.createMmlNode("mstyle", frag);
        node.style += "font-family:STIX Two Math;";
        if (JXG.AMserver.mathcolor != "")
            node.setAttribute("mathcolor",JXG.AMserver.mathcolor);
        if (JXG.AMserver.mathfontsize != "") {
            node.setAttribute("fontsize",JXG.AMserver.mathfontsize);
            node.setAttribute("mathsize",JXG.AMserver.mathfontsize);
        }
        // if (JXG.AMserver.mathfontfamily != "") {
        //     node.setAttribute("fontfamily",JXG.AMserver.mathfontfamily);
        //     node.setAttribute("mathvariant",JXG.AMserver.mathfontfamily);
        // }
        if (JXG.AMserver.displaystyle)
            node.setAttribute("displaystyle", "true");
        node =JXG.AMserver.createMmlNode("math", node);
        // node =JXG.AMserver.createMmlNode('div', node);
        // // node.style =JXG.AMserver.cancelStyle;
        // if (JXG.AMserver.showasciiformulaonhover) { //fixed by djhsu so newline
        //     node.setAttribute("title", str.replace(/\s+/g, " ")); //does not show in Gecko
        // }
        return node.flatten();
    },


};
JXG.AMserver.initSymbols();  // initialize  

export default JXG.AMserver;