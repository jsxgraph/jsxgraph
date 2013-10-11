#!/usr/bin/env python
# -*- coding: utf-8 -*-
'''
    Copyright 2009-2013
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with JSXGraph.  If not, see <http://www.gnu.org/licenses/>.
'''
import sys
import os
import urllib
import base64
import zlib

if __name__ == '__main__':
    if len(sys.argv)<1:
        sys.stderr.write("call: python compress.py filename\n")
        sys.exit(0) 
    filename = sys.argv[1]
    if not os.path.exists(filename):
        sys.stderr.write("file '%s' not found\n" % filename)
        sys.exit(0) 
    f = open(filename, "r")
    text = f.read()
    text = base64.b64encode(zlib.compress(urllib.quote(text), 9))
    print text
