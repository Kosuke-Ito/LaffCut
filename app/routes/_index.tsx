import type { MetaFunction } from '@remix-run/node'

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
    </div>
  )
}
