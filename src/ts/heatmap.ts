import { ClipSpaceQuad } from './clip-space-quad';
import { HeatmapRenderNode } from './heatmap-render-node';
import { HeatmapOptions } from './heatmap-options';

export class Heatmap {

    private static readonly MAX_POINTS_WIDTH = 100;
    private static readonly MAX_POINTS_HEIGHT = 100;
    private static readonly MAX_POINTS = Heatmap.MAX_POINTS_WIDTH * Heatmap.MAX_POINTS_HEIGHT;

    private readonly _heatGradient: HTMLImageElement;
    private readonly _pointsTextureData: Float32Array;

    private _renderNode?: HeatmapRenderNode;

    private _pointsDataIndex = 0;
    private _pointsChanged = true;
    private _viewportChanged = false;

    public get resolutionWidth(): number {
        return this._canvas.width;
    }

    public set resolutionWidth(value: number) {
        this._canvas.width = value;
        this._viewportChanged = true;
    }

    public get resolutionHeight(): number {
        return this._canvas.height;
    }

    public set resolutionHeight(value: number) {
        this._canvas.height = value;
        this._viewportChanged = true;
    }

    public readonly options: HeatmapOptions;

    constructor(private readonly _canvas: HTMLCanvasElement | OffscreenCanvas) {
        this.options = new HeatmapOptions();

        // Set the initial canvas size.
        this._canvas.width = 128;
        this._canvas.height = 128;

        this._pointsTextureData = new Float32Array(Heatmap.MAX_POINTS * ClipSpaceQuad.POSITION_COMPONENT_NUMBER);
        this._pointsTextureData.fill(ClipSpaceQuad.CLIP_SPACE_RANGE * 1000); // Some point outside the view

        // Start rendering after the heat gradient image is loaded.
        this._heatGradient = new Image();
        this._heatGradient.src = 'dist/assets/heat-gradient.png';
        this._heatGradient.addEventListener(
            'load',
            () => {
                this._canvas.addEventListener('webglcontextlost', this.onRenderContextLost, false);
                this._canvas.addEventListener('webglcontextrestored', this.onRenderContextRestored, false);
                this.initializeRendering();
            },
            { once: true });
    }

    public addPoint(x: number, y: number): void {
        this._pointsTextureData.set(
            ClipSpaceQuad.toClipSpaceCoordinate(x, y, this.resolutionWidth, this.resolutionHeight),
            this._pointsDataIndex * ClipSpaceQuad.POSITION_COMPONENT_NUMBER);
        this._pointsDataIndex = (this._pointsDataIndex + 1) % Heatmap.MAX_POINTS;
        this._pointsChanged = true;
        this.options.configChanged = true;
    }

    public dispose(): void {
        this._canvas.removeEventListener('webglcontextlost', this.onRenderContextLost, false);
        this._canvas.removeEventListener('webglcontextrestored', this.onRenderContextRestored, false);
        this._renderNode?.gl.getExtension('WEBGL_lose_context')?.loseContext();
    }

    public drawScene(): void {
        if (!this._renderNode) {
            return;
        }
        if (this.options.configChanged || this._viewportChanged || this._pointsChanged) {
            this.options.configChanged = false;
            this._renderNode.drawScene(this._viewportChanged, this._pointsChanged);
            this._viewportChanged = false;
            this._pointsChanged = false;
        }
    }

    private onRenderContextLost = (event: Event): void => {
        console.warn('Lost render context');
        this._renderNode = undefined;
        event.preventDefault();
    }

    private onRenderContextRestored = (event: Event): void => {
        this.initializeRendering();
        event.preventDefault();
    }

    private initializeRendering(): void {
        console.info('Initiaizing scene');
        const gl = this._canvas.getContext('webgl2');
        if (gl === null) {
            throw new Error('Unable to obtain a WebGL2 context');
        }
        this._renderNode = new HeatmapRenderNode(
            gl,
            this.options,
            this._pointsTextureData,
            Heatmap.MAX_POINTS_WIDTH,
            Heatmap.MAX_POINTS_HEIGHT,
            this._heatGradient);
    }
}
