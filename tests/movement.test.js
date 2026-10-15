import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moveDirection } from '../src/movement.js';

/**
 * 浮動小数の誤差を許して方向ベクトルを比べる。
 * @param {{x: number, z: number}} actual
 * @param {{x: number, z: number}} expected
 */
function assertDir(actual, expected) {
  assert.ok(Math.abs(actual.x - expected.x) < 1e-9, `x: ${actual.x} != ${expected.x}`);
  assert.ok(Math.abs(actual.z - expected.z) < 1e-9, `z: ${actual.z} != ${expected.z}`);
}

test('入力がなければ移動しない', () => {
  assertDir(moveDirection(new Set(), 0), { x: 0, z: 0 });
});

test('yaw=0 で W は -Z、D は +X に進む', () => {
  assertDir(moveDirection(new Set(['KeyW']), 0), { x: 0, z: -1 });
  assertDir(moveDirection(new Set(['KeyS']), 0), { x: 0, z: 1 });
  assertDir(moveDirection(new Set(['KeyD']), 0), { x: 1, z: 0 });
  assertDir(moveDirection(new Set(['KeyA']), 0), { x: -1, z: 0 });
});

test('矢印キーでも動ける', () => {
  assertDir(moveDirection(new Set(['ArrowUp']), 0), { x: 0, z: -1 });
});

test('左に 90° 向くと W は -X に進む', () => {
  assertDir(moveDirection(new Set(['KeyW']), Math.PI / 2), { x: -1, z: 0 });
});

test('斜め移動でも速さは変わらない (長さ 1)', () => {
  const d = moveDirection(new Set(['KeyW', 'KeyD']), 0.3);
  assert.ok(Math.abs(Math.hypot(d.x, d.z) - 1) < 1e-9);
});

test('前と後ろを同時に押すと打ち消し合う', () => {
  assertDir(moveDirection(new Set(['KeyW', 'KeyS']), 1), { x: 0, z: 0 });
});
