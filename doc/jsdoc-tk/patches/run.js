#!/usr/bin/env node

/**
 * @fileOverview
 * A bootstrap script that creates some basic required objects
 * for loading other scripts.
 * @author Michael Mathews, micmath@gmail.com
 * @version $Id: run.js 756 2009-01-07 21:32:58Z micmath $
 */

// Rename some function that does not exist in NodeJS.
print = console.log.bind(this);
quit = process.exit.bind(this);

var nodejs = {
	os: require('os'),
	fs: require('fs'),
	path: require('path'),
	vm: require('vm')
};

/**
 * @namespace Keep track of any messages from the running script.
 */
LOG = {
	warn: function(msg, e) {
		if (JSDOC.opt.q) return;
		if (e) msg = e.fileName+", line "+e.lineNumber+": "+msg;

		msg = ">> WARNING: "+msg;
		LOG.warnings.push(msg);
		if (LOG.out) LOG.out.write(msg+"\n");
		else print(msg);
	},

	inform: function(msg) {
		if (JSDOC.opt.q) return;
		msg = " > "+msg;
		if (LOG.out) LOG.out.write(msg+"\n");
		else if (typeof LOG.verbose != "undefined" && LOG.verbose) print(msg);
	}
};
LOG.warnings = [];
LOG.verbose = false
LOG.out = undefined;

/**
 *	@class Manipulate a filepath.
 */
FilePath = function(absPath, separator) {
	this.slash =  separator || "/";
	this.root = this.slash;
	this.path = [];
	this.file = "";

	var parts = absPath.split(/[\\\/]/);
	if (parts) {
		if (parts.length) this.root = parts.shift() + this.slash;
		if (parts.length) this.file =  parts.pop()
		if (parts.length) this.path = parts;
	}

	this.path = this.resolvePath();
}

/** Collapse any dot-dot or dot items in a filepath. */
FilePath.prototype.resolvePath = function() {
	var resolvedPath = [];
	for (var i = 0; i < this.path.length; i++) {
		if (this.path[i] == "..") resolvedPath.pop();
		else if (this.path[i] != ".") resolvedPath.push(this.path[i]);
	}
	return resolvedPath;
}

/** Trim off the filename. */
FilePath.prototype.toDir = function() {
	if (this.file) this.file = "";
	return this;
}

/** Go up a directory. */
FilePath.prototype.upDir = function() {
	this.toDir();
	if (this.path.length) this.path.pop();
	return this;
}

FilePath.prototype.toString = function() {
	return this.root
		+ this.path.join(this.slash)
		+ ((this.path.length > 0)? this.slash : "")
		+ this.file;
}

/**
 * Turn a path into just the name of the file.
 */
FilePath.fileName = function(path) {
	var nameStart = Math.max(path.lastIndexOf("/")+1, path.lastIndexOf("\\")+1, 0);
	return path.substring(nameStart);
}

/**
 * Get the extension of a filename
 */
FilePath.fileExtension = function(filename) {
   return filename.split(".").pop().toLowerCase();
};

/**
 * Turn a path into just the directory part.
 */
FilePath.dir = function(path) {
	var nameStart = Math.max(path.lastIndexOf("/")+1, path.lastIndexOf("\\")+1, 0);
	return path.substring(0, nameStart-1);
}

/**
 * @namespace A collection of information about your system.
 */
SYS = {
	/**
	 * Information about your operating system: arch, name, version.
	 * @type string
	 */
	os: [
		new String(nodejs.os.arch()),
		new String(nodejs.os.hostname()),
		new String(nodejs.os.release())
	].join(", "),

	/**
	 * Which way does your slash lean.
	 * @type string
	 */
	slash: "/",

	/**
	 * The absolute path to the directory containing this script.
	 * @type string
	 */
	pwd: __dirname
};
SYS.pwd += SYS.slash;

/**
 * @namespace A collection of functions that deal with reading a writing to disk.
 */
IO = {

	/**
	 * Joins path A and B by inserting a slash inbetween if necessary. This
	 * function should be used instead of writing pathA + SYS.slash + pathB.
	 * @returns {string}
	 */
	join: function(/**string*/pathA, /**string*/pathB) {
		return nodejs.path.join(pathA, pathB);
	},

	/**
	 * Create a new file in the given directory, with the given name and contents.
	 */
	saveFile: function(/**string*/ outDir, /**string*/ fileName, /**string*/ content) {
		nodejs.fs.writeFileSync(IO.join(outDir, fileName), content, IO.encoding);
	},

	/**
	 * @type string
	 */
	readFile: function(/**string*/ path) {
		if (!IO.exists(path)) {
			throw new Error("File doesn't exist there: "+path);
		}
		return nodejs.fs.readFileSync(path, IO.encoding);
	},

	/**
	 * @param inFile
	 * @param outDir
	 * @param [fileName=The original filename]
	 */
	copyFile: function(/**string*/ inFile, /**string*/ outDir, /**string*/ fileName) {
		if (fileName == null) fileName = FilePath.fileName(inFile);
		nodejs.fs.copyFileSync(inFile, outDir + fileName);
	},

	/**
	 * Creates a series of nested directories.
	 */
	mkPath: function(/**Array*/ path) {
		if (path.constructor != Array) path = path.split(/[\\\/]/);
		var make = "";
		for (var i = 0, l = path.length; i < l; i++) {
			make += path[i] + SYS.slash;
			if (!IO.exists(make)) {
				IO.makeDir(make);
			}
		}
	},

	/**
	 * Creates a directory at the given path.
	 */
	makeDir: function(/**string*/ path) {
		if (!IO.exists(path))
			nodejs.fs.mkdirSync(path);
	},

	/**
	 * @type string[]
	 * @param dir The starting directory to look in.
	 * @param [recurse=1] How many levels deep to scan.
	 * @returns An array of all the paths to files in the given dir.
	 */
	ls: function(/**string*/ dir, /**number*/ recurse, _allFiles, _path) {
		if (_path === undefined) { // initially
			var _allFiles = [];
			var _path = [dir];
		}
		if (_path.length == 0) return _allFiles;
		if (recurse === undefined) recurse = 1;

		var dirStats = nodejs.fs.statSync(dir);
		if (!dirStats.isDirectory()) return [dir];
		var files = nodejs.fs.readdirSync(dir);

		for (var f = 0; f < files.length; f++) {
			var file = String(files[f]);
			if (file.match(/^\.[^\.\/\\]/)) continue; // skip dot files

			var stats = nodejs.fs.statSync(IO.join(dir, file));

			if (stats.isDirectory()) { // it's a directory
				_path.push(file);
				if (_path.length-1 < recurse)
					IO.ls(_path.join(SYS.slash), recurse, _allFiles, _path);
				_path.pop();
			}
			else if (stats.isFile()) {
				_allFiles.push((_path.join(SYS.slash)+SYS.slash+file).replace(SYS.slash+SYS.slash, SYS.slash));
			}
		}

		return _allFiles;
	},

	/**
	 * @type boolean
	 */
	exists: function(/**string*/ path) {
		return nodejs.fs.existsSync(nodejs.path.resolve(path));
	},

	/**
	 *
	 */
	open: function(/**string*/ path, /**string*/ append) {
		var append = true;
		var outFile = nodejs.fs.openSync(path, append ? 'a' : 'r+')
		var out = outFile.createWriteStream();
		return out;
	},

	/**
	 * Sets {@link IO.encoding}.
	 * Encoding is used when reading and writing text to files,
	 * and in the meta tags of HTML output.
	 */
	setEncoding: function(/**string*/ encoding) {
		if (/ISO-8859-([0-9]+)/i.test(encoding)) {
			IO.encoding = "ISO8859_"+RegExp.$1;
		}
		else {
			IO.encoding = encoding;
		}
	},

	/**
	 * @default "utf-8"
	 * @private
	 */
	encoding: "utf-8",

	/**
	 * Load the given script.
	 */
	include: function(/**string*/ path, /**bool*/ isAbsolutePath) {
		var name = isAbsolutePath ? path : SYS.pwd+path;
		var code = IO.readFile(name);
		nodejs.vm.runInThisContext(code, name);
		//nodejs.vm.runInNewContext(code, name);
	},

	/**
	 * Loads all scripts from the given directory path.
	 */
	includeDir: function(path) {
		if (!path) return;
		for (var lib = IO.ls(SYS.pwd+path), i = 0; i < lib.length; i++) {
			if (/\.js$/i.test(lib[i]))
				IO.include(lib[i], true);
		}
	}
}

/**
 * Loads the given script.
 * @function
 * @deprecated Use {@link IO.include} instead!
 */
load = IO.include.bind(IO);

// now run the application
IO.include("frame.js");
IO.include("main.js");

main();
