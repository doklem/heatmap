export class HeatmapOptions {

    private _transparencyMinimum = 0;
    private _transparencyRange = 10;
    private _transparencyStrength = 1;
    private _pointSize = 0.02;
    private _pointRange = 0.2;
    private _heatMinimum = 10;
    private _heatRange = 100;
    
    public configChanged = true;

    public get transparencyMinimum(): number {
        return this._transparencyMinimum;
    }

    public set transparencyMinimum(value: number) {
        this._transparencyMinimum = value;
        this.configChanged = true;
    }

    public get transparencyRange(): number {
        return this._transparencyRange;
    }

    public set transparencyRange(value: number) {
        this._transparencyRange = value;
        this.configChanged = true;
    }

    public get transparencyStrength(): number {
        return this._transparencyStrength;
    }

    public set transparencyStrength(value: number) {
        this._transparencyStrength = value;
        this.configChanged = true;
    }

    public get pointSize(): number {
        return this._pointSize;
    }

    public set pointSize(value: number) {
        this._pointSize = value;
        this.configChanged = true;
    }

    public get pointRange(): number {
        return this._pointRange;
    }

    public set pointRange(value: number) {
        this._pointRange = value;
        this.configChanged = true;
    }

    public get heatMinimum(): number {
        return this._heatMinimum;
    }

    public set heatMinimum(value: number) {
        this._heatMinimum = value;
        this.configChanged = true;
    }

    public get heatRange(): number {
        return this._heatRange;
    }

    public set heatRange(value: number) {
        this._heatRange = value;
        this.configChanged = true;
    }
}