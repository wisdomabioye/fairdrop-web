'use client';

export interface VisionProps {
  title?: string;
  description?: string;
  goals?: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
}

const defaultGoals = [
  {
    title: "Universal Standard",
    description: "Become the go-to protocol for transparent and fair price discovery across all markets",
    icon: "🌍",
  },
  {
    title: "Decentralized Marketplace",
    description: "Build a global marketplace where price discovery is efficient, fair, and accessible to everyone",
    icon: "🏪",
  },
  {
    title: "Data-Driven Insights",
    description: "Merge blockchain automation with AI analytics to optimize pricing and market dynamics",
    icon: "📈",
  },
  {
    title: "Cross-Industry Adoption",
    description: "Expand beyond crypto to revolutionize price discovery in traditional markets and e-commerce",
    icon: "🚀",
  },
];

export function Vision({
  title = "Long-Term Vision",
  description = "Fairdrop aims to become the universal standard for transparent, fair, and automated price discovery. By merging blockchain automation with data-driven insights, we envision a decentralized global marketplace where price discovery is efficient, fair, and open to all participants.",
  goals = defaultGoals,
}: VisionProps) {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Cosmic background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-background via-background/50 to-background" />
        <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[36rem] h-[36rem] bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 w-[28rem] h-[28rem] bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="text-text-secondary text-lg md:text-xl leading-relaxed">
            {description}
          </p>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-16">
          {goals.map((goal, index) => (
            <div
              key={index}
              className="group relative p-8 rounded-2xl bg-gradient-to-br from-background/90 to-background/80 border border-white/10 hover:border-primary/30 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02]"
            >
              {/* Icon */}
              <div className="mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/20 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-300">
                  {goal.icon}
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-text-primary mb-3">
                {goal.title}
              </h3>
              <p className="text-text-secondary leading-relaxed">
                {goal.description}
              </p>

              {/* Decorative corner */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>

        {/* Call to action */}
        <div className="text-center">
          <div className="inline-block p-8 rounded-3xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border border-white/20 backdrop-blur-xl">
            <p className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Join us in revolutionizing price discovery
            </p>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Together, we&apos;re building a fairer, more transparent marketplace for everyone
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
