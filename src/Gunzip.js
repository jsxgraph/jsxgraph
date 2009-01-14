/*
    Copyright 2008,2009
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

/*----------------------------------------------------------------------------

   Gunzip

   Klasse zum Dekodieren von GEONExT-Datei-Strings.
   
   Grundlage fuer die Implementierung ist der Quellcode zu 
   gunzip.c von Pasi Ojala
   http://www.cs.tut.fi/~albert/Dev/gunzip/gunzip.c
   http://www.cs.tut.fi/~albert
   Die JavaScript-Portierung enthaelt nur die Dekodierung von
   Huffman Codes

-------------------------------------------------------------------------------
                                 

-----------------------------------------------------------------------------*/


JXG.Gunzip = function (barray){
    var outputArr = [];
    var output = "";
    
    var bitReverse = [
        0x00, 0x80, 0x40, 0xc0, 0x20, 0xa0, 0x60, 0xe0,
        0x10, 0x90, 0x50, 0xd0, 0x30, 0xb0, 0x70, 0xf0,
        0x08, 0x88, 0x48, 0xc8, 0x28, 0xa8, 0x68, 0xe8,
        0x18, 0x98, 0x58, 0xd8, 0x38, 0xb8, 0x78, 0xf8,
        0x04, 0x84, 0x44, 0xc4, 0x24, 0xa4, 0x64, 0xe4,
        0x14, 0x94, 0x54, 0xd4, 0x34, 0xb4, 0x74, 0xf4,
        0x0c, 0x8c, 0x4c, 0xcc, 0x2c, 0xac, 0x6c, 0xec,
        0x1c, 0x9c, 0x5c, 0xdc, 0x3c, 0xbc, 0x7c, 0xfc,
        0x02, 0x82, 0x42, 0xc2, 0x22, 0xa2, 0x62, 0xe2,
        0x12, 0x92, 0x52, 0xd2, 0x32, 0xb2, 0x72, 0xf2,
        0x0a, 0x8a, 0x4a, 0xca, 0x2a, 0xaa, 0x6a, 0xea,
        0x1a, 0x9a, 0x5a, 0xda, 0x3a, 0xba, 0x7a, 0xfa,
        0x06, 0x86, 0x46, 0xc6, 0x26, 0xa6, 0x66, 0xe6,
        0x16, 0x96, 0x56, 0xd6, 0x36, 0xb6, 0x76, 0xf6,
        0x0e, 0x8e, 0x4e, 0xce, 0x2e, 0xae, 0x6e, 0xee,
        0x1e, 0x9e, 0x5e, 0xde, 0x3e, 0xbe, 0x7e, 0xfe,
        0x01, 0x81, 0x41, 0xc1, 0x21, 0xa1, 0x61, 0xe1,
        0x11, 0x91, 0x51, 0xd1, 0x31, 0xb1, 0x71, 0xf1,
        0x09, 0x89, 0x49, 0xc9, 0x29, 0xa9, 0x69, 0xe9,
        0x19, 0x99, 0x59, 0xd9, 0x39, 0xb9, 0x79, 0xf9,
        0x05, 0x85, 0x45, 0xc5, 0x25, 0xa5, 0x65, 0xe5,
        0x15, 0x95, 0x55, 0xd5, 0x35, 0xb5, 0x75, 0xf5,
        0x0d, 0x8d, 0x4d, 0xcd, 0x2d, 0xad, 0x6d, 0xed,
        0x1d, 0x9d, 0x5d, 0xdd, 0x3d, 0xbd, 0x7d, 0xfd,
        0x03, 0x83, 0x43, 0xc3, 0x23, 0xa3, 0x63, 0xe3,
        0x13, 0x93, 0x53, 0xd3, 0x33, 0xb3, 0x73, 0xf3,
        0x0b, 0x8b, 0x4b, 0xcb, 0x2b, 0xab, 0x6b, 0xeb,
        0x1b, 0x9b, 0x5b, 0xdb, 0x3b, 0xbb, 0x7b, 0xfb,
        0x07, 0x87, 0x47, 0xc7, 0x27, 0xa7, 0x67, 0xe7,
        0x17, 0x97, 0x57, 0xd7, 0x37, 0xb7, 0x77, 0xf7,
        0x0f, 0x8f, 0x4f, 0xcf, 0x2f, 0xaf, 0x6f, 0xef,
        0x1f, 0x9f, 0x5f, 0xdf, 0x3f, 0xbf, 0x7f, 0xff
    ];
    
    var cplens = [
        3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31,
        35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0
    ];

    var cplext = [
        0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2,
        3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 99, 99
    ]; /* 99==invalid */

    var cpdist = [
        0x0001, 0x0002, 0x0003, 0x0004, 0x0005, 0x0007, 0x0009, 0x000d,
        0x0011, 0x0019, 0x0021, 0x0031, 0x0041, 0x0061, 0x0081, 0x00c1,
        0x0101, 0x0181, 0x0201, 0x0301, 0x0401, 0x0601, 0x0801, 0x0c01,
        0x1001, 0x1801, 0x2001, 0x3001, 0x4001, 0x6001
    ];

    var cpdext = [
        0,  0,  0,  0,  1,  1,  2,  2,
        3,  3,  4,  4,  5,  5,  6,  6,
        7,  7,  8,  8,  9,  9, 10, 10,
        11, 11, 12, 12, 13, 13
    ];
    
    var border = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
    
    var bA = barray;

    var bytepos=0;
    var bitpos=0;
    var bb = 1;
    var bits=0;
    
    function readByte(){
        bits+=8;
        if (bytepos<bA.length)
            return bA[++bytepos];
        else
            return -1;
    };

    function byteAlign(){
        bb = 1;
    };
    
    function readBit(){
        bits++;
        var carry = (bb & 1);
        bb >>= 1;
        if (bb==0){
            bb = readByte();
            carry = (bb & 1);
            bb = (bb>>1) | 0x80;
        }
        return carry;
    };

    function readBits(a) {
        var res = 0;
        var i = a;
    
        while(i--) {
            res = (res<<1) | readBit();
        }
        if(a) {
            res = bitReverse[res]>>(8-a);
        }
        return res;
    };
    
    var buf32k = new Array(32768);
    var bIdx = 0;

    var CRC, SIZE;
    
    function flushBuffer(){
        //document.write('FLUSHBUFFER:'+buf32k);
        bIdx = 0;
    };
    function addBuffer(a){
        SIZE++;
        //CRC=updcrc(a,crc);
        buf32k[bIdx++] = a;
        outputArr.push(String.fromCharCode(a));
        //output+=String.fromCharCode(a);
        if(bIdx==0x8000){
            //document.write('ADDBUFFER:'+buf32k);
            bIdx=0;
        }
    };
    
    function HufNode() {
        this.b0=0;
        this.b1=0;
        this.jump = null;
        this.jumppos = -1;
    };

    var LITERALS = 288;
    
    var literalTree = new Array(LITERALS);
    var distanceTree = new Array(32);
    var treepos=0;
    var Places = null;
    var Places2 = null;
    
    var impDistanceTree = new Array(64);
    var impLengthTree = new Array(64);
    
    var len = 0;
    var fpos = new Array(17);
    fpos[0]=0;
    var flens;
    var fmax;
    
    function IsPat() {
        while (1) {
            if (fpos[len] >= fmax)
                return -1;
            if (flens[fpos[len]] == len)
                return fpos[len]++;
            fpos[len]++;
        }
    };

    function Rec() {
        var curplace = Places[treepos];
        var tmp;
    
        if(len==17) {
            return -1;
        }
        treepos++;
        len++;
    
        tmp = IsPat();
        //document.write("<br>IsPat "+tmp);
        if(tmp >= 0) {
            curplace.b0 = tmp;    /* leaf cell for 0-bit */
            //document.write("<br>b0 "+curplace.b0);
        } else {
        /* Not a Leaf cell */
        curplace.b0 = 0x8000;
        //document.write("<br>b0 "+curplace.b0);
        if(Rec())
            return -1;
        }
        tmp = IsPat();
        if(tmp >= 0) {
            curplace.b1 = tmp;    /* leaf cell for 1-bit */
            //document.write("<br>b1 "+curplace.b1);
            curplace.jump = null;    /* Just for the display routine */
        } else {
            /* Not a Leaf cell */
            curplace.b1 = 0x8000;
            //document.write("<br>b1 "+curplace.b1);
            curplace.jump = Places[treepos];
            curplace.jumppos = treepos;
            if(Rec())
                return -1;
        }
        len--;
        return 0;
    };

    function CreateTree(currentTree, numval, lengths, show) {
        var i;
        /* Create the Huffman decode tree/table */
        //document.write("<br>createtree<br>");
        //document.write("currentTree "+currentTree+" numval "+numval+" lengths "+lengths+" show "+show);
        Places = currentTree;
        treepos=0;
        flens = lengths;
        fmax  = numval;
        for (i=0;i<17;i++)
            fpos[i] = 0;
        len = 0;
        if(Rec()) {
            //fprintf(stderr, "invalid huffman tree\n");
            return -1;
        }
        /*document.write('<br>Tree: '+Places.length);
        for (a=0;a<32;a++){
            document.write("Places["+a+"].b0="+Places[a].b0+"<br>");
            document.write("Places["+a+"].b1="+Places[a].b1+"<br>");
        }*/
    
        /*if(show) {
            var tmp;
            for(tmp=currentTree;tmp<Places;tmp++) {
                fprintf(stdout, "0x%03x  0x%03x (0x%04x)",tmp-currentTree, tmp->jump?tmp->jump-currentTree:0,(tmp->jump?tmp->jump-currentTree:0)*6+0xcf0);
                if(!(tmp.b0 & 0x8000)) {
                    //fprintf(stdout, "  0x%03x (%c)", tmp->b0,(tmp->b0<256 && isprint(tmp->b0))?tmp->b0:'�');
                }
                if(!(tmp.b1 & 0x8000)) {
                    if((tmp.b0 & 0x8000))
                        fprintf(stdout, "           ");
                    fprintf(stdout, "  0x%03x (%c)", tmp->b1,(tmp->b1<256 && isprint(tmp->b1))?tmp->b1:'�');
                }
                fprintf(stdout, "\n");
            }
        }*/
        return 0;
    };
    
    function DecodeValue(currentTree) {
        var xtreepos=0;
        var X = currentTree[xtreepos];

        /* decode one symbol of the data */
        while(1) {
            var b;
            if(b=readBit()) {
                if(!(X.b1 & 0x8000)){
                    //document.write("ret1");
                    return X.b1;    /* If leaf node, return data */
                }
                X = X.jump;
                for (var i=0;i<currentTree.length;i++){
                    if (currentTree[i]===X){
                        xtreepos=i;
                        break;
                    }
                }
                //xtreepos++;
            } else {
                if(!(X.b0 & 0x8000)){
                    //document.write("ret2");
                    return X.b0;    /* If leaf node, return data */
                }
                //X++; //??????????????????
                xtreepos++;
                X = currentTree[xtreepos];
            }
        }
        //document.write("ret3");
        return -1;
    };
    
    function DeflateLoop() {
    var last, c, type, i;

    do {
        /*if((last = readBit())){
            fprintf(errfp, "Last Block: ");
        } else {
            fprintf(errfp, "Not Last Block: ");
        }*/
        var last = readBit();

        var type = readBits(2);
        switch(type) {
            case 0:
                //document.write("Stored\n");
                break;
            case 1:
                //document.write("Fixed Huffman codes\n");
                break;
            case 2:
                //document.write("Dynamic Huffman codes\n");
                break;
            case 3:
                //document.write("Reserved block type!!\n");
                break;
            default:
                //document.write("Unexpected value %d!\n", type);
                break;
        }

        if(type==0) {/*
            var blockLen, cSum;

            // Stored 
               BYTEALIGN();
            blockLen = READBYTE();
            blockLen |= (READBYTE()<<8);

               cSum = READBYTE();
            cSum |= (READBYTE()<<8);

            if(((blockLen ^ ~cSum) & 0xffff)) {
                document.write("BlockLen checksum mismatch\n");
            }
               while(blockLen--) {
                c = READBYTE();
                ADDBUFFER(c, outfp);
            }*/
    } else if(type==1) {
        var j;

        /* Fixed Huffman tables -- fixed decode routine */
        while(1) {
        /*
            256    0000000        0
            :   :     :
            279    0010111        23
            0   00110000    48
            :    :      :
            143    10111111    191
            280 11000000    192
            :    :      :
            287 11000111    199
            144    110010000    400
            :    :       :
            255    111111111    511

            Note the bit order!
         */

        j = (bitReverse[readBits(7)]>>1);
        if(j > 23) {
            j = (j<<1) | readBit();    /* 48..255 */

            if(j > 199) {    /* 200..255 */
            j -= 128;    /*  72..127 */
            j = (j<<1) | readBit();        /* 144..255 << */
            } else {        /*  48..199 */
            j -= 48;    /*   0..151 */
            if(j > 143) {
                j = j+136;    /* 280..287 << */
                    /*   0..143 << */
            }
            }
        } else {    /*   0..23 */
            j += 256;    /* 256..279 << */
        }
        if(j < 256) {
            addBuffer(j);
            //document.write("out:"+String.fromCharCode(j));
/*fprintf(errfp, "@%d %02x\n", SIZE, j);*/
        } else if(j == 256) {
            /* EOF */
            break;
        } else {
            var len, dist;

            j -= 256 + 1;    /* bytes + EOF */
            len = readBits(cplext[j]) + cplens[j];

            j = bitReverse[readBits(5)]>>3;
            if(cpdext[j] > 8) {
            dist = readBits(8);
            dist |= (readBits(cpdext[j]-8)<<8);
            } else {
            dist = readBits(cpdext[j]);
            }
            dist += cpdist[j];

/*fprintf(errfp, "@%d (l%02x,d%04x)\n", SIZE, len, dist);*/
            for(j=0;j<len;j++) {
            var c = buf32k[(bIdx - dist) & 0x7fff];
            addBuffer(c);
            }
        }
        }
    } else if(type==2) {
            var j, n, literalCodes, distCodes, lenCodes;
            var ll = new Array(288+32);    // "static" just to preserve stack
    
            // Dynamic Huffman tables 
    
            literalCodes = 257 + readBits(5);
            distCodes = 1 + readBits(5);
            lenCodes = 4 + readBits(4);
            //document.write("<br>param: "+literalCodes+" "+distCodes+" "+lenCodes+"<br>");
            for(j=0; j<19; j++) {
                ll[j] = 0;
            }
    
            // Get the decode tree code lengths
    
            //document.write("<br>");
            for(j=0; j<lenCodes; j++) {
                ll[border[j]] = readBits(3);
                //document.write(ll[border[j]]+" ");
            }
            //fprintf(errfp, "\n");
            //document.write('<br>ll:'+ll);
            for (i=0; i<distanceTree.length; i++)
                distanceTree[i]=new HufNode();
            if(CreateTree(distanceTree, 19, ll, 0)) {
                flushBuffer();
                return 1;
            }
            //document.write("<br>distanceTree");
            //AW: for(var a=0;a<distanceTree.length;a++){
                //document.write("<br>"+distanceTree[a].b0+" "+distanceTree[a].b1+" "+distanceTree[a].jump+" "+distanceTree[a].jumppos);
                /*if (distanceTree[a].jumppos!=-1)
                    document.write(" "+distanceTree[a].jump.b0+" "+distanceTree[a].jump.b1);
                */
            //}
            //document.write('<BR>tree created');
    
            //read in literal and distance code lengths
            n = literalCodes + distCodes;
            i = 0;
            var z=-1;
            //document.write("<br>n="+n+" bits: "+bits+"<br>");
            while(i < n) {
                z++;
                j = DecodeValue(distanceTree);
                //document.write("<br>"+z+" i:"+i+" decode: "+j+"    bits "+bits+"<br>");
                if(j<16) {    // length of code in bits (0..15)
                       ll[i++] = j;
                } else if(j==16) {    // repeat last length 3 to 6 times 
                       var l;
                    j = 3 + readBits(2);
                    if(i+j > n) {
                        flushBuffer();
                        return 1;
                    }
                    l = i ? ll[i-1] : 0;
                    while(j--) {
                        ll[i++] = l;
                    }
                } else {
                    if(j==17) {        // 3 to 10 zero length codes
                        j = 3 + readBits(3);
                    } else {        // j == 18: 11 to 138 zero length codes 
                        j = 11 + readBits(7);
                    }
                    if(i+j > n) {
                        flushBuffer();
                        return 1;
                    }
                    while(j--) {
                        ll[i++] = 0;
                    }
                }
            }
            /*for(j=0; j<literalCodes+distCodes; j++) {
                //fprintf(errfp, "%d ", ll[j]);
                if ((j&7)==7)
                    fprintf(errfp, "\n");
            }
            fprintf(errfp, "\n");*/
            // Can overwrite tree decode tree as it is not used anymore
            for (i=0; i<literalTree.length; i++)
                literalTree[i]=new HufNode();
            if(CreateTree(literalTree, literalCodes, ll, 0)) {
                flushBuffer();
                return 1;
            }
            for (i=0; i<distanceTree.length; i++)
                distanceTree[i]=new HufNode();
            var ll2 = new Array();
            for (i=literalCodes; i <ll.length; i++){
                ll2[i-literalCodes]=ll[i];
            }    
            if(CreateTree(distanceTree, distCodes, ll2, 0)) {
                flushBuffer();
                return 1;
            }
            while(1) {
                j = DecodeValue(literalTree);
                if(j >= 256) {        // In C64: if carry set
                    var len, dist;
                    j -= 256;
                    if(j == 0) {
                        // EOF
                        break;
                    }
                    j--;
                    len = readBits(cplext[j]) + cplens[j];
    
                    j = DecodeValue(distanceTree);
                    if(cpdext[j] > 8) {
                        dist = readBits(8);
                        dist |= (readBits(cpdext[j]-8)<<8);
                    } else {
                        dist = readBits(cpdext[j]);
                    }
                    dist += cpdist[j];
                    while(len--) {
                        var c = buf32k[(bIdx - dist) & 0x7fff];
                        addBuffer(c);
                    }
                } else {
                    addBuffer(j);
                }
            }
        }
    } while(!last);
    flushBuffer();

    byteAlign();
    return 0;
};



    
    
    JXG.Gunzip.prototype.unzip = function() {
        /*for (i=0; i<bA.length; i++){
            document.write(readBit());
            if (!((i+1)%8))
                document.write(' ');
        }*/
        readByte(2); /*throw away the first two bytes*/
        DeflateLoop();
        return(outputArr.join(''));

    };
};

