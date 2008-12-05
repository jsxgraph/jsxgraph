<?php

$input = $_POST["input"];
$cmd = "/usr/bin/Rscript LokSkala.R '" . $input ."'";
passthru($cmd);

?>
