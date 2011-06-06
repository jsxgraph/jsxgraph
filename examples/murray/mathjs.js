var pi = Math.PI, ln = Math.log, e = Math.E;
var arcsin = Math.asin, arccos = Math.acos, arctan = Math.atan;
var random = Math.random;
var sec = function(x) { return 1/Math.cos(x) };
var csc = function(x) { return 1/Math.sin(x) };
var cot = function(x) { return 1/Math.tan(x) };

var arcsec = function(x) { return arccos(1/x) };
var arccsc = function(x) { return arcsin(1/x) };
var arccot = function(x) { return arctan(1/x) };
var sinh = function(x) { return (Math.exp(x)-Math.exp(-x))/2 };
var cosh = function(x) { return (Math.exp(x)+Math.exp(-x))/2 };
var tanh =
  function(x) { return (Math.exp(x)-Math.exp(-x))/(Math.exp(x)+Math.exp(-x)) };
var sech = function(x) { return 1/cosh(x) };
var csch = function(x) { return 1/sinh(x) };
var coth = function(x) { return 1/tanh(x) };

var arcsinh = function(x) { return ln(x+Math.sqrt(x*x+1)) };
var arccosh = function(x) { return ln(x+Math.sqrt(x*x-1)) };
var arctanh = function(x) { return ln((1+x)/(1-x))/2 };
var sech = function(x) { return 1/cosh(x) };
var csch = function(x) { return 1/sinh(x) };
var coth = function(x) { return 1/tanh(x) };
var arcsech = function(x) { return arccosh(1/x) };
var arccsch = function(x) { return arcsinh(1/x) };
var arccoth = function(x) { return arctanh(1/x) };
var sign = function(x) { return (x==0?0:(x<0?-1:1)) };
var logten = function(x) { return (Math.LOG10E*Math.log(x)) };


function factorial(x,n) {
  if (n==null) n=1;
  for (var i=x-n; i>0; i-=n) x*=i;
  return (x<0?NaN:(x==0?1:x));
}


function C(x,k) {
  var res=1;
  for (var i=0; i<k; i++) res*=(x-i)/(k-i);
  return res;
}

function matchtolower(match) {
        return match.toLowerCase();
}
function nthroot(n,base) {
        return safepow(base,1/n);
}

function nthlogten(n,v) {
        return ((Math.log(v))/(Math.log(n)));
}

function safepow(base,power) {
        if (base<0 && Math.floor(power)!=power) {
                for (var j=3; j<50; j+=2) {
                        if (Math.abs(Math.round(j*power)-(j*power))<.000001) {
                                if (Math.round(j*power)%2==0) {
                                        return Math.pow(Math.abs(base),power);
                                } else {
                                        return -1*Math.pow(Math.abs(base),power);
                                }
                        }
                }
                return sqrt(-1);
        } else {
                return Math.pow(base,power);
        }
}
function mathjs(st,varlist) {
  //translate a math formula to js function notation
  // a^b --> pow(a,b)
  // na --> n*a
  // (...)d --> (...)*d
  // n! --> factorial(n)
  // sin^-1 --> arcsin etc.
  //while ^ in string, find term on left and right
  //slice and concat new formula string
  //parenthesizes the function variables
  st = st.replace("[","(");
  st = st.replace("]",")");
  st = st.replace(/arc(sin|cos|tan)/g,"a#r#c $1");
  if (varlist != null) {
          var reg = new RegExp("(sqrt|ln|log|sin|cos|tan|sec|csc|cot|abs|root)[\(]","g");
          st = st.replace(reg,"$1#(");
          var reg = new RegExp("("+varlist+")("+varlist+")$","g");
          st = st.replace(reg,"($1)($2)");
          var reg = new RegExp("("+varlist+")(a#|sqrt|ln|log|sin|cos|tan|sec|csc|cot|abs|root)","g");
          st = st.replace(reg,"($1)$2");
          var reg = new RegExp("("+varlist+")("+varlist+")([^a-df-zA-Z\(#])","g"); // 6/1/09 readded \( for f(350/x)
          st = st.replace(reg,"($1)($2)$3"); //get xy3
         // var reg = new RegExp("("+varlist+")("+varlist+")(\w*[^\(#])","g");
          //st = st.replace(reg,"($1)($2)$3"); //get xysin
          var reg = new RegExp("([^a-df-zA-Z#])("+varlist+")([^a-df-zA-Z#])","g");
          st = st.replace(reg,"$1($2)$3");        
          var reg = new RegExp("^("+varlist+")([^a-df-zA-Z])","g");
          st = st.replace(reg,"($1)$2");
          var reg = new RegExp("([^a-df-zA-Z])("+varlist+")$","g");
          st = st.replace(reg,"$1($2)");
  }
  st = st.replace(/#/g,"");
  st = st.replace(/a#r#c\s+(sin|cos|tan)/g,"arc$1");
  st = st.replace(/\s/g,"");
  st = st.replace(/(Sin|Cos|Tan|Sec|Csc|Cot|Arc|Abs|Log|Ln|Sqrt)/g, matchtolower);
  st = st.replace(/log_(\d+)\(/,"nthlog($1,");
  st = st.replace(/log/g,"logten");
  if (st.indexOf("^-1")!=-1) {
    st = st.replace(/sin\^-1/g,"arcsin");
    st = st.replace(/cos\^-1/g,"arccos");
    st = st.replace(/tan\^-1/g,"arctan");
    st = st.replace(/sec\^-1/g,"arcsec");
    st = st.replace(/csc\^-1/g,"arccsc");
    st = st.replace(/cot\^-1/g,"arccot");
    st = st.replace(/sinh\^-1/g,"arcsinh");
    st = st.replace(/cosh\^-1/g,"arccosh");
    st = st.replace(/tanh\^-1/g,"arctanh");
    st = st.replace(/sech\^-1/g,"arcsech");
    st = st.replace(/csch\^-1/g,"arccsch");
    st = st.replace(/coth\^-1/g,"arccoth");
  }
 
  st = st.replace(/root\((\d+)\)\(/,"nthroot($1,");
  //st = st.replace(/E/g,"(EE)");
  st = st.replace(/([0-9])E([\-0-9])/g,"$1(EE)$2");
  st = st.replace(/^e$/g,"(E)");
  st = st.replace(/pi/g,"(pi)");
  st = st.replace(/^e([^a-zA-Z])/g,"(E)$1");
  st = st.replace(/([^a-zA-Z])e$/g,"$1(E)");
 
  st = st.replace(/([^a-zA-Z])e([^a-zA-Z])/g,"$1(E)$2");
  st = st.replace(/([0-9])([\(a-zA-Z])/g,"$1*$2");
  st = st.replace(/(!)([0-9\(])/g,"$1*$2");
  //want to keep scientific notation
  st= st.replace(/([0-9])\*\(EE\)([\-0-9])/,"$1e$2");

 
  st = st.replace(/\)([\(0-9a-zA-Z])/g,"\)*$1");
 
  var i,j,k, ch, nested;
  while ((i=st.indexOf("^"))!=-1) {
    //find left argument
    if (i==0) return "Error: missing argument";
    j = i-1;
    ch = st.charAt(j);
    if (ch>="0" && ch<="9") {// look for (decimal) number
      j--;
      while (j>=0 && (ch=st.charAt(j))>="0" && ch<="9") j--;
      if (ch==".") {
        j--;
        while (j>=0 && (ch=st.charAt(j))>="0" && ch<="9") j--;
      }
    } else if (ch==")") {// look for matching opening bracket and function name
      nested = 1;
      j--;
      while (j>=0 && nested>0) {
        ch = st.charAt(j);
        if (ch=="(") nested--;
        else if (ch==")") nested++;
        j--;
      }
      while (j>=0 && (ch=st.charAt(j))>="a" && ch<="z" || ch>="A" && ch<="Z")
        j--;
    } else if (ch>="a" && ch<="z" || ch>="A" && ch<="Z") {// look for variable
      j--;
      while (j>=0 && (ch=st.charAt(j))>="a" && ch<="z" || ch>="A" && ch<="Z")
        j--;
    } else {
      return "Error: incorrect syntax in "+st+" at position "+j;
    }
    //find right argument
    if (i==st.length-1) return "Error: missing argument";
    k = i+1;
    ch = st.charAt(k);
    nch = st.charAt(k+1);
    if (ch>="0" && ch<="9" || (ch=="-" && nch!="(") || ch==".") {// look for signed (decimal) number
      k++;
      while (k<st.length && (ch=st.charAt(k))>="0" && ch<="9") k++;
      if (ch==".") {
        k++;
        while (k<st.length && (ch=st.charAt(k))>="0" && ch<="9") k++;
      }
    } else if (ch=="(" || (ch=="-" && nch=="(")) {// look for matching closing bracket and function name
      if (ch=="-") { k++;}
      nested = 1;
      k++;
      while (k<st.length && nested>0) {
        ch = st.charAt(k);
        if (ch=="(") nested++;
        else if (ch==")") nested--;
        k++;
      }
    } else if (ch>="a" && ch<="z" || ch>="A" && ch<="Z") {// look for variable
      k++;
      while (k<st.length && (ch=st.charAt(k))>="a" && ch<="z" ||
               ch>="A" && ch<="Z") k++;
      if (ch=='(' && st.slice(i+1,k).match(/^(sin|cos|tan|sec|csc|cot|logten|log|ln|exp|arcsin|arccos|arctan|arcsec|arccsc|arccot|sinh|cosh|tanh|sech|csch|coth|arcsinh|arccosh|arctanh|arcsech|arccsch|arccoth|sqrt|abs|nthroot)$/)) {
              nested = 1;
              k++;
              while (k<st.length && nested>0) {
                ch = st.charAt(k);
                if (ch=="(") nested++;
                else if (ch==")") nested--;
                k++;
              }
      }
    } else {

      return "Error: incorrect syntax in "+st+" at position "+k;
    }
    st = st.slice(0,j+1)+"safepow("+st.slice(j+1,i)+","+st.slice(i+1,k)+")"+
           st.slice(k);
  }
  while ((i=st.indexOf("!"))!=-1) {
    //find left argument
    if (i==0) return "Error: missing argument";
    j = i-1;
    ch = st.charAt(j);
    if (ch>="0" && ch<="9") {// look for (decimal) number
      j--;
      while (j>=0 && (ch=st.charAt(j))>="0" && ch<="9") j--;
      if (ch==".") {
        j--;
        while (j>=0 && (ch=st.charAt(j))>="0" && ch<="9") j--;
      }
    } else if (ch==")") {// look for matching opening bracket and function name
      nested = 1;
      j--;
      while (j>=0 && nested>0) {
        ch = st.charAt(j);
        if (ch=="(") nested--;
        else if (ch==")") nested++;
        j--;
      }
      while (j>=0 && (ch=st.charAt(j))>="a" && ch<="z" || ch>="A" && ch<="Z")
        j--;
    } else if (ch>="a" && ch<="z" || ch>="A" && ch<="Z") {// look for variable
      j--;
      while (j>=0 && (ch=st.charAt(j))>="a" && ch<="z" || ch>="A" && ch<="Z")
        j--;
    } else {
      return "Error: incorrect syntax in "+st+" at position "+j;
    }
    st = st.slice(0,j+1)+"factorial("+st.slice(j+1,i)+")"+st.slice(i+1);
  }
  return st;
}


