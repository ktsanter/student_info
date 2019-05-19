"use strict";
//
// TODO: implement config and config callback
// TODO: look at optimizing retrieval code in API app
//

const app = function () {
	const page = { deck: null };
  const settings = { deck: null };
  
  /*
  const TEMP_STUDENTINO_SPREADSHEET_ID = '17m8kxYjqTTGHsTFnD3VSTy7P4ztF9f9ggPJz4wTVdO4';  // should get from either "config" or query param
  const TEMP_LAYOUTDEF_SPREADSHEET_ID = '1pBVYZdKv1U6FErHhiI1mTiGemFDOY5CVCcPCa31bY9g';  // should get from either "config" or query param
  */
  
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
		
		_setNotice('initializing...');
		if (_initializeSettings()) {
      settings.deck = new InfoDeck();
      _configureAndRenderDeck(settings.deck);
    }
	}

	//-------------------------------------------------------------------------------------
	// query params:
	//-------------------------------------------------------------------------------------
	function _initializeSettings() {
    var result = false;

    var params = {};
    var urlParams = new URLSearchParams(window.location.search);
		params.studentfileid = urlParams.has('studentfileid') ? urlParams.get('studentfileid') : null;
		params.layoutfileid = urlParams.has('layoutfileid') ? urlParams.get('layoutfileid') : null;

    if (params.studentfileid != null && params.layoutfileid != null) {
      settings.studentfileid = params.studentfileid;
      settings.layoutfileid = params.layoutfileid;
			result = true;

    } else {   
      _setNotice('failed to initialize: student file ID and/or layout file ID is missing or invalid');
    }
    
    return result;
  }
  
  //-------------------------------------------------------------------------------------
  // configuration functions
  //-------------------------------------------------------------------------------------
  async function _configureAndRenderDeck(deck) {
    if (page.deck != null) {
      page.body.removeChild(page.deck);
    }

    _setNotice('loading...');
    var deckParams = await _makeDeckParams();
    if (deckParams != null) {
      _setNotice('');
      deck.init(deckParams);
      page.deck = deck.renderDeck();
      page.body.appendChild(page.deck);
    }
  }
  
  function _getCurrentConfigurationParameters() {
    return {
        studentinfo_spreadsheetid: settings.studentfileid, 
        layoutdefinitions_spreadsheetid: settings.layoutfileid
    };
  }
  
  async function _getStudentAndLayoutData() {
    var result = null;

    var requestResult  = await googleSheetWebAPI.webAppGet(
      apiInfo.studentinfo, 'all', 
      _getCurrentConfigurationParameters(), 
      _reportError
    );
    
    if (requestResult.success) {
      result = requestResult.data;
    }
    
    return result;
  }
  
  async function _makeDeckParams() {
    var deckParams = null;
    
    var studentAndLayoutData = await _getStudentAndLayoutData();
    if (studentAndLayoutData != null) {
      var indexfield = 'fullname';
      
      deckParams = {
        title: 'Student info',
        indexlist: _makeIndexList(indexfield, studentAndLayoutData.studentinfo),
        indexfield: indexfield,
        layout: {
          fieldtype: _makeFieldTypeParams(studentAndLayoutData.layoutinfo),
          badges: studentAndLayoutData.layoutdefinitioninfo.badges
        },
        itemdetails: studentAndLayoutData.studentinfo,
        callbacks: {
          config: _configCallback,
          notes: _notesCallback
        }
      };
    }
    
    return deckParams;
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
  
  //-------------------------------------------------------------------------------------
  // configuration functions
  //-------------------------------------------------------------------------------------
  function _configCallback() {
    if (confirm("Reconfigure?")) {
      _configureAndRenderDeck(settings.deck);
    }
  }
  
  async function _notesCallback(params) {
    _setNotice('updating notes...');

    var postParams = {
      spreadsheetid: settings.studentfileid,
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
