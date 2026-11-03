import test from 'node:test';
import assert from 'node:assert/strict';
import { parseChartCsv } from '../src/utils/csv.js';
import { raceState } from '../src/charts/bar/raceRenderer.js';
import { createChartScene, renderChartFrame } from '../src/charts/chartRenderer.js';
import { chartPresets } from '../src/data/chartPresets.js';
import { chartData } from '../src/data/chartData.js';
import { snapRotation } from '../src/charts/transform.js';

test('CSV accepts quoted names, BOM, semicolons and decimal commas', () => {
  const data = parseChartCsv('\uFEFFkategorie;wert\r\n"Ja, sicher";"40,5"\r\n"Nein ""danke""";30');
  assert.equal(data[0].category, 'Ja, sicher'); assert.equal(data[0].value, 40.5);
  assert.equal(data[1].category, 'Nein "danke"'); assert.equal(data[0].color, '#a855f7');
});
test('CSV rejects invalid headers, values, quotes, duplicates and chart limits', () => {
  for (const csv of ['name,zahl\nA,1', 'kategorie,wert\nA,abc', 'kategorie,wert\nA,-1', 'kategorie,wert\n,2',
    'kategorie,wert\n"A,2', 'kategorie,wert\nA,2\nA,3', 'kategorie,wert\nA,Infinity']) {
    assert.throws(() => parseChartCsv(csv));
  }
  assert.throws(() => parseChartCsv('kategorie,wert\nA,20\nB,30', { maxRows: 1 }));
  assert.throws(() => parseChartCsv('kategorie,wert\nA,101', { maxTotal: 100 }));
  assert.throws(() => parseChartCsv('kategorie,wert\nA,1.2', { integer: true }));
});
test('race CSV requires numeric time, two periods and unique category/time pairs', () => {
  const csv = 'kategorie,wert,zeit\nA,10,2020\nB,20,2020\nA,30,2021\nB,5,2021';
  assert.equal(parseChartCsv(csv, { race: true }).length, 4);
  for (const bad of ['kategorie,wert,zeit\nA,10,heute', 'kategorie,wert,zeit\nA,10,2020', csv+'\nA,4,2021'])
    assert.throws(() => parseChartCsv(bad, { race: true }));
});
test('race starts at first-year values and interpolates values and rank positions', () => {
  const data = parseChartCsv('kategorie,wert,zeit\nA,10,2020\nB,20,2020\nA,30,2021\nB,5,2021', { race: true });
  const scene = createChartScene(data, chartPresets.race.defaults, 'race');
  assert.equal(raceState(scene, 0).rows.find(r=>r.category==='B').rank, 0);
  const middle = raceState(scene, 5); assert.equal(middle.year, 2020.5);
  assert.equal(middle.rows.find(r=>r.category==='A').value, 20);
  assert.equal(middle.rows.find(r=>r.category==='A').rank, 0.5);
  assert.equal(raceState(scene, 10).rows.find(r=>r.category==='A').rank, 0);
  assert.equal(new Set(chartData.race.map(r=>r.category)).size, 10);
});
test('all charts include start delay, end hold and three pulse cycles in export frames', () => {
  for (const type of Object.keys(chartPresets)) {
    const s = structuredClone(chartPresets[type].defaults);
    const base = createChartScene(chartData[type], s, type);
    Object.assign(s.animation, { delayStart: 1.5, delayEnd: 2, pulse: true });
    const scene = createChartScene(chartData[type], s, type);
    assert.equal(scene.delayStart, 1.5); assert.equal(scene.delayEnd, 2);
    assert.ok(scene.totalDuration >= base.totalDuration + 3.5);
    assert.ok(scene.contentDuration >= s.animation.duration + 7.2);
    assert.equal(scene.frameCount, Math.ceil(scene.totalDuration*30)+1);
  }
});
test('rotation snaps near quadrants including wraparound', () => {
  for (const [angle, expected] of [[87,90],[184,180],[266,270],[358,360],[2,0],[-2,360],[45,45]])
    assert.equal(snapRotation(angle), expected);
});
test('radial donut grows whole segments from center and ends at original geometry', () => {
  const settings = structuredClone(chartPresets.donut.defaults); settings.animation.style = 'radial';
  const scene = createChartScene(chartData.donut, settings, 'donut');
  const arcs = [];
  const ctx = { save(){}, restore(){}, setTransform(){}, clearRect(){}, beginPath(){}, stroke(){}, moveTo(){}, lineTo(){}, arc(...a){arcs.push(a);} };
  renderChartFrame(ctx, scene, 0); assert.equal(arcs.length,0);
  renderChartFrame(ctx, scene, 0.5); assert.ok(arcs[0][2] < scene.outerRadius);
  arcs.length=0; renderChartFrame(ctx, scene, scene.totalDuration);
  assert.equal(arcs[0][2], scene.outerRadius-scene.thickness/2);
});
