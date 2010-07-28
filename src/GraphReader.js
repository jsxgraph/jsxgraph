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
JXG.GraphReader = new function() {
    this.parseData = function(board, directed) {
        var splitted, n, nodes = [], adjMatrix = [], i, tmp, nodenumbers = {}, tmp2, weighted = false;
        splitted = this.data.split('\n');
        // remove whitespaces
        for(i=0; i<splitted.length;i++) {
            splitted[i] = splitted[i].replace (/^\s+/, '').replace (/\s+$/, '');
        }
        
        // first line: bounding box
        boundingBox = splitted[0].split(' ');
        for(i=0; i<boundingBox.length; i++) {
            boundingBox[i] = parseInt(boundingBox[i]);
        }

        board.setBoundingBox(boundingBox,true);
        splitted.shift();
        
        // second line: number of nodes
        n = parseInt(splitted[0]);
        
        // nodes
        for(i=1; i <= n; i++) {
            if(splitted[i].search(/ /) != -1) {
                tmp = splitted[i].split(' ');
                nodes.push({name:tmp[0],coords:[parseInt(tmp[1]),parseInt(tmp[2])]});
                nodenumbers[tmp[0]] = i-1;
            }
            else { // keine Koordinaten vorgegeben 
                tmp = splitted[i];
                nodes.push({name:tmp,coords:[null,null]});
                nodenumbers[tmp] = i-1;
            }
        }
        
        // edges
        // check whether the graph is weighted or not
        for(i=n+1; i < splitted.length; i++) {
            tmp = splitted[i].split(' ');
            if(tmp.length > 2) { // weights
                weighted = true;
                break;
            }
        }
        // initialize entries of the adjacency matrix
        for(i=0; i<n; i++) {
            adjMatrix[i] = [];
            for(j=0; j<n; j++) {
                if(!weighted) {
                    adjMatrix[i][j] = 0;
                }
                else {
                    adjMatrix[i][j] = Infinity;
                }
            }
        }
        if(weighted) { // zeros for diagonal - way from node to itself
            for(i=0; i<n; i++) {
                adjMatrix[i][i] = 0;
            }        
        }
        for(i=n+1; i < splitted.length; i++) {
            tmp = splitted[i].split(' ');
            if(tmp.length > 2) { // weights
                tmp2 = parseInt(tmp[2]);
            }
            else {
                tmp2 = 1; // no weight given
            }
            adjMatrix[nodenumbers[tmp[0]]][nodenumbers[tmp[1]]] = tmp2;
            if(!directed) {
                adjMatrix[nodenumbers[tmp[1]]][nodenumbers[tmp[0]]] = tmp2;
            }
        }
        board.addedGraph = {n:n, nodes:nodes, adjMatrix:adjMatrix, nodenumbers: nodenumbers, weighted: weighted, directed: directed};
        //console.log(adjMatrix);
        return board.addedGraph;
        
    };
    

	this.readGraph = function(fileStr, board, directed) { 
        var graph;
        this.data = fileStr;
        board.suspendUpdate();
		graph = this.parseData(board, directed);
        this.drawGraph(graph, board);
        board.unsuspendUpdate();
	};
    
    this.drawGraph = function(graph,board) {
        var n = graph.n, nodes = graph.nodes, adjMatrix = graph.adjMatrix, i,j,s,t, p, x,y;
        for(i=0; i<n; i++) {
            //console.log(nodes[i].name,[nodes[i].coords[0],nodes[i].coords[1]]);
            if(nodes[i].coords[0] == null) {
                x = Math.random()*board.canvasWidth/(board.stretchX*1.1)-board.origin.scrCoords[1]/(board.stretchX*1.1);
                //console.log(x);
            }
            else {
                x = nodes[i].coords[0];
            }
            if(nodes[i].coords[1] == null) {
                y = Math.random()*board.canvasHeight/(board.stretchY*1.1)-(board.canvasHeight-board.origin.scrCoords[2])/(board.stretchY*1.1);
            }
            else {
                y = nodes[i].coords[1];
            }
           // console.log(x,y);
            p = board.create('point',[x,y], {name:nodes[i].name});
            nodes[i].reference = p;
        }
        board.addedGraph.segments = [];
        for(i=0; i<n; i++) {
            board.addedGraph.segments[i] = [];
            for(j=0; j<i+1; j++) {
                if(i==j) {
                    board.addedGraph.segments[i].push(null);
                }
                else if(adjMatrix[i][j] < Number.MAX_VALUE && adjMatrix[i][j] != 0) {
                    board.addedGraph.segments[i][j] = board.addedGraph.segments[j][i];
                }
                else {
                    board.addedGraph.segments[i].push(null);
                }
            }
            for(j=i+1; j<n; j++) {
                if(adjMatrix[i][j] < Number.MAX_VALUE && adjMatrix[i][j] != 0) {
                    //console.log([nodes[i].name, nodes[j].name]);
                    s = board.create('segment',[nodes[i].name, nodes[j].name]);
                    if(graph.directed) {
                        s.setProperty({lastArrow:true});
                    }
                    if(graph.weighted) {
                        t = board.create('text',[0,0,adjMatrix[i][j]],{parent:s});
                        board.addedGraph.segments[i].push({edge:s,weight:t});
                    }
                    else {
                        board.addedGraph.segments[i].push({edge:s,weight:1});
                    }
                }
                else {
                    board.addedGraph.segments[i].push(null);
                }
            }
        }
        //console.log(board.addedGraph.segments);
    };

};
