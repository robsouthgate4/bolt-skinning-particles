import { Bolt, EventListeners, Program, Texture2D } from "bolt-gl";

import vertexShader from "./shaders/vertexShader.glsl";
import fragmentShader from "./shaders/fragmentShader.glsl";
import { GL_UPDATE_TOPIC } from "@/common/events";
import { vec2, vec3, vec4 } from "gl-matrix";
export default class PBRProgram extends Program {
  bolt = Bolt.getInstance();
  eventListeners = EventListeners.getInstance();
  mapEnvironment: Texture2D;
  mapIrradiance: Texture2D;

  constructor({
    mapAlbedo,
    mapNormal,
    mapMetallic,
    mapRoughness,
    mapAO,
    mapEnvironment,
    mapIrradiance,
    albedoColor = vec4.fromValues(1, 1, 1, 1),
    skinning = false,
  }: {
    mapAlbedo?: Texture2D;
    mapNormal?: Texture2D;
    mapMetallic?: Texture2D;
    mapRoughness?: Texture2D;
    mapAO?: Texture2D;
    mapEnvironment?: Texture2D;
    mapIrradiance?: Texture2D;
    albedoColor?: vec4;
    skinning?: boolean;
  } = {}) {
    const flags = [];

    
    flags.push("#version 300 es");
    // flags.push("#define USE_ALBEDO_MAP");
    // flags.push("#define USE_ROUGHNESS_MAP");
    // flags.push("#define USE_AO_MAP");
    // flags.push("#define USE_METALNESS_MAP");
    // flags.push("#define USE_NORMAL_MAP");
    
    const definesString = flags.join("\n") + "\n";
    
    super(vertexShader, definesString + fragmentShader);
    
    
    this.activate();
    
    this.setFloat("metalness", 1);
    this.setFloat("roughness", 0);
    this.setFloat("specular", 1);
    this.setFloat("exposure", 1);
    this.setFloat("normalHeight", 0);
    this.setFloat("gamma", 2.2);
    
    this.setVector3("albedoColor", vec3.fromValues(0.3, 0.0, 0.8));
    this.setVector2("normalUVScale", vec2.fromValues(1, 1));
    
    this.eventListeners.listen(GL_UPDATE_TOPIC, this.render.bind(this));
  }

  render() {
    this.activate();
    this.setVector2("resolution", vec2.fromValues(this._gl.drawingBufferWidth, this._gl.drawingBufferHeight));
    this.setVector3("cameraPosition", this.bolt.camera.transform.position);
  }
}
