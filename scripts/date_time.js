"use strict";
//-----------------------------------------------------------------------------------
// Date and time utility functions
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------
class DateTime {
  constructor() {
    this_version = '0.04';
  }
  
  static _getDebugNow() {
    return null;//'10/13/2019';
  }
  
  static isValidDate(str) {
    var d = new Date(str);
    return !isNaN(d);
  }

  static formatDate(theDate) {
    var formattedDate = theDate;
    
    if (DateTime.isValidDate(theDate)) {
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
  
  static formatDateShort(theDate) {
    var formattedDate = theDate;
    
    if (DateTime.isValidDate(theDate)) {
      formattedDate = DateTime.formatDate(theDate).slice(0, -3);
    }
    
    return formattedDate;
  }

  
  static formatDateShortWithWeekday(theDate) {
    var weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var formattedDate = theDate;
    
    if (DateTime.isValidDate(theDate)) {
      var objDate = new Date(theDate);
      formattedDate = weekDays[objDate.getDay()] + ' ' + DateTime.formatDateShort(theDate);
    }
    
    return formattedDate;
  }
    
  static compareDateToNow(date, daysInWindow) {
    const _MS_PER_DAY = 1000 * 60 * 60 * 24;

    var parsedDate = new Date(Date.parse(date));
    var now = new Date();
    
    var debugNow = DateTime._getDebugNow();
    if (debugNow != null) now = new Date(Date.parse(debugNow));
    
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
  
  static isNowInWeek(date) {
    const _MS_PER_DAY = 1000 * 60 * 60 * 24;

    var parsedDate = new Date(Date.parse(date));
    var now = new Date();

    var debugNow = DateTime._getDebugNow();
    if (debugNow != null) now = new Date(Date.parse(debugNow));
    
    var utcDate = Date.UTC(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
    var utcNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

    var result = false;
    var daysLater = Math.floor(utcNow - utcDate) / _MS_PER_DAY;
    if (daysLater >= 0 && daysLater < 7) result = true;

    return result;
  }
}