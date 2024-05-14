#version 300 es

in vec4 aVertexPosition;

out lowp vec2 vPosition;

void main(void) {
    gl_Position = aVertexPosition;
    vPosition = aVertexPosition.xy;
}