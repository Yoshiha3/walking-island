import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createRandom,
  createNoise2D,
  createIsland,
  terrainColor,
  smoothstep,
  SEA_LEVEL,
} from '../src/world/heightmap.js';

test('createRandom は同じシードなら同じ乱数列を返す', () => {
  const a = createRandom(42);
  const b = createRandom(42);
  for (let i = 0; i < 10; i++) assert.equal(a(), b());
});

test('createRandom は [0, 1) の値を返す', () => {
  const r = createRandom(7);
  for (let i = 0; i < 1000; i++) {
    const v = r();
    assert.ok(v >= 0 && v < 1, `${v} が範囲外`);
  }
});

test('createNoise2D は決定的で、およそ [-1, 1] に収まる', () => {
  const n1 = createNoise2D(3);
  const n2 = createNoise2D(3);
  for (let i = 0; i < 500; i++) {
    const x = i * 0.37;
    const y = i * 0.73;
    assert.equal(n1(x, y), n2(x, y));
    assert.ok(Math.abs(n1(x, y)) <= 1.0001);
  }
});

test('createNoise2D は格子点で 0 になり、シードが違えば値が変わる', () => {
  const a = createNoise2D(1);
  const b = createNoise2D(2);
  assert.equal(a(5, 5), 0);
  assert.notEqual(a(0.5, 0.5), b(0.5, 0.5));
});

test('smoothstep は境界の外で 0 と 1 に張り付く', () => {
  assert.equal(smoothstep(0, 1, -1), 0);
  assert.equal(smoothstep(0, 1, 2), 1);
  assert.equal(smoothstep(0, 1, 0.5), 0.5);
});

test('島の中心付近は陸、半径の外側は海面下', () => {
  const island = createIsland({ seed: 1 });
  assert.ok(island.heightAt(0, 0) > SEA_LEVEL + 1);
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
    const r = island.radius * 1.3;
    assert.ok(island.heightAt(Math.cos(a) * r, Math.sin(a) * r) < SEA_LEVEL);
  }
});

test('島の高さは maxHeight を大きく超えない', () => {
  const island = createIsland({ seed: 5 });
  for (let x = -100; x <= 100; x += 5) {
    for (let z = -100; z <= 100; z += 5) {
      assert.ok(island.heightAt(x, z) <= island.maxHeight + 1.5);
    }
  }
});

test('terrainColor は高さで砂浜・草・岩を切り替える', () => {
  const sand = terrainColor(0.5);
  const grass = terrainColor(3);
  const rock = terrainColor(13);
  assert.notDeepEqual(sand, grass);
  assert.notDeepEqual(grass, rock);
  for (const c of [sand, grass, rock]) {
    assert.equal(c.length, 3);
    for (const v of c) assert.ok(v >= 0 && v <= 1);
  }
});
