<?php
/*
    Copyright 2008-2013
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


/**
 * JSXGraph extension
 *
 * @author Alfred Wassermann
 * @author Peter Wilfahrt
 * @version 0.3.1
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
 * jsxgraph-params:
 *   width:    default: 500
 *   height:   default: 400
 *   modules:  default: "", additional javascript files that shoulde be loaded, comma separated and without the file
 *             extension. Those have to be in the same directory as the jsxgraphcore.js, e.g. "Square,JessieScript"
 *   filename, filestring or $input (between <jsxgraph>-tags) --> required
 *   box:      default: jxgbox
 *   board:    default: brd
 */
$jsxgraph_version = '0.3.1';

// CHANGE this to load local files:
$outputURI        = 'http://jsxgraph.uni-bayreuth.de/distrib';
$outputURICDN     = 'http://cdnjs.cloudflare.com/ajax/libs/jsxgraph/0.94';

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
  'author'      => 'Alfred Wassermann, Peter Wilfahrt',
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
function jsxgraphOutput($input, $args, $parser) {
  global $wgServer; // URL of the WIKI's server
  global $jsxgraph_version; // see line 9 of this file
  global $markerList;
  global $outputURI;
  global $outputURICDN;

  $error_message = "no error"; //will be overwritten, if error occurs
  $CRLF = "\r\n";

  // Look for required parameters
  if( !(isset($args['filename']) || isset($args['filestring']) || isset($input)) ) {
    $error_message = "Missing parameter (width or height, filename, string or input).";
  }
  $output  = "<!-- JSXGraph MediaWiki extension " . $jsxgraph_version . " -->";
  
  $markercount = count($markerList);
  if ($markercount>0) {
    $defaultBoard = "brd".$markercount;
    $defaultBox = "jxgbox".$markercount;
  } else {
    $defaultBoard = "brd";
    $defaultBox = "jxgbox";
  }
  $outputDivId   = (isset($args['box']))      ? htmlspecialchars(strip_tags($args['box']))      : $defaultBox;
  $outputBoardId = (isset($args['board']))    ? htmlspecialchars(strip_tags($args['board']))    : $defaultBoard;
  $width         = (isset($args['width']))    ? htmlspecialchars(strip_tags($args['width']))    : 500;
  $height        = (isset($args['height']))   ? htmlspecialchars(strip_tags($args['height']))   : 400;

  // Load necessary stylesheet und scripts
  if ($markercount==0) {
    $output .= "<link rel='stylesheet' type='text/css' href='".$outputURI."/jsxgraph.css' />";
    if (preg_match("/^XXXX132\.180/",getenv("REMOTE_ADDR"))) {
	     $output .= "<script src='".$outputURI."/jsxgraphcore.js' type='text/javascript'></script>";
	     $output .= "<script src='".$outputURI."/GeonextReader.js' type='text/javascript'></script>";
	 } else {
        $output .= "<script src='".$outputURICDN."/jsxgraphcore.js' type='text/javascript'></script>";
        $output .= "<script src='".$outputURICDN."/GeonextReader.min.js' type='text/javascript'></script>";
    }
  }

  if (isset($args['modules']) && trim($args['modules'])!="") { 
    $modules = explode(',', $args['modules']);
    for ($i = 0; $i < count($modules); $i++) {
      $output .= "<script src='".$outputURI."/".$modules[$i].".js' type='text/javascript'></script>";
    }
  }
  
  // Output div
  $output .= "<div id='". $outputDivId ."' class='jxgbox' style='width:". $width ."px; height:". $height ."px;'></div>";
  $output .= "<script type='text/javascript'>";

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
    $output .= "  var " . $outputBoardId ." = JXG.JSXGraph.loadBoardFromFile('" . $outputDivId."', '". $gxtURL ."', 'Geonext');";
  }
  if(isset($args['filestring'])) { // binary content of gxt-file
    $output .= "  var ".$outputBoardId ." = JXG.JSXGraph.loadBoardFromString('".$outputDivId."', '". htmlspecialchars(strip_tags($args['filestring'])) ."', 'Geonext');";
  }
  if(isset($input)) { // content between <jsxgraph>-tags
    $output .= $input;
  }
  $output .= "</script>";

  // if error occured, discard and output error message
  if ($error_message != "no error") {
        $output = "<p>Error in MediaWiki extension (JSXGraph.php): <em>" . $error_message. "</em></p>" . $CRLF;
  }

  // Send the output to the browser
  $marker = "jsxgraph-marker".$markercount."-jsxgraph";
  $markerList[$markercount] = $output;
  return $marker;
}

function jsxgraphParserAfterTidy($parser, $text) {
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
