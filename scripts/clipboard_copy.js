"use strict";
//-----------------------------------------------------------------------------------
// copy to and from clipboard
// note: if copyType is 'rendered' or 'both' then "clipboard.min.js" must be included
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

class ClipboardCopy {
  constructor(appendTo, copyType) {
    this._version = '0.02';
    
    if (!appendTo) appendTo = document.getElementsByTagName('body')[0]
    
    if (copyType == 'plain' || copyType == 'both') {
      this._clipboardArea = this._renderClipboardCopyArea();
      appendTo.appendChild(this._clipboardArea);
    }
    
    if (copyType == 'rendered' || copyType == 'both') {
      this._renderedClipboardArea = this._renderRenderedClipboardCopyArea();
      appendTo.appendChild(this._renderedClipboardArea);
    }
  }
 
  _renderClipboardCopyArea() {
    var elem = document.createElement('textarea');
    elem.style.display = 'none';
    return elem;
  }
  
  _renderRenderedClipboardCopyArea() {
    var container = CreateElement.createDiv('renderedCopyContainer', 'renderedcopy');
    container.style.display = 'none';
    
    var elemButton = CreateElement.createButton('btnCopyRendered', null, 'hide me');
    var elemTarget = CreateElement.createDiv('copyRenderedTarget', null);
    elemButton.setAttribute('data-clipboard-target', '#' + elemTarget.id);
    var junk = new Clipboard(elemButton); 
    
    container.appendChild(elemButton);
    container.appendChild(elemTarget);
    
    return container;
  }

  copyToClipboard(txt) {
		var clipboardElement = this._clipboardArea;
		clipboardElement.value = txt;
		clipboardElement.style.display = 'block';
		clipboardElement.select();
		document.execCommand("Copy");
		clipboardElement.selectionEnd = clipboardElement.selectionStart;
		clipboardElement.style.display = 'none';
	}	
  
  copyRenderedToClipboard(txt) {
    var container = document.getElementById('renderedCopyContainer');
    var elemButton = document.getElementById('btnCopyRendered');
    var elemTarget = document.getElementById('copyRenderedTarget');
    
    container.style.display = 'block';
    elemTarget.innerHTML = txt;
    elemButton.click();
    container.style.display = 'none';
  }  
}
