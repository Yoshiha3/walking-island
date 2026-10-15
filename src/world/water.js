/**
 * @file 島を囲む海の水面。
 */
import * as THREE from 'three';
import { SEA_LEVEL } from './heightmap.js';

/**
 * 水面のメッシュを作る。
 * @param {number} [size=1000] 水面の一辺の長さ (m)
 * @returns {THREE.Mesh}
 */
export function createWater(size = 1000) {
  const geometry = new THREE.PlaneGeometry(size, size);
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.MeshStandardMaterial({
    color: 0x3fa7d6,
    transparent: true,
    opacity: 0.8,
    roughness: 0.15,
    metalness: 0.1,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'water';
  mesh.position.y = SEA_LEVEL;
  mesh.receiveShadow = true;
  return mesh;
}
