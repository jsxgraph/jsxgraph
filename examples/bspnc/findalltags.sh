#!/bin/sh
egrep -o -h '<[a-zA-Z]+>' *.nc.gxt | sort -u
