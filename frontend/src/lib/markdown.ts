import { marked } from 'marked';
import DOMPurify from 'dompurify';
import katex from 'katex';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-json';

// Configure marked options with Prism code syntax highlighting
marked.setOptions({
  breaks: true,
  gfm: true,
});

marked.use({
  renderer: {
    code({ text, lang }) {
      if (lang === 'mermaid') {
        return `<div class="mermaid-block my-4 p-4 rounded-xl border border-white/[0.08] bg-[#070710] overflow-x-auto text-center shadow-xl"><pre class="mermaid !bg-transparent !p-0 !m-0 font-sans text-xs">${text.trim()}</pre></div>`;
      }

      const language = lang && Prism.languages[lang] ? lang : (lang === 'ts' || lang === 'tsx' ? 'typescript' : (lang === 'js' || lang === 'jsx' ? 'javascript' : (lang === 'sh' || lang === 'shell' ? 'bash' : 'plaintext')));
      let highlighted = text;
      if (language !== 'plaintext' && Prism.languages[language]) {
        try {
          highlighted = Prism.highlight(text, Prism.languages[language], language);
        } catch {
          highlighted = text;
        }
      }
      return `<div class="my-4 rounded-xl border border-white/[0.08] bg-[#070710] overflow-hidden shadow-xl"><div class="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/[0.06] text-[11px] font-mono text-ash-gray uppercase tracking-wider"><span>${lang || 'CODE'}</span></div><div class="p-4 overflow-x-auto font-mono text-[13px] leading-relaxed text-silver-mist"><pre class="!bg-transparent !p-0 !m-0"><code class="language-${language}">${highlighted}</code></pre></div></div>`;
    },
  },
});

/**
 * Render LaTeX math expressions inline and display
 */
export function renderMath(text: string): string {
  // Display Math: $$ ... $$
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_match, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      return formula;
    }
  });

  // Inline Math: $ ... $ (avoiding currency amounts like $50)
  text = text.replace(/(?<!\\|\$)\$([^$\n]+?)\$(?!\$)/g, (match, formula) => {
    // If it's just a number or price e.g. $50, do not treat as math
    if (/^\d+(\.\d+)?$/.test(formula.trim())) {
      return match;
    }
    try {
      return katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return match;
    }
  });

  return text;
}

/**
 * Highlight code blocks using Prism
 */
export function highlightCode(code: string, language?: string): string {
  const validLanguage = language && Prism.languages[language] ? language : 'javascript';
  try {
    return Prism.highlight(code, Prism.languages[validLanguage], validLanguage);
  } catch {
    return code;
  }
}

/**
 * Full Markdown + Math + Syntax Highlighter + Security Sanitizer pipeline
 */
export function renderMarkdown(content: string): string {
  if (!content) return '';

  // 1. Process Math LaTeX first
  const withMath = renderMath(content);

  // 2. Parse Markdown to HTML
  const rawHtml = marked.parse(withMath) as string;

  // 3. Sanitize HTML to prevent XSS
  return DOMPurify.sanitize(rawHtml, {
    ADD_TAGS: [
      'math',
      'mrow',
      'mi',
      'mo',
      'mn',
      'msup',
      'msub',
      'mfrac',
      'span',
      'svg',
      'g',
      'path',
      'rect',
      'circle',
      'text',
      'line',
      'polygon',
      'polyline',
      'marker',
      'defs',
      'clippath',
      'foreignobject',
      'pre',
    ],
    ADD_ATTR: [
      'class',
      'style',
      'viewBox',
      'fill',
      'xmlns',
      'd',
      'stroke',
      'stroke-width',
      'stroke-linecap',
      'aria-hidden',
      'id',
      'transform',
      'width',
      'height',
    ],
  });
}
