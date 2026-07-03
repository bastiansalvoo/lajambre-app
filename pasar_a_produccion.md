# Objetivo

Actúa como un Arquitecto Senior DevOps, Backend y SRE especializado en NestJS, PostgreSQL, Docker y despliegues productivos en VPS Linux de bajos recursos.

Necesito preparar mi proyecto "Lajambre App" para ser desplegado en producción en un VPS DigitalOcean de 1 vCPU y 2 GB RAM (US$12/mes).

El proyecto pertenece a un negocio pequeño que recién comienza, por lo que el presupuesto inicial es muy limitado.

## Restricciones de costos

El costo mensual fijo no debe superar:

* VPS DigitalOcean: US$12/mes.
* Dominio: aproximadamente US$10-15/año.
* Deben priorizarse soluciones gratuitas siempre que sea posible.

Utilizar preferentemente:

* Docker.
* Nginx.
* Let's Encrypt.
* Cloudflare Free.
* Brevo Free o SMTP gratuito equivalente.
* PostgreSQL alojado dentro del mismo VPS.

Evitar arquitecturas que requieran servicios externos pagados.

No utilizar:

* Kubernetes.
* Servicios administrados costosos.
* Balanceadores externos.
* Redis externo de pago.
* Bases de datos administradas de pago.

La arquitectura debe ser extremadamente eficiente en recursos.

## Stack actual

### Backend

* NestJS
* Prisma ORM
* PostgreSQL
* JWT + Passport
* Bcrypt
* Nodemailer
* Cron Jobs
* Mercado Pago SDK

### Frontend

* React Native + Expo
* Zustand
* TanStack Query
* NativeWind
* Reanimated

## Características del negocio

La aplicación será utilizada inicialmente por una única tienda de comida rápida con bajo volumen de usuarios y pedidos durante los primeros meses.

Debe quedar preparada para crecer sin necesidad de rehacer la arquitectura.

## Tu misión

Analiza completamente el proyecto actual y realiza todos los cambios necesarios para dejarlo listo para producción.

No hagas suposiciones.

Analiza primero todo el código antes de proponer modificaciones.

## Requisitos obligatorios

# Infraestructura

Crear:

* Dockerfile optimizado para producción.
* docker-compose.production.yml.
* Multi-stage builds.
* Imágenes Docker livianas.
* Volúmenes persistentes.

Los contenedores obligatorios serán:

* backend
* postgres
* nginx

Todos deben utilizar:

restart: unless-stopped

Preparar despliegue para:

Ubuntu Server 24.04 LTS.

# Nginx

Crear configuración completa como Reverse Proxy:

* HTTPS.
* Redirección HTTP -> HTTPS.
* Compresión Gzip.
* Caché estática.
* Security Headers.
* HTTP/2.
* Proxy buffering.
* Configuración optimizada para 1 vCPU y 2 GB RAM.

# SSL y Dominio

Asumir el siguiente escenario:

* Dominio principal: lajambre.cl
* API: api.lajambre.cl
* Panel administrativo: admin.lajambre.cl

Generar toda la configuración necesaria para:

* Cloudflare DNS.
* Nginx.
* Certbot.
* Let's Encrypt.

Incluir:

* Pasos exactos para emitir certificados SSL.
* Configuración de renovación automática.

# Optimización de recursos

Optimizar todo el proyecto para:

* 1 vCPU.
* 2 GB RAM.

Reducir al mínimo:

* Uso de CPU.
* Uso de RAM.
* Tiempo de arranque.
* Consumo de disco.
* Escrituras innecesarias.
* Conexiones simultáneas.

Indicar el consumo estimado de cada servicio.

# Backend

Revisar y corregir:

* Variables de entorno.
* Configuración Prisma.
* Pool de conexiones PostgreSQL.
* Manejo global de errores.
* Logs.
* Timeouts.
* Validaciones.
* Seguridad JWT.
* Rate limiting.
* Helmet.
* CORS.
* Compresión.
* Sanitización.
* Protección contra ataques comunes.

Implementar:

* Health Check endpoint.
* Graceful Shutdown.
* SIGTERM.
* SIGINT.
* Readiness Probe.
* Liveness Probe.

# Base de datos

Optimizar PostgreSQL específicamente para 2 GB RAM.

Configurar:

* shared_buffers.
* work_mem.
* maintenance_work_mem.
* effective_cache_size.
* max_connections.

Revisar:

* Índices faltantes.
* Queries ineficientes.
* Posibles N+1.
* Uso correcto de Prisma.

# Seguridad

Implementar:

* Helmet.
* Rate limiting.
* Protección XSS.
* Protección contra ataques de fuerza bruta.
* Política CORS segura.
* Variables sensibles fuera del repositorio.
* No exponer stack traces.
* Cookies seguras si aplica.

# Logs

Implementar:

* Pino o Winston.
* Logs JSON estructurados.
* Rotación de logs.
* Diferentes niveles de logs.

# Monitoreo

Agregar:

* /health
* /metrics

Preparar integración opcional para:

* Prometheus.
* Grafana.

Sin requerir servicios externos pagados.

# Correo electrónico

La aplicación utiliza:

* Verificación de correo.
* Recuperación de contraseña.
* Notificaciones.

Preparar configuración de producción utilizando:

Brevo Free (preferentemente).

Implementar:

* Variables de entorno necesarias.
* Configuración SMTP segura.
* Reintentos.
* Manejo de errores.

# Mercado Pago

La aplicación utiliza Mercado Pago (Checkout Pro y Webhooks).

Preparar la aplicación para producción considerando:

* Variables de entorno seguras (Access Tokens).
* Configuración del SDK oficial.
* Creación de preferencias de pago con URLs correctas (auto_return).
* Manejo estricto del Webhook para validación asíncrona de pagos (verificación servidor a servidor).
* Manejo de errores y rechazos de pago.
* Reintentos.
* Logging estructurado de transacciones.
* Actualización atómica de los estados en la base de datos (Prisma).

# Variables de entorno

Generar un archivo .env.example completo.

Debe incluir todas las variables necesarias para:

* Backend.
* PostgreSQL.
* JWT.
* SMTP.
* Mercado Pago.
* Cloudflare.
* Dominio.
* CORS.
* SSL.
* Logs.

# Scripts

Generar:

* deploy.sh
* backup.sh
* restore.sh
* update.sh

# Checklist final de despliegue

Generar un checklist exacto con el orden recomendado:

1. Comprar dominio.
2. Configurar Cloudflare.
3. Crear VPS.
4. Configurar Docker.
5. Configurar Nginx.
6. Configurar SSL.
7. Configurar PostgreSQL.
8. Configurar variables de entorno.
9. Configurar SMTP.
10. Configurar API de Mercado Pago.
11. Desplegar backend.
12. Validar funcionamiento (Logs y Webhooks).
13. Publicar aplicación.

# Entregables

Por cada mejora:

1. Explica el problema encontrado.
2. Explica por qué es un problema.
3. Muestra el código corregido.
4. Muestra el archivo completo modificado.
5. Indica exactamente dónde debe ubicarse.

Al finalizar entrega:

* Arquitectura final.
* Consumo estimado de RAM.
* Riesgos identificados.
* Recomendaciones futuras.
* Checklist final de producción.

Prioriza estrictamente:

1. Estabilidad.
2. Seguridad.
3. Bajo consumo de recursos.
4. Bajo costo operativo.
5. Escalabilidad futura.


---

## 📋 Estado de Producción — Lajambre App

> Última actualización: 2026-07-01

---

### 🌐 1. Dominio y DNS

- [x] **Dominio `lajambre.cl`** — Comprado y registrado en NIC Chile. Titularidad confirmada.
- [x] **Cloudflare** — Zona DNS creada en plan gratuito. Nameservers de NIC Chile apuntados a `konnor.ns.cloudflare.com` y `malevika.ns.cloudflare.com`.
- [x] Propagación DNS completada — Verificada via nslookup y correo oficial de activación de Cloudflare.
- [x] Registros `A` creados en Cloudflare: `@` y `api` apuntando a `198.199.80.117` (nube gris / DNS Only hasta SSL).

---

### 🖥️ 2. Servidor y Docker

- [x] Arrendar VPS en DigitalOcean (Ubuntu 24.04 LTS, 1 vCPU / 2GB RAM) — IP: `198.199.80.117`
- [x] Configurar Firewall UFW: puertos 22 (SSH), 80 (HTTP) y 443 (HTTPS) abiertos.
- [x] Instalar Docker (`docker.io`) y Docker Compose v2. Servicio habilitado en arranque.

---

### 🛠️ 3. Archivos de DevOps

- [x] Dockerfile de Producción (multi-stage build)
- [x] docker-compose.prod.yml
- [x] nginx.conf (reverse proxy + HTTPS + gzip)
- [x] deploy.sh y backup.sh

---

### 💻 4. Código — Auditoría y Correcciones (2026-07-01)

- [x] **Seguridad crítica:** Eliminado campo `role` del `RegisterDto` — ya no es posible auto-asignarse ADMIN al registrarse.
- [x] **Premios del sistema:** Sincronizados los 10 tipos de premio entre el DTO y el Service (antes solo 3 funcionaban).
- [x] **URL de API:** Reemplazada IP hardcodeada `192.168.0.21` por variable de entorno `EXPO_PUBLIC_API_URL`.
- [x] **Deep link:** Reemplazada IP local hardcodeada por variable de entorno `APP_DEEP_LINK` en `.env.production`.
- [x] **Horario de tienda:** Reactivada la restricción de horario (Martes-Domingo 18:30-00:00). Estaba comentada.
- [x] **Carrito:** `clearCart()` se ejecuta ahora *después* de confirmar que el pago se inició (no antes).
- [x] **Reintentar Pago:** Al presionar "Reintentar" en una orden PENDIENTE, reutiliza la orden existente en vez de crear una nueva.
- [x] **Error de red:** La pantalla de pedidos del usuario muestra Toast de error si falla la conexión.
- [x] **Uploads:** Agregado `fileFilter` al FileInterceptor — solo acepta `.jpg`, `.png`, `.webp` con máximo 5MB.
- [x] **Menú público:** `findAll` de productos ahora solo devuelve productos con `isAvailable: true`.
- [x] **Teléfono en checkout:** Limitado a 12 caracteres máximo con validación mínima de 9 caracteres.
- [x] **Alerta de nuevos pedidos:** La pantalla "Monitor Cocina" del admin ahora detecta pedidos nuevos cada 15 segundos y emite un sonido de alarma.
- [x] **CORS:** Variable `CORS_ORIGIN` agregada a `.env.production` apuntando a `https://lajambre.cl`.

---

### 🔑 5. Credenciales pendientes — COMPLETAR ANTES DE LANZAR

- [x] **SMTP real (Brevo):** Dominio `lajambre.cl` verificado y autenticado con DKIM + DMARC en Cloudflare. Credenciales configuradas en `.env.production`. Los correos saldrán con remitente `no-reply@lajambre.cl`.
- [ ] **`APP_DEEP_LINK`:** Actualizar en `.env.production` con el scheme definitivo de la app una vez publicada (`lajambre://orders`).

---

### 🔐 6. Certificados SSL

- [ ] Instalar Certbot en el servidor.
- [ ] Generar certificados HTTPS para `api.lajambre.cl` con Let's Encrypt.
- [ ] Configurar renovación automática (cron de certbot).

---

### 🚀 7. Despliegue

- [ ] Clonar el repositorio en el servidor.
- [ ] Copiar `.env.production` al servidor y completar credenciales faltantes.
- [ ] Ejecutar el script: `./scripts/deploy.sh`
- [ ] Activar el proxy de Cloudflare (cambiar la nube a 🟠 naranja).

---

### ✅ 8. Prueba Final de Pago

- [ ] Realizar una compra real de prueba (mínimo $10 pesos) con Mercado Pago producción.
- [ ] Verificar que el webhook cambia el estado de la orden a `PAGADO` en la base de datos.
- [ ] Verificar que el admin recibe la alerta sonora en el Monitor Cocina.

---

### 📱 9. Distribución de la App

- [x] `eas.json` configurado para generar APKs de Android (descarga directa).
- [x] Dockerfile para el Frontend Web (PWA).
- [x] Nginx configurado para alojar la PWA en `lajambre.cl`.
- [ ] _(Manual, cuando estés listo)_ Compilar APK: `eas build -p android --profile preview`