\# DealerHub — Sistema de Gestión para Concesionarios



\## Stack

\- Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui

\- Supabase (auth, database, storage) — todavía no conectado

\- Idioma de la interfaz: español solamente



\## Comandos

\- `npm run dev` — servidor de desarrollo

\- `npm run build` — verificar que compila sin errores

\- `npm run lint` — comprobar errores de código



\## Reglas

\- Todo el código en TypeScript estricto, nunca JavaScript

\- Componentes con "use client" solo cuando sea necesario

\- Usar shadcn/ui para todos los componentes de UI

\- Nombres de variables y funciones en inglés, textos de interfaz en español

\- Hacer commits descriptivos en español después de cada fase

\- Usar Context7 MCP para verificar APIs de librerías antes de usarlas

\- NO inventar APIs o props que no existan



\## Estructura de carpetas

\- app/ → páginas y rutas

\- components/ui/ → componentes shadcn

\- components/app/ → componentes propios del proyecto

\- lib/ → utilidades y datos

\- types/ → tipos TypeScript



\## Roles de usuario

\- Admin: acceso total

\- Vendedor: inventario, clientes, ventas

\- Mecánico: solo taller

\- Recepcionista: citas y clientes

