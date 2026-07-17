import { useState, useRef, useEffect } from 'react';
import { CalendarRange, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DateRangePickerProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (val: string) => void;
  onDateToChange: (val: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function fromDateStr(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDisplay(from: string, to: string): string {
  const fmtDate = (s: string) => {
    const d = fromDateStr(s);
    if (!d) return '';
    return d.getDate() + ' ' + MONTHS[d.getMonth()].slice(0, 3);
  };
  if (from && to) return fmtDate(from) + ' – ' + fmtDate(to);
  if (from) return fmtDate(from) + ' – ...';
  return '';
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function DateRangePicker({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  label,
  placeholder = 'Select date range',
  className = '',
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [hoverDate, setHoverDate] = useState<string>('');

  // Calendar navigation: show current month by default
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleDayClick = (dateStr: string) => {
    if (!dateFrom || (dateFrom && dateTo)) {
      // Start fresh selection
      onDateFromChange(dateStr);
      onDateToChange('');
    } else {
      // Second click — set end
      if (dateStr < dateFrom) {
        onDateToChange(dateFrom);
        onDateFromChange(dateStr);
      } else {
        onDateToChange(dateStr);
      }
    }
  };

  const isInRange = (dateStr: string): boolean => {
    if (!dateFrom) return false;
    const effectiveTo = dateTo || hoverDate;
    const [s, e] = dateFrom <= effectiveTo
      ? [dateFrom, effectiveTo]
      : [effectiveTo, dateFrom];
    return dateStr > s && dateStr < e;
  };

  const isStart = (dateStr: string) => dateStr === dateFrom;
  const isEnd = (dateStr: string) => dateStr === dateTo;
  const isRangeEnd = (dateStr: string) => {
    if (!dateFrom || !dateTo) return false;
    return isStart(dateStr) || isEnd(dateStr);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDateFromChange('');
    onDateToChange('');
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const display = formatDisplay(dateFrom, dateTo);

  return (
    <div ref={containerRef} className={'relative ' + className}>
      {label && (
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <CalendarRange className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className={display ? 'flex-1 text-left font-medium' : 'flex-1 text-left text-muted-foreground'}>
          {display || placeholder}
        </span>
        {(dateFrom || dateTo) && (
          <div
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
            aria-label="Clear"
          >
            <X className="h-3.5 w-3.5" />
          </div>
        )}
      </button>

      {/* Dropdown calendar */}
      {open && (
        <div className="absolute z-50 mt-1 left-0 bg-background border border-border rounded-2xl shadow-2xl p-4 w-[310px] animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-semibold text-sm text-foreground">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-muted-foreground py-1 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              if (day === null) {
                return <div key={'e-' + idx} />;
              }
              const dateStr = viewYear + '-' + String(viewMonth + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
              const inRange = isInRange(dateStr);
              const isStartDay = isStart(dateStr);
              const isEndDay = isEnd(dateStr);
              const isEndpoint = isRangeEnd(dateStr);
              const todayStr = toDateStr(new Date());
              const isToday = dateStr === todayStr;

              return (
                <div
                  key={dateStr}
                  className={'relative flex items-center justify-center h-9' + (inRange ? ' bg-amber-100' : '')}
                  style={{
                    borderRadius: isStartDay
                      ? '50% 0 0 50%'
                      : isEndDay
                      ? '0 50% 50% 0'
                      : 'none',
                    backgroundColor: (isStartDay || isEndDay) ? 'transparent' : inRange ? '#fef3c7' : undefined,
                  }}
                  onMouseEnter={() => setHoverDate(dateStr)}
                  onMouseLeave={() => setHoverDate('')}
                >
                  <button
                    type="button"
                    onClick={() => handleDayClick(dateStr)}
                    className={
                      'relative z-10 flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium transition-all select-none ' +
                      (isEndpoint
                        ? 'bg-amber-400 text-white shadow font-bold scale-105'
                        : inRange
                        ? 'text-amber-700 font-semibold'
                        : isToday
                        ? 'border-2 border-amber-400 text-amber-600 font-bold'
                        : 'text-foreground hover:bg-muted')
                    }
                  >
                    {day}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">
              {!dateFrom && 'Click to select start'}
              {dateFrom && !dateTo && 'Click to select end'}
              {dateFrom && dateTo && (
                <span className="font-medium text-foreground">{display}</span>
              )}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  onDateFromChange('');
                  onDateToChange('');
                }}
              >
                Clear
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setOpen(false)}
                disabled={!dateFrom || !dateTo}
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
