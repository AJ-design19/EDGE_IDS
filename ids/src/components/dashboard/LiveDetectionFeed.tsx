import { ShieldCheck, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { IDSEvent } from "@/hooks/useIDSWebSocket";
import { cn } from "@/lib/utils";

const THREAT_LABELS: Record<string, string> = {
  PORT_SCAN_VERTICAL: "Port Scan (V)",
  PORT_SCAN_HORIZONTAL: "Port Scan (H)",
  PORT_SCAN_COMPOSITE: "Port Scan (C)",
  SYN_FLOOD: "SYN Flood",
  VOLUMETRIC_FLOOD: "Vol. Flood",
  LAND_ATTACK: "Land Attack",
  STEALTH_SCAN: "Stealth Scan",
  ICMP_FLOOD: "ICMP Flood"
};

interface LiveDetectionFeedProps {
  events: IDSEvent[];
}

export function LiveDetectionFeed({ events }: LiveDetectionFeedProps) {
  return (
    <div className="flex h-[600px] flex-col overflow-hidden rounded-2xl border border-slate-800/60 bg-[#020817]/60 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-slate-800/60 bg-slate-900/40 px-6 py-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-100 uppercase">
          <ShieldCheck className="h-4 w-4 text-indigo-400" />
          Live Event Feed
        </h2>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
          </span>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Receiving</span>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-6 gap-4 border-b border-slate-800/60 bg-slate-950/50 px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
        <div className="col-span-1">Time</div>
        <div className="col-span-1">Source IP</div>
        <div className="col-span-1">Dest IP</div>
        <div className="col-span-1">Proto</div>
        <div className="col-span-1">Risk</div>
        <div className="col-span-1 text-right">Latency</div>
      </div>

      {/* Virtualized/Scrollable Body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {events.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-slate-500">
            <ShieldCheck className="mb-4 h-12 w-12 opacity-20" />
            <p className="font-mono text-sm">Awaiting Network Traffic...</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {events.map((evt, idx) => {
              const isHighRisk = evt.prob > 0.7 || evt.rule_triggered === true;
              const isMediumRisk = !isHighRisk && evt.prob > 0.4 && evt.prob <= 0.7;

              return (
                <motion.div
                  key={`${evt.timestamp}-${evt.src}-${evt.dst}-${idx}`}
                  initial={{ opacity: 0, x: -20, backgroundColor: isHighRisk ? 'rgba(244, 63, 94, 0.2)' : 'transparent' }}
                  animate={{ opacity: 1, x: 0, backgroundColor: 'transparent' }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "grid grid-cols-6 gap-4 border-b border-slate-800/30 px-6 py-3 text-xs font-mono transition-colors hover:bg-slate-800/20 items-center",
                    isHighRisk && "bg-rose-500/[0.02]"
                  )}
                >
                  <div className="col-span-1 text-slate-500">
                    {new Date(evt.timestamp * 1000).toLocaleTimeString([], {
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      fractionalSecondDigits: 2
                    })}
                  </div>
                  <div className="col-span-1 text-slate-300">{evt.src}</div>
                  <div className="col-span-1 text-slate-300">{evt.dst}</div>
                  <div className="col-span-1">
                    <span className="inline-flex items-center rounded bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-700/50">
                      {evt.proto}
                    </span>
                  </div>
                  <div className="col-span-1 flex items-center gap-2">
                    {isHighRisk && <AlertTriangle className="h-3 w-3 text-rose-500" />}
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider",
                        isHighRisk ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]" :
                          isMediumRisk ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                            "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      )}
                    >
                      {evt.rule_triggered && evt.threat_type
                        ? THREAT_LABELS[evt.threat_type] || evt.threat_type
                        : `${(evt.prob * 100).toFixed(1)}%`}
                    </span>
                  </div>
                  <div className="col-span-1 text-right text-slate-500">
                    {evt.latency.toFixed(2)}ms
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
