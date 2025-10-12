import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Reveal from "../components/Reveal";
import MagicBento from "../components/magicBento";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, ContactShadows, Html } from "@react-three/drei";
import * as THREE from "three";
import { MOUSE, TOUCH } from "three";

const HERO = {
  fov: 50,
  height: 540,
  coverage: 0.55,
  offsetY: -0.05,
  rotationSpeed: 0.38,
  minPolar: Math.PI * 0.18,
  maxPolar: Math.PI - Math.PI * 0.18,
};

class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError(err) { return { hasError: true, err }; }
  componentDidCatch(err) { console.error("3D Hero error:", err); }
  render() { return this.state.hasError ? (this.props.fallback ?? null) : this.props.children; }
}

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

function HeroModel({ src = "/assets/model.glb", idleDelay = 1600, onInteractChange }) {
  const holder = useRef();
  const controls = useRef();
  const fixedDistRef = useRef(null);
  const { camera } = useThree();
  const { scene } = useGLTF(src);

  const [auto, setAuto] = useState(true);
  const idleTimer = useRef();

  useEffect(() => {
    if (!scene || !holder.current) return;

    const root = scene.clone(true);
    const box = new THREE.Box3().setFromObject(root);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const center = sphere.center.clone();
    root.position.sub(center);

    holder.current.clear();
    holder.current.add(root);

    const fovRad = THREE.MathUtils.degToRad(HERO.fov);
    camera.fov = HERO.fov;
    camera.near = 0.01;
    camera.far = 1000;
    camera.position.set(0, 0, 1);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    if (controls.current) {
      controls.current.target.set(0, HERO.offsetY, 0);
      controls.current.update();
    }

    const baseDist = (sphere.radius / Math.sin(fovRad / 2)) * 1.25;
    const scale = (HERO.coverage * baseDist * Math.tan(fovRad / 2)) / (sphere.radius || 1) * 1.5;

    holder.current.scale.setScalar(scale);

    const target = controls.current ? controls.current.target : new THREE.Vector3(0, 0, 0);
    const dir = new THREE.Vector3(0, 0, 1);
    const pos = dir.multiplyScalar(baseDist).add(target);
    camera.position.copy(pos);
    camera.near = Math.max(0.01, baseDist / 500);
    camera.far = baseDist * 50;
    camera.lookAt(target);
    camera.updateProjectionMatrix();

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

  useFrame((_, d) => {
    if (auto && holder.current) holder.current.rotation.y += HERO.rotationSpeed * d;
  });

  const onStart = () => {
    setAuto(false);
    onInteractChange?.(true);
    if (idleTimer.current) clearTimeout(idleTimer.current);
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
      <group ref={holder}>
        <mesh position={[0.2, 0.5, 0.3]} scale={[0.1, 0.1, 0.1]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="green" emissive="green" />
        </mesh>
      </group>
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

export default function Landing() {
  const [interact, setInteract] = useState(false);
  const dpr = useMemo(() => [1, Math.min(2, Math.round(window.devicePixelRatio || 1.5))], []);

  return (
    <main>
      <section className="section hero" style={{ paddingTop: 80, paddingBottom: 40, position: 'relative', overflow: 'hidden' }}>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <Reveal as="div" style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              background: 'rgba(126,231,255,0.08)',
              border: '1px solid rgba(126,231,255,0.25)',
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 700,
              color: '#7ee7ff',
              marginBottom: 24
            }}>
              <span style={{ fontSize: 16 }}>⚡</span>
              Built on Solana
            </div>
          </Reveal>

          <Reveal as="h1" className="section-title" style={{
            fontSize: 'clamp(40px, 6vw, 72px)',
            marginBottom: 20,
            textAlign: 'center',
            lineHeight: 1.1,
            fontWeight: 900,
            letterSpacing: '-0.03em'
          }}>
            The Future of <br/>
            <span className="gradient-text">Community Tokens</span>
          </Reveal>

          <Reveal delay={80}>
            <p className="section-sub" style={{
              maxWidth: 680,
              textAlign: 'center',
              fontSize: 20,
              lineHeight: 1.6,
              margin: '0 auto 32px'
            }}>
              Experience seamless trading, instant swaps, and zero-friction transactions powered by Solana's lightning-fast blockchain.
            </p>
          </Reveal>

          <Reveal y={14} delay={160}>
            <div style={{
              display: 'flex',
              gap: 16,
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: 48
            }}>
              <a
                href="/buy-sell"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '16px 32px',
                  background: 'linear-gradient(135deg, #6c7cff, #7ee7ff)',
                  color: '#0a0f24',
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: 18,
                  textDecoration: 'none',
                  boxShadow: '0 6px 20px rgba(108,124,255,0.35), 0 0 0 6px rgba(124,139,255,0.15)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(108,124,255,0.45), 0 0 0 8px rgba(124,139,255,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(108,124,255,0.35), 0 0 0 6px rgba(124,139,255,0.15)';
                }}
              >
                Launch App
                <span style={{ fontSize: 20 }}>→</span>
              </a>
              <a
                href="https://x.com/oneforall"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '16px 32px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'var(--text)',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 18,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                }}
              >
                Join Community
              </a>
            </div>
          </Reveal>

          <Reveal y={14} delay={240}>
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

      <MagicBento />

      <section className="section" style={{ paddingTop: 80, paddingBottom: 60 }}>
        <div className="container">
          <Reveal as="div" style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 className="section-title" style={{ fontSize: 'clamp(32px, 4vw, 48px)', marginBottom: 16 }}>
              Why Choose <span className="gradient-text">1FA</span>?
            </h2>
            <p className="section-sub" style={{ maxWidth: 720, margin: '0 auto' }}>
              Built for speed, designed for the community, and powered by cutting-edge technology.
            </p>
          </Reveal>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
            marginTop: 48
          }}>
            <Reveal as="div" className="panel" y={20} style={{
              padding: 28,
              background: 'linear-gradient(135deg, rgba(108,124,255,0.06), rgba(126,231,255,0.04))',
              borderColor: 'rgba(108,124,255,0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                width: 56,
                height: 56,
                display: 'grid',
                placeItems: 'center',
                background: 'linear-gradient(135deg, #6c7cff, #7ee7ff)',
                borderRadius: 16,
                marginBottom: 16,
                fontSize: 28
              }}>⚡</div>
              <h3 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 800 }}>Lightning Fast</h3>
              <p className="hint" style={{ margin: 0, lineHeight: 1.6 }}>
                Transactions settle in under 1 second with near-zero fees. Trade without waiting, trade without limits.
              </p>
            </Reveal>

            <Reveal as="div" className="panel" y={20} delay={100} style={{
              padding: 28,
              background: 'linear-gradient(135deg, rgba(126,231,255,0.06), rgba(108,124,255,0.04))',
              borderColor: 'rgba(126,231,255,0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                width: 56,
                height: 56,
                display: 'grid',
                placeItems: 'center',
                background: 'linear-gradient(135deg, #7ee7ff, #6c7cff)',
                borderRadius: 16,
                marginBottom: 16,
                fontSize: 28
              }}>🔒</div>
              <h3 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 800 }}>Battle Tested</h3>
              <p className="hint" style={{ margin: 0, lineHeight: 1.6 }}>
                Built on Solana's proven infrastructure with bank-grade security protocols and audited smart contracts.
              </p>
            </Reveal>

            <Reveal as="div" className="panel" y={20} delay={200} style={{
              padding: 28,
              background: 'linear-gradient(135deg, rgba(126,231,255,0.04), rgba(108,124,255,0.06))',
              borderColor: 'rgba(108,124,255,0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                width: 56,
                height: 56,
                display: 'grid',
                placeItems: 'center',
                background: 'linear-gradient(135deg, #6c7cff, #7ee7ff)',
                borderRadius: 16,
                marginBottom: 16,
                fontSize: 28
              }}>🌊</div>
              <h3 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 800 }}>Deep Liquidity</h3>
              <p className="hint" style={{ margin: 0, lineHeight: 1.6 }}>
                Access deep liquidity pools and get the best rates. No slippage, no surprises, just smooth swaps.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section" style={{
        background: 'linear-gradient(180deg, rgba(108,124,255,0.03) 0%, transparent 100%)',
        paddingTop: 80,
        paddingBottom: 80
      }}>
        <div className="container">
          <div className="grid3" style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
            <Reveal as="div" className="panel" y={20} style={{ padding: 28 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🚀</div>
              <h3 style={{ marginTop: 0, fontSize: 22, fontWeight: 800 }}>Fast & Low Cost</h3>
              <p className="hint" style={{ lineHeight: 1.6 }}>Solana finality in seconds and fees that round to zero. Experience the speed of light.</p>
            </Reveal>
            <Reveal as="div" className="panel" y={20} delay={80} style={{ padding: 28 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔗</div>
              <h3 style={{ marginTop: 0, fontSize: 22, fontWeight: 800 }}>Composability</h3>
              <p className="hint" style={{ lineHeight: 1.6 }}>Seamlessly integrates with leading DEXs, aggregators, and wallets across the ecosystem.</p>
            </Reveal>
            <Reveal as="div" className="panel" y={20} delay={160} style={{ padding: 28 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>💎</div>
              <h3 style={{ marginTop: 0, fontSize: 22, fontWeight: 800 }}>Community First</h3>
              <p className="hint" style={{ lineHeight: 1.6 }}>Transparent updates, governance participation, and rewards for dedicated holders.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 80, paddingBottom: 80 }}>
        <div className="container" style={{ display: "grid", gap: 24 }}>
          <Reveal as="div" style={{ textAlign: 'center' }}>
            <h2 className="section-title" style={{ fontSize: 'clamp(32px, 4vw, 48px)', marginBottom: 16 }}>
              What is <span className="gradient-text">1FA</span>?
            </h2>
            <p className="section-sub" style={{ maxWidth: 720, margin: '0 auto', fontSize: 18, lineHeight: 1.6 }}>
              More than just a meme token. 1FA represents a new era of community-driven DeFi with professional tools, transparent governance, and genuine value creation.
            </p>
          </Reveal>

          <div style={{ display: "grid", gap: 20, marginTop: 40 }}>
            <Reveal as="div" className="panel" y={26} style={{
              padding: 32,
              background: 'linear-gradient(135deg, rgba(108,124,255,0.08), rgba(126,231,255,0.04))',
              borderColor: 'rgba(108,124,255,0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  background: 'linear-gradient(135deg, #6c7cff, #7ee7ff)',
                  borderRadius: 12,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 24
                }}>🎯</div>
                <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Why it exists</h3>
              </div>
              <p className="hint" style={{ margin: 0, fontSize: 16, lineHeight: 1.6 }}>
                Memes move culture, but solid infrastructure creates lasting value. 1FA combines viral appeal with professional-grade tools, creating a token that's both fun and functional.
              </p>
            </Reveal>

            <Reveal as="div" className="panel" y={-28} delay={80} style={{
              padding: 32,
              background: 'linear-gradient(135deg, rgba(126,231,255,0.08), rgba(108,124,255,0.04))',
              borderColor: 'rgba(126,231,255,0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  background: 'linear-gradient(135deg, #7ee7ff, #6c7cff)',
                  borderRadius: 12,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 24
                }}>⚡</div>
                <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Built for speed</h3>
              </div>
              <p className="hint" style={{ margin: 0, fontSize: 16, lineHeight: 1.6 }}>
                Powered by Solana's blazing-fast blockchain. Sub-second finality and microscopic fees make 1FA perfect for high-frequency trading and seamless user experiences.
              </p>
            </Reveal>

            <Reveal as="div" className="panel" y={30} delay={140} style={{
              padding: 32,
              background: 'linear-gradient(135deg, rgba(108,124,255,0.04), rgba(126,231,255,0.08))',
              borderColor: 'rgba(108,124,255,0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  background: 'linear-gradient(135deg, #6c7cff, #7ee7ff)',
                  borderRadius: 12,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 24
                }}>🤝</div>
                <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Community-first</h3>
              </div>
              <p className="hint" style={{ margin: 0, fontSize: 16, lineHeight: 1.6 }}>
                Built in public with full transparency. Every feature, every update, every decision is made with community input. Your voice matters, your vision shapes our future.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section" style={{
        background: 'linear-gradient(180deg, transparent 0%, rgba(108,124,255,0.03) 100%)',
        paddingTop: 80,
        paddingBottom: 80
      }}>
        <div className="container">
          <Reveal as="div" style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 className="section-title" style={{ fontSize: 'clamp(32px, 4vw, 48px)', marginBottom: 16 }}>
              Token <span className="gradient-text">Quick Facts</span>
            </h2>
          </Reveal>
          <div
            className="grid3"
            style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", marginTop: 40 }}
          >
            <Reveal as="div" className="panel" y={28} style={{ padding: 32 }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>💰</div>
              <div className="row between" style={{ marginBottom: 12 }}>
                <div className="label" style={{ fontSize: 16, fontWeight: 700 }}>Total Supply</div>
                <div className="badge" style={{ padding: '6px 12px', fontSize: 11 }}>FIXED</div>
              </div>
              <div className="divider" />
              <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#7ee7ff' }}>1,000,000,000</p>
              <p className="hint" style={{ margin: '8px 0 0', fontSize: 14 }}>1FA tokens in circulation</p>
            </Reveal>

            <Reveal as="div" className="panel" y={-28} delay={80} style={{ padding: 32 }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>💸</div>
              <div className="row between" style={{ marginBottom: 12 }}>
                <div className="label" style={{ fontSize: 16, fontWeight: 700 }}>Trading Fees</div>
                <div className="badge" style={{ padding: '6px 12px', fontSize: 11 }}>LIVE</div>
              </div>
              <div className="divider" />
              <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#7ee7ff' }}>0%</p>
              <p className="hint" style={{ margin: '8px 0 0', fontSize: 14 }}>No buy or sell tax</p>
            </Reveal>

            <Reveal as="div" className="panel" y={30} delay={140} style={{ padding: 32 }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>🔒</div>
              <div className="row between" style={{ marginBottom: 12 }}>
                <div className="label" style={{ fontSize: 16, fontWeight: 700 }}>Liquidity</div>
                <div className="badge" style={{ padding: '6px 12px', fontSize: 11, background: 'rgba(126,231,255,0.15)', borderColor: 'rgba(126,231,255,0.3)' }}>LOCKED</div>
              </div>
              <div className="divider" />
              <p style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>✓ Verified</p>
              <p className="hint" style={{ margin: '8px 0 0', fontSize: 14 }}>Liquidity permanently secured</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 80, paddingBottom: 80 }}>
        <div className="container">
          <Reveal as="div" style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 className="section-title" style={{ fontSize: 'clamp(32px, 4vw, 48px)', marginBottom: 16 }}>
              Get Started in <span className="gradient-text">3 Steps</span>
            </h2>
            <p className="section-sub" style={{ maxWidth: 680, margin: '0 auto' }}>
              Join the 1FA ecosystem in minutes. No complicated processes, just straightforward setup.
            </p>
          </Reveal>

          <div
            className="grid3"
            style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", marginTop: 48 }}
          >
            <Reveal as="div" className="panel" y={24} style={{
              padding: 32,
              background: 'linear-gradient(135deg, rgba(108,124,255,0.08), transparent)',
              borderColor: 'rgba(108,124,255,0.2)'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                background: 'linear-gradient(135deg, #6c7cff, #7ee7ff)',
                borderRadius: 999,
                fontSize: 20,
                fontWeight: 900,
                color: '#0a0f24',
                marginBottom: 20
              }}>01</div>
              <h3 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 800 }}>Install Phantom</h3>
              <p className="hint" style={{ margin: 0, fontSize: 16, lineHeight: 1.6 }}>
                Download the Phantom wallet extension and create your account. Back up your seed phrase securely.
              </p>
            </Reveal>

            <Reveal as="div" className="panel" y={-26} delay={80} style={{
              padding: 32,
              background: 'linear-gradient(135deg, rgba(126,231,255,0.08), transparent)',
              borderColor: 'rgba(126,231,255,0.2)'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                background: 'linear-gradient(135deg, #7ee7ff, #6c7cff)',
                borderRadius: 999,
                fontSize: 20,
                fontWeight: 900,
                color: '#0a0f24',
                marginBottom: 20
              }}>02</div>
              <h3 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 800 }}>Fund with SOL</h3>
              <p className="hint" style={{ margin: 0, fontSize: 16, lineHeight: 1.6 }}>
                Purchase SOL from any major exchange or on-ramp service, then transfer it to your Phantom wallet.
              </p>
            </Reveal>

            <Reveal as="div" className="panel" y={28} delay={140} style={{
              padding: 32,
              background: 'linear-gradient(135deg, rgba(108,124,255,0.08), transparent)',
              borderColor: 'rgba(108,124,255,0.2)'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                background: 'linear-gradient(135deg, #6c7cff, #7ee7ff)',
                borderRadius: 999,
                fontSize: 20,
                fontWeight: 900,
                color: '#0a0f24',
                marginBottom: 20
              }}>03</div>
              <h3 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 800 }}>Start Trading</h3>
              <p className="hint" style={{ margin: 0, fontSize: 16, lineHeight: 1.6 }}>
                Connect your wallet to our trading interface and swap SOL for 1FA in seconds. It's that simple.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section" style={{
        background: 'linear-gradient(180deg, rgba(108,124,255,0.03) 0%, transparent 100%)',
        paddingTop: 80,
        paddingBottom: 100
      }}>
        <div className="container" style={{ display: "grid", gap: 32 }}>
          <Reveal as="div" style={{ textAlign: 'center' }}>
            <h2 className="section-title" style={{ fontSize: 'clamp(32px, 4vw, 48px)', marginBottom: 16 }}>
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
            <p className="section-sub" style={{ maxWidth: 680, margin: '0 auto' }}>
              Everything you need to know about 1FA
            </p>
          </Reveal>

          <div style={{ marginTop: 32 }}>
            <Reveal as="div" className="panel" y={22} style={{
              padding: 28,
              marginBottom: 20,
              background: 'linear-gradient(135deg, rgba(108,124,255,0.04), rgba(126,231,255,0.02))',
              borderColor: 'rgba(108,124,255,0.12)'
            }}>
              <div className="row between" style={{ marginBottom: 16 }}>
                <strong style={{ fontSize: 18, fontWeight: 800 }}>Is this financial advice?</strong>
                <div className="badge" style={{
                  padding: '6px 12px',
                  background: 'rgba(255,139,139,0.15)',
                  borderColor: 'rgba(255,139,139,0.3)',
                  color: '#ff8b8b'
                }}>No</div>
              </div>
              <div className="divider" />
              <p className="hint" style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>
                This is not financial advice. Cryptocurrency investments carry significant risk. Always do your own research and never invest more than you can afford to lose.
              </p>
            </Reveal>

            <Reveal as="div" className="panel" y={-24} delay={80} style={{
              padding: 28,
              marginBottom: 20,
              background: 'linear-gradient(135deg, rgba(126,231,255,0.04), rgba(108,124,255,0.02))',
              borderColor: 'rgba(126,231,255,0.12)'
            }}>
              <div className="row between" style={{ marginBottom: 16 }}>
                <strong style={{ fontSize: 18, fontWeight: 800 }}>Which wallets are supported?</strong>
                <div className="badge" style={{
                  padding: '6px 12px',
                  background: 'rgba(126,231,255,0.15)',
                  borderColor: 'rgba(126,231,255,0.3)',
                  color: '#7ee7ff'
                }}>Multiple</div>
              </div>
              <div className="divider" />
              <p className="hint" style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>
                Phantom wallet is supported out of the box with seamless one-click connection. Additional Solana wallets can be integrated through the Wallet Adapter framework.
              </p>
            </Reveal>

            <Reveal as="div" className="panel" y={26} delay={140} style={{
              padding: 28,
              background: 'linear-gradient(135deg, rgba(108,124,255,0.02), rgba(126,231,255,0.04))',
              borderColor: 'rgba(108,124,255,0.12)'
            }}>
              <div className="row between" style={{ marginBottom: 16 }}>
                <strong style={{ fontSize: 18, fontWeight: 800 }}>How do I get support?</strong>
                <div className="badge" style={{
                  padding: '6px 12px',
                  background: 'rgba(126,231,255,0.15)',
                  borderColor: 'rgba(126,231,255,0.3)',
                  color: '#7ee7ff'
                }}>24/7</div>
              </div>
              <div className="divider" />
              <p className="hint" style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>
                Our community is active around the clock. Join our Discord for instant support, or reach out on X (Twitter) for updates and announcements.
              </p>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  );
}
