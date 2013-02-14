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


/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/* depends:
 jxg
 utils/type
 */

/**
 * @fileoverview The functions in this file help with the detection of the environment JSXGraph runs in. We can distinguish
 * between node.js, windows 8 app and browser, what rendering techniques are supported and (most of the time) if the device
 * the browser runs on is a tablet/cell or a desktop computer.
 */

define([], function () {

    "use strict";

    JXG.extend(JXG, /** @lends JXG */ {
        /**
         * Determines the property that stores the relevant information in the event object.
         * @type {String}
         * @default 'touches'
         */
        touchProperty: 'touches',

        /**
         * A document/window environment is available.
         * @type Boolean
         * @default false
         */
        isBrowser: typeof window === 'object' && typeof document === 'object',

        /**
         * Detect browser support for VML.
         * @returns {Boolean} True, if the browser supports VML.
         */
        supportsVML: function () {
            // From stackoverflow.com
            return this.isBrowser && !!document.namespaces;
        },

        /**
         * Detect browser support for SVG.
         * @returns {Boolean} True, if the browser supports SVG.
         */
        supportsSVG: function () {
            return this.isBrowser && document.implementation.hasFeature('http://www.w3.org/TR/SVG11/feature#BasicStructure', '1.1');
        },

        /**
         * Detect browser support for Canvas.
         * @returns {Boolean} True, if the browser supports HTML canvas.
         */
        supportsCanvas: function () {
            var hasCanvas = false;

            if (this.isNode()) {
                try {
                    require('canvas');
                    hasCanvas = true;
                } catch (err) { }
            }

            return hasCanvas || (this.isBrowser && !!document.createElement('canvas').getContext);
        },

        /**
         * True, if run inside a node.js environment.
         * @returns {Boolean}
         */
        isNode: function () {
            // this is not a 100% sure but should be valid in most cases
            return !this.isBrowser && typeof module === 'object' && !!module.exports;
        },

        /**
         * Checks if the environments supports the W3C Pointer Events API {@link http://www.w3.org/Submission/pointer-events/}
         * @return {Boolean}
         */
        supportsPointerEvents: function () {
            return JXG.isBrowser && window.navigator && (window.navigator.msPointerEnabled || window.navigator.pointerEnabled);
        },

        /**
         * Determine if the current browser supports touch events
         * @returns {Boolean} True, if the browser supports touch events.
         */
        isTouchDevice: function () {
            return this.isBrowser && document.documentElement.hasOwnProperty('ontouchstart');
        },

        /**
         * Detects if the user is using an Android powered device.
         * @returns {Boolean}
         */
        isAndroid: function () {
            return JXG.exists(navigator) && navigator.userAgent.toLowerCase().indexOf('android') > -1;
        },

        /**
         * Detects if the user is using the default Webkit browser on an Android powered device.
         * @returns {Boolean}
         */
        isWebkitAndroid: function () {
            return this.isAndroid() && navigator.userAgent.indexOf(' AppleWebKit/') > -1;
        },

        /**
         * Detects if the user is using a Apple iPad / iPhone.
         * @returns {Boolean}
         */
        isApple: function () {
            return JXG.exists(navigator) && (navigator.userAgent.indexOf('iPad') > -1 || navigator.userAgent.indexOf('iPhone') > -1);
        },

        /**
         * Detects if the user is using Safari on an Apple device.
         * @returns {Boolean}
         */
        isWebkitApple: function () {
            return this.isApple() && (navigator.userAgent.search(/Mobile\/[0-9A-Za-z\.]*Safari/) > -1);
        },

        /**
         * Returns true if the run inside a Windows 8 "Metro" App.
         * @return {Boolean}
         */
        isMetroApp: function () {
            return typeof window === 'object' && window.clientInformation && window.clientInformation.appName && window.clientInformation.appName.indexOf('MSAppHost') > -1;
        },

        /**
         * Internet Explorer version. Works only for IE > 4.
         * @type Number
         */
        ieVersion: (function () {
            var undef,
                v = 3,
                div = document.createElement('div'),
                all = div.getElementsByTagName('i');

            if (typeof document !== 'object') {
                return undef;
            }

            do {
                div.innerHTML = '<!--[if gt IE ' + (++v) + ']><' + 'i><' + '/i><![endif]-->';
            } while (all[0]);

            return v > 4 ? v : undef;

        }())
    });

    return JXG;
});