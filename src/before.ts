import { checkVersion, getFromStorage, ToastSuccess } from "./utils";

// this code will be executed before page load
(async function () {
  if (chrome.runtime.id == undefined) return;
  console.log("before.js executed");

  const storedVersion = (await getFromStorage("app_version")) || "0.0";

  const loaded = window.compareVersions.compare(
    checkVersion,
    storedVersion,
    ">="
  );
  console.log(`load: ${loaded}`);

  if (loaded) {
    let s = document.createElement("script");
    s.src = chrome.runtime.getURL("js/app.js");
    s.defer = true;
    s.onload = function () {
      s.remove();
    };
    (document.head || document.documentElement).appendChild(s);
  }

  document.addEventListener("ping", async function (e: Event) {
    await ToastSuccess((<CustomEvent>e).detail, 2500);
  });
})();
