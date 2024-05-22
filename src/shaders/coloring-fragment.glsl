#version 300 es
precision lowp float;

uniform float uHeatMin;
uniform float uHeatMax;
uniform float uAlphaMin;
uniform float uAlphaMax;
uniform float uAlphaStrength;
uniform sampler2D uHeatTexture;
uniform sampler2D uGradientTexture;

in vec2 vPosition;

out vec4 outputColor;

void main(void) {
    float heat = texture(uHeatTexture, (vPosition + 1.f) * 0.5f, 0.f).x;
    vec3 color = texture(uGradientTexture, vec2(0.5f, smoothstep(uHeatMin, uHeatMax, heat)), 0.f).xyz;
    float alpha = smoothstep(uAlphaMin, uAlphaMax, heat) * uAlphaStrength;
    outputColor = vec4(color, alpha);
}