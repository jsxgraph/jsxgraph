/*
    Copyright 2008-2025
        Matthias Ehmann,
        Carsten Miller,
        Alfred Wassermann

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
import JXG from "../jxg.js";

// Constants for this theme:
let size = 0.75,
    color = '#000';

JXG.themes['mono_thin'] = {

        board: {
            showInfobox: false,
            showCopyright: true,
            defaultAxes: {
                x: {
                    ticks: {
                        minorTicks: 0,
                        majorHeight: 10,
                        majorTickEndings: [1, 0]
                    }
                },
                y: {
                    ticks: {
                        minorTicks: 0,
                        majorHeight: 10,
                        majorTickEndings: [0, 1]
                    }
                }
            }
        },

        navbar: {
            strokeColor: '#bbb',
            fillColor: 'none'
        },

        elements: {
            strokeColor: color,
            highlightStrokeColor: color,
            fillColor: 'none',
            highlightFillColor: 'none',
            strokeOpacity: 0.6,
            highlightStrokeOpacity: 1
        },

        angle: {
            strokeColor: color,
            fillColor: '#aaaaaa55',
            fillOpacity: 0.3,
            highlightFillColor: '#aaaaaa33',
            highlightFillOpacity: 0.3,
            label: {
                strokeColor: color
            }
        },

        arc: {
            strokeColor: color,
            strokeWidth: size,
            highlightStrokeColor: color,
            highlightStrokeWidth: size
        },

        axis: {
            // ticks: {
            //     strokeColor: '#bbb'
            // }
        },

        boxplot: {
            strokeWidth: size,
            strokeColor: color,
            fillColor: color,
            fillOpacity: 0.2,
            highlightStrokeWidth: size,
            highlightStrokeColor: color,
            highlightFillColor: color,
            highlightFillOpacity: 0.1
        },

        circle: {
            strokeWidth: size,
            highlightStrokeWidth: 1.5 * size,
            strokeColor: color,
            highlightFillColor: 'none',
            highlightStrokeColor: color,
            center: {
                size: size,
                fillColor: color,
                strokeColor: color,
                highlightStrokeWidth: 4 * size,
                highlightFillColor: color,
                highlightStrokeColor: color
            },
            point2: {
                size: size,
                fillColor: color,
                strokeColor: color,
                highlightStrokeWidth: 4 * size,
                highlightFillColor: color,
                highlightStrokeColor: color
            }
        },

        circumcircle: {
            strokeWidth: size,
            highlightStrokeWidth: 1.5 * size,
            strokeColor: color,
            highlightFillColor: 'none',
            highlightStrokeColor: color,
            center: {
                size: size,
                fillColor: color,
                strokeColor: color,
                highlightStrokeWidth: 4 * size,
                highlightFillColor: color,
                highlightStrokeColor: color
            }
        },

        circumcirclearc: {
            strokeColor: color,
            strokeWidth: size,
            highlightStrokeColor: color,
            highlightStrokeWidth: size
        },

        circumcirclesector: {
            strokeColor: color,
            fillColor: '#aaaaaa55',
            fillOpacity: 0.3,
            highlightFillColor: '#aaaaaa33',
            highlightFillOpacity: 0.3
        },

        comb: {
            strokeColor: color,
            strokeWidth: size
        },

        conic: {
            strokeWidth: size,
            highlightStrokeWidth: 1.5 * size,
            strokeColor: color,
            highlightStrokeColor: color,
            fillColor: 'none',
            highlightFillColor: 'none'
        },

        curve: {
            strokeColor: color,
            strokeWidth: size,
            highlightStrokeColor: color,
            highlightStrokeWidth: size
        },

        grid: {
            strokeWidth: size
        },

        hatch: {
            strokeColor: color,
            strokeWidth: size
        },

        incircle: {
            strokeWidth: size,
            highlightStrokeWidth: 1.5 * size,
            strokeColor: color,
            highlightFillColor: 'none',
            highlightStrokeColor: color,
            center: {
                size: size,
                fillColor: color,
                strokeColor: color,
                highlightStrokeWidth: 4 * size,
                highlightFillColor: color,
                highlightStrokeColor: color
            }
        },

        inequality: {
            fillColor: '#aaaaaa55',
            fillOpacity: 0.2
        },

        integral: {
            fillColor: '#aaaaaa55',
            highlightFillColor: '#aaaaa33',
            fillOpacity: 0.3,
            highlightFillOpacity: 0.3,
            curveLeft: {
                color: color
            },
            baseLeft: {
                color: color
            },
            curveRight: {
                color: color
            },
            baseRight: {
                color: color
            }
        },

        label: {
            strokeColor: color
        },

        line: {
            strokeColor: color,
            strokeWidth: size,
            highlightStrokeColor: color,
            highlightStrokeWidth: size,
            point1: {
                size: size,
                fillColor: color,
                strokeColor: color,
                highlightStrokeWidth: 4 * size,
                highlightFillColor: color,
                highlightStrokeColor: color
            },
            point2: {
                size: size,
                fillColor: color,
                strokeColor: color,
                highlightStrokeWidth: 4 * size,
                highlightFillColor: color,
                highlightStrokeColor: color
            }
        },

        normal: {
            strokeColor: color
        },

        parallel: {
            strokeColor: color
        },

        perpendicular: {
            strokeColor: color
        },

        perpendicularsegment: {
            strokeColor: color
        },

        point: {
            size: size,
            fillColor: color,
            strokeColor: color,
            highlightStrokeWidth: 4 * size,
            highlightFillColor: color,
            highlightStrokeColor: color
        },

        polygon: {
            fillColor: '#aaaaaa55',
            highlightFillColor: '#aaaaaa33',
            fillOpacity: 0.3,
            highlightFillOpacity: 0.3,
            vertices: {
                size: size,
                fillColor: color,
                strokeColor: color,
                highlightStrokeWidth: 4 * size,
                highlightFillColor: color,
                highlightStrokeColor: color
            },
            borders: {
                strokeColor: color,
                strokeWidth: size,
                highlightStrokeColor: color,
                highlightStrokeWidth: size
            }
        },

        sector: {
            strokeColor: color,
            fillColor: '#aaaaaa55',
            fillOpacity: 0.3,
            highlightFillColor: '#aaaaaa33',
            highlightFillOpacity: 0.3
        },

        semicircle: {
            center: {
                size: size,
                fillColor: color,
                strokeColor: color,
                highlightStrokeWidth: 4 * size,
                highlightFillColor: color,
                highlightStrokeColor: color
            }
        },

        slider: {
            size: size,
            fillColor: color,
            strokeColor: color,
            highlightStrokeWidth: 4 * size,
            highlightFillColor: color,
            highlightStrokeColor: color,
            baseline: {
                strokeWidth: size,
                strokeColor: color,
                highlightStrokeColor: color
            },
            label: {
                strokeColor: color
            },
            highline: {
                strokeWidth: 3 * size,
                name: '',
                strokeColor: color,
                highlightStrokeColor: color
            },
            ticks: {
                strokeColor: color
            }
        },

        slopefield: {
            strokeWidth: 0.75 * size,
            highlightStrokeWidth: size,
            highlightStrokeColor: color,
            highlightStrokeOpacity: 0.8
        },

        tapemeasure: {
            strokeColor: color,
            strokeWidth: size,
            highlightStrokeColor: color,
            highlightStrokeWidth: size,
            point1: {
                size: size,
                fillColor: color,
                strokeColor: color,
                highlightStrokeWidth: 4 * size,
                highlightFillColor: color,
                highlightStrokeColor: color
            },
            point2: {
                size: size,
                fillColor: color,
                strokeColor: color,
                highlightStrokeWidth: 4 * size,
                highlightFillColor: color,
                highlightStrokeColor: color
            },
            ticks: {
                strokeWidth: size
            }
        },

        text: {
            strokeColor: color
        },

        tracecurve: {
            strokeColor: color
        },

        turtle: {
            strokeWidth: size,
            strokeColor: color,
            arrow: {
                strokeWidth: 2 * size,
                strokeColor: '#aaaaaa55'
            }
        },

        vectorfield: {
            strokeWidth: 0.75 * size,
            highlightStrokeWidth: size,
            highlightStrokeColor: color,
            highlightStrokeOpacity: 0.8
        }
    // });
};

export default JXG;