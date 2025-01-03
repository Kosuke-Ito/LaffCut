import type { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

let ffmpeg: FFmpeg | null = null

const initializeFFmpeg = async (): Promise<FFmpeg> => {
  if (!ffmpeg) {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg')
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'

    ffmpeg = new FFmpeg()

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        'application/wasm'
      ),
    })

    if (!ffmpeg.loaded) {
      await ffmpeg.load()
    }
  }
  return ffmpeg
}

export const calculateLoudness = async (audioFile: File): Promise<number> => {
  if (typeof window === 'undefined') {
    throw new Error('この関数はクライアントサイドでのみ実行可能です。')
  }

  const ffmpegInstance = await initializeFFmpeg()

  // ファイルをffmpegの仮想ファイルシステムに書き込み
  await ffmpegInstance.writeFile('input.mp3', await fetchFile(audioFile))

  // ebur128フィルタを使用してラウドネスを測定
  let loudnessLog = ''
  ffmpegInstance.on('log', ({ message }) => {
    if (message.includes('I:')) {
      loudnessLog = message
    }
  })

  await ffmpegInstance.exec([
    '-i',
    'input.mp3',
    '-filter:a',
    'ebur128=peak=true',
    '-f',
    'null',
    '-',
  ])

  // 一時ファイルの削除
  await ffmpegInstance.deleteFile('input.mp3')

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
