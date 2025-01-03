describe("Test testing", function () {
    var board, target,
        CAS;

    document.getElementsByTagName('body')[0].innerHTML = '<div id="jxgbox" style="width: 500px; height: 500px;"></div>';
    target = document.getElementById('jxgbox');
    board = JXG.JSXGraph.initBoard('jxgbox', {boundingbox: [-5, 5, 5, -5]});
    CAS = board.jc.CAS;

    it("simplify_elementary_integer_compute0", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = '1+0;' 
        expected_outcome = '1;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_int(ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("simplify_elementary_integer_compute1", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = '1+2;' 
        expected_outcome = '3;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_int(ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("simplify_elementary_integer_compute2", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = '1*0;' 
        expected_outcome = '0;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_int(ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("simplify_elementary_integer_compute3", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = '1*2;' 
        expected_outcome = '2;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_int(ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("simplify_elementary_integer_compute4", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = 'x*3*2;' 
        expected_outcome = 'x*6;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_int(ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });


    it("simplify_elementary_integer_compute5", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = '5^2;' 
        expected_outcome = '25;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_int(ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("simplify_elementary_integer_compute6", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = '0^0;' 
        expected_outcome = '1;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_int(ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("simplify_elementary_integer_compute7", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = 'x^0;' 
        expected_outcome = '1;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_int(ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("simplify_elementary_integer_compute8", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = 'x^1;' 
        expected_outcome = 'x;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_int(ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("simplify_elementary_integer_compute9", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = '1^x;' 
        expected_outcome = '1^x;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_int(ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("simplify_elementary_integer_compute10", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = 'x*5*(2+2+(42)^0);' 
        expected_outcome = 'x*25;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_int(ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("simplify_elementary_integer_compute11", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = '1+5.5;' 
        expected_outcome = '1+5.5;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_int(ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("simplify_elementary_log1", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = 'ln(1);' 
        expected_outcome = '0;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_int(ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("simplify_elementary_log2", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = 'log(1);' 
        expected_outcome = '0;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_int(ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("simplify_elementary_log3", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = 'log(1, 42);' 
        expected_outcome = '0;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_int(ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("simplify_elementary_log4", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = 'log(EULER);' 
        expected_outcome = '1;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_int(ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("simplify_elementary_log5", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = 'ln(EULER);' 
        expected_outcome = '1;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_int(ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("simplify_elementary_log6", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = 'log(5,5);' 
        expected_outcome = '1;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_int(ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("simplify_elementary_log7", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = 'log(x,x);' 
        expected_outcome = '1;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_int(ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });
    
    it("simplify_elementary_log8", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = 'log(x+1,x+1);' 
        expected_outcome = '1;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_int(ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("simplify_elementary_log9", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = 'log(x+1+ln(1),x+log(42*x,42*x));' 
        expected_outcome = '1;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_int(ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("simplify_elementary_fraction1", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = '5*36/24;' 
        expected_outcome = '2^-1*15;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_int(ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("expand_log1", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = 'log(x*2);' 
        expected_outcome = 'log(x)+log(2);'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast.children[1] = CAS.expand_log_node(ast.children[1]);
        // print both ast, for debugging purposes
        // console.log("\nTest_Name:\nexpand_log1" + "\n" + "input: " + CAS.compile(ast) + "expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("expand_log2", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = 'ln(x*y*2);' 
        expected_outcome = 'log(x)+log(y)+log(2);'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast.children[1] = CAS.expand_log_node(ast.children[1]);
        // print both ast, for debugging purposes
        // console.log("\nTest_Name:\nexpand_log2" + "\n" + "input: " + CAS.compile(ast) + "expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("expand_log3", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = 'log(x*y,5);' 
        expected_outcome = 'log(x,5)+log(y,5);'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast.children[1] = CAS.expand_log_node(ast.children[1]);
        // print both ast, for debugging purposes
        // console.log("\nTest_Name:\nexpand_log3" + "\n" + "input: " + CAS.compile(ast) + "expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("expand_log4", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = 'log(x^y);' 
        expected_outcome = 'y*log(x);'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast.children[1] = CAS.expand_log_node(ast.children[1]);
        // print both ast, for debugging purposes
        // console.log("\nTest_Name:\nexpand_log4" + "\n" + "input: " + CAS.compile(ast) + "expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("expand_log5", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = 'ln(x^y);' 
        expected_outcome = 'y*log(x);'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast.children[1] = CAS.expand_log_node(ast.children[1]);
        // print both ast, for debugging purposes
        // console.log("\nTest_Name:\nexpand_log5" + "\n" + "input: " + CAS.compile(ast) + "expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("expand_log6", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = 'log(x^y,z);' 
        expected_outcome = 'y*log(x,z);'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast.children[1] = CAS.expand_log_node(ast.children[1]);
        // print both ast, for debugging purposes
        // console.log("\nTest_Name:\nexpand_log5" + "\n" + "input: " + CAS.compile(ast) + "expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("expand_exponent_mul1", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = '(x*y)^2;' 
        expected_outcome = 'x^2*y^2;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast.children[1] = CAS._expand_exp_mul(ast.children[1]);
        // print both ast, for debugging purposes
        // console.log("\nTest_Name:\nexpand_exponent_mul1" + "\n" + "input: " + CAS.compile(ast) + "expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("expand_exponent_mul2", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = '(x*2)^z;' 
        expected_outcome = 'x^z*2^z;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast.children[1] = CAS._expand_exp_mul(ast.children[1]);
        // print both ast, for debugging purposes
        // console.log("\nTest_Name:\nexpand_exponent_mul2" + "\n" + "input: " + CAS.compile(ast) + "expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("compute_floats_recursive_add1", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = '0.5+0.5;' 
        expected_outcome = '1;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_float(ast);
        // print both ast, for debugging purposes
        // console.log("\nTest_Name:\ncompute_floats_recursive_add1" + "\n" + "input: " + CAS.compile(ast) + "expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("compute_floats_recursive_add2", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = '6+2.5+EULER+x;' 
        expected_outcome = 'EULER+x+8.5;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_float(ast);
        // print both ast, for debugging purposes
        // console.log("\nTest_Name:\ncompute_floats_recursive_add2" + "\n" + "input: " + CAS.compile(ast) + "expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("compute_floats_recursive_mul1", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = '2*1.5;' 
        expected_outcome = '3;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_float(ast);
        // print both ast, for debugging purposes
        // console.log("\nTest_Name:\ncompute_floats_recursive_mul1" + "\n" + "input: " + CAS.compile(ast) + "expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("compute_floats_recursive_mul2", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = '1.5*EULER*10*x;' 
        expected_outcome = 'EULER*x*15;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_float(ast);
        // print both ast, for debugging purposes
        // console.log("\nTest_Name:\ncompute_floats_recursive_mul3" + "\n" + "input: " + CAS.compile(ast) + "expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("compute_floats_recursive_exp1", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = '(0.5)^2;' 
        expected_outcome = '0.25;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_float(ast);
        // print both ast, for debugging purposes
        // console.log("\nTest_Name:\ncompute_floats_recursive_exp1" + "\n" + "input: " + CAS.compile(ast) + "expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("compute_floats_recursive_exp2", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = 'x^5;' 
        expected_outcome = 'x^5;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_float(ast);
        // print both ast, for debugging purposes
        // console.log("\nTest_Name:\ncompute_floats_recursive_exp3" + "\n" + "input: " + CAS.compile(ast) + "expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("compute_floats_recursive_exp3", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = '5^1.5;' 
        expected_outcome = '5^1.5;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_float(ast);
        // print both ast, for debugging purposes
        // console.log("\nTest_Name:\ncompute_floats_recursive_exp4" + "\n" + "input: " + CAS.compile(ast) + "expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("compute_floats_recursive_decimals1", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = '1/2;' 
        expected_outcome = '0.5;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_float(ast, {form : "decimals"});
        // print both ast, for debugging purposes
        // console.log("\nTest_Name:\ncompute_floats_recursive_decimals1" + "\n" + "input: " + CAS.compile(ast) + "expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("compute_floats_recursive_decimals2", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = '1/4 + 1/4;' 
        expected_outcome = '0.5;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.basic_transforms_float(ast, {form : "decimals"});
        // print both ast, for debugging purposes
        // console.log("\nTest_Name:\ncompute_floats_recursive_decimals2" + "\n" + "input: " + CAS.compile(ast) + "expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("simplify_options_method_strong_test1", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = '(x^2+2*x+1)/(x+1);' 
        expected_outcome = 'x+1;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.simplify(ast, {method : "strong"});
        // print both ast, for debugging purposes
        // console.log("\nTest_Name:\nsimplify_options_method_strong_test1" + "\n" + "input: " + CAS.compile(ast) + "expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("simplify_options_method_strong_test2", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = '(x^2+2*x+1)/(x+1) + 5;' 
        expected_outcome = 'x+6;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.simplify(ast, {method : "strong"});
        // print both ast, for debugging purposes
        // console.log("\nTest_Name:\nsimplify_options_method_strong_test2" + "\n" + "input: " + CAS.compile(ast) + "expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("simplify_options_method_medium_test1", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = '2*x+2*y;' 
        expected_outcome = '2*(x+y);'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.simplify(ast, {method : "medium"});
        // print both ast, for debugging purposes
        // console.log("\nTest_Name:\nsimplify_options_method_medium_test1" + "\n" + "input: " + CAS.compile(ast) + "expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("simplify_options_method_medium_test2", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = '(x^2+2*x+1)/(x+1);' 
        expected_outcome = '(2*x+x^2+1)/(x+1);'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        outcome_ast = board.jc.getAST(expected_outcome);
        //outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.simplify(ast, {method : "medium"});
        // print both ast, for debugging purposes
        // console.log("\nTest_Name:\nsimplify_options_method_medium_test2" + "\n" + "input: " + CAS.compile(ast) + "expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("simplify_options_method_weak_test1", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = '1+1;' 
        expected_outcome = '2;'
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.simplify(ast, {method : "weak"});
        // print both ast, for debugging purposes
        // console.log("\nTest_Name:\nsimplify_options_method_weak_test1" + "\n" + "input: " + CAS.compile(ast) + "expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("simplify_input_options1", function() {
        var ast;
        ast = CAS.simplify(5);
        // print both ast, for debugging purposes
        // console.log("\nTest_Name:\nsimplify_input_options1" + "\n" + "input type: " + String(ast) + " expected: " + "5");
        // test if these are actually equal to each other
        expect(ast === 5).toEqual(true);
    });

    it("simplify_input_options2", function() {
        var ast_array = [], str = "", test1 = false, test2 = false, test3 = false, outcome_ast1, outcome_ast2, outcome_ast3;
        ast_array.push(board.jc.getAST("1+1;"));
        ast_array.push(board.jc.getAST("x+x;"));
        ast_array.push(board.jc.getAST("log(1);"));
        ast_array = CAS.simplify(ast_array);
        for(let i = 0; i < ast_array.length; i++) {
            str += CAS.compile(ast_array[i]);
        }
        outcome_ast1 = board.jc.getAST("2;");
        outcome_ast1 = CAS.to_work_tree(outcome_ast1);

        outcome_ast2 = board.jc.getAST("2*x;");
        outcome_ast2 = CAS.to_work_tree(outcome_ast2);

        outcome_ast3 = board.jc.getAST("0;");
        outcome_ast3 = CAS.to_work_tree(outcome_ast3);

        test1 = CAS.equals(ast_array[0], outcome_ast1)
        test2 = CAS.equals(ast_array[1], outcome_ast2)
        test3 = CAS.equals(ast_array[2], outcome_ast3)

        // console.log("\nTest_Name:\nsimplify_input_options2" + "\n" + "input: " + str + "expected: " + CAS.compile(outcome_ast1) + ", " + CAS.compile(outcome_ast2) + ", " + CAS.compile(outcome_ast3));
        // test if these are actually equal to each other
        expect(test1&&test2&&test3).toEqual(true);

    });

    it("simplify_input_options3", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        function_string = '40+2;' 
        expected_outcome = '42;'
        // convert the strings into trees
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.simplify(function_string);
        // print both ast, for debugging purposes
        // console.log("\nTest_Name:\nsimplify_input_options3" + "\n" + "input: " + CAS.compile(ast) + "expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });


});
