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

/* E.Ostenne notes :

@figure : objects 
###################
- intersection &  segment/halfline : intersection mod for point out of [AB), (BA] or [AB] that should not exist : done with a "clone" point
- segmentlong : pb with second parameter which does not exist (even maybe the first) that have to be created by the way before segment construction.
				where to deselect "undefined" set for parents set ?

@figure : Objects options : { option1,otpion2 }
###############################################
- options with pb (with operator)  : replacement in prepareString() !
- aimantage,aimantage5,aimantage10 : simulation to avoid mouse event override ... -> see board.options.grid.snapToGrid for aimante();

Open:
-----
- not supported (as far as I know : E.Ostenne) -> warning message ? : 
dec0, dec1, dec2 ... dec10 to set number (0,1,2 ...) of decimal digits for a text rendering values
blinde to avoid deletion with mouse -> set to fixe here cause useless in jsxgraph
stop  to see construction step by step from stop tag to stop tag
static to avoid locus calculus when useless : useless in jsxgraph

- to be implementedd / tested / found for JSXGraph:
animation (anime,oscille,anime1,oscille1,oscille2) for "reel"/"entier" to drive animation

Fixed:
-----
(x,y) : to set position of the name or of object with no geometrical position (reel, entier ...)  # fixed for reel and entier AW; 

@options : Objects options : { option1,otpion2 }
###############################################

- not supported at that time :
repere/repereortho : 
    num1 (ok) but num2, num3, num4, num5, num10 & num20 not supported : to skip ticks label and only view some (step 2,3,4,5,10,20)
	petit moyen grand : font size for ticks label
fond (for image placement) :
    xpix,ypix not supported : to associate instead of top-left point another point in the picture to jsx coordinates for placement
angles units : how to set degrees ?

- to be implemented for JSXGraph :
etat : (useful) keyboard to change options for a group of objects
pilote : (useless : rare cause in test -> Interactive Whiteboard : for accuracy ) to drive points movements with keyboards'cursors (object selected by keyboard association)
*/



JXG.TracenpocheReader = new function() {
	
	aimantageList = new Array();
	animationList = new Array();
	animepoint = null;
	timeoutCaller = null;
	
	this.aimantage = function() {
		var loc;
		for(var i=0;i<aimantageList.length;i++) {
			loc=aimantageList[i];
			loc[0].setPosition( JXG.COORDS_BY_USER,
				  Math.round(loc[0].X()/loc[1])*loc[1],
				  Math.round(loc[0].Y()/loc[1])*loc[1]
			);
		}
	}
	
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
                            (c >= '0' && c <= '9') || (c === "'") || c === '_') {
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
                if (result.length>0 
                    && result[result.length-1].type == 'name' 
                    && result[result.length-1].value != 'var' 
                    && result[result.length-1].value != 'for' 
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
                    // Convert the string value to a number. If it is finite, then it is a good token.
                    n = +str;          
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
        
    this.parseOptions = function() {
        //var code, i, len = script.length;
       
       // Analyze this.data for "@options;"
        // Just for testing.
        var start = this.data.indexOf('@options;');
        if (start<0) {
    	    this.board.setBoundingBox([-10,10,10,-10], true);
	        this.board.create('axis', [[0, 0], [1, 0]]);
        	this.board.create('axis', [[0, 0], [0, 1]]);
            return;             // no figure found
        }
        
        start += 9;                 // skip string "@figure;"
        var i2 = this.data.indexOf('@',start+1);
        if (i2<0) { i2 = this.data.length; }

        
        /*for (i=start+1; i<i2; i++) {
            code = script[i];
            if (code=='') continue;

            if (code.match(/@/)) {   // Reached the end of the options section
                //return i-1;
            }
            console.log("OPT>", code);
            // Read options:
        }
        */
		var tokens = this.tokenize(this.data.slice(start, i2), '=<>!+-*&|/%^#', '=<>&|');
        var s = this.parse(tokens, 'opt');
		var opt={};
		//console.log("s :",s);
		if(s!='') {
			//console.log(s);
        	var fun = new Function("that", "opt", s);
        	//console.log(fun.toString());
        	fun(this, opt);	
			//
		} else {
			this.board.setBoundingBox([-10,10,10,-10], true);
    	    this.board.create('axis', [[0, 0], [1, 0]]);
       		this.board.create('axis', [[0, 0], [0, 1]]);
		}
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
                console.log("Add scope find " + n);            
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
                console.log("Add scope pop " + this.parent);            
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
            } else if (a === "string" || a === "number") {
                o = symbol_table["(literal)"];
                // a = "literal";
            } else {
                error(t, "Unexpected token.");
            }
            token = createObject(o);
            token.from  = t.from;
            token.to    = t.to;
            token.value = v;
			//console.log("advance :"+token.value);
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
                 // find the name of the variable which will be assigned.
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
        infix("%", 85, function (left) {  // Actually this is a postfix operator e.g. 10%
                this.first = left;
                return this.first + '*0.01';
        });

        // This is for pointaimante
        infix("_", 10, function (left) {  
                this.first = left;
                this.second = expression(10);
//console.log( '[' + this.first + ',' + this.second + ']');
                return '[' + this.first + ',' + this.second + ']';
        });
        //infix(",", 9);

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
            var a = [], n, crds = [];
            if (token.id !== "}") {
                while (true) {
                    // Ignore
                    n = token;
                    if (n.value == '(') {
                        advance();
                        if (token.id !== ")") {
                            while (true) {
                                crds.push(expression(0));
                                if (token.id !== ",") {
                                    break;
                                }
                                advance(",");
                            }
                        }
                        advance(")"); 
                        a.push( "'(" + crds.join(",") + ")'" );                       
                    } else {
                    //if (n.arity !== "name"/* && n.arity !== "literal"*/) {
                    //    error(token, "Bad property name.");
                    //}
                        a.push( "'" + n.value + "'");
                        advance();
                    }
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
		//KEOPS
		var st = statements();
		if(st==null) { 
			var s = '';
		} else {
        	var s = st.join('\n');
		}
//console.log(s);        
        return s;
    };
    
    this.parseData = function(board) {
        this.board = board;
        this.parseOptions();
        this.parseFigure();
    };

    this.parseFigure = function() {
        var i = this.data.indexOf('@figure;');
        if (i<0) {
            return;             // no figure found
        }
        
        i += 8;                 // skip string "@figure;"
        var i2 = this.data.indexOf('@',i+1);
        if (i2<0) { i2 = this.data.length; }
        
        var tokens = this.tokenize(this.data.slice(i, i2), '=<>!+-*&|/%^#', '=<>&|');
        var s = this.parse(tokens, 'tep');
        var tep = {};
		//to store last render position of "reel"/"entier" tep object
		//initial position to get from board BoundingBox ...
        this.reelPosition = {x:13,y:-9};
        
        // Set the default options
        this.board.options.point.face = 'x';
        this.board.options.point.strokeColor = '#0000ff';
        this.board.options.point.strokeWidth = 1;
        this.board.options.line.strokeWidth = 1;
		
		// Aimantage for points
		this.board.addHook(this.aimantage,'mouseup');

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
		//
		//replace options car-4, car-3 ... car+3, car+4 par jsxtepcarm4, jsxtepcarm3, ... jsxtepcarp3 , jsxtepcarp4
		fileStr = fileStr.replace('car-','jsxtepcarm');
		fileStr = fileStr.replace('car+','jsxtepcarp');
		//segment length encoding
		fileStr = fileStr.replace("\\\\\\",'jsxtepanti3');
		fileStr = fileStr.replace("\\\\",'jsxtepanti2');
		fileStr = fileStr.replace("\\",'jsxtepanti1');
		fileStr = fileStr.replace("///",'jsxtepsur3');
		fileStr = fileStr.replace("//",'jsxtepsur2');
		//
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
        var obj = {}, i, couleur, fontSize, le = attsArr.length, arr;
        
        // The last entry is the name of the element.
        if (le>0) {
            obj["name"] = attsArr[le-1];
        }

		//console.log("atts:",attsArr);
		// q0, q1,q2,q3,q4 to show right angle -> see perpendiculaire
		// /, //, ///, \, \\, \\\, x, o : to code length or middle -> cf segment
		//                                problem with string // /// \ \\ \\\
		//gras, italique  for bold, italic set to text not to each named object ! use html capabilities : <b>...</b> <i>...</i>
		//aimantage, 5, 10 : see point 
		//r for angle : see angle
		//car-4...car+4 : replaced by jsxtepcarm4 ... jsxtepcarp4
		
        //default values
		obj["withLabel"] = true;
		obj["strokeColor"] = 'blue';
		//
        for (i=0; i<le; i++) {
			switch (attsArr[i]) {
				case 'jsxtepcarm4' : fontSize = 8; break;
				case 'jsxtepcarm3' : fontSize = 9; break;
				case 'jsxtepcarm2' : fontSize = 10; break;
				case 'jsxtepcarm1' : fontSize = 11; break;
				case 'jsxtepcarp1' : fontSize = 13; break;
				case 'jsxtepcarp2' : fontSize = 14; break;
				case 'jsxtepcarp3' : fontSize = 15; break;
				case 'jsxtepcarp4' : fontSize = 16; break;
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
				case 'blanc' : couleur ='white'; break;
				case 'jaune' : couleur ='yellow'; break;
				case 'jauneclair' : couleur ='lightyellow'; break;
				case 'kakiclair' : couleur ='yellowgreen'; break;
				case 'jaunepaille' : couleur ='darkkhaki'; break;
				case 'rose' : couleur ='pink'; break;
				case 'saumon' : couleur ='salmon'; break;
				case 'orange' : couleur ='orange'; break;
				case 'rougeclair' : couleur ='palevioletred'; break;
				case 'rouge' : couleur ='red'; break;
				case 'vertclair' : couleur ='lime'; break;
				case 'vert' : couleur ='green'; break;
				case 'vertfonce' : couleur ='darkgreen'; break;
				case 'kaki' : couleur ='olive'; break;
				case 'sapin' : couleur ='springgreen'; break;
				case 'marron' : couleur ='maroon'; break;
				case 'brique' : couleur ='firebrick'; break;
				case 'marronfonce' : couleur ='saddlebrown'; break;
				case 'violetfonce' : couleur ='darkviolet'; break;
				case 'rougefonce' : couleur ='darkred'; break;
				case 'cyan' : couleur ='cyan'; break;
				case 'bleuciel' : couleur ='skyblue'; break;
				case 'bleuocean' : couleur ='aqua'; break;
				case 'bleu' : couleur ='blue'; break;
				case 'bleufonce' : couleur ='darkblue'; break;
				case 'violet' : couleur ='blueviolet'; break;
				case 'gris' : couleur ='gray'; break;
				case 'grisclair' : couleur ='darkgray'; break;
				case 'vertpale' : couleur ='palegreen'; break;
				case 'noir' : couleur ='black'; break;
				case '/' :  obj['tepLengthCode'] =1; break;
				case 'jsxtepsur1' :  obj['tepLengthCode'] =1; break;
				case 'jsxtepsur2' :  obj['tepLengthCode'] =2; break;
				case 'jsxtepsur3' :  obj['tepLengthCode'] =3; break;
				case 'jsxtepanti1' :  obj['tepLengthCode'] =-1; break;
				case 'jsxtepanti2' :  obj['tepLengthCode'] =-2; break;
				case 'jsxtepanti3' :  obj['tepLengthCode'] =-3; break;
				case 'x' :  obj['tepLengthCode'] =10; break;
				case 'o' :  obj['tepLengthCode'] =11; break;
				case 'anime1' : obj['tepanime'] = 2; break;
				case 'anime' : obj['tepanime'] = 1; break;
				case 'oscille1' : obj['tepanime'] = 4; break;
				case 'oscille2' : obj['tepanime'] = 5; break;
				case 'oscille' : obj['tepanime'] = 3; break;
				default : {
					//color hexa value
					if( attsArr[i].charAt(0)=='#' ) {
						couleur = attsArr[i].substr(1);
					} else if (attsArr[i].charAt(0)=='(' ) {
                        arr = attsArr[i].substring(1, attsArr[i].length-1).split(',');
                        arr[0] = parseFloat(arr[0]);
                        arr[1] = parseFloat(arr[1]);
                        obj['coords'] = arr;
                    }
				}		
			}
        }
		//for label/text with line
		if( couleur!=undefined ) {
			obj["strokeColor"]=couleur;
			if(obj["label"]==undefined) { obj["label"]={}; };
			obj["label"]["Color"]=couleur;
		}
		if( fontSize!=undefined) {
			obj["fontSize"]=fontSize;
			if(obj["label"]==undefined) { obj["label"]={}; };
			obj["label"]["fontSize"]=fontSize;
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
            "point", "pointsur", "intersection", "projete", "barycentre", "image", "milieu", "pointaimante",
            // lines
            "segment", "segmentlong", "droite", "droiteEQR", "droiteEQ", "mediatrice", "parallele", "bissectrice", "perpendiculaire", "tangente",
            "demidroite", "vecteur",
            // circles
            "cercle", "cerclerayon", "cercledia", "arc","angle",
            // polygons
            "polygone",
            // other
            "texte", "reel", "entier", "fonction",
            // transformations
            "homothetie", "reflexion", "rotation", "similitude", "symetrie", "translation",			
			//@options,
			"repere", "repereortho", "grille", "trame", "aimante", "fond", "etat", "chgt_etat_bloc", "degres", "radians", "pilote"
            ];
            
    /*
     * Points 
     */
	 
	this.pointCoordshow = function(el, attributes,handledAtt) {
		//point option p1 : lines for coord visibility		
		//point option coordx,coordy, coord
		if(attributes.indexOf("p1")>=0) {
			var p1,p2;
			p1=this.board.create('point',[
				function() { return el.X(); },
				0,
				],{visible:false});
			p2=this.board.create('point',[
				0,
				function() { return el.Y(); },
				],{visible:false});
			this.board.create('segment',[p1,el],{strokeWith:2,strokeColor:"gray",dash:1});
			this.board.create('segment',[p2,el],{strokeWith:2,strokeColor:"gray",dash:1});
		}
		if(attributes.indexOf("coordx")>=0) {
			this.board.create('text',[
				function() { return el.X(); },
				function () {var c= this.board.getBoundingBox(); return  (c[3]-c[1])*20/this.board.canvasHeight; },
				function() { return Math.round(el.X()*100)/100;}]
				,handledAtt); 
		}
		if(attributes.indexOf("coordy")>=0) {
			this.board.create('text',[
				function() { var c= this.board.getBoundingBox(); return  (c[2]-c[0])*20/this.board.canvasWidth;},
				function () {  return el.Y(); },
				function() { return Math.round(el.Y()*100)/100;}]
				,handledAtt); 
		}
		if(attributes.indexOf("coord")>=0) {
			this.board.create('text',[
				function() { return el.X(); },
				function () {var c= this.board.getBoundingBox(); return  (c[3]-c[1])*20/this.board.canvasHeight; },
				function() { return Math.round(el.X()*100)/100;}]
				,handledAtt); 
			this.board.create('text',[
				function() { var c= this.board.getBoundingBox(); return  (c[2]-c[0])*20/this.board.canvasWidth;},
				function () {  return el.Y(); },
				function() { return Math.round(el.Y()*100)/100;}]
				,handledAtt); 
		}
	}

	this.point = function(parents, attributes) {
		//console.log('point :',parents," @ ",attributes);
		var el,opt;
		opt = this.handleAtts(attributes);
        if (parents.length==0) {
            el = this.board.create('point', [Math.random(),Math.random()], opt);
        } else {
            el = this.board.create('point', parents, opt);
        }
		if(attributes.indexOf("aimantage")>=0) {
			aimantageList.push([el,1]);	 
		} else if(attributes.indexOf("aimantage5")>=0) {
			aimantageList.push([el,5]);	 
		} else if(attributes.indexOf("aimantage10")>=0) {
			aimantageList.push([el,10]);	 
		}
		this.pointCoordshow(el,attributes,opt);		
		return el;
	};

    this.pointsur = function(parents, attributes) {
        var p1, p2, c, lambda, par3, el, isFree,opt;
		
        par3 = parents[parents.length-1];
        if (JXG.isNumber(par3)) {
            lambda = function(){ return par3; };
            isFree = true;
        } else {
            lambda = function(){ return par3.Value(); };
            isFree = false;
        }
        opt=this.handleAtts(attributes);
        if (parents.length==3) {        // point between two points
            p1 = parents[0];
            p2 = parents[1];
			var slideObj = this.board.create('line', [p1,p2], {visible:false, withLabel:false});
            if (isFree) {
                el = this.board.create('glider', [
					p1.X()+(p2.X()-p1.X())*lambda(),p1.Y()+(p2.Y()-p1.Y())*lambda(), slideObj
					],
                    opt 
                );
            } else {
                // Fake glider: it needs the properties "position" and "slideObject".
                el = this.board.create('point', [
                    function(){ this.position = lambda(); return p1.X()+(p2.X()-p1.X())*lambda();},
                    function(){ return p1.Y()+(p2.Y()-p1.Y())*lambda();}
					],
                    opt 
                );
                el.slideObject = slideObj;
            }
        } else if (parents.length==2) {   // point on segment
            if (parents[0].elementClass==JXG.OBJECT_CLASS_LINE) {
                p1 = parents[0].point1;
                p2 = parents[0].point2;
                if (isFree) {
                    el = this.board.create('glider', [
                        p1.X()+(p2.X()-p1.X())*lambda(),p1.Y()+(p2.Y()-p1.Y())*lambda(), parents[0]
                        ],
                        this.handleAtts(attributes)
                    );
                } else {
                    // Fake glider: it needs the properties "position" and "slideObject".
                    el = this.board.create('point', [
                        function(){ this.position = lambda(); return p1.X()+(p2.X()-p1.X())*lambda();},
                        function(){ return p1.Y()+(p2.Y()-p1.Y())*lambda();}
                        ],
                        opt 
                    );
                    el.slideObject = parents[0];
                }
            } else {                      // point on circle
                c = parents[0];
                if (isFree) {
                    el = this.board.create('glider', [
                        c.center.X()+c.Radius()*Math.cos(lambda()), c.midpoint.Y()+c.Radius()*Math.sin(lambda()), c
                        ],
                        opt
                    );
                } else {	
                    // Fake glider: it needs the properties "position" and "slideObject".			
                    el = this.board.create('point', [
                        function() {return this.position = lambda(); c.midpoint.X()+c.Radius()*Math.cos(lambda());},
                        function() {return c.center.Y()+c.Radius()*Math.sin(lambda());}
                        ],
                        opt
                    );	
                    el.slideObject = c;			
                }
            }
        }
		this.pointCoordshow(el,attributes,opt);				
        return el;
    };


    this.intersection = function(parents, attributes) {
		
		function isInPartLine(line,inter) {
			//return false if intersection inter is not on the halfline line
			var ok = true; //default
			if (line.elementClass==JXG.OBJECT_CLASS_SEGMENT) {
					ok = (JXG.Math.Geometry.isSameDirection(line.point1.coords,line.point2.coords,inter.coords) && 
							JXG.Math.Geometry.isSameDirection(line.point2.coords,line.point1.coords,inter.coords));						
			} else
			if (line.elementClass==JXG.OBJECT_CLASS_LINE) {
				if(line.getAttribute("straightFirst")==false) {
					ok = JXG.Math.Geometry.isSameDirection(line.point1.coords,line.point2.coords,inter.coords);						
				}
				if(line.getAttribute("straightLast")==false) {
					ok = ok && JXG.Math.Geometry.isSameDirection(line.point2.coords,line.point1.coords,inter.coords);						
				}
			}
			return ok;
		}
		
		var el, el1, opt = this.handleAtts(attributes);

		if (parents.length==2) {  // line line
            el = this.board.create('intersection', [parents[0],parents[1],0], {visible:false});
        } else if (parents.length==3) { 
		    // line circle : more than 1 result possible
            if (JXG.isNumber(parents[2])) {  //num set : 1,2
                parents[2] -= 1;
                el = this.board.create('intersection', parents, {visible:false});
            } else { //point to avoid
                el = this.board.create('otherintersection', parents, {visible:false});
            }
        }
		//to demi-droite / half-line cases
		el1 = this.board.create('point',[
			function() { return (el.real || (isInPartLine(parents[0],el) && isInPartLine(parents[1],el)) )?1:0; },
			function() { return el.X(); },
			function() { return el.Y(); }
		], opt);
		//
		this.pointCoordshow(el1,attributes,opt);		
		return el1;
    }
    
    this.projete = function(parents, attributes) {
        var el, opt, lpar;
		opt = this.handleAtts(attributes);
        if (parents.length == 2) {          // orthogonal projection
            el = this.board.create('orthogonalprojection', parents, opt);
        } else {                             // parallel projection along parents[2]
            lpar = this.board.create('parallel', [parents[2], parents[0]], {visible:false, withLabel:false});
            el = this.board.create('intersection', [parents[1], lpar, 0], opt);
        }
		this.pointCoordshow(el,attributes,opt);				
		return el;
    }

    this.barycentre = function(parents, attributes) {
		var el,opt;
		opt = this.handleAtts(attributes);
        el =  this.board.create('point', [
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
        ], opt);
		this.pointCoordshow(el,attributes,opt);				
		return el;
    }
    
    this.image = function(parents, attributes) {
		var el,opt;
		opt = this.handleAtts(attributes);
		el = this.board.create('point', [parents[1], parents[0]], this.handleAtts(attributes));
		this.pointCoordshow(el,attributes,opt);				
		return el;
    }
    
    this.milieu = function(parents, attributes) {
		var el,opt;
		opt = this.handleAtts(attributes);
        el = this.board.create('midpoint', parents, this.handleAtts(attributes));
		this.pointCoordshow(el,attributes,opt);				
		return el;
    }

    this.pointaimante = function(parents, attributes) {
        // CO=6_50%
        // D appartient dAB_50%
        // M sur A_50%
		var el,opt;
		opt = this.handleAtts(attributes);
        el = this.board.create('point', parents.slice(0,2), this.handleAtts(attributes));
		this.pointCoordshow(el,attributes,opt);				
		return el;
    }

    /*
     * Lines
     */
	 
	this.segmentCode = function(parents, attributes) {
		//encoding code length with / or // ...
		var handleAtts = this.handleAtts(attributes);
		var v = handleAtts['tepLengthCode']
		if(v==undefined) { return;}
		var sq = [];
		var p = this.board.create('midpoint', parents, {visible:false, withLabel:false});
		var tt,tr,c;
		switch (v) {
			case -1 :
			case 1 :
				// /
				sq[0] = this.board.create('point',[0,-0.2], {fixed:true, visible:false, withLabel:false});
				sq[1] = this.board.create('point',[0,0.2], {fixed:true, visible:false, withLabel:false});
				tt = this.board.create('transform',[function() { return p.X();}, function() { return p.Y();}], {type:"translate"});
				tr = this.board.create('transform',[function() { return JXG.Math.Geometry.angle([parents[0].X()+10,0],parents[0],parents[1])-v*0.79;},p],{type:'rotate'});
				tt.bindTo(sq);
				tr.bindTo(sq);			
				c = this.board.create('segment',sq, handleAtts); 
				c.setAttribute({withLabel:false,name:""});
				break;
			case -2 :
			case 2 :
				// //
				sq[0] = this.board.create('point',[-0.1,-0.2], {fixed:true, visible:false, withLabel:false});
				sq[1] = this.board.create('point',[-0.1,0.2], {fixed:true, visible:false, withLabel:false});
				sq[2] = this.board.create('point',[0.1,-0.2], {fixed:true, visible:false, withLabel:false});
				sq[3] = this.board.create('point',[0.1,0.2], {fixed:true, visible:false, withLabel:false});
				tt = this.board.create('transform',[function() { return p.X();}, function() { return p.Y();}], {type:"translate"});
				tr = this.board.create('transform',[function() { return JXG.Math.Geometry.angle([parents[0].X()+10,0],parents[0],parents[1])-v*0.39;},p],{type:'rotate'});
				tt.bindTo(sq);
				tr.bindTo(sq);			
				c = this.board.create('segment',sq.slice(0,2),handleAtts ); 
				c.setAttribute({withLabel:false,name:""});
				c = this.board.create('segment',sq.slice(2), handleAtts); 
				c.setAttribute({withLabel:false,name:""});
				break;
			case -3 :
			case 3 : 
				//  ///
				sq[0] = this.board.create('point',[-0.15,-0.2], {fixed:true, visible:false, withLabel:false});
				sq[1] = this.board.create('point',[-0.15,0.2], {fixed:true, visible:false, withLabel:false});
				sq[2] = this.board.create('point',[0,-0.2], {fixed:true, visible:false, withLabel:false});
				sq[3] = this.board.create('point',[0,0.2], {fixed:true, visible:false, withLabel:false});
				sq[4] = this.board.create('point',[0.15,-0.2], {fixed:true, visible:false, withLabel:false});
				sq[5] = this.board.create('point',[0.15,0.2], {fixed:true, visible:false, withLabel:false});
				tt = this.board.create('transform',[function() { return p.X();}, function() { return p.Y();}], {type:"translate"});
				tr = this.board.create('transform',[function() { return JXG.Math.Geometry.angle([parents[0].X()+10,0],parents[0],parents[1])-v*0.79;},p],{type:'rotate'});
				tt.bindTo(sq);
				tr.bindTo(sq);			
				c = this.board.create('segment',sq.slice(0,2),handleAtts ); 
				c.setAttribute({withLabel:false,name:""});
				c = this.board.create('segment',sq.slice(2,4), handleAtts); 
				c.setAttribute({withLabel:false,name:""});
				c = this.board.create('segment',sq.slice(4), handleAtts); 
				c.setAttribute({withLabel:false,name:""});
				break;
			case 10 :
				// x
				sq[0] = this.board.create('point',[0,-0.2], {fixed:true, visible:false, withLabel:false});
				sq[1] = this.board.create('point',[0,0.2], {fixed:true, visible:false, withLabel:false});
				sq[2] = this.board.create('point',[-0.2,0], {fixed:true, visible:false, withLabel:false});
				sq[3] = this.board.create('point',[0.2,0], {fixed:true, visible:false, withLabel:false});
				tt = this.board.create('transform',[function() { return p.X();}, function() { return p.Y();}], {type:"translate"});
				tr = this.board.create('transform',[function() { return JXG.Math.Geometry.angle([parents[0].X()+10,0],parents[0],parents[1])-v*0.79;},p],{type:'rotate'});
				tt.bindTo(sq);
				tr.bindTo(sq);			
				c = this.board.create('segment',sq.slice(0,2),handleAtts ); 
				c.setAttribute({withLabel:false,name:""});
				c = this.board.create('segment',sq.slice(2), handleAtts); 
				c.setAttribute({withLabel:false,name:""});
			break;
			case 11 :
				// o
				c = this.board.create('circle',[p,0.15], handleAtts);
				c.setAttribute({fillOpacity:0,strokeWidth:1,withLabel:false});
				break;
		}
	}
	
    this.segment = function(parents, attributes) {		
		var s = this.board.create('segment', parents, this.handleAtts(attributes));
		this.segmentCode([s.point1,s.point2],attributes);
        return s;
    };

    this.segmentlong = function(parents, attributes) {	
		//simple : A exists or not, B not, v=number 3
		opt=this.handleAtts(attributes)
		//if parents[0] does not exists then creation
		s = this.board.create('segment', parents, opt);
		this.segmentCode([s.point1,s.point2],attributes);
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
        var m, li, el, code; 
        if (parents.length==1) {
            m = this.board.create('midpoint', [parents[0]], {visible:false, withLabel:false});
			code = this.segmentCode([parents[0].point1, m], attributes);
			code = this.segmentCode([m, parents[0].point2], attributes);
			el = this.perpendiculaire([m,parents[0]], attributes);			
        } else {
            li = this.board.create('line', parents, {visible:false, withLabel:false});
            m = this.board.create('midpoint', parents, {visible:false, withLabel:false});
			code = this.segmentCode([parents[0],m], attributes);
			code = this.segmentCode([m, parents[1]], attributes);
			el = this.perpendiculaire([m,li], attributes);			
        }
        return el;
    };

    this.perpendiculaire = function(parents, attributes) {
		
		var h = this.handleAtts(attributes);
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
			var p = this.board.create('orthogonalprojection',[parents[1],parents[0]], {visible:false, withLabel:false});
			var sq = [];
			sq[0] = this.board.create('point',[0,0], {fixed:true, visible:false, withLabel:false});
			sq[1] = this.board.create('point',[0.3,0], {fixed:true, visible:false, withLabel:false});
			sq[2] = this.board.create('point',[0.3,0.3], {fixed:true, visible:false, withLabel:false});
			sq[3] = this.board.create('point',[0,0.3], {fixed:true, visible:false, withLabel:false});
			tt = this.board.create('transform',[function() { return p.X();}, function() { return p.Y();}], {type:"translate"});
			tr = this.board.create('transform',[function() { return parents[1].getAngle()+correction();},p],{type:'rotate'});
			tt.bindTo(sq);
			tr.bindTo(sq);			

			var pol = this.board.create('polygon',sq,{borders:{strokeColor:h["strokeColor"],strokeWidth:h["strokeWidth"]},fillOpacity:0,highlightFillOpacity:0});
			
			/* var pol = this.board.create('polygon',sq,
				{lines:{strokeColor:h["color"],strokeWidth:h["strokeWidth"]},fillOpacity:0,highlightFillOpacity:0}
				);        
			*/
		}
        return this.board.create('perpendicular', [parents[1], parents[0]], h);
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

    this.demidroite = function(parents, attributes) {				
        var dd = this.board.create('line', parents, {straightFirst:false});
		dd.setAttribute(this.handleAtts(attributes));
		return dd;
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

    this.cercledia = function(parents, attributes) {
		var p = this.board.create('midpoint', parents, {visible:false, withLabel:false});		
        return this.board.create('circle', [p,parents[0]], this.handleAtts(attributes));
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
		if(attributes.indexOf("gras")>=0) {
			parents[2]="<b>"+parents[2]+"</b>";
		}
		if(attributes.indexOf("italique")>=0) {
			parents[2]="<i>"+parents[2]+"</i>";
		}
		return this.board.create('text', parents, this.handleAtts(attributes));
    };

    this.reel = function(parents, attributes) {
        var atts = this.handleAtts(attributes),
            x, y, 
			pas=1.0;
        if(parents[3]) {
			atts["snapWidth"] = parents[3];
			pas=parents[3]-0;
		}
        
        if (JXG.exists(atts['coords'])) {
            // Position given in attributes
			x=atts['coords'][0];
			y=atts['coords'][1];
        } else {
            // Handle global counter
            this.reelPosition.x-=5;
            if(this.reelPosition.x<=-8) {
                this.reelPosition.x=8;
                this.reelPosition.y+=1;
            }
            x = this.reelPosition.x;
            y = this.reelPosition.y;
        }
        var el = this.board.create('slider', [
		    [x, y],
			[x+3, y], 
			[parents[1], parents[0], parents[2]]
			], atts);
		el.sens=pas;
		if(atts["tepanime"]) {
/*

@options;

@figure;
A = point(-1,0) ;
B = point(1,1) ;
d =droite(A,B) ;
r = reel(2,0,5,1) {oscille};
C = pointsur(d, r) ;
D = point(2,-1);
e = droite(A,D);
s = reel(2,-5,5) {anime};
M=pointsur(e,s);

*/
			if(animationList.length==0) {
				this.animepoint = this.board.create('text',[x,y+0.5,'<b>&gt;</b>&nbsp;Animer']);
				this.animepoint.rendNode.style.color="#FF0000";
				this.animepoint.isAnime=false;
				this.animepoint.jsxtepobj=this;
				this.animepoint.rendNode.jsxtepanimeobj=this.animepoint;
				this.animepoint.rendNode.onclick = function(e) {
					if(this.jsxtepanimeobj.isAnime) {
						//on lance l'animation
						this.jsxtepanimeobj.setText("<b>&gt;</b>&nbsp;Animer");
						this.jsxtepanimeobj.rendNode.style.color="#FF0000";
						this.jsxtepanimeobj.jsxtepobj.board.unsuspendUpdate();
						clearTimeout(timeoutCaller);						
					} else {
						//on arrête l'animation
						this.jsxtepanimeobj.setText("<b>&#9632;</b>&nbsp;Stop");
						this.jsxtepanimeobj.rendNode.style.color="#00FF00";
						this.jsxtepanimeobj.jsxtepobj.tepAnimerGo(this.jsxtepanimeobj.jsxtepobj);						
					}
					this.jsxtepanimeobj.isAnime=!this.jsxtepanimeobj.isAnime;					
				}			
				
			}
			animationList.push([el,atts["tepanime"]]);
		}
		return el;
    };
	
    this.tepAnimerGo = function(obj) {
		console.log("Animation : Go");
		var v;
		obj.board.suspendUpdate();
		for(var i=0;i<animationList.length;i++) {
			v=animationList[i][0];
			switch(animationList[i][1]) {
				case 2 : /* anime1 */
					if(v.position>=1.0) v.position=0.0; break;
				case 4 :
				case 5 : /* oscille1 et oscille2 */
					if ( v.position>=1.0-1e-6 ) v.sens=-Math.abs(v.sens);
					if ( v.position<=1e-6 ) v.sens=Math.abs(v.sens); 
					break;
			}
		}
		obj.board.unsuspendUpdate();
		timeoutCaller=setTimeout(obj.tepAnimerRun,200,obj);
	}
	
    this.tepAnimerRun = function(obj) {
		
		function animerSlider(v,typeAnime) {
			var mi = v._smin,
	        	ma = v._smax,
    	    	diff = ma-mi,
        		newval = v.Value()+v.sens,
				newpos = (newval-mi)/diff,
				continuer = true;
			switch(typeAnime) {
				case 1 : /* anime from min to max ever*/ 
					if (newpos>1.0) newpos = 0.0;
					break;
				case 2 : /* anime1 to max and stop, new run for from min to max and so on*/ 
					if (newpos>1.0) {
						newpos = 1.0;
						continuer=false;
					}
					break;
				case 3 : /* oscille : to max then to min then to max ever*/ 
					if (newpos>1.0) {
						v.sens=-v.sens;
						newpos=1.0;
					} else { 
						if(newpos<0.0) {
							v.sens=-v.sens;
							newpos=0.0;
						}
					}
					break;						
				case 4 : /* oscille1 to max and stop, new run to min and stop, new run to max and stop and so on */ 
					if (newpos>1.0) {
						newpos = 1.0;
						continuer=false;
					}
					if (newpos<0.0) {
						newpos = 0.0;
						continuer=false;
					}
					break;
				case 5 : /* oscille2 to max then to min and stop, new run to max then to min and stop, and so on */ 
					if (newpos>1.0) {
						v.sens=-v.sens;
						newpos = 1.0;
					}
					if (newpos<=0) {
						newpos=0;
						continuer=false;
					}
					break;
			}
			//console.log("v.position / v.sens ->"+newpos+" / "+v.sens);
			v.position = newpos;
			return continuer;
		}
		
		this.board.suspendUpdate();
		var oncontinue = false;
		for(var i=0;i<animationList.length;i++) {
			oncontinue = oncontinue || animerSlider(animationList[i][0],animationList[i][1]);
		}
		this.board.unsuspendUpdate();
		if (oncontinue) {
			timeoutCaller=setTimeout(obj.tepAnimerRun,200,obj);
		} else {
			obj.animepoint.isAnime=false;
			obj.animepoint.setText("<b>&gt;</b>&nbsp;Animer");
			obj.animepoint.rendNode.style.color="#FF0000";
			obj.board.unsuspendUpdate();
			clearTimeout(timeoutCaller);						
		}
		
	}

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

    this.similitude = function(parents, attributes) {
        var p0, a, co, si;
        if (parents.length==3 && JXG.isPoint(parents[0])) {
            p0 = parents[0];
            a = parents[2]*Math.PI/180.0;
            co = Math.cos(a)*parents[1];
            si = Math.sin(a)*parents[1];
            // Move rotation center to origin,
            // scale and rotate,
            // Move rotation center back
            return this.board.create('transform', 
                [1, 0, 0,
                 function(){ return -co*p0.X()-(-si)*p0.Y()+p0.X();}, co, -si,
                 function(){ return -si*p0.X()- (co)*p0.Y()+p0.Y();}, si, co
                ],
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


    /*
     * @options;
     */


    this.handleOptAtts = function(attsArr) {
        var obj = {}, i, couleur, fontSize, le = attsArr.length, arr;
      	//default
		obj["axis"]=true;
		obj["grid"]=false;
		//	
        for (i=0; i<le; i++) {
			switch (attsArr[i]) {
				case 'i' : obj["axis"] = false; break;
				case 'invisible' : obj["axis"] = false; break;
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
				case 'petit' : fontSize = 8; break;
				case 'moyen' : fontSize = 12; break;
				case 'grand' : fontSize = 16; break;
				case 'blanc' : couleur ='white'; break;
				case 'jaune' : couleur ='yellow'; break;
				case 'jauneclair' : couleur ='lightyellow'; break;
				case 'kakiclair' : couleur ='yellowgreen'; break;
				case 'jaunepaille' : couleur ='darkkhaki'; break;
				case 'rose' : couleur ='pink'; break;
				case 'saumon' : couleur ='salmon'; break;
				case 'orange' : couleur ='orange'; break;
				case 'rougeclair' : couleur ='palevioletred'; break;
				case 'rouge' : couleur ='red'; break;
				case 'vertclair' : couleur ='lime'; break;
				case 'vert' : couleur ='green'; break;
				case 'vertfonce' : couleur ='darkgreen'; break;
				case 'kaki' : couleur ='olive'; break;
				case 'sapin' : couleur ='springgreen'; break;
				case 'marron' : couleur ='maroon'; break;
				case 'brique' : couleur ='firebrick'; break;
				case 'marronfonce' : couleur ='saddlebrown'; break;
				case 'violetfonce' : couleur ='darkviolet'; break;
				case 'rougefonce' : couleur ='darkred'; break;
				case 'cyan' : couleur ='cyan'; break;
				case 'bleuciel' : couleur ='skyblue'; break;
				case 'bleuocean' : couleur ='aqua'; break;
				case 'bleu' : couleur ='blue'; break;
				case 'bleufonce' : couleur ='darkblue'; break;
				case 'violet' : couleur ='blueviolet'; break;
				case 'gris' : couleur ='gray'; break;
				case 'grisclair' : couleur ='darkgray'; break;
				case 'vertpale' : couleur ='palegreen'; break;
				case 'noir' : couleur ='black'; break;
				default : {
					//color hexa value
					if( attsArr[i].charAt(0)=='#' ) {
						couleur = attsArr[i].substr(1);
					} else if (attsArr[i].charAt(0)=='(' ) {
                        arr = attsArr[i].substring(1, attsArr[i].length-1).split(',');
                        arr[0] = parseFloat(arr[0]);
                        arr[1] = parseFloat(arr[1]);
                        obj['coords'] = arr;
                    }
				}		
			}
        }
		//for label/text with line
		if( couleur!=undefined ) {
			obj["strokeColor"]=couleur;
		}
		return obj;
	}
	
	this.repereortho = function(parents, attributes) {
		//repereortho(313,263,30,1,1){ 0 , moyen , noir , num1 ,i};
		var opt,l1, att = this.handleOptAtts(attributes);
		this.board.moveOrigin(parents[0],parents[1]);
		this.board.unitX=parents[2];
		this.board.unitY=parents[2];
		this.board.options.grid.snapSizeX=1/parents[3];
		this.board.options.grid.snapSizeY=1/parents[4];
		this.board.options.grid.gridX=parents[3];
		this.board.options.grid.gridY=parents[4];
		if(att["axis"]) {
			opt = [	
				{strokeColor:att["strokeColor"],highlightStrokeColor:att["strokeColor"],strokeOpacity:0.6,highlightStrokeOpacity:0.6},
				{insertTicks:false, drawZero:true, drawLabels:true, minorTicks:0,label:{Color:att["strokeColor"]}}
			];
	        l1=this.board.create('line', [[0, 0], [1, 0]], opt[0]);
			l1.setArrow(false,true);
			this.board.create('ticks', [l1,parents[4]], opt[1]);
			l1=this.board.create('line', [[0, 0], [0, 1]], opt[0]);
			l1.setArrow(false,true);
			this.board.create('ticks', [l1,parents[4]], opt[1]);
		}
	}

	this.repere = function(parents, attributes) {
		// repere(-5,5,-4,4,1,1){ 0 , moyen , noir , num1 };
		var opt, l1, att = this.handleOptAtts(attributes);
		this.board.setBoundingBox([parents[0],parents[3],parents[1],parents[2]], (parents[4]==parents[5]));
		this.board.options.grid.snapSizeX=1/parents[4];
		this.board.options.grid.snapSizeY=1/parents[5];
		this.board.options.grid.gridX=parents[4];
		this.board.options.grid.gridY=parents[5];
		if(att["axis"]) {
			opt = [	
				{strokeColor:att["strokeColor"],highlightStrokeColor:att["strokeColor"],strokeOpacity:0.6,highlightStrokeOpacity:0.6},
				{insertTicks:false, drawZero:true, drawLabels:true, minorTicks:0,label:{Color:att["strokeColor"]}}
			];
	        l1=this.board.create('line', [[0, 0], [1, 0]], opt[0] );
			l1.setArrow(false,true);
			this.board.create('ticks', [l1,parents[4]], opt[1]);
			l1=this.board.create('line', [[0, 0], [0, 1]], opt[0]);
			l1.setArrow(false,true);
			this.board.create('ticks', [l1,parents[4]], opt[1]);
		}
	}
	
	this.aimante = function(parents, attributes) {
		this.board.options.grid.snapToGrid=true;

	}

	this.grille = function(parents, attributes) {
		this.board.addGrid();
	}

    this.trame =  function(parents, attributes) {
		this.board.addGrid();
	}

	this.fond =  function(parents, attributes) {
		this.board.create('image', [parents[0], [parents[3],parents[4]]]);
	}
	
	
    this.degres = function(parents, attributes) {
		/* default angle measure for TeP : how to turn it outside for jsxgraph ? */
	}
    this.radians = function(parents, attributes) {
		/* noting to do for jsxgraph : defaut angles unit */
	}

    this.chgt_etat_bloc = function(parents, attributes) {
		this.etat(parents, attributes);
	}
    this.etat = function(parents, attributes) {
	}

    this.pilote = function(parents, attributes) {
	}

};

/*

var animate=null;
var compte = 0;
function animer() {
    var mi = v._smin,
        ma = v._smax,
        diff = ma-mi,
        newval = v.Value()+1;
    v.position = (newval-mi)/diff;
    if (v.position>1.0) v.position = 0.0;
    board.update();
    compte++;
    if(compte<10) 
animate = setTimeout(animer,500)
    else 
clearTimeout(animate);
}
animer();

*/
