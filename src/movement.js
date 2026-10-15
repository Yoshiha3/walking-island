/**
 * @file キー入力から移動方向を求める純粋関数。three.js に依存しない。
 */

/** 前進に使うキー (KeyboardEvent.code)。 */
const FORWARD = ['KeyW', 'ArrowUp'];
/** 後退に使うキー。 */
const BACKWARD = ['KeyS', 'ArrowDown'];
/** 左移動に使うキー。 */
const LEFT = ['KeyA', 'ArrowLeft'];
/** 右移動に使うキー。 */
const RIGHT = ['KeyD', 'ArrowRight'];

/**
 * いずれかのキーが押されているかを判定する。
 * @param {Set<string>} pressed 押されているキーの集合
 * @param {string[]} codes 調べるキー
 * @returns {boolean}
 */
function anyPressed(pressed, codes) {
  return codes.some((code) => pressed.has(code));
}

/**
 * 押されているキーとカメラの向きから、水平面上の移動方向を求める。
 * three.js の座標系 (前方が -Z、右が +X、Y 軸まわりの回転 yaw) に合わせている。
 * @param {Set<string>} pressed 押されているキー (KeyboardEvent.code) の集合
 * @param {number} yaw カメラの Y 軸まわりの回転 (ラジアン)。0 で -Z 方向を向く
 * @returns {{ x: number, z: number }} 長さ 1 (入力なしなら 0) の移動方向
 */
export function moveDirection(pressed, yaw) {
  const forward = Number(anyPressed(pressed, FORWARD)) - Number(anyPressed(pressed, BACKWARD));
  const right = Number(anyPressed(pressed, RIGHT)) - Number(anyPressed(pressed, LEFT));
  if (forward === 0 && right === 0) return { x: 0, z: 0 };

  const sin = Math.sin(yaw);
  const cos = Math.cos(yaw);
  // 前方ベクトル (-sin, -cos) と右ベクトル (cos, -sin) の合成
  const x = -sin * forward + cos * right;
  const z = -cos * forward - sin * right;
  const length = Math.hypot(x, z);
  return { x: x / length, z: z / length };
}
