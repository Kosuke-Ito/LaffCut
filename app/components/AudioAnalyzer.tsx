import { useState, useRef, useEffect, useCallback } from 'react'
import { FileAudio, Volume2 } from 'lucide-react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL, fetchFile } from '@ffmpeg/util'

// Chrome Performance Memory API の型定義
interface PerformanceMemory {
  jsHeapSizeLimit: number
  totalJSHeapSize: number
  usedJSHeapSize: number
}

interface WindowWithMemory extends Window {
  performance: Performance & {
    memory?: PerformanceMemory
  }
}

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

  // 追加: 進捗を管理する状態
  const [progress, setProgress] = useState<number>(0)

  const MAX_FILE_SIZE = 200 * 1024 * 1024 // 200MB

  // useCallbackを使用して、メモ化
  const load = useCallback(async () => {
    if (!ffmpegRef.current) {
      const ffmpeg = new FFmpeg()
      ffmpegRef.current = ffmpeg
      ffmpeg.on('log', ({ message }) => {
        loudnessLogRef.current += `${message}\n`
      })
      ffmpeg.on('progress', ({ progress }) => {
        setProgress(Math.ceil(progress * 100))
      })
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm'
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

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
    setProgress(0) // 進捗をリセット

    const ffmpeg = ffmpegRef.current
    try {
      // メモリ使用量の監視
      const memory = (window as WindowWithMemory).performance.memory
      if (memory?.usedJSHeapSize && memory?.jsHeapSizeLimit) {
        if (memory.usedJSHeapSize > 0.8 * memory.jsHeapSizeLimit) {
          throw new Error('メモリ使用量が制限に達しました。')
        }
      }

      // ファイル名のサニタイズ
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      await ffmpeg.writeFile(safeFileName, await fetchFile(file))

      await ffmpeg.exec([
        '-i',
        safeFileName,
        '-filter:a',
        'ebur128',
        '-f',
        'null',
        '-',
        '-loglevel',
        'verbose',
      ])

      // console.log('ラウドネス解析ログ:', loudnessLogRef.current)

      const match = loudnessLogRef.current.match(
        /Summary:\s*Integrated loudness:\s*I:\s*(-?\d+\.\d+)\s*LUFS/m
      )
      if (!match) {
        throw new Error('ラウドネス値の解析に失敗しました。')
      }

      setResults({
        integratedLUFS: Number.parseFloat(match[1]),
        YouTubeLUFS: Number.parseFloat(match[1]) + 14,
      })
    } catch (error) {
      console.error('音声の解析中にエラーが発生しました:', error)
      if (error instanceof Error) {
        alert(`エラーが発生しました: ${error.message}`)
      } else {
        alert('予期せぬエラーが発生しました。')
      }
    } finally {
      setAnalyzing(false)
      // 一時ファイルの確実な削除
      try {
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        await ffmpeg.deleteFile(safeFileName)
      } catch (error) {
        console.error('一時ファイルの削除に失敗しました:', error)
      }
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

    // ファイルサイズのチェック
    if (droppedFile.size > MAX_FILE_SIZE) {
      alert(
        'ファイルサイズが大きすぎます。200MB以下のファイルを使用してください。'
      )
      return
    }

    // ファイルタイプの厳密な検証
    const validMimeTypes = [
      'audio/mp3',
      'audio/wav',
      'audio/mpeg', // mp3ファイルの一般的なMIMEタイプ
      'audio/wave', // wavファイルの代替MIMEタイプ
      'audio/x-wav', // wavファイルの代替MIMEタイプ
      'video/mp4',
    ]

    // ファイル拡張子の検証
    const extension = droppedFile.name.split('.').pop()?.toLowerCase()
    const validExtensions = ['mp3', 'wav', 'mp4']

    if (
      !validMimeTypes.includes(droppedFile.type) &&
      (!extension || !validExtensions.includes(extension))
    ) {
      alert('不正なファイル形式です。mp3, wav, mp4のみ対応しています。')
      console.log('File type:', droppedFile.type)
      console.log('File extension:', extension)
      return
    }

    setAudioFile(droppedFile)
    analyzeAudio(droppedFile)
  }

  return (
    <div className="space-y-10">
      <div className="bg-slate-50 p-4 rounded">
        <h3 className="text-lg font-medium">YouTubeアップロード推奨設定</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>推奨LUFS: -10 ~ -14 LUFS</li>
        </ul>
        <p className="text-xs text-gray-500">
          詳細は{' '}
          <a
            href="https://support.google.com/youtube/answer/1722171?hl=ja"
            className="text-blue-500 underline"
            target="_blank"
            rel="noreferrer"
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
          {/* 追加: 進捗表示 */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-green-600 h-4 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-700 mt-2">{progress}%</p>
          </div>
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
