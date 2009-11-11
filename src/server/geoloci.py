from JXGServerModule import JXGServerModule
import JXG

import numpy
import os

import matplotlib
matplotlib.use('Agg')
from matplotlib.pyplot import *
from matplotlib.contour import *

import subprocess
import signal
import re
import zlib
import base64
import cStringIO
import cgi

# Should be changed to something more persistent but must be writable by
# the webserver
#if not 'MPLCONFIGDIR' in os.environ:
#os.environ['MPLCONFIGDIR'] = '/tmp'
# Example for Windows using XAMPP
#    os.environ['MPLCONFIGDIR'] = 'C:/xampp/tmp'

#cocoa_process = None
#output = ''

class JXGGeoLociModule(JXGServerModule):

    def __init__(self):

        ############################
        #
        # Config lines
        #
        ############################

        # Should be changed to something more persistent but must be writable by
        # the webserver
        #if not 'MPLCONFIGDIR' in os.environ:
        os.environ['MPLCONFIGDIR'] = '/tmp'
        # Example for Windows using XAMPP
        #    os.environ['MPLCONFIGDIR'] = 'C:/xampp/tmp'
    
        # Command to start cocoa
        self.cmd_cocoa = "cocoa"
        # If you're using Windows
        #cmd_cocoa = r"C:\cocoa\cocoa.bat"

        # Shouldn't be changed, except you know what you're doing
        self.debug = False

        ############################

        self.debugOutput = cStringIO.StringIO()

        JXGServerModule.__init__(self)
        return


    def init(self, resp):
        resp.addHandler(self.lociCoCoA, 'function(data) { }')
        return

    def lociCoCoA(self, resp, xs, xe, ys, ye, number, polys):
        self.debug = False;
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
    
        if self.debug:
            print >>self.debugOutput, "Starting CoCoA with input<br />"
            print >>self.debugOutput, cinput + '<br />'

        #cocoa = subprocess.Popen([cmd_cocoa], stdout=subprocess.PIPE, stdin=subprocess.PIPE)

        # The suicide pill for the CoCoA process:
        # If not done within the following amount
        # of seconds, the subprocess will be terminated
    
        time_left = 20

        class TimeoutException(Exception): pass

        def time_limit(seconds):
            def signal_handler(signum, frame):
                raise TimeoutException, "Timed out!"
            signal.signal(signal.SIGALRM, signal_handler)
            signal.alarm(seconds)
        
        global cocoa_process
        global output
        
        def callCoCoA():
            # Global variables aren't that nice, but this time they're useful
            global cocoa_process, output
            cocoa_process = subprocess.Popen([self.cmd_cocoa], stdout=subprocess.PIPE, stdin=subprocess.PIPE, stderr=subprocess.PIPE, shell=False)
            output = cocoa_process.communicate(cinput)[0]
        
        try:
            time_limit(time_left)
            callCoCoA()
        except TimeoutException, msg:
            # This is only tested with linux/unix
            # and works ONLY if the cocoa script cd-ing
            # to the cocoa dir and starting cocoa executes
            # it with
            # $ exec ./cocoa_text
            # This is NOT YET TESTED WITH WINDOWS! (though
            # sharing tests would be nice).
            cocoa_process.kill()
            if self.debug:
                print >>self.debugOutput, "Timed out!"
            resp.error("Timeout, maybe the system of polynomial is too big or there's an error in it.")
        
        if self.debug:
            print >>self.debugOutput, "Reading and Parsing CoCoA output" + '<br />'
            print >>self.debugOutput, output + '<br />'
        
        # Extract results
        result = re.split('resultsend', re.split('resultsbegin', output)[1])[0]
        result = re.split('-------------------------------', re.split('-------------------------------', result)[1])[0]
        result = result.replace("^", "**")
        result = result.replace("\r", "")
        polynomials = re.split('\n', result)
    
        if self.debug:
            print >>self.debugOutput, "Found the following polynomials:" + '<br />'
            for i in range(0,len(polynomials)):
                print >>self.debugOutput, "Polynomial ", i+1, ": " + polynomials[i] + '<br />'
        
        #data = cStringIO.StringIO()
        datax = []
        datay = []
        polynomialsReturn = []
        
        for i in range(0,len(polynomials)):
            if len(polynomials[i]) == 0:
                continue
            if ((not "x" in polynomials[i]) and (not "y" in polynomials[i])) or ("W" in polynomials[i]):
                continue
    
            polynomialsReturn.append(polynomials[i])
            x, y = numpy.meshgrid(numpy.linspace(xs, xe, 200), numpy.linspace(ys, ye, 200))
        
            z = eval(polynomials[i])
            C = contour(x, y, z, [0])
    
            if self.debug:
                savefig('/tmp/test%s.png' % i)
        
            for i in range(0, len(C.collections[0].get_paths())):
                pa = C.collections[0].get_paths()[i].to_polygons()[0]

                for i in range(0,len(pa)):
                    datax.append(pa[i,0])
                    datay.append(pa[i,1])
                    # print >>data, pa[i,0], ",", pa[i,1], ";"
    
                #print >>data, ";"
                datax.append('null')
                datay.append('null')

        #print >>data, "-----"
        #print >>data, polynomialsReturn,";"
        
        #enc_data = base64.b64encode(zlib.compress(data.getvalue(), 9))
        resp.addData('datax', datax)
        resp.addData('datay', datay)
        resp.addData('polynomial', polynomialsReturn)

        #if self.debug:
        #    fd = open('/tmp/tmp.txt', 'w')
        #    fd.write(data.getvalue())
        #    fd.close()

        if self.debug:
            #print >>self.debugOutput, data.getvalue() + '<br />'
            print self.debugOutput.getvalue()

        #print enc_data

        #datax.close()
        self.debugOutput.close()

        return

