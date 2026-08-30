import { Server, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_DEVICES = [
  { id: "10.0.0.1", name: "Core Switch", status: "online", traffic: "1.2 Gbps", risk: "Low" },
  { id: "10.0.0.5", name: "IoT Bridge Alpha", status: "online", traffic: "45 Mbps", risk: "Low" },
  { id: "10.0.0.12", name: "Secure DB Node", status: "online", traffic: "320 Mbps", risk: "Elevated" },
  { id: "10.0.0.45", name: "Ext. Gateway", status: "online", traffic: "890 Mbps", risk: "High" },
  { id: "10.0.0.108", name: "Legacy Sensor Array", status: "offline", traffic: "0 Mbps", risk: "Low" },
];

interface DeviceActivityPanelProps {
  connectedIPs?: string[];
}

export function DeviceActivityPanel({ connectedIPs = [] }: DeviceActivityPanelProps) {
  // Use connected IPs if available, otherwise fallback to mock devices for UI demonstration
  const displayDevices = connectedIPs.length > 0
    ? connectedIPs.map(ip => ({
      id: ip,
      name: "Unknown Device",
      status: "online",
      traffic: "N/A",
      risk: "Unknown"
    }))
    : MOCK_DEVICES;

  return (
    <div className="flex flex-col h-full overflow-hidden rounded-2xl border border-slate-800/60 bg-[#020817]/60 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-slate-800/60 bg-slate-900/40 px-6 py-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-100 uppercase">
          <Server className="h-4 w-4 text-cyan-400" />
          Monitored Nodes
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        <div className="flex flex-col gap-1">
          {displayDevices.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between rounded-xl px-4 py-3 hover:bg-slate-800/30 transition-colors border border-transparent hover:border-slate-800/50"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg border",
                  device.status === "online"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-slate-800/50 border-slate-700/50 text-slate-500"
                )}>
                  {device.status === "online" ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-200">{device.name}</span>
                  <span className="text-[10px] font-mono text-slate-500">{device.id}</span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-xs font-mono text-slate-300">{device.traffic}</span>
                <span className={cn(
                  "text-[10px] uppercase tracking-wider font-bold",
                  device.risk === "High" ? "text-rose-400" :
                    device.risk === "Elevated" ? "text-amber-400" :
                      "text-slate-500"
                )}>
                  {device.risk} RISK
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
