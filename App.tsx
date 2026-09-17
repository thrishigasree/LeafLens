import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Route, Switch, useLocation } from "wouter";
import {
  ArrowDownRight,
  ArrowUpRight,
  AudioLines,
  Camera,
  Check,
  ChevronDown,
  CircleHelp,
  Copy,
  ExternalLink,
  Gauge,
  Github,
  Hand,
  Menu,
  Mic2,
  Pause,
  Play,
  RotateCcw,
  Search,
  ScanFace,
  Settings2,
  Signal,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import labels from "./data/labels.json";
import "./index.css";

type SourceMode = "webcam" | "stream";
type RecognitionEntry = { id: string; name: string; output: string; emoji: string; confidence: number; time: string };
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
        <div className="tools-nav-wrap"><a className={toolsOpen ? "nav-tab tools-tab active" : "nav-tab tools-tab"} href="/tools" onClick={(event) => { event.preventDefault(); setToolsOpen((value) => !value); }} aria-expanded={toolsOpen} aria-haspopup="menu">Tools <ChevronDown size={15} className={toolsOpen ? "chevron-open" : ""} /></a>{toolsOpen && <div className="tools-menu" role="menu"><a href="/tools/detection" onClick={() => { setToolsOpen(false); setMenuOpen(false); }} role="menuitem"><Camera size={15} /><span><strong>Live detector</strong><small>Recognize signs from camera</small></span></a><a href="/gestures" onClick={() => { setToolsOpen(false); setMenuOpen(false); }} role="menuitem"><Hand size={15} /><span><strong>Gesture library</strong><small>Browse the trained vocabulary</small></span></a><a href="/tools/how-it-works" onClick={() => { setToolsOpen(false); setMenuOpen(false); }} role="menuitem"><CircleHelp size={15} /><span><strong>How it works</strong><small>Explore the recognition pipeline</small></span></a></div>}</div>
        <a className="nav-tab" href="/blog" onClick={() => setMenuOpen(false)}>Blog</a>
        <a className="nav-tab" href="/about" onClick={() => setMenuOpen(false)}>About</a>
        <a className="nav-tab" href="/contact" onClick={() => setMenuOpen(false)}>Contact</a>
        <a className="nav-cta" href="/tools/detection" onClick={() => { setMenuOpen(false); setToolsOpen(false); onEnter(); }}>Open camera <ArrowUpRight size={15} /></a>
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

const GESTURE_TIPS: Record<string, Array<[number, number]>> = { like: [[92, 42], [120, 76], [124, 92], [126, 105], [126, 115]], dislike: [[92, 132], [120, 92], [124, 78], [126, 65], [126, 54]], stop: [[80, 38], [100, 29], [118, 38], [132, 52], [140, 70]], ok: [[90, 88], [109, 65], [126, 83], [132, 101], [128, 116]], peace: [[86, 44], [110, 38], [128, 78], [133, 101], [130, 115]], call: [[74, 76], [101, 86], [120, 88], [132, 101], [140, 115]], fist: [[103, 77], [108, 78], [113, 80], [118, 83], [123, 88]], palm: [[78, 36], [100, 28], [122, 36], [137, 52], [145, 72]], one: [[90, 40], [111, 74], [123, 94], [130, 107], [132, 116]], two_up: [[82, 44], [104, 38], [122, 78], [130, 100], [133, 114]] };

function GestureMark({ id }: { id: string }) {
  const tips = GESTURE_TIPS[id] ?? GESTURE_TIPS.palm;
  return <svg className="gesture-mark" viewBox="0 0 180 170" role="img" aria-label={`${id} gesture line illustration`}><g className="gesture-mark-lines"><path d="M96 112 C86 106 80 96 82 84 L88 62 C90 56 96 58 97 64 L99 83" /><path d="M99 83 L103 45 C104 38 111 38 112 45 L113 84" /><path d="M113 84 L119 48 C120 41 127 42 128 49 L126 88" /><path d="M126 88 L132 63 C134 57 141 60 140 67 L136 98" /><path d="M136 98 L145 81 C148 76 153 80 151 86 L141 108 C135 121 120 130 105 129 C94 128 84 123 77 116" />{tips.map(([x, y], index) => <line key={index} x1="96" y1="112" x2={x} y2={y} />)}</g><g className="gesture-mark-dots">{tips.map(([x, y], index) => <circle key={index} cx={x} cy={y} r="3" />)}<circle cx="96" cy="112" r="4" /></g></svg>;
}

function LiveDetector() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handsRef = useRef<any>(null);
  const frameRef = useRef<number | null>(null);
  const lastSpokenRef = useRef("");
  const candidateRef = useRef("");
  const candidateSinceRef = useRef(0);
  const [source, setSource] = useState<SourceMode>("webcam");
  const [streamUrl, setStreamUrl] = useState("http://192.168.4.1:81/stream");
  const [active, setActive] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [speak, setSpeak] = useState(true);
  const [speechSettingsOpen, setSpeechSettingsOpen] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState("en-US");
  const [speechVoice, setSpeechVoice] = useState("");
  const [speechVoices, setSpeechVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [confidence, setConfidence] = useState(86);
  const [holdTime, setHoldTime] = useState(720);
  const [recognizedId, setRecognizedId] = useState("waiting");
  const [recognizedConfidence, setRecognizedConfidence] = useState(0);
  const [history, setHistory] = useState<RecognitionEntry[]>([]);
  const [cameraMessage, setCameraMessage] = useState("Camera is idle. Start a source to begin.");
  const currentGesture = labels.find((item) => item.id === recognizedId) ?? { id: "waiting", name: "— — —", output: "waiting for a hand", emoji: "✋", category: "status", description: "Start a source to classify" };
  const matchingVoices = useMemo(() => speechVoices.filter((voice) => voice.lang.toLowerCase().startsWith(speechLanguage.split("-")[0].toLowerCase())), [speechLanguage, speechVoices]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const loadVoices = () => setSpeechVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  useEffect(() => {
    if (matchingVoices.length && !matchingVoices.some((voice) => voice.name === speechVoice)) setSpeechVoice(matchingVoices[0].name);
    if (!matchingVoices.length) setSpeechVoice("");
  }, [matchingVoices, speechVoice]);

  const classifyLandmarks = useCallback((points: Array<{ x: number; y: number }>) => {
    const wrist = points[0];
    const extended = [[8, 6], [12, 10], [16, 14], [20, 18]].map(([tip, pip]) => points[tip].y < points[pip].y - .025);
    const [index, middle, ring, pinky] = extended;
    const thumbOpen = Math.hypot(points[4].x - points[5].x, points[4].y - points[5].y) > .11;
    const pinch = Math.hypot(points[4].x - points[8].x, points[4].y - points[8].y) < .09;
    if (pinch && index && !middle && !ring && !pinky) return ["ok", 94] as const;
    if (thumbOpen && pinky && !index && !middle && !ring) return ["call", 92] as const;
    if (points[4].y < wrist.y - .08 && !index && !middle && !ring && !pinky) return ["like", 91] as const;
    if (points[4].y > wrist.y + .12 && !index && !middle && !ring && !pinky) return ["dislike", 91] as const;
    if (index && middle && !ring && !pinky) return ["peace", 89] as const;
    if (index && !middle && !ring && !pinky) return ["one", 90] as const;
    if (index && middle && ring && pinky) return ["palm", 93] as const;
    if (!index && !middle && !ring && !pinky) return ["fist", 90] as const;
    return ["stop", 80] as const;
  }, []);

  const onResults = useCallback((results: any) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, width, height);
    const hand = results.multiHandLandmarks?.[0];
    if (!hand) { candidateRef.current = ""; candidateSinceRef.current = 0; lastSpokenRef.current = ""; setRecognizedId("waiting"); setRecognizedConfidence(0); return; }
    context.strokeStyle = "#FF7A33"; context.fillStyle = "#ECEDEF"; context.lineWidth = Math.max(2, width / 320);
    HAND_BONES.forEach(([from, to]) => { context.beginPath(); context.moveTo(hand[from].x * width, hand[from].y * height); context.lineTo(hand[to].x * width, hand[to].y * height); context.stroke(); });
    hand.forEach((point: { x: number; y: number }) => { context.beginPath(); context.arc(point.x * width, point.y * height, Math.max(3, width / 150), 0, Math.PI * 2); context.fill(); });
    const [id, score] = classifyLandmarks(hand);
    const now = performance.now();
    if (score < confidence) { candidateRef.current = ""; candidateSinceRef.current = 0; setRecognizedConfidence(score); return; }
    if (candidateRef.current !== id) { candidateRef.current = id; candidateSinceRef.current = now; }
    setRecognizedConfidence(score);
    if (now - candidateSinceRef.current >= holdTime) setRecognizedId(id);
  }, [classifyLandmarks, confidence, holdTime]);

  const loadHands = useCallback(async () => {
    if (handsRef.current) return handsRef.current;
    await new Promise<void>((resolve, reject) => {
      if ((window as any).Hands) return resolve();
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js";
      script.onload = () => resolve(); script.onerror = () => reject(new Error("MediaPipe unavailable"));
      document.head.appendChild(script);
    });
    const Hands = (window as any).Hands;
    const hands = new Hands({ locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
    hands.setOptions({ maxNumHands: 1, modelComplexity: 0, minDetectionConfidence: 0.65, minTrackingConfidence: 0.6 });
    hands.onResults(onResults); handsRef.current = hands; return hands;
  }, [onResults]);

  const stopSource = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null;
    if (frameRef.current) window.cancelAnimationFrame(frameRef.current); frameRef.current = null;
    handsRef.current?.close?.(); handsRef.current = null; setModelReady(false); setActive(false); setRecognizedId("waiting"); setRecognizedConfidence(0);
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.srcObject = null; videoRef.current.removeAttribute("src"); }
  }, []);

  const startSource = useCallback(async () => {
    if (source === "stream") { setActive(true); setCameraMessage(`ESP32-CAM selected: ${streamUrl}`); return; }
    if (!navigator.mediaDevices?.getUserMedia) { setCameraMessage("Camera access is not available in this browser."); return; }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = mediaStream;
      if (videoRef.current) { videoRef.current.srcObject = mediaStream; await videoRef.current.play(); }
      setActive(true); setCameraMessage("Webcam connected. Loading hand landmark model…");
      await loadHands(); setModelReady(true); setCameraMessage("MediaPipe Hands connected. Show a trained sign.");
      const detect = async () => { if (!videoRef.current || !handsRef.current) return; await handsRef.current.send({ image: videoRef.current }); frameRef.current = window.requestAnimationFrame(detect); };
      detect();
    } catch { setCameraMessage("Camera or MediaPipe access failed. Check permission and network, then try again."); }
  }, [loadHands, source, streamUrl]);

  useEffect(() => () => stopSource(), [stopSource]);
  const speakMeaning = useCallback((meaning: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(meaning);
    utterance.lang = speechLanguage;
    const selectedVoice = speechVoices.find((voice) => voice.name === speechVoice);
    if (selectedVoice) utterance.voice = selectedVoice;
    window.speechSynthesis.speak(utterance);
  }, [speechLanguage, speechVoice, speechVoices]);
  useEffect(() => {
    if (!active || recognizedId === "waiting" || lastSpokenRef.current === recognizedId) return;
    lastSpokenRef.current = recognizedId;
    const entry = { id: currentGesture.id, name: currentGesture.name, output: currentGesture.output, emoji: currentGesture.emoji, confidence: recognizedConfidence, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setHistory((items) => [entry, ...items.filter((item) => item.id !== entry.id)].slice(0, 6));
    if (speak) speakMeaning(currentGesture.output);
  }, [active, currentGesture.emoji, currentGesture.id, currentGesture.name, currentGesture.output, recognizedConfidence, recognizedId, speak, speakMeaning]);
  const sourceLabel = source === "webcam" ? "Local webcam" : "ESP32-CAM / MJPEG";

  return (
    <section className="detector-section section-shell" id="detector" aria-labelledby="detector-title">
      <div className="section-heading-row">
        <div>
          <div className="section-index">01 / LIVE DETECTION</div>
          <h2 id="detector-title">A camera that listens<br /><em>with its eyes.</em></h2>
        </div>
        <p className="section-intro">Run the full landmark pipeline in your browser. Your video stays local; only normalized hand coordinates enter the classifier.</p>
      </div>

      <div className="detector-console">
        <div className="camera-column">
          <div className="camera-toolbar">
            <div className="source-tabs" role="tablist" aria-label="Video source">
              <button className={source === "webcam" ? "source-tab active" : "source-tab"} onClick={() => setSource("webcam")} role="tab" aria-selected={source === "webcam"}><Camera size={14} /> Webcam</button>
              <button className={source === "stream" ? "source-tab active" : "source-tab"} onClick={() => setSource("stream")} role="tab" aria-selected={source === "stream"}><Signal size={14} /> ESP32-CAM</button>
            </div>
            <span className={active ? "live-pill live-pill-on" : "live-pill"}><span className="status-dot" /> {active ? "Live" : "Standby"}</span>
          </div>
          <div className="camera-frame">
            <video ref={videoRef} muted playsInline aria-label="Live camera feed" className={active && source === "webcam" ? "camera-video active" : "camera-video"} />
            <canvas ref={canvasRef} className="landmark-canvas" aria-label="Detected hand landmarks" />
            <div className="camera-noise" aria-hidden="true" />
            <div className="camera-corners" aria-hidden="true"><i /><i /><i /><i /></div>
            <div className="camera-readout camera-readout-top"><span>INPUT / {sourceLabel}</span><span>640 × 480</span></div>
            <div className="camera-readout camera-readout-bottom"><span>{cameraMessage}</span><span className="mono">{active ? "24 FPS" : "-- FPS"}</span></div>
            {!active && <div className="camera-idle"><ScanFace size={32} strokeWidth={1.3} /><strong>Ready for a hand</strong><span>Start the camera to preview landmark tracking</span></div>}
          </div>
          {source === "stream" && <label className="stream-input"><span>MJPEG stream URL</span><input value={streamUrl} onChange={(event) => setStreamUrl(event.target.value)} aria-label="ESP32-CAM MJPEG stream URL" /></label>}
          <div className="camera-actions">
            {active ? <button className="button button-ghost" onClick={stopSource}><Pause size={16} /> Stop source</button> : <button className="button button-primary" onClick={startSource}><Play size={16} fill="currentColor" /> Start {source === "webcam" ? "camera" : "stream"}</button>}
            <button className="button button-ghost" onClick={() => { setRecognizedId("waiting"); setRecognizedConfidence(0); setCameraMessage("Recognition state reset."); }}><RotateCcw size={16} /> Reset</button>
          </div>
        </div>

        <aside className="telemetry-column" aria-label="Recognition telemetry">
          <div className="telemetry-label"><span>RECOGNIZED GESTURE</span><span className="mono">{active ? (modelReady ? "TRACKING" : "LOADING") : "WAITING"}</span></div>
          <div className="gesture-result"><span className="gesture-emoji"><GestureMark id={recognizedId === "waiting" ? "palm" : currentGesture.id} /></span><div><h3>{active ? currentGesture.name : "— — —"}</h3><p>{active && recognizedId !== "waiting" ? `Meaning: “${currentGesture.output}”` : "Show a trained sign to classify"}</p></div></div>
          <div className="confidence-block"><div className="meter-heading"><span>Recognition confidence</span><strong>{recognizedConfidence ? `${recognizedConfidence}%` : "—"}</strong></div><div className="meter"><span style={{ width: `${recognizedConfidence}%` }} /></div><div className="meter-note"><span>threshold {confidence}%</span><span>hold {holdTime}ms</span></div></div>
          <div className="control-block"><div className="control-heading"><Settings2 size={15} /> Classifier controls</div><label className="range-label">Confidence threshold <input type="range" min="60" max="98" value={confidence} onChange={(event) => setConfidence(Number(event.target.value))} /><span>{confidence}%</span></label><label className="range-label">Hold-to-confirm <input type="range" min="300" max="1500" step="60" value={holdTime} onChange={(event) => setHoldTime(Number(event.target.value))} /><span>{holdTime}ms</span></label></div>
          <div className="speech-control"><div className="speech-toggle-row"><button className={speak ? "speak-toggle speak-toggle-on" : "speak-toggle"} onClick={() => setSpeak((value) => !value)} aria-pressed={speak}>{speak ? <Volume2 size={17} /> : <VolumeX size={17} />}<span><strong>{speak ? "Voice output on" : "Voice output off"}</strong><small>{SPEECH_LANGUAGES.find((item) => item.value === speechLanguage)?.label ?? speechLanguage} · {speak ? "speaking confirmed signs" : "tap to enable"}</small></span><span className="toggle-track"><i /></span></button><button className={speechSettingsOpen ? "speech-settings-button active" : "speech-settings-button"} onClick={() => setSpeechSettingsOpen((value) => !value)} aria-label="Open speech settings" aria-expanded={speechSettingsOpen}><Settings2 size={16} /></button></div>{speechSettingsOpen && <div className="speech-settings-menu"><div className="speech-settings-title">VOICE SETTINGS <span>LOCAL DEVICE</span></div><label>Language<select value={speechLanguage} onChange={(event) => setSpeechLanguage(event.target.value)}>{SPEECH_LANGUAGES.map((language) => <option value={language.value} key={language.value}>{language.label}</option>)}</select></label><label>Voice<select value={speechVoice} onChange={(event) => setSpeechVoice(event.target.value)} disabled={!matchingVoices.length}><option value="">System default</option>{matchingVoices.map((voice) => <option value={voice.name} key={`${voice.name}-${voice.lang}`}>{voice.name} · {voice.lang}</option>)}</select></label><button className="voice-test-button" onClick={() => speakMeaning("SignSpeak voice test") }><Volume2 size={13} /> Test voice</button>{!speechVoices.length && <small className="voice-note">Your browser will use its default voice until system voices become available.</small>}</div>}</div>
          <div className="history-panel"><div className="history-heading"><span>RECENT RECOGNITIONS</span><span>{history.length}/6</span></div>{history.length === 0 ? <p className="history-empty">Confirmed signs will appear here with copy and replay controls.</p> : <div className="history-list">{history.map((item) => <div className="history-item" key={`${item.id}-${item.time}`}><span className="history-emoji">{item.emoji}</span><div className="history-copy"><strong>{item.name}</strong><small>“{item.output}” · {item.time}</small></div><button onClick={() => navigator.clipboard?.writeText(item.output)} aria-label={`Copy ${item.output}`} title="Copy text"><Copy size={14} /></button><button onClick={() => speakMeaning(item.output)} aria-label={`Replay ${item.output}`} title="Replay voice"><Volume2 size={14} /></button></div>)}</div>}</div>
          <div className="pipeline-status"><span className="status-check"><Check size={12} /></span><span><strong>Pipeline ready</strong><small>MediaPipe Hands · landmark classifier</small></span></div>
        </aside>
      </div>
    </section>
  );
}

function GestureGallery() {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const filtered = labels.filter((item) => {
    const matchesCategory = filter === "all" || item.category === filter;
    const haystack = `${item.name} ${item.output} ${item.description}`.toLowerCase();
    return matchesCategory && haystack.includes(query.toLowerCase());
  });
  return (
    <section className="gallery-section section-shell" id="gestures" aria-labelledby="gestures-title">
      <div className="section-heading-row gallery-heading">
        <div><div className="section-index">02 / TRAINED VOCABULARY</div><h2 id="gestures-title">Ten signs.<br /><em>One shared language.</em></h2></div>
        <div className="gallery-heading-side"><p className="section-intro">The gallery is generated from the same label manifest that powers recognition, keeping the interface and model in lockstep.</p><div className="library-controls"><label className="library-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search gestures..." aria-label="Search gestures" /></label><div className="library-filter-line"><span className="library-count">{filtered.length} gestures</span><div className="filter-row" role="tablist" aria-label="Filter gesture categories">{["all", "social", "direction", "number"].map((item) => <button key={item} onClick={() => setFilter(item)} className={filter === item ? "filter-chip active" : "filter-chip"} role="tab" aria-selected={filter === item}>{item}</button>)}</div></div></div></div>
      </div>
      <div className="gesture-grid">{filtered.map((item, index) => <article key={item.id} className="gesture-card" style={{ "--card-index": index } as React.CSSProperties}><div className="card-top"><span className="card-number">0{labels.indexOf(item) + 1}</span><span className="card-category">{item.category}</span></div><div className="card-gesture"><GestureMark id={item.id} /><ArrowUpRight size={17} /></div><h3>{item.name}</h3><p>{item.description}</p><div className="card-output"><span>outputs</span><strong>“{item.output}”</strong></div><a className="gesture-detail-link" href={`/gestures/${item.id}`}>View guide <ArrowUpRight size={13} /></a></article>)}</div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="how-section section-shell" id="how-it-works" aria-labelledby="how-title">
      <div className="how-visual"><div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" /><div className="visual-core"><Hand size={34} /><span>21</span></div><div className="visual-tag tag-one">x / y / z</div><div className="visual-tag tag-two">LANDMARKS</div><div className="visual-tag tag-three">REAL-TIME</div></div>
      <div className="how-copy"><div className="section-index">03 / UNDER THE HOOD</div><h2 id="how-title">From gesture<br /><em>to meaning.</em></h2><p>SignSpeak turns the geometry of a hand into language. MediaPipe Hands locates 21 landmarks per frame, then a lightweight classifier compares the normalized shape against a focused vocabulary of gestures.</p><p>Everything happens in the browser with a video-source layer that is ready for an ESP32-CAM stream when you are. Raw camera frames do not leave your device.</p><div className="process-list"><div className="process-step"><span>01</span><div><strong>Locate</strong><p>MediaPipe tracks joints and fingertips.</p></div><ArrowDownRight size={16} /></div><div className="process-step"><span>02</span><div><strong>Normalize</strong><p>Wrist-relative coordinates remove scale.</p></div><ArrowDownRight size={16} /></div><div className="process-step"><span>03</span><div><strong>Classify</strong><p>TensorFlow.js confirms the held gesture.</p></div><ArrowDownRight size={16} /></div></div></div>
    </section>
  );
}

function GestureDetail() {
  const id = window.location.pathname.split("/").filter(Boolean).pop() ?? "like";
  const gesture = labels.find((item) => item.id === id) ?? labels[0];
  const examples: Record<string, string> = { like: "Use it to confirm that something is good or approved.", dislike: "Use it as a clear negative response when words are inconvenient.", stop: "Use it to pause an interaction, request space, or signal stop.", ok: "Use it to confirm a choice or signal that everything is fine.", peace: "Use it as a friendly greeting or a quick peace sign.", call: "Use it to indicate a phone call or ask someone to call.", fist: "Use it as a compact neutral pose or a strong affirmative gesture.", palm: "Use it to get attention or communicate an open-hand signal.", one: "Use it for counting, selection, or indicating the first item.", two_up: "Use it for counting or indicating the second item." };
  return <div className="app-shell detail-page"><RouteMeta title={`${gesture.name} Gesture Guide — SignSpeak`} description={`Learn the meaning, usage, and camera recognition tips for the ${gesture.name} hand gesture.`} canonicalPath={`/gestures/${gesture.id}`} /><Header onEnter={() => {}} /><main className="detail-main section-shell"><a className="back-link" href="/gestures">← Back to gesture library</a><div className="detail-hero"><div className="detail-symbol"><GestureMark id={gesture.id} /></div><div><div className="section-index">GESTURE GUIDE / {gesture.category.toUpperCase()}</div><h1>{gesture.name}</h1><p className="detail-lead">When SignSpeak sees this shape, it outputs <strong>“{gesture.output}”</strong> and can read the meaning aloud.</p></div></div><div className="detail-grid"><section><div className="section-index">USAGE EXAMPLE</div><h2>Say it without<br /><em>saying a word.</em></h2><p>{examples[gesture.id] ?? gesture.description}</p></section><section className="detail-tips"><div className="section-index">CAMERA TIPS</div><div className="tip-row"><span>01</span><div><strong>Face the camera</strong><p>Keep your palm and fingertips visible inside the frame.</p></div></div><div className="tip-row"><span>02</span><div><strong>Use even light</strong><p>Avoid strong backlight and shadows across the hand.</p></div></div><div className="tip-row"><span>03</span><div><strong>Hold steady</strong><p>Keep the sign held for the confirmation window.</p></div></div></section></div><div className="detail-actions"><a className="button button-primary" href="/tools/detection">Try this sign <ArrowUpRight size={16} /></a><a className="text-link" href="/gestures">Browse all gestures <ArrowDownRight size={16} /></a></div></main><footer className="site-footer"><div className="footer-brand"><span className="brand-mark"><Hand size={17} /></span><span>SignSpeak</span></div><p>Hand gestures, spoken.</p><div className="footer-links"><a href="/tools/how-it-works">How it works</a><a href="/gestures">Vocabulary</a></div></footer></div>;
}

function RouteMeta({ title, description, canonicalPath = window.location.pathname, schemaType }: { title: string; description: string; canonicalPath?: string; schemaType?: "WebApplication" | "Blog" }) {
  useEffect(() => {
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement("meta"); meta.setAttribute("name", "description"); document.head.appendChild(meta); }
    meta.setAttribute("content", description);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement("link"); canonical.setAttribute("rel", "canonical"); document.head.appendChild(canonical); }
    const canonicalUrl = `${window.location.origin}${canonicalPath}`;
    canonical.setAttribute("href", canonicalUrl);
    const setMeta = (key: string, value: string, property = false) => { const selector = property ? `meta[property="${key}"]` : `meta[name="${key}"]`; let tag = document.querySelector(selector); if (!tag) { tag = document.createElement("meta"); tag.setAttribute(property ? "property" : "name", key); document.head.appendChild(tag); } tag.setAttribute("content", value); };
    setMeta("og:type", "website", true); setMeta("og:url", canonicalUrl, true); setMeta("og:title", title, true); setMeta("og:description", description, true); setMeta("og:image", `${window.location.origin}/og-image.svg`, true); setMeta("twitter:card", "summary_large_image"); setMeta("twitter:title", title); setMeta("twitter:description", description); setMeta("twitter:image", `${window.location.origin}/og-image.svg`);
    let schema = document.querySelector("script[data-signspeak-schema]");
    if (!schema) { schema = document.createElement("script"); schema.setAttribute("type", "application/ld+json"); schema.setAttribute("data-signspeak-schema", "true"); document.head.appendChild(schema); }
    schema.textContent = JSON.stringify(schemaType === "Blog" ? { "@context": "https://schema.org", "@type": "Article", headline: title, description, url: canonicalUrl, author: { "@type": "Organization", name: "SignSpeak" } } : { "@context": "https://schema.org", "@type": "WebApplication", name: "SignSpeak", url: canonicalUrl, description, applicationCategory: "AccessibilityApplication", operatingSystem: "Web browser" });
  }, [canonicalPath, description, schemaType, title]);
  return null;
}

function Footer() {
  return <footer className="site-footer"><div className="footer-brand"><span className="brand-mark"><Hand size={17} /></span><span>SignSpeak</span></div><p>Hand gestures, spoken.</p><div className="footer-links"><a href="/about">About</a><a href="/gestures">Vocabulary</a><a href="/contact">Contact</a></div></footer>;
}

function RoutedPage({ title, description, kicker, heading, children, canonicalPath, schemaType }: { title: string; description: string; kicker: string; heading: React.ReactNode; children: React.ReactNode; canonicalPath?: string; schemaType?: "WebApplication" | "Blog" }) {
  return <div className="app-shell routed-page"><RouteMeta title={title} description={description} canonicalPath={canonicalPath} schemaType={schemaType} /><Header onEnter={() => {}} /><main className="route-main section-shell"><div className="route-hero"><div className="section-index">{kicker}</div><h1>{heading}</h1><p>{description}</p></div>{children}</main><Footer /></div>;
}

function ToolsPage() {
  const tools = [{ href: "/tools/detection", icon: <Camera size={20} />, name: "Live detector", copy: "Recognize a supported hand sign from your webcam and hear its meaning." }, { href: "/gestures", icon: <Hand size={20} />, name: "Gesture library", copy: "Browse every trained gesture with examples and camera tips." }, { href: "/tools/how-it-works", icon: <CircleHelp size={20} />, name: "How it works", copy: "Understand the local-first landmark and classification pipeline." }];
  return <RoutedPage title="Tools — SignSpeak" description="Explore SignSpeak tools for real-time hand gesture recognition, gesture vocabulary, and local-first computer vision." kicker="TOOLS / SIGN LANGUAGE INTERFACE" heading={<>Tools for<br /><em>clearer signals.</em></>}><div className="tools-preview"><video autoPlay muted loop playsInline aria-label="SignSpeak live landmark detection preview"><source src="/manus-storage/signspeak-demo_347172f9.mp4" type="video/mp4" /></video><div><div className="section-index">LIVE PRODUCT PREVIEW</div><h2>See recognition<br /><em>before you try it.</em></h2><p>The same local landmark pipeline powers the live detector, with text and voice output ready when a sign is confirmed.</p></div></div><div className="tools-directory-grid">{tools.map((tool) => <a className="tool-directory-card" href={tool.href} key={tool.href}><span className="tool-card-icon">{tool.icon}</span><span className="tool-card-copy"><strong>{tool.name}</strong><p>{tool.copy}</p><span className="tool-card-link">Open tool <ArrowUpRight size={14} /></span></span></a>)}</div></RoutedPage>;
}
function DetectionPage() { return <RoutedPage title="Live Hand Gesture Detector — SignSpeak" description="Use your camera to detect hand gestures in real time and hear their meanings with SignSpeak." kicker="TOOLS / LIVE DETECTION" heading={<>A camera that listens<br /><em>with its eyes.</em></>}><LiveDetector /></RoutedPage>; }
function GalleryPage() { return <RoutedPage title="Gesture Library — SignSpeak" description="Browse SignSpeak’s supported hand gestures, meanings, examples, and camera recognition guidance." kicker="TOOLS / GESTURE LIBRARY" heading={<>Ten signs.<br /><em>One shared language.</em></>}><GestureGallery /></RoutedPage>; }
function HowPage() { return <RoutedPage title="How SignSpeak Works — SignSpeak" description="Learn how SignSpeak uses browser-based hand landmarks and local classification to translate gestures." kicker="TOOLS / UNDER THE HOOD" heading={<>From gesture<br /><em>to meaning.</em></>}><HowItWorks /></RoutedPage>; }
function BlogPage() { return <RoutedPage schemaType="Blog" title="SignSpeak Blog" description="Read updates, design notes, and practical guidance about accessible gesture interfaces from SignSpeak." kicker="SIGNAL NOTES / BLOG" heading={<>Ideas for<br /><em>better signals.</em></>}><div className="article-list"><article><div className="section-index">COMING SOON / 01</div><h2>Designing for the space between people</h2><p>Notes on building calm, accessible interfaces that let hands become language without adding friction.</p></article><article><div className="section-index">FIELD GUIDE / 02</div><h2>How to get a clearer camera signal</h2><p>Lighting, framing, and hold-time techniques that make browser-based gesture recognition more reliable.</p></article></div></RoutedPage>; }
function AboutPage() { return <RoutedPage title="About SignSpeak" description="Learn about SignSpeak’s local-first approach to translating hand gestures into spoken language." kicker="ABOUT / LOCAL-FIRST PROCESSING" heading={<>Technology that<br /><em>makes room.</em></>}><div className="simple-copy"><p>SignSpeak is a browser-based gesture interface built to make the space between people more expressive. MediaPipe Hands locates 21 landmarks per frame, while a lightweight TensorFlow.js-ready classifier maps normalized hand geometry to a focused vocabulary.</p><p className="about-secondary">The gesture manifest is informed by the open HaGRIDv2 dataset. SignSpeak is being built as a privacy-first accessibility prototype: camera frames stay on the device, and only the meaning you choose to speak leaves the interface.</p><div className="about-facts"><div><strong>21</strong><span>landmarks<br />per hand</span></div><div><strong>0ms</strong><span>server<br />latency</span></div><div><strong>LOCAL</strong><span>processing<br />by default</span></div></div></div></RoutedPage>; }
function ContactPage() { return <RoutedPage title="Contact SignSpeak" description="Contact the SignSpeak team about accessibility, partnerships, feedback, or gesture recognition support." kicker="CONTACT / START A SIGNAL" heading={<>Have a question?<br /><em>Send a signal.</em></>}><div className="contact-card"><p>For feedback, accessibility ideas, partnerships, or support with a camera setup, send a note to the SignSpeak team.</p><a className="button button-primary" href="mailto:hello@signspeak.example">Email SignSpeak <ArrowUpRight size={16} /></a></div></RoutedPage>; }

function RouteTransition() {
  const [location, setLocation] = useLocation();
  const [visible, setVisible] = useState(false);
  const navigatingRef = useRef(false);
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest("a") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname && url.search === window.location.search) return;
      event.preventDefault();
      navigatingRef.current = true;
      setVisible(true);
      setLocation(`${url.pathname}${url.search}${url.hash}`);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [setLocation]);
  useEffect(() => {
    if (!navigatingRef.current) return;
    const timer = window.setTimeout(() => { setVisible(false); navigatingRef.current = false; }, 280);
    return () => window.clearTimeout(timer);
  }, [location]);
  return <div className={visible ? "route-transition is-visible" : "route-transition"} aria-hidden="true"><div className="transition-scanline" /><div className="transition-reticle"><i /><i /><i /><i /></div><div className="transition-landmarks">{Array.from({ length: 9 }, (_, index) => <b key={index} style={{ "--dot-index": index } as React.CSSProperties} />)}</div></div>;
}

function Home() {
  const [introVisible, setIntroVisible] = useState(true);
  useEffect(() => { const timer = window.setTimeout(() => setIntroVisible(false), 2900); return () => window.clearTimeout(timer); }, []);
  return (
    <div className="app-shell" id="top">
      <RouteMeta title="SignSpeak — Hand gestures, spoken" description="SignSpeak translates hand gestures into clear spoken language in real time, directly in your browser." canonicalPath="/" />
      {introVisible && <IntroOverlay onSkip={() => setIntroVisible(false)} />}
      <Header onEnter={() => {}} />
      <main>
        <section className="hero section-shell" aria-labelledby="hero-title">
          <div className="hero-copy"><div className="eyebrow"><span className="status-dot" /> BROWSER-BASED GESTURE INTERFACE <span className="eyebrow-line" /></div><h1 id="hero-title">Your hands<br /><em>have a voice.</em></h1><p className="hero-description">SignSpeak translates hand gestures into clear, spoken language — in real time, right from your browser.</p><div className="hero-actions"><a className="button button-primary" href="/tools">Explore tools <ArrowUpRight size={16} /></a><a className="text-link" href="/gestures">See supported gestures <ChevronDown size={16} /></a></div><div className="hero-proof"><div><strong>21</strong><span>landmarks<br />per hand</span></div><div><strong>10</strong><span>trained<br />gestures</span></div><div><strong>0ms</strong><span>server<br />latency</span></div></div></div>
          <div className="hero-visual" aria-label="Animated hand landmark visualization"><div className="hero-visual-label label-left">LANDMARKS / 21<span /> </div><div className="hero-visual-label label-right">SIGNAL / READY<span /></div><div className="hero-ring ring-a" /><div className="hero-ring ring-b" /><div className="hero-ring ring-c" /><HandSkeleton /><div className="hero-crosshair crosshair-one" /><div className="hero-crosshair crosshair-two" /><div className="hero-coordinates">x: 0.493<br />y: 0.276<br />z: -0.031</div><div className="hero-visual-bottom"><span className="status-dot" /> <span>Tracking subject</span><span className="mono">01:24:08</span></div></div>
        </section>
        <section className="landing-preview section-shell" aria-labelledby="landing-preview-title"><div className="section-index">START WITH A SIGNAL</div><h2 id="landing-preview-title">One focused space<br /><em>for clearer communication.</em></h2><p>Explore the live detector, supported gesture vocabulary, and the ideas behind SignSpeak on their dedicated pages.</p><div className="landing-links"><a className="button button-primary" href="/tools">Explore tools <ArrowUpRight size={16} /></a><a className="text-link" href="/gestures">See supported gestures <ArrowUpRight size={16} /></a></div></section>
        <section className="demo-section section-shell" aria-labelledby="demo-title"><div className="demo-video-wrap"><video className="demo-video" autoPlay muted loop playsInline poster="/og-image.svg" aria-label="SignSpeak product demonstration video"><source src="/manus-storage/signspeak-demo_347172f9.mp4" type="video/mp4" /></video><div className="demo-video-badge"><span className="status-dot status-dot-pulse" /> PRODUCT DEMO / 00:08</div></div><div className="demo-copy"><div className="section-index">SEE THE SIGNAL</div><h2 id="demo-title">From camera<br /><em>to conversation.</em></h2><p>SignSpeak watches the shape of a hand, confirms the meaning, and turns it into a clear voice output—all in one calm, local-first flow.</p><a className="text-link" href="/tools/detection">Open the live detector <ArrowUpRight size={15} /></a></div></section>
        <section className="feature-strip section-shell" aria-label="SignSpeak product features"><div><span className="feature-icon">01</span><strong>Private by default</strong><p>Frames stay in your browser during recognition.</p></div><div><span className="feature-icon">02</span><strong>Voice, your way</strong><p>Choose language and system voice for output.</p></div><div><span className="feature-icon">03</span><strong>Built to extend</strong><p>Ready for ESP32-CAM and a growing vocabulary.</p></div></section>
      </main>
      <footer className="site-footer"><div className="footer-brand"><span className="brand-mark"><Hand size={17} /></span><span>SignSpeak</span></div><p>Hand gestures, spoken. Built for the space between people.</p><div className="footer-links"><a href="/about">About</a><a href="/gestures">Vocabulary</a><a href="https://github.com/hukenovs/hagrid" target="_blank" rel="noreferrer">HaGRIDv2 <ExternalLink size={12} /></a><a href="/contact">Contact</a></div></footer>
    </div>
  );
}

function NotFound() { return <div className="not-found"><h1>Signal not found.</h1><a href="/">Return to SignSpeak</a></div>; }

export default function App() {
  return <><RouteTransition /><Switch><Route path="/" component={Home} /><Route path="/tools" component={ToolsPage} /><Route path="/tools/detection" component={DetectionPage} /><Route path="/tools/how-it-works" component={HowPage} /><Route path="/gestures" component={GalleryPage} /><Route path="/gestures/:id" component={GestureDetail} /><Route path="/blog" component={BlogPage} /><Route path="/about" component={AboutPage} /><Route path="/contact" component={ContactPage} /><Route component={NotFound} /></Switch></>;
}
