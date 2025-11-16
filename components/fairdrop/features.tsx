'use client';

export interface Feature {
  title: string;
  description: string;
  icon: string;
  gradient?: string;
}

export interface FeaturesProps {
  features?: Feature[];
}

const defaultFeatures: Feature[] = [
  {
    title: "Automated Price Reduction",
    description: "Smart contracts reduce price automatically at preset intervals, finding the perfect market equilibrium",
    icon: "⚡",
    gradient: "from-blue-500/10 to-blue-500/5",
  },
  {
    title: "Uniform Clearing",
    description: "All participants pay the same final clearing price, ensuring fairness and equality for everyone",
    icon: "⚖️",
    gradient: "from-purple-500/10 to-purple-500/5",
  },
  {
    title: "Dynamic Floor Price",
    description: "Prevents undervaluation while maintaining market flexibility and protecting project value",
    icon: "📊",
    gradient: "from-green-500/10 to-green-500/5",
  },
  {
    title: "Full Transparency",
    description: "Every bid, price change, and sale event is recorded on-chain for complete auditability",
    icon: "🔍",
    gradient: "from-cyan-500/10 to-cyan-500/5",
  },
  {
    title: "Cross-Asset Compatible",
    description: "Works seamlessly for tokens, NFTs, digital collectibles, and real-world products",
    icon: "🔗",
    gradient: "from-pink-500/10 to-pink-500/5",
  },
  {
    title: "Market-Driven Discovery",
    description: "True price discovery through supply and demand, eliminating guesswork and manipulation",
    icon: "🎯",
    gradient: "from-orange-500/10 to-orange-500/5",
  },
];

export function Features({ features = defaultFeatures }: FeaturesProps) {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[32rem] h-[32rem] bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Core Features
          </h2>
          <p className="text-text-secondary text-lg max-w-3xl mx-auto">
            Powered by blockchain technology, Fairdrop brings transparency and fairness to every auction
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative overflow-hidden"
            >
              {/* Card */}
              <div className={`h-full p-6 rounded-2xl bg-gradient-to-br ${feature.gradient || 'from-primary/10 to-primary/5'} border border-white/10 hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm`}>
                {/* Icon */}
                <div className="mb-4">
                  <div className="w-14 h-14 rounded-xl bg-glass border border-white/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-text-primary mb-3">
                  {feature.title}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/5 to-secondary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
