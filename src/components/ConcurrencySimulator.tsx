// ============================================================================
// COMPONENTE: ConcurrencySimulator.tsx (Disparador de Concurrencia)
//
// Permite al estudiante seleccionar los parámetros de la simulación
// y gatillar la ejecución en paralelo de múltiples peticiones usando Promise.all.
// ============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import { Play, Users, Calendar, Clock, Stethoscope, Loader2 } from 'lucide-react';
import { Doctor, Patient, LogEntry, SimulationMetrics } from '@/types';
import { supabase } from '@/lib/supabase';

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
  onRefreshData
}: ConcurrencySimulatorProps) {
  const [selectedDoctorId, setSelectedDoctorId] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>('2026-05-28');
  const [selectedTime, setSelectedTime] = useState<string>('10:00:00');
  const [concurrencyLevel, setConcurrencyLevel] = useState<number>(5);
  const [simulating, setSimulating] = useState<boolean>(false);

  // Seleccionar el primer médico por defecto cuando se carguen
  useEffect(() => {
    if (doctors.length > 0 && selectedDoctorId === 0) {
      setSelectedDoctorId(doctors[0].id);
    }
  }, [doctors, selectedDoctorId]);

  const handleSimulate = async () => {
    if (doctors.length === 0 || patients.length === 0) return;
    
    setSimulating(true);
    onSimulationStart();

    const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);
    const doctorName = selectedDoctor ? selectedDoctor.name : 'Doctor';

    // 1. GENERAR ARREGLO DE PROMESAS (Peticiones simultáneas)
    const requests = [];
    const startTime = performance.now();

    for (let i = 0; i < concurrencyLevel; i++) {
      // Tomamos un paciente aleatorio de la lista semilla
      const randomPatient = patients[Math.floor(Math.random() * patients.length)];
      
      const payload = {
        doctorId: selectedDoctorId,
        patientId: randomPatient.id,
        date: selectedDate,
        time: selectedTime,
        requestId: `Req-${i + 1}`,
        doctorName: doctorName,
        delayMs: 1500 // Delay fijo de 1.5s para la ventana de vulnerabilidad
      };

      requests.push(
        fetch('/api/book-appointment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      );
    }

    // 2. DISPARO CONCURRENTE REAL (Promise.all)
    // Explicación Académica:
    // Promise.all lanza todas las peticiones a la red en paralelo casi de forma instantánea.
    // Esto fuerza a que el backend de Next.js las reciba y procese simultáneamente en hilos separados,
    // produciendo la race condition perfecta en el paso de validación.
    let responses: Response[] = [];
    try {
      responses = await Promise.all(requests);
    } catch (error) {
      console.error('Error lanzando peticiones concurrentes:', error);
    }

    const endTime = performance.now();
    const totalExecutionTime = Math.round(endTime - startTime);

    // 3. PARSEAR RESPUESTAS JSON
    const results = await Promise.all(
      responses.map(async (res) => {
        try {
          return await res.json();
        } catch {
          return { success: false, logs: [], error: 'Fallo al parsear respuesta' };
        }
      })
    );

    // 4. APLANAR Y RECOPILAR LOGS DE CADA PETICIÓN
    let rawLogs: LogEntry[] = [];
    results.forEach((r) => {
      if (r.logs && Array.isArray(r.logs)) {
        rawLogs = [...rawLogs, ...r.logs];
      }
    });

    // Ordenar los logs cronológicamente por su timestamp (con milisegundos)
    // para mostrar la línea de tiempo real de los procesos en la terminal.
    const sortedLogs = rawLogs.sort((a, b) => a.time.localeCompare(b.time));

    // 5. MEDIR INCONSISTENCIAS DIRECTAMENTE EN LA BASE DE DATOS
    // Para evidenciar la race condition, no confiamos en las respuestas de memoria del frontend.
    // Consultamos físicamente a PostgreSQL cuántas citas se guardaron para este médico en este slot.
    await new Promise((resolve) => setTimeout(resolve, 300)); // Pequeña espera para asegurar persistencia en Supabase
    
    const { data: physicalAppointments, error: queryError } = await supabase
      .from('appointments')
      .select('id')
      .eq('doctor_id', selectedDoctorId)
      .eq('appointment_date', selectedDate)
      .eq('appointment_time', selectedTime);

    if (queryError) {
      console.error('Error al verificar duplicados físicos:', queryError);
    }

    const totalPhysicalRows = physicalAppointments ? physicalAppointments.length : 0;
    
    // Si hay más de 1 registro para el mismo médico, fecha y hora, ¡hay duplicados!
    const duplicateCount = totalPhysicalRows > 1 ? totalPhysicalRows - 1 : 0;
    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;
    
    // Métricas calculadas
    const metrics: SimulationMetrics = {
      totalRequests: concurrencyLevel,
      createdCount: totalPhysicalRows,
      duplicateCount: duplicateCount,
      duplicatePercent: Math.round((duplicateCount / concurrencyLevel) * 100),
      avgTimeMs: Math.round(totalExecutionTime / concurrencyLevel),
      successCount,
      failedCount
    };

    // 6. PERSISTIR EL EXPERIMENTO EN EL HISTORIAL
    try {
      await fetch('/api/simulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_number: testNumber,
          concurrent_requests: concurrencyLevel,
          duplicates_generated: duplicateCount,
          execution_time_ms: totalExecutionTime,
          mode: hasConstraint ? 'Corregido' : 'Vulnerable',
          total_requests: concurrencyLevel,
          successful_appointments: totalPhysicalRows
        })
      });
    } catch (saveError) {
      console.error('Error al guardar simulación:', saveError);
    }

    // 7. INFORMAR AL PADRE Y REDIBUJAR
    await onRefreshData();
    onSimulationComplete(metrics, sortedLogs);
    setSimulating(false);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">Simulador de Concurrencia</h2>
          <p className="text-sm text-slate-400">Gatillador de Peticiones en Paralelo</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* SELECTOR DE MÉDICO */}
        <div>
          <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-indigo-400" />
            Médico Objetivo
          </label>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(Number(e.target.value))}
            disabled={simulating}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-200 text-sm focus:border-indigo-500 focus:outline-none transition-all disabled:opacity-50"
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.specialty})
              </option>
            ))}
          </select>
        </div>

        {/* SELECTOR DE FECHA Y HORA */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              Fecha
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              disabled={simulating}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:border-indigo-500 focus:outline-none transition-all disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Hora
            </label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              disabled={simulating}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:border-indigo-500 focus:outline-none transition-all disabled:opacity-50"
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

        {/* SELECTOR DE CANTIDAD DE SOLICITUDES CONCURRENTES */}
        <div>
          <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            Solicitudes Concurrentes Simultáneas
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[5, 10, 20].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setConcurrencyLevel(num)}
                disabled={simulating}
                className={`py-2 px-3 rounded-lg text-xs md:text-sm font-semibold border transition-all ${
                  concurrencyLevel === num
                    ? 'bg-indigo-650 text-white border-indigo-500 shadow-md shadow-indigo-900/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                } disabled:opacity-50`}
              >
                {num} Requests
              </button>
            ))}
          </div>
        </div>

        {/* BOTÓN DISPARADOR DE SIMULACIÓN */}
        <div className="pt-2">
          <button
            onClick={handleSimulate}
            disabled={simulating || doctors.length === 0}
            className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
              simulating
                ? 'bg-indigo-700/50 text-indigo-300 border border-indigo-600/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20 hover:shadow-indigo-950/30'
            } disabled:opacity-50`}
          >
            {simulating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-indigo-300" />
                <span>Ejecutando Promise.all (Concurrente)...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-emerald-300 fill-emerald-300" />
                <span>Simular Race Condition</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
