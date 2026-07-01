"use client";

import React, { useState, useEffect } from "react";
import {
  Play,
  Users,
  Calendar,
  Clock,
  Stethoscope,
  Loader2,
} from "lucide-react";
import { Doctor, Patient, LogEntry, SimulationMetrics } from "@/types";
import { supabase } from "@/lib/supabase";

interface ConcurrencySimulatorProps {
  doctors: Doctor[];
  patients: Patient[];
  hasConstraint: boolean;
  testNumber: number;
  onSimulationStart: () => void;
  onSimulationComplete: (metrics: SimulationMetrics, logs: LogEntry[]) => void;
  onRefreshData: () => Promise<void>;
}

export default function ConcurrencySimulator({
  doctors,
  patients,
  hasConstraint,
  testNumber,
  onSimulationStart,
  onSimulationComplete,
  onRefreshData,
}: ConcurrencySimulatorProps) {
  const [selectedDoctorId, setSelectedDoctorId] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>("2026-05-28");
  const [selectedTime, setSelectedTime] = useState<string>("10:00:00");
  const [concurrencyLevel, setConcurrencyLevel] = useState<number>(5);
  const [simulating, setSimulating] = useState<boolean>(false);

  useEffect(() => {
    if (doctors.length > 0 && selectedDoctorId === 0) {
      setSelectedDoctorId(doctors[0].id);
    }
  }, [doctors, selectedDoctorId]);

  const handleSimulate = async () => {
    if (doctors.length === 0 || patients.length === 0) return;

    const activeConcurrency = concurrencyLevel < 1 ? 1 : concurrencyLevel;
    if (concurrencyLevel < 1) {
      setConcurrencyLevel(1);
    }

    setSimulating(true);
    onSimulationStart();

    const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);
    const doctorName = selectedDoctor ? selectedDoctor.name : "Doctor";

    const requests = [];
    const startTime = performance.now();

    for (let i = 0; i < activeConcurrency; i++) {
      const randomPatient =
        patients[Math.floor(Math.random() * patients.length)];

      const payload = {
        doctorId: selectedDoctorId,
        patientId: randomPatient.id,
        date: selectedDate,
        time: selectedTime,
        requestId: `Req-${i + 1}`,
        doctorName: doctorName,
        delayMs: 1500,
      };

      requests.push(
        fetch("/api/book-appointment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      );
    }

    let responses: Response[] = [];
    try {
      responses = await Promise.all(requests);
    } catch (error) {
      console.error("Error lanzando peticiones concurrentes:", error);
    }

    const endTime = performance.now();
    const totalExecutionTime = Math.round(endTime - startTime);

    const results = await Promise.all(
      responses.map(async (res) => {
        try {
          return await res.json();
        } catch {
          return {
            success: false,
            logs: [],
            error: "Fallo al parsear respuesta",
          };
        }
      }),
    );

    let rawLogs: LogEntry[] = [];
    results.forEach((r) => {
      if (r.logs && Array.isArray(r.logs)) {
        rawLogs = [...rawLogs, ...r.logs];
      }
    });

    const sortedLogs = rawLogs.sort((a, b) => a.time.localeCompare(b.time));

    await new Promise((resolve) => setTimeout(resolve, 300));

    const { data: physicalAppointments, error: queryError } = await supabase
      .from("appointments")
      .select("id")
      .eq("doctor_id", selectedDoctorId)
      .eq("appointment_date", selectedDate)
      .eq("appointment_time", selectedTime);

    if (queryError) {
      console.error("Error al verificar duplicados fisicos:", queryError);
    }

    const totalPhysicalRows = physicalAppointments
      ? physicalAppointments.length
      : 0;

    const duplicateCount = totalPhysicalRows > 1 ? totalPhysicalRows - 1 : 0;
    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    const metrics: SimulationMetrics = {
      totalRequests: activeConcurrency,
      createdCount: totalPhysicalRows,
      duplicateCount: duplicateCount,
      duplicatePercent: Math.round((duplicateCount / activeConcurrency) * 100),
      avgTimeMs: Math.round(totalExecutionTime / activeConcurrency),
      successCount,
      failedCount,
    };

    try {
      await fetch("/api/simulations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          test_number: testNumber,
          concurrent_requests: activeConcurrency,
          duplicates_generated: duplicateCount,
          execution_time_ms: totalExecutionTime,
          mode: hasConstraint ? "Corregido" : "Vulnerable",
          total_requests: activeConcurrency,
          successful_appointments: totalPhysicalRows,
        }),
      });
    } catch (saveError) {
      console.error("Error al guardar simulacion:", saveError);
    }

    await onRefreshData();
    onSimulationComplete(metrics, sortedLogs);
    setSimulating(false);
  };

  return (
    <div className="bg-[#252526] border border-[#3c3c3c] p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-[#2d2d2d] text-[#569cd6]">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#cccccc]">
            Test de Concurrencia
          </h2>
          <p className="text-xs text-[#858585]">
            Gatillador de Peticiones en Paralelo
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#858585] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-[#569cd6]" />
            Medico Objetivo
          </label>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(Number(e.target.value))}
            disabled={simulating}
            className="w-full bg-[#3c3c3c] border border-[#1e1e1e] px-3 py-2 text-[#cccccc] text-sm focus:border-[#007acc] focus:outline-none transition-all disabled:opacity-50"
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.specialty})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#858585] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#569cd6]" />
              Fecha
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              disabled={simulating}
              className="w-full bg-[#3c3c3c] border border-[#1e1e1e] px-3 py-2 text-[#cccccc] text-sm focus:border-[#007acc] focus:outline-none transition-all disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#858585] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#569cd6]" />
              Hora
            </label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              disabled={simulating}
              className="w-full bg-[#3c3c3c] border border-[#1e1e1e] px-3 py-2 text-[#cccccc] text-sm focus:border-[#007acc] focus:outline-none transition-all disabled:opacity-50"
            >
              <option value="09:00:00">09:00 AM</option>
              <option value="10:00:00">10:00 AM</option>
              <option value="11:00:00">11:00 AM</option>
              <option value="12:00:00">12:00 PM</option>
              <option value="15:00:00">03:00 PM</option>
              <option value="16:00:00">04:00 PM</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#858585] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#569cd6]" />
            Cantidad de Solicitudes Concurrentes
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setConcurrencyLevel(1)}
              disabled={simulating}
              className={`py-2.5 px-3 rounded text-xs font-semibold border transition-all col-span-1 flex items-center justify-center gap-1.5 ${
                concurrencyLevel === 1
                  ? "bg-[#0e639c] border-[#007acc] text-white"
                  : "bg-[#3c3c3c] border-[#1e1e1e] text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d2e]"
              } disabled:opacity-50`}
            >
              <span>1 Solicitud</span>
            </button>

            <div className="relative col-span-2 flex items-center">
              <input
                type="number"
                min={1}
                max={100}
                value={concurrencyLevel === 0 ? "" : concurrencyLevel}
                onChange={(e) => {
                  const val =
                    e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                  if (val === 0) {
                    setConcurrencyLevel(0);
                  } else if (!isNaN(val)) {
                    setConcurrencyLevel(Math.max(1, Math.min(100, val)));
                  }
                }}
                onBlur={() => {
                  if (concurrencyLevel < 1) {
                    setConcurrencyLevel(5);
                  }
                }}
                disabled={simulating}
                className={`w-full bg-[#3c3c3c] border rounded pl-3 pr-24 py-2.5 text-[#cccccc] text-xs focus:border-[#007acc] focus:outline-none transition-all disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  concurrencyLevel > 1
                    ? "border-[#007acc]/50"
                    : "border-[#1e1e1e]"
                }`}
                placeholder="Personalizado"
              />
              <span className="absolute right-3 text-[10px] font-semibold text-[#858585] pointer-events-none select-none uppercase tracking-wider">
                Solicitudes
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleSimulate}
            disabled={simulating || doctors.length === 0}
            className={`w-full py-3 font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 ${
              simulating
                ? "bg-[#2d2d2d] text-[#858585] border border-[#3c3c3c]"
                : "bg-[#0e639c] hover:bg-[#1177bb] text-white"
            } disabled:opacity-50`}
          >
            {simulating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#569cd6]" />
                <span>Ejecutando Promise.all (Concurrente)...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Simular Race Condition</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
