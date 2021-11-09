<html>
<?php
function jxgcompress($filename) 
{   
    if (file_exists($filename)) {
        $base64 = base64_encode(gzcompress(rawurlencode(file_get_contents($filename)),9));
        echo "var jxgcompressed = \"$base64\";\n";
    } else {
        throw new Exception("$filename not found");
    }
}
?>

<head>
<script src="./jsxcompressor.min.js" type="text/javascript"></script>

<link rel="stylesheet" type="text/css" href="./jsxgraph.css" />
<script type="text/javascript">
<?php 
   jxgcompress("./prototype.js");
?>   
eval(JXG.decompress(jxgcompressed));

<?php 
   jxgcompress("../distrib/jsxgraphcore.js");
?>   
eval(JXG.decompress(jxgcompressed));
</script>
</head>

<body>
<h1>Bezier curves with the JSX Compressor</h1>
<div id="jxgbox" class="jxgbox" style="width:600px; height:600px;"></div>
<div id="debug" style="display:block;"></div>
<script type="text/javascript">
    /* <![CDATA[ */

        var board, i, p, col;
        board = JXG.JSXGraph.initBoard('jxgbox', {boundingbox:[-4,4,4,-4], keepaspectratio:true, axis:true});
        p = [];
        for (i=0;i<2*3+1;i++) {
            if (i%3==0) {
                col = 'red';
            } else {
                col = 'blue';
            }
            p.push(board.createElement('point',[Math.random()*8-4,Math.random()*8-4],{strokeColor:col,fillColor:col}));
        }
        var c = board.createElement('curve', JXG.Math.Numerics.bezier(p),{strokecolor:'blue', strokeWidth:2}); 
        
/* ]]> */
</script>

</body>
</html>

