import { useState } from 'react'
import type { MetaFunction } from '@remix-run/node'
import { AudioAnalyzer } from '~/components/AudioAnalyzer'
import { SubtitleConverter } from '~/components/SubtitleConverter'

export const meta: MetaFunction = () => {
  return [
    { title: 'Video Editor Utility' },
    {
      name: 'description',
      content: 'Audio analysis and subtitle conversion tools for video editors',
    },
  ]
}

export default function Index() {
  const [activeTab, setActiveTab] = useState<'audio' | 'subtitle'>('audio')

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-black">LaffCut</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex space-x-4 mb-6">
          <button
            className={`px-4 py-2 rounded ${
              activeTab === 'audio' ? 'bg-blue-500 text-white' : 'bg-white'
            }`}
            onClick={() => setActiveTab('audio')}
          >
            Audio Analysis
          </button>
          <button
            className={`px-4 py-2 rounded ${
              activeTab === 'subtitle' ? 'bg-blue-500 text-white' : 'bg-white'
            }`}
            onClick={() => setActiveTab('subtitle')}
          >
            Subtitle Converter
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          {activeTab === 'audio' ? <AudioAnalyzer /> : <SubtitleConverter />}
        </div>
      </main>
    </div>
  )
}
