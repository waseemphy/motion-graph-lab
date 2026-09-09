const ids = ["s0", "u", "a", "duration", "inspectTime"];
const el = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));

const presets = {
  accelerate: { s0: 0, u: 5, a: 2, duration: 8 },
  brake: { s0: 0, u: 18, a: -3, duration: 10 },
  freefall: { s0: 20, u: 0, a: -9.8, duration: 4 }
};

const colors = { s: "#1b66ff", v: "#f97316", a: "#0891b2" };

function n(id) { return Number(el[id].value); }
function tidy(value, decimals = 1) {
  const rounded = Number(value.toFixed(decimals));
  return Object.is(rounded, -0) ? 0 : rounded;
}
function signed(value, suffix = "") {
  if (Math.abs(value) < 1e-9) return "";
  return `${value < 0 ? " − " : " + "}${Math.abs(tidy(value))}${suffix}`;
}

function equationText() {
  const s0 = n("s0"), u = n("u"), a = n("a");
  const halfA = a / 2;
  let s = `s = ${tidy(s0)}`;
  if (s0 === 0) s = "s =";
  s += signed(u, "t") + signed(halfA, "t²");
  if (s === "s =") s += " 0";
  let v = `v = ${tidy(u)}` + signed(a, "t");
  document.getElementById("sEquation").textContent = s.replace("= +", "=").replace("= −", "= −");
  document.getElementById("vEquation").textContent = v;
  document.getElementById("aEquation").textContent = `a = ${tidy(a)}`;
}

function makeSvg(svg, fn, color, symbol, unit) {
  const duration = n("duration"), inspect = n("inspectTime");
  const W = 520, H = 270, L = 54, R = 16, T = 18, B = 42;
  const plotW = W - L - R, plotH = H - T - B;
  const samples = Array.from({ length: 101 }, (_, i) => ({ t: duration * i / 100, y: fn(duration * i / 100) }));
  let yMin = Math.min(0, ...samples.map(p => p.y));
  let yMax = Math.max(0, ...samples.map(p => p.y));
  let span = yMax - yMin;
  if (span < 1) { yMin -= 1; yMax += 1; span = yMax - yMin; }
  const pad = span * .12;
  yMin -= pad; yMax += pad;
  const X = t => L + (t / duration) * plotW;
  const Y = y => T + ((yMax - y) / (yMax - yMin)) * plotH;
  const xAxisY = Y(0);
  const path = samples.map((p, i) => `${i ? "L" : "M"}${X(p.t).toFixed(2)},${Y(p.y).toFixed(2)}`).join(" ");
  const grid = [];
  for (let i = 0; i <= 4; i++) {
    const yVal = yMin + (yMax - yMin) * i / 4;
    const y = Y(yVal);
    grid.push(`<line x1="${L}" y1="${y}" x2="${W-R}" y2="${y}" class="grid"/><text x="${L-8}" y="${y+4}" text-anchor="end" class="tick">${tidy(yVal)}</text>`);
  }
  for (let i = 0; i <= 4; i++) {
    const t = duration * i / 4, x = X(t);
    grid.push(`<line x1="${x}" y1="${T}" x2="${x}" y2="${H-B}" class="grid"/><text x="${x}" y="${H-B+22}" text-anchor="middle" class="tick">${tidy(t)}</text>`);
  }
  const cx = X(inspect), cy = Y(fn(inspect));
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = `
    <style>.grid{stroke:#e4eaf2;stroke-width:1}.axis{stroke:#718096;stroke-width:1.4}.tick,.label{font-family:Inter,system-ui,sans-serif;fill:#718096;font-size:12px}.curve{fill:none;stroke:${color};stroke-width:4;stroke-linecap:round;stroke-linejoin:round}.cursor{stroke:#9aa8ba;stroke-width:1.3;stroke-dasharray:5 5}.point{fill:white;stroke:${color};stroke-width:4}</style>
    ${grid.join("")}
    <line x1="${L}" y1="${xAxisY}" x2="${W-R}" y2="${xAxisY}" class="axis"/>
    <line x1="${L}" y1="${T}" x2="${L}" y2="${H-B}" class="axis"/>
    <text x="${W-R}" y="${H-8}" text-anchor="end" class="label">t / s</text>
    <text x="${L}" y="12" class="label">${symbol} / ${unit}</text>
    <path d="${path}" class="curve"/>
    <line x1="${cx}" y1="${T}" x2="${cx}" y2="${H-B}" class="cursor"/>
    <circle cx="${cx}" cy="${cy}" r="6" class="point"/>
  `;
}

function describeMotion(u, a, t) {
  const v = u + a * t;
  if (Math.abs(v) < .05) return "At this instant, the object is momentarily at rest. It may be about to reverse direction.";
  if (Math.abs(a) < .05) return `The object is moving in the ${v > 0 ? "positive" : "negative"} direction at constant velocity.`;
  const speeding = Math.sign(v) === Math.sign(a);
  return `The object is moving in the ${v > 0 ? "positive" : "negative"} direction and ${speeding ? "speeding up" : "slowing down"} because velocity and acceleration have ${speeding ? "the same" : "opposite"} signs.`;
}

function update() {
  const s0 = n("s0"), u = n("u"), a = n("a"), d = n("duration");
  el.inspectTime.max = d;
  if (n("inspectTime") > d) el.inspectTime.value = d / 2;
  const t = n("inspectTime");
  const sFn = x => s0 + u * x + .5 * a * x * x;
  const vFn = x => u + a * x;
  document.getElementById("s0Output").textContent = `${tidy(s0)} m`;
  document.getElementById("uOutput").textContent = `${tidy(u)} m s⁻¹`;
  document.getElementById("aOutput").textContent = `${tidy(a)} m s⁻²`;
  document.getElementById("durationOutput").textContent = `${tidy(d)} s`;
  document.getElementById("timeOutput").textContent = `${t.toFixed(1)} s`;
  document.getElementById("sValue").textContent = `${sFn(t).toFixed(1)} m`;
  document.getElementById("vValue").textContent = `${vFn(t).toFixed(1)} m s⁻¹`;
  document.getElementById("aValue").textContent = `${a.toFixed(1)} m s⁻²`;
  document.getElementById("finalS").textContent = `${sFn(d).toFixed(1)} m`;
  document.getElementById("finalV").textContent = `${vFn(d).toFixed(1)} m s⁻¹`;
  const turn = Math.abs(a) > 1e-9 ? -u / a : -1;
  document.getElementById("turningPoint").textContent = turn > 0 && turn <= d ? `${turn.toFixed(2)} s` : "None";
  document.getElementById("motionInsight").textContent = describeMotion(u, a, t);
  equationText();
  makeSvg(document.getElementById("sGraph"), sFn, colors.s, "s", "m");
  makeSvg(document.getElementById("vGraph"), vFn, colors.v, "v", "m s⁻¹");
  makeSvg(document.getElementById("aGraph"), () => a, colors.a, "a", "m s⁻²");
}

ids.forEach(id => el[id].addEventListener("input", update));
document.querySelectorAll("[data-preset]").forEach(button => button.addEventListener("click", () => {
  const p = presets[button.dataset.preset];
  Object.entries(p).forEach(([key, value]) => { el[key].value = value; });
  el.inspectTime.value = p.duration / 2;
  update();
}));
document.getElementById("resetButton").addEventListener("click", () => {
  Object.entries(presets.accelerate).forEach(([key, value]) => { el[key].value = value; });
  el.inspectTime.value = 4;
  update();
});

update();
