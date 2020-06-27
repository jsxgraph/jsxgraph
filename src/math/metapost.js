/*
    Copyright 2008-2020
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
 utils/type
 math/math
 */

/**
 * @fileoverview In this file the namespace Math.Metapost is defined which holds algorithms translated from Metapost
 * by D.E. Knuth and J.D. Hobby.
 */

define(['jxg', 'utils/type', 'math/math'], function (JXG, Type, Mat) {

    "use strict";

    /**
     * The JXG.Math.Metapost namespace holds algorithms translated from Metapost
     * by D.E. Knuth and J.D. Hobby.
     *
     * @name JXG.Math.Metapost
     * @exports Mat.Metapost as JXG.Math.Metapost
     * @namespace
     */
    Mat.Metapost = {
        mp_endpoint: 0,
        mp_explicit: 1,
        mp_given: 2,
        mp_curl: 3,
        mp_open: 4,
        mp_end_cycle: 5,
        unity: 1.0,
        two: 2.0,
        fraction_half: 0.5,
        fraction_one: 1.0,
        fraction_three: 3.0,
        one_eighty_deg: Math.PI,
        three_sixty_deg: 2 * Math.PI,
        epsilon = 1e-5,
        eps_sq: epsilon * epsilon,

        make_choices: function (knots) {
            var dely, h, k, delx, n,
                q, p, s, cosine, t, sine,
                delta_x, delta_y, delta, psi;

            p = knots[0];
            do {
                if (!p) {
                    break;
                }
                q = p.next;

                // Join two identical knots by setting the control points to the same
                // coordinates.
                // MP 291
                if (p.rtype > mp_explicit &&
                    ((p.x - q.x) * (p.x - q.x)  + (p.y - q.y) * (p.y - q.y) < eps_sq)) {

                    p.rtype = mp_explicit;
                    if (p.ltype === mp_open) {
                        p.ltype = mp_curl;
                        p.set_left_curl(unity);
                    }

                    q.ltype = mp_explicit;
                    if (q.rtype === mp_open) {
                        q.rtype = mp_curl;
                        q.set_right_curl(unity);
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
            while (true) {
                if (h.ltype != mp_open || h.rtype != mp_open) {
                    break;
                }
                h = h.next;
                if (h == knots[0]) {
                    h.ltype = mp_end_cycle;
                    break;
                }
            }

            p = h;
            while (true) {
                if (!p) {
                  break;
                }

                // Fill in the control points between p and the next breakpoint,
                // then advance p to that breakpoint
                // MP 299
                q = p.next;
                if (p.rtype >= mp_given) {
                    while (q.ltype == mp_open && q.rtype == mp_open) {
                        q = q.next;
                    }

                    // Calculate the turning angles psi_ k and the distances d_{k,k+1};
                    // set n to the length of the path
                    // MP 302
                    k = 0;
                    s = p;
                    n = knots.length;

                    delta_x = [],
                    delta_y = [],
                    delta = [],
                    psi = [null];

                    // tuple([]) = tuple([[], [], [], [null]]);
                    while (true) {
                        t = s.next;
                        // None;
                        delta_x.push(t.x - s.x);
                        delta_y.push(t.y - s.y);
                        delta.push( this.mp_pyth_add(delta_x[k], delta_y[k]) );
                        if (k > 0) {
                            sine =   delta_y[k - 1] / delta[k - 1];
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
                        if (s == q) {
                            n = k;
                        }
                        if (k >= n && s.ltype != mp_end_cycle) {
                            break;
                        }
                    }
                    if (k == n) {
                        psi.push(0);
                    } else {
                        psi.push(psi[1]);
                    }

                    // Remove open types at the breakpoints
                    // MP 303
                    if (q.ltype == mp_open) {
                        delx = (q.rx - q.x);
                        dely = (q.ry - q.y);
                        if (delx * delx + dely * dely < eps_sq) {
                            q.ltype = mp_curl;
                            q.set_left_curl(unity);
                        } else {
                            q.ltype = mp_given;
                            q.set_left_given(Math.atan2(dely, delx));
                        }
                    }
                    if (p.rtype == mp_open && p.ltype == mp_explicit) {
                        delx = (p.x - p.lx);
                        dely = (p.y - p.ly);
                        if ((Math.pow(delx, 2) + Math.pow(dely, 2)) < eps_sq) {
                            p.rtype = mp_curl;
                            p.set_right_curl(unity);
                        } else {
                            p.rtype = mp_given;
                            p.set_right_given(Math.atan2(dely, delx));
                        }
                    }
                    this.mp_solve_choices(p, q, n, delta_x, delta_y, delta, psi);
                } else if (p.rtype == mp_endpoint) {
                    // MP 294
                    p.rx = p.x;
                    p.ry = p.y;
                    q.lx = q.x;
                    q.ly = q.y;
                }
                p = q;

                if (p == h) {
                    break;
                }
            }
        },

        /**
         * Implements solve_choices form metapost
         * MP 305
         */
        mp_solve_choices: function (p, q, n, delta_x, delta_y, delta, psi) {
            var aa, acc, vv, bb, ldelta, ee, k, s,
                ww, uu, lt, r, t, ff, theta, rt, dd, cc,
                ct_st, ct, st, cf_sf, cf, sf, i;

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
            while (true) {
                t = s.next;
                if (k == 0) {
                    // MP 306
                    if (s.rtype == mp_given) {
                        // MP 314
                        if (t.ltype == mp_given) {
                            aa = Math.atan2(delta_y[0], delta_x[0]);
                            ct_st = this.mp_n_sin_cos(p.right_given() - aa);
                            ct = ct_st[0];
                            st = ct_st[1];
                            cf_sf = this.mp_n_sin_cos(q.left_given() - aa);
                            cf = cf_sf[0];
                            sf = cf_sf[1];
                            this.mp_set_controls(p, q, delta_x[0], delta_y[0], st, ct, -sf, cf);
                            return;
                        } else {
                            vv[0] = s.right_given() - Math.atan2(delta_y[0], delta_x[0]);
                            vv[0] = this.reduce_angle(vv[0]);
                            uu[0] = 0;
                            ww[0] = 0;
                        }
                    } else if (s.rtype == mp_curl) {
                        // MP 315
                        if (t.ltype == mp_curl) {
                            p.rtype = mp_explicit;
                            q.ltype = mp_explicit;
                            lt = Math.abs(q.left_tension());
                            rt = Math.abs(p.right_tension());
                            ff = unity / (3.0 * rt);
                            p.rx = p.x + delta_x[0] * ff;
                            p.ry = p.y + delta_y[0] * ff;
                            ff = unity / (3.0 * lt);
                            q.lx = q.x - delta_x[0] * ff;
                            q.ly = q.y - delta_y[0] * ff;
                            return;
                        } else {
                            cc = s.right_curl();
                            lt = Math.abs(t.left_tension());
                            rt = Math.abs(s.right_tension());
                            uu[0] = this.mp_curl_ratio(cc, rt, lt);
                            vv[0] = -psi[1] * uu[0];
                            ww[0] = 0;
                        }
                    } else {
                        if (s.rtype == mp_open) {
                            uu[0] = 0;
                            vv[0] = 0;
                            ww[0] = fraction_one;
                        }
                    }
                } else {
                    if (s.ltype == mp_end_cycle || s.ltype == mp_open) {
                        // MP 308
                        aa = unity / (3.0 * Math.abs(r.right_tension()) - unity);
                        dd = delta[k] * (fraction_three - unity / Math.abs(r.right_tension()));
                        bb = unity / (3 * Math.abs(t.left_tension()) - unity);
                        ee = delta[k - 1] * (fraction_three - unity / Math.abs(t.left_tension()));
                        cc = fraction_one - uu[k - 1] * aa;
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
                        if (r.rtype == mp_curl) {
                            ww[k] = 0;
                            vv[k] = acc - psi[1] * (fraction_one - ff);
                        } else {
                            ff = (fraction_one - ff) / cc;
                            acc = acc - psi[k] * ff;
                            ff = ff * aa;
                            vv[k] = acc - vv[k - 1] * ff;
                            ww[k] = -ww[k - 1] * ff;
                        }
                        if (s.ltype == mp_end_cycle) {
                            aa = 0;
                            bb = fraction_one;
                            while (true) {
                                k -= 1;
                                if (k == 0) {
                                    k = n;
                                }
                                aa = vv[k] - aa * uu[k];
                                bb = ww[k] - bb * uu[k];
                                if (k == n) {
                                    break;
                                }
                            }
                            aa = aa / (fraction_one - bb);
                            theta[n] = aa;
                            vv[0] = aa;
                            // k_val = range(1, n);
                            // for (k_idx in k_val) {
                            for (var k=1; k<n; k++) {
                              // k = k_val[k_idx];
                              vv[k] = vv[k] + aa * ww[k];
                            }
                            break;
                        }
                    } else {
                        if (s.ltype == mp_curl) {
                            cc = s.left_curl();
                            lt = Math.abs(s.left_tension());
                            rt = Math.abs(r.right_tension());
                            ff = this.mp_curl_ratio(cc, lt, rt);
                            theta[n] = -(vv[n - 1] * ff) / (fraction_one - ff * uu[n - 1]);
                            break;
                        } else {
                            if (s.ltype == mp_given) {
                                theta[n] = s.left_given() - Math.atan2(delta_y[n - 1], delta_x[n - 1]);
                                theta[n] = this.reduce_angle(theta[n]);
                                break;
                            }
                        }
                    }
                }
                r = s;
                s = t;
                k += 1;
            }

            // MP 318
            for (k = n-1; k > -1; k--) {
                theta[k] = vv[k] - theta[k + 1] * uu[k];
            }

            s = p;
            k = 0;
            while (true) {
                t = s.next;
                ct_st = this.mp_n_sin_cos(theta[k]);
                ct = ct_st[0];
                st = ct_st[1];
                cf_sf = this.mp_n_sin_cos((-(psi[k + 1]) - theta[k + 1]));
                cf = cf_sf[0];
                sf = cf_sf[1];
                this.mp_set_controls(s, t, delta_x[k], delta_y[k], st, ct, sf, cf);
                k++;
                s = t;
                if (k == n) {
                  break;
                }
            }
        },

        mp_n_sin_cos: function (z) {
            return [Math.cos(z), Math.sin(z)];
        },

        mp_set_controls: function (p, q, delta_x, delta_y, st, ct, sf, cf) {
            var rt, ss, lt, sine, rr;
            lt = Math.abs(q.left_tension());
            rt = Math.abs(p.right_tension());
            rr = mp_velocity(st, ct, sf, cf, rt);
            ss = mp_velocity(sf, cf, st, ct, lt);

            // console.log('lt rt rr ss', lt, rt, rr, ss);
            if (p.right_tension() < 0 || q.left_tension() < 0) {
                if (st >= 0 && sf >= 0 || st <= 0 && sf <= 0) {
                    sine = Math.abs(st) * cf + Math.abs(sf) * ct;
                    if (sine > 0) {
                        sine *= 1.00024414062;
                        if (p.right_tension() < 0) {
                            if (this.mp_ab_vs_cd(Math.abs(sf), fraction_one, rr, sine) < 0) {
                                rr = abs(sf) / sine;
                            }
                        }
                        if (q.left_tension() < 0) {
                            if (this.mp_ab_vs_cd(Math.abs(st), fraction_one, ss, sine) < 0) {
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
            p.rtype = mp_explicit;
            q.ltype = mp_explicit;
        },

        mp_pyth_add: function (a, b) {
            return Math.sqrt((a * a + b * b));
        },

        mp_curl_ratio: function (gamma, a_tension, b_tension) {
            var alpha = 1.0 / a_tension,
                beta =  1.0 / b_tension;

            return Math.min (4.0,
                ((3.0 - alpha) * Math.pow(alpha, 2) * gamma + Math.pow(beta, 3)) /
                (Math.pow(alpha, 3) * gamma + (3.0 - beta) * Math.pow(beta, 2))
                );
        },

        mp_ab_vs_cd: function (a, b, c, d) {
            if (a * b == c * d) {
                return 0;
            }
            if (a * b > c * d) {
                return 1;
            }
            return -1;
        },

        mp_velocity: function (st, ct, sf, cf, t) {
          return Math.min (4.0,
                (2.0 + Math.sqrt(2) * (st - sf / 16.0) * (sf - st / 16.0) * (ct - cf)) /
                (1.5 * t * ((2 + (Math.sqrt(5) - 1) * ct) + (3 - Math.sqrt(5)) * cf))
            );
        },

        reduce_angle: function (A) {
            if (Math.abs(A) > one_eighty_deg) {
                if (A > 0) {
                    A -= three_sixty_deg;
                } else {
                    A += three_sixty_deg;
                }
            }
            return A;
        };

        makeknots: function (p, tension, cycle) {
            var i, len;
            tension = tension || 1;

            var knots = [];

            len = p.length;
            for (i = 0; i < len; i++) {
                knots.push({
                    x: p[i][0],
                    y: p[i][1],
                    ltype: mp_open,
                    rtype: mp_open,
                    ly: tension,
                    ry: tension,
                    lx: tension,
                    rx: tension,
                    left_tension: function() { if (!this.ly) this.ly = 1; return this.ly;},
                    right_tension: function() { if (!this.ry) this.ry = 1; return this.ry;},
                    left_curl: function() { return this.lx || 0;},
                    right_curl: function() { return this.rx || 0;},
                    set_right_curl: function(x) { this.rx = x || 0;},
                    set_left_curl: function(x) { this.lx = x || 0;}
                });
            }
            len = knots.length;
            for (i = 0; i < len; i++) {
                knots[i].next = knots[i+1] || knots[i];
                knots[i].set_right_given = knots[i].set_right_curl;
                knots[i].set_left_given = knots[i].set_left_curl;
                knots[i].right_given = knots[i].right_curl;
                knots[i].left_given = knots[i].left_curl;
            }
            knots[len - 1].next = knots[0];

            if (!cycle) {
                knots[len - 1].rtype = mp_endpoint;

                knots[len - 1].ltype = mp_curl;
                knots[0].rtype = mp_curl;
            }

            return knots;
        },

        curve: function(point_list, controls) {
            var knots, len, i, val,
                x = [],
                y = [];
;

            controls = controls || {
                    tension: 1,
                    direction: {},
                    curl: {},
                    isClosed: false
                };

            knots = this.makeknots(point_list, Type.evaluate(controls.tension), controls.isClosed);

            len = knots.length;
            for (i in controls.direction) {
                if (controls.direction.hasOwnProperty(i)) {
                    val = Type.evaluate(controls.direction[i]);
                    if (Type.isArray(val)) {
                        if (val[0] !== false) {
                            knots[i].lx = val[0] * Math.PI / 180;
                            knots[i].ltype = mp_given;
                        }
                        if (val[1] !== false) {
                            knots[i].rx = val[1] * Math.PI / 180;
                            knots[i].rtype = mp_given;
                        }
                    } else {
                        knots[i].lx = val * Math.PI / 180;
                        knots[i].rx = val * Math.PI / 180;
                        knots[i].ltype = knots[i].rtype = mp_given;
                    }
                }
            }
            for (i in controls.curl) {
                if (controls.curl.hasOwnProperty(i)) {
                    val = Type.evaluate(controls.curl[i]);
                    if (i == 0) {
                        knots[i].rx = val * Math.PI / 180;
                        knots[i].rtype = mp_given;
                    } else if (i == len - 1) {
                        knots[i].lx = val * Math.PI / 180;
                        knots[i].ltype = mp_given;
                    }
                }
            }

            this.make_choices(knots);

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

            if (controls.isClosed) {
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

    return Mat.Metapost;
});
