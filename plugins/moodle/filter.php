<?php

/* TODO:
 * working method for default boards, especially if there's > 1
 * return text around tags after parsing (the text before and after)
*/

function jsxgraph_filter($courseid, $text) {
	global $CFG;

	// to optimize speed, search for a jsxgraph-tag (avoiding to parse everything on every text)
	if(is_int(strpos($text, '<jsxgraph'))) {
		$jsxgraph_version = '0.1';
		$output  = '<!-- JSXGraph Moodle extension '. $jsxgraph_version .' -->';

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
			$outputURI     = (isset($params['codebase'])) ? htmlspecialchars(strip_tags($params['codebase'])) : 'http://jsxgraph.uni-bayreuth.de/distrib';
			$width         = (isset($params['width']))    ? htmlspecialchars(strip_tags($params['width']))    : 500;
			$height        = (isset($params['height']))   ? htmlspecialchars(strip_tags($params['height']))   : 400;

			// Load necessary stylesheet und scripts
			$output .= "<link rel='stylesheet' type='text/css' href='".$outputURI."/jsxgraph.css' />";
			$output .= "<script src='".$outputURI."/prototype.js' type='text/javascript'></script>";
			$output .= "<script src='".$outputURI."/jsxgraphcore.js' type='text/javascript'></script>";

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

?>