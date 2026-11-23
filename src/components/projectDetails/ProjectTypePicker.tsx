import { useEffect, useId, useRef, useState } from 'react'
import { FaInfoCircle } from 'react-icons/fa'
import { FiChevronDown } from 'react-icons/fi'

export function ProjectTypePicker({ id, options, value, invalid, onChange }: {
  id: string
  options: string[]
  value: string
  invalid: boolean
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const picker = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const optionsId = useId()
  const helpId = useId()

  function close() {
    setOpen(false)
    setShowHelp(false)
  }

  useEffect(() => {
    if (!open) return
    function closeOnOutsidePress(event: PointerEvent) {
      if (event.target instanceof Node && !picker.current?.contains(event.target)) close()
    }
    document.addEventListener('pointerdown', closeOnOutsidePress)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePress)
  }, [open])

  return <div className="projectTypePicker" ref={picker}
    onBlur={event => {
      if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) close()
    }}
    onKeyDown={event => {
      if (event.key !== 'Escape' || !open) return
      event.stopPropagation()
      if (showHelp) setShowHelp(false)
      else {
        close()
        trigger.current?.focus()
      }
    }}>
    <button type="button" id={id} ref={trigger} className="projectTypePicker__trigger"
      aria-labelledby={id + '-label ' + id + '-value'} aria-describedby={id + '-error'}
      aria-invalid={invalid} aria-expanded={open} aria-controls={open ? optionsId : undefined}
      onClick={() => open ? close() : setOpen(true)}>
      <span id={id + '-value'}>{value || 'Select an option'}</span>
      <FiChevronDown aria-hidden="true" />
    </button>
    {open && <ul className="projectTypePicker__options" id={optionsId}>
      {['', ...options].map(option => {
        const hasHelp = option === 'Interior Combo Package'
        return <li key={option} className="projectTypePicker__item">
          <button type="button" className="projectTypePicker__option" aria-pressed={option === value}
            aria-describedby={hasHelp ? helpId : undefined}
            onClick={() => {
              onChange(option)
              close()
              trigger.current?.focus()
            }}>{option || 'Select an option'}</button>
          {hasHelp && <>
            <button type="button" className="projectTypePicker__info"
              aria-label="Help with Interior Combo Package" aria-expanded={showHelp} aria-controls={helpId}
              onClick={() => setShowHelp(current => !current)}>
              <FaInfoCircle aria-hidden="true" />
            </button>
            <p id={helpId} className={'projectTypePicker__help' + (showHelp ? ' is-open' : '')}>
              Choose this option if your project combines residential, commercial, or hospitality spaces.
            </p>
          </>}
        </li>
      })}
    </ul>}
  </div>
}

