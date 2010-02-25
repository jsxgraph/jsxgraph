<?php
$fp = fopen ("http://finance.yahoo.com/d/quotes.csv?s=^gdaxi&f=sl1d1t1c1ohgv&e=.csv","r");
echo fgets ($fp, 1024);
fclose ($fp);
?>
