import FragmentShaderSource from './../../shaders/coloring-fragment.glsl';
import { ClipSpaceQuad } from '../clip-space-quad';
import { ShaderUtils } from '../shader-utils';
import { RenderNodeBase } from './render-node-base';
import { ColoringRenderNodeOptions } from '../options/coloring-render-node-options';
import { TextureStore } from './texture-store';

export class ColoringRenderNode extends RenderNodeBase {

    private readonly _heatMinLocation: WebGLUniformLocation;
    private readonly _heatMaxLocation: WebGLUniformLocation;
    private readonly _alphaMinLocation: WebGLUniformLocation;
    private readonly _alphaMaxLocation: WebGLUniformLocation;
    private readonly _alphaStrengthLocation: WebGLUniformLocation;
    private readonly _gradientTextureLocation: WebGLUniformLocation;
    private readonly _heatTextureLocation: WebGLUniformLocation;

    protected readonly _shaderProgram: WebGLProgram;

    constructor(
        quad: ClipSpaceQuad,
        textures: TextureStore,
        private readonly _options: ColoringRenderNodeOptions) {
        super(quad, textures);

        // Initialize a shader program; this is where all the lighting
        // for the vertices and so forth is established.
        this._shaderProgram = ShaderUtils.initializeShaderProgram(this._gl, FragmentShaderSource);

        // Collect all the info needed to use the shader program.
        // Look up which attributes our shader program is using
        // for aVertexPosition, aVertexColor and also
        // look up uniform locations.
        this._heatTextureLocation = ShaderUtils.getUniformLocationThrowing(this._gl, this._shaderProgram, 'uHeatTexture');
        this._gradientTextureLocation = ShaderUtils.getUniformLocationThrowing(this._gl, this._shaderProgram, 'uGradientTexture');
        this._heatMinLocation = ShaderUtils.getUniformLocationThrowing(this._gl, this._shaderProgram, 'uHeatMin');
        this._heatMaxLocation = ShaderUtils.getUniformLocationThrowing(this._gl, this._shaderProgram, 'uHeatMax');
        this._alphaMinLocation = ShaderUtils.getUniformLocationThrowing(this._gl, this._shaderProgram, 'uAlphaMin');
        this._alphaMaxLocation = ShaderUtils.getUniformLocationThrowing(this._gl, this._shaderProgram, 'uAlphaMax');
        this._alphaStrengthLocation = ShaderUtils.getUniformLocationThrowing(this._gl, this._shaderProgram, 'uAlphaStrength');

        // Tell WebGL how to pull out the positions from the position
        // buffer into the vertexPosition attribute.
        this.setPositionAttribute();
    }

    public draw(): void {
        // render to the canvas
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
        // Tell WebGL how to convert from clip space to pixels
        this._gl.viewport(0, 0, this._gl.canvas.width, this._gl.canvas.height);
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
        this._gl.uniform1f(this._heatMinLocation, this._options.heatMinimum);
        this._gl.uniform1f(this._heatMaxLocation, this._options.heatMinimum + this._options.heatRange);
        this._gl.uniform1f(this._alphaMinLocation, this._options.transparencyMinimum);
        this._gl.uniform1f(this._alphaMaxLocation, this._options.transparencyMinimum + this._options.transparencyRange);
        this._gl.uniform1f(this._alphaStrengthLocation, this._options.transparencyStrength);
        this._textures.newHeatTexture.setUniform(this._heatTextureLocation, this._gl.TEXTURE0);
        this._textures.gradientTexture.setUniform(this._gradientTextureLocation, this._gl.TEXTURE1);
    }

    private clearScene(): void {
        this._gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
        this._gl.clearDepth(1.0); // Clear everything
        this._gl.enable(this._gl.DEPTH_TEST); // Enable depth testing
        this._gl.depthFunc(this._gl.LEQUAL); // Near things obscure far things
        this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
    }
}
