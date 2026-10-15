/**
 * @file エントリーポイント。レンダラー・シーン・カメラを用意し、描画ループを回す。
 */
import * as THREE from 'three';
import { createIsland } from './world/heightmap.js';
import { createTerrainMesh } from './world/terrain.js';
import { createWater } from './world/water.js';
import { setupSky } from './world/sky.js';
import { createProps } from './world/props.js';
import { Octree } from 'three/addons/math/Octree.js';
import { Player } from './player.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
setupSky(scene);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);

scene.add(new THREE.HemisphereLight(0xdff1ff, 0x5a7a3a, 1.2));

const sun = new THREE.DirectionalLight(0xfff2d6, 2.2);
sun.position.set(60, 90, 40);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -120, right: 120, top: 120, bottom: -120, far: 300 });
scene.add(sun);

const island = createIsland({ seed: 1 });
const terrain = createTerrainMesh(island);
scene.add(terrain);
scene.add(createWater());

const spawn = new THREE.Vector3(0, 0, 40);
spawn.y = island.heightAt(spawn.x, spawn.z) + 0.2;

const props = await createProps(island, { clearings: [{ x: spawn.x, z: spawn.z, radius: 6 }] });
scene.add(props.visual);

/** プレイヤーがぶつかる物体をまとめるグループ。当たり判定専用なのでシーンには追加しない。 */
const colliders = new THREE.Group();
colliders.add(new THREE.Mesh(terrain.geometry), props.collision);
const octree = new Octree();
octree.fromGraphNode(colliders);
const player = new Player(camera, document.body, { octree, spawn });

const overlay = document.getElementById('overlay');
document.getElementById('status').textContent = 'クリックして開始';
overlay.addEventListener('click', () => player.controls.lock());
player.controls.addEventListener('lock', () => overlay.classList.add('hidden'));
player.controls.addEventListener('unlock', () => overlay.classList.remove('hidden'));

/** ウィンドウサイズの変更に合わせてカメラとレンダラーを更新する。 */
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);

const timer = new THREE.Clock();
renderer.setAnimationLoop(() => {
  // タブ切り替え直後などに大きな dt で吹き飛ばないよう上限を設ける
  const dt = Math.min(timer.getDelta(), 0.05);
  player.update(dt);
  renderer.render(scene, camera);
});

// 開発時にブラウザのコンソールや chrome-devtools MCP から状態を確認できるようにする
window.game = { scene, camera, player, island, octree };
