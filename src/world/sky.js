/**
 * @file 空の背景とフォグ。
 */
import * as THREE from 'three';

/** 地平線付近の色。フォグもこの色にして、遠くの海が空になじむようにする。 */
export const HORIZON_COLOR = 0xc9d6e6;

/**
 * 画像が読み込めなかったときに使う、上が青く下が白っぽいグラデーションのテクスチャを作る。
 * @returns {THREE.CanvasTexture}
 */
export function createGradientSkyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#3d6fb8');
  gradient.addColorStop(0.5, '#c9d6e6');
  gradient.addColorStop(1, '#8aa2c0');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * 正距円筒図法の空の画像を背景に設定し、フォグを掛ける。
 * 画像の読み込みに失敗した場合はグラデーションで代用する。
 * @param {THREE.Scene} scene 設定先のシーン
 * @param {string} [url='./assets/sky.jpg'] 空の画像の URL
 * @returns {Promise<void>} 背景の設定が終わると解決する
 */
export async function setupSky(scene, url = './assets/sky.jpg') {
  scene.fog = new THREE.Fog(HORIZON_COLOR, 60, 320);
  scene.background = new THREE.Color(HORIZON_COLOR);

  try {
    const texture = await new THREE.TextureLoader().loadAsync(url);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    scene.background = texture;
  } catch (error) {
    console.warn('空の画像を読み込めなかったのでグラデーションで代用します:', error);
    scene.background = createGradientSkyTexture();
  }
}
