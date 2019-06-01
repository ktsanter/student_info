"use strict";
//-----------------------------------------------------------------------------------
// InfoDeck class
//-----------------------------------------------------------------------------------
// TODO: figure out badge ordering
// TODO: add progress check badges, like early grade with windowed dates
// TODO: custom callbacks for addional menu options ?
// TODO: menu spacer options ?
// TODO: new date window images ala https://drive.google.com/open?id=1_vgLe_kj7AgpmOJh0sH0mzzIMga8GueW
// TODO: adapt to work with Noah's config approach
//-----------------------------------------------------------------------------------

class InfoDeck {
  constructor() {
    this._version = '0.13';
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
  //         config: func - callback for "configuration" menu option
  //         opendatasource: (optional) callback for "open data source" menu option
  //         notes: (optional, required if notes field type is used) callback for changes to notes type field
  //         isfuzzyequal: (optional) callback to compare two strings (indexlist value and entered value)
  //         help: (optional) callback for "help" menu option
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
    this._elemDeckContainer = document.createElement('div');
    this._elemDeckContainer.classList.add('decklayout-main');
    
    var elemNav = this._renderNavigation(this._title);
    this._elemDeckContainer.appendChild(elemNav);

    this._elemDeckContainer.appendChild(this._renderSelect());
    
    this._elemDeckContainer.appendChild(this._renderAbout());
    this._elemDeckContainer.appendChild(InfoDeck._renderClipboardCopyArea());
    
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
      {id: 'menuOpenDataSource',  label: 'open data source', depends: this._callbacks.opendatasource},
      {id: 'menuAbout', label: 'about'},
      {id: 'menuHelp', label: 'help', depends: this._callbacks.help}
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
      var dependencySatisfied = true;
      if (navLinks[i].hasOwnProperty('depends') && !navLinks[i].depends) {
        dependencySatisfied = false;
      }

      if (dependencySatisfied) {
        elemLink = document.createElement('a');
        elemLink.classList.add('decklayout-navlink');
        elemLink.id = navLinks[i].id;
        elemLink.innerHTML = navLinks[i].label;
      
        if (i == 0) { elemLink.addEventListener('click', e => this._doConfigure(e), false); }
        else if (i == 1) { elemLink.addEventListener('click', e => this._doOpenDataSource(e), false); }
        else if (i == 2) { elemLink.addEventListener('click', e => InfoDeck._doAbout(e), false); }
        else if (i == 3) { elemLink.addEventListener('click', e => this._doHelp(e), false); }
      }
      elemSubLinksContainer.appendChild(elemLink);
    }
    elemContainer.appendChild(elemSubLinksContainer);
    
    elemLink = document.createElement('a');
    elemLink.classList.add('icon');
    elemLink.href = "#";
    elemLink.id = 'hamburger';
    elemLink.addEventListener('click', e => InfoDeck._toggleHamburgerMenu(), false);
    elemLink.appendChild( this._renderIcon(null, 'fa fa-bars', null) );
    elemContainer.appendChild(elemLink);
    
    return elemContainer;     
  }
  
  _renderSelect() {
    var elemContainer = document.createElement('div');
    elemContainer.classList.add('decklayout-select-container');

    var fuzzySelect = new FuzzyInputControl(
      this._indexlist, 
      e => this._handleSelection(e), 
      this._callbacks.isfuzzyequal
    );
    this._fuzzyInputControl = fuzzySelect;
    var elemFuzzySelect = fuzzySelect.render();
    elemFuzzySelect.classList.add('decklayout-select-control');
    elemContainer.appendChild(elemFuzzySelect);
    
    var elemCopiedContainer = document.createElement('div');
    elemCopiedContainer.classList.add('decklayout-select-copied');
    elemCopiedContainer.id = 'copiedMessage';
    elemCopiedContainer.innerHTML = '';
    elemContainer.appendChild(elemCopiedContainer);    

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
    var elemContainer = InfoDeck._renderContainer('infoDeckAbout', 'decklayout-about');
    
    var elemTitle = document.createElement('div');
    var elemLabel = document.createElement('div');
    elemLabel.classList.add('decklayout-about-label');
    elemLabel.innerHTML = 'About <em>' + this._title + '</em> ' + sOuterAppVersion;
    elemTitle.appendChild(elemLabel);

    var elemClose = this._renderIcon(null, 'fas fa-times fa-lg decklayout-about-close', 'close "about"');
    elemClose.addEventListener('click', e => this._handleAboutCloseClick(e), false);
    elemTitle.appendChild(elemClose);
    elemContainer.appendChild(elemTitle);
    
    var elemDetailContainer = document.createElement('div');
    for (var i = 0; i < details.length; i++) {
      var elemDetail = InfoDeck._renderContainer('', 'deck-layout-about-detail');
      elemDetail.innerHTML = details[i];
      elemDetailContainer.appendChild(elemDetail);      
    }
    elemContainer.appendChild(elemDetailContainer);
        
    return elemContainer;
  }

  
  static _renderContainer(id, className) {
    var elemContainer = document.createElement('div');
    elemContainer.id = id;
    if (className != '') {
      elemContainer.classList.add(className);
    }
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
    
    var item = this._currentSubCardItems[this._currentSubCardNumber];
    for (var key in item) {
      this._renderCardItem(item, key);
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
      this._renderGenericItem(fieldTitle, InfoDeck._formatDate(fieldValue));
      
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
    
    var elemIcon = this._renderIcon('addTitle', 'fa fa-plus decklayout-notes-plus', 'add note');
    elemIcon.addEventListener('click', e => this._handleAddNote(e), false);
    elemLabelContainer.appendChild(elemIcon);
    
    elemContainer.appendChild(elemLabelContainer);
    
    var elemSelect = document.createElement('select');
    elemSelect.classList.add('decklayout-notecontrol');
    elemSelect.id = 'notesSelect';
    elemSelect.size = 5;
    for (var i = 0; i < arrNotes.length; i++) {
      var note = arrNotes[i];
      if (note != '') {
        var elemOption = document.createElement('option');
        elemOption.value = i;
        elemOption.innerHTML = note.replace('|', ': ');
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
    elemContainer.id = 'notesEditing';
   
    var elemWorkingNoteIndex = document.createElement('div');
    elemWorkingNoteIndex.style.display = 'none';
    elemWorkingNoteIndex.id = 'notesEditingWorkingIndex';
    elemWorkingNoteIndex.innerHTML = '-1';
    elemContainer.appendChild(elemWorkingNoteIndex);
    
    var elemDate = document.createElement('div');
    elemDate.classList.add('decklayout-notes-editing-date');
    elemDate.id = 'notesEditingDate';
    elemDate.innerHTML = '02/14/2019';
    elemContainer.appendChild(elemDate);
    
    var elemCheck = this._renderIcon(null, 'fa fa-check fa-lg decklayout-notes-editing-icon', 'save changes');
    elemCheck.addEventListener('click', e => this._handleEditingCheckClick(e), false);
    elemContainer.appendChild(elemCheck);

    var elemDiscard = this._renderIcon(null, 'fas fa-times fa-lg decklayout-notes-editing-icon', 'discard changes');
    elemDiscard.addEventListener('click', e => this._handleEditingDiscardClick(e), false);
    elemContainer.appendChild(elemDiscard);
    
    var elemTrash = this._renderIcon('deleteNoteIcon', 'fa fa-trash fa-lg decklayout-notes-editing-icon', 'delete note');
    elemTrash.addEventListener('click', e => this._handleEditingTrashClick(e), false);
    elemContainer.appendChild(elemTrash);

    var elemInputContainer = document.createElement('div');
    var elemInput = document.createElement('textarea');
    elemInput.classList.add('decklayout-notes-editing-input');
    elemInput.id = 'notesEditingInput';
    elemInputContainer.appendChild(elemInput);
    elemContainer.appendChild(elemInputContainer);

    return elemContainer;
  }
  
  _renderLabel(label) {
    var elemContainer = this._getContainer('decklayout-cardlabel');
    var numCards = this._currentSubCardItems.length;

    if (numCards > 0 && this._currentSubCardNumber > 0) {
      var elemPrev = this._renderIcon(null, 'fa fa-angle-double-left fa-lg decklayout-label-control-left', 'previous card');      
      elemPrev.addEventListener('click', e => this._renderPreviousSubCardInfo(e), false);
      elemContainer.appendChild(elemPrev);
    }
    
    var elemLabel = document.createElement('span');
    elemLabel.innerHTML = label;
    elemContainer.appendChild(elemLabel);
    
    if (numCards > 0 && this._currentSubCardNumber < numCards - 1) {
      var elemNext = this._renderIcon(null, 'fa fa-angle-double-right fa-lg decklayout-label-control-right', 'next card');
      elemNext.addEventListener('click', e => this._rnderNextSubCardInfo(e), false);
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
    
    var elemValue = document.createElement('div');
    elemValue.classList.add('decklayout-genericitemvalue');
    elemValue.innerHTML = itemValue;
    elemItem.appendChild(elemValue);
    
    elemValue.addEventListener('dblclick', e => this._handleGenericItemDoubleClick(e), false);
    
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
        if (InfoDeck._isValidDate(itemValue)) {
          if (InfoDeck._compareDateToNow(itemValue) < 0) {
            badgeDisplayInfo = matchValInfo.display;
            badgeInfo.hovertext = fieldName + ' is late (due [date])';
          }
        } 
        
      } else if (matchValInfo.value == '[late=]') {
        if (InfoDeck._isValidDate(itemValue)) {
          if (InfoDeck._compareDateToNow(itemValue) == 0) {
            badgeDisplayInfo = matchValInfo.display;
            badgeInfo.hovertext = fieldName + ' is due today: [date]';
          }
        } 

      } else if (matchValInfo.value == '[window]') {
        if (InfoDeck._isValidDate(itemValue)) {
          console.log(itemKeyParam);
          if (InfoDeck._compareDateToNow(itemValue, parseInt(itemKeyParam)) == 0) {
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
    var elemImageContainer = document.createElement('div');

    var hoverText = title;
    hoverText = hoverText.replace(/\[value\]/g, value);
    hoverText = hoverText.replace(/\[date\]/g, InfoDeck._formatDate(value));
    
    elemImageContainer.title = hoverText;

    if (badgetype == 'image') {
      elemImageContainer.classList.add('decklayout-badges-badgeimage');
      var elemImage = document.createElement('img');
      elemImage.src = badgeinfo;
      elemImage.addEventListener('dblclick', e => this._handleBadgeDoubleClick(e), false);
      elemImageContainer.appendChild(elemImage);
    
    } else if (badgetype == 'icon') {
      elemImageContainer.classList.add('decklayout-badges-badgeicon');
      var classList = 'fa-lg ' + badgeinfo;
      var elemIcon = this._renderIcon(null, classList, null);
      elemIcon.addEventListener('dblclick', e => this._handleBadgeDoubleClick(e), false);
      elemImageContainer.appendChild(elemIcon);
      
    } else if (badgetype == 'unicode') {
      elemImageContainer.classList.add('decklayout-badges-badgeunicode');
      var elemUni = document.createElement('div');
      elemUni.innerHTML = String.fromCodePoint(...badgeinfo);
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

  _renderIcon(id, classList, title) {
    var elemIcon = document.createElement('i');
    if (id != null && id != '') elemIcon.id = id;
    var arrClasses = classList.split(' ');
    for (var i = 0; i < arrClasses.length; i++) {
      elemIcon.classList.add(arrClasses[i]);
    }
    if (title != null && title != '') elemIcon.title = title;
    
    return elemIcon;
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
    
    var noteDate = InfoDeck._formatDate(Date.now());
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
    
  _doConfigure() { 
    InfoDeck._setCopiedMessage('');
    InfoDeck._toggleHamburgerMenu();
    this._callbacks.config();
  }  
  
  _doOpenDataSource() { 
    InfoDeck._setCopiedMessage('');
    InfoDeck._toggleHamburgerMenu();
    this._callbacks.opendatasource();
  }
  
  static _doAbout() { 
    InfoDeck._setCopiedMessage('');
    document.getElementById('deckNavLinks').style.display = 'none';
    document.getElementById('infoDeckAbout').style.display = 'block';
  }
  
  _doHelp() { 
    InfoDeck._setCopiedMessage('');
    InfoDeck._toggleHamburgerMenu();
    this._callbacks.help();
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
    InfoDeck._copyToClipboard(e.target.innerHTML);
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    } else if (document.selection) {
      document.selection.empty();
    }    
  }
  
  _handleBadgeDoubleClick(e) {
    InfoDeck._copyToClipboard(e.target.parentNode.title);
  }
  
  //---------------------------------------
  // clipboard functions
  //----------------------------------------
  static _copyToClipboard(txt) {
		var clipboardElement = document.getElementById('text_for_clipboard');
		clipboardElement.value = txt;
		clipboardElement.style.display = 'block';
		clipboardElement.select();
		document.execCommand("Copy");
		clipboardElement.selectionEnd = clipboardElement.selectionStart;
		clipboardElement.style.display = 'none';
    InfoDeck._setCopiedMessage('copied');
	}	
  
  static _renderClipboardCopyArea() {
    var elemClipboardArea = document.createElement('textarea');
    elemClipboardArea.id = 'text_for_clipboard';
    elemClipboardArea.style.display = 'none';
    return elemClipboardArea;
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
  static _isValidDate(str) {
    var d = new Date(str);
    return !isNaN(d);
  }
  
  static _formatDate(theDate) {
    var formattedDate = theDate;
    
    if (InfoDeck._isValidDate(theDate)) {
      formattedDate = '';
      if (theDate != null & theDate != '') {
        var objDate = new Date(theDate);
        var day = ("00" + objDate.getDate()).slice(-2);
        var month = ("00" + (objDate.getMonth() + 1)).slice(-2);
        var year = (objDate.getFullYear() + '').slice(-2);
        formattedDate = month + "/" + day + "/" + year;
      }
    }
    
    return formattedDate;
  }
  
  static _compareDateToNow(date, daysInWindow) {
    const _MS_PER_DAY = 1000 * 60 * 60 * 24;

    var parsedDate = new Date(Date.parse(date));
    var now = new Date();
    
    var utc1 = Date.UTC(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
    var utc2 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

    var daysLate = Math.floor((utc2 - utc1) / _MS_PER_DAY);
    if (!daysInWindow || daysInWindow < 0) daysInWindow = 0;
    
    var result = 1;
    if (daysLate > 0) {
      result = -1;
    } else if ((daysLate + daysInWindow) >= 0) {
      result = 0;
    }
       
    return result;
  }
}
