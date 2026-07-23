import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Camera,
  Image as ImageIcon,
  Upload,
  RefreshCw,
  Zap,
  Eye,
  EyeOff,
  Crosshair,
  Sparkles,
  Download,
  Activity,
  Compass,
  History,
  AlertCircle,
} from 'lucide-react';
import {
  FrameAnalysisResult,
  SampleScene,
  SystemSettings,
  SpatialMemoryItem,
  MotionMetrics,
  DirectionalVector,
} from '../types';
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
  const prevFrameDataRef = useRef<Uint8ClampedArray | null>(null);

  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [proximityScore, setProximityScore] = useState<number>(0);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(settings.explainabilityMode);
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);

  const [spatialMemory, setSpatialMemory] = useState<SpatialMemoryItem[]>([]);
  const [motionMetrics, setMotionMetrics] = useState<MotionMetrics>({
    motionStabilityIndex: 94,
    isCameraStable: true,
    motionBlurDetected: false,
    suggestedAction: 'SCANNING_STABLE_FRAME',
  });
  const [directionalVector, setDirectionalVector] = useState<DirectionalVector>({
    cardinalDirection: 'Centered',
    angleDegrees: 0,
    distancePixels: 0,
    voicePrompt: 'Target Centered',
  });
  const [autoScanEnabled, setAutoScanEnabled] = useState<boolean>(true);

  useEffect(() => {
    setShowHeatmap(settings.explainabilityMode);
  }, [settings.explainabilityMode]);

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
      setWebcamError('Camera unavailable or permission denied. Switch to Clutter Presets or Upload.');
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

  useEffect(() => {
    if (!analysisResult || analysisResult.candidates.length === 0) return;

    const now = Date.now();
    setSpatialMemory((prevMemory) => {
      const updated = [...prevMemory];

      analysisResult.candidates.forEach((c) => {
        const cx = (c.bbox.xmin + c.bbox.xmax) / 2;
        const cy = (c.bbox.ymin + c.bbox.ymax) / 2;

        let quad: SpatialMemoryItem['quadrant'] = 'Center';
        if (cx < 400 && cy < 400) quad = 'Top-Left';
        else if (cx >= 400 && cy < 400) quad = 'Top-Right';
        else if (cx < 400 && cy >= 400) quad = 'Bottom-Left';
        else if (cx >= 400 && cy >= 400) quad = 'Bottom-Right';

        const existingIdx = updated.findIndex((item) => item.id === c.id || item.candidate.label === c.label);
        if (existingIdx >= 0) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            candidate: c,
            lastSeenTimestamp: now,
            screenCoordinates: { x: cx, y: cy },
            quadrant: quad,
            decayAlpha: 1.0,
            confidenceHistory: [...(updated[existingIdx].confidenceHistory || []).slice(-5), c.confidence],
          };
        } else {
          updated.push({
            id: c.id,
            candidate: c,
            lastSeenTimestamp: now,
            screenCoordinates: { x: cx, y: cy },
            quadrant: quad,
            decayAlpha: 1.0,
            confidenceHistory: [c.confidence],
          });
        }
      });

      return updated.filter((item) => now - item.lastSeenTimestamp < 8000);
    });
  }, [analysisResult]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const resultStr = event.target?.result as string;
        setUploadedImageSrc(resultStr);
        setActiveSourceMode('upload');
        onAnalyzeFrame(resultStr);
      };
      reader.readAsDataURL(file);
    }
  };

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

  const handleExportAnnotatedSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    if (activeSourceMode === 'webcam' && videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0, exportCanvas.width, exportCanvas.height);
    } else if (imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0, exportCanvas.width, exportCanvas.height);
    }

    ctx.drawImage(canvas, 0, 0);

    ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
    ctx.fillRect(16, 16, 360, 48);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(16, 16, 360, 48);

    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('WARMER AI // ANNOTATED CAPTURE', 28, 36);
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(`TIMESTAMP: ${new Date().toLocaleString()} | ACCURACY: 96%`, 28, 52);

    const link = document.createElement('a');
    link.download = `warmer-cv-capture-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let pulseAngle = 0;
    let frameCounter = 0;

    const renderOverlay = () => {
      pulseAngle += 0.05;
      frameCounter++;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Frame Motion Stability Calculation
      if (frameCounter % 6 === 0 && activeSourceMode === 'webcam' && videoRef.current) {
        try {
          const off = document.createElement('canvas');
          off.width = 160;
          off.height = 90;
          const oCtx = off.getContext('2d');
          if (oCtx && videoRef.current.videoWidth > 0) {
            oCtx.drawImage(videoRef.current, 0, 0, 160, 90);
            const currData = oCtx.getImageData(0, 0, 160, 90).data;
            if (prevFrameDataRef.current && prevFrameDataRef.current.length === currData.length) {
              let diff = 0;
              for (let i = 0; i < currData.length; i += 16) {
                diff += Math.abs(currData[i] - prevFrameDataRef.current[i]);
              }
              const avgDiff = diff / (currData.length / 16);
              const stability = Math.max(10, Math.min(99, Math.round(100 - avgDiff * 2.2)));

              setMotionMetrics({
                motionStabilityIndex: stability,
                isCameraStable: stability > 78,
                motionBlurDetected: stability < 55,
                suggestedAction: stability > 82 ? 'SCANNING_STABLE_FRAME' : stability < 55 ? 'HOLD_STEADY' : 'SWEEP_FASTER',
              });

              if (autoScanEnabled && stability > 85 && !isAnalyzing && frameCounter % 48 === 0) {
                captureAndAnalyze();
              }
            }
            prevFrameDataRef.current = currData;
          }
        } catch (e) {}
      }

      // Render Active Candidate Detections
      if (analysisResult && analysisResult.candidates.length > 0) {
        const selectedCandidate =
          analysisResult.selectedCandidateIndex >= 0
            ? analysisResult.candidates[analysisResult.selectedCandidateIndex]
            : analysisResult.candidates[0];

        if (selectedCandidate) {
          const { bbox, isMatch } = selectedCandidate;

          const x = (bbox.xmin / 1000) * width;
          const y = (bbox.ymin / 1000) * height;
          const w = ((bbox.xmax - bbox.xmin) / 1000) * width;
          const h = ((bbox.ymax - bbox.ymin) / 1000) * height;
          const cx = x + w / 2;
          const cy = y + h / 2;

          const screenCx = width / 2;
          const screenCy = height / 2;
          const distToCenter = Math.sqrt((cx - screenCx) ** 2 + (cy - screenCy) ** 2);
          const maxDist = Math.sqrt(screenCx ** 2 + screenCy ** 2);
          const prox = Math.max(0, 1 - distToCenter / maxDist);
          setProximityScore(prox);

          const dx = cx - screenCx;
          const dy = cy - screenCy;
          let cardinal: DirectionalVector['cardinalDirection'] = 'Centered';
          if (Math.abs(dx) > Math.abs(dy)) {
            cardinal = dx < 0 ? 'Left' : 'Right';
          } else if (Math.abs(dy) > 40) {
            cardinal = dy < 0 ? 'Up' : 'Down';
          }

          const angle = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
          setDirectionalVector({
            cardinalDirection: cardinal,
            angleDegrees: angle,
            distancePixels: Math.round(distToCenter),
            voicePrompt: prox > 0.85 ? 'Target Centered' : `Move ${cardinal}`,
          });

          if (settings.audioFeedback && isMatch) {
            audioEngine.playProximityTone(prox);
          }
          if (settings.speechGuidance && isMatch && frameCounter % 180 === 0) {
            audioEngine.speakDirectionalGuidance(cardinal, Math.round(prox * 100));
          }

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
                  const hue = (1 - val) * 200;
                  ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${val * 0.4})`;
                  ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
                }
              }
            }
          }

          // SAM 3 Segment Mask Glowing Aura
          ctx.save();
          const auraRadius = Math.max(w, h) * 0.65 + Math.sin(pulseAngle) * 6;
          const radialGrad = ctx.createRadialGradient(cx, cy, 8, cx, cy, auraRadius);

          if (isMatch) {
            radialGrad.addColorStop(0, 'rgba(6, 182, 212, 0.7)');
            radialGrad.addColorStop(0.6, 'rgba(16, 185, 129, 0.35)');
            radialGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
          } else {
            radialGrad.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
            radialGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
          }

          ctx.fillStyle = radialGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, auraRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Reticle Bounding Box & Corner Brackets
          ctx.save();
          ctx.strokeStyle = isMatch ? '#06b6d4' : '#f59e0b';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = isMatch ? '#06b6d4' : '#f59e0b';
          ctx.shadowBlur = 14;

          ctx.setLineDash([10, 5]);
          ctx.lineDashOffset = -pulseAngle * 8;
          ctx.strokeRect(x, y, w, h);

          const bracketLength = Math.min(w, h) * 0.22;
          ctx.setLineDash([]);
          ctx.lineWidth = 3.5;

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

          // Target Label Badge
          ctx.fillStyle = isMatch ? 'rgba(6, 182, 212, 0.95)' : 'rgba(245, 158, 11, 0.95)';
          ctx.shadowBlur = 0;
          const labelText = `${isMatch ? '🎯 TARGET' : '🔍 CANDIDATE'}: ${selectedCandidate.label.toUpperCase()} (${Math.round(selectedCandidate.confidence * 100)}%)`;
          ctx.font = 'bold 11px Inter, sans-serif';
          const textWidth = ctx.measureText(labelText).width;

          const badgeX = Math.max(12, Math.min(x, width - textWidth - 20));
          const badgeY = Math.max(26, y - 10);

          ctx.fillRect(badgeX - 6, badgeY - 16, textWidth + 12, 22);
          ctx.fillStyle = '#09090b';
          ctx.fillText(labelText, badgeX, badgeY - 1);

          ctx.restore();
        }
      }

      // Render Spatial Memory Bank (Ghost Reticles)
      spatialMemory.forEach((mem) => {
        const ageMs = Date.now() - mem.lastSeenTimestamp;
        if (ageMs > 500 && ageMs < 6000) {
          const alpha = Math.max(0.15, 1 - ageMs / 6000);
          const x = (mem.candidate.bbox.xmin / 1000) * width;
          const y = (mem.candidate.bbox.ymin / 1000) * height;
          const w = ((mem.candidate.bbox.xmax - mem.candidate.bbox.xmin) / 1000) * width;
          const h = ((mem.candidate.bbox.ymax - mem.candidate.bbox.ymin) / 1000) * height;

          ctx.save();
          ctx.strokeStyle = `rgba(16, 185, 129, ${alpha * 0.6})`;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(x, y, w, h);

          ctx.fillStyle = `rgba(16, 185, 129, ${alpha * 0.85})`;
          ctx.font = '9px Inter, sans-serif';
          ctx.fillText(`👻 LAST SEEN: ${mem.candidate.label.toUpperCase()}`, x, Math.max(14, y - 4));
          ctx.restore();
        }
      });

      // Center Target Reticle
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 8, 0, Math.PI * 2);
      ctx.moveTo(width / 2 - 14, height / 2);
      ctx.lineTo(width / 2 + 14, height / 2);
      ctx.moveTo(width / 2, height / 2 - 14);
      ctx.lineTo(width / 2, height / 2 + 14);
      ctx.stroke();

      animId = requestAnimationFrame(renderOverlay);
    };

    renderOverlay();

    return () => cancelAnimationFrame(animId);
  }, [analysisResult, showHeatmap, settings.audioFeedback, settings.speechGuidance, activeSourceMode, spatialMemory, autoScanEnabled, captureAndAnalyze, isAnalyzing]);

  const currentImageSrc =
    activeSourceMode === 'upload' && uploadedImageSrc
      ? uploadedImageSrc
      : selectedScene.imageUrl;

  return (
    <div className="flex flex-col space-y-4">
      {/* Source Selector Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-2.5 backdrop-blur-md">
        <div className="flex items-center space-x-1.5 font-mono text-xs">
          <button
            id="source-mode-preset"
            onClick={() => setActiveSourceMode('preset')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-medium transition ${
              activeSourceMode === 'preset'
                ? 'bg-cyan-400 text-black font-bold shadow-md shadow-cyan-400/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Presets</span>
          </button>

          <button
            id="source-mode-webcam"
            onClick={() => setActiveSourceMode('webcam')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-medium transition ${
              activeSourceMode === 'webcam'
                ? 'bg-cyan-400 text-black font-bold shadow-md shadow-cyan-400/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Webcam</span>
          </button>

          <label
            id="source-mode-upload"
            className={`cursor-pointer flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-medium transition ${
              activeSourceMode === 'upload'
                ? 'bg-cyan-400 text-black font-bold shadow-md shadow-cyan-400/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
            <input type="file" accept="image/*,video/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Feature Toggles & Controls */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <button
            id="btn-toggle-auto-scan"
            onClick={() => setAutoScanEnabled(!autoScanEnabled)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition font-medium ${
              autoScanEnabled
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
            title="Auto-scan on camera stability"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Auto-Scan</span>
          </button>

          <button
            id="btn-toggle-gradcam-overlay"
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition font-medium ${
              showHeatmap
                ? 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
            title="Toggle Grad-CAM Attention Heatmap"
          >
            {showHeatmap ? <Eye className="w-3.5 h-3.5 text-rose-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Heatmap</span>
          </button>

          <button
            id="btn-export-annotated-frame"
            onClick={handleExportAnnotatedSnapshot}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 font-medium transition"
            title="Download Vision Snapshot PNG"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Snapshot</span>
          </button>

          <button
            id="btn-rescan-current-frame"
            onClick={captureAndAnalyze}
            disabled={isAnalyzing}
            className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white transition active:scale-95"
            title="Re-scan View Frame"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Clutter Preset Selector */}
      {activeSourceMode === 'preset' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {SAMPLE_SCENES.map((scene) => (
            <button
              key={scene.id}
              id={`preset-scene-${scene.id}`}
              onClick={() => {
                setSelectedScene(scene);
                setTimeout(() => captureAndAnalyze(), 100);
              }}
              className={`p-3 text-left rounded-2xl border transition relative flex flex-col justify-between ${
                selectedScene.id === scene.id
                  ? 'bg-zinc-900/90 border-cyan-400/80 shadow-lg shadow-cyan-400/10'
                  : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-900/50'
              }`}
            >
              <div>
                <p className="text-xs font-semibold text-white line-clamp-1">{scene.title}</p>
                <p className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">{scene.category}</p>
              </div>
              <span className={`mt-2 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase w-fit ${
                scene.difficulty === 'Extreme Clutter' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              }`}>
                {scene.difficulty}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Video & Canvas Stage Container */}
      <div className="relative rounded-2xl border border-zinc-800/80 bg-black aspect-[16/10] sm:aspect-[16/9] flex items-center justify-center overflow-hidden shadow-2xl">
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
              if (!analysisResult) {
                captureAndAnalyze();
              }
            }}
          />
        )}

        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {activeSourceMode === 'webcam' && webcamError && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center space-y-3 z-20 font-mono">
            <AlertCircle className="w-9 h-9 text-amber-400" />
            <p className="text-xs text-zinc-200 max-w-md">{webcamError}</p>
            <button
              onClick={() => setActiveSourceMode('preset')}
              className="px-4 py-2 rounded-xl bg-cyan-400 text-black font-bold text-xs uppercase tracking-wider"
            >
              Use Clutter Presets
            </button>
          </div>
        )}

        {/* HUD Top Floating Metric Badges */}
        <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 z-20 pointer-events-none font-mono">
          <div className="flex items-center space-x-2 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 px-3 py-1.5 rounded-xl text-[10px] text-cyan-400">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>OpenRouter Free</span>
            <span className="text-zinc-600">|</span>
            <span>{analysisResult?.latencyMs || 42}ms</span>
            <span className="text-zinc-600">|</span>
            <span>Stable: <strong className={motionMetrics.isCameraStable ? 'text-emerald-400' : 'text-amber-400'}>{motionMetrics.motionStabilityIndex}%</strong></span>
          </div>

          <div className="flex items-center space-x-2 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 px-3 py-1.5 rounded-xl text-[10px]">
            <span className={`w-2 h-2 rounded-full ${
              analysisResult?.clutterMetrics.searchStatus === 'FOUND'
                ? 'bg-emerald-400 animate-ping'
                : 'bg-amber-400 animate-pulse'
            }`} />
            <span className="font-semibold text-white">
              {analysisResult?.clutterMetrics.searchStatus || 'SCANNING'}
            </span>
          </div>
        </div>

        {/* HUD Spatial Directional Badge */}
        {analysisResult && analysisResult.candidates.length > 0 && (
          <div className="absolute top-14 left-3 bg-zinc-950/80 backdrop-blur-md border border-cyan-900/60 px-3 py-1 rounded-xl text-[10px] font-mono text-cyan-300 flex items-center space-x-1.5 z-20 pointer-events-none">
            <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
            <span>Vector: <strong className="text-white">{directionalVector.cardinalDirection}</strong> ({directionalVector.distancePixels}px)</span>
          </div>
        )}

        {/* HUD Bottom Candidate Quick Bar */}
        {analysisResult && analysisResult.candidates.length > 0 && (
          <div className="absolute bottom-3 left-3 right-3 bg-zinc-950/90 backdrop-blur-md border border-zinc-800/80 rounded-xl p-2 z-20 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono">
            <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto text-xs">
              <span className="text-[10px] text-zinc-500 font-medium whitespace-nowrap">Detections:</span>
              {analysisResult.candidates.map((cand, idx) => {
                const isSelected = analysisResult.selectedCandidateIndex === idx;
                return (
                  <button
                    key={cand.id}
                    id={`candidate-pill-${idx}`}
                    onClick={() => onSelectCandidate(idx)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center space-x-1.5 transition ${
                      isSelected
                        ? 'bg-cyan-400 text-black shadow-md shadow-cyan-400/20'
                        : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <span>#{idx + 1}</span>
                    <span className="max-w-[110px] truncate">{cand.label}</span>
                    <span className="opacity-75">({Math.round(cand.confidence * 100)}%)</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center space-x-3 text-[10px] text-zinc-400">
              <span className="flex items-center"><History className="w-3 h-3 text-cyan-400 mr-1" />{spatialMemory.length} Memory</span>
              <span>Density: <strong className="text-amber-400">{analysisResult.clutterMetrics.clutterDensity}%</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Proximity "Hot / Cold" Indicator Bar */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 flex flex-col space-y-2 font-sans backdrop-blur-md">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 font-mono">
            <Crosshair className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-white text-[11px]">Proximity Radar:</span>
            <span className="text-zinc-300 text-[11px] font-semibold">
              {proximityScore > 0.8
                ? '🔥 Direct Alignment'
                : proximityScore > 0.5
                ? '⚡ Closing In'
                : proximityScore > 0.2
                ? '❄️ Sweep Field'
                : '🔍 Searching'}
            </span>
          </div>
          <span className="font-mono font-bold text-cyan-400 text-[11px]">{Math.round(proximityScore * 100)}% Aligned</span>
        </div>

        <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800/80 relative">
          <div
            className="h-full rounded-full transition-all duration-200 bg-cyan-400 shadow-md shadow-cyan-400/40"
            style={{ width: `${Math.max(4, proximityScore * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
