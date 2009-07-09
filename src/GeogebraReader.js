JXG.GeogebraReader = new function() {

/**

 */
this.ggbParse = function(board, tree, registeredElements, element, exp) {
	var _dbg_withtrace        = false;
	var _dbg_string            = new String();

	function __dbg_print( text )
	{
	    _dbg_string += text + "\n";
	}

	function __lex( info )
	{
	    var state        = 0;
	    var match        = -1;
	    var match_pos    = 0;
	    var start        = 0;
	    var pos            = info.offset + 1;

	    do
	    {
	        pos--;
	        state = 0;
	        match = -2;
	        start = pos;

	        if( info.src.length <= start )
	            return 16;

	        do
	        {

	switch( state )
	{
	    case 0:
	        if( info.src.charCodeAt( pos ) == 9 || info.src.charCodeAt( pos ) == 32 ) state = 1;
	        else if( info.src.charCodeAt( pos ) == 40 ) state = 2;
	        else if( info.src.charCodeAt( pos ) == 41 ) state = 3;
	        else if( info.src.charCodeAt( pos ) == 42 ) state = 4;
	        else if( info.src.charCodeAt( pos ) == 43 ) state = 5;
	        else if( info.src.charCodeAt( pos ) == 44 ) state = 6;
	        else if( info.src.charCodeAt( pos ) == 45 ) state = 7;
	        else if( info.src.charCodeAt( pos ) == 47 ) state = 8;
	        else if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) ) state = 9;
	        else if( ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 10;
	        else if( info.src.charCodeAt( pos ) == 34 ) state = 14;
	        else if( info.src.charCodeAt( pos ) == 38 ) state = 15;
	        else if( info.src.charCodeAt( pos ) == 46 ) state = 16;
	        else state = -1;
	        break;

	    case 1:
	        state = -1;
	        match = 1;
	        match_pos = pos;
	        break;

	    case 2:
	        state = -1;
	        match = 2;
	        match_pos = pos;
	        break;

	    case 3:
	        state = -1;
	        match = 3;
	        match_pos = pos;
	        break;

	    case 4:
	        state = -1;
	        match = 12;
	        match_pos = pos;
	        break;

	    case 5:
	        state = -1;
	        match = 9;
	        match_pos = pos;
	        break;

	    case 6:
	        state = -1;
	        match = 10;
	        match_pos = pos;
	        break;

	    case 7:
	        state = -1;
	        match = 11;
	        match_pos = pos;
	        break;

	    case 8:
	        state = -1;
	        match = 13;
	        match_pos = pos;
	        break;

	    case 9:
	        if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) ) state = 9;
	        else if( info.src.charCodeAt( pos ) == 46 ) state = 12;
	        else state = -1;
	        match = 4;
	        match_pos = pos;
	        break;

	    case 10:
	        if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 10;
	        else if( info.src.charCodeAt( pos ) == 95 ) state = 18;
	        else state = -1;
	        match = 7;
	        match_pos = pos;
	        break;

	    case 11:
	        state = -1;
	        match = 8;
	        match_pos = pos;
	        break;

	    case 12:
	        if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) ) state = 12;
	        else state = -1;
	        match = 5;
	        match_pos = pos;
	        break;

	    case 13:
	        state = -1;
	        match = 6;
	        match_pos = pos;
	        break;

	    case 14:
	        if( info.src.charCodeAt( pos ) == 34 ) state = 11;
	        else if( info.src.charCodeAt( pos ) == 32 || info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 14;
	        else state = -1;
	        break;

	    case 15:
	        if( ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
	        else state = -1;
	        break;

	    case 16:
	        if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) ) state = 12;
	        else state = -1;
	        break;

	    case 17:
	        if( info.src.charCodeAt( pos ) == 59 ) state = 13;
	        else if( ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 17;
	        else state = -1;
	        break;

	    case 18:
	        if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 10;
	        else if( info.src.charCodeAt( pos ) == 95 ) state = 18;
	        else state = -1;
	        break;

	}


	            pos++;

	        }
	        while( state > -1 );

	    }
	    while( 1 > -1 && match == 1 );

	    if( match > -1 )
	    {
	        info.att = info.src.substr( start, match_pos - start );
	        info.offset = match_pos;

	switch( match )
	{
	    case 4:
	        {
	         info.att = parseInt( info.att );
	        }
	        break;

	    case 5:
	        {
	         info.att = parseFloat( info.att );
	        }
	        break;

	    case 6:
	        {
	         info.att = String( info.att )
	        }
	        break;

	    case 7:
	        {
              JXG.GeogebraReader.debug("Geparstes Element/Variable: "+ info.att);
              // Falls das Element noch nicht existiert, muss es erzeugt werden
		      if(typeof registeredElements[info.att] == 'undefined' || registeredElements[info.att] == '') {
		        var input = JXG.GeogebraReader.getElement(tree, info.att);
		        registeredElements[info.att] = JXG.GeogebraReader.writeElement(tree, board, input);
				JXG.GeogebraReader.debug("regged: "+ info.att +" (id: "+ registeredElements[info.att].id +")");
		      }
		
		     // TODO: Fallunterscheidung zu unterschiedlichen Elementtypen und anhand deren die Wertzuweisung
			  // 		     switch(JXG.GetReferenceFromParameter(board, registeredElements[info.att].id).type) {
			  // case 1330923340: /* Slider */
			  //   info.att = JXG.GetReferenceFromParameter(board, registeredElements[info.att].id).Value();
			  // break;
			  // default:
			  //   info.att = JXG.GetReferenceFromParameter(board, registeredElements[info.att].id).Value();
			  // break;
			  // 		     }

	        }
	        break;

	    case 8:
	        {
	         info.att = String( info.att )
	        }
	        break;

	}


	    }
	    else
	    {
	        info.att = new String();
	        match = -1;
	    }

	    return match;
	}


	function __parse( src, err_off, err_la )
	{
	    var        sstack            = new Array();
	    var        vstack            = new Array();
	    var     err_cnt            = 0;
	    var        act;
	    var        go;
	    var        la;
	    var        rval;
	    var     parseinfo        = new Function( "", "var offset; var src; var att;" );
	    var        info            = new parseinfo();

	/* Pop-Table */
	var pop_tab = new Array(
	    new Array( 0/* p' */, 1 ),
	    new Array( 15/* p */, 1 ),
	    new Array( 14/* e */, 3 ),
	    new Array( 14/* e */, 3 ),
	    new Array( 14/* e */, 3 ),
	    new Array( 14/* e */, 3 ),
	    new Array( 14/* e */, 3 ),
	    new Array( 14/* e */, 2 ),
	    new Array( 14/* e */, 3 ),
	    new Array( 14/* e */, 3 ),
	    new Array( 14/* e */, 1 ),
	    new Array( 14/* e */, 1 ),
	    new Array( 14/* e */, 1 ),
	    new Array( 14/* e */, 1 ),
	    new Array( 14/* e */, 1 )
	);

	/* Action-Table */
	var act_tab = new Array(
	    /* State 0 */ new Array( 11/* "-" */,3 , 2/* "(" */,4 , 8/* "STRING" */,5 , 4/* "INT" */,6 , 5/* "FLOAT" */,7 , 6/* "HTML" */,8 , 7/* "VAR" */,9 ),
	    /* State 1 */ new Array( 16/* "$" */,0 ),
	    /* State 2 */ new Array( 13/* "/" */,10 , 12/* "*" */,11 , 10/* "," */,12 , 11/* "-" */,13 , 9/* "+" */,14 , 16/* "$" */,-1 ),
	    /* State 3 */ new Array( 11/* "-" */,3 , 2/* "(" */,4 , 8/* "STRING" */,5 , 4/* "INT" */,6 , 5/* "FLOAT" */,7 , 6/* "HTML" */,8 , 7/* "VAR" */,9 ),
	    /* State 4 */ new Array( 11/* "-" */,3 , 2/* "(" */,4 , 8/* "STRING" */,5 , 4/* "INT" */,6 , 5/* "FLOAT" */,7 , 6/* "HTML" */,8 , 7/* "VAR" */,9 ),
	    /* State 5 */ new Array( 9/* "+" */,17 , 16/* "$" */,-14 , 11/* "-" */,-14 , 10/* "," */,-14 , 12/* "*" */,-14 , 13/* "/" */,-14 , 3/* ")" */,-14 ),
	    /* State 6 */ new Array( 16/* "$" */,-10 , 9/* "+" */,-10 , 11/* "-" */,-10 , 10/* "," */,-10 , 12/* "*" */,-10 , 13/* "/" */,-10 , 3/* ")" */,-10 ),
	    /* State 7 */ new Array( 16/* "$" */,-11 , 9/* "+" */,-11 , 11/* "-" */,-11 , 10/* "," */,-11 , 12/* "*" */,-11 , 13/* "/" */,-11 , 3/* ")" */,-11 ),
	    /* State 8 */ new Array( 16/* "$" */,-12 , 9/* "+" */,-12 , 11/* "-" */,-12 , 10/* "," */,-12 , 12/* "*" */,-12 , 13/* "/" */,-12 , 3/* ")" */,-12 ),
	    /* State 9 */ new Array( 16/* "$" */,-13 , 9/* "+" */,-13 , 11/* "-" */,-13 , 10/* "," */,-13 , 12/* "*" */,-13 , 13/* "/" */,-13 , 3/* ")" */,-13 ),
	    /* State 10 */ new Array( 11/* "-" */,3 , 2/* "(" */,4 , 8/* "STRING" */,5 , 4/* "INT" */,6 , 5/* "FLOAT" */,7 , 6/* "HTML" */,8 , 7/* "VAR" */,9 ),
	    /* State 11 */ new Array( 11/* "-" */,3 , 2/* "(" */,4 , 8/* "STRING" */,5 , 4/* "INT" */,6 , 5/* "FLOAT" */,7 , 6/* "HTML" */,8 , 7/* "VAR" */,9 ),
	    /* State 12 */ new Array( 11/* "-" */,3 , 2/* "(" */,4 , 8/* "STRING" */,5 , 4/* "INT" */,6 , 5/* "FLOAT" */,7 , 6/* "HTML" */,8 , 7/* "VAR" */,9 ),
	    /* State 13 */ new Array( 11/* "-" */,3 , 2/* "(" */,4 , 8/* "STRING" */,5 , 4/* "INT" */,6 , 5/* "FLOAT" */,7 , 6/* "HTML" */,8 , 7/* "VAR" */,9 ),
	    /* State 14 */ new Array( 11/* "-" */,3 , 2/* "(" */,4 , 8/* "STRING" */,5 , 4/* "INT" */,6 , 5/* "FLOAT" */,7 , 6/* "HTML" */,8 , 7/* "VAR" */,9 ),
	    /* State 15 */ new Array( 13/* "/" */,-7 , 12/* "*" */,-7 , 10/* "," */,-7 , 11/* "-" */,-7 , 9/* "+" */,-7 , 16/* "$" */,-7 , 3/* ")" */,-7 ),
	    /* State 16 */ new Array( 13/* "/" */,10 , 12/* "*" */,11 , 10/* "," */,12 , 11/* "-" */,13 , 9/* "+" */,14 , 3/* ")" */,23 ),
	    /* State 17 */ new Array( 11/* "-" */,3 , 2/* "(" */,4 , 8/* "STRING" */,5 , 4/* "INT" */,6 , 5/* "FLOAT" */,7 , 6/* "HTML" */,8 , 7/* "VAR" */,9 ),
	    /* State 18 */ new Array( 13/* "/" */,-6 , 12/* "*" */,-6 , 10/* "," */,-6 , 11/* "-" */,-6 , 9/* "+" */,-6 , 16/* "$" */,-6 , 3/* ")" */,-6 ),
	    /* State 19 */ new Array( 13/* "/" */,-5 , 12/* "*" */,-5 , 10/* "," */,-5 , 11/* "-" */,-5 , 9/* "+" */,-5 , 16/* "$" */,-5 , 3/* ")" */,-5 ),
	    /* State 20 */ new Array( 13/* "/" */,10 , 12/* "*" */,11 , 10/* "," */,-4 , 11/* "-" */,-4 , 9/* "+" */,-4 , 16/* "$" */,-4 , 3/* ")" */,-4 ),
	    /* State 21 */ new Array( 13/* "/" */,10 , 12/* "*" */,11 , 10/* "," */,-3 , 11/* "-" */,-3 , 9/* "+" */,-3 , 16/* "$" */,-3 , 3/* ")" */,-3 ),
	    /* State 22 */ new Array( 13/* "/" */,10 , 12/* "*" */,11 , 10/* "," */,-2 , 11/* "-" */,-2 , 9/* "+" */,-2 , 16/* "$" */,-2 , 3/* ")" */,-2 ),
	    /* State 23 */ new Array( 16/* "$" */,-8 , 9/* "+" */,-8 , 11/* "-" */,-8 , 10/* "," */,-8 , 12/* "*" */,-8 , 13/* "/" */,-8 , 3/* ")" */,-8 ),
	    /* State 24 */ new Array( 13/* "/" */,10 , 12/* "*" */,11 , 10/* "," */,-9 , 11/* "-" */,-9 , 9/* "+" */,-9 , 16/* "$" */,-9 , 3/* ")" */,-9 )
	);

	/* Goto-Table */
	var goto_tab = new Array(
	    /* State 0 */ new Array( 15/* p */,1 , 14/* e */,2 ),
	    /* State 1 */ new Array( ),
	    /* State 2 */ new Array( ),
	    /* State 3 */ new Array( 14/* e */,15 ),
	    /* State 4 */ new Array( 14/* e */,16 ),
	    /* State 5 */ new Array( ),
	    /* State 6 */ new Array( ),
	    /* State 7 */ new Array( ),
	    /* State 8 */ new Array( ),
	    /* State 9 */ new Array( ),
	    /* State 10 */ new Array( 14/* e */,18 ),
	    /* State 11 */ new Array( 14/* e */,19 ),
	    /* State 12 */ new Array( 14/* e */,20 ),
	    /* State 13 */ new Array( 14/* e */,21 ),
	    /* State 14 */ new Array( 14/* e */,22 ),
	    /* State 15 */ new Array( ),
	    /* State 16 */ new Array( ),
	    /* State 17 */ new Array( 14/* e */,24 ),
	    /* State 18 */ new Array( ),
	    /* State 19 */ new Array( ),
	    /* State 20 */ new Array( ),
	    /* State 21 */ new Array( ),
	    /* State 22 */ new Array( ),
	    /* State 23 */ new Array( ),
	    /* State 24 */ new Array( )
	);



	/* Symbol labels */
	var labels = new Array(
	    "p'" /* Non-terminal symbol */,
	    "WHITESPACE" /* Terminal symbol */,
	    "(" /* Terminal symbol */,
	    ")" /* Terminal symbol */,
	    "INT" /* Terminal symbol */,
	    "FLOAT" /* Terminal symbol */,
	    "HTML" /* Terminal symbol */,
	    "VAR" /* Terminal symbol */,
	    "STRING" /* Terminal symbol */,
	    "+" /* Terminal symbol */,
	    "," /* Terminal symbol */,
	    "-" /* Terminal symbol */,
	    "*" /* Terminal symbol */,
	    "/" /* Terminal symbol */,
	    "e" /* Non-terminal symbol */,
	    "p" /* Non-terminal symbol */,
	    "$" /* Terminal symbol */
	);



	    info.offset = 0;
	    info.src = src;
	    info.att = new String();

	    if( !err_off )
	        err_off    = new Array();
	    if( !err_la )
	    err_la = new Array();

	    sstack.push( 0 );
	    vstack.push( 0 );

	    la = __lex( info );

	    while( true )
	    {
	        act = 26;
	        for( var i = 0; i < act_tab[sstack[sstack.length-1]].length; i+=2 )
	        {
	            if( act_tab[sstack[sstack.length-1]][i] == la )
	            {
	                act = act_tab[sstack[sstack.length-1]][i+1];
	                break;
	            }
	        }

	        if( _dbg_withtrace && sstack.length > 0 )
	        {
	            __dbg_print( "\nState " + sstack[sstack.length-1] + "\n" +
	                            "\tLookahead: " + labels[la] + " (\"" + info.att + "\")\n" +
	                            "\tAction: " + act + "\n" +
	                            "\tSource: \"" + info.src.substr( info.offset, 30 ) + ( ( info.offset + 30 < info.src.length ) ?
	                                    "..." : "" ) + "\"\n" +
	                            "\tStack: " + sstack.join() + "\n" +
	                            "\tValue stack: " + vstack.join() + "\n" );
	        }


	        //Panic-mode: Try recovery when parse-error occurs!
	        if( act == 26 )
	        {
	            if( _dbg_withtrace )
	                __dbg_print( "Error detected: There is no reduce or shift on the symbol " + labels[la] );

	            err_cnt++;
	            err_off.push( info.offset - info.att.length );            
	            err_la.push( new Array() );
	            for( var i = 0; i < act_tab[sstack[sstack.length-1]].length; i+=2 )
	                err_la[err_la.length-1].push( labels[act_tab[sstack[sstack.length-1]][i]] );

	            //Remember the original stack!
	            var rsstack = new Array();
	            var rvstack = new Array();
	            for( var i = 0; i < sstack.length; i++ )
	            {
	                rsstack[i] = sstack[i];
	                rvstack[i] = vstack[i];
	            }

	            while( act == 26 && la != 16 )
	            {
	                if( _dbg_withtrace )
	                    __dbg_print( "\tError recovery\n" +
	                                    "Current lookahead: " + labels[la] + " (" + info.att + ")\n" +
	                                    "Action: " + act + "\n\n" );
	                if( la == -1 )
	                    info.offset++;

	                while( act == 26 && sstack.length > 0 )
	                {
	                    sstack.pop();
	                    vstack.pop();

	                    if( sstack.length == 0 )
	                        break;

	                    act = 26;
	                    for( var i = 0; i < act_tab[sstack[sstack.length-1]].length; i+=2 )
	                    {
	                        if( act_tab[sstack[sstack.length-1]][i] == la )
	                        {
	                            act = act_tab[sstack[sstack.length-1]][i+1];
	                            break;
	                        }
	                    }
	                }

	                if( act != 26 )
	                    break;

	                for( var i = 0; i < rsstack.length; i++ )
	                {
	                    sstack.push( rsstack[i] );
	                    vstack.push( rvstack[i] );
	                }

	                la = __lex( info );
	            }

	            if( act == 26 )
	            {
	                if( _dbg_withtrace )
	                    __dbg_print( "\tError recovery failed, terminating parse process..." );
	                break;
	            }


	            if( _dbg_withtrace )
	                __dbg_print( "\tError recovery succeeded, continuing" );
	        }

	        /*
	        if( act == 26 )
	            break;
	        */


	        //Shift
	        if( act > 0 )
	        {            
	            if( _dbg_withtrace )
	                __dbg_print( "Shifting symbol: " + labels[la] + " (" + info.att + ")" );

	            sstack.push( act );
	            vstack.push( info.att );

	            la = __lex( info );

	            if( _dbg_withtrace )
	                __dbg_print( "\tNew lookahead symbol: " + labels[la] + " (" + info.att + ")" );
	        }
	        //Reduce
	        else
	        {        
	            act *= -1;

	            if( _dbg_withtrace )
	                __dbg_print( "Reducing by producution: " + act );

	            rval = void(0);

	            if( _dbg_withtrace )
	                __dbg_print( "\tPerforming semantic action..." );

	switch( act )
	{
	    case 0:
	    {
	        rval = vstack[ vstack.length - 1 ];
	    }
	    break;
	    case 1:
	    {
	         JXG.GeogebraReader.debug( vstack[ vstack.length - 1 ] );
	    }
	    break;
	    case 2:
	    {
	         rval = vstack[ vstack.length - 3 ] + vstack[ vstack.length - 1 ];
	    }
	    break;
	    case 3:
	    {
	         rval = vstack[ vstack.length - 3 ] - vstack[ vstack.length - 1 ];
	    }
	    break;
	    case 4:
	    {
		     JXG.GeogebraReader.debug("2Zu aktualisierendes Element: "+ registeredElements[element].name + "("+ registeredElements[element].id +")");
	
             var p = JXG.GetReferenceFromParameter(board, registeredElements[element].id);
             var s = JXG.GetReferenceFromParameter(board, registeredElements[vstack[ vstack.length - 3 ]].id);
             (function(z) { fx = function() { return z.Value(); };
                            fy = function() { return z.Value(); };
                            p.addConstraint([fx, fy]);
                          }) (s);

	         rval = "x: "+ typeof vstack[ vstack.length - 3 ] +" ("+ vstack[ vstack.length - 3 ] +"), y: "+ typeof vstack[ vstack.length - 1 ] +"("+ vstack[ vstack.length - 1 ] +")";
	    }
	    break;
	    case 5:
	    {
	         rval = vstack[ vstack.length - 3 ] * vstack[ vstack.length - 1 ];
	    }
	    break;
	    case 6:
	    {
	         rval = vstack[ vstack.length - 3 ] / vstack[ vstack.length - 1 ];
	    }
	    break;
	    case 7:
	    {
	         rval = vstack[ vstack.length - 1 ] * -1;
	    }
	    break;
	    case 8:
	    {
	         rval = vstack[ vstack.length - 2 ];
	    }
	    break;
	    case 9:
	    {
	        rval = vstack[ vstack.length - 3 ];
	    }
	    break;
	    case 10:
	    {
	        rval = vstack[ vstack.length - 1 ];
	    }
	    break;
	    case 11:
	    {
	        rval = vstack[ vstack.length - 1 ];
	    }
	    break;
	    case 12:
	    {
	        rval = vstack[ vstack.length - 1 ];
	    }
	    break;
	    case 13:
	    {
	        rval = vstack[ vstack.length - 1 ];
	    }
	    break;
	    case 14:
	    {
	        rval = vstack[ vstack.length - 1 ];
	    }
	    break;
	}

	            if( _dbg_withtrace )
	                __dbg_print( "\tPopping " + pop_tab[act][1] + " off the stack..." );

	            for( var i = 0; i < pop_tab[act][1]; i++ )
	            {
	                sstack.pop();
	                vstack.pop();
	            }

	            go = -1;
	            for( var i = 0; i < goto_tab[sstack[sstack.length-1]].length; i+=2 )
	            {
	                if( goto_tab[sstack[sstack.length-1]][i] == pop_tab[act][0] )
	                {
	                    go = goto_tab[sstack[sstack.length-1]][i+1];
	                    break;
	                }
	            }

	            if( act == 0 )
	                break;

	            if( _dbg_withtrace )
	                __dbg_print( "\tPushing non-terminal " + labels[ pop_tab[act][0] ] );

	            sstack.push( go );
	            vstack.push( rval );            
	        }

	        if( _dbg_withtrace )
	        {        
	            JXG.GeogebraReader.debug( _dbg_string );
	            _dbg_string = new String();
	        }
	    }

	    if( _dbg_withtrace )
	    {
	        __dbg_print( "\nParse complete." );
	        JXG.GeogebraReader.debug( _dbg_string );
	    }

	    return err_cnt;
	}

  var error_offsets = new Array(); var error_lookaheads = new Array(); var error_count = 0;
  // var str = prompt( "Please enter a string to be parsed:", "" );
  var str = exp;
  if( ( error_count = __parse( str, error_offsets, error_lookaheads ) ) > 0 ) {
	var errstr = new String();
	for( var i = 0; i < error_count; i++ ) errstr += "Parse error in line " + ( str.substr( 0, error_offsets[i] ).match( /\n/g ) ? str.substr( 0, error_offsets[i] ).match( /\n/g ).length : 1 ) + " near \"" + str.substr( error_offsets[i] ) + "\", expecting \"" + error_lookaheads[i].join() + "\"\n" ;
    JXG.GeogebraReader.debug( errstr );
  }
}


this.debug = function(s) {
  $('debug').innerHTML += s +"<br/>";
};

/**
 * Set color properties of a geonext element.
 * Set stroke, fill, lighting, label and draft color attributes.
 * @param {Object} gxtEl element of which attributes are to set
 */
this.colorProperties = function(Data, attr) {
  var a = (Data.getElementsByTagName("objColor")[0].attributes["alpha"]) ? 1*Data.getElementsByTagName("objColor")[0].attributes["alpha"].value : 0;
  var r = (Data.getElementsByTagName("objColor")[0].attributes["r"]) ? (1*Data.getElementsByTagName("objColor")[0].attributes["r"].value).toString(16) : 0;
  var g = (Data.getElementsByTagName("objColor")[0].attributes["g"]) ? (1*Data.getElementsByTagName("objColor")[0].attributes["g"].value).toString(16) : 0;
  var b = (Data.getElementsByTagName("objColor")[0].attributes["b"]) ? (1*Data.getElementsByTagName("objColor")[0].attributes["b"].value).toString(16) : 0;
  // gxtEl.colorA = (Data.getElementsByTagName("objColor")[0].attributes["alpha"]) ? 1*Data.getElementsByTagName("objColor")[0].attributes["alpha"].value : 0;
  if (r.length == 1) r = '0' + r;
  if (g.length == 1) g = '0' + g;
  if (b.length == 1) b = '0' + b;

  if(a != 0) {
    attr.fillColor = '#'+ r + g + b;
    attr.fillOpacity = a;
  }
  return attr;
}; 

/**
 * Set the board properties of a geonext element.
 * Set active, area, dash, draft and showinfo attributes.
 * @param {Object} gxtEl element of which attributes are to set
 * @param {Object} Data element of which attributes are to set
 */
this.boardProperties = function(gxtEl, Data, attr) {
  return attr;
}; 

/**
 
 */
this.coordinates = function(gxtEl, Data) {
//TODO: userCoords hier umrechnen, für alle Elemente
  gxtEl.x = (Data.getElementsByTagName("coords")[0]) ? parseFloat(Data.getElementsByTagName("coords")[0].attributes["x"].value) : (Data.getElementsByTagName("startPoint")[0]) ? parseFloat(Data.getElementsByTagName("startPoint")[0].attributes["x"].value) : false;
  gxtEl.y = (Data.getElementsByTagName("coords")[0]) ? parseFloat(Data.getElementsByTagName("coords")[0].attributes["y"].value) : (Data.getElementsByTagName("startPoint")[0]) ? parseFloat(Data.getElementsByTagName("startPoint")[0].attributes["y"].value) : false;
  gxtEl.z = (Data.getElementsByTagName("coords")[0]) ? parseFloat(Data.getElementsByTagName("coords")[0].attributes["z"].value) : (Data.getElementsByTagName("startPoint")[0]) ? parseFloat(Data.getElementsByTagName("startPoint")[0].attributes["z"].value) : false;
  return gxtEl;
}

/**
 * Writing element attributes to the given object
 * @param {XMLNode} Data expects the content of the current element
 * @param {Object} the name of the element to search for
 * @return {Object} object with according attributes
 */
this.visualProperties = function(Data, attr) {
  (Data.getElementsByTagName("show")[0].attributes["object"]) ? attr.visible = Data.getElementsByTagName("show")[0].attributes["object"].value : false;
  // attr.visible = 'true';
  (Data.getElementsByTagName("show")[0].attributes["label"]) ? attr.visibleLabel = Data.getElementsByTagName("show")[0].attributes["label"].value : false;
  (Data.getElementsByTagName('pointSize')[0]) ? attr.style = Data.getElementsByTagName('pointSize')[0].attributes["val"].value : false;
  (Data.getElementsByTagName("labelOffset")[0]) ? attr.labelX = 1*Data.getElementsByTagName("labelOffset")[0].attributes["x"].value : false;
  (Data.getElementsByTagName("labelOffset")[0]) ? attr.labelY = 1*Data.getElementsByTagName("labelOffset")[0].attributes["y"].value : false;
  (Data.getElementsByTagName("trace")[0]) ? attr.trace = Data.getElementsByTagName("trace")[0].attributes["val"].value : false;
  (Data.getElementsByTagName('fix')[0]) ? attr.fixed = Data.getElementsByTagName('fix')[0].attributes["val"].value : false;
  return attr;
};

/**
 * Searching for an element in the geogebra tree
 * @param {XMLTree} tree expects the content of the parsed geogebra file returned by function parseFF/parseIE
 * @param {String} the name of the element to search for
 * @return {Object} object with according label
 */
this.getElement = function(tree, name) {
  for(var i=0; i<tree.getElementsByTagName("construction").length; i++)
    for(var j=0; j<tree.getElementsByTagName("construction")[i].getElementsByTagName("element").length; j++) {
      var Data = tree.getElementsByTagName("construction")[i].getElementsByTagName("element")[j];
      if(name == Data.attributes["label"].value) {
        return Data;
      }
    }
};

/**
 * Searching for an element in the geogebra tree
 * @param {XMLTree} tree expects the content of the parsed geogebra file returned by function parseFF/parseIE
 * @param {Object} board object
 * @param {Array} registeredElements contains the list of all generated elements
 * @return {Array} updated registeredElements with the newly created references to the axes
 */
this.writeBoard = function(tree, board, registeredElements) {
  var boardData = tree.getElementsByTagName("euclidianView")[0];

  board.origin = {};
  board.origin.usrCoords = [1, 0, 0];
  board.origin.scrCoords = [1, 1*boardData.getElementsByTagName("coordSystem")[0].attributes["xZero"].value, 1*boardData.getElementsByTagName("coordSystem")[0].attributes["yZero"].value];
  // board.zoomX = 1*boardData.getElementsByTagName("coordSystem")[0].attributes["scale"].value;
  // board.zoomY = 1*boardData.getElementsByTagName("coordSystem")[0].attributes["yscale"].value;
  board.unitX = (boardData.getElementsByTagName("coordSystem")[0].attributes["scale"]) ? 1*boardData.getElementsByTagName("coordSystem")[0].attributes["scale"].value : 1;
  board.unitY = (boardData.getElementsByTagName("coordSystem")[0].attributes["yscale"]) ? 1*boardData.getElementsByTagName("coordSystem")[0].attributes["yscale"].value : 1;
  board.fontSize = 1*tree.getElementsByTagName("gui")[0].getElementsByTagName("font")[0].attributes["size"].value;
  // board.geonextCompatibilityMode = true;

  // delete(JXG.JSXGraph.boards[board.id]);
  // board.id = boardTmp.id;

  // board.fullUpdate();

  JXG.JSXGraph.boards[board.id] = board;
  //board.initGeonextBoard();
  // Update of properties during update() is not necessary in GEONExT files
  board.renderer.enhancedRendering = true;

  // Eigenschaften der Zeichenflaeche setzen
  // das Grid zeichnen
  // auf Kaestchen springen?
  var snap = (boardData.getElementsByTagName('evSettings')[0].attributes["pointCapturing"].value == "true") ? board.snapToGrid = true : null;
  // var gridX = (boardData.getElementsByTagName('evSettings')[0].attributes["grid"]) ? board.gridX = boardData.getElementsByTagName('grid')[1].getElementsByTagName('x')[0].firstChild.data*1 : null;
  // var gridY = (boardData.getElementsByTagName('grid')[1].getElementsByTagName('y')[0].firstChild.data) ? board.gridY = boardData.getElementsByTagName('grid')[1].getElementsByTagName('y')[0].firstChild.data*1 : null;
  // board.calculateSnapSizes();
  // var gridDash = boardData.getElementsByTagName('grid')[1].getElementsByTagName('dash')[0].firstChild.data;
  // board.gridDash = board.algebra.str2Bool(gridDash);
  // var gridColor = boardData.getElementsByTagName('grid')[1].getElementsByTagName('color')[0].firstChild.data;
  // var gridOpacity;
  // if (gridColor.length=='9' && gridColor.substr(0,1)=='#') {
  //     gridOpacity = gridColor.substr(7,2);                
  //     gridColor = gridColor.substr(0,7);
  // }
  // else { 
  //     gridOpacity = 'FF';
  // }
  // board.gridColor = gridColor;
  // board.gridOpacity = gridOpacity;

  var grid = (boardData.getElementsByTagName('evSettings')[0].attributes["grid"].value == "true") ? board.renderer.drawGrid(board) : null;

  if(boardData.getElementsByTagName('evSettings')[0].attributes["axes"] && boardData.getElementsByTagName('evSettings')[0].attributes["axes"].value == "true") {
      registeredElements["xAxis"] = board.createElement('axis', [[0, 0], [1, 0]], {strokeColor:'black'});
      registeredElements["yAxis"] = board.createElement('axis', [[0, 0], [0, 1]], {strokeColor:'black'});
  }
  return registeredElements;
};

/**
 * Searching for an element in the geogebra tree
 * @param {XMLTree} tree expects the content of the parsed geogebra file returned by function parseFF/parseIE
 * @param {Object} board object
 * @param {Object} gxtEl element whose attributes are to parse
 * @param {Array} input list of all input elements
 * @param {String} typeName output construction method
 * @param {String} text of expression to write
 */
this.writeElement = function(tree, board, output, input, cmd) {
  if(typeof output == 'object' && typeof output.attributes == 'undefined') {
    element = output[0];
  } else {
    element = output;
  }

  var gxtEl = {};
  gxtEl.type = element.attributes["type"].value.toLowerCase();
  gxtEl.label = element.attributes["label"].value;

  var attr = {} // Attributes of geometric elements
  attr.name= gxtEl.label;

  if(typeof cmd != 'undefined' && (gxtEl.type != cmd)) {
  gxtEl.type = cmd;
  }

  JXG.GeogebraReader.debug("<br><b>Konstruiere</b> "+ gxtEl.label +"("+ gxtEl.type +"):");

  switch(gxtEl.type) {
    case "point":
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      try {
          p = board.createElement('point', [gxtEl.x, gxtEl.y], attr);
          $('debug').innerHTML += "* <b>Point ("+ p.id +"):</b> "+ attr.name + "("+ gxtEl.x +", "+ gxtEl.y +")<br>\n";
          return p;
      } catch(e) {
          $('debug').innerHTML += "* <b>Err:</b> Point " + attr.name +"<br>\n";
          return false;
      }
    break;
    case 'segment':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      attr.strokeColor = attr.fillColor;
      attr.strokeOpacity = attr.fillOpacity;

      try {
        $('debug').innerHTML += "* <b>Segment:</b> ("+ attr.name +") First: " + input[0].name + ", Last: " + input[1].name + "<br>\n";
        attr.straightFirst = false;
        attr.straightLast =  false;
        l = board.createElement('line', input, attr);
        return l;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Segment " + attr.name +" First: " + input[0].name + ", Last: " + input[1].name + "<br>\n";
        return false;
      }
    break;
    case 'line':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      attr.strokeColor = attr.fillColor;
      attr.strokeOpacity = attr.fillOpacity;
for (var x in attr) {
    $('debug').innerHTML += x+':'+attr[x]+' ';
}    
$('debug').innerHTML += '<br>';

      if(JXG.GetReferenceFromParameter(board, input[1].id).type == 1330925652) var type = 'line'; // Punkt -> Gerade
      else if(JXG.GetReferenceFromParameter(board, input[1].id).type == 1330924622) var type = 'parallel'; // Parallele durch Punkt

      try {
        $('debug').innerHTML += "* <b>Line:</b> ("+ attr.name +") First: " + input[0].id + ", Last: " + input[1].id + "<br>\n";
        l = board.createElement(type, input, attr);
        return l;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Line " + attr.label +"<br>\n";
        return false;
      }
    break;
    case "orthogonalline":
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      try {
        $('debug').innerHTML += "* <b>Orthogonalline:</b> First: " + input[0].id + ", Last: " + input[1].id + "<br>\n";
        l = board.createElement('normal', [input[0], input[1]], attr);
        // l[0].setStraight(false, false);
        // l[0].setProperty("visible: false");
        // l[1].setProperty("visible: false");
        return l;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Orthogonalline " + attr.label +"<br>\n";
        return false;
      }
    break;
    case "polygon":
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      try {
        $('debug').innerHTML += "* <b>Polygon:</b> First: " + input[0].name + ", Second: " + input[1].name + ", Third: " + input[2].name + "<br>\n";
        var borders = [];
        for(var i=1; i<output.length; i++) {
          borders[i-1] = {};
          borders[i-1].id = '';
          borders[i-1].name = output[i].attributes['label'].value;
        }
        attr.borders = borders;
        l = board.createElement('polygon', input, attr);
        return l;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Polygon " + attr.name +"<br>\n";
        return false;
      }
    break;
    case 'intersect':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      try {
        $('debug').innerHTML += "* <b>Intersection:</b> First: " + input[0].name + ", Second: " + input[1].name + "<br>\n";
        l = board.createElement('intersection', [input[0], input[1], 0], attr);
        // l = new board.Intersection(board, null, input[0], input[1]);
        // l = board.intersection(input[0], input[1]);
        // l.setStraight(false, false);
        return l;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Intersection " + attr.name +"<br>\n";
        return false;
      }
    break;
    case 'distance':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      try {
        $('debug').innerHTML += "* <b>Distance:</b> First: " + input[0].name + ", Second: " + input[1].name + "<br>\n";
        m = board.createElement('midpoint', input, {visible: 'false'});
        t = board.createElement('text', [function(){return m.X();}, function(){return m.Y();}, function(){
              return "<span style='text-decoration: overline'>"+ input[0].name + input[1].name +"</span> = "
                     + JXG.GetReferenceFromParameter(board, input[0].id).Dist(JXG.GetReferenceFromParameter(board, input[1].id));
                }]);
        return t;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Intersection " + attr.name +"<br>\n";
        return false;
      }
    break;
    case 'rotate':
//TODO: Abhaengigkeit einbauen, BSP: dreheobjektumpunkt --> B' immer abhaengig von A und B
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      try {
        $('debug').innerHTML += "* <b>Rotate:</b> First: " + input[0].name + ", Second: " + input[1].name + "<br>\n";
        attr.type = 'rotate';
        r = board.createElement('transform', [[parseInt(input[1]), input[2]], input[0]], attr);
        return r;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Rotate " + attr.name +"<br>\n";
        return false;
      }
    break;
    case 'mirror':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      if(JXG.GetReferenceFromParameter(board, input[1].id).type == 1330925652) var type = 'mirrorpoint'; // Punktspiegelung
      else if(JXG.GetReferenceFromParameter(board, input[1].id).type == 1330924622) var type = 'reflection'; // Geradenspiegelung

      try {
        $('debug').innerHTML += "* <b>Mirror:</b> First: " + input[0].name + ", Second: " + input[1].name + "<br>\n";
        m = board.createElement(type, [input[1], input[0]], attr);
        return m;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Mirror " + attr.name +"<br>\n";
        return false;
      }
    break;
    case 'circle':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      try {
        $('debug').innerHTML += "* <b>Circle:</b> First: " + input[0].name + ", Second: " + input[1] + "<br>\n";
        c = board.createElement('circle', input, attr);
        return c;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Circle " + attr.name +"<br>\n";
        return false;
      }
    break;
    case 'circlearc':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      try {
        $('debug').innerHTML += "* <b>CircleArc:</b> First: " + input[0].name + ", Second: " + input[1].name + "<br>\n";
        c = board.createElement('arc', input, attr);
        return c;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> CircleArc " + attr.name +"<br>\n";
        return false;
      }
    break;
    // case 'conic':
    //   gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
    //   gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
    //   gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
    //   gxtEl = JXG.GeogebraReader.visualProperties(element, attr);
    // 
    //   try {
    //     $('debug').innerHTML += "* <b>Conic:</b> First: " + input[0].name + ", Second: " + input[1].name + "<br>\n";
    //     c = board.createElement('conic', input, attr);
    //     return c;
    //   } catch(e) {
    //     $('debug').innerHTML += "* <b>Err:</b> Conic " + attr.name +"<br>\n";
    //     return false;
    //   }
    // break;
    case 'circlesector':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      try {
        $('debug').innerHTML += "* <b>CircleSector:</b> First: " + input[0].name + ", Second: " + input[1].name + "<br>\n";
        c = board.createElement('sector', input, attr);
        return c;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> CircleSector " + attr.name +"<br>\n";
        return false;
      }
    break;
    case 'linebisector':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      try {
        $('debug').innerHTML += "* <b>LineBiSector (Mittelsenkrechte):</b> First: " + input[0].name + "<br>\n";
        attr.straightFirst = true;
        attr.straightLast =  true;
        m = board.createElement('midpoint', input, {visible: 'false'});
        p = board.createElement('perpendicular', [m, input[0]], attr);
        return p;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> LineBiSector (Mittelsenkrechte) " + attr.name +"<br>\n";
        return false;
      }
    break;
    case 'ray':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      try {
        $('debug').innerHTML += "* <b>Strahl:</b> First: " + input[0].name + "<br>\n";
        attr.straightFirst = true;
        attr.straightLast =  false;
        p = board.createElement('line', [input[1], input[0]], attr);
        return p;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Strahl " + attr.name +"<br>\n";
        return false;
      }
    break;
    case 'tangent':
//TODO: nur ein Element?
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      try {
        $('debug').innerHTML += "* <b>Tangente:</b> First: " + input[0].name + "<br>\n";
        p = board.createElement('tangent', input[1], attr);
        return p;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Tangente " + attr.name +"<br>\n";
        return false;
      }
    break;
    case 'circumcirclearc':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      attr = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      attr = JXG.GeogebraReader.visualProperties(element, attr);

      try {
        $('debug').innerHTML += "* <b>CircumcircleArc:</b> First: " + input[0].name + "<br>\n";
        p = board.createElement('circumcircle', input, attr);
        return p;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> CircumcircleArc " + attr.name +"<br>\n";
        return false;
      }
    break;
    case 'angle':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      attr = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      attr = JXG.GeogebraReader.visualProperties(element, attr);

      try {
        $('debug').innerHTML += "* <b>Angle:</b> First: " + input[0].name + "<br>\n";
        p = board.createElement('angle', input, attr);
        return p;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Angle " + attr.name +"<br>\n";
        return false;
      }
    break;
    case 'angularbisector':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      attr = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      attr = JXG.GeogebraReader.visualProperties(element, attr);

      try {
        $('debug').innerHTML += "* <b>Angularbisector:</b> First: " + input[0].name + "<br>\n";
        p = board.createElement('bisector', input, attr);
        return p;
      } catch(e) {
        $('debug').innerHTML += "* <b>Err:</b> Angularbisector " + attr.name +"<br>\n";
        return false;
      }
    break;
    case 'numeric':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      attr = JXG.GeogebraReader.colorProperties(element, attr);
      // gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      attr = JXG.GeogebraReader.visualProperties(element, attr);

      if(element.getElementsByTagName('slider').length == 1) { // Hier handelt es sich um einen Slider
        var sx = parseFloat(element.getElementsByTagName('slider')[0].attributes['x'].value);
        var sy = parseFloat(element.getElementsByTagName('slider')[0].attributes['y'].value);
		var tmp = new JXG.Coords(JXG.COORDS_BY_SCREEN, [sx, sy], board);
		sx = tmp.usrCoords[1];
		sy = tmp.usrCoords[2];
		
        if(element.getElementsByTagName('slider')[0].attributes['horizontal'].value == 'true') {
          var len = parseFloat(element.getElementsByTagName('slider')[0].attributes['width'].value)/(board.unitX*board.zoomX);
          var ex = sx + len;
          var ey = sy;
        } else {
          var len = parseFloat(element.getElementsByTagName('slider')[0].attributes['width'].value)/(board.unitX*board.zoomX);
          var ex = sx;
          var ey = sy + len;
        }

        var sip = parseFloat(element.getElementsByTagName('value')[0].attributes['val'].value);
        var smin = parseFloat(element.getElementsByTagName('slider')[0].attributes['min'].value);
        var smax = parseFloat(element.getElementsByTagName('slider')[0].attributes['max'].value);

        (element.getElementsByTagName('animation')[0]) ? attr.snapWidth = parseFloat(element.getElementsByTagName('animation')[0].attributes['step'].value) : false;

        try {
          $('debug').innerHTML += "* <b>Numeric:</b> First: " + attr.name + "<br>\n";
          n = board.createElement('slider', [[sx,sy], [ex,ey], [smin, sip, smax]], attr);
          return n;
        } catch(e) {
          $('debug').innerHTML += "* <b>Err:</b> Numeric " + attr.name +"<br>\n";
          return false;
        }
      }
    break;
    case 'midpoint':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      try {
          p = board.createElement('midpoint', input, attr);
          $('debug').innerHTML += "* <b>Midpoint ("+ p.id +"):</b> "+ attr.name + "("+ gxtEl.x +", "+ gxtEl.y +")<br>\n";
          return p;
      } catch(e) {
          $('debug').innerHTML += "* <b>Err:</b> Midpoint " + attr.name +"<br>\n";
          return false;
      }
    break;
    case 'center':
      gxtEl = JXG.GeogebraReader.boardProperties(gxtEl, element, attr);
      gxtEl = JXG.GeogebraReader.colorProperties(element, attr);
      gxtEl = JXG.GeogebraReader.coordinates(gxtEl, element);
      gxtEl = JXG.GeogebraReader.visualProperties(element, attr);

      try {
          p = board.createElement('point', [function() {return JXG.GetReferenceFromParameter(board, input[0].id).midpoint.X();}, function() {return JXG.GetReferenceFromParameter(board, input[0].id).midpoint.Y();}], attr);
          $('debug').innerHTML += "* <b>Center ("+ p.id +"):</b> "+ attr.name + "("+ gxtEl.x +", "+ gxtEl.y +")<br>\n";
          return p;
      } catch(e) {
          $('debug').innerHTML += "* <b>Err:</b> Center " + attr.name +"<br>\n";
          return false;
      }
    break;
//    case 'polar':
//    break;
//    case 'radius':
//    break;
//    case 'derivative':
//    break;
//    case 'root':
//    break;
//    case 'slope':
//    break;
//    case 'corner':
//    break;
//    case 'ellipse':
//    break;
//    case 'integral':
//    break;
//    case 'function':
//    break;
//    case 'vector':
//    break;
//    case 'unitvector':
//    break;
//    case 'extremum':
//    break;
//    case 'turningpoint':
//    break;
//    case 'arc':
//    break;
//    case 'semicircle':
//    break;
//    case 'circlepart':
//    break;
//    case 'uppersum':
//    break;
//    case 'lowersum':
//    break;
//    case 'dilate':
//    break;
//    case 'image':
//    break;
//    case 'text':
//    break;
    default:
      return false;
    break;
  }
};

/**
 * Reading the elements of a geogebra file
 * @param {XMLTree} tree expects the content of the parsed geonext file returned by function parseFF/parseIE
 * @param {Object} board board object
 */
this.readGeogebra = function(tree, board) {
  var registeredElements = [];
  var el, Data, i;
  var els = [];

  // Achsen registieren
  registeredElements = JXG.GeogebraReader.writeBoard(tree, board, registeredElements);
  var constructions = tree.getElementsByTagName("construction");
  for (var t=0; t<constructions.length; t++) {

    var cmds = constructions[t].getElementsByTagName("command");
    for (var s=0; s<cmds.length; s++) {
      Data = cmds[s];

      var input = [];
      for (i=0; i<Data.getElementsByTagName("input")[0].attributes.length; i++) {
        el = Data.getElementsByTagName("input")[0].attributes[i].value;
        if(!el.match(/°/) && !isNaN(el)) {
          input[i] = el;
        } else {
          if(typeof registeredElements[el] == 'undefined' || registeredElements[el] == '') {
            elnode = JXG.GeogebraReader.getElement(tree, el);
            registeredElements[el] = JXG.GeogebraReader.writeElement(tree, board, elnode);
            $('debug').innerHTML += "regged: "+registeredElements[el].id+"<br/>";
          }
          input[i] = registeredElements[el];
        }
      }

      var output = [];
      for (i=0; i<Data.getElementsByTagName("output")[0].attributes.length; i++) {
        el = Data.getElementsByTagName("output")[0].attributes[i].value;
        output[i] = JXG.GeogebraReader.getElement(tree, el);
      }
      if(typeof registeredElements[el] == 'undefined' || registeredElements[el] == '') {
        registeredElements[el] = JXG.GeogebraReader.writeElement(tree, board, output, input, Data.attributes['name'].value.toLowerCase());
        $('debug').innerHTML += "regged: "+registeredElements[el].id+"<br/>";

        /* Bei Element mit Raendern die jeweiligen Geraden als registrierte Elemente speichern */
        for(var i=1; i<output.length; i++) {
          registeredElements[registeredElements[el].borders[i-1].name] = registeredElements[el].borders[i-1];
          // var borderAttr = {};
          // JXG.GeogebraReader.colorProperties(JXG.GeogebraRedaer.getElement(tree, registeredElements[el].borders[i-1].name), {});
          // registeredElements[el].borders[i-1].setProperty('strokeColor: '+borderAttr.fillColor, 'strokeOpacity: '+borderAttr.fillOpacity);
          $('debug').innerHTML += i+") regged: "+output[i].attributes['label'].value+"("+ registeredElements[output[i].attributes['label'].value].id +")<br/>";
        }
      }

    }

// TODO: label in element (siehe Parser) umbenennen
    // Hier starten wir die Expressions zu parsen
    var expr = constructions[t].getElementsByTagName('expression');
    for(var s=0; s<expr.length; s++) {
      var label = expr[s].attributes['label'].value;
      var exp = expr[s].attributes['exp'].value;
      var type = (expr[s].attributes['type']) ? expr[s].attributes['type'].value : false;
      JXG.GeogebraReader.debug("Expression: label: "+ label +", exp: "+ exp +", type: "+ type);

      // Gibt es das Ausgabeelement schon?
      if(typeof registeredElements[label] == 'undefined' || registeredElements[label] == '') {
        var input = JXG.GeogebraReader.getElement(tree, label);
        registeredElements[label] = JXG.GeogebraReader.writeElement(tree, board, input, null, type);
        JXG.GeogebraReader.debug("regged: "+registeredElements[label].id);
      }

      // String vorbehandeln
      // var s = exp.replace(/([a-zA-Z]+(\_*[a-zA-Z0-9]+)*)/g, 'VAR($1)').split(' ');
      var s = exp.split(' ');
      var o = '';
//TODO: Zahlen und alle "Multiplikatoren" berücksichtigen
      for(var i=0; i<s.length; i++) {
        if(s.length != i+1)
          // if(s[i].search(/\)$/) > -1 || s[i].search(/$/) > -1)
          if(s[i].search(/\)$/) > -1 || s[i].search(/[a-zA-Z]+(\_*[a-zA-Z0-9]+)*$/) > -1)
            // if(s[i+1].search(/^\(/) > -1 || s[i+1].search(/^VAR/) > -1)
            if(s[i+1].search(/^\(/) > -1 || s[i+1].search(/^[a-zA-Z]+(\_*[a-zA-Z0-9]+)*/) > -1)
              s[i] = s[i] + "*";
        o += s[i];
      }

      // JS/CC-Parser aufrufen
      var out = JXG.GeogebraReader.ggbParse(board, tree, registeredElements, label, exp);
    }

  }
  board.fullUpdate();
};

this.prepareString = function(fileStr){
  if (fileStr.indexOf('<')!=0) {
    bA = [];
    for (i=0;i<fileStr.length;i++)
      bA[i]=JXG.Util.asciiCharCodeAt(fileStr,i);
            
    fileStr = (new JXG.Util.Unzip(bA)).unzipFile("geogebra.xml");  // Unzip
  }
  return fileStr;
};
}; // end: GeogebraReader()