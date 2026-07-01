"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Hospital,
  CalendarDays,
  Users,
  Plus,
  Trash2,
  Pencil,
  Clock,
  Stethoscope,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Doctor, Patient, Appointment } from "@/types";
import { supabase } from "@/lib/supabase";
import Sidebar from "./Sidebar";
import FullPageCitaForm from "./FullPageCitaForm";

type SchedulerView = "citas" | "nueva-cita" | "pacientes" | "medicos";

export default function AppointmentScheduler() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const today = useMemo(() => new Date(), []);
  const [dateFrom, setDateFrom] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0],
  );
  const [dateTo, setDateTo] = useState(
    new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0],
  );
  const [viewMonth, setViewMonth] = useState(() => today.getMonth());
  const [viewYear, setViewYear] = useState(() => today.getFullYear());
  const [doctorFilter, setDoctorFilter] = useState<number>(0);
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [currentView, setCurrentView] = useState<SchedulerView>("citas");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [docsRes, patsRes] = await Promise.all([
        supabase.from("doctors").select("*").order("name"),
        supabase.from("patients").select("*").order("name"),
      ]);

      if (docsRes.data) setDoctors(docsRes.data);
      if (patsRes.data) setPatients(patsRes.data);

      let query = supabase
        .from("appointments")
        .select("*, doctors(*), patients(*)")
        .gte("appointment_date", dateFrom)
        .lte("appointment_date", dateTo)
        .order("appointment_date")
        .order("appointment_time");

      if (doctorFilter > 0) {
        query = query.eq("doctor_id", doctorFilter);
      }

      const { data: appts } = await query;
      if (appts) setAppointments(appts as unknown as Appointment[]);
    } catch (err) {
      console.error("Error cargando datos del agendador:", err);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, doctorFilter]);

  useEffect(() => {
    loadData();
  }, [dateFrom, dateTo, doctorFilter]);

  const handleDelete = async (id: number) => {
    if (!confirm("Esta seguro de eliminar esta cita?")) return;
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id);
      if (error) throw error;
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      alert("Error al eliminar la cita: " + message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (appt: Appointment) => {
    setEditingAppointment(appt);
    setCurrentView("nueva-cita");
  };

  const handleModalSaved = () => {
    loadData();
  };

  const handleNavigate = (view: string) => {
    if (view === "nueva-cita") {
      setEditingAppointment(null);
    }
    setCurrentView(view as SchedulerView);
  };

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  useEffect(() => {
    const from = new Date(viewYear, viewMonth, 1).toISOString().split("T")[0];
    const to = new Date(viewYear, viewMonth + 1, 0).toISOString().split("T")[0];
    setDateFrom(from);
    setDateTo(to);
  }, [viewMonth, viewYear]);

  // ============ VISTA: NUEVA CITA / EDITAR ============
  if (currentView === "nueva-cita") {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar currentView={currentView} onNavigate={handleNavigate} />
        <main className="flex-1 overflow-auto">
          <FullPageCitaForm
            doctors={doctors}
            patients={patients}
            onBack={() => {
              setEditingAppointment(null);
              setCurrentView("citas");
            }}
            onSaved={handleModalSaved}
            editAppointment={editingAppointment}
          />
        </main>
      </div>
    );
  }

  // ============ VISTA: PACIENTES ============
  if (currentView === "pacientes") {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar currentView={currentView} onNavigate={handleNavigate} />
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Pacientes</h2>
            <p className="text-sm text-slate-500 mb-6">
              Gestion de pacientes del hospital.
            </p>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-4">ID</th>
                    <th className="px-5 py-4">Nombre</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.map((p) => (
                    <tr key={p.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-5 py-4 text-sm text-slate-600 font-mono">{p.id}</td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-800">{p.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ============ VISTA: MEDICOS ============
  if (currentView === "medicos") {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar currentView={currentView} onNavigate={handleNavigate} />
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Medicos</h2>
            <p className="text-sm text-slate-500 mb-6">
              Directorio de medicos del hospital.
            </p>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-4">ID</th>
                    <th className="px-5 py-4">Nombre</th>
                    <th className="px-5 py-4">Especialidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doctors.map((d) => (
                    <tr key={d.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-5 py-4 text-sm text-slate-600 font-mono">{d.id}</td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-800">{d.name}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {d.specialty}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ============ VISTA: CITAS (default) ============
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentView={currentView} onNavigate={handleNavigate} />

      <main className="flex-1 overflow-auto">
        <div className="min-h-full bg-[#f0f4f8] text-slate-800">
          {/* Header */}
          <div className="bg-white border-b border-slate-200 px-6 py-5">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Hospital className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">
                    Agendador de Citas
                  </h1>
                  <p className="text-xs text-slate-500">
                    Hospital General - Sistema de Gestion de Consultas
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <CalendarDays className="w-4 h-4" />
                <span>{new Date().toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}</span>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="bg-white border-b border-slate-200 px-6 py-3">
            <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-2">
                <button
                  onClick={goToPrevMonth}
                  title="Mes anterior"
                  className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 px-2">
                  <CalendarDays className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-slate-800 min-w-[140px] text-center">
                    {monthNames[viewMonth]} {viewYear}
                  </span>
                </div>
                <button
                  onClick={goToNextMonth}
                  title="Mes siguiente"
                  className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                <select
                  value={doctorFilter}
                  onChange={(e) => setDoctorFilter(Number(e.target.value))}
                  className="bg-transparent text-sm text-slate-800 border-none focus:outline-none"
                >
                  <option value={0}>Todos los medicos</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1" />

              <button
                onClick={() => handleNavigate("nueva-cita")}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nueva Cita
              </button>
            </div>
          </div>

          {/* Summary bar */}
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <CalendarDays className="w-4 h-4 text-blue-600" />
                <span className="font-medium">
                  {dateFrom} al {dateTo}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Users className="w-4 h-4 text-blue-600" />
                <span>
                  <span className="font-medium text-slate-800">
                    {appointments.length}
                  </span>{" "}
                  citas agendadas
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>
                  <span className="font-medium text-slate-800">
                    {doctors.length}
                  </span>{" "}
                  medicos disponibles
                </span>
              </div>
            </div>
          </div>

          {/* Appointments table */}
          <div className="max-w-6xl mx-auto px-6 pb-8">
            {loading ? (
              <div className="bg-white rounded-xl border border-slate-200 p-16 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
                <p className="text-sm">Cargando citas...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-16 flex flex-col items-center justify-center text-slate-400">
                <CalendarDays className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-500">
                  No hay citas en {monthNames[viewMonth]} {viewYear}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Navega a otro mes o crea una nueva cita
                </p>
                <button
                  onClick={() => handleNavigate("nueva-cita")}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Agendar primera cita
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-5 py-4 w-24">Horario</th>
                      <th className="px-5 py-4 w-32">Fecha</th>
                      <th className="px-5 py-4">Paciente</th>
                      <th className="px-5 py-4">Medico</th>
                      <th className="px-5 py-4 hidden md:table-cell">
                        Especialidad
                      </th>
                      <th className="px-5 py-4 text-center w-28">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appointments.map((appt, idx) => {
                      const time12h = (t: string) => {
                        const [h, m] = t.split(":").map(Number);
                        const ampm = h >= 12 ? "PM" : "AM";
                        const h12 = h % 12 || 12;
                        return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
                      };

                      return (
                        <tr
                          key={appt.id}
                          className={`hover:bg-blue-50/50 transition-colors ${
                            idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                          }`}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <span className="font-mono text-sm font-medium text-slate-800">
                                {time12h(appt.appointment_time)}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm text-slate-600 font-mono">
                              {appt.appointment_date}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-sm font-medium text-slate-800">
                              {appt.patients?.name ||
                                `Paciente #${appt.patient_id}`}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-sm text-slate-800">
                              {appt.doctors?.name ||
                                `Doctor #${appt.doctor_id}`}
                            </div>
                          </td>
                          <td className="px-5 py-4 hidden md:table-cell">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                              {appt.doctors?.specialty || "General"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEdit(appt)}
                                title="Editar cita"
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(appt.id)}
                                disabled={deletingId === appt.id}
                                title="Eliminar cita"
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {deletingId === appt.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
