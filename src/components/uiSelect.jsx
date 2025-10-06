import React, { useEffect, useId, useMemo, useRef, useState } from "react";

/**
 * Accessible custom Select (WAI-ARIA listbox pattern)
 * - Keyboard: ArrowUp/Down, Home/End, Enter, Space, Escape
 * - Click outside to close
 * - Typeahead on first character
 */
export default function UiSelect({
  value,
  onChange,
  options,
  label,            // optional visible label (outside)
  placeholder,      // optional
  className = "",
  style,
  disabled = false,
}) {
  const id = useId();
  const btnRef = useRef(null);
  const popRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const list = useMemo(() => {
    return options.map((o) =>
      typeof o === "string" ? { label: o, value: o } : o
    );
  }, [options]);

  const selectedIndex = useMemo(
    () => list.findIndex((o) => o.value === value),
    [list, value]
  );

  useEffect(() => {
    function onDocClick(e) {
      if (!open) return;
      const b = btnRef.current;
      const p = popRef.current;
      if (b && b.contains(e.target)) return;
      if (p && p.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => {
    // reposition active when open
    if (!open) return;
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    const el = popRef.current?.querySelector('[role="option"][data-active="true"]');
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [open, selectedIndex]);

  function commit(index) {
    const opt = list[index];
    if (!opt || opt.disabled) return;
    onChange?.(opt.value);
    setOpen(false);
    btnRef.current?.focus();
  }

  function keyNav(e) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", " ", "Enter"].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
        return;
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      btnRef.current?.focus();
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      commit(activeIndex);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      let i = activeIndex;
      do { i = Math.min(list.length - 1, i + 1); } while (list[i]?.disabled && i < list.length - 1);
      setActiveIndex(i);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      let i = activeIndex;
      do { i = Math.max(0, i - 1); } while (list[i]?.disabled && i > 0);
      setActiveIndex(i);
      return;
    }
    if (e.key === "Home") { e.preventDefault(); setActiveIndex(0); return; }
    if (e.key === "End") { e.preventDefault(); setActiveIndex(list.length - 1); return; }

    // simple typeahead: jump to first matching label
    if (e.key.length === 1) {
      const ch = e.key.toLowerCase();
      const i = list.findIndex(o => o.label.toLowerCase().startsWith(ch) && !o.disabled);
      if (i >= 0) setActiveIndex(i);
    }
  }

  const selectedLabel = selectedIndex >= 0 ? list[selectedIndex].label : (placeholder ?? "Select…");

  return (
    <div className={`ui-select ${className}`} style={style}>
      {label ? <div className="label">{label}</div> : null}

      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        className={`ui-select-btn${open ? " open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        onClick={() => setOpen(o => !o)}
        onKeyDown={keyNav}
      >
        <span className={`ui-select-value${selectedIndex < 0 ? " placeholder" : ""}`}>
          {selectedLabel}
        </span>
        <span className="ui-caret" aria-hidden>▾</span>
      </button>

      {open && (
        <div ref={popRef} className="ui-select-pop">
          <ul
            id={`${id}-listbox`}
            role="listbox"
            aria-activedescendant={activeIndex >= 0 ? `${id}-opt-${activeIndex}` : undefined}
            tabIndex={-1}
            className="ui-options"
            onKeyDown={keyNav}
          >
            {list.map((o, i) => {
              const active = i === activeIndex;
              const selected = i === selectedIndex;
              return (
                <li
                  id={`${id}-opt-${i}`}
                  key={o.value ?? o.label}
                  role="option"
                  aria-selected={selected}
                  data-active={active ? "true" : undefined}
                  className={`ui-option${active ? " active" : ""}${selected ? " selected" : ""}${o.disabled ? " disabled" : ""}`}
                  onMouseEnter={() => !o.disabled && setActiveIndex(i)}
                  onClick={() => !o.disabled && commit(i)}
                >
                  <span className="ui-option-label">{o.label}</span>
                  {selected ? <span className="ui-check" aria-hidden>✓</span> : null}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
