/*
    Copyright 2008-2025
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

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

/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/**
 * @fileoverview The JXG.Dump namespace provides methods to save a board to javascript.
 */

import JXG from "../jxg.js";
import Type from "./type.js";

/**
 * The JXG.Dump namespace provides classes and methods to save a board to javascript.
 * @namespace
 */
JXG.Dump = {
    /**
     * Adds markers to every element of the board
     * @param {JXG.Board} board
     * @param {Array|String} markers
     * @param {Array} values
     */
    addMarkers: function (board, markers, values) {
        var e, l, i;

        if (!Type.isArray(markers)) {
            markers = [markers];
        }

        if (!Type.isArray(values)) {
            values = [values];
        }

        l = Math.min(markers.length, values.length);

        markers.length = l;
        values.length = l;

        for (e in board.objects) {
            if (board.objects.hasOwnProperty(e)) {
                for (i = 0; i < l; i++) {
                    board.objects[e][markers[i]] = values[i];
                }
            }
        }
    },

    /**
     * Removes markers from every element on the board.
     * @param {JXG.Board} board
     * @param {Array|String} markers
     */
    deleteMarkers: function (board, markers) {
        var e, l, i;

        if (!Type.isArray(markers)) {
            markers = [markers];
        }

        l = markers.length;

        markers.length = l;

        for (e in board.objects) {
            if (board.objects.hasOwnProperty(e)) {
                for (i = 0; i < l; i++) {
                    delete board.objects[e][markers[i]];
                }
            }
        }
    },

    /**
     * Stringifies a string, i.e. puts some quotation marks around <tt>s</tt> if it is of type string.
     * @param {*} s
     * @returns {String} " + s + "
     */
    str: function (s) {
        if (typeof s === "string" && s.slice(0, 7) !== 'function') {
            s = '"' + s + '"';
        }

        return s;
    },

    /**
     * Eliminate default values given by {@link JXG.Options} from the attributes object.
     * @param {Object} instance Attribute object of the element
     * @param {Object} s Arbitrary number of objects <tt>instance</tt> will be compared to. Usually these are
     * sub-objects of the {@link JXG.Board#options} structure.
     * @returns {Object} Minimal attributes object
     */
    minimizeObject: function (instance, s) {
        var p,
            pl,
            i,
            def = {},
            copy = Type.deepCopy(instance),
            defaults = [];

        for (i = 1; i < arguments.length; i++) {
            defaults.push(arguments[i]);
        }

        def = Type.deepCopy(def, JXG.Options.elements, true);
        for (i = defaults.length; i > 0; i--) {
            def = Type.deepCopy(def, defaults[i - 1], true);
        }

        for (p in def) {
            if (def.hasOwnProperty(p)) {
                pl = p.toLowerCase();

                if (def[p] !== null && typeof def[p] !== "object" && def[p] === copy[pl]) {
                    // console.log("delete", p);
                    delete copy[pl];
                }
            }
        }

        return copy;
    },

    /**
     * Prepare the attributes object for an element to be dumped as JavaScript or JessieCode code.
     * @param {JXG.Board} board
     * @param {JXG.GeometryElement} obj Geometry element which attributes object is generated
     * @returns {Object} An attributes object.
     */
    prepareAttributes: function (board, obj) {
        var a, s;

        a = this.minimizeObject(obj.getAttributes(), JXG.Options[obj.elType]);

        for (s in obj.subs) {
            if (obj.subs.hasOwnProperty(s)) {
                a[s] = this.minimizeObject(
                    obj.subs[s].getAttributes(),
                    JXG.Options[obj.elType][s],
                    JXG.Options[obj.subs[s].elType]
                );
                a[s].id = obj.subs[s].id;
                a[s].name = obj.subs[s].name;
            }
        }

        a.id = obj.id;
        a.name = obj.name;

        return a;
    },

    setBoundingBox: function (methods, board, boardVarName) {
        methods.push({
            obj: boardVarName,
            method: "setBoundingBox",
            params: [board.getBoundingBox(), board.keepaspectratio]
        });

        return methods;
    },

    /**
     * Generate a save-able structure with all elements. This is used by {@link JXG.Dump#toJessie} and
     * {@link JXG.Dump#toJavaScript} to generate the script.
     * @param {JXG.Board} board
     * @returns {Array} An array with all metadata necessary to save the construction.
     */
    dump: function (board) {
        var e,
            obj,
            element,
            s,
            props = [],
            methods = [],
            elementList = [],
            len = board.objectsList.length;

        this.addMarkers(board, "dumped", false);

        for (e = 0; e < len; e++) {
            obj = board.objectsList[e];
            element = {};

            if (!obj.dumped && obj.dump) {
                element.type = obj.getType();
                element.parents = obj.getParents().slice();

                // Extract coordinates of a point
                if (element.type === "point" && element.parents[0] === 1) {
                    element.parents = element.parents.slice(1);
                }

                for (s = 0; s < element.parents.length; s++) {
                    if (
                        Type.isString(element.parents[s]) &&
                        element.parents[s][0] !== "'" &&
                        element.parents[s][0] !== '"'
                    ) {
                        element.parents[s] = '"' + element.parents[s] + '"';
                    } else if (Type.isArray(element.parents[s])) {
                        element.parents[s] = "[" + element.parents[s].toString() + "]";
                    }
                }

                element.attributes = this.prepareAttributes(board, obj);
                if (element.type === "glider" && obj.onPolygon) {
                    props.push({
                        obj: obj.id,
                        prop: "onPolygon",
                        val: true
                    });
                }

                elementList.push(element);
            }
        }

        this.deleteMarkers(board, 'dumped');

        return {
            elements: elementList,
            props: props,
            methods: methods
        };
    },

    /**
     * Converts an array of different values into a parameter string that can be used by the code generators.
     * @param {Array} a
     * @param {function} converter A function that is used to transform the elements of <tt>a</tt>. Usually
     * {@link JXG.toJSON} or {@link JXG.Dump.toJCAN} are used.
     * @returns {String}
     */
    arrayToParamStr: function (a, converter) {
        var i,
            s = [];

        for (i = 0; i < a.length; i++) {
            s.push(converter.call(this, a[i]));
        }

        return s.join(", ");
    },

    /**
     * Converts a JavaScript object into a JCAN (JessieCode Attribute Notation) string.
     * @param {Object} obj A JavaScript object, functions will be ignored.
     * @returns {String} The given object stored in a JCAN string.
     */
    toJCAN: function (obj) {
        var i, list, prop;

        switch (typeof obj) {
            case "object":
                if (obj) {
                    list = [];

                    if (Type.isArray(obj)) {
                        for (i = 0; i < obj.length; i++) {
                            list.push(this.toJCAN(obj[i]));
                        }

                        return "[" + list.join(",") + "]";
                    }

                    for (prop in obj) {
                        if (obj.hasOwnProperty(prop)) {
                            list.push(prop + ": " + this.toJCAN(obj[prop]));
                        }
                    }

                    return "<<" + list.join(", ") + ">> ";
                }
                return 'null';
            case "string":
                return "'" + obj.replace(/\\/g, "\\\\").replace(/(["'])/g, "\\$1") + "'";
            case "number":
            case "boolean":
                return obj.toString();
            case "null":
                return 'null';
        }
    },

    /**
     * Saves the construction in <tt>board</tt> to JessieCode.
     * @param {JXG.Board} board
     * @returns {String} JessieCode
     */
    toJessie: function (board) {
        var i,
            elements,
            id,
            dump = this.dump(board),
            script = [];

        dump.methods = this.setBoundingBox(dump.methods, board, "$board");

        elements = dump.elements;

        for (i = 0; i < elements.length; i++) {
            if (elements[i].attributes.name.length > 0) {
                script.push("// " + elements[i].attributes.name);
            }
            script.push(
                "s" + i + " = " + elements[i].type + "(" + elements[i].parents.join(", ") + ") " + this.toJCAN(elements[i].attributes).replace(/\n/, "\\n") + ";"
            );

            if (elements[i].type === 'axis') {
                // Handle the case that remove[All]Ticks had been called.
                id = elements[i].attributes.id;
                if (board.objects[id].defaultTicks === null) {
                    script.push("s" + i + ".removeAllTicks();");
                }
            }
            script.push("");
        }

        for (i = 0; i < dump.methods.length; i++) {
            script.push(
                dump.methods[i].obj +
                    "." +
                    dump.methods[i].method +
                    "(" +
                    this.arrayToParamStr(dump.methods[i].params, this.toJCAN) +
                    ");"
            );
            script.push("");
        }

        for (i = 0; i < dump.props.length; i++) {
            script.push(
                dump.props[i].obj +
                    "." +
                    dump.props[i].prop +
                    " = " +
                    this.toJCAN(dump.props[i].val) +
                    ";"
            );
            script.push("");
        }

        return script.join("\n");
    },

    /**
     * Saves the construction in <tt>board</tt> to JavaScript.
     * @param {JXG.Board} board
     * @returns {String} JavaScript
     */
    toJavaScript: function (board) {
        var i,
            elements,
            id,
            dump = this.dump(board),
            script = [];

        dump.methods = this.setBoundingBox(dump.methods, board, 'board');

        elements = dump.elements;

        for (i = 0; i < elements.length; i++) {
            script.push(
                'board.create("' +
                    elements[i].type +
                    '", [' +
                    elements[i].parents.join(", ") +
                    "], " +
                    Type.toJSON(elements[i].attributes) +
                    ");"
            );

            if (elements[i].type === 'axis') {
                // Handle the case that remove[All]Ticks had been called.
                id = elements[i].attributes.id;
                if (board.objects[id].defaultTicks === null) {
                    script.push(
                        'board.objects["' +
                            id +
                            '"].removeTicks(board.objects["' +
                            id +
                            '"].defaultTicks);'
                    );
                }
            }
        }

        for (i = 0; i < dump.methods.length; i++) {
            script.push(
                dump.methods[i].obj +
                    "." +
                    dump.methods[i].method +
                    "(" +
                    this.arrayToParamStr(dump.methods[i].params, Type.toJSON) +
                    ");"
            );
            script.push("");
        }

        for (i = 0; i < dump.props.length; i++) {
            script.push(
                dump.props[i].obj +
                    "." +
                    dump.props[i].prop +
                    " = " +
                    Type.toJSON(dump.props[i].val) +
                    ";"
            );
            script.push("");
        }

        return script.join("\n");
    }
};

export default JXG.Dump;
