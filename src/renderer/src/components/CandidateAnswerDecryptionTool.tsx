import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Lock, Unlock, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { BackToHomeButton } from '@renderer/components/ui/BackToHomeButton'
import { Label } from '@renderer/components/ui/label'
import FileInput from '@renderer/components/FileInput'
import JsonViewer from '@renderer/components/JsonViewer'

interface CandidateAnswerDecryptionToolProps {
  onBack?: () => void
}

export default function CandidateAnswerDecryptionTool({
  onBack
}: CandidateAnswerDecryptionToolProps): JSX.Element {
  const { t } = useTranslation()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; content?: string; error?: string } | null>(
    null
  )

  const handleFileSelect = (file: File | null): void => {
    setSelectedFile(file)
    setResult(null)
  }

  const handleDecrypt = async (): Promise<void> => {
    if (!selectedFile) return

    setIsDecrypting(true)
    setResult(null)

    try {
      // @ts-ignore
      const response = await window.decryption.decryptCandidateAnswer(selectedFile.path)
      setResult(response)
    } catch (error) {
      console.error('Decryption failed:', error)
      setResult({ success: false, error: (error as Error).message })
    } finally {
      setIsDecrypting(false)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-6 shadow-2xl shadow-indigo-900/10 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/60 md:p-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-indigo-100/60 via-white to-transparent dark:from-indigo-900/20 dark:via-slate-900" />
      
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex gap-3 flex-row items-center justify-between">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-indigo-100/70 px-3 py-1 text-sm font-medium text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-200">
              <Unlock className="h-4 w-4" />
              {t('candidateAnswerDecryption')}
            </div>
            {onBack && (
              <BackToHomeButton
                onClick={onBack}
                className="bg-indigo-100/70 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200 dark:hover:bg-indigo-900/50"
              />
            )}
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              {t('candidateAnswerDecryption')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('candidateAnswerDecryptionDescription')}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="min-w-0 border border-indigo-100/70 bg-white/90 shadow-xl shadow-indigo-900/10 backdrop-blur dark:border-indigo-500/20 dark:bg-slate-900/70 h-fit">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                {t('selectEncryptedFile')}
              </CardTitle>
              <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                {t('selectEncryptedFileDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-600 dark:text-slate-200">
                  {t('inputFile')}
                </Label>
                <FileInput
                  onFileSelect={handleFileSelect}
                  accept="*"
                  placeholder={t('chooseFile')}
                />
              </div>

              {selectedFile && (
                <div className="flex items-center gap-3 rounded-xl bg-indigo-50/50 px-3 py-2 text-sm shadow-sm ring-1 ring-indigo-100 dark:bg-indigo-900/20 dark:ring-indigo-500/30 max-w-full">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-500 dark:bg-indigo-900/40 dark:text-indigo-300">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex flex-1 flex-col overflow-hidden min-w-0">
                    <span className="truncate font-medium text-slate-700 dark:text-slate-200" title={selectedFile.name}>
                      {selectedFile.name}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleDecrypt}
                disabled={!selectedFile || isDecrypting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                {isDecrypting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {t('decrypting')}
                  </>
                ) : (
                  <>
                    <Unlock className="mr-2 h-4 w-4" />
                    {t('decrypt')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6 min-w-0">
            <Card className="h-full border border-slate-200/70 bg-white/95 shadow-xl shadow-indigo-900/10 dark:border-slate-700/60 dark:bg-slate-900/70 flex flex-col">
              <CardHeader className="pb-4 shrink-0">
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                  {t('decryptionResult')}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-[300px] overflow-hidden flex flex-col">
                {result ? (
                  result.success ? (
                    <div className="flex-1 overflow-auto rounded-lg bg-slate-50 p-4 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      {(() => {
                        try {
                          const parsed = JSON.parse(result.content || '{}')
                          return <JsonViewer data={parsed} />
                        } catch {
                          return (
                            <pre className="text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-all">
                              {result.content}
                            </pre>
                          )
                        }
                      })()}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center h-full">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        <AlertCircle className="h-8 w-8" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {t('decryptionFailed')}
                        </h3>
                        <p className="text-sm text-red-500 dark:text-red-400">
                          {result.error || t('unknownError')}
                        </p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center text-slate-400 dark:text-slate-500 h-full">
                    <Lock className="h-12 w-12 opacity-20" />
                    <p>{t('decryptionResultPlaceholder')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
