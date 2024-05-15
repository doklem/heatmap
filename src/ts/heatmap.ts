import VertexShaderSource from './../shaders/vertex.glsl';
import FragmentShaderSource from './../shaders/fragment.glsl';
import { ClipSpaceQuad } from './clip-space-quad';
import { ShaderUtils } from './shader-utils';

export class Heatmap {

    private static readonly MAX_POINTS_WIDTH = 100;
    private static readonly MAX_POINTS_HEIGHT = 100;
    private static readonly MAX_POINTS = Heatmap.MAX_POINTS_WIDTH * Heatmap.MAX_POINTS_HEIGHT;

    private readonly _pointsTextureLocation: WebGLUniformLocation;
    private readonly _pointMinLocation: WebGLUniformLocation;
    private readonly _pointMaxLocation: WebGLUniformLocation;
    private readonly _heatMinLocation: WebGLUniformLocation;
    private readonly _heatMaxLocation: WebGLUniformLocation;
    private readonly _colorColdLocation: WebGLUniformLocation;
    private readonly _colorHotLocation: WebGLUniformLocation;
    private readonly _alphaMinLocation: WebGLUniformLocation;
    private readonly _alphaMaxLocation: WebGLUniformLocation;
    private readonly _alphaStrengthLocation: WebGLUniformLocation;
    private readonly _vertexPositionLocation: number;
    private readonly _shaderProgram: WebGLProgram;
    private readonly _quad: ClipSpaceQuad;
    private readonly _pointsTexture: WebGLTexture;
    private readonly _pointsTextureData: Float32Array;

    private _pointsDataIndex = 0;
    private _pointsChanged = true;
    
    public transparencyMinimum = 0;
    public transparencyRange = 10;
    public transparencyStrength = 1;
    public pointSize = 0;
    public pointRange = 0.1;
    public heatMinimum = 10;
    public heatRange = 100;
    public readonly colorCold = {
        r: 0,
        g: 0,
        b: 1,
    };
    public readonly colorHot = {
        r: 1,
        g: 0,
        b: 0,
    };

    public get resolutionWidth(): number {
        return this._gl.canvas.width;
    }

    public set resolutionWidth(value: number) {
        this._gl.canvas.width = value;
        this._gl.viewport(0, 0, this._gl.drawingBufferWidth, this._gl.drawingBufferHeight);
    }

    public get resolutionHeight(): number {
        return this._gl.canvas.height;
    }

    public set resolutionHeight(value: number) {
        this._gl.canvas.height = value;
        this._gl.viewport(0, 0, this._gl.drawingBufferWidth, this._gl.drawingBufferHeight);
    }

    constructor(private readonly _gl: WebGL2RenderingContext) {
        this.resolutionWidth = 128;
        this.resolutionHeight = 128;

        // Create a data texture.
        this._pointsTexture = this.initializePointsTexture();

        this._pointsTextureData = new Float32Array(Heatmap.MAX_POINTS * ClipSpaceQuad.POSITION_COMPONENT_NUMBER);
        this._pointsTextureData.fill(ClipSpaceQuad.CLIP_SPACE_RANGE * 10); // Some point outside the view

        // Initialize a shader program; this is where all the lighting
        // for the vertices and so forth is established.
        this._shaderProgram = ShaderUtils.initializeShaderProgram(_gl, VertexShaderSource, FragmentShaderSource);

        // Collect all the info needed to use the shader program.
        // Look up which attributes our shader program is using
        // for aVertexPosition, aVertexColor and also
        // look up uniform locations.
        this._vertexPositionLocation = _gl.getAttribLocation(this._shaderProgram, 'aVertexPosition');
        this._pointsTextureLocation = ShaderUtils.getUniformLocationThrowing(_gl, this._shaderProgram, 'uPointsTexture');
        this._pointMinLocation = ShaderUtils.getUniformLocationThrowing(_gl, this._shaderProgram, 'uPointMin');
        this._pointMaxLocation = ShaderUtils.getUniformLocationThrowing(_gl, this._shaderProgram, 'uPointMax');
        this._heatMinLocation = ShaderUtils.getUniformLocationThrowing(_gl, this._shaderProgram, 'uHeatMin');
        this._heatMaxLocation = ShaderUtils.getUniformLocationThrowing(_gl, this._shaderProgram, 'uHeatMax');
        this._colorColdLocation = ShaderUtils.getUniformLocationThrowing(_gl, this._shaderProgram, 'uColorCold');
        this._colorHotLocation = ShaderUtils.getUniformLocationThrowing(_gl, this._shaderProgram, 'uColorHot');
        this._alphaMinLocation = ShaderUtils.getUniformLocationThrowing(_gl, this._shaderProgram, 'uAlphaMin');
        this._alphaMaxLocation = ShaderUtils.getUniformLocationThrowing(_gl, this._shaderProgram, 'uAlphaMax');
        this._alphaStrengthLocation = ShaderUtils.getUniformLocationThrowing(_gl, this._shaderProgram, 'uAlphaStrength');

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
    }

    public drawScene(): void {
        if (this._pointsChanged) {
            this._pointsChanged = false;
            this.writeToPointsTexture();
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
        this._gl.uniform1f(
            this._pointMinLocation,
            this.pointSize);
        this._gl.uniform1f(
            this._pointMaxLocation,
            this.pointSize + this.pointRange);
        this._gl.uniform1f(
            this._heatMinLocation,
            this.heatMinimum);
        this._gl.uniform1f(
            this._heatMaxLocation,
            this.heatMinimum + this.heatRange);
        this._gl.uniform3f(
            this._colorColdLocation,
            this.colorCold.r,
            this.colorCold.g,
            this.colorCold.b);
        this._gl.uniform3f(
            this._colorHotLocation,
            this.colorHot.r,
            this.colorHot.g,
            this.colorHot.b);
        this._gl.uniform1f(
            this._alphaMinLocation,
            this.transparencyMinimum);
        this._gl.uniform1f(
            this._alphaMaxLocation,
            this.transparencyMinimum + this.transparencyRange);
        this._gl.uniform1f(
            this._alphaStrengthLocation,
            this.transparencyStrength);

        // Tell the shader to use texture unit 0 for uPointsTexture
        this._gl.uniform1i(this._pointsTextureLocation, 0);
    }

    private clearScene(): void {
        this._gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
        this._gl.clearDepth(1.0); // Clear everything
        this._gl.enable(this._gl.DEPTH_TEST); // Enable depth testing
        this._gl.depthFunc(this._gl.LEQUAL); // Near things obscure far things
        this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
    }

    private initializePointsTexture(): WebGLTexture {
        var texture = this._gl.createTexture();
        if (texture === null) {
            throw new Error('Unable to create points texture');
        }
        this._gl.bindTexture(this._gl.TEXTURE_2D, texture);

        this._gl.pixelStorei(this._gl.UNPACK_ALIGNMENT, 1);

        // set the filtering so we don't need mips and it's not filtered
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.NEAREST);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.NEAREST);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);

        return texture;
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

    private writeToPointsTexture(): void {
        this._gl.bindTexture(this._gl.TEXTURE_2D, this._pointsTexture);
        this._gl.texImage2D(
            this._gl.TEXTURE_2D,
            0, // Use the base level, since we do not want to use mips.
            this._gl.RG32F, // Only two channels are needed to represent a 2D coordinate
            Heatmap.MAX_POINTS_WIDTH,
            Heatmap.MAX_POINTS_HEIGHT,
            0, // No border
            this._gl.RG,
            this._gl.FLOAT,
            this._pointsTextureData);
    }
}