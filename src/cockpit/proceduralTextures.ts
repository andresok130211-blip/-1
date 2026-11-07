import * as THREE from 'three';

/**
 * Procedural texture generator for Boeing 737-800 cockpit.
 * Zero external image dependencies.
 */

export class CockpitTextureFactory {
  private static maxAnisotropy: number = 8;

  public static setMaxAnisotropy(val: number) {
    this.maxAnisotropy = Math.max(1, Math.min(val, 16));
  }

  /**
   * Classic Boeing cockpit panels: dark blue-grey matte finish with subtle grain
   */
  public static createPanelTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base Boeing cockpit grey
    ctx.fillStyle = '#394049';
    ctx.fillRect(0, 0, 512, 512);

    // Fine powder-coat grain
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 14;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise + 2)); // slight cool tint
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = this.maxAnisotropy;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Authentic Boeing sheepskin seat texture (warm gray wool fluff)
   */
  public static createSheepskinTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#6e737a';
    ctx.fillRect(0, 0, 512, 512);

    // Procedural wool fibers
    ctx.fillStyle = '#828891';
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = 1 + Math.random() * 2.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#545860';
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = 0.8 + Math.random() * 1.8;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = this.maxAnisotropy;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Overhead Panel detailed labels and section dividers
   */
  public static createOverheadLabelsTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Background Boeing gray
    ctx.fillStyle = '#2f353d';
    ctx.fillRect(0, 0, 1024, 1024);

    // Section dividers (white lines)
    ctx.strokeStyle = '#5a626d';
    ctx.lineWidth = 3;

    // Top Electrical Section
    ctx.strokeRect(30, 30, 964, 200);
    // Fuel Section
    ctx.strokeRect(30, 250, 470, 220);
    // Hydraulics Section
    ctx.strokeRect(524, 250, 470, 220);
    // Pneumatics & Air Cond
    ctx.strokeRect(30, 490, 964, 230);
    // Exterior Lights Section
    ctx.strokeRect(30, 740, 964, 250);

    // Section Headers
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';

    ctx.fillText('ELECTRICAL POWER & APU', 512, 65);
    ctx.fillText('FUEL PUMPS', 265, 285);
    ctx.fillText('HYDRAULIC PUMPS', 759, 285);
    ctx.fillText('AIR CONDITIONING & BLEED AIR', 512, 525);
    ctx.fillText('EXTERIOR & INTERIOR LIGHTING', 512, 775);

    // Sublabels
    ctx.font = 'bold 15px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';

    // Battery & APU labels
    ctx.fillText('BAT MASTER', 180, 140);
    ctx.fillText('APU GEN OFF BUS', 512, 140);
    ctx.fillText('GEN 1', 750, 140);
    ctx.fillText('GEN 2', 880, 140);

    // Fuel pumps
    ctx.fillText('FWD L', 110, 350);
    ctx.fillText('AFT L', 210, 350);
    ctx.fillText('CTR L', 310, 350);
    ctx.fillText('CTR R', 410, 350);

    // Hydraulics
    ctx.fillText('ENG 1', 600, 350);
    ctx.fillText('ELEC 2', 710, 350);
    ctx.fillText('ELEC 1', 820, 350);
    ctx.fillText('ENG 2', 930, 350);

    // Bleed / Air
    ctx.fillText('PACK L', 180, 600);
    ctx.fillText('ENG 1 BLEED', 380, 600);
    ctx.fillText('APU BLEED', 512, 600);
    ctx.fillText('ENG 2 BLEED', 640, 600);
    ctx.fillText('PACK R', 840, 600);

    // Lights
    ctx.fillText('LANDING LTS', 160, 850);
    ctx.fillText('RUNWAY TURNOFF', 360, 850);
    ctx.fillText('TAXI', 520, 850);
    ctx.fillText('STROBE', 670, 850);
    ctx.fillText('BEACON', 790, 850);
    ctx.fillText('NAV / LOGO', 910, 850);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = this.maxAnisotropy;
    return texture;
  }

  /**
   * Mode Control Panel (MCP) Autopilot markings texture
   */
  public static createMcpPanelTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Background Boeing gray
    ctx.fillStyle = '#2b313a';
    ctx.fillRect(0, 0, 1024, 256);

    // Outer border
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, 1004, 236);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';

    // Capt F/D
    ctx.fillText('F/D', 65, 45);
    ctx.fillText('COURSE', 155, 45);
    ctx.fillText('IAS / MACH', 300, 45);
    ctx.fillText('HEADING', 512, 45);
    ctx.fillText('ALTITUDE', 720, 45);
    ctx.fillText('VERT SPEED', 890, 45);
    ctx.fillText('F/D', 975, 45);

    // Pushbutton legends
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('A/T ARM', 225, 205);
    ctx.fillText('N1', 275, 205);
    ctx.fillText('SPEED', 330, 205);
    ctx.fillText('VNAV', 390, 205);
    ctx.fillText('LNAV', 450, 205);
    ctx.fillText('HDG SEL', 512, 205);
    ctx.fillText('VOR LOC', 580, 205);
    ctx.fillText('APP', 640, 205);
    ctx.fillText('ALT HLD', 710, 205);
    ctx.fillText('V / S', 780, 205);

    ctx.fillText('CMD A', 860, 205);
    ctx.fillText('CWS A', 905, 205);
    ctx.fillText('CMD B', 955, 205);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = this.maxAnisotropy;
    return texture;
  }

  /**
   * Throttle Quadrant Flap Detents and Trim Wheel Scale texture
   */
  public static createPedestalLabelsTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#262b32';
    ctx.fillRect(0, 0, 512, 512);

    // Flap gate scale
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('FLAPS', 40, 40);

    const flapSteps = ['UP', '1', '2', '5', '10', '15', '25', '30', '40'];
    ctx.font = '15px "JetBrains Mono", monospace';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    flapSteps.forEach((label, idx) => {
      const y = 80 + idx * 44;
      ctx.fillText(label, 60, y + 5);
      ctx.beginPath();
      ctx.moveTo(30, y);
      ctx.lineTo(50, y);
      ctx.stroke();
    });

    // Speed brake markings
    ctx.textAlign = 'right';
    ctx.fillText('SPEED BRAKE', 480, 40);
    const spdSteps = ['DOWN', 'ARMED', 'FLT', 'UP'];
    spdSteps.forEach((label, idx) => {
      const y = 90 + idx * 70;
      ctx.fillText(label, 450, y + 5);
      ctx.beginPath();
      ctx.moveTo(460, y);
      ctx.lineTo(480, y);
      ctx.stroke();
    });

    // Trim wheel numbers in center
    ctx.textAlign = 'center';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('STAB TRIM', 256, 40);
    for (let u = 0; u <= 15; u += 2) {
      const y = 80 + (u / 15) * 380;
      ctx.fillText(`${u}`, 256, y + 5);
      ctx.beginPath();
      ctx.moveTo(220, y);
      ctx.lineTo(240, y);
      ctx.moveTo(272, y);
      ctx.lineTo(292, y);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = this.maxAnisotropy;
    return texture;
  }

  /**
   * Anti-slip floor metal grid pattern
   */
  public static createFloorTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#21262d';
    ctx.fillRect(0, 0, 256, 256);

    // Raised diamond treads
    ctx.strokeStyle = '#38424d';
    ctx.lineWidth = 2.5;

    for (let x = -256; x < 512; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 256, 256);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, 256);
      ctx.lineTo(x + 256, 0);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = this.maxAnisotropy;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }
}
