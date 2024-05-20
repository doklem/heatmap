import VertexShaderSource from './../shaders/vertex.glsl';
import FragmentShaderSource from './../shaders/fragment.glsl';
import { ClipSpaceQuad } from './clip-space-quad';
import { ShaderUtils } from './shader-utils';
import { TextureWrapper } from './texture-wrapper';
import { HeatmapOptions } from './heatmap-options';

export class HeatmapRenderNode {

    private readonly _pointsTextureLocation: WebGLUniformLocation;
    private readonly _pointMinLocation: WebGLUniformLocation;
    private readonly _pointMaxLocation: WebGLUniformLocation;
    private readonly _heatMinLocation: WebGLUniformLocation;
    private readonly _heatMaxLocation: WebGLUniformLocation;
    private readonly _alphaMinLocation: WebGLUniformLocation;
    private readonly _alphaMaxLocation: WebGLUniformLocation;
    private readonly _alphaStrengthLocation: WebGLUniformLocation;
    private readonly _vertexPositionLocation: number;
    private readonly _shaderProgram: WebGLProgram;
    private readonly _quad: ClipSpaceQuad;
    private readonly _pointsTexture: TextureWrapper;
    private readonly _heatGradientTexture: TextureWrapper;
    private readonly _heatGradientTextureLocation: WebGLUniformLocation;

    constructor(
        public readonly gl: WebGL2RenderingContext,
        private readonly _options: HeatmapOptions,
        heatGradient: TexImageSource,
        pointsTextureData: Float32Array) {
        // Initialize a shader program; this is where all the lighting
        // for the vertices and so forth is established.
        this._shaderProgram = ShaderUtils.initializeShaderProgram(gl, VertexShaderSource, FragmentShaderSource);

        // Collect all the info needed to use the shader program.
        // Look up which attributes our shader program is using
        // for aVertexPosition, aVertexColor and also
        // look up uniform locations.
        this._vertexPositionLocation = gl.getAttribLocation(this._shaderProgram, 'aVertexPosition');
        this._pointsTextureLocation = ShaderUtils.getUniformLocationThrowing(gl, this._shaderProgram, 'uPointsTexture');
        this._heatGradientTextureLocation = ShaderUtils.getUniformLocationThrowing(gl, this._shaderProgram, 'uHeatTexture');
        this._pointMinLocation = ShaderUtils.getUniformLocationThrowing(gl, this._shaderProgram, 'uPointMin');
        this._pointMaxLocation = ShaderUtils.getUniformLocationThrowing(gl, this._shaderProgram, 'uPointMax');
        this._heatMinLocation = ShaderUtils.getUniformLocationThrowing(gl, this._shaderProgram, 'uHeatMin');
        this._heatMaxLocation = ShaderUtils.getUniformLocationThrowing(gl, this._shaderProgram, 'uHeatMax');
        this._alphaMinLocation = ShaderUtils.getUniformLocationThrowing(gl, this._shaderProgram, 'uAlphaMin');
        this._alphaMaxLocation = ShaderUtils.getUniformLocationThrowing(gl, this._shaderProgram, 'uAlphaMax');
        this._alphaStrengthLocation = ShaderUtils.getUniformLocationThrowing(gl, this._shaderProgram, 'uAlphaStrength');

        // Create the textures.
        this._heatGradientTexture = new TextureWrapper(
            gl,
            gl.TEXTURE_2D,
            gl.LINEAR,
            gl.CLAMP_TO_EDGE,
            0, // Use the base level, since we do not want to use mips.
            gl.RGB,
            gl.RGB,
            gl.UNSIGNED_BYTE
        );
        this._heatGradientTexture.loadFormImageSource(heatGradient);
        this._pointsTexture = new TextureWrapper(
            gl,
            gl.TEXTURE_2D,
            gl.NEAREST,
            gl.CLAMP_TO_EDGE,
            0, // Use the base level, since we do not want to use mips.
            gl.RG32F, // Only two channels are needed to represent a 2D coordinate
            gl.RG,
            gl.FLOAT,
            1
        );
        this._pointsTexture.loadFromArray(pointsTextureData, pointsTextureData.length / ClipSpaceQuad.POSITION_COMPONENT_NUMBER, 1);

        // Here's where we call the routine that builds all the
        // objects we'll be drawing.
        this._quad = new ClipSpaceQuad(gl);

        // Tell WebGL how to pull out the positions from the position
        // buffer into the vertexPosition attribute.
        this.setPositionAttribute();
    }

    public loadPoint(data: Float32Array, offset: number): void {
        this._pointsTexture.loadFromPartialArray(data, offset, 0, 1, 1);
    }

    public drawScene(adjustViewport: boolean): void {
        if (adjustViewport) {
            this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
        }
        // Clear the canvas before we start drawing on it.
        this.clearScene();
        // Tell WebGL to use our program when drawing.
        this.gl.useProgram(this._shaderProgram);
        // Set the shader uniforms.
        this.applyUniforms();
        // Draw the scene.
        this._quad.draw();
    }

    private applyUniforms(): void {
        this.gl.uniform1f(this._pointMinLocation, HeatmapRenderNode.toDistanceSquare(this._options.pointSize));
        this.gl.uniform1f(this._pointMaxLocation, HeatmapRenderNode.toDistanceSquare(this._options.pointSize + this._options.pointRange));
        this.gl.uniform1f(this._heatMinLocation, this._options.heatMinimum);
        this.gl.uniform1f(this._heatMaxLocation, this._options.heatMinimum + this._options.heatRange);
        this.gl.uniform1f(this._alphaMinLocation, this._options.transparencyMinimum);
        this.gl.uniform1f(this._alphaMaxLocation, this._options.transparencyMinimum + this._options.transparencyRange);
        this.gl.uniform1f(this._alphaStrengthLocation, this._options.transparencyStrength);
        this._pointsTexture.setUniform(this._pointsTextureLocation, this.gl.TEXTURE0);
        this._heatGradientTexture.setUniform(this._heatGradientTextureLocation, this.gl.TEXTURE1);
    }

    private clearScene(): void {
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
        this.gl.clearDepth(1.0); // Clear everything
        this.gl.enable(this.gl.DEPTH_TEST); // Enable depth testing
        this.gl.depthFunc(this.gl.LEQUAL); // Near things obscure far things
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    /**
     * Tell WebGL how to pull out the positions from the position buffer into the vertexPosition attribute.
     */
    private setPositionAttribute(): void {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._quad.positions);
        this.gl.vertexAttribPointer(
            this._vertexPositionLocation,
            ClipSpaceQuad.POSITION_COMPONENT_NUMBER,
            this.gl.FLOAT, // the data in the buffer is 32bit floats
            false, // don't normalize
            0, // how many bytes to get from one set of values to the next -> 0 = use type and numComponents above
            0 // how many bytes inside the buffer to start from
        );
        this.gl.enableVertexAttribArray(this._vertexPositionLocation);
    }

    private static toDistanceSquare(distance: number): number {
        return distance * distance;
    }
}
