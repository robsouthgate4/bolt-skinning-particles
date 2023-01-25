#version 300 es

precision highp float;

uniform float time;
uniform float delta;
uniform float globalSpeed;

uniform vec2 resolution;

uniform sampler2D position;
uniform sampler2D velocity;

uniform vec3 vortexAxis;

out vec4 FragColor;

mat3 rotateAroundAxis(vec3 axis, float angle) {

  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;

  return mat3(
    oc * axis.x * axis.x + c,
    oc * axis.x * axis.y - axis.z * s,
    oc * axis.z * axis.x + axis.y * s,
    oc * axis.x * axis.y + axis.z * s,
    oc * axis.y * axis.y + c,
    oc * axis.y * axis.z - axis.x * s,
    oc * axis.z * axis.x - axis.y * s,
    oc * axis.y * axis.z + axis.x * s,
    oc * axis.z * axis.z + c
  );

}

void main() {

  vec2 uv = gl_FragCoord.xy / resolution.xy;

  vec4 oldPosition = texture(position, uv).xyzw;

  vec3 vel = texture(velocity, uv).rgb;

  vec3 newPosition = oldPosition.xyz;

  newPosition += vel;

  FragColor = vec4(newPosition, oldPosition.w);

}