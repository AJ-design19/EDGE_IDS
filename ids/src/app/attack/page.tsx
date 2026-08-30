"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  ArrowLeft,
  Terminal,
  Zap,
  Radio,
  Skull,
  Activity,
  Sliders,
  Play,
  Flame,
  ShieldAlert as ShieldIcon
} from "lucide-react";

interface AttackScenario {
  type: string;
  name: string;
  description: string;
  protocol: string;
  impact: "Medium" | "High" | "Critical";
  triggerRule: string;
  impactColor: string;
  glowColor: string;
  icon: any;
}

const ATTACK_SCENARIOS: AttackScenario[] = [
  {
    type: "PORT_SCAN_VERTICAL",
    name: "Vertical Port Scan",
    description: "Probes 6 unique target ports on a single host sequentially using TCP SYN packets to find active services.",
    protocol: "TCP SYN",
    impact: "Medium",
    triggerRule: "PORT_SCAN_VERTICAL (>= 5 ports)",
    impactColor: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    glowColor: "shadow-amber-500/10 border-amber-500/20",
    icon: Radio
  },
  {
    type: "PORT_SCAN_HORIZONTAL",
    name: "Horizontal Port Scan",
    description: "Probes a single target port across 11 different destination IPs on the network to sweep for live hosts.",
    protocol: "TCP SYN",
    impact: "High",
    triggerRule: "PORT_SCAN_HORIZONTAL (>= 10 hosts)",
    impactColor: "text-orange-400 border-orange-500/30 bg-orange-500/10",
    glowColor: "shadow-orange-500/10 border-orange-500/20",
    icon: Sliders
  },
  {
    type: "SYN_FLOOD",
    name: "SYN Flood DoS",
    description: "Floods the target with 120 rapid TCP SYN packets in under 1 second with no ACKs to exhaust socket buffers.",
    protocol: "TCP SYN Only",
    impact: "Critical",
    triggerRule: "SYN_FLOOD (SYN/ACK >= 10 ratio)",
    impactColor: "text-rose-400 border-rose-500/30 bg-rose-500/10",
    glowColor: "shadow-rose-500/10 border-rose-500/20",
    icon: Flame
  },
  {
    type: "STEALTH_SCAN_XMAS",
    name: "Stealth Xmas Scan",
    description: "Sends TCP packets with FIN and PSH flags set. Bypasses standard filters and triggers stealth rules.",
    protocol: "TCP FIN+PSH",
    impact: "High",
    triggerRule: "STEALTH_SCAN (Xmas Scan flags)",
    impactColor: "text-orange-400 border-orange-500/30 bg-orange-500/10",
    glowColor: "shadow-orange-500/10 border-orange-500/20",
    icon: Skull
  },
  {
    type: "STEALTH_SCAN_NULL",
    name: "Stealth Null Scan",
    description: "Sends TCP packets with absolutely no flags set (all flag counts zero) to sneak past scanning logs.",
    protocol: "TCP Null Flags",
    impact: "High",
    triggerRule: "STEALTH_SCAN (Null Scan flags)",
    impactColor: "text-orange-400 border-orange-500/30 bg-orange-500/10",
    glowColor: "shadow-orange-500/10 border-orange-500/20",
    icon: Terminal
  },
  {
    type: "ICMP_FLOOD",
    name: "ICMP Ping Flood",
    description: "Floods the network target with 60 high-speed ICMP echo request packets in under 1 second.",
    protocol: "ICMP Echo",
    impact: "Medium",
    triggerRule: "ICMP_FLOOD (>= 50 pings / 2s)",
    impactColor: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    glowColor: "shadow-amber-500/10 border-amber-500/20",
    icon: Activity
  },
  {
    type: "LAND_ATTACK",
    name: "TCP Land Attack",
    description: "Sends spoofed packets where Source IP and Source Port are modified to be identical to Destination IP and Port.",
    protocol: "TCP Spoofed",
    impact: "Critical",
    triggerRule: "LAND_ATTACK (Loop signature)",
    impactColor: "text-rose-400 border-rose-500/30 bg-rose-500/10",
    glowColor: "shadow-rose-500/10 border-rose-500/20",
    icon: Zap
  }
];

export default function AttackPanel() {
  const router = useRouter();
  const [activeAttack, setActiveAttack] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeAttack && secondsLeft > 0) {
      timer = setTimeout(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (activeAttack && secondsLeft === 0) {
      setActiveAttack(null);
      setStatusMsg("Attack completed safely.");
    }
    return () => clearTimeout(timer);
  }, [activeAttack, secondsLeft]);

  const launchAttack = async (scenario: AttackScenario) => {
    if (activeAttack) return;
    setErrorMsg(null);
    setStatusMsg(null);

    try {
      const response = await fetch(`http://localhost:7001/attack?attack_type=${scenario.type}`, {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error(`Server returned code ${response.status}`);
      }

      const data = await response.json();
      setActiveAttack(scenario.type);
      setSecondsLeft(15);
      setStatusMsg(`Triggered background simulation for ${scenario.name}.`);
    } catch (err: any) {
      console.error("Failed to launch attack:", err);
      setErrorMsg(`Failed to contact IDS Server: ${err.message}. Is main.py running?`);
    }
  };

  const activeScenario = ATTACK_SCENARIOS.find(s => s.type === activeAttack);

  return (
    <div className="min-h-screen bg-[#0b1326] font-sans text-slate-50 selection:bg-[#3b82f6]/30 pb-12">
      {/* Decorative top grid lines */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent opacity-40"></div>

      {/* Navigation & Header */}
      <header className="mx-auto max-w-[1600px] px-6 py-6 md:px-8 flex items-center justify-between border-b border-slate-800/60 bg-slate-900/10 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="flex items-center justify-center h-9 w-9 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-100 hover:border-slate-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100 font-mono flex items-center gap-2">
              <ShieldIcon className="h-5 w-5 text-rose-500 animate-pulse" />
              Attack Simulation Panel
            </h1>
            <p className="text-xs text-slate-500">Launch rule-testing simulations on the EdgeIDS pipeline</p>
          </div>
        </div>

        <button
          onClick={() => router.push("/")}
          className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 border border-cyan-500/20 hover:border-cyan-400/40 bg-cyan-500/5 px-3 py-1.5 rounded-lg transition-all"
        >
          Open Live Dashboard
        </button>
      </header>

      <main className="mx-auto max-w-[1600px] p-6 md:p-8 space-y-8">
        {/* Status Alerts Block */}
        <AnimatePresence mode="wait">
          {activeAttack && activeScenario && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 shadow-[0_0_30px_rgba(244,63,94,0.05)] backdrop-blur-xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-rose-500"></div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)] animate-pulse">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold tracking-wider uppercase font-mono text-rose-300">
                      SIMULATION IN PROGRESS: {activeScenario.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Injecting {activeScenario.protocol} packets into target pipeline. Verifying rule: <span className="font-mono text-slate-300">{activeScenario.triggerRule}</span>.
                    </p>
                  </div>
                </div>

                {/* Timer Display */}
                <div className="flex items-center gap-4 bg-slate-950/40 border border-slate-800/80 px-4 py-2 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">Auto-Stop In</span>
                  <span className="text-2xl font-mono font-bold text-rose-400 w-12 text-center animate-pulse">
                    {secondsLeft}s
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {statusMsg && !activeAttack && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs font-mono text-emerald-400 flex items-center gap-2"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              {statusMsg}
            </motion.div>
          )}

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs font-mono text-rose-400"
            >
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attack Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {ATTACK_SCENARIOS.map((scenario) => {
            const IconComponent = scenario.icon;
            const isSelfRunning = activeAttack === scenario.type;
            const isBlocked = activeAttack !== null && !isSelfRunning;

            return (
              <motion.div
                key={scenario.type}
                className={`flex flex-col justify-between rounded-2xl border p-6 bg-[#020817]/60 shadow-xl backdrop-blur-xl transition-all relative group ${isSelfRunning
                    ? "border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.1)] bg-rose-500/[0.01]"
                    : isBlocked
                      ? "border-slate-800/20 opacity-40 pointer-events-none"
                      : "border-slate-800/60 hover:border-slate-700/80 hover:shadow-[0_0_30px_rgba(59,130,246,0.05)]"
                  }`}
                whileHover={isBlocked ? {} : { y: -2 }}
                transition={{ duration: 0.2 }}
              >
                {/* Glow border background */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent to-slate-900/10 -z-10`}></div>

                <div className="space-y-4">
                  {/* Header info */}
                  <div className="flex items-start justify-between">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-all ${isSelfRunning
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                        : "bg-slate-900/60 border-slate-800 text-slate-300 group-hover:text-cyan-400 group-hover:border-cyan-500/20"
                      }`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-wider uppercase border ${scenario.impactColor}`}>
                      {scenario.impact} Impact
                    </span>
                  </div>

                  {/* Description */}
                  <div>
                    <h2 className="text-base font-bold text-slate-100 group-hover:text-slate-50 transition-colors font-mono">{scenario.name}</h2>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">{scenario.description}</p>
                  </div>

                  {/* Spec Sheet */}
                  <div className="pt-2 space-y-1.5 border-t border-slate-800/30 text-[10px] font-mono text-slate-500">
                    <div className="flex justify-between">
                      <span>Protocol:</span>
                      <span className="text-slate-300 font-semibold">{scenario.protocol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trigger Threshold:</span>
                      <span className="text-slate-300">{scenario.triggerRule.split(" ")[0]}</span>
                    </div>
                  </div>
                </div>

                {/* Launch Button */}
                <div className="mt-6 pt-4 border-t border-slate-800/30">
                  <button
                    disabled={activeAttack !== null}
                    onClick={() => launchAttack(scenario)}
                    className={`w-full py-2.5 px-4 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${isSelfRunning
                        ? "bg-rose-500/20 border-rose-500/30 text-rose-400 cursor-not-allowed animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.1)]"
                        : isBlocked
                          ? "bg-slate-900/40 border-slate-900/20 text-slate-600 cursor-not-allowed"
                          : "bg-slate-950/80 hover:bg-[#3b82f6]/10 border-slate-800 hover:border-[#3b82f6]/40 text-slate-300 hover:text-[#3b82f6] shadow-sm hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                      }`}
                  >
                    {isSelfRunning ? (
                      <>
                        <ShieldAlert className="h-3.5 w-3.5 animate-spin" />
                        Running ({secondsLeft}s)
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 fill-current" />
                        Launch Attack
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
