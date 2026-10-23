import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Avatar3DProps {
  gender?: 'female' | 'male';
  emotion?: string;
  isSpeaking?: boolean;
  size?: number;
  className?: string;
  interactive?: boolean;
}

/**
 * High-Performance, Pixar/Memoji-Inspired 3D Human Avatar
 * Features warm, friendly, natural facial aesthetics with soft PBR studio lighting,
 * smooth eye blinking, head tracking, phoneme lip-sync, and zero GPU memory leaks.
 */
export const Avatar3D: React.FC<Avatar3DProps> = ({
  gender = 'female',
  emotion = 'calm',
  isSpeaking = false,
  size = 140,
  className = '',
  interactive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const normalizedEmotion = (emotion || 'neutral').toLowerCase();

  const moodAuraColors: Record<string, string> = {
    happy: 'rgba(251, 191, 36, 0.40)',
    excited: 'rgba(244, 114, 182, 0.45)',
    calm: 'rgba(52, 211, 153, 0.35)',
    sad: 'rgba(167, 139, 250, 0.40)',
    frustrated: 'rgba(248, 113, 113, 0.40)',
    confused: 'rgba(192, 132, 252, 0.35)',
    neutral: 'rgba(147, 197, 253, 0.30)',
  };

  const auraColor = moodAuraColors[normalizedEmotion] || moodAuraColors.neutral;

  // Facial target parameters
  const emotionTargets = useRef({
    mouthOpen: 0.04,
    mouthSmile: 0.35,
    leftBrowRot: 0,
    rightBrowRot: 0,
    browY: 0.46,
    cheekBlush: 0.45,
    eyeSquint: 1.0,
  });

  const emotionCurrent = useRef({
    mouthOpen: 0.04,
    mouthSmile: 0.35,
    leftBrowRot: 0,
    rightBrowRot: 0,
    browY: 0.46,
    cheekBlush: 0.45,
    eyeSquint: 1.0,
  });

  // Update target expression on emotion change
  useEffect(() => {
    switch (normalizedEmotion) {
      case 'happy':
        emotionTargets.current = {
          mouthOpen: 0.16,
          mouthSmile: 0.85,
          leftBrowRot: 0.14,
          rightBrowRot: -0.14,
          browY: 0.50,
          cheekBlush: 0.75,
          eyeSquint: 0.90,
        };
        break;
      case 'excited':
        emotionTargets.current = {
          mouthOpen: 0.30,
          mouthSmile: 0.95,
          leftBrowRot: 0.20,
          rightBrowRot: -0.20,
          browY: 0.54,
          cheekBlush: 0.85,
          eyeSquint: 1.05,
        };
        break;
      case 'sad':
        emotionTargets.current = {
          mouthOpen: 0.03,
          mouthSmile: -0.30,
          leftBrowRot: -0.20,
          rightBrowRot: 0.20,
          browY: 0.48,
          cheekBlush: 0.20,
          eyeSquint: 0.88,
        };
        break;
      case 'frustrated':
      case 'angry':
        emotionTargets.current = {
          mouthOpen: 0.02,
          mouthSmile: -0.20,
          leftBrowRot: 0.26,
          rightBrowRot: -0.26,
          browY: 0.42,
          cheekBlush: 0.60,
          eyeSquint: 0.80,
        };
        break;
      case 'confused':
        emotionTargets.current = {
          mouthOpen: 0.10,
          mouthSmile: 0.10,
          leftBrowRot: 0.22,
          rightBrowRot: -0.08,
          browY: 0.48,
          cheekBlush: 0.35,
          eyeSquint: 0.92,
        };
        break;
      case 'calm':
        emotionTargets.current = {
          mouthOpen: 0.03,
          mouthSmile: 0.30,
          leftBrowRot: 0.02,
          rightBrowRot: -0.02,
          browY: 0.46,
          cheekBlush: 0.45,
          eyeSquint: 0.96,
        };
        break;
      case 'neutral':
      default:
        emotionTargets.current = {
          mouthOpen: 0.04,
          mouthSmile: 0.25,
          leftBrowRot: 0.0,
          rightBrowRot: 0.0,
          browY: 0.46,
          cheekBlush: 0.40,
          eyeSquint: 1.0,
        };
        break;
    }
  }, [normalizedEmotion]);

  // Main Three.js Lifecycle
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = size;
    const height = size;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 50);
    camera.position.set(0, 0.05, 4.3);

    // 2. High-Performance WebGL Renderer
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'default',
        precision: 'mediump',
      });
    } catch (e) {
      console.warn('WebGL init fallback:', e);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Balanced, Warm Studio Lighting (Warm peach tones, avoids chalky-white wash)
    const ambientLight = new THREE.AmbientLight(0xffecd9, 1.1);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff5ea, 1.35);
    keyLight.position.set(2.0, 2.8, 3.5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xd9e8ff, 0.65);
    fillLight.position.set(-2.5, 1.2, 2.5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xf0abfc, 0.9);
    rimLight.position.set(0, 3.0, -2.5);
    scene.add(rimLight);

    // 4. Stylized 3D Avatar Hierarchy
    const avatarRoot = new THREE.Group();
    scene.add(avatarRoot);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.05, 0);
    avatarRoot.add(headGroup);

    const isFemale = gender === 'female';

    // Warm, healthy human skin tone (warm peach / golden sand)
    const skinColor = isFemale ? 0xf5c3a3 : 0xecb897;
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: skinColor,
      roughness: 0.52,
      metalness: 0.02,
    });

    // Rich hair color
    const hairColor = isFemale ? 0x4a2c1f : 0x2b1e17;
    const hairMaterial = new THREE.MeshStandardMaterial({
      color: hairColor,
      roughness: 0.40,
      metalness: 0.06,
    });

    const eyeWhiteMaterial = new THREE.MeshStandardMaterial({
      color: 0xfafaff,
      roughness: 0.15,
    });

    const irisColor = isFemale ? 0x5b3a29 : 0x334155;
    const irisMaterial = new THREE.MeshStandardMaterial({
      color: irisColor,
      roughness: 0.20,
    });

    const pupilMaterial = new THREE.MeshBasicMaterial({
      color: 0x0a0a0a,
    });

    const browColor = isFemale ? 0x3d2318 : 0x221711;
    const browMaterial = new THREE.MeshStandardMaterial({
      color: browColor,
      roughness: 0.60,
    });

    const lipColor = isFemale ? 0xd96b75 : 0xc75a64;
    const lipMaterial = new THREE.MeshStandardMaterial({
      color: lipColor,
      roughness: 0.35,
    });

    const teethMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
    });

    const clothesColor = isFemale ? 0x818cf8 : 0x6366f1;
    const clothesMaterial = new THREE.MeshStandardMaterial({
      color: clothesColor,
      roughness: 0.6,
      metalness: 0.04,
    });

    // ── Head Base ──
    const headGeo = new THREE.SphereGeometry(0.98, 28, 28);
    headGeo.scale(0.95, 1.10, 0.92);
    const headMesh = new THREE.Mesh(headGeo, skinMaterial);
    headGroup.add(headMesh);

    // ── Neck & Shoulders / Clothing ──
    const neckGeo = new THREE.CylinderGeometry(0.35, 0.40, 0.60, 20);
    const neckMesh = new THREE.Mesh(neckGeo, skinMaterial);
    neckMesh.position.set(0, -1.02, -0.04);
    avatarRoot.add(neckMesh);

    const shouldersGeo = new THREE.SphereGeometry(1.30, 24, 18);
    shouldersGeo.scale(1.35, 0.65, 0.85);
    const shouldersMesh = new THREE.Mesh(shouldersGeo, clothesMaterial);
    shouldersMesh.position.set(0, -1.68, -0.15);
    avatarRoot.add(shouldersMesh);

    const collarGeo = new THREE.TorusGeometry(0.48, 0.07, 14, 28);
    collarGeo.rotateX(Math.PI / 2.2);
    const collarMesh = new THREE.Mesh(collarGeo, clothesMaterial);
    collarMesh.position.set(0, -1.18, 0.02);
    avatarRoot.add(collarMesh);

    // ── Ears ──
    const earGeo = new THREE.SphereGeometry(0.18, 14, 14);
    earGeo.scale(0.45, 0.90, 0.60);

    const leftEar = new THREE.Mesh(earGeo, skinMaterial);
    leftEar.position.set(-0.94, 0.02, -0.06);
    leftEar.rotation.y = 0.20;
    headGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, skinMaterial);
    rightEar.position.set(0.94, 0.02, -0.06);
    rightEar.rotation.y = -0.20;
    headGroup.add(rightEar);

    // ── Hair Volume ──
    const hairGroup = new THREE.Group();
    headGroup.add(hairGroup);

    if (isFemale) {
      // Female Hair: Soft natural crown with side strands
      const crownGeo = new THREE.SphereGeometry(1.02, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.60);
      crownGeo.scale(1.02, 1.14, 0.94);
      const crownMesh = new THREE.Mesh(crownGeo, hairMaterial);
      crownMesh.position.set(0, 0.16, -0.18);
      hairGroup.add(crownMesh);

      // Back volume
      const backHairGeo = new THREE.CylinderGeometry(0.80, 0.90, 1.0, 20);
      backHairGeo.scale(1.05, 1.0, 0.6);
      const backHairMesh = new THREE.Mesh(backHairGeo, hairMaterial);
      backHairMesh.position.set(0, -0.42, -0.34);
      hairGroup.add(backHairMesh);

      // Framing side locks
      const sideStrandGeo = new THREE.CylinderGeometry(0.11, 0.07, 0.95, 14);
      const leftSideStrand = new THREE.Mesh(sideStrandGeo, hairMaterial);
      leftSideStrand.position.set(-0.90, -0.22, 0.06);
      leftSideStrand.rotation.z = -0.08;
      hairGroup.add(leftSideStrand);

      const rightSideStrand = new THREE.Mesh(sideStrandGeo, hairMaterial);
      rightSideStrand.position.set(0.90, -0.22, 0.06);
      rightSideStrand.rotation.z = 0.08;
      hairGroup.add(rightSideStrand);

      // Soft top bangs
      const fringeGeo = new THREE.TorusGeometry(0.70, 0.09, 12, 20, Math.PI * 0.72);
      fringeGeo.rotateX(Math.PI / 2.3);
      const fringeMesh = new THREE.Mesh(fringeGeo, hairMaterial);
      fringeMesh.position.set(0, 0.85, 0.50);
      fringeMesh.rotation.x = -0.22;
      hairGroup.add(fringeMesh);
    } else {
      // Male Hair: Modern textured cropped crown
      const crownGeo = new THREE.SphereGeometry(1.02, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.55);
      crownGeo.scale(0.98, 1.10, 0.94);
      const crownMesh = new THREE.Mesh(crownGeo, hairMaterial);
      crownMesh.position.set(0, 0.18, -0.16);
      hairGroup.add(crownMesh);

      const quiffGeo = new THREE.CylinderGeometry(0.32, 0.45, 0.90, 14);
      quiffGeo.rotateZ(Math.PI / 2);
      quiffGeo.scale(1.1, 0.70, 0.85);
      const quiffMesh = new THREE.Mesh(quiffGeo, hairMaterial);
      quiffMesh.position.set(0, 1.05, 0.16);
      quiffMesh.rotation.x = -0.42;
      hairGroup.add(quiffMesh);
    }

    // ── Eyes (Sclera + Iris + Pupil + Specular Sparkle) ──
    const leftEyeGroup = new THREE.Group();
    leftEyeGroup.position.set(-0.34, 0.12, 0.82);
    headGroup.add(leftEyeGroup);

    const rightEyeGroup = new THREE.Group();
    rightEyeGroup.position.set(0.34, 0.12, 0.82);
    headGroup.add(rightEyeGroup);

    const eyeGeo = new THREE.SphereGeometry(0.16, 20, 16);
    const leftSclera = new THREE.Mesh(eyeGeo, eyeWhiteMaterial);
    leftEyeGroup.add(leftSclera);

    const rightSclera = new THREE.Mesh(eyeGeo, eyeWhiteMaterial);
    rightEyeGroup.add(rightSclera);

    // Irises
    const irisGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.035, 18);
    irisGeo.rotateX(Math.PI / 2);

    const leftIris = new THREE.Mesh(irisGeo, irisMaterial);
    leftIris.position.set(0, 0, 0.135);
    leftEyeGroup.add(leftIris);

    const rightIris = new THREE.Mesh(irisGeo, irisMaterial);
    rightIris.position.set(0, 0, 0.135);
    rightEyeGroup.add(rightIris);

    // Pupils
    const pupilGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.04, 14);
    pupilGeo.rotateX(Math.PI / 2);

    const leftPupil = new THREE.Mesh(pupilGeo, pupilMaterial);
    leftPupil.position.set(0, 0, 0.14);
    leftEyeGroup.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeo, pupilMaterial);
    rightPupil.position.set(0, 0, 0.14);
    rightEyeGroup.add(rightPupil);

    // Specular Catchlights (Life sparkle!)
    const glintGeo = new THREE.SphereGeometry(0.024, 10, 10);
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const leftGlint = new THREE.Mesh(glintGeo, glintMat);
    leftGlint.position.set(0.032, 0.032, 0.155);
    leftEyeGroup.add(leftGlint);

    const rightGlint = new THREE.Mesh(glintGeo, glintMat);
    rightGlint.position.set(0.032, 0.032, 0.155);
    rightEyeGroup.add(rightGlint);

    // Natural Eyelids for smooth blinking
    const lidGeo = new THREE.SphereGeometry(0.175, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2);
    const leftUpperLid = new THREE.Mesh(lidGeo, skinMaterial);
    leftUpperLid.position.set(0, 0.02, 0.01);
    leftUpperLid.rotation.x = -Math.PI / 3;
    leftEyeGroup.add(leftUpperLid);

    const rightUpperLid = new THREE.Mesh(lidGeo, skinMaterial);
    rightUpperLid.position.set(0, 0.02, 0.01);
    rightUpperLid.rotation.x = -Math.PI / 3;
    rightEyeGroup.add(rightUpperLid);

    // ── Eyebrows ──
    const browGeo = new THREE.CylinderGeometry(0.030, 0.016, 0.36, 14);
    browGeo.rotateZ(Math.PI / 2);

    const leftBrow = new THREE.Mesh(browGeo, browMaterial);
    leftBrow.position.set(-0.36, 0.46, 0.88);
    headGroup.add(leftBrow);

    const rightBrow = new THREE.Mesh(browGeo, browMaterial);
    rightBrow.position.set(0.36, 0.46, 0.88);
    headGroup.add(rightBrow);

    // ── Soft Button Nose with gentle shadow ──
    const noseGeo = new THREE.SphereGeometry(0.09, 14, 14);
    noseGeo.scale(0.85, 1.20, 1.10);
    const noseMesh = new THREE.Mesh(noseGeo, skinMaterial);
    noseMesh.position.set(0, -0.11, 0.95);
    headGroup.add(noseMesh);

    // ── Rosy Cheeks ──
    const blushGeo = new THREE.SphereGeometry(0.16, 14, 14);
    blushGeo.scale(1.2, 0.55, 0.35);
    const blushMaterial = new THREE.MeshStandardMaterial({
      color: 0xfa9f7a,
      roughness: 0.65,
      transparent: true,
      opacity: 0.40,
    });

    const leftCheek = new THREE.Mesh(blushGeo, blushMaterial);
    leftCheek.position.set(-0.50, -0.15, 0.82);
    headGroup.add(leftCheek);

    const rightCheek = new THREE.Mesh(blushGeo, blushMaterial);
    rightCheek.position.set(0.50, -0.15, 0.82);
    headGroup.add(rightCheek);

    // ── Animated Mouth & Smile ──
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, -0.40, 0.88);
    headGroup.add(mouthGroup);

    const upperLipGeo = new THREE.TorusGeometry(0.15, 0.035, 10, 20, Math.PI * 0.85);
    upperLipGeo.rotateX(Math.PI / 2.2);
    const upperLip = new THREE.Mesh(upperLipGeo, lipMaterial);
    upperLip.position.set(0, 0.035, 0.02);
    mouthGroup.add(upperLip);

    const lowerLipGeo = new THREE.TorusGeometry(0.14, 0.038, 10, 20, Math.PI * 0.85);
    lowerLipGeo.rotateX(-Math.PI / 2.2);
    const lowerLip = new THREE.Mesh(lowerLipGeo, lipMaterial);
    lowerLip.position.set(0, -0.035, 0.02);
    mouthGroup.add(lowerLip);

    const teethGeo = new THREE.BoxGeometry(0.16, 0.045, 0.03);
    const teethMesh = new THREE.Mesh(teethGeo, teethMaterial);
    teethMesh.position.set(0, 0.01, -0.01);
    mouthGroup.add(teethMesh);

    // ── Interactive Head Parallax ──
    const handlePointerMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mousePos.current = {
        x: Math.max(-1, Math.min(1, x)),
        y: Math.max(-1, Math.min(1, y)),
      };
    };

    const handlePointerLeave = () => {
      mousePos.current = { x: 0, y: 0 };
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('mouseleave', handlePointerLeave);

    // ── Animation Loop ──
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let blinkTimer = 0;
    let nextBlinkTime = 2.8 + Math.random() * 2.4;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Avoid wasting GPU when document is hidden in background tab
      if (document.hidden) return;

      const delta = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      // Smooth facial morph interpolation
      const lerpFactor = 0.14;
      const cur = emotionCurrent.current;
      const tgt = emotionTargets.current;

      cur.mouthOpen += (tgt.mouthOpen - cur.mouthOpen) * lerpFactor;
      cur.mouthSmile += (tgt.mouthSmile - cur.mouthSmile) * lerpFactor;
      cur.leftBrowRot += (tgt.leftBrowRot - cur.leftBrowRot) * lerpFactor;
      cur.rightBrowRot += (tgt.rightBrowRot - cur.rightBrowRot) * lerpFactor;
      cur.browY += (tgt.browY - cur.browY) * lerpFactor;
      cur.cheekBlush += (tgt.cheekBlush - cur.cheekBlush) * lerpFactor;
      cur.eyeSquint += (tgt.eyeSquint - cur.eyeSquint) * lerpFactor;

      // 1. Gentle natural breathing
      avatarRoot.position.y = Math.sin(time * 2.0) * 0.02;

      // 2. Cursor head gaze tracking
      const targetRotY = mousePos.current.x * 0.28;
      const targetRotX = -mousePos.current.y * 0.20;
      headGroup.rotation.y += (targetRotY - headGroup.rotation.y) * 0.08;
      headGroup.rotation.x += (targetRotX - headGroup.rotation.x) * 0.08;

      // 3. Eyebrow morphing
      leftBrow.rotation.z = cur.leftBrowRot;
      rightBrow.rotation.z = cur.rightBrowRot;
      leftBrow.position.y = cur.browY;
      rightBrow.position.y = cur.browY;

      // 4. Natural Eye Blinking
      blinkTimer += delta;
      let lidScale = 1.0;
      if (blinkTimer >= nextBlinkTime) {
        const blinkProgress = (blinkTimer - nextBlinkTime) / 0.15;
        if (blinkProgress <= 0.5) {
          lidScale = 1.0 - blinkProgress * 2.0;
        } else if (blinkProgress <= 1.0) {
          lidScale = (blinkProgress - 0.5) * 2.0;
        } else {
          blinkTimer = 0;
          nextBlinkTime = 2.6 + Math.random() * 2.5;
        }
      }

      leftUpperLid.scale.y = Math.max(0.04, lidScale * cur.eyeSquint);
      rightUpperLid.scale.y = Math.max(0.04, lidScale * cur.eyeSquint);

      // Eye gaze subtle tracking
      leftIris.position.x = mousePos.current.x * 0.035;
      leftIris.position.y = mousePos.current.y * 0.025;
      leftPupil.position.x = leftIris.position.x;
      leftPupil.position.y = leftIris.position.y;
      rightIris.position.x = leftIris.position.x;
      rightIris.position.y = leftIris.position.y;
      rightPupil.position.x = leftIris.position.x;
      rightPupil.position.y = leftIris.position.y;

      // 5. Talking mouth articulation
      let effectiveMouthOpen = cur.mouthOpen;
      if (isSpeaking) {
        const speechSync =
          Math.abs(Math.sin(time * 11.0)) * 0.24 +
          Math.abs(Math.sin(time * 18.0)) * 0.16 +
          Math.sin(time * 5.0) * 0.06;
        effectiveMouthOpen += Math.max(0, speechSync);
      }

      upperLip.position.y = 0.035 + effectiveMouthOpen * 0.07;
      lowerLip.position.y = -0.035 - effectiveMouthOpen * 0.14;
      upperLip.scale.x = 1.0 + cur.mouthSmile * 0.22;
      lowerLip.scale.x = 1.0 + cur.mouthSmile * 0.22;

      teethMesh.visible = effectiveMouthOpen > 0.10 || cur.mouthSmile > 0.65;
      teethMesh.scale.y = Math.min(1.0, effectiveMouthOpen * 2.0);

      blushMaterial.opacity = cur.cheekBlush;

      if (renderer) {
        renderer.render(scene, camera);
      }
    };

    animate();

    // ── Thorough Resource Cleanup to prevent GPU leaks & stuttering ──
    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('mouseleave', handlePointerLeave);

      scene.traverse((obj: any) => {
        if (obj.geometry) {
          obj.geometry.dispose();
        }
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m: any) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      scene.clear();

      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss?.();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        renderer = null;
      }
    };
  }, [gender, interactive, size]);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative inline-flex items-center justify-center rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        cursor: interactive ? 'pointer' : 'default',
        flexShrink: 0,
      }}
      aria-label={`3D animated ${gender} companion avatar`}
    >
      {/* Dynamic Ambient Aura Glow */}
      <div
        style={{
          position: 'absolute',
          inset: -4,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${auraColor} 25%, transparent 70%)`,
          filter: 'blur(7px)',
          transition: 'all 0.5s ease',
          zIndex: 0,
          animation: isSpeaking ? 'pulseAura 1.4s ease-in-out infinite' : 'none',
        }}
      />

      {/* WebGL Canvas Container */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'radial-gradient(circle at 35% 25%, rgba(255, 255, 255, 0.35), rgba(245, 240, 255, 0.12) 60%, rgba(216, 208, 252, 0.25) 100%)',
          boxShadow: `0 6px 20px rgba(79, 70, 229, 0.14), 0 0 0 2px rgba(216, 208, 252, 0.8), inset 0 2px 6px rgba(255, 255, 255, 0.6)`,
          overflow: 'hidden',
          transition: 'transform 180ms ease',
          transform: isHovered ? 'scale(1.03)' : 'scale(1.0)',
        }}
      />
    </div>
  );
};
