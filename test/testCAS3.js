describe("Test testing", function () {
    var board, target,
        CAS;

    document.getElementsByTagName('body')[0].innerHTML = '<div id="jxgbox" style="width: 500px; height: 500px;"></div>';
    target = document.getElementById('jxgbox');
    board = JXG.JSXGraph.initBoard('jxgbox', {boundingbox: [-5, 5, 5, -5]});
    CAS = board.jc.CAS;

    it("sort test", function() {
        var function_string, expected_outcome, ast, outcome_string;
        function_string = 'x+x^3*3+x^3*a+4;' // our input function
        expected_outcome = 'a*x^3+3*x^3+x+4' // what the result should be
        // convert the string into tree
        ast = board.jc.getAST(function_string).children[1];
        ast = CAS.to_work_tree(ast);
        // functions that are supposed to be executed on the ast:
        CAS.user_sort(ast, ["x"]);
        // print both ast, for debugging purposes
        outcome_string = CAS.compile(ast);
        // console.log("input: " + outcome_string);
        // console.log("expected: " + expected_outcome);
        // test if these are actually equal to each other
        expect(expected_outcome === outcome_string).toEqual(true);
    });

    it("compare factors", function() {
        var log, expressions, ast_1, ast_2, antisym, comp_1, comp_2, compare, compile; 
        log = "Compare Factors Log:\n";
        expressions = ["2;", "3;", "x;", "y;", "a;", "x^2;", "a^2;", "x^3;", "y^1;", "(-x+4);", "sin(x);", "a*x;"];
        antisym = true;
        for(let i = 0; i < expressions.length - 1; i++){
            ast_1 = board.jc.getAST(expressions[i]);
            for(let j = i; j < expressions.length; j++){
                ast_2 = board.jc.getAST(expressions[j]);
                comp_1 = CAS._compare_factor(ast_1.children[1], ast_2.children[1]);
                comp_2 = CAS._compare_factor(ast_2.children[1], ast_1.children[1]);
                // log += "Compare expr_1 = " + expressions[i] + " and expr_2 = " + expressions[j] + ":\n\t";
                // log += "compare(expr_1, expr_2) = " + comp_1 + ", compare(expr_2, expr_1) = " + comp_2 + "\n\t";
                // log += "Order: " + ((comp_1 <= 0) ? (expressions[i] + ", " + expressions[j]) : (expressions[j] + ", " + expressions[i])) + "\n"; 
                // log += "\tantisym: " + (comp_1*comp_2 < 0 || (i === j && comp_1 === comp_2 && comp_1 === 0)) + "\n";
                antisym = antisym && (comp_1*comp_2 < 0 || (i === j && comp_1 === comp_2 && comp_1 === 0))
            }
        }
        compare = CAS._compare_factor.bind(CAS);
        compile = CAS.compile.bind(CAS);
        log += "Sorted: ["
        log += expressions.map(expr => board.jc.getAST(expr).children[1])
            .sort(
                (elem1, elem2) => compare(elem1, elem2, ["x"])
            ).map(compile).join(", ") 
            + "]";
        console.log(log);
        expect(antisym).toEqual(true);
    });

    it("compare summands", function() {
        var log, expressions, ast_1, ast_2, antisym, comp_1, comp_2, compile; 
        log = "Compare summands log:\n";
        expressions = ["2*x;", "3*x;", "x;", "2*x*y^2;", "2*x^2*y;", "2*y^3;", "3*y;", "a;", "x^2;", "2*a^2;", "x^3;", "y^1;"];
        antisym = true;
        for(let i = 0; i < expressions.length - 1; i++){
            ast_1 = CAS.to_work_tree(board.jc.getAST(expressions[i])) ;
            for(let j = i; j < expressions.length; j++){
                ast_2 = board.jc.getAST(expressions[j]);
                comp_1 = CAS._compare_summand(ast_1.children[1], ast_2.children[1], ["x"]);
                comp_2 = CAS._compare_summand(ast_2.children[1], ast_1.children[1], ["x"]);
                // log += "Compare expr_1 = " + expressions[i] + " and expr_2 = " + expressions[j] + ":\n\t";
                // log += "compare(expr_1, expr_2) = " + comp_1 + ", compare(expr_2, expr_1) = " + comp_2 + "\n\t";
                // log += "Order: " + ((comp_1 <= 0) ? (expressions[i] + ", " + expressions[j]) : (expressions[j] + ", " + expressions[i])) + "\n"; 
                // log += "\tantisym: " + (comp_1*comp_2 < 0 || (i === j && comp_1 === comp_2 && comp_1 === 0)) + "\n";
                antisym = antisym && (comp_1*comp_2 < 0 || (i === j && comp_1 === comp_2 && comp_1 === 0))
            }
        }
        compile = CAS.compile.bind(CAS);
        log += "Sorted: ["
        log += expressions.map(expr => CAS.to_work_tree(board.jc.getAST(expr).children[1]))
            .sort((elem1, elem2) => CAS._compare_summand(elem1, elem2, ["x", "y"]))
            .map(compile).join(", ") 
            + "]";
        console.log(log);
        expect(antisym).toEqual(true);
    });

    it("cancel greatest common divisor", function(){
        var ast, string;
        ast = CAS.to_work_tree(board.jc.getAST("(x^3+3*x^2+3*x+1)/(x^2+4*x+3);").children[1]);
        string = "Cancel greatest common divisor\n";
        string += CAS.compile(ast) + " = ";
        ast = CAS.cancel_gcd_polynom(ast);
        string += CAS.compile(ast);
        console.log(string);
        expect(CAS.equals(ast, CAS.to_work_tree(board.jc.getAST("(x^2+2*x+1)*(x+3)^-1;").children[1]))).toEqual(true);
    });


});
