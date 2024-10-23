'use client'

import { useState, useCallback } from 'react'
import { Button } from '~/components/ui/button'
import { Progress } from '~/components/ui/progress'
import { FileAudio, Volume2 } from 'lucide-react'

export function AudioVolumeAnalyzerComponent() {
  const [file, setFile] = useState<File | null>(null)
  const [averageVolume, setAverageVolume] = useState<number>(0)
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type.startsWith('audio/')) {
      setFile(droppedFile)
      setAverageVolume(0)
      setIsAnalyzing(false)
    }
  }, [])

  const analyzeVolume = useCallback(async () => {
    if (!file) return
    setIsAnalyzing(true)

    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)()
    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    // オフラインコンテキストを作成
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    )

    // ソースを作成
    const source = offlineContext.createBufferSource()
    source.buffer = audioBuffer

    // BS.1770-4に基づくフィルターを作成
    const highPassFilter = offlineContext.createBiquadFilter()
    highPassFilter.type = 'highpass'
    highPassFilter.frequency.value = 38
    highPassFilter.Q.value = 0.5

    const highShelfFilter = offlineContext.createBiquadFilter()
    highShelfFilter.type = 'highshelf'
    highShelfFilter.frequency.value = 1500
    highShelfFilter.gain.value = 4.0

    // フィルターチェーンを接続
    source.connect(highPassFilter)
    highPassFilter.connect(highShelfFilter)

    // ブロックサイズ (400ms)
    const blockSize = Math.floor(audioBuffer.sampleRate * 0.4)
    const channels = audioBuffer.numberOfChannels
    const length = audioBuffer.length

    let blockCount = 0
    const blocks: number[] = []

    // 各チャンネルのデータを処理
    for (let i = 0; i < length; i += blockSize) {
      let blockPower = 0
      const currentBlockSize = Math.min(blockSize, length - i)

      for (let channel = 0; channel < channels; channel++) {
        const channelData = audioBuffer.getChannelData(channel)
        let sum = 0

        for (let j = 0; j < currentBlockSize; j++) {
          const sample = channelData[i + j]
          sum += sample * sample
        }

        // チャンネルの重み付け (BS.1770-4)
        const weight = channel <= 2 ? 1.0 : 1.41
        blockPower += (sum / currentBlockSize) * weight
      }

      const blockLoudness = -0.691 + 10 * Math.log10(blockPower)
      blocks.push(blockLoudness)
      blockCount++
    }

    // 相対ゲーティング (-10 LU下のブロックを除外)
    const ungatedLoudness =
      -0.691 +
      10 *
        Math.log10(
          blocks.reduce((a, b) => a + Math.pow(10, b / 10), 0) / blockCount
        )
    const gatingThreshold = ungatedLoudness - 10

    const gatedBlocks = blocks.filter((block) => block > gatingThreshold)
    const lufs =
      gatedBlocks.length > 0
        ? -0.691 +
          10 *
            Math.log10(
              gatedBlocks.reduce((a, b) => a + Math.pow(10, b / 10), 0) /
                gatedBlocks.length
            )
        : -70

    // LUFS値を0-100の範囲に正規化
    setAverageVolume(lufs)
    setIsAnalyzing(false)
  }, [file])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div
        className="w-full max-w-md p-6 bg-white rounded-lg shadow-md"
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {!file && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <FileAudio className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              音声ファイルをドラッグ＆ドロップしてください
            </p>
          </div>
        )}
        {file && (
          <>
            <h2 className="text-lg font-semibold mb-4">{file.name}</h2>
            <div className="flex items-center mb-2">
              <Volume2 className="mr-2 h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">平均音量:</span>
            </div>
            <Progress value={averageVolume} className="w-full mb-2" />
            <p className="text-center text-sm text-gray-600 mb-4">
              {isAnalyzing ? '分析中...' : `${averageVolume}%`}
            </p>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={analyzeVolume}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? '分析中...' : '分析開始'}
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => {
                  setFile(null)
                  setAverageVolume(0)
                  setIsAnalyzing(false)
                }}
                disabled={isAnalyzing}
              >
                リセット
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
