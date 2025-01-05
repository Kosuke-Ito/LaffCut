import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

export const calculateLoudness = async (audioFile: File): Promise<number> => {
  if (typeof window === 'undefined') {
    throw new Error('この関数はクライアントサイドでのみ実行可能です。')
  }

  const ffmpeg = new FFmpeg()
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'

  try {
    const coreURL = await toBlobURL(
      `${baseURL}/ffmpeg-core.js`,
      'text/javascript'
    )
    console.log('coreURL:', coreURL)
    const wasmURL = await toBlobURL(
      `${baseURL}/ffmpeg-core.wasm`,
      'application/wasm'
    )
    console.log('wasmURL:', wasmURL)

    await ffmpeg.load({
      coreURL,
      wasmURL,
      log: true,
    })
  } catch (error) {
    console.error('FFmpegのロードに失敗しました:', error)
    throw error
  }

  try {
    await ffmpeg.writeFile('input.mp3', await fetchFile(audioFile))

    let loudnessLog = ''
    ffmpeg.on('log', ({ message }) => {
      if (message.includes('Integrated')) {
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

    await ffmpeg.deleteFile('input.mp3')

    if (!loudnessLog) {
      throw new Error('ラウドネス値が見つかりませんでした')
    }

    const match = loudnessLog.match(/Integrated:\s*(-?\d+\.\d+)\s*LUFS/)
    if (!match) {
      throw new Error('ラウドネス値の解析に失敗しました')
    }

    return parseFloat(match[1])
  } catch (error) {
    console.error('処理中にエラーが発生しました:', error)
    throw error
  }
}
