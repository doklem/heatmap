export class TextureWrapper {

    private readonly _target: GLenum;
    private readonly _level: GLint;
    private readonly _interalFormat: GLint;
    private readonly _format: GLenum;
    private readonly _type: GLenum;

    public readonly texture: WebGLTexture;

    constructor(
        private readonly _gl: WebGL2RenderingContext,
        target?: GLenum,
        filter?: GLint,
        wrap?: GLint,
        level?: GLint,
        internalFormat?: GLint,
        format?: GLenum,
        type?: GLenum,
        unpackAlignment?: GLint
    ) {
        this._target = target ?? _gl.TEXTURE_2D;
        this._level = level ?? 0;
        this._interalFormat = internalFormat ?? _gl.RGBA;
        this._format = format ?? _gl.RGBA;
        this._type = type ?? _gl.UNSIGNED_BYTE;

        const texture = _gl.createTexture();
        if (texture === null) {
            throw new Error('Unable to initialize texture');
        }
        _gl.bindTexture(this._target, texture);

        if (unpackAlignment !== undefined) {
            _gl.pixelStorei(_gl.UNPACK_ALIGNMENT, unpackAlignment);
        }

        _gl.texParameteri(this._target, _gl.TEXTURE_MIN_FILTER, filter ?? _gl.LINEAR);
        _gl.texParameteri(this._target, _gl.TEXTURE_MAG_FILTER, filter ?? _gl.LINEAR);
        _gl.texParameteri(this._target, _gl.TEXTURE_WRAP_S, wrap ?? _gl.CLAMP_TO_EDGE);
        _gl.texParameteri(this._target, _gl.TEXTURE_WRAP_T, wrap ?? _gl.CLAMP_TO_EDGE);

        this.texture = texture;
    }

    public loadFormImageSource(image: TexImageSource): void {
        this._gl.bindTexture(this._target, this.texture);
        this._gl.texImage2D(this._target, this._level, this._interalFormat, this._format, this._type, image);
    }

    public loadFromArray(data: ArrayBufferView, width: number, height: number): void {
        this._gl.bindTexture(this._target, this.texture);
        this._gl.texImage2D(this._target, this._level, this._interalFormat, width, height, 0, this._format, this._type, data);
    }

    public setUniform(location: WebGLUniformLocation, index: GLenum): void {
        this._gl.uniform1i(location, index - this._gl.TEXTURE0);
        this._gl.activeTexture(index);
        this._gl.bindTexture(this._target, this.texture);
    }
}