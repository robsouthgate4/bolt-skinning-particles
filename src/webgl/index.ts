import Base from "@webgl/Base";
import {
  Bolt,
  CameraPersp,
  DrawSet,
  Node,
  Orbit,
  Texture2D,
  AssetCache,
  waitRAF,
} from "bolt-gl";

import BakedAnimation from "./libs/baked-animation";
import Floor from "@/webgl/drawSets/floor";
import PBRProgram from "./programs/pbr";
import CameraMain from "./globals/CameraMain";
import Controls from "./globals/Controls";
import assets from "./globals/assets";
import { GLTFScene } from "./libs/gltf-loader";
import Particles from "./components/particles";

export default class extends Base {
  private _canvas: HTMLCanvasElement;
  private _cameraMain: CameraPersp;
  private _bolt: Bolt;
  private _controls: Orbit;
  private _scene: Node;

  private _characterAnimation: BakedAnimation;
  private _cubeDS: DrawSet;
  private _floor: Floor;
  private _assetCache = AssetCache.getInstance();
  private _gl: WebGL2RenderingContext;
  private _animationsBound: boolean;
  private _particles: Particles;

  constructor() {
    super();
  }

  async init() {
    this._bolt = Bolt.getInstance();
    this._gl = this._bolt.getContext();

    this._cameraMain = CameraMain.getInstance();

    this._controls = new Controls(this._cameraMain);

    this._bolt.setViewPort(
      0,
      0,
      this._gl.drawingBufferWidth,
      this._gl.drawingBufferHeight
    );

    this._bolt.setCamera(this._cameraMain);
    this._bolt.enableDepth();

    this.initCharacter();
    this._floor = new Floor(20);
    this._particles = new Particles();
  }

  private initCharacter() {
    this._animationsBound = false;

    const gltfAssetCache = this._assetCache.get<GLTFScene>(
      assets.gltf.character
    );

    const gltfAnimations = gltfAssetCache.loader.animations;

    const radianceMap = this._assetCache.get<Texture2D>(assets.hdr.radiance);

    const irradianceMap = this._assetCache.get<Texture2D>(
      assets.hdr.irradiance
    );

    this._scene = gltfAssetCache.scene;

    this._scene.traverse((node: Node) => {
      if (node instanceof DrawSet) {
        const originalProg = node.program;
        const prog = new PBRProgram({
          mapEnvironment: radianceMap,
          mapIrradiance: irradianceMap,
        });
        node.program = prog;
        node.program.name = "pbr program";
        originalProg.delete();
      }
    });

    waitRAF().then(() => {
      this._characterAnimation = new BakedAnimation(gltfAnimations);
      this._characterAnimation.runAnimation("Armature|mixamo.com|Layer0");
      this._animationsBound = true;
    });
  }

  resize() {
    this._bolt.resizeCanvasToDisplay();
    this._cameraMain.updateProjection(window.innerWidth / window.innerHeight);
  }

  earlyUpdate(elapsed: number, delta: number) {
    return;
  }

  update(elapsed: number, delta: number) {
    if (!this._animationsBound) return;
    this._controls.update();
    this._bolt.setViewPort(
      0,
      0,
      this._gl.drawingBufferWidth,
      this._gl.drawingBufferHeight
    );
    this._bolt.clear(0.05, 0.05, 0.05, 0);

    this._characterAnimation.update(elapsed, delta);

    this._bolt.draw(this._scene);

    this._bolt.draw(this._floor);

    this._particles.render({ elapsed, delta });
    this._bolt.draw(this._particles);
  }

  lateUpdate(elapsed: number, delta: number) {
    return;
  }
}
