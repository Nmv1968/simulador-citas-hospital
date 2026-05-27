# Plan de Implementación Académico: Simulación de Concurrencia e Integridad en Citas Médicas

Este proyecto es un **laboratorio experimental académico** diseñado para que los estudiantes descubran, midan y solucionen una vulnerabilidad clásica de concurrencia (_race condition_) en el agendamiento de citas médicas, utilizando una **única tabla física** de base de datos.

---

## 1. Concepto de Laboratorio y Flujo Académico

Para lograr el objetivo de **descubrimiento de errores**, el sistema operará bajo una única tabla `appointments`. Los estudiantes podrán interactuar con el esquema de la base de datos directamente desde el frontend mediante un panel de control del administrador:

### Flujo de Aprendizaje:

1. **Estado Inicial (Vulnerable)**:
   - La tabla `appointments` **no tiene** ninguna restricción de unicidad (`UNIQUE constraint`) a nivel de base de datos.
   - El código de Next.js realiza la validación clásica en la aplicación: _"Buscar si existe -> Esperar delay artificial -> Insertar"_.
   - **Experimento**: El estudiante lanza la simulación concurrente (ej. 10 peticiones al mismo tiempo).
   - **Descubrimiento**: Se generan citas duplicadas para el mismo médico a la misma hora en la tabla única. Las métricas muestran un alto porcentaje de duplicidad.

2. **Intento de Parche Directo**:
   - El estudiante intenta activar la restricción de base de datos presionando _"Aplicar Restricción UNIQUE"_.
   - **Descubrimiento de Integridad Corrompida**: PostgreSQL **rechazará** la aplicación de la restricción porque ya existen filas duplicadas en la tabla. Esto enseña una lección crítica: _"No puedes asegurar la integridad en una base de datos que ya ha sido corrompida"_.

3. **Ciclo de Corrección**:
   - El estudiante debe presionar _"Limpiar Base de Datos"_ (ejecuta un `TRUNCATE` de citas) para purgar los datos inconsistentes.
   - Presiona _"Aplicar Restricción UNIQUE"_ nuevamente; esta vez se aplica de manera exitosa en PostgreSQL.

4. **Estado Corregido (Integridad Garantizada)**:
   - Con la restricción UNIQUE activa, el estudiante vuelve a lanzar la simulación concurrente.
   - **Resultado**: A pesar de que el código sigue teniendo el retraso artificial, PostgreSQL bloquea de forma atómica todas las inserciones concurrentes sobrantes. Solo una tiene éxito, y las otras 9 fallan limpiamente con un error de violación de restricción única (`code: 23505`). La tasa de duplicidad cae a **0%**.

---

## 2. Base de Datos: Esquema de Supabase SQL

El esquema inicial se creará **sin** la restricción UNIQUE en `appointments`. Se proveerán scripts para alternar esta restricción dinámicamente.

```sql
-- 1. Tabla de Médicos (Doctors)
CREATE TABLE doctors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255) NOT NULL
);

-- 2. Tabla de Pacientes (Patients)
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- 3. Tabla de Citas (Inicialmente sin UNIQUE)
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    doctor_id INT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id INT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de Registro de Simulaciones (Métricas Históricas)
CREATE TABLE simulation_results (
    id SERIAL PRIMARY KEY,
    test_number INT NOT NULL,
    concurrent_requests INT NOT NULL,
    duplicates_generated INT NOT NULL,
    execution_time_ms INT NOT NULL,
    mode VARCHAR(50) NOT NULL, -- 'Vulnerable' o 'Corregido'
    total_requests INT NOT NULL,
    successful_appointments INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserts de Datos Iniciales (Semillas)
INSERT INTO doctors (name, specialty) VALUES
('Dr. Carlos Mendoza', 'Cardiología'),
('Dra. Laura Gómez', 'Pediatría'),
('Dr. Andrés Silva', 'Neurología'),
('Dra. Sofía Rivas', 'Dermatología');

INSERT INTO patients (name) VALUES
('Juan Pérez'),
('María Rodríguez'),
('Pedro Gómez'),
('Ana Martínez'),
('Luis Fernández');
```

---

## 3. Endpoints de la API (`Route Handlers` o `Server Actions`)

Para la simulación académica, implementaremos los siguientes endpoints:

1. `/api/book-appointment` (POST):
   - Recibe: `doctorId`, `patientId`, `date`, `time`, y un `delayMs` (predeterminado en `1500ms`).
   - Lógica:
     1. Consulta en la DB si ya existe una cita:
        `SELECT id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ?`
     2. Si existe en la consulta inicial, responde inmediatamente con un error de aplicación (`400 Bad Request` - "El horario ya está ocupado").
     3. Si no existe, realiza un retraso artificial: `await new Promise(r => setTimeout(r, delayMs))`.
     4. Intenta insertar:
        `INSERT INTO appointments (doctor_id, patient_id, appointment_date, appointment_time) VALUES (...)`
     5. **Captura de Excepciones de DB**:
        Si falla por restricción de base de datos (`code: 23505`), responde con un error de base de datos (`409 Conflict` - "Conflicto de integridad: Bloqueado por restricción UNIQUE de PostgreSQL").

2. `/api/db-admin` (GET/POST):
   - **GET**: Verifica si la restricción UNIQUE existe actualmente consultando las tablas del sistema de PostgreSQL:
     ```sql
     SELECT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'unique_doctor_appointment'
     ) AS has_constraint;
     ```
   - **POST**: Permite alternar la restricción:
     - Activar: `ALTER TABLE appointments ADD CONSTRAINT unique_doctor_appointment UNIQUE (doctor_id, appointment_date, appointment_time);`
     - Desactivar: `ALTER TABLE appointments DROP CONSTRAINT IF EXISTS unique_doctor_appointment;`
     - _Nota_: Si al activar falla por registros duplicados existentes, retorna un error descriptivo con código `23505` para que los estudiantes entiendan que deben limpiar la DB primero.

3. `/api/reset-data` (POST):
   - Elimina todas las citas de la tabla para reiniciar el laboratorio:
     `TRUNCATE TABLE appointments CASCADE;`

4. `/api/simulations` (GET/POST):
   - Permite listar y guardar los registros históricos de las simulaciones científicas realizadas.

---

## 4. Diseño del Dashboard Académico Premium

La interfaz se centrará en un diseño de **consola científica de laboratorio** con TailwindCSS y tema oscuro:

- **Panel de Control del Esquema (Base de Datos)**:
  - Muestra visualmente el estado actual del esquema (una luz de estado: 🔴 **Vulnerable (Sin UNIQUE)** o 🟢 **Protegido (UNIQUE Activo)**).
  - Botones interactivos para aplicar/remover la restricción de base de datos, con alertas si falla por duplicidad de datos.
  - Botón para vaciar la base de datos rápidamente.

- **Panel de Simulación de Concurrencia**:
  - Selectores interactivos para escoger Médico, Fecha, Hora, y número de peticiones concurrentes (5, 10, 20).
  - Botón de disparo con animación de carga de alta gama.

- **Panel de Métricas en Tiempo Real (KPIs)**:
  - Cantidad total de solicitudes lanzadas en paralelo.
  - Citas físicas creadas (haciendo un recuento directo de la DB al final).
  - Cantidad de registros duplicados detectados (recuento de filas idénticas agrupadas por médico, fecha y hora).
  - Porcentaje de Inconsistencia de Datos.
  - Tiempo promedio de respuesta.

- **Tabla de Evidencia Experimental**:
  - Registro cronológico de todas las pruebas realizadas, ideal para que los alumnos lo exporten o lo capturen para sus reportes de laboratorio.

- **Sección de Explicación Académica (Technical Explainer)**:
  - Un panel colapsable e interactivo que explica visualmente la _race condition_ (línea de tiempo paso a paso) y por qué la solución a nivel de base de datos es la única garantía de atomicidad.

---

## 5. Plan de Verificación de Laboratorio

1. **Paso 1**: Entrar con la base de datos limpia y restricción UNIQUE desactivada.
2. **Paso 2**: Simular 10 peticiones concurrentes.
   - _Esperado_: Éxito en múltiples inserciones de citas idénticas. Muestra un porcentaje de duplicidad alto (ej. 90%).
3. **Paso 3**: Intentar activar la restricción UNIQUE con los duplicados creados.
   - _Esperado_: Mensaje de error claro de PostgreSQL bloqueando la acción por inconsistencia previa.
4. **Paso 4**: Limpiar la base de datos y activar la restricción UNIQUE.
   - _Esperado_: Éxito al aplicar la restricción. El estado cambia a 🟢 **Protegido**.
5. **Paso 5**: Lanzar la misma simulación concurrente de 10 peticiones.
   - _Esperado_: Solo una cita se crea en la base de datos física. El dashboard reporta **0% de duplicados** y detalla los errores de violación de clave única en las peticiones denegadas.
