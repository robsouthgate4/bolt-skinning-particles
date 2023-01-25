#version 300 es

precision highp float;

uniform sampler2D map;
uniform sampler2D mapBloom;


in vec2 Uv;

out vec4 FragColor;

void main() {

    vec4 outColor = texture(map, Uv);
    vec4 bloomColor = texture(mapBloom, Uv);
    FragColor = outColor + bloomColor * 0.3;

}