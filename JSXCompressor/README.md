JSXCompressor - Delivering compressed JavaScript
================================================

    The open source library JSXGraph (http://jsxgraph.org) contains utilities to read files which
    have been compressed by the ZLIB (http://zlib.org) library. That means, JSXGraph has a pure
    JavaScript implementation of DEFLATE, unzip and base64_decode. This can be used for delivering
    compressed JavaScript inside of an HTML file. Of course, with todays browsers it depends on
    the transmission bandwidth if this is worthwile. If the web server does not support compression
    of data, then this tool may be an option.


Authors
-------

    Alfred Wassermann <alfred.wassermann@uni-bayreuth.de>
    Michael Gerhaeuser <michael.gerhaeuser@gmail.com>
    Matthias Ehmann
    Carsten Miller


License
-------

    JSXCompressor is free software dual licensed under the GNU LGPL or Apache License.

    You can redistribute it and/or modify it under the terms of the

      * GNU Lesser General Public License as published by
        the Free Software Foundation, either version 3 of the License, or
        (at your option) any later version
      OR
      * Apache License Version 2.0

    JSXCompressor is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License and
    the Apache License along with JSXCompressor. If not, see <http://www.gnu.org/licenses/>
    and <https://www.apache.org/licenses/LICENSE-2.0.html>.

    This product includes software developed at
    Lehrstuhl fuer Mathematik und ihre Didaktik
    University of Bayreuth, Germany

    http://dmi.uni-bayreuth.de/


Usage
-----

One possibility to compress the JavaScript source is to use PHP. The code below
writes the content of a JavaScript file as a compressed, base64 encoded string
into the HTML. This string can be accessed via the JavaScript variable jsxcompressed.

<!-- -------------------------------------------------------- -->
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

<script type="text/javascript">
<?php 
    jxgcompress("./helloworld.js");
?>   
</script>
<!-- -------------------------------------------------------- -->

To uncompress and run this code, the following code has to be included:
<!-- -------------------------------------------------------- -->
<script src="./jsxcompressor.js" type="text/javascript"></script>
<script type="text/javascript">
eval(JXG.decompress(jxgcompressed));
</script>
<!-- -------------------------------------------------------- -->

Thats all.


Examples
--------

The zip file jsxcompressor.zip contains two examples: testhelloworld.php and testjsxgraph.php