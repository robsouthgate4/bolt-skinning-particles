precision mediump float;

uniform sampler2D mapEnvironment;
uniform sampler2D jointTexture;
uniform sampler2D mapData;
uniform sampler2D mapIrradiance;
uniform sampler2D mapPrefilter;

uniform float		specular;
uniform float		normalHeight;

uniform mat4 view;

uniform float		exposure;
uniform float		gamma;
uniform vec2 		normalUVScale;
uniform vec2 		resolution;
uniform vec3 		albedoColor;

uniform float mask;

in vec3		Normal;
in vec3		Position;
in vec3		Eye;
in vec3		WorldPosition;
in vec2 	Uv;
in vec3 	WorldNormal;

out vec4 FragColor;

#define saturate(x) clamp(x, 0.0, 1.0)
#define PI 3.1415926
#define TwoPI (2.0 * PI)
#define LN2 0.6931472
#define gamma 2.2

float toLinear(float v) {
  return pow(v, gamma);
}

float rand(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p){
	vec2 ip = floor(p);
	vec2 u = fract(p);
	u = u*u*(3.0-2.0*u);
	
	float res = mix(
		mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
		mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
	return res*res;
}
vec2 toLinear(vec2 v) {
  return pow(v, vec2(gamma));
}

vec3 toLinear(vec3 v) {
  return pow(v, vec3(gamma));
}

vec4 toLinear(vec4 v) {
  return vec4(toLinear(v.rgb), v.a);
}

#ifdef USE_ROUGHNESS_MAP
	uniform sampler2D mapRoughness;
	float getRoughness() {
		return texture(mapRoughness, Uv).r;
	}
#else
	uniform float roughness;
	float getRoughness() {
		return roughness;
	}
#endif

#ifdef USE_METALNESS_MAP
	uniform sampler2D mapMetalness;
	float getMetalness() {
		return toLinear( texture(mapMetalness, Uv).r );
	}
#else
	uniform float metalness;
	float getMetalness() {
		return metalness;
	}
#endif

#ifdef USE_ALBEDO_MAP
	uniform sampler2D mapAlbedo;
	vec3 getAlbedo() {
		return toLinear( texture(mapAlbedo, Uv).rgb );
	}
#else
	vec3 getAlbedo() {
		return toLinear( albedoColor );
	}
#endif

#ifdef USE_AO_MAP
	uniform sampler2D mapAO;
	vec3 getAO() {
		return texture(mapAO, Uv).rgb;
	}
#endif

vec3 rgb2hsv(vec3 c)
{
	vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
	vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
	vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
	
	float d = q.x - min(q.w, q.y);
	float e = 1.0e-10;
	return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c)
{
	vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
	vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
	return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// vec3 getRefraction() {
// 	vec2 screenUV = gl_FragCoord.xy / resolution;
// 	vec3 viewDir = normalize(Eye);

// 	vec3 color = vec3(0.0);

// 	const float ITERATIONS = 10.0;

// 	float iorRed = 1.15;
// 	float iorGreen = 1.18;
// 	float iorBlue = 1.2;

// 	for (float i = 0.0; i < ITERATIONS; i++) {

// 		float slide = i / ITERATIONS * 0.05;

// 		vec3 refractDirRed = refract(viewDir, WorldNormal, 1.0 / iorRed);
// 		vec3 refractDirGreen = refract(viewDir, WorldNormal, 1.0 / iorGreen);
// 		vec3 refractDirBlue = refract(viewDir, WorldNormal, 1.0 / iorBlue);

// 		color.r += texture(mapRefraction, (screenUV + noise( screenUV * 10000. ) * 0.005) + refractDirRed.xy * (slide * 1.0) * 0.4).r;
// 		color.g += texture(mapRefraction, (screenUV + noise( screenUV * 10000. ) * 0.005) + refractDirGreen.xy * (slide * 2.0) * 0.4).g;
// 		color.b += texture(mapRefraction, (screenUV + noise( screenUV * 10000. ) * 0.005) + refractDirBlue.xy * (slide * 3.0) * 0.4).b;
		
// 	}

// 	color /= ITERATIONS;

// 	color = rgb2hsv(color);
// 	color.r *= 1.2;
// 	color.g *= 1.8;
// 	color = hsv2rgb(color);

// 	return toLinear(color);
// }


// Filmic tonemapping from
// http://filmicgames.com/archives/75

const float A = 0.15;
const float B = 0.50;
const float C = 0.10;
const float D = 0.20;
const float E = 0.02;
const float F = 0.30;

vec3 Uncharted2Tonemap( vec3 x )
{
	return ((x*(A*x+C*B)+D*E)/(x*(A*x+B)+D*F))-E/F;
}

// https://www.unrealengine.com/blog/physically-based-shading-on-mobile
vec3 EnvBRDFApprox( vec3 SpecularColor, float Roughness, float NoV )
{
	const vec4 c0 = vec4( -1, -0.0275, -0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, -0.04 );
	vec4 r = Roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( -9.28 * NoV ) ) * r.x + r.y;
	vec2 AB = vec2( -1.04, 1.04 ) * a004 + r.zw;
	return SpecularColor * AB.x + AB.y;
}


vec3 correctGamma(vec3 color, float g) {
	return pow(color, vec3(1.0/g));
}

vec2 envMapEquirect(vec3 wcNormal, float flipEnvMap) {
  //I assume envMap texture has been flipped the WebGL way (pixel 0,0 is a the bottom)
  //therefore we flip wcNorma.y as acos(1) = 0
  float phi = acos(-wcNormal.y);
  float theta = atan(flipEnvMap * wcNormal.x, wcNormal.z) + PI;
  return vec2(theta / TwoPI, phi / PI);
}

vec2 envMapEquirect(vec3 wcNormal) {
    //-1.0 for left handed coordinate system oriented texture (usual case)
    return envMapEquirect(wcNormal, -1.0);
}

vec3 RGBMDecode( vec4 rgbm ) {
	return 6.0 * rgbm.rgb * rgbm.a;
}

#ifdef USE_NORMAL_MAP
	uniform sampler2D mapNormal;
	vec3 getNormal() {

		vec3 posDx = dFdx(WorldPosition.xyz);
		vec3 posDy = dFdy(WorldPosition.xyz);

		vec2 textureDx = dFdx(Uv);
		vec2 textureDy = dFdy(Uv);

		// calculate tangent
		vec3 t = normalize(posDx * textureDy.t - posDy * textureDx.t);
		// calculate bi-normal
		vec3 b = normalize(-posDx * textureDy.s + posDy * textureDx.s);
		// generate tbn matrix
		mat3 tbn = mat3(t, b, normalize(Normal));

		vec3 n = texture(mapNormal, Uv * normalUVScale).rgb * 2.0 - 1.0;
		n.xy *= normalHeight;

		vec3 normal = normalize(tbn * n);

		return normalize( ( vec4( n, 0.0 ) * view ).xyz);
	}
#else
	vec3 getNormal() {
		return normalize(WorldNormal);
	}
#endif

vec3 getPbr(vec3 N, vec3 V, vec3 baseColor, float roughness, float metalness, float specular) {

	vec3 diffuseColor	= baseColor * (1.0 - metalness);
	vec3 specularColor	= mix( vec3( 0.08 * specular ), baseColor, specular );

	vec3 color;

	float roughness4 = pow(roughness, 4.0);

	// // sample the pre-filtered cubemap at the corresponding mipmap level
	float numMips		= 6.0;

	vec3 lookup			= normalize( -reflect( V, N ) );


	// ibl radiance / irradiance adapted from ogl.js
	vec2 uvRadiance = envMapEquirect( lookup );
	uvRadiance.y /= 2.0;

	vec2 uvIrradiance = envMapEquirect( N );

	float blend = roughness * numMips;
	float level0 = floor(blend);

	float level1 = min(numMips, level0 + 1.0);
	blend -= level0;

	vec2 uv0 = uvRadiance;
	vec2 uv1 = uvRadiance;

	uv0 /= pow(2.0, level0);
	uv0.y += 1.0 - exp( -LN2 * level0);

	uv0.y = 1.0 - uv0.y;

	uv1 /= pow(2.0, level1);
	uv1.y += 1.0 - exp(-LN2 * level1);

	vec3 radiance0 = RGBMDecode( texture( mapEnvironment, uv0 ).rgba );
	vec3 radiance1 = RGBMDecode( texture( mapEnvironment, uv1 ).rgba );

	vec3 radiance		= pow( mix( radiance0, radiance1, blend ), vec3( 2.2 ) );

	vec3 irradiance		= pow( texture( mapIrradiance, uvIrradiance ).rgb, vec3( 2.2 ) );

	// get the approximate reflectance
	float NoV			= saturate( dot( N, V ) );
	vec3 reflectance	= EnvBRDFApprox( specularColor, roughness4, NoV );

	// combine the specular IBL and the BRDF
    vec3 diffuse  		= diffuseColor * irradiance;
    vec3 _specular 		= radiance * reflectance;
	color				= diffuse + _specular;

	return color;

}


void main() {

	vec2 screenUV = (gl_FragCoord.xy / resolution.xy) * 2.0 - 1.0;

	vec3 N 				= getNormal();
	vec3 V 				= normalize( Eye );
	vec3 albedoColor	= getAlbedo();

	float r = getRoughness();
	float m = getMetalness();

	vec3 color 			= getPbr( N, V, albedoColor, r, m, specular );

	#ifdef USE_AO_MAP

		float ao = texture( mapAO, Uv ).r;
		color *= ao;

	#endif

	//apply the tone-mapping
	color				*= exposure;
	//white balance
	color				= Uncharted2Tonemap(color);

	//gamma correction
	color				= pow( color, vec3( 1.0 / gamma ) );

	vec4 col = texture( mapData, Uv);

	// output the fragment color
	FragColor		= vec4( mix( vec3( 0.0 ), color, mask ), 1.0 );


}




