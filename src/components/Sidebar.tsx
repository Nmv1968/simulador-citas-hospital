"use client";

import React from "react";
import {
  Heart,
  CalendarPlus,
  CalendarDays,
  Users,
  Stethoscope,
  BarChart3,
  Settings,
  User,
  ChevronDown,
} from "lucide-react";

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

const NAV_ITEMS = [
  { id: "nueva-cita", label: "Nueva Cita", icon: CalendarPlus, action: true },
  { id: "citas", label: "Citas", icon: CalendarDays, action: true },
  { id: "pacientes", label: "Pacientes", icon: Users, action: true },
  { id: "medicos", label: "Medicos", icon: Stethoscope, action: true },
  { id: "reportes", label: "Reportes", icon: BarChart3, action: false },
  { id: "configuracion", label: "Configuracion", icon: Settings, action: false },
];

export default function Sidebar({ currentView, onNavigate }: SidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col min-h-screen flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-red-500 rounded-lg flex items-center justify-center">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Salud +</p>
            <p className="text-xs text-slate-400">Sistemas de citas</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.action) onNavigate(item.id);
              }}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-600 border-l-2 border-blue-600"
                  : item.action
                    ? "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                    : "text-slate-400 cursor-default"
              }`}
              disabled={!item.action}
            >
              <Icon className="w-4.5 h-4.5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="border-t border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">Usuario</p>
            <p className="text-xs text-slate-400 truncate">Recepcionista</p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        </div>
      </div>
    </aside>
  );
}
