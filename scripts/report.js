"use strict";
//-----------------------------------------------------------------------------------
// Student infoDeck Chrome extension
//-----------------------------------------------------------------------------------
// TODO: add "copied" notice to top of page
//-----------------------------------------------------------------------------------

const app = function () {
  const apptitle = 'Student infoDeck reporting';
  const appversion = '0.07';
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
    page.notice = CreateElement._createDiv('notice', 'notice');
    page.body.appendChild(page.notice);
  }
  
  function _renderPage() {
    _identifyIndexAndCourseFields();
    page.contents = CreateElement._createDiv(null, 'contents');
    page.body.appendChild(page.contents);
    page.selecteddata = null;
    
    page.contents.appendChild(_renderTitle());
    page.contents.appendChild(_renderCourseSelection());    
    page.contents.appendChild(_renderFilterSelection());
    
    settings.sortby = 'index';
    settings.sortbackwards = false;
    _renderSelectedData();    
  } 
  
  function _renderTitle() {
    var container = CreateElement._createDiv(null, 'title');
    
    container.appendChild(CreateElement._createDiv(null, 'title-label', apptitle));
    container.appendChild(CreateElement._createIcon(null, 'fas fa-copy title-icon', 'copy reported data', e => _handleCopyClick(e)));
    
    page.copynotice = CreateElement._createSpan(null, 'title-copynotice', 'copy notice');
    container.appendChild(page.copynotice);
    
    container.appendChild(CreateElement._createDiv(null, 'title-version', 'v' + appversion));
    
    return container;
  }
  
  function _renderCourseSelection() {
    var container = CreateElement._createDiv(null, 'selection');  

    var elemTitle = CreateElement._createDiv(null, 'selection-title', settings.coursefieldkey)   
    elemTitle.appendChild(CreateElement._createIcon('courseUp', 'fas fa-caret-square-up selection-control', null, _handleSelectionUpDown));
    elemTitle.appendChild(CreateElement._createIcon('courseDown', 'fas fa-caret-square-down selection-control', null, _handleSelectionUpDown));        
    container.appendChild(elemTitle);

    var courseList = _getSortedCourseList();
    
    var innercontainer = CreateElement._createDiv('courseContents', 'selection-contents');

    innercontainer.appendChild(CreateElement._createBR(null, null));
    innercontainer.appendChild(CreateElement._createButton(null, null, 'all', 'select all', _handleSelectAllCourses));
    innercontainer.appendChild(CreateElement._createButton(null, null, 'clear', 'clear all', _handleDeSelectAllCourses));

    for (var i = 0; i < courseList.length; i++) {
      var elem = CreateElement._createDiv(null, null, courseList[i]);
      innercontainer.appendChild(CreateElement._createBR(null, null));
      innercontainer.appendChild(CreateElement._createCheckbox('course' + i, null, 'course', courseList[i], courseList[i], true, _handleCourseSelection));
    }
    container.appendChild(innercontainer);
    
    return container;
  }
   
  function _renderFilterSelection() {
    var container = CreateElement._createDiv(null, 'selection');
    
    var elemTitle = CreateElement._createDiv(null, 'selection-title', 'filters');
    elemTitle.appendChild(CreateElement._createIcon('filterUp', 'fas fa-caret-square-up selection-control', null, _handleSelectionUpDown));
    elemTitle.appendChild(CreateElement._createIcon('filterDown', 'fas fa-caret-square-down selection-control', null, _handleSelectionUpDown));
    container.appendChild(elemTitle);
    
    var filterList = _getFilterList();
    
    var innercontainer = CreateElement._createDiv('filterContents', 'selection-contents');

    innercontainer.appendChild(CreateElement._createBR(null, null));
    innercontainer.appendChild(CreateElement._createButton(null, null, 'all', 'select all filters', _handleSelectAllFilters));
    innercontainer.appendChild(CreateElement._createButton(null, null, 'clear', 'clear all filters', _handleDeSelectAllFilters));

    for (var i = 0; i < filterList.length; i++) {
      var elem = CreateElement._createDiv(null, null, filterList[i]);
      innercontainer.appendChild(CreateElement._createBR(null, null));
      innercontainer.appendChild(CreateElement._createCheckbox('filter' + i, null, 'filter', filterList[i].fieldkey, filterList[i].fieldkey, true, _handleFilterSelection));
    }
    container.appendChild(innercontainer);
    
    return container;
  }
  
  function _renderSelectedData() {
    _setCopiedMessage('');
    if (page.selecteddata && page.selecteddata != null) {
      page.selecteddata.parentNode.removeChild(page.selecteddata);
    }
    
    var selectedData = _getSelectedData();
    
    page.selecteddata = CreateElement._createDiv(null, 'selecteddata');
    
    var container = CreateElement._createDiv(null, 'tabletitle');

    var elemIndex = CreateElement._createDiv(null, 'tabletitle-name', settings.indexfieldkey);
    elemIndex.addEventListener('click', _handleIndexTitleClick, false);
    container.appendChild(elemIndex);
    
    var elemCourse = CreateElement._createDiv(null, 'tabletitle-course', settings.coursefieldkey);
    elemCourse.addEventListener('click', _handleCourseTitleClick, false);
    container.appendChild(elemCourse);
    
    container.appendChild(CreateElement._createDiv(null, 'tabletitle-items', 'items'));
    page.selecteddata.appendChild(container);
    
    for (var i = 0; i < selectedData.length; i++) {
      container = CreateElement._createDiv(null, 'student');
      var student = selectedData[i].student;
      var display = selectedData[i].display;
      
      container.appendChild(CreateElement._createDiv('student-name', 'student-name', student[settings.indexfieldkey]));
      container.appendChild(CreateElement._createDiv('student-course', 'student-course', student[settings.coursefieldkey]));

      var containerItems = CreateElement._createDiv('student-items', 'student-items');
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
    var container = CreateElement._createDiv(null, 'student-item');
    
    var displayType = filterDisplay.display.type;
    var displayData = filterDisplay.display.data;
    var hoverText = filterDisplay.hovertext;
    var studentValue = filterDisplay.studentvalue;
    
    hoverText = hoverText.replace(/\[value\]/g, studentValue);
    hoverText = hoverText.replace(/\[date\]/g, MyDateTime._formatDate(studentValue));
    
    if (displayType == '[image]' || displayType == 'image') {
      CreateElement._addClassList(container, 'student-item-image');
      container.appendChild(CreateElement._createImage(null, null, displayData, hoverText));
      
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
  
  function _doOpenClose(id) {
    if (id == 'filterUp') {
      document.getElementById('filterUp').style.display = 'none';
      document.getElementById('filterDown').style.display = 'block';
      document.getElementById('filterContents').style.display = 'none';
    } else if (id == 'filterDown') {
      document.getElementById('filterUp').style.display = 'block';
      document.getElementById('filterDown').style.display = 'none';
      document.getElementById('filterContents').style.display = 'block';
      
    }else if (id == 'courseUp') {
      document.getElementById('courseUp').style.display = 'none';
      document.getElementById('courseDown').style.display = 'block';
      document.getElementById('courseContents').style.display = 'none';
    } else if (id == 'courseDown') {
      document.getElementById('courseUp').style.display = 'block';
      document.getElementById('courseDown').style.display = 'none';
      document.getElementById('courseContents').style.display = 'block';
    }
    
    // without this the entire 'xxxContents' is selected
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    } else if (document.selection) {
      document.selection.empty();
    }      
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
    
    var sortedList = Array.from(filterList).sort(
      function (a, b) {
        var aval = a.fieldkey;
        var bval = b.fieldkey;
        var result = 0;
        if (aval > bval) result = 1;
        if (aval < bval) result = -1;
        return result;
      }
    );

    return sortedList;
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
    
    selectedData = selectedData.sort(
      function(a,b) {
        var primaryKey = settings.indexfieldkey;
        var secondaryKey = settings.coursefieldkey;
        if (settings.sortby != 'index') {
          var primaryKey = settings.coursefieldkey;
          var secondaryKey = settings.indexfieldkey;
        }
        
        var aval = a.student[primaryKey];
        var bval = b.student[primaryKey];
        var result = aval.localeCompare(bval);
        
        if (result == 0) {
          aval = a.student[secondaryKey];
          bval = b.student[secondaryKey];
          result = aval.localeCompare(bval);
        }
        
        if (settings.sortbackwards) result *= -1;
        
        return result;
      }
    );

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
        if (MyDateTime._isValidDate(studentValue)) {
          if (MyDateTime._compareDateToNow(studentValue) < 0) {
            result = {display: filterRule.display, hovertext: filter.fieldkey + ' is late (due [date])', studentvalue: studentValue};
          }
        }
        
      } else if (filterRule.value == '[late=]') {
        if (MyDateTime._isValidDate(studentValue)) {
          if (MyDateTime._compareDateToNow(studentValue) == 0) {
            result = {display: filterRule.display, hovertext: filter.fieldkey + ' is due today: [date]', studentvalue: studentValue};
          }
        }
        
      } else if (filterRule.value == '[window]') {
        if (MyDateTime._isValidDate(studentValue)) {
          if (MyDateTime._compareDateToNow(studentValue, parseInt(filterFieldTypeParam)) == 0) {
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
  
  function _copyReportedData() {
    var studentNames = document.getElementsByClassName('student-name');
    var studentCourses = document.getElementsByClassName('student-course');
    var studentItems = document.getElementsByClassName('student-items');
    
    var msgData = '';
    for (var i = 0; i < studentNames.length; i++) {
      var msgRowData = '';
      msgRowData += studentNames[i].innerHTML;
      msgRowData += '\t' + studentCourses[i].innerHTML;
      
      var imageData = studentItems[i].getElementsByTagName('img');
      for (var j = 0; j < imageData.length; j++) {
        msgRowData += '\t' + imageData[j].title;
      }
      
      msgData += msgRowData + '\n';
    }

    _copyToClipboard(msgData);
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
  
  function _handleSelectionUpDown(e) {
    _doOpenClose(e.target.id);
  }
  
  function _handleIndexTitleClick() {
    if (settings.sortby == 'index') {
      settings.sortbackwards = !settings.sortbackwards;
    } else {
      settings.sortby = 'index';
      settings.sortbackwards = false;
    }
    _renderSelectedData();
  }
  
  function _handleCourseTitleClick() {
    if (settings.sortby == 'course') {
      settings.sortbackwards = !settings.sortbackwards;
    } else {
      settings.sortby = 'course';
      settings.sortbackwards = false;
    }
    _renderSelectedData();
  }
  
  function _handleCopyClick(e) {
    _copyReportedData();
  }
  
  //---------------------------------------
  // clipboard functions
  //----------------------------------------
  function _copyToClipboard(txt) {
    if (!page._clipboard) page._clipboard = new ClipboardCopy();

    page._clipboard._copyToClipboard(txt);
    _setCopiedMessage('copied');
	}	

  function _setCopiedMessage(msg) {
    var elem = page.copynotice;
    elem.innerHTML = msg;
    if (msg == '') {
      elem.style.display = 'none';
    } else {
      elem.style.display = 'inline-block';
    }
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

	//---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
