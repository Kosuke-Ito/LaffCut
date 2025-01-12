import { useState, useRef, useEffect } from 'react'
import { FileAudio, Volume2 } from 'lucide-react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL, fetchFile } from '@ffmpeg/util'

// 型定義
type LoudnessResults = {
  integratedLUFS: number | null
  YouTubeLUFS: number | null
}

/**
 * AudioAnalyzer コンポーネントは、ユーザーがアップロードした音声ファイルを解析し、
 * ラウドネスレベルを計測します。FFmpeg を使用して音声ファイルを処理し、
 * 結果を表示します。
 *
 * @returns React コンポーネント
 */
export const AudioAnalyzer = () => {
  /**
   * アップロードされた音声ファイルを保持する状態
   */
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState<LoudnessResults>({
    integratedLUFS: null,
    YouTubeLUFS: null,
  })

  const [loaded, setLoaded] = useState(false)
  const ffmpegRef = useRef<FFmpeg | null>(null)
  const loudnessLogRef = useRef<string>('')

  /**
   * コンポーネントのマウント時に FFmpeg をロードします。
   * 動的に FFmpeg のコアファイルと WebAssembly モジュールを読み込みます。
   */
  const load = async () => {
    if (!ffmpegRef.current) {
      const ffmpeg = new FFmpeg()
      ffmpegRef.current = ffmpeg

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'

      ffmpeg.on('log', ({ message }) => {
        console.log('FFmpeg log:', message)
        loudnessLogRef.current += `${message}\n`
      })
      // toBlobURL is used to bypass CORS issue, urls with the same
      // domain can be used directly.
      await ffmpeg.load({
        coreURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.js`,
          'text/javascript'
        ),
        wasmURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.wasm`,
          'application/wasm'
        ),
      })
      setLoaded(true)
    }
  }

  useEffect(() => {
    load()
  }, [])

  /**
   * アップロードされた音声ファイルを解析し、ラウドネスレベルを計測します。
   *
   * @param file - 解析対象の音声ファイル
   */
  const analyzeAudio = async (file: File) => {
    if (!loaded || !ffmpegRef.current) {
      alert('FFmpegがロードされていません。少々お待ちください。')
      return
    }

    setAnalyzing(true)
    loudnessLogRef.current = ''

    const ffmpeg = ffmpegRef.current
    try {
      // ファイルをFFmpegの仮想ファイルシステムに書き込む
      await ffmpeg.writeFile('input.mp3', await fetchFile(file))

      // ラウドネス解析を実行
      await ffmpeg.exec([
        '-i',
        'input.mp3',
        '-filter:a',
        'ebur128',
        '-f',
        'null',
        '-',
      ])

      console.log('ラウドネス解析ログ:', loudnessLogRef.current)

      const match = loudnessLogRef.current.match(
        /Summary:\s*Integrated loudness:\s*I:\s*(-?\d+\.\d+)\s*LUFS/m
      )
      if (!match) {
        throw new Error('ラウドネス値の解析に失敗しました')
      }

      setResults({
        integratedLUFS: parseFloat(match[1]),
        YouTubeLUFS: parseFloat(match[1]) + 14,
      })
    } catch (error) {
      console.error('音声の解析中にエラーが発生しました:', error)
      alert('音声の解析中にエラーが発生しました。')
    } finally {
      setAnalyzing(false)
      await ffmpeg.deleteFile('input.mp3')
    }
  }

  /**
   * ファイルがドロップされたときに呼び出されるハンドラー
   *
   * @param e - ドラッグイベント
   */
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    console.log('droppedFile:', droppedFile)
    setAudioFile(droppedFile)
    analyzeAudio(droppedFile)
  }

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
            <p className="text-gray-500">ロード中...</p>
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
        </div>
      )}
    </div>
  )
}
