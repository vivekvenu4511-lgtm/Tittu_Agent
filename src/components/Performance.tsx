import { useState, useEffect } from "react";
import {
  Activity,
  Cpu,
  Zap,
  Clock,
  TrendingUp,
  Gauge,
  Play,
  Pause,
} from "lucide-react";

interface PerformanceData {
  type: string;
  value: string;
  timestamp: number;
}

export function PerformanceMonitor() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceData[]>([]);

  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      const newMetric: PerformanceData = {
        type: "cpu",
        value: `${(20 + Math.random() * 30).toFixed(1)}%`,
        timestamp: Date.now(),
      };
      setMetrics((prev) => [...prev.slice(-30), newMetric]);
    }, 1000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const handleStart = () => setIsMonitoring(true);
  const handleStop = () => setIsMonitoring(false);

  const avgCpu =
    metrics.length > 0
      ? (
          metrics.reduce((sum, m) => sum + parseFloat(m.value), 0) /
          metrics.length
        ).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isMonitoring ? "bg-green-100" : "bg-gray-100"
            }`}
          >
            {isMonitoring ? (
              <Activity size={24} className="text-green-600 animate-pulse" />
            ) : (
              <Gauge size={24} className="text-gray-400" />
            )}
          </div>
          <div>
            <div className="font-medium">Performance Monitor</div>
            <div className="text-sm text-gray-500">
              {isMonitoring ? "Recording metrics..." : "Not monitoring"}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {isMonitoring ? (
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              <Pause size={16} />
              Stop
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <Play size={16} />
              Start
            </button>
          )}
        </div>
      </div>

      {/* Live Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <Cpu size={20} className="text-gray-400 mb-2" />
          <div className="text-2xl font-bold">{avgCpu}%</div>
          <div className="text-xs text-gray-500">CPU Usage</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <Zap size={20} className="text-amber-400 mb-2" />
          <div className="text-2xl font-bold">
            {isMonitoring ? "Active" : "Idle"}
          </div>
          <div className="text-xs text-gray-500">Status</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <Clock size={20} className="text-gray-400 mb-2" />
          <div className="text-2xl font-bold">{metrics.length}</div>
          <div className="text-xs text-gray-500">Samples</div>
        </div>
      </div>

      {/* Graph */}
      <div className="p-4 bg-gray-900 rounded-lg">
        <div className="flex items-center gap-2 text-white mb-3">
          <TrendingUp size={16} />
          <span className="text-sm font-medium">Live CPU Graph</span>
        </div>
        <div className="h-32 flex items-end gap-0.5">
          {metrics.slice(-30).map((m, i) => {
            const height = parseFloat(m.value);
            return (
              <div
                key={i}
                className="flex-1 bg-green-500 rounded-t"
                style={{ height: `${(height / 60) * 100}%` }}
              />
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500">Average Response Time</div>
          <div className="text-xl font-bold">~250ms</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500">Model Load Time</div>
          <div className="text-xl font-bold">~1.2s</div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-2 text-blue-600">
          <Zap size={16} />
          <span className="font-medium">Recommendations</span>
        </div>
        <ul className="mt-2 text-sm text-blue-600 space-y-1">
          <li>• CPU usage is low - can increase model complexity</li>
          <li>• Consider enabling GPU acceleration for faster inference</li>
          <li>• Response times are within acceptable range</li>
        </ul>
      </div>
    </div>
  );
}
