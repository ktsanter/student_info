"use strict";
//
// TODO: 
//


class InfoDeck {
  constructor(deckParams) {
    this._title = deckParams.title;
    this._indexlist = deckParams.indexlist;
    this._indexfield = deckParams.indexfield;
    this._layout = deckParams.layout;
    this._itemdetails = deckParams.itemdetails;
    
    this._elemDeckContainer = null;
  }
  
  //--------------------------------------------------------------------------------
  // rendering
  //--------------------------------------------------------------------------------
  renderDeck() {
    this._elemDeckContainer = document.createElement('div');
    this._elemDeckContainer.classList.add('decklayout-main');
    
    var elemNav = InfoDeck._renderNavigation(this._title);
    this._elemDeckContainer.appendChild(elemNav);

    var elemSelect = InfoDeck._renderSelect();
    this._elemSelectionInput = elemSelect.inputelement;
    autocomplete(elemSelect.inputelement, this._indexlist, e => this._handleSelection(e));
    this._elemDeckContainer.appendChild(elemSelect.container);
    
    var elemCardContainer = document.createElement('div');
    elemCardContainer.classList.add('decklayout-card');

    elemCardContainer.appendChild(InfoDeck._renderContainer('containerPicture', 'decklayout-picture',''));  
    elemCardContainer.appendChild(InfoDeck._renderContainer('containerGenericItems', 'decklayout-genericitems','<i>generic items</i>'));  
    elemCardContainer.appendChild(InfoDeck._renderContainer('containerBadges', 'decklayout-badges','<i>badges</i>'));  
    elemCardContainer.appendChild(InfoDeck._renderContainer('containerNotes', 'decklayout-notes','<i>notes</i>'));  
    elemCardContainer.appendChild(InfoDeck._renderContainer('containerCardLabel', 'decklayout-cardlabel',''));  
    
    this._elemDeckContainer.appendChild(elemCardContainer);

    return this._elemDeckContainer;
  }
  
  static _renderNavigation(title) {
    var navLinks = [
      {id: 'menuConfigure', label: 'configure'},
      {id: 'menuFullPage',  label: 'open in full page'},
      {id: 'menuAbout', label: 'about'}
    ];
    var elemContainer = document.createElement('div');
    elemContainer.classList.add('decklayout-topnav');    
    
    var elemLink = document.createElement('a');
    elemLink.classList.add('decklayout-title');
    elemLink.href = '#';
    elemLink.innerHTML = title;
    elemContainer.appendChild(elemLink);
    
    var elemSubLinksContainer = document.createElement('div');
    elemSubLinksContainer.id = 'deckNavLinks';
    for (var i = 0; i < navLinks.length; i++) {
      elemLink = document.createElement('a');
      elemLink.classList.add('decklayout-navlink');
      elemLink.id = navLinks[i].id;
      elemLink.innerHTML = navLinks[i].label;
      if (i == 0) { elemLink.addEventListener('click', e => InfoDeck._doConfigure(e), false); }
      else if (i == 1) { elemLink.addEventListener('click', e => InfoDeck._doFullPage(e), false); }
      else if (i == 2) { elemLink.addEventListener('click', e => InfoDeck._doAbout(e), false); }
      elemSubLinksContainer.appendChild(elemLink);
    }
    elemContainer.appendChild(elemSubLinksContainer);
    
    elemLink = document.createElement('a');
    elemLink.classList.add('icon');
    elemLink.href = "#";
    elemLink.id = 'hamburger';
    elemLink.addEventListener('click', e => InfoDeck._toggleHamburgerMenu(), false);
    var elemIcon = document.createElement('i');
    elemIcon.classList.add('fa');
    elemIcon.classList.add('fa-bars');
    elemLink.appendChild(elemIcon);
    elemContainer.appendChild(elemLink);
    
    return elemContainer;     
  }
  
  static _renderSelect() {
    var elemContainer = document.createElement('div');
    elemContainer.classList.add('decklayout-select');
    
    var elemInputDiv = document.createElement('div');
    
    var elemInput = document.createElement('input');
    elemInput.type = 'text';
    elemInput.autocomplete = 'off';
    elemInputDiv.appendChild(elemInput);
        
    elemContainer.appendChild(elemInputDiv);
    
    return {container: elemContainer, inputelement: elemInput};
  } 

  static _renderContainer(id, className, contents) {
    var elemContainer = document.createElement('div');
    elemContainer.id = id;
    elemContainer.classList.add(className);
    elemContainer.innerHTML = contents;
    return elemContainer;
  }
    
  //--------------------------------------------------------------------------
  // render card info
  //--------------------------------------------------------------------------
  _renderCardInfo(indexvalue) {
    var item = this._getMatchingItemDetails(indexvalue);
    if (item == null) {
      console.log('Error: internal error - failed to find item details for ' + indexvalue);
      return;
    }
    
    for (var key in item) {
      console.log(key + ' ' + item[key] + ' ' + this._layout.fieldtype[key] + ' ' + this._layout.fieldtitle[key]);
    }
    //this._renderCardLabel(item);
  }
  
  _getMatchingItemDetails(indexvalue) {  // expand to handle multiple matches
    var arrItems = this._itemdetails;
    var matchingItem = null;
    
    for (var i = 0; i < arrItems.length && matchingItem == null; i++) {
      var item = arrItems[i];
      if (item[this._indexfield] == indexvalue) {
        matchingItem = item;
      }
    }
    
    return matchingItem;
  }

  _renderCardLabel(item) {
    var elemLabel = this._elemDeckContainer.getElementsByClassName('decklayout-cardlabel')[0];
    elemLabel.innerHTML = item[this._layout.labelfield];
  }
  
  //--------------------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------------------
  _handleSelection() {
    this._renderCardInfo(this._elemSelectionInput.value);
  }
    
  static _doConfigure() { InfoDeck._doMenu('configure'); }
  static _doFullPage() { InfoDeck._doMenu('full page'); }
  static _doAbout() { InfoDeck._doMenu('about'); }
  
  static _doMenu(menuOption) {
    var msg = 'menu option selected: ' + menuOption;
    console.log(msg);
    document.getElementById('deckNavLinks').style.display = 'none';
  }
  
  static _toggleHamburgerMenu() {
    var x = document.getElementById("deckNavLinks");
    if (x.style.display === "block") {
      x.style.display = "none";
    } else {
      x.style.display = "block";
    }
  }
}

//-----------------------------------------------------------------------------
// original stuff
//-----------------------------------------------------------------------------  

function _renderCardInfoItem(key, fieldtype, fieldvalue) {
  var elemContainer = document.createElement('div');
  elemContainer.classList.add('cardinfo-item');
  
  var formattedFieldValue = null;
  var elemNotes = null;

  var elemLabel = document.createElement('span');
  elemLabel.classList.add('cardinfo-item-label');
  elemLabel.innerHTML = key + ':';
  
  if (fieldtype == 'text') {
    formattedFieldValue = fieldvalue;
  } else if (fieldtype == 'percent') {
    formattedFieldValue = (fieldvalue * 100) + '%';
    
  } else if (fieldtype == 'flag') {
    formattedFieldValue = fieldvalue ? 'yes': 'no';
    
  } else if (fieldtype == 'date') {
    formattedFieldValue = _formatDate(fieldvalue);
    
  } else if (fieldtype == 'notes') {
    formattedFieldValue = null;
    var splitNotes = fieldvalue.split('\n');
    if (splitNotes.length > 0 && splitNotes[0] != '') {
      elemNotes = document.createElement('ul');
      elemNotes.classList.add('cardinfo-item-notes');
      for (var i = 0; i < splitNotes.length; i++) {
        var elemNote = document.createElement('li');
        elemNote.innerHTML = splitNotes[i];
        elemNotes.appendChild(elemNote);
      }
    }
    
  } else if (fieldtype == 'dontrender') {
    formattedFieldValue = null;
    
  } else {
    formattedFieldValue = '[unrecognized field type: <i>' + fieldtype + '</i>]';
  }

  if (fieldtype != 'dontrender') {
    elemContainer.appendChild(elemLabel);
  }
  if (elemNotes != null) {
      elemContainer.appendChild(elemNotes);
  }
  if (formattedFieldValue != null) {
    var elemValue = document.createElement('span');
    elemValue.innerHTML = formattedFieldValue;   
    elemContainer.appendChild(elemValue);
  }

  return elemContainer;
}

//---------------------------------------
// utility functions
//----------------------------------------
function _formatDate(theDate) {
  var formattedDate = '';
  
  if (theDate != null & theDate != '') {
    var objDate = new Date(theDate);
    var day = ("00" + objDate.getDate()).slice(-2);
    var month = ("00" + (objDate.getMonth() + 1)).slice(-2);
    var year = (objDate.getFullYear() + '').slice(-2);
    formattedDate = month + "/" + day + "/" + year;
  }
  
  return formattedDate;
}  

