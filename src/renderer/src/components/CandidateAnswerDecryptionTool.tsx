import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Lock, Unlock } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { DataRow, Field, Panel, PanelBody, PanelHeader } from '@renderer/components/ui/panel'
import { EmptyState, Notice, StatusDot } from '@renderer/components/ui/states'
import FileInput from '@renderer/components/FileInput'
import JsonViewer from '@renderer/components/JsonViewer'

interface CandidateAnswerDecryptionToolProps {
  onBack?: () => void
}

export default function CandidateAnswerDecryptionTool({
  onBack
}: CandidateAnswerDecryptionToolProps): JSX.Element {
  // Navigation belongs to the outer workspace; keep the callback in the public API.
  void onBack
  const { t } = useTranslation()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    content?: string
    error?: string
  } | null>(null)

  const handleFileSelect = (file: File | null): void => {
    setSelectedFile(file)
    setResult(null)
  }

  const handleDecrypt = async (): Promise<void> => {
    if (!selectedFile) return

    setIsDecrypting(true)
    setResult(null)

    try {
      // @ts-ignore: Electron File objects expose a native filesystem path at runtime.
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
    <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(280px,0.75fr)_minmax(0,1.25fr)]">
      <Panel className="min-w-0">
        <PanelHeader
          eyebrow="01"
          title={t('selectEncryptedFile')}
          description={t('selectEncryptedFileDescription')}
          action={
            selectedFile ? (
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <StatusDot tone="success" />
                {t('selected')}
              </span>
            ) : (
              <Lock className="h-4 w-4 text-muted-foreground" />
            )
          }
        />
        <PanelBody className="space-y-5">
          <Field label={t('inputFile')}>
            <FileInput onFileSelect={handleFileSelect} accept="*" placeholder={t('chooseFile')} />
          </Field>

          {selectedFile && (
            <dl className="border-y border-border">
              <DataRow
                label={t('fileSize')}
                value={`${(selectedFile.size / 1024).toFixed(2)} KB`}
              />
            </dl>
          )}

          <div className="border-t border-border pt-4">
            <Button
              type="button"
              size="lg"
              onClick={handleDecrypt}
              disabled={!selectedFile || isDecrypting}
              className="w-full"
            >
              {isDecrypting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Unlock className="mr-2 h-4 w-4" />
              )}
              {isDecrypting ? t('decrypting') : t('decrypt')}
            </Button>
          </div>
        </PanelBody>
      </Panel>

      <Panel className="flex min-w-0 flex-col">
        <PanelHeader
          eyebrow="02"
          title={t('decryptionResult')}
          action={
            isDecrypting || result ? (
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <StatusDot
                  tone={
                    isDecrypting
                      ? 'active'
                      : result?.success
                        ? 'success'
                        : result
                          ? 'error'
                          : 'neutral'
                  }
                />
                {isDecrypting
                  ? t('decrypting')
                  : result?.success
                    ? t('decryptionSuccess')
                    : t('decryptionFailed')}
              </span>
            ) : undefined
          }
        />
        <PanelBody className="flex min-h-[380px] flex-1 flex-col" aria-live="polite">
          {isDecrypting ? (
            <div className="flex flex-1 items-center justify-center">
              <Notice
                tone="loading"
                title={t('decrypting')}
                description={selectedFile?.name}
                className="w-full"
              />
            </div>
          ) : result ? (
            result.success ? (
              <div className="min-h-0 flex-1 overflow-auto rounded-md border border-border bg-muted/20 p-4">
                {((): JSX.Element => {
                  try {
                    const parsed = JSON.parse(result.content || '{}')
                    return <JsonViewer data={parsed} />
                  } catch {
                    return (
                      <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-foreground">
                        {result.content}
                      </pre>
                    )
                  }
                })()}
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <Notice
                  tone="error"
                  title={t('decryptionFailed')}
                  description={result.error || t('unknownError')}
                  className="w-full"
                />
              </div>
            )
          ) : (
            <EmptyState
              icon={Lock}
              title={t('decrypt')}
              description={t('decryptionResultPlaceholder')}
              className="min-h-72 flex-1"
            />
          )}
        </PanelBody>
      </Panel>
    </div>
  )
}
