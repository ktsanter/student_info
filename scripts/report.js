"use strict";
//-----------------------------------------------------------------------------------
// Student infoDeck Chrome extension
//-----------------------------------------------------------------------------------
// TODO: ordering for badges
// TODO: click on column title to sort results (by index or label)
//-----------------------------------------------------------------------------------

const app = function () {
  const apptitle = 'Student infoDeck reporting';
  const appversion = '1.03';
	const page = {};
  const settings = {};
  
  const apiInfo = {
    apibase: 'https://script.google.com/macros/s/AKfycbxpMfjVsVXjZuSdkI5FABJHFY5azMdbep7YfMI_OVndxtN_VwI/exec',
    apikey: 'MV_studeninfoAPI'
  };
        
	//---------------------------------------
	// get things going
	//----------------------------------------
  async function init() {
		page.body = document.getElementsByTagName('body')[0];

    _renderStandardElements();
		
		_setNotice('initializing...');
		if (_initializeSettings()) {
			_setNotice('loading...');

      var requestParams = {studentinfo_spreadsheetid: settings.ssid};
      var requestResult = await googleSheetWebAPI.webAppGet(apiInfo, 'all', requestParams, _reportError);

      if (requestResult.success) {
        _setNotice('');
        settings.studentdata = requestResult.data;
        _renderPage();
      }
		}
  }
  
	//-------------------------------------------------------------------------------------
	// query params:
	//-------------------------------------------------------------------------------------
	function _initializeSettings() {
    var result = false;

    var urlParams = new URLSearchParams(window.location.search);
		settings.ssid = urlParams.has('ssid') ? urlParams.get('ssid') : null;

    if (settings.ssid != null && settings.ssid != '') {
			result = true;

    } else {   
      _setNotice('failed to initialize: invalid parameeters');
    }
    
    return result;
  }
	
	//-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------  
  function _renderStandardElements() {
    page.notice = _createDiv('notice', 'notice');
    page.body.appendChild(page.notice);
  }
  
  function _renderPage() {
    console.log(settings.studentdata);
    _identifyIndexAndCourseFields();
    page.contents = _createDiv(null, 'contents');
    page.body.appendChild(page.contents);
    page.selecteddata = null;
    
    page.contents.appendChild(_renderTitle());
    page.contents.appendChild(_renderCourseSelection());    
    page.contents.appendChild(_renderFilterSelection());
    
    _renderSelectedData();    
  } 
  
  function _renderTitle() {
    var container = _createDiv(null, 'title');
    
    container.appendChild(_createDiv(null, 'title-label', apptitle));
    container.appendChild(_createDiv(null, 'title-version', 'v' + appversion));
    
    return container;
  }
  
  function _renderCourseSelection() {
    var container = _createDiv(null, 'selection');    
    container.appendChild(_createDiv(null, 'selection-title', settings.coursefieldkey));
    
    var courseList = _getSortedCourseList();

    container.appendChild(document.createElement('br'));
    container.appendChild(_createButton(null, null, 'all', 'select all', _handleSelectAllCourses));
    container.appendChild(_createButton(null, null, 'clear', 'clear all', _handleDeSelectAllCourses));

    for (var i = 0; i < courseList.length; i++) {
      var elem = _createDiv(null, null, courseList[i]);
      container.appendChild(document.createElement('br'));
      container.appendChild(_createCheckbox('course' + i, null, 'course', courseList[i], courseList[i], true, _handleCourseSelection));
    }
    
    return container;
  }
   
  function _renderFilterSelection() {
    var container = _createDiv(null, 'selection');
    container.appendChild(_createDiv(null, 'selection-title', 'filters'));
    
    var filterList = _getFilterList();

    container.appendChild(document.createElement('br'));
    container.appendChild(_createButton(null, null, 'all', 'select all filters', _handleSelectAllFilters));
    container.appendChild(_createButton(null, null, 'clear', 'clear all filters', _handleDeSelectAllFilters));

    for (var i = 0; i < filterList.length; i++) {
      var elem = _createDiv(null, null, filterList[i]);
      container.appendChild(document.createElement('br'));
      container.appendChild(_createCheckbox('filter' + i, null, 'filter', filterList[i].fieldkey, filterList[i].fieldkey, true, _handleFilterSelection));
    }
    
    return container;
  }
  
  function _renderSelectedData() {
    if (page.selecteddata && page.selecteddata != null) {
      page.selecteddata.parentNode.removeChild(page.selecteddata);
    }
    
    var selectedData = _getSelectedData();
    
    page.selecteddata = _createDiv(null, 'selecteddata');
    
    var container = _createDiv(null, 'tabletitle');
    container.appendChild(_createDiv(null, 'tabletitle-name', settings.indexfieldkey));
    container.appendChild(_createDiv(null, 'tabletitle-course', settings.coursefieldkey));
    container.appendChild(_createDiv(null, 'tabletitle-items', 'items'));
    page.selecteddata.appendChild(container);
    
    for (var i = 0; i < selectedData.length; i++) {
      container = _createDiv(null, 'student');
      var student = selectedData[i].student;
      var display = selectedData[i].display;
      
      container.appendChild(_createDiv(null, 'student-name', student[settings.indexfieldkey]));
      container.appendChild(_createDiv(null, 'student-course', student[settings.coursefieldkey]));

      var containerItems = _createDiv(null, 'student-items');
      for (var j = 0; j < display.length; j++) {
        var filterDisplay = display[j].filterdisplay;
        containerItems.appendChild(_renderFilterDisplay(filterDisplay));
      }
      container.appendChild(containerItems);
      
      page.selecteddata.appendChild(container);
    }
    
    page.body.appendChild(page.selecteddata);
  }
  
  function _renderFilterDisplay(filterDisplay) {
    var container = _createDiv(null, 'student-item');
    
    var displayType = filterDisplay.display.type;
    var displayData = filterDisplay.display.data;
    var hoverText = filterDisplay.hovertext;
    var studentValue = filterDisplay.studentvalue;
    
    hoverText = hoverText.replace(/\[value\]/g, studentValue);
    hoverText = hoverText.replace(/\[date\]/g, _formatDate(studentValue));      
    
    if (displayType == '[image]' || displayType == 'image') {
      _addClassList(container, 'student-item-image');
      container.appendChild(_createImage(null, null, displayData, hoverText));
      
    } else {
      console.log('display type not implemented: ' + displayType);
      container.innerHTML = '???';
    }  
    
    return container;
  }
  
  function _checkAllBoxesByName(checkboxName, check) {
    var elemList = document.getElementsByName(checkboxName);
    for (var i = 0; i < elemList.length; i++) {
      elemList[i].checked = check;
    }
  }

  function _getSelectedCheckBoxes(checkboxName) {
    var elemList = document.getElementsByName(checkboxName);
    var selected = [];
    for (var i = 0; i < elemList.length; i++) {
      if (elemList[i].checked) selected.push(elemList[i].value);
    }
    return selected
  }

	//------------------------------------------------------------------
	// data processing
	//------------------------------------------------------------------  
  function _identifyIndexAndCourseFields() {
    var fields = settings.studentdata.layoutinfo.fields;
    settings.indexfieldkey = null;
    settings.coursefieldkey = null;
    
    for (var key in fields) {
      var field = fields[key];
      if (field.fieldtype == 'index') settings.indexfieldkey = key;
      if (field.fieldtype == 'label') settings.coursefieldkey = key;
    }
  }
  
  function _getSortedCourseList() {
    var studentinfo = settings.studentdata.studentinfo;
    
    var courseSet = new Set();
    for (var i = 0; i < studentinfo.length; i++) {
      courseSet.add(studentinfo[i][settings.coursefieldkey]);
    }
    
    return Array.from(courseSet).sort();
  }
  
  function _getFilterList() {
    var badgeinfo = settings.studentdata.layoutdefinitioninfo.badges;
    
    var reportingSet = new Set();
    for (var key in badgeinfo) {
      if (badgeinfo[key].report) reportingSet.add(key);
    }

    var filterList = [];
    var fieldinfo = settings.studentdata.layoutinfo.fields;
    for (var key in fieldinfo) {
      var field = fieldinfo[key];
      var trimmedFieldType = field.fieldtype.replace(/\(*.\)/, '');
      if (reportingSet.has(trimmedFieldType)) {
        filterList.push({
          fieldkey: key, 
          fieldtype: field.fieldtype, 
          definition: badgeinfo[trimmedFieldType]});
      }
    }

    return Array.from(filterList);
  }
  
  function _getSelectedData() {
    var criteria = _consolidateSelectionCriteria();
    var studentinfo = settings.studentdata.studentinfo;
    
    var selectedData = [];
    var courseSet = new Set(criteria.courses);
    
    for (var i = 0; i < studentinfo.length; i++) {
      var student = studentinfo[i];
      var displayForStudent = _displayForStudent(student, courseSet, criteria.filters);
      if (displayForStudent.length > 0) {
        selectedData.push({student: student, display: displayForStudent});
      }
    }
    
    return selectedData;
  }
  
  function _consolidateSelectionCriteria() {
    var courseSelections = _getSelectedCheckBoxes('course');
    var filterSelections = _getSelectedCheckBoxes('filter');
    var filterList = _getFilterList();

    var filterInfo = [];
    for (var i = 0; i < filterSelections.length; i++) {
      var selection = filterSelections[i];
      var fieldType = null;
      var fieldDefinition = null;
      
      for (var j = 0; j < filterList.length && fieldType == null; j++) {
        var filter = filterList[j];
        if (selection == filterList[j].fieldkey) {
          fieldType = filterList[j].fieldtype;
          fieldDefinition = filterList[j].definition;
        }
      }
      
      filterInfo.push({fieldkey: selection, fieldtype: fieldType, definition: fieldDefinition});
    }
    
    var criteria = {
      courses: courseSelections,
      filters: filterInfo
    };
    
    return criteria;
  }
  
  function _displayForStudent(student, courseSet, filters) {
    var displayForStudent  = [];
    
    if (courseSet.has(student[settings.coursefieldkey])) {
      for (var i = 0; i < filters.length; i++) {
        var displayForStudentWithFilter = _displayForStudentWithFilter(student, filters[i]);
        if (displayForStudentWithFilter != null) {
          displayForStudent.push({filterdisplay: displayForStudentWithFilter});
        }
      }
    }
    
    return displayForStudent;
  }
  
  function _displayForStudentWithFilter(student, filter) {
    var result = null;

    var filterFieldTypeParam = filter.fieldtype.match(/\(*.\)/);
    if (filterFieldTypeParam != null) {
      filterFieldTypeParam = filterFieldTypeParam[0].slice(1, -1);
    }
   
    var definition = filter.definition;
    var studentValue = student[filter.fieldkey];
    
    for (var i = 0; i < definition.values.length && result == null; i++) {
      var filterRule = definition.values[i];
      var hoverText = definition.hovertext;

      if (filterRule.value == '*' && studentValue != '') {
        result = {display: filterRule.display, hovertext: hoverText, studentvalue: studentValue};
      
      } else if (filterRule.value == '[late>]') {
        if (_isValidDate(studentValue)) {
          if (_compareDateToNow(studentValue) < 0) {
            result = {display: filterRule.display, hovertext: filter.fieldkey + ' is late (due [date])', studentvalue: studentValue};
          }
        }
        
      } else if (filterRule.value == '[late=]') {
        if (_isValidDate(studentValue)) {
          if (_compareDateToNow(studentValue) == 0) {
            result = {display: filterRule.display, hovertext: filter.fieldkey + ' is due today: [date]', studentvalue: studentValue};
          }
        }
        
      } else if (filterRule.value == '[window]') {
        if (_isValidDate(studentValue)) {
          if (_compareDateToNow(studentValue, parseInt(filterFieldTypeParam)) == 0) {
            result = {display: filterRule.display, hovertext: filter.fieldkey + ' is due soon: [date]', studentvalue: studentValue};
          }
        }
        
      } else if (filterRule.value == studentValue) {
            result = {display: filterRule.display, hovertext: hoverText, studentvalue: studentValue};
        
      } else if (filterRule.value == '[else]') {
            result = {display: filterRule.display, hovertext: hoverText, studentvalue: studentValue};
      }
    }
    
    if (result.display.type == '[none]') result = null;
    
    return result;
  }
  
	//------------------------------------------------------------------
	// handlers
	//------------------------------------------------------------------    
  function _handleSelectAllCourses(e) {
    _checkAllBoxesByName('course', true);
    _renderSelectedData();
  }

  function _handleSelectAllFilters(e) {
    _checkAllBoxesByName('filter', true);
    _renderSelectedData();
  }

  function _handleDeSelectAllCourses(e) {
    _checkAllBoxesByName('course', false);
    _renderSelectedData();
  }

  function _handleDeSelectAllFilters(e) {
    _checkAllBoxesByName('filter', false);
    _renderSelectedData();
  }

  function _handleCourseSelection(e) {
    _renderSelectedData();
  }
  
  function _handleFilterSelection(e) {
    _renderSelectedData();
  }
  
  //------------------------------------------------------------------
  // date functions
  //------------------------------------------------------------------
  function _isValidDate(str) {
    var d = new Date(str);
    return !isNaN(d);
  }
  
  function _formatDate(theDate) {
    var formattedDate = theDate;
    
    if (_isValidDate(theDate)) {
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
  
  function _compareDateToNow(date, daysInWindow) {
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
  
	//---------------------------------------
	// utility functions
	//----------------------------------------
	function _setNotice (label) {
		page.notice.innerHTML = label;

		if (label == '') {
			page.notice.style.display = 'none'; 
		} else {
			page.notice.style.display = 'block';
		}
	}
  
  function _reportError(src, err) {
    _setNotice('Error in ' + src + ': ' + err.name + ' "' + err.message + '"');
  }

  function _createDiv(id, classList, html) {
    var elem = document.createElement('div');
    if (id && id != '') elem.id = id;
    _addClassList(elem, classList);
    if (html != null) elem.innerHTML = html;
    
    return elem;
  }
  
  function _createSpan(id, classList, html) {
    var elem = document.createElement('span');
    if (id && id != '') elem.id = id;
    _addClassList(elem, classList);
    if (html != null) elem.innerHTML = html;
    
    return elem;
  }
  
  function _createImage(id, classList, src, title) {
    var elem = document.createElement('img');
    if (id && id != '') elem.id = id;
    _addClassList(elem, classList);
    if (src != null) elem.src = src;
    if (title) elem.title = title;
    
    return elem;
  }
  
  function _createButton(id, classList, label, title, handler) {
    var elem = document.createElement('button');
    if (id && id != '') elem.id = id;
    _addClassList(elem, classList);
    elem.innerHTML = label;
    elem.title = title;
    elem.addEventListener('click', e => handler(e), false);
    
    return elem;
  }

  function _createCheckbox(id, classList, groupName, buttonValue, displayValue, checked, handler) {
    var container = _createSpan(null, null);
    
    var elem = document.createElement('input');
    _addClassList(elem, classList);
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
    _addClassList(label, classList);
    container.appendChild(label);

    return container;
  }
  
  
  function _addClassList(elem, classList) {
    if (classList && classList != '') {
      var splitClass = classList.split(' ');
      for (var i = 0; i < splitClass.length; i++) {
        elem.classList.add(splitClass[i]);
      }
    }
  }

	//---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
