/*
 Copyright 2008-2024
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

/*global JXG: true*/
/*jslint nomen: true, plusplus: true*/

(function () {
    "use strict";

    JXG.GeogebraReader = function (board, str) {
        var tree, content;

        content = this.prepareString(str);
        tree = JXG.XML.parse(content);

        this.tree = tree;
        this.board = board;
        this.ggbElements = [];

        // this needs to be accessible from eval'd strings so we have to keep it in board
        this.board.ggb = {};
        this.format = parseFloat(
            tree.getElementsByTagName("geogebra")[0].getAttribute("format")
        );
        this.decimals = parseInt(
            tree
                .getElementsByTagName("geogebra")[0]
                .getElementsByTagName("kernel")[0]
                .getElementsByTagName("decimals")[0]
                .getAttribute("val"),
            10
        );
    };

    JXG.extend(
        JXG.GeogebraReader.prototype,
        /** @lends JXG.GeogebraReader.prototype */ {
            /**
             * @param {String} type the type of expression
             * @param {String} m first input value
             * @param {String} n second input value
             * @returns {String|Array|Number} return the object, string or calculated value
             */
            ggbAct: function (type, m, n) {
                var s1,
                    s2,
                    a,
                    regexValue = new RegExp(
                        "JXG\\.boards\\['" + this.board.id + '\'\\].select\\("(.+?)"\\)\\.'
                    ),
                    regexSelect = new RegExp(
                        "JXG\\.boards\\['" + this.board.id + "'\\].select"
                    ),
                    v1 = m,
                    v2 = n;

                switch (type.toLowerCase()) {
                    case "end":
                        return v1;
                    case "coord":
                        s1 = this.ggbElements[v1]
                            ? "JXG.boards['" + this.board.id + "'].select('" + v1 + "')"
                            : v1;
                        s2 = this.ggbElements[v2]
                            ? "JXG.boards['" + this.board.id + "'].select('" + v2 + "')"
                            : v2;
                        return [s1, s2];
                    case "le": // smaller than
                        return "( (" + v1 + ") <= (" + v2 + ") )";
                    case "ge": // greater than
                        return "( (" + v1 + ") >= (" + v2 + ") )";
                    case "eq": // equal
                        return "( (" + v1 + ") == (" + v2 + ") )";
                    case "neq": // not equal
                        return "( (" + v1 + ") != (" + v2 + ") )";
                    case "lt": // smaller
                        return "( (" + v1 + ") < (" + v2 + ") )";
                    case "gt": // greater
                        return "( (" + v1 + ") > (" + v2 + ") )";
                    case "add":
                        //Add: Vector + Vector
                        if (this.isGGBVector(v1) && this.isGGBVector(v2)) {
                            return [1, v1[1] + "+" + v2[1], v1[2] + "+" + v2[2]];
                        }

                        // The first match (which is negated) is to check if we are looking at a blank element or a value from this element
                        // If the select() call is followed by a '.', a property or a value is accessed, ergo we must not append .X() and .Y().
                        if (
                            JXG.isString(v1) &&
                            !v1.match(regexValue) &&
                            v1.match(regexSelect)
                        ) {
                            s1 = [v1 + ".X()", v1 + ".Y()"];
                        } else {
                            s1 = v1;
                        }

                        if (
                            JXG.isString(v2) &&
                            !v2.match(regexValue) &&
                            v2.match(regexSelect)
                        ) {
                            s2 = [v2 + ".X()", v2 + ".Y()"];
                        } else {
                            s2 = v2;
                        }

                        //Add: Vector + Point
                        if (this.isGGBVector(s1) && JXG.isArray(s2)) {
                            return [s1[1] + "+" + s2[0], s1[2] + "+" + s2[1]];
                        }

                        //Add: Vector + Point
                        if (this.isGGBVector(s2) && JXG.isArray(s1)) {
                            return [s2[1] + "+" + s1[0], s2[2] + "+" + s1[1]];
                        }

                        if (JXG.isArray(s1) && JXG.isArray(s2)) {
                            return [s1[0] + " + " + s2[0], s1[1] + " + " + s2[1]];
                        }

                        if (
                            (JXG.isNumber(s1) || JXG.isString(s1)) &&
                            (JXG.isNumber(s2) || JXG.isString(s2))
                        ) {
                            return s1 + " + " + s2;
                        }

                        if ((JXG.isNumber(s1) || JXG.isString(s1)) && JXG.isArray(s2)) {
                            return [s1 + " + " + s2[0], s1 + " + " + s2[1]];
                        }

                        if (JXG.isArray(s1) && (JXG.isNumber(s2) || JXG.isString(s2))) {
                            return [s1[0] + " + " + s2, s1[1] + " + " + s2];
                        }

                        return s1 + " + " + s2;
                    case "sub":
                        if (this.isGGBVector(v1) && this.isGGBVector(v2)) {
                            //Sub: Vector - Vector
                            return [1, v1[1] + "-" + v2[1], v1[2] + "-" + v2[2]];
                        }

                        if (
                            JXG.isString(v1) &&
                            !v1.match(regexValue) &&
                            v1.match(regexSelect)
                        ) {
                            s1 = [v1 + ".X()", v1 + ".Y()"];
                        } else {
                            s1 = v1;
                        }

                        if (
                            JXG.isString(v2) &&
                            !v2.match(regexValue) &&
                            v2.match(regexSelect)
                        ) {
                            s2 = [v2 + ".X()", v2 + ".Y()"];
                        } else {
                            s2 = v2;
                        }

                        //Add: Vector - Point
                        if (this.isGGBVector(s1) && JXG.isArray(s2)) {
                            return [s1[1] + "-" + s2[0], s1[2] + "-" + s2[1]];
                        }

                        //Add: Punkt - Vector
                        if (JXG.isArray(s1) && this.isGGBVector(s2)) {
                            return [s1[0] + "-(" + s2[1] + ")", s1[1] + "-(" + s2[2] + ")"];
                        }

                        if (JXG.isArray(s1) && JXG.isArray(s2)) {
                            return [s1[0] + " - " + s2[0], s1[1] + " - " + s2[1]];
                        }

                        if (
                            (JXG.isNumber(s1) || JXG.isString(s1)) &&
                            (JXG.isNumber(s2) || JXG.isString(s2))
                        ) {
                            return s1 + " - " + s2;
                        }

                        if ((JXG.isNumber(s1) || JXG.isString(s1)) && JXG.isArray(s2)) {
                            return [s1 + " - " + s2[0], s1 + " - " + s2[1]];
                        }

                        if (JXG.isArray(s1) && (JXG.isNumber(s2) || JXG.isString(s2))) {
                            return [s1[0] + " - " + s2, s1[1] + " - " + s2];
                        }

                        return s1 + " - " + s2;
                    case "neg":
                        return "!(" + v1 + ")";
                    case "pow":
                        return "Math.pow(" + v1 + ", " + v2 + ")";
                    case "or":
                        return "(" + v1 + "||" + v2 + ")";
                    case "and":
                        return "(" + v1 + "&&" + v2 + ")";
                    case "mul":
                        if (this.isGGBVector(v1) && !JXG.isArray(v2)) {
                            // Mult: Vector * Skalar
                            return [1, "(" + v1[1] + ")*" + v2, "(" + v1[2] + ")*" + v2];
                        }

                        if (!JXG.isArray(v1) && this.isGGBVector(v2)) {
                            // Mult: Skalar * Vector
                            return [1, "(" + v2[1] + ")*" + v1, "(" + v2[2] + ")*" + v1];
                        }

                        if (this.isGGBVector(v1) && this.isGGBVector(v2)) {
                            //Mult: Vector * Vector
                            return (
                                "((" +
                                v1[1] +
                                ")*(" +
                                v2[1] +
                                ")+(" +
                                v1[2] +
                                ")*(" +
                                v2[2] +
                                "))"
                            );
                        }

                        if (
                            JXG.isString(v1) &&
                            !v1.match(regexValue) &&
                            v1.match(regexSelect)
                        ) {
                            s1 = [v1 + ".X()", v1 + ".Y()"];
                        } else {
                            s1 = v1;
                        }

                        if (
                            JXG.isString(v2) &&
                            !v2.match(regexValue) &&
                            v2.match(regexSelect)
                        ) {
                            s2 = [v2 + ".X()", v2 + ".Y()"];
                        } else {
                            s2 = v2;
                        }

                        if (JXG.isArray(s1) && JXG.isArray(s2)) {
                            return [s1[0] + " * " + s2[0], s1[1] + " * " + s2[1]];
                        }

                        if (
                            (JXG.isNumber(s1) || JXG.isString(s1)) &&
                            (JXG.isNumber(s2) || JXG.isString(s2))
                        ) {
                            return s1 + " * " + s2;
                        }

                        if ((JXG.isNumber(s1) || JXG.isString(s1)) && JXG.isArray(s2)) {
                            return [s1 + " * " + s2[0], s1 + " * " + s2[1]];
                        }

                        if (JXG.isArray(s1) && (JXG.isNumber(s2) || JXG.isString(s2))) {
                            return [s1[0] + " * " + s2, s1[1] + " * " + s2];
                        }

                        return s1 + " * " + s2;
                    case "div":
                        if (
                            JXG.isString(v1) &&
                            !v1.match(regexValue) &&
                            v1.match(regexSelect)
                        ) {
                            s1 = [v1 + ".X()", v1 + ".Y()"];
                        } else {
                            s1 = v1;
                        }

                        if (
                            JXG.isString(v2) &&
                            !v2.match(regexValue) &&
                            v2.match(regexSelect)
                        ) {
                            s2 = [v2 + ".X()", v2 + ".Y()"];
                        } else {
                            s2 = v2;
                        }

                        if (JXG.isArray(s1) && JXG.isArray(s2)) {
                            return [s1[0] + " / " + s2[0], s1[1] + " / " + s2[1]];
                        }

                        if (
                            (JXG.isNumber(s1) || JXG.isString(s1)) &&
                            (JXG.isNumber(s2) || JXG.isString(s2))
                        ) {
                            return s1 + " / " + s2;
                        }

                        if ((JXG.isNumber(s1) || JXG.isString(s1)) && JXG.isArray(s2)) {
                            return [s1 + " / " + s2[0], s1 + " / " + s2[1]];
                        }

                        if (JXG.isArray(s1) && (JXG.isNumber(s2) || JXG.isString(s2))) {
                            return [s1[0] + " / " + s2, s1[1] + " / " + s2];
                        }

                        return s1 + " / " + s2;
                    case "negmult":
                        if (this.isGGBVector(v1)) {
                            return [1, -1 + "*" + v1[1], -1 + "*" + v1[2]];
                        }

                        return -1 + "*" + v1;
                    case "bra":
                        if (this.isGGBVector(v1)) {
                            return [1, "(" + v1[1] + ")", "(" + v1[2] + ")"];
                        }

                        return "(" + v1 + ")";
                    case "int":
                        return parseInt(v1, 10);
                    case "float":
                        return parseFloat(v1);
                    case "param":
                        return v1;
                    case "html":
                        return v1;
                    case "string":
                        if (v2) {
                            return [v1, v2];
                        }

                        return v1;
                    case "command":
                        v2 = v1.split("[");
                        s1 = v2[0];
                        s2 = v2[1].split("]")[0];
                        if (s1.toLowerCase() === "name") {
                            return (
                                "JXG.boards['" +
                                this.board.id +
                                "'].select('" +
                                s2 +
                                "').getName()"
                            );
                        }
                        break;
                    case "var":
                        if (v2) {
                            switch (v1.toLowerCase()) {
                                case "x":
                                    return v2 + ".X()";
                                case "y":
                                    return v2 + ".Y()";
                                case "abs":
                                case "acos":
                                case "asin":
                                case "atan":
                                case "ceil":
                                case "cos":
                                case "exp":
                                case "floor":
                                case "log":
                                case "max":
                                case "min":
                                case "pow":
                                case "random":
                                case "round":
                                case "sin":
                                case "sqrt":
                                case "tan":
                                    return "Math." + v1.toLowerCase() + "(" + v2 + ")";
                                default:
                                    return v1.toLowerCase() + "*(" + v2 + ")";
                            }
                        } else {
                            if (v1 === "PI") {
                                return "Math.PI";
                            }

                            a = this.checkElement(v1);
                            if (JXG.exists(this.board.ggb[v1])) {
                                return (
                                    "JXG.boards['" + this.board.id + "'].ggb[\"" + v1 + '"]()'
                                );
                            }

                            if (JXG.exists(a.Value)) {
                                return (
                                    "JXG.boards['" +
                                    this.board.id +
                                    "'].select(\"" +
                                    v1 +
                                    '").Value()'
                                );
                            }

                            if (JXG.exists(a.Area)) {
                                return (
                                    "JXG.boards['" +
                                    this.board.id +
                                    "'].select(\"" +
                                    v1 +
                                    '").Area()'
                                );
                            }

                            if (JXG.exists(a.plaintextStr)) {
                                return (
                                    "1.0*JXG.boards['" +
                                    this.board.id +
                                    "'].select(\"" +
                                    v1 +
                                    '").plaintextStr'
                                );
                            }

                            if (a.type === JXG.OBJECT_TYPE_VECTOR) {
                                return [
                                    1,
                                    "JXG.boards['" +
                                        this.board.id +
                                        "'].select(\"" +
                                        v1 +
                                        "\").point2.X()-JXG.boards['" +
                                        this.board.id +
                                        "'].select(\"" +
                                        v1 +
                                        '").point1.X()',
                                    "JXG.boards['" +
                                        this.board.id +
                                        "'].select(\"" +
                                        v1 +
                                        "\").point2.Y()-JXG.boards['" +
                                        this.board.id +
                                        "'].select(\"" +
                                        v1 +
                                        '").point1.Y()'
                                ];
                            }

                            if (a.elementClass === JXG.OBJECT_CLASS_LINE) {
                                return (
                                    "JXG.boards['" +
                                    this.board.id +
                                    "'].select(\"" +
                                    v1 +
                                    "\").point1.Dist(JXG.boards['" +
                                    this.board.id +
                                    "'].select(\"" +
                                    v1 +
                                    '").point2)'
                                );
                            }

                            return "JXG.boards['" + this.board.id + "'].select(\"" + v1 + '")';
                        }
                }
            },

            /**
             * JS/CC parser to convert the input expression to a working javascript function.
             * @param {String} exp String which contains the function, expression or information
             * @param {Object} el Element that needs to be updated
             */
            ggbParse: function (exp, el) {
                var i,
                    error_count,
                    error_offsets = [],
                    error_lookaheads = [],
                    errstr = "",
                    str = exp,
                    dbg_withtrace = false,
                    dbg_string = "",
                    ggbr = this,
                    element = el ? this.board.select(this.ggbElements[el].id) : false;

                if (element) {
                    JXG.debug("Update element: " + element.name + "(" + element.id + ")");
                }

                /*
             This parser was generated with: The LALR(1) parser and lexical analyzer generator for JavaScript, written in JavaScript
             In the version 0.30 on http://jscc.jmksf.com/

             It is based on the default template driver for JS/CC generated parsers running as
             browser-based JavaScript/ECMAScript applications and was strongly modified.

             The parser was written 2007, 2008 by Jan Max Meyer, J.M.K S.F. Software Technologies
             This is in the public domain.
             */

                /***** begin replace *****/
                function dbg_print(text) {
                    dbg_string += text + "\n";
                }

                function lex(info) {
                    var state = 0,
                        match = -1,
                        match_pos = 0,
                        start = 0,
                        pos = info.offset + 1;

                    do {
                        pos -= 1;
                        state = 0;
                        match = -2;
                        start = pos;

                        if (info.src.length <= start) {
                            return 28;
                        }

                        do {
                            switch (state) {
                                case 0:
                                    if (
                                        info.src.charCodeAt(pos) === 9 ||
                                        info.src.charCodeAt(pos) === 32
                                    ) {
                                        state = 1;
                                    } else if (info.src.charCodeAt(pos) === 33) {
                                        state = 2;
                                    } else if (info.src.charCodeAt(pos) === 40) {
                                        state = 3;
                                    } else if (info.src.charCodeAt(pos) === 41) {
                                        state = 4;
                                    } else if (info.src.charCodeAt(pos) === 42) {
                                        state = 5;
                                    } else if (info.src.charCodeAt(pos) === 43) {
                                        state = 6;
                                    } else if (info.src.charCodeAt(pos) === 44) {
                                        state = 7;
                                    } else if (info.src.charCodeAt(pos) === 45) {
                                        state = 8;
                                    } else if (info.src.charCodeAt(pos) === 47) {
                                        state = 9;
                                    } else if (
                                        info.src.charCodeAt(pos) >= 48 &&
                                        info.src.charCodeAt(pos) <= 57
                                    ) {
                                        state = 10;
                                    } else if (info.src.charCodeAt(pos) === 60) {
                                        state = 11;
                                    } else if (info.src.charCodeAt(pos) === 62) {
                                        state = 12;
                                    } else if (
                                        (info.src.charCodeAt(pos) >= 65 &&
                                            info.src.charCodeAt(pos) <= 90) ||
                                        (info.src.charCodeAt(pos) >= 97 &&
                                            info.src.charCodeAt(pos) <= 122)
                                    ) {
                                        state = 13;
                                    } else if (info.src.charCodeAt(pos) === 94) {
                                        state = 14;
                                    } else if (info.src.charCodeAt(pos) === 34) {
                                        state = 26;
                                    } else if (info.src.charCodeAt(pos) === 38) {
                                        state = 28;
                                    } else if (info.src.charCodeAt(pos) === 46) {
                                        state = 29;
                                    } else if (info.src.charCodeAt(pos) === 61) {
                                        state = 30;
                                    } else if (info.src.charCodeAt(pos) === 95) {
                                        state = 31;
                                    } else if (info.src.charCodeAt(pos) === 124) {
                                        state = 32;
                                    } else {
                                        state = -1;
                                    }
                                    break;

                                case 1:
                                    state = -1;
                                    match = 1;
                                    match_pos = pos;
                                    break;

                                case 2:
                                    if (info.src.charCodeAt(pos) === 61) {
                                        state = 15;
                                    } else {
                                        state = -1;
                                    }
                                    match = 23;
                                    match_pos = pos;
                                    break;

                                case 3:
                                    state = -1;
                                    match = 2;
                                    match_pos = pos;
                                    break;

                                case 4:
                                    state = -1;
                                    match = 3;
                                    match_pos = pos;
                                    break;

                                case 5:
                                    state = -1;
                                    match = 13;
                                    match_pos = pos;
                                    break;

                                case 6:
                                    state = -1;
                                    match = 11;
                                    match_pos = pos;
                                    break;

                                case 7:
                                    state = -1;
                                    match = 16;
                                    match_pos = pos;
                                    break;

                                case 8:
                                    state = -1;
                                    match = 12;
                                    match_pos = pos;
                                    break;

                                case 9:
                                    state = -1;
                                    match = 14;
                                    match_pos = pos;
                                    break;

                                case 10:
                                    if (
                                        info.src.charCodeAt(pos) >= 48 &&
                                        info.src.charCodeAt(pos) <= 57
                                    ) {
                                        state = 10;
                                    } else if (info.src.charCodeAt(pos) === 46) {
                                        state = 18;
                                    } else {
                                        state = -1;
                                    }
                                    match = 4;
                                    match_pos = pos;
                                    break;

                                case 11:
                                    if (info.src.charCodeAt(pos) === 61) {
                                        state = 19;
                                    } else {
                                        state = -1;
                                    }
                                    match = 21;
                                    match_pos = pos;
                                    break;

                                case 12:
                                    if (info.src.charCodeAt(pos) === 61) {
                                        state = 21;
                                    } else {
                                        state = -1;
                                    }
                                    match = 22;
                                    match_pos = pos;
                                    break;

                                case 13:
                                    if (
                                        (info.src.charCodeAt(pos) >= 65 &&
                                            info.src.charCodeAt(pos) <= 90) ||
                                        (info.src.charCodeAt(pos) >= 97 &&
                                            info.src.charCodeAt(pos) <= 122)
                                    ) {
                                        state = 13;
                                    } else if (
                                        info.src.charCodeAt(pos) >= 48 &&
                                        info.src.charCodeAt(pos) <= 57
                                    ) {
                                        state = 27;
                                    } else if (info.src.charCodeAt(pos) === 91) {
                                        state = 34;
                                    } else if (info.src.charCodeAt(pos) === 95) {
                                        state = 35;
                                    } else {
                                        state = -1;
                                    }
                                    match = 7;
                                    match_pos = pos;
                                    break;

                                case 14:
                                    state = -1;
                                    match = 15;
                                    match_pos = pos;
                                    break;

                                case 15:
                                    state = -1;
                                    match = 20;
                                    match_pos = pos;
                                    break;

                                case 16:
                                    state = -1;
                                    match = 9;
                                    match_pos = pos;
                                    break;

                                case 17:
                                    state = -1;
                                    match = 25;
                                    match_pos = pos;
                                    break;

                                case 18:
                                    if (
                                        info.src.charCodeAt(pos) >= 48 &&
                                        info.src.charCodeAt(pos) <= 57
                                    ) {
                                        state = 18;
                                    } else {
                                        state = -1;
                                    }
                                    match = 5;
                                    match_pos = pos;
                                    break;

                                case 19:
                                    state = -1;
                                    match = 17;
                                    match_pos = pos;
                                    break;

                                case 20:
                                    state = -1;
                                    match = 19;
                                    match_pos = pos;
                                    break;

                                case 21:
                                    state = -1;
                                    match = 18;
                                    match_pos = pos;
                                    break;

                                case 22:
                                    state = -1;
                                    match = 24;
                                    match_pos = pos;
                                    break;

                                case 23:
                                    state = -1;
                                    match = 8;
                                    match_pos = pos;
                                    break;

                                case 24:
                                    if (
                                        (info.src.charCodeAt(pos) >= 48 &&
                                            info.src.charCodeAt(pos) <= 57) ||
                                        (info.src.charCodeAt(pos) >= 65 &&
                                            info.src.charCodeAt(pos) <= 90) ||
                                        (info.src.charCodeAt(pos) >= 97 &&
                                            info.src.charCodeAt(pos) <= 122)
                                    ) {
                                        state = 24;
                                    } else {
                                        state = -1;
                                    }
                                    match = 6;
                                    match_pos = pos;
                                    break;

                                case 25:
                                    state = -1;
                                    match = 10;
                                    match_pos = pos;
                                    break;

                                case 26:
                                    if (info.src.charCodeAt(pos) === 34) {
                                        state = 16;
                                    } else if (
                                        info.src.charCodeAt(pos) === 32 ||
                                        info.src.charCodeAt(pos) === 46 ||
                                        (info.src.charCodeAt(pos) >= 48 &&
                                            info.src.charCodeAt(pos) <= 57) ||
                                        info.src.charCodeAt(pos) === 61 ||
                                        (info.src.charCodeAt(pos) >= 65 &&
                                            info.src.charCodeAt(pos) <= 90) ||
                                        (info.src.charCodeAt(pos) >= 97 &&
                                            info.src.charCodeAt(pos) <= 122) ||
                                        info.src.charCodeAt(pos) === 223 ||
                                        info.src.charCodeAt(pos) === 228 ||
                                        info.src.charCodeAt(pos) === 246 ||
                                        info.src.charCodeAt(pos) === 252
                                    ) {
                                        state = 26;
                                    } else {
                                        state = -1;
                                    }
                                    break;

                                case 27:
                                    if (
                                        (info.src.charCodeAt(pos) >= 48 &&
                                            info.src.charCodeAt(pos) <= 57) ||
                                        (info.src.charCodeAt(pos) >= 65 &&
                                            info.src.charCodeAt(pos) <= 90) ||
                                        (info.src.charCodeAt(pos) >= 97 &&
                                            info.src.charCodeAt(pos) <= 122)
                                    ) {
                                        state = 27;
                                    } else if (info.src.charCodeAt(pos) === 95) {
                                        state = 35;
                                    } else {
                                        state = -1;
                                    }
                                    match = 7;
                                    match_pos = pos;
                                    break;

                                case 28:
                                    if (info.src.charCodeAt(pos) === 38) {
                                        state = 17;
                                    } else if (
                                        (info.src.charCodeAt(pos) >= 65 &&
                                            info.src.charCodeAt(pos) <= 90) ||
                                        (info.src.charCodeAt(pos) >= 97 &&
                                            info.src.charCodeAt(pos) <= 122)
                                    ) {
                                        state = 33;
                                    } else {
                                        state = -1;
                                    }
                                    break;

                                case 29:
                                    if (
                                        info.src.charCodeAt(pos) >= 48 &&
                                        info.src.charCodeAt(pos) <= 57
                                    ) {
                                        state = 18;
                                    } else {
                                        state = -1;
                                    }
                                    break;

                                case 30:
                                    if (info.src.charCodeAt(pos) === 61) {
                                        state = 20;
                                    } else {
                                        state = -1;
                                    }
                                    break;

                                case 31:
                                    if (info.src.charCodeAt(pos) === 95) {
                                        state = 36;
                                    } else {
                                        state = -1;
                                    }
                                    break;

                                case 32:
                                    if (info.src.charCodeAt(pos) === 124) {
                                        state = 22;
                                    } else {
                                        state = -1;
                                    }
                                    break;

                                case 33:
                                    if (info.src.charCodeAt(pos) === 59) {
                                        state = 23;
                                    } else if (
                                        (info.src.charCodeAt(pos) >= 65 &&
                                            info.src.charCodeAt(pos) <= 90) ||
                                        (info.src.charCodeAt(pos) >= 97 &&
                                            info.src.charCodeAt(pos) <= 122)
                                    ) {
                                        state = 33;
                                    } else {
                                        state = -1;
                                    }
                                    break;

                                case 34:
                                    if (
                                        (info.src.charCodeAt(pos) >= 65 &&
                                            info.src.charCodeAt(pos) <= 90) ||
                                        (info.src.charCodeAt(pos) >= 97 &&
                                            info.src.charCodeAt(pos) <= 122)
                                    ) {
                                        state = 37;
                                    } else {
                                        state = -1;
                                    }
                                    break;

                                case 35:
                                    if (
                                        (info.src.charCodeAt(pos) >= 48 &&
                                            info.src.charCodeAt(pos) <= 57) ||
                                        (info.src.charCodeAt(pos) >= 65 &&
                                            info.src.charCodeAt(pos) <= 90) ||
                                        (info.src.charCodeAt(pos) >= 97 &&
                                            info.src.charCodeAt(pos) <= 122)
                                    ) {
                                        state = 27;
                                    } else if (info.src.charCodeAt(pos) === 95) {
                                        state = 35;
                                    } else {
                                        state = -1;
                                    }
                                    break;

                                case 36:
                                    if (
                                        (info.src.charCodeAt(pos) >= 48 &&
                                            info.src.charCodeAt(pos) <= 57) ||
                                        (info.src.charCodeAt(pos) >= 65 &&
                                            info.src.charCodeAt(pos) <= 90) ||
                                        (info.src.charCodeAt(pos) >= 97 &&
                                            info.src.charCodeAt(pos) <= 122)
                                    ) {
                                        state = 24;
                                    } else {
                                        state = -1;
                                    }
                                    break;

                                case 37:
                                    if (info.src.charCodeAt(pos) === 93) {
                                        state = 25;
                                    } else if (
                                        (info.src.charCodeAt(pos) >= 65 &&
                                            info.src.charCodeAt(pos) <= 90) ||
                                        (info.src.charCodeAt(pos) >= 97 &&
                                            info.src.charCodeAt(pos) <= 122)
                                    ) {
                                        state = 37;
                                    } else {
                                        state = -1;
                                    }
                                    break;
                            }
                            pos += 1;
                        } while (state > -1);
                    } while (1 > -1 && match === 1);

                    if (match > -1) {
                        info.att = info.src.substr(start, match_pos - start);
                        info.offset = match_pos;
                    } else {
                        info.att = "";
                        match = -1;
                    }

                    return match;
                }

                function parse(src, err_off, err_la) {
                    var i,
                        act,
                        go,
                        la,
                        rval,
                        rvstack,
                        rsstack,
                        undef,
                        act_tab,
                        pop_tab,
                        goto_tab,
                        labels,
                        sstack = [],
                        vstack = [],
                        err_cnt = 0,
                        info = {};

                    // Pop-Table
                    pop_tab = [
                        [/* p' */ 0, 1],
                        [/* p */ 27, 1],
                        [/* e */ 26, 5],
                        [/* e */ 26, 3],
                        [/* e */ 26, 3],
                        [/* e */ 26, 3],
                        [/* e */ 26, 3],
                        [/* e */ 26, 3],
                        [/* e */ 26, 3],
                        [/* e */ 26, 3],
                        [/* e */ 26, 3],
                        [/* e */ 26, 2],
                        [/* e */ 26, 3],
                        [/* e */ 26, 3],
                        [/* e */ 26, 3],
                        [/* e */ 26, 3],
                        [/* e */ 26, 3],
                        [/* e */ 26, 2],
                        [/* e */ 26, 3],
                        [/* e */ 26, 3],
                        [/* e */ 26, 1],
                        [/* e */ 26, 1],
                        [/* e */ 26, 1],
                        [/* e */ 26, 1],
                        [/* e */ 26, 1],
                        [/* e */ 26, 1],
                        [/* e */ 26, 4],
                        [/* e */ 26, 1]
                    ];

                    // Action-Table
                    act_tab = [
                        /* State 0 */
                        [
                            /* "(" */ 2, 3, /* "!" */ 23, 4, /* "-" */ 12, 5, /* "STRING" */ 9,
                            6, /* "INT" */ 4, 7, /* "FLOAT" */ 5, 8, /* "PARAM" */ 6, 9,
                            /* "HTML" */ 8, 10, /* "COMMAND" */ 10, 11, /* "VAR" */ 7, 12
                        ],
                        /* State 1 */
                        [/* "$$" */ 28, 0],
                        /* State 2 */
                        [
                            /* "/" */ 14, 13, /* "*" */ 13, 14, /* "&&" */ 25, 15,
                            /* "||" */ 24, 16, /* "^" */ 15, 17, /* "-" */ 12, 18, /* "+" */ 11,
                            19, /* ">" */ 22, 20, /* "<" */ 21, 21, /* "!=" */ 20, 22,
                            /* "==" */ 19, 23, /* ">=" */ 18, 24, /* "<=" */ 17, 25,
                            /* "$$" */ 28, -1
                        ],
                        /* State 3 */
                        [
                            /* "(" */ 2, 3, /* "!" */ 23, 4, /* "-" */ 12, 5, /* "STRING" */ 9,
                            6, /* "INT" */ 4, 7, /* "FLOAT" */ 5, 8, /* "PARAM" */ 6, 9,
                            /* "HTML" */ 8, 10, /* "COMMAND" */ 10, 11, /* "VAR" */ 7, 12
                        ],
                        /* State 4 */
                        [
                            /* "(" */ 2, 3, /* "!" */ 23, 4, /* "-" */ 12, 5, /* "STRING" */ 9,
                            6, /* "INT" */ 4, 7, /* "FLOAT" */ 5, 8, /* "PARAM" */ 6, 9,
                            /* "HTML" */ 8, 10, /* "COMMAND" */ 10, 11, /* "VAR" */ 7, 12
                        ],
                        /* State 5 */
                        [
                            /* "(" */ 2, 3, /* "!" */ 23, 4, /* "-" */ 12, 5, /* "STRING" */ 9,
                            6, /* "INT" */ 4, 7, /* "FLOAT" */ 5, 8, /* "PARAM" */ 6, 9,
                            /* "HTML" */ 8, 10, /* "COMMAND" */ 10, 11, /* "VAR" */ 7, 12
                        ],
                        /* State 6 */
                        [
                            /* "+" */ 11, 29, /* "$$" */ 28, -24, /* "<=" */ 17, -24,
                            /* ">=" */ 18, -24, /* "==" */ 19, -24, /* "!=" */ 20, -24,
                            /* "<" */ 21, -24, /* ">" */ 22, -24, /* "-" */ 12, -24,
                            /* "^" */ 15, -24, /* "||" */ 24, -24, /* "&&" */ 25, -24,
                            /* "*" */ 13, -24, /* "/" */ 14, -24, /* "," */ 16, -24,
                            /* ")" */ 3, -24
                        ],
                        /* State 7 */
                        [
                            /* "$$" */ 28, -20, /* "<=" */ 17, -20, /* ">=" */ 18, -20,
                            /* "==" */ 19, -20, /* "!=" */ 20, -20, /* "<" */ 21, -20,
                            /* ">" */ 22, -20, /* "+" */ 11, -20, /* "-" */ 12, -20,
                            /* "^" */ 15, -20, /* "||" */ 24, -20, /* "&&" */ 25, -20,
                            /* "*" */ 13, -20, /* "/" */ 14, -20, /* "," */ 16, -20,
                            /* ")" */ 3, -20
                        ],
                        /* State 8 */
                        [
                            /* "$$" */ 28, -21, /* "<=" */ 17, -21, /* ">=" */ 18, -21,
                            /* "==" */ 19, -21, /* "!=" */ 20, -21, /* "<" */ 21, -21,
                            /* ">" */ 22, -21, /* "+" */ 11, -21, /* "-" */ 12, -21,
                            /* "^" */ 15, -21, /* "||" */ 24, -21, /* "&&" */ 25, -21,
                            /* "*" */ 13, -21, /* "/" */ 14, -21, /* "," */ 16, -21,
                            /* ")" */ 3, -21
                        ],
                        /* State 9 */
                        [
                            /* "$$" */ 28, -22, /* "<=" */ 17, -22, /* ">=" */ 18, -22,
                            /* "==" */ 19, -22, /* "!=" */ 20, -22, /* "<" */ 21, -22,
                            /* ">" */ 22, -22, /* "+" */ 11, -22, /* "-" */ 12, -22,
                            /* "^" */ 15, -22, /* "||" */ 24, -22, /* "&&" */ 25, -22,
                            /* "*" */ 13, -22, /* "/" */ 14, -22, /* "," */ 16, -22,
                            /* ")" */ 3, -22
                        ],
                        /* State 10 */
                        [
                            /* "$$" */ 28, -23, /* "<=" */ 17, -23, /* ">=" */ 18, -23,
                            /* "==" */ 19, -23, /* "!=" */ 20, -23, /* "<" */ 21, -23,
                            /* ">" */ 22, -23, /* "+" */ 11, -23, /* "-" */ 12, -23,
                            /* "^" */ 15, -23, /* "||" */ 24, -23, /* "&&" */ 25, -23,
                            /* "*" */ 13, -23, /* "/" */ 14, -23, /* "," */ 16, -23,
                            /* ")" */ 3, -23
                        ],
                        /* State 11 */
                        [
                            /* "$$" */ 28, -25, /* "<=" */ 17, -25, /* ">=" */ 18, -25,
                            /* "==" */ 19, -25, /* "!=" */ 20, -25, /* "<" */ 21, -25,
                            /* ">" */ 22, -25, /* "+" */ 11, -25, /* "-" */ 12, -25,
                            /* "^" */ 15, -25, /* "||" */ 24, -25, /* "&&" */ 25, -25,
                            /* "*" */ 13, -25, /* "/" */ 14, -25, /* "," */ 16, -25,
                            /* ")" */ 3, -25
                        ],
                        /* State 12 */
                        [
                            /* "(" */ 2, 30, /* "$$" */ 28, -27, /* "<=" */ 17, -27,
                            /* ">=" */ 18, -27, /* "==" */ 19, -27, /* "!=" */ 20, -27,
                            /* "<" */ 21, -27, /* ">" */ 22, -27, /* "+" */ 11, -27,
                            /* "-" */ 12, -27, /* "^" */ 15, -27, /* "||" */ 24, -27,
                            /* "&&" */ 25, -27, /* "*" */ 13, -27, /* "/" */ 14, -27,
                            /* "," */ 16, -27, /* ")" */ 3, -27
                        ],
                        /* State 13 */
                        [
                            /* "(" */ 2, 3, /* "!" */ 23, 4, /* "-" */ 12, 5, /* "STRING" */ 9,
                            6, /* "INT" */ 4, 7, /* "FLOAT" */ 5, 8, /* "PARAM" */ 6, 9,
                            /* "HTML" */ 8, 10, /* "COMMAND" */ 10, 11, /* "VAR" */ 7, 12
                        ],
                        /* State 14 */
                        [
                            /* "(" */ 2, 3, /* "!" */ 23, 4, /* "-" */ 12, 5, /* "STRING" */ 9,
                            6, /* "INT" */ 4, 7, /* "FLOAT" */ 5, 8, /* "PARAM" */ 6, 9,
                            /* "HTML" */ 8, 10, /* "COMMAND" */ 10, 11, /* "VAR" */ 7, 12
                        ],
                        /* State 15 */
                        [
                            /* "(" */ 2, 3, /* "!" */ 23, 4, /* "-" */ 12, 5, /* "STRING" */ 9,
                            6, /* "INT" */ 4, 7, /* "FLOAT" */ 5, 8, /* "PARAM" */ 6, 9,
                            /* "HTML" */ 8, 10, /* "COMMAND" */ 10, 11, /* "VAR" */ 7, 12
                        ],
                        /* State 16 */
                        [
                            /* "(" */ 2, 3, /* "!" */ 23, 4, /* "-" */ 12, 5, /* "STRING" */ 9,
                            6, /* "INT" */ 4, 7, /* "FLOAT" */ 5, 8, /* "PARAM" */ 6, 9,
                            /* "HTML" */ 8, 10, /* "COMMAND" */ 10, 11, /* "VAR" */ 7, 12
                        ],
                        /* State 17 */
                        [
                            /* "(" */ 2, 3, /* "!" */ 23, 4, /* "-" */ 12, 5, /* "STRING" */ 9,
                            6, /* "INT" */ 4, 7, /* "FLOAT" */ 5, 8, /* "PARAM" */ 6, 9,
                            /* "HTML" */ 8, 10, /* "COMMAND" */ 10, 11, /* "VAR" */ 7, 12
                        ],
                        /* State 18 */
                        [
                            /* "(" */ 2, 3, /* "!" */ 23, 4, /* "-" */ 12, 5, /* "STRING" */ 9,
                            6, /* "INT" */ 4, 7, /* "FLOAT" */ 5, 8, /* "PARAM" */ 6, 9,
                            /* "HTML" */ 8, 10, /* "COMMAND" */ 10, 11, /* "VAR" */ 7, 12
                        ],
                        /* State 19 */
                        [
                            /* "(" */ 2, 3, /* "!" */ 23, 4, /* "-" */ 12, 5, /* "STRING" */ 9,
                            6, /* "INT" */ 4, 7, /* "FLOAT" */ 5, 8, /* "PARAM" */ 6, 9,
                            /* "HTML" */ 8, 10, /* "COMMAND" */ 10, 11, /* "VAR" */ 7, 12
                        ],
                        /* State 20 */
                        [
                            /* "(" */ 2, 3, /* "!" */ 23, 4, /* "-" */ 12, 5, /* "STRING" */ 9,
                            6, /* "INT" */ 4, 7, /* "FLOAT" */ 5, 8, /* "PARAM" */ 6, 9,
                            /* "HTML" */ 8, 10, /* "COMMAND" */ 10, 11, /* "VAR" */ 7, 12
                        ],
                        /* State 21 */
                        [
                            /* "(" */ 2, 3, /* "!" */ 23, 4, /* "-" */ 12, 5, /* "STRING" */ 9,
                            6, /* "INT" */ 4, 7, /* "FLOAT" */ 5, 8, /* "PARAM" */ 6, 9,
                            /* "HTML" */ 8, 10, /* "COMMAND" */ 10, 11, /* "VAR" */ 7, 12
                        ],
                        /* State 22 */
                        [
                            /* "(" */ 2, 3, /* "!" */ 23, 4, /* "-" */ 12, 5, /* "STRING" */ 9,
                            6, /* "INT" */ 4, 7, /* "FLOAT" */ 5, 8, /* "PARAM" */ 6, 9,
                            /* "HTML" */ 8, 10, /* "COMMAND" */ 10, 11, /* "VAR" */ 7, 12
                        ],
                        /* State 23 */
                        [
                            /* "(" */ 2, 3, /* "!" */ 23, 4, /* "-" */ 12, 5, /* "STRING" */ 9,
                            6, /* "INT" */ 4, 7, /* "FLOAT" */ 5, 8, /* "PARAM" */ 6, 9,
                            /* "HTML" */ 8, 10, /* "COMMAND" */ 10, 11, /* "VAR" */ 7, 12
                        ],
                        /* State 24 */
                        [
                            /* "(" */ 2, 3, /* "!" */ 23, 4, /* "-" */ 12, 5, /* "STRING" */ 9,
                            6, /* "INT" */ 4, 7, /* "FLOAT" */ 5, 8, /* "PARAM" */ 6, 9,
                            /* "HTML" */ 8, 10, /* "COMMAND" */ 10, 11, /* "VAR" */ 7, 12
                        ],
                        /* State 25 */
                        [
                            /* "(" */ 2, 3, /* "!" */ 23, 4, /* "-" */ 12, 5, /* "STRING" */ 9,
                            6, /* "INT" */ 4, 7, /* "FLOAT" */ 5, 8, /* "PARAM" */ 6, 9,
                            /* "HTML" */ 8, 10, /* "COMMAND" */ 10, 11, /* "VAR" */ 7, 12
                        ],
                        /* State 26 */
                        [
                            /* "/" */ 14, 13, /* "*" */ 13, 14, /* "&&" */ 25, 15,
                            /* "||" */ 24, 16, /* "^" */ 15, 17, /* "-" */ 12, 18, /* "+" */ 11,
                            19, /* ">" */ 22, 20, /* "<" */ 21, 21, /* "!=" */ 20, 22,
                            /* "==" */ 19, 23, /* ">=" */ 18, 24, /* "<=" */ 17, 25,
                            /* "," */ 16, 44, /* ")" */ 3, 45
                        ],
                        /* State 27 */
                        [
                            /* "/" */ 14, -11, /* "*" */ 13, -11, /* "&&" */ 25, 15,
                            /* "||" */ 24, 16, /* "^" */ 15, -11, /* "-" */ 12, -11,
                            /* "+" */ 11, -11, /* ">" */ 22, -11, /* "<" */ 21, -11,
                            /* "!=" */ 20, -11, /* "==" */ 19, -11, /* ">=" */ 18, -11,
                            /* "<=" */ 17, -11, /* "$$" */ 28, -11, /* "," */ 16, -11,
                            /* ")" */ 3, -11
                        ],
                        /* State 28 */
                        [
                            /* "/" */ 14, -17, /* "*" */ 13, -17, /* "&&" */ 25, 15,
                            /* "||" */ 24, 16, /* "^" */ 15, 17, /* "-" */ 12, -17,
                            /* "+" */ 11, -17, /* ">" */ 22, 20, /* "<" */ 21, 21,
                            /* "!=" */ 20, 22, /* "==" */ 19, 23, /* ">=" */ 18, 24,
                            /* "<=" */ 17, 25, /* "$$" */ 28, -17, /* "," */ 16, -17,
                            /* ")" */ 3, -17
                        ],
                        /* State 29 */
                        [
                            /* "(" */ 2, 3, /* "!" */ 23, 4, /* "-" */ 12, 5, /* "STRING" */ 9,
                            6, /* "INT" */ 4, 7, /* "FLOAT" */ 5, 8, /* "PARAM" */ 6, 9,
                            /* "HTML" */ 8, 10, /* "COMMAND" */ 10, 11, /* "VAR" */ 7, 12
                        ],
                        /* State 30 */
                        [
                            /* "(" */ 2, 3, /* "!" */ 23, 4, /* "-" */ 12, 5, /* "STRING" */ 9,
                            6, /* "INT" */ 4, 7, /* "FLOAT" */ 5, 8, /* "PARAM" */ 6, 9,
                            /* "HTML" */ 8, 10, /* "COMMAND" */ 10, 11, /* "VAR" */ 7, 12
                        ],
                        /* State 31 */
                        [
                            /* "/" */ 14, -16, /* "*" */ 13, -16, /* "&&" */ 25, 15,
                            /* "||" */ 24, 16, /* "^" */ 15, 17, /* "-" */ 12, -16,
                            /* "+" */ 11, -16, /* ">" */ 22, 20, /* "<" */ 21, 21,
                            /* "!=" */ 20, 22, /* "==" */ 19, 23, /* ">=" */ 18, 24,
                            /* "<=" */ 17, 25, /* "$$" */ 28, -16, /* "," */ 16, -16,
                            /* ")" */ 3, -16
                        ],
                        /* State 32 */
                        [
                            /* "/" */ 14, -15, /* "*" */ 13, -15, /* "&&" */ 25, 15,
                            /* "||" */ 24, 16, /* "^" */ 15, 17, /* "-" */ 12, -15,
                            /* "+" */ 11, -15, /* ">" */ 22, 20, /* "<" */ 21, 21,
                            /* "!=" */ 20, 22, /* "==" */ 19, 23, /* ">=" */ 18, 24,
                            /* "<=" */ 17, 25, /* "$$" */ 28, -15, /* "," */ 16, -15,
                            /* ")" */ 3, -15
                        ],
                        /* State 33 */
                        [
                            /* "/" */ 14, -14, /* "*" */ 13, -14, /* "&&" */ 25, -14,
                            /* "||" */ 24, -14, /* "^" */ 15, -14, /* "-" */ 12, -14,
                            /* "+" */ 11, -14, /* ">" */ 22, -14, /* "<" */ 21, -14,
                            /* "!=" */ 20, -14, /* "==" */ 19, -14, /* ">=" */ 18, -14,
                            /* "<=" */ 17, -14, /* "$$" */ 28, -14, /* "," */ 16, -14,
                            /* ")" */ 3, -14
                        ],
                        /* State 34 */
                        [
                            /* "/" */ 14, -13, /* "*" */ 13, -13, /* "&&" */ 25, -13,
                            /* "||" */ 24, -13, /* "^" */ 15, -13, /* "-" */ 12, -13,
                            /* "+" */ 11, -13, /* ">" */ 22, -13, /* "<" */ 21, -13,
                            /* "!=" */ 20, -13, /* "==" */ 19, -13, /* ">=" */ 18, -13,
                            /* "<=" */ 17, -13, /* "$$" */ 28, -13, /* "," */ 16, -13,
                            /* ")" */ 3, -13
                        ],
                        /* State 35 */
                        [
                            /* "/" */ 14, -12, /* "*" */ 13, -12, /* "&&" */ 25, 15,
                            /* "||" */ 24, 16, /* "^" */ 15, -12, /* "-" */ 12, -12,
                            /* "+" */ 11, -12, /* ">" */ 22, 20, /* "<" */ 21, 21,
                            /* "!=" */ 20, 22, /* "==" */ 19, 23, /* ">=" */ 18, 24,
                            /* "<=" */ 17, 25, /* "$$" */ 28, -12, /* "," */ 16, -12,
                            /* ")" */ 3, -12
                        ],
                        /* State 36 */
                        [
                            /* "/" */ 14, 13, /* "*" */ 13, 14, /* "&&" */ 25, 15,
                            /* "||" */ 24, 16, /* "^" */ 15, 17, /* "-" */ 12, -10,
                            /* "+" */ 11, -10, /* ">" */ 22, 20, /* "<" */ 21, 21,
                            /* "!=" */ 20, 22, /* "==" */ 19, 23, /* ">=" */ 18, 24,
                            /* "<=" */ 17, 25, /* "$$" */ 28, -10, /* "," */ 16, -10,
                            /* ")" */ 3, -10
                        ],
                        /* State 37 */
                        [
                            /* "/" */ 14, 13, /* "*" */ 13, 14, /* "&&" */ 25, 15,
                            /* "||" */ 24, 16, /* "^" */ 15, 17, /* "-" */ 12, -9, /* "+" */ 11,
                            -9, /* ">" */ 22, 20, /* "<" */ 21, 21, /* "!=" */ 20, 22,
                            /* "==" */ 19, 23, /* ">=" */ 18, 24, /* "<=" */ 17, 25,
                            /* "$$" */ 28, -9, /* "," */ 16, -9, /* ")" */ 3, -9
                        ],
                        /* State 38 */
                        [
                            /* "/" */ 14, -8, /* "*" */ 13, -8, /* "&&" */ 25, 15,
                            /* "||" */ 24, 16, /* "^" */ 15, -8, /* "-" */ 12, -8, /* "+" */ 11,
                            -8, /* ">" */ 22, -8, /* "<" */ 21, -8, /* "!=" */ 20, -8,
                            /* "==" */ 19, -8, /* ">=" */ 18, -8, /* "<=" */ 17, -8,
                            /* "$$" */ 28, -8, /* "," */ 16, -8, /* ")" */ 3, -8
                        ],
                        /* State 39 */
                        [
                            /* "/" */ 14, -7, /* "*" */ 13, -7, /* "&&" */ 25, 15,
                            /* "||" */ 24, 16, /* "^" */ 15, -7, /* "-" */ 12, -7, /* "+" */ 11,
                            -7, /* ">" */ 22, -7, /* "<" */ 21, -7, /* "!=" */ 20, -7,
                            /* "==" */ 19, -7, /* ">=" */ 18, -7, /* "<=" */ 17, -7,
                            /* "$$" */ 28, -7, /* "," */ 16, -7, /* ")" */ 3, -7
                        ],
                        /* State 40 */
                        [
                            /* "/" */ 14, -6, /* "*" */ 13, -6, /* "&&" */ 25, 15,
                            /* "||" */ 24, 16, /* "^" */ 15, -6, /* "-" */ 12, -6, /* "+" */ 11,
                            -6, /* ">" */ 22, -6, /* "<" */ 21, -6, /* "!=" */ 20, -6,
                            /* "==" */ 19, -6, /* ">=" */ 18, -6, /* "<=" */ 17, -6,
                            /* "$$" */ 28, -6, /* "," */ 16, -6, /* ")" */ 3, -6
                        ],
                        /* State 41 */
                        [
                            /* "/" */ 14, -5, /* "*" */ 13, -5, /* "&&" */ 25, 15,
                            /* "||" */ 24, 16, /* "^" */ 15, -5, /* "-" */ 12, -5, /* "+" */ 11,
                            -5, /* ">" */ 22, -5, /* "<" */ 21, -5, /* "!=" */ 20, -5,
                            /* "==" */ 19, -5, /* ">=" */ 18, -5, /* "<=" */ 17, -5,
                            /* "$$" */ 28, -5, /* "," */ 16, -5, /* ")" */ 3, -5
                        ],
                        /* State 42 */
                        [
                            /* "/" */ 14, -4, /* "*" */ 13, -4, /* "&&" */ 25, 15,
                            /* "||" */ 24, 16, /* "^" */ 15, -4, /* "-" */ 12, -4, /* "+" */ 11,
                            -4, /* ">" */ 22, -4, /* "<" */ 21, -4, /* "!=" */ 20, -4,
                            /* "==" */ 19, -4, /* ">=" */ 18, -4, /* "<=" */ 17, -4,
                            /* "$$" */ 28, -4, /* "," */ 16, -4, /* ")" */ 3, -4
                        ],
                        /* State 43 */
                        [
                            /* "/" */ 14, -3, /* "*" */ 13, -3, /* "&&" */ 25, 15,
                            /* "||" */ 24, 16, /* "^" */ 15, -3, /* "-" */ 12, -3, /* "+" */ 11,
                            -3, /* ">" */ 22, -3, /* "<" */ 21, -3, /* "!=" */ 20, -3,
                            /* "==" */ 19, -3, /* ">=" */ 18, -3, /* "<=" */ 17, -3,
                            /* "$$" */ 28, -3, /* "," */ 16, -3, /* ")" */ 3, -3
                        ],
                        /* State 44 */
                        [
                            /* "(" */ 2, 3, /* "!" */ 23, 4, /* "-" */ 12, 5, /* "STRING" */ 9,
                            6, /* "INT" */ 4, 7, /* "FLOAT" */ 5, 8, /* "PARAM" */ 6, 9,
                            /* "HTML" */ 8, 10, /* "COMMAND" */ 10, 11, /* "VAR" */ 7, 12
                        ],
                        /* State 45 */
                        [
                            /* "$$" */ 28, -18, /* "<=" */ 17, -18, /* ">=" */ 18, -18,
                            /* "==" */ 19, -18, /* "!=" */ 20, -18, /* "<" */ 21, -18,
                            /* ">" */ 22, -18, /* "+" */ 11, -18, /* "-" */ 12, -18,
                            /* "^" */ 15, -18, /* "||" */ 24, -18, /* "&&" */ 25, -18,
                            /* "*" */ 13, -18, /* "/" */ 14, -18, /* "," */ 16, -18,
                            /* ")" */ 3, -18
                        ],
                        /* State 46 */
                        [
                            /* "/" */ 14, 13, /* "*" */ 13, 14, /* "&&" */ 25, 15,
                            /* "||" */ 24, 16, /* "^" */ 15, 17, /* "-" */ 12, -19,
                            /* "+" */ 11, -19, /* ">" */ 22, 20, /* "<" */ 21, 21,
                            /* "!=" */ 20, 22, /* "==" */ 19, 23, /* ">=" */ 18, 24,
                            /* "<=" */ 17, 25, /* "$$" */ 28, -19, /* "," */ 16, -19,
                            /* ")" */ 3, -19
                        ],
                        /* State 47 */
                        [
                            /* "/" */ 14, 13, /* "*" */ 13, 14, /* "&&" */ 25, 15,
                            /* "||" */ 24, 16, /* "^" */ 15, 17, /* "-" */ 12, 18, /* "+" */ 11,
                            19, /* ">" */ 22, 20, /* "<" */ 21, 21, /* "!=" */ 20, 22,
                            /* "==" */ 19, 23, /* ">=" */ 18, 24, /* "<=" */ 17, 25,
                            /* ")" */ 3, 49
                        ],
                        /* State 48 */
                        [
                            /* "/" */ 14, 13, /* "*" */ 13, 14, /* "&&" */ 25, 15,
                            /* "||" */ 24, 16, /* "^" */ 15, 17, /* "-" */ 12, 18, /* "+" */ 11,
                            19, /* ">" */ 22, 20, /* "<" */ 21, 21, /* "!=" */ 20, 22,
                            /* "==" */ 19, 23, /* ">=" */ 18, 24, /* "<=" */ 17, 25,
                            /* ")" */ 3, 50
                        ],
                        /* State 49 */
                        [
                            /* "$$" */ 28, -26, /* "<=" */ 17, -26, /* ">=" */ 18, -26,
                            /* "==" */ 19, -26, /* "!=" */ 20, -26, /* "<" */ 21, -26,
                            /* ">" */ 22, -26, /* "+" */ 11, -26, /* "-" */ 12, -26,
                            /* "^" */ 15, -26, /* "||" */ 24, -26, /* "&&" */ 25, -26,
                            /* "*" */ 13, -26, /* "/" */ 14, -26, /* "," */ 16, -26,
                            /* ")" */ 3, -26
                        ],
                        /* State 50 */
                        [
                            /* "$$" */ 28, -2, /* "<=" */ 17, -2, /* ">=" */ 18, -2,
                            /* "==" */ 19, -2, /* "!=" */ 20, -2, /* "<" */ 21, -2,
                            /* ">" */ 22, -2, /* "+" */ 11, -2, /* "-" */ 12, -2, /* "^" */ 15,
                            -2, /* "||" */ 24, -2, /* "&&" */ 25, -2, /* "*" */ 13, -2,
                            /* "/" */ 14, -2, /* "," */ 16, -2, /* ")" */ 3, -2
                        ]
                    ];

                    // Goto-Table
                    goto_tab = [
                        /* State 0 */
                        [/* p */ 27, 1, /* e */ 26, 2],
                        /* State 1 */
                        [],
                        /* State 2 */
                        [],
                        /* State 3 */
                        [/* e */ 26, 26],
                        /* State 4 */
                        [/* e */ 26, 27],
                        /* State 5 */
                        [/* e */ 26, 28],
                        /* State 6 */
                        [],
                        /* State 7 */
                        [],
                        /* State 8 */
                        [],
                        /* State 9 */
                        [],
                        /* State 10 */
                        [],
                        /* State 11 */
                        [],
                        /* State 12 */
                        [],
                        /* State 13 */
                        [/* e */ 26, 31],
                        /* State 14 */
                        [/* e */ 26, 32],
                        /* State 15 */
                        [/* e */ 26, 33],
                        /* State 16 */
                        [/* e */ 26, 34],
                        /* State 17 */
                        [/* e */ 26, 35],
                        /* State 18 */
                        [/* e */ 26, 36],
                        /* State 19 */
                        [/* e */ 26, 37],
                        /* State 20 */
                        [/* e */ 26, 38],
                        /* State 21 */
                        [/* e */ 26, 39],
                        /* State 22 */
                        [/* e */ 26, 40],
                        /* State 23 */
                        [/* e */ 26, 41],
                        /* State 24 */
                        [/* e */ 26, 42],
                        /* State 25 */
                        [/* e */ 26, 43],
                        /* State 26 */
                        [],
                        /* State 27 */
                        [],
                        /* State 28 */
                        [],
                        /* State 29 */
                        [/* e */ 26, 46],
                        /* State 30 */
                        [/* e */ 26, 47],
                        /* State 31 */
                        [],
                        /* State 32 */
                        [],
                        /* State 33 */
                        [],
                        /* State 34 */
                        [],
                        /* State 35 */
                        [],
                        /* State 36 */
                        [],
                        /* State 37 */
                        [],
                        /* State 38 */
                        [],
                        /* State 39 */
                        [],
                        /* State 40 */
                        [],
                        /* State 41 */
                        [],
                        /* State 42 */
                        [],
                        /* State 43 */
                        [],
                        /* State 44 */
                        [/* e */ 26, 48],
                        /* State 45 */
                        [],
                        /* State 46 */
                        [],
                        /* State 47 */
                        [],
                        /* State 48 */
                        [],
                        /* State 49 */
                        [],
                        /* State 50 */
                        []
                    ];

                    // Symbol labels
                    labels = [
                        /* Non-terminal symbol */
                        "p'",
                        /* Terminal symbol */
                        "WHITESPACE",
                        /* Terminal symbol */
                        "(",
                        /* Terminal symbol */
                        ")",
                        /* Terminal symbol */
                        "INT",
                        /* Terminal symbol */
                        "FLOAT",
                        /* Terminal symbol */
                        "PARAM",
                        /* Terminal symbol */
                        "VAR",
                        /* Terminal symbol */
                        "HTML",
                        /* Terminal symbol */
                        "STRING",
                        /* Terminal symbol */
                        "COMMAND",
                        /* Terminal symbol */
                        "+",
                        /* Terminal symbol */
                        "-",
                        /* Terminal symbol */
                        "*",
                        /* Terminal symbol */
                        "/",
                        /* Terminal symbol */
                        "^",
                        /* Terminal symbol */
                        ",",
                        /* Terminal symbol */
                        "<=",
                        /* Terminal symbol */
                        ">=",
                        /* Terminal symbol */
                        "==",
                        /* Terminal symbol */
                        "!=",
                        /* Terminal symbol */
                        "<",
                        /* Terminal symbol */
                        ">",
                        /* Terminal symbol */
                        "!",
                        /* Terminal symbol */
                        "||",
                        /* Terminal symbol */
                        "&&",
                        /* Non-terminal symbol */
                        "e",
                        /* Non-terminal symbol */
                        "p",
                        /* Terminal symbol */
                        "$$"
                    ];

                    info.offset = 0;
                    info.src = src;
                    info.att = "";

                    if (!err_off) {
                        err_off = [];
                    }

                    if (!err_la) {
                        err_la = [];
                    }

                    sstack.push(0);
                    vstack.push(0);

                    la = lex(info);

                    while (true) {
                        act = 52;

                        for (i = 0; i < act_tab[sstack[sstack.length - 1]].length; i += 2) {
                            if (act_tab[sstack[sstack.length - 1]][i] === la) {
                                act = act_tab[sstack[sstack.length - 1]][i + 1];
                                break;
                            }
                        }

                        if (dbg_withtrace && sstack.length > 0) {
                            dbg_print(
                                "\nState " +
                                    sstack[sstack.length - 1] +
                                    "\n" +
                                    "\tLookahead: " +
                                    labels[la] +
                                    " ('" +
                                    info.att +
                                    "')\n" +
                                    "\tAction: " +
                                    act +
                                    "\n" +
                                    "\tSource: '" +
                                    info.src.substr(info.offset, 30) +
                                    (info.offset + 30 < info.src.length ? "..." : "") +
                                    "'\n" +
                                    "\tStack: " +
                                    sstack.join() +
                                    "\n" +
                                    "\tValue stack: " +
                                    vstack.join() +
                                    "\n"
                            );
                        }

                        //Panic-mode: Try recovery when parse-error occurs!
                        if (act === 52) {
                            if (dbg_withtrace) {
                                dbg_print(
                                    "Error detected: There is no reduce or shift on the symbol " +
                                        labels[la]
                                );
                            }

                            err_cnt += 1;
                            err_off.push(info.offset - info.att.length);
                            err_la.push([]);
                            for (i = 0; i < act_tab[sstack[sstack.length - 1]].length; i += 2) {
                                err_la[err_la.length - 1].push(
                                    labels[act_tab[sstack[sstack.length - 1]][i]]
                                );
                            }

                            //Remember the original stack!
                            rsstack = [];
                            rvstack = [];
                            for (i = 0; i < sstack.length; i++) {
                                rsstack[i] = sstack[i];
                                rvstack[i] = vstack[i];
                            }

                            while (act === 52 && la !== 28) {
                                if (dbg_withtrace) {
                                    dbg_print(
                                        "\tError recovery\n" +
                                            "Current lookahead: " +
                                            labels[la] +
                                            " (" +
                                            info.att +
                                            ")\n" +
                                            "Action: " +
                                            act +
                                            "\n\n"
                                    );
                                }

                                if (la === -1) {
                                    info.offset += 1;
                                }

                                while (act === 52 && sstack.length > 0) {
                                    sstack.pop();
                                    vstack.pop();

                                    if (sstack.length === 0) {
                                        break;
                                    }

                                    act = 52;

                                    for (
                                        i = 0;
                                        i < act_tab[sstack[sstack.length - 1]].length;
                                        i += 2
                                    ) {
                                        if (act_tab[sstack[sstack.length - 1]][i] === la) {
                                            act = act_tab[sstack[sstack.length - 1]][i + 1];
                                            break;
                                        }
                                    }
                                }

                                if (act !== 52) {
                                    break;
                                }

                                for (i = 0; i < rsstack.length; i++) {
                                    sstack.push(rsstack[i]);
                                    vstack.push(rvstack[i]);
                                }

                                la = lex(info);
                            }

                            if (act === 52) {
                                if (dbg_withtrace) {
                                    dbg_print(
                                        "\tError recovery failed, terminating parse process..."
                                    );
                                }
                                break;
                            }

                            if (dbg_withtrace) {
                                dbg_print("\tError recovery succeeded, continuing");
                            }
                        }

                        //Shift
                        if (act > 0) {
                            if (dbg_withtrace) {
                                dbg_print(
                                    "Shifting symbol: " + labels[la] + " (" + info.att + ")"
                                );
                            }

                            sstack.push(act);
                            vstack.push(info.att);

                            la = lex(info);

                            if (dbg_withtrace) {
                                dbg_print(
                                    "\tNew lookahead symbol: " +
                                        labels[la] +
                                        " (" +
                                        info.att +
                                        ")"
                                );
                            }
                            //Reduce
                        } else {
                            act *= -1;

                            if (dbg_withtrace) {
                                dbg_print("Reducing by producution: " + act);
                            }

                            rval = undef;

                            if (dbg_withtrace) {
                                dbg_print("\tPerforming semantic action...");
                            }

                            switch (act) {
                                case 0:
                                    rval = vstack[vstack.length - 1];
                                    break;
                                case 1:
                                    rval = ggbr.ggbAct("end", vstack[vstack.length - 1]);
                                    break;
                                case 2:
                                    rval = ggbr.ggbAct(
                                        "coord",
                                        vstack[vstack.length - 4],
                                        vstack[vstack.length - 2],
                                        element
                                    );
                                    break;
                                case 3:
                                    rval = ggbr.ggbAct(
                                        "le",
                                        vstack[vstack.length - 3],
                                        vstack[vstack.length - 1]
                                    );
                                    break;
                                case 4:
                                    rval = ggbr.ggbAct(
                                        "ge",
                                        vstack[vstack.length - 3],
                                        vstack[vstack.length - 1]
                                    );
                                    break;
                                case 5:
                                    rval = ggbr.ggbAct(
                                        "eq",
                                        vstack[vstack.length - 3],
                                        vstack[vstack.length - 1]
                                    );
                                    break;
                                case 6:
                                    rval = ggbr.ggbAct(
                                        "neq",
                                        vstack[vstack.length - 3],
                                        vstack[vstack.length - 1]
                                    );
                                    break;
                                case 7:
                                    rval = ggbr.ggbAct(
                                        "lt",
                                        vstack[vstack.length - 3],
                                        vstack[vstack.length - 1]
                                    );
                                    break;
                                case 8:
                                    rval = ggbr.ggbAct(
                                        "gt",
                                        vstack[vstack.length - 3],
                                        vstack[vstack.length - 1]
                                    );
                                    break;
                                case 9:
                                    rval = ggbr.ggbAct(
                                        "add",
                                        vstack[vstack.length - 3],
                                        vstack[vstack.length - 1]
                                    );
                                    break;
                                case 10:
                                    rval = ggbr.ggbAct(
                                        "sub",
                                        vstack[vstack.length - 3],
                                        vstack[vstack.length - 1]
                                    );
                                    break;
                                case 11:
                                    rval = ggbr.ggbAct("neg", vstack[vstack.length - 1]);
                                    break;
                                case 12:
                                    rval = ggbr.ggbAct(
                                        "pow",
                                        vstack[vstack.length - 3],
                                        vstack[vstack.length - 1]
                                    );
                                    break;
                                case 13:
                                    rval = ggbr.ggbAct(
                                        "or",
                                        vstack[vstack.length - 3],
                                        vstack[vstack.length - 1]
                                    );
                                    break;
                                case 14:
                                    rval = ggbr.ggbAct(
                                        "and",
                                        vstack[vstack.length - 3],
                                        vstack[vstack.length - 1]
                                    );
                                    break;
                                case 15:
                                    rval = ggbr.ggbAct(
                                        "mul",
                                        vstack[vstack.length - 3],
                                        vstack[vstack.length - 1]
                                    );
                                    break;
                                case 16:
                                    rval = ggbr.ggbAct(
                                        "div",
                                        vstack[vstack.length - 3],
                                        vstack[vstack.length - 1]
                                    );
                                    break;
                                case 17:
                                    rval = ggbr.ggbAct("negmult", vstack[vstack.length - 1]);
                                    break;
                                case 18:
                                    rval = ggbr.ggbAct("bra", vstack[vstack.length - 2]);
                                    break;
                                case 19:
                                    rval = ggbr.ggbAct(
                                        "string",
                                        vstack[vstack.length - 3],
                                        vstack[vstack.length - 1]
                                    );
                                    break;
                                case 20:
                                    rval = ggbr.ggbAct("int", vstack[vstack.length - 1]);
                                    break;
                                case 21:
                                    rval = ggbr.ggbAct("float", vstack[vstack.length - 1]);
                                    break;
                                case 22:
                                    rval = ggbr.ggbAct("param", vstack[vstack.length - 1]);
                                    break;
                                case 23:
                                    rval = ggbr.ggbAct("html", vstack[vstack.length - 1]);
                                    break;
                                case 24:
                                    rval = ggbr.ggbAct("string", vstack[vstack.length - 1]);
                                    break;
                                case 25:
                                    rval = ggbr.ggbAct("command", vstack[vstack.length - 1]);
                                    break;
                                case 26:
                                    rval = ggbr.ggbAct(
                                        "var",
                                        vstack[vstack.length - 4],
                                        vstack[vstack.length - 2]
                                    );
                                    break;
                                case 27:
                                    rval = ggbr.ggbAct("var", vstack[vstack.length - 1]);
                                    break;
                            }

                            if (dbg_withtrace) {
                                dbg_print("\tPopping " + pop_tab[act][1] + " off the stack...");
                            }

                            for (i = 0; i < pop_tab[act][1]; i++) {
                                sstack.pop();
                                str = vstack.pop();
                            }

                            go = -1;
                            for (
                                i = 0;
                                i < goto_tab[sstack[sstack.length - 1]].length;
                                i += 2
                            ) {
                                if (
                                    goto_tab[sstack[sstack.length - 1]][i] === pop_tab[act][0]
                                ) {
                                    go = goto_tab[sstack[sstack.length - 1]][i + 1];
                                    break;
                                }
                            }

                            if (act === 0) {
                                break;
                            }

                            if (dbg_withtrace) {
                                dbg_print("\tPushing non-terminal " + labels[pop_tab[act][0]]);
                            }

                            sstack.push(go);
                            vstack.push(rval);
                        }

                        if (dbg_withtrace) {
                            JXG.debug(dbg_string);
                            dbg_string = "";
                        }
                    }

                    if (dbg_withtrace) {
                        dbg_print("\nParse complete.");
                        JXG.debug(dbg_string);
                    }

                    return err_cnt;
                }
                /***** end replace *****/

                if ((error_count = parse(str, error_offsets, error_lookaheads)) > 0) {
                    for (i = 0; i < error_count; i++) {
                        errstr +=
                            "Parse error in line " +
                            (str.substr(0, error_offsets[i]).match(/\n/g)
                                ? str.substr(0, error_offsets[i]).match(/\n/g).length
                                : 1) +
                            " near '" +
                            str.substr(error_offsets[i]) +
                            "', expecting '" +
                            error_lookaheads[i].join() +
                            "'\n";
                    }
                    JXG.debug(errstr);
                }

                return str;
            },

            /**
             * Override JSxGraph defaults with Geogebra settings
             */
            setDefaultOptions: function () {
                this.board.options.elements.strokeWidth = 1;
                this.board.options.elements.withLabel = true;

                this.board.options.point.face = "circle";
                this.board.options.point.size = 3;
                this.board.options.point.fillColor = "blue";
                this.board.options.point.fillOpacity = 1;
                this.board.options.point.highlightFillOpacity = 1;
                this.board.options.point.strokeColor = "black";
                this.board.options.point.highlightStrokeColor = "black";
                this.board.options.point.strokeWidth = 2;

                this.board.options.line.strokeWidth = 1;
                this.board.options.line.highlightStrokeColor = "#000000";
                this.board.options.line.strokeColor = "#000000";

                this.board.options.polygon.fillColor = JXG.rgb2hex(153, 51, 0);
                this.board.options.polygon.fillOpacity = 0.1;
                this.board.options.polygon.highlightFillColor =
                    this.board.options.polygon.fillColor;
                this.board.options.polygon.highlightFillOpacity = 0.1;

                this.board.options.sector.fillColor = JXG.rgb2hex(153, 51, 0);
                this.board.options.sector.fillOpacity = 0.1;
                this.board.options.sector.highlightFillColor =
                    this.board.options.sector.fillColor;
                this.board.options.sector.highlightFillOpacity = 0.1;

                this.board.options.angle.fillColor = JXG.rgb2hex(0, 100, 0);
                this.board.options.angle.fillOpacity = 0.1;
                this.board.options.angle.highlightFillOpacity = 0.1;
            },

            /**
             * Set color properties of a geogebra element.
             * Set stroke, fill, lighting, label and draft color attributes.
             * @param {Object} Data gxtEl element of which attributes are to set
             * @param {Object} attr object carrying all necessary attribute values
             * @returns {Object} returning the updated attr-attributes object
             */
            colorProperties: function (Data, attr) {
                var a,
                    r,
                    g,
                    b,
                    objColor = Data.getElementsByTagName("objColor")[0],
                    len = Data.getElementsByTagName("objColor").length > 0;

                a =
                    len && objColor.getAttribute("alpha")
                        ? parseFloat(objColor.getAttribute("alpha"))
                        : 0;
                r =
                    len && objColor.getAttribute("r")
                        ? parseInt(objColor.getAttribute("r"), 10).toString(16)
                        : 0;
                g =
                    len && objColor.getAttribute("g")
                        ? parseInt(objColor.getAttribute("g"), 10).toString(16)
                        : 0;
                b =
                    len && objColor.getAttribute("b")
                        ? parseInt(objColor.getAttribute("b"), 10).toString(16)
                        : 0;

                if (r.length === 1) {
                    r = "0" + r;
                }

                if (g.length === 1) {
                    g = "0" + g;
                }

                if (b.length === 1) {
                    b = "0" + b;
                }

                attr.fillColor = "#" + r + g + b;
                attr.strokeColor = attr.fillColor;
                attr.highlightFillColor = attr.fillColor;
                attr.highlightStrokeColor = attr.strokeColor;
                attr.fillOpacity = a;
                attr.highlightFillOpacity = a;
                attr.labelColor = attr.fillColor;

                return attr;
            },

            /**
             * Set the board properties.
             * Set active, area, dash, draft and showinfo attributes.
             * @param {Object} gxtEl element of which attributes are to set
             * @param {Object} Data element of which attributes are to set
             * @param {Object} attr object containing the necessary attribute values
             * @returns {Object} The attr parameter
             */
            boardProperties: function (gxtEl, Data, attr) {
                return attr;
            },

            /**
             * @param {Object} gxtEl element of which attributes are to set
             * @param {Object} Data element of which attributes are to set
             * @returns {Object} updated element
             */
            coordinates: function (gxtEl, Data) {
                var a,
                    tmp,
                    labelOffset = {
                        x: 0,
                        y: 0,
                        z: 0
                    };

                if (Data.getElementsByTagName("labelOffset")[0]) {
                    labelOffset.x =
                        parseFloat(
                            Data.getElementsByTagName("labelOffset")[0].getAttribute("x")
                        ) / this.board.unitX;
                    labelOffset.y =
                        parseFloat(
                            Data.getElementsByTagName("labelOffset")[0].getAttribute("y")
                        ) / this.board.unitY;
                }

                if (Data.getElementsByTagName("coords")[0]) {
                    gxtEl.x = parseFloat(
                        Data.getElementsByTagName("coords")[0].getAttribute("x")
                    );
                    gxtEl.y = parseFloat(
                        Data.getElementsByTagName("coords")[0].getAttribute("y")
                    );
                    gxtEl.z = parseFloat(
                        Data.getElementsByTagName("coords")[0].getAttribute("z")
                    );
                } else if (Data.getElementsByTagName("startPoint")[0]) {
                    if (Data.getElementsByTagName("startPoint")[0].getAttribute("exp")) {
                        a = this.board.select(
                            Data.getElementsByTagName("startPoint")[0].getAttribute("exp")
                        );
                        gxtEl.x = function () {
                            return a.X() + labelOffset.x;
                        };
                        gxtEl.y = function () {
                            // minus because geogebra starts on the other side
                            return a.Y() - labelOffset.y;
                        };
                        gxtEl.z = false;
                    } else {
                        gxtEl.x = parseFloat(
                            Data.getElementsByTagName("startPoint")[0].getAttribute("x")
                        );
                        gxtEl.y = parseFloat(
                            Data.getElementsByTagName("startPoint")[0].getAttribute("y")
                        );
                        gxtEl.z = parseFloat(
                            Data.getElementsByTagName("startPoint")[0].getAttribute("z")
                        );
                    }
                } else if (Data.getElementsByTagName("absoluteScreenLocation")[0]) {
                    tmp = new JXG.Coords(
                        JXG.COORDS_BY_SCREEN,
                        [
                            parseFloat(
                                Data.getElementsByTagName(
                                    "absoluteScreenLocation"
                                )[0].getAttribute("x")
                            ),
                            parseFloat(
                                Data.getElementsByTagName(
                                    "absoluteScreenLocation"
                                )[0].getAttribute("y")
                            )
                        ],
                        this.board
                    );
                    gxtEl.x = tmp.usrCoords[1] + labelOffset.x;
                    gxtEl.y = tmp.usrCoords[2] + labelOffset.y;
                    gxtEl.z = false;
                } else {
                    return false;
                }

                return gxtEl;
            },

            /**
             * Writing element attributes to the given object
             * @param {Object} Data expects the content of the current element
             * @param {Object} attr
             * @returns {Object} object with according attributes
             */
            visualProperties: function (Data, attr) {
                var show = Data.getElementsByTagName("show"),
                    pointSize = Data.getElementsByTagName("pointSize"),
                    pointStyle = Data.getElementsByTagName("pointStyle"),
                    slopeTriangleSize = Data.getElementsByTagName("slopeTriangleSize"),
                    lineStyle = Data.getElementsByTagName("lineStyle"),
                    labelOffset = Data.getElementsByTagName("labelOffset"),
                    trace = Data.getElementsByTagName("trace"),
                    fix = Data.getElementsByTagName("fix");

                if (show.length > 0 && show[0].getAttribute("object")) {
                    attr.visible = JXG.str2Bool(show[0].getAttribute("object"));
                }

                if (show.length > 0 && show[0].getAttribute("label")) {
                    attr.withLabel = JXG.str2Bool(show[0].getAttribute("label"));
                }

                if (pointSize.length > 0 && pointSize[0].getAttribute("val")) {
                    attr.size = parseInt(pointSize[0].getAttribute("val"), 10);
                }

                if (pointStyle.length > 0 && pointStyle[0].getAttribute("val")) {
                    attr.styleGGB = parseInt(pointStyle[0].getAttribute("val"), 10);
                }

                if (attr.styleGGB === 0 || attr.styleGGB === 2) {
                    attr.face = "circle";

                    if (attr.styleGGB === 0) {
                        attr.fillColor = attr.strokeColor;
                        attr.fillOpacity = 1;
                        attr.highlightFillColor = attr.strokeColor;
                        attr.highlightFillOpacity = 1;
                        attr.strokeColor = "black";
                        attr.strokeWidth = 1;
                    } else if (attr.styleGGB === 2) {
                        attr.fillColor = "none";
                    }
                } else if (attr.styleGGB === 1) {
                    attr.face = "x";
                } else if (attr.styleGGB === 3) {
                    attr.face = "+";
                    attr.strokeOpacity = 1;
                } else if (attr.styleGGB === 4 || attr.styleGGB === 5) {
                    attr.face = "diamond";

                    if (attr.styleGGB === 4) {
                        attr.fillColor = attr.strokeColor;
                        attr.fillOpacity = 1;
                    } else if (attr.styleGGB === 5) {
                        attr.fillColor = "none";
                    }
                } else if (attr.styleGGB === 6) {
                    attr.face = "triangleUp";
                    attr.fillColor = attr.strokeColor;
                    attr.fillOpacity = 1;
                } else if (attr.styleGGB === 7) {
                    attr.face = "triangleDown";
                    attr.fillColor = attr.strokeColor;
                    attr.fillOpacity = 1;
                } else if (attr.styleGGB === 8) {
                    attr.face = "triangleRight";
                    attr.fillColor = attr.strokeColor;
                    attr.fillOpacity = 1;
                } else if (attr.styleGGB === 9) {
                    attr.face = "triangleLeft";
                    attr.fillColor = attr.strokeColor;
                    attr.fillOpacity = 1;
                }

                if (slopeTriangleSize.length > 0) {
                    attr.slopeWidth = slopeTriangleSize[0].getAttribute("val");
                }

                if (lineStyle.length > 0) {
                    attr.strokeWidth = Math.round(
                        parseFloat(lineStyle[0].getAttribute("thickness")) / 2
                    );
                    attr.dashGGB = lineStyle[0].getAttribute("type");
                }

                if (attr.strokeWidth) {
                    attr.highlightStrokeWidth = attr.strokeWidth + 1;
                }

                if (attr.dashGGB === "0") {
                    attr.dash = 0;
                } else if (attr.dashGGB === "10") {
                    attr.dash = 2;
                } else if (attr.dashGGB === "15") {
                    attr.dash = 3;
                } else if (attr.dashGGB === "20") {
                    attr.dash = 1;
                } else if (attr.dashGGB === "30") {
                    attr.dash = 6;
                }

                if (labelOffset.length > 0) {
                    attr.labelX = parseFloat(labelOffset[0].getAttribute("x"));
                    attr.labelY = parseFloat(labelOffset[0].getAttribute("y"));
                }

                if (trace.length > 0) {
                    attr.trace = trace[0].getAttribute("val");
                }

                if (fix.length > 0) {
                    attr.fixed = fix[0].getAttribute("val");
                }

                return attr;
            },

            /**
             * Searching for an element in the geogebra tree
             * @param {String} name the name of the element to search for
             * @param {Boolean} [expr=false] whether it is search for an expression or not
             * @returns {Object} object with according label
             */
            getElement: function (name, expr) {
                var Data, i, j;

                expr = expr || false;
                for (i = 0; i < this.tree.getElementsByTagName("construction").length; i++) {
                    if (expr === false) {
                        for (
                            j = 0;
                            j <
                            this.tree
                                .getElementsByTagName("construction")
                                [i].getElementsByTagName("element").length;
                            j++
                        ) {
                            Data = this.tree
                                .getElementsByTagName("construction")
                                [i].getElementsByTagName("element")[j];
                            if (name === Data.getAttribute("label")) {
                                return Data;
                            }
                        }
                    } else {
                        for (
                            j = 0;
                            j <
                            this.tree
                                .getElementsByTagName("construction")
                                [i].getElementsByTagName("expression").length;
                            j++
                        ) {
                            Data = this.tree
                                .getElementsByTagName("construction")
                                [i].getElementsByTagName("expression")[j];
                            if (name === Data.getAttribute("label")) {
                                return Data;
                            }
                            if (name === Data.getAttribute("exp")) {
                                return this.getElement(Data.getAttribute("label"));
                            }
                        }
                    }
                }

                return false;
            },

            /**
             * Check if an element is already registered in the temporary ggbElements register. If not, create and register the element.
             * @param {String} name the name of the element to check
             * @returns {Object} newly created element
             */
            checkElement: function (name) {
                var input;

                // Segment[A, B] nur bis Version 2.4 ? In 2.5 schon (x(A), x(B)) und durch Parser loesbar
                // if(name.match(/[a-zA-Z]+\[[a-zA-Z0-9]+[a-zA-Z0-9,\ ]*\]/)) {
                //   var tmp, type, input, output, i;
                //   tmp = name.split('[');
                //   type = tmp[0];
                //   input = tmp[1].split(']');
                //   input = input[0].split(', ');
                //   for(i=0; i<input.length; i++) {
                //     input[i] = this.checkElement(input[i]);
                //   }
                //   output = {
                //     'attributes' : []
                //   };
                //   output.attributes['type'] = {value: type };
                //   output.attributes['label'] = {value: name};
                //
                //   this.ggbElements[name] = this.writeElement(name, input, type);
                // } else

                if (!JXG.exists(this.ggbElements[name]) || this.ggbElements[name] === "") {
                    input = this.getElement(name) || this.getElement(name, true);
                    if (!input) {
                        var i, j, Data;
                        var exp1 = this.ggbParse(name);
                        for (
                            i = 0;
                            i < this.tree.getElementsByTagName("construction").length;
                            i++
                        ) {
                            for (
                                j = 0;
                                j <
                                this.tree
                                    .getElementsByTagName("construction")
                                    [i].getElementsByTagName("expression").length;
                                j++
                            ) {
                                Data = this.tree
                                    .getElementsByTagName("construction")
                                    [i].getElementsByTagName("expression")[j];
                                var exp2 = this.ggbParse(Data.getAttribute("exp"));
                                if (JXG.isArray(exp1) && JXG.isArray(exp2)) {
                                    if (exp1[0] == exp2[0] && exp1[1] == exp2[1]) {
                                        input = this.getElement(Data.getAttribute("label"));
                                    }
                                }
                            }
                        }
                        if (!input) {
                            return new Function("return " + exp1 + ";");
                        }
                    }
                    this.ggbElements[name] = this.writeElement(input);
                }

                return this.ggbElements[name];
            },

            /**
             * Prepare expression for this.ggbParse with solving multiplications and replacing mathematical functions.
             * @param {String} type c, s, or something else
             * @param {String} exp Expression to parse and correct
             * @returns {String} correct expression with fixed function and multiplication
             */
            functionParse: function (type, exp) {
                var input, vars, expr, output, i, s, o;

                switch (type) {
                    case "c":
                        // search for function params
                        if (
                            exp.match(
                                /[a-zA-Z0-9\']+\([a-zA-Z0-9]+[a-zA-Z0-9,\ ]*\)[\ ]*[=][\ ]*[a-zA-Z0-9\+\-\*\/ \( \) \u005E]+/
                            )
                        ) {
                            input = exp.split("(")[1].split(")")[0];
                            vars = input.split(", ");

                            output = [];
                            for (i = 0; i < vars.length; i++) {
                                output.push("__" + vars[i]);
                            }

                            expr = exp.split("=")[1];

                            // separate and replace function parameters
                            for (i = 0; i < vars.length; i++) {
                                if (vars[i] === "x") {
                                    expr = expr.replace(
                                        /(?![e])x(?!\()(?![p])/g,
                                        "__" + vars[i]
                                    );
                                } else if (vars[i] === "y") {
                                    expr = expr.replace(
                                        /(?![e])y(?!\()(?![p])/g,
                                        "__" + vars[i]
                                    );
                                } else {
                                    expr = expr.replace(
                                        new RegExp(vars[i], "g"),
                                        "__" + vars[i]
                                    );
                                }
                            }

                            // replace -__x to -1*__x
                            expr = expr.replace(/-__/g, "-1*__");

                            if (this.format <= 3.01) {
                                // prepare string: "solve" multiplications 'a b' to 'a*b'
                                s = expr.split(" ");
                                o = "";

                                for (i = 0; i < s.length; i++) {
                                    if (s.length !== i + 1) {
                                        if (
                                            s[i].search(/\)$/) > -1 ||
                                            s[i].search(/[0-9]+$/) > -1 ||
                                            s[i].search(/[a-zA-Z]+(_*[a-zA-Z0-9]+)*$/) > -1
                                        ) {
                                            if (
                                                s[i + 1].search(/^\(/) > -1 ||
                                                s[i + 1].search(/^[0-9]+/) > -1 ||
                                                s[i + 1].search(/^[a-zA-Z]+(_*[a-zA-Z0-9]+)*/) >
                                                    -1 ||
                                                s[i + 1].search(/__[a-zA-Z0-9]+/) > -1
                                            ) {
                                                s[i] = s[i] + "*";
                                            }
                                        }
                                    }
                                    o += s[i];
                                }
                                expr = o;
                            }

                            output.push(expr);
                            return output;
                        }

                        return exp;
                    case "s":
                        exp = exp.replace(/(?![e])x(?!\()(?![p])/g, "__x");
                        return ["__x", exp];
                    default:
                        if (this.format <= 3.01) {
                            // prepare string: "solve" multiplications 'a b' to 'a*b'
                            s = exp.split(" ");
                            o = "";

                            for (i = 0; i < s.length; i++) {
                                if (s.length !== i + 1) {
                                    if (
                                        s[i].search(/\)$/) > -1 ||
                                        s[i].search(/[0-9]+$/) > -1 ||
                                        s[i].search(/[a-zA-Z]+(_*[a-zA-Z0-9]+)*$/) > -1
                                    ) {
                                        if (
                                            s[i + 1].search(/^\(/) > -1 ||
                                            s[i + 1].search(/^[0-9]+/) > -1 ||
                                            s[i + 1].search(/^[a-zA-Z]+(\_*[a-zA-Z0-9]+)*/) >
                                                -1 ||
                                            s[i + 1].search(/\_\_[a-zA-Z0-9]+/) > -1
                                        ) {
                                            s[i] = s[i] + "*";
                                        }
                                    }
                                }
                                o += s[i];
                            }
                            exp = o;
                        }
                        return exp;
                }
            },

            /**
             * Searching for an element in the geogebra tree
             */
            writeBoard: function () {
                var grid, // currently unused: snapToPoint,
                    boardData = this.tree.getElementsByTagName("euclidianView")[0],
                    coordSystem = boardData.getElementsByTagName("coordSystem")[0],
                    gui = this.tree.getElementsByTagName("gui")[0],
                    evSettings = boardData.getElementsByTagName("evSettings")[0];

                this.board.origin = {};
                this.board.origin.usrCoords = [1, 0, 0];
                this.board.origin.scrCoords = [
                    1,
                    parseInt(coordSystem.getAttribute("xZero"), 10),
                    parseInt(coordSystem.getAttribute("yZero"), 10)
                ];
                this.board.unitX = coordSystem.getAttribute("scale")
                    ? parseInt(coordSystem.getAttribute("scale"), 10)
                    : 1;
                this.board.unitY = coordSystem.getAttribute("yscale")
                    ? parseInt(coordSystem.getAttribute("yscale"), 10)
                    : this.board.unitX;

                this.board.fontSize =
                    gui && gui.getElementsByTagName("font")[0]
                        ? parseInt(gui.getElementsByTagName("font")[0].getAttribute("size"), 10)
                        : 12;

                // the new board storage
                JXG.boards[this.board.id] = this.board;

                // Update of properties during update() is not necessary in GEONExT files
                this.board.renderer.enhancedRendering = true;

                // snap to point; value is never used?
                //snapToPoint = (evSettings.getAttribute("pointCapturing") === "true");

                grid =
                    evSettings.getAttribute("grid") === "true"
                        ? this.board.create("grid")
                        : null;

                if (evSettings.getAttribute("axes")) {
                    if (evSettings.getAttribute("axes") === "true") {
                        this.ggbElements.xAxis = this.board.create(
                            "axis",
                            [
                                [0, 0],
                                [1, 0]
                            ],
                            { strokeColor: "transparent", minorTicks: 0 }
                        );
                        this.ggbElements.yAxis = this.board.create(
                            "axis",
                            [
                                [0, 0],
                                [0, 1]
                            ],
                            { strokeColor: "black", minorTicks: 0 }
                        );
                    } else {
                        this.ggbElements.xAxis = this.board.create(
                            "axis",
                            [
                                [0, 0],
                                [1, 0]
                            ],
                            { strokeColor: "transparent", ticks: { drawLabels: false } }
                        );
                        this.ggbElements.yAxis = this.board.create(
                            "axis",
                            [
                                [0, 0],
                                [0, 1]
                            ],
                            { strokeColor: "transparent", ticks: { drawLabels: false } }
                        );
                    }
                }
            },

            /**
             * Searching for an element in the geogebra tree
             * @param {Object} output ggb element whose attributes are to parse
             * @param {Array} input list of all input elements
             * @param {String} cmd output construction method
             * @returns {Object} return newly created element or false
             */
            writeElement: function (output, input, cmd) {
                var p,
                    res,
                    re2,
                    poly,
                    t2,
                    t,
                    m,
                    i,
                    l2,
                    p2,
                    l1,
                    p1,
                    slopeWidth,
                    tmp,
                    attr2,
                    t1,
                    i2,
                    i1,
                    pol,
                    type,
                    d2,
                    d1,
                    d,
                    startpoint,
                    inp,
                    borderatts,
                    borders,
                    element,
                    gxtEl,
                    attr,
                    exp,
                    coord,
                    points,
                    length,
                    match,
                    matchDep,
                    rx,
                    q,
                    c,
                    s,
                    e,
                    sx,
                    sy,
                    ex,
                    ey,
                    func,
                    range,
                    // for use with closures
                    that = this,
                    makeConstFun = function (a) {
                        return function () {
                            return a;
                        };
                    },
                    makeRootFun = function (x) {
                        return function () {
                            return JXG.Math.Numerics.root(inp.Y, x, inp);
                        };
                    };

                element = JXG.isArray(output) ? output[0] : output;
                // geometric element
                gxtEl = {};
                // Attributes of geometric elements
                attr = {};

                JXG.debug(element);

                gxtEl.type =
                    element && element.attributes && !JXG.exists(cmd)
                        ? element.getAttribute("type").toLowerCase()
                        : cmd;
                gxtEl.label = element.getAttribute("label");
                attr.name = gxtEl.label;

                JXG.debug("Constructing " + attr.name + "(" + gxtEl.type + "):");

                switch (gxtEl.type) {
                    case "point":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        attr = this.visualProperties(element, attr);

                        if (this.getElement(attr.name, true)) {
                            exp = this.getElement(attr.name, true).getAttribute("exp");
                            coord = this.ggbParse(exp);

                            // this is parsed and verified by the parser unit above
                            /*jslint evil:true*/
                            gxtEl.x = new Function("return " + coord[0] + ";");
                            gxtEl.y = new Function("return " + coord[1] + ";");
                            /*jslint evil:false*/
                        } else {
                            gxtEl = this.coordinates(gxtEl, element);
                        }

                        if (!JXG.exists(attr.styleGGB)) {
                            attr.face = "circle";
                            attr.fillColor = attr.strokeColor;
                            attr.fillOpacity = 1;
                            attr.highlightFillColor = attr.strokeColor;
                            attr.highlightFillOpacity = 1;
                            attr.strokeColor = "black";
                            attr.strokeWidth = 1;
                        }

                        JXG.debug(gxtEl);
                        JXG.debug(input);

                        try {
                            match = /Circle\[\s*(\w+)\s*,\s*([\d\.]+)\s*\]/.exec(input);
                            matchDep = /Circle\[\s*(\w+)\s*,\s*(\w+)\s*\]/.exec(input);

                            if (JXG.exists(input)) {
                                if (JXG.exists(match) && match.length === 3) {
                                    // from Circle[A, 5] take "A" and "5", stored in ma[1] and ma[2]
                                    q = this.checkElement(match[1]);
                                    c = this.board.create("circle", [q, parseFloat(match[2])], {
                                        fillColor: "none",
                                        visible: false,
                                        name: ""
                                    });
                                    p = this.board.create(
                                        "glider",
                                        [gxtEl.x, gxtEl.y, c],
                                        attr
                                    );
                                } else if (JXG.exists(matchDep) && matchDep.length === 3) {
                                    // Circle around point ma[1] with radius defined by another elements Value-function ma[2]
                                    q = this.checkElement(matchDep[1]);
                                    m = this.checkElement(matchDep[2]);
                                    c = this.board.create(
                                        "circle",
                                        [
                                            q,
                                            function () {
                                                return m.Value();
                                            }
                                        ],
                                        { fillColor: "none", visible: false, name: "" }
                                    );
                                    p = this.board.create(
                                        "glider",
                                        [gxtEl.x, gxtEl.y, c],
                                        attr
                                    );
                                } else if (JXG.isArray(input)) {
                                    p = this.board.create(
                                        "glider",
                                        [gxtEl.x, gxtEl.y, input[0]],
                                        attr
                                    );
                                } else {
                                    p = this.board.create(
                                        "glider",
                                        [gxtEl.x, gxtEl.y, input],
                                        attr
                                    );
                                }
                            } else {
                                p = this.board.create("point", [gxtEl.x, gxtEl.y], attr);
                            }
                            return p;
                        } catch (exc1) {
                            JXG.debug("* Err: Point " + attr.name);
                            return false;
                        }
                        break;
                    case "segment":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);

                        if (typeof input === "undefined") {
                            input = [
                                parseFloat(
                                    element.getElementsByTagName("coords")[0].getAttribute("z")
                                ),
                                parseFloat(
                                    element.getElementsByTagName("coords")[0].getAttribute("x")
                                ),
                                parseFloat(
                                    element.getElementsByTagName("coords")[0].getAttribute("y")
                                )
                            ];
                        } else if (
                            this.board.select(input[1].id).elementClass ===
                            JXG.OBJECT_CLASS_LINE
                        ) {
                            type = "parallel";
                        }

                        try {
                            JXG.debug(
                                "* Segment: (" +
                                    attr.name +
                                    ") First: " +
                                    input[0].name +
                                    ", Last: " +
                                    input[1].name
                            );
                            attr.straightFirst = false;
                            attr.straightLast = false;
                            p = this.board.create("line", input, attr);
                            return p;
                        } catch (exc2) {
                            JXG.debug(
                                "* Err: Segment " +
                                    attr.name +
                                    " First: " +
                                    input[0].name +
                                    ", Last: " +
                                    input[1].name
                            );
                            return false;
                        }
                        break;
                    case "line":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);

                        type = "line";
                        if (!input) {
                            input = [
                                parseFloat(
                                    element.getElementsByTagName("coords")[0].getAttribute("z")
                                ),
                                parseFloat(
                                    element.getElementsByTagName("coords")[0].getAttribute("x")
                                ),
                                parseFloat(
                                    element.getElementsByTagName("coords")[0].getAttribute("y")
                                )
                            ];
                        } else if (
                            this.board.select(input[1].id).elementClass ===
                            JXG.OBJECT_CLASS_LINE
                        ) {
                            // Parallel line through point
                            type = "parallel";
                        }

                        try {
                            p = this.board.create(type, input, attr);
                            return p;
                        } catch (exc3) {
                            JXG.debug("* Err: Line " + attr.label);
                            return false;
                        }
                        break;
                    case "orthogonalline":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);

                        try {
                            JXG.debug(
                                "* Orthogonalline: First: " +
                                    input[0].id +
                                    ", Last: " +
                                    input[1].id
                            );
                            p = this.board.create("normal", input, attr);
                            return p;
                        } catch (exc4) {
                            JXG.debug("* Err: Orthogonalline " + attr.label);
                            return false;
                        }
                        break;
                    case "polygon":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);

                        // test if polygon is regular
                        if (input.length === 3 && output.length !== 4) {
                            input[2] = parseInt(input[2], 10);
                            type = "regular";
                        }

                        try {
                            JXG.debug(
                                "* Polygon: First: " +
                                    input[0].name +
                                    ", Second: " +
                                    input[1].name +
                                    ", Third: " +
                                    input[2]
                            );

                            borders = [];
                            borderatts = [];
                            length =
                                type === "regular"
                                    ? output.length - input[2] + 2
                                    : output.length;

                            for (i = 1; i < length; i++) {
                                borders[i - 1] = {};
                                borderatts[i - 1] = {};
                                borders[i - 1].id = "";
                                borders[i - 1].name = output[i].getAttribute("label");
                                borderatts[i - 1] = this.colorProperties(
                                    output[i],
                                    borderatts[i - 1]
                                );
                                borderatts[i - 1] = this.visualProperties(
                                    output[i],
                                    borderatts[i - 1]
                                );
                            }
                            attr.borders = borders;

                            points = [];
                            if (type === "regular") {
                                points.push(input[0]);
                                points.push(input[1]);

                                for (i = input[2] + 1; i < output.length; i++) {
                                    if (output[i].attributes) {
                                        points.push(
                                            this.checkElement(output[i].getAttribute("label"))
                                        );
                                    } else {
                                        points.push(output[i]);
                                    }
                                }
                            } else {
                                for (i = 0; i < input.length; i++) {
                                    if (typeof input[i] === "object") {
                                        points.push(input[i]);
                                    }
                                }
                            }

                            if (type === "regular") {
                                p = this.board.create("regularpolygon", points, attr);
                            } else {
                                p = this.board.create("polygon", points, attr);
                            }

                            for (i = 0; i < p.borders.length; i++) {
                                if (borderatts[i].withLabel) {
                                    p.borders[i].createLabel();
                                }
                                p.borders[i].setAttribute(borderatts[i]);
                            }
                            return p;
                        } catch (exc5) {
                            JXG.debug("* Err: Polygon " + attr.name);
                            return false;
                        }
                        break;
                    case "intersect":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);

                        try {
                            JXG.debug(
                                "* Intersection: First: " +
                                    input[0].name +
                                    ", Second: " +
                                    input[1].name
                            );
                            if (!JXG.exists(attr.styleGGB)) {
                                attr.face = "circle";
                                attr.fillColor = attr.strokeColor;
                                attr.fillOpacity = 1;
                                attr.highlightFillColor = attr.strokeColor;
                                attr.highlightFillOpacity = 1;
                                attr.strokeColor = "black";
                                attr.strokeWidth = 1;
                            }

                            if (output.length === 1) {
                                p = this.board.create(
                                    "intersection",
                                    [input[0], input[1], 0],
                                    attr
                                );
                            } else {
                                p = this.board.create(
                                    "intersection",
                                    [input[0], input[1], 1],
                                    attr
                                );
                                attr2 = {};
                                attr2 = this.colorProperties(output[1], attr2);
                                attr2 = this.visualProperties(output[1], attr2);
                                attr2.name = output[1].getAttribute("label");
                                p2 = this.board.create(
                                    "otherintersection",
                                    [input[0], input[1], p],
                                    attr2
                                );
                                this.ggbElements[attr2.name] = p2;
                            }

                            return p;
                        } catch (exc6) {
                            JXG.debug("* Err: Intersection " + attr.name);
                            return false;
                        }
                        break;
                    case "distance":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);

                        try {
                            JXG.debug(
                                "* Distance: First: " +
                                    input[0].name +
                                    ", Second: " +
                                    input[1].name
                            );

                            /*if (false && output[0].getAtribute('type') && output[0].getAttribute('type') == 'numeric') {
                        input[1].Value = function(){ return this.X(); };
                        p = input[1];
                        board.elementsByName[attr.name] = p;
                    } else {*/
                            m = this.board.create("midpoint", input, { visible: "false" });
                            attr.visible = "true";
                            p = this.board.create(
                                "text",
                                [
                                    function () {
                                        return m.X();
                                    },
                                    function () {
                                        return m.Y();
                                    },
                                    function () {
                                        return (
                                            "<span style='text-decoration: overline'>" +
                                            input[0].name +
                                            input[1].name +
                                            "</span> = " +
                                            JXG.trimNumber(
                                                JXG.toFixed(
                                                    that.board
                                                        .select(input[0].id)
                                                        .Dist(that.board.select(input[1].id)),
                                                    that.decimals
                                                )
                                            )
                                        );
                                    }
                                ],
                                attr
                            );

                            p.Value = function () {
                                return that.board
                                    .select(input[0].id)
                                    .Dist(that.board.select(input[1].id));
                            };

                            return p;
                        } catch (exc7) {
                            JXG.debug("* Err: Distance " + attr.name);
                            return false;
                        }
                        break;
                    case "vector":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);

                        if (element.getElementsByTagName("startPoint")[0]) {
                            if (input && input.length === 2) {
                                e = this.checkElement(input[1].name);
                            } else {
                                e = [
                                    parseFloat(
                                        element
                                            .getElementsByTagName("coords")[0]
                                            .getAttribute("x")
                                    ),
                                    parseFloat(
                                        element
                                            .getElementsByTagName("coords")[0]
                                            .getAttribute("y")
                                    )
                                ];
                            }

                            if (
                                element
                                    .getElementsByTagName("startPoint")[0]
                                    .getAttribute("x") &&
                                element.getElementsByTagName("startPoint")[0].getAttribute("y")
                            ) {
                                s = [
                                    parseFloat(
                                        element
                                            .getElementsByTagName("startPoint")[0]
                                            .getAttribute("x")
                                    ),
                                    parseFloat(
                                        element
                                            .getElementsByTagName("startPoint")[0]
                                            .getAttribute("y")
                                    )
                                ];
                            } else if (
                                element
                                    .getElementsByTagName("startPoint")[0]
                                    .getAttribute("exp")
                            ) {
                                startpoint = element
                                    .getElementsByTagName("startPoint")[0]
                                    .getAttribute("exp");
                                s = this.checkElement(startpoint);
                            }
                        } else if (input && input.length !== 0) {
                            s = input[0];
                            e = input[1];
                        } else {
                            exp = this.getElement(element.getAttribute("label"), true);
                            if (exp) {
                                // experimental
                                exp = exp.getAttribute("exp");
                                exp = this.ggbParse(exp);

                                // the input to these evals were verified by the parser unit above
                                /*jslint evil:true*/
                                if (JXG.isArray(exp)) {
                                    exp = [
                                        new Function("return " + exp[1] + ";"),
                                        new Function("return " + exp[2] + ";")
                                    ];
                                } else {
                                    exp = new Function("return " + exp + ";");
                                }
                                /*jslint evil:false*/

                                JXG.debug("exp: " + exp);
                                p = this.board.create(
                                    "arrow",
                                    [
                                        [0, 0],
                                        [exp[0], exp[1]]
                                    ],
                                    attr
                                );

                                return p;
                                // priorization of expression like 't*a' --> a := startPoint
                            }
                        }

                        try {
                            JXG.debug("* Vector: First: " + attr.name);
                            p = this.board.create("arrow", [s, e], attr);
                            return p;
                        } catch (exc8) {
                            JXG.debug("* Err: Vector " + attr.name + e);
                            return false;
                        }
                        break;
                    case "rotate":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);

                        try {
                            JXG.debug(
                                "* Rotate: First: " + input[0].name + ", Second: " + input[1]
                            );
                            attr.type = "rotate";

                            if (!JXG.exists(attr.styleGGB)) {
                                attr.face = "circle";
                                attr.fillColor = attr.strokeColor;
                                attr.fillOpacity = 1;
                                attr.highlightFillColor = attr.strokeColor;
                                attr.highlightFillOpacity = 1;
                                attr.strokeColor = "black";
                                attr.strokeWidth = 1;
                            }

                            t = this.board.create(
                                "transform",
                                [(parseInt(input[1], 10) * Math.PI) / 180, input[2]],
                                { type: "rotate" }
                            );
                            p = this.board.create("point", [input[0], t], attr);
                            return p;
                        } catch (exc9) {
                            JXG.debug("* Err: Rotate " + attr.name);
                            return false;
                        }
                        break;
                    case "dilate":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);

                        try {
                            JXG.debug(
                                "* Dilate: First: " + input[0].name + ", Second: " + input[1]
                            );
                            attr.type = "rotate";
                            d = parseInt(input[1], 10);
                            d1 = this.board.create("transform", [d, d], { type: "scale" });
                            d2 = this.board.create(
                                "transform",
                                [
                                    function () {
                                        return (1 - d) * input[2].X();
                                    },
                                    function () {
                                        return (1 - d) * input[2].Y();
                                    }
                                ],
                                { type: "translate" }
                            );

                            if (!JXG.exists(attr.styleGGB)) {
                                attr.face = "circle";
                                attr.fillColor = attr.strokeColor;
                                attr.fillOpacity = 1;
                                attr.highlightFillColor = attr.strokeColor;
                                attr.highlightFillOpacity = 1;
                                attr.strokeColor = "black";
                                attr.strokeWidth = 1;
                            }
                            p = this.board.create("point", [input[0], [d1, d2]], attr);

                            return p;
                        } catch (exc10) {
                            JXG.debug("* Err: Dilate " + attr.name);
                            return false;
                        }
                        break;
                    case "translate":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);

                        try {
                            t = this.board.create(
                                "transform",
                                [
                                    function () {
                                        return input[1].point2.X() - input[1].point1.X();
                                    },
                                    function () {
                                        return input[1].point2.Y() - input[1].point1.Y();
                                    }
                                ],
                                { type: "translate" }
                            );

                            if (!JXG.exists(attr.styleGGB)) {
                                attr.face = "circle";
                                attr.fillColor = attr.strokeColor;
                                attr.fillOpacity = 1;
                                attr.highlightFillColor = attr.strokeColor;
                                attr.highlightFillOpacity = 1;
                                attr.strokeColor = "black";
                                attr.strokeWidth = 1;
                            }
                            p = this.board.create("point", [input[0], t], attr);
                            return p;
                        } catch (exc11) {
                            JXG.debug("* Err: Translate " + attr.name);
                            return false;
                        }
                        break;
                    case "mirror":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);

                        // Punktspiegelung
                        if (JXG.isPoint(this.board.select(input[1].id))) {
                            type = "mirrorpoint";
                            // Achsenspiegelung
                        } else if (
                            this.board.select(input[1].id).elementClass ===
                            JXG.OBJECT_CLASS_LINE
                        ) {
                            type = "reflection";
                        }

                        try {
                            JXG.debug(
                                "* Mirror: First: " +
                                    input[0].name +
                                    ", Second: " +
                                    input[1].name
                            );
                            p = this.board.create(type, [input[0], input[1]], attr);
                            return p;
                        } catch (exc12) {
                            JXG.debug("* Err: Mirror " + attr.name);
                            return false;
                        }
                        break;
                    case "circle":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);

                        try {
                            JXG.debug(
                                "* Circle: First: " + input[0].name + ", Second: " + input[1]
                            );
                            p = this.board.create("circle", input, attr);
                            return p;
                        } catch (exc13) {
                            JXG.debug("* Err: Circle " + attr.name);
                            return false;
                        }
                        break;
                    case "circlearc":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);

                        try {
                            JXG.debug(
                                "* CircleArc: First: " +
                                    input[0].name +
                                    ", Second: " +
                                    input[1].name +
                                    ", Third: " +
                                    input[2].name
                            );
                            p = this.board.create("arc", input, attr);
                            return p;
                        } catch (exc14) {
                            JXG.debug("* Err: CircleArc " + attr.name);
                            return false;
                        }
                        break;
                    case "ellipse":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);

                        try {
                            JXG.debug(
                                "* Ellipse: First: " +
                                    input[0].name +
                                    ", Second: " +
                                    input[1].name +
                                    ", Third: " +
                                    input[2]
                            );

                            // if third parameters is the major axis, else the third parameter is a point
                            if (parseInt(input[2], 10) === input[2]) {
                                // Geogebra delivers the half major axis
                                input[2] = parseInt(input[2], 10) * 2;
                            }

                            p = this.board.create("ellipse", input, attr);
                            return p;
                        } catch (exc15) {
                            JXG.debug("* Err: Ellipse " + attr.name);
                            return false;
                        }
                        break;
                    case "conic":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);

                        try {
                            if (input && input.length === 5) {
                                p = this.board.create("conic", input, attr);
                            } else if (element.getElementsByTagName("matrix")) {
                                m = [];
                                for (
                                    i = 0;
                                    i <
                                    element.getElementsByTagName("matrix")[0].attributes.length;
                                    i++
                                ) {
                                    m[i] = parseFloat(
                                        element.getElementsByTagName("matrix")[0].attributes[i]
                                            .value
                                    );
                                }
                                p = this.board.create("conic", m, attr);
                            }
                            return p;
                        } catch (exc16) {
                            JXG.debug("* Err: Conic " + attr.name);
                            return false;
                        }
                        break;
                    case "circlesector":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);
                        try {
                            JXG.debug(
                                "* CircleSector: First: " +
                                    input[0].name +
                                    ", Second: " +
                                    input[1].name +
                                    ", Third: " +
                                    input[2].name
                            );
                            p = this.board.create(
                                "sector",
                                [input[0], input[1], input[2]],
                                attr
                            );
                            return p;
                        } catch (exc17) {
                            JXG.debug("* Err: CircleSector " + attr.name);
                            return false;
                        }
                        break;
                    case "linebisector":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);

                        try {
                            JXG.debug(
                                "* LineBiSector (Mittelsenkrechte): First: " + input[0].name
                            );
                            m = this.board.create("midpoint", input, { visible: false });
                            if (
                                JXG.isPoint(this.board.select(input[0].id)) &&
                                JXG.isPoint(this.board.select(input[1].id))
                            ) {
                                t = this.board.create("line", input, { visible: "false" });
                                p = this.board.create("perpendicular", [m, t], attr);
                            } else {
                                p = this.board.create("perpendicular", [m, input[0]], attr);
                            }
                            return p;
                        } catch (exc18) {
                            JXG.debug("* Err: LineBiSector (Mittelsenkrechte) " + attr.name);
                            return false;
                        }
                        break;
                    case "ray":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);

                        try {
                            JXG.debug("* Ray: First: " + input[0].name);
                            attr.straightFirst = true;
                            attr.straightLast = false;
                            p = this.board.create("line", [input[1], input[0]], attr);
                            return p;
                        } catch (exc19) {
                            JXG.debug("* Err: Ray " + attr.name);
                            return false;
                        }
                        break;
                    case "tangent":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);

                        try {
                            JXG.debug(
                                "* Tangent: First: " +
                                    input[0].name +
                                    ", Sec.: " +
                                    input[1].name +
                                    "(" +
                                    input[1].type +
                                    ")"
                            );
                            switch (input[1].type) {
                                // graph
                                case 1330923344:
                                    input[0].makeGlider(input[1]);
                                    p = this.board.create("tangent", [input[0]], attr);
                                    return p;
                                // circle 0x4F54434C
                                case 1330922316:
                                // conic 0x4F54434F
                                case 1330922319:
                                    pol = this.board.create("polar", [input[1], input[0]], {
                                        visible: false
                                    });
                                    i1 = this.board.create("intersection", [input[1], pol, 0], {
                                        visible: false
                                    });
                                    i2 = this.board.create("intersection", [input[1], pol, 1], {
                                        visible: false
                                    });
                                    t1 = this.board.create("line", [input[0], i1], attr);
                                    attr2 = {};
                                    attr2 = this.colorProperties(output[1], attr2);
                                    attr2 = this.visualProperties(output[1], attr2);
                                    attr2.name = output[1].getAttribute("label");
                                    t2 = this.board.create("line", [input[0], i2], attr2);
                                    this.ggbElements[attr2.name] = t2;
                                    return [t1, t2];
                            }
                        } catch (exc20) {
                            JXG.debug("* Err: Tangent " + attr.name + " " + attr2.name);
                            return false;
                        }
                        break;
                    case "circumcirclearc":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);

                        try {
                            JXG.debug("* CircumcircleArc: First: " + input[0].name);
                            p = this.board.create("circumcirclearc", input, attr);
                            return p;
                        } catch (exc21) {
                            JXG.debug("* Err: CircumcircleArc " + attr.name);
                            return false;
                        }
                        break;
                    case "circumcirclesector":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);

                        try {
                            JXG.debug("* CircumcircleSector: First: " + input[0].name);
                            p = this.board.create(
                                "circumcirclesector",
                                [input[0], input[1], input[2]],
                                attr
                            );
                            return p;
                        } catch (exc22) {
                            JXG.debug("* Err: CircumcircleSector " + attr.name);
                            return false;
                        }
                        break;
                    case "semicircle":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);

                        try {
                            JXG.debug("* Semicircle: First: " + input[0].name);
                            p = this.board.create("semicircle", [input[0], input[1]], attr);
                            return p;
                        } catch (exc23) {
                            JXG.debug("* Err: Semicircle " + attr.name);
                            return false;
                        }
                        break;
                    case "angle":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);

                        try {
                            JXG.debug("* Angle: First: " + input[0].name);
                            p = this.board.create("angle", input, attr);
                            return p;
                        } catch (exc24) {
                            JXG.debug("* Err: Angle " + attr.name);
                            return false;
                        }
                        break;
                    case "angularbisector":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);
                        attr.straightFirst = true;
                        attr.straightLast = true;

                        try {
                            JXG.debug("* Angularbisector: First: " + input[0].name);
                            p = this.board.create("bisector", input, attr);
                            return p;
                        } catch (exc25) {
                            JXG.debug("* Err: Angularbisector " + attr.name);
                            return false;
                        }
                        break;
                    case "numeric":
                        if (element.getElementsByTagName("slider").length === 0) {
                            // auxiliary doesn't exist in every numeric
                            //element.getElementsByTagName('auxiliary').length != 0 && element.getElementsByTagName('auxiliary')[0].attributes['val'].value == 'true') {
                            exp = this.getElement(element.getAttribute("label"), true);

                            if (exp) {
                                exp = exp.getAttribute("exp");
                                exp = this.functionParse("", exp);
                                exp = this.ggbParse(exp);
                            }

                            // exp was validated by ggbParse
                            /*jslint evil:true*/
                            this.board.ggb[attr.name] = new Function("return " + exp + ";");
                            /*jslint evil:false*/

                            JXG.debug("value: " + this.board.ggb[attr.name]());
                            return this.board.ggb[attr.name];
                        }
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        attr = this.visualProperties(element, attr);

                        // it's a slider
                        if (element.getElementsByTagName("slider").length === 1) {
                            sx = parseFloat(
                                element.getElementsByTagName("slider")[0].getAttribute("x")
                            );
                            sy = parseFloat(
                                element.getElementsByTagName("slider")[0].getAttribute("y")
                            );
                            length = parseFloat(
                                element.getElementsByTagName("slider")[0].getAttribute("width")
                            );
                            // are coordinates absolut?
                            if (
                                element
                                    .getElementsByTagName("slider")[0]
                                    .getAttribute("absoluteScreenLocation") &&
                                element
                                    .getElementsByTagName("slider")[0]
                                    .getAttribute("absoluteScreenLocation") === "true"
                            ) {
                                tmp = new JXG.Coords(
                                    JXG.COORDS_BY_SCREEN,
                                    [sx, sy],
                                    this.board
                                );
                                sx = tmp.usrCoords[1];
                                sy = tmp.usrCoords[2];
                            }

                            if (
                                element
                                    .getElementsByTagName("slider")[0]
                                    .getAttribute("horizontal") === "true"
                            ) {
                                if (
                                    element
                                        .getElementsByTagName("slider")[0]
                                        .getAttribute("absoluteScreenLocation") &&
                                    element
                                        .getElementsByTagName("slider")[0]
                                        .getAttribute("absoluteScreenLocation") === "true"
                                ) {
                                    length /= this.board.unitX;
                                }
                                ex = sx + length;
                                ey = sy;
                            } else {
                                if (
                                    element
                                        .getElementsByTagName("slider")[0]
                                        .getAttribute("absoluteScreenLocation") &&
                                    element
                                        .getElementsByTagName("slider")[0]
                                        .getAttribute("absoluteScreenLocation") === "true"
                                ) {
                                    length /= this.board.unitY;
                                }
                                ex = sx;
                                ey = sy + length;
                            }

                            if (element.getElementsByTagName("animation")[0]) {
                                attr.snapWidth = parseFloat(
                                    element
                                        .getElementsByTagName("animation")[0]
                                        .getAttribute("step")
                                );
                            }

                            try {
                                JXG.debug("* Numeric: First: " + attr.name);
                                attr.withTicks = false;
                                p = this.board.create(
                                    "slider",
                                    [
                                        [sx, sy],
                                        [ex, ey],
                                        [
                                            parseFloat(
                                                element
                                                    .getElementsByTagName("slider")[0]
                                                    .getAttribute("min")
                                            ),
                                            parseFloat(
                                                element
                                                    .getElementsByTagName("value")[0]
                                                    .getAttribute("val")
                                            ),
                                            parseFloat(
                                                element
                                                    .getElementsByTagName("slider")[0]
                                                    .getAttribute("max")
                                            )
                                        ]
                                    ],
                                    attr
                                );
                                return p;
                            } catch (exc26) {
                                JXG.debug("* Err: Numeric " + attr.name);
                                return false;
                            }
                        }
                        break;
                    case "midpoint":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);

                        try {
                            if (!JXG.exists(attr.styleGGB)) {
                                attr.face = "circle";
                                attr.fillColor = attr.strokeColor;
                                attr.fillOpacity = 1;
                                attr.highlightFillColor = attr.strokeColor;
                                attr.highlightFillOpacity = 1;
                                attr.strokeColor = "black";
                                attr.strokeWidth = 1;
                            }
                            p = this.board.create("midpoint", input, attr);
                            JXG.debug(
                                "* Midpoint (" +
                                    p.id +
                                    "): " +
                                    attr.name +
                                    "(" +
                                    gxtEl.x +
                                    ", " +
                                    gxtEl.y +
                                    ")"
                            );
                            return p;
                        } catch (exc27) {
                            JXG.debug("* Err: Midpoint " + attr.name);
                            return false;
                        }
                        break;
                    case "center":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);
                        try {
                            if (!JXG.exists(attr.styleGGB)) {
                                attr.face = "circle";
                                attr.fillColor = attr.strokeColor;
                                attr.fillOpacity = 1;
                                attr.highlightFillColor = attr.strokeColor;
                                attr.highlightFillOpacity = 1;
                                attr.strokeColor = "black";
                                attr.strokeWidth = 1;
                            }
                            p = this.board.create(
                                "point",
                                [
                                    function () {
                                        return that.board.select(input[0].id).center.X();
                                    },
                                    function () {
                                        return that.board.select(input[0].id).center.Y();
                                    }
                                ],
                                attr
                            );
                            JXG.debug(
                                "* Center (" +
                                    p.id +
                                    "): " +
                                    attr.name +
                                    "(" +
                                    gxtEl.x +
                                    ", " +
                                    gxtEl.y +
                                    ")"
                            );
                            return p;
                        } catch (exc28) {
                            JXG.debug("* Err: Center " + attr.name);
                            return false;
                        }
                        break;
                    case "function":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);

                        if (this.getElement(attr.name, true)) {
                            func = this.getElement(attr.name, true).getAttribute("exp");
                            func = this.functionParse("c", func);
                        } else {
                            func = input[0];
                            func = this.functionParse("s", func);
                        }

                        JXG.debug(func);

                        length = func.length;
                        func[func.length - 1] =
                            "return " + this.ggbParse(func[func.length - 1]) + ";";

                        JXG.debug(func);

                        range = [
                            input && input[1] ? input[1] : null,
                            input && input[2] ? input[2] : null
                        ];

                        // fix the range input. This might by x(<point>) or y(point) but JSXGraph only allows X(<point>)
                        // and Y(point) so we need to convert this.
                        rx = /([x|y])\((\w+)\)/;
                        for (i = 0; i < 2; i++) {
                            match = rx.exec(range[i]);
                            if (match) {
                                range[i] = match[1].toUpperCase() + "(" + match[2] + ")";
                            }
                        }

                        // all validated by ggbParse and functionParse
                        try {
                            /*jslint evil:true*/
                            if (length === 1) {
                                p = this.board.create(
                                    "functiongraph",
                                    [new Function(func[0]), range[0], range[1]],
                                    attr
                                );
                            } else if (length === 2) {
                                p = this.board.create(
                                    "functiongraph",
                                    [new Function(func[0], func[1]), range[0], range[1]],
                                    attr
                                );
                            } else if (length === 3) {
                                p = this.board.create(
                                    "functiongraph",
                                    [
                                        new Function(func[0], func[1], func[2]),
                                        range[0],
                                        range[1]
                                    ],
                                    attr
                                );
                            } else if (length === 4) {
                                p = this.board.create(
                                    "functiongraph",
                                    [
                                        new Function(func[0], func[1], func[2], func[3]),
                                        range[0],
                                        range[1]
                                    ],
                                    attr
                                );
                            } else if (length === 5) {
                                p = this.board.create(
                                    "functiongraph",
                                    [
                                        new Function(
                                            func[0],
                                            func[1],
                                            func[2],
                                            func[3],
                                            func[4]
                                        ),
                                        range[0],
                                        range[1]
                                    ],
                                    attr
                                );
                            }
                            /*jslint evil:false*/

                            return p;
                        } catch (exc29) {
                            JXG.debug("* Err: Functiongraph " + attr.name);
                            return false;
                        }

                        break;
                    case "polar":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);

                        try {
                            JXG.debug(
                                "* Polar: First: " + input[0].name + ", Sec.: " + input[1].name
                            );
                            p = this.board.create("polar", input, attr);
                            return p;
                        } catch (exc30) {
                            JXG.debug("* Err: Polar " + attr.name);
                            return false;
                        }
                        break;
                    case "slope":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);

                        try {
                            JXG.debug("* Slope (" + attr.name + "): First: " + input[0].name);

                            slopeWidth = parseInt(attr.slopeWidth, 10) || 1;
                            p1 = input[0].glider || input[0].point1;

                            p2 = this.board.create(
                                "point",
                                [
                                    function () {
                                        return slopeWidth + p1.X();
                                    },
                                    function () {
                                        return p1.Y();
                                    }
                                ],
                                { visible: false }
                            );

                            l1 = this.board.create("segment", [p1, p2], { visible: false });
                            l2 = this.board.create("normal", [l1, l1.point2], {
                                visible: false
                            });
                            i = this.board.create("intersection", [input[0], l2, 0], {
                                visible: false
                            });
                            m = this.board.create("midpoint", [l1.point2, i], {
                                visible: false
                            });

                            t = this.board.create(
                                "text",
                                [
                                    function () {
                                        return m.X();
                                    },
                                    function () {
                                        return m.Y();
                                    },
                                    function () {
                                        return (
                                            "&nbsp;&nbsp;" +
                                            (slopeWidth > 1 ? slopeWidth.toString() : "") +
                                            " " +
                                            this.name +
                                            " = " +
                                            JXG.trimNumber(
                                                JXG.toFixed(
                                                    slopeWidth * input[0].getSlope(),
                                                    that.decimals
                                                )
                                            )
                                        );
                                    }
                                ],
                                attr
                            );
                            attr.name = "";
                            t2 = this.board.create(
                                "text",
                                [
                                    function () {
                                        return (p1.X() + p2.X()) / 2;
                                    },
                                    function () {
                                        return p1.Y();
                                    },
                                    function () {
                                        return "<br/>" + slopeWidth;
                                    }
                                ],
                                attr
                            );
                            t.Value = (function () {
                                return function () {
                                    return input[0].getSlope();
                                };
                            })();
                            poly = this.board.create("polygon", [p1, p2, i], attr);

                            poly.borders[2].setAttribute({ visible: false });
                            poly.borders[0].setAttribute({
                                strokeColor: attr.fillColor,
                                strokeWidth: attr.strokeWidth,
                                highlightStrokeColor: attr.fillColor,
                                dash: attr.dash
                            });
                            poly.borders[1].setAttribute({
                                strokeColor: attr.fillColor,
                                strokeWidth: attr.strokeWidth,
                                highlightStrokeColor: attr.fillColor,
                                dash: attr.dash
                            });
                            return t;
                        } catch (exc31) {
                            JXG.debug("* Err: Slope " + attr.name);
                            return false;
                        }
                        break;
                    case "text":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);
                        res = "";

                        try {
                            /*jslint regexp:true*/
                            if (
                                element.getElementsByTagName("isLaTeX")[0] &&
                                element
                                    .getElementsByTagName("isLaTeX")[0]
                                    .getAttribute("val") === "true"
                            ) {
                                this.board.options.text.useASCIIMathML = true;
                                t = this.getElement(attr.name, true).getAttribute("exp");

                                // here we're searching for patterns like
                                //    " + ... + "
                                // ... will be sent to the ggbParser and a calculated text element is built from this.
                                rx = t.match(/(.*?)" \+ (.+) \+ "(.*)/);
                                while (rx) {
                                    re2 = this.ggbParse(RegExp.$2);
                                    if (typeof re2 === "string") {
                                        res = res + RegExp.$1 + re2;
                                    } else {
                                        res =
                                            res +
                                            RegExp.$1 +
                                            '" + JXG.trimNumber(JXG.toFixed(' +
                                            re2 +
                                            ", " +
                                            this.decimals +
                                            ')) + "';
                                    }
                                    t = RegExp.$3;

                                    rx = t.match(/(.*?)" \+ (.+) \+ "(.*)/);
                                }

                                // we have to look, if the string's ending with a string-part or a formula part:
                                rx = t.match(/(.*?)" \+ (.+)/);
                                if (rx) {
                                    res =
                                        res +
                                        RegExp.$1 +
                                        '" + JXG.trimNumber(JXG.toFixed(' +
                                        this.ggbParse(RegExp.$2) +
                                        ", " +
                                        this.decimals +
                                        "))";
                                } else {
                                    res = res + t;
                                }

                                JXG.debug("Text: " + res);

                                // res is verified by ggbParse
                                /*jslint evil:true*/
                                p = this.board.create(
                                    "text",
                                    [gxtEl.x, gxtEl.y, new Function("return " + res + ";")],
                                    attr
                                );
                                /*jslint evil:false, regexp:false*/
                            } else {
                                JXG.debug(this.getElement(attr.name, true).getAttribute("exp"));
                                t = this.functionParse(
                                    false,
                                    this.getElement(attr.name, true).getAttribute("exp")
                                );
                                t = this.ggbParse(t);
                                JXG.debug(t[1]);

                                if (JXG.isArray(t)) {
                                    // input string is verified by ggbParse
                                    /*jslint evil:true*/
                                    p = this.board.create(
                                        "text",
                                        [
                                            gxtEl.x,
                                            gxtEl.y,
                                            new Function(
                                                "return " +
                                                    t[0] +
                                                    ' + " " + JXG.trimNumber(JXG.toFixed(parseFloat(' +
                                                    t[1] +
                                                    ", " +
                                                    this.decimals +
                                                    "));"
                                            )
                                        ],
                                        attr
                                    );
                                    /*jslint evil:false*/
                                } else {
                                    p = this.board.create("text", [gxtEl.x, gxtEl.y, t], attr);
                                }
                            }
                            JXG.debug("* Text: " + t);
                            return p;
                        } catch (exc32) {
                            JXG.debug("* Err: Text: " + t, exc32, exc32.stack);
                            return false;
                        }
                        break;
                    case "root":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);

                        for (i = 0; i < output.length; i++) {
                            output[i] = this.checkElement(output[i].getAttribute("label"));
                        }

                        if (JXG.isArray(input)) {
                            inp = input[0];
                        } else {
                            inp = input;
                        }

                        // At this point, the output points already exist.
                        // Bind the root function to all output elements.
                        // The start values for all output elements are the x-coordinates as given
                        // in the ggb file.
                        for (i = 0; i < output.length; i++) {
                            output[i].addConstraint([
                                makeRootFun(output[i].X()),
                                makeConstFun(0)
                            ]);
                        }
                        // What to return here????
                        return output;
                    case "integral":
                        attr = this.boardProperties(gxtEl, element, attr);
                        attr = this.colorProperties(element, attr);
                        gxtEl = this.coordinates(gxtEl, element);
                        attr = this.visualProperties(element, attr);

                        try {
                            JXG.debug(
                                "* Integral: First: " +
                                    input[0].name +
                                    ", Sec.: " +
                                    input[1].name +
                                    ", Thir.: " +
                                    input[2].name
                            );
                            JXG.debug([input[1](), input[2]()]);
                            p = this.board.create(
                                "integral",
                                [this.board.select(input[0]), [input[1], input[2]]],
                                attr
                            );
                            return p;
                        } catch (exc33) {
                            JXG.debug("* Err: Integral " + attr.name + e);
                            return false;
                        }
                        break;

                    //    case 'transform':
                    //    break;
                    //    case 'radius':
                    //    break;
                    //    case 'derivative':
                    //    break;
                    //    case 'root':
                    //    break;
                    //    case 'corner':
                    //    break;
                    //    case 'unitvector':
                    //    break;
                    //    case 'extremum':
                    //    break;
                    //    case 'turningpoint':
                    //    break;
                    //    case 'arc':
                    //    break;
                    //    case 'circlepart':
                    //    break;
                    //    case 'uppersum':
                    //    break;
                    //    case 'lowersum':
                    //    break;
                    //    case 'image':
                    //    break;
                    default:
                        return false;
                }
            },

            /**
             * Reading the elements of a geogebra file
             */
            read: function () {
                var type,
                    constructions,
                    el,
                    Data,
                    i,
                    t,
                    s,
                    expr,
                    cmds,
                    input,
                    output,
                    elname,
                    elements;

                this.writeBoard();

                // board won't be overwritten, setDefaultOptions returns the board reference given to it.
                this.setDefaultOptions();

                // speeding up the drawing process
                //this.board.suspendUpdate();

                constructions = this.tree.getElementsByTagName("construction");
                for (t = 0; t < constructions.length; t++) {
                    cmds = constructions[t].getElementsByTagName("command");
                    for (s = 0; s < cmds.length; s++) {
                        Data = cmds[s];

                        JXG.debug("now i'll parse the command:");
                        JXG.debug(Data);

                        input = [];
                        for (
                            i = 0;
                            i < Data.getElementsByTagName("input")[0].attributes.length;
                            i++
                        ) {
                            el = Data.getElementsByTagName("input")[0].attributes[i].value;
                            if (
                                el.match(/\u00B0/) ||
                                !el.match(/\D/) ||
                                el.match(/Circle/) ||
                                Data.getAttribute("name") === "Function" ||
                                el === parseFloat(el)
                            ) {
                                input[i] = el;
                            } else if (el === "xAxis" || el === "yAxis") {
                                input[i] = this.ggbElements[el];
                            } else {
                                input[i] = this.checkElement(el);
                            }
                        }

                        output = [];
                        elname = Data.getElementsByTagName("output")[0].attributes[0].value;

                        for (
                            i = 0;
                            i < Data.getElementsByTagName("output")[0].attributes.length;
                            i++
                        ) {
                            el = Data.getElementsByTagName("output")[0].attributes[i].value;
                            output[i] = this.getElement(el);
                        }

                        if (
                            !JXG.exists(this.ggbElements[elname]) ||
                            this.ggbElements[elname] === ""
                        ) {
                            this.ggbElements[elname] = this.writeElement(
                                output,
                                input,
                                Data.getAttribute("name").toLowerCase()
                            );

                            /* register borders to according "parent" */
                            if (this.ggbElements[elname].borders) {
                                for (i = 0; i < this.ggbElements[elname].borders.length; i++) {
                                    this.ggbElements[this.ggbElements[elname].borders[i].name] =
                                        this.ggbElements[elname].borders[i];
                                }
                            }
                        }
                    }

                    JXG.debug("Restesammler: ");
                    // create "single" elements which do not depend on any other
                    elements = constructions[t].getElementsByTagName("element");
                    for (s = 0; s < elements.length; s++) {
                        Data = elements[s];
                        el = Data.getAttribute("label");

                        if (!JXG.exists(this.ggbElements[el]) || this.ggbElements === "") {
                            this.ggbElements[el] = this.writeElement(Data);

                            expr = this.getElement(el, true);
                            if (expr) {
                                type = Data.getAttribute("type");

                                switch (type) {
                                    case "text":
                                    case "function":
                                        // this.ggbElements[el] = this.writeElement(this.ggbElements, this.board, expr, false, type);
                                        break;
                                    default:
                                        this.ggbParse(expr.getAttribute("exp"), el);
                                        break;
                                }
                            }
                        }
                    }
                } // end: for construction

                // speeding up the drawing process
                this.board.unsuspendUpdate();
                this.board.fullUpdate();
            },

            /**
             * Clean the utf8-symbols in a Geogebra expression in JavaScript syntax
             * @param {String} exp string to clean
             * @returns {String} replaced string
             */
            utf8replace: function (exp) {
                exp = exp
                    .replace(/\u03C0/g, "PI")
                    .replace(/\u00B2/g, "^2")
                    .replace(/\u00B3/g, "^3")
                    .replace(/\u225F/g, "==")
                    .replace(/\u2260/g, "!=")
                    .replace(/\u2264/g, "<=")
                    .replace(/\u2265/g, ">=")
                    .replace(/\u2227/g, "&&")
                    .replace(/\u2228/g, "//");

                return exp;
            },

            /**
             * Extracting the packed geogebra file in order to return the "blank" xml-tree for further parsing.
             * @param {String} fileStr archive containing geogebra.xml-file or raw input string (eg. xml-tree)
             * @returns {String} content of geogebra.xml-file if an archive was passed in
             */
            prepareString: function (fileStr) {
                var i,
                    bA,
                    len,
                    fstr,
                    isString = fileStr.slice(0, 2) !== "PK";

                // here we have to deal with two different base64 encoded streams
                // first one: base64 encoded xml (geogebra's web export)
                // second one: base64 encoded ggb file, this is our recommendation for an IE & Opera
                // workaround, which can't deal with binary data transferred via AJAX.

                if (isString && fileStr.indexOf("<") !== 0) {
                    // first try to decode assuming we got a base64 encoded ggb file
                    fstr = JXG.Util.Base64.decode(fileStr);

                    if (fstr.slice(0, 2) !== "PK") {
                        // ooops, that was no ggb file. try again with utf8 parameter set.
                        fstr = JXG.Util.Base64.decode(fileStr, true);
                    }
                    fileStr = fstr;
                }

                if (fileStr.indexOf("<") !== 0) {
                    bA = [];
                    len = fileStr.length;
                    for (i = 0; i < len; i++) {
                        bA[i] = JXG.Util.UTF8.asciiCharCodeAt(fileStr, i);
                    }

                    // Unzip
                    fileStr = new JXG.Util.Unzip(bA).unzipFile("geogebra.xml");
                }
                fileStr = JXG.Util.UTF8.decode(fileStr);
                fileStr = this.utf8replace(fileStr);

                return fileStr;
            },

            /**
             * Checking if a parameter is a Geogebra vector (array with length 3)
             * @param {Object} v possible Geogebra vector
             * @returns {Boolean}
             */
            isGGBVector: function (v) {
                return JXG.isArray(v) && v.length === 3 && v[0] === 1;
            }
        }
    );

    JXG.registerReader(JXG.GeogebraReader, ["ggb", "geogebra"]);
})();
