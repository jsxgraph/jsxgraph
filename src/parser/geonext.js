/*
    Copyright 2008-2025
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
    the MIT License along with JSXGraph. If not, see <https://www.gnu.org/licenses/>
    and <https://opensource.org/licenses/MIT/>.
 */

/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

import JXG from "../jxg.js";
import Const from "../base/constants.js";
import Type from "../utils/type.js";

/**
 * Parser helper routines. The methods in here are for parsing expressions in Geonext Syntax.
 * @namespace
 */
JXG.GeonextParser = {
    /**
     * Converts expression of the form <i>leftop^rightop</i> into <i>Math.pow(leftop,rightop)</i>.
     * @param {String} te Expression of the form <i>leftop^rightop</i>
     * @returns {String} Converted expression.
     */
    replacePow: function (te) {
        var count, pos, c, previousIndex, leftop, rightop, pre, p, left, i, right, expr;

        // delete all whitespace immediately before and after all ^ operators
        te = te.replace(/(\s*)\^(\s*)/g, "^");

        //  Loop over all ^ operators
        i = te.indexOf("^");
        previousIndex = -1;

        while (i >= 0 && i < te.length - 1) {
            if (previousIndex === i) {
                throw new Error("JSXGraph: Error while parsing expression '" + te + "'");
            }
            previousIndex = i;

            // left and right are the substrings before, resp. after the ^ character
            left = te.slice(0, i);
            right = te.slice(i + 1);

            // If there is a ")" immediately before the ^ operator, it can be the end of a
            // (i) term in parenthesis
            // (ii) function call
            // (iii) method  call
            // In either case, first the corresponding opening parenthesis is searched.
            // This is the case, when count==0
            if (left.charAt(left.length - 1) === ")") {
                count = 1;
                pos = left.length - 2;

                while (pos >= 0 && count > 0) {
                    c = left.charAt(pos);
                    if (c === ")") {
                        count++;
                    } else if (c === "(") {
                        count -= 1;
                    }
                    pos -= 1;
                }

                if (count === 0) {
                    // Now, we have found the opning parenthesis and we have to look
                    // if it is (i), or (ii), (iii).
                    leftop = "";
                    // Search for F or p.M before (...)^
                    pre = left.substring(0, pos + 1);
                    p = pos;
                    while (p >= 0 && pre.slice(p, p + 1).match(/([\w.]+)/)) {
                        leftop = RegExp.$1 + leftop;
                        p -= 1;
                    }
                    leftop += left.substring(pos + 1, left.length);
                    leftop = leftop.replace(/([()+*%^\-/\][])/g, "\\$1");
                } else {
                    throw new Error("JSXGraph: Missing '(' in expression");
                }
            } else {
                // Otherwise, the operand has to be a constant (or variable).
                leftop = "[\\w\\.]+"; // former: \\w\\.
            }

            // To the right of the ^ operator there also may be a function or method call
            // or a term in parenthesis. Alos, ere we search for the closing
            // parenthesis.
            if (right.match(/^([\w.]*\()/)) {
                count = 1;
                pos = RegExp.$1.length;

                while (pos < right.length && count > 0) {
                    c = right.charAt(pos);

                    if (c === ")") {
                        count -= 1;
                    } else if (c === "(") {
                        count += 1;
                    }
                    pos += 1;
                }

                if (count === 0) {
                    rightop = right.substring(0, pos);
                    rightop = rightop.replace(/([()+*%^\-/[\]])/g, "\\$1");
                } else {
                    throw new Error("JSXGraph: Missing ')' in expression");
                }
            } else {
                // Otherwise, the operand has to be a constant (or variable).
                rightop = "[\\w\\.]+";
            }
            // Now, we have the two operands and replace ^ by JXG.Math.pow
            expr = new RegExp("(" + leftop + ")\\^(" + rightop + ")");
            //te = te.replace(expr, 'JXG.Math.pow($1,$2)');
            te = te.replace(expr, "pow($1,$2)");
            i = te.indexOf("^");
        }

        return te;
    },

    /**
     * Converts expression of the form <i>If(a,b,c)</i> into <i>(a)?(b):(c)/i>.
     * @param {String} te Expression of the form <i>If(a,b,c)</i>
     * @returns {String} Converted expression.
     */
    replaceIf: function (te) {
        var left,
            right,
            i,
            pos,
            count,
            k1,
            k2,
            c,
            meat,
            s = "",
            first = null,
            second = null,
            third = null;

        i = te.indexOf("If(");
        if (i < 0) {
            return te;
        }

        // "" means not defined. Here, we replace it by 0
        te = te.replace(/""/g, '0');
        while (i >= 0) {
            left = te.slice(0, i);
            right = te.slice(i + 3);

            // Search the end of the If() command and take out the meat
            count = 1;
            pos = 0;
            k1 = -1;
            k2 = -1;

            while (pos < right.length && count > 0) {
                c = right.charAt(pos);

                if (c === ")") {
                    count -= 1;
                } else if (c === "(") {
                    count += 1;
                } else if (c === "," && count === 1) {
                    if (k1 < 0) {
                        // first komma
                        k1 = pos;
                    } else {
                        // second komma
                        k2 = pos;
                    }
                }
                pos += 1;
            }
            meat = right.slice(0, pos - 1);
            right = right.slice(pos);

            // Test the two kommas
            if (k1 < 0) {
                // , missing
                return "";
            }

            if (k2 < 0) {
                // , missing
                return "";
            }

            first = meat.slice(0, k1);
            second = meat.slice(k1 + 1, k2);
            third = meat.slice(k2 + 1);

            // Recurse
            first = this.replaceIf(first);
            second = this.replaceIf(second);
            third = this.replaceIf(third);

            s += left + "((" + first + ")?" + "(" + second + "):(" + third + "))";
            te = right;
            first = null;
            second = null;
            i = te.indexOf("If(");
        }
        s += right;
        return s;
    },

    /**
     * Replace an element's name in terms by an element's id.
     * @param {String} term Term containing names of elements.
     * @param {JXG.Board} board Reference to the board the elements are on.
     * @param {Boolean} [jc=false] If true, all id's will be surrounded by <tt>$('</tt> and <tt>')</tt>.
     * @returns {String} The same string with names replaced by ids.
     **/
    replaceNameById: function (term, board, jc) {
        var end,
            elName,
            el,
            i,
            pos = 0,
            funcs = ["X", "Y", "L", "V"],
            printId = function (id) {
                if (jc) {
                    return "$('" + id + "')";
                }

                return id;
            };

        // Find X(el), Y(el), ...
        // All functions declared in funcs
        for (i = 0; i < funcs.length; i++) {
            pos = term.indexOf(funcs[i] + "(");

            while (pos >= 0) {
                if (pos >= 0) {
                    end = term.indexOf(")", pos + 2);
                    if (end >= 0) {
                        elName = term.slice(pos + 2, end);
                        elName = elName.replace(/\\(['"])?/g, "$1");
                        el = board.elementsByName[elName];

                        if (el) {
                            term =
                                term.slice(0, pos + 2) +
                                (jc ? "$('" : "") +
                                printId(el.id) +
                                term.slice(end);
                        }
                    }
                }
                end = term.indexOf(")", pos + 2);
                pos = term.indexOf(funcs[i] + "(", end);
            }
        }

        pos = term.indexOf("Dist(");
        while (pos >= 0) {
            if (pos >= 0) {
                end = term.indexOf(",", pos + 5);
                if (end >= 0) {
                    elName = term.slice(pos + 5, end);
                    elName = elName.replace(/\\(['"])?/g, "$1");
                    el = board.elementsByName[elName];

                    if (el) {
                        term = term.slice(0, pos + 5) + printId(el.id) + term.slice(end);
                    }
                }
            }
            end = term.indexOf(",", pos + 5);
            pos = term.indexOf(",", end);
            end = term.indexOf(")", pos + 1);

            if (end >= 0) {
                elName = term.slice(pos + 1, end);
                elName = elName.replace(/\\(['"])?/g, "$1");
                el = board.elementsByName[elName];

                if (el) {
                    term = term.slice(0, pos + 1) + printId(el.id) + term.slice(end);
                }
            }
            end = term.indexOf(")", pos + 1);
            pos = term.indexOf("Dist(", end);
        }

        funcs = ["Deg", "Rad"];
        for (i = 0; i < funcs.length; i++) {
            pos = term.indexOf(funcs[i] + "(");
            while (pos >= 0) {
                if (pos >= 0) {
                    end = term.indexOf(",", pos + 4);
                    if (end >= 0) {
                        elName = term.slice(pos + 4, end);
                        elName = elName.replace(/\\(['"])?/g, "$1");
                        el = board.elementsByName[elName];

                        if (el) {
                            term = term.slice(0, pos + 4) + printId(el.id) + term.slice(end);
                        }
                    }
                }

                end = term.indexOf(",", pos + 4);
                pos = term.indexOf(",", end);
                end = term.indexOf(",", pos + 1);

                if (end >= 0) {
                    elName = term.slice(pos + 1, end);
                    elName = elName.replace(/\\(['"])?/g, "$1");
                    el = board.elementsByName[elName];

                    if (el) {
                        term = term.slice(0, pos + 1) + printId(el.id) + term.slice(end);
                    }
                }

                end = term.indexOf(",", pos + 1);
                pos = term.indexOf(",", end);
                end = term.indexOf(")", pos + 1);

                if (end >= 0) {
                    elName = term.slice(pos + 1, end);
                    elName = elName.replace(/\\(['"])?/g, "$1");
                    el = board.elementsByName[elName];
                    if (el) {
                        term = term.slice(0, pos + 1) + printId(el.id) + term.slice(end);
                    }
                }

                end = term.indexOf(")", pos + 1);
                pos = term.indexOf(funcs[i] + "(", end);
            }
        }

        return term;
    },

    /**
     * Replaces element ids in terms by element this.board.objects['id'].
     * @param {String} term A GEONE<sub>x</sub>T function string with JSXGraph ids in it.
     * @returns {String} The input string with element ids replaced by this.board.objects["id"].
     **/
    replaceIdByObj: function (term) {
        // Search for expressions like "X(gi23)" or "Y(gi23A)" and convert them to objects['gi23'].X().
        var expr = /(X|Y|L)\(([\w_]+)\)/g;
        term = term.replace(expr, "$('$2').$1()");

        expr = /(V)\(([\w_]+)\)/g;
        term = term.replace(expr, "$('$2').Value()");

        expr = /(Dist)\(([\w_]+),([\w_]+)\)/g;
        term = term.replace(expr, "dist($('$2'), $('$3'))");

        expr = /(Deg)\(([\w_]+),([ \w[\w_]+),([\w_]+)\)/g;
        term = term.replace(expr, "deg($('$2'),$('$3'),$('$4'))");

        // Search for Rad('gi23','gi24','gi25')
        expr = /Rad\(([\w_]+),([\w_]+),([\w_]+)\)/g;
        term = term.replace(expr, "rad($('$1'),$('$2'),$('$3'))");

        // it's ok, it will run through the jessiecode parser afterwards...
        /*jslint regexp: true*/
        expr = /N\((.+)\)/g;
        term = term.replace(expr, "($1)");

        return term;
    },

    /**
     * Converts the given algebraic expression in GEONE<sub>x</sub>T syntax into an equivalent expression in JavaScript syntax.
     * @param {String} term Expression in GEONExT syntax
     * @param {JXG.Board} board
     * @returns {String} Given expression translated to JavaScript.
     */
    geonext2JS: function (term, board) {
        var expr,
            newterm,
            i,
            from = [
                "Abs",
                "ACos",
                "ASin",
                "ATan",
                "Ceil",
                "Cos",
                "Exp",
                "Factorial",
                "Floor",
                "Log",
                "Max",
                "Min",
                "Random",
                "Round",
                "Sin",
                "Sqrt",
                "Tan",
                "Trunc"
            ],
            to = [
                "abs",
                "acos",
                "asin",
                "atan",
                "ceil",
                "cos",
                "exp",
                "factorial",
                "floor",
                "log",
                "max",
                "min",
                "random",
                "round",
                "sin",
                "sqrt",
                "tan",
                "ceil"
            ];

        // Hacks, to enable not well formed XML, @see JXG.GeonextReader#replaceLessThan
        term = term.replace(/&lt;/g, "<");
        term = term.replace(/&gt;/g, ">");
        term = term.replace(/&amp;/g, "&");

        // Convert GEONExT syntax to JavaScript syntax
        newterm = term;
        newterm = this.replaceNameById(newterm, board);
        newterm = this.replaceIf(newterm);
        // Exponentiations-Problem x^y -> Math(exp(x,y).
        newterm = this.replacePow(newterm);
        newterm = this.replaceIdByObj(newterm);

        for (i = 0; i < from.length; i++) {
            // sin -> Math.sin and asin -> Math.asin
            expr = new RegExp(["(\\W|^)(", from[i], ")"].join(""), 'ig');
            newterm = newterm.replace(expr, ["$1", to[i]].join(""));
        }
        newterm = newterm.replace(/True/g, 'true');
        newterm = newterm.replace(/False/g, 'false');
        newterm = newterm.replace(/fasle/g, 'false');
        newterm = newterm.replace(/Pi/g, 'PI');
        newterm = newterm.replace(/"/g, "'");

        return newterm;
    },

    /**
     * Finds dependencies in a given term and resolves them by adding the
     * dependent object to the found objects child elements.
     * @param {JXG.GeometryElement} me Object depending on objects in given term.
     * @param {String} term String containing dependencies for the given object.
     * @param {JXG.Board} [board=me.board] Reference to a board
     */
    findDependencies: function (me, term, board) {
        var elements, el, expr, elmask;

        if (!Type.exists(board)) {
            board = me.board;
        }

        elements = board.elementsByName;

        for (el in elements) {
            if (elements.hasOwnProperty(el)) {
                if (el !== me.name) {
                    if (elements[el].elementClass === Const.OBJECT_CLASS_TEXT) {
                        if (!elements[el].evalVisProp('islabel')) {
                            elmask = el.replace(/\[/g, "\\[");
                            elmask = elmask.replace(/\]/g, "\\]");

                            // Searches (A), (A,B),(A,B,C)
                            expr = new RegExp(
                                "\\(([\\w\\[\\]'_ ]+,)*(" + elmask + ")(,[\\w\\[\\]'_ ]+)*\\)",
                                "g"
                            );

                            if (term.search(expr) >= 0) {
                                elements[el].addChild(me);
                            }
                        }
                    } else {
                        elmask = el.replace(/\[/g, "\\[");
                        elmask = elmask.replace(/\]/g, "\\]");

                        // Searches (A), (A,B),(A,B,C)
                        expr = new RegExp(
                            "\\(([\\w\\[\\]'_ ]+,)*(" + elmask + ")(,[\\w\\[\\]'_ ]+)*\\)",
                            "g"
                        );

                        if (term.search(expr) >= 0) {
                            elements[el].addChild(me);
                        }
                    }
                }
            }
        }
    },

    /**
     * Converts the given algebraic expression in GEONE<sub>x</sub>T syntax into an equivalent expression in JessieCode syntax.
     * @param {String} term Expression in GEONExT syntax
     * @param {JXG.Board} board
     * @returns {String} Given expression translated to JavaScript.
     */
    gxt2jc: function (term, board) {
        var newterm;
            // from = ["Sqrt"],
            // to = ["sqrt"];

        // Hacks, to enable not well formed XML, @see JXG.GeonextReader#replaceLessThan
        term = term.replace(/&lt;/g, "<");
        term = term.replace(/&gt;/g, ">");
        term = term.replace(/&amp;/g, "&");
        newterm = term;
        newterm = this.replaceNameById(newterm, board, true);
        newterm = newterm.replace(/True/g, 'true');
        newterm = newterm.replace(/False/g, 'false');
        newterm = newterm.replace(/fasle/g, 'false');

        return newterm;
    }
};

export default JXG.GeonextParser;
