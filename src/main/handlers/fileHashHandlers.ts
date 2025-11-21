/*
 * @Author: Libra
 * @Date: 2025-09-15
 * @LastEditors: Libra
 * @Description: 文件校验与哈希处理器
 */
import { ipcMain } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

const DEFAULT_ALGORITHMS = ['md5', 'sha1', 'sha256', 'sha512'] as const

type SupportedAlgorithm = (typeof DEFAULT_ALGORITHMS)[number]

interface HashComputationResult {
  filePath: string
  fileName: string
  size: number
  modifiedAt: number
  hashes: Record<string, string>
}

function isSupportedAlgorithm(algorithm: string): algorithm is SupportedAlgorithm {
  return DEFAULT_ALGORITHMS.includes(algorithm as SupportedAlgorithm)
}

function normalizeAlgorithms(algorithms?: string[]): SupportedAlgorithm[] {
  if (!algorithms || algorithms.length === 0) {
    return [...DEFAULT_ALGORITHMS]
  }

  const uniqueAlgorithms = Array.from(new Set(algorithms.map((algo) => algo.toLowerCase())))
  const supported = uniqueAlgorithms.filter(isSupportedAlgorithm)

  if (supported.length === 0) {
    throw new Error('No supported hash algorithms provided')
  }

  return supported
}

async function computeFileHashes(
  filePath: string,
  algorithms?: string[]
): Promise<HashComputationResult> {
  const selectedAlgorithms = normalizeAlgorithms(algorithms)

  const stats = await fs.promises.stat(filePath)
  if (!stats.isFile()) {
    throw new Error('Provided path is not a file')
  }

  return await new Promise<HashComputationResult>((resolve, reject) => {
    const hashObjects = selectedAlgorithms.map((algo) => ({
      algo,
      hash: crypto.createHash(algo)
    }))

    const stream = fs.createReadStream(filePath)
    stream.on('error', (error) => reject(error))
    stream.on('data', (chunk) => {
      for (const { hash } of hashObjects) {
        hash.update(chunk)
      }
    })
    stream.on('end', () => {
      const hashes: Record<string, string> = {}
      for (const { algo, hash } of hashObjects) {
        hashes[algo] = hash.digest('hex')
      }

      resolve({
        filePath,
        fileName: path.basename(filePath),
        size: stats.size,
        modifiedAt: stats.mtimeMs,
        hashes
      })
    })
  })
}

async function computeMultipleFiles(
  filePaths: string[],
  algorithms?: string[]
): Promise<HashComputationResult[]> {
  const tasks = filePaths.map((filePath) => computeFileHashes(filePath, algorithms))
  return await Promise.all(tasks)
}

export function registerFileHashHandlers(): void {
  ipcMain.handle('hash:get-supported-algorithms', () => [...DEFAULT_ALGORITHMS])

  ipcMain.handle('hash:calculate', async (_, filePath: string, algorithms?: string[]) => {
    if (typeof filePath !== 'string' || filePath.trim() === '') {
      throw new Error('Invalid file path')
    }

    return await computeFileHashes(filePath, algorithms)
  })

  ipcMain.handle(
    'hash:calculate-multiple',
    async (_, filePaths: string[], algorithms?: string[]) => {
      if (!Array.isArray(filePaths) || filePaths.length === 0) {
        throw new Error('No files provided')
      }

      return await computeMultipleFiles(filePaths, algorithms)
    }
  )
}
