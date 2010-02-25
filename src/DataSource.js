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
    along with JSXGraph. If not, see <http://www.gnu.org/licenses/>.
*/

/** 
 * @fileoverview The JXG.DataSource is a helper class for data organization. Currently supported data sources are
 * javascript arrays and HTML tables.
 */

/* NOT YET DOCUMENTED. TODO! */

JXG.DataSource = function() {

    this.data = [];
    this.columnHeaders = [];
    this.rowHeaders = [];

    return this;
};

JXG.DataSource.prototype.loadFromArray = function(table, columnHeader, rowHeader) {
    var i, j,cell;

    if(typeof columnHeader == 'undefined')
        columnHeader = false;
    if(typeof rowHeader == 'undefined')
        rowHeader = false;

    if(JXG.isArray(columnHeader)) {
        this.columnHeader = columnHeader;
        columnHeader = false;
    }

    if(JXG.isArray(rowHeader)) {
        this.rowHeader = rowHeader;
        rowHeader = false;
    }

    this.data = [];
    if(columnHeader)
        this.columnHeader = [];
    if(rowHeader)
        this.rowHeader = [];

    if(typeof table != 'undefined') {
        // extract the data
        this.data = new Array(table.length);

        for(i=0; i<table.length; i++) {
            this.data[i] = new Array(table[i].length);
            for(j=0; j<table[i].length; j++) {
                cell = table[i][j];
                if('' + parseFloat(cell) == cell)
                    this.data[i][j] = parseFloat(cell);
                else if (cell != '-')
                    this.data[i][j] = cell;
                else
                    this.data[i][j] = NaN;
            }
        }
            
        if(columnHeader) {
            this.columnHeader = this.data[0].slice(1);
            this.data = this.data.slice(1);
        }

        if(rowHeader) {
            this.rowHeader = new Array();
            for(i=0; i<this.data.length; i++) {
                this.rowHeader.push(this.data[i][0]);
                this.data[i] = this.data[i].slice(1);
            }
        }
    }

    return this;
};

JXG.DataSource.prototype.loadFromTable = function(table, columnHeader, rowHeader) {
    var row, i, j, col, cell, name;

    if(typeof columnHeader == 'undefined')
        columnHeader = false;
    if(typeof rowHeader == 'undefined')
        rowHeader = false;

    if(JXG.isArray(columnHeader)) {
        this.columnHeader = columnHeader;
        columnHeader = false;
    }

    if(JXG.isArray(rowHeader)) {
        this.rowHeader = rowHeader;
        rowHeader = false;
    }

    this.data = [];
    if(columnHeader)
        this.columnHeader = [];
    if(rowHeader)
        this.rowHeader = [];

    table = document.getElementById(table);
    if(typeof table != 'undefined') {
        // extract the data
        row = table.getElementsByTagName('tr');
        this.data = new Array(row.length);

        for(i=0; i<row.length; i++) {
            col = row[i].getElementsByTagName('td');
            this.data[i] = new Array(col.length);
            for(j=0; j<col.length; j++) {
                cell = col[j].innerHTML;
                if('' + parseFloat(cell) == cell)
                    this.data[i][j] = parseFloat(cell);
                else if (cell != '-')
                    this.data[i][j] = cell;
                else
                    this.data[i][j] = NaN;
            }
        }
            
        if(columnHeader) {
            this.columnHeader = this.data[0].slice(1);
            this.data = this.data.slice(1);
        }

        if(rowHeader) {
            this.rowHeader = new Array();
            for(i=0; i<this.data.length; i++) {
                this.rowHeader.push(this.data[i][0]);
                this.data[i] = this.data[i].slice(1);
            }
        }
    }

    return this;
};

JXG.DataSource.prototype.addColumn = function(name, pos, data) {
    // todo
};

JXG.DataSource.prototype.addRow = function(name, pos, data) {
    // todo
};

JXG.DataSource.prototype.getColumn = function(col) {
    var result = new Array(this.data.length), i;

    // get column index if column is given as column header title
    if(typeof col == 'string') {
        for(i=0; i<this.columnHeader.length; i++) {
            if(col == this.columnHeader[i]) {
                col = i;
                break;
            }
        }
    }

    // build column array
    for(i=0; i<this.data.length; i++) {
        if(this.data[i].length > col)
            result[i] = this.data[i][col];
    }

    return result;
};

JXG.DataSource.prototype.getRow = function(row) {
    var result, i;

    // get column index if column is given as column header title
    if(typeof row == 'string') {
        for(i=0; i<this.rowHeader.length; i++) {
            if(row == this.rowHeader[i]) {
                row = i;
                break;
            }
        }
    }

    // allocate memory for result array
    result = new Array(this.data[row].length);

    // build column array. result = this.data[row] is a flat copy and will
    // destroy our local data copy, that's why we're copying it element wise.
    for(i=0; i<this.data[row].length; i++) {
        result[i] = this.data[row][i];
    }

    return result;
};
