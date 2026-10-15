/**
 * @file エントリーポイント。レンダラー・シーン・カメラを用意し、描画ループを回す。
 */
import * as THREE from 'three';
import { createIsland } from './world/heightmap.js';
import { createTerrainMesh } from './world/terrain.js';
import { createWater } from './world/water.js';
import { setupSky } from './world/sky.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
setupSky(scene);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 8, 100);
camera.lookAt(0, 6, 0);

scene.add(new THREE.HemisphereLight(0xdff1ff, 0x5a7a3a, 1.2));

const sun = new THREE.DirectionalLight(0xfff2d6, 2.2);
sun.position.set(60, 90, 40);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -120, right: 120, top: 120, bottom: -120, far: 300 });
scene.add(sun);

const island = createIsland({ seed: 1 });
scene.add(createTerrainMesh(island));
scene.add(createWater());

/** ウィンドウサイズの変更に合わせてカメラとレンダラーを更新する。 */
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);

renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});
