/*
    Copyright 2008-2025
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
    the MIT License along with JSXGraph. If not, see <https://www.gnu.org/licenses/>
    and <https://opensource.org/licenses/MIT/>.
 */

/*
    Some functionalities in this file were developed as part of a software project
    with students. We would like to thank all contributors for their help:

    Winter semester 2024/2025:
        Philipp Ditz,
        Florian Hein,
        Pirmin Hinderling,
        Tim Sauer
 */

/*global JXG: true, define: true, window: true*/
/*jslint nomen: true, plusplus: true*/

/**
 * @fileoverview In this file the Text element is defined.
 */

import JXG from "../jxg.js";
import Const from "./constants.js";
import GeometryElement from "./element.js";
import GeonextParser from "../parser/geonext.js";
import Env from "../utils/env.js";
import Type from "../utils/type.js";
import Mat from "../math/math.js";
import CoordsElement from "./coordselement.js";

var priv = {
    /**
     * @class
     * @ignore
     */
    HTMLSliderInputEventHandler: function () {
        this._val = parseFloat(this.rendNodeRange.value);
        this.rendNodeOut.value = this.rendNodeRange.value;
        this.board.update();
    }
};

/**
 * Construct and handle texts.
 *
 * The coordinates can be relative to the coordinates of an element
 * given in {@link JXG.Options#text.anchor}.
 *
 * MathJax, HTML and GEONExT syntax can be handled.
 * @class Creates a new text object. Do not use this constructor to create a text. Use {@link JXG.Board#create} with
 * type {@link Text} instead.
 * @augments JXG.GeometryElement
 * @augments JXG.CoordsElement
 * @param {string|JXG.Board} board The board the new text is drawn on.
 * @param {Array} coordinates An array with the user coordinates of the text.
 * @param {Object} attributes An object containing visual properties and optional a name and a id.
 * @param {string|function} content A string or a function returning a string.
 *
 */
JXG.Text = function (board, coords, attributes, content) {
    var tmp;

    this.constructor(board, attributes, Const.OBJECT_TYPE_TEXT, Const.OBJECT_CLASS_TEXT);

    this.element = this.board.select(attributes.anchor);
    this.coordsConstructor(coords, this.evalVisProp('islabel'));

    this.content = "";
    this.plaintext = "";
    this.plaintextOld = null;
    this.orgText = "";

    this.needsSizeUpdate = false;
    // Only used by infobox anymore
    this.hiddenByParent = false;

    /**
     * Width and height of the text element in pixel.
     *
     * @private
     * @type Array
     */
    this.size = [1.0, 1.0];
    this.id = this.board.setId(this, 'T');

    this.board.renderer.drawText(this);
    this.board.finalizeAdding(this);

    // Set text before drawing
    // this._createFctUpdateText(content);
    // this.updateText();

    // Set attribute visible to true. This is necessary to
    // create all sub-elements for button, input and checkbox
    tmp = this.visProp.visible;
    this.visProp.visible = true;
    this.setText(content);
    // Restore the correct attribute visible.
    this.visProp.visible = tmp;

    if (Type.isString(this.content)) {
        this.notifyParents(this.content);
    }
    this.elType = 'text';

    this.methodMap = Type.deepCopy(this.methodMap, {
        setText: "setTextJessieCode",
        // free: 'free',
        move: "setCoords",
        Size: "getSize",
        setAutoPosition: "setAutoPosition"
    });
};

JXG.Text.prototype = new GeometryElement();
Type.copyPrototypeMethods(JXG.Text, CoordsElement, 'coordsConstructor');

JXG.extend(
    JXG.Text.prototype,
    /** @lends JXG.Text.prototype */ {
        /**
         * @private
         * @param {Number} x
         * @param {Number} y
         * @returns {Boolean}
        */
        // Test if the screen coordinates (x,y) are in a small stripe
        // at the left side or at the right side of the text.
        // Sensitivity is set in this.board.options.precision.hasPoint.
        // If dragarea is set to 'all' (default), tests if the screen
        // coordinates (x,y) are in within the text boundary.
        hasPoint: function (x, y) {
            var lft, rt, top, bot, ax, ay, type, r;

            if (Type.isObject(this.evalVisProp('precision'))) {
                type = this.board._inputDevice;
                r = this.evalVisProp('precision.' + type);
            } else {
                // 'inherit'
                r = this.board.options.precision.hasPoint;
            }
            if (this.transformations.length > 0) {
                //Transform the mouse/touch coordinates
                // back to the original position of the text.
                lft = Mat.matVecMult(
                    Mat.inverse(this.board.renderer.joinTransforms(this, this.transformations)),
                    [1, x, y]
                );
                x = lft[1];
                y = lft[2];
            }

            ax = this.getAnchorX();
            if (ax === 'right') {
                lft = this.coords.scrCoords[1] - this.size[0];
            } else if (ax === 'middle') {
                lft = this.coords.scrCoords[1] - 0.5 * this.size[0];
            } else {
                lft = this.coords.scrCoords[1];
            }
            rt = lft + this.size[0];

            ay = this.getAnchorY();
            if (ay === 'top') {
                bot = this.coords.scrCoords[2] + this.size[1];
            } else if (ay === 'middle') {
                bot = this.coords.scrCoords[2] + 0.5 * this.size[1];
            } else {
                bot = this.coords.scrCoords[2];
            }
            top = bot - this.size[1];

            if (this.evalVisProp('dragarea') === 'all') {
                return x >= lft - r && x < rt + r && y >= top - r && y <= bot + r;
            }
            // e.g. 'small'
            return (
                y >= top - r &&
                y <= bot + r &&
                ((x >= lft - r && x <= lft + 2 * r) || (x >= rt - 2 * r && x <= rt + r))
            );
        },

        /**
         * This sets the updateText function of this element depending on the type of text content passed.
         * Used by {@link JXG.Text#_setText}.
         * @param {String|Function|Number} text
         * @private
         * @see JXG.Text#_setText
         */
        _createFctUpdateText: function (text) {
            var updateText, e, digits,
                resolvedText,
                i, that,
                ev_p = this.evalVisProp('parse'),
                ev_um = this.evalVisProp('usemathjax'),
                ev_uk = this.evalVisProp('usekatex'),
                convertJessieCode = false;

            this.orgText = text;

            if (Type.isFunction(text)) {
                /**
                 * Dynamically created function to update the content
                 * of a text. Can not be overwritten.
                 * <p>
                 * &lt;value&gt; tags will not be evaluated if text is provided by a function
                 * <p>
                 * Sets the property <tt>plaintext</tt> of the text element.
                 *
                 * @private
                 */
                this.updateText = function () {
                    resolvedText = text().toString(); // Evaluate function
                    if (ev_p && !ev_um && !ev_uk) {
                        this.plaintext = this.replaceSub(
                            this.replaceSup(
                                this.convertGeonextAndSketchometry2CSS(resolvedText, false)
                            )
                        );
                    } else {
                        this.plaintext = resolvedText;
                    }
                };
            } else {
                if (Type.isNumber(text) && this.evalVisProp('formatnumber')) {
                    if (this.evalVisProp('tofraction')) {
                        if (ev_um) {
                            this.content = '\\(' + Type.toFraction(text, true) + '\\)';
                        } else {
                            this.content = Type.toFraction(text, ev_uk);
                        }
                    } else {
                        digits = this.evalVisProp('digits');
                        if (this.useLocale()) {
                            this.content = this.formatNumberLocale(text, digits);
                        } else {
                            this.content = Type.toFixed(text, digits);
                        }
                    }
                } else if (Type.isString(text) && ev_p) {
                    if (this.evalVisProp('useasciimathml')) {
                        // ASCIIMathML
                        // value-tags are not supported
                        this.content = "'`" + text + "`'";
                    } else if (ev_um || ev_uk) {
                        // MathJax or KaTeX
                        // Replace value-tags by functions
                        // sketchofont is ignored
                        this.content = this.valueTagToJessieCode(text);
                        if (!Type.isArray(this.content)) {
                            // For some reason we don't have to mask backslashes in an array of strings
                            // anymore.
                            //
                            // for (i = 0; i < this.content.length; i++) {
                            //     this.content[i] = this.content[i].replace(/\\/g, "\\\\"); // Replace single backslash by double
                            // }
                            // } else {
                            this.content = this.content.replace(/\\/g, "\\\\"); // Replace single backslash by double
                        }
                    } else {
                        // No TeX involved.
                        // Converts GEONExT syntax into JavaScript string
                        // Short math is allowed
                        // Replace value-tags by functions
                        // Avoid geonext2JS calls
                        this.content = this.poorMansTeX(this.valueTagToJessieCode(text));
                    }
                    convertJessieCode = true;
                } else {
                    this.content = text;
                }

                // Generate function which returns the text to be displayed
                if (convertJessieCode) {
                    // Convert JessieCode to JS function
                    if (Type.isArray(this.content)) {
                        // This is the case if the text contained value-tags.
                        // These value-tags consist of JessieCode snippets
                        // which are now replaced by JavaScript functions
                        that = this;
                        for (i = 0; i < this.content.length; i++) {
                            if (this.content[i][0] !== '"') {
                                this.content[i] = this.board.jc.snippet(this.content[i], true, "", false);
                                for (e in this.content[i].deps) {
                                    this.addParents(this.content[i].deps[e]);
                                    this.content[i].deps[e].addChild(this);
                                }
                            }
                        }

                        updateText = function() {
                            var i, t,
                                digits = that.evalVisProp('digits'),
                                txt = '';

                            for (i = 0; i < that.content.length; i++) {
                                if (Type.isFunction(that.content[i])) {
                                    t = that.content[i]();
                                    if (that.useLocale()) {
                                        t = that.formatNumberLocale(t, digits);
                                    } else {
                                        t = Type.toFixed(t, digits);
                                    }
                                } else {
                                    t = that.content[i];
                                    // Instead of 't.at(t.length - 1)' also 't.(-1)' should work.
                                    // However in Moodle 4.2 't.(-1)' returns an empty string.
                                    // In plain HTML pages it works.
                                    if (t[0] === '"' && t[t.length - 1] === '"') {
                                        t = t.slice(1, -1);
                                    }
                                }

                                txt += t;
                            }
                            return txt;
                        };
                    } else {
                        updateText = this.board.jc.snippet(this.content, true, "", false);
                        for (e in updateText.deps) {
                            this.addParents(updateText.deps[e]);
                            updateText.deps[e].addChild(this);
                        }
                    }

                    // Ticks have been escaped in valueTagToJessieCode
                    this.updateText = function () {
                        this.plaintext = this.unescapeTicks(updateText());
                    };
                } else {
                    this.updateText = function () {
                        this.plaintext = this.content; // text;
                    };
                }
            }
        },

        /**
         * Defines new content. This is used by {@link JXG.Text#setTextJessieCode} and {@link JXG.Text#setText}. This is required because
         * JessieCode needs to filter all Texts inserted into the DOM and thus has to replace setText by setTextJessieCode.
         * @param {String|Function|Number} text
         * @returns {JXG.Text}
         * @private
         */
        _setText: function (text) {
            this._createFctUpdateText(text);

            // First evaluation of the string.
            // We need this for display='internal' and Canvas
            this.updateText();
            this.fullUpdate();

            // We do not call updateSize for the infobox to speed up rendering
            if (!this.board.infobox || this.id !== this.board.infobox.id) {
                this.updateSize(); // updateSize() is called at least once.
            }

            // This may slow down canvas renderer
            // if (this.board.renderer.type === 'canvas') {
            //     this.board.fullUpdate();
            // }

            return this;
        },

        /**
         * Defines new content but converts &lt; and &gt; to HTML entities before updating the DOM.
         * @param {String|function} text
         */
        setTextJessieCode: function (text) {
            var s;

            this.visProp.castext = text;
            if (Type.isFunction(text)) {
                s = function () {
                    return Type.sanitizeHTML(text());
                };
            } else {
                if (Type.isNumber(text)) {
                    s = text;
                } else {
                    s = Type.sanitizeHTML(text);
                }
            }

            return this._setText(s);
        },

        /**
         * Defines new content.
         * @param {String|function} text
         * @returns {JXG.Text} Reference to the text object.
         */
        setText: function (text) {
            return this._setText(text);
        },

        /**
         * Recompute the width and the height of the text box.
         * Updates the array {@link JXG.Text#size} with pixel values.
         * The result may differ from browser to browser
         * by some pixels.
         * In canvas an old IEs we use a very crude estimation of the dimensions of
         * the textbox.
         * JSXGraph needs {@link JXG.Text#size} for applying rotations in IE and
         * for aligning text.
         *
         * @return {this} [description]
         */
        updateSize: function () {
            var tmp,
                that,
                node,
                ev_d = this.evalVisProp('display');

            if (!Env.isBrowser || this.board.renderer.type === 'no') {
                return this;
            }
            node = this.rendNode;

            /**
             * offsetWidth and offsetHeight seem to be supported for internal vml elements by IE10+ in IE8 mode.
             */
            if (ev_d === "html" || this.board.renderer.type === 'vml') {
                if (Type.exists(node.offsetWidth)) {
                    that = this;
                    window.setTimeout(function () {
                        that.size = [node.offsetWidth, node.offsetHeight];
                        that.needsUpdate = true;
                        that.updateRenderer();
                    }, 0);
                    // In case, there is non-zero padding or borders
                    // the following approach does not longer work.
                    // s = [node.offsetWidth, node.offsetHeight];
                    // if (s[0] === 0 && s[1] === 0) { // Some browsers need some time to set offsetWidth and offsetHeight
                    //     that = this;
                    //     window.setTimeout(function () {
                    //         that.size = [node.offsetWidth, node.offsetHeight];
                    //         that.needsUpdate = true;
                    //         that.updateRenderer();
                    //     }, 0);
                    // } else {
                    //     this.size = s;
                    // }
                } else {
                    this.size = this.crudeSizeEstimate();
                }
            } else if (ev_d === 'internal') {
                if (this.board.renderer.type === 'svg') {
                    that = this;
                    window.setTimeout(function () {
                        try {
                            tmp = node.getBBox();
                            that.size = [tmp.width, tmp.height];
                            that.needsUpdate = true;
                            that.updateRenderer();
                        } catch (e) {}
                    }, 0);
                } else if (this.board.renderer.type === 'canvas') {
                    this.size = this.crudeSizeEstimate();
                }
            }

            return this;
        },

        /**
         * A very crude estimation of the dimensions of the textbox in case nothing else is available.
         * @returns {Array}
         */
        crudeSizeEstimate: function () {
            var ev_fs = parseFloat(this.evalVisProp('fontsize'));
            return [ev_fs * this.plaintext.length * 0.45, ev_fs * 0.9];
        },

        /**
         * Decode unicode entities into characters.
         * @param {String} string
         * @returns {String}
         */
        utf8_decode: function (string) {
            return string.replace(/&#x(\w+);/g, function (m, p1) {
                return String.fromCharCode(parseInt(p1, 16));
            });
        },

        /**
         * Replace _{} by &lt;sub&gt;
         * @param {String} te String containing _{}.
         * @returns {String} Given string with _{} replaced by &lt;sub&gt;.
         */
        replaceSub: function (te) {
            if (!te.indexOf) {
                return te;
            }

            var j,
                i = te.indexOf("_{");

            // The regexp in here are not used for filtering but to provide some kind of sugar for label creation,
            // i.e. replacing _{...} with <sub>...</sub>. What is passed would get out anyway.
            /*jslint regexp: true*/
            while (i >= 0) {
                te = te.slice(0, i) + te.slice(i).replace(/_\{/, "<sub>");
                j = te.indexOf("}", i + 4);
                if (j >= 0) {
                    te = te.slice(0, j) + te.slice(j).replace(/\}/, "</sub>");
                }
                i = te.indexOf("_{");
            }

            i = te.indexOf("_");
            while (i >= 0) {
                te = te.slice(0, i) + te.slice(i).replace(/_(.?)/, "<sub>$1</sub>");
                i = te.indexOf("_");
            }

            return te;
        },

        /**
         * Replace ^{} by &lt;sup&gt;
         * @param {String} te String containing ^{}.
         * @returns {String} Given string with ^{} replaced by &lt;sup&gt;.
         */
        replaceSup: function (te) {
            if (!te.indexOf) {
                return te;
            }

            var j,
                i = te.indexOf("^{");

            // The regexp in here are not used for filtering but to provide some kind of sugar for label creation,
            // i.e. replacing ^{...} with <sup>...</sup>. What is passed would get out anyway.
            /*jslint regexp: true*/
            while (i >= 0) {
                te = te.slice(0, i) + te.slice(i).replace(/\^\{/, "<sup>");
                j = te.indexOf("}", i + 4);
                if (j >= 0) {
                    te = te.slice(0, j) + te.slice(j).replace(/\}/, "</sup>");
                }
                i = te.indexOf("^{");
            }

            i = te.indexOf("^");
            while (i >= 0) {
                te = te.slice(0, i) + te.slice(i).replace(/\^(.?)/, "<sup>$1</sup>");
                i = te.indexOf("^");
            }

            return te;
        },

        /**
         * Return the width of the text element.
         * @returns {Array} [width, height] in pixel
         */
        getSize: function () {
            return this.size;
        },

        /**
         * Move the text to new coordinates.
         * @param {number} x
         * @param {number} y
         * @returns {object} reference to the text object.
         */
        setCoords: function (x, y) {
            var coordsAnchor, dx, dy;
            if (Type.isArray(x) && x.length > 1) {
                y = x[1];
                x = x[0];
            }

            if (this.evalVisProp('islabel') && Type.exists(this.element)) {
                coordsAnchor = this.element.getLabelAnchor();
                dx = (x - coordsAnchor.usrCoords[1]) * this.board.unitX;
                dy = -(y - coordsAnchor.usrCoords[2]) * this.board.unitY;

                this.relativeCoords.setCoordinates(Const.COORDS_BY_SCREEN, [dx, dy]);
            } else {
                this.coords.setCoordinates(Const.COORDS_BY_USER, [x, y]);
            }

            // this should be a local update, otherwise there might be problems
            // with the tick update routine resulting in orphaned tick labels
            this.fullUpdate();

            return this;
        },

        /**
         * Evaluates the text.
         * Then, the update function of the renderer
         * is called.
         */
        update: function (fromParent) {
            if (!this.needsUpdate) {
                return this;
            }

            this.updateCoords(fromParent);
            this.updateText();

            if (this.evalVisProp('display') === 'internal') {
                if (Type.isString(this.plaintext)) {
                    this.plaintext = this.utf8_decode(this.plaintext);
                }
            }

            this.checkForSizeUpdate();
            if (this.needsSizeUpdate) {
                this.updateSize();
            }

            return this;
        },

        /**
         * Used to save updateSize() calls.
         * Called in JXG.Text.update
         * That means this.update() has been called.
         * More tests are in JXG.Renderer.updateTextStyle. The latter tests
         * are one update off. But this should pose not too many problems, since
         * it affects fontSize and cssClass changes.
         *
         * @private
         */
        checkForSizeUpdate: function () {
            if (this.board.infobox && this.id === this.board.infobox.id) {
                this.needsSizeUpdate = false;
            } else {
                // For some magic reason it is more efficient on the iPad to
                // call updateSize() for EVERY text element EVERY time.
                this.needsSizeUpdate = this.plaintextOld !== this.plaintext;

                if (this.needsSizeUpdate) {
                    this.plaintextOld = this.plaintext;
                }
            }
        },

        /**
         * The update function of the renderer
         * is called.
         * @private
         */
        updateRenderer: function () {
            if (
                //this.board.updateQuality === this.board.BOARD_QUALITY_HIGH &&
                this.evalVisProp('autoposition')
            ) {
                this.setAutoPosition().updateConstraint();
            }
            return this.updateRendererGeneric('updateText');
        },

        /**
         * Converts shortened math syntax into correct syntax:  3x instead of 3*x or
         * (a+b)(3+1) instead of (a+b)*(3+1).
         *
         * @private
         * @param{String} expr Math term
         * @returns {string} expanded String
         */
        expandShortMath: function (expr) {
            var re = /([)0-9.])\s*([(a-zA-Z_])/g;
            return expr.replace(re, "$1*$2");
        },

        /**
         * Converts the GEONExT syntax of the <value> terms into JavaScript.
         * Also, all Objects whose name appears in the term are searched and
         * the text is added as child to these objects.
         * This method is called if the attribute parse==true is set.
         *
         * Obsolete, replaced by JXG.Text.valueTagToJessieCode
         *
         * @param{String} contentStr String to be parsed
         * @param{Boolean} [expand] Optional flag if shortened math syntax is allowed (e.g. 3x instead of 3*x).
         * @param{Boolean} [avoidGeonext2JS] Optional flag if geonext2JS should be called. For backwards compatibility
         * this has to be set explicitly to true.
         * @param{Boolean} [outputTeX] Optional flag which has to be true if the resulting term will be sent to MathJax or KaTeX.
         * If true, "_" and "^" are NOT replaced by HTML tags sub and sup. Default: false, i.e. the replacement is done.
         * This flag allows the combination of &lt;value&gt; tag containing calculations with TeX output.
         *
         * @deprecated
         * @private
         * @see JXG.GeonextParser#geonext2JS
         * @see JXG.Text#valueTagToJessieCode
         *
         */
        generateTerm: function (contentStr, expand, avoidGeonext2JS) {
            var res,
                term,
                i,
                j,
                plaintext = '""';

            // Revert possible jc replacement
            contentStr = contentStr || "";
            contentStr = contentStr.replace(/\r/g, "");
            contentStr = contentStr.replace(/\n/g, "");
            contentStr = contentStr.replace(/"/g, "'");
            contentStr = contentStr.replace(/'/g, "\\'");

            // Old GEONExT syntax, not (yet) supported as TeX output.
            // Otherwise, the else clause should be used.
            // That means, i.e. the <arc> tag and <sqrt> tag are not
            // converted into TeX syntax.
            contentStr = contentStr.replace(/&amp;arc;/g, "&ang;");
            contentStr = contentStr.replace(/<arc\s*\/>/g, "&ang;");
            contentStr = contentStr.replace(/&lt;arc\s*\/&gt;/g, "&ang;");
            contentStr = contentStr.replace(/&lt;sqrt\s*\/&gt;/g, "&radic;");

            contentStr = contentStr.replace(/&lt;value&gt;/g, "<value>");
            contentStr = contentStr.replace(/&lt;\/value&gt;/g, "</value>");

            // Convert GEONExT syntax into  JavaScript syntax
            i = contentStr.indexOf("<value>");
            j = contentStr.indexOf("</value>");
            if (i >= 0) {
                while (i >= 0) {
                    plaintext +=
                        ' + "' + this.replaceSub(this.replaceSup(contentStr.slice(0, i))) + '"';
                    // plaintext += ' + "' + this.replaceSub(contentStr.slice(0, i)) + '"';

                    term = contentStr.slice(i + 7, j);
                    term = term.replace(/\s+/g, ""); // Remove all whitespace
                    if (expand === true) {
                        term = this.expandShortMath(term);
                    }
                    if (avoidGeonext2JS) {
                        res = term;
                    } else {
                        res = GeonextParser.geonext2JS(term, this.board);
                    }
                    res = res.replace(/\\"/g, "'");
                    res = res.replace(/\\'/g, "'");

                    // GEONExT-Hack: apply rounding once only.
                    if (res.indexOf('toFixed') < 0) {
                        // output of a value tag
                        if (
                            Type.isNumber(
                                Type.bind(this.board.jc.snippet(res, true, '', false), this)()
                            )
                        ) {
                            // may also be a string
                            plaintext += '+(' + res + ').toFixed(' + this.evalVisProp('digits') + ')';
                        } else {
                            plaintext += '+(' + res + ')';
                        }
                    } else {
                        plaintext += '+(' + res + ')';
                    }

                    contentStr = contentStr.slice(j + 8);
                    i = contentStr.indexOf("<value>");
                    j = contentStr.indexOf("</value>");
                }
            }

            plaintext += ' + "' + this.replaceSub(this.replaceSup(contentStr)) + '"';
            plaintext = this.convertGeonextAndSketchometry2CSS(plaintext);

            // This should replace e.g. &amp;pi; by &pi;
            plaintext = plaintext.replace(/&amp;/g, "&");
            plaintext = plaintext.replace(/"/g, "'");

            return plaintext;
        },

        /**
         * Replace value-tags in string by JessieCode functions.
         * @param {String} contentStr
         * @returns String
         * @private
         * @example
         * "The x-coordinate of A is &lt;value&gt;X(A)&lt;/value&gt;"
         *
         */
        valueTagToJessieCode: function (contentStr) {
            var res, term,
                i, j,
                expandShortMath = true,
                textComps = [],
                tick = '"';

            contentStr = contentStr || "";
            contentStr = contentStr.replace(/\r/g, "");
            contentStr = contentStr.replace(/\n/g, "");

            contentStr = contentStr.replace(/&lt;value&gt;/g, "<value>");
            contentStr = contentStr.replace(/&lt;\/value&gt;/g, "</value>");

            // Convert content of value tag (GEONExT/JessieCode) syntax into JavaScript syntax
            i = contentStr.indexOf("<value>");
            j = contentStr.indexOf("</value>");
            if (i >= 0) {
                while (i >= 0) {
                    // Add string fragment before <value> tag
                    textComps.push(tick + this.escapeTicks(contentStr.slice(0, i)) + tick);

                    term = contentStr.slice(i + 7, j);
                    term = term.replace(/\s+/g, ""); // Remove all whitespace
                    if (expandShortMath === true) {
                        term = this.expandShortMath(term);
                    }
                    res = term;
                    res = res.replace(/\\"/g, "'").replace(/\\'/g, "'");

                    // // Hack: apply rounding once only.
                    // if (res.indexOf('toFixed') < 0) {
                    //     // Output of a value tag
                    //     // Run the JessieCode parser
                    //     if (
                    //         Type.isNumber(
                    //             Type.bind(this.board.jc.snippet(res, true, "", false), this)()
                    //         )
                    //     ) {
                    //         // Output is number
                    //         // textComps.push(
                    //         //     '(' + res + ').toFixed(' + this.evalVisProp('digits') + ')'
                    //         // );
                    //         textComps.push('(' + res + ')');
                    //     } else {
                    //         // Output is a string
                    //         textComps.push("(" + res + ")");
                    //     }
                    // } else {
                        textComps.push("(" + res + ")");
                    // }
                    contentStr = contentStr.slice(j + 8);
                    i = contentStr.indexOf("<value>");
                    j = contentStr.indexOf("</value>");
                }
            }
            // Add trailing string fragment
            textComps.push(tick + this.escapeTicks(contentStr) + tick);

            // return textComps.join(" + ").replace(/&amp;/g, "&");
            for (i = 0; i < textComps.length; i++) {
                textComps[i] = textComps[i].replace(/&amp;/g, "&");
            }
            return textComps;
        },

        /**
         * Simple math rendering using HTML / CSS only. In case of array,
         * handle each entry separately and return array with the
         * rendering strings.
         *
         * @param {String|Array} s
         * @returns {String|Array}
         * @see JXG.Text#convertGeonextAndSketchometry2CSS
         * @private
         * @see JXG.Text#replaceSub
         * @see JXG.Text#replaceSup
         * @see JXG.Text#convertGeonextAndSketchometry2CSS
         */
        poorMansTeX: function (s) {
            var i, a;
            if (Type.isArray(s)) {
                a = [];
                for (i = 0; i < s.length; i++) {
                    a.push(this.poorMansTeX(s[i]));
                }
                return a;
            }

            s = s
                .replace(/<arc\s*\/*>/g, "&ang;")
                .replace(/&lt;arc\s*\/*&gt;/g, "&ang;")
                .replace(/<sqrt\s*\/*>/g, "&radic;")
                .replace(/&lt;sqrt\s*\/*&gt;/g, "&radic;");
            return this.convertGeonextAndSketchometry2CSS(this.replaceSub(this.replaceSup(s)), true);
        },

        /**
         * Replace ticks by URI escape sequences
         *
         * @param {String} s
         * @returns String
         * @private
         *
         */
        escapeTicks: function (s) {
            return s.replace(/"/g, "%22").replace(/'/g, "%27");
        },

        /**
         * Replace escape sequences for ticks by ticks
         *
         * @param {String} s
         * @returns String
         * @private
         */
        unescapeTicks: function (s) {
            return s.replace(/%22/g, '"').replace(/%27/g, "'");
        },

        /**
         * Converts the GEONExT tags <overline> and <arrow> to
         * HTML span tags with proper CSS formatting.
         * @private
         * @see JXG.Text.poorMansTeX
         * @see JXG.Text._setText
         */
        convertGeonext2CSS: function (s) {
            if (Type.isString(s)) {
                s = s.replace(
                    /(<|&lt;)overline(>|&gt;)/g,
                    "<span style=text-decoration:overline;>"
                );
                s = s.replace(/(<|&lt;)\/overline(>|&gt;)/g, "</span>");
                s = s.replace(
                    /(<|&lt;)arrow(>|&gt;)/g,
                    "<span style=text-decoration:overline;>"
                );
                s = s.replace(/(<|&lt;)\/arrow(>|&gt;)/g, "</span>");
            }

            return s;
        },

        /**
         * Converts the sketchometry tag <sketchofont> to
         * HTML span tags with proper CSS formatting.
         *
         * @param {String|Function|Number} s Text
         * @param {Boolean} escape Flag if ticks should be escaped. Escaping is necessary
         * if s is a text. It has to be avoided if s is a function returning text.
         * @private
         * @see JXG.Text._setText
         * @see JXG.Text.convertGeonextAndSketchometry2CSS
         *
         */
        convertSketchometry2CSS: function (s, escape) {
            var t1 = "<span class=\"sketcho sketcho-inherit sketcho-",
                t2 = "\"></span>";

            if (Type.isString(s)) {
                if (escape) {
                    t1 = this.escapeTicks(t1);
                    t2 = this.escapeTicks(t2);
                }
                s = s.replace(/(<|&lt;)sketchofont(>|&gt;)/g, t1);
                s = s.replace(/(<|&lt;)\/sketchofont(>|&gt;)/g, t2);
            }

            return s;
        },

        /**
         * Alias for convertGeonext2CSS and convertSketchometry2CSS
         *
         * @param {String|Function|Number} s Text
         * @param {Boolean} escape Flag if ticks should be escaped
         * @private
         * @see JXG.Text.convertGeonext2CSS
         * @see JXG.Text.convertSketchometry2CSS
         */
        convertGeonextAndSketchometry2CSS: function (s, escape) {
            s = this.convertGeonext2CSS(s);
            s = this.convertSketchometry2CSS(s, escape);
            return s;
        },

        /**
         * Finds dependencies in a given term and notifies the parents by adding the
         * dependent object to the found objects child elements.
         * @param {String} content String containing dependencies for the given object.
         * @private
         */
        notifyParents: function (content) {
            var search,
                res = null;

            // revert possible jc replacement
            content = content.replace(/&lt;value&gt;/g, "<value>");
            content = content.replace(/&lt;\/value&gt;/g, "</value>");

            do {
                search = /<value>([\w\s*/^\-+()[\],<>=!]+)<\/value>/;
                res = search.exec(content);

                if (res !== null) {
                    GeonextParser.findDependencies(this, res[1], this.board);
                    content = content.slice(res.index);
                    content = content.replace(search, "");
                }
            } while (res !== null);

            return this;
        },

        // documented in element.js
        getParents: function () {
            var p;
            if (this.relativeCoords !== undefined) {
                // Texts with anchor elements, excluding labels
                p = [
                    this.relativeCoords.usrCoords[1],
                    this.relativeCoords.usrCoords[2],
                    this.orgText
                ];
            } else {
                // Other texts
                p = [this.Z(), this.X(), this.Y(), this.orgText];
            }

            if (this.parents.length !== 0) {
                p = this.parents;
            }

            return p;
        },

        /**
         * Returns the bounding box of the text element in user coordinates as an
         * array of length 4: [upper left x, upper left y, lower right x, lower right y].
         * The method assumes that the lower left corner is at position [el.X(), el.Y()]
         * of the text element el, i.e. the attributes anchorX, anchorY are ignored.
         *
         * <p>
         * <strong>Attention:</strong> for labels, [0, 0, 0, 0] is returned.
         *
         * @returns Array
         */
        bounds: function () {
            var c = this.coords.usrCoords;

            if (
                this.evalVisProp('islabel') ||
                this.board.unitY === 0 ||
                this.board.unitX === 0
            ) {
                return [0, 0, 0, 0];
            }
            return [
                c[1],
                c[2] + this.size[1] / this.board.unitY,
                c[1] + this.size[0] / this.board.unitX,
                c[2]
            ];
        },

        /**
         * Returns the value of the attribute "anchorX". If this equals "auto",
         * returns "left", "middle", or "right", depending on the
         * value of the attribute "position".
         * @returns String
         */
        getAnchorX: function () {
            var a = this.evalVisProp('anchorx');
            if (a === 'auto') {
                switch (this.visProp.position) {
                    case "top":
                    case "bot":
                        return 'middle';
                    case "rt":
                    case "lrt":
                    case "urt":
                        return 'left';
                    case "lft":
                    case "llft":
                    case "ulft":
                    default:
                        return 'right';
                }
            }
            return a;
        },

        /**
         * Returns the value of the attribute "anchorY". If this equals "auto",
         * returns "bottom", "middle", or "top", depending on the
         * value of the attribute "position".
         * @returns String
         */
        getAnchorY: function () {
            var a = this.evalVisProp('anchory');
            if (a === 'auto') {
                switch (this.visProp.position) {
                    case "top":
                    case "ulft":
                    case "urt":
                        return 'bottom';
                    case "bot":
                    case "lrt":
                    case "llft":
                        return 'top';
                    case "rt":
                    case "lft":
                    default:
                        return 'middle';
                }
            }
            return a;
        },

        /**
         * Computes the number of overlaps of a box of w pixels width, h pixels height
         * and center (x, y)
         *
         * An overlap occurs when either:
         * <ol>
         *   <li> For labels/points: Their bounding boxes intersect
         *   <li> For other objects: The object contains the center point of the box
         * </ol>
         *
         * @private
         * @param  {Number} x x-coordinate of the center (screen coordinates)
         * @param  {Number} y y-coordinate of the center (screen coordinates)
         * @param  {Number} w width of the box in pixel
         * @param  {Number} h width of the box in pixel
         * @param  {Array} [whiteList] array of ids which should be ignored
         * @return {Number}   Number of overlapping elements
         */
        getNumberOfConflicts: function(x, y, w, h, whiteList) {
            whiteList = whiteList || [];
            var count = 0,
                i, obj,
                coords,
                saveHasInnerPoints,
                savePointPrecision = this.board.options.precision.hasPoint,
                objCenterX, objCenterY,
                objWidth, objHeight;

            // set a new precision for hasPoint
            // this.board.options.precision.hasPoint = Math.max(w, h) * 0.5;
            this.board.options.precision.hasPoint = (w + h) * 0.3;

            // loop over all objects
            for (i = 0; i < this.board.objectsList.length; i++) {
                obj = this.board.objectsList[i];

                //Skip the object if it is not meant to influence label position
                if (
                    obj.visPropCalc.visible &&
                    obj !== this &&
                    whiteList.indexOf(obj.id) === -1 &&
                    obj.evalVisProp('ignoreforlabelautoposition') !== true
                ) {
                    // Save hasinnerpoints and temporarily disable to handle polygon areas
                    saveHasInnerPoints = obj.visProp.hasinnerpoints;
                    obj.visProp.hasinnerpoints = false;

                    // If is label or point use other conflict detection
                    if (
                        obj.visProp.islabel ||
                        obj.elementClass === Const.OBJECT_CLASS_POINT
                    ) {
                        // get coords and size of the object
                        coords = obj.coords.scrCoords;
                        objCenterX = coords[1];
                        objCenterY = coords[2];
                        objWidth = obj.size[0];
                        objHeight = obj.size[1];

                        // move coords to the center of the label
                        if (obj.visProp.islabel) {
                            // Vertical adjustment
                            if (obj.visProp.anchory === 'top') {
                                objCenterY = objCenterY + objHeight / 2;
                            } else {
                                objCenterY = objCenterY - objHeight / 2;
                            }

                            // Horizontal adjustment
                            if (obj.visProp.anchorx === 'left') {
                                objCenterX = objCenterX + objWidth / 2;
                            } else {
                                objCenterX = objCenterX - objWidth / 2;
                            }
                        } else {
                            // Points are treated dimensionless
                            objWidth = 0;
                            objHeight = 0;
                        }

                        // Check for overlap
                        if (
                            Math.abs(objCenterX - x) < (w + objWidth) / 2 &&
                            Math.abs(objCenterY - y) < (h + objHeight) / 2
                        ) {
                            count++;
                        }

                        //if not label or point check conflict with hasPoint
                    } else if (obj.hasPoint(x, y)) {
                        count++;
                    }

                    // Restore original hasinnerpoints
                    obj.visProp.hasinnerpoints = saveHasInnerPoints;
                }
            }

            // Restore original precision
            this.board.options.precision.hasPoint = savePointPrecision;

            return count;
        },
        /**
         * Calculates the score of a label position with a given radius and angle. The score is calculated by the following rules:
         * <ul>
         * <li> the maximum score is 0
         * <li> if the label is outside of the bounding box, the score is reduced by 1
         * <li> for each conflict, the score is reduced by 1
         * <li> the score is reduced by the displacement (angle difference between old and new position) of the label
         * <li> the score is reduced by the angle between the original label position and the new label position
         * </ul>
         *
         * @param {number} radius radius in pixels
         * @param {number} angle angle in radians
         * @returns {number} Position score, higher values indicate better positions
         */
        calculateScore: function(radius, angle) {
            var x, y, co, si, angleCurrentOffset, angleDifference,
                score = 0,
                cornerPoint = [0,0],
                w = this.getSize()[0],
                h = this.getSize()[1],
                anchorCoords,
                currentOffset = this.evalVisProp('offset'),
                boundingBox = this.board.getBoundingBox();

            if (this.evalVisProp('islabel') && Type.exists(this.element)) {
                anchorCoords = this.element.getLabelAnchor().scrCoords;
            } else {
                return 0;
            }
            co = Math.cos(angle);
            si = Math.sin(angle);

            // calculate new position with srccoords, radius and angle
            x = anchorCoords[1] + radius * co;
            y = anchorCoords[2] - radius * si;

            // if the label was placed on the left side of the element, the anchorx is set to "right"
            if (co < 0) {
                cornerPoint[0] = x - w;
                x -= w / 2;
            } else {
                cornerPoint[0] = x + w;
                x += w / 2;
            }

            // If the label was placed on the bottom side of the element, so the anchory is set to "top"
            if (si < 0) {
                cornerPoint[1] = y + h;
                y += h / 2;
            } else {
                cornerPoint[1] = y - h;
                y -= h / 2;
            }

            // If label was not in bounding box, score is reduced by 1
            if(
                cornerPoint[0] < 0 ||
                cornerPoint[0] > (boundingBox[2] - boundingBox[0]) * this.board.unitX ||
                cornerPoint[1] < 0 ||
                cornerPoint[1] > (boundingBox[1] - boundingBox[3]) * this.board.unitY
            ) {
                score -= 1;
            }

            // Per conflict, score is reduced by 1
            score -= this.getNumberOfConflicts(x, y, w, h, Type.evaluate(this.visProp.autopositionwhitelist));

            // Calculate displacement, minimum score is 0 if radius is minRadius, maximum score is < 1 when radius is maxRadius
            score -= radius / this.evalVisProp('autopositionmindistance') / 10 - 0.1;

            // Calculate angle between current offset and new offset
            angleCurrentOffset = Math.atan2(currentOffset[1], currentOffset[0]);

            // If angle is negative, add 2*PI to get positive angle
            if (angleCurrentOffset < 0) {
                angleCurrentOffset += 2 * Math.PI;
            }

            // Calculate displacement by angle between original label position and new label position,
            // use cos to check if angle is on the right side.
            // If both angles are on the right side and more than 180° apart, add 2*PI. e.g. 0.1 and 6.1 are near each other
            if (co > 0 && Math.cos(angleCurrentOffset) > 0 && Math.abs(angle - angleCurrentOffset) > Math.PI) {
                angleDifference = Math.abs(angle - angleCurrentOffset - 2 * Math.PI);
            } else {
                angleDifference = Math.abs(angle - angleCurrentOffset);
            }

            // Minimum score is 0 if angle difference is 0, maximum score is pi / 10
            score -= angleDifference / 10;

            return score;
        },

        /**
         * Automatically positions the label by finding the optimal position.
         * Aims to minimize conflicts while maintaining readability.
         * <p>
         * The method tests 60 different angles (0 to 2π) at 3 different distances (radii).
         * It evaluates each position using calculateScore(radius, angle) and chooses the position with the highest score.
         * Then the label's anchor points and offset are adjusted accordingly.
         *
         * @returns {JXG.Text} Reference to the text object.
         */
        setAutoPosition: function() {
            var radius, angle, radiusStep,
                i,
                bestScore = -Infinity, bestRadius, bestAngle,
                minRadius = this.evalVisProp('autopositionmindistance'),
                maxRadius = this.evalVisProp('autopositionmaxdistance'),
                score,
                co, si,
                currentOffset = this.evalVisProp('offset'),
                currentRadius,
                currentAngle,
                numAngles = 60,
                numRadius = 4;

            if (
                this === this.board.infobox ||
                !this.element ||
                !this.visPropCalc.visible ||
                !this.evalVisProp('islabel')
            ) {
                return this;
            }

            // Calculate current position
            currentRadius = Math.sqrt(currentOffset[0] * currentOffset[0] + currentOffset[1] * currentOffset[1]);
            currentAngle = Math.atan2(currentOffset[1], currentOffset[0]);

            if (this.calculateScore(currentRadius, currentAngle) === 0) {
                return this;
            }

            // Initialize search at min radius
            radius = minRadius;
            // Calculate step size
            radiusStep = (maxRadius - minRadius) / (numRadius - 1);

            // Test the different radii
            while (maxRadius - radius > -0.01) {

                // Radius gets bigger so just check if its smaller than maxnumber of angles.
                for (i = 0; i < numAngles; i++) {

                    // calculate angle
                    angle = i / numAngles * 2 * Math.PI;

                    // calculate score
                    score = this.calculateScore(radius, angle);

                    // if score is better than bestScore, set bestAngle, bestRadius and bestScore
                    if (score > bestScore) {
                        bestAngle = angle;
                        bestRadius = radius;
                        bestScore = score;
                    }

                    // if bestScore is 0, break, because it can't get better
                    if (bestScore === 0) {
                        radius = maxRadius;
                        break;
                    }
                }

                radius += radiusStep;
            }

            co = Math.cos(bestAngle);
            si = Math.sin(bestAngle);

            // If label is on the left side of the element, the anchorx is set to "right"
            if (co < 0) {
                this.visProp.anchorx = 'right';
            } else {
                this.visProp.anchorx = 'left';
            }

            // If label is on the bottom side of the element, so the anchory is set to "top"
            if (si < 0) {
                this.visProp.anchory = 'top';
            } else {
                this.visProp.anchory = 'bottom';
            }

            // Set offset
            this.visProp.offset = [bestRadius * co, bestRadius * si];

            return this;
        }

        // /**
        //  * Computes the number of overlaps of a box of w pixels width, h pixels height
        //  * and center (x, y)
        //  *
        //  * @private
        //  * @param  {Number} x x-coordinate of the center (screen coordinates)
        //  * @param  {Number} y y-coordinate of the center (screen coordinates)
        //  * @param  {Number} w width of the box in pixel
        //  * @param  {Number} h width of the box in pixel
        //  * @param  {Array} [whiteList] array of ids which should be ignored
        //  * @return {Number}   Number of overlapping elements
        //  */
        // getNumberOfConflicts: function (x, y, w, h, whiteList) {
        //     whiteList = whiteList || [];
        //     var count = 0,
        //         i, obj, le,
        //         savePointPrecision,
        //         saveHasInnerPoints;

        //     // Set the precision of hasPoint to half the max if label isn't too long
        //     savePointPrecision = this.board.options.precision.hasPoint;
        //     // this.board.options.precision.hasPoint = Math.max(w, h) * 0.5;
        //     this.board.options.precision.hasPoint = (w + h) * 0.25;
        //     // TODO:
        //     // Make it compatible with the objects' visProp.precision attribute
        //     for (i = 0, le = this.board.objectsList.length; i < le; i++) {
        //         obj = this.board.objectsList[i];
        //         saveHasInnerPoints = obj.visProp.hasinnerpoints;
        //         obj.visProp.hasinnerpoints = false;
        //         if (
        //             obj.visPropCalc.visible &&
        //             obj.elType !== "axis" &&
        //             obj.elType !== "ticks" &&
        //             obj !== this.board.infobox &&
        //             obj !== this &&
        //             obj.hasPoint(x, y) &&
        //             whiteList.indexOf(obj.id) === -1
        //         ) {
        //             count++;
        //         }
        //         obj.visProp.hasinnerpoints = saveHasInnerPoints;
        //     }
        //     this.board.options.precision.hasPoint = savePointPrecision;

        //     return count;
        // },

        // /**
        //  * Sets the offset of a label element to the position with the least number
        //  * of overlaps with other elements, while retaining the distance to its
        //  * anchor element. Twelve different angles are possible.
        //  *
        //  * @returns {JXG.Text} Reference to the text object.
        //  */
        // setAutoPosition: function () {
        //     var x, y, cx, cy,
        //         anchorCoords,
        //         // anchorX, anchorY,
        //         w = this.size[0],
        //         h = this.size[1],
        //         start_angle, angle,
        //         optimum = {
        //             conflicts: Infinity,
        //             angle: 0,
        //             r: 0
        //         },
        //         max_r, delta_r,
        //         conflicts, offset, r,
        //         num_positions = 12,
        //         step = (2 * Math.PI) / num_positions,
        //         j, dx, dy, co, si;

        //     if (
        //         this === this.board.infobox ||
        //         !this.visPropCalc.visible ||
        //         !this.evalVisProp('islabel') ||
        //         !this.element
        //     ) {
        //         return this;
        //     }

        //     // anchorX = this.evalVisProp('anchorx');
        //     // anchorY = this.evalVisProp('anchory');
        //     offset = this.evalVisProp('offset');
        //     anchorCoords = this.element.getLabelAnchor();
        //     cx = anchorCoords.scrCoords[1];
        //     cy = anchorCoords.scrCoords[2];

        //     // Set dx, dy as the relative position of the center of the label
        //     // to its anchor element ignoring anchorx and anchory.
        //     dx = offset[0];
        //     dy = offset[1];

        //     conflicts = this.getNumberOfConflicts(cx + dx, cy - dy, w, h, this.evalVisProp('autopositionwhitelist'));
        //     if (conflicts === 0) {
        //         return this;
        //     }
        //     // console.log(this.id, conflicts, w, h);
        //     // r = Geometry.distance([0, 0], offset, 2);

        //     r = this.evalVisProp('autopositionmindistance');
        //     max_r = this.evalVisProp('autopositionmaxdistance');
        //     delta_r = 0.2 * r;

        //     start_angle = Math.atan2(dy, dx);

        //     optimum.conflicts = conflicts;
        //     optimum.angle = start_angle;
        //     optimum.r = r;

        //     while (optimum.conflicts > 0 && r <= max_r) {
        //         for (
        //             j = 1, angle = start_angle + step;
        //             j < num_positions && optimum.conflicts > 0;
        //             j++
        //         ) {
        //             co = Math.cos(angle);
        //             si = Math.sin(angle);

        //             x = cx + r * co;
        //             y = cy - r * si;

        //             conflicts = this.getNumberOfConflicts(x, y, w, h, this.evalVisProp('autopositionwhitelist'));
        //             if (conflicts < optimum.conflicts) {
        //                 optimum.conflicts = conflicts;
        //                 optimum.angle = angle;
        //                 optimum.r = r;
        //             }
        //             if (optimum.conflicts === 0) {
        //                 break;
        //             }
        //             angle += step;
        //         }
        //         r += delta_r;
        //     }
        //     // console.log(this.id, "after", optimum)
        //     r = optimum.r;
        //     co = Math.cos(optimum.angle);
        //     si = Math.sin(optimum.angle);
        //     this.visProp.offset = [r * co, r * si];

        //     if (co < -0.2) {
        //         this.visProp.anchorx = 'right'
        //     } else if (co > 0.2) {
        //         this.visProp.anchorx = 'left'
        //     } else {
        //         this.visProp.anchorx = 'middle'
        //     }

        //     return this;
        // }
    }
);

/**
 * @class Constructs a text element.
 *
 * The coordinates can either be absolute (i.e. respective to the coordinate system of the board) or be relative to the coordinates of an element
 * given in {@link Text#anchor}.
 * <p>
 * HTML, MathJaX, KaTeX and GEONExT syntax can be handled.
 * <p>
 * There are two ways to display texts:
 * <ul>
 * <li> using the text element of the renderer (canvas or svg). In most cases this is the suitable approach if speed matters.
 * However, advanced rendering like MathJax, KaTeX or HTML/CSS are not possible.
 * <li> using HTML &lt;div&gt;. This is the most flexible approach. The drawback is that HTML can only be display "above" the geometry elements.
 * If HTML should be displayed in an inbetween layer, conder to use an element of type {@link ForeignObject} (available in svg renderer, only).
 * </ul>
 * @pseudo
 * @name Text
 * @augments JXG.Text
 * @constructor
 * @type JXG.Text
 *
 * @param {number,function_number,function_number,function_String,function} z_,x,y,str Parent elements for text elements.
 *                     <p>
 *   Parent elements can be two or three elements of type number, a string containing a GEONE<sub>x</sub>T
 *   constraint, or a function which takes no parameter and returns a number. Every parent element beside the last determines one coordinate.
 *   If a coordinate is
 *   given by a number, the number determines the initial position of a free text. If given by a string or a function that coordinate will be constrained
 *   that means the user won't be able to change the texts's position directly by mouse because it will be calculated automatically depending on the string
 *   or the function's return value. If two parent elements are given the coordinates will be interpreted as 2D affine Euclidean coordinates, if three such
 *   parent elements are given they will be interpreted as homogeneous coordinates.
 *                     <p>
 *                     The text to display may be given as string or as function returning a string.
 *
 * There is the attribute 'display' which takes the values 'html' or 'internal'. In case of 'html' an HTML division tag is created to display
 * the text. In this case it is also possible to use MathJax, KaTeX, or ASCIIMathML. If neither of these is used, basic Math rendering is
 * applied.
 * <p>
 * In case of 'internal', an SVG text element is used to display the text.
 * @see JXG.Text
 * @example
 * // Create a fixed text at position [0,1].
 *   var t1 = board.create('text',[0,1,"Hello World"]);
 * </pre><div class="jxgbox" id="JXG896013aa-f24e-4e83-ad50-7bc7df23f6b7" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var t1_board = JXG.JSXGraph.initBoard('JXG896013aa-f24e-4e83-ad50-7bc7df23f6b7', {boundingbox: [-3, 6, 5, -3], axis: true, showcopyright: false, shownavigation: false});
 *   var t1 = t1_board.create('text',[0,1,"Hello World"]);
 * </script><pre>
 * @example
 * // Create a variable text at a variable position.
 *   var s = board.create('slider',[[0,4],[3,4],[-2,0,2]]);
 *   var graph = board.create('text',
 *                        [function(x){ return s.Value();}, 1,
 *                         function(){return "The value of s is"+JXG.toFixed(s.Value(), 2);}
 *                        ]
 *                     );
 * </pre><div class="jxgbox" id="JXG5441da79-a48d-48e8-9e53-75594c384a1c" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *   var t2_board = JXG.JSXGraph.initBoard('JXG5441da79-a48d-48e8-9e53-75594c384a1c', {boundingbox: [-3, 6, 5, -3], axis: true, showcopyright: false, shownavigation: false});
 *   var s = t2_board.create('slider',[[0,4],[3,4],[-2,0,2]]);
 *   var t2 = t2_board.create('text',[function(x){ return s.Value();}, 1, function(){return "The value of s is "+JXG.toFixed(s.Value(), 2);}]);
 * </script><pre>
 * @example
 * // Create a text bound to the point A
 * var p = board.create('point',[0, 1]),
 *     t = board.create('text',[0, -1,"Hello World"], {anchor: p});
 *
 * </pre><div class="jxgbox" id="JXGff5a64b2-2b9a-11e5-8dd9-901b0e1b8723" style="width: 300px; height: 300px;"></div>
 * <script type="text/javascript">
 *     (function() {
 *         var board = JXG.JSXGraph.initBoard('JXGff5a64b2-2b9a-11e5-8dd9-901b0e1b8723',
 *             {boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});
 *     var p = board.create('point',[0, 1]),
 *         t = board.create('text',[0, -1,"Hello World"], {anchor: p});
 *
 *     })();
 *
 * </script><pre>
 *
 */
JXG.createText = function (board, parents, attributes) {
    var t,
        attr = Type.copyAttributes(attributes, board.options, 'text'),
        coords = parents.slice(0, -1),
        content = parents[parents.length - 1];

    // Backwards compatibility
    attr.anchor = attr.parent || attr.anchor;
    t = CoordsElement.create(JXG.Text, board, coords, attr, content);

    if (!t) {
        throw new Error(
            "JSXGraph: Can't create text with parent types '" +
                typeof parents[0] +
                "' and '" +
                typeof parents[1] +
                "'." +
                "\nPossible parent types: [x,y], [z,x,y], [element,transformation]"
        );
    }

    if (attr.rotate !== 0) {
        // This is the default value, i.e. no rotation
        t.addRotation(attr.rotate);
    }

    return t;
};

JXG.registerElement("text", JXG.createText);

/**
 * @class Labels are text objects tied to other elements like points, lines and curves.
 * Labels are handled internally by JSXGraph, only. There is NO constructor "board.create('label', ...)".
 *
 * @description
 * Labels for points are positioned with the attributes {@link Text#anchorX}, {@link Text#anchorX} and {@link Label#offset}.
 * <p>
 * Labels for lines, segments, curves and circles can be controlled additionally by the attributes {@link Label#position} and
 * {@link Label#distance}, i.e. for a segment [A, B] one could use the follwoing attributes:
 * <ul>
 * <li> "position": determines, where in the direction of the segment from A to B the label is placed
 * <li> "distance": determines the (orthogonal) distance of the label from the line segment. It is a factor which is multiplied by the font-size.
 * <li> "offset: [h, v]": a final correction in pixel (horizontally: h, vertically: v)
 * <li> "anchorX" ('left', 'middle', 'right') and "anchorY" ('bottom', 'middle', 'top'): determines which part of the
 * label string is the anchor position that is positioned to the coordinates determined by "position", "distance" and "offset".
 * </ul>
 *
 * @pseudo
 * @name Label
 * @augments JXG.Text
 * @constructor
 * @type JXG.Text
 */
//  See element.js#createLabel

/**
 * [[x,y], [w px, h px], [range]
 */
JXG.createHTMLSlider = function (board, parents, attributes) {
    var t,
        par,
        attr = Type.copyAttributes(attributes, board.options, 'htmlslider');

    if (parents.length !== 2 || parents[0].length !== 2 || parents[1].length !== 3) {
        throw new Error(
            "JSXGraph: Can't create htmlslider with parent types '" +
                typeof parents[0] +
                "' and '" +
                typeof parents[1] +
                "'." +
                "\nPossible parents are: [[x,y], [min, start, max]]"
        );
    }

    // Backwards compatibility
    attr.anchor = attr.parent || attr.anchor;
    attr.fixed = attr.fixed || true;

    par = [
        parents[0][0],
        parents[0][1],
        '<form style="display:inline">' +
            '<input type="range" /><span></span><input type="text" />' +
            "</form>"
    ];

    t = JXG.createText(board, par, attr);
    t.type = Type.OBJECT_TYPE_HTMLSLIDER;

    t.rendNodeForm = t.rendNode.childNodes[0];

    t.rendNodeRange = t.rendNodeForm.childNodes[0];
    t.rendNodeRange.min = parents[1][0];
    t.rendNodeRange.max = parents[1][2];
    t.rendNodeRange.step = attr.step;
    t.rendNodeRange.value = parents[1][1];

    t.rendNodeLabel = t.rendNodeForm.childNodes[1];
    t.rendNodeLabel.id = t.rendNode.id + "_label";

    if (attr.withlabel) {
        t.rendNodeLabel.innerText = t.name + "=";
    }

    t.rendNodeOut = t.rendNodeForm.childNodes[2];
    t.rendNodeOut.value = parents[1][1];

    try {
        t.rendNodeForm.id = t.rendNode.id + "_form";
        t.rendNodeRange.id = t.rendNode.id + "_range";
        t.rendNodeOut.id = t.rendNode.id + "_out";
    } catch (e) {
        JXG.debug(e);
    }

    t.rendNodeRange.style.width = attr.widthrange + 'px';
    t.rendNodeRange.style.verticalAlign = 'middle';
    t.rendNodeOut.style.width = attr.widthout + 'px';

    t._val = parents[1][1];

    if (JXG.supportsVML()) {
        /*
         * OnChange event is used for IE browsers
         * The range element is supported since IE10
         */
        Env.addEvent(t.rendNodeForm, "change", priv.HTMLSliderInputEventHandler, t);
    } else {
        /*
         * OnInput event is used for non-IE browsers
         */
        Env.addEvent(t.rendNodeForm, "input", priv.HTMLSliderInputEventHandler, t);
    }

    t.Value = function () {
        return this._val;
    };

    return t;
};

JXG.registerElement("htmlslider", JXG.createHTMLSlider);

export default JXG.Text;
// export default {
//     Text: JXG.Text,
//     createText: JXG.createText,
//     createHTMLSlider: JXG.createHTMLSlider
// };
