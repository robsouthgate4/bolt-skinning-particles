import Base from "@webgl/Base";
import {
  AssetCache,
  Bolt,
  CameraPersp,
  Cube,
  DrawSet,
  EventListeners,
  GLTFScene,
  LINEAR,
  Mesh,
  Node,
  Orbit,
  Program,
  REPEAT,
  Texture2D,
} from "bolt-gl";

import { mat4, quat, vec3 } from "gl-matrix";
import BakedAnimation from "./libs/baked-animation";
import Floor from "@/webgl/drawSets/floor";

import normalVertexShder from "./programs/normal/shaders/vertexShader.glsl";
import normalFragmentShader from "./programs/normal/shaders/fragmentShader.glsl";
import PBRProgram from "./programs/pbr";
import CameraMain from "./globals/CameraMain";
import Controls from "./globals/Controls";
import assets from "./globals/assets";

export default class extends Base {
  private _canvas: HTMLCanvasElement;
  private _cameraMain: CameraPersp;
  private _bolt: Bolt;
  private _controls: Orbit;
  private _config: never;
  private _scene: Node;

  private _characterAnimation: BakedAnimation;
  private _cubeDS: DrawSet;
  private _testJoint: Node;
  private _cubeDS2: DrawSet;
  private _floor: Floor;
  private _assetCache = AssetCache.getInstance();
  private _gl: WebGL2RenderingContext;
  private _gltf: GLTFScene;

  constructor() {
    super();
  }

  init() {
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

    this._floor = new Floor(20);

    this._gltf = this._assetCache.get<GLTFScene>(assets.gltf.character);

    const radianceMap = this._assetCache.get<Texture2D>(assets.hdr.radiance);
    const irradianceMap = this._assetCache.get<Texture2D>(
      assets.hdr.irradiance
    );

    console.log(radianceMap);

    //console.log(this._gltf);

    this._scene = this._gltf.scene;

    console.log(this._scene);

    this._scene.traverse((node: Node) => {
      if (node instanceof DrawSet) {
        const prog = new PBRProgram({
          mapEnvironment: radianceMap,
          mapIrradiance: irradianceMap,
        });
        node.program = prog;
        node.program.name = "pbr program";
      }
      if (node.isJoint) {
        if (node.name === "mixamorig:LeftFoot") {
          this._testJoint = node;
          console.log(this._testJoint);
        }
      }
    });
    const cubeGeo = new Cube();
    const cubeProg = new Program(normalVertexShder, normalFragmentShader);

    this._cubeDS = new DrawSet(new Mesh(cubeGeo), cubeProg);
    this._cubeDS.transform.scale = vec3.fromValues(0.2, 0.2, 0.2);

    const gltfAnimations = this._gltf.animations;
    console.log(gltfAnimations);
    this._characterAnimation = new BakedAnimation(gltfAnimations);
    this._characterAnimation.runAnimation("Armature|mixamo.com|Layer0");
  }

  resize() {
    this._bolt.resizeCanvasToDisplay();
    this._cameraMain.updateProjection(window.innerWidth / window.innerHeight);
  }

  earlyUpdate(elapsed: number, delta: number) {
    return;
  }

  update(elapsed: number, delta: number) {
    this._controls.update();
    this._bolt.setViewPort(
      0,
      0,
      this._gl.drawingBufferWidth,
      this._gl.drawingBufferHeight
    );
    this._bolt.clear(0.05, 0.05, 0.05, 0);

    //this._characterAnimation.update(elapsed, delta);

    // const position = vec3.create();
    // mat4.getTranslation(position, this._testJoint.modelMatrix);

    // const rotation = quat.create();
    // mat4.getRotation(rotation, this._testJoint.modelMatrix);

    // this._cubeDS.transform.position = position;
    // this._cubeDS.transform.quaternion = rotation;

    this._bolt.draw(this._scene);
    this._bolt.draw(this._floor);
  }

  lateUpdate(elapsed: number, delta: number) {
    return;
  }
}
