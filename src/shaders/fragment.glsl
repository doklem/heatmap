#version 300 es

const int cPointsCount = 1000;

uniform lowp vec2 uPoints[cPointsCount]; //ToDo: Use a data texture instead
uniform lowp float uPointMin;
uniform lowp float uPointMax;
uniform lowp float uHeatMin;
uniform lowp float uHeatMax;
uniform lowp vec3 uColorCold;
uniform lowp vec3 uColorHot;
uniform lowp float uAlphaMin;
uniform lowp float uAlphaMax;
uniform lowp float uAlphaStrength;

in lowp vec2 vPosition;

out lowp vec4 outputColor;

void main(void) {
    lowp float heat = 0.;
    for(int j = 0; j < cPointsCount; j++) {
        heat += 1. - smoothstep(uPointMin, uPointMax, distance(vPosition, uPoints[j]));
    }
    outputColor = vec4(
        mix(
            uColorCold,
            uColorHot,
            smoothstep(uHeatMin, uHeatMax, heat)),
        smoothstep(uAlphaMin, uAlphaMax, heat) * uAlphaStrength);
}