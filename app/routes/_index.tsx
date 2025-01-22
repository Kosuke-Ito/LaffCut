// import { useState } from 'react'
import { Link, type MetaFunction } from 'react-router'
import { AudioAnalyzer } from '~/components/AudioAnalyzer'
// import { SubtitleConverter } from '~/components/SubtitleConverter'

export const meta: MetaFunction = () => {
  return [
    { title: 'LaffCut' },
    {
      name: 'description',
      content: 'LaffCutは動画編集者向けの音量（ラウドネス）解析と字幕変換ツールです。',
    },
  ]
}

export default function Index() {
  // const [activeTab, setActiveTab] = useState<'audio' | 'subtitle'>('audio')

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-5xl font-bold text-black">LaffCut</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex space-x-4 mb-6">
          <h2 className="text-2xl font-bold">動画編集者向けの音量（ラウドネス）解析ツール</h2>
          {/* <button
            className={`text-xl font-bold px-8 py-4 rounded border-2 ${
              activeTab === 'audio'
                ? 'bg-black text-white border-white'
                : 'bg-white text-black border-black'
            }`}
            onClick={() => setActiveTab('audio')}
          >
            Audio Analysis
          </button> */}
          {/* <button
            className={`text-xl font-bold px-8 py-4 rounded border-2 ${
              activeTab === 'subtitle'
                ? 'bg-black text-white border-white'
                : 'bg-white text-black border-black'
            }`}
            onClick={() => setActiveTab('subtitle')}
          >
            Subtitle Converter
          </button> */}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          {/* {activeTab === 'audio' ? <AudioAnalyzer /> : <SubtitleConverter />} */}
          <AudioAnalyzer />
        </div>
      </main>
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <p className="text-sm text-gray-500">
            追加実装のご要望はXで
            <Link
              to="https://x.com/nikku_ject"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              @nikku_ject
            </Link>
            までお願いします。
          </p>
        </div>
      </footer>
    </div>
  )
}
