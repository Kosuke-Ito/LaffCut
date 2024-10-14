import type { MetaFunction } from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'
import { useState } from 'react'
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

export default function Index() {
  const [file, setFile] = useState<File | null>(null)
  const actionData = useActionData()

  return (
    <div className="p-4">
      <h1 className="text-6xl font-bold">LaffCut</h1>
      <div className="grid grid-cols-1 gap-4 mt-10">
        <h2 className="text-2xl font-bold">音声ファイルのラウドネス計測</h2>
        {/* ファイルアップロードフォーム */}
        {/* ファイルを投げ込むエリアを作る */}
        <div className="border border-gray-300 rounded-md">
          <input type="file" name="audioFile" accept=".mp3,.wav" />
        </div>
      </div>
    </div>
  )
}
