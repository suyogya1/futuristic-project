import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Reveal from "../components/Reveal";
import MagicBento from "../components/magicBento";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment, Html } from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import Galaxy from "../components/galaxy.jsx";

/** -------- Hero camera + motion config -------- */
const HERO = {
  fov: 50,
  height: 1200,
  coverage: 0.55,
  rotationSpeed: 0.25,
};

/** -------- Error Boundary -------- */
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError(err) {
    return { hasError: true, err };
  }
  componentDidCatch(err) {
    console.error("3D Hero error:", err);
  }
  render() {
    return this.state.hasError ? (this.props.fallback ?? null) : this.props.children;
  }
}

/** -------- Minimal loader badge -------- */
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

/** -------- GLB viewer (rotation passed in) -------- */
function HeroModel({ src = "/model.glb", rotationRef, isDraggingRef, autoRotate }) {
  const holder = useRef();
  const { camera, gl } = useThree();
  const { scene } = useGLTF(src);

  // eye mats we’ll modulate
  const fronts = useRef([]);
  const backs = useRef([]);

  const FRONT_COLOR = useMemo(() => new THREE.Color().setHSL(0.36, 1.0, 0.55), []);
  const BACK_COLOR = useMemo(() => new THREE.Color("#FFF5BF"), []);
  const FRONT_BASE_INTENSITY = 25;
  const BACK_BASE_INTENSITY = 10.0;

  const tRef = useRef(Math.random() * 1000);
  const n1 = (t) => Math.sin(t) * 0.5 + 0.5;
  const n2 = (t) => Math.sin(t * 1.7 + 1.3) * 0.5 + 0.5;

  useEffect(() => {
    if (!scene || !holder.current) return;

    const root = scene.clone(true);
    const box = new THREE.Box3().setFromObject(root);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const center = sphere.center.clone();
    root.position.sub(center);

    holder.current.clear();
    holder.current.add(root);

    // camera fit
    const fovRad = THREE.MathUtils.degToRad(HERO.fov);
    camera.fov = HERO.fov;
    camera.near = 0.01;
    camera.far = 1000;
    camera.position.set(0, 0, sphere.radius * 3);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    const scale =
      ((HERO.coverage * camera.position.z * Math.tan(fovRad / 2)) / (sphere.radius || 1)) * 1.2;
    holder.current.scale.setScalar(scale);

    fronts.current = [];
    backs.current = [];

    root.traverse((o) => {
      if (o.isMesh && o.material) {
        let mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => {
          const name = (m.name || "").toUpperCase();
          if (!(m instanceof THREE.MeshStandardMaterial || m instanceof THREE.MeshPhysicalMaterial)) {
            const newMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
            newMat.roughness = 0.4;
            newMat.metalness = 0.0;
            newMat.name = m.name || "";
            o.material = newMat;
            m = newMat;
          }
          if (name.includes("EYESFRONT")) {
            m.emissive = FRONT_COLOR.clone();
            m.emissiveIntensity = FRONT_BASE_INTENSITY;
            fronts.current.push({ mat: m });
          } else if (name.includes("EYESBACK")) {
            m.emissive = BACK_COLOR.clone();
            m.emissiveIntensity = BACK_BASE_INTENSITY;
            backs.current.push({ mat: m });
          }
        });
      }
    });
  }, [camera, scene, FRONT_COLOR, BACK_COLOR]);

  useEffect(() => {
    gl.physicallyCorrectLights = true;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.35;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, [gl]);

  useFrame((_, delta) => {
    if (holder.current) {
      if (autoRotate && !isDraggingRef.current) {
        rotationRef.current.y += HERO.rotationSpeed * delta;
      }
      holder.current.rotation.copy(rotationRef.current);
    }

    tRef.current += delta;
    const t = tRef.current;

    const frontFlicker = 0.75 + 0.35 * n1(t * 4.0) + 0.15 * n2(t * 7.3);
    fronts.current.forEach(({ mat }) => {
      mat.emissive.copy(FRONT_COLOR);
      mat.emissiveIntensity = FRONT_BASE_INTENSITY * frontFlicker;
      mat.needsUpdate = true;
    });

    const backFlicker = 0.82 + 0.28 * n1(t * 2.2) + 0.12 * n2(t * 3.7);
    backs.current.forEach(({ mat }) => {
      mat.emissive.copy(BACK_COLOR);
      mat.emissiveIntensity = BACK_BASE_INTENSITY * backFlicker;
      mat.needsUpdate = true;
    });
  });

  return (
    <>
      <group ref={holder} />
      {/* Optional tiny fake ground fade – never fills the frame */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]} renderOrder={-1}>
        <circleGeometry args={[0.8, 48]} />
        <meshBasicMaterial transparent opacity={0.18} color="black" />
      </mesh>
    </>
  );
}

useGLTF.preload("/model.glb");

/** -------- Fullscreen drag overlay (DOM over canvas) -------- */
function DragLayer({ rotationRef, isDraggingRef, setAutoRotate, idleDelay = 2000 }) {
  const idleTimer = useRef();
  const prev = useRef([0, 0]);
  const [dragging, setDragging] = useState(false);

  const onDown = (e) => {
    isDraggingRef.current = true;
    setDragging(true);
    prev.current = [e.clientX, e.clientY];
    setAutoRotate(false);
    clearTimeout(idleTimer.current);
  };
  const onUp = () => {
    isDraggingRef.current = false;
    setDragging(false);
    idleTimer.current = setTimeout(() => setAutoRotate(true), idleDelay);
  };
  const onMove = (e) => {
    if (!isDraggingRef.current) return;
    const [px, py] = prev.current;
    const dx = e.clientX - px;
    const dy = e.clientY - py;
    prev.current = [e.clientX, e.clientY];
    rotationRef.current.x += dy * 0.005;
    rotationRef.current.y += dx * 0.005;
  };

  return (
    <Html
      fullscreen
      style={{
        cursor: dragging ? "grabbing" : "grab",
        outline: "none",
      }}
    >
      <div
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        onPointerMove={onMove}
        style={{ position: "absolute", inset: 0 }}
      />
    </Html>
  );
}

/** -------- FULL-BLEED canvas wrapper (no width cap) -------- */
function FullBleedCanvas({ children }) {
  // Choose a viewport unit that’s stable across OS/browsers
  const [vhUnit, setVhUnit] = useState("100vh");
  useEffect(() => {
    if (typeof window !== "undefined" && "CSS" in window && CSS.supports) {
      if (CSS.supports("height", "100dvh")) setVhUnit("100dvh");
      else if (CSS.supports("height", "100svh")) setVhUnit("100svh");
      else setVhUnit("100vh");
    }
  }, []);

  return (
    <div
      style={{
        position: "relative",
        height: `min(${vhUnit}, ${HERO.height}px)`,
        width: "calc(100vw - (100vw - 100%))",
        left: "50%",
        transform: "translateX(-50%)",
        overflow: "visible",
        zIndex: 1,
      }}
    >
      {children}
    </div>
  );
}

/** ===================== PAGE ===================== */
export default function Landing() {
  const dpr = useMemo(() => [1, Math.min(2, Math.round(window.devicePixelRatio || 1.5))], []);
  const rotationRef = useRef(new THREE.Euler(0, 0, 0, "XYZ"));
  const isDraggingRef = useRef(false);
  const [autoRotate, setAutoRotate] = useState(true);

  // local mouseDataRef for Galaxy background
  const mouseDataRef = useRef({ x: 0.5, y: 0.5, active: 0.0 });
  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseDataRef.current = {
        x: e.clientX / window.innerWidth,
        y: 1.0 - e.clientY / window.innerHeight,
        active: 1.0,
      };
    };
    const handleMouseLeave = () => {
      mouseDataRef.current = { ...mouseDataRef.current, active: 0.0 };
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <main>
      {/* Kill any default canvas outline/focus ring + prevent horizontal overflow on Windows */}
      <style>{`
        .section.hero canvas, .section.hero canvas:focus, .section.hero canvas:focus-visible {
          outline: none !important;
          box-shadow: none !important;
        }
        html, body { overflow-x: clip; }
      `}</style>

      {/* Galaxy background layer */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      >
        <Galaxy
          mouseDataRef={mouseDataRef}
          mouseInteraction={true}
          mouseRepulsion={true}
          density={1}
          glowIntensity={0.3}
          twinkleIntensity={0.3}
        />
      </div>

      {/* HERO SECTION */}
      <section
        className="section hero"
        style={{
          paddingTop: 80,
          paddingBottom: 40,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Headings/content */}
        <div className="container" style={{ position: "relative", zIndex: 2 }}>
          <Reveal as="div" style={{ textAlign: "center", marginBottom: 16 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                background: "rgba(126,231,255,0.08)",
                border: "1px solid rgba(126,231,255,0.25)",
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 700,
                color: "#7ee7ff",
                marginBottom: 24,
              }}
            >
              ⚡ Built on Solana
            </div>
          </Reveal>

          <Reveal
            as="h1"
            className="section-title"
            style={{
              fontSize: "clamp(40px, 6vw, 72px)",
              marginBottom: 20,
              textAlign: "center",
              lineHeight: 1.1,
              fontWeight: 900,
              letterSpacing: "-0.03em",
            }}
          >
            The Future of <br />
            <span className="gradient-text">Community Tokens</span>
          </Reveal>

          <Reveal delay={80}>
            <p
              className="section-sub"
              style={{
                maxWidth: 680,
                textAlign: "center",
                fontSize: 20,
                lineHeight: 1.6,
                margin: "0 auto 32px",
              }}
            >
              Your Community. Your Tokens. Your Voice.
            </p>
          </Reveal>
        </div>

        {/* FULL-BLEED 3D CANVAS */}
        <FullBleedCanvas>
          <Canvas
            dpr={dpr}
            camera={{ position: [0, 0.4, 3], fov: HERO.fov, near: 0.1, far: 100 }}
            gl={{
              antialias: true,
              alpha: true,
              premultipliedAlpha: true, // consistent alpha across GPUs/OS
              powerPreference: "high-performance",
            }}
            style={{ width: "100%", height: "100%", cursor: "none" }}
            onCreated={({ gl }) => {
              gl.setClearColor(0x000000, 0); // fully transparent clear
              gl.outputColorSpace = THREE.SRGBColorSpace;
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 1.35;
              gl.physicallyCorrectLights = true;
              gl.autoClear = false; // keeps post FX + alpha stable
              gl.domElement.tabIndex = -1;
              gl.domElement.style.outline = "none";
              gl.domElement.style.cursor = "none";
            }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[2.5, 3.2, 2.4]} intensity={1} castShadow shadow-bias={-0.0003} />
            <Environment preset="city" intensity={0.7} />

            <ErrorBoundary fallback={<NiceLoader label="Couldn’t load model. Check /model.glb" />}>
              <Suspense fallback={<NiceLoader />}>
                <HeroModel rotationRef={rotationRef} isDraggingRef={isDraggingRef} autoRotate={autoRotate} />
                {/* DOM overlay that handles drag + shows a normal cursor */}
                <DragLayer rotationRef={rotationRef} isDraggingRef={isDraggingRef} setAutoRotate={setAutoRotate} />
              </Suspense>
            </ErrorBoundary>

            <EffectComposer enableNormalPass={false} multisampling={2}>
              <Bloom
                intensity={1.85}
                luminanceThreshold={0.0}
                luminanceSmoothing={0.9}
                mipmapBlur
                blendFunction={BlendFunction.ADD}
              />
            </EffectComposer>
          </Canvas>
        </FullBleedCanvas>
      </section>

      {/* ---------- Magic Bento ---------- */}
      <MagicBento />

      {/* ---------- "What is OFA?" section ---------- */}
      <section className="section" style={{ paddingTop: 80, paddingBottom: 80 }}>
        <div className="container" style={{ display: "grid", gap: 24 }}>
          <Reveal as="div" style={{ textAlign: "center" }}>
            <h2 className="section-title" style={{ fontSize: "clamp(32px, 4vw, 48px)", marginBottom: 16 }}>
              What is <span className="gradient-text">OFA</span>?
            </h2>
            <p className="section-sub" style={{ maxWidth: 720, margin: "0 auto", fontSize: 18, lineHeight: 1.6 }}>
              More than just a meme token. OFA represents a new era of community-driven DeFi with professional
              tools, transparent governance, and genuine value creation.
            </p>
          </Reveal>

          <div style={{ display: "grid", gap: 20, marginTop: 40 }}>
            <Reveal
              as="div"
              className="panel"
              direction="left"
              distance={100}
              scale={0.88}
              rotate={-4}
              blur={14}
              duration={1.2}
              style={{
                padding: 32,
                background: "linear-gradient(135deg, rgba(108,124,255,0.08), rgba(126,231,255,0.04))",
                borderColor: "rgba(108,124,255,0.15)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    background: "linear-gradient(135deg, #6c7cff, #7ee7ff)",
                    borderRadius: 12,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 24,
                  }}
                >
                  🎯
                </div>
                <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Why it exists</h3>
              </div>
              <p className="hint" style={{ margin: 0, fontSize: 16, lineHeight: 1.6 }}>
                Memes move culture, but solid infrastructure creates lasting value. OFA combines viral appeal with
                professional-grade tools, creating a token that&apos;s both fun and functional.
              </p>
            </Reveal>

            <Reveal
              as="div"
              className="panel"
              direction="left"
              distance={100}
              scale={0.88}
              rotate={-4}
              blur={14}
              duration={1.2}
              delay={200}
              style={{
                padding: 32,
                background: "linear-gradient(135deg, rgba(108,124,255,0.04), rgba(126,231,255,0.08))",
                borderColor: "rgba(108,124,255,0.15)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    background: "linear-gradient(135deg, #6c7cff, #7ee7ff)",
                    borderRadius: 12,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 24,
                  }}
                >
                  🤝
                </div>
                <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Community-first</h3>
              </div>
              <p className="hint" style={{ margin: 0, fontSize: 16, lineHeight: 1.6 }}>
                Built in public with full transparency. Every feature, every update, every decision is made with
                community input. Your voice matters, your vision shapes our future.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Token Quick Facts ---------- */}
      <section
        className="section"
        style={{
          background: "linear-gradient(180deg, transparent 0%, rgba(108,124,255,0.03) 100%)",
          paddingTop: 80,
          paddingBottom: 80,
        }}
      >
        <div className="container">
          <Reveal as="div" style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 className="section-title" style={{ fontSize: "clamp(32px, 4vw, 48px)", marginBottom: 16 }}>
              Token <span className="gradient-text">Quick Facts</span>
            </h2>
          </Reveal>
          <div
            className="grid3"
            style={{
              display: "grid",
              gap: 24,
              gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
              marginTop: 40,
            }}
          >
            <Reveal
              as="div"
              className="panel"
              direction="left"
              distance={85}
              scale={0.9}
              rotate={-2}
              blur={12}
              duration={1.1}
              style={{ padding: 32 }}
            >
              <div style={{ fontSize: 36, marginBottom: 16 }}>💰</div>
              <div className="row between" style={{ marginBottom: 12 }}>
                <div className="label" style={{ fontSize: 16, fontWeight: 700 }}>
                  Total Supply
                </div>
                <div className="badge" style={{ padding: "6px 12px", fontSize: 11 }}>
                  FIXED
                </div>
              </div>
              <div className="divider" />
              <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#7ee7ff" }}>1,000,000,000</p>
              <p className="hint" style={{ margin: "8px 0 0", fontSize: 14 }}>
                OFA tokens in circulation
              </p>
            </Reveal>

            <Reveal
              as="div"
              className="panel"
              direction="up"
              distance={75}
              scale={0.87}
              blur={14}
              duration={1.15}
              delay={90}
              style={{ padding: 32 }}
            >
              <div style={{ fontSize: 36, marginBottom: 16 }}>💸</div>
              <div className="row between" style={{ marginBottom: 12 }}>
                <div className="label" style={{ fontSize: 16, fontWeight: 700 }}>
                  Trading Fees
                </div>
                <div className="badge" style={{ padding: "6px 12px", fontSize: 11 }}>
                  LIVE
                </div>
              </div>
              <div className="divider" />
              <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#7ee7ff" }}>0%</p>
              <p className="hint" style={{ margin: "8px 0 0", fontSize: 14 }}>
                No buy or sell tax
              </p>
            </Reveal>

            {/* <Reveal
              as="div"
              className="panel"
              direction="right"
              distance={85}
              scale={0.9}
              rotate={2}
              blur={12}
              duration={1.1}
              delay={180}
              role="link"
              tabIndex={0}
              aria-label="View liquidity lock proof (opens in a new tab)"
              title="Opens liquidity lock proof"
              onClick={() =>
                window.open("https://your-liquidity-proof-link.com", "_blank", "noopener,noreferrer")
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  window.open("https://your-liquidity-proof-link.com", "_blank", "noopener,noreferrer");
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = "brightness(1.05)";
                e.currentTarget.style.boxShadow =
                  "0 10px 28px rgba(126,231,255,0.18), 0 0 0 1px rgba(126,231,255,0.45) inset";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "brightness(1)";
                e.currentTarget.style.boxShadow = "0 0 0 1px rgba(126,231,255,0.2) inset";
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(126,231,255,0.5), 0 8px 24px rgba(126,231,255,0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "0 0 0 1px rgba(126,231,255,0.2) inset";
              }}
              style={{
                padding: 32,
                cursor: "pointer",
                transition: "box-shadow .2s ease, filter .2s ease",
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 16 }}>🔒</div>
              <div className="row between" style={{ marginBottom: 12 }}>
                <div className="label" style={{ fontSize: 16, fontWeight: 700 }}>
                  Liquidity
                </div>
                <div
                  className="badge"
                  style={{
                    padding: "6px 12px",
                    fontSize: 11,
                    background: "rgba(126,231,255,0.15)",
                    borderColor: "rgba(126,231,255,0.3)",
                  }}
                >
                  LOCKED
                </div>
              </div>
              <div className="divider" />
              <p style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>✓ Verified</p>
              <p className="hint" style={{ margin: "8px 0 0", fontSize: 14 }}>
                Liquidity permanently secured
              </p>
            </Reveal> */}
          </div>
        </div>
      </section>

      {/* ---------- FAQ + Footer ---------- */}
      <section
        className="section"
        style={{
          background: "linear-gradient(180deg, rgba(108,124,255,0.03) 0%, transparent 100%)",
          paddingTop: 80,
          paddingBottom: 100,
        }}
      >
        <div className="container" style={{ display: "grid", gap: 32 }}>
          <Reveal as="div" style={{ textAlign: "center" }}>
            <h2 className="section-title" style={{ fontSize: "clamp(32px, 4vw, 48px)", marginBottom: 16 }}>
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
            <p className="section-sub" style={{ maxWidth: 680, margin: "0 auto" }}>
              Everything you need to know about OFA
            </p>
          </Reveal>

          <div style={{ marginTop: 32 }}>
            <Reveal
              as="div"
              className="panel"
              direction="left"
              distance={95}
              scale={0.86}
              rotate={-4}
              blur={16}
              duration={1.25}
              style={{
                padding: 28,
                marginBottom: 20,
                background: "linear-gradient(135deg, rgba(108,124,255,0.04), rgba(126,231,255,0.02))",
                borderColor: "rgba(108,124,255,0.12)",
              }}
            >
              <div className="row between" style={{ marginBottom: 16 }}>
                <strong style={{ fontSize: 18, fontWeight: 800 }}>Is this financial advice?</strong>
                <div
                  className="badge"
                  style={{
                    padding: "6px 12px",
                    background: "rgba(255,139,139,0.15)",
                    borderColor: "rgba(255,139,139,0.3)",
                    color: "#ff8b8b",
                  }}
                >
                  No
                </div>
              </div>
              <div className="divider" />
              <p className="hint" style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>
                This is not financial advice. Cryptocurrency investments carry significant risk. Always do your
                own research and never invest more than you can afford to lose.
              </p>
            </Reveal>

            <Reveal
              as="div"
              className="panel"
              direction="right"
              distance={95}
              scale={0.86}
              rotate={4}
              blur={16}
              duration={1.25}
              delay={110}
              style={{
                padding: 28,
                marginBottom: 20,
                background: "linear-gradient(135deg, rgba(126,231,255,0.04), rgba(108,124,255,0.02))",
                borderColor: "rgba(126,231,255,0.12)",
              }}
            >
              <div className="row between" style={{ marginBottom: 16 }}>
                <strong style={{ fontSize: 18, fontWeight: 800 }}>Which wallets are supported?</strong>
                <div
                  className="badge"
                  style={{
                    padding: "6px 12px",
                    background: "rgba(126,231,255,0.15)",
                    borderColor: "rgba(126,231,255,0.3)",
                    color: "#7ee7ff",
                  }}
                >
                  Multiple
                </div>
              </div>
              <div className="divider" />
              <p className="hint" style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>
                Phantom wallet is supported out of the box with seamless one-click connection. Additional Solana
                wallets can be integrated through the Wallet Adapter framework.
              </p>
            </Reveal>

            <Reveal
              as="div"
              className="panel"
              direction="left"
              distance={95}
              scale={0.86}
              rotate={-4}
              blur={16}
              duration={1.25}
              delay={220}
              style={{
                padding: 28,
                background: "linear-gradient(135deg, rgba(108,124,255,0.02), rgba(126,231,255,0.04))",
                borderColor: "rgba(108,124,255,0.12)",
              }}
            >
              <div className="row between" style={{ marginBottom: 16 }}>
                <strong style={{ fontSize: 18, fontWeight: 800 }}>How do I get support?</strong>
                <div
                  className="badge"
                  style={{
                    padding: "6px 12px",
                    background: "rgba(126,231,255,0.15)",
                    borderColor: "rgba(126,231,255,0.3)",
                    color: "#7ee7ff",
                  }}
                >
                  24/7
                </div>
              </div>
              <div className="divider" />
              <p className="hint" style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>
                Our community is active around the clock. Join our X community for instant support, and reach out on for updates and announcements.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          background: "linear-gradient(180deg, transparent 0%, rgba(11,16,32,0.8) 100%)",
          paddingTop: 60,
          paddingBottom: 40,
        }}
      >
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 48,
              marginBottom: 48,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  background: "linear-gradient(135deg, #6c7cff, #7ee7ff)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  marginBottom: 16,
                }}
              >
                One For All
              </div>
              <p
                style={{
                  color: "var(--muted)",
                  lineHeight: 1.6,
                  margin: "0 0 20px",
                  maxWidth: 280,
                }}
              >
                The future of community-driven tokens on Solana. Fast, secure, and built for everyone.
              </p>
              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <a
                  href="https://x.com/oneforall246396"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: 40,
                    height: 40,
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 10,
                    color: "var(--text)",
                    transition: "all 0.2s ease",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.borderColor = "rgba(126,231,255,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div
            style={{
              paddingTop: 32,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 20,
            }}
          >
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <a
                href="https://solscan.io"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "var(--muted)",
                  fontSize: 14,
                  textDecoration: "none",
                  transition: "color 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
              >
                <span>View on Solscan</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                </svg>
              </a>
              <a
                href="https://dexscreener.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "var(--muted)",
                  fontSize: 14,
                  textDecoration: "none",
                  transition: "color 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
              >
                <span>Chart</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
