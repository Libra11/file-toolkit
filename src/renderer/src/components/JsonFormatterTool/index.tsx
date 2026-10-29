import { useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { FileCode2, ListTree, Minimize2, Wand } from 'lucide-react'
import JsonViewer from '@renderer/components/JsonViewer'
import { Button } from '@renderer/components/ui/button'
import { Panel } from '@renderer/components/ui/panel'
import { EmptyState, Notice, StatusDot } from '@renderer/components/ui/states'
import { Textarea } from '@renderer/components/ui/textarea'
import { cn } from '@renderer/lib/utils'

interface JsonFormatterToolProps {
  onBack?: () => void
}

type OutputMode = 'text' | 'tree'

const DEFAULT_JSON = '{\n  "name": "File Toolkit",\n  "version": "1.0.0"\n}'

export default function JsonFormatterTool({ onBack }: JsonFormatterToolProps): JSX.Element {
  // Navigation belongs to the outer workspace; retain the callback for API compatibility.
  void onBack
  const { t } = useTranslation()
  const [rawJson, setRawJson] = useState<string>(DEFAULT_JSON)
  const [formattedJson, setFormattedJson] = useState<string>(DEFAULT_JSON)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [parsedValue, setParsedValue] = useState<unknown>(() => {
    try {
      return JSON.parse(DEFAULT_JSON)
    } catch {
      return undefined
    }
  })
  const [isFormatting, setIsFormatting] = useState(false)
  const [outputMode, setOutputMode] = useState<OutputMode>('text')

  const handleFormat = (space: number): void => {
    setIsFormatting(true)
    try {
      const parsed = JSON.parse(rawJson)
      const pretty = JSON.stringify(parsed, null, space)
      setRawJson(pretty)
      setFormattedJson(pretty)
      setParsedValue(parsed)
      setStatus({ type: 'success', message: t('jsonFormatterValidationSuccess') })
    } catch (error) {
      console.error(error)
      setStatus({
        type: 'error',
        message: `${t('jsonFormatterValidationError')}: ${
          error instanceof Error ? error.message : t('unknownError')
        }`
      })
    } finally {
      setIsFormatting(false)
    }
  }

  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
    setRawJson(event.target.value)
  }

  const hasParsedValue = parsedValue !== undefined
  const outputType = Array.isArray(parsedValue)
    ? 'Array'
    : parsedValue === null
      ? 'null'
      : typeof parsedValue

  return (
    <Panel className="min-w-0 bg-card">
      <div className="flex flex-wrap items-center justify-end gap-3 border-b border-border px-3 py-2.5 sm:px-4">
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleFormat(0)}
            disabled={isFormatting}
          >
            <Minimize2 className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.7} />
            {t('jsonFormatterActionsMinify')}
          </Button>
          <Button type="button" size="sm" onClick={() => handleFormat(2)} disabled={isFormatting}>
            <Wand className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.7} />
            {t('jsonFormatterActionsFormat')}
          </Button>
        </div>
      </div>

      {status && (
        <div className="border-b border-border px-3 py-2.5 sm:px-4">
          <Notice tone={status.type} title={status.message} className="rounded-md px-3 py-2" />
        </div>
      )}

      <div className="grid lg:h-[560px] lg:grid-cols-2">
        <section className="flex min-w-0 flex-col lg:border-r lg:border-border">
          <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border bg-muted/20 px-4">
            <div className="flex items-center gap-2">
              <FileCode2 className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.7} />
              <h3 className="text-[11px] font-semibold text-foreground">
                {t('jsonFormatterInputLabel')}
              </h3>
            </div>
            <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
              {t('jsonFormatterLineCount', { count: rawJson.split('\n').length })}
            </span>
          </header>
          <Textarea
            value={rawJson}
            onChange={handleInputChange}
            aria-label={t('jsonFormatterInputLabel')}
            className="h-[380px] min-h-0 resize-none rounded-none border-0 bg-background/35 px-4 py-4 font-mono text-xs leading-6 focus-visible:ring-0 lg:h-auto lg:flex-1"
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
          />
        </section>

        <section className="flex min-w-0 flex-col border-t border-border lg:border-t-0">
          <header className="flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/20 px-3 py-2 sm:px-4">
            <div className="flex items-center gap-2">
              <StatusDot tone={status?.type === 'error' ? 'error' : 'success'} />
              <h3 className="text-[11px] font-semibold text-foreground">
                {t('jsonFormatterOutputTitle')}
              </h3>
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                {outputType}
              </span>
            </div>
            <div
              className="inline-flex items-center gap-0.5 rounded-md border border-border bg-muted/60 p-0.5"
              role="tablist"
              aria-label={t('jsonFormatterOutputView')}
            >
              {(
                [
                  { value: 'text', label: t('jsonFormatterTextView'), icon: FileCode2 },
                  { value: 'tree', label: t('jsonFormatterTreeView'), icon: ListTree }
                ] as const
              ).map((option) => {
                const Icon = option.icon
                const active = outputMode === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setOutputMode(option.value)}
                    className={cn(
                      'flex h-7 items-center gap-1.5 rounded px-2.5 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/40',
                      active && 'bg-card text-foreground ring-1 ring-border/70'
                    )}
                  >
                    <Icon className="h-3 w-3" strokeWidth={1.7} />
                    {option.label}
                  </button>
                )
              })}
            </div>
          </header>

          <div
            className="h-[380px] min-h-0 overflow-auto bg-background/35 lg:h-auto lg:flex-1"
            role="tabpanel"
          >
            {outputMode === 'text' ? (
              <pre className="min-h-full min-w-full whitespace-pre px-4 py-4 font-mono text-xs leading-6 text-foreground">
                {formattedJson}
              </pre>
            ) : hasParsedValue ? (
              <div className="min-w-max p-4">
                <JsonViewer data={parsedValue} />
              </div>
            ) : (
              <div className="p-4">
                <EmptyState
                  icon={ListTree}
                  title={t('jsonFormatterAwaitingValid')}
                  description={t('jsonFormatterStructuredPreviewEmpty')}
                />
              </div>
            )}
          </div>
        </section>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border bg-muted/20 px-4 py-2.5 text-[10px] leading-relaxed text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">{t('jsonFormatterTipTitle')}:</span>{' '}
          {t('jsonFormatterTipDescription')}
        </p>
        <span className="shrink-0 font-mono uppercase tracking-wider">UTF-8 · JSON</span>
      </footer>
    </Panel>
  )
}
