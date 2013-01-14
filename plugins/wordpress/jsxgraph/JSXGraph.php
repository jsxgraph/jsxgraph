<?php
/*
    Copyright 2008-2013
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software dual licensed under the GNU LGPL or MIT License.
    
    You can redistribute it and/or modify it under the terms of the
    
      * GNU Lesser General Public License as published by
        the Free Software Foundation, either version 3 of the License, or
        (at your option) any later version
      OR
      * MIT License: https://github.com/jsxgraph/jsxgraph/blob/master/LICENSE.MIT
    
    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.
    
    You should have received a copy of the GNU Lesser General Public License and
    the MIT License along with JSXGraph. If not, see <http://www.gnu.org/licenses/>
    and <http://opensource.org/licenses/MIT/>.
 */

/*
Plugin Name: JSXGraph
Plugin URI: http://jsxgraph.org
Description: Embedding jsxgraph constructions
Author: Peter Wilfahrt
Version: 0.82
Author URI: http://www.webconsul.de/
*/

/* TODO:
 * fix wordpress auto format
*/

function jsxgraph_head() {
  // Stylesheet
  $css_url = 'http://jsxgraph.uni-bayreuth.de/distrib/jsxgraph.css';
  if(file_exists('wp-content/plugins/jsxgraph/jsxgraph.css')) $css_url = get_bloginfo('wpurl') . '/wp-content/plugins/jsxgraph/jsxgraph.css';
  if(file_exists(get_bloginfo("template_url") . '/jsxgraph.css')) $css_url = get_bloginfo('template_url') . '/jsxgraph.css';

  // jsxgraph core
  $core_url = "http://jsxgraph.uni-bayreuth.de/distrib/jsxgraphcore.js";
  if(file_exists("wp-content/plugins/jsxgraph/jsxgraphcore.js")) $core_url = get_bloginfo("wpurl") ."/wp-content/plugins/jsxgraph/jsxgraphcore.js";

  $gxtreader_url = "http://jsxgraph.uni-bayreuth.de/distrib/GeonextReader.js";
  if(file_exists("wp-content/plugins/jsxgraph/GeonextReader.js")) $gxtreader_url = get_bloginfo("wpurl") ."/wp-content/plugins/jsxgraph/GeonextReader.js";

  // Header-Output
  echo "\n<link rel='stylesheet' type='text/css' href='$css_url' media='screen' />\n";
  echo "<script type='text/javascript' src='$pt_url'></script>\n";
  echo "<script type='text/javascript' src='$core_url'></script>\n";
  echo "<script type='text/javascript' src='$gxtreader_url'></script>\n";
}

function jsxgraph_filter($text) {
  if(is_int(strpos($text, '<jsxgraph'))) {

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

      $outputDivId   = (isset($params['box']))    ? htmlspecialchars(strip_tags($params['box']))    : 'box'.$i;
      $outputBoardId = (isset($params['board']))  ? htmlspecialchars(strip_tags($params['board']))  : 'board'.$i;
      $width         = (isset($params['width']))  ? htmlspecialchars(strip_tags($params['width']))  : 500;
      $height        = (isset($params['height'])) ? htmlspecialchars(strip_tags($params['height'])) : 400;

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
          $gxtURL = get_bloginfo('wpurl') . $gxtFile->getURL();
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
        for($j=1; $j<=sizeof($input); $j++) {
          ($j == 1 || $j == sizeof($input)) ? $output .= $input[$j] : $output .= ">". $input[$j];
		  }
      }
      $output .= "</script>";
      $output = preg_replace("/&#038;/", "&", $output);

      $text = substr_replace($text, $output, $start, $end-$start);
    }
  }

  return $text;
}

// Add style and scripts
add_action('wp_head', 'jsxgraph_head');

// We want to run after other filters; hence, a priority of 99.
add_filter('the_content', 'jsxgraph_filter', 99);
// JSXGraph not enabled by default.  30.9.09 A.Wassermann
// add_filter('comment_text', 'jsxgraph_filter', 99);

?>
