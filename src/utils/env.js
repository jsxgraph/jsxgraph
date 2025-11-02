/*
    Copyright 2008-2025
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Andreas Walter,
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

/*global JXG: true, define: true, window: true, document: true, navigator: true, module: true, global: true, self: true, require: true*/
/*jslint nomen: true, plusplus: true*/

/**
 * @fileoverview The functions in this file help with the detection of the environment JSXGraph runs in. We can distinguish
 * between node.js, windows 8 app and browser, what rendering techniques are supported and (most of the time) if the device
 * the browser runs on is a tablet/cell or a desktop computer.
 */

import JXG from "../jxg.js";
import Type from "./type.js";

JXG.extendConstants(
    JXG,
    /** @lends JXG */ {
        // /**
        //  * Determines the property that stores the relevant information in the event object.
        //  * @type String
        //  * @default 'touches'
        //  * @private
        //  */
        // touchProperty: "touches"
    }
);

JXG.extend(
    JXG,
    /** @lends JXG */ {
        /**
         * Determines whether evt is a touch event.
         * @param evt {Event}
         * @returns {Boolean}
         */
        isTouchEvent: function (evt) {
            return JXG.exists(evt['touches']); // Old iOS touch events
        },

        /**
         * Determines whether evt is a pointer event.
         * @param evt {Event}
         * @returns {Boolean}
         */
        isPointerEvent: function (evt) {
            return JXG.exists(evt.pointerId);
        },

        /**
         * Determines whether evt is neither a touch event nor a pointer event.
         * @param evt {Event}
         * @returns {Boolean}
         */
        isMouseEvent: function (evt) {
            return !JXG.isTouchEvent(evt) && !JXG.isPointerEvent(evt);
        },

        /**
         * Determines the number of touch points in a touch event.
         * For other events, -1 is returned.
         * @param evt {Event}
         * @returns {Number}
         */
        getNumberOfTouchPoints: function (evt) {
            var n = -1;

            if (JXG.isTouchEvent(evt)) {
                n = evt['touches'].length;
            }

            return n;
        },

        /**
         * Checks whether an mouse, pointer or touch event evt is the first event of a multitouch event.
         * Attention: When two or more pointer device types are being used concurrently,
         *            it is only checked whether the passed event is the first one of its type!
         * @param evt {Event}
         * @returns {boolean}
         */
        isFirstTouch: function (evt) {
            var touchPoints = JXG.getNumberOfTouchPoints(evt);

            if (JXG.isPointerEvent(evt)) {
                return evt.isPrimary;
            }

            return touchPoints === 1;
        },

        /**
         * A document/window environment is available.
         * @type Boolean
         * @default false
         */
        isBrowser: Type.exists(window) && Type.exists(document) &&
            typeof window === "object" && typeof document === "object",

        /**
         * Features of ECMAScript 6+ are available.
         * @type Boolean
         * @default false
         */
        supportsES6: function () {
            // var testMap;
            /* jshint ignore:start */
            try {
                // This would kill the old uglifyjs: testMap = (a = 0) => a;
                new Function("(a = 0) => a");
                return true;
            } catch (err) {
                return false;
            }
            /* jshint ignore:end */
        },

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
            var svgSupport;
            if (!this.isBrowser) {
                return false;
            }
            svgSupport = !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect;
            return svgSupport;
        },

        /**
         * Detect browser support for Canvas.
         * @returns {Boolean} True, if the browser supports HTML canvas.
         */
        supportsCanvas: function () {
            var hasCanvas = false;

            // if (this.isNode()) {
            //     try {
            //         // c = typeof module === "object" ? module.require('canvas') : $__canvas;
            //         c = typeof module === "object" ? module.require('canvas') : import('canvas');
            //         hasCanvas = !!c;
            //     } catch (err) {}
            // }

            if (this.isNode()) {
                //try {
                //    JXG.createCanvas(500, 500);
                    hasCanvas = true;
                // } catch (err) {
                //     throw new Error('JXG.createCanvas not available.\n' +
                //         'Install the npm package `canvas`\n' +
                //         'and call:\n' +
                //         '    import { createCanvas } from 'canvas.js'\n' +
                //         '    JXG.createCanvas = createCanvas;\n');
                // }
            }

            return (
                hasCanvas || (this.isBrowser && !!document.createElement('canvas').getContext)
            );
        },

        /**
         * True, if run inside a node.js environment.
         * @returns {Boolean}
         */
        isNode: function () {
            // This is not a 100% sure but should be valid in most cases
            // We are not inside a browser
            /* eslint-disable no-undef */
            return (
                !this.isBrowser &&
                (typeof process !== 'undefined') &&
                (process.release.name.search(/node|io.js/) !== -1)
            /* eslint-enable no-undef */

                // there is a module object (plain node, no requirejs)
                // ((typeof module === "object" && !!module.exports) ||
                //     // there is a global object and requirejs is loaded
                //     (typeof global === "object" &&
                //         global.requirejsVars &&
                //         !global.requirejsVars.isBrowser)
                // )
            );
        },

        /**
         * True if run inside a webworker environment.
         * @returns {Boolean}
         */
        isWebWorker: function () {
            return (
                !this.isBrowser &&
                typeof self === "object" &&
                typeof self.postMessage === "function"
            );
        },

        /**
         * Checks if the environments supports the W3C Pointer Events API {@link https://www.w3.org/TR/pointerevents/}
         * @returns {Boolean}
         */
        supportsPointerEvents: function () {
            return !!(
                (
                    this.isBrowser &&
                    window.navigator &&
                    (window.PointerEvent || // Chrome/Edge/IE11+
                        window.navigator.pointerEnabled || // IE11+
                        window.navigator.msPointerEnabled)
                ) // IE10-
            );
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
         * @deprecated
         */
        isAndroid: function () {
            return (
                Type.exists(navigator) &&
                navigator.userAgent.toLowerCase().indexOf('android') > -1
            );
        },

        /**
         * Detects if the user is using the default Webkit browser on an Android powered device.
         * @returns {Boolean}
         * @deprecated
         */
        isWebkitAndroid: function () {
            return this.isAndroid() && navigator.userAgent.indexOf(" AppleWebKit/") > -1;
        },

        /**
         * Detects if the user is using a Apple iPad / iPhone.
         * @returns {Boolean}
         * @deprecated
         */
        isApple: function () {
            return (
                Type.exists(navigator) &&
                (navigator.userAgent.indexOf('iPad') > -1 ||
                    navigator.userAgent.indexOf('iPhone') > -1)
            );
        },

        /**
         * Detects if the user is using Safari on an Apple device.
         * @returns {Boolean}
         * @deprecated
         */
        isWebkitApple: function () {
            return (
                this.isApple() && navigator.userAgent.search(/Mobile\/[0-9A-Za-z.]*Safari/) > -1
            );
        },

        /**
         * Returns true if the run inside a Windows 8 "Metro" App.
         * @returns {Boolean}
         * @deprecated
         */
        isMetroApp: function () {
            return (
                typeof window === "object" &&
                window.clientInformation &&
                window.clientInformation.appVersion &&
                window.clientInformation.appVersion.indexOf('MSAppHost') > -1
            );
        },

        /**
         * Detects if the user is using a Mozilla browser
         * @returns {Boolean}
         * @deprecated
         */
        isMozilla: function () {
            return (
                Type.exists(navigator) &&
                navigator.userAgent.toLowerCase().indexOf('mozilla') > -1 &&
                navigator.userAgent.toLowerCase().indexOf('apple') === -1
            );
        },

        /**
         * Detects if the user is using a firefoxOS powered device.
         * @returns {Boolean}
         * @deprecated
         */
        isFirefoxOS: function () {
            return (
                Type.exists(navigator) &&
                navigator.userAgent.toLowerCase().indexOf('android') === -1 &&
                navigator.userAgent.toLowerCase().indexOf('apple') === -1 &&
                navigator.userAgent.toLowerCase().indexOf('mobile') > -1 &&
                navigator.userAgent.toLowerCase().indexOf('mozilla') > -1
            );
        },

        /**
         * Detects if the user is using a desktop device, see <a href="https://stackoverflow.com/a/61073480">https://stackoverflow.com/a/61073480</a>.
         * @returns {boolean}
         *
         * @deprecated
         */
        isDesktop: function () {
            return true;
            // console.log("isDesktop", screen.orientation);
            // const navigatorAgent =
            //     navigator.userAgent || navigator.vendor || window.opera;
            // return !(
            //     /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series([46])0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
            //         navigatorAgent
            //     ) ||
            //     /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br([ev])w|bumb|bw-([nu])|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do([cp])o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly([-_])|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-([mpt])|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c([- _agpst])|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac([ \-/])|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja([tv])a|jbro|jemu|jigs|kddi|keji|kgt([ /])|klon|kpt |kwc-|kyo([ck])|le(no|xi)|lg( g|\/([klu])|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t([- ov])|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30([02])|n50([025])|n7(0([01])|10)|ne(([cm])-|on|tf|wf|wg|wt)|nok([6i])|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan([adt])|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c([-01])|47|mc|nd|ri)|sgh-|shar|sie([-m])|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel([im])|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c([- ])|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(
            //         navigatorAgent.substr(0, 4)
            //     )
            // );
        },

        /**
         * Detects if the user is using a mobile device, see <a href="https://stackoverflow.com/questions/25542814/html5-detecting-if-youre-on-mobile-or-pc-with-javascript">https://stackoverflow.com/questions/25542814/html5-detecting-if-youre-on-mobile-or-pc-with-javascript</a>.
         * @returns {boolean}
         *
         * @deprecated
         *
         */
        isMobile: function () {
            return true;
            // return Type.exists(navigator) && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        },

        /**
         * Internet Explorer version. Works only for IE > 4.
         * @type Number
         * @deprecated
         */
        ieVersion: (function () {
            var div,
                all,
                v = 3;

            if (document === null || typeof document !== 'object') {
                return 0;
            }

            div = document.createElement('div');
            all = div.getElementsByTagName('i');

            do {
                div.innerHTML = "<!--[if gt IE " + (++v) + "]><" + "i><" + "/i><![endif]-->";
            } while (all[0]);

            return v > 4 ? v : undefined;
        })(),

        /**
         * Reads the width and height of an HTML element.
         * @param {String|Object} elementId id of or reference to an HTML DOM node.
         * @returns {Object} An object with the two properties width and height.
         */
        getDimensions: function (elementId, doc) {
            var element,
                display,
                els,
                originalVisibility,
                originalPosition,
                originalDisplay,
                originalWidth,
                originalHeight,
                style,
                pixelDimRegExp = /\d+(\.\d*)?px/;

            if (!this.isBrowser || elementId === null) {
                return {
                    width: 500,
                    height: 500
                };
            }

            doc = doc || document;
            // Borrowed from prototype.js
            element = (Type.isString(elementId)) ? doc.getElementById(elementId) : elementId;
            if (!Type.exists(element)) {
                throw new Error(
                    "\nJSXGraph: HTML container element '" + elementId + "' not found."
                );
            }

            display = element.style.display;

            // Work around a bug in Safari
            if (display !== "none" && display !== null) {
                if (element.clientWidth > 0 && element.clientHeight > 0) {
                    return { width: element.clientWidth, height: element.clientHeight };
                }

                // A parent might be set to display:none; try reading them from styles
                style = window.getComputedStyle ? window.getComputedStyle(element) : element.style;
                return {
                    width: pixelDimRegExp.test(style.width) ? parseFloat(style.width) : 0,
                    height: pixelDimRegExp.test(style.height) ? parseFloat(style.height) : 0
                };
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
         * @param {Object|Boolean} [options=false] This parameter is passed as the third parameter to the method addEventListener. Depending on the data type it is either
         * an options object or the useCapture Boolean.
         *
         */
        addEvent: function (obj, type, fn, owner, options) {
            var el = function () {
                return fn.apply(owner, arguments);
            };

            el.origin = fn;
            // Check if owner is a board
            if (typeof owner === 'object' && Type.exists(owner.BOARD_MODE_NONE)) {
                owner['x_internal' + type] = owner['x_internal' + type] || [];
                owner['x_internal' + type].push(el);
            }

            // Non-IE browser
            if (Type.exists(obj) && Type.exists(obj.addEventListener)) {
                options = options || false;  // options or useCapture
                obj.addEventListener(type, el, options);
            }

            // IE
            if (Type.exists(obj) && Type.exists(obj.attachEvent)) {
                obj.attachEvent("on" + type, el);
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
                JXG.debug("no such owner");
                return;
            }

            if (!Type.exists(owner["x_internal" + type])) {
                JXG.debug("removeEvent: no such type: " + type);
                return;
            }

            if (!Type.isArray(owner["x_internal" + type])) {
                JXG.debug("owner[x_internal + " + type + "] is not an array");
                return;
            }

            i = Type.indexOf(owner["x_internal" + type], fn, 'origin');

            if (i === -1) {
                JXG.debug("removeEvent: no such event function in internal list: " + fn);
                return;
            }

            try {
                // Non-IE browser
                if (Type.exists(obj) && Type.exists(obj.removeEventListener)) {
                    obj.removeEventListener(type, owner["x_internal" + type][i], false);
                }

                // IE
                if (Type.exists(obj) && Type.exists(obj.detachEvent)) {
                    obj.detachEvent("on" + type, owner["x_internal" + type][i]);
                }
            } catch (e) {
                JXG.debug("removeEvent: event not registered in browser: (" + type + " -- " + fn + ")");
            }

            owner["x_internal" + type].splice(i, 1);
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
            if (owner["x_internal" + type]) {
                len = owner["x_internal" + type].length;

                for (i = len - 1; i >= 0; i--) {
                    JXG.removeEvent(obj, type, owner["x_internal" + type][i].origin, owner);
                }

                if (owner["x_internal" + type].length > 0) {
                    JXG.debug("removeAllEvents: Not all events could be removed.");
                }
            }
        },

        /**
         * Cross browser mouse / pointer / touch coordinates retrieval relative to the documents's top left corner.
         * This method might be a bit outdated today, since pointer events and clientX/Y are omnipresent.
         *
         * @param {Object} [e] The browsers event object. If omitted, <tt>window.event</tt> will be used.
         * @param {Number} [index] If <tt>e</tt> is a touch event, this provides the index of the touch coordinates, i.e. it determines which finger.
         * @param {Object} [doc] The document object.
         * @returns {Array} Contains the position as x,y-coordinates in the first resp. second component.
         */
        getPosition: function (e, index, doc) {
            var i,
                len,
                evtTouches,
                posx = 0,
                posy = 0;

            if (!e) {
                e = window.event;
            }

            doc = doc || document;
            evtTouches = e['touches']; // iOS touch events

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

            // Scrolling is ignored.
            // e.clientX is supported since IE6
            if (e.clientX) {
                posx = e.clientX;
                posy = e.clientY;
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
            var r,
                doc = obj.ownerDocument;

            // Non-IE
            if (doc.defaultView && doc.defaultView.getComputedStyle) {
                r = doc.defaultView.getComputedStyle(obj, null).getPropertyValue(stylename);
                // IE
            } else if (obj.currentStyle && JXG.ieVersion >= 9) {
                r = obj.currentStyle[stylename];
            } else {
                if (obj.style) {
                    // make stylename lower camelcase
                    stylename = stylename.replace(/-([a-z]|[0-9])/gi, function (all, letter) {
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
            var i,
                j,
                str,
                arrStr,
                start,
                len,
                len2,
                arr,
                t = [
                    "transform",
                    "webkitTransform",
                    "MozTransform",
                    "msTransform",
                    "oTransform"
                ];

            // Take the first transformation matrix
            len = t.length;

            for (i = 0, str = ""; i < len; i++) {
                if (Type.exists(obj.style[t[i]])) {
                    str = obj.style[t[i]];
                    break;
                }
            }

            /**
             * Extract the coordinates and apply the transformation
             * to cPos
             */
            if (str !== "") {
                start = str.indexOf("(");

                if (start > 0) {
                    len = str.length;
                    arrStr = str.substring(start + 1, len - 1);
                    arr = arrStr.split(",");

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

            // Zoom is used by reveal.js
            if (Type.exists(obj.style.zoom)) {
                str = obj.style.zoom;
                if (str !== "") {
                    cPos[0] *= parseFloat(str);
                    cPos[1] *= parseFloat(str);
                }
            }

            return cPos;
        },

        /**
         * Scaling CSS transformations applied to the div element containing the JSXGraph constructions
         * are determined. In IE prior to 9, 'rotate', 'skew', 'skewX', 'skewY' are not supported.
         * @returns {Array} 3x3 transformation matrix without translation part. See {@link JXG.Board#updateCSSTransforms}.
         */
        getCSSTransformMatrix: function (obj) {
            var i, j, str, arrstr, arr,
                start, len, len2, st,
                doc = obj.ownerDocument,
                t = [
                    "transform",
                    "webkitTransform",
                    "MozTransform",
                    "msTransform",
                    "oTransform"
                ],
                mat = [
                    [1, 0, 0],
                    [0, 1, 0],
                    [0, 0, 1]
                ];

            // This should work on all browsers except IE 6-8
            if (doc.defaultView && doc.defaultView.getComputedStyle) {
                st = doc.defaultView.getComputedStyle(obj, null);
                str =
                    st.getPropertyValue("-webkit-transform") ||
                    st.getPropertyValue("-moz-transform") ||
                    st.getPropertyValue("-ms-transform") ||
                    st.getPropertyValue("-o-transform") ||
                    st.getPropertyValue('transform');
            } else {
                // Take the first transformation matrix
                len = t.length;
                for (i = 0, str = ""; i < len; i++) {
                    if (Type.exists(obj.style[t[i]])) {
                        str = obj.style[t[i]];
                        break;
                    }
                }
            }

            // Convert and reorder the matrix for JSXGraph
            if (str !== "") {
                start = str.indexOf("(");

                if (start > 0) {
                    len = str.length;
                    arrstr = str.substring(start + 1, len - 1);
                    arr = arrstr.split(",");

                    for (j = 0, len2 = arr.length; j < len2; j++) {
                        arr[j] = parseFloat(arr[j]);
                    }

                    if (str.indexOf('matrix') === 0) {
                        mat = [
                            [1, 0, 0],
                            [0, arr[0], arr[1]],
                            [0, arr[2], arr[3]]
                        ];
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

            // CSS style zoom is used by reveal.js
            // Recursively search for zoom style entries.
            // This is necessary for reveal.js on webkit.
            // It fails if the user does zooming
            if (Type.exists(obj.style.zoom)) {
                str = obj.style.zoom;
                if (str !== "") {
                    mat[1][1] *= parseFloat(str);
                    mat[2][2] *= parseFloat(str);
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
            var todo = items.slice(),
                timerFun = function () {
                    var start = +new Date();

                    do {
                        process.call(context, todo.shift());
                    } while (todo.length > 0 && +new Date() - start < 300);

                    if (todo.length > 0) {
                        window.setTimeout(timerFun, 1);
                    } else {
                        callback(items);
                    }
                };

            window.setTimeout(timerFun, 1);
        },

        /**
         * Scale and vertically shift a DOM element (usually a JSXGraph div)
         * inside of a parent DOM
         * element which is set to fullscreen.
         * This is realized with a CSS transformation.
         *
         * @param  {String} wrap_id  id of the parent DOM element which is in fullscreen mode
         * @param  {String} inner_id id of the DOM element which is scaled and shifted
         * @param  {Object} doc      document object or shadow root
         * @param  {Number} scale    Relative size of the JSXGraph board in the fullscreen window.
         *
         * @private
         * @see JXG.Board#toFullscreen
         * @see JXG.Board#fullscreenListener
         *
         */
        scaleJSXGraphDiv: function (wrap_id, inner_id, doc, scale) {
            var w, h, b,
                wi, hi,
                wo, ho, inner,
                scale_l, vshift_l,
                f = scale,
                ratio,
                pseudo_keys = [
                    ":fullscreen",
                    ":-webkit-full-screen",
                    ":-moz-full-screen",
                    ":-ms-fullscreen"
                ],
                len_pseudo = pseudo_keys.length,
                i;

            b = doc.getElementById(wrap_id).getBoundingClientRect();
            h = b.height;
            w = b.width;

            inner = doc.getElementById(inner_id);
            wo = inner._cssFullscreenStore.w;
            ho = inner._cssFullscreenStore.h;
            ratio = ho / wo;

            // Scale the div such that fits into the fullscreen.
            if (wo > w * f) {
                wo = w * f;
                ho = wo * ratio;
            }
            if (ho > h * f) {
                ho = h * f;
                wo = ho / ratio;
            }

            wi = wo;
            hi = ho;
            // Compare the code in this.setBoundingBox()
            if (ratio > 1) {
                // h > w
                if (ratio < h / w) {
                    scale_l =  w * f / wo;
                } else {
                    scale_l =  h * f / ho;
                }
            } else {
                // h <= w
                if (ratio < h / w) {
                    scale_l = w * f / wo;
                } else {
                    scale_l = h * f / ho;
                }
            }
            vshift_l = (h - hi) * 0.5;

            // Set a CSS properties to center the JSXGraph div horizontally and vertically
            // at the first position of the fullscreen pseudo classes.
            for (i = 0; i < len_pseudo; i++) {
                try {
                    inner.style.width = wi + 'px !important';
                    inner.style.height = hi + 'px !important';
                    inner.style.margin = '0 auto';
                    // Add the transform to a possibly already existing transform
                    inner.style.transform = inner._cssFullscreenStore.transform +
                        ' matrix(' + scale_l + ',0,0,' + scale_l + ',0,' + vshift_l + ')';
                    break;
                } catch (err) {
                    JXG.debug("JXG.scaleJSXGraphDiv:\n" + err);
                }
            }
            if (i === len_pseudo) {
                JXG.debug("JXG.scaleJSXGraphDiv: Could not set any CSS property.");
            }
        }

    }
);

export default JXG;
