import { LoginForm } from '@/components/login-form';
import Link from 'next/link';

export default function Login() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        .font-display { font-family: 'Syne', -apple-system, sans-serif; }
        @keyframes waveBar {
          0%,100% { transform: scaleY(0.35); }
          50%      { transform: scaleY(1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up-1 { animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
        .fade-up-2 { animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.25s both; }
        .fade-up-3 { animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.4s both; }
      `}</style>

      <div
        className='min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden'
        style={{
          background:
            'radial-gradient(ellipse 80% 55% at 50% 0%, rgba(255,255,255,0.5) 0%, transparent 65%), #FAD40B',
        }}
      >
        <div className='pointer-events-none absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full border border-black/[0.05]' />
        <div className='pointer-events-none absolute -top-16 -right-16 w-[280px] h-[280px] rounded-full border border-black/[0.07]' />
        <div className='pointer-events-none absolute -bottom-32 -left-32 w-[440px] h-[440px] rounded-full border border-black/[0.05]' />
        <div className='pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-black/[0.03]' />

        <div className='fade-up-1 flex flex-col items-center mb-8 relative z-10'>
          <div
            className='flex items-center justify-center gap-[6px] mb-2'
            style={{ height: 52 }}
          >
            {[0.35, 0.6, 0.9, 1, 0.9, 0.6, 0.35].map((s, i) => (
              <div
                key={i}
                className='bg-black rounded-full'
                style={{
                  width: 6,
                  height: 40,
                  transformOrigin: 'center',
                  animation: `waveBar ${0.85 + i * 0.14}s ease-in-out infinite ${i * 0.11}s`,
                  transform: `scaleY(${s})`,
                }}
              />
            ))}
          </div>
          <h1 className='font-display text-[clamp(48px,10vw,80px)] font-extrabold text-black leading-[0.92] tracking-[-0.05em]'>
            echo
          </h1>
          <p className='text-black/50 text-sm font-medium mt-2 tracking-wide'>
            4 Humans. 1 AI. One live audio room.
          </p>
        </div>

        <div className='fade-up-2 relative z-10 w-full max-w-sm'>
          <LoginForm />
        </div>

        <footer className='fade-up-3 relative z-10 flex items-center gap-6 mt-10'>
          <Link
            href='/privacy'
            className='text-sm text-black/40 hover:text-black transition-colors duration-200'
          >
            Privacy Policy
          </Link>
          <span className='text-black/20'>·</span>
          <Link
            href='/terms'
            className='text-sm text-black/40 hover:text-black transition-colors duration-200'
          >
            Terms of Service
          </Link>
        </footer>
      </div>
    </>
  );
}
