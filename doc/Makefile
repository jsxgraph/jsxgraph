all: jsxgraph_refcard.ps jsxgraph_refcard.pdf

jsxgraph_refcard.dvi: jsxgraph_refcard.tex
	tex jsxgraph_refcard.tex

jsxgraph_refcard.ps: jsxgraph_refcard.dvi
	dvips -t landscape jsxgraph_refcard.dvi -o

jsxgraph_refcard.pdf: jsxgraph_refcard.ps
	ps2pdf jsxgraph_refcard.ps