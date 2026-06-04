'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBg() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0f0d0a');
    scene.fog = new THREE.FogExp2('#0f0d0a', 0.0008);

    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 60);
    camera.position.set(0, 2, 14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0'; renderer.domElement.style.left = '0';

    // Warm ambient + point light
    scene.add(new THREE.AmbientLight(0xd4912a, 0.3));
    const pointLight = new THREE.PointLight(0xd4912a, 1.5, 30);
    pointLight.position.set(0, 3, 5);
    scene.add(pointLight);

    // --- Floating stone tablets with letters ---
    const tablets: THREE.Group[] = [];
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    const createTablet = (letter: string) => {
      const group = new THREE.Group();

      // Stone slab
      const slabGeo = new THREE.BoxGeometry(1.8, 2.2, 0.2);
      const slabMat = new THREE.MeshStandardMaterial({ color: 0x3d3528, roughness: 0.8, metalness: 0.1 });
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.castShadow = true;
      group.add(slab);

      // Gold letter on front
      const canvas = document.createElement('canvas');
      canvas.width = 128; canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#d4912a';
      ctx.font = 'bold 72px Crimson Text, Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(letter, 64, 64);

      const tex = new THREE.CanvasTexture(canvas);
      tex.minFilter = THREE.LinearFilter;
      const letterMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
      const letterPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), letterMat);
      letterPlane.position.z = 0.12;
      group.add(letterPlane);

      // Random position in a wide ring
      const angle = Math.random() * Math.PI * 2;
      const radius = 6 + Math.random() * 8;
      group.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 6, Math.sin(angle) * radius - 2);
      group.rotation.y = angle + Math.PI / 2;
      group.rotation.x = (Math.random() - 0.5) * 0.3;
      group.rotation.z = (Math.random() - 0.5) * 0.2;

      group.userData = {
        rotSpeed: (Math.random() - 0.5) * 0.003,
        floatSpeed: 0.3 + Math.random() * 0.5,
        floatAmp: 0.3 + Math.random() * 0.8,
        baseY: group.position.y,
      };

      scene.add(group);
      return group;
    };

    for (let i = 0; i < 16; i++) {
      tablets.push(createTablet(letters[Math.floor(Math.random() * letters.length)]));
    }

    // --- Floating golden particles ---
    const particlesGeo = new THREE.BufferGeometry();
    const count = 200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
      const gold = Math.random() > 0.5 ? 1 : 0.7;
      colors[i * 3] = gold;
      colors[i * 3 + 1] = gold * 0.66;
      colors[i * 3 + 2] = gold * 0.16;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const particlesMat = new THREE.PointsMaterial({
      size: 0.06, vertexColors: true, transparent: true, opacity: 0.6, depthWrite: false,
    });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particles);

    // Animation
    let animId: number;
    const clock = new THREE.Clock();
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      tablets.forEach(m => {
        m.position.y = m.userData.baseY + Math.sin(t * m.userData.floatSpeed) * m.userData.floatAmp;
        m.rotation.y += m.userData.rotSpeed;
      });

      particles.rotation.y += 0.0002;
      particles.rotation.x += 0.0001;

      // Camera subtle drift
      camera.position.x = Math.sin(t * 0.15) * 1.5;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

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

  return <div ref={containerRef} className="absolute inset-0" />;
}
