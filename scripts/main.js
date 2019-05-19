"use strict";
//
// TODO: look at optimizing retrieval code in API app
//

const app = function () {
	const page = { 
    deck: null,
    reconfigureUI: null
  };
  
  const settings = { deck: null };

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
          fullpage: _openInFullPageCallback,
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
  // callback functions
  //-------------------------------------------------------------------------------------
  function _configCallback() {
    _renderReconfigureUI();
  }
  
  function _openInFullPageCallback() {
    alert('The information is already being displayed from a full page');
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
 
   function _renderReconfigureUI() {
    settings.deck.hideDeck()
    page.reconfigureUI = document.createElement('div');
    page.reconfigureUI.classList.add('reconfigure');
  
    elemContainer = document.createElement('div');
    elemContainer.classList.add('reconfigure-title');
    var elemTitle = document.createElement('div');
    elemTitle.classList.add('reconfigure-title-label');
    elemTitle.innerHTML = 'Configure student information data sources';
    elemContainer.appendChild(elemTitle);
    
    var elemCheck = document.createElement('i');
    elemCheck.classList.add('fa');
    elemCheck.classList.add('fa-check');
    elemCheck.classList.add('fa-lg');
    elemCheck.classList.add('reconfigure-icon');
    elemCheck.title = 'save changes';
    elemCheck.addEventListener('click', _completeReconfigure, false);
    elemContainer.appendChild(elemCheck);
    
    var elemDiscard = document.createElement('i');
    elemDiscard.classList.add('fa');
    elemDiscard.classList.add('fa-close');
    elemDiscard.classList.add('fa-lg');
    elemDiscard.classList.add('reconfigure-icon');
    elemDiscard.title = 'discard changes';
    elemDiscard.addEventListener('click', _cancelReconfigure, false);
    elemContainer.appendChild(elemDiscard);        
    page.reconfigureUI.appendChild(elemContainer);

    var elemContainer = document.createElement('div');
    elemContainer.classList.add('reconfigure-item');
    var elemLabel = document.createElement('div');
    elemLabel.classList.add('reconfigure-label');
    elemLabel.innerHTML = 'student info spreadsheet file ID';
    elemContainer.appendChild(elemLabel);
    
    var elemInput = document.createElement('input');
    elemInput.classList.add('reconfigure-input');
    elemInput.id = 'studentinfoSpreadsheetId';
    elemInput.value = settings.studentfileid;
    elemContainer.appendChild(elemInput);
    page.reconfigureUI.appendChild(elemContainer);
    
    elemContainer = document.createElement('div');
    elemContainer.classList.add('reconfigure-item');
    elemLabel = document.createElement('div');
    elemLabel.classList.add('reconfigure-label');
    elemLabel.innerHTML = 'layout definitions spreadsheet file ID';
    elemContainer.appendChild(elemLabel);

    elemInput = document.createElement('input');
    elemInput.classList.add('reconfigure-input');
    elemInput.id = 'layoutdefinitionSpreadsheetId';
    elemInput.value = settings.layoutfileid;
    elemContainer.appendChild(elemInput);
    page.reconfigureUI.appendChild(elemContainer);
        
    page.body.appendChild(page.reconfigureUI);    
  }
  
  function _endReconfigure(saveNewConfiguration) {    
    if (saveNewConfiguration) {
      settings.studentfileid = document.getElementById('studentinfoSpreadsheetId').value;
      settings.layoutfileid = document.getElementById('layoutdefinitionSpreadsheetId').value;
      _configureAndRenderDeck(settings.deck);
    }

    page.body.removeChild(page.reconfigureUI);
    settings.deck.showDeck();
  }
  
	//------------------------------------------------------------------
	// handlers
	//------------------------------------------------------------------
  function _completeReconfigure() {
    _endReconfigure(true);
  }
  
  function _cancelReconfigure() {
    _endReconfigure(false);
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
