import VertexShaderSource from './../shaders/vertex.glsl';
import FragmentShaderSource from './../shaders/fragment.glsl';
import { IHeatmapOptions } from './heatmap-options';
import { ClipSpaceQuad } from './clip-space-quad';
import { ShaderUtils } from './shader-utils';

export class Heatmap {

    private static readonly MAX_POINTS = 1000;

    private readonly _points: WebGLUniformLocation;
    private readonly _pointMin: WebGLUniformLocation;
    private readonly _pointMax: WebGLUniformLocation;
    private readonly _heatMin: WebGLUniformLocation;
    private readonly _heatMax: WebGLUniformLocation;
    private readonly _colorCold: WebGLUniformLocation;
    private readonly _colorHot: WebGLUniformLocation;
    private readonly _alphaMin: WebGLUniformLocation;
    private readonly _alphaMax: WebGLUniformLocation;
    private readonly _alphaStrength: WebGLUniformLocation;
    private readonly _vertexPosition: number;
    private readonly _shaderProgram: WebGLProgram;
    private readonly _pointsData: Float32Array;
    private readonly _quad: ClipSpaceQuad;

    private _pointsDataIndex: number;

    public readonly options: IHeatmapOptions

    constructor(private readonly _gl: WebGL2RenderingContext) {
        this.options = {
            transparencyMinimum: 0,
            transparencyRange: 10,
            transparencyStrength: 1,
            pointSize: 0,
            pointRange: 0.4,
            heatMinimum: 10,
            heatRange: 100,
            colorCold: {
                r: 0,
                g: 0,
                b: 1,
            },
            colorHot: {
                r: 1,
                g: 0,
                b: 0,
            },
        };

        // Initialize a shader program; this is where all the lighting
        // for the vertices and so forth is established.
        this._shaderProgram = ShaderUtils.initializeShaderProgram(_gl, VertexShaderSource, FragmentShaderSource);

        // Collect all the info needed to use the shader program.
        // Look up which attributes our shader program is using
        // for aVertexPosition, aVertexColor and also
        // look up uniform locations.
        this._vertexPosition = _gl.getAttribLocation(this._shaderProgram, 'aVertexPosition');
        this._points = ShaderUtils.getUniformLocationThrowing(_gl, this._shaderProgram, 'uPoints');
        this._pointMin = ShaderUtils.getUniformLocationThrowing(_gl, this._shaderProgram, 'uPointMin');
        this._pointMax = ShaderUtils.getUniformLocationThrowing(_gl, this._shaderProgram, 'uPointMax');
        this._heatMin = ShaderUtils.getUniformLocationThrowing(_gl, this._shaderProgram, 'uHeatMin');
        this._heatMax = ShaderUtils.getUniformLocationThrowing(_gl, this._shaderProgram, 'uHeatMax');
        this._colorCold = ShaderUtils.getUniformLocationThrowing(_gl, this._shaderProgram, 'uColorCold');
        this._colorHot = ShaderUtils.getUniformLocationThrowing(_gl, this._shaderProgram, 'uColorHot');
        this._alphaMin = ShaderUtils.getUniformLocationThrowing(_gl, this._shaderProgram, 'uAlphaMin');
        this._alphaMax = ShaderUtils.getUniformLocationThrowing(_gl, this._shaderProgram, 'uAlphaMax');
        this._alphaStrength = ShaderUtils.getUniformLocationThrowing(_gl, this._shaderProgram, 'uAlphaStrength');

        // Here's where we call the routine that builds all the
        // objects we'll be drawing.
        this._quad = new ClipSpaceQuad(_gl);

        this._pointsDataIndex = 0;
        this._pointsData = new Float32Array(Heatmap.MAX_POINTS * ClipSpaceQuad.POSITION_COMPONENT_NUMBER);
        this._pointsData.fill(ClipSpaceQuad.CLIP_SPACE_RANGE * 10); // Some point outside the view

        // Tell WebGL how to pull out the positions from the position
        // buffer into the vertexPosition attribute.
        this.setPositionAttribute();
    }

    public addPoint(x: number, y: number): void {
        this._pointsData.set(
            this._quad.toClipSpaceCoordinate(x, y),
            this._pointsDataIndex * ClipSpaceQuad.POSITION_COMPONENT_NUMBER);
        this._pointsDataIndex = (this._pointsDataIndex + 1) % Heatmap.MAX_POINTS;
    }

    public drawScene(): void {
        // Clear the canvas before we start drawing on it.
        this.clearScene();

        // Tell WebGL to use our program when drawing
        this._gl.useProgram(this._shaderProgram);

        // Set the shader uniforms
        this.applyUniforms();

        this._quad.draw();
    }

    private applyUniforms(): void {
        this._gl.uniform2fv(
            this._points,
            this._pointsData);
        this._gl.uniform1f(
            this._pointMin,
            this.options.pointSize);
        this._gl.uniform1f(
            this._pointMax,
            this.options.pointSize + this.options.pointRange);
        this._gl.uniform1f(
            this._heatMin,
            this.options.heatMinimum);
        this._gl.uniform1f(
            this._heatMax,
            this.options.heatMinimum + this.options.heatRange);
        this._gl.uniform3f(
            this._colorCold,
            this.options.colorCold.r,
            this.options.colorCold.g,
            this.options.colorCold.b);
        this._gl.uniform3f(
            this._colorHot,
            this.options.colorHot.r,
            this.options.colorHot.g,
            this.options.colorHot.b);
        this._gl.uniform1f(
            this._alphaMin,
            this.options.transparencyMinimum);
        this._gl.uniform1f(
            this._alphaMax,
            this.options.transparencyMinimum + this.options.transparencyRange);
        this._gl.uniform1f(
            this._alphaStrength,
            this.options.transparencyStrength);
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
            this._vertexPosition,
            ClipSpaceQuad.POSITION_COMPONENT_NUMBER,
            this._gl.FLOAT, // the data in the buffer is 32bit floats
            false, // don't normalize
            0, // how many bytes to get from one set of values to the next -> 0 = use type and numComponents above
            0 // how many bytes inside the buffer to start from
        );
        this._gl.enableVertexAttribArray(this._vertexPosition);
    }
}