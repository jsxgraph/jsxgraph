/**
 * xanvas 0.1 - JavaScript Canvas Library
 *
 * Copyright (c) 2010 Michael Gerhaeuser
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 */

xanvas = (function(document, undefined) {
    return (function (canvas) {
        var xanvas, i,
            fromx = 0, fromy = 0,
            _is_array = function(a) {
                return a && typeof a === 'object' && typeof a.length === 'number' && !(a.propertyIsEnumerable('length'));
            },
            _make_cascade = function(towrap, that) {
                return (function() {
                    towrap.apply(that, arguments);
                    return that;
                });
            },
            toCascade = {
                'beginPath': 'b',
                'closePath': 'c',
                'stroke': 's',
                'fill': 'f'
            },
            saveRestore = [
                'lineDashArray'
            ];
    
        if(canvas && canvas.getContext) {
            xanvas = canvas.getContext('2d');
        } else if(canvas && canvas.beginPath) {
            xanvas = canvas;
        } else if(canvas && typeof canvas === 'string') {
            xanvas = document.getElementById(canvas).getContext('2d');
        } else {
            return canvas;
        }

        // generate shortcuts out of the methods in toCascade
        for(i in toCascade) {
            xanvas[toCascade[i]] = _make_cascade(xanvas[i], xanvas);
        }
        
        /**
         * Shortcut for stroke(); fill(); closePath();
         */
        xanvas.sfc = function() {
            this.s();
            this.f();
            this.c();
            return this;
        };
        
        /**
         * Shortcut for stroke(); closePath();
         */
        xanvas.sc = function() {
            this.s();
            this.c();
            return this;
        };
        
        /**
         * Shortcut for fill(); closePath();
         */
        xanvas.fc = function() {
            this.f();
            this.c();
            return this;
        };
        
        /**
         * Backup of the canvas.save method
         * @private
         */
        xanvas._save = xanvas.save;
        
        /**
         * Backup of the canvas.restore method
         * @private
         */
        xanvas._restore = xanvas.restore;
        
        /**
         * Canvas state stack for extended xanvas styles.
         * @type Array
         * @private
         */
        xanvas._xstack = [];
        
        /**
         * This is the xanvas implementation of the save method to also save the canvas states
         * in the canvas state stack.
         * @returns {Object} Reference to the xanvas object.
         */
        xanvas.save = function() {
            var i, o = {};
            
            for(i in saveRestore) {
                o[i] = this[i];
            }
            this._xstack.push(o);
            this._save();
            return this;
        };
        
        /**
         * This is the xanvas implementation of the save method to also save the canvas states
         * in the canvas state stack.
         * @returns {Object} Reference to the xanvas object.
         */
        xanvas.restore = function() {
            var xs = this._xstack.pop(), i;
            this._restore();
            for(i in saveRestore) {
                this[i] = xs[i];
            }
            return this;
        };

        /**
         * Determines the line dash style using an array of numbers. If the length of the array is odd,
         * the array is duplicated to determine the dash style.
         * @example [9, 3, 5] // equals "nine-pixel dash, three-pixel gap,  five-pixel dash, 
         * nine-pixel gap,  three-pixel dash, five-pixel gap"
         * [9, 5] // equals "nine-pixel dash, five-pixel gap"
         * @type Array
         */
        xanvas.lineDashArray = [];
        
        /**
         * Backup of the canvas moveTo
         */
        xanvas._moveTo = xanvas.moveTo;
        
        /**
         * We need to override moveTo to keep track of the current cursor position for lineTo
         */
        xanvas.moveTo = function(tox, toy) {
            fromx = tox;
            fromy = toy;
            this._moveTo(tox, toy);
            
            return this;
        };
        
        /**
         * Backup of the original canvas lineTo
         */
        xanvas._lineTo = xanvas.lineTo;
        
        /**
         * We need to override lineTo, because of the new styles like lineDashArray.
         */
        xanvas.lineTo = function(tox, toy) {
            var dA = this.lineDashArray,
                dTotal, dX = [], dY = [], d,
                i, x, y,
                _move_on = function(x, y, i) {
                    if(i%2 === 0) {
                        this._lineTo(x, y);
                    } else {
                        this._moveTo(x, y);
                    }
                };

            if(_is_array(this.lineDashArray) && this.lineDashArray.length > 0) {
                // we need to dash
                // if the length is odd, we need to concatenate dA with itself
                dA = dA.length % 2 === 1 ? dA.concat(dA) : dA;
                dTotal = Math.sqrt((tox-fromx)*(tox-fromx)+(toy-fromy)*(toy-fromy));
                for(i=0; i<dA.length; i++) {
                    dX[i] = dA[i]/dTotal*(tox-fromx);
                    dY[i] = dA[i]/dTotal*(toy-fromy);
                }
                
                i = 0;
                d = 0;
                x = fromx;
                y = fromy;
                while(d+dA[i] <= dTotal) {
                    x += dX[i];
                    y += dY[i];
                    d += dA[i];

                    _move_on.apply(this, [x, y, i]);
                    
                    i++;
                    if(i === dA.length) i = 0;
                }
                
                x = tox;
                y = toy;
                _move_on.apply(this, [x, y, i]);
            } else {
                // no dash array given, just line to (tox, toy)
                this._lineTo(tox, toy);
            }
            
            return this;
        };
        
        /**
         * Draws a line from (fromx, fromy) to (tox, toy).
         * @param {Number} fromx
         * @param {Number} fromy
         * @param {Number} tox
         * @param {Number} toy
         * @returns {Object} Reference to xanvas object.
         */
        xanvas.line = function(fromx, fromy, tox, toy) {
            this.moveTo(fromx, fromy);
            this.lineTo(tox, toy);

            return this;
        };
        
        /**
         * Backup of canvas arc method
         */
        xanvas._arc = xanvas.arc;
        
        /**
         * Draws an arc.
         * @param {Number} cx Center x
         * @param {Number} cy Center y
         * @param {Number} r Radius of arc
         * @param {Number} start Start angle
         * @param {Number} end End angle
         * @param {Boolean} anticlockwise If true, the arc is drawn counterclockwise
         * @returns {Object} Reference to xanvas object
         */
        xanvas.arc = function(cx, cy, r, start, end, anticlockwise) {
            var dA = this.lineDashArray,
                dTotal, dAngle = [], d,
                i, angle, buf;

            if(_is_array(this.lineDashArray) && this.lineDashArray.length > 0) {
                // we need to dash

                if(anticlockwise) {
                    buf = start;
                    start = end;
                    end = buf;
                }
                
                // if the length is odd, we need to concatenate dA with itself
                dA = dA.length % 2 === 1 ? dA.concat(dA) : dA;
                dTotal = Math.abs(r*(end - start));
                for(i=0; i<dA.length; i++) {
                    dAngle[i] = dA[i]/r;
                }
                
                i = 0;
                d = 0;
                angle = start;
                while(Math.abs(d+dA[i]) <= dTotal) {
                    d += dA[i];
                    angle += dAngle[i];

                    if(i%2 === 0) {
                        this._arc(cx, cy, r, angle-dAngle[i], angle, false);
                    } else {
                        this._moveTo(cx + r*Math.cos(angle), cy + r*Math.sin(angle));
                    }
                    
                    i++;
                    if(i === dA.length) i = 0;
                }
            } else {
                // no dash array given, just draw the whole arc
                this._arc(cx, cy, r, start, end, anticlockwise);
            }
            
            return this;
        };
        
        /**
         * Draws a circle around (cx, cy) with radius r.
         * @param {Number} cx Center x
         * @param {Number} cy Center y
         * @param {Number} [r=1] Radius
         * @returns {Object} Reference to xanvas object.
         */
        xanvas.circle = function(cx, cy, r) {
            r = r || 1;
            
            this.arc(cx, cy, r, 0, 2*Math.PI, true);
            return this;
        };

        /**
         * Get the rgb color values at (x, y)
         * @param {Number} x
         * @param {Number} y
         * @returns {Array} An array containing the red, green, and blue color values and
         * the alpha value at (x, y).
         */
        xanvas.getPixel = function(x, y) {
            var imageData, index;
            imageData = this.getImageData(x, y, 1, 1);
            
            return imageData.splice(0, 4);
        };
        
        /**
         * Set the rgb color values at (x, y)
         * @param {Number} x Coordinate
         * @param {Number} y Coordinate
         * @param {Array,Number} rgba Either an array containing the red, green, blue, and alpha value
         * of the color to set, or just the red value as a number from 0 to 255. In the latter case,
         * the optional parameters have to be set, too.
         * @param {Number} [g] Green (from 0 to 255).
         * @param {Number} [b] Blue (from 0 to 255).
         * @param {Number} [a] Alpha; 0 equals transparent, 255 equals opaque.
         * @example x.setPixel(250, 250, 0, 255, 0, 255); // puts a 100% opaque green pixel at (250, 250)
         * x.setPixel(250,250, 0, 0, 255, 128); // puts a 50% transparent blue pixel at (250, 250)
         * @returns {Object} Reference to the xanvas object.
         */
        xanvas.setPixel = function(x, y, rgba, g, b, a) {
            var imageData, index, r;
            imageData = this.getImageData(x, y, 1, 1);
            
            if(arguments.length === 3 && _is_array(rgba)) {
                r = rgba[0];
                g = rgba[1];
                b = rgba[2];
                a = rgba[3];
            } else {
                r = rgba;
            }
            
            imageData.data[0] = r;
            imageData.data[1] = g;
            imageData.data[2] = b;
            imageData.data[3] = a;
            
            this.putImageData(imageData, x, y);
            return this;
        };
        
        return xanvas;
    });
})(document);
