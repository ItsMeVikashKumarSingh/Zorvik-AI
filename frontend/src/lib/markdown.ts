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

// Configure marked options
marked.setOptions({
  breaks: true,
  gfm: true,
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
    ADD_TAGS: ['math', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'span', 'svg', 'path'],
    ADD_ATTR: ['class', 'style', 'viewBox', 'fill', 'xmlns', 'd', 'stroke', 'stroke-width', 'stroke-linecap', 'aria-hidden'],
  });
}
