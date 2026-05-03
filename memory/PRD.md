# Mundo Infantil - PRD

## Problem Statement (Original)
Sistema para una juguetería en línea donde:
- El cliente entra a la app y elige productos
- Realiza un pedido de juguetes
- El sistema guarda automáticamente la información
- El personal (o sistema) procesa el pedido
- Se generan reportes de ventas
- Y además se puede premiar al cliente con puntos o recompensas por sus compras
Todo está conectado para que el negocio funcione de forma organizada, rápida y automática.

## User Choices
- Pagos: Stripe
- Autenticación: defaults (JWT email/password)
- Panel admin: defaults (sí, con roles)
- Recompensas: puntos + niveles (Bronce/Plata/Oro)
- Diseño: "Mundo Infantil" colorido y amigable con paleta azul, amarillo, rojo suave, verde

## Architecture
- Backend: FastAPI + Motor (MongoDB), JWT auth, bcrypt, emergentintegrations Stripe Checkout
- Frontend: React 19 + React Router 7, Tailwind, shadcn/ui, sonner toasts, recharts
- Mongo collections: users, products, orders, payment_transactions

## User Personas
- Cliente: familias/adultos que compran juguetes para niños
- Admin: personal de la tienda que gestiona productos, pedidos, y consulta reportes

## Implemented (2026-02-03)
- Auth: /api/auth/{register,login,logout,me}, roles (customer/admin), admin seeded
- Productos: CRUD con 12 productos auto-seeded (categorías, edades, descuentos, destacados)
- Carrito: estado persistente en localStorage
- Checkout Stripe: /api/orders/checkout crea sesión + registro payment_transactions
- Status polling: /api/orders/status/{session_id} con manejo graceful de errores Stripe
- Pedidos del cliente: /api/orders/mine
- Panel admin: /api/admin/orders (+status update), /api/admin/reports/sales, /api/admin/customers
- Sistema puntos: 1 pt/$1, niveles Bronce(0-99)/Plata(100-499)/Oro(500+)
- UI: Home con hero + destacados + promo bento, Catálogo con filtros, Detalle producto, Carrito, Checkout, Login/Register, Mis Pedidos, Recompensas con progreso, Panel admin con charts

## Backlog
### P1
- Stripe webhook handler verification end-to-end
- Reviews/ratings de productos
- Sistema de cupones y códigos de descuento

### P2
- Lista de deseos
- Notificaciones email al cambiar estado de pedido
- Imágenes múltiples por producto
- Búsqueda avanzada con sugerencias
