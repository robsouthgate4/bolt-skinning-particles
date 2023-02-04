import Base from "@webgl/Base";
import {
  Bolt,
  CameraPersp,
  Orbit,
  GLTFScene,
  FBO,
  RGBA,
  flattenFloatArray,
  NONE,
  BACK,
  FRONT,
  DrawSet,
  Mesh,
  Plane,
  Program,
  Texture2D,
  CLAMP_TO_EDGE,
  FLOAT,
  NEAREST,
  RGBA32f,
  LINEAR_MIPMAP_LINEAR,
  LINEAR,
} from "bolt-gl";

import AssetCache from "@/webgl/libs/asset-cache";

import CameraMain from "./globals/CameraMain";
import Controls from "./globals/Controls";
import assets from "./globals/assets";
import ParticlesDrawState from "./components/particles-draw";
import CharacterDrawState from "./components/character-draw";
import ParticlesSim from "./components/particles-sim";
import FloorDrawState from "./components/floor-draw";
import CompositionDrawState from "./components/composition-draw";
import BloomDrawState from "./components/bloom-draw";
import RefractionDrawState from "./components/refraction-draw";
import { mat4, quat, vec3 } from "gl-matrix";

import normalVert from "./programs/debug/shaders/vertexShader.glsl";
import normalFrag from "./programs/debug/shaders/fragmentShader.glsl";

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
  private _dataTexture: Texture2D;

  constructor() {
    super();
  }

  init() {

    this._gl = this._bolt.getContext();
    this._cameraMain = CameraMain.getInstance();
    this._controls = new Controls(this._cameraMain);

    this._bolt.setCamera(this._cameraMain);

    this._sceneFBO = new FBO({ width: 1, height: 1, format: RGBA, internalFormat: RGBA, depth: false });
    // this._refractionFBO = new FBO({ width: 1, height: 1, format: RGBA, internalFormat: RGBA, depth: false, samples: 0 });
    this._bloomSceneFBO = new FBO({ 
      width: 1, 
      height: 1, 
      format: RGBA, 
      internalFormat: RGBA,
      minFilter: LINEAR,
      magFilter: LINEAR,
      depth: false,  
    });

    this._particleSimulation = new ParticlesSim();
    // this._refractionDraw = new RefractionDrawState();
    this._floorDraw = new FloorDrawState();
    this._compositionDraw = new CompositionDrawState();
    this._particlesDraw = new ParticlesDrawState();

    this.initCharacter();
    this.resize();

  }

  private initCharacter() {

    const gltf = this._assetCache.get<GLTFScene>(
      assets.gltf.character
    );

    const gltfAnimations = gltf.loader.animations;
    this._characterDraw = new CharacterDrawState(gltf.scene, gltfAnimations, this._bolt);

    this._dataTexture = new Texture2D({
      width: 4, 
      height: 65, 
      wrapS: CLAMP_TO_EDGE, 
      wrapT: CLAMP_TO_EDGE, 
      internalFormat: RGBA32f, 
      format: RGBA, 
      type: FLOAT,
      generateMipmaps: false,
      minFilter: NEAREST,
      magFilter: NEAREST,
    });

    const data = new Float32Array(this._dataTexture.width * this._dataTexture.height * 4);

    for( let i = 0; i < this._dataTexture.width * this._dataTexture.height; i++ ) {

      data[i * 4 + 0] = Math.random();
      data[i * 4 + 1] = Math.random();
      data[i * 4 + 2] = Math.random();
      data[i * 4 + 3] = 1;

    }

    this._dataTexture.setFromData(data, this._dataTexture.width, this._dataTexture.height);
      
    this._characterDraw.uniformTextureCustom("mapData", this._dataTexture);

    this._initialised = true;
  }

  resize() {
    this._bolt.resizeCanvasToDisplay();
    this._sceneFBO.resize(this._gl.drawingBufferWidth, this._gl.drawingBufferHeight);
    this._bloomSceneFBO.resize(this._gl.drawingBufferWidth * 0.2, this._gl.drawingBufferHeight * 0.2);
    this._cameraMain.updateProjection(window.innerWidth / window.innerHeight);
  }

  earlyUpdate(elapsed: number, delta: number) {
    return;
  }

  update(elapsed: number, delta: number) {
    if (!this._initialised) return;

    this._controls.update();

    this._particleSimulation.update({ elapsed, delta });
    this._particleSimulation.positionProgram.activate();
    this._particleSimulation.positionProgram.setVector3("jointPositions", flattenFloatArray(this._characterDraw.jointPositions) );

    // render main scene texture
    {
      this._sceneFBO.bind();

      this._bolt.clear(0, 0, 0, 0);
      
      this._particlesDraw
        .uniformTexture("mapPosition", this._particleSimulation.getPositionTexture())
        .draw();

      this._characterDraw
        .uniformFloatCustom("mask", 1)
        .draw();

      this._sceneFBO.unbind();
    }

    // render final composition
    this._compositionDraw
      .uniformTexture("map", this._sceneFBO.targetTexture)
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
