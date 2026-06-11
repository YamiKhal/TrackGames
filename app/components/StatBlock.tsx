export default function StatBlock({ color, title, value }: { color: string, title: string, value: number }) {
  return (
    <div className="z-1 w-fit min-w-24 justify-self-start bg-bg-secondary/80 rounded-md text-text">
      <div className="px-3 py-2 flex flex-col items-start">
        <div className="flex items-center gap-2">
          <span className="size-2.5 shrink-0 block" style={{ background: color }}></span>
          <h3 className="text-xs font-bold leading-none">{title}</h3>
        </div>
        <p className="text-lg font-semibold leading-tight mt-1">{formatNumber(value)}</p>
      </div>
    </div>
  )
}

function formatNumber(num: number): string {
  return Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num);
}
