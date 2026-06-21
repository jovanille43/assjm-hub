"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/* ────────────────────────────────────────────────────────────────────────────
   Vrai ballon de football : icosaèdre tronqué — 12 pentagones + 20 hexagones
   (le motif « Telstar » classique). Chaque panneau est subdivisé puis projeté
   sur la sphère ; un léger retrait vers le centre du panneau crée les rainures
   de couture, comblées par une sphère interne sombre.
   ──────────────────────────────────────────────────────────────────────────── */

type Panel = { corners: THREE.Vector3[]; pentagon: boolean };

function buildPanels(): Panel[] {
  const t = (1 + Math.sqrt(5)) / 2;

  // 12 sommets de l'icosaèdre (normalisés)
  const V = (
    [
      [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
      [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
      [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
    ] as [number, number, number][]
  ).map((v) => new THREE.Vector3(...v).normalize());

  // 20 faces triangulaires
  const F: [number, number, number][] = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];

  const panels: Panel[] = [];

  // Hexagones — un par face : sommets aux 1/3 et 2/3 de chaque arête
  for (const [a, b, c] of F) {
    const A = V[a], B = V[b], C = V[c];
    panels.push({
      pentagon: false,
      corners: [
        A.clone().lerp(B, 1 / 3), A.clone().lerp(B, 2 / 3),
        B.clone().lerp(C, 1 / 3), B.clone().lerp(C, 2 / 3),
        C.clone().lerp(A, 1 / 3), C.clone().lerp(A, 2 / 3),
      ],
    });
  }

  // Pentagones — un par sommet : points aux 1/3 vers chacun des 5 voisins,
  // triés angulairement autour de l'axe radial pour former le polygone
  for (let i = 0; i < V.length; i++) {
    const neighbors = new Set<number>();
    for (const face of F) {
      if (face.includes(i)) face.forEach((j) => j !== i && neighbors.add(j));
    }
    const center = V[i];
    const pts = [...neighbors].map((j) => center.clone().lerp(V[j], 1 / 3));

    const n = center.clone().normalize();
    const ref = pts[0].clone().sub(center).projectOnPlane(n).normalize();
    const ref90 = new THREE.Vector3().crossVectors(n, ref);
    pts.sort((p, q) => {
      const vp = p.clone().sub(center).projectOnPlane(n);
      const vq = q.clone().sub(center).projectOnPlane(n);
      return Math.atan2(vp.dot(ref90), vp.dot(ref)) - Math.atan2(vq.dot(ref90), vq.dot(ref));
    });

    panels.push({ pentagon: true, corners: pts });
  }

  return panels;
}

function buildBallGeometry(radius: number, seam = 0.05, detail = 3): THREE.BufferGeometry {
  const panels = buildPanels();
  const positions: number[] = [];
  const colors: number[] = [];

  const NAVY = new THREE.Color("#101f47");
  const CREAM = new THREE.Color("#f7f3ea");

  const pushTri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, col: THREE.Color) => {
    // garantit une face orientée vers l'extérieur
    const nrm = new THREE.Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a));
    if (nrm.dot(a.clone().add(b).add(c)) < 0) [b, c] = [c, b];
    for (const p of [a, b, c]) {
      positions.push(p.x, p.y, p.z);
      colors.push(col.r, col.g, col.b);
    }
  };

  // subdivision récursive + projection sphérique → panneaux bombés
  const subdivide = (
    a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3,
    depth: number, col: THREE.Color,
  ) => {
    if (depth === 0) {
      pushTri(
        a.clone().normalize().multiplyScalar(radius),
        b.clone().normalize().multiplyScalar(radius),
        c.clone().normalize().multiplyScalar(radius),
        col,
      );
      return;
    }
    const ab = a.clone().add(b).multiplyScalar(0.5);
    const bc = b.clone().add(c).multiplyScalar(0.5);
    const ca = c.clone().add(a).multiplyScalar(0.5);
    subdivide(a, ab, ca, depth - 1, col);
    subdivide(ab, b, bc, depth - 1, col);
    subdivide(ca, bc, c, depth - 1, col);
    subdivide(ab, bc, ca, depth - 1, col);
  };

  for (const panel of panels) {
    const centroid = panel.corners
      .reduce((s, p) => s.add(p), new THREE.Vector3())
      .multiplyScalar(1 / panel.corners.length);
    const col = panel.pentagon ? NAVY : CREAM;
    // retrait vers le centre → rainure de couture entre panneaux voisins
    const inset = panel.corners.map((p) => p.clone().lerp(centroid, seam));
    for (let i = 0; i < inset.length; i++) {
      subdivide(centroid.clone(), inset[i], inset[(i + 1) % inset.length], detail, col);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

  // tous les points sont sur la sphère → normale = direction radiale (lissage parfait)
  const normals = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    const l = Math.hypot(positions[i], positions[i + 1], positions[i + 2]) || 1;
    normals[i] = positions[i] / l;
    normals[i + 1] = positions[i + 1] / l;
    normals[i + 2] = positions[i + 2] / l;
  }
  geo.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  return geo;
}

export default function BallThree() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth || 400;
    const H = mount.clientHeight || 400;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    mount.appendChild(renderer.domElement);

    // Scène & caméra
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
    camera.position.set(0, 0, 5.8);

    // ──── Lumières ────
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    const key = new THREE.DirectionalLight(0xfff9ee, 4.2);
    key.position.set(4, 6, 4);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x4a72e0, 1.1);
    fill.position.set(-5, -3, 3);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xe11d2a, 3.2);
    rim.position.set(-3, 3, -5);
    scene.add(rim);

    // ──── Groupe ballon ────
    const group = new THREE.Group();
    scene.add(group);

    const RADIUS = 1.5;

    // Panneaux du ballon (icosaèdre tronqué, couleurs par sommet)
    const ballGeo = buildBallGeometry(RADIUS, 0.05, 3);
    const ballMat = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.38,
      metalness: 0.02,
      clearcoat: 0.5,
      clearcoatRoughness: 0.42,
    });
    group.add(new THREE.Mesh(ballGeo, ballMat));

    // Sphère interne sombre — visible dans les rainures = coutures
    const coreGeo = new THREE.SphereGeometry(RADIUS * 0.992, 48, 24);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x0a142e,
      roughness: 0.9,
      metalness: 0,
    });
    group.add(new THREE.Mesh(coreGeo, coreMat));

    // Atmosphère rougeoyante (dos de la sphère)
    const atmGeo = new THREE.SphereGeometry(1.8, 32, 16);
    const atmMat = new THREE.MeshBasicMaterial({
      color: 0xe11d2a,
      transparent: true,
      opacity: 0.07,
      side: THREE.BackSide,
    });
    group.add(new THREE.Mesh(atmGeo, atmMat));

    // ──── Anneau de particules ────
    const PCOUNT = 220;
    const pPos = new Float32Array(PCOUNT * 3);
    const pCol = new Float32Array(PCOUNT * 3);
    const cRed = new THREE.Color(0xe11d2a);
    const cWhite = new THREE.Color(0xffffff);
    const cBlue = new THREE.Color(0x4a72e0);

    for (let i = 0; i < PCOUNT; i++) {
      const a = (i / PCOUNT) * Math.PI * 2;
      const r = 2.25 + Math.sin(a * 6) * 0.18;
      const hgt = Math.sin(a * 4) * 0.22;
      pPos[i * 3] = Math.cos(a) * r;
      pPos[i * 3 + 1] = hgt;
      pPos[i * 3 + 2] = Math.sin(a) * r;
      const c = i % 6 === 0 ? cRed : i % 4 === 0 ? cBlue : cWhite;
      pCol[i * 3] = c.r;
      pCol[i * 3 + 1] = c.g;
      pCol[i * 3 + 2] = c.b;
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.048,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // ──── Anneaux d'énergie (torus) ────
    const t1Geo = new THREE.TorusGeometry(2.08, 0.022, 6, 90);
    const t1Mat = new THREE.MeshBasicMaterial({ color: 0xe11d2a, transparent: true, opacity: 0.6 });
    const t1 = new THREE.Mesh(t1Geo, t1Mat);
    t1.rotation.x = Math.PI / 3;
    scene.add(t1);

    const t2Geo = new THREE.TorusGeometry(2.18, 0.014, 6, 90);
    const t2Mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 });
    const t2 = new THREE.Mesh(t2Geo, t2Mat);
    t2.rotation.x = -Math.PI / 5;
    t2.rotation.y = Math.PI / 4;
    scene.add(t2);

    // ──── Contrôles ────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.4;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;

    // ──── Interaction : coup de pied au clic ────
    let vx = 0, vy = 0;
    const onKick = () => {
      vx = (Math.random() - 0.5) * 0.28;
      vy = (Math.random() > 0.5 ? 1 : -1) * (0.1 + Math.random() * 0.14);
      atmMat.opacity = 0.35; // flash rouge
    };
    renderer.domElement.addEventListener("click", onKick);

    // ──── Boucle d'animation ────
    let raf = 0, t = 0, running = true;

    const tick = () => {
      if (!running) { raf = 0; return; }
      raf = requestAnimationFrame(tick);
      t += 0.008;

      // Flottement vertical
      group.position.y = Math.sin(t) * 0.1;

      // Rotation propre du ballon + vélocité du coup de pied (amorti)
      group.rotation.y += 0.004;
      group.rotation.x += vy;
      group.rotation.z += vx;
      vx *= 0.97;
      vy *= 0.97;

      // Rotation des anneaux
      t1.rotation.z += 0.007;
      t2.rotation.y += 0.004;

      // Rotation anneau particules
      particles.rotation.y += 0.005;
      particles.rotation.x = Math.sin(t * 0.3) * 0.15;

      // Retour atmosphère
      atmMat.opacity = Math.max(0.07, atmMat.opacity * 0.975);

      controls.update();
      renderer.render(scene, camera);
    };

    const ensureRunning = () => { if (running && raf === 0) tick(); };

    const io = new IntersectionObserver(
      ([e]) => {
        running = e.isIntersecting && !document.hidden;
        ensureRunning();
      },
      { threshold: 0.05 },
    );
    io.observe(mount);

    const onVis = () => {
      running = !document.hidden;
      ensureRunning();
    };
    document.addEventListener("visibilitychange", onVis);

    const onResize = () => {
      const w = mount.clientWidth || 400;
      const h = mount.clientHeight || 400;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    tick();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      renderer.domElement.removeEventListener("click", onKick);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", onResize);
      io.disconnect();
      controls.dispose();
      renderer.dispose();
      (
        [ballGeo, ballMat, coreGeo, coreMat, atmGeo, atmMat,
          pGeo, pMat, t1Geo, t1Mat, t2Geo, t2Mat] as THREE.BufferGeometry[] | THREE.Material[]
      ).forEach((o) => (o as { dispose?: () => void }).dispose?.());
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="h-full w-full cursor-pointer"
      title="Cliquer pour shooter !"
      aria-hidden="true"
    />
  );
}
