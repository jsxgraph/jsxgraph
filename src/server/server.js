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


/*global JXG: true, define: true, escape:true, window:true, ActiveXObject:true, XMLHttpRequest:true*/
/*jslint nomen: true, plusplus: true*/

/* depends:
 jxg
 utils/zip
 utils/base64
 utils/type
 */

/**
 * @fileoverview The JXG.Server is a wrapper for a smoother integration of server side calculations. on the
 * server side a python plugin system is used.
 */

define([
    'jxg', 'utils/zip', 'utils/base64', 'utils/type'
], function (JXG, Zip, Base64, Type) {

    "use strict";

    /**
     * @namespace
     * JXG.Server namespace holding functions to load JXG server modules.
     */
    JXG.Server = {
        /**
         * This is where all of a module's handlers are accessed from. If you're loading a module named JXGModule which
         * provides a handler called ImaHandler, then this handler can be called by invoking JXG.Server.modules.JXGModule.ImaHandler().
         * @namespace
         */
        modules: {},

        /**
         * Stores all asynchronous calls to server which aren't finished yet.
         * @private
         */
        runningCalls: {},

        /**
         * Handles errors, just a default implementation, can be overwritten by you, if you want to handle errors by yourself.
         * @param {object} data An object holding a field of type string named message handling the error described in the message string.
         */
        handleError: function (data) {
            JXG.debug('error occured, server says: ' + data.message);
        },

        /**
         * The main method of JXG.Server. Actually makes the calls to the server and parses the feedback.
         * @param {String} action Can be 'load' or 'exec'.
         * @param {function} callback Function pointer or anonymous function which takes as it's only argument an
         * object containing the data from the server. The fields of this object depend on the reply of the server
         * module. See the correspondings server module readme.
         * @param {Object} data What is to be sent to the server.
         * @param {Boolean} sync If the call should be synchronous or not.
         */
        callServer: function (action, callback, data, sync) {
            var fileurl, passdata, AJAX,
                params, id, dataJSONStr,
                k;

            sync = sync || false;

            params = '';
            for (k in data) {
                if (data.hasOwnProperty(k)) {
                    params += '&' + escape(k) + '=' + escape(data[k]);
                }
            }

            dataJSONStr = Type.toJSON(data);

            // generate id
            do {
                id = action + Math.floor(Math.random() * 4096);
            } while (Type.exists(this.runningCalls[id]));

            // store information about the calls
            this.runningCalls[id] = {action: action};
            if (Type.exists(data.module)) {
                this.runningCalls[id].module = data.module;
            }

            fileurl = JXG.serverBase + 'JXGServer.py';
            passdata = 'action=' + escape(action) + '&id=' + id + '&dataJSON=' + escape(Base64.encode(dataJSONStr));

            this.cbp = function (d) {
                /*jslint evil:true*/
                var str, data,
                    tmp, inject, paramlist, id,
                    i, j;

                str = (new Zip.Unzip(Base64.decodeAsArray(d))).unzip();
                if (Type.isArray(str) && str.length > 0) {
                    str = str[0][0];
                }

                if (!Type.exists(str)) {
                    return;
                }

                data = window.JSON && window.JSON.parse ? window.JSON.parse(str) : (new Function('return ' + str))();

                if (data.type === 'error') {
                    this.handleError(data);
                } else if (data.type === 'response') {
                    id = data.id;

                    // inject fields
                    for (i = 0; i < data.fields.length; i++) {
                        tmp = data.fields[i];
                        inject = tmp.namespace + (typeof ((new Function('return ' + tmp.namespace))()) === 'object' ? '.' : '.prototype.') + tmp.name + ' = ' + tmp.value;
                        (new Function(inject))();
                    }

                    // inject handlers
                    for (i = 0; i < data.handler.length; i++) {
                        tmp = data.handler[i];
                        paramlist = [];

                        for (j = 0; j < tmp.parameters.length; j++) {
                            paramlist[j] = '"' + tmp.parameters[j] + '": ' + tmp.parameters[j];
                        }
                        // insert subnamespace named after module.
                        inject = 'if(typeof JXG.Server.modules.' + this.runningCalls[id].module + ' == "undefined")' + 'JXG.Server.modules.' + this.runningCalls[id].module + ' = {};';

                        // insert callback method which fetches and uses the server's data for calculation in JavaScript
                        inject += 'JXG.Server.modules.' + this.runningCalls[id].module + '.' + tmp.name + '_cb = ' + tmp.callback + ';';

                        // insert handler as JXG.Server.modules.<module name>.<handler name>
                        inject += 'JXG.Server.modules.' + this.runningCalls[id].module + '.' + tmp.name + ' = function (' + tmp.parameters.join(',') + ', __JXGSERVER_CB__, __JXGSERVER_SYNC) {' +
                            'if(typeof __JXGSERVER_CB__ == "undefined") __JXGSERVER_CB__ = JXG.Server.modules.' + this.runningCalls[id].module + '.' + tmp.name + '_cb;' +
                            'var __JXGSERVER_PAR__ = {' + paramlist.join(',') + ', "module": "' + this.runningCalls[id].module + '", "handler": "' + tmp.name + '" };' +
                            'JXG.Server.callServer("exec", __JXGSERVER_CB__, __JXGSERVER_PAR__, __JXGSERVER_SYNC);' +
                            '};';
                        (new Function(inject))();
                    }

                    delete this.runningCalls[id];

                    // handle data
                    callback(data.data);
                }
            };

            // bind cbp callback method to JXG.Server to get access to JXG.Server fields from within cpb
            this.cb = JXG.bind(this.cbp, this);

            // we're using our own XMLHttpRequest object in here because of a/sync and POST
            if (window.XMLHttpRequest) {
                AJAX = new XMLHttpRequest();
                AJAX.overrideMimeType('text/plain; charset=iso-8859-1');
            } else {
                AJAX = new ActiveXObject("Microsoft.XMLHTTP");
            }
            if (AJAX) {
                // POST is required if data sent to server is too long for a url.
                // some browsers/http servers don't accept long urls.
                AJAX.open("POST", fileurl, !sync);
                AJAX.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

                if (!sync) {
                    // Define function to fetch data received from server
                    // that function returning a function is required to make this.cb known to the function.
                    AJAX.onreadystatechange = (function (cb) {
                        return function () {
                            if (AJAX.readyState === 4 && AJAX.status === 200) {
                                cb(AJAX.responseText);
                                return true;
                            }
                            return false;
                        };
                    }(this.cb));
                }

                // send the data
                AJAX.send(passdata);
                if (sync) {
                    this.cb(AJAX.responseText);
                    return true;
                }
            }

            return false;
        },

        /**
         * Callback for the default action 'load'.
         */
        loadModule_cb: function (data) {
            var i;
            for (i = 0; i < data.length; i++) {
                JXG.debug(data[i].name + ': ' + data[i].value);
            }
        },

        /**
         * Loads a module from the server.
         * @param {string} module A string containing the module. Has to match the filename of the Python module on the server exactly including
         * lower and upper case letters without the file ending .py.
         */
        loadModule: function (module) {
            return JXG.Server.callServer('load', JXG.Server.loadModule_cb, {'module': module}, true);
        }
    };

    JXG.Server.load = JXG.Server.loadModule;

    return JXG.Server;
});