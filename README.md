# LaffCut

動画編集の前後で必要になる **音量の確認** と **字幕フォーマットの変換** を、ブラウザだけで完結させるユーティリティです。

https://github.com/user-attachments/assets/49b045fe-4adc-4fdd-accd-5720c8355a86

## なぜ作ったか

動画の音量を揃えるとき、これまでは編集ソフトに素材を読み込んで書き出し、別のツールで確認する、という往復が必要でした。素材が増えるほどこの確認だけで時間を取られます。

「音量を知りたいだけ」なら、その往復はいらないはずです。LaffCut はファイルをドロップするだけで音量を解析し、結果をグラフと CSV で返します。

## 特徴

- **ブラウザ内で完結する** — 解析は [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) で行うため、**音声ファイルをサーバーへ送信しません**。未公開の素材でも安心して扱えます
- **インストール不要** — ページを開いてファイルをドロップするだけ
- **結果を持ち出せる** — グラフで傾向を見て、CSV で数値を取り出せます

## 機能

### AudioAnalyzer — 音量の解析

音声ファイルをドロップすると音量を解析し、次を出力します。

- 音量の推移を**グラフで表示**
- 解析結果を **CSV でダウンロード**

### SubtitleConverter — 字幕フォーマットの変換

**SRT 形式の字幕ファイルを FCPXML 形式へ変換**します。Final Cut Pro にそのまま読み込める形式で書き出せます。

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
| フレームワーク | React Router v7 / React 18 / TypeScript |
| 音声処理 | ffmpeg.wasm（`@ffmpeg/ffmpeg`） |
| 可視化 | Chart.js / react-chartjs-2 |
| 字幕変換 | xml-js（FCPXML の生成） |
| UI | Tailwind CSS / Radix UI / lucide-react |
| ファイル入力 | react-dropzone |

## 関連ツール

[faster-whisper-to-srt](https://github.com/Kosuke-Ito/faster-whisper-to-srt) で音声から SRT を生成し、LaffCut で FCPXML に変換して Final Cut Pro に読み込む、という流れで使っています。
