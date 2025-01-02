describe("Test testing", function () {
    var board, target,
        CAS;

    document.getElementsByTagName('body')[0].innerHTML = '<div id="jxgbox" style="width: 500px; height: 500px;"></div>';
    target = document.getElementById('jxgbox');
    board = JXG.JSXGraph.initBoard('jxgbox', {boundingbox: [-5, 5, 5, -5]});
    CAS = board.jc.CAS;

    it("Karma", function () {
        expect(true).toEqual(true);
    });


    it("JessieCode", function() {
        var str, ast;

        str = 'f = map (x) -> x^2;'
        ast = board.jc.getAST(str);
        // console.log(str);
        expect(board.jc.compile(ast)).toEqual('f = map (x) -> (x^2);\n');
    });

    it("template", function() {
        var function_string, expected_outcome, ast, outcome_ast;

        function_string = 'x;' // our input function
        expected_outcome = 'x;' // what the result should be

        // Convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);

        // Functions that are supposed to be executed on the ast:
        // Print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));

        // Test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("cancel_gcd_0", function() {
        var function_string, expected_outcome, ast, outcome_ast;

        function_string = '12/24;' // our input function
        expected_outcome = '1/2;' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast.children[1] = CAS.cancel_gcd(ast.children[1]);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("cancel_gcd_1", function() {
        var function_string, expected_outcome, ast, outcome_ast;

        function_string = '18/48;' // our input function
        expected_outcome = '3/8;' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast.children[1] = CAS.cancel_gcd(ast.children[1]);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("cancel_gcd_2", function() {
        var function_string, expected_outcome, ast, outcome_ast;

        function_string = 'x*7/45*9/35;' // our input function
        expected_outcome = 'x/25;' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast.children[1] = CAS.cancel_gcd(ast.children[1]);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("cancel_gcd_3", function() {
        var function_string, expected_outcome, ast, outcome_ast;

        function_string = 'log(2+x^2)*7/49*6/48*24/3*x;' // our input function
        expected_outcome = 'log(2+x^2)*x/7;' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast.children[1] = CAS.cancel_gcd(ast.children[1]);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("cancel_gcd_4", function() {
        var function_string, expected_outcome, ast, outcome_ast;

        function_string = 'x^2*(-5)/3*(-7)/(-10);' // our input function
        expected_outcome = 'x^2*(-7)/6;' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast.children[1] = CAS.cancel_gcd(ast.children[1]);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("cancel_gcd_5", function() {
        var function_string, expected_outcome, ast, outcome_ast;

        function_string = 'x*(-5)/(-10);' // our input function
        expected_outcome = 'x/2;' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast.children[1] = CAS.cancel_gcd(ast.children[1]);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("cancel_gcd_6", function() {
        var function_string, expected_outcome, ast, outcome_ast;

        function_string = 'x*5/(-10);' // our input function
        expected_outcome = '-x/2;' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast.children[1] = CAS.cancel_gcd(ast.children[1]);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("cancel_gcd_7", function() {
        var function_string, expected_outcome, ast, outcome_ast;

        function_string = '36/6;' // our input function
        expected_outcome = '6;' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast.children[1] = CAS.cancel_gcd(ast.children[1]);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("collect_0", function() {
        var function_string, expected_outcome, ast, outcome_ast;

        function_string = 'x*(log(3) + 3) + x^4 * 7;' // our input function
        expected_outcome = '(log(3) + 3)*x + x^4 * 7;' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);

        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.collect_tree(ast);
        outcome_ast = CAS.collect_tree(outcome_ast);


        // print both ast, for debugging purposes
        console.log("--------------")
        console.log("input: " + CAS.compile(ast));
        console.log("expected: " + CAS.compile(outcome_ast));
        console.log("--------------")
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("collect_1", function() {
        var function_string, expected_outcome, ast, outcome_ast;

        function_string = '-3*x+2*x+x+5*x^2*x^-2;' // our input function
        expected_outcome = '5;' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.collect_tree(ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("collect_2", function() {
        var function_string, expected_outcome, ast, outcome_ast;

        function_string = 'x*log(2) + (x^2 * x^3)*5 + 4*(x^3 * x^2)+3*x;' // our input function
        expected_outcome = '(3 + log(2))*x + 9*x^5;' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.collect_tree(ast);
        // print both ast, for debugging purposes
        console.log("input: " + CAS.compile(ast));
        console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("collect_3", function() {
        var function_string, expected_outcome, ast, outcome_ast;

        function_string = 'x^2 + 2*x*y*y + 2*x^2 + 3*y^2*x + 7*y + y*y^2 + y*y*y + 6*y^3;' // our input function
        expected_outcome = '3*x^2 + 5*x*y^2 + 7*y + 8*y^3;' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.collect_tree(ast);
        // print both ast, for debugging purposes
        console.log("input: " + CAS.compile(ast));
        console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

});
