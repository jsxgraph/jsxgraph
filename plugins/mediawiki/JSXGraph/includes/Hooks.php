<?php
// phpcs:disable MediaWiki.NamingConventions.LowerCamelFunctionsName.FunctionName

/**
 * Hooks for jsxgraph extension.
 *
 * @file
 */

namespace MediaWiki\Extension\JSXGraph;

use MediaWiki\MediaWikiServices;
use Parser;
use PPFrame;

/** Hooks */
class Hooks implements
	\MediaWiki\Hook\ParserFirstCallInitHook,
	\MediaWiki\Hook\ParserAfterTidyHook
{

	private $markerList = array();

	/**
	 * Register parser hook.
     *
     * The content of tags of the form &lt;jsxgraph&gt;...&lt;/jsxgraph&gt;
     * is stored in the array $this->markerList
	 *
	 * @see https://www.mediawiki.org/wiki/Manual:Hooks/ParserFirstCallInit
	 * @see https://www.mediawiki.org/wiki/Manual:Parser_functions
	 * @param Parser $parser
	 * @throws \MWException
	 */
	public function onParserFirstCallInit($parser)
	{
		$parser->setHook('jsxgraph', [$this, 'parserTagJSXGraph']);
	}

    /**
     * After call of tidy, the required JSXGraph divs and script
     * tags are injected. jsxgraphcore.js is loaded only once.
     */
	public function onParserAfterTidy($parser, &$text)
	{
		$keys = array();
		$marker_count = count($this->markerList);

		for ($i = 0; $i < $marker_count; $i++) {
			$keys[] = 'jsxgraph-marker' . $i . '-jsxgraph';
		}
		$text = str_replace($keys, $this->markerList, $text);
		return true;
	}

	/**
	 * Parser hook handler for &lt;jsxgraph&gt;.
     * Called by onParserFirstCallInit
	 *
	 * @param string $data The content of the tag.
	 * @param array $attribs The attributes of the tag.
	 * @param Parser $parser Parser instance available to render
	 *  wikitext into html, or parser methods.
	 * @param PPFrame $frame Can be used to see what template
	 *  arguments ({{{1}}}) this hook was used with.
	 * @return string HTML to insert in the page.
	 */
	public function parserTagJSXGraph($data, $attribs, $parser, $frame)
	{
		$jsxgraph = [
			'content' => $data,
			'attributes' => (object) $attribs,
		];
		return $this->markJSXGraphTags($jsxgraph);
	}

    /**
     * Here, the real work is done. The attributes of the jsxgraph tag are analyzed,
     * the JSXGraph divs are created, source code is stored.
     */
	private function markJSXGraphTags($jsxgraph)
	{
		$output = "";
		$attr = json_decode(json_encode($jsxgraph["attributes"]), true);
		$error_message = "no error";

		$markercount = count($this->markerList);
		if ($markercount > 0) {
			$default_board = "brd" . $markercount;
			$default_box = "jxgbox" . $markercount;
		} else {
			$default_board = "brd";
			$default_box = "jxgbox";
		}

		if (!(isset($args['filename']) || isset($args['filestring']) || isset($jsxgraph["content"]))) {
			$error_message = "Missing parameter (width or height, filename, string or input).";
		}

		$outputURI = '//jsxgraph.uni-bayreuth.de/~alfred/jsxgraph/distrib';
		// $jsxgraph_version = "";
		// $outputURICDN = 'https://cdn.jsdelivr.net/npm/jsxgraph@' . $jsxgraph_version . '/distrib';
		$outputURICDN = 'https://cdn.jsdelivr.net/npm/jsxgraph/distrib';

		$outputDivId = (isset($attr['box'])) ? htmlspecialchars(strip_tags($attr['box'])) : $default_box;
		$outputBoardId = (isset($attr['board'])) ? htmlspecialchars(strip_tags($attr['board'])) : $default_board;
		$width = (isset($attr['width'])) ? htmlspecialchars(strip_tags($attr['width'])) : 500;
		$height = (isset($attr['height'])) ? htmlspecialchars(strip_tags($attr['height'])) : 400;

		if ($markercount == 0) {
			if (FALSE && preg_match("/^132\.180/", getenv("REMOTE_ADDR"))) {
				// Use the local version when developing
				$output .= "<pre>IP:". getenv("REMOTE_ADDR") ." - use developer version</pre>";
				$output .= "<link rel='stylesheet' type='text/css' href='" . $outputURI . "/jsxgraph.css' />";
				$output .= "<script src='" . $outputURI . "/jsxgraphcore.js' type='text/javascript'></script>";
				$output .= "<script src='" . $outputURI . "/geonext.min.js' type='text/javascript'></script>";
			} else {
				$output .= "<link rel='stylesheet' type='text/css' href='" . $outputURICDN . "/jsxgraph.css' />";
				$output .= "<script src='" . $outputURICDN . "/jsxgraphcore.js' type='text/javascript'></script>";
				$output .= "<script src='" . $outputURICDN . "/geonext.min.js' type='text/javascript'></script>";
			}
		}
		if (isset($attr['modules']) && trim($attr['modules']) != "") {
			$modules = explode(',', $attr['modules']);
			for ($i = 0; $i < count($modules); $i++) {
				$output .= "<script src='" . $outputURI . "/" . $modules[$i] . ".js'></script>";
			}
		}

		$output .= "<div id='" . $outputDivId . "' class='jxgbox' style='width:" . $width . "px; height:" . $height . "px;'></div>";
		$output .= "<script>";


		if (isset($attr['filename'])) { // string of url to gxt-file
			// retrieve URL of .gxt file
			$gxtBinary = htmlspecialchars(strip_tags($attr['filename']));
			$gxtFile = MediaWikiServices::getInstance()->getRepoGroup()->findFile()($gxtBinary);
			if (!($gxtFile->exists())) {
				$error_message = "File " . $gxtFile . " not found.";
			} else {
				$gxtURL = $wgCanonicalServer . $gxtFile->getURL();
			}
			$output .= "  var " . $outputBoardId . " = JXG.JSXGraph.loadBoardFromFile('" . $outputDivId . "', '" . $gxtURL . "', 'Geonext');";
		}
		if (isset($attr['filestring'])) { // binary content of gxt-file
			$output .= "  var " . $outputBoardId .
				" = JXG.JSXGraph.loadBoardFromString('"
				. $outputDivId . "', '" . htmlspecialchars(strip_tags($attr['filestring'])) . "', 'Geonext');";
		}
		if (isset($jsxgraph["content"])) { // content between <jsxgraph>-tags
			$output .= $jsxgraph["content"];
		}
		$output .= "</script>";

		if ($error_message != "no error") {
			$output = "<p>Error in MediaWiki extension (JSXGraph.php): <em>" . $error_message . "</em></p>\n";
		}

		$marker = "jsxgraph-marker" . $markercount . "-jsxgraph";
		$this->markerList[$markercount] = $output;
		return $marker;
	}
}


