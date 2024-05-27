import { GUI } from 'lil-gui';
import { Heatmap } from './heatmap';
import Stats from 'stats.js';

export class Program {

    private readonly _display: HTMLCanvasElement;
    private readonly _heatmap: Heatmap;
    private readonly _guiActions = {
        restart: () => this.onRestart()
    }
    private readonly _stats: Stats;

    private _scaleX: number;
    private _scaleY: number;

    constructor() {
        this._display = document.getElementById('display') as HTMLCanvasElement;
        this._stats = new Stats();
        this._stats.showPanel(0); // 0 -> fps
        document.body.appendChild(this._stats.dom);
        this._heatmap = new Heatmap(this._display);
        this._scaleX = 0;
        this._scaleY = 0;
        this.calculateScale();
        this.initiaizeGUI();
        this._display.addEventListener('mousemove', this.onMouseMove, false);
        this._display.addEventListener('touchmove', this.onTouchMove, { capture: false, passive: true });
        window.addEventListener('resize', this.onResize, false);
    }

    public animate(time: DOMHighResTimeStamp): void {
        this._stats.begin();
        this._heatmap.drawScene(time);
        this._stats.end();
        requestAnimationFrame((t: DOMHighResTimeStamp) => this.animate(t));
    }

    public dispose() {
        this._display.removeEventListener('mousemove', this.onMouseMove, false);
        this._display.removeEventListener('touchmove', this.onTouchMove, { capture: false });
        window.removeEventListener('resize', this.onResize, false);
        this._heatmap.dispose();
    }

    private initiaizeGUI(): GUI {
        const gui = new GUI({ title: 'Heatmap' });

        const fileFolder = gui.addFolder('File').close();
        fileFolder.add(this._heatmap.options.increment, 'pointSize', 0, 2, 0.01).name('Point Size');
        fileFolder.add(this._heatmap.options.increment, 'pointRange', 0, 2, 0.01).name('Point Range');
        fileFolder.add(this._heatmap.options.increment, 'heatMax', 0, 100000, 0.1).name('Heat Maximum');
        fileFolder.add(this._heatmap.options, 'width', 1, 4096, 1).name('Width');
        fileFolder.add(this._heatmap.options, 'height', 1, 4096, 1).name('Height');
        fileFolder.add(this._guiActions, 'restart').name('New');

        const editFolder = gui.addFolder('Edit');
        const heatFolder = editFolder.addFolder('Heat');
        heatFolder.add(this._heatmap.options.coloring, 'heatMinimum', 0, 1000, 0.1).name('Minimum');
        heatFolder.add(this._heatmap.options.coloring, 'heatRange', 0, 10000, 0.1).name('Range');

        const decrementFolder = editFolder.addFolder('Decrement');
        decrementFolder.add(this._heatmap.options.decrement, 'step', 0, 1000, 0.01).name('Step');
        decrementFolder.add(this._heatmap.options.decrement, 'cadence', 0, 1000, 0.01).name('Cadence (ms)');

        const transparencyFolder = editFolder.addFolder('Transparency');
        transparencyFolder.add(this._heatmap.options.coloring, 'transparencyMinimum', 0, 100, 0.1).name('Minimum');
        transparencyFolder.add(this._heatmap.options.coloring, 'transparencyRange', 0, 1000, 0.1).name('Range');
        transparencyFolder.add(this._heatmap.options.coloring, 'transparencyStrength', 0, 1, 0.01).name('Strength');

        const backupFolder = editFolder.addFolder('Backup').close();
        backupFolder.add(this._heatmap.options, 'backupCadence', 0, 10000, 0.1).name('Cadence (ms)');
        return gui;
    }

    private onMouseMove = (event: MouseEvent): void => {
        if (event.buttons === 0) {
            return;
        }
        this.addPoint(event);
        event.stopPropagation();
    }

    private onTouchMove = (event: TouchEvent): void => {
        if (event.touches.length < 1) {
            return;
        }
        this.addPoint(event.touches[0]);
        event.stopPropagation();
    }

    private addPoint(point: Touch | MouseEvent): void {
        var rect = this._display.getBoundingClientRect();
        this._heatmap.addPoint(
            {
                x: (point.clientX - rect.left) * this._scaleX,
                y: (point.clientY - rect.top) * this._scaleY
            }
        );
    }

    private onRestart(): void {
        this.calculateScale();
        this._heatmap.restart();
    }

    private onResize = (): void => {
        this.calculateScale();
    }

    private calculateScale(): void {
        var rect = this._display.getBoundingClientRect();
        this._scaleX = this._heatmap.options.width / rect.width;
        this._scaleY = this._heatmap.options.height / rect.height;
    }
}

try {
    const program = new Program();
    requestAnimationFrame((t: DOMHighResTimeStamp) => program.animate(t));
}
catch (e) {
    alert(e);
}