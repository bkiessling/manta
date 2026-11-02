import test from "node:test";
import assert from "node:assert/strict";
import { createChartScene, renderChartFrame, getChartLabels, chartNames } from "../src/charts/chartRenderer.js";
import { chartPresets } from "../src/data/chartPresets.js";
import { chartData } from "../src/data/chartData.js";
import { getBarLayout } from "../src/charts/bar/barRenderer.js";
import { groupPulse, GROUP_PULSE_DURATION } from "../src/charts/group/groupRenderer.js";
import { waveValue } from "../src/charts/welle/welleRenderer.js";

function ctx() {
  const stack = [];
  return {
    rects: [], arcs: [], text: [], points: [], fills: [], globalAlpha: 1, globalCompositeOperation: "source-over",
    save() { stack.push({ globalAlpha: this.globalAlpha, globalCompositeOperation: this.globalCompositeOperation }); },
    restore() { Object.assign(this, stack.pop()); },
    clearRect() {}, setTransform() {}, beginPath() {}, closePath() {}, stroke() {}, fill() { this.fills.push(this.fillStyle); },
    translate() {}, scale() {}, roundRect() {}, strokeText() {},
    arc(...args) { this.arcs.push(args); },
    moveTo(...args) { this.points.push(args); }, lineTo(...args) { this.points.push(args); },
    fillRect(...args) { this.rects.push({ args, color: this.fillStyle, composite: this.globalCompositeOperation }); },
    fillText(text, x, y) { this.text.push({ text, x, y, alpha: this.globalAlpha }); },
  };
}
const settings = (type) => structuredClone(chartPresets[type].defaults);

test("registry includes current main chart types and keeps the new speed/bounce controls", () => {
  assert.deepEqual(Object.keys(chartNames).sort(), ["bar", "donut", "explosion", "group", "welle"]);
  for (const type of Object.keys(chartNames)) {
    assert.ok(chartData[type].length > 0);
    assert.equal(chartPresets[type].defaults.animation.speed, 50);
    assert.equal(chartPresets[type].defaults.animation.bounce, 35);
  }
});

test("hidden donut categories keep their original angular share and number/percent formatting", () => {
  const data = [
    { id: "a", category: "A", value: 70, color: "#ff0000", visible: false },
    { id: "b", category: "B", value: 30, color: "#0000ff", visible: true },
  ];
  const s = settings("donut");s.labels.showValue = true;
  const scene = createChartScene(data, s, "donut");
  const drawn = ctx();renderChartFrame(drawn, scene);
  assert.equal(drawn.arcs.length, 1);
  assert.ok(Math.abs((drawn.arcs[0][4] - drawn.arcs[0][3]) - Math.PI * 0.6) < 0.00001);
  assert.deepEqual(getChartLabels(scene).map((l) => l.lines), [["30 %"]]);
  s.format = "number";
  assert.deepEqual(getChartLabels(createChartScene(data, s, "donut"))[0].lines, ["30"]);
});

test("duration and bounce affect the single-visible-segment spring", () => {
  const s = settings("donut");s.animation.style = "spring";
  const data = [chartData.donut[0]];
  s.animation.duration = 8;
  const slow = createChartScene(data, s, "donut");
  s.animation.duration = 0.6;
  const fast = createChartScene(data, s, "donut");
  assert.equal(slow.animation.duration, 8);
  assert.ok(Math.abs(fast.animation.duration - 0.6) < 0.00001);
  s.animation.bounce = 0;
  const noBounce = createChartScene(data, s, "donut");
  s.animation.bounce = 100;
  const bounced = createChartScene(data, s, "donut");
  assert.notEqual(noBounce.animation.progressAt(0.2), bounced.animation.progressAt(0.2));
  assert.equal(createChartScene(chartData.donut, s, "donut").animationStyle, "tween");
});

test("donut segments retain sequential timing instead of receiving a global easing sweep", () => {
  const s = settings("donut");s.animation.style = "easeOut";s.appearance.gap = 0;
  const data = [{ value: 50 }, { value: 50 }];
  const c = ctx();renderChartFrame(c, createChartScene(data, s, "donut"), 0.5);
  assert.equal(c.arcs.length, 1, "second segment waits until the first segment duration has elapsed");
});

test("wave height and speed control the surface, while fill values stay bounded", () => {
  const s = settings("welle");
  const scene = createChartScene(chartData.welle, s, "welle");
  assert.equal(waveValue(scene, 0), 0);
  assert.equal(waveValue(scene, scene.animation.duration), 75);
  const a = ctx();renderChartFrame(a, scene, 1);
  s.appearance.waveSpeed = 0;
  const b = ctx();renderChartFrame(b, createChartScene(chartData.welle, s, "welle"), 1);
  assert.notDeepEqual(a.points, b.points);
  s.appearance.waveHeight = 0;
  const c = ctx();renderChartFrame(c, createChartScene(chartData.welle, s, "welle"), 1);
  assert.equal(new Set(c.points.slice(0, 121).map((p) => p[1])).size, 1);
});

test("explosion retains growing number, particle phase and the complete burst in export", () => {
  const s = settings("explosion");const scene = createChartScene(chartData.explosion, s, "explosion");
  const initial = ctx();renderChartFrame(initial, scene, 0);
  assert.equal(initial.text[0].text, "75");
  const burst = ctx();renderChartFrame(burst, scene, scene.animation.duration + 0.2);
  assert.equal(burst.text.length, 0);
  assert.equal(burst.arcs.length, s.appearance.particleCount);
  assert.ok(scene.totalDuration >= scene.animation.duration + 0.65);
  const final = ctx();renderChartFrame(final, scene);
  assert.equal(final.arcs.length, 0);
  const paused = ctx();renderChartFrame(paused, scene, 0, { staticPreview: true });
  assert.equal(paused.text[0].text, "75");
});

test("bars preserve value ratios, hidden categories and absolute number formatting", () => {
  const s = settings("bar");s.appearance.orientation = "vertical";const scene = createChartScene(chartData.bar, s, "bar");
  const c = ctx();renderChartFrame(c, scene);
  assert.equal(c.rects.length, 3);
  assert.ok(Math.abs(c.rects[1].args[3] / c.rects[0].args[3] - 20 / 70) < 0.000001);
  assert.ok(c.text.some((l) => l.text === "70"));
});

test("group allocates integer counts up to 100 and leaves hidden category slots empty", () => {
  const s = settings("group");const scene = createChartScene(chartData.group, s, "group");
  assert.equal(scene.peopleCount, 100);assert.equal(scene.people.length, 75);
  const hidden = structuredClone(chartData.group);hidden[0].visible = false;
  const hiddenScene = createChartScene(hidden, s, "group");
  assert.equal(hiddenScene.people.filter(Boolean).length, 25);
  for (const [columns, rows, expected] of [[0, 0, 1], [3, 10, 30], [20, 20, 100]]) {
    s.appearance.gridColumns = columns;s.appearance.gridRows = rows;
    const limited = createChartScene(chartData.group, s, "group");
    assert.equal(limited.peopleCount, expected);assert.ok(limited.people.length <= expected);
  }
});

test("all chart types retain stable draggable labels and selectable backgrounds", () => {
  for (const type of Object.keys(chartNames)) {
    const s = settings(type);s.labels.showCategory = true;s.labels.showValue = true;
    const original = getChartLabels(createChartScene(chartData[type], s, type))[0];
    s.labels.positions[original.id] = { x: -10, y: 20 };
    const moved = getChartLabels(createChartScene(chartData[type], s, type))[0];
    assert.equal(moved.x, original.x - 10);assert.equal(moved.y, original.y + 20);
    s.output = { transparent: false, backgroundColor: "#123456" };
    const c = ctx();renderChartFrame(c, createChartScene(chartData[type], s, type));
    assert.equal(c.rects.at(-1).color, "#123456");
    assert.equal(c.rects.at(-1).composite, "destination-over");
  }
});


test("font size means the same pixels for labels on all five charts", () => {
  for (const type of Object.keys(chartNames)) {
    const s = settings(type);s.labels.fontSize = 30;s.labels.showCategory = true;s.labels.showValue = true;
    assert.ok(getChartLabels(createChartScene(chartData[type], s, type)).every((label) => label.fontSize === 30));
  }
});

test("horizontal bars use length ratios and distinct left-side label positions", () => {
  const s = settings("bar");s.appearance.orientation = "vertical";const vertical = createChartScene(chartData.bar, s, "bar");
  const vLabel = getChartLabels(vertical)[0];
  s.labels.positions[vLabel.id] = { x: -10, y: 20 };
  s.appearance.orientation = "horizontal";
  const horizontal = createChartScene(chartData.bar, s, "bar");
  const c = ctx();renderChartFrame(c, horizontal);
  assert.ok(Math.abs(c.rects[1].args[2] / c.rects[0].args[2] - 20 / 70) < 0.000001);
  const plot = getBarLayout(horizontal);
  const labels = getChartLabels(horizontal);
  assert.ok(labels[0].x + labels[0].width / 2 < plot.left);
  assert.equal(labels[0].y, plot.top + plot.step / 2);
  assert.notEqual(labels[0].id, vLabel.id);
  s.appearance.orientation = "vertical";
  assert.equal(getChartLabels(createChartScene(chartData.bar, s, "bar"))[0].y, vLabel.y + 20);
});

test("group people appear without gray placeholders individually or per category", () => {
  const s = settings("group");let scene = createChartScene(chartData.group, s, "group");
  const start = ctx();renderChartFrame(start, scene, 0);assert.equal(start.arcs.length, 0);
  const single = ctx();renderChartFrame(single, scene, scene.animation.duration * 0.02);
  assert.equal(single.arcs.length, 2, "only the first two people have begun appearing");
  s.animation.groupMode = "category";scene = createChartScene(chartData.group, s, "group");
  const batch = ctx();renderChartFrame(batch, scene, scene.animation.duration * 0.02);
  assert.equal(batch.arcs.length, 50, "the whole first category appears together");
  const final = ctx();renderChartFrame(final, scene);
  assert.equal(final.arcs.length, 75);
  assert.ok(!final.fills.includes("#b5b5bc"));
});

test("optional group pulse ends at original size and is included in export duration", () => {
  const s = settings("group");const normal = createChartScene(chartData.group, s, "group");
  s.animation.pulse = true;const pulse = createChartScene(chartData.group, s, "group");
  assert.ok(pulse.totalDuration > normal.totalDuration);
  assert.equal(pulse.totalDuration, pulse.animation.duration + GROUP_PULSE_DURATION);
  assert.equal(groupPulse(pulse, pulse.animation.duration), 1);
  assert.ok(groupPulse(pulse, pulse.animation.duration + GROUP_PULSE_DURATION / 2) > 1.07);
  assert.equal(groupPulse(pulse, (pulse.frameCount - 1) / 30), 1);
});


test("duration accepts fractional seconds beyond the old five-second limit", () => {
  for (const type of Object.keys(chartNames)) {
    const s = settings(type);s.animation.duration = 12.5;
    const scene = createChartScene(chartData[type], s, type);
    assert.equal(scene.animation.duration, 12.5);
    assert.ok(scene.frameCount >= 376);
  }
});

test("inline labels place value after category and end placement follows column geometry", () => {
  const s = settings("bar");s.labels.layout = "inline";s.labels.placement = "end";
  s.appearance.orientation = "vertical";
  const scene = createChartScene(chartData.bar, s, "bar");
  const labels = getChartLabels(scene);
  assert.deepEqual(labels[0].lines, ["Instagram · 70"]);
  assert.ok(labels[0].y < scene.cy - scene.height / 2);
});


test("transformed label coordinates invert correctly after rotation and proportional scaling", async () => {
  const { chartTransform, transformPoint } = await import("../src/charts/transform.js");
  for (const type of Object.keys(chartNames)) {
    const s = settings(type);s.appearance.transformScale = 1.7;s.appearance.transformRotation = 37;
    const t = chartTransform(createChartScene(chartData[type], s, type));
    const original = { x: 110, y: 260 };
    const restored = transformPoint(transformPoint(original, t), t, true);
    assert.ok(Math.abs(restored.x - original.x) < 1e-8);
    assert.ok(Math.abs(restored.y - original.y) < 1e-8);
  }
});


test("group grid starts at 10 by 10 and uses explicit row and column geometry", () => {
  const s = settings("group");
  assert.equal(s.appearance.gridColumns, 10);assert.equal(s.appearance.gridRows, 10);
  s.appearance.gridColumns = 5;s.appearance.gridRows = 15;
  const scene = createChartScene(chartData.group, s, "group");
  assert.equal(scene.people.length, 75);assert.equal(scene.gridColumns, 5);
  assert.ok(Math.abs(scene.height / scene.width - 4.5) < 1e-8);
});
