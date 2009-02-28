<?php
/* TODO:
 * working method for default boards, especially if there's > 1
 * return text around tags after parsing (the text before and after)
 * get around wordpress content char filter
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
  echo "\n<link rel='stylesheet' href='$css_url' type='text/css' media='screen' />\n";

  // prototype
  $prototype_url = "http://jsxgraph.uni-bayreuth.de/distrib/prototype.js";
  if (file_exists(get_bloginfo("template_url") . "/prototype.js")) {
    $prototype_url = get_bloginfo("template_url") . "/prototype.js";
  } else if (file_exists(get_bloginfo("wpurl") . "/wp-content/plugins/jsxgraph/prototype.js")) {
    $prototype_url = get_bloginfo("wpurl") . "/wp-content/plugins/jsxgraph/prototype.js";
  }
  echo "<script src='$prototype_url' type='text/javascript'></script>\n";

  // jsxgraph core
  $core_url = "http://jsxgraph.uni-bayreuth.de/distrib/jsxgraphcore.js";
  if (file_exists(TEMPLATEPATH . "/jsxgraphcore.js")) {
    $core_url = get_bloginfo("template_url") . "/jsxgraphcore.js";
  } else if (file_exists(get_bloginfo("wpurl") . "/wp-content/plugins/jsxgraph/jsxgraphcore.js")) {
    $core_url = get_bloginfo("wpurl") . "/wp-content/plugins/jsxgraph/jsxgraphcore.js";
  }
  echo "<script src='$core_url' type='text/javascript'></script>\n";
}

function jsxgraph_filter($text) {
	// to optimize speed, search for a jsxgraph-tag (avoiding to parse everything on every text)
	if(is_int(strpos($text, '<jsxgraph'))) {
		$jsxgraph_version = '0.1';
		$output  = '<!-- JSXGraph WordPress extension '. $jsxgraph_version .' -->';

		$jxg = array();
		// get every construction
		for($i = 0; $i < substr_count($text, '<jsxgraph'); $i++) {
			$start   = ($end) ? strpos($text, '<jsxgraph', $end) : strpos($text, '<jsxgraph');
			$start += 10;
			$end     = (is_int(strpos($text, '</jsxgraph>', $start))) ? strpos($text, '</jsxgraph>', $start) : strpos($text, '/>', $start);
			$jxg[$i] = substr($text, $start, $end-$start);
		}

		// parse parameters of construction
		for($i = 0; $i < sizeof($jxg); $i++) {
			$input = split(">", $jxg[$i]); // fix for javascript construction input
			$input[0] = str_replace("'", '', $input[0]);
			$input[0] = str_replace('"', '', $input[0]);
			$input[0] = str_replace(' ', '&', $input[0]);
			parse_str($input[0], $params);

			// defaults need to be changed if there's more than one box
			$outputDivId   = (isset($params['box']))      ? htmlspecialchars(strip_tags($params['box']))      : 'box'.$i;
			// defaults need to be changed if there's more than one board
			$outputBoardId = (isset($params['board']))    ? htmlspecialchars(strip_tags($params['board']))    : 'board'.$i;
			$width         = (isset($params['width']))    ? htmlspecialchars(strip_tags($params['width']))    : 500;
			$height        = (isset($params['height']))   ? htmlspecialchars(strip_tags($params['height']))   : 400;

			// Output div
			$output .= "<div id='". $outputDivId ."' class='jxgbox' style='width:". $width ."px; height:". $height ."px;'></div>";
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
				$output .= "  var ". $outputBoardId ." = JXG.JSXGraph.loadBoardFromFile('". $outputDivId."', '". $gxtURL ."', 'Geonext');";

			}
			// construction by filestring
			else if(isset($params['filestring'])) {
				$tmp = split("filestring=", $text);
				$tmp[1] = str_replace("'", '"', $tmp[1]);
				$tmp = split('"', $tmp[1]);
				$filestring = $tmp[1];
				$output .= "  var ". $outputBoardId ." = JXG.JSXGraph.loadBoardFromString('". $outputDivId ."', '". htmlspecialchars(strip_tags($filestring)) ."', 'Geonext');";
			}
			// construction by $input
			else {
				$output .= $input[1];
			}
			$output .= "</script>";
		}
	}

	return ($output) ? $output : $text;
}

// Add style and scripts
add_action('wp_head', 'jsxgraph_head');

// We want to run after other filters; hence, a priority of 99.
add_filter('the_content', 'jsxgraph_filter', 0);
add_filter('comment_text', 'jsxgraph_filter', 0);

?>