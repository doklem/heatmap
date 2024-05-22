import { ClipSpaceQuad } from './clip-space-quad';
import { HeatmapOptions } from './options/heatmap-options';
import { IPoint } from './point';
import { AddPointsRenderNode } from './render-nodes/add-points-render-node';
import { ColorRenderNode } from './render-nodes/color-render-node';

export class Heatmap {

    private static readonly POINTS_BATCH_MAX_SIZE = 100; //Needs to be the same as in the heat shader

    private readonly _gradient: HTMLImageElement;
    private readonly _newPoints: number[];

    private _quad?: ClipSpaceQuad;
    private _addPointsRenderNode?: AddPointsRenderNode;
    private _colorRenderNode?: ColorRenderNode;

    public readonly options: HeatmapOptions;

    constructor(private readonly _canvas: HTMLCanvasElement | OffscreenCanvas) {
        this.options = new HeatmapOptions();
        this._newPoints = [];

        // Start rendering after the heat gradient image is loaded.
        this._gradient = new Image();
        this._gradient.src = 'dist/assets/gradient.png';
        this._gradient.addEventListener(
            'load',
            () => {
                this._canvas.addEventListener('webglcontextlost', this.onRenderContextLost, false);
                this._canvas.addEventListener('webglcontextrestored', this.onRenderContextRestored, false);
                this.initializeRendering();
            },
            { once: true });
    }

    public addPoint(point: IPoint): void {
        const clipSpacePoint = ClipSpaceQuad.toClipSpaceCoordinate(point, this.options.addPoints.resolutionWidth, this.options.addPoints.resolutionHeight);
        this._newPoints.push(clipSpacePoint.x);
        this._newPoints.push(clipSpacePoint.y);
    }

    public dispose(): void {
        this._canvas.removeEventListener('webglcontextlost', this.onRenderContextLost, false);
        this._canvas.removeEventListener('webglcontextrestored', this.onRenderContextRestored, false);
        this._quad?.gl.getExtension('WEBGL_lose_context')?.loseContext();
        delete this._colorRenderNode;
        delete this._addPointsRenderNode;
        delete this._quad;
    }

    public drawScene(): void {
        if (!this._colorRenderNode || !this._addPointsRenderNode) {
            return;
        }
        const newPoints = this._newPoints.splice(0, Math.min(this._newPoints.length, Heatmap.POINTS_BATCH_MAX_SIZE * ClipSpaceQuad.POSITION_COMPONENT_NUMBER));
        if (newPoints.length > 0) {
            this._addPointsRenderNode.draw(new Float32Array(newPoints));
        }
        if (newPoints.length > 0 || this.options.color.needsUpdate) {
            this.options.color.needsUpdate = false;
            this._colorRenderNode.draw();
        }
    }

    public restart(): void {
        if (!this._quad) {
            return;
        }
        this.options.color.needsUpdate = true;
        this._addPointsRenderNode = new AddPointsRenderNode(this._quad, this.options.addPoints);
        this._colorRenderNode = new ColorRenderNode(this._quad, this.options.color, this._addPointsRenderNode, this._gradient);
    }

    private onRenderContextLost = (event: Event): void => {
        console.warn('Lost render context');
        this._quad = undefined;
        this._addPointsRenderNode = undefined;
        this._colorRenderNode = undefined;
        event.preventDefault();
    }

    private onRenderContextRestored = (event: Event): void => {
        this.initializeRendering();
        event.preventDefault();
    }

    private initializeRendering(): void {
        console.info('Initializing scene');
        const gl = this._canvas.getContext('webgl2');
        if (gl === null) {
            throw new Error('Unable to obtain a WebGL2 context');
        }
        if (gl.getExtension('EXT_color_buffer_float') === null) {
            throw new Error('Unable to load renderbuffer float extension');
        }
        this._quad = new ClipSpaceQuad(gl);
        this._addPointsRenderNode = new AddPointsRenderNode(this._quad, this.options.addPoints);
        this._colorRenderNode = new ColorRenderNode(this._quad, this.options.color, this._addPointsRenderNode, this._gradient);
    }
}
