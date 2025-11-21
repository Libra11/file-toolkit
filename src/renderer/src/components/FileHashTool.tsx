/**
 * Author: Libra
 * Date: 2025-09-15
 * LastEditors: Libra
 * Description: 文件校验与哈希快速生成工具
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import { Separator } from '@renderer/components/ui/separator'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Label } from '@renderer/components/ui/label'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { toast } from '@renderer/components/ui/toast'
import { bytesToSize, cn } from '@renderer/lib/utils'
import { BackToHomeButton } from '@renderer/components/ui/BackToHomeButton'
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
      .finally(() => {
        if (isMounted) {
          setIsFetchingAlgorithms(false)
        }
      })

    return () => {
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
    <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-6 shadow-2xl shadow-indigo-900/10 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/60 md:p-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-indigo-100/60 via-white to-transparent dark:from-indigo-900/25 dark:via-slate-900" />
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex gap-3 flex-row items-center justify-between">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-indigo-100/70 px-3 py-1 text-sm font-medium text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-200">
              <Fingerprint className="h-4 w-4" />
              {t('fileHashTool')}
            </div>
            {onBack && (
              <BackToHomeButton
                onClick={onBack}
                className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-800/40 dark:hover:text-indigo-300"
              />
            )}
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              {t('fileHashTool')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('fileHashDescription')}</p>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-indigo-100/70 bg-indigo-50/60 p-4 text-sm text-indigo-700 shadow-inner dark:border-indigo-500/30 dark:bg-indigo-900/20 dark:text-indigo-100 md:flex-row md:items-start md:gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-indigo-500 shadow-sm dark:bg-white/10 dark:text-indigo-200">
              <Fingerprint className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold">{t('fileHashTipTitle')}</p>
              <p className="text-xs leading-relaxed text-indigo-600/80 dark:text-indigo-100/80">
                {t('fileHashTipDescription')}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
          <Card className="border border-indigo-100/70 bg-white/90 shadow-xl shadow-indigo-900/10 dark:border-indigo-500/20 dark:bg-slate-900/70">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                {t('selectFiles')}
              </CardTitle>
              <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                {t('selectFilesToCalculateHash')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  className="h-11 px-4 flex items-center gap-2"
                  onClick={handleSelectFiles}
                >
                  <FolderOpen className="h-4 w-4" />
                  {t('selectFiles')}
                </Button>
                <Button
                  variant="ghost"
                  className="h-11 px-3 text-red-500 hover:text-red-600"
                  onClick={handleClearAll}
                  disabled={selectedFiles.length === 0 && results.length === 0}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="max-h-64">
                <div className="space-y-3">
                  {selectedFiles.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200/70 bg-slate-50/80 p-4 text-center dark:border-slate-700 dark:bg-slate-800/40">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t('hashNoFilesSelected')}
                      </p>
                    </div>
                  ) : (
                    selectedFiles.map((file) => (
                      <div
                        key={file}
                        className="flex items-start justify-between gap-3 rounded-xl border border-indigo-100/70 bg-white/90 px-3 py-2 shadow-sm dark:border-indigo-500/30 dark:bg-slate-900/70"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100/70 text-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-200">
                            <FileSearch className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p
                              className="truncate font-medium text-slate-700 dark:text-slate-200"
                              title={file.split(/[/\\]/).pop()}
                            >
                              {file.split(/[/\\]/).pop()}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {file}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(file)}
                          className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200"
                        >
                          {t('remove')}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/70 bg-white/95 shadow-xl shadow-indigo-900/10 dark:border-slate-700/60 dark:bg-slate-900/70">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                {t('selectHashAlgorithms')}
              </CardTitle>
              <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                {t('selectHashAlgorithmsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isFetchingAlgorithms ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('hashAlgorithmsLoading')}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {availableAlgorithms.map((option) => {
                    const checked = selectedAlgorithms.includes(option.value)
                    return (
                      <div key={option.value} className="flex items-center gap-2">
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
                            'text-sm font-medium transition-colors',
                            checked
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-slate-600 dark:text-slate-300'
                          )}
                        >
                          {option.label}
                        </Label>
                      </div>
                    )
                  })}
                </div>
              )}

              <Button
                onClick={handleCalculateHashes}
                disabled={isCalculating || selectedFiles.length === 0}
                className="mt-4 h-11 w-full rounded-xl bg-indigo-600 text-sm font-semibold shadow-lg shadow-indigo-900/20 transition hover:bg-indigo-700 disabled:bg-slate-300 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                {isCalculating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('calculating')}
                  </>
                ) : (
                  <>
                    <Fingerprint className="mr-2 h-4 w-4" />
                    {t('calculateHashes')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="h-11 px-4 flex items-center gap-2"
              onClick={handleSelectFiles}
            >
              <FolderOpen className="h-4 w-4" />
              {t('selectFiles')}
            </Button>
            <Button
              variant="secondary"
              className="h-11 px-4 flex items-center gap-2"
              onClick={handleCalculateHashes}
              disabled={isCalculating || selectedFiles.length === 0}
            >
              {isCalculating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Fingerprint className="h-4 w-4" />
              )}
              {t('calculateHashes')}
            </Button>
            <Button
              variant="ghost"
              className="h-11 px-3 text-red-500 hover:text-red-600"
              onClick={handleClearAll}
              disabled={selectedFiles.length === 0 && results.length === 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="rounded-lg border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/40">
            <div className="px-4 py-3 border-b border-slate-200/50 dark:border-slate-700/50">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <FileSearch className="h-4 w-4 text-indigo-500" />
                {t('selectedFiles')}
              </p>
            </div>
            <ScrollArea className="max-h-48">
              <div className="p-4 space-y-3">
                {selectedFiles.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t('hashNoFilesSelected')}
                  </p>
                ) : (
                  selectedFiles.map((file) => (
                    <div
                      key={file}
                      className="flex items-start justify-between gap-3 rounded-md border border-transparent bg-white/60 dark:bg-slate-800/60 px-3 py-2 transition hover:border-indigo-200 hover:shadow-sm"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                          {file.split(/[/\\]/).pop()}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {file}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-red-500"
                        onClick={() => handleRemoveFile(file)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/40">
          <div className="px-4 py-3 border-b border-slate-200/50 dark:border-slate-700/50">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {t('selectHashAlgorithms')}
            </p>
          </div>
          <div className="p-4 flex flex-wrap gap-4">
            {isFetchingAlgorithms ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('hashAlgorithmsLoading')}
              </div>
            ) : (
              availableAlgorithms.map((option) => {
                const checked = selectedAlgorithms.includes(option.value)
                return (
                  <div key={option.value} className="flex items-center gap-2">
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
                        'text-sm font-medium transition-colors',
                        checked
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-600 dark:text-slate-300'
                      )}
                    >
                      {option.label}
                    </Label>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <Card className="border border-emerald-200/70 bg-white/95 shadow-xl shadow-emerald-900/10 dark:border-emerald-500/30 dark:bg-emerald-900/30">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
                  <Fingerprint className="mr-2 h-5 w-5 text-emerald-500" />
                  {t('hashResults')}
                </CardTitle>
                <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                  {t('hashResultsDescription')}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">
                {t('hashResultCount', { count: results.length })}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200/70 bg-slate-50/80 p-8 text-center dark:border-slate-700 dark:bg-slate-800/40">
                <Fingerprint className="h-8 w-8 text-emerald-400 mb-3" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {t('hashNoResultsTitle')}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  {t('hashNoResultsDescription')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedResults.map((result) => (
                  <div
                    key={result.filePath}
                    className="rounded-xl border border-emerald-100/70 bg-white/90 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-900/40"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100/60 dark:border-emerald-500/30 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {result.fileName}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span className="truncate max-w-xs">{result.filePath}</span>
                          <span>•</span>
                          <span>{bytesToSize(result.size)}</span>
                          <span>•</span>
                          <span>
                            {t('hashLastModified')}:{' '}
                            {format(new Date(result.modifiedAt), 'yyyy-MM-dd HH:mm:ss')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200"
                          onClick={() => handleRecalculateSingle(result.filePath)}
                          title={t('hashRecalculateSingle')}
                        >
                          <RefreshCcw className="h-4 w-4 mr-1" />
                          {t('recalculate')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-red-500"
                          onClick={() => handleRemoveFile(result.filePath)}
                          title={t('remove')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="divide-y divide-emerald-100 dark:divide-emerald-800">
                      {Object.entries(result.hashes).map(([algorithm, hash]) => (
                        <div
                          key={`${result.filePath}-${algorithm}`}
                          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                              {algorithm}
                            </p>
                            <p className="text-sm font-mono text-slate-700 dark:text-slate-200 break-all">
                              {hash}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200"
                            onClick={() => handleCopyHash(hash)}
                          >
                            <ClipboardCopy className="h-4 w-4 mr-1" />
                            {t('copy')}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
