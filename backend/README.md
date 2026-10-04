# Backend — Terraza Premium

API REST del Sistema de Gestión Integral de Bar **Terraza Premium**.
Desarrollado por **Zenith Tech Studio** con **Spring Boot 3.3.x + Java 21 + Spring JDBC + PostgreSQL 15**.

## Stack tecnológico

- **Lenguaje:** Java 21 (LTS)
- **Framework:** Spring Boot 3.3.x
- **Acceso a datos:** Spring JDBC (PreparedStatement)
- **Base de datos:** PostgreSQL 15
- **Dependencias:** Maven 3.x
- **Seguridad:** Spring Security + BCrypt + OWASP Top 10 2021

## Base de datos

**Nombre:** `terraza_premium`

**Tablas:** 12 tablas del MER

- roles
- sedes
- usuarios
- tipos_producto
- proveedores
- productos
- inventario
- mesas
- pedidos
- detalle_pedido
- pagos
- auditoria

**Script SQL:** `src/main/resources/schema.sql`

Todas las tablas tienen `created_at` y `updated_at`. El borrado de productos y usuarios es lógico, con el campo `active`.

**Índices del documento de arquitectura:**

- `idx_pedidos_sede_estado` sobre `pedidos(sede_id, estado)`
- `idx_inventario_producto` sobre `inventario(producto_id)`

El script crea las 12 tablas, los roles `ADMIN`, `CAJERO` y `MESERO`, las sedes Galerías, Zona T y La 85, y el usuario administrador. No carga productos, mesas ni inventario.

En una base vacía, los identificadores quedan así:

| Tabla | id | Nombre |
|---|---|---|
| roles | 1 | ADMIN |
| roles | 2 | CAJERO |
| roles | 3 | MESERO |
| sedes | 1 | Galerías |
| sedes | 2 | Zona T |
| sedes | 3 | La 85 |

## Casos de uso implementados

| CU | Nombre | Estado |
|---|---|---|
| CU001 | Login | ✅ Backend |
| CU002 | Cerrar sesión Administrador | ✅ Backend |
| CU003 | Gestionar usuarios | ✅ Backend |
| CU004 | Gestionar sedes | ✅ Backend |
| CU005 | Gestionar productos | ✅ Backend |
| — | Flujo de pedidos (crear, modificar, listar) | ✅ Backend |

## Endpoints de la API REST

**Base URL:** `http://localhost:8080`

El login abre una sesión y el servidor envía la cookie `JSESSIONID`. El resto de endpoints exige esa cookie. Desde el frontend (`http://localhost:5173`) las peticiones deben ir con credenciales incluidas.

Los errores salen en JSON: `timestamp`, `status`, `error`, `message` y `path`. Si la validación falla, también viene `errors` con el campo y el mensaje.

---

### Autenticación

#### CU001 — Login

- **Método:** `POST`
- **URL:** `/api/auth/login`
- **Roles:** Público
- **Body:**

```json
{
  "email": "admin@terrazapremium.com",
  "password": "Admin123*"
}
```

Respuesta exitosa (`200 OK`):

```json
{
  "id": 1,
  "nombre": "Administrador",
  "email": "admin@terrazapremium.com",
  "rolId": 1,
  "rol": "ADMIN",
  "rolDescripcion": "Administrador",
  "sedeId": 1,
  "sede": "Galerías",
  "activo": true
}
```

#### CU002 — Cerrar sesión Administrador

- **Método:** `POST`
- **URL:** `/api/auth/logout`
- **Roles:** Cualquier sesión autenticada
- **Body:** Ninguno

Respuesta (`200 OK`):

```json
{ "mensaje": "Sesión cerrada correctamente" }
```

La acción queda registrada en `auditoria`.

---

### Usuarios (CU003)

Todos estos endpoints exigen rol `ADMIN`. `GET` solo devuelve usuarios con `active = true`.

#### Listar usuarios

- **Método:** `GET`
- **URL:** `/api/users`
- **Roles:** ADMIN

#### Crear usuario

- **Método:** `POST`
- **URL:** `/api/users`
- **Roles:** ADMIN
- **Body:**

```json
{
  "nombre": "Thais Mesera",
  "email": "thais@terrazapremium.com",
  "password": "Mesera123*",
  "rolId": 3,
  "sedeId": 1
}
```

La contraseña se guarda con BCrypt (12 rondas). La respuesta es `201 Created` con el mismo formato del login, sin la contraseña.

#### Editar usuario

- **Método:** `PUT`
- **URL:** `/api/users/{id}`
- **Roles:** ADMIN
- **Body:**

```json
{
  "nombre": "Thais Mesera",
  "email": "thais@terrazapremium.com",
  "password": "Mesera123*",
  "rolId": 3,
  "sedeId": 1
}
```

`password` es opcional. Si no se envía, la contraseña actual se conserva.

#### Activar o desactivar usuario

- **Método:** `PATCH`
- **URL:** `/api/users/{id}/active`
- **Roles:** ADMIN
- **Body:**

```json
{ "activo": false }
```

El campo es `activo`. Un administrador no puede desactivarse a sí mismo.

---

### Sedes (CU004)

#### Listar sedes

- **Método:** `GET`
- **URL:** `/api/branches`
- **Roles:** Cualquier sesión autenticada

#### Crear sede

- **Método:** `POST`
- **URL:** `/api/branches`
- **Roles:** ADMIN
- **Body:**

```json
{
  "nombre": "Sede Restrepo",
  "direccion": "Calle 20 # 15-30",
  "ciudad": "Bogotá",
  "telefono": "3001234567"
}
```

Si `ciudad` no se envía, queda `Bogotá`. Respuesta: `201 Created`.

#### Editar sede

- **Método:** `PUT`
- **URL:** `/api/branches/{id}`
- **Roles:** ADMIN
- **Body:** el mismo de crear sede.

---

### Productos (CU005)

`GET` solo devuelve productos con `active = true`. Crear un producto exige que el tipo de producto exista y esté activo. El proveedor es opcional.

#### Listar productos

- **Método:** `GET`
- **URL:** `/api/products`
- **Roles:** Cualquier sesión autenticada

#### Crear producto

- **Método:** `POST`
- **URL:** `/api/products`
- **Roles:** ADMIN
- **Body:**

```json
{
  "codigo": "P006",
  "nombre": "Cerveza Corona",
  "descripcion": "Cerveza",
  "valorCompra": 3500,
  "valorVenta": 7000,
  "tipoProductoId": 1,
  "proveedorId": 1
}
```

`descripcion` y `proveedorId` son opcionales. Respuesta: `201 Created`.

#### Editar producto

- **Método:** `PUT`
- **URL:** `/api/products/{id}`
- **Roles:** ADMIN
- **Body:** el mismo de crear producto.

#### Eliminar producto (softdelete)

- **Método:** `DELETE`
- **URL:** `/api/products/{id}`
- **Roles:** ADMIN
- **Body:** Ninguno

No borra la fila. Pone `active = false`.

Respuesta:

```json
{ "mensaje": "Producto desactivado correctamente" }
```

---

### Flujo de pedidos

El mesero del pedido es el usuario de la sesión, no un campo del body. El precio unitario y el subtotal se calculan con `valor_venta` del producto. El pedido solo se crea si hay stock en `inventario` para esa sede. El descuento de stock y la inserción del pedido ocurren en la misma transacción. Solo se puede modificar un pedido en estado `ABIERTO`.

#### Crear pedido

- **Método:** `POST`
- **URL:** `/api/orders`
- **Roles:** ADMIN, MESERO
- **Body:**

```json
{
  "sedeId": 1,
  "mesaId": 1,
  "detalles": [
    {
      "productoId": 1,
      "cantidad": 2
    }
  ]
}
```

`mesaId` es opcional. Un mesero solo puede crear pedidos de su sede. Respuesta: `201 Created`, con `meseroId`, `estado` (`ABIERTO`), `total` y `detalles` (`precioUnitario` y `subtotal` calculados).

#### Modificar pedido abierto

- **Método:** `PUT`
- **URL:** `/api/orders/{id}`
- **Roles:** ADMIN, MESERO
- **Body:** el mismo de crear pedido. No se puede cambiar la sede.

#### Listar pedidos activos

- **Método:** `GET`
- **URL:** `/api/orders?sedeId=1`
- **Roles:** ADMIN, CAJERO, MESERO

`sedeId` es obligatorio. Devuelve los pedidos en estado `ABIERTO` de esa sede. Cajero y mesero solo consultan su sede.

## Seguridad — OWASP Top 10 2021

| Categoría | Implementación |
|---|---|
| A01 — RBAC | Roles ADMIN, CAJERO, MESERO con `@PreAuthorize` |
| A02 — Hash bcrypt | `BCryptPasswordEncoder` con 12 rounds |
| A03 — PreparedStatement | `JdbcTemplate` con parámetros `?` |
| A04 — Arquitectura en capas | controller → service → repository |
| A05 — Hardening | Credenciales en `application.properties` y en `.env`. Ambos están en `.gitignore` |
| A06 — Dependencias | Revisión manual con `mvn dependency:check` |
| A07 — Sesión | El backend valida la sesión. El frontend guarda la sesión en `sessionStorage` |
| A08 — Validación | `@Valid`, `@NotNull` y `@Size` en los DTO, más `CHECK` en la base |
| A09 — Logging | Tabla `auditoria` con usuario, operación, detalle, IP, sede y fecha |
| A10 — Sin URLs externas | El backend no consume servicios externos |

La auditoría registra inicios de sesión, cierres de sesión, logins fallidos, accesos denegados (403), errores inesperados y cada alta, edición o desactivación.

## Credenciales de prueba

| Rol | Email | Contraseña | Sede |
|---|---|---|---|
| Admin | admin@terrazapremium.com | Admin123* | Galerías |

Esa cuenta la inserta `schema.sql`. Mesera y cajero no vienen en el script: se crean con `POST /api/users`.

## Cómo levantar el backend

### Requisitos previos

- Java 21
- Maven 3.x
- PostgreSQL 15

### Pasos

Desde la carpeta `backend`:

1. Crear la base de datos:

```sql
CREATE DATABASE terraza_premium;
```

2. Ejecutar el script:

```bash
psql -U postgres -d terraza_premium -f src/main/resources/schema.sql
```

3. Copiar `src/main/resources/application.properties.example` a `src/main/resources/application.properties` y poner el usuario y la contraseña locales de PostgreSQL.

4. Levantar el backend:

```bash
mvn spring-boot:run
```

El backend queda en `http://localhost:8080`.

## Equipo

- **Nahomi Lozada** — Backend / Admin
- **Thais Duran** — Frontend / Mesera
- **Julian Velasco** — Backend / Cajero

**Contacto:** zenithtechstudio@gmail.com | 3006514543 | Bogotá, Colombia | 2026
