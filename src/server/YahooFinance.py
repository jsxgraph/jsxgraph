from JXGServerModule import JXGServerModule
import JXG
import urllib2, httplib, StringIO, gzip

class YahooFinance(JXGServerModule):

    def init(self, resp):
        resp.addHandler(self.getCurrentSharePrice, 'function(data) { alert(data.price); }')
        resp.addHandler(self.getMinMax, 'function(data) { }')
        return

    def _getData(self, share):
        #httplib.HTTPConnection.debuglevel = 1
        # todo: adjust the s parameter to input the share given with parameter share
        request = urllib2.Request('http://finance.yahoo.com/d/quotes.csv?s=' + share.lower() + '&f=sl1d1t1c1ohgv&e=.csv')
        # accept compressed data
        request.add_header('Accept-encoding', 'gzip')
        opener = urllib2.build_opener()
        f = opener.open(request)

        compresseddata = f.read()
        compressedstream = StringIO.StringIO(compresseddata)
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
