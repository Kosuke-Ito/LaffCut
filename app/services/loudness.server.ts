import { promisify } from 'util'
import { exec } from 'child_process'
import ffmpeg from 'ffmpeg-static'
import { LoudnessValidator } from 'loudness-validator'

const execAsync = promisify(exec)

export async function measureLoudness(filePath: string) {
  try {
    // FFmpegを使用して音声ファイルを一時的なWAVファイルに変換
    const tempWavPath = `${filePath}.wav`
    await execAsync(
      `${ffmpeg} -i ${filePath} -acodec pcm_s16le -ar 44100 ${tempWavPath}`
    )

    // ラウドネスを計測
    const validator = new LoudnessValidator()
    const result = await validator.analyze(tempWavPath)

    return {
      integratedLoudness: result.integratedLoudness,
      truePeak: result.truePeak,
    }
  } catch (error) {
    console.error('ラウドネス計測エラー:', error)
    throw error
  }
}
