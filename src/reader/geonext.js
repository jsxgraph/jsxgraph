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

/*global JXG: true, XMLSerializer: true, Image: true*/
/*jslint nomen: true, plusplus: true*/

(function () {
    "use strict";

    JXG.GeonextReader = function (board, str) {
        var content;

        this.board = board;
        content = this.prepareString(str);
        this.tree = JXG.XML.parse(content);
    };

    JXG.extend(
        JXG.GeonextReader.prototype,
        /** @lends JXG.GeonextReader.prototype */ {
            changeOriginIds: function (board, id) {
                if (
                    id === "gOOe0" ||
                    id === "gXOe0" ||
                    id === "gYOe0" ||
                    id === "gXLe0" ||
                    id === "gYLe0"
                ) {
                    return board.id + id;
                }

                return id;
            },

            /**
             * Retrieves data by TagName from an XML node.
             * @param {Object} node The Node that contains the data we want to get.
             * @param {String} tag The Name of the tag we are looking for.
             * @param {Number} [idx=0] getElementsByTagName returns an array; This parameter decides which element to use.
             * @param {Boolean} [fc=true] If True, the result will be the <tt>data</tt> of <tt>firstChild</tt> instead of the result node.
             * @returns {Object|Array|String} The gathered data
             */
            gEBTN: function (node, tag, idx, fc) {
                var tmp = [];

                if (!JXG.exists(node || !node.getElementsByTagName)) {
                    return node;
                }

                // Default values for optional parameters idx and fc
                if (!JXG.exists(fc)) {
                    fc = true;
                }

                idx = idx || 0;

                if (node.getElementsByTagName) {
                    tmp = node.getElementsByTagName(tag);
                }
                if (tmp.length > 0) {
                    tmp = tmp[idx];
                    if (fc && tmp.firstChild) {
                        tmp = tmp.firstChild.data;
                    }
                }

                return tmp;
            },

            /**
             * Set color properties of a geonext element.
             * Set stroke, fill, lighting, label and draft color attributes.
             * @param {Object} gxtEl element of which attributes are to set
             * @param {Object} Data
             * @returns {Object} Returns gxtEl
             */
            colorProperties: function (gxtEl, Data) {
                var rgbo,
                    color = this.gEBTN(Data, "color", 0, false);

                //gxtEl.strokewidth = Data.getElementsByTagName('strokewidth')[0].firstChild.data;
                // colorStroke = strokeColor etc. is here for downwards compatibility:
                // once upon a time we used to create elements in here using the "new JXG.Element" constructor mechanism
                // then we changed to board.create + setProperty afterwords
                // now i want to use the board.create method with an appropriate attributes object to avoid setProperty calls
                // and as gxtEl happens to be somewhat like an attributes object it's  just slightly different so we adjust it
                // for downwards compatibility during the transformation of this reader we use both properties

                rgbo = JXG.rgba2rgbo(this.gEBTN(color, "stroke"));
                gxtEl.strokeColor = rgbo[0];
                gxtEl.strokeOpacity = rgbo[1];

                rgbo = JXG.rgba2rgbo(this.gEBTN(color, "lighting"));
                gxtEl.highlightStrokeColor = rgbo[0];
                gxtEl.highlightStrokeOpacity = rgbo[1];

                rgbo = JXG.rgba2rgbo(this.gEBTN(color, "fill"));
                gxtEl.fillColor = rgbo[0];
                gxtEl.fillOpacity = rgbo[1];

                gxtEl.highlightFillColor = gxtEl.fillColor;
                gxtEl.highlightFillOpacity = gxtEl.fillOpacity;

                rgbo = JXG.rgba2rgbo(this.gEBTN(color, "label"));
                gxtEl.labelColor = rgbo[0];
                gxtEl.withLabel = rgbo[1] > 0;
                gxtEl.labelOpacity = rgbo[1];

                gxtEl.colorDraft = JXG.rgba2rgbo(this.gEBTN(color, "draft"))[0];

                // backwards compatibility
                gxtEl.colorStroke = gxtEl.strokeColor;
                gxtEl.colorFill = gxtEl.fillColor;
                gxtEl.colorLabel = gxtEl.labelColor;

                return gxtEl;
            },

            firstLevelProperties: function (gxtEl, Data) {
                var n, key, arr;

                if (!JXG.exists(Data) || !JXG.exists(Data.childNodes)) {
                    return gxtEl;
                }

                arr = Data.childNodes;

                for (n = 0; n < arr.length; n++) {
                    if (
                        JXG.exists(arr[n].firstChild) &&
                        arr[n].nodeName !== "data" &&
                        arr[n].nodeName !== "straight"
                    ) {
                        key = arr[n].nodeName;

                        if (key === "width") {
                            key = "strokewidth";
                        }
                        gxtEl[key] = arr[n].firstChild.data;
                    }
                }

                return gxtEl;
            },

            /**
             * Set the defining properties of a geonext element.
             * Writing the nodeName to ident; setting the name attribute and defining the element id.
             * @param {Object} gxtEl element of which attributes are to set
             * @param {Object} Data
             */
            defProperties: function (gxtEl, Data) {
                // 3==TEXT_NODE, 8==COMMENT_NODE
                if (Data.nodeType === 3 || Data.nodeType === 8) {
                    return null;
                }

                gxtEl.ident = Data.nodeName;

                if (
                    gxtEl.ident === "text" ||
                    gxtEl.ident === "intersection" ||
                    gxtEl.ident === "composition"
                ) {
                    gxtEl.name = "";
                } else {
                    gxtEl.name = this.gEBTN(Data, "name");
                }

                gxtEl.id = this.gEBTN(Data, "id");

                return gxtEl;
            },

            visualProperties: function (gxtEl, Data) {
                gxtEl.visible = JXG.str2Bool(this.gEBTN(Data, "visible"));
                gxtEl.trace = JXG.str2Bool(this.gEBTN(Data, "trace"));

                return gxtEl;
            },

            /**
             * Transforms the Geonext properties to jsxgraph properties
             * @param {Object} gxtEl
             * @param {String} [type]
             * @returns {Object} gxtEl
             */
            transformProperties: function (gxtEl, type) {
                var i,
                    facemap = [
                        // 0-2
                        "cross",
                        "cross",
                        "cross",
                        // 3-6
                        "circle",
                        "circle",
                        "circle",
                        "circle",
                        // 7-9
                        "square",
                        "square",
                        "square",
                        // 10-12
                        "plus",
                        "plus",
                        "plus"
                    ],
                    sizemap = [
                        // 0-2
                        2, 3, 4,
                        // 3-6
                        1, 2, 3, 4,
                        // 7-9
                        2, 3, 4,
                        // 10-12
                        2, 3, 4
                    ],
                    remove = [
                        "color",
                        "dash",
                        "style",
                        "style",
                        "ident",
                        "colordraft",
                        "colorstroke",
                        "colorfill",
                        "colorlabel",
                        "active",
                        "area",
                        "showinfo",
                        "showcoord",
                        "fix"
                    ];

                gxtEl.strokeWidth = gxtEl.strokewidth;
                gxtEl.face = facemap[parseInt(gxtEl.style, 10)] || "cross";
                gxtEl.size = sizemap[parseInt(gxtEl.style, 10)] || 3;

                gxtEl.straightFirst = JXG.str2Bool(gxtEl.straightFirst);
                gxtEl.straightLast = JXG.str2Bool(gxtEl.straightLast);

                gxtEl.visible = JXG.str2Bool(gxtEl.visible);
                //gxtEl.withLabel = gxtEl.visible;           // withLabel is set in colorProperties()
                gxtEl.draft = JXG.str2Bool(gxtEl.draft);
                gxtEl.trace = JXG.str2Bool(gxtEl.trace);

                if (type === "point") {
                    // Fill properties are ignored by GEONExT
                    gxtEl.fillColor = gxtEl.strokeColor;
                    gxtEl.highlightFillColor = gxtEl.highlightStrokeColor;
                    gxtEl.fillOpacity = gxtEl.strokeOpacity;
                    gxtEl.highlightFillOpacity = gxtEl.highlightStrokeOpacity;
                }

                if (typeof gxtEl.label === "string") {
                    delete gxtEl.label;
                }
                gxtEl.label = gxtEl.label || {
                    opacity: gxtEl.labelOpacity
                };

                // clean up
                for (i = 0; i < remove.length; i++) {
                    delete gxtEl[remove[i]];
                }

                return gxtEl;
            },

            readNodes: function (gxtEl, Data, nodeType, prefix) {
                var key,
                    n,
                    arr = this.gEBTN(Data, nodeType, 0, false).childNodes;

                for (n = 0; n < arr.length; n++) {
                    if (JXG.exists(arr[n].firstChild)) {
                        if (JXG.exists(prefix)) {
                            key = prefix + JXG.capitalize(arr[n].nodeName);
                        } else {
                            key = arr[n].nodeName;
                        }
                        gxtEl[key] = arr[n].firstChild.data;
                    }
                }
                return gxtEl;
            },

            subtreeToString: function (root) {
                try {
                    // firefox
                    return new XMLSerializer().serializeToString(root);
                } catch (e) {
                    // IE
                    return root.xml;
                }
            },

            readImage: function (node) {
                var pic = "",
                    nod = node;

                if (JXG.exists(nod)) {
                    pic = nod.data;
                    while (JXG.exists(nod.nextSibling)) {
                        nod = nod.nextSibling;
                        pic += nod.data;
                    }
                }
                return pic;
            },

            parseImage: function (board, fileNode, level, x, y, w, h, el) {
                var tag,
                    id,
                    picStr,
                    tmpImg,
                    im = null;

                if (fileNode === null) {
                    return im;
                }

                // Background image
                if (JXG.exists(fileNode.getElementsByTagName("src")[0])) {
                    tag = "src";
                } else if (
                    JXG.exists(fileNode.getElementsByTagName("image")[0]) &&
                    JXG.exists(this.gEBTN(fileNode, "image"))
                ) {
                    tag = "image";
                } else {
                    return im;
                }

                picStr = this.readImage(this.gEBTN(fileNode, tag, 0, false).firstChild);
                if (picStr !== "") {
                    picStr = "data:image/png;base64," + picStr;

                    // Background image
                    if (tag === "src") {
                        x = this.gEBTN(fileNode, "x");
                        y = this.gEBTN(fileNode, "y");
                        w = this.gEBTN(fileNode, "width");
                        h = this.gEBTN(fileNode, "height");
                        im = board.create("image", [picStr, [x, y], [w, h]], {
                            anchor: el,
                            layer: level
                        });

                        return im;
                    }
                    // Image bound to an element
                    // Read the original dimensions, i.e. the ratio h/w with the help of a temporary image.
                    // We have to wait until the image is loaded, therefore
                    // we need "onload".
                    tmpImg = new Image();
                    tmpImg.src = picStr;
                    id = el.id + "_image";
                    tmpImg.onload = function () {
                        // Now, we can read the original dimensions of the image.
                        var xf,
                            yf,
                            wf,
                            hf,
                            im,
                            tRot,
                            wOrg = this.width,
                            hOrg = this.height;

                        if (el.elementClass === JXG.OBJECT_CLASS_LINE) {
                            // A line containing an image, runs through the horizontal middle
                            // of the image.
                            xf = function () {
                                return el.point1.X();
                            };
                            wf = function () {
                                return el.point1.Dist(el.point2);
                            };
                            hf = function () {
                                return (wf() * hOrg) / wOrg;
                            };
                            yf = function () {
                                return el.point1.Y() - hf() * 0.5;
                            };

                            im = board.create("image", [picStr, [xf, yf], [wf, hf]], {
                                layer: level,
                                id: id,
                                anchor: el
                            });

                            tRot = board.create(
                                "transform",
                                [
                                    function () {
                                        return Math.atan2(
                                            el.point2.Y() - el.point1.Y(),
                                            el.point2.X() - el.point1.X()
                                        );
                                    },
                                    el.point1
                                ],
                                { type: "rotate" }
                            );

                            tRot.bindTo(im);
                            el.image = im;
                        } else if (el.elementClass === JXG.OBJECT_CLASS_POINT) {
                            wf = function () {
                                return wOrg / board.unitX;
                            };
                            hf = function () {
                                return hOrg / board.unitY;
                            };
                            xf = function () {
                                return el.X() - wf() * 0.5;
                            };
                            yf = function () {
                                return el.Y() - hf() * 0.5;
                            };

                            im = board.create("image", [picStr, [xf, yf], [wf, hf]], {
                                layer: level,
                                id: id,
                                anchor: el
                            });
                            board.renderer.display(el.label, false);
                            el.image = im;
                        } else if (el.elementClass === JXG.OBJECT_CLASS_CIRCLE) {
                            // A circle containing an image
                            wf = function () {
                                return 2.0 * el.Radius();
                            };
                            hf = function () {
                                return (wf() * hOrg) / wOrg;
                            };
                            xf = function () {
                                return el.center.X() - wf() * 0.5;
                            };
                            yf = function () {
                                return el.center.Y() - hf() * 0.5;
                            };

                            im = board.create("image", [picStr, [xf, yf], [wf, hf]], {
                                layer: level,
                                id: id,
                                anchor: el
                            });
                            el.image = im;
                        } else {
                            im = board.create("image", [picStr, [x, y], [w, h]], {
                                layer: level,
                                id: id,
                                anchor: el
                            });
                            el.image = im;
                        }
                    };

                    return im;
                }
            },

            readConditions: function (node) {
                var i,
                    s,
                    ob,
                    conditions = "";

                if (JXG.exists(node)) {
                    for (i = 0; i < node.getElementsByTagName("data").length; i++) {
                        ob = node.getElementsByTagName("data")[i];
                        s = this.subtreeToString(ob);
                        conditions += s;
                    }
                }

                return conditions;
            },

            readViewPort: function (node) {
                var no,
                    arr = [];

                no = this.gEBTN(node, "viewport", 0, false);

                if (no) {
                    arr[0] = parseFloat(this.gEBTN(no, "left"));
                    arr[1] = parseFloat(this.gEBTN(no, "top"));
                    arr[2] = parseFloat(this.gEBTN(no, "right"));
                    arr[3] = parseFloat(this.gEBTN(no, "bottom"));
                    return arr;
                }

                return [];
            },

            printDebugMessage: function (outputEl, gxtEl, nodetyp, success) {
                JXG.debug("* " + success + ":  " + nodetyp + " " + gxtEl.name + " " + gxtEl.id);
            },

            readNode: function (elChildNodes, s, board) {
                var dataVertex,
                    i,
                    l,
                    x,
                    c,
                    numberDefEls,
                    el,
                    p,
                    inter,
                    rgbo,
                    tmp,
                    v,
                    Data,
                    xmlNode,
                    gxtEl = {};

                Data = elChildNodes[s];
                gxtEl = this.defProperties(gxtEl, Data);

                // Skip text nodes
                if (!JXG.exists(gxtEl)) {
                    return;
                }

                this.printDebugMessage("debug", gxtEl, Data.nodeName.toLowerCase(), "READ:");
                switch (Data.nodeName.toLowerCase()) {
                    case "point":
                        gxtEl.strokewidth = 1; // Old file format
                        gxtEl = this.colorProperties(gxtEl, Data);
                        gxtEl = this.visualProperties(gxtEl, Data);
                        gxtEl = this.firstLevelProperties(gxtEl, Data);
                        gxtEl = this.readNodes(gxtEl, Data, "data");
                        gxtEl.fixed = JXG.str2Bool(this.gEBTN(Data, "fix"));
                        gxtEl = this.transformProperties(gxtEl, "point");

                        //try {
                        p = board.create(
                            "point",
                            [parseFloat(gxtEl.x), parseFloat(gxtEl.y)],
                            gxtEl
                        );

                        v = function () {
                            return p.visProp.visible;
                        };
                        el = this.parseImage(
                            board,
                            Data,
                            board.options.layer.image,
                            0,
                            0,
                            0,
                            0,
                            p
                        );
                        this.printDebugMessage("debug", gxtEl, Data.nodeName, "OK");
                        break;
                    case "line":
                        gxtEl = this.colorProperties(gxtEl, Data);
                        gxtEl = this.visualProperties(gxtEl, Data);
                        gxtEl = this.firstLevelProperties(gxtEl, Data);
                        gxtEl = this.readNodes(gxtEl, Data, "data");
                        gxtEl = this.readNodes(gxtEl, Data, "straight", "straight");
                        gxtEl = this.transformProperties(gxtEl);

                        gxtEl.first = this.changeOriginIds(board, gxtEl.first);
                        gxtEl.last = this.changeOriginIds(board, gxtEl.last);

                        l = board.create("line", [gxtEl.first, gxtEl.last], gxtEl);

                        this.parseImage(board, Data, board.options.layer.image, 0, 0, 0, 0, l);
                        this.printDebugMessage("debug", gxtEl, Data.nodeName, "OK");
                        break;
                    case "circle":
                        gxtEl = this.colorProperties(gxtEl, Data);
                        gxtEl = this.visualProperties(gxtEl, Data);
                        gxtEl = this.firstLevelProperties(gxtEl, Data);

                        tmp = this.gEBTN(Data, "data", 0, false);
                        gxtEl.center = this.changeOriginIds(board, this.gEBTN(tmp, "midpoint"));

                        if (tmp.getElementsByTagName("radius").length > 0) {
                            gxtEl.radius = this.changeOriginIds(
                                board,
                                this.gEBTN(tmp, "radius")
                            );
                        } else if (tmp.getElementsByTagName("radiusvalue").length > 0) {
                            gxtEl.radius = this.gEBTN(tmp, "radiusvalue");
                        }
                        gxtEl = this.transformProperties(gxtEl);
                        c = board.create("circle", [gxtEl.center, gxtEl.radius], gxtEl);

                        this.parseImage(board, Data, board.options.layer.image, 0, 0, 0, 0, c);
                        this.printDebugMessage("debug", gxtEl, Data.nodeName, "OK");
                        break;
                    case "slider":
                        gxtEl.strokewidth = 1; // Old file format
                        gxtEl = this.colorProperties(gxtEl, Data);
                        gxtEl = this.visualProperties(gxtEl, Data);
                        gxtEl = this.firstLevelProperties(gxtEl, Data);

                        gxtEl = this.readNodes(gxtEl, Data, "data");
                        gxtEl.fixed = JXG.str2Bool(this.gEBTN(Data, "fix"));
                        gxtEl = this.readNodes(gxtEl, Data, "animate", "animate");
                        gxtEl = this.transformProperties(gxtEl, "point");
                        try {
                            gxtEl.parent = this.changeOriginIds(board, gxtEl.parent);
                            gxtEl.isGeonext = true;

                            p = board.create(
                                "glider",
                                [parseFloat(gxtEl.x), parseFloat(gxtEl.y), gxtEl.parent],
                                gxtEl
                            );
                            p.onPolygon =
                                JXG.exists(gxtEl.onpolygon) && JXG.str2Bool(gxtEl.onpolygon);

                            this.parseImage(
                                board,
                                Data,
                                board.options.layer.point,
                                0,
                                0,
                                0,
                                0,
                                p
                            );

                            this.printDebugMessage("debug", gxtEl, Data.nodeName, "OK");
                        } catch (e) {
                            JXG.debug(
                                "* Err:  Slider " +
                                    gxtEl.name +
                                    " " +
                                    gxtEl.id +
                                    ": " +
                                    gxtEl.parent
                            );
                        }
                        break;
                    case "cas":
                        gxtEl = this.colorProperties(gxtEl, Data);
                        gxtEl = this.visualProperties(gxtEl, Data);
                        gxtEl = this.firstLevelProperties(gxtEl, Data);
                        gxtEl.fixed = JXG.str2Bool(
                            Data.getElementsByTagName("fix")[0].firstChild.data
                        );
                        gxtEl = this.readNodes(gxtEl, Data, "data");
                        gxtEl = this.transformProperties(gxtEl, "point");

                        p = board.create("point", [gxtEl.x, gxtEl.y], gxtEl);
                        this.parseImage(board, Data, board.options.layer.point, 0, 0, 0, 0, p);
                        this.printDebugMessage("debug", gxtEl, Data.nodeName, "OK");
                        break;
                    case "intersection":
                        gxtEl.strokewidth = 1; // Old file format
                        gxtEl = this.readNodes(gxtEl, Data, "data");
                        xmlNode = Data.getElementsByTagName("first")[1];

                        gxtEl.outFirst = {};
                        gxtEl.outFirst = this.colorProperties(gxtEl.outFirst, xmlNode);
                        gxtEl.outFirst = this.visualProperties(gxtEl.outFirst, xmlNode);
                        gxtEl.outFirst = this.firstLevelProperties(gxtEl.outFirst, xmlNode);
                        gxtEl.outFirst.fixed = JXG.str2Bool(
                            xmlNode.getElementsByTagName("fix")[0].firstChild.data
                        );
                        gxtEl.outFirst = this.transformProperties(gxtEl.outFirst, "point");
                        gxtEl.first = this.changeOriginIds(board, gxtEl.first);
                        gxtEl.last = this.changeOriginIds(board, gxtEl.last);

                        if (
                            board.select(gxtEl.first).elementClass === JXG.OBJECT_CLASS_LINE &&
                            board.select(gxtEl.last).elementClass === JXG.OBJECT_CLASS_LINE
                        ) {
                            inter = board.create(
                                "intersection",
                                [board.objects[gxtEl.first], board.objects[gxtEl.last], 0],
                                gxtEl.outFirst
                            );
                            /* for some reason this if is required */
                            if (gxtEl.outFirst.visible === "false") {
                                inter.hideElement();
                            }
                        } else {
                            xmlNode = Data.getElementsByTagName("last")[1];
                            if (JXG.exists(xmlNode)) {
                                gxtEl.outLast = {};
                                gxtEl.outLast = this.colorProperties(gxtEl.outLast, xmlNode);
                                gxtEl.outLast = this.visualProperties(gxtEl.outLast, xmlNode);
                                gxtEl.outLast = this.firstLevelProperties(
                                    gxtEl.outLast,
                                    xmlNode
                                );
                                gxtEl.outLast.fixed = JXG.str2Bool(
                                    xmlNode.getElementsByTagName("fix")[0].firstChild.data
                                );
                                gxtEl.outLast = this.transformProperties(
                                    gxtEl.outLast,
                                    "point"
                                );

                                inter = board.create(
                                    "intersection",
                                    [board.objects[gxtEl.first], board.objects[gxtEl.last], 0],
                                    gxtEl.outFirst
                                );
                                inter = board.create(
                                    "intersection",
                                    [board.objects[gxtEl.first], board.objects[gxtEl.last], 1],
                                    gxtEl.outLast
                                );
                            }
                        }
                        this.printDebugMessage("debug", gxtEl, Data.nodeName, "OK");
                        break;
                    case "composition":
                        gxtEl = this.readNodes(gxtEl, Data, "data");
                        gxtEl = this.firstLevelProperties(gxtEl, Data);
                        gxtEl.defEl = [];
                        numberDefEls = 0;
                        xmlNode =
                            Data.getElementsByTagName("data")[0].getElementsByTagName("input");
                        for (i = 0; i < xmlNode.length; i++) {
                            gxtEl.defEl[i] = xmlNode[i].firstChild.data;
                            numberDefEls = i + 1;
                        }

                        // every composition produces at least one element and the data for this element is stored
                        // in gxtEl.out. if additional elements are created their data is read in the according case.
                        xmlNode = Data.getElementsByTagName("output")[0];
                        gxtEl.out = {};
                        gxtEl.out = this.colorProperties(gxtEl.out, xmlNode);
                        gxtEl.out = this.visualProperties(gxtEl.out, xmlNode);
                        gxtEl.out = this.firstLevelProperties(gxtEl.out, xmlNode);
                        gxtEl.out = this.transformProperties(gxtEl.out);

                        gxtEl.defEl[0] = this.changeOriginIds(board, gxtEl.defEl[0]);
                        gxtEl.defEl[1] = this.changeOriginIds(board, gxtEl.defEl[1]);
                        gxtEl.defEl[2] = this.changeOriginIds(board, gxtEl.defEl[2]);

                        switch (gxtEl.type) {
                            // ARROW_PARALLEL
                            case "210070":
                                gxtEl.out.fixed = this.gEBTN(xmlNode, "fix");

                                xmlNode = Data.getElementsByTagName("output")[1];
                                gxtEl.outPoint = {};
                                gxtEl.outPoint = this.defProperties(gxtEl.outPoint, xmlNode);
                                gxtEl.outPoint = this.colorProperties(gxtEl.outPoint, xmlNode);
                                gxtEl.outPoint = this.visualProperties(gxtEl.outPoint, xmlNode);
                                gxtEl.outPoint = this.firstLevelProperties(
                                    gxtEl.outPoint,
                                    xmlNode
                                );
                                gxtEl.outPoint = this.transformProperties(gxtEl.outPoint);

                                // construct this by hand, because arrowparallel uses projective geometry now
                                p = board.create(
                                    "parallelpoint",
                                    [gxtEl.defEl[1], gxtEl.defEl[0]],
                                    gxtEl.outPoint
                                );
                                gxtEl.out.firstArrow = false;
                                gxtEl.out.lastArrow = true;
                                el = board.create("segment", [gxtEl.defEl[0], p], gxtEl.out);
                                el.parallelpoint = p;
                                break;

                            // BISECTOR
                            case "210080":
                                gxtEl.out.straightFirst = false;
                                board.create(
                                    "bisector",
                                    [gxtEl.defEl[0], gxtEl.defEl[1], gxtEl.defEl[2]],
                                    gxtEl.out
                                );
                                break;

                            // CIRCUMCIRCLE
                            case "210090":
                                xmlNode = Data.getElementsByTagName("output")[1];
                                gxtEl.outCircle = {};
                                gxtEl.outCircle = this.defProperties(gxtEl.outCircle, xmlNode);
                                gxtEl.outCircle = this.colorProperties(
                                    gxtEl.outCircle,
                                    xmlNode
                                );
                                gxtEl.outCircle = this.visualProperties(
                                    gxtEl.outCircle,
                                    xmlNode
                                );
                                gxtEl.outCircle = this.firstLevelProperties(
                                    gxtEl.outCircle,
                                    xmlNode
                                );
                                gxtEl.outCircle = this.transformProperties(gxtEl.outCircle);
                                gxtEl.outCircle.point = gxtEl.out;
                                board.create(
                                    "circumcircle",
                                    [gxtEl.defEl[0], gxtEl.defEl[1], gxtEl.defEl[2]],
                                    gxtEl.outCircle
                                );
                                break;

                            // CIRCUMCIRCLE_CENTER
                            case "210100":
                                board.create(
                                    "circumcenter",
                                    [gxtEl.defEl[0], gxtEl.defEl[1], gxtEl.defEl[2]],
                                    gxtEl.out
                                );
                                break;

                            // MIDPOINT
                            case "210110":
                                board.create(
                                    "midpoint",
                                    gxtEl.defEl.slice(0, numberDefEls),
                                    gxtEl.out
                                );
                                break;

                            // MIRRORLINE
                            case "210120":
                                board.create(
                                    "reflection",
                                    [gxtEl.defEl[1], gxtEl.defEl[0]],
                                    gxtEl.out
                                );
                                break;

                            // MIRROR_POINT
                            case "210125":
                                board.create(
                                    "mirrorpoint",
                                    [gxtEl.defEl[0], gxtEl.defEl[1]],
                                    gxtEl.out
                                );
                                break;

                            // NORMAL
                            case "210130":
                                //board.create('normal', [gxtEl.defEl[1], gxtEl.defEl[0]], gxtEl.out);
                                board.create(
                                    "perpendicularsegment",
                                    [gxtEl.defEl[0], gxtEl.defEl[1]],
                                    gxtEl.out
                                );
                                break;

                            // PARALLEL
                            case "210140":
                                p = board.create(
                                    "parallelpoint",
                                    [gxtEl.defEl[1], gxtEl.defEl[0]],
                                    {
                                        withLabel: false,
                                        visible: false,
                                        name: "",
                                        fixed: true
                                    }
                                );

                                // GEONExT uses its own parallel construction to make the order
                                // of intersection points compatible.
                                // el = board.create('parallel', [gxtEl.defEl[1], gxtEl.defEl[0]], gxtEl.out);
                                el = board.create("line", [gxtEl.defEl[0], p], gxtEl.out);
                                el.parallelpoint = p;
                                break;

                            // PARALLELOGRAM_POINT
                            case "210150":
                                board.create(
                                    "parallelpoint",
                                    gxtEl.defEl.slice(0, numberDefEls),
                                    gxtEl.out
                                );
                                break;

                            // PERPENDICULAR
                            case "210160":
                                // output[0] was already read and is stored in gxtEl.out
                                gxtEl.out.fixed = this.gEBTN(xmlNode, "fix");

                                xmlNode = Data.getElementsByTagName("output")[1];
                                gxtEl.outLine = {};
                                gxtEl.outLine = this.defProperties(gxtEl.outLine, xmlNode);
                                gxtEl.outLine = this.colorProperties(gxtEl.outLine, xmlNode);
                                gxtEl.outLine = this.visualProperties(gxtEl.outLine, xmlNode);
                                gxtEl.outLine = this.firstLevelProperties(
                                    gxtEl.outLine,
                                    xmlNode
                                );
                                gxtEl.outLine = this.readNodes(
                                    gxtEl.outLine,
                                    xmlNode,
                                    "straight",
                                    "straight"
                                );
                                gxtEl.outLine = this.transformProperties(gxtEl.outLine);
                                gxtEl.outLine.point = gxtEl.out;

                                board.create(
                                    "perpendicularsegment",
                                    [gxtEl.defEl[1], gxtEl.defEl[0]],
                                    gxtEl.outLine
                                );
                                break;

                            // PERPENDICULAR_POINT
                            case "210170":
                                board.create(
                                    "perpendicularpoint",
                                    [gxtEl.defEl[1], gxtEl.defEl[0]],
                                    gxtEl.out
                                );
                                break;

                            // ROTATION
                            case "210180":
                                throw new Error(
                                    "JSXGraph: Element ROTATION not yet implemented."
                                );

                            // SECTOR
                            case "210190":
                                // sectors usually provide more than one output element but JSXGraph is not fully compatible
                                // to GEONExT sector elements. GEONExT sectors consist of two lines, a point, and a sector,
                                // JSXGraph uses a curve to display the sector incl. the borders, and
                                // a point and two lines.
                                // Gliders on sectors also run through the borders.
                                gxtEl.out = this.defProperties(gxtEl.out, xmlNode);
                                gxtEl.out.firstArrow = JXG.str2Bool(
                                    this.gEBTN(xmlNode, "firstarrow")
                                );
                                gxtEl.out.lastArrow = JXG.str2Bool(
                                    this.gEBTN(xmlNode, "lastarrow")
                                );

                                xmlNode = [];
                                c = [];

                                for (i = 0; i < 4; i++) {
                                    xmlNode[i] = Data.getElementsByTagName("output")[i];
                                    gxtEl.out = {};
                                    gxtEl.out = this.defProperties(gxtEl.out, xmlNode[i]);
                                    gxtEl.out = this.colorProperties(gxtEl.out, xmlNode[i]);
                                    gxtEl.out = this.visualProperties(gxtEl.out, xmlNode[i]);
                                    gxtEl.out = this.firstLevelProperties(
                                        gxtEl.out,
                                        xmlNode[i]
                                    );
                                    gxtEl.out = this.transformProperties(gxtEl.out);
                                    c[i] = gxtEl.out;
                                }

                                // i === 0
                                el = board.create("sector", gxtEl.defEl, c[0]);

                                // i === 1
                                p = board.create(
                                    "point",
                                    [
                                        function () {
                                            var p1 = board.select(gxtEl.defEl[1]),
                                                p2 = board.select(gxtEl.defEl[2]);

                                            return (
                                                p1.X() +
                                                ((p2.X() - p1.X()) * el.Radius) / p1.Dist(p2)
                                            );
                                        },
                                        function () {
                                            var p1 = board.select(gxtEl.defEl[1]),
                                                p2 = board.select(gxtEl.defEl[2]);

                                            return (
                                                p1.Y() +
                                                ((p2.Y() - p1.Y()) * el.Radius) / p1.Dist(p2)
                                            );
                                        }
                                    ],
                                    c[1]
                                );

                                // i === 2
                                el = board.create(
                                    "segment",
                                    [gxtEl.defEl[0], gxtEl.defEl[1]],
                                    c[2]
                                );

                                // i === 3
                                el = board.create("segment", [gxtEl.defEl[1], p], c[3]);
                                break;
                            default:
                                throw new Error(
                                    "JSXGraph: GEONExT -- element " +
                                        gxtEl.type +
                                        " not implemented."
                                );
                        }
                        this.printDebugMessage("debug", gxtEl, Data.nodeName, "OK");
                        break;
                    case "polygon":
                        gxtEl = this.colorProperties(gxtEl, Data);
                        gxtEl = this.firstLevelProperties(gxtEl, Data);
                        dataVertex = [];

                        // In Geonext file format the first vertex is equal to the last vertex:
                        for (
                            i = 0;
                            i <
                            Data.getElementsByTagName("data")[0].getElementsByTagName("vertex")
                                .length -
                                1;
                            i++
                        ) {
                            dataVertex[i] =
                                Data.getElementsByTagName("data")[0].getElementsByTagName(
                                    "vertex"
                                )[i].firstChild.data;
                            dataVertex[i] = this.changeOriginIds(board, dataVertex[i]);
                        }
                        gxtEl.border = [];
                        gxtEl.borders = {
                            ids: [],
                            names: []
                        };
                        for (i = 0; i < Data.getElementsByTagName("border").length; i++) {
                            gxtEl.border[i] = {};
                            xmlNode = Data.getElementsByTagName("border")[i];
                            gxtEl.border[i].id =
                                xmlNode.getElementsByTagName("id")[0].firstChild.data;
                            gxtEl.borders.ids.push(gxtEl.border[i].id);
                            gxtEl.border[i].name =
                                xmlNode.getElementsByTagName("name")[0].firstChild.data;
                            gxtEl.borders.names.push(gxtEl.border[i].name);

                            gxtEl.border[i].straightFirst = JXG.str2Bool(
                                xmlNode
                                    .getElementsByTagName("straight")[0]
                                    .getElementsByTagName("first")[0].firstChild.data
                            );
                            gxtEl.border[i].straightLast = JXG.str2Bool(
                                xmlNode
                                    .getElementsByTagName("straight")[0]
                                    .getElementsByTagName("last")[0].firstChild.data
                            );
                            try {
                                gxtEl.border[i].strokeWidth =
                                    xmlNode.getElementsByTagName(
                                        "strokewidth"
                                    )[0].firstChild.data;
                            } catch (ex) {
                                gxtEl.border[i].strokeWidth =
                                    xmlNode.getElementsByTagName("width")[0].firstChild.data;
                            }
                            try {
                                gxtEl.border[i].dash = JXG.str2Bool(
                                    xmlNode.getElementsByTagName("dash")[0].firstChild.data
                                );
                            } catch (exc) {}

                            gxtEl.border[i].visible = JXG.str2Bool(
                                xmlNode.getElementsByTagName("visible")[0].firstChild.data
                            );
                            gxtEl.border[i].draft = JXG.str2Bool(
                                xmlNode.getElementsByTagName("draft")[0].firstChild.data
                            );
                            gxtEl.border[i].trace = JXG.str2Bool(
                                xmlNode.getElementsByTagName("trace")[0].firstChild.data
                            );

                            xmlNode =
                                Data.getElementsByTagName("border")[i].getElementsByTagName(
                                    "color"
                                )[0];
                            rgbo = JXG.rgba2rgbo(
                                xmlNode.getElementsByTagName("stroke")[0].firstChild.data
                            );
                            gxtEl.border[i].strokeColor = rgbo[0];
                            gxtEl.border[i].strokeOpacity = rgbo[1];

                            rgbo = JXG.rgba2rgbo(
                                xmlNode.getElementsByTagName("lighting")[0].firstChild.data
                            );
                            gxtEl.border[i].highlightStrokeColor = rgbo[0];
                            gxtEl.border[i].highlightStrokeOpacity = rgbo[1];

                            rgbo = JXG.rgba2rgbo(
                                xmlNode.getElementsByTagName("fill")[0].firstChild.data
                            );
                            gxtEl.border[i].fillColor = rgbo[0];
                            gxtEl.border[i].fillOpacity = rgbo[1];

                            gxtEl.border[i].highlightFillColor = gxtEl.border[i].fillColor;
                            gxtEl.border[i].highlightFillOpacity = gxtEl.border[i].fillOpacity;

                            gxtEl.border[i].labelColor =
                                xmlNode.getElementsByTagName("label")[0].firstChild.data;
                            gxtEl.border[i].colorDraft =
                                xmlNode.getElementsByTagName("draft")[0].firstChild.data;
                        }
                        gxtEl = this.transformProperties(gxtEl);
                        p = board.create("polygon", dataVertex, gxtEl);

                        // to emulate the geonext behaviour on invisible polygons
                        // A.W.: Why do we need this?
                        /*
                 if (!gxtEl.visible) {
                 p.setAttribute({
                 fillColor: 'none',
                 highlightFillColor: 'none'
                 });
                 }
                 */
                        for (i = 0; i < p.borders.length; i++) {
                            p.borders[i].setAttribute(gxtEl.border[i]);
                        }

                        this.printDebugMessage("debug", gxtEl, Data.nodeName, "OK");
                        break;
                    case "graph":
                        gxtEl = this.colorProperties(gxtEl, Data);
                        gxtEl = this.firstLevelProperties(gxtEl, Data);
                        gxtEl.funct =
                            Data.getElementsByTagName("data")[0].getElementsByTagName(
                                "function"
                            )[0].firstChild.data;
                        gxtEl.funct = board.jc.snippet(gxtEl.funct, true, "x", true);

                        c = board.create("plot", [gxtEl.funct], {
                            id: gxtEl.id,
                            name: gxtEl.name,
                            strokeColor: gxtEl.strokeColor,
                            strokeWidth: gxtEl.strokeWidth,
                            fillColor: "none",
                            highlightFillColor: "none",
                            highlightStrokeColor: gxtEl.highlightStrokeColor,
                            visible: JXG.str2Bool(gxtEl.visible)
                        });

                        this.printDebugMessage("debug", gxtEl, Data.nodeName, "OK");
                        break;
                    case "arrow":
                        gxtEl = this.colorProperties(gxtEl, Data);
                        gxtEl = this.visualProperties(gxtEl, Data);
                        gxtEl = this.firstLevelProperties(gxtEl, Data);
                        gxtEl = this.readNodes(gxtEl, Data, "data");
                        gxtEl = this.readNodes(gxtEl, Data, "straight", "straight");

                        gxtEl = this.transformProperties(gxtEl);
                        gxtEl.first = this.changeOriginIds(board, gxtEl.first);
                        gxtEl.last = this.changeOriginIds(board, gxtEl.last);

                        l = board.create("arrow", [gxtEl.first, gxtEl.last], gxtEl);

                        this.printDebugMessage("debug", l, Data.nodeName, "OK");
                        break;
                    case "arc":
                        gxtEl = this.colorProperties(gxtEl, Data);
                        gxtEl = this.visualProperties(gxtEl, Data);
                        gxtEl = this.firstLevelProperties(gxtEl, Data);
                        gxtEl = this.readNodes(gxtEl, Data, "data");

                        // It seems that JSXGraph and GEONExT use opposite directions.
                        gxtEl.firstArrow = JXG.str2Bool(
                            Data.getElementsByTagName("lastarrow")[0].firstChild.data
                        );
                        gxtEl.lastArrow = JXG.str2Bool(
                            Data.getElementsByTagName("firstarrow")[0].firstChild.data
                        );

                        gxtEl = this.transformProperties(gxtEl);

                        gxtEl.center = this.changeOriginIds(board, gxtEl.midpoint);
                        gxtEl.angle = this.changeOriginIds(board, gxtEl.angle);
                        gxtEl.radius = this.changeOriginIds(board, gxtEl.radius);

                        c = board.create(
                            "arc",
                            [gxtEl.center, gxtEl.radius, gxtEl.angle],
                            gxtEl
                        );

                        this.printDebugMessage("debug", c, Data.nodeName, "OK");
                        break;
                    case "angle":
                        gxtEl = this.colorProperties(gxtEl, Data);
                        gxtEl = this.visualProperties(gxtEl, Data);
                        gxtEl = this.firstLevelProperties(gxtEl, Data);
                        gxtEl = this.readNodes(gxtEl, Data, "data");
                        gxtEl = this.transformProperties(gxtEl);
                        gxtEl.radius *= 1.0;

                        c = board.create(
                            "angle",
                            [gxtEl.first, gxtEl.middle, gxtEl.last],
                            gxtEl
                        );
                        this.printDebugMessage("debug", gxtEl, Data.nodeName, "OK");
                        break;
                    case "text":
                        if (gxtEl.id.match(/oldVersion/)) {
                            break;
                        }
                        gxtEl = this.colorProperties(gxtEl, Data);
                        gxtEl = this.visualProperties(gxtEl, Data);
                        gxtEl = this.firstLevelProperties(gxtEl, Data);

                        gxtEl = this.readNodes(gxtEl, Data, "data");
                        try {
                            gxtEl.mpStr = this.subtreeToString(
                                Data.getElementsByTagName("data")[0].getElementsByTagName(
                                    "mp"
                                )[0]
                            );
                            gxtEl.mpStr = gxtEl.mpStr.replace(/<\/?mp>/g, "");
                        } catch (ex1) {
                            gxtEl.mpStr = this.subtreeToString(
                                Data.getElementsByTagName("data")[0].getElementsByTagName(
                                    "content"
                                )[0]
                            );
                            gxtEl.mpStr = gxtEl.mpStr.replace(/<\/?content>/g, "");
                        }
                        gxtEl.fixed = false;
                        try {
                            if (
                                Data.getElementsByTagName("data")[0].getElementsByTagName(
                                    "parent"
                                )[0].firstChild
                            ) {
                                gxtEl.parent =
                                    Data.getElementsByTagName("data")[0].getElementsByTagName(
                                        "parent"
                                    )[0].firstChild.data;
                                gxtEl.fixed = true;
                            }
                        } catch (ex2) {}

                        try {
                            gxtEl.condition =
                                Data.getElementsByTagName("condition")[0].firstChild.data;
                        } catch (ex3) {
                            gxtEl.condition = "";
                        }
                        gxtEl.content = Data.getElementsByTagName("content")[0].firstChild.data;
                        try {
                            gxtEl.fixed = Data.getElementsByTagName("fix")[0].firstChild.data;
                        } catch (ex4) {
                            gxtEl.fixed = false;
                        }
                        // not used: gxtEl.digits = Data.getElementsByTagName('cs')[0].firstChild.data;
                        try {
                            gxtEl.autodigits =
                                Data.getElementsByTagName("digits")[0].firstChild.data;
                        } catch (ex5) {
                            gxtEl.autodigits = 2;
                        }
                        gxtEl.parent = this.changeOriginIds(board, gxtEl.parent);

                        c = board.create(
                            "text",
                            [parseFloat(gxtEl.x), parseFloat(gxtEl.y), gxtEl.mpStr],
                            {
                                anchor: gxtEl.parent,
                                id: gxtEl.id,
                                name: gxtEl.name,
                                digits: gxtEl.autodigits,
                                isLabel: false,
                                strokeColor: gxtEl.colorLabel,
                                fixed: gxtEl.fixed,
                                visible: JXG.str2Bool(gxtEl.visible)
                            }
                        );
                        break;
                    case "parametercurve":
                        gxtEl = this.colorProperties(gxtEl, Data);
                        gxtEl = this.visualProperties(gxtEl, Data);
                        gxtEl = this.firstLevelProperties(gxtEl, Data);
                        gxtEl = this.transformProperties(gxtEl);
                        gxtEl.functionx =
                            Data.getElementsByTagName("functionx")[0].firstChild.data;
                        gxtEl.functiony =
                            Data.getElementsByTagName("functiony")[0].firstChild.data;
                        gxtEl.min = Data.getElementsByTagName("min")[0].firstChild.data;
                        gxtEl.max = Data.getElementsByTagName("max")[0].firstChild.data;
                        gxtEl.fillColor = "none";
                        gxtEl.highlightFillColor = "none";

                        // intentional
                        /*jslint evil:true*/
                        board.create(
                            "curve",
                            [
                                board.jc.snippet(gxtEl.functionx, true, "t", true),
                                board.jc.snippet(gxtEl.functiony, true, "t", true),
                                board.jc.snippet(gxtEl.min, true, "", true),
                                board.jc.snippet(gxtEl.max, true, "", true)
                            ],
                            gxtEl
                        );
                        /*jslint evil:false*/
                        this.printDebugMessage("debug", gxtEl, Data.nodeName, "OK");
                        break;
                    case "tracecurve":
                        gxtEl.tracepoint =
                            Data.getElementsByTagName("tracepoint")[0].firstChild.data;
                        gxtEl.traceslider =
                            Data.getElementsByTagName("traceslider")[0].firstChild.data;
                        board.create(
                            "tracecurve",
                            [gxtEl.traceslider, gxtEl.tracepoint],
                            gxtEl
                        );
                        this.printDebugMessage("debug", gxtEl, Data.nodeName, "OK");
                        break;
                    case "group":
                        gxtEl = this.colorProperties(gxtEl, Data);
                        gxtEl = this.firstLevelProperties(gxtEl, Data);
                        gxtEl.members = [];

                        for (
                            i = 0;
                            i <
                            Data.getElementsByTagName("data")[0].getElementsByTagName("member")
                                .length;
                            i++
                        ) {
                            gxtEl.members[i] =
                                Data.getElementsByTagName("data")[0].getElementsByTagName(
                                    "member"
                                )[i].firstChild.data;
                            gxtEl.members[i] = this.changeOriginIds(board, gxtEl.members[i]);
                        }

                        c = new JXG.Group(board, gxtEl.id, gxtEl.name, gxtEl.members);
                        this.printDebugMessage("debug", gxtEl, Data.nodeName, "OK");
                        break;
                    default:
                        JXG.debug("* Err: " + Data.nodeName + " not yet implemented");
                }
            },

            /**
             * Reading the elements of a geonext file
             */
            read: function () {
                var xmlNode,
                    elChildNodes,
                    s,
                    boardData,
                    conditions,
                    tmp,
                    tree = this.tree,
                    board = this.board,
                    strTrue = "true";

                // maybe this is not necessary as we already provide layer options for sectors and circles via JXG.Options but
                // maybe these have to be the same for geonext.
                board.options.layer.sector = board.options.layer.angle;
                board.options.layer.circle = board.options.layer.angle;

                board.options.line.label.position = "top";

                boardData = this.gEBTN(tree, "board", 0, false);
                conditions = this.readConditions(
                    boardData.getElementsByTagName("conditions")[0]
                );

                // set the board background color
                s = this.gEBTN(boardData, "background", 0, false);
                s = this.gEBTN(s, "color", 0, true);
                tmp = JXG.rgba2rgbo(s);
                s = JXG.rgbParser(tmp[0]);
                board.containerObj.style.backgroundColor =
                    "rgba(" + s[0] + ", " + s[1] + ", " + s[2] + ", " + tmp[1] + ")";

                // resize board
                if (board.attr.takeSizeFromFile) {
                    board.resizeContainer(
                        this.gEBTN(boardData, "width"),
                        this.gEBTN(boardData, "height")
                    );
                }

                xmlNode = this.gEBTN(boardData, "coordinates", 0, false);

                tmp = this.readViewPort(xmlNode);

                if (tmp.length === 4) {
                    board.setBoundingBox(tmp, true);
                } else {
                    // zoom level
                    tmp = this.gEBTN(xmlNode, "zoom", 0, false);
                    board.zoomX = parseFloat(this.gEBTN(tmp, "x"));
                    board.zoomY = parseFloat(this.gEBTN(tmp, "y"));

                    // set the origin
                    tmp = this.gEBTN(xmlNode, "origin", 0, false);
                    board.origin = {
                        usrCoords: [1, 0, 0],
                        scrCoords: [
                            1,
                            parseFloat(this.gEBTN(tmp, "x")) * board.zoomX,
                            parseFloat(this.gEBTN(tmp, "y")) * board.zoomY
                        ]
                    };

                    // screen to user coordinates conversion
                    tmp = this.gEBTN(xmlNode, "unit", 0, false);
                    board.unitX = parseFloat(this.gEBTN(tmp, "x")) * board.zoomX;
                    board.unitY = parseFloat(this.gEBTN(tmp, "y")) * board.zoomY;
                }

                if (board.attr.takeSizeFromFile) {
                    board.resizeContainer(
                        this.gEBTN(boardData, "width"),
                        this.gEBTN(boardData, "height")
                    );
                }

                // check and set fontSize
                if (parseFloat(board.options.text.fontSize) < 0) {
                    board.options.text.fontSize = 12;
                }

                board.geonextCompatibilityMode = true;

                // jsxgraph chooses an id for the board but we don't want to use it, we want to use
                // the id stored in the geonext file. if you know why this is required, please note it here.
                delete JXG.boards[board.id];

                board.id = this.gEBTN(boardData, "id");

                JXG.boards[board.id] = board;

                // this creates some basic elements present in every geonext construction but not explicitly present in the file
                board.initGeonextBoard();

                // Update of properties during update() is not necessary in GEONExT files
                // But it maybe necessary if we construct with JavaScript afterwards
                board.renderer.enhancedRendering = true;

                // Read background image
                this.parseImage(
                    board,
                    this.gEBTN(boardData, "file", 0, false),
                    board.options.layer.image
                );

                board.options.point.snapToGrid =
                    this.gEBTN(this.gEBTN(boardData, "coordinates", 0, false), "snap") ===
                    strTrue;

                // If snapToGrid and snapToPoint are both true, point snapping is enabled
                if (
                    board.options.point.snapToGrid &&
                    this.gEBTN(this.gEBTN(boardData, "grid", 1, false), "pointsnap") === strTrue
                ) {
                    board.options.point.snapToGrid = false;
                    board.options.point.snapToPoints = true;
                    board.options.point.attractorDistance = 0.5;
                }

                xmlNode = this.gEBTN(boardData, "grid", 1, false);
                tmp = this.gEBTN(xmlNode, "x");
                if (tmp) {
                    board.options.grid.gridX = 1 / parseFloat(tmp);
                    board.options.point.snapSizeX = 1 / parseFloat(tmp);
                }
                tmp = this.gEBTN(xmlNode, "y");
                if (tmp) {
                    board.options.grid.gridY = 1 / parseFloat(tmp);
                    board.options.point.snapSizeY = 1 / parseFloat(tmp);
                }

                board.options.grid.gridDash = JXG.str2Bool(this.gEBTN(xmlNode, "dash"));

                tmp = JXG.rgba2rgbo(this.gEBTN(xmlNode, "color"));
                board.options.grid.gridColor = tmp[0];
                board.options.grid.gridOpacity = tmp[1];

                xmlNode = this.gEBTN(boardData, "coordinates", 0, false);
                if (this.gEBTN(xmlNode, "grid") === strTrue) {
                    board.create("grid", []);
                }

                if (this.gEBTN(xmlNode, "coord") === strTrue) {
                    // Hard coded default option
                    board.options.axis.ticks.majorHeight = 10;

                    // Hard coded default option
                    board.options.axis.ticks.minorHeight = 4;
                    board.create("axis", [
                        [0, 0],
                        [1, 0]
                    ]);
                    board.create("axis", [
                        [0, 0],
                        [0, 1]
                    ]);
                }

                tmp = this.gEBTN(this.gEBTN(boardData, "background", 0, false), "color");
                if (tmp.length === 8) {
                    tmp = "#" + tmp;
                }
                board.containerObj.style.backgroundColor = JXG.rgba2rgbo(tmp)[0];

                elChildNodes = tree.getElementsByTagName("elements")[0].childNodes;
                for (s = 0; s < elChildNodes.length; s++) {
                    this.readNode(elChildNodes, s, board);
                }
                board.addConditions(conditions);
            },

            decodeString: function (str) {
                var unz;

                if (str.indexOf("<GEONEXT>") < 0) {
                    unz = new JXG.Util.Unzip(JXG.Util.Base64.decodeAsArray(str)).unzip();
                    if (unz === "") {
                        return str;
                    }

                    return unz;
                }

                return str;
            },

            prepareString: function (fileStr) {
                try {
                    if (fileStr.indexOf("GEONEXT") < 0) {
                        // Base64 decoding
                        fileStr = this.decodeString(fileStr)[0][0];
                    }
                    // Hacks to enable not well formed XML. Will be redone in geonext2JS and Board.addConditions
                    fileStr = this.fixXML(fileStr);
                } catch (exc2) {
                    fileStr = "";
                }
                return fileStr;
            },

            fixXML: function (str) {
                var arr = [
                        "active",
                        "angle",
                        "animate",
                        "animated",
                        "arc",
                        "area",
                        "arrow",
                        "author",
                        "autodigits",
                        "axis",
                        "back",
                        "background",
                        "board",
                        "border",
                        "bottom",
                        "buttonsize",
                        "cas",
                        "circle",
                        "color",
                        "comment",
                        "composition",
                        "condition",
                        "conditions",
                        "content",
                        "continuous",
                        "control",
                        "coord",
                        "coordinates",
                        "cross",
                        "cs",
                        "dash",
                        "data",
                        "description",
                        "digits",
                        "direction",
                        "draft",
                        "editable",
                        "elements",
                        "event",
                        "file",
                        "fill",
                        "first",
                        "firstarrow",
                        "fix",
                        "fontsize",
                        "free",
                        "full",
                        "function",
                        "functionx",
                        "functiony",
                        "GEONEXT",
                        "graph",
                        "grid",
                        "group",
                        "height",
                        "id",
                        "image",
                        "info",
                        "information",
                        "input",
                        "intersection",
                        "item",
                        "jsf",
                        "label",
                        "last",
                        "lastarrow",
                        "left",
                        "lefttoolbar",
                        "lighting",
                        "line",
                        "loop",
                        "max",
                        "maximized",
                        "member",
                        "middle",
                        "midpoint",
                        "min",
                        "modifier",
                        "modus",
                        "mp",
                        "mpx",
                        "multi",
                        "name",
                        "onpolygon",
                        "order",
                        "origin",
                        "output",
                        "overline",
                        "parametercurve",
                        "parent",
                        "point",
                        "pointsnap",
                        "polygon",
                        "position",
                        "radius",
                        "radiusnum",
                        "radiusvalue",
                        "right",
                        "section",
                        "selectedlefttoolbar",
                        "showconstruction",
                        "showcoord",
                        "showinfo",
                        "showunit",
                        "showx",
                        "showy",
                        "size",
                        "slider",
                        "snap",
                        "speed",
                        "src",
                        "start",
                        "stop",
                        "straight",
                        "stroke",
                        "strokewidth",
                        "style",
                        "term",
                        "text",
                        "top",
                        "trace",
                        "tracecurve",
                        "tracepoint",
                        "traceslider",
                        "type",
                        "unit",
                        "value",
                        "VERSION",
                        "vertex",
                        "viewport",
                        "visible",
                        "width",
                        "wot",
                        "x",
                        "xooy",
                        "xval",
                        "y",
                        "yval",
                        "zoom"
                    ],
                    list = arr.join("|"),
                    regex = "&lt;(/?(" + list + "))&gt;",
                    expr = new RegExp(regex, "g");

                // First, we convert all < to &lt; and > to &gt;
                str = JXG.escapeHTML(str);
                // Second, we convert all GEONExT tags of the form &lt;tag&gt; back to <tag>
                str = str.replace(expr, "<$1>");

                // intentional
                /*jslint regexp:true*/
                str = str.replace(/(<content>.*)<arc>(.*<\/content>)/g, "$1&lt;arc&gt;$2");
                str = str.replace(/(<mp>.*)<arc>(.*<\/mpx>)/g, "$1&lt;arc&gt;$2");
                str = str.replace(/(<mpx>.*)<arc>(.*<\/mpx>)/g, "$1&lt;arc&gt;$2");
                /*jslint regexp:false*/

                return str;
            }
        }
    );

    JXG.registerReader(JXG.GeonextReader, ["gxt", "geonext"]);
})();
