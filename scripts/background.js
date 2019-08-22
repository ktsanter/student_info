//----------------------------------------------------------------------
// on install/update of extension create a right-click menu item
//----------------------------------------------------------------------
// TODO: 
//----------------------------------------------------------------------

//chrome.runtime.onInstalled.addListener(addContextMenuOption); // didn't seem to work
//chrome.runtime.onStartup.addListener(addContextMenuOption);   // didn't seem to work
addContextMenuOption();

function addContextMenuOption() {
  chrome.contextMenus.create({
    title: 'search for name in Student infoDeck', 
    contexts:["selection"], 
    onclick: contextMenuHandler
  });
}

// handler for context menu selection
function contextMenuHandler(e) {
  openStudentInfoDeck(e.selectionText);
}

// open Student infoDeck, pre-populating search with selected text
function openStudentInfoDeck(searchText) {
  chrome.storage.sync.set(
    {"sid_forcedpopup": 'yes', "sid_searchtext": searchText}, 
    function () {
      window.open("popup.html", "Student infoDeck", "width=460,height=400");
    }
  );
}
