import test from "node:test";
import assert from "node:assert/strict";
import { createChartScene, renderChartFrame, getChartLabels } from "../src/charts/chartRenderer.js";
import { chartPresets } from "../src/data/chartPresets.js";

const rows = [
  { id: "a", category: "A", value: 50, color: "#ff0000" },
  { id: "b", category: "B", value: 25, color: "#0000ff" },
];
const settings = (type) => structuredClone(chartPresets[type].defaults);
function context() {
  const rects = [];
  const texts = [];
  const stack = [];
  return {
    rects, texts, globalAlpha: 1, globalCompositeOperation: "source-over",
    save() { stack.push({ globalAlpha: this.globalAlpha, globalCompositeOperation: this.globalCompositeOperation }); },
    restore() { Object.assign(this, stack.pop()); },
    setTransform() {}, clearRect() {}, beginPath() {}, arc() {}, stroke() {},
    moveTo() {}, lineTo() {}, translate() {}, scale() {}, roundRect() {}, fill() {},
    fillRect(x, y, width, height) { rects.push({ x, y, width, height, color: this.fillStyle, composite: this.globalCompositeOperation }); },
    fillText(text, x, y) { texts.push({ text, x, y, alpha: this.globalAlpha }); },
  };
}

test("bar heights reflect absolute values and use the shared animation", () => {
  const scene = createChartScene(rows, settings("bar"), "bar");
  const half = context();
  renderChartFrame(half, scene, scene.animation.duration / 2);
  assert.equal(half.rects.length, 2);
  assert.equal(half.rects[0].height, scene.height / 2);
  assert.equal(half.rects[1].height, scene.height / 4);
  assert.equal(half.rects[0].color, "#ff0000");
  const complete = context();
  renderChartFrame(complete, scene);
  assert.equal(complete.rects[0].height, scene.height);
  assert.deepEqual(complete.texts.map(({ text }) => text), ["A", "50", "B", "25"]);
});

test("group uses one person per integer value and leaves unassigned people neutral", () => {
  const scene = createChartScene(rows, settings("group"), "group");
  assert.equal(scene.peopleCount, 100);
  assert.equal(scene.people.length, 75);
  assert.equal(scene.people.filter((color) => color === "#ff0000").length, 50);
  assert.equal(scene.people.filter((color) => color === "#0000ff").length, 25);
  const custom = settings("group");
  custom.appearance.peopleCount = 30;
  const limited = createChartScene(rows, custom, "group");
  assert.equal(limited.people.length, 30);
  for (const [requested, count] of [[0, 1], [1, 1], [99, 99], [500, 100]]) {
    custom.appearance.peopleCount = requested;
    assert.equal(createChartScene([], custom, "group").peopleCount, count);
  }
});

test("dragged label positions use stable row IDs and survive deletion of another row", () => {
  for (const type of ["donut", "bar", "group"]) {
    const original = settings(type);
    const base = getChartLabels(createChartScene(rows, original, type));
    const moved = settings(type);
    moved.labels.positions = { a: { x: -10, y: 20 } };
    const labels = getChartLabels(createChartScene(rows, moved, type));
    assert.equal(labels[0].x, base[0].x - 10);
    assert.equal(labels[0].y, base[0].y + 20);
    assert.deepEqual(labels[1], base[1]);
    moved.labels.positions.b = { x: 5, y: 10 };
    const remaining = getChartLabels(createChartScene([rows[1]], moved, type))[0];
    assert.equal(remaining.id, "b");
    assert.equal(remaining.y, remaining.anchorY + 10);
  }
});

test("labels stay reachable and can be hidden, including in progress mode", () => {
  const custom = settings("donut");
  custom.diagram.mode = "progress";
  custom.labels.positions.a = { x: 10000, y: -10000 };
  const scene = createChartScene(rows, custom, "donut");
  const labels = getChartLabels(scene);
  assert.equal(labels.length, 1);
  assert.equal(labels[0].lines[1], "50%");
  assert.ok(labels[0].x < 360 && labels[0].y > 0);
  custom.labels.showCategory = false;
  custom.labels.showValue = false;
  assert.deepEqual(getChartLabels(createChartScene(rows, custom, "donut")), []);
});

test("fixed background fills behind chart and transparent gaps for every type", () => {
  for (const type of ["donut", "bar", "group"]) {
    const custom = settings(type);
    custom.output = { transparent: false, backgroundColor: "#123456" };
    const ctx = context();
    renderChartFrame(ctx, createChartScene(rows, custom, type));
    assert.deepEqual(ctx.rects.at(-1), {
      x: 0, y: 0, width: 1080, height: 1920, color: "#123456", composite: "destination-over",
    });
    custom.output.transparent = true;
    const transparent = context();
    renderChartFrame(transparent, createChartScene(rows, custom, type));
    assert.ok(!transparent.rects.some((rect) => rect.composite === "destination-over"));
  }
});

test("all chart types and animation styles include complete labels in the final export frame", () => {
  for (const type of ["donut", "bar", "group"]) {
    for (const style of chartPresets[type].options.animation.styles) {
      const custom = settings(type);
      custom.animation.style = style;
      const scene = createChartScene(rows, custom, type);
      const ctx = context();
      renderChartFrame(ctx, scene, (scene.frameCount - 1) / 30);
      assert.ok(ctx.texts.length > 0);
      assert.ok(ctx.texts.every(({ alpha }) => alpha === 1));
      assert.equal(scene.animation.progressAt((scene.frameCount - 1) / 30), 1);
    }
  }
});
