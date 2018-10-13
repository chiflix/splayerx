import THREE from 'three';

export default class Helper360 {
  constructor(canvas, video, options) {
    this.canvas = canvas;
    this.video = video;
    this.options = options;
    this.requestId = null;
  }

  createScene() {
    const { width, height, ratio } = this.options;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(75, ratio, 1, 1000);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
    this.updateSceneSize(width, height);

    this.texture = new THREE.VideoTexture(this.video);
    this.texture.minFilter = THREE.LinearFilter;

    this.material = new THREE.MeshBasicMaterial({ map: this.texture, side: THREE.DoubleSide });
    this.geometry = new THREE.SphereGeometry(5, 32, 32);
    this.sphere = new THREE.Mesh(this.geometry, this.material);

    this.sphere.scale.x = -1;
    this.scene.add(this.sphere);
  }

  updateCameraQuaternion(alpha, beta, gamma, orientation) {
    const zee = new THREE.Vector3(0, 0, 1);
    const euler = new THREE.Euler();
    const q0 = new THREE.Quaternion();
    const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
    euler.set(beta, alpha, -gamma, 'YXZ'); // 'ZXY' for the device, but 'YXZ' for us
    this.camera.quaternion.setFromEuler(euler); // orient the device
    this.camera.quaternion.multiply(q1); // camera looks out the back of the device, not the top
    this.camera.quaternion.multiply(q0.setFromAxisAngle(zee, -orientation)); // adjust orientation
  }

  updateOrientationScene(orientation, motion) {
    const radOrientation = THREE.Math.degToRad(orientation);
    const radAlpha = THREE.Math.degToRad(motion.alpha);
    const radBeta = THREE.Math.degToRad(motion.beta);
    const radGamma = THREE.Math.degToRad(motion.gamma);

    if (this.camera) {
      this.updateCameraQuaternion(radAlpha, radBeta, radGamma, radOrientation);
      // Render manually if the render loop is stopped
      if (!this.requestId) {
        this.renderer.render(this.scene, this.camera);
      }
    }
  }

  rotateScene(deltaX, deltaY) {
    if (this.sphere && !Number.isNaN(deltaX) && !Number.isNaN(deltaY)) {
      this.sphere.rotation.y += deltaX;
      this.sphere.rotation.x += deltaY;
      // Render manually if the render loop is stopped
      if (!this.requestId) {
        this.renderer.render(this.scene, this.camera);
      }
    }
  }

  updateSceneSize(width, height) {
    this.renderer.setSize(width, height, false);
  }

  renderLoop() {
    this.requestId = window.requestAnimationFrame(this.renderLoop.bind(this));
    this.renderer.render(this.scene, this.camera);
  }

  stopRenderLoop() {
    if (this.requestId) {
      window.cancelAnimationFrame(this.requestId);
      this.requestId = undefined;
    }
  }
}
