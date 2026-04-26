<?php
$input = $_POST["input"];
if (!get_magic_quotes_gpc()) {
    $input = addslashes($input);
}
$cmd = "/usr/bin/Rscript LokSkala.R '" . $input ."'";
passthru($cmd);

?>
