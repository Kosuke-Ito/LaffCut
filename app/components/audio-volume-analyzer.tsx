'use client'

import { useState, useCallback } from 'react'
import { Button } from "~/components/ui/button"
import { Progress } from "~/components/ui/progress"
import { FileAudio, Volume2 } from "lucide-react"

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

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    )

    const source = offlineContext.createBufferSource()
    source.buffer = audioBuffer

    const analyser = offlineContext.createAnalyser()
    analyser.fftSize = 2048

    source.connect(analyser)
    analyser.connect(offlineContext.destination)

    source.start(0)

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    let totalVolume = 0
    let sampleCount = 0

    offlineContext.startRendering().then((renderedBuffer) => {
      const stepSize = Math.floor(renderedBuffer.length / 1000) // Analyze 1000 points

      for (let i = 0; i < renderedBuffer.length; i += stepSize) {
        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((acc, value) => acc + value, 0) / bufferLength
        totalVolume += average
        sampleCount++
      }

      const finalAverageVolume = Math.round((totalVolume / sampleCount / 255) * 100)
      setAverageVolume(finalAverageVolume)
      setIsAnalyzing(false)
    })

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
