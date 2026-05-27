// ============================================================================
// COMPONENTE: AppointmentsTable.tsx (Visualizador de Citas en Base de Datos)
//
// Muestra el listado de citas físicas guardadas. Identifica automáticamente
// los registros duplicados y los resalta con alertas visuales.
// ============================================================================

'use client';

import React from 'react';
import { Calendar, Trash2, ShieldAlert, CheckCircle } from 'lucide-react';
import { Appointment } from '@/types';

interface AppointmentsTableProps {
  appointments: Appointment[];
  onDeleteAppointment: (id: number) => Promise<void>;
  loading: boolean;
}

export default function AppointmentsTable({
  appointments,
  onDeleteAppointment,
  loading
}: AppointmentsTableProps) {
  
  // 1. ANÁLISIS DE DUPLICADOS EN TIEMPO REAL
  // Agrupamos citas por médico + fecha + hora para contar cuántas coinciden en el mismo bloque.
  const slotCounts: { [key: string]: number } = {};
  
  appointments.forEach((appt) => {
    const key = `${appt.doctor_id}-${appt.appointment_date}-${appt.appointment_time}`;
    slotCounts[key] = (slotCounts[key] || 0) + 1;
  });

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Citas Guardadas en la Base de Datos</h2>
            <p className="text-sm text-slate-400">Filas físicas existentes en la tabla `appointments`</p>
          </div>
        </div>
        <span className="bg-slate-950 border border-slate-800 text-slate-350 text-xs px-3 py-1.5 rounded-lg font-mono font-bold select-none">
          Total: {appointments.length}
        </span>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl">
          <CheckCircle className="w-8 h-8 text-slate-700 mx-auto mb-2 animate-pulse" />
          <p className="text-sm">No hay citas registradas en la base de datos.</p>
          <p className="text-xs text-slate-550 mt-1">Lanza una simulación concurrentemente o crea una cita simple.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-850">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-850 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="p-4 text-center select-none w-16">ID</th>
                <th className="p-4">Médico / Especialidad</th>
                <th className="p-4">Paciente</th>
                <th className="p-4 w-36">Fecha y Hora</th>
                <th className="p-4 text-center">Estado de Integridad</th>
                <th className="p-4 text-center w-16 select-none">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60 text-sm">
              {appointments.map((appt) => {
                const slotKey = `${appt.doctor_id}-${appt.appointment_date}-${appt.appointment_time}`;
                const isDuplicated = slotCounts[slotKey] > 1;

                return (
                  <tr
                    key={appt.id}
                    className={`transition-colors duration-250 ${
                      isDuplicated
                        ? 'bg-rose-500/5 hover:bg-rose-500/10 text-rose-100'
                        : 'bg-transparent hover:bg-slate-800/25 text-slate-300'
                    }`}
                  >
                    {/* ID FÍSICO */}
                    <td className="p-4 text-center font-mono text-xs text-slate-500 select-all">
                      {appt.id}
                    </td>

                    {/* DOCTOR Y ESPECIALIDAD */}
                    <td className="p-4">
                      <div>
                        <div className="font-bold text-slate-200">
                          {appt.doctors?.name || `Doctor (ID: ${appt.doctor_id})`}
                        </div>
                        <div className="text-xs text-slate-450">
                          {appt.doctors?.specialty || 'General'}
                        </div>
                      </div>
                    </td>

                    {/* PACIENTE */}
                    <td className="p-4 font-semibold">
                      {appt.patients?.name || `Paciente (ID: ${appt.patient_id})`}
                    </td>

                    {/* FECHA Y HORA */}
                    <td className="p-4 font-mono text-xs">
                      <div>{appt.appointment_date}</div>
                      <div className="text-slate-450 mt-0.5">{appt.appointment_time.slice(0, 5)}</div>
                    </td>

                    {/* BADGE DE DUPLICIDAD */}
                    <td className="p-4 text-center">
                      {isDuplicated ? (
                        <div className="inline-flex items-center gap-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] md:text-xs font-bold px-2 py-1 rounded-md animate-pulse">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>⚠️ Duplicado Físico (Conflicto)</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/25 text-emerald-450 text-[10px] md:text-xs font-semibold px-2 py-1 rounded-md">
                          <span>✓ Registro Único</span>
                        </div>
                      )}
                    </td>

                    {/* ELIMINAR */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => onDeleteAppointment(appt.id)}
                        disabled={loading}
                        title="Eliminar cita"
                        className="p-2 text-slate-500 hover:text-rose-400 bg-slate-805 hover:bg-rose-500/5 rounded-lg border border-transparent hover:border-rose-500/15 transition-all disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
