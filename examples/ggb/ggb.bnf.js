

var _dbg_withtrace = false;
var _dbg_string = '';

function __dbg_print (text) {
    _dbg_string += text + '\n';
}

function __lex (info) {
    var state = 0,
        match = -1,
        match_pos = 0,
        start = 0,
        pos = info.offset + 1;

    do {
        pos -= 1;
        state = 0;
        match = -2;
        start = pos;

        if (info.src.length <= start) {
            return 28;
        }

        do {
            switch( state )
{
	case 0:
		if( info.src.charCodeAt( pos ) == 9 || info.src.charCodeAt( pos ) == 32 ) state = 1;
		else if( info.src.charCodeAt( pos ) == 33 ) state = 2;
		else if( info.src.charCodeAt( pos ) == 40 ) state = 3;
		else if( info.src.charCodeAt( pos ) == 41 ) state = 4;
		else if( info.src.charCodeAt( pos ) == 42 ) state = 5;
		else if( info.src.charCodeAt( pos ) == 43 ) state = 6;
		else if( info.src.charCodeAt( pos ) == 44 ) state = 7;
		else if( info.src.charCodeAt( pos ) == 45 ) state = 8;
		else if( info.src.charCodeAt( pos ) == 47 ) state = 9;
		else if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) ) state = 10;
		else if( info.src.charCodeAt( pos ) == 60 ) state = 11;
		else if( info.src.charCodeAt( pos ) == 62 ) state = 12;
		else if( ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 13;
		else if( info.src.charCodeAt( pos ) == 94 ) state = 14;
		else if( info.src.charCodeAt( pos ) == 34 ) state = 26;
		else if( info.src.charCodeAt( pos ) == 38 ) state = 28;
		else if( info.src.charCodeAt( pos ) == 46 ) state = 29;
		else if( info.src.charCodeAt( pos ) == 61 ) state = 30;
		else if( info.src.charCodeAt( pos ) == 95 ) state = 31;
		else if( info.src.charCodeAt( pos ) == 124 ) state = 32;
		else state = -1;
		break;

	case 1:
		state = -1;
		match = 1;
		match_pos = pos;
		break;

	case 2:
		if( info.src.charCodeAt( pos ) == 61 ) state = 15;
		else state = -1;
		match = 23;
		match_pos = pos;
		break;

	case 3:
		state = -1;
		match = 2;
		match_pos = pos;
		break;

	case 4:
		state = -1;
		match = 3;
		match_pos = pos;
		break;

	case 5:
		state = -1;
		match = 13;
		match_pos = pos;
		break;

	case 6:
		state = -1;
		match = 11;
		match_pos = pos;
		break;

	case 7:
		state = -1;
		match = 16;
		match_pos = pos;
		break;

	case 8:
		state = -1;
		match = 12;
		match_pos = pos;
		break;

	case 9:
		state = -1;
		match = 14;
		match_pos = pos;
		break;

	case 10:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) ) state = 10;
		else if( info.src.charCodeAt( pos ) == 46 ) state = 18;
		else state = -1;
		match = 4;
		match_pos = pos;
		break;

	case 11:
		if( info.src.charCodeAt( pos ) == 61 ) state = 19;
		else state = -1;
		match = 21;
		match_pos = pos;
		break;

	case 12:
		if( info.src.charCodeAt( pos ) == 61 ) state = 21;
		else state = -1;
		match = 22;
		match_pos = pos;
		break;

	case 13:
		if( ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 13;
		else if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) ) state = 27;
		else if( info.src.charCodeAt( pos ) == 91 ) state = 34;
		else if( info.src.charCodeAt( pos ) == 95 ) state = 35;
		else state = -1;
		match = 7;
		match_pos = pos;
		break;

	case 14:
		state = -1;
		match = 15;
		match_pos = pos;
		break;

	case 15:
		state = -1;
		match = 20;
		match_pos = pos;
		break;

	case 16:
		state = -1;
		match = 9;
		match_pos = pos;
		break;

	case 17:
		state = -1;
		match = 25;
		match_pos = pos;
		break;

	case 18:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) ) state = 18;
		else state = -1;
		match = 5;
		match_pos = pos;
		break;

	case 19:
		state = -1;
		match = 17;
		match_pos = pos;
		break;

	case 20:
		state = -1;
		match = 19;
		match_pos = pos;
		break;

	case 21:
		state = -1;
		match = 18;
		match_pos = pos;
		break;

	case 22:
		state = -1;
		match = 24;
		match_pos = pos;
		break;

	case 23:
		state = -1;
		match = 8;
		match_pos = pos;
		break;

	case 24:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 24;
		else state = -1;
		match = 6;
		match_pos = pos;
		break;

	case 25:
		state = -1;
		match = 10;
		match_pos = pos;
		break;

	case 26:
		if( info.src.charCodeAt( pos ) == 34 ) state = 16;
		else if( info.src.charCodeAt( pos ) == 32 || info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || info.src.charCodeAt( pos ) == 61 || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) || info.src.charCodeAt( pos ) == 223 || info.src.charCodeAt( pos ) == 228 || info.src.charCodeAt( pos ) == 246 || info.src.charCodeAt( pos ) == 252 ) state = 26;
		else state = -1;
		break;

	case 27:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 27;
		else if( info.src.charCodeAt( pos ) == 95 ) state = 35;
		else state = -1;
		match = 7;
		match_pos = pos;
		break;

	case 28:
		if( info.src.charCodeAt( pos ) == 38 ) state = 17;
		else if( ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 33;
		else state = -1;
		break;

	case 29:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) ) state = 18;
		else state = -1;
		break;

	case 30:
		if( info.src.charCodeAt( pos ) == 61 ) state = 20;
		else state = -1;
		break;

	case 31:
		if( info.src.charCodeAt( pos ) == 95 ) state = 36;
		else state = -1;
		break;

	case 32:
		if( info.src.charCodeAt( pos ) == 124 ) state = 22;
		else state = -1;
		break;

	case 33:
		if( info.src.charCodeAt( pos ) == 59 ) state = 23;
		else if( ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 33;
		else state = -1;
		break;

	case 34:
		if( ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 37;
		else state = -1;
		break;

	case 35:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 27;
		else if( info.src.charCodeAt( pos ) == 95 ) state = 35;
		else state = -1;
		break;

	case 36:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 24;
		else state = -1;
		break;

	case 37:
		if( info.src.charCodeAt( pos ) == 93 ) state = 25;
		else if( ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) ) state = 37;
		else state = -1;
		break;

}


            pos += 1;

        } while (state > -1);

    } while (1 > -1 && match === 1);

    if (match > -1) {
        info.att = info.src.substr(start, match_pos - start);
        info.offset = match_pos;

        
    } else {
        info.att = '';
        match = -1;
    }

    return match;
}


function __parse (src, err_off, err_la) {
    var i, act, go, la, rval, rvstack, rsstack,
        act_tab, pop_tab, goto_tab, labels,
        sstack = [],
        vstack = [],
        err_cnt = 0,
        info = {};

    /* Pop-Table */
var pop_tab = new Array(
	new Array( 0/* p' */, 1 ),
	new Array( 27/* p */, 1 ),
	new Array( 26/* e */, 5 ),
	new Array( 26/* e */, 3 ),
	new Array( 26/* e */, 3 ),
	new Array( 26/* e */, 3 ),
	new Array( 26/* e */, 3 ),
	new Array( 26/* e */, 3 ),
	new Array( 26/* e */, 3 ),
	new Array( 26/* e */, 3 ),
	new Array( 26/* e */, 3 ),
	new Array( 26/* e */, 2 ),
	new Array( 26/* e */, 3 ),
	new Array( 26/* e */, 3 ),
	new Array( 26/* e */, 3 ),
	new Array( 26/* e */, 3 ),
	new Array( 26/* e */, 3 ),
	new Array( 26/* e */, 2 ),
	new Array( 26/* e */, 3 ),
	new Array( 26/* e */, 3 ),
	new Array( 26/* e */, 1 ),
	new Array( 26/* e */, 1 ),
	new Array( 26/* e */, 1 ),
	new Array( 26/* e */, 1 ),
	new Array( 26/* e */, 1 ),
	new Array( 26/* e */, 1 ),
	new Array( 26/* e */, 4 ),
	new Array( 26/* e */, 1 )
);

/* Action-Table */
var act_tab = new Array(
	/* State 0 */ new Array( 2/* "(" */,3 , 23/* "!" */,4 , 12/* "-" */,5 , 9/* "STRING" */,6 , 4/* "INT" */,7 , 5/* "FLOAT" */,8 , 6/* "PARAM" */,9 , 8/* "HTML" */,10 , 10/* "COMMAND" */,11 , 7/* "VAR" */,12 ),
	/* State 1 */ new Array( 28/* "$$" */,0 ),
	/* State 2 */ new Array( 14/* "/" */,13 , 13/* "*" */,14 , 25/* "&&" */,15 , 24/* "||" */,16 , 15/* "^" */,17 , 12/* "-" */,18 , 11/* "+" */,19 , 22/* ">" */,20 , 21/* "<" */,21 , 20/* "!=" */,22 , 19/* "==" */,23 , 18/* ">=" */,24 , 17/* "<=" */,25 , 28/* "$$" */,-1 ),
	/* State 3 */ new Array( 2/* "(" */,3 , 23/* "!" */,4 , 12/* "-" */,5 , 9/* "STRING" */,6 , 4/* "INT" */,7 , 5/* "FLOAT" */,8 , 6/* "PARAM" */,9 , 8/* "HTML" */,10 , 10/* "COMMAND" */,11 , 7/* "VAR" */,12 ),
	/* State 4 */ new Array( 2/* "(" */,3 , 23/* "!" */,4 , 12/* "-" */,5 , 9/* "STRING" */,6 , 4/* "INT" */,7 , 5/* "FLOAT" */,8 , 6/* "PARAM" */,9 , 8/* "HTML" */,10 , 10/* "COMMAND" */,11 , 7/* "VAR" */,12 ),
	/* State 5 */ new Array( 2/* "(" */,3 , 23/* "!" */,4 , 12/* "-" */,5 , 9/* "STRING" */,6 , 4/* "INT" */,7 , 5/* "FLOAT" */,8 , 6/* "PARAM" */,9 , 8/* "HTML" */,10 , 10/* "COMMAND" */,11 , 7/* "VAR" */,12 ),
	/* State 6 */ new Array( 11/* "+" */,29 , 28/* "$$" */,-24 , 17/* "<=" */,-24 , 18/* ">=" */,-24 , 19/* "==" */,-24 , 20/* "!=" */,-24 , 21/* "<" */,-24 , 22/* ">" */,-24 , 12/* "-" */,-24 , 15/* "^" */,-24 , 24/* "||" */,-24 , 25/* "&&" */,-24 , 13/* "*" */,-24 , 14/* "/" */,-24 , 16/* "," */,-24 , 3/* ")" */,-24 ),
	/* State 7 */ new Array( 28/* "$$" */,-20 , 17/* "<=" */,-20 , 18/* ">=" */,-20 , 19/* "==" */,-20 , 20/* "!=" */,-20 , 21/* "<" */,-20 , 22/* ">" */,-20 , 11/* "+" */,-20 , 12/* "-" */,-20 , 15/* "^" */,-20 , 24/* "||" */,-20 , 25/* "&&" */,-20 , 13/* "*" */,-20 , 14/* "/" */,-20 , 16/* "," */,-20 , 3/* ")" */,-20 ),
	/* State 8 */ new Array( 28/* "$$" */,-21 , 17/* "<=" */,-21 , 18/* ">=" */,-21 , 19/* "==" */,-21 , 20/* "!=" */,-21 , 21/* "<" */,-21 , 22/* ">" */,-21 , 11/* "+" */,-21 , 12/* "-" */,-21 , 15/* "^" */,-21 , 24/* "||" */,-21 , 25/* "&&" */,-21 , 13/* "*" */,-21 , 14/* "/" */,-21 , 16/* "," */,-21 , 3/* ")" */,-21 ),
	/* State 9 */ new Array( 28/* "$$" */,-22 , 17/* "<=" */,-22 , 18/* ">=" */,-22 , 19/* "==" */,-22 , 20/* "!=" */,-22 , 21/* "<" */,-22 , 22/* ">" */,-22 , 11/* "+" */,-22 , 12/* "-" */,-22 , 15/* "^" */,-22 , 24/* "||" */,-22 , 25/* "&&" */,-22 , 13/* "*" */,-22 , 14/* "/" */,-22 , 16/* "," */,-22 , 3/* ")" */,-22 ),
	/* State 10 */ new Array( 28/* "$$" */,-23 , 17/* "<=" */,-23 , 18/* ">=" */,-23 , 19/* "==" */,-23 , 20/* "!=" */,-23 , 21/* "<" */,-23 , 22/* ">" */,-23 , 11/* "+" */,-23 , 12/* "-" */,-23 , 15/* "^" */,-23 , 24/* "||" */,-23 , 25/* "&&" */,-23 , 13/* "*" */,-23 , 14/* "/" */,-23 , 16/* "," */,-23 , 3/* ")" */,-23 ),
	/* State 11 */ new Array( 28/* "$$" */,-25 , 17/* "<=" */,-25 , 18/* ">=" */,-25 , 19/* "==" */,-25 , 20/* "!=" */,-25 , 21/* "<" */,-25 , 22/* ">" */,-25 , 11/* "+" */,-25 , 12/* "-" */,-25 , 15/* "^" */,-25 , 24/* "||" */,-25 , 25/* "&&" */,-25 , 13/* "*" */,-25 , 14/* "/" */,-25 , 16/* "," */,-25 , 3/* ")" */,-25 ),
	/* State 12 */ new Array( 2/* "(" */,30 , 28/* "$$" */,-27 , 17/* "<=" */,-27 , 18/* ">=" */,-27 , 19/* "==" */,-27 , 20/* "!=" */,-27 , 21/* "<" */,-27 , 22/* ">" */,-27 , 11/* "+" */,-27 , 12/* "-" */,-27 , 15/* "^" */,-27 , 24/* "||" */,-27 , 25/* "&&" */,-27 , 13/* "*" */,-27 , 14/* "/" */,-27 , 16/* "," */,-27 , 3/* ")" */,-27 ),
	/* State 13 */ new Array( 2/* "(" */,3 , 23/* "!" */,4 , 12/* "-" */,5 , 9/* "STRING" */,6 , 4/* "INT" */,7 , 5/* "FLOAT" */,8 , 6/* "PARAM" */,9 , 8/* "HTML" */,10 , 10/* "COMMAND" */,11 , 7/* "VAR" */,12 ),
	/* State 14 */ new Array( 2/* "(" */,3 , 23/* "!" */,4 , 12/* "-" */,5 , 9/* "STRING" */,6 , 4/* "INT" */,7 , 5/* "FLOAT" */,8 , 6/* "PARAM" */,9 , 8/* "HTML" */,10 , 10/* "COMMAND" */,11 , 7/* "VAR" */,12 ),
	/* State 15 */ new Array( 2/* "(" */,3 , 23/* "!" */,4 , 12/* "-" */,5 , 9/* "STRING" */,6 , 4/* "INT" */,7 , 5/* "FLOAT" */,8 , 6/* "PARAM" */,9 , 8/* "HTML" */,10 , 10/* "COMMAND" */,11 , 7/* "VAR" */,12 ),
	/* State 16 */ new Array( 2/* "(" */,3 , 23/* "!" */,4 , 12/* "-" */,5 , 9/* "STRING" */,6 , 4/* "INT" */,7 , 5/* "FLOAT" */,8 , 6/* "PARAM" */,9 , 8/* "HTML" */,10 , 10/* "COMMAND" */,11 , 7/* "VAR" */,12 ),
	/* State 17 */ new Array( 2/* "(" */,3 , 23/* "!" */,4 , 12/* "-" */,5 , 9/* "STRING" */,6 , 4/* "INT" */,7 , 5/* "FLOAT" */,8 , 6/* "PARAM" */,9 , 8/* "HTML" */,10 , 10/* "COMMAND" */,11 , 7/* "VAR" */,12 ),
	/* State 18 */ new Array( 2/* "(" */,3 , 23/* "!" */,4 , 12/* "-" */,5 , 9/* "STRING" */,6 , 4/* "INT" */,7 , 5/* "FLOAT" */,8 , 6/* "PARAM" */,9 , 8/* "HTML" */,10 , 10/* "COMMAND" */,11 , 7/* "VAR" */,12 ),
	/* State 19 */ new Array( 2/* "(" */,3 , 23/* "!" */,4 , 12/* "-" */,5 , 9/* "STRING" */,6 , 4/* "INT" */,7 , 5/* "FLOAT" */,8 , 6/* "PARAM" */,9 , 8/* "HTML" */,10 , 10/* "COMMAND" */,11 , 7/* "VAR" */,12 ),
	/* State 20 */ new Array( 2/* "(" */,3 , 23/* "!" */,4 , 12/* "-" */,5 , 9/* "STRING" */,6 , 4/* "INT" */,7 , 5/* "FLOAT" */,8 , 6/* "PARAM" */,9 , 8/* "HTML" */,10 , 10/* "COMMAND" */,11 , 7/* "VAR" */,12 ),
	/* State 21 */ new Array( 2/* "(" */,3 , 23/* "!" */,4 , 12/* "-" */,5 , 9/* "STRING" */,6 , 4/* "INT" */,7 , 5/* "FLOAT" */,8 , 6/* "PARAM" */,9 , 8/* "HTML" */,10 , 10/* "COMMAND" */,11 , 7/* "VAR" */,12 ),
	/* State 22 */ new Array( 2/* "(" */,3 , 23/* "!" */,4 , 12/* "-" */,5 , 9/* "STRING" */,6 , 4/* "INT" */,7 , 5/* "FLOAT" */,8 , 6/* "PARAM" */,9 , 8/* "HTML" */,10 , 10/* "COMMAND" */,11 , 7/* "VAR" */,12 ),
	/* State 23 */ new Array( 2/* "(" */,3 , 23/* "!" */,4 , 12/* "-" */,5 , 9/* "STRING" */,6 , 4/* "INT" */,7 , 5/* "FLOAT" */,8 , 6/* "PARAM" */,9 , 8/* "HTML" */,10 , 10/* "COMMAND" */,11 , 7/* "VAR" */,12 ),
	/* State 24 */ new Array( 2/* "(" */,3 , 23/* "!" */,4 , 12/* "-" */,5 , 9/* "STRING" */,6 , 4/* "INT" */,7 , 5/* "FLOAT" */,8 , 6/* "PARAM" */,9 , 8/* "HTML" */,10 , 10/* "COMMAND" */,11 , 7/* "VAR" */,12 ),
	/* State 25 */ new Array( 2/* "(" */,3 , 23/* "!" */,4 , 12/* "-" */,5 , 9/* "STRING" */,6 , 4/* "INT" */,7 , 5/* "FLOAT" */,8 , 6/* "PARAM" */,9 , 8/* "HTML" */,10 , 10/* "COMMAND" */,11 , 7/* "VAR" */,12 ),
	/* State 26 */ new Array( 14/* "/" */,13 , 13/* "*" */,14 , 25/* "&&" */,15 , 24/* "||" */,16 , 15/* "^" */,17 , 12/* "-" */,18 , 11/* "+" */,19 , 22/* ">" */,20 , 21/* "<" */,21 , 20/* "!=" */,22 , 19/* "==" */,23 , 18/* ">=" */,24 , 17/* "<=" */,25 , 16/* "," */,44 , 3/* ")" */,45 ),
	/* State 27 */ new Array( 14/* "/" */,-11 , 13/* "*" */,-11 , 25/* "&&" */,15 , 24/* "||" */,16 , 15/* "^" */,-11 , 12/* "-" */,-11 , 11/* "+" */,-11 , 22/* ">" */,-11 , 21/* "<" */,-11 , 20/* "!=" */,-11 , 19/* "==" */,-11 , 18/* ">=" */,-11 , 17/* "<=" */,-11 , 28/* "$$" */,-11 , 16/* "," */,-11 , 3/* ")" */,-11 ),
	/* State 28 */ new Array( 14/* "/" */,-17 , 13/* "*" */,-17 , 25/* "&&" */,15 , 24/* "||" */,16 , 15/* "^" */,17 , 12/* "-" */,-17 , 11/* "+" */,-17 , 22/* ">" */,20 , 21/* "<" */,21 , 20/* "!=" */,22 , 19/* "==" */,23 , 18/* ">=" */,24 , 17/* "<=" */,25 , 28/* "$$" */,-17 , 16/* "," */,-17 , 3/* ")" */,-17 ),
	/* State 29 */ new Array( 2/* "(" */,3 , 23/* "!" */,4 , 12/* "-" */,5 , 9/* "STRING" */,6 , 4/* "INT" */,7 , 5/* "FLOAT" */,8 , 6/* "PARAM" */,9 , 8/* "HTML" */,10 , 10/* "COMMAND" */,11 , 7/* "VAR" */,12 ),
	/* State 30 */ new Array( 2/* "(" */,3 , 23/* "!" */,4 , 12/* "-" */,5 , 9/* "STRING" */,6 , 4/* "INT" */,7 , 5/* "FLOAT" */,8 , 6/* "PARAM" */,9 , 8/* "HTML" */,10 , 10/* "COMMAND" */,11 , 7/* "VAR" */,12 ),
	/* State 31 */ new Array( 14/* "/" */,-16 , 13/* "*" */,-16 , 25/* "&&" */,15 , 24/* "||" */,16 , 15/* "^" */,17 , 12/* "-" */,-16 , 11/* "+" */,-16 , 22/* ">" */,20 , 21/* "<" */,21 , 20/* "!=" */,22 , 19/* "==" */,23 , 18/* ">=" */,24 , 17/* "<=" */,25 , 28/* "$$" */,-16 , 16/* "," */,-16 , 3/* ")" */,-16 ),
	/* State 32 */ new Array( 14/* "/" */,-15 , 13/* "*" */,-15 , 25/* "&&" */,15 , 24/* "||" */,16 , 15/* "^" */,17 , 12/* "-" */,-15 , 11/* "+" */,-15 , 22/* ">" */,20 , 21/* "<" */,21 , 20/* "!=" */,22 , 19/* "==" */,23 , 18/* ">=" */,24 , 17/* "<=" */,25 , 28/* "$$" */,-15 , 16/* "," */,-15 , 3/* ")" */,-15 ),
	/* State 33 */ new Array( 14/* "/" */,-14 , 13/* "*" */,-14 , 25/* "&&" */,-14 , 24/* "||" */,-14 , 15/* "^" */,-14 , 12/* "-" */,-14 , 11/* "+" */,-14 , 22/* ">" */,-14 , 21/* "<" */,-14 , 20/* "!=" */,-14 , 19/* "==" */,-14 , 18/* ">=" */,-14 , 17/* "<=" */,-14 , 28/* "$$" */,-14 , 16/* "," */,-14 , 3/* ")" */,-14 ),
	/* State 34 */ new Array( 14/* "/" */,-13 , 13/* "*" */,-13 , 25/* "&&" */,-13 , 24/* "||" */,-13 , 15/* "^" */,-13 , 12/* "-" */,-13 , 11/* "+" */,-13 , 22/* ">" */,-13 , 21/* "<" */,-13 , 20/* "!=" */,-13 , 19/* "==" */,-13 , 18/* ">=" */,-13 , 17/* "<=" */,-13 , 28/* "$$" */,-13 , 16/* "," */,-13 , 3/* ")" */,-13 ),
	/* State 35 */ new Array( 14/* "/" */,-12 , 13/* "*" */,-12 , 25/* "&&" */,15 , 24/* "||" */,16 , 15/* "^" */,-12 , 12/* "-" */,-12 , 11/* "+" */,-12 , 22/* ">" */,20 , 21/* "<" */,21 , 20/* "!=" */,22 , 19/* "==" */,23 , 18/* ">=" */,24 , 17/* "<=" */,25 , 28/* "$$" */,-12 , 16/* "," */,-12 , 3/* ")" */,-12 ),
	/* State 36 */ new Array( 14/* "/" */,13 , 13/* "*" */,14 , 25/* "&&" */,15 , 24/* "||" */,16 , 15/* "^" */,17 , 12/* "-" */,-10 , 11/* "+" */,-10 , 22/* ">" */,20 , 21/* "<" */,21 , 20/* "!=" */,22 , 19/* "==" */,23 , 18/* ">=" */,24 , 17/* "<=" */,25 , 28/* "$$" */,-10 , 16/* "," */,-10 , 3/* ")" */,-10 ),
	/* State 37 */ new Array( 14/* "/" */,13 , 13/* "*" */,14 , 25/* "&&" */,15 , 24/* "||" */,16 , 15/* "^" */,17 , 12/* "-" */,-9 , 11/* "+" */,-9 , 22/* ">" */,20 , 21/* "<" */,21 , 20/* "!=" */,22 , 19/* "==" */,23 , 18/* ">=" */,24 , 17/* "<=" */,25 , 28/* "$$" */,-9 , 16/* "," */,-9 , 3/* ")" */,-9 ),
	/* State 38 */ new Array( 14/* "/" */,-8 , 13/* "*" */,-8 , 25/* "&&" */,15 , 24/* "||" */,16 , 15/* "^" */,-8 , 12/* "-" */,-8 , 11/* "+" */,-8 , 22/* ">" */,-8 , 21/* "<" */,-8 , 20/* "!=" */,-8 , 19/* "==" */,-8 , 18/* ">=" */,-8 , 17/* "<=" */,-8 , 28/* "$$" */,-8 , 16/* "," */,-8 , 3/* ")" */,-8 ),
	/* State 39 */ new Array( 14/* "/" */,-7 , 13/* "*" */,-7 , 25/* "&&" */,15 , 24/* "||" */,16 , 15/* "^" */,-7 , 12/* "-" */,-7 , 11/* "+" */,-7 , 22/* ">" */,-7 , 21/* "<" */,-7 , 20/* "!=" */,-7 , 19/* "==" */,-7 , 18/* ">=" */,-7 , 17/* "<=" */,-7 , 28/* "$$" */,-7 , 16/* "," */,-7 , 3/* ")" */,-7 ),
	/* State 40 */ new Array( 14/* "/" */,-6 , 13/* "*" */,-6 , 25/* "&&" */,15 , 24/* "||" */,16 , 15/* "^" */,-6 , 12/* "-" */,-6 , 11/* "+" */,-6 , 22/* ">" */,-6 , 21/* "<" */,-6 , 20/* "!=" */,-6 , 19/* "==" */,-6 , 18/* ">=" */,-6 , 17/* "<=" */,-6 , 28/* "$$" */,-6 , 16/* "," */,-6 , 3/* ")" */,-6 ),
	/* State 41 */ new Array( 14/* "/" */,-5 , 13/* "*" */,-5 , 25/* "&&" */,15 , 24/* "||" */,16 , 15/* "^" */,-5 , 12/* "-" */,-5 , 11/* "+" */,-5 , 22/* ">" */,-5 , 21/* "<" */,-5 , 20/* "!=" */,-5 , 19/* "==" */,-5 , 18/* ">=" */,-5 , 17/* "<=" */,-5 , 28/* "$$" */,-5 , 16/* "," */,-5 , 3/* ")" */,-5 ),
	/* State 42 */ new Array( 14/* "/" */,-4 , 13/* "*" */,-4 , 25/* "&&" */,15 , 24/* "||" */,16 , 15/* "^" */,-4 , 12/* "-" */,-4 , 11/* "+" */,-4 , 22/* ">" */,-4 , 21/* "<" */,-4 , 20/* "!=" */,-4 , 19/* "==" */,-4 , 18/* ">=" */,-4 , 17/* "<=" */,-4 , 28/* "$$" */,-4 , 16/* "," */,-4 , 3/* ")" */,-4 ),
	/* State 43 */ new Array( 14/* "/" */,-3 , 13/* "*" */,-3 , 25/* "&&" */,15 , 24/* "||" */,16 , 15/* "^" */,-3 , 12/* "-" */,-3 , 11/* "+" */,-3 , 22/* ">" */,-3 , 21/* "<" */,-3 , 20/* "!=" */,-3 , 19/* "==" */,-3 , 18/* ">=" */,-3 , 17/* "<=" */,-3 , 28/* "$$" */,-3 , 16/* "," */,-3 , 3/* ")" */,-3 ),
	/* State 44 */ new Array( 2/* "(" */,3 , 23/* "!" */,4 , 12/* "-" */,5 , 9/* "STRING" */,6 , 4/* "INT" */,7 , 5/* "FLOAT" */,8 , 6/* "PARAM" */,9 , 8/* "HTML" */,10 , 10/* "COMMAND" */,11 , 7/* "VAR" */,12 ),
	/* State 45 */ new Array( 28/* "$$" */,-18 , 17/* "<=" */,-18 , 18/* ">=" */,-18 , 19/* "==" */,-18 , 20/* "!=" */,-18 , 21/* "<" */,-18 , 22/* ">" */,-18 , 11/* "+" */,-18 , 12/* "-" */,-18 , 15/* "^" */,-18 , 24/* "||" */,-18 , 25/* "&&" */,-18 , 13/* "*" */,-18 , 14/* "/" */,-18 , 16/* "," */,-18 , 3/* ")" */,-18 ),
	/* State 46 */ new Array( 14/* "/" */,13 , 13/* "*" */,14 , 25/* "&&" */,15 , 24/* "||" */,16 , 15/* "^" */,17 , 12/* "-" */,-19 , 11/* "+" */,-19 , 22/* ">" */,20 , 21/* "<" */,21 , 20/* "!=" */,22 , 19/* "==" */,23 , 18/* ">=" */,24 , 17/* "<=" */,25 , 28/* "$$" */,-19 , 16/* "," */,-19 , 3/* ")" */,-19 ),
	/* State 47 */ new Array( 14/* "/" */,13 , 13/* "*" */,14 , 25/* "&&" */,15 , 24/* "||" */,16 , 15/* "^" */,17 , 12/* "-" */,18 , 11/* "+" */,19 , 22/* ">" */,20 , 21/* "<" */,21 , 20/* "!=" */,22 , 19/* "==" */,23 , 18/* ">=" */,24 , 17/* "<=" */,25 , 3/* ")" */,49 ),
	/* State 48 */ new Array( 14/* "/" */,13 , 13/* "*" */,14 , 25/* "&&" */,15 , 24/* "||" */,16 , 15/* "^" */,17 , 12/* "-" */,18 , 11/* "+" */,19 , 22/* ">" */,20 , 21/* "<" */,21 , 20/* "!=" */,22 , 19/* "==" */,23 , 18/* ">=" */,24 , 17/* "<=" */,25 , 3/* ")" */,50 ),
	/* State 49 */ new Array( 28/* "$$" */,-26 , 17/* "<=" */,-26 , 18/* ">=" */,-26 , 19/* "==" */,-26 , 20/* "!=" */,-26 , 21/* "<" */,-26 , 22/* ">" */,-26 , 11/* "+" */,-26 , 12/* "-" */,-26 , 15/* "^" */,-26 , 24/* "||" */,-26 , 25/* "&&" */,-26 , 13/* "*" */,-26 , 14/* "/" */,-26 , 16/* "," */,-26 , 3/* ")" */,-26 ),
	/* State 50 */ new Array( 28/* "$$" */,-2 , 17/* "<=" */,-2 , 18/* ">=" */,-2 , 19/* "==" */,-2 , 20/* "!=" */,-2 , 21/* "<" */,-2 , 22/* ">" */,-2 , 11/* "+" */,-2 , 12/* "-" */,-2 , 15/* "^" */,-2 , 24/* "||" */,-2 , 25/* "&&" */,-2 , 13/* "*" */,-2 , 14/* "/" */,-2 , 16/* "," */,-2 , 3/* ")" */,-2 )
);

/* Goto-Table */
var goto_tab = new Array(
	/* State 0 */ new Array( 27/* p */,1 , 26/* e */,2 ),
	/* State 1 */ new Array(  ),
	/* State 2 */ new Array(  ),
	/* State 3 */ new Array( 26/* e */,26 ),
	/* State 4 */ new Array( 26/* e */,27 ),
	/* State 5 */ new Array( 26/* e */,28 ),
	/* State 6 */ new Array(  ),
	/* State 7 */ new Array(  ),
	/* State 8 */ new Array(  ),
	/* State 9 */ new Array(  ),
	/* State 10 */ new Array(  ),
	/* State 11 */ new Array(  ),
	/* State 12 */ new Array(  ),
	/* State 13 */ new Array( 26/* e */,31 ),
	/* State 14 */ new Array( 26/* e */,32 ),
	/* State 15 */ new Array( 26/* e */,33 ),
	/* State 16 */ new Array( 26/* e */,34 ),
	/* State 17 */ new Array( 26/* e */,35 ),
	/* State 18 */ new Array( 26/* e */,36 ),
	/* State 19 */ new Array( 26/* e */,37 ),
	/* State 20 */ new Array( 26/* e */,38 ),
	/* State 21 */ new Array( 26/* e */,39 ),
	/* State 22 */ new Array( 26/* e */,40 ),
	/* State 23 */ new Array( 26/* e */,41 ),
	/* State 24 */ new Array( 26/* e */,42 ),
	/* State 25 */ new Array( 26/* e */,43 ),
	/* State 26 */ new Array(  ),
	/* State 27 */ new Array(  ),
	/* State 28 */ new Array(  ),
	/* State 29 */ new Array( 26/* e */,46 ),
	/* State 30 */ new Array( 26/* e */,47 ),
	/* State 31 */ new Array(  ),
	/* State 32 */ new Array(  ),
	/* State 33 */ new Array(  ),
	/* State 34 */ new Array(  ),
	/* State 35 */ new Array(  ),
	/* State 36 */ new Array(  ),
	/* State 37 */ new Array(  ),
	/* State 38 */ new Array(  ),
	/* State 39 */ new Array(  ),
	/* State 40 */ new Array(  ),
	/* State 41 */ new Array(  ),
	/* State 42 */ new Array(  ),
	/* State 43 */ new Array(  ),
	/* State 44 */ new Array( 26/* e */,48 ),
	/* State 45 */ new Array(  ),
	/* State 46 */ new Array(  ),
	/* State 47 */ new Array(  ),
	/* State 48 */ new Array(  ),
	/* State 49 */ new Array(  ),
	/* State 50 */ new Array(  )
);



    /* Symbol labels */
var labels = new Array(
	"p'" /* Non-terminal symbol */,
	"WHITESPACE" /* Terminal symbol */,
	"(" /* Terminal symbol */,
	")" /* Terminal symbol */,
	"INT" /* Terminal symbol */,
	"FLOAT" /* Terminal symbol */,
	"PARAM" /* Terminal symbol */,
	"VAR" /* Terminal symbol */,
	"HTML" /* Terminal symbol */,
	"STRING" /* Terminal symbol */,
	"COMMAND" /* Terminal symbol */,
	"+" /* Terminal symbol */,
	"-" /* Terminal symbol */,
	"*" /* Terminal symbol */,
	"/" /* Terminal symbol */,
	"^" /* Terminal symbol */,
	"," /* Terminal symbol */,
	"<=" /* Terminal symbol */,
	">=" /* Terminal symbol */,
	"==" /* Terminal symbol */,
	"!=" /* Terminal symbol */,
	"<" /* Terminal symbol */,
	">" /* Terminal symbol */,
	"!" /* Terminal symbol */,
	"||" /* Terminal symbol */,
	"&&" /* Terminal symbol */,
	"e" /* Non-terminal symbol */,
	"p" /* Non-terminal symbol */,
	"$$" /* Terminal symbol */
);



    info.offset = 0;
    info.src = src;
    info.att = '';

    if (!err_off) {
        err_off	= [];
    }

    if (!err_la) {
        err_la = [];
    }

    sstack.push(0);
    vstack.push(0);

    la = __lex(info);

    while (true) {
        act = 52;

        for (i = 0; i < act_tab[sstack[sstack.length - 1]].length; i += 2) {
            if (act_tab[sstack[sstack.length - 1]][i] === la) {
                act = act_tab[sstack[sstack.length - 1]][i + 1];
                break;
            }
        }

        if (_dbg_withtrace && sstack.length > 0) {
            __dbg_print( '\nState ' + sstack[sstack.length - 1] + '\n' +
                '\tLookahead: ' + labels[la] + ' (\'' + info.att + '\')\n' +
                '\tAction: ' + act + '\n' +
                '\tSource: \'' + info.src.substr(info.offset, 30) +
                ((info.offset + 30 < info.src.length) ? '...' : '' ) +
                '\'\n' + '\tStack: ' + sstack.join() + '\n' +
                '\tValue stack: ' + vstack.join() + '\n');
        }

        //Panic-mode: Try recovery when parse-error occurs!
        if (act === 52) {
            if( _dbg_withtrace ) {
                __dbg_print('Error detected: There is no reduce or shift on the symbol ' + labels[la]);
            }

            err_cnt += 1;
            err_off.push(info.offset - info.att.length);
            err_la.push([]);
            for (i = 0; i < act_tab[sstack[sstack.length-1]].length; i += 2) {
                err_la[err_la.length-1].push(labels[act_tab[sstack[sstack.length - 1]][i]]);
            }

            //Remember the original stack!
            rsstack = [];
            rvstack = [];
            for (i = 0; i < sstack.length; i++) {
                rsstack[i] = sstack[i];
                rvstack[i] = vstack[i];
            }

            while (act === 52 && la !== 28) {
                if (_dbg_withtrace) {
                    __dbg_print( '\tError recovery\n' +
                        'Current lookahead: ' + labels[la] + ' (' + info.att + ')\n' +
                        'Action: ' + act + '\n\n' );
                }

                if (la === -1) {
                    info.offset += 1;
                }

                while (act === 52 && sstack.length > 0 ) {
                    sstack.pop();
                    vstack.pop();

                    if (sstack.length === 0) {
                        break;
                    }

                    act = 52;

                    for (i = 0; i < act_tab[sstack[sstack.length - 1]].length; i += 2) {
                        if (act_tab[sstack[sstack.length - 1]][i] === la ) {
                            act = act_tab[sstack[sstack.length - 1]][i + 1];
                            break;
                        }
                    }
                }

                if (act !== 52) {
                    break;
                }

                for (i = 0; i < rsstack.length; i++) {
                    sstack.push(rsstack[i]);
                    vstack.push(rvstack[i]);
                }

                la = __lex(info);
            }

            if (act === 52) {
                if (_dbg_withtrace) {
                    __dbg_print('\tError recovery failed, terminating parse process...');
                }
                break;
            }


            if (_dbg_withtrace) {
                __dbg_print('\tError recovery succeeded, continuing');
            }
        }

        //Shift
        if (act > 0) {
            if (_dbg_withtrace) {
                __dbg_print('Shifting symbol: ' + labels[la] + ' (' + info.att + ')');
            }

            sstack.push(act);
            vstack.push(info.att);

            la = __lex(info);

            if (_dbg_withtrace) {
                __dbg_print('\tNew lookahead symbol: ' + labels[la] + ' (' + info.att + ')');
            }
        //Reduce
        } else {
            act *= -1;

            if (_dbg_withtrace) {
                __dbg_print('Reducing by producution: ' + act);
            }

            rval = void(0);

            if (_dbg_withtrace) {
                __dbg_print('\tPerforming semantic action...');
            }

            switch( act )
{
	case 0:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 1:
	{
		 rval = JXG.GeogebraReader.ggbAct(tree, board, 'end', vstack[ vstack.length - 1 ]); 
	}
	break;
	case 2:
	{
		 rval = JXG.GeogebraReader.ggbAct(tree, board, 'coord', vstack[ vstack.length - 4 ], vstack[ vstack.length - 2 ], element); 
	}
	break;
	case 3:
	{
		 rval = JXG.GeogebraReader.ggbAct(tree, board, 'le', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 4:
	{
		 rval = JXG.GeogebraReader.ggbAct(tree, board, 'ge', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 5:
	{
		 rval = JXG.GeogebraReader.ggbAct(tree, board, 'eq', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 6:
	{
		 rval = JXG.GeogebraReader.ggbAct(tree, board, 'neq', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 7:
	{
		 rval = JXG.GeogebraReader.ggbAct(tree, board, 'lt', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 8:
	{
		 rval = JXG.GeogebraReader.ggbAct(tree, board, 'gt', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 9:
	{
		 rval = JXG.GeogebraReader.ggbAct(tree, board, 'add', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 10:
	{
		 rval = JXG.GeogebraReader.ggbAct(tree, board, 'sub', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 11:
	{
		 rval = JXG.GeogebraReader.ggbAct(tree, board, 'neg', vstack[ vstack.length - 1 ]); 
	}
	break;
	case 12:
	{
		 rval = JXG.GeogebraReader.ggbAct(tree, board, 'pow', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 13:
	{
		 rval = JXG.GeogebraReader.ggbAct(tree, board, 'or', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 14:
	{
		 rval = JXG.GeogebraReader.ggbAct(tree, board, 'and', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 15:
	{
		 rval = JXG.GeogebraReader.ggbAct(tree, board, 'mul', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 16:
	{
		 rval = JXG.GeogebraReader.ggbAct(tree, board, 'div', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 17:
	{
		 rval = JXG.GeogebraReader.ggbAct(tree, board, 'negmult', vstack[ vstack.length - 1 ]); 
	}
	break;
	case 18:
	{
		 rval = JXG.GeogebraReader.ggbAct(tree, board, 'bra', vstack[ vstack.length - 2 ]); 
	}
	break;
	case 19:
	{
		 rval = JXG.GeogebraReader.ggbAct(tree, board, 'string', vstack[ vstack.length - 3 ], vstack[ vstack.length - 1 ]); 
	}
	break;
	case 20:
	{
		 rval = JXG.GeogebraReader.ggbAct(tree, board, 'int', vstack[ vstack.length - 1 ]); 
	}
	break;
	case 21:
	{
		 rval = JXG.GeogebraReader.ggbAct(tree, board, 'float', vstack[ vstack.length - 1 ]); 
	}
	break;
	case 22:
	{
		 rval = JXG.GeogebraReader.ggbAct(tree, board, 'param', vstack[ vstack.length - 1 ]); 
	}
	break;
	case 23:
	{
		 rval = JXG.GeogebraReader.ggbAct(tree, board, 'html', vstack[ vstack.length - 1 ]); 
	}
	break;
	case 24:
	{
		 rval = JXG.GeogebraReader.ggbAct(tree, board, 'string', vstack[ vstack.length - 1 ]); 
	}
	break;
	case 25:
	{
		 rval = JXG.GeogebraReader.ggbAct(tree, board, 'command', vstack[ vstack.length - 1 ]); 
	}
	break;
	case 26:
	{
		 rval = JXG.GeogebraReader.ggbAct(tree, board, 'var', vstack[ vstack.length - 4 ], vstack[ vstack.length - 2 ]); 
	}
	break;
	case 27:
	{
		 rval = JXG.GeogebraReader.ggbAct(tree, board, 'var', vstack[ vstack.length - 1 ]); 
	}
	break;
}



            if (_dbg_withtrace) {
                __dbg_print('\tPopping ' + pop_tab[act][1] + ' off the stack...');
            }

            for (i = 0; i < pop_tab[act][1]; i++) {
                sstack.pop();
                str = vstack.pop();
            }

            go = -1;
            for (i = 0; i < goto_tab[sstack[sstack.length - 1]].length; i += 2) {
                if (goto_tab[sstack[sstack.length - 1]][i] === pop_tab[act][0]) {
                    go = goto_tab[sstack[sstack.length - 1]][i + 1];
                    break;
                }
            }

            if (act === 0) {
                break;
            }

            if (_dbg_withtrace) {
                __dbg_print('\tPushing non-terminal ' + labels[pop_tab[act][0]]);
            }

            sstack.push(go);
            vstack.push(rval);
        }

        if (_dbg_withtrace) {
            JXG.debug(_dbg_string);
            _dbg_string = '';
        }
    }

    if (_dbg_withtrace) {
        __dbg_print('\nParse complete.');
        JXG.debug(_dbg_string);
    }

    return err_cnt;
}

