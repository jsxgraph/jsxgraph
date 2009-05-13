#!/usr/bin/env python

import numpy
import os

os.environ['MPLCONFIGDIR'] = '/tmp'

import matplotlib
from matplotlib.pyplot import *
from matplotlib.contour import *
import re
import zlib
import base64
import cStringIO
import cgi

cocoaPath = '/home/michael/tools/cocoa-4.7/'

print """\
Content-Type: text/html\n
"""

# Data required by this script:
#
# * Number of independent and dependent variables. Number of trace variables is always 2
# * Polynomials generating the ideal
# * Values of the independent variables
# * part of board displayed on screen

# Get Data from post/get parameters
form = cgi.FieldStorage();

number = form.getfirst('number', 'empty')
polys = form.getfirst('polynomials', 'empty')

# Clean them up
number = cgi.escape(number)
polys = base64.b64decode(cgi.escape(polys))

debug = True;

input = ""

# Variable code begins here
# Here indeterminates of polynomial ring have to be adjusted
input += "Use R ::= QQ[u[1..%s],x,y];" % number
# Of course the polynomials generating the ideal must be adjusted
input += "I := Ideal(%s);" % polys
# So have to be the indeterminates to be eliminated
input += "J := Elim(u[1]..u[%s], I);" % number
# and ends here

# Fixed code which hasn't to be adjusted on each run of this script
input += "G := GBasis(J);"
input += "Print \\\"resultsbegin\\\", NewLine;"
input += "For N := 1 To Len(G) Do\\n"
input += "    B := Factor(G[N]);\\n"
input += "    For M := 1 To Len(B) Do\\n"
input += "        StarPrintFold(B[M][1], -1);"
input += "    EndFor;\\n"
input += "EndFor;\\n"
input += "Print \\\"resultsend\\\", NewLine;"

if debug:
    print "Starting CoCoA with input<br />"
    print input + '<br />'

cocoa = os.popen("echo \"" + input + "\" | " + cocoaPath + "cocoa_text")

output = cocoa.read()

if debug:
    print "Reading and Parsing CoCoA output" + '<br />'
    print output + '<br />'

# Extract results
result = re.split('resultsend', re.split('resultsbegin', output)[1])[0]
result = re.split('-------------------------------', re.split('-------------------------------', result)[1])[0]
result = result.replace("^", "**")
polynomials = re.split('\n', result)

if debug:
    print "Found the following polynomials:" + '<br />'
    for i in range(0,len(polynomials)):
        print "Polynomial ", i+1, ": " + polynomials[i] + '<br />'

for i in range(0,len(polynomials)):
    if len(polynomials[i]) == 0:
        continue

    x, y = numpy.meshgrid(numpy.linspace(2, 16, 300), numpy.linspace(-2, 16, 300))

    print polynomials[i] + '<br />'

    z = eval(polynomials[i])
    # z = 18496 - 3072*x**3*y**2 - 1536*x*y**4 - 40448*x*y**2 + 17344*x**2*y**2 + 192*x**4*y**2 + 192*x**2*y**4 + 64*x**6 + 64*y**6 + 23172*x**2 + 12768*x**4 + 60384*x + 4576*y**4 - 24956*y**2 - 40448*x**3 - 1536*x**5
    C = contour(x, y, z, [0])

    if debug:
        savefig('test.png')

    con = C.find_nearest_contour(0, 0)

    pa = C.collections[0].get_paths()[0].to_polygons()[0]

    data = cStringIO.StringIO()

    for i in range(0,len(pa)):
        print >>data, pa[i,0], " ", pa[i,1] + '<br />'

    enc_data = base64.b64encode(zlib.compress(data.getvalue(), 9))

    if debug:
        print data.getvalue() + '<br />'

    print enc_data

    data.close()