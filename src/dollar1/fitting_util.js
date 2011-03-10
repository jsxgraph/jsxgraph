function boundingBoxUsr(points)
{
	var minX = +Infinity, maxX = -Infinity, minY = +Infinity, maxY = -Infinity;
	for (var i = 0; i < points.length; i++)
	{
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

function removePolygon(poly, board){
	for (var i=0; i<poly.borders.length;i++)
		board.removeObject(poly.borders[i]);
	board.removeObject(poly);
}

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
