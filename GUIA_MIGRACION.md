# 🚀 Guía Maestra de Migración - Proyecto Lajambre

Este documento contiene toda la información técnica necesaria para trasladar el proyecto **Lajambre App** a una nueva computadora.

## 📋 Requisitos del Sistema

Antes de empezar, asegúrate de tener instalado:
- **Node.js:** v20 o superior (Recomendado v22).
- **Docker Desktop:** Para correr PostgreSQL.
- **Git:** Para clonar el código.
- **Expo Go (App):** En tu celular para probar el frontend.
- **VS Code Extensions:** Prisma, ESLint, Prettier y Tailwind CSS IntelliSense.

---

## 🏗️ Arquitectura General

El proyecto es una aplicación Full Stack compuesta por:
- **Backend:** NestJS (Node.js) con Prisma ORM.
- **Frontend:** Mobile App con Expo (React Native) y NativeWind.
- **Base de Datos:** PostgreSQL corriendo en Docker.

---

## 🛠️ Tecnologías y Dependencias

### 🖥️ Backend (NestJS)
- **Framework:** NestJS v11.
- **ORM:** Prisma (PostgreSQL).
- **Seguridad:** 
  - `passport-jwt` para autenticación.
  - `bcrypt` para hash de contraseñas.
- **Integraciones:**
  - `transbank-sdk`: Para pagos con Webpay.
  - `nodemailer`: Envío de correos electrónicos.
- **Validación:** `class-validator` y `class-transformer`.
- **Puerto:** `3000` (Configurado para escuchar en `0.0.0.0` para acceso desde el móvil).

### 📱 Frontend (Expo / React Native)
- **Framework:** Expo SDK 54.
- **Navegación:** Expo Router (File-based routing).
- **Estilos:** `nativewind` (Tailwind CSS para React Native).
- **Estado Global:** `zustand` (Manejo del carrito).
- **Peticiones:** `axios` + `@tanstack/react-query` (Caché y sincronización de datos).
- **Utilidades:**
  - `expo-secure-store`: Guardado seguro de tokens.
  - `react-native-toast-message`: Notificaciones visuales.
  - `expo-image-picker`: Para subir fotos de productos (Admin).

---

## 📦 Base de Datos y Docker

El proyecto utiliza **Docker Desktop** para gestionar la base de datos.

### Configuración de Docker (`docker-compose.yml`)
- **Imagen:** `postgres:15`
- **Contenedor:** `lajambre-db`
- **Puerto Externo:** `5433` (Mapeado al `5432` interno).
- **Credenciales:**
  - **Usuario:** `user_lajambre`
  - **Password:** `password_lajambre`
  - **DB Name:** `lajambre_db`

---

## 🗃️ Prisma (Base de Datos)

Prisma maneja el esquema y las migraciones. El esquema incluye:
- **Modelos:** `User`, `Product`, `Category`, `Order`, `OrderItem`, `Extra`, `PointTransaction`.
- **Enums:** Roles (`USER`, `ADMIN`), Estados de Orden (`PENDIENTE`, `PAGADO`, etc.).
- **Generadores:** Cliente de JS y Generador de Diagramas ERD (`diagram.svg`).

---

## 🚩 ¡IMPORTANTE! Archivos No Versioneados (.env)

Los siguientes archivos **NO están en Git** y debes respaldarlos manualmente. Aquí tienes la estructura y valores actuales para que los copies y pegues:

### Contenido de `backend/.env`:
```env
DATABASE_URL="postgresql://user_lajambre:password_lajambre@localhost:5433/lajambre_db?schema=public"
JWT_SECRET="super_secreto_lajambre_2026_CAMBIADO_PARA_PROD"
WEBPAY_COMMERCE_CODE="597055555532"
WEBPAY_API_KEY="579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C"
WEBPAY_ENVIRONMENT="Integration"
WEBPAY_RETURN_URL="http://192.168.1.14:3000/orders/webpay/confirm"
```

> **Nota:** La `WEBPAY_RETURN_URL` debe usar la IP de tu nueva computadora si vas a probar desde un celular físico.

### Otros archivos a respaldar:
1.  **`backend/uploads/`**: Carpeta que contiene las imágenes de los productos subidas por el administrador.
2.  **`frontend/.env`** (si existe): Contiene la `API_URL`.

---

## 🚀 Pasos para Instalar en la Nueva Computadora

1.  **Clonar el repositorio:**
    ```bash
    git clone <tu-repo>
    ```

2.  **Instalar dependencias:**
    - En `/backend`: `npm install`
    - En `/frontend`: `npm install`

3.  **Configurar Variables de Entorno:**
    - Copiar los archivos `.env` respaldados a sus respectivas carpetas.
    - Asegúrate de que `DATABASE_URL` en el backend apunte al puerto `5433`:
      `DATABASE_URL="postgresql://user_lajambre:password_lajambre@localhost:5433/lajambre_db?schema=public"`

4.  **Levantar Base de Datos:**
    ```bash
    cd backend
    docker-compose up -d
    ```

5.  **Sincronizar Base de Datos (Prisma):**
    ```bash
    npx prisma migrate dev
    npx prisma db seed
    ```

6.  **Correr Aplicación:**
    - **Backend:** `npm run start:dev`
    - **Frontend:** `npx expo start`

---

## 📁 Estructura de Archivos Clave
- `backend/prisma/schema.prisma`: Definición de tablas.
- `backend/src/`: Lógica del servidor (Auth, Orders, Products, etc.).
- `frontend/app/`: Pantallas de la aplicación (Admin, Client, Auth).
- `frontend/src/api/api.ts`: Configuración de la conexión con el backend.
- `resumen.txt`: Notas de desarrollo y errores pendientes.
