# Terraza Premium — Frontend Mesera

Frontend del sistema **Terraza Premium** para el rol **Mesera**.  
Bar de licores colombianos — solo venta de botellas.

---

##  Descripción

Aplicación web responsive para que las meseras puedan:

- Tomar pedidos de botellas directamente desde la mesa
- Consultar el estado de las mesas en tiempo real
- Revisar la carta de licores disponibles
- Ver el inventario por sede
- Cerrar sesión automáticamente por inactividad

---

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Vite | 8.x | Bundler y dev server |
| React | 18.x | Librería de UI |
| TypeScript | 5.x | Tipado estático |
| Tailwind CSS | 4.x | Estilos utilitarios |
| React Router | 6.x | Enrutamiento SPA |
| Axios | 1.x | Cliente HTTP |

---

##  Requisitos previos

Antes de ejecutar el proyecto necesitas tener instalado:

- **Node.js 18+** → https://nodejs.org
- **Git** → https://git-scm.com
- **Backend corriendo** en `http://localhost:8080`

Verifica que los tengas:

```bash
node -v      # debe ser v18 o superior
npm -v       # debe ser v9 o superior
git --version