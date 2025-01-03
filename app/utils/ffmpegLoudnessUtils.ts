import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

const ffmpeg = new FFmpeg()

const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd'

await ffmpeg.load({
  coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
  wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
})

export const calculateLoudness = async (audioFile: File): Promise<number> => {
  if (!ffmpeg.loaded) {
    await ffmpeg.load()
  }

  // ファイルをffmpegのファイルシステムに書き込み
  await ffmpeg.writeFile('input.mp3', await fetchFile(audioFile))

  // ebur128フィルタを使用してラウドネスを測定
  let loudnessLog = ''
  ffmpeg.on('log', ({ message }) => {
    if (message.includes('I:')) {
      loudnessLog = message
    }
  })

  await ffmpeg.exec([
    '-i',
    'input.mp3',
    '-filter:a',
    'ebur128=peak=true',
    '-f',
    'null',
    '-',
  ])

  // 一時ファイルの削除
  await ffmpeg.deleteFile('input.mp3')

  if (!loudnessLog) {
    throw new Error('ラウドネス値が見つかりませんでした')
  }

  // 統合ラウドネス値を抽出して返す
  const match = loudnessLog.match(/I:\s+(-?\d+\.\d+)\s+LUFS/)
  if (!match) {
    throw new Error('ラウドネス値の解析に失敗しました')
  }

  return parseFloat(match[1])
}
