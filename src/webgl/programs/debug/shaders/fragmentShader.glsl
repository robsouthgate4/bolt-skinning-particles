#version 300 es

precision highp float;
in vec3		Normal;
in vec2 Uv;

uniform sampler2D map;

out vec4 FragColor;

void main() {

	// output the fragment color
	FragColor		= texture( map, Uv );

}




