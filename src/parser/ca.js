/*
 JessieCode Computer algebra algorithms

    Copyright 2011-2019
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
/*eslint eqeqeq: "off"*/

/**
 * @fileoverview Here, the computer algebra algorithms are implemented.
 */

import JXG from "../jxg.js";
import Type from "../utils/type.js";
// import Const from "../base/constants.js";
// import Text from "../base/text.js";
// import Mat from "../math/math.js";
// import Geometry from "../math/geometry.js";
// import Statistics from "../math/statistics.js";
// import Env from "../utils/env.js";

/**
 * A JessieCode object provides an interface to the parser and stores all variables and objects used within a JessieCode script.
 * The optional argument <tt>code</tt> is interpreted after initializing. To evaluate more code after initializing a JessieCode instance
 * please use {@link JXG.JessieCode#parse}. For code snippets like single expressions use {@link JXG.JessieCode#snippet}.
 * @constructor
 * @param {String} [code] Code to parse.
 * @param {Boolean} [geonext=false] Geonext compatibility mode.
 */
JXG.CA = function (node, createNode, parser) {
    this.node = node;
    this.createNode = createNode;
    this.parser = parser;
};

JXG.extend(
    JXG.CA.prototype,
    /** @lends JXG.CA.prototype */ {
        findMapNode: function (mapname, node) {
            var i, len, ret;

            //console.log("FINDMAP", node);
            if (node.value === "op_assign" && node.children[0].value === mapname) {
                return node.children[1];
            } else if (node.children) {
                len = node.children.length;
                for (i = 0; i < len; ++i) {
                    ret = this.findMapNode(mapname, node.children[i]);
                    if (ret !== null) {
                        return ret;
                    }
                }
            }
            return null;
        },

        /**
         * Declare all subnodes as math nodes,
         * i.e recursively set node.isMath = true;
         */
        setMath: function (node) {
            var i, len;

            if (
                (node.type == "node_op" &&
                    (node.value == "op_add" ||
                        node.value == "op_sub" ||
                        node.value == "op_mul" ||
                        node.value == "op_div" ||
                        node.value == "op_neg" ||
                        node.value == "op_execfun" ||
                        node.value == "op_exp")) ||
                node.type == "node_var" ||
                node.type == "node_const"
            ) {
                node.isMath = true;
            }
            if (node.children) {
                len = node.children.length;
                for (i = 0; i < len; ++i) {
                    this.setMath(node.children[i]);
                }
            }
        },

        deriveElementary: function (node, varname) {
            var fun = node.children[0].value,
                arg = node.children[1],
                newNode;

            switch (fun) {
                case "abs":
                    // x / sqrt(x * x)
                    newNode = this.createNode(
                        "node_op",
                        "op_div",
                        arg[0],
                        this.createNode(
                            "node_op",
                            "op_execfun",
                            this.createNode("node_var", 'sqrt'),
                            [
                                this.createNode(
                                    "node_op",
                                    "op_mul",
                                    Type.deepCopy(arg[0]),
                                    Type.deepCopy(arg[0])
                                )
                            ]
                        )
                    );
                    break;

                case "sqrt":
                    newNode = this.createNode(
                        "node_op",
                        "op_div",
                        this.createNode("node_const", 1.0),
                        this.createNode(
                            "node_op",
                            "op_mul",
                            this.createNode("node_const", 2.0),
                            this.createNode(
                                node.type,
                                node.value,
                                Type.deepCopy(node.children[0]),
                                Type.deepCopy(node.children[1])
                            )
                        )
                    );
                    break;

                case "sin":
                    newNode = this.createNode(
                        "node_op",
                        "op_execfun",
                        this.createNode("node_var", 'cos'),
                        Type.deepCopy(arg)
                    );
                    break;

                case "cos":
                    newNode = this.createNode(
                        "node_op",
                        "op_neg",
                        this.createNode(
                            "node_op",
                            "op_execfun",
                            this.createNode("node_var", 'sin'),
                            Type.deepCopy(arg)
                        )
                    );
                    break;

                case "tan":
                    newNode = this.createNode(
                        "node_op",
                        "op_div",
                        this.createNode("node_const", 1.0),
                        this.createNode(
                            "node_op",
                            "op_exp",
                            this.createNode(
                                "node_op",
                                "op_execfun",
                                this.createNode("node_var", 'cos'),
                                Type.deepCopy(arg)
                            ),
                            this.createNode("node_const", 2)
                        )
                    );
                    break;

                case "cot":
                    newNode = this.createNode(
                        "node_op",
                        "op_neg",
                        this.createNode(
                            "node_op",
                            "op_div",
                            this.createNode("node_const", 1.0),
                            this.createNode(
                                "node_op",
                                "op_exp",
                                this.createNode(
                                    "node_op",
                                    "op_execfun",
                                    this.createNode("node_var", 'sin'),
                                    Type.deepCopy(arg)
                                ),
                                this.createNode("node_const", 2)
                            )
                        )
                    );
                    break;

                case "exp":
                    newNode = this.createNode(
                        node.type,
                        node.value,
                        Type.deepCopy(node.children[0]),
                        Type.deepCopy(node.children[1])
                    );
                    break;

                case "pow":
                    // (f^g)' = f^g*(f'g/f + g' log(f))
                    newNode = this.createNode(
                        "node_op",
                        "op_mul",
                        this.createNode(
                            "node_op",
                            "op_execfun",
                            Type.deepCopy(node.children[0]),
                            Type.deepCopy(node.children[1])
                        ),
                        this.createNode(
                            "node_op",
                            "op_add",
                            this.createNode(
                                "node_op",
                                "op_mul",
                                this.derivative(node.children[1][0], varname),
                                this.createNode(
                                    "node_op",
                                    "op_div",
                                    Type.deepCopy(node.children[1][1]),
                                    Type.deepCopy(node.children[1][0])
                                )
                            ),
                            this.createNode(
                                "node_op",
                                "op_mul",
                                this.derivative(node.children[1][1], varname),
                                this.createNode(
                                    "node_op",
                                    "op_execfun",
                                    this.createNode("node_var", 'log'),
                                    [Type.deepCopy(node.children[1][0])]
                                )
                            )
                        )
                    );
                    break;

                case "log":
                case "ln":
                    newNode = this.createNode(
                        "node_op",
                        "op_div",
                        this.createNode("node_const", 1.0),
                        // Attention: single variable mode
                        Type.deepCopy(arg[0])
                    );
                    break;

                case "log2":
                case "lb":
                case "ld":
                    newNode = this.createNode(
                        "node_op",
                        "op_mul",
                        this.createNode(
                            "node_op",
                            "op_div",
                            this.createNode("node_const", 1.0),
                            // Attention: single variable mode
                            Type.deepCopy(arg[0])
                        ),
                        this.createNode("node_const", 1.4426950408889634) // 1/log(2)
                    );
                    break;

                case "log10":
                case "lg":
                    newNode = this.createNode(
                        "node_op",
                        "op_mul",
                        this.createNode(
                            "node_op",
                            "op_div",
                            this.createNode("node_const", 1.0),
                            // Attention: single variable mode
                            Type.deepCopy(arg[0])
                        ),
                        this.createNode("node_const", 0.43429448190325176) // 1/log(10)
                    );
                    break;

                case "asin":
                    newNode = this.createNode(
                        "node_op",
                        "op_div",
                        this.createNode("node_const", 1.0),
                        this.createNode(
                            "node_op",
                            "op_execfun",
                            this.createNode("node_var", 'sqrt'),
                            [
                                this.createNode(
                                    "node_op",
                                    "op_sub",
                                    this.createNode("node_const", 1.0),
                                    this.createNode(
                                        "node_op",
                                        "op_mul",
                                        Type.deepCopy(arg[0]),
                                        Type.deepCopy(arg[0])
                                    )
                                )
                            ]
                        )
                    );
                    break;

                case "acos":
                    newNode = this.createNode(
                        "node_op",
                        "op_neg",
                        this.createNode(
                            "node_op",
                            "op_div",
                            this.createNode("node_const", 1.0),
                            this.createNode(
                                "node_op",
                                "op_execfun",
                                this.createNode("node_var", 'sqrt'),
                                [
                                    this.createNode(
                                        "node_op",
                                        "op_sub",
                                        this.createNode("node_const", 1.0),
                                        this.createNode(
                                            "node_op",
                                            "op_mul",
                                            Type.deepCopy(arg[0]),
                                            Type.deepCopy(arg[0])
                                        )
                                    )
                                ]
                            )
                        )
                    );
                    break;

                //case 'atan2':

                case "atan":
                    newNode = this.createNode(
                        "node_op",
                        "op_div",
                        this.createNode("node_const", 1.0),
                        this.createNode(
                            "node_op",
                            "op_add",
                            this.createNode("node_const", 1.0),
                            this.createNode(
                                "node_op",
                                "op_mul",
                                Type.deepCopy(arg[0]),
                                Type.deepCopy(arg[0])
                            )
                        )
                    );
                    break;

                case "acot":
                    newNode = this.createNode(
                        "node_op",
                        "op_neg",
                        this.createNode(
                            "node_op",
                            "op_div",
                            this.createNode("node_const", 1.0),
                            this.createNode(
                                "node_op",
                                "op_add",
                                this.createNode("node_const", 1.0),
                                this.createNode(
                                    "node_op",
                                    "op_mul",
                                    Type.deepCopy(arg[0]),
                                    Type.deepCopy(arg[0])
                                )
                            )
                        )
                    );
                    break;

                case "sinh":
                    newNode = this.createNode(
                        "node_op",
                        "op_execfun",
                        this.createNode("node_var", 'cosh'),
                        [Type.deepCopy(arg[0])]
                    );
                    break;

                case "cosh":
                    newNode = this.createNode(
                        "node_op",
                        "op_execfun",
                        this.createNode("node_var", 'sinh'),
                        [Type.deepCopy(arg[0])]
                    );
                    break;

                case "tanh":
                    newNode = this.createNode(
                        "node_op",
                        "op_sub",
                        this.createNode("node_const", 1.0),
                        this.createNode(
                            "node_op",
                            "op_exp",
                            this.createNode(
                                "node_op",
                                "op_execfun",
                                this.createNode("node_var", 'tanh'),
                                [Type.deepCopy(arg[0])]
                            ),
                            this.createNode("node_const", 2.0)
                        )
                    );
                    break;

                case "asinh":
                    newNode = this.createNode(
                        "node_op",
                        "op_div",
                        this.createNode("node_const", 1.0),
                        this.createNode(
                            "node_op",
                            "op_execfun",
                            this.createNode("node_var", 'sqrt'),
                            [
                                this.createNode(
                                    "node_op",
                                    "op_add",
                                    this.createNode(
                                        "node_op",
                                        "op_mul",
                                        Type.deepCopy(arg[0]),
                                        Type.deepCopy(arg[0])
                                    ),
                                    this.createNode("node_const", 1.0)
                                )
                            ]
                        )
                    );
                    break;

                case "acosh":
                    newNode = this.createNode(
                        "node_op",
                        "op_div",
                        this.createNode("node_const", 1.0),
                        this.createNode(
                            "node_op",
                            "op_execfun",
                            this.createNode("node_var", 'sqrt'),
                            [
                                this.createNode(
                                    "node_op",
                                    "op_sub",
                                    this.createNode(
                                        "node_op",
                                        "op_mul",
                                        Type.deepCopy(arg[0]),
                                        Type.deepCopy(arg[0])
                                    ),
                                    this.createNode("node_const", 1.0)
                                )
                            ]
                        )
                    );
                    break;

                case "atanh":
                    newNode = this.createNode(
                        "node_op",
                        "op_div",
                        this.createNode("node_const", 1.0),
                        this.createNode(
                            "node_op",
                            "op_sub",
                            this.createNode("node_const", 1.0),
                            this.createNode(
                                "node_op",
                                "op_mul",
                                Type.deepCopy(arg[0]),
                                Type.deepCopy(arg[0])
                            )
                        )
                    );
                    break;

                default:
                    newNode = this.createNode("node_const", 0.0);
                    console.log('Derivative of "' + fun + '" not yet implemented');
                    throw new Error("Error(" + this.line + "): ");
                //  this._error('Derivative of "' + fun + '" not yet implemented');
            }

            return newNode;
        },

        derivative: function (node, varname) {
            var newNode;

            switch (node.type) {
                case "node_op":
                    switch (node.value) {
                        /*
                        case 'op_map':
                            if (true) {
                                newNode = this.createNode('node_op', 'op_map',
                                        Type.deepCopy(node.children[0]),
                                        this.derivative(node.children[1], varname)
                                    );
                            } else {
                                newNode = this.derivative(node.children[1], varname);
                            }
                            break;
                        */
                        case "op_execfun":
                            // f'(g(x))g'(x)
                            if (node.children[0].value == 'pow') {
                                newNode = this.deriveElementary(node, varname);
                            } else {
                                if (node.children[1].length === 0) {
                                    newNode = this.createNode("node_const", 0.0);
                                } else {
                                    newNode = this.createNode(
                                        "node_op",
                                        "op_mul",
                                        this.deriveElementary(node, varname),
                                        // Warning: single variable mode
                                        this.derivative(node.children[1][0], varname)
                                    );
                                }
                            }
                            break;

                        case "op_div":
                            // (f'g − g'f )/(g*g)
                            newNode = this.createNode(
                                "node_op",
                                "op_div",
                                this.createNode(
                                    "node_op",
                                    "op_sub",
                                    this.createNode(
                                        "node_op",
                                        "op_mul",
                                        this.derivative(node.children[0], varname),
                                        Type.deepCopy(node.children[1])
                                    ),
                                    this.createNode(
                                        "node_op",
                                        "op_mul",
                                        Type.deepCopy(node.children[0]),
                                        this.derivative(node.children[1], varname)
                                    )
                                ),
                                this.createNode(
                                    "node_op",
                                    "op_mul",
                                    Type.deepCopy(node.children[1]),
                                    Type.deepCopy(node.children[1])
                                )
                            );
                            break;

                        case "op_mul":
                            // fg' + f'g
                            newNode = this.createNode(
                                "node_op",
                                "op_add",
                                this.createNode(
                                    "node_op",
                                    "op_mul",
                                    Type.deepCopy(node.children[0]),
                                    this.derivative(node.children[1], varname)
                                ),
                                this.createNode(
                                    "node_op",
                                    "op_mul",
                                    this.derivative(node.children[0], varname),
                                    Type.deepCopy(node.children[1])
                                )
                            );
                            break;

                        case "op_neg":
                            newNode = this.createNode(
                                "node_op",
                                "op_neg",
                                this.derivative(node.children[0], varname)
                            );
                            break;

                        case "op_add":
                        case "op_sub":
                            newNode = this.createNode(
                                "node_op",
                                node.value,
                                this.derivative(node.children[0], varname),
                                this.derivative(node.children[1], varname)
                            );
                            break;

                        case "op_exp":
                            // (f^g)' = f^g*(f'g/f + g' log(f))
                            newNode = this.createNode(
                                "node_op",
                                "op_mul",
                                Type.deepCopy(node),
                                this.createNode(
                                    "node_op",
                                    "op_add",
                                    this.createNode(
                                        "node_op",
                                        "op_mul",
                                        this.derivative(node.children[0], varname),
                                        this.createNode(
                                            "node_op",
                                            "op_div",
                                            Type.deepCopy(node.children[1]),
                                            Type.deepCopy(node.children[0])
                                        )
                                    ),
                                    this.createNode(
                                        "node_op",
                                        "op_mul",
                                        this.derivative(node.children[1], varname),
                                        this.createNode(
                                            "node_op",
                                            "op_execfun",
                                            this.createNode("node_var", 'log'),
                                            [Type.deepCopy(node.children[0])]
                                        )
                                    )
                                )
                            );
                            break;
                    }
                    break;

                case "node_var":
                    //console.log('node_var', node);
                    if (node.value === varname) {
                        newNode = this.createNode("node_const", 1.0);
                    } else {
                        newNode = this.createNode("node_const", 0.0);
                    }
                    break;

                case "node_const":
                    newNode = this.createNode("node_const", 0.0);
                    break;

                case "node_const_bool":
                    break;

                case "node_str":
                    break;
            }

            return newNode;
        },

        /**
         * f = map (x) -> x*sin(x);
         * Usages:
         *   h = D(f, x);
         *   h = map (x) -> D(f, x);
         * or
         *   D(x^2, x);
         */
        expandDerivatives: function (node, parent, ast) {
            var len, i, j, mapNode, codeNode,
                ret, node2, newNode, mapName,
                varname, vArray, order, isMap;

            ret = 0;
            if (!node) {
                return ret;
            }

            this.line = node.line;
            this.col = node.col;

            // First we have to go down in the tree.
            // This ensures that in cases like D(D(f,x),x) the inner D is expanded first.
            len = node.children.length;
            for (i = 0; i < len; ++i) {
                if (node.children[i] && node.children[i].type) {
                    node.children[i] = this.expandDerivatives(node.children[i], node, ast);
                } else if (Type.isArray(node.children[i])) {
                    for (j = 0; j < node.children[i].length; ++j) {
                        if (node.children[i][j] && node.children[i][j].type) {
                            node.children[i][j] = this.expandDerivatives(
                                node.children[i][j],
                                node,
                                ast
                            );
                        }
                    }
                }
            }

            switch (node.type) {
                case "node_op":
                    switch (node.value) {
                        case "op_execfun":
                            if (node.children[0] && node.children[0].value === 'D') {
                                /*
                                 * Distinguish the cases:
                                 *   D(f, x) where f is map -> isMap = true
                                 * and
                                 *   D(2*x, x), D(sin(x), x), ...  -> isMap = false
                                 */
                                isMap = false;
                                if (node.children[1][0].type == "node_var") {
                                    mapName = node.children[1][0].value;
                                    mapNode = this.findMapNode(mapName, ast);
                                    if (mapNode !== null) {
                                        isMap = true;
                                    }
                                }

                                if (isMap) {
                                    /*
                                     * Derivative of map, that is compute D(f,x)
                                     * where e.g. f = map (x) -> x^2
                                     *
                                     * First step: find node where the map is defined
                                     */
                                    // Already done above
                                    // mapName = node.children[1][0].value;
                                    // mapNode = this.findMapNode(mapName, ast);
                                    vArray = mapNode.children[0];

                                    // Variable name for differentiation
                                    if (node.children[1].length >= 2) {
                                        varname = node.children[1][1].value;
                                    } else {
                                        varname = mapNode.children[0][0]; // Usually it's 'x'
                                    }
                                    codeNode = mapNode.children[1];
                                } else {
                                    /*
                                     * Derivative of expression, e.g.
                                     *     D(2*x, x) or D(sin(x), x)
                                     */
                                    codeNode = node.children[1][0];
                                    vArray = ["x"];

                                    // Variable name for differentiation and order
                                    if (node.children[1].length >= 2) {
                                        varname = node.children[1][1].value;
                                    } else {
                                        varname = 'x';
                                    }
                                }

                                // Differentiation order
                                if (node.children[1].length >= 3) {
                                    order = node.children[1][2].value;
                                } else {
                                    order = 1;
                                }

                                // Create node which contains the derivative
                                newNode = codeNode;
                                //newNode = this.removeTrivialNodes(newNode);
                                if (order >= 1) {
                                    while (order >= 1) {
                                        newNode = this.derivative(newNode, varname);
                                        newNode = this.removeTrivialNodes(newNode);
                                        order--;
                                    }
                                }

                                // Replace the node containing e.g. D(f,x) by the derivative.
                                if (parent.type == "node_op" && parent.value == "op_assign") {
                                    // If D is an assignment it has to be replaced by a map
                                    // h = D(f, x)
                                    node2 = this.createNode(
                                        "node_op",
                                        "op_map",
                                        vArray,
                                        newNode
                                    );
                                } else {
                                    node2 = newNode;
                                }

                                this.setMath(node2);
                                node.type = node2.type;
                                node.value = node2.value;
                                if (node2.children.length > 0) {
                                    node.children[0] = node2.children[0];
                                }
                                if (node2.children.length > 1) {
                                    node.children[1] = node2.children[1];
                                }
                            }
                    }
                    break;

                case "node_var":
                case "node_const":
                case "node_const_bool":
                case "node_str":
                    break;
            }

            return node;
        },

        removeTrivialNodes: function (node) {
            var i, len, n0, n1, swap;

            // In case of 'op_execfun' the children[1] node is an array.
            if (Type.isArray(node)) {
                len = node.length;
                for (i = 0; i < len; ++i) {
                    node[i] = this.removeTrivialNodes(node[i]);
                }
            }
            if (node.type != "node_op" || !node.children) {
                return node;
            }

            len = node.children.length;
            for (i = 0; i < len; ++i) {
                this.mayNotBeSimplified = false;
                do {
                    node.children[i] = this.removeTrivialNodes(node.children[i]);
                } while (this.mayNotBeSimplified);
            }

            switch (node.value) {
                // Allow maps of the form
                //  map (x) -> x;
                case "op_map":
                    n0 = node.children[0];
                    n1 = node.children[1];
                    if (n1.type == "node_var") {
                        for (i = 0; i < n0.length; ++i) {
                            // Allow maps of the form map(x) -> x
                            if (n0[i] == n1.value) {
                                n1.isMath = true;
                                break;
                            }
                        }
                    }
                    break;

                // a + 0 -> a
                // 0 + a -> a
                case "op_add":
                    n0 = node.children[0];
                    n1 = node.children[1];
                    if (n0.type == "node_const" && n0.value === 0.0) {
                        return n1;
                    }
                    if (n1.type == "node_const" && n1.value === 0.0) {
                        return n0;
                    }

                    // const + const -> const
                    if (n0.type == "node_const" && n1.type == "node_const") {
                        n0.value += n1.value;
                        return n0;
                    }
                    break;

                // 1 * a = a
                // a * 1 = a
                // a * 0 = 0
                // 0 * a = 0
                // - * - = +
                // Order children
                case "op_mul":
                    n0 = node.children[0];
                    n1 = node.children[1];
                    if (n0.type == "node_const" && n0.value == 1.0) {
                        return n1;
                    }
                    if (n1.type == "node_const" && n1.value == 1.0) {
                        return n0;
                    }
                    if (n0.type == "node_const" && n0.value === 0.0) {
                        return n0;
                    }
                    if (n1.type == "node_const" && n1.value === 0.0) {
                        return n1;
                    }
                    if (n1.type == "node_const" && n1.value === 0.0) {
                        return n1;
                    }

                    // (-a) * (-b) -> a*b
                    if (
                        n0.type == "node_op" &&
                        n0.value == "op_neg" &&
                        n1.type == "node_op" &&
                        n1.value == "op_neg"
                    ) {
                        node.children = [n0.children[0], n1.children[0]];
                        this.mayNotBeSimplified = true;
                        return node;
                    }
                    // (-a) * b -> -(a*b)
                    if (n0.value == "op_neg" && n1.value != "op_neg") {
                        node.type = "node_op";
                        node.value = "op_neg";
                        node.children = [
                            this.createNode("node_op", "op_mul", n0.children[0], n1)
                        ];
                        this.mayNotBeSimplified = true;
                        return node;
                    }
                    // a * (-b) -> -(a*b)
                    if (n0.value != "op_neg" && n1.value == "op_neg") {
                        node.type = "node_op";
                        node.value = "op_neg";
                        node.children = [
                            this.createNode("node_op", "op_mul", n0, n1.children[0])
                        ];
                        this.mayNotBeSimplified = true;
                        return node;
                    }
                    // (1 / a) * b -> a / b
                    if (
                        n0.value == "op_div" &&
                        n0.children[0].type == "node_const" &&
                        n0.children[0].value == 1.0
                    ) {
                        node.type = "node_op";
                        node.value = "op_div";
                        node.children = [n1, n0.children[1]];
                        this.mayNotBeSimplified = true;
                        return node;
                    }
                    // a * (1 / b) -> a / b
                    if (
                        n1.value == "op_div" &&
                        n1.children[0].type == "node_const" &&
                        n1.children[0].value == 1.0
                    ) {
                        node.type = "node_op";
                        node.value = "op_div";
                        node.children = [n0, n1.children[1]];
                        this.mayNotBeSimplified = true;
                        return node;
                    }

                    // Order children
                    // a * const -> const * a
                    if (n0.type != "node_const" && n1.type == "node_const") {
                        node.children = [n1, n0];
                        this.mayNotBeSimplified = true;
                        return node;
                    }
                    // a + (-const) -> -const + a
                    if (
                        n0.type != "node_const" &&
                        n1.type == "node_op" &&
                        n1.value == "op_neg" &&
                        n1.children[0].type == "node_const"
                    ) {
                        node.children = [n1, n0];
                        this.mayNotBeSimplified = true;
                        return node;
                    }

                    // a * var -> var * a
                    // a * fun -> fun * a
                    if (
                        n0.type == "node_op" &&
                        n0.value != "op_execfun" &&
                        (n1.type == "node_var" ||
                            (n1.type == "node_op" && n1.value == "op_execfun"))
                    ) {
                        node.children = [n1, n0];
                        this.mayNotBeSimplified = true;
                        return node;
                    }

                    // a + (-var) -> -var  + a
                    if (
                        n0.type != "node_op" &&
                        n1.type == "node_op" &&
                        n1.value == "op_neg" &&
                        n1.children[0].type == "node_var"
                    ) {
                        node.children = [n1, n0];
                        this.mayNotBeSimplified = true;
                        return node;
                    }
                    // a * (const * b) -> const * (a*b)
                    // a * (const / b) -> const * (a/b)
                    if (
                        n0.type != "node_const" &&
                        n1.type == "node_op" &&
                        (n1.value == "op_mul" || n1.value == "op_div") &&
                        n1.children[0].type == "node_const"
                    ) {
                        swap = n1.children[0];
                        n1.children[0] = n0;
                        node.children = [swap, n1];
                        this.mayNotBeSimplified = true;
                        return node;
                    }

                    // (const * a) * b -> const * (a * b)
                    if (
                        n1.type != "node_const" &&
                        n0.type == "node_op" &&
                        n0.value == "op_mul" &&
                        n0.children[0].type == "node_const"
                    ) {
                        node.children = [
                            n0.children[0],
                            this.createNode("node_op", "op_mul", n0.children[1], n1)
                        ];
                        this.mayNotBeSimplified = true;
                        return node;
                    }

                    // const * const -> const
                    if (n0.type == "node_const" && n1.type == "node_const") {
                        n0.value *= n1.value;
                        return n0;
                    }

                    // const * (const * a) -> const * a
                    // const * (const / a) -> const / a
                    if (
                        n0.type == "node_const" &&
                        n1.type == "node_op" &&
                        (n1.value == "op_mul" || n1.value == "op_div") &&
                        n1.children[0].type == "node_const"
                    ) {
                        n1.children[0].value *= n0.value;
                        return n1;
                    }

                    // a * a-> a^2
                    n0.hash = this.parser.compile(n0);
                    n1.hash = this.parser.compile(n1);
                    if (n0.hash === n1.hash) {
                        node.value = "op_exp";
                        node.children[1] = this.createNode("node_const", 2.0);
                        return node;
                    }

                    if (
                        n0.type == "node_const" &&
                        n1.type == "node_op" &&
                        (n1.value == "op_mul" || n1.value == "op_div") &&
                        n1.children[0].type == "node_const"
                    ) {
                        n1.children[0].value *= n0.value;
                        return n1;
                    }

                    // a * a^b -> a^(b+1)
                    if (n1.type == "node_op" && n1.value == "op_exp") {
                        if (!n0.hash) {
                            n0.hash = this.parser.compile(n0);
                        }
                        if (!n1.children[0].hash) {
                            n1.children[0].hash = this.parser.compile(n1.children[0]);
                        }
                        if (n0.hash === n1.children[0].hash) {
                            n1.children[1] = this.createNode(
                                "node_op",
                                "op_add",
                                n1.children[1],
                                this.createNode("node_const", 1.0)
                            );
                            this.mayNotBeSimplified = true;
                            return n1;
                        }
                    }

                    // a^b * a^c -> a^(b+c)
                    if (
                        n0.type == "node_op" &&
                        n0.value == "op_exp" &&
                        n1.type == "node_op" &&
                        n1.value == "op_exp"
                    ) {
                        n0.children[0].hash = this.parser.compile(n0.children[0]);
                        n1.children[0].hash = this.parser.compile(n1.children[0]);
                        if (n0.children[0].hash === n1.children[0].hash) {
                            n0.children[1] = this.createNode(
                                "node_op",
                                "op_add",
                                n0.children[1],
                                n1.children[1]
                            );
                            this.mayNotBeSimplified = true;
                            return n0;
                        }
                    }

                    break;

                // 0 - a -> -a
                // a - 0 -> a
                // a - a -> 0
                case "op_sub":
                    n0 = node.children[0];
                    n1 = node.children[1];
                    if (n0.type == "node_const" && n0.value === 0.0) {
                        node.value = "op_neg";
                        node.children[0] = n1;
                        return node;
                    }
                    if (n1.type == "node_const" && n1.value === 0.0) {
                        return n0;
                    }
                    if (
                        n0.type == "node_const" &&
                        n1.type == "node_const" &&
                        n0.value == n1.value
                    ) {
                        return this.createNode("node_const", 0.0);
                    }
                    if (
                        n0.type == "node_var" &&
                        n1.type == "node_var" &&
                        n0.value == n1.value
                    ) {
                        return this.createNode("node_const", 0.0);
                    }

                    // const - const -> const
                    if (n0.type == "node_const" && n1.type == "node_const") {
                        n0.value -= n1.value;
                        return n0;
                    }

                    // const * a - const * a -> const * a
                    if (
                        n0.type == "node_op" &&
                        n0.value == "op_mul" &&
                        n1.type == "node_op" &&
                        n1.value == "op_mul"
                    ) {
                        n0.children[1].hash = this.parser.compile(n0.children[1]);
                        n1.children[1].hash = this.parser.compile(n1.children[1]);
                        if (n0.children[1].hash === n1.children[1].hash) {
                            node.value = "op_mul";
                            node.children = [
                                this.createNode(
                                    "node_op",
                                    "op_sub",
                                    n0.children[0],
                                    n1.children[0]
                                ),
                                n0.children[1]
                            ];
                            this.mayNotBeSimplified = true;
                            return node;
                        }
                    }
                    // const * a - a -> (const - 1) * a
                    if (n0.type == "node_op" && n0.value == "op_mul") {
                        n0.children[1].hash = this.parser.compile(n0.children[1]);
                        n1.hash = this.parser.compile(n1);
                        if (n0.children[1].hash === n1.hash) {
                            node.value = "op_mul";
                            node.children = [
                                this.createNode(
                                    "node_op",
                                    "op_sub",
                                    n0.children[0],
                                    this.createNode("node_const", 1.0)
                                ),
                                n1
                            ];
                            this.mayNotBeSimplified = true;
                            return node;
                        }
                    }
                    // a - const*a -> (const - 1) * a
                    if (n1.type == "node_op" && n1.value == "op_mul") {
                        n1.children[1].hash = this.parser.compile(n1.children[1]);
                        n0.hash = this.parser.compile(n0);
                        if (n1.children[1].hash === n0.hash) {
                            node.value = "op_mul";
                            node.children = [
                                this.createNode(
                                    "node_op",
                                    "op_sub",
                                    this.createNode("node_const", 1.0),
                                    n1.children[0]
                                ),
                                n0
                            ];
                            this.mayNotBeSimplified = true;
                            return node;
                        }
                    }

                    break;

                // -0 -> 0
                // -(-b) = b
                case "op_neg":
                    n0 = node.children[0];
                    if (n0.type == "node_const" && n0.value === 0.0) {
                        return n0;
                    }
                    if (n0.type == "node_op" && n0.value == "op_neg") {
                        return n0.children[0];
                    }
                    break;

                // a / a -> 1, a != 0
                // 0 / a -> 0, a != 0
                // a / 0 -> Infinity, a != 0
                // 0 / 0 -> NaN, a == 0
                case "op_div":
                    n0 = node.children[0];
                    n1 = node.children[1];
                    if (
                        n0.type == "node_const" &&
                        n1.type == "node_const" &&
                        n0.value == n1.value &&
                        n0.value !== 0
                    ) {
                        n0.value = 1.0;
                        return n0;
                    }
                    if (
                        n0.type == "node_const" &&
                        n0.value === 0 &&
                        n1.type == "node_const" &&
                        n1.value !== 0
                    ) {
                        n0.value = 0.0;
                        return n0;
                    }

                    // Risky: 0 / (something != 0) -> 0.0
                    if (
                        n0.type == "node_const" &&
                        n0.value === 0 &&
                        (n1.type == "node_op" || n1.type == "node_var")
                    ) {
                        node.type = "node_const";
                        node.value = 0.0;
                        return node;
                    }

                    if (
                        n0.type == "node_var" &&
                        n1.type == "node_var" &&
                        n0.value == n1.value
                    ) {
                        return this.createNode("node_const", 1.0);
                    }
                    if (
                        n0.type == "node_const" &&
                        n0.value !== 0 &&
                        n1.type == "node_const" &&
                        n1.value === 0
                    ) {
                        if (n0.value > 0.0) {
                            n0.value = Infinity;
                        } else {
                            n0.value = -Infinity; // Do we ever need this?
                        }
                        return n0;
                    }

                    // (-a) / (-b) -> a/b
                    if (
                        n0.type == "node_op" &&
                        n0.value == "op_neg" &&
                        n1.type == "node_op" &&
                        n1.value == "op_neg"
                    ) {
                        node.children = [n0.children[0], n1.children[0]];
                        this.mayNotBeSimplified = true;
                        return node;
                    }
                    // (-a) / b -> -(a/b)
                    if (n0.value == "op_neg" && n1.value != "op_neg") {
                        node.type = "node_op";
                        node.value = "op_neg";
                        node.children = [
                            this.createNode("node_op", "op_div", n0.children[0], n1)
                        ];
                        this.mayNotBeSimplified = true;
                        return node;
                    }
                    // a / (-b) -> -(a/b)
                    if (n0.value != "op_neg" && n1.value == "op_neg") {
                        node.type = "node_op";
                        node.value = "op_neg";
                        node.children = [
                            this.createNode("node_op", "op_div", n0, n1.children[0])
                        ];
                        this.mayNotBeSimplified = true;
                        return node;
                    }

                    // a^b / a -> a^(b-1)
                    if (n0.type == "node_op" && n0.value == "op_exp") {
                        if (!n1.hash) {
                            n1.hash = this.parser.compile(n1);
                        }
                        if (!n0.children[0].hash) {
                            n0.children[0].hash = this.parser.compile(n0.children[0]);
                        }
                        if (n1.hash === n0.children[0].hash) {
                            n0.children[1] = this.createNode(
                                "node_op",
                                "op_sub",
                                n0.children[1],
                                this.createNode("node_const", 1.0)
                            );
                            this.mayNotBeSimplified = true;
                            return n0;
                        }
                    }

                    // (const * a) / b -> const * (a / b)
                    if (
                        n1.type != "node_const" &&
                        n0.type == "node_op" &&
                        n0.value == "op_mul" &&
                        n0.children[0].type == "node_const"
                    ) {
                        node.value = "op_mul";
                        node.children = [
                            n0.children[0],
                            this.createNode("node_op", "op_div", n0.children[1], n1)
                        ];
                        this.mayNotBeSimplified = true;
                        return node;
                    }

                    // a^b / a^c -> a^(b-c)
                    if (
                        n0.type == "node_op" &&
                        n0.value == "op_exp" &&
                        n1.type == "node_op" &&
                        n1.value == "op_exp"
                    ) {
                        n0.children[0].hash = this.parser.compile(n0.children[0]);
                        n1.children[0].hash = this.parser.compile(n1.children[0]);
                        if (n0.children[0].hash === n1.children[0].hash) {
                            n0.children[1] = this.createNode(
                                "node_op",
                                "op_sub",
                                n0.children[1],
                                n1.children[1]
                            );
                            this.mayNotBeSimplified = true;
                            return n0;
                        }
                    }

                    break;

                // a^0 = 1
                // a^1 -> a
                // 1^a -> 1
                // 0^a -> 0: a const != 0
                case "op_exp":
                    n0 = node.children[0];
                    n1 = node.children[1];
                    if (n1.type == "node_const" && n1.value === 0.0) {
                        n1.value = 1.0;
                        return n1;
                    }
                    if (n1.type == "node_const" && n1.value == 1.0) {
                        return n0;
                    }
                    if (n0.type == "node_const" && n0.value == 1.0) {
                        return n0;
                    }
                    if (
                        n0.type == "node_const" &&
                        n0.value === 0.0 &&
                        n1.type == "node_const" &&
                        n1.value !== 0.0
                    ) {
                        return n0;
                    }

                    // (a^b)^c -> a^(b*c)
                    if (n0.type == "node_op" && n0.value == "op_exp") {
                        node.children = [
                            n0.children[0],
                            this.createNode("node_op", "op_mul", n0.children[1], n1)
                        ];
                        return node;
                    }
                    break;
            }

            switch (node.value) {
                // const_1 + const_2 -> (const_1 + const_2)
                // a + a -> 2*a
                // a + (-b) = a - b
                case "op_add":
                    n0 = node.children[0];
                    n1 = node.children[1];
                    if (
                        n0.type == "node_const" &&
                        n1.type == "node_const" &&
                        n0.value == n1.value
                    ) {
                        n0.value += n1.value;
                        return n0;
                    }

                    if (
                        n0.type == "node_var" &&
                        n1.type == "node_var" &&
                        n0.value == n1.value
                    ) {
                        node.children[0] = this.createNode("node_const", 2.0);
                        node.value = "op_mul";
                        return node;
                    }

                    if (n0.type == "node_op" && n0.value == "op_neg") {
                        node.value = "op_sub";
                        node.children[0] = n1;
                        node.children[1] = n0.children[0];
                        this.mayNotBeSimplified = true;
                        return node;
                    }

                    if (n1.type == "node_op" && n1.value == "op_neg") {
                        node.value = "op_sub";
                        node.children[1] = n1.children[0];
                        this.mayNotBeSimplified = true;
                        return node;
                    }

                    // const * a + const * a -> const * a
                    if (
                        n0.type == "node_op" &&
                        n0.value == "op_mul" &&
                        n1.type == "node_op" &&
                        n1.value == "op_mul"
                    ) {
                        n0.children[1].hash = this.parser.compile(n0.children[1]);
                        n1.children[1].hash = this.parser.compile(n1.children[1]);
                        if (n0.children[1].hash === n1.children[1].hash) {
                            node.value = "op_mul";
                            node.children = [
                                this.createNode(
                                    "node_op",
                                    "op_add",
                                    n0.children[0],
                                    n1.children[0]
                                ),
                                n0.children[1]
                            ];
                            this.mayNotBeSimplified = true;
                            return node;
                        }
                    }
                    // const * a + a -> (const + 1) * a
                    if (n0.type == "node_op" && n0.value == "op_mul") {
                        n0.children[1].hash = this.parser.compile(n0.children[1]);
                        n1.hash = this.parser.compile(n1);
                        if (n0.children[1].hash === n1.hash) {
                            node.value = "op_mul";
                            node.children = [
                                this.createNode(
                                    "node_op",
                                    "op_add",
                                    n0.children[0],
                                    this.createNode("node_const", 1.0)
                                ),
                                n1
                            ];
                            this.mayNotBeSimplified = true;
                            return node;
                        }
                    }
                    // a + const*a -> (const + 1) * a
                    if (n1.type == "node_op" && n1.value == "op_mul") {
                        n1.children[1].hash = this.parser.compile(n1.children[1]);
                        n0.hash = this.parser.compile(n0);
                        if (n1.children[1].hash === n0.hash) {
                            node.value = "op_mul";
                            node.children = [
                                this.createNode(
                                    "node_op",
                                    "op_add",
                                    this.createNode("node_const", 1.0),
                                    n1.children[0]
                                ),
                                n0
                            ];
                            this.mayNotBeSimplified = true;
                            return node;
                        }
                    }

                    break;

                // a - (-b) = a + b
                case "op_sub":
                    n0 = node.children[0];
                    n1 = node.children[1];
                    if (n1.type == "node_op" && n1.value == "op_neg") {
                        node.value = "op_add";
                        node.children[1] = n1.children[0];
                        this.mayNotBeSimplified = true;
                        return node;
                    }
                    break;

                case "op_execfun":
                    return this.simplifyElementary(node);
            }

            return node;
        },

        simplifyElementary: function (node) {
            var fun = node.children[0].value,
                arg = node.children[1];

            // Catch errors of the form sin()
            if (arg.length == 0) {
                return node;
            }

            switch (fun) {
                // sin(0) -> 0
                // sin(PI) -> 0
                // sin (int * PI) -> 0
                // sin (PI * int) -> 0
                // Same for tan()
                case "sin":
                case "tan":
                    if (arg[0].type == "node_const" && arg[0].value === 0) {
                        node.type = "node_const";
                        node.value = 0.0;
                        return node;
                    }
                    if (arg[0].type == "node_var" && arg[0].value == 'PI') {
                        node.type = "node_const";
                        node.value = 0.0;
                        return node;
                    }
                    if (
                        arg[0].type == "node_op" &&
                        arg[0].value == "op_mul" &&
                        arg[0].children[0].type == "node_const" &&
                        arg[0].children[0].value % 1 === 0 &&
                        arg[0].children[1].type == "node_var" &&
                        arg[0].children[1].value == "PI"
                    ) {
                        node.type = "node_const";
                        node.value = 0.0;
                        return node;
                    }
                    break;

                // cos(0) -> 1.0
                // cos(PI) -> -1.0
                // cos(int * PI) -> +/- 1.0
                // cos(PI * int) -> +/- 1.0
                case "cos":
                    if (arg[0].type == "node_const" && arg[0].value === 0) {
                        node.type = "node_const";
                        node.value = 1.0;
                        return node;
                    }
                    if (arg[0].type == "node_var" && arg[0].value == 'PI') {
                        node.type = "node_op";
                        node.value = "op_neg";
                        node.children = [this.createNode("node_const", 1.0)];
                        return node;
                    }
                    /*
                    if (arg[0].type == 'node_op' && arg[0].value == 'op_mul' &&
                        ((arg[0].children[0].type == 'node_const' && arg[0].children[0].value % 1 === 0 &&
                         arg[0].children[1].type == 'node_var' && arg[0].children[1].value == 'PI') ||
                         (arg[0].children[1].type == 'node_const' && arg[0].children[1].value % 1 === 0 &&
                          arg[0].children[0].type == 'node_var' && arg[0].children[0].value == 'PI'))) {
                        node.type = 'node_const';
                        node.value = 1.0;
                        return node;
                    }
                    */
                    break;

                // exp(0) -> 1
                case "exp":
                    if (arg[0].type == "node_const" && arg[0].value === 0) {
                        node.type = "node_const";
                        node.value = 1.0;
                        return node;
                    }
                    break;

                // pow(a, 0) -> 1
                case "pow":
                    if (arg[1].type == "node_const" && arg[1].value === 0) {
                        node.type = "node_const";
                        node.value = 1.0;
                        return node;
                    }
                    break;
            }

            return node;
        }
    }
);

export default JXG.CA;
