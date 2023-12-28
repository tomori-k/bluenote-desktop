import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'

const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language }).value
    },
  })
)

marked.use({
  breaks: true,
  renderer: {
    // escape
    html(html: string) {
      return html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/\'/g, '&#x27;')
        .replace(/`/g, '&#x60')
    },
    // disable
    checkbox(checked: boolean) {
      return checked ? '[x]' : '[ ]'
    },
  },
  // disable
  tokenizer: {
    table(_: string) {
      return undefined
    },
    heading(_: string) {
      return undefined
    },
    hr(_: string) {
      return false
    },
  },
})

export function toHtml(markdown: string) {
  return marked.parse(markdown)
}
