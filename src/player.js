/**
 * @file 一人称視点のプレイヤー。マウスで視点を動かし、キーボードで歩く。
 * 体はカプセル形の当たり判定で表し、Octree にした地形や物体とぶつける
 * (three.js 公式サンプル games_fps と同じ方式)。
 */
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { Capsule } from 'three/addons/math/Capsule.js';
import { moveDirection } from './movement.js';
import { SEA_LEVEL } from './world/heightmap.js';

/** 体の半径 (m)。 */
const RADIUS = 0.35;
/** 身長 (m)。 */
const HEIGHT = 1.7;
/** 足もとから目までの高さ (m)。 */
const EYE_HEIGHT = 1.6;
/** 歩く速さ (m/s)。 */
const WALK_SPEED = 4;
/** 重力加速度 (m/s²)。 */
const GRAVITY = 25;
/** 地面とみなす面の傾きの下限 (法線の Y 成分)。これより急な面は滑り落ちる。 */
const MIN_FLOOR_NORMAL_Y = 0.6;
/** 1 フレームを何回に分けて計算するか。速く動いてもすり抜けないようにする。 */
const SUBSTEPS = 5;

/**
 * 一人称視点のプレイヤー。
 */
export class Player {
  /**
   * @param {THREE.PerspectiveCamera} camera プレイヤーの目になるカメラ
   * @param {HTMLElement} domElement マウスロックの対象になる要素
   * @param {object} options
   * @param {import('three/addons/math/Octree.js').Octree} options.octree 当たり判定に使う Octree
   * @param {THREE.Vector3} options.spawn 開始地点 (足もとの位置)
   */
  constructor(camera, domElement, { octree, spawn }) {
    this.camera = camera;
    this.octree = octree;
    this.spawn = spawn.clone();
    /** @type {Set<string>} 押されているキー (KeyboardEvent.code) */
    this.keys = new Set();
    /** 現在の速度 (m/s) */
    this.velocity = new THREE.Vector3();
    /** 足が地面に着いているか */
    this.onFloor = false;
    /** 体の当たり判定。start が足側、end が頭側の球の中心 */
    this.collider = new Capsule(new THREE.Vector3(), new THREE.Vector3(), RADIUS);
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
    const { x, y, z } = this.spawn;
    this.collider.start.set(x, y + RADIUS, z);
    this.collider.end.set(x, y + HEIGHT - RADIUS, z);
    this.velocity.set(0, 0, 0);
    this.onFloor = false;
    this._syncCamera();
  }

  /**
   * 足もとの位置。
   * @returns {THREE.Vector3}
   */
  get feet() {
    return this.collider.start.clone().setY(this.collider.start.y - RADIUS);
  }

  /**
   * カメラが Y 軸まわりに向いている角度。
   * @returns {number} ラジアン
   */
  get yaw() {
    return this._euler.setFromQuaternion(this.camera.quaternion).y;
  }

  /**
   * 1 フレーム分プレイヤーを動かす。歩く操作はマウスロック中だけ受け付ける。
   * @param {number} dt 前フレームからの経過時間 (秒)
   */
  update(dt) {
    const stepDt = dt / SUBSTEPS;
    for (let i = 0; i < SUBSTEPS; i++) this._step(stepDt);

    // 海に沈んだら開始地点に戻す
    if (this.camera.position.y < SEA_LEVEL) this.respawn();
  }

  /**
   * 物理計算を 1 ステップ進める。
   * @param {number} dt このステップの時間 (秒)
   */
  _step(dt) {
    const keys = this.controls.isLocked ? this.keys : new Set();
    const dir = moveDirection(keys, this.yaw);

    if (this.onFloor) {
      // 地面にいるときは入力どおりの速さで歩く (慣性で滑らないようにする)
      this.velocity.x = dir.x * WALK_SPEED;
      this.velocity.z = dir.z * WALK_SPEED;
      // 下り坂で浮かないよう、少しだけ地面に押し付ける
      this.velocity.y = -1;
    } else {
      this.velocity.y -= GRAVITY * dt;
    }

    this.collider.translate(this.velocity.clone().multiplyScalar(dt));
    this._resolveCollisions();
    this._syncCamera();
  }

  /** カプセルが物体にめり込んでいたら押し戻し、接地しているかを判定する。 */
  _resolveCollisions() {
    const result = this.octree.capsuleIntersect(this.collider);
    this.onFloor = false;
    if (!result) return;

    this.onFloor = result.normal.y > MIN_FLOOR_NORMAL_Y;
    if (!this.onFloor) {
      // 壁や急斜面では、面に向かう速度成分だけを打ち消して沿うように動かす
      this.velocity.addScaledVector(result.normal, -result.normal.dot(this.velocity));
    }
    if (result.depth >= 1e-10) {
      this.collider.translate(result.normal.multiplyScalar(result.depth));
    }
  }

  /** カメラを目の位置に合わせる。 */
  _syncCamera() {
    this.camera.position.copy(this.collider.start);
    this.camera.position.y += EYE_HEIGHT - RADIUS;
  }
}
