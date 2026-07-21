"use client";

import React, { useState, useEffect } from "react";
import { Mechanic } from "@/types/mechanic";
import { MechanicService } from "@/services/mechanic.service";

interface MechanicSelectorProps {
  value: Mechanic | null;
  onChange: (mechanic: Mechanic | null) => void;
  error?: string;
}

export const MechanicSelector: React.FC<MechanicSelectorProps> = ({
  value,
  onChange,
  error,
}) => {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    MechanicService.getMechanics({ limit: 100 })
      .then(({ data }) => setMechanics(data))
      .catch(() => setMechanics([]))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    if (!id) { onChange(null); return; }
    const found = mechanics.find((m) => m.id === id) || null;
    onChange(found);
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        Mekanik
      </label>
      <select
        value={value?.id || ""}
        onChange={handleChange}
        disabled={loading}
        className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-slate-100 disabled:text-slate-400 ${
          error ? "border-rose-400" : "border-slate-200 focus:border-blue-600"
        }`}
      >
        <option value="">{loading ? "Memuat..." : "-- Pilih Mekanik (Opsional) --"}</option>
        {mechanics.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name} {m.skills ? `· ${m.skills}` : ""}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
};
