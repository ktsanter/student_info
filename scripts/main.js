"use strict";
//
// TODO: take a look at https://listjs.com/docs/fuzzysearch/ for fuzzy search
//

const app = function () {
	const page = {};
  
  const TEMP_SPREADSHEET_ID = '17m8kxYjqTTGHsTFnD3VSTy7P4ztF9f9ggPJz4wTVdO4';  // should get from either "config" or query param
  const apiInfo = {
    studentinfo: {
      apibase: 'https://script.google.com/macros/s/AKfycbxpMfjVsVXjZuSdkI5FABJHFY5azMdbep7YfMI_OVndxtN_VwI/exec',
      apikey: 'MV_studeninfoAPI'
    }
  };
   
  const temp_layoutinfo = {
    fieldtype: {
      "fullname": 'dontrender',
      "last": 'dontrender',	
      "first": 'dontrender',
      "course": 'label',
      "preferred_name": 'text',
      "email" : 'text',
      "start_end": 'text',
      "grade_level": 'badge_grade',	
      "IEP": 'badge_iep',
      "504": 'badge_504',	
      "mentor": 'text',	
      "mentor_email": 'text',
      "notes": 'notes'
    },
    fieldtitle: {
      "fullname": '',
      "last": '',	
      "first": '',
      "course": 'course',
      "preferred_name": 'preferred name',
      "email" : 'text',
      "start_end": 'start/end',
      "grade_level": '',	
      "IEP": 'IEP',	
      "504": '504',	
      "mentor": 'mentor',	
      "mentor_email": 'mentor email',
      "notes": 'Notes'
    }
  }
      
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
    var requestResult  = await googleSheetWebAPI.webAppGet(apiInfo.studentinfo, 'allstudentinfo', {spreadsheetid: TEMP_SPREADSHEET_ID}, _reportError);
    if (!requestResult.success) return;
    _setNotice('');

    var indexfield = 'fullname';
    var studentdata = requestResult.data;
    var deckParams = {
      title: 'Student info',
      indexlist: _makeIndexList(indexfield, studentdata),
      indexfield: indexfield,
      layout: temp_layoutinfo,
      itemdetails: studentdata
    };
    
    var deck = new InfoDeck(deckParams);
    page.body.appendChild(deck.renderDeck());
  }
  
  function _makeIndexList(indexfield, data) {
    var indexlistWithDupes = [];
    for (var i = 0; i < data.length; i++) {
      indexlistWithDupes.push(data[i][indexfield])
    }
    
    return Array.from(new Set(indexlistWithDupes));
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
