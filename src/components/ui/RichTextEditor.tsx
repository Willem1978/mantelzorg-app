"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
}

function MenuButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "px-2 py-1 rounded text-sm font-medium transition-colors",
        active
          ? "bg-primary text-white"
          : "text-gray-600 hover:bg-gray-100",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({
  content,
  onChange,
  placeholder,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline" },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[200px] p-3 focus:outline-none",
        ...(placeholder ? { "data-placeholder": placeholder } : {}),
      },
    },
  })

  if (!editor) return null

  const addLink = () => {
    const url = window.prompt("URL invoeren:")
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div className={cn("border rounded-lg overflow-hidden bg-white", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b bg-gray-50">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Vet"
        >
          <strong>B</strong>
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Cursief"
        >
          <em>I</em>
        </MenuButton>

        <span className="w-px h-5 bg-gray-300 mx-1" />

        <MenuButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor.isActive("heading", { level: 2 })}
          title="Kop 2"
        >
          H2
        </MenuButton>
        <MenuButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          active={editor.isActive("heading", { level: 3 })}
          title="Kop 3"
        >
          H3
        </MenuButton>

        <span className="w-px h-5 bg-gray-300 mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Opsomming"
        >
          &bull; Lijst
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Genummerde lijst"
        >
          1. Lijst
        </MenuButton>

        <span className="w-px h-5 bg-gray-300 mx-1" />

        <MenuButton
          onClick={addLink}
          active={editor.isActive("link")}
          title="Link toevoegen"
        >
          Link
        </MenuButton>
        {editor.isActive("link") && (
          <MenuButton
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="Link verwijderen"
          >
            Unlink
          </MenuButton>
        )}

        <span className="w-px h-5 bg-gray-300 mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Citaat"
        >
          &ldquo; Citaat
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Lijn"
        >
          &mdash;
        </MenuButton>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  )
}
