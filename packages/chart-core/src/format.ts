/** Creates a locale-bound fixed-decimal formatter with per-operation Intl reuse. */
export function createFixedDecimalFormatter(locale: string, style: 'decimal' | 'percent' = 'decimal'):
  (value: number, decimals: number) => string {
  const formatters = new Map<number, Intl.NumberFormat>();
  return (value, decimals) => {
    const cacheable = Number.isInteger(decimals) && decimals >= 0 && decimals <= 20;
    let formatter = cacheable ? formatters.get(decimals) : undefined;
    if (!formatter) {
      formatter = new Intl.NumberFormat(locale, {
        ...(style === 'percent' ? { style: 'percent' as const } : {}),
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
      if (cacheable) formatters.set(decimals, formatter);
    }
    return formatter.format(value);
  };
}
