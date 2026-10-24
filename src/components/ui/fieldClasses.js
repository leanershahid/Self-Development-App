export const fieldClasses =
  'w-full h-11 px-3.5 rounded-[10px] border bg-[var(--surface)] text-[var(--text)] text-[15px] ' +
  'border-[var(--field-border)] placeholder:text-slate-400 ' +
  'transition-all duration-200 ease-out ' +
  'hover:border-[var(--field-border-hover)] ' +
  'focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 focus:hover:border-primary ' +
  'disabled:bg-[var(--field-bg-disabled)] disabled:text-slate-400 disabled:border-[var(--field-border)] disabled:cursor-not-allowed disabled:hover:border-[var(--field-border)] ' +
  'read-only:bg-[var(--field-bg-disabled)] read-only:cursor-default read-only:hover:border-[var(--field-border)] read-only:focus:ring-0 read-only:focus:border-[var(--field-border)]';

export const fieldStatusClasses = {
  error: '!border-danger focus:!ring-danger/10',
  success: '!border-accent focus:!ring-accent/10',
};
