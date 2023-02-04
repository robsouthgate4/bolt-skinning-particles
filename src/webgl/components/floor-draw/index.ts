import { Bolt, DrawSet, DrawState, LINES, Mesh, Program } from "bolt-gl";

import vertexShader from "./shaders/axis.vert";
import fragmentShader from "./shaders/axis.frag";

const DIMENSIONS = 50;

export default class FloorDrawState extends DrawState {
    constructor() {
        const bolt = Bolt.getInstance();
        super(bolt);
        
        const mesh = this.createMesh();
        const program = new Program(vertexShader, fragmentShader);
        program.name = "FloorDrawState";

        this.setDrawSet(new DrawSet(mesh, program));
    }

    private createMesh(): Mesh {

        const lines = (2 * DIMENSIONS) / 5;

        const inc = (2 * DIMENSIONS) / lines;
        const positions = [];
        const indices = [];

        for (let l = 0; l <= lines; l++) {
            positions[6 * l] = -DIMENSIONS;
            positions[6 * l + 1] = 0;
            positions[6 * l + 2] = -DIMENSIONS + l * inc;

            positions[6 * l + 3] = DIMENSIONS;
            positions[6 * l + 4] = 0;
            positions[6 * l + 5] = -DIMENSIONS + l * inc;

            positions[6 * (lines + 1) + 6 * l] = -DIMENSIONS + l * inc;
            positions[6 * (lines + 1) + 6 * l + 1] = 0;
            positions[6 * (lines + 1) + 6 * l + 2] = -DIMENSIONS;

            positions[6 * (lines + 1) + 6 * l + 3] = -DIMENSIONS + l * inc;
            positions[6 * (lines + 1) + 6 * l + 4] = 0;
            positions[6 * (lines + 1) + 6 * l + 5] = DIMENSIONS;

            indices[2 * l] = 2 * l;
            indices[2 * l + 1] = 2 * l + 1;
            indices[2 * (lines + 1) + 2 * l] = 2 * (lines + 1) + 2 * l;
            indices[2 * (lines + 1) + 2 * l + 1] = 2 * (lines + 1) + 2 * l + 1;
        }

        const mesh = new Mesh({
            positions,
            indices,
        }).setDrawType(LINES);

        return mesh;
    }
}