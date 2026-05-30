import { useState, useEffect, MouseEvent, FormEvent } from "react";
import { 
  Sparkles, 
  Trash2, 
  CheckCircle, 
  Plus, 
  Calendar, 
  Clock, 
  MapPin, 
  Activity, 
  Compass, 
  Lightbulb, 
  Award,
  ChevronRight,
  AlertCircle,
  HelpCircle,
  FolderLock,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LifecycleTask, ProjectLifecycle } from "./types";

// High-fidelity pre-populated sample project layout to avoid empty screens
const SAMPLE_PLAN: ProjectLifecycle = {
  id: "sample-drone-delivery",
  idea: "I want to build an autonomous drone delivery startup for my local neighborhood to ship medicines and fresh groceries.",
  createdAt: "May 30, 2026, 4:24 PM",
  tasks: [
    {
      sequence: 1,
      category: "1. Planning & Setup",
      title: "Write down the Rules, Permits, and Fly Routes",
      breakdown: "Contact your local neighborhood aviation group to find out where drones are allowed to fly safely. Set up a basic insurance plan to cover any accidental bumps or damage to property.",
      completed: true
    },
    {
      sequence: 2,
      category: "2. Design & Layout",
      title: "Design the Delivery App Screens and Map Rules",
      breakdown: "Draw simple wireframes showing how customers search for groceries or medicine on their phone. Design a clean map showing the flight path overlay with color-coded safety drop regions.",
      completed: false
    },
    {
      sequence: 3,
      category: "3. Building & Coding",
      title: "Code the Automatic Flight App & Backend Server",
      breakdown: "Write the basic computer code that tells the drones to take off and follow the pre-planned coordinates automatically. Include a simple emergency button so a human pilot can instantly take manual control.",
      completed: false
    },
    {
      sequence: 4,
      category: "4. Testing & Fixing",
      title: "Perform Safe Sandbox Drone Flight Mock Trials",
      breakdown: "Fly drones with weighted dummy boxes over empty grass fields to check for landing errors or bugs in your code. Tweak the sensor parameters until delivery drops are pinpoint accurate in windy draft conditions.",
      completed: false
    },
    {
      sequence: 5,
      category: "5. Launching & Supporting",
      title: "Launch to 20 Neighbors & Log Battery Status",
      breakdown: "Invite your first group of neighbors to try out free food deliveries and share helpful reviews. Track actual flight hours and check battery wear levels weekly to keep flights absolutely safe and reliable.",
      completed: false
    }
  ]
};

const SUGGESTIONS = [
  {
    title: "Neighborhood Drone Delivery",
    desc: "A drone delivery startup to quickly transport medicines and hot meals to neighborhood backyards.",
    icon: "🚁"
  },
  {
    title: "Senior-Citizen Pet Matchmaker",
    desc: "An automated web portal matching vetted rescue dogs with seniors for therapeutic companionship.",
    icon: "🐾"
  },
  {
    title: "Micro-SaaS Invoicing API",
    desc: "A headless REST API that parses physical receipts and instantly creates tax-compliant invoices.",
    icon: "⚡"
  }
];

export default function App() {
  const [savedPlans, setSavedPlans] = useState<ProjectLifecycle[]>(() => {
    try {
      const saved = localStorage.getItem("smart_lifecycle_plans");
      const parsed = saved ? JSON.parse(saved) : [];
      // If empty, pre-populate sample plan so the user immediately sees a glorious UI
      return parsed.length > 0 ? parsed : [SAMPLE_PLAN];
    } catch {
      return [SAMPLE_PLAN];
    }
  });

  const [activePlanId, setActivePlanId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("smart_lifecycle_plans");
      const parsed = saved ? JSON.parse(saved) : [];
      return parsed.length > 0 ? parsed[0].id : SAMPLE_PLAN.id;
    } catch {
      return SAMPLE_PLAN.id;
    }
  });

  const [rawIdea, setRawIdea] = useState("");
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Keep localStorage perfectly in sync
  useEffect(() => {
    try {
      localStorage.setItem("smart_lifecycle_plans", JSON.stringify(savedPlans));
    } catch (e) {
      console.error("Failed to write state to localStorage:", e);
    }
  }, [savedPlans]);

  // Find the active lifecycle project structure
  const activePlan = savedPlans.find((p) => p.id === activePlanId) || savedPlans[0] || SAMPLE_PLAN;

  const handleToggleTask = (planId: string, taskSequence: number) => {
    setSavedPlans((prevPlans) =>
      prevPlans.map((plan) => {
        if (plan.id === planId) {
          return {
            ...plan,
            tasks: plan.tasks.map((t) =>
              t.sequence === taskSequence ? { ...t, completed: !t.completed } : t
            ),
          };
        }
        return plan;
      })
    );
  };

  const handleDeletePlan = (planId: string, e: MouseEvent) => {
    e.stopPropagation();
    
    // Warn if trying to delete final item
    if (savedPlans.length <= 1) {
      setErrorMsg("You must keep at least one project plan in the workspace lifecycle history.");
      return;
    }

    const updated = savedPlans.filter((p) => p.id !== planId);
    setSavedPlans(updated);
    
    // Fall back to first available plan
    if (activePlanId === planId) {
      setActivePlanId(updated[0].id);
    }
  };

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!rawIdea.trim()) {
      setErrorMsg("Please paste a project idea or select one of our suggestions!");
      return;
    }

    setGenerating(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: rawIdea.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Generation endpoint returned an error.");
      }

      const data = await response.json();
      if (!data.tasks || !Array.isArray(data.tasks) || data.tasks.length === 0) {
        throw new Error("Invalid format returned. Model failed to produce 5 execution tasks.");
      }

      // Build out full object
      const newPlan: ProjectLifecycle = {
        id: "plan-" + Date.now(),
        idea: rawIdea.trim(),
        createdAt: new Date().toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        tasks: data.tasks.map((t: any) => ({
          sequence: t.sequence,
          category: t.category || "General",
          title: t.title || "Execution step",
          breakdown: t.breakdown || "Deep execution detail from our technical project manager.",
          completed: false,
        })),
      };

      setSavedPlans((prev) => [newPlan, ...prev]);
      setActivePlanId(newPlan.id);
      setRawIdea(""); // Reset textarea
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Something went wrong building your lifecycle plan. Please verify server connectivity.");
    } finally {
      setGenerating(false);
    }
  };

  const selectSuggestion = (text: string) => {
    setRawIdea(text);
    setErrorMsg(null);
  };

  // Safe category color-coding parser
  const getCategoryClass = (category: string) => {
    const cat = category.toLowerCase();
    
    // Check development phases first
    if (cat.includes("1") || cat.includes("plan") || cat.includes("setup")) {
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    }
    if (cat.includes("2") || cat.includes("design") || cat.includes("layout") || cat.includes("sketch")) {
      return "bg-purple-500/15 text-purple-400 border-purple-500/30";
    }
    if (cat.includes("3") || cat.includes("build") || cat.includes("code") || cat.includes("cod") || cat.includes("dev") || cat.includes("engine")) {
      return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
    }
    if (cat.includes("4") || cat.includes("test") || cat.includes("fix") || cat.includes("debug") || cat.includes("trial")) {
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    }
    if (cat.includes("5") || cat.includes("launch") || cat.includes("support") || cat.includes("live") || cat.includes("maintain")) {
      return "bg-rose-500/15 text-rose-400 border-rose-500/30";
    }

    // Generic fallbacks
    if (cat.includes("legal") || cat.includes("compl") || cat.includes("law")) {
      return "bg-orange-500/15 text-orange-450 border-orange-500/30";
    }
    if (cat.includes("market") || cat.includes("sale") || cat.includes("laun") || cat.includes("brand")) {
      return "bg-pink-500/15 text-pink-400 border-pink-500/30";
    }
    return "bg-zinc-500/15 text-zinc-300 border-zinc-500/30";
  };

  // Stats computation for active project lifecycle
  const totalTasks = activePlan.tasks.length;
  const completedCount = activePlan.tasks.filter((t) => t.completed).length;
  const percentComplete = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Decorative Background Glows */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-indigo-950/15 via-transparent to-transparent pointer-events-none -z-10" />
      <div className="absolute top-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full filter blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-indigo-500/5 rounded-full filter blur-[150px] pointer-events-none -z-10" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* App Title Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-neutral-800/80 pb-6 mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl shadow-lg shadow-indigo-500/5">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 id="app-title" className="text-2xl sm:text-3xl font-display font-medium tracking-tight text-white flex items-center gap-2">
                Smart-Lifecycle Planner
              </h1>
              <p className="text-sm text-neutral-400 mt-1">
                Elite AI Technical Project Manager • Instant 5-Task Execution Blueprints
              </p>
            </div>
          </div>
          
          {/* Top Status */}
          <div className="flex items-center gap-3 self-start md:self-auto bg-neutral-900/60 border border-neutral-800/60 px-4 py-2 rounded-xl text-xs font-mono">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-neutral-400">Gemini 3.5 Flash Model Connected</span>
          </div>
        </header>

        {/* Dashboard Grid Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANEL: Saved Blueprints & Generators (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Project Idea Input Form Card */}
            <div className="bg-neutral-900/65 border border-neutral-800/85 rounded-2xl p-5 shadow-xl backdrop-blur-md">
              <h2 id="generator-heading" className="text-lg font-display font-medium text-white mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-indigo-404 text-amber-400" />
                Plan a New Lifecycle Map
              </h2>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label htmlFor="raw-idea" className="block text-xs font-medium text-neutral-400 mb-2">
                    Paste your raw project idea here:
                  </label>
                  <textarea
                    id="raw-idea"
                    rows={4}
                    value={rawIdea}
                    onChange={(e) => setRawIdea(e.target.value)}
                    placeholder="e.g., 'I want to build a drone delivery startup for my local neighborhood to transport medicines and hot fresh meals.'"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm rounded-xl p-3 text-neutral-100 placeholder:text-neutral-600 transition-colors resize-none outline-none font-sans"
                  />
                </div>

                {errorMsg && (
                  <motion.div 
                    initial={{ opacity: 0, y: -4 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="flex p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}

                <button
                  id="generate-button"
                  type="submit"
                  disabled={generating}
                  className="w-full relative group flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-[0.98] disabled:scale-100 disabled:opacity-50 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/10 transition-all cursor-pointer select-none"
                >
                  {generating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Architecting Tasks...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
                      <span>Generate Lifecycle Map</span>
                    </>
                  )}
                </button>
              </form>

              {/* Suggestions Quick Launch */}
              <div className="mt-5 border-t border-neutral-800/60 pt-4">
                <span className="text-xs text-neutral-500 font-medium block mb-2">Need project inspiration? Click one to copy:</span>
                <div className="space-y-2">
                  {SUGGESTIONS.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectSuggestion(s.desc)}
                      className="w-full flex items-start gap-2.5 p-2 text-left bg-neutral-950/40 hover:bg-neutral-800/40 border border-neutral-800/40 rounded-lg transition-all text-xs group"
                    >
                      <span className="text-sm shrink-0" role="img" aria-label="emoji">{s.icon}</span>
                      <div>
                        <span className="font-semibold text-neutral-300 group-hover:text-indigo-400 transition-colors block">{s.title}</span>
                        <span className="text-neutral-500 line-clamp-1 block mt-0.5">{s.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Saved Plans History Navigation */}
            <div className="bg-neutral-900/65 border border-neutral-800/85 rounded-2xl p-5 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-display font-medium text-white tracking-wide uppercase">
                  Lifecycle Blueprint History ({savedPlans.length})
                </h3>
              </div>
              
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-neutral-800">
                {savedPlans.map((plan) => {
                  const isActive = plan.id === activePlanId;
                  const total = plan.tasks.length;
                  const done = plan.tasks.filter((t) => t.completed).length;
                  const pct = Math.round((done / total) * 100);

                  return (
                    <div
                      key={plan.id}
                      onClick={() => {
                        setActivePlanId(plan.id);
                        setErrorMsg(null);
                      }}
                      className={`relative p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none group ${
                        isActive
                          ? "bg-indigo-600/10 border-indigo-500/50 shadow-md shadow-indigo-500/5"
                          : "bg-neutral-950/40 hover:bg-neutral-800/35 border-neutral-800/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5 mb-1.5">
                        <span className={`text-xs font-medium font-mono shrink-0 px-1.5 py-0.5 rounded ${
                          isActive ? "bg-indigo-500/20 text-indigo-300" : "bg-neutral-800 text-neutral-400"
                        }`}>
                          {done}/{total} done
                        </span>
                        
                        <button
                          onClick={(e) => handleDeletePlan(plan.id, e)}
                          title="Delete lifecycle blueprint"
                          className="text-neutral-500 hover:text-rose-400 p-0.5 rounded hover:bg-rose-500/10 transition-colors self-start shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className={`text-xs font-semibold leading-tight line-clamp-2 ${isActive ? "text-white" : "text-neutral-300 group-hover:text-neutral-100"}`}>
                        {plan.idea}
                      </p>

                      {/* Progress Spark */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono mb-1">
                          <span>Progress</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full bg-neutral-800 rounded-full h-1 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-neutral-500 mt-2 font-mono">
                        <Calendar className="w-3 h-3" />
                        <span>{plan.createdAt}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Prompt Rules Explainer */}
            <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-2xl p-4 text-xs text-neutral-400 leading-relaxed space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-neutral-300 mb-1">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                <span>PM Elite AI System Rules:</span>
              </div>
              <p>
                Our server instructs Gemini in elite PM mode to linearize any startup, coding, or operation challenge into exactly <strong className="text-indigo-400 font-bold">5 technical checkpoints</strong>.
              </p>
              <p>
                The AI returns sequence numbers, category codes, and concrete structural steps for your review. Toggle checkpoints off to track launch readiness!
              </p>
            </div>

          </div>

          {/* RIGHT PANEL: Timeline Focus & Action Center (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Selected Idea Highlight Banner */}
            <div className="bg-neutral-900/65 border border-neutral-800/85 rounded-2xl p-6 shadow-xl backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 text-indigo-500/10 hover:text-indigo-500/20 transition-colors pointer-events-none">
                <Award className="w-24 h-24 stroke-[1]" />
              </div>
              
              <div className="relative z-10">
                <span className="text-xs uppercase tracking-wider font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">
                  Active Lifecycle Map
                </span>
                
                <h3 className="text-xl sm:text-2xl font-display font-medium text-white mt-3 leading-snug">
                  "{activePlan.idea}"
                </h3>

                {/* Progress Indicators */}
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-950/40 border border-neutral-800/40 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/15 rounded-lg border border-indigo-500/25">
                      <Activity className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <span className="text-xs text-neutral-400 font-medium block">Sprint Progress Overview</span>
                      <span className="text-sm font-semibold text-white font-mono">{completedCount} of {totalTasks} Tasks Finalized ({percentComplete}%)</span>
                    </div>
                  </div>

                  <div className="flex-1 max-w-xs w-full">
                    <div className="flex items-center justify-between text-xs font-mono text-neutral-400 mb-1.5">
                      <span>Launch Readiness</span>
                      <span className="text-indigo-400 font-bold">{percentComplete}%</span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden border border-neutral-700/30">
                      <motion.div
                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 h-full shadow-[0_0_8px_rgba(99,102,241,0.2)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${percentComplete}%` }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-neutral-500 mt-4 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Created on: {activePlan.createdAt}
                  </span>
                  <span>•</span>
                  <span className="text-neutral-400 font-semibold">
                    {percentComplete === 100 ? "🎉 Fully prepared for launch!" : "🚀 Keep coordinating tasks to launch"}
                  </span>
                </div>
              </div>
            </div>

            {/* Vertical Lifecycle Timeline Map Checklist */}
            <div className="relative">
              
              {/* Vertical Timeline Track Line */}
              <div className="absolute left-[21px] sm:left-12 top-6 bottom-6 w-[2px] bg-gradient-to-b from-indigo-500/40 via-purple-500/30 to-neutral-800/40" />

              <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                  {activePlan.tasks.map((task) => {
                    const isCompleted = task.completed;
                    const badgeClass = getCategoryClass(task.category);

                    return (
                      <motion.div
                        id={`task-node-${task.sequence}`}
                        key={task.sequence}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3, delay: task.sequence * 0.05 }}
                        className={`relative flex items-start gap-4 sm:gap-8 transition-all ${
                          isCompleted ? "opacity-60" : "opacity-100"
                        }`}
                      >
                        
                        {/* Interactive Timeline Orb / Checkbox checkpoint */}
                        <div className="z-10 shrink-0 mt-2 sm:mt-1.5 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleToggleTask(activePlan.id, task.sequence)}
                            title={isCompleted ? "Mark task as incomplete" : "Mark task as complete"}
                            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all border duration-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer ${
                              isCompleted
                                ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20"
                                : "bg-neutral-900 border-neutral-700 text-transparent hover:border-indigo-400 group-hover:text-neutral-600"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="w-5.5 h-5.5 text-white" />
                            ) : (
                              <span className="text-xs font-mono font-bold text-neutral-400">
                                0{task.sequence}
                              </span>
                            )}
                          </button>
                        </div>

                        {/* Lifecycle Task Card Detail */}
                        <div
                          className={`flex-1 rounded-2xl transition-all duration-300 border ${
                            isCompleted
                              ? "bg-neutral-900/30 border-neutral-800/50 backdrop-blur-sm"
                              : "bg-neutral-900/70 hover:bg-neutral-900/90 hover:border-neutral-700/80 border-neutral-800/80 shadow-lg shadow-black/10"
                          }`}
                        >
                          <div className="p-5 sm:p-6">
                            
                            {/* Card Header information */}
                            <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-semibold text-neutral-500 uppercase tracking-widest">
                                  Task 0{task.sequence}
                                </span>
                                <span className={`text-[10px] sm:text-xs font-mono px-2.5 py-0.5 rounded-full border ${badgeClass}`}>
                                  {task.category}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <label className="flex items-center gap-1 text-xs text-neutral-400 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={isCompleted}
                                    onChange={() => handleToggleTask(activePlan.id, task.sequence)}
                                    className="rounded border-neutral-700 text-indigo-600 focus:ring-indigo-500 bg-neutral-950 accent-indigo-500 h-3.5 w-3.5 cursor-pointer"
                                  />
                                  <span>{isCompleted ? "Complete" : "Mark done"}</span>
                                </label>
                              </div>
                            </div>

                            {/* Actionable Title */}
                            <h4 className={`text-md sm:text-lg font-display font-medium leading-snug transition-all ${
                              isCompleted ? "text-neutral-500 line-through decoration-indigo-500/40" : "text-white"
                            }`}>
                              {task.title}
                            </h4>

                            {/* Deep descriptive Breakdown text */}
                            <p className={`text-sm mt-3.5 leading-relaxed font-sans ${
                              isCompleted ? "text-neutral-500" : "text-neutral-300"
                            }`}>
                              {task.breakdown}
                            </p>

                            {/* Timeline Sequence Navigation Spark */}
                            {!isCompleted && (
                              <div className="mt-4 flex items-center gap-1 text-[11px] font-mono text-indigo-400/80 font-bold">
                                <span>Execution Corridor 0{task.sequence}</span>
                                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                              </div>
                            )}

                          </div>
                        </div>

                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

            </div>

            {/* Active Plan Launch Celebration Notification Card */}
            {percentComplete === 100 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/40 rounded-2xl p-6 shadow-2xl text-center space-y-4 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0,transparent_100%)] pointer-events-none" />
                <div className="mx-auto w-12 h-12 bg-indigo-500/20 border border-indigo-500/40 rounded-full flex items-center justify-center text-indigo-300">
                  <Award className="w-6 h-6 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-display font-medium text-white">Congratulations! Lifecycle Map Completed</h4>
                  <p className="text-sm text-neutral-300 max-w-lg mx-auto">
                    You have verified and finalized all 5 master checkpoints for "<span className="font-semibold text-indigo-300">{activePlan.idea}</span>". Ready to assemble your technical engine and initiate deployment channels!
                  </p>
                </div>
              </motion.div>
            )}

          </div>

        </div>

        {/* Workspace Footer */}
        <footer className="text-center text-[11px] font-mono text-neutral-500 mt-16 pt-8 border-t border-neutral-900 leading-normal space-y-1">
          <p>Smart-Lifecycle Planner • Built of full-stack Node/Express + React & Vite</p>
          <p>Powered securely via server-side generative routing with Google Gemini model APIs.</p>
        </footer>

      </div>
    </div>
  );
}
