'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '~/components/ui/button'
import { Progress } from '~/components/ui/progress'
import { FileAudio, Volume2 } from 'lucide-react'

export default function AudioVolumeAnalyzer() {
  const [file, setFile] = useState<File | null>(null)
  const [averageVolume, setAverageVolume] = useState<number>(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type.startsWith('audio/')) {
      setFile(droppedFile)
    }
  }, [])

  const analyzeVolume = useCallback(async () => {
    if (!file) return

    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)()
    audioContextRef.current = audioContext

    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    const analyser = audioContext.createAnalyser()
    const source = audioContext.createBufferSource()
    source.buffer = audioBuffer
    source.connect(analyser)
    analyser.connect(audioContext.destination)

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    source.start(0)

    let totalVolume = 0
    let sampleCount = 0

    const calculateVolume = () => {
      analyser.getByteFrequencyData(dataArray)
      const average =
        dataArray.reduce((acc, value) => acc + value, 0) / bufferLength
      totalVolume += average
      sampleCount++
      const currentAverageVolume = Math.round(
        (totalVolume / sampleCount / 255) * 100
      )
      setAverageVolume(currentAverageVolume)
    }

    const intervalId = setInterval(calculateVolume, 100)

    // Draw waveform
    const canvas = canvasRef.current
    if (canvas) {
      const canvasContext = canvas.getContext('2d')
      if (canvasContext) {
        const drawWaveform = () => {
          requestAnimationFrame(drawWaveform)
          analyser.getByteTimeDomainData(dataArray)

          canvasContext.fillStyle = 'rgb(200, 200, 200)'
          canvasContext.fillRect(0, 0, canvas.width, canvas.height)
          canvasContext.lineWidth = 2
          canvasContext.strokeStyle = 'rgb(0, 0, 0)'
          canvasContext.beginPath()

          const sliceWidth = (canvas.width * 1.0) / bufferLength
          let x = 0

          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0
            const y = (v * canvas.height) / 2

            if (i === 0) {
              canvasContext.moveTo(x, y)
            } else {
              canvasContext.lineTo(x, y)
            }

            x += sliceWidth
          }

          canvasContext.lineTo(canvas.width, canvas.height / 2)
          canvasContext.stroke()
        }

        drawWaveform()
      }
    }

    return () => {
      clearInterval(intervalId)
      source.stop()
      audioContext.close()
    }
  }, [file])

  useEffect(() => {
    if (file) {
      analyzeVolume()
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [file, analyzeVolume])

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
            <canvas ref={canvasRef} className="w-full h-32 mb-4" />
            <div className="flex items-center mb-2">
              <Volume2 className="mr-2 h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                平均音量:
              </span>
            </div>
            <Progress value={averageVolume} className="w-full" />
            <p className="mt-2 text-center text-sm text-gray-600">
              {averageVolume}%
            </p>
            <Button
              className="mt-4 w-full"
              onClick={() => {
                setFile(null)
                setAverageVolume(0)
              }}
            >
              リセット
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
