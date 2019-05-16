"use strict";
//
// TODO: take a look at https://listjs.com/docs/fuzzysearch/ for fuzzy search
//

const app = function () {
	const page = {};
  
	const settings = {};
  
  const TEMP_SPREADSHEET_ID = '17m8kxYjqTTGHsTFnD3VSTy7P4ztF9f9ggPJz4wTVdO4';
  const apiInfo = {
    studentinfo: {
      apibase: 'https://script.google.com/macros/s/AKfycbxpMfjVsVXjZuSdkI5FABJHFY5azMdbep7YfMI_OVndxtN_VwI/exec',
      apikey: 'MV_studeninfoAPI'
    }
  };
      
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
		page.body = document.getElementsByTagName('body')[0];
    
    page.body.appendChild(_renderTitle());
    page.body.appendChild(_renderNoticeElement());
		
    _setNotice('loading student list...');
    var requestResult_students  = await googleSheetWebAPI.webAppGet(apiInfo.studentinfo, 'allstudentinfo', {spreadsheetid: TEMP_SPREADSHEET_ID}, _reportError);
    if (requestResult_students.success) {
      settings.studentinfo = requestResult_students.data;
      _setNotice('');
      _makeStudentList();
      _renderContents();
      autocomplete(page.studentinput, settings.studentlist, _processStudentSelection);
    }
	}
		
  function _makeStudentList() {
    var listwithdupes = [];
    for (var i = 0; i < settings.studentinfo.length; i++) {
      var student = settings.studentinfo[i];
      var first = student.first.trim();
      var last = student.last.trim();
      listwithdupes.push(last + ', ' + first)
    }      
    
    settings.studentlist = Array.from(new Set(listwithdupes));
  }
  
	//-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------  
  function _renderTitle() {
    var elemTitle = document.createElement('div');
    
    elemTitle.innerHTML = 'Student info';
    elemTitle.classList.add('title');
    
    return elemTitle;
  }

  function _renderNoticeElement() {
    var elemNotice = document.createElement('div');
    
    elemNotice.innerHTML = 'notice';
    elemNotice.classList.add('notice');
    page.notice = elemNotice;
    
    return elemNotice;    
  }
  
  function _renderContents() {
    page.contents = document.createElement('div');
    page.contents.id = 'contents';
    page.body.appendChild(page.contents);

    page.contents.appendChild(_renderStudentSelection());
    page.contents.appendChild(_renderStudentInfoSection());
  }  
  
  function _renderStudentSelection() {
    var elemContainer = document.createElement('div');
    
    var elemInputDiv = document.createElement('div');
    elemInputDiv.classList.add('autocomplete'); 
    elemInputDiv.style.width = '300px';
    
    var elemInput = document.createElement('input');
    elemInput.type = 'text';
    elemInput.placeholder = 'student name';
    elemInput.autocomplete = 'off';
    page.studentinput = elemInput;
    elemInputDiv.appendChild(elemInput);
        
    elemContainer.appendChild(elemInputDiv);
    
    return elemContainer;
  } 
  
  function _renderStudentInfoSection() {
    var elemContainer = document.createElement('div');
    
    page.studentinfo = elemContainer;
    
    return elemContainer;
  }
  
  async function _processStudentSelection() {
    var studentval = page.studentinput.value.split(',');
    var first = studentval[1].trim();
    var last = studentval[0].trim();
    
    var info = null;
    for (var i = 0; i < settings.studentinfo.length && info == null; i++) {
      var student = settings.studentinfo[i];
      if (student.first == first && student.last == last) {
        info = student;
      }
    }
    
    if (info == null) return;
    
    _setNotice('loading info for ' + first + ' ' + last + '...');
    page.studentinfo.innerHTML = '';
    var requestResult  = await googleSheetWebAPI.webAppGet(apiInfo.studentinfo, 'studentinfo', {spreadsheetid: TEMP_SPREADSHEET_ID, "first": first, "last": last}, _reportError);
    if (requestResult.success) {
      _setNotice('');
      _renderDeck(page.studentinfo, requestResult.data);
    }
  }
  
	//-----------------------------------------------------------------------------
	// control styling, visibility, and enabling
	//-----------------------------------------------------------------------------    
  function _showElement(elem) {
    if (elem.classList.contains('hide-me')) {
      elem.classList.remove('hide-me');
    }
  }

  function _hideElement(elem) {
    elem.classList.add('hide-me');
  }
  
	//------------------------------------------------------------------
	// handlers
	//------------------------------------------------------------------
  
	//---------------------------------------
	// utility functions
	//----------------------------------------
	function _setNotice (label) {
		page.notice.innerHTML = label;

		if (label == '') {
			_hideElement(page.notice);
		} else {
			_showElement(page.notice);
		}
	}
  
  function _reportError(src, err) {
    _setNotice('Error in ' + src + ': ' + err.name + ' "' + err.message + '"');
  }

	//---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
