'use client';

export interface ProblemSolutionProps {
  problems?: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
  solutions?: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
}

const defaultProblems = [
  {
    title: "Early Bird Advantage",
    description: "Early participants overpay while late buyers miss out on opportunities",
    icon: "⏰",
  },
  {
    title: "Price Uncertainty",
    description: "Projects struggle to establish fair market value for their assets",
    icon: "📊",
  },
  {
    title: "Lack of Transparency",
    description: "Traditional auctions often hide pricing mechanisms and create distrust",
    icon: "🔒",
  },
];

const defaultSolutions = [
  {
    title: "Uniform Clearing Price",
    description: "Everyone pays the same fair price discovered by true market demand",
    icon: "⚖️",
  },
  {
    title: "Automated Discovery",
    description: "Smart contracts automatically find the perfect market equilibrium",
    icon: "🤖",
  },
  {
    title: "Full Transparency",
    description: "Every bid, price change, and sale is recorded on-chain for all to see",
    icon: "🔓",
  },
];

export function ProblemSolution({
  problems = defaultProblems,
  solutions = defaultSolutions,
}: ProblemSolutionProps) {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-red-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            The Problem & Our Solution
          </h2>
          <p className="text-text-secondary text-lg max-w-3xl mx-auto">
            Traditional auctions are broken. Fairdrop fixes them with blockchain technology.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Problems */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                <span className="text-2xl">❌</span>
              </div>
              <h3 className="text-2xl font-bold text-text-primary">The Problems</h3>
            </div>

            <div className="space-y-4">
              {problems.map((problem, index) => (
                <div
                  key={index}
                  className="group p-6 rounded-xl bg-gradient-to-br from-red-500/5 to-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl shrink-0 group-hover:scale-110 transition-transform">
                      {problem.icon}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-text-primary mb-2">
                        {problem.title}
                      </h4>
                      <p className="text-text-secondary text-sm leading-relaxed">
                        {problem.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Solutions */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
              <h3 className="text-2xl font-bold text-text-primary">Our Solutions</h3>
            </div>

            <div className="space-y-4">
              {solutions.map((solution, index) => (
                <div
                  key={index}
                  className="group p-6 rounded-xl bg-gradient-to-br from-green-500/5 to-green-500/10 border border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl shrink-0 group-hover:scale-110 transition-transform">
                      {solution.icon}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-text-primary mb-2">
                        {solution.title}
                      </h4>
                      <p className="text-text-secondary text-sm leading-relaxed">
                        {solution.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
