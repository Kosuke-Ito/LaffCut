import type { MetaFunction } from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'
import { useState, useCallback } from 'react'
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

export const action = async ({ request }: { request: Request }) => {
  const formData = await request.formData()
  const file = formData.get('audioFile')

  // 仮の結果を返します
  return { loudness: -14.5, peak: -1.2 }
}

export default function Index() {
  const [file, setFile] = useState<File | null>(null)
  const actionData = useActionData()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'audio/*': ['.mp3', '.wav'] },
  })

  return (
    <div className="p-4">
      <h1 className="text-6xl font-bold">LaffCut</h1>
      <div className="grid grid-cols-1 gap-4 mt-10">
        <h2 className="text-2xl font-bold">音声ファイルのラウドネス計測</h2>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>ファイルをここにドロップ...</p>
          ) : (
            <p>
              ファイルをドラッグアンドドロップするか、クリックしてファイルを選択してください
            </p>
          )}
        </div>
        {file && <p>選択されたファイル: {file.name}</p>}
      </div>
    </div>
  )
}
