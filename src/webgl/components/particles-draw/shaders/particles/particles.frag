#version 300 es

precision highp float;

in vec2 Uv;
in vec3 Normal;
in vec4 ShadowCoord;
in vec3 FragPosition;

in float Random;


uniform sampler2D mapPosition;

uniform float time;

out vec4 FragColor;

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

#define PI 3.1415926

void main() {

    vec2 uv = gl_PointCoord.xy;
    uv.y = 1.0 - uv.y;

    if(length(uv - 0.5) > 0.5) discard;

    FragColor = vec4( vec3(0.9), 1.0 );

}