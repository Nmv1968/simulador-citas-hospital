"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, Stethoscope, User } from "lucide-react";
import { Doctor, Patient, Appointment } from "@/types";
import { supabase } from "@/lib/supabase";

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00",
];

interface CitaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  doctors: Doctor[];
  patients: Patient[];
  editAppointment?: Appointment | null;
}

export default function CitaModal({
  isOpen,
  onClose,
  onSaved,
  doctors,
  patients,
  editAppointment,
}: CitaModalProps) {
  const isEditing = !!editAppointment;

  const [doctorId, setDoctorId] = useState<number>(0);
  const [patientId, setPatientId] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState(TIME_SLOTS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (editAppointment) {
        setDoctorId(editAppointment.doctor_id);
        setPatientId(editAppointment.patient_id);
        setDate(editAppointment.appointment_date);
        setTime(editAppointment.appointment_time.slice(0, 5));
      } else {
        setDoctorId(doctors.length > 0 ? doctors[0].id : 0);
        setPatientId(patients.length > 0 ? patients[0].id : 0);
        setDate(new Date().toISOString().split("T")[0]);
        setTime(TIME_SLOTS[0]);
      }
      setError(null);
    }
  }, [isOpen, editAppointment, doctors, patients]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!doctorId || !patientId || !date || !time) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    setSaving(true);
    setError(null);

    const appointmentData = {
      doctor_id: doctorId,
      patient_id: patientId,
      appointment_date: date,
      appointment_time: time + ":00",
    };

    try {
      if (isEditing && editAppointment) {
        const { error: updateError } = await supabase
          .from("appointments")
          .update(appointmentData)
          .eq("id", editAppointment.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("appointments")
          .insert(appointmentData);

        if (insertError) throw insertError;
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar la cita.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-base text-slate-800">
            {isEditing ? "Editar Cita" : "Nueva Cita"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                Medico
              </label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} - {d.specialty}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1">
                <User className="w-4 h-4 text-blue-600" />
                Paciente
              </label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1">
                <Calendar className="w-4 h-4 text-blue-600" />
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1">
                <Clock className="w-4 h-4 text-blue-600" />
                Horario
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving
                ? "Guardando..."
                : isEditing
                  ? "Actualizar Cita"
                  : "Agendar Cita"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
