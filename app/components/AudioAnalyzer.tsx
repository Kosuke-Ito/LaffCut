import { useState } from 'react'

export function AudioAnalyzer() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState<{
    integratedLUFS: number | null
    truePeak: number | null
    shortTermLUFS: number | null
  }>({
    integratedLUFS: null,
    truePeak: null,
    shortTermLUFS: null,
  })

  const analyzeAudio = async (file: File) => {
    setAnalyzing(true)
    try {
      const audioContext = new AudioContext()
      const arrayBuffer = await file.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      // Calculate LUFS (simplified approximation)
      const channelData = audioBuffer.getChannelData(0)
      let sum = 0
      let peak = 0

      for (let i = 0; i < channelData.length; i++) {
        sum += channelData[i] * channelData[i]
        peak = Math.max(peak, Math.abs(channelData[i]))
      }

      const rms = Math.sqrt(sum / channelData.length)
      const lufs = 20 * Math.log10(rms) - 0.691 // Simplified LUFS calculation

      setResults({
        integratedLUFS: lufs,
        truePeak: 20 * Math.log10(peak),
        shortTermLUFS: lufs - 2, // Simplified short-term LUFS
      })
    } catch (error) {
      console.error('Error analyzing audio:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setAudioFile(file)
      analyzeAudio(file)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Upload Audio File
        </label>
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="mt-1 block w-full"
        />
      </div>

      {analyzing && (
        <div className="text-center">
          <p>Analyzing audio...</p>
        </div>
      )}

      {results.integratedLUFS !== null && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Analysis Results</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-500">Integrated LUFS</p>
              <p className="text-2xl font-bold">
                {results.integratedLUFS.toFixed(1)}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-500">True Peak</p>
              <p className="text-2xl font-bold">
                {results.truePeak.toFixed(1)} dB
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-500">Short-term LUFS</p>
              <p className="text-2xl font-bold">
                {results.shortTermLUFS.toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
