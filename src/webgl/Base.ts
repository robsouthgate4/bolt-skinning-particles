import Stats from "stats.js";

import { glSettings } from "@webgl/globals/constants";
import { Clock, EventListeners } from "bolt-gl";
import { GL_UPDATE_TOPIC } from "../common/events";

const { DEBUG_FPS } = glSettings;

export default abstract class Base {
  isRunning = false;
  requestFrame?: number;
  elapsed = 0;
  stats?: Stats;
  drawCallCount?: number;
  now: number;
  width: number;
  height: number;
  delta = 0;
  currentTime: number;
  lastTime: number;
  _eventListeners = EventListeners.getInstance();
  _clock = new Clock();

  constructor() {
    this.now = Date.now();

    this.delta = 0;
    (this.lastTime = new Date().getTime()),
      (this.currentTime = 0),
      (this.delta = 0);

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    if (DEBUG_FPS) {
      this.stats = new Stats();
      this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
      document.body.appendChild(this.stats.dom);
    }

    document.addEventListener("visibilitychange", () => {
      document.visibilityState === "visible" ? this.start() : this.pause();
    });
  }

  start() {
    this._clock.start();
    this.isRunning = true;
    this.run();
  }

  destroy() {
    if (this.requestFrame) {
      cancelAnimationFrame(this.requestFrame);
      this.requestFrame = undefined;
    }
  }

  pause() {
    if (this.requestFrame) {
      cancelAnimationFrame(this.requestFrame);
      this.requestFrame = undefined;
    }

    this.isRunning = false;
  }

  abstract earlyUpdate(elapsed: number, delta: number): void;

  abstract update(elapsed: number, delta: number): void;

  abstract lateUpdate(elapsed: number, delta: number): void;

  run() {
    const { DEBUG_FPS } = glSettings;

    if (DEBUG_FPS) this.stats?.begin();

    this.delta = this._clock.getDelta();
    this.elapsed = this._clock.getElapsedTime();

    this.earlyUpdate(this.elapsed, this.delta);
    this.update(this.elapsed, this.delta);
    this.lateUpdate(this.elapsed, this.delta);

    this._eventListeners.publish(GL_UPDATE_TOPIC, {
      elapsed: this.elapsed,
      delta: this.delta,
    });

    if (DEBUG_FPS) this.stats?.end();

    if (this.isRunning) {
      this.requestFrame = requestAnimationFrame(this.run.bind(this));
    }
  }
}
