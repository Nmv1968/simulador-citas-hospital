# Guía para Principiantes: Cómo entender este proyecto

Si solo has visto Python básico y este proyecto te parece un idioma diferente, esta guía es para ti. Vamos a traducir cada concepto a algo que ya conoces.

---

## Índice

1. [¿Qué necesito saber antes de empezar?](#1-qué-necesito-saber-antes-de-empezar)
2. [El viaje de una petición: del clic a la base de datos](#2-el-viaje-de-una-petición-del-clic-a-la-base-de-datos)
3. [Traducción Python → TypeScript/React](#3-traducción-python--typescriptreact)
4. [Recorrido guiado por los archivos clave](#4-recorrido-guiado-por-los-archivos-clave)
5. [Glosario de términos](#5-glosario-de-términos)

---

## 1. ¿Qué necesito saber antes de empezar?

### ¿Qué es una API?

Imagina un **restaurante**:

| Restaurante | API |
|---|---|
| Tú eres el cliente | El navegador (frontend) |
| El mesero toma tu orden | La API recibe una petición HTTP |
| La cocina prepara la comida | El servidor (backend) procesa la lógica |
| Te traen el plato | La API devuelve una respuesta JSON |

En este proyecto, cuando presionas "Simular Race Condition", tu navegador le está diciendo a la API: *"Oye, quiero agendar una cita con estos datos"*. La API procesa y responde.

**En Python sería algo como:**
```python
import requests

respuesta = requests.post(
    "http://localhost:3000/api/book-appointment",
    json={
        "doctorId": 1,
        "patientId": 3,
        "date": "2026-05-28",
        "time": "10:00:00"
    }
)
print(respuesta.json())
```

### ¿Qué es una base de datos?

Es una **hoja de cálculo gigante** pero más poderosa. En lugar de Excel, usamos PostgreSQL. Los datos están organizados en **tablas** (como pestañas de Excel):

| Tabla `doctors` | | Tabla `patients` | | Tabla `appointments` | |
|---|---|---|---|---|---|
| id | name | id | name | id | doctor_id | patient_id | date |
| 1 | Dr. Carlos | 1 | Juan Pérez | 1 | 1 | 1 | 2026-05-28 |

### ¿Qué es concurrencia?

Es cuando **dos cosas pasan al mismo tiempo**. Imagina dos personas tratando de entrar por una puerta que solo abre para una persona a la vez. Si ambas empujan al mismo tiempo, ambas pasan. Eso es una **condición de carrera** (race condition). En nuestro hospital: dos secretarias agendando al mismo tiempo para el mismo médico.

### ¿Frontend vs Backend?

| Frontend (lo que ves) | Backend (lo que no ves) |
|---|---|
| Lo que se ve en el navegador | El servidor, la base de datos |
| Botones, tablas, colores | Lógica, validaciones, almacenamiento |
| React + Tailwind (este proyecto) | Next.js API + Supabase/PostgreSQL |
| Es como la **interface gráfica** de un programa Python (si usaras Tkinter) | Es como las **funciones** que procesan datos |

---

## 2. El viaje de una petición: del clic a la base de datos

```
HACES CLIC en "Simular Race Condition"
            │
            ▼
┌──────────────────────────────┐
│      FRONTEND (navegador)    │
│   ConcurrencySimulator.tsx   │
│                              │
│  Crea 10 peticiones fetch()  │
│  y las lanza con             │
│  Promise.all()               │  ← como un for en paralelo
└──────────┬───────────────────┘
           │  10 peticiones HTTP
           ▼
┌──────────────────────────────┐
│      BACKEND (servidor)      │
│  POST /api/book-appointment  │
│                              │
│  Por cada petición:          │
│  1. CHECK: ¿Horario libre?   │
│  2. Espera 1.5 segundos      │
│  3. USE: Inserta en BD       │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│   POSTGRESQL (Supabase)      │
│                              │
│  - Crea la cita en la tabla  │
│  - Si hay UNIQUE constraint, │
│    rechaza duplicados        │
└──────────────────────────────┘
```

### Diagrama del problema TOCTOU

```
TIEMPO → 0.00s       0.01s                 1.50s       1.51s
          │            │                      │           │
Req 1 ────┤ CHECK ────┤ (esperando...) ──────┤ USE ──────┤ ✓ Creada
          │            │                      │           │
Req 2 ────┤ CHECK ────┤ (esperando...) ──────┤ USE ──────┤ ✓ Creada
          │            │                      │           │
          └──── Ambas vieron "libre" ─────────┘ Ambos crean → 🚨 DUPLICADO
```

---

## 3. Traducción Python → TypeScript/React

### Variables y tipos

```python
# Python - sin tipos explícitos
nombre = "Juan"
edad = 25
```

```typescript
// TypeScript - con tipos explícitos
const nombre: string = "Juan";
const edad: number = 25;
```

> Así como en Python dices `nombre: str = "Juan"` (con type hints), en TypeScript es `nombre: string = "Juan"`. La diferencia es que TypeScript **obliga** a usarlos.

### Funciones

```python
# Python
def sumar(a, b):
    return a + b
```

```typescript
// TypeScript
function sumar(a: number, b: number): number {
    return a + b;
}

// O en forma de flecha (arrow function) - es muy usada aquí:
const sumar = (a: number, b: number): number => {
    return a + b;
};
```

> Las **arrow functions** `() => {}` son como `lambda` en Python pero más potentes. Se usan en todo el proyecto.

### Listas y bucles

```python
# Python - lista y for
pacientes = ["Juan", "Maria", "Pedro"]
for p in pacientes:
    print(p)

# List comprehension
nombres_mayus = [p.upper() for p in pacientes]
```

```typescript
// TypeScript
const pacientes: string[] = ["Juan", "Maria", "Pedro"];
pacientes.forEach(p => console.log(p));

// .map() es como list comprehension
const nombresMayus = pacientes.map(p => p.toUpperCase());
```

> `.map()` es como `[expresion for elemento in lista]` en Python, `.filter()` es como `[x for x in lista if condicion]`.

### Condicionales

```python
# Python
if duplicados > 0:
    print("Hay duplicados")
else:
    print("Todo bien")
```

```typescript
// TypeScript - igual pero con llaves
if (duplicados > 0) {
    console.log("Hay duplicados");
} else {
    console.log("Todo bien");
}
```

### Async / Await

```python
# Python - async/await
import asyncio

async def obtener_datos():
    respuesta = await hacer_peticion()
    return respuesta
```

```typescript
// TypeScript - es casi idéntico
async function obtenerDatos() {
    const respuesta = await hacerPeticion();
    return respuesta;
}
```

> **Dato clave:** En Python usas `asyncio.gather()` para ejecutar varias tareas en paralelo. Aquí se usa `Promise.all()`. Son equivalentes:

```python
# Python
resultados = await asyncio.gather(tarea1(), tarea2(), tarea3())
```

```typescript
// TypeScript
const resultados = await Promise.all(tarea1(), tarea2(), tarea3());
```

### Objetos / Diccionarios

```python
# Python - diccionario
cita = {
    "medico_id": 1,
    "paciente_id": 3,
    "fecha": "2026-05-28"
}
print(cita["medico_id"])
```

```typescript
// TypeScript - objeto, se accede igual
const cita = {
    medico_id: 1,
    paciente_id: 3,
    fecha: "2026-05-28"
};
console.log(cita.medico_id);  // con punto también
```

### Componentes (React) vs Python

Esto es **lo más diferente**. En React, la interfaz se construye con **componentes**: funciones que devuelven HTML.

```python
# Python - Imagina que pudieras hacer esto:
def Boton(texto, al_hacer_clic):
    return <button onClick={al_hacer_clic}>{texto}</button>
# Esto NO es Python válido, es para la analogía
```

```typescript
// TypeScript - React, esto SÍ es válido
function Boton({ texto, alHacerClic }: { texto: string; alHacerClic: () => void }) {
    return <button onClick={alHacerClic}>{texto}</button>;
}
```

**JSX** es la mezcla de HTML y JavaScript que ves en los `return`. Lo que está entre `< >` parece HTML pero puede tener variables y lógica dentro de `{}`.

### useState (el estado)

```python
# Python - sería como una variable global que al cambiar, redibuja todo
# Pero en Python no hay equivalente directo
contador = 0  # si cambias esto, la pantalla no se actualiza sola

def incrementar():
    global contador
    contador += 1
```

```typescript
// TypeScript/React
const [contador, setContador] = useState(0);
// contador = el valor actual
// setContador = la función para cambiarlo
// Cuando llamas setContador(5), React automáticamente vuelve a dibujar la pantalla

const incrementar = () => {
    setContador(contador + 1);
};
```

> Piensa en `useState` como una variable especial que, cuando cambia, le dice a React: *"Oye, actualiza la pantalla porque algo cambió"*.

### useEffect

```python
# Python - sería como: "ejecuta esto cuando pase algo"
# Por ejemplo, al iniciar el programa:
import sqlite3

def al_inicio():
    conexion = sqlite3.connect("basededatos.db")
    datos = conexion.execute("SELECT * FROM tabla").fetchall()
    return datos

datos_iniciales = al_inicio()
```

```typescript
// TypeScript/React
useEffect(() => {
    // Esto se ejecuta UNA SOLA VEZ cuando el componente aparece en pantalla
    cargarDatosIniciales();
}, []);  // ← el [] vacío significa "solo una vez al inicio"
```

> Es como un `if __name__ == "__main__"`: código que se ejecuta al arrancar.

---

## 4. Recorrido guiado por los archivos clave

### 4.1 El punto de entrada: `page.tsx`

Este archivo es como tu `main.py`. Es lo primero que se ejecuta cuando abres la página.

```typescript
"use client";  // ← Esto le dice a Next.js que esto corre en el navegador

import React, { useState, useEffect, useCallback } from "react";
// ↑ Como from react import useState, useEffect
// useState = crear variables especiales
// useEffect = ejecutar código al iniciar

import { supabase } from "@/lib/supabase";
// ↑ Como from lib.supabase import supabase
// Es la conexión a la base de datos

export default function Home() {
    // ↑ Esta es la función principal. Todo lo que devuelva
    // aparecerá en pantalla.

    // --- VARIABLES DE ESTADO ---
    // Cada una es como una variable global que al cambiar,
    // actualiza la pantalla automáticamente

    const [doctors, setDoctors] = useState<Doctor[]>([]);
    // doctors = lista de médicos (inicia vacía)
    // setDoctors = función para actualizar la lista

    const [loading, setLoading] = useState<boolean>(true);
    // loading = True al inicio, False cuando termine de cargar

    // --- useEffect: al iniciar ---
    useEffect(() => {
        initializeLaboratory();  // Carga los datos iniciales
    }, [initializeLaboratory]);

    // --- LO QUE SE DIBUJA EN PANTALLA ---
    // El return es como el HTML que verás en el navegador
    return (
        <main className="...">
            {/* Esto es JSX: parece HTML pero vive dentro de JavaScript */}
            <h1>Hospital General</h1>
            {/* ... más componentes aquí */}
        </main>
    );
}
```

### 4.2 El simulador de concurrencia: `ConcurrencySimulator.tsx`

Este archivo contiene el panel donde configuras y lanzas la simulación.

```typescript
// Es como definir una función que recibe parámetros:
// Python: def ConcurrencySimulator(doctors, patients, hasConstraint):
export default function ConcurrencySimulator({
    doctors,
    patients,
    hasConstraint,
    testNumber,
    onSimulationStart,
    onSimulationComplete,
    onRefreshData,
}: ConcurrencySimulatorProps) {

    // --- VARIABLES DE ESTADO DEL SIMULADOR ---
    const [selectedDoctorId, setSelectedDoctorId] = useState<number>(0);
    // selectedDoctorId = el médico que elegiste en el menú
    // setSelectedDoctorId = lo cambia cuando seleccionas otro

    const [concurrencyLevel, setConcurrencyLevel] = useState<number>(5);
    // Cuántas peticiones enviar en paralelo

    // --- LA FUNCIÓN QUE EJECUTA LA SIMULACIÓN ---
    const handleSimulate = async () => {
        // async = esta función usa await (como async def en Python)
        
        setSimulating(true);
        
        // PASO 1: Crear las peticiones (como crear una lista de tareas)
        const requests = [];
        for (let i = 0; i < concurrencyLevel; i++) {
            requests.push(
                fetch("/api/book-appointment", {  // ← llama a la API
                    method: "POST",
                    body: JSON.stringify({ ... }),  // ← los datos
                })
            );
        }
        // ↑ Esto crea concurrencyLevel peticiones, pero NO las ejecuta aún

        // PASO 2: Lanzar todas EN PARALELO
        // ¡Esto es CLAVE para el problema de concurrencia!
        const responses = await Promise.all(requests);
        // ↑ Promise.all() es como asyncio.gather() en Python
        // Lanza todas las peticiones simultáneamente

        // PASO 3: Procesar resultados
        const results = await Promise.all(
            responses.map(r => r.json())
        );
        // ↑ Convierte cada respuesta HTTP en JSON (como r.json() en Python)

        // PASO 4: Verificar en la BD cuántos se crearon realmente
        const { data: physicalAppointments } = await supabase
            .from("appointments")
            .select("id")
            .eq("doctor_id", selectedDoctorId)
            .eq("appointment_date", selectedDate)
            .eq("appointment_time", selectedTime);
        // ↑ Esto es: SELECT id FROM appointments WHERE doctor_id = ? AND ...
        // Equivalente en Python:
        // cursor.execute("SELECT id FROM appointments WHERE doctor_id = ?", (id,))

        // PASO 5: Calcular métricas
        const duplicateCount = totalPhysicalRows > 1 ? totalPhysicalRows - 1 : 0;
        // Si hay más de 1 fila, las extras son duplicados
        
        // PASO 6: Guardar el experimento
        await fetch("/api/simulations", { method: "POST", body: JSON.stringify({...}) });
    };
```

### 4.3 El endpoint crítico: `book-appointment/route.ts`

Este es el **corazón del problema**. Es el código del backend que procesa cada reserva.

```typescript
// Si esto fuera Python, sería algo como:
// @app.post("/api/book-appointment")
// async def book_appointment(datos):
//     ...

export async function POST(request: Request) {
    const { doctorId, patientId, date, time, delayMs } = await request.json();
    // ↑ Como request.get_json() en Flask

    const logs = [];  // Para registrar lo que pasa

    // --- PASO A: CHECK (Verificar disponibilidad) ---
    // SELECT id FROM appointments WHERE doctor_id=? AND date=? AND time=?
    const { data: existing } = await supabase
        .from("appointments")
        .select("id")
        .eq("doctor_id", doctorId)
        .eq("appointment_date", date)
        .eq("appointment_time", time);

    if (existing && existing.length > 0) {
        // Si ya existe una cita → rechazar
        return Response.json({
            success: false,
            error: "El médico ya tiene una cita en esta fecha y hora."
        }, { status: 400 });
    }

    // --- PASO B: DELAY (Ventana de vulnerabilidad) ---
    await new Promise(resolve => setTimeout(resolve, delayMs || 1500));
    // ↑ Artificial: espera 1.5 segundos antes de insertar
    //   En Python sería: await asyncio.sleep(1.5)
    //   Esto es LO QUE CAUSA el problema. Mientras espera,
    //   otras peticiones también están verificando y ven "libre"

    // --- PASO C: USE (Insertar la cita) ---
    const { error: insertError } = await supabase
        .from("appointments")
        .insert({ doctor_id: doctorId, patient_id: patientId, ... });

    if (insertError?.code === "23505") {
        // Código 23505 = violación de UNIQUE constraint
        // PostgreSQL lo rechazó atómicamente
        return Response.json({ success: false, error: "Conflicto de integridad" }, { status: 409 });
    }

    return Response.json({ success: true, appointmentId: newAppointment[0].id });
}
```

**Diagrama del problema:**

```
PETICIÓN 1:  [CHECK: ¿libre? → SÍ]  →  [ESPERA 1.5s]  →  [USE: INSERTAR]  →  ✓ Creada
PETICIÓN 2:  [CHECK: ¿libre? → SÍ]  →  [ESPERA 1.5s]  →  [USE: INSERTAR]  →  ✓ Creada
                                ↑                                            ↑
                        Ambas llegaron aquí                   Ambas llegan aquí también
                        antes de que alguien                  porque el CHECK no bloqueó
                        ejecutara el USE                      la inserción
                                        🚨 ¡DUPLICADO!
```

### 4.4 La base de datos: `schema.sql`

No te asustes por el SQL, es más simple de lo que parece:

```sql
CREATE TABLE doctors (
    id SERIAL PRIMARY KEY,     -- Número único para cada médico
    name VARCHAR(255) NOT NULL, -- Nombre del médico
    specialty VARCHAR(255) NOT NULL  -- Especialidad
);

CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,                    -- Número de cita
    doctor_id INT NOT NULL,                   -- ID del médico (FK)
    patient_id INT NOT NULL,                  -- ID del paciente (FK)
    appointment_date DATE NOT NULL,           -- Fecha de la cita
    appointment_time TIME NOT NULL,           -- Hora de la cita
    created_at TIMESTAMPTZ DEFAULT NOW()      -- Cuándo se creó
);
```

**Importante:** `appointments` NO tiene una restricción que impida meter dos veces el mismo `(doctor_id, date, time)`. Eso es lo que permite los duplicados. La solución es agregar:

```sql
ALTER TABLE appointments ADD CONSTRAINT unique_doctor_appointment 
UNIQUE (doctor_id, appointment_date, appointment_time);
```

> Esto le dice a PostgreSQL: *"No permitas dos filas con el mismo médico, misma fecha y misma hora"*. A partir de ahí, si dos secretarias intentan agendar el mismo turno, la base de datos rechaza automáticamente la segunda.

---

## 5. Glosario de términos

| Término | Significado | Analogía Python |
|---|---|---|
| **API** | Interfaz para que dos programas se comuniquen (ej: frontend ↔ backend) | `requests.post(url, json=data)` |
| **Endpoint** | Una URL específica de la API (ej: `/api/book-appointment`) | Una ruta en Flask: `@app.post("/ruta")` |
| **JSON** | Formato para intercambiar datos | `json.dumps({"clave": "valor"})` |
| **Fetch** | Función para hacer peticiones HTTP desde el navegador | `requests.post()` en Python |
| **Promise.all()** | Ejecuta varias promesas en paralelo y espera todas | `asyncio.gather()` |
| **useState** | Variable especial que al cambiar, redibuja la pantalla | No hay equivalente directo |
| **useEffect** | Código que se ejecuta automáticamente (al inicio o cuando algo cambia) | `if __name__ == "__main__"` |
| **JSX** | HTML escrito dentro de JavaScript/TypeScript | No existe en Python |
| **Componente** | Una función que devuelve parte de la interfaz | Como una función que devuelve HTML |
| **Props** | Los parámetros que recibe un componente | Los argumentos de una función |
| **TypeScript** | JavaScript con tipos (como Python type hints pero obligatorios) | `def suma(a: int, b: int) -> int:` |
| **TOCTOU** | Patrón de error: verificas algo y luego lo usas, pero algo cambió entre medio | Como revisar si hay leche en el refri, ir a buscar un vaso, y al volver alguien la terminó |
| **Race Condition** | Dos procesos compiten por el mismo recurso y el resultado depende de quién llega primero | Dos personas tratando de estacionar en el mismo espacio al mismo tiempo |
| **UNIQUE Constraint** | Regla en la BD que impide valores duplicados en una o más columnas | Forzar que no haya dos filas con el mismo ID |
| **PostgreSQL** | Sistema de base de datos (como MySQL o SQLite) | `import sqlite3` pero mucho más potente |
| **Supabase** | Servicio que da una base de datos PostgreSQL en la nube | Como tener un SQLite en internet |
| **Tailwind CSS** | Forma de escribir estilos (colores, márgenes) directamente en el HTML | No existe en Python; es como escribir CSS pero abreviado |
| **Arrow Function** | Forma corta de escribir funciones: `() => {}` | `lambda` pero más potente |
| **Async/Await** | Para operaciones que toman tiempo (esperar respuestas de red, BD) | `async def / await` en Python |

---

## Resumen: El flujo completo en español simple

```
1. Abres la página → ves el laboratorio (VS Code dark) o el agendador (hospital)
2. En el laboratorio, eliges:
   - Un médico, una fecha, una hora
   - Cuántas peticiones enviar al mismo tiempo (ej: 10)
3. Presionas "Simular Race Condition"
4. El navegador lanza 10 peticiones a la API simultáneamente
5. Cada petición en el backend:
   a. Pregunta a la BD: "¿Hay cita aquí?" → todas ven "no"
   b. Espera 1.5 segundos (la ventana vulnerable)
   c. Inserta la cita en la BD
6. Como todas vieron "no" en el paso (a), todas insertan → 10 citas para el mismo turno
7. El sistema cuenta los duplicados: 9 de 10 son basura
8. Tasa de error: 90%
```

**La solución:** Activar la protección anti-duplicados. Esto agrega una regla en la BD que dice "no se permiten dos citas iguales". Cuando vuelves a hacer la prueba, la BD permite solo la primera y rechaza las otras 9 automáticamente.
