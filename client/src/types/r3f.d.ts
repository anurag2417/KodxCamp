/**
 * R3F JSX intrinsic element declarations.
 *
 * Why this file exists:
 *
 * @react-three/fiber augments the JSX namespace to add three.js
 * elements like `<group>`, `<mesh>`, `<meshStandardMaterial>`. With
 * `jsx: "react-jsx"` (which this project uses), TypeScript reads the
 * JSX namespace from `react/jsx-runtime`, which resolves to
 * `React.JSX`. In some configurations R3F's augmentation lands on the
 * global `JSX` namespace instead, so the elements appear "missing" even
 * though R3F is installed and imported.
 *
 * This file declares the elements we actually use on BOTH namespaces,
 * so the JSX compiler finds them no matter which one it reads.
 *
 * This is a compile-time shim, not a runtime one. React-three-fiber
 * still owns the actual elements at runtime.
 */

import type { ReactThreeFiber } from '@react-three/fiber';

/**
 * Every three.js element the landing page's 3D scene renders. Grouped
 * here so it's obvious what the surface is. Add to this list if the
 * scene grows.
 */
interface KodxThreeElements {
  group: ReactThreeFiber.Object3DNode<import('three').Group, typeof import('three').Group>;
  mesh: ReactThreeFiber.Object3DNode<import('three').Mesh, typeof import('three').Mesh>;
  meshStandardMaterial: ReactThreeFiber.MaterialNode<
    import('three').MeshStandardMaterial,
    []
  >;
  meshBasicMaterial: ReactThreeFiber.MaterialNode<
    import('three').MeshBasicMaterial,
    []
  >;
  planeGeometry: ReactThreeFiber.BufferGeometryNode<
    import('three').PlaneGeometry,
    typeof import('three').PlaneGeometry
  >;
  icosahedronGeometry: ReactThreeFiber.BufferGeometryNode<
    import('three').IcosahedronGeometry,
    typeof import('three').IcosahedronGeometry
  >;
  ambientLight: ReactThreeFiber.Object3DNode<
    import('three').AmbientLight,
    typeof import('three').AmbientLight
  >;
  directionalLight: ReactThreeFiber.Object3DNode<
    import('three').DirectionalLight,
    typeof import('three').DirectionalLight
  >;
  pointLight: ReactThreeFiber.Object3DNode<
    import('three').PointLight,
    typeof import('three').PointLight
  >;
  primitive: ReactThreeFiber.Object3DNode<
    import('three').Object3D,
    typeof import('three').Object3D
  >;
}

declare global {
  namespace JSX {
    interface IntrinsicElements extends KodxThreeElements {}
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends KodxThreeElements {}
  }
}

export {};