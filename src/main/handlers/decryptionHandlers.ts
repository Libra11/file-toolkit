import { ipcMain } from 'electron'
import fs from 'fs/promises'
import xxtea from 'xxtea-node'

export function registerDecryptionHandlers(): void {
  ipcMain.handle('decrypt-candidate-answer-v2', async (_, filePath: string) => {
    try {
      if (!filePath) {
        throw new Error('No file path provided')
      }

      // Read the file
      const fileBuffer = await fs.readFile(filePath)

      // Decrypt
      const password = 'iguokao.123'
      const decryptedData = xxtea.decrypt(fileBuffer, password)

      if (!decryptedData) {
        throw new Error('Decryption failed or invalid password')
      }

      // Convert to string
      const decryptedString = xxtea.toString(decryptedData)

      return { success: true, content: decryptedString }
    } catch (error) {
      console.error('Decryption error:', error)
      return { success: false, error: (error as Error).message }
    }
  })
}
