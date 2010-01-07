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
    var p1, p2, p3, p4, l1, l2, l3, l4, ret, i;
    
    if(JXG.isPoint(parentArr[0]) && JXG.isPoint(parentArr[1])) {
        
        p1 = parentArr[0];
        p2 = parentArr[1];
        
        p3 = board.createElement('point', [function () { return (-p1.Y() + (p1.X() + p2.X())/2 + (p1.Y() + p2.Y())/2); }, function () { return (p1.X() - (p1.X() + p2.X())/2 + (p1.Y() + p2.Y())/2);}]);
        p4 = board.createElement('point', [function () { return (-p2.Y() + (p1.X() + p2.X())/2 + (p1.Y() + p2.Y())/2); }, function () { return (p2.X() - (p1.X() + p2.X())/2 + (p1.Y() + p2.Y())/2);}]);
        
        l1 = board.createElement('line', [p1, p3], {straightFirst: false, straightLast: false});
        l2 = board.createElement('line', [p1, p4], {straightFirst: false, straightLast: false});
        l3 = board.createElement('line', [p2, p3], {straightFirst: false, straightLast: false});
        l4 = board.createElement('line', [p2, p4], {straightFirst: false, straightLast: false}); 
        
        ret = [p1, p2, p3, p4, l1, l2, l3, l4];
        ret.points = [p1, p2, p3, p4];
        ret.lines = [l1, l2, l3, l4];

        for(i = 1; i <= 4; i++) {
            ret['point'+i] = ret.points[i-1];
            ret['line'+i] = ret.lines[i-1];
        }
        ret.multipleElements = true;

        return ret;
    } else {
        throw new Error("JSXGraph: Can't create square with parent types '" + (typeof parentArr[0]) + "' and '" + (typeof parentArr[1]) + "'.");    
    }
};

JXG.JSXGraph.registerElement('square', JXG.createSquare);
