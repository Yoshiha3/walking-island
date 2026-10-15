import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scatter } from '../src/world/scatter.js';
import { createIsland, SEA_LEVEL } from '../src/world/heightmap.js';

const island = createIsland({ seed: 1 });
const base = { seed: 10, count: 80, area: island.radius, heightAt: island.heightAt };

test('同じ条件なら同じ配置になる', () => {
  assert.deepEqual(scatter(base), scatter(base));
});

test('シードが違えば配置も変わる', () => {
  assert.notDeepEqual(scatter(base), scatter({ ...base, seed: 11 }));
});

test('指定した高さの範囲にだけ置かれ、y は地面の高さになる', () => {
  const points = scatter({ ...base, minHeight: SEA_LEVEL + 1, maxHeight: 8 });
  assert.ok(points.length > 0);
  for (const p of points) {
    assert.ok(p.y >= SEA_LEVEL + 1 && p.y <= 8);
    assert.equal(p.y, island.heightAt(p.x, p.z));
  }
});

test('最小間隔より近くには置かれない', () => {
  const points = scatter({ ...base, minDistance: 6 });
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const d = Math.hypot(points[i].x - points[j].x, points[i].z - points[j].z);
      assert.ok(d >= 6, `${i} と ${j} の距離 ${d}`);
    }
  }
});

test('避ける範囲 (clearings) と他の物 (avoid) の近くには置かれない', () => {
  const clearings = [{ x: 0, z: 40, radius: 8 }];
  const avoid = [{ x: 10, y: 0, z: 10, rotation: 0, scale: 1, variant: 0 }];
  const points = scatter({ ...base, minDistance: 3, clearings, avoid });
  for (const p of points) {
    assert.ok(Math.hypot(p.x, p.z - 40) >= 8);
    assert.ok(Math.hypot(p.x - 10, p.z - 10) >= 3);
  }
});

test('count を超えて置かれず、拡大率と種類は指定範囲に収まる', () => {
  const points = scatter({ ...base, count: 20, scaleRange: [2, 3], variants: 4 });
  assert.ok(points.length <= 20);
  for (const p of points) {
    assert.ok(p.scale >= 2 && p.scale <= 3);
    assert.ok(Number.isInteger(p.variant) && p.variant >= 0 && p.variant < 4);
  }
});

test('置ける場所がなければ空配列を返す', () => {
  assert.deepEqual(scatter({ ...base, minHeight: 1000 }), []);
});
