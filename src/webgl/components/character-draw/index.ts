import { GL_UPDATE_TOPIC } from "@/common/events";
import assets from "@/webgl/globals/assets";
import { GL_POST_BEGIN } from "@/webgl/globals/events";
import BakedAnimation from "@/webgl/libs/baked-animation";
import PBRProgram from "@/webgl/programs/pbr";
import { AssetCache, Bolt, Channel, CLAMP_TO_EDGE, DrawSet, DrawState, EventListeners, Mesh, Node, Program, REPEAT, SkinMesh, Sphere, Texture, Texture2D, TextureSampler, waitRAF } from "bolt-gl";

export default class CharacterDrawState extends DrawState {
    private _animation: BakedAnimation;
    private _animationsBound = false;
    private _radianceMap: Texture2D;
    private _irradianceMap: Texture2D;
    private _prog: PBRProgram;

    constructor(scene: Node, animations: Channel, bolt: Bolt) {

        super(bolt);

        const assetCache = AssetCache.getInstance();

        this._radianceMap = assetCache.get<Texture2D>(assets.hdr.radiance);
        
        this._irradianceMap = assetCache.get<Texture2D>(
            assets.hdr.irradiance
        );

        this._prog = new PBRProgram();

        scene.traverse((node: Node) => {
            if (node instanceof DrawSet) {
                const originalProg = node.program;
                if(node.mesh.isSkinMesh) {
                    const mesh = node.mesh as SkinMesh;
                    this._prog.activate();
                    this._prog.setTexture("jointTexture", mesh.skin.jointTexture);
                    this._prog.setTexture("mapEnvironment", this._radianceMap);
                    this._prog.setTexture("mapIrradiance", this._irradianceMap);
                    node.program = this._prog;
                    node.program.name = "pbr program";
                    originalProg.delete();
                }
            }
        });
        
        this.setNode(scene);

        this._animation = new BakedAnimation(animations);
        this._animation.runAnimation("Armature|mixamo.com|Layer0");
        this._animationsBound = true;

    }

    public uniformFloatCustom(uniform: string, value: number) {
        this._prog.activate();
        this._prog.setFloat(uniform, value);
        return this;
    }

    public update(data: { elapsed: number, delta: number }) {
        if (!this._animationsBound) return;
        const { elapsed, delta } = data;
        this._animation.update(elapsed, delta);
    }

}