import { getRandomPointInSphere } from "../../utils";
import {
  Bolt,
  DrawSet,
  Mesh,
  POINTS,
  Program,
  DrawState,
} from "bolt-gl";

import particlesVertexShader from "./shaders/particles/particles.vert";
import particlesFragmentShader from "./shaders/particles/particles.frag";

const COUNT = 40000;

export default class ParticlesDrawState extends DrawState {

  constructor() {

    const bolt = Bolt.getInstance();    
    
    super(bolt);
    
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
    const jointIDs: number[] = [];

    const size = Math.floor(Math.sqrt(COUNT));

    const count = size * size;

    for (let i = 0; i < count; i++) {
      const pos = getRandomPointInSphere(1);

      positions.push(0,0,0);

      //positions.push(pos[0], pos[1] + 1, pos[2]);
      randoms.push(Math.random());

      // get random scales with weight towards smaller values
      const scale = Math.pow(Math.random(), 2.0) * 0.5 + 0.5;
      scales.push(scale);

      // get random joint ID to attach particles to
      const jointID = Math.floor(Math.random() * 14);
      jointIDs.push(jointID);

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
    pointMesh.setAttribute(new Float32Array(jointIDs), 1, 6);
    return pointMesh;
  }
}
