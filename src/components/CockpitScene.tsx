import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CockpitDisplays } from '../cockpit/displays';
import { CockpitModel } from '../cockpit/CockpitModel';
import { CockpitSimulation } from '../cockpit/simulation';
import { CameraPreset, InteractiveObjectInfo, LightingMode } from '../types/cockpit';
import { CockpitTextureFactory } from '../cockpit/proceduralTextures';

// Pre-allocated scratch objects for zero GC per frame
const _targetCamPos = new THREE.Vector3();
const _targetCamLook = new THREE.Vector3();
const _currentLook = new THREE.Vector3();
const _pointer = new THREE.Vector2();
const _raycaster = new THREE.Raycaster();

interface CockpitSceneProps {
  sim: CockpitSimulation;
  onHoverObject: (info: InteractiveObjectInfo | null) => void;
  onSelectObject: (info: InteractiveObjectInfo) => void;
}

export const CockpitScene: React.FC<CockpitSceneProps> = ({
  sim,
  onHoverObject,
  onSelectObject,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Store references for event handlers and loop
  const simRef = useRef(sim);
  simRef.current = sim;
  const onHoverRef = useRef(onHoverObject);
  onHoverRef.current = onHoverObject;
  const onSelectRef = useRef(onSelectObject);
  onSelectRef.current = onSelectObject;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL per Three.js skill
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x73a8d8);
    const fog = new THREE.FogExp2(0x73a8d8, 0.00035);
    scene.fog = fog;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      56,
      container.clientWidth / container.clientHeight,
      0.05,
      12000
    );
    // Initial position: Captain seat
    camera.position.set(-0.50, 0.46, 0.16);
    _currentLook.set(-0.50, 0.18, -1.15);
    camera.lookAt(_currentLook);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    CockpitTextureFactory.setMaxAnisotropy(renderer.capabilities.getMaxAnisotropy());

    container.appendChild(renderer.domElement);

    // Mandatory Studio Environment Reflection (RoomEnvironment) per Three.js skill
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio & Exterior Lighting Rig
    // Warm Sun Directional Light
    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.8);
    sunLight.position.set(12, 22, -18);
    sunLight.castShadow = !isSoftwareGl;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 40;
    sunLight.shadow.camera.left = -3;
    sunLight.shadow.camera.right = 3;
    sunLight.shadow.camera.top = 3;
    sunLight.shadow.camera.bottom = -3;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight);

    // Cool Sky & Cockpit Fill HemisphereLight
    const hemiLight = new THREE.HemisphereLight(0xbfdbfe, 0x1e293b, 1.2);
    scene.add(hemiLight);

    // Lightning Flash Light for Storm mode
    const lightningLight = new THREE.PointLight(0xdbeafe, 0, 100);
    lightningLight.position.set(0, 15, -25);
    scene.add(lightningLight);

    // Outside World: Ground, Runway & Moving Clouds
    const outsideGroup = new THREE.Group();
    outsideGroup.name = 'OutsideWorld';

    // Distant Ground Terrain
    const groundGeo = new THREE.PlaneGeometry(8000, 8000, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x33442a,
      roughness: 0.95,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -620; // altitude offset
    outsideGroup.add(ground);

    // Realistic Airport Runway with markings
    const runwayGeo = new THREE.PlaneGeometry(65, 3600);
    const runwayMat = new THREE.MeshStandardMaterial({
      color: 0x1a1e24,
      roughness: 0.85,
      metalness: 0.1,
    });
    const runway = new THREE.Mesh(runwayGeo, runwayMat);
    runway.rotation.x = -Math.PI / 2;
    runway.position.set(0, -619.5, -1200);
    outsideGroup.add(runway);

    // Runway Centerline stripes
    const stripeGeo = new THREE.PlaneGeometry(2.5, 40);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const centerlineGroup = new THREE.Group();
    for (let z = -2800; z < 500; z += 65) {
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(0, -619.3, z);
      centerlineGroup.add(stripe);
    }
    outsideGroup.add(centerlineGroup);

    // Moving Cumulus Clouds layer
    const cloudGeo = new THREE.SphereGeometry(140, 12, 10);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 1.0,
      metalness: 0.0,
      transparent: true,
      opacity: 0.65,
    });
    const cloudsGroup = new THREE.Group();
    for (let i = 0; i < 28; i++) {
      const cloud = new THREE.Mesh(cloudGeo, cloudMat);
      cloud.position.set(
        (Math.random() - 0.5) * 6000,
        Math.random() * 400 - 300,
        -1000 - Math.random() * 5000
      );
      cloud.scale.set(1 + Math.random() * 2, 0.4 + Math.random() * 0.4, 1 + Math.random() * 2);
      cloudsGroup.add(cloud);
    }
    outsideGroup.add(cloudsGroup);

    // Distant Star Field for Night mode
    const starGeo = new THREE.BufferGeometry();
    const starPos = [];
    for (let i = 0; i < 1200; i++) {
      starPos.push(
        (Math.random() - 0.5) * 8000,
        Math.random() * 4000 + 500,
        (Math.random() - 0.5) * 8000
      );
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 4,
      transparent: true,
      opacity: 0.8,
    });
    const starField = new THREE.Points(starGeo, starMat);
    outsideGroup.add(starField);

    scene.add(outsideGroup);

    // Initialize Displays and Cockpit 3D Model
    const displays = new CockpitDisplays();
    const cockpit = new CockpitModel(displays);
    scene.add(cockpit.root);

    // Camera preset positions and lookAt targets
    const getCameraTargets = (preset: CameraPreset) => {
      switch (preset) {
        case 'captain':
          _targetCamPos.set(-0.50, 0.46, 0.16);
          _targetCamLook.set(-0.50, 0.18, -1.15);
          break;
        case 'fo':
          _targetCamPos.set(0.50, 0.46, 0.16);
          _targetCamLook.set(0.50, 0.18, -1.15);
          break;
        case 'mcp':
          _targetCamPos.set(0, 0.45, -0.28);
          _targetCamLook.set(0, 0.38, -0.72);
          break;
        case 'pedestal':
          _targetCamPos.set(0, 0.22, 0.12);
          _targetCamLook.set(0, -0.15, -0.32);
          break;
        case 'overhead':
          _targetCamPos.set(0, 0.35, -0.10);
          _targetCamLook.set(0, 1.05, -0.42);
          break;
        case 'fmc':
          _targetCamPos.set(-0.14, 0.18, -0.12);
          _targetCamLook.set(-0.25, 0.05, -0.42);
          break;
        case 'outside':
          _targetCamPos.set(0, 0.85, -2.4);
          _targetCamLook.set(0, 0.85, -8.0);
          break;
        case 'free':
        default:
          _targetCamPos.set(-0.15, 0.52, 0.50);
          _targetCamLook.set(-0.10, 0.15, -0.85);
          break;
      }
    };

    // Apply lighting mode to sky, fog, and sun
    const updateEnvironmentLighting = (mode: LightingMode, lightning: boolean) => {
      if (lightning) {
        lightningLight.intensity = 18.0;
        scene.background = new THREE.Color(0xa5b4fc);
        fog.color.setHex(0xa5b4fc);
        return;
      } else {
        lightningLight.intensity = 0;
      }

      switch (mode) {
        case 'day':
          scene.background = new THREE.Color(0x73a8d8);
          fog.color.setHex(0x73a8d8);
          fog.density = 0.00035;
          sunLight.color.setHex(0xfffaed);
          sunLight.intensity = 2.8;
          sunLight.position.set(12, 22, -18);
          hemiLight.color.setHex(0xbfdbfe);
          hemiLight.groundColor.setHex(0x1e293b);
          hemiLight.intensity = 1.2;
          starField.visible = false;
          break;

        case 'sunset':
          scene.background = new THREE.Color(0xd97757);
          fog.color.setHex(0xd97757);
          fog.density = 0.00045;
          sunLight.color.setHex(0xf97316);
          sunLight.intensity = 3.4;
          sunLight.position.set(18, 5, -25);
          hemiLight.color.setHex(0xfb923c);
          hemiLight.groundColor.setHex(0x311b11);
          hemiLight.intensity = 1.0;
          starField.visible = false;
          break;

        case 'night':
          scene.background = new THREE.Color(0x060911);
          fog.color.setHex(0x060911);
          fog.density = 0.0003;
          sunLight.color.setHex(0x1e293b);
          sunLight.intensity = 0.15;
          hemiLight.color.setHex(0x0f172a);
          hemiLight.groundColor.setHex(0x020617);
          hemiLight.intensity = 0.12;
          starField.visible = true;
          break;

        case 'storm':
          scene.background = new THREE.Color(0x272e38);
          fog.color.setHex(0x272e38);
          fog.density = 0.0007;
          sunLight.color.setHex(0x64748b);
          sunLight.intensity = 0.7;
          hemiLight.color.setHex(0x475569);
          hemiLight.groundColor.setHex(0x0f172a);
          hemiLight.intensity = 0.45;
          starField.visible = false;
          break;
      }
    };

    // User Mouse Look / Orbit / Interaction
    let isMouseDown = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let cameraYaw = 0;
    let cameraPitch = 0;
    let hoveredObjectInfo: InteractiveObjectInfo | null = null;

    const onPointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      _pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Handle camera dragging
      if (isMouseDown) {
        const dx = e.clientX - prevMouseX;
        const dy = e.clientY - prevMouseY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;

        cameraYaw -= dx * 0.003;
        cameraPitch = Math.max(-1.1, Math.min(1.1, cameraPitch - dy * 0.003));
      }

      // Raycasting for interactive switches & controls
      _raycaster.setFromCamera(_pointer, camera);
      const intersects = _raycaster.intersectObjects(cockpit.root.children, true);

      let foundInfo: InteractiveObjectInfo | null = null;
      for (const hit of intersects) {
        const info = cockpit.interactiveMeshes.get(hit.object);
        if (info) {
          foundInfo = info;
          break;
        }
      }

      if (foundInfo !== hoveredObjectInfo) {
        hoveredObjectInfo = foundInfo;
        onHoverRef.current(foundInfo);
        renderer.domElement.style.cursor = foundInfo ? 'pointer' : 'default';
      }
    };

    const onPointerDown = (e: MouseEvent) => {
      // Right click or middle click or drag on blank space: look around
      if (e.button === 2 || e.button === 1 || !hoveredObjectInfo) {
        isMouseDown = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }

      // Left click on an interactive switch/control
      if (e.button === 0 && hoveredObjectInfo) {
        simRef.current.handleInteraction(hoveredObjectInfo.id);
        onSelectRef.current(hoveredObjectInfo);
      }
    };

    const onPointerUp = () => {
      isMouseDown = false;
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // disable context menu for smooth right-click camera look
    };

    // Keyboard Shortcuts for flight controls & camera
    const onKeyDown = (e: KeyboardEvent) => {
      const s = simRef.current.state;

      switch (e.key.toLowerCase()) {
        case 'w':
          s.yokePitch = Math.min(1.0, s.yokePitch + 0.25);
          break;
        case 's':
          s.yokePitch = Math.max(-1.0, s.yokePitch - 0.25);
          break;
        case 'a':
          s.yokeRoll = Math.max(-1.0, s.yokeRoll - 0.25);
          break;
        case 'd':
          s.yokeRoll = Math.min(1.0, s.yokeRoll + 0.25);
          break;
        case 'q':
          s.rudderPedal = Math.max(-1.0, s.rudderPedal - 0.3);
          break;
        case 'e':
          s.rudderPedal = Math.min(1.0, s.rudderPedal + 0.3);
          break;
        case 'f1':
          e.preventDefault();
          s.throttle1 = Math.max(0, s.throttle1 - 0.1);
          s.throttle2 = s.throttle1;
          break;
        case 'f2':
          e.preventDefault();
          s.throttle1 = Math.min(1, s.throttle1 + 0.1);
          s.throttle2 = s.throttle1;
          break;
        case 'g':
          simRef.current.handleInteraction('gear_lever');
          break;
        case '[':
          s.flapLeverPosition = Math.max(0, s.flapLeverPosition - 1);
          break;
        case ']':
          s.flapLeverPosition = Math.min(8, s.flapLeverPosition + 1);
          break;
        case 'b':
          simRef.current.handleInteraction('parking_brake');
          break;
        case ' ':
          simRef.current.handleInteraction('master_caution');
          break;
        case '1':
          s.cameraPreset = 'captain';
          cameraYaw = 0;
          cameraPitch = 0;
          break;
        case '2':
          s.cameraPreset = 'fo';
          cameraYaw = 0;
          cameraPitch = 0;
          break;
        case '3':
          s.cameraPreset = 'mcp';
          cameraYaw = 0;
          cameraPitch = 0;
          break;
        case '4':
          s.cameraPreset = 'pedestal';
          cameraYaw = 0;
          cameraPitch = 0;
          break;
        case '5':
          s.cameraPreset = 'overhead';
          cameraYaw = 0;
          cameraPitch = 0;
          break;
        case '6':
          s.cameraPreset = 'fmc';
          cameraYaw = 0;
          cameraPitch = 0;
          break;
        case '7':
          s.cameraPreset = 'free';
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const s = simRef.current.state;
      if (['w', 's'].includes(e.key.toLowerCase())) {
        s.yokePitch = 0;
      }
      if (['a', 'd'].includes(e.key.toLowerCase())) {
        s.yokeRoll = 0;
      }
      if (['q', 'e'].includes(e.key.toLowerCase())) {
        s.rudderPedal = 0;
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointermove', onPointerMove);
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Resize handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Continuous 60fps Loop with software WebGL guard per Three.js skill
    let frameId = 0;
    let lastTime = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const now = performance.now();
      const dt = Math.min(0.08, (now - lastTime) / 1000);
      lastTime = now;

      const s = simRef.current.state;

      // 1. Advance aircraft flight dynamics & systems
      simRef.current.update(dt);

      // 2. Update dynamic canvas displays (PFD, ND, EICAS, FMC)
      displays.update(s, dt);

      // 3. Update 3D cockpit model animated components
      cockpit.update(s, dt);

      // 4. Update outside world movement (runway, altitude, clouds)
      ground.position.y = -s.altitude;
      runway.position.y = -s.altitude + 0.5;
      centerlineGroup.position.y = -s.altitude + 0.7;

      // Move runway backwards when moving forward
      const forwardDist = s.groundSpeed * 0.5144 * dt * 0.1;
      runway.position.z = ((runway.position.z + forwardDist + 2400) % 3600) - 2400;
      centerlineGroup.position.z = runway.position.z;

      // Rotate clouds
      cloudsGroup.children.forEach((c) => {
        c.position.z += forwardDist * 0.3;
        if (c.position.z > 200) c.position.z = -5000;
      });

      // 5. Update environment lighting & storm effects
      updateEnvironmentLighting(s.lightingMode, s.lightningActive);

      // 6. Camera smooth interpolation with exponential damping
      getCameraTargets(s.cameraPreset);

      camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetCamPos.x, 8, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetCamPos.y, 8, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetCamPos.z, 8, dt);

      // Apply look target + user free look yaw/pitch
      const finalLookX = _targetCamLook.x + Math.sin(cameraYaw);
      const finalLookY = _targetCamLook.y + cameraPitch;
      const finalLookZ = _targetCamLook.z - Math.cos(cameraYaw) + 1;

      _currentLook.x = THREE.MathUtils.damp(_currentLook.x, finalLookX, 10, dt);
      _currentLook.y = THREE.MathUtils.damp(_currentLook.y, finalLookY, 10, dt);
      _currentLook.z = THREE.MathUtils.damp(_currentLook.z, finalLookZ, 10, dt);

      camera.lookAt(_currentLook);

      // 7. Render frame
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    // Pre-warm shaders
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Start loop
    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    // Cleanup on unmount
    return () => {
      if (isSoftwareGl) {
        clearTimeout(frameId);
      } else {
        cancelAnimationFrame(frameId);
      }
      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full select-none overflow-hidden" />;
};
