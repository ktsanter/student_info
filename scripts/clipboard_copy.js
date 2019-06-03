"use strict";
//-----------------------------------------------------------------------------------
// copy to and from clipboard
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

class ClipboardCopy {
  constructor() {
    this._version = '0.01';
    
    this._clipboardArea = this._renderClipboardCopyArea();
    document.getElementsByTagName('body')[0].appendChild(this._clipboardArea);
  }
 
  _renderClipboardCopyArea() {
    var elemClipboardArea = document.createElement('textarea');
    elemClipboardArea.style.display = 'none';
    return elemClipboardArea;
  }

  _copyToClipboard(txt) {
		var clipboardElement = this._clipboardArea;
		clipboardElement.value = txt;
		clipboardElement.style.display = 'block';
		clipboardElement.select();
		document.execCommand("Copy");
		clipboardElement.selectionEnd = clipboardElement.selectionStart;
		clipboardElement.style.display = 'none';
	}	
}
