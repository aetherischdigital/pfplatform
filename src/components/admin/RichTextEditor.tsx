import { useEffect } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
} from 'lucide-react'

type Props = {
  /** Initial HTML body. */
  initialContent: string
  /** Called on every edit with the current HTML. Debounce in the parent if
   *  you want to throttle saves. */
  onChange: (html: string) => void
  /** Optional placeholder shown when the editor is empty. */
  placeholder?: string
}

export default function RichTextEditor({ initialContent, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] }, // h2 and h3 only — h1 is the post title
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-accent-600 underline underline-offset-2' },
      }),
      Image.configure({
        HTMLAttributes: { class: 'my-6 rounded-lg' },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? 'Start writing…',
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        // prose typography matches the marketing blog post styles. min-height
        // gives the editor a comfortable target even when empty.
        class:
          'prose prose-surface max-w-none min-h-[400px] px-5 py-4 focus:outline-none',
      },
    },
  })

  // If the parent swaps `initialContent` (e.g., loading an existing post into
  // an already-mounted editor), sync it in.
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (current !== initialContent && initialContent) {
      editor.commands.setContent(initialContent, { emitUpdate: false })
    }
  }, [editor, initialContent])

  if (!editor) {
    return (
      <div className="rounded-lg border border-surface-200 bg-white">
        <div className="h-12 animate-pulse border-b border-surface-200 bg-surface-50" />
        <div className="min-h-[400px] animate-pulse bg-surface-50/50" />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-surface-200 bg-white focus-within:border-surface-400">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  const promptLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Link URL', prev ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const promptImage = () => {
    const url = window.prompt('Image URL', 'https://')
    if (!url) return
    editor.chain().focus().setImage({ src: url }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-surface-200 bg-surface-50 px-2 py-1.5">
      <ToolBtn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        label="Bold (Ctrl+B)"
      >
        <Bold size={14} />
      </ToolBtn>
      <ToolBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        label="Italic (Ctrl+I)"
      >
        <Italic size={14} />
      </ToolBtn>
      <Divider />
      <ToolBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        label="Heading 2"
      >
        <Heading2 size={14} />
      </ToolBtn>
      <ToolBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        label="Heading 3"
      >
        <Heading3 size={14} />
      </ToolBtn>
      <Divider />
      <ToolBtn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        label="Bulleted list"
      >
        <List size={14} />
      </ToolBtn>
      <ToolBtn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        label="Numbered list"
      >
        <ListOrdered size={14} />
      </ToolBtn>
      <ToolBtn
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        label="Blockquote"
      >
        <Quote size={14} />
      </ToolBtn>
      <ToolBtn
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive('codeBlock')}
        label="Code block"
      >
        <Code size={14} />
      </ToolBtn>
      <Divider />
      <ToolBtn onClick={promptLink} active={editor.isActive('link')} label="Add / edit link">
        <LinkIcon size={14} />
      </ToolBtn>
      <ToolBtn onClick={promptImage} label="Insert image (URL)">
        <ImageIcon size={14} />
      </ToolBtn>
      <Divider />
      <ToolBtn
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        label="Undo (Ctrl+Z)"
      >
        <Undo size={14} />
      </ToolBtn>
      <ToolBtn
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        label="Redo (Ctrl+Shift+Z)"
      >
        <Redo size={14} />
      </ToolBtn>
    </div>
  )
}

function ToolBtn({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`rounded p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-1 focus-visible:ring-offset-surface-50 ${
        active
          ? 'bg-surface-900 text-white'
          : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900 disabled:text-surface-300 disabled:hover:bg-transparent disabled:hover:text-surface-300'
      }`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-surface-200" aria-hidden />
}
