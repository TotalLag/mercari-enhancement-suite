import {
  checkVersion,
  getFromStorage,
  setToStorage,
  ToastSuccess,
  ToastError,
} from "./utils";

// this code will be executed after page load
(async function () {
  if (chrome.runtime.id == undefined) return;
  console.log("after.js executed");

  const scriptTags = Object.values(document.scripts);
  const appURL = scriptTags
    .filter((script) => script.src.includes("_app"))
    .reduce((prev, cur) => cur.src, "");

  const appVersion = (appURL?.match(/\/*(?:^v)?\d+(?:\.\d+)+/) ?? "")[0];
  const storedVersion = (await getFromStorage("app_version")) || "0.0";
  const loaded = window.compareVersions.compare(
    checkVersion,
    storedVersion,
    ">="
  );

  console.log(`${appURL}`);
  console.log(`app: ${appVersion}`);
  console.log(`stored: ${storedVersion}`);

  if (appVersion) {
    const updated = window.compareVersions.compare(
      checkVersion,
      appVersion,
      "<"
    );

    await setToStorage({ app_version: appVersion });
    console.log(`set: ${appVersion}`);

    if (
      (!storedVersion &&
        window.compareVersions.compare(checkVersion, appVersion, "=")) ||
      (updated && loaded)
    ) {
      console.log(`reloading...`);
      window.location.reload();
    }

    console.log(`newer?: ${updated}`);

    if (updated) {
      await ToastError(
        "New Mercari web version detected. Click here to check if an updated extension is available.",
        10000
      );
    }

    if (loaded) {
      await ToastSuccess("Plugin Loaded ✅", 3000);
    }
  }
})();
