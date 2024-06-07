// content-script.js

function formatDate(d) {
    const date = new Date(d);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

function formatDateTime(d) {
    const date = new Date(d);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
}


function formatTime(d) {
    const date = new Date(d);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

async function getFetchCalc(startDate, endDate) {
    try{
        const {srchEmpNo, srchEmpNm} = await getFetchInsa();
        const url = "/insa/attend/findEmpRouteList.screen?srchStDate="+formatDate(startDate)+"&srchEdDate="+formatDate(endDate)+"&srchEmpNo="+srchEmpNo+"&srchEmpNm="+srchEmpNm;
        // const url = "/insa/attend/findEmpRouteList.screen?srchStDate=20240603&srchEdDate=20240605&srchEmpNo="+srchEmpNo+"&srchEmpNm="+srchEmpNm;
        const response = await fetch(url);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const trAll = doc.querySelectorAll("#resultTable tbody tr");

        const TODAY = formatDate(new Date());
        let dateGroups = {};
        trAll.forEach(tr => {
            const date = tr.querySelector('td:nth-child(5)').textContent.trim();
            const time = tr.querySelector('td:nth-child(6)').textContent.trim();

            if (time !== '근태일자' && time !== '태그시각') {
                if (!dateGroups[date]) {
                    dateGroups[date] = [];
                }

                dateGroups[date].push(time);


            }

        });

        let results = {};
        const weekWorkingMinutes = 60 * 8;
        let totalExtraMinutes = 0;


        Object.keys(dateGroups).forEach(date => {
            const times = dateGroups[date].sort();
            const firstTime = times[0];
            const lastTime = times[times.length - 1];

            const [firstDate, firstHourStr] = firstTime.split(' ');
            let [lastDate, lastHourStr] = lastTime.split(' ');

            /* 금일 날짜 예외 처리 - 태그기록이 아닌 현재시간으로 설정 */
            if(formatDate(date) === TODAY) {
                lastHourStr = formatTime(new Date());
            }

            if (firstDate !== lastDate) {
                results[date] = "시작 시각과 종료 시각이 다른 날짜에 걸쳐 있습니다.";
            } else {

                const [firstHour, firstMinute, firstSecond] = firstHourStr.split(':');
                const [lastHour, lastMinute, lastSecond] = lastHourStr.split(':');

                const firstTotalMinutes = parseInt(firstHour) * 60 + parseInt(firstMinute);
                const lastTotalMinutes = parseInt(lastHour) * 60 + parseInt(lastMinute);

                const diffMinutes = lastTotalMinutes - firstTotalMinutes - 60;
                const diffHours = Math.floor(diffMinutes / 60);
                const remainingMinutes = Math.round(diffMinutes % 60);

                const extraMinutes = diffMinutes - weekWorkingMinutes;

                if(formatDate(date) === TODAY) {
                    results[date] = `출근 🕒 ${firstHourStr} ➜ 현재 🕒 ${lastHourStr} <br>  총 근무시간 &nbsp;&nbsp;&nbsp;&nbsp;⏳ ${diffMinutes}분 (${diffHours}시간 ${remainingMinutes}분) <br> 남은 근무시간 ⏰ ${extraMinutes}분`;
                } else {
                    results[date] = `출근 🕒 ${firstHourStr} ➜ 퇴근 🕒 ${lastHourStr} <br>  총 근무시간 &nbsp;&nbsp;&nbsp;&nbsp;⏳ ${diffMinutes}분 (${diffHours}시간 ${remainingMinutes}분) <br> 초과 근무시간 ⏰ ${extraMinutes}분`;
                }

                totalExtraMinutes += extraMinutes;
            }
        });

        results["═══════════════════════════════"] = `총 Total: ${totalExtraMinutes}<br>═══════════════════════════════`;
        return results;
        /*   const url = '/insa/attend/findAttdDailyConfirm.screen';
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
            return res;*/
    } catch(error) {
        console.error('Error:', error);
        return "오류"
    };
}

async function getFetchInsa(){
    const insaUrl = `/insa/base/infoPersonEdit.screen`;
    const response = await fetch(insaUrl);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const  srchEmpNm= doc.querySelectorAll("#tblPersonInfo tr")[0].querySelectorAll("td")[2].innerHTML;
    const srchEmpNo = doc.querySelectorAll("#tblPersonInfo tr")[0].querySelectorAll("td")[4].innerHTML;

    return {srchEmpNo, srchEmpNm};

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


