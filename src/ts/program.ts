import { GUI } from 'lil-gui';
import { Heatmap } from './heatmap';

export class Program {

    private readonly _display: HTMLCanvasElement;
    private readonly _heatmap: Heatmap;

    private _scaleX: number;
    private _scaleY: number;

    constructor() {
        this._display = document.getElementById('display') as HTMLCanvasElement;
        this._heatmap = new Heatmap(this._display);
        this._scaleX = 0;
        this._scaleY = 0;
        this.calculateScale();
        this.initiaizeGUI();
        this._display.addEventListener('mousemove', this.onMouseMove, false);
        this._display.addEventListener('touchmove', this.onTouchMove, false);
        window.addEventListener('resize', this.onResize, false);
    }

    public dispose() {
        this._display.removeEventListener('mousemove', this.onMouseMove, false);
        this._display.removeEventListener('touchmove', this.onTouchMove, false);
        window.removeEventListener('resize', this.onResize, false);
        this._heatmap.dispose();
    }

    public main(): void {
        requestAnimationFrame(() => {
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
        gui.add(this._heatmap.options, 'transparencyMinimum', 0, 100, 0.1).name('Transparency Minimum');
        gui.add(this._heatmap.options, 'transparencyRange', 0, 1000, 0.1).name('Transparency Range');
        gui.add(this._heatmap.options, 'transparencyStrength', 0, 1, 0.01).name('Transparency Strength');
        gui.add(this._heatmap, 'resolutionWidth', 1, 512, 1).name('Resolution Width').onFinishChange(() => this.calculateScale());
        gui.add(this._heatmap, 'resolutionHeight', 1, 512, 1).name('Resolution Height').onFinishChange(() => this.calculateScale());
        return gui;
    }

    private onMouseMove = (event: MouseEvent): void => {
        if (event.buttons === 0) {
            return;
        }
        var rect = this._display.getBoundingClientRect(); // abs. size of element
        this._heatmap.addPoint(
            (event.clientX - rect.left) * this._scaleX,
            (event.clientY - rect.top) * this._scaleY);
        event.stopImmediatePropagation();
    }

    private onTouchMove = (event: TouchEvent): void => {
        if (event.touches.length < 1) {
            return;
        }
        var rect = this._display.getBoundingClientRect(); // abs. size of element
        this._heatmap.addPoint(
            (event.touches[0].clientX - rect.left) * this._scaleX,
            (event.touches[0].clientY - rect.top) * this._scaleY);
        event.stopImmediatePropagation();
    }

    private onResize = (): void => {
        this.calculateScale();
    }

    private calculateScale(): void {
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