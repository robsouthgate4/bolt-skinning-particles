import { Camera, Orbit } from "bolt-gl";

export default class Controls extends Orbit {
  constructor(camera: Camera) {
    super(camera, {
      zoomSpeed: 0.1,
      maxRadius: 10,
      minRadius: 0.5,
      rotateSpeed: 3,
      ease: 0.05,
      panSpeed: 0.1,
    });
  }
}
