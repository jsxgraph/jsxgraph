from JXGServerModule import JXGServerModule
import numpy
import numpy.fft
import wave, struct, uuid
import os, subprocess
import StringIO, gzip, base64
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
        resp.addHandler(self.makeAudio, 'function(data) { }')
        return

    def fft(self, resp, x):
        y = numpy.fft.rfft(x)
        y = map(abs, y);
        resp.addData('y', y)
        return

    def _real(self, val):
        return val.real

    def ifft(self, resp, x):
        y = numpy.fft.irfft(x)
        y = map(self._real, y);
        resp.addData('y', y)
        return

    def _set0(val):
        return 0

    # s: 0 < Start < len(x)/2
    # e: 0 < End < len(x)/2
    def cutoutrange(self, resp, x, s, e):
        l = len(x)
        #l2 = math.floor(l/2)
        #if (s < 0) or (e < 0) or (s > l2) or (e < s):
        #    resp.addData('y', x)
        #    return
        #if e > l2:
        #    e = l2
        for i in range(s, e):
            x[i] = 0
        #for i in range(l-e, l-s):
        #    x[i] = 0
        resp.addData('y', x)
        return

    def makeAudio(self, resp, type, samplerate, data):
        fname = '/tmp/'+str(uuid.uuid4())
        fogg = fname + '.ogg'
        w = wave.open(fname, 'w')
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(samplerate)
        w.setnframes(len(data))
        for s in data:
            w.writeframes(struct.pack('h', int(s*4000)))
        w.close()
        ogg_process = subprocess.Popen(["oggenc", fname, "-Q", "-o", fogg], stdout=subprocess.PIPE, stdin=subprocess.PIPE, stderr=subprocess.PIPE, shell=False)
        output = ogg_process.communicate('')[0]
        f = open(fogg, "r")
        audio = f.read()
        audio = "data:audio/ogg;base64," + base64.b64encode(audio)
        resp.addData('audioB64', audio)
        os.remove(fname)
        os.remove(fogg)
        return