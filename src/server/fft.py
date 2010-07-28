from JXGServerModule import JXGServerModule
import numpy
import numpy.fft
import matplotlib
import matplotlib.pyplot as plt
import wave
import StringIO, gzip
import datetime, math, random

class FFT(JXGServerModule):

    def __init__(self):
        JXGServerModule.__init__(self)

    def init(self, resp):
        resp.addHandler(self.fft, 'function(data) { }')
        resp.addHandler(self.ifft, 'function(data) { }')
        return

    def fft(self, resp, x):
        y = numpy.fft.fft(x);
        resp.addData('fft', y)
        return

    def ifft(self, resp, x):
        y = numpy.fft.ifft(x);
        resp.addData('ifft', y)
        return
