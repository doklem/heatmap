#version 300 es
precision lowp float;

uniform vec2 uPointsBatch[100];
uniform int uPointsBatchSize;
uniform float uPointMin;
uniform float uPointMax;
uniform float uHeatMax;
uniform sampler2D uHeatTexture;

in vec2 vPosition;

out vec4 outputColor;

float distanceSquare(vec2 pointA, vec2 pointB) {
    vec2 delta = abs(pointB - pointA);
    return delta.x * delta.x + delta.y * delta.y;
}

void main(void) {
    float heat = texture(uHeatTexture, (vPosition + 1.f) * 0.5f, 0.f).x;
    for(int i = 0; i < uPointsBatchSize; i++) {
        heat += 1.f - smoothstep(uPointMin, uPointMax, distanceSquare(vPosition, uPointsBatch[i]));
    }
    outputColor = vec4(min(heat, uHeatMax), 0.f, 0.f, 0.f);
}