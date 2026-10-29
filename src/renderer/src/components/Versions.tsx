import { useState } from 'react'
import { DataRow, Panel, PanelHeader } from '@renderer/components/ui/panel'
import { useTranslation } from 'react-i18next'

function Versions(): JSX.Element {
  const { t } = useTranslation()
  const [versions] = useState(window.electron.process.versions)
  const runtimeVersions = [
    { name: 'Electron', value: versions.electron, className: 'electron-version' },
    { name: 'Chromium', value: versions.chrome, className: 'chrome-version' },
    { name: 'Node.js', value: versions.node, className: 'node-version' }
  ]

  return (
    <Panel className="versions w-full max-w-lg shadow-none">
      <PanelHeader eyebrow={t('system')} title={t('runtimeVersions')} />
      <dl className="divide-y divide-border px-5 py-2">
        {runtimeVersions.map((runtime) => (
          <DataRow
            key={runtime.name}
            className={`${runtime.className} py-3`}
            label={<span className="text-xs font-medium text-foreground">{runtime.name}</span>}
            value={
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                v{runtime.value}
              </span>
            }
          />
        ))}
      </dl>
    </Panel>
  )
}

export default Versions
