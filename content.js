// Content script
console.log("Content script running on page");

// Makes a request to background script to run getTabs function
chrome.runtime.sendMessage({type: "getTabs"}, (response) => {
  console.log("Got tabs:", response.tabs);
});