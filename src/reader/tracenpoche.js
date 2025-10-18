/*
 Copyright 2011-2013
 Emmanuel Ostenne,
 Alfred Wassermann

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

JXG.TracenpocheReader = function (board, str) {
    this.board = board;
    this.content = str;

    this.tokenize = function (inputStr, prefix, suffix) {
        if (typeof prefix !== 'string') {
            prefix = "<>+-&";
        }
        if (typeof suffix !== 'string') {
            suffix = "=>&:";
        }
        var c; // The current character.
        var from; // The index of the start of the token.
        var i = 0; // The index of the current character.
        var length = inputStr.length;
        var n; // The number value.
        var q; // The quote character.
        var str; // The string value.
        var isSmallName;

        var result = []; // An array to hold the results.

        // Make a token object.
        var make = function (type, value) {
            return {
                type: type,
                value: value,
                from: from,
                to: i
            };
        };

        var error = function (type, value, msg) {
            console.log("Tokenizer: problem with " + type + " " + value + ": " + msg);
        };

        if (!inputStr || inputStr == "") return;

        // Loop through this text, one character at a time.

        c = inputStr.charAt(i);
        while (c) {
            from = i;
            if (c <= " ") {
                // Ignore whitespace
                i++;
                c = inputStr.charAt(i);
            } else if ((c >= "a" && c <= 'z') || (c >= "A" && c <= 'Z')) {
                // name
                str = c;
                i += 1;
                // if the name starts with a small capital, anything may follow
                // otherwise, if the next char is a capital letter like
                // AB, the meaning is Dist(A,B)
                isSmallName = c >= "a" && c <= "z" ? true : false;

                for (;;) {
                    c = inputStr.charAt(i);
                    if (isSmallName) {
                        if (
                            (c >= "a" && c <= 'z') ||
                            (c >= "A" && c <= 'Z') ||
                            (c >= "0" && c <= '9') ||
                            c === "'" /*|| c === '_' */
                        ) {
                            str += c;
                            i++;
                        } else {
                            break;
                        }
                    } else {
                        if ((c >= "0" && c <= '9') || c === "'") {
                            str += c;
                            i++;
                        } else {
                            break;
                        }
                    }
                }
                if (
                    result.length > 0 &&
                    result[result.length - 1].type == "name" &&
                    result[result.length - 1].value != "var" &&
                    result[result.length - 1].value != "for"
                ) {
                    // Here we have the situation AB -> A#B
                    result.push(make("operator", "#"));
                }
                result.push(make("name", str));
            } else if (c >= "0" && c <= '9') {
                // number
                // A number cannot start with a decimal point. It must start with a digit,
                // possibly '0'.
                str = c;
                i++;
                for (;;) {
                    // Look for more digits
                    c = inputStr.charAt(i);
                    if (c < "0" || c > '9') {
                        break;
                    }
                    i++;
                    str += c;
                }
                if (c === '.') {
                    // Look for a decimal fraction part
                    i++;
                    str += c;
                    for (;;) {
                        c = inputStr.charAt(i);
                        if (c < "0" || c > '9') {
                            break;
                        }
                        i++;
                        str += c;
                    }
                }
                if (c === "e" || c === 'E') {
                    // Look for an exponent part.
                    i++;
                    str += c;
                    c = inputStr.charAt(i);
                    if (c === "-" || c === "+") {
                        i++;
                        str += c;
                        c = inputStr.charAt(i);
                    }
                    if (c < "0" || c > '9') {
                        error("number", str, "Bad exponent");
                    }
                    do {
                        i++;
                        str += c;
                        c = inputStr.charAt(i);
                    } while (c >= "0" && c <= '9');
                }
                if (c >= "a" && c <= 'z') {
                    // Make sure the next character is not a letter
                    i++;
                    str += c;
                    error("number", str, "Bad number");
                }
                n = +str; // Convert the string value to a number. If it is finite, then it is a good token.
                if (isFinite(n)) {
                    result.push(make("number", n));
                } else {
                    error("number", str, "Bad number");
                }
            } else if (c === "'" || c === '"') {
                // string
                str = "";
                q = c;
                i++;
                for (;;) {
                    c = inputStr.charAt(i);
                    if (c < " ") {
                        error(
                            "string",
                            str,
                            c === "\n" || c === "\r" || c === ""
                                ? "Unterminated string."
                                : "Control character in string.",
                            make("", str)
                        );
                        break;
                    }
                    if (i >= length) {
                        error("string", str, "Unterminated string");
                        break;
                    }
                    if (c === q) {
                        // Look for the closing quote.
                        break;
                    }
                    if (c === "\\") {
                        // Look for escapement
                        i++;
                        if (i >= length) {
                            error("string", str, "Unterminated string");
                            break;
                        }
                        c = inputStr.charAt(i);
                        switch (c) {
                            case "b":
                                c = "\b";
                                break;
                            case "f":
                                c = "\f";
                                break;
                            case "n":
                                c = "\n";
                                break;
                            case "r":
                                c = "\r";
                                break;
                            case "t":
                                c = "\t";
                                break;
                            case "u":
                                if (i >= length) {
                                    error("string", str, "Unterminated string");
                                }
                                c = parseInt(inputStr.slice(i + 1, i + 5), 16);
                                if (!isFinite(c) || c < 0) {
                                    error("string", str, "Unterminated string");
                                }
                                c = String.fromCharCode(c);
                                i += 4;
                                break;
                        }
                    }
                    str += c;
                    i++;
                }
                i++;
                result.push(make("string", str));
                c = inputStr.charAt(i);
            } else if (c === "/" && inputStr.charAt(i + 1) === "/") {
                // comment
                i++;
                for (;;) {
                    c = inputStr.charAt(i);
                    if (c === "\n" || c === "\r" || c === "") {
                        break;
                    }
                    i++;
                }
            } else if (prefix.indexOf(c) >= 0) {
                // combining (multi-character operator)
                str = c;
                i++;
                while (true) {
                    c = inputStr.charAt(i);
                    if (i >= length || suffix.indexOf(c) < 0) {
                        break;
                    }
                    i++;
                    str += c;
                }
                result.push(make("operator", str));
            } else {
                // single-character operator
                i++;
                result.push(make("operator", c));
                c = inputStr.charAt(i);
            }
        }

        return result;
    };

    this.parseOptions = function (board) {
        //var code, i, len = script.length;

        // Analyze this.data for "@options;"
        // Just for testing.
        board.setBoundingBox([-10, 10, 10, -10], true);
        board.create("axis", [
            [0, 0],
            [1, 0]
        ]);
        board.create("axis", [
            [0, 0],
            [0, 1]
        ]);

        /*
         for (i=start+1; i<len; i++) {
         code = script[i];
         if (code=='') continue;

         if (code.match(/@/)) {   // Reached the end of the options section
         return i-1;
         }
         console.log("OPT>", code);
         // Read options:
         }
         */
    };

    this.parse = function (tokens, scopeObjName) {
        var scope;
        var symbol_table = {};
        var token;
        var token_nr;
        var i, arr;

        var error = function (tok, msg) {
            throw new Error(
                "TraceEnPocheReader: syntax error at char " +
                    tok.from +
                    ": " +
                    tok.value +
                    " - " +
                    msg
            );
        };

        var createObject = function (o) {
            function F() {}
            F.prototype = o;
            return new F();
        };

        var original_scope = {
            define: function (n) {
                //console.log("Add scope var " + n.value);
                this.def[n.value] = n.value;
            },
            find: function (n) {
                var e = this,
                    o;
                while (true) {
                    o = e.def[n];
                    if (o) {
                        return "$" + '["' + e.def[n].value + '"]';
                    }
                    e = e.parent;
                    if (!e) {
                        o = symbol_table[n];
                        return o;
                    }
                }
            },
            pop: function () {
                scope = this.parent;
            }
        };

        var new_scope = function () {
            var s = scope;
            scope = Object.create(original_scope);
            scope.def = {};
            scope.parent = s;
            return scope;
        };

        var advance = function (id) {
            var a, o, t, v;
            if (id && token.id !== id) {
                error(token, "Expected '" + id + "'.");
            }
            if (token_nr >= tokens.length) {
                token = symbol_table["(end)"];
                return;
            }
            t = tokens[token_nr];
            token_nr++;
            v = t.value;
            a = t.type;
            if (a === 'name') {
                o = symbol_table[v];
                if (!o) {
                    o = variable(v);
                }
            } else if (a === 'operator') {
                o = symbol_table[v];
                if (!o) {
                    error(t, "Unknown operator.");
                }
            } else if (a === "string" || a === 'number') {
                o = symbol_table["(literal)"];
                // a = 'literal'
            } else {
                error(t, "Unexpected token.");
            }
            token = createObject(o);
            token.from = t.from;
            token.to = t.to;
            token.value = v;
            return token;
        };

        var expression = function (rbp) {
            var left,
                t = token;
            advance();
            left = t.nud();
            while (rbp < token.lbp) {
                t = token;
                advance();
                left = t.led(left);
            }
            return left;
        };

        var statement = function () {
            var n = token,
                v;

            if (n.std) {
                advance();
                //scope.reserve(n);

                return n.std();
            }
            v = expression(0) + ";";
            /*
             if (!v.assignment && v.id !== "(") {
             error(v, "Bad expression statement.");
             }
             */
            advance(";");
            return v;
        };

        var statements = function () {
            var a = [],
                s;
            while (true) {
                if (token.id === "end" || token.id === "(end)") {
                    break;
                }
                s = statement();
                if (s) {
                    a.push(s);
                }
            }
            return a.length === 0 ? null : a;
        };

        var original_symbol = {
            nud: function () {
                error(this, 'Undefined.');
            },
            led: function (left) {
                error(this, "Missing operator.");
            }
        };

        /*
         * Shortcuts
         */
        var symbol = function (id, bp) {
            var s = symbol_table[id];
            bp = bp || 0;
            if (s) {
                if (bp >= s.lbp) {
                    s.lbp = bp;
                }
            } else {
                s = createObject(original_symbol);
                s.id = s.value = id;
                s.lbp = bp;
                symbol_table[id] = s;
            }
            return s;
        };

        var constant = function (s, v) {
            var x = symbol(s);
            x.nud = function () {
                this.value = symbol_table[this.id].value;
                return this.value;
            };
            x.value = v;
            x.arity = 'name'
            return x;
        };

        var predefined = function (s, v) {
            var x = symbol(s);
            x.nud = function () {
                this.value = symbol_table[this.id].value;
                return this.value;
            };
            x.arity = 'function'
            x.value = v;
            return x;
        };

        var variable = function (s) {
            var x = symbol(s),
                second;
            //console.log("Define " + s);
            scope.define(x);

            x.nud = function () {
                this.value = symbol_table[this.id].value;
                if (token.id === "[") {
                    //console.log("Proceed " + this.value);
                    second = expression(11);
                    return scopeObjName + '["' + this.value + '"+' + second + "]";
                }
                return scopeObjName + '["' + this.value + '"]';
            };
            return x;
        };

        var infix = function (id, bp, led) {
            var s = symbol(id, bp);
            s.led =
                led ||
                function (left) {
                    this.first = left;
                    this.second = expression(bp);
                    return "(" + this.first + this.value + this.second + ")";
                };
            return s;
        };

        var infixr = function (id, bp, led) {
            var s = symbol(id, bp);
            s.led =
                led ||
                function (left) {
                    this.first = left;
                    this.second = expression(bp - 1);
                    return "(" + this.first + this.value + this.second + ")";
                };
            return s;
        };

        var assignment = function (id) {
            return infixr(id, 10, function (left) {
                this.first = left;
                if (token.id === "[") {
                    this.first += expression(0);
                    this.first = "$[" + this.first + "]";
                }
                this.second = expression(9);
                this.assignment = true;
                return this.first + this.value + this.second;
            });
        };

        var prefix = function (id, nud) {
            var s = symbol(id);
            s.nud =
                nud ||
                function () {
                    this.first = expression(70);
                    return this.value + this.first;
                };
            return s;
        };

        var stmt = function (s, f) {
            var x = symbol(s);
            x.std = f;
            return x;
        };

        /*
         * Define the language
         *
         */
        symbol("(literal)").nud = function () {
            return typeof this.value === "string" ? "'" + this.value + "'" : this.value;
        };
        symbol("(end)");
        symbol("(name)");
        symbol(":");
        symbol(";");
        symbol(")");
        symbol("]");
        symbol("}");
        symbol(",");
        symbol('do');
        symbol('to');
        symbol('end');

        constant("true", true);
        constant("false", false);

        /*
         * Predefined functions
         */
        for (i = 0; i < this.tepElements.length; i++) {
            predefined(this.tepElements[i], "that." + this.tepElements[i]);
        }

        constant("x", 'x');
        predefined("pi", 'Math.PI');
        predefined("sin", 'Math.sin');
        predefined("cos", 'Math.cos');
        predefined("tan", 'Math.tan');
        predefined("abs", 'Math.abs');
        predefined("racine", 'Math.sqrt');
        predefined("carre", 'JXG.Math.carre');

        assignment("=");

        infixr("&&", 30);
        infixr("||", 30);

        arr = ["==", "!=", "<", "<=", ">", ">="];
        for (i = 0; i < arr.length; i++) {
            infixr(arr[i], 40);
        }

        infix("#", 50, function (left) {
            this.first = left;
            this.second = expression(0);
            return "function(){return " + this.first + ".Dist(" + this.second + ");}";
        });

        infix("+", 50);
        infix("-", 50);
        infix("*", 60);
        infix("/", 60);
        infix("%", 50);

        infixr("^", 65, function (left) {
            this.first = left;
            this.second = expression(64);
            return "Math.pow(" + this.first + "," + this.second + ")";
        });

        infix("(", 80, function (left) {
            var a = [];
            this.first = left;
            this.second = a;

            // Parameters
            if (token.id !== ")") {
                while (true) {
                    a.push(expression(0));
                    if (token.id !== ",") {
                        break;
                    }
                    advance(",");
                }
            }
            advance(")");

            // Optional attributes
            if (token.id === "{") {
                this.third = expression(0).first;
            } else {
                this.third = [];
            }
            return (
                this.first + "([" + this.second.join(",") + "],[" + this.third.join(",") + "])"
            );
        });

        prefix("-");
        prefix("(", function () {
            var e = expression(0);
            advance(")");
            return e;
        });

        prefix("fonction", function () {
            advance("(");
            var e = expression(0);
            advance(")");
            e = e.replace(/,\[\]/g, "").replace(/[\[\]]/g, "");
            return "that.fonction([" + "'" + e + "'" + "],{})";
        });

        // Attributes
        prefix("{", function () {
            var a = [],
                n,
                v;
            if (token.id !== "}") {
                while (true) {
                    // Ignore
                    n = token;

                    //if (n.arity !== "name"/* && n.arity !== "literal"*/) {
                    //    error(token, "Bad property name.");
                    //}
                    advance();
                    a.push("'" + n.value + "'");
                    if (token.id !== ",") {
                        break;
                    }
                    advance(",");
                }
            }
            advance("}");
            this.first = a;
            this.arity = 'unary'
            return this;
        });

        prefix("for", function () {
            var n = token,
                varname;

            this.first = expression(0);
            advance('to');
            this.second = expression(0);
            advance('do');
            if (token.id === ";") advance(";");
            this.third = statements().join("\n");
            advance('end');
            varname = scopeObjName + '["' + n.value + '"]';
            return (
                "for (" +
                this.first +
                ";" +
                varname +
                "<=" +
                this.second +
                ";" +
                varname +
                "++){" +
                this.third +
                "}"
            );
        });

        stmt("var", function () {
            var a, n, t;
            //n = token;
            // scope.define(n);
            a = statement();
            return /*"VAR " + */ a;
        });

        prefix("[", function () {
            var a = [];
            if (token.id !== "]") {
                while (true) {
                    a.push(expression(0));
                    if (token.id !== ",") {
                        break;
                    }
                    advance(",");
                }
            }
            advance("]");
            this.first = a;
            this.arity = 'unary'
            return a.length == 0 ? null : a.length == 1 ? a[0] : a[0] + "?" + a[1] + ":" + a[2];
        });

        /*
         * Here starts the parsing part
         *
         */
        token_nr = 0;
        new_scope();
        advance();
        return statements().join("\n");
    };

    this.parseData = function (board) {
        this.parseOptions(board);
        this.parseFigure(board);
    };

    this.parseFigure = function (board) {
        var i = this.data.indexOf("@figure;");
        if (i < 0) {
            return; // no figure found
        }

        i += 8; // skip string "@figure;"
        var i2 = this.data.indexOf("@", i + 1);
        if (i2 < 0) {
            i2 = this.data.length;
        }

        var tokens = this.tokenize(this.data.slice(i, i2), "=<>!+-*&|/%^#", "=<>&|");
        this.board = board;
        var s = this.parse(tokens, 'tep');
        var tep = {};

        // Set the default options
        board.options.point.face = 'x'
        board.options.point.strokeColor = "#0000ff";
        board.options.point.strokeWidth = 1;
        board.options.line.strokeWidth = 1;

        var fun = new Function("that", "tep", s);
        fun(this, tep);

        // Set the correct labels and names
        var el;
        for (el in tep) {
            if (JXG.exists(tep[el].setProperty)) {
                tep[el].setAttribute({ name: el });
                if (JXG.exists(tep[el].label) && JXG.exists(tep[el].label)) {
                    tep[el].label.setText(el);
                }
            }
        }
    };

    //
    //---------------------------------------------------------------------
    //
    this.prepareString = function (fileStr) {
        //fileStr = JXG.Util.utf8Decode(fileStr);
        //fileStr = JXG.GeogebraReader.utf8replace(fileStr);
        return fileStr;
    };

    this.read = function () {
        this.data = this.prepareString(this.content);
        this.parseData(this.board);
        return this.data;
    };

    //
    //---------------------------------------------------------------------
    //
    this.handleAtts = function (attsArr) {
        var obj = {},
            i,
            le = attsArr.length;

        obj["withLabel"] = true;
        for (i = 0; i < le; i++) {
            switch (attsArr[i]) {
                case "sansnom":
                    obj["withLabel"] = false;
                    break;
            }
        }
        return obj;
    };

    JXG.Math.carre = function (x) {
        return x * x;
    };

    /*
     * Now, the constructions of TeP elements follow
     */
    this.tepElements = [
        // points
        "point",
        "pointsur",
        "intersection",
        "projete",
        "barycentre",
        "image",
        "milieu",
        // lines
        "segment",
        "droite",
        "droiteEQR",
        "droiteEQ",
        "mediatrice",
        "parallele",
        "bissectrice",
        "perpendiculaire",
        "tangente",
        "vecteur",
        // circles
        "cercle",
        "cerclerayon",
        // polygons
        "polygone",
        // other
        "texte",
        "reel",
        "entier",
        "fonction",
        // transformations
        "homothetie",
        "reflexion",
        "rotation",
        "symetrie",
        "translation"
    ];

    /*
     * Points
     */
    this.point = function (parents, attributes) {
        if (parents.length == 0) {
            return this.board.create(
                "point",
                [Math.random(), Math.random()],
                this.handleAtts(attributes)
            );
        } else {
            return this.board.create("point", parents, this.handleAtts(attributes));
        }
    };

    this.pointsur = function (parents, attributes) {
        var p1, p2, c, lambda, par3;

        par3 = parents[parents.length - 1];
        if (JXG.isNumber(par3)) {
            lambda = function () {
                return par3;
            };
        } else {
            lambda = function () {
                return par3.Value();
            };
        }

        if (parents.length == 3) {
            // point between two points
            p1 = parents[0];
            p2 = parents[1];
            return this.board.create(
                "point",
                [
                    function () {
                        return p1.X() + (p2.X() - p1.X()) * lambda();
                    },
                    function () {
                        return p1.Y() + (p2.Y() - p1.Y()) * lambda();
                    }
                ],
                this.handleAtts(attributes)
            );
        } else if (parents.length == 2) {
            // point on segment
            if (parents[0].elementClass == JXG.OBJECT_CLASS_LINE) {
                p1 = parents[0].point1;
                p2 = parents[0].point2;
                return this.board.create(
                    "point",
                    [
                        function () {
                            return p1.X() + (p2.X() - p1.X()) * lambda();
                        },
                        function () {
                            return p1.Y() + (p2.Y() - p1.Y()) * lambda();
                        }
                    ],
                    this.handleAtts(attributes)
                );
            } else {
                // point on circle
                c = parents[0];
                return this.board.create(
                    "point",
                    [
                        function () {
                            return c.center.X() + c.Radius() * Math.cos(lambda());
                        },
                        function () {
                            return c.center.Y() + c.Radius() * Math.sin(lambda());
                        }
                    ],
                    this.handleAtts(attributes)
                );
            }
        }
    };

    this.intersection = function (parents, attributes) {
        if (parents.length == 2) {
            // line line
            return this.board.create(
                "intersection",
                [parents[0], parents[1], 0],
                this.handleAtts(attributes)
            );
        } else if (parents.length == 3) {
            if (JXG.isNumber(parents[2])) {
                // line circle
                parents[2] -= 1;
                return this.board.create("intersection", parents, this.handleAtts(attributes));
            } else {
                return this.board.create(
                    "otherintersection",
                    parents,
                    this.handleAtts(attributes)
                );
            }
        }
    };

    this.projete = function (parents, attributes) {
        var lpar;
        if (parents.length == 2) {
            // orthogonal projection
            return this.board.create(
                "orthogonalprojection",
                parents,
                this.handleAtts(attributes)
            );
        } else {
            // parallel projection along parents[2]
            lpar = this.board.create("parallel", [parents[2], parents[0]], {
                visible: false,
                withLabel: false
            });
            return this.board.create(
                "intersection",
                [parents[1], lpar, 0],
                this.handleAtts(attributes)
            );
        }
    };

    this.barycentre = function (parents, attributes) {
        return this.board.create(
            "point",
            [
                function () {
                    var i,
                        s = 0,
                        le = parents.length,
                        x = 0.0;
                    for (i = 0; i < le; i += 2) {
                        x += parents[i].X() * parents[i + 1];
                        s += parents[i + 1];
                    }
                    return x / s;
                },
                function () {
                    var i,
                        s = 0,
                        le = parents.length,
                        y = 0.0;
                    for (i = 0; i < le; i += 2) {
                        y += parents[i].Y() * parents[i + 1];
                        s += parents[i + 1];
                    }
                    return y / s;
                }
            ],
            this.handleAtts(attributes)
        );
    };

    this.image = function (parents, attributes) {
        return this.board.create(
            "point",
            [parents[1], parents[0]],
            this.handleAtts(attributes)
        );
    };

    this.milieu = function (parents, attributes) {
        return this.board.create("midpoint", parents, this.handleAtts(attributes));
    };

    /*
     * Lines
     */
    this.segment = function (parents, attributes) {
        return this.board.create("segment", parents, this.handleAtts(attributes));
    };

    this.droite = function (parents, attributes) {
        return this.board.create("line", parents, this.handleAtts(attributes));
    };

    this.droiteEQR = function (parents, attributes) {
        return this.board.create(
            "line",
            [parents[2], parents[0], parents[1]],
            this.handleAtts(attributes)
        );
    };

    this.droiteEQ = function (parents, attributes) {
        return this.board.create(
            "line",
            [1.0, parents[0], parents[1]],
            this.handleAtts(attributes)
        );
    };

    this.parallele = function (parents, attributes) {
        return this.board.create(
            "parallel",
            [parents[1], parents[0]],
            this.handleAtts(attributes)
        );
    };

    this.mediatrice = function (parents, attributes) {
        var m, li, el;
        if (parents.length == 1) {
            m = this.board.create("midpoint", [parents[0]], {
                visible: false,
                withLabel: false
            });
            el = this.board.create(
                "perpendicular",
                [parents[0], m],
                this.handleAtts(attributes)
            );
        } else {
            li = this.board.create("line", parents, {
                visible: false,
                withLabel: false
            });
            m = this.board.create("midpoint", parents, {
                visible: false,
                withLabel: false
            });
            el = this.board.create("perpendicular", [li, m], this.handleAtts(attributes));
        }
        return el;
    };

    this.perpendiculaire = function (parents, attributes) {
        return this.board.create(
            "perpendicular",
            [parents[1], parents[0]],
            this.handleAtts(attributes)
        );
    };

    this.bissectrice = function (parents, attributes) {
        return this.board.create("bisector", parents, this.handleAtts(attributes));
    };

    this.tangente = function (parents, attributes) {
        var gli,
            f = parents[0],
            x = parents[1];

        if (JXG.isNumber(parents[1])) {
            x = parents[1];
            gli = this.board.create("glider", [x, f.Y(x), f], {
                fixed: true,
                visible: false,
                withLabel: false
            });
            return this.board.create("tangent", [f, gli], this.handleAtts(attributes));
        } else if (JXG.exists(parents[1].Value)) {
            // Fake glider: it needs the properties "position" and "slideObject".
            gli = this.board.create(
                "point",
                [
                    function () {
                        this.position = x.Value();
                        return x.Value();
                    },
                    function () {
                        return f.Y(x.Value());
                    }
                ],
                { visible: false, withLabel: false }
            );
            gli.slideObject = f;
            return this.board.create("tangent", [f, gli], this.handleAtts(attributes));
        } else {
            // Fake glider: it needs the properties "position" and "slideObject".
            gli = this.board.create(
                "point",
                [
                    function () {
                        this.position = x.X();
                        return x.X();
                    },
                    function () {
                        return f.Y(x.X());
                    }
                ],
                { visible: false, withLabel: false }
            );
            gli.slideObject = f;
            return this.board.create("tangent", [f, gli], this.handleAtts(attributes));
        }
    };

    this.vecteur = function (parents, attributes) {
        return this.board.create("arrow", parents, this.handleAtts(attributes));
    };

    /*
     * Circles
     */
    this.cercle = function (parents, attributes) {
        return this.board.create("circle", parents, this.handleAtts(attributes));
    };

    this.cerclerayon = function (parents, attributes) {
        return this.board.create("circle", parents, this.handleAtts(attributes));
    };

    /*
     * Polygons
     */
    this.polygone = function (parents, attributes) {
        return this.board.create("polygon", parents, this.handleAtts(attributes));
    };

    /*
     * Other
     */
    this.texte = function (parents, attributes) {
        return this.board.create("text", parents, this.handleAtts(attributes));
    };

    this.reel = function (parents, attributes) {
        var atts = this.handleAtts(attributes);
        atts["snapWidth"] = parents[3];
        return this.board.create(
            "slider",
            [
                [0, -2],
                [3, -2],
                [parents[1], parents[0], parents[2]]
            ],
            atts
        );
    };

    this.entier = function (parents, attributes) {
        return this.reel(parents, attributes);
    };

    this.fonction = function (parents, attributes) {
        var f = new Function("x", "return " + parents[0]);
        return this.board.create("functiongraph", [f], this.handleAtts(attributes));
    };

    /*
     * Transformations
     */

    this.homothetie = function (parents, attributes) {
        var c = parents[0],
            a = parents[1];
        if (JXG.isNumber(a)) {
            return this.board.create(
                "transform",
                [
                    1,
                    0,
                    0,
                    function () {
                        return (-a + 1) * c.X();
                    },
                    a,
                    0,
                    function () {
                        return (-a + 1) * c.Y();
                    },
                    0,
                    a
                ],
                { type: "generic" }
            );
        } else {
            // Slider
            return this.board.create(
                "transform",
                [
                    1,
                    0,
                    0,
                    function () {
                        return (-a.Value() + 1) * c.X();
                    },
                    function () {
                        return a.Value();
                    },
                    0,
                    function () {
                        return (-a.Value() + 1) * c.Y();
                    },
                    0,
                    function () {
                        return a.Value();
                    }
                ],
                { type: "generic" }
            );
        }
    };

    this.symetrie = function (parents, attributes) {
        if (parents.length == 1 && JXG.isPoint(parents[0])) {
            return this.board.create("transform", [Math.PI, parents[0]], {
                type: "rotate"
            });
        }
    };

    this.reflexion = function (parents, attributes) {
        return this.board.create("transform", [parents[0]], { type: "reflect" });
    };

    this.rotation = function (parents, attributes) {
        var a = parents[1];
        if (JXG.isNumber(a)) {
            a = (Math.PI * a) / 180.0;
            return this.board.create("transform", [a, parents[0]], {
                type: "rotate"
            });
        } else {
            // slider
            return this.board.create(
                "transform",
                [
                    function () {
                        return (Math.PI * a.Value()) / 180.0;
                    },
                    parents[0]
                ],
                { type: "rotate" }
            );
        }
    };

    this.translation = function (parents, attributes) {
        if (parents.length == 1) {
            return this.board.create(
                "transform",
                [
                    function () {
                        return parents[0].point2.X() - parents[0].point1.X();
                    },
                    function () {
                        return parents[0].point2.Y() - parents[0].point1.Y();
                    }
                ],
                { type: "translate" }
            );
        } else {
            return this.board.create(
                "transform",
                [
                    function () {
                        return parents[1].X() - parents[0].X();
                    },
                    function () {
                        return parents[1].Y() - parents[0].Y();
                    }
                ],
                { type: "translate" }
            );
        }
    };
};

JXG.registerReader(JXG.TracenpocheReader, ["tracenpoche"]);
