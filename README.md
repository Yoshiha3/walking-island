# Walking Island

three.js で作った、ローポリの島を一人称視点で歩くだけのブラウザゲームです。
ビルド不要の素の HTML + JavaScript なので、GitHub Pages などの静的ホスティングにそのまま置けば動きます。

## 遊び方

| 操作 | キー |
| --- | --- |
| 開始 | 画面をクリック |
| 移動 | W A S D / 矢印キー |
| 視点 | マウス |
| 一時停止 | Esc |

海に落ちると開始地点に戻ります。

## ローカルで動かす

ES Modules を使っているので、`index.html` をファイルとして直接開くのではなく、ローカルサーバーから配信してください。

```sh
npm run serve        # npx serve . が起動するので、表示された URL を開く
# または
python3 -m http.server 8000   # http://localhost:8000/ を開く
```

## テスト

```sh
npm test   # node:test で地形・散布・移動のロジックをテスト
```

three.js に依存しないロジック（`src/world/heightmap.js`, `src/world/scatter.js`, `src/movement.js`）を Node でテストしています。
描画や当たり判定はブラウザ（chrome-devtools MCP など）で確認します。

## GitHub Pages で公開する

1. このリポジトリを GitHub に push する
2. リポジトリの **Settings → Pages** で、Source を「Deploy from a branch」、Branch を `main` / `(root)` にする
3. 数分後に `https://<ユーザー名>.github.io/<リポジトリ名>/` で遊べる

パスはすべて相対パスなので、サブパスでもそのまま動きます。`.nojekyll` は Jekyll の処理を無効にするために置いています。

## ファイル構成

```
index.html             importmap で three.js を CDN から読み込む
style.css
src/main.js            シーンの組み立てと描画ループ
src/player.js          一人称視点の操作と当たり判定 (Capsule + Octree)
src/movement.js        キー入力 → 移動方向 (純粋関数)
src/world/heightmap.js ノイズと島の高さ・色 (純粋関数)
src/world/scatter.js   小物の配置位置 (純粋関数)
src/world/terrain.js   地形メッシュ
src/world/water.js     水面
src/world/sky.js       空の背景とフォグ
src/world/props.js     木・岩・草花の読み込みと配置
assets/                空の画像と 3D モデル
tests/                 node:test のテスト
```

## クレジット

- 3D モデル: [Kenney - Nature Kit](https://kenney.nl/assets/nature-kit)（CC0）
- 空の画像: [Poly Haven - Kloofendal 48d Partly Cloudy (Pure Sky)](https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky)（CC0）
- ライブラリ: [three.js](https://threejs.org/)（MIT）

詳しくは [assets/CREDITS.md](assets/CREDITS.md) を参照してください。
