# -*- coding: utf-8 -*-
 #!/usr/bin/python
    
license = """/*
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
    """

import os
import re
import tempfile
import sys

compressor = 'yuicompressor-2.4.2'

if __name__ == '__main__':
    jstxt = 'JXG = {};\n'
    jstxt += 'JXG.decompress = function(str) {return unescape((new JXG.Util.Unzip(JXG.Util.Base64.decodeAsArray(str))).unzip()[0][0]);};\n'

    # Take the source files and write them into jstxt
    loader = ['Util']
    for f in loader:
        print 'take ', f
        jstxt += open('../src/'+f+'.js','r').read()
        jstxt += '\n';


    tmpfilename = tempfile.mktemp()
    fout = open(tmpfilename,'w')
    fout.write(jstxt)
    fout.close()

    # Prepend license text
    coreFilename = '../distrib/jsxcompressor.js'
    fout = open(coreFilename,'w')
    fout.write(license)
    fout.close()

    # Minify 
    if False:
        # Minify from Douglas Crockford
	import jsmin
        fin = open(tmpfilename,'r')
        fout = open(coreFilename,'a')
        jsm = jsmin.JavascriptMinify()
        jsm.minify(fin, fout)
    else:
        # YUI compressor from Yahoo
        s = 'java -jar ./' + compressor + '/build/' + compressor + '.jar --type js ' + tmpfilename + ' >>' + coreFilename
        print s
        os.system(s)
     
    os.remove(tmpfilename)
    os.system("cp %s %s" % (coreFilename, '../JSXCompressor/'))
    os.system("cp %s %s" % ('../distrib/jsxgraphcore.js', '../JSXCompressor/'))
    os.system("cp %s %s" % ('../distrib/prototype.js', '../JSXCompressor/'))
    os.system("cp %s %s" % ('../distrib/jsxgraph.css', '../JSXCompressor/'))
    os.system("rm ../JSXCompressor/*~")
    os.system("zip -r ../distrib/jsxcompressor.zip ../JSXCompressor/*")


