<html>
<head>
<!--<script src="../distrib/jsxcompressor.js" type="text/javascript"></script>-->
<script>
JXG = {};
JXG.decompress = function(str) {
    return unescape((new JXG.Util.Unzip(JXG.Util.Base64.decodeAsArray(str))).unzip()[0][0]);
};
    
</script>
<script src="../src/Util.js" type="text/javascript"></script>
<body>
<h1>Using the JSX Compressor</h1>
<script type="text/javascript">

<?php
$txt = rawurlencode(file_get_contents("./test.js"));
$comp = gzcompress($txt,9);
$base64 = base64_encode($comp);
echo "var compressed = \"$base64\";";
?>

uncompressed = JXG.decompress(compressed);
alert(uncompressed);
eval(uncompressed);
</script>
</html>

