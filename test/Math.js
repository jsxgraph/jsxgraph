MathTest = TestCase("MathTest");

MathTest.prototype.testEps = function() {
    assertNumber("JXG.Math.eps is a number", JXG.Math.eps);
};
