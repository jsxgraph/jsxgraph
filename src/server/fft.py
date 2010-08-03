from JXGServerModule import JXGServerModule
import numpy
import numpy.fft
import wave
import os
import StringIO, gzip
import datetime, math, random

# Should be changed to something more persistent but must be writable by
# the webserver (usually user www-data)
#if not 'MPLCONFIGDIR' in os.environ:
#    os.environ['MPLCONFIGDIR'] = '/tmp/'
#    os.environ['MPLCONFIGDIR'] = 'C:/xampp/tmp'

#import matplotlib
#import matplotlib.pyplot as plt

class FFT(JXGServerModule):

    def __init__(self):
        JXGServerModule.__init__(self)

    def init(self, resp):
        resp.addHandler(self.fft, 'function(data) { }')
        resp.addHandler(self.ifft, 'function(data) { }')
        resp.addHandler(self.cutoutrange, 'function(data) { }')
        return

    def fft(self, resp, x):
        y = numpy.fft.rfft(x)
        y = map(abs, y);
        resp.addData('fft', y)
        return

    def ifft(self, resp, x):
        y = numpy.fft.irfft(x)
        map(abs, y);
        resp.addData('ifft', y)
        return

    def _set0(val):
        return 0

    def cutoutrange(self, resp, x, s, e):
        l = len(x)
        
        return