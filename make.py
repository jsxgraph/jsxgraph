#!/usr/bin/env python
# -*- coding: utf-8 -*-


license = """/*
    Copyright 2008-2012
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software dual licensed under the GNU LGPL or MIT License.
    
    You can redistribute it and/or modify it under the terms of the
    
      * GNU Lesser General Public License as published by
        the Free Software Foundation, either version 3 of the License, or
        (at your option) any later version
      OR
      * MIT License: https://github.com/jsxgraph/jsxgraph/blob/master/LICENSE.MIT

    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License and
    the MIT License along with JSXGraph. If not, see <http://www.gnu.org/licenses/>
    and <http://opensource.org/licenses/MIT/>.
*/
    """

duallicense = """/*
    Copyright 2008-2012
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    
    Dual licensed under the Apache License Version 2.0, or LGPL Version 3 licenses.

    You should have received a copy of the GNU Lesser General Public License
    along with JSXCompressor.  If not, see <http://www.gnu.org/licenses/>.
    
    You should have received a copy of the Apache License along with JSXCompressor.  
    If not, see <http://www.apache.org/licenses/>.
*/
    """


import sys;
# Parse command line options
import getopt;

# Used for makeRelease & makeCompressor
import os
import re
import tempfile
import shutil

import codecs

# Used for JSHint
import urllib


# Default values for options. May be overridden via command line options
yuglify = "~/node_modules/yuglify/bin/yuglify"
jsdoc = "~/Tools/jsdoc-toolkit"
jstest = "~/Tools/JsTestDriver/JsTestDriver-1.3.4-a.jar"
output = "distrib"
version = None
hint = None
reset = ""
port = 4224
server = ""


'''
    Prints some instructions on how to use this script
'''
def usage():
    print
    print "Usage:  python", sys.argv[0], "[OPTIONS]... TARGET"
    print "Compile and minify the JSXGraph source code, run unit tests, and compile the docs."
    print
    print "Options:"
    print "  -h, --help             Display this help and exit."
    print "  -l, --hint=FILE        Set the file you want to check with JSHint."
    print "  -j, --jsdoc=PATH       Search for jsdoc-toolkit in PATH."
    print "  -o, --output=PATH      Override the default output path distrib/ by PATH."
    print "  -p, --port=PORT        Set server port for the JsTestDriver server. Default is 4224."
    print "      --reset            Force the test server to reload the browsers."
    print "  -s, --server=URL       Overrides the server option in the JsTestDriver config."
    print "  -v, --version=VERSION  Use VERSION as release version for proper zip archive and"
    print "                         folder names."
    print "  -y, --yuglify=PATH     Search for YUI yuglify in PATH."
    print
    print "Targets:"
    print "  Core                   Concatenates and minifies JSXGraph source files into"
    print "                         distrib/jsxgraphcore.js ."
    print "  Release                Makes Core, Readers and Docs and creates distribution ready zip archives"
    print "                         in distrib/ ."
    print "  Readers                Makes Readers and copies them to distrib/ ."
    print "  Docs                   Generate documentation from source code comments. Uses"
    print "                         jsdoc-toolkit."
    print "  Hint                   Run JSHint on the file given with -l or --hint."
    print "  Plot                   Make a slim JSXGraph core just for function plotting."
    print "  Test                   Run Unit Tests with JsTestDriver."
    print "  TestServer             Run JsTestDriver server."
    print "  Compressor             Minify and create a zip archive for JSXCompressor."
    print "  All                    Makes JSXGraph and Compressor."
    

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
            files = r.groups()[1].split(',')
            return files  # return all files in loadjsxgraph.js
    return []


'''
   Read a file and remove the BOM. unused
'''
def removeBOM(s):
    #if s[0] == unicode((codecs.BOM_UTF8), "utf8"):
    if s.startswith(codecs.BOM_UTF8):
        print "found bom"
        s = s[1:]
    
    if s.startswith(codecs.BOM_UTF8):
        print "STILL A BOM"
        
    return s;

'''
   Read a file. unused
'''
def readFile(filename, mode='r', encoding=None):
    if os.path.isfile(filename):
        fi = file(filename,'rb')
        header = fi.read(4) # Read just the first four bytes.
        fi.close()

        encodings = [ ( codecs.BOM_UTF32, 'utf-32' ),
                ( codecs.BOM_UTF16, 'utf-16' ),
                ( codecs.BOM_UTF8, 'utf-8' ) ]

        for h,e in encodings:
            if header.find(h) == 0:
                encoding = e
                break
        return codecs.open(filename, mode, encoding)


'''
   Go through a list of files, remove all BOMs and concatenate the files into
   one string
'''
def catFiles(l):
    jstxt = '';

    for f in l:
        print 'take ', f
        jstxt += open('src/'+f+'.js').read()
        jstxt += '\n\n'

    return jstxt


'''
    Generate jsxgraphcore.js and place it in <output>
'''
def makeCore():
    global yuglify, jsdoc, version, output, license

    print "Making Core..."
    
    jstxt = ''
    license = ("/* Version %s */\n" % version) + license

    # Take the source files and write them into jstxt
    files = ['loadjsxgraphInOneFile'] + findFilenames('src/loadjsxgraph.js') + ['SVGRenderer','VMLRenderer','CanvasRenderer']
    jstxt = catFiles(files)

    # tmpfilename = tempfile.mktemp()
    srcFilename = output + '/jsxgraphsrc.js'

    fout = open(srcFilename,'w')
    fout.write(jstxt)
    fout.close()

    # Prepend license text
    coreFilename = output + "/jsxgraphcore.js"
    fout = open(coreFilename,'w')
    fout.write(license)
    fout.close()

    # Minify: Yuglify
    s = yuglify + " --terminal < " + srcFilename + " >> " + coreFilename
    print s
    os.system(s)
    # os.remove(tmpfilename)

    shutil.copy("src/themes/dark.js", output + "/themes/dark.js")
    shutil.copy("src/themes/gui.js", output + "/themes/gui.js")


'''
    Generate slim jsxplotcore.js and place it in <output>
'''
def makePlot():
    global yuglify, jsdoc, version, output, license

    print "Making Plot..."

    jstxt = ''
    license = ("/* Version %s */\n" % version) + license

    # Take the source files and write them into jstxt
    loader = ['loadjsxgraphInOneFile']
    for f in loader:
        print 'take ', f
        jstxt += open('src/'+f+'.js','r').read()
        jstxt += '\n';

    files = 'JXG,Math,MathNumerics,MathStatistics,MathSymbolic,MathGeometry,AbstractRenderer,GeonextParser,Board,Options,jsxgraph,GeometryElement,Coords,Point,Line,Curve,Text,Composition,Util,Transformation,RGBColor,Wrappers,Ticks'.split(',')
    for f in files:
        print 'take ', f
        jstxt += open('src/'+f+'.js','r').read()
        jstxt += '\n';
    renderer = ['SVGRenderer','CanvasRenderer']
    for f in renderer:
        print 'take ', f
        jstxt += open('src/'+f+'.js','r').read()
        jstxt += '\n';

    tmpfilename = tempfile.mktemp()
    fout = open(tmpfilename,'w')
    fout.write(jstxt)
    fout.close()

    # Prepend license text
    coreFilename = output + "/jsxplotcore.js"
    fout = open(coreFilename,'w')
    fout.write(license)
    fout.close()

    # Minify: Yuglify
    s = yuglify + " --terminal < " + tmpfilename + " >> " + coreFilename
    print s
    os.system(s)
    os.remove(tmpfilename)

'''
    Generate JSXGraph HTML reference, zip it and place the archive in <output>
'''
def makeDocs(afterCore = False):
    global yuglify, jsdoc, version, output
    
    jsd = os.path.expanduser(jsdoc)
    if afterCore:
        out = output
    else:
        out = "distrib"

    print "Making Docs"

    print "Updating jsdoc-template and plugin"

    try:
        # cp ../doc/jsdoc-tk/plugins/* $ROOT/app/plugins/
        shutil.copy("doc/jsdoc-tk/plugins/jsxPseudoClass.js", jsd + "/app/plugins/jsxPseudoClass.js")

        # cp -r ../doc/jsdoc-tk/template/* $ROOT/templates/jsdoc
        shutil.rmtree(jsd + "/templates/jsx/", True)
        shutil.copytree("doc/jsdoc-tk/template", jsd + "/templates/jsx")

        # mkdir $ROOT/templates/jsdoc/static
        # cp ../distrib/jquery.min.js $ROOT/templates/jsdoc/static
        # cp ../distrib/jsxgraphcore.js $ROOT/templates/jsdoc/static
        # cp ../distrib/jsxgraph.css $ROOT/templates/jsdoc/static
        shutil.copy("distrib/jquery.min.js", jsd + "/templates/jsx/static")
        shutil.copy(out + "/jsxgraphcore.js", jsd + "/templates/jsx/static")
        shutil.copy("distrib/jsxgraph.css", jsd + "/templates/jsx/static")
    except IOError as (errno, strerror):
        print "Error: Can't update jsdoc-toolkit template and/or plugin:",strerror
        sys.exit(2)

    #FILELIST=$(cat ../src/loadjsxgraph.js | grep "baseFiles\s*=\s*'\(\w*,\)\+" | awk -F \' '{ print $2 }' | sed 's/,/.js ..\/src\//g')
    files = findFilenames('src/loadjsxgraph.js')
    filesStr = "src/loadjsxgraph.js src/" + ".js src/".join(files) + ".js src/SVGRenderer.js src/VMLRenderer.js src/CanvasRenderer.js"
    
    #java -jar $ROOT/jsrun.jar $ROOT/app/run.js -a -v -t=$ROOT/templates/jsdoc -d=docs ../src/loadjsxgraph.js ../src/$FILELIST.js ../src/SVGRenderer.js ../src/VMLRenderer.js
    os.system("java -jar " + jsd + "/jsrun.jar " + jsd + "/app/run.js -v -p -t=" + jsd + "/templates/jsx -d=tmp/docs " + filesStr)

    #zip -r tmp/docs.zip tmp/docs/
    os.system("cd tmp && zip -r docs-" + version + ".zip docs/ && cd ..")
    shutil.move("tmp/docs-" + version + ".zip", output + "/docs-" + version + ".zip")
    
'''
    Make targets Readers and place them in <output>
'''
def makeReaders():
    global yuglify, output, version, license

    print "Making Readers..."
    
    lic = ("/* Version %s */\n" % version) + license
    reader = ['Geonext', 'Geogebra', 'Intergeo', 'Cinderella']
    for f in reader:
        fname = f + "Reader"
        shutil.copy("src/" + fname + ".js", "tmp/")
        shutil.copy("src/" + fname + ".js", output)

        # Minify; yuglify from Yahoo
        srcFilename = "tmp/" + fname + ".js"
        
        # Prepend license text
        coreFilename = output + "/" + fname + ".min.js"
        
        fout = open(coreFilename,'w')
        fout.write(lic)
        fout.close()
        
        # Minify: Yuglify
        s = yuglify + " --terminal < " + srcFilename + " >> " + coreFilename
        print s
        os.system(s)

'''
    Make targets Core and Docs and create distribution-ready zip archives in <output>
'''
def makeRelease():
    print "Make Release"
    
    makeCore()
    makeDocs(True)
    
    shutil.copy(output + "/jsxgraphcore.js", "tmp/jsxgraphcore.js")
    shutil.copy(output + "/jsxgraphsrc.js", "tmp/jsxgraphsrc.js")
    shutil.copy("README.md", "tmp/README.md")
    shutil.copy("CHANGELOG.md", "tmp/CHANGELOG.md")
    shutil.copy("LICENSE", "tmp/LICENSE")
    shutil.copy("distrib/jsxgraph.css", "tmp/jsxgraph.css")
    
    makeReaders()
    
    shutil.copy("src/themes/dark.js", "tmp/themes/dark.js")
    shutil.copy("src/themes/gui.js", "tmp/themes/gui.js")
    os.system("cd tmp && zip -r jsxgraph-" + version + ".zip docs/ jsxgraphcore.js jsxgraphsrc.js jsxgraph.css themes/ README LICENSE && cd ..")
    shutil.move("tmp/jsxgraph-" + version + ".zip", output + "/jsxgraph-" + version + ".zip")

'''
    Make JSXCompressor, a JSXGraph subproject
'''
def makeCompressor(afterCore = False):
    global yuglify, jsdoc, version, output

    print "Make JSXCompressor"

    if afterCore:
        out = output
    else:
        out = "distrib"

    jstxt = 'JXG = {exists: (function(undefined){return function(v){return !(v===undefined || v===null);}})()};\n'
    jstxt += 'JXG.decompress = function(str) {return unescape((new JXG.Util.Unzip(JXG.Util.Base64.decodeAsArray(str))).unzip()[0][0]);};\n'

    # Take the source files and write them into jstxt
    loader = ['Util']
    for f in loader:
        print 'take ', f
        jstxt += open('src/'+f+'.js','r').read()
        jstxt += '\n';


    srcFilename = output + "/jsxcompressor.js"
    fout = open(srcFilename,'w')
    fout.write(jstxt)
    fout.close()

    # Prepend license text
    coreFilename = output + "/jsxcompressor.min.js"
    fout = open(coreFilename, 'w')
    fout.write(duallicense)
    fout.close()

    # Minify: Yuglify
    s = yuglify + " --terminal < " + srcFilename + " >> " + coreFilename
    print s
    os.system(s)

    os.system("cp %s %s" % (srcFilename, 'JSXCompressor/'))
    os.system("cp %s %s" % (coreFilename, 'JSXCompressor/'))
    # If makeCore has been called just befure, make sure you grab the newest version
    os.system("cp %s %s" % (out + '/jsxgraphcore.js', 'JSXCompressor/'))
    os.system("cp %s %s" % ('distrib/prototype.js', 'JSXCompressor/'))
    os.system("cp %s %s" % ('distrib/jsxgraph.css', 'JSXCompressor/'))
    os.system("rm JSXCompressor/*~")
    os.system("zip -r " + output + "/jsxcompressor.zip JSXCompressor/*")

'''
    Fetch a file from the web
'''
def fetch(url, local):
	webFile = urllib.urlopen(url)
	localFile = open(local, 'w')
	localFile.write(webFile.read())
	webFile.close()
	localFile.close()

'''
    Check a file with JSHint
'''
def makeHint():
    global hint

    # TODO: If hint is None use all files in src/*
    if hint is None:
        print "No file given. Please provide a file with the -l or --hint option."
        return

    # Fetch program files
    fetch('https://github.com/jshint/jshint/raw/master/env/rhino.js', '/tmp/rhino.js')
    fetch('http://jshint.com/jshint.js', '/tmp/jshint.js')

    abshint = os.path.abspath(hint)
    os.system('cd /tmp && rhino /tmp/rhino.js ' + abshint)


'''
    Run Unit Tests
'''
def makeTest():
    global jstest, reset, server
    
    os.system('java -jar ' + jstest + ' ' + reset + ' ' + server + ' --tests all --basePath ./ --config test/jsTestDriver.conf --captureConsole');

'''
    Run Unit Tests Server
'''
def makeTestServer():
    global jstest, reset, port

    os.system('java -jar ' + jstest + ' --port ' + str(port));


'''
    Make targets Release and Compressor
'''
def makeAll():
    makeRelease()
    makeCompressor(True)
    

def main(argv):
    global yuglify, jsdoc, version, output, hint, jstest, reset, port, server

    try:
        opts, args = getopt.getopt(argv, "hy:j:v:o:l:t:p:s:", ["help", "yuglify=", "jsdoc=", "version=", "output=", "hint=", "test=", "reset", "port=", "server="])
    except getopt.GetoptError as (errono, strerror):
        usage()
        sys.exit(2)
    for opt, arg in opts:
        if opt in ("-h", "--help"):
            usage()
            sys.exit(2)
        elif opt in ("-j", "--jsdoc"):
            jsdoc = arg
        elif opt in ("-o", "--output"):
            output = os.path.expanduser(arg)
        elif opt in ("-v", "--version"):
            version = arg
        elif opt in ("-y", "--yuglify"):
            yuglify = arg
        elif opt in ("-l", "--hint"):
            hint = arg
        elif opt in ("-t", "--test"):
            jstest = arg
        elif opt in ("-p", "--port"):
            port = arg
        elif opt in ("--reset"):
            reset = '--reset'
        elif opt in ("-s", "--server"):
            if arg == 'btmdxe':
                server = "--server http://btmdxe.mat.uni-bayreuth.de:4224"
            else:
                server = "--server " + arg

    target = "".join(args)

    # Search for the version and print it before the license text.
    if not version:
        expr = re.compile("JSXGraph v(.*) Copyright")
        r = expr.search(open("src/jsxgraph.js").read())
        version = r.group(1)

    try:
        # Create tmp directory and output directory
        if not os.path.exists(output):
            os.mkdir(output)
        if not os.path.exists(output + "/themes"):
            os.mkdir(output + "/themes")
        if not os.path.exists("tmp"):
            os.mkdir("tmp")
        if not os.path.exists("tmp/themes"):
            os.mkdir("tmp/themes")

        # Call the target make function
        globals()["make" + target]()
        shutil.rmtree("tmp/")
    except KeyError:
        # Oooops, target doesn't exist.
        print "Error: Target", target, "does not exist."
        usage()
        shutil.rmtree("tmp/")
        sys.exit(1)
    except IOError:
        print "Error: Can't create tmp directories."
        sys.exit(1)

if __name__ == "__main__":
    main(sys.argv[1:])
