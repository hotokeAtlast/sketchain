import Editor from "@monaco-editor/react"

export default function CodePane({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <Editor
      height="100%"
      defaultLanguage="sol"
      theme="vs-dark"
      value={value}
      onChange={(v) => onChange(v ?? "")}
      options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: "on" }}
    />
  )
}
