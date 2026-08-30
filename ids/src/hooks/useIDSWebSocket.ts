import { useState, useEffect, useRef, useCallback } from "react";

export interface IDSEvent {
  timestamp: number;
  src: string;
  dst: string;
  proto: string;
  prob: number;
  latency: number;
  rule_triggered?: boolean;
  threat_type?: "PORT_SCAN_VERTICAL" | "PORT_SCAN_HORIZONTAL" | "PORT_SCAN_COMPOSITE" | "SYN_FLOOD" | "VOLUMETRIC_FLOOD" | "LAND_ATTACK" | "STEALTH_SCAN" | "ICMP_FLOOD";
}

export interface IDSStats {
  totalPackets: number;
  activeFlows: number;
  attacksDetected: number;
  currentThreatLevel: "Low" | "Elevated" | "High" | "Critical";
  avgLatency: number;
  connectedIPs: string[];
}

const MAX_EVENTS = 200;

const THREAT_SEVERITY: Record<string, number> = {
  "Low": 0,
  "Elevated": 1,
  "High": 2,
  "Critical": 3
};

export function useIDSWebSocket(url: string) {
  const [events, setEvents] = useState<IDSEvent[]>([]);
  const [threatEvents, setThreatEvents] = useState<IDSEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState<IDSStats>({
    totalPackets: 0,
    activeFlows: 0,
    attacksDetected: 0,
    currentThreatLevel: "Low",
    avgLatency: 0,
    connectedIPs: [],
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep track of counts manually to avoid dependency loops in setState
  const statsRef = useRef<IDSStats>({
    totalPackets: 0,
    activeFlows: 0,
    attacksDetected: 0,
    currentThreatLevel: "Low",
    avgLatency: 0,
    connectedIPs: [],
  });

  const ipSetRef = useRef<Set<string>>(new Set());

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (messageEvent) => {
        try {
          const data: IDSEvent = JSON.parse(messageEvent.data);
          // console.log("Received IDS event:", data);

          setEvents((prev) => {
            const newEvents = [data, ...prev];
            if (newEvents.length > MAX_EVENTS) {
              return newEvents.slice(0, MAX_EVENTS);
            }
            return newEvents;
          });

          // Update stats based on incoming event
          const isAttack = data.prob >= 0.7 || data.rule_triggered === true;
          const incomingThreatLevel = data.prob >= 0.9
            ? "Critical"
            : isAttack
              ? "High"
              : data.prob > 0.4
                ? "Elevated"
                : "Low";

          const currentLevel = statsRef.current.currentThreatLevel || "Low";
          const newThreatLevel = THREAT_SEVERITY[incomingThreatLevel] > THREAT_SEVERITY[currentLevel]
            ? incomingThreatLevel
            : currentLevel;

          if (data.src && data.src.startsWith("192.168.50.") && !ipSetRef.current.has(data.src)) {
            ipSetRef.current.add(data.src);
          }
          if (data.dst && data.dst.startsWith("192.168.50.") && !ipSetRef.current.has(data.dst)) {
            ipSetRef.current.add(data.dst);
          }

          statsRef.current = {
            totalPackets: statsRef.current.totalPackets + 1,
            activeFlows: Math.min(statsRef.current.activeFlows + Math.floor(Math.random() * 3), 150), // Simulate flows
            attacksDetected: statsRef.current.attacksDetected + (isAttack ? 1 : 0),
            currentThreatLevel: newThreatLevel,
            // rolling average latency
            avgLatency: statsRef.current.avgLatency === 0
              ? data.latency
              : (statsRef.current.avgLatency * 0.9) + (data.latency * 0.1),
            connectedIPs: Array.from(ipSetRef.current)
          };

          setStats({ ...statsRef.current });

          if (data.prob > 0.4 || data.rule_triggered === true) {
            setThreatEvents((prev) => [data, ...prev]);
          }

        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = () => {
        ws.close(); // trigger onclose
      };

    } catch (e) {
      console.error("WebSocket connection error:", e);
    }
  }, [url]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { events, isConnected, stats, threatEvents };
}
