#version 300 es
precision lowp float;

uniform float uDecrement;
uniform sampler2D uHeatTexture;

in vec2 vPosition;

out vec4 outputColor;

void main(void) {
    float heat = max(texture(uHeatTexture, (vPosition + 1.f) * 0.5f, 0.f).x - uDecrement, 0.f);
    outputColor = vec4(heat, 0.f, 0.f, 0.f);
}