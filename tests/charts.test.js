import test from "node:test";
import assert from "node:assert/strict";
import { createChartScene, renderChartFrame, getChartLabels, chartNames } from "../src/charts/chartRenderer.js";
import { chartPresets } from "../src/data/chartPresets.js";
import { chartData } from "../src/data/chartData.js";
import { waveValue } from "../src/charts/welle/welleRenderer.js";

function ctx() {
  const stack = [];
  return {
    rects: [], arcs: [], text: [], points: [], globalAlpha: 1, globalCompositeOperation: "source-over",
    save() { stack.push({ globalAlpha: this.globalAlpha, globalCompositeOperation: this.globalCompositeOperation }); },
    restore() { Object.assign(this, stack.pop()); },
    clearRect() {}, setTransform() {}, beginPath() {}, closePath() {}, stroke() {}, fill() {},
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

test("speed and bounce affect the single-visible-segment spring from current main", () => {
  const s = settings("donut");s.animation.style = "spring";
  const data = [chartData.donut[0]];
  s.animation.speed = 0;
  const slow = createChartScene(data, s, "donut");
  s.animation.speed = 100;
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
  const s = settings("bar");const scene = createChartScene(chartData.bar, s, "bar");
  const c = ctx();renderChartFrame(c, scene);
  assert.equal(c.rects.length, 3);
  assert.ok(Math.abs(c.rects[1].args[3] / c.rects[0].args[3] - 20 / 70) < 0.000001);
  assert.ok(c.text.some((l) => l.text === "70"));
});

test("group allocates integer counts up to 100 and keeps hidden categories neutral", () => {
  const s = settings("group");const scene = createChartScene(chartData.group, s, "group");
  assert.equal(scene.peopleCount, 100);assert.equal(scene.people.length, 75);
  const hidden = structuredClone(chartData.group);hidden[0].visible = false;
  const hiddenScene = createChartScene(hidden, s, "group");
  assert.equal(hiddenScene.people.filter(Boolean).length, 25);
  for (const [requested, expected] of [[0, 1], [30, 30], [200, 100]]) {
    s.appearance.peopleCount = requested;
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
