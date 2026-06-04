export default function FileTabs({
  files,
  active,
  onPick,
  onClose,
}: {
  files: string[]
  active: string
  onPick: (name: string) => void
  onClose: (name: string) => void
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b bg-slate-50 px-2">
      {files.map((name) => (
        <div
          key={name}
          className={`group flex items-center gap-1 px-2 py-1 text-xs rounded-t cursor-pointer ${
            name === active
              ? "bg-white font-medium text-slate-800"
              : "text-slate-500"
          }`}
          onClick={() => onPick(name)}
        >
          {name}
          <button
            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"
            onClick={(e) => {
              e.stopPropagation()
              onClose(name)
            }}
          >
            {"\u00D7"}
          </button>
        </div>
      ))}
    </div>
  )
}
