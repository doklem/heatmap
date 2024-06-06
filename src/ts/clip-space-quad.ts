import VertexShaderSource from './../shaders/vertex.glsl';

export class ClipSpaceQuad {

    private static readonly VERTEX_COUNT = 4; // A quad made of a strip with two triangles
    private static readonly VERTEX_OFFSET = 0;
    private static readonly CLIP_SPACE_MIN = -1;
    private static readonly CLIP_SPACE_MAX = 1;

    public static readonly POSITION_COMPONENT_NUMBER = 2; // pull out 2 values per iteration
    public static readonly CLIP_SPACE_RANGE = ClipSpaceQuad.CLIP_SPACE_MAX - ClipSpaceQuad.CLIP_SPACE_MIN;
    public static readonly VERTEX_SHADER_SOURCE = VertexShaderSource;

    public readonly positions: WebGLBuffer;

    //A triangle strips -> https://webglfundamentals.org/webgl/lessons/webgl-points-lines-triangles.html
    private readonly _vertices = new Float32Array([
        ClipSpaceQuad.CLIP_SPACE_MIN, ClipSpaceQuad.CLIP_SPACE_MAX,
        ClipSpaceQuad.CLIP_SPACE_MIN, ClipSpaceQuad.CLIP_SPACE_MIN,
        ClipSpaceQuad.CLIP_SPACE_MAX, ClipSpaceQuad.CLIP_SPACE_MAX,
        ClipSpaceQuad.CLIP_SPACE_MAX, ClipSpaceQuad.CLIP_SPACE_MIN
    ]);

    constructor(public readonly gl: WebGL2RenderingContext) {
        // Create a buffer for the square's positions.
        const positionBuffer = this.gl.createBuffer();
        if (positionBuffer === null) {
            throw new Error('Unable to create the position buffer');
        }
        this.positions = positionBuffer;

        // Select the positionBuffer as the one to apply buffer
        // operations to from here out.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positions);

        // Now pass the list of positions into WebGL to build the
        // shape. We do this by creating a Float32Array from the
        // JavaScript array, then use it to fill the current buffer.
        gl.bufferData(gl.ARRAY_BUFFER, this._vertices, gl.STATIC_DRAW);
    }

    public draw(): void {
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, ClipSpaceQuad.VERTEX_OFFSET, ClipSpaceQuad.VERTEX_COUNT);
    }

    /**
     * Tell WebGL how to pull out the positions from the position buffer into the vertexPosition attribute.
     */
    public setPositionAttribute(shaderProgram: WebGLProgram): void {
        const _vertexPositionLocation = this.gl.getAttribLocation(shaderProgram, 'aVertexPosition');
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positions);
        this.gl.vertexAttribPointer(
            _vertexPositionLocation,
            ClipSpaceQuad.POSITION_COMPONENT_NUMBER,
            this.gl.FLOAT, // the data in the buffer is 32bit floats
            false, // don't normalize
            0, // how many bytes to get from one set of values to the next -> 0 = use type and numComponents above
            0 // how many bytes inside the buffer to start from
        );
        this.gl.enableVertexAttribArray(_vertexPositionLocation);
    }
}