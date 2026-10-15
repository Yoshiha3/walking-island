/**
 * @file エントリーポイント。レンダラー・シーン・カメラを用意し、描画ループを回す。
 */
import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ec9e8);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 4);

scene.add(new THREE.HemisphereLight(0xffffff, 0x556644, 1.5));

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x66bb66, flatShading: true }),
);
cube.position.y = 1;
scene.add(cube);

const timer = new THREE.Clock();

/** ウィンドウサイズの変更に合わせてカメラとレンダラーを更新する。 */
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);

renderer.setAnimationLoop(() => {
  const dt = timer.getDelta();
  cube.rotation.y += dt;
  renderer.render(scene, camera);
});
