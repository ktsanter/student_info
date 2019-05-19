"use strict";
//
// TODO: add query params for deck data and layout
// TODO: implement config and config callback
// TODO: look at optimizing retrieval code in API app
//

const app = function () {
	const page = {};
  
  const TEMP_STUDENTINO_SPREADSHEET_ID = '17m8kxYjqTTGHsTFnD3VSTy7P4ztF9f9ggPJz4wTVdO4';  // should get from either "config" or query param
  const TEMP_LAYOUTDEF_SPREADSHEET_ID = '1pBVYZdKv1U6FErHhiI1mTiGemFDOY5CVCcPCa31bY9g';  // should get from either "config" or query param
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
    
    page.body.appendChild(_renderNoticeElement());
		
    _testInfoDeckClass();
	}

  async function _testInfoDeckClass() {
    _setNotice('initializing deck...');

    var requestResult  = await googleSheetWebAPI.webAppGet(apiInfo.studentinfo, 'all', {studentinfo_spreadsheetid: TEMP_STUDENTINO_SPREADSHEET_ID, layoutdefinitions_spreadsheetid: TEMP_LAYOUTDEF_SPREADSHEET_ID}, _reportError);
    if (!requestResult.success) return;

    _setNotice('');

    var indexfield = 'fullname';
    var studentdata = requestResult.data.studentinfo;
    var layoutinfo = {
      fieldtype: _makeFieldTypeParams(requestResult.data.layoutinfo),
      badges: requestResult.data.layoutdefinitioninfo.badges
    };
    
    var deckParams = {
      title: 'Student info',
      indexlist: _makeIndexList(indexfield, studentdata),
      indexfield: indexfield,
      layout: layoutinfo, 
      itemdetails: studentdata,
      callbacks: {
        config: _configCallback,
        notes: _notesCallback
      }
    };
    
    var deck = new InfoDeck(deckParams);
    page.body.appendChild(deck.renderDeck());
  }
  
  function _makeIndexList(indexfield, data) {
    var indexlistWithDupes = [];
    for (var i = 0; i < data.length; i++) {
      indexlistWithDupes.push(data[i][indexfield])
    }
    
    var indexList = Array.from(new Set(indexlistWithDupes));
    return indexList.sort();
  }
  
  function _makeFieldTypeParams(layout) {
    var fieldtypes = {};
    var fields = layout.fields;
    for (var key in fields) {
      fieldtypes[key] = fields[key].fieldtype;
    }
    return fieldtypes;
  }
  
  function _configCallback() {
    console.log('main.js: config callback');
  }
  
  async function _notesCallback(params) {
    _setNotice('updating notes...');

    var postParams = {
      spreadsheetid: TEMP_STUDENTINO_SPREADSHEET_ID,
      fullname: params.deckindexval,
      cardnumber: params.cardnumber,
      notes: params.notes
    }

    var requestResult = await googleSheetWebAPI.webAppPost(apiInfo.studentinfo, 'savenote', postParams, _reportError);
    if (requestResult.success) {
      _setNotice('');
    }
  }
  
	//-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------  
  function _renderNoticeElement() {
    var elemNotice = document.createElement('div');
    
    elemNotice.innerHTML = 'notice';
    elemNotice.classList.add('notice');
    page.notice = elemNotice;
    
    return elemNotice;    
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
