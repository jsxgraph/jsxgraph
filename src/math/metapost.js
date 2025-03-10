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


    Metapost/Hobby curves, see e.g. https://bosker.wordpress.com/2013/11/13/beyond-bezier-curves/

    * Ported to Python for the project PyX. Copyright (C) 2011 Michael Schindler <m-schindler@users.sourceforge.net>
    * Ported to javascript from the PyX implementation (https://pyx-project.org/) by Vlad-X.
    * Adapted to JSXGraph and some code changes by Alfred Wassermann 2020.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.

    Internal functions of MetaPost
    This file re-implements some of the functionality of MetaPost
    (https://tug.org/metapost.html). MetaPost was developed by John D. Hobby and
    others. The code of Metapost is in the public domain, which we understand as
    an implicit permission to reuse the code here (see the comment at
    https://www.gnu.org/licenses/license-list.html)

    This file is based on the MetaPost version distributed by TeXLive:
    svn://tug.org/texlive/trunk/Build/source/texk/web2c/mplibdir revision 22737 #
    (2011-05-31)
*/

/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

/**
 * @fileoverview In this file the namespace Math.Metapost is defined which holds algorithms translated from Metapost
 * by D.E. Knuth and J.D. Hobby.
 */

import Type from "../utils/type.js";
import Mat from "./math.js";

/**
 * The JXG.Math.Metapost namespace holds algorithms translated from Metapost
 * by D.E. Knuth and J.D. Hobby.
 *
 * @name JXG.Math.Metapost
 * @exports Mat.Metapost as JXG.Math.Metapost
 * @namespace
 */
Mat.Metapost = {
    MP_ENDPOINT: 0,
    MP_EXPLICIT: 1,
    MP_GIVEN: 2,
    MP_CURL: 3,
    MP_OPEN: 4,
    MP_END_CYCLE: 5,

    UNITY: 1.0,
    // two: 2,
    // fraction_half: 0.5,
    FRACTION_ONE: 1.0,
    FRACTION_THREE: 3.0,
    ONE_EIGHTY_DEG: Math.PI,
    THREE_SIXTY_DEG: 2 * Math.PI,
    // EPSILON: 1e-5,
    EPS_SQ: 1e-5 * 1e-5,

    /**
     * @private
     */
    make_choices: function (knots) {
        var dely, h, k, delx, n, q, p, s, cosine, t, sine, delta_x, delta_y, delta, psi,
            endless = true;

        p = knots[0];
        do {
            if (!p) {
                break;
            }
            q = p.next;

            // Join two identical knots by setting the control points to the same
            // coordinates.
            // MP 291
            if (
                p.rtype > this.MP_EXPLICIT &&
                (p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y) < this.EPS_SQ
            ) {
                p.rtype = this.MP_EXPLICIT;
                if (p.ltype === this.MP_OPEN) {
                    p.ltype = this.MP_CURL;
                    p.set_left_curl(this.UNITY);
                }

                q.ltype = this.MP_EXPLICIT;
                if (q.rtype === this.MP_OPEN) {
                    q.rtype = this.MP_CURL;
                    q.set_right_curl(this.UNITY);
                }

                p.rx = p.x;
                q.lx = p.x;
                p.ry = p.y;
                q.ly = p.y;
            }
            p = q;
        } while (p !== knots[0]);

        // Find the first breakpoint, h, on the path
        // MP 292
        h = knots[0];
        while (endless) {
            if (h.ltype !== this.MP_OPEN || h.rtype !== this.MP_OPEN) {
                break;
            }
            h = h.next;
            if (h === knots[0]) {
                h.ltype = this.MP_END_CYCLE;
                break;
            }
        }

        p = h;
        while (endless) {
            if (!p) {
                break;
            }

            // Fill in the control points between p and the next breakpoint,
            // then advance p to that breakpoint
            // MP 299
            q = p.next;
            if (p.rtype >= this.MP_GIVEN) {
                while (q.ltype === this.MP_OPEN && q.rtype === this.MP_OPEN) {
                    q = q.next;
                }

                // Calculate the turning angles psi_ k and the distances d_{k,k+1};
                // set n to the length of the path
                // MP 302
                k = 0;
                s = p;
                n = knots.length;

                delta_x = [];
                delta_y = [];
                delta = [];
                psi = [null];

                // tuple([]) = tuple([[], [], [], [null]]);
                while (endless) {
                    t = s.next;
                    // None;
                    delta_x.push(t.x - s.x);
                    delta_y.push(t.y - s.y);
                    delta.push(this.mp_pyth_add(delta_x[k], delta_y[k]));
                    if (k > 0) {
                        sine = delta_y[k - 1] / delta[k - 1];
                        cosine = delta_x[k - 1] / delta[k - 1];
                        psi.push(
                            Math.atan2(
                                delta_y[k] * cosine - delta_x[k] * sine,
                                delta_x[k] * cosine + delta_y[k] * sine
                            )
                        );
                    }
                    k++;
                    s = t;
                    if (s === q) {
                        n = k;
                    }
                    if (k >= n && s.ltype !== this.MP_END_CYCLE) {
                        break;
                    }
                }
                if (k === n) {
                    psi.push(0);
                } else {
                    psi.push(psi[1]);
                }

                // Remove open types at the breakpoints
                // MP 303
                if (q.ltype === this.MP_OPEN) {
                    delx = q.rx - q.x;
                    dely = q.ry - q.y;
                    if (delx * delx + dely * dely < this.EPS_SQ) {
                        q.ltype = this.MP_CURL;
                        q.set_left_curl(this.UNITY);
                    } else {
                        q.ltype = this.MP_GIVEN;
                        q.set_left_given(Math.atan2(dely, delx));
                    }
                }
                if (p.rtype === this.MP_OPEN && p.ltype === this.MP_EXPLICIT) {
                    delx = p.x - p.lx;
                    dely = p.y - p.ly;
                    if (delx * delx + dely * dely < this.EPS_SQ) {
                        p.rtype = this.MP_CURL;
                        p.set_right_curl(this.UNITY);
                    } else {
                        p.rtype = this.MP_GIVEN;
                        p.set_right_given(Math.atan2(dely, delx));
                    }
                }
                this.mp_solve_choices(p, q, n, delta_x, delta_y, delta, psi);
            } else if (p.rtype === this.MP_ENDPOINT) {
                // MP 294
                p.rx = p.x;
                p.ry = p.y;
                q.lx = q.x;
                q.ly = q.y;
            }
            p = q;

            if (p === h) {
                break;
            }
        }
    },

    /**
     * Implements solve_choices form metapost
     * MP 305
     * @private
     */
    mp_solve_choices: function (p, q, n, delta_x, delta_y, delta, psi) {
        var aa, acc, vv, bb, ldelta, ee, k,
            s, ww, uu, lt, r, t, ff,
            theta, rt, dd, cc, ct_st,
            ct, st, cf_sf, cf, sf, i, k_idx,
            endless = true;

        ldelta = delta.length + 1;
        uu = new Array(ldelta);
        ww = new Array(ldelta);
        vv = new Array(ldelta);
        theta = new Array(ldelta);
        for (i = 0; i < ldelta; i++) {
            theta[i] = vv[i] = ww[i] = uu[i] = 0;
        }
        k = 0;
        s = p;
        r = 0;
        while (endless) {
            t = s.next;
            if (k === 0) {
                // MP 306
                if (s.rtype === this.MP_GIVEN) {
                    // MP 314
                    if (t.ltype === this.MP_GIVEN) {
                        aa = Math.atan2(delta_y[0], delta_x[0]);
                        ct_st = this.mp_n_sin_cos(p.right_given() - aa);
                        ct = ct_st[0];
                        st = ct_st[1];
                        cf_sf = this.mp_n_sin_cos(q.left_given() - aa);
                        cf = cf_sf[0];
                        sf = cf_sf[1];
                        this.mp_set_controls(p, q, delta_x[0], delta_y[0], st, ct, -sf, cf);
                        return;
                    }
                    vv[0] = s.right_given() - Math.atan2(delta_y[0], delta_x[0]);
                    vv[0] = this.reduce_angle(vv[0]);
                    uu[0] = 0;
                    ww[0] = 0;
                } else if (s.rtype === this.MP_CURL) {
                    // MP 315
                    if (t.ltype === this.MP_CURL) {
                        p.rtype = this.MP_EXPLICIT;
                        q.ltype = this.MP_EXPLICIT;
                        lt = Math.abs(q.left_tension());
                        rt = Math.abs(p.right_tension());
                        ff = this.UNITY / (3.0 * rt);
                        p.rx = p.x + delta_x[0] * ff;
                        p.ry = p.y + delta_y[0] * ff;
                        ff = this.UNITY / (3.0 * lt);
                        q.lx = q.x - delta_x[0] * ff;
                        q.ly = q.y - delta_y[0] * ff;
                        return;
                    }
                    cc = s.right_curl();
                    lt = Math.abs(t.left_tension());
                    rt = Math.abs(s.right_tension());
                    uu[0] = this.mp_curl_ratio(cc, rt, lt);
                    vv[0] = -psi[1] * uu[0];
                    ww[0] = 0;
                } else {
                    if (s.rtype === this.MP_OPEN) {
                        uu[0] = 0;
                        vv[0] = 0;
                        ww[0] = this.FRACTION_ONE;
                    }
                }
            } else {
                if (s.ltype === this.MP_END_CYCLE || s.ltype === this.MP_OPEN) {
                    // MP 308
                    aa = this.UNITY / (3.0 * Math.abs(r.right_tension()) - this.UNITY);
                    dd =
                        delta[k] *
                        (this.FRACTION_THREE - this.UNITY / Math.abs(r.right_tension()));
                    bb = this.UNITY / (3 * Math.abs(t.left_tension()) - this.UNITY);
                    ee =
                        delta[k - 1] *
                        (this.FRACTION_THREE - this.UNITY / Math.abs(t.left_tension()));
                    cc = this.FRACTION_ONE - uu[k - 1] * aa;
                    dd = dd * cc;
                    lt = Math.abs(s.left_tension());
                    rt = Math.abs(s.right_tension());
                    if (lt < rt) {
                        dd *= Math.pow(lt / rt, 2);
                    } else {
                        if (lt > rt) {
                            ee *= Math.pow(rt / lt, 2);
                        }
                    }
                    ff = ee / (ee + dd);
                    uu[k] = ff * bb;
                    acc = -psi[k + 1] * uu[k];
                    if (r.rtype === this.MP_CURL) {
                        ww[k] = 0;
                        vv[k] = acc - psi[1] * (this.FRACTION_ONE - ff);
                    } else {
                        ff = (this.FRACTION_ONE - ff) / cc;
                        acc = acc - psi[k] * ff;
                        ff = ff * aa;
                        vv[k] = acc - vv[k - 1] * ff;
                        ww[k] = -ww[k - 1] * ff;
                    }
                    if (s.ltype === this.MP_END_CYCLE) {
                        aa = 0;
                        bb = this.FRACTION_ONE;
                        while (endless) {
                            k -= 1;
                            if (k === 0) {
                                k = n;
                            }
                            aa = vv[k] - aa * uu[k];
                            bb = ww[k] - bb * uu[k];
                            if (k === n) {
                                break;
                            }
                        }
                        aa = aa / (this.FRACTION_ONE - bb);
                        theta[n] = aa;
                        vv[0] = aa;
                        // k_val = range(1, n);
                        // for (k_idx in k_val) {
                        // k = k_val[k_idx];
                        for (k_idx = 1; k_idx < n; k_idx++) {
                            vv[k_idx] = vv[k_idx] + aa * ww[k_idx];
                        }
                        break;
                    }
                } else {
                    if (s.ltype === this.MP_CURL) {
                        cc = s.left_curl();
                        lt = Math.abs(s.left_tension());
                        rt = Math.abs(r.right_tension());
                        ff = this.mp_curl_ratio(cc, lt, rt);
                        theta[n] = -(vv[n - 1] * ff) / (this.FRACTION_ONE - ff * uu[n - 1]);
                        break;
                    }
                    if (s.ltype === this.MP_GIVEN) {
                        theta[n] = s.left_given() - Math.atan2(delta_y[n - 1], delta_x[n - 1]);
                        theta[n] = this.reduce_angle(theta[n]);
                        break;
                    }
                }
            }
            r = s;
            s = t;
            k += 1;
        }

        // MP 318
        for (k = n - 1; k > -1; k--) {
            theta[k] = vv[k] - theta[k + 1] * uu[k];
        }

        s = p;
        k = 0;
        while (endless) {
            t = s.next;
            ct_st = this.mp_n_sin_cos(theta[k]);
            ct = ct_st[0];
            st = ct_st[1];
            cf_sf = this.mp_n_sin_cos(-psi[k + 1] - theta[k + 1]);
            cf = cf_sf[0];
            sf = cf_sf[1];
            this.mp_set_controls(s, t, delta_x[k], delta_y[k], st, ct, sf, cf);
            k++;
            s = t;
            if (k === n) {
                break;
            }
        }
    },

    /**
     * @private
     */
    mp_n_sin_cos: function (z) {
        return [Math.cos(z), Math.sin(z)];
    },

    /**
     * @private
     */
    mp_set_controls: function (p, q, delta_x, delta_y, st, ct, sf, cf) {
        var rt, ss, lt, sine, rr;
        lt = Math.abs(q.left_tension());
        rt = Math.abs(p.right_tension());
        rr = this.mp_velocity(st, ct, sf, cf, rt);
        ss = this.mp_velocity(sf, cf, st, ct, lt);

        // console.log('lt rt rr ss', lt, rt, rr, ss);
        if (p.right_tension() < 0 || q.left_tension() < 0) {
            if ((st >= 0 && sf >= 0) || (st <= 0 && sf <= 0)) {
                sine = Math.abs(st) * cf + Math.abs(sf) * ct;
                if (sine > 0) {
                    sine *= 1.00024414062;
                    if (p.right_tension() < 0) {
                        if (this.mp_ab_vs_cd(Math.abs(sf), this.FRACTION_ONE, rr, sine) < 0) {
                            rr = Math.abs(sf) / sine;
                        }
                    }
                    if (q.left_tension() < 0) {
                        if (this.mp_ab_vs_cd(Math.abs(st), this.FRACTION_ONE, ss, sine) < 0) {
                            ss = Math.abs(st) / sine;
                        }
                    }
                }
            }
        }
        p.rx = p.x + (delta_x * ct - delta_y * st) * rr;
        p.ry = p.y + (delta_y * ct + delta_x * st) * rr;
        q.lx = q.x - (delta_x * cf + delta_y * sf) * ss;
        q.ly = q.y - (delta_y * cf - delta_x * sf) * ss;
        p.rtype = this.MP_EXPLICIT;
        q.ltype = this.MP_EXPLICIT;
    },

    /**
     * @private
     */
    mp_pyth_add: function (a, b) {
        return Mat.hypot(a, b);
    },

    /**
     *
     * @private
     */
    mp_curl_ratio: function (gamma, a_tension, b_tension) {
        var alpha = 1.0 / a_tension,
            beta = 1.0 / b_tension;

        return Math.min(
            4.0,
            ((3.0 - alpha) * alpha * alpha * gamma + beta * beta * beta) /
            (alpha * alpha * alpha * gamma + (3.0 - beta) * beta * beta)
        );
    },

    /**
     * @private
     */
    mp_ab_vs_cd: function (a, b, c, d) {
        if (a * b === c * d) {
            return 0;
        }
        if (a * b > c * d) {
            return 1;
        }
        return -1;
    },

    /**
     * @private
     */
    mp_velocity: function (st, ct, sf, cf, t) {
        return Math.min(
            4.0,
            (2.0 + Math.sqrt(2) * (st - sf / 16.0) * (sf - st / 16.0) * (ct - cf)) /
            (1.5 * t * (2 + (Math.sqrt(5) - 1) * ct + (3 - Math.sqrt(5)) * cf))
        );
    },

    /**
     * @private
     * @param {Number} A
     */
    reduce_angle: function (A) {
        if (Math.abs(A) > this.ONE_EIGHTY_DEG) {
            if (A > 0) {
                A -= this.THREE_SIXTY_DEG;
            } else {
                A += this.THREE_SIXTY_DEG;
            }
        }
        return A;
    },

    /**
     *
     * @private
     * @param {Array} p
     * @param {Number} tension
     * @param {Boolean} cycle
     */
    makeknots: function (p, tension) {
        var i, len,
            knots = [];

        len = p.length;
        for (i = 0; i < len; i++) {
            knots.push({
                x: p[i][0],
                y: p[i][1],
                ltype: this.MP_OPEN,
                rtype: this.MP_OPEN,
                lx: false,
                rx: false,
                ly: tension,
                ry: tension,
                left_curl: function () {
                    return this.lx || 0;
                },
                right_curl: function () {
                    return this.rx || 0;
                },
                left_tension: function () {
                    return this.ly || 1;
                },
                right_tension: function () {
                    return this.ry || 1;
                },
                set_right_curl: function (v) {
                    this.rx = v || 0;
                },
                set_left_curl: function (v) {
                    this.lx = v || 0;
                }
            });
        }

        len = knots.length;
        for (i = 0; i < len; i++) {
            knots[i].next = knots[i + 1] || knots[i];
            knots[i].set_right_given = knots[i].set_right_curl;
            knots[i].set_left_given = knots[i].set_left_curl;
            knots[i].right_given = knots[i].right_curl;
            knots[i].left_given = knots[i].left_curl;
        }
        knots[len - 1].next = knots[0];

        return knots;
    },

    /**
     *
     * @param {Array} point_list
     * @param {Object} controls
     *
     * @returns {Array}
     */
    curve: function (point_list, controls) {
        var knots, len, i, ii,
            val, obj,
            isClosed = false,
            x = [],
            y = [];

        controls = controls || {
            tension: 1,
            direction: {},
            curl: {},
            isClosed: false
        };

        // Change default tension
        val = 1;
        if (controls.hasOwnProperty('tension')) {
            val = Type.evaluate(controls.tension);
        }

        knots = this.makeknots(point_list, val);

        len = knots.length;
        if (Type.exists(controls.isClosed) && Type.evaluate(controls.isClosed)) {
            isClosed = true;
        }

        if (!isClosed) {
            knots[0].ltype = this.MP_ENDPOINT;
            knots[0].rtype = this.MP_CURL;
            knots[len - 1].rtype = this.MP_ENDPOINT;
            knots[len - 1].ltype = this.MP_CURL;
        }

        // for (i in controls.direction) {
        //     if (controls.direction.hasOwnProperty(i)) {
        //         val = Type.evaluate(controls.direction[i]);
        //         if (Type.isArray(val)) {
        //             if (val[0] !== false) {
        //                 knots[i].lx = (val[0] * Math.PI) / 180;
        //                 knots[i].ltype = this.MP_GIVEN;
        //             }
        //             if (val[1] !== false) {
        //                 knots[i].rx = (val[1] * Math.PI) / 180;
        //                 knots[i].rtype = this.MP_GIVEN;
        //             }
        //         } else {
        //             knots[i].lx = (val * Math.PI) / 180;
        //             knots[i].rx = (val * Math.PI) / 180;
        //             knots[i].ltype = knots[i].rtype = this.MP_GIVEN;
        //         }
        //     }
        // }

        // for (i in controls.curl) {
        //     if (controls.curl.hasOwnProperty(i)) {
        //         val = Type.evaluate(controls.curl[i]);
        //         if (parseInt(i, 10) === 0) {
        //             knots[i].rtype = this.MP_CURL;
        //             knots[i].set_right_curl(val);
        //         } else if (parseInt(i, 10) === len - 1) {
        //             knots[i].ltype = this.MP_CURL;
        //             knots[i].set_left_curl(val);
        //         }
        //     }
        // }

        // Set individual point control values
        for (ii in controls) {
            if (controls.hasOwnProperty(ii)) {
                i = parseInt(ii, 10);
                if (isNaN(i) || i < 0 || i >= len) {
                    continue;
                }

                // Handle individual curl
                obj = controls[i];
                if (Type.exists(obj.type)) {
                    switch (obj.type) {
                        case 'curl':
                            val = Type.evaluate(obj.curl);
                            if (i === 0) {
                                knots[i].rtype = this.MP_CURL;
                                knots[i].set_right_curl(val);
                            } else if (i === len - 1) {
                                knots[i].ltype = this.MP_CURL;
                                knots[i].set_left_curl(val);
                            } else {
                                knots[i].ltype = this.MP_CURL;
                                knots[i].rtype = this.MP_CURL;
                                knots[i].lx = val;
                                knots[i].rx = val;
                            }
                            break;
                        }
                    }

                    // Handle individual directions
                    if (Type.exists(obj.direction)) {
                        val = Type.evaluate(obj.direction);
                        if (Type.isArray(val)) {
                            if (val[0] !== false) {
                                knots[i].lx = (val[0] * Math.PI) / 180;
                                knots[i].ltype = this.MP_GIVEN;
                            }
                            if (val[1] !== false) {
                                knots[i].rx = (val[1] * Math.PI) / 180;
                                knots[i].rtype = this.MP_GIVEN;
                            }
                        } else {
                            knots[i].lx = (val * Math.PI) / 180;
                            knots[i].rx = (val * Math.PI) / 180;
                            knots[i].ltype = knots[i].rtype = this.MP_GIVEN;
                        }
                    }

                    // Handle individual tension
                    if (Type.exists(obj.tension)) {
                        val = Type.evaluate(obj.tension);
                        if (Type.isArray(val)) {
                            if (val[0] !== false) {
                                knots[i].ly = Type.evaluate(val[0]);
                            }
                            if (val[1] !== false) {
                                knots[i].ry = Type.evaluate(val[1]);
                            }
                        } else {
                            knots[i].ly = val;
                            knots[i].ry = val;
                        }
                    }
                }
            }

            // Generate ths Bezier curve
            this.make_choices(knots);

            // Return the coordinates
            for (i = 0; i < len - 1; i++) {
                x.push(knots[i].x);
                x.push(knots[i].rx);
                x.push(knots[i + 1].lx);
                y.push(knots[i].y);
                y.push(knots[i].ry);
                y.push(knots[i + 1].ly);
            }
            x.push(knots[len - 1].x);
            y.push(knots[len - 1].y);

            if (isClosed) {
                x.push(knots[len - 1].rx);
                y.push(knots[len - 1].ry);
                x.push(knots[0].lx);
                y.push(knots[0].ly);
                x.push(knots[0].x);
                y.push(knots[0].y);
            }

            return [x, y];
        }
};

export default Mat.Metapost;
