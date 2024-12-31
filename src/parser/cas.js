"use strict";

import JXG from "../jxg.js";
import Type from "../utils/type.js";

JXG.CAS = {
    /**
     * Simplifies: a given AST, an Array of ASTs(component wise) or an arithmetic string(after converting it to a tree)
     * Options:
     * - method:
     *          "strong"(default) -> with polynomial division;
     *          "medium" -> without polynomial division;
     *          "weak" -> only computes trivial terms;
     *          "interactive" -> user can change the tree in an interactive manner
     * - form:
     *          "fractions"(default) -> does not convert fractions to decimals;
     *          "decimals" -> does convert fractions to decimals;
     * - steps:
     *          This attribute is only relevant, if the method is set to "interactive"
     *          Steps may contain an array of specific keword-strings, which then give the order of execution of the simplify functions
     *          Keywords: "expand", "collect", "factorize", "cancel"
     * -iterations:
     *          Default: 1000
     *          This attribute indicates the number of Iterations of the strong version of the algorithm.
     *          Hence, if the number of iterations is 100, the algorithm stops after it executed its loop a maximum of 100 times, even if the tree still changed in the last iteration.
     * @param {*} ast
     * @param {*} options
     * @returns
     */
    simplify: function (ast, options = {}) {
        var i, jc;

        // Here the conversion/preparation takes place
        if (JXG.isArray(ast)) {
            // If ast is an array, then simplify each of its components
            for (i = 0; i < ast.length; i++) {
                ast[i] = this.simplify(ast[i]);
            }
            return ast;
        } else if (JXG.isString(ast)) {
            // If ast is a (syntactically correct) string, then convert it into an AST
            jc = new JXG.JessieCode();
            ast = jc.getAST(ast);
            // this.createNode = jc.createNode;
        } else if (!this.is_ast(ast)) {
            //If this step gets reached by a non tree, then abort the simplification
            console.log("The function simplify does not support the type of the first parameter and can thus not simplify it");
            return ast;
        }
        //This code only gets reached by ASTs
        //First set the standard configurations
        options.method = options.method || "strong";
        options.form = options.form || "fractions";
        options.steps = options.steps || [];
        options.iterations = options.iterations || 1000;

        //Call the recursive function for simplification
        ast = this._simplify_aux(ast, options);
        return ast;
    },

    /**
     * Compiles an AST-tree as string with a minimal amount of braces
     * @param {*} node - root node
     * @returns {String} InOrder-representation
     */
    compile: function (node, prev_op, position = -1) {
        var compiled, my_priority;

        if (node === undefined) {
            console.error("compile: undefined node");
            return;
        }
        switch (String(node.type)) {
            case "node_var":
                return node.value;
            case "node_const":
                return Number(node.value) < 0 && prev_op !== "op_execfun" && position !== 0 ? "(" + node.value + ")" : node.value;
            case "node_op":
                switch (String(node.value)) {
                    case "op_none":
                        compiled = "";
                        node.children.forEach(child => {
                            compiled += this.compile(child, "op_none") + "\n";
                        });
                        return compiled.trim();
                    case "op_execfun":
                        if (node.children.length !== 2) return "<execfun?>";
                        return this.compile(node.children[0]) + "(" + node.children[1].map(param => this.compile(param, "op_execfun")).join() + ")";
                    case "op_neg":
                        if (this._get_priority(node) >= this._get_priority(node.children[0])) {
                            compiled = "-(" + this.compile(node.children[0], "op_neg") + ")";
                        } else {
                            compiled = "-" + this.compile(node.children[0], "op_neg");
                        }
                        return compiled;
                    case "op_assign":
                        return this.compile(node.children[0], "op_assign") + " = " + this.compile(node.children[1], "op_assign");
                    case "op_map":
                        return "(" + node.children[0].join() + ") -> " + this.compile(node.children[1], "op_map");
                    case "op_mul":
                    case "op_add":
                    case "op_sub":
                    case "op_div":
                    case "op_mod":
                    case "op_exp":
                        my_priority = this._get_priority(node);
                        return node.children.map((child, i) => {
                            let temp_str, childPriority;
                            temp_str = this.compile(child, node.value, i);
                            childPriority = this._get_priority(child);
                            if ((i === 0 && node.value === "op_exp") ||
                                (i > 0 && (node.value === "op_sub" || node.value === "op_div" || node.value === "op_mod"))
                            ) {
                                return (my_priority >= childPriority) ? "(" + temp_str + ")" : temp_str;
                            } else {
                                return (my_priority > childPriority) ? "(" + temp_str + ")" : temp_str;
                            }
                        }).join(this._get_operator(node.value));
                    default:
                        console.error("unknown op: " + node.value);
                        return "unknown_op";
                }
            default:
                console.error("unknown type: " + node.type);
                return "type";
        }
    },

    /**
     * Simplifies a given ast, by expanding it and collecting the resulting terms afterwards.
     * Numerical expressions will be evaluated too, if possible.
     *
     * @param {*} ast
     * @param {*} variables
     * @param {*} options
     * @returns
     */
    simplify_function_medium: function (ast, variables, options) {
        ast = this.to_work_tree(ast);

        ast = this.collect_tree(ast);
        ast = this.expand_tree(ast);
        ast = this.collect_tree(ast);

        ast = this.basic_transforms_float(ast, options);
        ast = this.factorize_tree(ast);
        ast = this.user_sort(ast, variables);
        ast = this.to_jxg_tree(ast);
        return ast;
    },

    /**
     * Main algorithm
     * @param {*} ast
     * @param {*} variables
     * @param {*} options
     * @returns
     */
    simplify_function_strong: function (ast, variables, options) {
        ast = this.to_work_tree(ast);
        var memory = [],
            ast_string = this.compile(this.sort.apply(this, [ast])),
            contained_var;

        contained_var = this._get_contained_variables(ast);
        while (!memory.includes(ast_string)) {
            options.iterations--;
            if (options.iterations <= 0) break;
            memory.push(ast_string);
            ast = this.collect_tree(ast);
            ast = this.expand_tree(ast);
            ast = this.collect_tree(ast);
            ast = this.execute_on_tree(ast, this.combine_denominator);
            ast = this.execute_on_tree(ast, this.collect_common_denominator);
            ast = this.collect_tree(ast);
            ast = this.execute_on_tree(ast, node => this.cancel_var_node(node, contained_var));
            ast_string = this.compile(this.sort(ast));
        }
        ast = this.basic_transforms_float(ast, options);
        ast = this.split_denominator_tree(ast);
        ast = this.factorize_tree(ast);
        ast = this.user_sort(ast, variables);
        ast = this.to_jxg_tree(ast);
        return ast;
    },

    /**
     * Simplifies a given ast, by executing a single function given with options.steps:
     * Possibilities:
     * - expand
     * - collect
     * - factorize
     * - cancel
     * Numerical expressions will be evaluated too, if possible.
     *
     * @param {*} ast
     * @param {*} variables
     * @param {*} options
     * @returns
     */
    simplify_function_interactive: function (ast, variables, options) {
        var i,
            contained_var = this._get_contained_variables(ast);
        ast = this.to_work_tree(ast);

        for (i = 0; i < options.steps.length; i++) {
            switch (options.steps[i]) {
                case "expand":
                    ast = this.expand_tree(ast);
                    break;
                case "collect":
                    ast = this.collect_tree(ast);
                    ast = this.execute_on_tree(ast, this.collect_common_denominator);
                    break;
                case "factorize":
                    ast = this.split_denominator_tree(ast);
                    ast = this.factorize_tree(ast);
                    break;
                case "cancel":
                    ast = this.execute_on_tree(ast, this.combine_denominator);
                    ast = this.execute_on_tree(ast, node => this.cancel_var_node(node, contained_var));
            }
            console.log(this.compile(ast));
        }

        ast = this.basic_transforms_float(ast, options);
        ast = this.user_sort(ast, variables);
        ast = this.to_jxg_tree(ast);
        return ast;
    },

    cancel_gcd_polynom_one_var: function (ast) {
        var vars;
        if (ast.type === "node_op" && ast.value === "op_mul") {
            vars = this._get_contained_variables(ast);
            if (vars.length === 1) ast = this.cancel_gcd_polynom(ast, vars[0]);
        }
        return ast;
    },

    /**
     * Expands all possible exponents and multiplikations in the entire given sub-tree.
     *
     * @param {*} ast
     * @returns
     */
    expand_tree: function (ast) {
        ast = this.execute_on_tree(ast, this.expand_node);
        ast = this.merge_tree(ast);
        ast = this.basic_transforms_int(ast);
        return ast;
    },

    /**
     * Factorizes all terms, which are part of every summand in a sum.
     * Does so for the entire sub-tree.
     *
     * @param {*} ast
     * @returns
     */
    factorize_tree: function (ast) {
        if (JXG.isString(ast)) {
            return ast;
        }
        else if (JXG.isArray(ast)) {
            ast.forEach((elem, i, arr) => {
                elem = this.factorize_node(elem);
                elem = this.merge_tree(elem);
                arr[i] = this.basic_transforms_int(elem);
            });
            return ast;
        }
        else if (ast === undefined) return undefined;
        else {
            // first we fully factorize the children
            if (ast.children !== undefined) {
                ast.for_each_child((child, i, children) => {
                    children[i] = this.factorize_node(child);
                });
            }
            // then we factorize the node
            ast = this.factorize_node(ast);
            // then we can return the node
            ast = this.merge_tree(ast);
            return this.basic_transforms_int(ast);
        }
    },

    /**
     * Factorizes all terms, which are part of every summand in a sum.
     * Does so only for the given node.
     *
     * @param {*} ast
     * @returns
     */
    factorize_node: function (ast) {
        var i, j, k,
            numerator,
            denominator,
            numerator_arr = [],
            denominator_arr = [],
            numerator_index,
            denominator_index,
            numerator_index_arr = [],
            denominator_index_arr = [],
            gcd_numerator,
            gcd_denominator,
            current_exponent,
            max_exponent,
            index,
            index_arr = [],
            children_copy,
            searched_base,
            node,
            first_child, current_child, sub_child,
            new_ast;

        if (ast.type === "node_op" && ast.value === "op_add") {
            // create mul node to return later
            new_ast = this.create_node("node_op", "op_mul");
            children_copy = [...ast.children];

            // cancel the gdc in every individual child
            children_copy.forEach((child, i, arr) => { arr[i] = this.cancel_gcd(child); });
            // convert the non mul nodes into mul nodes
            children_copy.forEach((child, i, arr) => {
                if (!(child.type === "node_op" && child.value === "op_mul")) {
                    node = this.create_node("node_op", "op_mul");
                    node.push(this.create_node("node_const", 1));
                    node.children.push(arr[i]);
                    arr[i] = node;
                }
            });
            // we use a for loop, so we can break
            for (i = 0; i < children_copy.length; i++) {
                current_child = children_copy[i];
                numerator = undefined;
                denominator = undefined;
                current_child.children.forEach((sub_child, i) => {
                    if (sub_child.type === "node_const" && sub_child.is_int() && sub_child.value !== 1) {
                        //node = children_copy.splice(i, 1)[0];
                        numerator = sub_child.value;
                        numerator_index = i;
                    }
                    // if it is an exp ^(-1) and the base is an integer, we add it to the denominator
                    else if (sub_child.value === "op_exp" && sub_child.type === "node_op") {
                        if (sub_child.children[1].type === "node_const" && sub_child.children[1].value === -1) {
                            if (sub_child.children[0].type === "node_const" && sub_child.children[0].is_int() && sub_child.children[0].value !== 1) {
                                //denominator_arr.push(node.value);
                                denominator = sub_child.children[0].value;
                                denominator_index = i;
                            }
                        }
                    }
                });
                // we test if we can push the int, or set the gcd if we haven't found any
                if (numerator) {
                    numerator_arr.push(numerator);
                    numerator_index_arr.push(numerator_index);
                }
                else gcd_numerator = 1;
                if (denominator) {
                    denominator_arr.push(denominator);
                    denominator_index_arr.push(denominator_index);
                }
                else gcd_denominator = 1;
                // if both are already 1, we can stop

                if (gcd_numerator === 1 && gcd_denominator === 1) break;
            }

            // if a gcd is not 1, we can factorize it
            if (gcd_numerator !== 1) {
                gcd_numerator = this.gcd(...numerator_arr);
                numerator_arr.forEach((number, i) => {
                    //children_copy[i].set(numerator_index_arr[i], this.create_node("node_const", (number/gcd_numerator).));
                    children_copy[i].children[numerator_index_arr[i]] = this.create_node("node_const", number / gcd_numerator);
                });
                new_ast.push(this.create_node("node_const", gcd_numerator));
            }
            if (gcd_denominator !== 1) {
                gcd_denominator = this.gcd(...denominator_arr);
                denominator_arr.forEach((number, i) => {
                    //children_copy[i].set(denominator_index_arr[i], this.create_node("node_const", (number/gcd_denominator)));
                    children_copy[i].children[denominator_index_arr[i]].children[0] = this.create_node("node_const", (number / gcd_denominator));
                });
                node = this.create_node("node_op", "op_exp");
                node.push(this.create_node("node_const", gcd_denominator));
                node.push(this.create_node("node_const", -1));
                new_ast.push(node);
            }

            // we transform every child into an op_exp if it isn't already
            children_copy.forEach((child) => {
                child.for_each_child((sub_child, i, arr) => {
                    if (!((sub_child.type === "node_op" && sub_child.value === "op_exp"))) {
                        node = this.create_node("node_op", "op_exp");
                        node.push(sub_child);
                        node.children.push(this.create_node("node_const", 1));
                        arr[i] = node;
                    }
                });
            });
            // we go through the first child, and check if one of the children is part of every child
            first_child = children_copy[0];
            // iterate over every factor of the first child
            for (i = 0; i < first_child.children.length; i++) {
                // ints can be skipped
                if (first_child.children[i].is_int()) continue;
                searched_base = first_child.children[i].children[0];
                max_exponent = first_child.children[i].children[1];
                // if the exponent is not an int, or the base is 1, we dont need to factorize
                if (!max_exponent.is_int() || (searched_base.value === 1 && searched_base.type === "node_const")) continue;
                max_exponent = max_exponent.value;
                index_arr = [];
                index_arr.push(i);
                // iterate over every child, except the first, to search for said factor
                for (j = 1; j < children_copy.length; j++) {
                    current_child = children_copy[j];
                    index = undefined;
                    // iterate over every child, and for every sub_child we have to compare if they are equal to the factor we are looking for
                    for (k = 0; k < current_child.children.length; k++) {
                        sub_child = current_child.children[k];
                        // check if they have the same base, if the exponent is an integer
                        if (sub_child.children[1].is_int() && this.equals(searched_base, sub_child.children[0])) {
                            index = k;
                            current_exponent = sub_child.children[1].value;
                            if (max_exponent > 0 && current_exponent > 0) max_exponent = Math.min(max_exponent, current_exponent);
                            else if (max_exponent < 0 && current_exponent < 0) max_exponent = Math.max(max_exponent, current_exponent);
                            else {
                                max_exponent = 0;
                                break;
                            }
                        }
                    }
                    if (index === undefined) {
                        max_exponent = 0;
                        break;
                    }
                    else index_arr.push(index);
                }
                // if the max_exponent is 0, we can continue with the next child
                if (max_exponent === 0) continue;
                // else, we push the extracted node to the outer mul node
                node = this.create_node("node_op", "op_exp");
                node.push(first_child.children[i].children[0]);
                node.push(this.create_node("node_const", max_exponent));
                new_ast.push(node);
                // then, we have to extract the same part of every child by substracting the max_exponent from the old exponent
                children_copy.forEach((child, i) => {
                    current_child = child.children[index_arr[i]];
                    current_child.set(1, this.create_node("node_const", current_child.children[1].value - max_exponent));
                });
            }

            // lastly, if we factorized something, we have to return the new_ast
            if (new_ast.children.length > 0) {
                ast.set_children(children_copy);
                new_ast.push(ast);
                //ast = this.cancel_gcd(new_ast);
                ast = new_ast;
            }
        }
        return ast;
    },

    /**
     * Recursively searches the tree for products and collects the exponents of factors that have the same base.
     * Also recursively searches the tree for sums and collects the coefficients that have the same variables and groups them together.
     *
     * Example: x*log(2) + (x^2 * x^3)*5 + 4*(x^3 * x^2)+3*x -> (3 + log(2))*x + 9*x^5
     *
     * @param {*} ast
     */
    collect_tree: function (ast) {
        if (JXG.isString(ast)) {
            return ast;
        }
        else if (JXG.isArray(ast)) {
            ast.forEach((elem, i, arr) => {
                elem = this.collect_tree(elem);
                arr[i] = this.basic_transforms_int(elem);
            });
            return ast;
        }
        else if (ast === undefined) return undefined;
        else {
            // first we fully collect the children
            if (ast.children !== undefined) {
                ast.for_each_child((child, i, children) => {
                    children[i] = this.collect_tree(child);
                });
            }
            // if we have an op_mul, we have to collect the exponents
            if (ast.type === "node_op" && ast.value === "op_mul") {
                ast = this.collect_exp_node(ast);
            }
            // if we have an op_add, we have to collect the coefficients
            if (ast.type === "node_op" && ast.value === "op_add") {
                ast = this.collect_coeff_node(ast);
            }
        }
        // then we can return the node
        return this.basic_transforms_int(ast);
    },

    /**
     * When given an add_node, it collects the numerators of summands that have the same denominator.
     *
     * @param {*} ast
     */
    collect_common_denominator: function (ast) {
        var i, j,
            new_children = [], // where the collected children are being added
            children_copy = [], // where the comparable children are being stored for later use
            denominator, // this is where we store the product, without its coefficients
            numerator, // this is where we store the numerator coefficients
            new_child = []; // mul node for numerator and denominator

        // only do something, if we have a sum
        if (ast.type === "node_op" && ast.value === "op_add") {
            //debugger;
            // for each element in the children, we separate the numerator and denominator values
            //console.log("add_node",ast)
            ast.children.forEach((child) => { children_copy.push(this._collect_common_denominator_prepare(child)); });

            // for each element in the children, search elements with the same denominator
            for (i = children_copy.length - 1; i >= 0; i--) {
                // save the denominator part
                denominator = children_copy[i][1];
                // if there is none, we just skip to the next one
                if (denominator === undefined) {
                    new_children.push(children_copy[i][0]);
                    children_copy.splice(i, 1);
                    continue;
                }
                // creates a sum node for the numerator values
                numerator = this.create_node("node_op", "op_add");
                numerator.push(children_copy[i][0]);

                // mul node for numerator and denominator
                new_child = this.create_node("node_op", "op_mul");
                new_child.push(denominator);

                // remove the current element from the array
                children_copy.splice(i, 1);

                for (j = children_copy.length - 1; j >= 0; j--) {
                    // test if we have the same denominators
                    if (this.equals(denominator, children_copy[j][1])) {
                        // if so, concatenate the numerators and remove the element
                        //console.log("unconcatenated:", numerator.children)
                        //console.log("to be concatenated:", children_copy[j][0])
                        numerator.push(children_copy[j][0]);
                        //console.log("concatenated:", numerator.children)
                        children_copy.splice(j, 1);
                        i--;
                    }
                }
                // if there is only one numerator, we dont need the sum
                if (numerator.children.length === 1) {
                    numerator = numerator.children[0];
                }
                else {
                    numerator = this.merge_tree(numerator);
                    numerator = this.collect_coeff_node(numerator);
                }
                // adds the numerators back to the front of the denominator factors
                new_child.push(numerator);
                // then adds the combined product back to the sum
                new_children.push(new_child);
            }
            // if there is only one node left, we dont need the add anymore
            if (new_children.length === 1) ast = new_children[0];
            // replaces the children with the new children
            else ast.set_children(new_children);

            // normalize the result
            ast = this.basic_transforms_int(ast);
        }

        return ast;
    },

    debug_print: function (ast) {
        console.log("-----debug_print-----");
        console.log(ast);
        console.log(this.compile(ast));
        this.walk(ast);
    },


    /**
     * Logs the the tree on the console, starting with the parameter ast.
     * Elements on the same depth-level have the same indentation.
     * Also prints out which flags the nodes have:
     * c - constant_flag
     * i - integer_flag
     * s - sorted_flag
     *
     * @param {*} ast
     * @param level
     *
     * */
    walk: function (ast, level = 0) {
        var i,
            buffer = "|\t".repeat(level), // creates white space according to the depth level
            child;

        // for debugging, if there is an undefined node
        if (ast === undefined) {
            //console.error(buffer + "undefined");
            console.log(buffer + "not defined");
            return;
        }
        buffer = this._flag_string(ast) + buffer;

        // special case op_map: first child is an array!
        if (ast.type === "node_op" && ast.value === "op_map") {
            console.log(buffer + ast.type + ": " + ast.value + " -> " + ast.children[0].join(", "));
            this.walk(ast.children[1], level + 1);
        }
        // special case op_execfun: second child is an array!
        else if (ast.type === "node_op" && ast.value === "op_execfun") {
            console.log(buffer + ast.type + ": " + ast.value);
            this.walk(ast.children[0], level + 1);

            for (i = 0; i < ast.children[1].length; i++) {
                child = ast.children[1][i];
                this.walk(child, level + 1);
            }
            return;
        }
        // default: just print type and value, and continue with the children
        else {
            console.log(buffer + ast.type + ": " + ast.value);

            for (i = 0; i < ast.children.length; i++) {
                child = ast.children[i];
                this.walk(child, level + 1);
            }
        }
    },

    /**
     * Takes an AST and generates a working_tree, which is used to perform simplification operations.
     * The function replaces some operator nodes with equivalent structures.
     * a - b -> a + (-1) * b
     * a / b -> a * b^(-1)
     * -a -> (-1) * a
     * Some exec_fun nodes will also be converted into equivalent op_nodes
     *
     * It also merges op_add nodes, which are stacked directly on top of each other, into a single node.
     * Does the same thing for op_mul nodes.
     *
     * @param {*} ast
     */
    to_work_tree: function (ast) {
        var deep_copy = this.deep_copy(ast);

        // remove unwanted operations
        ast = this.remove_op(deep_copy);
        // simplify the tree structure by not making it binary anymore
        ast = this.merge_tree(ast);
        return this.remove_execfun_tree(ast);
    },

    /**
     * Takes a work tree, and generates an equivalent JessieCode tree.
     * Negation, substraction and also division are added back where they are useful.
     *
     * @param {} ast
     * @returns
     */
    to_jxg_tree: function (ast) {
        var jc;
        ast = this.restore_op(ast);
        // makes the tree binary
        ast = this.unmerge_tree(ast);
        // generates jc tree
        jc = new JXG.JessieCode();
        ast = this._generate_jxg_tree(ast, jc);
        //this.debug_print(ast)
        //console.log(jc.compile(ast))
        return ast;
    },

    /**
     * Creates a work_tree node with the given type and value.
     *
     * Also sets some flags for the new node:
     * const_flag: whether the node is a node_const, or PI/EULER or if an op_node has only constant children
     * integer_flag: whether the node is a node_const with integer value
     * sorted: whether the subtree under the node is sorted
     *
     * By using the node methods instead of accessing the node.children directly it is ensured that those flags stay intact.
     *
     * @param {*} type
     * @param {*} value
     * @returns
     */
    create_node: function (type, value) {
        var that = this;
        return {
            type: type,
            value: value,
            children: [],
            parent: undefined,
            const_flag: type !== "node_var",
            int_flag: type === "node_const" && this.is_integer(value),
            sorted: type === "node_const" || type === "node_var",

            push: function (...nodes) {
                /**
                this.children.push(...nodes);
                this.sync_flags(this);//sync_flags(this, changed_nodes)
                */
                nodes.forEach((child) => { this.set(this.children.length, child); });
            },

            set: function (index, child) {
                this.children[index] = child;
                that.sync_flags(this, false, child);
            },

            set_children: function (children) {
                this.children = children;
                that.sync_flags(this, false, ...this.children);
            },

            for_each_child: function (func) {
                this.children.forEach((child, i, children) => {
                    func(child, i, children);
                });
                that.sync_flags(this, false, ...this.children);
            },

            /**
             * Removes deleteCount children from this node at the passed start index.
             * Inserts the passed items or nothing if no item was passed
             *
             * @param {} start
             * @param {} deleteCount
             * @param {any[]} items
             */
            splice: function (start, deleteCount = 1, ...items) {
                if (items === undefined) {
                    this.children.splice(start, deleteCount);
                } else {
                    this.children.splice(start, deleteCount, ...items);
                }
                that.sync_flags(this, false, ...this.children);
            },

            is_const: function () { return this.const_flag; },

            is_int: function () { return this.int_flag; },

            is_sorted: function () { return this.sorted_flag; }

        };
    },

    /**
     * Creates a copy of your ast.
     *
     * @param {*} ast
     * @returns
     */
    deep_copy: function (ast) {
        var node, copy, i;

        if (ast.type !== undefined) {
            node = this.create_node(ast.type, ast.value);
            if (ast.children !== undefined) {
                node.children = [];
                for (i = 0; i < ast.children.length; i++) {
                    node.push(this.deep_copy(ast.children[i]));
                }
            }
            return node;
        }

        if (Array.isArray(ast)) {
            copy = [];
            for (i = 0; i < ast.length; i++) {
                copy.push(this.deep_copy(ast[i]));
            }
            return copy;
        }

        if (typeof ast === 'string') {
            return String(ast);
        }
    },

    /**
     * Merges all sequences of op_add and op_mul into one single node.
     * Be aware that this function also changes the passed AST and will cause errors
     * when executed on the jsx-AST because the changed tree might not have a binary structure anymore.
     * The first node of your AST might also be changed, so make sure you reassign the first node to the
     * returned value.
     *
     * @param {*} ast - first node of your AST
     * @returns first node of the changed AST
     */
    merge_tree: function (ast) {
        var node;

        if (JXG.isString(ast)) {
            return ast;
        } else if (JXG.isArray(ast)) {
            ast.forEach((elem, i, arr) => {
                arr[i] = this.merge_tree(elem);
            });
            return ast;
        } else if (ast.type === "node_op" && ast.value === "op_exp") {
            node = this._merge_exp_aux(ast);
            //node.children[1] = this.merge_node(node.children[1]);
            node.set(1, this.merge_node(node.children[1]));
            node.for_each_child((child, i, arr) => {
                arr[i] = this.merge_tree(child);
            });
            return node;
        } else if (ast.type === "node_op" && (ast.value === "op_mul" || ast.value === "op_add")) {
            node = this.create_node("node_op", ast.value);
            this._merge_add_aux(ast, node);
            node.for_each_child((child, i, arr) => {
                arr[i] = this.merge_tree(child);
            });
            return node;
        } else {
            if (ast.children !== undefined) {
                ast.for_each_child((child, i, arr) => {
                    arr[i] = this.merge_tree(child);
                });
            }
            return ast;
        }
    },

    /**
     * Uses recursion to compute each trivial (integer) constant in an AST
     * Returns new AST with summarized constants
     * Example: (2 + x + 5) -> (x + 7)
     * The function explicity changes x^y(if the entire expression is an integer or trivial simplifications are possible),
     * Sums and multiplications (if they include summarizable integers) and trivial logarithms
     * The function also gets rid of ^1 and handles x^0(0^0 = 0) and *0 as well as + 0 and *1
     * Quirks: The constants get moved to the right of the tree and it is possible to loose operations for example 1-1 -> 0 (loss of subtraction op)
     * @param {*} ast
     */
    basic_transforms_int: function (ast) {
        var i,
            new_args,
            current_product, current_sum;

        switch (ast.value) {
            case "op_none": {
                //Recursively go through the tree
                for (i = 0; i < ast.children.length; i++) {
                    ast.set(i, this.basic_transforms_int(ast.children[i]));
                }
                break;
            }
            case "op_execfun": {
                //Simplify the arguments of the operation
                new_args = [];
                for (i = 0; i < ast.children[1].length; i++) {
                    new_args.push(this.basic_transforms_int(ast.children[1][i]));
                }
                ast.set(1, new_args);

                //log_b(1) = 0
                if (ast.children[0].value === "log" || ast.children[0].value === "ln") {
                    if (ast.children[1][0].value === 1) return this.create_node("node_const", 0);
                }
                //log(e) = 1 && ln(e) = 1 && log_b(b) = 1
                if (((ast.children[0].value === "ln" || (ast.children[0].value === "log" && ast.children[1].length === 1)) && ast.children[1][0].value === "EULER") || (ast.children[0].value === "log" && ast.children[1].length > 1 && this.equals(ast.children[1][0], ast.children[1][1]))) return this.create_node("node_const", 1);
                break;
            }
            case "op_assign": {
                //Only simplify the right child of the assign op
                ast.set(1, this.basic_transforms_int(ast.children[1]));
                break;
            }
            case "op_map": {
                //Only simplify the right child of the map op
                ast.set(1, this.basic_transforms_int(ast.children[1]));
                break;
            }
            case "op_add": {
                //Recursively simplify the summands before operating on the parent node
                for (i = 0; i < ast.children.length; i++) {
                    ast.set(i, this.basic_transforms_int(ast.children[i]));
                }

                //Here the simple new children get summarized according to the operation node, which we are currently inspecting
                current_sum = 0; //Stores the current sum, of the natural children of the add node, to push their total value in one node
                for (i = 0; i < ast.children.length; i++) {
                    if (this.is_integer(ast.children[i].value)) {
                        current_sum += Number(ast.children[i].value);
                        ast.splice(i, 1);
                        i--;
                    }
                }
                if (current_sum !== 0 || ast.children.length === 0) ast.push(this.create_node("node_const", current_sum)); //+0 does not have to be pushed into a sum
                if (ast.children.length === 1) return ast.children[0]; //only one child -> just return it without the parent op
                break;
            }
            case "op_mul": {
                //Recursively simplify the factors before operating on the parent node
                for (i = 0; i < ast.children.length; i++) {
                    ast.set(i, this.basic_transforms_int(ast.children[i]));
                }
                //Simplify Divisions:
                ast = this.cancel_gcd(ast);
                if (ast.value !== "op_mul") return this.basic_transforms_int(ast); //if we are no longer in the mul case, then we should reevaluate the following operations

                //Here the simple new children get summarized according to the operation node, which we are currently inspecting
                current_product = 1; //Stores the current product, of the integer children of the add node, to push their total value into one node
                for (i = 0; i < ast.children.length; i++) {
                    if (this.is_integer(ast.children[i].value)) {
                        current_product *= Number(ast.children[i].value);
                        ast.children.splice(i, 1);
                        i--;
                    }
                }
                if (current_product === 0) return this.create_node("node_const", 0); //if there is a 0 in the multiplication the entire product is 0
                if (current_product !== 1 || ast.children.length === 0) ast.push(this.create_node("node_const", current_product)); //*1 does not have to be pushed into a multiplication
                if (ast.children.length === 1) return ast.children[0]; //only one child -> just return it without the parent operation
                break;
            }
            case "op_exp": {
                ast.set(0, this.basic_transforms_int(ast.children[0]));
                ast.set(1, this.basic_transforms_int(ast.children[1]));
                if (ast.children[1].value === 1) return ast.children[0]; //^1 gets canceled
                if (ast.children[1].value === 0) return this.create_node("node_const", 1);  //x^0 = 1
                if (ast.children[0].value === -1 && ast.children[1].value === -1) return this.create_node("node_const", -1); //-1^-1 = -1
                //Only compute if it's an integer in its entirety
                if (this.is_integer(ast.children[0].value) && this.is_integer(ast.children[1].value) && ast.children[1].value >= 0) {
                    return this.create_node("node_const", Number(ast.children[0].value) ** Number(ast.children[1].value));
                }
                break;
            }
            default:
                break;
        }
        return ast;
    },

    /**
     * Uses recursion to compute each trivial (float) constant in an AST
     * Returns new AST with summarized constants
     * Options:
     * - form:
     *          "fractions" -> does not convert fractions to decimals;
     *          "decimals" -> does convert fractions to decimals;
     *
     * Example: (2.5 + x + 3.2) -> (x + 5.7)
     * The function explicity changes x^y(if x is a float and (y is a natural number or the option "decimals" is chosen) or trivial simplifications are possible),
     * Sums and multiplications (if they include summarizable floats) and trivial logarithms
     * The function also gets rid of ^1 and handles x^0(0^0 = 0), -1^-1 and *0 as well as + 0 and *1
     * Quirks: The constants get moved to the right of the tree and it is possible to loose operations for example 1-1 -> 0 (loss of subtraction op)
     * @param {*} ast
     */
    basic_transforms_float: function (ast, options = {}) {
        var i,
            new_args,
            current_product, current_sum;

        switch (ast.value) {
            case "op_none": {
                //recursively go through the tree
                for (i = 0; i < ast.children.length; i++) {
                    ast.set(i, this.basic_transforms_float(ast.children[i], options));
                }
                break;
            }
            case "op_execfun": {
                //simplify the arguments of the operation
                new_args = [];
                for (i = 0; i < ast.children[1].length; i++) {
                    new_args.push(this.basic_transforms_float(ast.children[1][i], options));
                }
                ast.set(1, new_args);
                //log_b(1) = 0
                if (ast.children[0].value === "log" || ast.children[0].value === "ln") {
                    if (ast.children[1][0].value === 1) return this.create_node("node_const", 0);
                }
                //log(e) = 1 && ln(e) = 1 && log_b(b) = 1
                if (((ast.children[0].value === "ln" || (ast.children[0].value === "log" && ast.children[1].length === 1)) && ast.children[1][0].value === "EULER") || (ast.children[0].value === "log" && ast.children[1].length > 1 && this.equals(ast.children[1][0], ast.children[1][1]))) return this.create_node("node_const", 1);
                break;
            }
            case "op_assign": {
                //only simplify the right child of the assign op
                ast.set(1, this.basic_transforms_float(ast.children[1], options));
                break;
            }
            case "op_map": {
                //only simplify the right child of the map op
                ast.set(1, this.basic_transforms_float(ast.children[1], options));
                break;
            }
            case "op_add": {
                for (i = 0; i < ast.children.length; i++) {
                    ast.set(i, this.basic_transforms_float(ast.children[i], options));
                }

                //here the simple new children get summarized according to the operation node, which we are currently inspecting
                current_sum = 0; //Stores the current sum, of the natural children of the add node, to push their total value in one node
                for (i = 0; i < ast.children.length; i++) {
                    if (this.is_float(ast.children[i].value)) {
                        current_sum += Number(ast.children[i].value);
                        ast.children.splice(i, 1);
                        i--;
                    }
                }
                if (current_sum !== 0 || ast.children.length === 0) ast.push(this.create_node("node_const", current_sum)); //+0 does not have to be pushed into a sum
                if (ast.children.length === 1) return ast.children[0]; //only one child -> just return it without the operation
                break;
            }
            case "op_mul": {
                //recursively simplify the factors before operating on the parent node
                for (i = 0; i < ast.children.length; i++) {
                    ast.set(i, this.basic_transforms_float(ast.children[i], options));
                }
                //simplify Divisions:
                ast = this.cancel_gcd(ast);
                if (ast.value !== "op_mul") return this.basic_transforms_float(ast, options); //if we are no longer in the mul case, then we should reevaluate the following operations

                //here the simple new children get summarized according to the operation node, which we are currently inspecting
                current_product = 1; //Stores the current sum, of the natural children of the add node, to push their total value in one node
                for (i = 0; i < ast.children.length; i++) {
                    if (this.is_float(ast.children[i].value)) {
                        current_product *= Number(ast.children[i].value);
                        ast.children.splice(i, 1);
                        i--;
                    }
                }
                if (current_product === 0) return this.create_node("node_const", 0); //if there is a 0 in the multiplication the entire product is 0
                if (current_product !== 1 || ast.children.length === 0) ast.push(this.create_node("node_const", current_product)); //*1 does not have to be pushed into a multiplication
                if (ast.children.length === 1) return ast.children[0]; //only one child -> just return it without the operation
                break;
            }
            case "op_exp": {
                ast.set(0, this.basic_transforms_float(ast.children[0], options));
                ast.set(1, this.basic_transforms_float(ast.children[1], options));
                if (ast.children[1].value === 1) return ast.children[0]; //^1 gets canceled
                if (ast.children[1].value === 0) return this.create_node("node_const", 1);  //x^0 = 1
                if (ast.children[0].value === -1 && ast.children[1].value === -1) return this.create_node("node_const", -1); //-1^-1 = -1
                //Only compute if the base is a float and (the exponent is natural or the chosen form is "decimals")
                if (this.is_float(ast.children[0].value) && this.is_integer(ast.children[1].value) && (ast.children[1].value > 0 || options.form === "decimals")) {
                    return this.create_node("node_const", Number(ast.children[0].value) ** Number(ast.children[1].value));
                }
                break;
            }
            default:
                break;
        }
        return ast;
    },

    /**
     * Removes all removable execfuns in the given tree, while also simplifying via basic_transforms
     * basic_transforms_int:
     * Uses recursion to compute each trivial (integer) constant in an AST
     * Returns new AST with summarized constants
     * Example: (2 + x + 5) -> (x + 7)
     * The function explicity changes x^y(if the entire expression is an integer or trivial simplifications are possible),
     * Sums and multiplications (if they include summarizable integers) and trivial logarithms
     * The function also gets rid of ^1 and handles x^0(0^0 = 0) and *0 as well as + 0 and *1
     * Quirks: The constants get moved to the right of the tree and it is possible to loose operations for example 1-1 -> 0 (loss of subtraction op)
     * @param {*} ast
     */
    remove_execfun_tree: function (ast) {
        var i,
            new_args,
            current_product, current_sum;

        switch (ast.value) {
            case "op_none": {
                //Recursively go through the tree
                for (i = 0; i < ast.children.length; i++) {
                    ast.set(i, this.remove_execfun_tree(ast.children[i]));
                }
                break;
            }
            case "op_execfun": {
                //Simplify the arguments of the operation
                new_args = [];
                for (i = 0; i < ast.children[1].length; i++) {
                    new_args.push(this.remove_execfun_tree(ast.children[1][i]));
                }
                ast.set(1, new_args);

                //log_b(1) = 0
                if (ast.children[0].value === "log" || ast.children[0].value === "ln") {
                    if (ast.children[1][0].value === 1) return this.create_node("node_const", 0);
                }
                //log(e) = 1 && ln(e) = 1 && log_b(b) = 1
                if (((ast.children[0].value === "ln" || (ast.children[0].value === "log" && ast.children[1].length === 1)) && ast.children[1][0].value === "EULER") || (ast.children[0].value === "log" && ast.children[1].length > 1 && this.equals(ast.children[1][0], ast.children[1][1]))) return this.create_node("node_const", 1);

                ast = this.remove_execfun(ast); //Here most of the execfuns get deleted

                break;
            }
            case "op_assign": {
                //Only simplify the right child of the assign op
                ast.set(1, this.remove_execfun_tree(ast.children[1]));
                break;
            }
            case "op_map": {
                //Only simplify the right child of the map op
                ast.set(1, this.remove_execfun_tree(ast.children[1]));
                break;
            }
            case "op_add": {
                //Recursively simplify the summands before operating on the parent node
                for (i = 0; i < ast.children.length; i++) {
                    ast.set(i, this.remove_execfun_tree(ast.children[i]));
                }

                //Here the simple new children get summarized according to the operation node, which we are currently inspecting
                current_sum = 0; //Stores the current sum, of the natural children of the add node, to push their total value in one node
                for (i = 0; i < ast.children.length; i++) {
                    if (this.is_integer(ast.children[i].value)) {
                        current_sum += Number(ast.children[i].value);
                        ast.splice(i, 1);
                        i--;
                    }
                }
                if (current_sum !== 0 || ast.children.length === 0) ast.push(this.create_node("node_const", current_sum)); //+0 does not have to be pushed into a sum
                if (ast.children.length === 1) return ast.children[0]; //only one child -> just return it without the parent op
                break;
            }
            case "op_mul": {
                //Recursively simplify the factors before operating on the parent node
                for (i = 0; i < ast.children.length; i++) {
                    ast.set(i, this.remove_execfun_tree(ast.children[i]));
                }
                //Simplify Divisions:
                ast = this.cancel_gcd(ast);
                if (ast.value !== "op_mul") return this.remove_execfun_tree(ast); //if we are no longer in the mul case, then we should reevaluate the following operations

                //Here the simple new children get summarized according to the operation node, which we are currently inspecting
                current_product = 1; //Stores the current product, of the integer children of the add node, to push their total value into one node
                for (i = 0; i < ast.children.length; i++) {
                    if (this.is_integer(ast.children[i].value)) {
                        current_product *= Number(ast.children[i].value);
                        ast.children.splice(i, 1);
                        i--;
                    }
                }
                if (current_product === 0) return this.create_node("node_const", 0); //if there is a 0 in the multiplication the entire product is 0
                if (current_product !== 1 || ast.children.length === 0) ast.push(this.create_node("node_const", current_product)); //*1 does not have to be pushed into a multiplication
                if (ast.children.length === 1) return ast.children[0]; //only one child -> just return it without the parent operation
                break;
            }
            case "op_exp": {
                ast.set(0, this.remove_execfun_tree(ast.children[0]));
                ast.set(1, this.remove_execfun_tree(ast.children[1]));
                if (ast.children[1].value === 1) return ast.children[0]; //^1 gets canceled
                if (ast.children[1].value === 0) return this.create_node("node_const", 1);  //x^0 = 1
                if (ast.children[0].value === -1 && ast.children[1].value === -1) return this.create_node("node_const", -1); //-1^-1 = -1
                //Only compute if it's an integer in its entirety
                if (this.is_integer(ast.children[0].value) && this.is_integer(ast.children[1].value) && ast.children[1].value >= 0) {
                    return this.create_node("node_const", Number(ast.children[0].value) ** Number(ast.children[1].value));
                }
                break;
            }
            default:
                break;
        }
        return ast;
    },
    /**
     * Gets called on execfun with log as the function(var)
     * Functons:
     * * log_b(x*y) = log_b(x) + log_b(y) / ln(x*y) = ln(x) + ln(y)
     * * log_b(x^y) = y * log_b(x)
     * Quirk: ln gets converted to log
     * @param {*} ast
     */
    expand_log_node: function (ast) {
        var expanded = ast,
            i,
            execfun,
            log_arg = [];

        //switch case with respect to the first argument of the log
        switch (ast.children[1][0].value) {
            case "op_mul": {
                expanded = this.create_node("node_op", "op_add"); //creates the sum, to which each new log gets appended
                //create the summand log for each factor in the multiplication in a for loop
                for (i = 0; i < ast.children[1][0].children.length; i++) {
                    execfun = this.create_node("node_op", "op_execfun");
                    log_arg.push(ast.children[1][0].children[i]);
                    if (ast.children[0].value === "log" && ast.children[1].length > 1) log_arg.push(this.deep_copy(ast.children[1][1])); //non trivial base (deepcopy, because every new log gets it)
                    execfun.push(this.create_node("node_var", "log"));
                    execfun.push(log_arg);
                    expanded.push(execfun);
                }
                break;
            }
            case "op_exp": {
                execfun = this.create_node("node_op", "op_execfun");
                expanded = this.create_node("node_op", "op_mul"); //the overarching node is now a multiplication
                expanded.push(ast.children[1][0].children[1]); //Exponent outside of bracket
                expanded.push(execfun);
                execfun.push(this.create_node("node_var", "log"));
                execfun.push(log_arg);
                log_arg.push(ast.children[1][0].children[0]);
                if (ast.children[0].value === "log" && ast.children[1].length > 1) log_arg.push(ast.children[1][1]);
                break;
            }
        }
        return expanded;
    },

    /**
     * Expands a multiplication of sums by adding all combination of summands from different sums
     * as a product to a new sum
     * numerators and denominators (op_exp nodes with a negative exponent) will be expanded separately.
     *
     * Example: (x+1)\*(x+a+b)\*a\*(a+1)^-1\*(b+1)^-1 -> (a\*x^2+a\*x+a^2\*x+a^2+a\*b\*x+a\*b)\*(a\*b+a+b+1)^-1
     * @param {*} ast
     * @returns
     */
    expand_node: function (ast) {
        if (ast.type !== "node_op") {
            return ast;
        }
        var that = this,
            numer_children = [],
            denom_children = [],
            numerator, denominator, fraction, denominator_exp;

        // Separate numerator and denominator factors
        if (ast.value === "op_mul") {
            ast.children.forEach(factor => {
                if (factor.type === "node_op" && factor.value === "op_exp"
                    && factor.children[1].type === "node_const"
                    && that.is_integer(factor.children[1].value)
                    && Number(factor.children[1].value) < 0
                ) {
                    factor.children[1].value = -factor.children[1].value;
                    denom_children.push(factor);
                } else {
                    numer_children.push(factor);
                }
            });
        } else if (ast.value === "op_exp") {
            if (ast.type === "node_op" && ast.value === "op_exp"
                && ast.children[1].type === "node_const"
                && that.is_integer(ast.children[1].value)
                && Number(ast.children[1].value) < 0
            ) {
                ast.children[1].value = -ast.children[1].value;
                denom_children.push(ast);
            } else {
                numer_children.push(ast);
            }
        } else {
            return ast;
        }

        //Expand numerator and denominator separately
        if (numer_children.length === 0) {
            numerator = this.create_node("node_const", 1);
        } else if (numer_children.length === 1) {
            numerator = numer_children[0];
        } else {
            numerator = this.create_node("node_op", "op_mul");
            numerator.set_children(numer_children);
        }
        numerator = this._expand_product(numerator);
        if (denom_children.length === 0) {
            //No denominator
            return this.basic_transforms_int(numerator);
        } else if (numer_children.length === 1) {
            denominator = denom_children[0];
        } else {
            denominator = this.create_node("node_op", "op_mul");
            denominator.set_children(denom_children);
        }
        denominator = this._expand_product(denominator);
        denominator_exp = this.create_node("node_op", "op_exp");
        denominator_exp.push(denominator, this.create_node("node_const", -1));

        //expand (a*b)^-1 to a^-1*b^-1 (needed for collecting/cancelling)
        if (denominator.type === "node_op" && denominator.value === "op_mul") {
            denominator_exp = this._expand_exp_mul(denominator_exp);
        }

        //Combine numerator and denominator to one fraction
        fraction = this.create_node("node_op", "op_mul");
        fraction.push(numerator, denominator_exp);

        return this.basic_transforms_int(fraction);
    },

    /**
     * Sorts all children of every op_mul and op_add node
     * The returned node is the exact same node that was passed
     *
     * @param {*} ast
     * @returns the passed ast itself
     */
    sort: function (ast) {
        var i;
        if (ast.sorted) {
            return ast;
        }
        ast.sorted = true;
        if (ast.type !== "node_op") return ast;

        if (ast.value === "op_map") {
            this.sort(ast.children[1]);
        } else if (ast.value === "op_execfun") {
            // ast.children[1].forEach(this.sort);
            for (i = 0; i < ast.children[1].length; i++) {
                this.sort(ast.children[1][i]);
            }
        } else {
            for (i in ast.children) {
                // ast.children.forEach(this.sort);
                if (ast.children.hasOwnProperty(i)) {
                    this.sort(ast.children[i]);
                }
            }
        }

        if (ast.value === "op_add" || ast.value === "op_mul") {
            ast.children.sort.apply(this, [this._op_compare]);
        }
        return ast;
    },

    /**
     * Sorts the children of any op_mul and op_add node of this ast using by
     * comparing each summand/factor by degree, variables, parameters and value
     * example:   'x+x^3\*3+x^3\*a+4' -> 'a\*x^3+3*x^3+x+4'
     *
     * @param {*} ast
     * @param {*} var_names
     * @returns
     */
    user_sort: function (ast, var_names = undefined) {
        if (ast.type !== "node_op") return ast;


        if (ast.value === "op_map") {
            this.user_sort(ast.children[1], var_names);
        } else if (ast.value === "op_execfun") {
            ast.children[1].forEach(child => this.user_sort(child, var_names));
        } else {
            ast.children.forEach(child => this.user_sort(child, var_names));
        }

        if (ast.value === "op_add") {
            ast.children.sort((a, b) => this._compare_summand(a, b, var_names));
        }
        if (ast.value === "op_mul") {
            ast.children.sort((a, b) => this._compare_factor(a, b, var_names));
        }
        return ast;
    },

    /**
     * Iterate over all variables contained in the ast
     * will try cancel_gcd_polynom with each variable until success
     * @param {*} ast
     * @returns
     */
    cancel_var_node: function (ast, variable_names = undefined) {
        var old, var_name;
        if (ast.children.length !== 2 || ast.type !== "node_op" || ast.value !== "op_mul") return ast;
        if (ast.children[0].type === "node_op" && ast.children[0].value === "op_exp") {
            ast.children.reverse();
        }
        variable_names = variable_names || this._get_contained_variables(ast);
        for (var_name of variable_names) {
            old = ast;
            ast = this.cancel_gcd_polynom(ast, var_name);
            if (old !== ast) break;
        }
        return ast;
    },

    /**
     * Cancels the greatest common polynomial divisor in the passed ast.
     * The structure of the ast needs to be
     * op_mul
     * ---[dividend-ast]
     * ---op_exp
     * ------[divisor-ast]
     * ------node_const with value = -1
     * @param {*} ast
     * @param {*} var_name
     * @returns the passed ast
     */
    cancel_gcd_polynom: function (ast, var_name = "x", options = {}) {
        var dividend, divisor, polynomial_a, polynomial_b,
            temp, first_factor,
            simplify_func = options.simplify || function (sub_ast) {
                sub_ast = this.collect_tree(sub_ast);
                sub_ast = this.expand_tree(sub_ast);
                sub_ast = this.collect_tree(sub_ast);
                sub_ast = this.simplify_trivial(sub_ast);
                sub_ast = this.basic_transforms_int(sub_ast);
                return sub_ast;
            };
        if (ast.children.length !== 2 || ast.type !== "node_op" || ast.value !== "op_mul") return ast;
        if (ast.children[0].type === "node_op" && ast.children[0].value === "op_exp") {
            ast.children.reverse();
        }
        if (ast.children[1].type !== "node_op" || ast.children[1].value !== "op_exp"
            || ast.children[1].children[1].type !== "node_const" || Number(ast.children[1].children[1].value) !== -1)
            return ast;

        dividend = this._make_mononom_array(ast.children[0], var_name);
        divisor = this._make_mononom_array(ast.children[1].children[0], var_name);

        if (dividend[0] !== undefined || divisor[0] !== undefined) return ast;

        dividend.shift();
        divisor.shift();

        polynomial_a = this._copy_mononom_array(dividend);
        polynomial_b = this._copy_mononom_array(divisor);

        polynomial_a = polynomial_a.filter(mononom => !this._is_zero(mononom.const_factor));
        polynomial_b = polynomial_b.filter(mononom => !this._is_zero(mononom.const_factor));

        while (polynomial_a.length !== 0) {
            if (polynomial_a[0].degree < polynomial_b[0].degree) {
                temp = polynomial_a;
                polynomial_a = polynomial_b;
                polynomial_b = temp;
            }
            this._polynomial_division_on_arrays(polynomial_a, polynomial_b, var_name);
            polynomial_a.forEach((mononom, i, array) => array[i].const_factor = simplify_func(mononom.const_factor));
            polynomial_a = polynomial_a.filter(mononom => !this._is_zero(mononom.const_factor));
        }
        if (polynomial_b[0].degree === 0) {
            return ast;
        }

        first_factor = polynomial_b[0].const_factor;
        polynomial_b.forEach(mononom => {
            let new_const_fac = this.create_node("node_op", "op_mul");
            new_const_fac.push(mononom.const_factor, this.create_node("node_op", "op_exp"));
            new_const_fac.children[1].push(first_factor, this.create_node("node_const", -1));
            mononom.const_factor = simplify_func(new_const_fac);
        });
        dividend = this._polynomial_division_on_arrays(dividend, polynomial_b);
        divisor = this._polynomial_division_on_arrays(divisor, polynomial_b);

        dividend.forEach(mononom => mononom.const_factor = simplify_func(mononom.const_factor));
        divisor.forEach(mononom => mononom.const_factor = simplify_func(mononom.const_factor));

        ast.set(0, this._make_polynom_ast(dividend, var_name));
        ast.children[1].set(0, this._make_polynom_ast(divisor, var_name));
        ast = this.basic_transforms_int(this.simplify_trivial(ast));
        return ast;
    },

    /**
     * This function works itsself through to the functions of the AST, if there are any inside, to then calll the apropriate fucntions according to the options
     * If there are functions, the arguments of it are given to the appropriate functions(if they specifically handle them), so that they know which are the main variables
     * The function notices the lack of functions, if it finds a node, which would be inside a function, before finding actual function definition nodes
     * @param {*} ast
     * @param {*} options
     * @returns
     */
    _simplify_aux: function (ast, options) {
        var i;

        //Go through the tree and handle the nodes accordingly
        switch (ast.value) {
            case "op_none":
                for (i = 0; i < ast.children.length; i++) {
                    ast.children[i] = this._simplify_aux(ast.children[i], options);
                }
                return ast;
            case "op_assign":
                ast.children[1] = this._simplify_aux(ast.children[1], options);
                return ast;
            case "op_map":
                //If map gets found, the function, which we want so simplify, is the right child of the current node
                //Here we want to start the simlification, with respect to the chosen options of the user
                switch (options.method) {
                    case "strong":
                        ast.children[1] = this.simplify_function_strong(ast.children[1], ast.children[0], options);
                        break;
                    case "medium":
                        ast.children[1] = this.simplify_function_medium(ast.children[1], ast.children[0], options);
                        break;
                    case "weak":
                        ast.children[1] = this.to_work_tree(ast.children[1]);
                        ast.children[1] = this.basic_transforms_float(ast.children[1], options);
                        ast.children[1] = this.to_jxg_tree(ast.children[1]);
                        break;
                    case "interactive":
                        ast.children[1] = this.simplify_function_interactive(ast.children[1], ast.children[0], options);
                        break;
                }
                return ast;
            default:
                switch (options.method) {
                    //Here we have the case, that there is an expression woithout a surounding function defintion
                    //We now have to simplify the esxpression without having expecially significant variables
                    //Here we want to start the simlification, with respect to the chosen options of the user
                    case "strong":
                        ast = this.simplify_function_strong(ast, [], options);
                        break;
                    case "medium":
                        ast = this.simplify_function_medium(ast, [], options);
                        break;
                    case "weak":
                        ast = this.to_work_tree(ast);
                        ast = this.basic_transforms_float(ast, options);
                        ast = this.to_jxg_tree(ast);
                        break;
                    case "interactive":
                        ast = this.simplify_function_interactive(ast, [], options);
                        break;
                }
                return ast;
        }
    },

    /**
     * Tests if the ast has a constant value.
     * Requires set_constant_flags to be ran beforehand.
     *
     * @param {*} ast
     */
    is_constant: function (ast) {
        if (ast === undefined) return false;

        return ast.const_flag;
    },

    /**
     * Tests if the ast is an op_neg, or if it is a division it tests whether the numerator is a negation.
     *
     * @param {*} node
     * @returns
     */
    is_negative: function (node) {
        return (node.type === "node_op" && (node.value === "op_neg"
            || node.value === "op_div" && this.is_negative(node.children[0])));
    },

    /**
     * This function tests, wether the given argument is a JXG tree
     * @param {*} ast
     * @returns
     */
    is_ast: function (ast) {
        var jc = new JXG.JessieCode(); //Creates a JessieCode object, to create a tree for comparison
        return typeof ast === typeof jc.getAST("42;"); //Tests wheter the type of the ast, is the same as the type of the comparsion tree
    },

    /**
     * Checks if the input is an integer
     * @param {*} num
     * @returns
     */
    is_integer: function (num) {
        return Number.parseInt(num) === num;
    },

    /**
     * Checks if a number is natural
     * @param {*} num
     * @returns
     */
    is_natural: function (num) {
        var number = Number.parseInt(num);
        return number === num && number >= 0;
    },

    /**
     * Checks if the input is an float
     * @param {*} num
     * @returns
     */
    is_float: function (number) {
        return Number.parseFloat(number) === number;
    },

    /**
     * Executes the given func recursively on the entire ast, depth first.
     *
     * @param {*} ast
     * @param {*} func
     * @returns
     */
    execute_on_tree: function (ast, func) {
        if (JXG.isString(ast)) {
            return ast;
        } else if (JXG.isArray(ast)) {
            ast.forEach((child, i, arr) => {
                arr[i] = this.execute_on_tree(child, func);
            });
            return ast;
        } else if (ast === undefined) {
            return undefined;
        } else {
            if (ast.children !== undefined) {
                ast.children.forEach((child, i) => {
                    ast.set(i, this.execute_on_tree(child, func));
                });
            }
            ast = func.apply(this, [ast]);
        }
        return ast;

    },
    /**
     * Searches the ast for multplications with a denominator which has the form (term)^-1 and expands the denominator node.
     *
     * @param {*} ast
     * @returns
     */
    split_denominator_tree: function (ast) {
        ast = this.execute_on_tree(ast, this.split_denominator_node);
        ast = this.merge_tree(ast);
        ast = this.basic_transforms_int(ast);
        ast = this.collect_tree(ast);
        return ast;
    },
    /**
     * If the ast is a denominator with the form (term)^-1 and expands the denominator node.
     *
     * @param {} ast
     * @returns
     */
    split_denominator_node: function (ast) {
        if (ast.type === "node_op" && ast.value === "op_exp") {
            if (ast.children[1].type === "node_const" && ast.children[1].value === -1) {
                ast = this.expand_node(ast);
            }
        }
        return ast;
    },

    /**
     * Takes 2 ASTs and compares if they are structurally the same when sorted.
     *
     * @param {*} ast_1
     * @param {*} ast_2
     *
     */
    equals: function (ast_1, ast_2) {
        if (ast_1 === undefined || ast_2 === undefined) return false;
        this.sort(ast_1);
        this.sort(ast_2);
        return this._equals_unsorted(ast_1, ast_2);
    },

    /**
     * Takes 2 ASTs and compares if they are structurally the same when sorted and compiled into a string.
     *
     * @param {*} ast_1
     * @param {*} ast_2
     *
     */
    equals_compiled: function (ast_1, ast_2) {
        var ast_1_str, ast_2_str;
        this.sort(ast_1);
        this.sort(ast_2);
        ast_1_str = this.compile(ast_1);
        ast_2_str = this.compile(ast_2);
        return ast_1_str === ast_2_str;
    },

    /**
     * Takes 2 ASTs and compares if they are structurally the same.
     * Order of children is important, shuffled elements are not the same here, even when the elements are the same!
     * Sorting them beforehand is highly advised!
     *
     * @param {*} ast_1
     * @param {*} ast_2
     *
     */
    _equals_unsorted: function (ast_1, ast_2) {
        var i;
        // if one is a string, both have to be a string and be equal
        if (JXG.isString(ast_1)) {
            if (JXG.isString(ast_2)) {
                return ast_1 === ast_2;
            }
            return false;
        }
        // if one is an array, both have to be an array with the same elements
        else if (JXG.isArray(ast_1)) {
            if (JXG.isArray(ast_2)) {
                if (ast_1.length === ast_2.length) {
                    // if an element is different, return false
                    for (i = 0; i < ast_1.length; i++) {
                        if (!this.equals(ast_1[i], ast_2[i])) return false;
                    }
                    // in case all children are identical, we can return true
                    return true;
                }
            }
            return false;
        }
        // else, just compare all the children
        else {
            // first check if type and value are the same, and they have same amount of children
            if (ast_1.type === ast_2.type && ast_1.value === ast_2.value && ast_1.children.length === ast_2.children.length) {
                // if a single child is different, we return false
                for (i = 0; i < ast_1.children.length; i++) {
                    if (!this.equals(ast_1.children[i], ast_2.children[i])) return false;
                }
                // in case are children are identical, we can return true
                return true;
            }
            // if type or value are not the same, this is false
            else {
                return false;
            }
        }
    },

    /**
     * Calculates the greatest common denominator for a given amount of integers.
     *
     * @param  {...any} numbers
     * @returns
     */
    gcd: function (...numbers) {
        var gcd, negative_flag = true;
        if (numbers.length === 0) return 1;
        if (numbers.length === 1) return numbers[0];
        gcd = numbers[0];
        numbers.forEach((number) => {
            gcd = this._gcd(gcd, number);
            if (number > 0) negative_flag = false;
        });
        return negative_flag ? -gcd : gcd;
    },

    _gcd: function (a, b) {
        var condition = true, temp;
        if (!(this.is_integer(a) && this.is_integer(b))) return 1;
        a = Math.abs(a);
        b = Math.abs(b);
        if (b > a) { temp = a; a = b; b = temp; }
        while (condition) {
            if (b === 0) return a;
            a %= b;
            if (a === 0) return b;
            b %= a;
        }
    },

    /**
     * Simplifies fractions by dividing the integer factors through the greatest common divisor.
     * Non_integer values are left alone.
     * Expanding the term beforehand is greatly advised in order to eleminate terms such as 3*2*(3*2)^-1.
     *
     * Example: x*6*48^(-1) -> x*8^(-1)
     *
     * @param {*} ast
     * @returns
     */
    cancel_gcd: function (ast) {
        if (ast.type === "node_op" && ast.value === "op_mul") {
            var i, current_child,
                numerator = 1,
                denominator = 1,
                gcd = 1,
                numerator_arr = [],
                denominator_arr = [],
                children_copy = [...ast.children],
                node;

            // we splice the integer and the int^(-1) values and put them into the seperate arrays
            for (i = children_copy.length - 1; i >= 0; i--) {
                current_child = children_copy[i];
                // if the current child is an int, we add it to the numerator
                if (current_child.type === "node_const" && current_child.is_int()) {
                    if (current_child.value === 0) {
                        return this.create_node("node_const", 0);
                    }
                    node = children_copy.splice(i, 1)[0];
                    numerator_arr.push(node.value);
                }
                // if it is an exp ^(-1) and the base is an integer, we add it to the denominator
                else if (current_child.value === "op_exp" && current_child.type === "node_op") {
                    if (current_child.children[1].type === "node_const" && current_child.children[1].value === -1) {
                        if (current_child.children[0].type === "node_const" && current_child.children[0].is_int()) {
                            node = children_copy.splice(i, 1)[0];
                            node = node.children[0];
                            denominator_arr.push(node.value);
                        }
                    }
                }
            }

            // if an array has no values, we stop right away
            if (numerator_arr.length === 0 || denominator_arr.length === 0) {
                return ast;
            }

            // we calculate the values
            numerator_arr.forEach((elem) => numerator *= elem);
            denominator_arr.forEach((elem) => denominator *= elem);

            gcd = this.gcd(numerator, denominator);
            // if it is 1, we can stop right away
            if (gcd === 1) return ast;

            numerator /= gcd;
            denominator /= gcd;

            // only the numerator should be negative
            if (denominator < 0) {
                if (numerator < 0) {
                    denominator = Math.abs(denominator);
                    numerator = Math.abs(numerator);
                }
                else {
                    denominator = Math.abs(denominator);
                    numerator = -numerator;
                }
            }

            // add the new values back to the product
            if (numerator !== 1) {
                children_copy.push(this.create_node("node_const", numerator));
            }
            if (denominator !== 1) {
                node = this.create_node("node_op", "op_exp");
                node.push(this.create_node("node_const", denominator));
                node.push(this.create_node("node_const", -1));
                children_copy.push(node);
            }

            if (children_copy.length === 0) { return this.create_node("node_const", 1); }
            if (children_copy.length === 1) { return children_copy[0]; }

            ast.set_children(children_copy);

        }
        return ast;
    },

    /**
     * Helper for collect_coeff, which splits an AST into constant and non_constant.
     * Returned is an array, which first component is a mul node with all constant values of the product,
     * and the second component is a mul node without the constant values.
     * If either component doesn't have multiple elements, that single node is returned instead of a mul node.
     *
     * @param {*} ast
     */
    _collect_common_denominator_prepare: function (ast) {
        var i,
            denominator = undefined;

        if (ast.type === "node_op" && ast.value === "op_mul") {

            for (i = 0; i < ast.children.length; i++) {
                // test if it's an op_exp with exponent -1
                if (ast.children[i].type === "node_op" && ast.children[i].value === "op_exp") {
                    if (ast.children[i].children[1].type === "node_const" && ast.children[i].children[1].value === -1) {
                        denominator = ast.children[i];
                        ast.splice(i);
                        // if only 1 child left in numerator
                        if (ast.children.length === 1) ast = ast.children[0];
                        break;
                    }
                }
            }
        }
        else if (ast.type === "node_op" && ast.value === "op_exp") {
            if (ast.children[1].type === "node_const" && ast.children[1].value === -1) {
                denominator = ast;
                ast = this.create_node("node_const", 1);
            }
        }
        //console.log("prepared: ", ast, denominator);
        return [ast, denominator];
    },

    /**
     * Collects all factors of a op_mul node that share the same base
     * Example:
     *      a^4 * b * (a+1)^2 * z^2 * a * x * 3^2 * 2^5 * 3 * 7 * 7^3 * (1+a)
     * will be changed to
     *      a^(4+1) * b^1 * (1+a)^(2+1) * z^2 * x^1 * 3^(2+1) * 2^5 * 7^(1+3)
     *
     * Expects that stacked op_exp were merged before running this function
     *
     * @param {*} ast
     * @returns first node of the subtree
     */
    collect_exp_node: function (ast) {
        var i, base, exp, node, new_node;

        if (ast.type === "node_op" && ast.value === "op_mul") {
            for (i = 0; i < ast.children.length; i++) {
                if (ast.children[i].type === "node_op" && ast.children[i].value === "op_exp") {
                    base = ast.children[i].children[0];
                    exp = ast.children[i].children[1];
                } else {
                    base = ast.children[i];
                    exp = this.create_node("node_const", 1);
                }

                ast.children = ast.children.filter((elem, index) => {
                    if (index <= i) return true;
                    if (elem.type === "node_op" && elem.value === "op_exp") {
                        if (this.equals(elem.children[0], base)) {
                            if (exp.type === "op_add") {
                                exp.push(elem.children[1]);
                            } else {
                                node = this.create_node("node_op", "op_add");
                                node.push(exp, elem.children[1]);
                                exp = node;
                            }
                            return false;
                        } else return true;
                    } else if (this.equals(elem, base)) {
                        if (exp.type === "op_add") {
                            exp.push(this.create_node("node_const", 1));
                        } else {
                            node = this.create_node("node_op", "op_add");
                            node.push(exp, this.create_node("node_const", 1));
                            exp = node;
                        }
                        return false;
                    } else return true;
                });
                exp = this.basic_transforms_int(exp);
                new_node = this.create_node("node_op", "op_exp");
                new_node.push(base, this.merge_node(exp));
                ast.set(i, new_node);
            }
            if (ast.children.length === 1) return ast.children[0];
            else return ast;
        }
        return ast;
    },

    /**
     * When given an add_node, it collects the coefficients that have the same variables and adds them together.
     *
     * Example: 3x^2 + 2xy + x + 2x^2 + 2xy -> (3 + 2)x^2 + (2 + 2)xy + 1*x
     *
     * @param {*} ast
     */
    collect_coeff_node: function (ast) {
        var i, j,
            new_children = [], // where the collected children are being added
            children_copy = [], // where the comparable children are being stored for later use
            non_constant, // this is where we store the product, without its coefficients
            constant, // this is where we store the constant coefficients
            new_child = []; // mul node for constant and non_constant

        // only do something, if we have a sum
        if (ast.type === "node_op" && ast.value === "op_add") {
            //debugger;
            // first we test if its constant
            // if so, we break the recursion
            if (this.is_constant(ast)) {
                return ast;
            }

            // for each element in the children, we seperate the constant and non_constant values
            //console.log("add_node",ast)
            ast.children.forEach((child) => { children_copy.push(this._collect_coeff_node_prepare(child)); });

            // for each element in the children, search elements with the same non_constant
            for (i = children_copy.length - 1; i >= 0; i--) {
                // creates a sum node for the constant values
                constant = this.create_node("node_op", "op_add");
                constant.push(children_copy[i][0]);
                // save the non_constant part
                non_constant = children_copy[i][1];
                // if it is already a mul node, we dont need a new mul node
                if (non_constant.type === "op_mul") {
                    new_child = non_constant;
                }
                // if it isn't, we do need one
                else {
                    new_child = this.create_node("node_op", "op_mul");
                    new_child.push(non_constant);
                }
                new_child.const_flag = this.is_constant(non_constant);

                // remove the current element from the array
                children_copy.splice(i, 1);

                for (j = children_copy.length - 1; j >= 0; j--) {
                    // test if we have the same non_constants
                    if (this.equals(non_constant, children_copy[j][1])) {
                        // if so, concatenate the constants and remove the element
                        //console.log("unconcatenated:", constant.children)
                        //console.log("to be concatenated:", children_copy[j][0])
                        constant.push(children_copy[j][0]);
                        //console.log("concatenated:", constant.children)
                        children_copy.splice(j, 1);
                        i--;
                    }
                }
                // if there is only one constant, we dont need the sum
                if (constant.children.length === 1) {
                    constant = constant.children[0];
                }
                // adds the constants back to the front of the non_constant factors
                new_child.push(constant);
                // then adds the combined product back to the sum
                new_children.push(new_child);
            }
            // if there is only one node left, we dont need the add anymore
            if (new_children.length === 1) {
                ast = new_children[0];
                // replaces the children with the new children
            } else {
                ast.set_children(new_children);
            }
            ast = this.merge_tree(ast);
            ast = this.basic_transforms_int(ast);
        }

        return ast;
    },


    /**
     * Helper for collect_coeff, which splits an AST into constant and non_constant.
     * Returned is an array, which first component is a mul node with all constant values of the product,
     * and the second component is a mul node without the constant values.
     * If either component doesn't have multiple elements, that single node is returned instead of a mul node.
     *
     * @param {*} ast
     */
    _collect_coeff_node_prepare: function (ast) {
        //console.log("prepare", ast)
        var i,
            constant = this.create_node("node_op", "op_mul"),
            non_constant = this.create_node("node_op", "op_mul"),
            children_copy = [...ast.children];

        // if the ast ist undefined, return undefined
        if (ast === undefined) {
            return ast;
        }

        // if we have just a constant, our "non_constant" will be 1, in order to be comparable
        if (this.is_constant(ast)) {
            constant = ast;
            non_constant = this.create_node("node_const", 1);
        }
        // just testing to see if we have a mul node
        // if so, we remove the constants and save them seperately
        else if (ast.type === "node_op" && ast.value === "op_mul") {
            // backwards loop, so that the indexes wont get messed up
            for (i = 0; i < children_copy.length; i++) {
                // if a child is constant, remove it from the array and push it to constant
                if (this.is_constant(ast.children[i])) {
                    constant.push(children_copy[i]);
                }
                // else we push it to the non_constant child array
                else {
                    non_constant.push(children_copy[i]);
                }
            }
            // if there isn't a constant, we have const 1
            if (constant.children.length === 0) {
                constant = this.create_node("node_const", 1);
            }
            // if we have only one constant, we return its node
            else if (constant.children.length === 1) {
                constant = constant.children[0];
            }
            // if we have only one non_constant, we return its node
            if (non_constant.children.length === 1) {
                non_constant = non_constant.children[0];
            }
            // then, we return
        }
        // if it isn't a constant nor a product, we set 1 to be the constant for the product
        else {
            constant = this.create_node("node_const", 1);
            non_constant = ast;
        }
        //console.log("prepared:",constant, non_constant)

        return [constant, non_constant];
    },

    /**
     * First step in to_jxg_tree to add negations and divisions back into the work tree
     *
     * @param {*} ast
     */
    restore_op: function (ast) {
        var i, new_ast,
            divisor_arr, division, divisor,
            negative, negation,
            elem, base, exponent;

        if (JXG.isString(ast)) {
            return ast;
        }
        else if (JXG.isArray(ast)) {
            ast.forEach((elem, i, arr) => {
                arr[i] = this.restore_op(elem);
            });
            return ast;
        }
        else if (ast === undefined) {
            return ast;
        }
        else {
            ast.children.forEach((elem, i, arr) => {
                arr[i] = this.restore_op(elem);
            });
            // exception: negative constants are not allowed anymore
            // so instead we return a negated node
            if (ast.type === "node_const" && ast.value < 0) {
                ast = this.create_node("node_const", -ast.value);
                new_ast = this.create_node("node_op", "op_neg");
                new_ast.children.push(ast);
                return new_ast;
            }

            else if (ast.type === "node_op" && ast.value === "op_mul") {
                divisor_arr = [];
                negative = false;
                for (i = ast.children.length - 1; i >= 0; i--) {
                    elem = ast.children[i];
                    // test if the factor is negative
                    if (this.is_negative(elem)) {
                        negative = !negative;
                        elem = this._un_negate_node(elem);
                        if (elem.type === "node_const" && elem.value === 1) {
                            ast.children.splice(i, 1);
                            continue;
                        }
                        ast.children[i] = elem;
                    }

                    // test for exponentials
                    if (elem.type === "node_op" && elem.value === "op_exp") {
                        base = elem.children[0];
                        exponent = elem.children[1];
                        // test if exponent is negative
                        if (this.is_negative(exponent)) {
                            exponent = this._un_negate_node(exponent);
                            /*
                            if(base.type === "node_const" && base.value < 0 && this.is_integer(exponent.value) && exponent.value % 2 === 1){
                                negative = !negative;
                                if(elem.value === -1){
                                    ast.children.splice(i, 1);
                                    continue;
                                }
                                base.value = -base.value;
                            }
                            */
                            if (exponent.value === 1) {
                                divisor_arr.unshift(base);
                                ast.children.splice(i, 1);
                            }
                            else {
                                elem.children[1] = exponent;
                                divisor_arr.unshift(elem);
                                ast.children.splice(i, 1);
                            }
                        }
                        /*
                        else if(this.is_negative(exponent)){
                            elem.children[1] = this._un_negate_node(exponent);
                            divisor_arr.unshift(elem);
                            ast.children.splice(i, 1);
                        }
                        */

                    }
                }
                // if there were negative exponents, we add a division
                if (divisor_arr.length > 0) {
                    division = this.create_node("node_op", "op_div");
                    // if our multiplikation has only 1 child remaining, it es the numerator
                    if (ast.children.length === 1) division.children.push(ast.children[0]);
                    // if no child is left, the numerator is 1
                    else if (ast.children.length === 0) division.children.push(this.create_node("node_const", 1));
                    // else, we just push the mult
                    else division.children.push(ast);

                    if (divisor_arr.length === 1) {
                        division.children.push(divisor_arr[0]);
                    }
                    else {
                        divisor = this.create_node("node_op", "op_mul");
                        divisor.children = divisor_arr;
                        division.children.push(divisor);
                    }
                    ast = division;
                }
                // else, we may have to eliminate the mul
                if (ast.children.length === 1) {
                    ast = ast.children[0];
                } else if (ast.children.length === 0) {
                    // if no child is left, the numerator is 1
                    ast = this.create_node("node_const", 1);
                }
                // if the multiplication is negative, we have to negate the node
                if (negative) {
                    negation = this.create_node("node_op", "op_neg");
                    if (ast.value === "op_div") {
                        negation.children.push(ast.children[0]);
                        ast.children[0] = negation;
                    }
                    else {
                        negation.children.push(ast);
                        ast = negation;
                    }
                }
            }
            return ast;
        }
    },

    /**
     * Negate a node, if that node is negative.
     *
     * @param {*} node
     * @returns
     */
    _un_negate_node: function (node) {
        if (node.type === "node_op") {
            if (node.value === "op_neg") node = node.children[0];
            else if (node.value === "op_div") node.children[0] = this._un_negate_node(node.children[0]);
        }
        return node;
    },

    /**
     * Takes a binary work_tree, and generates an equivalent JessieCode tree.
     * Because negative node_const are not allowed, we replace them with op_neg nodes.
     *
     * @param {} ast
     * @returns
     */
    _generate_jxg_tree: function (ast, jc) {
        var children, base, exponent,
            one, exp;

        if (JXG.isString(ast)) {
            return ast;
        }
        else if (JXG.isArray(ast)) {
            ast.forEach((elem, i, arr) => {
                arr[i] = this._generate_jxg_tree(elem, jc);
            });
            return ast;
        }
        else if (ast === undefined) {
            return ast;
        }
        else {
            children = [];
            ast.children.forEach((elem) => {
                children.push(this._generate_jxg_tree(elem, jc));
            });

            if (ast.type === "node_op" && ast.value === "op_add") {
                // if the second summand is negated, we generate a substration instead
                if (this.is_negative(children[1])) {
                    ast.value = "op_sub";
                    children[1] = this._un_negate_node(children[1]);
                }
            }
            // if it is an exp^-1, we transform it into a division
            else if (ast.type === "node_op" && ast.value === "op_exp") {
                base = children[0];
                exponent = children[1];
                // test if the exponent is negative
                if (this.is_negative(exponent)) {
                    one = jc.createNode("node_const", 1);
                    if (exponent.children[0].type === "node_const" && exponent.children[0].value === 1) {
                        ast.value = "op_div";
                        children[0] = one;
                        children[1] = base;
                    }
                    else {
                        exp = jc.createNode("node_op", "op_exp", base, this._un_negate_node(exponent));
                        ast.value = "op_div";
                        children[0] = one;
                        children[1] = exp;
                    }
                }
            }
            ast = jc.createNode(ast.type, ast.value, ...children);
            // we set isMath to true, so that the compile doesn't give an error for map
            ast.isMath = true;
            return ast;
        }
    },

    /**
     * Takes an AST, and returns a newly generated working tree.
     * It replaces some operator nodes with equivalent structures.
     * Prerequisite for simplification.
     *
     * a - b -> a + (-1) * b
     * a / b -> a * b^(-1)
     * -a -> (-1) * a
     *
     * @param {*} ast
     */
    remove_op: function (ast) {
        var child, node;
        if (ast.type === "node_op") {
            switch (String(ast.value)) {
                // special case: neg, sub and div should be deleted
                case "op_neg":
                    return this.remove_neg(ast);
                case "op_sub":
                    return this.remove_sub(ast);
                case "op_div":
                    return this.remove_div(ast);
                // special case: Children of execfun and assign have arrays as children
                // therefore normal recursion doesn't work
                case "op_map":
                    node = this.create_node(ast.type, ast.value);
                    node.push([...ast.children[0]]);
                    node.push(this.remove_op(ast.children[1]));
                    return node;
                case "op_execfun":
                    return this.remove_execfun(ast);
            }
        }
        //default case: create new node without unnecessary information
        node = ast.type === "node_const" ? this.create_node(ast.type, Number(ast.value)) : this.create_node(ast.type, ast.value);
        // if it is a certain constant, we set the
        if (ast.type === "node_var" && (ast.value === "EULER" || ast.value === "PI")) {
            node.const_flag = true;
        }
        for (child of ast.children) {
            node.push(this.remove_op(child));
        }
        return node;
    },

    /**
     * Deletes every negation
     * @param {*} ast
     */
    remove_neg: function (ast) {
        var new_node,
            right_child;
        new_node = this.create_node("node_op", "op_mul");
        new_node.push(this.remove_op(ast.children[0]));
        right_child = this.create_node("node_const", -1);
        new_node.push(right_child);
        return new_node;
    },

    /**
     * Takes original binary AST and generates the new root node of the partial tree, while deleteing target subtraction
     * 1 - 1 -> 1+(-1)*1
     * @param {*} ast
     */
    remove_sub: function (ast) {
        var new_node, right_child, right_left_child;
        new_node = this.create_node("node_op", "op_add");
        new_node.push(this.remove_op(ast.children[0]));
        right_child = this.create_node("node_op", "op_mul");
        right_left_child = this.create_node("node_const", -1);
        right_child.push(right_left_child);
        right_child.push(this.remove_op(ast.children[1]));
        new_node.push(right_child);
        return new_node;
    },

    /**
     * Takes original binary AST and generates the new root node of the partial tree, while deleting target division
     * x/y -> x*y^(-1)
     * @param {*} ast
     * @returns
     */
    remove_div: function (ast) {
        var new_node, right_child, right_right_child;
        new_node = this.create_node("node_op", "op_mul");
        new_node.push(this.remove_op(ast.children[0]));
        right_child = this.create_node("node_op", "op_exp");
        right_child.push(this.remove_op(ast.children[1]));
        right_right_child = this.create_node("node_const", -1);
        right_child.push(right_right_child);
        new_node.push(right_child);
        return new_node;
    },
    /**
     * special case: Children of execfun has arrays as children,therefore normal recursion doesn't work
     * @param {*} ast
     * @returns
     */
    remove_execfun: function (ast) {
        var node, i, parameters;

        if (ast.children[0].value === "sqrt") {
            return this.remove_sqrt(ast);
        }
        if (ast.children[0].value === "cbrt") {
            return this.remove_cbrt(ast);
        }
        if (ast.children[0].value === "nthroot") {
            return this.remove_nthroot(ast);
        }
        if (ast.children[0].value === "pow") {
            return this.remove_pow(ast);
        }
        if (ast.children[0].value === "exp") {
            return this.remove_exp(ast);
        }
        if (ast.children[0].value === "ratpow") {
            return this.remove_ratpow(ast);
        }
        if (ast.children[0].value === "fac") {
            return this.remove_fac(ast);
        }
        if (ast.children[0].value === "min") {
            return this.remove_min(ast);
        }
        if (ast.children[0].value === "max") {
            return this.remove_max(ast);
        }
        node = this.create_node(ast.type, ast.value);
        node.push(this.remove_op(ast.children[0]));
        parameters = [];
        for (i = 0; i < ast.children[1].length; i++) {
            parameters.push(this.remove_op(ast.children[1][i]));
        }
        node.push(parameters);
        return node;

    },

    /**
     * Removes every sqrt operation and replaces it (sqrt(x)-> x^(2^(-1)))
     * @param {*} ast
     * @returns
     */
    remove_sqrt: function (ast) {
        var new_node,
            right_child,
            right_left_child,
            right_right_child;
        new_node = this.create_node("node_op", "op_exp");
        new_node.push(this.remove_op(ast.children[1][0]));
        right_child = this.create_node("node_op", "op_exp");
        right_left_child = this.create_node("node_const", 2);
        right_child.push(right_left_child);
        right_right_child = this.create_node("node_const", -1);
        right_child.push(right_right_child);
        new_node.push(right_child);
        return new_node;
    },

    /**
     * Removes every cbrt operation and replaces it (cbrt(x)-> x^(3^(-1)))
     * @param {*} ast
     * @returns
     */
    remove_cbrt: function (ast) {
        var new_node,
            right_child,
            right_left_child,
            right_right_child;
        new_node = this.create_node("node_op", "op_exp");
        new_node.push(this.remove_op(ast.children[1][0]));
        right_child = this.create_node("node_op", "op_exp");
        right_left_child = this.create_node("node_const", 3);
        right_child.push(right_left_child);
        right_right_child = this.create_node("node_const", -1);
        right_child.push(right_right_child);
        new_node.push(right_child);
        return new_node;
    },

    /**
     * Removes every nthroot operation and replaces it (nthroot(x,n)-> x^(n^(-1)))
     * @param {*} ast
     * @returns
     */
    remove_nthroot: function (ast) {
        var new_node,
            right_child,
            right_right_child;
        new_node = this.create_node("node_op", "op_exp");
        new_node.push(this.remove_op(ast.children[1][0]));
        right_child = this.create_node("node_op", "op_exp");
        right_child.push(this.remove_op(ast.children[1][1]));
        right_right_child = this.create_node("node_const", -1);
        right_child.push(right_right_child);
        new_node.push(right_child);
        return new_node;
    },

    /**
     * Removes every pow operation as a child of execfun and replaces it (pow(x,n)-> x^n)
     * @param {*} ast
     */
    remove_pow: function (ast) {
        var new_node;
        new_node = this.create_node("node_op", "op_exp");
        new_node.push(this.remove_op(ast.children[1][0]));
        new_node.push(this.remove_op(ast.children[1][1]));
        return new_node;
    },

    /**
     * Removes every exp operation as a child of execfun with Index 0 and replaces it (exp(n)-> e^n)
     * @param {*} ast
     * @returns
     */
    remove_exp: function (ast) {
        var new_node,
            left_child;
        new_node = this.create_node("node_op", "op_exp");
        left_child = this.create_node("node_var", "EULER");
        new_node.push(left_child);
        new_node.push(this.remove_op(ast.children[1][0]));
        return new_node;
    },

    /**
     * Removes every ratpow operation as a child of execfun and replaces it (ratpow(x,m,n)-> x^(m*n^(-1)))
     * @param {*} ast
     * @returns
     */
    remove_ratpow: function (ast) {
        var new_node,
            right_child,
            right_right_child,
            right_right_right_child;
        new_node = this.create_node("node_op", "op_exp");
        new_node.push(this.remove_op(ast.children[1][0]));
        right_child = this.create_node("node_op", "op_mul");
        right_child.push(this.remove_op(ast.children[1][1]));
        right_right_child = this.create_node("node_op", "op_exp");
        right_right_child.push(this.remove_op(ast.children[1][2]));
        right_right_right_child = this.create_node("node_const", -1);
        right_right_child.push(right_right_right_child);
        right_child.push(right_right_child);
        new_node.push(right_child);
        return new_node;
    },
    /**
     * Removes every fac operation as a child of execfun in case there is an integer
     * @param {*} ast
     * @returns
     */
    remove_fac: function (ast) {
        var new_node,
            string_value;

        if (ast.children[1][0].type === "node_op" && ast.children[1][0].value === "op_execfun") {
            if (ast.children[1][0].children[0].type === "node_var" && ast.children[1][0].children[0].value === "fac") {
                ast.children[1][0] = this.remove_fac(ast.children[1][0]);
            }
            else ast.children[1][0] = this.remove_op(ast.children[1][0]);
        }
        else ast.children[1][0] = this.remove_op(ast.children[1][0]);
        if (this.is_natural(ast.children[1][0].value)) {
            string_value = ast.children[1][0].value;
            new_node = this.create_node("node_const", JXG.Math.factorial(string_value));
            return new_node;
        }
        else return ast;
    },

    /**
     * removes max operation if it is possible
     * @param {*} ast
     * @returns
     */
    remove_max: function (ast) {
        var i,
            float_flag = true;

        for (i = 0; i < ast.children[1].length; i++) {
            if (ast.children[1][i].type === "node_op" && ast.children[1][i].value === "op_execfun") {
                if (ast.children[1][i].children[0].type === "node_var" && ast.children[1][i].children[0].value === "max") {
                    ast.children[1][i] = this.remove_max(ast.children[1][i]);
                }
                else ast.children[1][i] = this.remove_op(ast.children[1][i]);
            }
            else ast.children[1][i] = this.remove_op(ast.children[1][i]);
        }
        for (i = 0; i < ast.children[1].length; i++) {
            if (!this.is_float(ast.children[1][i].value)) {
                float_flag = false;
                break;
            }
        }
        if (float_flag) {
            return this.remove_max_float(ast);
        }
        if (!float_flag) {
            return this.remove_max_mixed(ast);
        }
    },

    /**
     * removes every max operation if there are only floats
     * @param {*} ast
     * @returns
     */
    remove_max_float: function (ast) {
        var new_node;
        new_node = this.create_node("node_const", this._max(ast));
        return new_node;
    },

    /**
     * mixed case of a max operation. Here there are not only floats. Max nodes wih floats will be removed, the other ones will be copied
     * @param {*} ast
     * @returns
     */
    remove_max_mixed: function (ast) {
        var i, j, k,
            new_node,
            left_child,
            maximum,
            max_mixed_array = new Array(),
            max_node,
            mixed_max_flag = false,
            len = ast.children[1].length,
            unique_flag = true;

        for (i = 0; i < len; i++) {
            if (this.is_float(ast.children[1][i].value)) {
                maximum = ast.children[1][i].value;
                mixed_max_flag = true;
                break;
            }
        }
        for (j = 0; j < len; j++) {
            if (this.is_float(ast.children[1][j].value)) {
                if (ast.children[1][j].value > maximum) {
                    maximum = ast.children[1][j].value;
                }
            }
            if (!this.is_float(ast.children[1][j].value)) {
                if (max_mixed_array.length === 0) {
                    max_mixed_array.push(ast.children[1][j]);
                }
                else {
                    for (k = 0; k < max_mixed_array.length; k++) {
                        if (this.equals(ast.children[1][j], max_mixed_array[k])) {
                            unique_flag = false;
                            break;
                        }
                    }
                    if (unique_flag) {
                        max_mixed_array.push(ast.children[1][j]);
                    }
                    unique_flag = true;
                }
            }
        }
        if (mixed_max_flag === true) {
            max_node = this.create_node("node_const", maximum);
            max_mixed_array.push(max_node);
        }
        //console.log(max_mixed_array);
        if (max_mixed_array.length === 1) {
            return max_mixed_array[0];
        }
        else {
            new_node = this.create_node("node_op", "op_execfun");
            left_child = this.create_node("node_var", "max");
            new_node.push(left_child);
            new_node.push(max_mixed_array);
            return new_node;
        }
    },

    /**
     * removes a min operation if it is possible
     * @param {*} ast
     * @returns
     */
    remove_min: function (ast) {
        var i,
            float_flag = true;

        for (i = 0; i < ast.children[1].length; i++) {
            if (ast.children[1][i].type === "node_op" && ast.children[1][i].value === "op_execfun") {
                if (ast.children[1][i].children[0].type === "node_var" && ast.children[1][i].children[0].value === "min") {
                    ast.children[1][i] = this.remove_min(ast.children[1][i]);
                }
                else ast.children[1][i] = this.remove_op(ast.children[1][i]);
            }
            else ast.children[1][i] = this.remove_op(ast.children[1][i]);
        }
        for (i = 0; i < ast.children[1].length; i++) {
            if (!this.is_float(ast.children[1][i].value)) {
                float_flag = false;
                break;
            }
        }
        if (float_flag) {
            return this.remove_min_float(ast);
        }
        if (!float_flag) {
            return this.remove_min_mixed(ast);
        }
    },

    /**
     * removes every min operation if there are only floats
     * @param {*} ast
     * @returns
     */
    remove_min_float: function (ast) {
        var new_node;
        new_node = this.create_node("node_const", this._min(ast));
        return new_node;
    },

    /**
     * mixed case of a min operation. Here there are not only floats. Min nodes wih floats will be removed, the other ones will be copied
     * @param {*} ast
     * @returns
     */
    remove_min_mixed: function (ast) {
        var i, j, k, left_child,
            minimum,
            min_mixed_array = new Array(),
            min_node,
            new_node,
            mixed_min_flag = false,
            array_length = ast.children[1].length,
            unique_flag;

        for (i = 0; i < array_length; i++) {
            if (this.is_float(ast.children[1][i].value)) {
                minimum = ast.children[1][i].value;
                mixed_min_flag = true;
                break;
            }
        }
        for (j = 0; j < array_length; j++) {
            if (this.is_float(ast.children[1][j].value)) {
                if (ast.children[1][j].value < minimum) {
                    minimum = ast.children[1][j].value;
                }
            }
            if (!this.is_float(ast.children[1][j].value)) {
                if (min_mixed_array.length === 0) {
                    min_mixed_array.push(ast.children[1][j]);
                }
                else {
                    for (k = 0; k < min_mixed_array.length; k++) {
                        if (this.equals(ast.children[1][j], min_mixed_array[k])) {
                            unique_flag = false;
                            break;
                        }
                    }
                    if (unique_flag) {
                        min_mixed_array.push(ast.children[1][j]);
                    }
                    unique_flag = true;
                }
            }
        }
        if (mixed_min_flag === true) {
            min_node = this.create_node("node_const", minimum);
            min_mixed_array.push(min_node);
        }
        //console.log(min_mixed_array);
        if (min_mixed_array.length === 1) {
            return min_mixed_array[0];
        } else {
            new_node = this.create_node("node_op", "op_execfun");
            left_child = this.create_node("node_var", "min");
            new_node.push(left_child);
            new_node.push(min_mixed_array);
            return new_node;
        }
    },

    /**
     * 2*x^2+x^2*6+4*x+x*2+log(x)*6+x*y*4+3*log(x);
     * unsets following flags, if they are not set for all children: const_flag, sorted
     * @param {*} node
     */
    sync_flags: function (node, reset = true, ...children) {
        if (node === undefined) {
            //console.error("sync_flags: undefined node");
            return;
        }
        if (node.type === "node_op") {
            // we save the values, so we can see if anything changed
            var old_const = node.const_flag, old_sorted = node.sorted_flag;
            node.sorted_flag = false;
            if (reset) this.reset_flags(node);
            // when we have an execfun, the children are located elsewhere
            if (children !== undefined) {
                if (node.value === "op_execfun") {
                    if (JXG.isArray(children[0])) children = children[0];
                    else if (JXG.isArray(children[1])) children = children[1];
                    else return;
                }
                children.forEach((child) => {
                    child.parent = node;
                    if (!child.const_flag) node.const_flag = false;
                    //console.log(child);
                    //if(!child.int_flag) node.int_flag = false;
                });
            }
            /** we dont need an int flag, if we compute everything
            // we only test if we can set the int_flag, if we have certain op
            if (node.int_flag){
                switch (node.value){
                    case "op_add":
                    case "op_mul":
                        node.int_flag = true;
                        break;
                    case "op_exp":
                        if(node.children[1] === undefined) node.int_flag = false;
                        else node.int_flag = this.is_natural(node.children[1].value);
                        break;
                    default:
                        node.int_flag = false;
                }
            }
            */
            // if one of the added children is an int, we test if we can compute the integers
            //if(compute_int_necessary)  node = ast.rr.compute_integers(node);
            // if a flag changed, the parent has to check their flags as well
            //if(old_const !== node.const_flag || old_int !== node.int_flag || old_sorted !== node.sorted_flag){
            if (old_const !== node.const_flag || old_sorted !== node.sorted_flag) {
                this.sync_flags(node.parent, reset = false, node);
            }
        }
        return node;
    },

    /**
     * sets following flags back to default:
     * const_flag, int_flag, sorted
     *
     * @param {*} node
     */
    reset_flags: function (node) {
        if (node.type === "node_op") {
            node.const_flag = true;
            node.int_flag = false;
            node.sorted = false;
        }
        else {
            node.const_flag = node.type !== "node_var" || (node.value === "EULER" || node.value === "PI");
            node.int_flag = this.is_integer(node.value);
            node.sorted = true;
        }
    },

    /**
     * Lists all flags
     * @param {*} node
     * @returns {string}
     */
    _flag_string: function (node) {
        if (node === undefined) return "??";
        return (node.const_flag ? "c" : "-") + (node.int_flag ? "i" : "-") + (node.sorted ? "s" : "-") + "|";
    },

    /**
     * Recurent auxiliary method for merge_op
     *
     * attaches all nodes with same oparation value in the subtree to the passed node.
     * The recurency will end with any other operation value
     *
     * @param {*} ast
     * @param {*} node
     */
    _merge_add_aux: function (ast, node) {
        if (ast.value !== node.value) {
            node.push(ast);
        } else {
            ast.for_each_child((sub_ast) => {
                this._merge_add_aux(sub_ast, node);
            });
        }
    },

    /**
     * Adds the exponent of a passed op_exp node as factor to the exponend of its left child, if its
     * value is op_exp
     *
     * (b^a)^c becomes b^(a*c)
     * a^c stays a^c
     *
     * Only pass op_exp nodes
     * @param {*} ast
     * @returns new starting node
     */
    _merge_exp_aux: function (ast) {
        var node;

        if (ast.children !== undefined && ast.children[0].type === "node_op" && ast.children[0].value === "op_exp") {
            ast.set(0, this.merge_exp_node(ast.children[0]));
            node = this.create_node("node_op", "op_mul");
            node.children.push(ast.children[0].children[1], ast.children[1]);
            ast.children[0].set(1, node);
            this.sync_flags(ast);
            return ast.children[0];
        } else {
            return ast;
        }
    },

    /**
     * Merges a single sequence of op_add/op_mul nodes
     *
     * @param {*} ast - starting node
     * @returns the node all operations were merged to or the passed ast if nothing could be merged
     */
    merge_node: function (ast) {
        var node;

        if (ast.type === "node_op" && (ast.value === "op_mul" || ast.value === "op_add")) {
            node = this.create_node("node_op", ast.value);
            this._merge_add_aux(ast, node);
            return node;
        } else {
            return ast;
        }
    },

    /**
     * Merges a sequence of op_exp nodes to a single op_exp node and a singe op_mul node
     *
     * Example (((x^2)^3)^4)^5 becomes x^(2*3*4*5)
     * @param {*} ast - first node
     * @returns new starting node
     */
    merge_exp_node: function (ast) {
        if (ast.type === "node_op" && ast.value === "op_exp") {
            ast = this._merge_exp_aux(ast);
            ast.set(1, this.merge_node(ast.children[1]));
        }
        return ast;
    },

    /**
     * Restructures the AST to a binaray tree. This function will change the passed AST.
     * Also the first node of your AST might be another one after running this function.
     *
     * @param {*} ast - first node of your AST
     * @returns first node of the changed AST
     */
    unmerge_tree: function (ast) {
        var node, removed;

        if (JXG.isString(ast)) {
            return ast;
        } else if (JXG.isArray(ast)) {
            ast.forEach((elem, i, arr) => {
                arr[i] = this.unmerge_tree(elem);
            });
            return ast;
        } else if (ast.type === "node_op" && (ast.value === "op_mul" || ast.value === "op_add")) {
            if (ast.children.length > 2) {
                node = this.create_node("node_op", ast.value);
                removed = ast.children.pop();
                node.set_children([this.unmerge_tree(ast), this.unmerge_tree(removed)]);
                return node;
            } else {
                ast.children[0] = this.unmerge_tree(ast.children[0]);
                ast.children[1] = this.unmerge_tree(ast.children[1]);
                return ast;
            }
        } else {
            if (ast.children !== undefined) {
                ast.children.forEach((child, i, arr) => {
                    arr[i] = this.unmerge_tree(child);
                });
            }
            return ast;
        }
    },


    /**
     * maximum function
     * @param {*} ast
     * @returns
     */
    _max: function (ast) {
        var i,
            max = ast.children[1][0].value;

        for (i = 1; i < ast.children[1].length; i++) {
            if (ast.children[1][i].value > max) {
                max = ast.children[1][i].value;
            }
        }
        return max;

    },


    /**
     * minimum Function
     * @param {*} ast
     * @returns
     */
    _min: function (ast) {
        var i,
            min = ast.children[1][0].value;

        for (i = 1; i < ast.children[1].length; i++) {
            if (ast.children[1][i].value < min) {
                min = ast.children[1][i].value;
            }
        }
        return min;

    },

    /**
     * adds fractions if the numerator und denominator both are numbers
     * @param {*} ast
     * @returns
     */
    sum_int_denominator: function (ast) {
        var i,
            num_array = new Array(),
            den_array = new Array(),
            mixed_array = new Array(),
            fraction_flag = false,
            new_node,
            origin_ast,
            one_node;
        origin_ast = this.deep_copy(ast);
        one_node = this.create_node("node_const", 1);
        if (ast.type === "node_op" && ast.value === "op_add") {
            for (i = 0; i < ast.children.length; i++) {
                if (ast.children[i].type === "node_op" && ast.children[i].value === "op_mul") {
                    if (ast.children[i].children.length === 2) {
                        if (ast.children[i].children[0].type === "node_op" && ast.children[i].children[0].value === "op_exp") {
                            if (ast.children[i].children[1].type === "node_const") {
                                if (ast.children[i].children[0].children[1].type === "node_const") {
                                    if (ast.children[i].children[0].children[1].value < 0) {
                                        if (ast.children[i].children[0].children[0].type === "node_const") {
                                            ast.children[i].children[0].children[1].value = -(ast.children[i].children[0].children[1].value);
                                            new_node = this.create_node("node_const", ast.children[i].children[0].children[0].value);
                                            den_array.push(new_node);//Denominator
                                            num_array.push(ast.children[i].children[1]);
                                            fraction_flag = true;
                                            continue;
                                        }
                                        else {
                                            mixed_array.push(ast.children[i]);
                                        }
                                    }
                                    else {
                                        mixed_array.push(ast.children[i]);
                                    }
                                }
                                else {
                                    mixed_array.push(ast.children[i]);
                                }
                            }
                            else {
                                mixed_array.push(ast.children[i]);
                            }
                        }
                        if (ast.children[i].children[0].type === "node_const") {
                            if (ast.children[i].children[1].type === "node_op" && ast.children[i].children[1].value === "op_exp") {
                                if (ast.children[i].children[1].children[1].value < 0) {
                                    if (ast.children[i].children[1].children[0].type === "node_const") {
                                        ast.children[i].children[1].children[1].value = -(ast.children[i].children[1].children[1].value);
                                        new_node = this.create_node("node_const", ast.children[i].children[1].children[0].value);
                                        den_array.push(new_node);//Denominator
                                        num_array.push(ast.children[i].children[0]);
                                        fraction_flag = true;
                                        continue;
                                    }
                                    else {
                                        mixed_array.push(ast.children[i]);
                                    }
                                }
                                else {
                                    mixed_array.push(ast.children[i]);
                                }
                            }
                            else {
                                mixed_array.push(ast.children[i]);
                            }
                        }
                        else {
                            mixed_array.push(ast.children[i]);
                        }
                    }
                    else {
                        mixed_array.push(ast.children[i]);
                    }
                }
                else if (ast.children[i].type === "node_const") {
                    num_array.push(ast.children[i]);
                    den_array.push(one_node);
                }
                else if (ast.children[i].type === "node_op" && ast.children[i].value === "op_exp") {
                    if (ast.children[i].children[1].type === "node_const") {
                        if (ast.children[i].children[1].value < 0) {
                            if (ast.children[i].children[0].type === "node_const") {
                                ast.children[i].children[1].value = -(ast.children[i].children[0].value);
                                new_node = this.create_node("node_const", ast.children[i].children[0].value);
                                den_array.push(new_node);//Denominator
                                num_array.push(one_node);
                                fraction_flag = true;
                                continue;
                            }
                        }
                    }
                    else {
                        mixed_array.push(ast.children[i]);
                    }
                }
                else {
                    mixed_array.push(ast.children[i]);
                }
            }
        }
        if (fraction_flag === true) {
            if (num_array.length === 1 && den_array.length === 1) {
                return origin_ast;
            }
            else {
                ast = this._fraction_expand(num_array, den_array, mixed_array);
                this.walk(ast);
                ast = this.basic_transforms_int(ast);
                ast = this.merge_tree(ast);
                return ast;
            }
        }
        else {
            return ast;
        }
    },

    /**
     * builds a new tree with the addidet fractions
     * @param {*} numerator_array
     * @param {*} denominator_array
     * @param {*} denominator_mixed_array
     * @returns
     */
    _fraction_expand: function (numerator_array, denominator_array, denominator_mixed_array) {
        var i, j, k, m,
            new_node,
            left_child,
            right_child,
            right_right_child,
            right_left_child,
            add_node,
            test_node,
            new_node_mul;
        new_node = this.create_node("node_op", "op_mul");
        left_child = this.create_node("node_op", "op_add");
        for (i = 0; i < numerator_array.length; i++) {
            new_node_mul = this.create_node("node_op", "op_mul");
            new_node_mul.push(numerator_array[i]);
            for (j = 0; j < denominator_array.length; j++) {
                if (j !== i) {
                    new_node_mul.push(denominator_array[j]);
                }
            }
            left_child.push(new_node_mul);
        }
        new_node.push(left_child);
        right_child = this.create_node("node_op", "op_exp");
        right_left_child = this.create_node("node_op", "op_mul");
        for (m = 0; m < denominator_array.length; m++) {
            right_left_child.push(denominator_array[m]);
        }
        right_child.push(right_left_child);
        right_right_child = this.create_node("node_const", -1);
        right_child.push(right_right_child);
        new_node.push(right_child);
        if (denominator_mixed_array.length > 0) {
            add_node = this.create_node("node_op", "op_add");
            add_node.push(new_node);
            for (k = 0; k < denominator_mixed_array.length; k++) {
                test_node = this.create_node("node_op", "op_add");
                test_node.push(denominator_mixed_array[k]);
                add_node.push(test_node);
            }
            return add_node;
        }
        else return new_node;
    },

    /**
     * Pulls exponent inside multiplication bracket
     * @param {*} ast
     */
    _expand_exp_mul: function (ast) {
        var i, new_child,
            new_ast = this.create_node("node_op", "op_mul");
        //creates node with direct exponent, for each node in the given multiplication
        for (i = 0; i < ast.children[0].children.length; i++) {
            new_child = this.create_node("node_op", "op_exp");
            new_child.push(ast.children[0].children[i]);
            new_child.push(this.deep_copy(ast.children[1]));
            new_ast.push(new_child);
        }
        return new_ast;
    },


    /**
     * builds a new tree with the normalized fraction
     * @param {*} numerator_array
     * @param {*} denominator_array
     * @returns
     */
    _create_normalized_fraction: function (numerator_array, denominator_array) {
        var i, new_node,
            right_child,
            right_right_child,
            right_left_child;
        new_node = this.create_node("node_op", "op_mul");
        for (i = 0; i < numerator_array.length; i++) {
            new_node.push(numerator_array[i]);
        }
        right_child = this.create_node("node_op", "op_exp");
        right_left_child = this.create_node("node_op", "op_mul");
        for (i = 0; i < denominator_array.length; i++) {
            right_left_child.push(denominator_array[i]);
        }
        right_child.push(right_left_child);
        right_right_child = this.create_node("node_const", -1);
        right_child.push(right_right_child);
        new_node.push(right_child);
        return new_node;
    },

    /**
     * normalizes fractions. This means if there is a mul node with more at least one fraction, the children will be multiplicated and then there will be created a single new fraction
     * @param {*} ast
     * @returns
     */
    combine_denominator: function (ast) {
        var i, j,
            den_array = new Array(),
            num_array = new Array(),
            fraction_flag = false;
        if (ast.type === "node_op" && ast.value === "op_mul") {
            for (i = 0; i < ast.children.length; i++) {
                if (ast.children[i].type === "node_op" && ast.children[i].value === "op_exp") {
                    if (ast.children[i].children[1].type === "node_const" && ast.children[i].children[1].value < 0) {
                        ast.children[i].children[1].value = -(ast.children[i].children[1].value);
                        den_array.push(ast.children[i]);
                        fraction_flag = true;
                        continue;
                    }
                    if (ast.children[i].children[1].type === "node_const" && ast.children[i].children[1].value > 0) {
                        num_array.push(ast.children[i]);
                        continue;
                    }
                    if (ast.children[i].children[1].type === "node_op" && ast.children[i].children[1].value === "op_mul") {
                        for (j = 0; j < ast.children[i].children[1].children.length; j++) {
                            if (ast.children[i].children[1].children[j].type === "node_const" && ast.children[i].children[1].children[j].value < 0) {
                                ast.children[i].children[1].children[j].value = -(ast.children[i].children[1].children[j].value);
                                den_array.push(ast.children[i]);
                                fraction_flag = true;
                                continue;
                            }
                            if (ast.children[i].children[1].children[j].type === "node_const" && ast.children[i].children[1].children[j].value > 0) {
                                num_array.push(ast.children[i]);
                                continue;
                            }
                        }
                    }
                    if (ast.children[i].children[1].type === "node_op" && ast.children[i].children[1].value === "op_add" || ast.children[i].children[1].type === "node_op" && ast.children[i].children[1].value === "op_execfun" || ast.children[i].children[1].type === "node_var" || ast.children[i].children[1].type === "node_const") {
                        num_array.push(ast.children[i]);
                        continue;
                    }
                }
                if (ast.children[i].type === "node_op" && ast.children[i].value === "op_add" || ast.children[i].type === "node_op" && ast.children[i].value === "op_execfun" || ast.children[i].type === "node_var" || ast.children[i].type === "node_const") {
                    num_array.push(ast.children[i]);
                }
            }
        }
        if (fraction_flag === true) {
            ast = this._create_normalized_fraction(num_array, den_array);
            ast = this.basic_transforms_int(ast);
            ast = this.merge_tree(ast);
            return ast;
        }
        else {
            return ast;
        }
    },
    /**
     * The evaluation order is
     *
     * node_const/node_var >> op_execfun >> op_neg >> op_exp >> op_mul/op_div >> op_add/op_sub >> op_map >> op_assign
     *
     * @param {*} node
     * @returns the priority of a node's operation
     */
    _get_priority: function (node) {
        switch (String(node.type)) {
            case "node_const":
            case "node_var":
                return 10;
            case "node_op":
                switch (String(node.value)) {
                    case "op_none":
                        return 0;
                    case "op_assign":
                        return 1;
                    case "op_map":
                        return 2;
                    case "op_add":
                    case "op_sub":
                        return 3;
                    case "op_mul":
                    case "op_div":
                    case "op_mod":
                        return 5;
                    case "op_neg":
                        return 4;
                    case "op_exp":
                        return 6;
                    case "op_execfun":
                        return 7;
                    default:
                        return 0;
                }
            default:
                return 0;
        }
    },

    /**
     * returns the fitting operator for an op_value
     *
     * op_add:  +
     * op_sub:  -
     * op_mul:  *
     * op_div:  /
     * op_exp:  ^
     *
     * @param {String} op_value
     * @returns {String} operator
     */
    _get_operator: function (op_value) {
        switch (String(op_value)) {
            case "op_add":
                return "+";
            case "op_sub":
                return "-";
            case "op_mul":
                return "*";
            case "op_div":
                return "/";
            case "op_mod":
                return " mod ";
            case "op_exp":
                return "^";
            case "op_assign":
                return "=";
            case "op_map":
                return "->";
            default:
                return "";
        }
    },

    /**
     * Expands an ast representing an expression of the form (a+b)^n
     * (with a, b being any expression and n a constant with natural value)
     * by using the binomial theorem
     * (a+b)^n = Sum(k = 0, n, nCr(n, k)\*a^k\*b^(n-k))
     *
     * if n > limit no expansion occurs
     *
     * @param {*} ast work ast
     * @param {Number} limit 7 by default
     * @returns the expanded ast
     */
    binomial_theorem: function (ast, limit = 7) {
        var sum, k, n, summand, exp_a, exp_b, nCr;

        if (ast.type !== "node_op" || ast.value !== "op_exp" || ast.children[0].children.length !== 2
            || ast.children[1].type !== "node_const" || !this.is_natural(ast.children[1].value)
            || ast.children[0].type !== "node_op" || ast.children[0].value !== "op_add")
            return ast;
        n = Number(ast.children[1].value);
        if (n > limit) {
            return ast;
        }
        sum = this.create_node("node_op", "op_add");

        for (k = 0; k <= n; k++) {
            summand = this.create_node("node_op", "op_mul");
            exp_a = this.create_node("node_op", "op_exp");
            exp_b = this.create_node("node_op", "op_exp");
            exp_a.push(this.deep_copy(ast.children[0].children[0]), this.create_node("node_const", k));
            exp_b.push(this.deep_copy(ast.children[0].children[1]), this.create_node("node_const", n - k));
            nCr = JXG.Math.factorial(n) / JXG.Math.factorial(n - k) / JXG.Math.factorial(k);
            summand.push(this.create_node("node_const", nCr), exp_a, exp_b);
            sum.push(summand);
        }
        return sum;
    },

    /**
     * Expands an ast representing an expression of following forms:
     * (a+b)^n, (a+b)*(a+b+c)*d, (a+b)^n\*(c+d), (a*b)^c ect...
     * by applying the binomial theorem, basic exponential transformations and/or
     * by resolving multiple multiplications.
     *
     * If the number of factors surpasses the limit the expansion will not occur.
     * In case of success the result will represent an expression of following form
     * a\*b\*c+d\*e+g\*h+...
     * @param {*} ast
     * @param {Number} limit
     * @returns the new ast
     */
    _expand_product: function (ast, limit = 10) {
        var i, j,
            expanded,
            factors = [],
            summand_count = [],
            comb_count = 1,
            rep_count,
            child, temp, current_index;

        if (ast.type !== "node_op") return ast;
        //Preparation fill the factors array
        if (ast.value === "op_exp") {
            if (ast.children[0].type !== "node_op" || ast.children[0].value === "op_execfun")
                return ast;
            if (ast.children[0].value === "op_mul")
                return this._expand_exp_mul(ast);
            if (ast.children[1].type !== "node_const" || !this.is_natural(ast.children[1].value))
                return ast;
            if (ast.children[0].value === "op_add" && ast.children[0].children.length === 2)
                return this.binomial_theorem(ast, limit); //binomial_theorem applicable
            for (i = 0; i < ast.children[1].value; i++) {
                factors.push(ast.children[0]);
            }
        } else if (ast.value === "op_mul") {
            ast.children.forEach(factor => {
                if (factor.type !== "node_op" || factor.value !== "op_exp"
                    || factor.children[0].type !== "node_op" || factor.children[0].value === "op_execfun")
                    factors.push(factor);
                else if (factor.children[0].value === "op_mul")
                    factors.push(this._expand_exp_mul(factor));
                else if (factor.children[1].type !== "node_const" || !this.is_natural(factor.children[1].value))
                    factors.push(factor);
                else if (factor.children[0].value === "op_add" && factor.children[0].children.length === 2)
                    factors.push(this.binomial_theorem(factor, limit)); //partial expansion by binomial theorem possible
                else for (i = 0; i < factor.children[1].value; i++) {
                    factors.push(factor.children[0]);
                }
            });
        } else {
            return ast;
        }
        //Factors array filled

        if (factors.length > limit) return ast;

        expanded = this.create_node("node_op", "op_add");

        //Find the number of summands the expanded product will have
        for (child of factors) {
            if (child.type === "node_op" && child.value === "op_add") {
                temp = child.children.length;
                comb_count *= temp;
                summand_count.push(temp);
            } else {
                summand_count.push(1);
            }
        }
        //attach as many products
        for (i = 0; i < comb_count; i++) {
            expanded.push(this.create_node("node_op", "op_mul"));
        }
        //add every combination of summands from different factors as factor to the summands of the expanded ast
        rep_count = 1;
        for (i = 0; i < factors.length; i++) {
            if (summand_count[i] === 1) {
                for (j = 0; j < expanded.children.length; j++) {
                    expanded.children[j].push(this.deep_copy(factors[i]));
                }
            } else {
                current_index = 0;
                for (j = 0; j < expanded.children.length; j++) {
                    expanded.children[j].push(this.deep_copy(factors[i].children[current_index]));
                    if (j % rep_count === 0) current_index = (current_index + 1) % summand_count[i];
                }
            }
            rep_count *= summand_count[i];
        }
        //reduce node
        if (expanded.children.length === 0)
            return this.create_node("node_const", 1);
        if (expanded.children.length === 1)
            return this.merge_tree(expanded.children[0]);
        return this.merge_tree(expanded);
    },

    /**
     * returns a rank for every node type
     *
     * node_const: 0
     * node_var: 1
     * op_neg: 2
     * op_exp: 3
     * op_div: 4
     * op_mul: 5
     * op_sub: 6
     * op_add: 7
     * op_execfun: 8
     *
     * @param {*} node
     * @returns {Number} rank
     */
    _node_type_rank: function (node) {
        if (node.type === "node_const") return 0;
        if (node.type === "node_var") return 1;
        if (node.type === "node_op") {
            switch (String(node.value)) {
                case "op_neg": return 2;
                case "op_exp": return 3;
                case "op_div": return 4;
                case "op_mul": return 5;
                case "op_sub": return 6;
                case "op_add": return 7;
                case "op_execfun": return 8;
                default:
                    return;
            }
        }
    },

    /**
     * Compares two sub ASTs
     *
     * Nodes of different types: compared by type rank
     * node_const: compared by value
     * node_var: alphabetical
     * op_execfun: compared by name or by parameters
     * other node_op: compared by their children
     *
     * @param {*} ast_1
     * @param {*} ast_2
     * @returns {Number}
     */
    _op_compare: function (ast_1, ast_2) {
        var i, comp,
            type_comp = this._node_type_rank(ast_1) - this._node_type_rank(ast_2);

        if (type_comp !== 0) return type_comp;
        if (ast_1.type === "node_const")
            return Number(ast_1.value) - Number(ast_2.value);
        if (ast_1.type === "node_var")
            return ast_1.value.localeCompare(ast_2.value);
        if (ast_1.type === "node_op") {
            if (ast_1.value === "op_execfun") {
                type_comp = this._op_compare(ast_1.children[0], ast_2.children[0]);
                if (type_comp !== 0) return type_comp;

                for (i = 0; i < ast_1.children[1].length; i++) {
                    if (ast_2.children[1][i] === undefined) return 1;
                    type_comp = this._op_compare(ast_1.children[1][i], ast_2.children[1][i]);
                    if (type_comp !== 0) return type_comp;
                }
                return type_comp;

            } if (ast_1.value === "op_exp") {
                return this._compare_factor(ast_1, ast_2);
            } if (ast_1.value === "op_mul") {
                return this._compare_summand(ast_1, ast_2);
            } if (ast_1.value === "op_add") {
                for (i = 0; i < ast_1.children.length && i < ast_2.children.length; i++) {
                    comp = this._compare_summand(ast_1.children[i], ast_2.children[i]);
                    if (comp !== 0) return comp;
                }
                return ast_1.children.length - ast_2.children.length;
            } else {
                for (i = 0; i < ast_1.children.length; i++) {
                    if (ast_2.children[i] === undefined) return 1;
                    type_comp = this._op_compare(ast_1.children[i], ast_2.children[i]);
                    if (type_comp !== 0) return type_comp;
                }
                return type_comp;
            }
        }
        return 0;
    },

    /**
     * auxiliary for compare summand
     * gets the degree, nodes containing variables, nodes containing parameters, other terms, factor
     * @param {*} ast
     * @param {*} var_names op_var that are treated as variables (others are parameters)
     * @returns {Array} [degree, variable_nodes, parameter_nodes, other, factor]
     */
    _compare_summand_op_aux(ast, var_names = undefined) {
        var degree = 0,
            variable_nodes = [],
            parameter_nodes = [],
            rest = [],
            constant = 1;

        if (ast.type === "node_op" && ast.value === "op_mul") {
            ast.children.forEach(factor => {
                if (factor.type === "node_var") {
                    if (var_names === undefined || var_names.includes(factor.value)) {
                        variable_nodes.push(factor);
                        degree++;
                    } else {
                        parameter_nodes.push(factor);
                    }
                } else if (factor.type === "node_op" && factor.value === "op_exp" && factor.children[0].type === "node_var"
                    && factor.children[1].type === "node_const" && this.is_natural(factor.children[1].value)) {
                    if (var_names === undefined || var_names.includes(factor.children[0].value)) {
                        variable_nodes.push(factor);
                        degree += Number(factor.children[1].value);
                    } else {
                        parameter_nodes.push(factor);
                    }
                } else if (factor.type === "node_const") {
                    constant *= Number(factor.value);
                } else {
                    rest.push(factor);
                }
            });
        } else if (ast.type === "node_var") {
            if (var_names === undefined || var_names.includes(ast.value)) {
                variable_nodes.push(ast);
                degree++;
            } else {
                parameter_nodes.push(ast);
            }
        } else if (ast.type === "node_op" && ast.value === "op_exp" && ast.children[0].type === "node_var"
            && ast.children[1].type === "node_const" && this.is_natural(ast.children[1].value)) {
            if (var_names === undefined || var_names.includes(ast.children[0].value)) {
                variable_nodes.push(ast);
                degree += Number(ast.children[1].value);
            } else {
                parameter_nodes.push(ast);
            }
        } else if (ast.type === "node_const") {
            constant *= Number(ast.value);
        } else {
            rest.push(ast);
        }
        rest.sort(this._op_compare);
        return [degree, variable_nodes, parameter_nodes, rest, constant];
    },

    /**
     * Comparison function for summand (usually a product)
     * Order by (most important rule first):
     *  ->summand with higher degree first
     *  ->summand with fewer variables first
     *  ->compare by variables
     *  ->summand with more parameters
     *  ->compare by parameters
     *  ->compare other terms
     *  ->compare const factor
     * @param {*} ast_1
     * @param {*} ast_2
     * @param {*} var_names names of all op_var values that will be treated as variables (others are parameters)
     * @returns {Number}
     */
    _compare_summand: function (ast_1, ast_2, var_names = []) {
        var i, comp, comp_temp,
            [degree_1, variable_nodes_1, parameter_nodes_1, rest_1, constant_1] = this._compare_summand_op_aux(ast_1, var_names),
            [degree_2, variable_nodes_2, parameter_nodes_2, rest_2, constant_2] = this._compare_summand_op_aux(ast_2, var_names),
            ret;

        if (degree_1 - degree_2 !== 0) return degree_2 - degree_1;
        if (variable_nodes_1.length !== variable_nodes_2.length) return variable_nodes_1.length - variable_nodes_2.length;
        for (i = 0; i < variable_nodes_1.length; i++) {
            comp_temp = this._compare_factor(variable_nodes_1[i], variable_nodes_2[i]);
            if (comp_temp !== 0) return comp_temp;
        }
        if (parameter_nodes_1.length !== parameter_nodes_2.length) return parameter_nodes_2.length - parameter_nodes_1.length;
        for (i = 0; i < parameter_nodes_1.length; i++) {
            comp_temp = this._compare_factor(parameter_nodes_1[i], parameter_nodes_2[i]);
            if (comp_temp !== 0) return comp_temp;
        }
        for (i = 0; i < rest_1.length && i < rest_2.length; i++) {
            comp = this._op_compare(rest_1[i], rest_2[i]);
            if (comp !== 0) {
                ret = comp;
                break;
            }
        }
        ret = rest_2.length - rest_1.length;
        if (ret !== 0) {
            return ret;
        } else {
            return constant_1 - constant_2;
        }
    },

    /**
     * Comparison function for user sort
     * Compares two factors of a product
     * Order by (most important rule first):
     *  ->constants before parameters before variables (defined in array)
     *  ->other op than op_exp last
     *  ->lower exponents before higher exponents
     * @param {*} ast_1
     * @param {*} ast_2
     * @param {*} var_names names of all op_var values that will be treated as variables (others are parameters)
     * @returns {Number}
     */
    _compare_factor: function (ast_1, ast_2, var_names = []) {
        var comp, is_var_1, is_var_2;

        switch (String(ast_1.type)) {
            case "node_op":
                if (ast_1.value === "op_exp") {
                    if (ast_2.type === "node_op" && ast_2.value === "op_exp") {
                        comp = this._compare_factor(ast_1.children[0], ast_2.children[0], var_names);
                        return comp !== 0 ? comp : this._compare_factor(ast_1.children[1], ast_2.children[1], var_names);
                    }
                    if (ast_2.type === "node_op") return -1;
                    if (ast_2.type === "node_var" || ast_2.type === "node_const") {
                        comp = this._compare_factor(ast_1.children[0], ast_2, var_names);
                        return comp !== 0 ? comp : 1;//this._compare_factor(ast_1.children[1], this.create_node("node_const", 1));
                    }
                    return 1;
                }
                if (ast_2.type === "node_op") {
                    if (ast_2.value === "op_exp") return 1;
                    return this._op_compare(ast_1, ast_2, var_names);
                }
                if (ast_2.type === "node_var") {
                    return 1;
                }
                if (ast_2.type === "node_const") {
                    return 1;
                }
                return -this._compare_factor(ast_2, ast_1, var_names);
            case "node_var":
                if (ast_2.type === "node_var") {
                    if (var_names !== undefined) {
                        is_var_1 = var_names.includes(ast_1.value);
                        is_var_2 = var_names.includes(ast_2.value);
                        if (is_var_1 && is_var_2 || !is_var_1 && !is_var_2) {
                            return ast_1.value.localeCompare(ast_2.value);
                        } else {
                            return is_var_1 ? 1 : -1;
                        }
                    }
                    return ast_1.value.localeCompare(ast_2.value);
                }
                if (ast_2.type === "node_const") {
                    return 1;
                }
                return -this._compare_factor(ast_2, ast_1, var_names);
            case "node_const":
                if (ast_2.type === "node_const") {
                    return Number(ast_1.value) - Number(ast_2.value);
                }
                return -this._compare_factor(ast_2, ast_1);
            default:
                return undefined;
        }
    },

    /**
     * Will do the polynomial division using the expressions represented by
     *  the passed dividend_ast and divisor_ast as dividend and divisor
     * The divisors summand with highest degree shouldn't contain a factor 0
     *  => simplify_elementary must be called first
     *
     *
     * @param {*} dividend_ast
     * @param {*} divisor_ast
     * @param {*} var_name -
     * @returns an Array containg the result, rest and divisor in this order
     */
    _polynomial_division: function (dividend_ast, divisor_ast, var_name = "x") {
        var result,
            dividend, rest_dividend,
            divisor = this._make_mononom_array(divisor_ast, var_name),
            non_polynom_rest,
            parent_sum_node;

        if (divisor.length === 0 || divisor[0] !== undefined) {
            return [this.create_node("node_const", 0), dividend_ast, divisor_ast];
        }
        divisor.shift(); //remove the rest element of divisor, divisor[0] (is undefined)

        dividend = this._make_mononom_array(dividend_ast, var_name);
        non_polynom_rest = dividend.shift(); //add the non polynom part of the divident to the rest

        result = this._make_polynom_ast(this._polynomial_division_on_arrays(dividend, divisor), var_name);
        rest_dividend = this._make_polynom_ast(dividend, var_name);

        if (non_polynom_rest !== undefined) {
            if (rest_dividend.type === "node_op" && rest_dividend.value === "op_add") {
                rest_dividend.push(this.deep_copy(non_polynom_rest));
            } else {
                parent_sum_node = this.create_node("node_op", "op_add");
                parent_sum_node.push(rest_dividend, this.deep_copy(non_polynom_rest));
                rest_dividend = parent_sum_node;
            }
        }
        result = this.basic_transforms_int(result);
        rest_dividend = this.basic_transforms_int(rest_dividend);

        return [result, rest_dividend, divisor_ast];
    },

    /**
     * Expects two mononom arrays
     * A mononom array is an array, which every element has these properties
     *  -const_factor: ast representation of the factor of a polynom that is independent of the variable
     *  -degree: degree of the mononom as numeric value
     *
     * the rest element that is created by _create_mononom_array into its first element needs to be
     * shifted out
     *
     * the passed dividend will contain the rest of this division after the function has finished
     *
     * @param {*} dividend - mononom_array
     * @param {*} divisor - mononom_array
     * @returns an mononom array representing the result
     */
    _polynomial_division_on_arrays(dividend, divisor) {
        var i,
            degree_diff, factor_numerator, factor,
            new_coefficient, coeff_numerator, left_summand, right_summand, coeff_denominator,
            summand, new_summand,
            result = [];

        if (divisor.degree === 0) return result;
        while (dividend.length > 0 && dividend[0].degree >= divisor[0].degree) {
            degree_diff = dividend[0].degree - divisor[0].degree;
            factor_numerator = dividend[0].const_factor;
            factor = this.create_node("node_op", "op_mul");
            factor.push(this.deep_copy(factor_numerator), this.create_node("node_op", "op_exp"));
            factor.children[1].push(this.deep_copy(divisor[0].const_factor), this.create_node("node_const", -1));
            factor = this.merge_tree(factor);
            //add new summand to the result
            result.push({ const_factor: factor, degree: degree_diff });
            //subtract new_summand times divisor

            dividend.shift();//first summand can be removed
            for (i = 1; i < divisor.length; i++) {
                summand = dividend.find(summand => summand.degree === divisor[i].degree + degree_diff);
                if (summand !== undefined) {
                    new_coefficient = this.create_node("node_op", "op_mul");
                    coeff_numerator = this.create_node("node_op", "op_add");
                    left_summand = this.create_node("node_op", "op_mul");
                    right_summand = this.create_node("node_op", "op_mul");
                    coeff_denominator = this.create_node("node_op", "op_exp");

                    left_summand.push(summand.const_factor, this.deep_copy(divisor[0].const_factor));
                    right_summand.push(this.create_node("node_const", -1), this.deep_copy(divisor[i].const_factor), this.deep_copy(factor_numerator));
                    coeff_numerator.push(left_summand, right_summand);
                    coeff_denominator.push(this.deep_copy(divisor[0].const_factor), this.create_node("node_const", -1));
                    new_coefficient.push(coeff_numerator, coeff_denominator);
                    summand.const_factor = this.merge_tree(new_coefficient);
                } else {
                    new_summand = { const_factor: this.create_node("node_op", "op_mul"), degree: divisor[i].degree + degree_diff };
                    new_summand.const_factor.push(this.create_node("node_const", -1), this.deep_copy(factor), this.deep_copy(divisor[i].const_factor));
                    new_summand = this.merge_node(new_summand);
                    dividend.push(this.basic_transforms_int(this.simplify_trivial(this.merge_tree(new_summand))));
                    dividend.sort((m1, m2) => m2.degree - m1.degree);
                }
            }
        }
        return result;
    },

    /*
    *
     * creates an array containing all mononoms of the passed polynom
     * a mononom has two properties
     *  -> const_factor - the constant factor
     *  -> degree - the degree of a mononom Bsp x^3 degree === 3
     * The first element of the returned array is a sum of all non mononom summands or undefined if
     * there is none
     *
     * @param {*} ast
     * @param {String} var_name
     * @returns {any[]}
     */
    _make_mononom_array: function (polynom_ast, var_name = "x") {
        var rest, const_mononom, mononoms, summands;

        polynom_ast = this.merge_tree(polynom_ast);
        rest = this.create_node("node_op", "op_add");
        const_mononom = this.create_node("node_op", "op_add");
        mononoms = [];
        summands = ((polynom_ast.type !== "node_op" || polynom_ast.value !== "op_add") ? [polynom_ast] : polynom_ast.children);
        //iterate over each summand
        summands.forEach((child) => {
            if (!this._contains_var(child, [var_name])) {
                const_mononom.push(child);  //we are finished because we have an independent term
            } else if (child.type === "node_var") {//the variables value has to be var_name
                let found = mononoms.find(mononom => mononom.degree === 1);
                if (found === undefined) {
                    mononoms.push({ const_factor: this.create_node("node_const", 1), degree: 1 });
                } else {
                    let const_factor_sum = this.create_node("node_op", "op_add");
                    const_factor_sum.push(this.create_node("node_const", 1), found.const_factor);
                    const_factor_sum = this.merge_tree(const_factor_sum);
                    found.const_factor = const_factor_sum;
                }
            } else if (child.type === "node_op") {
                if (child.value === "op_mul") {
                    let m_const_factor = this.create_node("node_op", "op_mul"),
                        m_degree = 0,
                        found;
                    //find all undependent factors and the degree
                    for (let factor_i of child.children) {
                        if (!this._contains_var(factor_i, [var_name])) {
                            m_const_factor.push(factor_i);
                        } else if (factor_i.type === "node_var")
                            m_degree++;
                        else if (factor_i.type === "node_op"
                            && factor_i.value === "op_exp"
                            && factor_i.children[
                                0].type === "node_var"
                            && factor_i.children[1].type === "node_const"
                            && this.is_natural(factor_i.children[1].value)) {
                            m_degree += parseInt(factor_i.children[1].value);
                        } else {
                            rest.push(child);   //child is not a mononom
                            return;
                        }
                    }
                    //node_op should have at least two children
                    if (m_const_factor.children.length === 0) {
                        m_const_factor = this.create_node("node_const", 1); //replace by const 1
                    } else if (m_const_factor.children.length === 1) {
                        m_const_factor = m_const_factor.children[0];
                    }
                    found = mononoms.find(mononom => mononom.degree === m_degree);
                    if (found === undefined)
                        mononoms.push({ const_factor: m_const_factor, degree: m_degree });
                    else {
                        let const_factor_sum = this.create_node("node_op", "op_add");
                        const_factor_sum.push(m_const_factor, found.const_factor);
                        const_factor_sum = this.merge_tree(const_factor_sum);
                        found.const_factor = const_factor_sum;
                    }
                } else if (child.type === "node_op" && child.value === "op_exp"
                    && child.children[0].type === "node_var" && child.children[1].type === "node_const"
                    && this.is_natural(child.children[1].value)) {
                    mononoms.push({ const_factor: this.create_node("node_const", 1), degree: parseInt(child.children[1].value) });
                } else {
                    rest.push(child);
                }
            }
        });
        //Remove node_op with only one child
        if (const_mononom.children.length === 1) {
            mononoms.push({ const_factor: const_mononom.children[0], degree: 0 });
        } else if (const_mononom.children.length > 1) {
            mononoms.push({ const_factor: const_mononom, degree: 0 });
        }
        mononoms.sort((m1, m2) => m2.degree - m1.degree);

        if (rest.children.length === 0) {
            mononoms.unshift(undefined);
        } else if (rest.children.length === 1) {
            mononoms.unshift(rest.children[0]);
        } else {
            mononoms.unshift(rest);
        }
        return mononoms;
    },

    /**
     * duplicates the passed mononom array
     * @param {*} mononom_array
     * @returns
     */
    _copy_mononom_array: function (mononom_array) {
        var copy = [];
        mononom_array.forEach(mononom => {
            if (mononom.type !== undefined) copy.push(this.deep_copy(mononom));
            else {
                copy.push({ const_factor: this.deep_copy(mononom.const_factor), degree: mononom.degree });
            }
        });
        return copy;
    },

    /**
     * Transforms the array representation of a polynomial back to a simplify work tree
     * @param {*} mononom_array
     * @param {*} var_name
     * @returns
     */
    _make_polynom_ast: function (mononom_array, var_name = "x") {
        var ast;

        if (mononom_array.length === 0) {
            return this.create_node("node_const", 0);
        } else if (mononom_array.length === 1) {
            ast = this.create_node("node_op", "op_mul");
            ast.push(this.deep_copy(mononom_array[0].const_factor), this.create_node("node_op", "op_exp"));
            ast.children[1].push(this.create_node("node_var", var_name), this.create_node("node_const", mononom_array[0].degree));
            return ast;
        } else {
            ast = this.create_node("node_op", "op_add");
            mononom_array.forEach(mononom => {
                let new_summand = this.create_node("node_op", "op_mul");
                new_summand.push(this.deep_copy(mononom.const_factor), this.create_node("node_op", "op_exp"));
                new_summand.children[1].push(this.create_node("node_var", var_name), this.create_node("node_const", mononom.degree));
                ast.push(new_summand);
            });
            return ast;
        }
    },

    /**
     * prints a polynomial in its mononom array representation on the console
     * @param {*[]} array
     */
    print_mononom_array: function (array) {
        var i;
        console.log("---Print Mononom Array---");
        if (array[0] !== undefined && array[0].type !== undefined) {
            console.log(array[0] !== undefined ? this.compile(array[0]) : undefined);
            for (i = 1; i < array.length; i++) {
                console.log("Factor: " + this.compile(array[i].const_factor) + ", Degree: " + array[i].degree);
            }
        } else {
            for (i = 0; i < array.length; i++) {
                console.log("Factor: " + this.compile(array[i].const_factor) + ", Degree: " + array[i].degree);
            }
        }
    },
    /**
     * tests the ast for passed variables
     *
     * @param {*} ast - the AST
     * @param {String[]} var_names - array containing the names of the variables
     * @returns {boolean}
     */
    _contains_var: function (ast, var_names = ["x"]) {
        if (ast.type === "node_const") return false;
        if (ast.type === "node_var") return var_names.some((var_name) => ast.value === var_name);
        if (ast.type === "node_op") {
            if (ast.value === "op_map" || ast.value === "op_assign")
                return this._contains_var(ast.children[1], var_names);
            else if (ast.value === "op_execfun")
                return ast.children[1].some(child => this._contains_var(child, var_names));
            else
                return ast.children.some(child => this._contains_var(child, var_names));
        }
    },

    /**
     * search recurrently for contained variables in the passed ast
     *
     * @param {*} ast
     * @param {*} contained an array to add the variable names to (not necessary)
     * @returns an array containing all variable names
     */
    _get_contained_variables: function (ast, contained = []) {
        if (ast.type === "node_var" && !contained.includes(ast.value)) {
            contained.push(ast.value);
        } else if (ast.type === "node_op") {
            if (ast.value === "op_map" || ast.value === "op_assign")
                this._get_contained_variables(ast.children[1], contained);
            else if (ast.value === "op_execfun")
                ast.children[1].forEach(child => this._get_contained_variables(child, contained));
            else
                ast.children.forEach(child => this._get_contained_variables(child, contained));
        }
        return contained;
    },

    /**
     * Tests if AST is a node_const with an assigned value of 0
     * @param {*} ast
     * @returns {boolean} true if expressions is equivalent to zero
     */
    _is_zero: function (ast) {
        return ast.type === "node_const" && Number(ast.value) === 0;
    },

    /**
     * Simplifies trivial operation:
     *  - multiplication with zero/one
     *  - addition with zero
     *  - exponential with base 1, exponent zero, exponent one, base zero (if exponent positive)
     * @param {*} ast
     * @returns
     */
    simplify_trivial: function (ast) {
        if (ast.type === "node_op") {
            switch (String(ast.value)) {
                case "op_add":
                    ast.set_children(ast.children.map((factor) => {
                        return this.simplify_trivial(factor);
                    }).filter(factor => {
                        return factor.type !== "node_const" || Number(factor.value) !== 0;
                    }));

                    if (ast.children.length === 0) {
                        return this.create_node("node_const", 0);
                    }
                    else if (ast.children.length === 1) {
                        return ast.children[0];
                    }
                    else {
                        return ast;
                    }

                case "op_mul":
                    if (ast.children.some(factor => factor.type === "node_const" && Number(factor.value) === "0")) {
                        return this.create_node("node_const", 0);
                    }
                    ast.set_children(ast.children.map((factor) => {
                        return this.simplify_trivial(factor);
                    }).filter(factor => {
                        return factor.type !== "node_const" || Number(factor.value) !== 1;
                    }));
                    if (ast.children.some(factor => factor.type === "node_const" && Number(factor.value) === "0")) {
                        return this.create_node("node_const", 0);
                    }

                    if (ast.children.length === 0) {
                        return this.create_node("node_const", 1);
                    }
                    else if (ast.children.length === 1) {
                        return ast.children[0];
                    }
                    else {
                        return ast;
                    }

                case "op_exp":
                    ast.set_children(ast.children.map(factor => this.simplify_trivial(factor)));
                    if (ast.children[1].type === "node_const" && Number(ast.children[1].value) === 0) {
                        return this.create_node("node_const", 1);
                    }
                    if (ast.children[1].type === "node_const" && Number(ast.children[1].value) === 1) {
                        return ast.children[0];
                    }
                    if (ast.children[0].type === "node_const" && Number(ast.children[0].value) === 1) {
                        return this.create_node("node_const", 1);
                    }
                    if (ast.children[0].type === "node_const" && Number(ast.children[0].value) === 0) {
                        if (ast.children[1].type === "node_const" && parseFloat(ast.children[1].value) >= 0) {
                            return this.create_node("node_const", 0);
                        }
                    }
                    return ast;



                default:
                    ast.set_children(ast.children.map(factor => this.simplify_trivial(factor)));
                    return ast;
            }
        }
        return ast;
    },

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
            (node.type === "node_op" &&
                (node.value === "op_add" ||
                    node.value === "op_sub" ||
                    node.value === "op_mul" ||
                    node.value === "op_div" ||
                    node.value === "op_neg" ||
                    node.value === "op_execfun" ||
                    node.value === "op_exp")) ||
            node.type === "node_var" ||
            node.type === "node_const"
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
                        this.createNode("node_var", "sqrt"),
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
                    this.createNode("node_var", "cos"),
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
                        this.createNode("node_var", "sin"),
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
                            this.createNode("node_var", "cos"),
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
                                this.createNode("node_var", "sin"),
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
                                this.createNode("node_var", "log"),
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
                        this.createNode("node_var", "sqrt"),
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
                            this.createNode("node_var", "sqrt"),
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
                    this.createNode("node_var", "cosh"),
                    [Type.deepCopy(arg[0])]
                );
                break;

            case "cosh":
                newNode = this.createNode(
                    "node_op",
                    "op_execfun",
                    this.createNode("node_var", "sinh"),
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
                            this.createNode("node_var", "tanh"),
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
                        this.createNode("node_var", "sqrt"),
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
                        this.createNode("node_var", "sqrt"),
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
                        if (node.children[0].value === "pow") {
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
                                        this.createNode("node_var", "log"),
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
                        if (node.children[0] && node.children[0].value === "D") {
                            /*
                             * Distinguish the cases:
                             *   D(f, x) where f is map -> isMap = true
                             * and
                             *   D(2*x, x), D(sin(x), x), ...  -> isMap = false
                             */
                            isMap = false;
                            if (node.children[1][0].type === "node_var") {
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
                                    varname = "x";
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
                            if (parent.type === "node_op" && parent.value === "op_assign") {
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
    }
};

export default JXG.CAS;
