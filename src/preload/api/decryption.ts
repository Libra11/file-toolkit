import { ipcRenderer } from 'electron'

export interface DecryptionAPI {
  decryptCandidateAnswer: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>
}

export const decryption: DecryptionAPI = {
  decryptCandidateAnswer: (filePath: string) => ipcRenderer.invoke('decrypt-candidate-answer-v2', filePath)
}
