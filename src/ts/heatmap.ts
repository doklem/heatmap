import { ClipSpaceQuad } from './clip-space-quad';
import { HeatmapOptions } from './options/heatmap-options';
import { IncrementRenderNode } from './render-nodes/increment-render-node';
import { ColoringRenderNode } from './render-nodes/coloring-render-node';
import { DecrementRenderNode } from './render-nodes/decrement-render-node';
import { TextureStore } from './render-nodes/texture-store';

export class Heatmap {

    public static readonly POINTS_BATCH_MAX_SIZE = 1000; //Needs to be the same as in the increment shader

    private readonly _gradient: HTMLImageElement;
    private readonly _newPoints: number[];

    private _quad?: ClipSpaceQuad;
    private _textures?: TextureStore;
    private _incrementRenderNode?: IncrementRenderNode;
    private _coloringRenderNode?: ColoringRenderNode;
    private _decrementRenderNode?: DecrementRenderNode;
    private _lastDecrement: DOMHighResTimeStamp;
    private _lastBackup: DOMHighResTimeStamp;
    private _backup: Float32Array;

    public readonly options: HeatmapOptions;

    constructor(private readonly _canvas: HTMLCanvasElement | OffscreenCanvas) {
        this.options = new HeatmapOptions();
        this._newPoints = [];
        this._lastDecrement = 0;
        this._lastBackup = 0;
        this._backup = new Float32Array(this.options.width * this.options.height);

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

    public addUvPoint(u: number, v: number): void {
        this._newPoints.push(u);
        this._newPoints.push(v);
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
        if (!this._textures || !this._coloringRenderNode || !this._incrementRenderNode || !this._decrementRenderNode) {
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
        if (time - this._lastBackup > this.options.backupCadence) {
            this._incrementRenderNode.readHeatTexture(this._backup);
            this._lastBackup = time;
        }
    }

    public restart(): void {
        if (!this._quad) {
            return;
        }
        this._backup = new Float32Array(this.options.width * this.options.height);
        this.start(this._quad);
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
        this._quad = new ClipSpaceQuad(gl);
        this.start(this._quad);
    }

    private start(quad: ClipSpaceQuad): void {
        this._lastDecrement = performance.now();
        this._lastBackup = performance.now();
        this.options.coloring.needsUpdate = true;
        this._textures = new TextureStore(quad.gl, this._gradient, this._backup, this.options.width, this.options.height);
        this._incrementRenderNode = new IncrementRenderNode(quad, this._textures, this.options.increment);
        this._coloringRenderNode = new ColoringRenderNode(quad, this._textures, this.options.coloring);
        this._decrementRenderNode = new DecrementRenderNode(quad, this._textures, this.options.decrement);
    }
}
