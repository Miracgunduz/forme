import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { WeightLog } from "../types";

interface Props {
  weightLogs: WeightLog[];
  targetWeightKg?: number;
}

export function WeightLineChart({ weightLogs }: Props) {
  const data = weightLogs.map((log) => ({
    date: new Date(log.loggedAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" }),
    weight: log.weightKg,
  }));

  return (
    <div className="h-56 w-full font-body">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
          <XAxis dataKey="date" fontSize={12} stroke="#A8A29E" />
          <YAxis domain={["dataMin - 2", "dataMax + 2"]} fontSize={12} stroke="#A8A29E" />
          <Tooltip
            formatter={(value: number) => [`${value} kg`, "Kilo"]}
            contentStyle={{ borderRadius: 12, border: "1px solid #F0E6DD", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          />
          <Line type="monotone" dataKey="weight" stroke="#14B8A6" strokeWidth={3} dot={{ r: 4, fill: "#14B8A6" }} activeDot={{ r: 6, fill: "#FF6B4A" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
