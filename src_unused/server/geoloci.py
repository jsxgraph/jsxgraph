from JXGServerModule import JXGServerModule
import JXG

import numpy
import os

# Should be changed to something more persistent but must be writable by
# the webserver (usually user www-data)
if not 'MPLCONFIGDIR' in os.environ:
    os.environ['MPLCONFIGDIR'] = '/tmp/'
#    os.environ['MPLCONFIGDIR'] = 'C:/xampp/tmp'

import matplotlib
matplotlib.use('Agg')
from matplotlib.pyplot import *
from matplotlib.contour import *

import subprocess
import signal
import time
import re
import zlib
import base64
import io
import cgi
import math

class JXGGeoLociModule(JXGServerModule):

    def __init__(self):

        ############################
        #
        # Config lines
        #
        ############################

        # Command to start cocoa
        self.cmd_cocoa = "/share8/opt/cocoa/cocoa"
        # If you're using Windows
        #cmd_cocoa = r"C:\cocoa\cocoa.bat"

        # Shouldn't be changed, except you know what you're doing
        self.debug = False

        ############################

        self.debugOutput = io.StringIO()

        JXGServerModule.__init__(self)
        return


    def init(self, resp):
        resp.addHandler(self.lociCoCoA, 'function(data) { }')
        return

    def lociCoCoA(self, resp, xs, xe, ys, ye, number, polys, sf, rot, transx, transy):
        self.output = ''
        self.cococa_process = None
        cinput = ""
        c = math.cos(rot)
        s = math.sin(rot)
        tx = 0;

        # Variable code begins here
        # Here indeterminates of polynomial ring have to be adjusted

        if number > 0:
            cinput += "Use R ::= QQ[u[1..%s],x,y], Xel;" % number
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
        #cinput =  "Ciao;"

        if self.debug:
            print("Starting CoCoA with input<br />", file=self.debugOutput)
            print(cinput + '<br />', file=self.debugOutput)

        # The suicide pill for the CoCoA process:
        # If not done within the following amount
        # of seconds, the subprocess will be terminated

        time_left = 30

        class TimeoutException(Exception): pass

        def time_limit(seconds):
            def signal_handler(signum, frame):
                raise TimeoutException("Timed out!")
            signal.signal(signal.SIGALRM, signal_handler)
            signal.alarm(seconds)

        #global cocoa_process
        #global output

        def callCoCoA():
            # Global variables aren't that nice, but this time they're useful
            #global cocoa_process, output
            self.cocoa_process = subprocess.Popen([self.cmd_cocoa], stdout=subprocess.PIPE, stdin=subprocess.PIPE, stderr=subprocess.PIPE, shell=False)
            self.output = self.cocoa_process.communicate(cinput)[0]

        calc_time = time.time()
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
            self.cocoa_process.kill()
            if self.debug:
                print("Timed out!", file=self.debugOutput)
            resp.error("Timeout, maybe the system of polynomial is too big or there's an error in it.")
            return

        calc_time = time.time() - calc_time
        resp.addData('exectime', calc_time)

        if self.debug:
            print("Reading and Parsing CoCoA output" + '<br />', file=self.debugOutput)
            print(self.output + '<br />', file=self.debugOutput)

        # Extract results
        if re.search('resultsbegin', self.output) is None:
            return
        result = re.split('resultsend', re.split('resultsbegin', self.output)[1])[0]
        result = re.split('-------------------------------', re.split('-------------------------------', result)[1])[0]
        result = result.replace("^", "**")
        result = result.replace("\r", "")
        polynomials = re.split('\n', result)

        if self.debug:
            print("Found the following polynomials:" + '<br />', file=self.debugOutput)
            for i in range(0,len(polynomials)):
                print("Polynomial ", i+1, ": " + polynomials[i] + '<br />', file=self.debugOutput)

        datax = []
        datay = []
        polynomialsReturn = []

        for i in range(0,len(polynomials)):
            if len(polynomials[i]) == 0:
                continue
            if ((not "x" in polynomials[i]) and (not "y" in polynomials[i])) or ("W" in polynomials[i]):
                continue

            polynomialsReturn.append(polynomials[i])
            x, y = numpy.meshgrid(numpy.linspace(xs, xe, 500), numpy.linspace(ys, ye, 500))

            z = eval(polynomials[i])
            C = contour(x, y, z, [0])

            if self.debug:
                savefig('/tmp/test%s.png' % i)

            for i in range(0, len(C.collections[0].get_paths())):
                pa = C.collections[0].get_paths()[i].to_polygons()[0]

                for i in range(0,len(pa)):
                    tx = pa[i, 0]
                    pa[i, 0] = c*pa[i,0] - s*pa[i,1]
                    pa[i, 1] = s*tx + c*pa[i,1]
                    datax.append(sf*pa[i,0] + transx)
                    datay.append(sf*pa[i,1] + transy)

                datax.append('null')
                datay.append('null')

        resp.addData('datax', datax)
        resp.addData('datay', datay)
        resp.addData('polynomial', polynomialsReturn)

        if self.debug:
            print(", ".join(map(str, datax)) + '<br />', file=self.debugOutput)
            print(", ".join(map(str, datay)) + '<br />', file=self.debugOutput)
            print("Content-Type: text/plain\n\n")
            print()
            print()
            print(self.debugOutput.getvalue())

        self.debugOutput.close()

        return
