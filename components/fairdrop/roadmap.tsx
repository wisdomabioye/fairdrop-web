'use client';

export interface RoadmapPhase {
  phase: string;
  timeline: string;
  milestones: string[];
  status?: 'completed' | 'in-progress' | 'upcoming';
}

export interface RoadmapProps {
  phases?: RoadmapPhase[];
}

const defaultPhases: RoadmapPhase[] = [
  {
    phase: "Phase 1: MVP Launch",
    timeline: "Q1 2026",
    milestones: [
      "Smart contract deployment",
      "Front-end launch",
      "First live auction",
    ],
    status: "in-progress",
  },
  {
    phase: "Phase 2: Ecosystem Expansion",
    timeline: "Q2 2026",
    milestones: [
      "Integration with NFT marketplaces",
      "Partnership with token projects",
      "Mobile app beta release",
    ],
    status: "upcoming",
  },
  {
    phase: "Phase 3: Governance Integration",
    timeline: "Q3 2026",
    milestones: [
      "DAO structure implementation",
      "Community voting system",
      "Protocol upgrade proposals",
    ],
    status: "upcoming",
  },
  {
    phase: "Phase 4: Analytics & AI",
    timeline: "Q4 2026",
    milestones: [
      "AI-driven price optimization",
      "Buyer sentiment tracking",
      "Advanced analytics dashboard",
    ],
    status: "upcoming",
  },
  {
    phase: "Phase 5: Global Expansion",
    timeline: "2027",
    milestones: [
      "Multi-chain support",
      "Fiat on/off ramp integration",
      "International partnerships",
    ],
    status: "upcoming",
  },
];

const statusConfig = {
  completed: {
    color: "green",
    icon: "✓",
    label: "Completed",
  },
  "in-progress": {
    color: "blue",
    icon: "⚡",
    label: "In Progress",
  },
  upcoming: {
    color: "purple",
    icon: "🔮",
    label: "Upcoming",
  },
};

export function Roadmap({ phases = defaultPhases }: RoadmapProps) {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/3 w-[28rem] h-[28rem] bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Roadmap
          </h2>
          <p className="text-text-secondary text-lg max-w-3xl mx-auto">
            Our journey to revolutionize fair price discovery
          </p>
        </div>

        {/* Timeline */}
        <div className="max-w-5xl mx-auto">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-accent" />

            {/* Phases */}
            <div className="space-y-12">
              {phases.map((phase, index) => {
                const config = statusConfig[phase.status || 'upcoming'];
                const isEven = index % 2 === 0;

                return (
                  <div
                    key={index}
                    className={`relative flex items-center ${
                      isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                    } flex-col md:gap-8`}
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary border-4 border-background shadow-lg shadow-primary/50 z-10" />

                    {/* Spacer for mobile */}
                    <div className="w-full md:w-1/2" />

                    {/* Content card */}
                    <div className={`w-full md:w-1/2 ml-20 md:ml-0 ${!isEven ? 'md:text-right' : ''}`}>
                      <div className="group p-6 rounded-2xl bg-gradient-to-br from-background/95 to-background/90 border border-white/10 hover:border-primary/30 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02]">
                        {/* Status badge */}
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-${config.color}-500/20 border border-${config.color}-500/30 mb-4`}>
                          <span className="text-sm">{config.icon}</span>
                          <span className="text-xs font-semibold text-text-primary">{config.label}</span>
                        </div>

                        {/* Phase title */}
                        <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-2">
                          {phase.phase}
                        </h3>

                        {/* Timeline */}
                        <p className="text-primary font-semibold mb-4">
                          {phase.timeline}
                        </p>

                        {/* Milestones */}
                        <ul className={`space-y-2 ${!isEven ? 'md:text-right' : ''}`}>
                          {phase.milestones.map((milestone, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-text-secondary text-sm">
                              <span className="text-primary shrink-0">▸</span>
                              <span>{milestone}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Hover effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/5 to-secondary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
