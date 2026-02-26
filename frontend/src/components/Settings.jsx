export default function Settings() {
  return (
    <div className="relative min-h-[60vh] flex flex-col justify-center">
      {/* Background - Minimal Skeleton */}
      <div className="space-y-12 filter blur-xl opacity-20 pointer-events-none select-none transition-all duration-1000">
        <div className="h-8 w-48 bg-border" />
        <div className="space-y-4">
          <div className="h-32 w-full bg-surface border border-border" />
          <div className="grid grid-cols-2 gap-8">
            <div className="h-40 bg-surface border border-border" />
            <div className="h-40 bg-surface border border-border" />
          </div>
        </div>
      </div>

      {/* Clean Foreground */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-5xl font-black font-headline text-white uppercase tracking-tighter mb-4">
          Settings
        </h2>
        <div className="w-16 h-1 bg-gradient-to-r from-primary to-blue-400 mb-8" />
        <p className="text-[10px] text-muted font-mono uppercase tracking-[0.4em] max-w-sm leading-loose">
          ADVANCED_CONFIGURATION_MODULES // COMING_SOON
        </p>
      </div>
    </div>
  );
}
