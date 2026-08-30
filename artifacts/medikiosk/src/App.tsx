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
  LogOut,
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
type KioskStep = 'language' | 'details' | 'complaint' | 'questions' | 'review' | 'scan' | 'summary' | 'thankyou';
type Answers = Record<string, string>;
type Language = 'English' | 'हिन्दी';

type Question = {
  id: string;
  title: string;
  hindi: string;
  options: string[];
  optionsHindi: string[];
  helper?: string;
  helperHindi?: string;
};

const pathways: Record<Pathway, { label: string; hindi: string; icon: ReactNode; detail: string; detailHindi: string; questions: Question[] }> = {
  chest: {
    label: 'Chest discomfort',
    hindi: 'सीने में तकलीफ़',
    icon: <HeartPulse size={28} strokeWidth={1.8} />,
    detail: 'Pain, pressure, heaviness or unusual discomfort',
    detailHindi: 'दर्द, दबाव, भारीपन या असामान्य तकलीफ़',
    questions: [
      { id: 'onset', title: 'When did it begin?', hindi: 'यह कब शुरू हुआ?', options: ['Today', '1–3 days ago', 'More than 3 days ago'], optionsHindi: ['आज', '1–3 दिन पहले', '3 दिन से ज़्यादा पहले'] },
      { id: 'severity', title: 'How strong is it right now?', hindi: 'अभी तकलीफ़ कितनी तेज़ है?', options: ['Mild', 'Moderate', 'Severe'], optionsHindi: ['हल्की', 'मध्यम', 'तेज़'] },
      { id: 'breathing', title: 'Are you having trouble breathing?', hindi: 'क्या सांस लेने में तकलीफ़ है?', options: ['No', 'Yes'], optionsHindi: ['नहीं', 'हाँ'], helper: 'Choose “Yes” even if it comes and goes.', helperHindi: 'अगर तकलीफ़ कभी-कभी होती है, तब भी “हाँ” चुनें।' },
      { id: 'spread', title: 'Does it move to your arm, jaw or back?', hindi: 'क्या यह बांह, जबड़े या पीठ तक जाती है?', options: ['No', 'Yes', 'Not sure'], optionsHindi: ['नहीं', 'हाँ', 'पता नहीं'] },
    ],
  },
  abdomen: {
    label: 'Abdominal pain',
    hindi: 'पेट में दर्द',
    icon: <Activity size={28} strokeWidth={1.8} />,
    detail: 'Pain, cramps, bloating or discomfort in the stomach area',
    detailHindi: 'पेट में दर्द, ऐंठन, फूलना या तकलीफ़',
    questions: [
      { id: 'onset', title: 'When did it begin?', hindi: 'यह कब शुरू हुआ?', options: ['Today', '1–3 days ago', 'More than 3 days ago'], optionsHindi: ['आज', '1–3 दिन पहले', '3 दिन से ज़्यादा पहले'] },
      { id: 'severity', title: 'How strong is it right now?', hindi: 'अभी दर्द कितना तेज़ है?', options: ['Mild', 'Moderate', 'Severe'], optionsHindi: ['हल्का', 'मध्यम', 'तेज़'] },
      { id: 'vomiting', title: 'Have you vomited or felt unable to keep food down?', hindi: 'क्या उल्टी हुई या खाना नहीं रुक रहा?', options: ['No', 'Yes'], optionsHindi: ['नहीं', 'हाँ'] },
      { id: 'fever', title: 'Do you have a fever?', hindi: 'क्या आपको बुखार है?', options: ['No', 'Yes', 'Not sure'], optionsHindi: ['नहीं', 'हाँ', 'पता नहीं'] },
    ],
  },
  diabetes: {
    label: 'Diabetes follow-up',
    hindi: 'मधुमेह की जांच',
    icon: <ClipboardCheck size={28} strokeWidth={1.8} />,
    detail: 'Medicine review, sugar readings or diabetes-related concerns',
    detailHindi: 'दवा की जांच, शुगर रीडिंग या मधुमेह से जुड़ी चिंता',
    questions: [
      { id: 'onset', title: 'What brings you in today?', hindi: 'आज आप किस लिए आए हैं?', options: ['Routine follow-up', 'New concern', 'Medicine question'], optionsHindi: ['नियमित जांच', 'नई चिंता', 'दवा से जुड़ा सवाल'] },
      { id: 'reading', title: 'Have you checked your blood sugar recently?', hindi: 'क्या आपने हाल में शुगर जांची है?', options: ['Yes', 'No', 'Not sure'], optionsHindi: ['हाँ', 'नहीं', 'पता नहीं'] },
      { id: 'dizzy', title: 'Have you felt shaky, sweaty or dizzy?', hindi: 'क्या घबराहट, पसीना या चक्कर आए?', options: ['No', 'Yes'], optionsHindi: ['नहीं', 'हाँ'] },
      { id: 'medicines', title: 'Have you taken your medicines as usual?', hindi: 'क्या दवाएं सामान्य रूप से ली हैं?', options: ['Yes', 'No', 'Not sure'], optionsHindi: ['हाँ', 'नहीं', 'पता नहीं'] },
    ],
  },
};

const demoCases = [
  { id: 'MK-1048', name: 'Ravi Mehta', age: 54, issue: 'Chest discomfort', time: '08:42', priority: 'Prompt review', initials: 'RM', status: 'Awaiting review' },
  { id: 'MK-1047', name: 'Asha Kulkarni', age: 38, issue: 'Diabetes follow-up', time: '08:31', priority: 'Routine', initials: 'AK', status: 'Confirmed' },
  { id: 'MK-1046', name: 'Imran Shaikh', age: 29, issue: 'Abdominal pain', time: '08:05', priority: 'Routine', initials: 'IS', status: 'Awaiting review' },
];

const patientDemoAccounts = [
  { mobile: '9876543210', abha: '10000000000001', otp: '123456' },
  { mobile: '9876543211', abha: '10000000000002', otp: '123456' },
  { mobile: '9876543212', abha: '10000000000003', otp: '123456' },
  { mobile: '9876543213', abha: '10000000000004', otp: '123456' },
  { mobile: '9876543214', abha: '10000000000005', otp: '123456' },
];

const doctorDemoAccounts = [
  { userId: 'DR1001', password: 'Medi@123', name: 'Dr. Iyer' },
  { userId: 'DR1002', password: 'Medi@123', name: 'Dr. Shah' },
];

function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={`flex items-center gap-2.5 ${inverse ? 'text-[#f7f8f3]' : 'text-[#173543]'}`}>
      <span className={`relative grid h-9 w-9 place-items-center rounded-xl ${inverse ? 'bg-[#75d5c1] text-[#173543]' : 'bg-[#16665f] text-[#f7f8f3]'}`} aria-hidden="true">
        <span className="absolute h-5 w-1.5 rounded-full bg-current" />
        <span className="absolute h-1.5 w-5 rounded-full bg-current" />
      </span>
      <span className="font-display text-[1.18rem] font-bold tracking-[-.04em]">ClinSahayak</span>
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

function tr(language: Language, english: string, hindi: string) {
  return language === 'हिन्दी' ? hindi : english;
}

function LanguagePicker({ language, onChange, compact = false }: { language: Language; onChange: (language: Language) => void; compact?: boolean }) {
  return <div className={`grid ${compact ? 'grid-cols-2 gap-2' : 'gap-3 sm:grid-cols-2'}`}>
    {(['English', 'हिन्दी'] as Language[]).map(option => <button key={option} type="button" onClick={() => onChange(option)} className={`focus-ring rounded-xl border-2 p-4 text-left transition ${language === option ? 'border-[#16665f] bg-[#e8f4f0]' : 'border-[#cfdfd8] bg-[#fbfcf7] hover:border-[#8fc5b8]'}`}><span className="font-display font-bold text-[#173543]">{option}</span><span className="mt-1 block text-xs text-[#6c8585]">{option === 'English' ? 'Continue in English' : 'हिन्दी में जारी रखें'}</span></button>)}
  </div>;
}

function KioskHeader({ onExit, step, language }: { onExit: () => void; step: KioskStep; language: Language }) {
  const labels: Record<KioskStep, string> = {
    language: tr(language, 'Let’s begin', 'शुरू करते हैं'),
    details: tr(language, 'About you', 'आपके बारे में'),
    complaint: tr(language, 'What brings you in?', 'आप किस लिए आए हैं?'),
    questions: tr(language, 'A few questions', 'कुछ सवाल'),
    review: tr(language, 'Quick review', 'छोटी सी जांच'),
    scan: tr(language, 'Previous records', 'पिछले रिकॉर्ड'),
    summary: tr(language, 'Your intake note', 'आपकी जानकारी'),
    thankyou: tr(language, 'Finished', 'समाप्त'),
  };
  return (
    <header className="border-b border-[#dce5df] bg-[#f8faf5]/90 px-5 py-4 backdrop-blur md:px-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <button onClick={onExit} data-testid="button-kiosk-home" className="focus-ring rounded-lg" aria-label={tr(language, 'Return to MediKiosk home', 'MediKiosk के मुख्य पृष्ठ पर जाएं')}><Brand /></button>
        <div className="hidden text-center sm:block">
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6b8485]">{tr(language, 'Patient intake', 'मरीज़ की जानकारी')}</p>
          <p className="font-display text-sm font-semibold text-[#173543]">{labels[step]}</p>
        </div>
        <button data-testid="button-kiosk-language" className="focus-ring flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-[#37636a] hover:bg-[#e8efea]"><Languages size={17} /> {language} <ChevronRight size={14} /></button>
      </div>
    </header>
  );
}

function Progress({ step, language }: { step: KioskStep; language: Language }) {
  const labels = language === 'हिन्दी' ? ['शुरू', 'आपके बारे में', 'चिंता', 'सवाल', 'जांच'] : ['Start', 'About you', 'Concern', 'Questions', 'Review'];
  const index = Math.min(4, Math.max(0, ['language', 'details', 'complaint', 'questions', 'review', 'scan', 'summary'].indexOf(step)));
  return (
    <div className="mb-9 flex items-center gap-2" aria-label={tr(language, `Step ${index + 1} of 5`, `${index + 1} में से चरण ${index + 1}`)}>
      {labels.map((label, i) => <div key={label} className="flex min-w-0 flex-1 items-center gap-2">
        <div className={`h-2 flex-1 rounded-full transition-all duration-500 ${i <= index ? 'bg-[#16665f]' : 'bg-[#d7e4df]'}`} />
        {i === index && <span className="hidden whitespace-nowrap text-[11px] font-bold text-[#42666a] sm:inline">{label}</span>}
      </div>)}
    </div>
  );
}

function AppFooter({ language = 'English', go }: { language?: Language; go?: (path: string) => void }) {
  return (
    <footer className="mt-auto border-t border-[#dce5df] bg-[#edf3ed] text-[#4d6668]">
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-10">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-3 sm:col-span-2 md:col-span-1">
            <Brand />
            <p className="text-xs leading-relaxed text-[#607979]">
              {tr(
                language,
                'A calm, accessible pre-consultation intake workflow for Indian hospital OPDs. Collects structured history before the doctor consultation.',
                'भारतीय अस्पताल ओपीडी के लिए एक सुलभ और व्यवस्थित प्री-कंसल्टेशन हिस्ट्री टेकिंग सिस्टम।'
              )}
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#bcdad2] bg-[#e4f2ee] px-2.5 py-1 text-[11px] font-bold text-[#16665f]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#16665f]" />
              {tr(language, 'SIH26047 Prototype', 'SIH26047 प्रोटोटाइप')}
            </div>
          </div>

          <div>
            <p className="font-display text-xs font-bold uppercase tracking-wider text-[#173543]">
              {tr(language, 'Access Portals', 'पोर्टल विकल्प')}
            </p>
            <ul className="mt-3 space-y-2 text-xs font-semibold">
              <li>
                <button
                  type="button"
                  onClick={() => (go ? go('/auth/medikiosk') : (window.location.href = '/auth/medikiosk'))}
                  className="transition hover:text-[#16665f]"
                >
                  {tr(language, 'MediKiosk (Touch + Voice)', 'MediKiosk (टच + वॉइस)')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => (go ? go('/auth/mediweb') : (window.location.href = '/auth/mediweb'))}
                  className="transition hover:text-[#16665f]"
                >
                  {tr(language, 'MediWeb (Self-service)', 'MediWeb (वेब आधारित)')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => (go ? go('/doctor') : (window.location.href = '/doctor'))}
                  className="transition hover:text-[#16665f]"
                >
                  {tr(language, 'Doctor Dashboard', 'डॉक्टर डैशबोर्ड')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => (go ? go('/account') : (window.location.href = '/account'))}
                  className="transition hover:text-[#16665f]"
                >
                  {tr(language, 'Patient Registration', 'मरीज़ पंजीकरण')}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-display text-xs font-bold uppercase tracking-wider text-[#173543]">
              {tr(language, 'Clinical Notice', 'महत्वपूर्ण सूचना')}
            </p>
            <div className="mt-3 space-y-2 text-xs text-[#607979]">
              <p className="flex items-start gap-1.5">
                <ShieldCheck size={14} className="mt-0.5 shrink-0 text-[#16665f]" />
                <span>
                  {tr(
                    language,
                    'History collection only — no diagnostic or prescriptive claims made.',
                    'केवल केस हिस्ट्री संग्रह — कोई बीमारी या दवा नहीं बताई जाती।'
                  )}
                </span>
              </p>
              <p className="flex items-start gap-1.5">
                <CircleAlert size={14} className="mt-0.5 shrink-0 text-[#a05c2b]" />
                <span>
                  {tr(
                    language,
                    'All summary drafts require review and confirmation by an OPD physician.',
                    'सभी सारांश डॉक्टर द्वारा सत्यापित किए जाने अनिवार्य हैं।'
                  )}
                </span>
              </p>
            </div>
          </div>

          <div>
            <p className="font-display text-xs font-bold uppercase tracking-wider text-[#173543]">
              {tr(language, 'Assistance', 'सहायता')}
            </p>
            <div className="mt-3 space-y-2 text-xs text-[#607979]">
              <p className="flex items-center gap-1.5">
                <Volume2 size={14} className="text-[#16665f]" />
                <span>{tr(language, 'Simulated voice + OCR', 'सिम्युलेटेड वॉइस और ओसीआर')}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Languages size={14} className="text-[#16665f]" />
                <span>{tr(language, 'Bilingual (English / हिन्दी)', 'द्विभाषी (English / हिन्दी)')}</span>
              </p>
              <div className="mt-3 rounded-lg border border-[#e0c9aa] bg-[#fffaf0] p-2.5 text-[11px] text-[#875525]">
                <strong className="block font-bold">
                  {tr(language, 'Emergency Notice:', 'आपातकालीन सूचना:')}
                </strong>
                {tr(
                  language,
                  'For urgent care, report immediately to the Emergency / Casualty ward.',
                  'गंभीर स्थिति में सीधे इमरजेंसी / कैजुअल्टी वार्ड में जाएं।'
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-[#d8e3dc] pt-5 text-[11px] text-[#6e8584] sm:flex-row">
          <p>
            {tr(
              language,
              '© 2026 ClinSahayak (MediKiosk) · Designed for busy Indian Hospital OPDs · College Prototype',
              '© 2026 ClinSahayak (MediKiosk) · भारतीय अस्पताल ओपीडी के लिए डिज़ाइन किया गया · कॉलेज प्रोटोटाइप'
            )}
          </p>
          <p className="text-center sm:text-right">
            {tr(
              language,
              'Private local session · No live hospital database connected',
              'स्थानीय ब्राउज़र सत्र · कोई लाइव डेटाबेस कनेक्ट नहीं'
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}

function KioskLayout({ children, onExit, step, language }: { children: ReactNode; onExit: () => void; step: KioskStep; language: Language }) {
  return (
    <div className="kiosk-shell flex min-h-[100dvh] flex-col">
      <KioskHeader onExit={onExit} step={step} language={language} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-8 md:px-10 md:py-12">
        <Progress step={step} language={language} />
        {children}
      </main>
      <footer className="border-t border-[#dce5df] bg-[#edf3ed]/80 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-2 px-5 text-xs text-[#6e8584] sm:flex-row md:px-10">
          <span className="flex items-center gap-2 text-center sm:text-left">
            <ShieldCheck size={16} className="shrink-0 text-[#16665f]" />
            {tr(
              language,
              'Your answers stay on this kiosk in this prototype. No diagnosis is made here.',
              'इस प्रोटोटाइप में आपके जवाब इसी कियोस्क पर रहते हैं। यहां कोई बीमारी नहीं बताई जाती।'
            )}
          </span>
          <span className="text-[11px] font-semibold text-[#668082]">
            {tr(language, 'Step-by-step assisted intake', 'चरणबद्ध सहायक जानकारी')}
          </span>
        </div>
      </footer>
    </div>
  );
}

function Landing({ go }: { go: (path: string) => void }) {
  return (
    <div className="kiosk-shell flex min-h-[100dvh] flex-col">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 md:px-10">
        <Link href="/" className="focus-ring rounded-lg" data-testid="link-home-brand"><Brand /></Link>
        <div className="flex items-center gap-2">
          <Link href="/mediweb" data-testid="link-mediweb" className="focus-ring rounded-lg px-3 py-2 text-sm font-bold text-[#4b676b] hover:bg-[#e9eee9]">About MediWeb</Link>
          <Button onClick={() => go('/doctor')} variant="secondary" className="hidden min-h-10 px-4 sm:inline-flex" data-testid="button-open-doctor">Doctor portal</Button>
        </div>
      </nav>
      <main className="mx-auto grid max-w-7xl flex-1 items-center gap-14 px-5 pb-14 pt-8 md:grid-cols-[1.03fr_.97fr] md:px-10 md:pb-24 md:pt-16">
        <section className="animate-enter-up">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#b9d8d1] bg-[#e7f3ef] px-3 py-1.5 text-xs font-bold tracking-wide text-[#16665f]"><span className="h-2 w-2 rounded-full bg-[#75cdb9]" /> A calmer start to your OPD visit</div>
          <h1 className="text-balance max-w-2xl font-display text-[clamp(3.2rem,8vw,6.7rem)] font-bold leading-[.93] tracking-[-.075em] text-[#173543]">One bridge for<br /><span className="text-[#16665f]">better first notes.</span></h1>
          <p className="mt-7 max-w-lg text-lg leading-8 text-[#536c71]">ClinSahayak connects patients and doctors through one clearer clinical history workflow — whether you prefer a kiosk, a web experience, or a doctor workspace.</p>
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
      <AppFooter go={go} />
    </div>
  );
}

function WelcomeLanguage({ onChoose }: { onChoose: (language: Language) => void }) {
  return (
    <div className="kiosk-shell flex min-h-[100dvh] flex-col">
      <main className="mx-auto grid w-full max-w-3xl flex-1 place-items-center px-5 py-10">
        <div className="w-full rounded-[2rem] border border-[#cfdfd8] bg-[#f9fbf7] p-7 shadow-[0_18px_40px_rgba(22,73,73,.08)] md:p-12">
          <Brand />
          <p className="mt-12 text-sm font-bold text-[#16665f]">नमस्ते · Welcome</p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-[-.06em] text-[#173543] md:text-6xl">
            Choose your language<br />अपनी भाषा चुनें
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#5c7478]">
            Select the language you are most comfortable using. Every patient screen will continue in that language.
          </p>
          <div className="mt-10">
            <LanguagePicker language="English" onChange={onChoose} />
          </div>
        </div>
      </main>
      <AppFooter language="English" go={path => (window.location.href = path)} />
    </div>
  );
}

function ServiceChoice({ language, go }: { language: Language; go: (path: string) => void }) {
  const options = [
    { path: '/account', icon: <UserPlus size={22} />, title: tr(language, 'Create account', 'खाता बनाएं'), detail: tr(language, 'Set up your patient profile', 'अपनी मरीज़ प्रोफ़ाइल बनाएं') },
    { path: '/auth/medikiosk', icon: <HeartPulse size={22} />, title: 'MediKiosk', detail: tr(language, 'Assisted touch intake', 'टच से जानकारी भरें') },
    { path: '/auth/mediweb', icon: <FileText size={22} />, title: 'MediWeb', detail: tr(language, 'Self-service web intake', 'वेब से जानकारी भरें') },
    { path: '/doctor', icon: <Stethoscope size={22} />, title: tr(language, 'Doctor dashboard', 'डॉक्टर डैशबोर्ड'), detail: tr(language, 'Review patient intake notes', 'मरीज़ की जानकारी देखें') },
  ];
  return (
    <div className="kiosk-shell flex min-h-[100dvh] flex-col">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 md:px-10">
        <button onClick={() => go('/choose')} className="focus-ring rounded-lg"><Brand /></button>
        <span className="rounded-full bg-[#e5f2ee] px-3 py-1.5 text-xs font-bold text-[#28675f]">{language}</span>
      </nav>
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12 md:px-10 md:py-20">
        <p className="text-sm font-bold text-[#16665f]">{tr(language, 'Welcome to ClinSahayak', 'ClinSahayak में आपका स्वागत है')}</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-[-.06em] text-[#173543] md:text-6xl">{tr(language, 'How would you like to continue?', 'आप कैसे आगे बढ़ना चाहेंगे?')}</h1>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {options.map(option => (
            <button key={option.path} onClick={() => go(option.path)} className="focus-ring group flex min-h-28 items-center gap-4 rounded-2xl border border-[#cedfd8] bg-[#f9fbf7] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#8fc5b8]">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#e2f1ec] text-[#16665f]">{option.icon}</span>
              <span className="flex-1">
                <span className="block font-display text-lg font-bold text-[#173543]">{option.title}</span>
                <span className="mt-1 block text-sm text-[#5d7779]">{option.detail}</span>
              </span>
              <ArrowRight size={18} className="text-[#16665f]" />
            </button>
          ))}
        </div>
      </main>
      <AppFooter language={language} go={go} />
    </div>
  );
}

type AuthChannel = 'medikiosk' | 'mediweb';
type AccountProfile = { name: string; age: string; phone: string; abhaId: string; language: Language };

function AuthPage({ channel, go, onVerified, language }: { channel: AuthChannel; go: (path: string) => void; onVerified: (language: Language) => void; language: Language }) {
  const [method, setMethod] = useState<'mobile' | 'abha'>('mobile');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [matchedAccount, setMatchedAccount] = useState<typeof patientDemoAccounts[number] | null>(null);
  const isKiosk = channel === 'medikiosk';

  const sendOtp = () => {
    const account = patientDemoAccounts.find(item => method === 'mobile' ? item.mobile === identifier.trim() : item.abha.toLowerCase() === identifier.trim().toLowerCase());
    if (!account) {
      setError(tr(language, 'This mobile number or ABHA ID is not registered in the demo.', 'यह मोबाइल नंबर या ABHA ID डेमो में दर्ज नहीं है।'));
      return;
    }
    setError('');
    setMatchedAccount(account);
    setSent(true);
  };

  const verifyOtp = () => {
    if (!matchedAccount || otp !== matchedAccount.otp) {
      setError(tr(language, 'Incorrect demo OTP. Please try again.', 'गलत डेमो OTP। कृपया फिर से प्रयास करें।'));
      return;
    }
    onVerified(language);
  };

  return (
    <div className="kiosk-shell flex min-h-[100dvh] flex-col">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 md:px-10">
        <button onClick={() => go('/')} data-testid="button-auth-home" className="focus-ring rounded-lg"><Brand /></button>
        <span className="rounded-full bg-[#e5f2ee] px-3 py-1.5 text-xs font-bold text-[#28675f]">{tr(language, isKiosk ? 'MediKiosk access' : 'MediWeb access', isKiosk ? 'MediKiosk प्रवेश' : 'MediWeb प्रवेश')}</span>
      </nav>
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 pt-8 md:px-10 md:pt-14">
        <button onClick={() => go('/')} data-testid="button-auth-back" className="focus-ring mb-8 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-[#607879] hover:bg-[#e9eee9]"><ArrowLeft size={17} /> {tr(language, 'Back to ClinSahayak', 'ClinSahayak पर वापस जाएं')}</button>
        <div className="mb-8 max-w-xl rounded-xl border border-[#cbded6] bg-[#e8f4f0] px-4 py-3 text-sm font-bold text-[#28675f]">{tr(language, 'Language selected: English', 'चुनी गई भाषा: हिन्दी')}</div>
        <div className="grid items-start gap-12 md:grid-cols-[.85fr_1.15fr]">
          <div className="max-w-md">
            <p className="text-sm font-bold text-[#16665f]">{tr(language, isKiosk ? 'A simpler way in' : 'Your history, ready when you are', isKiosk ? 'आसान तरीके से प्रवेश करें' : 'आपकी जानकारी, जब भी ज़रूरत हो')}</p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight tracking-[-.06em] text-[#173543] md:text-5xl">{tr(language, isKiosk ? 'Sign in to your patient kiosk.' : 'Sign in to MediWeb.', isKiosk ? 'अपने patient kiosk में प्रवेश करें।' : 'MediWeb में प्रवेश करें।')}</h1>
            <p className="mt-4 text-base leading-7 text-[#5c7478]">{tr(language, isKiosk ? 'Use your mobile number or ABHA ID. We’ll guide you through the next step with voice-friendly prompts.' : 'Use your mobile number or ABHA ID to continue your self-service intake.', isKiosk ? 'अपना मोबाइल नंबर या ABHA ID डालें। आवाज़ की मदद से हम आपको आगे ले जाएंगे।' : 'अपना मोबाइल नंबर या ABHA ID डालकर अपनी जानकारी शुरू करें।')}</p>
            <div className="mt-8 rounded-2xl border border-[#cbded6] bg-[#e8f4f0] p-4 text-sm leading-6 text-[#315d5c]"><ShieldCheck className="mb-2 text-[#16665f]" size={18} />{tr(language, 'Your details are only being used for this local prototype. No real OTP is sent.', 'आपकी जानकारी केवल इस स्थानीय प्रोटोटाइप के लिए इस्तेमाल हो रही है। कोई असली OTP नहीं भेजा जाता।')}</div>
          </div>
          <section className="rounded-[2rem] border border-[#cfdfd8] bg-[#f9fbf7] p-6 shadow-[0_18px_40px_rgba(22,73,73,.08)] md:p-8">
            {!sent ? <>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-[#6c8585]">{tr(language, 'Patient login', 'मरीज़ लॉगिन')}</p>
              <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-[#edf3ed] p-1">
                <button onClick={() => { setMethod('mobile'); setError(''); }} data-testid="button-login-mobile" className={`focus-ring rounded-lg px-3 py-3 text-sm font-bold ${method === 'mobile' ? 'bg-[#f9fbf7] text-[#16665f] shadow-sm' : 'text-[#607879]'}`}><Smartphone className="mx-auto mb-1" size={18} />{tr(language, 'Mobile number', 'मोबाइल नंबर')}</button>
                <button onClick={() => { setMethod('abha'); setError(''); }} data-testid="button-login-abha" className={`focus-ring rounded-lg px-3 py-3 text-sm font-bold ${method === 'abha' ? 'bg-[#f9fbf7] text-[#16665f] shadow-sm' : 'text-[#607879]'}`}><KeyRound className="mx-auto mb-1" size={18} />ABHA ID</button>
              </div>
              <label className="mt-7 block"><span className="mb-2 block text-sm font-bold text-[#35585e]">{method === 'mobile' ? tr(language, 'Mobile number', 'मोबाइल नंबर') : 'ABHA ID'}</span><input autoFocus value={identifier} onChange={e => setIdentifier(e.target.value)} data-testid="input-login-identifier" type={method === 'mobile' ? 'tel' : 'text'} placeholder={method === 'mobile' ? tr(language, 'Enter 10-digit mobile number', '10 अंकों का मोबाइल नंबर डालें') : tr(language, 'Enter your ABHA ID', 'अपना ABHA ID डालें')} className="focus-ring h-14 w-full rounded-xl border border-[#bfd7d0] bg-[#fbfcf7] px-4 text-base text-[#173543] outline-none focus:border-[#16665f]" /></label>
              {error && <p className="mt-3 text-sm font-bold text-[#a34234]">{error}</p>}
              <Button onClick={sendOtp} className="mt-7 w-full" data-testid="button-send-otp">{tr(language, 'Send OTP', 'OTP भेजें')} <ArrowRight size={18} /></Button>
              <p className="mt-5 text-center text-xs text-[#718788]">{tr(language, 'New to ClinSahayak?', 'ClinSahayak पर नए हैं?')} <button onClick={() => go('/account')} className="font-bold text-[#16665f] underline-offset-2 hover:underline">{tr(language, 'Create an account', 'खाता बनाएं')}</button></p>
            </> : <>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-[#6c8585]">{tr(language, 'Verify your identity', 'अपनी पहचान की पुष्टि करें')}</p>
              <h2 className="mt-3 font-display text-2xl font-bold tracking-[-.04em] text-[#173543]">{tr(language, 'Enter the six-digit OTP', 'छह अंकों का OTP डालें')}</h2>
              <p className="mt-3 text-sm leading-6 text-[#5c7478]">{tr(language, 'A prototype code would be sent to', 'इस प्रोटोटाइप में कोड यहां भेजा जाता')} <strong className="text-[#35585e]">{identifier}</strong>.</p>
              <div className="mt-6 rounded-xl border border-[#e3c7aa] bg-[#fff8ea] p-4 text-sm leading-6 text-[#6f665c]"><strong className="text-[#98612f]">{tr(language, 'Demo OTP:', 'डेमो OTP:')}</strong> {matchedAccount?.otp}</div>
              <label className="mt-6 block"><span className="mb-2 block text-sm font-bold text-[#35585e]">{tr(language, 'One-time password', 'वन-टाइम पासवर्ड')}</span><input autoFocus value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} data-testid="input-login-otp" inputMode="numeric" maxLength={6} placeholder="123456" className="focus-ring h-14 w-full rounded-xl border border-[#bfd7d0] bg-[#fbfcf7] px-4 text-center text-xl font-bold tracking-[.35em] text-[#173543] outline-none focus:border-[#16665f]" /></label>
              {error && <p className="mt-3 text-sm font-bold text-[#a34234]">{error}</p>}
              <Button onClick={verifyOtp} className="mt-7 w-full" data-testid="button-verify-otp">{tr(language, 'Verify and continue', 'पुष्टि करें और आगे बढ़ें')} <Check size={18} /></Button>
              <button onClick={() => { setSent(false); setOtp(''); setError(''); }} data-testid="button-change-login" className="focus-ring mt-4 block w-full rounded-lg py-2 text-center text-sm font-bold text-[#607879] hover:bg-[#e9eee9]">{tr(language, 'Use a different sign-in method', 'दूसरे तरीके से प्रवेश करें')}</button>
            </>}
          </section>
        </div>
      </main>
      <AppFooter language={language} go={go} />
    </div>
  );
}

function AccountPage({ go, onComplete, language: selectedLanguage }: { go: (path: string) => void; onComplete: (profile: AccountProfile) => void; language: Language }) {
  const [profile, setProfile] = useState<AccountProfile>({ name: '', age: '', phone: '', abhaId: '', language: selectedLanguage });
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [languageChosen, setLanguageChosen] = useState(true);
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

  if (!languageChosen) {
    return (
      <div className="kiosk-shell flex min-h-[100dvh] flex-col">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 md:px-10"><button onClick={() => go('/')} data-testid="button-account-home" className="focus-ring rounded-lg"><Brand /></button><span className="rounded-full bg-[#e5f2ee] px-3 py-1.5 text-xs font-bold text-[#28675f]">Patient account</span></nav>
        <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 pt-12 md:px-10 md:pt-20">
          <button onClick={() => go('/')} data-testid="button-account-back" className="focus-ring mb-10 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-[#607879] hover:bg-[#e9eee9]"><ArrowLeft size={17} /> Back to ClinSahayak</button>
          <div className="max-w-xl"><p className="text-sm font-bold text-[#16665f]">नमस्ते · Welcome</p><h1 className="mt-3 font-display text-4xl font-bold tracking-[-.06em] text-[#173543] md:text-5xl">Choose your language first.</h1><p className="mt-4 text-base leading-7 text-[#5c7478]">अपना खाता बनाने से पहले अपनी पसंदीदा भाषा चुनें। आगे की पूरी जानकारी उसी भाषा में होगी।</p></div>
          <div className="mt-10 rounded-[2rem] border border-[#cfdfd8] bg-[#f9fbf7] p-6 shadow-[0_18px_40px_rgba(22,73,73,.08)] md:p-8">
            <p className="mb-4 text-sm font-bold text-[#35585e]">Preferred language · पसंदीदा भाषा</p>
            <LanguagePicker language={profile.language} onChange={language => { setProfile({ ...profile, language }); setLanguageChosen(true); }} />
          </div>
        </main>
        <AppFooter language={profile.language} go={go} />
      </div>
    );
  }

  const language = profile.language;
  return (
    <div className="kiosk-shell flex min-h-[100dvh] flex-col">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 md:px-10"><button onClick={() => go('/')} data-testid="button-account-home" className="focus-ring rounded-lg"><Brand /></button><span className="rounded-full bg-[#e5f2ee] px-3 py-1.5 text-xs font-bold text-[#28675f]">{tr(language, 'Patient account', 'मरीज़ खाता')}</span></nav>
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 pt-8 md:px-10 md:pt-14">
        <button onClick={() => go('/')} data-testid="button-account-back" className="focus-ring mb-8 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-[#607879] hover:bg-[#e9eee9]"><ArrowLeft size={17} /> {tr(language, 'Back to ClinSahayak', 'ClinSahayak पर वापस जाएं')}</button>
        <div className="grid items-start gap-12 md:grid-cols-[.8fr_1.2fr]">
          <div className="max-w-md"><p className="text-sm font-bold text-[#16665f]">{tr(language, 'Start once, continue anywhere', 'एक बार शुरू करें, कहीं भी जारी रखें')}</p><h1 className="mt-3 font-display text-4xl font-bold leading-tight tracking-[-.06em] text-[#173543] md:text-5xl">{tr(language, 'Create your ClinSahayak account.', 'अपना ClinSahayak खाता बनाएं।')}</h1><p className="mt-4 text-base leading-7 text-[#5c7478]">{tr(language, 'Your account lets you use MediKiosk or MediWeb with the same patient profile.', 'एक ही मरीज़ जानकारी से MediKiosk या MediWeb इस्तेमाल करें।')}</p><div className="mt-8 rounded-2xl border border-[#cbded6] bg-[#e8f4f0] p-4 text-sm leading-6 text-[#315d5c]"><ShieldCheck className="mb-2 text-[#16665f]" size={18} />{tr(language, 'For this prototype, account details stay in local browser state and are not sent to a real service.', 'इस प्रोटोटाइप में खाता जानकारी आपके ब्राउज़र में ही रहती है और किसी असली सेवा को नहीं भेजी जाती।')}</div></div>
          <section className="rounded-[2rem] border border-[#cfdfd8] bg-[#f9fbf7] p-6 shadow-[0_18px_40px_rgba(22,73,73,.08)] md:p-8">
            {!sent ? <>
              <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#6c8585]">{tr(language, 'New patient profile', 'नई मरीज़ जानकारी')}</p><h2 className="mt-2 font-display text-2xl font-bold tracking-[-.04em] text-[#173543]">{tr(language, 'Tell us the basics', 'ज़रूरी जानकारी दें')}</h2></div><UserPlus className="text-[#16665f]" size={24} /></div>
              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-[#35585e]">{tr(language, 'Full name', 'पूरा नाम')} <span className="text-[#c65b45]">*</span></span><input autoFocus value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} data-testid="input-account-name" placeholder={tr(language, 'For example, Rajesh Kumar', 'उदाहरण: राजेश कुमार')} className="focus-ring h-14 w-full rounded-xl border border-[#bfd7d0] bg-[#fbfcf7] px-4 text-base text-[#173543] outline-none focus:border-[#16665f]" /></label>
                <label><span className="mb-2 block text-sm font-bold text-[#35585e]">{tr(language, 'Age', 'उम्र')} <span className="text-[#c65b45]">*</span></span><input type="number" min="1" max="120" value={profile.age} onChange={e => setProfile({ ...profile, age: e.target.value })} data-testid="input-account-age" placeholder={tr(language, 'Age in years', 'उम्र सालों में')} className="focus-ring h-14 w-full rounded-xl border border-[#bfd7d0] bg-[#fbfcf7] px-4 text-base text-[#173543] outline-none focus:border-[#16665f]" /></label>
                <label><span className="mb-2 block text-sm font-bold text-[#35585e]">{tr(language, 'Mobile number', 'मोबाइल नंबर')} <span className="text-[#c65b45]">*</span></span><input type="tel" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} data-testid="input-account-mobile" placeholder={tr(language, '10-digit mobile number', '10 अंकों का मोबाइल नंबर')} className="focus-ring h-14 w-full rounded-xl border border-[#bfd7d0] bg-[#fbfcf7] px-4 text-base text-[#173543] outline-none focus:border-[#16665f]" /></label>
                <label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-[#35585e]">ABHA ID <span className="text-[#c65b45]">*</span></span><input value={profile.abhaId} onChange={e => setProfile({ ...profile, abhaId: e.target.value })} data-testid="input-account-abha" placeholder={tr(language, 'Enter your ABHA ID', 'अपना ABHA ID डालें')} className="focus-ring h-14 w-full rounded-xl border border-[#bfd7d0] bg-[#fbfcf7] px-4 text-base text-[#173543] outline-none focus:border-[#16665f]" /></label>
              </div>
              {error && <p className="mt-4 text-sm font-bold text-[#a34234]">{error}</p>}<Button onClick={submit} className="mt-7 w-full" data-testid="button-account-continue">{tr(language, 'Continue to OTP', 'OTP के लिए आगे बढ़ें')} <ArrowRight size={18} /></Button>
            </> : <>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-[#6c8585]">{tr(language, 'Verify your mobile', 'मोबाइल की पुष्टि करें')}</p><h2 className="mt-3 font-display text-2xl font-bold tracking-[-.04em] text-[#173543]">{tr(language, 'Finish creating your account', 'अपना खाता पूरा करें')}</h2><p className="mt-3 text-sm leading-6 text-[#5c7478]">{tr(language, 'We would send a one-time password to', 'वन-टाइम पासवर्ड यहां भेजा जाएगा')} <strong className="text-[#35585e]">{profile.phone}</strong>.</p><div className="mt-6 rounded-xl border border-[#e3c7aa] bg-[#fff8ea] p-4 text-sm leading-6 text-[#6f665c]"><strong className="text-[#98612f]">{tr(language, 'Demo OTP:', 'डेमो OTP:')}</strong> 123456</div><label className="mt-6 block"><span className="mb-2 block text-sm font-bold text-[#35585e]">{tr(language, 'One-time password', 'वन-टाइम पासवर्ड')}</span><input autoFocus value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} data-testid="input-account-otp" inputMode="numeric" maxLength={6} placeholder="123456" className="focus-ring h-14 w-full rounded-xl border border-[#bfd7d0] bg-[#fbfcf7] px-4 text-center text-xl font-bold tracking-[.35em] text-[#173543] outline-none focus:border-[#16665f]" /></label>{error && <p className="mt-3 text-sm font-bold text-[#a34234]">{error}</p>}<Button onClick={verify} className="mt-7 w-full" data-testid="button-account-verify">{tr(language, 'Verify and open MediKiosk', 'पुष्टि करें और MediKiosk खोलें')} <Check size={18} /></Button><button onClick={() => { setSent(false); setOtp(''); setError(''); }} data-testid="button-account-edit" className="focus-ring mt-4 block w-full rounded-lg py-2 text-center text-sm font-bold text-[#607879] hover:bg-[#e9eee9]">{tr(language, 'Edit account details', 'खाता जानकारी बदलें')}</button>
            </>}
          </section>
        </div>
      </main>
      <AppFooter language={language} go={go} />
    </div>
  );
}

function LanguageStep({ onChoose }: { onChoose: (language: Language) => void }) 
{
  return <div className="animate-enter-up"><div className="max-w-xl"><p className="text-sm font-bold text-[#16665f]">नमस्ते · Welcome</p><h1 className="mt-3 font-display text-4xl font-bold tracking-[-.06em] text-[#173543] md:text-5xl">Which language feels<br />most comfortable?</h1><p className="mt-4 text-base leading-7 text-[#5c7478]">You can change this at any time. We’ll keep every question simple.</p></div><div className="mt-10 grid gap-4 sm:grid-cols-2"><button onClick={() => onChoose('English')} data-testid="button-language-english" className="focus-ring group rounded-2xl border-2 border-[#16665f] bg-[#f8fbf6] p-6 text-left shadow-[0_10px_25px_rgba(22,102,95,.08)] transition hover:-translate-y-0.5"><span className="grid h-12 w-12 place-items-center rounded-xl bg-[#dcefe9] text-[#16665f]"><Languages /></span><p className="mt-7 font-display text-2xl font-bold text-[#173543]">English</p><p className="mt-1 text-sm text-[#668082]">Continue in English</p><span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#16665f]">Choose English <ArrowRight size={16} className="transition group-hover:translate-x-1" /></span></button><button onClick={() => onChoose('हिन्दी')} data-testid="button-language-hindi" className="focus-ring group rounded-2xl border border-[#cbded6] bg-[#f8fbf6] p-6 text-left transition hover:-translate-y-0.5 hover:border-[#16665f]"><span className="grid h-12 w-12 place-items-center rounded-xl bg-[#fff0db] text-[#9c632d]"><Languages /></span><p className="mt-7 font-display text-2xl font-bold text-[#173543]">हिन्दी</p><p className="mt-1 text-sm text-[#668082]">हिन्दी में जारी रखें</p><span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#16665f]">हिन्दी चुनें <ArrowRight size={16} /></span></button></div><p className="mt-8 flex items-center gap-2 text-xs text-[#708685]"><Volume2 size={15} /> Voice-style prompts are simulated for this prototype.</p></div>;
}

function DetailsStep({ name, age, phone, language, setName, setAge, setPhone, onNext }: { name: string; age: string; phone: string; language: Language; setName: (v: string) => void; setAge: (v: string) => void; setPhone: (v: string) => void; onNext: () => void }) {
  const ready = name.trim().length > 1 && Number(age) > 0;
  return <div className="animate-enter-up max-w-2xl"><p className="text-sm font-bold text-[#16665f]">{tr(language, 'A little about you', 'आपके बारे में')}</p><h1 className="mt-3 font-display text-4xl font-bold tracking-[-.06em] text-[#173543] md:text-5xl">{tr(language, 'Let’s put a name to your visit.', 'आपकी मुलाकात के लिए नाम लिखें।')}</h1><p className="mt-4 text-base leading-7 text-[#5c7478]">{tr(language, 'Only the basics for now. Your doctor can complete the rest with you.', 'अभी केवल ज़रूरी जानकारी दें। बाकी जानकारी डॉक्टर आपके साथ पूरी करेंगे।')}</p><div className="mt-10 grid gap-5 sm:grid-cols-2"><label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-[#35585e]">{tr(language, 'Full name', 'पूरा नाम')} <span className="text-[#c65b45]">*</span></span><input autoFocus value={name} onChange={e => setName(e.target.value)} data-testid="input-patient-name" placeholder={tr(language, 'For example, Meena Sharma', 'उदाहरण: मीना शर्मा')} className="focus-ring h-14 w-full rounded-xl border border-[#bfd7d0] bg-[#fbfcf7] px-4 text-base text-[#173543] outline-none transition focus:border-[#16665f]" /></label><label><span className="mb-2 block text-sm font-bold text-[#35585e]">{tr(language, 'Age', 'उम्र')} <span className="text-[#c65b45]">*</span></span><input type="number" min="1" max="120" value={age} onChange={e => setAge(e.target.value)} data-testid="input-patient-age" placeholder={tr(language, 'Age in years', 'उम्र सालों में')} className="focus-ring h-14 w-full rounded-xl border border-[#bfd7d0] bg-[#fbfcf7] px-4 text-base text-[#173543] outline-none transition focus:border-[#16665f]" /></label><label><span className="mb-2 block text-sm font-bold text-[#35585e]">{tr(language, 'Mobile number', 'मोबाइल नंबर')} <span className="font-normal text-[#718788]">{tr(language, '(optional)', '(वैकल्पिक)')}</span></span><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} data-testid="input-patient-phone" placeholder={tr(language, '10-digit number', '10 अंकों का नंबर')} className="focus-ring h-14 w-full rounded-xl border border-[#bfd7d0] bg-[#fbfcf7] px-4 text-base text-[#173543] outline-none transition focus:border-[#16665f]" /></label></div><div className="mt-10 flex items-center justify-between"><span className="text-xs text-[#778b8b]">{tr(language, 'Required fields are marked with *', '* से ज़रूरी जानकारी चिन्हित है')}</span><Button onClick={onNext} disabled={!ready} className="disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-details-continue">{tr(language, 'Continue', 'आगे बढ़ें')} <ArrowRight size={18} /></Button></div></div>;
}

function ComplaintStep({ pathway, language, setPathway, onNext }: { pathway: Pathway | null; language: Language; setPathway: (p: Pathway) => void; onNext: () => void }) {
  return <div className="animate-enter-up"><div className="max-w-2xl"><p className="text-sm font-bold text-[#16665f]">{tr(language, 'The important bit', 'ज़रूरी बात')}</p><h1 className="mt-3 font-display text-4xl font-bold tracking-[-.06em] text-[#173543] md:text-5xl">{tr(language, 'What brings you in today?', 'आज आप किस लिए आए हैं?')}</h1><p className="mt-4 text-base leading-7 text-[#5c7478]">{tr(language, 'Pick the closest match. This is not a diagnosis — it simply helps us ask better questions.', 'सबसे सही विकल्प चुनें। यह बीमारी की जांच नहीं है — इससे हम बेहतर सवाल पूछ पाएंगे।')}</p></div><div className="mt-9 grid gap-3">{(Object.keys(pathways) as Pathway[]).map(key => { const item = pathways[key]; const selected = pathway === key; return <button key={key} onClick={() => setPathway(key)} data-testid={`button-complaint-${key}`} className={`focus-ring flex items-center gap-4 rounded-2xl border p-5 text-left transition ${selected ? 'border-2 border-[#16665f] bg-[#e8f4f0] shadow-[0_8px_20px_rgba(22,102,95,.08)]' : 'border-[#cedfd8] bg-[#f9fbf7] hover:-translate-y-0.5 hover:border-[#8fc5b8]'}`}><span className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl ${selected ? 'bg-[#16665f] text-[#f7f8f3]' : 'bg-[#e8efea] text-[#16665f]'}`}>{item.icon}</span><span className="flex-1"><span className="block font-display text-lg font-bold text-[#173543]">{language === 'हिन्दी' ? item.hindi : item.label}</span><span className="block text-sm text-[#668082]">{language === 'हिन्दी' ? item.detailHindi : item.detail}</span></span>{selected ? <CheckCircle2 className="text-[#16665f]" /> : <ChevronRight className="text-[#9bb3af]" />}</button>; })}</div><div className="mt-8 flex justify-end"><Button onClick={onNext} disabled={!pathway} className="disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-complaint-continue">{tr(language, 'Continue', 'आगे बढ़ें')} <ArrowRight size={18} /></Button></div></div>;
}

function QuestionsStep({ pathway, language, answers, setAnswers, onNext }: { pathway: Pathway; language: Language; answers: Answers; setAnswers: (a: Answers) => void; onNext: () => void }) {
  const questions = pathways[pathway].questions;
  const [questionIndex, setQuestionIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const question = questions[questionIndex];
  const choose = (value: string) => setAnswers({ ...answers, [question.id]: value });
  const goNext = () => questionIndex < questions.length - 1 ? setQuestionIndex(questionIndex + 1) : onNext();
  useEffect(() => { setQuestionIndex(0); }, [pathway]);
  return <div className="animate-enter-up max-w-3xl"><div className="flex items-start justify-between gap-5"><div><p className="text-sm font-bold text-[#16665f]">{tr(language, `Question ${questionIndex + 1} of ${questions.length}`, `${questions.length} में से सवाल ${questionIndex + 1}`)}</p><h1 className="mt-3 font-display text-4xl font-bold leading-tight tracking-[-.06em] text-[#173543] md:text-5xl">{language === 'हिन्दी' ? question.hindi : question.title}</h1></div><button onClick={() => setListening(!listening)} data-testid="button-question-voice" className={`focus-ring grid h-14 w-14 shrink-0 place-items-center rounded-2xl border transition ${listening ? 'border-[#d28b57] bg-[#fff0db] text-[#9c632d]' : 'border-[#bcd8d1] bg-[#e5f2ee] text-[#16665f]'}`} aria-label={tr(language, 'Simulate voice prompt', 'आवाज़ का नमूना सुनें')}>{listening ? <Volume2 /> : <Mic />}</button></div>{question.helper && <p className="mt-5 rounded-xl bg-[#edf3ed] px-4 py-3 text-sm text-[#5d7779]">{language === 'हिन्दी' ? question.helperHindi : question.helper}</p>}<div className="mt-9 grid gap-3 sm:grid-cols-2">{question.options.map((option, optionIndex) => <button key={option} onClick={() => choose(option)} data-testid={`button-answer-${question.id}-${option.toLowerCase().replaceAll(' ', '-')}`} className={`focus-ring min-h-16 rounded-xl border-2 px-5 text-left text-base font-bold transition ${answers[question.id] === option ? 'border-[#16665f] bg-[#e1f1ec] text-[#164e4a]' : 'border-[#cfdfd8] bg-[#fbfcf7] text-[#35585e] hover:border-[#8fc5b8]'}`}><span className="mr-3 inline-block h-3 w-3 rounded-full border-2 align-[-1px] border-current" />{language === 'हिन्दी' ? question.optionsHindi[optionIndex] : option}</button>)}</div><div className="mt-10 flex items-center justify-between"><button onClick={() => questionIndex > 0 ? setQuestionIndex(questionIndex - 1) : undefined} disabled={questionIndex === 0} data-testid="button-question-back" className="focus-ring inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-[#607879] disabled:opacity-30"><ArrowLeft size={17} /> {tr(language, 'Back', 'पीछे')}</button><Button onClick={goNext} disabled={!answers[question.id]} className="disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-question-next">{tr(language, questionIndex === questions.length - 1 ? 'Review answers' : 'Next question', questionIndex === questions.length - 1 ? 'जवाब जांचें' : 'अगला सवाल')} <ArrowRight size={18} /></Button></div><p className="mt-7 flex items-center gap-2 text-xs text-[#718788]"><Mic size={14} /> {tr(language, 'Tap the microphone for a simulated voice-style prompt. No audio is recorded.', 'आवाज़ के नमूने के लिए माइक्रोफ़ोन दबाएं। ऑडियो रिकॉर्ड नहीं होता।')}</p></div>;
}

function ReviewStep({ pathway, language, answers, onNext }: { pathway: Pathway; language: Language; answers: Answers; onNext: () => void }) {
  const needsPrompt = pathway === 'chest' && (answers.severity === 'Severe' || answers.breathing === 'Yes' || answers.spread === 'Yes');
  return <div className="animate-enter-up max-w-3xl"><p className="text-sm font-bold text-[#16665f]">{tr(language, 'Before we continue', 'आगे बढ़ने से पहले')}</p><h1 className="mt-3 font-display text-4xl font-bold tracking-[-.06em] text-[#173543] md:text-5xl">{tr(language, 'Here’s what we heard.', 'हमने यह समझा।')}</h1><p className="mt-4 text-base leading-7 text-[#5c7478]">{tr(language, 'Please check this quick recap. You can go back if anything feels wrong.', 'इस छोटी जानकारी को जांच लें। कुछ गलत लगे तो पीछे जा सकते हैं।')}</p><div className={`mt-8 overflow-hidden rounded-2xl border border-[#e2c4a4] p-5 ${needsPrompt ? 'priority-stripe' : 'bg-[#fff8ea]'}`}><div className="flex gap-4"><span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fff0db] text-[#a05c2b]">{needsPrompt ? <CircleAlert size={21} /> : <Clock3 size={21} />}</span><div><p className="font-display font-bold text-[#173543]">{tr(language, needsPrompt ? 'Please speak with the care team promptly' : 'Your care team will review this', needsPrompt ? 'कृपया तुरंत देखभाल टीम से बात करें' : 'आपकी देखभाल टीम इसे देखेगी')}</p><p className="mt-1 text-sm leading-6 text-[#6d6960]">{tr(language, needsPrompt ? 'Your answers include a symptom that should be checked without delay. A staff member will guide you next.' : 'This intake note helps your doctor decide what to discuss first.', needsPrompt ? 'आपके जवाब में एक ऐसा लक्षण है जिसे तुरंत देखना चाहिए। स्टाफ सदस्य आगे आपकी मदद करेंगे।' : 'यह जानकारी डॉक्टर को पहले चर्चा करने वाली बात समझने में मदद करेगी।')}</p></div></div></div><div className="mt-6 divide-y divide-[#dce5df] rounded-2xl border border-[#cfdfd8] bg-[#f9fbf7]">{pathways[pathway].questions.map(q => <div key={q.id} className="flex items-center justify-between gap-5 px-5 py-4"><span className="text-sm text-[#6a8080]">{language === 'हिन्दी' ? q.hindi : q.title}</span><span className="text-right text-sm font-bold text-[#173543]">{language === 'हिन्दी' ? (q.optionsHindi[q.options.indexOf(answers[q.id])] || 'जवाब नहीं दिया') : (answers[q.id] || 'Not answered')}</span></div>)}</div><p className="mt-5 flex items-center gap-2 text-xs text-[#718788]"><ShieldCheck size={15} /> {tr(language, 'This is a priority review, not a diagnosis.', 'यह प्राथमिकता जांच है, बीमारी की पुष्टि नहीं।')}</p><div className="mt-8 flex justify-end"><Button onClick={onNext} data-testid="button-review-continue">{tr(language, 'Check previous records', 'पिछले रिकॉर्ड देखें')} <ArrowRight size={18} /></Button></div></div>;
}

function ScanStep({ language, onNext }: { language: Language; onNext: () => void }) {
  const [done, setDone] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => setDone(true), 1700); return () => window.clearTimeout(timer); }, []);
  return <div className="animate-enter-up mx-auto max-w-xl text-center"><div className="relative mx-auto grid h-36 w-36 place-items-center overflow-hidden rounded-3xl border border-[#b9d8d1] bg-[#e4f2ed] text-[#16665f]"><ScanLine size={42} strokeWidth={1.3} /><span className="scan-line absolute left-4 right-4 top-3 h-0.5 bg-[#d18a55]" /></div><p className="mt-8 text-sm font-bold text-[#16665f]">{done ? tr(language, 'Record found', 'रिकॉर्ड मिल गया') : tr(language, 'Looking for a previous record', 'पिछला रिकॉर्ड खोज रहे हैं')}</p><h1 className="mt-3 font-display text-4xl font-bold tracking-[-.06em] text-[#173543]">{done ? tr(language, 'A familiar face.', 'पहले की जानकारी मिली।') : tr(language, 'Just a moment…', 'बस एक क्षण…')}</h1><p className="mx-auto mt-4 max-w-md text-base leading-7 text-[#5c7478]">{done ? tr(language, 'We found a mock previous visit for this demo. Nothing is being sent to a real hospital system.', 'इस डेमो के लिए पिछली मुलाकात की नकली जानकारी मिली। किसी असली अस्पताल को कुछ नहीं भेजा जा रहा है।') : tr(language, 'MediKiosk is simulating a record lookup so your doctor has useful context.', 'MediKiosk रिकॉर्ड खोजने का नमूना दिखा रहा है ताकि डॉक्टर को उपयोगी जानकारी मिल सके।')}</p><div className="mt-8 rounded-xl border border-[#d8e5dd] bg-[#f9fbf7] p-4 text-left"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-bold text-[#35585e]"><FileText size={17} /> {tr(language, 'Previous OPD record', 'पिछला OPD रिकॉर्ड')}</span>{done ? <CheckCircle2 size={19} className="text-[#16665f]" /> : <span className="h-4 w-16 animate-pulse rounded bg-[#dce9e1]" />}</div>{done && <div className="mt-4 grid grid-cols-2 gap-3 text-xs"><span className="rounded-lg bg-[#fff0db] p-3 text-[#8b613c]"><strong className="block text-[10px] uppercase tracking-wide">{tr(language, 'Recorded', 'दर्ज किया गया')}</strong> 14 Aug 2024</span><span className="rounded-lg bg-[#e3f1ed] p-3 text-[#28675f]"><strong className="block text-[10px] uppercase tracking-wide">{tr(language, 'Source', 'स्रोत')}</strong> OPD visit note</span></div>}</div>{done && <Button onClick={onNext} className="mt-8 w-full" data-testid="button-scan-continue">{tr(language, 'Build my intake note', 'मेरी जानकारी तैयार करें')} <ArrowRight size={18} /></Button>}</div>;
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

function ThankYouStep({ language, token, onHome = () => { window.location.href = '/'; } }: { language: Language; token: string; onHome?: () => void }) {
  return <div className="animate-enter-up mx-auto max-w-2xl text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#dcefe9] text-[#16665f]"><CheckCircle2 size={34} /></span><p className="mt-7 text-sm font-bold text-[#16665f]">{tr(language, 'Submission complete', 'जानकारी जमा हो गई')}</p><h1 className="mt-3 font-display text-4xl font-bold tracking-[-.06em] text-[#173543]">{tr(language, 'Thank you for sharing your details.', 'अपनी जानकारी देने के लिए धन्यवाद।')}</h1><p className="mt-4 text-base leading-7 text-[#5c7478]">{tr(language, 'Your intake note has been sent to the doctor dashboard. Please wait for your queue number.', 'आपकी जानकारी डॉक्टर डैशबोर्ड पर भेज दी गई है। कृपया अपने क्रमांक की प्रतीक्षा करें।')}</p><div className="mt-8 rounded-2xl border border-[#b8d7d0] bg-[#e8f4f0] p-6"><p className="text-sm font-bold text-[#42666a]">{tr(language, 'Your queue number', 'आपका क्रमांक')}</p><p className="mt-2 font-display text-5xl font-bold tracking-[-.08em] text-[#16665f]">{token}</p><p className="mt-3 text-sm text-[#5c7478]">{tr(language, 'Please stay nearby. The care team will call you.', 'कृपया पास ही रहें। देखभाल टीम आपको बुलाएगी।')}</p></div><Button onClick={onHome} className="mt-8" data-testid="button-new-patient">{tr(language, 'Home / new patient', 'होम / नया मरीज़')} <ArrowRight size={18} /></Button></div>;
}

function KioskFlow({ state, setState, go }: { state: FlowState; setState: (s: FlowState) => void; go: (path: string) => void }) {
  const { step, patient, pathway, answers } = state;
  const language = patient.language as Language;
  const patch = (part: Partial<FlowState>) => setState({ ...state, ...part });
  const next = (newStep: KioskStep) => patch({ step: newStep });
  const canGoBack = !['language', 'thankyou'].includes(step);
  return <KioskLayout step={step} language={language} onExit={() => go('/choose')}><button onClick={() => canGoBack && next(step === 'scan' ? 'review' : step === 'summary' ? 'scan' : 'language')} data-testid="button-flow-back" className={`focus-ring mb-6 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-[#607879] hover:bg-[#e9eee9] ${canGoBack ? '' : 'invisible'}`}><ArrowLeft size={17} /> {tr(language, 'Back', 'पीछे')}</button>{step === 'language' && <LanguageStep onChoose={nextLanguage => { patch({ patient: { ...patient, language: nextLanguage }, step: 'details' }); }} />}{step === 'details' && <DetailsStep name={patient.name} age={patient.age} phone={patient.phone} language={language} setName={name => patch({ patient: { ...patient, name } })} setAge={age => patch({ patient: { ...patient, age } })} setPhone={phone => patch({ patient: { ...patient, phone } })} onNext={() => next('complaint')} />}{step === 'complaint' && <ComplaintStep pathway={pathway} language={language} setPathway={p => patch({ pathway: p })} onNext={() => next('questions')} />}{step === 'questions' && pathway && <QuestionsStep pathway={pathway} language={language} answers={answers} setAnswers={a => patch({ answers: a })} onNext={() => next('review')} />}{step === 'review' && pathway && <ReviewStep pathway={pathway} language={language} answers={answers} onNext={() => next('scan')} />}{step === 'scan' && <ScanStep language={language} onNext={() => next('summary')} />}{step === 'summary' && pathway && <><SummaryView name={patient.name} age={patient.age} pathway={pathway} answers={answers} confirmed={state.confirmed} setConfirmed={confirmed => patch({ confirmed })} /><div className="mt-8 flex justify-end"><Button onClick={() => patch({ submitted: true, step: 'thankyou' })} data-testid="button-submit-intake">{tr(language, 'Submit to care team', 'देखभाल टीम को भेजें')} <ArrowRight size={18} /></Button></div></>}{step === 'thankyou' && <ThankYouStep language={language} token={state.queueNumber} />}</KioskLayout>;
}

type FlowState = { step: KioskStep; patient: { name: string; age: string; phone: string; abhaId: string; language: string }; pathway: Pathway | null; answers: Answers; confirmed: boolean; submitted: boolean; queueNumber: string };

function PortalShell({ children, go, onLogout = () => go('/choose'), active = 'dashboard' }: { children: ReactNode; go: (path: string) => void; onLogout?: () => void; active?: string }) {
  return (
    <div className="flex min-h-[100dvh] bg-[#f2f4ee]">
      <aside className="hidden w-64 shrink-0 flex-col bg-[#173543] px-5 py-6 text-[#eef6ef] md:flex">
        <button onClick={() => go('/doctor')} data-testid="button-portal-brand" className="focus-ring mb-12 rounded-lg text-left">
          <Brand inverse />
        </button>
        <p className="px-3 text-[10px] font-bold uppercase tracking-[.18em] text-[#82a3a1]">Workspace</p>
        <nav className="mt-3 space-y-1">
          <button onClick={() => go('/doctor')} data-testid="button-nav-dashboard" className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold ${active === 'dashboard' ? 'bg-[#2a4e59] text-[#90dcca]' : 'text-[#b8cdca] hover:bg-[#213f4b]'}`}>
            <LayoutDashboard size={18} /> Intake queue
          </button>
          <button onClick={() => go('/mediweb')} data-testid="button-nav-mediweb" className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-[#b8cdca] hover:bg-[#213f4b]">
            <FileText size={18} /> About MediWeb
          </button>
          <button onClick={() => go('/about-medikiosk')} data-testid="button-nav-medikiosk" className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-[#b8cdca] hover:bg-[#213f4b]">
            <HeartPulse size={18} /> About MediKiosk
          </button>
        </nav>
        <div className="mt-auto">
          <div className="rounded-2xl border border-[#355660] bg-[#1f424e] p-4">
            <p className="text-xs font-bold text-[#90dcca]">Prototype workspace</p>
            <p className="mt-2 text-xs leading-5 text-[#b8cdca]">Local mock data only. No live patient systems connected.</p>
          </div>
          <button onClick={onLogout} data-testid="button-doctor-logout" className="focus-ring mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-[#f4d7ba] hover:bg-[#213f4b]">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1">{children}</div>
        <footer className="border-t border-[#dbe4dc] bg-[#f8faf5] px-5 py-4 text-xs text-[#6e8584] md:px-10">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 sm:flex-row">
            <span className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-[#16665f]" />
              <span>ClinSahayak Doctor Portal · Structured Intake · Clinician review required</span>
            </span>
            <span className="text-[11px] text-[#829998]">Mock Queue · Local Sandbox Demonstration</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function DoctorPortal({ go, onOpen, onLogout }: { go: (path: string) => void; onOpen: () => void; onLogout: () => void }) {
  const [filter, setFilter] = useState('');
  const filtered = demoCases.filter(item => `${item.name} ${item.issue} ${item.id}`.toLowerCase().includes(filter.toLowerCase()));
  return (
    <PortalShell go={go} onLogout={onLogout}>
      <header className="border-b border-[#dbe4dc] bg-[#f8faf5] px-5 py-5 md:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#638180]">MediKiosk · Doctor view</p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-[-.04em] text-[#173543] md:text-3xl">Doctor dashboard</h1>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#dbeee8] text-sm font-bold text-[#28675f]">DR</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-7 md:px-10 md:py-10">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#cfdfd8] bg-[#f9fbf7] p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-[#708888]">Patient notes</p>
            <p className="mt-2 font-display text-3xl font-bold text-[#173543]">{demoCases.length}</p>
            <p className="mt-1 text-xs text-[#6c8383]">available for clinical review</p>
          </div>
          <div className="rounded-2xl border border-[#cfdfd8] bg-[#f9fbf7] p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-[#708888]">Latest entry</p>
            <p className="mt-2 font-display text-3xl font-bold text-[#173543]">08:05</p>
            <p className="mt-1 text-xs text-[#6c8383]">local demo record</p>
          </div>
        </div>
        <section className="mt-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold text-[#16665f]">Today’s intake queue</p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-[-.04em] text-[#173543]">Patient details for review.</h2>
            </div>
            <label className="relative block sm:w-64">
              <Search className="absolute left-3 top-3.5 text-[#75908d]" size={17} />
              <input value={filter} onChange={e => setFilter(e.target.value)} data-testid="input-search-cases" placeholder="Search patient or case" className="focus-ring h-11 w-full rounded-xl border border-[#cbdcd5] bg-[#f9fbf7] pl-10 pr-3 text-sm outline-none focus:border-[#16665f]" />
            </label>
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-[#cfdfd8] bg-[#f9fbf7]">
            <div className="hidden grid-cols-[1.3fr_1fr_.8fr_.8fr] gap-4 border-b border-[#dce6df] bg-[#eef4ee] px-5 py-3 text-[10px] font-bold uppercase tracking-[.15em] text-[#718888] md:grid">
              <span>Patient</span>
              <span>Reason for visit</span>
              <span>Arrival</span>
              <span>Status</span>
            </div>
            {filtered.length ? filtered.map(item => (
              <button key={item.id} onClick={onOpen} data-testid={`button-open-case-${item.id}`} className="grid w-full gap-3 border-b border-[#e1e9e2] px-5 py-4 text-left transition last:border-0 hover:bg-[#eef6f0] md:grid-cols-[1.3fr_1fr_.8fr_.8fr] md:items-center md:gap-4">
                <span className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e0efea] text-xs font-bold text-[#28675f]">{item.initials}</span>
                  <span>
                    <span className="block font-display text-sm font-bold text-[#173543]">{item.name}, {item.age}</span>
                    <span className="block text-xs text-[#748b8a]">{item.id}</span>
                  </span>
                </span>
                <span className="text-sm font-semibold text-[#4e696d]">{item.issue}</span>
                <span className="text-sm text-[#607979]">{item.time}</span>
                <span className="flex items-center justify-between text-xs font-bold text-[#607979]">{item.status}<ChevronRight size={17} className="text-[#9cb3ad]" /></span>
              </button>
            )) : (
              <div className="p-10 text-center">
                <Search className="mx-auto text-[#9db5af]" />
                <p className="mt-3 font-display font-bold text-[#35585e]">No matching cases</p>
                <p className="mt-1 text-sm text-[#758b8b]">Try a patient name or case ID.</p>
              </div>
            )}
          </div>
        </section>
        <p className="mt-6 flex items-center gap-2 text-xs text-[#788e8d]">
          <ShieldCheck size={14} /> Mock queue for classroom demonstration · not connected to a hospital system.
        </p>
      </main>
    </PortalShell>
  );
}

function DoctorCase({ go, confirmed, setConfirmed, state }: { go: (path: string) => void; confirmed: boolean; setConfirmed: (v: boolean) => void; state: FlowState }) {
  const patient = state.patient.name ? state.patient : { name: 'Ravi Mehta', age: '54', phone: '', language: 'English' };
  const pathway = state.pathway || 'chest';
  const answers = Object.keys(state.answers).length ? state.answers : { onset: 'Today', severity: 'Moderate', breathing: 'No', spread: 'Not sure' };
  return (
    <PortalShell go={go} active="dashboard">
      <header className="border-b border-[#dbe4dc] bg-[#f8faf5] px-5 py-5 md:px-10">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <button onClick={() => go('/doctor')} data-testid="button-case-back" className="focus-ring grid h-10 w-10 place-items-center rounded-xl border border-[#cfdfd8] text-[#4e696d] hover:bg-[#e7eee8]"><ArrowLeft size={18} /></button>
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#638180]">Intake queue / {patient.name || 'Ravi Mehta'}</p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-[-.04em] text-[#173543]">Case MK-1048</h1>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 md:px-10 md:py-10">
        <SummaryView name={patient.name || 'Ravi Mehta'} age={patient.age || '54'} pathway={pathway} answers={answers} doctorMode confirmed={confirmed} setConfirmed={setConfirmed} />
      </main>
    </PortalShell>
  );
}

function MediWeb({ go }: { go: (path: string) => void }) {
  return (
    <div className="kiosk-shell flex min-h-[100dvh] flex-col">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 md:px-10">
        <Link href="/" data-testid="link-mediweb-brand" className="focus-ring rounded-lg"><Brand /></Link>
        <Button onClick={() => go('/kiosk')} variant="secondary" className="min-h-10 px-4" data-testid="button-mediweb-kiosk">Open patient kiosk <ArrowRight size={16} /></Button>
      </nav>
      <main className="mx-auto max-w-6xl flex-1 px-5 pb-20 pt-10 md:px-10 md:pt-20">
        <div className="max-w-3xl">
          <p className="text-sm font-bold text-[#16665f]">The thinking behind MediKiosk</p>
          <h1 className="mt-3 font-display text-5xl font-bold leading-[.98] tracking-[-.07em] text-[#173543] md:text-7xl">Less repeating.<br /><span className="text-[#16665f]">More listening.</span></h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#5c7478]">MediWeb is the information layer around the kiosk: simple for patients, useful for doctors, and honest about what a student prototype can and cannot do.</p>
        </div>
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-[#cfdfd8] bg-[#f9fbf7] p-6"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e2f1ec] text-[#16665f]"><Mic /></span><h2 className="mt-6 font-display text-xl font-bold text-[#173543]">Optional voice style</h2><p className="mt-3 text-sm leading-6 text-[#607979]">Patients can tap a microphone cue to hear how a voice prompt would feel. This demo does not record or transcribe audio.</p></article>
          <article className="rounded-2xl border border-[#cfdfd8] bg-[#f9fbf7] p-6"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#fff0db] text-[#98612f]"><ScanLine /></span><h2 className="mt-6 font-display text-xl font-bold text-[#173543]">Previous-record context</h2><p className="mt-3 text-sm leading-6 text-[#607979]">The record scan is simulated with a local mock visit, letting the summary show where each detail came from.</p></article>
          <article className="rounded-2xl border border-[#cfdfd8] bg-[#f9fbf7] p-6"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e2f1ec] text-[#16665f]"><ShieldCheck /></span><h2 className="mt-6 font-display text-xl font-bold text-[#173543]">No invented certainty</h2><p className="mt-3 text-sm leading-6 text-[#607979]">MediKiosk never diagnoses, prescribes, connects to ABHA, or pretends to persist real patient data.</p></article>
        </div>
        <section className="mt-16 grid items-center gap-9 rounded-[2rem] border border-[#c7ddd5] bg-[#e2f1ec] p-7 md:grid-cols-[1fr_.8fr] md:p-10">
          <div>
            <p className="text-sm font-bold text-[#16665f]">Built for the OPD handoff</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-[-.05em] text-[#173543]">The patient sees a path.<br />The doctor sees a starting point.</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[#537174]">Every answer carries a source label — patient response or previous record — before a clinician edits and confirms the draft.</p>
          </div>
          <div className="rounded-2xl border border-[#b8d7cf] bg-[#f7fbf7] p-5">
            <div className="flex items-center justify-between border-b border-[#d7e7df] pb-4"><span className="font-display font-bold text-[#173543]">Source-linked note</span><CheckCircle2 className="text-[#16665f]" size={19} /></div>
            <p className="mt-4 text-sm leading-6 text-[#315d5c]">“Patient reports chest discomfort beginning today.”</p>
            <div className="mt-4 flex gap-2"><SourceTag type="patient">Patient response</SourceTag><SourceTag type="record">Previous record</SourceTag></div>
          </div>
        </section>
        <div className="mt-12 flex flex-wrap gap-3">
          <Button onClick={() => go('/kiosk')} data-testid="button-mediweb-start">Try the patient flow <ArrowRight size={17} /></Button>
          <Button onClick={() => go('/doctor')} variant="secondary" data-testid="button-mediweb-doctor">See doctor portal <LayoutDashboard size={17} /></Button>
        </div>
      </main>
      <AppFooter go={go} />
    </div>
  );
}

function DoctorLogin({ onLogin, go }: { onLogin: () => void; go: (path: string) => void }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const submit = () => {
    const account = doctorDemoAccounts.find(item => item.userId === userId.trim().toUpperCase() && item.password === password);
    if (!account) {
      setError('Incorrect user ID or password. Please contact hospital management.');
      return;
    }
    onLogin();
    go('/doctor');
  };
  return (
    <div className="kiosk-shell flex min-h-[100dvh] flex-col">
      <main className="mx-auto grid w-full max-w-md flex-1 place-items-center p-5">
        <section className="w-full rounded-[2rem] border border-[#cfdfd8] bg-[#f9fbf7] p-8 shadow-[0_18px_40px_rgba(22,73,73,.08)]">
          <Brand />
          <p className="mt-10 text-sm font-bold text-[#16665f]">Hospital staff access</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-[#173543]">Doctor sign in</h1>
          <p className="mt-3 text-sm leading-6 text-[#5c7478]">Use the user ID and password issued by hospital management.</p>
          <div className="mt-5 rounded-xl border border-[#cbded6] bg-[#e8f4f0] p-4 text-sm leading-6 text-[#315d5c]">
            <strong>Demo IDs:</strong> DR1001 or DR1002<br />
            <strong>Password for both:</strong> Medi@123
          </div>
          <label className="mt-7 block text-sm font-bold text-[#35585e]">
            User ID
            <input value={userId} onChange={e => setUserId(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#bfd7d0] bg-white px-3 font-normal outline-none focus:border-[#16665f]" />
          </label>
          <label className="mt-5 block text-sm font-bold text-[#35585e]">
            Password
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" className="mt-2 h-12 w-full rounded-xl border border-[#bfd7d0] bg-white px-3 font-normal outline-none focus:border-[#16665f]" />
          </label>
          {error && <p className="mt-3 text-sm font-bold text-[#a34234]">{error}</p>}
          <Button onClick={submit} className="mt-7 w-full">Sign in <ArrowRight size={18} /></Button>
        </section>
      </main>
      <AppFooter go={go} />
    </div>
  );
}

function SimpleAbout({ title, go }: { title: string; go: (path: string) => void }) {
  const isWeb = title === 'About MediWeb';
  return (
    <div className="kiosk-shell flex min-h-[100dvh] flex-col">
      <main className="mx-auto grid w-full max-w-2xl flex-1 place-items-center p-5">
        <section className="w-full rounded-[2rem] border border-[#cfdfd8] bg-[#f9fbf7] p-8 shadow-[0_18px_40px_rgba(22,73,73,.08)]">
          <Brand />
          <p className="mt-10 text-sm font-bold text-[#16665f]">ClinSahayak prototype</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-[#173543]">{title}</h1>
          <p className="mt-5 text-base leading-7 text-[#5c7478]">{isWeb ? 'MediWeb lets a patient complete the same guided intake from a web browser.' : 'MediKiosk provides a guided touch-screen intake for patients at the clinic.'}</p>
          <Button onClick={() => go('/doctor')} className="mt-8">Back to doctor dashboard <ArrowRight size={18} /></Button>
        </section>
      </main>
      <AppFooter go={go} />
    </div>
  );
}

function Router() {
  const [location, setLocation] = useLocation();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('English');
  const [state, setState] = useState<FlowState>({ step: 'details', patient: { name: '', age: '', phone: '', abhaId: '', language: 'English' }, pathway: null, answers: {}, confirmed: false, submitted: false, queueNumber: 'A-1049' });
  const [confirmed, setConfirmed] = useState(false);
  const [doctorAuthenticated, setDoctorAuthenticated] = useState(false);
  const go = (path: string) => { setLocation(path); };
  if (location === '/' || location === '/choose') return <WelcomeLanguage onChoose={language => { setSelectedLanguage(language); setState({ ...state, patient: { ...state.patient, language }, step: 'details' }); go('/options'); }} />;
  if (location === '/landing') return <Landing go={go} />;
  if (location === '/options') return <ServiceChoice language={selectedLanguage} go={go} />;
  if (location === '/account') return <AccountPage language={selectedLanguage} go={go} onComplete={profile => setState({ ...state, step: 'complaint', patient: { ...state.patient, ...profile } })} />;
  if (location === '/auth/medikiosk') return <AuthPage channel="medikiosk" language={selectedLanguage} go={go} onVerified={language => { setState({ ...state, step: 'complaint', patient: { ...state.patient, language } }); go('/kiosk'); }} />;
  if (location === '/auth/mediweb') return <AuthPage channel="mediweb" language={selectedLanguage} go={go} onVerified={language => { setState({ ...state, step: 'complaint', patient: { ...state.patient, language } }); go('/kiosk'); }} />;
  if (location === '/kiosk') return <KioskFlow state={state} setState={setState} go={go} />;
  if (location === '/mediweb' || location === '/about-medikiosk') return <SimpleAbout title={location === '/mediweb' ? 'About MediWeb' : 'About MediKiosk'} go={go} />;
  if (location === '/auth/doctor') return <DoctorLogin go={go} onLogin={() => setDoctorAuthenticated(true)} />;
  if (location === '/doctor/case') return doctorAuthenticated ? <DoctorCase go={go} confirmed={confirmed} setConfirmed={setConfirmed} state={state} /> : <DoctorLogin go={go} onLogin={() => setDoctorAuthenticated(true)} />;
  if (location === '/doctor') return doctorAuthenticated ? <DoctorPortal go={go} onOpen={() => go('/doctor/case')} onLogout={() => { setDoctorAuthenticated(false); go('/choose'); }} /> : <DoctorLogin go={go} onLogin={() => setDoctorAuthenticated(true)} />;
  return <NotFound />;
}

function RoutedErrorBoundary() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Router /></ErrorBoundary>;
}

function PatientTools() {
  const [path, setPath] = useState(window.location.pathname);
  const [documents, setDocuments] = useState<string[]>(() => JSON.parse(sessionStorage.getItem('medikiosk-documents') || '[]'));
  useEffect(() => { const timer = window.setInterval(() => setPath(window.location.pathname), 300); return () => window.clearInterval(timer); }, []);
  useEffect(() => { if (path !== '/mediweb') return; const timer = window.setTimeout(() => { window.location.href = '/'; }, 10000); return () => window.clearTimeout(timer); }, [path]);
  useEffect(() => { sessionStorage.setItem('medikiosk-documents', JSON.stringify(documents)); }, [documents]);
  if (path === '/mediweb') return <div className="fixed bottom-5 right-5 z-50 w-80 rounded-2xl border border-[#b8d7d0] bg-[#f9fbf7] p-4 shadow-xl"><p className="flex items-center gap-2 font-display font-bold text-[#173543]"><FileText size={18} /> Upload documents</p><p className="mt-1 text-xs leading-5 text-[#607979]">Prescription, report or scan · OCR preview only</p><label className="mt-3 block cursor-pointer rounded-xl bg-[#e5f2ee] px-3 py-3 text-center text-sm font-bold text-[#16665f]">Choose document<input type="file" accept="image/*,.pdf" className="hidden" onChange={e => { const name = e.target.files?.[0]?.name; if (name) setDocuments([...documents, name]); }} /></label>{documents.map(name => <p key={name} className="mt-2 rounded-lg bg-[#edf3ed] px-2 py-1 text-xs text-[#35585e]">OCR queued: {name}</p>)}<button onClick={() => { window.location.href = '/'; }} className="mt-3 w-full rounded-lg py-2 text-xs font-bold text-[#16665f] hover:bg-[#e5f1ed]">Return home</button><p className="mt-2 text-center text-[10px] text-[#718788]">Auto-return in 10 seconds</p></div>;
  if (path.startsWith('/doctor') && documents.length) return <div className="fixed bottom-5 right-5 z-50 w-72 rounded-2xl border border-[#b8d7d0] bg-[#f9fbf7] p-4 shadow-xl"><p className="font-display font-bold text-[#173543]">Patient documents</p>{documents.map(name => <p key={name} className="mt-2 rounded-lg bg-[#edf3ed] px-2 py-1 text-xs text-[#35585e]">{name} · OCR preview</p>)}</div>;
  if (path.startsWith('/kiosk')) return <button onClick={() => window.speechSynthesis?.speak(new SpeechSynthesisUtterance('Voice assistance is on. Please follow the instructions on screen.'))} className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#16665f] px-5 py-3 text-sm font-bold text-white shadow-xl"><Volume2 size={18} /> Voice assistance</button>;
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <RoutedErrorBoundary />
          <PatientTools />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
