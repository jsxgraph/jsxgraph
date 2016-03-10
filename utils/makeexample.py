#!/usr/bin/env python
# -*- coding: utf-8 -*-
'''
    Copyright 2009-2015
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Alfred Wassermann

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
import uuid

if __name__ == '__main__':
    code = sys.stdin.readlines()
    
    space = "     * "
    tab = "    "
    
    print "%s%s" % (space, "@example")
    ''' Print original code '''
    for line in code:
        print "%s%s" % (space, line.rstrip())
    print space
    
    uid = uuid.uuid1()
    ''' Print live code '''
    print "%s%s%s%s" % (space, "</pre><div id=\"", uid, "\" class=\"jxgbox\" style=\"width: 300px; height: 300px;\"></div>")
    print "%s%s"     % (space, "<script type=\"text/javascript\">")
    print "%s%s%s"   % (space, tab, "(function() {")
    print "%s%s%s%s%s"   % (space, tab+tab, "var board = JXG.JSXGraph.initBoard('", uid, "',")
    print "%s%s%s"   % (space, tab+tab+tab, "{boundingbox: [-8, 8, 8,-8], axis: true, showcopyright: false, shownavigation: false});")
    
    for line in code:
        print "%s%s%s" % (space, tab, line.rstrip())
    print space

    print "%s%s%s"   % (space, tab, "})();")
    print "%s"       % (space)
    print "%s%s"     % (space, "</script><pre>")
    print space
