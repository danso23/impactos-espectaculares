import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Button } from "@/components/ui/button"

type Props = {
  value?: string
  onChange?: (html: string) => void
}

export function RichTextEditor({ value = "", onChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate({ editor }) {
      onChange?.(editor.getHTML())
    },
  })

  if (!editor) return null

  return (
    <div className="overflow-hidden rounded-xl border-[1.5px] border-transparent bg-violet-50/75 transition-[border-color,box-shadow,background-color] focus-within:border-violet-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/15">
      <div className="flex flex-wrap gap-1 border-b border-violet-100 bg-white/70 p-1.5">
        <Button
          size="sm"
          variant={editor.isActive("bold") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </Button>
        <Button
          size="sm"
          variant={editor.isActive("italic") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          I
        </Button>
        <Button
          size="sm"
          variant={editor.isActive("bulletList") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          •
        </Button>
      </div>

      <EditorContent
        editor={editor}
        className="prose min-h-28 max-w-none p-3.5 text-sm text-slate-900 focus:outline-none"
      />
    </div>
  )
}
