'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function ThreeBg() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#87CEEB');
    scene.fog = new THREE.Fog('#87CEEB', 5, 25);

    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 50);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';

    scene.add(new THREE.AmbientLight(0xFF8C42, 0.4));

    const letters: THREE.Mesh[] = [];
    const createLetter = (char: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 64; canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#d4912a';
      ctx.font = 'bold 48px Crimson Text, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(char, 32, 32);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      const mat = new THREE.MeshBasicMaterial({
        map: texture, transparent: true, opacity: 0.25,
        depthWrite: false,
      });
      const geo = new THREE.PlaneGeometry(1.2, 1.2);
      const mesh = new THREE.Mesh(geo, mat);

      // Random position
      mesh.position.set(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 10,
        Math.random() * 6 - 3
      );
      mesh.rotation.z = (Math.random() - 0.5) * 0.5;
      mesh.userData = {
        speedX: (Math.random() - 0.5) * 0.003,
        speedY: (Math.random() - 0.5) * 0.002,
        speedZ: (Math.random() - 0.5) * 0.004,
        rotSpeed: (Math.random() - 0.5) * 0.003,
      };

      scene.add(mesh);
      return mesh;
    };

    // Create 20 floating letters
    for (let i = 0; i < 20; i++) {
      const char = LETTERS[Math.floor(Math.random() * LETTERS.length)];
      letters.push(createLetter(char));
    }

    // Small floating dots
    const dotsGeo = new THREE.BufferGeometry();
    const dotsCount = 80;
    const positions = new Float32Array(dotsCount * 3);
    for (let i = 0; i < dotsCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = Math.random() * 8 - 4;
    }
    dotsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const dotsMat = new THREE.PointsMaterial({
      color: 0xFF8C42, size: 0.04, transparent: true, opacity: 0.5,
      depthWrite: false,
    });
    const dots = new THREE.Points(dotsGeo, dotsMat);
    scene.add(dots);

    // Animation loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      letters.forEach(m => {
        m.position.x += m.userData.speedX;
        m.position.y += m.userData.speedY;
        m.position.z += m.userData.speedZ;
        m.rotation.z += m.userData.rotSpeed;

        // Wrap around
        if (Math.abs(m.position.x) > 9) m.position.x *= -1;
        if (Math.abs(m.position.y) > 6) m.position.y *= -1;
        if (m.position.z > 5) m.position.z = -5;
        if (m.position.z < -5) m.position.z = 5;
      });

      dots.rotation.y += 0.0003;
      dots.rotation.x += 0.0001;

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const onResize = () => {
      if (!containerRef.current) return;
      const nw = containerRef.current.clientWidth;
      const nh = containerRef.current.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0" style={{ zIndex: 0 }} />;
}
