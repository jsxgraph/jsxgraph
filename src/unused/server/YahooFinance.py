from JXGServerModule import JXGServerModule
import JXG
import urllib.request, urllib.error, urllib.parse, http.client, io, gzip
import datetime, math, random

class YahooFinance(JXGServerModule):

    def __init__(self):
        self.djmin = 9641.01
        self.djmax = 9735.93
        self.daxmin = 5559.47
        self.daxmax = 5620.13
        JXGServerModule.__init__(self)

    def init(self, resp):
        resp.addHandler(self.getCurrentSharePrice, 'function(data) { alert(data.price); }')
        resp.addHandler(self.getMinMax, 'function(data) { }')
        resp.addHandler(self.getFakeCurrentSharePrice, 'function(data) { alert(data.price); }')
        resp.addHandler(self.getFakeMinMax, 'function(data) { }')
        return

    def _getData(self, share):
        #httplib.HTTPConnection.debuglevel = 1
        # todo: adjust the s parameter to input the share given with parameter share
        request = urllib.request.Request('http://finance.yahoo.com/d/quotes.csv?s=' + share.lower() + '&f=sl1d1t1c1ohgv&e=.csv')
        # accept compressed data
        request.add_header('Accept-encoding', 'gzip')
        opener = urllib.request.build_opener()
        f = opener.open(request)

        compresseddata = f.read()
        compressedstream = io.StringIO(compresseddata)
        gzipper = gzip.GzipFile(fileobj=compressedstream)
        try:
            data = gzipper.read()
            # if data is gzip compressed no exception is thrown
        except:
            # data is not compressed, read original response from server
            data = compresseddata
        return data

    def getCurrentSharePrice(self, resp, share):
        data = self._getData(share)
        datalist = data.split(',')

        resp.addData('price', datalist[1])
        return

    def getMinMax(self, resp, share):
        data = self._getData(share)
        datalist = data.split(',')

        resp.addData('max', datalist[6])
        resp.addData('min', datalist[7])
        return

    def getFakeCurrentSharePrice(self, resp, share):
        if share=='^DJI':
            smax = self.djmax
            smin = self.djmin
        else:
            smax = self.daxmax
            smin = self.daxmin
        
        diff = smax - smin
        base = smin + diff/2. * (1. + math.sin(datetime.datetime.now().second * 2*math.pi))
        price = base + random.uniform(-diff/60., diff/60.)
        resp.addData('price', price)
        return

    def getFakeMinMax(self, resp, share):
        if share=='^DJI':
            smax = self.djmax
            smin = self.djmin
        else:
            smax = self.daxmax
            smin = self.daxmin
        
        resp.addData('max', smax)
        resp.addData('min', smin)
        return
