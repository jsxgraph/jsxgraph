/*
    Copyright 2008-2015
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


/*global JXG: true, define: true, window: true, document: true, navigator: true, module: true, global: true, self: true, require: true*/
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

define(['jxg', 'utils/type'], function (JXG, Type) {

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
            var c,
                hasCanvas = false;

            if (this.isNode()) {
                try {
                    c = (typeof module === 'object' ? module.require('canvas') : require('canvas'));
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

                // we are not inside a browser
            return !this.isBrowser && (
                // there is a module object (plain node, no requirejs)
                (typeof module === 'object' && !!module.exports) ||
                // there is a global object and requirejs is loaded
                (typeof global === 'object' && global.requirejsVars && !global.requirejsVars.isBrowser)
            );
        },

        /**
         * True if run inside a webworker environment.
         * @returns {Boolean}
         */
        isWebWorker: function () {
            return !this.isBrowser && (typeof self === 'object' && typeof self.postMessage === 'function');
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
            return this.isBrowser && window.ontouchstart !== undefined;
        },

        /**
         * Detects if the user is using an Android powered device.
         * @returns {Boolean}
         */
        isAndroid: function () {
            return Type.exists(navigator) && navigator.userAgent.toLowerCase().indexOf('android') > -1;
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
            return Type.exists(navigator) && (navigator.userAgent.indexOf('iPad') > -1 || navigator.userAgent.indexOf('iPhone') > -1);
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
            return typeof window === 'object' && window.clientInformation && window.clientInformation.appVersion && window.clientInformation.appVersion.indexOf('MSAppHost') > -1;
        },

        /**
         * Detects if the user is using a Mozilla browser
         * @returns {Boolean}
         */
        isMozilla: function () {
            return Type.exists(navigator) &&
                navigator.userAgent.toLowerCase().indexOf('mozilla') > -1 &&
                navigator.userAgent.toLowerCase().indexOf('apple') === -1;
        },

        /**
         * Detects if the user is using a firefoxOS powered device.
         * @returns {Boolean}
         */
        isFirefoxOS: function () {
            return Type.exists(navigator) &&
                navigator.userAgent.toLowerCase().indexOf('android') === -1 &&
                navigator.userAgent.toLowerCase().indexOf('apple') === -1 &&
                navigator.userAgent.toLowerCase().indexOf('mobile') > -1 &&
                navigator.userAgent.toLowerCase().indexOf('mozilla') > -1;
        },

        /**
         * Internet Explorer version. Works only for IE > 4.
         * @type Number
         */
        ieVersion: (function () {
            var undef, div, all,
                v = 3;

            if (typeof document !== 'object') {
                return 0;
            }

            div = document.createElement('div');
            all = div.getElementsByTagName('i');

            do {
                div.innerHTML = '<!--[if gt IE ' + (++v) + ']><' + 'i><' + '/i><![endif]-->';
            } while (all[0]);

            return v > 4 ? v : undef;

        }()),

        /**
         * Reads the width and height of an HTML element.
         * @param {String} elementId The HTML id of an HTML DOM node.
         * @returns {Object} An object with the two properties width and height.
         */
        getDimensions: function (elementId, doc) {
            var element, display, els, originalVisibility, originalPosition,
                originalDisplay, originalWidth, originalHeight, style,
                pixelDimRegExp = /\d+(\.\d*)?px/;

            if (!JXG.isBrowser || elementId === null) {
                return {
                    width: 500,
                    height: 500
                };
            }

            doc = doc || document;
            // Borrowed from prototype.js
            element = doc.getElementById(elementId);
            if (!Type.exists(element)) {
                throw new Error("\nJSXGraph: HTML container element '" + elementId + "' not found.");
            }

            display = element.style.display;

            // Work around a bug in Safari
            if (display !== 'none' && display !== null) {
                if (element.offsetWidth > 0 && element.offsetHeight > 0) {
                    return {width: element.offsetWidth, height: element.offsetHeight};
                } else { // a parent might be set to display:none; try reading them from styles
                    style = window.getComputedStyle ? window.getComputedStyle(element) : element.style;
                    return {
                        width: pixelDimRegExp.test(style.width) ? parseFloat(style.width) : 0,
                        height: pixelDimRegExp.test(style.height) ? parseFloat(style.height) : 0
                    };
                }
            }

            // All *Width and *Height properties give 0 on elements with display set to none,
            // hence we show the element temporarily
            els = element.style;

            // save style
            originalVisibility = els.visibility;
            originalPosition = els.position;
            originalDisplay = els.display;

            // show element
            els.visibility = 'hidden';
            els.position = 'absolute';
            els.display = 'block';

            // read the dimension
            originalWidth = element.clientWidth;
            originalHeight = element.clientHeight;

            // restore original css values
            els.display = originalDisplay;
            els.position = originalPosition;
            els.visibility = originalVisibility;

            return {
                width: originalWidth,
                height: originalHeight
            };
        },

        /**
         * Adds an event listener to a DOM element.
         * @param {Object} obj Reference to a DOM node.
         * @param {String} type The event to catch, without leading 'on', e.g. 'mousemove' instead of 'onmousemove'.
         * @param {Function} fn The function to call when the event is triggered.
         * @param {Object} owner The scope in which the event trigger is called.
         */
        addEvent: function (obj, type, fn, owner) {
            var el = function () {
                return fn.apply(owner, arguments);
            };

            el.origin = fn;
            owner['x_internal' + type] = owner['x_internal' + type] || [];
            owner['x_internal' + type].push(el);

            // Non-IE browser
            if (Type.exists(obj) && Type.exists(obj.addEventListener)) {
                obj.addEventListener(type, el, false);
            }

            // IE
            if (Type.exists(obj) && Type.exists(obj.attachEvent)) {
                obj.attachEvent('on' + type, el);
            }
        },

        /**
         * Removes an event listener from a DOM element.
         * @param {Object} obj Reference to a DOM node.
         * @param {String} type The event to catch, without leading 'on', e.g. 'mousemove' instead of 'onmousemove'.
         * @param {Function} fn The function to call when the event is triggered.
         * @param {Object} owner The scope in which the event trigger is called.
         */
        removeEvent: function (obj, type, fn, owner) {
            var i;

            if (!Type.exists(owner)) {
                JXG.debug('no such owner');
                return;
            }

            if (!Type.exists(owner['x_internal' + type])) {
                JXG.debug('no such type: ' + type);
                return;
            }

            if (!Type.isArray(owner['x_internal' + type])) {
                JXG.debug('owner[x_internal + ' + type + '] is not an array');
                return;
            }

            i = Type.indexOf(owner['x_internal' + type], fn, 'origin');

            if (i === -1) {
                JXG.debug('no such event function in internal list: ' + fn);
                return;
            }

            try {
                // Non-IE browser
                if (Type.exists(obj) && Type.exists(obj.removeEventListener)) {
                    obj.removeEventListener(type, owner['x_internal' + type][i], false);
                }

                // IE
                if (Type.exists(obj) && Type.exists(obj.detachEvent)) {
                    obj.detachEvent('on' + type, owner['x_internal' + type][i]);
                }
            } catch (e) {
                JXG.debug('event not registered in browser: (' + type + ' -- ' + fn + ')');
            }

            owner['x_internal' + type].splice(i, 1);
        },

        /**
         * Removes all events of the given type from a given DOM node; Use with caution and do not use it on a container div
         * of a {@link JXG.Board} because this might corrupt the event handling system.
         * @param {Object} obj Reference to a DOM node.
         * @param {String} type The event to catch, without leading 'on', e.g. 'mousemove' instead of 'onmousemove'.
         * @param {Object} owner The scope in which the event trigger is called.
         */
        removeAllEvents: function (obj, type, owner) {
            var i, len;
            if (owner['x_internal' + type]) {
                len = owner['x_internal' + type].length;

                for (i = len - 1; i >= 0; i--) {
                    JXG.removeEvent(obj, type, owner['x_internal' + type][i].origin, owner);
                }

                if (owner['x_internal' + type].length > 0) {
                    JXG.debug('removeAllEvents: Not all events could be removed.');
                }
            }
        },

        /**
         * Cross browser mouse / touch coordinates retrieval relative to the board's top left corner.
         * @param {Object} [e] The browsers event object. If omitted, <tt>window.event</tt> will be used.
         * @param {Number} [index] If <tt>e</tt> is a touch event, this provides the index of the touch coordinates, i.e. it determines which finger.
         * @param {Object} [doc] The document object.
         * @returns {Array} Contains the position as x,y-coordinates in the first resp. second component.
         */
        getPosition: function (e, index, doc) {
            var i, len, evtTouches,
                posx = 0,
                posy = 0;

            if (!e) {
                e = window.event;
            }

            doc = doc || document;
            evtTouches = e[JXG.touchProperty];

            // touchend events have their position in "changedTouches"
            if (Type.exists(evtTouches) && evtTouches.length === 0) {
                evtTouches = e.changedTouches;
            }

            if (Type.exists(index) && Type.exists(evtTouches)) {
                if (index === -1) {
                    len = evtTouches.length;

                    for (i = 0; i < len; i++) {
                        if (evtTouches[i]) {
                            e = evtTouches[i];
                            break;
                        }
                    }

                } else {
                    e = evtTouches[index];
                }
            }

            if (e.pageX || e.pageY) {
                posx = e.pageX;
                posy = e.pageY;
            } else if (e.clientX || e.clientY) {
                posx = e.clientX + doc.body.scrollLeft + doc.documentElement.scrollLeft;
                posy = e.clientY + doc.body.scrollTop + doc.documentElement.scrollTop;
            }

            return [posx, posy];
        },

        /**
         * Calculates recursively the offset of the DOM element in which the board is stored.
         * @param {Object} obj A DOM element
         * @returns {Array} An array with the elements left and top offset.
         */
        getOffset: function (obj) {
            var cPos,
                o = obj,
                o2 = obj,
                l = o.offsetLeft - o.scrollLeft,
                t = o.offsetTop - o.scrollTop;

            cPos = this.getCSSTransform([l, t], o);
            l = cPos[0];
            t = cPos[1];

            /*
             * In Mozilla and Webkit: offsetParent seems to jump at least to the next iframe,
             * if not to the body. In IE and if we are in an position:absolute environment
             * offsetParent walks up the DOM hierarchy.
             * In order to walk up the DOM hierarchy also in Mozilla and Webkit
             * we need the parentNode steps.
             */
            o = o.offsetParent;
            while (o) {
                l += o.offsetLeft;
                t += o.offsetTop;

                if (o.offsetParent) {
                    l += o.clientLeft - o.scrollLeft;
                    t += o.clientTop - o.scrollTop;
                }

                cPos = this.getCSSTransform([l, t], o);
                l = cPos[0];
                t = cPos[1];

                o2 = o2.parentNode;

                while (o2 !== o) {
                    l += o2.clientLeft - o2.scrollLeft;
                    t += o2.clientTop - o2.scrollTop;

                    cPos = this.getCSSTransform([l, t], o2);
                    l = cPos[0];
                    t = cPos[1];

                    o2 = o2.parentNode;
                }
                o = o.offsetParent;
            }
            return [l, t];
        },

        /**
         * Access CSS style sheets.
         * @param {Object} obj A DOM element
         * @param {String} stylename The CSS property to read.
         * @returns The value of the CSS property and <tt>undefined</tt> if it is not set.
         */
        getStyle: function (obj, stylename) {
            var r, doc;

            doc = obj.ownerDocument;

            // Non-IE
            if (window.getComputedStyle) {
                r = doc.defaultView.getComputedStyle(obj, null).getPropertyValue(stylename);
            // IE
            } else if (obj.currentStyle && JXG.ieVersion >= 9) {
                r = obj.currentStyle[stylename];
            } else {
                if (obj.style) {
                    // make stylename lower camelcase
                    stylename = stylename.replace(/-([a-z]|[0-9])/ig, function (all, letter) {
                        return letter.toUpperCase();
                    });
                    r = obj.style[stylename];
                }
            }

            return r;
        },

        /**
         * Reads css style sheets of a given element. This method is a getStyle wrapper and
         * defaults the read value to <tt>0</tt> if it can't be parsed as an integer value.
         * @param {DOMElement} el
         * @param {string} css
         * @returns {number}
         */
        getProp: function (el, css) {
            var n = parseInt(this.getStyle(el, css), 10);
            return isNaN(n) ? 0 : n;
        },

        /**
         * Correct position of upper left corner in case of
         * a CSS transformation. Here, only translations are
         * extracted. All scaling transformations are corrected
         * in {@link JXG.Board#getMousePosition}.
         * @param {Array} cPos Previously determined position
         * @param {Object} obj A DOM element
         * @returns {Array} The corrected position.
         */
        getCSSTransform: function (cPos, obj) {
            var i, j, str, arrStr, start, len, len2, arr,
                t = ['transform', 'webkitTransform', 'MozTransform', 'msTransform', 'oTransform'];

            // Take the first transformation matrix
            len = t.length;

            for (i = 0, str = ''; i < len; i++) {
                if (Type.exists(obj.style[t[i]])) {
                    str = obj.style[t[i]];
                    break;
                }
            }

            /**
             * Extract the coordinates and apply the transformation
             * to cPos
             */
            if (str !== '') {
                start = str.indexOf('(');

                if (start > 0) {
                    len = str.length;
                    arrStr = str.substring(start + 1, len - 1);
                    arr = arrStr.split(',');

                    for (j = 0, len2 = arr.length; j < len2; j++) {
                        arr[j] = parseFloat(arr[j]);
                    }

                    if (str.indexOf('matrix') === 0) {
                        cPos[0] += arr[4];
                        cPos[1] += arr[5];
                    } else if (str.indexOf('translateX') === 0) {
                        cPos[0] += arr[0];
                    } else if (str.indexOf('translateY') === 0) {
                        cPos[1] += arr[0];
                    } else if (str.indexOf('translate') === 0) {
                        cPos[0] += arr[0];
                        cPos[1] += arr[1];
                    }
                }
            }
            return cPos;
        },

        /**
         * Scaling CSS transformations applied to the div element containing the JSXGraph constructions
         * are determined. Not implemented are 'rotate', 'skew', 'skewX', 'skewY'.
         * @returns {Array} 3x3 transformation matrix. See {@link JXG.Board#updateCSSTransforms}.
         */
        getCSSTransformMatrix: function (obj) {
            var i, j, str, arrstr, start, len, len2, arr,
                t = ['transform', 'webkitTransform', 'MozTransform', 'msTransform', 'oTransform'],
                mat = [[1, 0, 0],
                    [0, 1, 0],
                    [0, 0, 1]];

            // Take the first transformation matrix
            len = t.length;
            for (i = 0, str = ''; i < len; i++) {
                if (Type.exists(obj.style[t[i]])) {
                    str = obj.style[t[i]];
                    break;
                }
            }

            if (str !== '') {
                start = str.indexOf('(');

                if (start > 0) {
                    len = str.length;
                    arrstr = str.substring(start + 1, len - 1);
                    arr = arrstr.split(',');

                    for (j = 0, len2 = arr.length; j < len2; j++) {
                        arr[j] = parseFloat(arr[j]);
                    }

                    if (str.indexOf('matrix') === 0) {
                        mat = [[1, 0, 0],
                            [0, arr[0], arr[1]],
                            [0, arr[2], arr[3]]];
                        // Missing are rotate, skew, skewX, skewY
                    } else if (str.indexOf('scaleX') === 0) {
                        mat[1][1] = arr[0];
                    } else if (str.indexOf('scaleY') === 0) {
                        mat[2][2] = arr[0];
                    } else if (str.indexOf('scale') === 0) {
                        mat[1][1] = arr[0];
                        mat[2][2] = arr[1];
                    }
                }
            }
            return mat;
        },

        /**
         * Process data in timed chunks. Data which takes long to process, either because it is such
         * a huge amount of data or the processing takes some time, causes warnings in browsers about
         * irresponsive scripts. To prevent these warnings, the processing is split into smaller pieces
         * called chunks which will be processed in serial order.
         * Copyright 2009 Nicholas C. Zakas. All rights reserved. MIT Licensed
         * @param {Array} items to do
         * @param {Function} process Function that is applied for every array item
         * @param {Object} context The scope of function process
         * @param {Function} callback This function is called after the last array element has been processed.
         */
        timedChunk: function (items, process, context, callback) {
            //create a clone of the original
            var todo = items.concat(),
                timerFun = function () {
                    var start = +new Date();

                    do {
                        process.call(context, todo.shift());
                    } while (todo.length > 0 && (+new Date() - start < 300));

                    if (todo.length > 0) {
                        window.setTimeout(timerFun, 1);
                    } else {
                        callback(items);
                    }
                };

            window.setTimeout(timerFun, 1);
        }
    });

    return JXG;
});
