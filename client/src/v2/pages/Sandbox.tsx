import { useEffect, useState } from "react";
import { applyGradePalette, DEFAULT_GRADE_PALETTE, type GradePalette } from "../theme/gradeTheme";
import { useLocation } from "wouter";

export default function Sandbox() {
  const [palette, setPalette] = useState<GradePalette>(DEFAULT_GRADE_PALETTE);
  const [, navigate] = useLocation();

  // Initialize and apply the grade palette
  useEffect(() => {
    applyGradePalette(palette);
  }, [palette]);

  // Handler for custom color modifications
  const handleColorChange = (key: keyof GradePalette, val: string) => {
    setPalette((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const resetTheme = () => {
    setPalette(DEFAULT_GRADE_PALETTE);
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-sans transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-ink/10 px-8 py-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Daily Viva Tracker</h1>
            <p className="text-sm text-ink/60 mt-1">Redesigned Experience &bull; Version 2.0 (Parallel Alpha)</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/v2/evaluation?subject=English&class=1")}
              className="bg-brass text-white py-2 px-4 rounded-xl text-xs font-semibold hover:bg-brass/90 transition-colors shadow-sm"
            >
              Demo Evaluation Page
            </button>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brass/10 text-brass">
              <span className="h-1.5 w-1.5 rounded-full bg-brass animate-pulse"></span>
              Isolated Scaffold Ready
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Introduction Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/50 backdrop-blur-sm p-8 rounded-2xl border border-ink/5 shadow-sm space-y-4">
              <h2 className="text-3xl font-extrabold text-ink tracking-tight">
                V2 Sandbox
              </h2>
              <p className="text-lg text-ink/80 leading-relaxed">
                Welcome to the redesigned parallel framework of Daily Viva Tracker. This area is completely isolated from existing legacy code, allowing us to safely iterate on layout, UX, and design tokens without impacting current student/teacher workflows.
              </p>
              <div className="pt-2 border-t border-ink/5 flex gap-4 text-sm text-ink/60">
                <div>
                  <strong>Route:</strong> <code>/v2</code>
                </div>
                <div>
                  <strong>Status:</strong> Active &amp; Isolated
                </div>
              </div>
            </div>

            {/* Verification of Grade Colors */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold tracking-tight text-ink">Dynamic Grade Theme Preview</h3>
              <p className="text-sm text-ink/75">
                The cards below are colored using utility classes mapping directly to dynamic CSS custom properties (e.g. <code>bg-grade-excellent</code>).
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-grade-excellent border border-ink/10 p-4 rounded-xl text-center shadow-sm transition-all duration-300 hover:scale-[1.02]">
                  <span className="block text-xs uppercase tracking-wider font-semibold opacity-70 mb-1">Excellent</span>
                  <span className="font-mono text-xs">{palette.excellent}</span>
                </div>
                <div className="bg-grade-good border border-ink/10 p-4 rounded-xl text-center shadow-sm transition-all duration-300 hover:scale-[1.02]">
                  <span className="block text-xs uppercase tracking-wider font-semibold opacity-70 mb-1">Good</span>
                  <span className="font-mono text-xs">{palette.good}</span>
                </div>
                <div className="bg-grade-satisfactory border border-ink/10 p-4 rounded-xl text-center shadow-sm transition-all duration-300 hover:scale-[1.02]">
                  <span className="block text-xs uppercase tracking-wider font-semibold opacity-70 mb-1">Satisfactory</span>
                  <span className="font-mono text-xs">{palette.satisfactory}</span>
                </div>
                <div className="bg-grade-improve border border-ink/10 p-4 rounded-xl text-center shadow-sm transition-all duration-300 hover:scale-[1.02]">
                  <span className="block text-xs uppercase tracking-wider font-semibold opacity-70 mb-1">Needs Imp.</span>
                  <span className="font-mono text-xs">{palette.improve}</span>
                </div>
                <div className="bg-grade-poor border border-ink/10 p-4 rounded-xl text-center shadow-sm col-span-2 md:col-span-1 transition-all duration-300 hover:scale-[1.02]">
                  <span className="block text-xs uppercase tracking-wider font-semibold opacity-70 mb-1">Poor</span>
                  <span className="font-mono text-xs">{palette.poor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* College Theme Customization Panel */}
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-ink/5 shadow-md h-fit space-y-6">
            <div>
              <h3 className="text-lg font-bold text-ink flex items-center gap-2">
                <svg className="w-5 h-5 text-brass" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                College Theme Panel
              </h3>
              <p className="text-xs text-ink/60 mt-1">Simulate custom college palette overrides at runtime.</p>
            </div>

            <div className="space-y-4">
              {(Object.keys(palette) as Array<keyof GradePalette>).map((key) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold capitalize text-ink/80">{key}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={palette[key]}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-ink/10"
                    />
                    <input
                      type="text"
                      value={palette[key]}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="w-20 px-2 py-1 font-mono text-xs bg-white rounded border border-ink/10 text-ink focus:outline-none focus:border-brass"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={resetTheme}
              className="w-full bg-brass text-white py-2.5 px-4 rounded-xl text-sm font-medium hover:bg-brass/90 transition-all duration-200 shadow-sm"
            >
              Reset to Default Colors
            </button>
          </div>
          
        </div>
      </main>
    </div>
  );
}
