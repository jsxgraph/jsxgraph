<?php
/*
    Copyright 2008-2021
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
Plugin URI: https://jsxgraph.org
Description: Embedding jsxgraph constructions
Author: Peter Wilfahrt, Alfred Wassermann
Version: 1.2.1
Author URI: http://www.webconsul.de/
*/

function jsxgraph_head() {
  // Include CSS file jsxgraph.css
  $css_url = 'https://jsxgraph.org/distrib/jsxgraph.css';
  if (file_exists('wp-content/plugins/jsxgraph/jsxgraph.css')) {
    $css_url = get_bloginfo('wpurl') . '/wp-content/plugins/jsxgraph/jsxgraph.css';
  }
  if (file_exists(get_bloginfo("template_url") . '/jsxgraph.css')) {
    $css_url = get_bloginfo('template_url') . '/jsxgraph.css';
  }

  // Include jsxgraphcore.js
  $core_url = "https://jsxgraph.org/distrib/jsxgraphcore.js";
  if (file_exists("wp-content/plugins/jsxgraph/jsxgraphcore.js")) {
    $core_url = get_bloginfo("wpurl") ."/wp-content/plugins/jsxgraph/jsxgraphcore.js";
  }

  // Include geonext.min.js
  $gxtreader_url = "https://jsxgraph.org/distrib/geonext.min.js";
  if (file_exists("wp-content/plugins/jsxgraph/geonext.min.js")) {
    $gxtreader_url = get_bloginfo("wpurl") ."/wp-content/plugins/jsxgraph/geonext.min.js";
  }

  // Header-Output
  echo "\n<link rel='stylesheet' type='text/css' href='$css_url' media='screen' />\n";
  echo "<script type='text/javascript' src='$core_url'></script>\n";
  echo "<script type='text/javascript' src='$gxtreader_url'></script>\n";
}

function jsxgraph_filter($text) {
    $dom = new DomDocument();
    @$dom->loadHTML($text);
    $jsxgraphTags = $dom->getElementsByTagName('jsxgraph');

    // if ($jsxgraphTags->length > 0) {
    //   // Include CSS file jsxgraph.css
    //   $css_url = 'https://jsxgraph.org/distrib/jsxgraph.css';
    //   if (file_exists('wp-content/plugins/jsxgraph/jsxgraph.css')) {
    //     $css_url = get_bloginfo('wpurl') . '/wp-content/plugins/jsxgraph/jsxgraph.css';
    //   }
    //   if (file_exists(get_bloginfo("template_url") . '/jsxgraph.css')) {
    //     $css_url = get_bloginfo('template_url') . '/jsxgraph.css';
    //   }
    //   wp_enqueue_style('jsxgraph', $css_url);

    //   // Include jsxgraphcore.js
    //   $core_url = "https://jsxgraph.org/distrib/jsxgraphcore.js";
    //   if (file_exists("wp-content/plugins/jsxgraph/jsxgraphcore.js")) {
    //     $core_url = get_bloginfo("wpurl") . "/wp-content/plugins/jsxgraph/jsxgraphcore.js";
    //   }
    //   wp_enqueue_script('jsxgraph', $core_url);

    //   // Include geonext.min.js
    //   $gxtreader_url = "https://jsxgraph.org/distrib/geonext.min.js";
    //   if (file_exists("wp-content/plugins/jsxgraph/geonext.min.js")) {
    //     $gxtreader_url = get_bloginfo("wpurl") ."/wp-content/plugins/jsxgraph/geonext.min.js";
    //   }
    //   wp_enqueue_script('jsxgraphgeonext', $gxtreader_url);
    // }

    for ($idx = $jsxgraphTags->length - 1; $idx >= 0; $idx--) {
      $tag = $jsxgraphTags[$idx];
      $outputDivId   = $tag->hasAttribute('box')    ? htmlspecialchars(strip_tags($tag->getAttribute('box')))    : 'box'.$idx;
      $outputBoardId = $tag->hasAttribute('board')  ? htmlspecialchars(strip_tags($tag->getAttribute('board')))  : 'board'.$idx;
      $width         = $tag->hasAttribute('width')  ? htmlspecialchars(strip_tags($tag->getAttribute('width')))  : 500;
      $height        = $tag->hasAttribute('height') ? htmlspecialchars(strip_tags($tag->getAttribute('height'))) : 400;

      // Add the output div
      $divEl = $dom->createElement('div');
      $divEl->setAttribute('id', $outputDivId);
      $divEl->setAttribute('class', 'jxgbox');
      $divEl->setAttribute('style', "width:" . $width . "px; height:" . $height . "px;");
      $tag->parentNode->insertBefore($divEl, $tag);

      if ($tag->hasAttribute('filename')) {
        // Construction from a GEONExT file
        $gxtBinary = htmlspecialchars(strip_tags($tag->getAttribute('filename')));
        $content = "  var ". $outputBoardId . " = JXG.JSXGraph.loadBoardFromFile('". $outputDivId . "', '" . $gxtBinary . "', 'Geonext');";

      } else if ($tag->hasAttribute('filestring')) {
        // Construction by filestring
        $filestring = htmlspecialchars(strip_tags($tag->getAttribute('filestring')));
        $content = "  var ". $outputBoardId . " = JXG.JSXGraph.loadBoardFromString('" . $outputDivId . "', '" . $filestring . "', 'Geonext');";

      } else {
        // Construction by JavaScript code 
        $content = $tag->nodeValue;
      }

      // Replace the jsxgraph tag by the script tag
      $scriptEl = $dom->createElement('script', $content);
      $scriptEl->setAttribute('type', 'text/javascript');
      $tag->parentNode->replaceChild($scriptEl, $tag);

   }
    return $dom->saveHTML();
}

// Add style and scripts
add_action('wp_head', 'jsxgraph_head');

// We want to run after other filters; hence, a priority of 99.
add_filter('the_content', 'jsxgraph_filter', 99);

// add_action('wp_head', 'wp_enqueue_scripts', 5);

?>
