/*
    Copyright 2009.2010
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

JXG.PsTricks = {

    convert: function (board) {
        var topleft = new JXG.Coords(JXG.COORDS_BY_SCREEN, [0, 0], board),
            bottomright = new JXG.Coords(JXG.COORDS_BY_SCREEN, [board.canvasWidth, board.canvasHeight], board),
            i, el, result = [];

        result.push('\\begin{pspicture*}('+topleft.usrCoords[1]+','+bottomright.usrCoords[2]+')('+bottomright.usrCoords[1]+','+topleft.usrCoords[2]+')\n');

        for(i in board.objects) {
            el = board.objects[i];

            if (el.visProp.visible) {
                switch (el.elementClass) {
                    case JXG.OBJECT_CLASS_CIRCLE:
                        result.push(this.addCircle(el));
                        break;
                    case JXG.OBJECT_CLASS_LINE:
                        result.push(this.addLine(el));
                        break;
                    case JXG.OBJECT_CLASS_POINT:
                        result.push(this.addPoint(el));
                        break;
                    default:
                        switch (el.type) {
                            case JXG.OBJECT_TYPE_ARC:
                                result.push(this.addArc(el));
                                break;
                            case JXG.OBJECT_TYPE_SECTOR:
                                result.push(this.addArc(el));
                                result.push(this.addSector(el));
                                break;
                            case JXG.OBJECT_TYPE_POLYGON:
                                result.push(this.addPolygon(el));
                                break;
                            case JXG.OBJECT_TYPE_ANGLE:
                                result.push(this.addAngle(el));
                                break;
                        }
                        break;
                }
            }
        }

        result.push('\\end{pspicture*}');

        return result.join('\n');
    },

    setArrows: function (el) {
        var result = '';

        if(el.visProp.firstarrow && el.visProp.lastarrow) {
            result = '{<->}';
        } else if (el.visProp.firstarrow) {
            result = '{<-}';
        } else if (el.visProp.lastarrow) {
            result = '{->}';
        }

        return result;
    },

    /**
     * Draws a wedge.
     * @param {String} color HTML/CSS color string.
     * @param {Number} opacity Numbe between 0 and 1.
     * @param {Array} midpoint x and y value of the midpoint.
     * @param {Number} radius
     * @param {Number} angle1
     * @param {Number} angle2
     */
    drawWedge: function (color, opacity, midpoint, radius, angle1, angle2) {
        var result = '';

        if(color != 'none' && opacity > 0) {
            result += "\\pswedge[linestyle=none, fillstyle=solid, fillcolor="+this.parseColor(color)+", opacity="+opacity.toFixed(5)+"]";
            result += "("+midpoint.join(',')+"){"+radius+"}{"+angle1+"}{"+angle2+"}\n";
        }

        return result;
    },

    addPoint: function (el) {
        var result = "\\psdot[linecolor=" + this.parseColor(el.visProp.strokecolor) + ",dotstyle=",
            face = el.normalizeFace(el.visProp.face) || 'o',
            size = el.visProp.size > 4 ? 4 : el.visProp.size,
            sizemap = [0, 0, '2pt 2', '5pt 2', '5pt 3'];

        // TODO: size == 1 and size > 4, faces <>, ^, v, <, and >

        if(face == 'x') {
            result += "x, dotsize=" + sizemap[size];
        } else if(face == 'o') {
            result += "*, dotsize=";
            if(size == 1) {
                result += "2pt 2";
            } else if(size == 2) {
                result += "4pt 2";
            } else if(size == 3) {
                result += "6pt 2";
            } else if(size == 4) {
                result += "6pt 3";
            }
        } else if(face == '[]') {
            result += "square*, dotsize=" + sizemap[size];
        } else if(face == '+') {
            result += "+, dotsize=" + sizemap[size];
        }
        result += "]("+el.coords.usrCoords.slice(1).join(',')+")\n";
        result += "\\rput("+(el.coords.usrCoords[1]+15/ el.board.unitY)+","+(el.coords.usrCoords[2]+15/ el.board.unitY)+"){\\small $"+el.name+"$}\n";

        return result;
    },

    addLine: function (el) {
        var screenCoords1 = new JXG.Coords(JXG.COORDS_BY_USER, el.point1.coords.usrCoords, el.board),
            screenCoords2 = new JXG.Coords(JXG.COORDS_BY_USER, el.point2.coords.usrCoords, el.board),
            result = "\\psline[linecolor=" + this.parseColor(el.visProp.strokecolor) + ", linewidth=" +el.visProp.strokewidth+"px]";

        if(el.visProp.straightfirst || el.visProp.straightlast) {
            JXG.Math.Geometry.calcStraight(el, screenCoords1, screenCoords2);
        }

        result += this.setArrows(el);
        result += "("+screenCoords1.usrCoords.slice(1).join(',')+")("+screenCoords2.usrCoords.slice(2).join(',')+")\n";

        return result;
    },

    addCircle: function (el) {
        var radius = el.Radius(),
            result = "\\pscircle[linecolor=" + this.parseColor(el.visProp.strokecolor) +", linewidth=" +el.visProp.strokewidth+"px";

        if(el.visProp.fillcolor != 'none' && el.visProp.fillopacity != 0) {
            result += ", fillstyle=solid, fillcolor="+this.parseColor(el.visProp.fillcolor)+", opacity="+el.visProp.fillopacity.toFixed(5);
        }
        result += "]("+el.center.coords.usrCoords.slice(1).join('1')+"){"+radius+"}\n";

        return result;
    },

    addPolygon: function (el) {
        var result = "\\pspolygon[linestyle=none, fillstyle=solid, fillcolor="+this.parseColor(el.visProp.fillcolor)+", opacity="+el.visProp.fillopacity.toFixed(5)+"]",
            i;

        for(i = 0; i < el.vertices.length; i++) {
            result += "("+el.vertices[i].coords.usrCoords.slice(1).join(',')+")";
        }
        result += "\n";

        return result;
    },

    addArc: function (el) {
        var radius = el.Radius(),
            p = {
                coords: new JXG.Coords(JXG.COORDS_BY_USER,[el.board.canvasWidth/(el.board.unitY), el.center.coords.usrCoords[2]], el.board)
            },
            angle2 = JXG.Math.Geometry.trueAngle(p, el.center, el.point2).toFixed(4),
            angle1 = JXG.Math.Geometry.trueAngle(p, el.center, el.point3).toFixed(4),
            result = "\\psarc[linecolor=" + this.parseColor(el.visProp.strokecolor) + ", linewidth=" +el.visProp.strokewidth+"px]";

        result += this.setArrows(el);
        result += "("+el.center.coords.usrCoords.slice(1).join(',')+"){"+radius+"}{"+angle2+"}{"+angle1+"}\n";

        return result;
    },

    addSector: function (el) {
        var radius = el.Radius(),
            p = {
                coords: new JXG.Coords(JXG.COORDS_BY_USER, [el.board.canvasWidth / (el.board.unitY), el.point1.coords.usrCoords[2]], el.board)
            },
            angle2 = JXG.Math.Geometry.trueAngle(p, el.point1, el.point2).toFixed(4),
            angle1 = JXG.Math.Geometry.trueAngle(p, el.point1, el.point3).toFixed(4);

        return this.drawWedge(el.visProp.fillcolor, el.visProp.fillopacity, el.point1.coords.usrCoords.slice(1), radius, angle2, angle1);
    },

    addAngle: function (el) {
        var radius = el.radius,
            p = {
                coords: new JXG.Coords(JXG.COORDS_BY_USER, [el.board.canvasWidth/(el.board.unitY), el.point2.coords.usrCoords[2]], el.board)
            },
            angle2 = JXG.Math.Geometry.trueAngle(p, el.point2, el.point1).toFixed(4),
            angle1 = JXG.Math.Geometry.trueAngle(p, el.point2, el.point3).toFixed(4),
            result;

        result = this.drawWedge(el.visProp.fillcolor, el.visProp.fillopacity, el.point2.coords.usrCoords.slice(1), radius, angle2, angle1);

        result += "\\psarc[linecolor=" + this.parseColor(el.visProp.strokecolor) + ", linewidth=" +el.visProp.strokewidth+"px]";
        result += "("+el.point2.coords.usrCoords.slice(1).join(',')+"){"+radius+"}{"+angle2+"}{"+angle1+"}\n";

        return result;
    },

    parseColor: function (color) {
        var arr = JXG.rgbParser(color);
        return "{[rgb]{"+arr[0]/255+","+arr[1]/255+","+arr[2]/255+"}}";
    }
};