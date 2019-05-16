"use strict";
//
// TODO: 
//

var TEMP_FIELD_TYPE = {
  "last": 'dontrender',	
  "first": 'dontrender',
  "course": 'text',
  "preferred_name": 'text',
  "email" : 'text',
  "start_end": 'text',
  "grade_level": 'text',	
  "IEP_504": 'flag',	
  "mentor": 'text',	
  "notes": 'notes'
};
var TEMP_FIELD_TITLE = {
  "last": 'last',	
  "first": 'first',
  "course": 'course',
  "preferred_name": 'preferred name',
  "email" : 'text',
  "start_end": 'start/end',
  "grade_level": 'grade level',	
  "IEP_504": 'IEP/504',	
  "mentor": 'mentor',	
  "notes": 'notes'
};

//-----------------------------------------------------------------------------
// 
//-----------------------------------------------------------------------------  
function _renderDeck(container, deckinfo) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  
  for (var i = 0; i < deckinfo.length; i++) {
    container.appendChild(_renderCard(deckinfo[i]));
  }
}
  
function _renderCard(cardinfo) {
  var elemContainer = document.createElement('div');
  elemContainer.classList.add('card');
  for (var key in cardinfo) {
    elemContainer.appendChild(_renderCardInfoItem(TEMP_FIELD_TITLE[key], TEMP_FIELD_TYPE[key], cardinfo[key]));
  }
  
  return elemContainer;
}

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

