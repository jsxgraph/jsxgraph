/*
    Copyright 2008,2009
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
*/

/**
  * Functions for mathematical statistics
  * Most functions are R-like:
  * For example prod(a1,a2) computes an array c such that
  * for (i=0;i<a1.length;i++) c[i] = a1[i]*a2[i];
  *
 **/
JXG.MathStatistics = function(){};

JXG.MathStatistics.prototype.sum = function(arr) {
    var i, len, res = 0;
    
    for(i=0, len=arr.length; i<len; i++) { 
        res += arr[i];
    } 
    return res;
};

JXG.MathStatistics.prototype.prod = function(arr) {
    var i, len, res = 1;
    
    for(i=0, len=arr.length; i<len; i++) { 
        res *= arr[i];
    } 
    return res;
};

JXG.MathStatistics.prototype.mean = function(arr) {
    if (arr.length>0) {
        return this.sum(arr)/arr.length;
    } else {
        return 0.0;
    }
};

JXG.MathStatistics.prototype.median = function(arr) {
    var tmp, len;
    
    if (arr.length>0) {
        tmp = arr.clone();
        tmp.sort(function(a,b){return a-b;});
        len = tmp.length;
        if (len%2==1) {
            return tmp[parseInt(len*0.5)];
        } else{
            return (tmp[len*0.5-1]+tmp[len*0.5])*0.5;
        }
    } else {
        return 0.0;
    }
};

/**
 * bias-corrected sample variance
 */
JXG.MathStatistics.prototype.variance = function(arr) {
    var m, res, i, len;
    
    if (arr.length>1) {
        m = this.mean(arr);
        res = 0;
        for(i=0, len=arr.length; i<len; i++) { 
            res += (arr[i]-m)*(arr[i]-m);
        } 
        return res/(arr.length-1);
    } else {
        return 0.0;
    }
};

JXG.MathStatistics.prototype.sd = function(arr) {
    return Math.sqrt(this.variance(arr));
};

JXG.MathStatistics.prototype.weightedMean = function(arr,w) {
    if (arr.length!=w.length) { return; }
    if (arr.length>0) {
        return this.mean(this.multiply(arr,w));
    } else {
        return 0.0;
    }
};

JXG.MathStatistics.prototype.max = function(arr) {
    var res, i, len;
    
    if (arr.length==0) { return NaN; }
    res = arr[0];
    for(i=1, len=arr.length; i<len; i++) { 
        res = (arr[i]>res)?(arr[i]):res;
    } 
    return res;
};

JXG.MathStatistics.prototype.min = function(arr) {
    var res, i, len;

    if (arr.length==0) { return NaN; }
    res = arr[0];
    for(i=1, len=arr.length; i<len; i++) { 
        res = (arr[i]<res)?(arr[i]):res;
    } 
    return res;
};

/**
 * R-style functions
 */
JXG.MathStatistics.prototype.range = function(arr) {
    return [this.min(arr),this.max(arr)];
};

JXG.MathStatistics.prototype.diff = function(arr) { // ?????
    return arr;
};

JXG.MathStatistics.prototype.min = function(arr) {
    var res, i, len;
    
    if (arr.length==0) { return NaN; }
    res = arr[0];
    for(i=1, len=arr.length; i<len; i++) { 
        res = (arr[i]<res)?(arr[i]):res;
    } 
    return res;
};

JXG.MathStatistics.prototype.abs = function(arr) {  // This can be generalized with Prototype.js and should be done for all Math. methods
    var i, len, res = [];
    if (typeof JXG.isArray(arr1)) {
        for (i=0, len=arr.length;i<len;i++) { res[i] = Math.abs(arr[i]); }
    } else if (typeof arr=='number') {
        return Math.abs(arr);
    } else {
        res = null;
    }
    return res;
};

JXG.MathStatistics.prototype.add = function(arr1,arr2) {
    var i, len, res = [];
    
    if (typeof JXG.isArray(arr1) && typeof arr2=='number') {
        for (i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1[i]+arr2; }
    } else if (typeof arr1=='number' && typeof JXG.isArray(arr2)) {
        for (i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1+arr2[i]; }
    } else if (typeof JXG.isArray(arr1) && typeof JXG.isArray(arr2)) {
        for (i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1[i]+arr2[i]; }
    } else if (typeof arr1=='number' && typeof arr2=='number') {
        for (i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1+arr2; }
    } else {
        res = null;
    }
    return res;
};

JXG.MathStatistics.prototype.divide = function(arr1,arr2) {
    var i, len, res = [];
    
    if (typeof JXG.isArray(arr1) && typeof arr2=='number') {
        for (i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1[i]/arr2; }
    } else if (typeof arr1=='number' && typeof JXG.isArray(arr2)) {
        for (i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1/arr2[i]; }
    } else if (typeof JXG.isArray(arr1) && typeof JXG.isArray(arr2)) {
        for (i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1[i]/arr2[i]; }
    } else if (typeof arr1=='number' && typeof arr2=='number') {
        for (i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1/arr2; }
    } else {
        res = null;
    }
    return res;
};

JXG.MathStatistics.prototype.mod = function(arr1,arr2) {
    var i, len, res = [];
    
    if (typeof JXG.isArray(arr1) && typeof arr2=='number') {
        for (i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1[i]%arr2; }
    } else if (typeof arr1=='number' && typeof JXG.isArray(arr2)) {
        for (i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1%arr2[i]; }
    } else if (typeof JXG.isArray(arr1) && typeof JXG.isArray(arr2)) {
        for (i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1[i]%arr2[i]; }
    } else if (typeof arr1=='number' && typeof arr2=='number') {
        for (i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1%arr2; }
    } else {
        res = null;
    }
    return res;
};

JXG.MathStatistics.prototype.multiply = function(arr1,arr2) {
    var i, len, res = [];
    
    if (typeof JXG.isArray(arr1) && typeof arr2=='number') {
        for (i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1[i]*arr2; }
    } else if (typeof arr1=='number' && typeof JXG.isArray(arr2)) {
        for (i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1*arr2[i]; }
    } else if (typeof JXG.isArray(arr1) && typeof JXG.isArray(arr2)) {
        for (i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1[i]*arr2[i]; }
    } else if (typeof arr1=='number' && typeof arr2=='number') {
        for (i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1*arr2; }
    } else {
        res = null;
    }
    return res;
};

JXG.MathStatistics.prototype.subtract = function(arr1,arr2) {
    var i, len, res = [];
    
    if (typeof JXG.isArray(arr1) && typeof arr2=='number') {
        for (i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1[i]-arr2; }
    } else if (typeof arr1=='number' && typeof JXG.isArray(arr2)) {
        for (i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1-arr2[i]; }
    } else if (typeof JXG.isArray(arr1) && typeof JXG.isArray(arr2)) {
        for (i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1[i]-arr2[i]; }
    } else if (typeof arr1=='number' && typeof arr2=='number') {
        for (i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1-arr2; }
    } else {
        res = null;
    }
    return res;
};
