# threejs-demo

three.js で作る、一人称視点でローポリの島を歩くだけのブラウザゲーム。

## 方針
- **ビルド不要**: 素の HTML + JavaScript (ES Modules)。three.js は `index.html` の importmap で CDN（バージョン固定）から読み込む。GitHub Pages にそのまま置いて動くこと。
- パスはすべて相対パス（`./src/...`, `./assets/...`）。サブパス (`/<repo>/`) 配信でも動くようにする。
- three.js に依存しない数値ロジック（地形の高さ・散布など）は別モジュールに分け、Node でテストできるようにする。

## 開発の進め方
- 作業は `main` から**ブランチを切って**行う。`main` へのマージはユーザーが確認して行う（Claude はマージしない）。
- **小さく作る → テストを通す → コミット** を繰り返す。
- コミットメッセージは `feat:` `fix:` `refactor:` `docs:` `test:` `chore:` などのプレフィックス + **日本語**。
  - 例: `feat: 島の地形と水面を描画`
- 関数・クラス・モジュールには JSDoc (`/** ... */`、`@param` / `@returns`) を書く。

## コマンド
- ローカル起動: `npm run serve`（`npx serve .`）→ 表示された URL を開く
- テスト: `npm test`（`node --test`、`tests/*.test.js`）
- ブラウザでの動作確認は chrome-devtools MCP（スクリーンショット・コンソールエラー確認・`evaluate_script`）で行う。
