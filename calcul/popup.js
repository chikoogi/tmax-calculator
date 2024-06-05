document.addEventListener('DOMContentLoaded', function() {
  // 현재 날짜를 YYYY-MM-DD 형식으로 가져오기
  const today = new Date().toISOString().slice(0, 10);
  // startDate 입력 필드의 기본값으로 설정
  document.getElementById('startDate').value = today;
  document.getElementById('endDate').value = today;
});


document.getElementById('checkButton').addEventListener('click', async function() {
  // const startDate = document.getElementById('startDate').value || "2024-02-12";
  // const endDate = document.getElementById('endDate').value || "2024-02-13";
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

  // chrome.tabs.update({ url: "https://otims.tmax.co.kr/frame.screen" });

  //https://otims.tmax.co.kr/insa/attend/findEmpRouteList.screen?srchStDate=20240527&srchEdDate=20240527&srchEmpNo=2022302&srchEmpNm=%EA%B9%80%EC%A7%80%ED%9B%88H
//		var url = "/insa/attend/findEmpRouteList.screen?srchStDate="+stDate+"&srchEdDate="+stDate+"&srchEmpNo="+empNo+"&srchEmpNm="+empNm;
  chrome.runtime.sendMessage({
    action: "calculateAttendance",
    url: "https://otims.tmax.co.kr/frame.screen",
    startDate: startDate,
    endDate: endDate
  }, function(response) {
    for (const [key, value] of Object.entries(response.result)) {
      document.getElementById('output').innerHTML += `${key}: ${value}<br>`;
    }
  });
});

