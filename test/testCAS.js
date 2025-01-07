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

    it("sort_0", function() {
        var function_string, expected_outcome, ast, outcome_ast;

        function_string = 'y^2 * x;' // our input function
        expected_outcome = 'x * y^2;' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);

        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.sort(ast);

        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("collect_0", function() {
        var function_string, expected_outcome, ast, outcome_ast;

        // Good:
        function_string  = '(log(2) + 3) * x + x^2;' // our input function
        expected_outcome = 'x^2 + x * (log(2) + 3);' // what the result should be
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

    // it("collect_0b", function() {
    //     var function_string, expected_outcome, ast, outcome_ast;

    //     // Fails:
    //     function_string  = '(log(2) + 3)*x;' // our input function
    //     expected_outcome = 'x*(log(2) + 3);' // what the result should be

    //     // convert the strings into trees
    //     ast = board.jc.getAST(function_string);
    //     ast = CAS.to_work_tree(ast);
    //     outcome_ast = board.jc.getAST(expected_outcome);
    //     outcome_ast = CAS.to_work_tree(outcome_ast);

    //     // functions that are supposed to be executed on the ast:
    //     ast = CAS.collect_tree(ast);
     
    //     // print both ast, for debugging purposes
    //     console.log("input: " + CAS.compile(ast));
    //     console.log("expected: " + CAS.compile(outcome_ast));
    //     // test if these are actually equal to each other
    //     expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    // });

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
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
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
        // ast = CAS.user_sort(ast, ['x']);
        // outcome_ast = CAS.user_sort(outcome_ast, ['x']);
        
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("collect_4", function() {
        var function_string, expected_outcome, ast, outcome_ast;

        function_string = '3*x*x + x^2*5 - 2*x^3*x^(-1) - x^5*6*x^-3;' // our input function
        expected_outcome = '0;' // what the result should be
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

    it("collect_5", function() {
        var function_string, expected_outcome, ast, outcome_ast;

        function_string = 'x^2 - 2*x*y*y + (-2*x^2) + 3*y^2*x + 7*y - y^-2*y^5 - y^3*y*y^-1 + 6*y^3;' // our input function
        expected_outcome = '-1*x^2 + x*y^2 + 7*y + 4*y^3;' // what the result should be
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

    it("collect_6", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        
        function_string = '-y^-2*y^5 - y^3*y*y^-1 + 6*y^3;' // our input function
        expected_outcome = '4*y^3;' // what the result should be
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

    it("collect_7", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        
        function_string = 'x*3+y*3+x*-1;' // our input function
        expected_outcome = '2*x+3*y;' // what the result should be
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

    it("factorize_1", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        
        function_string = '3*x+9*x^2;' // our input function
        expected_outcome = '3*x*(1+3*x);' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.factorize_tree(ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("factorize_2", function() {
        var function_string, expected_outcome, ast, outcome_ast;

        function_string = '21/26*y^2+33/38*y^3+15/46*y^4;' // our input function
        expected_outcome = '3/2*y^2*(7/13+11/19*y+5/23*y^2);' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.factorize_tree(ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("factorize_3", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        
        function_string = '21/26*y^2*log(x)+33/38*y^3*log(x)^2+15/46*y^4*log(x)^3;' // our input function
        expected_outcome = '3/2*y^2*log(x)*(7/13+11/19*y*log(x)+5/23*y^2*log(x)^2);' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.factorize_tree(ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("factorize_4", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        
        function_string = '-3*x+(-6*x^2);' // our input function
        expected_outcome = '-3*x*(1+2*x);' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.factorize_tree(ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("factorize_5", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        
        function_string = '7*x+x*21*y-14*x^2+x*7*log(x);' // our input function
        expected_outcome = '7*x*(1+3*y-2*x+log(x));' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        outcome_ast = CAS.to_work_tree(outcome_ast);
        // functions that are supposed to be executed on the ast:
        ast = CAS.factorize_tree(ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("generate_jxg_division_1", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        
        function_string = 'x^-1;' // our input function
        expected_outcome = '1/x;' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        // functions that are supposed to be executed on the ast:
        ast = CAS.to_jxg_tree(ast);
        outcome_ast = CAS.to_jxg_tree(outcome_ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("generate_jxg_division_2", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        
        function_string = '5*x^-1;' // our input function
        expected_outcome = '5/x;' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        // functions that are supposed to be executed on the ast:
        ast = CAS.to_jxg_tree(ast);
        outcome_ast = CAS.to_jxg_tree(outcome_ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("generate_jxg_division_3", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        
        function_string = '5*x^-1*y^-1*x^2*log(x)^-1;' // our input function
        expected_outcome = '5*x^2/(x*y*log(x));' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        // functions that are supposed to be executed on the ast:
        ast = CAS.to_jxg_tree(ast);
        outcome_ast = CAS.to_jxg_tree(outcome_ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("generate_jxg_division_4", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        
        function_string = '-2*-3.5*-4.5^-1*x^-1;' // our input function
        expected_outcome = '-2*3.5/(4.5*x);' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        // functions that are supposed to be executed on the ast:
        ast = CAS.to_jxg_tree(ast);
        outcome_ast = CAS.to_jxg_tree(outcome_ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("generate_jxg_division_5", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        
        function_string = '-x*5*-y^-1*-z^-1 + y*-x^-1*5^-1*-z;' // our input function
        expected_outcome = '-x*5/(y*z) + y*z/(x*5);' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        // functions that are supposed to be executed on the ast:
        ast = CAS.to_jxg_tree(ast);
        outcome_ast = CAS.to_jxg_tree(outcome_ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("generate_jxg_division_6", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        
        function_string = 'x^-3;' // our input function
        expected_outcome = '1/x^3;' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        // functions that are supposed to be executed on the ast:
        ast = CAS.to_jxg_tree(ast);
        outcome_ast = CAS.to_jxg_tree(outcome_ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("generate_jxg_division_7", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        
        function_string = 'x^-8+5^-1;' // our input function
        expected_outcome = '1/x^8+1/5;' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        // functions that are supposed to be executed on the ast:
        ast = CAS.to_jxg_tree(ast);
        outcome_ast = CAS.to_jxg_tree(outcome_ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals_compiled(ast, outcome_ast)).toEqual(true);
    });

    it("generate_jxg_division_8", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        
        function_string = '5*x^-1*y^-1.5*x^2*log(x)^-5;' // our input function
        expected_outcome = '5*x^2/(x*y^1.5*log(x)^5);' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        // functions that are supposed to be executed on the ast:
        ast = CAS.to_jxg_tree(ast);
        outcome_ast = CAS.to_jxg_tree(outcome_ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("generate_jxg_division_9", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        
        function_string = 'x^-3.5;' // our input function
        expected_outcome = '1/x^3.5;' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        // functions that are supposed to be executed on the ast:
        ast = CAS.to_jxg_tree(ast);
        outcome_ast = CAS.to_jxg_tree(outcome_ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("generate_jxg_division_10", function() {
        var function_string, expected_outcome, ast, outcome_ast;

        function_string = 'x^(-y*x^-2);' // our input function
        expected_outcome = '1/(x^(y/x^2));' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        // functions that are supposed to be executed on the ast:
        ast = CAS.to_jxg_tree(ast);
        outcome_ast = CAS.to_jxg_tree(outcome_ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("generate_jxg_division_11", function() {
        var function_string, expected_outcome, ast, outcome_ast;

        function_string = 'x^3.5*x^(-y*x^-2);' // our input function
        expected_outcome = 'x^3.5/(x^(y/x^2));' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        // functions that are supposed to be executed on the ast:
        ast = CAS.to_jxg_tree(ast);
        outcome_ast = CAS.to_jxg_tree(outcome_ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("generate_jxg_division_12", function() {
        var function_string, expected_outcome, ast, outcome_ast;

        function_string = '-x^-1.7*-z^5 + -x^3.5*x^(-y*x^-2);' // our input function
        expected_outcome = 'z^5/x^1.7 - x^3.5/(x^(y/x^2));' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        // functions that are supposed to be executed on the ast:
        ast = CAS.to_jxg_tree(ast);
        outcome_ast = CAS.to_jxg_tree(outcome_ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("generate_jxg_division_13", function() {
        var function_string, expected_outcome, ast, outcome_ast;

        function_string = 'x*y^-z;' // our input function
        expected_outcome = 'x/y^z;' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        // functions that are supposed to be executed on the ast:
        ast = CAS.to_jxg_tree(ast);
        outcome_ast = CAS.to_jxg_tree(outcome_ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("generate_jxg_subtraction_1", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        
        function_string = 'x-y;' // our input function
        expected_outcome = 'x-y;' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        // functions that are supposed to be executed on the ast:
        ast = CAS.to_jxg_tree(ast);
        outcome_ast = CAS.to_jxg_tree(outcome_ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals(ast, outcome_ast)).toEqual(true);
    });

    it("generate_jxg_subtraction_3", function() {
        var function_string, expected_outcome, ast, outcome_ast;

        function_string = 'y+z-5;' // our input function
        expected_outcome = 'y+z-5;' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        // functions that are supposed to be executed on the ast:
        ast = CAS.to_jxg_tree(ast);
        outcome_ast = CAS.to_jxg_tree(outcome_ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals_compiled(ast, outcome_ast)).toEqual(true);
    });

    it("generate_jxg_subtraction_4", function() {
        var function_string, expected_outcome, ast, outcome_ast;

        function_string = 'y+z-5*x^2;' // our input function
        expected_outcome = 'y+z-5*x^2;' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        // functions that are supposed to be executed on the ast:
        ast = CAS.to_jxg_tree(ast);
        outcome_ast = CAS.to_jxg_tree(outcome_ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals_compiled(ast, outcome_ast)).toEqual(true);
    });

    it("generate_jxg_subtraction_5", function() {
        var function_string, expected_outcome, ast, outcome_ast;

        function_string = 'y+z-5*x^2-y/z^5;' // our input function
        expected_outcome = 'y+z-5*x^2-y/z^5;' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        // functions that are supposed to be executed on the ast:
        ast = CAS.to_jxg_tree(ast);
        outcome_ast = CAS.to_jxg_tree(outcome_ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals_compiled(ast, outcome_ast)).toEqual(true);
    });

    it("generate_jxg_subtraction_6", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        
        function_string = '-a-b+c-d+e-f-g;' // our input function
        expected_outcome = '-a-b+c-d+e-f-g;' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        // functions that are supposed to be executed on the ast:
        ast = CAS.to_jxg_tree(ast);
        outcome_ast = CAS.to_jxg_tree(outcome_ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals_compiled(ast, outcome_ast)).toEqual(true);
    });

    it("generate_jxg_1", function() {
        var function_string, expected_outcome, ast, outcome_ast;
        
        function_string = 'x^-3.3*-y^5.2 * z^(8*a^-3*-b^-6.4) - x*y^-2.3;' // our input function
        expected_outcome = '-y^5.2/(x^3.3*z^(8/(a^3*b^6.4))) - x/y^2.3;' // what the result should be
        // convert the strings into trees
        ast = board.jc.getAST(function_string);
        ast = CAS.to_work_tree(ast);
        outcome_ast = board.jc.getAST(expected_outcome);
        // functions that are supposed to be executed on the ast:
        ast = CAS.to_jxg_tree(ast);
        outcome_ast = CAS.to_jxg_tree(outcome_ast);
        // print both ast, for debugging purposes
        // console.log("input: " + CAS.compile(ast));
        // console.log("expected: " + CAS.compile(outcome_ast));
        // test if these are actually equal to each other
        expect(CAS.equals_compiled(ast, outcome_ast)).toEqual(true);
    });

});
