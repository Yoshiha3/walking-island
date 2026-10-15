/**
 * @file 島の地形の高さと色を決める純粋関数群。
 * three.js に依存しないので Node のテストからも読み込める。
 */

/**
 * シード付きの疑似乱数生成器 (mulberry32) を作る。
 * @param {number} seed 32bit 整数のシード
 * @returns {() => number} 呼ぶたびに [0, 1) の乱数を返す関数
 */
export function createRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 5次のなめらかな補間カーブ (Perlin の fade 関数)。
 * @param {number} t 0〜1
 * @returns {number}
 */
function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * 線形補間。
 * @param {number} a
 * @param {number} b
 * @param {number} t
 * @returns {number}
 */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * エルミート補間で 0〜1 に収める smoothstep。
 * @param {number} edge0 0 になる境界
 * @param {number} edge1 1 になる境界
 * @param {number} x
 * @returns {number} 0〜1
 */
export function smoothstep(edge0, edge1, x) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

/** 2D Perlin ノイズで使う 8 方向の勾配ベクトル。 */
const GRADIENTS = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [Math.SQRT1_2, Math.SQRT1_2], [-Math.SQRT1_2, Math.SQRT1_2],
  [Math.SQRT1_2, -Math.SQRT1_2], [-Math.SQRT1_2, -Math.SQRT1_2],
];

/**
 * シード付きの 2D Perlin ノイズ関数を作る。
 * @param {number} seed シード
 * @returns {(x: number, y: number) => number} およそ [-1, 1] の値を返すノイズ関数
 */
export function createNoise2D(seed) {
  const random = createRandom(seed);
  const perm = new Uint8Array(512);
  const base = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = base[i & 255];

  /**
   * 格子点の勾配と、格子点から見た相対位置の内積。
   * @param {number} hash
   * @param {number} dx
   * @param {number} dy
   * @returns {number}
   */
  const dot = (hash, dx, dy) => {
    const g = GRADIENTS[hash & 7];
    return g[0] * dx + g[1] * dy;
  };

  return (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const X = xi & 255;
    const Y = yi & 255;
    const aa = perm[perm[X] + Y];
    const ab = perm[perm[X] + Y + 1];
    const ba = perm[perm[X + 1] + Y];
    const bb = perm[perm[X + 1] + Y + 1];
    const u = fade(xf);
    const v = fade(yf);
    const x1 = lerp(dot(aa, xf, yf), dot(ba, xf - 1, yf), u);
    const x2 = lerp(dot(ab, xf, yf - 1), dot(bb, xf - 1, yf - 1), u);
    // 8 方向勾配の 2D Perlin は最大でも約 0.71 なので √2 倍して [-1, 1] に広げる
    return lerp(x1, x2, v) * Math.SQRT2;
  };
}

/**
 * 複数のオクターブを重ねたノイズ (fBm)。
 * @param {(x: number, y: number) => number} noise 元のノイズ関数
 * @param {number} x
 * @param {number} y
 * @param {number} [octaves=4] 重ねる回数
 * @returns {number} およそ [-1, 1]
 */
export function fbm(noise, x, y, octaves = 4) {
  let sum = 0;
  let amp = 1;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += noise(x * freq, y * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

/**
 * 島の形を決める設定値。
 * @typedef {object} IslandOptions
 * @property {number} [seed=1] 乱数シード
 * @property {number} [radius=90] 島の半径 (m)。これより外は海
 * @property {number} [maxHeight=14] 丘の最大の高さ (m)
 * @property {number} [seaDepth=4] 島の外側の海底の深さ (m)
 * @property {number} [scale=0.018] ノイズの細かさ。小さいほどなだらか
 */

/** 海面の高さ (m)。 */
export const SEA_LEVEL = 0;

/**
 * 島の地形を表すオブジェクト。
 * @typedef {object} Island
 * @property {number} radius 島の半径 (m)
 * @property {number} maxHeight 丘の最大の高さ (m)
 * @property {(x: number, z: number) => number} heightAt 地点 (x, z) の地面の高さを返す
 */

/**
 * シードから島の地形を作る。中心ほど高く、外周に向かって海に沈む。
 * @param {IslandOptions} [options]
 * @returns {Island}
 */
export function createIsland({ seed = 1, radius = 90, maxHeight = 14, seaDepth = 4, scale = 0.018 } = {}) {
  const noise = createNoise2D(seed);
  const warp = createNoise2D(seed + 101);

  return {
    radius,
    maxHeight,
    heightAt(x, z) {
      // 海岸線がまん丸にならないよう、距離にノイズで揺らぎを入れる
      const wobble = 1 + 0.15 * warp(x * 0.012, z * 0.012);
      const d = Math.hypot(x, z) / (radius * wobble);
      const land = 1 - smoothstep(0.55, 1, d);
      const hills = (fbm(noise, x * scale, z * scale) + 1) / 2; // 0〜1
      return land * (1.5 + hills * hills * maxHeight) - (1 - land) * seaDepth;
    },
  };
}

/**
 * 高さに応じた地面の色 (砂浜・草原・岩肌) を返す。
 * @param {number} height 地面の高さ (m)
 * @param {number} [maxHeight=14] 島の最大の高さ。色の切り替え位置の基準
 * @returns {[number, number, number]} RGB (各 0〜1)
 */
export function terrainColor(height, maxHeight = 14) {
  if (height < SEA_LEVEL + 1.2) return [0.93, 0.85, 0.6]; // 砂浜
  if (height < maxHeight * 0.45) return [0.45, 0.75, 0.3]; // 明るい草原
  if (height < maxHeight * 0.7) return [0.33, 0.6, 0.25]; // 深い緑
  return [0.55, 0.52, 0.5]; // 岩肌
}
