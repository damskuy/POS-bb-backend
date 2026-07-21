"use client";

import React, { useState, useEffect, useRef } from "react";
import { Vehicle } from "@/types/vehicle";
import { VehicleService } from "@/services/vehicle.service";

interface VehicleSelectorProps {
  customerId: number | null;
  value: Vehicle | null;
  onChange: (vehicle: Vehicle | null) => void;
  error?: string;
}

export const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  customerId,
  value,
  onChange,
  error,
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customerId) {
      setVehicles([]);
      onChange(null);
      return;
    }
    setLoading(true);
    VehicleService.getVehicles({ customerId, limit: 100 })
      .then(({ data }) => setVehicles(data))
      .catch(() => setVehicles([]))
      .finally(() => setLoading(false));
  }, [customerId]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    if (!id) { onChange(null); return; }
    const found = vehicles.find((v) => v.id === id) || null;
    onChange(found);
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        Kendaraan <span className="text-rose-500">*</span>
      </label>
      <select
        value={value?.id || ""}
        onChange={handleChange}
        disabled={!customerId || loading}
        className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-slate-100 disabled:text-slate-400 ${
          error ? "border-rose-400" : "border-slate-200 focus:border-blue-600"
        }`}
      >
        <option value="">
          {!customerId ? "Pilih customer terlebih dahulu" : loading ? "Memuat kendaraan..." : vehicles.length === 0 ? "Tidak ada kendaraan" : "-- Pilih Kendaraan --"}
        </option>
        {vehicles.map((v) => (
          <option key={v.id} value={v.id}>
            {v.plateNumber} — {v.brand} {v.model} {v.year ? `(${v.year})` : ""}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
};
