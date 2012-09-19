/*
    Copyright 2008-2011
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Heiko Vogel
        Alfred Wassermann,

    This file is part of JSXGraph.

    JSXGraph is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with JSXGraph.  If not, see <http://www.gnu.org/licenses/>.
*/

JXG.extend(JXG, {

    GENTYPE_ABC: 1, // unused
    GENTYPE_AXIS: 2,
    GENTYPE_MID: 3,
    GENTYPE_REFLECTION: 4,
    GENTYPE_MIRRORPOINT: 5,
    GENTYPE_TANGENT: 6,
    GENTYPE_PARALLEL: 7,
    GENTYPE_BISECTORLINES: 8,
    GENTYPE_PERPENDICULAR_BISECTOR: 9,
    GENTYPE_BISECTOR: 10,
    GENTYPE_NORMAL: 11,
    GENTYPE_POINT: 12,
    GENTYPE_GLIDER: 13,
    GENTYPE_INTERSECTION: 14,
    GENTYPE_CIRCLE: 15,
    GENTYPE_CIRCLE2POINTS: 16,
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
    GENTYPE_XYZ: 27, // unused ...
    GENTYPE_JCODE: 28,
    GENTYPE_MOVEMENT: 29,

    // 30 ... 32 // unused ...

    GENTYPE_GRID: 33, // obsolete

    // 34 ... 39 // unused ...

    GENTYPE_DELETE: 41,
    GENTYPE_COPY: 42,
    GENTYPE_MIRROR: 43,
    GENTYPE_ROTATE: 44,
    GENTYPE_TRANSLATE: 45,
    GENTYPE_TRANSFORM: 46,

    // 47 ... 50 // unused ...

    /*
     Important:
     ==========

     For being able to differentiate between the (GUI-specific) CTX and
     (CORE-specific) non-CTX steps, the non-CTX steps must not be changed
     to values > 50 !!!
     */

    GENTYPE_CTX_TYPE_G: 51,
    GENTYPE_CTX_TYPE_P: 52,
    GENTYPE_CTX_TRACE: 53,
    GENTYPE_CTX_VISIBILITY: 54,
    GENTYPE_CTX_CCVISIBILITY: 55,
    GENTYPE_CTX_MPVISIBILITY: 56,
    GENTYPE_CTX_WITHLABEL: 57,
    GENTYPE_CTX_SETLABEL: 58,
    GENTYPE_CTX_SETFIXED: 59,
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

    SketchReader: {

        generator: {
            toFixed: 0,
            freeLine: false,
            useGlider: false,
            useSymbols: false
        },
        // configure the generator below

        generateJCodeMeta: function () {},

        id: function () {
            return JXG.Util.genUUID();
        },

        generateJCode: function (step, board, step_log) {

            // step has to be an objectliteral of the form: { type, args, src_ids, dest_sub_ids, dest_id }

            var options, assign, attrid, obj, type;

            var i, j, k, sub_id, str, str1, str2, objects, pid1, pid2, xstart, ystart, el, bo, arr,
                xy, sxy, sxyc, step2, copy_log = [];

            var set_str = '', reset_str = '', ctx_set_str = '', ctx_reset_str = '';

            options = JXG.SketchReader.generator;

            objects = board.objects;

            // print number -- helper to prepare numbers
            // for printing, e.g. trim them with toFixed()

            var pn = function (v) {
                if (options.toFixed > 0)
                    v = v.toFixed(options.toFixed);
                return v;
            };

            var getObject = function (v) {
                var o;

                if (options.useSymbols) {
                    if (board.jc.sstack[0][v]) {
                        o = board.jc.sstack[0][v];
                    } else {
                        o = objects[v];
                    }
                } else {
                    o = objects[v];
                }

                return o;
            };

            /* SKETCHBIN begin */

            assign = '';
            attrid = 'id: \'' + step.dest_id + '\', ';

            if (JXG.exists(board) && options.useSymbols && step.type !== JXG.GENTYPE_TRANSLATE) {
                attrid = '';
                assign = step.dest_id + ' = ';

                for (i = 0; i < step.src_ids.length; i++) {
                    str = board.jc.findSymbol(getObject(step.src_ids[i]), 0); // Das Board wird hier immer benötigt!!!

                    if (str.length > 0) {
                        step.src_ids[i] = str[0];
                    }
                }
            }

            /* SKETCHBIN end */

            if (step.type > 50 && withCtxSetters == false)
                return;

            switch (step.type) {

                case JXG.GENTYPE_JCODE:
                    set_str = step.args.code;
                    break;

                case JXG.GENTYPE_AXIS:
                    set_str = step.args.name[0] + ' = point(' + pn(step.args.coords[0].usrCoords[1]) + ', ';
                    set_str += pn(step.args.coords[0].usrCoords[2]) + ') <<id: \'' + step.dest_sub_ids[0] + '\', name: \'';
                    set_str += step.args.name[0] + '\', fixed: true, priv: true, visible: false>>; ' + step.args.name[1];
                    set_str += ' = point(' + pn(step.args.coords[1].usrCoords[1]) + ', ';
                    set_str += pn(step.args.coords[1].usrCoords[2]) + ') <<id: \'' + step.dest_sub_ids[1] + '\', name: \'';
                    set_str += step.args.name[1] + '\', fixed: true, priv: true, visible: false>>; ' + step.args.name[2];
                    set_str += ' = point(' + pn(step.args.coords[2].usrCoords[1]) + ', ';
                    set_str += pn(step.args.coords[2].usrCoords[2]) + ') <<id: \'' + step.dest_sub_ids[2] + '\', name: \'';
                    set_str += step.args.name[2] + '\', fixed: true, priv: true, visible: false>>; ';

                    set_str += step.args.name[3] + ' = axis(' + step.args.name[0] + ', ' + step.args.name[1] + ') ';
                    set_str += '<<id: \'' + step.dest_sub_ids[3] + '\', name: \'' + step.args.name[3] + '\', ticks: ';
                    set_str += '<<minorHeight:0, majorHeight:10, ticksDistance: ' + JXG.Options.axisScaleX;
                    set_str += ', drawLabels: true>>>>; ';
                    set_str += step.args.name[4] + ' = axis(' + step.args.name[0] + ', ' + step.args.name[2] + ') ';
                    set_str += '<<id: \'' + step.dest_sub_ids[4] + '\', name: \'' + step.args.name[4] + '\', ticks: ';
                    set_str += '<<minorHeight:0, majorHeight:10, ticksDistance: ' + JXG.Options.axisScaleY;
                    set_str += ', drawLabels: true, drawZero: false>>>>; ';

                    set_str += step.dest_sub_ids[3] + '.visible = false; ';
                    set_str += step.dest_sub_ids[4] + '.visible = false; ';

                    set_str += 'delete jxgBoard1_infobox; ';

                    reset_str = 'delete ' + step.dest_sub_ids[4] + '; delete ' + step.dest_sub_ids[3];
                    reset_str += '; delete ' + step.dest_sub_ids[2] + '; ';
                    reset_str += 'delete ' + step.dest_sub_ids[1] + '; delete ' + step.dest_sub_ids[0] + '; ';

                    break;

                case JXG.GENTYPE_MID:
                    set_str = assign + 'midpoint(' + step.src_ids[0] + ', ' + step.src_ids[1] + ') <<' + attrid;
                    set_str += 'fillColor: \'' + step.args.fillColor + '\'>>; ';
                    reset_str = 'delete ' + step.dest_id + '; ';
                    break;

                case JXG.GENTYPE_REFLECTION:
                    set_str = assign + 'reflection(' + step.src_ids[0] + ', ' + step.src_ids[1] + ') <<' + attrid;
                    set_str += 'fillColor: \'' + step.args.fillColor + '\'>>; ';
                    reset_str = 'delete ' + step.dest_id + '; ';
                    break;

                case JXG.GENTYPE_MIRRORPOINT:
                    set_str = assign + 'mirrorpoint(' + step.src_ids[1] + ', ' + step.src_ids[0] + ') <<' + attrid;
                    set_str += 'fillColor: \'' + step.args.fillColor + '\'>>; ';
                    reset_str = 'delete ' + step.dest_id + '; ';
                    break;

                case JXG.GENTYPE_TANGENT:
                    if (step.args.create_point === true) {
                        sub_id = step.dest_sub_ids[2];
                        set_str = 'point(' + pn(step.args.usrCoords[1]) + ',' + pn(step.args.usrCoords[2]) + ') <<id: \'';
                        set_str += sub_id + '\', fillColor: \'' + step.args.fillColor + '\'>>; ' + sub_id + '.glide(';
                        set_str += step.src_ids[0] + '); ';
                        reset_str = 'delete ' + sub_id + '; ';
                    } else
                        sub_id = step.src_ids[0];

                    set_str += assign + 'tangent(' + sub_id + ') <<' + attrid + 'point1: <<name: \'' + step.dest_sub_ids[0];
                    set_str += '\', id: \'' + step.dest_sub_ids[0] + '\'>>, point2: <<name: \'' + step.dest_sub_ids[1];
                    set_str += '\', id: \'' + step.dest_sub_ids[1] + '\'>> >>; ';
                    reset_str = 'delete ' + step.dest_sub_ids[0] + '; ' + reset_str;
                    reset_str = 'delete ' + step.dest_id + '; delete ' + step.dest_sub_ids[1] + '; ' + reset_str;
                    break;

                case JXG.GENTYPE_PARALLEL:
                    if (step.args.create_point === true) {
                        sub_id = step.dest_sub_ids[1];
                        set_str = 'point(' + pn(step.args.usrCoords[1]) + ', ' + pn(step.args.usrCoords[2]) + ') <<id: \'';
                        set_str += sub_id + '\', name: \'\', visible: false, priv: true>>; ';
                        reset_str = 'delete ' + sub_id + '; ';
                    } else
                        sub_id = step.src_ids[1];

                    set_str += assign + 'parallel(' + step.src_ids[0] + ', ' + sub_id + ') <<' + attrid + 'point: <<id: \'';
                    set_str += step.dest_sub_ids[0] + '\', name: \'' + step.dest_sub_ids[0] + '\'>> >>; ';
                    reset_str = 'delete ' + step.dest_id + '; delete ' + step.dest_sub_ids[0] + '; ' + reset_str;
                    break;

                case JXG.GENTYPE_BISECTORLINES:
                    set_str = 'bisectorlines(' + step.src_ids[0] + ', ' + step.src_ids[1] + ') <<line1: <<id: \'';
                    set_str = set_str + step.dest_sub_ids[2] + '\', point1: <<id: \'' + step.dest_sub_ids[1];
                    set_str += '\', name: \'' + step.dest_sub_ids[1] + '\'>>, point2: <<id: \'' + step.dest_sub_ids[0];
                    set_str += '\', name: \'' + step.dest_sub_ids[0] + '\'>>>>, line2: <<id: \'' + step.dest_sub_ids[5];
                    set_str += '\', point1: <<id: \'' + step.dest_sub_ids[4] + '\', name: \'' + step.dest_sub_ids[4];
                    set_str += '\'>>, point2: <<id: \'' + step.dest_sub_ids[3] + '\', name: \'' + step.dest_sub_ids[3];
                    set_str += '\'>>>>>>; ';
                    reset_str = 'delete ' + step.dest_sub_ids[5] + '; delete ' + step.dest_sub_ids[4] + '; delete ';
                    reset_str += step.dest_sub_ids[3] + '; delete ' + step.dest_sub_ids[2] + '; delete ';
                    reset_str += step.dest_sub_ids[1] + '; delete ' + step.dest_sub_ids[0] + '; ';
                    break;

                case JXG.GENTYPE_PERPENDICULAR_BISECTOR:
                    if (step.args.create_line === true) {
                        sub_id = step.dest_sub_ids[2];
                        set_str = 'line(' + step.src_ids[0] + ', ' + step.src_ids[1] + ') <<id: \'' + sub_id;
                        set_str += '\', visible: true>>; ';
                        reset_str = 'delete ' + sub_id + '; ';
                    } else
                        sub_id = step.src_ids[2];

                    set_str += 'midpoint(' + step.src_ids[0] + ', ' + step.src_ids[1] + ') <<id: \'' + step.dest_sub_ids[0];
                    set_str += '\', fillColor: \'' + step.args.fillColor + '\'>>; ';
                    set_str += assign + 'normal(' + step.dest_sub_ids[0] + ', ' + sub_id + ') <<' + attrid;
                    set_str += ' point: <<id: \'' + step.dest_sub_ids[1] + '\', name: \'' + step.dest_sub_ids[1];
                    set_str += '\'>> >>; ';
                    reset_str = 'delete ' + step.dest_sub_ids[0] + '; ' + reset_str;
                    reset_str = 'delete ' + step.dest_id + '; delete ' + step.dest_sub_ids[1] + '; ' + reset_str;
                    break;

                case JXG.GENTYPE_BISECTOR:
                    set_str = assign + 'bisector(' + step.src_ids[1] + ', ' + step.src_ids[2] + ', ' + step.src_ids[0];
                    set_str += ') <<' + attrid + 'point: <<id: \'' + step.dest_sub_ids[0] + '\', name: \'';
                    set_str += step.dest_sub_ids[0] + '\'>>>>; ';
                    reset_str = 'delete ' + step.dest_id + '; delete ' + step.dest_sub_ids[0] + '; ';
                    break;

                case JXG.GENTYPE_NORMAL:
                    if (step.args.create_point === true) {
                        sub_id = step.dest_sub_ids[1];
                        set_str = 'point(' + pn(step.args.usrCoords[1]) + ', ' + pn(step.args.usrCoords[2]);
                        set_str += ') <<id: \'' + sub_id + '\', name: \'\', visible: false, priv: true>>; ';
                        reset_str = 'delete ' + sub_id + '; ';
                    } else
                        sub_id = step.src_ids[1];

                    set_str += assign + 'normal(' + sub_id + ', ' + step.src_ids[0] + ') <<' + attrid;
                    set_str += 'point: <<id: \'' + step.dest_sub_ids[0] + '\', name: \'' + step.dest_sub_ids[0];
                    set_str += '\'>> >>; ';
                    reset_str = 'delete ' + step.dest_id + '; delete ' + step.dest_sub_ids[0] + '; ' + reset_str;
                    break;

                case JXG.GENTYPE_POINT:
                    set_str = assign + 'point(' + pn(step.args.usrCoords[1]) + ', ' + pn(step.args.usrCoords[2]);
                    set_str += ')' + ( options.useSymbols ? '' : ' <<id: \'' + step.dest_id + '\'>>') + ';';
                    reset_str = 'delete ' + step.dest_id + '; ';
                    break;

                case JXG.GENTYPE_GLIDER:
                    if (options.useGlider) {
                        set_str = assign + 'glider(' + pn(step.args.usrCoords[1]) + ', ' + pn(step.args.usrCoords[2]);
                        set_str += ', ' + step.src_ids[0] + ')';
                        set_str += ( options.useSymbols ? '' : '<<id: \'' + step.dest_id + '\'>>') + ';';
                    } else {
                        set_str = assign + 'point(' + pn(step.args.usrCoords[1]) + ', ' + pn(step.args.usrCoords[2]);
                        set_str += ') <<' + attrid + ' fillColor: \'' + step.args.fillColor + '\'>>; ' + step.dest_id;
                        set_str += '.glide(' + step.src_ids[0] + '); ';
                    }
                    reset_str = 'delete ' + step.dest_id + '; ';
                    break;

                case JXG.GENTYPE_INTERSECTION:
                    set_str = assign + 'intersection(' + step.src_ids[0] + ', ' + step.src_ids[1] + ', ' + step.args.choice;
                    set_str += ') <<' + attrid + ' fillColor: \'' + step.args.fillColor + '\'>>; ';
                    reset_str = 'delete ' + step.dest_id + '; ';
                    break;

                case JXG.GENTYPE_CIRCLE:
                    reset_str = 'delete ' + step.dest_sub_ids[0] + '; ';

                    if (step.args.create_point === true || step.args.create_midpoint === true) {

                        if (step.args.create_point === true) {
                            set_str = 'point(' + pn(step.args.usrCoords[1]) + ', ' + pn(step.args.usrCoords[2]);
                            set_str += ') <<id: \'' + step.dest_sub_ids[0] + '\', priv: false>>; ';
                        } else {
                            set_str = 'midpoint(' + step.src_ids[0] + ', ' + step.src_ids[1] + ') <<id: \'';
                            set_str += step.dest_sub_ids[0] + '\', name: \'\', visible: false>>; ';
                        }

                        set_str += assign + 'circle(' + step.dest_sub_ids[0] + ', ' + step.src_ids[0] + ') <<' + attrid;
                        set_str += ' fillOpacity: ' + JXG.Options.opacityLevel + '>>; ';
                        reset_str = 'delete ' + step.dest_id + '; ' + reset_str;

                    } else if (step.args.create_by_radius === true) {
                        set_str = 'point(' + pn(step.args.x) + ', ' + pn(step.args.y) + ') <<id: \'' + step.dest_sub_ids[0];
                        set_str += '\', name: \'\', withLabel: true, visible: true, priv: false>>; ';
                        set_str += step.dest_sub_ids[0] + '.visible = false; ';
                        set_str += assign + 'circle(\'' + step.dest_sub_ids[0] + '\', ' + pn(step.args.r) + ') <<' + attrid;
                        set_str += ' fillOpacity: ' + JXG.Options.opacityLevel + '>>; ';
                        reset_str = 'delete ' + step.dest_id + '; delete ' + step.dest_sub_ids[0] + '; ';
                    } else {
                        set_str = assign + 'circle(' + step.src_ids[0] + ', ' + step.src_ids[1] + ', ' + step.src_ids[2];
                        set_str += ') <<center: <<id: \'' + step.dest_sub_ids[0] + '\', name: \'' + step.dest_sub_ids[0];
                        set_str += '\'>>, ' + attrid + ' fillOpacity: ' + JXG.Options.opacityLevel + ' >>; ';
                        reset_str = 'delete ' + step.dest_id + '; ' + reset_str;
                    }

                    break;

                case JXG.GENTYPE_CIRCLE2POINTS:
                    if (step.args.create_two_points === true) {
                        set_str = 'point(' + pn(step.args.x1) + ', ' + pn(step.args.y1) + ') <<id: \'' + step.dest_sub_ids[0];
                        set_str += '\'>>; ';
                        set_str += 'point(' + pn(step.args.x2) + ', ' + pn(step.args.y2) + ') <<id: \'';
                        set_str += step.dest_sub_ids[1] + '\'>>; ';
                        set_str += assign + 'circle(' + step.dest_sub_ids[0] + ', ' + step.dest_sub_ids[1] + ') <<' + attrid;
                        set_str += ' fillOpacity: ' + JXG.Options.opacityLevel + '>>; ';
                        reset_str = 'delete ' + step.dest_id + '; delete ' + step.dest_sub_ids[1] + '; delete ';
                        reset_str += step.dest_sub_ids[0] + '; ';
                    } else if (step.args.create_point === true) {
                        set_str = 'point(' + pn(step.args.x) + ', ' + pn(step.args.y) + ') <<id: \'' + step.dest_sub_ids[0];
                        set_str += '\'>>; ';
                        set_str += assign + 'circle(' + step.dest_sub_ids[0] + ', ' + step.src_ids[0] + ') <<' + attrid;
                        set_str += ' fillOpacity: ' + JXG.Options.opacityLevel + '>>; ';
                        reset_str = 'delete ' + step.dest_id + '; delete ' + step.dest_sub_ids[0] + '; ';
                    } else if (step.args.create_by_radius === true) {
                        set_str = assign + 'circle(' + step.src_ids[0] + ', ' + step.args.r + ') <<' + attrid;
                        set_str += ' fillOpacity: ' + JXG.Options.opacityLevel + '>>; ';
                        reset_str = 'delete ' + step.dest_id + '; ';
                    } else {
                        set_str = assign + 'circle(' + step.src_ids[0] + ', ' + step.src_ids[1] + ') <<' + attrid;
                        set_str += ' fillOpacity: ' + JXG.Options.opacityLevel + '>>; ';
                        reset_str = 'delete ' + step.dest_id + '; ';
                    }

                    break;

                case JXG.GENTYPE_LINE:
                    k = 0;
                    j = 0;

                    if (step.args.create_point1) {
                        pid1 = step.dest_sub_ids[k++];
                        str1 = [];
                        for (i = 0; i < step.args.p1.length; i++)
                            str1[i] = pn(step.args.p1[i]);

                        set_str = 'point(' + str1.join(', ') + ') <<id: \'' + pid1 + '\', name: \'\', visible: false, ';
                        set_str += 'priv: true>>; ';
                        reset_str = 'delete ' + pid1 + '; ';
                    } else
                        pid1 = step.src_ids[j++];

                    if (step.args.create_point2) {
                        pid2 = step.dest_sub_ids[k++];
                        str1 = [];
                        for (i = 0; i < step.args.p2.length; i++)
                            str1[i] = pn(step.args.p2[i]);

                        set_str += 'point(' + str1.join(', ') + ') <<id: \'' + pid2 + '\', name: \'\', visible: false, ';
                        set_str += 'priv: true>>; ';
                        reset_str = 'delete ' + pid2 + '; ' + reset_str;
                    } else
                        pid2 = step.src_ids[j++];

                    str = 'line';
                    str1 = '';

                    // the line's parents
                    str2 = pid1 + ', ' + pid2;

                    // if we want a truly free line
                    if (step.args.create_point1 && step.args.create_point2 && options.freeLine) {
                        // forget the points
                        set_str = '';
                        reset_str = '';

                        // use the stdform instead
                        if (step.args.p1.length === 2)
                            step.args.p1.unshift(1);

                        if (step.args.p2.length === 2)
                            step.args.p2.unshift(1);

                        str2 = JXG.Math.crossProduct(step.args.p1, step.args.p2);
                        for (i = 0; i < str2.length; i++)
                            str2[i] = pn(str2[i]);

                        str2 = str2.join(', ');
                    }

                    if (!step.args.first && !step.args.last)
                        str = 'segment';
                    else {
                        if (!step.args.first)
                            str1 = 'straightFirst: ' + step.args.first;

                        if (!step.args.last)
                            str1 = 'straightLast: ' + step.args.last;

                        if (str1.length > 0 && !options.useSymbols)
                            str1 += ', ';
                    }

                    // this is a corner case, we have to get rid of the ',' at the end
                    // simple solution: rebuild attrid
                    if (!options.useSymbols)
                        attrid = ' id: \'' + step.dest_id + '\' ';

                    set_str += assign + str + '(' + str2 + ')';
                    set_str += (str1.length + attrid.length > 0 ? ' <<' + str1 + attrid + '>>' : '') + ';';
                    reset_str = 'delete ' + step.dest_id + '; ' + reset_str;

                    break;

                case JXG.GENTYPE_TRIANGLE:
                    for (i = 0; i < step.args.create_point.length; i++)
                        if (step.args.create_point[i] === true) {
                            set_str += 'point(' + pn(step.args.coords[i].usrCoords[1]) + ', ';
                            set_str += pn(step.args.coords[i].usrCoords[2]) + ') <<id: \'' + step.dest_sub_ids[i];
                            set_str += '\'>>; ';
                        }

                    for (i = 0; i < step.dest_sub_ids.length; i++)
                        if (step.dest_sub_ids[i] !== 0)
                            reset_str = 'delete ' + step.dest_sub_ids[i] + '; ' + reset_str;

                    reset_str = 'delete ' + step.dest_id + '; ' + reset_str;

                    set_str += assign + 'polygon(';

                    for (i = 0; i < step.src_ids.length; i++) {
                        set_str += step.src_ids[i];
                        if (i < step.src_ids.length - 1)
                            set_str += ', ';
                    }

                    for (i = 0; i < 3; i++) {
                        if (step.dest_sub_ids[i] !== 0) {
                            if (step.src_ids.length > 0 || i > 0)
                                set_str += ', ';
                            set_str += step.dest_sub_ids[i];
                        }
                    }

                    set_str += ') <<borders: <<ids: [ \'' + step.dest_sub_ids[3] + '\', \'' + step.dest_sub_ids[4];
                    set_str += '\', \'' + step.dest_sub_ids[5] + '\' ]>>, ' + attrid + ' fillOpacity: ';
                    set_str += JXG.Options.opacityLevel + ', hasInnerPoints:true, scalable:true>>; ';
                    break;

                case JXG.GENTYPE_QUADRILATERAL:
                    for (i = 0; i < step.args.create_point.length; i++)
                        if (step.args.create_point[i] === true) {
                            set_str += 'point(' + pn(step.args.coords[i].usrCoords[1]) + ', ';
                            set_str += pn(step.args.coords[i].usrCoords[2]) + ') <<id: \'' + step.dest_sub_ids[i];
                            set_str += '\'>>; ';
                        }

                    for (i = 0; i < step.dest_sub_ids.length; i++)
                        if (step.dest_sub_ids[i] !== 0)
                            reset_str = 'delete ' + step.dest_sub_ids[i] + '; ' + reset_str;

                    reset_str = 'delete ' + step.dest_id + '; ' + reset_str;

                    set_str += assign + 'polygon(';

                    for (i = 0; i < step.src_ids.length; i++) {
                        set_str += step.src_ids[i];
                        if (i < step.src_ids.length - 1)
                            set_str += ', ';
                    }

                    set_str += ') <<borders: <<ids: [ \'' + step.dest_sub_ids[4] + '\', \'' + step.dest_sub_ids[5];
                    set_str += '\', \'';
                    set_str += step.dest_sub_ids[6] + '\', \'' + step.dest_sub_ids[7] + '\' ]>>, ' + attrid;
                    set_str += ' fillOpacity: ';
                    set_str += JXG.Options.opacityLevel + ', hasInnerPoints:true, scalable:true>>; ';
                    break;

                case JXG.GENTYPE_TEXT:
                    set_str = assign + 'text(' + pn(step.args.x) + ', ' + pn(step.args.y) + ', ' + step.args.str + ') <<';
                    set_str += attrid + ' name: \'' + step.dest_id + '\'>>; ' + step.dest_id + '.setText(' + step.args.str;
                    set_str += '); ';
                    reset_str = 'delete ' + step.dest_id + '; ';
                    break;

                case JXG.GENTYPE_POLYGON:
                    set_str = assign + 'polygon(';

                    for (i = 0; i < step.src_ids.length; i++) {
                        set_str += step.src_ids[i];
                        if (i != step.src_ids.length - 1)
                            set_str += ', ';
                    }

                    set_str += ') <<borders: <<ids: [ \'';

                    for (i = 0; i < step.dest_sub_ids.length; i++) {
                        set_str += step.dest_sub_ids[i];
                        if (i < step.dest_sub_ids.length - 1)
                            set_str += '\', \'';
                    }

                    set_str += '\' ]>>, ' + attrid + ' fillOpacity: ' + JXG.Options.opacityLevel + ' >>; ';
                    reset_str = 'delete ' + step.dest_id + '; ';
                    break;

                case JXG.GENTYPE_REGULARPOLYGON:
                    set_str = assign + 'regularpolygon(' + step.src_ids[0] + ', ' + step.src_ids[1] + ', ';
                    set_str += step.args.corners + ') <<borders: <<ids: [ ';

                    for (i = 0; i < step.args.corners; i++) {
                        set_str += '\'' + step.dest_sub_ids[i] + '\'';
                        if (i != step.args.corners - 1)
                            set_str += ', ';
                        reset_str = 'delete ' + step.dest_sub_ids[i] + '; ' + reset_str;
                    }

                    set_str += ' ]>>, vertices: <<ids: [ ';

                    for (i = 0; i < step.args.corners - 2; i++) {
                        set_str += '\'' + step.dest_sub_ids[i + parseInt(step.args.corners)] + '\'';
                        if (i != step.args.corners - 3)
                            set_str += ', ';
                        reset_str = 'delete ' + step.dest_sub_ids[i + parseInt(step.args.corners)] + '; ' + reset_str;
                    }

                    set_str += ' ]>>, ' + attrid + ' fillOpacity: ' + JXG.Options.opacityLevel + ' >>; ';
                    reset_str = 'delete ' + step.dest_id + '; ' + reset_str;
                    break;

                case JXG.GENTYPE_SECTOR:
                    set_str = assign + 'sector(' + step.src_ids[0] + ', ' + step.src_ids[1] + ', ' + step.src_ids[2];
                    set_str += ') <<';
                    set_str += attrid + ' name: \'' + step.dest_id + '\', fillOpacity: ' + JXG.Options.opacityLevel;
                    set_str += '>>; ';
                    reset_str = 'delete ' + step.dest_id + '; ';
                    break;

                case JXG.GENTYPE_ANGLE:
                    set_str = assign + 'angle(' + step.src_ids[0] + ', ' + step.src_ids[1] + ', ' + step.src_ids[2];
                    set_str += ') <<radiuspoint: << id: \'' + step.dest_sub_ids[0] + '\', name: \'' + step.dest_sub_ids[0];
                    set_str += '\'>>, pointsquare: <<id: \'' + step.dest_sub_ids[1] + '\', name: \'' + step.dest_sub_ids[1];
                    set_str += '\'>>, dot: <<id: \'' + step.dest_sub_ids[2] + '\', name: \'' + step.dest_sub_ids[2];
                    set_str += '\'>>, ';
                    set_str += attrid + ' fillOpacity: ' + JXG.Options.opacityLevel + '>>; ';
                    reset_str = 'delete ' + step.dest_id + '; delete ' + step.dest_sub_ids[2] + '; delete ';
                    reset_str += step.dest_sub_ids[1];
                    reset_str += '; delete ' + step.dest_sub_ids[0] + '; ';
                    break;

                case JXG.GENTYPE_PLOT:
                    set_str = assign + step.args.plot_type + '(' + step.args.func + ') <<';

                    if (step.args.isPolar)
                        set_str += 'curveType: \'polar\', ';

                    set_str += attrid + ' name:\'' + step.dest_id + '\'>>; ';
                    reset_str = 'delete ' + step.dest_id + '; ';
                    break;

                case JXG.GENTYPE_SLIDER:
                    set_str = assign + 'slider([' + pn(step.args.x1) + ', ' + pn(step.args.y1) + '], [' + pn(step.args.x2);
                    set_str += ', ' + pn(step.args.y2) + '], [' + pn(step.args.start) + ', ' + pn(step.args.ini) + ', ';
                    set_str += pn(step.args.end) + ']) <<' + attrid + ' name: \'' + step.dest_id + '\', baseline: <<id: \'';
                    set_str += step.dest_sub_ids[0] + '\', name: \'' + step.dest_sub_ids[0] + '\'>>, highline: <<id: \'';
                    set_str += step.dest_sub_ids[1] + '\', name: \'' + step.dest_sub_ids[1] + '\'>>, point1: <<id: \'';
                    set_str += step.dest_sub_ids[2] + '\', name: \'' + step.dest_sub_ids[2] + '\'>>, point2: <<id: \'';
                    set_str += step.dest_sub_ids[3] + '\', name: \'' + step.dest_sub_ids[3] + '\'>>, label: <<id: \'';
                    set_str += step.dest_sub_ids[4] + '\', name: \'' + step.dest_sub_ids[4] + '\'>>>>; ';

                    reset_str = 'delete ' + step.dest_id + '; delete ' + step.dest_sub_ids[4] + '; delete ';
                    reset_str += step.dest_sub_ids[3] + '; delete ' + step.dest_sub_ids[2] + '; delete ';
                    reset_str += step.dest_sub_ids[1] + '; delete ';
                    reset_str += step.dest_sub_ids[0] + '; ';
                    break;

                case JXG.GENTYPE_DELETE:

                    arr = [];
                    ctx_set_str = [];
                    ctx_reset_str = [];

                    for (i = 0; i < step.args.steps.length; i++) {
                        if (step_log[step.args.steps[i]].type > 50) {
                            arr = this.generateJCodeMeta(step_log[step.args.steps[i]], board);
                        } else {
                            arr = this.generateJCode(step_log[step.args.steps[i]], board, step_log);
                        }

                        if (arr[2].trim() !== '') {
                            set_str = arr[2] + set_str;
                        }
                        if (JXG.isFunction(arr[3])) {
                            ctx_set_str.unshift(arr[3]);
                        }
                        if (arr[0].trim() !== '') {
                            reset_str += arr[0];
                        }
                        if (JXG.isFunction(arr[1])) {
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

                            if (step2.type == JXG.GENTYPE_COPY) {

                                for (i = 0; i < step2.args.map.length; i++)
                                    for (j = 0; j < step.args.map.length; j++)
                                        if (step2.args.map[i].copy == step.args.map[j].orig)
                                            step2.args.map[i].copy = step.args.map[j].copy;

                                step2 = JXG.SketchReader.replaceStepDestIds(step2, step2.args.map);
                            } else
                                step2 = JXG.SketchReader.replaceStepDestIds(step2, step.args.map);

                            copy_log.push(step2);
                        }
                    }

                    for (i = 0; i < copy_log.length; i++) {

                        if (copy_log[i].type > 50)
                            arr = this.generateJCodeMeta(copy_log[i], board);
                        else
                            arr = this.generateJCode(copy_log[i], board, step_log);

                        if (arr[0].trim() !== '')
                            set_str += arr[0];
                        if (JXG.isFunction(arr[1]))
                            ctx_set_str.push(arr[1]);
                        if (arr[2].trim() !== '')
                            reset_str = arr[2] + reset_str;
                        if (JXG.isFunction(arr[3]))
                            ctx_reset_str.unshift(arr[3]);
                    }

                    // Apply the offset-translation to the free points of the copy

                    if (step.args.dep_copy) {

                        for (i = 0; i < step.args.map.length; i++) {
                            if (getObject(step.args.map[i].orig).elementClass == JXG.OBJECT_CLASS_POINT) {
                                set_str += step.args.map[i].copy;
                                set_str += '.X = function() { return (' + step.args.map[i].orig + '.X() - ';
                                set_str += pn(step.args.x) + '); }; ';
                                set_str += step.args.map[i].copy;
                                set_str += '.Y = function() { return (' + step.args.map[i].orig + '.Y() - ';
                                set_str += pn(step.args.y) + '); }; ';
                            }
                        }

                    } else {

                        for (i = 0; i < step.args.free_points.length; i++) {
                            xstart = getObject(step.args.free_points[i].orig).coords.usrCoords[1];
                            ystart = getObject(step.args.free_points[i].orig).coords.usrCoords[2];

                            set_str += step.args.free_points[i].copy + '.X = function() { return ';
                            set_str += pn(xstart - step.args.x) + '; }; ';
                            set_str += step.args.free_points[i].copy + '.Y = function() { return ';
                            set_str += pn(ystart - step.args.y) + '; }; ';
                            set_str += step.args.free_points[i].copy + '.free(); ';
                        }
                    }

                    for (j = 0; j < step.args.map.length; j++) {
                        el = getObject(step.args.map[j].orig);

                        // Check if a radius-defined circle should be copied
                        if (el.type == JXG.OBJECT_TYPE_CIRCLE && el.point2 == null) {
                            // Make the radius of the circle copy depend on the original circle's radius
                            set_str += step.args.map[j].copy + '.setRadius(function () { return ';
                            set_str += step.args.map[j].orig + '.radius(); }); ';
                        }
                    }

                    break;

                case JXG.GENTYPE_TRANSLATE:

                    xstart = getObject(step.src_ids[0]).coords.usrCoords[1];
                    ystart = getObject(step.src_ids[0]).coords.usrCoords[2];

                    set_str = 'point(' + pn(xstart - step.args.x) + ', ' + pn(ystart - step.args.y) + ') <<id: \'';
                    set_str += step.dest_sub_ids[0] + '\'>>; ';
                    set_str += 'circle(' + step.dest_sub_ids[0] + ', 1) <<id: \'' + step.dest_sub_ids[1];
                    set_str += '\', fillOpacity: ' + JXG.Options.opacityLevel + ', visible: true>>; ';

                    if (step.args.fids.length == 1)
                        step.args.func = step.args.fids[0] + '.radius()';
                    else
                        step.args.func = 'dist(' + step.args.fids[0] + ', ' + step.args.fids[1] + ')';

                    set_str += step.dest_sub_ids[1] + '.setRadius(function() { return ' + step.args.func + '; }); ';

                    if (step.args.migrate != 0)
                        set_str += '$board.migratePoint(' + step.dest_sub_ids[0] + ', ' + step.args.migrate + '); ';
                    else
                        reset_str += 'delete ' + step.dest_sub_ids[0] + '; ';

                    reset_str = 'delete ' + step.dest_sub_ids[1] + '; ' + reset_str;

                    break;

                case JXG.GENTYPE_TRANSFORM:

                    set_str = step.dest_sub_ids[0] + ' = transform(' + step.args.tmat + ') <<type: \'generic\'>>; ';
                    set_str += 'point(' + step.src_ids[0] + ', ' + step.dest_sub_ids[0] + ') <<id: \'' + step.dest_id;
                    set_str += '\', visible: true>>; ';

                    reset_str = 'delete ' + step.dest_id + '; ';
                    reset_str += 'delete ' + step.dest_sub_ids[0] + '; ';

                    break;

                case JXG.GENTYPE_MOVEMENT:
                    if (step.args.obj_type == JXG.OBJECT_TYPE_LINE) {
                        set_str = step.src_ids[0] + '.move([' + pn(step.args.coords[0].usrCoords[0]) + ', ';
                        set_str += pn(step.args.coords[0].usrCoords[1]) + ', ' + pn(step.args.coords[0].usrCoords[2]) + ']); ';
                        reset_str = step.src_ids[0] + '.move([' + step.args.zstart[0] + ', ' + step.args.xstart[0] + ', ';
                        reset_str += step.args.ystart[0] + ']); ';

                        set_str += step.src_ids[1] + '.move([' + pn(step.args.coords[1].usrCoords[0]) + ', ';
                        set_str += pn(step.args.coords[1].usrCoords[1]) + ', ' + pn(step.args.coords[1].usrCoords[2]) + ']); ';
                        reset_str += step.src_ids[1] + '.move([' + step.args.zstart[1] + ', ' + step.args.xstart[1] + ', ';
                        reset_str += step.args.ystart[1] + ']); ';

                    } else if (step.args.obj_type == JXG.OBJECT_TYPE_CIRCLE) {
                        set_str = step.src_ids[0] + '.move([' + pn(step.args.coords[0].usrCoords[1]) + ', ';
                        set_str += pn(step.args.coords[0].usrCoords[2]) + ']); ';
                        reset_str = step.src_ids[0] + '.move([' + step.args.xstart + ', ' + step.args.ystart + ']); ';

                        if (step.args.has_point2) {
                            set_str += step.src_ids[1] + '.move([' + pn(step.args.coords[1].usrCoords[1]) + ', ';
                            set_str += pn(step.args.coords[1].usrCoords[2]) + ']); ';
                            reset_str += step.src_ids[1] + '.move([' + step.args.old_p2x + ', ' + step.args.old_p2y;
                            reset_str += ']); ';
                        }

                    } else if (step.args.obj_type == JXG.OBJECT_TYPE_GLIDER) {
                        set_str = step.src_ids[0] + '.setPosition(' + pn(step.args.position) + '); ';
                        reset_str = step.src_ids[0] + '.setPosition(' + step.args.xstart + '); ';

                    } else if (step.args.obj_type == JXG.OBJECT_TYPE_POLYGON) {
                        set_str = reset_str = "";

                        for (i = 0; i < step.src_ids.length; i++) {
                            set_str += step.src_ids[i] + '.move([' + pn(step.args.coords[i].usrCoords[1]) + ', ';
                            set_str += pn(step.args.coords[i].usrCoords[2]) + ']); ';
                            reset_str += step.src_ids[i] + '.move([' + step.args.xstart[i] + ', ' + step.args.ystart[i];
                            reset_str += ']); ';
                        }
                    } else {
                        set_str = step.src_ids[0] + '.move([' + pn(step.args.coords[0].usrCoords[1]) + ', ';
                        set_str += pn(step.args.coords[0].usrCoords[2]) + ']); ';
                        reset_str = step.src_ids[0] + '.move([' + step.args.xstart + ', ' + step.args.ystart + ']); ';
                    }

                    break;

                default:
                    return;
            }

            return [ set_str, ctx_set_str, reset_str, ctx_reset_str ];
        },

        replaceStepDestIds: function (step, id_map) {
            var i, j, copy_ids = [];

            for (i = 0; i < id_map.length; i++) {
                copy_ids.push(id_map[i].copy);

                if (step.dest_id == id_map[i].orig)
                    step.dest_id = id_map[i].copy;

                for (j = 0; j < step.dest_sub_ids.length; j++) {
                    if (step.dest_sub_ids[j] == id_map[i].orig) {
                        step.dest_sub_ids[j] = id_map[i].copy;
                    }
                }

                for (j = 0; j < step.src_ids.length; j++) {
                    if (step.src_ids[j] == id_map[i].orig) {
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
        },

        areEqualArrays: function(obj1, obj2) {

            if (obj1.length != obj2.length)
                return false;

            for (var i=0; i<obj1.length; i++)
                if (!JXG.Draw.areEqual(obj1[i], obj2[i]))
                    return false;

            return true;
        },

        areEqualObjects: function(obj1, obj2) {

            for (var el1 in obj1)
                if (obj1.hasOwnProperty(el1))
                    if (!JXG.Draw.areEqual(obj1[el1], obj2[el1]))
                        return false;

            for (var el2 in obj2)
                if (obj2.hasOwnProperty(el2))
                    if (!JXG.Draw.areEqual(obj2[el2], obj1[el2]))
                        return false;

            return true;
        },

        areEqual: function(obj1, obj2) {

            if (JXG.isArray2(obj1)) {
                if (JXG.isArray2(obj2))
                    return JXG.Draw.areEqualArrays(obj1, obj2);
                else
                    return false;
            }

            if (JXG.isArray2(obj2))
                return false;

            if (JXG.isObject(obj1)) {
                if (JXG.isObject(obj2))
                    return JXG.Draw.areEqualObjects(obj1, obj2);
                else
                    return false;
            }

            if (JXG.isObject(obj2))
                return false;

            return obj1 === obj2;
        },

        readSketch: function (str, board) {
            var i, j, arr, json_obj, unzipped, meta, constr;

            unzipped = new JXG.Util.Unzip(JXG.Util.Base64.decodeAsArray(str)).unzip();

            if (!JXG.exists(unzipped[0])) {
                return '';
            }

            unzipped = JXG.Util.utf8Decode(unzipped[0][0]);
            constr = JSON.parse(unzipped);

            for (i = 0; i < constr.length - 1; i++) {

                if (constr[i].type == 0)
                    continue;

                // fix for files created with the beta version
                if (constr[i].type == JXG.GENTYPE_CTX_VISIBILITY && constr[i].args.isGrid) {
                    //constr[i] = { type: 0, src_ids: [], dest_sub_ids: [], dest_id: 0 };
                    continue;
                }

                if (constr[i].type == JXG.GENTYPE_GRID) {
                    //constr[i] = { type: 0, src_ids: [], dest_sub_ids: [], dest_id: 0 };
                    continue;
                }
                // end of fix
/*
                if (constr[i].type == 100) // Obsolete fix
                    constr[i].type = JXG.GENTYPE_MOVEMENT;

                if (constr[i].type == JXG.GENTYPE_MOVEMENT) {

                    for (j=i+1; j<constr.length-1; j++) {
                        if (constr[j].type == JXG.GENTYPE_MOVEMENT && JXG.Draw.areEqual(constr[i].src_ids,
                            constr[j].src_ids)) {
                            constr[i] = { type: 0, src_ids: [], dest_sub_ids: [], dest_id: 0 };
                            break;
                        }
                    }

                    if (j < constr.length-1)
                        continue;
                }
*/
                if (constr[i].type == 27) // Obsolete fix
                    constr[i].type = JXG.GENTYPE_DELETE;

                if (constr[i].type == 31) // Obsolete fix
                    constr[i].type = JXG.GENTYPE_TRANSLATE;

                if (constr[i] > 50)
                    arr = this.generateJCodeMeta(constr[i], board);
                else
                    arr = this.generateJCode(constr[i], board, constr);

                board.jc.parse(arr[0], true);
            }

            meta = constr.pop();

            // not yet :(
            //if (meta.axisVisible)
            //if (meta.gridVisible)

            arr = meta.boundingBox; // bounding box
            board.setBoundingBox(arr);

            // these might be important in the future
            //GUI.transformation = meta.transformation; // transformation matrices (rotations, ...)
            //GUI.restore_state = meta.restoreState; // restore states

            board.options.grid.snapToGrid = !meta.snapToGrid;
            board.options.point.snapToGrid = !meta.snapToGrid;
            board.options.point.snapToPoints = !meta.snapToPoints;

            return '';
        }
    },

    Draw: {

        recordStepMeta: function (step, evaluate) {},

        /**
         * This function computes the distance between two points.
         * The points can have the type JXG.Coords or JXG.Point.
         * @param coord_or_point1
         * @param coord_or_point2
         */
        dist: function (coord_or_point1, coord_or_point2) {

            var usr1 = [], usr2 = [];

            if (coord_or_point1.coords != null) {
                usr1.push(coord_or_point1.coords.usrCoords[1]);
                usr1.push(coord_or_point1.coords.usrCoords[2]);
            } else if (coord_or_point1.usrCoords != null) {
                usr1.push(coord_or_point1.usrCoords[1]);
                usr1.push(coord_or_point1.usrCoords[2]);
            } else
                console.log("inconsistency in dist");

            if (coord_or_point2.coords != null) {
                usr2.push(coord_or_point2.coords.usrCoords[1]);
                usr2.push(coord_or_point2.coords.usrCoords[2]);
            } else if (coord_or_point2.usrCoords != null) {
                usr2.push(coord_or_point2.usrCoords[1]);
                usr2.push(coord_or_point2.usrCoords[2]);
            } else
                console.log("inconsistency in dist");

            return (usr1[0] - usr2[0]) * (usr1[0] - usr2[0]) + (usr1[1] - usr2[1]) * (usr1[1] - usr2[1]);
        },

        /**
         *    This function finds visible objects in the board hitted by the submitted coords
         *    (within the desired sensitivity),
         *  with an elementClass which IS included in class_in_arr and a type which is NOT
         *  included in type_ex_arr.
         *  As soon as #count objects have been found, the function returns.
         *  If invisible objects shall also be included, the
         *  boolean variable invisible has to be set.
         */
        findHittedObjs: function (coords, board, sensitive_area, class_in_arr, type_ex_arr, count, invisible) {

            var hasPoint = board.options.precision.hasPoint, els = [];

            if (typeof invisible == 'undefined')
                invisible = false;

            board.options.precision.hasPoint = sensitive_area;

            for (var el in board.objects) {

                if (board.objects.hasOwnProperty(el)) {
                    // Private objects shall not be counted
                    if (board.objects[el].visProp.priv && board.objects[el].visProp.priv === true)
                        continue;

                    if (typeof type_ex_arr != 'undefined'
                        // Excluded types shall not be counted
                        && JXG.collectionContains(type_ex_arr, board.objects[el].type))
                        continue;

                    if (board.objects[el].hasPoint && (board.objects[el].visProp['visible'] || invisible)
                        && JXG.collectionContains(class_in_arr, board.objects[el].elementClass)) {

                        if (sensitive_area === 0
                            || board.objects[el].hasPoint(coords.scrCoords[1], coords.scrCoords[2])) {
                            els.push(board.objects[el]);
                            if (typeof count != 'undefined' && count == els.length)
                                break;
                        }
                    }
                }
            }

            board.options.precision.hasPoint = hasPoint;
            return els;
        },

        /**
         *    Function which finds board objects hitted by the point segment ranging
         *    from indices [seg_start, seg_end].
         *     @array The hitted objects
         */
        findHittedObjsBySegment: function (point_segment, seg_start, seg_end, board, sensitive_area, class_in_arr, type_ex_arr, count) {

            var c, dir, pt, obj = [];

            if (typeof count == 'undefined')
                c = Infinity;
            else
                c = count;

            if (seg_start > seg_end) {
                dir = -1;
            } else
                dir = 1;

            if (seg_start >= point_segment.length)
                seg_start = point_segment.length - 1;

            if (seg_end >= point_segment.length)
                seg_end = point_segment.length - 1;

            pt = seg_start;

            do {
                obj = obj.concat(JXG.Draw.findHittedObjs(point_segment[pt], board, sensitive_area,
                    class_in_arr, type_ex_arr));
                pt += dir;

            } while (obj.length < c && dir * pt < dir * seg_end);

            return JXG.uniqueArray(obj);
        },

        /**
         * Counts how many data points are in the board objects range within the sensitive area
         * @param {Array} data Array with JXG.Coords
         * @param {JXG.GeometryElement} obj
         * @param {Number} sensitive_area The tolerance range
         * @param {JXG.Board} board The board object
         * @returns {Number} the amount of data points in range
         */
        countContainedPoints: function (data, obj, sensitive_area, board) {

            var count = 0, hasPoint = board.options.precision.hasPoint;
            board.options.precision.hasPoint = sensitive_area;

            if (obj.hasPoint) {
                for (var i = 0; i < data.length; i++)
                    if (obj.hasPoint(data[i].scrCoords[1], data[i].scrCoords[2]))
                        count++;
            }

            board.options.precision.hasPoint = hasPoint;
            return count;
        },

        /**
         * Find a point in the reference (array), which is closest
         * to the given point's usrCoords and in range of the sensitive area.
         * @return {JXG.Point} point from the reference array or null
         */
        findPointNextTo: function (point, reference, sensitive_area) {

            var i, p, r, dist2, min = Infinity, pp = null;

            if (JXG.exists(point.coords))
                p = point.coords;
            else
                p = point;

            for (i = 0; i < reference.length; i++) {

                if (reference[i].coords != null)
                    r = reference[i].coords;
                else
                    r = reference[i];

                dist2 = (p.scrCoords[1] - r.scrCoords[1]) * (p.scrCoords[1] - r.scrCoords[1])
                    + (p.scrCoords[2] - r.scrCoords[2]) * (p.scrCoords[2] - r.scrCoords[2]);

                if (dist2 < min && (dist2 < sensitive_area || sensitive_area === 0)) {
                    min = dist2;
                    pp = reference[i];
                }
            }

            return pp;
        },

        /**
         * Adaption of ShortStraw algorithms, see Wolin, Eoff, Hammond, Wollin:
         * "ShortStraw: A simple and effective corner finder for polylines",
         * EUROGRAPHICS 2008, pp. 33-40.
         * Some improvements of "Xiong, LaViola: "Revisiting ShortStraw -
         * Improving Corner Finding in Sketch-Based Interfaces" are included
         * @param {Array} points Array of {@link JXG.Coords}
         * @param {JXG.Board} board
         */
        shortStraw: function (points, board, vis) {
            var S, i,
                localPoints = points.slice(0), // Local copy
                resampled = [],
                corners = [],
                cornersCoords = [],
                straws = [],
                WINDOW = 3,
                MEDIAN_THRESHOLD = 0.95,
                LINE_THRESHOLD = 1.0,
                VISUALIZE = false;

            if (typeof vis != 'undefined')
                VISUALIZE = (vis === true);

            // Find the horizontal bounding box of the curve
            var determineResampleSpacing = function (points) {
                var len = points.length,
                    p, i, MAX = Number.POSITIVE_INFINITY,
                    bbox = [MAX, MAX, -MAX, -MAX],
                    x, y, diag;

                for (i = 0; i < len; i++) {
                    points[i].catchIdx = i;      // Remember original index
                    p = points[i].scrCoords;
                    if (p[1] < bbox[0]) {
                        bbox[0] = p[1];          // left
                    }
                    if (p[1] > bbox[2]) {
                        bbox[2] = p[1];          // top
                    }
                    if (p[2] < bbox[1]) {
                        bbox[1] = p[2];          // right
                    }
                    if (p[2] > bbox[3]) {
                        bbox[3] = p[2];          // bottom
                    }
                }
                x = bbox[2] - bbox[0];
                y = bbox[3] - bbox[1];
                diag = Math.sqrt(x * x + y * y);
                return diag / 40.0;
            };

            var resamplePoints = function (points, S, board) {
                var D = 0.0, i, d, x, y, q;
                /*
                 if (VISUALIZE) {
                 for (i=0;i<points.length; i++) {
                 board.create('point', points[i].usrCoords, {fixed:true, withLabel:false, size:1, color:'blue'});
                 }
                 }
                 */
                resampled.push(points[0]);             // Add first point
                for (i = 1; i < points.length; i++) {
                    d = points[i - 1].distance(JXG.COORDS_BY_SCREEN, points[i]);
                    if (D + d >= S) {
                        x = points[i - 1].scrCoords[1] +
                            (S - D) * (points[i].scrCoords[1] - points[i - 1].scrCoords[1]) / d;
                        y = points[i - 1].scrCoords[2] +
                            (S - D) * (points[i].scrCoords[2] - points[i - 1].scrCoords[2]) / d;
                        q = new JXG.Coords(JXG.COORDS_BY_SCREEN, [x, y], board);
                        q.catchIdx = points[i].catchIdx;             // Remember original position
                        resampled.push(q);
                        points.splice(i, 0, q);     // Insert q at position i
                        D = 0.0;
                    } else {
                        D += d;
                    }
                }
                resampled.push(points[points.length - 1]);  // Add last point
                /*
                 if (VISUALIZE) {
                 for (i=0;i<resampled.length; i++) {
                 board.create('point', resampled[i].usrCoords, {fixed:true, withLabel:false, size:1, color:'red'});
                 }
                 }
                 */
            };

            var getCorners = function (points, board) {
                var len = points.length,
                    i, t, locMin, locMini;

                corners.push(0);                // The first point is always a corner
                for (i = WINDOW; i < len - WINDOW; i++) {
                    straws[i] = points[i - WINDOW].distance(JXG.COORDS_BY_SCREEN, points[i + WINDOW]);
                }
                t = JXG.Math.Statistics.median(straws) * MEDIAN_THRESHOLD;

                for (i = WINDOW; i < len - WINDOW; i++) {
                    if (straws[i] < t) {
                        locMin = Number.POSITIVE_INFINITY;
                        locMini = i;
                        while (i < len - WINDOW && straws[i] < t) {
                            if (straws[i] < locMin) {
                                locMin = straws[i];
                                locMini = i;
                            }
                            i++;
                        }
                        corners.push(locMini);
                    }
                }
                corners.push(len - 1);            // The last point is a corner
                postProcessCorners(points, board);

            };

            var postProcessCorners = function (points, board) {
                var cnt, i, c1, c2, newCorner,
                    count = 0, maxCount = points.length, len, d;

                do {
                    cnt = true;
                    for (i = 1; i < corners.length; i++) {
                        c1 = corners[i - 1];
                        c2 = corners[i];
                        if (!isLine(points, c1, c2, LINE_THRESHOLD)) {
                            newCorner = halfwayCorner(c1, c2);
                            if (newCorner > c1 && newCorner < c2) {
                                corners.splice(i, 0, newCorner);
                                cnt = false;
                                if (VISUALIZE && false) {
                                    board.create('point', points[corners[i]].usrCoords,
                                        {fixed:true, withLabel:false,
                                            size:4, color:'blue'});
                                }
                            }

                            count++;
                            if (count >= maxCount) {
                                return;
                            }
                        }
                    }
                } while (!cnt);

                for (i = 1; i < corners.length - 1; i++) {
                    c1 = corners[i - 1];
                    c2 = corners[i + 1];
                    if (isLine(points, c1, c2, LINE_THRESHOLD)) {
                        corners.splice(i, 1);
                        i--;
                    }
                }

                // Try to detect, if the curve is closed.
                // This is the case if the first and the last corner
                // have screen distance oif less than 30.
                len = corners.length;
                if (len > 2) {
                    d = points[corners[0]].distance(JXG.COORDS_BY_SCREEN, points[corners[len - 1]]);
                    if (d < 30) {
                        corners.pop();
                    }
                }
            };

            var isLine = function (points, a, b, threshold) {
                var d = points[a].distance(JXG.COORDS_BY_SCREEN, points[b]),
                    i, pathDist = 0.0;

                for (i = a; i < b - 1; i++) {
                    pathDist += points[i].distance(JXG.COORDS_BY_SCREEN, points[i + 1]);
                }
                return (d > pathDist * threshold);
            };

            var halfwayCorner = function (a, b) {
                var quart = Math.floor((b - a) / 4),
                    minVal = Number.POSITIVE_INFINITY,
                    mini, i;

                for (i = a + quart; i < b - quart; i++) {
                    if (straws[i] < minVal) {
                        minVal = straws[i];
                        mini = i;
                    }
                }
                return mini;
            };

            S = determineResampleSpacing(localPoints);
            resamplePoints(localPoints, S, board);
            getCorners(resampled, board);
            for (i = 0; i < corners.length; i++) {
                cornersCoords.push(resampled[corners[i]]);
            }
            if (VISUALIZE) {
                for (i = 0; i < cornersCoords.length; i++) {
                    board.create('point', cornersCoords[i].usrCoords,
                        {fixed:true, name:i, withLabel:true, size:6,
                            label:{offsets:[-10, -10]},
                            strokeColor:'blue', fillColor:'none'});
                }
            }
            return cornersCoords;
        },

        /**
         * Find corners in an array of {@link JXG.Coords}. Invokes JXG.Draw.shortStraw().
         * @param {Array} points Array of {@link JXG.Coords}. This object will be updated and
         * will contain equidistant points during the algorithm.
         * @param {JXG.Board} board board object
         * @return {Array} Array of {@link JXG.Coords} of corners in points array.
         */
        findCorners: function (points, board, vis) {
            return JXG.Draw.shortStraw(points, board, vis);
        },

        removeLine: function (line, board) {
            for (var el in line.ancestors)
                if (line.ancestors.hasOwnProperty(el))
                    board.removeObject(line.ancestors[el]);

            board.removeObject(line);
        },

        /**
         * Checks if the two board points with the id1 and id2
         * are part of an already existing line on the board.
         * @param {String} id1 Id of a point
         * @param {String} id2 Id of a point
         * @return {JXG.Line} line which contains the two points or null if no such line exists.
         */
        findLine2Points: function (id1, id2, board) {

            var epsilon = JXG.Math.eps / 10;

            for (var el in board.objects) {
                if (board.objects.hasOwnProperty(el)) {
                    if (board.objects[el].elementClass == JXG.OBJECT_CLASS_LINE) {

                        var sk = board.objects[el].stdform[0] * board.objects[id1].coords.usrCoords[0];

                        sk += board.objects[el].stdform[1] * board.objects[id1].coords.usrCoords[1];
                        sk += board.objects[el].stdform[2] * board.objects[id1].coords.usrCoords[2];

                        if (Math.abs(sk) < epsilon) {

                            sk = board.objects[el].stdform[0] * board.objects[id2].coords.usrCoords[0];

                            sk += board.objects[el].stdform[1] * board.objects[id2].coords.usrCoords[1];
                            sk += board.objects[el].stdform[2] * board.objects[id2].coords.usrCoords[2];

                            if (Math.abs(sk) < epsilon)
                                return board.objects[el];
                        }
                    }
                }
            }

            return null;
        },

        visualize: function (points) {

            var i, n = points.length;

            if (points[0] != points[n - 1])
                board.create('line', [
                    [points[n - 1].usrCoords[1], points[n - 1].usrCoords[2]],
                    [points[0].usrCoords[1], points[0].usrCoords[2]]
                ], {straightFirst:false, straightLast:false});

            for (i = 0; i < n - 1; i++)
                board.create('line', [
                    [points[i].usrCoords[1], points[i].usrCoords[2]],
                    [points[i + 1].usrCoords[1], points[i + 1].usrCoords[2]]
                ], {straightFirst:false, straightLast:false});
        },

        /**
       	 * Checks if a board point already exists,
       	 * which has the same coords, ancenstors and dependencies as the submitted point,
       	 * but is not the same.
       	 *
       	 * @param {JXG.Point} point The point to be checked
       	 * @return {JXG.Point} an equal board point or null if none could be found
       	 */
       	pointAlreadyExists: function(board, point) {
       
       		var el, an, equal;
       
       		for (el in board.objects) {
       			if (board.objects.hasOwnProperty(el)) {
       
       				equal = true;
       
       				if (board.objects[el].elementClass == JXG.OBJECT_CLASS_POINT && board.objects[el] != point) {
       
       					for (an in board.objects[el].ancestors)
       						if (board.objects[el].ancestors.hasOwnProperty(an)) {
       							if (!JXG.collectionContains(point.ancestors, board.objects[el].ancestors[an])) {
       								equal = false;
       								break;
       							}
       						}
       
       					if (equal) {
       						for (an in point.ancestors)
       							if (point.ancestors.hasOwnProperty(an)) {
       								if (!JXG.collectionContains(board.objects[el].ancestors, point.ancestors[an])) {
       									equal = false;
       									break;
       								}
       							}
       					}
       
       					if (equal) {
       						equal = (Math.abs(point.coords.usrCoords[1] - board.objects[el].coords.usrCoords[1])
       							+ Math.abs(point.coords.usrCoords[2] - board.objects[el].coords.usrCoords[2]) < 0.1);
       					}
       
       					if (equal) {
       						return board.objects[el];
       					}
       				}
       			}
       		}
       
       		return null;
       	},

        /*
         * Sorts points such that points with lower x-values
         * come first. If the x values are equal, sort the points
         * such that those with smaller y values come first.
         */
        sortXY: function (points) {

            var tmp, i, j;

            for (i = 0; i < points.length; i++) {
                for (j = i + 1; j < points.length; j++) {

                    if (points[j].usrCoords[1] < points[i].usrCoords[1]
                        || (points[j].usrCoords[1] == points[i].usrCoords[1]
                        && points[j].usrCoords[2] < points[i].usrCoords[2])) {

                        tmp = points[j];
                        points[j] = points[i];
                        points[i] = tmp;
                    }
                }
            }
        },

        /**
         * Computes and return the points, which define the convex hull of a given points array.
         * Reference: http://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Convex_hull/Monotone_chain
         * @param points -- an array containing JXG.points
         * @param vis -- a boolean which reflects if the convex hull shall be visualized
         */
        convexHull: function (points, vis) {
            var cross = function (O, A, B) {
                return ((A.usrCoords[1] - O.usrCoords[1]) * (B.usrCoords[2] - O.usrCoords[2])
                    - (A.usrCoords[2] - O.usrCoords[2]) * (B.usrCoords[1] - O.usrCoords[1]));
            };
            var i, t, k = 0, H = [];

            JXG.Draw.sortXY(points); // Remember: this changes the points array!

            for (i = 0; i < points.length; i++) {
                while (k >= 2 && cross(H[k - 2], H[k - 1], points[i]) <= 0)
                    k--;
                H[k++] = points[i];
            }

            for (i = points.length - 2, t = k + 1; i >= 0; i--) {
                while (k >= t && cross(H[k - 2], H[k - 1], points[i]) <= 0)
                    k--;
                H[k++] = points[i];
            }

            H.length = k;

            if (typeof vis != 'undefined' && vis)
                JXG.Draw.visualize(H);

            return H;
        },

        /**
       	 * This function generates all possible k-tupels
       	 * from the submitted points array and returns
       	 * the tupels as an array of tupel-arrays
       	 * @param points
       	 * @param k
       	 */
       	buildTupels: function (points, k, respectSorting) {

       		var start, i, j, points2, tupels = [], ret = [];

       		if (k === 0 || points.length < k)
       			return ret;

       		if (k == 1) {
       			for (i=0; i<points.length; i++)
       				ret.push([ points[i] ]);
       			return ret;
       		}

       		if (typeof respectSorting == 'undefined')
       			respectSorting = true;

       		for (i=0; i<points.length; i++) {
       			points2 = [];

       			if (respectSorting)
       				start = i+1;
       			else
       				start = 0;

       			for (j=start; j<points.length; j++) {
       				if (j == i)
       					continue;
       				points2.push(points[j]);
       			}

       			tupels = JXG.Draw.buildTupels(points2, k-1, respectSorting);

       			for (j=0; j<tupels.length; j++) {
       				JXG.Draw.sortXY(tupels[j].push(points[i]));
       				ret.push(tupels[j]);

       				// If we really want the BEST FIT polygon, the next two lines have to be omitted,
       				// ==> but then the computation time increases too much ...

       				if (ret.length > 2)
       					return JXG.uniqueArray(ret);

       				// The question is: fast OR exact?
       			}
       		}

       		return JXG.uniqueArray(ret);
       	},

        /**
         * This function picks out of the points array a subset of k points,
         * such that the resulting polygon's area is maximal and contains
         * a pre-defined set of required points (see: drawTri/Quadrangle).
         * @param points
         * @param k
         */
        findMaxAreaPoints: function (board, points, k) {

            var i, j, a, pol, idx = -1, max = -Infinity, n = points.length;
            var required = [], optional = [], p = [], tupels;

            for (i = 0; i < n; i++)
                if (typeof points[i].elementClass != 'undefined')
                    required.push(points[i]);
                else
                    optional.push(points[i]);

            while (required.length > k)
                required.pop();

            if (required.length == k)
                return { req:required, status:true };

            if (optional.length < k - required.length) {
                console.log("too few optional points!");
                console.log("k: " + k);
                console.log("n: " + n);
                console.log("optional: " + optional.length);
                console.log("required: " + required.length);

                return { req:required, status:false };
            }

            if (optional.length > k - required.length) {

                console.log("too much optional points!");

                tupels = JXG.Draw.buildTupels(optional, k - required.length, true);

                for (i = 0; i < tupels.length; i++) {

                    p = [];
                    for (j = 0; j < tupels[i].length; j++)
                        p[j] = board.create('point', [ tupels[i][j].usrCoords[1], tupels[i][j].usrCoords[2] ],
                            {visible:false});
                    p.push(p[0]);

                    pol = board.create('polygon', p, {visible:false});

                    board.removeObject(pol);
                    for (j = 0; j < p.length; j++)
                        board.removeObject(p[j]);

                    a = pol.Area();

                    if (a >= max) {
                        max = a;
                        idx = i;
                    }
                }

                if (idx != -1)
                    for (i = 0; i < tupels[idx].length; i++)
                        required.push(tupels[idx][i]);
                else {
                    console.log("Tupels: " + tupels.length);
                    console.log("k: " + k);
                    console.log("n: " + n);
                    console.log("optional: " + optional.length);
                    console.log("required: " + required.length);
                    console.log("max area error");

                    return { req:[], status:false };
                }

            } else {
                for (i = 0; i < optional.length; i++)
                    required.push(optional[i]);
            }

            return { req:required, status:true };
        },

        /**
         * Fit data points to a reference array of board points.
         */
        fitPoints: function (data, reference) {

            var i, p, ret = [];

            if (reference.length === 0)
                return data;

            for (i = 0; i < reference.length; i++) {
                p = JXG.Draw.findPointNextTo(reference[i], data, 0);

                if (p == null) {
                    console.log('inconsistency in fitPoints: data.len is smaller than ref.len');
                    break;
                } else {
                    JXG.removeElementFromArray(data, p);
                    ret.push(reference[i]);
                }
            }

            for (i = 0; i < data.length; i++)
                ret.push(data[i]);

            return ret;
        },

        drawPoint: function (board, points) {
            var i, j, p, obj, i_obj = [], ex = [ JXG.OBJECT_TYPE_TEXT, JXG.OBJECT_TYPE_POLYGON ];
    
            obj = JXG.Draw.findHittedObjs(points[0], board, JXG.Options.sensitive_area,
                [ JXG.OBJECT_CLASS_LINE, JXG.OBJECT_CLASS_CIRCLE, JXG.OBJECT_CLASS_POINT,
                    JXG.OBJECT_CLASS_CURVE, JXG.OBJECT_CLASS_AREA, JXG.OBJECT_CLASS_OTHER ], ex);
    
            // Remove points and gliders from the hitted object array
    
            for (i=0; i<obj.length; i++) {
                if (obj[i].elementClass == JXG.OBJECT_CLASS_POINT) {
                    JXG.removeElementFromArray(obj, obj[i]);
                    i--;
                }
            }
    
            var step = {};
    
            step.args = {};
            step.src_ids = [];
            step.dest_sub_ids = [];
            step.dest_id = 0;
    
            if (obj.length <= 1) {
    
                step.dest_id = JXG.SketchReader.id();
                step.args.usrCoords = JXG.deepCopy(points[0].usrCoords);
    
                if (obj.length !== 0) {
                    step.type = JXG.GENTYPE_GLIDER;
                    step.args.fillColor = JXG.options.glider.fillColor;
                    step.src_ids = [ obj[0].id ];
                } else
                    step.type = JXG.GENTYPE_POINT;
    
                this.recordStepMeta(step, true);
    
            } else { // obj.length >= 2
    
                var name, nameHTML, i1, i2, intersect = [], dialog_needed = false,
                    zoom_sens_area = 2*JXG.Options.sensitive_area / (board.unitX + board.unitY);
    
                if (JXG.Options.device == 'tablet')
                    zoom_sens_area *= 2;
    
                board.suspendUpdate();
    
                // Build all possible intersections of pairs of hitted objects
    
                for (i=0; i<obj.length; i++) {
                    for (j=i+1; j<obj.length; j++) {
                        i1 = board.create('intersection', [obj[i], obj[j], 0],
                            {id: JXG.SketchReader.id(), fillColor: "#ffffff"});
                        i2 = board.create('intersection', [obj[i], obj[j], 1],
                            {id: JXG.SketchReader.id(), fillColor: "#ffffff"});
    
                        intersect.push([i1, i, j, 0]);
                        if (i1.coords.usrCoords[0] == i2.coords.usrCoords[0]
                            && i1.coords.usrCoords[1] == i2.coords.usrCoords[1]
                            && i1.coords.usrCoords[2] == i2.coords.usrCoords[2])
                            board.removeObject(i2);
                        else
                            intersect.push([i2, i, j, 1]);
                    }
                }
    
                p = board.create('point', points[0].usrCoords);
    
                nameHTML = intersect[0][0].nameHTML;
                name = intersect[0][0].name;
    
                // Locate intersections which are close to the click / touch
                // and don't already exist as points in the construction ...
    
                for (i=0; i<intersect.length; i++) {
                    if (p.Dist(intersect[i][0]) < zoom_sens_area
                        && JXG.Draw.pointAlreadyExists(board, intersect[i][0]) == null) {
                        i_obj.push([i, intersect[i]]);
                        JXG.removeElementFromArray(intersect, intersect[i]);
                        i--;
                    }
                }
    
                board.removeObject(p);
    
                for (i=0; i<intersect.length; i++)
                    board.removeObject(intersect[i][0]);
    
                if (i_obj.length === 0 || i_obj.length > 1) {
                    dialog_needed = true;
                } else {
    
                    if (i_obj[0][0] !== 0) {
                        i_obj[0][1][0].nameHTML = nameHTML;
                        i_obj[0][1][0].setAttribute({name: name});
                        i_obj[0][1][0].label.content.setText(name);
                    }
    
                    step.type = JXG.GENTYPE_INTERSECTION;
    
                    step.src_ids = [ obj[i_obj[0][1][1]].id, obj[i_obj[0][1][2]].id ];
                    step.args.choice = i_obj[0][1][3];
                    step.args.fillColor = '#ffffff';
    
                    step.dest_id = i_obj[0][1][0].id;
    
                    this.recordStepMeta(step, false);
                }
    
                board.unsuspendUpdate();
    
                if (GUI && dialog_needed) {
    
                    var x, y, html;
    
                    if (i_obj.length > 0) {
                        html = GUI.Lang.std.drawIntersection + '<br><br>' + GUI.createIssHTML(i_obj, obj);
                    } else {
    
                        x = points[0].usrCoords[1];
                        y = points[0].usrCoords[2];
    
                        html = GUI.Lang.std.drawGlider + '<br><br>'
                            + GUI.createSelectHTML(obj,
                            '(function(id) { JXG.Draw.drawGlider(board.objects[id], '
                                + x + ', ' + y + ', board); })');
                    }
    
                    new GUI.Dialog('objectselect', html, GUI.Lang.std.placement, [0, 0], [0, 0], 0, GUI.iss_delight);
                }
            }
        },

        drawMidPoint: function (curvepoints) {

            if (curvepoints.length >= 2) {
                var step = { type:JXG.GENTYPE_MID, args:{ fillColor:'#ffffff'},
                    src_ids:[ curvepoints[0].id, curvepoints[curvepoints.length - 1].id],
                    dest_sub_ids:[], dest_id:JXG.SketchReader.id() };

                this.recordStepMeta(step, true);

                return step.dest_id;
            } else
                return 0;
        },

        drawReflection: function (board, points, curvepoints) {

            var i, lcount, pcount, lmax = 0, pmax = 0, lidx, pidx, obj;

            obj = JXG.Draw.findHittedObjsBySegment(points, points.length, points.length - points.length / 3,
                board, JXG.Options.sensitive_area, [ JXG.OBJECT_CLASS_LINE, JXG.OBJECT_CLASS_CIRCLE,
                    JXG.OBJECT_CLASS_POINT, JXG.OBJECT_CLASS_CURVE, JXG.OBJECT_CLASS_AREA,
                    JXG.OBJECT_CLASS_OTHER ], [ JXG.OBJECT_TYPE_TICKS, JXG.OBJECT_TYPE_TEXT ]);

            for (i = 0; i < obj.length; i++) {
                if (obj[i].elementClass == JXG.OBJECT_CLASS_LINE) {
                    if ((lcount = JXG.Draw.countContainedPoints(points, obj[i],
                        JXG.Options.sensitive_area, board)) > lmax) {
                        lmax = lcount;
                        lidx = i;
                    }

                } else if (obj[i].elementClass == JXG.OBJECT_CLASS_POINT) {
                    if ((pcount = JXG.Draw.countContainedPoints(points, obj[i],
                        JXG.Options.sensitive_area, board)) > pmax) {
                        pmax = pcount;
                        pidx = i;
                    }
                }
            }

            if (pmax === 0) { // no reflection point found
                if (lmax === 0) { // no reflection line found
                    return;
                } else
                    i = lidx;
            } else
                i = pidx;

            if (curvepoints.length === 0 ||
                (curvepoints.length == 1 && obj[i].elementClass == JXG.OBJECT_CLASS_POINT))
                return;

            var p, step = {};

            p = JXG.Draw.findPointNextTo(points[0], curvepoints, 0);

            step.args = {};
            step.dest_sub_ids = [];

            step.src_ids = [ p.id, obj[i].id ];
            step.dest_id = JXG.SketchReader.id();

            step.args.fillColor = '#ffffff';

            if (obj[i].elementClass == JXG.OBJECT_CLASS_LINE)
                step.type = JXG.GENTYPE_REFLECTION;
            else
                step.type = JXG.GENTYPE_MIRRORPOINT;

            this.recordStepMeta(step, true);
        },

        drawTangent: function (board, points) {

            var i, coords, corners = JXG.Draw.findCorners(points, board),
                l1, l2, p, px, py, obj, gls;

            if (corners.length < 4)
                return;

            l1 = board.create('line', [
                [corners[0].usrCoords[1], corners[0].usrCoords[2]],
                [corners[1].usrCoords[1], corners[1].usrCoords[2]]
            ]);

            l2 = board.create('line', [
                [corners[corners.length - 2].usrCoords[1],
                    corners[corners.length - 2].usrCoords[2]],
                [corners[corners.length - 1].usrCoords[1],
                    corners[corners.length - 1].usrCoords[2]]
            ]);

            for (i in corners) {
                if (corners.hasOwnProperty(i))
                    board.removeObject(corners[i]);
            }

            p = board.create('intersection', [l1, l2, 0]);

            px = p.coords.usrCoords[1];
            py = p.coords.usrCoords[2];

            JXG.Draw.removeLine(l1, board);
            JXG.Draw.removeLine(l2, board);

            board.removeObject(p);

            obj = JXG.Draw.findHittedObjsBySegment(points, 0, points.length, board,
                JXG.Options.sensitive_area, [ JXG.OBJECT_CLASS_CIRCLE, JXG.OBJECT_CLASS_CURVE ], [], 1);

            var step = {};

            step.type = JXG.GENTYPE_TANGENT;

            step.args = {};
            step.src_ids = [];
            step.dest_sub_ids = [];

            if (obj.length > 0) {

                step.src_ids = [ obj[0].id ];

                gls = JXG.Draw.findHittedObjsBySegment(points, 0, points.length, board,
                    JXG.Options.sensitive_area, [ JXG.OBJECT_CLASS_POINT ],
                    [ JXG.OBJECT_TYPE_POINT, JXG.OBJECT_TYPE_AXISPOINT, JXG.OBJECT_TYPE_CAS,
                        JXG.OBJECT_TYPE_INTERSECTION ]);

                if (gls.length === 0) {
                    p = board.create('point', [px, py]); // Glider position
                    p.setAttribute({fillColor:board.options.glider.fillColor});

                    if (obj[0].type == JXG.OBJECT_TYPE_CURVE)
                        coords = JXG.Math.Geometry.projectPointToCurve(p, obj[0], board);
                    else // Circle
                        coords = JXG.Math.Geometry.projectPointToCircle(p, obj[0], board);

                    board.removeObject(p);

                    step.args.create_point = true;
                    step.args.usrCoords = JXG.deepCopy(coords.usrCoords);
                    step.args.fillColor = board.options.glider.fillColor;

                    var pid = JXG.SketchReader.id();
                    step.dest_sub_ids = [ JXG.SketchReader.id(), JXG.SketchReader.id(), pid ];

                } else {

                    step.args.create_point = false;

                    var dist, idx = -1, min = Infinity;

                    for (i = 0; i < gls.length; i++) {

                        if (obj[0].type == JXG.OBJECT_TYPE_CURVE)
                            coords = JXG.Math.Geometry.projectPointToCurve(gls[i], obj[0], board);
                        else // Circle
                            coords = JXG.Math.Geometry.projectPointToCircle(gls[i], obj[0], board);

                        dist = (coords.usrCoords[1] - gls[i].coords.usrCoords[1])
                            * (coords.usrCoords[1] - gls[i].coords.usrCoords[1]);
                        dist += (coords.usrCoords[2] - gls[i].coords.usrCoords[2])
                            * (coords.usrCoords[2] - gls[i].coords.usrCoords[2]);

                        if (dist < min) {
                            idx = i;
                            min = dist;
                        }
                    }

                    if (idx >= 0) {
                        step.src_ids = [ gls[idx].id ];
                        step.dest_sub_ids = [ JXG.SketchReader.id(), JXG.SketchReader.id() ];

                    } else // no tangent point found
                        return;
                }

                step.dest_id = JXG.SketchReader.id();
                this.recordStepMeta(step, true);

            } // else // No circle found for tangent creation
        },

        drawParallel: function (board, points) {

            var i, j, start_obj, end_obj, objects, jxg_points = [], coords,
                sidx, eidx, count, first_point, p, pid, smax = 0, emax = 0;

            var step = {};

            step.args = {};
            step.src_ids = [];
            step.dest_sub_ids = [];

            start_obj = JXG.Draw.findHittedObjsBySegment(points, 0, points.length / 3, board,
                JXG.Options.sensitive_area, [ JXG.OBJECT_CLASS_LINE, JXG.OBJECT_CLASS_CIRCLE,
                    JXG.OBJECT_CLASS_POINT, JXG.OBJECT_CLASS_CURVE, JXG.OBJECT_CLASS_AREA,
                    JXG.OBJECT_CLASS_OTHER ], []);

            end_obj = JXG.Draw.findHittedObjsBySegment(points, points.length, points.length - points.length / 3,
                board, JXG.Options.sensitive_area, [ JXG.OBJECT_CLASS_LINE, JXG.OBJECT_CLASS_CIRCLE,
                    JXG.OBJECT_CLASS_POINT, JXG.OBJECT_CLASS_CURVE, JXG.OBJECT_CLASS_AREA,
                    JXG.OBJECT_CLASS_OTHER ],
                []);

            // Search for line objects in the segments and locate in each segment 
            // the ones which contain the most draft points

            for (i = 0; i < start_obj.length; i++) {
                if (start_obj[i].elementClass == JXG.OBJECT_CLASS_LINE) {
                    if ((count = JXG.Draw.countContainedPoints(points, start_obj[i],
                        JXG.Options.sensitive_area, board)) > smax) {
                        smax = count;
                        sidx = i;
                    }
                }
            }

            for (j = 0; j < end_obj.length; j++) {
                if (end_obj[j].elementClass == JXG.OBJECT_CLASS_LINE) {
                    if ((count = JXG.Draw.countContainedPoints(points, end_obj[j],
                        JXG.Options.sensitive_area, board)) > emax) {
                        emax = count;
                        eidx = j;
                    }
                }
            }

            // If the line with the most hits is found in the end_segment
            // - which means the parallel gesture has been done reversed -
            // then swap the object lists

            if (emax > smax) {
                start_obj = end_obj;

                i = eidx;
                first_point = true;

            } else if (smax > 0) {

                i = sidx;
                first_point = false;

            } else // No line hitted by any of the segments
                return;

            // Line has been found in the start region now search for existing points

            objects = JXG.Draw.findHittedObjsBySegment(points, 0, points.length, board,
                JXG.Options.sensitive_area, [ JXG.OBJECT_CLASS_LINE, JXG.OBJECT_CLASS_CIRCLE,
                    JXG.OBJECT_CLASS_POINT, JXG.OBJECT_CLASS_CURVE, JXG.OBJECT_CLASS_AREA,
                    JXG.OBJECT_CLASS_OTHER ], []);

            for (j = 0; j < objects.length; j++)
                if (objects[j].elementClass == JXG.OBJECT_CLASS_POINT)
                    jxg_points.push(objects[j]);

            if (jxg_points.length > 0) { // Existing point was found

                if (first_point)
                    pid = jxg_points[0].id;
                else
                    pid = jxg_points[jxg_points.length - 1].id;

                // Parallels should differ from the originating line
                coords = JXG.Math.Geometry.projectPointToLine(board.objects[pid], start_obj[i], board);
                if (Math.abs(coords.usrCoords[1] - board.objects[pid].coords.usrCoords[1]) < JXG.Math.eps
                    && Math.abs(coords.usrCoords[2] - board.objects[pid].coords.usrCoords[2]) < JXG.Math.eps)
                    jxg_points = [];
            }

            step.type = JXG.GENTYPE_PARALLEL;

            if (jxg_points.length === 0) {  // Choose the last draftpoint as attachment 
                // point for the parallel to be drawn

                if (first_point)
                    p = points[0];
                else
                    p = points[points.length - 1];

                pid = JXG.SketchReader.id();

                step.args.usrCoords = JXG.deepCopy(p.usrCoords);
                step.args.create_point = true;

                step.src_ids = [ start_obj[i].id ];
                step.dest_sub_ids = [ JXG.SketchReader.id(), pid ];

            } else {
                step.args.create_point = false;

                step.src_ids = [ start_obj[i].id, pid ];
                step.dest_sub_ids = [ JXG.SketchReader.id() ];
            }

            step.dest_id = JXG.SketchReader.id();

            this.recordStepMeta(step, true);
        },

        drawBisector: function (board, points, curvepoints) {

            var step;
            step = {};

            if (curvepoints.length == 3) {

                step.type = JXG.GENTYPE_BISECTOR;
                step.src_ids = [ curvepoints[0].id, curvepoints[2].id, curvepoints[1].id ];

                step.dest_sub_ids = [ JXG.SketchReader.id() ];
                step.dest_id = JXG.SketchReader.id();

            } else if (curvepoints.length == 2) {

                var line_id, line_obj = JXG.Draw.findLine2Points(curvepoints[0].id, curvepoints[1].id, board);

                step.type = JXG.GENTYPE_PERPENDICULAR_BISECTOR;
                step.src_ids = [ curvepoints[0].id, curvepoints[1].id ];

                step.args = {};

                if (line_obj != null) {
                    step.args.create_line = false;
                    step.src_ids.push(line_obj.id);
                    step.dest_sub_ids = [ JXG.SketchReader.id(), JXG.SketchReader.id() ];
                } else {
                    step.args.create_line = true;
                    line_id = JXG.SketchReader.id();
                    step.dest_sub_ids = [ JXG.SketchReader.id(), JXG.SketchReader.id(), line_id ];
                }

                step.args.fillColor = '#ffffff';
                step.dest_id = JXG.SketchReader.id();

            } else {

                var i, j, start_obj, end_obj;

                start_obj = JXG.Draw.findHittedObjsBySegment(points, 0, points.length / 3, board,
                    JXG.Options.sensitive_area, [ JXG.OBJECT_CLASS_LINE ], [ JXG.OBJECT_TYPE_TEXT ], 1);
                end_obj = JXG.Draw.findHittedObjsBySegment(points, points.length,
                    points.length - points.length / 3, board,
                    JXG.Options.sensitive_area, [ JXG.OBJECT_CLASS_LINE ], [ JXG.OBJECT_TYPE_TEXT ], 1);

                for (i = 0; i < start_obj.length; i++)
                    if (start_obj[i].elementClass == JXG.OBJECT_CLASS_LINE)
                        break;

                for (j = 0; j < end_obj.length; j++)
                    if (end_obj[j].elementClass == JXG.OBJECT_CLASS_LINE)
                        break;

                if (i < start_obj.length && j < end_obj.length && start_obj[i] != end_obj[j]) {

                    // Two different lines were hitted by the gesture

                    step.type = JXG.GENTYPE_BISECTORLINES;
                    step.src_ids = [ start_obj[i].id, end_obj[j].id ];

                    step.dest_sub_ids = [ JXG.SketchReader.id(), JXG.SketchReader.id(), JXG.SketchReader.id(),
                        JXG.SketchReader.id(), JXG.SketchReader.id(), JXG.SketchReader.id() ];
                    step.dest_id = 0;

                } else
                    return;
            }

            this.recordStepMeta(step, true);
        },

        drawNormal: function (board, points, curvepoints) {

            var i, idx, count, max = 0, obj, ex = [ JXG.OBJECT_TYPE_POLYGON ], corners, pid, p;

            obj = JXG.Draw.findHittedObjsBySegment(points, 0, points.length, board,
                JXG.Options.sensitive_area, [ JXG.OBJECT_CLASS_LINE,
                    JXG.OBJECT_CLASS_CIRCLE, JXG.OBJECT_CLASS_POINT, JXG.OBJECT_CLASS_CURVE,
                    JXG.OBJECT_CLASS_AREA, JXG.OBJECT_CLASS_OTHER ], ex);

            for (i = 0; i < obj.length; i++) {
                if (obj[i].elementClass == JXG.OBJECT_CLASS_LINE) {
                    if ((count = JXG.Draw.countContainedPoints(points, obj[i],
                        JXG.Options.sensitive_area, board)) > max) {
                        max = count;
                        idx = i;
                    }
                }
            }

            if (max === 0) //No valid object detected for normal/lot creation!
                return;

            var step = {};
            step.args = {};

            step.dest_sub_ids = [];
            step.dest_id = 0;

            step.type = JXG.GENTYPE_NORMAL;

            step.src_ids = [ obj[idx].id ];

            if (curvepoints.length !== 0) {

                p = JXG.Draw.findPointNextTo(points[0], curvepoints, JXG.Options.sensitive_area);

                if (p == null) { // no startpoint for the lot --> normal

                    corners = JXG.Draw.findCorners(points, board);
                    if (corners.length != 3) {
                        p = curvepoints[0]; // when do we need this? A.W.
                        /** Answer (H.V.) **/
                        // If we have more than one "knick" ... what to do?
                        // The normal/lot gesture is defined by exactly one "knick", if there are
                        // more ... it gets fuzzy -- so before the wrong knick gets chosen,
                        // just take the first hitted point as fallback solution ...
                        // And: by doing it this way, normals (with points far of the "knick") are
                        // always constructed correctly ...
                    } else {
                        p = JXG.Draw.findPointNextTo(corners[1], curvepoints, JXG.Options.sensitive_area);
                        if (p == null) {
                            p = curvepoints[0];
                        }
                    }
                }
                step.args.create_point = false;
                step.src_ids.push(p.id);
                step.dest_sub_ids = [ JXG.SketchReader.id() ];
            } else {
                corners = JXG.Draw.findCorners(points, board);
                if (corners.length >= 3) {
                    step.args.create_point = true;
                    step.args.usrCoords = JXG.deepCopy(corners[1].usrCoords);
                    pid = JXG.SketchReader.id();
                    step.dest_sub_ids = [ JXG.SketchReader.id(), pid ];
                } else {
                    return;
                }
            }

            step.dest_id = JXG.SketchReader.id();

            this.recordStepMeta(step, true);
        },

        drawGlider: function (object, px, py, board) {

            var coords, p = board.create('point', [1, px, py]);
            var step = {};

            if (object.elementClass == JXG.OBJECT_CLASS_LINE)
                coords = JXG.Math.Geometry.projectPointToLine(p, object, board);
            else if (object.elementClass == JXG.OBJECT_CLASS_CIRCLE)
                coords = JXG.Math.Geometry.projectPointToCircle(p, object, board);
            else if (object.elementClass == JXG.OBJECT_CLASS_CURVE)
                coords = JXG.Math.Geometry.projectPointToCurve(p, object, board);
            else
                coords = { usrCoords:[ 1, px, py ] };

            board.removeObject(p);

            step.type = JXG.GENTYPE_GLIDER;

            step.src_ids = [ object.id ];
            step.dest_sub_ids = [];

            step.dest_id = 0;

            step.args = {};
            step.args.usrCoords = JXG.deepCopy(coords.usrCoords);
            step.args.fillColor = JXG.options.glider.fillColor;

            step.dest_id = JXG.SketchReader.id();

            this.recordStepMeta(step, true);
        },

        drawIntersection: function (obj_id1, obj_id2, inter_select) {

            var step = {};
            step.type = JXG.GENTYPE_INTERSECTION;

            step.src_ids = [ obj_id1, obj_id2 ];

            step.args = {};
            step.args.choice = inter_select;
            step.args.fillColor = '#ffffff';

            step.dest_sub_ids = [];
            step.dest_id = JXG.SketchReader.id();

            this.recordStepMeta(step, true);
        },


        drawLine: function (points, curvepoints) {

            var p0 = null, p1 = null;

            var step = {};

            step.type = JXG.GENTYPE_LINE;
            step.args = {};
            step.src_ids = [];
            step.dest_sub_ids = [];
            step.dest_id = 0;

            step.args.create_point1 = step.args.create_point2 = false;
            step.args.first = step.args.last = true;

            if (curvepoints.length > 0) { // board points were hit by the draftcurve

                // Check for a ray / segment

                // Search for a traversed board point in the sensitive area
                // of the draftcurve's first point.

                p0 = JXG.Draw.findPointNextTo(points[0], curvepoints, 250 * JXG.Options.sensitive_area);
                if (p0 != null) {
                    curvepoints = JXG.removeElementFromArray(curvepoints, p0);
                    step.args.first = false;
                }

                // Search for a traversed board point in the sensitive area
                // of the draftcurve's last point.

                p1 = JXG.Draw.findPointNextTo(points[points.length - 1], curvepoints, 250 * JXG.Options.sensitive_area);
                if (p1 != null) {
                    curvepoints = JXG.removeElementFromArray(curvepoints, p1);
                    step.args.last = false;
                }

                // If no board points exist in the sensitive areas,
                // but there ARE still some (unmapped) traversed board points,
                // then take these board points to define a line, otherwise
                // choose the draftcurve's start- and endpoint as defining
                // points for the line.

                if (p0 == null) {
                    if (curvepoints.length > 0) {
                        p0 = curvepoints[0];
                        curvepoints = JXG.removeElementFromArray(curvepoints, p0);
                    } else {
                        p0 = points[0].usrCoords;
                    }
                }

                if (p1 == null) {
                    if (curvepoints.length > 0) {
                        p1 = curvepoints[curvepoints.length - 1];
                    } else {
                        p1 = points[points.length - 1].usrCoords;
                    }
                }

            } else { // no board points were hit by the draftcurve

                // Choose the draftcurve's start and endpoint
                // as defining points for the FREE line

                p0 = points[0].usrCoords;
                p1 = points[points.length - 1].usrCoords;
            }

            step.src_ids = [];
            step.dest_sub_ids = [];

            if (!p0.coords && !p1.coords) {

                step.args.create_point1 = step.args.create_point2 = true;

                step.args.p1 = [ p0[1] - 100000.0 * (p1[1] - p0[1]), p0[2] - 100000.0 * (p1[2] - p0[2]) ];
                step.args.p2 = [ 0, p1[1] - p0[1], p1[2] - p0[2] ];

                step.dest_sub_ids = [ JXG.SketchReader.id(), JXG.SketchReader.id() ];

            } else {

                if (!p0.coords) {
                    step.args.p1 = [0, p0[1] - p1.coords.usrCoords[1], p0[2] - p1.coords.usrCoords[2]];

                    step.args.create_point1 = true;
                    step.dest_sub_ids.push(JXG.SketchReader.id());

                    step.args.p2 = [p1[1], p1[2]];
                    step.src_ids.push(p1.id);
                } else {
                    step.args.p1 = [p0[1], p0[2]];
                    step.src_ids.push(p0.id);

                    if (!p1.coords) {
                        step.args.p2 = [0, p1[1] - p0.coords.usrCoords[1], p1[2] - p0.coords.usrCoords[2]];

                        step.args.create_point2 = true;
                        step.dest_sub_ids.push(JXG.SketchReader.id());
                    } else {
                        step.args.p2 = [p1[1], p1[2]];
                        step.src_ids.push(p1.id);
                    }
                }
            }

            step.dest_id = JXG.SketchReader.id();

            this.recordStepMeta(step, true);
        },

        drawPolygon: function (curvepoints) {

            var step = { type:JXG.GENTYPE_POLYGON, src_ids:[], args:{}, dest_sub_ids:[], dest_id:JXG.SketchReader.id() };

            for (var i = 0; i < curvepoints.length; i++) {
                step.src_ids.push(curvepoints[i].id);
                step.dest_sub_ids.push(JXG.SketchReader.id());
            }

            this.recordStepMeta(step, true);
        },

        drawCircle2Points: function (board, points, curvepoints) {

            var corners, p0 = null, p1 = null;

            if (curvepoints.length > 0) {
                p0 = JXG.Draw.findPointNextTo(points[0], curvepoints, 0);
            }

            corners = JXG.Draw.findCorners(points, board);

            if (curvepoints.length == 1 && p0 != null
                && JXG.Draw.dist(p0, corners[1]) < JXG.Draw.dist(p0, points[0])) {
                p0 = null;
            }

            if (p0 != null) {
                curvepoints = JXG.removeElementFromArray(curvepoints, p0);
            } else {
                p0 = points[0].usrCoords;
            }

            if (curvepoints.length > 0) {
                p1 = JXG.Draw.findPointNextTo(corners[1], curvepoints, 0);
            }

            if (p1 == null)
                p1 = points[points.length - 1].usrCoords;

            var step = {};
            step.args = {};
            step.src_ids = [];
            step.dest_sub_ids = [];
            step.dest_id = 0;

            step.type = JXG.GENTYPE_CIRCLE2POINTS;

            step.args.create_two_points = step.args.create_point = step.args.create_by_radius = false;

            if (!p0.coords) {

                if (p1 == null || !p1.coords) {
                    step.args.create_two_points = true;

                    step.args.x1 = p0[1];
                    step.args.y1 = p0[2];
                    step.args.x2 = p1[1];
                    step.args.y2 = p1[2];

                    step.dest_sub_ids = [ JXG.SketchReader.id(), JXG.SketchReader.id() ];
                } else {
                    step.args.create_point = true;

                    step.args.x = p0[1];
                    step.args.y = p0[2];

                    step.dest_sub_ids = [ JXG.SketchReader.id() ];
                    step.src_ids.push(p1.id);
                }

            } else {

                if (p1 == null || !p1.coords) {
                    step.args.create_by_radius = true;

                    step.args.r = (p1[1] - p0.coords.usrCoords[1]) * (p1[1] - p0.coords.usrCoords[1]);
                    step.args.r += ((p1[2] - p0.coords.usrCoords[2]) * (p1[2] - p0.coords.usrCoords[2]));
                    step.args.r = Math.sqrt(step.args.r);

                    step.src_ids.push(p0.id);

                } else {
                    step.src_ids.push(p0.id);
                    step.src_ids.push(p1.id);
                }
            }

            step.dest_id = JXG.SketchReader.id();
            this.recordStepMeta(step, true);
        },

        drawCircle: function (points, curvepoints) {

                var i, M = [], y = [], MT, B, c, z, xm, ym, r;
                var step = {};

                step.type = JXG.GENTYPE_CIRCLE;

                step.args = {};
                step.src_ids = [];
                step.dest_sub_ids = [];
                step.dest_id = 0;

                step.args.create_midpoint = step.args.create_point = step.args.create_by_radius = false;

                step.dest_sub_ids = [ JXG.SketchReader.id() ];
                step.dest_id = JXG.SketchReader.id();

                if (curvepoints.length == 1) {

                    var mid = points[0].usrCoords;

                    mid[1] += points[parseInt((points.length - 1) / 2)].usrCoords[1];
                    mid[2] += points[parseInt((points.length - 1) / 2)].usrCoords[2];

                    mid[1] /= 2;
                    mid[2] /= 2;

                    step.args.create_point = true;
                    step.args.usrCoords = JXG.deepCopy(mid);
                    step.src_ids = [ curvepoints[0].id ];

                } else if (curvepoints.length == 2) {
                    step.args.create_midpoint = true;
                    step.src_ids = [ curvepoints[0].id, curvepoints[1].id ];

                } else if (curvepoints.length == 3) {

                    JXG.Draw.drawOutcircle(curvepoints);
                    return;
                   
                } else if (curvepoints.length === 0) {

                    // Having constructed the points, we can fit a circle
                    // through the point set, consisting of n points.
                    // The (n times 3) matrix consists of
                    //      x_1, y_1, 1
                    //      x_2, y_2, 1
                    //          ...
                    //      x_n, y_n, 1
                    // where x_i, y_i is the position of point p_i

                    // The vector y of length n consists of
                    //      x_i*x_i+y_i*y_i
                    // for i=1,...n.

                    for (i = 0; i < points.length; i++) {
                        M.push([points[i].usrCoords[1], points[i].usrCoords[2], 1.0]);
                        y.push(M[i][0] * M[i][0] + M[i][1] * M[i][1]);
                    }

                    // Now, the general linear least-square fitting problem
                    //
                    //      min_z || M*z - y ||_2^2
                    // is solved by solving the system of linear equations
                    //      (M^T*M) * z = (M^T*y)
                    // with Gauss elimination.
                    //
                    // [ see: http://JSXGraph.uni-bayreuth.de/wiki/index.php/Least-squares_circle_fitting ]

                    MT = JXG.Math.transpose(M);
                    B = JXG.Math.matMatMult(MT, M);
                    c = JXG.Math.matVecMult(MT, y);

                    z = JXG.Math.Numerics.Gauss(B, c);

                    xm = z[0] * 0.5;
                    ym = z[1] * 0.5; // xm, ym : center of the circle

                    r = Math.sqrt(z[2] + xm * xm + ym * ym); // r: radius

                    step.args.create_by_radius = true;
                    step.args.x = xm;
                    step.args.y = ym;
                    step.args.r = r;

                } else {
                    JXG.Draw.drawPolygon(curvepoints);
                    return;
                }

                this.recordStepMeta(step, true);
        },

        drawOutcircle: function (curvepoints) {
            var step = {};

            step.type = JXG.GENTYPE_CIRCLE;

            step.args = {};
            step.args.create_midpoint = step.args.create_point = step.args.create_by_radius = false;

            step.dest_sub_ids = [ JXG.SketchReader.id() ];
            step.dest_id = JXG.SketchReader.id();

            step.src_ids = [ curvepoints[0].id, curvepoints[1].id, curvepoints[2].id ];

            this.recordStepMeta(step, true);

            if (GUI && GUI.dialog && GUI.dialog['objectselect'] != null)
                GUI.dialog['objectselect'].removeDialog();
        },

        drawTriangle: function (board, points, curvepoints) {

            var i, min_i, min, corners, pol, res, fitted_points, triangle_points = [], v = [];

            if (curvepoints.length > 3) {
                JXG.Draw.drawQuadrilateral(points, curvepoints);
                return;
            }

            corners = JXG.Draw.convexHull(JXG.Draw.findCorners(points, board), false);
            corners.pop();

            fitted_points = JXG.uniqueArray(JXG.Draw.fitPoints(corners, curvepoints));

            res = JXG.Draw.findMaxAreaPoints(board, fitted_points, 3);
            if (!res.status)
                return;

            fitted_points = res.req;

            while (fitted_points.length > 0) {
                min = -1;
                for (i = 0; i < fitted_points.length; i++) {
                    if (fitted_points[i].catchIdx < min || min == -1) {
                        min = fitted_points[i].catchIdx;
                        min_i = i;
                    } else if (fitted_points[i].catchIdx == min
                        && fitted_points[i].elementClass == JXG.OBJECT_CLASS_POINT)
                        min_i = i;
                }

                triangle_points.push(fitted_points[min_i]);
                fitted_points.splice(min_i, 1);
            }

            //console.log(triangle_points);

            for (i = 0; i < triangle_points.length; i++) {
                if (triangle_points[i].elementClass == JXG.OBJECT_CLASS_POINT) {
                    v.push(triangle_points[i]);
                } else {
                    v.push(board.create('point', triangle_points[i].usrCoords, {id:JXG.SketchReader.id()}));
                }
            }

            pol = board.create('polygon', [v[0], v[1], v[2]],
                {borders:{ids:[ JXG.SketchReader.id(), JXG.SketchReader.id(), JXG.SketchReader.id() ]}, id:JXG.SketchReader.id(),
                    fillOpacity:JXG.Options.opacityLevel,
                    hasInnerPoints:JXG.Options.polygon.hasInnerPoints, scalable:true});

            var step = {};
            step.type = JXG.GENTYPE_TRIANGLE;

            step.args = {};
            step.src_ids = [];
            step.dest_sub_ids = [];

            step.args.create_point = [ false, false, false ];
            step.args.coords = [];

            step.src_ids = [];
            step.dest_sub_ids = [];
            step.dest_id = pol.id;

            for (i = 0; i < pol.vertices.length - 1; i++) {
                if (!JXG.collectionContains(triangle_points, pol.vertices[i])) {
                    // the triangle point did not exist before
                    step.args.create_point[i] = true;
                    step.args.coords.push({ usrCoords:JXG.deepCopy(pol.vertices[i].coords.usrCoords) });
                    step.dest_sub_ids.push(pol.vertices[i].id);
                } else {
                    step.args.coords.push([]);
                    step.dest_sub_ids.push(0);
                    step.src_ids.push(pol.vertices[i].id);
                }
            }

            for (i = 0; i < pol.borders.length; i++)
                step.dest_sub_ids.push(pol.borders[i].id);

            this.recordStepMeta(step, false);
        },

        drawQuadrilateral: function (board, points, curvepoints) {

            var step = {};
            step.type = JXG.GENTYPE_QUADRILATERAL;

            step.args = {};

            step.src_ids = [];
            step.dest_sub_ids = [];
            step.dest_id = 0;

            if (curvepoints.length == 4) {

                step.args.create_point = [ false, false, false, false ];
                step.args.coords = [];
                step.src_ids = [];

                for (i = 0; i < 4; i++) {
                    step.args.coords.push([]);
                    step.src_ids.push(curvepoints[i].id);
                }

                step.dest_sub_ids = [ 0, 0, 0, 0, JXG.SketchReader.id(), JXG.SketchReader.id(), JXG.SketchReader.id(), JXG.SketchReader.id() ];
                step.dest_id = JXG.SketchReader.id();

                this.recordStepMeta(step, true);

            } else if (curvepoints.length > 4) {

                JXG.Draw.drawPolygon(curvepoints);

            } else {

                var i, min, min_i, corners, pol, res, fitted_points, square_points = [], v = [];

                corners = JXG.Draw.convexHull(JXG.Draw.findCorners(points, board));
                corners.pop();

                fitted_points = JXG.uniqueArray(JXG.Draw.fitPoints(corners, curvepoints));

                res = JXG.Draw.findMaxAreaPoints(board, fitted_points, 4);
                if (!res.status)
                    return;

                fitted_points = res.req;

                while (fitted_points.length > 0) {
                    min = -1;
                    for (i = 0; i < fitted_points.length; i++) {
                        if (fitted_points[i].catchIdx < min || min == -1) {
                            min = fitted_points[i].catchIdx;
                            min_i = i;
                        } else if (fitted_points[i].catchIdx == min
                            && fitted_points[i].elementClass == JXG.OBJECT_CLASS_POINT)
                            min_i = i;
                    }

                    square_points.push(fitted_points[min_i]);
                    fitted_points.splice(min_i, 1);
                }

                //console.log(square_points);

                for (i = 0; i < square_points.length; i++) {
                    if (square_points[i].elementClass == JXG.OBJECT_CLASS_POINT)
                        v[i] = square_points[i];
                    else
                        v[i] = board.create('point', square_points[i].usrCoords, {id:JXG.SketchReader.id()});
                }

                pol = board.create('polygon', [v[0], v[1], v[2], v[3]],
                    {borders:{ids:[ JXG.SketchReader.id(), JXG.SketchReader.id(), JXG.SketchReader.id(), JXG.SketchReader.id() ]}, id:JXG.SketchReader.id(),
                        fillOpacity:JXG.Options.opacityLevel,
                        hasInnerPoints:JXG.Options.polygon.hasInnerPoints, scalable:true});

                step.args.create_point = [ false, false, false, false ];
                step.args.coords = [];

                step.src_ids = [];
                step.dest_sub_ids = [];
                step.dest_id = pol.id;

                for (i = 0; i < pol.vertices.length - 1; i++) {
                    if (!JXG.collectionContains(square_points, pol.vertices[i])) {
                        // the square point did not exist before
                        step.args.create_point[i] = true;
                        step.args.coords.push({ usrCoords:JXG.deepCopy(pol.vertices[i].coords.usrCoords) });
                        step.dest_sub_ids.push(pol.vertices[i].id);
                        step.src_ids.push(pol.vertices[i].id);
                    } else {
                        step.args.coords.push([]);
                        step.dest_sub_ids.push(0);
                        step.src_ids.push(pol.vertices[i].id);
                    }
                }

                for (i = 0; i < pol.borders.length; i++)
                    step.dest_sub_ids.push(pol.borders[i].id);

                this.recordStepMeta(step, false);
            }
        },

        drawRegularPolygon: function (curvepoints) {

            var i, step = { type:JXG.GENTYPE_REGULARPOLYGON, args:{ corners:JXG.Options.lastRegPolCorners },
                dest_sub_ids:[], src_ids:[ curvepoints[0].id, curvepoints[1].id ]};

            for (i = 0; i < JXG.Options.lastRegPolCorners; i++)
                step.dest_sub_ids.push(JXG.SketchReader.id());
            for (i = 0; i < JXG.Options.lastRegPolCorners - 2; i++)
                step.dest_sub_ids.push(JXG.SketchReader.id());

            step.dest_id = JXG.SketchReader.id();

            this.recordStepMeta(step, true);
        },
        
        drawCircleSector: function (cpoint_ids) {
            this.recordStepMeta({ type: JXG.GENTYPE_SECTOR, src_ids: [ cpoint_ids[0], cpoint_ids[2], cpoint_ids[1] ],
                dest_sub_ids: [], dest_id: JXG.SketchReader.id() }, true);
    
            if (GUI && GUI.dialog && GUI.dialog['objectselect'] != null)
                GUI.dialog['objectselect'].removeDialog();
        },
    
        drawAngleSector: function (cpoint_ids) {
            this.recordStepMeta({ type: JXG.GENTYPE_ANGLE, src_ids: [ cpoint_ids[0], cpoint_ids[2], cpoint_ids[1] ],
                dest_sub_ids: [ JXG.SketchReader.id(), JXG.SketchReader.id(), JXG.SketchReader.id() ], dest_id: JXG.SketchReader.id() }, true);
    
            if (GUI && GUI.dialog && GUI.dialog['objectselect'] != null)
                GUI.dialog['objectselect'].removeDialog();
        },
    
        drawSlider: function (points) {
            this.recordStepMeta({ type: JXG.GENTYPE_SLIDER,
                dest_sub_ids: [ JXG.SketchReader.id(), JXG.SketchReader.id(), JXG.SketchReader.id(), JXG.SketchReader.id(), JXG.SketchReader.id() ], dest_id: JXG.SketchReader.id(),
                args: { x1: points[0].usrCoords[1], y1: points[0].usrCoords[2],
                    x2: points[1].usrCoords[1], y2: points[1].usrCoords[2],
    
                    start: $('div.dialog#slider input#start').attr('value'),
                    ini: $('div.dialog#slider input#ini').attr('value'),
                    end: $('div.dialog#slider input#end').attr('value') }}, true);
        },
    
        drawText: function (coords) {
    
            var pid = JXG.SketchReader.id();
            this.recordStepMeta({ type: JXG.GENTYPE_TEXT, src_ids: [], dest_sub_ids: [], dest_id: pid,
                args: {x: coords.usrCoords[1], y: coords.usrCoords[2], str: '\'Text\'' }}, true);

            return pid;
        }
    }
});
