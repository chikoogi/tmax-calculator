chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "calculateAttendance") {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const currentTabId = tabs[0].id;
      chrome.tabs.update(currentTabId, { url: request.url }, () => {
        let attemptCount = 0;
        const maxAttempts = 10;

        const checkTabLoaded = setInterval(() => {
          chrome.tabs.get(currentTabId, (tab) => {
            if (tab.status === "complete") {
              clearInterval(checkTabLoaded);
              chrome.tabs.sendMessage(currentTabId, {
                action: "fetchData",
                startDate: request.startDate,
                endDate: request.endDate
              }, response => {
                console.log(response);
                sendResponse({result: response.result});
              });
            } else if (attemptCount >= maxAttempts) {
              clearInterval(checkTabLoaded);
              sendResponse({result: "Failed to load the page within the limit."});
            }
            attemptCount++;
          });
        }, 1000);
      });
    });
    return true; // 비동기 응답 처리를 위해 true 반환
  }
});