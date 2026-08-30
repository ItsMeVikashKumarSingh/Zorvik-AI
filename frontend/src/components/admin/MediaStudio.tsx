import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  Image as ImageIcon,
  Film,
  Wand2,
} from 'lucide-react';

interface MediaStudioProps {
  adminToken: string;
}

interface GeneratedAsset {
  id: string;
  type: 'image' | 'video';
  url: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  createdAt: string;
}

const STYLE_PRESETS = [
  { id: 'none', label: 'Raw / Neutral' },
  { id: 'photorealism', label: 'Photorealism (8K)' },
  { id: 'cyberpunk', label: 'Cyberpunk Neon' },
  { id: 'anime', label: 'Anime & Manga' },
  { id: 'cinematic-3d', label: 'Cinematic 3D' },
  { id: 'minimalist', label: 'Minimalist Vector' },
  { id: 'digital-art', label: 'Digital Art' },
];

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Square', width: 1024, height: 1024 },
  { id: '16:9', label: '16:9 Landscape', width: 1344, height: 768 },
  { id: '9:16', label: '9:16 Portrait / Reel', width: 768, height: 1344 },
  { id: '4:3', label: '4:3 Classic', width: 1152, height: 864 },
];

export const MediaStudio: React.FC<MediaStudioProps> = () => {
  const [activeMode, setActiveMode] = useState<'image' | 'video'>('image');
  const [prompt, setPrompt] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('flux');
  const [selectedStyle, setSelectedStyle] = useState<string>('photorealism');
  const [selectedAspect, setSelectedAspect] = useState<string>('1:1');
  const [generating, setGenerating] = useState<boolean>(false);
  const [enhancing, setEnhancing] = useState<boolean>(false);
  const [currentAsset, setCurrentAsset] = useState<GeneratedAsset | null>({
    id: 'demo-1',
    type: 'image',
    url: 'https://image.pollinations.ai/prompt/futuristic%20cyberpunk%20tokyo%20neon%20rain%20hasselblad%2050mm?model=flux&width=1024&height=1024&seed=42&nologo=true',
    prompt: 'A futuristic cybernetic tiger prowling through neon-lit rainy streets of Neo-Tokyo, 8k resolution, Hasselblad 50mm raw photograph',
    model: 'flux',
    aspectRatio: '1:1',
    createdAt: new Date().toLocaleTimeString(),
  });
  const [history, setHistory] = useState<GeneratedAsset[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setEnhancing(true);
    try {
      const res = await fetch('/api/v1/prompt/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode: 'creative' }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.enhancedPrompt) {
          setPrompt(json.enhancedPrompt);
        }
      }
    } catch {
      // Non-blocking
    } finally {
      setEnhancing(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setGenerating(true);
    const aspectObj = ASPECT_RATIOS.find((a) => a.id === selectedAspect) || ASPECT_RATIOS[0];

    try {
      const endpoint = activeMode === 'image' ? '/api/v1/generate/image' : '/api/v1/generate/video';
      const payload =
        activeMode === 'image'
          ? {
              prompt: prompt.trim(),
              model: selectedModel,
              width: aspectObj.width,
              height: aspectObj.height,
              style: selectedStyle !== 'none' ? selectedStyle : undefined,
              seed: Math.floor(Math.random() * 1000000),
            }
          : {
              prompt: prompt.trim(),
              model: selectedModel === 'flux' ? 'wan2.1' : selectedModel,
              aspectRatio: selectedAspect,
              duration: 5,
            };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.url) {
          const newAsset: GeneratedAsset = {
            id: Date.now().toString(),
            type: activeMode,
            url: json.url,
            prompt: prompt.trim(),
            model: json.model || selectedModel,
            aspectRatio: selectedAspect,
            createdAt: new Date().toLocaleTimeString(),
          };
          setCurrentAsset(newAsset);
          setHistory((prev) => [newAsset, ...prev.slice(0, 11)]);
        }
      }
    } catch (err: any) {
      alert('Generation error: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!currentAsset?.url) return;
    navigator.clipboard.writeText(currentAsset.url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="space-y-6 font-['IBM_Plex_Sans',sans-serif] text-[#141310]">
      {/* Header Banner */}
      <div className="p-6 rounded-lg bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] mb-1">
            MULTI-MODAL SYNTHESIS ENGINE
          </div>
          <h2 className="text-base font-semibold text-[#141310] tracking-tight">
            Zero-Cost Image & Motion Video Generation Studio
          </h2>
          <p className="text-xs text-[rgba(20,19,16,0.62)] mt-1">
            Synthesize high-resolution FLUX.1 / SDXL visual art and Alibaba Wan 2.1 cinematic motion clips.
          </p>
        </div>

        {/* Mode Toggle: Image vs Video */}
        <div className="flex items-center p-0.5 rounded border border-[rgba(20,19,16,0.14)] bg-[#f4f1ea] self-start md:self-auto">
          <button
            onClick={() => {
              setActiveMode('image');
              setSelectedModel('flux');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeMode === 'image'
                ? 'bg-[#141310] text-[#faf8f3] font-semibold'
                : 'text-[rgba(20,19,16,0.62)] hover:text-[#141310]'
            }`}
          >
            <ImageIcon size={13} />
            <span>FLUX.1 Image Studio</span>
          </button>
          <button
            onClick={() => {
              setActiveMode('video');
              setSelectedModel('wan2.1');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeMode === 'video'
                ? 'bg-[#141310] text-[#faf8f3] font-semibold'
                : 'text-[rgba(20,19,16,0.62)] hover:text-[#141310]'
            }`}
          >
            <Film size={13} />
            <span>Wan 2.1 Video Studio</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Controls & Prompting */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleGenerate} className="p-5 rounded-lg bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] font-['IBM_Plex_Mono',monospace]">
                  Creation Prompt
                </label>
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={enhancing || !prompt.trim()}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#141310] hover:underline disabled:opacity-40"
                >
                  <Wand2 size={11} className={enhancing ? 'animate-spin' : ''} />
                  <span>{enhancing ? 'Optimizing...' : 'Prompt Magic'}</span>
                </button>
              </div>
              <textarea
                rows={4}
                required
                placeholder={
                  activeMode === 'image'
                    ? 'Describe your visual idea in detail (e.g., A cybernetic samurai in rainy Neo Tokyo, hyper-realistic, 8k, cinematic lighting)...'
                    : 'Describe your dynamic video scene (e.g., A drone flyover across illuminated futuristic skyscrapers at dusk, smooth cinematic motion)...'
                }
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] rounded p-3 text-xs text-[#141310] placeholder-[rgba(20,19,16,0.42)] outline-none focus:border-[#141310] transition-colors resize-none"
              />
            </div>

            {/* Model Selector */}
            <div>
              <label className="block text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] font-['IBM_Plex_Mono',monospace] mb-1.5">
                Neural Synthesis Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] rounded px-3 py-2 text-xs text-[#141310] outline-none focus:border-[#141310] font-['IBM_Plex_Mono',monospace]"
              >
                {activeMode === 'image' ? (
                  <>
                    <option value="flux">FLUX.1 Schnell (Fast & Crisp)</option>
                    <option value="flux-realism">FLUX.1 Realism (Ultra Photo)</option>
                    <option value="flux-anime">FLUX.1 Anime & Manga Core</option>
                    <option value="flux-3d">FLUX.1 3D Render & Isometric</option>
                    <option value="turbo">SDXL Lightning (Sub-Second)</option>
                  </>
                ) : (
                  <>
                    <option value="wan2.1">Wan 2.1 (Alibaba Open Video - 14B)</option>
                    <option value="cogvideox">CogVideoX-5B (3D Cinematic)</option>
                    <option value="animatediff">AnimateDiff Lightning (60 FPS)</option>
                    <option value="pollinations-motion">Pollinations Motion Engine</option>
                  </>
                )}
              </select>
            </div>

            {/* Style Presets (For Image Mode) */}
            {activeMode === 'image' && (
              <div>
                <label className="block text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] font-['IBM_Plex_Mono',monospace] mb-1.5">
                  Artistic Style Modifier
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {STYLE_PRESETS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStyle(s.id)}
                      className={`px-2.5 py-1.5 rounded text-[11px] font-medium border text-left truncate transition-colors ${
                        selectedStyle === s.id
                          ? 'bg-[#141310] text-[#faf8f3] border-[#141310] font-semibold'
                          : 'bg-[#f4f1ea] text-[rgba(20,19,16,0.70)] border-[rgba(20,19,16,0.12)] hover:border-[#141310]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Aspect Ratio Selector */}
            <div>
              <label className="block text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] font-['IBM_Plex_Mono',monospace] mb-1.5">
                Aspect Ratio & Dimensions
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {ASPECT_RATIOS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedAspect(a.id)}
                    className={`px-2.5 py-1.5 rounded text-[11px] font-['IBM_Plex_Mono',monospace] border text-left truncate transition-colors ${
                      selectedAspect === a.id
                        ? 'bg-[#141310] text-[#faf8f3] border-[#141310] font-semibold'
                        : 'bg-[#f4f1ea] text-[rgba(20,19,16,0.70)] border-[rgba(20,19,16,0.12)] hover:border-[#141310]'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={generating || !prompt.trim()}
              className="w-full py-2.5 rounded bg-[#141310] hover:bg-[rgba(20,19,16,0.85)] text-[#faf8f3] text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {generating ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Synthesizing Multi-Modal Media...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Generate {activeMode === 'image' ? 'Image' : 'Video Motion'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Live Viewport Canvas */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-lg bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(20,19,16,0.10)]">
              <div className="flex items-center gap-2">
                <Sliders size={13} className="text-[#141310]" />
                <span className="text-xs font-semibold text-[#141310]">Live Synthesis Canvas</span>
              </div>

              {currentAsset && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] text-[11px] font-medium text-[#141310] hover:bg-[#faf8f3] transition-colors"
                  >
                    {copiedUrl ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
                  </button>
                  <a
                    href={currentAsset.url}
                    target="_blank"
                    rel="noreferrer"
                    download={`zorvik-${currentAsset.type}-${currentAsset.id}.png`}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#141310] text-[#faf8f3] text-[11px] font-semibold hover:bg-[rgba(20,19,16,0.85)] transition-colors"
                  >
                    <Download size={11} />
                    <span>Download</span>
                  </a>
                </div>
              )}
            </div>

            {/* Asset Display Viewport */}
            <div className="w-full min-h-[420px] rounded border border-[rgba(20,19,16,0.12)] bg-[#f4f1ea] flex flex-col items-center justify-center p-4 relative overflow-hidden">
              {generating ? (
                <div className="flex flex-col items-center justify-center text-center space-y-3 py-16">
                  <RefreshCw size={28} className="animate-spin text-[#141310]" />
                  <div>
                    <div className="text-xs font-semibold text-[#141310]">Synthesizing Neural Art...</div>
                    <div className="text-[11px] text-[rgba(20,19,16,0.50)] font-['IBM_Plex_Mono',monospace] mt-0.5">
                      Executing diffusion passes across zero-cost cloud cluster
                    </div>
                  </div>
                </div>
              ) : currentAsset ? (
                <div className="w-full flex flex-col items-center space-y-3">
                  {currentAsset.type === 'video' ? (
                    <div className="w-full max-w-xl rounded overflow-hidden shadow-sm border border-[rgba(20,19,16,0.14)]">
                      <img
                        src={currentAsset.url}
                        alt={currentAsset.prompt}
                        className="w-full h-auto object-cover max-h-[500px]"
                      />
                    </div>
                  ) : (
                    <div className="w-full max-w-xl rounded overflow-hidden shadow-sm border border-[rgba(20,19,16,0.14)]">
                      <img
                        src={currentAsset.url}
                        alt={currentAsset.prompt}
                        className="w-full h-auto object-contain max-h-[500px]"
                      />
                    </div>
                  )}

                  <div className="w-full p-3 rounded bg-[#faf8f3] border border-[rgba(20,19,16,0.10)] text-xs space-y-1 font-['IBM_Plex_Mono',monospace]">
                    <div className="text-[10px] uppercase font-semibold text-[rgba(20,19,16,0.42)]">
                      PROMPT APPLIED:
                    </div>
                    <div className="text-[#141310] font-sans text-xs">{currentAsset.prompt}</div>
                    <div className="flex items-center gap-3 pt-1 text-[10px] text-[rgba(20,19,16,0.42)]">
                      <span>Model: {currentAsset.model}</span>
                      <span>•</span>
                      <span>Aspect: {currentAsset.aspectRatio}</span>
                      <span>•</span>
                      <span>Created: {currentAsset.createdAt}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-xs text-[rgba(20,19,16,0.42)]">
                  Enter a prompt on the left to start generating.
                </div>
              )}
            </div>
          </div>

          {/* Creation History Ribbon */}
          {history.length > 0 && (
            <div className="p-4 rounded-lg bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] font-['IBM_Plex_Mono',monospace]">
                RECENT CREATIONS GALLERY
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {history.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setCurrentAsset(h)}
                    className="aspect-square rounded border border-[rgba(20,19,16,0.14)] overflow-hidden hover:border-[#141310] transition-colors relative group"
                  >
                    <img src={h.url} alt={h.prompt} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
