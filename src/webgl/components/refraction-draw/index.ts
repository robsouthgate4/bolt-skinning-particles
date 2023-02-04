import assets from "@/webgl/globals/assets";
import vertexShader from "../../programs/white/shaders/vertexShader.glsl";
import fragmentShader from "../../programs/white/shaders/fragmentShader.glsl";
import { Bolt, DrawSet, DrawState,  GLTFScene,  Node, Program} from "bolt-gl";
import AssetCache from "@/webgl/libs/asset-cache";

export default class RefractionDrawState extends DrawState {

    constructor() {

        const bolt = Bolt.getInstance();  

        super(bolt);

        const assetCache = AssetCache.getInstance();

        const scene = assetCache.get<GLTFScene>(assets.gltf.refractionElements).scene;
        scene.traverse((node: Node) => {
            if (node instanceof DrawSet) {
                const originalProg = node.program;
                node.program = new Program(vertexShader, fragmentShader);
                originalProg.delete();
            }
        });
        
        this.setNode(scene);

    }

}