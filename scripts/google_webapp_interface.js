"use strict";
//---------------------------------------------------------------
// Google Web API class 
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------

class googleSheetWebAPI {
  //--------------------------------------------------------------
  // send GET request to Google web app API
  //   apiInfo: object with apiBase URL and API key, e.g {apibase: 'xxx', apikey: 'yyy'}
  //   dataset: dataset name passed to API
  //   params: JSON object holding any other query parameters passed to the API
  //   objNotice: (optional) object with "reportError" function for error reporting
  //--------------------------------------------------------------  
  static async webAppGet(apiInfo, dataset, params, objNotice) {
    const METHOD_TITLE = 'webAppGet';
    
    this.__setAPIInfo__(apiInfo.apibase, apiInfo.apikey);
    var url = this.__buildApiUrl__(dataset, params);
    
    try {
      const resp = await fetch(url);
      const json = await resp.json();
      //console.log(json);

      if (!json.success) {
        var errmsg = '*ERROR: in ' + METHOD_TITLE + ', ' + json.details;
        if (objNotice != null) objNotice.reportError(METHOD_TITLE, {name: 'API failure', message: errmsg});
        console.log(errmsg);
      }
      return json;
      
    } catch (error) {
      if (objNotice != null) objNotice.reportError(METHOD_TITLE, error);
      console.log('**ERROR: in ' + METHOD_TITLE + ', ' + error);
    }
  }  
  
  //--------------------------------------------------------------
  // send POST request to Google web app API
  //   apiInfo: object with apiBase URL and API key, e.g {apibase: 'xxx', apikey: 'yyy'}
  //   dataset: dataset name passed to API
  //   postData: JSON object holding data passed to the API
  //   objNotice: (optional) object with "reportError" function for error reporting
  //--------------------------------------------------------------  
  static async webAppPost(apiInfo, dataset, postData, objNotice) {
    const METHOD_TITLE = 'webAppPost';

    this.__setAPIInfo__(apiInfo.apibase, apiInfo.apikey);
    let url = this.__buildApiUrl__(dataset, {});
    
    try {
      const resp = await fetch(url, {method: 'post', contentType: 'application/x-www-form-urlencoded', body: JSON.stringify(postData)});  
      const json = await resp.json();
      //console.log(json);

      if (!json.success) {
        var errmsg = '**ERROR: in ' + METHOD_TITLE + ', ' + json.details;
        if (objNotice != null) objNotice.reportError(METHOD_TITLE, {name: 'API failure', message: errmsg});
        console.log(errmsg);
      }
      return json;

    } catch (error) {
      if (objNotice != null) objNotice.reportError(METHOD_TITLE, error);
      console.log('**ERROR: in ' + METHOD_TITLE + ', ' + error);
    }  
  }
  
  //-------------------------------------------------------------
  // (private) set the base URL and the key for the API
  // - must be called before using other methods
  //-------------------------------------------------------------
  static __setAPIInfo__(apiBase, apiKey) {
    this.apiBase = apiBase;
    this.apiKey = apiKey;   
    //console.log('setAPIInfo: \n   key=' + this.apiKey + '\n   base URL=' + this.apiBase);
  }
  
  //-------------------------------------------------------------
  // (private) build URL including query parameters for the API
  //-------------------------------------------------------------
  static __buildApiUrl__(datasetname, params) {
    let url = this.apiBase;
    url += '?key=' + this.apiKey;
    url += datasetname && datasetname !== null ? '&dataset=' + datasetname : '';

    for (var param in params) {
      url += '&' + param + '=' + params[param].replace(/ /g, '%20');
    }
    //console.log('buildApiUrl: url=' + url);
    
    return url;
  }  
}
