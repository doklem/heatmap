import { IColorRGBOptions } from './color-rgb-options';

export interface IHeatmapOptions {
    transparencyMinimum: number;
    transparencyRange: number;
    transparencyStrength: number;
    pointSize: number;
    pointRange: number;
    heatMinimum: number;
    heatRange: number;
    colorCold: IColorRGBOptions;
    colorHot: IColorRGBOptions;
}