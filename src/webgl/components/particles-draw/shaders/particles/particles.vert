#version 300 es

precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in float aScale;
layout(location = 2) in vec3 aOffset;
layout(location = 3) in float aRandom;

layout(location = 4) in vec2 reference;
layout(location = 5) in float scale;
layout(location = 6) in float jointID;


uniform mat4 projection;
uniform mat4 model;
uniform mat4 view;
uniform mat4 lightSpaceMatrix;
uniform float particleScale;
uniform float time;
uniform vec3 shakeOffset;
uniform sampler2D mapPosition;

out float Life;

void main() {

    vec4 newPos = texture(mapPosition, reference).xyzw; // xyz = position, w = life

    Life = newPos.w;

    vec3 pos = aPosition;

    vec3 transformed = newPos.xyz;

    mat4 modelView = view * model;
    mat4 mvp = projection * modelView;  

    vec4 mvPosition = modelView * vec4( transformed, 1.0 );

    gl_Position = projection * view * model * vec4( transformed, 1.0 );

    float outScale = scale * 4.0;

    gl_PointSize = outScale;

    gl_PointSize *= ( outScale / - mvPosition.z );

}