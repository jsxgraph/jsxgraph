<?php
/* TODO:
 * make downloadable package with styles/scripts
 * publish on moodle.org
 * create an insert button with all parameters
*/

function jsxgraph_filter($courseid, $text) {
  global $CFG;

  // to optimize speed, search for a jsxgraph-tag (avoiding to parse everything on every text)
  if(is_int(strpos($text, '<jsxgraph'))) {
    $jsxgraph_version = '0.1';

    // get every construction
    $count = substr_count($text, '<jsxgraph');
    for($i = 0; $i < $count; $i++) {
      $start = strpos($text, '<jsxgraph');
      $end = (is_int(strpos($text, '</jsxgraph>', $start))) ? strpos($text, '</jsxgraph>', $start)+11 : strpos($text, '/>', $start)+2;
      $jxg = substr($text, $start, $end-$start);

      // parse parameters of construction
      $input = split(">", $jxg); // fix for javascript construction input
      $input[0] = str_replace("'", '', $input[0]);
      $input[0] = str_replace('"', '', $input[0]);
      $input[0] = str_replace(' ', '&', $input[0]);
      parse_str($input[0], $params);

      $outputDivId   = (isset($params['box']))      ? htmlspecialchars(strip_tags($params['box']))      : 'box'.$i;
      $outputBoardId = (isset($params['board']))    ? htmlspecialchars(strip_tags($params['board']))    : 'board'.$i;
      $outputURI     = (isset($params['codebase'])) ? htmlspecialchars(strip_tags($params['codebase'])) : 'http://jsxgraph.uni-bayreuth.de/distrib';
      $width         = (isset($params['width']))    ? htmlspecialchars(strip_tags($params['width']))    : 500;
      $height        = (isset($params['height']))   ? htmlspecialchars(strip_tags($params['height']))   : 400;

      // Load necessary stylesheet und scripts
      if($i == 0) {
        $head  = '<!-- JSXGraph Moodle extension '. $jsxgraph_version .' -->';
        $head .= "<link rel='stylesheet' type='text/css' href='".$outputURI."/jsxgraph.css' />";
        $head .= "<script src='".$outputURI."/prototype.js' type='text/javascript'></script>";
        $head .= "<script src='".$outputURI."/jsxgraphcore.js' type='text/javascript'></script>";
      }

      // output div
      $output  = "<div id='". $outputDivId ."' class='jxgbox' style='width:". $width ."px; height:". $height ."px;'></div>";
      $output .= "<script type='text/javascript'>";

      // construction by filename
      if(isset($params['filename'])) {
        $gxtBinary = htmlspecialchars(strip_tags($params['filename']));
        $gxtFile = Image::newFromName($gxtBinary);
        if (!($gxtFile->exists() )) {
          $error_message = "File " . $gxtFile . " not found.";
        } else {
          $gxtURL = $CFG->wwwroot . $gxtFile->getURL();
        }
        $output .= "  var ". $outputBoardId ." = JXG.JSXGraph.loadBoardFromFile('". $outputDivId ."', '". $gxtURL ."', 'Geonext');";
      }
      // construction by filestring
      else if(isset($params['filestring'])) {
        $tmp = split("filestring=", $text);
        $tmp[1] = str_replace("'", '"', $tmp[1]);
        $tmp = split('"', $tmp[1]);
        $filestring = htmlspecialchars(strip_tags($tmp[1]));
        $output .= "  var ". $outputBoardId ." = JXG.JSXGraph.loadBoardFromString('". $outputDivId ."', '". $filestring ."', 'Geonext');";
      }
      // construction by $input
      else {
        $output .= $input[1];
      }
      $output .= "</script>";

      $text = substr_replace($text, $output, $start, $end-$start);
      if($head) $text = $head.$text;
    }
  }

  return $text;
}

?>