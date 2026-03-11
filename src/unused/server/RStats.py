from JXGServerModule import JXGServerModule
from rpy import r
import JXG
import io, gzip
import datetime, math, random

class RStats(JXGServerModule):

    def __init__(self):
        JXGServerModule.__init__(self)

    def init(self, resp):
        resp.addHandler(self.mean, 'function(data) { }')
        resp.addHandler(self.sd, 'function(data) { }')
        resp.addHandler(self.median, 'function(data) { }')
        resp.addHandler(self.mad, 'function(data) { }')
        resp.addHandler(self.all, 'function(data) { }')
        return

    def mean(self, resp, x):
        y = r.mean(x);
        resp.addData('mean', y)
        return

    def sd(self, resp, x):
        y = r.sd(x);
        resp.addData('sd', y)
        return

    def median(self, resp, x):
        y = r.median(x);
        resp.addData('median', y)
        return

    def mad(self, resp, x):
        y = r.mad(x);
        resp.addData('mad', y)
        return

    def all(self, resp, x):
        self.mean(resp, x)
        self.sd(resp, x)
        self.median(resp, x)
        self.mad(resp, x)
        return