<?php
/*
Plugin Name: JSXGraph
Plugin URI: http://jsxgraph.org
Description: Embeding jsxgraph constructions
Author: Peter Wilfahrt
Version: 0.1
Author URI: http://www.webconsul.de/
*/

/* TODO:
 * fix wordpress auto format
 * make downloadable package with styles/scripts
 * publish on wordpress.org
 * create an insert button with all parameters
*/

function jsxgraph_head() {
  // Stylesheet
  $css_url = 'http://jsxgraph.uni-bayreuth.de/distrib/jsxgraph.css';
  if (file_exists(get_bloginfo("template_url") . '/jsxgraph.css')) {
    $css_url = get_bloginfo('template_url') . '/jsxgraph.css';
  } else if (file_exists(get_bloginfo('wpurl') . '/wp-content/plugins/jsxgraph/jsxgraph.css')) {
	$css_url = get_bloginfo('wpurl') . '/wp-content/plugins/jsxgraph/jsxgraph.css';
  }
  echo "\n<link rel='stylesheet' type='text/css' href='$css_url' media='screen' />\n";

  // prototype
  $prototype_url = "http://jsxgraph.uni-bayreuth.de/distrib/prototype.js";
  if (file_exists(get_bloginfo("template_url") . "/prototype.js")) {
    $prototype_url = get_bloginfo("template_url") . "/prototype.js";
  } else if (file_exists(get_bloginfo("wpurl") . "/wp-content/plugins/jsxgraph/prototype.js")) {
    $prototype_url = get_bloginfo("wpurl") . "/wp-content/plugins/jsxgraph/prototype.js";
  }
  echo "<script type='text/javascript' src='$prototype_url'></script>\n";

  // jsxgraph core
  $core_url = "http://jsxgraph.uni-bayreuth.de/distrib/jsxgraphcore.js";
  if (file_exists(TEMPLATEPATH . "/jsxgraphcore.js")) {
    $core_url = get_bloginfo("template_url") . "/jsxgraphcore.js";
  } else if (file_exists(get_bloginfo("wpurl") . "/wp-content/plugins/jsxgraph/jsxgraphcore.js")) {
    $core_url = get_bloginfo("wpurl") . "/wp-content/plugins/jsxgraph/jsxgraphcore.js";
  }
  echo "<script type='text/javascript' src='$core_url'></script>\n";
}

function jsxgraph_filter($text) {
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
        $output .= html_entity_decode(htmlspecialchars_decode($input[1]));
      }
      $output .= "</script>";

      $text = substr_replace($text, $output, $start, $end-$start);
    }
  }

  return $text;
}

// Add style and scripts
add_action('wp_head', 'jsxgraph_head');

// We want to run after other filters; hence, a priority of 99.
add_filter('the_content', 'jsxgraph_filter', 99);
add_filter('comment_text', 'jsxgraph_filter', 99);

?>