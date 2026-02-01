'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Heart, Sparkles, User, UserCircle, ArrowRight, Share2, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import emailjs from '@emailjs/browser';

type Step = 'setup' | 'gender' | 'link' | 'ask' | 'celebrate';
type Gender = 'male' | 'female' | null;

function ValentineContent() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>('setup');
  const [senderName, setSenderName] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [gender, setGender] = useState<Gender>(null);
  const [noButtonStyle, setNoButtonStyle] = useState<React.CSSProperties>({});
  const [noCount, setNoCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [isNoButtonVisible, setIsNoButtonVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [backgroundHearts, setBackgroundHearts] = useState<{ id: number; top: string; left: string; duration: number }[]>([]);

  useEffect(() => {
    setIsMounted(true);
    // Generate hearts only on client side after mount
    const hearts = [...Array(15)].map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      duration: 5 + Math.random() * 5
    }));
    setBackgroundHearts(hearts);
  }, []);

  // eslint-disable-next-line
  useEffect(() => {
    const data = searchParams.get('d');

    if (data) {
      try {
        // Decode obfuscated data
        const decoded = JSON.parse(atob(data));
        if (step === 'setup' && decoded.from && decoded.to && (decoded.g === 'male' || decoded.g === 'female')) {
          setSenderName(decoded.from);
          setReceiverName(decoded.to);
          setSenderEmail(decoded.email || '');
          setSenderPhone(decoded.phone || '');
          setGender(decoded.g);
          setStep('ask');
        }
      } catch {
        console.error("Failed to decode URL parameters");
      }
    }
  }, [searchParams, step]);

  // Handle Cameroon-specific phone formatting
  const getFormattedPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, ''); // Remove all non-digits
    if (cleaned.length === 9 && (cleaned.startsWith('6') || cleaned.startsWith('2'))) {
      return `+237${cleaned}`;
    }
    // If it already has 237 but no +, add the +
    if (cleaned.startsWith('237') && cleaned.length === 12) {
      return `+${cleaned}`;
    }
    return phone.startsWith('+') ? phone : `+${phone}`;
  };

  const moveButton = useCallback(() => {
    if (!isNoButtonVisible) return;
    setIsNoButtonVisible(false);

    setTimeout(() => {
      if (typeof window === 'undefined') return;

      // Mobile-optimized dimensions for calculation
      const isMobile = window.innerWidth < 768;
      // Adjusted button dimensions for mobile to match new larger size
      // Width estimated based on text "Non" + padding with text-lg
      const buttonWidth = isMobile ? 150 : 160;
      const buttonHeight = isMobile ? 55 : 70;

      // Safe margins to prevent going off-screen
      const margin = 30; // Increased margin for strict safety
      const safeAreaTop = 100; // Avoid top area where title/heart usually are

      // Calculate strict boundaries
      const minX = margin;
      const maxX = window.innerWidth - buttonWidth - margin;

      const minY = safeAreaTop;
      const maxY = window.innerHeight - buttonHeight - margin;

      // Ensure valid ranges (if screen is too small, fallback to min)
      const validMaxX = Math.max(minX, maxX);
      const validMaxY = Math.max(minY, maxY);

      const randomX = minX + Math.random() * (validMaxX - minX);
      const randomY = minY + Math.random() * (validMaxY - minY);

      setNoButtonStyle({
        position: 'fixed',
        left: `${randomX}px`,
        top: `${randomY}px`,
        zIndex: 100,
      });
      setNoCount((prev) => prev + 1);
      setIsNoButtonVisible(true);
    }, 20);
  }, [isNoButtonVisible]);

  const handleYes = () => {
    // Fire and forget email notification
    console.log("Attempting to send email to:", senderEmail); // Debug log
    if (senderEmail) {
      emailjs.send(
        'cupidon', // Replace with user's Service ID
        'template_2pw9cwa', // Replace with user's Template ID
        {
          to_name: senderName,
          to_email: senderEmail,
          from_name: receiverName,
          message: `${receiverName} a dit OUI ! 🎉 C'est un match !`
        },
        '85q6pISTnSm_vdZzu' // Replace with user's Public Key
      ).then(
        () => console.log("EmailJS Success"),
        (err) => console.error("EmailJS Failed:", JSON.stringify(err))
      );
    }

    setStep('celebrate');
    const count = 150;
    const defaults = { origin: { y: 0.7 }, colors: ['#ff0000', '#ff69b4', '#ff1493', '#db7093'] };
    const fire = (ratio: number, opts: object) => confetti({ ...defaults, ...opts, particleCount: Math.floor(count * ratio) });
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
    const end = Date.now() + 4000;
    const frame = () => {
      confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#ff0000', '#ff69b4'] });
      confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#ff0000', '#ff69b4'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  const generateLink = () => {
    if (!senderName || !receiverName || !gender) return;
    const baseUrl = window.location.origin + window.location.pathname;
    const formattedPhone = getFormattedPhone(senderPhone);

    // Obfuscate data
    const data = btoa(JSON.stringify({
      from: senderName,
      to: receiverName,
      email: senderEmail,
      phone: formattedPhone,
      g: gender
    }));

    const link = `${baseUrl}?d=${data}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const messages = ["S'il te plaît ?", "Tu es sûre ?", "Vraiment ?", "Réfléchis encore !", "Je vais pleurer...", "Tu es méchante !", "Allez, dis oui !", "C'est ton dernier mot ?"];

  return (
    <div className="min-h-screen hearts-bg flex flex-col items-center justify-center p-4 overflow-hidden relative bg-gradient-to-br from-rose-50 to-pink-100 font-sans">
      <AnimatePresence mode="wait">
        {step === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-sm bg-white/90 backdrop-blur-sm p-6 md:p-8 rounded-3xl shadow-2xl space-y-6 z-10 border border-pink-100">
            <div className="text-center space-y-2">
              <Heart className="w-10 h-10 text-pink-500 mx-auto fill-pink-500" />
              <h1 className="text-2xl md:text-3xl font-dancing font-bold text-rose-600">Cupidon ❤️</h1>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-rose-400 uppercase ml-2 mb-1 block">Ton nom</label>
                <input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Ex: Jean" className="w-full px-5 py-3 rounded-2xl border-2 border-pink-50 outline-none text-base focus:border-pink-300 transition-all bg-white/50" />
              </div>
              <div>
                <label className="text-xs font-bold text-rose-400 uppercase ml-2 mb-1 block">Son nom </label>
                <input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} placeholder="Ex: Marie" className="w-full px-5 py-3 rounded-2xl border-2 border-pink-50 outline-none text-base focus:border-pink-300 transition-all bg-white/50" />
              </div>
              <div>
                <label className="text-xs font-bold text-rose-400 uppercase ml-2 mb-1 block">Ton Email (pour la notif)</label>
                <input type="email" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} placeholder="Ex: jean@mail.com" className="w-full px-5 py-3 rounded-2xl border-2 border-pink-50 outline-none text-base focus:border-pink-300 transition-all bg-white/50" />
              </div>
              <div>
                <label className="text-xs font-bold text-rose-400 uppercase ml-2 mb-1 block">Ton WhatsApp (9 chiffres)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">+237</span>
                  <input value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} placeholder="6..." className="w-full pl-16 pr-5 py-3 rounded-2xl border-2 border-pink-50 outline-none text-base focus:border-pink-300 transition-all bg-white/50" />
                </div>
              </div>
              <button
                onClick={() => senderName && receiverName && setStep('gender')}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 mt-2 active:scale-95 transition-transform"
              >
                Continuer <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'gender' && (
          <motion.div key="gender" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center space-y-8 md:space-y-12 z-10 w-full">
            <h1 className="text-3xl md:text-5xl font-dancing font-bold text-rose-600 px-4">Quel est le genre de {receiverName} ?</h1>
            <div className="flex gap-6 md:gap-12 justify-center px-4">
              <button onClick={() => { setGender('male'); setStep('link'); }} className="flex flex-col items-center gap-4 group flex-1 max-w-[150px]">
                <div className="w-full aspect-square bg-white rounded-3xl shadow-xl border-4 border-pink-50 group-hover:border-pink-300 transition-all flex items-center justify-center"><User className="w-12 h-12 md:w-16 md:h-16 text-blue-400" /></div>
                <span className="text-lg md:text-xl font-bold text-rose-500">HOMME</span>
              </button>
              <button onClick={() => { setGender('female'); setStep('link'); }} className="flex flex-col items-center gap-4 group flex-1 max-w-[150px]">
                <div className="w-full aspect-square bg-white rounded-3xl shadow-xl border-4 border-pink-50 group-hover:border-pink-300 transition-all flex items-center justify-center"><UserCircle className="w-12 h-12 md:w-16 md:h-16 text-pink-400" /></div>
                <span className="text-lg md:text-xl font-bold text-rose-500">FEMME</span>
              </button>
            </div>
          </motion.div>
        )}

        {step === 'link' && (
          <motion.div key="link" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-sm bg-white/90 backdrop-blur-sm p-6 md:p-8 rounded-3xl shadow-2xl space-y-6 z-10 border border-pink-100 text-center">
            <div className="space-y-4">
              <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-10 h-10 text-pink-500" />
              </div>
              <h2 className="text-2xl font-dancing font-bold text-rose-600">C&apos;est presque prêt !</h2>
              <p className="text-gray-600 text-sm">Tes informations ont été enregistrées. Clique sur le bouton ci-dessous pour générer ton lien personnalisé et l&apos;envoyer à {receiverName}.</p>
            </div>

            <button
              onClick={generateLink}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 mt-4 active:scale-95 transition-transform"
            >
              {copied ? <><Check className="w-5 h-5" /> Lien Copié !</> : <><Share2 className="w-5 h-5" /> Générer & Copier le lien</>}
            </button>

            {copied && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-500 font-bold text-sm">
                Lien copié dans le presse-papier !
              </motion.p>
            )}

            <p className="text-xs text-gray-400 italic mt-4">
              Envoie ensuite ce lien à {receiverName} pour qu&apos;il/elle puisse répondre.
            </p>
          </motion.div>
        )}

        {step === 'ask' && (
          <motion.div key="ask" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }} className="text-center space-y-8 md:space-y-12 z-10 w-full max-w-lg">
            {/* Remove the separate Share button as it's now in the 'link' step flow */}
            <div className="space-y-6 px-4">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="flex justify-center"><Heart className="w-20 h-20 md:w-24 md:h-24 text-pink-500 fill-pink-500 drop-shadow-lg" /></motion.div>
              <h1 className="text-4xl md:text-6xl font-dancing font-bold text-rose-600 leading-tight">{receiverName}, veux-tu être {gender === 'male' ? "le Valentin" : "la Valentine"} de {senderName} ?</h1>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 px-4 mt-8">
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleYes} className="w-full md:w-auto bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold py-3 md:py-5 px-6 md:px-12 rounded-full text-lg md:text-2xl shadow-2xl border-4 border-white flex items-center justify-center gap-3">OUI ! <Sparkles className="w-6 h-6" /></motion.button>
              <AnimatePresence>
                {isNoButtonVisible && (
                  <motion.button
                    key="no-button"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.05 }}
                    style={noButtonStyle}
                    onMouseEnter={moveButton}
                    onClick={moveButton}
                    className="min-w-[150px] md:min-w-0 bg-gradient-to-r from-pink-400 to-rose-500 text-white font-bold py-3 md:py-5 px-6 md:px-12 rounded-full text-lg md:text-2xl shadow-xl border-4 border-white whitespace-nowrap"
                  >
                    {noCount > 0 ? messages[(noCount - 1) % messages.length] : "Non"}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {step === 'celebrate' && (
          <motion.div key="celebrate" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 z-20 w-full px-4">
            <motion.div animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}><Heart className="w-32 h-32 md:w-40 md:h-40 text-rose-600 fill-rose-600 mx-auto drop-shadow-2xl" /></motion.div>
            <h2 className="text-5xl md:text-8xl font-dancing font-bold text-rose-600">Génial ! ❤️</h2>
            <p className="text-2xl md:text-4xl text-rose-700 font-bold italic block">{senderName} & {receiverName} pour toujours !</p>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 }} className="pt-6">
              <a
                href={`https://wa.me/${senderPhone}?text=${encodeURIComponent(`OUI ! J'ai dit OUI ! J'accepte d'être ta ${gender === 'male' ? 'Valentin' : 'Valentine'} ! ❤️`)}`}
                target="_blank" rel="noopener noreferrer"
                className="bg-[#25D366] text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto w-full max-w-xs"
              >
                <Share2 className="w-6 h-6" /> Répondre à {senderName}
              </a>
              <p className="text-rose-500 mt-4 text-xs font-bold uppercase tracking-widest">Cliquez pour confirmer sur WhatsApp</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isMounted && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {backgroundHearts.map((heart) => (
            <motion.div
              key={heart.id}
              className="absolute text-pink-200 opacity-20 text-3xl"
              initial={{ top: heart.top, left: heart.left }}
              animate={{ y: [-20, 20, -20], rotate: [0, 360] }}
              transition={{ duration: heart.duration, repeat: Infinity }}
            >
              ❤️
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ValentinePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-pink-50 flex items-center justify-center"><Heart className="w-12 h-12 text-pink-500 animate-pulse" /></div>}>
      <ValentineContent />
    </Suspense>
  );
}