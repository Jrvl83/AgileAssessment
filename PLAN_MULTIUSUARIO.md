# Plan de Implementación — Multi-usuario con Firebase Auth

## Objetivo

Transformar el panel admin de un acceso único global a un sistema multi-tenant donde:
- El **super admin** crea cuentas manualmente y ve todos los workspaces globalmente.
- Cada **workspace admin** entra con su propio email + contraseña y ve únicamente sus equipos y resultados.
- No existe registro público — la puerta de entrada la controla el super admin.

---

## Flujo completo para dar acceso a un cliente

```
1. Cliente solicita acceso y proporciona su email
2. Super admin entra al panel → pestaña "Usuarios" → ingresa nombre + email
3. Clic en "Crear usuario"
4. Firebase envía automáticamente al cliente un correo con link para establecer su contraseña
5. Cliente abre el link, define su contraseña y entra a /admin
6. Ve su propio panel vacío, crea sus equipos y comienza a usar la herramienta
```

---

## Configuración manual en Firebase Console (1 sola vez)

Pasos que el super admin debe realizar antes de la implementación:

1. Ir a **Authentication → Sign-in method** y activar el proveedor **Email/Password**.
2. Ir a **Authentication → Users** y crear su propia cuenta de super admin (email + contraseña).
3. En **Firestore**, crear manualmente el documento:
   ```
   usuarios/{uid_del_super_admin}
   {
     nombre: "Tu nombre",
     email: "tu@email.com",
     role: "super_admin",
     activo: true
   }
   ```

---

## Cambios en el código

### 1. `admin.html` — Reemplazar el login actual

- Eliminar el modal de contraseña hardcodeada (`AgileAdmin`).
- Añadir formulario de login con email + contraseña usando Firebase Auth (`signInWithEmailAndPassword`).
- Al autenticarse, leer el documento `usuarios/{uid}` para determinar el rol y estado.
- Si `activo: false` → mostrar mensaje "Cuenta suspendida. Contacta al administrador." y cerrar sesión.
- Si `role === 'super_admin'` → acceso global, ver todos los datos.
- Si `role === 'admin'` → acceso filtrado, ver solo sus equipos y respuestas.

---

### 2. `admin.html` — Nueva pestaña "Usuarios" (solo super admin)

**Formulario para crear usuario:**
- Campos: nombre + email del nuevo workspace admin.
- Al hacer clic en "Crear usuario":
  1. Crea la cuenta en Firebase Auth usando una instancia secundaria de la app (sin cerrar la sesión del super admin).
  2. Guarda el documento en `usuarios/{uid}` con `{ nombre, email, role: 'admin', activo: true, creadoEn: timestamp }`.
  3. Firebase envía automáticamente el correo de establecimiento de contraseña al cliente.
  4. El usuario aparece en la lista con estado "Activo".

**Lista de usuarios existentes:**

| Columna | Descripción |
|---------|-------------|
| Nombre | Nombre del workspace admin |
| Email | Email de acceso |
| Estado | Activo / Suspendido |
| Creado | Fecha de creación |
| Acciones | Suspender / Reactivar / Eliminar / Reenviar invitación |

**Acciones disponibles:**

| Acción | Qué hace | Reversible |
|--------|----------|------------|
| **Suspender** | Cambia `activo: false` en Firestore. El usuario ve "Cuenta suspendida" al intentar entrar. | Sí |
| **Reactivar** | Cambia `activo: true`. El usuario recupera acceso inmediatamente. | — |
| **Eliminar** | Borra la cuenta de Firebase Auth + el documento en `usuarios`. El acceso queda bloqueado definitivamente. | No |
| **Reenviar invitación** | Dispara nuevamente el correo de restablecimiento de contraseña via Firebase. | — |

> **Nota:** Eliminar una cuenta **no borra los datos del workspace** (equipos, respuestas, ciclos, planes). Solo bloquea el acceso. Los datos quedan en Firestore y son visibles para el super admin.

---

### 3. `admin.html` — Filtrado de datos por workspace

- Al **crear un equipo** → se guarda `ownerId: currentUser.uid`.
- Al **crear un ciclo** → se guarda `ownerId: currentUser.uid`.
- Al **cargar datos** → si el rol es `admin`, todas las queries filtran por `ownerId === currentUser.uid`.
- Si el rol es `super_admin` → sin filtro, ve todos los datos de todos los workspaces.
- En la vista del super admin, cada tarjeta de equipo muestra a qué workspace admin pertenece.

---

### 4. `assessment-agile.html` — Filtro por workspace en la URL

- Si la URL incluye `?workspaceId=xxx` → el formulario muestra solo los equipos de ese workspace.
- Si no hay parámetro → muestra todos los equipos activos (compatibilidad con el uso actual).
- Los QR generados desde el panel admin incluirán automáticamente el `workspaceId` en la URL.

---

## Cambios en Firestore

### Colección nueva: `usuarios`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `nombre` | string | Nombre del workspace admin |
| `email` | string | Email de acceso |
| `role` | string | `'super_admin'` o `'admin'` |
| `activo` | boolean | `true` = acceso permitido, `false` = suspendido |
| `creadoEn` | timestamp | Fecha de creación de la cuenta |

### Colecciones modificadas

| Colección | Campo nuevo | Descripción |
|-----------|-------------|-------------|
| `equipos` | `ownerId` | UID del workspace admin que creó el equipo |
| `ciclos` | `ownerId` | UID del workspace admin que creó el ciclo |
| `respuestas` | Sin cambios | Ya está vinculada al equipo → al owner |
| `planes` | Sin cambios | Ya está vinculada al equipo → al owner |

---

## Lo que NO cambia

- El formulario público (`assessment-agile.html`) sigue sin login para participantes.
- La metodología del assessment, preguntas, scoring y niveles de madurez.
- La estructura de `respuestas` en Firestore.
- La exportación PDF/CSV, el Plan de Acción y la pestaña Evolución.
- Toda la lógica de recomendaciones.

---

## Migración de datos existentes

Los datos actuales (equipos, respuestas, ciclos) son de prueba y **se eliminarán** antes de la implementación. No se requiere migración.

---

## Estado

| Ítem | Estado |
|------|--------|
| Configuración Firebase Console (manual) | ✅ Completado |
| Reemplazar login con Firebase Auth | ✅ Completado |
| Pestaña "Usuarios" con crear / suspender / reactivar / eliminar | ✅ Completado |
| Filtrado de datos por ownerId | ✅ Completado |
| ownerId en equipos y ciclos al crearlos | ✅ Completado |
| Filtro por workspaceId en assessment-agile.html | ✅ Completado |
| QR con workspaceId incluido | ✅ Completado |
