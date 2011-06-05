/*
    Copyright 2008-2010,
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

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


/**
 * Parser helper routines. The methods in here are for parsing expressions in Geonext Syntax.
 * @namespace
 */

JXG.GeonextParser = {};

/**
 * Converts expression of the form <i>leftop^rightop</i> into <i>Math.pow(leftop,rightop)</i>.
 * @param {String} te Expression of the form <i>leftop^rightop</i>
 * @type String
 * @return Converted expression.
 */
JXG.GeonextParser.replacePow = function(te) {
    var count, pos, c,
        leftop, rightop, pre, p, left, i, right, expr;
    //te = te.replace(/\s+/g,''); // Loesche allen whitespace
                                // Achtung: koennte bei Variablennamen mit Leerzeichen
                                // zu Problemen fuehren.
                                
    te = te.replace(/(\s*)\^(\s*)/g,'\^'); // delete all whitespace immediately before and after all ^ operators

	//  Loop over all ^ operators
    i = te.indexOf('^');
    while (i>=0) {
		// left and right are the substrings before, resp. after the ^ character
        left = te.slice(0,i);
        right = te.slice(i+1);

		// If there is a ")" immediately before the ^ operator, it can be the end of a
		// (i) term in parenthesis
		// (ii) function call
		// (iii) method  callthrow new Error("JSXGraph: Can't create Sector with parent types
		// In either case, first the corresponding opening parenthesis is searched.
		// This is the case, when count==0
        if (left.charAt(left.length-1)==')') {
            count = 1;
            pos = left.length-2;
            while (pos>=0 && count>0) {
                c = left.charAt(pos);
                if (c==')') { count++; }
                else if (c=='(') { count--; }
                pos--;
            }   
            if (count==0) {
				// Now, we have found the opning parenthesis and we have to look
				// if it is (i), or (ii), (iii).
                leftop = '';
                pre = left.substring(0,pos+1);   // Search for F or p.M before (...)^
                p = pos;
                while (p>=0 && pre.substr(p,1).match(/([\w\.]+)/)) { 
                    leftop = RegExp.$1+leftop;
                    p--;
                }
                leftop += left.substring(pos+1,left.length);
                leftop = leftop.replace(/([\(\)\+\*\%\^\-\/\]\[])/g,"\\$1");
            } else {
				throw new Error("JSXGraph: Missing '(' in expression");
			}
        } else {
            //leftop = '[\\w\\.\\(\\)\\+\\*\\%\\^\\-\\/\\[\\]]+'; // former: \\w\\. . Doesn't work for sin(x^2)
   			// Otherwise, the operand has to be a constant (or variable).
         leftop = '[\\w\\.]+'; // former: \\w\\.
        }
		// To the right of the ^ operator there also may be a function or method call
		// or a term in parenthesis. Alos, ere we search for the closing
		// parenthesis.
        if (right.match(/^([\w\.]*\()/)) {
            count = 1;
            pos = RegExp.$1.length;
            while (pos<right.length && count>0) {
                c = right.charAt(pos);
                if (c==')') { count--; }
                else if (c=='(') { count++; }
                pos++;
            }
            if (count==0) {
                rightop = right.substring(0,pos);
                rightop = rightop.replace(/([\(\)\+\*\%\^\-\/\[\]])/g,"\\$1");
            } else {
				throw new Error("JSXGraph: Missing ')' in expression");
			}
        } else {
            //rightop = '[\\w\\.\\(\\)\\+\\*\\%\\^\\-\\/\\[\\]]+';  // ^b , see leftop. Doesn't work for sin(x^2)
			// Otherwise, the operand has to be a constant (or variable).
            rightop = '[\\w\\.]+';  
        }
		// Now, we have the two operands and replace ^ by JXG.Math.pow
        expr = new RegExp('(' + leftop + ')\\^(' + rightop + ')');
        te = te.replace(expr,"JXG.Math.pow($1,$2)");
        i = te.indexOf('^');
    }
    return te;
};

/**
 * Converts expression of the form <i>If(a,b,c)</i> into <i>(a)?(b):(c)/i>.
 * @param {String} te Expression of the form <i>If(a,b,c)</i>
 * @type String
 * @return Converted expression.
 */
JXG.GeonextParser.replaceIf = function(te) {
    var s = '',
        left, right,
        first = null,
        second = null,
        third = null,
        i, pos, count, k1, k2, c, meat;
    
    i = te.indexOf('If(');
    if (i<0) { return te; }

    te = te.replace(/""/g,'0'); // "" means not defined. Here, we replace it by 0
    while (i>=0) {
        left = te.slice(0,i);
        right = te.slice(i+3); 
        
        // Search the end of the If() command and take out the meat
        count = 1;
        pos = 0;
        k1 = -1;
        k2 = -1;
        while (pos<right.length && count>0) {
            c = right.charAt(pos);
            if (c==')') { 
                count--;
            } else if (c=='(') {
                count++;
            } else if (c==',' && count==1) {
                if (k1<0) { 
                    k1 = pos; // first komma
                } else {
                    k2 = pos; // second komma
                }
            }
            pos++;
        } 
        meat = right.slice(0,pos-1);
        right = right.slice(pos);
        
        // Test the two kommas
        if (k1<0) { return ''; } // , missing
        if (k2<0) { return ''; } // , missing
        
        first = meat.slice(0,k1);
        second = meat.slice(k1+1,k2);
        third = meat.slice(k2+1);
        first = this.replaceIf(first);    // Recurse
        second = this.replaceIf(second);  // Recurse
        third = this.replaceIf(third);    // Recurse

        s += left + '((' + first + ')?' + '('+second+'):('+third+'))';  
        te = right;
        first = null;
        second = null;
        i = te.indexOf('If(');
    }
    s += right;
    return s;
};

/**
 * Replace _{} by &lt;sub&gt;
 * @param {String} te String containing _{}.
 * @type String
 * @return Given string with _{} replaced by &lt;sub&gt;.
 */
JXG.GeonextParser.replaceSub = function(te) {
    if(te['indexOf']) {} else return te;

    var i = te.indexOf('_{'),
        j;
    while (i>=0) {
        te = te.substr(0,i)+te.substr(i).replace(/_\{/,'<sub>');
        j = te.substr(i).indexOf('}');
        if (j>=0) {
            te = te.substr(0,j)+te.substr(j).replace(/\}/,'</sub>');
        }
        i = te.indexOf('_{');
    }

    i = te.indexOf('_');
    while (i>=0) {
        te = te.substr(0,i)+te.substr(i).replace(/_(.?)/,'<sub>$1</sub>');
        i = te.indexOf('_');
    }
    return te;
};

/**
 * Replace ^{} by &lt;sup&gt;
 * @param {String} te String containing ^{}.
 * @type String
 * @return Given string with ^{} replaced by &lt;sup&gt;.
 */
JXG.GeonextParser.replaceSup = function(te) {
    if(te['indexOf']) {} else return te;

    var i = te.indexOf('^{'),
        j;
    while (i>=0) {
        te = te.substr(0,i)+te.substr(i).replace(/\^\{/,'<sup>');
        j = te.substr(i).indexOf('}');
        if (j>=0) {
            te = te.substr(0,j)+te.substr(j).replace(/\}/,'</sup>');
        }
        i = te.indexOf('^{');
    }

    i = te.indexOf('^');
    while (i>=0) {
        te = te.substr(0,i)+te.substr(i).replace(/\^(.?)/,'<sup>$1</sup>');
        i = te.indexOf('^');
    }

    return te;
};

/**
 * Replace an element's name in terms by an element's id.
 * @param term Term containing names of elements.
 * @param board Reference to the board the elements are on.
 * @return The same string with names replaced by ids.
 **/
JXG.GeonextParser.replaceNameById = function(/** string */ term, /** JXG.Board */ board) /** string */ {
    var pos = 0, end, elName, el, i,
        funcs = ['X','Y','L','V'];

    for (i=0;i<funcs.length;i++) {
        pos = term.indexOf(funcs[i]+'(');
        while (pos>=0) {
            if (pos>=0) {
                end = term.indexOf(')',pos+2);
                if (end>=0) {
                    elName = term.slice(pos+2,end);
                    elName = elName.replace(/\\(['"])?/g,"$1");
                    el = board.elementsByName[elName];
                    term = term.slice(0,pos+2) + el.id +  term.slice(end);
                }
            }
            end = term.indexOf(')',pos+2);
            pos = term.indexOf(funcs[i]+'(',end);
        }
    }

    pos = term.indexOf('Dist(');
    while (pos>=0) {
        if (pos>=0) {
            end = term.indexOf(',',pos+5);
            if (end>=0) {
                elName = term.slice(pos+5,end);
                elName = elName.replace(/\\(['"])?/g,"$1");
                el = board.elementsByName[elName];
                term = term.slice(0,pos+5) + el.id +  term.slice(end);
            }
        }
        end = term.indexOf(',',pos+5);
        pos = term.indexOf(',',end);
        end = term.indexOf(')',pos+1);
        if (end>=0) {
            elName = term.slice(pos+1,end);
            elName = elName.replace(/\\(['"])?/g,"$1");
            el = board.elementsByName[elName];
            term = term.slice(0,pos+1) + el.id +  term.slice(end);
        }
        end = term.indexOf(')',pos+1);
        pos = term.indexOf('Dist(',end);
    }

    funcs = ['Deg','Rad'];
    for (i=0;i<funcs.length;i++) {
        pos = term.indexOf(funcs[i]+'(');
        while (pos>=0) {
            if (pos>=0) {
                end = term.indexOf(',',pos+4);
                if (end>=0) {
                    elName = term.slice(pos+4,end);
                    elName = elName.replace(/\\(['"])?/g,"$1");
                    el = board.elementsByName[elName];
                    term = term.slice(0,pos+4) + el.id +  term.slice(end);
                }
            }
            end = term.indexOf(',',pos+4);
            pos = term.indexOf(',',end);
            end = term.indexOf(',',pos+1);
            if (end>=0) {
                elName = term.slice(pos+1,end);
                elName = elName.replace(/\\(['"])?/g,"$1");
                el = board.elementsByName[elName];
                term = term.slice(0,pos+1) + el.id +  term.slice(end);
            }
            end = term.indexOf(',',pos+1);
            pos = term.indexOf(',',end);
            end = term.indexOf(')',pos+1);
            if (end>=0) {
                elName = term.slice(pos+1,end);
                elName = elName.replace(/\\(['"])?/g,"$1");
                el = board.elementsByName[elName];
                term = term.slice(0,pos+1) + el.id +  term.slice(end);
            }
            end = term.indexOf(')',pos+1);
            pos = term.indexOf(funcs[i]+'(',end);
        }
    }
    return term;
};

/**
 * Replaces element ids in terms by element this.board.objects['id'].
 * @param term A GEONE<sub>x</sub>T function string with JSXGraph ids in it.
 * @return The input string with element ids replaced by this.board.objects["id"]. 
 **/
JXG.GeonextParser.replaceIdByObj = function(/** string */ term) /** string */ {
    var expr = /(X|Y|L)\(([\w_]+)\)/g;  // Suche "X(gi23)" oder "Y(gi23A)" und wandle in objects['gi23'].X() um.
    term = term.replace(expr,"this.board.objects[\"$2\"].$1()");
    
    expr = /(V)\(([\w_]+)\)/g;  // Suche "X(gi23)" oder "Y(gi23A)" und wandle in objects['gi23'].X() um.
    term = term.replace(expr,"this.board.objects[\"$2\"].Value()");

    expr = /(Dist)\(([\w_]+),([\w_]+)\)/g;  // 
    term = term.replace(expr,'this.board.objects[\"$2\"].Dist(this.board.objects[\"$3\"])');

    expr = /(Deg)\(([\w_]+),([ \w\[\w_]+),([\w_]+)\)/g;  // 
    term = term.replace(expr,'JXG.Math.Geometry.trueAngle(this.board.objects[\"$2\"],this.board.objects[\"$3\"],this.board.objects[\"$4\"])');

    expr = /Rad\(([\w_]+),([\w_]+),([\w_]+)\)/g;  // Suche Rad('gi23','gi24','gi25')
    term = term.replace(expr,'JXG.Math.Geometry.rad(this.board.objects[\"$1\"],this.board.objects[\"$2\"],this.board.objects[\"$3\"])');
    return term;
};

/**
 * Converts the given algebraic expression in GEONE<sub>x</sub>T syntax into an equivalent expression in JavaScript syntax.
 * @param {String} term Expression in GEONExT syntax
 * @type String
 * @return Given expression translated to JavaScript.
 */
JXG.GeonextParser.geonext2JS = function(term, board) {
    var expr, newterm, i,
        from = ['Abs', 'ACos', 'ASin', 'ATan','Ceil','Cos','Exp','Factorial','Floor','Log','Max','Min','Random','Round','Sin','Sqrt','Tan','Trunc'], 
        to =   ['Math.abs', 'Math.acos', 'Math.asin', 'Math.atan', 'Math.ceil', 'Math.cos', 'Math.exp', 'JXG.Math.factorial','Math.floor', 'Math.log', 'Math.max', 'Math.min', 'Math.random', 'this.board.round', 'Math.sin', 'Math.sqrt', 'Math.tan', 'Math.ceil'];
    // removed: 'Pow'  -> Math.pow
    
    //term = JXG.unescapeHTML(term);  // This replaces &gt; by >, &lt; by < and &amp; by &. But it is to strict. 
    term = term.replace(/&lt;/g,'<'); // Hacks, to enable not well formed XML, @see JXG.GeonextReader#replaceLessThan
    term = term.replace(/&gt;/g,'>'); 
    term = term.replace(/&amp;/g,'&'); 
    
    // Umwandeln der GEONExT-Syntax in JavaScript-Syntax
    newterm = term;
    newterm = this.replaceNameById(newterm, board);
    newterm = this.replaceIf(newterm);
    // Exponentiations-Problem x^y -> Math(exp(x,y).
    newterm = this.replacePow(newterm);
    newterm = this.replaceIdByObj(newterm);
    for (i=0; i<from.length; i++) {
        expr = new RegExp(['(\\W|^)(',from[i],')'].join(''),"ig");  // sin -> Math.sin and asin -> Math.asin 
        newterm = newterm.replace(expr,['$1',to[i]].join(''));
    } 
    newterm = newterm.replace(/True/g,'true');
    newterm = newterm.replace(/False/g,'false');
    newterm = newterm.replace(/fasle/g,'false');

    newterm = newterm.replace(/Pi/g,'Math.PI');
    return newterm;
};

/**
 * Finds dependencies in a given term and resolves them by adding the
 * dependent object to the found objects child elements.
 * @param {JXG.GeometryElement} me Object depending on objects in given term.
 * @param {String} term String containing dependencies for the given object.
 * @param {JXG.Board} [board=me.board] Reference to a board
 */
JXG.GeonextParser.findDependencies = function(me, term, board) {
    if(typeof board=='undefined')
        board = me.board;

    var elements = board.elementsByName,
        el, expr, elmask;

    for (el in elements) {
        if (el != me.name) {
            if(elements[el].type == JXG.OBJECT_TYPE_TEXT) {
                if(!elements[el].visProp.islabel) {
                    elmask = el.replace(/\[/g,'\\[');
                    elmask = elmask.replace(/\]/g,'\\]');
                    expr = new RegExp("\\(\(\[\\w\\[\\]'_ \]+,\)*\("+elmask+"\)\(,\[\\w\\[\\]'_ \]+\)*\\)","g");  // Searches (A), (A,B),(A,B,C)
                    if (term.search(expr)>=0) {
                        elements[el].addChild(me);
                    }
                }
            }
            else {
                elmask = el.replace(/\[/g,'\\[');
                elmask = elmask.replace(/\]/g,'\\]');
                expr = new RegExp("\\(\(\[\\w\\[\\]'_ \]+,\)*\("+elmask+"\)\(,\[\\w\\[\\]'_ \]+\)*\\)","g");  // Searches (A), (A,B),(A,B,C)
                if (term.search(expr)>=0) {
                    elements[el].addChild(me);
                }
            }
        }
    }
};

