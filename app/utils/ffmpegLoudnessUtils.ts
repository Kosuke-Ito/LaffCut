import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg'

export async function measureLoudnessWithFFmpeg(
  inputFile: File
): Promise<void> {
  const ffmpeg = createFFmpeg({
    log: true, // デバッグ情報を取得したい場合には true
  })

  // on('stderr')等を使ってログをキャプチャ
  ffmpeg.setLogger(({ type, message }) => {
    if (type === 'fferr') {
      console.log('[FFmpeg stderr]', message)
      // ここで ebur128 の結果をパースし、ラウドネス数値を抽出できる
      // 例えば "Integrated loudness:" や "LRA:" などの行を正規表現で探す
    }
  })

  // FFmpeg.wasm の読み込み
  await ffmpeg.load()

  // 入力ファイル（例えば WAV など）をメモリ上の FS に書き込み
  ffmpeg.FS('writeFile', 'input.wav', await fetchFile(inputFile))

  // ffmpeg コマンド実行 (EPUB R128 で分析する例)
  // -analyzeduration や -probesize の指定は状況に応じて追加
  await ffmpeg.run('-i', 'input.wav', '-af', 'ebur128', '-f', 'null', '-')

  // あとは on('stderr') でログが得られるのでそこから値をパースする
  // 実行後、必要に応じて FS から除去
  ffmpeg.FS('unlink', 'input.wav')

  // FFmpeg インスタンスを再利用しない場合は、メモリを解放する
  // (特に大量のファイルを扱う場合など)
  // ffmpeg.exit()
}
