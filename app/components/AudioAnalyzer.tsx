import { useCallback, useState, useRef, useEffect } from 'react'
import { FileAudio, Volume2 } from 'lucide-react'
import { FFmpeg } from '@ffmpeg/ffmpeg'

// 型定義
type LoudnessResults = {
  integratedLUFS: number | null
  YouTubeLUFS: number | null
}

export function AudioAnalyzer() {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState<LoudnessResults>({
    integratedLUFS: null,
    YouTubeLUFS: null,
  })
  const [loaded, setLoaded] = useState(false)
  const ffmpegRef = useRef<FFmpeg | null>(null)

  useEffect(() => {
    const loadFFmpeg = async () => {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const { toBlobURL } = await import('@ffmpeg/util')

      const ffmpeg = new FFmpeg()
      await ffmpeg.load({
        coreURL: await toBlobURL(
          'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
          'text/javascript'
        ),
        wasmURL: await toBlobURL(
          'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
          'application/wasm'
        ),
      })
      ffmpegRef.current = ffmpeg
      setLoaded(true)
    }

    loadFFmpeg()
  }, [])

  // 音声解析関数
  const analyzeAudio = useCallback(
    async (file: File) => {
      const { fetchFile } = await import('@ffmpeg/util')

      if (!file.type.startsWith('audio/')) {
        alert(
          '不正なファイル形式です。音声ファイル（WAV、MP3など）を選択してください。'
        )
        return
      }

      const MAX_FILE_SIZE = 300 * 1024 * 1024 // 300MB
      if (file.size > MAX_FILE_SIZE) {
        alert('ファイルサイズが大きすぎます（上限: 300MB）')
        return
      }

      if (!loaded || !ffmpegRef.current) {
        alert('FFmpegがロードされていません。少々お待ちください。')
        return
      }

      setAnalyzing(true)

      // loudnessLog を try-catch の外に宣言
      let loudnessLog = ''

      try {
        const ffmpeg = ffmpegRef.current
        await ffmpeg.writeFile('input.mp3', await fetchFile(file))

        ffmpeg.on('log', ({ message }: { message: string }) => {
          console.log('FFmpeg Log:', message)
          if (message.includes('I:') && message.includes('LUFS')) {
            loudnessLog = message
          }
        })

        await ffmpeg.exec([
          '-i',
          'input.mp3',
          '-filter:a',
          'ebur128=peak=true',
          '-f',
          'null',
          '-',
        ])

        await ffmpeg.deleteFile('input.mp3')

        if (!loudnessLog) {
          throw new Error('ラウドネス値が見つかりませんでした')
        }

        // 正規表現を修正
        const match = loudnessLog.match(/I:\s*(-?\d+\.\d+)\s*LUFS/)
        if (!match) {
          throw new Error('ラウドネス値の解析に失敗しました')
        }

        setResults({
          integratedLUFS: parseFloat(match[1]),
          YouTubeLUFS: parseFloat(match[1]) + 16,
        })
      } catch (error) {
        console.error('音声の解析中にエラーが発生しました:', error)

        // loudnessLog が設定されている場合は解析を試みる
        if (loudnessLog) {
          const match = loudnessLog.match(/I:\s*(-?\d+\.\d+)\s*LUFS/)
          if (match) {
            setResults({
              integratedLUFS: parseFloat(match[1]),
              YouTubeLUFS: parseFloat(match[1]) + 16,
            })
            return
          }
        }

        alert('音声の解析中にエラーが発生しました。')
      } finally {
        setAnalyzing(false)
      }
    },
    [loaded]
  )

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const droppedFile = e.dataTransfer.files[0]
      console.log('droppedFile:', droppedFile)
      setAudioFile(droppedFile)
      analyzeAudio(droppedFile)
    },
    [analyzeAudio]
  )

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
          {!loaded ? (
            <p className="text-gray-500">FFmpegをロード中...</p>
          ) : audioFile ? (
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
