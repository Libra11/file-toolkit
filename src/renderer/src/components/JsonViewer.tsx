import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@renderer/lib/utils'

type JsonPrimitive = string | number | boolean | null

interface JsonNodeProps {
  label?: string
  index?: number
  value: unknown
  path: string
  depth: number
}

const primitiveClassMap: Record<string, string> = {
  string: 'text-primary',
  number: 'text-amber-700 dark:text-amber-300',
  boolean: 'font-medium text-foreground',
  null: 'italic text-muted-foreground'
}

function PrimitiveValue({ value }: { value: JsonPrimitive }): JSX.Element {
  const type = value === null ? 'null' : typeof value
  const display = type === 'string' ? JSON.stringify(value) : String(value)

  return (
    <span className={cn('min-w-0 break-all', primitiveClassMap[type] ?? 'text-muted-foreground')}>
      {display}
    </span>
  )
}

function JsonNode({ label, index, value, path, depth }: JsonNodeProps): JSX.Element {
  const [collapsed, setCollapsed] = useState<boolean>(depth > 0)
  const isObject = typeof value === 'object' && value !== null
  const isArray = Array.isArray(value)
  const entries = isObject
    ? isArray
      ? (value as unknown[]).map((item, entryIndex) => ({
          key: String(entryIndex),
          value: item
        }))
      : Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => ({
          key,
          value: entryValue
        }))
    : []
  const hasChildren = entries.length > 0
  const hasKey = label !== undefined || index !== undefined

  const keyLabel =
    label !== undefined ? (
      <span className="shrink-0 break-all font-medium text-foreground">
        {JSON.stringify(label)}
      </span>
    ) : index !== undefined ? (
      <span className="shrink-0 tabular-nums text-muted-foreground">{index}</span>
    ) : null

  if (!isObject) {
    return (
      <div
        className="flex min-h-7 min-w-0 items-start gap-2 py-1 font-mono text-xs leading-5"
        data-json-path={path}
      >
        <span className="w-3 shrink-0" aria-hidden="true" />
        {keyLabel}
        {hasKey && <span className="shrink-0 text-muted-foreground/70">:</span>}
        <PrimitiveValue value={value as JsonPrimitive} />
      </div>
    )
  }

  const handleToggle = (): void => {
    if (hasChildren) setCollapsed((previous) => !previous)
  }

  return (
    <div className="min-w-0 font-mono text-xs leading-5" data-json-path={path}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={!hasChildren}
        aria-expanded={hasChildren ? !collapsed : undefined}
        className="group flex min-h-7 w-full min-w-0 items-center gap-1.5 rounded px-1 py-1 text-left transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/40 disabled:cursor-default disabled:hover:bg-transparent"
      >
        <span className="flex h-3 w-3 shrink-0 items-center justify-center text-muted-foreground">
          {hasChildren ? (
            collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.7} />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.7} />
            )
          ) : null}
        </span>
        <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {keyLabel}
          {hasKey && <span className="text-muted-foreground/70">:</span>}
          <span className="text-muted-foreground">
            {isArray ? `[${entries.length}]` : `{${entries.length}}`}
          </span>
          {collapsed && hasChildren && (
            <span className="text-[10px] font-normal text-muted-foreground/60">…</span>
          )}
        </span>
      </button>

      {!collapsed && hasChildren && (
        <div className="ml-[7px] border-l border-border/80 pl-3">
          {entries.map(({ key, value: childValue }, entryIndex) => (
            <JsonNode
              key={`${path}.${key}`}
              label={isArray ? undefined : key}
              index={isArray ? entryIndex : undefined}
              value={childValue}
              path={`${path}.${key}`}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface JsonViewerProps {
  data: unknown
}

export default function JsonViewer({ data }: JsonViewerProps): JSX.Element {
  return (
    <div className="min-w-0 text-foreground">
      <JsonNode value={data} path="root" depth={0} />
    </div>
  )
}
