import { TextureWrapper } from '../texture-wrapper';

export class TextureStore {

    private readonly _heatTexturePing: TextureWrapper;
    private readonly _heatTexturePong: TextureWrapper;

    public readonly gradientTexture: TextureWrapper;

    private _renderToPing: boolean;

    public get newHeatTexture(): TextureWrapper {
        return this._renderToPing ? this._heatTexturePing : this._heatTexturePong;
    }

    public get oldHeatTexture(): TextureWrapper {
        return this._renderToPing ? this._heatTexturePong : this._heatTexturePing;
    }

    constructor(
        gl: WebGL2RenderingContext,
        gradient: TexImageSource,
        heatData: Float32Array,
        public readonly width: number,
        public readonly height: number) {
        this._renderToPing = false;

        // Create the textures.
        this.gradientTexture = new TextureWrapper(
            gl,
            gl.TEXTURE_2D,
            gl.LINEAR,
            gl.CLAMP_TO_EDGE,
            0, // Use the base level, since we do not want to use mips.
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE
        );
        this.gradientTexture.loadFormImageSource(gradient);
        this._heatTexturePing = new TextureWrapper(
            gl,
            gl.TEXTURE_2D,
            gl.NEAREST,
            gl.CLAMP_TO_EDGE,
            0, // Use the base level, since we do not want to use mips.
            gl.R32F, // Only one channel is needed to represent the heat.
            gl.RED,
            gl.FLOAT,
            1);
        this._heatTexturePing.loadFromArray(heatData, width, height);
        this._heatTexturePong = new TextureWrapper(
            gl,
            gl.TEXTURE_2D,
            gl.NEAREST,
            gl.CLAMP_TO_EDGE,
            0, // Use the base level, since we do not want to use mips.
            gl.R32F, // Only one channel is needed to represent the heat.
            gl.RED,
            gl.FLOAT,
            1);
        this._heatTexturePong.loadFromArray(heatData, width, height);
    }

    public toggleHeatTexture(): void {
        this._renderToPing = !this._renderToPing;
    }

    public readHeatTexture(framebuffer: WebGLFramebuffer, data: Float32Array): void {
        this.newHeatTexture.readFromFramebuffer(framebuffer, data, 0, 0, this.width, this.height);
    }
}