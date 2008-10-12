/*
    Copyright 2008, 
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

JXG.Angle = function (board, p1, p2, p3, radius, text, id, name) {
    /* Call the constructor of GeometryElement */
    this.constructor();
    /**
     * Sets type of GeometryElement, value is OBJECT_TYPE_ANGLE.
     * @final
     * @type int
     */    
    this.type = JXG.OBJECT_TYPE_ANGLE;
    this.elementClass = JXG.OBJECT_CLASS_AREA;
    this.init(board, id, name);
    
    /**
     * First point A defining the angle ABC.
     * @type Point
     */
    this.point1 = JXG.GetReferenceFromParameter(this.board, p1);

    /**
     * Second point B defining the angle ABC.
     * @type Point
     */    
    this.point2 = JXG.GetReferenceFromParameter(this.board, p2);
    
    /**
     * Third point C defining the angle ABC.
     * @type Point
     */
    this.point3 = JXG.GetReferenceFromParameter(this.board, p3);    

    /**
    * Radius of the Angle
    * @type Float
    */
    this.radius = 1.0;
    if(radius != undefined && radius != null) {
        this.radius = radius;
    }
    
    /** 
    * Text (ie name) of the Angle
    * @type String
    */
    this.text = text;

    this.id = this.board.addAngle(this);
    
    /* Add sector as child to defining points */
    this.point1.addChild(this);
    this.point2.addChild(this);
    this.point3.addChild(this);    
};

JXG.Angle.prototype = new JXG.GeometryElement;

/**
 * Checks whether (x,y) is near the angle.
 * @param {int} x Coordinate in x direction, screen coordinates.
 * @param {int} y Coordinate in y direction, screen coordinates.
 * @return {bool} Always false, because the angles interior shall not be highlighted
 */
JXG.Angle.prototype.hasPoint = function (x, y) { 
    return false; 
};

/**
 * Uses the boards renderer to update the angle and all of its children.
 */
 JXG.Angle.prototype.updateRenderer = function () {
    if (this.needsUpdate) {
        this.board.renderer.updateAngle(this);
        this.needsUpdate = false;
    }
};

JXG.createAngle = function(board, parentArr, atts) {
    var el;
    // Alles 3 Punkte?
    if ( (JXG.IsPoint(parentArr[0])) && (JXG.IsPoint(parentArr[1])) && (JXG.IsPoint(parentArr[2]))) {
        el = new JXG.Angle(board, parentArr[0], parentArr[1], parentArr[2], atts['id'], atts['name']);
    } // Ansonsten eine fette Exception um die Ohren hauen
    else
        throw ("Can't create angle with parent types '" + (typeof parentArr[0]) + "' and '" + (typeof parentArr[1]) + "' and '" + (typeof parentArr[2]) + "'.");

    return el;
};

JXG.JSXGraph.registerElement('angle', JXG.createAngle);