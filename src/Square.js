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

JXG.createSquare = function(board, parentArr, atts) {
    
    if(JXG.IsPoint(parentArr[0]) && JXG.IsPoint(parentArr[1])) {
        
        var p1 = parentArr[0], p2 = parentArr[1], p3, p4;
        var l1, l2, l3, l4;
        
        l1 = board.createElement('line', parentArr, {straightFirst: false, straightLast: false});
        
        var perp = board.createElement('perpendicular', [l1, p1]);
        var refl = board.createElement('reflection', [l1, perp[1]]);
//        function(line, point, id, name)
//        board.removeObject(perp[0]);
//        board.removeObject(perp[1]);
        perp[0].setProperty('visible:false');
        p3 = refl;
        l2 = board.createElement('line', [p3, p1], {straightFirst: false, straightLast: false});
        p3.setProperty('visible:true');
        l2.setProperty('straightFirst:false', 'straightLast:false');
        
        perp = board.createElement('perpendicular', [l1, p2]);
        p4 = perp[1];
        l3 = perp[0];
        p4.setProperty('visible:true');
        l3.setProperty('straightFirst:false', 'straightLast:false');
        
        l4 = board.createElement('line', [p3, p4], {straightFirst: false, straightLast: false}); 
        
        return [p1, p2, p3, p4, l1, l2, l3, l4];
    } else {
        throw ("Can't create square with parent types '" + (typeof parentArr[0]) + "' and '" + (typeof parentArr[1]) + "'.");    
    }
};

JXG.JSXGraph.registerElement('square', JXG.createSquare);