import { IPoint } from './point';

export class Agent {

    public readonly position: IPoint;
    public readonly velocity: IPoint;

    constructor(
        private _width: number,
        private _height: number,
        maxSpeed: number) {
        this.position = {
            x: Math.random() * _width,
            y: Math.random() * _height
        };
        const doubleMaxSpeed = maxSpeed * 2;
        this.velocity = {
            x: -maxSpeed + Math.random() * doubleMaxSpeed,
            y: -maxSpeed + Math.random() * doubleMaxSpeed
        };
    }

    public move(): void {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        if (this.position.x < 0) {
            this.position.x += this._width;
        } else if (this.position.x > this._width) {
            this.position.x -= this._width;
        }
        if (this.position.y < 0) {
            this.position.y += this._height;
        } else if (this.position.y > this._height) {
            this.position.y -= this._height;
        }
    }

    public resetArea(width: number, height: number): void {
        this._width = width;
        this._height = height;
        this.position.x = Math.random() * width;
        this.position.y = Math.random() * height;
    }

    public resetSpeed(maxSpeed: number): void {
        const doubleMaxSpeed = maxSpeed * 2;
        this.velocity.x = -maxSpeed + Math.random() * doubleMaxSpeed;
        this.velocity.y = -maxSpeed + Math.random() * doubleMaxSpeed;
    }
}