<?php

$t = "";
for ($i=0;$i<70;$i++) {
    $x = $i;
    $y = mt_rand(0,20);
    $t .= $x.','.$y.';';
}
echo $t;

?>
