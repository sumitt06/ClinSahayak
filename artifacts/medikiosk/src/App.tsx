import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Link, Router as WouterRouter, useLocation } from 'wouter';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  FileText,
  HeartPulse,
  KeyRound,
  Languages,
  LayoutDashboard,
  Mic,
  Pencil,
  ScanLine,
  Search,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  UserPlus,
  UserRound,
  Volume2,
  X,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import './index.css';

const queryClient = new QueryClient();
type Pathway = 'chest' | 'abdomen' | 'diabetes';
type KioskStep = 'language' | 'details' | 'complaint' | 'questions' | 'review' | 'scan' | 'summary';
type Answers = Record<string, string>;

type Question = {
  id: string;
  title: string;
  hindi: string;
  options: string[];
  helper?: string;
};

const pathways: Record<Pathway, { label: string; hindi: string; icon: ReactNode; detail: string; questions: Question[] }> = {
  chest: {
    label: 'Chest discomfort',
    hindi: 'सीने में तकलीफ़',
    icon: <HeartPulse size={28} strokeWidth={1.8} />,
    detail: 'Pain, pressure, heaviness or unusual discomfort',
    questions: [
      { id: 'onset', title: 'When did it begin?', hindi: 'यह कब शुरू हुआ?', options: ['Today', '1–3 days ago', 'More than 3 days ago'] },
      { id: 'severity', title: 'How strong is it right now?', hindi: 'अभी तकलीफ़ कितनी तेज़ है?', options: ['Mild', 'Moderate', 'Severe'] },
      { id: 'breathing', title: 'Are you having trouble breathing?', hindi: 'क्या सांस लेने में तकलीफ़ है?', options: ['No', 'Yes'], helper: 'Choose “Yes” even if it comes and goes.' },
      { id: 'spread', title: 'Does it move to your arm, jaw or back?', hindi: 'क्या यह बांह, जबड़े या पीठ तक जाती है?', options: ['No', 'Yes', 'Not sure'] },
    ],
  },
  abdomen: {
    label: 'Abdominal pain',
    hindi: 'पेट में दर्द',
    icon: <Activity size={28} strokeWidth={1.8} />,
    detail: 'Pain, cramps, bloating or discomfort in the stomach area',
    questions: [
      { id: 'onset', title: 'When did it begin?', hindi: 'यह कब शुरू हुआ?', options: ['Today', '1–3 days ago', 'More than 3 days ago'] },
      { id: 'severity', title: 'How strong is it right now?', hindi: 'अभी दर्द कितना तेज़ है?', options: ['Mild', 'Moderate', 'Severe'] },
      { id: 'vomiting', title: 'Have you vomited or felt unable to keep food down?', hindi: 'क्या उल्टी हुई या खाना नहीं रुक रहा?', options: ['No', 'Yes'] },
      { id: 'fever', title: 'Do you have a fever?', hindi: 'क्या आपको बुखार है?', options: ['No', 'Yes', 'Not sure'] },
    ],
  },
  diabetes: {
    label: 'Diabetes follow-up',
    hindi: 'मधुमेह की जांच',
    icon: <ClipboardCheck size={28} strokeWidth={1.8} />,
    detail: 'Medicine review, sugar readings or diabetes-related concerns',
    questions: [
      { id: 'onset', title: 'What brings you in today?', hindi: 'आज आप किस लिए आए हैं?', options: ['Routine follow-up', 'New concern', 'Medicine question'] },
      { id: 'reading', title: 'Have you checked your blood sugar recently?', hindi: 'क्या आपने हाल में शुगर जांची है?', options: ['Yes', 'No', 'Not sure'] },
      { id: 'dizzy', title: 'Have you felt shaky, sweaty or dizzy?', hindi: 'क्या घबराहट, पसीना या चक्कर आए?', options: ['No', 'Yes'] },
      { id: 'medicines', title: 'Have you taken your medicines as usual?', hindi: 'क्या दवाएं सामान्य रूप से ली हैं?', options: ['Yes', 'No', 'Not sure'] },
    ],
  },
};

const demoCases = [
  { id: 'MK-1048', name: 'Ravi Mehta', age: 54, issue: 'Chest discomfort', time: '08:42', priority: 'Prompt review', initials: 'RM', status: 'Awaiting review' },
  { id: 'MK-1047', name: 'Asha Kulkarni', age: 38, issue: 'Diabetes follow-up', time: '08:31', priority: 'Routine', initials: 'AK', status: 'Confirmed' },
  { id: 'MK-1046', name: 'Imran Shaikh', age: 29, issue: 'Abdominal pain', time: '08:05', priority: 'Routine', initials: 'IS', status: 'Awaiting review' },
];

function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={`flex items-center gap-2.5 ${inverse ? 'text-[#f7f8f3]' : 'text-[#173543]'}`}>
      <span className={`relative grid h-9 w-9 place-items-center rounded-xl ${inverse ? 'bg-[#75d5c1] text-[#173543]' : 'bg-[#16665f] text-[#f7f8f3]'}`} aria-hidden="true">
        <span className="absolute h-5 w-1.5 rounded-full bg-current" />
        <span className="absolute h-1.5 w-5 rounded-full bg-current" />
      </span>
      <span className="font-display text-[1.18rem] font-bold tracking-[-.04em]">CLINBRIDGE</span>
    </span>
  );
}

function Button({ children, variant = 'primary', className = '', ...props }: { children: ReactNode; variant?: 'primary' | 'secondary' | 'quiet' | 'danger'; className?: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: 'bg-[#16665f] text-[#f7f8f3] shadow-[0_8px_18px_rgba(22,102,95,.16)] hover:bg-[#104f4a]',
    secondary: 'border border-[#b8d7d0] bg-[#e4f2ef] text-[#164e4a] hover:bg-[#d7ebe6]',
    quiet: 'text-[#49636a] hover:bg-[#e9eee9] hover:text-[#173543]',
    danger: 'border border-[#e3b0a7] bg-[#fff0eb] text-[#a34234] hover:bg-[#ffe5de]',
  }[variant];
  return <button className={`focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition duration-200 ${styles} ${className}`} {...props}>{children}</button>;
}

function KioskHeader({ onExit, step }: { onExit: () => void; step: KioskStep }) {
  const labels: Record<KioskStep, string> = { language: 'Let’s begin', details: 'About you', complaint: 'What brings you in?', questions: 'A few questions', review: 'Quick review', scan: 'Previous records', summary: 'Your intake note' };
  return (
    <header className="border-b border-[#dce5df] bg-[#f8faf5]/90 px-5 py-4 backdrop-blur md:px-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <button onClick={onExit} data-testid="button-kiosk-home" className="focus-ring rounded-lg" aria-label="Return to MediKiosk home"><Brand /></button>
        <div className="hidden text-center sm:block">
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6b8485]">Patient intake</p>
          <p className="font-display text-sm font-semibold text-[#173543]">{labels[step]}</p>
        </div>
        <button data-testid="button-kiosk-language" className="focus-ring flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-[#37636a] hover:bg-[#e8efea]"><Languages size={17} /> English <ChevronRight size={14} /></button>
      </div>
    </header>
  );
}

function Progress({ step }: { step: KioskStep }) {
  const labels = ['Start', 'About you', 'Concern', 'Questions', 'Review'];
  const index = Math.min(4, Math.max(0, ['language', 'details', 'complaint', 'questions', 'review', 'scan', 'summary'].indexOf(step)));
  return (
    <div className="mb-9 flex items-center gap-2" aria-label={`Step ${index + 1} of 5`}>
      {labels.map((label, i) => <div key={label} className="flex min-w-0 flex-1 items-center gap-2">
        <div className={`h-2 flex-1 rounded-full transition-all duration-500 ${i <= index ? 'bg-[#16665f]' : 'bg-[#d7e4df]'}`} />
        {i === index && <span className="hidden whitespace-nowrap text-[11px] font-bold text-[#42666a] sm:inline">{label}</span>}
      </div>)}
    </div>
  );
}

function KioskLayout({ children, onExit, step }: { children: ReactNode; onExit: () => void; step: KioskStep }) {
  return <div className="kiosk-shell min-h-[100dvh]"><KioskHeader onExit={onExit} step={step} /><main className="mx-auto max-w-4xl px-5 py-8 md:px-10 md:py-12"><Progress step={step} />{children}</main><footer className="mx-auto flex max-w-4xl items-center gap-2 px-5 pb-8 text-xs text-[#6e8584] md:px-10"><ShieldCheck size={15} /> Your answers stay on this kiosk in this prototype. No diagnosis is made here.</footer></div>;
}

function Landing({ go }: { go: (path: string) => void }) {
  return (
    <div className="kiosk-shell min-h-[100dvh]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-10">
        <Link href="/" className="focus-ring rounded-lg" data-testid="link-home-brand"><Brand /></Link>
        <div className="flex items-center gap-2">
          <Link href="/mediweb" data-testid="link-mediweb" className="focus-ring rounded-lg px-3 py-2 text-sm font-bold text-[#4b676b] hover:bg-[#e9eee9]">About MediWeb</Link>
          <Button onClick={() => go('/doctor')} variant="secondary" className="hidden min-h-10 px-4 sm:inline-flex" data-testid="button-open-doctor">Doctor portal</Button>
        </div>
      </nav>
      <main className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-14 pt-8 md:grid-cols-[1.03fr_.97fr] md:px-10 md:pb-24 md:pt-16">
        <section className="animate-enter-up">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#b9d8d1] bg-[#e7f3ef] px-3 py-1.5 text-xs font-bold tracking-wide text-[#16665f]"><span className="h-2 w-2 rounded-full bg-[#75cdb9]" /> A calmer start to your OPD visit</div>
          <h1 className="text-balance max-w-2xl font-display text-[clamp(3.2rem,8vw,6.7rem)] font-bold leading-[.93] tracking-[-.075em] text-[#173543]">One bridge for<br /><span className="text-[#16665f]">better first notes.</span></h1>
          <p className="mt-7 max-w-lg text-lg leading-8 text-[#536c71]">CLINBRIDGE connects patients and doctors through one clearer clinical history workflow — whether you prefer a kiosk, a web experience, or a doctor workspace.</p>
          <div className="mt-9">
            <p className="mb-3 text-sm font-bold text-[#35585e]">Choose how you want to continue</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button onClick={() => go('/account')} data-testid="button-create-account" className="focus-ring group flex min-h-20 items-center gap-3 rounded-2xl border-2 border-[#16665f] bg-[#e8f4f0] px-4 text-left transition hover:-translate-y-0.5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#16665f] text-[#f7f8f3]"><UserPlus size={20} /></span>
                <span className="flex-1"><span className="block font-display text-sm font-bold text-[#173543]">Create account</span><span className="mt-1 block text-xs text-[#5d7779]">Set up your patient profile</span></span>
                <ArrowRight size={17} className="text-[#16665f] transition group-hover:translate-x-1" />
              </button>
              <button onClick={() => go('/auth/medikiosk')} data-testid="button-open-kiosk-login" className="focus-ring group flex min-h-20 items-center gap-3 rounded-2xl border border-[#cedfd8] bg-[#f9fbf7] px-4 text-left transition hover:-translate-y-0.5 hover:border-[#8fc5b8]">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#dcefe9] text-[#16665f]"><HeartPulse size={20} /></span>
                <span className="flex-1"><span className="block font-display text-sm font-bold text-[#173543]">MediKiosk</span><span className="mt-1 block text-xs text-[#5d7779]">Assisted voice + touch intake</span></span>
                <ArrowRight size={17} className="text-[#16665f] transition group-hover:translate-x-1" />
              </button>
              <button onClick={() => go('/auth/mediweb')} data-testid="button-open-mediweb-login" className="focus-ring group flex min-h-20 items-center gap-3 rounded-2xl border border-[#cedfd8] bg-[#f9fbf7] px-4 text-left transition hover:-translate-y-0.5 hover:border-[#8fc5b8]">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e8efea] text-[#16665f]"><FileText size={20} /></span>
                <span className="flex-1"><span className="block font-display text-sm font-bold text-[#173543]">MediWeb</span><span className="mt-1 block text-xs text-[#5d7779]">Self-service web intake</span></span>
                <ArrowRight size={17} className="text-[#16665f] transition group-hover:translate-x-1" />
              </button>
              <button onClick={() => go('/doctor')} data-testid="button-open-doctor-dashboard" className="focus-ring group flex min-h-20 items-center gap-3 rounded-2xl border border-[#cedfd8] bg-[#f9fbf7] px-4 text-left transition hover:-translate-y-0.5 hover:border-[#8fc5b8]">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#fff0db] text-[#9c632d]"><Stethoscope size={20} /></span>
                <span className="flex-1"><span className="block font-display text-sm font-bold text-[#173543]">Doctor dashboard</span><span className="mt-1 block text-xs text-[#5d7779]">Review structured histories</span></span>
                <ArrowRight size={17} className="text-[#16665f] transition group-hover:translate-x-1" />
              </button>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-semibold text-[#668082]"><span className="flex items-center gap-2"><Volume2 size={15} /> English + Hindi</span><span className="flex items-center gap-2"><UserRound size={15} /> No medical jargon</span><span className="flex items-center gap-2"><Clock3 size={15} /> About 3 minutes</span></div>
        </section>
        <section className="animate-enter-up-delay relative">
          <div className="absolute -right-6 -top-8 h-40 w-40 rounded-full bg-[#f2c48e]/20 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-[#d1e2dc] bg-[#f7fbf7] p-3 shadow-[0_24px_55px_rgba(22,73,73,.12)]">
            <div className="grid-paper rounded-[1.45rem] border border-[#d9e8e1] bg-[#edf5ef] p-5 md:p-7">
              <div className="flex items-center justify-between border-b border-[#cfdfd8] pb-5"><div className="flex items-center gap-2.5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#16665f] text-[#f7f8f3]"><HeartPulse size={21} /></span><div><p className="font-display text-sm font-bold text-[#173543]">MediKiosk</p><p className="text-[10px] font-semibold text-[#668082]">OPD intake · Screen 04</p></div></div><span className="rounded-full bg-[#d9eee6] px-2.5 py-1 text-[10px] font-bold text-[#28675f]">Ready</span></div>
              <div className="py-8"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#638180]">Welcome</p><h2 className="mt-3 font-display text-3xl font-bold tracking-[-.05em] text-[#173543]">One calm step<br />at a time.</h2><p className="mt-3 max-w-xs text-sm leading-6 text-[#5b7477]">Choose your language and we’ll guide you through the rest.</p><div className="mt-7 grid grid-cols-2 gap-3"><div className="rounded-xl border-2 border-[#16665f] bg-[#f7fbf7] p-4"><p className="font-display text-sm font-bold text-[#173543]">English</p><p className="mt-1 text-xs text-[#6c8585]">Continue in English</p></div><div className="rounded-xl border border-[#cbded6] bg-[#f7fbf7] p-4"><p className="font-display text-sm font-bold text-[#173543]">हिन्दी</p><p className="mt-1 text-xs text-[#6c8585]">हिन्दी में जारी रखें</p></div></div></div>
              <div className="flex items-center justify-between border-t border-[#cfdfd8] pt-4 text-[10px] font-semibold text-[#718788]"><span className="flex items-center gap-1.5"><ShieldCheck size={13} /> Private on this device</span><span>1 of 5</span></div>
            </div>
          </div>
          <div className="absolute -bottom-5 -left-4 rounded-2xl border border-[#d6dfd4] bg-[#fffaf0] px-4 py-3 shadow-[0_10px_24px_rgba(22,73,73,.09)]"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9b6a31]">For your doctor</p><p className="mt-1 font-display text-sm font-bold text-[#173543]">A clearer first note</p></div>
        </section>
      </main>
      <div className="border-t border-[#dce5df] bg-[#edf3ed] px-5 py-5 text-center text-xs text-[#607979]">Designed for busy Indian OPDs · This college prototype simulates voice, OCR and record lookup.</div>
    </div>
  );
}

type AuthChannel = 'medikiosk' | 'mediweb';
type AccountProfile = { name: string; age: string; phone: string; abhaId: string; language: 'English' | 'हिन्दी' };

function AuthPage({ channel, go, onVerified }: { channel: AuthChannel; go: (path: string) => void; onVerified: () => void }) {
  const [method, setMethod] = useState<'mobile' | 'abha'>('mobile');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const isKiosk = channel === 'medikiosk';

  const sendOtp = () => {
    if (!identifier.trim()) {
      setError(`Enter your ${method === 'mobile' ? 'mobile number' : 'ABHA ID'} to continue.`);
      return;
    }
    setError('');
    setSent(true);
  };

  const verifyOtp = () => {
    if (otp !== '123456') {
      setError('Use the six-digit demo OTP shown below.');
      return;
    }
    onVerified();
  };

  return <div className="kiosk-shell min-h-[100dvh]">
    <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-10">
      <button onClick={() => go('/')} data-testid="button-auth-home" className="focus-ring rounded-lg"><Brand /></button>
      <span className="rounded-full bg-[#e5f2ee] px-3 py-1.5 text-xs font-bold text-[#28675f]">{isKiosk ? 'MediKiosk access' : 'MediWeb access'}</span>
    </nav>
    <main className="mx-auto max-w-5xl px-5 pb-16 pt-8 md:px-10 md:pt-14">
      <button onClick={() => go('/')} data-testid="button-auth-back" className="focus-ring mb-8 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-[#607879] hover:bg-[#e9eee9]"><ArrowLeft size={17} /> Back to CLINBRIDGE</button>
      <div className="grid items-start gap-12 md:grid-cols-[.85fr_1.15fr]">
        <div className="max-w-md">
          <p className="text-sm font-bold text-[#16665f]">{isKiosk ? 'A simpler way in' : 'Your history, ready when you are'}</p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight tracking-[-.06em] text-[#173543] md:text-5xl">{isKiosk ? 'Sign in to your patient kiosk.' : 'Sign in to MediWeb.'}</h1>
          <p className="mt-4 text-base leading-7 text-[#5c7478]">{isKiosk ? 'Use your mobile number or ABHA ID. We’ll guide you through the next step with voice-friendly prompts.' : 'Use your mobile number or ABHA ID to continue your self-service intake.'}</p>
          <div className="mt-8 rounded-2xl border border-[#cbded6] bg-[#e8f4f0] p-4 text-sm leading-6 text-[#315d5c]"><ShieldCheck className="mb-2 text-[#16665f]" size={18} />Your details are only being used for this local prototype. No real OTP is sent.</div>
        </div>
        <section className="rounded-[2rem] border border-[#cfdfd8] bg-[#f9fbf7] p-6 shadow-[0_18px_40px_rgba(22,73,73,.08)] md:p-8">
          {!sent ? <>
            <p className="text-xs font-bold uppercase tracking-[.14em] text-[#6c8585]">Patient login</p>
            <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-[#edf3ed] p-1">
              <button onClick={() => { setMethod('mobile'); setError(''); }} data-testid="button-login-mobile" className={`focus-ring rounded-lg px-3 py-3 text-sm font-bold ${method === 'mobile' ? 'bg-[#f9fbf7] text-[#16665f] shadow-sm' : 'text-[#607879]'}`}><Smartphone className="mx-auto mb-1" size={18} />Mobile number</button>
              <button onClick={() => { setMethod('abha'); setError(''); }} data-testid="button-login-abha" className={`focus-ring rounded-lg px-3 py-3 text-sm font-bold ${method === 'abha' ? 'bg-[#f9fbf7] text-[#16665f] shadow-sm' : 'text-[#607879]'}`}><KeyRound className="mx-auto mb-1" size={18} />ABHA ID</button>
            </div>
            <label className="mt-7 block"><span className="mb-2 block text-sm font-bold text-[#35585e]">{method === 'mobile' ? 'Mobile number' : 'ABHA ID'}</span><input autoFocus value={identifier} onChange={e => setIdentifier(e.target.value)} data-testid="input-login-identifier" type={method === 'mobile' ? 'tel' : 'text'} placeholder={method === 'mobile' ? 'Enter 10-digit mobile number' : 'Enter your ABHA ID'} className="focus-ring h-14 w-full rounded-xl border border-[#bfd7d0] bg-[#fbfcf7] px-4 text-base text-[#173543] outline-none focus:border-[#16665f]" /></label>
            {error && <p className="mt-3 text-sm font-bold text-[#a34234]">{error}</p>}
            <Button onClick={sendOtp} className="mt-7 w-full" data-testid="button-send-otp">Send OTP <ArrowRight size={18} /></Button>
            <p className="mt-5 text-center text-xs text-[#718788]">New to CLINBRIDGE? <button onClick={() => go('/account')} className="font-bold text-[#16665f] underline-offset-2 hover:underline">Create an account</button></p>
          </> : <>
            <p className="text-xs font-bold uppercase tracking-[.14em] text-[#6c8585]">Verify your identity</p>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-[-.04em] text-[#173543]">Enter the six-digit OTP</h2>
            <p className="mt-3 text-sm leading-6 text-[#5c7478]">A prototype code would be sent to <strong className="text-[#35585e]">{identifier}</strong>.</p>
            <div className="mt-6 rounded-xl border border-[#e3c7aa] bg-[#fff8ea] p-4 text-sm leading-6 text-[#6f665c]"><strong className="text-[#98612f]">Demo OTP:</strong> 123456</div>
            <label className="mt-6 block"><span className="mb-2 block text-sm font-bold text-[#35585e]">One-time password</span><input autoFocus value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} data-testid="input-login-otp" inputMode="numeric" maxLength={6} placeholder="123456" className="focus-ring h-14 w-full rounded-xl border border-[#bfd7d0] bg-[#fbfcf7] px-4 text-center text-xl font-bold tracking-[.35em] text-[#173543] outline-none focus:border-[#16665f]" /></label>
            {error && <p className="mt-3 text-sm font-bold text-[#a34234]">{error}</p>}
            <Button onClick={verifyOtp} className="mt-7 w-full" data-testid="button-verify-otp">Verify and continue <Check size={18} /></Button>
            <button onClick={() => { setSent(false); setOtp(''); setError(''); }} data-testid="button-change-login" className="focus-ring mt-4 block w-full rounded-lg py-2 text-center text-sm font-bold text-[#607879] hover:bg-[#e9eee9]">Use a different sign-in method</button>
          </>}
        </section>
      </div>
    </main>
  </div>;
}

function AccountPage({ go, onComplete }: { go: (path: string) => void; onComplete: (profile: AccountProfile) => void }) {
  const [profile, setProfile] = useState<AccountProfile>({ name: '', age: '', phone: '', abhaId: '', language: 'English' });
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const ready = profile.name.trim().length > 1 && Number(profile.age) > 0 && profile.phone.trim().length >= 10 && profile.abhaId.trim().length > 3;
  const submit = () => {
    if (!ready) {
      setError('Please complete your name, age, mobile number, and ABHA ID.');
      return;
    }
    setError('');
    setSent(true);
  };
  const verify = () => {
    if (otp !== '123456') {
      setError('Use the six-digit demo OTP shown below.');
      return;
    }
    onComplete(profile);
    go('/kiosk');
  };

  return <div className="kiosk-shell min-h-[100dvh]">
    <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-10"><button onClick={() => go('/')} data-testid="button-account-home" className="focus-ring rounded-lg"><Brand /></button><span className="rounded-full bg-[#e5f2ee] px-3 py-1.5 text-xs font-bold text-[#28675f]">Patient account</span></nav>
    <main className="mx-auto max-w-5xl px-5 pb-16 pt-8 md:px-10 md:pt-14">
      <button onClick={() => go('/')} data-testid="button-account-back" className="focus-ring mb-8 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-[#607879] hover:bg-[#e9eee9]"><ArrowLeft size={17} /> Back to CLINBRIDGE</button>
      <div className="grid items-start gap-12 md:grid-cols-[.8fr_1.2fr]">
        <div className="max-w-md"><p className="text-sm font-bold text-[#16665f]">Start once, continue anywhere</p><h1 className="mt-3 font-display text-4xl font-bold leading-tight tracking-[-.06em] text-[#173543] md:text-5xl">Create your CLINBRIDGE account.</h1><p className="mt-4 text-base leading-7 text-[#5c7478]">Your account lets you use MediKiosk or MediWeb with the same patient profile.</p><div className="mt-8 rounded-2xl border border-[#cbded6] bg-[#e8f4f0] p-4 text-sm leading-6 text-[#315d5c]"><ShieldCheck className="mb-2 text-[#16665f]" size={18} />For this prototype, account details stay in local browser state and are not sent to a real service.</div></div>
        <section className="rounded-[2rem] border border-[#cfdfd8] bg-[#f9fbf7] p-6 shadow-[0_18px_40px_rgba(22,73,73,.08)] md:p-8">
          {!sent ? <>
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#6c8585]">New patient profile</p><h2 className="mt-2 font-display text-2xl font-bold tracking-[-.04em] text-[#173543]">Tell us the basics</h2></div><UserPlus className="text-[#16665f]" size={24} /></div>
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-[#35585e]">Full name <span className="text-[#c65b45]">*</span></span><input autoFocus value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} data-testid="input-account-name" placeholder="For example, Rajesh Kumar" className="focus-ring h-14 w-full rounded-xl border border-[#bfd7d0] bg-[#fbfcf7] px-4 text-base text-[#173543] outline-none focus:border-[#16665f]" /></label>
              <label><span className="mb-2 block text-sm font-bold text-[#35585e]">Age <span className="text-[#c65b45]">*</span></span><input type="number" min="1" max="120" value={profile.age} onChange={e => setProfile({ ...profile, age: e.target.value })} data-testid="input-account-age" placeholder="Age in years" className="focus-ring h-14 w-full rounded-xl border border-[#bfd7d0] bg-[#fbfcf7] px-4 text-base text-[#173543] outline-none focus:border-[#16665f]" /></label>
              <label><span className="mb-2 block text-sm font-bold text-[#35585e]">Mobile number <span className="text-[#c65b45]">*</span></span><input type="tel" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} data-testid="input-account-mobile" placeholder="10-digit mobile number" className="focus-ring h-14 w-full rounded-xl border border-[#bfd7d0] bg-[#fbfcf7] px-4 text-base text-[#173543] outline-none focus:border-[#16665f]" /></label>
              <label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-[#35585e]">ABHA ID <span className="text-[#c65b45]">*</span></span><input value={profile.abhaId} onChange={e => setProfile({ ...profile, abhaId: e.target.value })} data-testid="input-account-abha" placeholder="Enter your ABHA ID" className="focus-ring h-14 w-full rounded-xl border border-[#bfd7d0] bg-[#fbfcf7] px-4 text-base text-[#173543] outline-none focus:border-[#16665f]" /></label>
            </div>
            <fieldset className="mt-7"><legend className="mb-3 text-sm font-bold text-[#35585e]">Preferred language</legend><div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => setProfile({ ...profile, language: 'English' })} data-testid="button-account-language-english" className={`focus-ring rounded-xl border-2 p-4 text-left transition ${profile.language === 'English' ? 'border-[#16665f] bg-[#e8f4f0]' : 'border-[#cfdfd8] bg-[#fbfcf7]'}`}><span className="font-display font-bold text-[#173543]">English</span><span className="mt-1 block text-xs text-[#6c8585]">Continue in English</span></button><button type="button" onClick={() => setProfile({ ...profile, language: 'हिन्दी' })} data-testid="button-account-language-hindi" className={`focus-ring rounded-xl border-2 p-4 text-left transition ${profile.language === 'हिन्दी' ? 'border-[#16665f] bg-[#e8f4f0]' : 'border-[#cfdfd8] bg-[#fbfcf7]'}`}><span className="font-display font-bold text-[#173543]">हिन्दी</span><span className="mt-1 block text-xs text-[#6c8585]">हिन्दी में जारी रखें</span></button></div></fieldset>
            {error && <p className="mt-4 text-sm font-bold text-[#a34234]">{error}</p>}<Button onClick={submit} className="mt-7 w-full" data-testid="button-account-continue">Continue to OTP <ArrowRight size={18} /></Button>
          </> : <>
            <p className="text-xs font-bold uppercase tracking-[.14em] text-[#6c8585]">Verify your mobile</p><h2 className="mt-3 font-display text-2xl font-bold tracking-[-.04em] text-[#173543]">Finish creating your account</h2><p className="mt-3 text-sm leading-6 text-[#5c7478]">We would send a one-time password to <strong className="text-[#35585e]">{profile.phone}</strong>.</p><div className="mt-6 rounded-xl border border-[#e3c7aa] bg-[#fff8ea] p-4 text-sm leading-6 text-[#6f665c]"><strong className="text-[#98612f]">Demo OTP:</strong> 123456</div><label className="mt-6 block"><span className="mb-2 block text-sm font-bold text-[#35585e]">One-time password</span><input autoFocus value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} data-testid="input-account-otp" inputMode="numeric" maxLength={6} placeholder="123456" className="focus-ring h-14 w-full rounded-xl border border-[#bfd7d0] bg-[#fbfcf7] px-4 text-center text-xl font-bold tracking-[.35em] text-[#173543] outline-none focus:border-[#16665f]" /></label>{error && <p className="mt-3 text-sm font-bold text-[#a34234]">{error}</p>}<Button onClick={verify} className="mt-7 w-full" data-testid="button-account-verify">Verify and open MediKiosk <Check size={18} /></Button><button onClick={() => { setSent(false); setOtp(''); setError(''); }} data-testid="button-account-edit" className="focus-ring mt-4 block w-full rounded-lg py-2 text-center text-sm font-bold text-[#607879] hover:bg-[#e9eee9]">Edit account details</button>
          </>}
        </section>
      </div>
    </main>
  </div>;
}

function LanguageStep({ onChoose }: { onChoose: (language: 'English' | 'हिन्दी') => void }) {
  return <div className="animate-enter-up"><div className="max-w-xl"><p className="text-sm font-bold text-[#16665f]">नमस्ते · Welcome</p><h1 className="mt-3 font-display text-4xl font-bold tracking-[-.06em] text-[#173543] md:text-5xl">Which language feels<br />most comfortable?</h1><p className="mt-4 text-base leading-7 text-[#5c7478]">You can change this at any time. We’ll keep every question simple.</p></div><div className="mt-10 grid gap-4 sm:grid-cols-2"><button onClick={() => onChoose('English')} data-testid="button-language-english" className="focus-ring group rounded-2xl border-2 border-[#16665f] bg-[#f8fbf6] p-6 text-left shadow-[0_10px_25px_rgba(22,102,95,.08)] transition hover:-translate-y-0.5"><span className="grid h-12 w-12 place-items-center rounded-xl bg-[#dcefe9] text-[#16665f]"><Languages /></span><p className="mt-7 font-display text-2xl font-bold text-[#173543]">English</p><p className="mt-1 text-sm text-[#668082]">Continue in English</p><span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#16665f]">Choose English <ArrowRight size={16} className="transition group-hover:translate-x-1" /></span></button><button onClick={() => onChoose('हिन्दी')} data-testid="button-language-hindi" className="focus-ring group rounded-2xl border border-[#cbded6] bg-[#f8fbf6] p-6 text-left transition hover:-translate-y-0.5 hover:border-[#16665f]"><span className="grid h-12 w-12 place-items-center rounded-xl bg-[#fff0db] text-[#9c632d]"><Languages /></span><p className="mt-7 font-display text-2xl font-bold text-[#173543]">हिन्दी</p><p className="mt-1 text-sm text-[#668082]">हिन्दी में जारी रखें</p><span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#16665f]">हिन्दी चुनें <ArrowRight size={16} /></span></button></div><p className="mt-8 flex items-center gap-2 text-xs text-[#708685]"><Volume2 size={15} /> Voice-style prompts are simulated for this prototype.</p></div>;
}

function DetailsStep({ name, age, phone, setName, setAge, setPhone, onNext }: { name: string; age: string; phone: string; setName: (v: string) => void; setAge: (v: string) => void; setPhone: (v: string) => void; onNext: () => void }) {
  const ready = name.trim().length > 1 && Number(age) > 0;
  return <div className="animate-enter-up max-w-2xl"><p className="text-sm font-bold text-[#16665f]">A little about you</p><h1 className="mt-3 font-display text-4xl font-bold tracking-[-.06em] text-[#173543] md:text-5xl">Let’s put a name<br />to your visit.</h1><p className="mt-4 text-base leading-7 text-[#5c7478]">Only the basics for now. Your doctor can complete the rest with you.</p><div className="mt-10 grid gap-5 sm:grid-cols-2"><label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-[#35585e]">Full name <span className="text-[#c65b45]">*</span></span><input autoFocus value={name} onChange={e => setName(e.target.value)} data-testid="input-patient-name" placeholder="For example, Meena Sharma" className="focus-ring h-14 w-full rounded-xl border border-[#bfd7d0] bg-[#fbfcf7] px-4 text-base text-[#173543] outline-none transition focus:border-[#16665f]" /></label><label><span className="mb-2 block text-sm font-bold text-[#35585e]">Age <span className="text-[#c65b45]">*</span></span><input type="number" min="1" max="120" value={age} onChange={e => setAge(e.target.value)} data-testid="input-patient-age" placeholder="Age in years" className="focus-ring h-14 w-full rounded-xl border border-[#bfd7d0] bg-[#fbfcf7] px-4 text-base text-[#173543] outline-none transition focus:border-[#16665f]" /></label><label><span className="mb-2 block text-sm font-bold text-[#35585e]">Mobile number <span className="font-normal text-[#718788]">(optional)</span></span><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} data-testid="input-patient-phone" placeholder="10-digit number" className="focus-ring h-14 w-full rounded-xl border border-[#bfd7d0] bg-[#fbfcf7] px-4 text-base text-[#173543] outline-none transition focus:border-[#16665f]" /></label></div><div className="mt-10 flex items-center justify-between"><span className="text-xs text-[#778b8b]">Required fields are marked with *</span><Button onClick={onNext} disabled={!ready} className="disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-details-continue">Continue <ArrowRight size={18} /></Button></div></div>;
}

function ComplaintStep({ pathway, setPathway, onNext }: { pathway: Pathway | null; setPathway: (p: Pathway) => void; onNext: () => void }) {
  return <div className="animate-enter-up"><div className="max-w-2xl"><p className="text-sm font-bold text-[#16665f]">The important bit</p><h1 className="mt-3 font-display text-4xl font-bold tracking-[-.06em] text-[#173543] md:text-5xl">What brings you<br />in today?</h1><p className="mt-4 text-base leading-7 text-[#5c7478]">Pick the closest match. This is not a diagnosis — it simply helps us ask better questions.</p></div><div className="mt-9 grid gap-3">{(Object.keys(pathways) as Pathway[]).map(key => { const item = pathways[key]; const selected = pathway === key; return <button key={key} onClick={() => setPathway(key)} data-testid={`button-complaint-${key}`} className={`focus-ring flex items-center gap-4 rounded-2xl border p-5 text-left transition ${selected ? 'border-2 border-[#16665f] bg-[#e8f4f0] shadow-[0_8px_20px_rgba(22,102,95,.08)]' : 'border-[#cedfd8] bg-[#f9fbf7] hover:-translate-y-0.5 hover:border-[#8fc5b8]'}`}><span className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl ${selected ? 'bg-[#16665f] text-[#f7f8f3]' : 'bg-[#e8efea] text-[#16665f]'}`}>{item.icon}</span><span className="flex-1"><span className="block font-display text-lg font-bold text-[#173543]">{item.label}</span><span className="block text-sm text-[#668082]">{item.hindi} · {item.detail}</span></span>{selected ? <CheckCircle2 className="text-[#16665f]" /> : <ChevronRight className="text-[#9bb3af]" />}</button>; })}</div><div className="mt-8 flex justify-end"><Button onClick={onNext} disabled={!pathway} className="disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-complaint-continue">Continue <ArrowRight size={18} /></Button></div></div>;
}

function QuestionsStep({ pathway, answers, setAnswers, onNext }: { pathway: Pathway; answers: Answers; setAnswers: (a: Answers) => void; onNext: () => void }) {
  const questions = pathways[pathway].questions;
  const [questionIndex, setQuestionIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const question = questions[questionIndex];
  const choose = (value: string) => setAnswers({ ...answers, [question.id]: value });
  const goNext = () => questionIndex < questions.length - 1 ? setQuestionIndex(questionIndex + 1) : onNext();
  useEffect(() => { setQuestionIndex(0); }, [pathway]);
  return <div className="animate-enter-up max-w-3xl"><div className="flex items-start justify-between gap-5"><div><p className="text-sm font-bold text-[#16665f]">Question {questionIndex + 1} of {questions.length}</p><h1 className="mt-3 font-display text-4xl font-bold leading-tight tracking-[-.06em] text-[#173543] md:text-5xl">{question.title}</h1><p className="mt-2 text-lg text-[#61797b]">{question.hindi}</p></div><button onClick={() => setListening(!listening)} data-testid="button-question-voice" className={`focus-ring grid h-14 w-14 shrink-0 place-items-center rounded-2xl border transition ${listening ? 'border-[#d28b57] bg-[#fff0db] text-[#9c632d]' : 'border-[#bcd8d1] bg-[#e5f2ee] text-[#16665f]'}`} aria-label="Simulate voice prompt">{listening ? <Volume2 /> : <Mic />}</button></div>{question.helper && <p className="mt-5 rounded-xl bg-[#edf3ed] px-4 py-3 text-sm text-[#5d7779]">{question.helper}</p>}<div className="mt-9 grid gap-3 sm:grid-cols-2">{question.options.map(option => <button key={option} onClick={() => choose(option)} data-testid={`button-answer-${question.id}-${option.toLowerCase().replaceAll(' ', '-')}`} className={`focus-ring min-h-16 rounded-xl border-2 px-5 text-left text-base font-bold transition ${answers[question.id] === option ? 'border-[#16665f] bg-[#e1f1ec] text-[#164e4a]' : 'border-[#cfdfd8] bg-[#fbfcf7] text-[#35585e] hover:border-[#8fc5b8]'}`}><span className="mr-3 inline-block h-3 w-3 rounded-full border-2 align-[-1px] border-current" />{option}</button>)}</div><div className="mt-10 flex items-center justify-between"><button onClick={() => questionIndex > 0 ? setQuestionIndex(questionIndex - 1) : undefined} disabled={questionIndex === 0} data-testid="button-question-back" className="focus-ring inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-[#607879] disabled:opacity-30"><ArrowLeft size={17} /> Back</button><Button onClick={goNext} disabled={!answers[question.id]} className="disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-question-next">{questionIndex === questions.length - 1 ? 'Review answers' : 'Next question'} <ArrowRight size={18} /></Button></div><p className="mt-7 flex items-center gap-2 text-xs text-[#718788]"><Mic size={14} /> Tap the microphone for a simulated voice-style prompt. No audio is recorded.</p></div>;
}

function ReviewStep({ pathway, answers, onNext }: { pathway: Pathway; answers: Answers; onNext: () => void }) {
  const needsPrompt = pathway === 'chest' && (answers.severity === 'Severe' || answers.breathing === 'Yes' || answers.spread === 'Yes');
  return <div className="animate-enter-up max-w-3xl"><p className="text-sm font-bold text-[#16665f]">Before we continue</p><h1 className="mt-3 font-display text-4xl font-bold tracking-[-.06em] text-[#173543] md:text-5xl">Here’s what<br />we heard.</h1><p className="mt-4 text-base leading-7 text-[#5c7478]">Please check this quick recap. You can go back if anything feels wrong.</p><div className={`mt-8 overflow-hidden rounded-2xl border border-[#e2c4a4] p-5 ${needsPrompt ? 'priority-stripe' : 'bg-[#fff8ea]'}`}><div className="flex gap-4"><span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fff0db] text-[#a05c2b]">{needsPrompt ? <CircleAlert size={21} /> : <Clock3 size={21} />}</span><div><p className="font-display font-bold text-[#173543]">{needsPrompt ? 'Please speak with the care team promptly' : 'Your care team will review this'}</p><p className="mt-1 text-sm leading-6 text-[#6d6960]">{needsPrompt ? 'Your answers include a symptom that should be checked without delay. A staff member will guide you next.' : 'This intake note helps your doctor decide what to discuss first.'}</p></div></div></div><div className="mt-6 divide-y divide-[#dce5df] rounded-2xl border border-[#cfdfd8] bg-[#f9fbf7]">{pathways[pathway].questions.map(q => <div key={q.id} className="flex items-center justify-between gap-5 px-5 py-4"><span className="text-sm text-[#6a8080]">{q.title}</span><span className="text-right text-sm font-bold text-[#173543]">{answers[q.id] || 'Not answered'}</span></div>)}</div><p className="mt-5 flex items-center gap-2 text-xs text-[#718788]"><ShieldCheck size={15} /> This is a priority review, not a diagnosis.</p><div className="mt-8 flex justify-end"><Button onClick={onNext} data-testid="button-review-continue">Check previous records <ArrowRight size={18} /></Button></div></div>;
}

function ScanStep({ onNext }: { onNext: () => void }) {
  const [done, setDone] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => setDone(true), 1700); return () => window.clearTimeout(timer); }, []);
  return <div className="animate-enter-up mx-auto max-w-xl text-center"><div className="relative mx-auto grid h-36 w-36 place-items-center overflow-hidden rounded-3xl border border-[#b9d8d1] bg-[#e4f2ed] text-[#16665f]"><ScanLine size={42} strokeWidth={1.3} /><span className="scan-line absolute left-4 right-4 top-3 h-0.5 bg-[#d18a55]" /></div><p className="mt-8 text-sm font-bold text-[#16665f]">{done ? 'Record found' : 'Looking for a previous record'}</p><h1 className="mt-3 font-display text-4xl font-bold tracking-[-.06em] text-[#173543]">{done ? 'A familiar face.' : 'Just a moment…'}</h1><p className="mx-auto mt-4 max-w-md text-base leading-7 text-[#5c7478]">{done ? 'We found a mock previous visit for this demo. Nothing is being sent to a real hospital system.' : 'MediKiosk is simulating a record lookup so your doctor has useful context.'}</p><div className="mt-8 rounded-xl border border-[#d8e5dd] bg-[#f9fbf7] p-4 text-left"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-bold text-[#35585e]"><FileText size={17} /> Previous OPD record</span>{done ? <CheckCircle2 size={19} className="text-[#16665f]" /> : <span className="h-4 w-16 animate-pulse rounded bg-[#dce9e1]" />}</div>{done && <div className="mt-4 grid grid-cols-2 gap-3 text-xs"><span className="rounded-lg bg-[#fff0db] p-3 text-[#8b613c]"><strong className="block text-[10px] uppercase tracking-wide">Recorded</strong> 14 Aug 2024</span><span className="rounded-lg bg-[#e3f1ed] p-3 text-[#28675f]"><strong className="block text-[10px] uppercase tracking-wide">Source</strong> OPD visit note</span></div>}</div>{done && <Button onClick={onNext} className="mt-8 w-full" data-testid="button-scan-continue">Build my intake note <ArrowRight size={18} /></Button>}</div>;
}

function SourceTag({ type, children }: { type: 'patient' | 'record'; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${type === 'patient' ? 'source-patient' : 'source-record'}`}><span className="h-1.5 w-1.5 rounded-full bg-current" /> {children}</span>;
}

function SummaryView({ name, age, pathway, answers, doctorMode = false, confirmed, setConfirmed }: { name: string; age: string | number; pathway: Pathway; answers: Answers; doctorMode?: boolean; confirmed: boolean; setConfirmed: (v: boolean) => void }) {
  const [note, setNote] = useState(`Patient reports ${pathways[pathway].label.toLowerCase()} beginning ${answers.onset?.toLowerCase() || 'recently'}. Current severity described as ${answers.severity?.toLowerCase() || 'not recorded'}.`);
  const [editing, setEditing] = useState(false);
  const date = 'Today · 08:42';
  return <div className={doctorMode ? '' : 'animate-enter-up'}><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div><p className="flex items-center gap-2 text-sm font-bold text-[#16665f]"><CheckCircle2 size={16} /> Draft ready for review</p><h1 className="mt-3 font-display text-4xl font-bold tracking-[-.06em] text-[#173543] md:text-5xl">{doctorMode ? 'Review the intake note.' : 'Your intake note<br />is ready.'}</h1><p className="mt-4 max-w-xl text-base leading-7 text-[#5c7478]">{doctorMode ? 'A concise, source-linked starting point for the consultation. Confirm only what you agree with.' : 'We’ll show this to your doctor so you spend less time repeating the beginning.'}</p></div>{doctorMode && <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${confirmed ? 'bg-[#dff1e9] text-[#28675f]' : 'bg-[#fff0db] text-[#99602f]'}`}>{confirmed ? 'Confirmed by doctor' : 'Awaiting confirmation'}</span>}</div><div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><div className="space-y-5"><article className="rounded-2xl border border-[#cfdfd8] bg-[#f9fbf7] p-6"><div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#6c8585]">Structured summary</p><p className="mt-1 font-display text-xl font-bold text-[#173543]">{name || 'Ravi Mehta'} · {age || 54} years</p></div><button onClick={() => setEditing(!editing)} data-testid="button-edit-summary" className="focus-ring inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold text-[#16665f] hover:bg-[#e5f1ed]">{editing ? <X size={15} /> : <Pencil size={15} />} {editing ? 'Close' : 'Edit draft'}</button></div>{editing ? <textarea value={note} onChange={e => setNote(e.target.value)} data-testid="textarea-summary-edit" className="focus-ring mt-5 min-h-32 w-full rounded-xl border border-[#9ecbc0] bg-[#fbfcf7] p-4 text-sm leading-6 text-[#173543] outline-none" /> : <p className="mt-5 rounded-xl bg-[#e7f3ef] p-4 text-sm leading-6 text-[#315d5c]">{note}</p>}<div className="mt-5 flex flex-wrap gap-2"><SourceTag type="patient">Patient response</SourceTag><SourceTag type="record">Previous record</SourceTag></div></article><article className="rounded-2xl border border-[#cfdfd8] bg-[#f9fbf7] p-6"><div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold text-[#173543]">What was captured</h2><span className="text-xs font-bold text-[#71908e]">{pathways[pathway].label}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{pathways[pathway].questions.map(q => <div key={q.id} className="rounded-xl border border-[#dce7df] bg-[#f4f8f2] p-3"><p className="text-xs text-[#748b8a]">{q.title}</p><p className="mt-1 text-sm font-bold text-[#35585e]">{answers[q.id] || 'Not recorded'}</p><SourceTag type="patient">Patient</SourceTag></div>)}</div></article></div><aside className="space-y-5"><div className="rounded-2xl border border-[#e3c7aa] bg-[#fff8ea] p-5"><div className="flex items-center gap-2 text-[#98612f]"><CircleAlert size={18} /><p className="font-display font-bold">Priority review</p></div><p className="mt-2 text-sm leading-6 text-[#6f665c]">The care team should review this note alongside an in-person assessment. It does not provide a diagnosis.</p></div><div className="rounded-2xl border border-[#cfdfd8] bg-[#f9fbf7] p-5"><h2 className="flex items-center gap-2 font-display text-lg font-bold text-[#173543]"><CalendarDays size={18} className="text-[#16665f]" /> Medical timeline</h2><div className="mt-5 border-l-2 border-[#b8d8cf] pl-4"><p className="text-xs font-bold text-[#6b8585]">{date}</p><p className="mt-1 text-sm font-bold text-[#35585e]">Patient intake started</p><p className="mt-1 text-xs leading-5 text-[#748b8a]">Source-linked answers collected at MediKiosk.</p></div><div className="mt-5 border-l-2 border-[#e3c39d] pl-4"><p className="text-xs font-bold text-[#98612f]">14 Aug 2024</p><p className="mt-1 text-sm font-bold text-[#35585e]">Previous OPD visit</p><p className="mt-1 text-xs leading-5 text-[#748b8a]">Mock record · scanned for this demo.</p></div></div></aside></div>{doctorMode && <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#c9ddd5] bg-[#e6f3ee] p-4"><p className="flex items-center gap-2 text-sm font-bold text-[#28675f]"><ShieldCheck size={17} /> Confirming marks this draft as ready for the consultation.</p><Button onClick={() => setConfirmed(!confirmed)} variant={confirmed ? 'secondary' : 'primary'} data-testid="button-confirm-case">{confirmed ? <><Check size={18} /> Confirmed</> : <>Confirm intake note <Check size={18} /></>}</Button></div>}</div>;
}

function KioskFlow({ state, setState, go }: { state: FlowState; setState: (s: FlowState) => void; go: (path: string) => void }) {
  const { step, patient, pathway, answers } = state;
  const patch = (part: Partial<FlowState>) => setState({ ...state, ...part });
  const next = (newStep: KioskStep) => patch({ step: newStep });
  return <KioskLayout step={step} onExit={() => go('/')}><button onClick={() => step !== 'language' && next(step === 'scan' ? 'review' : step === 'summary' ? 'scan' : 'language')} data-testid="button-flow-back" className={`focus-ring mb-6 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-[#607879] hover:bg-[#e9eee9] ${step === 'language' ? 'invisible' : ''}`}><ArrowLeft size={17} /> Back</button>{step === 'language' && <LanguageStep onChoose={language => { patch({ patient: { ...patient, language }, step: 'details' }); }} />}{step === 'details' && <DetailsStep name={patient.name} age={patient.age} phone={patient.phone} setName={name => patch({ patient: { ...patient, name } })} setAge={age => patch({ patient: { ...patient, age } })} setPhone={phone => patch({ patient: { ...patient, phone } })} onNext={() => next('complaint')} />}{step === 'complaint' && <ComplaintStep pathway={pathway} setPathway={p => patch({ pathway: p })} onNext={() => next('questions')} />}{step === 'questions' && pathway && <QuestionsStep pathway={pathway} answers={answers} setAnswers={a => patch({ answers: a })} onNext={() => next('review')} />}{step === 'review' && pathway && <ReviewStep pathway={pathway} answers={answers} onNext={() => next('scan')} />}{step === 'scan' && <ScanStep onNext={() => next('summary')} />}{step === 'summary' && pathway && <SummaryView name={patient.name} age={patient.age} pathway={pathway} answers={answers} confirmed={state.confirmed} setConfirmed={confirmed => patch({ confirmed })} />}{step === 'summary' && <div className="mt-8 flex justify-end"><Button onClick={() => go('/doctor')} variant="secondary" data-testid="button-go-doctor">Open doctor portal <ArrowRight size={18} /></Button></div>}</KioskLayout>;
}

type FlowState = { step: KioskStep; patient: { name: string; age: string; phone: string; abhaId: string; language: string }; pathway: Pathway | null; answers: Answers; confirmed: boolean };

function PortalShell({ children, go, active = 'dashboard' }: { children: ReactNode; go: (path: string) => void; active?: string }) {
  return <div className="flex min-h-[100dvh] bg-[#f2f4ee]"><aside className="hidden w-64 shrink-0 flex-col bg-[#173543] px-5 py-6 text-[#eef6ef] md:flex"><button onClick={() => go('/doctor')} data-testid="button-portal-brand" className="focus-ring mb-12 rounded-lg text-left"><Brand inverse /></button><p className="px-3 text-[10px] font-bold uppercase tracking-[.18em] text-[#82a3a1]">Workspace</p><nav className="mt-3 space-y-1"><button onClick={() => go('/doctor')} data-testid="button-nav-dashboard" className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold ${active === 'dashboard' ? 'bg-[#2a4e59] text-[#90dcca]' : 'text-[#b8cdca] hover:bg-[#213f4b]'}`}><LayoutDashboard size={18} /> Intake queue</button><button onClick={() => go('/kiosk')} data-testid="button-nav-kiosk" className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-[#b8cdca] hover:bg-[#213f4b]"><Stethoscope size={18} /> Open kiosk</button><button onClick={() => go('/mediweb')} data-testid="button-nav-mediweb" className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-[#b8cdca] hover:bg-[#213f4b]"><FileText size={18} /> About MediWeb</button></nav><div className="mt-auto rounded-2xl border border-[#355660] bg-[#1f424e] p-4"><p className="text-xs font-bold text-[#90dcca]">Prototype workspace</p><p className="mt-2 text-xs leading-5 text-[#b8cdca]">Local mock data only. No live patient systems connected.</p></div></aside><div className="min-w-0 flex-1">{children}</div></div>;
}

function DoctorPortal({ go, onOpen }: { go: (path: string) => void; onOpen: () => void }) {
  const [filter, setFilter] = useState('');
  const filtered = demoCases.filter(item => `${item.name} ${item.issue} ${item.id}`.toLowerCase().includes(filter.toLowerCase()));
  return <PortalShell go={go}><header className="border-b border-[#dbe4dc] bg-[#f8faf5] px-5 py-5 md:px-10"><div className="mx-auto flex max-w-6xl items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#638180]">MediKiosk · Doctor view</p><h1 className="mt-1 font-display text-2xl font-bold tracking-[-.04em] text-[#173543] md:text-3xl">Good morning, Dr. Iyer.</h1></div><div className="flex items-center gap-3"><button onClick={() => go('/kiosk')} data-testid="button-header-kiosk" className="focus-ring hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-[#4f6d70] hover:bg-[#e7eee8] sm:flex"><Stethoscope size={16} /> Return to kiosk</button><span className="grid h-10 w-10 place-items-center rounded-full bg-[#dbeee8] text-sm font-bold text-[#28675f]">RI</span></div></div></header><main className="mx-auto max-w-6xl px-5 py-7 md:px-10 md:py-10"><div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-[#cfdfd8] bg-[#f9fbf7] p-5"><p className="text-xs font-bold uppercase tracking-wide text-[#708888]">Needs review</p><p className="mt-2 font-display text-3xl font-bold text-[#173543]">2</p><p className="mt-1 text-xs text-[#6c8383]">intake notes in queue</p></div><div className="rounded-2xl border border-[#cfdfd8] bg-[#f9fbf7] p-5"><p className="text-xs font-bold uppercase tracking-wide text-[#708888]">First seen today</p><p className="mt-2 font-display text-3xl font-bold text-[#173543]">08:05</p><p className="mt-1 text-xs text-[#6c8383]">latest kiosk entry</p></div><div className="rounded-2xl border border-[#e3c7aa] bg-[#fff8ea] p-5"><p className="text-xs font-bold uppercase tracking-wide text-[#98612f]">Prompt review</p><p className="mt-2 font-display text-3xl font-bold text-[#173543]">1</p><p className="mt-1 text-xs text-[#6c8383]">priority flagged by answers</p></div></div><section className="mt-10"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold text-[#16665f]">Today’s intake queue</p><h2 className="mt-1 font-display text-2xl font-bold tracking-[-.04em] text-[#173543]">Start with the patient’s story.</h2></div><label className="relative block sm:w-64"><Search className="absolute left-3 top-3.5 text-[#75908d]" size={17} /><input value={filter} onChange={e => setFilter(e.target.value)} data-testid="input-search-cases" placeholder="Search patient or case" className="focus-ring h-11 w-full rounded-xl border border-[#cbdcd5] bg-[#f9fbf7] pl-10 pr-3 text-sm outline-none focus:border-[#16665f]" /></label></div><div className="mt-5 overflow-hidden rounded-2xl border border-[#cfdfd8] bg-[#f9fbf7]"><div className="hidden grid-cols-[1.3fr_1fr_.8fr_.8fr] gap-4 border-b border-[#dce6df] bg-[#eef4ee] px-5 py-3 text-[10px] font-bold uppercase tracking-[.15em] text-[#718888] md:grid"><span>Patient</span><span>Reason for visit</span><span>Arrival</span><span>Status</span></div>{filtered.length ? filtered.map(item => <button key={item.id} onClick={onOpen} data-testid={`button-open-case-${item.id}`} className="grid w-full gap-3 border-b border-[#e1e9e2] px-5 py-4 text-left transition last:border-0 hover:bg-[#eef6f0] md:grid-cols-[1.3fr_1fr_.8fr_.8fr] md:items-center md:gap-4"><span className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e0efea] text-xs font-bold text-[#28675f]">{item.initials}</span><span><span className="block font-display text-sm font-bold text-[#173543]">{item.name}, {item.age}</span><span className="block text-xs text-[#748b8a]">{item.id}</span></span></span><span className="text-sm font-semibold text-[#4e696d]">{item.issue}<span className={`ml-2 inline-block rounded-full px-2 py-1 text-[10px] font-bold ${item.priority === 'Prompt review' ? 'bg-[#fff0db] text-[#98612f]' : 'bg-[#e6f2ec] text-[#28675f]'}`}>{item.priority}</span></span><span className="text-sm text-[#607979]">{item.time}</span><span className="flex items-center justify-between text-xs font-bold text-[#607979]">{item.status}<ChevronRight size={17} className="text-[#9cb3ad]" /></span></button>) : <div className="p-10 text-center"><Search className="mx-auto text-[#9db5af]" /><p className="mt-3 font-display font-bold text-[#35585e]">No matching cases</p><p className="mt-1 text-sm text-[#758b8b]">Try a patient name or case ID.</p></div>}</div></section><p className="mt-6 flex items-center gap-2 text-xs text-[#788e8d]"><ShieldCheck size={14} /> Mock queue for classroom demonstration · not connected to a hospital system.</p></main></PortalShell>;
}

function DoctorCase({ go, confirmed, setConfirmed, state }: { go: (path: string) => void; confirmed: boolean; setConfirmed: (v: boolean) => void; state: FlowState }) {
  const patient = state.patient.name ? state.patient : { name: 'Ravi Mehta', age: '54', phone: '', language: 'English' };
  const pathway = state.pathway || 'chest';
  const answers = Object.keys(state.answers).length ? state.answers : { onset: 'Today', severity: 'Moderate', breathing: 'No', spread: 'Not sure' };
  return <PortalShell go={go} active="dashboard"><header className="border-b border-[#dbe4dc] bg-[#f8faf5] px-5 py-5 md:px-10"><div className="mx-auto flex max-w-6xl items-center gap-4"><button onClick={() => go('/doctor')} data-testid="button-case-back" className="focus-ring grid h-10 w-10 place-items-center rounded-xl border border-[#cfdfd8] text-[#4e696d] hover:bg-[#e7eee8]"><ArrowLeft size={18} /></button><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#638180]">Intake queue / {patient.name || 'Ravi Mehta'}</p><h1 className="mt-1 font-display text-2xl font-bold tracking-[-.04em] text-[#173543]">Case MK-1048</h1></div></div></header><main className="mx-auto max-w-6xl px-5 py-8 md:px-10 md:py-10"><SummaryView name={patient.name || 'Ravi Mehta'} age={patient.age || '54'} pathway={pathway} answers={answers} doctorMode confirmed={confirmed} setConfirmed={setConfirmed} /></main></PortalShell>;
}

function MediWeb({ go }: { go: (path: string) => void }) {
  return <div className="kiosk-shell min-h-[100dvh]"><nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-10"><Link href="/" data-testid="link-mediweb-brand" className="focus-ring rounded-lg"><Brand /></Link><Button onClick={() => go('/kiosk')} variant="secondary" className="min-h-10 px-4" data-testid="button-mediweb-kiosk">Open patient kiosk <ArrowRight size={16} /></Button></nav><main className="mx-auto max-w-6xl px-5 pb-20 pt-10 md:px-10 md:pt-20"><div className="max-w-3xl"><p className="text-sm font-bold text-[#16665f]">The thinking behind MediKiosk</p><h1 className="mt-3 font-display text-5xl font-bold leading-[.98] tracking-[-.07em] text-[#173543] md:text-7xl">Less repeating.<br /><span className="text-[#16665f]">More listening.</span></h1><p className="mt-7 max-w-2xl text-lg leading-8 text-[#5c7478]">MediWeb is the information layer around the kiosk: simple for patients, useful for doctors, and honest about what a student prototype can and cannot do.</p></div><div className="mt-16 grid gap-4 md:grid-cols-3"><article className="rounded-2xl border border-[#cfdfd8] bg-[#f9fbf7] p-6"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e2f1ec] text-[#16665f]"><Mic /></span><h2 className="mt-6 font-display text-xl font-bold text-[#173543]">Optional voice style</h2><p className="mt-3 text-sm leading-6 text-[#607979]">Patients can tap a microphone cue to hear how a voice prompt would feel. This demo does not record or transcribe audio.</p></article><article className="rounded-2xl border border-[#cfdfd8] bg-[#f9fbf7] p-6"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#fff0db] text-[#98612f]"><ScanLine /></span><h2 className="mt-6 font-display text-xl font-bold text-[#173543]">Previous-record context</h2><p className="mt-3 text-sm leading-6 text-[#607979]">The record scan is simulated with a local mock visit, letting the summary show where each detail came from.</p></article><article className="rounded-2xl border border-[#cfdfd8] bg-[#f9fbf7] p-6"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e2f1ec] text-[#16665f]"><ShieldCheck /></span><h2 className="mt-6 font-display text-xl font-bold text-[#173543]">No invented certainty</h2><p className="mt-3 text-sm leading-6 text-[#607979]">MediKiosk never diagnoses, prescribes, connects to ABHA, or pretends to persist real patient data.</p></article></div><section className="mt-16 grid items-center gap-9 rounded-[2rem] border border-[#c7ddd5] bg-[#e2f1ec] p-7 md:grid-cols-[1fr_.8fr] md:p-10"><div><p className="text-sm font-bold text-[#16665f]">Built for the OPD handoff</p><h2 className="mt-2 font-display text-3xl font-bold tracking-[-.05em] text-[#173543]">The patient sees a path.<br />The doctor sees a starting point.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-[#537174]">Every answer carries a source label — patient response or previous record — before a clinician edits and confirms the draft.</p></div><div className="rounded-2xl border border-[#b8d7cf] bg-[#f7fbf7] p-5"><div className="flex items-center justify-between border-b border-[#d7e7df] pb-4"><span className="font-display font-bold text-[#173543]">Source-linked note</span><CheckCircle2 className="text-[#16665f]" size={19} /></div><p className="mt-4 text-sm leading-6 text-[#315d5c]">“Patient reports chest discomfort beginning today.”</p><div className="mt-4 flex gap-2"><SourceTag type="patient">Patient response</SourceTag><SourceTag type="record">Previous record</SourceTag></div></div></section><div className="mt-12 flex flex-wrap gap-3"><Button onClick={() => go('/kiosk')} data-testid="button-mediweb-start">Try the patient flow <ArrowRight size={17} /></Button><Button onClick={() => go('/doctor')} variant="secondary" data-testid="button-mediweb-doctor">See doctor portal <LayoutDashboard size={17} /></Button></div></main></div>;
}

function Router() {
  const [location, setLocation] = useLocation();
  const [state, setState] = useState<FlowState>({ step: 'language', patient: { name: '', age: '', phone: '', abhaId: '', language: 'English' }, pathway: null, answers: {}, confirmed: false });
  const [confirmed, setConfirmed] = useState(false);
  const go = (path: string) => { setLocation(path); };
  if (location === '/') return <Landing go={go} />;
  if (location === '/account') return <AccountPage go={go} onComplete={profile => setState({ ...state, step: 'complaint', patient: { ...state.patient, ...profile } })} />;
  if (location === '/auth/medikiosk') return <AuthPage channel="medikiosk" go={go} onVerified={() => { setState({ ...state, step: 'complaint' }); go('/kiosk'); }} />;
  if (location === '/auth/mediweb') return <AuthPage channel="mediweb" go={go} onVerified={() => go('/mediweb')} />;
  if (location === '/kiosk') return <KioskFlow state={state} setState={setState} go={go} />;
  if (location === '/mediweb') return <MediWeb go={go} />;
  if (location === '/doctor/case') return <DoctorCase go={go} confirmed={confirmed} setConfirmed={setConfirmed} state={state} />;
  if (location === '/doctor') return <DoctorPortal go={go} onOpen={() => go('/doctor/case')} />;
  return <NotFound />;
}

function RoutedErrorBoundary() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Router /></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><RoutedErrorBoundary /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;