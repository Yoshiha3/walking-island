/**
 * @file 木や岩を置く位置を決める純粋関数。three.js に依存しない。
 */
import { createRandom } from './heightmap.js';

/**
 * 配置する 1 つ分の情報。
 * @typedef {object} Placement
 * @property {number} x X 座標 (m)
 * @property {number} y 地面の高さ (m)
 * @property {number} z Z 座標 (m)
 * @property {number} rotation Y 軸まわりの回転 (ラジアン)
 * @property {number} scale 拡大率
 * @property {number} variant 何番目のモデルを使うか (0 〜 variants-1)
 */

/**
 * 物を置かない円形の範囲。
 * @typedef {object} Clearing
 * @property {number} x 中心の X 座標 (m)
 * @property {number} z 中心の Z 座標 (m)
 * @property {number} radius 半径 (m)
 */

/**
 * 散布の条件。
 * @typedef {object} ScatterOptions
 * @property {number} seed 乱数シード
 * @property {number} count 置きたい数 (条件が厳しいと少なくなることがある)
 * @property {number} area 候補を探す範囲の半径 (m)。原点中心
 * @property {(x: number, z: number) => number} heightAt 地面の高さを返す関数
 * @property {number} [minHeight=-Infinity] この高さ以上の場所にだけ置く
 * @property {number} [maxHeight=Infinity] この高さ以下の場所にだけ置く
 * @property {number} [minDistance=0] 置いた物どうしの最小の間隔 (m)
 * @property {[number, number]} [scaleRange=[1, 1]] 拡大率の範囲 [最小, 最大]
 * @property {number} [variants=1] モデルの種類数
 * @property {Clearing[]} [clearings=[]] 物を置かない範囲
 * @property {Placement[]} [avoid=[]] 他の種類で既に置いた物。minDistance 以内には置かない
 * @property {number} [maxAttempts] 試行回数の上限。省略時は count の 30 倍
 */

/**
 * 条件を満たす場所にランダムに物を置く位置を決める。同じ条件なら毎回同じ結果になる。
 * @param {ScatterOptions} options
 * @returns {Placement[]}
 */
export function scatter({
  seed,
  count,
  area,
  heightAt,
  minHeight = -Infinity,
  maxHeight = Infinity,
  minDistance = 0,
  scaleRange = [1, 1],
  variants = 1,
  clearings = [],
  avoid = [],
  maxAttempts = count * 30,
}) {
  const random = createRandom(seed);
  /** @type {Placement[]} */
  const placed = [];
  const minDistSq = minDistance * minDistance;

  /**
   * 既に置いた物と近すぎないかを調べる。
   * @param {number} x
   * @param {number} z
   * @param {Placement[]} list
   * @returns {boolean}
   */
  const tooClose = (x, z, list) =>
    list.some((p) => (p.x - x) ** 2 + (p.z - z) ** 2 < minDistSq);

  for (let attempt = 0; attempt < maxAttempts && placed.length < count; attempt++) {
    // 円の中に一様に分布させるため、半径は平方根を取る
    const r = Math.sqrt(random()) * area;
    const angle = random() * Math.PI * 2;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const rotation = random() * Math.PI * 2;
    const scale = scaleRange[0] + random() * (scaleRange[1] - scaleRange[0]);
    const variant = Math.floor(random() * variants);

    const y = heightAt(x, z);
    if (y < minHeight || y > maxHeight) continue;
    if (clearings.some((c) => (c.x - x) ** 2 + (c.z - z) ** 2 < c.radius ** 2)) continue;
    if (tooClose(x, z, placed) || tooClose(x, z, avoid)) continue;

    placed.push({ x, y, z, rotation, scale, variant });
  }
  return placed;
}
