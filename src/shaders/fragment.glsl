#version 300 es

const lowp vec2 cPointsCount = vec2(100., 100.);

uniform lowp float uPointMin;
uniform lowp float uPointMax;
uniform lowp float uHeatMin;
uniform lowp float uHeatMax;
uniform lowp vec3 uColorCold;
uniform lowp vec3 uColorHot;
uniform lowp float uAlphaMin;
uniform lowp float uAlphaMax;
uniform lowp float uAlphaStrength;
uniform sampler2D uPointsTexture;

in lowp vec2 vPosition;

out lowp vec4 outputColor;

void main(void) {
    lowp float heat = 0.;
    for(lowp float x = 0.; x < cPointsCount.x; x++) {
        for(lowp float y = 0.; y < cPointsCount.y; y++) {
            heat += 1. - smoothstep(
                uPointMin,
                uPointMax,
                distance( //ToDo: Use distance squared
                    vPosition,
                    texture(uPointsTexture, vec2(x, y) / cPointsCount).xy
                    )
                );
        }
    }
    outputColor = vec4(
        mix(
            uColorCold,
            uColorHot,
            smoothstep(uHeatMin, uHeatMax, heat)),
        smoothstep(uAlphaMin, uAlphaMax, heat) * uAlphaStrength);
}