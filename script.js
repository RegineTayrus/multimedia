// Does all the math. Returns an object with the results, or a warning text.
function compute(freq, amp, n, bits) {
  // ----- Warnings (check the inputs first) -----
  if (isNaN(freq) || freq <= 0) return { warning: "Warning: Frequency must be greater than 0." };
  if (isNaN(amp) || amp < 0 || amp > 1) return { warning: "Warning: Amplitude must be from 0 to 1." };
  if (isNaN(n) || !Number.isInteger(n) || n < 2 || n > 64) return { warning: "Warning: Samples must be a whole number from 2 to 64." };
  if (isNaN(bits) || !Number.isInteger(bits) || bits < 1 || bits > 8) return { warning: "Warning: Bits must be a whole number from 1 to 8." };

  // ----- Wave facts -----
  var periodMs = (1 / freq) * 1000;      // period in milliseconds
  var wavelengthM = 343 / freq;          // wavelength in meters
  var levels = Math.pow(2, bits);        // number of levels

  // ----- One row per sample (loop) -----
  var rows = [];
  var allBinary = [];
  for (var i = 0; i < n; i++) {
    var time = i * periodMs / n;                           // time of sample i
    var height = amp * Math.sin(2 * Math.PI * i / n);      // height of sample i (no frequency here)
    height = Math.round(height * 1e10) / 1e10;             // clean tiny float errors (like 1.2e-16)
    var level = Math.round((height + 1) / 2 * (levels - 1));  // level of sample i
    var binary = level.toString(2).padStart(bits, "0");    // binary with leading zeros
    rows.push({ num: i + 1, time: time, height: height, level: level, binary: binary });
    allBinary.push(binary);
  }
  return {
    periodMs: periodMs, wavelengthM: wavelengthM, rows: rows,
    binaryLine: allBinary.join(" "), totalBits: n * bits
  };
}

// Make "-0.00" look like "0.00"
function fix2(x) {
  var s = x.toFixed(2);
  return s === "-0.00" ? "0.00" : s;
}

// Draws one full wave and a dot for every sample
function drawWave(amp, n, rows) {
  var W = 640, H = 200, mid = H / 2, pad = 24, top = 70 * (amp || 0.05) + 6;
  var d = "";
  for (var x = 0; x <= 200; x++) {
    var px = pad + (W - 2 * pad) * x / 200;
    var py = mid - 80 * amp * Math.sin(2 * Math.PI * x / 200);
    d += (x === 0 ? "M" : "L") + px.toFixed(1) + " " + py.toFixed(1) + " ";
  }
  var dots = "";
  for (var i = 0; i < rows.length; i++) {
    var cx = pad + (W - 2 * pad) * i / n;
    var cy = mid - 80 * rows[i].height;
    dots += "<line x1='" + cx.toFixed(1) + "' y1='" + mid + "' x2='" + cx.toFixed(1) + "' y2='" + cy.toFixed(1) + "' stroke='#ffb8a1' stroke-width='2'/>" +
            "<circle cx='" + cx.toFixed(1) + "' cy='" + cy.toFixed(1) + "' r='6' fill='#3b2a5a'/>";
  }
  document.getElementById("waveArea").innerHTML =
    "<svg viewBox='0 0 " + W + " " + H + "' role='img' aria-label='Wave with sample points'>" +
    "<line x1='" + pad + "' y1='" + mid + "' x2='" + (W - pad) + "' y2='" + mid + "' stroke='#d9ccf5' stroke-width='2'/>" +
    "<path d='" + d + "' fill='none' stroke='#8d6fd1' stroke-width='4' stroke-linecap='round'/>" + dots + "</svg>";
}

// Show the results on the page
function onConvert() {
  var freqText = document.getElementById("freq").value;
  var ampText = document.getElementById("amp").value;
  var freq = parseFloat(freqText);
  var amp = parseFloat(ampText);
  var n = Number(document.getElementById("samples").value);
  var bits = Number(document.getElementById("bits").value);

  var r = compute(freq, amp, n, bits);

  if (r.warning) {   // invalid numbers: show warning, clear the rest, don't break
    document.getElementById("warning").textContent = r.warning;
    document.getElementById("facts").innerHTML = "";
    document.getElementById("tableArea").innerHTML = "";
    document.getElementById("binaryArea").innerHTML = "";
    document.getElementById("waveArea").innerHTML = "";
    return;
  }
  document.getElementById("warning").textContent = "";

  // wavelength unit: meters if 1 m or more, centimeters if less than 1 m
  var wlText = r.wavelengthM >= 1
    ? r.wavelengthM.toFixed(2) + " m"
    : (r.wavelengthM * 100).toFixed(1) + " cm";

  document.getElementById("facts").innerHTML =
    "<h2>Wave Facts</h2>" +
    "<p><span class='chip'>Amplitude: " + ampText + "</span>" +
    "<span class='chip'>Frequency: " + freqText + " Hz</span>" +
    "<span class='chip'>Period: " + r.periodMs.toFixed(2) + " ms</span>" +
    "<span class='chip'>Wavelength: " + wlText + "</span></p>";

  var html = "<table><tr><th>Sample #</th><th>Time (ms)</th><th>Amplitude</th><th>Level</th><th>Binary</th></tr>";
  for (var k = 0; k < r.rows.length; k++) {
    var row = r.rows[k];
    html += "<tr><td>" + row.num + "</td><td>" + row.time.toFixed(2) + "</td><td>" +
            fix2(row.height) + "</td><td>" + row.level + "</td><td>" + row.binary + "</td></tr>";
  }
  html += "</table>";
  document.getElementById("tableArea").innerHTML = html;

  document.getElementById("binaryArea").innerHTML =
    "<h2>Binary result</h2><p class=\"bin\">" + r.binaryLine + "</p>" +
    "<p><b>Total bits:</b> " + r.totalBits + "</p>";
  drawWave(amp, n, r.rows);
}

document.getElementById("convertBtn").addEventListener("click", onConvert);

// Wavelength text with unit (m if 1 m or more, cm if less)
function wavelengthText(m) {
  return m >= 1 ? m.toFixed(2) + " m" : (m * 100).toFixed(1) + " cm";
}


// Fill the Test Results table automatically when the page opens
var testRows = document.querySelectorAll("tr[data-test]");
for (var t = 0; t < testRows.length; t++) {
  var c = testRows[t].cells;
  var r = compute(parseFloat(c[1].textContent), parseFloat(c[2].textContent),
                  Number(c[3].textContent), Number(c[4].textContent));
  c[5].textContent = r.periodMs.toFixed(2) + " ms";
  c[6].textContent = wavelengthText(r.wavelengthM);
  c[7].textContent = r.totalBits;
  c[8].textContent = r.binaryLine;
}

// Play the tone for 1 second at the typed frequency (Web Audio API)
var audioCtx = null;
function playTone() {
  var freq = parseFloat(document.getElementById("freq").value);
  var amp = parseFloat(document.getElementById("amp").value);
  var n = Number(document.getElementById("samples").value);
  var bits = Number(document.getElementById("bits").value);
  var warn = document.getElementById("warning");
  // Same rules as Convert: if ANY input is invalid, show the warning and play NO sound
  var check = compute(freq, amp, n, bits);
  if (check.warning) { warn.textContent = check.warning; return; }
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) { warn.textContent = "Sorry, this browser cannot play sound."; return; }
  warn.textContent = "";
  if (!audioCtx) audioCtx = new AC();
  if (audioCtx.state === "suspended") audioCtx.resume();

  var osc = audioCtx.createOscillator();
  var gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  // amplitude sets the loudness, kept gentle, with a short fade in/out so it does not click
  var vol = (isNaN(amp) ? 0.5 : Math.min(Math.max(amp, 0), 1)) * 0.25;
  var now = audioCtx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(vol, now + 0.03);
  gain.gain.setValueAtTime(vol, now + 0.97);
  gain.gain.linearRampToValueAtTime(0, now + 1);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 1);
}
document.getElementById("playBtn").addEventListener("click", playTone);

// Show the wave right away, and keep the drawing in step with the inputs
function previewWave() {
  var f = parseFloat(document.getElementById("freq").value);
  var am = parseFloat(document.getElementById("amp").value);
  var n = Number(document.getElementById("samples").value);
  var b = Number(document.getElementById("bits").value);
  var r = compute(f, am, n, b);
  if (r.warning) { document.getElementById("waveArea").innerHTML = ""; return; }  // bad input: no drawing
  drawWave(am, n, r.rows);
}
var waveInputs = ["freq", "amp", "samples", "bits"];
for (var w = 0; w < waveInputs.length; w++) {
  document.getElementById(waveInputs[w]).addEventListener("input", previewWave);
}
onConvert();   // show the default results and wave as soon as the page opens

// ----- Editing tools (these are removed from the downloaded copy) -----
var draftFields = document.querySelectorAll(".draft");

function updateWho() {
  var un = document.getElementById("userName"), us = document.getElementById("userSection");
  if (!un || !us) return;
  var name = un.value.trim(), sec = us.value.trim();
  document.getElementById("whoLine").textContent =
    (name || sec) ? (name || "Name") + "  |  " + (sec || "Section") : "Type your name and section below.";
}

// Keep a draft in this browser so nothing is lost if you refresh
function saveDraft() {
  try {
    var all = [];
    for (var d = 0; d < draftFields.length; d++) all.push(draftFields[d].value);
    localStorage.setItem("s2bDraft", JSON.stringify(all));
  } catch (e) {}
}
try {
  var savedDraft = JSON.parse(localStorage.getItem("s2bDraft") || "[]");
  for (var d = 0; d < draftFields.length; d++) { if (savedDraft[d]) draftFields[d].value = savedDraft[d]; }
} catch (e) {}
for (var d = 0; d < draftFields.length; d++) {
  draftFields[d].addEventListener("input", function () { saveDraft(); updateWho(); });
}
updateWho();

// Download a finished copy: name, section, and answers become plain text on the page
function downloadFinished() {
  var empty = 0;
  for (var d = 0; d < draftFields.length; d++) { if (!draftFields[d].value.trim()) empty++; }
  if (empty > 0 && !confirm(empty + " field(s) are still empty. Download anyway?")) return;

  var clone = document.documentElement.cloneNode(true);
  var live = document.querySelectorAll("textarea.draft");
  var inClone = clone.querySelectorAll("textarea.draft");
  for (var i = 0; i < inClone.length; i++) {
    var p = document.createElement("p");
    p.className = "saved";
    p.textContent = live[i].value.trim() || "(no answer)";
    inClone[i].replaceWith(p);
  }
  var name = document.getElementById("userName").value.trim();
  var sec = document.getElementById("userSection").value.trim();
  var whoClone = clone.querySelector("#whoLine");
  whoClone.textContent = (name || "Name") + "  |  " + (sec || "Section");
  whoClone.style.display = "block";
  var editOnly = clone.querySelectorAll(".edit-only");
  for (var j = 0; j < editOnly.length; j++) editOnly[j].remove();

  var blob = new Blob(["<!DOCTYPE html>\n" + clone.outerHTML], { type: "text/html" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "index.html";
  a.click();
}
var dlBtn = document.getElementById("dlBtn");
if (dlBtn) dlBtn.addEventListener("click", downloadFinished);
