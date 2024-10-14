import type { MetaFunction } from '@remix-run/node'
import { Link } from '@remix-run/react'
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
  return (
    <div>
      <h1>Hello World</h1>
      <Link to="/audio-loudness">音量サイズ解析</Link>
    </div>
  )
}
