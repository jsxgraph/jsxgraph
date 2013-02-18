/*
    Copyright 2008-2013
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software dual licensed under the GNU LGPL or MIT License.
    
    You can redistribute it and/or modify it under the terms of the
    
      * GNU Lesser General Public License as published by
        the Free Software Foundation, either version 3 of the License, or
        (at your option) any later version
      OR
      * MIT License: https://github.com/jsxgraph/jsxgraph/blob/master/LICENSE.MIT
    
    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.
    
    You should have received a copy of the GNU Lesser General Public License and
    the MIT License along with JSXGraph. If not, see <http://www.gnu.org/licenses/>
    and <http://opensource.org/licenses/MIT/>.
 */


/*global JXG: true, define: true, document: true*/
/*jslint nomen: true, plusplus: true*/

/* depends:
 jxg
 utils/type
 */

/**
 * @fileoverview The JXG.DataSource is a helper class for data organization. Currently supported data sources are
 * javascript arrays and HTML tables.
 */

define(['jxg', 'utils/type'], function (JXG, Type) {

    "use strict";

    JXG.DataSource = function () {
        this.data = [];
        this.columnHeaders = [];
        this.rowHeaders = [];

        return this;
    };

    JXG.extend(JXG.DataSource.prototype, /** @lends JXG.DataSource.prototype */ {
        loadFromArray: function (table, columnHeader, rowHeader) {
            var i, j, cell;

            if (Type.isArray(columnHeader)) {
                this.columnHeaders = columnHeader;
                columnHeader = false;
            }

            if (Type.isArray(rowHeader)) {
                this.rowHeaders = rowHeader;
                rowHeader = false;
            }

            this.data = [];

            if (columnHeader) {
                this.columnHeaders = [];
            }

            if (rowHeader) {
                this.rowHeaders = [];
            }

            if (Type.exists(table)) {
                // extract the data
                this.data = [];

                for (i = 0; i < table.length; i++) {
                    this.data[i] = [];

                    for (j = 0; j < table[i].length; j++) {
                        cell = table[i][j];
                        if (parseFloat(cell).toString() === cell) {
                            this.data[i][j] = parseFloat(cell);
                        } else if (cell !== '-') {
                            this.data[i][j] = cell;
                        } else {
                            this.data[i][j] = NaN;
                        }
                    }
                }

                if (columnHeader) {
                    this.columnHeaders = this.data[0].slice(1);
                    this.data = this.data.slice(1);
                }

                if (rowHeader) {
                    this.rowHeaders = [];
                    for (i = 0; i < this.data.length; i++) {
                        this.rowHeaders.push(this.data[i][0]);
                        this.data[i] = this.data[i].slice(1);
                    }
                }
            }

            return this;
        },

        loadFromTable: function (table, columnHeader, rowHeader) {
            var row, i, j, col, cell, name;

            if (Type.isArray(columnHeader)) {
                this.columnHeaders = columnHeader;
                columnHeader = false;
            }

            if (Type.isArray(rowHeader)) {
                this.rowHeaders = rowHeader;
                rowHeader = false;
            }

            this.data = [];

            if (columnHeader) {
                this.columnHeaders = [];
            }

            if (rowHeader) {
                this.rowHeaders = [];
            }

            // to adjust: examples in examples folder & wiki
            table = document.getElementById(table);

            if (Type.exists(table)) {
                // extract the data
                row = table.getElementsByTagName('tr');
                this.data = [];

                for (i = 0; i < row.length; i++) {
                    col = row[i].getElementsByTagName('td');
                    this.data[i] = [];

                    for (j = 0; j < col.length; j++) {
                        cell = col[j].innerHTML;

                        if (parseFloat(cell).toString() === cell) {
                            this.data[i][j] = parseFloat(cell);
                        } else if (cell !== '-') {
                            this.data[i][j] = cell;
                        } else {
                            this.data[i][j] = NaN;
                        }
                    }
                }

                if (columnHeader) {
                    this.columnHeaders = this.data[0].slice(1);
                    this.data = this.data.slice(1);
                }

                if (rowHeader) {
                    this.rowHeaders = [];
                    for (i = 0; i < this.data.length; i++) {
                        this.rowHeaders.push(this.data[i][0]);
                        this.data[i] = this.data[i].slice(1);
                    }
                }
            }

            return this;
        },

        addColumn: function (name, pos, data) {
            throw new Error('not implemented');
        },

        addRow: function (name, pos, data) {
            throw new Error('not implemented');
        },

        getColumn: function (col) {
            var i,
                result = [];

            // get column index if column is given as column header title
            if (typeof col === 'string') {
                for (i = 0; i < this.columnHeaders.length; i++) {
                    if (col === this.columnHeaders[i]) {
                        col = i;
                        break;
                    }
                }
            }

            // build column array
            for (i = 0; i < this.data.length; i++) {
                if (this.data[i].length > col) {
                    result[i] = parseFloat(this.data[i][col]);
                }
            }

            return result;
        },

        getRow: function (row) {
            var result, i;

            // get column index if column is given as column header title
            if (typeof row === 'string') {
                for (i = 0; i < this.rowHeaders.length; i++) {
                    if (row === this.rowHeaders[i]) {
                        row = i;
                        break;
                    }
                }
            }

            // allocate memory for result array
            result = [];

            // build column array. result = this.data[row] is a flat copy and will
            // destroy our local data copy, that's why we're copying it element wise.
            for (i = 0; i < this.data[row].length; i++) {
                result[i] = this.data[row][i];
            }

            return result;
        }
    });

    return JXG.DataSource;
});