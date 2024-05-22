export class ColorRenderNodeOptions {

    private _transparencyMinimum = 0;
    private _transparencyRange = 150;
    private _transparencyStrength = 1;
    private _heatMinimum = 10;
    private _heatRange = 500;
    
    public needsUpdate = true;

    public get transparencyMinimum(): number {
        return this._transparencyMinimum;
    }

    public set transparencyMinimum(value: number) {
        this._transparencyMinimum = value;
        this.needsUpdate = true;
    }

    public get transparencyRange(): number {
        return this._transparencyRange;
    }

    public set transparencyRange(value: number) {
        this._transparencyRange = value;
        this.needsUpdate = true;
    }

    public get transparencyStrength(): number {
        return this._transparencyStrength;
    }

    public set transparencyStrength(value: number) {
        this._transparencyStrength = value;
        this.needsUpdate = true;
    }

    public get heatMinimum(): number {
        return this._heatMinimum;
    }

    public set heatMinimum(value: number) {
        this._heatMinimum = value;
        this.needsUpdate = true;
    }

    public get heatRange(): number {
        return this._heatRange;
    }

    public set heatRange(value: number) {
        this._heatRange = value;
        this.needsUpdate = true;
    }
}