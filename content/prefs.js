/*
  Copyright (c) David Hanak

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
*/

var gIdentFavIcon = {
    SiteState: function(aHost, aState) {
	this.state = aState;
	this.__defineGetter__("host", function() { return aHost; });
	this.__defineGetter__("stateStr", function() {
		return gIdentFavIcon.mBundle.getString(this.state ? "always" : "never");
	    });
    },

    bind: function(obj, func) { return function() { return func.apply(obj, arguments); }; },

    mView: {
	states: new Array(0),
	sortCol: '',
	sortOrder: 0,

	get rowCount() { return this.states.length; },

	isContainer: function(row) { return false; },
	isSeparator: function(row) { return false; },
	isSorted: function() { return true; },
	getLevel: function(row) { return 0; },
	getImageSrc: function(row,col) { return null; },
	getRowProperties: function(row,props) {},
	getColumnProperties: function(colid,col,props) {},
	setTree: function(treebox) { this.treebox = treebox; },

	getCellText: function (aRow, aColumn) {
	    if (aColumn.id == "trcSite") return this.states[aRow].host;
	    else if (aColumn.id == "trcState") return this.states[aRow].stateStr;
	    return "";
	},
	getCellProperties: function(row,column,prop) { prop.AppendElement(gIdentFavIcon.mLtrAtom); },
	cycleHeader: function(aCol) { this.sortOnColumn(aCol.id, -this.sortOrder); },
	sortOnColumn: function(aCol, aOrd) {
	    if (this.sortCol != aCol) {
		this.sortCol = aCol;
		this.sortOrder = 1;
	    } else {
		this.sortOrder = aOrd
	    }
	    this.treebox.beginUpdateBatch();
	    this.states.sort(gIdentFavIcon.bind(this, function(a,b) {
			var field;
			if (this.sortCol == "trcSite") field = 'host';
			else if (this.sortCol == "trcState") field = 'stateStr';
			else return;
			if (a[field] < b[field]) return -this.sortOrder;
			if (a[field] == b[field]) return 0;
			return this.sortOrder;
		    }));
	    this.treebox.endUpdateBatch();
	}
    },
    
    init: function() {
	this.mLtrAtom = Components.classes["@mozilla.org/atom-service;1"]
		.getService(Components.interfaces.nsIAtomService).getAtom("ltr");
	this.mBundle = document.getElementById("bundle");
	this.mAlwaysPref = document.getElementById("prefSitesAlways");
	this.mNeverPref = document.getElementById("prefSitesNever");

	if (this.mAlwaysPref.value) {
	    var sites = this.mAlwaysPref.value.split(',');
	    for (var i = 0; i < sites.length; ++i)
		this.mView.states.push(new this.SiteState(sites[i], 1));
	}
	if (this.mNeverPref.value) {
	    sites = this.mNeverPref.value.split(',');
	    for (var i = 0; i < sites.length; ++i)
		this.mView.states.push(new this.SiteState(sites[i], 0));
	}

	document.getElementById("btnRemoveAll").disabled = this.mView.states.length == 0;
	document.getElementById("trSites").view = this.mView;
	this.mView.sortOnColumn('trcSite', 1);
    },

    updatePrefs: function() {
	var always = [];
	var never = [];
	for (var i = 0; i < this.mView.states.length; ++i) {
	    if (this.mView.states[i].state)
		always.push(this.mView.states[i].host);
	    else
		never.push(this.mView.states[i].host);
	}
	this.mAlwaysPref.value = always.join(",");
	this.mNeverPref.value = never.join(",");
    },

    onHostInput: function(aSiteField) {
	document.getElementById("btnAlways").disabled = !aSiteField.value;
	document.getElementById("btnNever").disabled = !aSiteField.value;
    },
  
    onHostKeyPress: function(aEvent) {
	if (aEvent.keyCode == KeyEvent.DOM_VK_RETURN)
	    document.getElementById("btnAlways").click();
    },

    onSiteSelected: function() {	
	document.getElementById("btnRemove").disabled = this.mView.selection.getRangeCount() == 0;
    },

    addSiteState: function(aState) {
	var textbox = document.getElementById("tbSite");
	var host = textbox.value.replace(/^\s*([-\w]*:\/+)?/, ""); // trim any leading space and scheme
	    host = (host.charAt(0) == ".") ? host.substring(1,host.length) : host;
	try {
	    var ioService = Components.classes["@mozilla.org/network/io-service;1"]
		.getService(Components.interfaces.nsIIOService);
	    var uri = ioService.newURI("http://"+host, null, null);
	    host = uri.host;
	} catch(ex) {
	    /*
	    var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
	    .getService(Components.interfaces.nsIPromptService);
	    var message = this,mBundle.getString("invalidURI");
	    var title = this.mBundle.getString("invalidURITitle");
	    promptService.alert(window, title, message);
	    */
	    return;
	}

	// check whether the permission already exists, if not, add it
	var tbo = document.getElementById('trSites').treeBoxObject;
	var exists = false;
	for (var i = 0; i < this.mView.states.length; ++i) {
	    if (this.mView.states[i].host == host) {
		this.mView.states[i].state = aState;
		tbo.invalidateRow(i);
		exists = true;
		break;
	    }
	}
	if (!exists) {
	    this.mView.states.push(new this.SiteState(host, aState));
	    tbo.rowCountChanged(this.mView.states.length-1, 1);
	}
	this.updatePrefs();

	textbox.value = "";
	textbox.focus();
	this.onHostInput(textbox);

	// enable "remove all" button as needed
	document.getElementById("btnRemoveAll").disabled = this.mView.states.length == 0;
    },

    removeAllSites: function() {
	var tbo = document.getElementById('trSites').treeBoxObject;
	tbo.beginUpdateBatch();
	this.mView.states = [];
	tbo.endUpdateBatch();
	this.updatePrefs();
    },

    removeSelectedSites: function() {
	var tree = document.getElementById('trSites');
	var selection = tree.view.selection;
	var removed = 0;
	tree.treeBoxObject.beginUpdateBatch();
	for (var i = 0; i < selection.getRangeCount(); ++i) {
	    var from = new Object();
	    var to = new Object();
	    selection.getRangeAt(i, from, to);
	    this.mView.states.splice(from.value-removed, to.value-from.value+1);
	    removed += to.value-from.value+1;
	}
	selection.clearSelection();
	tree.treeBoxObject.endUpdateBatch();
	this.updatePrefs();
    },
};
