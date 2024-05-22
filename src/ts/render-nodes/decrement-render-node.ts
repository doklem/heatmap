import FragmentShaderSource from './../../shaders/decrement-fragment.glsl';
import { ClipSpaceQuad } from '../clip-space-quad';
import { DecrementRenderNodeOptions } from '../options/decrement-render-node-options';
import { ShaderUtils } from '../shader-utils';
import { RenderNodeBase } from './render-node-base';
import { TextureStore } from './texture-store';

export class DecrementRenderNode extends RenderNodeBase {

    private readonly _decrementLocation: WebGLUniformLocation;
    private readonly _framebuffer: WebGLFramebuffer;
    private readonly _heatTextureLocation: WebGLUniformLocation;

    protected readonly _shaderProgram: WebGLProgram;

    constructor(
        quad: ClipSpaceQuad,
        textures: TextureStore,
        private readonly _options: DecrementRenderNodeOptions) {
        super(quad, textures);

        // Create and bind the framebuffer
        const framebuffer = this._gl.createFramebuffer();
        if (framebuffer === null) {
            throw new Error('Unable to create framebuffer');
        }
        this._framebuffer = framebuffer;
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, framebuffer);

        // Initialize a shader program; this is where all the lighting
        // for the vertices and so forth is established.
        this._shaderProgram = ShaderUtils.initializeShaderProgram(this._gl, FragmentShaderSource);

        // Collect all the info needed to use the shader program.
        // Look up which attributes our shader program is using
        // for aVertexPosition, aVertexColor and also
        // look up uniform locations.
        this._heatTextureLocation = ShaderUtils.getUniformLocationThrowing(this._gl, this._shaderProgram, 'uHeatTexture');
        this._decrementLocation = ShaderUtils.getUniformLocationThrowing(this._gl, this._shaderProgram, 'uDecrement');

        // Tell WebGL how to pull out the positions from the position
        // buffer into the vertexPosition attribute.
        this.setPositionAttribute();
    }

    public draw(): void {
        // render to texture with the ping pong pattern
        this._textures.toggleHeatTexture();
        // render to our output Texture by binding the framebuffer
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._framebuffer);
        // attach the output texture as the first color attachment
        this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._gl.COLOR_ATTACHMENT0, this._gl.TEXTURE_2D, this._textures.newHeatTexture.texture, 0);
        // Tell WebGL how to convert from clip space to pixels
        this._gl.viewport(0, 0, this._textures.resolutionWidth, this._textures.resolutionHeight);
        // Clear the attachment(s).
        this.clearScene();
        // Tell WebGL to use our program when drawing.
        this._gl.useProgram(this._shaderProgram);
        // Set the shader uniforms.
        this.applyUniforms();
        // Draw the scene.
        this._quad.draw();
    }

    private applyUniforms(): void {
        this._gl.uniform1f(this._decrementLocation, this._options.step);
        this._textures.oldHeatTexture.setUniform(this._heatTextureLocation, this._gl.TEXTURE0);
    }

    private clearScene(): void {
        this._gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
        this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
    }
}