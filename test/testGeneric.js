TestCase("Generic", {
    testModulo: function () {
        var i, max = 5,
            empty = [],
            notempty = [1, 2, 3];

        expectAsserts(2*max);

        for (i = 0; i < max; i++) {
            assertUndefined(empty[i % empty.length]);
            assertNumber(notempty[i % notempty.length]);
        }
    }
});