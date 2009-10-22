<?php
/* 
    Copyright 2008,2009
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with JSXGraph.  If not, see <http://www.gnu.org/licenses/>.
*/
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
      $jxg = substr($text, $start+10, $end-$start-21);

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
        for($i=1; $i<=sizeof($input); $i++)
          ($i == 1 || $i == sizeof($input)) ? $output .= $input[$i] : $output .= ">". $input[$i];
      }
      $output .= "</script>";

      $text = substr_replace($text, $output, $start, $end-$start);
      if($head) $text = $head.$text;
    }
  }

  return $text;
}

?>