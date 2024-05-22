import { ClipSpaceQuad } from '../clip-space-quad';

export abstract class RenderNodeBase {

    protected abstract readonly _shaderProgram: WebGLProgram;

    protected readonly _gl: WebGL2RenderingContext;

    constructor(protected readonly _quad: ClipSpaceQuad) {
        this._gl = _quad.gl;
    }

    /**
     * Tell WebGL how to pull out the positions from the position buffer into the vertexPosition attribute.
     */
    protected setPositionAttribute(): void {
        const vertexPositionLocation = this._gl.getAttribLocation(this._shaderProgram, 'aVertexPosition');
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._quad.positions);
        this._gl.vertexAttribPointer(
            vertexPositionLocation,
            ClipSpaceQuad.POSITION_COMPONENT_NUMBER,
            this._gl.FLOAT, // the data in the buffer is 32bit floats
            false, // don't normalize
            0, // how many bytes to get from one set of values to the next -> 0 = use type and numComponents above
            0 // how many bytes inside the buffer to start from
        );
        this._gl.enableVertexAttribArray(vertexPositionLocation);
    }
}