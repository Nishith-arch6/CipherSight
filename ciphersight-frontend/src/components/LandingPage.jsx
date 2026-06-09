import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import createGlobe from 'cobe';
import { ArrowRight, X, Menu, Ambulance, Power, ShieldCheck } from 'lucide-react';

import GridStatus from './GridStatus';
import SystemLogs from './SystemLogs';

// 🌍 3D GLOBE COMPONENT
const LogoGlobe = ({ className }) => {
  const canvasRef = useRef();

  useEffect(() => {
    let phi = 0;
    const isMobile = window.innerWidth < 768;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: isMobile ? 800 : 1200,
      height: isMobile ? 800 : 1200,
      phi: 0,
      theta: 0.1,
      dark: 1,
      diffuse: 1.2,
      mapSamples: isMobile ? 12000 : 25000,
      mapBrightness: 8,
      baseColor: [0.05, 0.05, 0.05],
      markerColor: [0.61, 0.0, 1.0],
      glowColor: [0.61, 0.0, 1.0],
      markers: [],
      onRender: (state) => {
        state.phi = phi;
        phi += 0.002;
      }
    });

    return () => globe.destroy();
  }, []);

  return (
    <div className={className} style={{ width: window.innerWidth < 768 ? '88px' : '208px', height: window.innerWidth < 768 ? '88px' : '208px', flexShrink: 0 }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
};

export default function LandingPage({ onStart }) {
  const [stage, setStage] = useState('init');
  const [loadingNumber, setLoadingNumber] = useState(0);

  // Overlay States
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const [authMode, setAuthMode] = useState('login');
  const [regSuccess, setRegSuccess] = useState(false);

  // Security State
  const [badgeId, setBadgeId] = useState('');
  const [passkey, setPasskey] = useState('');
  const [loginError, setLoginError] = useState('');

  const sirenAudio = useRef(typeof Audio !== "undefined" ? new Audio('/siren.mp3') : null);
  const heroCanvasRef = useRef();

  const handleInitiate = () => {
    if (sirenAudio.current) {
      sirenAudio.current.volume = 0.4;
      sirenAudio.current.load();
    }
    setStage('loading');
  };

  const handleCredentialsSubmit = async () => {
    if (authMode === 'register') {
      const alphanumericRegex = /^[a-zA-Z0-9-]+$/;
      if (!alphanumericRegex.test(badgeId) || !alphanumericRegex.test(passkey)) {
        setLoginError("Registration Failed: Badge ID and Passkey must be strictly alphanumeric.");
        return;
      }

      setLoginError('');
      try {
        const registerUrl = `http://${window.location.hostname}:5000/api/register`;
        const response = await fetch(registerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ badge: badgeId, passkey: passkey })
        });
        const data = await response.json();
        if (response.ok) {
          setAuthMode('login');
          setRegSuccess(true);
          setTimeout(() => setRegSuccess(false), 4000);
        } else {
          setLoginError(data.error || "Registration Failed. Badge ID may already exist.");
        }
      } catch (err) {
        setLoginError("CONNECTION TO SECURE SERVER FAILED.");
      }
      return;
    }

    setLoginError('');

    const backendUrl = `http://${window.location.hostname}:5000/api/login`;

    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badge: badgeId, passkey: passkey })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('cipher_token', data.token);
        setAuthMode('verified');
      } else {
        setLoginError(data.error || "Invalid Credentials");
      }
    } catch (err) {
      setLoginError("CONNECTION TO SECURE SERVER FAILED.");
    }
  };

  const closeAuthPanel = () => {
    setIsAuthOpen(false);
    setAuthMode('login');
    setRegSuccess(false);
    setLoginError('');
  };

  // 1. Loading Number Logic
  useEffect(() => {
    if (stage === 'loading') {
      const interval = setInterval(() => {
        setLoadingNumber((prev) => {
          const next = prev + 1;
          if (next >= 108) {
            clearInterval(interval);
            setTimeout(() => setStage('ambulance_reveal'), 500);
            return 108;
          }
          return next;
        });
      }, 35);
      return () => clearInterval(interval);
    }
  }, [stage]);

  // 2. PLAY AUDIO EXACTLY AT 108
  useEffect(() => {
    if (loadingNumber === 108 && stage === 'loading') {
      if (sirenAudio.current) {
        sirenAudio.current.play().catch((e) => console.log("Audio blocked:", e));
      }
    }
  }, [loadingNumber, stage]);

  // 3. Stage Transitions
  useEffect(() => {
    if (stage === 'ambulance_reveal') {
      const timer = setTimeout(() => setStage('intro'), 3500);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  useEffect(() => {
    if (stage === 'intro') {
      const timer = setTimeout(() => setStage('hero'), 4000);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  useEffect(() => {
    if (stage === 'hero' && heroCanvasRef.current) {
      const isMobile = window.innerWidth < 768;
      let phi = 0;
      const globe = createGlobe(heroCanvasRef.current, {
        devicePixelRatio: 2,
        width: 1200,
        height: 1200,
        phi: 0,
        theta: 0.1,
        dark: 1,
        diffuse: 1.2,
        mapSamples: isMobile ? 12000 : 30000,
        mapBrightness: 8,
        baseColor: [0.05, 0.05, 0.05],
        markerColor: [0.61, 0.0, 1.0],
        glowColor: [0.61, 0.0, 1.0],
        markers: [],
        onRender: (state) => {
          state.phi = phi;
          phi += 0.0015;
        }
      });
      return () => globe.destroy();
    }
  }, [stage]);

  const formattedNumber = loadingNumber.toString().padStart(3, '0');

  // 🚨 NEW: Validates if the current inputs are alphanumeric (plus hyphens) for the disabled button logic
  const isRegValid = /^[a-zA-Z0-9-]+$/.test(badgeId) && /^[a-zA-Z0-9-]+$/.test(passkey);

  return (
    <div className="relative w-full h-screen bg-[#050505] overflow-hidden font-sans text-white">

      {/* --- INITIALIZATION STAGE --- */}
      <AnimatePresence>
        {stage === 'init' && (
          <motion.div key="init" exit={{ opacity: 0, scale: 1.2 }} transition={{ duration: 0.8 }} className="absolute inset-0 z-60 flex flex-col items-center justify-center bg-[#050505]">
            <motion.button onClick={handleInitiate} animate={{ boxShadow: ["0px 0px 0px rgba(239,68,68,0)", "0px 0px 50px rgba(239,68,68,0.5)", "0px 0px 0px rgba(239,68,68,0)"] }} transition={{ duration: 2, repeat: Infinity }} className="w-48 h-48 rounded-full bg-red-600 border-4 border-red-800 flex flex-col items-center justify-center gap-4 hover:bg-red-500 hover:scale-105 transition-all cursor-pointer">
              <Power className="w-12 h-12 text-white" />
              <span className="font-black tracking-widest text-sm text-center px-4">INITIATE PREEMPTION</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- LOADING COUNTER STAGE --- */}
      <AnimatePresence>
        {stage === 'loading' && (
          <motion.div key="loader" exit={{ backgroundColor: "rgba(5,5,5,0)" }} transition={{ duration: 0.2 }} className="absolute inset-0 z-50 flex items-center justify-center bg-[#050505] overflow-hidden pointer-events-none">
            <motion.div exit={{ scale: 350, opacity: 0 }} transition={{ scale: { duration: 1.2, ease: "easeIn" }, opacity: { duration: 0.2, delay: 1.0 } }} className="relative flex justify-center items-center text-[12rem] md:text-[25rem] font-black text-[#9D00FF] leading-none tabular-nums transform origin-center">
              <span className="absolute right-full">{formattedNumber[0]}</span>
              <span className="relative z-10">{formattedNumber[1]}</span>
              <span className="absolute left-full">{formattedNumber[2]}</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- LOGO REVEAL STAGE --- */}
      <AnimatePresence>
        {stage === 'ambulance_reveal' && (
          <motion.div key="ambulance" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0, scale: 1.2, filter: "blur(10px)" }} transition={{ duration: 1.5, ease: "easeOut" }} className="absolute inset-0 z-40 flex items-center justify-center bg-[#050505]">
            <div className="flex items-center gap-6">
              <Ambulance className="w-20 h-20 md:w-32 md:h-32 text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)] scale-x-[-1]" />
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white">CIPHER<span className="text-[#9D00FF]">SIGHT</span></h1>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- 3D GLOBE INTRO STAGE --- */}
      <AnimatePresence>
        {stage === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.5, filter: "blur(10px)" }} transition={{ duration: 1.5, ease: "easeInOut" }} className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#050505]">
            <div className="flex items-center text-[6rem] md:text-[14rem] font-black tracking-tighter text-[#9D00FF] leading-none">
              <span>CIPH</span>
              <LogoGlobe className="-mx-2 md:-mx-5 relative z-10 pointer-events-none mix-blend-screen" />
              <span>R</span>
            </div>
            <motion.span initial={{ opacity: 0, letterSpacing: "0px" }} animate={{ opacity: 1, letterSpacing: window.innerWidth < 768 ? "15px" : "30px" }} transition={{ delay: 0.5, duration: 1.5, ease: "easeOut" }} className="text-3xl md:text-6xl font-black text-white -mt-2 md:-mt-4 ml-4 md:ml-8">
              SIGHT
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MAIN HERO STAGE --- */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: stage === 'hero' ? 1 : 0 }} transition={{ duration: 1.5, delay: 0.2, ease: "easeInOut" }} className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#050505]">

        {/* Header Navigation */}
        <header className="absolute top-0 w-full p-6 md:p-8 flex justify-between items-center z-50">
          <div className="font-black text-xl md:text-2xl tracking-tighter flex items-center gap-2">CIPHER <span className="text-[#9D00FF]">SIGHT</span></div>
          <nav className="hidden md:flex gap-8 text-xs font-bold tracking-widest uppercase">
            <button onClick={() => setShowGrid(true)} className="hover:text-[#9D00FF] transition-colors cursor-pointer">Grid Status</button>
            <button onClick={() => setShowLogs(true)} className="hover:text-[#9D00FF] transition-colors cursor-pointer">System Logs</button>
            <button onClick={() => setIsAuthOpen(true)} className="text-[#9D00FF] hover:text-white transition-colors cursor-pointer">Operator Login</button>
          </nav>
          <button onClick={() => setIsAuthOpen(true)} className="md:hidden p-2 text-white cursor-pointer"><Menu className="w-6 h-6" /></button>
        </header>

        {/* Hero Background Globe */}
        {stage === 'hero' && (
          <motion.div animate={{ x: isAuthOpen ? (window.innerWidth < 768 ? "-30%" : "-33%") : "-32%", y: "-85%", scale: isAuthOpen ? 2.0 : 1.8, opacity: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} className="absolute top-[35%] left-1/2 w-[200vw] h-[200vw] md:w-[100vw] md:h-[100vw] z-10 pointer-events-none mix-blend-screen opacity-70 md:opacity-90">
            <canvas ref={heroCanvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          </motion.div>
        )}

        {/* Title Text */}
        <div className="absolute w-full px-4 text-center z-30 flex flex-col items-center justify-center mt-[-10vh] md:mt-0 pointer-events-none">
          <motion.h1 initial={{ y: 50, opacity: 0 }} animate={{ y: stage === 'hero' && !isAuthOpen ? 0 : 50, opacity: stage === 'hero' && !isAuthOpen ? 1 : 0 }} transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }} className="text-[15vw] leading-[0.9] md:text-[7.5vw] font-black tracking-tighter md:leading-[0.85] flex flex-col mix-blend-difference">
            <span className="text-white">URBAN TRAFFIC</span>
            <span className="text-[#9D00FF]">PREEMPTION GRID</span>
          </motion.h1>
        </div>

        {/* Action Button */}
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: stage === 'hero' && !isAuthOpen ? 0 : 30, opacity: stage === 'hero' && !isAuthOpen ? 1 : 0 }} transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }} className="absolute bottom-8 md:bottom-12 flex flex-col z-40 w-full px-6 md:w-auto md:px-0 items-center justify-center">
          <button onClick={() => setIsAuthOpen(true)} className="w-full md:w-auto px-12 py-4 bg-white text-black text-sm font-bold rounded-full flex items-center justify-center gap-3 hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)] tracking-widest cursor-pointer">
            REQUEST CLEARANCE <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </motion.div>

      {/* --- OVERLAYS --- */}
      <AnimatePresence>
        {showGrid && <GridStatus onClose={() => setShowGrid(false)} />}
        {showLogs && <SystemLogs onClose={() => setShowLogs(false)} />}
      </AnimatePresence>

      {/* --- AUTHENTICATION PANEL --- */}
      <AnimatePresence>
        {isAuthOpen && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="absolute top-0 right-0 w-full md:w-1/2 h-full bg-[#050505]/95 backdrop-blur-3xl z-150 p-6 md:p-12 flex flex-col justify-center border-l border-[#1a1a1a] shadow-[-30px_0_50px_rgba(0,0,0,0.8)] overflow-y-auto">

            <button onClick={closeAuthPanel} className="absolute top-6 right-6 md:top-8 md:right-8 p-3 bg-[#111] border border-[#222] rounded-full hover:scale-105 transition-transform shadow-lg z-50 cursor-pointer text-white hover:border-[#9D00FF]">
              <X className="w-5 h-5" />
            </button>

            <div className="max-w-md w-full mx-auto flex flex-col items-center relative z-10 pt-16 md:pt-0">
              <h2 className="text-[1.3rem] font-black tracking-[0.15em] mb-2 text-white uppercase drop-shadow-md text-center">
                {authMode === 'login' && 'OPERATOR LOGIN'}
                {authMode === 'register' && 'OPERATOR REGISTRATION'}
                {authMode === 'verified' && 'ACCESS GRANTED'}
              </h2>

              <div className="h-6 mb-4 text-center">
                <AnimatePresence>
                  {regSuccess && (
                    <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-emerald-400 text-xs font-bold tracking-widest uppercase">
                      Registration Complete. Please Login.
                    </motion.p>
                  )}
                  {loginError && (
                    <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-red-500 text-xs font-bold tracking-widest uppercase">
                      {loginError}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {authMode !== 'verified' ? (
                <motion.div key="forms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col items-center">

                  <AnimatePresence>
                    {authMode === 'register' && (
                      <motion.input
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: '1rem' }} exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        type="text" placeholder="Operator Full Name"
                        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white placeholder:text-[#666] px-6 py-4 rounded-full focus:outline-none focus:border-[#9D00FF] font-bold tracking-wide text-center transition-all shadow-inner"
                      />
                    )}
                  </AnimatePresence>

                  {/* 🚨 NEW: Real-time filtering in the onChange handlers */}
                  <input
                    type="text"
                    placeholder="Badge ID (Try: OP-108)"
                    value={badgeId}
                    onChange={(e) => {
                      if (authMode === 'register') {
                        setBadgeId(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''));
                      } else {
                        setBadgeId(e.target.value);
                      }
                    }}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white placeholder:text-[#666] px-6 py-4 rounded-full mb-4 focus:outline-none focus:border-[#9D00FF] font-bold tracking-wide text-center transition-all shadow-inner"
                  />
                  <input
                    type="password"
                    placeholder="Passkey (Try: cipher2026)"
                    value={passkey}
                    onChange={(e) => {
                      if (authMode === 'register') {
                        setPasskey(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''));
                      } else {
                        setPasskey(e.target.value);
                      }
                    }}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white placeholder:text-[#666] px-6 py-4 rounded-full mb-6 focus:outline-none focus:border-[#9D00FF] font-bold tracking-wide text-center transition-all shadow-inner"
                  />

                  {/* 🚨 NEW: Button becomes disabled and greyed out if fields are invalid during registration */}
                  <button
                    onClick={handleCredentialsSubmit}
                    disabled={authMode === 'register' && !isRegValid}
                    className={`w-full bg-white text-black font-black tracking-widest px-6 py-4 rounded-full flex items-center justify-center gap-2 transition-all mb-8 shadow-[0_0_20px_rgba(255,255,255,0.1)] uppercase ${authMode === 'register' && !isRegValid ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200 hover:scale-[1.02] cursor-pointer'}`}
                  >
                    {authMode === 'login' ? 'AUTHENTICATE' : 'REGISTER CLEARANCE'} <ArrowRight className="w-5 h-5" />
                  </button>

                  <div className="w-full pt-4 text-center">
                    <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setRegSuccess(false); setLoginError(''); }} className="text-gray-500 hover:text-white text-[10px] font-bold tracking-widest uppercase transition-colors underline underline-offset-4 cursor-pointer">
                      {authMode === 'login' ? 'First Time Operator? Register Here' : 'Return to Operator Login'}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full flex flex-col items-center">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 mt-4 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                    <ShieldCheck className="w-10 h-10 text-emerald-400" />
                  </div>
                  <p className="text-emerald-400 font-bold tracking-widest uppercase mb-10 text-xs text-center">
                    Credentials Verified.<br />Secure connection established.
                  </p>
                  <button onClick={() => onStart(badgeId)} className="w-full bg-[#9D00FF] text-white font-black tracking-widest px-6 py-4 rounded-full flex items-center justify-center gap-3 hover:bg-[#8000cc] hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(157,0,255,0.4)] cursor-pointer uppercase">
                    INITIALIZE DASHBOARD <ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}