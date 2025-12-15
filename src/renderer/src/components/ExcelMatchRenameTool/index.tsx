import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  Download,
  Eye,
  Settings,
  Folder,
  FileSpreadsheet,
  Play,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { Badge } from '@renderer/components/ui/badge'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { toast } from '@renderer/components/ui/toast'
import { BackToHomeButton } from '@renderer/components/ui/BackToHomeButton'

type MatchMode = 'whole' | 'split' | 'regex'

interface PreviewItem {
  originalFile: string
  originalPath: string
  extractedKey: string
  matchedValue: string | null
  newFilename: string | null
  status: 'match' | 'no-match' | 'error'
  error?: string
}


const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 }
}


export default function ExcelMatchRenameTool({ onBack }: { onBack?: () => void }): JSX.Element {
  const { t } = useTranslation()

  // Data Sources
  const [folderPath, setFolderPath] = useState<string>('')
  const [files, setFiles] = useState<string[]>([])
  const [excelPath, setExcelPath] = useState<string>('')
  const [excelHeaders, setExcelHeaders] = useState<string[]>([])
  const [excelData, setExcelData] = useState<any[]>([])

  // Configuration
  const [matchMode, setMatchMode] = useState<MatchMode>('whole')
  const [separator, setSeparator] = useState<string>('_')
  const [splitIndex, setSplitIndex] = useState<number>(0)
  const [regexPattern, setRegexPattern] = useState<string>('')
  const [regexGroup, setRegexGroup] = useState<number>(1)

  const [matchColumn, setMatchColumn] = useState<string>('')
  const [renameColumn, setRenameColumn] = useState<string>('')
  const [useRenamePattern, setUseRenamePattern] = useState<boolean>(false)
  const [renamePattern, setRenamePattern] = useState<string>('')

  const [targetDir, setTargetDir] = useState<string>('')
  const [overwrite, setOverwrite] = useState<boolean>(false)

  // Status
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  // Handlers
  const handleSelectFolder = async (): Promise<void> => {
    const path = await window.excelMatch.selectFolder()
    if (path) {
      setFolderPath(path)
      // Scan files
      const fileList = await window.excelMatch.scanFolder(path)
      setFiles(fileList)
      toast.success({ title: t('folderSelected'), description: `${fileList.length} files found` })
    }
  }

  const handleSelectExcel = async (): Promise<void> => {
    try {
      const result = await window.excelMatch.readExcel()
      if (result) {
        setExcelPath(result.path)
        setExcelHeaders(result.headers)
        setExcelData(result.data)
        // Auto select first headers
        if (result.headers.length > 0) {
          setMatchColumn(result.headers[0])
          if (result.headers.length > 1) {
            setRenameColumn(result.headers[1])
          } else {
            setRenameColumn(result.headers[0])
          }
        }
        toast.success({ title: t('excelLoaded'), description: `${result.data.length} rows loaded` })
      }
    } catch (e) {
      toast.error({ title: t('error'), description: 'Failed to read Excel file' })
    }
  }

  const handleSelectTargetDir = async (): Promise<void> => {
    const path = await window.excelMatch.selectFolder()
    if (path) {
      setTargetDir(path)
    }
  }

  // Effect: Calculate Preview
  const previewList = useMemo<PreviewItem[]>(() => {
    if (!folderPath || files.length === 0) return []

    return files.map((file) => {
      let key = ''
      const nameNoExt = file.substring(0, file.lastIndexOf('.')) || file
      const ext = file.substring(file.lastIndexOf('.'))

      try {
        if (matchMode === 'whole') {
          key = nameNoExt
        } else if (matchMode === 'split') {
          const parts = nameNoExt.split(separator)
          if (parts.length > splitIndex) {
            key = parts[splitIndex]
          }
        } else if (matchMode === 'regex') {
          const re = new RegExp(regexPattern)
          const match = nameNoExt.match(re)
          if (match && match[regexGroup]) {
            key = match[regexGroup]
          }
        }
      } catch (e) {
        // Regex error or other
      }

      key = key.trim()
      
      let matchedRow: any = null
      if (excelData.length > 0 && matchColumn && key) {
        // Try strict match first
        // Assuming key in excel is string
        matchedRow = excelData.find((row) => String(row[matchColumn]).trim() === key)
      }

      let newFilename: string | null = null
      let status: PreviewItem['status'] = 'no-match'
      let error: string | undefined

      if (matchedRow) {
        if (useRenamePattern && renamePattern) {
           // Pattern based rename
           let baseName = renamePattern
           
           // Simple template replacement {ColName}
           // Use a regex that captures content inside {}
           baseName = baseName.replace(/\{(.+?)\}/g, (_, col) => {
             const colName = col.trim()
             const val = matchedRow[colName]
             return val !== undefined && val !== null ? String(val).trim() : ''
           })
           
           if (baseName && baseName.trim()) {
             newFilename = baseName.trim() + ext
             status = 'match'
           } else {
             status = 'error'
             error = 'Empty pattern result'
           }
        } else if (renameColumn) {
           const newNameBase = String(matchedRow[renameColumn] || '').trim()
           if (newNameBase) {
             newFilename = newNameBase + ext
             status = 'match'
           } else {
             status = 'error'
             error = 'Empty rename value'
           }
        }
      } 
      
      if (!newFilename && !error) {
         if (!key) {
            status = 'error'
            error = 'Key extraction failed'
         } else if (!matchedRow) {
            status = 'no-match'
         } else if (!useRenamePattern && !renameColumn) {
            status = 'error'
            error = 'No rename column selected'
         }
      }

      return {
        originalFile: file,
        originalPath: `${folderPath}/${file}`, // simple join, better use path.join in main but renderer has no path module
        extractedKey: key,
        matchedValue: matchedRow ? String(matchedRow[matchColumn]) : null,
        newFilename,
        status,
        error
      }
    })
  }, [files, folderPath, excelData, matchMode, separator, splitIndex, regexPattern, regexGroup, matchColumn, renameColumn, useRenamePattern, renamePattern])

  const matchCount = previewList.filter((i) => i.status === 'match').length

  const handleExecute = async (): Promise<void> => {
    const tasks = previewList
      .filter((i) => i.status === 'match' && i.newFilename)
      .map((i) => ({
        originalPath: i.originalPath, // Be careful here, constructing path in renderer
        newFilename: i.newFilename!
      }))

    if (tasks.length === 0) {
      toast.warning({ title: t('noFilesToProcess') })
      return
    }

    setIsProcessing(true)
    try {
      const startTime = Date.now()
      const result = await window.excelMatch.execute({
        tasks,
        targetDir: targetDir || undefined,
        overwrite
      })
      
      // Minimum loading time for UX (800ms)
      const elapsed = Date.now() - startTime
      if (elapsed < 800) {
        await new Promise(resolve => setTimeout(resolve, 800 - elapsed))
      }
      
      if (result.errors.length > 0) {
        console.error(result.errors)
        toast.warning({
          title: t('emrProcessComplete'),
          description: `${t('emrSuccessCount')}: ${result.success}, ${t('emrFailCount')}: ${result.fail}`
        })
      } else {
        toast.success({
          title: t('emrProcessComplete'),
          description: `${t('emrSuccessCount')}: ${result.success}`
        })
      }
      
      // Refresh file list if in same dir
      if (!targetDir) {
          const fileList = await window.excelMatch.scanFolder(folderPath)
          setFiles(fileList)
      }
    } catch (e) {
      toast.error({ title: t('error'), description: String(e) })
    } finally {
      setIsProcessing(false)
    }
  }

  // --- UI Components ---


  return (
    <div className="h-full w-full overflow-hidden">
      {/* 1. The Large Outer Card (Wraps Header + Content) */}
      <div className="flex flex-col h-full rounded-[32px] border border-white/60 bg-gradient-to-br from-indigo-50/50 via-white/80 to-blue-50/50 backdrop-blur-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-900 p-6 md:p-8 overflow-hidden">
          
          {/* 2. Header Section (Now Inside Outer Card) */}
          <div className="shrink-0 mb-6 space-y-4">
              {/* Top Row: Tag & Back */}
              <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 backdrop-blur-sm dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
                      <Settings className="h-3.5 w-3.5" />
                      {t('excelMatchRename')}
                  </span>
                  
                  {onBack && (
                     <BackToHomeButton onClick={onBack} className="rounded-full shadow-sm hover:shadow-md transition-all bg-white text-slate-600 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-indigo-400" />
                  )}
              </div>

              {/* Title & Description */}
              <div className="space-y-1">
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-4xl">
                      {t('excelMatchRename')}
                  </h1>
                  <p className="text-base text-slate-500 dark:text-slate-400 max-w-2xl">
                      {t('excelMatchRenameDescription')}
                  </p>
              </div>
          </div>

          {/* 3. Inner Content Card (White Box - Sidebar + Preview) */}
          <div className="flex-1 min-h-0 overflow-hidden rounded-[24px] border border-white bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/50 flex flex-col lg:flex-row">
                
                {/* Left Side: All Configs (Sidebar) */}
                <div className="w-full lg:w-[400px] xl:w-[440px] flex flex-col border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30">
                    <ScrollArea className="flex-1">
                        <div className="p-8 space-y-10">
                            {/* Section 1: Source */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                        <Folder className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('emrStepSource')}</h3>
                                </div>
                                <div className="space-y-4 pl-1">
                                   <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t('emrSelectFolder')}</Label>
                                        <Button variant="outline" className="w-full justify-start h-12 rounded-xl border-slate-200 bg-white shadow-sm hover:border-blue-300 hover:ring-2 hover:ring-blue-100 hover:text-blue-700 text-left font-normal transition-all dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-700 dark:hover:ring-blue-900/30" onClick={handleSelectFolder}>
                                             <Folder className="mr-3 h-4 w-4 text-blue-500/80 shrink-0" />
                                             {folderPath ? <span className="truncate text-sm font-medium">{folderPath}</span> : <span className="text-slate-400 text-sm">{t('select')}</span>}
                                        </Button>
                                   </div>
                                   <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t('emrSelectExcel')}</Label>
                                        <Button variant="outline" className="w-full justify-start h-12 rounded-xl border-slate-200 bg-white shadow-sm hover:border-emerald-300 hover:ring-2 hover:ring-emerald-100 hover:text-emerald-700 text-left font-normal transition-all dark:border-slate-700 dark:bg-slate-800 dark:hover:border-emerald-700 dark:hover:ring-emerald-900/30" onClick={handleSelectExcel}>
                                             <FileSpreadsheet className="mr-3 h-4 w-4 text-emerald-500/80 shrink-0" />
                                             {excelPath ? <span className="truncate text-sm font-medium">{excelPath.split('/').pop()}</span> : <span className="text-slate-400 text-sm">{t('select')}</span>}
                                        </Button>
                                   </div>
                                </div>
                            </div>

                            {/* Section 2: Rules */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                                        <Settings className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('emrMatchRule')}</h3>
                                </div>
                                
                                <div className="space-y-6 pl-1">
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t('emrMatchMode')}</Label>
                                            <Select value={matchMode} onValueChange={(v: any) => setMatchMode(v)}>
                                                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-indigo-100">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="whole">{t('emrModeWhole')}</SelectItem>
                                                    <SelectItem value="split">{t('emrModeSplit')}</SelectItem>
                                                    <SelectItem value="regex">{t('emrModeRegex')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {matchMode === 'split' && (
                                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50 dark:border-slate-800">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-bold text-slate-400">{t('emrSeparator')}</Label>
                                                <Input className="h-9 rounded-lg" value={separator} onChange={(e) => setSeparator(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-bold text-slate-400">{t('emrIndex')}</Label>
                                                <Input className="h-9 rounded-lg" type="number" value={splitIndex} onChange={(e) => setSplitIndex(Number(e.target.value))} />
                                            </div>
                                        </div>
                                        )}
                                        {matchMode === 'regex' && (
                                            <div className="grid grid-cols-1 gap-4 pt-2 border-t border-slate-50 dark:border-slate-800">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-slate-400">{t('emrRegexPattern')}</Label>
                                                    <Input className="h-9 rounded-lg font-mono text-xs" value={regexPattern} onChange={(e) => setRegexPattern(e.target.value)} placeholder="^([a-z]+)_" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-slate-400">{t('emrRegexGroup')}</Label>
                                                    <Input className="h-9 rounded-lg" type="number" value={regexGroup} onChange={(e) => setRegexGroup(Number(e.target.value))} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t('emrMatchColumn')}</Label>
                                        <Select value={matchColumn} onValueChange={setMatchColumn}>
                                            <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700">
                                               <SelectValue placeholder={t('select')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                               {excelHeaders.map(h => (
                                                   <SelectItem key={h} value={h}>{h}</SelectItem>
                                               ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                                       <div className="flex items-center justify-between">
                                           <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t('emrRenameColumn')}</Label>
                                           <div className="flex items-center space-x-2">
                                                <Checkbox id="usePattern" className="h-4 w-4 border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600" checked={useRenamePattern} onCheckedChange={(c) => setUseRenamePattern(!!c)} />
                                                <label htmlFor="usePattern" className="text-[11px] font-medium cursor-pointer text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">{t('emrUseCustomPattern')}</label>
                                           </div>
                                       </div>
                                       
                                       {!useRenamePattern ? (
                                            <Select value={renameColumn} onValueChange={setRenameColumn}>
                                                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700">
                                                    <SelectValue placeholder={t('select')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {excelHeaders.map(h => (
                                                        <SelectItem key={h} value={h}>{h}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                       ) : (
                                            <div className="space-y-3">
                                                <Input className="h-10 rounded-xl border-slate-200 bg-white text-xs dark:bg-slate-900 dark:border-slate-700" value={renamePattern} onChange={(e) => setRenamePattern(e.target.value)} placeholder={t('emrPatternPlaceholder')} />
                                                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar">
                                                    {excelHeaders.map(h => (
                                                        <Badge key={h} variant="secondary" className="cursor-pointer text-[10px] px-2 py-1 bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-indigo-900/30" onClick={() => setRenamePattern((p) => p + `{${h}}`)}>{h}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                       )}
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Output */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                                        <Download className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('outputFolder')}</h3>
                                </div>
                                <div className="space-y-4 pl-1">
                                     <div className="flex gap-2">
                                        <Input value={targetDir} placeholder={t('emrTargetDir')} readOnly className="h-10 rounded-xl bg-slate-50 border-slate-200 text-sm dark:bg-slate-900 dark:border-slate-700" />
                                        <Button variant="outline" className="h-10 rounded-xl px-4 border-slate-200 dark:border-slate-700" onClick={handleSelectTargetDir}>{t('select')}</Button>
                                     </div>
                                     <div className="flex items-center space-x-2">
                                        <Checkbox id="overwrite" className="h-4 w-4 border-slate-300 data-[state=checked]:bg-slate-900" checked={overwrite} onCheckedChange={(c) => setOverwrite(!!c)} />
                                        <label htmlFor="overwrite" className="text-sm text-slate-600 cursor-pointer select-none dark:text-slate-400">{t('emrOverwrite')}</label>
                                     </div>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </div>

                {/* Right Side: Preview Panel */}
                <div className="flex-1 flex flex-col h-full bg-slate-50/20 dark:bg-slate-950/50 min-w-0">
                     {/* Preview Header */}
                     <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-white/40 backdrop-blur-md dark:bg-slate-900/30">
                         <div className="flex items-center gap-3">
                             <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm border border-slate-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/20">
                                <Eye className="h-4 w-4" />
                             </span>
                             <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('emrStepPreview')}</h3>
                                {files.length > 0 && <p className="text-xs font-medium text-slate-400">{files.length} items found</p>}
                             </div>
                         </div>
                         
                         {/* Match Rate Badge */}
                         {matchCount > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-xs font-bold">{Math.round((matchCount / (files.length || 1)) * 100)}% Match Rate</span>
                            </div>
                         )}
                     </div>
                     
                     {/* List Header */}
                     {files.length > 0 && (
                        <div className="grid grid-cols-12 gap-6 px-8 py-3 border-b border-slate-100 bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-widest dark:border-slate-800 dark:bg-slate-900/40">
                           <div className="col-span-4 pl-2">{t('emrOriginalFile')}</div>
                           <div className="col-span-3">{t('emrExtractedKey')}</div>
                           <div className="col-span-4">{t('emrNewFilename')}</div>
                           <div className="col-span-1 text-right pr-2">{t('emrStatus')}</div>
                        </div>
                     )}
                     
                     {/* List Content */}
                     <div className="flex-1 overflow-hidden relative">
                         {files.length === 0 ? (
                             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                 <div className="relative group p-8">
                                     <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                                     <div className="relative h-20 w-20 mb-6 flex items-center justify-center">
                                        <Folder className="h-12 w-12 text-slate-200 dark:text-slate-700" />
                                     </div>
                                 </div>
                                 <h3 className="font-semibold text-slate-600 dark:text-slate-400 mb-2">{t('emrSelectFolder')}</h3>
                                 <p className="text-xs text-slate-400 max-w-[240px] text-center leading-relaxed">Select a folder and Excel file from the left to generate the rename preview.</p>
                             </div>
                         ) : (
                            <ScrollArea className="h-full">
                                <div className="p-4 space-y-2">
                                    {previewList.map((item, idx) => (
                                        <motion.div 
                                          variants={itemVariants}
                                          initial="hidden"
                                          animate="visible"
                                          transition={{ delay: Math.min(idx * 0.005, 0.5) }} 
                                          key={idx} 
                                          className={`grid grid-cols-12 gap-6 px-5 py-3 rounded-xl border text-sm items-center transition-all ${
                                            item.status === 'match' 
                                                ? 'bg-white border-emerald-100/60 shadow-sm dark:bg-emerald-900/10 dark:border-emerald-800/30' 
                                                : item.status === 'error'
                                                    ? 'bg-white border-red-100/60 shadow-sm dark:bg-red-900/10 dark:border-red-800/30'
                                                    : 'bg-transparent border-transparent hover:bg-white/40 hover:border-slate-200/60 dark:hover:bg-slate-800/30'
                                          }`}
                                       >
                                           <div className="col-span-4 truncate font-medium text-slate-700 dark:text-slate-300" title={item.originalFile}>
                                               {item.originalFile}
                                           </div>
                                           <div className="col-span-3 truncate text-xs text-slate-500" title={item.extractedKey}>
                                               {item.extractedKey ? (
                                                   <code className="bg-slate-100 px-1.5 py-0.5 rounded-md text-[11px] text-slate-600 font-mono dark:bg-slate-800 dark:text-slate-400">{item.extractedKey}</code>
                                               ) : <span className="text-slate-300">-</span>}
                                           </div>
                                           <div className={`col-span-4 truncate font-medium transition-colors ${item.newFilename ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-600'}`} title={item.newFilename || ''}>
                                               {item.newFilename || '-'}
                                           </div>
                                           <div className="col-span-1 flex justify-end">
                                               {item.status === 'match' ? (
                                                   <div className="text-emerald-500">
                                                        <CheckCircle className="h-4 w-4" />
                                                   </div>
                                               ) : item.status === 'error' ? (
                                                   <div className="text-red-500" title={item.error}>
                                                        <AlertCircle className="h-4 w-4" />
                                                   </div>
                                               ) : (
                                                   <div className="h-1.5 w-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mx-1" />
                                               )}
                                           </div>
                                       </motion.div>
                                    ))}
                                </div>
                            </ScrollArea>
                         )}
                     </div>
                     
                     {/* Footer Action */}
                     <div className="p-6 border-t border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
                         <div className="flex items-center justify-between gap-4">
                            <div className="text-xs text-slate-400 font-medium hidden md:block">
                                {previewList.length > 0 && (
                                    <span>Ready to process {previewList.filter(i => i.status === 'match').length} matched files</span>
                                )}
                            </div>
                            <Button 
                                size="lg" 
                                className="bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20 active:scale-95 transition-all rounded-xl w-full md:w-auto min-w-[160px] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                                disabled={!folderPath || !excelPath || previewList.length === 0 || isProcessing}
                                onClick={handleExecute}
                            >
                                {isProcessing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                                {isProcessing ? t('emrProcessing') : t('emrExecute')}
                            </Button>
                         </div>
                     </div>
                </div>
          </div>
      </div>
    </div>
  )
}
