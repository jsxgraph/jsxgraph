/*
 Copyright 2008-2023
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

/*global JXG: true*/
/*jslint nomen: true, plusplus: true*/

/////////////////////////////////////////////////////////
/////                   ATTENTION                   /////
/////  This reader is not used anymore. For files   /////
///// which were created in sketchometry 2+ please  /////
/////        use the new SketchometryReader!        /////
/////                                               /////
/////   THIS CODE WILL NOT BE DEVELOPED FURTHER!    /////
/////////////////////////////////////////////////////////

(function () {
    'use strict';

    // this is a small workaround to adapt the SketchReader to our new file API
    // we don't have to change anything in sketchometry.
    JXG.SketchReader = function (board, str) {
        this.read = function () {
            var i, t, arr, unzipped, meta, constr;

            unzipped = new JXG.Util.Unzip(JXG.Util.Base64.decodeAsArray(str)).unzip();

            if (!JXG.exists(unzipped[0])) {
                return '';
            }

            unzipped = JXG.Util.UTF8.decode(unzipped[0][0]);
            //constr = JSON.parse(unzipped);
            constr = jQuery.parseJSON(unzipped);

            meta = constr.pop();

            if (!JXG.exists(meta.unredo)) {
                t = constr.length - 1;
            } else {
                t = meta.unredo;
            }

            for (i = 0; i <= t; i++) {
                if (constr[i].type !== 0) {
                    try {
                        if (constr[i].type > 50) {
                            arr = JXG.SketchReader.generateJCodeMeta(constr[i], board);
                        } else {
                            arr = JXG.SketchReader.generateJCode(constr[i], board, constr);
                        }
                    } catch (e) {
                        JXG.debug('#steps: ' + constr.length);
                        JXG.debug('step: ' + i + ', type: ' + constr[i].type);
                        JXG.debug(constr[i]);
                    }

                    board.jc.parse(arr[0], true);
                }
            }

            // bounding box
            arr = meta.boundingBox;
            board.jc.parse('$board.setView(' + JSON.stringify(arr) + ');');

            return '';
        };
    };

    // No prototype here
    JXG.extend(
        JXG.SketchReader,
        /** @lends JXG.SketchReader */ {
            generateJCodeMeta: function () {
                return ['', '', '', ''];
            },

            id: function () {
                return JXG.Util.genUUID();
            },

            generator: {
                toFixed: 8, // should be enough for now ...
                freeLine: false,
                useGlider: false,
                useSymbols: false,
                useSliderVars: false,
                sliderVarPrefix: 'slider'
            },

            /**
             * Generates {@link JXG.JessieCode} code from a sketchometry construction step.
             * @param {Object} step
             * @param {Number} step.type One of the JXG.GENTYPE_* constant values
             * @param {Array} step.args Mostly visual properties
             * @param {Array} step.src_ids Parent element ids
             * @param {Array} step.dest_sub_ids Ids for subelements, e.g. the center of a circumcircle or the baseline
             * of a glider
             * @param {String} step.dest_id Id of the generated main element
             * @param {JXG.Board} board
             * @param {Array} step_log The complete step log
             * @returns {Array} JessieCode to set and reset the step.
             */
            generateJCode: function (step, board, step_log) {
                var i,
                    j,
                    k,
                    sub_id,
                    str,
                    str1,
                    str2,
                    objects,
                    pid1,
                    pid2,
                    pid3,
                    pid4,
                    pid5,
                    xstart,
                    ystart,
                    el,
                    arr,
                    step2,
                    options,
                    assign,
                    attrid,
                    le,
                    x,
                    y,
                    operator,
                    copy_log = [],
                    set_str = '',
                    reset_str = '',
                    ctx_set_str = '',
                    ctx_reset_str = '',
                    // these two could be outsourced into the iife surrounding the SketchReader definition

                    // print number -- helper to prepare numbers
                    // for printing, e.g. trim them with toFixed()
                    pn = function (v) {
                        if (options.toFixed > 0) {
                            v = parseFloat(v);
                            return JXG.toFixed(v, options.toFixed);
                        }

                        return v;
                    },
                    getObject = function (v) {
                        var o;

                        if (options.useSymbols) {
                            if (board.jc.scope.locals[v]) {
                                o = board.jc.scope.locals[v];
                            } else {
                                o = objects[v];
                            }
                        } else {
                            o = objects[v];
                        }

                        return o;
                    },

                    getAttribsString = function (object) {
                        var str = '', key, val, i;
                        for (key in object) {
                            if (!object.hasOwnProperty(key)) continue;
                            val = object[key];
                            if (JXG.isString(val))
                                val = '\'' + val + '\'';
                            if (JXG.isObject(val))
                                val = '<<' + getAttribsString(val).substring(2) + '>>';
                            if (JXG.isArray(val))
                                val = '[' + val.join(',') + ']';
                            str += ', ' + key + ': ' + val;
                        }
                        return str;
                    };

                options = JXG.SketchReader.generator;
                objects = board.objects;

                assign = '';
                attrid = 'id: \'' + step.dest_id + '\', ';

                if (
                    JXG.exists(board) &&
                    options.useSymbols &&
                    step.type !== JXG.GENTYPE_CIRCLECLONE
                ) {
                    attrid = '';
                    assign = step.dest_id + ' = ';

                    if (JXG.isArray(step.src_ids)) {
                        for (i = 0; i < step.src_ids.length; i++) {
                            str = board.jc.findSymbol(getObject(step.src_ids[i]), 0);

                            if (str.length > 0) {
                                step.src_ids[i] = str[0];
                            }
                        }
                    }
                }

                if (step.type > 50) {
                    return JXG.SketchReader.generateJCodeMeta(step, board);
                }

                switch (step.type) {
                    case JXG.GENTYPE_TRUNCATE:
                        if (!JXG.exists(step.args) || !JXG.exists(step.args.s)) {
                            set_str = 'trunclen = ' + JXG.Options.trunclen + '; ';
                        } else {
                            set_str = 'trunclen = ' + step.args.s + '; ';
                            reset_str = 'trunclen = ' + step.args.old + '; ';
                        }
                        break;

                    case JXG.GENTYPE_JCODE:
                        set_str = step.args.code;
                        break;

                    case JXG.GENTYPE_AXIS:
                        set_str = '';

                        set_str += step.args.name[0] +
                            ' = point(' + step.args.coords[0].usrCoords[1] + ', ' + step.args.coords[0].usrCoords[2] + ') <<id: \'' +
                            step.dest_sub_ids[0] + '\', name: \'' + step.args.name[0] + '\', fixed: true, priv: true, visible: false>>; ';
                        set_str += step.args.name[1] +
                            ' = point(' + step.args.coords[1].usrCoords[1] + ', ' + step.args.coords[1].usrCoords[2] + ') <<id: \'' +
                            step.dest_sub_ids[1] + '\', name: \'' + step.args.name[1] + '\', fixed: true, priv: true, visible: false>>; ';
                        set_str += step.args.name[2] +
                            ' = point(' + step.args.coords[2].usrCoords[1] + ', ' + step.args.coords[2].usrCoords[2] + ') <<id: \'' +
                            step.dest_sub_ids[2] + '\', name: \'' + step.args.name[2] + '\', fixed: true, priv: true, visible: false>>; ';

                        // x-axis
                        set_str += step.args.name[3] +
                            ' = axis(' + step.args.name[0] + ', ' + step.args.name[1] + ') <<id: \'' +
                            step.dest_sub_ids[3] + '\', name: \'' + step.args.name[3] + '\' ' +
                            getAttribsString(JXG.Options.sketchometry.axisX) +
                            '>>; ';

                        // y-axis
                        set_str += step.args.name[4] +
                            ' = axis(' + step.args.name[0] + ', ' + step.args.name[2] + ') <<id: \'' +
                            step.dest_sub_ids[4] + '\', name: \'' + step.args.name[4] + '\' ' +
                            getAttribsString(JXG.Options.sketchometry.axisY) +
                            '>>; ';

                        // automatics x-axis
                        set_str += step.dest_sub_ids[3] + '.ticks.visible = function() { return ' + step.dest_sub_ids[3] + '.visible; }; ';
                        set_str += step.dest_sub_ids[3] + '.ticks.drawZero = function() { ' +
                            'return !' + step.dest_sub_ids[4] + '.visible; ' +
                            '}; ';
                        set_str += step.dest_sub_ids[3] + '.ticks.drawLabels = function() { ' +
                            'return ' + step.dest_sub_ids[3] + '.visible; ' +
                            '}; ';
                        set_str += step.dest_sub_ids[3] + '.ticks.strokeColor = function() { ' +
                            'if(' + step.dest_sub_ids[3] + '.ticks.majorHeight >= 0) {' +
                            'if(' + step.dest_sub_ids[3] + '.ticks.tickColor == "auto") {' +
                            ' return ' + step.dest_sub_ids[3] + '.strokeColor; ' +
                            '} else {' +
                            ' return ' + step.dest_sub_ids[3] + '.ticks.tickColor; ' +
                            '} ' +
                            '} else {' +
                            ' return ' + step.dest_sub_ids[3] + '.ticks.gridColor;' +
                            '} ' +
                            '}; ';
                        set_str += step.dest_sub_ids[3] + '.ticks.strokeOpacity = function() { ' +
                            'if(' + step.dest_sub_ids[3] + '.ticks.majorHeight >= 0) {' +
                            'if(' + step.dest_sub_ids[3] + '.ticks.tickOpacity == "auto") {' +
                            ' return ' + step.dest_sub_ids[3] + '.strokeOpacity; ' +
                            '} else {' +
                            ' return ' + step.dest_sub_ids[3] + '.ticks.tickOpacity; ' +
                            '} ' +
                            '} else {' +
                            ' return ' + step.dest_sub_ids[3] + '.ticks.gridOpacity;' +
                            '} ' +
                            '}; ';
                        set_str += step.dest_sub_ids[3] + '.ticks.strokeWidth = function() { ' +
                            'if(' + step.dest_sub_ids[3] + '.ticks.majorHeight >= 0) {' +
                            'if(' + step.dest_sub_ids[3] + '.ticks.tickWidth == "auto") {' +
                            step.dest_sub_ids[3] + '.ticks.minorHeight = ' + JXG.Options.axis.ticks.minorHeight + ' + 1*' + step.dest_sub_ids[3] + '.strokeWidth; ' +
                            step.dest_sub_ids[3] + '.ticks.majorHeight = ' + JXG.Options.axis.ticks.majorHeight + ' + 2*' + step.dest_sub_ids[3] + '.strokeWidth; ' +
                            ' return ' + step.dest_sub_ids[3] + '.strokeWidth; ' +
                            '} else {' +
                            step.dest_sub_ids[3] + '.ticks.minorHeight = ' + JXG.Options.axis.ticks.minorHeight + ' + 1*' + step.dest_sub_ids[3] + '.ticks.tickWidth; ' +
                            step.dest_sub_ids[3] + '.ticks.majorHeight = ' + JXG.Options.axis.ticks.majorHeight + ' + 2*' + step.dest_sub_ids[3] + '.ticks.tickWidth; ' +
                            ' return ' + step.dest_sub_ids[3] + '.ticks.tickWidth; ' +
                            '} ' +
                            '} else {' +
                            ' return ' + step.dest_sub_ids[3] + '.ticks.gridWidth;' +
                            '} ' +
                            '}; ';

                        // automatics y-axis
                        set_str += step.dest_sub_ids[4] + '.ticks.visible = function() { return ' + step.dest_sub_ids[4] + '.visible; }; ';
                        set_str += step.dest_sub_ids[4] + '.ticks.drawZero = function() { ' +
                            'return !' + step.dest_sub_ids[3] + '.visible; ' +
                            '}; ';
                        set_str += step.dest_sub_ids[4] + '.ticks.drawLabels = function() { ' +
                            'return ' + step.dest_sub_ids[4] + '.visible; ' +
                            '}; ';
                        set_str += step.dest_sub_ids[4] + '.ticks.strokeColor = function() { ' +
                            'if(' + step.dest_sub_ids[4] + '.ticks.majorHeight >= 0) {' +
                            'if(' + step.dest_sub_ids[4] + '.ticks.tickColor == "auto") {' +
                            ' return ' + step.dest_sub_ids[4] + '.strokeColor; ' +
                            '} else {' +
                            ' return ' + step.dest_sub_ids[4] + '.ticks.tickColor; ' +
                            '} ' +
                            '} else {' +
                            ' return ' + step.dest_sub_ids[4] + '.ticks.gridColor;' +
                            '} ' +
                            '}; ';
                        set_str += step.dest_sub_ids[4] + '.ticks.strokeOpacity = function() { ' +
                            'if(' + step.dest_sub_ids[4] + '.ticks.majorHeight >= 0) {' +
                            'if(' + step.dest_sub_ids[4] + '.ticks.tickOpacity == "auto") {' +
                            ' return ' + step.dest_sub_ids[4] + '.strokeOpacity; ' +
                            '} else {' +
                            ' return ' + step.dest_sub_ids[4] + '.ticks.tickOpacity; ' +
                            '} ' +
                            '} else {' +
                            ' return ' + step.dest_sub_ids[4] + '.ticks.gridOpacity;' +
                            '} ' +
                            '}; ';
                        set_str += step.dest_sub_ids[4] + '.ticks.strokeWidth = function() { ' +
                            'if(' + step.dest_sub_ids[4] + '.ticks.majorHeight >= 0) {' +
                            'if(' + step.dest_sub_ids[4] + '.ticks.tickWidth == "auto") {' +
                            step.dest_sub_ids[4] + '.ticks.minorHeight = ' + JXG.Options.axis.ticks.minorHeight + ' + 1*' + step.dest_sub_ids[4] + '.strokeWidth; ' +
                            step.dest_sub_ids[4] + '.ticks.majorHeight = ' + JXG.Options.axis.ticks.majorHeight + ' + 2*' + step.dest_sub_ids[4] + '.strokeWidth; ' +
                            ' return ' + step.dest_sub_ids[4] + '.strokeWidth; ' +
                            '} else {' +
                            step.dest_sub_ids[4] + '.ticks.minorHeight = ' + JXG.Options.axis.ticks.minorHeight + ' + 1*' + step.dest_sub_ids[4] + '.ticks.tickWidth; ' +
                            step.dest_sub_ids[4] + '.ticks.majorHeight = ' + JXG.Options.axis.ticks.majorHeight + ' + 2*' + step.dest_sub_ids[4] + '.ticks.tickWidth; ' +
                            ' return ' + step.dest_sub_ids[4] + '.ticks.tickWidth; ' +
                            '} ' +
                            '} else {' +
                            ' return ' + step.dest_sub_ids[4] + '.ticks.gridWidth;' +
                            '} ' +
                            '}; ';

                        // hide
                        set_str += step.dest_sub_ids[3] + '.visible = false; ';
                        set_str += step.dest_sub_ids[4] + '.visible = false; ';

                        reset_str =
                            'remove(' +
                            step.dest_sub_ids[4] +
                            '); remove(' +
                            step.dest_sub_ids[3];
                        reset_str += '); remove(' + step.dest_sub_ids[2] + '); ';
                        reset_str +=
                            'remove(' +
                            step.dest_sub_ids[1] +
                            '); remove(' +
                            step.dest_sub_ids[0] +
                            '); ';

                        break;

                    case JXG.GENTYPE_MIDPOINT:
                        set_str =
                            assign +
                            'midpoint(' +
                            step.src_ids[0] +
                            ', ' +
                            step.src_ids[1] +
                            ') <<' + attrid + 'name: \'\'>>; ';

                        set_str += step.dest_id + '.setAttribute(<<traceattributes: <<size: function() {' +
                            ' return ' + step.dest_id + '.size ' + JXG.Options.sketchometry.traceSizeOperation + '; ' +
                            '}>> >>); ';
                        reset_str = 'remove(' + step.dest_id + '); ';
                        break;

                    case JXG.GENTYPE_PERPBISECTOR:
                        pid1 = step.src_ids[0]; // point 1
                        pid2 = step.src_ids[1]; // point 2
                        pid3 = step.dest_sub_ids[0]; // midpoint
                        pid4 = step.dest_sub_ids[1]; // segment
                        pid5 = step.dest_sub_ids[2]; // additional point of perpendicular bisector

                        set_str = '';
                        reset_str = '';

                        set_str +=
                            'midpoint(' + pid1 + ', ' + pid2 + ') ' +
                            '<<id: \'' + pid3 + '\', name: \'\', priv: true, visible: false>>; ';
                        set_str +=
                            'segment(' + pid1 + ', ' + pid2 + ') ' +
                            '<<id: \'' + pid4 + '\', name: \'\', priv: true, visible: false>>; ';
                        set_str +=
                            assign +
                            'normal(' + pid4 + ', ' + pid3 + ') ' +
                            '<<id: \'' + step.dest_id + '\', name: \'\'' +
                            ', point: <<id: \'' + pid5 + '\', name: \'\'>>' +
                            ', isPerpendicularBisector: true' +
                            ' >>; ';
                        set_str += step.dest_id + '.highlightStrokeWidth = function() { ' +
                            'return ' + step.dest_id + '.strokeWidth ' + JXG.Options.sketchometry.highlightStrokeWidthOperation + '; ' +
                            ' };';

                        reset_str = 'remove(' + step.dest_id + '); ';
                        reset_str = 'remove(' + pid5 + '); ';
                        reset_str = 'remove(' + pid4 + '); ';
                        reset_str = 'remove(' + pid3 + '); ';
                        break;

                    case JXG.GENTYPE_REFLECTION_ON_LINE:
                    case JXG.GENTYPE_REFLECTION_ON_POINT:

                        operator = 'reflection';
                        if (step.type === JXG.GENTYPE_REFLECTION_ON_POINT)
                            operator = 'mirrorelement';

                        // Polygon:
                        if (step.args.type === 'polygon') {
                            set_str = '';
                            el = step.src_ids[step.src_ids.length - 1];
                            for (i = 1; i < step.src_ids.length - 1; i++) {
                                set_str +=
                                    assign +
                                    operator + '(' +
                                    step.src_ids[i] +
                                    ', ' +
                                    el +
                                    ') <<id:"' + step.dest_sub_ids[i - 1] + '"';
                                if (JXG.exists(step.args.subnames)) {
                                    set_str += ', name:"' + step.args.subnames[i - 1] + '"';
                                } else {
                                    set_str += ', name: ""';
                                }
                                set_str += getAttribsString(board.options.sketchometry.reflection.point);
                                set_str += '>>;\n';
                            }

                            le = step.dest_sub_ids.length / 2;
                            set_str += assign + 'polygon(';
                            set_str += step.dest_sub_ids.slice(0, le).join();
                            set_str +=
                                ') <<borders: <<ids: [\'' +
                                step.dest_sub_ids.slice(le, 2 * le).join('\', \'') +
                                '\']';
                            x = [];
                            for (i = 0; i < le; i++) {
                                x.push('\'\'');
                            }
                            set_str += ', names: [' + x.join() + ']';
                            set_str += getAttribsString(board.options.sketchometry.reflection.stroke);
                            set_str += '>>, ' + attrid + ' hasInnerPoints: ' + JXG.Options.polygon.hasInnerPoints;
                            if (step.args.name !== '') {
                                set_str += ', name: "' + step.args.name + '"';
                                set_str += ', withLabel: true';
                            } else {
                                set_str += ', name: ""';
                                set_str += ', withLabel: false';
                            }
                            if (!step.args.isEmpty)
                                set_str += getAttribsString(board.options.sketchometry.reflection.fill);
                            else
                                set_str += ', fillColor: \'transparent\'';
                            set_str += '>>; ';
                            set_str += step.dest_id + '.hasInnerPoints = function() { ' +
                                'return !(' + step.dest_id + '.fillColor == \'transparent\' || ' + step.dest_id + '.fillColor == \'none\' || ' + step.dest_id + '.fillOpacity == 0); ' +
                                '}; ';
                            for (i = le; i < 2 * le; i++) {
                                set_str += step.dest_sub_ids[i] + '.highlightStrokeWidth = function() { ' +
                                    'return ' + step.dest_sub_ids[i] + '.strokeWidth ' + JXG.Options.sketchometry.highlightStrokeWidthOperation + '; ' +
                                    ' };';
                            }

                            ///////////////

                        } else if (step.args.type === 'line' || step.args.type === 'vector') {
                            set_str = '';
                            el = step.src_ids[step.src_ids.length - 1];
                            // Create two end points.
                            for (i = 1; i < step.src_ids.length - 1; i++) {
                                set_str +=
                                    assign +
                                    operator + '(' +
                                    step.src_ids[i] +
                                    ', ' +
                                    el +
                                    ') <<id:"' +
                                    step.dest_sub_ids[i - 1] +
                                    '"';
                                if (JXG.exists(step.args.subnames)) {
                                    set_str += ', name:"' + step.args.subnames[i - 1] + '"';
                                } else {
                                    set_str += ', name: ""';
                                }
                                set_str += getAttribsString(board.options.sketchometry.reflection.point);
                                set_str += '>>;\n';
                            }

                            if (step.args.type === 'vector') {
                                set_str +=
                                    assign +
                                    'arrow(' +
                                    step.dest_sub_ids[0] +
                                    ',' +
                                    step.dest_sub_ids[1] +
                                    ') ';
                            } else {
                                set_str +=
                                    assign +
                                    'line(' +
                                    step.dest_sub_ids[0] +
                                    ',' +
                                    step.dest_sub_ids[1] +
                                    ') ';
                            }
                            set_str += '<<';
                            set_str += attrid + ' name: "' + step.args.name + '"';
                            set_str += getAttribsString(board.options.sketchometry.reflection.stroke);
                            if (step.args.type === 'line')
                                if (JXG.exists(step.args.attr)) {
                                    set_str += ', firstArrow: ' + step.args.attr.firstArrow;
                                    set_str += ', lastArrow: ' + step.args.attr.lastArrow;
                                    set_str += ', straightFirst: ' + step.args.attr.straightFirst;
                                    set_str += ', straightLast: ' + step.args.attr.straightLast;
                                } else {
                                    set_str += ', firstArrow: ' + step.args.firstArrow;
                                    set_str += ', lastArrow: ' + step.args.lastArrow;
                                    set_str += ', straightFirst: ' + step.args.straightFirst;
                                    set_str += ', straightLast: ' + step.args.straightLast;
                                }

                            if (step.args.name !== '') {
                                set_str += ', withLabel: true';
                            }
                            set_str += '>>; ';
                            set_str += step.dest_id + '.highlightStrokeWidth = function() { ' +
                                'return ' + step.dest_id + '.strokeWidth ' + JXG.Options.sketchometry.highlightStrokeWidthOperation + '; ' +
                                ' };';

                            ///////////////

                        } else if (step.args.type === 'circle') {
                            set_str +=
                                assign +
                                operator + '(' +
                                step.src_ids[0] +
                                ',' +
                                step.src_ids[2] +
                                ') ';
                            set_str += '<<';
                            set_str += attrid + ' name: "' + step.args.name + '"';
                            set_str += getAttribsString(board.options.sketchometry.reflection.stroke);
                            if (!step.args.isEmpty)
                                set_str += getAttribsString(board.options.sketchometry.reflection.fill);
                            else
                                set_str += ', fillColor: \'transparent\'';
                            if (step.args.name !== '') {
                                set_str += ', withLabel: true';
                            }

                            set_str += ', center: <<id:"' + step.dest_sub_ids[0] + '"';
                            if (JXG.exists(step.args.subnames)) {
                                set_str += ', name:"' + step.args.subnames[0] + '"';
                            } else {
                                set_str += ', name: ""';
                            }
                            set_str += getAttribsString(board.options.sketchometry.reflection.point);
                            set_str += '>>';
                            set_str += '>>; ';
                            set_str += step.dest_id + '.hasInnerPoints = function() { ' +
                                'return !(' + step.dest_id + '.fillColor == \'transparent\' || ' + step.dest_id + '.fillColor == \'none\' || ' + step.dest_id + '.fillOpacity == 0); ' +
                                '}; ';
                            set_str += step.dest_id + '.highlightStrokeWidth = function() { ' +
                                'return ' + step.dest_id + '.strokeWidth ' + JXG.Options.sketchometry.highlightStrokeWidthOperation + '; ' +
                                ' };';

                            ///////////////

                        } else if (step.args.type === 'point') {
                            set_str =
                                assign +
                                operator + '(' +
                                step.src_ids[0] +
                                ', ' +
                                step.src_ids[1] +
                                ')';
                            set_str += '<<' + attrid + ' name: "' + step.args.name + '"';
                            set_str += getAttribsString(board.options.sketchometry.reflection.point);
                            if (step.args.name !== '')
                                set_str += ', withLabel: true';
                            set_str += '>>; ';

                            ///////////////

                        } else {
                            set_str =
                                assign +
                                operator + '(' +
                                step.src_ids[0] +
                                ', ' +
                                step.src_ids[1] +
                                ')';
                            set_str += '<<' + attrid + ' name: "' + step.args.name + '"';
                            set_str += getAttribsString(board.options.sketchometry.reflection.stroke);
                            if (!step.args.isEmpty)
                                set_str += getAttribsString(board.options.sketchometry.reflection.fill);
                            else
                                set_str += ', fillColor: \'transparent\'';

                            if (step.args.name !== '')
                                set_str += ', withLabel: true';
                            set_str += '>>; ';
                            set_str += step.dest_id + '.highlightStrokeWidth = function() { ' +
                                'return ' + step.dest_id + '.strokeWidth ' + JXG.Options.sketchometry.highlightStrokeWidthOperation + '; ' +
                                ' };';
                        }

                        reset_str = '';
                        for (i = 0; i < step.dest_sub_ids.length; i++) {
                            if (step.dest_sub_ids[i] !== 0) {
                                reset_str += 'remove(' + step.dest_sub_ids[i] + '); ';
                            }
                        }
                        reset_str += 'remove(' + step.dest_id + '); ';

                        break;

                    case JXG.GENTYPE_TANGENT:
                        if (step.args.create_point) {
                            sub_id = step.dest_sub_ids[2];
                            set_str =
                                'point(' +
                                pn(step.args.usrCoords[1]) +
                                ',' +
                                pn(step.args.usrCoords[2]) +
                                ') <<id: \'';
                            set_str += sub_id + '\'' +
                                getAttribsString(board.options.glider) +
                                '>>; ' +
                                sub_id + '.glide(';
                            set_str += step.src_ids[0] + '); ';
                            set_str += sub_id + '.setAttribute(<<traceattributes: <<size: function() {' +
                                ' return ' + sub_id + '.size ' + JXG.Options.sketchometry.traceSizeOperation + '; ' +
                                '} >> >>); ';
                            set_str += sub_id + '.isPartOfTangent = true;';
                            reset_str = 'remove(' + sub_id + '); ';
                        } else {
                            sub_id = step.src_ids[0];
                            set_str += sub_id + '.isPartOfTangent = true;';
                            reset_str = sub_id + '.isPartOfTangent = false;';
                        }

                        set_str +=
                            assign +
                            'tangent(' +
                            sub_id +
                            ') <<' +
                            attrid +
                            'point1: <<name: \'';
                        set_str +=
                            '\', id: \'' +
                            step.dest_sub_ids[0] +
                            '\', priv: true>>, point2: <<name: \'';
                        set_str += '\', id: \'' + step.dest_sub_ids[1] + '\', priv: true>> >>; ';
                        set_str += step.dest_id + '.highlightStrokeWidth = function() { ' +
                            'return ' + step.dest_id + '.strokeWidth ' + JXG.Options.sketchometry.highlightStrokeWidthOperation + '; ' +
                            ' };';
                        reset_str = 'remove(' + step.dest_sub_ids[0] + '); ' + reset_str;
                        reset_str =
                            'remove(' +
                            step.dest_id +
                            '); remove(' +
                            step.dest_sub_ids[1] +
                            '); ' +
                            reset_str;
                        break;

                    case JXG.GENTYPE_PARALLEL:
                        if (step.args.create_point) {
                            sub_id = step.dest_sub_ids[1];
                            set_str =
                                'point(' +
                                pn(step.args.usrCoords[1]) +
                                ', ' +
                                pn(step.args.usrCoords[2]) +
                                ') <<id: \'';
                            set_str += sub_id + '\', name: \'\', visible: false, priv: true>>; ';
                            reset_str = 'remove(' + sub_id + '); ';
                        } else {
                            sub_id = step.src_ids[1];
                        }

                        set_str +=
                            assign +
                            'parallel(' +
                            step.src_ids[0] +
                            ', ' +
                            sub_id +
                            ') <<' +
                            attrid +
                            'name: \'\', point: <<id: \'';
                        set_str += step.dest_sub_ids[0] + '\', name: \'\'>> >>; ';
                        set_str += step.dest_id + '.highlightStrokeWidth = function() { ' +
                            'return ' + step.dest_id + '.strokeWidth ' + JXG.Options.sketchometry.highlightStrokeWidthOperation + '; ' +
                            ' };';
                        reset_str =
                            'remove(' +
                            step.dest_id +
                            '); remove(' +
                            step.dest_sub_ids[0] +
                            '); ' +
                            reset_str;
                        break;

                    case JXG.GENTYPE_BISECTORLINES:
                        set_str =
                            'bisectorlines(' +
                            step.src_ids[0] +
                            ', ' +
                            step.src_ids[1] +
                            ') <<line1: <<id: \'';
                        set_str =
                            set_str +
                            step.dest_sub_ids[2] +
                            '\', point1: <<id: \'' +
                            step.dest_sub_ids[1];
                        set_str += '\', name: \'\'>>, point2: <<id: \'' + step.dest_sub_ids[0];
                        set_str += '\', name: \'\'>>>>, line2: <<id: \'' + step.dest_sub_ids[5];
                        set_str += '\', point1: <<id: \'' + step.dest_sub_ids[4] + '\', name: \'';
                        set_str += '\'>>, point2: <<id: \'' + step.dest_sub_ids[3] + '\', name: \'';
                        set_str += '\'>>>>>>; ';
                        reset_str =
                            'remove(' +
                            step.dest_sub_ids[5] +
                            '); remove(' +
                            step.dest_sub_ids[4] +
                            '); remove(';
                        reset_str +=
                            step.dest_sub_ids[3] +
                            '); remove(' +
                            step.dest_sub_ids[2] +
                            '); remove(';
                        reset_str +=
                            step.dest_sub_ids[1] + '); remove(' + step.dest_sub_ids[0] + '); ';
                        break;

                    case JXG.GENTYPE_BOARDIMG:
                        set_str =
                            'image(\'' +
                            step.args.s +
                            '\', [ ' +
                            step.args.anchor +
                            ' ], [ ' +
                            step.args.scale +
                            ' ]) ';
                        set_str += '<<id: \'' + step.dest_id + '\'>>; ';

                        reset_str = 'remove(' + step.dest_id + '); ';
                        break;

                    case JXG.GENTYPE_BISECTOR:
                        if (step.args.create_point) {
                            set_str = '';
                            reset_str = '';

                            pid1 = step.dest_sub_ids[1];
                            pid2 = step.dest_sub_ids[2];

                            if (options.useGlider) {
                                set_str +=
                                    'glider(' +
                                    pn(step.args.usrCoords[1]) +
                                    ', ' +
                                    pn(step.args.usrCoords[2]) +
                                    ', ' +
                                    step.src_ids[0] +
                                    ')';
                                set_str +=
                                    '<<id: \'' +
                                    pid1 +
                                    '\', name:\'\', withLabel:false, priv:true, visible:false >>; ';

                                set_str +=
                                    'glider(' +
                                    pn(step.args.usrCoords[1]) +
                                    ', ' +
                                    pn(step.args.usrCoords[2]) +
                                    ', ' +
                                    step.src_ids[1] +
                                    ')';
                                set_str +=
                                    '<<id: \'' +
                                    pid2 +
                                    '\', name:\'\', withLabel:false, priv:true, visible:false >>; ';
                            } else {
                                // Projection to first line
                                set_str +=
                                    'point(' +
                                    pn(step.args.usrCoords[1]) +
                                    ', ' +
                                    pn(step.args.usrCoords[2]) +
                                    ') ';
                                set_str += '<<id:\'' + pid1 + '\', ';
                                set_str +=
                                    'name:\'\', withLabel:false, priv:true, visible:false >>; ';
                                set_str += pid1 + '.glide(' + step.src_ids[0] + '); ';

                                // Projection to second line
                                set_str +=
                                    'point(' +
                                    pn(step.args.usrCoords[1]) +
                                    ', ' +
                                    pn(step.args.usrCoords[2]) +
                                    ') ';
                                set_str += '<<id:\'' + pid2 + '\', ';
                                set_str += 'name:\'\', priv:true, visible:false >>; ';
                                set_str += pid2 + '.glide(' + step.src_ids[1] + '); ';
                            }

                            reset_str += 'remove(' + pid1 + '); ';
                            reset_str += 'remove(' + pid2 + '); ';

                            if (step.args.create_intersection) {
                                // intersection point
                                pid3 = step.dest_sub_ids[3];
                                set_str +=
                                    'intersection(' +
                                    step.src_ids[0] +
                                    ', ' +
                                    step.src_ids[1] +
                                    ', 0) ';
                                set_str +=
                                    '<<id:\'' +
                                    pid3 +
                                    '\', fillColor: \'' +
                                    step.args.fillColor +
                                    '\', ';
                                set_str += 'name:\'\', priv:true, visible:false >>; ';
                                reset_str += 'remove(' + pid3 + '); ';
                            } else {
                                pid3 = step.src_ids[2];
                            }

                            set_str +=
                                assign + 'bisector(' + pid1 + ', ' + pid3 + ', ' + pid2 + ') ';
                            set_str +=
                                '<<' +
                                attrid +
                                'name: \'\', point: <<id: \'' +
                                step.dest_sub_ids[0] +
                                '\', priv: true, name: \'';
                            set_str += step.dest_sub_ids[0] + '\'>> >>;';
                            reset_str +=
                                'remove(' +
                                step.dest_id +
                                '); remove(' +
                                step.dest_sub_ids[0] +
                                ');';
                        } else {
                            set_str =
                                assign +
                                'bisector(' +
                                step.src_ids[1] +
                                ', ' +
                                step.src_ids[2] +
                                ', ' +
                                step.src_ids[0];
                            set_str +=
                                ') <<' +
                                attrid +
                                'name: \'\', point: <<id: \'' +
                                step.dest_sub_ids[0] +
                                '\', priv: true, name: \'';
                            set_str += step.dest_sub_ids[0] + '\'>>>>;';
                            reset_str =
                                'remove(' +
                                step.dest_id +
                                '); remove(' +
                                step.dest_sub_ids[0] +
                                ');';
                        }
                        set_str += step.dest_id + '.highlightStrokeWidth = function() { ' +
                            'return ' + step.dest_id + '.strokeWidth ' + JXG.Options.sketchometry.highlightStrokeWidthOperation + '; ' +
                            ' };';
                        break;

                    case JXG.GENTYPE_NORMAL:
                        if (step.args.create_point) {
                            sub_id = step.dest_sub_ids[1];
                            set_str =
                                'point(' +
                                pn(step.args.usrCoords[1]) +
                                ', ' +
                                pn(step.args.usrCoords[2]);
                            set_str +=
                                ') <<id: \'' +
                                sub_id +
                                '\', name: \'\', visible: false, priv: true>>; ';
                            reset_str = 'remove(' + sub_id + '); ';
                        } else {
                            sub_id = step.src_ids[1];
                        }

                        set_str +=
                            assign +
                            'normal(' +
                            sub_id +
                            ', ' +
                            step.src_ids[0] +
                            ') <<' +
                            attrid;
                        set_str +=
                            'name: \'\', point: <<id: \'' + step.dest_sub_ids[0] + '\', name: \'';
                        set_str += '\'>> >>; ';
                        set_str += step.dest_id + '.highlightStrokeWidth = function() { ' +
                            'return ' + step.dest_id + '.strokeWidth ' + JXG.Options.sketchometry.highlightStrokeWidthOperation + '; ' +
                            ' };';
                        reset_str =
                            'remove(' +
                            step.dest_id +
                            '); remove(' +
                            step.dest_sub_ids[0] +
                            '); ' +
                            reset_str;
                        break;

                    case JXG.GENTYPE_PERPSEGMENT:
                        set_str +=
                            assign +
                            'perpendicularsegment(' +
                            step.src_ids[1] +
                            ', ' +
                            step.src_ids[0] +
                            ') <<' +
                            attrid;
                        set_str +=
                            'name: \'\', point: <<id: \'' + step.dest_sub_ids[0] + '\', name: \'';
                        set_str += '\'>> >>; ';
                        set_str += step.dest_id + '.highlightStrokeWidth = function() { ' +
                            'return ' + step.dest_id + '.strokeWidth ' + JXG.Options.sketchometry.highlightStrokeWidthOperation + '; ' +
                            ' };';
                        reset_str =
                            'remove(' +
                            step.dest_id +
                            '); remove(' +
                            step.dest_sub_ids[0] +
                            '); ' +
                            reset_str;
                        break;

                    case JXG.GENTYPE_POINT:
                        set_str =
                            assign +
                            'point(' + pn(step.args.usrCoords[1]) + ', ' + pn(step.args.usrCoords[2]) + ')';
                        set_str +=
                            (options.useSymbols
                                ? ''
                                : ' <<id: \'' + step.dest_id + '\'' +
                                ', snapToGridIntern: ' + JXG.Options.elements.snapToGrid +
                                ', snapToPointsIntern: ' + JXG.Options.elements.snapToPoints +
                                (JXG.exists(step.args.name) ? ', name: \'' + step.args.name + '\'' : '') +
                                '>>') +
                            '; ';
                        set_str += step.dest_id + '.setAttribute(<<traceattributes: <<size: function() {' +
                            ' return ' + step.dest_id + '.size ' + JXG.Options.sketchometry.traceSizeOperation + '; ' +
                            '} >> >>); ';
                        set_str += step.dest_id + '.snapToGrid = function() { ' +
                            'return sketchoAttribute(\'snapToGridGlobal\') ? sketchoAttribute(\'snapToGridGlobal\') : ' + step.dest_id + '.snapToGridIntern; ' +
                            '}; ';
                        set_str += step.dest_id + '.snapToPoints = function() { ' +
                            'return sketchoAttribute(\'snapToPointsGlobal\') ? sketchoAttribute(\'snapToPointsGlobal\') : ' + step.dest_id + '.snapToPointsIntern; ' +
                            '}; ';
                        set_str += step.dest_id + '.moveTo([' + pn(step.args.usrCoords[1]) + ', ' + pn(step.args.usrCoords[2]) + ']); ';

                        reset_str = 'remove(' + step.dest_id + '); ';
                        break;

                    case JXG.GENTYPE_GLIDER:
                        if (options.useGlider) {
                            set_str =
                                assign +
                                'glider(' + pn(step.args.usrCoords[1]) + ', ' + pn(step.args.usrCoords[2]) + ', ' + step.src_ids[0] + ')';
                            set_str +=
                                (options.useSymbols
                                    ? ''
                                    : '<<id: \'' + step.dest_id + '\'' +
                                    ', snapToGrid: false' +
                                    ', snapToPointsIntern: ' + JXG.Options.elements.snapToPoints +
                                    '>>') + ';';
                            set_str += step.dest_id + '.setAttribute(<<traceattributes: <<size: function() {' +
                                ' return ' + step.dest_id + '.size ' + JXG.Options.sketchometry.traceSizeOperation + '; ' +
                                '} >> >>); ';
                            set_str += step.dest_id + '.snapToPoints = function() { ' +
                                'return sketchoAttribute(\'snapToPointsGlobal\') ? sketchoAttribute(\'snapToPointsGlobal\') : ' + step.dest_id + '.snapToPointsIntern; ' +
                                '}; ';
                            set_str += step.dest_id + '.moveTo([' + pn(step.args.usrCoords[1]) + ', ' + pn(step.args.usrCoords[2]) + ']); ';
                        } else {
                            set_str =
                                assign +
                                'point(' + pn(step.args.usrCoords[1]) + ', ' + pn(step.args.usrCoords[2]) + ')';
                            set_str +=
                                ' <<' +
                                attrid +
                                'fillColor: \'' + JXG.Options.glider.fillColor +
                                '\'';
                            set_str +=
                                ', strokeColor: \'' + JXG.Options.glider.strokeColor + '\'' +
                                ', snapToGrid: false' +
                                ', snapToPointsIntern: ' + JXG.Options.elements.snapToPoints;
                            set_str += '>>; ';
                            set_str += step.dest_id + '.glide(' + step.src_ids[0] + '); ';
                            set_str += step.dest_id + '.setAttribute(<<traceattributes: <<size: function() {' +
                                ' return ' + step.dest_id + '.size ' + JXG.Options.sketchometry.traceSizeOperation + '; ' +
                                '} >> >>); ';
                            set_str += step.dest_id + '.snapToPoints = function() { ' +
                                'return sketchoAttribute(\'snapToPointsGlobal\') ? sketchoAttribute(\'snapToPointsGlobal\') : ' + step.dest_id + '.snapToPointsIntern; ' +
                                '}; ';
                            set_str += step.dest_id + '.moveTo([' + pn(step.args.usrCoords[1]) + ', ' + pn(step.args.usrCoords[2]) + ']); ';
                        }
                        set_str += step.dest_id + '.onPolygon = ' + !!step.args.onPolygon + ';';

                        if (!(step.args && step.args.undoIsEmpty)) {
                            reset_str = 'remove(' + step.dest_id + '); ';
                        }

                        break;

                    case JXG.GENTYPE_INTERSECTION:
                        set_str =
                            assign +
                            'intersection(' +
                            step.src_ids[0] +
                            ', ' +
                            step.src_ids[1] +
                            ', ' +
                            step.args.choice;
                        set_str +=
                            ') <<' +
                            attrid +
                            ' fillColor: \'' +
                            JXG.Options.intersection.fillColor +
                            '\'';
                        set_str +=
                            ', strokeColor: \'' + JXG.Options.intersection.strokeColor + '\'';
                        set_str += '>>; ';
                        set_str += step.dest_id + '.setAttribute(<<traceattributes: <<size: function() {' +
                            ' return ' + step.dest_id + '.size ' + JXG.Options.sketchometry.traceSizeOperation + '; ' +
                            '} >> >>); ';

                        if (!(step.args && step.args.undoIsEmpty)) {
                            reset_str = 'remove(' + step.dest_id + '); ';
                        }

                        break;

                    case JXG.GENTYPE_MIGRATE:
                        set_str =
                            '$board.migratePoint(' +
                            step.src_ids[0] +
                            ', ' +
                            step.dest_id +
                            ', false); ';

                        if (step.args && step.args.migrateToGlider) {
                            var o, gl, uc1, uc2;

                            reset_str = step.dest_id + '.free(); ' + step.dest_id;
                            reset_str +=
                                '.fillColor = \'' + step.args.fillColor + '\'; ' + step.dest_id;
                            reset_str += '.strokeColor = \'' + step.args.strokeColor + '\'; ';

                            uc1 = step.args.usrCoords[1];
                            uc2 = step.args.usrCoords[2];

                            reset_str += 'point(' + uc1 + ', ' + uc2 + ')';
                            reset_str += ' <<id: \'' + step.src_ids[0] + '\', name: \'\'>>' + '; ';
                            reset_str +=
                                '$board.migratePoint(' +
                                step.dest_id +
                                ', ' +
                                step.src_ids[0] +
                                ', false); ';
                            reset_str +=
                                step.src_ids[0] + '.name = \'' + step.args.orig_name + '\'; ';
                            reset_str +=
                                step.src_ids[0] +
                                '.label.setText(\'' +
                                step.args.orig_name +
                                '\'); ';

                            o = board.objects[step.dest_id];
                            gl = o.slideObject.id;

                            uc1 = o.coords.usrCoords[1];
                            uc2 = o.coords.usrCoords[2];

                            reset_str += assign + 'point(' + uc1 + ', ' + uc2 + ') ';
                            reset_str +=
                                '<<' +
                                attrid +
                                'fillColor: \'' +
                                JXG.Options.glider.fillColor +
                                '\'>>; ';
                            reset_str += step.dest_id + '.glide(' + gl + '); ';
                        } else {
                            // Do nothing
                            //reset_str = 'remove(' + step.dest_id + '); ';
                        }

                        break;

                    case JXG.GENTYPE_COMBINED:
                        set_str = reset_str = '';

                        for (i = 0; i < step.args.steps.length; i++) {
                            arr = this.generateJCode(step.args.steps[i], board, step_log);

                            set_str = set_str + arr[0];
                            reset_str = arr[2] + reset_str;
                        }

                        break;

                    case JXG.GENTYPE_CIRCLE:
                        var withName = 'name: \'\', withLabel: true,';

                        if (step.args.withName) withName = 'withLabel: true,';

                        if (
                            step.args.create_by_additional_point ||
                            step.args.create_point // backwards compatibility
                        ) {
                            if (
                                !JXG.exists(step.args.center_existing) ||
                                !step.args.center_existing
                            ) {
                                set_str =
                                    'point(' + pn(step.args.usrCoords[1]) + ', ' + pn(step.args.usrCoords[2]) + ') ';
                                set_str +=
                                    '<<id: \'' + step.dest_sub_ids[0] + '\', ' +
                                    withName +
                                    ' snapToGridIntern: ' + JXG.Options.elements.snapToGrid +
                                    ', snapToPointsIntern: ' + JXG.Options.elements.snapToPoints +
                                    ', visible: true, priv: false>>; ';
                                set_str += step.dest_sub_ids[0] + '.setAttribute(<<traceattributes: <<size: function() {' +
                                    ' return ' + step.dest_sub_ids[0] + '.size ' + JXG.Options.sketchometry.traceSizeOperation + '; ' +
                                    '} >> >>); ';
                                set_str += step.dest_sub_ids[0] + '.snapToGrid = function() { ' +
                                    'return sketchoAttribute(\'snapToGridGlobal\') ? sketchoAttribute(\'snapToGridGlobal\') : ' + step.dest_sub_ids[0] + '.snapToGridIntern; ' +
                                    '}; ';
                                set_str += step.dest_sub_ids[0] + '.snapToPoints = function() { ' +
                                    'return sketchoAttribute(\'snapToPointsGlobal\') ? sketchoAttribute(\'snapToPointsGlobal\') : ' + step.dest_sub_ids[0] + '.snapToPointsIntern; ' +
                                    '}; ';
                                set_str += step.dest_sub_ids[0] + '.moveTo([' + pn(step.args.usrCoords[1]) + ', ' + pn(step.args.usrCoords[2]) + ']); ';
                            }

                            set_str +=
                                assign +
                                'circle(' +
                                (!JXG.exists(step.args.center_existing) || !step.args.center_existing ? step.dest_sub_ids[0] : step.src_ids[0]) +
                                ', ' +
                                step.src_ids[1] +
                                ') <<' +
                                attrid;
                            set_str +=
                                'name: \'\'' +
                                ', creationGesture: \'center-point\'' +
                                ', creationCenterExisting: ' + (JXG.exists(step.args.center_existing) && step.args.center_existing) +
                                ', fillOpacity: ' + JXG.Options.opacityLevel +
                                ', hasInnerPoints: true' +
                                '>>; ';
                            set_str += step.dest_id + '.hasInnerPoints = function() { ' +
                                'return !(' + step.dest_id + '.fillColor == \'transparent\' || ' + step.dest_id + '.fillColor == \'none\' || ' + step.dest_id + '.fillOpacity == 0); ' +
                                '}; ';
                            set_str += step.dest_id + '.highlightStrokeWidth = function() { ' +
                                'return ' + step.dest_id + '.strokeWidth ' + JXG.Options.sketchometry.highlightStrokeWidthOperation + '; ' +
                                ' };';

                            reset_str = 'remove(' + step.dest_id + '); ';
                            if (!JXG.exists(step.args.center_existing) || !step.args.center_existing) {
                                reset_str += 'remove(' + step.dest_sub_ids[0] + '); ';
                            }

                        } else if (step.args.create_by_radius) {
                            set_str = '';
                            if (
                                !JXG.exists(step.args.center_existing) ||
                                !step.args.center_existing
                            ) {
                                if (JXG.exists(step.args.x) && JXG.exists(step.args.y))
                                    set_str +=
                                        'point(' + pn(step.args.x) + ', ' + pn(step.args.y) + ') ';
                                else
                                    set_str +=
                                        'point(' + pn(step.args.usrCoords[1]) + ', ' + pn(step.args.usrCoords[2]) + ') ';
                                set_str +=
                                    '<<id: \'' +
                                    step.dest_sub_ids[0] +
                                    '\', ' +
                                    withName +
                                    ' snapToGridIntern: ' + JXG.Options.elements.snapToGrid +
                                    ', snapToPointsIntern: ' + JXG.Options.elements.snapToPoints +
                                    ', visible: true, priv: false>>; ';
                                set_str += step.dest_sub_ids[0] + '.setAttribute(<<traceattributes: <<size: function() {' +
                                    ' return ' + step.dest_sub_ids[0] + '.size ' + JXG.Options.sketchometry.traceSizeOperation + '; ' +
                                    '} >> >>); ';
                                set_str += step.dest_sub_ids[0] + '.snapToGrid = function() { ' +
                                    'return sketchoAttribute(\'snapToGridGlobal\') ? sketchoAttribute(\'snapToGridGlobal\') : ' + step.dest_sub_ids[0] + '.snapToGridIntern; ' +
                                    '}; ';
                                set_str += step.dest_sub_ids[0] + '.snapToPoints = function() { ' +
                                    'return sketchoAttribute(\'snapToPointsGlobal\') ? sketchoAttribute(\'snapToPointsGlobal\') : ' + step.dest_sub_ids[0] + '.snapToPointsIntern; ' +
                                    '}; ';
                                if (JXG.exists(step.args.x) && JXG.exists(step.args.y))
                                    set_str += step.dest_sub_ids[0] + '.moveTo([' + pn(step.args.x) + ', ' + pn(step.args.y) + ']); ';
                                else
                                    set_str += step.dest_sub_ids[0] + '.moveTo([' + pn(step.args.usrCoords[1]) + ', ' + pn(step.args.usrCoords[2]) + ']); ';
                            }

                            set_str +=
                                assign +
                                'circle(\'' +
                                (!JXG.exists(step.args.center_existing) || !step.args.center_existing ? step.dest_sub_ids[0] : step.src_ids[0]) +
                                '\', ' +
                                pn(JXG.exists(step.args.r) ? step.args.r : step.args.radius) +
                                ') <<' +
                                attrid;
                            set_str +=
                                ' name: \'\'' +
                                ', creationGesture: \'free\'' +
                                ', creationCenterExisting: ' + (JXG.exists(step.args.center_existing) && step.args.center_existing) +
                                ', fillOpacity: ' + JXG.Options.opacityLevel +
                                ', hasInnerPoints: true' +
                                '>>; ';
                            set_str += step.dest_id + '.hasInnerPoints = function() { ' +
                                'return !(' + step.dest_id + '.fillColor == \'transparent\' || ' + step.dest_id + '.fillColor == \'none\' || ' + step.dest_id + '.fillOpacity == 0); ' +
                                '}; ';
                            set_str += step.dest_id + '.highlightStrokeWidth = function() { ' +
                                'return ' + step.dest_id + '.strokeWidth ' + JXG.Options.sketchometry.highlightStrokeWidthOperation + '; ' +
                                ' };';

                            reset_str = 'remove(' + step.dest_id + '); ';
                            if (!JXG.exists(step.args.center_existing) || !step.args.center_existing) {
                                reset_str += 'remove(' + step.dest_sub_ids[0] + '); ';
                            }

                        } else {
                            if (step.src_ids.length === 2) {
                                set_str =
                                    'midpoint(' + step.src_ids[0] + ', ' + step.src_ids[1] + ')';
                                set_str +=
                                    '<<id: \'' +
                                    step.dest_sub_ids[0] +
                                    '\', ' +
                                    withName +
                                    ' visible: true, priv: false>>; ';
                                set_str += step.dest_sub_ids[0] + '.setAttribute(<<traceattributes: <<size: function() {' +
                                    ' return ' + step.dest_sub_ids[0] + '.size ' + JXG.Options.sketchometry.traceSizeOperation + '; ' +
                                    '} >> >>); ';

                                set_str +=
                                    assign +
                                    'circle(' +
                                    step.dest_sub_ids[0] +
                                    ', ' +
                                    step.src_ids[0] +
                                    ') <<' +
                                    attrid;
                                set_str +=
                                    'name: \'\'' +
                                    ', creationGesture: \'circum-2-points\'' +
                                    ', creationCenterExisting: false' +
                                    ', fillOpacity: ' + JXG.Options.opacityLevel +
                                    ', hasInnerPoints: true' +
                                    '>>; ';
                                set_str += step.dest_id + '.hasInnerPoints = function() { ' +
                                    'return !(' + step.dest_id + '.fillColor == \'transparent\' || ' + step.dest_id + '.fillColor == \'none\' || ' + step.dest_id + '.fillOpacity == 0); ' +
                                    '}; ';
                                set_str += step.dest_id + '.highlightStrokeWidth = function() { ' +
                                    'return ' + step.dest_id + '.strokeWidth ' + JXG.Options.sketchometry.highlightStrokeWidthOperation + '; ' +
                                    ' };';

                                reset_str = 'remove(' + step.dest_id + '); ';
                                if (!JXG.exists(step.args.center_existing) || !step.args.center_existing) {
                                    reset_str += 'remove(' + step.dest_sub_ids[0] + '); ';
                                }
                            } else {
                                set_str =
                                    assign +
                                    'circle(' +
                                    step.src_ids[0] +
                                    ', ' +
                                    step.src_ids[1] +
                                    ', ' +
                                    step.src_ids[2];
                                set_str +=
                                    ') <<center: <<id: \'' + step.dest_sub_ids[0] + '\', ' +
                                    withName +
                                    ' visible: true';
                                set_str += getAttribsString(board.options.sketchometry.circle3pointsCenter);
                                set_str +=
                                    '>>, ' +
                                    attrid +
                                    'name: \'\'' +
                                    ', creationGesture: \'circum-3-points\'' +
                                    ', creationCenterExisting: false' +
                                    ', fillOpacity: ' + JXG.Options.opacityLevel +
                                    ', hasInnerPoints: true' +
                                    '>>; ';
                                set_str += step.dest_id + '.hasInnerPoints = function() { ' +
                                    'return !(' + step.dest_id + '.fillColor == \'transparent\' || ' + step.dest_id + '.fillColor == \'none\' || ' + step.dest_id + '.fillOpacity == 0); ' +
                                    '}; ';
                                set_str += step.dest_id + '.highlightStrokeWidth = function() { ' +
                                    'return ' + step.dest_id + '.strokeWidth ' + JXG.Options.sketchometry.highlightStrokeWidthOperation + '; ' +
                                    ' };';

                                reset_str = 'remove(' + step.dest_id + '); ';
                                if (!JXG.exists(step.args.center_existing) || !step.args.center_existing) {
                                    reset_str += 'remove(' + step.dest_sub_ids[0] + '); ';
                                }
                            }
                        }
                        break;

                    /**
                     * @deprecated
                     * NOT USED ANY MORE SINCE SKETCHOMETRY 2.0 (only for old constructions needed)
                     */
                    case JXG.GENTYPE_CIRCLE2POINTS:
                        if (step.args.create_two_points) {
                            set_str =
                                'point(' + pn(step.args.x1) + ', ' + pn(step.args.y1) + ')' +
                                ' <<id: \'' + step.dest_sub_ids[0] + '\'' +
                                ', snapToGridIntern: ' + JXG.Options.elements.snapToGrid +
                                ', snapToPointsIntern: ' + JXG.Options.elements.snapToPoints +
                                '>>; ';
                            set_str += step.dest_sub_ids[0] + '.setAttribute(<<traceattributes: <<size: function() {' +
                                ' return ' + step.dest_sub_ids[0] + '.size ' + JXG.Options.sketchometry.traceSizeOperation + '; ' +
                                '} >> >>); ';
                            set_str += step.dest_sub_ids[0] + '.snapToGrid = function() { ' +
                                'return sketchoAttribute(\'snapToGridGlobal\') ? sketchoAttribute(\'snapToGridGlobal\') : ' + step.dest_sub_ids[0] + '.snapToGridIntern; ' +
                                '}; ';
                            set_str += step.dest_sub_ids[0] + '.snapToPoints = function() { ' +
                                'return sketchoAttribute(\'snapToPointsGlobal\') ? sketchoAttribute(\'snapToPointsGlobal\') : ' + step.dest_sub_ids[0] + '.snapToPointsIntern; ' +
                                '}; ';
                            set_str += step.dest_sub_ids[0] + '.moveTo([' + pn(step.args.x1) + ', ' + pn(step.args.y1) + ']); ';

                            set_str +=
                                'point(' + pn(step.args.x2) + ', ' + pn(step.args.y2) + ')' +
                                ' <<id: \'' + step.dest_sub_ids[1] + '\'' +
                                ', snapToGridIntern: ' + JXG.Options.elements.snapToGrid +
                                ', snapToPointsIntern: ' + JXG.Options.elements.snapToPoints +
                                '>>; ';
                            set_str += step.dest_sub_ids[1] + '.setAttribute(<<traceattributes: <<size: function() {' +
                                ' return ' + step.dest_sub_ids[1] + '.size ' + JXG.Options.sketchometry.traceSizeOperation + '; ' +
                                '} >> >>); ';
                            set_str += step.dest_sub_ids[1] + '.snapToGrid = function() { ' +
                                'return sketchoAttribute(\'snapToGridGlobal\') ? sketchoAttribute(\'snapToGridGlobal\') : ' + step.dest_sub_ids[1] + '.snapToGridIntern; ' +
                                '}; ';
                            set_str += step.dest_sub_ids[1] + '.snapToPoints = function() { ' +
                                'return sketchoAttribute(\'snapToPointsGlobal\') ? sketchoAttribute(\'snapToPointsGlobal\') : ' + step.dest_sub_ids[1] + '.snapToPointsIntern; ' +
                                '}; ';
                            set_str += step.dest_sub_ids[1] + '.moveTo([' + pn(step.args.x2) + ', ' + pn(step.args.y2) + ']); ';

                            set_str +=
                                assign +
                                'circle(' +
                                step.dest_sub_ids[0] +
                                ', ' +
                                step.dest_sub_ids[1] +
                                ') <<' +
                                attrid;
                            set_str +=
                                'name: \'\', fillOpacity: ' + JXG.Options.opacityLevel +
                                '>>; ';

                            reset_str =
                                'remove(' +
                                step.dest_id +
                                '); remove(' +
                                step.dest_sub_ids[1] +
                                '); remove(';
                            reset_str += step.dest_sub_ids[0] + '); ';
                        } else if (step.args.create_point) {
                            set_str =
                                'point(' + pn(step.args.x) + ', ' + pn(step.args.y) + ')' +
                                ' <<id: \'' + step.dest_sub_ids[0] + '\'' +
                                ', snapToGridIntern: ' + JXG.Options.elements.snapToGrid +
                                ', snapToPointsIntern: ' + JXG.Options.elements.snapToPoints +
                                '>>; ';
                            set_str += step.dest_sub_ids[0] + '.setAttribute(<<traceattributes: <<size: function() {' +
                                ' return ' + step.dest_sub_ids[0] + '.size ' + JXG.Options.sketchometry.traceSizeOperation + '; ' +
                                '} >> >>); ';
                            set_str += step.dest_sub_ids[0] + '.snapToGrid = function() { ' +
                                'return sketchoAttribute(\'snapToGridGlobal\') ? sketchoAttribute(\'snapToGridGlobal\') : ' + step.dest_sub_ids[0] + '.snapToGridIntern; ' +
                                '}; ';
                            set_str += step.dest_sub_ids[0] + '.snapToPoints = function() { ' +
                                'return sketchoAttribute(\'snapToPointsGlobal\') ? sketchoAttribute(\'snapToPointsGlobal\') : ' + step.dest_sub_ids[0] + '.snapToPointsIntern; ' +
                                '}; ';
                            set_str += step.dest_sub_ids[0] + '.moveTo([' + pn(step.args.x) + ', ' + pn(step.args.y) + ']); ';

                            set_str +=
                                assign +
                                'circle(' +
                                step.dest_sub_ids[0] +
                                ', ' +
                                step.src_ids[0] +
                                ') <<' +
                                attrid;
                            set_str +=
                                'name: \'\', fillOpacity: ' + JXG.Options.opacityLevel +
                                '>>; ';

                            reset_str =
                                'remove(' +
                                step.dest_id +
                                '); remove(' +
                                step.dest_sub_ids[0] +
                                '); ';
                        } else if (step.args.create_by_radius) {
                            set_str =
                                assign +
                                'circle(' +
                                step.src_ids[0] +
                                ', ' +
                                step.args.r +
                                ') <<' +
                                attrid;
                            set_str +=
                                'name: \'\', fillOpacity: ' + JXG.Options.opacityLevel +
                                '>>; ';

                            reset_str = 'remove(' + step.dest_id + '); ';
                        } else {
                            set_str =
                                assign +
                                'circle(' +
                                step.src_ids[0] +
                                ', ' +
                                step.src_ids[1] +
                                ') <<' +
                                attrid;
                            set_str +=
                                'name: \'\', fillOpacity: ' + JXG.Options.opacityLevel +
                                '>>; ';

                            reset_str = 'remove(' + step.dest_id + '); ';
                        }

                        break;

                    case JXG.GENTYPE_LINE:
                        k = 0;
                        j = 0;

                        if (step.args.create_point1) {
                            pid1 = step.dest_sub_ids[k];
                            k += 1;
                            str1 = [];
                            for (i = 0; i < step.args.p1.length; i++) {
                                str1[i] = pn(step.args.p1[i]);
                            }

                            set_str =
                                'point(' +
                                str1.join(', ') +
                                ') <<id: \'' +
                                pid1 +
                                '\', name: \'\', visible: false, isinfinit: true, ';
                            set_str += 'snaptogrid: false, snaptopoints: false, priv: true>>; ';
                            reset_str = 'remove(' + pid1 + '); ';
                        } else {
                            pid1 = step.src_ids[j];
                            j += 1;
                        }

                        if (step.args.create_point2) {
                            pid2 = step.dest_sub_ids[k++];
                            str1 = [];
                            for (i = 0; i < step.args.p2.length; i++) {
                                str1[i] = pn(step.args.p2[i]);
                            }

                            set_str +=
                                'point(' +
                                str1.join(', ') +
                                ') <<id: \'' +
                                pid2 +
                                '\', name: \'\', visible: false, isinfinit: true, ';
                            set_str += 'snaptogrid: false, snaptopoints: false, priv: true>>; ';
                            reset_str = 'remove(' + pid2 + '); ' + reset_str;
                        } else {
                            pid2 = step.src_ids[j];
                            j += 1;
                        }

                        str = 'line';
                        str1 = '';

                        // the line's parents
                        str2 = pid1 + ', ' + pid2;

                        // if we want a truly free line
                        if (
                            step.args.create_point1 &&
                            step.args.create_point2 &&
                            options.freeLine
                        ) {
                            // forget the points
                            set_str = '';
                            reset_str = '';

                            // use the stdform instead
                            if (step.args.p1.length === 2) {
                                step.args.p1.unshift(1);
                            }

                            if (step.args.p2.length === 2) {
                                step.args.p2.unshift(1);
                            }

                            str2 = JXG.Math.crossProduct(step.args.p1, step.args.p2);
                            for (i = 0; i < str2.length; i++) {
                                str2[i] = pn(str2[i]);
                            }

                            str2 = str2.join(', ');
                        }

                        if (!step.args.first && !step.args.last) {
                            str = 'segment';
                        } else {
                            if (!step.args.first) {
                                str1 = 'straightFirst: ' + step.args.first;
                            }

                            if (!step.args.last) {
                                str1 = 'straightLast: ' + step.args.last;
                            }

                            if (str1.length > 0 && !options.useSymbols) {
                                str1 += ', ';
                            }
                        }

                        // this is a corner case, we have to get rid of the ',' at the end
                        // simple solution: rebuild attrid
                        if (!options.useSymbols) {
                            attrid = 'id: \'' + step.dest_id + '\'';
                        }

                        set_str += assign + str + '(' + str2 + ')';

                        if (str1.length + attrid.length > 0) {
                            set_str +=
                                ' <<' +
                                str1 +
                                attrid +
                                ', name: \'\'>>; ';
                        } else {
                            set_str +=
                                ' <<name: \'\'>>; ';
                        }
                        set_str += step.dest_id + '.highlightStrokeWidth = function() { ' +
                            'return ' + step.dest_id + '.strokeWidth ' + JXG.Options.sketchometry.highlightStrokeWidthOperation + '; ' +
                            ' };';

                        reset_str = 'remove(' + step.dest_id + '); ' + reset_str;
                        break;

                    case JXG.GENTYPE_VECTOR:
                        k = 0;
                        j = 0;

                        set_str = '';
                        reset_str = '';

                        if (step.args.create_point1) {
                            pid1 = step.dest_sub_ids[k];
                            k++;
                            str = [];
                            for (i = 0; i < step.args.p1.length; i++)
                                str[i] = pn(step.args.p1[i]);

                            set_str +=
                                'point(' + str.join(', ') + ') <<id: \'' + pid1 + '\', name: \'\'' +
                                ', visible: true' +
                                ', snapToGridIntern: ' + JXG.Options.elements.snapToGrid +
                                ', snapToPointsIntern: ' + JXG.Options.elements.snapToPoints +
                                getAttribsString(board.options.sketchometry.vectorBasepoint) +
                                ', priv: false>>; ';
                            set_str += pid1 + '.isPartOfVector = true;';
                            set_str += pid1 + '.setAttribute(<<traceattributes: <<size: function() {' +
                                ' return ' + pid1 + '.size ' + JXG.Options.sketchometry.traceSizeOperation + '; ' +
                                '} >> >>); ';
                            set_str += pid1 + '.snapToGrid = function() { ' +
                                'return sketchoAttribute(\'snapToGridGlobal\') ? sketchoAttribute(\'snapToGridGlobal\') : ' + pid1 + '.snapToGridIntern; ' +
                                '}; ';
                            set_str += pid1 + '.snapToPoints = function() { ' +
                                'return sketchoAttribute(\'snapToPointsGlobal\') ? sketchoAttribute(\'snapToPointsGlobal\') : ' + pid1 + '.snapToPointsIntern; ' +
                                '}; ';
                            set_str += pid1 + '.moveTo([' + str.join(', ') + ']); ';

                            reset_str += 'remove(' + pid1 + '); ';
                        } else {
                            pid1 = step.src_ids[j];
                            j += 1;
                        }

                        if (step.args.create_point2) {
                            pid2 = step.dest_sub_ids[k];
                            k++;
                            str = [];
                            for (i = 0; i < step.args.p2.length; i++)
                                str[i] = pn(step.args.p2[i]);

                            set_str +=
                                'point(' + str.join(', ') + ') <<id: \'' + pid2 + '\', name: \'\'' +
                                ', visible: true' +
                                ', snapToGridIntern: ' + JXG.Options.elements.snapToGrid +
                                ', snapToPointsIntern: ' + JXG.Options.elements.snapToPoints +
                                getAttribsString(board.options.sketchometry.vectorLacepoint) +
                                ', priv: false>>; ';
                            set_str += pid2 + '.isPartOfVector = true;';
                            set_str += pid2 + '.setAttribute(<<traceattributes: <<size: function() {' +
                                ' return ' + pid2 + '.size ' + JXG.Options.sketchometry.traceSizeOperation + '; ' +
                                '} >> >>); ';
                            set_str += pid2 + '.snapToGrid = function() { ' +
                                'return sketchoAttribute(\'snapToGridGlobal\') ? sketchoAttribute(\'snapToGridGlobal\') : ' + pid1 + '.snapToGridIntern; ' +
                                '}; ';
                            set_str += pid2 + '.snapToPoints = function() { ' +
                                'return sketchoAttribute(\'snapToPointsGlobal\') ? sketchoAttribute(\'snapToPointsGlobal\') : ' + pid1 + '.snapToPointsIntern; ' +
                                '}; ';
                            set_str += pid2 + '.moveTo([' + str.join(', ') + ']); ';

                            reset_str += 'remove(' + pid2 + '); ';
                        } else {
                            pid2 = step.src_ids[j];
                            j += 1;
                        }

                        // this is a corner case, we have to get rid of the ',' at the end
                        // simple solution: rebuild attrid
                        if (!options.useSymbols) attrid = 'id: \'' + step.dest_id + '\'';
                        set_str += assign + 'arrow(' + pid1 + ', ' + pid2 + ') <<';
                        if (attrid.length > 0)
                            set_str += attrid + ', ';
                        set_str += 'name: \'\' ' +
                            '>>; ';
                        set_str += step.dest_id + '.highlightStrokeWidth = function() { ' +
                            'return ' + step.dest_id + '.strokeWidth ' + JXG.Options.sketchometry.highlightStrokeWidthOperation + '; ' +
                            ' };';

                        reset_str = 'remove(' + step.dest_id + '); ' + reset_str;

                        break;

                    case JXG.GENTYPE_TRIANGLE:
                        for (i = 0; i < step.args.create_point.length; i++) {
                            if (step.args.create_point[i]) {
                                set_str +=
                                    'point(' + pn(step.args.coords[i].usrCoords[1]) + ', ' + pn(step.args.coords[i].usrCoords[2]) + ')' +
                                    ' <<id: \'' + step.dest_sub_ids[i] + '\'' +
                                    ', snapToGridIntern: ' + JXG.Options.elements.snapToGrid +
                                    ', snapToPointsIntern: ' + JXG.Options.elements.snapToPoints +
                                    '>>; ';
                                set_str += step.dest_sub_ids[i] + '.setAttribute(<<traceattributes: <<size: function() {' +
                                    ' return ' + step.dest_sub_ids[i] + '.size ' + JXG.Options.sketchometry.traceSizeOperation + '; ' +
                                    '} >> >>); ';
                                set_str += step.dest_sub_ids[i] + '.snapToGrid = function() { ' +
                                    'return sketchoAttribute(\'snapToGridGlobal\') ? sketchoAttribute(\'snapToGridGlobal\') : ' + step.dest_sub_ids[i] + '.snapToGridIntern; ' +
                                    '}; ';
                                set_str += step.dest_sub_ids[i] + '.snapToPoints = function() { ' +
                                    'return sketchoAttribute(\'snapToPointsGlobal\') ? sketchoAttribute(\'snapToPointsGlobal\') : ' + step.dest_sub_ids[i] + '.snapToPointsIntern; ' +
                                    '}; ';
                                set_str += step.dest_sub_ids[i] + '.moveTo([' + pn(step.args.coords[i].usrCoords[1]) + ', ' + pn(step.args.coords[i].usrCoords[2]) + ']); ';
                            }
                        }

                        for (i = 0; i < step.dest_sub_ids.length; i++) {
                            if (step.dest_sub_ids[i] !== 0) {
                                reset_str =
                                    'remove(' + step.dest_sub_ids[i] + '); ' + reset_str;
                            }
                        }

                        reset_str = 'remove(' + step.dest_id + '); ' + reset_str;

                        set_str += assign + 'polygon(';

                        if (step.src_ids.length === 3) {
                            for (i = 0; i < step.src_ids.length; i++) {
                                set_str += step.src_ids[i];
                                if (i < step.src_ids.length - 1) {
                                    set_str += ', ';
                                }
                            }
                        } else {
                            for (i = 0; i < 3; i++) {
                                if (step.dest_sub_ids[i] !== 0) {
                                    if (step.src_ids.length > 0 || i > 0) {
                                        set_str += ', ';
                                    }
                                    set_str += step.dest_sub_ids[i];
                                }
                            }
                        }

                        set_str +=
                            ') <<borders: <<ids: [\'' +
                            step.dest_sub_ids[3] + '\', \'' +
                            step.dest_sub_ids[4] + '\', \'' +
                            step.dest_sub_ids[5] +
                            '\']';
                        set_str += ', names: [\'\', \'\', \'\']';
                        set_str += '>>, ' + attrid + ' fillOpacity: ';
                        set_str += JXG.Options.opacityLevel + ', name: \'\' ';
                        set_str += ', hasInnerPoints: ' + JXG.Options.polygon.hasInnerPoints +
                            '>>; ';
                        for (i = 3; i < 6; i++) {
                            set_str += step.dest_sub_ids[i] + '.highlightStrokeWidth = function() { ' +
                                'return ' + step.dest_sub_ids[i] + '.strokeWidth ' + JXG.Options.sketchometry.highlightStrokeWidthOperation + '; ' +
                                ' };';
                        }
                        set_str += step.dest_id + '.hasInnerPoints = function() { ' +
                            'return !(' + step.dest_id + '.fillColor == \'transparent\' || ' + step.dest_id + '.fillColor == \'none\' || ' + step.dest_id + '.fillOpacity == 0); ' +
                            '}; ';
                        break;

                    case JXG.GENTYPE_QUADRILATERAL:
                        for (i = 0; i < step.args.create_point.length; i++) {
                            if (step.args.create_point[i]) {
                                set_str +=
                                    'point(' + pn(step.args.coords[i].usrCoords[1]) + ', ' + pn(step.args.coords[i].usrCoords[2]) + ')' +
                                    ' <<id: \'' + step.dest_sub_ids[i] + '\'' +
                                    ', snapToGridIntern: ' + JXG.Options.elements.snapToGrid +
                                    ', snapToPointsIntern: ' + JXG.Options.elements.snapToPoints +
                                    '>>; ';
                                set_str += step.dest_sub_ids[i] + '.setAttribute(<<traceattributes: <<size: function() {' +
                                    ' return ' + step.dest_sub_ids[i] + '.size ' + JXG.Options.sketchometry.traceSizeOperation + '; ' +
                                    '} >> >>); ';
                                set_str += step.dest_sub_ids[i] + '.snapToGrid = function() { ' +
                                    'return sketchoAttribute(\'snapToGridGlobal\') ? sketchoAttribute(\'snapToGridGlobal\') : ' + step.dest_sub_ids[i] + '.snapToGridIntern; ' +
                                    '}; ';
                                set_str += step.dest_sub_ids[i] + '.snapToPoints = function() { ' +
                                    'return sketchoAttribute(\'snapToPointsGlobal\') ? sketchoAttribute(\'snapToPointsGlobal\') : ' + step.dest_sub_ids[i] + '.snapToPointsIntern; ' +
                                    '}; ';
                                set_str += step.dest_sub_ids[i] + '.moveTo([' + pn(step.args.coords[i].usrCoords[1]) + ', ' + pn(step.args.coords[i].usrCoords[2]) + ']); ';
                            }
                        }

                        for (i = 0; i < step.dest_sub_ids.length; i++) {
                            if (step.dest_sub_ids[i] !== 0) {
                                reset_str =
                                    'remove(' + step.dest_sub_ids[i] + '); ' + reset_str;
                            }
                        }

                        reset_str = 'remove(' + step.dest_id + '); ' + reset_str;

                        set_str += assign + 'polygon(';

                        for (i = 0; i < step.src_ids.length; i++) {
                            set_str += step.src_ids[i];
                            if (i < step.src_ids.length - 1) {
                                set_str += ', ';
                            }
                        }

                        set_str +=
                            ') <<borders: <<ids: [ \'' +
                            step.dest_sub_ids[4] + '\', \'' +
                            step.dest_sub_ids[5] + '\', \'' +
                            step.dest_sub_ids[6] + '\', \'' +
                            step.dest_sub_ids[7] +
                            '\' ]';
                        set_str += ', names: [\'\', \'\', \'\', \'\']';
                        set_str += '>>, ' + attrid;
                        set_str += ' fillOpacity: ' + JXG.Options.opacityLevel + ', name: \'\'';
                        set_str += ', hasInnerPoints: ' + JXG.Options.polygon.hasInnerPoints +
                            '>>; ';
                        set_str += step.dest_id + '.hasInnerPoints = function() { ' +
                            'return !(' + step.dest_id + '.fillColor == \'transparent\' || ' + step.dest_id + '.fillColor == \'none\' || ' + step.dest_id + '.fillOpacity == 0); ' +
                            '}; ';
                        for (i = 4; i < 8; i++) {
                            set_str += step.dest_sub_ids[i] + '.highlightStrokeWidth = function() { ' +
                                'return ' + step.dest_sub_ids[i] + '.strokeWidth ' + JXG.Options.sketchometry.highlightStrokeWidthOperation + '; ' +
                                ' };';
                        }
                        break;

                    case JXG.GENTYPE_TEXT:
                        if (
                            step.args.str.slice(0, 1) !== "'" &&
                            step.args.str.slice(0, 1) !== '"' &&
                            step.args.str.slice(0, 8) !== "function"
                        ) {
                            step.args.str = '\'' + step.args.str + '\'';
                        }

                        set_str =
                            assign +
                            'text(' +
                            pn(step.args.x) +
                            ', ' +
                            pn(step.args.y) +
                            ', ' +
                            step.args.str +
                            ') <<';
                        set_str += attrid + 'name: \'\'';
                        if (typeof step.args.anchor != 'undefined') {
                            set_str += ', anchor: ' + step.args.anchor;
                        }
                        set_str += '>>; ';
                        // set_str += step.dest_id + '.setText(' + step.args.str + '); ';
                        reset_str = 'remove(' + step.dest_id + '); ';
                        break;

                    case JXG.GENTYPE_RULER:
                        set_str =
                            assign +
                            'tapemeasure([ ' +
                            step.args.p1 +
                            ' ], [ ' +
                            step.args.p2 +
                            ' ]) <<';
                        set_str +=
                            attrid +
                            'name: \'\'' +
                            ', precision: ' + JXG.Options.trunclen +
                            ', point1: <<id: \'' + step.dest_sub_ids[0] + '\'' +
                            ', snapToGrid: false' +
                            '>>, ' +
                            'point2: <<id: \'' + step.dest_sub_ids[1] + '\'' +
                            ', snapToGrid: false' +
                            '>> >>; ';
                        reset_str = 'remove(' + step.dest_id + '); ';
                        break;

                    case JXG.GENTYPE_PARALLELPOINT:
                        set_str =
                            assign +
                            'parallelpoint( ' + step.src_ids.join(', ') + ') <<' +
                            attrid + 'name: \'\'' +
                            ' >>; ';
                        set_str += step.dest_id + '.setAttribute(<<traceattributes: <<size: function() {' +
                            ' return ' + step.dest_id + '.size ' + JXG.Options.sketchometry.traceSizeOperation + '; ' +
                            '} >> >>); ';
                        reset_str = 'remove(' + step.dest_id + '); ';
                        break;

                    case JXG.GENTYPE_PARALLELOGRAM:
                        pid1 = step.dest_sub_ids[0]; // id for parallelpoint

                        set_str =
                            assign +
                            'parallelpoint( ' + step.src_ids.join(', ') + ') <<' +
                            'id: \'' + pid1 + '\', name: \'\'' +
                            ' >>; ';
                        set_str += pid1 + '.setAttribute(<<traceattributes: <<size: function() {' +
                            ' return ' + pid1 + '.size ' + JXG.Options.sketchometry.traceSizeOperation + '; ' +
                            '} >> >>); ';
                        reset_str = 'remove(' + pid1 + '); ';

                        set_str += assign + 'polygon(' + step.src_ids[0] + ', ' + step.src_ids[1] + ', ' + pid1 + ', ' + step.src_ids[2] + ') << ' +
                            attrid + 'name: \'\'' +
                            ', borders: <<ids: [ \'' +
                            step.dest_sub_ids[1] + '\', \'' +
                            step.dest_sub_ids[2] + '\', \'' +
                            step.dest_sub_ids[3] + '\', \'' +
                            step.dest_sub_ids[4] +
                            '\' ]' +
                            ', names: [\'\', \'\', \'\', \'\']' +
                            '>>' +
                            ', fillOpacity: ' + JXG.Options.opacityLevel +
                            ', hasInnerPoints: ' + JXG.Options.polygon.hasInnerPoints +
                            '>>; ';
                        set_str += step.dest_id + '.setAttribute(<<' + getAttribsString(JXG.Options.sketchometry.parallelogram).substring(2) + '>>);';
                        set_str += step.dest_id + '.hasInnerPoints = function() { ' +
                            'return !(' + step.dest_id + '.fillColor == \'transparent\' || ' + step.dest_id + '.fillColor == \'none\' || ' + step.dest_id + '.fillOpacity == 0); ' +
                            '}; ';
                        for (i = 1; i <= 4; i++) {
                            set_str += step.dest_sub_ids[i] + '.highlightStrokeWidth = function() { ' +
                                'return ' + step.dest_sub_ids[i] + '.strokeWidth ' + JXG.Options.sketchometry.highlightStrokeWidthOperation + '; ' +
                                ' };';
                        }
                        break;

                    case JXG.GENTYPE_POLYGON:
                        if (step.args.create_point) {
                            for (i = 0; i < step.args.create_point.length; i++) {
                                if (step.args.create_point[i]) {
                                    set_str +=
                                        'point(' + pn(step.args.coords[i].usrCoords[1]) + ', ' + pn(step.args.coords[i].usrCoords[2]) + ') <<' +
                                        'id: \'' + step.dest_sub_ids[i] + '\'' +
                                        ', snapToGridIntern: ' + JXG.Options.elements.snapToGrid +
                                        ', snapToPointsIntern: ' + JXG.Options.elements.snapToPoints +
                                        '>>; ';
                                    set_str += step.dest_sub_ids[i] + '.setAttribute(<<traceattributes: <<size: function() {' +
                                        ' return ' + step.dest_sub_ids[i] + '.size ' + JXG.Options.sketchometry.traceSizeOperation + '; ' +
                                        '} >> >>); ';
                                    set_str += step.dest_sub_ids[i] + '.snapToGrid = function() { ' +
                                        'return sketchoAttribute(\'snapToGridGlobal\') ? sketchoAttribute(\'snapToGridGlobal\') : ' + step.dest_sub_ids[i] + '.snapToGridIntern; ' +
                                        '}; ';
                                    set_str += step.dest_sub_ids[i] + '.snapToPoints = function() { ' +
                                        'return sketchoAttribute(\'snapToPointsGlobal\') ? sketchoAttribute(\'snapToPointsGlobal\') : ' + step.dest_sub_ids[i] + '.snapToPointsIntern; ' +
                                        '}; ';
                                    set_str += step.dest_sub_ids[i] + '.moveTo([' + pn(step.args.coords[i].usrCoords[1]) + ', ' + pn(step.args.coords[i].usrCoords[2]) + ']); ';
                                }
                            }
                        }

                        if (step.dest_sub_ids)
                            for (i = 0; i < step.dest_sub_ids.length; i++) {
                                if (step.dest_sub_ids[i] !== 0) {
                                    reset_str =
                                        'remove(' + step.dest_sub_ids[i] + '); ' + reset_str;
                                }
                            }

                        reset_str = 'remove(' + step.dest_id + '); ' + reset_str;

                        set_str += assign + 'polygon(';

                        for (i = 0; i < step.src_ids.length; i++) {
                            set_str += step.src_ids[i];
                            if (i !== step.src_ids.length - 1) {
                                set_str += ', ';
                            }
                        }

                        set_str += ') <<borders: <<ids: [';
                        if (JXG.exists(step.args.coords)) {
                            set_str += '\'';
                            for (i = step.args.coords.length; i < step.dest_sub_ids.length; i++) {
                                set_str += step.dest_sub_ids[i];
                                if (i < step.dest_sub_ids.length - 1) {
                                    set_str += '\', \'';
                                }
                            }
                            set_str += '\']';

                            set_str += ', names: [';
                            for (i = step.args.coords.length; i < step.dest_sub_ids.length; i++) {
                                set_str += '\'\'';
                                if (i < step.dest_sub_ids.length - 1) {
                                    set_str += ', ';
                                }
                            }
                        }
                        set_str += ']';
                        set_str +=
                            '>>, ' + attrid + ' fillOpacity: ' + JXG.Options.opacityLevel;
                        set_str += ', hasInnerPoints: ' + JXG.Options.polygon.hasInnerPoints;
                        set_str += ', name: \'\'>>; ';
                        set_str += step.dest_id + '.hasInnerPoints = function() { ' +
                            'return !(' + step.dest_id + '.fillColor == \'transparent\' || ' + step.dest_id + '.fillColor == \'none\' || ' + step.dest_id + '.fillOpacity == 0); ' +
                            '}; ';
                        if (JXG.exists(step.args.coords)) {
                            for (i = step.args.coords.length; i < step.dest_sub_ids.length; i++) {
                                set_str += step.dest_sub_ids[i] + '.highlightStrokeWidth = function() { ' +
                                    'return ' + step.dest_sub_ids[i] + '.strokeWidth ' + JXG.Options.sketchometry.highlightStrokeWidthOperation + '; ' +
                                    ' };';
                            }
                        }
                        reset_str = 'remove(' + step.dest_id + '); ';
                        break;

                    case JXG.GENTYPE_POLYGONCOPY:
                        le = step.args.num_vertices;

                        set_str = '';
                        reset_str = '';

                        for (i = 0; i < le; ++i) {
                            set_str +=
                                assign +
                                'point(' + pn(step.args.points[i][1]) + ', ' + pn(step.args.points[i][2]) + ')';
                            set_str +=
                                (options.useSymbols
                                    ? ''
                                    : ' <<id: \'' + step.dest_sub_ids[i] + '\'' +
                                    ', snapToGridIntern: ' + JXG.Options.elements.snapToGrid +
                                    ', snapToPointsIntern: ' + JXG.Options.elements.snapToPoints +
                                    '>>') +
                                '; ';
                            set_str += step.dest_sub_ids[i] + '.setAttribute(<<traceattributes: <<size: function() {' +
                                ' return ' + step.dest_sub_ids[i] + '.size ' + JXG.Options.sketchometry.traceSizeOperation + '; ' +
                                '} >> >>); ';
                            set_str += step.dest_sub_ids[i] + '.snapToGrid = function() { ' +
                                'return sketchoAttribute(\'snapToGridGlobal\') ? sketchoAttribute(\'snapToGridGlobal\') : ' + step.dest_sub_ids[i] + '.snapToGridIntern; ' +
                                '}; ';
                            set_str += step.dest_sub_ids[i] + '.snapToPoints = function() { ' +
                                'return sketchoAttribute(\'snapToPointsGlobal\') ? sketchoAttribute(\'snapToPointsGlobal\') : ' + step.dest_sub_ids[i] + '.snapToPointsIntern; ' +
                                '}; ';
                            set_str += step.dest_sub_ids[i] + '.moveTo([' + pn(step.args.points[i][1]) + ', ' + pn(step.args.points[i][2]) + ']); ';

                            reset_str += 'remove(' + step.dest_sub_ids[i] + '); ';
                        }

                        set_str += assign + 'polygon(';

                        for (i = 0; i < le; ++i) {
                            set_str += step.dest_sub_ids[i];
                            if (i !== le - 1) {
                                set_str += ', ';
                            }
                        }

                        set_str += ') <<borders: <<ids: [\'';

                        for (i = le; i < step.dest_sub_ids.length; i++) {
                            set_str += step.dest_sub_ids[i];
                            if (i < step.dest_sub_ids.length - 1) {
                                set_str += '\', \'';
                            }
                        }
                        set_str += '\']';

                        set_str += ', names: [';
                        for (i = le; i < step.dest_sub_ids.length; i++) {
                            set_str += '\'\'';
                            if (i < step.dest_sub_ids.length - 1) {
                                set_str += ', ';
                            }
                        }
                        set_str += ']';
                        set_str +=
                            '>>, ' + attrid + ' fillOpacity: ' + JXG.Options.opacityLevel;
                        set_str += ', hasInnerPoints: ' + JXG.Options.polygon.hasInnerPoints;
                        set_str += ', name: \'\'>>; ';
                        set_str += step.dest_id + '.hasInnerPoints = function() { ' +
                            'return !(' + step.dest_id + '.fillColor == \'transparent\' || ' + step.dest_id + '.fillColor == \'none\' || ' + step.dest_id + '.fillOpacity == 0); ' +
                            '}; ';
                        for (i = le; i < step.dest_sub_ids.length; i++) {
                            set_str += step.dest_sub_ids[i] + '.highlightStrokeWidth = function() { ' +
                                'return ' + step.dest_sub_ids[i] + '.strokeWidth ' + JXG.Options.sketchometry.highlightStrokeWidthOperation + '; ' +
                                ' };';
                        }
                        reset_str += 'remove(' + step.dest_id + '); ';
                        break;

                    case JXG.GENTYPE_REGULARPOLYGON:
                        set_str = assign + 'regularpolygon(' + step.src_ids.join(', ') + ', ';
                        set_str += step.args.corners + ') <<borders: <<ids: [ ';

                        for (i = 0; i < step.args.corners; i++) {
                            set_str += '\'' + step.dest_sub_ids[i] + '\'';
                            if (i !== step.args.corners - 1) {
                                set_str += ', ';
                            }
                            reset_str = 'remove(' + step.dest_sub_ids[i] + '); ' + reset_str;
                        }
                        set_str += ']';

                        set_str += ', names: [';
                        for (i = 0; i < step.args.corners; i++) {
                            set_str += '\'\'';
                            if (i < step.args.corners - 1) {
                                set_str += ', ';
                            }
                        }
                        set_str += ']';

                        set_str += '>>, vertices: <<ids: [ ';
                        for (i = 0; i < step.args.corners - 2; i++) {
                            set_str +=
                                '\'' +
                                step.dest_sub_ids[i + parseInt(step.args.corners, 10)] +
                                '\'';
                            if (i !== step.args.corners - 3) {
                                set_str += ', ';
                            }
                            reset_str =
                                'remove(' +
                                step.dest_sub_ids[i + parseInt(step.args.corners, 10)] +
                                '); ' +
                                reset_str;
                        }
                        set_str += ' ]';
                        set_str += ', name: \'\', isPartOfRegpol: true';
                        set_str += '>>, ' + attrid;
                        set_str += ' fillOpacity: ' + JXG.Options.opacityLevel;
                        set_str += ', hasInnerPoints: ' + JXG.Options.polygon.hasInnerPoints;
                        set_str += ', name: \'\'>>; ';
                        set_str += step.dest_id + '.hasInnerPoints = function() { ' +
                            'return !(' + step.dest_id + '.fillColor == \'transparent\' || ' + step.dest_id + '.fillColor == \'none\' || ' + step.dest_id + '.fillOpacity == 0); ' +
                            '}; ';
                        for (i = 0; i < step.args.corners; i++) {
                            set_str += step.dest_sub_ids[i] + '.highlightStrokeWidth = function() { ' +
                                'return ' + step.dest_sub_ids[i] + '.strokeWidth ' + JXG.Options.sketchometry.highlightStrokeWidthOperation + '; ' +
                                ' };';
                        }
                        reset_str = 'remove(' + step.dest_id + '); ' + reset_str;

                        break;

                    case JXG.GENTYPE_SECTOR:
                        set_str = assign;

                        // ids
                        pid1 = step.dest_id;                  // id of sector
                        pid2 = step.dest_sub_ids[0];          // id of arc
                        if (JXG.exists(step.dest_sub_ids[1])) // id of glider
                            pid3 = step.dest_sub_ids[1];
                        else
                            pid3 = pid1 + '_glider';
                        if (JXG.exists(step.dest_sub_ids[2])) // id of segment 1 (mid - radiuspoint)
                            pid4 = step.dest_sub_ids[2];
                        else
                            pid4 = pid1 + '_segment1';
                        if (JXG.exists(step.dest_sub_ids[3])) // id of segment 2 (mid - glider)
                            pid5 = step.dest_sub_ids[3];
                        else
                            pid5 = pid1 + '_segment2';

                        // sector
                        set_str += 'sector(' + step.src_ids.join(', ') + ') ';
                        set_str += '<<' + attrid + ' name: \'\', fillOpacity: ' + JXG.Options.opacityLevel + ', hasInnerPoints: true, arc: <<id: \'' + pid2 + '\'>>, ';
                        set_str += 'idArc: \'' + pid2 + '\', idGlider: \'' + pid3 + '\', idSegment1: \'' + pid4 + '\', idSegment2: \'' + pid5 + '\'';
                        set_str += '>>; ';
                        set_str += pid1 + '.hasInnerPoints = function() { ' +
                            'return !(' + pid1 + '.fillColor == \'transparent\' || ' + pid1 + '.fillColor == \'none\' || ' + pid1 + '.fillOpacity == 0); ' +
                            '}; ';
                        set_str += pid1 + '.arc.name = \'\'; ';

                        // glider
                        set_str += 'glider(function () { return ' + step.src_ids[2] + '.X(); }, function () { return ' + step.src_ids[2] + '.Y(); }, ' + pid2 + ') ';
                        set_str += '<<id: \'' + pid3 + '\', name:\'\', parents: [\'' + pid1 + '\', \'' + pid2 + '\', \'' + step.src_ids[2] + '\'], isPartOfSector:true' +
                            getAttribsString(board.options.sketchometry.sectorCorner) +
                            '>>; ';

                        // segment 1 (mid - radiuspoint)
                        set_str += 'segment(' + step.src_ids[0] + ', ' + step.src_ids[1] + ') ';
                        set_str += '<<id: \'' + pid4 + '\', name:\'\', fixed:true, parents: [\'' + pid1 + '\', \'' + step.src_ids[0] + '\', \'' + step.src_ids[1] + '\'], isPartOfSector:true>>; ';

                        // segment 2 (mid - glider)
                        set_str += 'segment(' + step.src_ids[0] + ', ' + pid3 + ') ';
                        set_str += '<<id: \'' + pid5 + '\', name:\'\', fixed:true, parents: [\'' + pid1 + '\', \'' + step.src_ids[0] + '\', \'' + pid3 + '\'], isPartOfSector:true>>; ';

                        reset_str = '';
                        reset_str += 'remove(' + pid3 + '); ';
                        reset_str += 'remove(' + pid4 + '); ';
                        reset_str += 'remove(' + pid5 + '); ';
                        reset_str += 'remove(' + pid1 + '); ';
                        break;

                    case JXG.GENTYPE_ANGLE:
                        set_str = assign + 'angle(' + step.src_ids.join(', ') + ') ';
                        set_str += '<<';
                        set_str +=
                            'dot: <<priv:true, id: \'' +
                            step.dest_sub_ids[0] +
                            '\', name: \'\'>>, ';
                        set_str += attrid + ' fillOpacity: ' + JXG.Options.opacityLevel;
                        if (JXG.exists(step.args) && JXG.exists(step.args.radius))
                            if (JXG.isNumber(step.args.radius)) {
                                set_str += ', radius: ' + step.args.radius;
                            } else {
                                set_str += ', radius: \'' + step.args.radius + '\'';
                            }
                        set_str += ', hasInnerPoints: true>>; ';
                        reset_str = 'remove(' + step.dest_id + '); ';
                        reset_str += 'remove(' + step.dest_sub_ids[0] + '); ';
                        break;

                    case JXG.GENTYPE_NONREFLEXANGLE:
                        set_str = assign + 'nonreflexangle(' + step.src_ids.join(', ') + ') ';
                        set_str += '<<';
                        set_str += 'dot: <<priv:true, id: \'' + step.dest_sub_ids[0] + '\', ';
                        set_str += 'name: \'\'>>, ';
                        set_str += attrid + ' fillOpacity: ' + JXG.Options.opacityLevel;
                        if (JXG.exists(step.args) && JXG.exists(step.args.radius))
                            if (JXG.isNumber(step.args.radius)) {
                                set_str += ', radius: ' + step.args.radius;
                            } else {
                                set_str += ', radius: \'' + step.args.radius + '\'';
                            }
                        set_str += '>>; ';
                        reset_str = 'remove(' + step.dest_id + '); ';
                        reset_str += 'remove(' + step.dest_sub_ids[0] + '); ';
                        break;

                    case JXG.GENTYPE_REFLEXANGLE:
                        set_str = assign + 'reflexangle(' + step.src_ids.join(', ') + ') ';
                        set_str += '<<';
                        set_str += 'dot: <<priv:true, id: \'' + step.dest_sub_ids[0] + '\', ';
                        set_str += 'name: \'\'>>, ';
                        set_str += attrid + ' fillOpacity: ' + JXG.Options.opacityLevel;
                        if (JXG.exists(step.args) && JXG.exists(step.args.radius))
                            if (JXG.isNumber(step.args.radius)) {
                                set_str += ', radius: ' + step.args.radius;
                            } else {
                                set_str += ', radius: \'' + step.args.radius + '\'';
                            }
                        set_str += '>>; ';
                        reset_str = 'remove(' + step.dest_id + '); ';
                        reset_str += 'remove(' + step.dest_sub_ids[0] + '); ';
                        break;

                    case JXG.GENTYPE_SLOPETRIANGLE:
                        // step.src_ids[0] may contain one or two parent elements.
                        set_str = assign + 'slopetriangle(' + step.src_ids.join(', ') + ') <<';
                        set_str += attrid + ' name: \'\',';
                        set_str +=
                            'borders: <<ids: [\'' +
                            step.dest_sub_ids[4] +
                            '\', \'' +
                            step.dest_sub_ids[5] +
                            '\', \'' +
                            step.dest_sub_ids[6] +
                            '\']>>,';
                        set_str +=
                            'basepoint: <<id: \'' +
                            step.dest_sub_ids[0] +
                            '\', name: \'\', priv: true, isPartOfSlopetriangle:true >>, ';
                        set_str +=
                            'baseline: <<id: \'' +
                            step.dest_sub_ids[1] +
                            '\', name: \'\', priv: true, isPartOfSlopetriangle:true >>,';
                        set_str +=
                            'glider: <<id: \'' +
                            step.dest_sub_ids[2] +
                            '\', name: \'\', priv: false, isPartOfSlopetriangle:true >>, ';
                        set_str +=
                            'toppoint: <<id: \'' +
                            step.dest_sub_ids[3] +
                            '\', name: \'\', priv: false, isPartOfSlopetriangle:true >>';
                        if (step.dest_sub_ids.length === 8) {
                            // The test is needed for backwards compatibility
                            set_str +=
                                ', tangent: <<id: \'' +
                                step.dest_sub_ids[7] +
                                '\', priv: true, point1: <<name: \'\', priv: true >>, point2: <<name: \'\', priv: true >> >>';
                        }
                        set_str += '>>;';
                        /* for (i = 4; i <= 6; i++) {
                         set_str += step.dest_sub_ids[i] + '.highlightStrokeWidth = function() { ' +
                         'return ' + step.dest_sub_ids[i] + '.strokeWidth ' + JXG.Options.sketchometry.highlightStrokeWidthOperation + '; ' +
                         ' };'
                         } */
                        reset_str = 'remove(' + step.dest_id + '); ';

                        break;

                    case JXG.GENTYPE_PLOT:
                        set_str = assign + step.args.plot_type + '(' + step.args.func;

                        if (
                            isNaN(step.args.a) ||
                            step.args.a === null ||
                            step.args.a === undefined ||
                            step.args.a === '-infinity'
                        )
                            step.args.a = '';
                        if (
                            isNaN(step.args.b) ||
                            step.args.b === null ||
                            step.args.b === undefined ||
                            step.args.b === 'infinity'
                        )
                            step.args.b = '';

                        if (step.args.a != step.args.b)
                            set_str += ', ' + step.args.a + ', ' + step.args.b;

                        set_str += ') <<';

                        if (step.args.isPolar) set_str += 'curveType: \'polar\', ';

                        set_str +=
                            attrid +
                            'name: \'\', withLabel: true, strokeColor: \'' +
                            step.args.color +
                            '\', doAdvancedPlot: true, doAdvancedPlotOld: false >>; ';
                        reset_str = 'remove(' + step.dest_id + '); ';

                        break;

                    case JXG.GENTYPE_PATH:
                        le = step.args.points.length;

                        set_str += assign + 'cardinalspline([';
                        for (i = 0; i < step.args.points.length; i++) {
                            if (JXG.isString(step.args.points[i])) {
                                set_str += '\'' + step.args.points[i] + '\'';
                            } else {
                                if (step.args.points[i].length === 3) {
                                    x = step.args.points[i][1].toPrecision(4);
                                    y = step.args.points[i][2].toPrecision(4);
                                } else {
                                    x = step.args.points[i][0].toPrecision(4);
                                    y = step.args.points[i][1].toPrecision(4);
                                }
                                set_str += '[' + x + ',' + y + ']';
                            }
                            if (i < le - 1) {
                                set_str += ',';
                            }
                        }
                        set_str += '], function() { ' +
                            '   o = $(\'' + step.dest_id + '\'); ' +
                            '   if(o) {' +
                            '      return o.tau; ' +
                            '   } else {' +
                            '      return 1; ' +
                            '   }' +
                            '}, ' + step.args.type;
                        set_str += ') <<';

                        set_str += attrid + 'name: \'\', withLabel: false, tau: ' + step.args.tau + ', ';
                        set_str += 'fixed: false, ';
                        if (!step.args.createPoints) {
                            set_str += 'createPoints: false, ';
                        }
                        set_str += 'isArrayOfCoordinates: true >>; ';
                        set_str += step.dest_id + '.highlightStrokeWidth = function() { ' +
                            'return ' + step.dest_id + '.strokeWidth ' + JXG.Options.sketchometry.highlightStrokeWidthOperation + '; ' +
                            ' };';
                        reset_str = 'remove(' + step.dest_id + '); ';

                        break;

                    case JXG.GENTYPE_DERIVATIVE:
                        set_str = assign + 'derivative(' + step.src_ids + ')';
                        set_str += ' <<';
                        set_str += 'dash: 2';
                        set_str += ' >>;';
                        break;

                    case JXG.GENTYPE_SLIDER:
                        set_str = '';
                        if (options.useSliderVars) {
                            set_str += options.sliderVarPrefix + step.dest_id + ' = ';
                        }
                        set_str +=
                            assign +
                            'slider(' +
                            '[' + pn(step.args.x1) + ', ' + pn(step.args.y1) + '], ' +
                            '[' + pn(step.args.x2) + ', ' + pn(step.args.y2) + '], ' +
                            '[' + pn(step.args.min ?? step.args.start) + ', ' + pn(step.args.start ?? step.args.ini) + ', ' + pn(step.args.max ?? step.args.end) + ']) ';
                        set_str += '<<' + attrid;
                        set_str += ' snapWidth: ' + pn(step.args.step ?? '0.1') + ', ';
                        set_str += 'baseline: <<id: \'' + step.dest_sub_ids[0] + '\', name: \'\'>>, ';
                        set_str += 'highline: <<id: \'' + step.dest_sub_ids[1] + '\', name: \'\'>>, ';
                        set_str += 'point1: <<id: \'' + step.dest_sub_ids[2] + '\', name: \'\'>>, ';
                        set_str += 'point2: <<id: \'' + step.dest_sub_ids[3] + '\', name: \'\'>>, ';
                        set_str += 'label: <<id: \'' + step.dest_sub_ids[4] + '\', name: \'\', priv: true>>';
                        set_str += ', name: \'' + step.args.name + '\'>>; ';

                        reset_str = 'remove(' + step.dest_id + '); ';
                        reset_str += 'remove(' + step.dest_sub_ids[4] + '); ';
                        reset_str += 'remove(' + step.dest_sub_ids[3] + '); ';
                        reset_str += 'remove(' + step.dest_sub_ids[2] + '); ';
                        reset_str += 'remove(' + step.dest_sub_ids[1] + '); ';
                        reset_str += 'remove(' + step.dest_sub_ids[0] + '); ';
                        break;

                    case JXG.GENTYPE_DELETE:
                        arr = [];
                        ctx_set_str = [];
                        ctx_reset_str = [];

                        for (i = 0; i < step.args.steps.length; i++) {
                            if (step_log[step.args.steps[i]].type > 50) {
                                arr = this.generateJCodeMeta(
                                    step_log[step.args.steps[i]],
                                    board
                                );
                            } else {
                                arr = this.generateJCode(
                                    step_log[step.args.steps[i]],
                                    board,
                                    step_log
                                );
                            }

                            if (arr.length >= 3 && JXG.trim(arr[2]) !== '') {
                                set_str = arr[2] + set_str;
                            }
                            if (arr.length >= 4 && JXG.isFunction(arr[3])) {
                                ctx_set_str.unshift(arr[3]);
                            }
                            if (arr.length >= 1 && JXG.trim(arr[0]) !== '') {
                                reset_str += arr[0];
                            }
                            if (arr.length >= 2 && JXG.isFunction(arr[1])) {
                                ctx_reset_str.push(arr[1]);
                            }
                        }

                        break;

                    case JXG.GENTYPE_COPY:
                        copy_log = [];

                        // Adapt the steps to the new IDs
                        for (el in step.args.steps) {
                            if (step.args.steps.hasOwnProperty(el)) {
                                step2 = JXG.deepCopy(step_log[step.args.steps[el]]);

                                if (step2.type === JXG.GENTYPE_COPY) {
                                    for (i = 0; i < step2.args.map.length; i++) {
                                        for (j = 0; j < step.args.map.length; j++) {
                                            if (
                                                step2.args.map[i].copy === step.args.map[j].orig
                                            ) {
                                                step2.args.map[i].copy = step.args.map[j].copy;
                                            }
                                        }
                                    }

                                    step2 = JXG.SketchReader.replaceStepDestIds(
                                        step2,
                                        step2.args.map
                                    );
                                } else {
                                    step2 = JXG.SketchReader.replaceStepDestIds(
                                        step2,
                                        step.args.map
                                    );
                                }

                                copy_log.push(step2);
                            }
                        }

                        for (i = 0; i < copy_log.length; i++) {
                            if (copy_log[i].type > 50) {
                                arr = this.generateJCodeMeta(copy_log[i], board);
                            } else {
                                arr = this.generateJCode(copy_log[i], board, step_log);
                            }

                            if (JXG.trim(arr[0]) !== '') {
                                set_str += arr[0];
                            }

                            if (JXG.isFunction(arr[1])) {
                                ctx_set_str.push(arr[1]);
                            }

                            if (JXG.trim(arr[2]) !== '') {
                                reset_str = arr[2] + reset_str;
                            }

                            if (JXG.isFunction(arr[3])) {
                                ctx_reset_str.unshift(arr[3]);
                            }
                        }

                        // Apply the offset-translation to the free points of the copy
                        if (step.args.dep_copy) {
                            for (i = 0; i < step.args.map.length; i++) {
                                if (
                                    getObject(step.args.map[i].orig).elementClass ===
                                    JXG.OBJECT_CLASS_POINT
                                ) {
                                    set_str += step.args.map[i].copy;
                                    set_str +=
                                        '.X = function() { return (' +
                                        step.args.map[i].orig +
                                        '.X() - ';
                                    set_str += pn(step.args.x) + '); }; ';
                                    set_str += step.args.map[i].copy;
                                    set_str +=
                                        '.Y = function() { return (' +
                                        step.args.map[i].orig +
                                        '.Y() - ';
                                    set_str += pn(step.args.y) + '); }; ';
                                }
                            }
                        } else {
                            for (i = 0; i < step.args.free_points.length; i++) {
                                xstart = getObject(step.args.free_points[i].orig).coords
                                    .usrCoords[1];
                                ystart = getObject(step.args.free_points[i].orig).coords
                                    .usrCoords[2];

                                set_str +=
                                    step.args.free_points[i].copy + '.X = function() { return ';
                                set_str += pn(xstart - step.args.x) + '; }; ';
                                set_str +=
                                    step.args.free_points[i].copy + '.Y = function() { return ';
                                set_str += pn(ystart - step.args.y) + '; }; ';
                                set_str += step.args.free_points[i].copy + '.free(); ';
                            }
                        }

                        for (j = 0; j < step.args.map.length; j++) {
                            el = getObject(step.args.map[j].orig);

                            // Check if a radius-defined circle should be copied
                            if (el.type === JXG.OBJECT_TYPE_CIRCLE && !JXG.exists(el.point2)) {
                                // Make the radius of the circle copy depend on the original circle's radius
                                set_str +=
                                    step.args.map[j].copy + '.setRadius(function () { return ';
                                set_str += step.args.map[j].orig + '.radius(); }); ';
                            }
                        }

                        break;

                    case JXG.GENTYPE_CIRCLECLONE:
                        if (JXG.exists(step.args.centerCoords)) {

                            set_str =
                                'point(' + pn(step.args.centerCoords[1]) + ', ' + pn(step.args.centerCoords[2]) + ') ' +
                                '<<id: \'' + step.dest_sub_ids[0] + '\'' +
                                ', name: \'\'' +
                                ', withLabel: false' +
                                '>>; ';
                            set_str += step.dest_sub_ids[0] + '.setAttribute(<<traceattributes: <<size: function() {' +
                                ' return ' + step.dest_sub_ids[0] + '.size ' + JXG.Options.sketchometry.traceSizeOperation + '; ' +
                                '} >> >>); ';
                            set_str +=
                                'circle(' + step.dest_sub_ids[0] + ', 1) ' +
                                '<<id: \'' + step.dest_id + '\'' +
                                ', name: \'\', withLabel: false' +
                                ', creationGesture: \'copy\'' +
                                ', creationCenterExisting: false' +
                                getAttribsString(board.options.sketchometry.migration.stroke) +
                                (!step.args.isEmpty
                                        ? getAttribsString(board.options.sketchometry.migration.fill)
                                        : ', fillColor: \'transparent\''
                                ) +
                                '>>; ';
                            if (step.args.createdBy === 'segment') {
                                set_str += step.dest_id + '.setRadius(function() { ' +
                                    'return dist(' + step.src_ids[0] + ', ' + step.src_ids[1] + '); ' +
                                    '}); ';
                            } else if (step.args.createdBy === 'circle') {
                                set_str += step.dest_id + '.setRadius(function() { ' +
                                    'return ' + step.src_ids[0] + '.radius(); ' +
                                    '}); ';
                            }
                            set_str += step.dest_id + '.hasInnerPoints = function() { ' +
                                'return !(' + step.dest_id + '.fillColor == \'transparent\' || ' + step.dest_id + '.fillColor == \'none\' || ' + step.dest_id + '.fillOpacity == 0); ' +
                                '}; ';
                            set_str += step.dest_id + '.highlightStrokeWidth = function() { ' +
                                'return ' + step.dest_id + '.strokeWidth ' + JXG.Options.sketchometry.highlightStrokeWidthOperation + '; ' +
                                ' };';

                            reset_str =
                                'remove(' + step.dest_id + '); ' +
                                'remove(' + step.dest_sub_ids[0] + '); ';

                        } else { // backwards compatibility

                            xstart = getObject(step.src_ids[0]).coords.usrCoords[1];
                            ystart = getObject(step.src_ids[0]).coords.usrCoords[2];

                            set_str =
                                'point(' +
                                pn(xstart - step.args.x) +
                                ', ' +
                                pn(ystart - step.args.y) +
                                ') <<id: \'' + step.dest_sub_ids[0] + '\', name: \'\', withLabel: false>>; ';
                            set_str += step.dest_sub_ids[0] + '.setAttribute(<<traceattributes: <<size: function() {' +
                                ' return ' + step.dest_sub_ids[0] + '.size ' + JXG.Options.sketchometry.traceSizeOperation + '; ' +
                                '} >> >>); ';
                            set_str +=
                                'circle(\'' +
                                step.dest_sub_ids[0] +
                                '\', 1) <<id: \'' +
                                step.dest_sub_ids[1];
                            set_str += '\', fillOpacity: ' + JXG.Options.opacityLevel;
                            set_str +=
                                ', strokeColor: \'#888888\', visible: true, name: \'\', withLabel: false>>; ';

                            if (step.args.fids.length === 1) {
                                step.args.func = step.args.fids[0] + '.radius()';
                            } else {
                                step.args.func =
                                    'dist(' + step.args.fids[0] + ', ' + step.args.fids[1] + ')';
                            }

                            set_str +=
                                step.dest_sub_ids[1] +
                                '.setRadius(function() { return ' +
                                step.args.func +
                                '; }); ';

                            for (j = 0; j < step.src_ids.length; j++) {
                                set_str +=
                                    step.src_ids[j] + '.addChild(' + step.dest_sub_ids[0] + '); ';
                                set_str +=
                                    step.src_ids[j] + '.addChild(' + step.dest_sub_ids[1] + '); ';
                            }

                            if (step.args.migrate !== 0 && step.args.migrate !== -1) {
                                set_str +=
                                    '$board.migratePoint(' +
                                    step.dest_sub_ids[0] +
                                    ', ' +
                                    step.args.migrate +
                                    '); ';
                            }

                            reset_str =
                                'remove(' +
                                step.dest_sub_ids[1] +
                                '); remove(' +
                                step.dest_sub_ids[0] +
                                '); ';
                        }
                        break;

                    case JXG.GENTYPE_VECTORCLONE:
                        if (step.args.useArrowparallel) {

                            pid1 = step.src_ids[0];
                            pid2 = step.src_ids[1];
                            pid3 = step.dest_sub_ids[0];
                            pid4 = step.dest_sub_ids[1];
                            set_str =
                                'point(' + pn(step.args.baseCoords[1]) + ', ' + pn(step.args.baseCoords[2]) + ') ' +
                                '<<id: \'' + pid3 + '\'' +
                                ', name: \'\'' +
                                ', withLabel: false' +
                                '>>; ';
                            set_str += pid3 + '.setAttribute(<<traceattributes: <<size: function() {' +
                                ' return ' + pid3 + '.size ' + JXG.Options.sketchometry.traceSizeOperation + '; ' +
                                '} >> >>); ';
                            set_str +=
                                'arrowparallel(' + pid1 + ', ' + pid2 + ', ' + pid3 + ') ' +
                                '<<id: \'' + step.dest_id + '\'' +
                                ', name: \'\', withLabel: false' +
                                ', point: <<id: \'' + pid4 + '\', name: \'\'>>' +
                                '>>; ';
                            set_str += step.dest_id + '.highlightStrokeWidth = function() { ' +
                                'return ' + step.dest_id + '.strokeWidth ' + JXG.Options.sketchometry.highlightStrokeWidthOperation + '; ' +
                                ' };';

                            reset_str =
                                'remove(' + step.dest_id + '); ' +
                                'remove(' + pid3 + '); ';

                        } else { // backwards compatibility

                            xstart = getObject(step.src_ids[0]).coords.usrCoords[1];
                            ystart = getObject(step.src_ids[0]).coords.usrCoords[2];

                            set_str =
                                'point(' +
                                pn(xstart - step.args.x) +
                                ', ' +
                                pn(ystart - step.args.y) +
                                ') <<id: \'';
                            set_str += step.dest_sub_ids[0] + '\', name: \'\', withLabel: false>>; ';
                            set_str += step.dest_sub_ids[0] + '.setAttribute(<<traceattributes: <<size: function() {' +
                                ' return ' + step.dest_sub_ids[0] + '.size ' + JXG.Options.sketchometry.traceSizeOperation + '; ' +
                                '} >> >>); ';
                            set_str +=
                                'parallelpoint(\'' +
                                step.src_ids[0] +
                                '\',\'' +
                                step.src_ids[1] +
                                '\',\'' +
                                step.dest_sub_ids[0] +
                                '\') <<id: \'' +
                                step.dest_sub_ids[1];
                            set_str +=
                                '\', strokeColor: \'#888888\', visible: true, priv: false, name: \'\', ';
                            set_str +=
                                'layer: ' +
                                JXG.Options.layer.line +
                                ', opacity: 0.2, withLabel: false>>; ';
                            set_str += step.dest_sub_ids[1] + '.setAttribute(<<traceattributes: <<size: function() {' +
                                ' return ' + step.dest_sub_ids[1] + '.size ' + JXG.Options.sketchometry.traceSizeOperation + '; ' +
                                '} >> >>); ';
                            set_str +=
                                'arrow(\'' +
                                step.dest_sub_ids[0] +
                                '\',\'' +
                                step.dest_sub_ids[1] +
                                '\') <<id: \'' +
                                step.dest_sub_ids[2];
                            set_str +=
                                '\', strokeColor: \'#888888\', visible: true, name: \'\', withLabel: false>>; ';

                            for (j = 0; j < step.src_ids.length; j++) {
                                set_str +=
                                    step.src_ids[j] + '.addChild(' + step.dest_sub_ids[0] + '); ';
                                set_str +=
                                    step.src_ids[j] + '.addChild(' + step.dest_sub_ids[1] + '); ';
                                set_str +=
                                    step.src_ids[j] + '.addChild(' + step.dest_sub_ids[2] + '); ';
                            }

                            if (step.args.migrate !== 0 && step.args.migrate !== -1) {
                                set_str +=
                                    '$board.migratePoint(' +
                                    step.dest_sub_ids[0] +
                                    ', ' +
                                    step.args.migrate +
                                    '); ';
                            }

                            reset_str =
                                'remove(' +
                                step.dest_sub_ids[1] +
                                '); remove(' +
                                step.dest_sub_ids[0] +
                                '); remove(' +
                                step.dest_sub_ids[2] +
                                ');';
                        }
                        break;

                    case JXG.GENTYPE_MOVEMENT:
                        if (JXG.exists(step.args.coordsTo) && JXG.exists(step.args.coordsFrom)) {

                            for (i = 0; i < step.src_ids.length; i++) {
                                set_str += step.src_ids[i] + '.moveTo([' +
                                    pn(step.args.coordsTo[i][0]) + ', ' +
                                    pn(step.args.coordsTo[i][1]) + ', ' +
                                    pn(step.args.coordsTo[i][2]) +
                                    ']); ';
                                reset_str += step.src_ids[i] + '.moveTo([' +
                                    pn(step.args.coordsFrom[i][0]) + ', ' +
                                    pn(step.args.coordsFrom[i][1]) + ', ' +
                                    pn(step.args.coordsFrom[i][2]) +
                                    ']); ';
                            }

                        } else { // Backwards compatibility
                            if (
                                step.args.obj_type === JXG.OBJECT_TYPE_LINE ||
                                step.args.obj_type === JXG.OBJECT_TYPE_VECTOR
                            ) {
                                set_str =
                                    step.src_ids[0] + '.moveTo([' +
                                    pn(step.args.coords[0].usrCoords[0]) + ', ' +
                                    pn(step.args.coords[0].usrCoords[1]) + ', ' +
                                    pn(step.args.coords[0].usrCoords[2]) +
                                    ']); ';
                                reset_str =
                                    step.src_ids[0] + '.moveTo([' +
                                    step.args.zstart[0] + ', ' +
                                    step.args.xstart[0] + ', ' +
                                    step.args.ystart[0] +
                                    ']); ';

                                set_str +=
                                    step.src_ids[1] + '.moveTo([' +
                                    pn(step.args.coords[1].usrCoords[0]) + ', ' +
                                    pn(step.args.coords[1].usrCoords[1]) + ', ' +
                                    pn(step.args.coords[1].usrCoords[2]) +
                                    ']); ';
                                reset_str +=
                                    step.src_ids[1] + '.moveTo([' +
                                    step.args.zstart[1] + ', ' +
                                    step.args.xstart[1] + ', ' +
                                    step.args.ystart[1] +
                                    ']); ';

                            } else if (step.args.obj_type === JXG.OBJECT_TYPE_CIRCLE) {
                                set_str =
                                    step.src_ids[0] + '.moveTo([' +
                                    pn(step.args.coords[0].usrCoords[1]) + ', ' +
                                    pn(step.args.coords[0].usrCoords[2]) +
                                    ']); ';
                                reset_str =
                                    step.src_ids[0] + '.moveTo([' +
                                    step.args.xstart + ', ' +
                                    step.args.ystart +
                                    ']); ';

                                if (step.args.has_point2) {
                                    set_str +=
                                        step.src_ids[1] + '.moveTo([' +
                                        pn(step.args.coords[1].usrCoords[1]) + ', ' +
                                        pn(step.args.coords[1].usrCoords[2]) +
                                        ']); ';
                                    reset_str +=
                                        step.src_ids[1] + '.moveTo([' +
                                        step.args.old_p2x + ', ' +
                                        step.args.old_p2y +
                                        ']); ';
                                }
                            } else if (step.args.obj_type === JXG.OBJECT_TYPE_POLYGON) {
                                set_str = reset_str = '';

                                for (i = 0; i < step.src_ids.length; i++) {
                                    set_str +=
                                        step.src_ids[i] + '.moveTo([' +
                                        pn(step.args.coords[i].usrCoords[1]) + ', ' +
                                        pn(step.args.coords[i].usrCoords[2]) +
                                        ']); ';
                                    reset_str +=
                                        step.src_ids[i] + '.moveTo([' +
                                        step.args.xstart[i] + ', ' +
                                        step.args.ystart[i] +
                                        ']); ';
                                }
                            } else {
                                // Backwards compatibility of pre 1.0 files
                                if (JXG.exists(step.args.coords[0])) {
                                    set_str =
                                        step.src_ids[0] + '.moveTo([' +
                                        pn(step.args.coords[0].usrCoords[1]) + ', ' +
                                        pn(step.args.coords[0].usrCoords[2]) +
                                        ']); ';
                                    reset_str =
                                        step.src_ids[0] + '.moveTo([' +
                                        step.args.xstart + ', ' +
                                        step.args.ystart +
                                        ']); ';
                                }
                            }
                        }
                        break;

                    default:
                        JXG.debug('No such GENTYPE!' + step.type);
                        return [];
                }

                return [set_str, ctx_set_str, reset_str, ctx_reset_str];
            },

            replaceStepDestIds: function (step, id_map) {
                var i,
                    j,
                    copy_ids = [];

                for (i = 0; i < id_map.length; i++) {
                    copy_ids.push(id_map[i].copy);

                    if (step.dest_id === id_map[i].orig) {
                        step.dest_id = id_map[i].copy;
                    }

                    for (j = 0; j < step.dest_sub_ids.length; j++) {
                        if (step.dest_sub_ids[j] === id_map[i].orig) {
                            step.dest_sub_ids[j] = id_map[i].copy;
                        }
                    }

                    for (j = 0; j < step.src_ids.length; j++) {
                        if (step.src_ids[j] === id_map[i].orig) {
                            step.src_ids[j] = id_map[i].copy;
                        }
                    }
                }

                for (j = 0; j < step.dest_sub_ids.length; j++) {
                    if (!JXG.isInArray(copy_ids, step.dest_sub_ids[j])) {
                        step.dest_sub_ids[j] = this.id();
                    }
                }

                step.src_ids = JXG.uniqueArray(step.src_ids);
                step.dest_sub_ids = JXG.uniqueArray(step.dest_sub_ids);

                return step;
            }
        }
    );

    // SketchReader constants
    JXG.extendConstants(JXG, {
        GENTYPE_ABC: 1, // unused
        GENTYPE_AXIS: 2,
        GENTYPE_MIDPOINT: 3,
        GENTYPE_REFLECTION_ON_LINE: 4,
        GENTYPE_REFLECTION_ON_POINT: 5,
        GENTYPE_TANGENT: 6,
        GENTYPE_PARALLEL: 7,
        GENTYPE_BISECTORLINES: 8,
        GENTYPE_BOARDIMG: 9,
        GENTYPE_BISECTOR: 10,
        GENTYPE_NORMAL: 11,
        GENTYPE_POINT: 12,
        GENTYPE_GLIDER: 13,
        GENTYPE_INTERSECTION: 14,
        GENTYPE_CIRCLE: 15,
        GENTYPE_CIRCLE2POINTS: 16, // deprecated NOT USED ANY MORE SINCE SKETCHOMETRY 2.0 (only for old constructions needed)
        GENTYPE_LINE: 17,
        GENTYPE_TRIANGLE: 18,
        GENTYPE_QUADRILATERAL: 19,
        GENTYPE_TEXT: 20,
        GENTYPE_POLYGON: 21,
        GENTYPE_REGULARPOLYGON: 22,
        GENTYPE_SECTOR: 23,
        GENTYPE_ANGLE: 24,
        GENTYPE_PLOT: 25,
        GENTYPE_SLIDER: 26,
        GENTYPE_TRUNCATE: 27,
        GENTYPE_JCODE: 28,
        GENTYPE_MOVEMENT: 29,
        GENTYPE_COMBINED: 30,
        GENTYPE_RULER: 31,
        GENTYPE_SLOPETRIANGLE: 32,
        GENTYPE_PERPSEGMENT: 33,
        GENTYPE_LABELMOVEMENT: 34,
        GENTYPE_VECTOR: 35,
        GENTYPE_NONREFLEXANGLE: 36,
        GENTYPE_REFLEXANGLE: 37,
        GENTYPE_PATH: 38,
        GENTYPE_DERIVATIVE: 39,
        GENTYPE_PERPBISECTOR: 40,
        GENTYPE_DELETE: 41,
        GENTYPE_COPY: 42,
        GENTYPE_MIRROR: 43,
        GENTYPE_ROTATE: 44,
        GENTYPE_CIRCLECLONE: 45,
        GENTYPE_MIGRATE: 46,
        GENTYPE_VECTORCLONE: 47,
        GENTYPE_POLYGONCOPY: 48,
        GENTYPE_PARALLELPOINT: 49,
        GENTYPE_PARALLELOGRAM: 50,

        // IMPORTANT:
        // ----------
        // For being able to differentiate between the (GUI-specific) CTX and
        // (CORE-specific) non-CTX steps, the non-CTX steps MUST NOT be changed
        // to values > 50.

        GENTYPE_CTX_POINT_GLIDE: 51,
        GENTYPE_CTX_POINT_FREE: 52,
        GENTYPE_CTX_TRACE: 53,
        GENTYPE_CTX_VISIBILITY: 54,
        GENTYPE_CTX_POINT_MERGE: 55,
        GENTYPE_CTX_POINT_UNMERGE: 56,
        GENTYPE_CTX_WITHLABEL: 57,
        GENTYPE_CTX_LABEL: 58,
        GENTYPE_CTX_FIXED: 59,
        GENTYPE_CTX_STROKEWIDTH: 60,
        GENTYPE_CTX_LABELSIZE: 61,
        GENTYPE_CTX_SIZE: 62,
        GENTYPE_CTX_FACE: 63,
        GENTYPE_CTX_STRAIGHT: 64,
        GENTYPE_CTX_ARROW: 65,
        GENTYPE_CTX_COLOR: 66,
        GENTYPE_CTX_RADIUS: 67,
        GENTYPE_CTX_COORDS: 68,
        GENTYPE_CTX_TEXT: 69,
        GENTYPE_CTX_ANGLERADIUS: 70,
        GENTYPE_CTX_DOTVISIBILITY: 71,
        GENTYPE_CTX_FILLOPACITY: 72,
        GENTYPE_CTX_PLOT: 73,
        GENTYPE_CTX_SCALE: 74,
        GENTYPE_CTX_SLIDER_BOUND: 75,
        GENTYPE_CTX_POINT1: 76,
        GENTYPE_CTX_POINT2: 77,
        GENTYPE_CTX_LABELSTICKY: 78,
        GENTYPE_CTX_POINT_INTERSECT: 79,
        GENTYPE_CTX_HASINNERPOINTS: 80,
        GENTYPE_CTX_SLIDER_STEP: 81,
        GENTYPE_CTX_SNAPTOGRID: 82,
        GENTYPE_CTX_SNAPTOPOINTS: 83,
        GENTYPE_CTX_STROKEDASH: 84,
        GENTYPE_CTX_SLIDER_VALUE: 85,
        GENTYPE_CTX_SECTORBORDERS: 86,
        GENTYPE_CTX_CURVETAU: 87,
        GENTYPE_CTX_SLIDER_POS: 88,
        // space for 89 - 99
        GENTYPE_CTX_GRID_VISIBILITY: 100,
        GENTYPE_CTX_AXES_VISIBILITY: 101,
        GENTYPE_CTX_AXES_SCALE: 102,
        GENTYPE_CTX_BACKGROUND_COLOR: 103,
        GENTYPE_CTX_BACKGROUND_OPACITY: 104,
        GENTYPE_CTX_SNAPTOGRID_GLOBAL: 105,
        GENTYPE_CTX_SNAPTOPOINTS_GLOBAL: 106,
    })

    JXG.registerReader(JXG.SketchReader, ['sketch', 'sketchometry']);
})();
