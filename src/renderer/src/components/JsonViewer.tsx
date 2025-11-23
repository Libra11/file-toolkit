import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@renderer/lib/utils'

type JsonPrimitive = string | number | boolean | null

interface JsonNodeProps {
  label?: string
  value: unknown
  path: string
  depth: number
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
        className="flex items-start gap-2 text-sm font-mono"
        style={{ marginLeft: depth * 16, wordBreak: 'break-word' }}
        key={path}
      >
        {label !== undefined ? <span className="text-sky-600 dark:text-sky-400">{`"${label}"`}</span> : null}
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
    <div style={{ marginLeft: depth * 16 }} className="font-mono text-sm">
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800/60',
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

interface JsonViewerProps {
  data: unknown
}

export default function JsonViewer({ data }: JsonViewerProps): JSX.Element {
  return <JsonNode value={data} path="root" depth={0} />
}
