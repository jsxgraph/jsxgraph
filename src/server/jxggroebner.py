#!/usr/bin/env python

import numpy
import os

############################
#
# Config lines
#
############################

# Should be changed to something more persistent but must be writable by
# the webserver
if not 'MPLCONFIGDIR' in os.environ:
    os.environ['MPLCONFIGDIR'] = '/tmp'

# Command to start cocoa
cmd_cocoa = "cocoa"

# Should'nt be changed, except you know what you're doing
debug = False;

############################

import matplotlib
matplotlib.use('Agg')
from matplotlib.pyplot import *
from matplotlib.contour import *

import re
import zlib
import base64
import cStringIO
import cgi

print """\
Content-Type: text/plain\n
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

# Get viewing rectangle of the board
xs = float(form.getfirst('xs', '-5'))
xe = float(form.getfirst('xe', '5'))
ys = float(form.getfirst('ys', '-5'))
ye = float(form.getfirst('ye', '5'))

# Clean them up
number = cgi.escape(number)
polys = base64.b64decode(cgi.escape(polys))

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
input += "G := ReducedGBasis(J);"
input += "Print \\\"resultsbegin\\\", NewLine;"
input += "For N := 1 To Len(G) Do\\n"
input += "    B := Factor(G[N]);\\n"
input += "    For M := 1 To Len(B) Do\\n"
input += "        StarPrintFold(B[M][1], -1);"
input += "        Print NewLine;"
input += "    EndFor;\\n"
input += "EndFor;\\n"
input += "Print \\\"resultsend\\\", NewLine;"

if debug:
    print "Starting CoCoA with input<br />"
    print input + '<br />'

cocoa = os.popen("echo \"" + input + "\" | " + cmd_cocoa)

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

data = cStringIO.StringIO()

for i in range(0,len(polynomials)):
    if len(polynomials[i]) == 0:
        continue
    if (not "x" in polynomials[i]) and (not "y" in polynomials[i]):
        continue

    x, y = numpy.meshgrid(numpy.linspace(xs, xe, 200), numpy.linspace(ys, ye, 200))

    z = eval(polynomials[i])
    C = contour(x, y, z, [0])

    if debug:
        savefig('/tmp/test%s.png' % i)

    con = C.find_nearest_contour(0, 0)

    for i in range(0, len(C.collections[0].get_paths())):
        pa = C.collections[0].get_paths()[i].to_polygons()[0]

        for i in range(0,len(pa)):
            print >>data, pa[i,0], ",", pa[i,1], ";"

        print >>data, ";"

enc_data = base64.b64encode(zlib.compress(data.getvalue(), 9))

fd = open('/tmp/tmp.txt', 'w')
fd.write(data.getvalue())
fd.close()

if debug:
    print data.getvalue() + '<br />'

print enc_data

data.close()