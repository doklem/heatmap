export class ClipSpaceQuad {

    private static readonly VERTEX_COUNT = 4; // A quad made of strip with two triangles
    private static readonly VERTEX_OFFSET = 0;
    private static readonly CLIP_SPACE_MIN = -1;
    private static readonly CLIP_SPACE_MAX = 1;

    public static readonly POSITION_COMPONENT_NUMBER = 2; // pull out 2 values per iteration
    public static readonly CLIP_SPACE_RANGE = ClipSpaceQuad.CLIP_SPACE_MAX - ClipSpaceQuad.CLIP_SPACE_MIN;

    public readonly positions: WebGLBuffer;

    //A triangle strips -> https://webglfundamentals.org/webgl/lessons/webgl-points-lines-triangles.html
    private readonly _vertices = new Float32Array([
        ClipSpaceQuad.CLIP_SPACE_MIN, ClipSpaceQuad.CLIP_SPACE_MAX,
        ClipSpaceQuad.CLIP_SPACE_MIN, ClipSpaceQuad.CLIP_SPACE_MIN,
        ClipSpaceQuad.CLIP_SPACE_MAX, ClipSpaceQuad.CLIP_SPACE_MAX,
        ClipSpaceQuad.CLIP_SPACE_MAX, ClipSpaceQuad.CLIP_SPACE_MIN
    ]);

    constructor(private readonly _gl: WebGL2RenderingContext) {
        // Create a buffer for the square's positions.
        const positionBuffer = this._gl.createBuffer();
        if (positionBuffer === null) {
            throw new Error('Unable to create the position buffer');
        }
        this.positions = positionBuffer;

        // Select the positionBuffer as the one to apply buffer
        // operations to from here out.
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this.positions);

        // Now pass the list of positions into WebGL to build the
        // shape. We do this by creating a Float32Array from the
        // JavaScript array, then use it to fill the current buffer.
        this._gl.bufferData(this._gl.ARRAY_BUFFER, this._vertices, this._gl.STATIC_DRAW);
    }

    public draw(): void {
        this._gl.drawArrays(this._gl.TRIANGLE_STRIP, ClipSpaceQuad.VERTEX_OFFSET, ClipSpaceQuad.VERTEX_COUNT);
    }

    public static toClipSpaceCoordinate(x: number, y: number, viewportWidth: number, viewportHeight: number): number[] {
        return [
            ClipSpaceQuad.CLIP_SPACE_MIN + x / viewportWidth * ClipSpaceQuad.CLIP_SPACE_RANGE,
            ClipSpaceQuad.CLIP_SPACE_MAX - y / viewportHeight * ClipSpaceQuad.CLIP_SPACE_RANGE
        ];
    }
}