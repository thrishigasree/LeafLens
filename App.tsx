import { useEffect, useRef, useState } from "react";
import { Link, Route, Switch, useLocation } from "wouter";
import {
  ArrowRight,
  Bell,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  CloudSun,
  Droplets,
  FileText,
  Flower2,
  Gauge,
  Leaf,
  Lightbulb,
  MessageCircle,
  Menu,
  MoreHorizontal,
  Play,
  ScanLine,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Sprout,
  Sun,
  Upload,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import "./index.css";

const reports = [
  {
    plant: "Tomato · Bed 2",
    finding: "Early Blight",
    date: "Today, 9:42 AM",
    status: "Watch closely",
    tone: "watch",
    confidence: 91,
    image: "https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=900&q=80",
  },
  {
    plant: "Cucumber · North row",
    finding: "Powdery Mildew",
    date: "Yesterday, 6:18 PM",
    status: "Watch closely",
    tone: "watch",
    confidence: 87,
    image: "https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=900&q=80",
  },
  {
    plant: "Basil · Window box",
    finding: "Healthy growth",
    date: "Jun 14, 8:05 AM",
    status: "Healthy",
    tone: "healthy",
    confidence: 96,
    image: "https://images.unsplash.com/photo-1618375569909-3c8616cf7733?auto=format&fit=crop&w=900&q=80",
  },
  {
    plant: "Pepper · Bed 1",
    finding: "Aphid infestation",
    date: "Jun 12, 7:32 AM",
    status: "Urgent",
    tone: "urgent",
    confidence: 94,
    image: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=900&q=80",
  },
];

const navItems = [
  { href: "/app", label: "Overview", icon: Gauge },
  { href: "/scan", label: "Scan a plant", icon: ScanLine },
  { href: "/history", label: "Scan history", icon: FileText },
];

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="brand" aria-label="CropSense home">
      <span className={`brand-mark ${dark ? "brand-mark-dark" : ""}`}>
        <Sprout size={19} strokeWidth={2.3} />
      </span>
      <span>
        <strong className={dark ? "text-white" : ""}>CropSense</strong>
        <small className={dark ? "text-white/55" : ""}>Plant health, made clear.</small>
      </span>
    </Link>
  );
}

function StatusPill({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={`status-pill ${tone}`}>{children}</span>;
}

function AppHeader({ app = false }: { app?: boolean }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [, navigate] = useLocation();
  return (
    <header className={app ? "app-header" : "site-header"}>
      <div className="container header-inner">
        <Logo dark={app} />
        {app ? (
          <>
            <div className="header-status"><span className="status-dot" /> AI assistant online</div>
            <div className="header-actions">
              <button className="icon-button" aria-label="Search"><Search size={18} /></button>
              <button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><span /></button>
              <div className="profile-wrap">
                <button className="profile-button" onClick={() => setProfileOpen(!profileOpen)} aria-expanded={profileOpen}>
                  <span className="avatar">MC</span><span className="profile-name">Maya Chen</span><ChevronDown size={15} />
                </button>
                {profileOpen && <div className="profile-menu"><strong>Maya Chen</strong><span>Home grower</span><button onClick={() => { toast("Profile settings are ready for your next harvest."); setProfileOpen(false); }}>Account settings</button><button onClick={() => navigate("/")}>Sign out</button></div>}
              </div>
            </div>
          </>
        ) : (
          <nav className="public-nav" aria-label="Primary navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#who-its-for">Who it's for</a>
            <a href="#report">Sample report</a>
            <Link href="/app">Log in</Link>
            <Link href="/scan" className="nav-cta">Try a scan <ArrowRight size={16} /></Link>
          </nav>
        )}
      </div>
    </header>
  );
}

function AppSidebar() {
  const [location] = useLocation();
  return (
    <aside className="app-sidebar">
      <div className="sidebar-main">
        <div className="sidebar-kicker">YOUR GREENHOUSE</div>
        <nav className="sidebar-nav" aria-label="App navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location === item.href || (item.href === "/app" && location === "/report");
            return <Link key={item.href} href={item.href} className={active ? "active" : ""}><Icon size={18} /><span>{item.label}</span>{item.href === "/history" && <span className="nav-count">12</span>}</Link>;
          })}
        </nav>
        <div className="sidebar-divider" />
        <div className="sidebar-kicker">GROWING KIT</div>
        <nav className="sidebar-nav muted-nav">
          <button onClick={() => toast("Routine reminders are all caught up.")}><Sun size={18} /><span>Routines</span></button>
          <button onClick={() => toast("Plant library is coming to your greenhouse soon.")}><Flower2 size={18} /><span>Plant library</span></button>
        </nav>
      </div>
      <div className="sidebar-bottom">
        <div className="sidebar-tip"><Lightbulb size={17} /><div><strong>Scan tip</strong><span>Natural light gives the clearest read.</span></div></div>
        <button className="help-link" onClick={() => toast("Our help guide covers lighting, framing, and next steps.")}><CircleHelp size={16} /> Help center</button>
      </div>
    </aside>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return <div className="app-frame"><AppHeader app /><div className="app-body"><AppSidebar /><main className="app-main">{children}</main></div></div>;
}

function LandingPage() {
  const [heroAwake, setHeroAwake] = useState(false);
  const [scanLaunch, setScanLaunch] = useState(false);
  const [, navigate] = useLocation();
  useEffect(() => {
    const wake = window.requestAnimationFrame(() => setHeroAwake(true));
    const revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("scene-visible")), { threshold: .18 });
    document.querySelectorAll(".scene-reveal").forEach((element) => revealObserver.observe(element));
    return () => { window.cancelAnimationFrame(wake); revealObserver.disconnect(); };
  }, []);

  const titleLetters = "CropSense".split("");
  return (
    <div className={`landing-page ${heroAwake ? "hero-awake" : ""} ${scanLaunch ? "scan-launching" : ""}`}>
      <AppHeader />
      <main>
        <section className="hero-section cinematic-hero">
          <div className="cinematic-backdrop" aria-hidden="true"><div className="sunrise-glow" /><div className="hero-grain" /><span className="pollen pollen-one" /><span className="pollen pollen-two" /><span className="pollen pollen-three" /><span className="pollen pollen-four" /></div>
          <div className="hero-foreground container">
            <div className="hero-kicker"><span className="eyebrow-dot" /> A clearer way to grow</div>
            <h1 className="cinematic-title" aria-label="CropSense">{titleLetters.map((letter, index) => <span key={`${letter}-${index}`} style={{ "--letter-index": index } as React.CSSProperties}>{letter}</span>)}</h1>
            <p className="cinematic-tagline">Every leaf has a story.<br /><em>Now you can read it.</em></p>
            <p className="cinematic-support">A plant pathologist in your pocket — helping small growers catch disease, pests, and stress before they spread.</p>
            <div className="cinematic-actions"><button className="primary-button cinematic-cta" onClick={() => { setScanLaunch(true); window.setTimeout(() => navigate("/scan"), 1050); }}>Scan your first plant <ArrowRight size={17} /></button><a href="#how-it-works" className="scroll-cue"><span className="scroll-cue-line" /> Scroll to explore</a></div>
            <div className="cinematic-report-card"><div className="cinematic-report-top"><span><span className="status-dot" /> Live plant read</span><span>Tomato · Bed 2</span></div><div className="cinematic-report-body"><div className="report-spark"><ShieldCheck size={17} /></div><div><span>Visual health check</span><strong>Good to grow</strong></div><b>96%</b></div></div>
          </div>
          <div className="hero-bottom-note container"><span>Affordable plant intelligence for real growers</span><span className="hero-bottom-rule" /><span>01 / 05</span></div>
          <div className="scan-transition" aria-hidden="true"><div className="transition-viewfinder"><span className="transition-corner top-left" /><span className="transition-corner top-right" /><span className="transition-corner bottom-left" /><span className="transition-corner bottom-right" /><span className="transition-scanline" /></div><div className="transition-label"><ScanLine size={16} /> Opening live camera</div></div>
        </section>

        <section className="problem-section scene-reveal" id="problem">
          <div className="container problem-grid"><div><div className="section-label">THE COST OF WAITING</div><h2>Small problems become<br /><span>big harvest losses.</span></h2></div><p className="section-intro">For small growers, every plant counts. But daily inspections are easy to miss, and professional crop monitoring is priced for enterprise farms — not your backyard or greenhouse.</p></div>
          <div className="container stat-grid"><div className="stat-card"><span className="stat-number">30<span>min</span></span><strong>spent inspecting</strong><p>Every week, per 100 sq ft of growing space.</p></div><div className="stat-card"><span className="stat-number">$10k<span>+</span></span><strong>for commercial hardware</strong><p>Drones and crop cameras are built for bigger farms.</p></div><div className="stat-card accent-stat"><span className="stat-number">40<span>%</span></span><strong>of yield can be lost</strong><p>When disease is caught after it has already spread.</p></div></div>
        </section>

        <section className="how-section scene-reveal" id="how-it-works"><div className="container"><div className="section-heading centered"><div className="section-label">A BETTER WAY TO LOOK</div><h2>From “what is that?”<br /><span>to “here’s what to do.”</span></h2><p>CropSense turns a quick photo into a plain-language care plan — no specialist vocabulary required.</p></div><div className="steps-grid"><Step number="01" icon={<Camera size={21} />} title="Show us the leaf" copy="Open the live camera or upload a close-up photo in natural light." /><Step number="02" icon={<Zap size={21} />} title="Let AI take a look" copy="CropSense checks for visual markers linked to disease, pests, and stress." /><Step number="03" icon={<Check size={21} />} title="Get your next step" copy="See what we found, how sure we are, and exactly what to do next." /></div></div></section>

        <section className="report-section scene-reveal" id="report"><div className="container report-shell"><div className="report-copy"><div className="section-label">A REPORT YOU CAN USE</div><h2>No diagnosis<br /><span>without a plan.</span></h2><p>We don’t just flag a problem. Every CropSense report explains the visual clues, gives you an order of operations, and shares prevention tips for next time.</p><div className="report-proof"><ShieldCheck size={19} /><span><strong>Confidence, made visible.</strong> Know when to act now — and when to keep watching.</span></div><Link href="/report" className="text-button">Preview a sample report <ArrowRight size={16} /></Link></div><ReportPreview /></div></section>

        <section className="audience-section scene-reveal" id="who-its-for"><div className="container"><div className="audience-intro"><div><div className="section-label">BUILT FOR REAL GROWERS</div><h2>Big-ag insight.<br /><span>Small-grower price.</span></h2></div><p>Whether you’re growing food for your family, your neighbors, or simply the joy of it — you deserve tools that meet you where you are.</p></div><div className="audience-grid"><AudienceCard icon={<Sprout size={22} />} title="Small-scale farmers" copy="Walk your rows with a second set of eyes before the morning heat arrives." /><AudienceCard icon={<Flower2 size={22} />} title="Greenhouse hobbyists" copy="Finally know whether that new spot is a concern or just a little sun stress." /><AudienceCard icon={<Leaf size={22} />} title="Home gardeners" copy="Build confidence from your first seedling to your biggest harvest." /></div></div></section>

        <section className="cta-section"><div className="container cta-shell"><div><div className="eyebrow light"><span className="eyebrow-dot" /> A calmer way to grow</div><h2>Give your plants<br />a fighting chance.</h2></div><div><p>Start with one photo. Get a clearer next step in under a minute.</p><Link href="/scan" className="light-button">Scan your first plant <ArrowRight size={17} /></Link></div></div></section>
      </main>
      <footer className="site-footer"><div className="container footer-inner"><Logo /><div className="footer-links"><a href="#problem">About</a><a href="#report">Privacy</a><a href="mailto:hello@cropsense.app">Contact</a></div><span>© 2025 CropSense · Built for better growing</span></div></footer>
    </div>
  );
}

function Step({ number, icon, title, copy }: { number: string; icon: React.ReactNode; title: string; copy: string }) {
  return <div className="step-card"><div className="step-top"><span className="step-number">{number}</span><span className="step-icon">{icon}</span></div><h3>{title}</h3><p>{copy}</p></div>;
}

function AudienceCard({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return <div className="audience-card"><span className="audience-icon">{icon}</span><h3>{title}</h3><p>{copy}</p><ChevronRight size={17} /></div>;
}

function ReportPreview() {
  const [tab, setTab] = useState("Visual clues");
  const tabs = ["Visual clues", "Action plan", "Prevention tips"];
  return <div className="report-card"><div className="report-card-header"><div><span className="mini-label">LATEST SCAN · TOMATO</span><h3>Early blight</h3></div><StatusPill tone="watch">Watch closely</StatusPill></div><div className="report-image"><img src={reports[0].image} alt="Tomato leaf close-up used in sample scan report" /><span className="image-marker marker-one" /><span className="image-marker marker-two" /><div className="image-note"><ScanLine size={14} /> Two visual markers found</div></div><div className="confidence-row"><div><span>AI confidence</span><strong>91%</strong></div><div className="confidence-track"><span style={{ width: "91%" }} /></div></div><div className="tab-row">{tabs.map((item) => <button key={item} className={tab === item ? "selected" : ""} onClick={() => setTab(item)}>{item}</button>)}</div><div className="report-tab-content">{tab === "Visual clues" && <><strong>What we noticed</strong><p>Small brown spots with yellow halos on lower leaves — a common early sign of fungal pressure.</p></>}{tab === "Action plan" && <><strong>Start here</strong><p>Remove affected leaves, water at soil level, and improve airflow between plants today.</p></>}{tab === "Prevention tips" && <><strong>Keep it from spreading</strong><p>Rotate tomato beds next season and avoid working with wet foliage.</p></>}</div><Link href="/report" className="report-link">View full sample report <ArrowRight size={15} /></Link></div>;
}

function PageHeader({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: React.ReactNode }) {
  return <div className="page-heading"><div><div className="section-label">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;
}

type ChatMessage = { role: "assistant" | "user"; text: string };

function getAssistantReply(question: string) {
  const normalized = question.toLowerCase();
  if (normalized.includes("water") || normalized.includes("watering")) return "Water at the soil line in the morning, not over the leaves. Let the top inch of soil dry between waterings so the foliage has time to dry.";
  if (normalized.includes("spread") || normalized.includes("neighbor") || normalized.includes("other plant")) return "Early blight can spread through water splash, wet tools, and close contact. Remove affected leaves, give nearby plants more airflow, and avoid handling foliage while it is wet.";
  if (normalized.includes("remove") || normalized.includes("cut") || normalized.includes("leaf")) return "Start with the spotted lower leaves. Use clean snips, take the whole affected leaf, and put it in the trash rather than the compost pile.";
  if (normalized.includes("sure") || normalized.includes("confidence") || normalized.includes("accurate")) return "The 91% confidence score comes from two matching visual markers: brown spots with yellow halos concentrated on older, lower leaves. A local extension office can confirm severe or fast-moving cases.";
  if (normalized.includes("treat") || normalized.includes("spray") || normalized.includes("fungus")) return "After removing affected leaves, improve airflow and keep foliage dry. If new spots continue, ask a local garden center or extension office about a tomato-safe fungicide for your growing region.";
  return "Based on this scan, I would focus on removing the affected lower leaves today, watering at soil level, and checking the plant again in 48 hours. If the spots move quickly upward, get a local expert’s second opinion.";
}

function DiagnosisChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "I’m here to help you think through this Early Blight result. Ask me what to do next, how to prevent spread, or how confident this scan is." },
  ]);
  const [question, setQuestion] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const quickPrompts = ["How should I water?", "Will it spread?", "What leaves should I remove?"];

  const ask = (value = question) => {
    const trimmed = value.trim();
    if (!trimmed || isThinking) return;
    setMessages((current) => [...current, { role: "user", text: trimmed }]);
    setQuestion("");
    setIsThinking(true);
    window.setTimeout(() => {
      setMessages((current) => [...current, { role: "assistant", text: getAssistantReply(trimmed) }]);
      setIsThinking(false);
    }, 650);
  };

  return <section className="diagnosis-chat" aria-label="AI diagnosis assistant">
    <div className="chat-heading"><div className="chat-heading-icon"><Sparkles size={17} /></div><div><div className="chat-title-row"><h2>Ask CropSense</h2><span><span className="status-dot" /> AI assistant</span></div><p>Follow up on this Early Blight result.</p></div></div>
    <div className="chat-messages" aria-live="polite">
      {messages.map((message, index) => <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}><span className="chat-avatar">{message.role === "assistant" ? <Sprout size={13} /> : "MC"}</span><p>{message.text}</p></div>)}
      {isThinking && <div className="chat-message assistant"><span className="chat-avatar"><Sprout size={13} /></span><p className="thinking-dots"><i /><i /><i /></p></div>}
    </div>
    <div className="quick-prompts"><span>Try asking</span>{quickPrompts.map((prompt) => <button key={prompt} onClick={() => ask(prompt)}>{prompt}</button>)}</div>
    <form className="chat-composer" onSubmit={(event) => { event.preventDefault(); ask(); }}><label className="sr-only" htmlFor="diagnosis-question">Ask a follow-up question</label><input id="diagnosis-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about this plant…" /><button type="submit" aria-label="Send question" disabled={!question.trim() || isThinking}><Send size={16} /></button></form>
    <div className="chat-footnote"><MessageCircle size={13} /> Answers use this scan’s visual clues and are not a replacement for expert diagnosis.</div>
  </section>;
}

function DashboardPage() {
  return <AppLayout><div className="dashboard-page"><PageHeader eyebrow="THURSDAY, JUNE 19 · 9:45 AM" title="Good morning, Maya." subtitle="Here’s your greenhouse at a glance." action={<Link href="/scan" className="primary-button compact"><ScanLine size={16} /> New scan</Link>} /><section className="weather-banner"><div className="weather-icon"><CloudSun size={29} /></div><div><span>Growing conditions today</span><strong>Bright and mild · 72°F</strong></div><div className="weather-detail"><span>Humidity</span><strong>62%</strong></div><div className="weather-detail"><span>UV index</span><strong>Moderate</strong></div><div className="weather-tip"><Lightbulb size={16} /><span>Great morning for a leaf check.</span></div></section><div className="dashboard-grid"><Card className="streak-card"><div className="card-heading"><div><span className="mini-label">YOUR MOMENTUM</span><h2>Scan streak</h2></div><MoreHorizontal size={20} /></div><div className="streak-number">4 <span>days</span></div><div className="streak-meta"><span><span className="status-dot" /> Up from last week</span><strong>+2 scans</strong></div><div className="week-dots"><div className="week-labels"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div><div className="dot-row"><span className="done" /><span className="done" /><span className="done" /><span className="done" /><span className="today" /><span /><span /></div></div></Card><Card className="routine-card"><div className="card-heading"><div><span className="mini-label">YOUR ROUTINE</span><h2>Small steps, big harvests.</h2></div><button className="more-button" onClick={() => toast("Your routines are tuned to your current growing kit.")}><MoreHorizontal size={20} /></button></div><RoutineItem icon={<Droplets size={18} />} title="Morning watering" detail="Due today · 6 plants" complete /><RoutineItem icon={<ScanLine size={18} />} title="Weekly plant scan" detail="Due today · 2 plants" /><RoutineItem icon={<Sun size={18} />} title="Rotate seedlings" detail="Due Friday · Window box" /></Card></div><div className="recent-section"><div className="subsection-heading"><div><span className="mini-label">RECENT SCANS</span><h2>Your plants, checked in.</h2></div><Link href="/history" className="text-button">View all <ArrowRight size={15} /></Link></div><div className="recent-grid">{reports.slice(0, 3).map((report) => <Link href="/report" className="recent-card" key={report.plant}><img src={report.image} alt={`${report.plant} scan`} /><div className="recent-card-content"><div><strong>{report.finding}</strong><StatusPill tone={report.tone}>{report.status}</StatusPill></div><span>{report.plant} · {report.date}</span><div className="recent-confidence"><span>Confidence</span><strong>{report.confidence}%</strong></div></div></Link>)}</div></div></div></AppLayout>;
}

function RoutineItem({ icon, title, detail, complete = false }: { icon: React.ReactNode; title: string; detail: string; complete?: boolean }) {
  const [done, setDone] = useState(complete);
  return <div className={`routine-item ${done ? "is-complete" : ""}`}><button className="routine-check" onClick={() => setDone(!done)} aria-label={`${done ? "Mark incomplete" : "Complete"} ${title}`}>{done && <Check size={14} />}</button><span className="routine-icon">{icon}</span><div><strong>{title}</strong><span>{detail}</span></div>{!done && <button className="start-button" onClick={() => { setDone(true); toast(`${title} marked complete.`); }}>Start</button>}</div>;
}

function ScanPage() {
  const [cameraState, setCameraState] = useState<"requesting" | "live" | "blocked" | "captured">("requesting");
  const [analyzing, setAnalyzing] = useState(false);
  const [tab, setTab] = useState("Visual clues");
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { let stream: MediaStream | null = null; const startCamera = async () => { try { stream = await navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment" }, audio: false }); if (videoRef.current) { videoRef.current.srcObject = stream; } setCameraState("live"); } catch { setCameraState("blocked"); } }; startCamera(); return () => stream?.getTracks().forEach((track) => track.stop()); }, []);
  const capture = () => { setCameraState("captured"); setAnalyzing(true); setTimeout(() => { setAnalyzing(false); toast("Scan complete — your report is ready."); }, 1800); };
  const upload = () => { fileRef.current?.click(); };
  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => { if (event.target.files?.[0]) { setCameraState("captured"); setAnalyzing(true); setTimeout(() => setAnalyzing(false), 1800); } };
  return <AppLayout><div className="scan-page"><PageHeader eyebrow="PLANT DIAGNOSTICS" title="Scan a plant" subtitle="Bring a leaf into focus and we’ll help you read the signs." action={<div className="scan-saved"><ShieldCheck size={16} /> Your scans are private</div>} /><div className="scan-layout"><section className="camera-panel"><div className="camera-topline"><span><span className="status-dot" /> Live camera</span><span className="camera-hint">Natural light works best</span></div><div className={`viewfinder ${cameraState === "blocked" ? "blocked" : ""}`}>{cameraState === "requesting" && <div className="camera-message"><div className="permission-loader"><Camera size={23} /></div><strong>Waking up your camera…</strong><span>Give permission when your browser asks.</span></div>}{cameraState === "blocked" && <div className="camera-message"><div className="permission-loader warning"><Camera size={23} /></div><strong>Camera access is off</strong><span>No worries — you can upload a close-up photo instead.</span><button className="light-outline-button" onClick={upload}><Upload size={16} /> Upload a photo</button></div>}{cameraState !== "blocked" && <video ref={videoRef} autoPlay playsInline muted className={`camera-video ${cameraState === "requesting" ? "video-hidden" : ""}`} />}{cameraState === "captured" && <div className="capture-flash" />}{cameraState === "live" && <><span className="corner top-left" /><span className="corner top-right" /><span className="corner bottom-left" /><span className="corner bottom-right" /><span className="scan-line" /><div className="frame-guidance"><span>Center the leaf in frame</span><small>Hold steady · Move closer</small></div></>}{cameraState === "captured" && !analyzing && <div className="captured-state"><Check size={24} /><span>Photo captured</span></div>}{analyzing && <div className="analyzing-state"><div className="analyzing-ring"><ScanLine size={20} /></div><strong>Reading your plant…</strong><span>Looking for visual markers</span></div>}</div><div className="camera-controls"><button className="flip-button" onClick={() => toast("Camera flipped — ready for the other side of the leaf.")}><ChevronRight size={20} /></button><button className="capture-button" onClick={capture} aria-label="Capture plant photo"><span /></button><button className="flip-button" onClick={upload} aria-label="Upload photo"><Upload size={19} /></button></div><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} hidden /><button className="upload-fallback" onClick={upload}><Upload size={16} /> Upload instead <span>JPG, PNG, or WEBP</span></button></section><section className="scan-form-panel"><div className="first-scan-note"><Lightbulb size={17} /><div><strong>New to plant scans?</strong><span>Use a close-up photo in natural light, with the leaf filling most of the frame.</span></div><button onClick={() => toast("Tip saved — you can find it in Help center anytime.")} aria-label="Dismiss tip"><X size={15} /></button></div><div className="form-block"><label htmlFor="plant-type">What are you scanning?</label><select id="plant-type" defaultValue="Tomato"><option>Tomato</option><option>Cucumber</option><option>Pepper</option><option>Herb or leafy green</option><option>Other plant</option></select></div><div className="form-block"><label htmlFor="notes">Anything else we should know? <span>Optional</span></label><Textarea id="notes" placeholder="For example: spots appeared after a rainy week…" /></div><div className="report-placeholder"><div className="placeholder-top"><span className="mini-label">YOUR REPORT</span><span className="placeholder-status">Waiting for a photo</span></div><div className="placeholder-icon"><FileText size={22} /></div><h3>Your plant report will appear here</h3><p>Capture a photo to see visual clues, an action plan, and prevention tips.</p><div className="placeholder-tabs"><span className="active">Visual clues</span><span>Action plan</span><span>Prevention tips</span></div></div><div className="scan-disclaimer"><ShieldCheck size={16} /><span>CropSense is a helpful first check, not a replacement for expert diagnosis in severe cases.</span></div></section></div></div></AppLayout>;
}

function ReportPage() {
  const [tab, setTab] = useState("Visual clues");
  const tabs = ["Visual clues", "Action plan", "Prevention tips"];
  return <AppLayout><div className="report-page"><Link href="/history" className="back-link"><ChevronLeft size={16} /> Back to scan history</Link><PageHeader eyebrow="SCAN REPORT · TODAY, 9:42 AM" title="Early blight" subtitle="Tomato · Bed 2" action={<StatusPill tone="watch">Watch closely</StatusPill>} /><div className="report-layout"><section className="report-main-card"><div className="annotated-image"><img src={reports[0].image} alt="Annotated tomato leaf showing early blight markers" /><div className="annotation annotation-one"><span>01</span><div><strong>Brown spots</strong><span>with yellow halos</span></div></div><div className="annotation annotation-two"><span>02</span><div><strong>Lower leaves</strong><span>showing first</span></div></div><div className="annotation-line line-one" /><div className="annotation-line line-two" /></div><div className="report-confidence"><div><span>AI confidence</span><strong>91%</strong></div><div className="confidence-track"><span style={{ width: "91%" }} /></div><span className="confidence-copy">High confidence based on 2 visual markers</span></div></section><aside className="report-summary-card"><span className="mini-label">QUICK READ</span><div className="summary-icon"><ShieldCheck size={21} /></div><h2>Early blight</h2><p>A common fungal disease that starts on older leaves and can spread upward if conditions stay damp.</p><div className="summary-divider" /><div className="summary-row"><span>First spotted</span><strong>Lower leaves</strong></div><div className="summary-row"><span>Spread risk</span><strong className="amber-text">Moderate</strong></div><div className="summary-row"><span>Best next step</span><strong>Remove affected leaves</strong></div><Link href="/scan" className="primary-button full-width"><ScanLine size={16} /> Scan another plant</Link></aside></div><section className="report-details"><div className="report-tabs">{tabs.map((item) => <button className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item}>{item}</button>)}</div>{tab === "Visual clues" && <div className="detail-content"><div className="detail-icon sage"><Search size={20} /></div><div><h3>What we noticed</h3><p>There are small brown spots with yellow halos on the lower leaves. This pattern is consistent with early blight, especially after periods of warm, wet weather.</p><p><strong>What makes us confident:</strong> the spots are concentrated on older foliage and have the distinct halo pattern CropSense looks for.</p></div></div>}{tab === "Action plan" && <div className="detail-content"><div className="detail-icon amber"><Zap size={20} /></div><div><h3>Do this today</h3><ol><li>Remove the affected lower leaves and place them in the trash — not the compost.</li><li>Water at soil level in the morning so foliage dries quickly.</li><li>Give neighboring plants a little more room for airflow.</li></ol></div></div>}{tab === "Prevention tips" && <div className="detail-content"><div className="detail-icon green"><ShieldCheck size={20} /></div><div><h3>Keep it from coming back</h3><p>Rotate tomatoes away from this bed next season, clear fallen leaves weekly, and avoid handling plants while they’re wet. A simple layer of mulch can also reduce soil splash.</p></div></div>}</section><DiagnosisChat /><div className="report-note"><CircleHelp size={17} /><span>Need a second opinion? CropSense is an early signal, not a clinical diagnosis. If symptoms spread quickly or the crop is valuable, contact your local extension office.</span></div></div></AppLayout>;
}

function HistoryPage() {
  const [query, setQuery] = useState("");
  const filtered = reports.filter((report) => `${report.plant} ${report.finding}`.toLowerCase().includes(query.toLowerCase()));
  return <AppLayout><div className="history-page"><PageHeader eyebrow="YOUR GREENHOUSE · 12 SCANS" title="Scan history" subtitle="A running record of what your plants have been telling you." action={<Link href="/scan" className="primary-button compact"><ScanLine size={16} /> New scan</Link>} /><div className="history-toolbar"><div className="history-search"><Search size={17} /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search plants or findings" /></div><button className="filter-button">All statuses <ChevronDown size={15} /></button></div><div className="history-table-wrap"><table className="history-table"><thead><tr><th>Plant</th><th>Finding</th><th>Date</th><th>Status</th><th><span className="sr-only">Open</span></th></tr></thead><tbody>{filtered.map((report) => <tr key={report.plant} onClick={() => window.location.href = "/report"}><td><div className="plant-cell"><img src={report.image} alt="" /><div><strong>{report.plant.split(" · ")[0]}</strong><span>{report.plant.split(" · ")[1]}</span></div></div></td><td><strong>{report.finding}</strong><span className="confidence-inline">{report.confidence}% confidence</span></td><td>{report.date}</td><td><StatusPill tone={report.tone}>{report.status}</StatusPill></td><td><ChevronRight size={18} /></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="empty-history"><Search size={22} /><strong>No scans found</strong><span>Try a different plant or finding.</span></div>}</div><div className="history-footer"><span>Showing {filtered.length} of 12 scans</span><div><button disabled><ChevronLeft size={16} /></button><button className="selected">1</button><button>2</button><button>3</button><button><ChevronRight size={16} /></button></div></div></div></AppLayout>;
}

function NotFound() { return <div className="not-found"><Logo /><h1>That growing path is empty.</h1><p>Let’s get you back to your greenhouse.</p><Link href="/app" className="primary-button">Open My Greenhouse <ArrowRight size={16} /></Link></div>; }

function App() {
  return <><Toaster position="bottom-right" /><Switch><Route path="/" component={LandingPage} /><Route path="/app" component={DashboardPage} /><Route path="/scan" component={ScanPage} /><Route path="/report" component={ReportPage} /><Route path="/history" component={HistoryPage} /><Route component={NotFound} /></Switch></>;
}

export default App;
