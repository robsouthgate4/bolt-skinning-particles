#version 300 es

precision highp float;

out vec4 FragColor;

in vec2 Uv;
in vec3 Normal;
in vec3 Color;

struct UniformData
{
  vec3 color1;
  vec3 color2;
  vec3 color3;
};

void main()
{

  FragColor = vec4( Normal, 1.0 );

}