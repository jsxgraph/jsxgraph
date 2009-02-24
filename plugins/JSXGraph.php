<?php
/**
 * JSXGraph extension
 *
 * @author Peter Wilfahrt
 * @version 0.2
 */

/** Requirements:
 *  Allowing upload of .gxt-Files:
 *  - Add the following two lines to LocalSettings.php: 
 *      $wgFileExtensions[] = 'gxt';
 *      $wgVerifyMimeType = false;
 *  - Place this file into:
 *      Note: $IP stands for the root directory of your MediaWiki installation, the same directory that holds LocalSettings.php.
 *      $IP/extensions/JSXGraph.php
 *  - To install following line has to be added to LocalSettings.php:
 *      require_once("$IP/extensions/JSXGraph.php");
 *  - Now you can include JSXGraph drawings with a .gxt-file:
 *      <jsxgraph height="300" width="600" filename="myFile.gxt" />
 *    or providing a gxt-string:
 *      <jsxgraph height="300" width="600" filestring="$$GXT-binarystring should be here$$" />
 *    or providing a javascript-input:
 *      <jsxgraph height="300" width="600">
 *        var brd = JXG.JSXGraph....();
 *      </jsxgraph>
 *
 * jsxgraph-params: width, height, filename, filestring or $input (between <jsxgraph>-tags), box (default: jxgbox), board (default: brd), codebase (default: http://jsxgraph.uni-bayreuth.de/distrib)
 */
$jsxgraph_version = "0.2";

if(!defined('MEDIAWIKI')) {
  echo("This is an extension to the MediaWiki package and cannot be run standalone.\n");
  die(-1);
}
		
//Avoid unstubbing $wgParser too early on modern (1.12+) MW versions, as per r35980
if ( defined( 'MW_SUPPORTS_PARSERFIRSTCALLINIT' ) ) {
    $wgHooks['ParserFirstCallInit'][] = 'jsxgraphSetup';
    $wgHooks['ParserAfterTidy'][] = 'jsxgraphParserAfterTidy';
} else {
    $wgExtensionFunctions[] = 'jsxgraphSetup';
    $wgHooks['ParserAfterTidy'][] = 'jsxgraphParserAfterTidy';
}
 
$wgExtensionCredits['parserhook'][] = array(
  'name'        => 'JSXGraph MediaWiki Plugin',
  'author'      => 'Peter Wilfahrt',
  'url'         => 'http://www.jsxgraph.org/',
  'description' => 'Add [http://www.jsxgraph.org JSXGraph] to MediaWiki pages.',
  'version'     => $jsxgraph_version
);
 
function jsxgraphSetup() {
    global $wgParser;
    $wgParser->setHook( 'jsxgraph', 'jsxgraphOutput' );
    return true;
}
 
$markerList = array();
function jsxgraphOutput($input, $args, &$parser) {
  global $wgServer; // URL of the WIKI's server
  global $jsxgraph_version; // see line 9 of this file
  global $markerList;

  $error_message = "no error"; //will be overwritten, if error occurs
  $CRLF = "\r\n";

  // Look for required parameters
  if( !isset($args['width'])     ||
      !isset($args['height'])    ||
      !(isset($args['filename']) || isset($args['filestring']) || isset($input))
    ) {
      $error_message = "Missing parameter (width or height, filename, string or input).";
    }
  $output  = "<!-- JSXGraph MediaWiki extension " . $jsxgraph_version . " -->";
  
  $outputDivId   = (isset($args['box']))   ? htmlspecialchars(strip_tags($args['box']))   : 'jxgbox';
  $outputBoardId = (isset($args['board'])) ? htmlspecialchars(strip_tags($args['board'])) : 'brd';
  $outputURI = (isset($args['codebase'])) ? htmlspecialchars(strip_tags($args['codebase'])) : 'http://jsxgraph.uni-bayreuth.de/distrib';

  // Load necessary stylesheet und scripts
  $markercount = count($markerList);
  if ($markercount==0) {
    $output .= "<link rel='stylesheet' type='text/css' href='".$outputURI."/jsxgraph.css' />";
    $output .= "<script src='".$outputURI."/prototype.js' type='text/javascript'></script>";
    $output .= "<script src='".$outputURI."/jsxgraphcore.js' type='text/javascript'></script>";
  }
  // Output div
  $output .= "<div id='". $outputDivId ."' class='jxgbox' style='width:"
               . htmlspecialchars(strip_tags($args['width'])) .
             "px; height:"
               . htmlspecialchars(strip_tags($args['height'])) .
             "px;'></div>";

  // construction input method
  if(isset($args['filename'])) { // string of url to gxt-file
    // retrieve URL of .gxt file
    $gxtBinary = htmlspecialchars(strip_tags($args['filename']));
    $gxtFile = Image::newFromName($gxtBinary);
    if (!($gxtFile->exists() )) {
      $error_message = "File " . $gxtFile . " not found.";
    } else {
      $gxtURL = $wgServer . $gxtFile->getURL();
    }
    $output .= "<script type='text/javascript'>";
    $output .= "  var $outputBoardId = JXG.JSXGraph.loadBoardFromFile('$outputDivId', '". $gxtURL ."', 'Geonext');";
    $output .= "</script>";
  }
  if(isset($args['filestring'])) { // binary content of gxt-file
    $output .= "<script type='text/javascript'>";
    $output .= "  var $outputBoardId = JXG.JSXGraph.loadBoardFromString('$outputDivId', '". htmlspecialchars(strip_tags($args['filestring'])) ."', 'Geonext');";
    $output .= "</script>";
  }
  if(isset($input)) { // content between <jsxgraph>-tags
    $output .= "<script type='text/javascript'>".$input."</script>";
  }

  // if error occured, discard and output error message
  if ($error_message != "no error") {
        $output = "<p>Error in MediaWiki extension (JSXGraph.php): <em>" . $error_message. "</em></p>" . $CRLF;
  }

  // Send the output to the browser
  $marker = "jsxgraph-marker".$markercount."-jsxgraph";
  $markerList[$markercount] = $output;
  return $marker;
}

function jsxgraphParserAfterTidy(&$parser, &$text) {
    // find markers in $text
    // replace markers with actual output
    global $markerList;
    $keys = array();
    $marker_count = count($markerList);
    
    for ($i = 0; $i < $marker_count; $i++) {
        $keys[] = 'jsxgraph-marker' . $i . '-jsxgraph';
    }
    $text = str_replace($keys, $markerList, $text);
    return true;
}

?>