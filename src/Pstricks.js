JXG.PsTricks = new function() {
    this.psTricksString = "";
};

JXG.PsTricks.convertBoardToPsTricks = function(board) {
    var p = new JXG.Coords(JXG.COORDS_BY_SCREEN, [board.canvasWidth, board.canvasHeight], board);
    var q = new JXG.Coords(JXG.COORDS_BY_SCREEN, [0, 0], board);
    this.psTricksString = '\\begin{pspicture*}('+q.usrCoords[1]+','+p.usrCoords[2]+')('+p.usrCoords[1]+','+q.usrCoords[2]+')\n';

    // Arcs (hier nur Sektoren)
    for(var el in board.objects) {
        var pEl = board.objects[el];
        if(pEl.type == JXG.OBJECT_TYPE_ARC) {
            if(pEl.visProp['visible']) {
                this.addSector(pEl);
            }
        }
    }    
    // Polygone
    for(var el in board.objects) {
        var pEl = board.objects[el];
        if(pEl.type == JXG.OBJECT_TYPE_POLYGON) {
            if(pEl.visProp['visible']) {
                this.addPolygon(pEl);
            }
        }
    }
    // Winkel
    for(var el in board.objects) {
        var pEl = board.objects[el];
        if(pEl.type == JXG.OBJECT_TYPE_ANGLE) {
            if(pEl.visProp['visible']) {
                this.addAngle(pEl);
            }
        }
    }
    // Kreise
    for(var el in board.objects) {
        var pEl = board.objects[el];
        if(pEl.type == JXG.OBJECT_TYPE_CIRCLE) {
            if(pEl.visProp['visible']) {
                this.addCircle(pEl);
            }
        }
    }
    // Arcs
    for(var el in board.objects) {
        var pEl = board.objects[el];
        if(pEl.type == JXG.OBJECT_TYPE_ARC) {
            if(pEl.visProp['visible']) {
                this.addArc(pEl);
            }
        }
    }
    // Linien
    for(var el in board.objects) {
        var pEl = board.objects[el];
        if(pEl.type == JXG.OBJECT_TYPE_LINE) {
            if(pEl.visProp['visible']) {
                this.addLine(pEl);
            }
        }
    }
    // Punkte
    for(var el in board.objects) {
        var pEl = board.objects[el];
        if(pEl.type == JXG.OBJECT_TYPE_POINT) {
            if(pEl.visProp['visible']) {
                this.addPoint(pEl);
            }
        }
    }    
    this.psTricksString += '\\end{pspicture*}';
};

JXG.PsTricks.givePsTricksToDiv = function(divId, board) {
    this.convertBoardToPsTricks(board);
    document.getElementById(divId).innerHTML = this.psTricksString;
};

JXG.PsTricks.addPoint = function(el) {
    this.psTricksString += "\\psdot";
    this.psTricksString += "[linecolor=" + this.parseColor(el.visProp['strokeColor']) + ",";
    this.psTricksString += "dotstyle=";
    if(el.visProp['face'] == 'cross') { // x
        this.psTricksString += "x, dotsize=";
        if(el.visProp['size'] == 2) {
            this.psTricksString += "2pt 2";
        }
        else if(el.visProp['size'] == 3) {
            this.psTricksString += "5pt 2";
        }
        else if(el.visProp['size'] >= 4) {
            this.psTricksString += "5pt 3";
        }        
    }
    else if(el.visProp['face'] == 'circle') { // circle
        this.psTricksString += "*, dotsize=";
        if(el.visProp['size'] == 1) {
            this.psTricksString += "2pt 2";
        }
        else if(el.visProp['size'] == 2) {
            this.psTricksString += "4pt 2";
        }
        else if(el.visProp['size'] == 3) {
            this.psTricksString += "6pt 2";
        }  
        else if(el.visProp['size'] >= 4) { // TODO
            this.psTricksString += "6pt 3";
        }          
    }
    else if(el.visProp['face'] == 'square') { // rectangle
        this.psTricksString += "square*, dotsize=";
        if(el.visProp['size'] == 2) {
            this.psTricksString += "2pt 2";
        }
        else if(el.visProp['size'] == 3) {
            this.psTricksString += "5pt 2";
        }
        else if(el.visProp['size'] >= 4) { // TODO
            this.psTricksString += "5pt 3";
        }           
    }
    else if(el.visProp['face'] == 'plus') { // +
        this.psTricksString += "+, dotsize=";
        if(el.visProp['size'] == 2) {
            this.psTricksString += "2pt 2";
        }
        else if(el.visProp['size'] == 3) {
            this.psTricksString += "5pt 2";
        }
        else if(el.visProp['size'] >= 4) { // TODO
            this.psTricksString += "5pt 3";
        }            
    }
    this.psTricksString += "]";
    this.psTricksString += "("+el.coords.usrCoords[1]+","+el.coords.usrCoords[2]+")\n";
    
    // Label
    this.psTricksString += "\\rput("+(el.coords.usrCoords[1]+15/ el.board.stretchY)+","+(el.coords.usrCoords[2]+15/ el.board.stretchY)+"){\\small $"+el.name+"$}\n";
};

JXG.PsTricks.addLine = function(el) {
    var screenCoords1 = new JXG.Coords(JXG.COORDS_BY_USER, el.point1.coords.usrCoords, el.board);
    var screenCoords2 = new JXG.Coords(JXG.COORDS_BY_USER, el.point2.coords.usrCoords, el.board);
    if(el.visProp['straightFirst'] || el.visProp['straightLast']) {
       el.board.renderer.calcStraight(el,screenCoords1,screenCoords2); 
    } 
    this.psTricksString += "\\psline";
    this.psTricksString += "[linecolor=" + this.parseColor(el.visProp['strokeColor']) + ", linewidth=" +el.visProp['strokeWidth']+"px";
    this.psTricksString += "]";
    if(el.visProp['firstArrow']) {
        if(el.visProp['lastArrow']) {
            this.psTricksString += "{<->}";
        }
        else {
            this.psTricksString += "{<-}";
        }
    }
    else {
        if(el.visProp['lastArrow']) {
            this.psTricksString += "{->}";
        }
    }
    this.psTricksString += "("+screenCoords1.usrCoords[1]+","+screenCoords1.usrCoords[2]+")("+screenCoords2.usrCoords[1]+","+screenCoords2.usrCoords[2]+")\n";
};

JXG.PsTricks.addCircle = function(el) {
    var radius = el.getRadius();
    this.psTricksString += "\\pscircle";
    this.psTricksString += "[linecolor=" + this.parseColor(el.visProp['strokeColor']) +", linewidth=" +el.visProp['strokeWidth']+"px";
    if(el.visProp['fillColor'] != 'none' && el.visProp['fillOpacity'] != 0) {
        this.psTricksString += ", fillstyle=solid, fillcolor="+this.parseColor(el.visProp['fillColor'])+", opacity="+JXG.Math.round(el.visProp['fillOpacity'],5);
    }
    this.psTricksString += "]";
    this.psTricksString += "("+el.midpoint.coords.usrCoords[1]+","+el.midpoint.coords.usrCoords[2]+"){"+radius+"}\n";
};

JXG.PsTricks.addPolygon = function(el) {
    this.psTricksString += "\\pspolygon";
    this.psTricksString += "[linestyle=none, fillstyle=solid, fillcolor="+this.parseColor(el.visProp['fillColor'])+", opacity="+JXG.Math.round(el.visProp['fillOpacity'],5)+"]";
    for(var i=0; i < el.vertices.length; i++) {
        this.psTricksString += "("+el.vertices[i].coords.usrCoords[1]+","+el.vertices[i].coords.usrCoords[2]+")";
    }
    this.psTricksString += "\n";
};

JXG.PsTricks.addArc = function(el) {
    var radius = el.getRadius();  
    var p = {};
    p.coords = new JXG.Coords(JXG.COORDS_BY_USER, 
                          [el.board.canvasWidth/(el.board.stretchY), el.midpoint.coords.usrCoords[2]],
                          el.board);
    var angle2 = JXG.Math.round(el.board.algebra.trueAngle(p, el.midpoint, el.point2),4);
    var angle1 = JXG.Math.round(el.board.algebra.trueAngle(p, el.midpoint, el.point3),4);
    
    this.psTricksString += "\\psarc";
    this.psTricksString += "[linecolor=" + this.parseColor(el.visProp['strokeColor']) + ", linewidth=" +el.visProp['strokeWidth']+"px";
    this.psTricksString += "]";
    if(el.visProp['lastArrow']) {
        if(el.visProp['firstArrow']) {
            this.psTricksString += "{<->}";
        }
        else {
            this.psTricksString += "{<-}";
        }
    }
    else {
        if(el.visProp['firstArrow']) {
            this.psTricksString += "{->}";
        }
    }    
    this.psTricksString += "("+el.midpoint.coords.usrCoords[1]+","+el.midpoint.coords.usrCoords[2]+"){"+radius+"}{"+angle2+"}{"+angle1+"}\n";
};

JXG.PsTricks.addSector = function(el) {
    var radius = el.getRadius();  
    var p = {};
    p.coords = new JXG.Coords(JXG.COORDS_BY_USER, 
                          [el.board.canvasWidth/(el.board.stretchY), el.midpoint.coords.usrCoords[2]],
                          el.board);
    var angle2 = JXG.Math.round(el.board.algebra.trueAngle(p, el.midpoint, el.point2),4);
    var angle1 = JXG.Math.round(el.board.algebra.trueAngle(p, el.midpoint, el.point3),4);

    if(el.visProp['fillColor'] != 'none' && el.visProp['fillOpacity'] != 0) {
        this.psTricksString += "\\pswedge";
        this.psTricksString += "[linestyle=none, fillstyle=solid, fillcolor="+this.parseColor(el.visProp['fillColor'])+", opacity="+JXG.Math.round(el.visProp['fillOpacity'],5)+"]";
        this.psTricksString += "("+el.midpoint.coords.usrCoords[1]+","+el.midpoint.coords.usrCoords[2]+"){"+radius+"}{"+angle2+"}{"+angle1+"}\n";    
    }
};

JXG.PsTricks.addAngle = function(el) {
    var radius = el.radius;
    var p = {};
    p.coords = new JXG.Coords(JXG.COORDS_BY_USER, 
                          [el.board.canvasWidth/(el.board.stretchY), el.point2.coords.usrCoords[2]],
                          el.board);
    var angle2 = JXG.Math.round(el.board.algebra.trueAngle(p, el.point2, el.point1),4);
    var angle1 = JXG.Math.round(el.board.algebra.trueAngle(p, el.point2, el.point3),4);

    if(el.visProp['fillColor'] != 'none' && el.visProp['fillOpacity'] != 0) {
        this.psTricksString += "\\pswedge";
        this.psTricksString += "[linestyle=none, fillstyle=solid, fillcolor="+this.parseColor(el.visProp['fillColor'])+", opacity="+JXG.Math.round(el.visProp['fillOpacity'],5)+"]";
        this.psTricksString += "("+el.point2.coords.usrCoords[1]+","+el.point2.coords.usrCoords[2]+"){"+radius+"}{"+angle2+"}{"+angle1+"}\n";    
    }
    this.psTricksString += "\\psarc";
    this.psTricksString += "[linecolor=" + this.parseColor(el.visProp['strokeColor']) + ", linewidth=" +el.visProp['strokeWidth']+"px";
    this.psTricksString += "]"; 
    this.psTricksString += "("+el.point2.coords.usrCoords[1]+","+el.point2.coords.usrCoords[2]+"){"+radius+"}{"+angle2+"}{"+angle1+"}\n";
};

JXG.PsTricks.parseColor = function(color) {
    var arr = JXG.rgbParser(color);
    return "{[rgb]{"+arr[0]/255+","+arr[1]/255+","+arr[2]/255+"}}";
};
