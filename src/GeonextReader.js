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
    var arr = Data.childNodes;
    for (var n=0;n<arr.length;n++) {
        if (arr[n].firstChild!=null && arr[n].nodeName!='data' && arr[n].nodeName!='straight') {
            var key = arr[n].nodeName;
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
    var key;
    var arr = Data.getElementsByTagName(nodeType)[0].childNodes;
    for (var n=0;n<arr.length;n++) {
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
    var pic = '';
    var nod = node;
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
    if (fileNode==null) { return null; }
    if (fileNode.getElementsByTagName('src')[0]!=null) {  // Background image
        var tag = 'src';
    } else if (fileNode.getElementsByTagName('image')[0]!=null) {
        var tag = 'image';
    } else {
        return null;
    }

    var picStr = this.readImage(fileNode.getElementsByTagName(tag)[0].firstChild);
    if (picStr!='') {
        if (tag=='src') {  // Background image
            var x = fileNode.getElementsByTagName('x')[0].firstChild.data;
            var y = fileNode.getElementsByTagName('y')[0].firstChild.data;
            var w = fileNode.getElementsByTagName('width')[0].firstChild.data;
            var h = fileNode.getElementsByTagName('height')[0].firstChild.data;
        } else {  // Image bound to an element
            var node = document.createElement('img');
            node.setAttribute('id', 'tmpimg');
            node.style.display = 'none';
            document.getElementsByTagName('body')[0].appendChild(node);
            node.setAttribute('src','data:image/png;base64,' + picStr);
            var wOrg = node.width;
            var hOrg = node.height;
            wOrg = (wOrg==0)?3:wOrg; // Hack!
            hOrg = (hOrg==0)?3:hOrg;

            y -= hOrg*w/wOrg*0.5; 
            h = hOrg*w/wOrg;
            document.getElementsByTagName('body')[0].removeChild(node);
        }
        if (el!=null) { // In case the image is bound to an element
            var id = el.id+'_image';
        } else {
            var id = false;
        }
        var im = new JXG.Image(board,picStr,[x,y],[w,h], level, id, false, el);
        return im;
    }
};

this.readConditions = function(node,board) {
    board.conditions = '';
    if (node!=null) {
        for(var i=0; i<node.getElementsByTagName('data').length; i++) {
            var s;
            var e;
            var ob = node.getElementsByTagName('data')[i];
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
    // AW: Why do we need boardTmp?
    var boardTmp = {};
    boardData = tree.getElementsByTagName('board')[0];
    boardTmp.ident = "board";
    boardTmp.id = boardData.getElementsByTagName('id')[0].firstChild.data;
    boardTmp.width = boardData.getElementsByTagName('width')[0].firstChild.data;
    boardTmp.height = boardData.getElementsByTagName('height')[0].firstChild.data;
    boardTmp.fontSize = (boardData.getElementsByTagName('fontsize')[0] != null) ? document.body.style.fontSize = boardData.getElementsByTagName('fontsize')[0].firstChild.data : document.body.style.fontSize;
    boardTmp.modus = boardData.getElementsByTagName('modus')[0].firstChild.data;
    boardTmp.originX = boardData.getElementsByTagName('coordinates')[0].getElementsByTagName('origin')[0].getElementsByTagName('x')[0].firstChild.data;
    boardTmp.originY = boardData.getElementsByTagName('coordinates')[0].getElementsByTagName('origin')[0].getElementsByTagName('y')[0].firstChild.data;
    boardTmp.zoomX = boardData.getElementsByTagName('coordinates')[0].getElementsByTagName('zoom')[0].getElementsByTagName('x')[0].firstChild.data;
    boardTmp.zoomY = boardData.getElementsByTagName('coordinates')[0].getElementsByTagName('zoom')[0].getElementsByTagName('y')[0].firstChild.data;
    boardTmp.unitX = boardData.getElementsByTagName('coordinates')[0].getElementsByTagName('unit')[0].getElementsByTagName('x')[0].firstChild.data;
    boardTmp.unitY = boardData.getElementsByTagName('coordinates')[0].getElementsByTagName('unit')[0].getElementsByTagName('y')[0].firstChild.data;
    boardTmp.viewportTop = boardData.getElementsByTagName('coordinates')[0].getElementsByTagName('viewport')[0].getElementsByTagName('top')[0].firstChild.data;
    boardTmp.viewportLeft = boardData.getElementsByTagName('coordinates')[0].getElementsByTagName('viewport')[0].getElementsByTagName('left')[0].firstChild.data;
    boardTmp.viewportBottom = boardData.getElementsByTagName('coordinates')[0].getElementsByTagName('viewport')[0].getElementsByTagName('bottom')[0].firstChild.data;
    boardTmp.viewportRight = boardData.getElementsByTagName('coordinates')[0].getElementsByTagName('viewport')[0].getElementsByTagName('right')[0].firstChild.data;

    this.readConditions(boardData.getElementsByTagName('conditions')[0],boardTmp);

    board.origin = {};
    board.origin.usrCoords = [1, 0, 0];
    board.origin.scrCoords = [1, 1*boardTmp.originX, 1*boardTmp.originY];
    board.zoomX = 1*boardTmp.zoomX;
    board.zoomY = 1*boardTmp.zoomY;
    board.unitX = 1*boardTmp.unitX;
    board.unitY = 1*boardTmp.unitY;
    board.fontSize = 1*boardTmp.fontSize;
    board.geonextCompatibilityMode = true;
    //board.resizeContainer(boardTmp.width,boardTmp.height);
    
    delete(JXG.JSXGraph.boards[board.id]);                       
    board.id = boardTmp.id;

    JXG.JSXGraph.boards[board.id] = board;
    board.initGeonextBoard();
    // Update of properties during update() is not necessary in GEONExT files
    // But it maybe necessary if we construct with JavaScript afterwards
    board.renderer.enhancedRendering = true;

    JXG.GeonextReader.parseImage(board,boardData.getElementsByTagName('file')[0],'images'); // Background image

    // Eigenschaften der Zeichenflaeche setzen
    // das Grid zeichnen
    // auf Kaestchen springen?
    var snap = (boardData.getElementsByTagName('coordinates')[0].getElementsByTagName('snap')[0].firstChild.data == "true") ? board.snapToGrid = true : null;
    var gridX = (boardData.getElementsByTagName('grid')[1].getElementsByTagName('x')[0].firstChild.data) ? board.gridX = boardData.getElementsByTagName('grid')[1].getElementsByTagName('x')[0].firstChild.data*1 : null;
    var gridY = (boardData.getElementsByTagName('grid')[1].getElementsByTagName('y')[0].firstChild.data) ? board.gridY = boardData.getElementsByTagName('grid')[1].getElementsByTagName('y')[0].firstChild.data*1 : null;
    board.calculateSnapSizes();
    var gridDash = boardData.getElementsByTagName('grid')[1].getElementsByTagName('dash')[0].firstChild.data;
    board.gridDash = board.algebra.str2Bool(gridDash);
    var gridColor = boardData.getElementsByTagName('grid')[1].getElementsByTagName('color')[0].firstChild.data;
    var gridOpacity;
    if (gridColor.length=='9' && gridColor.substr(0,1)=='#') {
        gridOpacity = gridColor.substr(7,2);                
        gridColor = gridColor.substr(0,7);
    }
    else { 
        gridOpacity = 'FF';
    }
    board.gridColor = gridColor;
    board.gridOpacity = gridOpacity;
    var grid = (boardData.getElementsByTagName('coordinates')[0].getElementsByTagName('grid')[0].firstChild.data == "true") ? board.renderer.drawGrid(board) : null;
    
    if(boardData.getElementsByTagName('coordinates')[0].getElementsByTagName('coord')[0].firstChild.data == "true") {
//        var p1coords = new JXG.Coords(JXG.COORDS_BY_SCREEN, [0, 0], board);
//        var p2coords = new JXG.Coords(JXG.COORDS_BY_SCREEN, [board.canvasWidth, board.canvasHeight], board);

//        var axisX = board.createElement('axis', [[p1coords.usrCoords[1], 0], [p2coords.usrCoords[1], 0]]);
        var axisX = board.createElement('axis', [[0, 0], [1, 0]]);
        axisX.setProperty('strokeColor:'+axisX.visProp['strokeColor'],'strokeWidth:'+axisX.visProp['strokeWidth'],
                          'fillColor:none','highlightStrokeColor:'+axisX.visProp['highlightStrokeColor'], 
                          'highlightFillColor:none', 'visible:true');
//        var axisY = board.createElement('axis', [[0, p2coords.usrCoords[2]], [0, p1coords.usrCoords[2]]]);
        var axisY = board.createElement('axis', [[0, 0], [0, 1]]);
        axisY.setProperty('strokeColor:'+axisY.visProp['strokeColor'],'strokeWidth:'+axisY.visProp['strokeWidth'],
                          'fillColor:none','highlightStrokeColor:'+axisY.visProp['highlightStrokeColor'], 
                          'highlightFillColor:none', 'visible:true');
    }
    var bgcolor = boardData.getElementsByTagName('background')[0].getElementsByTagName('color')[0].firstChild.data;
    var opacity = 1;
    if (bgcolor.length=='9' && bgcolor.substr(0,1)=='#') {
        opacity = bgcolor.substr(7,2);
        bgcolor = bgcolor.substr(0,7);
    }    
    board.containerObj.style.backgroundColor = bgcolor;
    
    var elementsChildNodes = tree.getElementsByTagName("elements")[0].childNodes;
    for (var s=0;s<elementsChildNodes.length;s++) (function(s) {
        var Data = elementsChildNodes[s];
        var gxtEl = {};
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
                JXG.GeonextReader.parseImage(board,Data.getElementsByTagName('image')[0],'points');
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
                    //alert(e);                
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

                var l = new JXG.Line(board, gxtEl.first, gxtEl.last, gxtEl.id, gxtEl.name);
                var x = l.point1.coords.usrCoords[1];
                var y = l.point1.coords.usrCoords[2];
                var w = l.point1.coords.distance(JXG.COORDS_BY_USER, l.point2.coords);
                var h = 0; // dummy
                l.image = JXG.GeonextReader.parseImage(board,Data,'lines',x,y,w,h,l);
                
                gxtEl.straightFirst = (gxtEl.straightFirst=='false') ? false : true;
                gxtEl.straightLast = (gxtEl.straightLast=='false') ? false : true;                      
                l.setStraight(gxtEl.straightFirst, gxtEl.straightLast);
                l.setProperty('strokeColor:'+gxtEl.colorStroke,'strokeWidth:'+gxtEl.strokewidth,
                              'fillColor:'+gxtEl.colorFill,'highlightStrokeColor:'+gxtEl.highlightStrokeColor, 
                              'highlightFillColor:'+gxtEl.colorFill, 
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

                JXG.GeonextReader.parseImage(board,Data.getElementsByTagName('image')[0],'circles');
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
                    var c = new JXG.Circle(board, gxtEl.method, gxtEl.midpoint,  
                                        gxtEl.radius, gxtEl.id, gxtEl.name);      
                } else {
                    gxtEl.midpoint = JXG.GeonextReader.changeOriginIds(board,gxtEl.midpoint);
                    var c = new JXG.Circle(board, gxtEl.method, gxtEl.midpoint, gxtEl.radiuspoint, 
                                        gxtEl.id, gxtEl.name);      
                }
                c.setProperty('strokeColor:'+gxtEl.colorStroke,'strokeWidth:'+gxtEl.strokewidth,
                              'fillColor:'+gxtEl.colorFill,'highlightStrokeColor:'+gxtEl.highlightStrokeColor,
                              'highlightFillColor:'+gxtEl.colorFill,'visible:'+gxtEl.visible,
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
                JXG.GeonextReader.parseImage(board,Data.getElementsByTagName('image')[0],'points');
                try {
                    var p = new JXG.Point(board, [1*gxtEl.x, 1*gxtEl.y], gxtEl.id, gxtEl.name, true);
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
                JXG.GeonextReader.parseImage(board,Data.getElementsByTagName('image')[0],'points');
                var p = new JXG.Point(board, [1*gxtEl.xval, 1*gxtEl.yval], gxtEl.id, gxtEl.name, true);
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
                gxtEl.outputFirstId = Data.getElementsByTagName('first')[1].getElementsByTagName('id')[0].firstChild.data;  // 1 statt 0
                gxtEl.outputFirstName = Data.getElementsByTagName('first')[1].getElementsByTagName('name')[0].firstChild.data;
                gxtEl.outputFirstVisible = Data.getElementsByTagName('first')[1].getElementsByTagName('visible')[0].firstChild.data;  
                gxtEl.outputFirstTrace = Data.getElementsByTagName('first')[1].getElementsByTagName('trace')[0].firstChild.data;
                
                gxtEl.outputFirstFixed = Data.getElementsByTagName('first')[1].getElementsByTagName('fix')[0].firstChild.data;
                gxtEl.outputFirstStyle = Data.getElementsByTagName('first')[1].getElementsByTagName('style')[0].firstChild.data;
                gxtEl.outputFirstStrokewidth = 
                    Data.getElementsByTagName('first')[1].getElementsByTagName('strokewidth')[0].firstChild.data;
                gxtEl.outputFirstColorStroke = 
                    Data.getElementsByTagName('first')[1].getElementsByTagName('color')[0].getElementsByTagName('stroke')[0].firstChild.data;
                gxtEl.outputFirstHighlightStrokeColor = 
                    Data.getElementsByTagName('first')[1].getElementsByTagName('color')[0].getElementsByTagName('lighting')[0].firstChild.data;
                gxtEl.outputFirstColorFill = 
                    Data.getElementsByTagName('first')[1].getElementsByTagName('color')[0].getElementsByTagName('fill')[0].firstChild.data;
                gxtEl.outputFirstColorLabel = 
                    Data.getElementsByTagName('first')[1].getElementsByTagName('color')[0].getElementsByTagName('label')[0].firstChild.data;
                gxtEl.outputFirstColorDraft = 
                    Data.getElementsByTagName('first')[1].getElementsByTagName('color')[0].getElementsByTagName('draft')[0].firstChild.data;
                gxtEl.first = JXG.GeonextReader.changeOriginIds(board,gxtEl.first);
                gxtEl.last = JXG.GeonextReader.changeOriginIds(board,gxtEl.last);
                if( (((board.objects[gxtEl.first]).type == (board.objects[gxtEl.last]).type) && ((board.objects[gxtEl.first]).type == JXG.OBJECT_TYPE_LINE || (board.objects[gxtEl.first]).type == JXG.OBJECT_TYPE_ARROW)) 
                     || (((board.objects[gxtEl.first]).type == JXG.OBJECT_TYPE_LINE) && ((board.objects[gxtEl.last]).type == JXG.OBJECT_TYPE_ARROW))
                     || (((board.objects[gxtEl.last]).type == JXG.OBJECT_TYPE_LINE) && ((board.objects[gxtEl.first]).type == JXG.OBJECT_TYPE_ARROW)) ) {
                    var inter = new JXG.Intersection(board, gxtEl.id, board.objects[gxtEl.first], 
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
                    gxtEl.outputLastId = Data.getElementsByTagName('last')[1].getElementsByTagName('id')[0].firstChild.data;
                    gxtEl.outputLastName = Data.getElementsByTagName('last')[1].getElementsByTagName('name')[0].firstChild.data;
                    gxtEl.outputLastVisible = Data.getElementsByTagName('last')[1].getElementsByTagName('visible')[0].firstChild.data;
                    gxtEl.outputLastTrace = Data.getElementsByTagName('last')[1].getElementsByTagName('trace')[0].firstChild.data;
                    gxtEl.outputLastFixed = Data.getElementsByTagName('last')[1].getElementsByTagName('fix')[0].firstChild.data;
                    gxtEl.outputLastStyle = Data.getElementsByTagName('last')[1].getElementsByTagName('style')[0].firstChild.data;
                    gxtEl.outputLastStrokewidth = 
                        Data.getElementsByTagName('last')[1].getElementsByTagName('strokewidth')[0].firstChild.data;
                    var tmp = Data.getElementsByTagName('last')[1].getElementsByTagName('color')[0];
                    gxtEl.outputLastColorStroke = tmp.getElementsByTagName('stroke')[0].firstChild.data;
                    gxtEl.outputLastHighlightStrokeColor = tmp.getElementsByTagName('lighting')[0].firstChild.data;
                    gxtEl.outputLastColorFill = tmp.getElementsByTagName('fill')[0].firstChild.data;
                    gxtEl.outputLastColorLabel = tmp.getElementsByTagName('label')[0].firstChild.data;
                    gxtEl.outputLastColorDraft = tmp.getElementsByTagName('draft')[0].firstChild.data;                        
                    var inter = new JXG.Intersection(board, gxtEl.id, board.objects[gxtEl.first], 
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
                var numberDefEls = 0;
                for(var i=0; i<Data.getElementsByTagName('data')[0].getElementsByTagName('input').length; i++) {
                    gxtEl.defEl[i] = Data.getElementsByTagName('data')[0].getElementsByTagName('input')[i].firstChild.data;
                    numberDefEls = i+1;
                }
                gxtEl.outputId = Data.getElementsByTagName('output')[0].getElementsByTagName('id')[0].firstChild.data;
                gxtEl.outputName = Data.getElementsByTagName('output')[0].getElementsByTagName('name')[0].firstChild.data;
                gxtEl.outputVisible = Data.getElementsByTagName('output')[0].getElementsByTagName('visible')[0].firstChild.data;
                gxtEl.outputTrace = Data.getElementsByTagName('output')[0].getElementsByTagName('trace')[0].firstChild.data;
                        
                gxtEl.outputStrokewidth = 
                gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data, 'output','output');
                gxtEl.outputName = Data.getElementsByTagName('output')[0].getElementsByTagName('name')[0].firstChild.data;
                gxtEl.outputDash = Data.getElementsByTagName('output')[0].getElementsByTagName('dash')[0].firstChild.data;  
                gxtEl.outputDraft = Data.getElementsByTagName('output')[0].getElementsByTagName('draft')[0].firstChild.data;                   
                gxtEl.outputStrokewidth = 
                    Data.getElementsByTagName('output')[0].getElementsByTagName('strokewidth')[0].firstChild.data;
                //    Data.getElementsByTagName('output')[0].getElementsByTagName('strokewidth')[0].firstChild.data;
                gxtEl.outputColorStroke = 
                    Data.getElementsByTagName('output')[0].getElementsByTagName('color')[0].getElementsByTagName('stroke')[0].firstChild.data;
                gxtEl.outputHighlightStrokeColor = 
                    Data.getElementsByTagName('output')[0].getElementsByTagName('color')[0].getElementsByTagName('lighting')[0].firstChild.data;
                gxtEl.outputColorFill = 
                    Data.getElementsByTagName('output')[0].getElementsByTagName('color')[0].getElementsByTagName('fill')[0].firstChild.data;
                gxtEl.outputColorLabel = 
                    Data.getElementsByTagName('output')[0].getElementsByTagName('color')[0].getElementsByTagName('label')[0].firstChild.data;
                gxtEl.outputColorDraft = 
                    Data.getElementsByTagName('output')[0].getElementsByTagName('color')[0].getElementsByTagName('draft')[0].firstChild.data;                

                gxtEl.defEl[0] = JXG.GeonextReader.changeOriginIds(board,gxtEl.defEl[0]);
                gxtEl.defEl[1] = JXG.GeonextReader.changeOriginIds(board,gxtEl.defEl[1]);
                gxtEl.defEl[2] = JXG.GeonextReader.changeOriginIds(board,gxtEl.defEl[2]);
                if(gxtEl.typeName == "MIDPOINT") {
                    if (numberDefEls==2) {  // Midpoint of two points
                        board.addMidpoint(gxtEl.defEl[0], gxtEl.defEl[1], 
                                          gxtEl.outputId, gxtEl.outputName);
                    } else if (numberDefEls==1) { // Midpoint of a line
                        board.addMidpoint(board.objects[gxtEl.defEl[0]].point1.id, 
                                          board.objects[gxtEl.defEl[0]].point2.id, 
                                          gxtEl.outputId, gxtEl.outputName);
                    }                                                                        
                }
                else if(gxtEl.typeName == "NORMAL") {
                    board.addNormal(gxtEl.defEl[1], gxtEl.defEl[0], gxtEl.outputId, gxtEl.outputName);                
                }
                else if(gxtEl.typeName == "PARALLEL") {
                    board.addParallel(gxtEl.defEl[1], gxtEl.defEl[0], gxtEl.outputId, gxtEl.outputName);
                }
                else if(gxtEl.typeName == "CIRCUMCIRCLE") {                 
                    var umkreisId = Data.getElementsByTagName('output')[1].getElementsByTagName('id')[0].firstChild.data;
                    var umkreisName = Data.getElementsByTagName('output')[1].getElementsByTagName('name')[0].firstChild.data;                     
                    board.addCircumcenter(gxtEl.defEl[0], gxtEl.defEl[1], 
                                          gxtEl.defEl[2], gxtEl.outputId, gxtEl.outputName, 
                                          umkreisId, umkreisName);
                }
                else if(gxtEl.typeName == "CIRCUMCIRCLE_CENTER") {
                    board.addCircumcenterMidpoint(gxtEl.defEl[0], gxtEl.defEl[1], 
                                                  gxtEl.defEl[2], gxtEl.outputId, 
                                                  gxtEl.outputName);
                }    
                else if(gxtEl.typeName == "BISECTOR") {
                    board.addAngleBisector(gxtEl.defEl[0], gxtEl.defEl[1], 
                                           gxtEl.defEl[2], gxtEl.outputId, gxtEl.outputName);
                }
                else if(gxtEl.typeName == "MIRROR_LINE") {
                    board.addReflection(gxtEl.defEl[1], gxtEl.defEl[0],
                                        gxtEl.outputId, gxtEl.outputName);
                }
                else if(gxtEl.typeName == "MIRROR_POINT") {
                    // Spaeter: Rotation --> Winkel statt Math.PI
                    board.addRotation(gxtEl.defEl[0], gxtEl.defEl[1], Math.PI,
                                      gxtEl.outputId, gxtEl.outputName);
                }
                else if(gxtEl.typeName == "PARALLELOGRAM_POINT") {
                    if (gxtEl.defEl.length==2) { // line, point
                        board.addParallelPoint(JXG.GetReferenceFromParameter(gxtEl.defEl[0]).point1,
                                               JXG.GetReferenceFromParameter(gxtEl.defEl[0]).point2, 
                                               gxtEl.defEl[1],
                                               gxtEl.outputId, gxtEl.outputName);
                    } else {  // point, point, point
                        board.addParallelPoint(gxtEl.defEl[0], gxtEl.defEl[1], gxtEl.defEl[2],
                                           gxtEl.outputId, gxtEl.outputName);
                    }
                }
                else if(gxtEl.typeName == "SECTOR") {
                    JXG.GeonextReader.parseImage(board,Data.getElementsByTagName('image')[0],'sectors');
                    var defEl = [];
                    var defElN = [];
                    var defElV = [];
                    var defElT = [];
                    var defElD = [];
                    var defElDr = [];                    
                    var defElSW = [];
                    var defElColStr = [];
                    var defElHColStr = [];
                    var defElColF = [];
                    var defElColL = [];    
                    for(var i=0; i<Data.getElementsByTagName('output').length; i++) {
                        defEl[i] = Data.getElementsByTagName('output')[i].getElementsByTagName('id')[0].firstChild.data;
                        defEl[i] = JXG.GeonextReader.changeOriginIds(board,defEl[i]);
                        defElN[i] = Data.getElementsByTagName('output')[i].getElementsByTagName('name')[0];  
                        defElV[i] = Data.getElementsByTagName('output')[i].getElementsByTagName('visible')[0].firstChild.data;
                        defElT[i] = Data.getElementsByTagName('output')[i].getElementsByTagName('trace')[0].firstChild.data;
                        defElD[i] = Data.getElementsByTagName('output')[i].getElementsByTagName('dash')[0].firstChild.data;
                        defElDr[i] = Data.getElementsByTagName('output')[i].getElementsByTagName('draft')[0].firstChild.data;                        
                        defElSW[i] = Data.getElementsByTagName('output')[i].getElementsByTagName('strokewidth')[0].firstChild.data;
                        var tmp = Data.getElementsByTagName('output')[i].getElementsByTagName('color')[0];
                        defElColStr[i] = tmp.getElementsByTagName('stroke')[0].firstChild.data;
                        defElHColStr[i] = tmp.getElementsByTagName('lighting')[0].firstChild.data;
                        defElColF[i] = tmp.getElementsByTagName('fill')[0].firstChild.data;
                        defElColL[i] = tmp.getElementsByTagName('label')[0].firstChild.data;
                    }                          
                    var el = new JXG.Sector(board, gxtEl.defEl[0], 
                                           gxtEl.defEl[1], gxtEl.defEl[2], 
                                           [defEl[0], defEl[1], defEl[2], defEl[3]],
                                           [defElN[0].firstChild.data, defElN[1].firstChild.data, defElN[2].firstChild.data, 
                                               defElN[3].firstChild.data], 
                                           gxtEl.id);   
                    // Sector hat keine eigenen Eigenschaften
                    //el.setProperty('fillColor:'+defElColF[0],'highlightFillColor:'+defElColF[0], 'strokeColor:none');
                    /* Eigenschaften des Kreisbogens */
                    var arcId = defEl[0];
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
                    var pointId = defEl[1];
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
                    var line1Id = defEl[2];
                    var tmp = Data.getElementsByTagName('output')[2].getElementsByTagName('straight')[0];
                    gxtEl.straightFirst = tmp.getElementsByTagName('first')[0].firstChild.data;
                    gxtEl.straightLast = tmp.getElementsByTagName('last')[0].firstChild.data;                                   
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
                    var line2Id = defEl[3];
                    tmp = Data.getElementsByTagName('output')[3].getElementsByTagName('straight')[0];
                    gxtEl.straightFirst = tmp.getElementsByTagName('first')[0].firstChild.data;
                    gxtEl.straightLast = tmp.getElementsByTagName('last')[0].firstChild.data;                 
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
                    var defEl = [];
                    var defElN = [];
                    var defElV = [];
                    var defElT = [];
                    var defElD = [];
                    var defElDr = [];                    
                    var defElSW = [];
                    var defElColStr = [];
                    var defElHColStr = [];
                    var defElColF = [];
                    var defElColL = [];                    
                    for(var i=0; i<Data.getElementsByTagName('output').length; i++) {
                        defEl[i] = Data.getElementsByTagName('output')[i].getElementsByTagName('id')[0].firstChild.data;
                        defEl[i] = JXG.GeonextReader.changeOriginIds(board,defEl[i]);
                        defElN[i] = Data.getElementsByTagName('output')[i].getElementsByTagName('name')[0];  
                        defElV[i] = Data.getElementsByTagName('output')[i].getElementsByTagName('visible')[0].firstChild.data;
                        defElT[i] = Data.getElementsByTagName('output')[i].getElementsByTagName('trace')[0].firstChild.data;
                        defElD[i] = Data.getElementsByTagName('output')[i].getElementsByTagName('dash')[0].firstChild.data;
                        defElDr[i] = Data.getElementsByTagName('output')[i].getElementsByTagName('draft')[0].firstChild.data;
                        defElSW[i] = Data.getElementsByTagName('output')[i].getElementsByTagName('strokewidth')[0].firstChild.data;
                        var tmp = Data.getElementsByTagName('output')[i].getElementsByTagName('color')[0];
                        defElColStr[i] = tmp.getElementsByTagName('stroke')[0].firstChild.data;
                        defElHColStr[i] = tmp.getElementsByTagName('lighting')[0].firstChild.data;
                        defElColF[i] = tmp.getElementsByTagName('fill')[0].firstChild.data;
                        defElColL[i] = tmp.getElementsByTagName('label')[0].firstChild.data;
                    }
                    gxtEl.outputFixed = Data.getElementsByTagName('output')[0].getElementsByTagName('fix')[0].firstChild.data;
                    gxtEl.outputStyle = Data.getElementsByTagName('output')[0].getElementsByTagName('style')[0].firstChild.data;         
                    board.addPerpendicular(gxtEl.defEl[1], gxtEl.defEl[0], 
                                           defEl[1], defElN[1].firstChild.data, defEl[0], 
                                           defElN[0].firstChild.data);
                    /* Eigenschaften des Lotfusspunkts */
                    var pid = defEl[0];
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
                    var lid = defEl[1];
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
                    var defEl = [];
                    var defElN = [];
                    var defElV = [];
                    var defElT = [];
                    var defElD = [];
                    var defElDr = [];
                    var defElSW = [];
                    var defElColStr = [];
                    var defElHColStr = [];
                    var defElColF = [];
                    var defElColL = [];                    
                    for(var i=0; i<Data.getElementsByTagName('output').length; i++) {
                        defEl[i] = Data.getElementsByTagName('output')[i].getElementsByTagName('id')[0].firstChild.data;
                        defEl[i] = JXG.GeonextReader.changeOriginIds(board,defEl[i]);
                        defElN[i] = Data.getElementsByTagName('output')[i].getElementsByTagName('name')[0];  
                        defElV[i] = Data.getElementsByTagName('output')[i].getElementsByTagName('visible')[0].firstChild.data;
                        defElT[i] = Data.getElementsByTagName('output')[i].getElementsByTagName('trace')[0].firstChild.data;
                        defElD[i] = Data.getElementsByTagName('output')[i].getElementsByTagName('dash')[0].firstChild.data;
                        defElDr[i] = Data.getElementsByTagName('output')[i].getElementsByTagName('draft')[0].firstChild.data;
                        defElSW[i] = Data.getElementsByTagName('output')[i].getElementsByTagName('strokewidth')[0].firstChild.data;
                        var tmp = Data.getElementsByTagName('output')[i].getElementsByTagName('color')[0];
                        defElColStr[i] = tmp.getElementsByTagName('stroke')[0].firstChild.data;
                        defElHColStr[i] = tmp.getElementsByTagName('lighting')[0].firstChild.data;
                        defElColF[i] = tmp.getElementsByTagName('fill')[0].firstChild.data;
                        defElColL[i] = tmp.getElementsByTagName('label')[0].firstChild.data;
                    }
                    gxtEl.outputFixed = Data.getElementsByTagName('output')[1].getElementsByTagName('fix')[0].firstChild.data;
                    gxtEl.outputStyle = Data.getElementsByTagName('output')[1].getElementsByTagName('style')[0].firstChild.data;         
                    board.addArrowParallel(gxtEl.defEl[1], gxtEl.defEl[0], 
                                           defEl[0], defEl[1], defElN[0].firstChild.data,  
                                           defElN[1].firstChild.data);
                    /* Eigenschaften des erzeugten Arrows */
                    var aid = defEl[0];
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
                    var pid = defEl[1];
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
                    board.addPerpendicularPoint(gxtEl.defEl[1], gxtEl.defEl[0],
                                                gxtEl.outputId, gxtEl.outputName);
                }
                else {
                    throw('GEONExT-Element ' + gxtEl.typeName + ' not yet implemented');
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
                    var tmp = Data.getElementsByTagName('output')[0].getElementsByTagName('straight')[0];
                    gxtEl.straightFirst = tmp.getElementsByTagName('first')[0].firstChild.data;
                    gxtEl.straightLast = tmp.getElementsByTagName('last')[0].firstChild.data;                        
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
                    var defEl = [];
                    var defElN = [];
                    var defElV = [];
                    var defElT = [];
                    var defElD = [];
                    var defElDr = [];
                    var defElSW = [];
                    var defElColStr = [];
                    var defElHColStr = [];
                    var defElColF = [];
                    var defElColL = [];                    
                    for(var i=0; i<Data.getElementsByTagName('output').length; i++) {
                        defEl[i] = Data.getElementsByTagName('output')[i].getElementsByTagName('id')[0].firstChild.data;
                        defEl[i] = JXG.GeonextReader.changeOriginIds(board,defEl[i]);
                        defElN[i] = Data.getElementsByTagName('output')[i].getElementsByTagName('name')[0];  
                        defElV[i] = Data.getElementsByTagName('output')[i].getElementsByTagName('visible')[0].firstChild.data;
                        defElT[i] = Data.getElementsByTagName('output')[i].getElementsByTagName('trace')[0].firstChild.data;
                        defElD[i] = Data.getElementsByTagName('output')[i].getElementsByTagName('dash')[0].firstChild.data;
                        defElDr[i] = Data.getElementsByTagName('output')[i].getElementsByTagName('draft')[0].firstChild.data;
                        defElSW[i] = Data.getElementsByTagName('output')[i].getElementsByTagName('strokewidth')[0].firstChild.data;
                        var tmp = Data.getElementsByTagName('output')[i].getElementsByTagName('color')[0];
                        defElColStr[i] = tmp.getElementsByTagName('stroke')[0].firstChild.data;
                        defElHColStr[i] = tmp.getElementsByTagName('lighting')[0].firstChild.data;
                        defElColF[i] = tmp.getElementsByTagName('fill')[0].firstChild.data;
                        defElColL[i] = tmp.getElementsByTagName('label')[0].firstChild.data;
                    }
                    gxtEl.outputFixed = Data.getElementsByTagName('output')[0].getElementsByTagName('fix')[0].firstChild.data;
                    gxtEl.outputStyle = Data.getElementsByTagName('output')[0].getElementsByTagName('style')[0].firstChild.data;         
                    /* Eigenschaften des Umkreismittelpunkts */
                    var pid = defEl[0];
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
                    var cid = defEl[1];
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
                for(var i=0; i<Data.getElementsByTagName('data')[0].getElementsByTagName('vertex').length; i++) {
                    gxtEl.dataVertex[i] = Data.getElementsByTagName('data')[0].getElementsByTagName('vertex')[i].firstChild.data;
                    gxtEl.dataVertex[i] = JXG.GeonextReader.changeOriginIds(board,gxtEl.dataVertex[i]);
                }
                gxtEl.border = [];
                for(var i=0; i<Data.getElementsByTagName('border').length; i++) {
                    gxtEl.border[i] = {};
                    var tmp = Data.getElementsByTagName('border')[i];
                    gxtEl.border[i].id = tmp.getElementsByTagName('id')[0].firstChild.data;
                    gxtEl.border[i].name = tmp.getElementsByTagName('name')[0].firstChild.data;
                    gxtEl.border[i].straightFirst = 
                        tmp.getElementsByTagName('straight')[0].getElementsByTagName('first')[0].firstChild.data;
                    gxtEl.border[i].straightLast = 
                        tmp.getElementsByTagName('straight')[0].getElementsByTagName('last')[0].firstChild.data;
                    gxtEl.border[i].straightFirst = (gxtEl.border[i].straightFirst=='false') ? false : true;
                    gxtEl.border[i].straightLast = (gxtEl.border[i].straightLast=='false') ? false : true;
                    gxtEl.border[i].strokewidth = tmp.getElementsByTagName('strokewidth')[0].firstChild.data;   
                    gxtEl.border[i].dash = tmp.getElementsByTagName('dash')[0].firstChild.data; 
                    gxtEl.border[i].visible = tmp.getElementsByTagName('visible')[0].firstChild.data;                    
                    gxtEl.border[i].draft = tmp.getElementsByTagName('draft')[0].firstChild.data;      
                    gxtEl.border[i].trace = tmp.getElementsByTagName('trace')[0].firstChild.data;  
                    gxtEl.border[i].colorStroke = 
                        tmp.getElementsByTagName('color')[0].getElementsByTagName('stroke')[0].firstChild.data;
                    gxtEl.border[i].highlightStrokeColor = 
                        tmp.getElementsByTagName('color')[0].getElementsByTagName('lighting')[0].firstChild.data;
                    gxtEl.border[i].colorFill = 
                        tmp.getElementsByTagName('color')[0].getElementsByTagName('fill')[0].firstChild.data;
                    gxtEl.border[i].colorLabel = 
                        tmp.getElementsByTagName('color')[0].getElementsByTagName('label')[0].firstChild.data;
                    gxtEl.border[i].colorDraft = 
                        tmp.getElementsByTagName('color')[0].getElementsByTagName('draft')[0].firstChild.data;
                }
                JXG.GeonextReader.parseImage(board,Data.getElementsByTagName('image')[0],'polygone');
                var p = new JXG.Polygon(board, gxtEl.dataVertex, gxtEl.border, gxtEl.id, gxtEl.name);
                p.setProperty('strokeColor:'+gxtEl.colorStroke,'strokeWidth:'+gxtEl.strokewidth,
                              'fillColor:'+gxtEl.colorFill,'highlightStrokeColor:'+gxtEl.highlightStrokeColor,
                              'highlightFillColor:'+gxtEl.colorFill,
                              'visible:'+gxtEl.visible,'draft:'+gxtEl.draft,'trace:'+gxtEl.trace);  
                for(i=0; i<p.borders.length; i++) { 
                    p.borders[i].setStraight(gxtEl.border[i].straightFirst, gxtEl.border[i].straightLast);
                    p.borders[i].setProperty('strokeColor:'+gxtEl.border[i].colorStroke,
                                             'strokeWidth:'+gxtEl.border[i].strokewidth,
                                             'fillColor:'+gxtEl.border[i].colorFill,
                                             'highlightStrokeColor:'+gxtEl.border[i].highlightStrokeColor,
                                             'highlightFillColor:'+gxtEl.border[i].colorFill,
                                             'visible:'+gxtEl.border[i].visible,
                                             'dash:'+gxtEl.border[i].dash,
                                             'draft:'+gxtEl.border[i].draft,'trace:'+gxtEl.border[i].trace);                          
                }   
                JXG.GeonextReader.printDebugMessage('debug',gxtEl,Data.nodeName,'OK');
                break;
            case "graph":
                gxtEl = JXG.GeonextReader.colorProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);
                gxtEl.funct = Data.getElementsByTagName('data')[0].getElementsByTagName('function')[0].firstChild.data;
                JXG.GeonextReader.parseImage(board,Data.getElementsByTagName('image')[0],'graphs');
                var g = new JXG.Curve(board, ['x','x',gxtEl.funct], gxtEl.id, gxtEl.name);
                JXG.GeonextReader.printDebugMessage('debug',gxtEl,Data.nodeName,'OK');
                /*
                 * Ignore fillcolor attribute
                 * g.setProperty('strokeColor:'+gxtEl.colorStroke,'strokeWidth:'+gxtEl.strokewidth,'fillColor:'+gxtEl.colorFill,
                              'highlightStrokeColor:'+gxtEl.highlightStrokeColor);*/
                  g.setProperty('strokeColor:'+gxtEl.colorStroke,'strokeWidth:'+gxtEl.strokewidth,'fillColor:none',
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
                var a = new JXG.Line(board, gxtEl.first, gxtEl.last, gxtEl.id, gxtEl.name);
                a.setProperty('strokeColor:'+gxtEl.colorStroke,'strokeWidth:'+gxtEl.strokewidth,
                              'fillColor:'+gxtEl.colorFill,'highlightStrokeColor:'+gxtEl.highlightStrokeColor,
                              'highlightFillColor:'+gxtEl.colorFill,
                              'visible:'+gxtEl.visible, 'dash:'+gxtEl.dash, 'draft:'+gxtEl.draft);
                a.setStraight(false,false);                              
                a.setArrow(false,true);
                a.traced = (gxtEl.trace=='false') ? false : true;                         
                JXG.GeonextReader.printDebugMessage('debug',a,Data.nodeName,'OK');
                break;
            case "arc":
                gxtEl = JXG.GeonextReader.colorProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.visualProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.boardProperties(gxtEl, Data);        
                gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data, 'data');
                
                gxtEl.firstArrow = Data.getElementsByTagName('firstarrow')[0].firstChild.data;
                gxtEl.lastArrow = Data.getElementsByTagName('lastarrow')[0].firstChild.data;
                JXG.GeonextReader.parseImage(board,Data.getElementsByTagName('image')[0],'arcs');
                gxtEl.midpoint = JXG.GeonextReader.changeOriginIds(board,gxtEl.midpoint);
                gxtEl.angle = JXG.GeonextReader.changeOriginIds(board,gxtEl.angle);
                gxtEl.radius = JXG.GeonextReader.changeOriginIds(board,gxtEl.radius);
                var a = new JXG.Arc(board, gxtEl.midpoint, gxtEl.radius, gxtEl.angle, 
                                gxtEl.id, gxtEl.name);
                a.setProperty('strokeColor:'+gxtEl.colorStroke,'strokeWidth:'+gxtEl.strokewidth,
                              'fillColor:'+gxtEl.colorFill,'highlightStrokeColor:'+gxtEl.highlightStrokeColor,
                              'highlightFillColor:'+gxtEl.colorFill,
                              'visible:'+gxtEl.visible, 'dash:'+gxtEl.dash, 'draft:'+gxtEl.draft);
                a.traced = (gxtEl.trace=='false') ? false : true;
                gxtEl.firstArrow = (gxtEl.firstArrow=='false') ? false : true;
                gxtEl.lastArrow = (gxtEl.lastArrow=='false') ? false : true;     
                a.setArrow(gxtEl.firstArrow,gxtEl.lastArrow);
                JXG.GeonextReader.printDebugMessage('debug',a,Data.nodeName,'OK');
                break;
            case "angle":
                gxtEl = JXG.GeonextReader.boardProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.colorProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.visualProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.readNodes(gxtEl, Data, 'data');
                gxtEl.txt = JXG.GeonextReader.subtreeToString(Data.getElementsByTagName('text')[0]);
                var a = new JXG.Angle(board, gxtEl.first, gxtEl.middle, gxtEl.last, gxtEl.radius, gxtEl.txt, gxtEl.id, gxtEl.name);
                a.setProperty('strokeColor:'+gxtEl.colorStroke,'strokeWidth:'+gxtEl.strokewidth,
                              'fillColor:'+gxtEl.colorFill,'highlightStrokeColor:'+gxtEl.highlightStrokeColor,
                              'highlightFillColor:'+gxtEl.colorFill,
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
                var c = new JXG.Text(board, gxtEl.mpStr, gxtEl.parent, [gxtEl.x, gxtEl.y], gxtEl.id, gxtEl.name, gxtEl.autodigits);
                c.setProperty('labelColor:'+gxtEl.colorLabel);
                if(gxtEl.visible == "false") {
                    c.hideElement();
                } 
                break;
            case 'parametercurve':
                gxtEl = JXG.GeonextReader.colorProperties(gxtEl, Data);
                gxtEl = JXG.GeonextReader.firstLevelProperties(gxtEl, Data);
                gxtEl.functionx = Data.getElementsByTagName('functionx')[0].firstChild.data;
                gxtEl.functiony = Data.getElementsByTagName('functiony')[0].firstChild.data;
                gxtEl.min = Data.getElementsByTagName('min')[0].firstChild.data;
                gxtEl.max = Data.getElementsByTagName('max')[0].firstChild.data;
                var g = new JXG.Curve(board, ['t',gxtEl.functionx,gxtEl.functiony,gxtEl.min,gxtEl.max], gxtEl.id, gxtEl.name);
                g.setProperty('strokeColor:'+gxtEl.colorStroke,'strokeWidth:'+gxtEl.strokewidth,'fillColor:none',
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
                for(var i=0; i<Data.getElementsByTagName('data')[0].getElementsByTagName('member').length; i++) {
                    gxtEl.members[i] = Data.getElementsByTagName('data')[0].getElementsByTagName('member')[i].firstChild.data;
                    gxtEl.members[i] = JXG.GeonextReader.changeOriginIds(board,gxtEl.members[i]);
                }
                var g = new JXG.Group(board, gxtEl.id, gxtEl.name, gxtEl.members);
                JXG.GeonextReader.printDebugMessage('debug',gxtEl,Data.nodeName,'OK');
                break;
            default:
                if (Data.nodeName!="#text") {
                    //$('debug').innerHTML += "* <b>Err:</b> " + Data.nodeName + " not yet implemented <br>\n";
                }
        }
        delete(gxtEl);
    })(s);
    board.addConditions(boardTmp.conditions);
};

this.decodeString = function(str) {
    if (str.indexOf("<GEONEXT>")<0){
        var unz = (new JXG.Gunzip(Base64.decodeAsArray(str))).unzip();
        if (unz=="")
            return str;
        else
            return unz;
    } else {
        return str;
    }
};

this.prepareString = function(fileStr){
    if (fileStr.indexOf('GEONEXT')<0) {
        fileStr = JXG.GeonextReader.decodeString(fileStr);  // Base64 decoding
    }
    // Hacks to enable not well formed XML. Will be redone in Algebra.geonext2JS and Board.addConditions
    fileStr = JXG.GeonextReader.fixXML(fileStr);
    return fileStr;
};

this.fixXML = function(str) {
   var arr = ["active","angle","animate","animated","arc","area","arrow","author","autodigits","axis","back","background","board","border","bottom","buttonsize","cas","circle","color","comment","composition","condition","conditions","content","continuous","control","coord","coordinates","cross","cs","dash","data","description","digits","direction","draft","editable","elements","event","file","fill","first","firstarrow","fix","fontsize","free","full","function","functionx","functiony","GEONEXT","graph","grid","group","height","id","image","info","information","input","intersection","item","jsf","label","last","lastarrow","left","lefttoolbar","lighting","line","loop","max","maximized","member","middle","midpoint","min","modifier","modus","mp","mpx","multi","name","onpolygon","order","origin","output","overline","parametercurve","parent","point","pointsnap","polygon","position","radius","radiusnum","radiusvalue","right","section","selectedlefttoolbar","showconstruction","showcoord","showinfo","showunit","showx","showy","size","slider","snap","speed","src","start","stop","straight","stroke","strokewidth","style","term","text","top","trace","tracecurve","type","unit","value","VERSION","vertex","viewport","visible","width","wot","x","xooy","xval","y","yval","zoom"];

    // First, we convert all < to &lt; and > to &gt;
    str = JXG.escapeHTML(str);
    // Second, we convert all GEONExT tags of the form &lt;tag&gt; back to <tag>
    var list = arr.join('|');
    var regex = '\&lt;(/?('+list+'))\&gt;';
    var expr = new RegExp(regex,'g');
    str = str.replace(expr,'<$1>');

    str = str.replace(/(<content>.*)<arc>(.*<\/content>)/g,'$1&lt;arc&gt;$2');
    str = str.replace(/(<mp>.*)<arc>(.*<\/mpx>)/g,'$1&lt;arc&gt;$2');
    str = str.replace(/(<mpx>.*)<arc>(.*<\/mpx>)/g,'$1&lt;arc&gt;$2');
    return str;
};

}; // end: GeonextReader()