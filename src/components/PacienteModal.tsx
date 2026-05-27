"use client";

import React, { useState } from "react";
import { X, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface PacienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (patient: { id: number; name: string }) => void;
}

export default function PacienteModal({
  isOpen,
  onClose,
  onSaved,
}: PacienteModalProps) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("El nombre del paciente es obligatorio.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from("patients")
        .insert({ name: trimmed })
        .select()
        .single();

      if (supabaseError) throw supabaseError;
      if (data) {
        onSaved(data);
        setName("");
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Error al crear el paciente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2 text-slate-800">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-base">Nuevo Paciente</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre completo del paciente
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Roberto Martinez"
              autoFocus
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
            />
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
              disabled={saving || !name.trim()}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Guardando..." : "Guardar Paciente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
