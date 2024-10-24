import { useState } from 'react'
import pkg from 'xml-js'
const convert = pkg

export function SubtitleConverter() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [subtitleFile, setSubtitleFile] = useState<File | null>(null)
  const [convertedXML, setConvertedXML] = useState<string>('')
  const [outputFormat, setOutputFormat] = useState<'fcpxml' | 'xml'>('fcpxml')

  const parseSRT = async (
    file: File
  ): Promise<
    Array<{ id: number; start: string; end: string; text: string }>
  > => {
    const text = await file.text()
    const blocks = text.trim().split('\n\n')

    return blocks.map((block) => {
      const [id, time, ...textLines] = block.split('\n')
      const [start, end] = time.split(' --> ')
      return {
        id: parseInt(id),
        start,
        end,
        text: textLines.join('\n'),
      }
    })
  }

  const convertToFCPXML = (
    subtitles: Array<{ id: number; start: string; end: string; text: string }>
  ) => {
    const fcpxml = {
      fcpxml: {
        _attributes: {
          version: '1.8',
        },
        resources: {
          format: {
            _attributes: {
              id: 'r1',
              name: 'FFVideoFormat1080p30',
            },
          },
        },
        library: {
          event: {
            project: {
              sequence: {
                spine: {
                  title: subtitles.map((sub) => ({
                    text: {
                      _attributes: {
                        start: sub.start,
                        end: sub.end,
                      },
                      _text: sub.text,
                    },
                  })),
                },
              },
            },
          },
        },
      },
    }

    return convert.js2xml(fcpxml, { compact: true, spaces: 2 })
  }

  const convertToXML = (
    subtitles: Array<{ id: number; start: string; end: string; text: string }>
  ) => {
    const xml = {
      subtitles: {
        subtitle: subtitles.map((sub) => ({
          _attributes: {
            id: sub.id,
            start: sub.start,
            end: sub.end,
          },
          _text: sub.text,
        })),
      },
    }

    return convert.js2xml(xml, { compact: true, spaces: 2 })
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      setSubtitleFile(file)
      try {
        const subtitles = await parseSRT(file)
        const xml =
          outputFormat === 'fcpxml'
            ? convertToFCPXML(subtitles)
            : convertToXML(subtitles)
        setConvertedXML(xml)
      } catch (error) {
        console.error('Error converting subtitle:', error)
      }
    }
  }

  const handleDownload = () => {
    const blob = new Blob([convertedXML], { type: 'text/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `converted-subtitles.${outputFormat}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Output Format
        </label>
        <select
          value={outputFormat}
          onChange={(e) => setOutputFormat(e.target.value as 'fcpxml' | 'xml')}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="fcpxml">FCPXML</option>
          <option value="xml">XML</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Upload SRT File
        </label>
        <input
          type="file"
          accept=".srt"
          onChange={handleFileChange}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {convertedXML && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Converted XML</h3>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Download
            </button>
          </div>
          <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
            <code>{convertedXML}</code>
          </pre>
        </div>
      )}
    </div>
  )
}
