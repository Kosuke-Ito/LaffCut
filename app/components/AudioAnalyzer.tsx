import { useCallback, useState } from 'react'
import { FileAudio, Volume2 } from 'lucide-react'

export function AudioAnalyzer() {
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
    if (!file.type.startsWith('audio/')) {
      console.error('不正なファイル形式です')
      return
    }

    const MAX_FILE_SIZE = 300 * 1024 * 1024 // 例: 100MB
    if (file.size > MAX_FILE_SIZE) {
      console.error('ファイルサイズが大きすぎます')
      return
    }

    setAnalyzing(true)
    try {
      const audioContext = new AudioContext()
      const arrayBuffer = await file.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      // LUFSの計算（単純化された近似）
      const channelData = audioBuffer.getChannelData(0)
      let sum = 0
      let peak = 0

      for (let i = 0; i < channelData.length; i++) {
        sum += channelData[i] * channelData[i]
        peak = Math.max(peak, Math.abs(channelData[i]))
      }

      const rms = Math.sqrt(sum / channelData.length)
      const lufs = 20 * Math.log10(rms) - 0.691 // 単純化されたLUFS計算

      setResults({
        integratedLUFS: lufs,
        truePeak: 20 * Math.log10(peak),
        shortTermLUFS: lufs - 2, // 単純化された短期LUFS
      })
    } catch (error) {
      console.error('音声の解析中にエラーが発生しました:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type.startsWith('audio/')) {
      setAudioFile(droppedFile)
      analyzeAudio(droppedFile)
    }
  }, [])

  return (
    <div className="space-y-10">
      <div className="bg-slate-50 p-4 rounded">
        <h3 className="text-lg font-medium">YouTubeアップロード推奨設定</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>推奨LUFS：-10 ~ -14 LUFS</li>
          <li>True Peak制限：-1 dBTP</li>
        </ul>
        <p className="text-xs text-gray-500">
          詳細は{' '}
          <a
            href="https://support.google.com/youtube/answer/1722171?hl=ja"
            className="text-blue-500 underline"
          >
            YouTubeのエンコード設定推奨
          </a>{' '}
          を参照してください。
        </p>
      </div>

      <div className="grid place-items-center">
        <div
          className="w-full max-w-md p-6 bg-white rounded-lg shadow-md flex flex-col items-center justify-center border-2 border-dashed border-gray-300"
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <FileAudio className="w-12 h-12 text-gray-400 mb-4" />
          {audioFile ? (
            <p className="text-gray-500">{audioFile.name}</p>
          ) : (
            <p className="text-gray-500">ここにファイルをドラッグ＆ドロップ</p>
          )}
        </div>
      </div>

      {analyzing && (
        <div className="text-center">
          <Volume2 className="inline-block w-6 h-6 mr-2 animate-pulse" />
          <p>音声を解析中...</p>
        </div>
      )}

      {results.integratedLUFS !== null && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">解析結果</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-500">LUFS</p>
              <p className="text-2xl font-bold">
                {results.integratedLUFS.toFixed(1)}
              </p>
              <p className="text-xs text-gray-400">
                音声の全体的なラウドネスを示す指標で、音量の一貫性を評価するのに役立ちます。
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-500">True Peak</p>
              <p className="text-2xl font-bold">
                {results.truePeak !== null
                  ? `${results.truePeak.toFixed(1)} dB`
                  : '計測不能'}
              </p>
              <p className="text-xs text-gray-400">
                一番大きな音のレベルを示し、音が割れる（クリッピング）可能性を確認するのに役立ちます。
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-500">Short-term LUFS</p>
              <p className="text-2xl font-bold">
                {results.shortTermLUFS !== null
                  ? `${results.shortTermLUFS.toFixed(1)} LUFS`
                  : '計測不能'}
              </p>
              <p className="text-xs text-gray-400">
                短期間のラウドネスを表す指標で、音声の一時的な音量変化を評価するのに使用されます。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
