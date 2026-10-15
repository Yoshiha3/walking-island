import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  closestPointOnTriangle,
  closestPointsBetweenSegments,
  capsuleTriangleContact,
} from '../src/collision.js';

/**
 * ベクトルがほぼ等しいことを確かめる。
 * @param {{x: number, y: number, z: number}} actual
 * @param {{x: number, y: number, z: number}} expected
 */
function assertVec(actual, expected, eps = 1e-9) {
  for (const k of ['x', 'y', 'z']) {
    assert.ok(Math.abs(actual[k] - expected[k]) < eps, `${k}: ${actual[k]} != ${expected[k]}`);
  }
}

const v = (x, y, z) => ({ x, y, z });

// 原点付近にある、上 (+Y) を向いた大きな床の三角形 (反時計回りに見えるよう並べる)
const FLOOR = [v(-10, 0, -10), v(-10, 0, 10), v(10, 0, 0)];
// x = 1 にある、-X 方向を向いた壁の三角形
const WALL = [v(1, -5, -5), v(1, 5, -5), v(1, 0, 5)];

test('closestPointOnTriangle: 三角形の真上の点は真下に落とした点になる', () => {
  assertVec(closestPointOnTriangle(v(0, 3, 0), ...FLOOR), v(0, 0, 0));
});

test('closestPointOnTriangle: 三角形の外の点は最も近い頂点か辺の上になる', () => {
  const tri = [v(0, 0, 0), v(1, 0, 0), v(0, 0, 1)];
  assertVec(closestPointOnTriangle(v(-1, 0, -1), ...tri), v(0, 0, 0));
  assertVec(closestPointOnTriangle(v(0.5, 2, -1), ...tri), v(0.5, 0, 0));
});

test('closestPointsBetweenSegments: ねじれの位置にある線分の最短点', () => {
  const [p, q] = closestPointsBetweenSegments(v(-1, 0, 0), v(1, 0, 0), v(0, 1, -1), v(0, 1, 1));
  assertVec(p, v(0, 0, 0));
  assertVec(q, v(0, 1, 0));
});

test('capsuleTriangleContact: 床から離れていればめり込みなし', () => {
  assert.equal(capsuleTriangleContact(v(0, 1, 0), v(0, 2, 0), 0.35, ...FLOOR), null);
});

test('capsuleTriangleContact: 床にめり込むと真上へ押し戻す', () => {
  const c = capsuleTriangleContact(v(0, 0.3, 0), v(0, 1.3, 0), 0.35, ...FLOOR);
  assertVec(c.normal, v(0, 1, 0));
  assert.ok(Math.abs(c.depth - 0.05) < 1e-9);
});

test('capsuleTriangleContact: 壁にめり込むと壁から離れる向きに押し戻す', () => {
  const c = capsuleTriangleContact(v(0.7, 0, 0), v(0.7, 1, 0), 0.35, ...WALL);
  assertVec(c.normal, v(-1, 0, 0));
  assert.ok(Math.abs(c.depth - 0.05) < 1e-9);
});

test('capsuleTriangleContact: 三角形の外側からでも辺や頂点に触れていれば検出する', () => {
  // 床の三角形の頂点 (10, 0, 0) のすぐ外側、少し上
  const c = capsuleTriangleContact(v(10.2, 0.1, 0), v(10.2, 1.1, 0), 0.35, ...FLOOR);
  assert.ok(c !== null);
  assert.ok(c.normal.x > 0 && c.normal.y > 0, '頂点から外向き・上向きに押す');
  assert.ok(c.depth > 0 && c.depth < 0.35);
});

test('capsuleTriangleContact: 芯が面を突き抜けていたら表側へ押し戻す', () => {
  const c = capsuleTriangleContact(v(0, -0.2, 0), v(0, 1, 0), 0.35, ...FLOOR);
  assertVec(c.normal, v(0, 1, 0));
  assert.ok(Math.abs(c.depth - 0.55) < 1e-9);
});

test('capsuleTriangleContact: 面積 0 の三角形は無視する', () => {
  assert.equal(capsuleTriangleContact(v(0, 0, 0), v(0, 1, 0), 0.35, v(0, 0, 0), v(1, 0, 0), v(2, 0, 0)), null);
});
