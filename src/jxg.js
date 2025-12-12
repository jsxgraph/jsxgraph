/*
    Copyright 2008-2025
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Andreas Walter,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph and JSXCompressor.

    JSXGraph is free software dual licensed under the GNU LGPL or MIT License.
    JSXCompressor is free software dual licensed under the GNU LGPL or Apache License.

    You can redistribute it and/or modify it under the terms of the

      * GNU Lesser General Public License as published by
        the Free Software Foundation, either version 3 of the License, or
        (at your option) any later version
      OR
      * MIT License: https://github.com/jsxgraph/jsxgraph/blob/master/LICENSE.MIT
      OR
      * Apache License Version 2.0

    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License, Apache
    License, and the MIT License along with JSXGraph. If not, see
    <https://www.gnu.org/licenses/>, <https://www.apache.org/licenses/LICENSE-2.0.html>,
    and <https://opensource.org/licenses/MIT/>.

 */

/*global JXG: true, define: true, jQuery: true, window: true, document: true, navigator: true, require: true, module: true, console: true */
/*jslint nomen:true, plusplus:true, forin:true*/

/**
 * @fileoverview The JSXGraph object is defined in this file. JXG.JSXGraph controls all boards.
 * It has methods to create, save, load and free boards. Additionally some helper functions are
 * defined in this file directly in the JXG namespace.
 */

/**
 * JXG is the top object of JSXGraph and defines the namespace
 *
 * @name JXG
 * @exports jxg as JXG
 * @namespace
 */
var jxg = {};

// Make sure JXG.extend is not defined.
// If JSXGraph is compiled as an amd module, it is possible that another JSXGraph version is already loaded and we
// therefore must not re-use the global JXG variable. But in this case JXG.extend will already be defined.
// This is the reason for this check.
// The try-statement is necessary, otherwise an error is thrown in certain imports, e.g. in deno.
try {
    if (typeof JXG === "object" && !JXG.extend) {
        jxg = JXG;
    }
} catch (e) {}

// We need the following two methods "extend" and "shortcut" to create the JXG object via JXG.extend.

/**
 * Copy all properties of the <tt>extension</tt> object to <tt>object</tt>.
 * @param {Object} object
 * @param {Object} extension
 * @param {Boolean} [onlyOwn=false] Only consider properties that belong to extension itself, not any inherited properties.
 * @param {Boolean} [toLower=false] If true the keys are convert to lower case. This is needed for visProp, see JXG#copyAttributes
 */
jxg.extend = function (object, extension, onlyOwn, toLower) {
    var e, e2;

    onlyOwn = onlyOwn || false;
    toLower = toLower || false;

    // the purpose of this for...in loop is indeed to use hasOwnProperty only if the caller
    // explicitly wishes so.
    for (e in extension) {
        if (!onlyOwn || (onlyOwn && extension.hasOwnProperty(e))) {
            if (toLower) {
                e2 = e.toLowerCase();
            } else {
                e2 = e;
            }

            object[e2] = extension[e];
        }
    }
};

/**
 * Set a constant <tt>name</tt> in <tt>object</tt> to <tt>value</tt>. The value can't be changed after declaration.
 * @param {Object} object
 * @param {String} name
 * @param {Number|String|Boolean} value
 * @param {Boolean} ignoreRedefine This should be left at its default: false.
 */
jxg.defineConstant = function (object, name, value, ignoreRedefine) {
    ignoreRedefine = ignoreRedefine || false;

    if (ignoreRedefine && jxg.exists(object[name])) {
        return;
    }

    Object.defineProperty(object, name, {
        value: value,
        writable: false,
        enumerable: true,
        configurable: false
    });
};

/**
 * Copy all properties of the <tt>constants</tt> object in <tt>object</tt> as a constant.
 * @param {Object} object
 * @param {Object} constants
 * @param {Boolean} [onlyOwn=false] Only consider properties that belong to extension itself, not any inherited properties.
 * @param {Boolean} [toUpper=false] If true the keys are convert to lower case. This is needed for visProp, see JXG#copyAttributes
 */
jxg.extendConstants = function (object, constants, onlyOwn, toUpper) {
    var e, e2;

    onlyOwn = onlyOwn || false;
    toUpper = toUpper || false;

    // The purpose of this for...in loop is indeed to use hasOwnProperty only if the caller explicitly wishes so.
    for (e in constants) {
        if (!onlyOwn || (onlyOwn && constants.hasOwnProperty(e))) {
            if (toUpper) {
                e2 = e.toUpperCase();
            } else {
                e2 = e;
            }

            this.defineConstant(object, e2, constants[e]);
        }
    }
};

jxg.extend(
    jxg,
    /** @lends JXG */ {
        /**
         * Store a reference to every board in this central list. This will at some point
         * replace JXG.JSXGraph.boards.
         * @type Object
         */
        boards: {},

        /**
         * Store the available file readers in this structure.
         * @type Object
         */
        readers: {},

        /**
         * Associative array that keeps track of all constructable elements registered
         * via {@link JXG.registerElement}.
         * @type Object
         */
        elements: {},

        /**
         * This registers a new construction element to JSXGraph for the construction via the {@link JXG.Board.create}
         * interface.
         * @param {String} element The elements name. This is case-insensitive, existing elements with the same name
         * will be overwritten.
         * @param {Function} creator A reference to a function taking three parameters: First the board, the element is
         * to be created on, a parent element array, and an attributes object. See {@link JXG.createPoint} or any other
         * <tt>JXG.create...</tt> function for an example.
         */
        registerElement: function (element, creator) {
            element = element.toLowerCase();
            this.elements[element] = creator;
        },

        /**
         * Register a file reader.
         * @param {function} reader A file reader. This object has to provide two methods: <tt>prepareString()</tt>
         * and <tt>read()</tt>.
         * @param {Array} ext
         */
        registerReader: function (reader, ext) {
            var i, e;

            for (i = 0; i < ext.length; i++) {
                e = ext[i].toLowerCase();

                if (typeof this.readers[e] !== 'function') {
                    this.readers[e] = reader;
                }
            }
        },

        /**
         * Creates a shortcut to a method, e.g. {@link JXG.Board#createElement} is a shortcut to {@link JXG.Board#create}.
         * Sometimes the target is undefined by the time you want to define the shortcut so we need this little helper.
         * @param {Object} object The object the method we want to create a shortcut for belongs to.
         * @param {String} fun The method we want to create a shortcut for.
         * @returns {Function} A function that calls the given method.
         */
        shortcut: function (object, fun) {
            return function () {
                return object[fun].apply(this, arguments);
            };
        },

        /**
         * s may be a string containing the name or id of an element or even a reference
         * to the element itself. This function returns a reference to the element. Search order: id, name.
         * @param {JXG.Board} board Reference to the board the element belongs to.
         * @param {String} s String or reference to a JSXGraph element.
         * @returns {Object} Reference to the object given in parameter object
         * @deprecated Use {@link JXG.Board#select}
         */
        getRef: function (board, s) {
            jxg.deprecated("JXG.getRef()", "Board.select()");
            return board.select(s);
        },

        /**
         * This is just a shortcut to {@link JXG.getRef}.
         * @deprecated Use {@link JXG.Board#select}.
         */
        getReference: function (board, s) {
            jxg.deprecated("JXG.getReference()", "Board.select()");
            return board.select(s);
        },

        /**
         * s may be the string containing the id of an HTML tag that hosts a JSXGraph board.
         * This function returns the reference to the board.
         * @param  {String} s String of an HTML tag that hosts a JSXGraph board
         * @returns {Object} Reference to the board or null.
         */
        getBoardByContainerId: function (s) {
            var b;
            for (b in JXG.boards) {
                if (JXG.boards.hasOwnProperty(b) && JXG.boards[b].container === s) {
                    return JXG.boards[b];
                }
            }

            return null;
        },

        /**
         * This method issues a warning to the developer that the given function is deprecated
         * and, if available, offers an alternative to the deprecated function.
         * @param {String} what Describes the function that is deprecated
         * @param {String} [replacement] The replacement that should be used instead.
         */
        deprecated: function (what, replacement) {
            var warning = what + " is deprecated.";

            if (replacement) {
                warning += " Please use " + replacement + " instead.";
            }

            jxg.warn(warning);
        },

        /**
         * Outputs a warning via console.warn(), if available. If console.warn() is
         * unavailable this function will look for an HTML element with the id 'warning'
         * and append the warning to this element's innerText.
         * @param {String} warning The warning text
         */
        warn: function (warning) {
            if (typeof window === "object" && window.console && console.warn) {
                console.warn("WARNING:", warning);
            } else if (typeof document === "object" && document.getElementById('warning')) {
                document.getElementById('debug').innerText += "WARNING: " + warning + '\n';
            }
        },

        /**
         * Add something to the debug log. If available a JavaScript debug console is used. Otherwise
         * we're looking for a HTML div with id "debug". If this doesn't exist, too, the output is omitted.
         * @param s An arbitrary number of parameters.
         * @see JXG.debugWST
         */
        debugInt: function (s) {
            var i, p;

            for (i = 0; i < arguments.length; i++) {
                p = arguments[i];
                if (typeof window === "object" && window.console && console.log) {
                    console.log(p);
                } else if (typeof document === "object" && document.getElementById('debug')) {
                    document.getElementById('debug').innerText += p + '\n';
                }
            }
        },

        /**
         * Add something to the debug log. If available a JavaScript debug console is used. Otherwise
         * we're looking for a HTML div with id "debug". If this doesn't exist, too, the output is omitted.
         * This method adds a stack trace (if available).
         * @param s An arbitrary number of parameters.
         * @see JXG.debug
         */
        debugWST: function (s) {
            var e = new Error();

            jxg.debugInt.apply(this, arguments);

            if (e && e.stack) {
                jxg.debugInt('stacktrace');
                jxg.debugInt(e.stack.split("\n").slice(1).join("\n"));
            }
        },

        /**
         * Add something to the debug log. If available a JavaScript debug console is used. Otherwise
         * we're looking for a HTML div with id "debug". If this doesn't exist, too, the output is omitted.
         * This method adds a line of the stack trace (if available).
         *
         * @param s An arbitrary number of parameters.
         * @see JXG.debug
         */
        debugLine: function (s) {
            var e = new Error();

            jxg.debugInt.apply(this, arguments);

            if (e && e.stack) {
                jxg.debugInt("Called from", e.stack.split("\n").slice(2, 3).join("\n"));
            }
        },

        /**
         * Add something to the debug log. If available a JavaScript debug console is used. Otherwise
         * we're looking for a HTML div with id "debug". If this doesn't exist, too, the output is omitted.
         * @param s An arbitrary number of parameters.
         * @see JXG.debugWST
         * @see JXG.debugLine
         * @see JXG.debugInt
         */
        debug: function (s) {
            jxg.debugInt.apply(this, arguments);
        },

        /**
         * Initialize a new board.
         * Alias of {@link JXG.JSXGraph.initBoard}.
         * @param {String|Object} box id of or reference to the HTML element in which the board is painted.
         * @param {Object} attributes An object that sets some of the board properties.
         * See {@link JXG.Board} for a list of available attributes of the board.
         * Most of these attributes can also be set via {@link JXG.Options},
         *
         * @returns {JXG.Board} Reference to the created board.
         *
         * @see JXG.AbstractRenderer#drawNavigationBar
         * @example
         * var board = JXG.JSXGraph.initBoard('jxgbox', {
         *     boundingbox: [-10, 5, 10, -5],
         *     keepaspectratio: false,
         *     axis: true
         * });
         *
         * </pre><div id="JXG79b42d26-b664-451d-96b4-08bc25dd87d3" class="jxgbox" style="width: 600px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXG79b42d26-b664-451d-96b4-08bc25dd87d3', {
         *         boundingbox: [-10, 5, 10, -5],
         *         keepaspectratio: false,
         *         axis: true
         *     });
         *
         *     })();
         *
         * </script><pre>
         *
         *
         * @example
         * const board = JXG.JSXGraph.initBoard('jxgbox', {
         *   boundingbox: [-10, 10, 10, -10],
         *   axis: true,
         *   showCopyright: true,
         *   showFullscreen: true,
         *   showScreenshot: false,
         *   showClearTraces: false,
         *   showInfobox: false,
         *   showNavigation: true,
         *   grid: false,
         *   defaultAxes: {
         *     x: {
         *       withLabel: true,
         *       label: {
         *         position: '95% left',
         *         offset: [-10, 10]
         *       },
         *       lastArrow: {
         *         type: 4,
         *         size: 10
         *       }
         *     },
         *     y: {
         *       withLabel: true,
         *       label: {
         *         position: '0.90fr right',
         *         offset: [6, -6]
         *       },
         *       lastArrow: {
         *         type: 4,
         *         size: 10
         *       }
         *     }
         *   }
         * });
         *
         * </pre><div id="JXGd7a7705b-35bb-4193-bbd4-3e3fd92eb92c" class="jxgbox" style="width: 300px; height: 300px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXGd7a7705b-35bb-4193-bbd4-3e3fd92eb92c', {
         *       boundingbox: [-10, 10, 10, -10],
         *       axis: true,
         *       showCopyright: true,
         *       showFullscreen: true,
         *       showScreenshot: false,
         *       showClearTraces: false,
         *       showInfobox: false,
         *       showNavigation: true,
         *       grid: false,
         *       defaultAxes: {
         *         x: {
         *           withLabel: true,
         *           label: {
         *             position: '95% left',
         *             offset: [0, 0]
         *           },
         *           lastArrow: {
         *             type: 4,
         *             size: 10
         *           }
         *         },
         *         y: {
         *           withLabel: true,
         *           label: {
         *             position: '0.90fr right',
         *             offset: [0, 0]
         *           },
         *           lastArrow: {
         *             type: 4,
         *             size: 10
         *           }
         *         }
         *       }
         *     });
         *
         *     })();
         *
         * </script><pre>
         * @example
         * const board = JXG.JSXGraph.initBoard('jxgbox', {
         *     boundingbox: [-5, 5, 5, -5],
         *     intl: {
         *         enabled: false,
         *         locale: 'en-EN'
         *     },
         *     keepaspectratio: true,
         *     axis: true,
         *     defaultAxes: {
         *         x: {
         *             ticks: {
         *                 intl: {
         *                         enabled: true,
         *                         options: {
         *                             style: 'unit',
         *                             unit: 'kilometer-per-hour',
         *                             unitDisplay: 'narrow'
         *                         }
         *                 }
         *             }
         *         },
         *         y: {
         *             ticks: {
         *             }
         *         }
         *     },
         *     infobox: {
         *         fontSize: 20,
         *         intl: {
         *             enabled: true,
         *             options: {
         *                 minimumFractionDigits: 4,
         *                 maximumFractionDigits: 5
         *             }
         *         }
         *     }
         * });
         *
         * </pre><div id="JXGd84f4c84-f900-4d33-b001-e5f5f3ab0dd2" class="jxgbox" style="width: 600px; height: 600px;"></div>
         * <script type="text/javascript">
         *     (function() {
         *         var board = JXG.JSXGraph.initBoard('JXGd84f4c84-f900-4d33-b001-e5f5f3ab0dd2', {
         *         boundingbox: [-5, 5, 5, -5],
         *         intl: {
         *             enabled: false,
         *             locale: 'en-EN'
         *         },
         *         keepaspectratio: true,
         *         axis: true,
         *         defaultAxes: {
         *             x: {
         *                 ticks: {
         *                     intl: {
         *                             enabled: true,
         *                             options: {
         *                                 style: 'unit',
         *                                 unit: 'kilometer-per-hour',
         *                                 unitDisplay: 'narrow'
         *                             }
         *                     }
         *                 }
         *             },
         *             y: {
         *                 ticks: {
         *                 }
         *             }
         *         },
         *         infobox: {
         *             fontSize: 20,
         *             intl: {
         *                 enabled: true,
         *                 options: {
         *                     minimumFractionDigits: 4,
         *                     maximumFractionDigits: 5
         *                 }
         *             }
         *         }
         *     });
         *
         *     })();
         *
         * </script><pre>
         *
         */
        init: function (box, attributes) {
            return this.JSXGraph.initBoard(box, attributes);
        },

        themes: {}
    }
);

export default jxg;
