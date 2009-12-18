/*
    Copyright 2008,2009
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
JXG.GeonextReader = new function() {

this.changeOriginIds = function(board,id) {
    if((id == 'gOOe0') || (id == 'gXOe0') || (id == 'gYOe0') || (id == 'gXLe0') || (id == 'gYLe0')) {
        return board.id + id;
    }
    else {
        return id;
    }
};

/**
 * Set color properties of a geonext element.
 * Set stroke, fill, lighting, label and draft color attributes.
 * @param {Object} gxtEl element of which attributes are to set
 */
this.colorProperties = function(gxtEl, Data) {
    //gxtEl.strokewidth = Data.getElementsByTagName('strokewidth')[0].firstChild.data;
    gxtEl.colorStroke = Data.getElementsByTagName('color')[0].getElementsByTagName('stroke')[0].firstChild.data;
    gxtEl.highlightStrokeColor = Data.getElementsByTagName('color')[0].getElementsByTagName('lighting')[0].firstChild.data;
    gxtEl.colorFill = Data.getElementsByTagName('color')[0].getElementsByTagName('fill')[0].firstChild.data;
    gxtEl.colorLabel = Data.getElementsByTagName('color')[0].getElementsByTagName('label')[0].firstChild.data;
    gxtEl.colorDraft = Data.getElementsByTagName('color')[0].getElementsByTagName('draft')[0].firstChild.data;
    return gxtEl;
};

this.firstLevelProperties = function(gxtEl, Data) {
    var arr = Data.childNodes,
        n, key;
    for (n=0;n<arr.length;n++) {
        if (arr[n].firstChild!=null && arr[n].nodeName!='data' && arr[n].nodeName!='straight') {
            key = arr[n].nodeName;
            gxtEl[key] = arr[n].firstChild.data;
        }
    };
    return gxtEl;
};

/**
 * Set the board properties of a geonext element.
 * Set active, area, dash, draft and showinfo attributes.
 * @param {Object} gxtEl element of which attributes are to set
 */
this.boardProperties = function(gxtEl, Data) {
    //gxtEl.active = Data.getElementsByTagName('active')[0].firstChild.data;
    //gxtEl.area = Data.getElementsByTagName('area')[0].firstChild.data;
    //gxtEl.dash = Data.getElementsByTagName('dash')[0].firstChild.data;
    //gxtEl.draft = Data.getElementsByTagName('draft')[0].firstChild.data;
    //gxtEl.showinfo = Data.getElementsByTagName('showinfo')[0].firstChild.data;
    return gxtEl;
};

/**
 * Set the defining properties of a geonext element.
 * Writing the nodeName to ident; setting the name attribute and defining the element id.
 * @param {Object} gxtEl element of which attributes are to set
 */
this.defProperties = function(gxtEl, Data) {
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
};

this.visualProperties = function(gxtEl, Data) {
    gxtEl.visible = Data.getElementsByTagName('visible')[0].firstChild.data;
    gxtEl.trace = Data.getElementsByTagName('trace')[0].firstChild.data;
    return gxtEl;
};

this.readNodes = function(gxtEl, Data, nodeType, prefix) {
    var arr = Data.getElementsByTagName(nodeType)[0].childNodes,
        key, n;
    for (n=0;n<arr.length;n++) {
        if (arr[n].firstChild!=null) {
            if (prefix!=null) {
                key = prefix+JXG.capitalize(arr[n].nodeName);
            } else {
                key = arr[n].nodeName;
            }
            gxtEl[key] = arr[n].firstChild.data;
        }
    };
    return gxtEl;
};

this.subtreeToString = function(root) {
    try {
        // firefox
        return (new XMLSerializer()).serializeToString(root);
    } catch (e) {
        // IE
        return root.xml;
    }
    return null;
};

this.readImage = function(node) {
    var pic = '',
        nod = node;

    if (nod!=null) {
        pic = nod.data;
        while (nod.nextSibling!=null) {
            nod = nod.nextSibling;
            pic += nod.data;
        }
    }
    return pic;
};

this.parseImage = function(board,fileNode,level,x,y,w,h,el) {
    var tag, wOrg, hOrg, id, im, node, picStr;

    if (fileNode==null) { return null; }
    if (fileNode.getElementsByTagName('src')[0]!=null) {  // Background image
        tag = 'src';
    } else if (fileNode.getElementsByTagName('image')[0]!=null) {
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
        } else {  // Image bound to an element
            /*
                Read the original dimensions
                with the help of a temporary image
            */
            node = document.createElement('img');
            node.setAttribute('id', 'tmpimg');
            node.style.display = 'none';
            document.getElementsByTagName('body')[0].appendChild(node);
            node.setAttribute('src',picStr);
            wOrg = node.width;
            hOrg = node.height;
            wOrg = (wOrg==0)?3:wOrg; // Hack!
            hOrg = (hOrg==0)?3:hOrg;

            y -= hOrg*w/wOrg*0.5;
            h = hOrg*w/wOrg;
            document.getElementsByTagName('body')[0].removeChild(node);
        }
        if (el!=null) { // In case the image is bound to an element
            id = el.id+'_image';
        } else {
            id = false;
        }
        im = new JXG.Image(board,picStr,[x,y],[w,h], level, id, false, el);
        return im;
    }
};

this.readConditions = function(node,board) {
    var i, s, e, ob;
    board.conditions = '';
    if (node!=null) {
        for(i=0; i<node.getElementsByTagName('data').length; i++) {
            ob = node.getElementsByTagName('data')[i];
            s = JXG.GeonextReader.subtreeToString(ob);
            board.conditions += s;
        }
    }
};

this.printDebugMessage = function(outputEl,gxtEl,nodetyp,success) {
    //$(outputEl).innerHTML += "* " + success + ":  " + nodetyp + " " + gxtEl.name + " " + gxtEl.id + "<br>\n";
};

/**
 * Reading the elements of a geonext file
 * @param {XMLTree} tree expects the content of the parsed geonext file returned by function parseFF/parseIE
 * @param {Object} board board object
 */
this.readGeonext = function(tree,board) {
    var boardTmp = {}, // AW: Why do we need boardTmp?
        snap, gridX, gridY, gridDash, gridColor, gridOpacity, grid,
        xmlNode,
        axisX, axisY, bgcolor, opacity,
        elChildNodes,
        s, Data;

    boardData = tree.getElementsByTagName('board')[0];
    boardTmp.ident = "board";
    boardTmp.id = boardData.getElementsByTagName('id')[0].firstChild.data;
    boardTmp.width = boardData.getElementsByTagName('width')[0].firstChild.data;
    boardTmp.height = boardData.getElementsByTagName('height')[0].firstChild.data;

    xmlNode = boardData.getElementsByTagName('fontsize')[0];
    boardTmp.fontSize = (xmlNode != null) ? document.body.style.fontSize = xmlNode.firstChild.data : document.body.style.fontSize;
    boardTmp.modus = boardData.getElementsByTagName('modus')[0].firstChild.data;

    xmlNode =  boardData.getElementsByTagName('coordinates')[0].getElementsByTagName('origin')[0];
    boardTmp.originX = xmlNode.getElementsByTagName('x')[0].firstChild.data;
    boardTmp.originY = xmlNode.getElementsByTagName('y')[0].firstChild.data;

    xmlNode =  boardData.getElementsByTagName('coordinates')[0].getElementsByTagName('zoom')[0];
    boardTmp.zoomX = xmlNode.getElementsByTagName('x')[0].firstChild.data;
    boardTmp.zoomY = xmlNode.getElementsByTagName('y')[0].firstChild.data;

    xmlNode = boardData.getElementsByTagName('coordinates')[0].getElementsByTagName('unit')[0];
    boardTmp.unitX = xmlNode.getElementsByTagName('x')[0].firstChild.data;
    boardTmp.unitY = xmlNode.getElementsByTagName('y')[0].firstChild.data;

    xmlNode = boardData.getElementsByTagName('coordinates')[0].getElementsByTagName('viewport')[0];
    boardTmp.viewportTop = xmlNode.getElementsByTagName('top')[0].firstChild.data;
    boardTmp.viewportLeft = xmlNode.getElementsByTagName('left')[0].firstChild.data;
    boardTmp.viewportBottom = xmlNode.getElementsByTagName('bottom')[0].firstChild.data;
    boardTmp.viewportRight = xmlNode.getElementsByTagName('right')[0].firstChild.data;

    this.readConditions(boardData.getElementsByTagName('conditions')[0],boardTmp);
    board.origin = {};
    board.origin.usrCoords = [1, 0, 0];
    board.origin.scrCoords = [1, 1*boardTmp.originX, 1*boardTmp.originY];
    board.zoomX = 1*boardTmp.zoomX;
    board.zoomY = 1*boardTmp.zoomY;
    board.unitX = 1*boardTmp.unitX;
    board.unitY = 1*boardTmp.unitY;
    board.stretchX = board.zoomX*board.unitX;
    board.stretchY = board.zoomY*board.unitY;

    if (board.options.takeSizeFromFile) {
        board.resizeContainer(boardTmp.width,boardTmp.height);
        //board.setBoundingBox([1*boardTmp.viewportLeft,1*boardTmp.viewportTop,
        //                      1*boardTmp.viewportRight,1*boardTmp.viewportBottom],true);
    }

    if(1*boardTmp.fontSize != 0) {
        board.fontSize = 1*boardTmp.fontSize;
    }
    else {
        board.fontSize = 12;
    }
    board.geonextCompatibilityMode = true;

    delete(JXG.JSXGraph.boards[board.id]);
    board.id = boardTmp.id;

    JXG.JSXGraph.boards[board.id] = board;
    board.initGeonextBoard();
    // Update of properties during update() is not necessary in GEONExT files
    // But it maybe necessary if we construct with JavaScript afterwards
    board.renderer.enhancedRendering = true;

    JXG.GeonextReader.parseImage(board,boardData.getElementsByTagName('file')[0],board.options.layer['image']); // Background image

    // Eigenschaften der Zeichenflaeche setzen
    // das Grid zeichnen
    // auf Kaestchen springen?
    snap = (boardData.getElementsByTagName('coordinates')[0].getElementsByTagName('snap')[0].firstChild.data == "true") ? board.snapToGrid = true : null;
    gridX = (boardData.getElementsByTagName('grid')[1].getElementsByTagName('x')[0].firstChild.data) ? board.gridX = boardData.getElementsByTagName('grid')[1].getElementsByTagName('x')[0].firstChild.data*1 : null;
    gridY = (boardData.getElementsByTagName('grid')[1].getElementsByTagName('y')[0].firstChild.data) ? board.gridY = boardData.getElementsByTagName('grid')[1].getElementsByTagName('y')[0].firstChild.data*1 : null;
    board.calculateSnapSizes();
    gridDash = boardData.getElementsByTagName('grid')[1].getElementsByTagName('dash')[0].firstChild.data;
    board.gridDash = board.algebra.str2Bool(gridDash);
    gridColor = boardData.getElementsByTagName('grid')[1].getElementsByTagName('color')[0].firstChild.data;
    if (gridColor.length=='9' && gridColor.substr(0,1)=='#') {
        gridOpacity = gridColor.substr(7,2);
        gridOpacity = parseInt(gridOpacity.toUpperCase(),16)/255;
        gridColor = gridColor.substr(0,7);
    }
    else {
        gridOpacity = '1';
    }
    board.gridColor = gridColor;
    board.gridOpacity = gridOpacity;
    grid = (boardData.getElementsByTagName('coordinates')[0].getElementsByTagName('grid')[0].firstChild.data == "true") ? board.renderer.drawGrid(board) : null;

    if(boardData.getElementsByTagName('coordinates')[0].getElementsByTagName('coord')[0].firstChild.data == "true") {
//        var p1coords = new JXG.Coords(JXG.COORDS_BY_SCREEN, [0, 0], board);
//        var p2coords = new JXG.Coords(JXG.COORDS_BY_SCREEN, [board.canvasWidth, board.canvasHeight], board);

//        var axisX = board.createElement('axis', [[p1coords.usrCoords[1], 0], [p2coords.usrCoords[1], 0]]);
        axisX = board.createElement('axis', [[0, 0], [1, 0]]);
        axisX.setProperty('strokeColor:'+axisX.visProp['strokeColor'],'strokeWidth:'+axisX.visProp['strokeWidth'],
                          'fillColor:none','highlightStrokeColor:'+axisX.visProp['highlightStrokeColor'],
                          'highlightFillColor:none', 'visible:true');
//        var axisY = board.createElement('axis', [[0, p2coords.usrCoords[2]], [0, p1coords.usrCoords[2]]]);
        axisY = board.createElement('axis', [[0, 0], [0, 1]]);
        axisY.setProperty('strokeColor:'+axisY.visProp['strokeColor'],'strokeWidth:'+axisY.visProp['strokeWidth'],
                          'fillColor:none','highlightStrokeColor:'+axisY.visProp['highlightStrokeColor'],
                          'highlightFillColor:none', 'visible:true');
    }
    bgcolor = boardData.getElementsByTagName('background')[0].getElementsByTagName('color')[0].firstChild.data;
    opacity = 1;
    if (bgcolor.length=='9' && bgcolor.substr(0,1)=='#') {
        opacity = bgcolor.substr(7,2);
        bgcolor = bgcolor.substr(0,7);
    }
    board.containerObj.style.backgroundColor = bgcolor;

    elChildNodes = tree.getElementsByTagName("elements")[0].childNodes;
    for (s=0; s<elChildNodes.length; s++) (
    function(s) {
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
            el,  arcId, pointId, line1Id, line2Id, pid, lid, aid, cid, p;

        Data = elChildNodes[s];
        gxtEl = JXG.GeonextReader.defProperties(gxtEl, Data);
        if (gxtEl==null) return; // Text nodes are skipped.

        switch(Data.nodeName.toLowerCase()) {
            case "point":
                gxtEl = JXG.GeonextReader.boardProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.colorProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.visualProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data, 'data'); // x and y
                gxtEl.fixed = Data.getElementsByTagName('fix')[0].firstChild.data;
                JXG.GeonextReader.parseImage(board,Data.getElementsByTagName('image')[0],board.options.layer['point']);
                try {
                    p = new JXG.Point(board, [1*gxtEl.x, 1*gxtEl.y], gxtEl.id, gxtEl.name, true);
                    p.setProperty('strokeColor:'+gxtEl.colorStroke,'strokeWidth:'+gxtEl.strokewidth,
                                  'fillColor:'+gxtEl.colorStroke,'highlightStrokeColor:'+gxtEl.highlightStrokeColor,
                                  'highlightFillColor:'+gxtEl.highlightStrokeColor,'labelColor:'+gxtEl.colorLabel,
                                  'visible:'+gxtEl.visible,'fixed:'+gxtEl.fixed,'draft:'+gxtEl.draft);
                    p.setStyle(1*gxtEl.style);
                    p.traced = (gxtEl.trace=='false') ? false : true;
                    JXG.GeonextReader.printDebugMessage('debug',gxtEl,Data.nodeName,'OK');
                } catch(e) {
                    alert(e);
                    //$('debug').innerHTML += "* <b>Err:</b>  Point " + gxtEl.name + " " + gxtEl.id + "<br>\n";
                }
                break;
            case "line":
                gxtEl = JXG.GeonextReader.boardProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.colorProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.visualProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data, 'data');
                gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data, 'straight', 'straight');

                gxtEl.first = JXG.GeonextReader.changeOriginIds(board,gxtEl.first);
                gxtEl.last = JXG.GeonextReader.changeOriginIds(board,gxtEl.last);

                l = new JXG.Line(board, gxtEl.first, gxtEl.last, gxtEl.id, gxtEl.name);
                x = l.point1.coords.usrCoords[1];
                y = l.point1.coords.usrCoords[2];
                w = l.point1.coords.distance(JXG.COORDS_BY_USER, l.point2.coords);
                h = 0; // dummy
                l.image = JXG.GeonextReader.parseImage(board,Data,board.options.layer['line'],x,y,w,h,l);

                gxtEl.straightFirst = (gxtEl.straightFirst=='false') ? false : true;
                gxtEl.straightLast = (gxtEl.straightLast=='false') ? false : true;
                l.setStraight(gxtEl.straightFirst, gxtEl.straightLast);
                l.setProperty('strokeColor:'+gxtEl.colorStroke,'strokeWidth:'+gxtEl.strokewidth,
                              'fillColor:'+gxtEl.colorFill,'highlightStrokeColor:'+gxtEl.highlightStrokeColor,
                              'highlightFillColor:'+gxtEl.colorFill, 'labelColor:'+gxtEl.colorLabel,
                              'visible:'+gxtEl.visible, 'dash:'+gxtEl.dash,'draft:'+gxtEl.draft);
                l.traced = (gxtEl.trace=='false') ? false : true;
                JXG.GeonextReader.printDebugMessage('debug',gxtEl,Data.nodeName,'OK');
                break;
            case "circle":
                gxtEl = JXG.GeonextReader.boardProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.colorProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.visualProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);
                gxtEl.midpoint = Data.getElementsByTagName('data')[0].getElementsByTagName('midpoint')[0].firstChild.data;

                JXG.GeonextReader.parseImage(board,Data.getElementsByTagName('image')[0],board.options.layer['circle']);
                if(Data.getElementsByTagName('data')[0].getElementsByTagName('radius').length > 0) {
                    gxtEl.radiuspoint = Data.getElementsByTagName('data')[0].getElementsByTagName('radius')[0].firstChild.data;
                    gxtEl.radius = null;
                    gxtEl.method = "twoPoints";
                }
                else if(Data.getElementsByTagName('data')[0].getElementsByTagName('radiusvalue').length > 0) {
                    gxtEl.radiuspoint = null;
                    gxtEl.radius = Data.getElementsByTagName('data')[0].getElementsByTagName('radiusvalue')[0].firstChild.data;
                    gxtEl.radiusnum = Data.getElementsByTagName('data')[0].getElementsByTagName('radiusnum')[0].firstChild.data;
                    gxtEl.method = "pointRadius";
                }
                if(gxtEl.method == "twoPoints") {
                    if(board.objects[gxtEl.radiuspoint].type == JXG.OBJECT_TYPE_LINE) {
                        gxtEl.method = "pointLine";
                        gxtEl.radiuspoint = JXG.GeonextReader.changeOriginIds(board,gxtEl.radiuspoint);
                    }
                    else if(board.objects[gxtEl.radiuspoint].type == JXG.OBJECT_TYPE_CIRCLE) {
                        gxtEl.method = "pointCircle";
                    }
                }
                if (gxtEl.method=='pointRadius') {
                    gxtEl.midpoint = JXG.GeonextReader.changeOriginIds(board,gxtEl.midpoint);
                    c = new JXG.Circle(board, gxtEl.method, gxtEl.midpoint,
                                        gxtEl.radius, gxtEl.id, gxtEl.name);
                } else {
                    gxtEl.midpoint = JXG.GeonextReader.changeOriginIds(board,gxtEl.midpoint);
                    c = new JXG.Circle(board, gxtEl.method, gxtEl.midpoint, gxtEl.radiuspoint,
                                        gxtEl.id, gxtEl.name);
                }
                c.setProperty('strokeColor:'+gxtEl.colorStroke,'strokeWidth:'+gxtEl.strokewidth,
                              'fillColor:'+gxtEl.colorFill,'highlightStrokeColor:'+gxtEl.highlightStrokeColor,
                              'highlightFillColor:'+gxtEl.colorFill,'visible:'+gxtEl.visible,'labelColor:'+gxtEl.colorLabel,
                              'dash:'+gxtEl.dash,'draft:'+gxtEl.draft);
                c.traced = (gxtEl.trace=='false') ? false : true;
                JXG.GeonextReader.printDebugMessage('debug',gxtEl,Data.nodeName,'OK');
                break;
            case "slider":
                gxtEl = JXG.GeonextReader.colorProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.boardProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.visualProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);

                gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data, 'data');
                gxtEl.fixed = Data.getElementsByTagName('fix')[0].firstChild.data;
                gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data, 'animate', 'animate');
                JXG.GeonextReader.parseImage(board,Data.getElementsByTagName('image')[0],board.options.layer['point']);
                try {
                    p = new JXG.Point(board, [1*gxtEl.x, 1*gxtEl.y], gxtEl.id, gxtEl.name, true);
                    gxtEl.parent = JXG.GeonextReader.changeOriginIds(board,gxtEl.parent);
                    p.makeGlider(gxtEl.parent);
                    p.setProperty('strokeColor:'+gxtEl.colorStroke,'strokeWidth:'+gxtEl.strokewidth,
                                  'fillColor:'+gxtEl.colorStroke,'highlightStrokeColor:'+gxtEl.highlightStrokeColor,
                                  'highlightFillColor:'+gxtEl.highlightStrokeColor,'visible:'+gxtEl.visible,
                                  'fixed:'+gxtEl.fixed,'labelColor:'+gxtEl.colorLabel,'draft:'+gxtEl.draft);
                    p.onPolygon = board.algebra.str2Bool(gxtEl.onpolygon);
                    p.traced = (gxtEl.trace=='false') ? false : true;
                    p.setStyle(1*gxtEl.style);
                    JXG.GeonextReader.printDebugMessage('debug',gxtEl,Data.nodeName,'OK');
                } catch(e) {
                    //$('debug').innerHTML += "* <b>Err:</b>  Slider " + gxtEl.name + " " + gxtEl.id + ': '+ gxtEl.parent +"<br>\n";
                }
                break;
            case "cas":
                gxtEl = JXG.GeonextReader.boardProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.colorProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.visualProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);
                //gxtEl.showcoord = Data.getElementsByTagName('showcoord')[0].firstChild.data;
                gxtEl.fixed = Data.getElementsByTagName('fix')[0].firstChild.data;
                gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data, 'data');
                JXG.GeonextReader.parseImage(board,Data.getElementsByTagName('image')[0],board.options.layer['point']);
                p = new JXG.Point(board, [1*gxtEl.xval, 1*gxtEl.yval], gxtEl.id, gxtEl.name, true);
                p.addConstraint([gxtEl.x,gxtEl.y]);
                p.setProperty('strokeColor:'+gxtEl.colorStroke,'strokeWidth:'+gxtEl.strokewidth,
                              'fillColor:'+gxtEl.colorStroke,'highlightStrokeColor:'+gxtEl.highlightStrokeColor,
                              'highlightFillColor:'+gxtEl.highlightStrokeColor,'visible:'+gxtEl.visible,
                              'fixed:'+gxtEl.fixed,'labelColor:'+gxtEl.colorLabel,'draft:'+gxtEl.draft);
                p.traced = (gxtEl.trace=='false') ? false : true;
                p.setStyle(1*gxtEl.style);
                JXG.GeonextReader.printDebugMessage('debug',gxtEl,Data.nodeName,'OK');
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
                gxtEl.outputFirstStrokewidth =  xmlNode.getElementsByTagName('strokewidth')[0].firstChild.data;

                xmlNode = Data.getElementsByTagName('first')[1].getElementsByTagName('color')[0];
                gxtEl.outputFirstColorStroke = xmlNode.getElementsByTagName('stroke')[0].firstChild.data;
                gxtEl.outputFirstHighlightStrokeColor = xmlNode.getElementsByTagName('lighting')[0].firstChild.data;
                gxtEl.outputFirstColorFill = xmlNode.getElementsByTagName('fill')[0].firstChild.data;
                gxtEl.outputFirstColorLabel = xmlNode.getElementsByTagName('label')[0].firstChild.data;
                gxtEl.outputFirstColorDraft = xmlNode.getElementsByTagName('draft')[0].firstChild.data;

                gxtEl.first = JXG.GeonextReader.changeOriginIds(board,gxtEl.first);
                gxtEl.last = JXG.GeonextReader.changeOriginIds(board,gxtEl.last);
                if( (((board.objects[gxtEl.first]).type == (board.objects[gxtEl.last]).type) && ((board.objects[gxtEl.first]).type == JXG.OBJECT_TYPE_LINE || (board.objects[gxtEl.first]).type == JXG.OBJECT_TYPE_ARROW))
                     || (((board.objects[gxtEl.first]).type == JXG.OBJECT_TYPE_LINE) && ((board.objects[gxtEl.last]).type == JXG.OBJECT_TYPE_ARROW))
                     || (((board.objects[gxtEl.last]).type == JXG.OBJECT_TYPE_LINE) && ((board.objects[gxtEl.first]).type == JXG.OBJECT_TYPE_ARROW)) ) {
                    inter = new JXG.Intersection(board, gxtEl.id, board.objects[gxtEl.first],
                                                     board.objects[gxtEl.last], gxtEl.outputFirstId, '',
                                                     gxtEl.outputFirstName, '');
                    /* offensichtlich braucht man dieses if doch */
                    if(gxtEl.outputFirstVisible == "false") {
                        inter.hideElement();
                    }
                    inter.p.setProperty('strokeColor:'+gxtEl.outputFirstColorStroke,
                                        'strokeWidth:'+gxtEl.outputFirstStrokewidth,
                                        //'fillColor:'+gxtEl.outputFirstColorFill,
                                        'fillColor:'+gxtEl.outputFirstColorStroke,
                                        'highlightStrokeColor:'+gxtEl.outputFirstHighlightStrokeColor,
                                        'highlightFillColor:'+gxtEl.outputFirstHighlightStrokeColor,
                                        //'highlightFillColor:'+gxtEl.outputFirstColorFill,
                                        'visible:'+gxtEl.outputFirstVisible,
                                        'labelColor:'+gxtEl.outputFirstColorLabel,
                                        'draft:'+gxtEl.draft);
                    inter.p.setStyle(1*gxtEl.outputFirstStyle);
                    inter.p.traced = (gxtEl.outputFirstTrace=='false') ? false : true;
                }
                else {
                    //gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data, 'last','outputLast');
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
                    inter.p1.setProperty('strokeColor:'+gxtEl.outputFirstColorStroke,
                                        'strokeWidth:'+gxtEl.outputFirstStrokewidth,
                                        //'fillColor:'+gxtEl.outputFirstColorFill,
                                        'fillColor:'+gxtEl.outputFirstColorStroke,
                                        'highlightStrokeColor:'+gxtEl.outputFirstHighlightStrokeColor,
                                        //'highlightFillColor:'+gxtEl.outputFirstColorFill,
                                        'highlightFillColor:'+gxtEl.outputFirstHighlightStrokeColor,
                                        'visible:'+gxtEl.outputFirstVisible,
                                        'labelColor:'+gxtEl.outputFirstColorLabel,
                                        'draft:'+gxtEl.draft);
                    inter.p1.setStyle(1*gxtEl.outputFirstStyle);
                    inter.p1.traced = (gxtEl.outputFirstTrace=='false') ? false : true;
                    inter.p2.setProperty('strokeColor:'+gxtEl.outputLastColorStroke,
                                        'strokeWidth:'+gxtEl.outputLastStrokewidth,
                                        //'fillColor:'+gxtEl.outputLastColorFill,
                                        'fillColor:'+gxtEl.outputLastColorStroke,
                                        'highlightStrokeColor:'+gxtEl.outputLastHighlightStrokeColor,
                                        //'highlightFillColor:'+gxtEl.outputLastColorFill,
                                        'highlightFillColor:'+gxtEl.outputLastHighlightStrokeColor,
                                        'visible:'+gxtEl.outputLastVisible,
                                        'labelColor:'+gxtEl.outputLastColorLabel,
                                        'draft:'+gxtEl.draft);
                    inter.p2.setStyle(1*gxtEl.outputLastStyle);
                    inter.p2.traced = (gxtEl.outputLastTrace=='false') ? false : true;

                    /* if-Statement evtl. unnoetig BV*/
                    if(gxtEl.outputFirstVisible == "false") {
                        if(gxtEl.outputLastVisible == "false") {
                            inter.hideElement();
                        }
                        else {
                            inter.p1.hideElement();
                        }
                    }
                    else {
                        if(gxtEl.outputLastVisible == "false") {
                            inter.p2.hideElement();
                        }
                    }
                }
                JXG.GeonextReader.printDebugMessage('debug',gxtEl,Data.nodeName,'OK');
                break;
            case "composition":
                gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data,'data');
                gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);
                switch(gxtEl.type) {
                    case "210070": gxtEl.typeName = "ARROW_PARALLEL"; break;
                    case "210080": gxtEl.typeName = "BISECTOR"; break;
                    case "210090": gxtEl.typeName = "CIRCUMCIRCLE"; break;
                    case "210100": gxtEl.typeName = "CIRCUMCIRCLE_CENTER"; break;
                    case "210110": gxtEl.typeName = "MIDPOINT"; break;
                    case "210120": gxtEl.typeName = "MIRROR_LINE"; break;
                    case "210125": gxtEl.typeName = "MIRROR_POINT"; break;
                    case "210130": gxtEl.typeName = "NORMAL"; break;
                    case "210140": gxtEl.typeName = "PARALLEL"; break;
                    case "210150": gxtEl.typeName = "PARALLELOGRAM_POINT"; break;
                    case "210160": gxtEl.typeName = "PERPENDICULAR"; break;
                    case "210170": gxtEl.typeName = "PERPENDICULAR_POINT"; break;
                    case "210180": gxtEl.typeName = "ROTATION"; break; // FEHLT
                    case "210190": gxtEl.typeName = "SECTOR"; break;
                }
                gxtEl.defEl = [];
                numberDefEls = 0;
                xmlNode = Data.getElementsByTagName('data')[0].getElementsByTagName('input');
                for(i=0; i<xmlNode.length; i++) {
                    gxtEl.defEl[i] = xmlNode[i].firstChild.data;
                    numberDefEls = i+1;
                }
                xmlNode = Data.getElementsByTagName('output')[0];
                gxtEl.outputId = xmlNode.getElementsByTagName('id')[0].firstChild.data;
                gxtEl.outputName = xmlNode.getElementsByTagName('name')[0].firstChild.data;
                gxtEl.outputVisible = xmlNode.getElementsByTagName('visible')[0].firstChild.data;
                gxtEl.outputTrace = xmlNode.getElementsByTagName('trace')[0].firstChild.data;

                gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data, 'output','output');
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

                gxtEl.defEl[0] = JXG.GeonextReader.changeOriginIds(board,gxtEl.defEl[0]);
                gxtEl.defEl[1] = JXG.GeonextReader.changeOriginIds(board,gxtEl.defEl[1]);
                gxtEl.defEl[2] = JXG.GeonextReader.changeOriginIds(board,gxtEl.defEl[2]);
                if(gxtEl.typeName == "MIDPOINT") {
                    if (numberDefEls==2) {  // Midpoint of two points
                    	board.createElement('midpoint', [gxtEl.defEl[0], gxtEl.defEl[1]], {name: gxtEl.outputName, id: gxtEl.outputId});
                    } else if (numberDefEls==1) { // Midpoint of a line
                    	board.createElement('midpoint', [gxtEl.defEl[0]], {name: gxtEl.outputName, id: gxtEl.outputId});
                    }
                }
                else if(gxtEl.typeName == "NORMAL") {
                    board.addNormal(gxtEl.defEl[1], gxtEl.defEl[0], gxtEl.outputId, gxtEl.outputName);
//TODO                    board.createElement('normal', [gxtEl.defEl[1], gxtEl.defEl[0]], {'id': gxtEl.outputId, name: gxtEl.outputName});
                }
                else if(gxtEl.typeName == "PARALLEL") {
                    board.createElement('parallel', [gxtEl.defEl[1], gxtEl.defEl[0]], {'id': gxtEl.outputId, name: gxtEl.outputName});
                }
                else if(gxtEl.typeName == "CIRCUMCIRCLE") {
                    umkreisId = Data.getElementsByTagName('output')[1].getElementsByTagName('id')[0].firstChild.data;
                    umkreisName = Data.getElementsByTagName('output')[1].getElementsByTagName('name')[0].firstChild.data;
                    board.createElement('circumcircle', [gxtEl.defEl[0], gxtEl.defEl[1], gxtEl.defEl[2]], {name: [gxtEl.outputName, umkreisName], id: [gxtEl.outputId, umkreisId]});
                }
                else if(gxtEl.typeName == "CIRCUMCIRCLE_CENTER") {
                    board.createElement('circumcirclemidpoint', [gxtEl.defEl[0], gxtEl.defEl[1], gxtEl.defEl[2]], {id: gxtEl.outputId, name: gxtEl.outputName});
                }
                else if(gxtEl.typeName == "BISECTOR") {
                    board.createElement('bisector', [gxtEl.defEl[0], gxtEl.defEl[1], gxtEl.defEl[2]], {id: gxtEl.outputId, name: gxtEl.outputName});
                }
                else if(gxtEl.typeName == "MIRROR_LINE") {
                    board.createElement('reflection', [gxtEl.defEl[1], gxtEl.defEl[0]], {id: gxtEl.outputId, name: gxtEl.outputName});
                }
                else if(gxtEl.typeName == "MIRROR_POINT") {
                    // Spaeter: Rotation --> Winkel statt Math.PI
                    board.createElement('mirrorpoint', [gxtEl.defEl[0], gxtEl.defEl[1]], {name: gxtEl.outputName, id: gxtEl.outputId});
                }
                else if(gxtEl.typeName == "PARALLELOGRAM_POINT") {
                    if (gxtEl.defEl.length==2) { // line, point
                        board.createElement('parallelpoint', [JXG.getReference(gxtEl.defEl[0]).point1,
                                               JXG.getReference(gxtEl.defEl[0]).point2,
                                               gxtEl.defEl[1]], {id: gxtEl.outputId, name: gxtEl.outputName});
                    } else {  // point, point, point
                        board.createElement('parallelpoint', [gxtEl.defEl[0], gxtEl.defEl[1], gxtEl.defEl[2]], {id: gxtEl.outputId, name: gxtEl.outputName});
                    }
                }
                else if(gxtEl.typeName == "SECTOR") {
                    JXG.GeonextReader.parseImage(board,Data.getElementsByTagName('image')[0],board.options.layer['sector']);
                    for(i=0; i<Data.getElementsByTagName('output').length; i++) {
                        xmlNode = Data.getElementsByTagName('output')[i];
                        defEl[i] = xmlNode.getElementsByTagName('id')[0].firstChild.data;
                        defEl[i] = JXG.GeonextReader.changeOriginIds(board,defEl[i]);
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
                    el = new JXG.Sector(board, gxtEl.defEl[0],
                                           gxtEl.defEl[1], gxtEl.defEl[2],
                                           [defEl[0], defEl[1], defEl[2], defEl[3]],
                                           [defElN[0].firstChild.data, defElN[1].firstChild.data, defElN[2].firstChild.data,
                                               defElN[3].firstChild.data],
                                           gxtEl.id);
                    // Sector hat keine eigenen Eigenschaften
                    //el.setProperty('fillColor:'+defElColF[0],'highlightFillColor:'+defElColF[0], 'strokeColor:none');
                    /* Eigenschaften des Kreisbogens */
                    arcId = defEl[0];
                    board.objects[arcId].setProperty('strokeColor:'+defElColStr[0],
                                                     'strokeWidth:'+defElSW[0],
                                                     'fillColor:'+defElColF[0],
                                                     //'fillColor:none',
                                                     'highlightStrokeColor:'+defElHColStr[0],
                                                     'highlightFillColor:'+defElColF[0],
                                                     //'highlightFillColor:none',
                                                     'visible:'+defElV[0],
                                                     'dash:'+defElD[0],
                                                     'draft:'+defElDr[0]);
                    board.objects[arcId].traced = (defElT[0]=='false') ? false : true;
                    gxtEl.firstArrow = Data.getElementsByTagName('output')[0].getElementsByTagName('firstarrow')[0].firstChild.data;
                    gxtEl.lastArrow = Data.getElementsByTagName('output')[0].getElementsByTagName('lastarrow')[0].firstChild.data;
                    gxtEl.firstArrow = (gxtEl.firstArrow=='false') ? false : true;
                    gxtEl.lastArrow = (gxtEl.lastArrow=='false') ? false : true;
                    board.objects[arcId].setArrow(gxtEl.firstArrow,gxtEl.lastArrow);
                    /* Eigenschaften des Endpunkts */
                    pointId = defEl[1];
                    gxtEl.fixed = Data.getElementsByTagName('output')[1].getElementsByTagName('fix')[0].firstChild.data;
                    board.objects[pointId].setProperty('strokeColor:'+defElColStr[1],
                                                       'strokeWidth:'+defElSW[1],
                                                       //'fillColor:'+defElColF[1],
                                                       'fillColor:'+defElColStr[1],
                                                       'highlightStrokeColor:'+defElHColStr[1],
                                                       //'highlightFillColor:'+defElColF[1],
                                                       'highlightFillColor:'+defElHColStr[1],
                                                       'visible:'+defElV[1],
                                                       'fixed:'+gxtEl.fixed,
                                                       'labelColor:'+defElColL[1],
                                                       'draft:'+defElDr[1]);
                    gxtEl.style = Data.getElementsByTagName('output')[1].getElementsByTagName('style')[0].firstChild.data;
                    board.objects[pointId].setStyle(1*gxtEl.style);
                    board.objects[pointId].traced = (defElT[1]=='false') ? false : true;
                    /* Eigenschaften der ersten Linie */
                    line1Id = defEl[2];

                    xmlNode = Data.getElementsByTagName('output')[2].getElementsByTagName('straight')[0];
                    gxtEl.straightFirst = xmlNode.getElementsByTagName('first')[0].firstChild.data;
                    gxtEl.straightLast = xmlNode.getElementsByTagName('last')[0].firstChild.data;
                    gxtEl.straightFirst = (gxtEl.straightFirst=='false') ? false : true;
                    gxtEl.straightLast = (gxtEl.straightLast=='false') ? false : true;
                    board.objects[line1Id].setStraight(gxtEl.straightFirst, gxtEl.straightLast);
                    board.objects[line1Id].setProperty('strokeColor:'+defElColStr[2],
                                                       'strokeWidth:'+defElSW[2],
                                                       'fillColor:'+defElColF[2],
                                                       'highlightStrokeColor:'+defElHColStr[2],
                                                       'highlightFillColor:'+defElColF[2],
                                                       'visible:'+defElV[2],
                                                       'dash:'+defElD[2],
                                                       'draft:'+defElDr[2]);
                    board.objects[line1Id].traced = (defElT[2]=='false') ? false : true;
                    /* Eigenschaften der zweiten Linie */

                    line2Id = defEl[3];
                    xmlNode = Data.getElementsByTagName('output')[3].getElementsByTagName('straight')[0];
                    gxtEl.straightFirst = xmlNode.getElementsByTagName('first')[0].firstChild.data;
                    gxtEl.straightLast = xmlNode.getElementsByTagName('last')[0].firstChild.data;
                    gxtEl.straightFirst = (gxtEl.straightFirst=='false') ? false : true;
                    gxtEl.straightLast = (gxtEl.straightLast=='false') ? false : true;
                    board.objects[line2Id].setStraight(gxtEl.straightFirst, gxtEl.straightLast);
                    board.objects[line2Id].setProperty('strokeColor:'+defElColStr[3],
                                                       'strokeWidth:'+defElSW[3],
                                                       'fillColor:'+defElColF[3],
                                                       'highlightStrokeColor:'+defElHColStr[3],
                                                       'highlightFillColor:'+defElColF[3],
                                                       'visible:'+defElV[3],
                                                       'dash:'+defElD[3],
                                                       'draft:'+defElDr[3]);
                    board.objects[line2Id].traced = (defElT[3]=='false') ? false : true;
                }
                else if(gxtEl.typeName == "PERPENDICULAR") {
                    for(i=0; i<Data.getElementsByTagName('output').length; i++) {
                        xmlNode = Data.getElementsByTagName('output')[i];
                        defEl[i] = xmlNode.getElementsByTagName('id')[0].firstChild.data;
                        defEl[i] = JXG.GeonextReader.changeOriginIds(board,defEl[i]);
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

                    board.createElement('perpendicular', [gxtEl.defEl[1], gxtEl.defEl[0]],
                                        {name: [defElN[1].firstChild.data, defElN[0].firstChild.data],
                                         id:[defEl[1], defEl[0]]});
                    /* Eigenschaften des Lotfusspunkts */
                    pid = defEl[0];
                    board.objects[pid].setProperty('strokeColor:'+defElColStr[0],
                                                                          'strokeWidth:'+defElSW[0],
                                                                          //'fillColor:'+defElColF[0],
                                                                          'fillColor:'+defElColStr[0],
                                                                          'highlightStrokeColor:'+defElHColStr[0],
                                                                          //'highlightFillColor:'+defElColF[0],
                                                                          'highlightFillColor:'+defElHColStr[0],
                                                                          'visible:'+defElV[0],
                                                                          'fixed:'+gxtEl.outputFixed,
                                                                          'labelColor:'+defElColL[0],
                                                                          'draft:'+defElDr[0]);
                    board.objects[pid].setStyle(1*gxtEl.outputStyle);
                    board.objects[pid].traced = (defElT[0]=='false') ? false : true;
                    /* Eigenschaften der Lotstrecke */
                    lid = defEl[1];
                    board.objects[lid].setProperty('strokeColor:'+defElColStr[1],
                                                                          'strokeWidth:'+defElSW[1],
                                                                          'fillColor:'+defElColF[1],
                                                                          'highlightStrokeColor:'+defElHColStr[1],
                                                                          'highlightFillColor:'+defElColF[1],
                                                                          'visible:'+defElV[1],
                                                                          'dash:'+defElD[1],
                                                                          'draft:'+defElDr[1]);
                    board.objects[lid].traced = (defElT[1]=='false') ? false : true;
                }
                else if(gxtEl.typeName == "ARROW_PARALLEL") {
                    for(i=0; i<Data.getElementsByTagName('output').length; i++) {
                        xmlNode = Data.getElementsByTagName('output')[i];
                        defEl[i] = xmlNode.getElementsByTagName('id')[0].firstChild.data;
                        defEl[i] = JXG.GeonextReader.changeOriginIds(board,defEl[i]);
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

                    board.createElement('arrowparallel', [gxtEl.defEl[1], gxtEl.defEl[0]], {id: [defEl[0], defEl[1]], name: [defElN[0].firstChild.data, defElN[1].firstChild.data]});

                    /* Eigenschaften des erzeugten Arrows */
                    aid = defEl[0];
                    board.objects[aid].setProperty('strokeColor:'+defElColStr[0],
                                                                          'strokeWidth:'+defElSW[0],
                                                                          'fillColor:'+defElColF[0],
                                                                          'highlightStrokeColor:'+defElHColStr[0],
                                                                          'highlightFillColor:'+defElColF[0],
                                                                          'visible:'+defElV[0],
                                                                          'dash:'+defElD[0],
                                                                          'draft:'+defElDr[0]);
                    board.objects[aid].traced = (defElT[0]=='false') ? false : true;
                    /* Eigenschaften des Endpunkts */
                    pid = defEl[1];
                    board.objects[pid].setProperty('strokeColor:'+defElColStr[1],
                                                                          'strokeWidth:'+defElSW[1],
                                                                          //'fillColor:'+defElColF[1],
                                                                          'fillColor:'+defElColStr[1],
                                                                          'highlightStrokeColor:'+defElHColStr[1],
                                                                          //'highlightFillColor:'+defElColF[1],
                                                                          'highlightFillColor:'+defElHColStr[1],
                                                                          'visible:'+defElV[1],
                                                                          'fixed:'+gxtEl.outputFixed,
                                                                          'labelColor:'+defElColL[1],
                                                                          'draft:'+defElDr[1]);
                    board.objects[pid].setStyle(1*gxtEl.outputStyle);
                    board.objects[pid].traced = (defElT[1]=='false') ? false : true;
                }
                else if(gxtEl.typeName == "PERPENDICULAR_POINT") {
                    board.createElement('perpendicularpoint', [gxtEl.defEl[1], gxtEl.defEl[0]], {name: gxtEl.outputName, id: gxtEl.outputId});
                }
                else {
                    throw new Error("JSXGraph: GEONExT-Element " + gxtEl.typeName + ' not yet implemented');
                }
                /* noch die Eigenschaften der uebrigen Elemente setzen */
                if(gxtEl.typeName == "MIDPOINT" || gxtEl.typeName == "MIRROR_LINE" ||
                   gxtEl.typeName == "CIRCUMCIRCLE_CENTER" || gxtEl.typeName == "PERPENDICULAR_POINT" ||
                   gxtEl.typeName == "MIRROR_POINT" || gxtEl.typeName == "PARALLELOGRAM_POINT") { // hier wird jeweils ein Punkt angelegt
                    gxtEl.outputFixed = Data.getElementsByTagName('output')[0].getElementsByTagName('fix')[0].firstChild.data;
                    gxtEl.outputStyle = Data.getElementsByTagName('output')[0].getElementsByTagName('style')[0].firstChild.data;
                    board.objects[gxtEl.outputId].setProperty('strokeColor:'+gxtEl.outputColorStroke,
                                                                       'strokeWidth:'+gxtEl.outputStrokewidth,
                                                                       //'fillColor:'+gxtEl.outputColorFill,
                                                                       'fillColor:'+gxtEl.outputColorStroke,
                                                                       'highlightStrokeColor:'+gxtEl.outputHighlightStrokeColor,
                                                                       //'highlightFillColor:'+gxtEl.outputColorFill,
                                                                       'highlightFillColor:'+gxtEl.outputHighlightStrokeColor,
                                                                       'visible:'+gxtEl.outputVisible,
                                                                       'fixed:'+gxtEl.outputFixed,
                                                                       'labelColor:'+gxtEl.outputColorLabel,
                                                                       'draft:'+gxtEl.outputDraft);
                    board.objects[gxtEl.outputId].setStyle(1*gxtEl.outputStyle);
                    board.objects[gxtEl.outputId].traced = (gxtEl.outputTrace=='false') ? false : true;
                }
                else if(gxtEl.typeName == "BISECTOR" || gxtEl.typeName == "NORMAL" ||
                        gxtEl.typeName == "PARALLEL") { // hier wird jeweils eine Linie angelegt
                    xmlNode = Data.getElementsByTagName('output')[0].getElementsByTagName('straight')[0];
                    gxtEl.straightFirst = xmlNode.getElementsByTagName('first')[0].firstChild.data;
                    gxtEl.straightLast = xmlNode.getElementsByTagName('last')[0].firstChild.data;
                    gxtEl.straightFirst = (gxtEl.straightFirst=='false') ? false : true;
                    gxtEl.straightLast = (gxtEl.straightLast=='false') ? false : true;
                    board.objects[gxtEl.outputId].setStraight(gxtEl.straightFirst, gxtEl.straightLast);
                    board.objects[gxtEl.outputId].setProperty('strokeColor:'+gxtEl.outputColorStroke,
                                                                       'strokeWidth:'+gxtEl.outputStrokewidth,
                                                                       'fillColor:'+gxtEl.outputColorFill,
                                                                       'highlightStrokeColor:'+gxtEl.outputHighlightStrokeColor,
                                                                       'highlightFillColor:'+gxtEl.outputColorFill,
                                                                       'visible:'+gxtEl.outputVisible,
                                                                       'dash:'+gxtEl.outputDash,
                                                                       'draft:'+gxtEl.outputDraft);
                    board.objects[gxtEl.outputId].traced = (gxtEl.outputTrace=='false') ? false : true;
                }
                else if(gxtEl.typeName == "CIRCUMCIRCLE") {
                    for(i=0; i<Data.getElementsByTagName('output').length; i++) {
                        xmlNode = Data.getElementsByTagName('output')[i];
                        defEl[i] = xmlNode.getElementsByTagName('id')[0].firstChild.data;
                        defEl[i] = JXG.GeonextReader.changeOriginIds(board,defEl[i]);
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
                    board.objects[pid].setProperty('strokeColor:'+defElColStr[0],
                                                                          'strokeWidth:'+defElSW[0],
                                                                          //'fillColor:'+defElColF[0],
                                                                          'fillColor:'+defElColStr[0],
                                                                          'highlightStrokeColor:'+defElHColStr[0],
                                                                          //'highlightFillColor:'+defElColF[0],
                                                                          'highlightFillColor:'+defElHColStr[0],
                                                                          'visible:'+defElV[0],
                                                                          'fixed:'+gxtEl.outputFixed,
                                                                          'labelColor:'+defElColL[0],
                                                                          'draft:'+defElDr[0]);
                    board.objects[pid].setStyle(1*gxtEl.outputStyle);
                    board.objects[pid].traced = (defElT[0]=='false') ? false : true;
                    /* Eigenschaften des Umkreises */
                    cid = defEl[1];
                    board.objects[cid].setProperty('strokeColor:'+defElColStr[1],
                                                                          'strokeWidth:'+defElSW[1],
                                                                          'fillColor:'+defElColF[1],
                                                                          'highlightStrokeColor:'+defElHColStr[1],
                                                                          'highlightFillColor:'+defElColF[1],
                                                                          'visible:'+defElV[1],
                                                                          'dash:'+defElD[1],
                                                                          'draft:'+defElDr[1]);
                    board.objects[cid].traced = (defElT[1]=='false') ? false : true;
                }
                // "PERPENDICULAR" und "SECTOR" werden direkt im oberen if erledigt
                JXG.GeonextReader.printDebugMessage('debug',gxtEl,Data.nodeName,'OK');
                break;
            case "polygon":
                gxtEl = JXG.GeonextReader.colorProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);
                gxtEl.dataVertex = [];
                for(i=0; i<Data.getElementsByTagName('data')[0].getElementsByTagName('vertex').length; i++) {
                    gxtEl.dataVertex[i] = Data.getElementsByTagName('data')[0].getElementsByTagName('vertex')[i].firstChild.data;
                    gxtEl.dataVertex[i] = JXG.GeonextReader.changeOriginIds(board,gxtEl.dataVertex[i]);
                }
                gxtEl.border = [];
                for(i=0; i<Data.getElementsByTagName('border').length; i++) {
                    gxtEl.border[i] = {};
                    xmlNode = Data.getElementsByTagName('border')[i];
                    gxtEl.border[i].id = xmlNode.getElementsByTagName('id')[0].firstChild.data;
                    gxtEl.border[i].name = xmlNode.getElementsByTagName('name')[0].firstChild.data;
                    gxtEl.border[i].straightFirst =
                        xmlNode.getElementsByTagName('straight')[0].getElementsByTagName('first')[0].firstChild.data;
                    gxtEl.border[i].straightLast =
                        xmlNode.getElementsByTagName('straight')[0].getElementsByTagName('last')[0].firstChild.data;
                    gxtEl.border[i].straightFirst = (gxtEl.border[i].straightFirst=='false') ? false : true;
                    gxtEl.border[i].straightLast = (gxtEl.border[i].straightLast=='false') ? false : true;
                    gxtEl.border[i].strokewidth = xmlNode.getElementsByTagName('strokewidth')[0].firstChild.data;
                    gxtEl.border[i].dash = xmlNode.getElementsByTagName('dash')[0].firstChild.data;
                    gxtEl.border[i].visible = xmlNode.getElementsByTagName('visible')[0].firstChild.data;
                    gxtEl.border[i].draft = xmlNode.getElementsByTagName('draft')[0].firstChild.data;
                    gxtEl.border[i].trace = xmlNode.getElementsByTagName('trace')[0].firstChild.data;

                    xmlNode = Data.getElementsByTagName('border')[i].getElementsByTagName('color')[0];
                    gxtEl.border[i].colorStroke = xmlNode.getElementsByTagName('stroke')[0].firstChild.data;
                    gxtEl.border[i].highlightStrokeColor = xmlNode.getElementsByTagName('lighting')[0].firstChild.data;
                    gxtEl.border[i].colorFill = xmlNode.getElementsByTagName('fill')[0].firstChild.data;
                    gxtEl.border[i].colorLabel = xmlNode.getElementsByTagName('label')[0].firstChild.data;
                    gxtEl.border[i].colorDraft = xmlNode.getElementsByTagName('draft')[0].firstChild.data;
                }
                JXG.GeonextReader.parseImage(board,Data.getElementsByTagName('image')[0],board.options.layer['polygon']);
                p = new JXG.Polygon(board, gxtEl.dataVertex, gxtEl.border, gxtEl.id, gxtEl.name, true,true,true);
                p.setProperty('strokeColor:'+gxtEl.colorStroke,'strokeWidth:'+gxtEl.strokewidth,
                              'fillColor:'+gxtEl.colorFill,'highlightStrokeColor:'+gxtEl.highlightStrokeColor,
                              'highlightFillColor:'+gxtEl.colorFill,'labelColor:'+gxtEl.colorLabel,
                              'draft:'+gxtEl.draft,'trace:'+gxtEl.trace,'visible:true');
                // to emulate the geonext behaviour on invisible polygones
                if(!gxtEl.visible) {
                    p.setProperty('fillColor:none','highlightFillColor:none');
                }
                for(i=0; i<p.borders.length; i++) {
                    p.borders[i].setStraight(gxtEl.border[i].straightFirst, gxtEl.border[i].straightLast);
                    p.borders[i].setProperty('strokeColor:'+gxtEl.border[i].colorStroke,
                                             'strokeWidth:'+gxtEl.border[i].strokewidth,
                                             'fillColor:'+gxtEl.border[i].colorFill,
                                             'highlightStrokeColor:'+gxtEl.border[i].highlightStrokeColor,
                                             'highlightFillColor:'+gxtEl.border[i].colorFill,
                                             'visible:'+gxtEl.border[i].visible,
                                             'dash:'+gxtEl.border[i].dash,'labelColor:'+gxtEl.border[i].colorLabel,
                                             'draft:'+gxtEl.border[i].draft,'trace:'+gxtEl.border[i].trace);
                }
                JXG.GeonextReader.printDebugMessage('debug',gxtEl,Data.nodeName,'OK');
                break;
            case "graph":
                gxtEl = JXG.GeonextReader.colorProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);
                gxtEl.funct = Data.getElementsByTagName('data')[0].getElementsByTagName('function')[0].firstChild.data;
                JXG.GeonextReader.parseImage(board,Data.getElementsByTagName('image')[0],board.options.layer['curve']);
                c = new JXG.Curve(board, ['x','x',gxtEl.funct], gxtEl.id, gxtEl.name);
                JXG.GeonextReader.printDebugMessage('debug',gxtEl,Data.nodeName,'OK');
                /*
                 * Ignore fillcolor attribute
                 * g.setProperty('strokeColor:'+gxtEl.colorStroke,'strokeWidth:'+gxtEl.strokewidth,'fillColor:'+gxtEl.colorFill,
                              'highlightStrokeColor:'+gxtEl.highlightStrokeColor);*/
                c.setProperty('strokeColor:'+gxtEl.colorStroke,'strokeWidth:'+gxtEl.strokewidth,'fillColor:none',
                              'highlightStrokeColor:'+gxtEl.highlightStrokeColor);

                break;
            case "arrow":
                gxtEl = JXG.GeonextReader.colorProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.boardProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data, 'data');
                gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data, 'straight','straight');
                gxtEl = JXG.GeonextReader.visualProperties(gxtEl, Data);
                gxtEl.first = JXG.GeonextReader.changeOriginIds(board,gxtEl.first);
                gxtEl.last = JXG.GeonextReader.changeOriginIds(board,gxtEl.last);
                l = new JXG.Line(board, gxtEl.first, gxtEl.last, gxtEl.id, gxtEl.name);
                l.setProperty('strokeColor:'+gxtEl.colorStroke,'strokeWidth:'+gxtEl.strokewidth,
                              'fillColor:'+gxtEl.colorFill,'highlightStrokeColor:'+gxtEl.highlightStrokeColor,
                              'highlightFillColor:'+gxtEl.colorFill,'labelColor:'+gxtEl.colorLabel,
                              'visible:'+gxtEl.visible, 'dash:'+gxtEl.dash, 'draft:'+gxtEl.draft);
                l.setStraight(false,false);
                l.setArrow(false,true);
                l.traced = (gxtEl.trace=='false') ? false : true;
                JXG.GeonextReader.printDebugMessage('debug',l,Data.nodeName,'OK');
                break;
            case "arc":
                gxtEl = JXG.GeonextReader.colorProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.visualProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.boardProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data, 'data');

                gxtEl.firstArrow = Data.getElementsByTagName('firstarrow')[0].firstChild.data;
                gxtEl.lastArrow = Data.getElementsByTagName('lastarrow')[0].firstChild.data;
                JXG.GeonextReader.parseImage(board,Data.getElementsByTagName('image')[0],board.options.layer['arc']);
                gxtEl.midpoint = JXG.GeonextReader.changeOriginIds(board,gxtEl.midpoint);
                gxtEl.angle = JXG.GeonextReader.changeOriginIds(board,gxtEl.angle);
                gxtEl.radius = JXG.GeonextReader.changeOriginIds(board,gxtEl.radius);
                c = new JXG.Arc(board, gxtEl.midpoint, gxtEl.radius, gxtEl.angle,
                                gxtEl.id, gxtEl.name);
                c.setProperty('strokeColor:'+gxtEl.colorStroke,'strokeWidth:'+gxtEl.strokewidth,
                              'fillColor:'+gxtEl.colorFill,'highlightStrokeColor:'+gxtEl.highlightStrokeColor,
                              'highlightFillColor:'+gxtEl.colorFill,'labelColor:'+gxtEl.colorLabel,
                              'visible:'+gxtEl.visible, 'dash:'+gxtEl.dash, 'draft:'+gxtEl.draft);
                c.traced = (gxtEl.trace=='false') ? false : true;
                gxtEl.firstArrow = (gxtEl.firstArrow=='false') ? false : true;
                gxtEl.lastArrow = (gxtEl.lastArrow=='false') ? false : true;
                c.setArrow(gxtEl.firstArrow,gxtEl.lastArrow);
                JXG.GeonextReader.printDebugMessage('debug',c,Data.nodeName,'OK');
                break;
            case "angle":
                gxtEl = JXG.GeonextReader.boardProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.colorProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.visualProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data, 'data');
                //gxtEl.txt = JXG.GeonextReader.subtreeToString(Data.getElementsByTagName('text')[0]).firstChild.data;
                try {
                    gxtEl.txt = Data.getElementsByTagName('text')[0].firstChild.data;
                } catch (e) {
                    gxtEl.txt = '';
                }
                c = new JXG.Angle(board, gxtEl.first, gxtEl.middle, gxtEl.last, gxtEl.radius, gxtEl.txt, gxtEl.id, gxtEl.name);
                c.setProperty('strokeColor:'+gxtEl.colorStroke,'strokeWidth:'+gxtEl.strokewidth,
                              'fillColor:'+gxtEl.colorFill,'highlightStrokeColor:'+gxtEl.highlightStrokeColor,
                              'highlightFillColor:'+gxtEl.colorFill,'labelColor:'+gxtEl.colorLabel,
                              'visible:'+gxtEl.visible, 'dash:'+gxtEl.dash /*, 'draft:'+gxtEl.draft*/);
                JXG.GeonextReader.printDebugMessage('debug',gxtEl,Data.nodeName,'OK');
                break;
            case "text":
                if (gxtEl.id.match(/oldVersion/)) break;
                gxtEl = JXG.GeonextReader.boardProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.colorProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.visualProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);

                gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data, 'data');
                gxtEl.mpStr = JXG.GeonextReader.subtreeToString(Data.getElementsByTagName('data')[0].getElementsByTagName('mp')[0]);
                gxtEl.mpStr = gxtEl.mpStr.replace(/<\/?mp>/g,'');
                try{
                    if (Data.getElementsByTagName('data')[0].getElementsByTagName('parent')[0].firstChild) {
                        gxtEl.parent = Data.getElementsByTagName('data')[0].getElementsByTagName('parent')[0].firstChild.data;
                    }
                } catch (e) { /*alert("parent in text not found");*/ } // This maybe empty
                gxtEl.condition = Data.getElementsByTagName('condition')[0].firstChild.data;
                gxtEl.content = Data.getElementsByTagName('content')[0].firstChild.data;
                gxtEl.fix = Data.getElementsByTagName('fix')[0].firstChild.data;
                // not used gxtEl.digits = Data.getElementsByTagName('cs')[0].firstChild.data;
                gxtEl.autodigits = Data.getElementsByTagName('digits')[0].firstChild.data;
                gxtEl.parent = JXG.GeonextReader.changeOriginIds(board,gxtEl.parent);
                c = new JXG.Text(board, gxtEl.mpStr, gxtEl.parent, [gxtEl.x, gxtEl.y], gxtEl.id, gxtEl.name, gxtEl.autodigits, false,       board.options.text.defaultType);
                c.setProperty('labelColor:'+gxtEl.colorLabel, 'visible:'+gxtEl.visible);
                /*if(gxtEl.visible == "false") {
                    c.hideElement();
                } */
                break;
            case 'parametercurve':
                gxtEl = JXG.GeonextReader.colorProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);
                gxtEl.functionx = Data.getElementsByTagName('functionx')[0].firstChild.data;
                gxtEl.functiony = Data.getElementsByTagName('functiony')[0].firstChild.data;
                gxtEl.min = Data.getElementsByTagName('min')[0].firstChild.data;
                gxtEl.max = Data.getElementsByTagName('max')[0].firstChild.data;
                c = new JXG.Curve(board, ['t',gxtEl.functionx,gxtEl.functiony,gxtEl.min,gxtEl.max], gxtEl.id, gxtEl.name);
                c.setProperty('strokeColor:'+gxtEl.colorStroke,'strokeWidth:'+gxtEl.strokewidth,'fillColor:none',
                              'highlightStrokeColor:'+gxtEl.highlightStrokeColor);
                JXG.GeonextReader.printDebugMessage('debug',gxtEl,Data.nodeName,'OK');
                break;
            case 'tracecurve':
                gxtEl.tracepoint = Data.getElementsByTagName('tracepoint')[0].firstChild.data;
                gxtEl.traceslider = Data.getElementsByTagName('traceslider')[0].firstChild.data;
                JXG.GeonextReader.printDebugMessage('debug',gxtEl,Data.nodeName,'<b>ERR</b>');
                break;
            case 'group':
                gxtEl = JXG.GeonextReader.boardProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.colorProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);
                gxtEl.members = [];
                for(i=0; i<Data.getElementsByTagName('data')[0].getElementsByTagName('member').length; i++) {
                    gxtEl.members[i] = Data.getElementsByTagName('data')[0].getElementsByTagName('member')[i].firstChild.data;
                    gxtEl.members[i] = JXG.GeonextReader.changeOriginIds(board,gxtEl.members[i]);
                }
                c = new JXG.Group(board, gxtEl.id, gxtEl.name, gxtEl.members);
                JXG.GeonextReader.printDebugMessage('debug',gxtEl,Data.nodeName,'OK');
                break;
            default:
                //if (Data.nodeName!="#text") {
                    //$('debug').innerHTML += "* <b>Err:</b> " + Data.nodeName + " not yet implemented <br>\n";
                //}
        }
        delete(gxtEl);
    })(s);
    board.addConditions(boardTmp.conditions);
};

this.decodeString = function(str) {
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
};

this.prepareString = function(fileStr){
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
};

this.fixXML = function(str) {
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
};

}; // end: GeonextReader()
