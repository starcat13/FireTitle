browser.browserAction.onClicked.addListener(() => browser.runtime.openOptionsPage());

function applyOptions(tab_id)
{
  function setWindowName(result, tab, browserInfo, nbtab)
  {
    separator = result.separator || default_options["sep"];
    cur_win_name = result["win"+tab.windowId+"_name"] || result.def_win_name || default_options["win_name"];
    cur_win_pattern = result["win"+tab.windowId+"_pattern"] || result.def_win_pattern || default_options["win_patt"];
    newtitle = computeTitle(cur_win_pattern, separator, cur_win_name, tab.title, nbtab, browserInfo);
    // XXX: Workarround for Webextension poor API
    newtitle += separator;
    var win_prop = {
      titlePreface: newtitle
    };
    debugInfo(0, "Computed title(p="+cur_win_pattern+", s="+separator+", n="+cur_win_name+", t="+tab.title+") = " + newtitle + " (Wid=" + tab.windowId + ")");
    browser.windows.update(tab.windowId, win_prop);
  }

  browser.storage.local.get().then(
    (result) => {browser.tabs.get(tab_id).then(
      (tab) => {browser.runtime.getBrowserInfo().then(
        (info) => {browser.tabs.query({windowId: tab.windowId}).then(
          (tabs) => {setWindowName(result, tab, info, tabs.length) }
        )})})}).catch(onError);
}

function readMsg(msg, sender)
{
  if(msg.message=="update")
  {
    applyOptions(sender.tab.id);
  }
  else if(msg.message=="update-tab")
  {
    applyOptions(msg.tabId);
  }
}

/* save default properties to new windows */
function newWindow(win)
{
  function saveNewWindowProp(result)
  {
    var prop_set = {};
    prop_set["win"+win.id+"_name"] = result.def_win_name;
    prop_set["win"+win.id+"_pattern"] = result.def_win_pattern;
    browser.storage.local.set(prop_set);
  }
}

/* update title when a tab is changed */
function tabChanged(id, change, tab)
{
  function propagate(tabs)
  {
    for(let tab of tabs)
      applyOptions(tab.id)
  }
  if(tab.active)
    applyOptions(tab.id)
  else
    browser.tabs.query({ active: true, windowId: tab.windowId}).then(propagate,onError);
}

/* update title when a tab is activated */
function tabActivated(activeinfo)
{
  applyOptions(activeinfo.tabId);
}

browser.runtime.onMessage.addListener(readMsg);
browser.windows.onCreated.addListener(newWindow);
browser.tabs.onUpdated.addListener(tabChanged);
browser.tabs.onActivated.addListener(tabActivated);
