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

/**
 * @param {String} string A string containing construction(s) in JSXGraph Construction Syntax.
 * @param {String} mode Possible values seem are "normal" or "macro"
 * @param {Array} params Parameters, only used in macro mode
 * @param {Array} paraIn Parameters, only used in macro mode
 * @param {String} macroName Name of the macro, only used in macro mode
 * @type Object
 * @returns An object consisting of several arrays (lines, circles, points, angles, ...) where the created elements are stored.
 */
JXG.Board.prototype.construct = function (string, mode, params, paraIn, macroName) {
    var splitted,
        i,
        j,
        output = {},
        objName,
        defElements,
        obj,
        type,
        possibleNames,
        tmp,
        noMacro,
        k,
        l,
        pattern,
        createdNames,
        found,
        mac,
        prop,
        propName,
        propValue,
        attributes;
    if (!JXG.exists(mode)) {
        mode = 'normal'
    } else {
        // mode = 'macro'
        createdNames = [];
    }
    output.lines = [];
    output.circles = [];
    output.points = [];
    output.intersections = [];
    output.angles = [];
    output.macros = [];
    output.functions = [];
    output.texts = [];
    output.polygons = [];
    if (string.search(/\{/) != -1) {
        // Macros finden! Innerhalb der {} darf nicht am ; getrennt werden. Noch nicht getestet: mehrere Makros hintereinander in einem construct.
        tmp = string.match(/\{/);
        tmp = tmp.length;
        l = 0;
        for (j = 0; j < tmp; j++) {
            k = string.slice(l).search(/\{/);
            mac = string.slice(k);
            mac = mac.slice(0, mac.search(/\}/) + 1);
            mac = mac.replace(/;/g, "?"); // Achtung! Fragezeichen duerfen daher nicht im Code eines Macros vorkommen!
            string = string.slice(0, k) + mac + string.slice(k + mac.length);
            l = k + 1;
        }
    }
    splitted = string.split(";");
    for (i = 0; i < splitted.length; i++) {
        // Leerzeichen am Anfang und am Ende entfernen
        splitted[i] = splitted[i].replace(/^\s+/, "").replace(/\s+$/, "");
        if (splitted[i].search(/\{/) != -1) {
            splitted[i] = splitted[i].replace(/\?/g, ";");
        }
        if (splitted[i].search(/Macro/) != -1) {
            this.addMacro(splitted[i]);
        } else {
            if (splitted[i].length > 0) {
                prop = false;
                if (splitted[i].search(/=/) != -1) {
                    objName = splitted[i].split("=");
                    propValue = objName[1];
                    propValue = propValue.replace(/^\s+/, "").replace(/\s+$/, "");
                    if (objName[0].search(/\./) != -1) {
                        prop = true;

                        objName = objName[0].split('.');
                        propName = objName[objName.length - 1];
                        propName = propName.replace(/^\s+/, "").replace(/\s+$/, "");
                        objName.pop();
                        objName = objName.join('.');
                        if (mode == 'macro') {
                            for (j = 0; j < params.length; j++) {
                                if (objName == params[j]) {
                                    objName = paraIn[j];
                                }
                            }
                        }
                        //alert("_"+objName+"_"+propName+"_"+propValue+"_");
                        //alert(JXG.getReference(this,objName).name);
                        JXG.getReference(this, objName).setAttribute(
                            propName + ":" + propValue
                        );
                    }
                }
                if (!prop) {
                    // nicht nur eine Eigenschaft setzen, sondern neues Element konstruieren
                    if (splitted[i].search(/=/) != -1) {
                        objName = splitted[i].split("=");
                        splitted[i] = objName[1].replace(/^\s+/, ""); // Leerzeichen am Anfang entfernen
                        objName = objName[0].replace(/\s+$/, ""); // Leerzeichen am Ende entfernen
                    } else {
                        objName = "";
                    }
                    attributes = {};
                    found = true;
                    while (found) {
                        if (splitted[i].search(/(.*)draft$/) != -1) {
                            attributes.draft = true;
                            splitted[i] = RegExp.$1;
                            splitted[i] = splitted[i].replace(/\s+$/, ""); // Leerzeichen am Ende entfernen
                        }
                        if (splitted[i].search(/(.*)invisible$/) != -1) {
                            attributes.visible = false;
                            splitted[i] = RegExp.$1;
                            splitted[i] = splitted[i].replace(/\s+$/, ""); // Leerzeichen am Ende entfernen
                        }
                        if (splitted[i].search(/(.*)nolabel$/) != -1) {
                            attributes.withLabel = false;
                            splitted[i] = RegExp.$1;
                            splitted[i] = splitted[i].replace(/\s+$/, ""); // Leerzeichen am Ende entfernen
                        }
                        if (splitted[i].search(/nolabel|invisible|draft/) == -1) {
                            found = false;
                        }
                    }
                    noMacro = true;
                    if (this.definedMacros) {
                        for (j = 0; j < this.definedMacros.macros.length; j++) {
                            pattern = new RegExp(
                                "^" + this.definedMacros.macros[j][0] + "\\s*\\("
                            );
                            if (splitted[i].search(pattern) != -1) {
                                // TODO: testen, was mit den Macros xxx und yxxx passiert
                                //alert("MACRO!"+splitted[i]+"_"+this.definedMacros.macros[j][2]);
                                noMacro = false;
                                // Parameter aufdroeseln
                                splitted[i].match(/\((.*)\)/);
                                tmp = RegExp.$1;
                                tmp = tmp.split(",");
                                for (k = 0; k < tmp.length; k++) {
                                    tmp[k].match(/\s*(\S*)\s*/);
                                    tmp[k] = RegExp.$1;
                                }
                                output[objName] = this.construct(
                                    this.definedMacros.macros[j][2],
                                    "macro",
                                    this.definedMacros.macros[j][1],
                                    tmp,
                                    objName
                                );
                                output.macros.push(output[objName]);
                                break;
                            }
                        }
                    }
                    if (noMacro) {
                        // splitted[i] war kein Macro-Aufruf
                        if (splitted[i].search(/^[\[\]].*[\[\]]$/) != -1) {
                            // Gerade, Halbgerade oder Segment
                            splitted[i].match(/([\[\]])(.*)([\[\]])/);
                            attributes.straightFirst = RegExp.$1 != "[";
                            attributes.straightLast = RegExp.$3 == "[";
                            defElements = RegExp.$2.replace(/^\s+/, "").replace(/\s+$/, "");
                            if (defElements.search(/ /) != -1) {
                                defElements.match(/(\S*) +(\S*)/);
                                defElements = [];
                                defElements[0] = RegExp.$1;
                                defElements[1] = RegExp.$2;
                            } // sonst wird die Gerade durch zwei Punkte definiert, die einen Namen haben, der aus nur jeweils einem Buchstaben besteht
                            if (objName != "") {
                                if (!JXG.exists(attributes.withLabel)) {
                                    attributes.withLabel = true;
                                }
                                attributes.name = objName;
                                if (mode == 'macro') {
                                    createdNames.push(objName);
                                }
                            }
                            if (mode == 'macro') {
                                if (macroName != "") {
                                    for (j = 0; j < createdNames.length; j++) {
                                        // vorher oder nachher?
                                        if (defElements[0] == createdNames[j]) {
                                            defElements[0] = macroName + "." + defElements[0];
                                        }
                                        if (defElements[1] == createdNames[j]) {
                                            defElements[1] = macroName + "." + defElements[1];
                                        }
                                    }
                                }
                                for (j = 0; j < params.length; j++) {
                                    if (defElements[0] == params[j]) {
                                        defElements = [paraIn[j], defElements[1]];
                                    }
                                    if (defElements[1] == params[j]) {
                                        defElements = [defElements[0], paraIn[j]];
                                    }
                                }
                                if (macroName != "") {
                                    attributes.id = macroName + "." + objName;
                                }
                            }
                            if (typeof defElements == 'string') {
                                defElements = [
                                    JXG.getReference(this, defElements.charAt(0)),
                                    JXG.getReference(this, defElements.charAt(1))
                                ];
                            } else {
                                defElements = [
                                    JXG.getReference(this, defElements[0]),
                                    JXG.getReference(this, defElements[1])
                                ];
                            }
                            output.lines.push(this.create("line", defElements, attributes));
                            if (objName != "") {
                                output[objName] = output.lines[output.lines.length - 1];
                            }
                        } else if (splitted[i].search(/k\s*\(.*/) != -1) {
                            // Kreis
                            splitted[i].match(/k\s*\(\s*(\S.*\S|\S)\s*,\s*(\S.*\S|\S)\s*\)/);
                            defElements = [];
                            defElements[0] = RegExp.$1;
                            defElements[1] = RegExp.$2;
                            for (j = 0; j <= 1; j++) {
                                if (defElements[j].search(/[\[\]]/) != -1) {
                                    // Linie, definiert durch [P_1 P_2] , ist bei den Parametern dabei
                                    defElements[j].match(/^[\[\]]\s*(\S.*\S)\s*[\[\]]$/);
                                    defElements[j] = RegExp.$1;
                                    if (defElements[j].search(/ /) != -1) {
                                        defElements[j].match(/(\S*) +(\S*)/);
                                        defElements[j] = [];
                                        defElements[j][0] = RegExp.$1;
                                        defElements[j][1] = RegExp.$2;
                                    } // sonst wird die Gerade durch zwei Punkte definiert, die einen Namen haben, der aus nur jeweils einem Buchstaben besteht
                                    if (mode == 'macro') {
                                        if (macroName != "") {
                                            for (k = 0; k < createdNames.length; k++) {
                                                // vorher oder nachher?
                                                if (defElements[j][0] == createdNames[k]) {
                                                    defElements[j][0] =
                                                        macroName + "." + defElements[j][0];
                                                }
                                                if (defElements[j][1] == createdNames[k]) {
                                                    defElements[j][1] =
                                                        macroName + "." + defElements[j][1];
                                                }
                                            }
                                        }
                                        for (k = 0; k < params.length; k++) {
                                            if (defElements[j][0] == params[k]) {
                                                defElements[j] = [paraIn[k], defElements[j][1]];
                                            }
                                            if (defElements[j][1] == params[k]) {
                                                defElements[j] = [defElements[j][0], paraIn[k]];
                                            }
                                        }
                                    }
                                    if (typeof defElements[j] == 'string') {
                                        defElements[j] = (function (el, board) {
                                            return function () {
                                                return JXG.getReference(
                                                    board,
                                                    el.charAt(0)
                                                ).Dist(JXG.getReference(board, el.charAt(1))); // TODO
                                            };
                                        })(defElements[j], this);
                                    } else {
                                        defElements[j] = (function (el, board) {
                                            return function () {
                                                return JXG.getReference(board, el[0]).Dist(
                                                    JXG.getReference(board, el[1])
                                                ); // TODO
                                            };
                                        })(defElements[j], this);
                                    }
                                } else if (defElements[j].search(/[0-9\.\s]+/) != -1) {
                                    // Radius als Zahl
                                    defElements[j] = 1.0 * defElements[j];
                                } else {
                                    // Element mit Name
                                    if (mode == 'macro') {
                                        if (macroName != "") {
                                            for (k = 0; k < createdNames.length; k++) {
                                                // vorher oder nachher?
                                                if (defElements[j] == createdNames[k]) {
                                                    defElements[j] =
                                                        macroName + "." + createdNames[k];
                                                }
                                            }
                                        }
                                        for (k = 0; k < params.length; k++) {
                                            if (defElements[j] == params[k]) {
                                                defElements[j] = paraIn[k];
                                            }
                                        }
                                    }
                                    defElements[j] = JXG.getReference(this, defElements[j]);
                                }
                            }
                            if (objName != "") {
                                if (!JXG.exists(attributes.withLabel)) {
                                    attributes.withLabel = true;
                                }
                                attributes.name = objName;
                                if (mode == 'macro') {
                                    if (macroName != "") {
                                        attributes.id = macroName + "." + objName;
                                    }
                                    createdNames.push(objName);
                                }
                            }
                            output.circles.push(this.create("circle", defElements, attributes));
                            if (objName != "") {
                                output[objName] = output.circles[output.circles.length - 1];
                            }
                        } else if (
                            splitted[i].search(
                                /^[A-Z]+.*\(\s*[0-9\.\-]+\s*[,\|]\s*[0-9\.\-]+\s*\)/
                            ) != -1 &&
                            splitted[i].search(/Macro\((.*)\)/) == -1
                        ) {
                            // Punkt, startet mit einem Grossbuchstaben! (definiert durch Koordinaten)
                            splitted[i].match(/^([A-Z]+\S*)\s*\(\s*(.*)\s*[,\|]\s*(.*)\s*\)$/);
                            objName = RegExp.$1; // Name
                            attributes.name = objName;
                            if (mode == 'macro') {
                                if (macroName != "") {
                                    attributes.id = macroName + "." + objName;
                                }
                                createdNames.push(objName);
                            }
                            output.points.push(
                                this.create(
                                    "point",
                                    [1.0 * RegExp.$2, 1.0 * RegExp.$3],
                                    attributes
                                )
                            );
                            output[objName] = output.points[output.points.length - 1];
                        } else if (
                            splitted[i].search(/^[A-Z]+.*\(.+(([,\|]\s*[0-9\.\-]+\s*){2})?/) !=
                                -1 &&
                            splitted[i].search(/Macro\((.*)\)/) == -1
                        ) {
                            // Gleiter, mit oder ohne Koordinaten
                            splitted[i].match(/([A-Z]+.*)\((.*)\)/);
                            objName = RegExp.$1;
                            defElements = RegExp.$2;
                            objName = objName.replace(/^\s+/, "").replace(/\s+$/, "");
                            defElements = defElements.replace(/^\s+/, "").replace(/\s+$/, "");
                            if (defElements.search(/[,\|]/) != -1) {
                                // Koordinaten angegeben
                                defElements.match(
                                    /(\S*)\s*[,\|]\s*([0-9\.]+)\s*[,\|]\s*([0-9\.]+)\s*/
                                );
                                defElements = [];
                                defElements[0] = RegExp.$1;
                                defElements[1] = 1.0 * RegExp.$2;
                                defElements[2] = 1.0 * RegExp.$3;
                            } else {
                                // keine Koordinaten
                                obj = defElements;
                                defElements = [];
                                defElements[0] = obj; // Name des definierenden Elements
                                defElements[1] = 0; // (0,0) als Gleiterkoordinaten vorgeben...
                                defElements[2] = 0;
                            }
                            attributes.name = objName;
                            if (mode == 'macro') {
                                if (macroName != "") {
                                    for (k = 0; k < createdNames.length; k++) {
                                        // vorher oder nachher?
                                        if (defElements[0] == createdNames[k]) {
                                            defElements[0] = macroName + "." + createdNames[k];
                                        }
                                    }
                                }
                                for (k = 0; k < params.length; k++) {
                                    if (defElements[0] == params[k]) {
                                        defElements[0] = paraIn[k];
                                    }
                                }
                                if (macroName != "") {
                                    attributes.id = macroName + "." + objName;
                                }
                                createdNames.push(objName);
                            }
                            output.points.push(
                                this.create(
                                    "glider",
                                    [
                                        defElements[1],
                                        defElements[2],
                                        JXG.getReference(this, defElements[0])
                                    ],
                                    attributes
                                )
                            );
                            output[objName] = output.points[output.points.length - 1];
                        } else if (splitted[i].search(/&/) != -1) {
                            // Schnittpunkt
                            splitted[i].match(/(.*)&(.*)/);
                            defElements = [];
                            defElements[0] = RegExp.$1;
                            defElements[1] = RegExp.$2;
                            defElements[0] = defElements[0].replace(/\s+$/, ""); // Leerzeichen am Ende entfernen
                            defElements[1] = defElements[1].replace(/^\s+/, ""); // Leerzeichen am Anfang entfernen
                            if (mode == 'macro') {
                                for (j = 0; j <= 1; j++) {
                                    if (macroName != "") {
                                        for (k = 0; k < createdNames.length; k++) {
                                            // vorher oder nachher?
                                            if (defElements[j] == createdNames[k]) {
                                                defElements[j] =
                                                    macroName + "." + createdNames[k];
                                            }
                                        }
                                    }
                                    for (k = 0; k < params.length; k++) {
                                        if (defElements[j] == params[k]) {
                                            defElements[j] = paraIn[k];
                                        }
                                    }
                                }
                            }
                            defElements[0] = JXG.getReference(this, defElements[0]);
                            defElements[1] = JXG.getReference(this, defElements[1]);
                            if (
                                (defElements[0].elementClass == JXG.OBJECT_CLASS_LINE ||
                                    defElements[0].elementClass == JXG.OBJECT_CLASS_CURVE) &&
                                (defElements[1].elementClass == JXG.OBJECT_CLASS_LINE ||
                                    defElements[1].elementClass == JXG.OBJECT_CLASS_CURVE)
                            ) {
                                if (objName != "") {
                                    attributes.name = objName;
                                    if (mode == 'macro') {
                                        if (macroName != "") {
                                            attributes.id = macroName + "." + objName;
                                        }
                                        createdNames.push(objName);
                                    }
                                }
                                obj = this.create(
                                    "intersection",
                                    [defElements[0], defElements[1], 0],
                                    attributes
                                );
                                output.intersections.push(obj);
                                if (objName != "") {
                                    output[attributes.name] = obj;
                                }
                            } else {
                                if (objName != "") {
                                    attributes.name = objName + "_1";
                                    if (mode == 'macro') {
                                        if (macroName != "") {
                                            attributes.id = macroName + "." + objName + "_1";
                                        }
                                        createdNames.push(objName + "_1");
                                    }
                                }
                                obj = this.create(
                                    "intersection",
                                    [defElements[0], defElements[1], 0],
                                    attributes
                                );
                                output.intersections.push(obj);
                                if (objName != "") {
                                    output[attributes.name] = obj;
                                }
                                if (objName != "") {
                                    attributes.name = objName + "_2";
                                    if (mode == 'macro') {
                                        if (macroName != "") {
                                            attributes.id = macroName + "." + objName + "_2";
                                        }
                                        createdNames.push(objName + "_2");
                                    }
                                }
                                obj = this.create(
                                    "intersection",
                                    [defElements[0], defElements[1], 1],
                                    attributes
                                );
                                output.intersections.push(obj);
                                if (objName != "") {
                                    output[attributes.name] = obj;
                                }
                            }
                        } else if (splitted[i].search(/\|[\|_]\s*\(/) != -1) {
                            // Parallele oder Senkrechte
                            splitted[i].match(/\|([\|_])\s*\(\s*(\S*)\s*,\s*(\S*)\s*\)/);
                            type = RegExp.$1;
                            if (type == "|") {
                                type = 'parallel'
                            } else {
                                // type == '_'
                                type = 'normal'
                            }
                            defElements = [];
                            defElements[0] = RegExp.$2;
                            defElements[1] = RegExp.$3;
                            if (mode == 'macro') {
                                for (j = 0; j <= 1; j++) {
                                    if (macroName != "") {
                                        for (k = 0; k < createdNames.length; k++) {
                                            // vorher oder nachher?
                                            if (defElements[j] == createdNames[k]) {
                                                defElements[j] =
                                                    macroName + "." + createdNames[k];
                                            }
                                        }
                                    }
                                    for (k = 0; k < params.length; k++) {
                                        if (defElements[j] == params[k]) {
                                            defElements[j] = paraIn[k];
                                        }
                                    }
                                }
                            }
                            if (objName != "") {
                                attributes.name = objName;
                                if (!JXG.exists(attributes.withLabel)) {
                                    attributes.withLabel = true;
                                }
                                if (mode == 'macro') {
                                    if (macroName != "") {
                                        attributes.id = macroName + "." + objName;
                                    }
                                    createdNames.push(objName);
                                }
                            }
                            output.lines.push(
                                this.create(
                                    type,
                                    [
                                        JXG.getReference(this, defElements[0]),
                                        JXG.getReference(this, defElements[1])
                                    ],
                                    attributes
                                )
                            );

                            if (objName != "") {
                                output[objName] = output.lines[output.lines.length - 1];
                            }
                        } else if (splitted[i].search(/^</) != -1) {
                            // Winkel
                            splitted[i].match(/<\s*\(\s*(\S*)\s*,\s*(\S*)\s*,\s*(\S*)\s*\)/);
                            defElements = [];
                            defElements[0] = RegExp.$1;
                            defElements[1] = RegExp.$2;
                            defElements[2] = RegExp.$3;
                            if (mode == 'macro') {
                                for (j = 0; j <= 2; j++) {
                                    if (macroName != "") {
                                        for (k = 0; k < createdNames.length; k++) {
                                            // vorher oder nachher?
                                            if (defElements[j] == createdNames[k]) {
                                                defElements[j] =
                                                    macroName + "." + createdNames[k];
                                            }
                                        }
                                    }
                                    for (k = 0; k < params.length; k++) {
                                        if (defElements[j] == params[k]) {
                                            defElements[j] = paraIn[k];
                                        }
                                    }
                                }
                            }
                            if (objName == "") {
                                output.lines.push(
                                    this.create(
                                        "angle",
                                        [
                                            JXG.getReference(this, defElements[0]),
                                            JXG.getReference(this, defElements[1]),
                                            JXG.getReference(this, defElements[2])
                                        ],
                                        attributes
                                    )
                                );
                            } else {
                                possibleNames = [
                                    "alpha",
                                    "beta",
                                    "gamma",
                                    "delta",
                                    "epsilon",
                                    "zeta",
                                    "eta",
                                    "theta",
                                    "iota",
                                    "kappa",
                                    "lambda",
                                    "mu",
                                    "nu",
                                    "xi",
                                    "omicron",
                                    "pi",
                                    "rho",
                                    "sigmaf",
                                    "sigma",
                                    "tau",
                                    "upsilon",
                                    "phi",
                                    "chi",
                                    "psi",
                                    "omega"
                                ];
                                type = "";
                                for (j = 0; j < possibleNames.length; j++) {
                                    if (objName == possibleNames[j]) {
                                        attributes.text = "&" + objName + ";";
                                        attributes.name = "&" + objName + ";";
                                        type = 'greek'
                                        break;
                                    } else {
                                        if (j == possibleNames.length - 1) {
                                            attributes.text = objName;
                                            attributes.name = objName;
                                        }
                                    }
                                }
                                if (!JXG.exists(attributes.withLabel)) {
                                    attributes.withLabel = true;
                                }
                                if (mode == 'macro') {
                                    if (macroName != "") {
                                        attributes.id = macroName + "." + objName;
                                    }
                                    createdNames.push(objName);
                                }
                                output.angles.push(
                                    this.create(
                                        "angle",
                                        [
                                            JXG.getReference(this, defElements[0]),
                                            JXG.getReference(this, defElements[1]),
                                            JXG.getReference(this, defElements[2])
                                        ],
                                        attributes
                                    )
                                );
                                output[objName] = output.angles[output.angles.length - 1];
                            }
                        } else if (
                            splitted[i].search(
                                /([0-9]+)\/([0-9]+)\(\s*(\S*)\s*,\s*(\S*)\s*\)/
                            ) != -1
                        ) {
                            // Punkt mit Teilverhaeltnis, z.B. Mittelpunkt
                            defElements = [];
                            defElements[0] = (1.0 * RegExp.$1) / (1.0 * RegExp.$2);
                            defElements[1] = RegExp.$3;
                            defElements[2] = RegExp.$4;
                            if (mode == 'macro') {
                                for (j = 1; j <= 2; j++) {
                                    if (macroName != "") {
                                        for (k = 0; k < createdNames.length; k++) {
                                            // vorher oder nachher?
                                            if (defElements[j] == createdNames[k]) {
                                                defElements[j] =
                                                    macroName + "." + createdNames[k];
                                            }
                                        }
                                    }
                                    for (k = 0; k < params.length; k++) {
                                        if (defElements[j] == params[k]) {
                                            defElements[j] = paraIn[k];
                                        }
                                    }
                                }
                            }
                            defElements[1] = JXG.getReference(this, RegExp.$3);
                            defElements[2] = JXG.getReference(this, RegExp.$4);
                            obj = [];
                            obj[0] = (function (el, board) {
                                return function () {
                                    return (
                                        (1 - el[0]) * el[1].coords.usrCoords[1] +
                                        el[0] * el[2].coords.usrCoords[1]
                                    );
                                };
                            })(defElements, this);
                            obj[1] = (function (el, board) {
                                return function () {
                                    return (
                                        (1 - el[0]) * el[1].coords.usrCoords[2] +
                                        el[0] * el[2].coords.usrCoords[2]
                                    );
                                };
                            })(defElements, this);
                            if (objName != "") {
                                attributes.name = objName;
                                if (mode == 'macro') {
                                    if (macroName != "") {
                                        attributes.id = macroName + "." + objName;
                                    }
                                    createdNames.push(objName);
                                }
                            }
                            output.points.push(
                                this.create("point", [obj[0], obj[1]], attributes)
                            );
                            if (objName != "") {
                                output[objName] = output.points[output.points.length - 1];
                            }
                        } else if (splitted[i].search(/(\S*)\s*:\s*(.*)/) != -1) {
                            // Funktionsgraph
                            objName = RegExp.$1;
                            tmp = JXG.GeonextParser.geonext2JS(RegExp.$2, this);
                            defElements = [new Function("x", "var y = " + tmp + "; return y;")];
                            attributes.name = objName;
                            output.functions.push(
                                this.create("functiongraph", defElements, attributes)
                            );
                            output[objName] = output.functions[output.functions.length - 1];
                        } else if (
                            splitted[i].search(/#(.*)\(\s*([0-9])\s*[,|]\s*([0-9])\s*\)/) != -1
                        ) {
                            // Text element
                            defElements = []; // [0-9\.\-]+
                            defElements[0] = RegExp.$1;
                            defElements[1] = 1.0 * RegExp.$2;
                            defElements[2] = 1.0 * RegExp.$3;
                            defElements[0] = defElements[0]
                                .replace(/^\s+/, "")
                                .replace(/\s+$/, ""); // trim
                            output.texts.push(
                                this.create(
                                    "text",
                                    [defElements[1], defElements[2], defElements[0]],
                                    attributes
                                )
                            );
                        } else if (splitted[i].search(/(\S*)\s*\[(.*)\]/) != -1) {
                            // Polygon
                            attributes.name = RegExp.$1;
                            if (!JXG.exists(attributes.withLabel)) {
                                attributes.withLabel = true;
                            }
                            defElements = RegExp.$2;
                            defElements = defElements.split(",");
                            for (j = 0; j < defElements.length; j++) {
                                defElements[j] = defElements[j]
                                    .replace(/^\s+/, "")
                                    .replace(/\s+$/, ""); // trim
                                if (mode == 'macro') {
                                    if (macroName != "") {
                                        for (k = 0; k < createdNames.length; k++) {
                                            // vorher oder nachher?
                                            if (defElements[j] == createdNames[k]) {
                                                defElements[j] =
                                                    macroName + "." + createdNames[k];
                                            }
                                        }
                                    }
                                    for (k = 0; k < params.length; k++) {
                                        if (defElements[j] == params[k]) {
                                            defElements[j] = paraIn[k];
                                        }
                                    }
                                }
                                defElements[j] = JXG.getReference(this, defElements[j]);
                            }
                            output.polygons.push(
                                this.create("polygon", defElements, attributes)
                            );
                            output[attributes.name] =
                                output.polygons[output.polygons.length - 1];
                        }
                    }
                }
            }
        }
    }
    this.update();
    return output;
};

/**
 * Parses a string like<br />
 * <tt>&lt;macro-name&gt; = Macro(A, B, C) { <Command in JSXGraph Construction syntax>; ...<Command in JXG-Construct syntax>; }</tt><br />
 * and adds it as a macro so it can be used in the JSXGraph Construction Syntax.
 * @param {String} string A string like the one in the methods description.
 * @see #construct
 */
JXG.Board.prototype.addMacro = function (string) {
    var defHead,
        defBody,
        defName = "",
        i;
    string.match(/(.*)\{(.*)\}/);
    defHead = RegExp.$1;
    defBody = RegExp.$2;
    if (defHead.search(/=/) != -1) {
        defHead.match(/\s*(\S*)\s*=.*/);
        defName = RegExp.$1;
        defHead = defHead.split("=")[1];
    }
    defHead.match(/Macro\((.*)\)/);
    defHead = RegExp.$1;
    defHead = defHead.split(",");
    for (i = 0; i < defHead.length; i++) {
        defHead[i].match(/\s*(\S*)\s*/);
        defHead[i] = RegExp.$1;
    }

    if (this.definedMacros == null) {
        this.definedMacros = {};
        this.definedMacros.macros = [];
    }

    this.definedMacros.macros.push([defName, defHead, defBody]);
    if (defName != "") {
        this.definedMacros.defName =
            this.definedMacros.macros[this.definedMacros.macros.length - 1];
    }
};
