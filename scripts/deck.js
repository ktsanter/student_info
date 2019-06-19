"use strict";
//-----------------------------------------------------------------------------------
// InfoDeck class
//-----------------------------------------------------------------------------------
// TODO: adapt to work with Noah's config approach
//-----------------------------------------------------------------------------------

class InfoDeck {
  constructor() {
    this._version = '0.18';
  }
  
  //--------------------------------------------------------------------------------
  // initializing
  //    expected values in deckParams object:
  //    {
  //      title: string,
  //      version: string
  //      indexlist: array of strings, used to select cards from deck
  //      indexfield: name of field used for indexing cards
  //      layout {
  //        fieldtype: { fieldname: fieldtype, ... },
  //        badges: {badgename: {hovertext: string, values: [{value: string, imageurl: url, ...]}, ...}
  //      itemdetails: [ {fieldname: fieldval}, ...]
  //      callbacks: {
  //         menu: array of menu options e.g. [{label: 'configure', callback: callbackfunc}, ...]
  //         notes: (optional, required if notes field type is used) callback for changes to notes type field
  //         isfuzzyequal: (optional) callback to compare two strings - indexlist value and entered value
  //      }
  //    }
  //--------------------------------------------------------------------------------
  init(deckParams) {
    this._title = deckParams.title;
    this._indexlist = deckParams.indexlist;
    this._indexfield = deckParams.indexfield;
    this._layout = deckParams.layout;
    this._itemdetails = deckParams.itemdetails;
    this._callbacks = deckParams.callbacks;
    this._outerappversion = deckParams.version;
    
    this._elemDeckContainer = null;
    this._currentSubCardItems = null;
    this._currentSubCardNumber = 0;    
  }

  //--------------------------------------------------------------------------------
  // show/hide deck
  //--------------------------------------------------------------------------------
  hideDeck() {
    this._elemDeckContainer.style.display = 'none';
  }
  
  showDeck() {
    this._elemDeckContainer.style.display = 'inline-block';
  }
  
  //--------------------------------------------------------------------------------
  // rendering
  //--------------------------------------------------------------------------------
  renderDeck() {
    this._elemDeckContainer = CreateElement.createDiv(null, 'decklayout-main');
    
    var elemNav = this._renderNavigation(this._title);
    this._elemDeckContainer.appendChild(elemNav);

    this._elemDeckContainer.appendChild(this._renderSelect());
    
    this._elemDeckContainer.appendChild(this._renderAbout());
    //this._elemDeckContainer.appendChild(InfoDeck._renderClipboardCopyArea());

    var elemCardContainer = CreateElement.createDiv(null, 'decklayout-card');

    elemCardContainer.appendChild(CreateElement.createDiv('containerPicture', 'decklayout-picture'));  
    elemCardContainer.appendChild(CreateElement.createDiv('containerGenericItems', 'decklayout-genericitems'));  
    elemCardContainer.appendChild(CreateElement.createDiv('containerBadges', 'decklayout-badges'));  
    elemCardContainer.appendChild(CreateElement.createDiv('containerNotes', 'decklayout-notes'));  
    elemCardContainer.appendChild(CreateElement.createDiv('containerCardLabel', 'decklayout-cardlabel'));
    
    this._elemDeckContainer.appendChild(elemCardContainer);

    return this._elemDeckContainer;
  }
  
  _renderNavigation(title) {
    var elemContainer = CreateElement.createDiv(null, 'decklayout-topnav');
    
    var elemLink = CreateElement.createLink(null, 'decklayout-title', title, null, '#');
    elemContainer.appendChild(elemLink);
    
    var elemSubLinksContainer = CreateElement.createDiv('deckNavLinks', null);
    
    var menuOptions = this._callbacks.menu;
    for (var i = 0; i < menuOptions.length; i++) {
      var handler = function (me, f) { return function(e) {me._doMenuOption(f);}} (this, menuOptions[i].callback);
      elemLink = CreateElement.createLink(null, 'decklayout-navlink', menuOptions[i].label, null, '#', handler); 
      elemSubLinksContainer.appendChild(elemLink);
    }
    
    elemSubLinksContainer.appendChild(CreateElement.createHR(null, null));
    elemSubLinksContainer.appendChild(CreateElement.createLink(null, 'decklayout-navigation', 'about', null, '#', e => InfoDeck._doAbout(e)));
    elemContainer.appendChild(elemSubLinksContainer);
    
    elemLink = CreateElement.createLink('hamburger', 'icon', null, null, '#', e => InfoDeck._toggleHamburgerMenu());
    elemLink.appendChild(CreateElement.createIcon(null, 'fa fa-bars'));
    elemContainer.appendChild(elemLink);
    
    return elemContainer;     
  }
  
  _renderSelect() {
    var elemContainer = CreateElement.createDiv(null, 'decklayout-select-container');

    var fuzzySelect = new FuzzyInputControl(
      this._indexlist, 
      e => this._handleSelection(e), 
      this._callbacks.isfuzzyequal
    );
    this._fuzzyInputControl = fuzzySelect;
    var elemFuzzySelect = fuzzySelect.render();
    elemFuzzySelect.classList.add('decklayout-select-control');
    elemContainer.appendChild(elemFuzzySelect);

    elemContainer.appendChild(CreateElement.createDiv('copiedMessage', 'decklayout-select-copied'));
    
    return elemContainer;
  } 

  _renderAbout() {
    var sOuterAppVersion = '<span class="decklayout-about-version">' + '(v' + this._outerappversion + ')</span>';
    var sinfoDeckVersion = '<span class="decklayout-about-version">' + 'v' + this._version + '</span>';
    var sFuzzyInputControlVersion = '<span class="decklayout-about-version">' + 'v' + this._fuzzyInputControl.version() + '</span>';
    var details = [
      'author: Kevin Santer', 
      'contact: ktsanter@gmail.com',
      'uses: ' + 'InfoDeck ' + sinfoDeckVersion + ', ' + 'FuzzyInputControl ' + sFuzzyInputControlVersion
    ];
    var elemContainer = CreateElement.createDiv('infoDeckAbout', 'decklayout-about');
    
    var elemTitle = CreateElement.createDiv(null, null);
    elemTitle.appendChild(CreateElement.createDiv(null, 'decklayout-about-label', 'About <em>' + this._title + '</em> ' + sOuterAppVersion));
    elemTitle.appendChild(CreateElement.createIcon(null, 'fas fa-times decklayout-about-close', 'close "about"', e => this._handleAboutCloseClick(e)));
    elemContainer.appendChild(elemTitle);
    
    var elemDetailContainer = CreateElement.createDiv(null, null);
    for (var i = 0; i < details.length; i++) {
      var elemDetail = CreateElement.createDiv('', 'deck-layout-about-detail', details[i]);
      elemDetail.innerHTML = details[i];
      elemDetailContainer.appendChild(elemDetail);      
    }
    elemContainer.appendChild(elemDetailContainer);
        
    return elemContainer;
  }
    
  //--------------------------------------------------------------------------
  // render card info
  //--------------------------------------------------------------------------
  _processSelection(indexvalue) {
    this._currentSubCardItems = this._getMatchingItems(indexvalue);
    if (this._currentSubCardItems.length == 0) {
      console.log('ERROR: internal error - failed to find item details for ' + indexvalue);
      return;
    }
        
    this._currentSubCardNumber = 0;
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

  _renderPreviousSubCardInfo() {
    if (this._currentSubCardNumber > 0) {
      this._currentSubCardNumber--;
      this._renderCardInfo();
    }
  }
  
  _rnderNextSubCardInfo() {
    if (this._currentSubCardNumber < this._currentSubCardItems.length - 1) {
      this._currentSubCardNumber++;
      this._renderCardInfo();
    }
  }
  
  _renderCardInfo() {
    this._removeChildren(this._getContainer('decklayout-genericitems'));
    this._removeChildren(this._getContainer('decklayout-badges'));
    this._removeChildren(this._getContainer('decklayout-notes'));
    this._getContainer('decklayout-cardlabel').innerHTML = '';
    this._getContainer('decklayout-badges').style.minHeight = '3em';
    
    var items = this._currentSubCardItems[this._currentSubCardNumber];
    var badges = this._layout.badges;
    var arrItemKeys = []
    for (var key in items) {
      var fieldType = this._layout.fieldtype[key];
      var badgeInfo = this._layout.badges[fieldType.replace(/\(.*\)/, '')];
      var order = 0;
      if (badgeInfo) order = badgeInfo.order;
      arrItemKeys.push({key: key, order: order});
    }
    
    arrItemKeys = arrItemKeys.sort(
      function (a, b) {
        var result = 0;
        if (a.order > b.order) result = 1;
        if (a.order < b.order) result = -1;
        if (result == 0) result = a.key.localeCompare(b.key);
        return result;        
      }
    );
    
    for (var i = 0; i < arrItemKeys.length; i++) {
      this._renderCardItem(items, arrItemKeys[i].key);
    }
  }
  
  _renderCardItem(item, key) {
    var fieldValue = item[key];
    var fieldType = this._layout.fieldtype[key];
    var fieldTitle = key; 
    
    if (fieldType == 'dontrender' || fieldType == 'index') {
      // do nothing
      
    } else if (fieldType == 'notes') {
      this._renderCardItemNotes(fieldTitle, fieldValue);
      
    } else if (fieldType == 'label') {
      this._renderLabel(fieldValue);
      
    } else if (fieldType == 'text') {
      this._renderGenericItem(fieldTitle, fieldValue);
      
    } else if (fieldType.slice(0, 6) == 'badge_') {
      this._renderBadge(fieldType, fieldValue, key);
      
    } else if (fieldType == 'date') {
      this._renderGenericItem(fieldTitle, DateTime.formatDate(fieldValue));
      
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
    
    var elemLabelContainer = CreateElement.createDiv(null, 'decklayout-noteslabel');
    elemLabelContainer.appendChild(CreateElement.createSpan(null, null, title));
    elemLabelContainer.appendChild(CreateElement.createIcon('addTitle', 'fa fa-plus decklayout-notes-plus', 'add note', e => this._handleAddNote(e)));
    elemContainer.appendChild(elemLabelContainer);
  
    var elemSelect = CreateElement.createSelect('notesSelect', 'decklayout-notecontrol');  
    elemSelect.size = 5;
    for (var i = 0; i < arrNotes.length; i++) {
      var note = arrNotes[i];
      if (note != '') {
        elemSelect.appendChild(CreateElement.createOption(null, null, i, note.replace('|', ': ')));
      }
    }
    elemSelect.addEventListener('dblclick', e => this._handleNoteDoubleClick(e), false);
    elemContainer.appendChild(elemSelect);
    
    elemContainer.appendChild(this._renderNotesEditingSection());
  }

  _renderNotesEditingSection() {
    var elemContainer = CreateElement.createDiv('notesEditing', 'decklayout-notes-editing');
    
    var elemWorkingNoteIndex = CreateElement.createDiv('notesEditingWorkingIndex', null, '-1');
    elemWorkingNoteIndex.style.display = 'none';
    elemContainer.appendChild(elemWorkingNoteIndex);
    
    elemContainer.appendChild(CreateElement.createDiv('notesEditingDate', 'decklayout-notes-editing-date', '02/14/2019'));
    
    elemContainer.appendChild(CreateElement.createIcon(null, 'fa fa-check decklayout-notes-editing-icon', 'save changes', e => this._handleEditingCheckClick(e)));
    elemContainer.appendChild(CreateElement.createIcon(null, 'fas fa-times decklayout-notes-editing-icon', 'discard changes', e => this._handleEditingDiscardClick(e)));
    elemContainer.appendChild(CreateElement.createIcon('deleteNoteIcon', 'fa fa-trash decklayout-notes-editing-icon', 'delete note', e => this._handleEditingTrashClick(e)));

    var elemInputContainer = CreateElement.createDiv(null, null);
    elemInputContainer.appendChild(CreateElement.createTextArea('notesEditingInput', 'decklayout-notes-editing-input'));

    elemContainer.appendChild(elemInputContainer);

    return elemContainer;
  }
  
  _renderLabel(label) {
    var elemContainer = this._getContainer('decklayout-cardlabel');
    var numCards = this._currentSubCardItems.length;

    if (numCards > 0 && this._currentSubCardNumber > 0) {
      elemContainer.appendChild(CreateElement.createIcon(null, 'fa fa-angle-double-left decklayout-label-control-left', 'previous card', e => this._renderPreviousSubCardInfo(e)));
    }
    
    elemContainer.appendChild(CreateElement.createSpan(null, null, label));
    
    if (numCards > 0 && this._currentSubCardNumber < numCards - 1) {
      elemContainer.appendChild(CreateElement.createIcon(null, 'fa fa-angle-double-right decklayout-label-control-right', 'next card', e => this._rnderNextSubCardInfo(e)));
    }
  }
  
  _renderGenericItem(title, itemValue) {
    var elemContainer = this._getContainer('decklayout-genericitems');
    
    var elemItem = CreateElement.createDiv(null, null);
    
    var elemLabel = CreateElement.createDiv(null, 'decklayout-genericitemlabel', title);
    elemItem.appendChild(elemLabel);
    
    var elemValue = CreateElement.createDiv(null, 'decklayout-genericitemvalue', itemValue);
    elemValue.addEventListener('dblclick', e => this._handleGenericItemDoubleClick(e), false);
    elemItem.appendChild(elemValue);
    
    elemContainer.appendChild(elemItem);
  }
  
  _renderBadge(itemKey, itemValue, fieldName) {
    var itemKeyParam = itemKey.match(/\(*.\)/);
    if (itemKeyParam != null) {
      itemKey = itemKey.replace(itemKeyParam[0], '');
      itemKeyParam = itemKeyParam[0].slice(1, -1);
    } 

    if (!(itemKey in this._layout.badges)) {
      console.log('ERROR: unrecognized badge type "' + itemKey + '"');
      return;
    }  
    var badgeInfo = this._layout.badges[itemKey];
    var elemContainer = this._getContainer('decklayout-badges');
    var badgeDisplayInfo = null;

    for (var i = 0; i < badgeInfo.values.length && badgeDisplayInfo == null; i++) {
      var matchValInfo = badgeInfo.values[i];

      if (matchValInfo.value == '*' && itemValue != '') {
        badgeDisplayInfo = matchValInfo.display;
        
      } else if (matchValInfo.value == '[late>]') {
        if (DateTime.isValidDate(itemValue)) {
          if (DateTime.compareDateToNow(itemValue) < 0) {
            badgeDisplayInfo = matchValInfo.display;
            badgeInfo.hovertext = fieldName + ' is late (due [date])';
          }
        } 
        
      } else if (matchValInfo.value == '[late=]') {
        if (DateTime.isValidDate(itemValue)) {
          if (DateTime.compareDateToNow(itemValue) == 0) {
            badgeDisplayInfo = matchValInfo.display;
            badgeInfo.hovertext = fieldName + ' is due today: [date]';
          }
        } 

      } else if (matchValInfo.value == '[window]') {
        if (DateTime.isValidDate(itemValue)) {
          if (DateTime.compareDateToNow(itemValue, parseInt(itemKeyParam)) == 0) {
            badgeDisplayInfo = matchValInfo.display;
            badgeInfo.hovertext = fieldName + ' is due soon: [date]';
          }
        } 

      } else if (matchValInfo.value == itemValue) {
        badgeDisplayInfo = matchValInfo.display;
        
      } else if (matchValInfo.value == '[else]') {
        badgeDisplayInfo = matchValInfo.display;
      }
    }
        
    if (badgeDisplayInfo == null) {
      console.log('ERROR: no match for badge type "' + itemKey + '" value=' + itemValue);  
      
    } else if (!this._ignoreBadgeImage(badgeDisplayInfo.type)) {
      var elemImage = null;      
      var elemImage = this._renderBadgeImage(badgeDisplayInfo.type, badgeDisplayInfo.data, badgeInfo.hovertext, itemValue, badgeDisplayInfo.color);
        
      if (elemImage == null) {
        console.log('ERROR: unable to render image for badge type "' + itemKey + '" value=' + itemValue);
      } else {
        elemContainer.appendChild( elemImage );
      }
    }
  }
  
  _renderBadgeImage(badgetype, badgeinfo, title, value, badgecolor) {
    var elemImageContainer = CreateElement.createDiv(null, null);

    var hoverText = title;
    hoverText = hoverText.replace(/\[value\]/g, value);
    hoverText = hoverText.replace(/\[date\]/g, DateTime.formatDate(value));
    
    elemImageContainer.title = hoverText;

    if (badgetype == 'image') {
      elemImageContainer.classList.add('decklayout-badges-badgeimage');
      elemImageContainer.appendChild(CreateElement.createImage(null, null, badgeinfo, '', null, e => this._handleBadgeDoubleClick(e)));
    
    } else if (badgetype == 'icon') {
      elemImageContainer.classList.add('decklayout-badges-badgeicon');
      elemImageContainer.appendChild(CreateElement.createIcon(null, 'fa-lg ' + badgeinfo, null, null, e => this._handleBadgeDoubleClick(e)));
      
    } else if (badgetype == 'unicode') {
      elemImageContainer.classList.add('decklayout-badges-badgeunicode');
      var elemUni = CreateElement.createDiv(null, null, String.fromCodePoint(...badgeinfo));
      elemUni.addEventListener('dblclick', e => this._handleBadgeDoubleClick(e), false);
      elemImageContainer.appendChild(elemUni);
    }

    if (badgecolor && badgecolor != null && badgecolor != '') {
      elemImageContainer.style.color = badgecolor;
    }
    
    return elemImageContainer;
  }
      
  _ignoreBadgeImage(badgeinfo) {
    return (badgeinfo.slice(0,1) == '[' && badgeinfo.slice(-1) == ']');
  }
    
  //--------------------------------------------------------------------------
  // notes editing
  //--------------------------------------------------------------------------
  _beginNotesEditing(noteIndex, initialNote) {
    document.getElementById('notesSelect').disabled = true;
    document.getElementById('notesEditing').style.display = 'block';
    
    var elemDeleteIcon = document.getElementById('deleteNoteIcon');
    if (noteIndex < document.getElementById('notesSelect').length) {
      elemDeleteIcon.style.display = 'block';
    } else {
      elemDeleteIcon.style.display = 'none';
    }
    
    document.getElementById('notesEditingWorkingIndex').innerHTML = noteIndex;
    
    var noteDate = DateTime.formatDate(Date.now());
    var noteText = '';
    if (initialNote != '') {
      var arrNote = initialNote.split(': ');
      if (arrNote.length < 2) {
        noteDate = 'undated';
        noteText = initialNote;
      } else {
        noteDate = arrNote[0].trim();
        noteText = arrNote[1].trim();
      }
    }
    document.getElementById('notesEditingDate').innerHTML = noteDate;
    document.getElementById('notesEditingInput').value = noteText;
  }
  
  _endNotesEditing(saveNote) {
    var noteIndex = document.getElementById('notesEditingWorkingIndex').innerHTML
    document.getElementById('notesSelect').disabled = false;
    document.getElementById('notesEditing').style.display = 'none';
    
    if (saveNote) {
      var noteDate = document.getElementById('notesEditingDate').innerHTML;
      var noteText = document.getElementById('notesEditingInput').value;
      var fullNoteText = noteDate + '|' + noteText;
      
      var newNotes = this._modifyNotes(fullNoteText, noteIndex);
      this._currentSubCardItems[this._currentSubCardNumber].notes = newNotes;
      
      var cardNumber = this._currentSubCardNumber;
      var deckIndexVal = this._currentSubCardItems[cardNumber][this._indexfield];
      this._callbacks.notes({deckindexval: deckIndexVal, cardnumber: cardNumber, notes: newNotes});
      this._renderCardInfo();
    }
  }
  
  _modifyNotes(noteText, noteIndex) {
     var origNotes = this._currentSubCardItems[this._currentSubCardNumber].notes;
     var arrNotes = origNotes.split('\n');
     if (noteIndex < arrNotes.length) {
       arrNotes[noteIndex] = noteText;
     } else {
       arrNotes = arrNotes.concat([noteText]);
     }
     return arrNotes.join('\n');
  }
  
  _deleteNote() {
    var msg = 'This note will be permanently deleted\n\nPress OK to confirm';
    if (confirm(msg)) {
      var cardNumber = this._currentSubCardNumber;
      var arrOrigNotes = this._currentSubCardItems[cardNumber].notes.split('\n');
      var noteIndex = document.getElementById('notesEditingWorkingIndex').innerHTML;      
      var arrNewNotes = [];
      for (var i = 0; i < arrOrigNotes.length; i++) {
        if (i != noteIndex ) arrNewNotes = arrNewNotes.concat([arrOrigNotes[i]]);
      }
      var newNotes = arrNewNotes.join('\n');
      this._currentSubCardItems[cardNumber].notes = newNotes;
      
      document.getElementById('notesSelect').disabled = false;
      document.getElementById('notesEditing').style.display = 'none';

      this._renderCardInfo();
      
      var deckIndexVal = this._currentSubCardItems[cardNumber][this._indexfield];
      this._callbacks.notes({deckindexval: deckIndexVal, cardnumber: cardNumber, notes: newNotes});
    }
  }
      
  //--------------------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------------------
  _handleSelection(selectedValue) {
    InfoDeck._setCopiedMessage('');
    this._processSelection(selectedValue);
  }
    
  static _doAbout() { 
    InfoDeck._setCopiedMessage('');
    document.getElementById('deckNavLinks').style.display = 'none';
    document.getElementById('infoDeckAbout').style.display = 'block';
  }

  _doMenuOption(callback) {
    InfoDeck._setCopiedMessage('');
    InfoDeck._toggleHamburgerMenu();
    callback();
  }
  
  _handleAboutCloseClick() {
    InfoDeck._setCopiedMessage('');
    document.getElementById('infoDeckAbout').style.display = 'none';
  }
  
  static _toggleHamburgerMenu() {
    InfoDeck._setCopiedMessage('');
    InfoDeck._toggleDisplay(document.getElementById("deckNavLinks"));
  }
  
  static _toggleDisplay(elem) {
    if (elem.style.display === "block") {
      elem.style.display = "none";
    } else {
      elem.style.display = "block";
    }
  }

  _handleAddNote() {
    InfoDeck._setCopiedMessage('');
    if (document.getElementById('notesSelect').disabled) return;
    this._beginNotesEditing(document.getElementById('notesSelect').length, '');
  }
  
  _handleNoteDoubleClick(e) {
    InfoDeck._setCopiedMessage('');
    if (document.getElementById('notesSelect').disabled) return;
    var elem = document.getElementById("notesSelect");
    if (elem.selectedIndex == -1) return;
    var noteText = elem.options[elem.selectedIndex].text;
    this._beginNotesEditing(elem.selectedIndex, noteText);
  }

  _handleEditingCheckClick() {
    InfoDeck._setCopiedMessage('');
    this._endNotesEditing(true);
  }
  
  _handleEditingDiscardClick() {
    InfoDeck._setCopiedMessage('');
    this._endNotesEditing(false);
  }
  
  _handleEditingTrashClick() {
    InfoDeck._setCopiedMessage('');
    this._deleteNote();
  }
  
  _handleGenericItemDoubleClick(e) {
    this._copyToClipboard(e.target.innerHTML);
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    } else if (document.selection) {
      document.selection.empty();
    }    
  }
  
  _handleBadgeDoubleClick(e) {
    this._copyToClipboard(e.target.parentNode.title);
  }
  
  //---------------------------------------
  // clipboard functions
  //----------------------------------------
  _copyToClipboard(txt) {
    if (!this._elemDeckContainer._clipboard) this._elemDeckContainer._clipboard = new ClipboardCopy(this._elemDeckContainer, 'plain');

    this._elemDeckContainer._clipboard.copyToClipboard(txt);
    
    InfoDeck._setCopiedMessage('copied');
	}	
    
  static _setCopiedMessage(msg) {
    var elemCopiedMessage = document.getElementById('copiedMessage');
    elemCopiedMessage.innerHTML = msg;
    if (msg == '') {
      elemCopiedMessage.style.display = 'none';
    } else {
      elemCopiedMessage.style.display = 'inline-block';
    }
  }
  
  //---------------------------------------
  // utility functions
  //----------------------------------------

}
