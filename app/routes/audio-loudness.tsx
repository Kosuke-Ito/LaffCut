import type { MetaFunction } from '@remix-run/node'
import { useState } from 'react'
import { Form, useActionData } from '@remix-run/react'
import { measureLoudness } from '../services/loudness.server'

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
  console.log('🚀 ~ action ~ file:', file)
  // ここでファイルを処理し、ラウドネスを計測します
  // 実際の実装はサーバーサイドで行います

  // 仮の結果を返します
  return { loudness: -14.5, peak: -1.2 }
}

export default function AudioLoudness() {
  const [file, setFile] = useState<File | null>(null)
  const actionData = useActionData()

  return (
    <div className="p-4">
      <h1 className="text-6xl font-bold">LaffCut</h1>
      <div>
        <h2>音声ファイルのラウドネス計測</h2>
        <Form method="post" encType="multipart/form-data">
          <input
            type="file"
            name="audioFile"
            accept=".mp3,.wav"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button type="submit" disabled={!file}>
            アップロード＆計測
          </button>
        </Form>
        {actionData && (
          <div>
            <h2>計測結果:</h2>
            <pre>{JSON.stringify(actionData, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
