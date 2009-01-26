JXG.GeogebraReader = new function() {

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
    // gxtEl.colorStroke = Data.getElementsByTagName('color')[0].getElementsByTagName('stroke')[0].firstChild.data;
    // gxtEl.highlightStrokeColor = Data.getElementsByTagName('color')[0].getElementsByTagName('lighting')[0].firstChild.data;
    // gxtEl.colorFill = Data.getElementsByTagName('color')[0].getElementsByTagName('fill')[0].firstChild.data;
    // gxtEl.colorLabel = Data.getElementsByTagName('color')[0].getElementsByTagName('label')[0].firstChild.data;
    // gxtEl.colorDraft = Data.getElementsByTagName('color')[0].getElementsByTagName('draft')[0].firstChild.data;

  // gxtEl.strokeWidth = Data.getElementsByTagName("pointSize")[0].attributes["val"].value;
  gxtEl.colorR = Data.getElementsByTagName("objColor")[0].attributes["r"].value;
  gxtEl.colorG = Data.getElementsByTagName("objColor")[0].attributes["g"].value;
  gxtEl.colorB = Data.getElementsByTagName("objColor")[0].attributes["b"].value;
  gxtEl.colorA = Data.getElementsByTagName("objColor")[0].attributes["alpha"].value;
  return gxtEl;
}; 

this.firstLevelProperties = function(gxtEl, Data) {
    var arr = Data.childNodes;
    $R(0,arr.length-1).each(function(n) {
        if (arr[n].firstChild!=null && arr[n].nodeName!='data' && arr[n].nodeName!='straight') {
            var key = arr[n].nodeName;
            gxtEl[key] = arr[n].firstChild.data;
        }
    });
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
        gxtEl.label = '';
    } 
    else { 
        gxtEl.label = Data.getElementsByTagName('name')[0].firstChild.data; 
    }
    gxtEl.id = Data.getElementsByTagName('id')[0].firstChild.data;
    
    return gxtEl;
}; 

this.visualProperties = function(gxtEl, Data) {
  gxtEl.visible = Data.getElementsByTagName("show")[0].attributes["object"].value;
  gxtEl.visibleLabel = Data.getElementsByTagName("show")[0].attributes["label"].value;
  gxtEl.labelX = (Data.getElementsByTagName("labelOffset")[0]) ? Data.getElementsByTagName("labelOffset")[0].attributes["x"].value : false;
  gxtEl.labelY = (Data.getElementsByTagName("labelOffset")[0]) ? Data.getElementsByTagName("labelOffset")[0].attributes["y"].value : false;
  gxtEl.trace =  (Data.getElementsByTagName("trace")[0]) ? Data.getElementsByTagName("trace")[0].attributes["val"].value : false;
  gxtEl.fixed = (Data.getElementsByTagName('fix')[0]) ? Data.getElementsByTagName('fix')[0].attributes["val"].value : false;
  gxtEl.x = (Data.getElementsByTagName("coords")[0]) ? Data.getElementsByTagName("coords")[0].attributes["x"].value : Data.getElementsByTagName("startPoint")[0].attributes["x"].value;
  gxtEl.y = (Data.getElementsByTagName("coords")[0]) ? Data.getElementsByTagName("coords")[0].attributes["y"].value : Data.getElementsByTagName("startPoint")[0].attributes["y"].value;
  gxtEl.z = (Data.getElementsByTagName("coords")[0]) ? Data.getElementsByTagName("coords")[0].attributes["z"].value : Data.getElementsByTagName("startPoint")[0].attributes["z"].value;
  return gxtEl;
};

this.readNodes = function(gxtEl, Data, nodeType, prefix) {
    // gxtEl.x = Data.getElementsByTagName("coords")[0].attributes["x"].value;
    // gxtEl.y = Data.getElementsByTagName("coords")[0].attributes["y"].value;
    // gxtEl.z = Data.getElementsByTagName("coords")[0].attributes["z"].value;
    // gxtEl.coordsStyle = Data.getElementsByTagName("coordStyle")[0].attributes["style"].value;

    var key;
    var arr = Data.getElementsByTagName(nodeType)[0].childNodes;
    $R(0,arr.length-1).each(function(n) {
        if (arr[n].firstChild!=null) {
            if (prefix!=null) {
                key = prefix+arr[n].nodeName.capitalize();
            } else {
                key = arr[n].nodeName;
            }
            gxtEl[key] = arr[n].firstChild.data;
        }
    });
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

this.readConditions = function(node,board) {
    board.conditions = '';
    if (node!=null) {
        for(var i=0; i<node.getElementsByTagName('data').length; i++) {
            var s;
            var e;
            var ob = node.getElementsByTagName('data')[i];
            s = JXG.GeogebraReader.subtreeToString(ob);
            board.conditions += s;
        }
    }
};

/**
 * Searching for an element in the geogebra tree
 * @param {XMLTree} tree expects the content of the parsed geogebra file returned by function parseFF/parseIE
 * @param {String} the name of the element to search for
 * @return {Object} object with according label
 */
this.getElement = function(tree, name) {
  for(var i=0; i<tree.getElementsByTagName("construction").length; i++)
    for(var j=0; j<tree.getElementsByTagName("construction")[i].getElementsByTagName("element").length; j++) {
      var Data = tree.getElementsByTagName("construction")[i].getElementsByTagName("element")[j];
      if(name == Data.attributes["label"].value) {
        // $('debug').innerHTML += "* <b>Found:</b> "+ Data.attributes["label"].value +": element["+ j +"], Data: "+ Data +"<br>\n";
        return Data;
      }
    }
};

/**
 * Searching for an element in the geogebra tree
 * @param {XMLTree} tree expects the content of the parsed geogebra file returned by function parseFF/parseIE
 * @param {Object} board object
 */
this.writeBoard = function(tree, board) {
  var boardData = tree.getElementsByTagName("euclidianView")[0];

  board.origin = {};
  board.origin.usrCoords = [1, 0, 0];
  board.origin.scrCoords = [1, 1*boardData.getElementsByTagName("coordSystem")[0].attributes["xZero"].value, 1*boardData.getElementsByTagName("coordSystem")[0].attributes["yZero"].value];
  // board.zoomX = 1*boardData.getElementsByTagName("coordSystem")[0].attributes["scale"].value;
  // board.zoomY = 1*boardData.getElementsByTagName("coordSystem")[0].attributes["yscale"].value;
  board.unitX = (boardData.getElementsByTagName("coordSystem")[0].attributes["scale"]) ? 1*boardData.getElementsByTagName("coordSystem")[0].attributes["scale"].value : 1;
  board.unitY = (boardData.getElementsByTagName("coordSystem")[0].attributes["yscale"]) ? 1*boardData.getElementsByTagName("coordSystem")[0].attributes["yscale"].value : 1;
  board.fontSize = 1*tree.getElementsByTagName("gui")[0].getElementsByTagName("font")[0].attributes["size"].value;
  // board.geonextCompatibilityMode = true;

  // delete(JXG.JSXGraph.boards[board.id]);
  // board.id = boardTmp.id;

  JXG.JSXGraph.boards[board.id] = board;
  board.initGeonextBoard();
  // Update of properties during update() is not necessary in GEONExT files
  board.renderer.enhancedRendering = false;

  // Eigenschaften der Zeichenflaeche setzen
  // das Grid zeichnen
  // auf Kaestchen springen?
  var snap = (boardData.getElementsByTagName('evSettings')[0].attributes["pointCapturing"].value == "true") ? board.snapToGrid = true : null;
  // var gridX = (boardData.getElementsByTagName('evSettings')[0].attributes["grid"]) ? board.gridX = boardData.getElementsByTagName('grid')[1].getElementsByTagName('x')[0].firstChild.data*1 : null;
  // var gridY = (boardData.getElementsByTagName('grid')[1].getElementsByTagName('y')[0].firstChild.data) ? board.gridY = boardData.getElementsByTagName('grid')[1].getElementsByTagName('y')[0].firstChild.data*1 : null;
  // board.calculateSnapSizes();
  // var gridDash = boardData.getElementsByTagName('grid')[1].getElementsByTagName('dash')[0].firstChild.data;
  // board.gridDash = board.algebra.str2Bool(gridDash);
  // var gridColor = boardData.getElementsByTagName('grid')[1].getElementsByTagName('color')[0].firstChild.data;
  // var gridOpacity;
  // if (gridColor.length=='9' && gridColor.substr(0,1)=='#') {
  //     gridOpacity = gridColor.substr(7,2);                
  //     gridColor = gridColor.substr(0,7);
  // }
  // else { 
  //     gridOpacity = 'FF';
  // }
  // board.gridColor = gridColor;
  // board.gridOpacity = gridOpacity;

  var grid = (boardData.getElementsByTagName('evSettings')[0].attributes["grid"].value == "true") ? board.renderer.drawGrid(board) : null;
  
  if(boardData.getElementsByTagName('evSettings')[0].attributes["axes"].value == "true") {
      var axisX = board.createElement('axis', [[0, 0], [1, 0]]);
      // axisX.setProperty('strokeColor:'+axisX.visProp['strokeColor'],'strokeWidth:'+axisX.visProp['strokeWidth'],
      //                   'fillColor:none','highlightStrokeColor:'+axisX.visProp['highlightStrokeColor'], 
      //                   'highlightFillColor:none', 'visible:true');
      var axisY = board.createElement('axis', [[0, 0], [0, 1]]);
      // axisY.setProperty('strokeColor:'+axisY.visProp['strokeColor'],'strokeWidth:'+axisY.visProp['strokeWidth'],
      //                   'fillColor:none','highlightStrokeColor:'+axisY.visProp['highlightStrokeColor'], 
      //                   'highlightFillColor:none', 'visible:true');
  }
  // var bgcolorR = boardData.getElementsByTagName('bgColor')[0].attributes["r"];
  // var bgcolorG = boardData.getElementsByTagName('bgColor')[0].attributes["g"];
  // var bgcolorR = boardData.getElementsByTagName('bgColor')[0].attributes["b"];
  // var opacity = 1;
  // $(board.container).style.backgroundColor = bgcolor;
};


/**
 * Searching for an element in the geogebra tree
 * @param {XMLTree} tree expects the content of the parsed geogebra file returned by function parseFF/parseIE
 * @param {Object} board object
 * @param {Object} gxtEl element of which attributes are to parse
 * @param {Array} input list of all input elements
 * @param {String} typeName output construction method
 * @param {String} text text of expression to write
 */
this.writeElement = function(tree, board, element, input, typeName, text) {
  var gxtEl = {};
  gxtEl.type = element.attributes["type"].value;
  gxtEl.label = element.attributes["label"].value;

if(!typeName) {
  // Input-Elemente
  switch(gxtEl.type.toLowerCase()) {
    case "point":
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element);
      gxtEl = JXG.GeogebraReader.colorProperties(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(gxtEl, element);

      gxtEl.pointSize = (element.getElementsByTagName('pointSize')[0]) ? element.getElementsByTagName('pointSize')[0].attributes["val"].value : 0;
      try {
          p = board.createElement('point',[gxtEl.x, gxtEl.y, gxtEl.z], {name:gxtEl.label,style:gxtEl.pointSize});
          // p.setProperty('strokeColor:'+gxtEl.colorStroke,'strokeWidth:'+gxtEl.strokewidth,
          //               'fillColor:'+gxtEl.colorStroke,'highlightStrokeColor:'+gxtEl.highlightStrokeColor,
          //               'highlightFillColor:'+gxtEl.highlightStrokeColor,'labelColor:'+gxtEl.colorLabel,
          //               'visible:'+gxtEl.visible,'fixed:'+gxtEl.fixed,'draft:'+gxtEl.draft);
          // p.setStyle(1*gxtEl.style);
          // p.traced = (gxtEl.trace=='false') ? false : true; 
          $('debug').innerHTML += "* <b>Point:</b> " + gxtEl.label + "<br>\n";
          return true;
      } catch(e) {
          $('debug').innerHTML += "* <b>Err:</b> Point " + gxtEl.label + " " + gxtEl.id + "<br>\n";
          return false;
      }
    break;
    // case "segment":
    // break;
    // case "line":
    // break;
    case "angle":
    break;
    case 'numeric':
    break;
    case 'function':
    break;
    case 'conic':
    break;
    case 'vector':
    break;
    case 'circlepart':
    break;
    case 'image':
    break;
    case 'text':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element);
      gxtEl = JXG.GeogebraReader.colorProperties(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(gxtEl, element);
      try {
        $('debug').innerHTML += "* <b>Text:</b> "+ gxtEl.label +"<br>\n";
        l =  board.createElement('text', text, [gxtEl.x, gxtEl.y, gxtEl.z], {name:gxtEl.label});
        return true;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Text " + gxtEl.label + " " + gxtEl.id + "<br>\n";
        return false;
      }
    break;
    default:
      return false;
   break;
  };
} else {
  // Output-Elemente
  switch(typeName.toLowerCase()) {
    // case 'point':
    // break;
    case 'segment':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element);
      gxtEl = JXG.GeogebraReader.colorProperties(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(gxtEl, element);
      try {
        $('debug').innerHTML += "* <b>Segment:</b> ("+ gxtEl.label +") First: " + input[0] + ", Last: " + input[1] + "<br>\n";
        l =  board.createElement('line', input, {strokeColor:'#00ff00',strokeWidth:2});
        l.setStraight(false, false);
        return true;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Segment " + gxtEl.label + " " + gxtEl.id + "<br>\n";
        return false;
      }
    break;
    case 'line':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element);
      gxtEl = JXG.GeogebraReader.colorProperties(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(gxtEl, element);
      try {
        $('debug').innerHTML += "* <b>Line:</b> ("+ gxtEl.label +") First: " + input[0] + ", Last: " + input[1] + "<br>\n";
        l = board.createElement('line', input, {strokeColor:'#00ff00',strokeWidth:2});
        return true;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Line " + gxtEl.label + " " + gxtEl.id + "<br>\n";
        return false;
      }
    break;
    case "orthogonalline":
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element);
      gxtEl = JXG.GeogebraReader.colorProperties(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(gxtEl, element);
      try {
        $('debug').innerHTML += "* <b>Orthogonalline:</b> First: " + input[0] + ", Last: " + input[1] + "<br>\n";
        l =  board.createElement('line', [input[0],input[1]] , {strokeColor:'#00ff00',strokeWidth:2});
        l.setStraight(false, false);
        return true;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Orthogonalline " + gxtEl.label + " " + gxtEl.id + "<br>\n";
        return false;
      }
    break;
    case "polygon":
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element);
      gxtEl = JXG.GeogebraReader.colorProperties(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(gxtEl, element);
      try {
        $('debug').innerHTML += "* <b>Polygon:</b> First: " + input[0] + ", Last: " + input[1] + "<br>\n";
        l =  board.createElement('polygon', input , {strokeColor:'#00ff00',strokeWidth:2});
        l.setStraight(false, false);
        return true;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Polygon " + gxtEl.label + " " + gxtEl.id + "<br>\n";
        return false;
      }
    break;
    case 'ellipse':
    break;
    case 'intersect':
    break;
    case 'linebisector':
    break;
    case 'midpoint':
    break;
    case 'angularbisector':
    break;
    case 'function':
    break;
    case 'numeric':
    break;
    case 'vector':
    break;
    case 'unitvector':
    break;
    case 'distance':
    break;
    case 'tangent':
    break;
    case 'slope':
    break;
    case 'corner':
    break;
    case 'mirror':
    break;
    case 'integral':
    break;
    case 'circle':
    break;
    case 'radius':
    break;
    case 'polar':
    break;
    case 'derivative':
    break;
    case 'root':
    break;
    case 'conic':
    break;
    case 'center':
    break;
    case 'extremum':
    break;
    case 'turningpoint':
    break;
    case 'arc':
    break;
    case 'angle':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element);
      gxtEl = JXG.GeogebraReader.colorProperties(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(gxtEl, element);
      try {
        $('debug').innerHTML += "* <b>Angle:</b> First: " + input[0] + ", Middle: " + input[1] + ", Last: " + input[2] + "<br>\n";
        l =  board.createElement('angle', input , {strokeColor:'#00ff00',strokeWidth:2});
        l.setStraight(false, false);
        return true;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Angle " + gxtEl.label + " " + gxtEl.id + "<br>\n";
        return false;
      }
    break;
    case 'semicircle':
    break;
    case 'rotate':
    break;
    case 'uppersum':
    break;
    case 'lowersum':
    break;
    case 'dilate':
    break;
    default:
      return false;
    break;
  };
}
};

/**
 * Reading the elements of a geogebra file
 * @param {XMLTree} tree expects the content of the parsed geonext file returned by function parseFF/parseIE
 * @param {Object} board board object
 */
this.readGeogebra = function(tree, board) {
  JXG.GeogebraReader.writeBoard(tree, board);
    $R(0,tree.getElementsByTagName("construction").length-1).each(function(t) {
      var els = [];
        $R(0,tree.getElementsByTagName("construction")[t].getElementsByTagName("command").length-1).each(function(s) {
            var Data = tree.getElementsByTagName("construction")[t].getElementsByTagName("command")[s];
            var input = [], inputName = [];
            for(var i=0; i<Data.getElementsByTagName("input")[0].attributes.length; i++) {
                var el = Data.getElementsByTagName("input")[0].attributes[i].value;
                input[i] = JXG.GeogebraReader.getElement(tree, el);
                inputName[i] = el;
                // $('debug').innerHTML += "input["+ i +"]: "+ input[i] +"<br/>";
                els[el] = (!els[el]) ? JXG.GeogebraReader.writeElement(tree, board, input[i]) : els[el];
            }

            var output = [];
            for(var i=0; i<Data.getElementsByTagName("output")[0].attributes.length; i++) {
                var el = Data.getElementsByTagName("output")[0].attributes[i].value;
                output[i] = JXG.GeogebraReader.getElement(tree, el);
                // $('debug').innerHTML += "output: "+ output[i] +"<br/>";
                els[el] = (!els[el]) ? JXG.GeogebraReader.writeElement(tree, board, output[i], inputName, Data.attributes["name"].value) : els[el];
            }
        });
        $R(0,tree.getElementsByTagName("construction")[t].getElementsByTagName("expression").length-1).each(function(s) {
            var Data = tree.getElementsByTagName("construction")[t].getElementsByTagName("expression")[s];
            var el = Data.attributes["label"].value;
            var text = Data.attributes["exp"].value;
            var input = JXG.GeogebraReader.getElement(tree, el);
            $('debug').innerHTML += "expression: "+ el +", "+ text +"<br/>";
            els[el] = (!els[el]) ? JXG.GeogebraReader.writeElement(tree, board, input, false, false, text) : els[el];
        });
    });
};

}; // end: GeogebraReader()