import { GUI } from 'lil-gui';
import { Heatmap } from './heatmap';

export class Program {

    private static readonly DISPLAY_WIDTH = 800;
    private static readonly DISPLAY_HEIGHT = 800;

    private readonly _display: HTMLCanvasElement;
    private readonly _heatmap: Heatmap;

    constructor() {
        this._display = document.getElementById('display') as HTMLCanvasElement;
        this._display.width = Program.DISPLAY_WIDTH;
        this._display.height = Program.DISPLAY_HEIGHT;

        // Initialize the GL context
        const gl = this._display.getContext('webgl2');

        // Only continue if WebGL is available and working
        if (gl === null) {
            throw new Error('Unable to initialize WebGL. Your browser or machine may not support it.');
        }

        this._heatmap = new Heatmap(gl);
        this._display.addEventListener('mousemove', evt => this.onMouseMove(evt));
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
        gui.add(this._heatmap.options, 'pointSize', 0, 2, 0.01).name('Point Size');
        gui.add(this._heatmap.options, 'pointRange', 0, 2, 0.01).name('Point Range');
        gui.add(this._heatmap.options, 'heatMinimum', 0, 100, 0.1).name('Heat Minimum');
        gui.add(this._heatmap.options, 'heatRange', 0, 1000, 0.1).name('Heat Range');
        gui.addColor(this._heatmap.options, 'colorCold').name('Color Cold');
        gui.addColor(this._heatmap.options, 'colorHot').name('Color Hot');
        gui.add(this._heatmap.options, 'transparencyMinimum', 0, 100, 0.1).name('Transparency Minimum');
        gui.add(this._heatmap.options, 'transparencyRange', 0, 1000, 0.1).name('Transparency Range');
        gui.add(this._heatmap.options, 'transparencyStrength', 0, 1, 0.01).name('Transparency Strength');
        return gui;
    }

    private onMouseMove(evt: MouseEvent): void {
        if (evt.buttons === 0) {
            return;
        }
        var rect = this._display.getBoundingClientRect();
        this._heatmap.addPoint(evt.clientX - rect.left, evt.clientY - rect.top);
        evt.stopImmediatePropagation();
    }
}

try {
    new Program().main();
}
catch (e) {    
    alert(e);
}