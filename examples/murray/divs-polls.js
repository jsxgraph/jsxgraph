var i = 0;
function writeDivs() {
    if (document.childNodes && document.createElement) {
        document.write('<div class="shadow" style="visibility:hidden;">' + '<div style="visibility:hidden;">' + '<iframe src="" height="0" width="0" name="loader' + i + '">' + '<\/iframe><\/div>' + '<div id="output' + i + '" class="dropDownContentExt">Loading...<\/div><\/div>');
    }
    i++;
}
function loadFrame(newData, oNum) {
    if (document.getElementById('output' + oNum).parentNode.style.visibility == 'visible') {
        document.getElementById('output' + oNum).parentNode.style.display = 'none';
        document.getElementById('output' + oNum).parentNode.style.visibility = 'hidden';
    } else {
        document.getElementById('output' + oNum).parentNode.style.visibility = 'visible';
        document.getElementById('output' + oNum).parentNode.style.display = 'block';
        document.getElementById('output' + oNum).innerHTML = newData;
    }
}