import FragmentShaderSource from './../../shaders/add-points-fragment.glsl';
import { ClipSpaceQuad } from '../clip-space-quad';
import { ShaderUtils } from '../shader-utils';
import { TextureWrapper } from '../texture-wrapper';
import { RenderNodeBase } from './render-node-base';
import { AddPointsRenderNodeOptions } from '../options/add-points-render-node-options';

export class AddPointsRenderNode extends RenderNodeBase {

    private readonly _pointsBatchLocation: WebGLUniformLocation;
    private readonly _pointsBatchSizeLocation: WebGLUniformLocation;
    private readonly _pointMinLocation: WebGLUniformLocation;
    private readonly _pointMaxLocation: WebGLUniformLocation;
    private readonly _framebuffer: WebGLFramebuffer;
    private readonly _heatTextureLocation: WebGLUniformLocation;
    private readonly _heatTexturePing: TextureWrapper;
    private readonly _heatTexturePong: TextureWrapper;

    private _renderToPing: boolean;

    protected readonly _shaderProgram: WebGLProgram;

    public get outputTexture(): TextureWrapper {
        return this._renderToPing ? this._heatTexturePing : this._heatTexturePong;
    }

    constructor(
        quad: ClipSpaceQuad,
        private readonly _options: AddPointsRenderNodeOptions) {
        super(quad);

        // Create the textures.
        this._renderToPing = false;
        this._heatTexturePing = new TextureWrapper(
            this._gl,
            this._gl.TEXTURE_2D,
            this._gl.NEAREST,
            this._gl.CLAMP_TO_EDGE,
            0, // Use the base level, since we do not want to use mips.
            this._gl.R32F, // Only one channel is needed to represent the heat.
            this._gl.RED,
            this._gl.FLOAT,
            1);
        this._heatTexturePing.initializeEmpty(_options.resolutionWidth, _options.resolutionHeight);
        this._heatTexturePong = new TextureWrapper(
            this._gl,
            this._gl.TEXTURE_2D,
            this._gl.NEAREST,
            this._gl.CLAMP_TO_EDGE,
            0, // Use the base level, since we do not want to use mips.
            this._gl.R32F, // Only one channel is needed to represent the heat.
            this._gl.RED,
            this._gl.FLOAT,
            1);
        this._heatTexturePong.initializeEmpty(_options.resolutionWidth, _options.resolutionHeight);

        // Create and bind the framebuffer
        const framebuffer = this._gl.createFramebuffer();
        if (framebuffer === null) {
            throw new Error('Unable to create framebuffer');
        }
        this._framebuffer = framebuffer;
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, framebuffer);

        // attach the output texture as the first color attachment
        this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._gl.COLOR_ATTACHMENT0, this._gl.TEXTURE_2D, this.outputTexture.texture, 0);

        // Initialize a shader program; this is where all the lighting
        // for the vertices and so forth is established.
        this._shaderProgram = ShaderUtils.initializeShaderProgram(this._gl, FragmentShaderSource);

        // Collect all the info needed to use the shader program.
        // Look up which attributes our shader program is using
        // for aVertexPosition, aVertexColor and also
        // look up uniform locations.
        this._heatTextureLocation = ShaderUtils.getUniformLocationThrowing(this._gl, this._shaderProgram, 'uHeatTexture');
        this._pointsBatchLocation = ShaderUtils.getUniformLocationThrowing(this._gl, this._shaderProgram, 'uPointsBatch');
        this._pointsBatchSizeLocation = ShaderUtils.getUniformLocationThrowing(this._gl, this._shaderProgram, 'uPointsBatchSize');
        this._pointMinLocation = ShaderUtils.getUniformLocationThrowing(this._gl, this._shaderProgram, 'uPointMin');
        this._pointMaxLocation = ShaderUtils.getUniformLocationThrowing(this._gl, this._shaderProgram, 'uPointMax');

        // Tell WebGL how to pull out the positions from the position
        // buffer into the vertexPosition attribute.
        this.setPositionAttribute();
    }

    public draw(pointsBatch: Float32Array): void {
        // render to texture with the ping pong pattern
        this._renderToPing = !this._renderToPing;
        // render to our output Texture by binding the framebuffer
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._framebuffer);
        // attach the output texture as the first color attachment
        this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._gl.COLOR_ATTACHMENT0, this._gl.TEXTURE_2D, this.outputTexture.texture, 0);
        // Tell WebGL how to convert from clip space to pixels
        this._gl.viewport(0, 0, this._options.resolutionWidth, this._options.resolutionHeight);
        // Clear the attachment(s).
        this.clearScene();
        // Tell WebGL to use our program when drawing.
        this._gl.useProgram(this._shaderProgram);
        // Set the shader uniforms.
        this.applyUniforms(pointsBatch);
        // Draw the scene.
        this._quad.draw();
    }

    private applyUniforms(pointsBatch: Float32Array): void {
        this._gl.uniform1f(this._pointMinLocation, AddPointsRenderNode.toDistanceSquare(this._options.pointSize));
        this._gl.uniform1f(this._pointMaxLocation, AddPointsRenderNode.toDistanceSquare(this._options.pointSize + this._options.pointRange));
        this._gl.uniform1i(this._pointsBatchSizeLocation, pointsBatch.length / ClipSpaceQuad.POSITION_COMPONENT_NUMBER);
        this._gl.uniform2fv(this._pointsBatchLocation, pointsBatch);
        if (this._renderToPing) {
            this._heatTexturePong.setUniform(this._heatTextureLocation, this._gl.TEXTURE0);
        } else {
            this._heatTexturePing.setUniform(this._heatTextureLocation, this._gl.TEXTURE0);
        }
    }

    private clearScene(): void {
        this._gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
        this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
    }

    private static toDistanceSquare(distance: number): number {
        return distance * distance;
    }
}
