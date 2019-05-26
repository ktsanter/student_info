"use strict";
//-----------------------------------------------------------------------
// FuzzyInputControl
//    class providing an input box which makes fuzzy 
//    matches agains an array of strings
//-----------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------

class FuzzyInputControl {
  
  // indexList:  array of string values in which to search for matches
  // handleSelection: callback for when selection is completed
  // isFuzzyEqual: (optional) callback for fuzzy comparison between 2 strings
  
  constructor (indexList, handleSelection, isFuzzyEqual) {
    this._version = '0.02';
    this._indexList = indexList;
    this._handleSelectionCallback = handleSelection;
    this._isFuzzyEqualCallback = isFuzzyEqual;
    
    this._elemInput = null;
    this._currentFocus;
  }
  
  setIndexList(indexlist) {
    this._indexlist = indexlist;
  }
  
  version() {
    return this._version;
  }
  
  //----------------------------------------------------------------------
  // rendering
  //----------------------------------------------------------------------
  render() {
    var renderResult = this._renderSelect();
    this._elemInput = renderResult.inputelement;
    document.addEventListener("click", function (me) { return function(e) {
      me._closeAllLists(e.target);
    }}(this));
    
    return renderResult.container;
  }
  
  _renderSelect() {
    var elemContainer = document.createElement('div');
    elemContainer.classList.add('fuzzyinputcontrol-select');
    
    var elemInputDiv = document.createElement('div');
    elemInputDiv.classList.add('fuzzyinputcontrol');
    elemInputDiv.style.position = 'relative';
    elemInputDiv.style.display = 'inline-block';
    elemContainer.appendChild(elemInputDiv);
    
    var elemInput = document.createElement('input');
    elemInput.classList.add('fuzzyinputcontrol-select-control');
    elemInput.id = 'selectControl';
    elemInput.type = 'text';
    elemInput.autocomplete = 'off';
    elemInputDiv.appendChild(elemInput);
    
    elemInput.addEventListener("input", e => this._handleInput(e), false);
    elemInput.addEventListener("keydown", e => this._handleKeydown(e), false);
   
    return {container: elemContainer, inputelement: elemInput};
  }
  
  //---------------------------------------------------------------------------
  // handlers
  //---------------------------------------------------------------------------
  _handleInput(e) {
    var val = e.target.value;
    var arr = this._indexList;

    this._closeAllLists();
    if (!val) { return false;}
    this._currentFocus = -1;
    var elemList = document.createElement("DIV");
    elemList.setAttribute("id", e.target.id + "fuzzyinputcontrol-list");
    elemList.setAttribute("class", "fuzzyinputcontrol-items");
    elemList.style.position = 'absolute';
    elemList.style.zIndex = '99';
    elemList.style.top = '100%';
    elemList.style.left = '0';
    elemList.style.right = '0';

    e.target.parentNode.appendChild(elemList);

    for (var i = 0; i < arr.length; i++) {
        var fuzzyEqual;
        if (this._isFuzzyEqualCallback == null) {
          fuzzyEqual = {
            isEqual: (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()),
            markedEqualText: "<strong>" + arr[i].substr(0, val.length) + "</strong>" + arr[i].substr(val.length)
          }
        } else {
          fuzzyEqual = this._isFuzzyEqualCallback(arr[i], val);
        }

        if (fuzzyEqual.isEqual) {        
          var elemItem = document.createElement("div");
          elemItem.classList.add('fuzzyinputcontrol-item');
          elemItem.innerHTML = fuzzyEqual.markedEqualText;      
          
          elemItem.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
          elemItem.addEventListener("click", function (me) { return function(e) {
            me._elemInput.value = e.target.getElementsByTagName("input")[0].value;
            me._closeAllLists();
            me._handleSelectionCallback(me._elemInput.value);     
          }; }(this));

          elemList.appendChild(elemItem);
      }
    }
  }
  
  _handleKeydown(e) {
    const DOWNARROW = 40;
    const UPARROW = 38;
    const ENTER = 13;
    
    var old = this._currentFocus;
    
    var x = document.getElementById(e.target.id + "fuzzyinputcontrol-list");    
    if (x) x = x.getElementsByTagName("div");
        
    if (e.keyCode == DOWNARROW) {
      this._currentFocus++;
      this._addActive(x);
      
    } else if (e.keyCode == UPARROW) {
      this._currentFocus--;
      this._addActive(x);
      
    } else if (e.keyCode == ENTER) {
      e.preventDefault();
      if (this._currentFocus > -1) {
        if (x) x[this._currentFocus].click();
      }
    }
  }
  
  //---------------------------------------------------------------------------
  // set/remove class for active item in "dropdown"
  //---------------------------------------------------------------------------
  _addActive(x) {
    if (!x) return false;
    this._removeActive(x);
    if (this._currentFocus >= x.length) this._currentFocus = 0;
    if (this._currentFocus < 0) this._currentFocus = (x.length - 1);
    x[this._currentFocus].classList.add("fuzzyinputcontrol-active");
  }
  
  _removeActive(x) {
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("fuzzyinputcontrol-active");
    }
  }
  
  //---------------------------------------------------------------------------
  // close "dropdown"
  //---------------------------------------------------------------------------
  _closeAllLists(elmnt) {
    var x = document.getElementsByClassName("fuzzyinputcontrol-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != this._elemInput) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  } 
}
