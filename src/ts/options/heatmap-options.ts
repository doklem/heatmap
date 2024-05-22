import { AddPointsRenderNodeOptions } from './add-points-render-node-options';
import { ColorRenderNodeOptions } from './color-render-node-options';

export class HeatmapOptions {
    public readonly addPoints = new AddPointsRenderNodeOptions();
    public readonly color = new ColorRenderNodeOptions();
}