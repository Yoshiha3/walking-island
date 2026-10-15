/**
 * @file カプセルと三角形の当たり判定。three.js に依存しない純粋関数。
 * three.js の Octree.triangleCapsuleIntersect() は判定を簡略化しているため、
 * 面へのめり込みを見逃すことがあり、押し戻しが数ステップおきになってガタつく。
 * ここではカプセルの芯 (線分) と三角形の最短距離を正確に求める。
 * アルゴリズムは C. Ericson『Real-Time Collision Detection』5.1 節による。
 */

/**
 * 3 次元ベクトル。THREE.Vector3 もこの形を満たすのでそのまま渡せる。
 * @typedef {{ x: number, y: number, z: number }} Vec3
 */

/**
 * カプセルが三角形にめり込んでいるときの情報。
 * @typedef {object} Contact
 * @property {Vec3} normal 押し戻す向き (長さ 1)。三角形からカプセルへ向かう
 * @property {number} depth めり込みの深さ (m)
 */

/** ほぼ 0 とみなす値。 */
const EPSILON = 1e-12;

/** @param {Vec3} a @param {Vec3} b @returns {Vec3} a - b */
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
/** @param {Vec3} a @param {Vec3} b @returns {Vec3} a + b */
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
/** @param {Vec3} a @param {number} s @returns {Vec3} a * s */
const scale = (a, s) => ({ x: a.x * s, y: a.y * s, z: a.z * s });
/** @param {Vec3} a @param {Vec3} b @returns {number} 内積 */
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
/** @param {Vec3} a @param {Vec3} b @returns {Vec3} 外積 */
const cross = (a, b) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
/** @param {number} v @returns {number} 0〜1 に収めた値 */
const clamp01 = (v) => Math.min(Math.max(v, 0), 1);

/**
 * 点 p に最も近い三角形 abc 上の点を求める。
 * @param {Vec3} p
 * @param {Vec3} a
 * @param {Vec3} b
 * @param {Vec3} c
 * @returns {Vec3}
 */
export function closestPointOnTriangle(p, a, b, c) {
  const ab = sub(b, a);
  const ac = sub(c, a);
  const ap = sub(p, a);
  const d1 = dot(ab, ap);
  const d2 = dot(ac, ap);
  if (d1 <= 0 && d2 <= 0) return { ...a };

  const bp = sub(p, b);
  const d3 = dot(ab, bp);
  const d4 = dot(ac, bp);
  if (d3 >= 0 && d4 <= d3) return { ...b };

  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) return add(a, scale(ab, d1 / (d1 - d3)));

  const cp = sub(p, c);
  const d5 = dot(ab, cp);
  const d6 = dot(ac, cp);
  if (d6 >= 0 && d5 <= d6) return { ...c };

  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) return add(a, scale(ac, d2 / (d2 - d6)));

  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
    return add(b, scale(sub(c, b), (d4 - d3) / (d4 - d3 + (d5 - d6))));
  }

  const denom = 1 / (va + vb + vc);
  return add(a, add(scale(ab, vb * denom), scale(ac, vc * denom)));
}

/**
 * 2 本の線分 p1-q1 と p2-q2 の上で、互いに最も近い点の組を求める。
 * @param {Vec3} p1
 * @param {Vec3} q1
 * @param {Vec3} p2
 * @param {Vec3} q2
 * @returns {[Vec3, Vec3]} [線分 1 上の点, 線分 2 上の点]
 */
export function closestPointsBetweenSegments(p1, q1, p2, q2) {
  const d1 = sub(q1, p1);
  const d2 = sub(q2, p2);
  const r = sub(p1, p2);
  const a = dot(d1, d1);
  const e = dot(d2, d2);
  const f = dot(d2, r);
  let s;
  let t;

  if (a <= EPSILON && e <= EPSILON) {
    s = 0;
    t = 0;
  } else if (a <= EPSILON) {
    s = 0;
    t = clamp01(f / e);
  } else {
    const c = dot(d1, r);
    if (e <= EPSILON) {
      t = 0;
      s = clamp01(-c / a);
    } else {
      const b = dot(d1, d2);
      const denom = a * e - b * b;
      s = denom !== 0 ? clamp01((b * f - c * e) / denom) : 0;
      t = (b * s + f) / e;
      if (t < 0) {
        t = 0;
        s = clamp01(-c / a);
      } else if (t > 1) {
        t = 1;
        s = clamp01((b - c) / a);
      }
    }
  }
  return [add(p1, scale(d1, s)), add(p2, scale(d2, t))];
}

/**
 * カプセルと三角形のめり込みを調べる。
 * @param {Vec3} start カプセルの芯の一端 (足側の球の中心)
 * @param {Vec3} end カプセルの芯のもう一端 (頭側の球の中心)
 * @param {number} radius カプセルの半径
 * @param {Vec3} a 三角形の頂点
 * @param {Vec3} b 三角形の頂点
 * @param {Vec3} c 三角形の頂点
 * @returns {Contact | null} めり込んでいなければ null
 */
export function capsuleTriangleContact(start, end, radius, a, b, c) {
  const n = cross(sub(b, a), sub(c, a));
  const nLength = Math.hypot(n.x, n.y, n.z);
  if (nLength < EPSILON) return null; // 面積 0 の三角形は無視
  const planeNormal = scale(n, 1 / nLength);

  // 芯が三角形を突き抜けている場合 (深くめり込んでいる)
  const ds = dot(sub(start, a), planeNormal);
  const de = dot(sub(end, a), planeNormal);
  if (ds * de < 0) {
    const hit = add(start, scale(sub(end, start), ds / (ds - de)));
    const onTri = closestPointOnTriangle(hit, a, b, c);
    const gap = sub(hit, onTri);
    if (dot(gap, gap) < 1e-10) {
      // 面の表側 (法線の向き) へ、裏側にある端が半径ぶん離れるまで押し戻す
      return { normal: planeNormal, depth: radius - Math.min(ds, de) };
    }
  }

  // 芯の両端と三角形、芯と三角形の各辺の最短距離のうち、最も近いものを使う
  /** @type {[Vec3, Vec3][]} [芯の上の点, 三角形の上の点] */
  const candidates = [
    [start, closestPointOnTriangle(start, a, b, c)],
    [end, closestPointOnTriangle(end, a, b, c)],
    closestPointsBetweenSegments(start, end, a, b),
    closestPointsBetweenSegments(start, end, b, c),
    closestPointsBetweenSegments(start, end, c, a),
  ];
  let best = candidates[0];
  let bestDistSq = Infinity;
  for (const pair of candidates) {
    const d = sub(pair[0], pair[1]);
    const distSq = dot(d, d);
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      best = pair;
    }
  }

  if (bestDistSq >= radius * radius) return null;
  const dist = Math.sqrt(bestDistSq);
  if (dist < 1e-9) return { normal: planeNormal, depth: radius };
  return { normal: scale(sub(best[0], best[1]), 1 / dist), depth: radius - dist };
}
