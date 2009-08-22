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
 * @fileoverview The JXG.Server is a wrapper for a smoother integration of server side calculations. on the
 * server side a python plugin system is used.
 */

/** TODO: Documentation */

JXG.Server = function(){};

JXG.Server.modules = function(){};

JXG.Server.runningCalls = {};

JXG.Server.handleError = function(data) {
	alert('error occured, server says: ' + data.message);
};

JXG.Server.callServer = function(action, callback, data) {
	var fileurl,
	params, id, dataJSONStr,
	k;

	params = '';
	for(k in data) {
		params += '&' + escape(k) + '=' + escape(data[k]);
	}

	dataJSONStr = JXG.toJSON(data);

	// generate id
	do {
		id = action + Math.floor(Math.random()*4096);
	} while(typeof this.runningCalls[id] != 'undefined');

	// store information about the calls
	this.runningCalls[id] = { 'action': action };
	if(typeof data.module != 'undefined')
		this.runningCalls[id].module = data.module;

	fileurl = JXG.serverBase + 'JXGServer.py?action=' + escape(action) + '&id=' + id + '&dataJSON=' + escape(JXG.Util.Base64.encode(dataJSONStr));

	this.cbp = function(d) {
		var str, data,
		tmp, inject, paramlist, id,
		i, j;

		str = (new JXG.Util.Unzip(JXG.Util.Base64.decodeAsArray(d))).unzip();
		if(str.length > 0)
			str = str[0][0];

		data =  eval("(" + str + ")");

		if(data.type == 'error') {
			handleError(data);
		} else if (data.type == 'response') {
			id = data.id;

			// inject fields
			for(i=0; i<data.fields.length; i++) {
				tmp = data.fields[i];
				inject = tmp.namespace + ( typeof eval(tmp.namespace) == 'object' ? '.' : '.prototype.') + tmp.name + ' = ' + tmp.value;
				eval(inject);
			}

			// inject handlers
			for(i=0; i<data.fields.length; i++) {
				tmp = data.handler[i];
				paramlist = [];
				for(j=0; j<tmp.parameters.length; j++) {
					paramlist[j] = '"' + tmp.parameters[j] + '": ' + tmp.parameters[j];
				}
				// insert subnamespace named after module.
				inject = 'if(typeof JXG.Server.modules.' + this.runningCalls[id].module + ' == "undefined")' +
				'JXG.Server.modules.' + this.runningCalls[id].module + ' = function(){};';

				// insert callback method which fetches and uses the server's data for calculation in JavaScript
				inject += 'JXG.Server.modules.' + this.runningCalls[id].module + '.' + tmp.name + '_cb = ' + tmp.callback + ';';

				// insert handler as JXG.Server.modules.<module name>.<handler name>
				inject += 'JXG.Server.modules.' + this.runningCalls[id].module + '.' + tmp.name + ' = function (' + tmp.parameters.join(',') + ') {' +
				'var par;' +
				'par = {' + paramlist.join(',') + ', "module": "' + this.runningCalls[id].module + '", "handler": "' + tmp.name + '" };' +
				'JXG.Server.callServer("exec", JXG.Server.modules.' + this.runningCalls[id].module + '.' + tmp.name + '_cb, par);' +
				'};';
				eval(inject);
			}

			delete this.runningCalls[id];

			// handle data
			callback(data.data);
		}
	};

	// bind cbp callback method to JXG.Server to get access to JXG.Server fields from within cpb
	this.cb = JXG.bind(this.cbp, this);


	JXG.FileReader.parseFileContent(fileurl, this.cb, 'raw');
};

JXG.Server.loadModule_cb = function(data) {
	var i;
	for(i=0; i<data.length; i++)
		alert(data[i].name + ': ' + data[i].value);
};

JXG.Server.loadModule = function(module) {
	JXG.Server.callServer('load', JXG.Server.loadModule_cb, {'module': module});
};

JXG.Server.waitFor = function(module) {
	var start = (new Date()).getTime();
//	while((typeof JXG.Server.modules[module] == 'undefined') && ((new Date()).getTime() - start < 30000)) {};
	while((typeof JXG.Server.modules[module] == 'undefined')) {};
};
