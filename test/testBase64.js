/*
    Copyright 2008-2025
        Matthias Ehmann,
        Carsten Miller,
        Andreas Walter,
        Alfred Wassermann

    This file is part of JSXGraph.

    JSXGraph is free software dual licensed under the GNU LGPL or MIT License.

    You can redistribute it and/or modify it under the terms of the

      * GNU Lesser General Public License as published by
        the Free Software Foundation, either version 3 of the License, or
        (at your option) any later version
      OR
      * MIT License: https://github.com/jsxgraph/jsxgraph/blob/master/LICENSE.MIT

    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License and
    the MIT License along with JSXGraph. If not, see <https://www.gnu.org/licenses/>
    and <https://opensource.org/licenses/MIT/>.
 */
describe("Test JXG.Base64", function () {
    it("encode", function () {
        expect(JXG.Util.Base64.encode("JXG")).toEqual("SlhH");
        expect(JXG.Util.Base64.encode("JSXGraph")).toEqual("SlNYR3JhcGg=");
        expect(JXG.Util.Base64.encode("J")).toEqual("Sg==");
        expect(JXG.Util.Base64.encode("\u3053\u3093\u306B\u3061\u306F")).toEqual(
            "44GT44KT44Gr44Gh44Gv"
        );
    });

    it("decode", function () {
        expect(JXG.Util.Base64.decode("SlhH")).toEqual("JXG");
        expect(JXG.Util.Base64.decode("SlNYR3JhcGg=")).toEqual("JSXGraph");
        expect(JXG.Util.Base64.decode("Sg==", true)).toEqual("J");
        expect(JXG.Util.Base64.decode("44GT44KT44Gr44Gh44Gv", true)).toEqual(
            "\u3053\u3093\u306B\u3061\u306F"
        );
    });

    it("Missing padding", function () {
        // expect(JXG.Util.Base64.decode('SlNYR3JhcGg')).toThrowError();
    });

    it("Decode with invalid characters", function () {
        expect(JXG.Util.Base64.decode("S~g!!=()=")).toEqual("J");
    });

    it("Decode as array", function () {
        expect(JXG.Util.Base64.decodeAsArray("SlhH")).toEqual([74, 88, 71]);
    });
});
