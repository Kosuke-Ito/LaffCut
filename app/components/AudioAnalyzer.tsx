import { useCallback, useState } from 'react'
import { FileAudio, Volume2 } from 'lucide-react'
import {
  applyKWeighting,
  calculateIntegratedLoudness,
  convertToMono,
} from '~/utils/loudnessUtils'

export function AudioAnalyzer() {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState<{
    integratedLUFS: number | null
    YouTubeLUFS: number | null
  }>({
    integratedLUFS: null,
    YouTubeLUFS: null,
  })

  const analyzeAudio = async (file: File) => {
    if (!file.type.startsWith('audio/')) {
      alert(
        '不正なファイル形式です。音声ファイル（WAV、MP3など）を選択してください。'
      )
      return
    }

    // ファイルサイズチェック
    const MAX_FILE_SIZE = 300 * 1024 * 1024 // 300MB
    if (file.size > MAX_FILE_SIZE) {
      alert('ファイルサイズが大きすぎます（上限: 300MB）')
      return
    }

    setAnalyzing(true)
    try {
      // web audio apiのAudioContextをサンプルレート48kHzに固定して作成
      const audioContext = new AudioContext({
        sampleRate: 48000,
      })

      // アップロードされた音声データのバッファを変数に格納
      const arrayBuffer = await file.arrayBuffer()
      let audioBuffer

      try {
        // デコードされた AudioBuffer は AudioContext のサンプリングレート(48kHz)にリサンプリングされます
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      } catch (decodeError) {
        console.error('音声のデコードに失敗しました:', decodeError)
        alert(
          '音声ファイルの読み込みに失敗しました。ファイルが破損しているか、対応していない形式の可能性があります。'
        )
        setAnalyzing(false)
        return
      }

      // ステレオの場合はモノラルに変換
      const channelData: Float32Array =
        audioBuffer.numberOfChannels === 2
          ? convertToMono(audioBuffer)
          : audioBuffer.getChannelData(0)

      // 最大値と最小値を計算
      let max = -Infinity
      let min = Infinity
      for (let i = 0; i < channelData.length; i++) {
        if (channelData[i] > max) max = channelData[i]
        if (channelData[i] < min) min = channelData[i]
      }

      console.log('音声データ統計:', {
        channels: audioBuffer.numberOfChannels,
        sampleRate: audioBuffer.sampleRate,
        duration: audioBuffer.duration,
        length: channelData.length,
        max,
        min,
      })

      const filtered = applyKWeighting(channelData, audioContext.sampleRate)

      // 統合ラウドネスを計算
      const lufs = calculateIntegratedLoudness(
        filtered,
        audioContext.sampleRate
      )

      setResults({
        integratedLUFS: lufs,
        YouTubeLUFS: lufs + 16,
      })

      // メモリ解放
      audioContext.close()
    } catch (error) {
      console.error('音声の解析中にエラーが発生しました:', error)
      alert('音声の解析中にエラーが発生しました。')
    } finally {
      setAnalyzing(false)
    }
  }

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    console.log('droppedFile:', droppedFile)
    setAudioFile(droppedFile)
    analyzeAudio(droppedFile)
  }, [])

  return (
    <div className="space-y-10">
      <div className="bg-slate-50 p-4 rounded">
        <h3 className="text-lg font-medium">YouTubeアップロード推奨設定</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>推奨LUFS: -10 ~ -14 LUFS</li>
          <li>True Peak制限: -1 dBTP</li>
        </ul>
        <p className="text-xs text-gray-500">
          詳細は{' '}
          <a
            href="https://support.google.com/youtube/answer/1722171?hl=ja"
            className="text-blue-500 underline"
          >
            YouTubeエンコード設定推奨
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
            <p className="text-gray-500">ここにファイルをドラッ＆ドロップ</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-500">現在の音量</p>
              <p className="text-2xl font-bold">
                {results.integratedLUFS.toFixed(1)} LUFS
              </p>
              <p className="text-xs text-gray-400">
                音声全体の平均的な音量を表します
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-500">YouTube処理後の予測音量</p>
              <p className="text-2xl font-bold">
                {results.YouTubeLUFS?.toFixed(1) ?? '計測不能'} LUFS
              </p>
              <p className="text-xs text-gray-400">
                YouTubeがノーマライズを適用した後の予測値です
              </p>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded">
            <h4 className="font-medium mb-2">音量調整の推奨</h4>
            {results.integratedLUFS > -14 ? (
              <p className="text-sm">
                現在の音量は推奨範囲より大きいため、YouTubeで自動的に音量が下げられる可能性があります。
                {Math.abs(results.integratedLUFS + 14).toFixed(1)}
                dB程度の音量低下をお勧めします。
              </p>
            ) : results.integratedLUFS < -14 ? (
              <p className="text-sm">
                現在の音量は推奨範囲より小さいため、YouTubeで自動的に音量が上げられます。より良い音質を得るために、
                {Math.abs(results.integratedLUFS + 14).toFixed(1)}
                dB程度の音量増加をお勧めします。
              </p>
            ) : (
              <p className="text-sm">
                現在の音量は推奨範囲内です。調整の必要はありません。
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
