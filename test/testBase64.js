describe("Test JXG.Base64", function() {

    it("encode", function() {
        expect(JXG.Util.Base64.encode('JXG')).toEqual('SlhH');
        expect(JXG.Util.Base64.encode('JSXGraph')).toEqual('SlNYR3JhcGg=');
        expect(JXG.Util.Base64.encode('J')).toEqual('Sg==');
        expect(JXG.Util.Base64.encode('\u3053\u3093\u306B\u3061\u306F')).toEqual('44GT44KT44Gr44Gh44Gv');
    });

    it("decode", function() {
        expect(JXG.Util.Base64.decode('SlhH')).toEqual('JXG');
        expect(JXG.Util.Base64.decode('SlNYR3JhcGg=')).toEqual('JSXGraph');
        expect(JXG.Util.Base64.decode('Sg==', true)).toEqual('J');
        expect(JXG.Util.Base64.decode('44GT44KT44Gr44Gh44Gv', true)).toEqual('\u3053\u3093\u306B\u3061\u306F');
    });

    it("Missing padding", function() {
        // expect(JXG.Util.Base64.decode('SlNYR3JhcGg')).toThrowError();
    });

    it("Decode with invalid characters", function() {
        expect(JXG.Util.Base64.decode('S~g!!=()=')).toEqual('J');
    });

    it("Decode as array", function() {
        expect(JXG.Util.Base64.decodeAsArray('SlhH')).toEqual([74, 88, 71]);
    });
});