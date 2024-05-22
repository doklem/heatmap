import FragmentShaderSource from './../../shaders/increment-fragment.glsl';
import { ClipSpaceQuad } from '../clip-space-quad';
import { ShaderUtils } from '../shader-utils';
import { RenderNodeBase } from './render-node-base';
import { IncrementRenderNodeOptions } from '../options/increment-render-node-options';
import { TextureStore } from './texture-store';

export class IncrementRenderNode extends RenderNodeBase {

    private readonly _pointsBatchLocation: WebGLUniformLocation;
    private readonly _pointsBatchSizeLocation: WebGLUniformLocation;
    private readonly _pointMinLocation: WebGLUniformLocation;
    private readonly _pointMaxLocation: WebGLUniformLocation;
    private readonly _heatMaxLocation: WebGLUniformLocation;
    private readonly _framebuffer: WebGLFramebuffer;
    private readonly _heatTextureLocation: WebGLUniformLocation;

    protected readonly _shaderProgram: WebGLProgram;

    constructor(
        quad: ClipSpaceQuad,
        textures: TextureStore,
        private readonly _options: IncrementRenderNodeOptions) {
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
        this._pointsBatchLocation = ShaderUtils.getUniformLocationThrowing(this._gl, this._shaderProgram, 'uPointsBatch');
        this._pointsBatchSizeLocation = ShaderUtils.getUniformLocationThrowing(this._gl, this._shaderProgram, 'uPointsBatchSize');
        this._pointMinLocation = ShaderUtils.getUniformLocationThrowing(this._gl, this._shaderProgram, 'uPointMin');
        this._pointMaxLocation = ShaderUtils.getUniformLocationThrowing(this._gl, this._shaderProgram, 'uPointMax');
        this._heatMaxLocation = ShaderUtils.getUniformLocationThrowing(this._gl, this._shaderProgram, 'uHeatMax');

        // Tell WebGL how to pull out the positions from the position
        // buffer into the vertexPosition attribute.
        this.setPositionAttribute();
    }

    public draw(pointsBatch: Float32Array): void {
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
        this.applyUniforms(pointsBatch);
        // Draw the scene.
        this._quad.draw();
    }

    private applyUniforms(pointsBatch: Float32Array): void {
        this._gl.uniform1f(this._pointMinLocation, IncrementRenderNode.toDistanceSquare(this._options.pointSize));
        this._gl.uniform1f(this._pointMaxLocation, IncrementRenderNode.toDistanceSquare(this._options.pointSize + this._options.pointRange));
        this._gl.uniform1f(this._heatMaxLocation, this._options.heatMax);
        this._gl.uniform1i(this._pointsBatchSizeLocation, pointsBatch.length / ClipSpaceQuad.POSITION_COMPONENT_NUMBER);
        this._gl.uniform2fv(this._pointsBatchLocation, pointsBatch);
        this._textures.oldHeatTexture.setUniform(this._heatTextureLocation, this._gl.TEXTURE0);
    }

    private clearScene(): void {
        this._gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
        this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
    }

    private static toDistanceSquare(distance: number): number {
        return distance * distance;
    }
}
