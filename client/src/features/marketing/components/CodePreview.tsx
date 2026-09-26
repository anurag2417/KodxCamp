import { Canvas, useFrame } from '@react-three/fiber';
import { Float, RoundedBox, Text } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
import { useThemeStore } from '@/shared/store/theme.store';

/**
 * The three.js scene is ~600 kB. It is rendered lazily by
 * `CodePreview` below, which means this module (and three.js) only
 * load when the hero scrolls into view.
 */

function LaptopScreen({ dark }: { dark: boolean }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y =
      Math.sin(state.clock.elapsedTime * 0.42) * 0.035;
    group.current.rotation.x =
      -0.1 + Math.sin(state.clock.elapsedTime * 0.3) * 0.012;
  });

  return (
    <group ref={group} rotation={[0, -0.12, 0]}>
      <RoundedBox
        args={[4.8, 3.05, 0.18]}
        radius={0.16}
        smoothness={5}
        position={[0, 1.55, 0]}
      >
        <meshStandardMaterial
          color={dark ? '#111827' : '#cbd5e1'}
          metalness={0.82}
          roughness={0.2}
        />
      </RoundedBox>

      <RoundedBox
        args={[4.36, 2.61, 0.035]}
        radius={0.08}
        smoothness={4}
        position={[0, 1.55, 0.105]}
      >
        <meshStandardMaterial
          color={dark ? '#07111f' : '#f8fafc'}
          metalness={0.15}
          roughness={0.3}
        />
      </RoundedBox>

      <mesh position={[0, 1.55, 0.13]}>
        <planeGeometry args={[4.02, 2.28]} />
        <meshBasicMaterial color={dark ? '#0b1627' : '#ffffff'} />
      </mesh>

      <Text
        position={[-1.75, 2.42, 0.16]}
        fontSize={0.13}
        color="#60a5fa"
        anchorX="left"
        anchorY="middle"
      >
        KodxCamp / Main.java
      </Text>
      <Text
        position={[-1.75, 2.03, 0.16]}
        fontSize={0.11}
        color={dark ? '#94a3b8' : '#475569'}
        anchorX="left"
        anchorY="middle"
      >
        public static void main(String[] args)
      </Text>
      <Text
        position={[-1.75, 1.69, 0.16]}
        fontSize={0.11}
        color="#f97316"
        anchorX="left"
        anchorY="middle"
      >
        System.out.println(&quot;Build.&quot;);
      </Text>
      <Text
        position={[-1.75, 1.35, 0.16]}
        fontSize={0.11}
        color="#93c5fd"
        anchorX="left"
        anchorY="middle"
      >
        run();
      </Text>

      <RoundedBox
        args={[0.75, 0.3, 0.045]}
        radius={0.06}
        smoothness={4}
        position={[1.5, 2.34, 0.16]}
      >
        <meshStandardMaterial
          color="#f97316"
          emissive="#7c2d12"
          emissiveIntensity={0.45}
        />
      </RoundedBox>
      <Text position={[1.5, 2.34, 0.2]} fontSize={0.105} color="#ffffff">
        RUN
      </Text>
    </group>
  );
}

function LaptopBase({ dark }: { dark: boolean }) {
  return (
    <group rotation={[-0.03, -0.12, 0]}>
      <RoundedBox
        args={[5.25, 0.18, 3.6]}
        radius={0.1}
        smoothness={5}
        position={[0, 0, 0.05]}
      >
        <meshStandardMaterial
          color={dark ? '#64748b' : '#94a3b8'}
          metalness={0.9}
          roughness={0.18}
        />
      </RoundedBox>
      <RoundedBox
        args={[4.55, 0.045, 2.85]}
        radius={0.08}
        smoothness={4}
        position={[0, 0.12, 0.08]}
      >
        <meshStandardMaterial
          color={dark ? '#1e293b' : '#e2e8f0'}
          metalness={0.25}
          roughness={0.35}
        />
      </RoundedBox>
      <RoundedBox
        args={[1.25, 0.045, 0.72]}
        radius={0.06}
        smoothness={4}
        position={[0, 0.145, 0.12]}
      >
        <meshStandardMaterial
          color={dark ? '#334155' : '#cbd5e1'}
          metalness={0.25}
          roughness={0.3}
        />
      </RoundedBox>
    </group>
  );
}

function FloatingBadge({
  position,
  color,
  label,
  scale = 1,
}: {
  position: [number, number, number];
  color: string;
  label: string;
  scale?: number;
}) {
  return (
    <Float speed={1.2} rotationIntensity={0.28} floatIntensity={0.55}>
      <group position={position} scale={scale}>
        <RoundedBox args={[0.85, 0.85, 0.25]} radius={0.16} smoothness={5}>
          <meshStandardMaterial
            color={color}
            metalness={0.45}
            roughness={0.18}
            emissive={color}
            emissiveIntensity={0.12}
          />
        </RoundedBox>
        <Text position={[0, 0, 0.14]} fontSize={0.19} color="#ffffff">
          {label}
        </Text>
      </group>
    </Float>
  );
}

function Scene({ dark }: { dark: boolean }) {
  return (
    <>
      <ambientLight intensity={1.3} />
      <directionalLight
        position={[4, 6, 6]}
        intensity={dark ? 3.2 : 2.5}
        color="#dbeafe"
      />
      <pointLight
        position={[-4, 2, 3]}
        intensity={dark ? 18 : 10}
        distance={12}
        color="#2563eb"
      />
      <pointLight
        position={[4, -1, 3]}
        intensity={dark ? 13 : 9}
        distance={10}
        color="#f97316"
      />

      <group position={[0, -1.5, 0]} rotation={[-0.08, 0, 0]}>
        <LaptopScreen dark={dark} />
        <LaptopBase dark={dark} />
      </group>

      <FloatingBadge position={[-3.15, 1.7, 0.1]} color="#2563eb" label="</>" />
      <FloatingBadge
        position={[3.1, 2.1, 0.15]}
        color="#f97316"
        label="K"
        scale={0.9}
      />
      <FloatingBadge
        position={[3.25, -0.15, 0.2]}
        color="#1e3a8a"
        label="{}"
        scale={0.75}
      />

      <Float speed={0.8} rotationIntensity={0.18} floatIntensity={0.4}>
        <mesh position={[-2.9, -0.6, 0.2]}>
          <icosahedronGeometry args={[0.28, 2]} />
          <meshStandardMaterial
            color="#60a5fa"
            metalness={0.72}
            roughness={0.16}
          />
        </mesh>
      </Float>
    </>
  );
}

export default function CodePreview() {
  const theme = useThemeStore((s) => s.theme);
  const dark = theme === 'dark';

  return (
    <div className="kc-code-scene" aria-label="3D coding workspace">
      <Canvas camera={{ position: [0, 0.6, 10], fov: 34 }} dpr={[1, 1.6]}>
        <Scene dark={dark} />
      </Canvas>
    </div>
  );
}