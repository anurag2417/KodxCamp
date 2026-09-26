# KodxCamp Landing Page

A responsive Next.js/React landing page implementation with dark/light themes, React Three Fiber 3D visuals, and restrained Framer Motion animation.

## Dependencies

Install:

- `three`
- `@react-three/fiber`
- `@react-three/drei`
- `framer-motion`

## Files

Copy the `components`, `hooks`, and `pages` folders into your marketing landing-page area.

Import `styles.css` from the parent application stylesheet entry, or merge the styles into your existing global stylesheet.

Render `Home` from your marketing route.

## Notes

The 3D scene is built from Three.js geometry rather than flat SVG/CSS illustrations. No external 3D model is required.

The theme is controlled by `data-theme="dark"` and `data-theme="light"` on the document root.

If your application already has a theme provider, replace the local theme state in `Home.tsx` with your existing theme state.
