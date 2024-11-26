/**
 * ゲーティング処理を適用して有効なブロックのみを返します。
 * ITU-R BS.1770-4 規格に基づく絶対ゲート（-70 LUFS）と相対ゲート（平均ラウドネス - 10 LUFS）を適用します。
 *
 * @param blocks - 各ブロックのエネルギー値
 * @returns ゲーティング後のブロックエネルギー値
 */
export const applyGating = (blocks: number[]): number[] => {
  if (!blocks || blocks.length === 0) {
    throw new Error('blocks 配列が空です。')
  }

  // 各ブロックのラウドネスを計算（LUFS単位）
  const lufsBlocks = blocks.map(
    (blockPower) => 10 * Math.log10(blockPower) - 0.691
  )

  // 統合ラウドネスの初期計算（ゲーティング前）
  const meanLoudness =
    lufsBlocks.reduce((sum, lufs) => sum + lufs, 0) / lufsBlocks.length

  // 絶対ゲートと相対ゲートの閾値設定
  const absoluteThreshold = -70 // 絶対ゲートの閾値（LUFS）
  const relativeThreshold = meanLoudness - 10 // 相対ゲートの閾値（LUFS）

  // ゲーティング適用：絶対閾値と相対閾値を両方満たすブロックのみを保持
  const gatedBlocks = lufsBlocks.filter(
    (lufs) => lufs > absoluteThreshold && lufs > relativeThreshold
  )

  return gatedBlocks
}

// K重み付けフィルタの実装
export const applyKWeighting = (data: Float32Array): Float32Array => {
  if (!data || data.length === 0) {
    throw new Error('data が無効です。')
  }

  // フィルタ設計のためにIIRフィルタを使用
  // フィルタ係数はITU-R BS.1770-4の規格に従う
  const b = [0.06745527, 0.13491054, 0.06745527]
  const a = [1.0, -1.1429805, 0.4128016]
  // フィルタを適用
  const filteredData = iirFilter(data, b, a)
  return filteredData
}

// IIRフィルタの適用関数
export const iirFilter = (
  data: Float32Array,
  b: number[],
  a: number[]
): Float32Array => {
  if (!data || data.length === 0) {
    throw new Error('data が無効です。')
  }
  if (b.length !== a.length) {
    throw new Error('フィルタ係数 b と a の長さが一致しません。')
  }

  const output = new Float32Array(data.length)
  const buffer = new Float32Array(a.length).fill(0)

  for (let n = 0; n < data.length; n++) {
    // 入力データをバッファに追加
    buffer[0] = data[n]
    // フィルタ計算
    let y = 0
    for (let i = 0; i < b.length; i++) {
      y += b[i] * buffer[i]
    }
    for (let i = 1; i < a.length; i++) {
      y -= a[i] * output[n - i] || 0
    }
    output[n] = y
    // バッファをシフト
    for (let i = a.length - 1; i > 0; i--) {
      buffer[i] = buffer[i - 1]
    }
  }

  return output
}

// 統合ラウドネスの計算
export const calculateIntegratedLoudness = (
  data: Float32Array,
  sampleRate: number
): number => {
  if (!data || data.length === 0) {
    throw new Error('data が無効です。')
  }
  if (sampleRate <= 0) {
    throw new Error('sampleRate は正の値でなければなりません。')
  }

  const blockSize = Math.floor(0.4 * sampleRate) // 400ms

  // ブロックごとのエネルギー計算
  const energies: number[] = []
  let i = 0
  const step = Math.floor(blockSize * 0.75) // 75%オーバーラップ
  while (i + blockSize <= data.length) {
    const block = data.slice(i, i + blockSize)
    const power = calculateBlockEnergy(block)
    energies.push(power)
    i += step
  }

  if (energies.length === 0) {
    throw new Error('エネルギーブロックが存在しません。')
  }

  // 絶対ゲート（-70 LUFS）を適用
  const absoluteThreshold = -70
  const gatedEnergies = energies.filter((energy) => {
    const l = -0.691 + 10 * Math.log10(energy)
    return l > absoluteThreshold
  })

  if (gatedEnergies.length === 0) {
    throw new Error('ゲーティング後のエネルギーブロックが存在しません。')
  }

  // 相対ゲート（平均から-10 LU）を適用
  const meanEnergy =
    gatedEnergies.reduce((sum, val) => sum + val, 0) / gatedEnergies.length
  const relativeThreshold = 10 * Math.log10(meanEnergy) - 10
  const finalGatedEnergies = gatedEnergies.filter((energy) => {
    const l = 10 * Math.log10(energy)
    return l > relativeThreshold
  })

  if (finalGatedEnergies.length === 0) {
    throw new Error('相対ゲーティング後のエネルギーブロックが存在しません。')
  }

  // 統合ラウドネスの計算
  const integratedEnergy =
    finalGatedEnergies.reduce((sum, val) => sum + val, 0) /
    finalGatedEnergies.length
  const integratedLoudness = -0.691 + 10 * Math.log10(integratedEnergy)

  return integratedLoudness
}

// ブロックのエネルギー計算
export const calculateBlockEnergy = (block: Float32Array): number => {
  if (!block || block.length === 0) {
    throw new Error('block が無効です。')
  }

  let sum = 0
  for (let i = 0; i < block.length; i++) {
    sum += block[i] * block[i]
  }
  return sum / block.length
}
