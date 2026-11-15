# Terraza Premium

Sistema de Gestión Integral de Bar desarrollado por **Zenith Tech Studio** (2026) para Terraza Premium, con operación centralizada en las tres sedes de Bogotá: Galerías, Zona T y La 85.

La aplicación cubre el día a día del bar: mesas y pedidos, cobro e factura en pantalla, inventario por sede, catálogo, usuarios y reportes exportables a CSV y Excel. Cada persona entra con un rol (administrador, cajero o mesero). El mesero y el cajero trabajan solo en la sede que tienen asignada; el administrador puede ver las tres y operar como mesero o cajero cuando lo necesita.


## Qué hay en este repositorio

- `backend/` — API REST con Spring Boot 3.3, Java 21 y PostgreSQL 15.
- `frontend/` — interfaz web en React, TypeScript y Vite (puerto 5173).
- `docs/` — documentación del proyecto (propuesta, arquitectura, actas y demás entregables).

Las contraseñas se guardan con BCrypt; el acceso se controla por sesión y por rol.

## Cómo se levanta

Hace falta Java 21, Maven 3, Node.js, PostgreSQL 15 y, en el frontend, las dependencias de npm. La base se llama `terraza_premium` y corre en `localhost:5432`.

**1. Base de datos.** En PostgreSQL se crea la base y se aplica el esquema:

```sql
CREATE DATABASE terraza_premium;
```

```bat
psql -U postgres -d terraza_premium -f backend\src\main\resources\schema.sql
```

Si la base ya existía, el alineamiento con el modelo relacional está en `backend\src\main\resources\schema_mer_align.sql`.

**2. Backend.** Se copia `backend\src\main\resources\application.properties.example` a `application.properties` y se dejan el usuario y la contraseña reales de PostgreSQL. Luego, desde `backend`:

```bat
mvn spring-boot:run
```

La API queda en `http://localhost:8080`.

**3. Frontend.** En otra terminal, desde `frontend`:

```bat
npm install
npm run dev
```

El navegador abre `http://localhost:5173`. El frontend habla con el backend en el puerto 8080; ambos deben estar encendidos.

Para detenerlos basta con cerrar cada terminal o usar Ctrl+C.

## Cuentas de prueba

Las inserta `schema.sql`:

| Rol | Correo | Contraseña | Sede |
|---|---|---|---|
| Administrador | admin@terrazapremium.com | Admin123* | Galerías |
| Mesero | thais@terrazapremium.com | Mesera123* | Galerías |
| Cajero | julian@terrazapremium.com | Cajero123* | Galerías |

**Contacto:** zenithtechstudio@gmail.com · Bogotá, Colombia · 2026
