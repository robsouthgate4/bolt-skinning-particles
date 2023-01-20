import { getRandomPointInSphere } from "../../utils";
import {
  Bolt,
  CLAMP_TO_EDGE,
  DrawSet,
  FBO,
  FLOAT,
  HALF_FLOAT,
  Mesh,
  NEAREST,
  POINTS,
  Program,
  RGBA,
  RGBA16F,
  RGBA32f,
  Texture2D,
  FBOSim,
  DrawState,
  FBOSwapDefinition,
} from "bolt-gl";

import velocityFragmentShader from "./shaders/simulation/velocity.frag";
import positionFragmentShader from "./shaders/simulation/position.frag";

import particlesVertexShader from "./shaders/particles/particles.vert";
import particlesFragmentShader from "./shaders/particles/particles.frag";

const COUNT = 10000;

export default class Particles extends DrawSet {
  private _particleDrawState!: DrawState;
  private _bolt = Bolt.getInstance();
  private _turbulence = 1;
  private _fbosim!: FBOSim;
  private _velocityProgram: Program | undefined;
  private _positionProgram: Program | undefined;
  private _velocityDefiniton: FBOSwapDefinition;
  private _positionDefiniton: FBOSwapDefinition;
  private _count!: number;
  private _initPosition!: Texture2D;
  private _isIos!: boolean;
  private _particleSettings: {
    particleScale: number;
  };
  private _particleDrawSet: DrawSet;
  constructor() {
    const positions: number[] = [];
    const references: number[] = [];
    const randoms: number[] = [];
    const scales: number[] = [];

    const size = Math.floor(Math.sqrt(COUNT));

    const count = size * size;

    for (let i = 0; i < count; i++) {
      const pos = getRandomPointInSphere(1);

      positions.push(pos[0], pos[1] + 1, pos[2]);
      randoms.push(Math.random());

      // get random scales with weight towards smaller values
      const scale = Math.pow(Math.random(), 2.0) * 0.5 + 0.5;
      scales.push(scale);

      const referenceX = (i % size) / size;
      const referenceY = Math.floor(i / size) / size;
      references.push(referenceX, referenceY);
    }

    const particleDrawProgram = new Program(
      particlesVertexShader,
      particlesFragmentShader
    );

    const pointMesh = new Mesh({
      positions,
    }).setDrawType(POINTS);

    pointMesh.setAttribute(new Float32Array(references), 2, 4);
    pointMesh.setAttribute(new Float32Array(randoms), 1, 3);
    pointMesh.setAttribute(new Float32Array(scales), 1, 5);

    super(pointMesh, particleDrawProgram);

    this._particleSettings = {
      particleScale: 1,
    };

    this.initSimulation();
  }

  initSimulation() {
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
      posArray[stride + 1] = pos[1];
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

    const velocity = this._createDoubleFBO({
      size,
      name: "velocity",
    });

    const position = this._createDoubleFBO({
      size,
      name: "position",
    });

    this._velocityDefiniton = {
      read: velocity.read,
      write: velocity.write,
      requiresSwap: true,
      shader: velocityFragmentShader,
      passName: "velocity",
    };

    this._positionDefiniton = {
      read: position.read,
      write: position.write,
      requiresSwap: true,
      shader: positionFragmentShader,
      passName: "position",
      initialTexture: this._initPosition,
    };

    this._fbosim.bindFBOs([this._positionDefiniton, this._velocityDefiniton]);

    this._velocityProgram = this._fbosim.getProgram("velocity");

    if (this._velocityProgram) {
      this._velocityProgram.activate();
      this._velocityProgram.setFloat("time", 0);
    }

    this._positionProgram = this._fbosim.getProgram("position");

    if (this._positionProgram) {
      this._positionProgram.activate();
      this._positionProgram.setFloat("globalSpeed", 1);
    }

    this.initGUI();
    this.initListeners();
  }

  private initListeners() {
    return;
  }

  private initGUI() {
    // this._gui = GlobalGui.getInstance();
    // this._gui
    //   .add(this._particleSettings, "particleScale", 1, 6, 0.001)
    //   .name("particle Scale")
    //   .onChange((value: number) => {
    //     this._particleDrawState.uniformFloat("particleScale", value);
    //   });
  }

  render({ elapsed, delta }: { elapsed: number; delta: number }) {
    if (this._velocityProgram) {
      this._velocityProgram.activate();
      this._velocityProgram.setFloat("time", elapsed);
      this._velocityProgram.setFloat("delta", delta);
      this._velocityProgram.setTexture(
        "position",
        this._positionDefiniton.read.targetTexture,
        0
      );
      this._positionDefiniton.read.targetTexture.bind(0);
      this._velocityProgram.setTexture(
        "velocity",
        this._velocityDefiniton.read.targetTexture,
        1
      );
      this._positionDefiniton.read.targetTexture.bind(1);
    }

    if (this._positionProgram) {
      this._positionProgram.activate();
      this._positionProgram.setFloat("delta", delta);
      this._positionProgram.setFloat("time", elapsed);
      this._positionProgram.setTexture(
        "position",
        this._positionDefiniton.read.targetTexture,
        0
      );
      this._positionDefiniton.read.targetTexture.bind(0);

      this._positionProgram.setTexture(
        "velocity",
        this._velocityDefiniton.read.targetTexture,
        1
      );

      this._velocityDefiniton.read.targetTexture.bind(1);
    }

    this._fbosim.compute();
  }

  public get particleDrawState(): DrawState {
    return this._particleDrawState;
  }

  _createFBO({ size = 1, name = "fbo" }) {
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

  _createDoubleFBO({ size = 1, name = "fbo" }) {
    const read = this._createFBO({ size, name: name + "1" });
    const write = this._createFBO({ size, name: name + "2" });
    return { read, write };
  }
}
