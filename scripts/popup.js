"use strict";
//
// TODO:
//

// $(cbData.versionId).html("v" + chrome.runtime.getManifest().version);  --- just in case I need it

const app = function () {
  var TEMP_STUDENTINFO_SHEET_ID = '17m8kxYjqTTGHsTFnD3VSTy7P4ztF9f9ggPJz4wTVdO4';
  
	const page = { 
    deck: null,
    deckinitialized: false,
    reconfigureUI: null
  };
  
  const settings = { 
    configparams: null,
    deck: null,
    usetimer: false
  };

  const apiInfo = {
    studentinfo: {
      apibase: 'https://script.google.com/macros/s/AKfycbxpMfjVsVXjZuSdkI5FABJHFY5azMdbep7YfMI_OVndxtN_VwI/exec',
      apikey: 'MV_studeninfoAPI'
    }
  };
        
	//---------------------------------------
	// get things going
	//----------------------------------------
  function init() {
		page.body = document.getElementsByTagName('body')[0];
    
    page.body.appendChild(_renderNoticeElement());
    _getConfigurationParameters(_continue_init);
  }
  
  async function _continue_init() {
    settings.deck = new InfoDeck();
    _configureAndRenderDeck(settings.deck);
	}

  //-------------------------------------------------------------------------------------
  // use chrome.storage to get and set configuration parameters
  //-------------------------------------------------------------------------------------
  const storageKeys = {
    sheetid: 'sid_fileid',
    sheeturl: 'sid_fileurl'
  };
    
  function _getConfigurationParameters(callback) {        
    chrome.storage.sync.get( [storageKeys.sheetid, storageKeys.sheeturl],  function (result) {
      var configParams = {
        studentspreadsheetid: '',
        studentspreadsheetlink: ''
      };
      
      if (typeof result[storageKeys.sheetid] != 'undefined') {
        configParams.studentspreadsheetid = result[storageKeys.sheetid];
      }
      if (typeof result[storageKeys.sheeturl] != 'undefined') {
        configParams.studentspreadsheetlink = result[storageKeys.sheeturl];
      }        
      
      settings.configparams = configParams;
      callback();
    });
  }
  
  function _storeConfigurationParameters(callback) {
    var savekeys = {};
    savekeys[ storageKeys.sheetid ] = settings.configparams.studentspreadsheetid;
    savekeys[ storageKeys.sheeturl ] = settings.configparams.studentspreadsheetlink
    
    chrome.storage.sync.set(savekeys, function() {
      if (callback != null) callback;
    });
  }

  //-------------------------------------------------------------------------------------
  // deck configuration functions
  //-------------------------------------------------------------------------------------
  async function _configureAndRenderDeck(deck) {   
    if (settings.configparams == null || settings.configparams.studentspreadsheetid == '') {
      _renderReconfigureUI();
      
    } else {
      _setNotice('loading...');
      settings.studentandlayoutdata = await _getStudentAndLayoutData();
   
      if (page.deck != null && settings.deckinitialized) {
        page.body.removeChild(page.deck);
      }
      settings.deckinitialized = false;

      var deckParams = await _makeDeckParams();
      if (deckParams != null) {
        if (!settings.usetimer) _setNotice('');
        deck.init(deckParams);
        page.deck = deck.renderDeck();
        page.body.appendChild(page.deck);
        settings.deckinitialized = true;
        
      } else {
        _setNotice('unable to load data from file');
        _renderReconfigureUI();
      }
    }
  }
  
  async function _getStudentAndLayoutData() {
    var result = null;
    
    if (settings.configparams != null) {
      if (settings.usetimer) var startTime = new Date();
      var requestResult  = await googleSheetWebAPI.webAppGet(
        apiInfo.studentinfo, 'all', 
        {studentinfo_spreadsheetid: settings.configparams.studentspreadsheetid}
      );
      
      if (requestResult.success) {
        if (settings.usetimer) var elapsedTime = new Date() - startTime;
        if (settings.usetimer) _setNotice(elapsedTime/1000.0);
        result = requestResult.data;
        
      } else {
        console.log('ERROR: in _getStudentAndLayoutData' );
        console.log(requestResult.details);
      }
    }
    
    return result;
  }

  async function _makeDeckParams(studendAndLayoutData) {
    var deckParams = null;
        
    if (settings.studentandlayoutdata != null) { 
      var indexfield = 'fullname';
      
      deckParams = {
        title: 'Student info',
        indexlist: _makeIndexList(indexfield, settings.studentandlayoutdata.studentinfo),
        indexfield: indexfield,
        layout: {
          fieldtype: _makeFieldTypeParams(settings.studentandlayoutdata.layoutinfo),
          badges: settings.studentandlayoutdata.layoutdefinitioninfo.badges
        },
        itemdetails: settings.studentandlayoutdata.studentinfo,
        callbacks: {
          config: _configCallback,
          opensourcespreadsheet: _openSourceSpreadsheetCallback,
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
  
  function _openSourceSpreadsheetCallback() {
    window.open(settings.configparams.studentspreadsheetlink, '_blank');
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
    
    elemNotice.innerHTML = '';
    elemNotice.classList.add('notice');
    page.notice = elemNotice;
    
    return elemNotice;    
  }
 
   function _renderReconfigureUI() {
    if (page.reconfigureUI != null) {
      page.body.removeChild(page.reconfigureUI);
      page.reconfigureUI = null;
    }
    
    if (settings.deckinitialized) settings.deck.hideDeck()
    
    page.reconfigureUI = document.createElement('div');
    page.reconfigureUI.classList.add('reconfigure');
  
    elemContainer = document.createElement('div');
    elemContainer.classList.add('reconfigure-title');
    var elemTitle = document.createElement('div');
    elemTitle.classList.add('reconfigure-title-label');
    elemTitle.innerHTML = 'student information spreadsheet URL';
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
    var elemInput = document.createElement('input');
    elemInput.classList.add('reconfigure-input');
    elemInput.id = 'studentinfoSpreadsheetLink';
    elemInput.value = settings.configparams.studentspreadsheetid;
    elemContainer.appendChild(elemInput);
    page.reconfigureUI.appendChild(elemContainer);
        
    page.body.appendChild(page.reconfigureUI);    
  }
  
  function _endReconfigure(saveNewConfiguration) {    
    if (saveNewConfiguration) {
      var userEntry = document.getElementById('studentinfoSpreadsheetLink').value;
      var sID = userEntry.match(/\?id=([a-zA-Z0-9-_]+)/);
      if (sID == null) {
        sID = '';
      } else {
        sID = sID[0].slice(4);
      }

      settings.configparams.studentspreadsheetlink = userEntry;
      settings.configparams.studentspreadsheetid = sID;
      _storeConfigurationParameters(null);
      _configureAndRenderDeck(settings.deck);
      
    } else if (settings.configparams.studentspreadsheetid == '') {
      _configureAndRenderDeck();
    }

    page.reconfigureUI.style.display = 'none';
    if (settings.deckinitialized) settings.deck.showDeck();
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

document.addEventListener('DOMContentLoaded', app.init());