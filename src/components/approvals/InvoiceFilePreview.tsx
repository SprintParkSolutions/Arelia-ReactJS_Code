import { useEffect, useMemo, useState } from 'react'
import type { WorkBook } from 'xlsx'
import { invoiceFileFormat, type InvoiceFile } from '../../services/proformaApi'
import { ApprovalPdfPreview } from './ApprovalPdfPreview'

const rowLimit = 100
const columnLimit = 30

type WorkbookPreview = { workbook: WorkBook; utils: typeof import('xlsx').utils }

function InvoiceWorkbook({ workbook, utils, isCsv }: WorkbookPreview & { isCsv: boolean }) {
  const [selectedSheet, setSelectedSheet] = useState(workbook.SheetNames[0])
  const { rows, truncated } = useMemo(() => {
    const sheet = workbook.Sheets[selectedSheet]
    if (!sheet?.['!ref']) return { rows: [], truncated: false }
    const range = utils.decode_range(sheet['!ref'])
    const fullRange = utils.decode_range(sheet['!fullref'] || sheet['!ref'])
    const truncated = fullRange.e.r - range.s.r >= rowLimit || fullRange.e.c - range.s.c >= columnLimit
    range.e.r = Math.min(range.e.r, range.s.r + rowLimit - 1)
    range.e.c = Math.min(range.e.c, range.s.c + columnLimit - 1)
    return { rows: utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, defval: '', range }), truncated }
  }, [selectedSheet, utils, workbook])

  return <div className="proformaLayout__workbook">
    {workbook.SheetNames.length > 1 && <label>
      Worksheet
      <select value={selectedSheet} onChange={event => setSelectedSheet(event.target.value)}>
        {workbook.SheetNames.map(name => <option key={name}>{name}</option>)}
      </select>
    </label>}
    {rows.length ? <div className="proformaLayout__table" tabIndex={0} role="region" aria-label={selectedSheet + ' worksheet'}>
      <table aria-label={selectedSheet}>
        <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>
          {row.map((value, columnIndex) => <td key={columnIndex}>{value}</td>)}
        </tr>)}</tbody>
      </table>
    </div> : <p>This worksheet has no cells to preview.</p>}
    {truncated && <p>{isCsv ? 'Download the file for full worksheet' : `Showing up to ${rowLimit} rows and ${columnLimit} columns. Download the file for the full worksheet.`}</p>}
  </div>
}

type Preview = { kind: 'image'; source: string } | { kind: 'workbook'; data: WorkbookPreview } | { kind: 'error' }

function InvoiceMediaPreview({ url, title, format }: { url: string; title: string; format: string }) {
  const [preview, setPreview] = useState<Preview>()

  useEffect(() => {
    const controller = new AbortController()
    let source = ''

    async function load() {
      try {
        const response = await fetch(url, {
          cache: 'no-store', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]),
        })
        if (!response.ok) throw new Error('Preview request failed')
        const isCsv = format === 'csv'
        if (isCsv || format === 'xls' || format === 'xlsx') {
          const [buffer, { read, utils }] = await Promise.all([response.arrayBuffer(), import('xlsx')])
          if (controller.signal.aborted) return
          const signature = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 4))
          const zip = signature[0] === 0x50 && signature[1] === 0x4b && signature[2] === 3 && signature[3] === 4
          const legacy = signature[0] === 0xd0 && signature[1] === 0xcf && signature[2] === 0x11 && signature[3] === 0xe0
          if (!isCsv && !zip && !legacy) throw new Error('Invalid workbook response')
          const workbook = read(isCsv ? new TextDecoder().decode(buffer) : buffer, {
            sheetRows: rowLimit + 1, cellFormula: false, cellHTML: false,
            ...(isCsv && { type: 'string', FS: ',', raw: true }),
          })
          if (!workbook.SheetNames.length) throw new Error('Empty workbook')
          setPreview({ kind: 'workbook', data: { workbook, utils } })
        } else {
          const blob = await response.blob()
          if (controller.signal.aborted) return
          source = URL.createObjectURL(blob.slice(0, blob.size, format === 'png' ? 'image/png' : 'image/jpeg'))
          setPreview({ kind: 'image', source })
        }
      } catch {
        if (!controller.signal.aborted) setPreview({ kind: 'error' })
      }
    }

    void load()
    return () => {
      controller.abort()
      if (source) URL.revokeObjectURL(source)
    }
  }, [format, url])

  if (!preview) return <p role="status">Loading file preview...</p>
  if (preview.kind === 'error') return <p role="alert">Unable to preview this file. You can still download it.</p>
  if (preview.kind === 'workbook') return <InvoiceWorkbook {...preview.data} isCsv={format === 'csv'} />
  return <img src={preview.source} alt={title} onError={() => setPreview({ kind: 'error' })} />
}

export function InvoiceFilePreview({ file, url }: { file: InvoiceFile; url: string }) {
  const format = invoiceFileFormat(file)
  return <section className="proformaLayout__preview" aria-label={'Preview of ' + file.title}>
    {format === 'pdf' ? <ApprovalPdfPreview url={url} title={file.title} />
      : <InvoiceMediaPreview url={url} title={file.title} format={format} />}
  </section>
}
