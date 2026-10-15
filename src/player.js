/**
 * @file 一人称視点のプレイヤー。マウスで視点を動かし、キーボードで歩く。
 */
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { moveDirection } from './movement.js';

/** 目の高さ (m)。 */
const EYE_HEIGHT = 1.6;
/** 歩く速さ (m/s)。 */
const WALK_SPEED = 4;

/**
 * 一人称視点のプレイヤー。
 */
export class Player {
  /**
   * @param {THREE.PerspectiveCamera} camera プレイヤーの目になるカメラ
   * @param {HTMLElement} domElement マウスロックの対象になる要素
   * @param {object} options
   * @param {(x: number, z: number) => number} options.heightAt 地面の高さを返す関数
   * @param {THREE.Vector3} options.spawn 開始地点 (足もとの位置)
   */
  constructor(camera, domElement, { heightAt, spawn }) {
    this.camera = camera;
    this.heightAt = heightAt;
    this.spawn = spawn.clone();
    /** @type {Set<string>} 押されているキー (KeyboardEvent.code) */
    this.keys = new Set();
    this.controls = new PointerLockControls(camera, domElement);
    this._euler = new THREE.Euler(0, 0, 0, 'YXZ');

    window.addEventListener('keydown', (e) => this.keys.add(e.code));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    // ウィンドウからフォーカスが外れたらキーが押しっぱなしにならないようにする
    window.addEventListener('blur', () => this.keys.clear());

    this.respawn();
  }

  /** 開始地点に戻す。 */
  respawn() {
    this.camera.position.copy(this.spawn);
    this.camera.position.y = this.heightAt(this.spawn.x, this.spawn.z) + EYE_HEIGHT;
  }

  /**
   * カメラが Y 軸まわりに向いている角度。
   * @returns {number} ラジアン
   */
  get yaw() {
    return this._euler.setFromQuaternion(this.camera.quaternion).y;
  }

  /**
   * 1 フレーム分プレイヤーを動かす。マウスロック中だけ操作を受け付ける。
   * @param {number} dt 前フレームからの経過時間 (秒)
   */
  update(dt) {
    if (!this.controls.isLocked) return;
    const dir = moveDirection(this.keys, this.yaw);
    const pos = this.camera.position;
    pos.x += dir.x * WALK_SPEED * dt;
    pos.z += dir.z * WALK_SPEED * dt;
    pos.y = this.heightAt(pos.x, pos.z) + EYE_HEIGHT;
  }
}
