/*
    Copyright 2011
        Emmanuel Ostenne
        Alfred Wassermann

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
JXG.TracenpocheReader = new function() {

    this.tokenize = function(inputStr, prefix, suffix) {
        if (typeof prefix !== 'string') { prefix = '<>+-&'; }
        if (typeof suffix !== 'string') { suffix = '=>&:';  }
        var c;                      // The current character.
        var from;                   // The index of the start of the token.
        var i = 0;                  // The index of the current character.
        var length = inputStr.length;
        var n;                      // The number value.
        var q;                      // The quote character.
        var str;                    // The string value.
        var isSmallName;

        var result = [];            // An array to hold the results.

        // Make a token object.
        var make = function (type, value) {
            return {
                type: type,
                value: value,
                from: from,
                to: i
            };
        };
        
        var error = function(type, value, msg) {
            console.log('Tokenizer: problem with ' + type + ' ' + value + ': ' + msg);
        };

        if (!inputStr || inputStr=='') return;

        // Loop through this text, one character at a time.

        c = inputStr.charAt(i);
        while (c) {
            from = i;
            if (c <= ' ') {                                                 // Ignore whitespace
                i++;
                c = inputStr.charAt(i);
            } else if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {  // name
                str = c;
                i++;
				//i += 1;
                // if the name starts with a small capital, anything may follow
                // otherwise, if the next char is a capital letter like
                // AB, the meaning is Dist(A,B)
                isSmallName = (c >= 'a' && c <= 'z') ? true : false;
                    
                for (;;) {
                    c = inputStr.charAt(i);
                    if (isSmallName) {
                        if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') ||
                            (c >= '0' && c <= '9') || (c === "'") /*|| c === '_' */) {
                            str += c;
                            i++;
                        } else {
                            break;
                        }
                    } else { 
                        if ((c >= '0' && c <= '9') || (c === "'") ) {
                            str += c;
                            i++;
                        } else {
                            break;
                        }
                    }
                }
                if (result.length>0 && result[result.length-1].type=='name' 
                    && result[result.length-1].value!='var' 
                    && result[result.length-1].value!='for' 
                    ) {     
                                                                    // Here we have the situation AB -> A#B
                    result.push(make('operator', '#'));
                }
                result.push(make('name', str));
            } else if (c >= '0' && c <= '9') {                              // number
                // A number cannot start with a decimal point. It must start with a digit,
                // possibly '0'.
				// hexadecimal 0xABCDEF converts with #ABCDEF
                str = c;
                i++;
				c = inputStr.charAt(i);
				// Look for hexadecimal notation e.g. for color  -> convert to decimal
				if( ( str==='0' ) && ( c==='x' ) ) {
					str='#';
					i++;
					for (;;) {                  // Look for more digits						
						c = inputStr.charAt(i);
						if ( ( c>='0' && c<='9' ) || ( c>='A' && c<='F') ) {
							i++;
							str += c; 
						} else break;
					}
    	            result.push(make('string', str));
				} else {
					for (;;) {                  // Look for more digits						
						if (c < '0' || c > '9') { break; }
						i++;
						str += c;
						c = inputStr.charAt(i);
					}
					if (c === '.') {            // Look for a decimal fraction part
						i++;
						str += c;
						for (;;) {
							c = inputStr.charAt(i);
							if (c < '0' || c > '9') { break; }
							i++;
							str += c;
						}
					}
					if (c === 'e' || c === 'E') {   // Look for an exponent part.
						i++;
						str += c;
						c = inputStr.charAt(i);
						if (c === '-' || c === '+') {
							i++;
							str += c;
							c = inputStr.charAt(i);
						}
						if (c < '0' || c > '9') {
							error('number', str, "Bad exponent");
						}
						do {
							i++;
							str += c;
							c = inputStr.charAt(i);
						} while (c >= '0' && c <= '9');
					}
	              	if (c >= 'a' && c <= 'z') {        // Make sure the next character is not a letter
                    	i++;
                    	str += c;
                    	error('number', str, "Bad number");
                	}
                	n = +str;          // Convert the string value to a number. If it is finite, then it is a good token.
                	if (isFinite(n)) {
                    	result.push(make('number', n));
                	} else {
                    	error('number', str, "Bad number");
                	}
				}
            } else if (c === '\'' || c === '"') {                               // string
                str = '';
                q = c;
                i++;
                for (;;) {
                    c = inputStr.charAt(i);
                    if (c < ' ') {
                        error('string', str, c === '\n' || c === '\r' || c === '' ?
                            "Unterminated string." :
                            "Control character in string.", make('', str));
                        break;
                    }
                    if (i >= length) {
                        error('string', str, "Unterminated string"); break;
                    }
                    if (c === q) {   // Look for the closing quote.
                        break;
                    }
                    if (c === '\\') {          // Look for escapement
                        i++;
                        if (i >= length) {
                            error('string', str, "Unterminated string"); break;
                        }
                        c = inputStr.charAt(i);
                        switch (c) {
                        case 'b':
                            c = '\b'; break;
                        case 'f':
                            c = '\f'; break;
                        case 'n':
                            c = '\n'; break;
                        case 'r':
                            c = '\r'; break;
                        case 't':
                            c = '\t'; break;
                        case 'u':
                            if (i >= length) {
                                error('string', str, "Unterminated string");
                            }
                            c = parseInt(inputStr.substr(i + 1, 4), 16);
                            if (!isFinite(c) || c < 0) {
                                error('string', str, "Unterminated string");
                            }
                            c = String.fromCharCode(c);
                            i += 4;
                            break;
                        }
                    }
                    str += c;
                    i++;
                }
                i++;
                result.push(make('string', str));
                c = inputStr.charAt(i);
            } else if (c === '/' && inputStr.charAt(i + 1) === '/') {   // comment
                i++;
                for (;;) {
                    c = inputStr.charAt(i);
                    if (c === '\n' || c === '\r' || c === '') { break; }
                    i++;
                }
            } else if (prefix.indexOf(c) >= 0) {                        // combining (multi-character operator)
                str = c;
                i++;
                while (true) {
                    c = inputStr.charAt(i);
                    if (i >= length || suffix.indexOf(c) < 0) {
                        break;
                    }
                    i++;
                    str += c;
                }
                result.push(make('operator', str));
            } else {                                                    // single-character operator
                i++;
                result.push(make('operator', c));
                c = inputStr.charAt(i);
            }
        }
        
        return result;
    }; 
        
    this.parseOptions = function(board) {
        //var code, i, len = script.length;
       
       // Analyze this.data for "@options;"
        // Just for testing.
        board.setBoundingBox([-10,10,10,-10], true);
        board.create('axis', [[0, 0], [1, 0]]);
        board.create('axis', [[0, 0], [0, 1]]);
        
        /*
        for (i=start+1; i<len; i++) {
            code = script[i];
            if (code=='') continue;

            if (code.match(/@/)) {   // Reached the end of the options section
                return i-1;
            }
            console.log("OPT>", code);
            // Read options:
        }
        */
    };

    this.parse = function(tokens, scopeObjName) { 
        var scope;
        var symbol_table = {};
        var token;
        var token_nr;
        var i, arr;
        
        var error = function(tok, msg) {
            throw new Error("TraceEnPocheReader: syntax error at char " + tok.from + ': ' + tok.value+ ' - ' + msg);
        };

        var createObject = function (o) {
            function F() {};
            F.prototype = o;
            return new F();
        };
        
        var original_scope = {
            define: function (n) {
                //console.log("Add scope var " + n.value);            
                this.def[n.value] = n.value;
            },
            find: function (n) {
                var e = this, o;
                while (true) {
                    o = e.def[n];
                    if (o) {
                        return "$"+'["' + e.def[n].value + '"]';
                    }
                    e = e.parent;
                    if (!e) {
                        o = symbol_table[n];
                        return o;
                    }
                }
            },
            pop: function () {
                scope = this.parent;
            }
        };

        var new_scope = function () {
            var s = scope;
            scope = Object.create(original_scope);
            scope.def = {};
            scope.parent = s;
            return scope;
        };
        
        var advance = function (id) {
            var a, o, t, v;
            if (id && token.id !== id) {
                error(token, "Expected '" + id + "'.");
            }
            if (token_nr >= tokens.length) {
                token = symbol_table["(end)"];
                return;
            }
            t = tokens[token_nr];
            token_nr++;
            v = t.value;
            a = t.type;
            if (a === "name") {
                o = symbol_table[v];
                if (!o) {
                    o = variable(v);
                }
            } else if (a === "operator") {
                o = symbol_table[v];
                if (!o) {
                    error(t, "Unknown operator.");
                }
            } else if (a === "string" || a ===  "number") {
                o = symbol_table["(literal)"];
                // a = "literal";
            } else {
                error(t, "Unexpected token.");
            }
            token = createObject(o);
            token.from  = t.from;
            token.to    = t.to;
            token.value = v;
            return token;
        };

        var expression = function (rbp) {
            var left, t = token;
            advance();
            left = t.nud();
            while (rbp < token.lbp) {
                t = token;
                advance();
                left = t.led(left);
            }
            return left;
        };
        
        var statement = function () {
            var n = token, v, str, na;

            if (n.std) {
                advance();
                //scope.reserve(n);
        
                return n.std();
            }
            v = expression(0);
            if (v.assignment) {
                 str = v.value + ';';
                 na =  v.name.replace(/^tep\[/,"").replace(/\]$/,"");
                 if (str.match(/\[\]\)/)) {
                    str = str.replace(/\[\]\)/, "[" + na + "])")
                 } else {
                    str = str.replace(/\]\)/, "," + na + "])");
                 }

            } else {
                str = v;
            }
            /*
            if (!v.assignment && v.id !== "(") {
                error(v, "Bad expression statement.");
            }
            */
            advance(";");
            return str;
        };

        var statements = function () {
            var a = [], s;
            while (true) {
                if (token.id === "end" || token.id === "(end)") {
                    break;
                }
                s = statement();
                if (s) {
                    a.push(s);
                }
            }
            return a.length === 0 ? null : a;
        };

        var original_symbol = {
            nud: function () {
                error(this, "Undefined.");
            },
            led: function (left) {
                error(this, "Missing operator.");
            }
        };

        /*
         * Shortcuts
         */
        var symbol = function (id, bp) {
            var s = symbol_table[id];
            bp = bp || 0;
            if (s) {
                if (bp >= s.lbp) {
                    s.lbp = bp;
                }
            } else {
                s = createObject(original_symbol);
                s.id = s.value = id;
                s.lbp = bp;
                symbol_table[id] = s;
            }
            return s;
        };

        var constant = function (s, v) {
            var x = symbol(s);
            x.nud = function () {
                this.value = symbol_table[this.id].value;
                return this.value;
            };
            x.value = v;
            x.arity = 'name';
            return x;
        };

        var predefined = function (s, v) {
            var x = symbol(s);
            x.nud = function () {
                this.value = symbol_table[this.id].value;
                return this.value;
            };
            x.arity = "function";
            x.value = v;
            return x;
        };

        var variable = function (s) {
            var x = symbol(s), second;
//console.log("Define " + s);
            scope.define(x);
            
            x.nud = function () {
                this.value = symbol_table[this.id].value;
                if (token.id === '[') {
//console.log("Proceed " + this.value);
                    second = expression(11);
                    return scopeObjName + '["' + this.value + '"+' + second + ']';
                }   
                return scopeObjName + '["' + this.value + '"]';
            };
            return x;
        };
        
        var infix = function (id, bp, led) {
            var s = symbol(id, bp);
            s.led = led || function (left) {
                this.first = left;
                this.second = expression(bp);
                return '('+this.first + this.value + this.second+')';
            };
            return s;
        };

        var infixr = function (id, bp, led) {
            var s = symbol(id, bp);
            s.led = led || function (left) {
                this.first = left;
                this.second = expression(bp - 1);
                return '('+this.first + this.value + this.second+')';
            };
            return s;
        };
        
        var assignment = function (id) {
            return infixr(id, 10, function (left) {
                var strObj = {};
                this.first = left;
                if (token.id === '[') {
                    this.first += expression(0);
                    //this.first = '$[' + this.first + ']';
                } 
                this.second = expression(9);
                strObj.value = this.first + this.value + this.second;
                strObj.assignment = true;
                strObj.name = this.first;
                return strObj;
            });
        };  
        
        var prefix = function (id, nud) {
            var s = symbol(id);
            s.nud = nud || function () {
                this.first = expression(70);
                return this.value + this.first;
            };
            return s;
        };

        var stmt = function (s, f) {
            var x = symbol(s);
            x.std = f;
            return x;
        };
        
        /*
         * Define the language
         * 
         */
        symbol("(literal)").nud = function() { return (typeof this.value === "string")? "'" + this.value + "'" :this.value; };
        symbol("(end)");
        symbol("(name)");
        symbol(":");
        symbol(";");
        symbol(")");
        symbol("]");
        symbol("}");
        symbol(",");
        symbol("do");
        symbol("to");
        symbol("end");

        constant("true", true);
        constant("false", false);

        /*
         * Predefined functions
         */
        for (i=0; i<this.tepElements.length; i++) {
            predefined(this.tepElements[i], "that." + this.tepElements[i]);
        }
        
        constant("x", "x");
        predefined("pi", "Math.PI");
        predefined("sin", "Math.sin");
        predefined("cos", "Math.cos");
        predefined("tan", "Math.tan");
        predefined("abs", "Math.abs");
        predefined("racine", "Math.sqrt");
        predefined("carre", "JXG.Math.carre");

        assignment("="); 
        
        infixr("&&", 30);
        infixr("||", 30);
        
        arr = ["==", "!=", "<", "<=", ">", ">="];
        for (i=0; i<arr.length; i++) {
            infixr(arr[i], 40);
        }

        infix("#", 50, function (left) {
                this.first = left;
                this.second = expression(0);
                return 'function(){return '+ this.first + '.Dist(' + this.second+');}';
        });

        infix("+", 50);
        infix("-", 50);
        infix("*", 60);
        infix("/", 60);
        infix("%", 50);

        infixr("^", 65, function (left) {
                this.first = left;
                this.second = expression(64);
                return 'Math.pow('+this.first + ',' + this.second+')';
        });

        infix("(", 80, function (left) {
            var a = [];
            this.first = left;
            this.second = a;
            
            // Parameters
            if (token.id !== ")") {
                while (true) {
                    a.push(expression(0));
                    if (token.id !== ",") {
                        break;
                    }
                    advance(",");
                }
            }
            advance(")");
            
            // Optional attributes
            if (token.id === '{') {
                this.third = expression(0).first;
            } else {
                this.third = [];
            }
            return this.first + '([' + this.second.join(',') + '],[' + this.third.join(',') + '])';
        });

        prefix("-");
        prefix("(", function () {
            var e = expression(0);
            advance(")");
            return e;
        });    

        prefix("fonction", function () {
            advance("(");
            var e = expression(0);
            advance(")");
            e = e.replace(/,\[\]/g,"").replace(/[\[\]]/g,"");
            return "that.fonction([" + "'" + e + "'" + "],{})";
        });    

        // Attributes
        prefix("{", function () {
            var a = [], n, v;
            if (token.id !== "}") {
                while (true) {
                    // Ignore
                    n = token;
                    
                    //if (n.arity !== "name"/* && n.arity !== "literal"*/) {
                    //    error(token, "Bad property name.");
                    //}
                    advance();
                    a.push( "'" + n.value + "'");
                    if (token.id !== ",") {
                        break;
                    }
                    advance(",");
                }
            }
            advance("}");
            this.first = a;
            this.arity = "unary";
            return this;
        });
        
        prefix("for", function () {
            var n = token, vname;                   // FIXME error message
            
            this.first = expression(0);
            advance("to");
            this.second = expression(0);
            advance("do");
            if (token.id === ';') advance(";");
            this.third = statements().join("\n");
            advance("end");
            varname = scopeObjName + '["' + n.value + '"]';
            return 'for (' + this.first + ';' + 
                            varname + '<=' + this.second + ';' + 
                            varname + '++){' + this.third + '}';
        });
        
        stmt("var", function () {
            var a, n, t;
            //n = token;
            // scope.define(n);
            a = statement();
            return /*"VAR " + */ a;
        });    

        prefix("[", function () {
            var a = [];
            if (token.id !== "]") {
                while (true) {
                    a.push(expression(0));
                    if (token.id !== ",") {
                        break;
                    }
                    advance(",");
                }
            }
            advance("]");
            this.first = a;
            this.arity = "unary";
            return a.length==0 ? null : a.length==1 ? a[0] : a[0]+'?'+a[1]+':'+a[2];
        });    
        
        /*
         * Here starts the parsing part
         * 
         */
        token_nr = 0;
        new_scope();
        advance();
        var s = statements().join('\n');
//console.log(s);        
        return s;
    };
    
    this.parseData = function(board) {
        this.parseOptions(board);
        this.parseFigure(board);
    };

    this.parseFigure = function(board) {
        var i = this.data.indexOf('@figure;');
        if (i<0) {
            return;             // no figure found
        }
        
        i += 8;                 // skip string "@figure;"
        var i2 = this.data.indexOf('@',i+1);
        if (i2<0) { i2 = this.data.length; }
        
        var tokens = this.tokenize(this.data.slice(i, i2), '=<>!+-*&|/%^#', '=<>&|');
        this.board = board;
        var s = this.parse(tokens, 'tep');
        var tep = {};
		//to store last render position of "reel"/"entier" tep object
		//initial position to get from board BoundingBox ...
        this.reelPosition = {x:12,y:-9};
        
        // Set the default options
        board.options.point.face = 'x';
        board.options.point.strokeColor = '#0000ff';
        board.options.point.strokeWidth = 1;
        board.options.line.strokeWidth = 1;
        
//console.log(s);        
        var fun = new Function("that", "tep", s);
        //console.log(fun.toString());
        fun(this, tep);
//console.log(tep);
        
    };

    // 
    //--------------------------------------------------------------------- 
    //
    this.prepareString = function(fileStr) {
        //fileStr = JXG.Util.utf8Decode(fileStr);
        //fileStr = JXG.GeogebraReader.utf8replace(fileStr);
        return fileStr;
    };
    
    this.readTracenpoche = function(fileStr, board){
        this.data = this.prepareString(fileStr);
        board.suspendUpdate();
        this.parseData(board);
        board.unsuspendUpdate();
        return this.data;
    };
    
    // 
    //--------------------------------------------------------------------- 
    //
    this.handleAtts = function(attsArr) {
        var obj = {}, i, le = attsArr.length;
        
        // The last entry is the name of the element.
        if (le>0) {
            obj["name"] = attsArr[le-1];
        }

		//console.log("atts:",attsArr);
		// q0, q1,q2,q3,q4 to show right angle (quadrant 1,2,3,4) q1 par defautl, q0 for none -> cf perpendiculaire
		// /, //, ///, \, \\, \\\, x, o : to code length or middle -> cf segment
		//                                problem with string // /// \ \\ \\\

        obj["withLabel"] = true;
        for (i=0; i<le; i++) {
			switch (attsArr[i]) {
                case 'sansnom' : obj["withLabel"] = false; break;
				case 'blinde' : obj["fixed"] = true; break;
				case 'fixe' : obj["fixed"] = true; break;
				case 'trace' : obj["trace"] = true; break;
				case 'i' : obj["visible"] = false; break;
				case 'invisible' : obj["visible"] = false; break;
				case 'v' : obj["visible"] = true; break;
				case 'visible' : obj["visible"] = true; break;
				case 'croix0' : obj["face"] ='cross'; obj["size"] = 0; break;
				case 'croix1' : obj["face"] ='cross'; obj["size"] = 2; break;
				case 'croix2' : obj["face"] ='cross'; obj["size"] = 3; break;
				case 'croix3' : obj["face"] ='cross'; obj["size"] = 4; break;
				case 'rond0' : obj["face"] ='circle'; obj["size"] = 0; break;
				case 'rond1' : obj["face"] ='circle'; obj["size"] = 2; break;
				case 'rond2' : obj["face"] ='circle'; obj["size"] = 3; break;
				case 'rond3' : obj["face"] ='circle'; obj["size"] = 4; break;
				case '0' : obj["strokeWidth"] = 1; break;
				case '1' : obj["strokeWidth"] = 1; break;
				case '2' : obj["strokeWidth"] = 2; break;
				case '3' : obj["strokeWidth"] = 3; break;
				case '4' : obj["strokeWidth"] = 4; break;
				case '5' : obj["dash"] = 0; break;
				case '6' : obj["dash"] = 1; break;
				case '7' : obj["dash"] = 2; break;
				case '8' : obj["dash"] = 3; break;
				case '9' : obj["dash"] = 4; break;
				case 'plein' : obj["fillOpacity"] = 0.5; break;
				case 'plein0' : obj["fillOpacity"] = 0; break;
				case 'plein10' : obj["fillOpacity"] = 0.1; break;
				case 'plein20' : obj["fillOpacity"] = 0.2; break;
				case 'plein30' : obj["fillOpacity"] = 0.3; break;
				case 'plein40' : obj["fillOpacity"] = 0.4; break;
				case 'plein50' : obj["fillOpacity"] = 0.5; break;
				case 'plein60' : obj["fillOpacity"] = 0.6; break;
				case 'plein70' : obj["fillOpacity"] = 0.7; break;
				case 'plein80' : obj["fillOpacity"] = 0.8; break;
				case 'plein90' : obj["fillOpacity"] = 0.9; break;
				case 'plein100' : obj["fillOpacity"] = 1; break;
				case 'blanc' : obj['color'] ='white'; break;
				case 'jaune' : obj['color'] ='yellow'; break;
				case 'jauneclair' : obj['color'] ='lightyellow'; break;
				case 'kakiclair' : obj['color'] ='yellowgreen'; break;
				case 'jaunepaille' : obj['color'] ='darkkhaki'; break;
				case 'rose' : obj['color'] ='pink'; break;
				case 'saumon' : obj['color'] ='salmon'; break;
				case 'orange' : obj['color'] ='orange'; break;
				case 'rougeclair' : obj['color'] ='palevioletred'; break;
				case 'rouge' : obj['color'] ='red'; break;
				case 'vertclair' : obj['color'] ='lime'; break;
				case 'vert' : obj['color'] ='green'; break;
				case 'vertfonce' : obj['color'] ='darkgreen'; break;
				case 'kaki' : obj['color'] ='olive'; break;
				case 'sapin' : obj['color'] ='springgreen'; break;
				case 'marron' : obj['color'] ='maroon'; break;
				case 'brique' : obj['color'] ='firebrick'; break;
				case 'marronfonce' : obj['color'] ='saddlebrown'; break;
				case 'violetfonce' : obj['color'] ='darkviolet'; break;
				case 'rougefonce' : obj['color'] ='darkred'; break;
				case 'cyan' : obj['color'] ='cyan'; break;
				case 'bleuciel' : obj['color'] ='skyblue'; break;
				case 'bleuocean' : obj['color'] ='aqua'; break;
				case 'bleu' : obj['color'] ='blue'; break;
				case 'bleufonce' : obj['color'] ='darkblue'; break;
				case 'violet' : obj['color'] ='blueviolet'; break;
				case 'gris' : obj['color'] ='gray'; break;
				case 'grisclair' : obj['color'] ='darkgray'; break;
				case 'vertpale' : obj['color'] ='palegreen'; break;
				case 'noir' : obj['color'] ='black'; break;
				case '//' :  obj['tepLengthCode'] ='//'; break;
				default : {
					//color hexa value
					if( attsArr[i].charAt(0)=='#' ) {
						obj['color'] = attsArr[i].substr(1);
					} 
				}
				
/*
not supported (as I know : Keops) -> warning message ? : 
car-4,car-3,car-2,car-1,car+1,car+2,car+3,car+4 to decrease (-) or increase (+) font size : text or names
gras, italique  for bold / italic
dec0, dec1, dec2 ... dec10 to set number (0,1,2 ...) of decimal digits for a text rendering values
blinde to avoid deletion with mouse -> set to fixe here 
stop  to see construction step by step from stop tag to stop tag
static to avoid locus calculus when useless

to be implementedd / found for JSXGraph:
(x,y) : to set position of the name or of object with no geometrical position (reel, entier ...)
aimantage aimante le point sur la grille du repère (même invisible)
aimantage5 aimante le point sur les coordonnées multiples de 0.2 (1/5)
aimantage10 aimante le point sur les coordonnées multiples de 0.1 (1/10)
p1 to show dash to localizepour coordinates of a point in the frame
coord, coordx, coordy to show coordinates values near axis
animation (anime,oscille,anime1,oscille1,oscille2) for "reel"/"entier" to drive animation
r to draw direct angle (0° à 360°) and not only moduls angle to 0° à 180° direct or not.
*/
			}
        }
        return obj;
    };


    JXG.Math.carre = function(x) {
        return x*x;
    };
        
    /*
     * Now, the constructions of TeP elements follow
     */
    this.tepElements = [
            // points
            "point", "pointsur", "intersection", "projete", "barycentre", "image", "milieu",
            // lines
            "segment", "droite", "droiteEQR", "droiteEQ", "mediatrice", "parallele", "bissectrice", "perpendiculaire", "tangente",
            "vecteur",
            // circles
            "cercle", "cerclerayon","arc","angle",
            // polygons
            "polygone",
            // other
            "texte", "reel", "entier", "fonction",
            // transformations
            "homothetie", "reflexion", "rotation", "symetrie", "translation"
            ];
            
    /*
     * Points 
     */
    this.point = function(parents, attributes) {
		//console.log('point :',parents," @ ",attributes);
        if (parents.length==0) {
            return this.board.create('point', [Math.random(),Math.random()], this.handleAtts(attributes));
        } else {
            return this.board.create('point', parents, this.handleAtts(attributes));
        }
    };

    this.pointsur = function(parents, attributes) {
        var p1, p2, c, lambda, par3;

        par3 = parents[parents.length-1];
        if (JXG.isNumber(par3)) {
            lambda = function(){ return par3; };
        } else {
            lambda = function(){ return par3.Value(); };
        }
        
        if (parents.length==3) {        // point between two points
            p1 = parents[0];
            p2 = parents[1];
			var slideObj = this.board.create('line', [p1,p2], {visible:false, withLabel:false});
			return this.board.create('glider', [
					p1.X()+(p2.X()-p1.X())*lambda(),p1.Y()+(p2.Y()-p1.Y())*lambda(), slideObj
					],
                    this.handleAtts(attributes) 
			);
        } else if (parents.length==2) {   // point on segment
            if (parents[0].elementClass==JXG.OBJECT_CLASS_LINE) {
                p1 = parents[0].point1;
                p2 = parents[0].point2;
                return this.board.create('glider', [
                    p1.X()+(p2.X()-p1.X())*lambda(),p1.Y()+(p2.Y()-p1.Y())*lambda(), parents[0]
                    ],
                    this.handleAtts(attributes)
                );
            } else {                      // point on circle
                c = parents[0];
                return this.board.create('glider', [
                    c.midpoint.X()+c.Radius()*Math.cos(lambda()), c.midpoint.Y()+c.Radius()*Math.sin(lambda()), c
                    ],
                    this.handleAtts(attributes)
                );				
            }
            
        }
        return el;
    };


    this.intersection = function(parents, attributes) {
        if (parents.length==2) {  // line line
            return this.board.create('intersection', [parents[0],parents[1],0], this.handleAtts(attributes));
        } else if (parents.length==3) {
            if (JXG.isNumber(parents[2])) {  // line circle
                parents[2] -= 1;
                return this.board.create('intersection', parents, this.handleAtts(attributes));
            } else {
                return this.board.create('otherintersection', parents, this.handleAtts(attributes));
            }
        }
    }
    
    this.projete = function(parents, attributes) {
        var lpar;
        if (parents.length == 2) {          // orthogonal projection
            return this.board.create('orthogonalprojection', parents, this.handleAtts(attributes));
        } else {                             // parallel projection along parents[2]
            lpar = this.board.create('parallel', [parents[2], parents[0]], {visible:false, withLabel:false});
            return this.board.create('intersection', [parents[1], lpar, 0], this.handleAtts(attributes));
        }
    }

    this.barycentre = function(parents, attributes) {
        return this.board.create('point', [
            function() {
                var i, s = 0, le = parents.length, x = 0.0;
                for (i=0; i<le; i+=2) {
                    x += parents[i].X()*parents[i+1];
                    s += parents[i+1];
                }
                return x/s;
            },
            function() {
                var i, s = 0, le = parents.length, y = 0.0;
                for (i=0; i<le; i+=2) {
                    y += parents[i].Y()*parents[i+1];
                    s += parents[i+1];
                }
                return y/s;
            }
        ], this.handleAtts(attributes));
    }
    
    this.image = function(parents, attributes) {
        return this.board.create('point', [parents[1], parents[0]], this.handleAtts(attributes));
    }
    
    this.milieu = function(parents, attributes) {
        return this.board.create('midpoint', parents, this.handleAtts(attributes));
    }

    /*
     * Lines
     */
    this.segment = function(parents, attributes) {
		var handleAtts = this.handleAtts(attributes);
		var s = this.board.create('segment', parents, handleAtts);
		//enconding
		// /, //, ///, \, \\, \\\, x, o : to code length or middle
		// pb with // /// \ \\ \\\
			var p = this.board.create('midpoint',[s.point1,s.point2], {visible:false, withLabel:false});
			var sq = [];
			if(attributes.indexOf("/")>=0) {
				sq[0] = this.board.create('point',[0,-0.2], {fixed:true, visible:false, withLabel:false});
				sq[1] = this.board.create('point',[0,0.2], {fixed:true, visible:false, withLabel:false});
				tt = this.board.create('transform',[function() { return p.X();}, function() { return p.Y();}], {type:"translate"});
				tr = this.board.create('transform',[function() { return s.getAngle()+0.79;},p],{type:'rotate'});
				tt.bindTo(sq);
				tr.bindTo(sq);			
				var c = this.board.create('segment',sq, handleAtts); 
				c.setAttribute({withLabel:false,name:""});
			}
			if(attributes.indexOf("//")>=0) {
				sq[0] = this.board.create('point',[-0.1,-0.2], {fixed:true, visible:false, withLabel:false});
				sq[1] = this.board.create('point',[-0.1,0.2], {fixed:true, visible:false, withLabel:false});
				sq[2] = this.board.create('point',[0.1,-0.2], {fixed:true, visible:false, withLabel:false});
				sq[3] = this.board.create('point',[0.1,0.2], {fixed:true, visible:false, withLabel:false});
				tt = this.board.create('transform',[function() { return p.X();}, function() { return p.Y();}], {type:"translate"});
				tr = this.board.create('transform',[function() { return s.getAngle()+0.79;},p],{type:'rotate'});
				tt.bindTo(sq);
				tr.bindTo(sq);			
				var c = this.board.create('segment',sq.slice(0,2),handleAtts ); 
				c.setAttribute({withLabel:false,name:""});
				c = this.board.create('segment',sq.slice(2), handleAtts); 
				c.setAttribute({withLabel:false,name:""});
			}
			if(attributes.indexOf("///")>=0) {
				sq[0] = this.board.create('point',[-0.15,-0.2], {fixed:true, visible:false, withLabel:false});
				sq[1] = this.board.create('point',[-0.15,0.2], {fixed:true, visible:false, withLabel:false});
				sq[2] = this.board.create('point',[0,-0.2], {fixed:true, visible:false, withLabel:false});
				sq[3] = this.board.create('point',[0,0.2], {fixed:true, visible:false, withLabel:false});
				sq[4] = this.board.create('point',[0.15,-0.2], {fixed:true, visible:false, withLabel:false});
				sq[5] = this.board.create('point',[0.15,0.2], {fixed:true, visible:false, withLabel:false});
				tt = this.board.create('transform',[function() { return p.X();}, function() { return p.Y();}], {type:"translate"});
				tr = this.board.create('transform',[function() { return s.getAngle()+0.79;},p],{type:'rotate'});
				tt.bindTo(sq);
				tr.bindTo(sq);			
				var c = this.board.create('segment',sq.slice(0,2),handleAtts ); 
				c.setAttribute({withLabel:false,name:""});
				c = this.board.create('segment',sq.slice(2,4), handleAtts); 
				c.setAttribute({withLabel:false,name:""});
				c = this.board.create('segment',sq.slice(4), handleAtts); 
				c.setAttribute({withLabel:false,name:""});
			}
			if(attributes.indexOf("x")>=0) {
				sq[0] = this.board.create('point',[0,-0.2], {fixed:true, visible:false, withLabel:false});
				sq[1] = this.board.create('point',[0,0.2], {fixed:true, visible:false, withLabel:false});
				sq[2] = this.board.create('point',[-0.2,0], {fixed:true, visible:false, withLabel:false});
				sq[3] = this.board.create('point',[0.2,0], {fixed:true, visible:false, withLabel:false});
				tt = this.board.create('transform',[function() { return p.X();}, function() { return p.Y();}], {type:"translate"});
				tr = this.board.create('transform',[function() { return s.getAngle()+0.79;},p],{type:'rotate'});				
				tt.bindTo(sq);
				tr.bindTo(sq);			
				var c = this.board.create('segment',sq.slice(0,2),handleAtts ); 
				c.setAttribute({withLabel:false,name:""});
				c = this.board.create('segment',sq.slice(2), handleAtts); 
				c.setAttribute({withLabel:false,name:""});
			}
			if(attributes.indexOf("o")>=0) {
				var c = this.board.create('circle',[p,0.15], handleAtts);
				c.setAttribute({fillOpacity:0,strokeWidth:1,withLabel:false});
			}
		//
        return s;
    };

    this.droite = function(parents, attributes) {
        return this.board.create('line', parents, this.handleAtts(attributes));
    };

    this.droiteEQR = function(parents, attributes) {
        return this.board.create('line', [parents[2], parents[0], parents[1]], this.handleAtts(attributes));
    };
    
    this.droiteEQ = function(parents, attributes) {
        return this.board.create('line', [1.0, parents[0], parents[1]], this.handleAtts(attributes));
    };

    this.parallele = function(parents, attributes) {
        return this.board.create('parallel', [parents[1], parents[0]], this.handleAtts(attributes));
    };

    this.mediatrice = function(parents, attributes) {
        var m, li, el; 
        if (parents.length==1) {
            m = this.board.create('midpoint', [parents[0]], {visible:false, withLabel:false});
            el = this.board.create('perpendicular', [parents[0], m], this.handleAtts(attributes));
        } else {
            li = this.board.create('line', parents, {visible:false, withLabel:false});
            m = this.board.create('midpoint', parents, {visible:false, withLabel:false});
            el = this.board.create('perpendicular', [li, m], this.handleAtts(attributes));
        }
        return el;
    };

    this.perpendiculaire = function(parents, attributes) {
		
		var isRightAngleToShow=true;
		//q0 : c=-1 : no right angle shown
		//q1 ! c=0  : quadrant I (default)
		//q2 ! c=1.57  : quadrant II
		//q3 ! c=3.14  : quadrant III
		//q4 ! c=4.71  : quadrant IV
		if(attributes.indexOf("q0")>=0) {
			isRightAngleToShow=false;
		} else if(attributes.indexOf("q2")>=0) {
			function correction() { return 1.57;};
		} else if(attributes.indexOf("q3")>=0) {
			function correction() { return 3.14;};
		} else if(attributes.indexOf("q4")>=0) {
			function correction() { return 4.71;};
		} else function correction() { return 0;};
		if(isRightAngleToShow) {
			var p = this.board.create('perpendicularpoint',[parents[1],parents[0]], {visible:false, withLabel:false});
			var sq = [];
			sq[0] = this.board.create('point',[0,0], {fixed:true, visible:false, withLabel:false});
			sq[1] = this.board.create('point',[0.3,0], {fixed:true, visible:false, withLabel:false});
			sq[2] = this.board.create('point',[0.3,0.3], {fixed:true, visible:false, withLabel:false});
			sq[3] = this.board.create('point',[0,0.3], {fixed:true, visible:false, withLabel:false});
			tt = this.board.create('transform',[function() { return p.X();}, function() { return p.Y();}], {type:"translate"});
			tr = this.board.create('transform',[function() { return parents[1].getAngle()+correction();},p],{type:'rotate'});
			tt.bindTo(sq);
			tr.bindTo(sq);			
			var pol = this.board.create('polygon',sq,
				{color:"green",strokeColor:"green",fillOpacity:0,highlightFillOpacity:0}
				);        
		}
        return this.board.create('perpendicular', [parents[1], parents[0]], this.handleAtts(attributes));
    };

    this.bissectrice = function(parents, attributes) {
        return this.board.create('bisector', parents, this.handleAtts(attributes));
    };

    this.tangente = function(parents, attributes) {
        var gli,
            f = parents[0],
            x = parents[1];
            
        if (JXG.isNumber(parents[1])) {
            x = parents[1];
            gli = this.board.create('glider', [x, f.Y(x), f], {fixed:true, visible:false, withLabel:false});
            return this.board.create('tangent', [f, gli], this.handleAtts(attributes));
        } else if (JXG.exists(parents[1].Value)) {
            // Fake glider: it needs the properties "position" and "slideObject".
            gli = this.board.create('point', 
                [function(){ this.position = x.Value(); return x.Value(); }, function(){ return f.Y(x.Value()); }], 
                {visible:false, withLabel:false});
            gli.slideObject = f;
            return this.board.create('tangent', [f, gli], this.handleAtts(attributes));
        } else {
            // Fake glider: it needs the properties "position" and "slideObject".
            gli = this.board.create('point', 
                [function(){ this.position = x.X(); return x.X(); }, function(){ return f.Y(x.X()); }], 
                {visible:false, withLabel:false});
            gli.slideObject = f;
            return this.board.create('tangent', [f, gli], this.handleAtts(attributes));
        }
    };

    this.vecteur = function(parents, attributes) {
        return this.board.create('arrow', parents, this.handleAtts(attributes));
    };

    
    /* 
     * Circles
     */
    this.cercle = function(parents, attributes) {
        return this.board.create('circle', parents, this.handleAtts(attributes));
    };

    this.cerclerayon = function(parents, attributes) {
        return this.board.create('circle', parents, this.handleAtts(attributes));
    };

	this.angle = function(parents, attributes) {
		
		function angleSaillant0x() {
			if(JXG.Math.Geometry.angle(parents[0],parents[1],parents[2])>=0) {
				return parents[0].X()
			} else {
				return parents[2].X()
			}
		}
		
		function angleSaillant0y() {
			if(JXG.Math.Geometry.angle(parents[0],parents[1],parents[2])>=0) {
				return parents[0].Y()
			} else {
				return parents[2].Y()
			}
		}

		function angleSaillant2x() {
			if(JXG.Math.Geometry.angle(parents[0],parents[1],parents[2])>=0) {
				return parents[2].X()
			} else {
				return parents[0].X()
			}
		}
		
		function angleSaillant2y() {
			if(JXG.Math.Geometry.angle(parents[0],parents[1],parents[2])>=0) {
				return parents[2].Y()
			} else {
				return parents[0].Y()
			}
		}
		
		if(attributes.indexOf("r")>=0) {
			return this.board.create('angle', parents , this.handleAtts(attributes));
		} else {
			var tripoint= [];
			tripoint[0] = this.board.create('point', [angleSaillant0x,angleSaillant0y], { visible:false, withLabel:false});
			tripoint[1] = parents[1];
			tripoint[2] = this.board.create('point', [angleSaillant2x,angleSaillant2y], { visible:false, withLabel:false});
			return this.board.create('angle', tripoint , this.handleAtts(attributes));
		}
	}
    
	this.arc = function(parents, attributes) {				
		return this.board.create('arc', parents, this.handleAtts(attributes));
	}
    

    /*
     * Polygons
     */
    this.polygone = function(parents, attributes) {
        return this.board.create('polygon', parents, this.handleAtts(attributes));
    };

    /*
     * Other
     */
    this.texte = function(parents, attributes) {
        return this.board.create('text', parents, this.handleAtts(attributes));
    };

    this.reel = function(parents, attributes) {
        var atts = this.handleAtts(attributes);
        atts["snapWidth"] = parents[3];
		this.reelPosition.x-=5;
		if(this.reelPosition.x<=-10) {
			this.reelPosition.x=10;
			this.reelPosition.y-=3;
		}
        return this.board.create('slider', [
		    [this.reelPosition.x,this.reelPosition.y],
			[this.reelPosition.x+3,this.reelPosition.y], 
			[parents[1], parents[0], parents[2]]
			], atts);
    };
    
    this.entier = function(parents, attributes) {
        return this.reel(parents, attributes);
    };
 
    this.fonction = function(parents, attributes) {
        var f = new Function("x", "return " + parents[0]);
        return this.board.create('functiongraph', [f], this.handleAtts(attributes));
    };
	
    /*
     * Transformations
     */
    
	// /!\ Similitude is missing !
	
    this.homothetie = function(parents, attributes) {
        var c = parents[0], a = parents[1];
        if (JXG.isNumber(a)) {
            return this.board.create('transform', 
                [1, 0, 0, 
                 function(){ return (-a+1)*c.X(); }, a, 0,
                 function(){ return (-a+1)*c.Y(); }, 0, a], 
                 {type:'generic'});
        } else {  // Slider
            return this.board.create('transform', 
                [1, 0, 0, 
                 function(){ return (-a.Value()+1)*c.X(); }, function(){ return a.Value();}, 0,
                 function(){ return (-a.Value()+1)*c.Y(); }, 0, function(){ return a.Value();}], 
                 {type:'generic'});
        }
    };

    this.symetrie = function(parents, attributes) {
        if (parents.length==1 && JXG.isPoint(parents[0])) {
            return this.board.create('transform', [Math.PI, parents[0]], {type:'rotate'});
        }
    };

    this.reflexion = function(parents, attributes) {
        return this.board.create('transform', [parents[0]], {type:'reflect'});
    };

    this.rotation = function(parents, attributes) {
        var a = parents[1];
        if (JXG.isNumber(a)) {  
            a = (Math.PI*a)/180.0;
            return this.board.create('transform', [a, parents[0]], {type:'rotate'});
        } else {  // slider
            return this.board.create('transform', [function(){ return (Math.PI*a.Value())/180.0;}, parents[0]], {type:'rotate'});
        }
    };

    this.translation = function(parents, attributes) {
        if (parents.length==1) {
            return this.board.create('transform', [
                function(){ return parents[0].point2.X()-parents[0].point1.X(); }, 
                function(){ return parents[0].point2.Y()-parents[0].point1.Y(); }
                ], {type:'translate'});
        } else {
            return this.board.create('transform', [                
                function(){ return parents[1].X()-parents[0].X(); }, 
                function(){ return parents[1].Y()-parents[0].Y(); }
                ], {type:'translate'});
        }
    };


};
