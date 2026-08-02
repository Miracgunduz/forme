import { useState } from "react";
import { api } from "../api/client";
import type { WeightLog } from "../types";

interface Props {
  userId: number;
  weightLogs: WeightLog[];
  onDeleted: () => void;
}

// Kilo grafiğinin altında, tek tek ölçümleri silebilmek için kompakt bir liste.
// En son 5 kayıt gösterilir (en yeni üstte).
export function WeightLogList({ userId, weightLogs, onDeleted }: Props) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const recent = [...weightLogs].reverse().slice(0, 5);

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await api.deleteWeightLog(userId, id);
      onDeleted();
    } finally {
      setDeletingId(null);
    }
  }

  if (recent.length === 0) return null;

  return (
    <ul className="mt-3 divide-y divide-line text-sm">
      {recent.map((log) => (
        <li key={log.id} className="flex items-center justify-between py-1.5">
          <span className="text-ink-faint">
            {new Date(log.loggedAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" })}
          </span>
          <div className="flex items-center gap-3">
            <span className="font-data font-semibold tabular-nums">{log.weightKg} kg</span>
            <button
              onClick={() => handleDelete(log.id)}
              disabled={deletingId === log.id}
              aria-label="Kilo kaydını sil"
              className="text-ink-faint transition hover:text-red-500 disabled:opacity-40"
            >
              ✕
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
