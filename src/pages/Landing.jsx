// src/pages/landing.jsx
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Reveal from "../components/reveal";
import MagicBento from "../components/magicBento";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, ContactShadows, Html } from "@react-three/drei";
import * as THREE from "three";
import { MOUSE, TOUCH } from "three";

/* ======== One-place tuning ======== */
const HERO = {
  fov: 50,
  height: 540,
  coverage: 0.44, // MAIN SIZE KNOB
  fov: 50,
  height: 540,
  coverage: 0.55, // slightly larger (try 0.47 if you want a bit more)
  offsetY: -0.05,
  rotationSpeed: 0.38,
  minPolar: Math.PI * 0.18,
  maxPolar: Math.PI - Math.PI * 0.18,
};



/* ------------- Error boundary ------------- */
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError(err) { return { hasError: true, err }; }
  componentDidCatch(err) { console.error("3D Hero error:", err); }
  render() { return this.state.hasError ? (this.props.fallback ?? null) : this.props.children; }
}

/* ------------- Small loader ------------- */
function NiceLoader({ label = "Loading 3D…" }) {
  return (
    <Html center style={{ pointerEvents: "none" }}>
      <div
        style={{
          display: "grid",
          placeItems: "center",
          padding: "10px 14px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(6,10,22,0.6)",
          fontSize: 14,
        }}
      >
        {label}
      </div>
    </Html>
  );
}

/* --------- Fallback model (if GLB fails) --------- */
function FallbackKnot({ rotationSpeed = 0.6 }) {
  const ref = useRef();
  useFrame((_, d) => {
    if (!ref.current) return;
    ref.current.rotation.y += rotationSpeed * d;
    ref.current.rotation.x += rotationSpeed * 0.35 * d;
  });
  return (
    <>
      <mesh ref={ref} castShadow receiveShadow>
        <torusKnotGeometry args={[0.5, 0.18, 220, 32]} />
        <meshStandardMaterial metalness={0.6} roughness={0.25} color="#9ecbff" />
      </mesh>
      <ContactShadows position={[0, -0.7, 0]} opacity={0.25} scale={8} blur={2.2} far={3} />
      <OrbitControls enablePan={false} enableZoom={false} />
    </>
  );
}

/* --------- Real GLB with coverage-based size --------- */
function HeroModel({ src = "/assets/model.glb", idleDelay = 1600, onInteractChange }) {
  const holder = useRef();                    // container for centered & scaled model
  const controls = useRef();
  const fixedDistRef = useRef(null);          // fixed orbit radius (camera ↔ target)
  const { camera } = useThree();
  const { scene } = useGLTF(src);

  const [auto, setAuto] = useState(true);
  const idleTimer = useRef();

  // Fit, scale for coverage, and lock distance once
  useEffect(() => {
    if (!scene || !holder.current) return;

    // Clone to avoid mutating cached scene; center it at origin
    const root = scene.clone(true);
    const box = new THREE.Box3().setFromObject(root);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const center = sphere.center.clone();
    root.position.sub(center);

    // Mount the centered model
    holder.current.clear();
    holder.current.add(root);

    // Camera setup
    const fovRad = THREE.MathUtils.degToRad(HERO.fov);
    camera.fov = HERO.fov;
    camera.near = 0.01;
    camera.far = 1000;
    camera.position.set(0, 0, 1); // temp; we’ll place correctly after controls target
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    // Controls target at slight Y offset
    if (controls.current) {
      controls.current.target.set(0, HERO.offsetY, 0);
      controls.current.update();
    }

    // Choose a comfortable base distance using FOV and object radius
    // Any positive constant works; we’ll then scale to match coverage.
    const baseDist = (sphere.radius / Math.sin(fovRad / 2)) * 1.25;

    // Compute scale so the projected radius occupies HERO.coverage of the view half-height:
    // r_proj = scale * r;   viewHalf = dist * tan(fov/2)
    // Want: r_proj = coverage * viewHalf  => scale = coverage * dist * tan(fov/2) / r
    const scale = (HERO.coverage * baseDist * Math.tan(fovRad / 2)) / (sphere.radius || 1);
    holder.current.scale.setScalar(scale);

    // Now place camera exactly at this distance from target
    const target = controls.current ? controls.current.target : new THREE.Vector3(0, 0, 0);
    const dir = new THREE.Vector3(0, 0, 1); // looking down -Z to origin? we’ll place on +Z
    const pos = dir.multiplyScalar(baseDist).add(target);
    camera.position.copy(pos);
    camera.near = Math.max(0.01, baseDist / 500);
    camera.far = baseDist * 50;
    camera.lookAt(target);
    camera.updateProjectionMatrix();

    // Lock orbit radius precisely to baseDist
    if (controls.current) {
      fixedDistRef.current = baseDist;
      controls.current.enableZoom = false;
      controls.current.minDistance = baseDist;
      controls.current.maxDistance = baseDist;
      controls.current.minPolarAngle = HERO.minPolar;
      controls.current.maxPolarAngle = HERO.maxPolar;
      controls.current.update();
    }
  }, [camera, scene]);

  // Gentle auto-rotate
  useFrame((_, d) => {
    if (auto && holder.current) holder.current.rotation.y += HERO.rotationSpeed * d;
  });

  // Keep radius locked & resume auto-rotate after a pause
  const onStart = () => {
    setAuto(false);
    onInteractChange?.(true);
    if (idleTimer.current) clearTimeout(idleTimer.current);

    // If distance drifted for any reason, snap back to fixedDist
    if (controls.current && fixedDistRef.current != null) {
      const { target, object: cam } = controls.current;
      const dir = cam.position.clone().sub(target).normalize();
      cam.position.copy(dir.multiplyScalar(fixedDistRef.current).add(target));
      controls.current.minDistance = fixedDistRef.current;
      controls.current.maxDistance = fixedDistRef.current;
      cam.updateProjectionMatrix();
      controls.current.update();
    }
  };

  const onEnd = () => {
    onInteractChange?.(false);
    idleTimer.current = setTimeout(() => setAuto(true), idleDelay);
  };

  return (
    <>
      <group ref={holder} />
      <ContactShadows position={[0, -0.55, 0]} opacity={0.24} scale={8} blur={2.2} far={3} />
      <OrbitControls
        ref={controls}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        enableZoom={false}
        mouseButtons={{ LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.ROTATE, RIGHT: MOUSE.ROTATE }}
        touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.ROTATE }}
        onStart={onStart}
        onEnd={onEnd}
      />
    </>
  );
}

useGLTF.preload("/assets/model.glb");

/* ------------- Canvas frame (centered, no ghost box) ------------- */
function CanvasFrame({ children, onInteract }) {
  const ref = useRef();
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    let t;
    const start = () => onInteract?.(true);
    const endSoon = () => { clearTimeout(t); t = setTimeout(() => onInteract?.(false), 240); };
    const onWheel = () => { start(); endSoon(); };
    const onPointerDown = () => start();
    const onPointerUp = () => onInteract?.(false);
    const onTouchStart = () => start();
    const onTouchEnd = () => onInteract?.(false);

    el.addEventListener("wheel", onWheel, { passive: true });
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      clearTimeout(t);
    };
  }, [onInteract]);

  return (
    <div
      ref={ref}
      style={{
        marginTop: 14,
        display: "grid",
        placeItems: "center",
        height: HERO.height,
        width: "100%",
        border: "none",
        background: "transparent",
      }}
    >
      <div style={{ width: "min(1100px, 100%)", height: "100%" }}>{children}</div>
    </div>
  );
}

/* ------------------------------ Page ------------------------------ */
export default function Landing() {
  const [interact, setInteract] = useState(false);
  const dpr = useMemo(() => [1, Math.min(2, Math.round(window.devicePixelRatio || 1.5))], []);

  return (
    <main>
      <section className="section hero" style={{ paddingTop: 56, paddingBottom: 24 }}>
        <div className="container">
          <Reveal as="div" className="hero-logo-wrap" y={22}>
            <img className="hero-logo" src="/1fa-logo.png" alt="One For All logo" />
          </Reveal>

          <Reveal as="h1" className="section-title" style={{ fontSize: 48, marginBottom: 12 }}>
            Welcome to <span className="gradient-text">One For All</span>
          </Reveal>

          <Reveal delay={80}>
            <p className="section-sub" style={{ maxWidth: 720 }}>
              The playful token with serious vibes. Explore the ecosystem and trade in a dedicated page.
            </p>
          </Reveal>

          <Reveal y={14} delay={120}>
            <CanvasFrame onInteract={setInteract}>
              <Canvas
                dpr={dpr}
                camera={{ position: [0, 0.4, 3], fov: HERO.fov, near: 0.1, far: 100 }}
                gl={{ antialias: true, alpha: true }}
              >
                <ambientLight intensity={0.5} />
                <directionalLight position={[2.5, 3.2, 2.4]} intensity={1.1} castShadow shadow-bias={-0.0003} />
                <Environment preset="city" intensity={0.7} />
                <ErrorBoundary fallback={<FallbackKnot />}>
                  <Suspense fallback={<NiceLoader />}>
                    <HeroModel src="/assets/model.glb" idleDelay={interact ? 1200 : 1600} onInteractChange={setInteract} />
                  </Suspense>
                </ErrorBoundary>
              </Canvas>
            </CanvasFrame>
          </Reveal>
        </div>
      </section>

      {/* ===== The rest of your sections stay unchanged ===== */}
      <MagicBento />

      <section className="section">
        <div className="container">
          <div className="grid3" style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
            <Reveal as="div" className="panel" y={20}>
              <h3 style={{ marginTop: 0 }}>Fast & Low Cost</h3>
              <p className="hint">Solana finality in seconds and fees that round to zero.</p>
            </Reveal>
            <Reveal as="div" className="panel" y={20} delay={80}>
              <h3 style={{ marginTop: 0 }}>Composability</h3>
              <p className="hint">Works with leading DEXs, aggregators, and wallets.</p>
            </Reveal>
            <Reveal as="div" className="panel" y={20} delay={160}>
              <h3 style={{ marginTop: 0 }}>Community First</h3>
              <p className="hint">Transparent updates and incentives for long-term holders.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ display: "grid", gap: 12 }}>
          <Reveal as="h2" className="section-title" y={-18}>
            What is <span className="gradient-text">1FA</span>?
          </Reveal>
          <Reveal y={22} delay={60}>
            <p className="section-sub" style={{ maxWidth: 860 }}>
              A meme coin with real polish. We keep it simple: ship useful UI, stay transparent, and let the
              community have fun.
            </p>
          </Reveal>

          <div style={{ display: "grid", gap: 12 }}>
            <Reveal as="div" className="panel" y={26}>
              <h3 style={{ margin: "0 0 6px" }}>Why it exists</h3>
              <p className="hint" style={{ margin: 0 }}>
                Memes move culture, but tools create staying power. 1FA mixes both — fast swaps, friendly UX, and
                rewards.
              </p>
            </Reveal>

            <Reveal as="div" className="panel" y={-28} delay={80}>
              <h3 style={{ margin: "0 0 6px" }}>Built for speed</h3>
              <p className="hint" style={{ margin: 0 }}>
                Solana settles in seconds with near-zero fees, perfect for active trading and playful experimentation.
              </p>
            </Reveal>

            <Reveal as="div" className="panel" y={30} delay={140}>
              <h3 style={{ margin: "0 0 6px" }}>Community-first</h3>
              <p className="hint" style={{ margin: 0 }}>
                We ship publicly and iterate with holders. No mystery boxes — only features you can touch.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <Reveal as="h2" className="section-title" y={-18}>
            Token quick facts
          </Reveal>
          <div
            className="grid3"
            style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", marginTop: 10 }}
          >
            <Reveal as="div" className="panel" y={28}>
              <div className="row between">
                <div className="label">Supply</div>
                <div className="badge">placeholder</div>
              </div>
              <div className="divider" />
              <p className="hint" style={{ margin: 0 }}>1,000,000,000 1FA</p>
            </Reveal>

            <Reveal as="div" className="panel" y={-28} delay={80}>
              <div className="row between">
                <div className="label">Fees</div>
                <div className="badge">v1</div>
              </div>
              <div className="divider" />
              <p className="hint" style={{ margin: 0 }}>0% buy / sell (placeholder)</p>
            </Reveal>

            <Reveal as="div" className="panel" y={30} delay={140}>
              <div className="row between">
                <div className="label">LP</div>
                <div className="badge">locked</div>
              </div>
              <div className="divider" />
              <p className="hint" style={{ margin: 0 }}>Details will be published openly.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal as="h2" className="section-title" y={-18}>
            How to buy in 3 steps
          </Reveal>
        </div>

        <div className="container">
          <div
            className="grid3"
            style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", marginTop: 10 }}
          >
            <Reveal as="div" className="panel" y={24}>
              <div className="badge" style={{ marginBottom: 6 }}>Step 1</div>
              <h3 style={{ margin: 0 }}>Install Phantom</h3>
              <p className="hint" style={{ margin: 0 }}>
                Create a wallet and safely back up your seed phrase.
              </p>
            </Reveal>

            <Reveal as="div" className="panel" y={-26} delay={80}>
              <div className="badge" style={{ marginBottom: 6 }}>Step 2</div>
              <h3 style={{ margin: 0 }}>Fund with SOL</h3>
              <p className="hint" style={{ margin: 0 }}>
                Buy SOL on an exchange or on-ramp, then send to Phantom.
              </p>
            </Reveal>

            <Reveal as="div" className="panel" y={28} delay={140}>
              <div className="badge" style={{ marginBottom: 6 }}>Step 3</div>
              <h3 style={{ margin: 0 }}>Open App</h3>
              <p className="hint" style={{ margin: 0 }}>
                Use the dedicated page to connect Phantom and trade 1FA.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container" style={{ display: "grid", gap: 12 }}>
          <Reveal as="h2" className="section-title" y={-20}>
            FAQ
          </Reveal>

          <Reveal as="div" className="panel" y={22}>
            <div className="row between">
              <strong>Is this financial advice?</strong>
              <div className="badge">Nope</div>
            </div>
            <div className="divider" />
            <p className="hint" style={{ margin: 0 }}>
              Crypto is risky. Do your own research and never invest more than you can afford to lose.
            </p>
          </Reveal>

          <Reveal as="div" className="panel" y={-24} delay={80}>
            <div className="row between">
              <strong>Which wallets are supported?</strong>
              <div className="badge">Phantom</div>
            </div>
            <div className="divider" />
            <p className="hint" style={{ margin: 0 }}>
              Phantom is supported out of the box. More wallets can be added later via the Solana Wallet Adapter.
            </p>
          </Reveal>

          <Reveal as="div" className="panel" y={26} delay={140}>
            <div className="row between">
              <strong>Are the numbers final?</strong>
              <div className="badge">Placeholder</div>
            </div>
            <div className="divider" />
            <p className="hint" style={{ margin: 0 }}>
              All tokenomics above are placeholders until finalized. We’ll publish changes clearly.
            </p>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
