"use strict";
//-----------------------------------------------------------------------------------
// Student infoDeck Chrome extension
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------
class CreateElement {
  constructor () {
    this._version = '0.01';
  }
  
  static _createDiv(id, classList, html, handler) {
    var elem = document.createElement('div');
    if (id && id != '') elem.id = id;
    CreateElement._addClassList(elem, classList);
    if (html != null) elem.innerHTML = html;
    
    return elem;
  }
  
  static _createSpan(id, classList, html) {
    var elem = document.createElement('span');
    if (id && id != '') elem.id = id;
    CreateElement._addClassList(elem, classList);
    if (html != null) elem.innerHTML = html;
    
    return elem;
  }
  
  static _createImage(id, classList, src, title, handler, dblclickhandler) {
    var elem = document.createElement('img');
    if (id && id != '') elem.id = id;
    CreateElement._addClassList(elem, classList);
    if (src != null) elem.src = src;
    if (title) elem.title = title;
    if (handler) elem.addEventListener('click', handler, false);
    if (dblclickhandler) elem.addEventListener('dblclick', dblclickhandler, false);
    
    return elem;
  }
    
  static _createIcon(id, classList, title, handler, dblclickhandler) {
    var elem = document.createElement('i');
    if (id && id != '') elem.id = id;
    CreateElement._addClassList(elem, classList);
    if (title) elem.title = title;
    if (handler) elem.addEventListener('click', handler, false);
    if (dblclickhandler) elem.addEventListener('dblclick', dblclickhandler, false);
    
    return elem;
  }

  static _createButton(id, classList, label, title, handler) {
    var elem = document.createElement('button');
    if (id && id != '') elem.id = id;
    CreateElement._addClassList(elem, classList);
    elem.innerHTML = label;
    elem.title = title;
    elem.addEventListener('click', e => handler(e), false);
    
    return elem;
  }
  
  static _createLink(id, classList, title, href, handler) {
    var elem = document.createElement('a');
    if (id && id != '') elem.id = id;
    CreateElement._addClassList(elem, classList);
    elem.innerHTML = title;
    elem.href = href;
    if (handler) elem.addEventListener('click', handler, false);
    
    return elem;
  }

  static _createLink(id, classList, title, href, handler) {
    var elem = document.createElement('a');
    if (id && id != '') elem.id = id;
    CreateElement._addClassList(elem, classList);
    elem.innerHTML = title;
    if (href) elem.href = href;
    if (handler) elem.addEventListener('click', handler, false);
    
    return elem;
  }

  static _createTextArea(id, classList) {
    var elem = document.createElement('textarea');
    if (id && id != '') elem.id = id;
    CreateElement._addClassList(elem, classList);
    
    return elem;
  }
  
  static _createHR(id, classList) {
    var elem = document.createElement('hr');
    if (id && id != '') elem.id = id;
    CreateElement._addClassList(elem, classList);
    
    return elem;
  }

  static _createBR(id, classList) {
    var elem = document.createElement('br');
    if (id && id != '') elem.id = id;
    CreateElement._addClassList(elem, classList);
    
    return elem;
  }

  static _createSelect(id, classList) {
    var elem = document.createElement('select');
    if (id && id != '') elem.id = id;
    CreateElement._addClassList(elem, classList);
    
    return elem;
  }
  
   static _createOption(id, classList, value, label) {
    var elem = document.createElement('option');
    if (id && id != '') elem.id = id;
    CreateElement._addClassList(elem, classList);
    elem.value = value;
    elem.innerHTML = label;
    
    return elem;
  }
   
  static _createCheckbox(id, classList, groupName, buttonValue, displayValue, checked, handler) {
    var container = CreateElement._createSpan(null, null);
    
    var elem = document.createElement('input');
    CreateElement._addClassList(elem, classList);
    elem.id = id;
    elem.type = 'checkbox';
    elem.name = groupName;
    elem.value = buttonValue;
    elem.checked = checked;
    elem.addEventListener('click', e => handler(e), false);
    container.appendChild(elem);
    
    var label = document.createElement('label');
    label.htmlFor = id;
    label.innerHTML = displayValue;
    CreateElement._addClassList(label, classList);
    container.appendChild(label);

    return container;
  }
  
  static _addClassList(elem, classList) {
    if (classList && classList != '') {
      var splitClass = classList.split(' ');
      for (var i = 0; i < splitClass.length; i++) {
        elem.classList.add(splitClass[i]);
      }
    }
  }
}
