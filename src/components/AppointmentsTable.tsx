"use client";

import React from "react";
import { Calendar, Trash2, ShieldAlert, CheckCircle } from "lucide-react";
import { Appointment } from "@/types";

interface AppointmentsTableProps {
  appointments: Appointment[];
  onDeleteAppointment: (id: number) => Promise<void>;
  loading: boolean;
}

export default function AppointmentsTable({
  appointments,
  onDeleteAppointment,
  loading,
}: AppointmentsTableProps) {
  const slotCounts: { [key: string]: number } = {};

  appointments.forEach((appt) => {
    const key = `${appt.doctor_id}-${appt.appointment_date}-${appt.appointment_time}`;
    slotCounts[key] = (slotCounts[key] || 0) + 1;
  });

  return (
    <div className="bg-[#252526] border border-[#3c3c3c] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#2d2d2d] text-[#569cd6]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#cccccc]">
              Citas Guardadas en la Base de Datos
            </h2>
            <p className="text-xs text-[#858585]">
              Filas fisicas existentes en la tabla appointments
            </p>
          </div>
        </div>
        <span className="bg-[#2d2d2d] border border-[#3c3c3c] text-[#858585] text-xs px-3 py-1.5 font-mono font-bold select-none">
          Total: {appointments.length}
        </span>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-12 text-[#858585] border border-dashed border-[#3c3c3c]">
          <CheckCircle className="w-8 h-8 text-[#6e6e6e] mx-auto mb-2" />
          <p className="text-sm">
            No hay citas registradas en la base de datos.
          </p>
          <p className="text-xs text-[#858585] mt-1">
            Lanza una simulacion concurrentemente o crea una cita simple.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-[#3c3c3c]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#2d2d2d] border-b border-[#3c3c3c] text-xs font-semibold text-[#858585] uppercase tracking-wider">
                <th className="p-3 text-center select-none w-16">ID</th>
                <th className="p-3">Medico / Especialidad</th>
                <th className="p-3">Paciente</th>
                <th className="p-3 w-36">Fecha y Hora</th>
                <th className="p-3 text-center">Estado de Integridad</th>
                <th className="p-3 text-center w-16 select-none">Accion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3c3c3c]/60 text-sm">
              {appointments.map((appt) => {
                const slotKey = `${appt.doctor_id}-${appt.appointment_date}-${appt.appointment_time}`;
                const isDuplicated = slotCounts[slotKey] > 1;

                return (
                  <tr
                    key={appt.id}
                    className={`transition-colors ${
                      isDuplicated
                        ? "bg-[#3c1f1f] hover:bg-[#4a2525] text-[#cccccc]"
                        : "bg-[#1e1e1e] hover:bg-[#2a2d2e] text-[#cccccc]"
                    }`}
                  >
                    <td className="p-3 text-center font-mono text-xs text-[#858585] select-all">
                      {appt.id}
                    </td>

                    <td className="p-3">
                      <div>
                        <div className="font-bold text-[#cccccc]">
                          {appt.doctors?.name ||
                            `Doctor (ID: ${appt.doctor_id})`}
                        </div>
                        <div className="text-xs text-[#858585]">
                          {appt.doctors?.specialty || "General"}
                        </div>
                      </div>
                    </td>

                    <td className="p-3 font-semibold">
                      {appt.patients?.name ||
                        `Paciente (ID: ${appt.patient_id})`}
                    </td>

                    <td className="p-3 font-mono text-xs">
                      <div>{appt.appointment_date}</div>
                      <div className="text-[#858585] mt-0.5">
                        {appt.appointment_time.slice(0, 5)}
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      {isDuplicated ? (
                        <div className="inline-flex items-center gap-1 bg-[#5a1d1d]/50 border border-[#f14c4c]/40 text-[#f14c4c] text-[10px] font-bold px-2 py-1">
                          <ShieldAlert className="w-3 h-3" />
                          <span>Duplicado Fisico (Conflicto)</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 bg-[#1e3a2e]/30 border border-[#4ec9b0]/30 text-[#4ec9b0] text-[10px] font-semibold px-2 py-1">
                          <span>Registro Unico</span>
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => onDeleteAppointment(appt.id)}
                        disabled={loading}
                        title="Eliminar cita"
                        className="p-1.5 text-[#858585] hover:text-[#f14c4c] bg-[#2d2d2d] hover:bg-[#5a1d1d]/30 border border-[#3c3c3c] hover:border-[#f14c4c]/30 transition-all disabled:opacity-50"
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
