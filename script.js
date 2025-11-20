// scripts.js - minimal logic for card clicks, chart rendering, livestream and datalog
// EDIT THE API ENDPOINTS BELOW to match your backend

const API_BASE = "/api"; // adjust if needed
const chartColors = {
  border: "#ff2fa6",
  bg: "rgba(255,47,166,0.08)"
};

let chartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => onCardClick(card));
  });

  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.getElementById("modal-backdrop")?.addEventListener("click", closeModal);

  document.getElementById("set-stream").addEventListener("click", () => {
    const url = document.getElementById("stream-url").value.trim();
    setStreamURL(url);
  });

  document.getElementById("set-youtube").addEventListener("click", () => {
    const url = document.getElementById("stream-url").value.trim();
    embedYouTube(url);
  });

  // Optional: load initial last values into cards
  refreshCardLastValues();
});

async function onCardClick(cardEl){
  const sensorId = cardEl.dataset.sensor;
  openModal(sensorId);
  await loadSensorTimeseries(sensorId);
  await loadSensorLogs(sensorId);
}

function openModal(sensorId){
  document.getElementById("modal-title").textContent = sensorId;
  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("modal").setAttribute("aria-hidden", "false");
}

function closeModal(){
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("modal").setAttribute("aria-hidden", "true");
  // destroy chart
  if(chartInstance){ chartInstance.destroy(); chartInstance = null; }
}

async function loadSensorTimeseries(sensorId){
  const url = `${API_BASE}/data?sensor=${encodeURIComponent(sensorId)}`;
  try{
    const res = await fetch(url);
    let json;
    if(res.ok){
      json = await res.json();
      // expected format: { timestamps: [...], values: [...] } or array of {ts, value}
    } else {
      console.warn("Timeseries fetch failed, using sample data");
      json = null;
    }
    const {labels, data} = normalizeTimeseries(json);
    renderChart(labels, data);
  }catch(err){
    console.error("Error fetching timeseries:", err);
    const {labels,data} = normalizeTimeseries(null);
    renderChart(labels,data);
  }
}

function normalizeTimeseries(json){
  // Accepts multiple possible shapes. If null => generate demo.
  if(!json){
    const now = Date.now();
    const labels = Array.from({length:24}).map((_,i) => {
      const d = new Date(now - (23 - i) * 60 * 60 * 1000);
      return d.toLocaleString();
    });
    const data = labels.map((_,i) => (Math.random()*100).toFixed(2));
    return {labels, data};
  }

  if(Array.isArray(json)){
    const labels = json.map(r => new Date(r.ts).toLocaleString());
    const data = json.map(r => r.value);
    return {labels, data};
  }

  if(json.timestamps && json.values){
    const labels = json.timestamps.map(ts => new Date(ts).toLocaleString());
    return {labels, data: json.values};
  }

  // fallback
  return normalizeTimeseries(null);
}

function renderChart(labels, data){
  const ctx = document.getElementById("timeseries-chart").getContext("2d");
  if(chartInstance){ chartInstance.destroy(); chartInstance = null; }

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Value over time",
        data,
        borderColor: chartColors.border,
        backgroundColor: chartColors.bg,
        tension: 0.25,
        pointRadius: 2,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: "#e6dff0" }, grid: { color: "transparent" } },
        y: { ticks: { color: "#e6dff0" }, grid: { color: "rgba(255,255,255,0.03)" } }
      },
      plugins: {
        legend: { labels: { color: "#ffb8e0" } }
      }
    }
  });
}

async function loadSensorLogs(sensorId){
  const url = `${API_BASE}/logs?sensor=${encodeURIComponent(sensorId)}&limit=50`;
  try{
    const res = await fetch(url);
    let logs;
    if(res.ok){
      logs = await res.json();
      // expected: [{ts: "...", value: "...", type: "detection"}]
    } else {
      logs = null;
    }
    populateLogTable(logs);
  }catch(err){
    console.error("Error fetching logs:", err);
    populateLogTable(null);
  }
}

function populateLogTable(rows){
  const tbody = document.querySelector("#modal-log-table tbody");
  const mainTbody = document.querySelector("#datalog-table tbody");
  tbody.innerHTML = "";
  mainTbody.innerHTML = "";

  const data = rows && Array.isArray(rows) ? rows : generateSampleLogs();
  data.forEach(r => {
    const tr = document.createElement("tr");
    const timeCell = document.createElement("td");
    timeCell.textContent = new Date(r.ts).toLocaleString();
    const valCell = document.createElement("td");
    valCell.textContent = r.value;
    tr.appendChild(timeCell);
    tr.appendChild(valCell);
    tbody.appendChild(tr);

    // also append to main datalog for global view
    const tr2 = tr.cloneNode(true);
    const typeCell = document.createElement("td");
    typeCell.textContent = r.type || "detection";
    tr2.appendChild(typeCell);
    mainTbody.appendChild(tr2);
  });
}

function generateSampleLogs(){
  const now = Date.now();
  return Array.from({length:12}).map((_,i) => ({
    ts: new Date(now - i*60*60*1000).toISOString(),
    value: (Math.random()*100).toFixed(2),
    type: "detection"
  }));
}

function setStreamURL(url){
  const video = document.getElementById("livestream");
  if(!url){
    alert("Please paste a stream URL.");
    return;
  }
  // For HLS (.m3u8) most browsers need hls.js; here we just try to set src for mp4; if .m3u8 you would integrate hls.js
  if(url.endsWith(".m3u8")){
    // try HLS via hls.js if present
    if(window.Hls){
      if(window.Hls.isSupported()){
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        video.play().catch(()=>{});
        return;
      }
    }
    alert("HLS stream detected. Please include hls.js in the page or use a supported browser/player.");
    return;
  }
  video.src = url;
  video.play().catch(()=>{});
}

function embedYouTube(urlOrId){
  // Replace video element with iframe embed
  const wrap = document.querySelector(".video-wrap");
  let id = urlOrId;
  if(urlOrId.includes("youtube.com") || urlOrId.includes("youtu.be")){
    // extract id
    const m = urlOrId.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    if(m) id = m[1];
  }
  if(!id || id.length!==11){
    alert("Please provide a valid YouTube URL or video ID.");
    return;
  }
  wrap.innerHTML = `<iframe width="100%" height="420" src="https://www.youtube.com/embed/${id}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
}

// Refresh last values to show in card previews (optional)
async function refreshCardLastValues(){
  document.querySelectorAll(".card").forEach(async card => {
    const sensorId = card.dataset.sensor;
    try{
      const res = await fetch(`${API_BASE}/last?sensor=${encodeURIComponent(sensorId)}`);
      if(res.ok){
        const j = await res.json();
        const p = card.querySelector("p");
        if(j && j.value !== undefined) p.textContent = `Last: ${j.value} @ ${new Date(j.ts).toLocaleTimeString()}`;
      }
    }catch(e){
      // ignore
    }
  });
}
