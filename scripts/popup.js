"use strict";
//-----------------------------------------------------------------------------------
// Student infoDeck Chrome extension
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

const app = function () {
	const page = { 
    deck: null,
    deckinitialized: false,
    reconfigureUI: null
  };
  
  const settings = {
    appName: 'Student infoDeck',
    helpURL: 'https://ktsanter.github.io/student_info/popup_help.html',
    reportingURL: 'https://ktsanter.github.io/student_info/report.html',
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
    page.body.classList.add('colorscheme');
    
    page.body.appendChild(_renderNoticeElement());
    _getConfigurationParameters(_continue_init);
  }
  
  async function _continue_init() {
    settings.deck = new InfoDeck();

    if (settings.configparams.hasOwnProperty('studentspreadsheetid') && settings.configparams.studentspreadsheetid != '') {
      _configureAndRenderDeck(settings.deck);
    } else {
      _renderReconfigureUI();
    }
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
    _setNotice('loading...');
    settings.studentandlayoutdata = await _getStudentAndLayoutData();
 
    if (page.deck != null && settings.deckinitialized) {
      page.body.removeChild(page.deck);
    }
    settings.deckinitialized = false;

    var deckParams = await _makeDeckParams();
    if (!settings.usetimer) _setNotice('');
    deck.init(deckParams);
    page.deck = deck.renderDeck();
    page.body.appendChild(page.deck);
    settings.deckinitialized = true;
    document.getElementById('selectControl').focus(); // this should probably be generalized
  }
  
  async function _getStudentAndLayoutData() {
    var result = null;
    
    if (settings.configparams != null) {
      if (settings.usetimer) var startTime = new Date();
      var requestResult  = await googleSheetWebAPI.webAppGet(
        apiInfo.studentinfo, 'all', 
        {
          studentinfo_spreadsheetid: settings.configparams.studentspreadsheetid
        }
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
      var indexfield = _findIndexField(settings.studentandlayoutdata);
      
      deckParams = {
        title: settings.appName,
        version: chrome.runtime.getManifest().version,
        indexlist: _makeIndexList(indexfield, settings.studentandlayoutdata.studentinfo),
        indexfield: indexfield,
        layout: {
          fieldtype: _makeFieldTypeParams(settings.studentandlayoutdata.layoutinfo),
          badges: settings.studentandlayoutdata.layoutdefinitioninfo.badges
        },
        itemdetails: settings.studentandlayoutdata.studentinfo,
        callbacks: {
          notes: _notesCallback,
          isfuzzyequal: _isFuzzyEqual,
          menu: [
            {label: 'configure', callback: _configCallback},
            {label: 'open data source', callback: _openSourceSpreadsheetCallback},
            {label: 'report', callback: _showReporting},
            {label: 'help', callback: _showHelp}
          ]
        }
      };
    } 
    
    return deckParams;
  }
  
  function _findIndexField(data) {
    var fields = data.layoutinfo.fields;
    var indexFieldKey = null;
    
    for (var key in fields) {
      var field = fields[key];
      if (field.fieldtype == 'index') indexFieldKey = key;
    }
    
    return indexFieldKey;    
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
      spreadsheetid: settings.configparams.studentspreadsheetid,
      indexval: params.deckindexval,
      cardnumber: params.cardnumber,
      notes: params.notes
    }

    var requestResult = await googleSheetWebAPI.webAppPost(apiInfo.studentinfo, 'savenote', postParams, _reportError);
    if (requestResult.success) {
      _setNotice('');
    }
  }
  
  function _isFuzzyEqual(fullindexVal, enteredVal) {
    var result = {
      isEqual: false,
      markedEqualText: ''
    };
    
    var splitName = fullindexVal.split(', ');
    var firstName = splitName[1];
    var lastName = splitName[0];
    var cutFirstName = firstName.substr(0, enteredVal.length);
    var cutLastName = lastName.substr(0, enteredVal.length);
    var remainderFirstName = firstName.slice(cutFirstName.length);
    var remainderLastName = lastName.slice(cutLastName.length);
       
    if (enteredVal.includes(',') && (fullindexVal.substr(0, enteredVal.length).toUpperCase() == enteredVal.toUpperCase())) {
      result.markedEqualText = '<strong>' + fullindexVal.substr(0, enteredVal.length) + '</strong>' + fullindexVal.substr(enteredVal.length);
      
    } else if (cutLastName.toUpperCase() == enteredVal.toUpperCase()) {
      result.markedEqualText = '<strong>' + cutLastName + '</strong>' + remainderLastName + ', ' + firstName;
      
    } else if (cutFirstName.toUpperCase() == enteredVal.toUpperCase()) {
      result.markedEqualText = lastName + ', ' + '<strong>' + cutFirstName + '</strong>' + remainderFirstName;
    }
    
    result.isEqual = (result.markedEqualText != '');
    
    return result;
  }
  
  function _showHelp() {
    window.open(settings.helpURL, '_blank');
  }
  
  function _showReporting() {
    var url = settings.reportingURL + '?ssid=' + settings.configparams.studentspreadsheetid;
    window.open(url, '_blank');
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
    if (settings.deckinitialized) settings.deck.hideDeck()
    
    page.reconfigureUI = document.createElement('div');
    page.reconfigureUI.id = 'reconfigureUI';
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
    
    if (settings.deckinitialized) {
      var elemDiscard = document.createElement('i');
      elemDiscard.classList.add('fas');
      elemDiscard.classList.add('fa-times');
      elemDiscard.classList.add('fa-lg');
      elemDiscard.classList.add('reconfigure-icon');
      elemDiscard.title = 'discard changes';
      elemDiscard.addEventListener('click', _cancelReconfigure, false);
      elemContainer.appendChild(elemDiscard);        
    }
    page.reconfigureUI.appendChild(elemContainer);

    var elemContainer = document.createElement('div');
    elemContainer.classList.add('reconfigure-item');    
    var elemInput = document.createElement('input');
    elemInput.classList.add('reconfigure-input');
    elemInput.id = 'studentinfoSpreadsheetLink';
    elemInput.value = settings.configparams.studentspreadsheetlink;
    elemContainer.appendChild(elemInput);
    page.reconfigureUI.appendChild(elemContainer);
        
    page.body.appendChild(page.reconfigureUI);  
  }
  
  async function _endReconfigure(saveNewConfiguration) { 
    if (saveNewConfiguration) {
      var userEntry = document.getElementById('studentinfoSpreadsheetLink').value;

      var sID = userEntry.match(/\?id=([a-zA-Z0-9-_]+)/);
      if (sID == null) {
        sID = '';
      } else {
        sID = sID[0].slice(4);
      }

      var dataSourceIsValid = await _validateDataSource(sID);
      if (dataSourceIsValid) {
        settings.configparams.studentspreadsheetlink = userEntry;
        settings.configparams.studentspreadsheetid = sID;
        _storeConfigurationParameters(null);
        _configureAndRenderDeck(settings.deck);
        page.body.removeChild(page.reconfigureUI);
        page.reconfigureUI = null;
      } 
      
    } else {
      page.body.removeChild(page.reconfigureUI);
      page.reconfigureUI = null;
      if (settings.deckinitialized) settings.deck.showDeck();
      _setNotice('');
    }
  }
  
  async function _validateDataSource(spreadsheetid) {
    _setNotice('validating data source...');
    var requestResult  = await googleSheetWebAPI.webAppGet(
      apiInfo.studentinfo, 'validate', 
      {studentinfo_spreadsheetid: spreadsheetid}
    );
    
    if (requestResult.sucess) {
      _setNotice('');
    } else {
      _setNotice(requestResult.details);
    }
      
    return requestResult.success;
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
