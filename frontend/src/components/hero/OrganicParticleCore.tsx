import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

interface OrganicParticleCoreProps {
  onNodeClick?: () => void;
}

// GLSL Vertex Shader: Computes base organic geometry, multi-frequency travelling surface waves,
// solitary radial wave propagation, cursor-reactive displacement, and individual organic oscillation.
const vertexShader = `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec3 uMouseSpherePos;
  uniform float uMouseInfluence;
  uniform vec3 uWaveEpicenters[3];
  uniform float uWaveTimes[3];
  uniform float uWaveSpeeds[3];
  uniform float uWaveAmplitudes[3];
  uniform float uScrollY;

  attribute float aBaseRadius;
  attribute float aPhase;
  attribute float aLayer; // 0 = interior cavity, 1 = main shell, 2 = atmospheric halo
  attribute float aSize;

  varying float vElevation;
  varying float vWaveActivity;
  varying float vLayer;
  varying float vDepth;
  varying vec3 vNormal;

  // Multi-frequency spherical harmonics for organic cellular surface
  float organicNoise(vec3 p) {
    float theta = atan(p.z, p.x);
    float phi = acos(clamp(p.y / max(length(p), 0.001), -1.0, 1.0));
    
    float n1 = sin(theta * 3.0) * cos(phi * 4.0) * 0.12;
    float n2 = sin(theta * 6.0 + phi * 5.0) * 0.07;
    float n3 = cos(theta * 9.0 - phi * 3.0) * 0.035;
    return n1 + n2 + n3;
  }

  void main() {
    vLayer = aLayer;
    vec3 unitDir = normalize(position);
    vNormal = unitDir;

    float r = aBaseRadius;
    float theta = atan(unitDir.z, unitDir.x);
    float phi = acos(clamp(unitDir.y, -1.0, 1.0));

    // 1. Organic Base Deformation (not a perfect mathematical ball)
    float baseDeform = organicNoise(unitDir * 10.0);
    r *= (1.0 + baseDeform);

    // 2. Individual subtle organic breathing
    float microOscillation = sin(uTime * 2.2 + aPhase) * 0.85;

    // 3. Multi-frequency Travelling Surface Waves (flowing across sphere)
    // Wave A: Diagonal ascending travelling wave
    float phaseA = 4.0 * theta + 3.2 * phi - uTime * 2.1;
    float waveA = sin(phaseA) * 3.8;

    // Wave B: Diagonal descending cross wave
    float phaseB = -3.5 * theta + 4.2 * phi - uTime * 2.6;
    float waveB = sin(phaseB) * 3.2;

    // Wave C: High-frequency membrane vibration ripple
    float phaseC = 8.0 * theta - 6.0 * phi + uTime * 3.2;
    float waveC = sin(phaseC) * 1.6;

    float combinedSurfaceWaves = waveA + waveB + waveC;

    // 4. Dynamic Travelling Solitary Waves (originating from dynamic epicenters)
    float dynamicPulseDisp = 0.0;
    float dynamicPulseBrightness = 0.0;

    for (int i = 0; i < 3; i++) {
      if (uWaveTimes[i] > 0.0) {
        float epicDist = length(unitDir - normalize(uWaveEpicenters[i]));
        float wavefront = uWaveTimes[i] * uWaveSpeeds[i];
        float deltaDist = epicDist - wavefront;
        
        // Ring envelope with smooth radial falloff
        float envelope = exp(-pow(deltaDist / 0.28, 2.0)) * exp(-0.45 * uWaveTimes[i]);
        float pulse = sin(deltaDist * 16.0) * uWaveAmplitudes[i] * envelope;
        
        dynamicPulseDisp += pulse;
        dynamicPulseBrightness += clamp(envelope * 1.4, 0.0, 1.0);
      }
    }

    // 5. Cursor Reactive Displacement & Surface Shockwave
    float cursorDisp = 0.0;
    if (uMouseInfluence > 0.001) {
      float mDist = length(unitDir - normalize(uMouseSpherePos));
      if (mDist < 0.65) {
        float factor = 1.0 - smoothstep(0.0, 0.65, mDist);
        cursorDisp = sin(mDist * 14.0 - uTime * 4.0) * factor * 5.0 * uMouseInfluence;
      }
    }

    // Combine all surface wave displacements (only apply full wave amplitude to main shell and interior)
    float totalWaveDisp = (combinedSurfaceWaves + dynamicPulseDisp + cursorDisp);
    if (aLayer > 1.5) {
      totalWaveDisp *= 0.2; // Atmospheric halo has gentle wave response
    }

    float finalRadius = r + totalWaveDisp + microOscillation;
    vec3 displacedPosition = unitDir * finalRadius;

    // Scroll parallax / shift
    displacedPosition.y += uScrollY * 0.08;

    vec4 modelViewPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
    gl_Position = projectionMatrix * modelViewPosition;

    // Volumetric Depth (eye-space z)
    vDepth = -modelViewPosition.z;

    // Relative elevation for brightness shading in fragment shader
    vElevation = totalWaveDisp;
    vWaveActivity = clamp((abs(combinedSurfaceWaves) * 0.12 + dynamicPulseBrightness + abs(cursorDisp) * 0.2), 0.0, 1.0);

    // Particle Point Sizing with perspective attenuation & wave swell
    float sizeMultiplier = aSize;
    if (vElevation > 1.2) {
      sizeMultiplier *= 1.35; // Particles swell at wave crests
    }
    
    // Attenuate with distance
    gl_PointSize = (sizeMultiplier * uPixelRatio * 320.0) / vDepth;
    gl_PointSize = clamp(gl_PointSize, 1.2, 18.0);
  }
`;

// GLSL Fragment Shader: Analytical circular soft disc, glowing corona, depth shading,
// and color transitions matching Image 2 (Deep ruby cavity -> Crimson body -> Scarlet wave ridges -> White hot crests)
const fragmentShader = `
  varying float vElevation;
  varying float vWaveActivity;
  varying float vLayer;
  varying float vDepth;
  varying vec3 vNormal;

  void main() {
    // 1. Analytical Circular Soft Particle with Hot Central Core
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) {
      discard;
    }

    // Soft glowing corona with sharp hot core
    float corona = exp(-dist * 5.2);
    float core = smoothstep(0.18, 0.0, dist);
    float particleShape = corona * 0.85 + core * 0.55;

    // 2. Exact Color Palette from Reference Image 2:
    // Cavity Ruby: vec3(0.38, 0.02, 0.05)
    // Deep Crimson: vec3(0.72, 0.06, 0.12)
    // Primary Vibrant Crimson: vec3(0.90, 0.12, 0.20)
    // Electric Scarlet (Wave Ridge): vec3(1.0, 0.28, 0.36)
    // Luminous Coral / Starlight White: vec3(1.0, 0.90, 0.92)

    vec3 colRuby = vec3(0.42, 0.02, 0.06);
    vec3 colCrimson = vec3(0.88, 0.10, 0.18);
    vec3 colScarlet = vec3(1.0, 0.28, 0.36);
    vec3 colHotPeak = vec3(1.0, 0.92, 0.94);

    vec3 baseColor = mix(colRuby, colCrimson, smoothstep(-2.0, 2.0, vElevation));
    
    // As waves travel across the surface, particles intensely brighten along crests
    vec3 waveColor = mix(baseColor, colScarlet, vWaveActivity);
    if (vElevation > 2.5) {
      float peakFactor = smoothstep(2.5, 5.5, vElevation);
      waveColor = mix(waveColor, colHotPeak, peakFactor * 0.85);
    }

    // 3. Volumetric Depth & Layer Attenuation
    float alpha = particleShape;

    if (vLayer < 0.5) {
      // Internal cavity: darker and more mysterious
      waveColor = mix(colRuby * 0.7, waveColor, 0.35);
      alpha *= 0.55;
    } else if (vLayer > 1.5) {
      // Atmospheric halo: soft translucent glow
      waveColor = colCrimson * 0.9;
      alpha *= 0.28;
    } else {
      // Main active surface shell: crisp, intense, vivid
      alpha *= 0.92;
    }

    // Slight fresnel rim enhancement
    float rim = 1.0 - abs(vNormal.z);
    waveColor += colScarlet * pow(rim, 3.0) * 0.22;

    gl_FragColor = vec4(waveColor, alpha);
  }
`;

export const OrganicParticleCore: React.FC<OrganicParticleCoreProps> = ({ onNodeClick }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 900;
    let height = container.clientHeight || 750;

    // -----------------------------------------------------------------
    // 1. Scene, Perspective Camera & WebGL Renderer
    // -----------------------------------------------------------------
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 215);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Root group for slow 3D rotation and mouse parallax
    const sphereGroup = new THREE.Group();
    scene.add(sphereGroup);

    // -----------------------------------------------------------------
    // 2. Geometry Construction (28,000 Genuine 3D Particles)
    // -----------------------------------------------------------------
    const TOTAL_PARTICLES = 28000;
    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(TOTAL_PARTICLES * 3);
    const baseRadii = new Float32Array(TOTAL_PARTICLES);
    const phases = new Float32Array(TOTAL_PARTICLES);
    const layers = new Float32Array(TOTAL_PARTICLES);
    const sizes = new Float32Array(TOTAL_PARTICLES);

    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const goldenAngle = Math.PI * 2 * (1 - 1 / goldenRatio);

    const BASE_SPHERE_RADIUS = 76.0;

    for (let i = 0; i < TOTAL_PARTICLES; i++) {
      // Golden spiral distribution across unit sphere
      const y = 1 - (i / (TOTAL_PARTICLES - 1)) * 2;
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenAngle * i;

      const unitX = Math.cos(theta) * radiusAtY;
      const unitY = y;
      const unitZ = Math.sin(theta) * radiusAtY;

      // Layer partitioning:
      // 78% Main outer organic shell
      // 14% Dark internal cavity volume
      // 8% Atmospheric soft corona halo
      let layer = 1.0;
      let r = BASE_SPHERE_RADIUS;
      let particleSize = 1.6 + Math.random() * 1.8;

      const layerRand = Math.random();
      if (layerRand < 0.14) {
        // Internal cavity
        layer = 0.0;
        r = BASE_SPHERE_RADIUS * (0.35 + Math.random() * 0.45);
        particleSize *= 0.85;
      } else if (layerRand > 0.92) {
        // Atmospheric halo
        layer = 2.0;
        r = BASE_SPHERE_RADIUS * (1.08 + Math.random() * 0.28);
        particleSize *= 1.4;
      } else {
        // Main surface shell with organic thickness variation
        layer = 1.0;
        r = BASE_SPHERE_RADIUS * (0.86 + Math.random() * 0.26);
      }

      positions[i * 3] = unitX * r;
      positions[i * 3 + 1] = unitY * r;
      positions[i * 3 + 2] = unitZ * r;

      baseRadii[i] = r;
      phases[i] = Math.random() * Math.PI * 2;
      layers[i] = layer;
      sizes[i] = particleSize;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aBaseRadius', new THREE.BufferAttribute(baseRadii, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aLayer', new THREE.BufferAttribute(layers, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    // -----------------------------------------------------------------
    // 3. Custom Shader Material (GPU-side Travelling Waves & Shading)
    // -----------------------------------------------------------------
    const waveEpicenters = [
      new THREE.Vector3(1, 0.4, 0.2).normalize(),
      new THREE.Vector3(-0.8, -0.6, 0.5).normalize(),
      new THREE.Vector3(0.2, 0.9, -0.4).normalize(),
    ];
    const waveTimes = [0.0, 1.8, 3.4];
    const waveSpeeds = [0.65, 0.55, 0.75];
    const waveAmplitudes = [4.5, 4.0, 3.8];

    const shaderMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uMouseSpherePos: { value: new THREE.Vector3(0, 0, 1) },
        uMouseInfluence: { value: 0.0 },
        uWaveEpicenters: { value: waveEpicenters },
        uWaveTimes: { value: waveTimes },
        uWaveSpeeds: { value: waveSpeeds },
        uWaveAmplitudes: { value: waveAmplitudes },
        uScrollY: { value: 0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(geometry, shaderMaterial);
    sphereGroup.add(particleSystem);

    // -----------------------------------------------------------------
    // 4. Subtle Atmospheric Radial Glow Mesh Behind Sphere
    // -----------------------------------------------------------------
    const glowGeo = new THREE.PlaneGeometry(280, 280);
    const createGlowTexture = () => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        grad.addColorStop(0, 'rgba(230, 57, 70, 0.28)');
        grad.addColorStop(0.35, 'rgba(180, 20, 35, 0.12)');
        grad.addColorStop(0.7, 'rgba(90, 5, 15, 0.04)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 256);
      }
      return new THREE.CanvasTexture(c);
    };

    const glowTexture = createGlowTexture();
    const glowMat = new THREE.MeshBasicMaterial({
      map: glowTexture,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMesh.position.z = -30;
    scene.add(glowMesh);

    // -----------------------------------------------------------------
    // 5. Mouse Parallax, Raycasting & Wave Triggering
    // -----------------------------------------------------------------
    let targetRotationX = 0.06;
    let targetRotationY = 0;
    let mouseNDC = new THREE.Vector2(-100, -100);
    let targetMouseInfluence = 0.0;
    let currentMouseInfluence = 0.0;

    const raycaster = new THREE.Raycaster();
    const sphereCollider = new THREE.Sphere(new THREE.Vector3(0, 0, 0), BASE_SPHERE_RADIUS);
    const ray = new THREE.Ray();

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseNDC.set(x, y);

      targetRotationY = x * 0.28;
      targetRotationX = 0.06 - y * 0.22;

      // Project mouse into 3D ray to find intersection with sphere surface
      raycaster.setFromCamera(mouseNDC, camera);
      ray.copy(raycaster.ray);

      const hitPoint = new THREE.Vector3();
      const hit = ray.intersectSphere(sphereCollider, hitPoint);
      if (hit) {
        // Invert sphere group rotation to get local sphere coordinate
        const localHit = hitPoint.clone();
        localHit.applyAxisAngle(new THREE.Vector3(0, 1, 0), -sphereGroup.rotation.y);
        shaderMaterial.uniforms.uMouseSpherePos.value.copy(localHit);
        targetMouseInfluence = 1.0;
      } else {
        targetMouseInfluence = 0.0;
      }
    };

    // Click triggers a powerful travelling surface wave across the sphere
    const onCanvasClick = (e: MouseEvent) => {
      raycaster.setFromCamera(mouseNDC, camera);
      ray.copy(raycaster.ray);
      const hitPoint = new THREE.Vector3();
      const hit = ray.intersectSphere(sphereCollider, hitPoint);

      if (hit) {
        // Launch a new travelling wave from the clicked epicenter
        const localHit = hitPoint.clone().normalize();
        triggerTravellingWave(localHit, 6.5);
      } else {
        // Launch random wave
        const randEpicenter = new THREE.Vector3(
          Math.random() * 2 - 1,
          Math.random() * 2 - 1,
          Math.random() * 2 - 1
        ).normalize();
        triggerTravellingWave(randEpicenter, 5.0);
      }

      if (onNodeClick) onNodeClick();
    };

    let nextWaveSlot = 0;
    const triggerTravellingWave = (epicenter: THREE.Vector3, amplitude: number) => {
      waveEpicenters[nextWaveSlot].copy(epicenter);
      waveTimes[nextWaveSlot] = 0.0;
      waveAmplitudes[nextWaveSlot] = amplitude;
      waveSpeeds[nextWaveSlot] = 0.55 + Math.random() * 0.25;
      nextWaveSlot = (nextWaveSlot + 1) % 3;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    container.addEventListener('click', onCanvasClick);

    // Scroll handler for subtle scroll transitions
    let currentScrollY = 0;
    let targetScrollY = 0;
    const onScroll = () => {
      targetScrollY = window.scrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // Window Resize handler
    const onResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      shaderMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
    };
    window.addEventListener('resize', onResize);

    // Visibility change handler (pauses/resumes render loop to save battery/GPU)
    let isTabVisible = true;
    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // -----------------------------------------------------------------
    // 6. 60 FPS Render Loop with Travelling Wave Propagation & Rotation
    // -----------------------------------------------------------------
    let animId: number;
    let clock = new THREE.Clock();
    let autoWaveTimer = 0;

    const animate = () => {
      if (!isTabVisible) {
        animId = requestAnimationFrame(animate);
        return;
      }

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Continuous 3D rotation revealing genuine volumetric depth
      sphereGroup.rotation.y += 0.0035;
      sphereGroup.rotation.y += (targetRotationY - sphereGroup.rotation.y) * 0.04;
      sphereGroup.rotation.x += (targetRotationX - sphereGroup.rotation.x) * 0.04;

      // Smooth mouse influence interpolation
      currentMouseInfluence += (targetMouseInfluence - currentMouseInfluence) * 0.1;
      shaderMaterial.uniforms.uMouseInfluence.value = currentMouseInfluence;

      // Smooth scroll parallax interpolation
      currentScrollY += (targetScrollY - currentScrollY) * 0.08;
      shaderMaterial.uniforms.uScrollY.value = currentScrollY;

      // Update shader uniforms
      shaderMaterial.uniforms.uTime.value = time;

      // Advance dynamic solitary travelling waves
      for (let i = 0; i < 3; i++) {
        waveTimes[i] += delta;
      }
      shaderMaterial.uniforms.uWaveTimes.value = waveTimes;

      // Automatically launch new natural travelling waves every ~2.5s
      autoWaveTimer += delta;
      if (autoWaveTimer > 2.6) {
        autoWaveTimer = 0;
        const autoEpicenter = new THREE.Vector3(
          Math.sin(time * 0.8) * 0.8,
          Math.cos(time * 0.6) * 0.8,
          Math.sin(time * 1.1)
        ).normalize();
        triggerTravellingWave(autoEpicenter, 4.2 + Math.random() * 1.5);
      }

      // Atmospheric glow subtle breathing
      glowMesh.scale.setScalar(1.0 + Math.sin(time * 1.8) * 0.04);
      glowMesh.position.y = -currentScrollY * 0.05;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    // -----------------------------------------------------------------
    // 7. Cleanup WebGL Resources on Unmount
    // -----------------------------------------------------------------
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('click', onCanvasClick);
      document.removeEventListener('visibilitychange', onVisibilityChange);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      geometry.dispose();
      shaderMaterial.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      glowTexture.dispose();
      renderer.dispose();
    };
  }, [onNodeClick]);

  return (
    <div
      ref={mountRef}
      className="relative w-full h-[520px] sm:h-[620px] lg:h-[720px] xl:h-[760px] flex items-center justify-center select-none overflow-visible cursor-grab active:cursor-grabbing"
    >
      {/* Background Volumetric Crimson Core Aura */}
      <div className="absolute inset-0 bg-radial-glow opacity-75 pointer-events-none -z-10" />
    </div>
  );
};

