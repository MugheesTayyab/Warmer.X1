import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, Image as ImageIcon, Upload, RefreshCw, Zap, Eye, EyeOff, ShieldAlert, Crosshair, Volume2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { FrameAnalysisResult, SampleScene, SystemSettings } from '../types';
import { SAMPLE_SCENES } from '../data/sampleScenes';
import { audioEngine } from '../lib/audioEngine';

interface CameraViewProps {
  analysisResult: FrameAnalysisResult | null;
  onAnalyzeFrame: (base64Data: string) => void;
  isAnalyzing: boolean;
  settings: SystemSettings;
  selectedScene: SampleScene;
  setSelectedScene: (scene: SampleScene) => void;
  activeSourceMode: 'preset' | 'webcam' | 'upload';
  setActiveSourceMode: (mode: 'preset' | 'webcam' | 'upload') => void;
  onSelectCandidate: (index: number) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  analysisResult,
  onAnalyzeFrame,
  isAnalyzing,
  settings,
  selectedScene,
  setSelectedScene,
  activeSourceMode,
  setActiveSourceMode,
  onSelectCandidate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [proximityScore, setProximityScore] = useState<number>(0); // 0 to 1
  const [fps, setFps] = useState<number>(settings.motionGatedFps || 30);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(settings.explainabilityMode);
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);

  // Sync heatmap state with system settings
  useEffect(() => {
    setShowHeatmap(settings.explainabilityMode);
  }, [settings.explainabilityMode]);

  // Handle Webcam Start/Stop
  const startWebcam = useCallback(async () => {
    setWebcamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsWebcamActive(true);
      }
    } catch (err: any) {
      console.warn('Webcam access error:', err);
      setWebcamError('Camera unavailable or permission denied. Switch to Clutter Presets or File Upload.');
      setIsWebcamActive(false);
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
  }, []);

  useEffect(() => {
    if (activeSourceMode === 'webcam') {
      startWebcam();
    } else {
      stopWebcam();
    }
    return () => stopWebcam();
  }, [activeSourceMode, startWebcam, stopWebcam]);

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const resultStr = event.target?.result as string;
        setUploadedImageSrc(resultStr);
        setActiveSourceMode('upload');
        // Trigger auto frame analysis
        onAnalyzeFrame(resultStr);
      };
      reader.readAsDataURL(file);
    }
  };

  // Convert current view image to Base64 and trigger frame analysis
  const captureAndAnalyze = useCallback(() => {
    if (activeSourceMode === 'webcam' && videoRef.current && isWebcamActive) {
      const v = videoRef.current;
      const offscreen = document.createElement('canvas');
      offscreen.width = v.videoWidth || 640;
      offscreen.height = v.videoHeight || 480;
      const ctx = offscreen.getContext('2d');
      if (ctx) {
        ctx.drawImage(v, 0, 0, offscreen.width, offscreen.height);
        const dataUrl = offscreen.toDataURL('image/jpeg', 0.85);
        onAnalyzeFrame(dataUrl);
      }
    } else if (activeSourceMode === 'upload' && uploadedImageSrc) {
      onAnalyzeFrame(uploadedImageSrc);
    } else if (activeSourceMode === 'preset' && imageRef.current) {
      const img = imageRef.current;
      const offscreen = document.createElement('canvas');
      offscreen.width = img.naturalWidth || 800;
      offscreen.height = img.naturalHeight || 600;
      const ctx = offscreen.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, offscreen.width, offscreen.height);
        const dataUrl = offscreen.toDataURL('image/jpeg', 0.85);
        onAnalyzeFrame(dataUrl);
      }
    }
  }, [activeSourceMode, isWebcamActive, uploadedImageSrc, onAnalyzeFrame]);

  // Canvas Drawing & Overlay Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let pulseAngle = 0;

    const renderOverlay = () => {
      pulseAngle += 0.05;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (analysisResult && analysisResult.candidates.length > 0) {
        const selectedCandidate =
          analysisResult.selectedCandidateIndex >= 0
            ? analysisResult.candidates[analysisResult.selectedCandidateIndex]
            : analysisResult.candidates[0];

        if (selectedCandidate) {
          const { bbox, isMatch } = selectedCandidate;

          // Convert normalized 0-1000 box coordinates to canvas pixels
          const x = (bbox.xmin / 1000) * width;
          const y = (bbox.ymin / 1000) * height;
          const w = ((bbox.xmax - bbox.xmin) / 1000) * width;
          const h = ((bbox.ymax - bbox.ymin) / 1000) * height;
          const cx = x + w / 2;
          const cy = y + h / 2;

          // Calculate distance from screen center for proximity
          const screenCx = width / 2;
          const screenCy = height / 2;
          const distToCenter = Math.sqrt((cx - screenCx) ** 2 + (cy - screenCy) ** 2);
          const maxDist = Math.sqrt(screenCx ** 2 + screenCy ** 2);
          const prox = Math.max(0, 1 - distToCenter / maxDist);
          setProximityScore(prox);

          // Trigger audio chime if enabled
          if (settings.audioFeedback && isMatch) {
            audioEngine.playProximityTone(prox);
          }

          // 1. Draw Heatmap Grid if Explainability Mode is ON
          if (showHeatmap && analysisResult.explainability?.heatmapMatrix) {
            const matrix = analysisResult.explainability.heatmapMatrix;
            const rows = matrix.length;
            const cols = matrix[0]?.length || 8;
            const cellW = width / cols;
            const cellH = height / rows;

            for (let r = 0; r < rows; r++) {
              for (let c = 0; c < cols; c++) {
                const val = matrix[r][c];
                if (val > 0.15) {
                  // Thermal color map: cyan/emerald -> yellow -> red
                  const hue = (1 - val) * 200; // Cyan to Red
                  ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${val * 0.45})`;
                  ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
                }
              }
            }
          }

          // 2. Draw SAM 3 Segment Mask Glowing Polygon/Aura
          ctx.save();
          const auraRadius = Math.max(w, h) * 0.7 + Math.sin(pulseAngle) * 8;
          const radialGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, auraRadius);
          
          if (isMatch) {
            radialGrad.addColorStop(0, 'rgba(34, 211, 238, 0.75)'); // Cyan core glow
            radialGrad.addColorStop(0.6, 'rgba(16, 185, 129, 0.4)'); // Emerald secondary
            radialGrad.addColorStop(1, 'rgba(34, 211, 238, 0)');
          } else {
            radialGrad.addColorStop(0, 'rgba(245, 158, 11, 0.5)'); // Amber secondary candidate
            radialGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
          }

          ctx.fillStyle = radialGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, auraRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // 3. Draw Neon Contour Bounding Box & Corner Brackets
          ctx.save();
          ctx.strokeStyle = isMatch ? '#22d3ee' : '#f59e0b';
          ctx.lineWidth = 3;
          ctx.shadowColor = isMatch ? '#22d3ee' : '#f59e0b';
          ctx.shadowBlur = 18;

          // Animated dashing outline
          ctx.setLineDash([12, 6]);
          ctx.lineDashOffset = -pulseAngle * 10;
          ctx.strokeRect(x, y, w, h);

          // Draw sharp corner reticles
          const bracketLength = Math.min(w, h) * 0.25;
          ctx.setLineDash([]);
          ctx.lineWidth = 4;

          // Top Left
          ctx.beginPath();
          ctx.moveTo(x, y + bracketLength);
          ctx.lineTo(x, y);
          ctx.lineTo(x + bracketLength, y);
          ctx.stroke();

          // Top Right
          ctx.beginPath();
          ctx.moveTo(x + w - bracketLength, y);
          ctx.lineTo(x + w, y);
          ctx.lineTo(x + w, y + bracketLength);
          ctx.stroke();

          // Bottom Left
          ctx.beginPath();
          ctx.moveTo(x, y + h - bracketLength);
          ctx.lineTo(x, y + h);
          ctx.lineTo(x + bracketLength, y + h);
          ctx.stroke();

          // Bottom Right
          ctx.beginPath();
          ctx.moveTo(x + w - bracketLength, y + h);
          ctx.lineTo(x + w, y + h);
          ctx.lineTo(x + w, y + h - bracketLength);
          ctx.stroke();

          // 4. Draw Center Targeting Crosshair Line
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(screenCx, screenCy);
          ctx.lineTo(cx, cy);
          ctx.stroke();

          // 5. Draw Candidate Badge Label
          ctx.fillStyle = isMatch ? 'rgba(6, 182, 212, 0.95)' : 'rgba(180, 83, 9, 0.95)';
          ctx.shadowBlur = 0;
          const labelText = `${isMatch ? '🎯 TARGET_LOCKED' : '🔍 CANDIDATE'}: ${selectedCandidate.label.toUpperCase()} (${Math.round(selectedCandidate.confidence * 100)}%)`;
          ctx.font = 'bold 11px Space Mono, monospace';
          const textWidth = ctx.measureText(labelText).width;

          const badgeX = Math.max(10, Math.min(x, width - textWidth - 20));
          const badgeY = Math.max(25, y - 10);

          ctx.fillRect(badgeX - 4, badgeY - 16, textWidth + 12, 22);
          ctx.fillStyle = '#050505';
          ctx.fillText(labelText, badgeX, badgeY - 1);

          ctx.restore();
        }
      }

      // Draw Center Screen Crosshair
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 10, 0, Math.PI * 2);
      ctx.moveTo(width / 2 - 16, height / 2);
      ctx.lineTo(width / 2 + 16, height / 2);
      ctx.moveTo(width / 2, height / 2 - 16);
      ctx.lineTo(width / 2, height / 2 + 16);
      ctx.stroke();

      animId = requestAnimationFrame(renderOverlay);
    };

    renderOverlay();

    return () => cancelAnimationFrame(animId);
  }, [analysisResult, showHeatmap, settings.audioFeedback]);

  // Image source to show
  const currentImageSrc =
    activeSourceMode === 'upload' && uploadedImageSrc
      ? uploadedImageSrc
      : selectedScene.imageUrl;

  return (
    <div className="flex flex-col space-y-4">
      {/* Source Selector Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-900 border-2 border-zinc-800 p-2.5">
        <div className="flex items-center space-x-1 font-mono text-xs uppercase font-bold tracking-wider">
          <button
            id="source-mode-preset"
            onClick={() => setActiveSourceMode('preset')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 transition ${
              activeSourceMode === 'preset'
                ? 'bg-cyan-400 text-black shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Presets</span>
          </button>

          <button
            id="source-mode-webcam"
            onClick={() => setActiveSourceMode('webcam')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 transition ${
              activeSourceMode === 'webcam'
                ? 'bg-cyan-400 text-black shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Webcam</span>
          </button>

          <label
            id="source-mode-upload"
            className={`cursor-pointer flex items-center space-x-1.5 px-3 py-1.5 transition ${
              activeSourceMode === 'upload'
                ? 'bg-cyan-400 text-black shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
            <input type="file" accept="image/*,video/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Heatmap & Re-scan controls */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          <button
            id="btn-toggle-gradcam-overlay"
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 border transition uppercase tracking-wider font-bold ${
              showHeatmap
                ? 'bg-rose-950 text-rose-300 border-rose-500/60'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
            title="Toggle Grad-CAM Attention Heatmap Layer"
          >
            {showHeatmap ? <Eye className="w-3.5 h-3.5 text-rose-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Heatmap</span>
          </button>

          <button
            id="btn-rescan-current-frame"
            onClick={captureAndAnalyze}
            disabled={isAnalyzing}
            className="p-1.5 bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white transition active:scale-95"
            title="Re-scan Current View Frame"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Clutter Preset Selector Pills */}
      {activeSourceMode === 'preset' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {SAMPLE_SCENES.map((scene) => (
            <button
              key={scene.id}
              id={`preset-scene-${scene.id}`}
              onClick={() => {
                setSelectedScene(scene);
                // Trigger auto frame scan
                setTimeout(() => captureAndAnalyze(), 100);
              }}
              className={`p-2.5 text-left border font-mono transition relative overflow-hidden flex flex-col justify-between ${
                selectedScene.id === scene.id
                  ? 'bg-zinc-900 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                  : 'bg-zinc-950 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700'
              }`}
            >
              <div>
                <p className="text-xs font-bold text-white uppercase line-clamp-1">{scene.title}</p>
                <p className="text-[10px] text-zinc-500 uppercase line-clamp-1">{scene.category}</p>
              </div>
              <span className={`mt-1.5 inline-block text-[9px] px-1.5 py-0.5 font-bold uppercase w-fit ${
                scene.difficulty === 'Extreme Clutter' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              }`}>
                {scene.difficulty}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Primary Video / Image Canvas Viewing Stage */}
      <div className="relative border-4 border-zinc-900 bg-black feed-glow aspect-[16/10] sm:aspect-[16/9] flex items-center justify-center overflow-hidden">
        <div className="scan-line"></div>

        {/* Background Source Rendering */}
        {activeSourceMode === 'webcam' ? (
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            ref={imageRef}
            src={currentImageSrc}
            alt="Clutter View"
            crossOrigin="anonymous"
            className="w-full h-full object-cover transition-all duration-300"
            onLoad={() => {
              // Trigger auto scan on image load if no result yet
              if (!analysisResult) {
                captureAndAnalyze();
              }
            }}
          />
        )}

        {/* Live Canvas Vector Overlay */}
        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Webcam Error Fallback Notice */}
        {activeSourceMode === 'webcam' && webcamError && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center space-y-3 z-20 font-mono">
            <AlertCircle className="w-10 h-10 text-amber-400" />
            <p className="text-xs text-zinc-200 max-w-md uppercase">{webcamError}</p>
            <button
              onClick={() => setActiveSourceMode('preset')}
              className="px-4 py-2 bg-cyan-400 text-black font-extrabold text-xs uppercase tracking-widest"
            >
              Use Clutter Presets
            </button>
          </div>
        )}

        {/* HUD Top Performance Metrics Ribbon */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none font-mono">
          <div className="flex items-center space-x-2 bg-black/80 border border-cyan-500/30 px-3 py-1 text-[10px] text-cyan-400 uppercase tracking-widest">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>LIVE_FEED:001</span>
            <span className="text-zinc-600">|</span>
            <span>LATENCY: {analysisResult?.latencyMs || 42}ms</span>
            <span className="text-zinc-600">|</span>
            <span className="hidden sm:inline">SAM3: {analysisResult?.samInferenceMs || 18}ms</span>
          </div>

          <div className="flex items-center space-x-2 bg-black/80 border border-zinc-800 px-3 py-1 text-[10px]">
            <span className={`w-2 h-2 ${
              analysisResult?.clutterMetrics.searchStatus === 'FOUND'
                ? 'bg-emerald-400 animate-ping'
                : 'bg-amber-400 animate-pulse'
            }`} />
            <span className="font-bold text-white uppercase tracking-widest">
              STATUS: {analysisResult?.clutterMetrics.searchStatus || 'SCANNING'}
            </span>
          </div>
        </div>

        {/* HUD Bottom Target Candidate Quick Switch Bar */}
        {analysisResult && analysisResult.candidates.length > 0 && (
          <div className="absolute bottom-3 left-3 right-3 bg-black/90 border border-zinc-800 p-2.5 z-20 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono">
            <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto text-xs">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider whitespace-nowrap">Candidates:</span>
              {analysisResult.candidates.map((cand, idx) => {
                const isSelected = analysisResult.selectedCandidateIndex === idx;
                return (
                  <button
                    key={cand.id}
                    id={`candidate-pill-${idx}`}
                    onClick={() => onSelectCandidate(idx)}
                    className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold flex items-center space-x-1.5 transition ${
                      isSelected
                        ? 'bg-cyan-400 text-black shadow-[0_0_10px_rgba(34,211,238,0.4)]'
                        : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <span>#{idx + 1}</span>
                    <span className="max-w-[120px] truncate">{cand.label}</span>
                    <span className="opacity-80">({Math.round(cand.confidence * 100)}%)</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center space-x-3 text-[10px] text-zinc-400 uppercase tracking-wider">
              <span>Light: <strong className="text-emerald-400">{analysisResult.clutterMetrics.lightingStatus}</strong></span>
              <span>Density: <strong className="text-amber-400">{analysisResult.clutterMetrics.clutterDensity}%</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Proximity "Hot / Cold" Indicator Meter Bar */}
      <div className="bg-zinc-900 border-2 border-zinc-800 p-4 flex flex-col space-y-2 font-mono">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Crosshair className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">PROXIMITY RADAR:</span>
            <span className="text-zinc-400 text-[11px] uppercase">
              {proximityScore > 0.8
                ? '🔥 VERY HOT - DIRECT ALIGNMENT'
                : proximityScore > 0.5
                ? '⚡ WARMER - CLOSING IN'
                : proximityScore > 0.2
                ? '❄️ COLD - SWEEP FIELD'
                : '🔍 SEARCHING'}
            </span>
          </div>
          <span className="font-bold text-cyan-400 text-[11px]">{Math.round(proximityScore * 100)}% ALIGNED</span>
        </div>

        {/* Dynamic Gradient Meter Track */}
        <div className="w-full h-3 bg-black overflow-hidden p-0.5 border border-zinc-800 relative">
          <div
            className="h-full transition-all duration-200 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
            style={{ width: `${Math.max(4, proximityScore * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
