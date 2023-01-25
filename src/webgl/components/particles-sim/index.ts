import { getRandomPointInSphere } from "@/webgl/utils";
import { Bolt, CLAMP_TO_EDGE, FBO, FBOSim, FBOSwapDefinition, FLOAT, HALF_FLOAT, NEAREST, Program, RGBA, RGBA16F, RGBA32f, Texture2D } from "bolt-gl";

import velocityFragmentShader from "./shaders/simulation/velocity.frag";
import positionFragmentShader from "./shaders/simulation/position.frag";

const COUNT = 1000;

export default class ParticlesSim {

  private _fbosim: FBOSim;
  private _count: number;
  private _isIos: boolean;
  private _initPosition: Texture2D;
  private _bolt = Bolt.getInstance();
  private _velocityDefinition: FBOSwapDefinition;
  private _positionDefinition: FBOSwapDefinition
  private _velocityProgram: Program | undefined;
  private _positionProgram: Program | undefined;

  constructor() {

    this._fbosim = new FBOSim(this._bolt, false);

    const size = Math.floor(Math.sqrt(COUNT));

    this._count = size * size;

    // required for using float and half float textures
    this._isIos = /(iPad|iPhone|iPod)/g.test(window.navigator.userAgent);

    const posArray = new Float32Array(this._count * 4);

    for (let i = 0; i < this._count; i++) {
      const pos = getRandomPointInSphere(1);
      const stride = i * 4;
      posArray[stride] = pos[0];
      posArray[stride + 1] = pos[1] + 1;
      posArray[stride + 2] = pos[2];
      posArray[stride + 3] = 0;
    }

    this._initPosition = new Texture2D({
      width: size,
      height: size,
      internalFormat: RGBA32f,
      format: RGBA,
      type: FLOAT,
      minFilter: NEAREST,
      magFilter: NEAREST,
      generateMipmaps: false,
    });

    this._initPosition.setFromData(posArray, size, size);

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
      initialTexture: this._initPosition,
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