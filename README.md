# 🍔 Lajambre App - Full-Stack Delivery & E-commerce

![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)
![NestJS](https://img.shields.io/badge/backend-NestJS-E0234E?logo=nestjs)
![React Native](https://img.shields.io/badge/frontend-React_Native-61DAFB?logo=react)
![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma)
![Transbank](https://img.shields.io/badge/pago-Webpay_Plus-00A1E1)

Lajambre App es una solución de comercio electrónico integral diseñada específicamente para la industria de la comida rápida. Combina una aplicación móvil fluida para clientes, un panel administrativo robusto y un backend escalable para gestionar pedidos, lealtad de clientes y pagos en tiempo real.

---

## 🚀 Características Principales

### 📱 Cliente (App Móvil)
- **Menú Dinámico:** Segmentación por categorías y personalización de productos mediante un sistema de **Extras** (Ingredientes adicionales).
- **Carrito Inteligente:** Gestión de estado con Zustand que utiliza "Huellas Digitales" para diferenciar productos idénticos con distintos agregados.
- **Lajambre Club (Fidelización):** 
    - Acumulación de puntos (1% de la compra, con bonificación de **1.5x los martes**).
    - Niveles gamificados: **Bronce, Plata y Oro** basados en historial de puntos.
    - Canje de premios integrados directamente en el checkout.
- **Pagos Seguros:** Integración nativa con **Transbank Webpay Plus**.

### 🛠️ Administración
- **Monitor de Cocina (Live Orders):** Tablero Kanban para la gestión de estados del pedido (Pagado ➔ Preparando ➔ En Camino ➔ Entregado).
- **Gestor de Menú:** Control total sobre disponibilidad de productos (`isAvailable`), precios y descripción en tiempo real.

### 🛡️ Backend & Seguridad
- **Autenticación:** JWT con Passport y encriptación Bcrypt.
- **Verificación de Identidad:** Flujo de validación de correo electrónico mediante tokens únicos.
- **Tareas Automatizadas:** Cron Jobs para la limpieza de puntos vencidos (90 días de validez).

---

## 🛠️ Stack Tecnológico

**Backend:**
- [NestJS](https://nestjs.com/) - Framework progresivo de Node.js.
- [Prisma](https://www.prisma.io/) - ORM para PostgreSQL.
- [Nodemailer](https://nodemailer.com/) - Notificaciones por email.
- [Transbank SDK](https://github.com/TransbankDevelopers) - Pagos online en Chile.

**Frontend:**
- [React Native / Expo](https://expo.dev/) - Desarrollo móvil multiplataforma.
- [Zustand](https://github.com/pmndrs/zustand) - Gestión de estado ligero.
- [TanStack Query](https://tanstack.com/query/latest) - Sincronización de datos servidor/cliente.
- [NativeWind](https://www.nativewind.dev/) - Estilos basados en Tailwind CSS.
- [Reanimated](https://www.swmansion.com/reanimated) - Animaciones de alto rendimiento.

---

## ⚙️ Instalación y Configuración

### Pre-requisitos
- Node.js (v18+)
- Docker (para la base de datos)
- Expo Go en tu dispositivo móvil

### 1. Configuración del Backend
```bash
cd backend
npm install
# Configura tu .env basado en .env.example
docker-compose up -d # Levanta PostgreSQL
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

### 2. Configuración del Frontend
```bash
cd frontend
npm install
npx expo start
```

---

## 📄 Licencia
Este proyecto está bajo la licencia MIT.

---

