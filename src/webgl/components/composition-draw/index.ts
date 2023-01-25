import { getRandomPointInSphere } from "../../utils";
import {
  Bolt,
  DrawSet,
  Mesh,
  Program,
  DrawState,
  GL_RESIZE_TOPIC,
  EventListeners,
} from "bolt-gl";

import vertexShader from "./shaders/vertexShader.glsl";
import fragmentShader from "./shaders/fragmentShader.glsl";


export default class CompositionDrawState extends DrawState {

  constructor() {

    const bolt = Bolt.getInstance();    
    
    super(bolt);
    
    const triangleMesh = this.createMesh();

    const program = new Program(
      vertexShader,
      fragmentShader
    );

    program.transparent = true;

    program.name = "CompositionDrawState";
    
    this.setDrawSet(new DrawSet(triangleMesh, program))

  }

  private createMesh(): Mesh {
    const triangleVertices = [-1, -1, 0, -1, 4, 0, 4, -1, 0];

    const triangleIndices = [2, 1, 0];

    const mesh = new Mesh({
      positions: triangleVertices,
      indices: triangleIndices,
    });

    return mesh;
  }
}
