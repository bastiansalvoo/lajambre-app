# 📋 PLAN DE TRABAJO — Lajambre App → Producción

**Fecha:** 21 de junio de 2026  
**Objetivo:** Dejar el sistema 100% operativo para GO-LIVE  
**Tiempo total estimado:** ~12-16 horas

---

## 🗓️ DÍA 1 — Seguridad y Configuración (Lo más urgente)

> **Meta:** Eliminar todo lo que impide desplegar. Al final del día, el sistema es "seguro para internet".

### 1.1 — Eliminar IPs hardcodeadas
**Tiempo:** 30 min | **Archivos:** 5

- [ ] `backend/src/main.ts` → `console.log` con variable de entorno
- [ ] `backend/src/auth/mail.service.ts` → URL de verificación con variable
- [ ] `backend/src/products/products.service.ts` → URLs de imágenes relativas
- [ ] `backend/src/orders/orders.service.ts` → `returnUrl` desde `.env`
- [ ] `frontend/src/api/api.ts` → `baseURL` desde variable de entorno

### 1.2 — Variables de entorno seguras
**Tiempo:** 30 min | **Archivos:** 3

- [ ] Generar `JWT_SECRET` nuevo (64 caracteres aleatorios)
- [ ] Mover credenciales Gmail de `mail.service.ts` → `.env`
- [ ] Crear `backend/.env.example` sin valores reales
- [ ] Remover fallback `'secreto_de_respaldo_123'` en `jwt.strategy.ts`

### 1.3 — Rate Limiting global
**Tiempo:** 30 min | **Archivos:** 2

- [ ] Instalar `@nestjs/throttler`
- [ ] Configurar límites: 10 req/min en auth, 30 req/min general
- [ ] Probar que no bloquee uso normal

### 1.4 — CORS + Helmet
**Tiempo:** 20 min | **Archivos:** 2

- [ ] Configurar `app.enableCors({ origin: true, credentials: true })`
- [ ] Instalar y configurar `helmet`

### 1.5 — Validación de uploads
**Tiempo:** 20 min | **Archivos:** 1

- [ ] Agregar `fileFilter` (solo imágenes) y `limits: { fileSize: 5MB }` en multer

### 1.6 — Activar horario de tienda
**Tiempo:** 10 min | **Archivos:** 1

- [ ] Descomentar validación en `orders.service.ts`
- [ ] Verificar horario: Mar-Dom 18:30-23:59

### 1.7 — Proteger endpoint admin con IP (opcional)
**Tiempo:** 20 min | **Archivos:** 1

- [ ] Agregar guard que solo permita IPs de confianza en rutas `/admin`

**✅ CHECKPOINT DÍA 1:** Sistema seguro, sin credenciales expuestas, listo para internet.

---

## 🗓️ DÍA 2 — Nuevo Menú y Webpay Producción

> **Meta:** El menú refleja lo que el cliente vende. Webpay listo para cobrar de verdad.

### 2.1 — Actualizar seed con nuevo menú
**Tiempo:** 1 hora | **Archivos:** 1 (`seed.ts`)

- [ ] **Actualizar 5 burgers existentes:** nuevos nombres, precios y descripciones
  - Clásica: $7.990 → $8.590
  - La de Palta → **La Paltaza**: $8.490 → $8.790
  - BBQ: $8.990 → $9.990
  - Triplecheese: $8.790 → $9.790
  - Mostaza-Miel: $8.290 → $8.990
- [ ] **Crear 2 burgers nuevas:**
  - **La Chacarera** ($8.290): Mayonesa, tomate fresco, porotos verdes, ají en rodajas y doble queso cheddar
  - **La 4to Lajambre** ($7.990): Salsa Lajambre, lechuga fresca, pepinillos, doble cheddar y cebolla en cubos
- [ ] **Recrear extras (10 total):**
  - $1.000: Tocino, Palta, Queso (2 láminas), Cebolla pochada, Champiñones salteados
  - $500: Huevo, Lechuga, Tomate, Pepinillos
  - $3.000: Carne Extra (150g)
- [ ] Actualizar Lata de Bebida: $1.000 → $1.200

### 2.2 — Cambiar deliveryFee
**Tiempo:** 15 min | **Archivos:** 2

- [ ] `schema.prisma`: `deliveryFee` default 1250 → 1800
- [ ] `orders.service.ts`: constante `let deliveryFee = 1250` → 1800
- [ ] `cart.tsx` (frontend): `deliveryCost = isDelivery ? 1250 : 0` → 1800
- [ ] Crear migración Prisma

### 2.3 — Credenciales Transbank producción
**Tiempo:** 30 min | **Archivos:** 1

- [ ] Obtener Commerce Code y API Key reales del portal Transbank
- [ ] Actualizar `.env`:
  ```
  WEBPAY_COMMERCE_CODE="codigo_real"
  WEBPAY_API_KEY="api_key_real"
  WEBPAY_ENVIRONMENT="Production"
  WEBPAY_RETURN_URL="https://tudominio.cl/orders/webpay/confirm"
  ```

### 2.4 — SMTP producción (SendGrid o Resend)
**Tiempo:** 30 min | **Archivos:** 2

- [ ] Crear cuenta en SendGrid (gratis 100 emails/día)
- [ ] Configurar API key en `.env`
- [ ] Actualizar `mail.service.ts` para usar SMTP de SendGrid en vez de Gmail

**✅ CHECKPOINT DÍA 2:** Menú real, Webpay producción, emails profesionales.

---

## 🗓️ DÍA 3 — Funcionalidades pendientes y despliegue

> **Meta:** Cerrar funcionalidades que faltan. Dejar el servidor corriendo.

### 3.1 — Webpay Result funcional
**Tiempo:** 45 min | **Archivos:** 1

- [ ] Implementar `webpay-result.tsx` con pantalla de éxito/fracaso
- [ ] Leer parámetros de la URL de retorno de Webpay
- [ ] Mostrar resumen de la orden y botón "Volver al menú"

### 3.2 — Botón "Reintentar Pago"
**Tiempo:** 1 hora | **Archivos:** 2

- [ ] En `orders.tsx`, para órdenes PENDIENTES: mostrar botón "Reintentar Pago"
- [ ] Endpoint backend o reutilizar `POST /orders/:id/pay`
- [ ] Evitar crear orden duplicada

### 3.3 — Refresh Token
**Tiempo:** 1.5 horas | **Archivos:** 3

- [ ] Backend: endpoint `POST /auth/refresh`
- [ ] Generar refresh token (UUID) + guardar hash en BD
- [ ] Frontend: interceptor axios que detecta 401 y refresca automáticamente

### 3.4 — Despliegue en VPS
**Tiempo:** 2-3 horas | **Archivos:** Docker, Caddy, .env

- [ ] Contratar VPS Hetzner CX22 (~$4.50/mes)
- [ ] Configurar dominio (lajambre.cl o similar)
- [ ] Instalar Docker + Docker Compose
- [ ] Subir código y configurar `.env` producción
- [ ] `docker compose up -d --build`
- [ ] Ejecutar migraciones y seed
- [ ] Configurar Caddy para HTTPS automático
- [ ] Probar flujo completo: registro → compra → pago

### 3.5 — Pantalla "Cargando..." del frontend
**Tiempo:** 15 min | **Archivos:** 1

- [ ] Cambiar `baseURL` del frontend al dominio real (`https://api.lajambre.cl`)
- [ ] Build de producción: `npx expo export` o EAS Build

**✅ CHECKPOINT DÍA 3:** Sistema en producción, aceptando pedidos reales.

---

## 🗓️ POST-LANZAMIENTO (Semana 2)

> **Meta:** Lo que no es crítico pero suma muchísimo valor.

### 4.1 — Panel de Analíticas
**Tiempo:** 4-6 horas

- [ ] Backend: `AnalyticsModule` con endpoints de métricas
- [ ] Frontend: `(admin)/analytics.tsx` con gráficos

### 4.2 — Notificaciones al local (Fase 1)
**Tiempo:** 2 horas

- [ ] WhatsApp automático al recibir orden (usando Twilio o WhatsApp Cloud API)
- [ ] Formato: resumen del pedido con items, total, dirección

### 4.3 — Paginación en admin
**Tiempo:** 30 min

- [ ] `findAllForAdmin` con `skip`/`take` + query params `?page=1&limit=20`

### 4.4 — Logging y monitoreo
**Tiempo:** 1.5 horas

- [ ] Winston para logs en archivo + consola
- [ ] Sentry para capturar errores en producción

### 4.5 — CI/CD
**Tiempo:** 2 horas

- [ ] GitHub Actions: test → build → deploy al VPS

---

## 📊 ORDEN DE EJECUCIÓN (de arriba a abajo)

```
DÍA 1 (Seguridad)
  ├── 1.1 Eliminar IPs hardcodeadas     ← EMPEZAR AQUÍ
  ├── 1.2 Variables de entorno seguras
  ├── 1.3 Rate limiting
  ├── 1.4 CORS + Helmet
  ├── 1.5 Validación de uploads
  ├── 1.6 Activar horario
  └── 1.7 Proteger admin por IP (opcional)

DÍA 2 (Menú + Pagos)
  ├── 2.1 Nuevo menú (seed)             ← LO MÁS GRANDE
  ├── 2.2 Cambiar deliveryFee
  ├── 2.3 Transbank producción
  └── 2.4 SMTP producción

DÍA 3 (Cierre + Deploy)
  ├── 3.1 Webpay Result
  ├── 3.2 Reintentar Pago
  ├── 3.3 Refresh Token
  ├── 3.4 Despliegue VPS               ← META FINAL
  └── 3.5 Frontend prod build

SEMANA 2 (Post-lanzamiento)
  ├── 4.1 Panel analíticas
  ├── 4.2 WhatsApp notificaciones
  ├── 4.3 Paginación admin
  ├── 4.4 Logging + Sentry
  └── 4.5 CI/CD
```

---

## 🎯 REGLA DE ORO

> **No pasamos a la siguiente tarea hasta que la actual esté 100% probada.**

Probar significa: abrir la app en el celu, hacer el flujo completo (registro → menú → carrito → checkout → pago), y verificar que lo que cambiamos funciona.

---

**¿Empezamos por 1.1 — Eliminar IPs hardcodeadas?**
