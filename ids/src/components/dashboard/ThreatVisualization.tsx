import { Activity } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { IDSEvent } from "@/hooks/useIDSWebSocket";

interface ThreatVisualizationProps {
  events: IDSEvent[];
}

export function ThreatVisualization({ events }: ThreatVisualizationProps) {
  // Take last 30 events, chronological order
  const chartData = [...events].slice(0, 30).reverse().map(evt => ({
    time: new Date(evt.timestamp * 1000).toLocaleTimeString([], { hour12: false, second: '2-digit', minute: '2-digit', hour: '2-digit' }),
    risk: evt.prob * 100,
  }));

  return (
    <div className="flex flex-col h-[350px] overflow-hidden rounded-2xl border border-slate-800/60 bg-[#020817]/60 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-slate-800/60 bg-slate-900/40 px-6 py-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-100 uppercase">
          <Activity className="h-4 w-4 text-indigo-400" />
          Threat Probability Trend
        </h2>
      </div>

      <div className="flex-1 p-6">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  backdropFilter: 'blur(8px)',
                  borderColor: '#1e293b',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '12px',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                }}
                itemStyle={{ color: '#f8fafc' }}
                cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              <Area
                type="monotone"
                dataKey="risk"
                stroke="#f43f5e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRisk)"
                name="Risk (%)"
                isAnimationActive={false} // Disable animation for live data to avoid layout jumping
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-slate-500">
            <Activity className="mb-3 h-8 w-8 opacity-20" />
            <p className="font-mono text-xs">Waiting for data...</p>
          </div>
        )}
      </div>
    </div>
  );
}
