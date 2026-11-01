import test from "node:test";
import assert from "node:assert/strict";
import {
  createAnimation,
  createDonutScene,
  renderDonutFrame,
  FPS,
} from "../src/charts/donut/donutRenderer.js";

const data = [
  { category: "A", value: 25, color: "#ff0000" },
  { category: "B", value: 75, color: "#0000ff" },
];
const settings = {
  diagram: { mode: "distribution" },
  animation: { style: "linear", duration: 2 },
  appearance: { size: 70, thickness: 30, positionX: 50, positionY: 28, rotation: 45, gap: 3 },
  labels: { showCategory: true, showValue: true, fontSize: 12, distance: 24 },
};

function recordingContext() {
  const arcs = [];
  const labels = [];
  const cuts = [];
  return {
    arcs, labels, cuts,
    save() {}, restore() {}, setTransform() {}, clearRect() {},
    beginPath() {}, moveTo() {}, lineTo() {},
    arc(...args) { arcs.push(args); },
    stroke() { cuts.push(this.globalCompositeOperation); },
    fillText(text, x, y) { labels.push({ text, x, y, opacity: this.globalAlpha }); },
  };
}

test("distribution follows one sweep, with transparent gaps and delayed labels", () => {
  const scene = createDonutScene(data, settings);
  const ctx = recordingContext();
  renderDonutFrame(ctx, scene, 0.5);
  assert.equal(ctx.arcs.length, 1, "the second segment has not begun at 25%");
  assert.ok(Math.abs(ctx.arcs[0][4] - Math.PI / 4) < 1e-10);
  assert.ok(ctx.cuts.includes("destination-out"));
  assert.ok(ctx.labels.every(({ opacity }) => opacity === 0));

  const final = recordingContext();
  renderDonutFrame(final, scene, (scene.frameCount - 1) / FPS);
  assert.equal(final.arcs.length, 2);
  assert.deepEqual(final.labels.map(({ text }) => text), ["A", "25%", "B", "75%"]);
  assert.ok(final.labels.every(({ opacity }) => opacity === 1), "the last video frame includes fully visible labels");
});

test("progress clamps to 0..100 and does not cut a seam or draw distribution labels", () => {
  for (const [value, expected] of [[-10, 0], [75, 0.75], [140, 1]]) {
    const scene = createDonutScene([{ ...data[0], value }], { ...settings, diagram: { mode: "progress" } });
    const ctx = recordingContext();
    renderDonutFrame(ctx, scene);
    assert.equal(scene.segments[0]?.percentage ?? 0, expected);
    assert.equal(ctx.labels.length, 0);
    assert.ok(!ctx.cuts.includes("destination-out"));
    if (expected > 0) assert.ok(Math.abs(ctx.arcs[0][4] - ctx.arcs[0][3] - expected * Math.PI * 2) < 1e-10);
  }
});

test("Motion easing is shared instead of a separate cubic approximation", () => {
  assert.equal(createAnimation({ style: "linear", duration: 2 }).progressAt(1), 0.5);
  const eased = createAnimation({ style: "easeOut", duration: 2 });
  assert.ok(Math.abs(eased.progressAt(1) - 0.6846233151445631) < 1e-6);
  assert.equal(eased.progressAt(-1), 0);
  assert.equal(eased.progressAt(3), 1);
});

test("both spring controls affect motion and slow springs finish before the last video frame", () => {
  for (const style of ["spring", "bounce"]) {
    const base = createAnimation({ style, stiffness: 90, damping: 15 });
    const stiff = createAnimation({ style, stiffness: 300, damping: 15 });
    const damped = createAnimation({ style, stiffness: 90, damping: 40 });
    assert.notEqual(base.progressAt(0.1), stiff.progressAt(0.1));
    assert.notEqual(base.progressAt(0.1), damped.progressAt(0.1));
    const slow = createDonutScene(data, { ...settings, animation: { style, stiffness: 20, damping: 40 } });
    assert.ok(slow.animation.duration > 2, "slow springs must not be cut off after 2 seconds");
    assert.ok(slow.frameCount < 1800, "stay within the export server's frame limit");
    assert.equal(slow.animation.progressAt((slow.frameCount - 1) / FPS), 1);
    assert.equal(base.progressAt(0), 0);
    assert.equal(base.progressAt(base.duration), 1);
    // Sampling out of order must work for replay and frame-by-frame export.
    const first = base.progressAt(0.1);
    base.progressAt(base.duration);
    assert.equal(base.progressAt(0.1), first);
  }
});

test("empty or zero-valued data produces a transparent canvas without NaN geometry", () => {
  for (const items of [[], [{ value: 0 }], [{ value: "invalid" }]]) {
    const scene = createDonutScene(items, settings);
    const ctx = recordingContext();
    renderDonutFrame(ctx, scene);
    assert.equal(ctx.arcs.length, 0);
    assert.equal(ctx.labels.length, 0);
  }
});
