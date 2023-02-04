#version 300 es

precision mediump float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aUv;

layout(location = 5) in vec4 aJoints;
layout(location = 6) in vec4 aWeights;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform mat4 normal;
uniform mat4 modelView;
uniform mat4 modelViewInverse;

uniform vec3 cameraPosition;

out vec2 Uv;

out vec3 Normal;
out vec3 ViewPosition;
out vec3 WorldPosition;
out vec3 Eye;
out vec3 WorldNormal;

uniform sampler2D jointTexture;
uniform mat4 jointTransforms[128];
uniform float jointCount;

mat4 getJointMatrix(int jointNdx) {
  return mat4(
    texelFetch(jointTexture, ivec2(0, jointNdx), 0),
    texelFetch(jointTexture, ivec2(1, jointNdx), 0),
    texelFetch(jointTexture, ivec2(2, jointNdx), 0),
    texelFetch(jointTexture, ivec2(3, jointNdx), 0));
}

void main() {

	vec3 position 			= aPosition;
	vec3 worldSpacePosition	= ( model * vec4( position, 1.0 ) ).xyz;

	// get the world space normal
	Normal						= ( normal * vec4( aNormal, 0.0 ) ).xyz;
	WorldPosition				= worldSpacePosition;

	Eye				= normalize( cameraPosition - worldSpacePosition);
	vec3 N				= ( model * vec4( aNormal, 0.0 ) ).xyz;

	mat4 skinMatrix = mat4(0.0);

	mat4 boneMatX = getJointMatrix(int(aJoints.x));
	mat4 boneMatY = getJointMatrix(int(aJoints.y));
	mat4 boneMatZ = getJointMatrix(int(aJoints.z));
	mat4 boneMatW = getJointMatrix(int(aJoints.w));

	// mat4 boneMatX = jointTransforms[int(aJoints.x)];
	// mat4 boneMatY = jointTransforms[int(aJoints.y)];
	// mat4 boneMatZ = jointTransforms[int(aJoints.z)];
	// mat4 boneMatW = jointTransforms[int(aJoints.w)];

	skinMatrix += boneMatX * aWeights.x;
	skinMatrix += boneMatY * aWeights.y;
	skinMatrix += boneMatZ * aWeights.z;
	skinMatrix += boneMatW * aWeights.w;

	WorldNormal = (skinMatrix * vec4(N, 0.0)).xyz;

	vec4 bindPos = vec4(position, 1.0);
	vec4 transformed = vec4(0.0);
	
	transformed += boneMatX * bindPos * aWeights.x;
	transformed += boneMatY * bindPos * aWeights.y;
	transformed += boneMatZ * bindPos * aWeights.z;
	transformed += boneMatW * bindPos * aWeights.w;

	vec3 pos = transformed.xyz;

  	gl_Position	= projection * view * model * vec4( pos, 1.0 );

	Uv			= aUv;
}