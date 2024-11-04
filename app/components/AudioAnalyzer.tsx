import { useCallback, useState } from 'react'
import { FileAudio, Volume2 } from 'lucide-react'

export function AudioAnalyzer() {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState<{
    integratedLUFS: number | null
    YouTubeLUFS: number | null
    truePeak: number | null
    shortTermLUFS: number | null
  }>({
    integratedLUFS: null,
    YouTubeLUFS: null,
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
      const channelData = audioBuffer.getChannelData(0)

      // K重み付けフィルタの適用
      const filtered = applyKWeighting(channelData, audioContext.sampleRate)

      // ブロック分析（400ms）
      const blockSize = Math.floor(0.4 * audioContext.sampleRate)
      const blocks = []
      for (let i = 0; i < filtered.length; i += blockSize) {
        const block = filtered.slice(i, i + blockSize)
        if (block.length === blockSize) {
          const blockPower =
            block.reduce((sum, sample) => sum + sample * sample, 0) / blockSize
          blocks.push(blockPower)
        }
      }

      // 相対ゲーティングの適用
      const gatedBlocks = applyGating(blocks)
      const meanSquare =
        gatedBlocks.reduce((sum, power) => sum + power, 0) / gatedBlocks.length
      const lufs = -0.691 + 10 * Math.log10(meanSquare)

      setResults({
        integratedLUFS: lufs,
        YouTubeLUFS: lufs + 14,
        truePeak: calculateTruePeak(channelData),
        shortTermLUFS: calculateShortTermLUFS(filtered),
      })

      // 処理後にメモリを解放
      audioContext.close()

      // 大きなバッファーは明示的に解放
      if (arrayBuffer) {
        arrayBuffer = null
      }
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
          <div className="grid grid-cols-4 gap-4">
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
              <p className="text-sm text-gray-500">YouTube LUFS</p>
              <p className="text-2xl font-bold">
                {results.YouTubeLUFS !== null
                  ? `${results.YouTubeLUFS.toFixed(1)} LUFS`
                  : '計測不能'}
              </p>
              <p className="text-xs text-gray-400">
                YouTubeの推奨LUFSを示す指標で、音量の一貫性を評価するのに役立ちます。
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

// K重み付けフィルタの実装
const applyKWeighting = (
  data: Float32Array,
  sampleRate: number
): Float32Array => {
  // フィルタ設計のためにIIRフィルタを使用
  // フィルタ係数はITU-R BS.1770-4の規格に従う
  const b = [
    /* フィルタの分子係数 */
  ]
  const a = [
    /* フィルタの分母係数 */
  ]
  // フィルタを適用
  const filteredData = iirFilter(data, b, a)
  return filteredData
}

// IIRフィルタの適用関数
const iirFilter = (
  data: Float32Array,
  b: number[],
  a: number[]
): Float32Array => {
  const output = new Float32Array(data.length)
  // フィルタリングの実装
  // ...
  return output
}

// 統合ラウドネスの計算
const calculateIntegratedLoudness = (
  data: Float32Array,
  sampleRate: number
): number => {
  const blockSize = Math.floor(0.4 * sampleRate) // 400ms

  // ブロックごとのエネルギー計算
  const energies: number[] = []
  let i = 0
  const step = Math.floor(blockSize * 0.75) // 75%オーバーラップ
  while (i + blockSize <= data.length) {
    const block = data.slice(i, i + blockSize)
    const power = calculateBlockEnergy(block)
    energies.push(power)
    i += step
  }

  // 絶対ゲート（-70 LUFS）を適用
  const absoluteThreshold = -70
  const gatedEnergies = energies.filter((energy) => {
    const l = -0.691 + 10 * Math.log10(energy)
    return l > absoluteThreshold
  })

  // 相対ゲート（平均から-10 LU）を適用
  const meanEnergy =
    gatedEnergies.reduce((sum, val) => sum + val, 0) / gatedEnergies.length
  const relativeThreshold = 10 * Math.log10(meanEnergy) - 10
  const finalGatedEnergies = gatedEnergies.filter((energy) => {
    const l = 10 * Math.log10(energy)
    return l > relativeThreshold
  })

  // 統合ラウドネスの計算
  const integratedEnergy =
    finalGatedEnergies.reduce((sum, val) => sum + val, 0) /
    finalGatedEnergies.length
  const integratedLoudness = -0.691 + 10 * Math.log10(integratedEnergy)

  return integratedLoudness
}

// ブロックのエネルギー計算
const calculateBlockEnergy = (block: Float32Array): number => {
  let sum = 0
  for (let i = 0; i < block.length; i++) {
    sum += block[i] * block[i]
  }
  return sum / block.length
}
