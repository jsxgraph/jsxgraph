(function () {
    var Type = function (a, b) {};
    this.$constructor = new Type('Window', function(){});
    var test = this.$constructor;
    this.WindowXYZ = this.$constructor;
    this.Window = test;
})();
