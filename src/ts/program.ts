import { GUI } from 'lil-gui';
import { Heatmap } from './heatmap';

export class Program {

    private readonly _display: HTMLCanvasElement;
    private readonly _heatmap: Heatmap;

    private _scaleX: number;
    private _scaleY: number;

    constructor() {
        this._display = document.getElementById('display') as HTMLCanvasElement;

        // Initialize the GL context
        const gl = this._display.getContext('webgl2');

        // Only continue if WebGL is available and working
        if (gl === null) {
            throw new Error('Unable to initialize WebGL. Your browser or machine may not support it.');
        }

        this._heatmap = new Heatmap(gl);
        this._display.width = this._heatmap.resolutionWidth;
        this._display.height = this._heatmap.resolutionHeight;
        this._scaleX = 0;
        this._scaleY = 0;
        this.onResize(); // Calculate the scale.
        this._display.addEventListener('mousemove', evt => this.onMouseMove(evt));
        window.addEventListener('resize', () => this.onResize());
        this.initiaizeGUI();
    }

    /**
     * Draw loop.
     */
    public main(): void {
        requestAnimationFrame(() => {
            if (!this._heatmap) {
                return;
            }
            this._heatmap.drawScene();
            this.main();
        });
    }

    private initiaizeGUI(): GUI {
        const gui = new GUI(
            {
                title: 'Heatmap',
                width: 300,
            }
        );
        gui.add(this._heatmap, 'pointSize', 0, 2, 0.01).name('Point Size');
        gui.add(this._heatmap, 'pointRange', 0, 2, 0.01).name('Point Range');
        gui.add(this._heatmap, 'heatMinimum', 0, 100, 0.1).name('Heat Minimum');
        gui.add(this._heatmap, 'heatRange', 0, 1000, 0.1).name('Heat Range');
        gui.addColor(this._heatmap, 'colorCold').name('Color Cold');
        gui.addColor(this._heatmap, 'colorHot').name('Color Hot');
        gui.add(this._heatmap, 'transparencyMinimum', 0, 100, 0.1).name('Transparency Minimum');
        gui.add(this._heatmap, 'transparencyRange', 0, 1000, 0.1).name('Transparency Range');
        gui.add(this._heatmap, 'transparencyStrength', 0, 1, 0.01).name('Transparency Strength');
        gui.add(this._heatmap, 'resolutionWidth', 1, 512, 1).name('Resolution Width').onFinishChange(() => this.onResize());
        gui.add(this._heatmap, 'resolutionHeight', 1, 512, 1).name('Resolution Height').onFinishChange(() => this.onResize());
        return gui;
    }

    private onMouseMove(evt: MouseEvent): void {
        if (evt.buttons === 0) {
            return;
        }
        var rect = this._display.getBoundingClientRect(); // abs. size of element
        this._heatmap.addPoint(
            (evt.clientX - rect.left) * this._scaleX,
            (evt.clientY - rect.top) * this._scaleY);
        evt.stopImmediatePropagation();
    }

    private onResize(): void {
        var rect = this._display.getBoundingClientRect(); // abs. size of element
        this._scaleX = this._heatmap.resolutionWidth / rect.width;  // relationship bitmap vs. element for x
        this._scaleY = this._heatmap.resolutionHeight / rect.height;// relationship bitmap vs. element for y
    }
}

try {
    new Program().main();
}
catch (e) {
    alert(e);
}