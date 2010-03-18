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
JXG.CinderellaReader = new function() {
    this.httpReq = function() {
        this.XMLHTTP = null;
        if (window.XMLHttpRequest) {
            this.XMLHTTP = new XMLHttpRequest();
        } 
        else if (window.ActiveXObject) {
            try {
                this.XMLHTTP =
                    new ActiveXObject("Msxml2.XMLHTTP");
            } 
            catch (ex) {
                try {
                    this.XMLHTTP = new ActiveXObject("Microsoft.XMLHTTP");
                } 
                catch (ex) {
                }
            }
        }
        return this.XMLHTTP;
    }
    this.httpReq();
    
    this.readFile = function(filename) {
        this.XMLHTTP.open("GET", filename);
        this.XMLHTTP.onreadystatechange = this.datenAusg;
        this.XMLHTTP.send(null);
    }
    
    this.datenAusgeben = function() {
        if (this.XMLHTTP.readyState == 4)  {
            var d = document.getElementById("Daten");
            var s = document.getElementById("Status");
            this.data = this.XMLHTTP.responseText;
        }
    }  

    this.datenAusg = JXG.bind(this.datenAusgeben,this);
    
    this.parseData = function(board) {
        var dataLines, i, j, k, pCoords, defName, objName, defPoints, segment, 
            defRadius, circle, erg, poly, point;
        dataLines = this.data.split('\n');
        for(i=0; i<dataLines.length; i++) {
            if(dataLines[i].search(/FreePoint.+/) != -1) { // freier Punkt
                pCoords = dataLines[i].slice(dataLines[i].search(/FreePoint.+/)+11);
                pCoords = pCoords.split(',');
                for(j=0; j<pCoords.length; j++) {
                    pCoords[j] = pCoords[j].slice(0,pCoords[j].search(/\+i\*/));
                }
                objName = dataLines[i].match(/"[A-Za-z]*"/);
                objName = objName[0].slice(1, objName[0].length-1);
                erg = this.readPointProperties(dataLines,i);
                i = erg[1];
                board.createElement('point',[pCoords[0]/pCoords[2],-1*pCoords[1]/pCoords[2]],
                                    {name:objName, size:erg[0][1], fillColor:erg[0][0], strokeColor:erg[2], labelColor:erg[3]});
                
            }
            else if(dataLines[i].search(/Join\(.+/) != -1 || dataLines[i].search(/Segment\(.+/) != -1) { // Gerade oder Strecke
                if(dataLines[i].search(/Join\(.+/) != -1) {
                    defPoints = dataLines[i].slice(dataLines[i].search(/Join.+/)+5);
                    segment = false;
                }
                else {
                    defPoints = dataLines[i].slice(dataLines[i].search(/Segment.+/)+8);
                    segment = true;
                }
                defPoints = defPoints.split(',');
                defName = [];
                for(j=0; j<defPoints.length; j++) {
                    defName[j] = defPoints[j].match(/"[A-Za-z]*"/)[0];
                    defName[j] = defName[j].slice(1,defName[j].length-1);
                }
                objName = dataLines[i].match(/"[A-Za-z]*"/);
                objName = objName[0].slice(1, objName[0].length-1);
                erg = this.readLineProperties(dataLines,i);
                i = erg[2];
                board.createElement('line',[JXG.getReference(board,defName[0]),JXG.getReference(board,defName[1])],
                                    {straightFirst:!segment, straightLast:!segment, name:objName, withLabel:true, 
                                     strokeColor:erg[0][0], strokeWidth:erg[0][2], dash:erg[1]});
            }
            else if(dataLines[i].search(/CircleMP.+/) != -1) { // Kreis, durch zwei Punkte definiert
                defPoints = dataLines[i].slice(dataLines[i].search(/CircleMP.+/)+9);
                defPoints = defPoints.split(',');
                defName = [];
                for(j=0; j<defPoints.length; j++) {
                    defName[j] = defPoints[j].match(/"[A-Za-z]*"/)[0];
                    defName[j] = defName[j].slice(1,defName[j].length-1);
                }
                objName = dataLines[i].match(/"[A-Za-z0-9]*"/);
                objName = objName[0].slice(1, objName[0].length-1); 
                erg = this.readCircleProperties(dataLines,i);
                i = erg[3];
                board.createElement('circle',[JXG.getReference(board,defName[0]),JXG.getReference(board,defName[1])],
                                    {name:objName, strokeColor:erg[0][0], fillColor:erg[1], fillOpacity:erg[2],
                                     strokeWidth:erg[0][2]});
            }
            else if(dataLines[i].search(/CircleByFixedRadius.+/) != -1 || dataLines[i].search(/CircleByRadius.+/) != -1) { // Kreis, mit Radius
                if(dataLines[i].search(/CircleByFixedRadius.+/) != -1) {
                    defPoints = dataLines[i].slice(dataLines[i].search(/CircleByFixedRadius.+/)+20);
                }
                else {
                    defPoints = dataLines[i].slice(dataLines[i].search(/CircleByRadius.+/)+15);
                }
                defPoints = defPoints.split(',');
                defName = defPoints[0].match(/"[A-Za-z0-9]*"/)[0];
                defName = defName.slice(1,defName.length-1);
                objName = dataLines[i].match(/"[A-Za-z0-9]*"/);
                objName = objName[0].slice(1, objName[0].length-1);
                defRadius = defPoints[1].slice(0,defPoints[1].search(/\+i\*/));
                erg = this.readCircleProperties(dataLines,i);
                i = erg[3];
                board.createElement('circle',[JXG.getReference(board,defName),Math.sqrt(1*defRadius)],
                                    {name:objName, strokeColor:erg[0][0], fillColor:erg[1], fillOpacity:erg[2],
                                     strokeWidth:erg[0][2]});
            }
            else if(dataLines[i].search(/PointOnCircle.+/) != -1) { // Gleiter auf Kreis
                defPoints = dataLines[i].split(':=');
                objName = defPoints[0].match(/"[A-Za-z]*"/)[0];
                objName = objName.slice(1, objName.length-1);
                defName = defPoints[1].match(/"[A-Za-z0-9]*"/)[0];
                defName = defName.slice(1,defName.length-1);  
                defPoints = defPoints[1].match(/\[.*\]/)[0];
                defPoints = defPoints.split(',');
                for(k=0; k<defPoints.length; k++) {
                    defPoints[k] = defPoints[k].split('+i*');
                }
                defPoints[0] = 1*(defPoints[0][0].slice(1));
                defPoints[1] = 1*defPoints[1][0];
                if(dataLines[i][1] == 'n') { // umgedreht!
                    defPoints[0] = -1*defPoints[0];
                    defPoints[1] = -1*defPoints[1];
                }
                erg = this.readPointProperties(dataLines,i);
                i = erg[1];
                circle = JXG.getReference(board,defName);
                board.createElement('glider',
                        [circle.midpoint.coords.usrCoords[1]+defPoints[0],circle.midpoint.coords.usrCoords[2]-defPoints[1],circle],
                                {name:objName, size:erg[0][1], fillColor:erg[0][0], strokeColor:erg[2], labelColor:erg[3]});
            }
            else if(dataLines[i].search(/PointOnLine.+/) != -1) { // Gleiter auf Geade
                defPoints = dataLines[i].split(':=');
                objName = defPoints[0].match(/"[A-Za-z]*"/)[0];
                objName = objName.slice(1, objName.length-1);
                defName = defPoints[1].match(/"[A-Za-z0-9]*"/)[0];
                defName = defName.slice(1,defName.length-1);
                pCoords = defPoints[1].match(/\[.*\]/)[0];
                pCoords = pCoords.split(',');
                pCoords[0] = 1*(pCoords[0].slice(1,pCoords[0].search(/\+i\*/))); // Klammer mit wegschneiden
                for(j=1; j<pCoords.length; j++) {
                    pCoords[j] = 1*(pCoords[j].slice(0,pCoords[j].search(/\+i\*/)));
                }            
                erg = this.readPointProperties(dataLines,i);
                i = erg[1];
                board.createElement('glider',
                        [pCoords[0]/pCoords[2],-1*pCoords[1]/pCoords[2],JXG.getReference(board,defName)],
                        {name:objName, size:erg[0][1], fillColor:erg[0][0], strokeColor:erg[2], labelColor:erg[3]});  
            }
            else if(dataLines[i].search(/Mid\(.+/) != -1) { // Mittelpunkt
                defPoints = dataLines[i].slice(dataLines[i].search(/Mid.+/)+4);
                defPoints = defPoints.split(',');
                defName = [];
                for(j=0; j<defPoints.length; j++) {
                    defName[j] = defPoints[j].match(/"[A-Za-z]*"/)[0];
                    defName[j] = defName[j].slice(1,defName[j].length-1);
                }
                objName = dataLines[i].match(/"[A-Za-z0-9]*"/);
                objName = objName[0].slice(1, objName[0].length-1); 
                erg = this.readPointProperties(dataLines,i);
                i = erg[1];
                board.createElement('midpoint',
                        [JXG.getReference(board,defName[0]),JXG.getReference(board,defName[1])],
                        {name:objName, size:erg[0][1], fillColor:erg[0][0], strokeColor:erg[2], labelColor:erg[3]});
            }
            else if(dataLines[i].search(/CircleBy3\(.+/) != -1) { // Umkreis
                defPoints = dataLines[i].slice(dataLines[i].search(/CircleBy3.+/)+10);
                defPoints = defPoints.split(',');
                defName = [];
                for(j=0; j<defPoints.length; j++) {
                    defName[j] = defPoints[j].match(/"[A-Za-z]*"/)[0];
                    defName[j] = defName[j].slice(1,defName[j].length-1);
                }
                objName = dataLines[i].match(/"[A-Za-z0-9]*"/);
                objName = objName[0].slice(1, objName[0].length-1);
                erg = this.readCircleProperties(dataLines,i);
                i = erg[3]; 
                circle = board.createElement('circumcircle',
                        [JXG.getReference(board,defName[0]),JXG.getReference(board,defName[1]),JXG.getReference(board,defName[2])],
                        {name:['',objName]});
                circle[0].setProperty({visible:false});
                circle[1].setProperty({strokeColor:erg[0][0], fillColor:erg[1], fillOpacity:erg[2],
                                     strokeWidth:erg[0][2]});
            }
            else if(dataLines[i].search(/Parallel\(.+/) != -1) { // Parallele
                defPoints = dataLines[i].slice(dataLines[i].search(/Parallel.+/)+9);
                defPoints = defPoints.split(',');
                defName = [];
                for(j=0; j<defPoints.length; j++) {
                    defName[j] = defPoints[j].match(/"[A-Za-z]*"/)[0];
                    defName[j] = defName[j].slice(1,defName[j].length-1);
                }
                objName = dataLines[i].match(/"[A-Za-z0-9]*"/);
                objName = objName[0].slice(1, objName[0].length-1);
                erg = this.readLineProperties(dataLines,i);
                i = erg[2];
                board.createElement('parallel',
                        [JXG.getReference(board,defName[0]),JXG.getReference(board,defName[1])],
                        {name:objName, withLabel:true, strokeColor:erg[0][0], strokeWidth:erg[0][2], dash:erg[1]});
            }
            else if(dataLines[i].search(/Orthogonal\(.+/) != -1) { // Normale
                defPoints = dataLines[i].slice(dataLines[i].search(/Parallel.+/)+11);
                defPoints = defPoints.split(',');
                defName = [];
                for(j=0; j<defPoints.length; j++) {
                    defName[j] = defPoints[j].match(/"[A-Za-z]*"/)[0];
                    defName[j] = defName[j].slice(1,defName[j].length-1);
                }
                objName = dataLines[i].match(/"[A-Za-z0-9]*"/);
                objName = objName[0].slice(1, objName[0].length-1);
                erg = this.readLineProperties(dataLines,i);
                i = erg[2];                
                board.createElement('normal',
                        [JXG.getReference(board,defName[0]),JXG.getReference(board,defName[1])],
                        {name:objName, withLabel:true, strokeColor:erg[0][0], strokeWidth:erg[0][2], dash:erg[1]});                
            }
            else if(dataLines[i].search(/ConicBy5\(.+/) != -1) { // Kegelschnitt durch 5 Punkte
                defPoints = dataLines[i].slice(dataLines[i].search(/ConicBy5.+/)+9);
                defPoints = defPoints.split(',');
                defName = [];
                for(j=0; j<defPoints.length; j++) {
                    defName[j] = defPoints[j].match(/"[A-Za-z]*"/)[0];
                    defName[j] = defName[j].slice(1,defName[j].length-1);
                }
                objName = dataLines[i].match(/"[A-Za-z0-9]*"/);
                objName = objName[0].slice(1, objName[0].length-1); 
                erg = this.readCircleProperties(dataLines,i);
                i = erg[3];
                board.createElement('conic',[JXG.getReference(board,defName[0]),JXG.getReference(board,defName[1]),
                                             JXG.getReference(board,defName[2]),JXG.getReference(board,defName[3]),
                                             JXG.getReference(board,defName[4])],
                                    {name: objName, strokeColor:erg[0][0], fillColor:erg[1], fillOpacity:erg[2],
                                     strokeWidth:erg[0][2]});
            }
            else if(dataLines[i].search(/ConicFoci\(.+/) != -1 || dataLines[i].search(/ConicFociH\(.+/) != -1) { // Ellipse mit Brennpunkten und Punkt auf Ellipse resp. eine solche Hyperbel (ConicFociH)
                defPoints = dataLines[i].split(':=');
                objName = defPoints[0].match(/"[A-Za-z0-9]*"/)[0];
                objName = objName.slice(1, objName.length-1);
                defName = defPoints[1].match(/"[A-Za-z0-9]*"/g);
                for(j=0; j<defName.length; j++) {
                    defName[j] = defName[j].slice(1,defName[j].length-1);
                }
                erg = this.readCircleProperties(dataLines,i);
                if(dataLines[i].search(/ConicFociH\(.+/) != -1) {
                    board.createElement('hyperbola',[JXG.getReference(board,defName[0]),JXG.getReference(board,defName[1]),
                                                JXG.getReference(board,defName[2])],
                                        {name: objName, strokeColor:erg[0][0], fillColor:erg[1], fillOpacity:erg[2],
                                         strokeWidth:erg[0][2]});
                }
                else {
                    board.createElement('ellipse',[JXG.getReference(board,defName[0]),JXG.getReference(board,defName[1]),
                                                JXG.getReference(board,defName[2])],
                                        {name: objName, strokeColor:erg[0][0], fillColor:erg[1], fillOpacity:erg[2],
                                         strokeWidth:erg[0][2]});                
                }
                i = erg[3];
            }
            else if(dataLines[i].search(/ConicParabolaPL\(.+/) != -1) { // Parabel mit Brennpunkt und Leitlinie
                defPoints = dataLines[i].slice(dataLines[i].search(/ConicParabolaPL.+/)+16);
                defPoints = defPoints.split(',');
                defName = [];
                for(j=0; j<defPoints.length; j++) {
                    defName[j] = defPoints[j].match(/"[A-Za-z]*"/)[0];
                    defName[j] = defName[j].slice(1,defName[j].length-1);
                }
                objName = dataLines[i].match(/"[A-Za-z0-9]*"/);
                objName = objName[0].slice(1, objName[0].length-1);
                erg = this.readCircleProperties(dataLines,i);
                i = erg[3];                
                board.createElement('parabola',
                        [JXG.getReference(board,defName[0]),JXG.getReference(board,defName[1])],
                                        {name: objName, strokeColor:erg[0][0], fillColor:erg[1], fillOpacity:erg[2],
                                         strokeWidth:erg[0][2]});                 
            }
            else if(dataLines[i].search(/Poly\(.+/) != -1) { // Polygon
                defPoints = dataLines[i].slice(dataLines[i].search(/Poly.+/)+5);
                defPoints = defPoints.split(',');
                defName = [];
                for(j=0; j<defPoints.length; j++) {
                    defName[j] = defPoints[j].match(/"[A-Za-z]*"/)[0];
                    defName[j] = defName[j].slice(1,defName[j].length-1);
                    defName[j] = JXG.getReference(board,defName[j])
                }
                objName = dataLines[i].match(/"[A-Za-z0-9]*"/);
                objName = objName[0].slice(1, objName[0].length-1);
                erg = this.readCircleProperties(dataLines,i);
                i = erg[3];                     
                poly = board.createElement('polygon', defName,
                                        {name: objName}); 
                poly.setProperty({fillColor:erg[1], fillOpacity:erg[2]});
                for(j=0; j<poly.borders.length; j++) {
                    poly.borders[j].setProperty({strokeColor:erg[0][0],strokeWidth:erg[0][2]});
                }
            } 
            else if(dataLines[i].search(/Arc\(.+/) != -1) { // Polygon
                defPoints = dataLines[i].slice(dataLines[i].search(/Arc.+/)+4);
                defPoints = defPoints.split(',');
                defName = [];
                for(j=0; j<defPoints.length; j++) {
                    defName[j] = defPoints[j].match(/"[A-Za-z]*"/)[0];
                    defName[j] = defName[j].slice(1,defName[j].length-1);
                }
                objName = dataLines[i].match(/"[A-Za-z0-9]*"/);
                objName = objName[0].slice(1, objName[0].length-1);
                erg = this.readCircleProperties(dataLines,i);
                i = erg[3];                     
                poly = board.createElement('circumcirclearc', [JXG.getReference(board,defName[0]),JXG.getReference(board,defName[1]),
                                                   JXG.getReference(board,defName[2])],
                                        {name: objName, strokeColor:erg[0][0], fillColor:erg[1], fillOpacity:erg[2],
                                         strokeWidth:erg[0][2]});
            } 
            else if(dataLines[i].search(/Through\(.+/) != -1) { // durch einen Punkt definierte Gerade
                defPoints = dataLines[i].slice(dataLines[i].search(/Through.+/)+8);
                defName = defPoints.match(/"[A-Za-z]*"/)[0];
                defName = defName.slice(1,defName.length-1);
                pCoords = defPoints.match(/\[.*\]/)[0];
                pCoords = pCoords.split(',');
                pCoords[0] = 1*(pCoords[0].slice(1,pCoords[0].search(/\+i\*/))); // Klammer mit wegschneiden
                for(j=1; j<pCoords.length; j++) {
                    pCoords[j] = 1*(pCoords[j].slice(0,pCoords[j].search(/\+i\*/)));
                } 
                objName = dataLines[i].match(/"[A-Za-z0-9]*"/);
                objName = objName[0].slice(1, objName[0].length-1);
                
                j = JXG.getReference(board,defName);
                point = board.createElement('point',[j.coords.usrCoords[1]+1*pCoords[0],j.coords.usrCoords[2]+1*pCoords[1]],{visible:false});
                erg = this.readLineProperties(dataLines,i);
                i = erg[2];
                board.createElement('line',[j,point],
                                    {name:objName, withLabel:true, strokeColor:erg[0][0], strokeWidth:erg[0][2], dash:erg[1]});
            }
        }
        
        return board;
    }
    
    this.calculateColor = function(colNr) {
        colNr = parseInt(colNr);
        switch(colNr) {
            case 0: return 'white';
            case 1: return 'black';
            case 2: return 'red';
            case 3: return 'blue';
            case 4: return 'green';
            case 5: return 'yellow';
            case 6: return '#ffafaf';
            case 7: return 'cyan';
            case 8: return '#ffc800';
            case 9: return '#199e4e';
            case 10: return '#b75500';
            case 11: return '#7700b7';
            case 12: return '#ff7f00';
            case 13: return '#03a7bc';
            case 14: return '#c10000';
            case 15: return '#808080';
            case 16: return '#ff4a4a';
            case 17: return '#faff9e';
            case 18: return '#b6ffaa';
            case 19: return '#82f2ff';
            case 20: return '#d4a3ff';
            case 21: return '#ffbd77';            
        }
    }
    
    this.readPointProperties = function(dataLines,i) {
        var objAppearance,border, labelcolor;
        do {
            i = i+1;
        } while(dataLines[i].search(/setAppearance/) == -1);
        objAppearance = (dataLines[i].match(/\([A-Za-z,0-9\.]*\)/))[0];
        objAppearance = objAppearance.slice(1, objAppearance.length-1).split(',');
        objAppearance[0] = this.calculateColor(objAppearance[0]);
        do {
            i = i+1;
        } while(dataLines[i].search(/pointborder/) == -1);
        if(dataLines[i].search(/false/) != -1) {
            border = 'none';
            labelcolor = objAppearance[0];
        }
        else {
            border = 'black';
            labelcolor = 'black';
        } 
        return [objAppearance,i,border,labelcolor];       
    }
    
    this.readCircleProperties = function(dataLines,i) {
        var objAppearance,filling, fillop;
        do {
            i = i+1;
        } while(dataLines[i].search(/setAppearance/) == -1);
        objAppearance = (dataLines[i].match(/\([A-Za-z,0-9\.]*\)/))[0];
        objAppearance = objAppearance.slice(1, objAppearance.length-1).split(',');
        objAppearance[0] = this.calculateColor(objAppearance[0]); 
        do {
            i = i+1;
        } while(dataLines[i].search(/colorfill/) == -1);          
        filling = dataLines[i].match(/"[0-9]*"/)[0];
        filling = filling.slice(1,filling.length-1);
        filling = this.calculateColor(filling);
        do {
            i = i+1;
        } while(dataLines[i].search(/visibilityfill/) == -1); 
        fillop = dataLines[i].match(/"[0-9]*"/)[0];
        fillop = fillop.slice(1,fillop.length-1);
        fillop = 1*fillop/10;  
        return [objAppearance,filling, fillop,i];
    }
    
    this.readLineProperties = function(dataLines,i) {
        var objAppearance,dashing;
        do {
            i = i+1;
        } while(dataLines[i].search(/setAppearance/) == -1);
        objAppearance = (dataLines[i].match(/\([A-Za-z,0-9\.]*\)/))[0];
        objAppearance = objAppearance.slice(1, objAppearance.length-1).split(',');
        objAppearance[0] = this.calculateColor(objAppearance[0]);
        do {
            i = i+1;
        } while(dataLines[i].search(/linedashing/) == -1);
        if(dataLines[i].search(/false/) != -1) {
            dashing = 0;
        }
        else {
            dashing = 3;
        }
        return [objAppearance,dashing,i];
    }
};
