import numpy
import math
import matplotlib
matplotlib.use('Agg')
from matplotlib.pyplot import *
from matplotlib.contour import *
#import js

xs = -5.0
xe = 5.0
ys = -5.0
ye = 5.0
x, y = numpy.meshgrid(numpy.linspace(xs, xe, 200), numpy.linspace(ys, ye, 200))

#r = math.sqrt(js.window.P.X() ** 2 + js.window.P.Y() ** 2)

r = math.sqrt(2**2+2**2)
z = eval(f"x**2 + y**2 - {r}")
C = contour(x, y, z, [0])

data = ""
for i in range(0, len(C.collections[0].get_paths())):
    pa = C.collections[0].get_paths()[i].to_polygons()[0]
    

    for j in range(0,len(pa)):
        data += f"{pa[j][0]},{pa[j][1]};"

    data += ";"

data
