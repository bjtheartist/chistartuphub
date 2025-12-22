import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Box, Megaphone, Settings, Brain, X } from "lucide-react";
import { motion } from "framer-motion";

const phases = [
  {
    number: 1,
    title: "Validate",
    subtitle: "(Discover and Refine)",
  },
  {
    number: 2,
    title: "Systematize",
    subtitle: "(Build the Engine)",
  },
  {
    number: 3,
    title: "Scale",
    subtitle: "(Expand and Impact)",
  },
];

const dimensions = [
  {
    icon: Box,
    label: "Problem",
    color: "bg-blue-500",
    cells: [
      {
        question: "Whose pain do we remove?",
        subtext: "Are we solving a real problem for a specific audience?",
        troubleshootingQuestions: [
          "Can you describe the specific pain point in one sentence?",
          "Have you interviewed at least 10 potential users about this problem?",
          "Can users clearly articulate why existing solutions don't work?",
          "Do you have evidence that people are actively trying to solve this problem today?",
        ],
      },
      {
        question: "How do we embed feedback?",
        subtext: "Are we building repeatable systems to capture insights?",
        troubleshootingQuestions: [
          "Do you have a documented process for collecting user feedback?",
          "How quickly can you implement changes based on user insights?",
          "Are you tracking feedback metrics consistently?",
          "Do you have regular check-ins scheduled with your core users?",
        ],
      },
      {
        question: "How do we stay ahead?",
        subtext: "Are we anticipating market shifts and new user needs?",
        troubleshootingQuestions: [
          "Do you have regular check-ins with users about emerging needs?",
          "Are you monitoring competitor movements and market trends?",
          "Do you have a roadmap that anticipates future user problems?",
          "Are you testing new problem areas quarterly?",
        ],
      },
    ],
  },
  {
    icon: Megaphone,
    label: "Growth",
    color: "bg-yellow-400",
    cells: [
      {
        question: "How do we reach our first users?",
        subtext: "Are we finding initial, non-scalable ways to get traction?",
        troubleshootingQuestions: [
          "Have you identified where your target users spend time online and offline?",
          "Are you personally reaching out and having conversations with potential users?",
          "Have you tested at least 3 different acquisition channels?",
          "Do you know which channels are bringing you the highest-quality users?",
        ],
      },
      {
        question: "How do we reach our target audience?",
        subtext: "Are we building a repeatable, predictable engine for acquisition?",
        troubleshootingQuestions: [
          "Do you know your cost per acquisition for each channel?",
          "Can you predict how many users you'll acquire next month?",
          "Have you documented your acquisition playbook?",
          "Are 1-2 channels consistently delivering results?",
        ],
      },
      {
        question: "How do we expand our reach?",
        subtext: "Are we diversifying channels and optimizing for market share?",
        troubleshootingQuestions: [
          "Are you active in at least 4-5 acquisition channels?",
          "Do you have automated systems for scaling your best channels?",
          "Are you testing new channels quarterly?",
          "Can your growth machine operate without founder involvement?",
        ],
      },
    ],
  },
  {
    icon: Settings,
    label: "Operations",
    color: "bg-green-500",
    cells: [
      {
        question: "How do we deliver the outcome?",
        subtext: "Can we manually and reliably produce results for early users?",
        troubleshootingQuestions: [
          "Can you successfully deliver value to users without automation?",
          "Do you understand every step of your delivery process?",
          "Are users getting the outcome they expected?",
          "Can you explain your operations to someone else clearly?",
        ],
      },
      {
        question: "Can we produce outcomes repeatedly?",
        subtext: "Are we documenting and automating processes to remove the founder?",
        troubleshootingQuestions: [
          "Have you documented your key operational processes?",
          "Could someone else deliver the same quality without you?",
          "What percentage of your operations are automated?",
          "Do you have quality control metrics in place?",
        ],
      },
      {
        question: "How do we deliver at scale?",
        subtext: "Are we building distributed, high-quality systems?",
        troubleshootingQuestions: [
          "Can your systems handle 10x current volume?",
          "Do you have monitoring and quality control in place?",
          "Are your operations distributed across teams or regions?",
          "Have you stress-tested your infrastructure?",
        ],
      },
    ],
  },
  {
    icon: Brain,
    label: "Brand",
    color: "bg-purple-500",
    cells: [
      {
        question: "What do people believe about us?",
        subtext: "What is the initial perception we are creating with early users?",
        troubleshootingQuestions: [
          "Can users describe what makes you different in one sentence?",
          "What emotions do users associate with your product?",
          "Do users recommend you, and what do they say?",
          "Is your messaging resonating with your target audience?",
        ],
      },
      {
        question: "How do we codify our identity?",
        subtext: "Are we creating consistent messaging and brand assets?",
        troubleshootingQuestions: [
          "Do you have documented brand guidelines?",
          "Is your messaging consistent across all channels?",
          "Can your team articulate your brand positioning clearly?",
          "Do you have a content strategy that reinforces your brand?",
        ],
      },
      {
        question: "How do we own our category?",
        subtext: "Are we becoming the default choice in our market?",
        troubleshootingQuestions: [
          "Are you the first name mentioned in your category?",
          "Do you have significant market share in your target segment?",
          "Are competitors positioning themselves relative to you?",
          "Do you have strong brand recognition metrics?",
        ],
      },
    ],
  },
];

function MatrixCellModal({ isOpen, onClose, dimension, phase, question, subtext, troubleshootingQuestions }) {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        className="bg-[#0A0A0A] border border-white/[0.15] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
            <div className="bg-white/[0.04] border-b border-white/[0.1] p-6 flex items-start justify-between sticky top-0 backdrop-blur-xl">
              <div className="flex-1">
                <div className="text-xs text-blue-400 mb-1 uppercase tracking-wider">
                  {dimension} - Phase {phase}
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">{question}</h2>
                <p className="text-sm text-white/60">{subtext}</p>
              </div>
              <button
                onClick={onClose}
                className="ml-4 p-2 hover:bg-white/[0.1] transition-colors rounded-lg border border-white/10"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <div className="p-8">
              <h3 className="text-lg font-semibold text-white mb-6 uppercase tracking-wider">
                Troubleshooting Questions
              </h3>

              <div className="space-y-3">
                {troubleshootingQuestions.map((q, index) => (
                  <div
                    key={index}
                    className="bg-white/[0.04] border border-white/[0.08] rounded-lg p-4"
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>
                      <p className="text-sm text-white/70 leading-relaxed pt-1">{q}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-white/[0.1]">
                <p className="text-sm text-white/60 leading-relaxed">
                  <strong className="text-white font-semibold">Pro tip:</strong> Use these questions to assess where you
                  truly are in this phase. If you can't answer "yes" to most of them, you may need to focus more
                  energy here before moving forward.
                </p>
              </div>
            </div>
      </div>
    </div>,
    document.body
  );
}

export default function MaturityMatrix() {
  const [selectedCell, setSelectedCell] = useState(null);

  return (
    <section className="mb-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1 max-w-[40px] bg-gradient-to-r from-white/50 to-transparent" />
          <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-white/50">From The Startup Maturity Atlas</h2>
        </div>
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2 tracking-tight">
          Startup Maturity Matrix
        </h2>
        <p className="text-white/40 font-light text-sm md:text-base leading-relaxed max-w-3xl">
          A framework to diagnose where you are and identify your next focus area across four critical dimensions
        </p>
      </motion.div>

      <div className="grid grid-cols-[180px_1fr_1fr_1fr] md:grid-cols-[220px_1fr_1fr_1fr] gap-4 mb-8">
        {/* Empty corner cell */}
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-lg" />

        {/* Phase headers */}
        {phases.map((phase) => (
          <div
            key={phase.number}
            className="bg-white/[0.04] border border-white/[0.1] rounded-lg p-4 md:p-6 text-center"
          >
            <h3 className="text-lg md:text-xl font-semibold text-white mb-1">
              Phase {phase.number}
            </h3>
            <h4 className="text-sm md:text-base font-semibold text-blue-400 mb-1">
              {phase.title}
            </h4>
            <p className="text-xs text-white/50">{phase.subtitle}</p>
          </div>
        ))}

        {/* Dimension rows */}
        {dimensions.map((dimension) => (
          <React.Fragment key={dimension.label}>
            {/* Dimension label */}
            <div className="bg-white/[0.04] border border-white/[0.1] rounded-lg p-4 md:p-6 flex flex-col items-center justify-center gap-3">
              <div className={`${dimension.color} p-2 md:p-3 border border-white/10 rounded-lg`}>
                <dimension.icon className="w-6 h-6 md:w-8 md:h-8 text-white" strokeWidth={2.5} />
              </div>
              <h4 className="text-sm md:text-base font-semibold text-white text-center">
                {dimension.label}
              </h4>
            </div>

            {/* Cells for each phase */}
            {dimension.cells.map((cell, index) => (
              <motion.button
                key={index}
                onClick={() => {
                  console.log("Cell clicked!", dimension.label, index + 1);
                  setSelectedCell({
                    dimension: dimension.label,
                    phase: index + 1,
                    question: cell.question,
                    subtext: cell.subtext,
                    troubleshootingQuestions: cell.troubleshootingQuestions,
                  });
                }}
                whileHover={{ scale: 1.02, borderColor: "rgba(96, 165, 250, 0.3)" }}
                whileTap={{ scale: 0.98 }}
                className="bg-white/[0.06] border border-white/[0.08] hover:border-blue-500/30 rounded-lg p-4 md:p-6 transition-all text-left group"
              >
                <h5 className="text-xs md:text-sm font-semibold text-white mb-2 leading-snug group-hover:text-blue-300 transition-colors">
                  {cell.question}
                </h5>
                <p className="text-xs text-white/50 leading-relaxed">{cell.subtext}</p>
              </motion.button>
            ))}
          </React.Fragment>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="bg-white/[0.04] border border-white/[0.1] rounded-xl p-6 md:p-8"
      >
        <p className="text-white/70 text-sm leading-relaxed">
          <strong className="text-white">Note:</strong> The startup journey isn't linear—founders loop back
          between stages constantly. This matrix is meant to orient, not prescribe. Use it as a compass, not a
          schedule.
        </p>
      </motion.div>

      <MatrixCellModal
        isOpen={!!selectedCell}
        onClose={() => setSelectedCell(null)}
        dimension={selectedCell?.dimension || ""}
        phase={selectedCell?.phase || 1}
        question={selectedCell?.question || ""}
        subtext={selectedCell?.subtext || ""}
        troubleshootingQuestions={selectedCell?.troubleshootingQuestions || []}
      />
    </section>
  );
}