import { CameraPersp } from "bolt-gl";
import { vec3 } from "gl-matrix";

import { Bolt } from "bolt-gl";

export default class CameraMain extends CameraPersp {
  static _instance: CameraMain;

  constructor() {
    const gl = Bolt.getInstance().getContext();

    super({
      aspect: gl.drawingBufferWidth / gl.drawingBufferHeight,
      fov: 45,
      near: 0.1,
      far: 1000,
      position: vec3.fromValues(3, 0.5, 2),
      target: vec3.fromValues(0, 1, 0),
    });
  }

  public static getInstance() {
    if (!CameraMain._instance) CameraMain._instance = new this();
    return CameraMain._instance;
  }
}
