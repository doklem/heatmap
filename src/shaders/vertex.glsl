#version 300 es
precision lowp float;

in vec4 aVertexPosition;

out vec2 vPosition;

void main(void) {
    gl_Position = aVertexPosition;
    vPosition = aVertexPosition.xy;
}