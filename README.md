# Walking Island

ローポリの小さな島を、一人称視点でのんびり歩くだけのブラウザゲームです。
敵もゴールもありません。草原や砂浜、木々のあいだを気ままに散歩してください。

## ▶ 遊ぶ

**https://yoshiha3.github.io/walking-island/**

インストール不要で、ブラウザで開くだけで遊べます。

## 操作方法

| 操作 | キー |
| --- | --- |
| ゲームを始める | 画面をクリック |
| 移動 | W A S D / 矢印キー |
| 視点を動かす | マウス |
| 一時停止 | Esc（もう一度クリックで再開） |

- 海に入って沈むと、スタート地点に戻ります。
- 木や岩にはぶつかります。坂は上り下りできます。

## 動作環境

- **キーボードとマウスのあるパソコン**で遊んでください（スマートフォン・タブレットには対応していません）。
- Chrome と Safari で動作を確認しています。WebGL に対応した最新のブラウザ（Edge / Firefox など）でも動く想定です。
- 画面をクリックするとマウスカーソルが消えて視点操作になります。カーソルを戻すには Esc を押してください。

## うまく動かないとき

- **真っ暗・何も表示されない**: ページを再読み込みしてください。three.js をインターネット経由で読み込んでいるため、オフラインでは動きません。
- **クリックしても始まらない**: ブラウザの設定でマウスのロック（ポインターロック）が許可されているか確認してください。
- **動きがカクカクする**: ほかのタブやアプリを閉じると改善することがあります。

## クレジット

- 3D モデル: [Kenney - Nature Kit](https://kenney.nl/assets/nature-kit)（CC0）
- 空の画像: [Poly Haven - Kloofendal 48d Partly Cloudy (Pure Sky)](https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky)（CC0）
- ライブラリ: [three.js](https://threejs.org/)（MIT）

詳しくは [assets/CREDITS.md](assets/CREDITS.md) を参照してください。

## 開発者向け

ビルド不要の HTML + JavaScript (ES Modules) で作られています。

```sh
npm run serve   # ローカルサーバーを起動して、表示された URL を開く
npm test        # ロジックのテスト (node:test)
```

開発の進め方は [CLAUDE.md](CLAUDE.md) を参照してください。
