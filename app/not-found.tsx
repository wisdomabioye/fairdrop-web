import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Animated cosmic background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[32rem] h-[32rem] bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          {/* 404 Number with gradient and glow effect */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <div className="text-[20rem] font-bold text-primary blur-2xl select-none">404</div>
            </div>
            <h1 className="relative text-9xl md:text-[12rem] lg:text-[15rem] font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent animate-gradient leading-none">
              404
            </h1>
          </div>

          {/* Message */}
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary">
              Lost in the <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-accent">Cosmos</span>
            </h2>
            <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              The page you're looking for has drifted into the void.
              Let's navigate you back to familiar territory.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Link href="/">
              <button className="group relative px-8 py-4 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-secondary to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Back to Home
                </span>
              </button>
            </Link>

            <Link href="/auctions">
              <button className="group relative px-8 py-4 rounded-xl font-semibold bg-glass border border-white/20 text-text-primary hover:border-primary/50 transition-all duration-300 hover:scale-105">
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Browse Auctions
                </span>
              </button>
            </Link>
          </div>

          {/* Decorative elements */}
          <div className="pt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto opacity-60">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-glass border border-white/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <p className="text-xs text-text-secondary">Home</p>
            </div>

            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-glass border border-white/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs text-text-secondary">Auctions</p>
            </div>

            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-glass border border-white/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-xs text-text-secondary">Create</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
