# Yakarta — React + Vite

Conversión del proyecto HTML original a una SPA en React con JavaScript, React Compiler, Bootstrap instalado como dependencia y Oxlint.

## Requisitos

- Node.js 20+
- npm 10+

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

## Producción

```bash
npm run build
npm run preview
```

## Linter

```bash
npm run lint
npm run lint:fix
```

## Notas

- Bootstrap y Bootstrap Icons se importan desde npm; se eliminaron las referencias CDN del HTML original.
- React Router reemplaza los enlaces `.html` por rutas de la SPA.
- Los flujos de login, registro, carrito, checkout, compras y administración se migraron a estado React + `localStorage`.
- React Compiler se habilita desde `vite.config.js` mediante `@vitejs/plugin-react` y `babel-plugin-react-compiler`.
- Oxlint es el linter principal del proyecto.
