/*
    Copyright 2008,2009, 2010
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with JSXGraph.  If not, see <http://www.gnu.org/licenses/>.
*/
JXG.GeonextReader = {

    changeOriginIds: function (board, id) {
        if ((id == 'gOOe0') || (id == 'gXOe0') || (id == 'gYOe0') || (id == 'gXLe0') || (id == 'gYLe0')) {
            return board.id + id;
        } else {
            return id;
        }
    },

    /**
     * Set color properties of a geonext element.
     * Set stroke, fill, lighting, label and draft color attributes.
     * @param {Object} gxtEl element of which attributes are to set
     */
    colorProperties: function (gxtEl, Data) {
        var rgbo;
        //gxtEl.strokewidth = Data.getElementsByTagName('strokewidth')[0].firstChild.data;
        // colorStroke = strokeColor etc. is here for downwards compatibility:
        // once upon a time we used to create elements in here using the "new JXG.Element" constructor mechanism
        // then we changed to board.create + setProperty afterwords
        // now i want to use the board.create method with an appropriate attributes object to avoid setProperty calls
        // and as gxtEl happens to be somewhat like an attributes object it's  just slightly different so we adjust it
        // for downwards compatibility during the transformation of this reader we use both properties

        rgbo = JXG.rgba2rgbo(Data.getElementsByTagName('color')[0].getElementsByTagName('stroke')[0].firstChild.data);
        gxtEl.strokeColor = rgbo[0];
        gxtEl.strokeOpacity = rgbo[1];

        rgbo = JXG.rgba2rgbo(Data.getElementsByTagName('color')[0].getElementsByTagName('lighting')[0].firstChild.data);
        gxtEl.highlightStrokeColor = rgbo[0];
        gxtEl.highlightStrokeOpacity = rgbo[1];

        rgbo = JXG.rgba2rgbo(Data.getElementsByTagName('color')[0].getElementsByTagName('fill')[0].firstChild.data);
        gxtEl.fillColor = rgbo[0];
        gxtEl.fillOpacity = rgbo[1];

        gxtEl.highlightFillColor = gxtEl.fillColor;
        gxtEl.highlightFillOpacity = gxtEl.fillOpacity;

        gxtEl.labelColor = JXG.rgba2rgbo(Data.getElementsByTagName('color')[0].getElementsByTagName('label')[0].firstChild.data)[0];
        gxtEl.colorDraft = JXG.rgba2rgbo(Data.getElementsByTagName('color')[0].getElementsByTagName('draft')[0].firstChild.data)[0];

        // backwards compatibility
        gxtEl.colorStroke = gxtEl.strokeColor;
        gxtEl.colorFill = gxtEl.fillColor;
        gxtEl.colorLabel = gxtEl.labelColor;

        return gxtEl;
    },

    firstLevelProperties: function (gxtEl, Data) {
        var arr = Data.childNodes, n, key;

        for (n = 0; n < arr.length; n++) {
            if (JXG.exists(arr[n].firstChild) && arr[n].nodeName !== 'data' && arr[n].nodeName !== 'straight') {
                key = arr[n].nodeName;
                gxtEl[key] = arr[n].firstChild.data;
            }
        }
        
        return gxtEl;
    },

    /**
     * Set the board properties of a geonext element.
     * Set active, area, dash, draft and showinfo attributes.
     * @param {Object} gxtEl element of which attributes are to set
     */
    boardProperties: function (gxtEl) {
        return gxtEl;
    },

    /**
     * Set the defining properties of a geonext element.
     * Writing the nodeName to ident; setting the name attribute and defining the element id.
     * @param {Object} gxtEl element of which attributes are to set
     */
    defProperties: function (gxtEl, Data) {
        if (Data.nodeType==3 || Data.nodeType==8 ) { return null; } // 3==TEXT_NODE, 8==COMMENT_NODE
        gxtEl.ident = Data.nodeName;
        if(gxtEl.ident == "text" || gxtEl.ident == "intersection" || gxtEl.ident == "composition") {
            gxtEl.name = '';
        }
        else {
            gxtEl.name = Data.getElementsByTagName('name')[0].firstChild.data;
        }
        gxtEl.id = Data.getElementsByTagName('id')[0].firstChild.data;

        return gxtEl;
    },

    visualProperties: function (gxtEl, Data) {
        gxtEl.visible = JXG.str2Bool(Data.getElementsByTagName('visible')[0].firstChild.data);
        gxtEl.trace = JXG.str2Bool(Data.getElementsByTagName('trace')[0].firstChild.data);
        return gxtEl;
    },

    transformProperties: function (gxtEl) {
        var facemap = [
                // 0-2
                'cross', 'cross', 'cross',
                // 3-6
                'circle', 'circle', 'circle', 'circle',
                // 7-9
                'square', 'square', 'square',
                // 10-12
                'plus', 'plus', 'plus'
            ], sizemap = [
                // 0-2
                2, 3, 4,
                // 3-6
                1, 2, 3, 4,
                // 7-9
                2, 3, 4,
                // 10-12
                2, 3, 4
            ];

        gxtEl.strokeWidth = gxtEl.strokewidth;
        gxtEl.face = facemap[parseInt(gxtEl.style, 10)];
        gxtEl.size = sizemap[parseInt(gxtEl.style, 10)];

        gxtEl.straightFirst = JXG.str2Bool(gxtEl.straightFirst);
        gxtEl.straightLast = JXG.str2Bool(gxtEl.straightLast);

        gxtEl.visible = JXG.str2Bool(gxtEl.visible);
        gxtEl.draft = JXG.str2Bool(gxtEl.draft);
        gxtEl.trace = JXG.str2Bool(gxtEl.trace);

        return gxtEl;
    },

    readNodes: function (gxtEl, Data, nodeType, prefix) {
        var arr = Data.getElementsByTagName(nodeType)[0].childNodes,
            key, n;

        for (n = 0; n < arr.length; n++) {
            if (arr[n].firstChild != null) {
                if (prefix != null) {
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
            return (new XMLSerializer()).serializeToString(root);
        } catch (e) {
            // IE
            return root.xml;
        }
    },

    readImage: function (node) {
        var pic = '',
            nod = node;

        if (nod != null) {
            pic = nod.data;
            while (nod.nextSibling != null) {
                nod = nod.nextSibling;
                pic += nod.data;
            }
        }
        return pic;
    },

    parseImage: function (board, fileNode, level, x, y, w, h, el) {
        var tag, id, im, picStr, tmpImg;

        if (fileNode == null) {
            return null;
        }

        if (fileNode.getElementsByTagName('src')[0] != null) {  // Background image
            tag = 'src';
        } else if (fileNode.getElementsByTagName('image')[0] != null) {
            tag = 'image';
        } else {
            return null;
        }

        picStr = this.readImage(fileNode.getElementsByTagName(tag)[0].firstChild);
        if (picStr!='') {
            picStr = 'data:image/png;base64,' + picStr;
            if (tag=='src') {  // Background image
                x = fileNode.getElementsByTagName('x')[0].firstChild.data;
                y = fileNode.getElementsByTagName('y')[0].firstChild.data;
                w = fileNode.getElementsByTagName('width')[0].firstChild.data;
                h = fileNode.getElementsByTagName('height')[0].firstChild.data;
                id = false;
                im = new JXG.Image(board,picStr,[x,y],[w,h], level, id, false, el);
                return im;
            } else {  // Image bound to an element
                /*
                 Read the original dimensions, i.e. the ratio h/w,
                 with the help of a temporary image.
                 We have to wait until the image is loaded, therefore
                 we need "onload".
                 */
                tmpImg = new Image();
                tmpImg.src = picStr;
                id = el.id+'_image';
                tmpImg.onload = function(){
                    // Now, we can read the original dimensions of the image.
                    var wOrg = this.width,
                        hOrg = this.height,
                        xf, yf, wf, hf, im, tRot;
                    if (el.elementClass == JXG.OBJECT_CLASS_LINE) {
                        // A line containing an image, runs through the horizontal middle
                        // of the image.
                        xf = function(){ return el.point1.X(); };
                        wf = function(){ return el.point1.Dist(el.point2); };
                        hf = function(){ return wf() * hOrg / wOrg; };
                        yf = function(){ return el.point1.Y() - hf() * 0.5; };
                        im = board.create('image', [picStr, [xf,yf], [wf,hf]], {
                                layer: level,
                                id: id,
                                anchor: el
                            });
                        tRot = board.create('transform', [
                                function () {
                                    return Math.atan2(el.point2.Y()-el.point1.Y(), el.point2.X()-el.point1.X())
                                },
                                el.point1
                            ], {
                                type:'rotate'
                            });
                        tRot.bindTo(im);
                    } else if (el.elementClass == JXG.OBJECT_CLASS_POINT) {
                        wf = function(){ return wOrg / board.stretchX; };
                        hf = function(){ return hOrg / board.stretchY; };
                        xf = function(){ return el.X() - wf() * 0.5; };
                        yf = function(){ return el.Y() - hf() * 0.5; };

                        im = board.create('image', [picStr, [xf,yf], [wf,hf]], {
                                size: (0.5*Math.min(wOrg, hOrg)),
                                fillOpacity: 0,
                                strokeOpacity: 0,
                                highlightFillOpacity: 0,
                                highlightStrokeOpacity: 0,
                                withLabel: false,
                                layer: level,
                                id: id,
                                anchor: el
                            });
                        board.renderer.hide(el.label.content);
                    } else if (el.elementClass == JXG.OBJECT_CLASS_CIRCLE) {
                        // A circle containing an image
                        wf = function(){ return 2.0 * el.Radius(); };
                        hf = function(){ return wf() * hOrg / wOrg; };
                        xf = function(){ return el.midpoint.X() - wf() * 0.5; };
                        yf = function(){ return el.midpoint.Y() - hf() * 0.5; };
                        im = board.create('image', [picStr, [xf,yf], [wf,hf]], {
                            layer: level,
                            id: id,
                            anchor: el
                        });
                    } else {
                        im = board.create('image', [picStr, [x, y], [w, h]], {
                            layer: level,
                            id: id,
                            anchor: el
                        });
                        el.image = im;
                    }
                };
            }
            return im;
        }
    },

    readConditions: function(node) {
        var i, s, ob,
            conditions = '';

        if (node != null) {
            for(i = 0; i < node.getElementsByTagName('data').length; i++) {
                ob = node.getElementsByTagName('data')[i];
                s = this.subtreeToString(ob);
                conditions += s;
            }
        }

        return conditions;
    },

    printDebugMessage: function(outputEl,gxtEl,nodetyp,success) {
        JXG.debug("* " + success + ":  " + nodetyp + " " + gxtEl.name + " " + gxtEl.id + "<br>\n");
    },

    /**
     * Reading the elements of a geonext file
     * @param {XMLTree} tree expects the content of the parsed geonext file returned by function parseFF/parseIE
     * @param {Object} board board object
     */
    readGeonext: function(tree, board) {
        var snap, gridColor, grid,
            xmlNode,
            axisX, axisY, bgcolor, opacity,
            elChildNodes,
            s, Data, inter, boardData, el,
            strFir, strLas, conditions,
            strTrue = 'true';

        // maybe this is not necessary as we already provide layer options for sectors and circles via JXG.Options but
        // maybe these have to be the same for geonext.
        board.options.layer.sector = board.options.layer.angle;
        board.options.layer.circle = board.options.layer.angle;

        boardData = tree.getElementsByTagName('board')[0];

        // never ever used
        //boardTmp.ident = "board";

        /* this is never ever used again!
        xmlNode = boardData.getElementsByTagName('fontsize')[0];
        boardTmp.fontSize = (xmlNode != null) ? document.body.style.fontSize = xmlNode.firstChild.data : document.body.style.fontSize;
        boardTmp.modus = boardData.getElementsByTagName('modus')[0].firstChild.data;

         xmlNode = boardData.getElementsByTagName('coordinates')[0].getElementsByTagName('viewport')[0];
         boardTmp.viewportTop = xmlNode.getElementsByTagName('top')[0].firstChild.data;
         boardTmp.viewportLeft = xmlNode.getElementsByTagName('left')[0].firstChild.data;
         boardTmp.viewportBottom = xmlNode.getElementsByTagName('bottom')[0].firstChild.data;
         boardTmp.viewportRight = xmlNode.getElementsByTagName('right')[0].firstChild.data;
         */

        conditions = this.readConditions(boardData.getElementsByTagName('conditions')[0]);

        // set the origin
        xmlNode = boardData.getElementsByTagName('coordinates')[0].getElementsByTagName('origin')[0];
        board.origin = {
            usrCoords: [
                1, 0, 0
            ],
            scrCoords: [
                1, parseFloat(xmlNode.getElementsByTagName('x')[0].firstChild.data), parseFloat(xmlNode.getElementsByTagName('y')[0].firstChild.data)
            ]
        };

        // zoom level
        xmlNode = boardData.getElementsByTagName('coordinates')[0].getElementsByTagName('zoom')[0];
        board.zoomX = parseFloat(xmlNode.getElementsByTagName('x')[0].firstChild.data);
        board.zoomY = parseFloat(xmlNode.getElementsByTagName('y')[0].firstChild.data);

        // screen to user coordinates conversion
        xmlNode = boardData.getElementsByTagName('coordinates')[0].getElementsByTagName('unit')[0];
        board.unitX = parseFloat(xmlNode.getElementsByTagName('x')[0].firstChild.data);
        board.unitY = parseFloat(xmlNode.getElementsByTagName('y')[0].firstChild.data);
        board.updateStretch();

        // resize board
        if (board.options.takeSizeFromFile) {
            board.resizeContainer(boardData.getElementsByTagName('width')[0].firstChild.data, boardData.getElementsByTagName('height')[0].firstChild.data);
        }

        // check and set fontSize
        if (!(parseFloat(board.options.text.fontSize) > 0)) {
            board.options.text.fontSize = 12;
        }

        board.geonextCompatibilityMode = true;

        // jsxgraph chooses an id for the board but we don't want to use it, we want to use
        // the id stored in the geonext file. if you know why, please note it here.
        delete(JXG.JSXGraph.boards[board.id]);
        board.id = boardData.getElementsByTagName('id')[0].firstChild.data;
        JXG.JSXGraph.boards[board.id] = board;

        // this creates some basic elements present in every geonext construction but not explicitly present in the file
        board.initGeonextBoard();
        
        // Update of properties during update() is not necessary in GEONExT files
        // But it maybe necessary if we construct with JavaScript afterwards
        board.renderer.enhancedRendering = true;

        // Read background image
        this.parseImage(board, boardData.getElementsByTagName('file')[0], board.options.layer['image']);


        board.options.grid.snapToGrid = (boardData.getElementsByTagName('coordinates')[0].getElementsByTagName('snap')[0].firstChild.data == strTrue);

        if (boardData.getElementsByTagName('grid')[1].getElementsByTagName('x')[0].firstChild.data) {
            board.options.grid.gridX = 1 / parseFloat(boardData.getElementsByTagName('grid')[1].getElementsByTagName('x')[0].firstChild.data);
        }
        if (boardData.getElementsByTagName('grid')[1].getElementsByTagName('y')[0].firstChild.data) {
            board.options.grid.gridX = 1 / parseFloat(boardData.getElementsByTagName('grid')[1].getElementsByTagName('y')[0].firstChild.data);
        }
        board.calculateSnapSizes();

        board.options.grid.gridDash = JXG.str2Bool(boardData.getElementsByTagName('grid')[1].getElementsByTagName('dash')[0].firstChild.data);

        gridColor = JXG.rgba2rgbo(boardData.getElementsByTagName('grid')[1].getElementsByTagName('color')[0].firstChild.data);
        board.options.grid.gridColor = gridColor[0];
        board.options.grid.gridOpacity = gridColor[1];

        if (boardData.getElementsByTagName('coordinates')[0].getElementsByTagName('grid')[0].firstChild.data == strTrue) {
            board.create('grid', []);
        }

        if (boardData.getElementsByTagName('coordinates')[0].getElementsByTagName('coord')[0].firstChild.data == strTrue) {
            axisX = board.create('axis', [[0, 0], [1, 0]], {
                strokeColor: axisX.visProp['strokeColor'],
                strokeWidth: axisX.visProp['strokeWidth'],
                fillColor: 'none',
                highlightStrokeColor: axisX.visProp['highlightStrokeColor'],
                highlightFillColor: 'none',
                visible: true
            });

            axisY = board.create('axis', [[0, 0], [0, 1]], {
                strokeColor: axisY.visProp['strokeColor'],
                strokeWidth: axisY.visProp['strokeWidth'],
                fillColor: 'none',
                highlightStrokeColor: axisY.visProp['highlightStrokeColor'],
                highlightFillColor: 'none',
                visible: true
            });
        }

        board.containerObj.style.backgroundColor = JXG.rgba2rgbo(boardData.getElementsByTagName('background')[0].getElementsByTagName('color')[0].firstChild.data)[0];

        elChildNodes = tree.getElementsByTagName("elements")[0].childNodes;
        for (s = 0; s < elChildNodes.length; s++) {
            (function (s) {
                var i,
                    gxtEl = {},
                    l, x, y, w, h, c, numberDefEls,
                    umkreisId, umkreisName,
                    defEl = [],
                    defElN = [],
                    defElV = [],
                    defElT = [],
                    defElD = [],
                    defElDr = [],
                    defElSW = [],
                    defElColStr = [],
                    defElHColStr = [],
                    defElColF = [],
                    defElColL = [],
                    el,  pid, lid, aid, cid, p, inter, rgbo;

                Data = elChildNodes[s];
                gxtEl = JXG.GeonextReader.defProperties(gxtEl, Data);

                // Skip text nodes
                if (!JXG.exists(gxtEl)) {
                    return;
                }

                switch (Data.nodeName.toLowerCase()) {
                    case "point":
                        gxtEl = JXG.GeonextReader.boardProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.colorProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.visualProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data, 'data');
                        gxtEl.fixed = JXG.str2Bool(Data.getElementsByTagName('fix')[0].firstChild.data);

                        gxtEl = JXG.GeonextReader.transformProperties(gxtEl);
                        try {
                            p = board.create('point', [parseFloat(gxtEl.x), parseFloat(gxtEl.y)], gxtEl);

                            JXG.GeonextReader.printDebugMessage('debug', gxtEl, Data.nodeName, 'OK');
                            JXG.GeonextReader.parseImage(board, Data, board.options.layer['image'], 0, 0, 0, 0, p);
                        } catch(e) {
                            JXG.debug(e);
                        }
                        break;
                    case "line":
                        gxtEl = JXG.GeonextReader.boardProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.colorProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.visualProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data, 'data');
                        gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data, 'straight', 'straight');
                        gxtEl = JXG.GeonextReader.transformProperties(gxtEl);

                        gxtEl.first = JXG.GeonextReader.changeOriginIds(board, gxtEl.first);
                        gxtEl.last = JXG.GeonextReader.changeOriginIds(board, gxtEl.last);

                        l = board.create('line', [gxtEl.first, gxtEl.last], gxtEl);

                        JXG.GeonextReader.parseImage(board, Data, board.options.layer['image'], 0, 0, 0, 0, l);
                        JXG.GeonextReader.printDebugMessage('debug', gxtEl, Data.nodeName, 'OK');
                        break;
                    case "circle":
                        gxtEl = JXG.GeonextReader.boardProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.colorProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.visualProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);
                        gxtEl.midpoint = JXG.GeonextReader.changeOriginIds(board, Data.getElementsByTagName('data')[0].getElementsByTagName('midpoint')[0].firstChild.data);

                        if (Data.getElementsByTagName('data')[0].getElementsByTagName('radius').length > 0) {
                            gxtEl.radius = JXG.GeonextReader.changeOriginIds(board, Data.getElementsByTagName('data')[0].getElementsByTagName('radius')[0].firstChild.data);
                        } else if (Data.getElementsByTagName('data')[0].getElementsByTagName('radiusvalue').length > 0) {
                            gxtEl.radius = Data.getElementsByTagName('data')[0].getElementsByTagName('radiusvalue')[0].firstChild.data;
                        }

                        gxtEl = JXG.GeonextReader.transformProperties(gxtEl);
                        c = board.create('circle', [gxtEl.midpoint, gxtEl.radius], gxtEl);

                        JXG.GeonextReader.parseImage(board, Data, board.options.layer['image'], 0, 0, 0, 0, c);
                        JXG.GeonextReader.printDebugMessage('debug', gxtEl, Data.nodeName, 'OK');
                        break;
                    case "slider":
                        gxtEl = JXG.GeonextReader.colorProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.boardProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.visualProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);

                        gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data, 'data');
                        gxtEl.fixed = Data.getElementsByTagName('fix')[0].firstChild.data;
                        gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data, 'animate', 'animate');

                        gxtEl = JXG.GeonextReader.transformProperties(gxtEl);
                        try {
                            gxtEl.parent = JXG.GeonextReader.changeOriginIds(board, gxtEl.parent);

                            p = board.create('glider', [parseFloat(gxtEl.x), parseFloat(gxtEl.y), gxtEl.parent], gxtEl);
                            p.onPolygon = JXG.str2Bool(gxtEl.onpolygon);

                            JXG.GeonextReader.parseImage(board, Data, board.options.layer['point'], 0, 0, 0, 0, p);
                            JXG.GeonextReader.printDebugMessage('debug', gxtEl, Data.nodeName, 'OK');
                        } catch(e) {
                            JXG.debug("* <b>Err:</b>  Slider " + gxtEl.name + " " + gxtEl.id + ': '+ gxtEl.parent +"<br>\n");
                        }
                        break;
                    case "cas":
                        gxtEl = JXG.GeonextReader.boardProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.colorProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.visualProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);
                        gxtEl.fixed = Data.getElementsByTagName('fix')[0].firstChild.data;
                        gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data, 'data');
                        gxtEl = JXG.GeonextReader.transformProperties(gxtEl);


                        p = board.create('point', [parseFloat(gxtEl.xval), parseFloat(gxtEl.yval)], gxtEl);
                        JXG.GeonextReader.parseImage(board, Data, board.options.layer['point'], 0, 0, 0, 0, p);
                        p.addConstraint([gxtEl.x, gxtEl.y]);
                        JXG.GeonextReader.printDebugMessage('debug', gxtEl, Data.nodeName, 'OK');
                        break;
                    case "intersection":
                        gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data, 'data');
                        xmlNode = Data.getElementsByTagName('first')[1];
                        gxtEl.outputFirstId = xmlNode.getElementsByTagName('id')[0].firstChild.data;  // 1 statt 0
                        gxtEl.outputFirstName = xmlNode.getElementsByTagName('name')[0].firstChild.data;
                        gxtEl.outputFirstVisible = xmlNode.getElementsByTagName('visible')[0].firstChild.data;
                        gxtEl.outputFirstTrace = xmlNode.getElementsByTagName('trace')[0].firstChild.data;

                        gxtEl.outputFirstFixed = xmlNode.getElementsByTagName('fix')[0].firstChild.data;
                        gxtEl.outputFirstStyle = xmlNode.getElementsByTagName('style')[0].firstChild.data;
                        gxtEl.outputFirstStrokewidth = xmlNode.getElementsByTagName('strokewidth')[0].firstChild.data;

                        xmlNode = Data.getElementsByTagName('first')[1].getElementsByTagName('color')[0];
                        gxtEl.outputFirstColorStroke = xmlNode.getElementsByTagName('stroke')[0].firstChild.data;
                        gxtEl.outputFirstHighlightStrokeColor = xmlNode.getElementsByTagName('lighting')[0].firstChild.data;
                        gxtEl.outputFirstColorFill = xmlNode.getElementsByTagName('fill')[0].firstChild.data;
                        gxtEl.outputFirstColorLabel = xmlNode.getElementsByTagName('label')[0].firstChild.data;
                        gxtEl.outputFirstColorDraft = xmlNode.getElementsByTagName('draft')[0].firstChild.data;

                        gxtEl.first = JXG.GeonextReader.changeOriginIds(board, gxtEl.first);
                        gxtEl.last = JXG.GeonextReader.changeOriginIds(board, gxtEl.last);
                        if ((((board.objects[gxtEl.first]).type == (board.objects[gxtEl.last]).type) && ((board.objects[gxtEl.first]).type == JXG.OBJECT_TYPE_LINE || (board.objects[gxtEl.first]).type == JXG.OBJECT_TYPE_ARROW))
                                    || (((board.objects[gxtEl.first]).type == JXG.OBJECT_TYPE_LINE) && ((board.objects[gxtEl.last]).type == JXG.OBJECT_TYPE_ARROW))
                                || (((board.objects[gxtEl.last]).type == JXG.OBJECT_TYPE_LINE) && ((board.objects[gxtEl.first]).type == JXG.OBJECT_TYPE_ARROW))) {
                            inter = new JXG.Intersection(board, gxtEl.id, board.objects[gxtEl.first],
                                    board.objects[gxtEl.last], gxtEl.outputFirstId, '',
                                    gxtEl.outputFirstName, '');
                            /* offensichtlich braucht man dieses if doch */
                            if (gxtEl.outputFirstVisible == "false") {
                                inter.hideElement();
                            }
                            inter.p.setProperty('strokeColor:' + gxtEl.outputFirstColorStroke,
                                    'strokeWidth:' + gxtEl.outputFirstStrokewidth,
                                    'fillColor:' + gxtEl.outputFirstColorStroke,
                                    'highlightStrokeColor:' + gxtEl.outputFirstHighlightStrokeColor,
                                    'highlightFillColor:' + gxtEl.outputFirstHighlightStrokeColor,
                                    'visible:' + gxtEl.outputFirstVisible,
                                    'labelColor:' + gxtEl.outputFirstColorLabel,
                                    'draft:' + gxtEl.draft);
                            inter.p.setStyle(1 * gxtEl.outputFirstStyle);
                            inter.p.visProp.trace = (gxtEl.outputFirstTrace == 'false') ? false : true;
                        } else {
                            xmlNode = Data.getElementsByTagName('last')[1];
                            gxtEl.outputLastId = xmlNode.getElementsByTagName('id')[0].firstChild.data;
                            gxtEl.outputLastName = xmlNode.getElementsByTagName('name')[0].firstChild.data;
                            gxtEl.outputLastVisible = xmlNode.getElementsByTagName('visible')[0].firstChild.data;
                            gxtEl.outputLastTrace = xmlNode.getElementsByTagName('trace')[0].firstChild.data;
                            gxtEl.outputLastFixed = xmlNode.getElementsByTagName('fix')[0].firstChild.data;
                            gxtEl.outputLastStyle = xmlNode.getElementsByTagName('style')[0].firstChild.data;
                            gxtEl.outputLastStrokewidth = xmlNode.getElementsByTagName('strokewidth')[0].firstChild.data;

                            xmlNode = Data.getElementsByTagName('last')[1].getElementsByTagName('color')[0];
                            gxtEl.outputLastColorStroke = xmlNode.getElementsByTagName('stroke')[0].firstChild.data;
                            gxtEl.outputLastHighlightStrokeColor = xmlNode.getElementsByTagName('lighting')[0].firstChild.data;
                            gxtEl.outputLastColorFill = xmlNode.getElementsByTagName('fill')[0].firstChild.data;
                            gxtEl.outputLastColorLabel = xmlNode.getElementsByTagName('label')[0].firstChild.data;
                            gxtEl.outputLastColorDraft = xmlNode.getElementsByTagName('draft')[0].firstChild.data;

                            inter = new JXG.Intersection(board, gxtEl.id, board.objects[gxtEl.first],
                                    board.objects[gxtEl.last], gxtEl.outputFirstId, gxtEl.outputLastId,
                                    gxtEl.outputFirstName, gxtEl.outputLastName);
                            inter.p1.setProperty('strokeColor:' + gxtEl.outputFirstColorStroke,
                                    'strokeWidth:' + gxtEl.outputFirstStrokewidth,
                                    'fillColor:' + gxtEl.outputFirstColorStroke,
                                    'highlightStrokeColor:' + gxtEl.outputFirstHighlightStrokeColor,
                                    'highlightFillColor:' + gxtEl.outputFirstHighlightStrokeColor,
                                    'visible:' + gxtEl.outputFirstVisible,
                                    'labelColor:' + gxtEl.outputFirstColorLabel,
                                    'draft:' + gxtEl.draft);
                            inter.p1.setStyle(1 * gxtEl.outputFirstStyle);
                            inter.p1.visProp.trace = (gxtEl.outputFirstTrace == 'false') ? false : true;
                            inter.p2.setProperty('strokeColor:' + gxtEl.outputLastColorStroke,
                                    'strokeWidth:' + gxtEl.outputLastStrokewidth,
                                    'fillColor:' + gxtEl.outputLastColorStroke,
                                    'highlightStrokeColor:' + gxtEl.outputLastHighlightStrokeColor,
                                    'highlightFillColor:' + gxtEl.outputLastHighlightStrokeColor,
                                    'visible:' + gxtEl.outputLastVisible,
                                    'labelColor:' + gxtEl.outputLastColorLabel,
                                    'draft:' + gxtEl.draft);
                            inter.p2.setStyle(1 * gxtEl.outputLastStyle);
                            inter.p2.visProp.trace = (gxtEl.outputLastTrace == 'false') ? false : true;

                            /* if-Statement evtl. unnoetig BV*/
                            if (gxtEl.outputFirstVisible == "false") {
                                if (gxtEl.outputLastVisible == "false") {
                                    inter.hideElement();
                                }
                                else {
                                    inter.p1.hideElement();
                                }
                            }
                            else {
                                if (gxtEl.outputLastVisible == "false") {
                                    inter.p2.hideElement();
                                }
                            }
                        }
                        JXG.GeonextReader.printDebugMessage('debug', gxtEl, Data.nodeName, 'OK');
                        break;
                    case "composition":
                        gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data, 'data');
                        gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);
                        gxtEl.defEl = [];
                        numberDefEls = 0;
                        xmlNode = Data.getElementsByTagName('data')[0].getElementsByTagName('input');
                        for (i = 0; i < xmlNode.length; i++) {
                            gxtEl.defEl[i] = xmlNode[i].firstChild.data;
                            numberDefEls = i + 1;
                        }
                        xmlNode = Data.getElementsByTagName('output')[0];
                        gxtEl.outputId = xmlNode.getElementsByTagName('id')[0].firstChild.data;
                        gxtEl.outputName = xmlNode.getElementsByTagName('name')[0].firstChild.data;
                        gxtEl.outputVisible = xmlNode.getElementsByTagName('visible')[0].firstChild.data;
                        gxtEl.outputTrace = xmlNode.getElementsByTagName('trace')[0].firstChild.data;

                        gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data, 'output', 'output');
                        gxtEl.outputName = xmlNode.getElementsByTagName('name')[0].firstChild.data;
                        gxtEl.outputDash = xmlNode.getElementsByTagName('dash')[0].firstChild.data;
                        gxtEl.outputDraft = xmlNode.getElementsByTagName('draft')[0].firstChild.data;
                        gxtEl.outputStrokewidth = xmlNode.getElementsByTagName('strokewidth')[0].firstChild.data;
                        //    Data.getElementsByTagName('output')[0].getElementsByTagName('strokewidth')[0].firstChild.data;

                        xmlNode = Data.getElementsByTagName('output')[0].getElementsByTagName('color')[0];
                        gxtEl.outputColorStroke = xmlNode.getElementsByTagName('stroke')[0].firstChild.data;
                        gxtEl.outputHighlightStrokeColor = xmlNode.getElementsByTagName('lighting')[0].firstChild.data;
                        gxtEl.outputColorFill = xmlNode.getElementsByTagName('fill')[0].firstChild.data;
                        gxtEl.outputColorLabel = xmlNode.getElementsByTagName('label')[0].firstChild.data;
                        gxtEl.outputColorDraft = xmlNode.getElementsByTagName('draft')[0].firstChild.data;

                        gxtEl.defEl[0] = JXG.GeonextReader.changeOriginIds(board, gxtEl.defEl[0]);
                        gxtEl.defEl[1] = JXG.GeonextReader.changeOriginIds(board, gxtEl.defEl[1]);
                        gxtEl.defEl[2] = JXG.GeonextReader.changeOriginIds(board, gxtEl.defEl[2]);

                        switch (gxtEl.type) {
                            case "210070": gxtEl.typeName = "ARROW_PARALLEL"; break;

                            // BISECTOR
                            case "210080":
                                board.create('bisector', [gxtEl.defEl[0], gxtEl.defEl[1], gxtEl.defEl[2]], {id: gxtEl.outputId, name: gxtEl.outputName});
                                break;

                            // CIRCUMCIRCLE
                            case "210090":
                                umkreisId = Data.getElementsByTagName('output')[1].getElementsByTagName('id')[0].firstChild.data;
                                umkreisName = Data.getElementsByTagName('output')[1].getElementsByTagName('name')[0].firstChild.data;
                                board.create('circumcircle', [gxtEl.defEl[0], gxtEl.defEl[1], gxtEl.defEl[2]], {
                                        name: umkreisName,
                                        id: umkreisId,
                                        point: {
                                            name: gxtEl.outputName,
                                            id: gxtEl.outputId
                                        }
                                    });
                                break;

                            // CIRCUMCIRCLE_CENTER
                            case "210100":
                                board.create('circumcirclemidpoint', [gxtEl.defEl[0], gxtEl.defEl[1], gxtEl.defEl[2]], {id: gxtEl.outputId, name: gxtEl.outputName});
                                break;

                            // MIDPOINT
                            case "210110":
                                if (numberDefEls == 2) {  // Midpoint of two points
                                    board.create('midpoint', [gxtEl.defEl[0], gxtEl.defEl[1]], {name: gxtEl.outputName, id: gxtEl.outputId});
                                } else if (numberDefEls == 1) { // Midpoint of a line
                                    board.create('midpoint', [gxtEl.defEl[0]], {name: gxtEl.outputName, id: gxtEl.outputId});
                                }
                                break;

                             // MIRRORLINE
                            case "210120":
                                board.create('reflection', [gxtEl.defEl[1], gxtEl.defEl[0]], {id: gxtEl.outputId, name: gxtEl.outputName});
                                break;

                            // MIRROR_POINT
                            case "210125":
                                board.create('mirrorpoint', [gxtEl.defEl[0], gxtEl.defEl[1]], {name: gxtEl.outputName, id: gxtEl.outputId});
                                break;

                            // NORMAL
                            case "210130":
                                board.create('normal', [gxtEl.defEl[1], gxtEl.defEl[0]], {'id': gxtEl.outputId, name: gxtEl.outputName});
                                break;

                            // PARALLEL
                            case "210140":
                                board.create('parallel', [gxtEl.defEl[1], gxtEl.defEl[0]], {'id': gxtEl.outputId, name: gxtEl.outputName});
                                break;

                            // PARALLELOGRAM_POINT
                            case "210150":
                                if (gxtEl.defEl.length == 2) { // line, point
                                    board.create('parallelpoint', [
                                        JXG.getReference(board, gxtEl.defEl[0]).point1,
                                        JXG.getReference(board, gxtEl.defEl[0]).point2,
                                        gxtEl.defEl[1]
                                    ], {id: gxtEl.outputId, name: gxtEl.outputName});
                                } else {  // point, point, point
                                    board.create('parallelpoint', [
                                        gxtEl.defEl[0], gxtEl.defEl[1], gxtEl.defEl[2]
                                    ], {id: gxtEl.outputId, name: gxtEl.outputName});
                                }
                                break;
                            case "210160": gxtEl.typeName = "PERPENDICULAR"; break;
                            case "210170": gxtEl.typeName = "PERPENDICULAR_POINT"; break;
                            case "210180": gxtEl.typeName = "ROTATION"; break;
                            case "210190": gxtEl.typeName = "SECTOR"; break;
                        }

                        if (gxtEl.typeName == "MIDPOINT") {
                        }
                        else if (gxtEl.typeName == "SECTOR") {
                            //JXG.GeonextReader.parseImage(board,Data.getElementsByTagName('image')[0],board.options.layer['sector']);
                            for (i = 0; i < Data.getElementsByTagName('output').length; i++) {
                                xmlNode = Data.getElementsByTagName('output')[i];
                                defEl[i] = xmlNode.getElementsByTagName('id')[0].firstChild.data;
                                defEl[i] = JXG.GeonextReader.changeOriginIds(board, defEl[i]);
                                defElN[i] = xmlNode.getElementsByTagName('name')[0];
                                defElV[i] = xmlNode.getElementsByTagName('visible')[0].firstChild.data;
                                defElT[i] = xmlNode.getElementsByTagName('trace')[0].firstChild.data;
                                defElD[i] = xmlNode.getElementsByTagName('dash')[0].firstChild.data;
                                defElDr[i] = xmlNode.getElementsByTagName('draft')[0].firstChild.data;
                                defElSW[i] = xmlNode.getElementsByTagName('strokewidth')[0].firstChild.data;

                                xmlNode = Data.getElementsByTagName('output')[i].getElementsByTagName('color')[0];
                                defElColStr[i] = xmlNode.getElementsByTagName('stroke')[0].firstChild.data;
                                defElHColStr[i] = xmlNode.getElementsByTagName('lighting')[0].firstChild.data;
                                defElColF[i] = xmlNode.getElementsByTagName('fill')[0].firstChild.data;
                                defElColL[i] = xmlNode.getElementsByTagName('label')[0].firstChild.data;
                            }
                            el = board.create('sector', [
                                gxtEl.defEl[0],gxtEl.defEl[1],gxtEl.defEl[2]
                            ],
                            {id:defEl[0], name: defElN[0].firstChild.data});
                            /* Eigenschaften des Kreisbogens */
                            var arcId = defEl[0];
                            board.objects[arcId].setProperty('strokeColor:' + defElColStr[0],
                                    'strokeWidth:' + defElSW[0],
                                    'fillColor:' + defElColF[0],
                                    'highlightStrokeColor:' + defElHColStr[0],
                                    'highlightFillColor:' + defElColF[0],
                                    'visible:' + defElV[0],
                                    'dash:' + defElD[0],
                                    'draft:' + defElDr[0]);
                            board.objects[arcId].visProp.trace = (defElT[0] == 'false') ? false : true;
                            gxtEl.firstArrow = Data.getElementsByTagName('output')[0].getElementsByTagName('firstarrow')[0].firstChild.data;
                            gxtEl.lastArrow = Data.getElementsByTagName('output')[0].getElementsByTagName('lastarrow')[0].firstChild.data;
                            gxtEl.firstArrow = (gxtEl.firstArrow == 'false') ? false : true;
                            gxtEl.lastArrow = (gxtEl.lastArrow == 'false') ? false : true;
                            board.objects[arcId].setArrow(gxtEl.firstArrow, gxtEl.lastArrow);

                        }
                        else if (gxtEl.typeName == "PERPENDICULAR") {
                            for (i = 0; i < Data.getElementsByTagName('output').length; i++) {
                                xmlNode = Data.getElementsByTagName('output')[i];
                                defEl[i] = xmlNode.getElementsByTagName('id')[0].firstChild.data;
                                defEl[i] = JXG.GeonextReader.changeOriginIds(board, defEl[i]);
                                defElN[i] = xmlNode.getElementsByTagName('name')[0];
                                defElV[i] = xmlNode.getElementsByTagName('visible')[0].firstChild.data;
                                defElT[i] = xmlNode.getElementsByTagName('trace')[0].firstChild.data;
                                defElD[i] = xmlNode.getElementsByTagName('dash')[0].firstChild.data;
                                defElDr[i] = xmlNode.getElementsByTagName('draft')[0].firstChild.data;
                                defElSW[i] = xmlNode.getElementsByTagName('strokewidth')[0].firstChild.data;
                                xmlNode = Data.getElementsByTagName('output')[i].getElementsByTagName('color')[0];
                                defElColStr[i] = xmlNode.getElementsByTagName('stroke')[0].firstChild.data;
                                defElHColStr[i] = xmlNode.getElementsByTagName('lighting')[0].firstChild.data;
                                defElColF[i] = xmlNode.getElementsByTagName('fill')[0].firstChild.data;
                                defElColL[i] = xmlNode.getElementsByTagName('label')[0].firstChild.data;
                            }
                            gxtEl.outputFixed = Data.getElementsByTagName('output')[0].getElementsByTagName('fix')[0].firstChild.data;
                            gxtEl.outputStyle = Data.getElementsByTagName('output')[0].getElementsByTagName('style')[0].firstChild.data;

                            board.create('perpendicular', [
                                gxtEl.defEl[1], gxtEl.defEl[0]
                            ],
                            {name: [
                                defElN[1].firstChild.data, defElN[0].firstChild.data
                            ],
                                id:[
                                    defEl[1], defEl[0]
                                ]});
                            /* Eigenschaften des Lotfusspunkts */
                            pid = defEl[0];
                            board.objects[pid].setProperty('strokeColor:' + defElColStr[0],
                                    'strokeWidth:' + defElSW[0],
                                //'fillColor:'+defElColF[0],
                                    'fillColor:' + defElColStr[0],
                                    'highlightStrokeColor:' + defElHColStr[0],
                                //'highlightFillColor:'+defElColF[0],
                                    'highlightFillColor:' + defElHColStr[0],
                                    'visible:' + defElV[0],
                                    'fixed:' + gxtEl.outputFixed,
                                    'labelColor:' + defElColL[0],
                                    'draft:' + defElDr[0]);
                            board.objects[pid].setStyle(1 * gxtEl.outputStyle);
                            board.objects[pid].visProp.trace = (defElT[0] == 'false') ? false : true;
                            /* Eigenschaften der Lotstrecke */
                            lid = defEl[1];
                            board.objects[lid].setProperty('strokeColor:' + defElColStr[1],
                                    'strokeWidth:' + defElSW[1],
                                    'fillColor:' + defElColF[1],
                                    'highlightStrokeColor:' + defElHColStr[1],
                                    'highlightFillColor:' + defElColF[1],
                                    'visible:' + defElV[1],
                                    'dash:' + defElD[1],
                                    'draft:' + defElDr[1]);
                            board.objects[lid].visProp.trace = (defElT[1] == 'false') ? false : true;
                            xmlNode = Data.getElementsByTagName('output')[1].getElementsByTagName('straight')[0];
                            strFir = xmlNode.getElementsByTagName('first')[0].firstChild.data;
                            strLas = xmlNode.getElementsByTagName('last')[0].firstChild.data;
                            strFir = (strFir == 'false') ? false : true;
                            strLas = (strLas == 'false') ? false : true;
                            board.objects[lid].setStraight(strFir, strLas);
                            board.objects[pid].setStyle(1 * gxtEl.outputStyle);
                            board.objects[pid].visProp.trace = (defElT[1] == 'false') ? false : true;
                        }
                        else if (gxtEl.typeName == "ARROW_PARALLEL") {
                            for (i = 0; i < Data.getElementsByTagName('output').length; i++) {
                                xmlNode = Data.getElementsByTagName('output')[i];
                                defEl[i] = xmlNode.getElementsByTagName('id')[0].firstChild.data;
                                defEl[i] = JXG.GeonextReader.changeOriginIds(board, defEl[i]);
                                defElN[i] = xmlNode.getElementsByTagName('name')[0];
                                defElV[i] = xmlNode.getElementsByTagName('visible')[0].firstChild.data;
                                defElT[i] = xmlNode.getElementsByTagName('trace')[0].firstChild.data;
                                defElD[i] = xmlNode.getElementsByTagName('dash')[0].firstChild.data;
                                defElDr[i] = xmlNode.getElementsByTagName('draft')[0].firstChild.data;
                                defElSW[i] = xmlNode.getElementsByTagName('strokewidth')[0].firstChild.data;
                                xmlNode = Data.getElementsByTagName('output')[i].getElementsByTagName('color')[0];
                                defElColStr[i] = xmlNode.getElementsByTagName('stroke')[0].firstChild.data;
                                defElHColStr[i] = xmlNode.getElementsByTagName('lighting')[0].firstChild.data;
                                defElColF[i] = xmlNode.getElementsByTagName('fill')[0].firstChild.data;
                                defElColL[i] = xmlNode.getElementsByTagName('label')[0].firstChild.data;
                            }
                            gxtEl.outputFixed = Data.getElementsByTagName('output')[1].getElementsByTagName('fix')[0].firstChild.data;
                            gxtEl.outputStyle = Data.getElementsByTagName('output')[1].getElementsByTagName('style')[0].firstChild.data;

                            board.create('arrowparallel', [
                                gxtEl.defEl[1], gxtEl.defEl[0]
                            ], {id: [
                                defEl[0], defEl[1]
                            ], name: [
                                defElN[0].firstChild.data, defElN[1].firstChild.data
                            ]});

                            /* Eigenschaften des erzeugten Arrows */
                            aid = defEl[0];
                            board.objects[aid].setProperty('strokeColor:' + defElColStr[0],
                                    'strokeWidth:' + defElSW[0],
                                    'fillColor:' + defElColF[0],
                                    'highlightStrokeColor:' + defElHColStr[0],
                                    'highlightFillColor:' + defElColF[0],
                                    'visible:' + defElV[0],
                                    'dash:' + defElD[0],
                                    'draft:' + defElDr[0]);
                            board.objects[aid].visProp.trace = (defElT[0] == 'false') ? false : true;
                            /* Eigenschaften des Endpunkts */
                            pid = defEl[1];
                            board.objects[pid].setProperty('strokeColor:' + defElColStr[1],
                                    'strokeWidth:' + defElSW[1],
                                //'fillColor:'+defElColF[1],
                                    'fillColor:' + defElColStr[1],
                                    'highlightStrokeColor:' + defElHColStr[1],
                                //'highlightFillColor:'+defElColF[1],
                                    'highlightFillColor:' + defElHColStr[1],
                                    'visible:' + defElV[1],
                                    'fixed:' + gxtEl.outputFixed,
                                    'labelColor:' + defElColL[1],
                                    'draft:' + defElDr[1]);
                        }
                        else if (gxtEl.typeName == "PERPENDICULAR_POINT") {
                            board.create('perpendicularpoint', [
                                gxtEl.defEl[1], gxtEl.defEl[0]
                            ], {name: gxtEl.outputName, id: gxtEl.outputId});
                        }
                        else {
                            throw new Error("JSXGraph: GEONExT-Element " + gxtEl.typeName + ' not yet implemented');
                        }
                        /* noch die Eigenschaften der uebrigen Elemente setzen */
                        if (gxtEl.typeName == "MIDPOINT" || gxtEl.typeName == "MIRROR_LINE" ||
                            gxtEl.typeName == "CIRCUMCIRCLE_CENTER" || gxtEl.typeName == "PERPENDICULAR_POINT" ||
                            gxtEl.typeName == "MIRROR_POINT" || gxtEl.typeName == "PARALLELOGRAM_POINT") { // hier wird jeweils ein Punkt angelegt
                            gxtEl.outputFixed = Data.getElementsByTagName('output')[0].getElementsByTagName('fix')[0].firstChild.data;
                            gxtEl.outputStyle = Data.getElementsByTagName('output')[0].getElementsByTagName('style')[0].firstChild.data;
                            board.objects[gxtEl.outputId].setProperty('strokeColor:' + gxtEl.outputColorStroke,
                                    'strokeWidth:' + gxtEl.outputStrokewidth,
                                //'fillColor:'+gxtEl.outputColorFill,
                                    'fillColor:' + gxtEl.outputColorStroke,
                                    'highlightStrokeColor:' + gxtEl.outputHighlightStrokeColor,
                                //'highlightFillColor:'+gxtEl.outputColorFill,
                                    'highlightFillColor:' + gxtEl.outputHighlightStrokeColor,
                                    'visible:' + gxtEl.outputVisible,
                                    'fixed:' + gxtEl.outputFixed,
                                    'labelColor:' + gxtEl.outputColorLabel,
                                    'draft:' + gxtEl.outputDraft);
                            board.objects[gxtEl.outputId].setStyle(1 * gxtEl.outputStyle);
                            board.objects[gxtEl.outputId].visProp.trace = (gxtEl.outputTrace == 'false') ? false : true;
                        }
                        else if (gxtEl.typeName == "BISECTOR" || gxtEl.typeName == "NORMAL" ||
                                 gxtEl.typeName == "PARALLEL") { // hier wird jeweils eine Linie angelegt
                            xmlNode = Data.getElementsByTagName('output')[0].getElementsByTagName('straight')[0];
                            gxtEl.straightFirst = xmlNode.getElementsByTagName('first')[0].firstChild.data;
                            gxtEl.straightLast = xmlNode.getElementsByTagName('last')[0].firstChild.data;
                            gxtEl.straightFirst = (gxtEl.straightFirst == 'false') ? false : true;
                            gxtEl.straightLast = (gxtEl.straightLast == 'false') ? false : true;
                            board.objects[gxtEl.outputId].setStraight(gxtEl.straightFirst, gxtEl.straightLast);
                            board.objects[gxtEl.outputId].setProperty('strokeColor:' + gxtEl.outputColorStroke,
                                    'strokeWidth:' + gxtEl.outputStrokewidth,
                                    'fillColor:' + gxtEl.outputColorFill,
                                    'highlightStrokeColor:' + gxtEl.outputHighlightStrokeColor,
                                    'highlightFillColor:' + gxtEl.outputColorFill,
                                    'visible:' + gxtEl.outputVisible,
                                    'dash:' + gxtEl.outputDash,
                                    'draft:' + gxtEl.outputDraft);
                            board.objects[gxtEl.outputId].visProp.trace = (gxtEl.outputTrace == 'false') ? false : true;
                        }
                        else if (gxtEl.typeName == "CIRCUMCIRCLE") {
                            for (i = 0; i < Data.getElementsByTagName('output').length; i++) {
                                xmlNode = Data.getElementsByTagName('output')[i];
                                defEl[i] = xmlNode.getElementsByTagName('id')[0].firstChild.data;
                                defEl[i] = JXG.GeonextReader.changeOriginIds(board, defEl[i]);
                                defElN[i] = xmlNode.getElementsByTagName('name')[0];
                                defElV[i] = xmlNode.getElementsByTagName('visible')[0].firstChild.data;
                                defElT[i] = xmlNode.getElementsByTagName('trace')[0].firstChild.data;
                                defElD[i] = xmlNode.getElementsByTagName('dash')[0].firstChild.data;
                                defElDr[i] = xmlNode.getElementsByTagName('draft')[0].firstChild.data;
                                defElSW[i] = xmlNode.getElementsByTagName('strokewidth')[0].firstChild.data;
                                xmlNode = Data.getElementsByTagName('output')[i].getElementsByTagName('color')[0];
                                defElColStr[i] = xmlNode.getElementsByTagName('stroke')[0].firstChild.data;
                                defElHColStr[i] = xmlNode.getElementsByTagName('lighting')[0].firstChild.data;
                                defElColF[i] = xmlNode.getElementsByTagName('fill')[0].firstChild.data;
                                defElColL[i] = xmlNode.getElementsByTagName('label')[0].firstChild.data;
                            }
                            gxtEl.outputFixed = Data.getElementsByTagName('output')[0].getElementsByTagName('fix')[0].firstChild.data;
                            gxtEl.outputStyle = Data.getElementsByTagName('output')[0].getElementsByTagName('style')[0].firstChild.data;
                            /* Eigenschaften des Umkreismittelpunkts */
                            pid = defEl[0];
                            board.objects[pid].setProperty('strokeColor:' + defElColStr[0],
                                    'strokeWidth:' + defElSW[0],
                                //'fillColor:'+defElColF[0],
                                    'fillColor:' + defElColStr[0],
                                    'highlightStrokeColor:' + defElHColStr[0],
                                //'highlightFillColor:'+defElColF[0],
                                    'highlightFillColor:' + defElHColStr[0],
                                    'visible:' + defElV[0],
                                    'fixed:' + gxtEl.outputFixed,
                                    'labelColor:' + defElColL[0],
                                    'draft:' + defElDr[0]);
                            board.objects[pid].setStyle(1 * gxtEl.outputStyle);
                            board.objects[pid].visProp.trace = (defElT[0] == 'false') ? false : true;
                            /* Eigenschaften des Umkreises */
                            cid = defEl[1];
                            board.objects[cid].setProperty('strokeColor:' + defElColStr[1],
                                    'strokeWidth:' + defElSW[1],
                                    'fillColor:' + defElColF[1],
                                    'highlightStrokeColor:' + defElHColStr[1],
                                    'highlightFillColor:' + defElColF[1],
                                    'visible:' + defElV[1],
                                    'dash:' + defElD[1],
                                    'draft:' + defElDr[1]);
                            board.objects[cid].visProp.trace = (defElT[1] == 'false') ? false : true;
                        }
                        if (board.isSuspendedUpdate) {
                            board.unsuspendUpdate().suspendUpdate();
                        }
                        // "PERPENDICULAR" und "SECTOR" werden direkt im oberen if erledigt
                        JXG.GeonextReader.printDebugMessage('debug', gxtEl, Data.nodeName, 'OK');
                        break;
                    case "polygon":
                        gxtEl = JXG.GeonextReader.colorProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);
                        gxtEl.dataVertex = [];
                        for (i = 0; i < Data.getElementsByTagName('data')[0].getElementsByTagName('vertex').length; i++) {
                            gxtEl.dataVertex[i] = Data.getElementsByTagName('data')[0].getElementsByTagName('vertex')[i].firstChild.data;
                            gxtEl.dataVertex[i] = JXG.GeonextReader.changeOriginIds(board, gxtEl.dataVertex[i]);
                        }
                        gxtEl.border = [];
                        gxtEl.lines = {
                            ids: []
                        };
                        for (i = 0; i < Data.getElementsByTagName('border').length; i++) {
                            gxtEl.border[i] = {};
                            xmlNode = Data.getElementsByTagName('border')[i];
                            gxtEl.border[i].id = xmlNode.getElementsByTagName('id')[0].firstChild.data;
                            gxtEl.lines.ids.push(gxtEl.border[i].id);
                            gxtEl.border[i].name = xmlNode.getElementsByTagName('name')[0].firstChild.data;
                            gxtEl.border[i].straightFirst = xmlNode.getElementsByTagName('straight')[0].getElementsByTagName('first')[0].firstChild.data;
                            gxtEl.border[i].straightLast = xmlNode.getElementsByTagName('straight')[0].getElementsByTagName('last')[0].firstChild.data;
                            gxtEl.border[i].strokeWidth = xmlNode.getElementsByTagName('strokewidth')[0].firstChild.data;
                            gxtEl.border[i].dash = xmlNode.getElementsByTagName('dash')[0].firstChild.data;
                            gxtEl.border[i].visible = xmlNode.getElementsByTagName('visible')[0].firstChild.data;
                            gxtEl.border[i].draft = xmlNode.getElementsByTagName('draft')[0].firstChild.data;
                            gxtEl.border[i].trace = xmlNode.getElementsByTagName('trace')[0].firstChild.data;

                            xmlNode = Data.getElementsByTagName('border')[i].getElementsByTagName('color')[0];
                            rgbo = JXG.rgba2rgbo(xmlNode.getElementsByTagName('stroke')[0].firstChild.data);
                            gxtEl.border[i].strokeColor = rgbo[0];
                            gxtEl.border[i].strokeOpacity = rgbo[1];

                            rgbo = JXG.rgba2rgbo(xmlNode.getElementsByTagName('lighting')[0].firstChild.data);
                            gxtEl.border[i].highlightStrokeColor = rgbo[0];
                            gxtEl.border[i].highlightStrokeOpacity = rgbo[1];

                            rgbo = JXG.rgba2rgbo(xmlNode.getElementsByTagName('fill')[0].firstChild.data);
                            gxtEl.border[i].fillColor = rgbo[0];
                            gxtEl.border[i].fillOpacity = rgbo[1];

                            gxtEl.border[i].highlightFillColor = gxtEl.border[i].fillColor;
                            gxtEl.border[i].highlightFillOpacity = gxtEl.border[i].fillOpacity;

                            gxtEl.border[i].labelColor = xmlNode.getElementsByTagName('label')[0].firstChild.data;
                            gxtEl.border[i].colorDraft = xmlNode.getElementsByTagName('draft')[0].firstChild.data;
                        }
                        gxtEl = JXG.GeonextReader.transformProperties(gxtEl);
                        p = board.create('polygon', gxtEl.dataVertex, gxtEl);

                        // to emulate the geonext behaviour on invisible polygons
                        if (!gxtEl.visible) {
                            p.setProperty({
                                fillColor: 'none',
                                highlightFillColor: 'none'
                            });
                        }

                        for (i = 0; i < p.borders.length; i++) {
                            p.borders[i].setProperty(gxtEl.border[i]);
                        }
                            
                        JXG.GeonextReader.printDebugMessage('debug', gxtEl, Data.nodeName, 'OK');
                        break;
                    case "graph":
                        gxtEl = JXG.GeonextReader.colorProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);
                        gxtEl.funct = Data.getElementsByTagName('data')[0].getElementsByTagName('function')[0].firstChild.data;

                        c = board.create('curve', ['x',gxtEl.funct], {
                                id: gxtEl.id,
                                name: gxtEl.name,
                                strokeColor: gxtEl.strokeColor,
                                strokeWidth: gxtEl.strokeWidth,
                                fillColor: 'none',
                                highlightStrokeColor: gxtEl.highlightStrokeColor
                            });

                        JXG.GeonextReader.printDebugMessage('debug', gxtEl, Data.nodeName, 'OK');
                        break;
                    case "arrow":
                        gxtEl = JXG.GeonextReader.colorProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.boardProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data, 'data');
                        gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data, 'straight', 'straight');
                        gxtEl = JXG.GeonextReader.visualProperties(gxtEl, Data);

                        gxtEl = JXG.GeonextReader.transformProperties(gxtEl);
                        gxtEl.first = JXG.GeonextReader.changeOriginIds(board, gxtEl.first);
                        gxtEl.last = JXG.GeonextReader.changeOriginIds(board, gxtEl.last);

                        l = board.create('arrow', [gxtEl.first, gxtEl.last], gxtEl);

                        JXG.GeonextReader.printDebugMessage('debug', l, Data.nodeName, 'OK');
                        break;
                    case "arc":
                        gxtEl = JXG.GeonextReader.colorProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.visualProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.boardProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data, 'data');

                        gxtEl.firstArrow = Data.getElementsByTagName('firstarrow')[0].firstChild.data;
                        gxtEl.lastArrow = Data.getElementsByTagName('lastarrow')[0].firstChild.data;

                        gxtEl = JXG.GeonextReader.transformProperties(gxtEl);

                        gxtEl.midpoint = JXG.GeonextReader.changeOriginIds(board, gxtEl.midpoint);
                        gxtEl.angle = JXG.GeonextReader.changeOriginIds(board, gxtEl.angle);
                        gxtEl.radius = JXG.GeonextReader.changeOriginIds(board, gxtEl.radius);

                        c = board.create('arc', [gxtEl.midpoint, gxtEl.radius, gxtEl.angle], gxtEl);

                        JXG.GeonextReader.printDebugMessage('debug', c, Data.nodeName, 'OK');
                        break;
                    case "angle":
                        gxtEl = JXG.GeonextReader.boardProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.colorProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.visualProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data, 'data');

                        gxtEl = JXG.GeonextReader.transformProperties(gxtEl);

                        try {
                            gxtEl.text = Data.getElementsByTagName('text')[0].firstChild.data;
                        } catch (e) {
                            gxtEl.text = '';
                        }

                        c = board.create('angle', [gxtEl.first, gxtEl.middle, gxtEl.last], gxtEl);
                        JXG.GeonextReader.printDebugMessage('debug', gxtEl, Data.nodeName, 'OK');
                        break;
                    case "text":
                        if (gxtEl.id.match(/oldVersion/)) {
                            break;
                        }
                        gxtEl = JXG.GeonextReader.boardProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.colorProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.visualProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);

                        gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data, 'data');
                        gxtEl.mpStr = JXG.GeonextReader.subtreeToString(Data.getElementsByTagName('data')[0].getElementsByTagName('mp')[0]);
                        gxtEl.mpStr = gxtEl.mpStr.replace(/<\/?mp>/g, '');
                        try {
                            if (Data.getElementsByTagName('data')[0].getElementsByTagName('parent')[0].firstChild) {
                                gxtEl.parent = Data.getElementsByTagName('data')[0].getElementsByTagName('parent')[0].firstChild.data;
                            }
                        } catch (e) {
                        }
                        gxtEl.condition = Data.getElementsByTagName('condition')[0].firstChild.data;
                        gxtEl.content = Data.getElementsByTagName('content')[0].firstChild.data;
                        gxtEl.fix = Data.getElementsByTagName('fix')[0].firstChild.data;
                        // not used gxtEl.digits = Data.getElementsByTagName('cs')[0].firstChild.data;
                        gxtEl.autodigits = Data.getElementsByTagName('digits')[0].firstChild.data;
                        gxtEl.parent = JXG.GeonextReader.changeOriginIds(board, gxtEl.parent);
                        c = new JXG.Text(board, gxtEl.mpStr, gxtEl.parent, [
                            gxtEl.x, gxtEl.y
                        ], gxtEl.id, gxtEl.name, gxtEl.autodigits, false, board.options.text.display);
                        c.setProperty('labelColor:' + gxtEl.colorLabel, 'visible:' + gxtEl.visible);
                        break;
                    case 'parametercurve':
                        gxtEl = JXG.GeonextReader.colorProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);
                        gxtEl.functionx = Data.getElementsByTagName('functionx')[0].firstChild.data;
                        gxtEl.functiony = Data.getElementsByTagName('functiony')[0].firstChild.data;
                        gxtEl.min = Data.getElementsByTagName('min')[0].firstChild.data;
                        gxtEl.max = Data.getElementsByTagName('max')[0].firstChild.data;
                        c = new JXG.Curve(board, [
                            't',gxtEl.functionx,gxtEl.functiony,gxtEl.min,gxtEl.max
                        ], gxtEl.id, gxtEl.name);
                        c.setProperty('strokeColor:' + gxtEl.colorStroke, 'strokeWidth:' + gxtEl.strokewidth, 'fillColor:none',
                                'highlightStrokeColor:' + gxtEl.highlightStrokeColor);
                        JXG.GeonextReader.printDebugMessage('debug', gxtEl, Data.nodeName, 'OK');
                        break;
                    case 'tracecurve':
                        gxtEl.tracepoint = Data.getElementsByTagName('tracepoint')[0].firstChild.data;
                        gxtEl.traceslider = Data.getElementsByTagName('traceslider')[0].firstChild.data;
                        JXG.GeonextReader.printDebugMessage('debug', gxtEl, Data.nodeName, '<b>ERR</b>');
                        break;
                    case 'group':
                        gxtEl = JXG.GeonextReader.boardProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.colorProperties(gxtEl, Data);
                        gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);
                        gxtEl.members = [
                        ];
                        for (i = 0; i < Data.getElementsByTagName('data')[0].getElementsByTagName('member').length; i++) {
                            gxtEl.members[i] = Data.getElementsByTagName('data')[0].getElementsByTagName('member')[i].firstChild.data;
                            gxtEl.members[i] = JXG.GeonextReader.changeOriginIds(board, gxtEl.members[i]);
                        }
                        c = new JXG.Group(board, gxtEl.id, gxtEl.name, gxtEl.members);
                        JXG.GeonextReader.printDebugMessage('debug', gxtEl, Data.nodeName, 'OK');
                        break;
                    default:
                    //if (Data.nodeName!="#text") {
                    //$('debug').innerHTML += "* <b>Err:</b> " + Data.nodeName + " not yet implemented <br>\n";
                    //}
                }
                delete(gxtEl);
            })(s);
        }
        board.addConditions(conditions);

    },

    decodeString: function(str) {
        var unz;
        if (str.indexOf("<GEONEXT>")<0){
            unz = (new JXG.Util.Unzip(JXG.Util.Base64.decodeAsArray(str))).unzip(); // war Gunzip ME
            if (unz=="")
                return str;
            else
                return unz;
        } else {
            return str;
        }
    },

    prepareString: function(fileStr){
        try {
            if (fileStr.indexOf('GEONEXT')<0) {
                fileStr = (JXG.GeonextReader.decodeString(fileStr))[0][0];  // Base64 decoding
            }
            // Hacks to enable not well formed XML. Will be redone in Algebra.geonext2JS and Board.addConditions
            fileStr = JXG.GeonextReader.fixXML(fileStr);
        } catch(e) {
            fileStr = '';
        }
        return fileStr;
    },

    fixXML: function(str) {
        var arr = ["active", "angle", "animate", "animated", "arc", "area", "arrow", "author", "autodigits", "axis", "back", "background", "board", "border", "bottom", "buttonsize", "cas", "circle", "color", "comment", "composition", "condition", "conditions", "content", "continuous", "control", "coord", "coordinates", "cross", "cs", "dash", "data", "description", "digits", "direction", "draft", "editable", "elements", "event", "file", "fill", "first", "firstarrow", "fix", "fontsize", "free", "full", "function", "functionx", "functiony", "GEONEXT", "graph", "grid", "group", "height", "id", "image", "info", "information", "input", "intersection", "item", "jsf", "label", "last", "lastarrow", "left", "lefttoolbar", "lighting", "line", "loop", "max", "maximized", "member", "middle", "midpoint", "min", "modifier", "modus", "mp", "mpx", "multi", "name", "onpolygon", "order", "origin", "output", "overline", "parametercurve", "parent", "point", "pointsnap", "polygon", "position", "radius", "radiusnum", "radiusvalue", "right", "section", "selectedlefttoolbar", "showconstruction", "showcoord", "showinfo", "showunit", "showx", "showy", "size", "slider", "snap", "speed", "src", "start", "stop", "straight", "stroke", "strokewidth", "style", "term", "text", "top", "trace", "tracecurve", "type", "unit", "value", "VERSION", "vertex", "viewport", "visible", "width", "wot", "x", "xooy", "xval", "y", "yval", "zoom"],
                list = arr.join('|'),
                regex = '\&lt;(/?('+list+'))\&gt;',
                expr = new RegExp(regex,'g');

        // First, we convert all < to &lt; and > to &gt;
        str = JXG.escapeHTML(str);
        // Second, we convert all GEONExT tags of the form &lt;tag&gt; back to <tag>
        str = str.replace(expr,'<$1>');

        str = str.replace(/(<content>.*)<arc>(.*<\/content>)/g,'$1&lt;arc&gt;$2');
        str = str.replace(/(<mp>.*)<arc>(.*<\/mpx>)/g,'$1&lt;arc&gt;$2');
        str = str.replace(/(<mpx>.*)<arc>(.*<\/mpx>)/g,'$1&lt;arc&gt;$2');
        return str;
    }

}; // end: GeonextReader
