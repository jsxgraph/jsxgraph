# -*- coding: utf-8 -*-
import string
import shapelib as shp
import math

def simplify_points (pts, tolerance): 
    anchor  = 0
    floater = len(pts) - 1
    stack   = []
    keep    = set()

    stack.append((anchor, floater))  
    while stack:
        anchor, floater = stack.pop()
      
        # initialize line segment
        if pts[floater] != pts[anchor]:
            anchorX = float(pts[floater][0] - pts[anchor][0])
            anchorY = float(pts[floater][1] - pts[anchor][1])
            seg_len = math.sqrt(anchorX ** 2 + anchorY ** 2)
            # get the unit vector
            anchorX /= seg_len
            anchorY /= seg_len
        else:
            anchorX = anchorY = seg_len = 0.0
    
        # inner loop:
        max_dist = 0.0
        farthest = anchor + 1
        for i in range(anchor + 1, floater):
            dist_to_seg = 0.0
            # compare to anchor
            vecX = float(pts[i][0] - pts[anchor][0])
            vecY = float(pts[i][1] - pts[anchor][1])
            seg_len = math.sqrt( vecX ** 2 + vecY ** 2 )
            # dot product:
            proj = vecX * anchorX + vecY * anchorY
            if proj < 0.0:
                dist_to_seg = seg_len
            else: 
                # compare to floater
                vecX = float(pts[i][0] - pts[floater][0])
                vecY = float(pts[i][1] - pts[floater][1])
                seg_len = math.sqrt( vecX ** 2 + vecY ** 2 )
                # dot product:
                proj = vecX * (-anchorX) + vecY * (-anchorY)
                if proj < 0.0:
                    dist_to_seg = seg_len
                else:  # calculate perpendicular distance to line (pythagorean theorem):
                    dist_to_seg = math.sqrt(abs(seg_len ** 2 - proj ** 2))
                if max_dist < dist_to_seg:
                    max_dist = dist_to_seg
                    farthest = i

        if max_dist <= tolerance: # use line segment
            keep.add(anchor)
            keep.add(floater)
        else:
            stack.append((anchor, farthest))
            stack.append((farthest, floater))

    keep = list(keep)
    keep.sort()
    return [pts[i] for i in keep]

f = shp.open('./vg2500_bld.shp')
#f = shp.open('./vg2500_sta.dbf')
#f = shp.open('./vg2500_rbz.dbf')
#f = shp.open('./vg2500_krs.dbf')

fac = 100000.0
nLaender = f.info()[0]

minx = f.info()[2][0]/fac
miny = f.info()[2][1]/fac

maxx = f.info()[3][0]/fac
maxy = f.info()[3][1]/fac

#print nLaender, minx, maxx, miny, maxy

print "bbox = [%0.2f,%0.2f,%0.2f,%0.2f];" %(minx*0.99,maxy*1.01,maxx*1.01,miny*0.99)
print "paths = [];";
for n in xrange(nLaender):
    for parts in f.read_object(n).vertices():
        parts = simplify_points(parts, 1000.0)
        print "paths.push(["
        print "\t[",string.join(["%0.2f"%(p[0]/fac) for p in parts],','),'],'
        print "\t[",string.join(["%0.2f"%(p[1]/fac) for p in parts],','),']'
        print "]);"
