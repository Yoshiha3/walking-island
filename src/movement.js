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

/**
 * 物体にめり込んだ体を押し戻す量を求める。
 * 地面とみなす面では真上にだけ押し戻す。法線方向に押し戻すと坂で少しずつ下へずれてしまうため。
 * 壁や急斜面では法線方向に押し戻し、面に沿って滑るようにする。
 * @param {{ x: number, y: number, z: number }} normal めり込んだ面の法線 (長さ 1)
 * @param {number} depth めり込みの深さ (m)
 * @param {boolean} isFloor その面を地面とみなすか
 * @returns {{ x: number, y: number, z: number }} 体を動かす量 (m)
 */
export function separation(normal, depth, isFloor) {
  if (isFloor) {
    // 傾いた面から深さ depth だけ離すのに必要な真上への移動量は depth / normal.y
    return { x: 0, y: depth / normal.y, z: 0 };
  }
  return { x: normal.x * depth, y: normal.y * depth, z: normal.z * depth };
}
