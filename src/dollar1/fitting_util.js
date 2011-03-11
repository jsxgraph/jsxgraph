/*
 * returns the bounding box of a point array.
 * 
 * @ array 
 */
function boundingBoxUsr(points){
	var minX = +Infinity, maxX = -Infinity, minY = +Infinity, maxY = -Infinity;
	for (var i = 0; i < points.length; i++){
		if (points[i][0] < minX)
			minX = points[i][0];
		if (points[i][0] > maxX)
			maxX = points[i][0];
		if (points[i][1] < minY)
			minY = points[i][1];
		if (points[i][1] > maxY)
			maxY = points[i][1];
	}
	return new Array(minX, minY, maxX, maxY);
	 
}
/*
 * Find points in the points array, touching the bounding box
 * 
 * @ array
 */	
function pointsOnBoundingBox(points, boundingBox){
	var pointsOnBoundingBox = new Array(-Infinity,-Infinity,-Infinity,-Infinity);
	for (var i=0;i<points.length;i++){
		if (points[i][1]==boundingBox[1])
			pointsOnBoundingBox[0]=points[i];
		if (points[i][1]==boundingBox[3])
			pointsOnBoundingBox[2]=points[i];
		if (points[i][0]==boundingBox[0])
			pointsOnBoundingBox[3]=points[i];
		if (points[i][0]==boundingBox[2])
			pointsOnBoundingBox[1]=points[i];		
	}
	return pointsOnBoundingBox;
}

/*
 * Removes a polygon together with its borders
 */
function removePolygon(poly, board){
	for (var i=0; i<poly.borders.length;i++)
		board.removeObject(poly.borders[i]);
	board.removeObject(poly);
}

/*
 * Removes points included in v array but not vertices of polygon poly from board 
 */
function removePoint(poly,v,board){
	for (var i = 0;i<v.length;i++){
		var remove = true;
		for (var j = 0;j<poly.vertices.length;j++){
			if (poly.vertices[j]==v[i]){
				remove = false;
				break;
			}
		}
		if (remove){
			board.removeObject(v[i]);
			return;
		}
	}	
}

/*
 * Finds existing points on a circle with midpoint (xm,ym) and radius r within sensititve_area
 * @ array
 */
function pointsOnCircle(xm, ym, r, sensitive_area, board){
	board.suspendUpdate();
	var m = board.create('point',[xm,ym]);
	var elList = [];
	for (var el in board.objects) {
		if (board.objects[el].visProp['visible'] && board.objects[el].type==JXG.OBJECT_TYPE_POINT && board.objects[el].Dist(m)>=r-sensitive_area && board.objects[el].Dist(m)<=r+sensitive_area) {
			elList.push(board.objects[el]);
		}
	}
	return elList;
}
/*
 * Finds exitins points within the sensitive area of a given curve
 * @ array
 */
function pointsOnCurve(curve, sensitive_area, board){
	var elList = [];
	hasPoint = board.options.precision.hasPoint;
	board.options.precision.hasPoint=sensitive_area*3;
	for (var el in board.objects) {
		if (board.objects[el].visProp['visible'] && board.objects[el].type==JXG.OBJECT_TYPE_POINT){
			var coords = new JXG.Coords(JXG.COORDS_BY_USER,[board.objects[el].X(),board.objects[el].Y()],board);
			var hp = curve.hasPoint(coords.scrCoords[1],coords.scrCoords[2]);
			if (curve.hasPoint(coords.scrCoords[1],coords.scrCoords[2]))
				elList.push(board.objects[el]); 
		}
	}
	board.options.precision.hasPoint = hasPoint;	
	return elList;
}
/*
 * Fits data points (2 dim array (x,y) in user coords) to given reference Points, if they are within the sensitve_area
 */
function fitPoints(data,reference,sensitive_area,board){
	sensitive_area = 3*sensitive_area /(board.unitX*board.zoomX)
	for (var i=0;i<data.length;i++){
		var min = Infinity;
		var replace;
		for (var j=0;j<reference.length;j++){
			var dist2 = (data[i][0]-reference[j].X())*(data[i][0]-reference[j].X())+(data[i][1]-reference[j].Y())*(data[i][1]-reference[j].Y());
			if (dist2 < min){
				min = dist2;
				replace = reference[j];
			}
		}
		if (min<sensitive_area*sensitive_area){
			data[i]=replace;
		}
	}
	return data;
}
/*
 * Fits vertices of a polygon to given reference Points, if they are within the sensitive_area
 */
function fitPoly(poly,reference,sensitive_area,board){
	sensitive_area = 3 * sensitive_area /(board.unitX*board.zoomX)
	for (var i=0;i<poly.vertices.length;i++){
		var min = Infinity;
		var replace;
		for (var j=0;j<reference.length;j++){
			var namei = poly.vertices[i].name;
			var namej = reference[j].name;
			var dist2 = (poly.vertices[i].X()-reference[j].X())*(poly.vertices[i].X()-reference[j].X())+(poly.vertices[i].Y()-reference[j].Y())*(poly.vertices[i].Y()-reference[j].Y());
			if (dist2 == 0)
				break;
			if (dist2 < min){
				min = dist2;
				replace = reference[j];
			}
		}
		document.getElementById('debug').innerHTML = min;
		if (min<sensitive_area*sensitive_area && min > 0){
			var remove = poly.vertices[i];
			poly.vertices[i]=replace;
			if (!isElementIn(remove, reference))
				board.removeObject(remove);
			remove = poly;
			poly = board.create('polygon',poly.vertices);
			board.removeObject(remove);
		}
	}
}

/*
*	Function which finds obj ín board hitted by coords
*
* 	@array
*/
function findHittedObj(coords,board)
{
	var els = [];
	for(var el in board.objects)
		if(board.objects[el].hasPoint&&board.objects[el].visProp['visible']&&(board.objects[el].type ==JXG.OBJECT_TYPE_LINE||board.objects[el].type ==JXG.OBJECT_TYPE_CIRCLE))
		{
			if(board.objects[el].hasPoint(coords.scrCoords[1],coords.scrCoords[2]))
			{
					els.push(board.objects[el]);
			}
		}
	return els;		
}


/*
 * Checks if el is included in an array of elements
 */
function isElementIn(el,elements){
	for (var i=0;i<elements.length;i++){
		if (el == elements[i])
			return true;
    }
	return false;
}

