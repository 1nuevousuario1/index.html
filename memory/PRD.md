# Mundo Infantil - PRD

## Problem Statement (Original)
Sistema para una juguetería en línea donde:
- El cliente entra a la app y elige productos
- Realiza un pedido de juguetes (como invitado, sin crear cuenta)
- El sistema guarda automáticamente la información (nombre, email, teléfono, dirección)
- La administradora recibe notificación de pedidos pendientes
- El personal procesa el pedido (cambiar estado, ver datos del cliente)
- Se generan reportes de ventas

## User Choices
- Pagos: Stripe (MXN)
- Autenticación: SOLO admin (JWT email/password). Clientes compran como invitados.
- Panel admin: con campana de notificaciones y conteo de pedidos pendientes
- Diseño: paleta azul/amarillo/rojo/verde, fuentes Fredoka + Nunito

## Architecture
- Backend: FastAPI + Motor (MongoDB), JWT auth para admin, bcrypt, emergentintegrations Stripe Checkout
- Frontend: React 19 + React Router 7, Tailwind, shadcn/ui, sonner toasts, recharts
- Mongo collections: users (admin only), products, orders, payment_transactions, messages, uploads

## User Personas
- Cliente invitado: familia/adulto que compra juguetes sin crear cuenta
- Admin: personal de la tienda que gestiona productos, pedidos, clientes y mensajes

## Implementadas (acumulado)
- Auth admin: /api/auth/{login,logout,me} con role=admin seeded
- Productos: CRUD con seed de 58 productos reales (PDF parsed) y subida de imágenes a Object Storage
- Carrito: estado persistente en localStorage
- **Checkout invitado** (2026-02): /api/orders/checkout PÚBLICO; payload {items, customer_name, customer_email, customer_phone, shipping_address, origin_url}; crea sesión Stripe MXN y guarda orden con datos del invitado
- **Status público** (2026-02): /api/orders/status/{session_id} sin auth, polling desde CheckoutSuccess
- **Notificación admin** (2026-02): /api/admin/orders/pending-count + campana con badge en AdminDashboard (auto-refresh 30s)
- AdminOrders: fila expandible que muestra nombre/email/teléfono/dirección/productos del invitado
- AdminCustomers: agregado por email desde colección orders (nombre, teléfono, pedidos, total gastado, última compra)
- Reportes: /api/admin/reports/sales (ventas por día, top productos, clientes únicos)
- Mensajes Cliente→Admin: /api/messages público + /api/admin/messages
- Páginas legales: Aviso de Privacidad + Términos y Condiciones
- Política de envío visible en Cart/Checkout (envío gratis +$2000 MXN)

## Eliminado en esta iteración
- Customer login/register (rutas /login, /registro, /mis-pedidos)
- Sistema de puntos/recompensas/tiers (Bronce/Plata/Oro)
- Páginas Login.jsx, Register.jsx, MyOrders.jsx, Rewards.jsx
- Función `register` del AuthContext

## Backlog
### P1
- Stripe webhook handler verificación end-to-end con clave real
- Cupones / códigos de descuento
- Envío de email automático al cliente cuando se confirma el pago (Resend/SendGrid)

### P2
- Lista de deseos / favoritos por sesión
- Reseñas de productos
- Imágenes múltiples por producto
- Búsqueda avanzada con sugerencias

## Endpoints clave
- POST /api/auth/login (admin)
- GET  /api/auth/me (admin)
- GET  /api/products | /api/products/{id}
- POST /api/orders/checkout (PÚBLICO - guest)
- GET  /api/orders/status/{session_id} (PÚBLICO)
- POST /api/webhook/stripe
- GET  /api/admin/orders | PUT /api/admin/orders/{id}/status (admin)
- GET  /api/admin/orders/pending-count (admin)
- GET  /api/admin/customers (admin)
- GET  /api/admin/reports/sales (admin)
- POST /api/messages (público) | GET /api/admin/messages (admin)
- POST /api/admin/upload-image (admin)
