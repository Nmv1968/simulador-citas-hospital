"use client";

import React, { useState } from "react";
import {
  BookOpen,
  ShieldAlert,
  Cpu,
  Database,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function TechnicalExplainer() {
  const [openSection, setOpenSection] = useState<number | null>(null);

  const toggleSection = (index: number) => {
    setOpenSection(openSection === index ? null : index);
  };

  return (
    <section className="bg-[#252526] border border-[#3c3c3c] p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-[#2d2d2d] text-[#569cd6]">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#cccccc]">
            Guia Teorica de Laboratorio
          </h2>
          <p className="text-xs text-[#858585]">
            Conceptos de Concurrencia e Integridad de Datos
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="border border-[#3c3c3c] overflow-hidden transition-all duration-300">
          <button
            onClick={() => toggleSection(1)}
            className="w-full flex justify-between items-center p-4 bg-[#2d2d2d] hover:bg-[#3c3c3c] text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-[#dcdcaa]" />
              <span className="font-semibold text-[#cccccc] text-sm md:text-base">
                1. Que es una Condicion de Carrera (Race Condition)?
              </span>
            </div>
            {openSection === 1 ? (
              <ChevronUp className="w-5 h-5 text-[#858585]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#858585]" />
            )}
          </button>

          {openSection === 1 && (
            <div className="p-4 bg-[#1e1e1e] border-t border-[#3c3c3c] text-[#cccccc] text-sm space-y-3 leading-relaxed">
              <p>
                Una <strong>Condicion de Carrera</strong> ocurre en sistemas
                concurrentes cuando el resultado de una operacion depende del
                orden o la sincronizacion en que se ejecutan los procesos
                independientes.
              </p>
              <p>
                En desarrollo web, si dos usuarios (o peticiones HTTP) intentan
                modificar el mismo recurso simultaneamente y el servidor procesa
                las peticiones en hilos paralelos sin una debida sincronizacion,
                el sistema puede terminar en un estado inconsistente e
                inesperado.
              </p>
              <div className="p-3 bg-[#2d2d2d] border border-[#3c3c3c] text-[#dcdcaa]">
                <strong>Ejemplo de la vida real:</strong> Dos personas
                ingresando al mismo cajero automatico usando la misma cuenta
                corriente compartida al mismo tiempo, logrando retirar $100 cada
                uno a pesar de que el saldo de la cuenta era de solo $100.
              </div>
            </div>
          )}
        </div>

        <div className="border border-[#3c3c3c] overflow-hidden transition-all duration-300">
          <button
            onClick={() => toggleSection(2)}
            className="w-full flex justify-between items-center p-4 bg-[#2d2d2d] hover:bg-[#3c3c3c] text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 text-[#569cd6]" />
              <span className="font-semibold text-[#cccccc] text-sm md:text-base">
                2. Que significa TOCTOU (Time-of-Check to Time-of-Use)?
              </span>
            </div>
            {openSection === 2 ? (
              <ChevronUp className="w-5 h-5 text-[#858585]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#858585]" />
            )}
          </button>

          {openSection === 2 && (
            <div className="p-4 bg-[#1e1e1e] border-t border-[#3c3c3c] text-[#cccccc] text-sm space-y-4 leading-relaxed">
              <p>
                <strong>TOCTOU</strong> es una clase especifica de bug de
                concurrencia y vulnerabilidad logica. Se traduce como{" "}
                <em>&quot;Tiempo de Verificacion al Tiempo de Uso&quot;</em>. Representa
                la separacion temporal entre:
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1 text-[#858585]">
                <li>
                  <strong className="text-[#cccccc]">
                    Time-of-Check (Verificacion):
                  </strong>{" "}
                  El sistema consulta el estado (&quot;Esta el horario
                  disponible?&quot;).
                </li>
                <li>
                  <strong className="text-[#cccccc]">
                    Time-of-Use (Uso/Insercion):
                  </strong>{" "}
                  El sistema actua basandose en esa verificacion (&quot;Guarda la
                  cita&quot;).
                </li>
              </ul>
              <p>
                Si existe una ventana de tiempo (incluso de unos pocos
                milisegundos, amplificada por nuestro delay artificial de
                1500ms) entre la verificacion y el uso, el estado verificado
                puede cambiar en segundo plano antes de que se ejecute la
                accion.
              </p>

              <div className="mt-4 border border-[#3c3c3c] p-4 bg-[#252526]">
                <p className="text-xs font-semibold text-[#858585] uppercase tracking-wider mb-3 text-center">
                  Linea de Tiempo del Conflicto TOCTOU (Modo Vulnerable)
                </p>
                <div className="space-y-3 text-xs font-mono">
                  <div className="flex justify-between items-center gap-2 p-2 bg-[#1e1e1e] border border-[#3c3c3c]">
                    <span className="text-[#569cd6]">0.00s</span>
                    <div className="flex-1 text-center">
                      <p className="font-semibold text-[#cccccc]">
                        Peticion 1: CHECK (Verifica)
                      </p>
                      <p className="text-[10px] text-[#858585]">
                        Cita para Dr. Carlos a las 10:00? &rarr; &quot;No existe,
                        LIBRE&quot;
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center gap-2 p-2 bg-[#1e1e1e] border border-[#3c3c3c]">
                    <span className="text-[#c586c0]">0.01s</span>
                    <div className="flex-1 text-center">
                      <p className="font-semibold text-[#cccccc]">
                        Peticion 2: CHECK (Verifica)
                      </p>
                      <p className="text-[10px] text-[#858585]">
                        Cita para Dr. Carlos a las 10:00? &rarr; &quot;No existe,
                        LIBRE&quot;
                      </p>
                    </div>
                  </div>
                  <div className="p-1.5 text-center bg-[#2d2d2d] border border-[#dcdcaa]/30 text-[#dcdcaa] text-[10px]">
                    VENTANA DE VULNERABILIDAD (Ambos hilos estan esperando y
                    asumen que el horario esta libre)
                  </div>
                  <div className="flex justify-between items-center gap-2 p-2 bg-[#1e1e1e] border border-[#3c3c3c]">
                    <span className="text-[#569cd6]">1.50s</span>
                    <div className="flex-1 text-center">
                      <p className="font-semibold text-[#cccccc]">
                        Peticion 1: USE (Inserta)
                      </p>
                      <p className="text-[10px] text-[#4ec9b0]">
                        Cita insertada exitosamente
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center gap-2 p-2 bg-[#1e1e1e] border border-[#3c3c3c]">
                    <span className="text-[#c586c0]">1.51s</span>
                    <div className="flex-1 text-center">
                      <p className="font-semibold text-[#cccccc]">
                        Peticion 2: USE (Inserta)
                      </p>
                      <p className="text-[10px] text-[#dcdcaa]">
                        Inserta la cita tambien! (Nace el Duplicado)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border border-[#3c3c3c] overflow-hidden transition-all duration-300">
          <button
            onClick={() => toggleSection(3)}
            className="w-full flex justify-between items-center p-4 bg-[#2d2d2d] hover:bg-[#3c3c3c] text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-[#4ec9b0]" />
              <span className="font-semibold text-[#cccccc] text-sm md:text-base">
                3. Como soluciona esto la Restriccion UNIQUE de PostgreSQL?
              </span>
            </div>
            {openSection === 3 ? (
              <ChevronUp className="w-5 h-5 text-[#858585]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#858585]" />
            )}
          </button>

          {openSection === 3 && (
            <div className="p-4 bg-[#1e1e1e] border-t border-[#3c3c3c] text-[#cccccc] text-sm space-y-3 leading-relaxed">
              <p>
                Aunque validemos en el codigo de Next.js, esa validacion{" "}
                <strong>no es atomica</strong>. La base de datos es el unico
                arbitro centralizado y concurrente real capaz de garantizar la
                integridad fisica de los datos.
              </p>
              <p>
                Al aplicar una restriccion UNIQUE sobre la tupla
                (doctor_id, appointment_date, appointment_time):
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1 text-[#858585]">
                <li>PostgreSQL crea un indice unico bajo el capo.</li>
                <li>
                  Cada intento de insercion bloquea internamente la clave de
                  indice durante la transaccion.
                </li>
                <li>
                  Si dos hilos intentan insertar los mismos valores exactos, el
                  motor de la base de datos permite pasar solo al primero. El
                  segundo hilo chocara atomicamente contra la validacion del
                  indice y sera rechazado instantaneamente arrojando el error{" "}
                  <strong className="text-[#cccccc]">
                    SQLSTATE 23505 (Unique Violation)
                  </strong>
                  .
                </li>
              </ul>
              <div className="p-3 bg-[#1e3a2e]/30 border border-[#4ec9b0]/30 text-[#4ec9b0]">
                <strong>Conclusion Pedagogica:</strong> La seguridad de la
                informacion debe estar resguardada en la capa de datos. Las
                validaciones de software (frontend/backend) son utiles para la
                experiencia de usuario, pero las restricciones de base de datos
                son la unica garantia real de consistencia en entornos de alto
                trafico concurrente.
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
