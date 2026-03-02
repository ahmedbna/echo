'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Reveal } from '@/components/reveal';
import { DotNav } from '@/components/dot-nav';
import { FeatureSection } from '@/components/feature-section';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const join = useMutation(api.waitlist.join);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 60);
    const onScroll = (e: Event) => {
      const el = e.target as HTMLElement;
      setScrollY(el.scrollTop ?? 0);
    };
    const container = document.getElementById('scroll-container');
    container?.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(t);
      container?.removeEventListener('scroll', onScroll);
    };
  }, []);

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || submitting) return;

    setSubmitting(true);

    await join({ email, source: 'hero' });

    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');

        .font-display { font-family: 'Syne', -apple-system, sans-serif; }

        @keyframes floatA {
          0%,100% { transform: translateY(0px) rotate(-5deg); }
          50%      { transform: translateY(-16px) rotate(-5deg); }
        }
        @keyframes floatB {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          50%      { transform: translateY(-22px) rotate(0deg); }
        }
        @keyframes floatC {
          0%,100% { transform: translateY(0px) rotate(5deg); }
          50%      { transform: translateY(-12px) rotate(5deg); }
        }
        .float-a { animation: floatA 5s   ease-in-out infinite; }
        .float-b { animation: floatB 6s   ease-in-out infinite 0.4s; }
        .float-c { animation: floatC 4.5s ease-in-out infinite 0.9s; }

        /* scroll-snap dot indicator */
        @keyframes dotPulse {
          0%,100% { transform: scale(1);   opacity: 1; }
          50%      { transform: scale(1.5); opacity: 0.6; }
        }
      `}</style>

      {/* ── Scroll container ── */}
      <div
        id='scroll-container'
        className='h-screen overflow-y-scroll'
        style={{ scrollSnapType: 'y mandatory', scrollBehavior: 'smooth' }}
      >
        {/* ── Hero ── */}
        <section
          className='snap-start h-screen w-full flex flex-col items-center justify-center px-6 relative overflow-hidden bg-[#FAD40B]'
          style={{
            background:
              'radial-gradient(ellipse 80% 55% at 50% 0%, rgba(255,255,255,0.5) 0%, transparent 65%), #FAD40B',
          }}
        >
          {/* decorative rings */}
          <div className='pointer-events-none absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full border border-black/[0.05]' />
          <div className='pointer-events-none absolute -top-16 -right-16 w-[280px] h-[280px] rounded-full border border-black/[0.07]' />
          <div className='pointer-events-none absolute -bottom-32 -left-32 w-[440px] h-[440px] rounded-full border border-black/[0.05]' />

          {/* wordmark */}
          <div
            className='relative z-10 text-center mb-8'
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? 'translateY(0)' : 'translateY(32px)',
              transition:
                'opacity 1s cubic-bezier(0.16,1,0.3,1), transform 1s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            <img
              src='/mic.png'
              alt='echo'
              className='-mt-26 w-64 h-64 object-contain mx-auto mb-1'
            />

            <h1 className='font-display text-[clamp(80px,16vw,152px)] font-extrabold text-black leading-[0.85] tracking-[-0.06em] mb-4'>
              echo
            </h1>
            <p className='text-black/60 text-[clamp(15px,1.8vw,20px)] font-medium max-w-lg mx-auto leading-snug'>
              {`Live audio arena where four real people team up against
              one powerful AI in real-time voice conversations.`}
            </p>
          </div>

          <div
            className='relative z-10 w-full max-w-lg'
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? 'translateY(0)' : 'translateY(16px)',
              transition:
                'opacity 1s cubic-bezier(0.16,1,0.3,1) 300ms, transform 1s cubic-bezier(0.16,1,0.3,1) 300ms',
            }}
          >
            <WaitlistCard
              email={email}
              setEmail={setEmail}
              submitted={submitted}
              submitting={submitting}
              onSubmit={handleWaitlist}
            />
          </div>

          <div
            className='absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1'
            style={{ opacity: loaded ? 0.4 : 0, transition: 'opacity 1s 1.4s' }}
          >
            <span className='text-[9px] font-bold tracking-[0.16em] uppercase text-black'>
              Scroll
            </span>
            <div className='w-px h-9 bg-gradient-to-b from-black to-transparent' />
          </div>
        </section>

        <FeatureSection
          tag='Live Audio'
          title='4 Humans vs 1 AI'
          body='Step into a real-time audio room where four people face off against one AI. Debate, challenge, collaborate, and think out loud together.'
          img='/screens/chat.png'
          alt='Live Room'
          flip={false}
          gradient='bg-[#FAD40B]'
        />

        <FeatureSection
          tag='AI Co-host'
          title='Can You Outsmart the AI?'
          body={`Battle the AI in debates. Question its logic. Challenge its answers. Push its limits. It’s not just a chat, it’s a live intellectual showdown.`}
          img='/screens/voice-room.png'
          alt='AI Co-host'
          flip={true}
          gradient='bg-[#FAD40B]'
        />

        <FeatureSection
          tag='Room Formats'
          title='Learn Faster. Think Deeper. Together.'
          body='Study topics, explore ideas, and break down complex concepts with your team and an AI that never sleeps. Perfect for curious minds who love real conversations.'
          img='/screens/ai-teacher.png'
          alt='Room Formats'
          flip={false}
          gradient='bg-[#FAD40B]'
        />

        <FeatureSection
          tag='Topics'
          title='Not Just Smart. Seriously Fun.'
          body='Laugh. Compete. Collaborate. echo transforms ordinary voice chats into high-energy, unpredictable experiences where humans and AI collide.'
          img='/screens/chat.png'
          alt='Topics'
          flip={true}
          gradient='bg-[#FAD40B]'
        />

        {/* ── CTA ── */}
        <section
          className='snap-start h-screen w-full flex flex-col items-center justify-center px-6 relative overflow-hidden bg-[#FAD40B]'
          style={{
            background:
              'radial-gradient(ellipse 70% 70% at 50% 50%, rgba(255,255,255,0.55) 0%, transparent 70%), #FAD40B',
          }}
        >
          {/* decorative ring */}
          <div className='pointer-events-none absolute w-[600px] h-[600px] rounded-full border border-black/[0.05]' />
          <div className='pointer-events-none absolute w-[400px] h-[400px] rounded-full border border-black/[0.07]' />

          <Reveal className='relative z-10 text-center max-w-xl'>
            <img
              src='/mic.png'
              alt='echo'
              className='-mt-26 w-62 object-contain mx-auto mb-2'
            />
            <h2 className='-mt-12 font-display text-[clamp(40px,7vw,80px)] font-extrabold text-black leading-[0.97] tracking-[-0.04em] mb-5'>
              echo
              <br />
              launching soon
            </h2>

            <div className='max-w-lg mx-auto'>
              <WaitlistCard
                email={email}
                setEmail={setEmail}
                submitted={submitted}
                submitting={submitting}
                onSubmit={handleWaitlist}
                large
              />
            </div>
          </Reveal>

          <div className='absolute bottom-8 flex gap-8'>
            <Link
              href='/privacy'
              className='text-sm text-black/40 hover:text-black transition-colors duration-200'
            >
              Privacy Policy
            </Link>
            <Link
              href='/terms'
              className='text-sm text-black/40 hover:text-black transition-colors duration-200'
            >
              Terms of Service
            </Link>
          </div>
        </section>
      </div>

      <DotNav total={6} />
    </>
  );
}

function WaitlistCard({
  email,
  setEmail,
  submitted,
  submitting,
  onSubmit,
  large = false,
}: {
  email: string;
  setEmail: (v: string) => void;
  submitted: boolean;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  large?: boolean;
}) {
  if (submitted) {
    return (
      <div
        className='rounded-2xl border border-black/10 bg-white/70 backdrop-blur-md shadow-xl p-6 text-center'
        style={{
          boxShadow:
            '0 8px 48px rgba(0,0,0,0.10), 0 1px 0 rgba(255,255,255,0.9) inset',
        }}
      >
        <div
          className='flex items-center justify-center gap-[4px] mx-auto mb-3'
          style={{ height: 30 }}
        >
          {[0.35, 0.6, 0.9, 1, 0.9, 0.6, 0.35].map((s, i) => (
            <div
              key={i}
              className='bg-black rounded-full'
              style={{
                width: 4,
                height: 24,
                transform: `scaleY(${s})`,
                transformOrigin: 'center',
              }}
            />
          ))}
        </div>
        <p className='font-display text-xl font-extrabold text-black tracking-tight'>
          You're on the list.
        </p>
        <p className='text-sm text-black/50 mt-1'>
          We'll ping you when Echo goes live.
        </p>
      </div>
    );
  }

  return (
    <div
      className='rounded-2xl border border-black/10 bg-white/70 backdrop-blur-md shadow-xl p-5'
      style={{
        boxShadow:
          '0 8px 48px rgba(0,0,0,0.10), 0 1px 0 rgba(255,255,255,0.9) inset',
      }}
    >
      <p className='text-xs font-bold text-black/40 uppercase tracking-widest mb-3 text-center'>
        Join the waitlist
      </p>
      <form onSubmit={onSubmit} className='flex flex-col gap-3'>
        <input
          type='email'
          required
          placeholder='your@email.com'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full rounded-xl border border-black/15 bg-white/80 px-4 text-sm text-black placeholder:text-black/30 outline-none focus:border-black/40 focus:ring-2 focus:ring-black/10 transition-all duration-150 ${large ? 'h-12 text-base' : 'h-11'}`}
        />
        <button
          type='submit'
          disabled={submitting}
          className={`w-full rounded-xl bg-black text-[#FAD40B] font-bold tracking-wide hover:bg-black/80 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-black/20 ${large ? 'h-12 text-base' : 'h-11 text-sm'}`}
        >
          {submitting && (
            <svg
              className='h-4 w-4 animate-spin text-[#FAD40B]'
              viewBox='0 0 24 24'
            >
              <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
                fill='none'
              />
              <path
                className='opacity-75'
                fill='currentColor'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              />
            </svg>
          )}
          Notify me at launch →
        </button>
      </form>
    </div>
  );
}
