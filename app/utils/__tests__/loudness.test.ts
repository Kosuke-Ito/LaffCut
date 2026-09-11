import { describe, expect, it } from 'vitest'
import {
  binLoudnessPoints,
  extractLufsPoints,
  parseIntegratedLoudness,
} from '../loudness'

// ffmpeg ebur128 フィルタの verbose ログを模したサンプル
const sampleLog = [
  '[Parsed_ebur128_0 @ 0x7f8] t: 0.1     TARGET:-23 LUFS    M: -30.0 S: -120.7     I:  -30.0 LUFS       LRA:   0.0 LU',
  '[Parsed_ebur128_0 @ 0x7f8] t: 5.2     TARGET:-23 LUFS    M: -20.0 S: -25.3     I:  -24.1 LUFS       LRA:   1.2 LU',
  '[Parsed_ebur128_0 @ 0x7f8] t: 12.4    TARGET:-23 LUFS    M: -18.5 S: -21.0     I:  -22.0 LUFS       LRA:   2.0 LU',
  'frame I/O情報などマッチしない行',
].join('\n')

const summaryLog = `
[Parsed_ebur128_0 @ 0x7f8] Summary:

  Integrated loudness:
    I:         -14.5 LUFS
    Threshold: -25.0 LUFS
`

describe('extractLufsPoints', () => {
  it('ログから時刻とMomentary LUFSのペアを抽出する', () => {
    expect(extractLufsPoints(sampleLog)).toEqual([
      { time: 0.1, lufs: -30.0 },
      { time: 5.2, lufs: -20.0 },
      { time: 12.4, lufs: -18.5 },
    ])
  })

  it('マッチする行がなければ空配列を返す', () => {
    expect(extractLufsPoints('no loudness lines here')).toEqual([])
  })
})

describe('binLoudnessPoints', () => {
  it('10秒ごとのビンで平均を取る', () => {
    const points = [
      { time: 0.1, lufs: -30.0 },
      { time: 5.2, lufs: -20.0 },
      { time: 12.4, lufs: -18.5 },
    ]
    expect(binLoudnessPoints(points)).toEqual([
      { time: 0, lufs: -25.0 },
      { time: 10, lufs: -18.5 },
    ])
  })

  it('データのないビンは -150 で埋める', () => {
    const points = [
      { time: 1.0, lufs: -20.0 },
      { time: 25.0, lufs: -10.0 },
    ]
    expect(binLoudnessPoints(points)).toEqual([
      { time: 0, lufs: -20.0 },
      { time: 10, lufs: -150 },
      { time: 20, lufs: -10.0 },
    ])
  })

  it('空入力なら空配列（グラフを出さない）', () => {
    expect(binLoudnessPoints([])).toEqual([])
  })
})

describe('parseIntegratedLoudness', () => {
  it('SummaryからIntegrated loudnessを取り出す', () => {
    expect(parseIntegratedLoudness(summaryLog)).toBe(-14.5)
  })

  it('Summaryがなければ null を返す', () => {
    expect(parseIntegratedLoudness(sampleLog)).toBeNull()
  })
})
