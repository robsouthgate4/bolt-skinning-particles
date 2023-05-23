import Base from "./Base";

import CameraMain from "../globals/CameraMain";
import Controls from "../globals/Controls";
import { BoltWGPU, Bolt, ComputeBuffer, ComputeProgram, DracoLoader, DrawSet, Mesh, Program, Node, Cube, TopologyWGPU } from "bolt-wgpu";

import shader from "./shaders/webgpu/shader.wgsl";
import vertexShader from "./shaders/webgl/vertex.glsl";
import fragmentShader from "./shaders/webgl/fragment.glsl";

import { vec3, vec4 } from "gl-matrix";

export default class extends Base {
  
  constructor() {
    super();
  }

  async init() {

    this._bolt = BoltWGPU.getInstance();

    this.scene = new Node();

    const renderProgram = new Program(
      this._bolt,
      {
        topology: TopologyWGPU.TRIANGLES,
        shaderSrc: shader.module.code,
        uniforms: {
          "UniformData": {
            bindGroupID: 0,
            values: {
              color1: vec4.fromValues(1, 0, 0, 1),
              color2: vec4.fromValues(0, 1, 0, 1),
              color3: vec4.fromValues(0, 0, 1, 1),
            }            
          },
        }
      }
    );
    const dracoLoader = new DracoLoader(this._bolt);
    const geo = await dracoLoader.load("static/models/draco/car.drc");


    const positions = [];
    const indices = [];
    const radius = 0.5;
    const height = 1.0;
    const segments = 32;
    const normals = [];

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * 2.0 * Math.PI;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);

      // Top vertex
      positions.push(x, y, height / 2.0);
      normals.push(x, y, 0.0);

      // Bottom vertex
      positions.push(x, y, -height / 2.0);
      normals.push(x, y, 0.0);

      // Indices for top and bottom vertices
      if (i < segments) {
        indices.push(i * 2, i * 2 + 1, (i + 1) * 2);
        indices.push(i * 2 + 1, (i + 1) * 2 + 1, (i + 1) * 2);
      }

    }

    this._mesh = new Mesh(
      this._bolt,
      {
        positions,
        indices,
        normals
      }
    );
    
    this._obj = new DrawSet(this._mesh, renderProgram);

    this.scene.addChild(this._obj);
    
    this._cameraMain = CameraMain.getInstance();
    this._controls = new Controls(this._cameraMain);
    this._bolt.setCamera(this._cameraMain);
    
    this.start();
    this._ready = true;

  }

  async wait(time) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }

  resize() {
    this._bolt.resizeCanvasToDisplay();
    this._cameraMain.updateProjection(window.innerWidth / window.innerHeight);
  }

  earlyUpdate(elapsed, delta) {
    return;
  }

  update(elapsed, delta) {

    this._controls.update();

    // const color1 = vec4.fromValues(Math.sin(elapsed * 3) * 0.5 + 0.5, 0, 0, 1);
    // const color2 = vec4.fromValues(0, Math.sin(elapsed * 3) * 0.5 + 0.5, 0, 1);

    // this._obj.transform.rotateY(delta * 0.5);
    // this._obj2.transform.rotateY(-delta * 0.5);

    //this._obj.program.setVector4("color1", color1, "UniformData");
    // this._obj.program.setVector4("color2", color2 ,"UniformData");
    // this._obj.program.setVector4("color", color1, "LightData");

    // this._obj2.program.setVector4("color1", color1, "UniformData");
    // this._obj2.program.setVector4("color2", color2 ,"UniformData");
    // this._obj2.program.setVector4("color", color1, "LightData");

    this._bolt.draw(this.scene);

  }

  lateUpdate(elapsed, delta) {
    return;
  }
}
