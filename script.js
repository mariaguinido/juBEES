// Dummy data
let dummyLabels = ["T-4","T-3","T-2","T-1","Now"];
let dummyTemp = [21,22,22.5,23,22];
let dummyHumidity = [50,52,53,55,54];
let dummyWeight = [15.5,15.8,16,16.1,16];
let dummyAudio = [0,0,1,0,0];
let videoLogData = [
  "10:00 - No intrusion",
  "10:01 - Bee detected",
  "10:02 - Unknown object",
  "10:03 - No intrusion"
];

let chart = null;


// Update card display
document.getElementById('temp').innerText = dummyTemp[4] + " °C";
document.getElementById('humidity').innerText = dummyHumidity[4] + " %";
document.getElementById('weight').innerText = dummyWeight[4] + " kg";
document.getElementById('audio').innerText = dummyAudio[4] ? "Buzzing Alert!" : "Normal";
document.getElementById('videoStatus').innerText = "No Intrusion";


// ---------------- GRAPH CARDS ----------------

function showGraph(type){
  document.getElementById("detailsSection").style.display = "block";
  document.getElementById("videoSection").style.display = "none";

  let dataSet, label, yLabel;

  switch(type){
    case 'temp': dataSet = dummyTemp; label="Temperature"; yLabel="°C"; break;
    case 'humidity': dataSet = dummyHumidity; label="Humidity"; yLabel="%"; break;
    case 'weight': dataSet = dummyWeight; label="Weight"; yLabel="kg"; break;
    case 'audio': dataSet = dummyAudio; label="Audio Alerts"; yLabel="Alert"; break;
  }

  if(chart) chart.destroy();

  const ctx = document.getElementById("detailChart").getContext("2d");
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: dummyLabels,
      datasets: [{
        label: label,
        data: dataSet,
        borderColor: "#F6A623",
        backgroundColor: "rgba(246,166,35,0.3)",
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, title: { display: true, text: yLabel }},
        x: { title: { display: true, text: "Time" }}
      }
    }
  });
}


// ---------------- VIDEO CARD ----------------

function showVideoPanel(){
  document.getElementById("detailsSection").style.display = "block";
  document.getElementById("videoSection").style.display = "block";

  // Hide chart for video card
  const ctx = document.getElementById("detailChart").getContext("2d");
  ctx.clearRect(0,0,400,200);
  if(chart){ chart.destroy(); chart = null; }

  // Load logs
  const logs = document.getElementById("videoLogs");
  logs.innerHTML = "";
  videoLogData.forEach(x => {
    const li = document.createElement("li");
    li.innerText = x;
    logs.appendChild(li);
  });

  // Dummy video already in src
}



// ---------------- DOWNLOAD CSV ----------------
// ---------------- DOWNLOAD CSV ----------------

function downloadLogs(){
  let csv = "Time,Temperature,Humidity,Weight,Audio\n";
  for(let i=0;i<dummyLabels.length;i++){
    csv += ${dummyLabels[i]},${dummyTemp[i]},${dummyHumidity[i]},${dummyWeight[i]},${dummyAudio[i]}\n;
  }

  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], {type:"text/csv"}));
  a.download = "beehive_logs.csv";
  a.click();
}


// ---------------- DUMMY LIVE STREAM ----------------

function startLiveStream(){
  alert("Starting live stream... (dummy only)");
  // Pag real na:
  // document.getElementById("videoClip").src = "http://<pi-ip>:port/stream.mjpg";
}
