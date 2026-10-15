/**
 * @file 島の高さ関数から地形メッシュを作る。
 */
import * as THREE from 'three';
import { terrainColor } from './heightmap.js';

/**
 * 島の地形メッシュを作る。三角形ごとに 1 色で塗るフラットシェーディングでローポリ風にする。
 * @param {import('./heightmap.js').Island} island 島の地形
 * @param {object} [options]
 * @param {number} [options.size] 地形の一辺の長さ (m)。省略時は島の直径の 1.4 倍
 * @param {number} [options.segments=110] 一辺の分割数。大きいほど細かい
 * @returns {THREE.Mesh}
 */
export function createTerrainMesh(island, { size = island.radius * 2.8, segments = 110 } = {}) {
  const plane = new THREE.PlaneGeometry(size, size, segments, segments);
  plane.rotateX(-Math.PI / 2);

  // 面ごとに色を変えるため、頂点を共有しない形に変換する
  const geometry = plane.toNonIndexed();
  plane.dispose();

  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, island.heightAt(pos.getX(i), pos.getZ(i)));
  }

  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i += 3) {
    const avgHeight = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
    const [r, g, b] = terrainColor(avgHeight, island.maxHeight);
    // 同じ高さ帯でも少しだけ色を揺らして単調さを減らす
    const jitter = 0.94 + ((i * 2654435761) % 1000) / 1000 * 0.12;
    for (let k = 0; k < 3; k++) {
      colors.set([r * jitter, g * jitter, b * jitter], (i + k) * 3);
    }
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 0.95,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'terrain';
  mesh.receiveShadow = true;
  return mesh;
}
