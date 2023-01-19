import { Camera, Orbit } from "bolt-gl";

export default class Controls extends Orbit {
  constructor(camera: Camera) {
    super(camera, {
      zoomSpeed: 0.1,
      maxRadius: 10,
      minRadius: 2,
      rotateSpeed: 1,
      ease: 0.1,
      panSpeed: 0.1,
    });
  }
}
