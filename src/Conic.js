JXG.createEllipse = function(board, parents, atts) {
    if (atts==null) { 
        atts = {strokewidth:3};
    };
    atts['curveType'] = 'parameter';

    var F1, F2;
    F1 = parents[0];
    F2 = parents[1];
    var M = board.createElement('point', [
                function(){return (F1.X()+F2.X())*0.5;},
                function(){return (F1.Y()+F2.Y())*0.5;}
            ],{name:'', withLabel:false});

    var transformFunc = function() {
            var ax = F1.X();
            var ay = F1.Y();
            var bx = F2.X();
            var by = F2.Y();
            var beta; 
            // Rotate by the slope of the line [F1,F2]
            var sgn = (bx-ax>0)?1:-1;
            if (Math.abs(bx-ax)>0.0000001) {
                beta = Math.atan((by-ay)/(bx-ax))+ ((sgn<0)?Math.PI:0);  
            } else {
                beta = ((by-ay>0)?0.5:-0.5)*Math.PI;
            }
            var m = [
                        [1,    0,             0],
                        [M.X(),Math.cos(beta),-Math.sin(beta)],
                        [M.Y(),Math.sin(beta), Math.cos(beta)]
                    ];
            return m;
        };

    var conicCoords = function(phi,leave) {
                var a = parents[2];
                var e = F2.coords.distance(JXG.COORDS_BY_USER, F1.coords)*0.5; 
                var b = Math.sqrt(a*a-e*e);
                //if (atts.type=='ellipse') {
                var x = a*Math.cos(phi); 
                var y = b*Math.sin(phi);
                //} else {
                //    var x = leave*a*board.cosh(phi); 
                //    var y = leave*b*board.sinh(phi);
                //}
                return JXG.Math.matVecMult(transformFunc(),[1,x,y]);
            };
           
        //if (atts.type=='ellipse') {            
    var curve = board.create('curve', 
                        [function(phi) {return conicCoords(phi)[1];},
                         function(phi) {return conicCoords(phi)[2];},0,2.01*Math.PI],atts);        
        //} else {
/*
                return [board.createElement('curve', 
                    [function(phi) {return conicCoords(phi,1)[1];},
                     function(phi) {return conicCoords(phi,1)[2];},-2.01*Math.PI,2.01*Math.PI],atts),
                        board.createElement('curve', 
                    [function(phi) {return conicCoords(phi,-1)[1];},
                     function(phi) {return conicCoords(phi,-1)[2];},-2.01*Math.PI,2.01*Math.PI],atts)];
*/
        //}
    return curve;
};

JXG.JSXGraph.registerElement('ellipse', JXG.createEllipse);

