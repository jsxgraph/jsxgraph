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
import jsmin
import re
import tempfile
import sys

compressor = 'yuicompressor-2.4.2'

'''
    Search for line
    baseFile = 'AbstractRenderer,...,gunzip';
    and return list of filenames
'''
def findFilenames(filename):
    lines = open(filename).readlines()
    expr = re.compile("baseFiles\s*=\s*('|\")([\w,\s]+)('|\")")
    for el in lines:
        el = re.compile("\s+").sub("",el) # Replace whitespace
        r = expr.search(el)
        if r and r.groups()[1]!='gxt':
            #print r.groups()
            files = r.groups()[1].split(',')
            return files  # return all files in loadGeonext
    return []

if __name__ == '__main__':
    jstxt = ''

    # Take the source files and write them into jstxt
    loader = ['loadjsxgraphInOneFile']
    for f in loader:
        print 'take ', f
        jstxt += open('../src/'+f+'.js','r').read()
        jstxt += '\n';

    files = findFilenames('../src/loadjsxgraph.js')
    print files
    for f in files:
        print 'take ', f
        jstxt += open('../src/'+f+'.js','r').read()
        jstxt += '\n';
    renderer = ['SVGRenderer','VMLRenderer']
    for f in renderer:
        print 'take ', f
        jstxt += open('../src/'+f+'.js','r').read()
        jstxt += '\n';

    tmpfilename = tempfile.mktemp()
    fout = open(tmpfilename,'w')
    fout.write(jstxt)
    fout.close()

    # Prepend license text
    coreFilename = '../distrib/jsxgraphcore.js'
    fout = open(coreFilename,'w')
    fout.write(license)
    fout.close()

    # Minify 
    if False:
        # Minify from Douglas Crockford
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


    #
    # The following part is only necessary if we distribute 3 files:
    # copy loadjsxgraph
    if False:
        print "write loadjsxgraph"
        jstxt = open('../src/loadjsxgraph.js','r').read()
        jstxt = re.compile( '(JXG.useMinify\s*=\s*)false').sub(r'\1true',jstxt)
        open('../distrib/loadjsxgraph.js','w').write(jstxt)

        # Minify the renderer
        renderer = ['VMLRenderer','SVGRenderer']
        for f in renderer:
            print 'minify ' + f
            fin = open('../src/'+f+'.js','r')
            fout = open('../distrib/' + f + 'Minify.js','w')
            jsm.minify(fin, fout)
        
