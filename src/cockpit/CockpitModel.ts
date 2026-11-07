import * as THREE from 'three';
import { AircraftSystemsState, InteractiveObjectInfo } from '../types/cockpit';
import { CockpitTextureFactory } from './proceduralTextures';
import { CockpitDisplays } from './displays';

export interface CockpitAnimatableParts {
  // Yokes
  captainYokeColumn: THREE.Group;
  captainYokeWheel: THREE.Group;
  foYokeColumn: THREE.Group;
  foYokeWheel: THREE.Group;
  rudderPedalL1: THREE.Mesh;
  rudderPedalL2: THREE.Mesh;
  rudderPedalR1: THREE.Mesh;
  rudderPedalR2: THREE.Mesh;

  // Pedestal levers
  throttle1Lever: THREE.Group;
  throttle2Lever: THREE.Group;
  reverse1Lever: THREE.Group;
  reverse2Lever: THREE.Group;
  flapLever: THREE.Group;
  speedbrakeLever: THREE.Group;
  cutoff1Lever: THREE.Group;
  cutoff2Lever: THREE.Group;
  parkingBrakeLever: THREE.Group;
  trimWheelL: THREE.Mesh;
  trimWheelR: THREE.Mesh;

  // MIP & MCP
  gearLever: THREE.Group;
  gearLights: {
    noseGreen: THREE.Mesh;
    leftGreen: THREE.Mesh;
    rightGreen: THREE.Mesh;
    noseRed: THREE.Mesh;
    leftRed: THREE.Mesh;
    rightRed: THREE.Mesh;
  };
  flapGaugeNeedle: THREE.Mesh;
  masterCautionCapt: THREE.Mesh;
  masterWarningCapt: THREE.Mesh;
  atArmSwitch: THREE.Group;
  fdSwitchCapt: THREE.Group;
  fdSwitchFo: THREE.Group;
  mcpButtons: Map<string, THREE.Mesh>;

  // Knobs
  hdgKnob: THREE.Mesh;
  altKnob: THREE.Mesh;
  spdKnob: THREE.Mesh;
  autobrakeKnob: THREE.Mesh;

  // Overhead
  batteryGuard: THREE.Group;
  batterySwitch: THREE.Group;
  apuSwitch: THREE.Group;
  engStart1Knob: THREE.Mesh;
  engStart2Knob: THREE.Mesh;
  overheadToggles: Map<string, THREE.Group>;

  // Wipers
  wiperCapt: THREE.Group;
  wiperFo: THREE.Group;

  // Integral backlights
  integralLights: THREE.Mesh[];
  floodLight: THREE.PointLight;
  domeLight: THREE.PointLight;
}

export class CockpitModel {
  public root: THREE.Group;
  public interactiveMeshes: Map<THREE.Object3D, InteractiveObjectInfo> = new Map();
  public animatables!: CockpitAnimatableParts;
  public displays: CockpitDisplays;

  // Materials cache
  private panelMat!: THREE.MeshStandardMaterial;
  private metalDarkMat!: THREE.MeshStandardMaterial;
  private metalBrushedMat!: THREE.MeshStandardMaterial;
  private seatSheepskinMat!: THREE.MeshStandardMaterial;
  private seatFrameMat!: THREE.MeshStandardMaterial;
  private glassMat!: THREE.MeshPhysicalMaterial;
  private displayScreenMatPFD!: THREE.MeshBasicMaterial;
  private displayScreenMatND!: THREE.MeshBasicMaterial;
  private displayScreenMatEICAS1!: THREE.MeshBasicMaterial;
  private displayScreenMatEICAS2!: THREE.MeshBasicMaterial;
  private displayScreenMatFMC!: THREE.MeshBasicMaterial;
  private emissiveAmberMat!: THREE.MeshStandardMaterial;
  private emissiveGreenMat!: THREE.MeshStandardMaterial;
  private emissiveRedMat!: THREE.MeshStandardMaterial;

  constructor(displays: CockpitDisplays) {
    this.displays = displays;
    this.root = new THREE.Group();
    this.root.name = 'Boeing737Cockpit';

    this.initMaterials();
    this.buildCockpit();
  }

  private initMaterials() {
    const panelTex = CockpitTextureFactory.createPanelTexture();
    const sheepTex = CockpitTextureFactory.createSheepskinTexture();
    const floorTex = CockpitTextureFactory.createFloorTexture();

    // Boeing cockpit grey panel finish
    this.panelMat = new THREE.MeshStandardMaterial({
      color: 0x3d444d,
      roughness: 0.75,
      metalness: 0.15,
      map: panelTex,
    });

    // Dark structural metal
    this.metalDarkMat = new THREE.MeshStandardMaterial({
      color: 0x1f242b,
      roughness: 0.6,
      metalness: 0.4,
    });

    // Brushed aircraft aluminum
    this.metalBrushedMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      roughness: 0.35,
      metalness: 0.85,
    });

    // Seat sheepskin cushion
    this.seatSheepskinMat = new THREE.MeshStandardMaterial({
      color: 0x757b85,
      roughness: 0.95,
      metalness: 0.05,
      map: sheepTex,
    });

    // Seat dark frame & harness
    this.seatFrameMat = new THREE.MeshStandardMaterial({
      color: 0x22262c,
      roughness: 0.7,
      metalness: 0.3,
    });

    // High quality cockpit windshield glass
    this.glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      roughness: 0.08,
      metalness: 0.1,
      transmission: 0.9,
      transparent: true,
      opacity: 0.35,
      ior: 1.52,
    });

    // Screens
    this.displayScreenMatPFD = new THREE.MeshBasicMaterial({
      map: this.displays.pfdTexture,
    });
    this.displayScreenMatND = new THREE.MeshBasicMaterial({
      map: this.displays.ndTexture,
    });
    this.displayScreenMatEICAS1 = new THREE.MeshBasicMaterial({
      map: this.displays.upperEicasTexture,
    });
    this.displayScreenMatEICAS2 = new THREE.MeshBasicMaterial({
      map: this.displays.lowerEicasTexture,
    });
    this.displayScreenMatFMC = new THREE.MeshBasicMaterial({
      map: this.displays.fmcTexture,
    });

    // Emissives for annunciators & backlighting
    this.emissiveAmberMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 1.5,
      roughness: 0.3,
    });
    this.emissiveGreenMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x16a34a,
      emissiveIntensity: 1.4,
      roughness: 0.3,
    });
    this.emissiveRedMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 1.6,
      roughness: 0.3,
    });
  }

  private registerInteractive(
    obj: THREE.Object3D,
    info: InteractiveObjectInfo
  ) {
    this.interactiveMeshes.set(obj, info);
    // Also traverse children so child meshes trigger the same action
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        this.interactiveMeshes.set(child, info);
      }
    });
  }

  private buildCockpit() {
    const animatables: Partial<CockpitAnimatableParts> = {
      overheadToggles: new Map(),
      mcpButtons: new Map(),
      integralLights: [],
    };

    // 1. Cockpit Hull, Windshield Frame, Glare Shield, Floor, and Roof
    this.buildHullAndFrames(animatables);

    // 2. Main Instrument Panel (MIP), Screens & Flap Gauge
    this.buildMainInstrumentPanel(animatables);

    // 3. Mode Control Panel (MCP / Autopilot)
    this.buildModeControlPanel(animatables);

    // 4. Center Pedestal, Throttle Quadrant & FMC
    this.buildThrottlePedestal(animatables);

    // 5. Overhead Panel & Electrical Systems
    this.buildOverheadPanel(animatables);

    // 6. Captain & First Officer Pilot Seats
    this.buildPilotSeats();

    // 7. Dual Control Yokes & Rudder Pedals
    this.buildYokesAndPedals(animatables);

    // 8. Cockpit Internal Lights (Dome Light, Glare Shield Flood, Amber Integral)
    this.buildCockpitLighting(animatables);

    this.animatables = animatables as CockpitAnimatableParts;
  }

  /**
   * 1. Shell, Windshield, Glare Shield, Wipers
   */
  private buildHullAndFrames(anim: Partial<CockpitAnimatableParts>) {
    const group = new THREE.Group();
    group.name = 'CockpitHull';

    // Cockpit Floor with ribbed anti-slip texture
    const floorGeo = new THREE.BoxGeometry(2.2, 0.08, 2.6);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x2a3038,
      roughness: 0.8,
      metalness: 0.3,
      map: CockpitTextureFactory.createFloorTexture(),
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, -0.72, -0.2);
    floor.receiveShadow = true;
    group.add(floor);

    // Left and Right Side Console Walls
    const wallGeo = new THREE.BoxGeometry(0.18, 1.2, 2.4);
    const leftWall = new THREE.Mesh(wallGeo, this.panelMat);
    leftWall.position.set(-1.05, -0.1, -0.2);
    group.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, this.panelMat);
    rightWall.position.set(1.05, -0.1, -0.2);
    group.add(rightWall);

    // Rear bulkhead & cockpit door frame
    const rearWallGeo = new THREE.BoxGeometry(2.2, 1.6, 0.1);
    const rearWall = new THREE.Mesh(rearWallGeo, this.panelMat);
    rearWall.position.set(0, 0.1, 1.05);
    group.add(rearWall);

    // Distinctive Boeing Glare Shield: sculpted dark matte overhang above instrument panel
    const glareGeo = new THREE.BoxGeometry(1.86, 0.03, 0.36);
    const glareMat = new THREE.MeshStandardMaterial({
      color: 0x181b1f,
      roughness: 0.9,
      metalness: 0.05,
    });
    const glareShield = new THREE.Mesh(glareGeo, glareMat);
    glareShield.position.set(0, 0.32, -0.86);
    glareShield.castShadow = true;
    group.add(glareShield);

    // Windshield Structural Posts (Center post, Left & Right side pillars)
    const centerPostGeo = new THREE.BoxGeometry(0.08, 0.8, 0.08);
    const centerPost = new THREE.Mesh(centerPostGeo, this.panelMat);
    centerPost.position.set(0, 0.78, -1.02);
    centerPost.rotation.x = 0.28;
    group.add(centerPost);

    // Left A-Pillar
    const leftPillar = new THREE.Mesh(centerPostGeo, this.panelMat);
    leftPillar.position.set(-0.85, 0.78, -0.92);
    leftPillar.rotation.set(0.28, 0.25, -0.15);
    group.add(leftPillar);

    // Right A-Pillar
    const rightPillar = new THREE.Mesh(centerPostGeo, this.panelMat);
    rightPillar.position.set(0.85, 0.78, -0.92);
    rightPillar.rotation.set(0.28, -0.25, 0.15);
    group.add(rightPillar);

    // Top Roof Frame
    const roofFrameGeo = new THREE.BoxGeometry(1.9, 0.08, 0.6);
    const roofFrame = new THREE.Mesh(roofFrameGeo, this.panelMat);
    roofFrame.position.set(0, 1.15, -0.65);
    group.add(roofFrame);

    // Front Windshield Glass Panels (Captain & First Officer)
    const frontGlassGeo = new THREE.PlaneGeometry(0.8, 0.65);
    const captGlass = new THREE.Mesh(frontGlassGeo, this.glassMat);
    captGlass.position.set(-0.44, 0.75, -1.02);
    captGlass.rotation.x = -0.28;
    captGlass.rotation.y = 0.08;
    group.add(captGlass);

    const foGlass = new THREE.Mesh(frontGlassGeo, this.glassMat);
    foGlass.position.set(0.44, 0.75, -1.02);
    foGlass.rotation.x = -0.28;
    foGlass.rotation.y = -0.08;
    group.add(foGlass);

    // Side Sliding Windows
    const sideGlassGeo = new THREE.PlaneGeometry(0.65, 0.55);
    const captSideGlass = new THREE.Mesh(sideGlassGeo, this.glassMat);
    captSideGlass.position.set(-0.95, 0.75, -0.6);
    captSideGlass.rotation.y = Math.PI / 2 - 0.2;
    group.add(captSideGlass);

    const foSideGlass = new THREE.Mesh(sideGlassGeo, this.glassMat);
    foSideGlass.position.set(0.95, 0.75, -0.6);
    foSideGlass.rotation.y = -Math.PI / 2 + 0.2;
    group.add(foSideGlass);

    // Articulated Windshield Wipers (Captain & FO)
    const wiperBladeGeo = new THREE.BoxGeometry(0.015, 0.45, 0.01);
    const wiperArmGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.35, 8);

    const wiperCaptGroup = new THREE.Group();
    wiperCaptGroup.position.set(-0.75, 0.48, -0.98);
    const wiperCaptArm = new THREE.Mesh(wiperArmGeo, this.metalDarkMat);
    wiperCaptArm.position.y = 0.18;
    wiperCaptGroup.add(wiperCaptArm);
    const wiperCaptBlade = new THREE.Mesh(wiperBladeGeo, this.metalDarkMat);
    wiperCaptBlade.position.set(0, 0.36, 0.01);
    wiperCaptGroup.add(wiperCaptBlade);
    wiperCaptGroup.rotation.x = -0.28;
    wiperCaptGroup.rotation.z = 0.35;
    group.add(wiperCaptGroup);
    anim.wiperCapt = wiperCaptGroup;

    const wiperFoGroup = new THREE.Group();
    wiperFoGroup.position.set(0.75, 0.48, -0.98);
    const wiperFoArm = new THREE.Mesh(wiperArmGeo, this.metalDarkMat);
    wiperFoArm.position.y = 0.18;
    wiperFoGroup.add(wiperFoArm);
    const wiperFoBlade = new THREE.Mesh(wiperBladeGeo, this.metalDarkMat);
    wiperFoBlade.position.set(0, 0.36, 0.01);
    wiperFoGroup.add(wiperFoBlade);
    wiperFoGroup.rotation.x = -0.28;
    wiperFoGroup.rotation.z = -0.35;
    group.add(wiperFoGroup);
    anim.wiperFo = wiperFoGroup;

    // Center post standby magnetic compass
    const compassGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.07, 16);
    const compass = new THREE.Mesh(compassGeo, this.metalDarkMat);
    compass.position.set(0, 0.85, -0.95);
    compass.rotation.x = Math.PI / 2;
    group.add(compass);

    this.root.add(group);
  }

  /**
   * 2. Main Instrument Panel (MIP): PFD, ND, EICAS, Gear Lever, Autobrake, Flap Gauge
   */
  private buildMainInstrumentPanel(anim: Partial<CockpitAnimatableParts>) {
    const mip = new THREE.Group();
    mip.name = 'MainInstrumentPanel';
    mip.position.set(0, 0.05, -0.95);

    // MIP back panel board
    const mipBoardGeo = new THREE.BoxGeometry(1.86, 0.68, 0.05);
    const mipBoard = new THREE.Mesh(mipBoardGeo, this.panelMat);
    mip.add(mipBoard);

    // Screen Dimensions & Bezels (standard 8x8 inch CRT/LCD style with beveled frames)
    const screenGeo = new THREE.PlaneGeometry(0.24, 0.24);
    const bezelGeo = new THREE.BoxGeometry(0.26, 0.26, 0.02);

    // --- CAPTAIN SIDE (Left) ---
    // 1. Captain PFD
    const captPfdBezel = new THREE.Mesh(bezelGeo, this.metalDarkMat);
    captPfdBezel.position.set(-0.68, 0.12, 0.03);
    const captPfdScreen = new THREE.Mesh(screenGeo, this.displayScreenMatPFD);
    captPfdScreen.position.set(-0.68, 0.12, 0.042);
    mip.add(captPfdBezel, captPfdScreen);

    // 2. Captain ND
    const captNdBezel = new THREE.Mesh(bezelGeo, this.metalDarkMat);
    captNdBezel.position.set(-0.41, 0.12, 0.03);
    const captNdScreen = new THREE.Mesh(screenGeo, this.displayScreenMatND);
    captNdScreen.position.set(-0.41, 0.12, 0.042);
    mip.add(captNdBezel, captNdScreen);

    // --- CENTER ENGINE & ALERT SECTION ---
    // 3. Upper EICAS (Engine Primary)
    const upperEicasBezel = new THREE.Mesh(bezelGeo, this.metalDarkMat);
    upperEicasBezel.position.set(0, 0.14, 0.03);
    const upperEicasScreen = new THREE.Mesh(screenGeo, this.displayScreenMatEICAS1);
    upperEicasScreen.position.set(0, 0.14, 0.042);
    mip.add(upperEicasBezel, upperEicasScreen);

    // 4. Lower EICAS (Secondary & Fuel)
    const lowerEicasBezel = new THREE.Mesh(bezelGeo, this.metalDarkMat);
    lowerEicasBezel.position.set(0, -0.15, 0.03);
    const lowerEicasScreen = new THREE.Mesh(screenGeo, this.displayScreenMatEICAS2);
    lowerEicasScreen.position.set(0, -0.15, 0.042);
    mip.add(lowerEicasBezel, lowerEicasScreen);

    // --- FIRST OFFICER SIDE (Right) ---
    // 5. First Officer ND
    const foNdBezel = new THREE.Mesh(bezelGeo, this.metalDarkMat);
    foNdBezel.position.set(0.41, 0.12, 0.03);
    const foNdScreen = new THREE.Mesh(screenGeo, this.displayScreenMatND);
    foNdScreen.position.set(0.41, 0.12, 0.042);
    mip.add(foNdBezel, foNdScreen);

    // 6. First Officer PFD
    const foPfdBezel = new THREE.Mesh(bezelGeo, this.metalDarkMat);
    foPfdBezel.position.set(0.68, 0.12, 0.03);
    const foPfdScreen = new THREE.Mesh(screenGeo, this.displayScreenMatPFD);
    foPfdScreen.position.set(0.68, 0.12, 0.042);
    mip.add(foPfdBezel, foPfdScreen);

    // --- STANDBY INSTRUMENTS & FLAP GAUGE ---
    // Standby ISFD (Attitude/Altitude/Speed)
    const isfdGeo = new THREE.BoxGeometry(0.12, 0.12, 0.02);
    const isfd = new THREE.Mesh(isfdGeo, this.metalDarkMat);
    isfd.position.set(-0.19, 0.14, 0.03);
    mip.add(isfd);

    // Flap Position Gauge (Circular dial with moving needle)
    const flapDialGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.015, 24);
    const flapDial = new THREE.Mesh(flapDialGeo, this.metalDarkMat);
    flapDial.rotation.x = Math.PI / 2;
    flapDial.position.set(0.19, 0.14, 0.035);
    mip.add(flapDial);

    const needleGeo = new THREE.BoxGeometry(0.004, 0.038, 0.005);
    const needle = new THREE.Mesh(needleGeo, this.metalBrushedMat);
    needle.position.set(0.19, 0.14, 0.045);
    mip.add(needle);
    anim.flapGaugeNeedle = needle;

    // --- LANDING GEAR LEVER (Iconic B737 translucent white cylindrical pull knob) ---
    const gearLeverGroup = new THREE.Group();
    gearLeverGroup.position.set(0.24, -0.06, 0.04);

    const gearArmGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.11, 12);
    const gearArm = new THREE.Mesh(gearArmGeo, this.metalBrushedMat);
    gearArm.position.y = 0.055;
    gearLeverGroup.add(gearArm);

    // White translucent cylinder knob
    const knobGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.06, 16);
    const gearKnobMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.1,
    });
    const gearKnob = new THREE.Mesh(knobGeo, gearKnobMat);
    gearKnob.position.y = 0.11;
    gearLeverGroup.add(gearKnob);

    mip.add(gearLeverGroup);
    anim.gearLever = gearLeverGroup;

    this.registerInteractive(gearLeverGroup, {
      id: 'gear_lever',
      name: 'Landing Gear Lever',
      panel: 'MIP',
      type: 'lever',
      stateDescription: 'Controls extension and retraction of landing gear (UP / OFF / DOWN)',
      instruction: 'Click to cycle landing gear UP / DOWN',
    });

    // Landing Gear Annunciators: 3 Green (Down & Locked) and 3 Red (In Transit)
    const lightGeo = new THREE.BoxGeometry(0.018, 0.014, 0.01);
    const noseGreen = new THREE.Mesh(lightGeo, this.emissiveGreenMat);
    noseGreen.position.set(0.24, 0.05, 0.04);
    const leftGreen = new THREE.Mesh(lightGeo, this.emissiveGreenMat);
    leftGreen.position.set(0.21, 0.025, 0.04);
    const rightGreen = new THREE.Mesh(lightGeo, this.emissiveGreenMat);
    rightGreen.position.set(0.27, 0.025, 0.04);

    const noseRed = new THREE.Mesh(lightGeo, this.metalDarkMat);
    noseRed.position.set(0.24, 0.07, 0.04);
    const leftRed = new THREE.Mesh(lightGeo, this.metalDarkMat);
    leftRed.position.set(0.21, 0.045, 0.04);
    const rightRed = new THREE.Mesh(lightGeo, this.metalDarkMat);
    rightRed.position.set(0.27, 0.045, 0.04);

    mip.add(noseGreen, leftGreen, rightGreen, noseRed, leftRed, rightRed);

    anim.gearLights = {
      noseGreen,
      leftGreen,
      rightGreen,
      noseRed,
      leftRed,
      rightRed,
    };

    // --- AUTOBRAKE ROTARY KNOB ---
    const autobrakeGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.025, 16);
    const autobrakeKnob = new THREE.Mesh(autobrakeGeo, this.metalBrushedMat);
    autobrakeKnob.rotation.x = Math.PI / 2;
    autobrakeKnob.position.set(-0.19, -0.06, 0.045);
    mip.add(autobrakeKnob);
    anim.autobrakeKnob = autobrakeKnob;

    this.registerInteractive(autobrakeKnob, {
      id: 'autobrake_knob',
      name: 'Autobrake Selector',
      panel: 'MIP',
      type: 'knob',
      stateDescription: 'OFF, 1, 2, 3, MAX, RTO',
      instruction: 'Click to cycle autobrake settings',
    });

    // --- MASTER CAUTION & MASTER WARNING BUTTONS (Captain side) ---
    const warningBtnGeo = new THREE.BoxGeometry(0.045, 0.028, 0.02);
    const masterWarn = new THREE.Mesh(warningBtnGeo, this.emissiveRedMat);
    masterWarn.position.set(-0.55, 0.28, 0.04);
    mip.add(masterWarn);
    anim.masterWarningCapt = masterWarn;

    this.registerInteractive(masterWarn, {
      id: 'master_warning',
      name: 'Master Warning Annunciator',
      panel: 'MIP',
      type: 'pushbutton',
      stateDescription: 'Emergency warning recall / reset button',
      instruction: 'Click to acknowledge Master Warning',
    });

    const masterCaution = new THREE.Mesh(warningBtnGeo, this.emissiveAmberMat);
    masterCaution.position.set(-0.49, 0.28, 0.04);
    mip.add(masterCaution);
    anim.masterCautionCapt = masterCaution;

    this.registerInteractive(masterCaution, {
      id: 'master_caution',
      name: 'Master Caution Annunciator',
      panel: 'MIP',
      type: 'pushbutton',
      stateDescription: 'Caution recall / reset button',
      instruction: 'Click to acknowledge Master Caution alert',
    });

    this.root.add(mip);
  }

  /**
   * 3. Mode Control Panel (MCP / Autopilot glare shield panel)
   */
  private buildModeControlPanel(anim: Partial<CockpitAnimatableParts>) {
    const mcp = new THREE.Group();
    mcp.name = 'ModeControlPanel';
    mcp.position.set(0, 0.32, -0.72);

    // MCP main chassis angled at ~12 degrees towards pilot
    const mcpGeo = new THREE.BoxGeometry(1.65, 0.16, 0.08);
    const mcpMat = new THREE.MeshStandardMaterial({
      color: 0x2b313a,
      roughness: 0.6,
      metalness: 0.25,
      map: CockpitTextureFactory.createMcpPanelTexture(),
    });
    const mcpPanel = new THREE.Mesh(mcpGeo, mcpMat);
    mcp.add(mcpPanel);

    // Rotary Knobs (Knurled aluminum dials)
    const knobGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.025, 16);

    // Speed Knob
    const spdKnob = new THREE.Mesh(knobGeo, this.metalBrushedMat);
    spdKnob.rotation.x = Math.PI / 2;
    spdKnob.position.set(-0.35, 0.01, 0.05);
    mcp.add(spdKnob);
    anim.spdKnob = spdKnob;
    this.registerInteractive(spdKnob, {
      id: 'mcp_speed_knob',
      name: 'IAS/MACH Speed Selector',
      panel: 'MCP',
      type: 'knob',
      stateDescription: 'Adjusts target indicated airspeed (knots)',
      instruction: 'Click to adjust target airspeed (+10 kts)',
    });

    // Heading Knob
    const hdgKnob = new THREE.Mesh(knobGeo, this.metalBrushedMat);
    hdgKnob.rotation.x = Math.PI / 2;
    hdgKnob.position.set(0.02, 0.01, 0.05);
    mcp.add(hdgKnob);
    anim.hdgKnob = hdgKnob;
    this.registerInteractive(hdgKnob, {
      id: 'mcp_heading_knob',
      name: 'Heading Selector Knob',
      panel: 'MCP',
      type: 'knob',
      stateDescription: 'Adjusts autopilot target heading bug (degrees)',
      instruction: 'Click to turn heading (+10°)',
    });

    // Altitude Knob
    const altKnob = new THREE.Mesh(knobGeo, this.metalBrushedMat);
    altKnob.rotation.x = Math.PI / 2;
    altKnob.position.set(0.36, 0.01, 0.05);
    mcp.add(altKnob);
    anim.altKnob = altKnob;
    this.registerInteractive(altKnob, {
      id: 'mcp_altitude_knob',
      name: 'Altitude Selector Knob',
      panel: 'MCP',
      type: 'knob',
      stateDescription: 'Adjusts target altitude in 1,000 ft steps',
      instruction: 'Click to increment target altitude (+1,000 ft)',
    });

    // Vertical Speed Roller Wheel
    const vsWheelGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.045, 16);
    const vsWheel = new THREE.Mesh(vsWheelGeo, this.metalDarkMat);
    vsWheel.rotation.z = Math.PI / 2;
    vsWheel.position.set(0.62, 0.01, 0.05);
    mcp.add(vsWheel);
    this.registerInteractive(vsWheel, {
      id: 'mcp_vs_wheel',
      name: 'Vertical Speed Thumb Wheel',
      panel: 'MCP',
      type: 'lever',
      stateDescription: 'Adjusts vertical speed rate (fpm)',
      instruction: 'Click to change V/S target rate',
    });

    // Flight Director Switches (Captain & FO)
    const toggleGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.028, 8);

    const fdCaptGroup = new THREE.Group();
    fdCaptGroup.position.set(-0.72, -0.02, 0.05);
    const fdCaptMesh = new THREE.Mesh(toggleGeo, this.metalBrushedMat);
    fdCaptMesh.position.y = 0.014;
    fdCaptGroup.add(fdCaptMesh);
    mcp.add(fdCaptGroup);
    anim.fdSwitchCapt = fdCaptGroup;
    this.registerInteractive(fdCaptGroup, {
      id: 'fd_capt_switch',
      name: 'Flight Director Switch (Capt)',
      panel: 'MCP',
      type: 'toggle',
      stateDescription: 'Toggles Captain primary Flight Director cues',
      instruction: 'Click to toggle Flight Director',
    });

    const fdFoGroup = new THREE.Group();
    fdFoGroup.position.set(0.72, -0.02, 0.05);
    const fdFoMesh = new THREE.Mesh(toggleGeo, this.metalBrushedMat);
    fdFoMesh.position.y = 0.014;
    fdFoGroup.add(fdFoMesh);
    mcp.add(fdFoGroup);
    anim.fdSwitchFo = fdFoGroup;
    this.registerInteractive(fdFoGroup, {
      id: 'fd_fo_switch',
      name: 'Flight Director Switch (F/O)',
      panel: 'MCP',
      type: 'toggle',
      stateDescription: 'Toggles First Officer Flight Director cues',
      instruction: 'Click to toggle Flight Director',
    });

    // Autothrottle Arm Toggle Switch
    const atArmGroup = new THREE.Group();
    atArmGroup.position.set(-0.46, -0.02, 0.05);
    const atArmMesh = new THREE.Mesh(toggleGeo, this.metalBrushedMat);
    atArmMesh.position.y = 0.014;
    atArmGroup.add(atArmMesh);
    mcp.add(atArmGroup);
    anim.atArmSwitch = atArmGroup;
    this.registerInteractive(atArmGroup, {
      id: 'at_arm_switch',
      name: 'Auto-Throttle Arm Switch',
      panel: 'MCP',
      type: 'toggle',
      stateDescription: 'Arms Autothrottle computer for N1/Speed hold',
      instruction: 'Click to arm/disarm Autothrottle',
    });

    // Pushbuttons with green indicator bars (HDG SEL, LNAV, VNAV, APP, ALT HLD, CMD A, CMD B)
    const btnGeo = new THREE.BoxGeometry(0.038, 0.022, 0.015);
    const buttonsDef = [
      { id: 'btn_lnav', name: 'LNAV Button', x: -0.16, y: -0.02 },
      { id: 'btn_vnav', name: 'VNAV Button', x: -0.23, y: -0.02 },
      { id: 'btn_hdg_sel', name: 'HDG SEL Button', x: 0.02, y: -0.02 },
      { id: 'btn_vor_loc', name: 'VOR LOC Button', x: 0.12, y: -0.02 },
      { id: 'btn_app', name: 'APP (ILS Approach) Button', x: 0.19, y: -0.02 },
      { id: 'btn_alt_hld', name: 'ALT HLD Button', x: 0.36, y: -0.02 },
      { id: 'btn_vs', name: 'V/S Mode Button', x: 0.47, y: -0.02 },
      { id: 'btn_cmd_a', name: 'CMD A Autopilot Engage', x: 0.55, y: -0.02 },
      { id: 'btn_cmd_b', name: 'CMD B Autopilot Engage', x: 0.65, y: -0.02 },
    ];

    buttonsDef.forEach((b) => {
      const btn = new THREE.Mesh(btnGeo, this.metalDarkMat);
      btn.position.set(b.x, b.y, 0.045);
      mcp.add(btn);
      anim.mcpButtons!.set(b.id, btn);

      this.registerInteractive(btn, {
        id: b.id,
        name: b.name,
        panel: 'MCP',
        type: 'pushbutton',
        stateDescription: 'Engages/disengages autopilot mode',
        instruction: 'Click to toggle autopilot mode',
      });
    });

    this.root.add(mcp);
  }

  /**
   * 4. Center Pedestal, Throttle Quadrant & Dual FMC / CDU
   */
  private buildThrottlePedestal(anim: Partial<CockpitAnimatableParts>) {
    const pedestal = new THREE.Group();
    pedestal.name = 'CenterPedestal';
    pedestal.position.set(0, -0.28, -0.32);

    // Pedestal floor cabinet
    const cabGeo = new THREE.BoxGeometry(0.48, 0.55, 0.95);
    const cab = new THREE.Mesh(cabGeo, this.panelMat);
    cab.position.y = -0.1;
    pedestal.add(cab);

    // Throttle Quadrant Top curved housing
    const quadHousingGeo = new THREE.BoxGeometry(0.38, 0.22, 0.44);
    const quadMat = new THREE.MeshStandardMaterial({
      color: 0x24282f,
      roughness: 0.5,
      metalness: 0.4,
      map: CockpitTextureFactory.createPedestalLabelsTexture(),
    });
    const quadHousing = new THREE.Mesh(quadHousingGeo, quadMat);
    quadHousing.position.set(0, 0.14, -0.08);
    pedestal.add(quadHousing);

    // --- TWIN ENGINE THRUST LEVERS (Engine 1 & Engine 2) ---
    const leverStemGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.18, 12);
    const gripGeo = new THREE.BoxGeometry(0.045, 0.038, 0.07);

    // Throttle 1
    const throt1Group = new THREE.Group();
    throt1Group.position.set(-0.04, 0.18, -0.08);
    const stem1 = new THREE.Mesh(leverStemGeo, this.metalBrushedMat);
    stem1.position.y = 0.09;
    const grip1 = new THREE.Mesh(gripGeo, this.metalDarkMat);
    grip1.position.set(0, 0.18, 0.01);
    throt1Group.add(stem1, grip1);
    pedestal.add(throt1Group);
    anim.throttle1Lever = throt1Group;

    // Reverse Thrust Lever 1 on front of grip
    const revLeverGeo = new THREE.BoxGeometry(0.035, 0.06, 0.015);
    const rev1Group = new THREE.Group();
    rev1Group.position.set(0, 0.20, -0.025);
    const rev1Mesh = new THREE.Mesh(revLeverGeo, this.metalBrushedMat);
    rev1Group.add(rev1Mesh);
    throt1Group.add(rev1Group);
    anim.reverse1Lever = rev1Group;

    this.registerInteractive(throt1Group, {
      id: 'throttle_1',
      name: 'Engine 1 Thrust Lever',
      panel: 'Pedestal',
      type: 'lever',
      stateDescription: 'Controls CFM56-7B Engine 1 thrust',
      instruction: 'Click to adjust Engine 1 thrust',
    });

    // Throttle 2
    const throt2Group = new THREE.Group();
    throt2Group.position.set(0.04, 0.18, -0.08);
    const stem2 = new THREE.Mesh(leverStemGeo, this.metalBrushedMat);
    stem2.position.y = 0.09;
    const grip2 = new THREE.Mesh(gripGeo, this.metalDarkMat);
    grip2.position.set(0, 0.18, 0.01);
    throt2Group.add(stem2, grip2);
    pedestal.add(throt2Group);
    anim.throttle2Lever = throt2Group;

    const rev2Group = new THREE.Group();
    rev2Group.position.set(0, 0.20, -0.025);
    const rev2Mesh = new THREE.Mesh(revLeverGeo, this.metalBrushedMat);
    rev2Group.add(rev2Mesh);
    throt2Group.add(rev2Group);
    anim.reverse2Lever = rev2Group;

    this.registerInteractive(throt2Group, {
      id: 'throttle_2',
      name: 'Engine 2 Thrust Lever',
      panel: 'Pedestal',
      type: 'lever',
      stateDescription: 'Controls CFM56-7B Engine 2 thrust',
      instruction: 'Click to adjust Engine 2 thrust',
    });

    // --- FLAP LEVER WITH NOTCHED GATE ---
    const flapLeverGroup = new THREE.Group();
    flapLeverGroup.position.set(0.14, 0.18, -0.08);
    const flapStem = new THREE.Mesh(leverStemGeo, this.metalBrushedMat);
    flapStem.position.y = 0.08;
    const flapKnobGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.04, 16);
    const flapKnob = new THREE.Mesh(flapKnobGeo, this.metalBrushedMat);
    flapKnob.rotation.z = Math.PI / 2;
    flapKnob.position.y = 0.16;
    flapLeverGroup.add(flapStem, flapKnob);
    pedestal.add(flapLeverGroup);
    anim.flapLever = flapLeverGroup;

    this.registerInteractive(flapLeverGroup, {
      id: 'flap_lever',
      name: 'Flaps Selector Lever',
      panel: 'Pedestal',
      type: 'lever',
      stateDescription: 'Positions: UP, 1, 2, 5, 10, 15, 25, 30, 40',
      instruction: 'Click to cycle flap detents',
    });

    // --- SPEED BRAKE / SPOILER LEVER ---
    const spdBrakeGroup = new THREE.Group();
    spdBrakeGroup.position.set(-0.14, 0.18, -0.08);
    const spdStem = new THREE.Mesh(leverStemGeo, this.metalBrushedMat);
    spdStem.position.y = 0.08;
    const spdKnobGeo = new THREE.SphereGeometry(0.018, 16, 12);
    const spdKnob = new THREE.Mesh(spdKnobGeo, this.metalDarkMat);
    spdKnob.position.y = 0.16;
    spdBrakeGroup.add(spdStem, spdKnob);
    pedestal.add(spdBrakeGroup);
    anim.speedbrakeLever = spdBrakeGroup;

    this.registerInteractive(spdBrakeGroup, {
      id: 'speedbrake_lever',
      name: 'Speed Brake / Spoiler Lever',
      panel: 'Pedestal',
      type: 'lever',
      stateDescription: 'DOWN, ARMED, FLIGHT DETENT, UP',
      instruction: 'Click to cycle Speed Brake position',
    });

    // --- DUAL STAB TRIM WHEELS (on left & right flanks) ---
    const trimWheelGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.03, 32);
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x1a1e24,
      roughness: 0.4,
      metalness: 0.6,
    });
    const trimL = new THREE.Mesh(trimWheelGeo, trimMat);
    trimL.rotation.z = Math.PI / 2;
    trimL.position.set(-0.20, 0.12, -0.08);
    pedestal.add(trimL);
    anim.trimWheelL = trimL;

    const trimR = new THREE.Mesh(trimWheelGeo, trimMat);
    trimR.rotation.z = Math.PI / 2;
    trimR.position.set(0.20, 0.12, -0.08);
    pedestal.add(trimR);
    anim.trimWheelR = trimR;

    // --- ENGINE START / FUEL CUTOFF LEVERS (under throttles) ---
    const cutoffGeo = new THREE.BoxGeometry(0.02, 0.05, 0.03);
    const cutoffMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.4,
      metalness: 0.3,
    });

    const cutoff1Group = new THREE.Group();
    cutoff1Group.position.set(-0.04, 0.15, 0.08);
    const cutoff1Mesh = new THREE.Mesh(cutoffGeo, cutoffMat);
    cutoff1Group.add(cutoff1Mesh);
    pedestal.add(cutoff1Group);
    anim.cutoff1Lever = cutoff1Group;

    this.registerInteractive(cutoff1Group, {
      id: 'fuel_cutoff_1',
      name: 'Engine 1 Start / Cutoff Lever',
      panel: 'Pedestal',
      type: 'lever',
      stateDescription: 'Controls fuel supply to Engine 1 (CUTOFF / IDLE)',
      instruction: 'Click to toggle Engine 1 fuel cutoff/run',
    });

    const cutoff2Group = new THREE.Group();
    cutoff2Group.position.set(0.04, 0.15, 0.08);
    const cutoff2Mesh = new THREE.Mesh(cutoffGeo, cutoffMat);
    cutoff2Group.add(cutoff2Mesh);
    pedestal.add(cutoff2Group);
    anim.cutoff2Lever = cutoff2Group;

    this.registerInteractive(cutoff2Group, {
      id: 'fuel_cutoff_2',
      name: 'Engine 2 Start / Cutoff Lever',
      panel: 'Pedestal',
      type: 'lever',
      stateDescription: 'Controls fuel supply to Engine 2 (CUTOFF / IDLE)',
      instruction: 'Click to toggle Engine 2 fuel cutoff/run',
    });

    // --- PARKING BRAKE LEVER (with red handle) ---
    const parkBrakeGroup = new THREE.Group();
    parkBrakeGroup.position.set(0, 0.14, 0.18);
    const pbHandleGeo = new THREE.BoxGeometry(0.04, 0.025, 0.09);
    const pbMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.35,
      metalness: 0.2,
    });
    const pbMesh = new THREE.Mesh(pbHandleGeo, pbMat);
    parkBrakeGroup.add(pbMesh);
    pedestal.add(parkBrakeGroup);
    anim.parkingBrakeLever = parkBrakeGroup;

    this.registerInteractive(parkBrakeGroup, {
      id: 'parking_brake',
      name: 'Parking Brake Lever',
      panel: 'Pedestal',
      type: 'lever',
      stateDescription: 'Engages main wheel hydraulic parking brakes',
      instruction: 'Click to set/release Parking Brake',
    });

    // --- DUAL FMC / CDU UNITS (Flight Management Computer) ---
    const fmcGeo = new THREE.BoxGeometry(0.18, 0.24, 0.03);
    const fmcMat = new THREE.MeshStandardMaterial({
      color: 0x1e242c,
      roughness: 0.7,
      metalness: 0.3,
    });

    // Captain FMC
    const captFmc = new THREE.Mesh(fmcGeo, fmcMat);
    captFmc.position.set(-0.25, 0.06, -0.42);
    captFmc.rotation.x = -0.35;
    const captFmcScreenGeo = new THREE.PlaneGeometry(0.14, 0.11);
    const captFmcScreen = new THREE.Mesh(captFmcScreenGeo, this.displayScreenMatFMC);
    captFmcScreen.position.set(0, 0.04, 0.016);
    captFmc.add(captFmcScreen);
    pedestal.add(captFmc);

    this.registerInteractive(captFmc, {
      id: 'fmc_cdu',
      name: 'Flight Management Computer (FMC/CDU)',
      panel: 'FMC',
      type: 'pushbutton',
      stateDescription: 'Boeing Flight Management Computer with flight plan & performance pages',
      instruction: 'Click to cycle FMC page (RTE / PERF / LEGS)',
    });

    // First Officer FMC
    const foFmc = new THREE.Mesh(fmcGeo, fmcMat);
    foFmc.position.set(0.25, 0.06, -0.42);
    foFmc.rotation.x = -0.35;
    const foFmcScreen = new THREE.Mesh(captFmcScreenGeo, this.displayScreenMatFMC);
    foFmcScreen.position.set(0, 0.04, 0.016);
    foFmc.add(foFmcScreen);
    pedestal.add(foFmc);

    // Radio Comm & Nav panels behind throttles
    const radioGeo = new THREE.BoxGeometry(0.42, 0.06, 0.28);
    const radioPanel = new THREE.Mesh(radioGeo, this.panelMat);
    radioPanel.position.set(0, 0.02, 0.32);
    pedestal.add(radioPanel);

    this.root.add(pedestal);
  }

  /**
   * 5. Overhead Panel: Battery Master with flip guard, APU, Fuel Pumps, Hydraulics, Lights
   */
  private buildOverheadPanel(anim: Partial<CockpitAnimatableParts>) {
    const overhead = new THREE.Group();
    overhead.name = 'OverheadPanel';
    overhead.position.set(0, 1.05, -0.42);
    overhead.rotation.x = 0.42; // tilted down towards pilots

    // Overhead Panel Main Board
    const ohBoardGeo = new THREE.BoxGeometry(0.88, 1.02, 0.06);
    const ohMat = new THREE.MeshStandardMaterial({
      color: 0x2f353d,
      roughness: 0.65,
      metalness: 0.25,
      map: CockpitTextureFactory.createOverheadLabelsTexture(),
    });
    const ohBoard = new THREE.Mesh(ohBoardGeo, ohMat);
    overhead.add(ohBoard);

    // Standard toggle switch geometry
    const toggleGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.025, 8);

    // --- BATTERY MASTER SWITCH WITH RED TRANSLUCENT FLIP GUARD ---
    const batGuardGroup = new THREE.Group();
    batGuardGroup.position.set(-0.25, 0.36, 0.04);

    // Translucent red guard cover
    const guardCoverGeo = new THREE.BoxGeometry(0.028, 0.045, 0.024);
    const guardMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.75,
      roughness: 0.2,
      metalness: 0.1,
    });
    const guardCover = new THREE.Mesh(guardCoverGeo, guardMat);
    guardCover.position.y = 0.02;
    batGuardGroup.add(guardCover);
    overhead.add(batGuardGroup);
    anim.batteryGuard = batGuardGroup;

    this.registerInteractive(batGuardGroup, {
      id: 'bat_guard',
      name: 'Battery Switch Red Guard',
      panel: 'Overhead',
      type: 'guard',
      stateDescription: 'Safety guard covering the Master Battery switch',
      instruction: 'Click to open/close the Battery Switch guard',
    });

    const batSwitchGroup = new THREE.Group();
    batSwitchGroup.position.set(-0.25, 0.36, 0.035);
    const batSwitchMesh = new THREE.Mesh(toggleGeo, this.metalBrushedMat);
    batSwitchMesh.position.y = 0.012;
    batSwitchGroup.add(batSwitchMesh);
    overhead.add(batSwitchGroup);
    anim.batterySwitch = batSwitchGroup;

    this.registerInteractive(batSwitchGroup, {
      id: 'battery_master',
      name: 'Master Battery Switch',
      panel: 'Overhead',
      type: 'toggle',
      stateDescription: 'Connects main aircraft 28V DC battery bus',
      instruction: 'Click to toggle Battery Master Power',
    });

    // --- APU START SWITCH ---
    const apuSwitchGroup = new THREE.Group();
    apuSwitchGroup.position.set(0.02, 0.36, 0.035);
    const apuSwitchMesh = new THREE.Mesh(toggleGeo, this.metalBrushedMat);
    apuSwitchMesh.position.y = 0.012;
    apuSwitchGroup.add(apuSwitchMesh);
    overhead.add(apuSwitchGroup);
    anim.apuSwitch = apuSwitchGroup;

    this.registerInteractive(apuSwitchGroup, {
      id: 'apu_start',
      name: 'APU Master Switch',
      panel: 'Overhead',
      type: 'toggle',
      stateDescription: 'Auxiliary Power Unit (OFF - ON - START)',
      instruction: 'Click to start/stop the APU turbine',
    });

    // --- ENGINE 1 & 2 ROTARY START SELECTORS ---
    const engStartKnobGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.022, 16);
    const engStart1 = new THREE.Mesh(engStartKnobGeo, this.metalBrushedMat);
    engStart1.rotation.x = Math.PI / 2;
    engStart1.position.set(-0.16, 0.12, 0.045);
    overhead.add(engStart1);
    anim.engStart1Knob = engStart1;

    this.registerInteractive(engStart1, {
      id: 'eng_start_1',
      name: 'Engine 1 Start Knob',
      panel: 'Overhead',
      type: 'knob',
      stateDescription: 'Positions: GRD, OFF, CONT, FLT',
      instruction: 'Click to rotate Engine 1 start switch',
    });

    const engStart2 = new THREE.Mesh(engStartKnobGeo, this.metalBrushedMat);
    engStart2.rotation.x = Math.PI / 2;
    engStart2.position.set(0.16, 0.12, 0.045);
    overhead.add(engStart2);
    anim.engStart2Knob = engStart2;

    this.registerInteractive(engStart2, {
      id: 'eng_start_2',
      name: 'Engine 2 Start Knob',
      panel: 'Overhead',
      type: 'knob',
      stateDescription: 'Positions: GRD, OFF, CONT, FLT',
      instruction: 'Click to rotate Engine 2 start switch',
    });

    // --- OVERHEAD TOGGLE SWITCHES GANG (Fuel, Hyd, Lights, Signs) ---
    const togglesConfig = [
      // Fuel Pumps
      { id: 'fuel_fwd_l', name: 'Fuel Pump FWD L', x: -0.32, y: 0.18 },
      { id: 'fuel_aft_l', name: 'Fuel Pump AFT L', x: -0.22, y: 0.18 },
      { id: 'fuel_fwd_r', name: 'Fuel Pump FWD R', x: -0.12, y: 0.18 },
      { id: 'fuel_aft_r', name: 'Fuel Pump AFT R', x: -0.02, y: 0.18 },
      // Hydraulics
      { id: 'hyd_eng_1', name: 'Hydraulic ENG 1 Pump', x: 0.12, y: 0.18 },
      { id: 'hyd_elec_2', name: 'Hydraulic ELEC 2 Pump', x: 0.22, y: 0.18 },
      { id: 'hyd_elec_1', name: 'Hydraulic ELEC 1 Pump', x: 0.32, y: 0.18 },
      // Exterior Lights
      { id: 'landing_lts', name: 'Landing Lights Gang', x: -0.32, y: -0.32 },
      { id: 'runway_turnoff', name: 'Runway Turnoff Lights', x: -0.20, y: -0.32 },
      { id: 'taxi_light', name: 'Taxi Light Switch', x: -0.08, y: -0.32 },
      { id: 'strobe_light', name: 'Strobe Light Switch', x: 0.08, y: -0.32 },
      { id: 'beacon_light', name: 'Anti-Collision Beacon', x: 0.20, y: -0.32 },
      { id: 'nav_lights', name: 'Position / Nav Lights', x: 0.32, y: -0.32 },
      // Passenger Signs & Dome Light
      { id: 'seatbelt_sign', name: 'Fasten Seatbelts Switch', x: -0.20, y: -0.12 },
      { id: 'no_smoking', name: 'No Smoking Switch', x: -0.08, y: -0.12 },
      { id: 'dome_light', name: 'Dome Light Selector', x: 0.16, y: -0.12 },
      { id: 'panel_backlight_toggle', name: 'Panel Integral Backlight', x: 0.28, y: -0.12 },
    ];

    togglesConfig.forEach((t) => {
      const swGroup = new THREE.Group();
      swGroup.position.set(t.x, t.y, 0.035);
      const mesh = new THREE.Mesh(toggleGeo, this.metalBrushedMat);
      mesh.position.y = 0.012;
      swGroup.add(mesh);
      overhead.add(swGroup);

      anim.overheadToggles!.set(t.id, swGroup);

      this.registerInteractive(swGroup, {
        id: t.id,
        name: t.name,
        panel: 'Overhead',
        type: 'toggle',
        stateDescription: `Toggle switch for ${t.name}`,
        instruction: `Click to toggle ${t.name}`,
      });
    });

    this.root.add(overhead);
  }

  /**
   * 6. Captain & First Officer Pilot Seats (Authentic sheepskin wool cushion, armrests, rails)
   */
  private buildPilotSeats() {
    const seatsGroup = new THREE.Group();
    seatsGroup.name = 'PilotSeats';

    const seatPositions = [-0.52, 0.52]; // Captain (Left), FO (Right)

    seatPositions.forEach((posX, idx) => {
      const seat = new THREE.Group();
      seat.name = idx === 0 ? 'CaptainSeat' : 'FirstOfficerSeat';
      seat.position.set(posX, -0.22, 0.15);

      // Seat Base Pedestal & Metal Track Rails
      const railGeo = new THREE.BoxGeometry(0.04, 0.03, 0.8);
      const rail1 = new THREE.Mesh(railGeo, this.seatFrameMat);
      rail1.position.set(-0.16, -0.42, 0);
      const rail2 = new THREE.Mesh(railGeo, this.seatFrameMat);
      rail2.position.set(0.16, -0.42, 0);
      seat.add(rail1, rail2);

      const baseStemGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.35, 16);
      const baseStem = new THREE.Mesh(baseStemGeo, this.seatFrameMat);
      baseStem.position.y = -0.24;
      seat.add(baseStem);

      // Seat Cushion (Contoured sheepskin)
      const cushionGeo = new THREE.BoxGeometry(0.48, 0.12, 0.46);
      const cushion = new THREE.Mesh(cushionGeo, this.seatSheepskinMat);
      cushion.position.y = -0.06;
      cushion.castShadow = true;
      seat.add(cushion);

      // Backrest (Contoured ergonomic back with side bolsters)
      const backrestGeo = new THREE.BoxGeometry(0.46, 0.58, 0.12);
      const backrest = new THREE.Mesh(backrestGeo, this.seatSheepskinMat);
      backrest.position.set(0, 0.28, 0.18);
      backrest.rotation.x = 0.14; // comfortable aviation seat tilt
      backrest.castShadow = true;
      seat.add(backrest);

      // Headrest (sheepskin covered)
      const headrestGeo = new THREE.BoxGeometry(0.24, 0.18, 0.08);
      const headrest = new THREE.Mesh(headrestGeo, this.seatSheepskinMat);
      headrest.position.set(0, 0.65, 0.24);
      headrest.rotation.x = 0.14;
      seat.add(headrest);

      // Armrests (folding leather/frame)
      const armrestGeo = new THREE.BoxGeometry(0.06, 0.05, 0.32);
      const armL = new THREE.Mesh(armrestGeo, this.seatFrameMat);
      armL.position.set(-0.25, 0.12, 0.02);
      const armR = new THREE.Mesh(armrestGeo, this.seatFrameMat);
      armR.position.set(0.25, 0.12, 0.02);
      seat.add(armL, armR);

      // Five-Point Harness Buckle on cushion
      const buckleGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.02, 16);
      const buckle = new THREE.Mesh(buckleGeo, this.metalBrushedMat);
      buckle.rotation.x = Math.PI / 2;
      buckle.position.set(0, 0.01, 0.02);
      seat.add(buckle);

      seatsGroup.add(seat);
    });

    this.root.add(seatsGroup);
  }

  /**
   * 7. Dual Boeing 737 W-shaped Control Yokes & Rudder Pedals
   */
  private buildYokesAndPedals(anim: Partial<CockpitAnimatableParts>) {
    const controlsGroup = new THREE.Group();
    controlsGroup.name = 'FlightControls';

    // Pedals geometry
    const pedalGeo = new THREE.BoxGeometry(0.09, 0.18, 0.025);

    // --- CAPTAIN CONTROLS (Left side) ---
    // Captain Pitch Column (pivots forward/back)
    const captColGroup = new THREE.Group();
    captColGroup.position.set(-0.52, -0.65, -0.65);

    const colStemGeo = new THREE.CylinderGeometry(0.025, 0.03, 0.65, 16);
    const colStem = new THREE.Mesh(colStemGeo, this.metalDarkMat);
    colStem.position.y = 0.32;
    captColGroup.add(colStem);

    // Captain Yoke Wheel (turns in roll left/right)
    const captWheelGroup = new THREE.Group();
    captWheelGroup.position.set(0, 0.64, 0);

    // W-Shaped Boeing 737 Yoke Horns (assembled with precision)
    const yokeHubGeo = new THREE.BoxGeometry(0.12, 0.06, 0.04);
    const yokeHub = new THREE.Mesh(yokeHubGeo, this.metalDarkMat);
    captWheelGroup.add(yokeHub);

    // Center Checklist Clipboard
    const clipGeo = new THREE.BoxGeometry(0.08, 0.10, 0.01);
    const clipMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 });
    const clip = new THREE.Mesh(clipGeo, clipMat);
    clip.position.set(0, 0.02, 0.025);
    captWheelGroup.add(clip);

    // Left and Right Hand Horns
    const hornArmGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.15, 12);
    const hornL = new THREE.Mesh(hornArmGeo, this.metalDarkMat);
    hornL.position.set(-0.12, 0.04, 0);
    hornL.rotation.z = 0.45;
    const hornR = new THREE.Mesh(hornArmGeo, this.metalDarkMat);
    hornR.position.set(0.12, 0.04, 0);
    hornR.rotation.z = -0.45;

    const gripGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.12, 12);
    const gripL = new THREE.Mesh(gripGeo, this.metalDarkMat);
    gripL.position.set(-0.16, 0.10, 0);
    const gripR = new THREE.Mesh(gripGeo, this.metalDarkMat);
    gripR.position.set(0.16, 0.10, 0);

    captWheelGroup.add(hornL, hornR, gripL, gripR);
    captColGroup.add(captWheelGroup);
    controlsGroup.add(captColGroup);

    anim.captainYokeColumn = captColGroup;
    anim.captainYokeWheel = captWheelGroup;

    this.registerInteractive(captWheelGroup, {
      id: 'capt_yoke',
      name: "Captain's Flight Control Yoke",
      panel: 'Flight Controls',
      type: 'lever',
      stateDescription: 'Controls aircraft pitch (elevator) and roll (ailerons)',
      instruction: 'Drag or press W/S (pitch) and A/D (roll)',
    });

    // Captain Rudder Pedals
    const pedL1 = new THREE.Mesh(pedalGeo, this.metalBrushedMat);
    pedL1.position.set(-0.62, -0.60, -0.88);
    const pedL2 = new THREE.Mesh(pedalGeo, this.metalBrushedMat);
    pedL2.position.set(-0.42, -0.60, -0.88);
    controlsGroup.add(pedL1, pedL2);
    anim.rudderPedalL1 = pedL1;
    anim.rudderPedalL2 = pedL2;

    // --- FIRST OFFICER CONTROLS (Right side) ---
    const foColGroup = new THREE.Group();
    foColGroup.position.set(0.52, -0.65, -0.65);

    const foStem = new THREE.Mesh(colStemGeo, this.metalDarkMat);
    foStem.position.y = 0.32;
    foColGroup.add(foStem);

    const foWheelGroup = new THREE.Group();
    foWheelGroup.position.set(0, 0.64, 0);
    const foHub = new THREE.Mesh(yokeHubGeo, this.metalDarkMat);
    const foClip = new THREE.Mesh(clipGeo, clipMat);
    foClip.position.set(0, 0.02, 0.025);
    const foHornL = new THREE.Mesh(hornArmGeo, this.metalDarkMat);
    foHornL.position.set(-0.12, 0.04, 0);
    foHornL.rotation.z = 0.45;
    const foHornR = new THREE.Mesh(hornArmGeo, this.metalDarkMat);
    foHornR.position.set(0.12, 0.04, 0);
    foHornR.rotation.z = -0.45;
    const foGripL = new THREE.Mesh(gripGeo, this.metalDarkMat);
    foGripL.position.set(-0.16, 0.10, 0);
    const foGripR = new THREE.Mesh(gripGeo, this.metalDarkMat);
    foGripR.position.set(0.16, 0.10, 0);

    foWheelGroup.add(foHub, foClip, foHornL, foHornR, foGripL, foGripR);
    foColGroup.add(foWheelGroup);
    controlsGroup.add(foColGroup);

    anim.foYokeColumn = foColGroup;
    anim.foYokeWheel = foWheelGroup;

    // FO Rudder Pedals
    const pedR1 = new THREE.Mesh(pedalGeo, this.metalBrushedMat);
    pedR1.position.set(0.42, -0.60, -0.88);
    const pedR2 = new THREE.Mesh(pedalGeo, this.metalBrushedMat);
    pedR2.position.set(0.62, -0.60, -0.88);
    controlsGroup.add(pedR1, pedR2);
    anim.rudderPedalR1 = pedR1;
    anim.rudderPedalR2 = pedR2;

    this.root.add(controlsGroup);
  }

  /**
   * 8. Cockpit Interior Lighting (Boeing Warm Amber Backlights, Glare Flood, Dome)
   */
  private buildCockpitLighting(anim: Partial<CockpitAnimatableParts>) {
    // Overhead Dome Light (White/Warm ceiling fixture)
    const domeFixtureGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16);
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfff4e6,
      emissiveIntensity: 0.8,
    });
    const domeFixture = new THREE.Mesh(domeFixtureGeo, domeMat);
    domeFixture.position.set(0, 1.25, 0.1);
    this.root.add(domeFixture);

    const domeLight = new THREE.PointLight(0xfff4e6, 0.8, 3.5, 1.8);
    domeLight.position.set(0, 1.22, 0.1);
    domeLight.castShadow = false;
    this.root.add(domeLight);
    anim.domeLight = domeLight;

    // Glare Shield Floodlight (aimed down at Main Instrument Panel)
    const floodLight = new THREE.PointLight(0xffeedd, 0.6, 2.2, 1.5);
    floodLight.position.set(0, 0.38, -0.72);
    this.root.add(floodLight);
    anim.floodLight = floodLight;

    // Soft Contact Shadow Plane under center pedestal
    const contactShadowGeo = new THREE.PlaneGeometry(1.6, 2.0);
    const contactShadowMat = new THREE.MeshBasicMaterial({
      color: 0x05070a,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(contactShadowGeo, contactShadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(0, -0.678, -0.2);
    this.root.add(contactShadow);
  }

  /**
   * Update all physical animated parts from system state
   */
  public update(state: AircraftSystemsState, dt: number) {
    const a = this.animatables;

    // Update Control Yokes with user input
    if (a.captainYokeColumn && a.captainYokeWheel) {
      a.captainYokeColumn.rotation.x = THREE.MathUtils.damp(
        a.captainYokeColumn.rotation.x,
        -state.yokePitch * 0.22,
        15,
        dt
      );
      a.captainYokeWheel.rotation.z = THREE.MathUtils.damp(
        a.captainYokeWheel.rotation.z,
        -state.yokeRoll * 1.1,
        15,
        dt
      );
    }
    if (a.foYokeColumn && a.foYokeWheel) {
      a.foYokeColumn.rotation.x = a.captainYokeColumn.rotation.x;
      a.foYokeWheel.rotation.z = a.captainYokeWheel.rotation.z;
    }

    // Rudder Pedals
    if (a.rudderPedalL1 && a.rudderPedalL2) {
      const rudDisp = state.rudderPedal * 0.05;
      a.rudderPedalL1.position.z = -0.88 + rudDisp;
      a.rudderPedalL2.position.z = -0.88 - rudDisp;
      a.rudderPedalR1.position.z = -0.88 + rudDisp;
      a.rudderPedalR2.position.z = -0.88 - rudDisp;
    }

    // Throttle Levers rotation (0.0 idle to 1.0 full forward)
    if (a.throttle1Lever) {
      const throtAngle1 = -0.45 + state.throttle1 * 0.9;
      a.throttle1Lever.rotation.x = THREE.MathUtils.damp(a.throttle1Lever.rotation.x, throtAngle1, 12, dt);
    }
    if (a.throttle2Lever) {
      const throtAngle2 = -0.45 + state.throttle2 * 0.9;
      a.throttle2Lever.rotation.x = THREE.MathUtils.damp(a.throttle2Lever.rotation.x, throtAngle2, 12, dt);
    }

    // Flap Lever rotation (detents 0 to 8)
    if (a.flapLever) {
      const flapAngle = -0.35 + (state.flapLeverPosition / 8) * 0.75;
      a.flapLever.rotation.x = THREE.MathUtils.damp(a.flapLever.rotation.x, flapAngle, 10, dt);
    }

    // Speedbrake Lever
    if (a.speedbrakeLever) {
      const spdAngle = -0.3 + (state.speedbrakePosition / 3) * 0.65;
      a.speedbrakeLever.rotation.x = THREE.MathUtils.damp(a.speedbrakeLever.rotation.x, spdAngle, 10, dt);
    }

    // Fuel Cutoff Levers
    if (a.cutoff1Lever) {
      a.cutoff1Lever.position.z = state.fuelCutoff1 ? 0.05 : 0.08;
    }
    if (a.cutoff2Lever) {
      a.cutoff2Lever.position.z = state.fuelCutoff2 ? 0.05 : 0.08;
    }

    // Parking Brake Handle
    if (a.parkingBrakeLever) {
      a.parkingBrakeLever.position.y = state.parkingBrake ? 0.165 : 0.14;
    }

    // Trim Wheels rotation
    if (a.trimWheelL && a.trimWheelR) {
      if (Math.abs(state.verticalSpeed) > 100 || !state.onGround) {
        const trimSpeed = (state.verticalSpeed / 2000) * dt;
        a.trimWheelL.rotation.x += trimSpeed;
        a.trimWheelR.rotation.x += trimSpeed;
      }
    }

    // Landing Gear Lever (UP: -0.4, OFF: 0.0, DOWN: 0.4)
    if (a.gearLever) {
      const targetGearRot = state.gearLever === 'UP' ? -0.4 : state.gearLever === 'OFF' ? 0.0 : 0.4;
      a.gearLever.rotation.x = THREE.MathUtils.damp(a.gearLever.rotation.x, targetGearRot, 10, dt);
    }

    // Gear indicator lights
    if (a.gearLights) {
      const isDown = state.actualGear > 0.95;
      const isTransit = state.gearTransit || (state.actualGear > 0.05 && state.actualGear < 0.95);

      a.gearLights.noseGreen.material = isDown ? this.emissiveGreenMat : this.metalDarkMat;
      a.gearLights.leftGreen.material = isDown ? this.emissiveGreenMat : this.metalDarkMat;
      a.gearLights.rightGreen.material = isDown ? this.emissiveGreenMat : this.metalDarkMat;

      a.gearLights.noseRed.material = isTransit ? this.emissiveRedMat : this.metalDarkMat;
      a.gearLights.leftRed.material = isTransit ? this.emissiveRedMat : this.metalDarkMat;
      a.gearLights.rightRed.material = isTransit ? this.emissiveRedMat : this.metalDarkMat;
    }

    // Flap Gauge needle (0 to 40 degrees)
    if (a.flapGaugeNeedle) {
      const targetNeedleRot = (state.actualFlapAngle / 40) * Math.PI * 1.4;
      a.flapGaugeNeedle.rotation.z = THREE.MathUtils.damp(a.flapGaugeNeedle.rotation.z, -targetNeedleRot, 6, dt);
    }

    // Master Caution / Warning annunciators
    if (a.masterCautionCapt) {
      a.masterCautionCapt.material = state.masterCaution ? this.emissiveAmberMat : this.metalDarkMat;
    }
    if (a.masterWarningCapt) {
      a.masterWarningCapt.material = state.masterWarning ? this.emissiveRedMat : this.metalDarkMat;
    }

    // Battery Guard flip
    if (a.batteryGuard) {
      const targetGuardRot = state.batteryGuardOpen ? -1.4 : 0;
      a.batteryGuard.rotation.x = THREE.MathUtils.damp(a.batteryGuard.rotation.x, targetGuardRot, 14, dt);
    }

    // Battery Switch
    if (a.batterySwitch) {
      a.batterySwitch.rotation.x = state.batteryMaster ? -0.4 : 0.4;
    }

    // APU Switch
    if (a.apuSwitch) {
      a.apuSwitch.rotation.x = state.apuStartSwitch === 'START' ? -0.5 : state.apuStartSwitch === 'ON' ? -0.2 : 0.4;
    }

    // Engine Start Knobs
    if (a.engStart1Knob) {
      const rot = state.engStart1 === 'GND' ? -0.6 : state.engStart1 === 'OFF' ? 0 : state.engStart1 === 'CONT' ? 0.6 : 1.2;
      a.engStart1Knob.rotation.z = rot;
    }
    if (a.engStart2Knob) {
      const rot = state.engStart2 === 'GND' ? -0.6 : state.engStart2 === 'OFF' ? 0 : state.engStart2 === 'CONT' ? 0.6 : 1.2;
      a.engStart2Knob.rotation.z = rot;
    }

    // MCP Buttons illuminated status
    if (a.mcpButtons) {
      a.mcpButtons.forEach((btn, id) => {
        let active = false;
        if (id === 'btn_cmd_a') active = state.apCmdA;
        else if (id === 'btn_cmd_b') active = state.apCmdB;
        else if (id === 'btn_hdg_sel') active = state.mcpMode === 'HDG_SEL';
        else if (id === 'btn_lnav') active = state.mcpMode === 'LNAV';
        else if (id === 'btn_vnav') active = state.mcpMode === 'LVL_CHG';
        else if (id === 'btn_app') active = state.mcpMode === 'APP';
        else if (id === 'btn_alt_hld') active = state.mcpMode === 'ALT_HLD';
        else if (id === 'btn_vs') active = state.mcpMode === 'VS';

        btn.material = active ? this.emissiveGreenMat : this.metalDarkMat;
      });
    }

    // Windshield Wipers sweeping
    if (a.wiperCapt && a.wiperFo) {
      if (state.wipersRunning) {
        a.wiperCapt.rotation.z = 0.35 + Math.sin(state.wiperAngle) * 0.65;
        a.wiperFo.rotation.z = -0.35 - Math.sin(state.wiperAngle) * 0.65;
      } else {
        a.wiperCapt.rotation.z = 0.35;
        a.wiperFo.rotation.z = -0.35;
      }
    }

    // Cockpit Lighting intensities
    if (a.domeLight) {
      const domeIntensity = state.domeLight === 2 ? 1.0 : state.domeLight === 1 ? 0.35 : 0.0;
      a.domeLight.intensity = domeIntensity;
    }
    if (a.floodLight) {
      a.floodLight.intensity = state.floodLight * 0.8;
    }
  }
}
