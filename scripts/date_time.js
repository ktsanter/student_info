"use strict";
//-----------------------------------------------------------------------------------
// Date and time utility functions
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------
class MyDateTime {
  constructor() {
    this._version = '0.01';
  }
  
  static _isValidDate(str) {
    var d = new Date(str);
    return !isNaN(d);
  }

  static _formatDate(theDate) {
    var formattedDate = theDate;
    
    if (MyDateTime._isValidDate(theDate)) {
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