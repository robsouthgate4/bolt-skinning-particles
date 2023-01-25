import Base from "@webgl/Base";
import {
  Bolt,
  CameraPersp,
  Orbit,
  AssetCache,
  GLTFScene,
  FBO,
  RGBA,
} from "bolt-gl";


import CameraMain from "./globals/CameraMain";
import Controls from "./globals/Controls";
import assets from "./globals/assets";
import ParticlesDrawState from "./components/particles-draw";
import CharacterDrawState from "./components/character-draw";
import ParticlesSim from "./components/particles-sim";
import FloorDrawState from "./components/floor-draw";
import CompositionDrawState from "./components/composition-draw";
import BloomDrawState from "./components/bloom-draw";

export default class extends Base {
  private _cameraMain: CameraPersp;
  private _bolt = Bolt.getInstance();
  private _controls: Orbit;
  private _assetCache = AssetCache.getInstance();
  private _gl: WebGL2RenderingContext;
  private _initialised: boolean;
  private _characterDraw: CharacterDrawState;
  private _particleSimulation: ParticlesSim;
  private _particlesDraw: ParticlesDrawState;
  private _floorDraw: FloorDrawState;
  private _sceneFBO: FBO;
  private _compositionDraw: CompositionDrawState;
  private _bloomSceneFBO: any;
  private _maskFBO: FBO;
  private _bloomDraw: BloomDrawState;
  private _bloomRenderFBO: FBO;

  constructor() {
    super();
  }

  init() {
    this._gl = this._bolt.getContext();

    this._cameraMain = CameraMain.getInstance();

    this._controls = new Controls(this._cameraMain);

    this._bolt.setCamera(this._cameraMain);

    this._sceneFBO = new FBO({ width: 1, height: 1, format: RGBA, internalFormat: RGBA, depth: true, samples: 4  });
    this._bloomSceneFBO = new FBO({ width: 1, height: 1, format: RGBA, internalFormat: RGBA, depth: true, samples: 4 });
    this._bloomRenderFBO = new FBO({ width: 1, height: 1, format: RGBA, internalFormat: RGBA, depth: true, samples: 4 });
    this._maskFBO = new FBO({ width: 1, height: 1, format: RGBA, internalFormat: RGBA, depth: true });

    this._particleSimulation = new ParticlesSim();
    this._floorDraw = new FloorDrawState();
    this._compositionDraw = new CompositionDrawState();
    this._particlesDraw = new ParticlesDrawState();
    this._bloomDraw = new BloomDrawState();

    this.initCharacter();
    this.resize();

  }

  private initCharacter() {

    const gltf = this._assetCache.get<GLTFScene>(
      assets.gltf.character
    );

    const gltfAnimations = gltf.loader.animations;
    this._characterDraw = new CharacterDrawState(gltf.scene, gltfAnimations, this._bolt)

    this._initialised = true;
  }

  resize() {
    this._bolt.resizeCanvasToDisplay();
    this._sceneFBO.resize(this._gl.drawingBufferWidth, this._gl.drawingBufferHeight);
    this._maskFBO.resize(this._gl.drawingBufferWidth, this._gl.drawingBufferHeight);
    this._bloomSceneFBO.resize(this._gl.drawingBufferWidth, this._gl.drawingBufferHeight);
    this._bloomRenderFBO.resize(this._gl.drawingBufferWidth, this._gl.drawingBufferHeight);
    this._cameraMain.updateProjection(window.innerWidth / window.innerHeight);
  }

  earlyUpdate(elapsed: number, delta: number) {
    return;
  }

  update(elapsed: number, delta: number) {
    if (!this._initialised) return;
    this._controls.update();

    this._particleSimulation.update({ elapsed, delta });

    {
      this._sceneFBO.bind();

      this._bolt.setViewPort(0, 0, this._gl.drawingBufferWidth, this._gl.drawingBufferHeight);

      this._particlesDraw
        .clear(0, 0, 0, 0)
        .uniformTexture("mapPosition", this._particleSimulation.getPositionTexture())
        .draw();

      this._characterDraw
        .uniformFloatCustom("mask", 0)
        .draw();

      this._sceneFBO.unbind();
    }

    {

      this._bloomSceneFBO.bind();
      this._particlesDraw
        .clear(0, 0, 0, 0)
        .uniformTexture("mapPosition", this._particleSimulation.getPositionTexture())
        .draw();

      this._characterDraw
        .uniformFloatCustom("mask", 1)
        .draw();
      this._bloomSceneFBO.unbind();

      this._bloomRenderFBO.bind();
      this._bloomDraw
        .uniformTexture("map", this._bloomSceneFBO.targetTexture)
        .draw();
      this._bloomRenderFBO.unbind();
    }

    this._compositionDraw
      .uniformTexture("map", this._sceneFBO.targetTexture)
      .uniformTexture("mapBloom", this._bloomSceneFBO.targetTexture)
      .draw();

    this._characterDraw.update({ elapsed, delta });

  }

  start(): void {
    super.start();
  }

  lateUpdate(elapsed: number, delta: number) {
    return;
  }
}
