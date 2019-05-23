"use strict";
//-----------------------------------------------------------------------
// intput_test
//    try out the FuzzyControlInput
//-----------------------------------------------------------------------
// TODO:
//-----------------------------------------------------------------------

const app = function () {
	const page = { 
  };
  
  const settings = { 
  };
        
	//---------------------------------------
	// get things going
	//----------------------------------------
  function init() {
		page.body = document.getElementsByTagName('body')[0];
    _renderPage();
  }
  
	//-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------  
  function _renderPage() {
    var elemContainer = _createDiv('inputContainer', 'input-container')
    page.body.appendChild( elemContainer );
    elemContainer.style.display = 'inline-block'; 
    
    var indexList = [ "aaaaa", "bbbb", "cccc", "ccdd", "ccee", "cddd", "cddf", "ceee" ];
    var fuzzyInput = new FuzzyControlInput(indexList, _handleSelection, null); //_isFuzzyEqual);
    var elemFuzzyInput = fuzzyInput.render();
    elemFuzzyInput.id = 'fuzzySelect';
    elemContainer.appendChild(elemFuzzyInput);
    
    var elemResultContainer = _createDiv('resultContainer');
    elemResultContainer.style.display = 'inline-block';
    page.body.appendChild(elemResultContainer);
  }
  
  function _createDiv(id, classlist) {
    var elemDiv = document.createElement('div');
    
    if (id != null && id != '') elemDiv.id = id;
    
    if (classlist != null && classlist != '') {
      var splitClasses = classlist.split(' ');
      for (var i = 0; i < splitClasses.length; i++) {
        elemDiv.classList.add(splitClasses[i]);
      }
    }
    
    return elemDiv;
  }
  
	//------------------------------------------------------------------
	// callbacks
	//------------------------------------------------------------------
  function _isFuzzyEqual(fullindexVal, enteredVal) {
    var result = {
      isEqual: fullindexVal == enteredVal,  // exact match only
      markedEqualText: '<strong>' + enteredVal + '</strong>'
    };
    return result; 
  }
  
  function _handleSelection(selectionVal) {
    document.getElementById('resultContainer').innerHTML = 'selected: ' + selectionVal;
    console.log('selection: ' + selectionVal);
  }

	//------------------------------------------------------------------
	// handlers
	//------------------------------------------------------------------
    
	//---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();

document.addEventListener('DOMContentLoaded', app.init());