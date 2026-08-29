import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Play,
  Code2,
  Eye,
  Copy,
  Check,
  Download,
  RotateCw,
  Maximize2,
  Minimize2,
  FileCode,
  GitCompare,
  History,
} from 'lucide-react';
import { ArtifactContent } from '../types';

interface ArtifactsCanvasProps {
  artifact: ArtifactContent | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedFile {
  name: string;
  language: string;
  content: string;
}

interface ArtifactVersion {
  id: number;
  code: string;
  timestamp: number;
}

export const ArtifactsCanvas: React.FC<ArtifactsCanvasProps> = ({
  artifact,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'diff'>('preview');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [versions, setVersions] = useState<ArtifactVersion[]>([]);

  // Track version history snapshots across artifact edits
  useEffect(() => {
    if (artifact?.code) {
      setVersions((prev) => {
        if (prev.length === 0 || prev[prev.length - 1].code !== artifact.code) {
          return [...prev, { id: prev.length + 1, code: artifact.code, timestamp: Date.now() }];
        }
        return prev;
      });
    }
  }, [artifact?.code]);

  // Parse multi-file code blocks (e.g. // file: index.html or <!-- file: index.html -->)
  const parsedFiles = useMemo<ParsedFile[]>(() => {
    if (!artifact || !artifact.code) return [];

    const fileSplitRegex = /(?:\/\/\s*file:\s*([\w.-]+)|<!--\s*file:\s*([\w.-]+)\s*-->|\/\*\s*file:\s*([\w.-]+)\s*\*\/)/gi;
    const parts = artifact.code.split(fileSplitRegex).filter(Boolean);

    if (parts.length > 1) {
      const files: ParsedFile[] = [];
      for (let i = 0; i < parts.length; i += 2) {
        const fileName = parts[i] || `file_${files.length + 1}`;
        const content = (parts[i + 1] || '').trim();
        const ext = fileName.split('.').pop()?.toLowerCase() || 'txt';
        files.push({
          name: fileName,
          language: ext,
          content,
        });
      }
      return files.length > 0 ? files : [{ name: 'main.' + artifact.language, language: artifact.language, content: artifact.code }];
    }

    return [{ name: `${artifact.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${artifact.language}`, language: artifact.language, content: artifact.code }];
  }, [artifact]);

  useEffect(() => {
    if (artifact) {
      const isRenderable = ['html', 'javascript', 'js', 'svg', 'react', 'tsx', 'jsx', 'python', 'py'].includes(
        artifact.language.toLowerCase()
      );
      setActiveTab(isRenderable ? 'preview' : 'code');
      setSelectedFileIndex(0);
    }
  }, [artifact]);

  if (!isOpen || !artifact) return null;

  const currentFile = parsedFiles[selectedFileIndex] || parsedFiles[0];

  const handleCopyCode = () => {
    const codeToCopy = currentFile ? currentFile.content : artifact.code;
    navigator.clipboard.writeText(codeToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extMap: Record<string, string> = {
      html: 'html',
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      css: 'css',
      svg: 'svg',
      json: 'json',
    };

    const targetFile = currentFile || { name: 'artifact.' + artifact.language, content: artifact.code, language: artifact.language };
    const ext = extMap[targetFile.language.toLowerCase()] || targetFile.language || 'txt';
    const blob = new Blob([targetFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = targetFile.name.includes('.') ? targetFile.name : `${targetFile.name}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate safe sandboxed HTML page for iframe
  const generatePreviewSrcDoc = () => {
    const lang = artifact.language.toLowerCase();
    if (lang === 'svg') {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #080812; color: #fff; }
              svg { max-width: 90vw; max-height: 90vh; }
            </style>
          </head>
          <body>${artifact.code}</body>
        </html>
      `;
    }

    if (lang === 'html' || lang === 'htm') {
      return artifact.code;
    }

    // Interactive React / TSX / JSX Sandboxed Runner
    if (['react', 'tsx', 'jsx', 'typescript', 'ts'].includes(lang)) {
      // Clean import statements from raw code so Babel standalone executes in single script scope
      const sanitizedCode = artifact.code
        .replace(/import\s+(?:React\s*,?\s*)?(?:\{[^}]*\}\s*from\s*)?['"][^'"]+['"];?/g, '')
        .replace(/export\s+default\s+/g, 'window.__MainComponent = ')
        .replace(/export\s+(?:const|function|class)\s+([A-Z]\w+)/g, 'window.__MainComponent = $1;');

      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <script src="https://cdn.tailwindcss.com"></script>
            <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
            <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
            <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
            <style>
              body { background: #080812; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; padding: 24px; min-height: 100vh; }
              .sandbox-error { color: #f43f5e; background: rgba(244,63,94,0.1); border: 1px solid rgba(244,63,94,0.3); border-radius: 12px; padding: 16px; font-family: monospace; font-size: 13px; white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <div id="root"></div>
            <script type="text/babel" data-presets="react,typescript">
              const { useState, useEffect, useRef, useMemo, useCallback } = React;
              try {
                ${sanitizedCode}

                const TargetComponent = window.__MainComponent || (typeof App !== 'undefined' ? App : null);
                if (TargetComponent) {
                  const root = ReactDOM.createRoot(document.getElementById('root'));
                  root.render(<TargetComponent />);
                } else {
                  document.getElementById('root').innerHTML = '<div class="sandbox-error">No exported React component found. Ensure you define a component or use "export default ComponentName".</div>';
                }
              } catch (err) {
                document.getElementById('root').innerHTML = '<div class="sandbox-error">Runtime Compilation Error:\\n' + err.message + '</div>';
              }
            </script>
          </body>
        </html>
      `;
    }

    if (lang === 'javascript' || lang === 'js') {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: monospace; padding: 20px; background: #080812; color: #eee; line-height: 1.5; }
              .console-log { color: #22d3ee; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px; }
              .console-error { color: #f43f5e; }
            </style>
          </head>
          <body>
            <div id="output"></div>
            <script>
              const out = document.getElementById('output');
              const oldLog = console.log;
              console.log = function(...args) {
                oldLog(...args);
                const el = document.createElement('div');
                el.className = 'console-log';
                el.textContent = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
                out.appendChild(el);
              };
              try {
                ${artifact.code}
              } catch (e) {
                const err = document.createElement('div');
                err.className = 'console-error';
                err.textContent = 'Runtime Error: ' + e.message;
                out.appendChild(err);
              }
            </script>
          </body>
        </html>
      `;
    }

    if (lang === 'python' || lang === 'py') {
      const escapedCode = JSON.stringify(artifact.code);
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <script src="https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js"></script>
            <style>
              body { background: #080812; color: #f8fafc; font-family: 'JetBrains Mono', monospace; padding: 20px; font-size: 13px; line-height: 1.6; }
              .terminal-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px; margin-bottom: 12px; font-size: 11px; color: #94a3b8; }
              .terminal-status { color: #22d3ee; }
              .stdout-line { color: #f1f5f9; white-space: pre-wrap; word-break: break-all; }
              .stderr-line { color: #f43f5e; white-space: pre-wrap; }
              .loader { color: #a855f7; display: flex; align-items: center; gap: 8px; }
            </style>
          </head>
          <body>
            <div class="terminal-header">
              <span>PYTHON 3.12 (PYODIDE WASM RUNTIME)</span>
              <span id="status" class="terminal-status">Initializing WebAssembly...</span>
            </div>
            <div id="terminal-output">
              <div id="loader" class="loader">Loading Python WebAssembly Environment...</div>
            </div>
            <script>
              async function runPython() {
                const out = document.getElementById('terminal-output');
                const status = document.getElementById('status');
                const loader = document.getElementById('loader');
                try {
                  const pyodide = await loadPyodide({
                    stdout: (text) => {
                      const el = document.createElement('div');
                      el.className = 'stdout-line';
                      el.textContent = text;
                      out.appendChild(el);
                    },
                    stderr: (text) => {
                      const el = document.createElement('div');
                      el.className = 'stderr-line';
                      el.textContent = text;
                      out.appendChild(el);
                    }
                  });
                  if (loader) loader.remove();
                  status.textContent = 'Execution Complete (Exit: 0)';
                  status.style.color = '#34d399';

                  const rawCode = ${escapedCode};
                  await pyodide.runPythonAsync(rawCode);
                } catch (err) {
                  if (loader) loader.remove();
                  status.textContent = 'Runtime Error';
                  status.style.color = '#f43f5e';
                  const errEl = document.createElement('div');
                  errEl.className = 'stderr-line';
                  errEl.textContent = String(err);
                  out.appendChild(errEl);
                }
              }
              runPython();
            </script>
          </body>
        </html>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>body { background: #080812; color: #94a3b8; font-family: monospace; padding: 30px; }</style>
        </head>
        <body>
          <h3>Preview not available for ${artifact.language}</h3>
          <p>Switch to the "Code" tab to inspect the source code.</p>
        </body>
      </html>
    `;
  };

  return (
    <div
      className={`fixed top-0 right-0 z-40 bg-[#080812] border-l border-white/[0.12] shadow-2xl flex flex-col transition-all duration-300 ${
        isFullscreen ? 'inset-0 w-full' : 'w-full md:w-[600px] lg:w-[680px] h-full'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#0c0c1a]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 rounded-lg bg-iris/20 text-iris">
            <Play size={15} />
          </div>
          <div className="truncate">
            <h3 className="text-sm font-medium text-white truncate">{artifact.title || 'Code Artifact'}</h3>
            <span className="text-[10px] font-mono uppercase text-silver/40">{artifact.language}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Tab Switcher */}
          <div className="flex items-center p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06] mr-2">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-all ${
                activeTab === 'preview' ? 'bg-iris text-white shadow-sm font-medium' : 'text-silver/50 hover:text-white'
              }`}
            >
              <Eye size={12} />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-all ${
                activeTab === 'code' ? 'bg-iris text-white shadow-sm font-medium' : 'text-silver/50 hover:text-white'
              }`}
            >
              <Code2 size={12} />
              <span>Code</span>
            </button>
            <button
              onClick={() => setActiveTab('diff')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-all ${
                activeTab === 'diff' ? 'bg-iris text-white shadow-sm font-medium' : 'text-silver/50 hover:text-white'
              }`}
              title={versions.length > 1 ? `Compare with v${versions.length - 1}` : 'No previous version yet'}
            >
              <GitCompare size={12} />
              <span>Diff</span>
              {versions.length > 1 && (
                <span className="text-[9px] px-1 rounded bg-white/20 font-mono">v{versions.length}</span>
              )}
            </button>
          </div>

          <button
            onClick={() => setIframeKey((k) => k + 1)}
            className="p-1.5 rounded-lg text-silver/50 hover:text-white hover:bg-white/[0.05] transition-colors"
            title="Reload Preview"
          >
            <RotateCw size={15} />
          </button>

          <button
            onClick={handleCopyCode}
            className="p-1.5 rounded-lg text-silver/50 hover:text-white hover:bg-white/[0.05] transition-colors"
            title="Copy Code"
          >
            {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg text-silver/50 hover:text-white hover:bg-white/[0.05] transition-colors"
            title="Download file"
          >
            <Download size={15} />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg text-silver/50 hover:text-white hover:bg-white/[0.05] transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-silver/50 hover:text-white hover:bg-white/[0.05] transition-colors ml-1"
            title="Close Canvas"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Multi-File Tab Selector (if multiple files detected) */}
      {activeTab === 'code' && parsedFiles.length > 1 && (
        <div className="flex items-center gap-1 px-4 py-2 border-b border-white/[0.06] bg-[#090912] overflow-x-auto">
          {parsedFiles.map((file, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedFileIndex(idx)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                selectedFileIndex === idx
                  ? 'bg-iris/20 text-iris border border-iris/40 font-medium'
                  : 'bg-white/[0.02] border border-white/[0.05] text-silver/50 hover:text-white'
              }`}
            >
              <FileCode size={12} />
              <span>{file.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Canvas Body */}
      <div className="flex-1 relative overflow-hidden bg-[#06060c]">
        {activeTab === 'preview' ? (
          <iframe
            key={iframeKey}
            title={artifact.title}
            srcDoc={generatePreviewSrcDoc()}
            sandbox="allow-scripts allow-modals"
            className="w-full h-full border-none bg-[#050510]"
          />
        ) : activeTab === 'code' ? (
          <pre className="w-full h-full p-4 overflow-auto font-mono text-xs text-silver/90 leading-relaxed select-text">
            <code>{currentFile ? currentFile.content : artifact.code}</code>
          </pre>
        ) : (
          /* Diff Viewer */
          <div className="w-full h-full overflow-auto p-4 font-mono text-xs select-text">
            {versions.length < 2 ? (
              <div className="flex flex-col items-center justify-center h-full text-silver/40 text-center gap-2">
                <History size={24} className="text-iris/50" />
                <p>Initial revision (v1). Refine or modify the artifact in chat to view side-by-side diffs.</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                <div className="text-[11px] text-silver/40 pb-2 mb-2 border-b border-white/[0.06] flex items-center justify-between">
                  <span>Comparing revision v{versions.length - 1} $\rightarrow$ v{versions.length}</span>
                  <span className="text-emerald-400">Green = Added</span>
                </div>
                {(() => {
                  const oldL = (versions[versions.length - 2]?.code || '').split('\n');
                  const newL = artifact.code.split('\n');
                  return newL.map((line, idx) => {
                    const isAdded = !oldL.includes(line);
                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 px-2 py-0.5 rounded ${
                          isAdded
                            ? 'bg-emerald-500/10 text-emerald-300 border-l-2 border-emerald-500'
                            : 'text-silver/80'
                        }`}
                      >
                        <span className="w-8 text-right text-silver/30 select-none text-[10px] shrink-0 font-mono">
                          {idx + 1}
                        </span>
                        <span className="w-4 select-none text-silver/40 font-mono shrink-0">
                          {isAdded ? '+' : ' '}
                        </span>
                        <span className="whitespace-pre-wrap break-all flex-1">{line || '\u00A0'}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
