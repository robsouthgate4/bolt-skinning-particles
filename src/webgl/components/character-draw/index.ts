import assets from "@/webgl/globals/assets";
import BakedAnimation from "@/webgl/libs/baked-animation";
import PBRProgram from "@/webgl/programs/pbr";
import { Bolt, Channel, DrawSet, DrawState,  Mesh,  Node, SkinMesh, Sphere, Texture, Texture2D, TextureCube } from "bolt-gl";
import { mat4, quat, vec3 } from "gl-matrix";

import AssetCache from "@/webgl/libs/asset-cache";

export default class CharacterDrawState extends DrawState {
    private _animation: BakedAnimation;
    private _animationsBound = false;
    private _radianceMap: Texture2D;
    private _irradianceMap: Texture2D;
    private _prog: PBRProgram;
    private _joints: Node[] = [];
    private _scene: Node;
    private _programs: PBRProgram[] = [];
    private _nextPosition = vec3.create();
    private _lastPosition = vec3.create();
    private _direction = vec3.create();
    private _rootNode: Node;

    constructor(scene: Node, animations: Channel, bolt: Bolt) {

        super(bolt);

        const assetCache = AssetCache.getInstance();

        this._radianceMap = assetCache.get<Texture2D>(assets.hdr.radiance);
        
        this._irradianceMap = assetCache.get<Texture2D>(
            assets.hdr.irradiance
        );

        this._scene = scene;

        const program = new PBRProgram();
        
        this._scene.traverse((node: Node) => {
            if (node instanceof DrawSet) {

                if(node.mesh.isSkinMesh) {
                    const originalProgram = node.program;
                    this._programs.push(program);
                    node.program = program;
                    
                    node.program.name = "pbr program";
                    originalProgram.delete();
                }
                
            }
            if(node.isJoint && !node.name.includes("Head")) {
                this._joints.push(node);
            }
        });

        this._rootNode = new Node();
        this._scene.setParent(this._rootNode);

        this._scene.transform.rotationZ = -10;
        this.setNode(this._rootNode);
        
        this._animation = new BakedAnimation(animations);
        this._animation.runAnimation("Armature|mixamo.com|Layer0");
        this._animationsBound = true;

        this.uniformTextureCustom("mapEnvironment", this._radianceMap);
        this.uniformTextureCustom("mapIrradiance", this._irradianceMap);

    }

    public uniformFloatCustom(uniform: string, value: number) {
        
        this._programs.forEach((prog) => {
            prog.activate();
            prog.setFloat(uniform, value);
        });

        return this;
    }

    public uniformTextureCustom(uniform: string, texture: Texture) {

        this._programs.forEach((prog) => {
            prog.activate();
            prog.setTexture(uniform, texture);
        });

        return this;
    }

    private runInCircle(elapsed: number) {

        this._nextPosition[0] = -Math.sin(elapsed * 1.75) * 2.5;
        this._nextPosition[2] = -Math.cos(elapsed * 1.75) * 2.5;

        // get the direction of the next position
        vec3.subtract(this._direction, this._nextPosition, this._lastPosition);

        // get the angle between the this._direction and the z axis
        const angle = Math.atan2(this._direction[0], this._direction[2]);

        // convert the angle to degrees
        const angleDeg = angle * (180 / Math.PI);

        // rotate the character to face the direction of the next position
        this._rootNode.transform.rotationY = angleDeg;

        this._rootNode.transform.positionX = this._nextPosition[0];
        this._rootNode.transform.positionZ = this._nextPosition[2];

        // update the last position
        this._lastPosition = this._rootNode.transform.position;
    }

    public update(data: { elapsed: number, delta: number }) {
        if (!this._animationsBound) return;
        const { elapsed, delta } = data;
        this._animation.update(elapsed, delta);
        this.runInCircle(elapsed);
    }

    public get worldMatrix(): mat4 {
        return this._scene.modelMatrix;
    }

    public get joints(): Node[] {
        return this._joints;
    }

    public get jointPositions(): Float32Array[] {
        return this._joints.map((joint) => {
            const pos = vec3.create();
            mat4.getTranslation(pos, joint.modelMatrix);
            return pos as Float32Array;
        });
    }

}