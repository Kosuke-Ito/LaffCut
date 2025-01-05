import { reactRouter } from '@react-router/dev/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [reactRouter(), tsconfigPaths()],

  optimizeDeps: {
    include: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
    exclude: ['@ffmpeg/ffmpeg'], // FFmpegを除外
  },
})
