let ShaderLibrary = {
  get: function (e) {
    return (
      ShaderLibrary.getInclude('include_common') + ShaderLibrary[e + '.glsl']
    )
  },
  getInclude: function (e) {
    return ShaderLibrary[e + '.glsl'] + '\n'
  },
}

ShaderLibrary['include_common.glsl'] = `
vec4 encodeHDRE(vec3 color)
{
#ifdef HDRE
    float maxValue = max(max(color.r, color.g), color.b) + .01;
    float e = floor(max(log(maxValue), 0.0));
    color /= exp(e);
    return vec4(color, e / 5.0);
#else
    return vec4(color, 1.0);
#endif
}

vec3 decodeHDRE(vec4 hdre)
{
#ifdef HDRE
    return hdre.rgb * exp(hdre.a * 255.0 - 128.0);
#else
    return hdre.xyz;
#endif
}

float luminance(vec3 color)
{
    return dot(color, vec3(.30, 0.59, .11));
}

float luminance(vec4 color)
{
    return luminance(color.xyz);
}

float linearStep(float lower, float upper, float x)
{
    return clamp((x - lower) / (upper - lower), 0.0, 1.0);
}

// Only for 0 - 1
vec4 floatToRGBA8(float value)
{
    vec4 enc = value * vec4(1.0, 255.0, 65025.0, 16581375.0);
    // cannot fract first value or 1 would not be encodable
    enc.yzw = fract(enc.yzw);
    return enc - enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);
}

float RGBA8ToFloat(vec4 rgba)
{
    return dot(rgba, vec4(1.0, 1.0/255.0, 1.0/65025.0, 1.0/16581375.0));
}

vec2 floatToRG8(float value)
{
    vec2 enc = vec2(1.0, 255.0) * value;
    enc.y = fract(enc.y);
    enc.x -= enc.y / 255.0;
    return enc;
}

float RG8ToFloat(vec2 rg)
{
    return dot(rg, vec2(1.0, 1.0/255.0));
}

vec3 intersectCubeMap(vec3 rayOrigin, vec3 rayDir, float cubeSize)
{
    vec3 t = (cubeSize * sign(rayDir) - rayOrigin) / rayDir;
    float minT = min(min(t.x, t.y), t.z);
    return rayOrigin + minT * rayDir;
}

vec4 sampleLatLong(sampler2D tex, vec3 uvw)
{
    vec2 uv;
    uv.x = atan(uvw.z, uvw.x) / 6.283184 + 0.5;
    uv.y = acos(-uvw.y) / 3.141592;
    return texture2D(tex, uv);
}
`
ShaderLibrary['include_beckmann.glsl'] = `
struct PointLight {
    vec3 position;
    vec3 color;
    float distance;
    float decay;
};

struct DirectionalLight {
    vec3 direction;
    vec3 color;
};

#if NUM_POINT_LIGHTS > 0
uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
#endif

#if NUM_DIR_LIGHTS > 0
uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
#endif


float beckmann_geometryTerm(vec3 normal, vec3 dir, float k)
{
    float d = max(dot(normal, dir), 0.0);
    return d / (d * (1.0 - k) + k);
}

// schlick-beckman
float beckmann_lightVisibility(vec3 normal, vec3 viewDir, vec3 lightDir, float roughness)
{
    float k = roughness + 1.0;
    k = k * k * .125;
    return beckmann_geometryTerm(normal, viewDir, k) * beckmann_geometryTerm(normal, lightDir, k);
}

float beckmann_distribution(float roughness, vec3 normal, vec3 halfVector)
{
    float roughSqr = roughness*roughness;
    float halfDotNormal = max(dot(halfVector, normal), 0.00001);
    float a = roughSqr * pow(halfDotNormal, 4.0);
    float b = (halfDotNormal * halfDotNormal - 1.0) / (roughSqr * halfDotNormal * halfDotNormal);
    return exp(b) / a;
}

// light dir is towards the light
// view dir is toward the camera
void beckmann_brdf(in vec3 normal, in float roughness, float normalSpecularReflectance, in vec3 lightDir, in vec3 viewDir, in vec3 viewPos, in vec3 lightColor, out vec3 diffuseLight, out vec3 specularLight)
{
    float nDotL = max(dot(lightDir, normal), 0.0);
    vec3 irradiance = nDotL * lightColor;    // in fact irradiance / PI

    vec3 halfVector = normalize(lightDir + viewDir);

    float mappedRoughness =  roughness * roughness;

    // adapted for 2-lobed skin
    float distribution =
        (beckmann_distribution(mappedRoughness *.8, normal, halfVector) * .05 +
        beckmann_distribution(mappedRoughness, normal, halfVector)) * .95;

    float halfDotLight = max(dot(halfVector, lightDir), 0.0);
    float cosAngle = 1.0 - halfDotLight;
    float fresnel = normalSpecularReflectance + (1.0 - normalSpecularReflectance) * pow(cosAngle, 5.0);

    diffuseLight = irradiance;

    specularLight = irradiance * fresnel * distribution;

    specularLight *= beckmann_lightVisibility(normal, viewDir, lightDir, roughness);
}

// diffuse light only
vec3 beckmann_getDiffuseLight(in vec3 normal, in vec3 viewPos, in float shadow)
{
    vec3 diffuseLight = vec3(0.0);

#if NUM_DIR_LIGHTS > 0
    for (int i = 0; i < NUM_DIR_LIGHTS; ++i) {
        float nDotL = max(dot(directionalLights[i].direction, normal), 0.0);
        diffuseLight += nDotL * directionalLights[i].color * shadow;
    }
#endif

    return diffuseLight;
}

void beckmann_getLight(in vec3 normal, in float roughness, in float normalSpecularReflectance, in vec3 viewPos, in float shadow, out vec3 diffuseLight, out vec3 specularLight)
{
    vec3 viewDir = -normalize(viewPos);
    diffuseLight = vec3(0.0);
    specularLight = vec3(0.0);

#if NUM_DIR_LIGHTS > 0
    for (int i = 0; i < NUM_DIR_LIGHTS; ++i) {
        vec3 diff;
        vec3 spec;
        beckmann_brdf(normal, roughness, normalSpecularReflectance, directionalLights[i].direction, viewDir, viewPos, directionalLights[i].color, diff, spec);
        diffuseLight += diff * shadow;
        specularLight += spec * shadow;
    }
#endif
}
`

ShaderLibrary['include_ggx.glsl'] = `
struct PointLight {
    vec3 position;
    vec3 color;
    float distance;
    float decay;
};

struct DirectionalLight {
    vec3 direction;
    vec3 color;
};

#if NUM_POINT_LIGHTS > 0
uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
#endif

#if NUM_DIR_LIGHTS > 0
uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
#endif


float ggx_geometryTerm(vec3 normal, vec3 dir, float k)
{
    float d = max(dot(normal, dir), 0.0);
    return d / (d * (1.0 - k) + k);
}

// schlick-beckman
float ggx_lightVisibility(vec3 normal, vec3 viewDir, vec3 lightDir, float roughness)
{
    float k = roughness + 1.0;
    k = k * k * .125;
    return ggx_geometryTerm(normal, viewDir, k) * ggx_geometryTerm(normal, lightDir, k);
}

float ggx_distribution(float roughness, vec3 normal, vec3 halfVector)
{
    float roughSqr = roughness*roughness;
    float halfDotNormal = max(dot(halfVector, normal), 0.0);
    float denom = (halfDotNormal * halfDotNormal) * (roughSqr - 1.0) + 1.0;
    return roughSqr / (denom * denom);
}

// light dir is towards the light
// view dir is toward the camera
void ggx_brdf(in vec3 normal, in float roughness, float normalSpecularReflectance, in vec3 lightDir, in vec3 viewDir, in vec3 viewPos, in vec3 lightColor, out vec3 diffuseLight, out vec3 specularLight)
{
    float nDotL = max(dot(lightDir, normal), 0.0);
    vec3 irradiance = nDotL * lightColor;    // in fact irradiance / PI

    vec3 halfVector = normalize(lightDir + viewDir);

    float mappedRoughness =  roughness * roughness;

    float distribution = ggx_distribution(mappedRoughness, normal, halfVector);

    float halfDotLight = max(dot(halfVector, lightDir), 0.0);
    float cosAngle = 1.0 - halfDotLight;
    float fresnel = normalSpecularReflectance + (1.0 - normalSpecularReflectance) * pow(cosAngle, 5.0);

    diffuseLight = irradiance;

    specularLight = irradiance * fresnel * distribution;

    specularLight *= ggx_lightVisibility(normal, viewDir, lightDir, roughness);
}

// diffuse light only
vec3 ggx_getDiffuseLight(in vec3 normal, in vec3 viewPos, in float shadow)
{
    vec3 diffuseLight = vec3(0.0);

#if NUM_DIR_LIGHTS > 0
    for (int i = 0; i < NUM_DIR_LIGHTS; ++i) {
        float nDotL = max(dot(directionalLights[i].direction, normal), 0.0);
        diffuseLight += nDotL * directionalLights[i].color * shadow;
    }
#endif

    return diffuseLight;
}

void ggx_getLight(in vec3 normal, in float roughness, in float normalSpecularReflectance, in vec3 viewPos, in float shadow, out vec3 diffuseLight, out vec3 specularLight)
{
    vec3 viewDir = -normalize(viewPos);
    diffuseLight = vec3(0.0);
    specularLight = vec3(0.0);

#if NUM_DIR_LIGHTS > 0
    for (int i = 0; i < NUM_DIR_LIGHTS; ++i) {
        vec3 diff;
        vec3 spec;
        ggx_brdf(normal, roughness, normalSpecularReflectance, directionalLights[i].direction, viewDir, viewPos, directionalLights[i].color, diff, spec);
        diffuseLight += diff * shadow;
        specularLight += spec * shadow;
    }
#endif
}
`

// ██╗     ██╗███╗   ██╗███████╗ █████╗ ██████╗ ██████╗ ███████╗██████╗ ████████╗██╗  ██╗███╗   ███╗ █████╗ ████████╗███████╗██████╗ ██╗ █████╗ ██╗
// ██║     ██║████╗  ██║██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔══██╗╚══██╔══╝██║  ██║████╗ ████║██╔══██╗╚══██╔══╝██╔════╝██╔══██╗██║██╔══██╗██║
// ██║     ██║██╔██╗ ██║█████╗  ███████║██████╔╝██║  ██║█████╗  ██████╔╝   ██║   ███████║██╔████╔██║███████║   ██║   █████╗  ██████╔╝██║███████║██║
// ██║     ██║██║╚██╗██║██╔══╝  ██╔══██║██╔══██╗██║  ██║██╔══╝  ██╔═══╝    ██║   ██╔══██║██║╚██╔╝██║██╔══██║   ██║   ██╔══╝  ██╔══██╗██║██╔══██║██║
// ███████╗██║██║ ╚████║███████╗██║  ██║██║  ██║██████╔╝███████╗██║        ██║   ██║  ██║██║ ╚═╝ ██║██║  ██║   ██║   ███████╗██║  ██║██║██║  ██║███████╗
// ╚══════╝╚═╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝        ╚═╝   ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝

ShaderLibrary['linear_depth_vertex.glsl'] = `
varying float linearDepth;

uniform float cameraNear;
uniform float rcpCameraRange;

void main()
{
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    linearDepth = (-viewPosition.z - cameraNear) * rcpCameraRange;
    gl_Position = projectionMatrix * viewPosition;
}
`
ShaderLibrary['linear_depth_fragment.glsl'] = `
varying float linearDepth;

void main()
{
    gl_FragColor = floatToRGBA8(linearDepth);
}
`

// ███████╗██╗  ██╗██╗███╗   ██╗███╗   ███╗ █████╗ ████████╗███████╗██████╗ ██╗ █████╗ ██╗
// ██╔════╝██║ ██╔╝██║████╗  ██║████╗ ████║██╔══██╗╚══██╔══╝██╔════╝██╔══██╗██║██╔══██╗██║
// ███████╗█████╔╝ ██║██╔██╗ ██║██╔████╔██║███████║   ██║   █████╗  ██████╔╝██║███████║██║
// ╚════██║██╔═██╗ ██║██║╚██╗██║██║╚██╔╝██║██╔══██║   ██║   ██╔══╝  ██╔══██╗██║██╔══██║██║
// ███████║██║  ██╗██║██║ ╚████║██║ ╚═╝ ██║██║  ██║   ██║   ███████╗██║  ██║██║██║  ██║███████╗
// ╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝

ShaderLibrary['skin_vertex.glsl'] = `
varying vec2 vUV;
varying vec3 vViewNormal;
varying vec3 vViewPosition;
varying vec4 vShadowCoord;
varying vec4 vProjection;

uniform mat4 shadowMapMatrix;

void main() {
    vec3 localPos = position;
    vec4 viewPos = modelViewMatrix * vec4(localPos, 1.0);
    vec4 worldPos = modelMatrix * vec4(localPos, 1.0);

    gl_Position = vProjection = projectionMatrix * viewPos;
    vUV = uv;

    vViewNormal = normalMatrix * normal;
    vViewPosition = viewPos.xyz;
    vShadowCoord = shadowMapMatrix * worldPos * .5 + .5;
}
`
ShaderLibrary['skin_fragment.glsl'] = `
varying vec2 vUV;
varying vec3 vViewNormal;
varying vec3 vViewPosition;
varying vec4 vShadowCoord;
varying vec4 vProjection;

uniform sampler2D albedoMap;
uniform sampler2D normalMap;
uniform sampler2D roughnessAOThicknessMap;
uniform sampler2D roughnessDetailMap;
uniform sampler2D irradianceMap;
uniform sampler2D specularMap;
uniform sampler2D shadowMap;
uniform sampler2D sssMap;

uniform float normalSpecularReflectance;
uniform float roughnessMedian;
uniform float roughnessMapRange;
uniform float roughnessDetailRange;
uniform float probeExposure;
uniform float sssProfileScale;
uniform float thicknessRange;
uniform float specular_intensity;
uniform vec3 sssTopLayerColor;
uniform vec3 transmittanceColor;
uniform mat4 shadowMapMatrix;

uniform int return_stage;

vec3 perturbNormal2Arb(vec3 position, vec3 normal, vec3 normalSample)
{
    vec3 q0 = dFdx( position.xyz );
    vec3 q1 = dFdy( position.xyz );
    vec2 st0 = dFdx( vUV.st );
    vec2 st1 = dFdy( vUV.st );
    vec3 S = normalize( q0 * st1.t - q1 * st0.t );
    vec3 T = normalize( -q0 * st1.s + q1 * st0.s );
    vec3 N = normalize( normal );
    mat3 tsn = mat3( S, T, N );
    return normalize( tsn * normalSample );
}

vec3 getNormal()
{
    vec4 normalSample = texture2D(normalMap, vUV);
    vec3 normal = normalSample.xyz * 2.0 - 1.0;
    return perturbNormal2Arb(vViewPosition, vViewNormal, normal);
}

vec2 getVSMMoments(vec2 uv)
{
    vec4 s = texture2D(shadowMap, uv);
#ifdef VSM_FLOAT
    return s.xy;
#else
    return vec2(RG8ToFloat(s.xy), RG8ToFloat(s.zw));
#endif
}

float getShadow(float offset)
{
    vec4 coord = vShadowCoord;
    coord.z -= offset;
    vec2 moments = getVSMMoments(coord.xy);
    float p = linearStep(coord.z - 0.002, coord.z, moments.x);
    float variance = moments.y - moments.x * moments.x;
    variance = max(variance, MIN_VARIANCE);

    float diff = coord.z - moments.x;
    float upperBound = variance / (variance + diff*diff);
    float shadow = linearStep(LIGHT_BLEED_REDUCTION, 1.0, upperBound);
    return clamp(max(shadow, p), 0.0, 1.0);
}

void main() {
    vec3 viewNormal = getNormal();
    vec3 worldNormal = viewNormal * mat3(viewMatrix);
    vec4 albedo = texture2D(albedoMap, vUV);
    //    albedo.xyz *= albedo.xyz;
    // albedo.x = pow(albedo.x, 2.2);
    // albedo.y = pow(albedo.y, 2.2);
    // albedo.z = pow(albedo.z, 2.2);

    vec3 diffuseLight = vec3(0.0);
    vec3 specularLight = vec3(0.0);

    vec4 roughnessAOThickness = texture2D(roughnessAOThicknessMap, vUV);

    // TODO: scale roughness UP by distance
    float roughness = roughnessMedian + (.5 - roughnessAOThickness.x) * roughnessMapRange;
    roughness = clamp(roughness, 0.001, 1.0);

    float roughnessDetail = texture2D(roughnessDetailMap, vUV * 20.0).x;
    roughness += (.5 - roughnessDetail) * roughnessDetailRange;

    float shadow = getShadow(0.0);
    beckmann_getLight(viewNormal, roughness, normalSpecularReflectance, vViewPosition, shadow, diffuseLight, specularLight);

    vec4 irradianceSample = sampleLatLong(irradianceMap, worldNormal);
    vec3 viewRefl = reflect(normalize(vViewPosition), viewNormal);
    vec3 worldReflection = viewRefl * mat3(viewMatrix);
    vec4 specularSample = sampleLatLong(specularMap, worldReflection);

    // TODO: Do this more correctly (remember Seb Lagarde (?)'s post?)
    float geomOcclusion = 1.0 - roughness * roughness;
    float NdotL = max(dot(worldNormal, worldReflection), 0.0);
    float cosAngle = 1.0 - NdotL;
    float fresnel = normalSpecularReflectance + (1.0 - normalSpecularReflectance) * pow(cosAngle, 5.0);
    // should be augmented with shadow test

    float probeStrength = probeExposure * roughnessAOThickness.y;
    diffuseLight += irradianceSample.xyz /** irradianceSample.xyz */* probeStrength;
    specularLight += specularSample.xyz /** specularSample.xyz */* fresnel * geomOcclusion * probeStrength;

    vec2 screenUV = vProjection.xy / vProjection.w * .5 + .5;
    vec3 sss = texture2D(sssMap, screenUV).xyz;
    
    vec3 diffuseLight_sss = diffuseLight * sssTopLayerColor + sss;


    
    // float thickness = (1.0 - roughnessAOThickness.z) * thicknessRange + 0.01;
    // float shadowTransmission = getShadow(.5 * thickness * shadowMapMatrix[2][2]);
    // vec3 transmission_color = exp(-transmittanceColor * thickness);
    // vec3 shadow_diffuse_light = beckmann_getDiffuseLight(-viewNormal, vViewPosition, shadowTransmission);
    // vec3 transmission_diffuse_light = transmission_color*shadow_diffuse_light;
    // vec3 diffuseLight_sss_tm = diffuseLight_sss + transmission_diffuse_light;
    // vec3 col = albedo.xyz * diffuseLight_sss_tm + specularLight;



    float thickness = (1.0 - roughnessAOThickness.z) * thicknessRange + 0.01;
    float offset = roughnessAOThickness.z * thicknessRange + 0.01;
    float shadowTransmission = getShadow(2.0 * offset);
    vec3 transmission_color = exp(-transmittanceColor * thickness);
    vec3 shadow_diffuse_light = beckmann_getDiffuseLight(-viewNormal, vViewPosition, shadowTransmission);
    vec3 transmission_diffuse_light = transmission_color*shadow_diffuse_light;
    vec3 diffuseLight_sss_tm = diffuseLight_sss + transmission_diffuse_light;
    vec3 col = albedo.xyz * diffuseLight_sss_tm + specularLight * specular_intensity;


    if (return_stage == 1) {
        gl_FragColor = vec4(diffuseLight_sss, 1.0);
    } else if (return_stage == 2) {
        gl_FragColor = vec4(shadowTransmission);
    } else if (return_stage == 3) {
        gl_FragColor = vec4(shadow_diffuse_light, 1.0);
    // } else if (return_stage == 4) {
    //     gl_FragColor = vec4(diffuseLight_sss, 1.0);
    } else {
        gl_FragColor = vec4(col, 1.0);
    }
//    gl_FragColor = vec4(roughness, roughness, roughness, 1.0);
//    gl_FragColor = vec4(thickness, thickness, thickness, 1.0);
}
`

// ███████╗██╗  ██╗██╗   ██╗
// ██╔════╝██║ ██╔╝╚██╗ ██╔╝
// ███████╗█████╔╝  ╚████╔╝
// ╚════██║██╔═██╗   ╚██╔╝
// ███████║██║  ██╗   ██║
// ╚══════╝╚═╝  ╚═╝   ╚═╝
ShaderLibrary['sky_vertex.glsl'] = `
varying vec3 worldViewDir;

void main() {
    vec3 worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    worldViewDir = worldPosition - cameraPosition;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`
ShaderLibrary['sky_fragment.glsl'] = `
varying vec3 worldViewDir;

#ifdef LAT_LONG
uniform sampler2D envMap;
#else
uniform samplerCube envMap;
#endif

uniform float exposure;

void main()
{
    vec3 elementDir = normalize(worldViewDir);
#ifdef LAT_LONG
    gl_FragColor = sampleLatLong(envMap, elementDir);
#else
    gl_FragColor = textureCube(envMap, elementDir);
#endif

#ifdef HDRE
    gl_FragColor.xyz = decodeHDRE(gl_FragColor);
    gl_FragColor.w = 1.0;
#endif
    gl_FragColor.xyz *= exposure;
}
`

ShaderLibrary['dof_fragment.glsl'] = `
uniform sampler2D source;
uniform sampler2D blurred1;
uniform sampler2D blurred2;
uniform sampler2D depth;

uniform float strength;
uniform float focusDepth;
uniform float focusRange;
uniform float focusFalloff;

varying vec2 vUv;

void main()
{
    const float blendCutoff = .5;
    float depth = RGBA8ToFloat(texture2D(depth, vUv));
    float distance = abs(depth - focusDepth);

    float blurAmount = clamp((distance - focusRange) / focusFalloff, 0.0, 1.0);

    vec3 mainCol = decodeHDRE(texture2D(source, vUv));
    vec3 blurredCol1 = decodeHDRE(texture2D(blurred1, vUv));
    vec3 blurredCol2 = decodeHDRE(texture2D(blurred2, vUv));

    // for little blurs (0.0 - 0.25), use smaller amount, for (.5, 1.0), use larger blur
    float smallBlur = linearStep(0.0, blendCutoff, blurAmount);
    float largeBlur = linearStep(blendCutoff, 1.0, blurAmount);
    vec3 color = mix(blurredCol1, blurredCol2, largeBlur);
    color = mix(mainCol, color, smallBlur * strength);

    gl_FragColor = encodeHDRE(color);
}
`
ShaderLibrary['fxaa_tonemap_fragment.glsl'] = `
uniform sampler2D tDiffuse;
uniform vec2 rcpRenderTargetResolution;
uniform float whitePoint;

#define FXAA_REDUCE_MIN   (1.0/128.0)
#define FXAA_REDUCE_MUL   (1.0/8.0)
#define FXAA_SPAN_MAX     (8.0)

// Jim Hejl and Richard Burgess-Dawson
#define TM_A 6.2
#define TM_B .5
#define TM_C 6.2
#define TM_D 1.7
#define TM_E 0.06

vec3 toneMap(vec3 color)
{
    return (color*(TM_A*color+TM_B))/(color*(TM_C*color+TM_D)+TM_E);
}

float toneMap(float val)
{
    return (val*(TM_A*val+TM_B))/(val*(TM_C*val+TM_D)+TM_E);
}

// refer to: https://github.com/mattdesl/glsl-fxaa/blob/master/fxaa.glsl
void main() {
    
    vec3 rgbNW = texture2D( tDiffuse, ( gl_FragCoord.xy + vec2( -1.0, -1.0 ) ) * rcpRenderTargetResolution ).xyz;
    vec3 rgbNE = texture2D( tDiffuse, ( gl_FragCoord.xy + vec2( 1.0, -1.0 ) ) * rcpRenderTargetResolution ).xyz;
    vec3 rgbSW = texture2D( tDiffuse, ( gl_FragCoord.xy + vec2( -1.0, 1.0 ) ) * rcpRenderTargetResolution ).xyz;
    vec3 rgbSE = texture2D( tDiffuse, ( gl_FragCoord.xy + vec2( 1.0, 1.0 ) ) * rcpRenderTargetResolution ).xyz;
    vec4 rgbaM  = texture2D( tDiffuse,  gl_FragCoord.xy * rcpRenderTargetResolution );
    vec3 rgbM  = rgbaM.xyz;
    vec3 luma = vec3( 0.299, 0.587, 0.114 );

    float lumaNW = dot( rgbNW, luma );
    float lumaNE = dot( rgbNE, luma );
    float lumaSW = dot( rgbSW, luma );
    float lumaSE = dot( rgbSE, luma );
    float lumaM  = dot( rgbM,  luma );
    float lumaMin = min( lumaM, min( min( lumaNW, lumaNE ), min( lumaSW, lumaSE ) ) );
    float lumaMax = max( lumaM, max( max( lumaNW, lumaNE) , max( lumaSW, lumaSE ) ) );

    vec2 dir;
    dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
    dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));

    float dirReduce = max( ( lumaNW + lumaNE + lumaSW + lumaSE ) * ( 0.25 * FXAA_REDUCE_MUL ), FXAA_REDUCE_MIN );

    float rcpDirMin = 1.0 / ( min( abs( dir.x ), abs( dir.y ) ) + dirReduce );
    dir = min( vec2( FXAA_SPAN_MAX,  FXAA_SPAN_MAX),
            max( vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),
                dir * rcpDirMin)) * rcpRenderTargetResolution;
    vec4 rgbA = (1.0/2.0) * (
        texture2D(tDiffuse,  gl_FragCoord.xy  * rcpRenderTargetResolution + dir * (1.0/3.0 - 0.5)) +
    texture2D(tDiffuse,  gl_FragCoord.xy  * rcpRenderTargetResolution + dir * (2.0/3.0 - 0.5)));
    vec4 rgbB = rgbA * (1.0/2.0) + (1.0/4.0) * (
        texture2D(tDiffuse,  gl_FragCoord.xy  * rcpRenderTargetResolution + dir * (0.0/3.0 - 0.5)) +
    texture2D(tDiffuse,  gl_FragCoord.xy  * rcpRenderTargetResolution + dir * (3.0/3.0 - 0.5)));
    float lumaB = dot(rgbB, vec4(luma, 0.0));

    vec3 color;
    if ( ( lumaB < lumaMin ) || ( lumaB > lumaMax ) ) {
    
        color = rgbA.xyz;

    } else {
        color = rgbB.xyz;
    }


    color = max(vec3(0.0), color - vec3(.004));
    color = toneMap(color) / toneMap(whitePoint);
    gl_FragColor = vec4(color, 1.0);
}
`

// ███████╗███████╗███████╗██████╗ ██╗     ██╗   ██╗██████╗ ███████╗██╗  ██╗ █████╗ ██████╗ ███████╗██████╗
// ██╔════╝██╔════╝██╔════╝██╔══██╗██║     ██║   ██║██╔══██╗██╔════╝██║  ██║██╔══██╗██╔══██╗██╔════╝██╔══██╗
// ███████╗███████╗███████╗██████╔╝██║     ██║   ██║██████╔╝███████╗███████║███████║██║  ██║█████╗  ██████╔╝
// ╚════██║╚════██║╚════██║██╔══██╗██║     ██║   ██║██╔══██╗╚════██║██╔══██║██╔══██║██║  ██║██╔══╝  ██╔══██╗
// ███████║███████║███████║██████╔╝███████╗╚██████╔╝██║  ██║███████║██║  ██║██║  ██║██████╔╝███████╗██║  ██║
// ╚══════╝╚══════╝╚══════╝╚═════╝ ╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝

ShaderLibrary['sss_blur_vertex.glsl'] = `
varying vec2 vUv;
varying vec3 vViewVector;

uniform mat4 unprojectionMatrix;

void main()
{
    gl_Position = vec4(position, 1.0);
    vUv = uv;
    vec4 unproj = unprojectionMatrix * vec4(position.xy, 0.0, 1.0);
    unproj /= unproj.w;
    vViewVector = -unproj.xyz / unproj.z;
}
`
ShaderLibrary['sss_blur_fragment.glsl'] = `
varying vec3 vViewVector;
varying vec2 vUv;

uniform sampler2D tDiffuse;
uniform sampler2D depthMap;
uniform sampler2D sssProfileMap;
uniform vec2 step;
uniform vec3 color1;
uniform vec3 color2;
uniform vec3 color3;
uniform float cameraNear;
uniform float cameraRange;
uniform float sssProfileScale;
uniform float sssRange;

void getContribution(in vec2 uv, inout vec3 prevPos, inout float totalDistance, inout vec3 totalWeights, inout vec3 acc1, inout vec3 acc2, inout vec3 acc3)
{
    float depth = RGBA8ToFloat(texture2D(depthMap, uv));
    vec3 pos = vViewVector * (cameraNear + depth * cameraRange);
    float stepDist = distance(pos, prevPos);
    prevPos = pos;
    totalDistance += stepDist;

    vec3 weights = texture2D(sssProfileMap, vec2(totalDistance * sssProfileScale, 0.0)).yzw;

    if (totalDistance > sssRange)
        weights *= 0.0;

    totalWeights += weights;

    vec3 color = texture2D(tDiffuse, uv).xyz;

    acc1 += color * weights.x;
    acc2 += color * weights.y;
    acc3 += color * weights.z;
}

void main()
{
    vec3 totalWeights = texture2D(sssProfileMap, vec2(0.0)).yzw;

    vec3 color = texture2D(tDiffuse, vUv).xyz;
    vec3 c1 = color * totalWeights.x;
    vec3 c2 = color * totalWeights.y;
    vec3 c3 = color * totalWeights.z;

    // centerDepth=(real_depth-near)/camera_range
    float centerDepth = RGBA8ToFloat(texture2D(depthMap, vUv));

    vec3 centerPos = vViewVector * (cameraNear + centerDepth * cameraRange);

    vec2 uvLeft = vUv;
    vec2 uvRight = vUv;
    vec3 posLeft = centerPos;
    vec3 posRight = centerPos;
    float distLeft = 0.0;
    float distRight = 0.0;

    for (int i = 0; i < RADIUS; ++i) {
        uvLeft -= step;
        uvRight += step;
        getContribution(uvLeft, posLeft, distLeft, totalWeights, c1, c2, c3);
        getContribution(uvRight, posRight, distRight, totalWeights, c1, c2, c3);
    }

    //  blend together
    gl_FragColor.xyz = color1 * c1 / totalWeights.x;
    gl_FragColor.xyz += color2 * c2 / totalWeights.y;
    gl_FragColor.xyz += color3 * c3 / totalWeights.z;
    gl_FragColor.w = 1.0;
}
`

// ███████╗███████╗███████╗███╗   ███╗ █████╗ ████████╗███████╗██████╗ ██╗ █████╗ ██╗
// ██╔════╝██╔════╝██╔════╝████╗ ████║██╔══██╗╚══██╔══╝██╔════╝██╔══██╗██║██╔══██╗██║
// ███████╗███████╗███████╗██╔████╔██║███████║   ██║   █████╗  ██████╔╝██║███████║██║
// ╚════██║╚════██║╚════██║██║╚██╔╝██║██╔══██║   ██║   ██╔══╝  ██╔══██╗██║██╔══██║██║
// ███████║███████║███████║██║ ╚═╝ ██║██║  ██║   ██║   ███████╗██║  ██║██║██║  ██║███████╗
// ╚══════╝╚══════╝╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝

ShaderLibrary['sss_vertex.glsl'] = `
varying vec2 vUV;
varying vec3 vViewNormal;
varying vec3 vViewPosition;
varying vec4 vShadowCoord;

uniform mat4 shadowMapMatrix;

void main() {
    vec3 localPos = position;
    vec4 viewPos = modelViewMatrix * vec4(localPos, 1.0);
    vec4 worldPos = modelMatrix * vec4(localPos, 1.0);

    gl_Position = projectionMatrix * viewPos;
    vUV = uv;

    vViewNormal = normalMatrix * normal;
    vViewPosition = viewPos.xyz;
    vShadowCoord = shadowMapMatrix * worldPos * .5 + .5;
}
`

ShaderLibrary['sss_fragment.glsl'] = `
varying vec2 vUV;
varying vec3 vViewNormal;
varying vec3 vViewPosition;
varying vec4 vShadowCoord;

uniform sampler2D normalMap;
uniform sampler2D irradianceMap;
uniform sampler2D shadowMap;

uniform float probeExposure;

vec3 perturbNormal2Arb(vec3 position, vec3 normal, vec3 normalSample)
{
    vec3 q0 = dFdx( position.xyz );
    vec3 q1 = dFdy( position.xyz );
    vec2 st0 = dFdx( vUV.st );
    vec2 st1 = dFdy( vUV.st );
    vec3 S = normalize( q0 * st1.t - q1 * st0.t );
    vec3 T = normalize( -q0 * st1.s + q1 * st0.s );
    vec3 N = normalize( normal );
    mat3 tsn = mat3( S, T, N );
    return normalize( tsn * normalSample );
}

vec3 getNormal()
{
    vec4 normalSample = texture2D(normalMap, vUV);
    vec3 normal = normalSample.xyz * 2.0 - 1.0;
    return perturbNormal2Arb(vViewPosition, vViewNormal, normal);
}

vec2 getVSMMoments(vec2 uv)
{
    vec4 s = texture2D(shadowMap, uv);
#ifdef VSM_FLOAT
    return s.xy;
#else
    return vec2(RG8ToFloat(s.xy), RG8ToFloat(s.zw));
#endif
}

float getShadow(float offset)
{
    vec4 coord = vShadowCoord;
    coord.z -= offset;
    vec2 moments = getVSMMoments(coord.xy);
    float p = linearStep(coord.z - 0.02, coord.z, moments.x);
    float variance = moments.y - moments.x * moments.x;
    variance = max(variance, MIN_VARIANCE);

    float diff = coord.z - moments.x;
    float upperBound = variance / (variance + diff*diff);
    float shadow = linearStep(LIGHT_BLEED_REDUCTION, 1.0, upperBound);
    return clamp(max(shadow, p), 0.0, 1.0);
}

void main() {
    vec3 viewNormal = getNormal();
    vec3 worldNormal = viewNormal * mat3(viewMatrix);
    float shadow = getShadow(0.0);
    vec3 diffuseLight = ggx_getDiffuseLight(viewNormal, vViewPosition, shadow);
    vec4 irradianceSample = sampleLatLong(irradianceMap, worldNormal);

    diffuseLight += irradianceSample.xyz * irradianceSample.xyz * probeExposure;

    // NOT APPLYING GAMMA!
    gl_FragColor = vec4(diffuseLight, 1.0);
}
`

ShaderLibrary['tiny_blur_hdre_fragment.glsl'] = `
uniform sampler2D tDiffuse;

varying vec2 vUv;

uniform vec2 sampleStep;

void main()
{
    vec3 col = decodeHDRE(texture2D(tDiffuse, vUv - sampleStep * .5));
    col += decodeHDRE(texture2D(tDiffuse, vUv + sampleStep * vec2(1.5, -.5)));
    col += decodeHDRE(texture2D(tDiffuse, vUv + sampleStep * vec2(-.5, 1.5)));
    col += decodeHDRE(texture2D(tDiffuse, vUv + sampleStep * 1.5));

    gl_FragColor = encodeHDRE(col * .25);
}
`
ShaderLibrary['tonemap_fragment.glsl'] = `
uniform sampler2D tDiffuse;
uniform float exposure;

varying vec2 vUv;

void main()
{
    vec4 hdre = texture2D(tDiffuse, vUv);
    vec3 color = decodeHDRE(hdre);
    
    //    color *= color * exposure;
    //    color = max(vec3(0.0), color.xyz - 0.004);

    // this has pow 2.2 gamma included, not valid if using fast gamma correction

    // Jim Hejl and Richard Burgess-Dawson
    /*float a = 6.2;
    float b = .5;
    float c = 6.2;
    float d = 1.7;
    float e = 0.06;*/

    // ACES
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;

    gl_FragColor = vec4(saturate((color*(a*color+b))/(color*(c*color+d)+e)), 1.0);
//    gl_FragColor = vec4(color, 1.0);
}
`
ShaderLibrary['shadow_fragment.glsl'] = `
varying vec4 projection;

uniform float depthBias;

void main()
{
    float depth = projection.z * .5 + .5;

    gl_FragColor = floatToRGBA8(depth + depthBias);
}
`

// ██╗   ██╗███████╗███╗   ███╗███╗   ███╗ █████╗ ████████╗███████╗██████╗ ██╗ █████╗ ██╗
// ██║   ██║██╔════╝████╗ ████║████╗ ████║██╔══██╗╚══██╔══╝██╔════╝██╔══██╗██║██╔══██╗██║
// ██║   ██║███████╗██╔████╔██║██╔████╔██║███████║   ██║   █████╗  ██████╔╝██║███████║██║
// ╚██╗ ██╔╝╚════██║██║╚██╔╝██║██║╚██╔╝██║██╔══██║   ██║   ██╔══╝  ██╔══██╗██║██╔══██║██║
//  ╚████╔╝ ███████║██║ ╚═╝ ██║██║ ╚═╝ ██║██║  ██║   ██║   ███████╗██║  ██║██║██║  ██║███████╗
//   ╚═══╝  ╚══════╝╚═╝     ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝

ShaderLibrary['shadow_vertex.glsl'] = `
varying vec4 projection;

void main()
{
    gl_Position = projection = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`
ShaderLibrary['vsm_fragment.glsl'] = `
varying vec4 projection;

void main()
{
    float depth = projection.z * .5 + .5;
    float dx = dFdx(depth);
    float dy = dFdy(depth);
    float moment2 = depth * depth + 0.25*(dx*dx + dy*dy);

#ifdef FLOAT_TEX
    gl_FragColor = vec4(depth, moment2, 0.0, 1.0);
#else
    gl_FragColor = vec4(floatToRG8(depth), floatToRG8(moment2));
#endif
}
`

// ██╗   ██╗███████╗███╗   ███╗██████╗ ██╗     ██╗   ██╗██████╗ ███████╗██╗  ██╗ █████╗ ██████╗ ███████╗██████╗
// ██║   ██║██╔════╝████╗ ████║██╔══██╗██║     ██║   ██║██╔══██╗██╔════╝██║  ██║██╔══██╗██╔══██╗██╔════╝██╔══██╗
// ██║   ██║███████╗██╔████╔██║██████╔╝██║     ██║   ██║██████╔╝███████╗███████║███████║██║  ██║█████╗  ██████╔╝
// ╚██╗ ██╔╝╚════██║██║╚██╔╝██║██╔══██╗██║     ██║   ██║██╔══██╗╚════██║██╔══██║██╔══██║██║  ██║██╔══╝  ██╔══██╗
//  ╚████╔╝ ███████║██║ ╚═╝ ██║██████╔╝███████╗╚██████╔╝██║  ██║███████║██║  ██║██║  ██║██████╔╝███████╗██║  ██║
//   ╚═══╝  ╚══════╝╚═╝     ╚═╝╚═════╝ ╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝

ShaderLibrary['vsm_blur_vertex.glsl'] = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}`

ShaderLibrary['vsm_blur_fragment.glsl'] = `
#define RADIUS 2
#define NUM_SAMPLES (RADIUS * 2 + 1)

uniform sampler2D tDiffuse;
uniform vec2 step;

varying vec2 vUv;

vec2 getShadowValue(vec2 uv)
{
    vec4 s = texture2D(tDiffuse, uv);
#ifdef FLOAT_TEX
    return s.xy;
#else
    return vec2(RG8ToFloat(s.xy), RG8ToFloat(s.zw));
#endif
}

void main() {
    vec2 sum = getShadowValue(vUv);

    for (int i = 1; i <= RADIUS; ++i) {
        float fi = float(i);
        sum += getShadowValue(vUv - step * fi);
        sum += getShadowValue(vUv + step * fi);
    }

    sum /= float(NUM_SAMPLES);
#ifdef FLOAT_TEX
    gl_FragColor = vec4(sum, 0.0, 1.0);
#else
    gl_FragColor.xy = floatToRG8(sum.x);
    gl_FragColor.zw = floatToRG8(sum.y);
#endif
}
`

// ██╗   ██╗███╗   ██╗██╗   ██╗███████╗███████╗██████╗
// ██║   ██║████╗  ██║██║   ██║██╔════╝██╔════╝██╔══██╗
// ██║   ██║██╔██╗ ██║██║   ██║███████╗█████╗  ██║  ██║
// ██║   ██║██║╚██╗██║██║   ██║╚════██║██╔══╝  ██║  ██║
// ╚██████╔╝██║ ╚████║╚██████╔╝███████║███████╗██████╔╝
//  ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝ ╚══════╝╚══════╝╚═════╝

ShaderLibrary['gaussian_blur_hdre_fragment.glsl'] = `
uniform sampler2D tDiffuse;

varying vec2 vUv;

uniform vec2 sampleStep;
uniform float weights[NUM_WEIGHTS];

void main()
{
    vec3 col = decodeHDRE(texture2D(tDiffuse, vUv)) * weights[0];

    for (int i = 1; i <= KERNEL_RADIUS; ++i) {
        vec2 offset = float(i) * sampleStep;
        col += (decodeHDRE(texture2D(tDiffuse, vUv + offset)) + decodeHDRE(texture2D(tDiffuse, vUv - offset))) * weights[i];
    }

    gl_FragColor = encodeHDRE(col);
}
`
ShaderLibrary['post_vertex.glsl'] = `
varying vec2 vUv;

void main()
{
    gl_Position = vec4(position, 1.0);
    vUv = uv;
}
`

ShaderLibrary['post_z_vertex.glsl'] = `
varying vec2 vUv;
varying vec3 viewVector;

uniform mat4 unprojectionMatrix;

void main()
{
    gl_Position = vec4(position, 1.0);
    vUv = uv;
    vec4 unproj = unprojectionMatrix * vec4(position.xy, 0.0, 1.0);
    unproj /= unproj.w;
    viewVector = -unproj.xyz / unproj.z;
}
`

ShaderLibrary['unlit_fragment.glsl'] = `
#ifdef ALBEDO_MAP
varying vec2 texCoords;
uniform sampler2D albedoMap;
#endif

uniform vec3 color;
uniform float opacity;

#ifdef FOG
varying vec3 viewPosition;

uniform float fogDensity;
uniform vec3 fogColor;
#endif

void main() {
    float alpha = opacity;
#ifdef ALBEDO_MAP
    vec4 albedo = texture2D(albedoMap, texCoords);
    alpha *= albedo.w;
    albedo.xyz *= albedo.xyz;
    albedo.xyz *= color;
    vec3 col = albedo.xyz;
#else
    vec3 col = color;
#endif

#ifdef FOG
    float fogAmount = clamp(exp2(viewPosition.z * fogDensity), 0.0, 1.0);
    col = mix(fogColor, col, fogAmount);
#endif

#ifdef HDRE
    gl_FragColor = encodeHDRE(sqrt(col));
#else
//    col *= alpha;
    gl_FragColor = vec4(sqrt(col), alpha);
#endif
}
`

ShaderLibrary['unlit_vertex.glsl'] = `
#ifdef ALBEDO_MAP
varying vec2 texCoords;
#endif

#ifdef FOG
varying vec3 viewPosition;
#endif

void main() {
    vec3 localPos = position;
    vec4 viewPos = modelViewMatrix * vec4(localPos, 1.0);
    gl_Position = projectionMatrix * viewPos;
#ifdef FOG
    viewPosition = viewPos.xyz;
#endif

#ifdef ALBEDO_MAP
    texCoords = uv;
#endif
}
`

export { ShaderLibrary }
