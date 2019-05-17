"use strict";
//
// TODO: handle consequences of configure callback (re-initialize, destroy and create?)
// TODO: adapt to work with Noah's config approach
// TODO: develop edit/add notes features
// TODO: take a look at https://listjs.com/docs/fuzzysearch/ for fuzzy search
//

class InfoDeck {
  constructor(deckParams) {
    this._title = deckParams.title;
    this._indexlist = deckParams.indexlist;
    this._indexfield = deckParams.indexfield;
    this._layout = deckParams.layout;
    this._itemdetails = deckParams.itemdetails;
    this._configcallback = deckParams.configcallback;
    
    this._elemDeckContainer = null;
    this._currentCardItems = null;
    this._currentCardNumber = 0;
  }
  
  //--------------------------------------------------------------------------------
  // rendering
  //--------------------------------------------------------------------------------
  renderDeck() {
    this._elemDeckContainer = document.createElement('div');
    this._elemDeckContainer.classList.add('decklayout-main');
    
    var elemNav = this._renderNavigation(this._title);
    this._elemDeckContainer.appendChild(elemNav);

    var elemSelect = InfoDeck._renderSelect();
    this._elemSelectionInput = elemSelect.inputelement;
    autocomplete(elemSelect.inputelement, this._indexlist, e => this._handleSelection(e));
    this._elemDeckContainer.appendChild(elemSelect.container);
    
    var elemCardContainer = document.createElement('div');
    elemCardContainer.classList.add('decklayout-card');

    elemCardContainer.appendChild(InfoDeck._renderContainer('containerPicture', 'decklayout-picture'));  
    elemCardContainer.appendChild(InfoDeck._renderContainer('containerGenericItems', 'decklayout-genericitems'));  
    elemCardContainer.appendChild(InfoDeck._renderContainer('containerBadges', 'decklayout-badges'));  
    elemCardContainer.appendChild(InfoDeck._renderContainer('containerNotes', 'decklayout-notes'));  
    elemCardContainer.appendChild(InfoDeck._renderContainer('containerCardLabel', 'decklayout-cardlabel'));  
    
    this._elemDeckContainer.appendChild(elemCardContainer);

    return this._elemDeckContainer;
  }
  
  _renderNavigation(title) {
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
      if (i == 0) { elemLink.addEventListener('click', e => this._doConfigure(e), false); }
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
    elemInputDiv.classList.add('autocomplete');
    
    var elemInput = document.createElement('input');
    elemInput.classList.add('decklayout-select-control');
    elemInput.type = 'text';
    elemInput.autocomplete = 'off';
    elemInputDiv.appendChild(elemInput);
        
    elemContainer.appendChild(elemInputDiv);
    
    return {container: elemContainer, inputelement: elemInput};
  } 

  static _renderContainer(id, className) {
    var elemContainer = document.createElement('div');
    elemContainer.id = id;
    elemContainer.classList.add(className);
    return elemContainer;
  }
    
  //--------------------------------------------------------------------------
  // render card info
  //--------------------------------------------------------------------------
  _processSelection(indexvalue) {
    this._currentCardItems = this._getMatchingItems(indexvalue);
    if (this._currentCardItems.length == 0) {
      console.log('Error: internal error - failed to find item details for ' + indexvalue);
      return;
    }
        
    this._currentCardNumber = 0;
    this._renderCardInfo();
  }
 
  _getMatchingItems(indexvalue) {  
    var arrItems = this._itemdetails;
    var matchingItems = [];
    
    for (var i = 0; i < arrItems.length; i++) {
      var item = arrItems[i];
      if (item[this._indexfield] == indexvalue) {
        matchingItems.push(item);
      }
    }
    
    return matchingItems;
  }

  _renderPreviousCardInfo() {
    if (this._currentCardNumber > 0) {
      this._currentCardNumber--;
      this._renderCardInfo();
    }
  }
  
  _renderNextCardInfo() {
    if (this._currentCardNumber < this._currentCardItems.length - 1) {
      this._currentCardNumber++;
      this._renderCardInfo();
    }
  }
  
  _renderCardInfo(item) {
    this._removeChildren(this._getContainer('decklayout-genericitems'));
    this._removeChildren(this._getContainer('decklayout-badges'));
    this._removeChildren(this._getContainer('decklayout-notes'));
    this._getContainer('decklayout-cardlabel').innerHTML = '';
    this._getContainer('decklayout-badges').style.minHeight = '3em';
    
    var item = this._currentCardItems[this._currentCardNumber];
    for (var key in item) {
      this._renderCardItem(item, key);
    }
  }
  
  _renderCardItem(item, key) {
    var fieldValue = item[key];
    var fieldType = this._layout.fieldtype[key];
    var fieldTitle = this._layout.fieldtitle[key];
    
    if (fieldType == 'dontrender' || fieldType == 'index') {
      // do nothing
      
    } else if (fieldType == 'notes') {
      this._renderCardItemNotes(fieldTitle, fieldValue);
      
    } else if (fieldType == 'label') {
      this._renderLabel(fieldValue);
      
    } else if (fieldType == 'text') {
      this._renderGenericItem(fieldTitle, fieldValue);
      
    } else if (fieldType.slice(0, 6) == 'badge_') {
      this._renderBadge(fieldType, fieldValue);
      
    } else {
      console.log('ERROR: unrecognized field type (' + fieldType + ') for field key = ' + key);
    }
  }
  
  _getContainer(className) {
    return this._elemDeckContainer.getElementsByClassName(className)[0];
  }
  
  _removeChildren(elem) {
    while (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }
  }
  
  _renderCardItemNotes(title, notes) {
    var arrNotes = notes.split('\n');
    var elemContainer = this._getContainer('decklayout-notes');
    
    var elemLabelContainer = document.createElement('div');
    elemLabelContainer.classList.add('decklayout-noteslabel');
    
    var elemLabel = document.createElement('span');
    elemLabel.innerHTML = title;
    elemLabelContainer.appendChild(elemLabel);
    
    var elemIcon = document.createElement('i');
    elemIcon.classList.add('fa');
    elemIcon.classList.add('fa-plus-square');
    elemIcon.classList.add('decklayout-notes-plus');
    elemIcon.id = 'addTitle';
    elemIcon.title = 'add note';
    elemIcon.addEventListener('click', e => this._addNote(e), false);
    elemLabelContainer.appendChild(elemIcon);
    
    elemContainer.appendChild(elemLabelContainer);
    
    var elemSelect = document.createElement('select');
    elemSelect.classList.add('decklayout-notecontrol');
    elemSelect.size = 5;
    for (var i = 0; i < arrNotes.length; i++) {
      var note = arrNotes[i];
      if (note != '') {
        var elemOption = document.createElement('option');
        elemOption.value = i;
        elemOption.innerHTML = note;
        elemSelect.appendChild(elemOption);
      }
    }
    elemSelect.addEventListener('dblclick', e => this._handleNoteDoubleClick(e), false);
    elemContainer.appendChild(elemSelect);
    elemContainer.appendChild(this._renderNotesEditingSection());
  }

  _renderNotesEditingSection() {
    var elemContainer = document.createElement('div');
    elemContainer.classList.add('decklayout-notes-editing');
   
    var elemCheck = document.createElement('i');
    elemCheck.classList.add('fa');
    elemCheck.classList.add('fa-check-square');
    elemCheck.classList.add('fa-lg');
    elemCheck.classList.add('decklayout-notes-editing-icon');
    elemContainer.appendChild(elemCheck);
    
    var elemTrash = document.createElement('i');
    elemTrash.classList.add('fa');
    elemTrash.classList.add('fa-trash');
    elemTrash.classList.add('fa-lg');
    elemTrash.classList.add('decklayout-notes-editing-icon');
    elemContainer.appendChild(elemTrash);

    return elemContainer;
  }
  
  _renderLabel(label) {
    var elemContainer = this._getContainer('decklayout-cardlabel');
    var numCards = this._currentCardItems.length;

    if (numCards > 0 && this._currentCardNumber > 0) {
      var elemPrev = document.createElement('i');
      elemPrev.classList.add('decklayout-label-control-left');
      elemPrev.classList.add('fa');
      elemPrev.classList.add('fa-angle-double-left');
      elemPrev.classList.add('fa-lg');
      elemPrev.title = 'previous card';    
      elemPrev.addEventListener('click', e => this._renderPreviousCardInfo(e), false);
      elemContainer.appendChild(elemPrev);
    }
    
    var elemLabel = document.createElement('span');
    elemLabel.innerHTML = label;
    elemContainer.appendChild(elemLabel);
    
    if (numCards > 0 && this._currentCardNumber < numCards - 1) {
      var elemNext = document.createElement('i');
      elemNext.classList.add('decklayout-label-control-right');
      elemNext.classList.add('fa');
      elemNext.classList.add('fa-angle-double-right');
      elemNext.classList.add('fa-lg');
      elemNext.title = 'next card';
      elemNext.addEventListener('click', e => this._renderNextCardInfo(e), false);
      elemContainer.appendChild(elemNext);
    }
  }
  
  _renderGenericItem(title, itemValue) {
    var elemContainer = this._getContainer('decklayout-genericitems');
    
    var elemItem = document.createElement('div');
    
    var elemLabel = document.createElement('div');
    elemLabel.classList.add('decklayout-genericitemlabel');
    elemLabel.innerHTML = title;
    elemItem.appendChild(elemLabel);
    
    var elemValue = document.createElement('span');
    elemValue.innerHTML = itemValue;
    elemItem.appendChild(elemValue);
    
    elemContainer.appendChild(elemItem);
  }
  
  _renderBadge(itemKey, itemValue) {
    var badgeName = itemKey.slice(-1 * (itemKey.length - 6));
    var elemContainer = this._getContainer('decklayout-badges');
    
    if (badgeName == 'grade') {
      var arrImages = ['badge_grade09_transparent.png', 'badge_grade10_transparent.png', 'badge_grade11_transparent.png', 'badge_grade12_transparent.png'];
      var imageindex = itemValue - 9;
      if (imageindex >= 0 && imageindex < arrImages.length) {
        elemContainer.appendChild( this._renderBadgeImage(arrImages[imageindex], 'grade ' + itemValue) );
      }
      
    } else if (badgeName == '504') {
      if (itemValue) {
        elemContainer.appendChild( this._renderBadgeImage('badge_504_transparent.png', 'has 504 plan') );
      }
      
    } else if (badgeName == 'iep') {
      if (itemValue) {
        elemContainer.appendChild( this._renderBadgeImage('badge_iep_transparent.png', 'has IEP') );
      }
      
    } else {
      console.log('ERROR: badge type (' + itemKey + ') not recognized');
    }
  }
  
  _renderBadgeImage(imgName, title) {
    var elemImage = document.createElement('img');
    elemImage.classList.add('decklayout-badges-badge');
    elemImage.src = './images/' + imgName;
    elemImage.title = title;
    
    return elemImage;
  }
  
  //--------------------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------------------
  _handleSelection() {
    this._processSelection(this._elemSelectionInput.value);
  }
    
  _doConfigure() { 
    InfoDeck._toggleHamburgerMenu();
    this._configcallback();
  }  
  
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
  
  _addNote() {
    console.log('add note');
  }
  
  _handleNoteDoubleClick(e) {
    var msg = 'note selected: ' + e.target.innerHTML;
    console.log(msg);
  }
}

/*
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
*/
