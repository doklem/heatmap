import { ClipSpaceQuad } from './clip-space-quad';
import { HeatmapOptions } from './options/heatmap-options';
import { IPoint } from './point';
import { IncrementRenderNode } from './render-nodes/increment-render-node';
import { ColoringRenderNode } from './render-nodes/coloring-render-node';
import { DecrementRenderNode } from './render-nodes/decrement-render-node';
import { TextureStore } from './render-nodes/texture-store';

export class Heatmap {

    private static readonly POINTS_BATCH_MAX_SIZE = 100; //Needs to be the same as in the heat shader

    private readonly _gradient: HTMLImageElement;
    private readonly _newPoints: number[];

    private _quad?: ClipSpaceQuad;
    private _textures?: TextureStore;
    private _incrementRenderNode?: IncrementRenderNode;
    private _coloringRenderNode?: ColoringRenderNode;
    private _decrementRenderNode?: DecrementRenderNode;
    private _lastDecrement: DOMHighResTimeStamp;

    public readonly options: HeatmapOptions;

    constructor(private readonly _canvas: HTMLCanvasElement | OffscreenCanvas) {
        this.options = new HeatmapOptions();
        this._newPoints = [];
        this._lastDecrement = 0;

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
        const clipSpacePoint = ClipSpaceQuad.toClipSpaceCoordinate(point, this.options.width, this.options.height);
        this._newPoints.push(clipSpacePoint.x);
        this._newPoints.push(clipSpacePoint.y);
    }

    public dispose(): void {
        this._canvas.removeEventListener('webglcontextlost', this.onRenderContextLost, false);
        this._canvas.removeEventListener('webglcontextrestored', this.onRenderContextRestored, false);
        this._quad?.gl.getExtension('WEBGL_lose_context')?.loseContext();
        delete this._coloringRenderNode;
        delete this._incrementRenderNode;
        delete this._decrementRenderNode;
        delete this._textures;
        delete this._quad;
    }

    public drawScene(time: DOMHighResTimeStamp): void {
        if (!this._coloringRenderNode || !this._incrementRenderNode || !this._decrementRenderNode) {
            return;
        }
        const doesDecrement = time - this._lastDecrement > this.options.decrement.cadence;
        if (doesDecrement) {
            this._lastDecrement = time;
            this._decrementRenderNode.draw();
        }
        const pointsBatch = this._newPoints.splice(0, Math.min(this._newPoints.length, Heatmap.POINTS_BATCH_MAX_SIZE * ClipSpaceQuad.POSITION_COMPONENT_NUMBER));
        if (pointsBatch.length > 0) {
            this._incrementRenderNode.draw(new Float32Array(pointsBatch));
        }
        if (doesDecrement || pointsBatch.length > 0 || this.options.coloring.needsUpdate) {
            this.options.coloring.needsUpdate = false;
            this._coloringRenderNode.draw();
        }
    }

    public restart(): void {
        if (!this._quad) {
            return;
        }
        this._lastDecrement = 0;
        this.options.coloring.needsUpdate = true;
        this._textures = new TextureStore(this._quad.gl, this._gradient, this.options.width, this.options.height);
        this._incrementRenderNode = new IncrementRenderNode(this._quad, this._textures, this.options.increment);
        this._coloringRenderNode = new ColoringRenderNode(this._quad, this._textures, this.options.coloring);
        this._decrementRenderNode = new DecrementRenderNode(this._quad, this._textures, this.options.decrement);
    }

    private onRenderContextLost = (event: Event): void => {
        console.warn('Lost render context');
        this._quad = undefined;
        this._textures = undefined;
        this._incrementRenderNode = undefined;
        this._coloringRenderNode = undefined;
        this._decrementRenderNode = undefined;
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
        this._lastDecrement = 0;
        this._quad = new ClipSpaceQuad(gl);
        this._textures = new TextureStore(gl, this._gradient, this.options.width, this.options.height);
        this._incrementRenderNode = new IncrementRenderNode(this._quad, this._textures, this.options.increment);
        this._coloringRenderNode = new ColoringRenderNode(this._quad, this._textures, this.options.coloring);
        this._decrementRenderNode = new DecrementRenderNode(this._quad, this._textures, this.options.decrement);
    }
}
