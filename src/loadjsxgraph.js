/*
    Copyright 2008-2022
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
    the MIT License along with JSXGraph. If not, see <http://www.gnu.org/licenses/>
    and <http://opensource.org/licenses/MIT/>.
 */

/*global JXG: true, document: true*/
/*jslint nomen: true, plusplus: true, regexp: true*/

/**
 * JSXGraph namespace. Holds all classes, objects, functions and variables belonging to JSXGraph
 * to reduce the risk of interfering with other JavaScript code.
 * @namespace
 */
var JXG = {},
  define;

(function () {
  "use strict";

  //////////////////////////////////////////////////////////////////////////
  //// Set this constant to 'true' to add an timestamp to each imported ////
  //// file. This ensures that the most up-to-date files are always     ////
  //// used during development.                                         ////
  ////                                                                  ////
  ////             Attention! Slows down the loading time!              ////
  //////////////////////////////////////////////////////////////////////////
  var preventCachingFiles = true,
    // check and table are initialized at the end of the life
    table,
    waitlist = [],
    checkwaitlist = true,
    checkJXG = function () {
      return JXG;
    },
    makeCheck = function (s) {
      var a = s.split(".");

      return function () {
        var i,
          r = JXG;

        if (!r) {
          return r;
        }

        for (i = 0; i < a.length; i++) {
          r = r[a[i]];
          if (!r) {
            break;
          }
        }

        return r;
      };
    };

  define = function (deps, factory) {
    var i,
      oldlength,
      undef,
      resDeps = [],
      inc = true;

    if (deps === undef) {
      deps = [];
    }

    window.wait = waitlist;

    if (factory === undef) {
      factory = function () {};
    }

    for (i = 0; i < deps.length; i++) {
      resDeps.push(table[deps[i]]());
      if (!resDeps[i]) {
        inc = false;
        break;
      }
    }

    if (inc) {
      factory.apply(this, resDeps);
    } else if (checkwaitlist) {
      waitlist.push([deps, factory]);
    }

    if (checkwaitlist) {
      // don't go through the waitlist while we're going through the waitlist
      checkwaitlist = false;
      oldlength = 0;

      // go through the waitlist until no more modules can be loaded
      while (oldlength !== waitlist.length) {
        oldlength = waitlist.length;

        // go through the waitlist, look if another module can be initialized
        for (i = 0; i < waitlist.length; i++) {
          if (define.apply(this, waitlist[i])) {
            waitlist.splice(i, 1);
          }
        }
      }

      checkwaitlist = true;
    }

    return inc;
  };

  JXG.isMetroApp = function () {
    return (
      typeof window === "object" &&
      window.clientInformation &&
      window.clientInformation.appVersion &&
      window.clientInformation.appVersion.indexOf("MSAppHost") > -1
    );
  };

  ////////////////////////////////////////////////////////////////////////////////
  /////////////////////// this exists also in sketchometry ///////////////////////
  ////////////////////////////////////////////////////////////////////////////////

  JXG.Load = (function () {
    var requirePathLocation = "href",
      allowDocumentWrite = true;

    function createHTMLElement(tagName, attr) {
      var el = document.createElement(tagName),
        i,
        a_name,
        a_value,
        a_object;

      for (i = 0; i < Object.keys(attr).length; i++) {
        a_name = Object.keys(attr)[i];
        a_value = attr[a_name];

        a_object = document.createAttribute(a_name);
        a_object.nodeValue = a_value;
        el.setAttributeNode(a_object);
      }

      return el;
    }

    window.onload = function () {
      allowDocumentWrite = false;
    };

    return {
      requirePath: window.location.href,

      getPathOfScriptFile: function (filename) {
        var scripts,
          reg,
          i,
          s,
          requirePath = "";

        scripts = document.getElementsByTagName("script");
        reg = new RegExp(filename + "(\\?.*)?$");

        for (i = 0; i < scripts.length; i++) {
          s = scripts[i];
          if (s.src && s.src.match(reg)) {
            requirePath = s.src.replace(reg, "");
            break;
          }
        }

        return requirePath;
      },

      setRequirePathToScriptFile: function (filename) {
        if (requirePathLocation === filename) {
          return;
        }

        JXG.Load.requirePath = JXG.Load.getPathOfScriptFile(filename);
        requirePathLocation = filename;
      },

      setRequirePathToHref: function () {
        JXG.Load.requirePath = window.location.href;
        requirePathLocation = "href";
      },

      JSfiles: function (fileArray, preventCaching, root) {
        var postfix = "",
          i,
          file;

        preventCaching = preventCaching || false;
        if (preventCaching) {
          postfix = "?v=" + new Date().getTime();
        }
        root = root || JXG.Load.requirePath;
        if (root.substr(-1) !== "/") {
          root += "/";
        }

        for (i = 0; i < fileArray.length; i++) {
          file = fileArray[i];

          if (file.substr(-2) !== "js") {
            file += ".js";
          }
          (function (include) {
            var src = root + include + postfix,
              el,
              head;
            if (JXG.isMetroApp() || !allowDocumentWrite) {
              el = createHTMLElement("script", {
                type: "text/javascript",
                src: src,
              });
              head = document.getElementsByTagName("head")[0];
              head.appendChild(el);
            } else {
              // avoid inline code manipulation
              document.write(
                '<script type="text/javascript" src="' + src + '"></script>'
              );
            }
          })(file);
        }
      },

      CSSfiles: function (fileArray, preventCaching, root) {
        var postfix = "",
          i,
          file;

        preventCaching = preventCaching || false;
        if (preventCaching) {
          postfix = "?v=" + new Date().getTime();
        }
        root = root || JXG.Load.requirePath;
        if (root.substr(-1) !== "/") {
          root += "/";
        }

        for (i = 0; i < fileArray.length; i++) {
          file = fileArray[i];

          if (file.substr(-3) !== "css") {
            file += ".css";
          }
          (function (include) {
            var href = root + include + postfix,
              el = createHTMLElement("link", {
                rel: "stylesheet",
                type: "text/javascript",
                href: href,
              }),
              head = document.getElementsByTagName("head")[0];
            head.appendChild(el);
          })(file);
        }
      },

      HTMLfileASYNC: function (
        file,
        innerHTMLof,
        doAfter,
        preventCaching,
        root
      ) {
        var postfix = "";

        doAfter = doAfter || function () {};
        preventCaching = preventCaching || false;
        if (preventCaching) {
          postfix = "?v=" + new Date().getTime();
        }
        root = root || JXG.Load.requirePath;
        if (root.substr(-1) !== "/") {
          root += "/";
        }

        if (file.substr(-4) !== "html") {
          file += ".html";
        }
        (function (include) {
          var url = root + include + postfix;

          var xhr = new XMLHttpRequest();
          xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
              if (xhr.status === 200) {
                innerHTMLof.innerHTML = xhr.responseText;
                doAfter();
              }
            }
          };

          xhr.open("POST", url, true);
          xhr.send();
        })(file);
      },
    };
  })();

  ////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////// end //////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////

  // Has to be a String for Makefile!
  JXG.Load.baseFiles =
    "jxg,base/constants,utils/type,utils/xml,utils/env,utils/event,utils/expect,utils/color,math/probfuncs,math/math,math/ia,math/extrapolate,math/numerics,math/nlp,math/plot,math/metapost,math/statistics,math/symbolic,math/geometry,math/clip,math/poly,math/complex,renderer/abstract,renderer/no,reader/file,parser/geonext,base/board,options,jsxgraph,base/element,base/coordselement,base/coords,base/point,base/line,base/group,base/circle,element/conic,base/polygon,base/curve,element/arc,element/sector,base/composition,element/composition,base/text,base/image,element/slider,element/measure,base/chart,base/transformation,base/turtle,base/ticks,utils/zip,utils/base64,utils/uuid,utils/encoding,server/server,element/locus,parser/datasource,parser/ca,parser/jessiecode,utils/dump,renderer/svg,renderer/vml,renderer/canvas,renderer/no,element/comb,element/slopetriangle,math/qdt,element/checkbox,element/input,element/button,base/foreignobject,options3d,3d/view3d,3d/element3d,3d/point3d,3d/curve3d,3d/surface3d,3d/linspace3d,3d/box3d";
  JXG.Load.setRequirePathToScriptFile("loadjsxgraph.js");
  JXG.Load.JSfiles(JXG.Load.baseFiles.split(","), preventCachingFiles);
  JXG.Load.baseFiles = null;
  JXG.serverBase = JXG.Load.requirePath + "server/";

  // This is a table with functions which check the availability
  // of certain namespaces, functions and classes. With this structure
  // we are able to get a rough check if a specific dependency is available.
  table = {
    jsxgraph: checkJXG,
    jxg: checkJXG,
    options: makeCheck("Options"),

    "base/board": makeCheck("Board"),
    "base/chart": checkJXG,
    "base/circle": checkJXG,
    "base/composition": makeCheck("Composition"),
    "base/constants": checkJXG,
    "base/coords": makeCheck("Coords"),
    "base/coordselement": makeCheck("CoordsElement"),
    "base/curve": checkJXG,
    "base/element": makeCheck("GeometryElement"),
    "base/group": checkJXG,
    "base/image": checkJXG,
    "base/line": checkJXG,
    "base/point": checkJXG,
    "base/polygon": checkJXG,
    "base/text": checkJXG,
    "base/ticks": checkJXG,
    "base/transformation": checkJXG,
    "base/turtle": checkJXG,

    "element/arc": checkJXG,
    "element/centroid": checkJXG,
    "element/composition": checkJXG,
    "element/conic": checkJXG,
    "element/locus": checkJXG,
    "element/measure": checkJXG,
    "element/sector": checkJXG,
    "element/slider": checkJXG,
    "element/square": checkJXG,
    "element/triangle": checkJXG,
    "element/checkbox": checkJXG,
    "element/input": checkJXG,
    "element/button": checkJXG,
    "element/foreignobject": checkJXG,

    "math/bst": makeCheck("Math.BST"),
    "math/qdt": makeCheck("Math.Quadtree"),
    "math/complex": makeCheck("Complex"),
    "math/geometry": makeCheck("Math.Geometry"),
    "math/math": makeCheck("Math"),
    "math/probfuncs": makeCheck("Math.ProbFuncs"),
    "math/ia": makeCheck("Math.IntervalArithmetic"),
    "math/extrapolate": makeCheck("Math.Extrapolate"),
    "math/metapost": makeCheck("Math.Metapost"),
    "math/numerics": makeCheck("Math.Numerics"),
    "math/nlp": makeCheck("Math.Nlp"),
    "math/plot": makeCheck("Math.Plot"),
    "math/poly": makeCheck("Math.Poly"),
    "math/statistics": makeCheck("Math.Statistics"),
    "math/symbolic": makeCheck("Math.Symbolic"),

    "parser/datasource": makeCheck("DataSource"),
    "parser/geonext": makeCheck("GeonextParser"),
    "parser/ca": makeCheck("CA"),
    "parser/jessiecode": makeCheck("JessieCode"),

    "reader/cinderella": makeCheck("CinderellaReader"),
    "reader/file": makeCheck("FileReader"),
    "reader/geogebra": makeCheck("GeogebraReader"),
    "reader/geonext": makeCheck("GeonextReader"),
    "reader/graph": makeCheck("GraphReader"),
    "reader/intergeo": makeCheck("IntergeoReader"),
    "reader/sketch": makeCheck("SketchReader"),
    "reader/tracenpoche": makeCheck("TracenpocheReader"),

    "renderer/abstract": makeCheck("AbstractRenderer"),
    "renderer/canvas": makeCheck("CanvasRenderer"),
    "renderer/no": makeCheck("NoRenderer"),
    "renderer/svg": makeCheck("SVGRenderer"),
    "renderer/vml": makeCheck("VMLRenderer"),

    "server/server": makeCheck("Server"),

    "utils/base64": makeCheck("Util.Base64"),
    "utils/color": checkJXG,
    "utils/dump": makeCheck("Dump"),
    "utils/encoding": makeCheck("Util.UTF8"),
    "utils/env": checkJXG,
    "utils/event": makeCheck("EventEmitter"),
    "utils/expect": makeCheck("Expect"),
    "utils/type": checkJXG,
    "utils/uuid": makeCheck("Util"),
    "utils/xml": makeCheck("XML"),
    "utils/zip": makeCheck("Util"),

    "3d/threed": checkJXG,
    "3d/view3d": checkJXG,
    "3d/point3d": checkJXG,
    "3d/curve3d": checkJXG,
    "3d/surface3d": checkJXG,
    "3d/linspace3d": checkJXG,
  };
})();
