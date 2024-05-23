import { IncrementRenderNodeOptions } from './increment-render-node-options';
import { ColoringRenderNodeOptions } from './coloring-render-node-options';
import { DecrementRenderNodeOptions } from './decrement-render-node-options';

export class HeatmapOptions {
    public readonly increment = new IncrementRenderNodeOptions();
    public readonly coloring = new ColoringRenderNodeOptions();
    public readonly decrement = new DecrementRenderNodeOptions();
    public width = 1024;
    public height = 1024;
    public backupCadence = 5000;
}