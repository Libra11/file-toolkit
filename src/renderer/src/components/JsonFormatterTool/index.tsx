import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@renderer/components/ui/card'
import { Textarea } from '@renderer/components/ui/textarea'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import { AlertCircle, CheckCircle2, ChevronDown, ChevronRight, Sparkles, Wand } from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import { BackToHomeButton } from '@renderer/components/ui/BackToHomeButton'

type JsonPrimitive = string | number | boolean | null

interface JsonNodeProps {
  label?: string
  value: unknown
  path: string
  depth: number
}

interface JsonFormatterToolProps {
  onBack?: () => void
}

const primitiveClassMap: Record<string, string> = {
  string: 'text-emerald-500 dark:text-emerald-400',
  number: 'text-amber-500 dark:text-amber-400',
  boolean: 'text-purple-500 dark:text-purple-300',
  null: 'text-slate-500 dark:text-slate-400'
}

const JsonNode = ({ label, value, path, depth }: JsonNodeProps): JSX.Element => {
  const [collapsed, setCollapsed] = useState<boolean>(depth > 0)
  const isObject = typeof value === 'object' && value !== null
  const isArray = Array.isArray(value)
  const hasChildren = isObject && Object.keys(value as Record<string, unknown>).length > 0

  const handleToggle = (): void => {
    if (hasChildren) {
      setCollapsed((prev) => !prev)
    }
  }

  const renderPrimitive = (primitiveValue: JsonPrimitive): JSX.Element => {
    const type =
      primitiveValue === null
        ? 'null'
        : typeof primitiveValue === 'boolean'
          ? 'boolean'
          : typeof primitiveValue
    const className = primitiveClassMap[type] ?? 'text-slate-500 dark:text-slate-300'
    const display =
      type === 'string'
        ? `"${primitiveValue as string}"`
        : primitiveValue === null
          ? 'null'
          : String(primitiveValue)

    return <span className={className}>{display}</span>
  }

  if (!isObject) {
    return (
      <div
        className="flex items-start gap-2 text-sm"
        style={{ marginLeft: depth * 16, wordBreak: 'break-word' }}
        key={path}
      >
        {label !== undefined ? <span className="text-sky-600">{`"${label}"`}</span> : null}
        {label !== undefined ? <span className="text-slate-400">:</span> : null}
        {renderPrimitive(value as JsonPrimitive)}
      </div>
    )
  }

  const entries = isArray
    ? (value as unknown[]).map((item, index) => ({ key: String(index), value: item }))
    : Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => ({
        key,
        value: entryValue
      }))

  return (
    <div style={{ marginLeft: depth * 16 }}>
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-sm transition hover:bg-slate-100 dark:hover:bg-slate-800/60',
          hasChildren ? 'cursor-pointer' : 'cursor-default'
        )}
      >
        {hasChildren ? (
          collapsed ? (
            <ChevronRight className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          )
        ) : (
          <span className="h-4 w-4" />
        )}
        {label !== undefined ? (
          <span className="text-sky-600 dark:text-sky-400">{`"${label}"`}</span>
        ) : (
          <span className="text-slate-500 dark:text-slate-400">{isArray ? '[ ]' : '{ }'}</span>
        )}
        <span className="text-slate-400 dark:text-slate-500">
          {isArray ? `[${entries.length}]` : `{${entries.length}}`}
        </span>
      </button>

      {!collapsed ? (
        <div className="space-y-1 pt-1">
          {entries.map(({ key, value: childValue }) => (
            <JsonNode
              key={`${path}.${key}`}
              label={isArray ? undefined : key}
              value={childValue}
              path={`${path}.${key}`}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default function JsonFormatterTool({ onBack }: JsonFormatterToolProps): JSX.Element {
  const { t, i18n } = useTranslation()
  const [rawJson, setRawJson] = useState<string>(
    '{\n  "name": "File Toolkit",\n  "version": "1.0.0"\n}'
  )
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [parsedValue, setParsedValue] = useState<unknown>(() => {
    try {
      return JSON.parse('{"name":"File Toolkit","version":"1.0.0"}')
    } catch {
      return null
    }
  })
  const [isFormatting, setIsFormatting] = useState(false)
  const displayLanguage = (key: string): string => {
    const fallback = {
      jsonFormatter: 'JSON Formatter',
      jsonFormatterDescription: 'Validate and format JSON with highlighting and folding',
      jsonFormatterTipTitle: 'Formatting tip',
      jsonFormatterTipDescription:
        'Keep keys in double quotes and separate entries with commas so the structured view renders reliably.',
      jsonFormatterInputLabel: 'JSON Input',
      jsonFormatterActionsFormat: 'Format JSON',
      jsonFormatterActionsMinify: 'Minify JSON',
      jsonFormatterOutputTitle: 'Structured Preview',
      jsonFormatterValidationSuccess: 'JSON is valid and formatted',
      jsonFormatterValidationError: 'Invalid JSON input'
    } as Record<string, string>

    return t(key, fallback[key] ?? key)
  }

  const handleFormat = (space: number): void => {
    setIsFormatting(true)
    try {
      const parsed = JSON.parse(rawJson)
      const pretty = JSON.stringify(parsed, null, space)
      setRawJson(pretty)
      setParsedValue(parsed)
      setStatus({ type: 'success', message: displayLanguage('jsonFormatterValidationSuccess') })
    } catch (error) {
      console.error(error)
      setStatus({
        type: 'error',
        message: `${displayLanguage('jsonFormatterValidationError')}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      })
    } finally {
      setIsFormatting(false)
    }
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setRawJson(event.target.value)
  }

  const hasParsedValue = parsedValue !== null && parsedValue !== undefined
  const languageCode = (i18n.language || '').toLowerCase()
  const isZh = languageCode.startsWith('zh')

  return (
    <Card className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-6 shadow-2xl shadow-blue-900/10 backdrop-blur-sm transition-all duration-500 dark:border-white/10 dark:bg-slate-900/60">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 via-white/70 to-transparent dark:from-blue-900/40 dark:via-slate-900" />
      <div className="space-y-6">
        <div className="flex flex-col gap-3">
          <div className="flex gap-3 flex-row items-center justify-between">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:from-blue-900/50 dark:to-indigo-900/50 dark:text-blue-200">
              <Wand className="h-4 w-4" />
              {displayLanguage('jsonFormatter')}
            </div>
            {onBack && (
              <BackToHomeButton
                onClick={onBack}
                className="bg-blue-100/80 text-blue-700 hover:bg-blue-100 hover:text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/50"
              />
            )}
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              {displayLanguage('jsonFormatter')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {displayLanguage('jsonFormatterDescription')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-blue-100/80 bg-blue-50/70 px-4 py-3 text-sm text-blue-700 shadow-inner dark:border-blue-800/60 dark:bg-blue-900/20 dark:text-blue-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-blue-500 shadow-sm dark:bg-white/10 dark:text-blue-200">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-base font-semibold text-slate-900 dark:text-white">
              {displayLanguage('jsonFormatterTipTitle')}
            </p>
            <p className="text-xs leading-relaxed text-blue-600/90 dark:text-blue-200">
              {displayLanguage('jsonFormatterTipDescription')}
            </p>
          </div>
        </div>

        <CardContent className="space-y-6 rounded-3xl bg-white/95 p-0 shadow-xl shadow-blue-900/10 dark:bg-slate-900/60 dark:border-slate-800/60">
          <section className="space-y-3 p-4 md:p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {displayLanguage('jsonFormatterInputLabel')}
              </h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleFormat(2)}
                  disabled={isFormatting}
                  className="gap-1.5"
                >
                  <Sparkles className="h-4 w-4" />
                  {displayLanguage('jsonFormatterActionsFormat')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleFormat(0)}
                  disabled={isFormatting}
                  className="gap-1.5"
                >
                  <Wand className="h-4 w-4" />
                  {displayLanguage('jsonFormatterActionsMinify')}
                </Button>
              </div>
            </div>
            <Textarea
              value={rawJson}
              onChange={handleInputChange}
              className="min-h-[220px] font-mono text-sm leading-[1.6]"
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
            />
          </section>

          {status ? (
            <div
              className={cn(
                'flex items-center gap-2 rounded-md border px-3 py-2 text-sm',
                status.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800/60 dark:bg-red-900/40 dark:text-red-300'
              )}
            >
              {status.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span>{status.message}</span>
            </div>
          ) : null}

          <section className="space-y-2 rounded-b-3xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/60">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {displayLanguage('jsonFormatterOutputTitle')}
              </h3>
              <Badge variant="secondary">
                {hasParsedValue
                  ? isZh
                    ? '可折叠视图'
                    : 'Collapsible view'
                  : isZh
                    ? '等待有效 JSON'
                    : 'Awaiting valid JSON'}
              </Badge>
            </div>
            {hasParsedValue ? (
              <div className="font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                <JsonNode value={parsedValue} path="root" depth={0} />
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isZh
                  ? '输入有效 JSON 后显示结构化预览'
                  : 'Provide valid JSON to see the structured preview.'}
              </p>
            )}
          </section>
        </CardContent>
      </div>
    </Card>
  )
}
