import type { MetaFunction } from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'
import { FileRejection } from 'node_modules/react-dropzone-esm/types/react-dropzone'
import { useDropzone } from 'react-dropzone-esm'

export const meta: MetaFunction = () => {
  return [
    { title: 'LaffCut' },
    {
      name: 'description',
      content: 'YouTubeへの動画投稿を手助けするLaffCutです。',
    },
  ]
}

export default function Index() {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const actionData = useActionData()

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0])
        setError(null)
      } else if (rejectedFiles.length > 0) {
        setError(
          '無効なファイル形式です。.wavまたは.mp3ファイルを選択してください。'
        )
      }
    },
    []
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/wav': ['.wav'],
      'audio/mpeg': ['.mp3'],
    },
    maxFiles: 1,
  })

  return (
    <div className="p-4">
      <h1 className="text-6xl font-bold">LaffCut</h1>
      <div className="grid grid-cols-2 ml-4">
        <div className="grid grid-cols-1 gap-8 mt-10">
          <h2 className="text-2xl font-bold">音声ファイルのラウドネス計測</h2>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-md py-40 px-4 w-2/3 text-center cursor-pointer ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-500'
            }`}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>ファイルをここにドロップ...</p>
            ) : file ? (
              <div>
                選択されたファイル:{' '}
                <p className="text-xl font-bold">{file.name}</p>
              </div>
            ) : (
              <p>
                ファイルをドラッグアンドドロップするか、クリックしてファイルを選択してください
              </p>
            )}
          </div>
          {error && <p className="text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  )
}
