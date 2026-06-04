export default function FileUpload({
  onLoad,
}: {
  onLoad: (name: string, content: string) => void
}) {
  function handleFiles(files: FileList | null) {
    if (!files) return
    Array.from(files)
      .filter((f) => f.name.endsWith(".sol"))
      .forEach((f) => {
        const reader = new FileReader()
        reader.onload = () => onLoad(f.name, String(reader.result ?? ""))
        reader.readAsText(f)
      })
  }
  return (
    <label
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        handleFiles(e.dataTransfer.files)
      }}
      className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500 hover:border-blue-400 hover:text-blue-500"
    >
      <input
        type="file"
        accept=".sol"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      {"\u2B06 Drop .sol file(s) or click to upload"}
    </label>
  )
}
