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

export const ArtifactsCanvas: React.FC<ArtifactsCanvasProps> = ({
  artifact,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

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
      const isRenderable = ['html', 'javascript', 'js', 'svg', 'react', 'tsx', 'jsx'].includes(
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
        ) : (
          <pre className="w-full h-full p-4 overflow-auto font-mono text-xs text-silver/90 leading-relaxed select-text">
            <code>{currentFile ? currentFile.content : artifact.code}</code>
          </pre>
        )}
      </div>
    </div>
  );
};
