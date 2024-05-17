import VertexShaderSource from './../shaders/vertex.glsl';
import FragmentShaderSource from './../shaders/fragment.glsl';
import { ClipSpaceQuad } from './clip-space-quad';
import { ShaderUtils } from './shader-utils';
import { TextureWrapper } from './texture-wrapper';

export class Heatmap {

    private static readonly MAX_POINTS_WIDTH = 100;
    private static readonly MAX_POINTS_HEIGHT = 100;
    private static readonly MAX_POINTS = Heatmap.MAX_POINTS_WIDTH * Heatmap.MAX_POINTS_HEIGHT;

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
    private readonly _pointsTextureData: Float32Array;
    private readonly _heatGradientTexture: TextureWrapper;
    private readonly _heatGradientTextureLocation: WebGLUniformLocation;

    private _pointsDataIndex = 0;
    private _pointsChanged = true;
    private _configChanged = true;
    private _transparencyMinimum = 0;
    private _transparencyRange = 10;
    private _transparencyStrength = 1;
    private _pointSize = 0.02;
    private _pointRange = 0.2;
    private _heatMinimum = 10;
    private _heatRange = 100;

    public get transparencyMinimum(): number {
        return this._transparencyMinimum;
    }

    public set transparencyMinimum(value: number) {
        this._transparencyMinimum = value;
        this._configChanged = true;
    }

    public get transparencyRange(): number {
        return this._transparencyRange;
    }

    public set transparencyRange(value: number) {
        this._transparencyRange = value;
        this._configChanged = true;
    }

    public get transparencyStrength(): number {
        return this._transparencyStrength;
    }

    public set transparencyStrength(value: number) {
        this._transparencyStrength = value;
        this._configChanged = true;
    }

    public get pointSize(): number {
        return this._pointSize;
    }

    public set pointSize(value: number) {
        this._pointSize = value;
        this._configChanged = true;
    }

    public get pointRange(): number {
        return this._pointRange;
    }

    public set pointRange(value: number) {
        this._pointRange = value;
        this._configChanged = true;
    }

    public get heatMinimum(): number {
        return this._heatMinimum;
    }

    public set heatMinimum(value: number) {
        this._heatMinimum = value;
        this._configChanged = true;
    }

    public get heatRange(): number {
        return this._heatRange;
    }

    public set heatRange(value: number) {
        this._heatRange = value;
        this._configChanged = true;
    }

    public get resolutionWidth(): number {
        return this._gl.canvas.width;
    }

    public set resolutionWidth(value: number) {
        this._gl.canvas.width = value;
        this._gl.viewport(0, 0, this._gl.drawingBufferWidth, this._gl.drawingBufferHeight);
        this._configChanged = true;
    }

    public get resolutionHeight(): number {
        return this._gl.canvas.height;
    }

    public set resolutionHeight(value: number) {
        this._gl.canvas.height = value;
        this._gl.viewport(0, 0, this._gl.drawingBufferWidth, this._gl.drawingBufferHeight);
        this._configChanged = true;
    }

    constructor(private readonly _gl: WebGL2RenderingContext) {
        // Set the initial canvas size.
        this._gl.canvas.width = 128;
        this._gl.canvas.height = 128;
        this._gl.viewport(0, 0, this._gl.drawingBufferWidth, this._gl.drawingBufferHeight);

        // Initialize a shader program; this is where all the lighting
        // for the vertices and so forth is established.
        this._shaderProgram = ShaderUtils.initializeShaderProgram(_gl, VertexShaderSource, FragmentShaderSource);

        // Collect all the info needed to use the shader program.
        // Look up which attributes our shader program is using
        // for aVertexPosition, aVertexColor and also
        // look up uniform locations.
        this._vertexPositionLocation = _gl.getAttribLocation(this._shaderProgram, 'aVertexPosition');
        this._pointsTextureLocation = ShaderUtils.getUniformLocationThrowing(_gl, this._shaderProgram, 'uPointsTexture');
        this._heatGradientTextureLocation = ShaderUtils.getUniformLocationThrowing(_gl, this._shaderProgram, 'uHeatTexture');
        this._pointMinLocation = ShaderUtils.getUniformLocationThrowing(_gl, this._shaderProgram, 'uPointMin');
        this._pointMaxLocation = ShaderUtils.getUniformLocationThrowing(_gl, this._shaderProgram, 'uPointMax');
        this._heatMinLocation = ShaderUtils.getUniformLocationThrowing(_gl, this._shaderProgram, 'uHeatMin');
        this._heatMaxLocation = ShaderUtils.getUniformLocationThrowing(_gl, this._shaderProgram, 'uHeatMax');
        this._alphaMinLocation = ShaderUtils.getUniformLocationThrowing(_gl, this._shaderProgram, 'uAlphaMin');
        this._alphaMaxLocation = ShaderUtils.getUniformLocationThrowing(_gl, this._shaderProgram, 'uAlphaMax');
        this._alphaStrengthLocation = ShaderUtils.getUniformLocationThrowing(_gl, this._shaderProgram, 'uAlphaStrength');

        // Create the textures.
        this._heatGradientTexture = new TextureWrapper(
            _gl,
            _gl.TEXTURE_2D,
            _gl.LINEAR,
            _gl.CLAMP_TO_EDGE,
            0, // Use the base level, since we do not want to use mips.
            _gl.RGB,
            _gl.RGB,
            _gl.UNSIGNED_BYTE
        );
        this._heatGradientTexture.loadFormImage('dist/assets/heat-gradient.png');
        this._pointsTexture = new TextureWrapper(
            _gl,
            _gl.TEXTURE_2D,
            _gl.NEAREST,
            _gl.CLAMP_TO_EDGE,
            0, // Use the base level, since we do not want to use mips.
            _gl.RG32F, // Only two channels are needed to represent a 2D coordinate
            _gl.RG,
            _gl.FLOAT,
            1
        );
        this._pointsTextureData = new Float32Array(Heatmap.MAX_POINTS * ClipSpaceQuad.POSITION_COMPONENT_NUMBER);
        this._pointsTextureData.fill(ClipSpaceQuad.CLIP_SPACE_RANGE * 1000); // Some point outside the view

        // Here's where we call the routine that builds all the
        // objects we'll be drawing.
        this._quad = new ClipSpaceQuad(_gl);

        // Tell WebGL how to pull out the positions from the position
        // buffer into the vertexPosition attribute.
        this.setPositionAttribute();
    }

    public addPoint(x: number, y: number): void {
        this._pointsTextureData.set(
            ClipSpaceQuad.toClipSpaceCoordinate(x, y, this.resolutionWidth, this.resolutionHeight),
            this._pointsDataIndex * ClipSpaceQuad.POSITION_COMPONENT_NUMBER);
        this._pointsDataIndex = (this._pointsDataIndex + 1) % Heatmap.MAX_POINTS;
        this._pointsChanged = true;
        this._configChanged = true;
    }

    public drawScene(): void {
        if (!this._configChanged) {
            return;
        }
        this._configChanged = false;
        if (this._pointsChanged) {
            this._pointsChanged = false;
            this._pointsTexture.loadFromArray(this._pointsTextureData, Heatmap.MAX_POINTS_WIDTH, Heatmap.MAX_POINTS_HEIGHT);
        }
        // Clear the canvas before we start drawing on it.
        this.clearScene();
        // Tell WebGL to use our program when drawing.
        this._gl.useProgram(this._shaderProgram);
        // Set the shader uniforms.
        this.applyUniforms();
        // Draw the scene.
        this._quad.draw();
    }

    private applyUniforms(): void {
        this._gl.uniform1f(this._pointMinLocation, Heatmap.toDistanceSquare(this.pointSize));
        this._gl.uniform1f(this._pointMaxLocation, Heatmap.toDistanceSquare(this.pointSize + this.pointRange));
        this._gl.uniform1f(this._heatMinLocation, this.heatMinimum);
        this._gl.uniform1f(this._heatMaxLocation, this.heatMinimum + this.heatRange);
        this._gl.uniform1f(this._alphaMinLocation, this.transparencyMinimum);
        this._gl.uniform1f(this._alphaMaxLocation, this.transparencyMinimum + this.transparencyRange);
        this._gl.uniform1f(this._alphaStrengthLocation, this.transparencyStrength);
        this._pointsTexture.setUniform(this._pointsTextureLocation, this._gl.TEXTURE0);
        this._heatGradientTexture.setUniform(this._heatGradientTextureLocation, this._gl.TEXTURE1);
    }

    private clearScene(): void {
        this._gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
        this._gl.clearDepth(1.0); // Clear everything
        this._gl.enable(this._gl.DEPTH_TEST); // Enable depth testing
        this._gl.depthFunc(this._gl.LEQUAL); // Near things obscure far things
        this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
    }

    /**
     * Tell WebGL how to pull out the positions from the position buffer into the vertexPosition attribute.
     */
    private setPositionAttribute(): void {
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._quad.positions);
        this._gl.vertexAttribPointer(
            this._vertexPositionLocation,
            ClipSpaceQuad.POSITION_COMPONENT_NUMBER,
            this._gl.FLOAT, // the data in the buffer is 32bit floats
            false, // don't normalize
            0, // how many bytes to get from one set of values to the next -> 0 = use type and numComponents above
            0 // how many bytes inside the buffer to start from
        );
        this._gl.enableVertexAttribArray(this._vertexPositionLocation);
    }

    private static toDistanceSquare(distance: number): number {
        return distance * distance;
    }
}
