{
    let size = 0.75;
    let color = '#000';

    JXG.Options = JXG.merge(JXG.Options, {

        board: {
            showInfobox: false,
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
            fillOpacity: 0.3,
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
            highlightFillOpacity: 0.3,
            fillOpacity: 0.3,
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
            highlightFillColor: 'none',
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
            highlightFillOpacity: 0.3,
            fillOpacity: 0.3,
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
    });
}