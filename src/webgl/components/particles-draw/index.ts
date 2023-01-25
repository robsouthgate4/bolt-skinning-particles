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
  EventListeners,
  GL_RESIZE_TOPIC,
} from "bolt-gl";

import particlesVertexShader from "./shaders/particles/particles.vert";
import particlesFragmentShader from "./shaders/particles/particles.frag";
const COUNT = 1000;

export default class ParticlesDrawState extends DrawState {

  private _eventListeners = EventListeners.getInstance();
  private _gl: WebGL2RenderingContext;
  private _bloomFBO: FBO;

  constructor() {

    const bolt = Bolt.getInstance();    
    
    super(bolt);

    this._gl = bolt.getContext();
    
    const particleMesh = this.createMesh();

    const particleDrawProgram = new Program(
      particlesVertexShader,
      particlesFragmentShader
    );

    particleDrawProgram.name = "ParticlesDrawState";
    
    this.setDrawSet(new DrawSet(particleMesh, particleDrawProgram))

  }

  private createMesh(): Mesh {
    const positions: number[] = [];
    const references: number[] = [];
    const randoms: number[] = [];
    const scales: number[] = [];

    const size = Math.floor(Math.sqrt(COUNT));

    const count = size * size;

    for (let i = 0; i < count; i++) {
      const pos = getRandomPointInSphere(1);

      positions.push(0,0,0);
      randoms.push(Math.random());

      // get random scales with weight towards smaller values
      const scale = Math.pow(Math.random(), 2.0) * 0.5 + 0.5;
      scales.push(scale);

      const referenceX = (i % size) / size;
      const referenceY = Math.floor(i / size) / size;
      references.push(referenceX, referenceY);
    }

    const pointMesh = new Mesh({
      positions,
    }).setDrawType(POINTS);

    pointMesh.setAttribute(new Float32Array(references), 2, 4);
    pointMesh.setAttribute(new Float32Array(randoms), 1, 3);
    pointMesh.setAttribute(new Float32Array(scales), 1, 5);

    return pointMesh;
  }
}
