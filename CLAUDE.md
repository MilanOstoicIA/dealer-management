# DealerHub — Sistema de Gestión para Concesionarios

## Stack
- Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui
- Supabase (database, storage) — CONECTADO
  - Proyecto: bfdgqhdurmctutqmvtpr (eu-west-1)
  - URL: https://bfdgqhdurmctutqmvtpr.supabase.co
  - Storage bucket: vehicle-photos (público)
- Idioma de la interfaz: español solamente

## Comandos
- `npm run dev` — servidor de desarrollo
- `npm run build` — verificar que compila sin errores
- `npm run lint` — comprobar errores de código

## Reglas
- Todo el código en TypeScript estricto, nunca JavaScript
- Componentes con "use client" solo cuando sea necesario
- Usar shadcn/ui para todos los componentes de UI
- Nombres de variables y funciones en inglés, textos de interfaz en español
- Hacer commits descriptivos en español después de cada fase
- NO inventar APIs o props que no existan

## Estructura de carpetas
- app/ → páginas y rutas
- components/ui/ → componentes shadcn
- components/app/ → componentes propios del proyecto
- lib/ → utilidades y datos
  - lib/supabase.ts → cliente Supabase
  - lib/supabase-service.ts → CRUD y mappers snake_case↔camelCase
  - lib/store.tsx → Store centralizado (Context + useReducer) con sync a Supabase
  - lib/auth.tsx → Autenticación con verificación contra Supabase
  - lib/car-brands.ts → Base de datos de marcas/modelos para autocompletado
- types/ → tipos TypeScript

## Roles de usuario y permisos
- Admin: acceso total a todo
- Vendedor: vehículos, clientes, citas, ventas, foro (edita vehículos, clientes, citas, ventas)
- Mecánico: vehículos, clientes, citas (edita vehículos, clientes, citas)
- Recepcionista: clientes, citas, vehículos, foro (edita clientes, citas)
- Viewer: solo lectura en todo

## Credenciales de demo
- Admin: carlos.martinez@dealerhub.es / admin123
- Vendedor: laura.sanchez@dealerhub.es / 1234
- Mecánico: alejandro.perez@dealerhub.es / 1234
- Recepcionista: maria.gonzalez@dealerhub.es / 1234
- Viewer: viewer@dealerhub.es / viewer
