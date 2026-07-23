import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, Image as ImageIcon, Upload, RefreshCw, AlertCircle, Share2 } from 'lucide-react';
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
  const [proximityScore, setProximityScore] = useState<number>(0);
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [foundStateLabel, setFoundStateLabel] = useState<string | null>(null);
  const [hasTriggeredFoundChime, setHasTriggeredFoundChime] = useState<boolean>(false);

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
      setWebcamError('Camera unavailable. Switch to Presets or Upload.');
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
        onAnalyzeFrame(offscreen.toDataURL('image/jpeg', 0.85));
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
        onAnalyzeFrame(offscreen.toDataURL('image/jpeg', 0.85));
      }
    }
  }, [activeSourceMode, isWebcamActive, uploadedImageSrc, onAnalyzeFrame]);

  // Main Canvas & Glow Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let pulseAngle = 0;

    const renderOverlay = () => {
      pulseAngle += 0.04;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (analysisResult && analysisResult.candidates.length > 0) {
        const candidate =
          analysisResult.selectedCandidateIndex >= 0
            ? analysisResult.candidates[analysisResult.selectedCandidateIndex]
            : analysisResult.candidates[0];

        if (candidate && candidate.isMatch) {
          const { bbox } = candidate;
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

          // Trigger "Found it." state & chime on first lock
          if (!hasTriggeredFoundChime) {
            setHasTriggeredFoundChime(true);
            setFoundStateLabel('Found it.');
            if (settings.audioFeedback) {
              audioEngine.playFoundChord();
            }
            setTimeout(() => {
              setFoundStateLabel(`${candidate.label} · found`);
            }, 1200);
          }

          // Audio Proximity Chime
          if (settings.audioFeedback) {
            audioEngine.playProximityTone(prox);
          }

          // Glow Spec (§4): Radial bloom around detected region
          ctx.save();
          const baseRadius = Math.max(w, h) * 0.7;
          const breath = Math.sin(pulseAngle) * (baseRadius * 0.08);
          const auraRadius = baseRadius + breath;

          const radialGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, auraRadius);
          
          if (prox < 0.3) {
            radialGrad.addColorStop(0, 'rgba(122, 62, 36, 0.6)');
            radialGrad.addColorStop(1, 'rgba(122, 62, 36, 0)');
          } else {
            const glowAlpha = 0.5 + prox * 0.45;
            radialGrad.addColorStop(0, `rgba(255, 122, 61, ${glowAlpha})`);
            radialGrad.addColorStop(0.7, `rgba(255, 122, 61, ${glowAlpha * 0.3})`);
            radialGrad.addColorStop(1, 'rgba(255, 122, 61, 0)');
          }

          ctx.fillStyle = radialGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, auraRadius, 0, Math.PI * 2);
          ctx.fill();

          // Subtle Outline
          ctx.strokeStyle = prox > 0.3 ? '#FF7A3D' : '#7A3E24';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x, y, w, h);

          ctx.restore();
        }
      } else {
        setHasTriggeredFoundChime(false);
        setFoundStateLabel(null);
        setProximityScore(0);
      }

      animId = requestAnimationFrame(renderOverlay);
    };

    renderOverlay();
    return () => cancelAnimationFrame(animId);
  }, [analysisResult, settings.audioFeedback, hasTriggeredFoundChime]);

  const currentImageSrc =
    activeSourceMode === 'upload' && uploadedImageSrc
      ? uploadedImageSrc
      : selectedScene.imageUrl;

  const currentQuery = analysisResult?.queryBreakdown.rawQuery || 'Searching...';
  const isMatchFound = analysisResult?.clutterMetrics.searchStatus === 'FOUND';

  return (
    <div className="space-y-4 font-sans max-w-4xl mx-auto">
      {/* Source Selector Toolbar */}
      <div className="flex items-center justify-between bg-[#151517] p-1.5 rounded-xl border border-[rgba(245,245,243,0.08)] text-xs text-[#A3A3A0]">
        <div className="flex items-center space-x-1 font-medium">
          <button
            onClick={() => setActiveSourceMode('preset')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              activeSourceMode === 'preset' ? 'bg-[#F5F5F3] text-[#0A0A0B] font-semibold' : 'hover:text-[#F5F5F3]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Presets</span>
          </button>

          <button
            onClick={() => setActiveSourceMode('webcam')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              activeSourceMode === 'webcam' ? 'bg-[#F5F5F3] text-[#0A0A0B] font-semibold' : 'hover:text-[#F5F5F3]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Live Camera</span>
          </button>

          <label className="cursor-pointer flex items-center space-x-1.5 px-3 py-1.5 rounded-lg hover:text-[#F5F5F3] transition">
            <Upload className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Upload</span>
            <input type="file" accept="image/*,video/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        <button
          onClick={captureAndAnalyze}
          disabled={isAnalyzing}
          className="p-1.5 rounded-lg text-[#A3A3A0] hover:text-[#F5F5F3] transition"
          title="Re-scan"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} strokeWidth={1.5} />
        </button>
      </div>

      {/* Preset Selector Chips */}
      {activeSourceMode === 'preset' && (
        <div className="flex items-center space-x-2 overflow-x-auto text-xs no-scrollbar">
          {SAMPLE_SCENES.map((scene) => (
            <button
              key={scene.id}
              onClick={() => {
                setSelectedScene(scene);
                setTimeout(() => captureAndAnalyze(), 100);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition whitespace-nowrap ${
                selectedScene.id === scene.id
                  ? 'bg-[#151517] border-[rgba(245,245,243,0.24)] text-[#F5F5F3]'
                  : 'bg-[#0A0A0B] border-[rgba(245,245,243,0.08)] text-[#A3A3A0] hover:text-[#F5F5F3]'
              }`}
            >
              {scene.title}
            </button>
          ))}
        </div>
      )}

      {/* Full-Bleed Camera Viewing Stage */}
      <div className="relative rounded-28px rounded-3xl overflow-hidden bg-[#0A0A0B] aspect-[16/10] sm:aspect-[16/9] border border-[rgba(245,245,243,0.08)] shadow-2xl flex items-center justify-center">
        {activeSourceMode === 'webcam' ? (
          <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
        ) : (
          <img
            ref={imageRef}
            src={currentImageSrc}
            alt="Clutter View"
            crossOrigin="anonymous"
            className="w-full h-full object-cover"
            onLoad={() => {
              if (!analysisResult) captureAndAnalyze();
            }}
          />
        )}

        <canvas ref={canvasRef} width={800} height={450} className="absolute inset-0 w-full h-full pointer-events-none z-10" />

        {/* Top-Safe Area Scrim Gradient & Query Header */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-[rgba(10,10,11,0.85)] to-transparent pointer-events-none z-20 flex items-start justify-center pt-4">
          <span className="text-xs text-[#A3A3A0] font-normal tracking-wide">
            {currentQuery}
          </span>
        </div>

        {/* Webcam Error Warning */}
        {activeSourceMode === 'webcam' && webcamError && (
          <div className="absolute inset-0 bg-[#0A0A0B]/90 flex flex-col items-center justify-center p-6 text-center space-y-3 z-30">
            <AlertCircle className="w-8 h-8 text-[#A3A3A0]" strokeWidth={1.5} />
            <p className="text-xs text-[#A3A3A0] max-w-sm">{webcamError}</p>
            <button
              onClick={() => setActiveSourceMode('preset')}
              className="px-4 py-2 rounded-xl bg-[#151517] text-[#F5F5F3] text-xs font-medium"
            >
              Use Presets
            </button>
          </div>
        )}

        {/* Bottom State Indicator Dot & "Found it." Confirmation Label (§3.4, §3.5) */}
        <div className="absolute bottom-6 inset-x-0 flex flex-col items-center justify-center space-y-2 z-20 pointer-events-none">
          {/* Found Confirmation Label */}
          {foundStateLabel && (
            <span className="text-sm font-medium text-[#F5F5F3] tracking-tight bg-[#151517]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[rgba(245,245,243,0.08)] transition-all">
              {foundStateLabel}
            </span>
          )}

          {/* 8px State Indicator Dot */}
          <div
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              isMatchFound
                ? 'bg-[#FF7A3D] shadow-[0_0_12px_#FF7A3D]'
                : 'bg-[#A3A3A0] animate-breathe'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
