export interface BoundingBox {
  ymin: number; // 0-1000 or 0-1 normalized
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface DetectionCandidate {
  id: string;
  label: string;
  concept: string;
  confidence: number;
  bbox: BoundingBox;
  polygon?: [number, number][]; // Normalized [x, y] coordinates 0-100
  color: string;
  isMatch: boolean;
  disambiguationNote?: string;
  visualTraits?: {
    color?: string;
    material?: string;
    distinguishingFeature?: string;
  };
}

export interface QueryBreakdown {
  rawQuery: string;
  targetConcept: string;
  negativeConstraints: string[];
  attributes: {
    color?: string;
    size?: string;
    material?: string;
    brand?: string;
    context?: string;
  };
}

export interface ExplainabilityData {
  heatmapMatrix: number[][]; // 8x8 or 12x12 grid of attention weights 0-1
  primaryFeatures: string[];
  keyRegions: { name: string; relevance: number }[];
  gradCamSummary: string;
}

export interface ClutterMetrics {
  lightingScore: number; // 0-100
  lightingStatus: 'Optimal' | 'Sub-optimal' | 'Low Light';
  clutterDensity: number; // 0-100
  occlusionRatio: number; // 0-100
  motionBlurScore: number; // 0-100
  searchStatus: 'SEARCHING' | 'FOUND' | 'MULTIPLE_CANDIDATES' | 'AMBIGUOUS' | 'NOT_FOUND';
}

export interface FrameAnalysisResult {
  timestamp: number;
  candidates: DetectionCandidate[];
  selectedCandidateIndex: number;
  queryBreakdown: QueryBreakdown;
  explainability: ExplainabilityData;
  clutterMetrics: ClutterMetrics;
  latencyMs: number;
  samInferenceMs: number;
  vlmReasoningMs: number;
  modelUsed: string;
}

export interface SampleScene {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  defaultQuery: string;
  difficulty: 'Easy' | 'Medium' | 'Extreme Clutter';
}

export interface SystemSettings {
  confidenceThreshold: number; // 0.3 to 0.95
  explainabilityMode: boolean; // Grad-CAM heatmap overlay
  audioFeedback: boolean; // Hot/cold chime sound
  speechGuidance: boolean; // Voice direction
  highContrastMode: boolean; // Low-vision accessibility
  motionGatedFps: number; // 15, 30, 60
  showHudMetrics: boolean;
  modelBackend: 'SAM3_GPU' | 'SAM3_1_REALTIME' | 'HYBRID_VLM';
}

export interface FailureCase {
  id: string;
  title: string;
  category: 'Occlusion' | 'Reflections & Glare' | 'Mass Production Duplicates' | 'Low Contrast' | 'Motion Blur';
  scenario: string;
  imageUrl: string;
  whyItFailed: string;
  systemMitigation: string;
  lessonLearned: string;
}

export interface QueryParseResult {
  rawQuery: string;
  targetConcept: string;
  negativeConstraints: string[];
  attributes: {
    color?: string;
    size?: string;
    material?: string;
    brand?: string;
    context?: string;
  };
  searchStrategy: string;
  suggestedPreset?: string;
}

export interface DisambiguationRequest {
  imageBase64: string;
  query: string;
  candidates: DetectionCandidate[];
  userContext?: string;
}

export interface DisambiguationResponse {
  winningCandidateId: string | null;
  confidenceScore: number;
  reasoning: string;
  comparisonMatrix: {
    candidateId: string;
    label: string;
    distinguishingTraits: string[];
    matchScore: number;
    exclusionReason?: string;
  }[];
  userActionRequired: boolean;
  clarifyingQuestion?: string;
}

export interface BackendHealthStatus {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  timestamp: string;
  openRouterApiKeyConfigured?: boolean;
  geminiApiKeyConfigured: boolean;
  activeModel: string;
  sam3Status: string;
  latencyBenchmarkMs: number;
  uptimeSeconds: number;
}

export interface SpatialMemoryItem {
  id: string;
  candidate: DetectionCandidate;
  lastSeenTimestamp: number;
  screenCoordinates: { x: number; y: number };
  quadrant: 'Top-Left' | 'Top-Right' | 'Bottom-Left' | 'Bottom-Right' | 'Center';
  decayAlpha: number; // 0 to 1 opacity decay over time
  confidenceHistory: number[];
}

export interface MotionMetrics {
  motionStabilityIndex: number; // 0-100% stability score
  isCameraStable: boolean;
  motionBlurDetected: boolean;
  suggestedAction: 'SWEEP_FASTER' | 'HOLD_STEADY' | 'SCANNING_STABLE_FRAME';
}

export interface DirectionalVector {
  cardinalDirection: 'Left' | 'Right' | 'Up' | 'Down' | 'Centered';
  angleDegrees: number;
  distancePixels: number;
  voicePrompt: string;
}


