all :  jsxgraph_refcard.pdf
jsxgraph_refcard.pdf : jsxgraph_refcard.ps
	gs -sDEVICE=pdfwrite -dBATCH -dNOPAUSE -sOutputFile=jsxgraph_refcard.pdf jsxgraph_refcard.ps

jsxgraph_refcard.ps : jsxgraph_refcard.dvi
	dvips -t landscape jsxgraph_refcard.dvi -o

jsxgraph_refcard.dvi : jsxgraph_refcard.tex
	tex jsxgraph_refcard.tex

clean: ; - rm jsxgraph_refcard.ps jsxgraph_refcard.dvi jsxgraph_refcard.pdf jsxgraph_refcard.log *.*~

