console.log("background.js executed");

const inject_react = () => {
  const vendor = document.createElement("script");
  vendor.src = chrome.runtime.getURL("js/vendor.js");
  vendor.defer = false;
  (document.head || document.documentElement).appendChild(vendor);

  const react_entry_point = document.createElement("div");
  react_entry_point.id = "clientjack";

  const mercari_app = (document.querySelector(
    "div[class*=StickyHeaderContainer]"
  ) ||
    document.querySelector("div[class*=StickyContainer]") ||
    document.querySelector("div[class*=Container][style*='width: 100%']") ||
    document.querySelector("#__next"))!;

  const mercari_header = mercari_app.firstChild;
  mercari_header?.appendChild(react_entry_point);

  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("js/client.js");
  script.defer = true;
  script.onload = function () {
    script.remove();
  };
  react_entry_point.appendChild(script);
};

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === "complete" && tab?.url?.includes(".mercari.")) {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        function: inject_react,
      } as any,
      (res) => {
        console.log("Locked and loaded");
      }
    );
  }
});
