import App from "@/webgl/";
import { Bolt, EventListeners, AssetCache, GL_RESIZE_TOPIC } from "bolt-gl";
import assets from "@/webgl/globals/assets";
export default class Main {
  private _eventListeners = EventListeners.getInstance();
  private _app: App;
  private _assetCache = AssetCache.getInstance();
  private _bolt: Bolt;
  private _width: number;
  private _height: number;
  private _canvas: HTMLCanvasElement;

  _resize() {
    this._app.resize();
  }

  async load() {
    this._width = window.innerWidth;
    this._height = window.innerHeight;

    this._canvas = <HTMLCanvasElement>document.getElementById("experience");
    this._canvas.width = this._width;
    this._canvas.height = this._height;

    this._eventListeners.setBoundElement(this._canvas);
    this._eventListeners.listen(GL_RESIZE_TOPIC, this._resize.bind(this));
    
    this._bolt = Bolt.getInstance();

    this._bolt.init(this._canvas, {
      antialias: false,
      dpi: Math.min(1, window.devicePixelRatio),
      powerPreference: "high-performance",
      alpha: true,
      preserveDrawingBuffer: false,
      stencil: false,
    });

    this._assetCache.init(assets);

    await this._assetCache.load(10);

    this._app = new App();
    this._app.init();
    this._app.start();
    
  }
}
