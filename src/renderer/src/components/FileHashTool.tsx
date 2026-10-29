import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { Button } from '@renderer/components/ui/button'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Label } from '@renderer/components/ui/label'
import { Panel, PanelBody, PanelHeader } from '@renderer/components/ui/panel'
import { EmptyState, Notice, StatusDot } from '@renderer/components/ui/states'
import { toast } from '@renderer/components/ui/toast'
import { bytesToSize, cn } from '@renderer/lib/utils'
import {
  ClipboardCopy,
  FileSearch,
  Fingerprint,
  FolderOpen,
  Loader2,
  RefreshCcw,
  Trash2,
  X
} from 'lucide-react'

type HashResult = Awaited<ReturnType<Window['hash']['calculate']>>

interface AlgorithmOption {
  value: string
  label: string
}

const DEFAULT_ALGORITHM_OPTIONS: AlgorithmOption[] = [
  { value: 'md5', label: 'MD5' },
  { value: 'sha1', label: 'SHA-1' },
  { value: 'sha256', label: 'SHA-256' },
  { value: 'sha512', label: 'SHA-512' }
]

interface FileHashToolProps {
  onBack?: () => void
}

export default function FileHashTool({ onBack }: FileHashToolProps): JSX.Element {
  // Navigation belongs to the outer workspace; keep the callback in the public API.
  void onBack
  const { t } = useTranslation()
  const [availableAlgorithms, setAvailableAlgorithms] =
    useState<AlgorithmOption[]>(DEFAULT_ALGORITHM_OPTIONS)
  const [selectedAlgorithms, setSelectedAlgorithms] = useState<string[]>(
    DEFAULT_ALGORITHM_OPTIONS.map((option) => option.value)
  )
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [results, setResults] = useState<HashResult[]>([])
  const [isCalculating, setIsCalculating] = useState(false)
  const [isFetchingAlgorithms, setIsFetchingAlgorithms] = useState(false)

  useEffect(() => {
    let isMounted = true
    setIsFetchingAlgorithms(true)

    window.hash
      .getSupportedAlgorithms()
      .then((algorithms) => {
        if (!isMounted || !Array.isArray(algorithms) || algorithms.length === 0) return

        setAvailableAlgorithms(
          DEFAULT_ALGORITHM_OPTIONS.filter((option) => algorithms.includes(option.value))
        )

        setSelectedAlgorithms((prev) => {
          const intersection = prev.filter((algo) => algorithms.includes(algo))
          return intersection.length > 0 ? intersection : algorithms
        })
      })
      .catch((error) => {
        console.error('Failed to fetch supported algorithms:', error)
        toast.error({
          title: t('hashFetchAlgorithmsFailedTitle'),
          description: t('hashFetchAlgorithmsFailedDescription')
        })
      })
      .finally((): void => {
        if (isMounted) {
          setIsFetchingAlgorithms(false)
        }
      })

    return (): void => {
      isMounted = false
    }
  }, [t])

  const handleSelectFiles = useCallback(async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('dialog:openFile', {
        properties: ['openFile', 'multiSelections']
      })

      if (result?.canceled || !Array.isArray(result?.filePaths)) {
        return
      }

      setSelectedFiles((prev) => {
        const merged = new Set([...prev, ...result.filePaths])
        return Array.from(merged)
      })
      setResults([])
    } catch (error) {
      console.error('Failed to select files:', error)
      toast.error({
        title: t('hashSelectFileFailedTitle'),
        description: t('hashSelectFileFailedDescription')
      })
    }
  }, [t])

  const handleRemoveFile = useCallback((filePath: string) => {
    setSelectedFiles((prev) => prev.filter((item) => item !== filePath))
    setResults((prev) => prev.filter((item) => item.filePath !== filePath))
  }, [])

  const handleClearAll = useCallback(() => {
    setSelectedFiles([])
    setResults([])
  }, [])

  const handleToggleAlgorithm = useCallback((algorithm: string, checked: boolean) => {
    setSelectedAlgorithms((prev) => {
      if (checked) {
        return Array.from(new Set([...prev, algorithm]))
      }
      return prev.filter((item) => item !== algorithm)
    })
  }, [])

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => a.fileName.localeCompare(b.fileName))
  }, [results])

  const handleCopyHash = useCallback(
    async (hash: string) => {
      try {
        await navigator.clipboard.writeText(hash)
        toast.success({
          title: t('hashCopiedTitle'),
          description: t('hashCopiedDescription')
        })
      } catch (error) {
        console.error('Failed to copy hash:', error)
        toast.error({
          title: t('hashCopyFailedTitle'),
          description: t('hashCopyFailedDescription')
        })
      }
    },
    [t]
  )

  const handleCalculateHashes = useCallback(async () => {
    if (selectedFiles.length === 0) {
      toast.warning({
        title: t('hashNoFilesTitle'),
        description: t('hashNoFilesDescription')
      })
      return
    }

    if (selectedAlgorithms.length === 0) {
      toast.warning({
        title: t('hashNoAlgorithmsTitle'),
        description: t('hashNoAlgorithmsDescription')
      })
      return
    }

    setIsCalculating(true)
    try {
      const hashResults = await window.hash.calculateMultiple(selectedFiles, selectedAlgorithms)
      setResults(hashResults)
    } catch (error) {
      console.error('Failed to calculate hashes:', error)
      toast.error({
        title: t('hashCalculationFailedTitle'),
        description: t('hashCalculationFailedDescription')
      })
    } finally {
      setIsCalculating(false)
    }
  }, [selectedAlgorithms, selectedFiles, t])

  const handleRecalculateSingle = useCallback(
    async (filePath: string) => {
      if (selectedAlgorithms.length === 0) {
        toast.warning({
          title: t('hashNoAlgorithmsTitle'),
          description: t('hashNoAlgorithmsDescription')
        })
        return
      }
      try {
        const result = await window.hash.calculate(filePath, selectedAlgorithms)
        setResults((prev) => {
          const filtered = prev.filter((item) => item.filePath !== filePath)
          return [...filtered, result]
        })
        toast.success({
          title: t('hashRecalculateSuccessTitle'),
          description: t('hashRecalculateSuccessDescription')
        })
      } catch (error) {
        console.error('Failed to recalculate hash:', error)
        toast.error({
          title: t('hashCalculationFailedTitle'),
          description: t('hashCalculationFailedDescription')
        })
      }
    },
    [selectedAlgorithms, t]
  )

  return (
    <div className="min-w-0 space-y-4">
      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <Panel className="min-w-0">
          <PanelHeader
            eyebrow="01"
            title={t('selectedFiles')}
            description={t('selectFilesToCalculateHash')}
            action={
              <div className="flex items-center gap-1">
                <Button type="button" variant="outline" size="sm" onClick={handleSelectFiles}>
                  <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
                  {t('selectFiles')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleClearAll}
                  disabled={selectedFiles.length === 0 && results.length === 0}
                  aria-label={t('remove')}
                  title={t('remove')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            }
          />
          <PanelBody>
            {selectedFiles.length === 0 ? (
              <EmptyState
                icon={FileSearch}
                title={t('hashNoFilesSelected')}
                description={t('selectFilesToCalculateHash')}
                className="min-h-56"
              />
            ) : (
              <div className="overflow-hidden rounded-md border border-border">
                <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-3 py-2">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {t('fileList')}
                  </span>
                  <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <StatusDot tone="success" />
                    {selectedFiles.length}
                  </span>
                </div>
                <div className="max-h-72 divide-y divide-border overflow-y-auto">
                  {selectedFiles.map((file) => (
                    <div key={file} className="flex items-center gap-3 px-3 py-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
                        <FileSearch className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-foreground">
                          {file.split(/[/\\]/).pop()}
                        </p>
                        <p
                          className="mt-0.5 truncate text-[11px] text-muted-foreground"
                          title={file}
                        >
                          {file}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 hover:text-destructive"
                        onClick={() => handleRemoveFile(file)}
                        aria-label={t('remove')}
                        title={t('remove')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader
            eyebrow="02"
            title={t('selectHashAlgorithms')}
            description={t('selectHashAlgorithmsDescription')}
          />
          <PanelBody className="space-y-5">
            {isFetchingAlgorithms ? (
              <Notice tone="loading" title={t('hashAlgorithmsLoading')} />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {availableAlgorithms.map((option) => {
                  const checked = selectedAlgorithms.includes(option.value)
                  return (
                    <div
                      key={option.value}
                      className={cn(
                        'flex items-center gap-2.5 rounded-md border px-3 py-2.5 transition-colors',
                        checked
                          ? 'border-primary/35 bg-primary/5'
                          : 'border-border bg-muted/20 hover:bg-muted/40'
                      )}
                    >
                      <Checkbox
                        id={`algorithm-${option.value}`}
                        checked={checked}
                        onCheckedChange={(value) =>
                          handleToggleAlgorithm(option.value, value === true)
                        }
                      />
                      <Label
                        htmlFor={`algorithm-${option.value}`}
                        className={cn(
                          'cursor-pointer text-xs font-medium',
                          checked ? 'text-primary' : 'text-foreground'
                        )}
                      >
                        {option.label}
                      </Label>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="border-t border-border pt-4">
              <Button
                type="button"
                size="lg"
                onClick={handleCalculateHashes}
                disabled={isCalculating || selectedFiles.length === 0}
                className="w-full"
              >
                {isCalculating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Fingerprint className="mr-2 h-4 w-4" />
                )}
                {isCalculating ? t('calculating') : t('calculateHashes')}
              </Button>
            </div>
          </PanelBody>
        </Panel>
      </div>

      <Panel className="min-w-0">
        <PanelHeader
          eyebrow="03"
          title={t('hashResults')}
          description={t('hashResultsDescription')}
          action={
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <StatusDot
                tone={isCalculating ? 'active' : results.length > 0 ? 'success' : 'neutral'}
              />
              {t('hashResultCount', { count: results.length })}
            </span>
          }
        />
        <PanelBody className="p-0" aria-live="polite">
          {isCalculating && (
            <div className="border-b border-border p-4">
              <Notice tone="loading" title={t('calculating')} />
            </div>
          )}

          {results.length === 0 ? (
            !isCalculating && (
              <div className="p-5">
                <EmptyState
                  icon={Fingerprint}
                  title={t('hashNoResultsTitle')}
                  description={t('hashNoResultsDescription')}
                  className="min-h-56"
                />
              </div>
            )
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-xs">
                <caption className="sr-only">{t('hashResults')}</caption>
                <thead className="bg-muted/40 text-[11px] text-muted-foreground">
                  <tr>
                    <th scope="col" className="w-36 px-4 py-2.5 font-medium">
                      {t('selectHashAlgorithms')}
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-medium">
                      {t('hashResults')}
                    </th>
                    <th scope="col" className="w-24 px-4 py-2.5 text-right font-medium">
                      {t('copy')}
                    </th>
                  </tr>
                </thead>
                {sortedResults.map((result) => (
                  <tbody key={result.filePath}>
                    <tr className="border-t border-border bg-muted/20">
                      <td colSpan={3} className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-foreground">
                              {result.fileName}
                            </p>
                            <p
                              className="mt-1 max-w-2xl truncate text-[11px] text-muted-foreground"
                              title={result.filePath}
                            >
                              {result.filePath}
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                              <span>{bytesToSize(result.size)}</span>
                              <span>
                                {t('hashLastModified')}:{' '}
                                {format(new Date(result.modifiedAt), 'yyyy-MM-dd HH:mm:ss')}
                              </span>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRecalculateSingle(result.filePath)}
                              title={t('hashRecalculateSingle')}
                            >
                              <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
                              {t('recalculate')}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="hover:text-destructive"
                              onClick={() => handleRemoveFile(result.filePath)}
                              aria-label={t('remove')}
                              title={t('remove')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                    {Object.entries(result.hashes).map(([algorithm, hash]) => (
                      <tr
                        key={`${result.filePath}-${algorithm}`}
                        className="border-t border-border/70"
                      >
                        <td className="whitespace-nowrap px-4 py-3 align-top font-medium uppercase text-primary">
                          {algorithm}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <code className="break-all font-mono text-[11px] leading-relaxed text-foreground">
                            {hash}
                          </code>
                        </td>
                        <td className="px-4 py-3 text-right align-top">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyHash(hash)}
                          >
                            <ClipboardCopy className="mr-1.5 h-3.5 w-3.5" />
                            {t('copy')}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
            </div>
          )}
        </PanelBody>
      </Panel>
    </div>
  )
}
