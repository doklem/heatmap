import { GUI } from 'lil-gui';
import { Heatmap } from './heatmap';
import { IHeatmapOptions } from './heatmap-options';

export class Program {

    private static readonly DISPLAY_WIDTH = 800;
    private static readonly DISPLAY_HEIGHT = 800;

    private readonly _display: HTMLCanvasElement;
    private readonly _gui: GUI;
    private readonly _settings: IHeatmapOptions;
    private readonly _heatmap?: Heatmap;

    constructor() {
        this._display = document.getElementById('display') as HTMLCanvasElement;
        this._display.width = Program.DISPLAY_WIDTH;
        this._display.height = Program.DISPLAY_HEIGHT;

        this._settings = {
            transparencyMinimum: 0,
            transparencyRange: 10,
            transparencyStrength: 1,
            pointSize: 0,
            pointRange: 0.4,
            heatMinimum: 10,
            heatRange: 100,
            colorCold: {
                r: 0,
                g: 0,
                b: 1,
            },
            colorHot: {
                r: 1,
                g: 0,
                b: 0,
            },
        };

        this._gui = this.initiaizeGUI();

        // Initialize the GL context
        const gl = this._display.getContext('webgl2');

        // Only continue if WebGL is available and working
        if (gl === null) {
            alert('Unable to initialize WebGL. Your browser or machine may not support it.');
            return;
        }

        this._heatmap = new Heatmap(gl, this._settings);

        this._display.addEventListener('mousemove', evt => this.onMouseMove(evt));
    }

    /**
     * Draw the scene.
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
        gui.add(this._settings, 'pointSize', 0, 2, 0.01).name('Point Size');
        gui.add(this._settings, 'pointRange', 0, 2, 0.01).name('Point Range');
        gui.add(this._settings, 'heatMinimum', 0, 100, 0.1).name('Heat Minimum');
        gui.add(this._settings, 'heatRange', 0, 1000, 0.1).name('Heat Range');
        gui.addColor(this._settings, 'colorCold').name('Color Cold');
        gui.addColor(this._settings, 'colorHot').name('Color Hot');
        gui.add(this._settings, 'transparencyMinimum', 0, 100, 0.1).name('Transparency Minimum');
        gui.add(this._settings, 'transparencyRange', 0, 1000, 0.1).name('Transparency Range');
        gui.add(this._settings, 'transparencyStrength', 0, 1, 0.01).name('Transparency Strength');
        return gui;
    }

    private onMouseMove(evt: MouseEvent): void {
        if (evt.buttons === 0) {
            return;
        }
        var rect = this._display.getBoundingClientRect();
        this._heatmap?.addPoint(evt.clientX - rect.left, evt.clientY - rect.top);
        evt.stopImmediatePropagation();
    }
}

new Program().main();