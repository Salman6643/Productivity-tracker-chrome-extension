// background.js - service worker for tracking active tab and timing

let current = { tabId: null, url: null, start: null };

// default user preferences (can be synced from backend)
const defaultPrefs = {
  blockedSites: ["facebook.com", "youtube.com"],
  notifyOnBlock: true,
  syncUrl: "http://localhost:5000/api",
  syncIntervalMin: 5
};

// load prefs from chrome.storage
async function loadPrefs() {
  return new Promise((res) => {
    chrome.storage.sync.get(defaultPrefs, (items) => {
      res(items);
    });
  });
}

// handle active tab change
async function handleTabChange(tabId) {
  try {
    if (!tabId) return;

    const tabs = await chrome.tabs.get(tabId);
    const url = tabs.url || "";
    const prefs = await loadPrefs();

    // end previous session
    if (current.start && current.url) {
      const duration = Date.now() - current.start;
      const activity = {
        url: current.url,
        start: current.start,
        end: Date.now(),
        duration
      };

      // save to local history
      chrome.storage.local.get({ history: [] }, (res) => {
        const history = res.history || [];
        history.push(activity);
        chrome.storage.local.set({ history });
      });

      // optional: send to backend
      if (prefs.syncUrl && prefs._token) {
        fetch(`${prefs.syncUrl}/activity`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${prefs._token}`
          },
          body: JSON.stringify(activity)
        }).catch(() => {});
      }
    }

    // start new tracking if valid URL
    if (
      url &&
      !url.startsWith("chrome://") &&
      !url.startsWith("chrome-extension://")
    ) {
      current = { tabId, url, start: Date.now() };

      // check block list
      const blocked = prefs.blockedSites || [];
      if (blocked.some((b) => url.includes(b))) {
        chrome.scripting.executeScript({
          target: { tabId },
          func: (notify) => {
            const id = "productivity-blocker-overlay";
            if (!document.getElementById(id)) {
              const div = document.createElement("div");
              div.id = id;
              div.style.position = "fixed";
              div.style.left = "0";
              div.style.top = "0";
              div.style.width = "100%";
              div.style.height = "100%";
              div.style.background = "white";
              div.style.zIndex = "999999";
              div.style.display = "flex";
              div.style.justifyContent = "center";
              div.style.alignItems = "center";
              div.innerHTML = "<h1 style='font-size:40px;color:red'>🚫 Site Blocked</h1>";
              document.body.appendChild(div);

              if (notify) {
                alert("This site is blocked for your productivity!");
              }
            }
          },
          args: [prefs.notifyOnBlock]
        });
      }
    }
  } catch (err) {
    console.error("Error in handleTabChange:", err);
  }
}

// listeners
chrome.tabs.onActivated.addListener(({ tabId }) => {
  handleTabChange(tabId);
});

chrome.windows.onFocusChanged.addListener(async (winId) => {
  if (winId === chrome.windows.WINDOW_ID_NONE) {
    handleTabChange(null);
  } else {
    const [tab] = await chrome.tabs.query({ active: true, windowId: winId });
    if (tab) handleTabChange(tab.id);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.active) {
    handleTabChange(tabId);
  }
});

// listen for popup requests
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_STATS") {
    chrome.storage.local.get({ history: [] }, (res) => {
      sendResponse({ history: res.history || [] });
    });
    return true; // async response
  }
});
