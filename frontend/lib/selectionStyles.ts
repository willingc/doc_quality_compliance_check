type SelectionOpts = {
  isSelected: boolean;
  tone?: 'blue' | 'emerald' | 'amber' | 'neutral';
  selectedClass?: string;
  defaultRowClass?: string;
  idleRowClass?: string;
  defaultPrimaryTextClass?: string;
  defaultSecondaryTextClass?: string;
};

const toneMap = {
  blue: 'bg-blue-50 border-blue-300 text-blue-700',
  emerald: 'bg-emerald-50 border-emerald-300 text-emerald-700',
  amber: 'bg-amber-50 border-amber-300 text-amber-700',
  neutral: 'bg-neutral-100 border-neutral-300 text-neutral-800',
};

export function getSelectionButtonClass(opts: SelectionOpts): string {
  if (opts.isSelected) return opts.selectedClass || toneMap[opts.tone || 'blue'];
  return 'bg-white text-neutral-600 hover:bg-neutral-50';
}

export function getSelectionStyles(opts: SelectionOpts) {
  const selected = opts.isSelected;
  return {
    rowClass: selected ? opts.selectedClass || toneMap[opts.tone || 'blue'] : `${opts.defaultRowClass || 'border-neutral-200 bg-white'} ${opts.idleRowClass || 'hover:bg-neutral-50'}`.trim(),
    primaryTextClass: selected ? 'text-neutral-900' : opts.defaultPrimaryTextClass || 'text-neutral-700',
    secondaryTextClass: selected ? 'text-neutral-500' : opts.defaultSecondaryTextClass || 'text-neutral-400',
  };
}
