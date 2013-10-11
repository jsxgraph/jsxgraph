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
</head>
<body>
<h1>Using the JSX Compressor</h1>
<script type="text/javascript">
<?php 
    jxgcompress("./helloworld.js");
?>   

eval(JXG.decompress(jxgcompressed));
</script>
</body>
</html>

