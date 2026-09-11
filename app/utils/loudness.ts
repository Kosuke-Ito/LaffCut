export type LoudnessPoint = {
  time: number
  lufs: number
}

/** データのないビンに入れるプレースホルダー値（グラフの下限） */
const SILENCE_LUFS = -150

/**
 * ffmpeg ebur128 フィルタの verbose ログから、時刻と Momentary LUFS のペアを抽出します。
 *
 * @param logText - ffmpeg の実行ログ全文
 */
export function extractLufsPoints(logText: string): LoudnessPoint[] {
  const lufsMatches = logText.matchAll(
    /t:\s*(\d+\.?\d*)\s+TARGET:[^M]+M:\s*(-?\d+\.?\d*)\s+S:/g
  )
  return Array.from(lufsMatches).map(match => ({
    time: Number.parseFloat(match[1]),
    lufs: Number.parseFloat(match[2]),
  }))
}

/**
 * 抽出済みポイントを binSeconds ごとのビンに平均して集計します。
 * 入力が空の場合は空配列を返します（グラフを出さない）。
 *
 * @param points - extractLufsPoints の結果
 * @param binSeconds - ビン幅（秒）
 */
export function binLoudnessPoints(
  points: LoudnessPoint[],
  binSeconds = 10
): LoudnessPoint[] {
  const lastPointTime = points.length > 0 ? points[points.length - 1].time : 0
  return Array.from({ length: Math.ceil(lastPointTime / binSeconds) }, (_, i) => {
    const startTime = i * binSeconds
    const endTime = (i + 1) * binSeconds
    const pointsInRange = points.filter(p => p.time >= startTime && p.time < endTime)
    const averageLufs =
      pointsInRange.length > 0
        ? pointsInRange.reduce((sum, p) => sum + p.lufs, 0) / pointsInRange.length
        : null
    return {
      time: startTime,
      lufs: averageLufs ?? SILENCE_LUFS,
    }
  })
}

/**
 * ffmpeg ログの Summary から Integrated loudness (LUFS) を取り出します。
 * 見つからなければ null を返します。
 *
 * @param logText - ffmpeg の実行ログ全文
 */
export function parseIntegratedLoudness(logText: string): number | null {
  const match = logText.match(
    /Summary:\s*Integrated loudness:\s*I:\s*(-?\d+\.\d+)\s*LUFS/m
  )
  return match ? Number.parseFloat(match[1]) : null
}
