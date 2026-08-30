import { ShieldAlert, Crosshair, Zap, Activity } from "lucide-react";
import { IDSEvent } from "@/hooks/useIDSWebSocket";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

const THREAT_LABELS: Record<string, string> = {
  PORT_SCAN_VERTICAL: "Vertical Port Scan",
  PORT_SCAN_HORIZONTAL: "Horizontal Port Scan",
  PORT_SCAN_COMPOSITE: "Composite Port Scan",
  SYN_FLOOD: "SYN Flood Alert",
  VOLUMETRIC_FLOOD: "Volumetric Flood",
  LAND_ATTACK: "Land Attack Alert",
  STEALTH_SCAN: "Stealth Scan Alert",
  ICMP_FLOOD: "ICMP Flood Alert"
};

interface ThreatIntelligencePanelProps {
  events: IDSEvent[];
}

export function ThreatIntelligencePanel({ events }: ThreatIntelligencePanelProps) {
  // Calculate top suspicious IPs
  const topAttackers = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach(e => {
      if (e.prob > 0.6 || e.rule_triggered === true) {
        counts[e.src] = (counts[e.src] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [events]);

  const recentCriticals = useMemo(() => {
    return events.filter(e => e.prob > 0.8 || e.rule_triggered === true).slice(0, 3);
  }, [events]);

  return (
    <div className="flex flex-col h-full overflow-hidden rounded-xl border border-[#1e293b] bg-[#0b1326]/80 shadow-[0_0_30px_rgba(59,130,246,0.05)] backdrop-blur-xl relative">
      {/* Decorative neon top border */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent opacity-50"></div>
      
      <div className="flex items-center justify-between border-b border-[#1e293b] bg-[#0f172a]/50 px-6 py-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-widest text-[#dae2fd] uppercase font-mono">
          <Crosshair className="h-4 w-4 text-[#3b82f6]" />
          Threat Intelligence
        </h2>
        <div className="flex items-center gap-2">
           <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]"></span>
          </span>
          <span className="text-[10px] text-[#10b981] font-mono tracking-widest uppercase">Live</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">
        
        {/* Top Attackers Section */}
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#8c909f] mb-4">Top Threat Actors</h3>
          {topAttackers.length === 0 ? (
            <div className="text-xs text-[#424754] font-mono">No active threats tracked.</div>
          ) : (
            <div className="space-y-3">
              {topAttackers.map(([ip, count], idx) => (
                <div key={ip} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-[#424754] w-4">{idx + 1}.</span>
                    <span className="text-sm font-mono text-[#dae2fd] group-hover:text-[#adc6ff] transition-colors">{ip}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-16 bg-[#171f33] rounded-full overflow-hidden">
                       <div className="h-full bg-[#3b82f6]" style={{ width: `${Math.min(count * 10, 100)}%` }}></div>
                    </div>
                    <span className="text-[10px] font-mono text-[#8c909f] w-12 text-right">
                      {count} REQ
                    </span>
                  </div>
                </div>
              ))}
              <div className="text-[9px] text-[#424754] font-mono mt-1 border-t border-[#1e293b]/30 pt-2 italic">
                * Note: 1 ML request (REQ) represents 10 accumulated network packets.
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-[#1e293b] to-transparent"></div>

        {/* Recent Criticals Section */}
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#8c909f] mb-4">Critical Signatures</h3>
          {recentCriticals.length === 0 ? (
             <div className="text-xs text-[#424754] font-mono">System secure. No critical signatures.</div>
          ) : (
            <div className="space-y-3">
              {recentCriticals.map((evt, idx) => (
                <div key={idx} className="relative rounded-lg border border-[#93000a] bg-[#131b2e] p-4 overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#ffb4ab] shadow-[0_0_10px_#ffb4ab]"></div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 text-[#ffb4ab]">
                      <Zap className="h-4 w-4" />
                      <span className="text-[10px] font-bold tracking-wider uppercase">
                        {evt.rule_triggered && evt.threat_type
                          ? THREAT_LABELS[evt.threat_type] || evt.threat_type
                          : "High Prob. Attack"}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#8c909f]">
                       {new Date(evt.timestamp * 1000).toLocaleTimeString([], { hour12: false })}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-[#060e20] p-2 rounded border border-[#1e293b]">
                     <div className="flex flex-col">
                       <span className="text-[9px] text-[#424754] mb-1">SRC</span>
                       <span className="text-[#dae2fd]">{evt.src}</span>
                     </div>
                     <div className="flex flex-col text-right">
                       <span className="text-[9px] text-[#424754] mb-1">DST</span>
                       <span className="text-[#dae2fd]">{evt.dst}</span>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
