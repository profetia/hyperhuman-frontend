let ShaderLibrary = {
    get: function (e) {
        return ShaderLibrary.getInclude("include_common") + ShaderLibrary[e + ".glsl"];
    },
    getInclude: function (e) {
        return ShaderLibrary[e + ".glsl"] + "\n";
    },
}

ShaderLibrary["include_common.glsl"] = `
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
`;
ShaderLibrary["include_beckmann.glsl"] = `
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
`;

ShaderLibrary["include_ggx.glsl"] = `
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
`;



// ██╗     ██╗███╗   ██╗███████╗ █████╗ ██████╗ ██████╗ ███████╗██████╗ ████████╗██╗  ██╗███╗   ███╗ █████╗ ████████╗███████╗██████╗ ██╗ █████╗ ██╗     
// ██║     ██║████╗  ██║██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔══██╗╚══██╔══╝██║  ██║████╗ ████║██╔══██╗╚══██╔══╝██╔════╝██╔══██╗██║██╔══██╗██║     
// ██║     ██║██╔██╗ ██║█████╗  ███████║██████╔╝██║  ██║█████╗  ██████╔╝   ██║   ███████║██╔████╔██║███████║   ██║   █████╗  ██████╔╝██║███████║██║     
// ██║     ██║██║╚██╗██║██╔══╝  ██╔══██║██╔══██╗██║  ██║██╔══╝  ██╔═══╝    ██║   ██╔══██║██║╚██╔╝██║██╔══██║   ██║   ██╔══╝  ██╔══██╗██║██╔══██║██║     
// ███████╗██║██║ ╚████║███████╗██║  ██║██║  ██║██████╔╝███████╗██║        ██║   ██║  ██║██║ ╚═╝ ██║██║  ██║   ██║   ███████╗██║  ██║██║██║  ██║███████╗
// ╚══════╝╚═╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝        ╚═╝   ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝

ShaderLibrary["linear_depth_vertex.glsl"] = `
varying vec2 vUV;
varying float linearDepth;

uniform float cameraNear;
uniform float rcpCameraRange;

void main()
{
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    linearDepth = (-viewPosition.z - cameraNear) * rcpCameraRange;
    gl_Position = projectionMatrix * viewPosition;
    vUV = uv;
}
`;
ShaderLibrary["linear_depth_fragment.glsl"] = `
varying float linearDepth;

void main()
{
    gl_FragColor = floatToRGBA8(linearDepth);
}
`;
ShaderLibrary["linear_hair_depth_fragment.glsl"] = `
varying vec2 vUV;
varying float linearDepth;
uniform sampler2D alphaMap;
uniform float alpha_test;

// uniform sampler2D depthMap_prev;
// uniform vec2 screen_size;
uniform int layer;

void main()
{
    float alpha = texture2D(alphaMap, vUV).g;
    if (alpha < alpha_test) discard;


    if(layer==0){
        gl_FragColor = floatToRGBA8(linearDepth);
        // gl_FragColor = vec4(1.,0.,0.,1.);
    } else {
        // // gl_FragColor = texture2D(depthMap_prev,uv_screen)*2.0;
        // gl_FragColor = floatToRGBA8(linearDepth);
        // // gl_FragColor = vec4(1.0,1.0,1.0,1.0);
        // return;

        // vec2 uv_screen = gl_FragCoord.xy/screen_size;
        // float depth_prev = RGBA8ToFloat(texture2D(depthMap_prev,uv_screen));

        // float uDepthOffset=0.0;
        // // if(depth_prev + uDepthOffset - linearDepth >= 0. ) discard;


        // if (uv_screen.x<0.5){
        //     gl_FragColor = floatToRGBA8(depth_prev);
        //     gl_FragColor = vec4(uv_screen,0.0,1.0);
        //     gl_FragColor = texture2D(depthMap_prev,uv_screen);
        // }
        // else
        //     gl_FragColor = floatToRGBA8(linearDepth);
    
    }

    // [0, 1]
}
`;


// ███████╗██╗  ██╗██╗███╗   ██╗███╗   ███╗ █████╗ ████████╗███████╗██████╗ ██╗ █████╗ ██╗     
// ██╔════╝██║ ██╔╝██║████╗  ██║████╗ ████║██╔══██╗╚══██╔══╝██╔════╝██╔══██╗██║██╔══██╗██║     
// ███████╗█████╔╝ ██║██╔██╗ ██║██╔████╔██║███████║   ██║   █████╗  ██████╔╝██║███████║██║     
// ╚════██║██╔═██╗ ██║██║╚██╗██║██║╚██╔╝██║██╔══██║   ██║   ██╔══╝  ██╔══██╗██║██╔══██║██║     
// ███████║██║  ██╗██║██║ ╚████║██║ ╚═╝ ██║██║  ██║   ██║   ███████╗██║  ██║██║██║  ██║███████╗
// ╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝

ShaderLibrary["skin_vertex.glsl"] = `
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
`;
ShaderLibrary["skin_fragment.glsl"] = `
varying vec2 vUV;
varying vec3 vViewNormal;
varying vec3 vViewPosition;
varying vec4 vShadowCoord;
varying vec4 vProjection;

uniform sampler2D diffuseMap;
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
    vec4 diffuse = texture2D(diffuseMap, vUV);

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


    float thickness = (1.0 - roughnessAOThickness.z) * thicknessRange + 0.01;
    float offset = roughnessAOThickness.z * thicknessRange + 0.01;
    float shadowTransmission = getShadow(2.0 * offset);
    vec3 transmission_color = exp(-transmittanceColor * thickness);
    vec3 shadow_diffuse_light = beckmann_getDiffuseLight(-viewNormal, vViewPosition, shadowTransmission);
    vec3 transmission_diffuse_light = transmission_color*shadow_diffuse_light;
    vec3 diffuseLight_sss_tm = diffuseLight_sss + transmission_diffuse_light;
    vec3 col = diffuse.xyz * diffuseLight_sss_tm + specularLight * specular_intensity;


    if (return_stage == 1) {
        gl_FragColor = vec4(diffuseLight_sss, 1.0);
    } else if (return_stage == 2) {
        gl_FragColor = vec4(shadowTransmission);
    } else if (return_stage == 3) {
        gl_FragColor = vec4(shadow_diffuse_light, 1.0);
    } else {
        gl_FragColor = vec4(col, 1.0);
    }
}
`;





// ██╗  ██╗ █████╗ ██╗██████╗     ███╗   ███╗ █████╗ ████████╗███████╗██████╗ ██╗ █████╗ ██╗     
// ██║  ██║██╔══██╗██║██╔══██╗    ████╗ ████║██╔══██╗╚══██╔══╝██╔════╝██╔══██╗██║██╔══██╗██║     
// ███████║███████║██║██████╔╝    ██╔████╔██║███████║   ██║   █████╗  ██████╔╝██║███████║██║     
// ██╔══██║██╔══██║██║██╔══██╗    ██║╚██╔╝██║██╔══██║   ██║   ██╔══╝  ██╔══██╗██║██╔══██║██║     
// ██║  ██║██║  ██║██║██║  ██║    ██║ ╚═╝ ██║██║  ██║   ██║   ███████╗██║  ██║██║██║  ██║███████╗
// ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝    ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝

ShaderLibrary["hair_vertex.glsl"] = `
varying vec2 vUV;
varying vec3 vViewNormal;
varying vec3 vViewPosition;
varying vec4 vShadowCoord;
varying vec4 vProjection;
varying vec3 vTangent;
varying vec3 vNormal;

uniform mat4 shadowMapMatrix;

void main() {
    vec3 localPos = position;
    vec4 viewPos = modelViewMatrix * vec4(localPos, 1.0);
    vec4 worldPos = modelMatrix * vec4(localPos, 1.0);

    vTangent=(modelMatrix*tangent).xyz;
    vNormal=(modelMatrix*vec4(normal,1.0)).xyz;

    gl_Position = vProjection = projectionMatrix * viewPos;
    vUV = uv;

    vViewNormal = normalMatrix * normal;
    vViewPosition = viewPos.xyz;
    vShadowCoord = shadowMapMatrix * worldPos * .5 + .5;
}
`;
ShaderLibrary["hair_fragment.glsl"] = `
varying vec2 vUV;
varying vec3 vViewNormal;
varying vec3 vViewPosition;
varying vec4 vShadowCoord;
varying vec4 vProjection;
varying vec3 vTangent;
varying vec3 vNormal;

uniform float normalSpecularReflectance;
uniform sampler2D diffuseMap;
uniform sampler2D normalMap;
uniform sampler2D irradianceMap;
uniform sampler2D specularMap;
uniform sampler2D shadowMap;
uniform sampler2D alphaMap;
uniform sampler2D roughnessMap;

uniform sampler2D specular_map;
uniform sampler2D scatter_map;

uniform mat4 shadowMapMatrix;
uniform float alpha_test;

uniform float tangent_shift_0;
uniform float specular_exp_0;
uniform float tangent_shift_1;
uniform float specular_exp_1;

uniform int return_stage;

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

float getShadow2(float offset)
{
    vec4 coord = vShadowCoord;
    coord.z -= offset;
    vec2 moments = getVSMMoments(coord.xy);
    float p = linearStep(coord.z - 0.2, coord.z, moments.x);
    return p;
    float variance = moments.y - moments.x * moments.x;
    variance = max(variance, MIN_VARIANCE);

    float diff = coord.z - moments.x;
    float upperBound = variance / (variance + diff*diff);
    float shadow = linearStep(LIGHT_BLEED_REDUCTION, 1.0, upperBound);
    return clamp(max(shadow, p), 0.0, 1.0);
}

float StrandSpecular (vec3 strand_dir, vec3 normal_dir, vec3 view_dir, vec3 light_dir, float exponent){
    vec3 half_dir = normalize(light_dir + view_dir);
    float dotTH = dot(strand_dir, half_dir);
    float sinTH = sqrt(1.0 - dotTH*dotTH);
    float dirAtten = smoothstep(-1.0, 0.0, dotTH);

    // float dotNH = dot(normal_dir, half_dir);
    // dotNH=smoothstep(-1.0,1.0,dotNH);
    // dotNH=pow(dotNH,20.0);


    // return dotNH;
    // return dirAtten * pow(sinTH*dotNH, exponent);
    // return dirAtten * pow(dotNH, exponent);
    return dirAtten * pow(sinTH, exponent);
}

vec3 ShiftTangent (vec3 strand_dir, vec3 normal_dir, float shift) {
    vec3 strand_dir_shifted = strand_dir + shift * normal_dir;
    return normalize (strand_dir_shifted);
}

float fresnel_dielectric_cos(float cosi, float eta)
{
  /* compute fresnel reflectance without explicitly computing
   * the refracted direction */
  float c = abs(cosi);
  float g = eta * eta - 1.0 + c * c;
  float result;

  if (g > 0.0) {
    g = sqrt(g);
    float A = (g - c) / (g + c);
    float B = (c * (g + c) - 1.0) / (c * (g - c) + 1.0);
    result = 0.5 * A * A * (1.0 + B * B);
  }
  else
    result = 1.0; /* TIR (no refracted component) */

  return result;
}

float fresnel_approx(float cosi, float F0){
    float NdotL = max(cosi, 0.0);
    float cosAngle = 1.0 - NdotL;
    float fresnel = normalSpecularReflectance + (1.0 - normalSpecularReflectance) * pow(cosAngle, 5.0);
    return fresnel;
}












// #define _USE_LIGHT_FACING_NORMAL
// #define _USE_ADVANCED_MULTIPLE_SCATTERING
#define DEFAULT_HAIR_SPECULAR_VALUE 0.0465 // Hair is IOR 1.55

struct BSDFData {
    vec3 fresnel0;
    float cuticleAngleR;
    float cuticleAngleTT;
    float cuticleAngleTRT;
    float roughnessR;
    float roughnessTT;
    float roughnessTRT;
    vec3 absorption;
    float perceptualRoughnessRadial;
};

struct HairAngle
{
    float sinThetaI;
    float sinThetaO;
    float cosThetaI;
    float cosThetaO;
    float cosThetaD;
    float thetaH;
    float phiI;
    float phiO;
    float phi;
    float cosPhi;
    float sinThetaT;
    float cosThetaT;
};

struct CBSDF {
    vec3 diffR;
    vec3 specR;
};

float saturate(float value){
    return clamp(value,0.0,1.0);
}

float rsqrt(float value)
{
  return pow(value, -0.5);
}

float SafeSqrt(float x)
{
    return sqrt(max(0.0, x));
}
float Sq(float x){
    return x*x;
}
vec3 Sq(vec3 x){
    return x*x;
}
float rcp(float x){
    return 1.0/x;
}
vec3 rcp(vec3 x){
    return 1.0/x;
}

float F_Schlick(float F0, float cosi){
    cosi = max(cosi, 0.0);
    float fresnel = F0 + (1.0 - F0) * pow(1.0 - cosi, 5.0);
    return fresnel;
}
vec3 F_Schlick(vec3 F0, float cosi){
    cosi = max(cosi, 0.0);
    vec3 fresnel = F0 + (1.0 - F0) * pow(1.0 - cosi, 5.0);
    return fresnel;
}

float ModifiedRefractionIndex(float cosThetaD)
{
    // Original derivation of modified refraction index for arbitrary IOR.
    // float sinThetaD = sqrt(1 - Sq(cosThetaD));
    // return sqrt(Sq(eta) - Sq(sinThetaD)) / cosThetaD;

    // Karis approximation for the modified refraction index for human hair (1.55)
    return 1.19 / cosThetaD + (0.36 * cosThetaD);
}

void GetHairAngleWorld(vec3 V, vec3 L, vec3 T, inout HairAngle angles)
{
    angles.sinThetaO = dot(T, V);
    angles.sinThetaI = dot(T, L);

    float thetaO = asin(angles.sinThetaO);
    float thetaI = asin(angles.sinThetaI);
    angles.thetaH = (thetaI + thetaO) * 0.5;

    angles.cosThetaD = cos((thetaO - thetaI) * 0.5);
    angles.cosThetaO = cos(thetaO);
    angles.cosThetaI = cos(thetaI);

    // Projection onto the normal plane, and since phi is the relative angle, we take the cosine in this projection.
    vec3 VProj = V - angles.sinThetaO * T;
    vec3 LProj = L - angles.sinThetaI * T;
    angles.cosPhi = dot(LProj, VProj) * rsqrt(dot(LProj, LProj) * dot(VProj, VProj) + 1e-5); // zero-div guard
    angles.phi = acos(angles.cosPhi);

    // Fixed for approximate human hair IOR
    angles.sinThetaT = angles.sinThetaO / 1.55;
    angles.cosThetaT = SafeSqrt(1.0 - Sq(angles.sinThetaT));
}

vec3 D_LongitudinalScatteringGaussian(vec3 thetaH, vec3 beta)
{
    float sqrtTwoPi = 2.50662827463100050241;
    return rcp(beta * sqrtTwoPi) * exp(-Sq(thetaH) / (2.0 * Sq(beta)));
}

#define PI 3.14159265359
#define TWO_PI 6.28318530717958647693
#define FOUR_PI ((2.0*TWO_PI))
#define INV_PI 0.31830988618379067153776752674502872406891929148091

vec3 GetRoughenedAzimuthalScatteringDistribution(float phi, float cosThetaD, float beta)
{
    float X = (phi + TWO_PI) / FOUR_PI;
    float Y = cosThetaD;
    float Z = beta;

    // TODO: It should be possible to reduce the domain of the integration to 0 -> HALF/PI as it repeats. This will save memory.
    // return SAMPLE_TEXTURE3D_LOD(_PreIntegratedAverageHairFiberScattering, s_linear_clamp_sampler, vec3(X, Y, Z), 0).xyz;
    return texture(scatter_map, vec2(X,Y)).xyz*3.23;
    return vec3(0.0);
}


#define HAIR_H_TT  0.0
#define HAIR_H_TRT 0.86602540378

vec3 AbsorptionFromReflectance(vec3 diffuseColor, float azimuthalRoughness)
{
    float beta  = azimuthalRoughness;
    float beta2 = beta  * beta;
    float beta3 = beta2 * beta;
    float beta4 = beta3 * beta;
    float beta5 = beta4 * beta;

    // Least squares fit of an inverse mapping between scattering parameters and scattering albedo.
    float denom = 5.969 - (0.215 * beta) + (2.532 * beta2) - (10.73 * beta3) + (5.574 * beta4) + (0.245 * beta5);

    vec3 t = log(diffuseColor) / denom;
    return t * t;
}

BSDFData init_bsdf(){
    BSDFData bsdfData;

    bsdfData.fresnel0=vec3(DEFAULT_HAIR_SPECULAR_VALUE);

    float cuticleAngle=0.1;
    // bsdfData.cuticleAngle    = -cuticleAngle;
    bsdfData.cuticleAngleR   = -cuticleAngle;
    bsdfData.cuticleAngleTT  =  cuticleAngle * 0.5;
    bsdfData.cuticleAngleTRT =  cuticleAngle * 1.5;

    float roughnessL=0.1;
    bsdfData.roughnessR   = roughnessL;
    bsdfData.roughnessTT  = roughnessL * 0.5;
    bsdfData.roughnessTRT = roughnessL * 2.0;

    bsdfData.perceptualRoughnessRadial=0.3;
    bsdfData.absorption=AbsorptionFromReflectance(vec3(0.1),bsdfData.perceptualRoughnessRadial);

    return bsdfData;
}

CBSDF EvaluateBSDF(vec3 V, vec3 L, vec3 T, vec3 N, BSDFData bsdfData)
{

    CBSDF cbsdf;


    // Approximation of the three primary paths in a hair fiber (R, TT, TRT), with concepts from:
    // "Strand-Based Hair Rendering in Frostbite" (Tafuri 2019)
    // "A Practical and Controllable Hair and Fur Model for Production Path Tracing" (Chiang 2016)
    // "Physically Based Hair Shading in Unreal" (Karis 2016)
    // "An Energy-Conserving Hair Reflectance Model" (d'Eon 2011)
    // "Light Scattering from Human Hair Fibers" (Marschner 2003)

    // Reminder: All of these flags are known at compile time and the compiler will strip away the unused paths.

    // Retrieve angles via spherical coordinates in the hair shading space.
    HairAngle angles;
    GetHairAngleWorld(V, L, T, angles);

    vec3 alpha = vec3(
        bsdfData.cuticleAngleR,
        bsdfData.cuticleAngleTT,
        bsdfData.cuticleAngleTRT
    );

    vec3 beta = vec3(
        bsdfData.roughnessR,
        bsdfData.roughnessTT,
        bsdfData.roughnessTRT
    );

    // The index of refraction that can be used to analyze scattering in the normal plane (Bravais' Law).
    float etaPrime = ModifiedRefractionIndex(angles.cosThetaD);

    // Reduced absorption coefficient.
    vec3 mu = bsdfData.absorption;

    // Various misc. terms reused between lobe evaluation.
    vec3 F=vec3(0.0);
    vec3 Tr=vec3(0.0);
    vec3 S=vec3(0.0);

    // Evaluate the longitudinal scattering for all three paths.
    vec3 M = D_LongitudinalScatteringGaussian(angles.thetaH - alpha, beta);
    // greater thetaH => smaller M

    // Save the attenuations in case of multiple scattering.
    vec3 A[3];

    // Fetch the preintegrated azimuthal distributions for each path
    vec3 D = GetRoughenedAzimuthalScatteringDistribution(angles.phi, angles.cosThetaD, bsdfData.perceptualRoughnessRadial);
    // phi=0 => max
    // phi=+-pi => 0
    // cosThetaD is cos(IO/2); greater IO angle => smaller cosThetaD; 
    // 0 angle => cosThetaD=1; 
    // full angle => cosThetaD=0;
    // cosThetaD no affect on 0

    // Solve the first three lobes (R, TT, TRT).

    // R
    {
        // Attenuation for this path as proposed by d'Eon et al, replaced with a trig identity for cos half phi.
        A[0] = F_Schlick(bsdfData.fresnel0, sqrt(0.5 + 0.5 * dot(L, V)));
        S += M[0] * A[0] * D[0];
    }

    // TT
    if (true)
    {
        // Attenutation (Simplified for H = 0)
        float cosGammaO = SafeSqrt(1.0 - Sq(HAIR_H_TT));
        float cosTheta  = angles.cosThetaO * cosGammaO;
        F = F_Schlick(bsdfData.fresnel0, cosTheta);

        float sinGammaT = HAIR_H_TT / etaPrime;
        float cosGammaT = SafeSqrt(1.0 - Sq(sinGammaT));
        Tr = exp(-mu * (2.0 * cosGammaT / angles.cosThetaT));

        A[1] = Sq(1.0 - F) * Tr;

        S += M[1] * A[1] * D[1];
    }

    // TRT
    {
        // Attenutation (Simplified for H = √3/2)
        float cosGammaO = SafeSqrt(1.0 - Sq(HAIR_H_TRT));
        float cosTheta  = angles.cosThetaO * cosGammaO;
        F = F_Schlick(bsdfData.fresnel0, cosTheta);

        float sinGammaT = HAIR_H_TRT / etaPrime;
        float cosGammaT = SafeSqrt(1.0 - Sq(sinGammaT));
        Tr = exp(-mu * (2.0 * cosGammaT / angles.cosThetaT));

        A[2] = Sq(1.0 - F) * F * Sq(Tr);

        S += M[2] * A[2] * D[2];
    }

    // TODO: Residual TRRT+ Lobe. (accounts for ~15% energy otherwise lost by the first three lobes).

    // This seems necesarry to match the reference.
    S *= INV_PI;

    // Transmission event is built into the model.
    // Some stubborn NaNs have cropped up due to the angle optimization, we suppress them here with a max for now.
    cbsdf.specR = max(S, 0.0);

    // gl_FragColor=vec4(cbsdf.specR,1.0);


    // Multiple Scattering
#ifdef _USE_ADVANCED_MULTIPLE_SCATTERING
    if (true)
    {
        cbsdf.specR = EvaluateMultipleScattering(L, cbsdf.specR, bsdfData, alpha, beta, angles.thetaH, angles.sinThetaI, D, A);
    }
    else
#endif
    {

        #ifdef _USE_LIGHT_FACING_NORMAL
            // The Kajiya-Kay model has a "built-in" transmission, and the 'NdotL' is always positive.
            float cosTL = dot(T, L);
            float sinTL = sqrt(saturate(1.0 - cosTL * cosTL));
            float NdotL = sinTL; // Corresponds to the cosine w.r.t. the light-facing normal
        #else
            // Double-sided Lambert.
            float NdotL = dot(N, L);
        #endif
        
            float clampedNdotL = saturate(NdotL);


        #ifdef _USE_LIGHT_FACING_NORMAL
            // See "Analytic Tangent Irradiance Environment Maps for Anisotropic Surfaces".
            cbsdf.diffR = vec3(rcp(PI * PI) * clampedNdotL);
            // // Transmission is built into the model, and it's not exactly clear how to split it.
            // cbsdf.diffT = 0;
        #else
            // Double-sided Lambert.
            // cbsdf.diffR = vec3(Lambert() * clampedNdotL);
            cbsdf.diffR = vec3(clampedNdotL);
        #endif // _USE_LIGHT_FACING_NORMAL
    }

    return cbsdf;
}































void main() {

    float alpha = texture2D(alphaMap, vUV).g;
    if (alpha < alpha_test) discard;
    
    float roughness = texture2D(roughnessMap, vUV).g;

    // ======                                      
    // normal                                      
    // ======

    vec3 tangent=normalize(vTangent);
    vec3 normal=normalize(vNormal);
    vec3 bitangent=normalize(cross(normal,tangent));

    vec3 tangent_normal_sample = texture2D(normalMap, vUV).xyz * 2.0 - 1.0;
    tangent_normal_sample.x*=-1.0;

    mat3 BTN=mat3( bitangent, tangent, normal );
    vec3 normal_perturb=normalize(BTN*tangent_normal_sample);
    vec3 viewNormal = mat3(viewMatrix)* normal_perturb;

    vec3 strand_dir=-bitangent;

    vec3 view_dir=normalize(-vViewPosition) * mat3(viewMatrix);
    vec3 light_dir=normalize(directionalLights[0].direction * mat3(viewMatrix));


    // vec3 specular_color_0=vec3(0.2);
    // vec3 specular_color_1=vec3(0.18,0.15,0.15);

    // vec3 specular_hair_0 = specular_color_0* StrandSpecular(ShiftTangent(strand_dir,normal_perturb,tangent_shift_0),normal_perturb, view_dir, light_dir, specular_exp_0);
    // vec3 specular_hair_1 = specular_color_1* StrandSpecular(ShiftTangent(strand_dir,normal_perturb,tangent_shift_1),normal_perturb, view_dir, light_dir, specular_exp_1);

    // vec3 specular_color=(specular_hair_0+specular_hair_1)*(0.1+specularLight);

    // vec3 color=diffuse * diffuseLight*0.2 + specular_color;


    // ======
    // anisotropic
    // ======

    float anisotropic_roughness=0.038;
    float anisotropic_strength=1.0;
    float specular_sample=texture(specular_map,vUV).g;
    vec3 base_sample=texture(diffuseMap,vUV).rgb;
    vec3 anisotropic_color=vec3(1.0,0.799,0.69);


    float anisotropic_IOR=anisotropic_roughness*4.0+1.0;

    float fresnel=fresnel_dielectric_cos(dot(view_dir,-strand_dir),anisotropic_IOR);
    float specular_rate=fresnel*specular_sample;

    vec3 final_anisotropic_color=mix(base_sample*0.2,anisotropic_color,specular_rate);




    vec3 diffuseLight = vec3(0.0);
    vec3 specularLight = vec3(0.0);

    // float shadow = getShadow(0.05);
    float shadow = getShadow2(0.0);
    // gl_FragColor=vec4(shadow);
    // return;

    float normalSpecularReflectance=0.027;
    beckmann_getLight(viewNormal, roughness, normalSpecularReflectance, vViewPosition, shadow, diffuseLight, specularLight);


    float geomOcclusion=1.0-roughness*roughness;
    
    vec4 irradianceSample = sampleLatLong(irradianceMap, normal_perturb);
    diffuseLight += irradianceSample.xyz;

    vec3 env_specular_sample = sampleLatLong(specularMap, reflect(-view_dir,normal_perturb)).xyz;


    vec3 env_specular_light=env_specular_sample * fresnel * geomOcclusion;
    specularLight += env_specular_light;


    // vec3 col = diffuse * diffuseLight + specularLight;
    vec3 color = final_anisotropic_color * diffuseLight;


    // gl_FragColor=vec4(color,1.0);
    gl_FragColor=vec4(env_specular_light,1.0);



    BSDFData b=init_bsdf();
    CBSDF c=EvaluateBSDF(view_dir, light_dir, bitangent, normal_perturb, b);

    // gl_FragColor=vec4(c.specR,1.0);
    // gl_FragColor=vec4(c.specR*env_specular_sample*shadow+env_specular_light*0.2+base_sample* diffuseLight*0.5,1.0);

    vec3 specular_light_color=c.specR*specular_sample*shadow*5.0*anisotropic_color;

    gl_FragColor=vec4(specular_light_color+env_specular_light*0.2+base_sample* diffuseLight*0.5,1.0);

}
`;




// ███████╗██╗  ██╗██╗   ██╗
// ██╔════╝██║ ██╔╝╚██╗ ██╔╝
// ███████╗█████╔╝  ╚████╔╝ 
// ╚════██║██╔═██╗   ╚██╔╝  
// ███████║██║  ██╗   ██║   
// ╚══════╝╚═╝  ╚═╝   ╚═╝   
ShaderLibrary["sky_vertex.glsl"] = `
varying vec3 worldViewDir;

void main() {
    vec3 worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    worldViewDir = worldPosition - cameraPosition;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
ShaderLibrary["sky_fragment.glsl"] = `
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
`;



ShaderLibrary["dof_fragment.glsl"] = `
uniform sampler2D source;
uniform sampler2D blurred1;
uniform sampler2D blurred2;
uniform sampler2D depth;

uniform float strength;
uniform float focusDepth;
uniform float focusRange;
uniform float focusFalloff;

varying vec2 vUV;

void main()
{
    const float blendCutoff = .5;
    float depth = RGBA8ToFloat(texture2D(depth, vUV));
    float distance = abs(depth - focusDepth);

    float blurAmount = clamp((distance - focusRange) / focusFalloff, 0.0, 1.0);

    vec3 mainCol = decodeHDRE(texture2D(source, vUV));
    vec3 blurredCol1 = decodeHDRE(texture2D(blurred1, vUV));
    vec3 blurredCol2 = decodeHDRE(texture2D(blurred2, vUV));

    // for little blurs (0.0 - 0.25), use smaller amount, for (.5, 1.0), use larger blur
    float smallBlur = linearStep(0.0, blendCutoff, blurAmount);
    float largeBlur = linearStep(blendCutoff, 1.0, blurAmount);
    vec3 color = mix(blurredCol1, blurredCol2, largeBlur);
    color = mix(mainCol, color, smallBlur * strength);

    gl_FragColor = encodeHDRE(color);
}
`;
ShaderLibrary["fxaa_tonemap_fragment.glsl"] = `
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
`;



// ███████╗███████╗███████╗██████╗ ██╗     ██╗   ██╗██████╗ ███████╗██╗  ██╗ █████╗ ██████╗ ███████╗██████╗ 
// ██╔════╝██╔════╝██╔════╝██╔══██╗██║     ██║   ██║██╔══██╗██╔════╝██║  ██║██╔══██╗██╔══██╗██╔════╝██╔══██╗
// ███████╗███████╗███████╗██████╔╝██║     ██║   ██║██████╔╝███████╗███████║███████║██║  ██║█████╗  ██████╔╝
// ╚════██║╚════██║╚════██║██╔══██╗██║     ██║   ██║██╔══██╗╚════██║██╔══██║██╔══██║██║  ██║██╔══╝  ██╔══██╗
// ███████║███████║███████║██████╔╝███████╗╚██████╔╝██║  ██║███████║██║  ██║██║  ██║██████╔╝███████╗██║  ██║
// ╚══════╝╚══════╝╚══════╝╚═════╝ ╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝

ShaderLibrary["sss_blur_vertex.glsl"] = `
varying vec2 vUV;
varying vec3 vViewVector;

uniform mat4 unprojectionMatrix;

void main()
{
    gl_Position = vec4(position, 1.0);
    vUV = uv;
    vec4 unproj = unprojectionMatrix * vec4(position.xy, 0.0, 1.0);
    unproj /= unproj.w;
    vViewVector = -unproj.xyz / unproj.z;
}
`;
ShaderLibrary["sss_blur_fragment.glsl"] = `
varying vec3 vViewVector;
varying vec2 vUV;

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

    vec3 color = texture2D(tDiffuse, vUV).xyz;
    vec3 c1 = color * totalWeights.x;
    vec3 c2 = color * totalWeights.y;
    vec3 c3 = color * totalWeights.z;

    // centerDepth=(real_depth-near)/camera_range
    float centerDepth = RGBA8ToFloat(texture2D(depthMap, vUV));

    vec3 centerPos = vViewVector * (cameraNear + centerDepth * cameraRange);

    vec2 uvLeft = vUV;
    vec2 uvRight = vUV;
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
`;




// ███████╗███████╗███████╗███╗   ███╗ █████╗ ████████╗███████╗██████╗ ██╗ █████╗ ██╗     
// ██╔════╝██╔════╝██╔════╝████╗ ████║██╔══██╗╚══██╔══╝██╔════╝██╔══██╗██║██╔══██╗██║     
// ███████╗███████╗███████╗██╔████╔██║███████║   ██║   █████╗  ██████╔╝██║███████║██║     
// ╚════██║╚════██║╚════██║██║╚██╔╝██║██╔══██║   ██║   ██╔══╝  ██╔══██╗██║██╔══██║██║     
// ███████║███████║███████║██║ ╚═╝ ██║██║  ██║   ██║   ███████╗██║  ██║██║██║  ██║███████╗
// ╚══════╝╚══════╝╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝

ShaderLibrary["sss_vertex.glsl"] = `
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
`;

ShaderLibrary["sss_fragment.glsl"] = `
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
`;



ShaderLibrary["tiny_blur_hdre_fragment.glsl"] = `
uniform sampler2D tDiffuse;

varying vec2 vUV;

uniform vec2 sampleStep;

void main()
{
    vec3 col = decodeHDRE(texture2D(tDiffuse, vUV - sampleStep * .5));
    col += decodeHDRE(texture2D(tDiffuse, vUV + sampleStep * vec2(1.5, -.5)));
    col += decodeHDRE(texture2D(tDiffuse, vUV + sampleStep * vec2(-.5, 1.5)));
    col += decodeHDRE(texture2D(tDiffuse, vUV + sampleStep * 1.5));

    gl_FragColor = encodeHDRE(col * .25);
}
`;
ShaderLibrary["tonemap_fragment.glsl"] = `
uniform sampler2D tDiffuse;
uniform float exposure;

varying vec2 vUV;

void main()
{
    vec4 hdre = texture2D(tDiffuse, vUV);
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
`;
ShaderLibrary["shadow_fragment.glsl"] = `
varying vec4 projection;

uniform float depthBias;

void main()
{
    float depth = projection.z * .5 + .5;

    gl_FragColor = floatToRGBA8(depth + depthBias);
}
`;




// ██╗   ██╗███████╗███╗   ███╗███╗   ███╗ █████╗ ████████╗███████╗██████╗ ██╗ █████╗ ██╗     
// ██║   ██║██╔════╝████╗ ████║████╗ ████║██╔══██╗╚══██╔══╝██╔════╝██╔══██╗██║██╔══██╗██║     
// ██║   ██║███████╗██╔████╔██║██╔████╔██║███████║   ██║   █████╗  ██████╔╝██║███████║██║     
// ╚██╗ ██╔╝╚════██║██║╚██╔╝██║██║╚██╔╝██║██╔══██║   ██║   ██╔══╝  ██╔══██╗██║██╔══██║██║     
//  ╚████╔╝ ███████║██║ ╚═╝ ██║██║ ╚═╝ ██║██║  ██║   ██║   ███████╗██║  ██║██║██║  ██║███████╗
//   ╚═══╝  ╚══════╝╚═╝     ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝

ShaderLibrary["shadow_vertex.glsl"] = `
varying vec4 projection;
varying vec2 vUV;


void main()
{
    gl_Position = projection = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vUV = uv;
}
`;
ShaderLibrary["vsm_fragment.glsl"] = `
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
`;

ShaderLibrary["vsm_hair_fragment.glsl"] = `
varying vec4 projection;
uniform sampler2D alphaMap;
varying vec2 vUV;
uniform float alpha_test;

void main()
{
    float alpha = texture2D(alphaMap, vUV).g;
    if (alpha < alpha_test) discard;

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
`;


// ██╗   ██╗███████╗███╗   ███╗██████╗ ██╗     ██╗   ██╗██████╗ ███████╗██╗  ██╗ █████╗ ██████╗ ███████╗██████╗ 
// ██║   ██║██╔════╝████╗ ████║██╔══██╗██║     ██║   ██║██╔══██╗██╔════╝██║  ██║██╔══██╗██╔══██╗██╔════╝██╔══██╗
// ██║   ██║███████╗██╔████╔██║██████╔╝██║     ██║   ██║██████╔╝███████╗███████║███████║██║  ██║█████╗  ██████╔╝
// ╚██╗ ██╔╝╚════██║██║╚██╔╝██║██╔══██╗██║     ██║   ██║██╔══██╗╚════██║██╔══██║██╔══██║██║  ██║██╔══╝  ██╔══██╗
//  ╚████╔╝ ███████║██║ ╚═╝ ██║██████╔╝███████╗╚██████╔╝██║  ██║███████║██║  ██║██║  ██║██████╔╝███████╗██║  ██║
//   ╚═══╝  ╚══════╝╚═╝     ╚═╝╚═════╝ ╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝

ShaderLibrary["vsm_blur_vertex.glsl"] = `
varying vec2 vUV;
void main() {
    vUV = uv;
    gl_Position = vec4(position, 1.0);
}`;

ShaderLibrary["vsm_blur_fragment.glsl"] = `
#define RADIUS 2
#define NUM_SAMPLES (RADIUS * 2 + 1)

uniform sampler2D tDiffuse;
uniform vec2 step;

varying vec2 vUV;

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
    vec2 sum = getShadowValue(vUV);

    for (int i = 1; i <= RADIUS; ++i) {
        float fi = float(i);
        sum += getShadowValue(vUV - step * fi);
        sum += getShadowValue(vUV + step * fi);
    }

    sum /= float(NUM_SAMPLES);
#ifdef FLOAT_TEX
    gl_FragColor = vec4(sum, 0.0, 1.0);
#else
    gl_FragColor.xy = floatToRG8(sum.x);
    gl_FragColor.zw = floatToRG8(sum.y);
#endif
}
`;









// ██╗   ██╗███╗   ██╗██╗   ██╗███████╗███████╗██████╗ 
// ██║   ██║████╗  ██║██║   ██║██╔════╝██╔════╝██╔══██╗
// ██║   ██║██╔██╗ ██║██║   ██║███████╗█████╗  ██║  ██║
// ██║   ██║██║╚██╗██║██║   ██║╚════██║██╔══╝  ██║  ██║
// ╚██████╔╝██║ ╚████║╚██████╔╝███████║███████╗██████╔╝
//  ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝ ╚══════╝╚══════╝╚═════╝ 

ShaderLibrary["gaussian_blur_hdre_fragment.glsl"] = `
uniform sampler2D tDiffuse;

varying vec2 vUV;

uniform vec2 sampleStep;
uniform float weights[NUM_WEIGHTS];

void main()
{
    vec3 col = decodeHDRE(texture2D(tDiffuse, vUV)) * weights[0];

    for (int i = 1; i <= KERNEL_RADIUS; ++i) {
        vec2 offset = float(i) * sampleStep;
        col += (decodeHDRE(texture2D(tDiffuse, vUV + offset)) + decodeHDRE(texture2D(tDiffuse, vUV - offset))) * weights[i];
    }

    gl_FragColor = encodeHDRE(col);
}
`;
ShaderLibrary["post_vertex.glsl"] = `
varying vec2 vUV;

void main()
{
    gl_Position = vec4(position, 1.0);
    vUV = uv;
}
`;

ShaderLibrary["post_z_vertex.glsl"] = `
varying vec2 vUV;
varying vec3 viewVector;

uniform mat4 unprojectionMatrix;

void main()
{
    gl_Position = vec4(position, 1.0);
    vUV = uv;
    vec4 unproj = unprojectionMatrix * vec4(position.xy, 0.0, 1.0);
    unproj /= unproj.w;
    viewVector = -unproj.xyz / unproj.z;
}
`;

ShaderLibrary["unlit_fragment.glsl"] = `
#ifdef diffuse_MAP
varying vec2 texCoords;
uniform sampler2D diffuseMap;
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
#ifdef diffuse_MAP
    vec4 diffuse = texture2D(diffuseMap, texCoords);
    alpha *= diffuse.w;
    diffuse.xyz *= diffuse.xyz;
    diffuse.xyz *= color;
    vec3 col = diffuse.xyz;
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
`;

ShaderLibrary["unlit_vertex.glsl"] = `
#ifdef diffuse_MAP
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

#ifdef diffuse_MAP
    texCoords = uv;
#endif
}
`;


















export { ShaderLibrary };