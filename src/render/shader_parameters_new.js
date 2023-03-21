import * as THREE from 'three';
import { ShaderLibrary } from './shader_library_new.js';

let VSMBlurShader = {
    uniforms: { tDiffuse: { value: null }, step: { value: new THREE.Vector2(1 / 512, 0) } },
    vertexShader: ShaderLibrary.get("vsm_blur_vertex"),
    fragmentShader: ShaderLibrary.get("vsm_blur_fragment")
};


let TinyBlurHDREShader = {
    uniforms: { tDiffuse: { value: null }, sampleStep: { value: new THREE.Vector2() }, weights: { value: [] } },
    vertexShader: ShaderLibrary.get("post_vertex"),
    fragmentShader: ShaderLibrary.get("tiny_blur_hdre_fragment"),
};

let DOFShader = {
    uniforms: { source: { value: null }, blurred1: { value: null }, blurred2: { value: null }, depth: { value: null }, strength: { value: 1 }, focusDepth: { value: 0.5 }, focusRange: { value: 0.1 }, focusFalloff: { value: 0.1 } },
    vertexShader: ShaderLibrary.get("post_vertex"),
    fragmentShader: ShaderLibrary.get("dof_fragment"),
};
let FXAAToneMapShader = {
    uniforms: { tDiffuse: { value: null }, rcpRenderTargetResolution: { value: new THREE.Vector2() }, whitePoint: { value: 1.3 } },
    vertexShader: ShaderLibrary.get("post_vertex"),
    fragmentShader: ShaderLibrary.get("fxaa_tonemap_fragment"),
};
let GaussianBlurHDREShader = {
    defines: { KERNEL_RADIUS: "5", NUM_WEIGHTS: "6" },
    uniforms: { tDiffuse: { value: null }, sampleStep: { value: new THREE.Vector2() }, weights: { value: [] } },
    vertexShader: ShaderLibrary.get("post_vertex"),
    fragmentShader: ShaderLibrary.get("gaussian_blur_hdre_fragment"),
};

let SSSBlurShader = {
    defines: { RADIUS: 8 },
    uniforms: {
        tDiffuse: { value: null },
        depthMap: { value: null },
        color1: { value: null },
        color2: { value: null },
        color3: { value: null },
        sssProfileMap: { value: null },
        sssProfileScale: { value: 1 },
        sssRange: { value: 1 },
        step: { value: new THREE.Vector2(1 / 512, 0) },
        unprojectionMatrix: { value: new THREE.Matrix4() },
        cameraNear: { value: 0 },
        cameraRange: { value: 0 },
    },
    vertexShader: ShaderLibrary.get("sss_blur_vertex"),
    fragmentShader: ShaderLibrary.get("sss_blur_fragment"),
};

export { VSMBlurShader, TinyBlurHDREShader, DOFShader, FXAAToneMapShader, GaussianBlurHDREShader, SSSBlurShader };