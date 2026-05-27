# Hospital Appointment Concurrency Lab

## Vista General

```
┌─────────────────────────────────────────────────────────┐
│                    HOSPITAL GENERAL                       │
│     Caso de Soporte - Duplicacion de Citas en Produccion │
│                                                          │
│  🐛 Escenario #42: Pacientes aparecen agendados dos      │
│     veces en el mismo horario con el mismo medico.       │
│     La falla solo ocurre con carga concurrente.          │
└─────────────────────────────────────────────────────────┘
```

Este laboratorio simula un **caso real de soporte tecnico** en un hospital: citas medicas que se duplican misteriosamente cuando varias secretarias agendan al mismo tiempo. Tu mision es diagnosticar la causa raiz y aplicar la solucion definitiva.

Es una herramienta educativa diseñada para que estudiantes de Ingenieria de Sistemas, Ciencias de la Computacion y afines:

1. **Descubran** como ocurre una condicion de carrera (_race condition_) en un sistema real
2. **Midau** el impacto cuantitativo de la vulnerabilidad
3. **Diagnostiquen** por que la validacion por software es insuficiente
4. **Apliquen** la solucion a nivel de base de datos (restriccion UNIQUE)
5. **Verifiquen** que la solucion funciona bajo carga concurrente

---

## Tabla de Contenidos

- [El Problema de Negocio](#el-problema-de-negocio)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Requisitos Previos](#requisitos-previos)
- [Guia de Instalacion Paso a Paso](#guia-de-instalacion-paso-a-paso)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Base de Datos: Esquema Completo](#base-de-datos-esquema-completo)
- [Endpoints de la API](#endpoints-de-la-api)
- [Recorrido de la Interfaz](#recorrido-de-la-interfaz)
- [Los 3 Experimentos (Plan de Aprendizaje)](#los-3-experimentos-plan-de-aprendizaje)
- [Explicacion Tecnica: Anatomia de una Race Condition](#explicacion-tecnica-anatomia-de-una-race-condition)
- [Preguntas Frecuentes para Exposicion](#preguntas-frecuentes-para-exposicion)
- [Solucion de Problemas](#solucion-de-problemas)

---

## El Problema de Negocio

### Escenario

El **Hospital General** utiliza un sistema de agendamiento de citas. Recientemente, pacientes han reportado que aparecen registrados dos veces en el mismo horario con el mismo medico. Al investigar, el equipo de TI descubrio que el problema solo ocurre cuando hay **alta concurrencia** (varias secretarias agendando simultaneamente).

### La Causa Raiz

El sistema implementa el siguiente flujo para agendar una cita:

```
Paso 1 (CHECK):  Preguntar a la BD: "¿El medico tiene cita en este horario?"
Paso 2 (DELAY):  Procesar la solicitud (tiempo de respuesta)
Paso 3 (USE):    Si esta libre → Insertar la cita en la BD
```

El problema es que entre el **CHECK** y el **USE** hay una ventana de tiempo. Si dos solicitudes llegan casi al mismo tiempo, ambas ejecutan el CHECK antes de que alguna llegue al USE. Ambas ven el horario "libre", y ambas insertan la cita. **Nacen los duplicados.**

Este patron se conoce como **TOCTOU** (Time-of-Check to Time-of-Use).

### ¿Por que no basta con validar en el codigo?

Porque el codigo se ejecuta en multiples hilos/servidores simultaneamente. La base de datos es el **unico arbitro centralizado** capaz de garantizar atomicidad. La validacion por software es util para la experiencia de usuario, pero no es una garantia de integridad bajo concurrencia.

---

## Arquitectura del Sistema

```
┌──────────────────────────────────────────────────┐
│                   FRONTEND                        │
│           Next.js 16 + React 19 + TS             │
│                                                   │
│  ┌──────────────┐    ┌───────────────────────┐   │
│  │ Laboratorio  │    │   Agendador (CRUD)     │   │
│  │ (VS Code     │    │   Hospital realista    │   │
│  │  Dark Theme) │    │   UI clinica           │   │
│  └──────┬───────┘    └───────────┬───────────┘   │
│         │                        │                │
│         ▼                        ▼                │
│  ┌──────────────────────────────────────────┐     │
│  │        Supabase Client (directo)         │     │
│  └────────────────┬─────────────────────────┘     │
└───────────────────┼──────────────────────────────┘
                    │
┌───────────────────┼──────────────────────────────┐
│                   ▼                               │
│  ┌──────────────────────────────────────────┐     │
│  │         PostgreSQL (Supabase)             │     │
│  │                                           │     │
│  │  ┌───────────┐  ┌───────────┐            │     │
│  │  │ doctors   │  │ patients  │            │     │
│  │  ├───────────┤  ├───────────┤            │     │
│  │  │ appointments (tabla vulnerable)       │     │
│  │  ├───────────────────────────────────────┤     │
│  │  │ simulation_results (historial)        │     │
│  │  └───────────────────────────────────────┘     │
│  └──────────────────────────────────────────┘     │
└──────────────────────────────────────────────────┘
```

### Tecnologias

| Componente | Tecnologia | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.6 |
| UI | React | 19.2.4 |
| Lenguaje | TypeScript | 5.x |
| Estilos | Tailwind CSS | 4.x |
| Base de Datos | PostgreSQL (via Supabase) | 15+ |
| Iconos | Lucide React | 1.16 |
| Fuentes | Geist Sans / Geist Mono | Variable |

---

## Requisitos Previos

- **Node.js** 18+ (recomendado 20 LTS)
- **npm** 9+ (viene con Node.js)
- Una cuenta gratuita en [Supabase](https://supabase.com)
- Navegador web moderno (Chrome, Firefox, Edge)

---

## Guia de Instalacion Paso a Paso

### Paso 1: Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/simulador-citas-hospital.git
cd simulador-citas-hospital
```

### Paso 2: Instalar dependencias

```bash
npm install
```

### Paso 3: Configurar Supabase

1. Ve a [Supabase](https://supabase.com) y crea un nuevo proyecto gratuito.
2. Una vez creado, en el panel izquierdo haz clic en **SQL Editor**.
3. Haz clic en **New Query**.
4. Abre el archivo `sql/schema.sql` de este proyecto, copia todo su contenido y pegalo en el editor.
5. Haz clic en **Run** para ejecutar el script.
   - Este script crea las tablas `doctors`, `patients`, `appointments` y `simulation_results`.
   - Inserta 4 medicos y 8 pacientes de prueba.
   - Crea las funciones `exec_ddl_query` y `check_unique_constraint` necesarias para el laboratorio.

6. **(Opcional)** Si deseas mas datos de prueba, ejecuta tambien `sql/seed-data.sql` para insertar 25 medicos y 100 pacientes adicionales.

### Paso 4: Configurar variables de entorno

1. En Supabase, ve a **Project Settings** (icono de engranaje) → **API**.
2. Copia la **Project URL** (ej: `https://xxxxx.supabase.co`).
3. Copia la **anon public key**.
4. Crea un archivo `.env.local` en la raiz del proyecto con el siguiente contenido:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu-anon-key-de-supabase
```

> **Importante:** Las claves deben ser las reales, no los placeholders. Si usas las palabras "tu-proyecto" literales, el sistema mostrara un error de conexion.

### Paso 5: Iniciar el servidor

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## Estructura del Proyecto

```
simulador-citas-hospital/
│
├── sql/
│   ├── schema.sql              # Script SQL completo (tablas, semillas, funciones)
│   └── seed-data.sql            # Datos adicionales (25 medicos, 100 pacientes)
│
├── src/
│   ├── app/
│   │   ├── globals.css          # Estilos globales (VS Code dark theme)
│   │   ├── layout.tsx           # Layout raiz (fuentes, metadata)
│   │   ├── page.tsx             # Pagina principal (orquestador de vistas)
│   │   │
│   │   └── api/
│   │       ├── book-appointment/route.ts   # POST: Reservar cita (con TOCTOU)
│   │       ├── db-admin/route.ts           # GET/POST: Administrar constraint UNIQUE
│   │       ├── reset-data/route.ts         # POST: Purgar citas
│   │       └── simulations/route.ts        # GET/POST: Historial de pruebas
│   │
│   ├── components/
│   │   ├── AppointmentScheduler.tsx   # Vista agendador hospitalario
│   │   ├── AppointmentsTable.tsx      # Tabla de citas en DB
│   │   ├── CitaModal.tsx             # Modal para crear/editar citas
│   │   ├── ConcurrencySimulator.tsx   # Panel de pruebas de concurrencia
│   │   ├── DbAdminPanel.tsx          # Panel de control de integridad
│   │   ├── ExperimentalResults.tsx    # Historial de pruebas de carga
│   │   ├── LogsConsole.tsx           # Registro de actividad del servidor
│   │   ├── MetricsPanel.tsx          # KPIs de las pruebas
│   │   ├── PacienteModal.tsx         # Modal para crear pacientes
│   │   └── TechnicalExplainer.tsx    # Documentacion tecnica interactiva
│   │
│   ├── lib/
│   │   └── supabase.ts               # Cliente de Supabase (singleton)
│   │
│   └── types/
│       └── index.ts                   # Interfaces TypeScript
│
├── .env.local                         # Variables de entorno (NO versionar)
├── package.json
├── tsconfig.json
└── README.md
```

---

## Base de Datos: Esquema Completo

### Tabla: `doctors`

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | `SERIAL` | `PRIMARY KEY` |
| `name` | `VARCHAR(255)` | `NOT NULL` |
| `specialty` | `VARCHAR(255)` | `NOT NULL` |

### Tabla: `patients`

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | `SERIAL` | `PRIMARY KEY` |
| `name` | `VARCHAR(255)` | `NOT NULL` |

### Tabla: `appointments`

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | `SERIAL` | `PRIMARY KEY` |
| `doctor_id` | `INT` | `NOT NULL`, FK → `doctors(id)` ON DELETE CASCADE |
| `patient_id` | `INT` | `NOT NULL`, FK → `patients(id)` ON DELETE CASCADE |
| `appointment_date` | `DATE` | `NOT NULL` |
| `appointment_time` | `TIME` | `NOT NULL` |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` |

> **Nota academica clave:** Esta tabla se crea **SIN** la restriccion UNIQUE en `(doctor_id, appointment_date, appointment_time)`. Esto permite emular el "Estado Vulnerable" donde la validacion depende unicamente del codigo.

### Tabla: `simulation_results`

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | `SERIAL` | `PRIMARY KEY` |
| `test_number` | `INT` | `NOT NULL` |
| `concurrent_requests` | `INT` | `NOT NULL` |
| `duplicates_generated` | `INT` | `NOT NULL` |
| `execution_time_ms` | `INT` | `NOT NULL` |
| `mode` | `VARCHAR(50)` | `NOT NULL` ('Vulnerable' o 'Corregido') |
| `total_requests` | `INT` | `NOT NULL` |
| `successful_appointments` | `INT` | `NOT NULL` |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` |

### Funciones Administrativas

**`exec_ddl_query(query_text TEXT) RETURNS JSON`**

Ejecuta comandos DDL (ALTER TABLE) en la base de datos. Creada con `SECURITY DEFINER` para que Next.js pueda alterar el esquema dinamicamente.

**`check_unique_constraint() RETURNS BOOLEAN`**

Verifica si la restriccion `unique_doctor_appointment` existe en el catalogo de PostgreSQL.

---

## Endpoints de la API

### `POST /api/book-appointment`

Reserva una cita medica. Contiene el delay artificial (1500ms) para exponer la ventana TOCTOU.

**Request:**
```json
{
  "doctorId": 1,
  "patientId": 3,
  "date": "2026-05-28",
  "time": "10:00:00",
  "requestId": "Req-1",
  "delayMs": 1500
}
```

**Response (200 - Exito):**
```json
{
  "success": true,
  "requestId": "Req-1",
  "appointmentId": 42
}
```

**Response (400 - Horario ocupado):**
```json
{
  "success": false,
  "error": "El medico ya tiene una cita en esta fecha y hora."
}
```

**Response (409 - Violacion UNIQUE):**
```json
{
  "success": false,
  "error": "Bloqueado por base de datos: Conflicto de integridad (UNIQUE constraint)."
}
```

### `GET /api/db-admin`

Verifica si la restriccion UNIQUE esta activa.

**Response:**
```json
{
  "success": true,
  "hasConstraint": true
}
```

### `POST /api/db-admin`

Activa o desactiva la restriccion UNIQUE.

**Request:**
```json
{ "action": "apply" }
```

**Response (exito):**
```json
{ "success": true, "message": "Restriccion UNIQUE aplicada exitosamente." }
```

### `POST /api/reset-data`

Elimina todas las citas de la tabla (purga los datos de prueba).

**Response:**
```json
{ "success": true, "message": "Base de datos de citas purgada exitosamente." }
```

### `GET /api/simulations`

Obtiene el historial de pruebas de carga realizadas.

### `POST /api/simulations`

Guarda una nueva prueba en el historial.

---

## Recorrido de la Interfaz

El sistema tiene **dos modos de vista** que se alternan con el boton "Vista:" en la barra de estado inferior.

### Modo Laboratorio (VS Code Dark Theme)

Interfaz estilo Visual Studio Code para el analisis tecnico. Incluye:

| Pestaña | Proposito |
|---|---|
| **Probar Concurrencia** | Panel principal de pruebas. Seleccionas medico, fecha, hora y nivel de concurrencia para disparar la simulacion. |
| **Administrar Sistema** | Panel de control de integridad. Interruptor para activar/desactivar la proteccion anti-duplicados y boton para purgar datos. |
| **Documentacion Tecnica** | Guia interactiva con explicaciones sobre Race Conditions, TOCTOU y la solucion UNIQUE. |

Componentes visibles durante una prueba:
- **Registro de Actividad**: Logs del servidor con timestamps y niveles (INFO, WARN, OK, ERROR)
- **Resultados (KPIs)**: Solicitudes, citas creadas, duplicados, tasa de error, tiempos
- **Citas en DB**: Tabla con todas las citas fisicas, duplicados resaltados en rojo
- **Historial**: Registro de todas las pruebas ejecutadas

### Modo Agendador (UI Hospitalaria)

Interfaz clinica profesional (fondo claro, azul medico) para la gestion de citas del hospital. Incluye:
- Navegacion por mes (anterior/siguiente)
- Tabla de citas con filtro por medico
- CRUD completo: Crear, Editar y Eliminar citas
- Creacion de nuevos pacientes
- Slots de 30 minutos (09:00 - 17:00)

---

## Los 3 Experimentos (Plan de Aprendizaje)

### Experimento 1: Evidenciar la Race Condition

**Estado inicial:** Sistema vulnerable (proteccion desactivada).

1. En "Administrar Sistema", verifica que la proteccion anti-duplicados este **desactivada**.
2. Ve a "Probar Concurrencia".
3. Selecciona un medico, una fecha y un horario (ej: 10:00 AM).
4. Configura **10 solicitudes concurrentes**.
5. Presiona "Simular Race Condition".
6. **Observa:**
   - En el **Registro de Actividad**: multiple solicitudes ejecutando CHECK casi simultaneamente.
   - En **Resultados**: aparecen duplicados, la tasa de error es alta.
   - En **Citas en DB**: las filas duplicadas se marcan en rojo.
7. **Conclusion:** La validacion por software falla bajo concurrencia.

### Experimento 2: La BD no acepta parches sobre datos corruptos

1. Sin limpiar los duplicados del experimento anterior, intenta activar la proteccion anti-duplicados.
2. **Observa:** El sistema muestra un error. PostgreSQL rechaza la restriccion porque ya existen filas duplicadas.
3. **Leccion:** No puedes garantizar integridad sobre datos ya corruptos. Hay que sanear primero.

### Experimento 3: Solucionar y Verificar

1. Presiona "Purgar Datos de Prueba" para limpiar las citas.
2. Activa la proteccion anti-duplicados (toggle).
3. Repite el Experimento 1 con los mismos parametros.
4. **Observa:**
   - Solo **1 cita** se crea exitosamente.
   - Las otras 9 son rechazadas con error de violacion UNIQUE.
   - **0 duplicados**, **0% de tasa de error**.
5. **Conclusion:** La restriccion UNIQUE de PostgreSQL es la unica garantia atomica de integridad bajo concurrencia.

---

## Explicacion Tecnica: Anatomia de una Race Condition

### El Patron TOCTOU (Time-of-Check to Time-of-Use)

El flujo de reserva implementa tres pasos:

```
Tiempo 0.00s ──► Request 1: CHECK ("¿Esta libre el horario?")
                                          │
                                          │ Ambas preguntan casi al mismo tiempo
                                          │ y ambas reciben "LIBRE"
                                          ▼
Tiempo 0.01s ──► Request 2: CHECK ("¿Esta libre el horario?")
                                          │
                                          ▼
              ┌─────────────────────────────────────────┐
              │  VENTANA DE VULNERABILIDAD              │
              │  Ambas asumen que el horario esta libre │
              └─────────────────────────────────────────┘
                                          │
                                          ▼
Tiempo 1.50s ──► Request 1: USE (Inserta la cita) ✓
                                          │
                                          ▼
Tiempo 1.51s ──► Request 2: USE (Inserta la cita) ✓ (¡Duplicado!)
```

### ¿Por que sucede?

1. **No hay bloqueo atomico** entre la lectura (CHECK) y la escritura (USE).
2. El delay artificial de 1500ms **amplifica** la ventana, pero en produccion incluso 1ms es suficiente.
3. `Promise.all` lanza todas las peticiones en paralelo casi instantaneamente.

### La Solucion: Restriccion UNIQUE

```sql
ALTER TABLE appointments
ADD CONSTRAINT unique_doctor_appointment
UNIQUE (doctor_id, appointment_date, appointment_time);
```

Al agregar esta restriccion:
1. PostgreSQL crea un **indice unico** internamente.
2. Cada INSERT bloquea atomicamente la clave del indice durante la transaccion.
3. Si dos hilos intentan insertar los mismos valores, solo el primero pasa. El segundo es rechazado con error `SQLSTATE 23505`.

---

## Preguntas Frecuentes para Exposicion

### ¿Que es una Race Condition?

Es un escenario de procesamiento concurrente donde el resultado final depende del orden y la sincronizacion de hilos paralelos. Sin mecanismos de sincronizacion, dos procesos pueden interferir entre si y producir estados inconsistentes.

### ¿Que es TOCTOU?

Es un antipatron especifico de concurrencia: **T**ime-**o**f-**C**heck **T**o **T**ime-**o**f-**U**se. Ocurre cuando la verificacion de un recurso y su posterior utilizacion no son una operacion atomica. Entre ambos pasos, el estado puede cambiar.

### ¿Por que no basta con validar en el codigo (backend)?

Porque el codigo se ejecuta en hilos paralelos sin comunicacion entre si. Cada hilo ejecuta su propia consulta SELECT de verificacion, y todos ven el mismo resultado ("libre") simultaneamente. No hay coordinacion entre ellos.

### ¿Como soluciona esto PostgreSQL?

PostgreSQL es el unico punto centralizado. Al declarar un `UNIQUE CONSTRAINT`, el motor:
1. Bloquea atomicamente la clave del indice durante el INSERT.
2. Garantiza que solo un hilo pueda insertar un valor dado.
3. Los intentos concurrentes fallan con un error controlado (`23505`).

---

## Solucion de Problemas

### Error "Base de Datos no inicializada"

**Causa:** Las credenciales de Supabase no estan configuradas o el schema SQL no se ha ejecutado.

**Solucion:**
1. Verifica que `.env.local` tenga las credenciales correctas.
2. Ve al SQL Editor de Supabase y ejecuta `sql/schema.sql`.

### Error al activar la proteccion anti-duplicados

**Causa:** Existen citas duplicadas en la tabla que impiden crear la restriccion.

**Solucion:** Presiona "Purgar Datos de Prueba" para limpiar la tabla, luego activa la proteccion.

### "No hay citas" en el agendador

**Causa:** El mes seleccionado no tiene citas o la base de datos esta vacia.

**Solucion:** Usa las flechas de navegacion para cambiar de mes o crea una nueva cita con el boton "Nueva Cita".

### Las citas no aparecen en el modo laboratorio

**Causa:** El laboratorio muestra las citas de la DB. Si solo creaste citas en el agendador, estas se mostraran en la tabla de citas del laboratorio tambien.

**Solucion:** Ambas vistas comparten la misma base de datos. Las citas creadas en cualquier vista son visibles en ambas.

---

## Acerca de

Proyecto academico diseñado para la enseñanza de conceptos de concurrencia, integridad de datos y bases de datos relacionales en programas de Ingenieria de Sistemas y Ciencias de la Computacion.

Construido con Next.js 16, React 19, TypeScript, Supabase (PostgreSQL) y Tailwind CSS.
