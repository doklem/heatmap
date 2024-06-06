#version 300 es
precision lowp float;

in vec4 aVertexPosition;

out vec2 vUv;

void main(void) {
    gl_Position = aVertexPosition;
    vUv = (aVertexPosition.xy + 1.f) * 0.5f;
}