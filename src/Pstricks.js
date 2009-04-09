JXG.PsTricks = function() {
    this.psTricksString = "";
}

JXG.PsTricks.prototype.convertBoardToPsTricks = function(board) {
    var p = new JXG.Coords(JXG.COORDS_BY_SCREEN, [board.canvasWidth, board.canvasHeight], board);
    var q = new JXG.Coords(JXG.COORDS_BY_SCREEN, [0, 0], board);
    this.psTricksString = '\\begin{pspicture*}('+q.usrCoords[1]+','+p.usrCoords[2]+')('+p.usrCoords[1]+','+q.usrCoords[2]+')\n';

    // Polygone
    for(var el in board.objects) {
        var pEl = board.objects[el];
        if(pEl.type == JXG.OBJECT_TYPE_POLYGON) {
            if(pEl.visProp['visible']) {
                this.addPolygon(pEl);
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
}

JXG.PsTricks.prototype.givePsTricksToDiv = function(divId, board) {
    this.convertBoardToPsTricks(board);
    document.getElementById(divId).innerHTML = this.psTricksString;
}

JXG.PsTricks.prototype.addPoint = function(el) {
    this.psTricksString += "\\psdot";
    this.psTricksString += "[linecolor=" + this.parseColor(el.visProp['strokeColor']) + ",";
    this.psTricksString += "dotstyle=";
    if(el.visProp['style'] == 0 || el.visProp['style'] == 1 || el.visProp['style'] == 2) { // x
        this.psTricksString += "x, dotsize=";
        if(el.visProp['style'] == 0) {
            this.psTricksString += "2pt 2";
        }
        else if(el.visProp['style'] == 1) {
            this.psTricksString += "5pt 2";
        }
        else if(el.visProp['style'] == 2) {
            this.psTricksString += "5pt 3";
        }        
    }
    else if(el.visProp['style'] == 3 || el.visProp['style'] == 4 || el.visProp['style'] == 5 || el.visProp['style'] == 6) { // circle
        this.psTricksString += "*, dotsize=";
        if(el.visProp['style'] == 3) {
            this.psTricksString += "2pt 2";
        }
        else if(el.visProp['style'] == 4) {
            this.psTricksString += "4pt 2";
        }
        else if(el.visProp['style'] == 5) {
            this.psTricksString += "6pt 2";
        }  
        else if(el.visProp['style'] == 6) {
            this.psTricksString += "6pt 3";
        }          
    }
    else if(el.visProp['style'] == 7 || el.visProp['style'] == 8 || el.visProp['style'] == 9) { // rectangle
        this.psTricksString += "square*, dotsize=";
        if(el.visProp['style'] == 7) {
            this.psTricksString += "2pt 2";
        }
        else if(el.visProp['style'] == 8) {
            this.psTricksString += "5pt 2";
        }
        else if(el.visProp['style'] == 9) {
            this.psTricksString += "5pt 3";
        }           
    }
    else if(el.visProp['style'] == 10 || el.visProp['style'] == 11 || el.visProp['style'] == 12) { // +
        this.psTricksString += "+, dotsize=";
        if(el.visProp['style'] == 10) {
            this.psTricksString += "2pt 2";
        }
        else if(el.visProp['style'] == 11) {
            this.psTricksString += "5pt 2";
        }
        else if(el.visProp['style'] == 12) {
            this.psTricksString += "5pt 3";
        }            
    }
    this.psTricksString += "]";
    this.psTricksString += "("+el.coords.usrCoords[1]+","+el.coords.usrCoords[2]+")\n";
    
    // Label
    this.psTricksString += "\\rput("+(el.coords.usrCoords[1]+15/ el.board.unitY / el.board.zoomY)+","+(el.coords.usrCoords[2]+15/ el.board.unitY / el.board.zoomY)+"){\\small $"+el.name+"$}\n";
}

JXG.PsTricks.prototype.addLine = function(el) {
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
}

JXG.PsTricks.prototype.addCircle = function(el) {
    var radius = el.getRadius();
    this.psTricksString += "\\pscircle";
    this.psTricksString += "[linecolor=" + this.parseColor(el.visProp['strokeColor']) +", linewidth=" +el.visProp['strokeWidth']+"px,";
    if(el.visProp['fillColor'] != 'none') {
        this.psTricksString += "fillstyle=solid, fillcolor="+this.parseColor(el.visProp['fillColor'])+", opacity="+JXG.Math.round(el.visProp['fillOpacity'],5);
    }
    this.psTricksString += "]";
    this.psTricksString += "("+el.midpoint.coords.usrCoords[1]+","+el.midpoint.coords.usrCoords[2]+"){"+radius+"}\n";
}

JXG.PsTricks.prototype.addPolygon = function(el) {
    this.psTricksString += "\\pspolygon";
    this.psTricksString += "[linestyle=none, fillstyle=solid, fillcolor="+this.parseColor(el.visProp['fillColor'])+", opacity="+JXG.Math.round(el.visProp['fillOpacity'],5)+"]";
    for(var i=0; i < el.vertices.length; i++) {
        this.psTricksString += "("+el.vertices[i].coords.usrCoords[1]+","+el.vertices[i].coords.usrCoords[2]+")";
    }
    this.psTricksString += "\n";
}


JXG.PsTricks.prototype.parseColor = function(color) {
    var c = new JXG.RGBColor(color);
    return "{[rgb]{"+c.r/255+","+c.g/255+","+c.b/255+"}}";
}