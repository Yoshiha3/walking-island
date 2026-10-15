/**
 * @file 木・岩・草花などの小物を島に散りばめる。
 * モデルは Kenney Nature Kit (CC0) の GLB を使い、同じモデルは InstancedMesh でまとめて描画する。
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { scatter } from './scatter.js';
import { SEA_LEVEL } from './heightmap.js';

/** モデルを置いているディレクトリ。 */
const MODEL_DIR = './assets/models/';
/** 小物を回転させる軸 (真上)。 */
const Y_AXIS = new THREE.Vector3(0, 1, 0);

/**
 * 小物の種類ごとの設定。
 * @typedef {object} PropType
 * @property {string} name 種類の名前
 * @property {string[]} models 使うモデルのファイル名 (拡張子なし)。ランダムに選ばれる
 * @property {'tree' | 'palm' | 'rock' | 'bush' | 'flower' | 'grass'} fallback 読み込みに失敗したときの代用品
 * @property {number} count 置く数
 * @property {number} minDistance 同じ種類どうし・当たり判定のある物との最小間隔 (m)
 * @property {[number, number]} scaleRange 拡大率の範囲
 * @property {(maxHeight: number) => [number, number]} heightRange 置く高さの範囲 [最小, 最大]
 * @property {boolean} collide プレイヤーがぶつかるか
 */

/** @type {PropType[]} */
const PROP_TYPES = [
  {
    name: 'trees',
    models: ['tree_default', 'tree_oak', 'tree_detailed', 'tree_fat', 'tree_pineRoundA', 'tree_cone'],
    fallback: 'tree',
    count: 80,
    minDistance: 5,
    scaleRange: [3.5, 5],
    heightRange: (h) => [SEA_LEVEL + 2, h * 0.75],
    collide: true,
  },
  {
    name: 'palms',
    models: ['tree_palmTall', 'tree_palmBend'],
    fallback: 'palm',
    count: 18,
    minDistance: 6,
    scaleRange: [4, 5.5],
    heightRange: () => [SEA_LEVEL + 0.4, SEA_LEVEL + 1.8],
    collide: true,
  },
  {
    name: 'rocks',
    models: ['rock_largeA', 'rock_largeB', 'rock_tallA'],
    fallback: 'rock',
    count: 25,
    minDistance: 6,
    scaleRange: [2.5, 5],
    heightRange: () => [SEA_LEVEL + 0.5, Infinity],
    collide: true,
  },
  {
    name: 'bushes',
    models: ['plant_bush', 'plant_bushLarge'],
    fallback: 'bush',
    count: 60,
    minDistance: 2.5,
    scaleRange: [3, 4.5],
    heightRange: () => [SEA_LEVEL + 1.3, Infinity],
    collide: false,
  },
  {
    name: 'flowers',
    models: ['flower_redA', 'flower_yellowA', 'flower_purpleA', 'mushroom_red'],
    fallback: 'flower',
    count: 260,
    minDistance: 0.9,
    scaleRange: [2, 3],
    heightRange: (h) => [SEA_LEVEL + 1.3, h * 0.6],
    collide: false,
  },
  {
    name: 'grass',
    models: ['grass', 'grass_large'],
    fallback: 'grass',
    count: 450,
    minDistance: 0.7,
    scaleRange: [2.5, 3.5],
    heightRange: () => [SEA_LEVEL + 1.3, Infinity],
    collide: false,
  },
];

/**
 * モデルを構成するメッシュ 1 つ分。モデルの原点から見た変換行列を持つ。
 * @typedef {object} ModelPart
 * @property {THREE.BufferGeometry} geometry
 * @property {THREE.Material | THREE.Material[]} material
 * @property {THREE.Matrix4} matrix
 */

/**
 * GLB やプリミティブのモデルを、メッシュごとの部品に分解する。
 * @param {THREE.Object3D} root モデルのルート
 * @returns {ModelPart[]}
 */
function toParts(root) {
  root.updateMatrixWorld(true);
  /** @type {ModelPart[]} */
  const parts = [];
  root.traverse((obj) => {
    if (obj.isMesh) {
      parts.push({ geometry: obj.geometry, material: obj.material, matrix: obj.matrixWorld.clone() });
    }
  });
  return parts;
}

/**
 * フラットシェーディングの単色マテリアルを作る。
 * @param {number} color
 * @returns {THREE.MeshStandardMaterial}
 */
function flat(color) {
  return new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.9 });
}

/**
 * モデルが読み込めなかったときに使う、プリミティブで作った代用品。
 * 大きさは Kenney のモデル (木で高さ 1.4 程度) に合わせている。
 * @param {PropType['fallback']} kind 代用品の種類
 * @returns {THREE.Group}
 */
export function createFallbackModel(kind) {
  const group = new THREE.Group();
  /**
   * グループにメッシュを追加する。
   * @param {THREE.BufferGeometry} geometry
   * @param {number} color
   * @param {number} y 置く高さ
   */
  const add = (geometry, color, y) => {
    const mesh = new THREE.Mesh(geometry, flat(color));
    mesh.position.y = y;
    group.add(mesh);
  };
  switch (kind) {
    case 'tree':
      add(new THREE.CylinderGeometry(0.06, 0.08, 0.6, 6), 0x8b5a2b, 0.3);
      add(new THREE.ConeGeometry(0.4, 1, 7), 0x3f8f3a, 0.9);
      break;
    case 'palm':
      add(new THREE.CylinderGeometry(0.05, 0.07, 1.2, 6), 0xa0703c, 0.6);
      add(new THREE.ConeGeometry(0.5, 0.25, 6), 0x4caf50, 1.25);
      break;
    case 'rock':
      add(new THREE.IcosahedronGeometry(0.4, 0), 0x8a8a8a, 0.2);
      break;
    case 'bush':
      add(new THREE.IcosahedronGeometry(0.15, 0), 0x4d9a3c, 0.1);
      break;
    case 'flower':
      add(new THREE.CylinderGeometry(0.01, 0.01, 0.2, 4), 0x3f8f3a, 0.1);
      add(new THREE.IcosahedronGeometry(0.05, 0), 0xe85d75, 0.22);
      break;
    case 'grass':
      add(new THREE.ConeGeometry(0.05, 0.25, 3), 0x5fae45, 0.12);
      break;
  }
  return group;
}

/**
 * モデルを読み込む。失敗した場合は代用品を返す。
 * @param {GLTFLoader} loader
 * @param {string} name ファイル名 (拡張子なし)
 * @param {PropType['fallback']} fallback 代用品の種類
 * @returns {Promise<THREE.Object3D>}
 */
async function loadModel(loader, name, fallback) {
  try {
    const gltf = await loader.loadAsync(`${MODEL_DIR}${name}.glb`);
    return gltf.scene;
  } catch (error) {
    console.warn(`モデル ${name} を読み込めなかったので代用品を使います:`, error);
    return createFallbackModel(fallback);
  }
}

/**
 * 配置情報から、ワールド座標への変換行列を作る。
 * @param {import('./scatter.js').Placement} p
 * @returns {THREE.Matrix4}
 */
function placementMatrix(p) {
  return new THREE.Matrix4().compose(
    // メッシュの地形とノイズの高さは少しずれるので、わずかに埋めておく
    new THREE.Vector3(p.x, p.y - 0.1, p.z),
    new THREE.Quaternion().setFromAxisAngle(Y_AXIS, p.rotation),
    new THREE.Vector3(p.scale, p.scale, p.scale),
  );
}

/**
 * 小物を読み込んで島に配置する。
 * @param {import('./heightmap.js').Island} island 島の地形
 * @param {object} [options]
 * @param {import('./scatter.js').Clearing[]} [options.clearings=[]] 何も置かない範囲 (開始地点など)
 * @returns {Promise<{ visual: THREE.Group, collision: THREE.Group }>}
 *   visual は描画用、collision は当たり判定 (Octree) 用。collision はシーンに追加しない
 */
export async function createProps(island, { clearings = [] } = {}) {
  const loader = new GLTFLoader();
  const visual = new THREE.Group();
  visual.name = 'props';
  const collision = new THREE.Group();
  /** @type {import('./scatter.js').Placement[]} 当たり判定のある物の位置 */
  const solid = [];

  for (const [index, type] of PROP_TYPES.entries()) {
    const models = await Promise.all(type.models.map((m) => loadModel(loader, m, type.fallback)));
    const [minHeight, maxHeight] = type.heightRange(island.maxHeight);
    const placements = scatter({
      seed: 1000 + index,
      count: type.count,
      area: island.radius,
      heightAt: island.heightAt,
      minHeight,
      maxHeight,
      minDistance: type.minDistance,
      scaleRange: type.scaleRange,
      variants: models.length,
      clearings,
      avoid: solid,
    });

    models.forEach((model, variant) => {
      const mine = placements.filter((p) => p.variant === variant);
      if (mine.length === 0) return;
      const matrices = mine.map(placementMatrix);

      for (const part of toParts(model)) {
        const mesh = new THREE.InstancedMesh(part.geometry, part.material, mine.length);
        mesh.name = `${type.name}:${type.models[variant]}`;
        mesh.castShadow = type.collide || type.name === 'bushes';
        mesh.receiveShadow = true;
        matrices.forEach((m, i) => mesh.setMatrixAt(i, m.clone().multiply(part.matrix)));
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere();
        visual.add(mesh);

        if (type.collide) {
          // Octree は InstancedMesh を扱えないので、1 つずつ普通のメッシュにする
          for (const m of matrices) {
            const proxy = new THREE.Mesh(part.geometry);
            proxy.matrixAutoUpdate = false;
            proxy.matrix.copy(m).multiply(part.matrix);
            collision.add(proxy);
          }
        }
      }
    });

    if (type.collide) solid.push(...placements);
  }

  collision.updateMatrixWorld(true);
  return { visual, collision };
}
