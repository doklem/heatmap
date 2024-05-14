import VertexShaderSource from './../shaders/vertex.glsl';
import FragmentShaderSource from './../shaders/fragment.glsl';
import { IHeatmapOptions } from './heatmap-options';

export class Heatmap {

    private static readonly VERTEX_COUNT = 4; // A quad made of strip with two triangles
    private static readonly POSITION_COMPONENT_NUMBER = 2; // pull out 2 values per iteration
    private static readonly VERTEX_OFFSET = 0;
    private static readonly CLIP_SPACE_MIN = -1;
    private static readonly CLIP_SPACE_MAX = 1;
    private static readonly CLIP_SPACE_RANGE = Heatmap.CLIP_SPACE_MAX - Heatmap.CLIP_SPACE_MIN;
    private static readonly MAX_POINTS = 1000;

    //A triangle strips -> https://webglfundamentals.org/webgl/lessons/webgl-points-lines-triangles.html
    private readonly _vertices = new Float32Array([
        -1, 1,
        -1, -1,
        1, 1,
        1, -1
    ]);
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
    private readonly _positions: WebGLBuffer;
    private readonly _shaderProgram: WebGLProgram;
    private readonly _pointsData: Float32Array;

    private _pointsDataIndex: number;

    constructor(
        private readonly _gl: WebGL2RenderingContext,
        public readonly options: IHeatmapOptions) {

        // Initialize a shader program; this is where all the lighting
        // for the vertices and so forth is established.
        this._shaderProgram = this.initializeShaderProgram();

        // Collect all the info needed to use the shader program.
        // Look up which attributes our shader program is using
        // for aVertexPosition, aVertexColor and also
        // look up uniform locations.
        this._vertexPosition = _gl.getAttribLocation(this._shaderProgram, 'aVertexPosition');
        this._points = this.getUniformLocationThrowing('uPoints');
        this._pointMin = this.getUniformLocationThrowing('uPointMin');
        this._pointMax = this.getUniformLocationThrowing('uPointMax');
        this._heatMin = this.getUniformLocationThrowing('uHeatMin');
        this._heatMax = this.getUniformLocationThrowing('uHeatMax');
        this._colorCold = this.getUniformLocationThrowing('uColorCold');
        this._colorHot = this.getUniformLocationThrowing('uColorHot');
        this._alphaMin = this.getUniformLocationThrowing('uAlphaMin');
        this._alphaMax = this.getUniformLocationThrowing('uAlphaMax');
        this._alphaStrength = this.getUniformLocationThrowing('uAlphaStrength');

        // Here's where we call the routine that builds all the
        // objects we'll be drawing.
        this._positions = this.initializePositionBuffer();

        this._pointsDataIndex = 0;
        this._pointsData = new Float32Array(Heatmap.MAX_POINTS * Heatmap.POSITION_COMPONENT_NUMBER);
        this._pointsData.fill(Heatmap.CLIP_SPACE_RANGE * 10); // Some point outside the view

        // Tell WebGL how to pull out the positions from the position
        // buffer into the vertexPosition attribute.
        this.setPositionAttribute();
    }

    public addPoint(x: number, y: number): void {
        this._pointsData.set(
            [
                Heatmap.CLIP_SPACE_MIN + x / this._gl.canvas.width * Heatmap.CLIP_SPACE_RANGE,
                Heatmap.CLIP_SPACE_MAX - y / this._gl.canvas.height * Heatmap.CLIP_SPACE_RANGE
            ],
            this._pointsDataIndex * Heatmap.POSITION_COMPONENT_NUMBER);
        this._pointsDataIndex = (this._pointsDataIndex + 1) % Heatmap.MAX_POINTS;
    }

    public drawScene(): void {
        // Clear the canvas before we start drawing on it.
        this.clearScene();

        // Tell WebGL to use our program when drawing
        this._gl.useProgram(this._shaderProgram);

        // Set the shader uniforms
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

        this._gl.drawArrays(this._gl.TRIANGLE_STRIP, Heatmap.VERTEX_OFFSET, Heatmap.VERTEX_COUNT);
    }

    private getUniformLocationThrowing(name: string): WebGLUniformLocation {
        const location = this._gl.getUniformLocation(this._shaderProgram, name);
        if (location === null) {
            throw new Error(`Failed to obtain the location of the uniform ${name}`);
        }
        return location;
    }

    /**
     * Initialize a shader program, so WebGL knows how to draw our data.
     */
    private initializeShaderProgram(): WebGLProgram {
        const vertexShader = this.loadShader(this._gl.VERTEX_SHADER, VertexShaderSource);
        const fragmentShader = this.loadShader(this._gl.FRAGMENT_SHADER, FragmentShaderSource);

        // Create the shader program  
        const shaderProgram = this._gl.createProgram();
        if (shaderProgram === null) {
            throw new Error('Unable to create shader program');
        }
        this._gl.attachShader(shaderProgram, vertexShader);
        this._gl.attachShader(shaderProgram, fragmentShader);
        this._gl.linkProgram(shaderProgram);

        // If creating the shader program failed, alert  
        if (!this._gl.getProgramParameter(shaderProgram, this._gl.LINK_STATUS)) {
            throw new Error(`Unable to initialize the shader program: ${this._gl.getProgramInfoLog(shaderProgram)}`);
        }
        return shaderProgram;
    }

    /**
     * Creates a shader of the given type, uploads the source and compiles it.
     */
    private loadShader(type: number, source: string): WebGLShader {
        const shader = this._gl.createShader(type);
        if (shader === null) {
            throw new Error(`Unable to create shader of type: ${type}`);
        }

        // Send the source to the shader object
        this._gl.shaderSource(shader, source);

        // Compile the shader program
        this._gl.compileShader(shader);

        // See if it compiled successfully
        if (!this._gl.getShaderParameter(shader, this._gl.COMPILE_STATUS)) {
            const message = `An error occurred compiling the shaders: ${this._gl.getShaderInfoLog(shader)}`;
            this._gl.deleteShader(shader);
            throw new Error(message);
        }
        return shader;
    }

    private initializePositionBuffer(): WebGLBuffer {
        // Create a buffer for the square's positions.
        const positionBuffer = this._gl.createBuffer();
        if (positionBuffer === null) {
            throw new Error('Unable to create the position buffer');
        }

        // Select the positionBuffer as the one to apply buffer
        // operations to from here out.
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, positionBuffer);

        // Now pass the list of positions into WebGL to build the
        // shape. We do this by creating a Float32Array from the
        // JavaScript array, then use it to fill the current buffer.
        this._gl.bufferData(this._gl.ARRAY_BUFFER, this._vertices, this._gl.STATIC_DRAW);
        return positionBuffer;
    }

    /**
     * Tell WebGL how to pull out the positions from the position buffer into the vertexPosition attribute.
     */
    private setPositionAttribute(): void {
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._positions);
        this._gl.vertexAttribPointer(
            this._vertexPosition,
            Heatmap.POSITION_COMPONENT_NUMBER,
            this._gl.FLOAT, // the data in the buffer is 32bit floats
            false, // don't normalize
            0, // how many bytes to get from one set of values to the next -> 0 = use type and numComponents above
            0 // how many bytes inside the buffer to start from
        );
        this._gl.enableVertexAttribArray(this._vertexPosition);
    }

    private clearScene(): void {
        this._gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
        this._gl.clearDepth(1.0); // Clear everything
        this._gl.enable(this._gl.DEPTH_TEST); // Enable depth testing
        this._gl.depthFunc(this._gl.LEQUAL); // Near things obscure far things
        this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
    }
}