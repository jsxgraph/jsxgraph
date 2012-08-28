
$(document).ready(function () {
var strMathsCode = "$('#divAnimationPlaceHolder').html(''); var board = JXG.JSXGraph.initBoard('divAnimationPlaceHolder', {boundingbox: [-10, 10, 10, -10], axis:true});"
strMathsCode += "var p1 = board.createElement('point', [2, 2], { name: 'A', size: 2, face: 'o' });"
strMathsCode += "var p2 = board.createElement('point', [5, 5], { name: 'B', size: 2, face: 'o' });"
strMathsCode += "var ci = board.createElement('circle', ['A', 'B'], { strokeColor: '#00ff00', strokeWidth: 2 });";

var F = new Function(strMathsCode);
return F();
});