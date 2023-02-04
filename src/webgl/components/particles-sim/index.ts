import { getRandomPointInSphere } from "@/webgl/utils";
import { Bolt, CLAMP_TO_EDGE, FBO, FBOSwapDefinition, FLOAT, HALF_FLOAT, LUMINANCE, NEAREST, Program, RGBA, RGBA16F, RGBA32f, Texture2D } from "bolt-gl";

import velocityFragmentShader from "./shaders/simulation/velocity.frag";
import positionFragmentShader from "./shaders/simulation/position.frag";
import FBOSim from "@/webgl/libs/fbo-sim";

const COUNT = 40000;

export default class ParticlesSim {

  private _fbosim: FBOSim;
  private _count: number;
  private _isIos: boolean;
  private _initData: Texture2D;
  private _bolt = Bolt.getInstance();
  private _velocityDefinition: FBOSwapDefinition;
  private _positionDefinition: FBOSwapDefinition
  private _velocityProgram: Program | undefined;
  private _positionProgram: Program | undefined;
  private _jointData: Texture2D;
  private _gl: WebGL2RenderingContext;

  constructor() {

    this._fbosim = new FBOSim(this._bolt, false);
    
    this._gl = this._bolt.getContext();

    const size = Math.floor(Math.sqrt(COUNT));

    this._count = size * size;

    // required for using float and half float textures
    this._isIos = /(iPad|iPhone|iPod)/g.test(window.navigator.userAgent);

    const posArray = new Float32Array(this._count * 4);

    for (let i = 0; i < this._count; i++) {
      const stride = i * 4;
      posArray[stride] = (Math.random() * 2 - 1) * 0.1;
      posArray[stride + 1] = (Math.random() * 2 - 1) * 0.12;
      posArray[stride + 2] = (Math.random() * 2 - 1) * 0.02 - 0.1;
      posArray[stride + 3] = 0.1 + Math.random() * 0.3;
    }

    this._initData = new Texture2D({
      width: size,
      height: size,
      internalFormat: RGBA32f,
      format: RGBA,
      type: FLOAT,
      minFilter: NEAREST,
      magFilter: NEAREST,
      generateMipmaps: false,
    });

    this._initData.setFromData(posArray, size, size);

    this._jointData = new Texture2D({
      width: size,
      height: size,
      internalFormat: this._gl.R32F,
      format: this._gl.RED,
      type: FLOAT,
      minFilter: NEAREST,
      magFilter: NEAREST,
      generateMipmaps: false,
    });

    const jointArray = new Float32Array(this._count * 1);

    for (let i = 0; i < this._count; i++) {
      const stride = i * 1;
      // create random int between 0 and 65
      const jointID = Math.floor(Math.random() * 63);
      jointArray[stride] = jointID;
    }

    this._jointData.setFromData(jointArray, size, size);

    const velocity = this.createDoubleFBO({
      size,
      name: "velocity",
    });

    const position = this.createDoubleFBO({
      size,
      name: "position",
    });

    this._velocityDefinition = {
      read: velocity.read,
      write: velocity.write,
      requiresSwap: true,
      shader: velocityFragmentShader,
      passName: "velocity",
    };

    this._positionDefinition = {
      read: position.read,
      write: position.write,
      requiresSwap: true,
      shader: positionFragmentShader,
      passName: "position",
      initialTexture: this._initData,
    };

    this._fbosim.bindFBOs([this._positionDefinition, this._velocityDefinition]);

    this._velocityProgram = this._fbosim.getProgram("velocity");
    this._velocityProgram.name = "velocity";

    if (this._velocityProgram) {
      this._velocityProgram.activate();
      this._velocityProgram.setFloat("time", 0);
    }

    this._positionProgram = this._fbosim.getProgram("position");
    this._positionProgram.name = "position";

    if (this._positionProgram) {
      this._positionProgram.activate();
      this._positionProgram.setFloat("globalSpeed", 1);
      this._positionProgram.setTexture("initPosition", this._initData);
      this._positionProgram.setTexture("jointData", this._jointData);
    }

  }

  update({ elapsed, delta }) {

    if (this._velocityProgram) {
      this._velocityProgram.activate();
      this._velocityProgram.setFloat("time", elapsed);
      this._velocityProgram.setFloat("delta", delta);
      this._velocityProgram.setTexture(
        "position",
        this._positionDefinition.read.targetTexture
      );
      this._velocityProgram.setTexture(
        "velocity",
        this._velocityDefinition.read.targetTexture
      );
    }

    if (this._positionProgram) {
      this._positionProgram.activate();
      this._positionProgram.setFloat("delta", delta);
      this._positionProgram.setFloat("time", elapsed);
      this._positionProgram.setTexture(
        "position",
        this._positionDefinition.read.targetTexture,
      );
      this._positionProgram.setTexture(
        "velocity",
        this._velocityDefinition.read.targetTexture,
      );
    }
    this._fbosim.compute();

  }

  public get positionProgram() {
    return this._positionProgram;
  }

  public get velocityProgram() {
    return this._velocityProgram;
  }

  public getPositionTexture() {
    return this._positionDefinition.read.targetTexture;
  }

  public getVelocityTexture() {
    return this._velocityDefinition.read.targetTexture;
  }

  private createFBO({ size = 1, name = "fbo" }) {
    return new FBO({
      width: size,
      height: size,
      depth: false,
      type: this._isIos ? HALF_FLOAT : FLOAT,
      internalFormat: this._isIos ? RGBA16F : RGBA32f,
      format: RGBA,
      name: name,
      minFilter: NEAREST,
      magFilter: NEAREST,
      wrapS: CLAMP_TO_EDGE,
      wrapT: CLAMP_TO_EDGE,
      generateMipmaps: false,
    });
  }

  private createDoubleFBO({ size = 1, name = "fbo" }) {
    const read = this.createFBO({ size, name: name + "1" });
    const write = this.createFBO({ size, name: name + "2" });
    return { read, write };
  }
}