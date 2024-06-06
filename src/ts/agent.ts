import { IPoint } from './point';

export class Agent {

    private static readonly UV_MIN = 0;
    private static readonly UV_MAX = 1;

    public readonly position: IPoint;
    public readonly velocity: IPoint;

    constructor(maxSpeed: number) {
        this.position = {
            x: Math.random(),
            y: Math.random()
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
        if (this.position.x < Agent.UV_MIN) {
            this.position.x += Agent.UV_MAX;
        } else if (this.position.x > Agent.UV_MAX) {
            this.position.x -= Agent.UV_MAX;
        }
        if (this.position.y < Agent.UV_MIN) {
            this.position.y += Agent.UV_MAX;
        } else if (this.position.y > Agent.UV_MAX) {
            this.position.y -= Agent.UV_MAX;
        }
    }

    public resetSpeed(maxSpeed: number): void {
        const doubleMaxSpeed = maxSpeed * 2;
        this.velocity.x = -maxSpeed + Math.random() * doubleMaxSpeed;
        this.velocity.y = -maxSpeed + Math.random() * doubleMaxSpeed;
    }
}