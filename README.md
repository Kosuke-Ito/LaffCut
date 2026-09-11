# LaffCut

動画素材の**音量（ラウドネス）解析**を、ブラウザだけで完結させるツールです。

**デモ: https://laffcut.pages.dev/**

https://github.com/user-attachments/assets/49b045fe-4adc-4fdd-accd-5720c8355a86

## なぜ作ったか

動画の音量を揃えるとき、これまでは編集ソフトに素材を読み込んで書き出し、別のツールで確認する、という往復が必要でした。素材が増えるほどこの確認だけで時間を取られます。

「音量を知りたいだけ」なら、その往復はいらないはずです。LaffCut はファイルをドロップするだけで音量を解析し、結果を数値とグラフで返します。

## 特徴

- **ブラウザ内で完結する** — 解析は [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) で行うため、**音声ファイルをサーバーへ送信しません**。未公開の素材でも安心して扱えます
- **インストール不要** — ページを開いてファイルをドロップするだけ

## 機能

音声ファイルをドロップすると EBU R128 準拠のラウドネス測定（FFmpeg の `ebur128` フィルタ）を行い、次を出力します。

- **統合ラウドネス（Integrated LUFS）** — 音声全体の平均的な音量
- **YouTube 換算値** — YouTube のラウドネス正規化（-14 LUFS 基準）を踏まえた目安
- **音量推移のグラフ** — 時間軸に沿ったラウドネス変化を Chart.js で可視化

## 使い方

```bash
pnpm install
pnpm dev
```

ブラウザで表示されたアドレスを開き、ファイルをドロップしてください。

本番ビルドは次のとおりです。

```bash
pnpm build
pnpm start
```

## 技術構成

| 領域 | 使用技術 |
|---|---|
| フレームワーク | React Router v7 / React 19 / TypeScript |
| 音声処理 | ffmpeg.wasm（`@ffmpeg/ffmpeg`） |
| 可視化 | Chart.js / react-chartjs-2 |
| UI | Tailwind CSS / lucide-react |
| ホスティング | Cloudflare Pages |
