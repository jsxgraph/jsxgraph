from JXGServerModule import JXGServerModule
import numpy
import numpy.fft
import wave, struct, uuid
import os, subprocess
import io, gzip, base64
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
        resp.addHandler(self.loadAudio, 'function(data) { }')
        resp.addHandler(self.sampleifft, 'function(data) { }')
        return

    def fft(self, resp, x):
        y = numpy.fft.rfft(x)
        y = list(map(abs, y));
        resp.addData('y', y)
        return

    def _real(self, val):
        return val.real

    def ifft(self, resp, x):
        y = numpy.fft.irfft(x)
        y = list(map(self._real, y));
        resp.addData('y', y)
        return

    def _set0(val):
        return 0

    def sampleifft(self, resp, name, s, e, factor):
        # read wav
        pathtowavefiles = '/share8/home/michael/www-store/audio/'
        fname = pathtowavefiles + os.path.basename(name) + '.wav'
        w = wave.open(fname, 'r')
        (nchannels, sampwidth, framerate, nframes, comptype, compname) = w.getparams()
        frames = w.readframes(nframes*nchannels)
        out = [value/8192. for value in struct.unpack_from("%dh" % nframes * nchannels, frames)]
        w.close()
        # apply fft
        x = numpy.fft.rfft(out)
        # filters
        l = len(x)
        for i in range(0, s):
            x[i] = x[i] * factor
        for i in range(e, l):
            x[i] = x[i] * factor
        #ifft
        y = numpy.fft.irfft(x)
        y = list(map(self._real, y));
        resp.addData('y', y)
        self.makeAudio(resp, 'ogg', framerate, y)
        return

    # s: 0 < Start < len(x)/2
    # e: 0 < End < len(x)/2
    def cutoutrange(self, resp, x, s, e, factor):
        l = len(x)
        for i in range(0, s):
            x[i] = x[i] * factor
        for i in range(e, l):
            x[i] = x[i] * factor
        resp.addData('y', x)
        return

    def loadAudio(self, resp, type, name):
        pathtowavefiles = '/share8/home/michael/www-store/audio/'
        fname = pathtowavefiles + os.path.basename(name) + '.wav'
        fogg = pathtowavefiles + os.path.basename(name) + '.ogg'
        # read ogg
        f = open(fogg, 'r')
        audio = f.read()
        audio = "data:audio/ogg;base64," + base64.b64encode(audio)
        resp.addData('audioB64', audio)
        # read wav
        w = wave.open(fname, 'r')
        (nchannels, sampwidth, framerate, nframes, comptype, compname) = w.getparams()
        frames = w.readframes(nframes*nchannels)
        out = [value/8192. for value in struct.unpack_from("%dh" % nframes * nchannels, frames)]
        w.close()
        step = math.floor(len(out)/7500);
        #resp.addData('audioData',  [out[i] for i in range(len(out)) if i % step == 0]);
        resp.addData('audioData',  out);
        resp.addData('seconds', (nframes*1.0)/framerate)
        resp.addData('samplerate', framerate)
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
            if s < -4:
                s = -4
            if s > 4:
                s = 4
            w.writeframes(struct.pack('h', int(s*4000)))
        w.close()
        ogg_process = subprocess.Popen(["oggenc", fname, "-Q", "-o", fogg], stdout=subprocess.PIPE, stdin=subprocess.PIPE, stderr=subprocess.PIPE, shell=False)
        output = ogg_process.communicate('')[0]
        f = open(fogg, 'r')
        audio = f.read()
        audio = "data:audio/ogg;base64," + base64.b64encode(audio)
        resp.addData('audioB64', audio)
        os.remove(fname)
        os.remove(fogg)
        return
