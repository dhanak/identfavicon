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

var gIdentFavIcon_prefs = {
    SiteState: function(aHost, aState) {
	this.state = aState;
	this.__defineGetter__("host", function() { return aHost; });
	this.__defineGetter__("stateStr", function() {
		return gIdentFavIcon_prefs.mBundle.getString(this.state ? "always" : "never");
	    });
    },

    mView: {
	states: [],
	get rowCount() { return this.states.length; },
	getCellText: function (aRow, aColumn) {
	    if (aColumn.id == "trcSite") return this.states[aRow].host;
	    else if (aColumn.id == "trcState") return this.states[aRow].stateStr;
	    return "";
	},
	setTree: function(treebox) { this.treebox = treebox; },
	isContainer: function(row) { return false; },
	isSeparator: function(row) { return false; },
	isSorted: function() { return true; },
	getLevel: function(row) { return 0; },
	getImageSrc: function(row,col) { return null; },
	getRowProperties: function(row,props) {},
	getColumnProperties: function(colid,col,props) {},
	getCellProperties: function(row,column,prop) { prop.AppendElement(gIdentFavIcon_prefs.mLtrAtom); },
	cycleColumn: function(col) {}
    },
  
    init: function() {
	this.mLtrAtom = Components.classes["@mozilla.org/atom-service;1"]
		.getService(Components.interfaces.nsIAtomService).getAtom("ltr");
	this.mBundle = document.getElementById("bundle");
	document.getElementById("trSites").view = this.mView;
    },

    onHostInput: function(aSiteField) {
	document.getElementById("btnAlways").disabled = !aSiteField.value;
	document.getElementById("btnNever").disabled = !aSiteField.value;
    },
  
    onHostKeyPress: function(aEvent) {
	if (aEvent.keyCode == KeyEvent.DOM_VK_RETURN)
	    document.getElementById("btnAlways").click();
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
	textbox.value = "";
	textbox.focus();
	this.onHostInput(textbox);

	// enable "remove all" button as needed
	//document.getElementById("removeAllPermissions").disabled = this._permissions.length == 0;
    },
};
