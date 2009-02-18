<?php
/**
 * JSXGraph extension
 *
 * @author Peter Wilfahrt
 * @version 0.1
 */

/** Requirements:
 *  Allowing upload of .gxt-Files:
 *  - Add following two lines to LocalSettings.php: 
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
 */
 
$jsxgraph_version = "0.1";
 
//Avoid unstubbing $wgParser too early on modern (1.12+) MW versions, as per r35980
if ( defined( 'MW_SUPPORTS_PARSERFIRSTCALLINIT' ) ) {
  $wgHooks['ParserFirstCallInit'][] = 'jsxgraphSetup';
} else {
  $wgExtensionFunctions[] = 'jsxgraphSetup';
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
 
function jsxgraphOutput( $input, $args, $parser ) {
  global $wgServer; // URL of the WIKI's server
  global $jsxgraph_version; // see line 9 of this file
 
  $error_message = "no error"; //will be overwritten, if error occurs
  $CRLF = "\r\n";
  $quot='"';
 
  // TODO: alle möglichen Parameter auflisten
  // $parameter_array = array("type", "framePossible", "bgcolor", "borderColor", "enableRightClick", "enableShiftDragZoom", "showMenuBar"); 
 
  // Look for required parameters
  if( !isset($args['width'])     ||
      !isset($args['height'])    ||
      !(isset($args['filename']) || isset($args['filestring']))
    ) {
      $error_message = "Missing parameter (width or height, filename or string).";
    }
  $output  = "<!-- JSXGraph MediaWiki extension " . $jsxgraph_version . " by PW -->";
  
  // Load necessary stylesheet und scripts
  $output .= "<html>";
  $output .= "<link rel='stylesheet' type='text/css' href='http://jsxgraph.uni-bayreuth.de/distrib/jsxgraph.css' />";
  $output .= "<script src='http://jsxgraph.uni-bayreuth.de/distrib/prototype.js' type='text/javascript'></script>";
  $output .= "<script src='http://jsxgraph.uni-bayreuth.de/distrib/jsxgraphcore.js' type='text/javascript'></script>";
  // Output div
  $output .= "<div id='jxgbox' class='jxgbox' style='width:"
               . htmlspecialchars(strip_tags($args['width'])) .
             "px; height:"
               . htmlspecialchars(strip_tags($args['height'])) .
             "px;'></div>";
  if(isset($args['filename'])) {
    // retrieve URL of .gxt file
    $gxtBinary = htmlspecialchars(strip_tags($args['filename']));
    $gxtFile = Image::newFromName($gxtBinary);
    // if (!($gxtFile->exists())) {
    if (!($gxtFile->exists() )) {
      $error_message = "File " . $gxtFile . " not found.";
    } else {
      $gxtURL = $wgServer . $gxtFile->getURL();
    }
    $output .= "<script type='text/javascript'>";
    $output .= "  var brd = JXG.JSXGraph.loadBoardFromFile('jxgbox', '". $gxtURL ."', 'Geonext');";
    $output .= "</script>";
  }
  if(isset($args['filestring'])) {
    $output .= "<script type='text/javascript'>";
    $output .= "  var brd = JXG.JSXGraph.loadBoardFromString('jxgbox', '". htmlspecialchars(strip_tags($args['filestring'])) ."', 'Geonext');";
    $output .= "</script>";
  }
  $output .= "</html>";
  // if error occured, discard and output error message
  if ($error_message != "no error") {
        $output = "<p>Error in MediaWiki extension (JSXGraph.php): <em>" . $error_message. "</em></p>" . $CRLF;
  }
  // Send the output to the browser
  return $output;
}
?>