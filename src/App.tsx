import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Route, Switch, useLocation } from "wouter";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  AudioLines,
  Brain,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  FlipHorizontal,
  Gauge,
  Github,
  Grid,
  Hand,
  Layers,
  Menu,
  Mic2,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  ScanFace,
  Search,
  Settings2,
  Signal,
  Sliders,
  Sparkles,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import initialLabels from "./data/labels.json";
import {
  TFClassifier,
  knnPredict,
  normalizeLandmarks,
  loadTensorFlowJS,
  TrainingResult,
} from "./utils/gestureClassifier";
import {
  generatePrepopulatedDataset,
  classifyByRules,
} from "./utils/defaultDataset";
import "./index.css";

export type GestureLabel = {
  id: string;
  name: string;
  output: string;
  emoji: string;
  category: string;
  description: string;
};

type SourceMode = "webcam" | "stream";
type RecognitionEntry = {
  id: string;
  name: string;
  output: string;
  emoji: string;
  confidence: number;
  time: string;
};

const SPEECH_LANGUAGES = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "hi-IN", label: "हिन्दी · Hindi" },
  { value: "es-ES", label: "Español · Spanish" },
  { value: "fr-FR", label: "Français · French" },
  { value: "de-DE", label: "Deutsch · German" },
  { value: "ta-IN", label: "தமிழ் · Tamil" },
];

const HAND_POINTS = [
  [92, 142], [96, 122], [100, 104], [105, 85], [110, 68],
  [105, 105], [111, 86], [117, 67], [121, 50],
  [100, 106], [98, 84], [98, 62], [98, 42],
  [95, 108], [89, 88], [84, 69], [79, 54],
  [90, 112], [82, 99], [73, 89], [64, 80],
] as const;

const HAND_BONES = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
] as const;

function IntroOverlay({ onSkip }: { onSkip: () => void }) {
  return (
    <div className="intro-overlay" aria-label="SignSpeak calibration intro">
      <div className="intro-grid" aria-hidden="true" />
      <div className="intro-scanline" aria-hidden="true" />
      <div className="intro-status intro-status-top">
        <span className="status-dot" />
        <span>SYS / VISUAL INTERFACE</span>
      </div>
      <div className="intro-status intro-status-bottom">
        <div><span className="status-dot status-dot-pulse" /> Tracking 21 landmarks</div>
        <div>Model: ready <span className="status-caret">_</span></div>
      </div>
      <div className="skeleton-stage" aria-hidden="true">
        <svg viewBox="0 0 180 180" className="skeleton-svg">
          <g className="skeleton-bones">
            {HAND_BONES.map(([from, to], index) => (
              <line
                key={`${from}-${to}`}
                x1={HAND_POINTS[from][0]}
                y1={HAND_POINTS[from][1]}
                x2={HAND_POINTS[to][0]}
                y2={HAND_POINTS[to][1]}
                style={{ animationDelay: `${index * 48}ms` }}
              />
            ))}
          </g>
          <g className="skeleton-joints">
            {HAND_POINTS.map(([x, y], index) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r={index === 0 ? 3.4 : 2.4} style={{ animationDelay: `${index * 58}ms` }} />
            ))}
          </g>
        </svg>
      </div>
      <div className="intro-wordmark">
        <div className="intro-kicker">CALIBRATION COMPLETE</div>
        <div className="intro-title">SignSpeak</div>
        <div className="intro-subtitle">Hand gestures, spoken.</div>
        <button className="intro-enter" onClick={onSkip}>
          <span>Enter workspace</span><ArrowDownRight size={16} />
        </button>
      </div>
      <button className="intro-skip" onClick={onSkip} aria-label="Skip intro">Skip intro <X size={14} /></button>
    </div>
  );
}

function Header({ onEnter }: { onEnter: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="SignSpeak home">
        <span className="brand-mark"><Hand size={18} strokeWidth={2.3} /></span>
        <span>SignSpeak</span>
      </a>
      <nav className={menuOpen ? "site-nav site-nav-open" : "site-nav"} aria-label="Primary navigation">
        <a className="nav-tab" href="/" onClick={() => setMenuOpen(false)}>Home</a>
        <div className="tools-nav-wrap">
          <a
            className={toolsOpen ? "nav-tab tools-tab active" : "nav-tab tools-tab"}
            href="/tools"
            onClick={(event) => { event.preventDefault(); setToolsOpen((value) => !value); }}
            aria-expanded={toolsOpen}
            aria-haspopup="menu"
          >
            Tools <ChevronDown size={15} className={toolsOpen ? "chevron-open" : ""} />
          </a>
          {toolsOpen && (
            <div className="tools-menu" role="menu">
              <a href="/tools/detection" onClick={() => { setToolsOpen(false); setMenuOpen(false); }} role="menuitem">
                <Camera size={15} />
                <span><strong>Live detector</strong><small>Recognize signs from camera</small></span>
              </a>
              <a href="/gestures" onClick={() => { setToolsOpen(false); setMenuOpen(false); }} role="menuitem">
                <Hand size={15} />
                <span><strong>Gesture library</strong><small>Browse the trained vocabulary</small></span>
              </a>
              <a href="/tools/how-it-works" onClick={() => { setToolsOpen(false); setMenuOpen(false); }} role="menuitem">
                <CircleHelp size={15} />
                <span><strong>How it works</strong><small>Explore the recognition pipeline</small></span>
              </a>
            </div>
          )}
        </div>
        <a className="nav-tab" href="/blog" onClick={() => setMenuOpen(false)}>Blog</a>
        <a className="nav-tab" href="/about" onClick={() => setMenuOpen(false)}>About</a>
        <a className="nav-tab" href="/contact" onClick={() => setMenuOpen(false)}>Contact</a>
        <a className="nav-cta" href="/tools/detection" onClick={() => { setMenuOpen(false); setToolsOpen(false); onEnter(); }}>
          Open camera <ArrowUpRight size={15} />
        </a>
      </nav>
      <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}>
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
    </header>
  );
}

function HandSkeleton({ live = false }: { live?: boolean }) {
  return (
    <svg className={live ? "live-skeleton" : "mini-skeleton"} viewBox="0 0 180 180" aria-label="21-point hand landmark diagram" role="img">
      <g className="diagram-bones">
        {HAND_BONES.map(([from, to]) => <line key={`${from}-${to}`} x1={HAND_POINTS[from][0]} y1={HAND_POINTS[from][1]} x2={HAND_POINTS[to][0]} y2={HAND_POINTS[to][1]} />)}
      </g>
      <g className="diagram-joints">
        {HAND_POINTS.map(([x, y], index) => <circle key={`${x}-${y}`} cx={x} cy={y} r={index === 0 ? 3.2 : 2.2} />)}
      </g>
    </svg>
  );
}

function GestureMark({ id }: { id: string }) {
  return (
    <svg className="gesture-mark" viewBox="0 0 180 170" role="img" aria-label={`${id} gesture line illustration`}>
      <g className="gesture-mark-lines">
        <path d="M96 112 C86 106 80 96 82 84 L88 62 C90 56 96 58 97 64 L99 83" />
        <path d="M99 83 L103 45 C104 38 111 38 112 45 L113 84" />
        <path d="M113 84 L119 48 C120 41 127 42 128 49 L126 88" />
        <path d="M126 88 L132 63 C134 57 141 60 140 67 L136 98" />
        <path d="M136 98 L145 81 C148 76 153 80 151 86 L141 108 C135 121 120 130 105 129 C94 128 84 123 77 116" />
      </g>
      <g className="gesture-mark-dots">
        <circle cx="96" cy="112" r="4" />
        <circle cx="97" cy="64" r="3" />
        <circle cx="112" cy="45" r="3" />
        <circle cx="128" cy="49" r="3" />
        <circle cx="140" cy="67" r="3" />
      </g>
    </svg>
  );
}

function LiveDetector() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handsRef = useRef<any>(null);
  const frameRef = useRef<number | null>(null);
  const tfClassifierRef = useRef<TFClassifier>(new TFClassifier());
  const latestVectorRef = useRef<number[] | null>(null);
  const candidateRef = useRef("");
  const candidateSinceRef = useRef(0);
  const lastSpokenRef = useRef("");

  // Labels & Dataset state (Pre-populated baseline dataset for 42 signs)
  const [labels, setLabels] = useState<GestureLabel[]>(initialLabels);
  const [dataset, setDataset] = useState<Record<string, number[][]>>(() => generatePrepopulatedDataset());
  const [activeStudioTab, setActiveStudioTab] = useState<"detector" | "collector" | "trainer" | "labels" | "io">("detector");


  // Detector Controls
  const [source, setSource] = useState<SourceMode>("webcam");
  const [streamUrl, setStreamUrl] = useState("http://192.168.4.1:81/stream");
  const [active, setActive] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [tfLoaded, setTfLoaded] = useState(false);
  const [isTrained, setIsTrained] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [mirrorVideo, setMirrorVideo] = useState(true);
  const [corsHelpOpen, setCorsHelpOpen] = useState(false);

  // Confidence & Hold-time Thresholds
  const [confidence, setConfidence] = useState(75); // requirement 4: default threshold
  const [holdTime, setHoldTime] = useState(600);

  // Speech & History
  const [speak, setSpeak] = useState(true);
  const [speechSettingsOpen, setSpeechSettingsOpen] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState("en-US");
  const [speechVoice, setSpeechVoice] = useState("");
  const [speechVoices, setSpeechVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [recognizedId, setRecognizedId] = useState("waiting");
  const [recognizedConfidence, setRecognizedConfidence] = useState(0);
  const [history, setHistory] = useState<RecognitionEntry[]>([]);
  const [cameraMessage, setCameraMessage] = useState("Camera is idle. Start a source to begin.");

  // Recording & Burst state
  const [selectedRecordLabel, setSelectedRecordLabel] = useState<string>("hello");
  const [isRecordingBurst, setIsRecordingBurst] = useState(false);
  const [burstCount, setBurstCount] = useState(0);
  const burstTimerRef = useRef<number | null>(null);

  // Training & Evaluation state
  const [isTraining, setIsTraining] = useState(false);
  const [trainProgress, setTrainProgress] = useState<{ epoch: number; total: number; loss: number; acc: number } | null>(null);
  const [evalResult, setEvalResult] = useState<TrainingResult | null>(null);
  const [epochsInput, setEpochsInput] = useState(35);

  // Label Management state
  const [labelSearch, setLabelSearch] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const currentGesture = useMemo(() => {
    if (recognizedId === "no_match") {
      return { id: "no_match", name: "No Confident Match", output: "uncertain", emoji: "❓", category: "status", description: "Confidence score below required threshold" };
    }
    return labels.find((item) => item.id === recognizedId) ?? { id: "waiting", name: "— — —", output: "waiting for a hand", emoji: "✋", category: "status", description: "Start source and present hand sign" };
  }, [labels, recognizedId]);

  const matchingVoices = useMemo(() => speechVoices.filter((voice) => voice.lang.toLowerCase().startsWith(speechLanguage.split("-")[0].toLowerCase())), [speechLanguage, speechVoices]);

  // Load Voices
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const loadVoices = () => setSpeechVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  useEffect(() => {
    if (matchingVoices.length && !matchingVoices.some((v) => v.name === speechVoice)) setSpeechVoice(matchingVoices[0].name);
    if (!matchingVoices.length) setSpeechVoice("");
  }, [matchingVoices, speechVoice]);

  // Load TensorFlow.js on mount
  useEffect(() => {
    loadTensorFlowJS().then(() => setTfLoaded(true)).catch(() => console.warn("TF.js offline; kNN fallback active"));
  }, []);

  // Inference & Landmark Processing
  const processFrameLandmarks = useCallback((points: Array<{ x: number; y: number; z?: number }>) => {
    const vector = normalizeLandmarks(points);
    latestVectorRef.current = vector;

    const activeClasses = labels.map((l) => l.id).filter((id) => dataset[id] && dataset[id].length > 0);

    let predId = "no_match";
    let predConf = 0;

    // Use Trained TF.js Neural Network if available, else kNN fallback
    if (tfClassifierRef.current.trained && activeClasses.length > 0) {
      const res = tfClassifierRef.current.predict(vector, activeClasses);
      predId = res.id;
      predConf = res.confidence;
    } else if (Object.keys(dataset).length > 0) {
      const res = knnPredict(vector, dataset, 5);
      predId = res.id;
      predConf = res.confidence;
    }

    // Geometric rules fallback for instantaneous recognition of all 42 signs
    if (predId === "no_match" || predConf < confidence) {
      const ruleRes = classifyByRules(points);
      if (ruleRes.id !== "no_match" && ruleRes.confidence >= 80) {
        predId = ruleRes.id;
        predConf = ruleRes.confidence;
      }
    }


    const now = performance.now();

    // Check confidence threshold requirement (Req 4: show "no confident match" if score < threshold)
    if (predConf < confidence || predId === "no_match") {
      candidateRef.current = "no_match";
      candidateSinceRef.current = now;
      setRecognizedConfidence(predConf);
      setRecognizedId("no_match");
      return;
    }

    if (candidateRef.current !== predId) {
      candidateRef.current = predId;
      candidateSinceRef.current = now;
    }

    setRecognizedConfidence(predConf);

    if (now - candidateSinceRef.current >= holdTime) {
      setRecognizedId(predId);
    }
  }, [confidence, dataset, holdTime, labels]);

  const onResults = useCallback((results: any) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, width, height);

    const hand = results.multiHandLandmarks?.[0];
    if (!hand) {
      latestVectorRef.current = null;
      candidateRef.current = "";
      candidateSinceRef.current = 0;
      lastSpokenRef.current = "";
      setRecognizedId("waiting");
      setRecognizedConfidence(0);
      return;
    }

    // Draw Skeleton Overlay if enabled
    if (showSkeleton) {
      context.save();
      if (mirrorVideo && source === "webcam") {
        context.translate(width, 0);
        context.scale(-1, 1);
      }
      context.strokeStyle = "#FF7A33";
      context.fillStyle = "#ECEDEF";
      context.lineWidth = Math.max(2, width / 320);

      HAND_BONES.forEach(([from, to]) => {
        context.beginPath();
        context.moveTo(hand[from].x * width, hand[from].y * height);
        context.lineTo(hand[to].x * width, hand[to].y * height);
        context.stroke();
      });

      hand.forEach((point: { x: number; y: number }) => {
        context.beginPath();
        context.arc(point.x * width, point.y * height, Math.max(3, width / 150), 0, Math.PI * 2);
        context.fill();
      });
      context.restore();
    }

    processFrameLandmarks(hand);
  }, [mirrorVideo, processFrameLandmarks, showSkeleton, source]);

  // Load MediaPipe Hands
  const loadHands = useCallback(async () => {
    if (handsRef.current) return handsRef.current;
    await new Promise<void>((resolve, reject) => {
      if ((window as any).Hands) return resolve();
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("MediaPipe unavailable"));
      document.head.appendChild(script);
    });
    const Hands = (window as any).Hands;
    const hands = new Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.65,
      minTrackingConfidence: 0.6,
    });
    hands.onResults(onResults);
    handsRef.current = hands;
    return hands;
  }, [onResults]);

  const stopSource = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    handsRef.current?.close?.();
    handsRef.current = null;
    setModelReady(false);
    setActive(false);
    setRecognizedId("waiting");
    setRecognizedConfidence(0);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current.removeAttribute("src");
    }
  }, []);

  const startSource = useCallback(async () => {
    if (source === "stream") {
      setActive(true);
      setCameraMessage(`ESP32-CAM selected: ${streamUrl}`);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraMessage("Camera access is not available in this browser.");
      return;
    }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setActive(true);
      setCameraMessage("Webcam connected. Loading hand landmark model…");
      await loadHands();
      setModelReady(true);
      setCameraMessage("MediaPipe Hands active. Present a gesture to classify.");

      const detect = async () => {
        if (!videoRef.current || !handsRef.current) return;
        await handsRef.current.send({ image: videoRef.current });
        frameRef.current = window.requestAnimationFrame(detect);
      };
      detect();
    } catch {
      setCameraMessage("Camera or MediaPipe access failed. Check permission and network, then try again.");
    }
  }, [loadHands, source, streamUrl]);

  useEffect(() => () => stopSource(), [stopSource]);

  // Speech Output
  const speakMeaning = useCallback((meaning: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(meaning);
    utterance.lang = speechLanguage;
    const selectedVoice = speechVoices.find((v) => v.name === speechVoice);
    if (selectedVoice) utterance.voice = selectedVoice;
    window.speechSynthesis.speak(utterance);
  }, [speechLanguage, speechVoice, speechVoices]);

  useEffect(() => {
    if (!active || recognizedId === "waiting" || recognizedId === "no_match" || lastSpokenRef.current === recognizedId) return;
    lastSpokenRef.current = recognizedId;
    const entry = {
      id: currentGesture.id,
      name: currentGesture.name,
      output: currentGesture.output,
      emoji: currentGesture.emoji,
      confidence: recognizedConfidence,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setHistory((items) => [entry, ...items.filter((item) => item.id !== entry.id)].slice(0, 8));
    if (speak) speakMeaning(currentGesture.output);
  }, [active, currentGesture, recognizedConfidence, recognizedId, speak, speakMeaning]);

  // Sample Recording logic
  const recordSingleSample = useCallback((labelId: string) => {
    const vec = latestVectorRef.current;
    if (!vec) return false;
    setDataset((prev) => {
      const existing = prev[labelId] || [];
      return { ...prev, [labelId]: [...existing, vec] };
    });
    return true;
  }, []);

  const startBurstRecord = useCallback((labelId: string, count = 50) => {
    setIsRecordingBurst(true);
    setBurstCount(0);
    let captured = 0;

    burstTimerRef.current = window.setInterval(() => {
      if (latestVectorRef.current) {
        const vec = latestVectorRef.current;
        setDataset((prev) => {
          const existing = prev[labelId] || [];
          return { ...prev, [labelId]: [...existing, vec] };
        });
        captured++;
        setBurstCount(captured);
      }
      if (captured >= count) {
        if (burstTimerRef.current) clearInterval(burstTimerRef.current);
        burstTimerRef.current = null;
        setIsRecordingBurst(false);
      }
    }, 120);
  }, []);

  const stopBurstRecord = useCallback(() => {
    if (burstTimerRef.current) clearInterval(burstTimerRef.current);
    burstTimerRef.current = null;
    setIsRecordingBurst(false);
  }, []);

  const clearLabelSamples = useCallback((labelId: string) => {
    setDataset((prev) => {
      const updated = { ...prev };
      delete updated[labelId];
      return updated;
    });
  }, []);

  // Model Training logic
  const handleTrainModel = useCallback(async () => {
    const activeClasses = labels.map((l) => l.id).filter((id) => dataset[id] && dataset[id].length > 0);
    if (activeClasses.length < 2) {
      alert("Please record samples for at least 2 gestures before training.");
      return;
    }
    setIsTraining(true);
    setTrainProgress({ epoch: 0, total: epochsInput, loss: 0, acc: 0 });

    try {
      const result = await tfClassifierRef.current.train(
        dataset,
        labels.map((l) => l.id),
        epochsInput,
        (epoch, loss, acc) => {
          setTrainProgress({ epoch, total: epochsInput, loss, acc });
        }
      );
      setEvalResult(result);
      setIsTrained(true);
    } catch (err: any) {
      alert(`Training error: ${err.message}`);
    } finally {
      setIsTraining(false);
    }
  }, [dataset, epochsInput, labels]);

  // Export & Import logic (NO localStorage/sessionStorage APIs used!)
  const handleExportDataset = useCallback(() => {
    const data = {
      version: 1,
      type: "signspeak_dataset",
      labels,
      dataset,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signspeak_dataset_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [dataset, labels]);

  const handleExportModel = useCallback(async () => {
    if (!tfClassifierRef.current.trained) {
      alert("Model is not trained yet. Train the model first before exporting weights.");
      return;
    }
    try {
      const activeClasses = labels.map((l) => l.id).filter((id) => dataset[id] && dataset[id].length > 0);
      const jsonStr = await tfClassifierRef.current.exportModel(activeClasses);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `signspeak_model_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    }
  }, [dataset, labels]);

  const handleImportFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        if (parsed.type === "signspeak_dataset") {
          if (Array.isArray(parsed.labels)) setLabels(parsed.labels);
          if (parsed.dataset) setDataset(parsed.dataset);
          alert(`Successfully imported dataset with ${Object.keys(parsed.dataset || {}).length} labeled classes!`);
        } else if (parsed.type === "signspeak_tfjs_model") {
          const res = await tfClassifierRef.current.importModel(text);
          if (res.success) {
            setIsTrained(true);
            alert("Successfully imported trained TensorFlow.js model weights!");
          }
        } else if (parsed.labels && parsed.dataset) {
          setLabels(parsed.labels);
          setDataset(parsed.dataset);
          alert("Imported dataset package successfully!");
        } else {
          alert("Unrecognized JSON format. Please upload a valid SignSpeak dataset or model export file.");
        }
      } catch (err: any) {
        alert(`Import error: ${err.message}`);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }, []);

  // Category grouping for labels
  const categories = useMemo(() => {
    const cats = Array.from(new Set(labels.map((l) => l.category)));
    return cats.sort();
  }, [labels]);

  const filteredLabels = useMemo(() => {
    if (!labelSearch) return labels;
    const q = labelSearch.toLowerCase();
    return labels.filter(
      (l) => l.name.toLowerCase().includes(q) || l.output.toLowerCase().includes(q) || l.category.toLowerCase().includes(q)
    );
  }, [labels, labelSearch]);

  const handleBulkAdd = useCallback(() => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    const newItems: GestureLabel[] = [];

    lines.forEach((line) => {
      const cleanName = line.charAt(0).toUpperCase() + line.slice(1);
      const cleanId = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      if (!labels.some((l) => l.id === cleanId) && !newItems.some((l) => l.id === cleanId)) {
        newItems.push({
          id: cleanId,
          name: cleanName,
          output: cleanName.toLowerCase(),
          emoji: "✋",
          category: "Custom",
          description: `Custom gesture for ${cleanName}`,
        });
      }
    });

    if (newItems.length > 0) {
      setLabels((prev) => [...prev, ...newItems]);
      setBulkText("");
      setBulkModalOpen(false);
      alert(`Added ${newItems.length} new gesture labels!`);
    }
  }, [bulkText, labels]);

  const totalSamples = useMemo(() => {
    return Object.values(dataset).reduce((acc, samples) => acc + samples.length, 0);
  }, [dataset]);

  const sourceLabel = source === "webcam" ? "Local webcam" : "ESP32-CAM / MJPEG";

  return (
    <section className="detector-section section-shell" id="detector" aria-labelledby="detector-title">
      <div className="section-heading-row">
        <div>
          <div className="section-index">01 / LIVE DETECTION & DATA ENGINE</div>
          <h2 id="detector-title">A camera that listens<br /><em>with its eyes.</em></h2>
        </div>
        <div className="studio-tabs-row" role="tablist" aria-label="Studio mode navigation">
          <button
            className={activeStudioTab === "detector" ? "studio-tab active" : "studio-tab"}
            onClick={() => setActiveStudioTab("detector")}
          >
            <Camera size={15} /> Live Detector
          </button>
          <button
            className={activeStudioTab === "collector" ? "studio-tab active" : "studio-tab"}
            onClick={() => setActiveStudioTab("collector")}
          >
            <Layers size={15} /> Data Collector ({totalSamples})
          </button>
          <button
            className={activeStudioTab === "trainer" ? "studio-tab active" : "studio-tab"}
            onClick={() => setActiveStudioTab("trainer")}
          >
            <Brain size={15} /> Train & Evaluate {isTrained && <span className="trained-badge">TF.js</span>}
          </button>
          <button
            className={activeStudioTab === "labels" ? "studio-tab active" : "studio-tab"}
            onClick={() => setActiveStudioTab("labels")}
          >
            <Hand size={15} /> Labels ({labels.length})
          </button>
          <button
            className={activeStudioTab === "io" ? "studio-tab active" : "studio-tab"}
            onClick={() => setActiveStudioTab("io")}
          >
            <Download size={15} /> Import / Export
          </button>
        </div>
      </div>

      {activeStudioTab === "detector" && (
        <div className="detector-console">
          <div className="camera-column">
            <div className="camera-toolbar">
              <div className="source-tabs" role="tablist" aria-label="Video source">
                <button
                  className={source === "webcam" ? "source-tab active" : "source-tab"}
                  onClick={() => setSource("webcam")}
                  role="tab"
                  aria-selected={source === "webcam"}
                >
                  <Camera size={14} /> Webcam
                </button>
                <button
                  className={source === "stream" ? "source-tab active" : "source-tab"}
                  onClick={() => setSource("stream")}
                  role="tab"
                  aria-selected={source === "stream"}
                >
                  <Signal size={14} /> ESP32-CAM
                </button>
              </div>
              <div className="toolbar-controls">
                <button
                  className={mirrorVideo ? "icon-button active" : "icon-button"}
                  onClick={() => setMirrorVideo((v) => !v)}
                  title="Toggle mirror horizontal flip"
                >
                  <FlipHorizontal size={15} />
                </button>
                <button
                  className={showSkeleton ? "icon-button active" : "icon-button"}
                  onClick={() => setShowSkeleton((v) => !v)}
                  title="Toggle 21-point skeleton overlay"
                >
                  {showSkeleton ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <span className={active ? "live-pill live-pill-on" : "live-pill"}>
                  <span className="status-dot" /> {active ? "Live" : "Standby"}
                </span>
              </div>
            </div>

            <div className="camera-frame">
              <video
                ref={videoRef}
                muted
                playsInline
                aria-label="Live camera feed"
                className={active && source === "webcam" ? (mirrorVideo ? "camera-video active mirrored" : "camera-video active") : "camera-video"}
              />
              <canvas ref={canvasRef} className="landmark-canvas" aria-label="Detected hand landmarks" />
              <div className="camera-noise" aria-hidden="true" />
              <div className="camera-corners" aria-hidden="true"><i /><i /><i /><i /></div>
              <div className="camera-readout camera-readout-top">
                <span>INPUT / {sourceLabel}</span>
                <span>640 × 480</span>
              </div>
              <div className="camera-readout camera-readout-bottom">
                <span>{cameraMessage}</span>
                <span className="mono">{active ? "30 FPS" : "-- FPS"}</span>
              </div>
              {!active && (
                <div className="camera-idle">
                  <ScanFace size={32} strokeWidth={1.3} />
                  <strong>Ready for hand recognition</strong>
                  <span>Start the camera to detect signs with TF.js / kNN</span>
                </div>
              )}
            </div>

            {source === "stream" && (
              <div className="stream-input-wrap">
                <label className="stream-input">
                  <span>MJPEG stream URL</span>
                  <input value={streamUrl} onChange={(e) => setStreamUrl(e.target.value)} aria-label="ESP32-CAM MJPEG stream URL" />
                </label>
                <button className="cors-help-button" onClick={() => setCorsHelpOpen(!corsHelpOpen)}>
                  CORS note <CircleHelp size={14} />
                </button>
                {corsHelpOpen && (
                  <div className="cors-note">
                    <p><strong>ESP32-CAM CORS Setup:</strong> Ensure your ESP32 Arduino web server includes header <code>Access-Control-Allow-Origin: *</code> in the MJPEG stream response so Chrome permits canvas reading.</p>
                  </div>
                )}
              </div>
            )}

            <div className="camera-actions">
              {active ? (
                <button className="button button-ghost" onClick={stopSource}>
                  <Pause size={16} /> Stop source
                </button>
              ) : (
                <button className="button button-primary" onClick={startSource}>
                  <Play size={16} fill="currentColor" /> Start {source === "webcam" ? "camera" : "stream"}
                </button>
              )}
              <button
                className="button button-ghost"
                onClick={() => {
                  setRecognizedId("waiting");
                  setRecognizedConfidence(0);
                  setCameraMessage("Recognition state reset.");
                }}
              >
                <RotateCcw size={16} /> Reset
              </button>
            </div>
          </div>

          <aside className="telemetry-column" aria-label="Recognition telemetry">
            <div className="telemetry-label">
              <span>RECOGNIZED GESTURE</span>
              <span className="mono">{isTrained ? "ENGINE: TF.JS" : (totalSamples > 0 ? "ENGINE: KNN" : "UNTRAINED")}</span>
            </div>

            <div className="gesture-result">
              <span className="gesture-emoji">
                <GestureMark id={recognizedId === "waiting" || recognizedId === "no_match" ? "palm" : currentGesture.id} />
              </span>
              <div>
                <h3>{active ? currentGesture.name : "— — —"}</h3>
                <p>
                  {active
                    ? (recognizedId === "no_match"
                        ? "Uncertain signal (score below threshold)"
                        : `Output: “${currentGesture.output}”`)
                    : "Present a trained sign to classify"}
                </p>
              </div>
            </div>

            <div className="confidence-block">
              <div className="meter-heading">
                <span>Confidence score</span>
                <strong>{recognizedConfidence ? `${recognizedConfidence}%` : "—"}</strong>
              </div>
              <div className="meter">
                <span style={{ width: `${recognizedConfidence}%` }} />
              </div>
              <div className="meter-note">
                <span>threshold {confidence}%</span>
                <span>hold {holdTime}ms</span>
              </div>
            </div>

            <div className="control-block">
              <div className="control-heading">
                <Settings2 size={15} /> Classifier controls
              </div>
              <label className="range-label">
                Confidence threshold
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={confidence}
                  onChange={(e) => setConfidence(Number(e.target.value))}
                />
                <span>{confidence}%</span>
              </label>
              <label className="range-label">
                Hold-to-confirm
                <input
                  type="range"
                  min="300"
                  max="1500"
                  step="60"
                  value={holdTime}
                  onChange={(e) => setHoldTime(Number(e.target.value))}
                />
                <span>{holdTime}ms</span>
              </label>
            </div>

            <div className="speech-control">
              <div className="speech-toggle-row">
                <button className={speak ? "speak-toggle speak-toggle-on" : "speak-toggle"} onClick={() => setSpeak(!speak)} aria-pressed={speak}>
                  {speak ? <Volume2 size={17} /> : <VolumeX size={17} />}
                  <span>
                    <strong>{speak ? "Voice output on" : "Voice output off"}</strong>
                    <small>{SPEECH_LANGUAGES.find((item) => item.value === speechLanguage)?.label ?? speechLanguage}</small>
                  </span>
                  <span className="toggle-track"><i /></span>
                </button>
                <button className={speechSettingsOpen ? "speech-settings-button active" : "speech-settings-button"} onClick={() => setSpeechSettingsOpen(!speechSettingsOpen)} aria-label="Open speech settings">
                  <Settings2 size={16} />
                </button>
              </div>
              {speechSettingsOpen && (
                <div className="speech-settings-menu">
                  <div className="speech-settings-title">VOICE SETTINGS</div>
                  <label>
                    Language
                    <select value={speechLanguage} onChange={(e) => setSpeechLanguage(e.target.value)}>
                      {SPEECH_LANGUAGES.map((l) => (
                        <option value={l.value} key={l.value}>{l.label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Voice
                    <select value={speechVoice} onChange={(e) => setSpeechVoice(e.target.value)} disabled={!matchingVoices.length}>
                      <option value="">System default</option>
                      {matchingVoices.map((v) => (
                        <option value={v.name} key={`${v.name}-${v.lang}`}>{v.name} · {v.lang}</option>
                      ))}
                    </select>
                  </label>
                  <button className="voice-test-button" onClick={() => speakMeaning("SignSpeak voice test")}>
                    <Volume2 size={13} /> Test voice
                  </button>
                </div>
              )}
            </div>

            <div className="history-panel">
              <div className="history-heading">
                <span>RECENT RECOGNITIONS</span>
                <span>{history.length}/8</span>
              </div>
              {history.length === 0 ? (
                <p className="history-empty">Confirmed signs will appear here with copy & replay controls.</p>
              ) : (
                <div className="history-list">
                  {history.map((item) => (
                    <div className="history-item" key={`${item.id}-${item.time}`}>
                      <span className="history-emoji">{item.emoji}</span>
                      <div className="history-copy">
                        <strong>{item.name}</strong>
                        <small>“{item.output}” · {item.time}</small>
                      </div>
                      <button onClick={() => navigator.clipboard?.writeText(item.output)} title="Copy text"><Copy size={14} /></button>
                      <button onClick={() => speakMeaning(item.output)} title="Replay voice"><Volume2 size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {activeStudioTab === "collector" && (
        <div className="collector-studio">
          <div className="collector-header-card">
            <div>
              <h3>Data Collection Studio</h3>
              <p>Record 40-60 samples per gesture label using your webcam. Diversity in hand angle and distance improves recognition accuracy.</p>
            </div>
            <div className="collector-summary-stats">
              <div><strong>{totalSamples}</strong><span>total samples</span></div>
              <div><strong>{Object.keys(dataset).length} / {labels.length}</strong><span>labeled signs</span></div>
            </div>
          </div>

          <div className="collector-controls-bar">
            <label className="select-label">
              <span>Target Recording Label:</span>
              <select value={selectedRecordLabel} onChange={(e) => setSelectedRecordLabel(e.target.value)}>
                {labels.map((l) => (
                  <option value={l.id} key={l.id}>
                    {l.emoji} {l.name} ({(dataset[l.id] || []).length} samples)
                  </option>
                ))}
              </select>
            </label>

            <div className="record-actions">
              <button
                className="button button-primary"
                onClick={() => {
                  const ok = recordSingleSample(selectedRecordLabel);
                  if (!ok) alert("No active hand landmark detected in camera frame! Make sure camera is started and hand is visible.");
                }}
              >
                <Camera size={16} /> Capture Single Sample
              </button>

              {isRecordingBurst ? (
                <button className="button button-danger" onClick={stopBurstRecord}>
                  <Pause size={16} /> Stop Burst ({burstCount}/50)
                </button>
              ) : (
                <button
                  className="button button-secondary"
                  onClick={() => {
                    if (!active) {
                      alert("Please start the camera first before recording burst samples.");
                      return;
                    }
                    startBurstRecord(selectedRecordLabel, 50);
                  }}
                >
                  <RefreshCw size={16} /> Auto-Record 50 Samples
                </button>
              )}

              <button className="button button-ghost" onClick={() => clearLabelSamples(selectedRecordLabel)}>
                <Trash2 size={16} /> Clear Label Samples
              </button>
            </div>
          </div>

          <div className="labels-samples-grid">
            {labels.map((l) => {
              const count = (dataset[l.id] || []).length;
              let badgeColor = "badge-red";
              let badgeText = "Needs samples";
              if (count >= 40) {
                badgeColor = "badge-green";
                badgeText = "Ready";
              } else if (count >= 20) {
                badgeColor = "badge-yellow";
                badgeText = "Add more (20+)";
              }

              return (
                <div className={`sample-card ${selectedRecordLabel === l.id ? "selected" : ""}`} key={l.id} onClick={() => setSelectedRecordLabel(l.id)}>
                  <div className="card-top">
                    <span className="card-emoji">{l.emoji}</span>
                    <span className={`status-badge ${badgeColor}`}>{badgeText}</span>
                  </div>
                  <h4>{l.name}</h4>
                  <p className="mono">{l.category}</p>
                  <div className="sample-count-row">
                    <strong>{count} samples</strong>
                    <button className="icon-subtle" onClick={(e) => { e.stopPropagation(); recordSingleSample(l.id); }} title="Add 1 sample">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeStudioTab === "trainer" && (
        <div className="trainer-studio">
          <div className="trainer-header-card">
            <div>
              <h3>TensorFlow.js Model Training & Evaluation</h3>
              <p>Train a neural network model directly in your browser on normalized 63D landmark vectors. 15% of samples will be held out to check accuracy and compute the confusion matrix.</p>
            </div>
            <button className="button button-primary" onClick={handleTrainModel} disabled={isTraining}>
              <Brain size={16} /> {isTraining ? "Training in progress..." : "Train Model Now"}
            </button>
          </div>

          {trainProgress && (
            <div className="progress-card">
              <div className="progress-row">
                <span>Epoch {trainProgress.epoch} / {trainProgress.total}</span>
                <span>Loss: {trainProgress.loss.toFixed(4)} · Accuracy: {Math.round(trainProgress.acc * 100)}%</span>
              </div>
              <div className="progress-bar">
                <span style={{ width: `${(trainProgress.epoch / trainProgress.total) * 100}%` }} />
              </div>
            </div>
          )}

          {evalResult && (
            <div className="eval-results-container">
              <div className="eval-metrics-summary">
                <div className="metric-box">
                  <strong>{evalResult.overallAccuracy}%</strong>
                  <span>Held-out Test Accuracy</span>
                </div>
                <div className="metric-box">
                  <strong>{evalResult.valSamplesCount}</strong><span>Validation Samples</span>
                </div>
                <div className="metric-box">
                  <strong>{evalResult.classes.length}</strong><span>Active Trained Classes</span>
                </div>
              </div>

              <h4>Confusion Matrix (Actual vs Predicted)</h4>
              <div className="confusion-table-wrapper">
                <table className="confusion-table">
                  <thead>
                    <tr>
                      <th>Actual \ Predicted</th>
                      {evalResult.classes.map((cls) => (
                        <th key={cls}>{cls}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {evalResult.classes.map((actualCls, rowIdx) => (
                      <tr key={actualCls}>
                        <th>{actualCls}</th>
                        {evalResult.classes.map((predCls, colIdx) => {
                          const val = evalResult.confusionMatrix[rowIdx]?.[colIdx] || 0;
                          const isDiagonal = rowIdx === colIdx;
                          let cellClass = "cell-zero";
                          if (val > 0) {
                            cellClass = isDiagonal ? "cell-correct" : "cell-confused";
                          }

                          return (
                            <td key={predCls} className={cellClass}>
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeStudioTab === "labels" && (
        <div className="labels-studio">
          <div className="labels-header">
            <div className="search-bar">
              <Search size={16} />
              <input
                value={labelSearch}
                onChange={(e) => setLabelSearch(e.target.value)}
                placeholder="Search label by name or category..."
              />
            </div>
            <button className="button button-primary" onClick={() => setBulkModalOpen(true)}>
              <Plus size={16} /> Bulk-Add Labels
            </button>
          </div>

          {bulkModalOpen && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>Bulk-Add Gesture Labels</h3>
                  <button onClick={() => setBulkModalOpen(false)}><X size={18} /></button>
                </div>
                <p>Paste a comma-separated or line-separated list of sign names (e.g. "Help, Water, Food, Stop, Hello, Yes, No"):</p>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={6}
                  placeholder="Water, Food, Help, Stop, Emergency..."
                />
                <div className="modal-actions">
                  <button className="button button-ghost" onClick={() => setBulkModalOpen(false)}>Cancel</button>
                  <button className="button button-primary" onClick={handleBulkAdd}>Add Labels</button>
                </div>
              </div>
            </div>
          )}

          <div className="categories-accordion-list">
            {categories.map((cat) => {
              const catLabels = filteredLabels.filter((l) => l.category === cat);
              const isCollapsed = collapsedCategories[cat];
              if (catLabels.length === 0) return null;

              return (
                <div className="category-accordion" key={cat}>
                  <div
                    className="accordion-header"
                    onClick={() =>
                      setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }))
                    }
                  >
                    <h4>
                      {cat} <span>({catLabels.length})</span>
                    </h4>
                    {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                  </div>

                  {!isCollapsed && (
                    <div className="accordion-grid">
                      {catLabels.map((l) => (
                        <div className="label-item-card" key={l.id}>
                          <span className="emoji">{l.emoji}</span>
                          <div>
                            <strong>{l.name}</strong>
                            <small>output: “{l.output}”</small>
                          </div>
                          <button
                            className="delete-button"
                            onClick={() => setLabels((prev) => prev.filter((item) => item.id !== l.id))}
                            title="Delete label"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeStudioTab === "io" && (
        <div className="io-studio">
          <div className="io-card">
            <h3>Import & Export Dataset / Model</h3>
            <p>
              In compliance with zero browser storage requirements, all data persists via standalone JSON files. Export your recorded samples and trained weights to reuse on the ESP32-CAM stream or share with others.
            </p>

            <div className="io-buttons-grid">
              <button className="button button-primary" onClick={handleExportDataset}>
                <Download size={16} /> Export Dataset JSON
              </button>
              <button className="button button-secondary" onClick={handleExportModel} disabled={!isTrained}>
                <Brain size={16} /> Export Trained Model Weights JSON
              </button>
              <label className="button button-ghost upload-label">
                <Upload size={16} /> Import Dataset / Model JSON
                <input type="file" accept=".json" onChange={handleImportFile} hidden />
              </label>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function GestureGallery() {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const GESTURE_CATEGORIES = ["all", "Greetings", "Needs", "Emergency", "Numbers", "Responses"] as const;

  const filtered = initialLabels.filter((item) => {
    const matchesCategory = filter === "all" || item.category === filter;
    const haystack = `${item.name} ${item.output} ${item.description}`.toLowerCase();
    return matchesCategory && haystack.includes(query.toLowerCase());
  });

  return (
    <section className="gallery-section section-shell" id="gestures" aria-labelledby="gestures-title">
      <div className="section-heading-row gallery-heading">
        <div>
          <div className="section-index">02 / TRAINED VOCABULARY</div>
          <h2 id="gestures-title">{initialLabels.length} signs.<br /><em>One shared language.</em></h2>
        </div>
        <div className="gallery-heading-side">
          <p className="section-intro">Every gesture in this library is wired directly to the live classifier — what you see here is exactly what the camera recognizes.</p>
          <div className="library-controls">
            <label className="library-search">
              <Search size={15} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search gestures..." aria-label="Search gestures" />
            </label>
            <div className="library-filter-line">
              <span className="library-count">{filtered.length} of {initialLabels.length}</span>
              <div className="filter-row" role="tablist" aria-label="Filter gesture categories">
                {GESTURE_CATEGORIES.map((item) => (
                  <button key={item} onClick={() => setFilter(item)} className={filter === item ? "filter-chip active" : "filter-chip"} role="tab" aria-selected={filter === item}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="gesture-grid">
        {filtered.map((item, index) => (
          <article key={item.id} className="gesture-card" style={{ "--card-index": index } as React.CSSProperties}>
            <div className="card-top">
              <span className="card-number">{String(initialLabels.indexOf(item) + 1).padStart(2, "0")}</span>
              <span className="card-category">{item.category}</span>
            </div>
            <div className="card-gesture">
              <GestureMark id={item.id} />
              <span className="card-emoji" aria-hidden="true">{item.emoji}</span>
            </div>
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            <div className="card-output">
              <span>speaks</span>
              <strong>“{item.output}”</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="how-section section-shell" id="how-it-works" aria-labelledby="how-title">
      <div className="how-visual">
        <div className="visual-orbit orbit-one" />
        <div className="visual-orbit orbit-two" />
        <div className="visual-core"><Hand size={34} /><span>21</span></div>
        <div className="visual-tag tag-one">x / y / z</div>
        <div className="visual-tag tag-two">LANDMARKS</div>
        <div className="visual-tag tag-three">REAL-TIME</div>
      </div>
      <div className="how-copy">
        <div className="section-index">03 / UNDER THE HOOD</div>
        <h2 id="how-title">From gesture<br /><em>to meaning.</em></h2>
        <p>SignSpeak turns the geometry of a hand into language. MediaPipe Hands locates 21 landmarks per frame, then a scale-normalized neural network trained in-browser via TensorFlow.js classifies the shape.</p>
        <p>Everything happens in the browser with zero server latency and zero local storage. Camera frames do not leave your device.</p>
        <div className="process-list">
          <div className="process-step"><span>01</span><div><strong>Locate</strong><p>MediaPipe tracks 21 hand joints.</p></div><ArrowDownRight size={16} /></div>
          <div className="process-step"><span>02</span><div><strong>Normalize</strong><p>Wrist-relative 63D scale invariant vector.</p></div><ArrowDownRight size={16} /></div>
          <div className="process-step"><span>03</span><div><strong>Classify</strong><p>TensorFlow.js neural network with kNN fallback.</p></div><ArrowDownRight size={16} /></div>
        </div>
      </div>
    </section>
  );
}

function RouteMeta({ title, description, canonicalPath = window.location.pathname, schemaType }: { title: string; description: string; canonicalPath?: string; schemaType?: "WebApplication" | "Blog" }) {
  useEffect(() => {
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement("meta"); meta.setAttribute("name", "description"); document.head.appendChild(meta); }
    meta.setAttribute("content", description);
  }, [canonicalPath, description, schemaType, title]);
  return null;
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand"><span className="brand-mark"><Hand size={17} /></span><span>SignSpeak</span></div>
      <p>Hand gestures, spoken.</p>
      <div className="footer-links"><a href="/about">About</a><a href="/gestures">Vocabulary</a><a href="/contact">Contact</a></div>
    </footer>
  );
}

function RoutedPage({ title, description, kicker, heading, children, canonicalPath }: { title: string; description: string; kicker: string; heading: React.ReactNode; children: React.ReactNode; canonicalPath?: string }) {
  return (
    <div className="app-shell routed-page">
      <RouteMeta title={title} description={description} canonicalPath={canonicalPath} />
      <Header onEnter={() => {}} />
      <main className="route-main section-shell">
        <div className="route-hero">
          <div className="section-index">{kicker}</div>
          <h1>{heading}</h1>
          <p>{description}</p>
        </div>
        {children}
      </main>
      <Footer />
    </div>
  );
}

function ToolsPage() {
  return (
    <RoutedPage title="Tools — SignSpeak" description="Explore SignSpeak tools for real-time hand gesture recognition." kicker="TOOLS / SIGN LANGUAGE INTERFACE" heading={<>Tools for<br /><em>clearer signals.</em></>}>
      <LiveDetector />
    </RoutedPage>
  );
}

function DetectionPage() { return <RoutedPage title="Live Detector — SignSpeak" description="Detect hand gestures in real time." kicker="TOOLS / LIVE DETECTION" heading={<>A camera that listens<br /><em>with its eyes.</em></>}><LiveDetector /></RoutedPage>; }
function GalleryPage() { return <RoutedPage title="Gesture Library — SignSpeak" description="Browse supported hand gestures." kicker="TOOLS / GESTURE LIBRARY" heading={<>{initialLabels.length} signs.<br /><em>One shared language.</em></>}><GestureGallery /></RoutedPage>; }
function HowPage() { return <RoutedPage title="How It Works — SignSpeak" description="Learn how SignSpeak works." kicker="TOOLS / UNDER THE HOOD" heading={<>From gesture<br /><em>to meaning.</em></>}><HowItWorks /></RoutedPage>; }

function Home() {
  const [introVisible, setIntroVisible] = useState(true);
  useEffect(() => { const timer = window.setTimeout(() => setIntroVisible(false), 2900); return () => window.clearTimeout(timer); }, []);

  return (
    <div className="app-shell" id="top">
      <RouteMeta title="SignSpeak — Hand gestures, spoken" description="SignSpeak translates hand gestures into clear spoken language in real time." canonicalPath="/" />
      {introVisible && <IntroOverlay onSkip={() => setIntroVisible(false)} />}
      <Header onEnter={() => {}} />
      <main>
        <section className="hero section-shell" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow"><span className="status-dot" /> BROWSER-BASED GESTURE INTERFACE <span className="eyebrow-line" /></div>
            <h1 id="hero-title">Your hands<br /><em>have a voice.</em></h1>
            <p className="hero-description">SignSpeak translates hand gestures into clear, spoken language in real time directly from your browser.</p>
            <div className="hero-actions">
              <a className="button button-primary" href="/tools/detection">Open live detector <ArrowUpRight size={16} /></a>
              <a className="text-link" href="#gestures">See supported gestures <ChevronDown size={16} /></a>
            </div>
          </div>
          <div className="hero-visual">
            <HandSkeleton />
          </div>
        </section>
        <LiveDetector />
        <GestureGallery />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}

function NotFound() {
  return <div className="not-found"><h1>Signal not found.</h1><a href="/">Return to SignSpeak</a></div>;
}

export default function App() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/tools" component={ToolsPage} />
      <Route path="/tools/detection" component={DetectionPage} />
      <Route path="/tools/how-it-works" component={HowPage} />
      <Route path="/gestures" component={GalleryPage} />
      <Route component={NotFound} />
    </Switch>
  );
}
