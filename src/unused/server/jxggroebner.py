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
# Example for Windows using XAMPP
#    os.environ['MPLCONFIGDIR'] = 'C:/xampp/tmp'

# Command to start cocoa
cmd_cocoa = "cocoa"
# If you're using Windows
#cmd_cocoa = r"C:\cocoa\cocoa.bat"

# Shouldn't be changed, except you know what you're doing
debug = False

############################

import matplotlib
matplotlib.use('Agg')
from matplotlib.pyplot import *
from matplotlib.contour import *

import subprocess
import signal
import re
import zlib
import base64
import io
import cgi

debugOutput = io.StringIO()

print("Content-Type: text/plain\n\n")
print()
print()

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
number = int(cgi.escape(number))
polys = base64.b64decode(cgi.escape(polys))

cinput = ""

# Variable code begins here
# Here indeterminates of polynomial ring have to be adjusted

if number > 0:
    cinput += "Use R ::= QQ[u[1..%s],x,y];" % number
else:
    cinput += "Use R ::= QQ[x,y];"

# Of course the polynomials generating the ideal must be adjusted
cinput += "I := Ideal(%s);" % polys

# So have to be the indeterminates to be eliminated
if number > 0:
    cinput += "J := Elim(u[1]..u[%s], I); J;" % number
else:
    cinput += "J := I; J;"

# and ends here

# Fixed code which hasn't to be adjusted on each run of this script
cinput += "G := ReducedGBasis(J);"
cinput += "Print \"resultsbegin\", NewLine;"
cinput += "For N := 1 To Len(G) Do\n"
cinput += "    B := Factor(G[N]);\n"
cinput += "    For M := 1 To Len(B) Do\n"
cinput += "        StarPrintFold(B[M][1], -1);"
cinput += "        Print NewLine;"
cinput += "    EndFor;\n"
cinput += "EndFor;\n"
cinput += "Print \"resultsend\", NewLine;"

if debug:
    print("Starting CoCoA with input<br />", file=debugOutput)
    print(cinput + '<br />', file=debugOutput)

#cocoa = subprocess.Popen([cmd_cocoa], stdout=subprocess.PIPE, stdin=subprocess.PIPE)

# The suicide pill for the CoCoA process:
# If not done within the following amount
# of seconds, the subprocess will be terminated

time_left = 20

class TimeoutException(Exception): pass

def time_limit(seconds):
    def signal_handler(signum, frame):
        raise TimeoutException("Timed out!")
    signal.signal(signal.SIGALRM, signal_handler)
    signal.alarm(seconds)

cocoa_process = None
output = ''

def callCoCoA():
    # Global variables aren't that nice, but this time is see no way out
    global cocoa_process, output
    cocoa_process = subprocess.Popen([cmd_cocoa], stdout=subprocess.PIPE, stdin=subprocess.PIPE, stderr=subprocess.PIPE, shell=False)
    #cocoa_process.stdin.write(input)
    output = cocoa_process.communicate(cinput)[0]
    #cocoa_process.stdin.close()


try:
    time_limit(time_left)
    callCoCoA()
except TimeoutException as msg:
    # This is only tested with linux/unix
    # and works ONLY if the cocoa script cd-ing
    # to the cocoa dir and starting cocoa executes
    # it with
    # $ exec ./cocoa_text
    # This is NOT YET TESTED WITH WINDOWS! (though
    # sharing tests would be nice).
    cocoa_process.kill()
    #cocoa_process.terminate()
    #cocoa_process.send_signal(signal.SIGTERM)
    #subprocess.Popen(["killall", "cocoa_text"])
    #os.system('killall -9 cocoa_text')
    if debug:
        print("Timed out!", file=debugOutput)
    exit()

#cocoa = os.popen("echo \"" + input + "\" | " + cmd_cocoa)

#output = cocoa.read()

if debug:
    print("Reading and Parsing CoCoA output" + '<br />', file=debugOutput)
    print(output + '<br />', file=debugOutput)

# Extract results
result = re.split('resultsend', re.split('resultsbegin', output)[1])[0]
result = re.split('-------------------------------', re.split('-------------------------------', result)[1])[0]
result = result.replace("^", "**")
result = result.replace("\r", "")
polynomials = re.split('\n', result)

if debug:
    print("Found the following polynomials:" + '<br />', file=debugOutput)
    for i in range(0,len(polynomials)):
        print("Polynomial ", i+1, ": " + polynomials[i] + '<br />', file=debugOutput)

data = io.StringIO()
polynomialsReturn = ""

for i in range(0,len(polynomials)):
    if len(polynomials[i]) == 0:
        continue
    if ((not "x" in polynomials[i]) and (not "y" in polynomials[i])) or ("W" in polynomials[i]):
        continue

    polynomialsReturn = polynomialsReturn + polynomials[i] + ";"
    x, y = numpy.meshgrid(numpy.linspace(xs, xe, 200), numpy.linspace(ys, ye, 200))

    z = eval(polynomials[i])
    C = contour(x, y, z, [0])

    if debug:
        savefig('/tmp/test%s.png' % i)

    for i in range(0, len(C.collections[0].get_paths())):
        pa = C.collections[0].get_paths()[i].to_polygons()[0]

        for i in range(0,len(pa)):
            print(pa[i,0], ",", pa[i,1], ";", file=data)

        print(";", file=data)

print("-----", file=data)
print(polynomialsReturn,";", file=data)

enc_data = base64.b64encode(zlib.compress(data.getvalue(), 9))

if debug:
    fd = open('/tmp/tmp.txt', 'w')
    fd.write(data.getvalue())
    fd.close()

if debug:
    print(data.getvalue() + '<br />', file=debugOutput)
    print(debugOutput.getvalue())

print(enc_data)

data.close()
debugOutput.close()
