#!/bin/sh

cd /net/httpd/htdocs/jsxgraph/beta
rm -r *
scp -r alfred@132.180.198.4:public_html/jsxgraph/beta/* .
