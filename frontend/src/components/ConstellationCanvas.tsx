import React, { useRef, useEffect } from 'react';

export const ConstellationCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const handleResize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const chromaticColors = [
      '#ffb829', // Saffron Amber Spark
      '#8052ff', // Electric Iris
      '#22d3ee', // Neon Cyan
      '#a855f7', // Vivid Purple
      '#ffffff', // Bone White
    ];

    // =========================================================================
    // 5-STAGE 3D CHOREOGRAPHY ENGINE COORDINATE SYSTEM
    // Stage 1: Human on Right, Left Arm Pointing Left
    // Stage 2: Human Walks to Left, Right Arm Pointing Right
    // Stage 3: 3D Quantum Particle Collision / Singularity Burst
    // Stage 4: 3D Cyber Handshake Connection Mesh
    // Stage 5: Exact 3D Circuit-Traced Zorvik AI Logo (Dual Z + 3 PCB Traces)
    // =========================================================================

    interface AnatomicalNode {
      // Stage 1: Human Pointing Left
      s1X: number;
      s1Y: number;
      s1Z: number;
      // Stage 2: Human Walking to Left & Pointing Right
      s2X: number;
      s2Y: number;
      s2Z: number;
      // Stage 3: Particle Collision Stream & Singularity
      s3X: number;
      s3Y: number;
      s3Z: number;
      s3Phase: number;
      // Stage 4: 3D Handshake
      s4X: number;
      s4Y: number;
      s4Z: number;
      // Stage 5: Exact Circuit-Traced Zorvik AI Logo
      s5X: number;
      s5Y: number;
      s5Z: number;

      color: string;
      s3Color: string;
      s4Color: string;
      s5Color: string;
      size: number;
      isSpark: boolean;
      isBrainCore?: boolean;
      isCircuitNode?: boolean;
      rotSpeed: number;
      rotAngle: number;
    }

    interface WireframeEdge {
      i1: number;
      i2: number;
      color?: string;
      isRing?: boolean;
      stageMask?: number; // Bitmask for which stages edge is active
    }

    const nodes: AnatomicalNode[] = [];
    const edges: WireframeEdge[] = [];

    const addNode = (
      x: number,
      y: number,
      z: number,
      color = '#8052ff',
      isSpark = false,
      size = 2.0,
      isBrainCore = false
    ) => {
      const idx = nodes.length;
      nodes.push({
        s1X: x,
        s1Y: y,
        s1Z: z,
        s2X: x,
        s2Y: y,
        s2Z: z,
        s3X: 0,
        s3Y: 0,
        s3Z: 0,
        s3Phase: Math.random() * Math.PI * 2,
        s4X: 0,
        s4Y: 0,
        s4Z: 0,
        s5X: 0,
        s5Y: 0,
        s5Z: 0,
        color,
        s3Color: '#22d3ee',
        s4Color: '#8052ff',
        s5Color: '#ffb829',
        size,
        isSpark,
        isBrainCore,
        rotSpeed: (Math.random() - 0.5) * 0.03,
        rotAngle: Math.random() * Math.PI * 2,
      });
      return idx;
    };

    const addEdge = (i1: number, i2: number, color?: string, isRing = false, stageMask = 0b11) => {
      if (i1 < nodes.length && i2 < nodes.length && i1 !== i2) {
        edges.push({ i1, i2, color, isRing, stageMask });
      }
    };

    // Helper: Add cross-section ring
    const addCrossSectionRing = (
      centerY: number,
      radiusX: number,
      radiusZ: number,
      segments: number,
      offsetX = 0,
      offsetZ = 0,
      color = '#8052ff',
      sparkCount = 2
    ): number[] => {
      const ringIndices: number[] = [];
      for (let s = 0; s < segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        const x = offsetX + Math.cos(theta) * radiusX;
        const z = offsetZ + Math.sin(theta) * radiusZ;
        const isSpk = s < sparkCount;
        const nodeColor = isSpk ? '#ffb829' : color;
        const idx = addNode(x, centerY, z, nodeColor, isSpk, isSpk ? 2.3 : 1.7);
        ringIndices.push(idx);
      }
      for (let s = 0; s < segments; s++) {
        const next = (s + 1) % segments;
        addEdge(ringIndices[s], ringIndices[next], color, true);
      }
      return ringIndices;
    };

    const bridgeRings = (
      ringA: number[],
      ringB: number[],
      color = 'rgba(128, 82, 255, 0.45)',
      step = 1
    ) => {
      const len = Math.min(ringA.length, ringB.length);
      for (let i = 0; i < len; i += step) {
        addEdge(ringA[i], ringB[i % ringB.length], color, false);
      }
    };

    // -------------------------------------------------------------------------
    // 1. HEAD, CRANIUM & FACIAL VOLUMETRIC ANATOMY
    // -------------------------------------------------------------------------
    const craniumCrown = addNode(-4, -172, 0, '#ffb829', true, 2.8);
    const craniumUpper = addCrossSectionRing(-162, 16, 17, 10, -3, 0, '#8052ff', 2);
    for (const idx of craniumUpper) addEdge(craniumCrown, idx);

    const craniumBrow = addCrossSectionRing(-150, 19, 19, 12, -4, 0, '#22d3ee', 3);
    bridgeRings(craniumUpper, craniumBrow, '#8052ff');

    const noseTip = addNode(-26, -137, 0, '#ffb829', true, 2.7);
    const browCenter = addNode(-21, -148, 0, '#22d3ee', true, 2.4);
    const eyeSocketL = addNode(-17, -143, 7, '#22d3ee', true, 2.2);
    const eyeSocketR = addNode(-17, -143, -7, '#22d3ee', true, 2.2);
    const cheekL = addNode(-12, -133, 13, '#8052ff');
    const cheekR = addNode(-12, -133, -13, '#8052ff');
    const mouthCenter = addNode(-22, -127, 0, '#a855f7', true, 2.2);
    const chinTip = addNode(-21, -119, 0, '#ffb829', true, 2.6);
    const jawAngleL = addNode(3, -124, 11, '#8052ff');
    const jawAngleR = addNode(3, -124, -11, '#8052ff');
    const occiputBase = addNode(12, -142, 0, '#8052ff');

    addEdge(browCenter, noseTip);
    addEdge(browCenter, eyeSocketL);
    addEdge(browCenter, eyeSocketR);
    addEdge(eyeSocketL, noseTip);
    addEdge(eyeSocketR, noseTip);
    addEdge(eyeSocketL, cheekL);
    addEdge(eyeSocketR, cheekR);
    addEdge(noseTip, mouthCenter);
    addEdge(mouthCenter, chinTip);
    addEdge(chinTip, jawAngleL);
    addEdge(chinTip, jawAngleR);
    addEdge(jawAngleL, cheekL);
    addEdge(jawAngleR, cheekR);
    addEdge(jawAngleL, occiputBase);
    addEdge(jawAngleR, occiputBase);

    // Neural Brain Core Cluster
    for (let b = 0; b < 18; b++) {
      const bAng = Math.random() * Math.PI * 2;
      const bRad = Math.random() * 9;
      const bY = -158 + (Math.random() - 0.5) * 14;
      const bZ = Math.sin(bAng) * bRad;
      const bX = -4 + Math.cos(bAng) * bRad * 0.85;
      const isGolden = Math.random() < 0.35;
      addNode(bX, bY, bZ, isGolden ? '#ffb829' : '#22d3ee', true, isGolden ? 2.4 : 1.9, true);
    }

    // -------------------------------------------------------------------------
    // 2. NECK & S-CURVED SPINE VERTEBRAE
    // -------------------------------------------------------------------------
    const neckRing1 = addCrossSectionRing(-110, 8, 8, 8, -2, 0, '#8052ff', 1);
    const neckRing2 = addCrossSectionRing(-100, 9.5, 9.5, 8, -1, 0, '#22d3ee', 1);
    bridgeRings(neckRing1, neckRing2, '#8052ff');
    addEdge(chinTip, neckRing1[0]);
    addEdge(occiputBase, neckRing1[4]);

    const spineNodes: number[] = [];
    const spineYs = [-92, -78, -62, -44, -26, -8, 10, 24];
    const spineCurvaturesX = [1, 5, 8, 6, 2, 4, 8, 6];
    for (let s = 0; s < spineYs.length; s++) {
      const sNode = addNode(spineCurvaturesX[s], spineYs[s], 0, s % 2 === 0 ? '#22d3ee' : '#ffb829', true, 2.4);
      spineNodes.push(sNode);
      if (s > 0) addEdge(spineNodes[s - 1], sNode, '#22d3ee');
    }

    // -------------------------------------------------------------------------
    // 3. TORSO, RIBCAGE & ABDOMEN
    // -------------------------------------------------------------------------
    const sternumNotch = addNode(-8, -94, 0, '#ffb829', true, 2.7);
    const shoulderL = addNode(-2, -90, 32, '#ffb829', true, 2.8);
    const shoulderR = addNode(-2, -90, -32, '#ffb829', true, 2.8);
    const clavicleMidL = addNode(-6, -92, 16, '#8052ff');
    const clavicleMidR = addNode(-6, -92, -16, '#8052ff');

    addEdge(sternumNotch, clavicleMidL);
    addEdge(clavicleMidL, shoulderL);
    addEdge(sternumNotch, clavicleMidR);
    addEdge(clavicleMidR, shoulderR);
    addEdge(shoulderL, spineNodes[0]);
    addEdge(shoulderR, spineNodes[0]);

    const torsoRings: number[][] = [];
    const torsoDefs = [
      { y: -84, rx: 17, rz: 26, offX: -4 },
      { y: -72, rx: 19, rz: 28, offX: -6 },
      { y: -60, rx: 20, rz: 27, offX: -6 },
      { y: -48, rx: 18, rz: 24, offX: -4 },
      { y: -34, rx: 16, rz: 21, offX: -2 },
      { y: -18, rx: 15, rz: 19, offX: -1 },
      { y: -2, rx: 16, rz: 21, offX: 0 },
      { y: 14, rx: 19, rz: 24, offX: 2 },
    ];

    for (let t = 0; t < torsoDefs.length; t++) {
      const def = torsoDefs[t];
      const ring = addCrossSectionRing(def.y, def.rx, def.rz, 12, def.offX, 0, t % 2 === 0 ? '#8052ff' : '#a855f7', 2);
      torsoRings.push(ring);
      if (t > 0) {
        bridgeRings(torsoRings[t - 1], ring, 'rgba(128, 82, 255, 0.4)');
      }
    }

    // -------------------------------------------------------------------------
    // 4. ARMS & HANDS (Stage 1 Left Pointing vs Stage 2 Right Pointing)
    // -------------------------------------------------------------------------
    // Left Arm (Stage 1: Sharply extended to Left pointing at hero headline)
    const armDefsL = [
      { y: -78, x: -12, z: 32, rx: 6.5, rz: 6.5 },
      { y: -68, x: -28, z: 28, rx: 5.8, rz: 5.8 },
      { y: -58, x: -44, z: 24, rx: 5.2, rz: 5.2 },
      { y: -50, x: -62, z: 20, rx: 4.6, rz: 4.6 },
      { y: -44, x: -80, z: 16, rx: 3.8, rz: 3.8 },
    ];

    let prevArmRingL: number[] | null = null;
    const armRingsL: number[][] = [];
    for (const ad of armDefsL) {
      const armRing = addCrossSectionRing(ad.y, ad.rx, ad.rz, 6, ad.x, ad.z, '#8052ff', 1);
      armRingsL.push(armRing);
      if (prevArmRingL) bridgeRings(prevArmRingL, armRing, 'rgba(34, 211, 238, 0.5)');
      prevArmRingL = armRing;
    }
    const handL = addNode(-92, -40, 14, '#ffb829', true, 2.6);
    const indexTipL = addNode(-112, -36, 12, '#22d3ee', true, 3.2); // Extended pointer tip
    const thumbTipL = addNode(-98, -48, 18, '#a855f7', true, 2.2);
    if (prevArmRingL) {
      addEdge(prevArmRingL[0], handL);
      addEdge(prevArmRingL[3], handL);
    }
    addEdge(handL, indexTipL);
    addEdge(handL, thumbTipL);

    // Right Arm (Stage 1 relaxed at side, Stage 2 extended to Right pointing)
    const armDefsR = [
      { y: -76, x: 2, z: -34, rx: 6.5, rz: 6.5 },
      { y: -62, x: 7, z: -35, rx: 5.8, rz: 5.8 },
      { y: -48, x: 12, z: -33, rx: 5.2, rz: 5.2 },
      { y: -34, x: 17, z: -30, rx: 4.6, rz: 4.6 },
      { y: -20, x: 21, z: -27, rx: 3.8, rz: 3.8 },
    ];

    let prevArmRingR: number[] | null = null;
    const armRingsR: number[][] = [];
    for (const ad of armDefsR) {
      const armRing = addCrossSectionRing(ad.y, ad.rx, ad.rz, 6, ad.x, ad.z, '#8052ff', 1);
      armRingsR.push(armRing);
      if (prevArmRingR) bridgeRings(prevArmRingR, armRing, 'rgba(34, 211, 238, 0.5)');
      prevArmRingR = armRing;
    }
    const handR = addNode(26, -9, -25, '#ffb829', true, 2.6);
    const fingersR = addNode(32, -1, -24, '#22d3ee', true, 2.6);
    if (prevArmRingR) {
      addEdge(prevArmRingR[0], handR);
      addEdge(prevArmRingR[3], handR);
    }
    addEdge(handR, fingersR);

    // -------------------------------------------------------------------------
    // 5. PELVIS, HIPS & 3D LEGS
    // -------------------------------------------------------------------------
    const hipJointL = addNode(-3, 26, 17, '#ffb829', true, 2.8);
    const hipJointR = addNode(5, 26, -17, '#ffb829', true, 2.8);
    addEdge(spineNodes[spineNodes.length - 1], hipJointL);
    addEdge(spineNodes[spineNodes.length - 1], hipJointR);

    // Left Leg
    const legDefsL = [
      { y: 44, x: -8, z: 16, rx: 9.5, rz: 9.5 },
      { y: 64, x: -14, z: 14, rx: 8.2, rz: 8.2 },
      { y: 84, x: -20, z: 12, rx: 7.0, rz: 7.0 },
      { y: 104, x: -18, z: 12, rx: 6.2, rz: 6.2 },
      { y: 124, x: -14, z: 12, rx: 5.4, rz: 5.4 },
      { y: 144, x: -18, z: 12, rx: 4.4, rz: 4.4 },
    ];

    let prevLegRingL: number[] | null = null;
    for (const ld of legDefsL) {
      const legRing = addCrossSectionRing(ld.y, ld.rx, ld.rz, 8, ld.x, ld.z, '#8052ff', 1);
      if (prevLegRingL) bridgeRings(prevLegRingL, legRing, 'rgba(128, 82, 255, 0.45)');
      prevLegRingL = legRing;
    }
    const heelL = addNode(-14, 156, 12, '#8052ff', false, 2.0);
    const toeL = addNode(-38, 158, 12, '#ffb829', true, 2.7);
    if (prevLegRingL) {
      addEdge(prevLegRingL[0], heelL);
      addEdge(prevLegRingL[4], toeL);
    }
    addEdge(heelL, toeL);

    // Right Leg
    const legDefsR = [
      { y: 44, x: 10, z: -16, rx: 9.5, rz: 9.5 },
      { y: 64, x: 17, z: -14, rx: 8.2, rz: 8.2 },
      { y: 84, x: 24, z: -12, rx: 7.0, rz: 7.0 },
      { y: 104, x: 30, z: -12, rx: 6.2, rz: 6.2 },
      { y: 124, x: 36, z: -12, rx: 5.4, rz: 5.4 },
      { y: 144, x: 42, z: -12, rx: 4.4, rz: 4.4 },
    ];

    let prevLegRingR: number[] | null = null;
    for (const rd of legDefsR) {
      const legRing = addCrossSectionRing(rd.y, rd.rx, rd.rz, 8, rd.x, rd.z, '#8052ff', 1);
      if (prevLegRingR) bridgeRings(prevLegRingR, legRing, 'rgba(128, 82, 255, 0.45)');
      prevLegRingR = legRing;
    }
    const heelR = addNode(40, 152, -12, '#8052ff', false, 2.0);
    const toeR = addNode(56, 160, -12, '#ffb829', true, 2.7);
    if (prevLegRingR) {
      addEdge(prevLegRingR[0], heelR);
      addEdge(prevLegRingR[4], toeR);
    }
    addEdge(heelR, toeR);

    // Fill surface density
    const baseNodeCount = nodes.length;
    const TOTAL_TARGET = 520;
    for (let i = baseNodeCount; i < TOTAL_TARGET; i++) {
      const randEdge = edges[i % edges.length];
      const n1 = nodes[randEdge.i1];
      const n2 = nodes[randEdge.i2];
      const t = 0.15 + Math.random() * 0.7;
      const jx = (Math.random() - 0.5) * 3;
      const jy = (Math.random() - 0.5) * 3;
      const jz = (Math.random() - 0.5) * 3;

      const hX = (1 - t) * n1.s1X + t * n2.s1X + jx;
      const hY = (1 - t) * n1.s1Y + t * n2.s1Y + jy;
      const hZ = (1 - t) * n1.s1Z + t * n2.s1Z + jz;

      const isSpk = Math.random() < 0.22;
      const col = isSpk ? '#ffb829' : chromaticColors[i % chromaticColors.length];
      addNode(hX, hY, hZ, col, isSpk, isSpk ? 2.3 : 1.6);
    }

    const TOTAL_NODES = nodes.length;

    // -------------------------------------------------------------------------
    // STAGE 2 MAPPING: Human Walks to Left & Right Arm Points Right
    // -------------------------------------------------------------------------
    for (let i = 0; i < TOTAL_NODES; i++) {
      const n = nodes[i];
      // Invert arm pointing kinematics in Stage 2: Right arm points right, left arm relaxes
      if (i === indexTipL || i === handL || i === thumbTipL) {
        n.s2X = -22 + (Math.random() - 0.5) * 6;
        n.s2Y = -12 + (Math.random() - 0.5) * 6;
        n.s2Z = 18;
      } else if (i === fingersR || i === handR) {
        n.s2X = 112; // Pointing Right
        n.s2Y = -38;
        n.s2Z = -12;
      } else {
        n.s2X = n.s1X;
        n.s2Y = n.s1Y;
        n.s2Z = n.s1Z;
      }
    }

    // -------------------------------------------------------------------------
    // STAGE 3 MAPPING: 3D DUAL-LOBE NEURAL CORE & QUANTUM MEMORY ORB
    // (Referencing flagship neural brain constellation from index.html)
    // Fibonacci distribution with organic dual-lobe brain contour modulation
    // -------------------------------------------------------------------------
    for (let i = 0; i < TOTAL_NODES; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / TOTAL_NODES);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;

      // Organic dual-lobe brain contour modulation
      const lobeWarp = 1 + 0.16 * Math.sin(phi * 3) * Math.cos(theta * 2);
      const depthJitter = 0.88 + ((i * 13) % 100) * 0.0024;
      const r = 105 * lobeWarp * depthJitter;

      nodes[i].s3X = r * Math.sin(phi) * Math.cos(theta);
      nodes[i].s3Y = r * Math.cos(phi);
      nodes[i].s3Z = r * Math.sin(phi) * Math.sin(theta);
      nodes[i].s3Color = chromaticColors[i % chromaticColors.length];
    }

    // -------------------------------------------------------------------------
    // STAGE 4 MAPPING: REALISTIC 3D VOLUMETRIC CYBER HANDSHAKE
    // Left Cyber Hand (Cyan #22d3ee) & Right Cyber Hand (Gold #ffb829)
    // meeting, interlocking, and clasping firmly in 3D perspective
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // STAGE 4 MAPPING: REALISTIC 3D ANATOMICAL HUMAN HANDSHAKE
    // -------------------------------------------------------------------------
    // STAGE 4 MAPPING: TRUE 3D VOLUMETRIC POINT-CLOUD HUMAN HANDSHAKE
    // Left Hand (Cyan #22d3ee) & Right Hand (Gold #ffb829)
    // Completely organic 3D particle volume (No artificial circles or cages):
    // 1. Solid Tapering Forearm (50 particles)
    // 2. Anatomical Palm Body & Thenar Pad (60 particles)
    // 3. 5 Volumetric Fingers (Thumb + 4 Fingers, 30 particles each = 150 particles)
    // -------------------------------------------------------------------------
    for (let i = 0; i < TOTAL_NODES; i++) {
      const isLeft = i < TOTAL_NODES / 2;
      const subIdx = i % (TOTAL_NODES / 2); // 0 to 259
      const side = isLeft ? -1 : 1;
      const armColor = isLeft ? '#22d3ee' : '#ffb829';

      // Deterministic pseudo-random seed per node
      const seed1 = Math.sin(i * 997.1 + 13.7) * 0.5 + 0.5;
      const seed2 = Math.cos(i * 613.3 + 71.9) * 0.5 + 0.5;
      const seed3 = Math.sin(i * 389.7 + 43.1) * 0.5 + 0.5;

      if (subIdx < 50) {
        // 1. Solid Organic Forearm (Filled volumetric cylinder, not hollow rings)
        const t = subIdx / 50; // Progress from arm edge (x=±170) to wrist (x=±45)
        const armX = side * (170 - t * 125);
        const radius = (15 - t * 3.5) * Math.sqrt(seed1); // Solid interior fill
        const angle = seed2 * Math.PI * 2;

        nodes[i].s4X = armX;
        nodes[i].s4Y = Math.sin(angle) * (radius * 0.85);
        nodes[i].s4Z = Math.cos(angle) * radius + side * 3;
        nodes[i].s4Color = armColor;
      } else if (subIdx < 110) {
        // 2. Anatomical Palm Body & Thenar Muscle Bed (Solid 3D block)
        const u = seed1; // Wrist to knuckle (x: ±45 -> ±12)
        const v = (seed2 - 0.5) * 2; // Across palm (-14 to +14)
        const w = (seed3 - 0.5) * 2; // Palm thickness (-6 to +6)

        const palmX = side * (45 - u * 33);
        const palmY = v * 13;
        const palmZ = side * (4 - u * 2) + w * 5;

        nodes[i].s4X = palmX;
        nodes[i].s4Y = palmY;
        nodes[i].s4Z = palmZ;
        nodes[i].s4Color = isLeft ? '#8052ff' : '#ffb829';
      } else {
        // 3. 5 Volumetric Articulated Digits (Thumb + Index, Middle, Ring, Pinky - 30 nodes each)
        const digitIdx = Math.floor((subIdx - 110) / 30); // 0=Thumb, 1=Index, 2=Middle, 3=Ring, 4=Pinky
        const s = ((subIdx - 110) % 30) / 30; // 0.0 (Base) -> 1.0 (Fingertip)
        const rThickness = 3.2 * Math.sqrt(seed1); // Solid cylindrical finger core
        const crossAngle = seed2 * Math.PI * 2;
        const offY = Math.sin(crossAngle) * rThickness;
        const offZ = Math.cos(crossAngle) * rThickness;

        if (digitIdx === 0) {
          // THUMB: Arches naturally over the top of the opposing index web
          const thumbAngle = s * Math.PI * 0.82;
          const tx = side * (34 - Math.sin(thumbAngle) * 24);
          const ty = -8 - Math.sin(thumbAngle) * 16 + offY;
          const tz = side * (10 - Math.cos(thumbAngle) * 16) + offZ;
          nodes[i].s4X = tx;
          nodes[i].s4Y = ty;
          nodes[i].s4Z = tz;
          nodes[i].s4Color = '#ffffff'; // High-contrast white thumb
        } else {
          // 4 FINGERS: Wrap around the opposing hand's palm in depth
          const fingerHeights = [-9, -3, 3, 9];
          const baseHeight = fingerHeights[digitIdx - 1];
          const baseKnuckleX = side * 12;

          if (isLeft) {
            // Left fingers wrap BEHIND right hand (z: 4 -> -18 -> -12)
            const fAngle = s * Math.PI * 0.95;
            const fx = baseKnuckleX + Math.sin(fAngle) * 34;
            const fz = 4 - Math.sin(fAngle) * 20 + offZ;
            nodes[i].s4X = fx;
            nodes[i].s4Y = baseHeight + offY;
            nodes[i].s4Z = fz;
          } else {
            // Right fingers wrap IN FRONT around left hand (z: -4 -> +18 -> +12)
            const fAngle = s * Math.PI * 0.95;
            const fx = baseKnuckleX - Math.sin(fAngle) * 34;
            const fz = -4 + Math.sin(fAngle) * 20 + offZ;
            nodes[i].s4X = fx;
            nodes[i].s4Y = baseHeight + offY;
            nodes[i].s4Z = fz;
          }
          nodes[i].s4Color = armColor;
        }
      }
    }
    // -------------------------------------------------------------------------
    // STAGE 5 MAPPING: 3D VOLUMETRIC NEURAL MIND / CEREBRAL CONSCIOUSNESS MATRIX
    // Dual Left & Right cerebral hemispheres with cortical gyri folds, longitudinal fissure,
    // corpus callosum bridge, and inner glowing synaptic core.
    // -------------------------------------------------------------------------
    for (let i = 0; i < TOTAL_NODES; i++) {
      const p = i / TOTAL_NODES;
      const isLeftHemisphere = i % 2 === 0;
      const hemiSign = isLeftHemisphere ? -1 : 1;

      if (p < 0.80) {
        // 1. Dual Cerebral Hemispheres with Cortical Gyri & Sulci Folds
        const phi = Math.acos(1 - 2 * (i / (TOTAL_NODES * 0.80)));
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;

        // Biological cortical gyri undulation harmonics
        const gyriFolds = 1 + 0.15 * Math.sin(6 * theta) * Math.cos(5 * phi) + 0.08 * Math.cos(8 * phi);
        const rx = 68 * gyriFolds;
        const ry = 58 * gyriFolds;
        const rz = 78 * gyriFolds;

        // Longitudinal fissure gap between left and right hemispheres
        const rawX = Math.abs(Math.sin(phi) * Math.cos(theta)) * rx;
        const brainX = hemiSign * (5 + rawX);
        const brainY = -8 + Math.cos(phi) * ry;
        const brainZ = Math.sin(phi) * Math.sin(theta) * rz;

        nodes[i].s5X = brainX;
        nodes[i].s5Y = brainY;
        nodes[i].s5Z = brainZ;
        nodes[i].s5Color = isLeftHemisphere ? '#22d3ee' : '#8052ff';
      } else if (p < 0.92) {
        // 2. Corpus Callosum & Central Neural Thalamus Bridge
        const t = (p - 0.80) / 0.12;
        const bridgeX = (t - 0.5) * 40;
        const bridgeY = -5 + Math.sin(t * Math.PI) * 14;
        const bridgeZ = (Math.random() - 0.5) * 45;

        nodes[i].s5X = bridgeX;
        nodes[i].s5Y = bridgeY;
        nodes[i].s5Z = bridgeZ;
        nodes[i].s5Color = '#ffb829'; // Saffron Synaptic Core
        nodes[i].isBrainCore = true;
      } else {
        // 3. Brainstem & Descending Spinal Axon Column
        const t = (p - 0.92) / 0.08;
        const stemY = 25 + t * 45; // y: 25 -> 70
        const stemRadius = 12 - t * 5;
        const stemAngle = t * 14 * Math.PI;

        nodes[i].s5X = Math.cos(stemAngle) * stemRadius;
        nodes[i].s5Y = stemY;
        nodes[i].s5Z = -12 + Math.sin(stemAngle) * stemRadius;
        nodes[i].s5Color = '#22d3ee';
      }
    }

    // Ambient floating stardust
    const ambientCount = 38;
    const ambientParticles: { x: number; y: number; vx: number; vy: number; color: string; size: number; alpha: number }[] = [];
    for (let i = 0; i < ambientCount; i++) {
      ambientParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        color: chromaticColors[Math.floor(Math.random() * chromaticColors.length)],
        size: Math.random() * 2.0 + 1.0,
        alpha: Math.random() * 0.28 + 0.08,
      });
    }

    let angleX = 0;
    let angleY = 0;
    let targetAngleX = 0;
    let targetAngleY = 0;
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let dragRotX = 0;
    let dragRotY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - prevMouseX;
        const dy = e.clientY - prevMouseY;
        dragRotY += dx * 0.008;
        dragRotX -= dy * 0.008;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
      const mouseX = (e.clientX / width - 0.5) * 2;
      const mouseY = (e.clientY / height - 0.5) * 2;
      targetAngleY = mouseX * 0.45;
      targetAngleX = -mouseY * 0.35;
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        const dx = e.touches[0].clientX - prevMouseX;
        const dy = e.touches[0].clientY - prevMouseY;
        dragRotY += dx * 0.008;
        dragRotX -= dy * 0.008;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = () => {
      isDragging = false;
    };

    let targetScrollY = 0;
    let smoothScrollY = 0;

    const handleScroll = () => {
      targetScrollY = window.scrollY;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    let tick = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      tick += 0.016;

      // Smooth scroll lerp (responsive synchronization)
      smoothScrollY += (targetScrollY - smoothScrollY) * 0.12;

      // Ambient background stardust
      for (const ap of ambientParticles) {
        ap.x += ap.vx;
        ap.y += ap.vy;
        if (ap.x < 0) ap.x = width;
        if (ap.x > width) ap.x = 0;
        if (ap.y < 0) ap.y = height;
        if (ap.y > height) ap.y = 0;
        ctx.fillStyle = ap.color;
        ctx.globalAlpha = ap.alpha;
        ctx.fillRect(ap.x, ap.y, ap.size, ap.size);
      }

      // Smooth camera dampening + drag rotation inertia
      dragRotX *= 0.95;
      dragRotY *= 0.95;
      angleY += (targetAngleY + dragRotY - angleY) * 0.06;
      angleX += (targetAngleX + dragRotX - angleX) * 0.06;

      const isMobile = width < 1024;

      // =========================================================================
      // ROCK-SOLID SECTION-CENTERED 5-STAGE CHOREOGRAPHY
      // Stage 1: Hero (Right side, pointing Left at headline)
      // Stage 2: Capabilities (Walks to Far Left, points Right at cards)
      // Stage 3: Deep Memory (3D Particle Collision / Singularity Burst)
      // Stage 4: Enterprise API (3D Cyber Handshake Connection)
      // Stage 5: Cathedral CTA (Exact 3D Circuit Zorvik AI Logo Before Footer)
      // =========================================================================

      const vh = height;
      const heroEl = document.querySelector('main > section:first-of-type') || document.querySelector('section');
      const featuresEl = document.getElementById('features');
      const memoryEl = document.getElementById('memory');
      const enterpriseEl = document.getElementById('enterprise');
      const allSections = document.querySelectorAll('section');
      const ctaEl = allSections.length > 0 ? (allSections[allSections.length - 1] as HTMLElement) : null;

      // Calculate section midpoints in document space
      const c1 = heroEl ? (heroEl as HTMLElement).offsetTop + (heroEl as HTMLElement).offsetHeight * 0.45 : vh * 0.5;
      const c2 = featuresEl ? featuresEl.offsetTop + featuresEl.offsetHeight * 0.45 : c1 + vh;
      const c3 = memoryEl ? memoryEl.offsetTop + memoryEl.offsetHeight * 0.45 : c2 + vh;
      const c4 = enterpriseEl ? enterpriseEl.offsetTop + enterpriseEl.offsetHeight * 0.45 : c3 + vh * 1.5;
      const c5 = ctaEl ? ctaEl.offsetTop + ctaEl.offsetHeight * 0.45 : c4 + vh;

      // Current viewport focus center in document space
      const viewCenter = smoothScrollY + vh * 0.5;

      let targetCenterX = width * 0.76;
      let targetCenterY = height * 0.50;
      let targetScaleFactor = isMobile ? 1.15 : 1.68;
      let stageRotationY = 0;

      let w1 = 1;
      let w2 = 0;
      let w3 = 0;
      let w4 = 0;
      let w5 = 0;

      if (isMobile) {
        targetCenterX = width * 0.5;
        targetCenterY = height * 0.36;
        targetScaleFactor = 1.15;
        const maxScroll = Math.max(document.body.scrollHeight - vh, 1);
        stageRotationY = (smoothScrollY / maxScroll) * Math.PI * 2;
        if (viewCenter < c2) {
          const t = Math.min(1, Math.max(0, (viewCenter - c1) / (c2 - c1)));
          w1 = 1 - t; w2 = t; w3 = 0; w4 = 0; w5 = 0;
        } else if (viewCenter < c3) {
          const t = Math.min(1, Math.max(0, (viewCenter - c2) / (c3 - c2)));
          w1 = 0; w2 = 1 - t; w3 = t; w4 = 0; w5 = 0;
        } else if (viewCenter < c4) {
          const t = Math.min(1, Math.max(0, (viewCenter - c3) / (c4 - c3)));
          w1 = 0; w2 = 0; w3 = 1 - t; w4 = t; w5 = 0;
        } else {
          const t = Math.min(1, Math.max(0, (viewCenter - c4) / (c5 - c4)));
          w1 = 0; w2 = 0; w3 = 0; w4 = 1 - t; w5 = t;
        }
      } else {
        if (viewCenter <= c1) {
          // STAGE 1: HERO (Human fully on Right, pointing Left at headline)
          targetCenterX = width * 0.76;
          targetCenterY = height * 0.50;
          stageRotationY = 0 + Math.sin(tick * 0.5) * 0.05;
          w1 = 1; w2 = 0; w3 = 0; w4 = 0; w5 = 0;
        } else if (viewCenter < c2) {
          // TRANSITION HERO -> CAPABILITIES (Human walks from Right to Far Left)
          const rawT = (viewCenter - c1) / (c2 - c1);
          const t = Math.min(1, Math.max(0, rawT));
          const st = t * t * (3 - 2 * t);
          targetCenterX = width * 0.76 - st * width * 0.60; // 0.76 -> 0.16
          targetCenterY = height * 0.50;
          stageRotationY = st * Math.PI * 0.40 + Math.sin(tick * 0.5) * 0.05;
          w1 = 1 - st; w2 = st; w3 = 0; w4 = 0; w5 = 0;
        } else if (viewCenter < c3) {
          // CAPABILITIES SECTION: Holds Stage 2 (Far Left) then transitions to Memory
          const rawT = (viewCenter - c2) / (c3 - c2);
          if (rawT < 0.45) {
            // Holds Stage 2 steady while reading Section 2
            targetCenterX = width * 0.16;
            targetCenterY = height * 0.50;
            stageRotationY = Math.PI * 0.40 + Math.sin(tick * 0.5) * 0.05;
            w1 = 0; w2 = 1; w3 = 0; w4 = 0; w5 = 0;
          } else {
            // Transitions to Stage 3 (Collision Singularity in Center)
            const t = (rawT - 0.45) / 0.55;
            const st = t * t * (3 - 2 * t);
            targetCenterX = width * 0.16 + st * width * 0.34; // 0.16 -> 0.50
            targetCenterY = height * 0.50;
            targetScaleFactor = 1.68 + Math.sin(t * Math.PI) * 0.25;
            stageRotationY = Math.PI * 0.40 + st * Math.PI * 0.60 + tick * 0.2;
            w1 = 0; w2 = 1 - st; w3 = st; w4 = 0; w5 = 0;
          }
        } else if (viewCenter < c4) {
          // MEMORY / INTELLIGENCE: Holds Stage 3 (Collision Singularity) then transitions to Handshake
          const rawT = (viewCenter - c3) / (c4 - c3);
          if (rawT < 0.45) {
            // Holds Stage 3 steady in Center
            targetCenterX = width * 0.50;
            targetCenterY = height * 0.50;
            stageRotationY = Math.PI + tick * 0.25;
            w1 = 0; w2 = 0; w3 = 1; w4 = 0; w5 = 0;
          } else {
            // Transitions to Stage 4 (3D Handshake in Center)
            const t = (rawT - 0.45) / 0.55;
            const st = t * t * (3 - 2 * t);
            targetCenterX = width * 0.50;
            targetCenterY = height * 0.50;
            targetScaleFactor = 1.68 + st * 0.06;
            stageRotationY = Math.PI + st * 0.2;
            w1 = 0; w2 = 0; w3 = 1 - st; w4 = st; w5 = 0;
          }
        } else if (viewCenter < c5) {
          // ENTERPRISE: Holds Stage 4 (3D Handshake) then transitions to Mind
          const rawT = (viewCenter - c4) / (c5 - c4);
          if (rawT < 0.45) {
            // Holds Stage 4 steady (Hands clasped in Center, Isometric Perspective)
            targetCenterX = width * 0.50;
            targetCenterY = height * 0.50;
            targetScaleFactor = 1.74;
            stageRotationY = 0.42 + Math.sin(tick * 0.4) * 0.03;
            w1 = 0; w2 = 0; w3 = 0; w4 = 1; w5 = 0;
          } else {
            // Transitions to Stage 5 (3D Volumetric Neural Mind)
            const t = (rawT - 0.45) / 0.55;
            const st = t * t * (3 - 2 * t);
            targetCenterX = width * 0.50;
            targetCenterY = height * 0.48;
            targetScaleFactor = 1.74 - st * 0.04;
            stageRotationY = (1 - st) * 0.42 + st * (tick * 0.18);
            w1 = 0; w2 = 0; w3 = 0; w4 = 1 - st; w5 = st;
          }
        } else {
          // STAGE 5: Cathedral CTA (3D Volumetric Neural Mind Floating Above CTA)
          targetCenterX = width * 0.50;
          targetCenterY = height * 0.48;
          targetScaleFactor = 1.70;
          stageRotationY = tick * 0.18;
          w1 = 0; w2 = 0; w3 = 0; w4 = 0; w5 = 1;
        }
      }

      // Atmospheric radial aura
      const auraGradient = ctx.createRadialGradient(
        targetCenterX,
        targetCenterY,
        10,
        targetCenterX,
        targetCenterY,
        280 * (isMobile ? 0.8 : 1.3)
      );
      auraGradient.addColorStop(0, 'rgba(128, 82, 255, 0.12)');
      auraGradient.addColorStop(0.5, 'rgba(34, 211, 238, 0.04)');
      auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = auraGradient;
      ctx.fillRect(0, 0, width, height);

      // Breathing oscillation & 3D Isometric View
      const breathScale = 1.0 + Math.sin(tick * 1.8) * 0.015;
      const stageRotationX = w4 * 0.26 + w5 * 0.14;
      const totalAngleX = angleX + stageRotationX + 0.03 * Math.sin(tick);
      const totalAngleY = angleY + stageRotationY;

      const cosX = Math.cos(totalAngleX);
      const sinX = Math.sin(totalAngleX);
      const cosY = Math.cos(totalAngleY);
      const sinY = Math.sin(totalAngleY);

      const fov = 620;

      // 1. Calculate 3D transformation for all nodes
      const projected = nodes.map(n => {
        n.rotAngle += n.rotSpeed;

        let s3DynX = n.s3X;
        let s3DynY = n.s3Y;
        let s3DynZ = n.s3Z;
        if (w3 > 0.01) {
          const pulse = Math.sin(tick * 5 + n.s3Phase);
          s3DynX += Math.cos(tick * 3 + n.s3Phase) * 6;
          s3DynY += Math.sin(tick * 3 + n.s3Phase) * 6;
          s3DynZ += pulse * 8;
        }

        let s4DynY = n.s4Y;
        if (w4 > 0.01) {
          s4DynY += Math.sin(tick * 3.2) * 5; // Natural rhythmic handshake pumping
        }

        const fx = w1 * n.s1X + w2 * n.s2X + w3 * s3DynX + w4 * n.s4X + w5 * n.s5X;
        const fy = w1 * n.s1Y + w2 * n.s2Y + w3 * s3DynY + w4 * s4DynY + w5 * n.s5Y;
        const fz = w1 * n.s1Z + w2 * n.s2Z + w3 * s3DynZ + w4 * n.s4Z + w5 * n.s5Z;

        const px = fx * targetScaleFactor * breathScale;
        const py = fy * targetScaleFactor * breathScale;
        const pz = fz * targetScaleFactor * breathScale;

        // 3D Matrix Rotation
        const x1 = px * cosY - pz * sinY;
        const z1 = pz * cosY + px * sinY;
        const y1 = py * cosX - z1 * sinX;
        const z2 = z1 * cosX + py * sinX;

        const scale = fov / (fov + z2 + 320);
        const projX = targetCenterX + x1 * scale;
        const projY = targetCenterY + y1 * scale;

        let activeColor = n.color;
        if (w5 > 0.5) activeColor = n.s5Color;
        else if (w4 > 0.5) activeColor = n.s4Color;
        else if (w3 > 0.5) activeColor = n.s3Color;

        let nodeSize = n.size;
        if (n.isBrainCore) {
          nodeSize = (1.6 + Math.sin(tick * 4 + n.rotAngle) * 0.9) * (isMobile ? 0.9 : 1.1);
        } else if (n.isCircuitNode && w5 > 0.3) {
          nodeSize = 3.4 * (isMobile ? 0.9 : 1.1);
        }

        return {
          projX,
          projY,
          scale,
          z: z2,
          color: activeColor,
          size: nodeSize * scale * (isMobile ? 0.9 : 1.15),
          rot: n.rotAngle,
          isSpark: n.isSpark,
          isBrainCore: n.isBrainCore,
          isCircuitNode: n.isCircuitNode,
          originalY: n.s1Y,
        };
      });

      // Stage 1 Laser Beam from pointing left index fingertip
      if (w1 > 0.4 && indexTipL < projected.length) {
        const pFinger = projected[indexTipL];
        const grad = ctx.createLinearGradient(pFinger.projX, pFinger.projY, 0, pFinger.projY);
        grad.addColorStop(0, `rgba(34, 211, 238, ${0.75 * w1})`);
        grad.addColorStop(1, 'rgba(128, 82, 255, 0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(pFinger.projX, pFinger.projY);
        ctx.lineTo(0, pFinger.projY);
        ctx.stroke();
      }

      // Stage 2 Laser Beam from pointing right fingers
      if (w2 > 0.4 && fingersR < projected.length) {
        const pFingerR = projected[fingersR];
        const grad = ctx.createLinearGradient(pFingerR.projX, pFingerR.projY, width, pFingerR.projY);
        grad.addColorStop(0, `rgba(255, 184, 41, ${0.75 * w2})`);
        grad.addColorStop(1, 'rgba(128, 82, 255, 0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(pFingerR.projX, pFingerR.projY);
        ctx.lineTo(width, pFingerR.projY);
        ctx.stroke();
      }

      // Periodic Holographic Laser Scanline
      const scanlineProgress = (tick * 0.45) % 1;
      const scanlineY = -180 + scanlineProgress * 360;

      // 1. Draw Wireframe Mesh with Depth Attenuation
      if (w1 + w2 > 0.25) {
        const humanWeight = w1 + w2;
        for (const edge of edges) {
          const p1 = projected[edge.i1];
          const p2 = projected[edge.i2];
          if (!p1 || !p2) continue;

          const avgZ = (p1.z + p2.z) * 0.5;
          const depthFactor = Math.max(0.12, Math.min(1.0, (avgZ + 120) / 240));
          const baseAlpha = edge.isRing ? 0.48 : 0.28;
          const finalAlpha = baseAlpha * depthFactor * Math.min(p1.scale, p2.scale) * humanWeight;

          const nearScanline = Math.abs(p1.originalY - scanlineY) < 18;
          const scanlineAlpha = nearScanline ? finalAlpha * 2.2 : finalAlpha;

          ctx.strokeStyle = edge.color || `rgba(128, 82, 255, ${scanlineAlpha})`;
          ctx.lineWidth = nearScanline ? 1.4 : (edge.isRing ? 0.9 : 0.6);
          ctx.beginPath();
          ctx.moveTo(p1.projX, p1.projY);
          ctx.lineTo(p2.projX, p2.projY);
          ctx.stroke();
        }
      } else if (w3 > 0.25) {
        // Stage 3 3D Neural Constellation Synaptic Wireframe (from index.html)
        ctx.lineWidth = 0.7;
        for (let i = 0; i < projected.length; i += 3) {
          const p1 = projected[i];
          for (let j = i + 1; j < Math.min(i + 5, projected.length); j++) {
            const p2 = projected[j];
            const dist = Math.hypot(p1.projX - p2.projX, p1.projY - p2.projY);
            if (dist < 46) {
              const alpha = (1 - dist / 46) * 0.42 * w3;
              ctx.strokeStyle = `rgba(128, 82, 255, ${alpha})`;
              ctx.beginPath();
              ctx.moveTo(p1.projX, p1.projY);
              ctx.lineTo(p2.projX, p2.projY);
              ctx.stroke();
            }
          }
        }
      } else if (w4 > 0.25) {
        // Stage 4 Dedicated 3D Volumetric Handshake Point-Cloud Filament Mesh
        ctx.lineWidth = 0.85;
        const half = Math.floor(projected.length / 2);

        // 1. Left Hand Volumetric Point-Cloud Filaments (Cyan)
        for (let i = 0; i < half; i += 2) {
          const p1 = projected[i];
          for (let j = i + 1; j < Math.min(i + 8, half); j++) {
            const p2 = projected[j];
            const dist = Math.hypot(p1.projX - p2.projX, p1.projY - p2.projY);
            if (dist < 26) {
              const alpha = (1 - dist / 26) * 0.55 * w4;
              ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
              ctx.beginPath();
              ctx.moveTo(p1.projX, p1.projY);
              ctx.lineTo(p2.projX, p2.projY);
              ctx.stroke();
            }
          }
        }

        // 2. Right Hand Volumetric Point-Cloud Filaments (Gold)
        for (let i = half; i < projected.length; i += 2) {
          const p1 = projected[i];
          for (let j = i + 1; j < Math.min(i + 8, projected.length); j++) {
            const p2 = projected[j];
            const dist = Math.hypot(p1.projX - p2.projX, p1.projY - p2.projY);
            if (dist < 26) {
              const alpha = (1 - dist / 26) * 0.55 * w4;
              ctx.strokeStyle = `rgba(255, 184, 41, ${alpha})`;
              ctx.beginPath();
              ctx.moveTo(p1.projX, p1.projY);
              ctx.lineTo(p2.projX, p2.projY);
              ctx.stroke();
            }
          }
        }

        // 3. Interlocking Clasp Synaptic Arcs (Where Left & Right hands grip)
        for (let i = 110; i < half; i += 5) {
          const pL = projected[i];
          for (let j = half + 110; j < projected.length; j += 7) {
            const pR = projected[j];
            const dist = Math.hypot(pL.projX - pR.projX, pL.projY - pR.projY);
            if (dist < 38) {
              const alpha = (1 - dist / 38) * 0.65 * w4;
              ctx.strokeStyle = i % 2 === 0 ? `rgba(128, 82, 255, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;
              ctx.beginPath();
              ctx.moveTo(pL.projX, pL.projY);
              ctx.lineTo(pR.projX, pR.projY);
              ctx.stroke();
            }
          }
        }
      } else if (w5 > 0.25) {
        // Stage 5 Dedicated 3D Neural Mind & Synaptic Filament Network
        ctx.lineWidth = 0.9;
        const total = projected.length;

        // 1. Cortical Gyri Synaptic Mesh
        for (let i = 0; i < Math.floor(total * 0.80); i += 2) {
          const p1 = projected[i];
          const isLeft = i % 2 === 0;
          for (let j = i + 2; j < Math.min(i + 8, Math.floor(total * 0.80)); j += 2) {
            const p2 = projected[j];
            const dist = Math.hypot(p1.projX - p2.projX, p1.projY - p2.projY);
            if (dist < 42) {
              const alpha = (1 - dist / 42) * 0.45 * w5;
              ctx.strokeStyle = isLeft ? `rgba(34, 211, 238, ${alpha})` : `rgba(128, 82, 255, ${alpha})`;
              ctx.beginPath();
              ctx.moveTo(p1.projX, p1.projY);
              ctx.lineTo(p2.projX, p2.projY);
              ctx.stroke();
            }
          }
        }

        // 2. Corpus Callosum Inter-Hemispheric Firing Synapses
        for (let i = 0; i < 30; i++) {
          const pL = projected[(i * 6) % Math.floor(total * 0.40) * 2];
          const pR = projected[((i * 6) % Math.floor(total * 0.40) * 2) + 1];
          if (pL && pR) {
            const dist = Math.hypot(pL.projX - pR.projX, pL.projY - pR.projY);
            if (dist < 85) {
              const alpha = (1 - dist / 85) * 0.65 * w5;
              ctx.strokeStyle = `rgba(255, 184, 41, ${alpha})`;
              ctx.lineWidth = 1.1;
              ctx.beginPath();
              ctx.moveTo(pL.projX, pL.projY);
              ctx.lineTo(pR.projX, pR.projY);
              ctx.stroke();
            }
          }
        }

        // 3. Central Synaptic Core & Brainstem Axons
        for (let i = Math.floor(total * 0.80); i < total - 1; i++) {
          const p1 = projected[i];
          const p2 = projected[i + 1];
          if (p1 && p2) {
            const dist = Math.hypot(p1.projX - p2.projX, p1.projY - p2.projY);
            if (dist < 48) {
              ctx.strokeStyle = `rgba(34, 211, 238, ${0.60 * w5})`;
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.moveTo(p1.projX, p1.projY);
              ctx.lineTo(p2.projX, p2.projY);
              ctx.stroke();
            }
          }
        }
      }

      // 2. Draw 3D Nodes sorted by Z-index
      const sortedIndices = projected.map((_, i) => i).sort((a, b) => projected[a].z - projected[b].z);

      for (const idx of sortedIndices) {
        const p = projected[idx];
        const depthFactor = Math.max(0.2, Math.min(1.0, (p.z + 140) / 280));
        const nearScanline = Math.abs(p.originalY - scanlineY) < 16;

        ctx.save();
        ctx.translate(p.projX, p.projY);

        if (p.isCircuitNode && w5 > 0.3) {
          // Glowing PCB Circuit Terminal Pad Ring (Stage 5 Logo)
          ctx.strokeStyle = '#ffb829';
          ctx.lineWidth = 1.8;
          ctx.globalAlpha = Math.min(1, 0.9 * depthFactor * w5);
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 1.5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.isBrainCore && w1 + w2 > 0.3) {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.min(1, 0.85 * depthFactor);
          ctx.beginPath();
          ctx.arc(0, 0, p.size * (nearScanline ? 1.4 : 1.0), 0, Math.PI * 2);
          ctx.fill();
        } else if (p.isSpark || nearScanline || (w3 > 0.4 && Math.random() < 0.15)) {
          ctx.rotate(p.rot);
          ctx.fillStyle = nearScanline ? '#ffffff' : p.color;
          ctx.globalAlpha = Math.min(1, (nearScanline ? 1.0 : 0.85) * depthFactor);
          const s = p.size * (nearScanline ? 1.5 : 1.0);
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(s * 0.8, 0);
          ctx.lineTo(0, s);
          ctx.lineTo(-s * 0.8, 0);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0.1, 0.65 * depthFactor);
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 select-none"
      aria-hidden="true"
    />
  );
};











