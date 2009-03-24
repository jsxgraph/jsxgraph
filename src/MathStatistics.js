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
  *
 **/
JXG.MathStatistics = function(){};

JXG.MathStatistics.prototype.sum = function(arr) {
    var res = 0;
    for(var i=0, len=arr.length; i<len; i++) { 
        res += arr[i];
    } 
    return res;
};

JXG.MathStatistics.prototype.prod = function(arr) {
    var res = 1;
    for(var i=0, len=arr.length; i<len; i++) { 
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
    if (arr.length>0) {
        var tmp = arr.clone();
        tmp.sort(function(a,b){return a-b;});
        var len = tmp.length ;
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
    if (arr.length>1) {
        var m = this.mean(arr);
        var res = 0;
        for(var i=0, len=arr.length; i<len; i++) { 
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
        var t = this.multiply(arr,w);
        return this.mean(t);
    } else {
        return 0.0;
    }
};

JXG.MathStatistics.prototype.max = function(arr) {
    if (arr.length==0) { return NaN; }
    var res = arr[0];
    for(var i=1, len=arr.length; i<len; i++) { 
        res = (arr[i]>res)?(arr[i]):res;
    } 
    return res;
};

JXG.MathStatistics.prototype.min = function(arr) {
    if (arr.length==0) { return NaN; }
    var res = arr[0];
    for(var i=1, len=arr.length; i<len; i++) { 
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
}

JXG.MathStatistics.prototype.min = function(arr) {
    if (arr.length==0) { return NaN; }
    var res = arr[0];
    for(var i=1, len=arr.length; i<len; i++) { 
        res = (arr[i]<res)?(arr[i]):res;
    } 
    return res;
};

JXG.MathStatistics.prototype.abs = function(arr) {  // This can be generalized with Prototype.js and should be done for all Math. methods
    var res = [];
    if (typeof JXG.IsArray(arr1)) {
        for (var i=0, len=arr.length;i<len;i++) { res[i] = Math.abs(arr[i]); }
    } else if (typeof arr=='number') {
        return Math.abs(arr);
    } else {
        res = null;
    }
    return res;
};

JXG.MathStatistics.prototype.add = function(arr1,arr2) {
    var res = [];
    if (typeof JXG.IsArray(arr1) && typeof arr2=='number') {
        for (var i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1[i]+arr2; }
    } else if (typeof arr1=='number' && typeof JXG.IsArray(arr2)) {
        for (var i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1+arr2[i]; }
    } else if (typeof JXG.IsArray(arr1) && typeof JXG.IsArray(arr2)) {
        for (var i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1[i]+arr2[i]; }
    } else if (typeof arr1=='number' && typeof arr2=='number') {
        for (var i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1+arr2; }
    } else {
        res = null;
    }
    return res;
};

JXG.MathStatistics.prototype.divide = function(arr1,arr2) {
    var res = [];
    if (typeof JXG.IsArray(arr1) && typeof arr2=='number') {
        for (var i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1[i]/arr2; }
    } else if (typeof arr1=='number' && typeof JXG.IsArray(arr2)) {
        for (var i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1/arr2[i]; }
    } else if (typeof JXG.IsArray(arr1) && typeof JXG.IsArray(arr2)) {
        for (var i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1[i]/arr2[i]; }
    } else if (typeof arr1=='number' && typeof arr2=='number') {
        for (var i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1/arr2; }
    } else {
        res = null;
    }
    return res;
};

JXG.MathStatistics.prototype.mod = function(arr1,arr2) {
    var res = [];
    if (typeof JXG.IsArray(arr1) && typeof arr2=='number') {
        for (var i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1[i]%arr2; }
    } else if (typeof arr1=='number' && typeof JXG.IsArray(arr2)) {
        for (var i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1%arr2[i]; }
    } else if (typeof JXG.IsArray(arr1) && typeof JXG.IsArray(arr2)) {
        for (var i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1[i]%arr2[i]; }
    } else if (typeof arr1=='number' && typeof arr2=='number') {
        for (var i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1%arr2; }
    } else {
        res = null;
    }
    return res;
};

JXG.MathStatistics.prototype.multiply = function(arr1,arr2) {
    var res = [];
    if (typeof JXG.IsArray(arr1) && typeof arr2=='number') {
        for (var i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1[i]*arr2; }
    } else if (typeof arr1=='number' && typeof JXG.IsArray(arr2)) {
        for (var i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1*arr2[i]; }
    } else if (typeof JXG.IsArray(arr1) && typeof JXG.IsArray(arr2)) {
        for (var i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1[i]*arr2[i]; }
    } else if (typeof arr1=='number' && typeof arr2=='number') {
        for (var i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1*arr2; }
    } else {
        res = null;
    }
    return res;
};

JXG.MathStatistics.prototype.subtract = function(arr1,arr2) {
    var res = [];
    if (typeof JXG.IsArray(arr1) && typeof arr2=='number') {
        for (var i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1[i]-arr2; }
    } else if (typeof arr1=='number' && typeof JXG.IsArray(arr2)) {
        for (var i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1-arr2[i]; }
    } else if (typeof JXG.IsArray(arr1) && typeof JXG.IsArray(arr2)) {
        for (var i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1[i]-arr2[i]; }
    } else if (typeof arr1=='number' && typeof arr2=='number') {
        for (var i=0, len=Math.min(arr1.length,arr2.length);i<len;i++) { res[i] = arr1-arr2; }
    } else {
        res = null;
    }
    return res;
};



/*
 int QRZerlegung(int n) 
 {
   int i, j, k;
   double sigma, s, beta, sum;
   double *d = new double[n];

   for(j = 0; j < n; j++) 
   {
     sigma = 0;
     for(i = j; i < n; i++) 
     {
       sigma = sigma + a[i][j] * a[i][j];
     }
     if(sigma == 0)
       return -1;
     if(a[j][j] < 0) 
     {
       d[j] = s = sqrt(sigma);
     }
     else 
     {
       d[j] = s = -sqrt(sigma);
     }
     beta = 1/(s * a[j][j] - sigma);
     a[j][j] -= s;
     for(k = j+1; k < n; k++) 
     {
       sum = 0;
       for(i = j; i < n; i++)
       {
         sum += a[i][j] * a[i][k];
       }
       sum = beta * sum;
       for(i = j; i < n; i++) 
       {
         a[i][k] = a[i][k] + a[i][j] * sum;
       }
     }
   }
   return 0;
 }
*/
