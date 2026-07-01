"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Stethoscope,
  User,
  CheckCircle2,
  XCircle,
  Info,
  CalendarPlus,
  CalendarDays,
} from "lucide-react";
import { Doctor, Patient, Appointment } from "@/types";
import { supabase } from "@/lib/supabase";

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00",
];

type FormState = "form" | "success" | "error";

interface ConflictDetails {
  doctor: string;
  date: string;
  time: string;
}

interface SavedDetails {
  patient: string;
  doctor: string;
  date: string;
  time: string;
  motivo: string;
}

interface FullPageCitaFormProps {
  doctors: Doctor[];
  patients: Patient[];
  onBack: () => void;
  onSaved: () => void;
  editAppointment?: Appointment | null;
}

export default function FullPageCitaForm({
  doctors,
  patients,
  onBack,
  onSaved,
  editAppointment,
}: FullPageCitaFormProps) {
  const isEditing = !!editAppointment;

  const [doctorId, setDoctorId] = useState<number>(0);
  const [patientId, setPatientId] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState(TIME_SLOTS[0]);
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formState, setFormState] = useState<FormState>("form");
  const [conflictDetails, setConflictDetails] = useState<ConflictDetails | null>(null);
  const [savedDetails, setSavedDetails] = useState<SavedDetails | null>(null);

  useEffect(() => {
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
    setMotivo("");
    setFormError(null);
    setFormState("form");
    setConflictDetails(null);
    setSavedDetails(null);
  }, [editAppointment]); // eslint-disable-line react-hooks/exhaustive-deps

  const getSelectedDoctorName = () =>
    doctors.find((d) => d.id === doctorId)?.name || "";

  const getSelectedPatientName = () =>
    patients.find((p) => p.id === patientId)?.name || "";

  const formatTimeDisplay = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "pm" : "am";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!doctorId || !patientId || !date || !time) {
      setFormError("Todos los campos son obligatorios.");
      return;
    }

    setSaving(true);
    setFormError(null);

    const timeWithSeconds = time + ":00";

    try {
      // PASO A: VERIFICAR DISPONIBILIDAD
      const { data: existing, error: checkError } = await supabase
        .from("appointments")
        .select("id")
        .eq("doctor_id", doctorId)
        .eq("appointment_date", date)
        .eq("appointment_time", timeWithSeconds);

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        setConflictDetails({
          doctor: getSelectedDoctorName(),
          date,
          time,
        });
        setFormState("error");
        return;
      }

      // PASO B: INSERTAR
      const appointmentData = {
        doctor_id: doctorId,
        patient_id: patientId,
        appointment_date: date,
        appointment_time: timeWithSeconds,
      };

      if (isEditing && editAppointment) {
        const { error: updateError } = await supabase
          .from("appointments")
          .update(appointmentData)
          .eq("id", editAppointment.id);

        if (updateError) throw updateError;

        onSaved();
        onBack();
      } else {
        const { error: insertError } = await supabase
          .from("appointments")
          .insert(appointmentData);

        if (insertError) {
          if (insertError.code === "23505") {
            setConflictDetails({
              doctor: getSelectedDoctorName(),
              date,
              time,
            });
            setFormState("error");
            return;
          }
          throw insertError;
        }

        setSavedDetails({
          patient: getSelectedPatientName(),
          doctor: getSelectedDoctorName(),
          date,
          time,
          motivo,
        });
        setFormState("success");
        onSaved();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al guardar la cita.";
      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormState("form");
    setFormError(null);
    setConflictDetails(null);
    setSavedDetails(null);
    if (!isEditing) {
      setDoctorId(doctors.length > 0 ? doctors[0].id : 0);
      setPatientId(patients.length > 0 ? patients[0].id : 0);
      setDate(new Date().toISOString().split("T")[0]);
      setTime(TIME_SLOTS[0]);
      setMotivo("");
    }
  };

  // ============ VISTA: SUCCESS ============
  if (formState === "success" && savedDetails) {
    return (
      <div className="min-h-full bg-slate-50 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-xl">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Citas
          </button>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 flex flex-col items-center text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                CITA REGISTRADA CON EXITO
              </h2>

              <div className="w-full bg-green-50 border border-green-200 rounded-lg p-5 text-left mb-5">
                <p className="text-sm font-semibold text-slate-800 mb-3">
                  Detalles de la cita
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Paciente:</span>
                    <span className="font-medium text-slate-800">{savedDetails.patient}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Medico:</span>
                    <span className="font-medium text-slate-800">{savedDetails.doctor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fecha:</span>
                    <span className="font-medium text-slate-800">{savedDetails.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hora:</span>
                    <span className="font-medium text-slate-800">{formatTimeDisplay(savedDetails.time)}</span>
                  </div>
                  {savedDetails.motivo && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Motivo:</span>
                      <span className="font-medium text-slate-800">{savedDetails.motivo}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6 w-full">
                <Info className="w-4 h-4 flex-shrink-0" />
                Hemos enviado un recordatorio al paciente.
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={resetForm}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  <CalendarPlus className="w-4 h-4" />
                  Registrar otra cita
                </button>
                <button
                  onClick={onBack}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <CalendarDays className="w-4 h-4" />
                  Ver mis citas
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ VISTA: ERROR ============
  if (formState === "error" && conflictDetails) {
    return (
      <div className="min-h-full bg-slate-50 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-xl">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Citas
          </button>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 flex flex-col items-center text-center">
              <XCircle className="w-16 h-16 text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                No se puede registrar la cita
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                El medico ya tiene una cita en la fecha y hora seleccionada.
              </p>

              <div className="w-full bg-red-50 border border-red-200 rounded-lg p-5 text-left mb-5">
                <p className="text-sm font-semibold text-slate-800 mb-3">
                  Detalle del conflicto
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Medico:</span>
                    <span className="font-medium text-slate-800">{conflictDetails.doctor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fecha:</span>
                    <span className="font-medium text-slate-800">{conflictDetails.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hora:</span>
                    <span className="font-medium text-slate-800">{formatTimeDisplay(conflictDetails.time)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6 w-full">
                <Info className="w-4 h-4 flex-shrink-0" />
                Por favor, seleccione otro horario disponible.
              </div>

              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={resetForm}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  <Clock className="w-4 h-4" />
                  Elegir otro horario
                </button>
                <button
                  onClick={resetForm}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Volver al formulario
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ VISTA: FORMULARIO ============
  return (
    <div className="min-h-full bg-slate-50 flex flex-col items-center justify-start p-8">
      <div className="w-full max-w-xl">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Citas
        </button>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-1">
              <Calendar className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? "EDITAR CITA" : "NUEVA CITA"}
              </h2>
            </div>
            <p className="text-sm text-slate-500 ml-8">
              Complete la informacion para agendar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                  Hora
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

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1">
                Motivo de la consulta
              </label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all resize-none"
                placeholder="Descripcion breve del motivo de la consulta..."
              />
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {formError}
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Informacion importante.</strong> El sistema verificara la
                disponibilidad del medico en la fecha y hora seleccionada antes de
                registrar la cita.
              </span>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                CANCELAR
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Guardando..." : "REGISTRAR CITA"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
