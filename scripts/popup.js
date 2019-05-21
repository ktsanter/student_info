"use strict";
//
// TOOD: add chrome storage get/put for configuration
// TODO: look at optimizing retrieval code in API app
// TODO: add error handling for bad spreadsheet ID/wrong sheet name
// TODO: look at using full spreadsheet link rather than ID
// TODO; change "open full page" to "open source spreadsheet"
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
    _getCurrentConfigurationParameters(_continue_init);
  }
  
  async function _continue_init() {
    console.log('_continue_init: configparams=' + JSON.stringify(settings.configparams));
    settings.deck = new InfoDeck();
    _configureAndRenderDeck(settings.deck);
	}

  function _getCurrentConfigurationParameters(callback) {
    const storagefieldSheetId = 'studenInfoDeck_SpreadsheetFileId';
        
    chrome.storage.sync.get([storagefieldSheetId], function (result) {
      var configParams = {studentspreadsheetid: ''};
      if (typeof result.studenInfoDeck_SpreadsheetFileId != 'undefined') {
        configParams = {};
        configParams.studentspreadsheetid = result.studenInfoDeck_SpreadsheetFileId;
      } 
      
      settings.configparams = configParams;
      callback();
    });
  }
  
  //-------------------------------------------------------------------------------------
  // configuration functions
  //-------------------------------------------------------------------------------------
  async function _configureAndRenderDeck(deck) {   
    console.log('_configureAndRenderDeck: deck=' + deck + ' configparams=' + JSON.stringify(settings.configparams));
    if (settings.configparams == null || settings.configparams.studentspreadsheetid == '') {
      _renderReconfigureUI();
      
    } else {
      _setNotice('loading...');
      settings.studentandlayoutdata = await _getStudentAndLayoutData();
      console.log('_configureAndRenderDeck: studentandlayoutdata=' + settings.studentandlayoutdata);
    
   
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
    console.log('getStudentAndLayoutData: configparams=' + JSON.stringify(settings.configparams));
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
        console.log('ERROR: in _getStudentAndLayoutData');
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
          fullpage: _openInFullPageCallback,
          notes: _notesCallback
        }
      };
    } 
    
    return deckParams;
  }
    
  
  
  
/*
function retrieveSettings(callback)
{
	chrome.storage.sync.get(['cbSpreadsheetFileId', 'cbBBSelector', 'cbSearch', 'cbTags', 'cbCommentIndex'], function(result) {
		var fileIdString = '';
		var bbSelector = true;
		var searchString = '';
		var tagString = '';
		var commentIndex = -1;

		if (typeof result.cbSpreadsheetFileId != 'undefined') {
			fileIdString = result.cbSpreadsheetFileId;
		}
		if (typeof result.cbBBSelector != 'undefined') {
			bbSelector = result.cbBBSelector;
		}
		if (typeof result.cbSearch != 'undefined') {
			searchString = result.cbSearch;
		}
		if (typeof result.cbTags != 'undefined') {
			tagString = result.cbTags;
		}
		if (typeof result.cbCommentIndex != 'undefined') {
			commentIndex = result.cbCommentIndex;
		}
		
		cbData.spreadsheetFileId = fileIdString;
		//document.getElementById(cbData.bbSelectorId.substring(1)).checked = bbSelector;
		cbData.commentIndex = commentIndex;
		$(cbData.urlInputId).val(fileIdString);
		$(cbData.commentSearchInputId).val(searchString);
		$(cbData.tagSearchInputId).val(tagString);

		callback();
  });
}

function storeSettings(callback)
{	
	var keys = {
		"cbSpreadsheetFileId": $(cbData.urlInputId).val(),
		"cbBBSelector": true, //document.getElementById(cbData.bbSelectorId.substring(1)).checked,
		"cbSearch": $(cbData.commentSearchInputId).val(), 
		"cbTags": $(cbData.tagSearchInputId).val(),
		"cbCommentIndex": cbData.commentIndex
	};
	
	chrome.storage.sync.set(keys, function() {
		if (callback != null) {
			callback();
		}
	});
}
*/  

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
    alert('need to implement "open in full page"');
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
    elemTitle.innerHTML = 'student information spreadsheet file ID';
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
    elemInput.id = 'studentinfoSpreadsheetId';
    elemInput.value = settings.configparams.studentspreadsheetid;
    elemContainer.appendChild(elemInput);
    page.reconfigureUI.appendChild(elemContainer);
        
    page.body.appendChild(page.reconfigureUI);    
  }
  
  function _endReconfigure(saveNewConfiguration) {    
    if (saveNewConfiguration) {
      settings.configparams.studentspreadsheetid = document.getElementById('studentinfoSpreadsheetId').value;
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