#version 300 es
precision lowp float;

const vec2 cPointsCount = vec2(100., 100.);

uniform float uPointMin;
uniform float uPointMax;
uniform float uHeatMin;
uniform float uHeatMax;
uniform float uAlphaMin;
uniform float uAlphaMax;
uniform float uAlphaStrength;
uniform sampler2D uPointsTexture;
uniform sampler2D uHeatTexture;

in vec2 vPosition;

out vec4 outputColor;

void main(void) {
    float heat = 0.f;
    for(float x = 0.f; x < cPointsCount.x; x++) {
        for(float y = 0.f; y < cPointsCount.y; y++) {
            heat += 1.f - smoothstep(uPointMin, uPointMax, distance( //ToDo: Use distance squared
            vPosition, texture(uPointsTexture, vec2(x, y) / cPointsCount, 0.).xy));
        }
    }

    vec3 color = texture(uHeatTexture, vec2(0.5f, smoothstep(uHeatMin, uHeatMax, heat)), 0.).xyz;
    float alpha = smoothstep(uAlphaMin, uAlphaMax, heat) * uAlphaStrength;
    outputColor = vec4(color, alpha);
}