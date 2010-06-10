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
    this.parseData = function(board) {
        var splitted, n, nodes = [], adjMatrix = [], i, tmp;
        splitted = this.data.split('\n');
        // Leerzeichen am Anfang und am Ende entfernen
        for(i=0; i<splitted.length;i++) {
            splitted[i] = splitted[i].replace (/^\s+/, '').replace (/\s+$/, '');
        }
        n = 1*splitted[0];
        for(i=1; i <= n; i++) {
            tmp = splitted[i].split(' ');
            nodes.push({name:tmp[0],coords:[1*tmp[1],1*tmp[2]]});
        }
        for(i=n+1; i < 2*n; i++) {
            tmp = splitted[i].split(' ');
            for(j=0; j<tmp.length; j++) {
                if(tmp[j] == 'INF') {
                    tmp[j] = Number.MAX_VALUE;
                }
                else {
                    tmp[j] = tmp[j]*1;
                }
            }        
            adjMatrix.push(tmp);
        }
        return {n:n,nodes:nodes,adjMatrix:adjMatrix};
    };
    

	this.readGraph = function(fileStr, board) { 
        var graph;
        this.data = fileStr;
        board.suspendUpdate();
		graph = this.parseData(board);
        //alert(graph);
        this.drawGraph(graph, board);
        board.unsuspendUpdate();
	};
    
    this.drawGraph = function(graph,board) {
        var n = graph.n, nodes = graph.nodes, adjMatrix = graph.adjMatrix, i,j;
        for(i=0; i<n; i++) {
            console.log(nodes[i].name,[nodes[i].coords[0],nodes[i].coords[1]]);
            board.create('point',[nodes[i].coords[0],nodes[i].coords[1]], {name:nodes[i].name});
            
        }
        for(i=0; i<n; i++) {
            for(j=i+1; j<n; j++) {
                if(adjMatrix[i][j] < Number.MAX_VALUE) {
                    console.log([nodes[i].name, nodes[j].name]);
                    board.create('segment',[nodes[i].name, nodes[j].name]);
                }
            }
        }
    };

};
