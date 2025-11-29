import { SPLASH_BACKGROUND, SPLASH_FONT_FAMILY, SPLASH_TAGLINE } from './constants';

const SplashScreen = () => {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-brand-text"
      style={{ backgroundColor: SPLASH_BACKGROUND, fontFamily: SPLASH_FONT_FAMILY }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(800px 520px at 20% 25%, rgba(11, 110, 79, 0.08), transparent 55%), radial-gradient(700px 480px at 80% 20%, rgba(42, 174, 102, 0.07), transparent 50%), linear-gradient(180deg, rgba(255,255,255,0.68), rgba(255,255,255,0.4))'
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backdropFilter: 'blur(2px)'
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="mb-4 inline-flex items-center justify-center">
          <img
            src="/logo.png"
            alt="Agricole"
            className="h-72 w-72 object-contain drop-shadow-[0_20px_48px_rgba(11,110,79,0.22)] sm:h-80 sm:w-80"
            style={{ animation: 'float-soft 6s ease-in-out infinite' }}
          />
        </div>
        <p className="text-xl font-normal leading-tight text-[#2e8b57] sm:text-2xl">{SPLASH_TAGLINE}</p>
        <div className="mt-8 flex items-center gap-3">
          <div
            className="h-12 w-12 rounded-full border-[3px] border-[#d8d1c4] border-t-[#0b6e4f] animate-spin shadow-sm shadow-[#0b6e4f1a]"
            aria-label="Chargement"
            role="status"
          />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
