# Guía Completa de Laboratorio: Simulador de Concurrencia e Integridad de Datos

¡Felicidades! Hemos completado el desarrollo del prototipo de simulación académica. El código ha sido estructurado de forma modular, con comentarios altamente descriptivos y educativos para que cualquier estudiante de ingeniería de software pueda comprender los conceptos de **Race Conditions**, el antipatrón **TOCTOU**, e integridad de datos en bases de datos relacionales.

---

## 1. Estructura Final del Proyecto

El proyecto está organizado en la carpeta `/agendador-de-citas` con la siguiente distribución simplificada y didáctica:

```text
/agendador-de-citas
├── sql/
│   └── schema.sql                # Script SQL completo (Tablas, Semillas y Funciones DDL)
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Contenedor global de Next.js, fuentes y metadatos SEO
│   │   ├── globals.css           # Estilos de Tailwind CSS v4 y scrollbars retro oscuros
│   │   ├── page.tsx              # Ensamblador principal de la pantalla de laboratorio
│   │   └── api/
│   │       ├── book-appointment/
│   │       │   └── route.ts      # Endpoint de reserva (Vulnerable/TOCTOU con delay)
│   │       ├── db-admin/
│   │       │   └── route.ts      # Endpoint para alternar UNIQUE y consultar catálogo
│   │       ├── reset-data/
│   │       │   └── route.ts      # Endpoint para purgar la tabla de citas
│   │       └── simulations/
│   │           └── route.ts      # Endpoint para registrar el historial de experimentos
│   ├── components/
│   │   ├── TechnicalExplainer.tsx  # Acordeón de teoría (Race Condition, TOCTOU, UNIQUE)
│   │   ├── DbAdminPanel.tsx      # Panel de control de BD y consola SQL PostgreSQL
│   │   ├── ConcurrencySimulator.tsx # Configuración de reservas y disparo con Promise.all
│   │   ├── LogsConsole.tsx       # Terminal de logs simultáneos con milisegundos
│   │   ├── MetricsPanel.tsx      # Tarjetas analíticas de inconsistencia y APIs
│   │   ├── AppointmentsTable.tsx # Listado físico de citas en BD resaltando duplicados
│   │   └── ExperimentalResults.tsx # Bitácora de experimentos científicos acumulados
│   ├── lib/
│   │   └── supabase.ts           # Inicialización simple del cliente de Supabase
│   └── types/
│       └── index.ts              # Interfaces y contratos estáticos de TypeScript
├── .env.local                    # Configuración de variables de entorno para Supabase
├── package.json                  # Dependencias del proyecto
└── tsconfig.json                 # Configuración de TypeScript
```

---

## 2. Instrucciones de Instalación y Puesta en Marcha

Para desplegar y exponer este laboratorio localmente en una clase o exposición universitaria, siga estos sencillos pasos:

### Paso 1: Configurar Base de Datos en Supabase

1. Cree un proyecto gratuito en [Supabase](https://supabase.com).
2. Diríjase a la barra lateral izquierda y haga clic en **SQL Editor**.
3. Haga clic en **New query** (Nueva consulta).
4. Copie y pegue la totalidad del código dentro del archivo [/sql/schema.sql](file:///c:/Users/naimm/Develop/PersonalProjects/agendador-de-citas/sql/schema.sql) de este repositorio.
5. Presione el botón **Run** (Ejecutar) en la esquina superior derecha. Esto creará las tablas `doctors`, `patients`, `appointments`, `simulation_results`, insertará los médicos y pacientes semilla, y declarará las funciones de administración.

### Paso 2: Configurar Variables de Entorno en Next.js

1. En su panel de Supabase, vaya a **Project Settings** (icono de engranaje) -> **API**.
2. Copie la **Project URL** y la **anon public key**.
3. Abra el archivo [.env.local](file:///c:/Users/naimm/Develop/PersonalProjects/agendador-de-citas/.env.local) en el proyecto local y reemplace los valores correspondientes:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase-aqui
   ```

### Paso 3: Arrancar el Servidor Local

1. Abra su terminal preferida (como PowerShell) en la raíz del proyecto `c:\Users\naimm\Develop\PersonalProjects\agendador-de-citas`.
2. Ejecute el siguiente comando para iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
3. Abra su navegador web e ingrese a [http://localhost:3000](http://localhost:3000). ¡El laboratorio académico estará listo y conectado!

---

## 3. Pauta del Experimento: Guía de Demostración del Laboratorio

Para evidenciar la _race condition_ e integridad de datos ante una audiencia o alumnos, siga este guión experimental:

### Experimento 1: Evidenciar y Cuantificar la Race Condition (Vulnerable)

1. **Estado Inicial**: Asegúrese de que el estado de la base de datos sea 🔴 **Vulnerable (Sin Restricción UNIQUE)** en el panel de Base de Datos. _(Si no lo está, presione "Desactivar UNIQUE")_.
2. **Configuración de Reserva**: En el simulador, seleccione un médico (ej. _Dr. Carlos Mendoza_), una fecha y una hora (ej. _10:00 AM_).
3. **Nivel de Concurrencia**: Elija la cantidad de peticiones escribiendo el número deseado en el input numérico **"Personalizado"** (ej. **10 Solicitudes**) o use el botón rápido **"1 Solicitud"** para ver un flujo unitario exitoso sin concurrencia.
4. **Disparar Simulación**: Presione **"Simular Race Condition"**.
   - El sistema lanzará las peticiones HTTP en paralelo con `Promise.all`.
   - **Análisis de Consola**: En el terminal de eventos verá cómo todas las peticiones hacen su consulta de CHECK (Búsqueda) de forma solapada en un intervalo de pocos milisegundos. Todas ven el horario "LIBRE" ya que ninguna ha insertado aún.
   - **Análisis de Métricas**: El panel de métricas se encenderá mostrando la temida alerta: `⚠️ BASE DE DATOS INCONSISTENTE`. Verá una alta Tasa de Duplicidad (por ejemplo, si mandó 10 solicitudes, se habrán creado 10 citas en la base de datos física para el mismo médico a la misma hora).
   - **Verificación Física**: La tabla de citas mostrará las filas pintadas en rojo, con el badge `⚠️ Duplicado Físico (Conflicto)`. Se ha demostrado el problema de concurrencia TOCTOU de forma rotunda.

### Experimento 2: Evidenciar la Imposibilidad de Parchear con Datos Corruptos

1. **Intento de Corrección**: Con la tabla llena de citas duplicadas rojas, intente presionar el botón **"Activar UNIQUE (Corregir)"**.
2. **Resultado Esperado**: La consola PostgreSQL de la derecha se pintará en rojo con un mensaje de error detallado:
   `PostgreSQL rechazó la alteración: could not create unique index "unique_doctor_appointment" - DETAIL: Key (doctor_id, appointment_date, appointment_time)=(1, 2026-05-28, 10:00:00) is duplicated.`
   - **Lección Didáctica**: Este paso enseña a los estudiantes que **no es posible agregar restricciones de integridad a una base de datos que ya contiene datos corruptos**. Para sanear el sistema, primero debemos depurar el estado histórico.

### Experimento 3: Saneamiento y Garantía de Integridad (Corregido)

1. **Saneamiento**: Presione el botón **"Limpiar Citas"**. Confirme la acción. La base de datos ejecutará un `TRUNCATE` y vaciará las citas.
2. **Aplicar Parche**: Presione ahora **"Activar UNIQUE (Corregir)"**.
   - **Resultado**: La operación se ejecuta exitosamente. El estado de la base de datos cambia a 🟢 **Protegido (Restricción UNIQUE Activa)** y la consola PostgreSQL muestra el comando DDL completado.
3. **Disparar Simulación Protegida**: Vuelva a seleccionar el mismo médico, fecha y hora en el panel de control. Ingrese el mismo número de solicitudes en el input numérico personalizado (ej. **10 Solicitudes**) y presione **"Simular Race Condition"**.
   - **Análisis de Consola**: Verá el mismo solapamiento de procesos de verificación en milisegundos. Sin embargo, en el momento de la inserción, verá cómo **1 sola petición tiene éxito** y las otras 9 son rechazadas atómicamente con el mensaje:
     `🛑 ¡RECHAZADO POR POSTGRESQL! Violación de restricción UNIQUE (Código 23505)`.
   - **Análisis de Métricas**: Verá la alerta verde `🟢 INTEGRIDAD ABSOLUTA`. El contador de duplicados cae a **0** (0% de duplicidad) y el número de filas físicas creadas en la base de datos es de **exactamente 1**.
   - **Verificación Física**: La tabla de citas mostrará únicamente **1 fila verde** que representa la cita ganadora. La integridad ha quedado completamente resguardada a nivel físico.

---

## 4. Respuestas Técnicas para Explicación en Exposición

Cuando le pregunten detalles técnicos del prototipo durante la exposición, aquí tiene las bases conceptuales clave resumidas didácticamente:

1. **¿Qué es una Race Condition (Condición de Carrera)?**
   Es un escenario de procesamiento concurrente donde el estado final del sistema depende críticamente del orden temporal y el entrelazamiento de hilos paralelos independientes.

2. **¿Qué es el bug TOCTOU (Time-of-Check to Time-of-Use)?**
   Es el antipatrón en el cual la validación de un recurso (Time of Check) y su respectiva utilización/creación (Time of Use) no son una operación única y atómica. Entre el paso del check y el use, el estado validado cambia en segundo plano, invalidando la premisa inicial del software.

3. **¿Por qué la validación clásica en Backend (JS/Node) es insuficiente ante concurrencia?**
   Porque hilos paralelos ejecutan consultas de lectura no bloqueantes simultáneamente. Si una transacción no bloquea físicamente la lectura o no serializa el acceso antes de realizar la inserción, múltiples hilos comprobarán simultáneamente que el registro está "libre", superando las validaciones lógicas del código de la aplicación.

4. **¿Cómo la base de datos relacional y las restricciones UNIQUE solucionan esto?**
   PostgreSQL actúa como el único árbitro central de consistencia. Al declarar un índice UNIQUE, la inserción realiza internamente un bloqueo atómico sobre la tupla de índice correspondiente. El motor de base de datos ejecuta la escritura de manera completamente linealizada para la misma tupla única. Si una clave ya fue insertada, cualquier transacción paralela que intente registrar la misma clave será abortada de inmediato y lanzará una excepción que interrumpe la escritura redundante.
