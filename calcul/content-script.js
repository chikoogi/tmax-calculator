// content-script.js


async function getFetchCalc(startDate, endDate) {
 try{
   const url = '/insa/attend/findAttdDailyConfirm.screen';
   const response = await fetch(url);
   const html = await response.text();
   const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const trAll = doc.querySelectorAll("#listTable tbody tr");
    const start = new Date(startDate.replace(/\./g, '-')+'T00:00:00Z').getTime();
    const end = new Date(endDate.replace(/\./g, '-')+'T00:00:00Z').getTime();

   let totalExtraMinutes = 0;
    const weekWorkingMinutes = 60 * 8;
    const res = [];

    trAll.forEach(tr => {
      const td = tr.querySelectorAll("td");

      const date = new Date(td[7].innerHTML.replace(/\./g, '-')+'T00:00:00Z').getTime();

      if (date >= start && date <= end) {

        const weekDay = td[8].innerHTML;
        const startTime = td[9].innerHTML.split(":").map(Number);
        const endTime = td[12].innerHTML.split(":").map(Number);
        
              if(td[9].innerHTML === "" || td[12].innerHTML === "") return;

        const workedMinutes = (endTime[0] * 60 + endTime[1]) - (startTime[0] * 60 + startTime[1]) - 60;
        const extraMinutes = workedMinutes - weekWorkingMinutes;
        const hoursWorked = Math.floor(workedMinutes / 60);
        const minutesWorked = workedMinutes % 60;

        res.push(`[${weekDay}] 출근: ${td[9].innerHTML} >> 퇴근: ${td[12].innerHTML} >> 하루동안 일한 시간: ${hoursWorked}:${minutesWorked} >> 더 일한 시간: ${extraMinutes}`)
        totalExtraMinutes += extraMinutes;
      }
    });

    res.push("총 추가 시간: ", totalExtraMinutes)
    return res;
   } catch(error) {
        console.error('Error:', error);
        return "오류"
      };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetchData") {
    getFetchCalc(message.startDate, message.endDate).then(result => {
      window.location.href = "/insa/attend/findAttdDailyConfirm.screen";
      sendResponse({result: result});
    }).catch(error => {
      sendResponse({result: `Error: ${error}`});
    });
    return true; // 비동기 응답 처리를 위해
  }
});
