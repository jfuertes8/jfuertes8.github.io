# Plan: Portfolio de Fotos - Astro Static Site

## 1. Stack Tecnologico

- **Framework**: Astro (static site generation)
- **Estilos**: Tailwind CSS
- **Deploy**: GitHub Pages via GitHub Actions (on push to `main`)
- **Fotos**: Carpeta `src/photos/` dentro del repositorio (ver seccion 2)

## 2. Almacenamiento de Fotos

### Opciones evaluadas

| Opcion | Pros | Contras |
|---|---|---|
| **Carpeta en el repo** | Simple, todo junto, sin dependencias externas | Repo pesado si hay muchas fotos (>1GB) |
| **Git LFS** | Maneja archivos grandes, mismo flujo git | Limite gratuito de 1GB storage + 1GB bandwidth/mes en GitHub |
| **Cloudinary (CDN externo)** | Optimizacion automatica, transformaciones, CDN global | Dependencia externa, free tier limitado (25GB) |
| **GitHub Releases** | Sin limite practico de tamano | Workflow complejo, no pensado para esto |

### Recomendacion: Carpeta en el repo (`src/photos/`)

Para un portfolio personal es la opcion mas simple y practica. Astro procesara las imagenes con `astro:assets` (sharp) generando automaticamente formatos optimizados (WebP/AVIF) y thumbnails en build time. El repo pesara mas, pero para un portfolio (50-200 fotos) es perfectamente manejable. Si en el futuro el repo crece demasiado, migrar a Cloudinary es sencillo.

**Estructura de fotos:**
```
src/photos/
  spain/
    foto1.jpg
    foto2.jpg
  japan/
    foto3.jpg
  italy/
    foto4.jpg
```

## 3. Estructura del Proyecto

```
photos_web/
  .github/
    workflows/
      deploy.yml          # GitHub Actions: build + deploy to Pages
  src/
    layouts/
      Layout.astro        # Layout base (head, nav, footer)
    pages/
      index.astro         # Redirect o landing -> about
      about.astro         # Pagina "Acerca de"
      portfolio/
        index.astro       # Galeria completa con filtros
    components/
      Navbar.astro        # Navegacion: About | Portfolio > [paises]
      PhotoGrid.astro     # Grid responsive de fotos
      PhotoCard.astro     # Tarjeta individual de foto
      FilterBar.astro     # Filtros: pais (submenu) + orientacion (vertical/horizontal)
      CountryMenu.astro   # Submenu desplegable de paises
      Footer.astro        # Footer
    photos/               # Fotos organizadas por pais (subcarpetas)
      spain/
      japan/
      ...
    data/
      photos.ts           # Catalogo de fotos: metadata (titulo, pais, orientacion, path)
    styles/
      global.css          # Tailwind directives + estilos globales
  astro.config.mjs
  tailwind.config.mjs
  package.json
  tsconfig.json
```

## 4. Paginas y Funcionalidad

### 4.1 Layout Base (`Layout.astro`)
- HTML head con meta tags, og tags para compartir
- Navbar persistente arriba
- Slot para contenido
- Footer

### 4.2 Navbar (`Navbar.astro`)
- Logo / nombre del fotografo
- Links: **About** | **Portfolio**
- Portfolio tiene un submenu desplegable con los paises disponibles
- Responsive: hamburger menu en movil

### 4.3 Pagina About (`about.astro`)
- Foto del autor
- Texto biografico
- Links a redes sociales / contacto

### 4.4 Pagina Portfolio (`portfolio/index.astro`)
- **FilterBar** arriba con:
  - Selector de pais (todos / spain / japan / ...) - extraido dinamicamente de las carpetas de fotos
  - Toggle orientacion: Todas | Verticales | Horizontales
- **PhotoGrid**: grid responsive (masonry-like o columnas CSS)
- Cada foto es un **PhotoCard** con:
  - Imagen optimizada (thumbnail via astro:assets)
  - Overlay con titulo/pais al hover
  - Click abre lightbox a tamano completo
- **Filtrado client-side** con JavaScript vanilla (sin framework pesado):
  - Atributos `data-country` y `data-orientation` en cada card
  - JS filtra mostrando/ocultando con clases CSS
  - URL query params para permalinks a filtros (`?country=spain&orientation=vertical`)

## 5. Catalogo de Fotos (`src/data/photos.ts`)

Archivo central que exporta el array de fotos con metadata:

```typescript
export interface Photo {
  src: ImageMetadata;     // import de astro:assets
  title: string;
  country: string;        // codigo/nombre del pais
  orientation: 'vertical' | 'horizontal';
  alt: string;
}
```

La orientacion se puede detectar automaticamente en build time leyendo las dimensiones de la imagen (width vs height).

Alternativa mas automatizada: un script que escanee `src/photos/*/` y genere el catalogo automaticamente leyendo EXIF o dimensiones. Esto evita mantener un archivo manual.

## 6. Optimizacion de Imagenes

- Usar `astro:assets` (`<Image>` component) para:
  - Generar WebP/AVIF automaticamente
  - Crear thumbnails para el grid (widths: 400, 800)
  - Lazy loading nativo (`loading="lazy"`)
  - `srcset` responsive automatico
- Las fotos originales no se sirven; solo las versiones optimizadas

## 7. GitHub Actions - Deploy

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist/
      - uses: actions/deploy-pages@v4
```

Configurar en el repo: Settings > Pages > Source: GitHub Actions.

## 8. Configuracion Astro

```javascript
// astro.config.mjs
export default defineConfig({
  site: 'https://<usuario>.github.io',
  base: '/photos_web',  // nombre del repo
  integrations: [tailwind()],
  output: 'static',
});
```

## 9. Diseno Visual (Tailwind)

- Tema oscuro por defecto (fondo oscuro para resaltar fotos)
- Tipografia limpia y minimalista (Inter o similar via fontsource)
- Grid de fotos: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- Transiciones suaves en hover y filtrado
- Lightbox minimal para ver fotos a pantalla completa

## 10. Pasos de Implementacion

1. Inicializar proyecto Astro con Tailwind
2. Crear GitHub Actions workflow (`deploy.yml`)
3. Crear layout base + Navbar + Footer
4. Crear pagina About con contenido placeholder
5. Implementar catalogo de fotos (`photos.ts`) con deteccion automatica de orientacion
6. Crear componentes PhotoGrid, PhotoCard, FilterBar
7. Crear pagina Portfolio con filtrado client-side
8. Implementar lightbox para visualizacion a pantalla completa
9. Anadir fotos de ejemplo para testing
10. Ajustes responsive y pulido visual
11. Primer push a main y verificar deploy en GitHub Pages
