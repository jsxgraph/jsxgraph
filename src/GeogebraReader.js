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
this.colorProperties = function(Data, attr) {
  var a = (Data.getElementsByTagName("objColor")[0].attributes["alpha"]) ? 1*Data.getElementsByTagName("objColor")[0].attributes["alpha"].value : 0;
  var r = (Data.getElementsByTagName("objColor")[0].attributes["r"]) ? (1*Data.getElementsByTagName("objColor")[0].attributes["r"].value).toString(16) : 0;
  var g = (Data.getElementsByTagName("objColor")[0].attributes["g"]) ? (1*Data.getElementsByTagName("objColor")[0].attributes["g"].value).toString(16) : 0;
  var b = (Data.getElementsByTagName("objColor")[0].attributes["b"]) ? (1*Data.getElementsByTagName("objColor")[0].attributes["b"].value).toString(16) : 0;
  // gxtEl.colorA = (Data.getElementsByTagName("objColor")[0].attributes["alpha"]) ? 1*Data.getElementsByTagName("objColor")[0].attributes["alpha"].value : 0;
  if (r.length == 1) r = '0' + r;
  if (g.length == 1) g = '0' + g;
  if (b.length == 1) b = '0' + b;

  if(a != 0) {
    attr.fillColor= '#'+ r + g + b;
    attr.fillOpacity= a;
  }
  return attr;
}; 

this.firstLevelProperties = function(gxtEl, Data) {
    var arr = Data.childNodes;
    for(var n=0;n<arr.length;n++) {
        if (arr[n].firstChild!=null && arr[n].nodeName!='data' && arr[n].nodeName!='straight') {
            var key = arr[n].nodeName;
            gxtEl[key] = arr[n].firstChild.data;
        }
    }
    return gxtEl;
}; 

/**
 * Set the board properties of a geonext element.
 * Set active, area, dash, draft and showinfo attributes.
 * @param {Object} gxtEl element of which attributes are to set
 */
this.boardProperties = function(gxtEl, Data, attr) {
  return attr;
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

this.coordinates = function(gxtEl, Data) {
  gxtEl.x = (Data.getElementsByTagName("coords")[0]) ? 1*Data.getElementsByTagName("coords")[0].attributes["x"].value : (Data.getElementsByTagName("startPoint")[0]) ? 1*Data.getElementsByTagName("startPoint")[0].attributes["x"].value: false;
  gxtEl.y = (Data.getElementsByTagName("coords")[0]) ? 1*Data.getElementsByTagName("coords")[0].attributes["y"].value : (Data.getElementsByTagName("startPoint")[0]) ? 1*Data.getElementsByTagName("startPoint")[0].attributes["y"].value: false;
  gxtEl.z = (Data.getElementsByTagName("coords")[0]) ? 1*Data.getElementsByTagName("coords")[0].attributes["z"].value : (Data.getElementsByTagName("startPoint")[0]) ? 1*Data.getElementsByTagName("startPoint")[0].attributes["z"].value: false;
  return gxtEl;
}

this.visualProperties = function(Data, attr) {
  (Data.getElementsByTagName("show")[0].attributes["object"]) ? attr.visible= Data.getElementsByTagName("show")[0].attributes["object"].value: false ;
  (Data.getElementsByTagName("show")[0].attributes["label"]) ? attr.visibleLabel= Data.getElementsByTagName("show")[0].attributes["label"].value : false;
  (Data.getElementsByTagName('pointSize')[0]) ? attr.style= Data.getElementsByTagName('pointSize')[0].attributes["val"].value : false;
  (Data.getElementsByTagName("labelOffset")[0]) ? attr.labelX= 1*Data.getElementsByTagName("labelOffset")[0].attributes["x"].value : false;
  (Data.getElementsByTagName("labelOffset")[0]) ? attr.labelY= 1*Data.getElementsByTagName("labelOffset")[0].attributes["y"].value : false;
  (Data.getElementsByTagName("trace")[0]) ? attr.trace= Data.getElementsByTagName("trace")[0].attributes["val"].value : false;
  (Data.getElementsByTagName('fix')[0]) ? attr.fixed= Data.getElementsByTagName('fix')[0].attributes["val"].value : false;
  return attr;
};

this.readNodes = function(gxtEl, Data, nodeType, prefix) {
    // gxtEl.x = Data.getElementsByTagName("coords")[0].attributes["x"].value;
    // gxtEl.y = Data.getElementsByTagName("coords")[0].attributes["y"].value;
    // gxtEl.z = Data.getElementsByTagName("coords")[0].attributes["z"].value;
    // gxtEl.coordsStyle = Data.getElementsByTagName("coordStyle")[0].attributes["style"].value;

    var key;
    var arr = Data.getElementsByTagName(nodeType)[0].childNodes;
    for (var n=0;n<arr.length;n++) {
        if (arr[n].firstChild!=null) {
            if (prefix!=null) {
                key = prefix+arr[n].nodeName.capitalize();
            } else {
                key = arr[n].nodeName;
            }
            gxtEl[key] = arr[n].firstChild.data;
        }
    }
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
        return Data;
      }
    }
};

/**
 * Searching for an element in the geogebra tree
 * @param {XMLTree} tree expects the content of the parsed geogebra file returned by function parseFF/parseIE
 * @param {Object} board object
 */
this.writeBoard = function(tree, board, registeredElements) {
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

  // board.fullUpdate();

  JXG.JSXGraph.boards[board.id] = board;
  //board.initGeonextBoard();
  // Update of properties during update() is not necessary in GEONExT files
  board.renderer.enhancedRendering = true;

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
      registeredElements["xAxis"] = board.createElement('axis', [[0, 0], [1, 0]], {strokeColor:'black'});
      registeredElements["yAxis"] = board.createElement('axis', [[0, 0], [0, 1]], {strokeColor:'black'});
  }
  return registeredElements;
};

/**
 * Searching for an element in the geogebra tree
 * @param {XMLTree} tree expects the content of the parsed geogebra file returned by function parseFF/parseIE
 * @param {Object} board object
 * @param {Object} gxtEl element whose attributes are to parse
 * @param {Array} input list of all input elements
 * @param {String} typeName output construction method
 * @param {String} text of expression to write
 */
this.writeElement = function(tree, board, output, input, cmd) {
  if(typeof output == 'object' && typeof output.attributes == 'undefined') {
    element = output[0];
  } else {
    element = output;
  }

  var gxtEl = {};
  gxtEl.type = element.attributes["type"].value.toLowerCase();
  gxtEl.label = element.attributes["label"].value;

  var attr = {} // Attributes of geometric elements
  attr.name= gxtEl.label;

  if(typeof cmd != 'undefined' && (gxtEl.type != cmd)) {
	gxtEl.type = cmd;
  }

  $('debug').innerHTML += "<br><b>Konstruiere</b> "+ gxtEl.label +"("+ gxtEl.type +"): <br/>";

  switch(gxtEl.type) {
    case "point":
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      try {
          p = board.createElement('point', [gxtEl.x, gxtEl.y], attr);
          $('debug').innerHTML += "* <b>Point ("+ p.id +"):</b> "+ attr.name + "("+ gxtEl.x +", "+ gxtEl.y +")<br>\n";
          return p;
      } catch(e) {
          $('debug').innerHTML += "* <b>Err:</b> Point " + attr.name +"<br>\n";
          return false;
      }
    break;
    case 'segment':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      try {
        $('debug').innerHTML += "* <b>Segment:</b> ("+ attr.name +") First: " + input[0].name + ", Last: " + input[1].name + "<br>\n";
        attr.straightFirst = false;
        attr.straightLast =  false;
        l = board.createElement('line', input, attr);
        return l;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Segment " + attr.name +" First: " + input[0].name + ", Last: " + input[1].name + "<br>\n";
        return false;
      }
    break;
    case 'line':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

for (var x in attr) {
    $('debug').innerHTML += x+':'+attr[x]+' ';
}    
$('debug').innerHTML += '<br>';

      if(JXG.GetReferenceFromParameter(board, input[1].id).type == 1330925652) var type = 'line'; // Punkt -> Gerade
      else if(JXG.GetReferenceFromParameter(board, input[1].id).type == 1330924622) var type = 'parallel'; // Parallele durch Punkt

      try {
        $('debug').innerHTML += "* <b>Line:</b> ("+ attr.name +") First: " + input[0].id + ", Last: " + input[1].id + "<br>\n";
        l = board.createElement(type, input, attr);
        return l;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Line " + attr.label +"<br>\n";
        return false;
      }
    break;
    case "orthogonalline":
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      try {
        $('debug').innerHTML += "* <b>Orthogonalline:</b> First: " + input[0].id + ", Last: " + input[1].id + "<br>\n";
        l = board.createElement('perpendicular', [input[1], input[0]], attr);
        l.setStraight(false, false);
        return l;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Orthogonalline " + attr.label +"<br>\n";
        return false;
      }
    break;
    case "polygon":
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      try {
        $('debug').innerHTML += "* <b>Polygon:</b> First: " + input[0].name + ", Second: " + input[1].name + ", Third: " + input[2].name + "<br>\n";
		// var border = []
		// for(var i=1; i<output.length; i++) {
		// 	border[i] = "{name: '"+output[i].attributes['label'].value+"'}";
		// }
        // l = board.createElement('polygon', input , {borders: border});
		l = board.createElement('polygon', input, attr);
        return l;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Polygon " + attr.name +"<br>\n";
        return false;
      }
    break;
    case 'intersect':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      try {
        $('debug').innerHTML += "* <b>Intersection:</b> First: " + input[0].name + ", Second: " + input[1].name + "<br>\n";
		// l = board.createElement('intersection', input, attr);
		l = new JXG.Intersection(board, null, input[0], input[1]);
        // l.setStraight(false, false);
        return l;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Intersection " + attr.name +"<br>\n";
        return false;
      }
    break;
    case 'distance':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      try {
        $('debug').innerHTML += "* <b>Distance:</b> First: " + input[0].name + ", Second: " + input[1].name + "<br>\n";
        m = board.createElement('midpoint', input, {visible: 'false'});
        t = board.createElement('text', [function(){return m.X();}, function(){return m.Y();}, function(){
              return "<span style='text-decoration: overline'>"+ input[0].name + input[1].name +"</span> = "
                     + JXG.GetReferenceFromParameter(board, input[0].id).Dist(JXG.GetReferenceFromParameter(board, input[1].id));
                }]);
        return t;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Intersection " + attr.name +"<br>\n";
        return false;
      }
    break;
    case 'rotate':
//TODO: Abhaengigkeit einbauen, BSP: dreheobjektumpunkt --> B' immer abhaengig von A und B
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      try {
        $('debug').innerHTML += "* <b>Rotate:</b> First: " + input[0].name + ", Second: " + input[1].name + "<br>\n";
        attr.type = 'rotate';
        r = board.createElement('transform', [[parseInt(input[1]), input[2]], input[0]], attr);
        return r;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Rotate " + attr.name +"<br>\n";
        return false;
      }
    break;
    case 'mirror':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      if(JXG.GetReferenceFromParameter(board, input[1].id).type == 1330925652) var type = 'mirrorpoint'; // Punktspiegelung
      else if(JXG.GetReferenceFromParameter(board, input[1].id).type == 1330924622) var type = 'reflection'; // Geradenspiegelung

      try {
        $('debug').innerHTML += "* <b>Mirror:</b> First: " + input[0].name + ", Second: " + input[1].name + "<br>\n";
        m = board.createElement(type, [input[1], input[0]], attr);
        return m;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Mirror " + attr.name +"<br>\n";
        return false;
      }
    break;
    case 'circle':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      try {
        $('debug').innerHTML += "* <b>Circle:</b> First: " + input[0].name + ", Second: " + input[1] + "<br>\n";
        c = board.createElement('circle', input, attr);
        return c;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Circle " + attr.name +"<br>\n";
        return false;
      }
    break;
    case 'circlearc':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      try {
        $('debug').innerHTML += "* <b>CircleArc:</b> First: " + input[0].name + ", Second: " + input[1].name + "<br>\n";
        c = board.createElement('arc', input, attr);
        return c;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> CircleArc " + attr.name +"<br>\n";
        return false;
      }
    break;
    // case 'conic':
    //   gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
    //   gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
    //   gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
    //   gxtEl = JXG.GeogebraReader.visualProperties(element, attr);
    // 
    //   try {
    //     $('debug').innerHTML += "* <b>Conic:</b> First: " + input[0].name + ", Second: " + input[1].name + "<br>\n";
    //     c = board.createElement('conic', input, attr);
    //     return c;
    //   } catch(e) {
    //     $('debug').innerHTML += "* <b>Err:</b> Conic " + attr.name +"<br>\n";
    //     return false;
    //   }
    // break;
    case 'circlesector':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      try {
        $('debug').innerHTML += "* <b>CircleSector:</b> First: " + input[0].name + ", Second: " + input[1].name + "<br>\n";
        c = board.createElement('sector', input, attr);
        return c;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> CircleSector " + attr.name +"<br>\n";
        return false;
      }
    break;
    case 'linebisector':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      try {
        $('debug').innerHTML += "* <b>LineBiSector (Mittelsenkrechte):</b> First: " + input[0].name + "<br>\n";
        attr.straightFirst = true;
        attr.straightLast =  true;
        m = board.createElement('midpoint', input, {visible: 'false'});
        p = board.createElement('perpendicular', [m, input[0]], attr);
        return p;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> LineBiSector (Mittelsenkrechte) " + attr.name +"<br>\n";
        return false;
      }
    break;
    case 'ray':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      try {
        $('debug').innerHTML += "* <b>Strahl:</b> First: " + input[0].name + "<br>\n";
        attr.straightFirst = true;
        attr.straightLast =  false;
        p = board.createElement('line', [input[1], input[0]], attr);
        return p;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Strahl " + attr.name +"<br>\n";
        return false;
      }
    break;
    case 'tangent':
//TODO: nur ein Element?
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      try {
        $('debug').innerHTML += "* <b>Tangente:</b> First: " + input[0].name + "<br>\n";
        p = board.createElement('tangent', input[1], attr);
        return p;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Tangente " + attr.name +"<br>\n";
        return false;
      }
    break;
    case 'circumcirclearc':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      try {
        $('debug').innerHTML += "* <b>CircumcircleArc:</b> First: " + input[0].name + "<br>\n";
        p = board.createElement('circumcircle', input, attr);
        return p;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> CircumcircleArc " + attr.name +"<br>\n";
        return false;
      }
    break;
    case 'angle':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      try {
        $('debug').innerHTML += "* <b>Angle:</b> First: " + input[0].name + "<br>\n";
        p = board.createElement('angle', input, attr);
        return p;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Angle " + attr.name +"<br>\n";
        return false;
      }
    break;
    case 'angularbisector':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      try {
        $('debug').innerHTML += "* <b>Angularbisector:</b> First: " + input[0].name + "<br>\n";
        p = board.createElement('bisector', input, attr);
        return p;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Angularbisector " + attr.name +"<br>\n";
        return false;
      }
    break;
//    case 'polar':
//    break;
//    case 'radius':
//    break;
//    case 'derivative':
//    break;
//    case 'root':
//    break;
//    case 'slope':
//    break;
//    case 'corner':
//    break;
//    case 'ellipse':
//    break;
//    case 'integral':
//    break;
//    case 'midpoint':
//    break;
//    case 'function':
//    break;
//    case 'numeric':
//    break;
//    case 'vector':
//    break;
//    case 'unitvector':
//    break;
//    case 'center':
//    break;
//    case 'extremum':
//    break;
//    case 'turningpoint':
//    break;
//    case 'arc':
//    break;
//    case 'semicircle':
//    break;
//    case 'circlepart':
//    break;
//    case 'uppersum':
//    break;
//    case 'lowersum':
//    break;
//    case 'dilate':
//    break;
//    case 'image':
//    break;
//    case 'text':
//    break;
    default:
      return false;
    break;
  }
};

/**
 * Reading the elements of a geogebra file
 * @param {XMLTree} tree expects the content of the parsed geonext file returned by function parseFF/parseIE
 * @param {Object} board board object
 */
this.readGeogebra = function(tree, board) {
  var registeredElements = [];
  var el, Data, i;
  var els = [];

  // Achsen registieren
  registeredElements = JXG.GeogebraReader.writeBoard(tree, board, registeredElements);
  var constructions = tree.getElementsByTagName("construction");
  for (var t=0; t<constructions.length; t++) {

    var cmds = constructions[t].getElementsByTagName("command");
    for (var s=0; s<cmds.length; s++) {
      Data = cmds[s];

      var input = [];
      for (i=0; i<Data.getElementsByTagName("input")[0].attributes.length; i++) {
        el = Data.getElementsByTagName("input")[0].attributes[i].value;
        if(!el.match(/°/) && !isNaN(el)) {
          input[i] = el;
        } else {
          if(typeof registeredElements[el] == 'undefined' || registeredElements[el] == '') {
            elnode = JXG.GeogebraReader.getElement(tree, el);
            registeredElements[el] = JXG.GeogebraReader.writeElement(tree, board, elnode);
            $('debug').innerHTML += "regged: "+registeredElements[el].id+"<br/>";
          }
          input[i] = registeredElements[el];
        }
      }

      var output = [];
      for (i=0; i<Data.getElementsByTagName("output")[0].attributes.length; i++) {
        el = Data.getElementsByTagName("output")[0].attributes[i].value;
        output[i] = JXG.GeogebraReader.getElement(tree, el);
      }
      if(typeof registeredElements[el] == 'undefined' || registeredElements[el] == '') {
        registeredElements[el] = JXG.GeogebraReader.writeElement(tree, board, output, input, Data.attributes['name'].value.toLowerCase());
        $('debug').innerHTML += "regged: "+registeredElements[el].id+"<br/>";

        /* Bei Element mit Raendern die jeweiligen Geraden als registrierte Elemente speichern */
        for(var i=1; i<output.length; i++) {
          registeredElements[output[i].attributes['label'].value] = registeredElements[el].borders[i-1];
          $('debug').innerHTML += i+") regged: "+output[i].attributes['label'].value+"("+ registeredElements[output[i].attributes['label'].value].id +")<br/>";
        }
      }

    }
  }
  board.fullUpdate();
};

this.prepareString = function(fileStr){
    if (fileStr.indexOf('<')!=0) {
    	bA = [];
    	for (i=0;i<fileStr.length;i++)
            bA[i]=JXG.Util.asciiCharCodeAt(fileStr,i);
            
        fileStr = (new JXG.Util.Unzip(bA)).unzipFile("geogebra.xml");  // Unzip
    }
    return fileStr;
};
}; // end: GeogebraReader()