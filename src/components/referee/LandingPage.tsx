import React from 'react';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-4xl w-full text-center space-y-8 z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
            Powered by Google Gemini
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-foreground">
          The <span className="text-primary">Referee</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
          Stop guessing. Compare options, understand trade-offs, and decide with confidence.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left my-12">
          {[
            { title: "Define", desc: "Tell us your problem, constraints, and priorities." },
            { title: "Analyze", desc: "AI objectively breaks down viable paths." },
            { title: "Decide", desc: "See pros, cons, and risks side-by-side." }
          ].map((item, idx) => (
            <div key={idx} className="glass-card p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold mb-4">
                {idx + 1}
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">{item.title}</h3>
              <p className="text-muted-foreground text-sm">{item.desc}</p>
            </div>
          ))}
        </div>

        <button 
          onClick={onStart}
          className="group relative inline-flex items-center justify-center px-8 py-4 font-semibold text-primary-foreground transition-all duration-200 bg-primary rounded-full hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <span className="mr-2 text-lg">Start Analysis</span>
          <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  );
};
