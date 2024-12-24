# Welcome to Remix!

- 📖 [Remix docs](https://remix.run/docs)

## Development

Run the dev server:

```shellscript
npm run dev
```

## Deployment

First, build your app for production:

```sh
npm run build
```

Then run the app in production mode:

```sh
npm start
```

Now you'll need to pick a host to deploy it to.

### DIY

If you're familiar with deploying Node applications, the built-in Remix app server is production-ready.

Make sure to deploy the output of `npm run build`

- `build/server`
- `build/client`

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever css framework you prefer. See the [Vite docs on css](https://vitejs.dev/guide/features.html#css) for more information.


## 現在の機能
現在は、AudioAnalyzerとSubtitleConverterの2つの機能があります。

AudioAnalyzerは、音声ファイルをアップロードして、音量を解析します。
SubtitleConverterは、サブタイトルファイルをアップロードして、サブタイトルを変換します。

### 機能
  それぞれの機能について、以下のように使用できます。

  AudioAnalyzer:
  - 音声ファイルをアップロードして、音量を解析します。
  - 音量のデータをグラフで表示します。
  - 音量のデータをCSVファイルでダウンロードできます。

  SubtitleConverter:
  - srt形式のサブタイトルファイルをアップロードして、fcpxml形式のサブタイトルを変換します。
  - 変換後のサブタイトルファイルをダウンロードできます。
