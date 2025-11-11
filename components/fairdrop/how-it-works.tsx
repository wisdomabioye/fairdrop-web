'use client';

export function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: "Auction Starts",
      description: "Price begins at the starting price set by the creator",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      number: 2,
      title: "Price Descends",
      description: "Price automatically decreases over time until demand meets supply",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
      ),
    },
    {
      number: 3,
      title: "Place Bids",
      description: "Participants bid at any price point during the auction",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      ),
    },
    {
      number: 4,
      title: "Uniform Clearing",
      description: "Everyone pays the same final clearing price - fair for all",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-20 bg-glass/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
            How It Works
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Fairdrop&apos;s descending-price auction model ensures transparent and fair price discovery
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
              )}

              {/* Step Card */}
              <div className="relative bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300 group">
                {/* Number Badge */}
                <div className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 transition-transform">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 rounded-xl bg-glass border border-primary/30 flex items-center justify-center text-primary mb-4 group-hover:scale-110 group-hover:border-primary transition-all">
                  {step.icon}
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-text-primary mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-text-secondary">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
