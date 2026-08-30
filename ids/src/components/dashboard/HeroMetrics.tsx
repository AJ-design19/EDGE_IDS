import { Activity, ShieldAlert, Zap, Cpu, Network, Server } from "lucide-react";
import { motion } from "framer-motion";
import { IDSStats } from "@/hooks/useIDSWebSocket";
import { cn } from "@/lib/utils";

interface HeroMetricsProps {
  stats: IDSStats;
}

export function HeroMetrics({ stats }: HeroMetricsProps) {
  const cards = [
    {
      title: "Total Packets",
      value: stats.totalPackets.toLocaleString(),
      icon: Network,
      color: "text-[#3b82f6]",
      bgColor: "bg-[#3b82f6]/10",
      borderColor: "border-[#1e293b]",
    },
    {
      title: "Active Flows",
      value: stats.activeFlows.toLocaleString(),
      icon: Activity,
      color: "text-[#a3a6ff]",
      bgColor: "bg-[#9396ff]/10",
      borderColor: "border-[#1e293b]",
    },
    {
      title: "Attacks Detected",
      value: stats.attacksDetected.toLocaleString(),
      icon: ShieldAlert,
      color: stats.attacksDetected > 0 ? "text-[#ffb4ab]" : "text-[#10b981]",
      bgColor: stats.attacksDetected > 0 ? "bg-[#ffb4ab]/10" : "bg-[#10b981]/10",
      borderColor: stats.attacksDetected > 0 ? "border-[#93000a]" : "border-[#1e293b]",
      pulse: stats.attacksDetected > 0,
    },
    {
      title: "Current Threat Level",
      value: stats.currentThreatLevel,
      icon: Zap,
      color:
        stats.currentThreatLevel === "High" ? "text-[#ffb4ab]" :
          stats.currentThreatLevel === "Elevated" ? "text-[#f59e0b]" :
            "text-[#10b981]",
      bgColor:
        stats.currentThreatLevel === "High" ? "bg-[#ffb4ab]/10" :
          stats.currentThreatLevel === "Elevated" ? "bg-[#f59e0b]/10" :
            "bg-[#10b981]/10",
      borderColor:
        stats.currentThreatLevel === "High" ? "border-[#93000a]" :
          stats.currentThreatLevel === "Elevated" ? "border-[#f59e0b]/50" :
            "border-[#1e293b]",
    },
    {
      title: "Avg Latency",
      value: `${stats.avgLatency.toFixed(1)} ms`,
      icon: Cpu,
      color: "text-[#4edea3]",
      bgColor: "bg-[#4edea3]/10",
      borderColor: "border-[#1e293b]",
    },
    {
      title: "Connected Devices",
      value: stats.connectedIPs?.length.toString(), // Pulled from unique IPs tracked in WebSocket hook
      icon: Server,
      color: "text-[#dae2fd]",
      bgColor: "bg-[#dae2fd]/10",
      borderColor: "border-[#1e293b]",
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, idx) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1, duration: 0.4 }}
          className={cn(
            "relative overflow-hidden rounded-xl border bg-[#0f172a] p-5 backdrop-blur-xl transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.5)]",
            card.borderColor
          )}
        >
          {card.pulse && (
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#ffb4ab]/10 blur-2xl" />
          )}

          <div className="flex flex-col gap-3 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-widest text-[#8c909f] uppercase">{card.title}</span>
              <div className={cn("rounded-lg p-2 flex items-center justify-center", card.bgColor)}>
                <card.icon className={cn("h-4 w-4", card.color)} />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <motion.span
                key={card.value}
                initial={{ opacity: 0.5, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn("text-2xl font-mono tracking-tight", card.color)}
              >
                {card.value}
              </motion.span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
