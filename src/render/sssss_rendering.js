/* eslint-disable */
import * as THREE from 'three';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { ShaderLibrary } from './shader_library.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { ColorCorrectionShader } from 'three/addons/shaders/ColorCorrectionShader.js';
import Stats from 'three/addons/libs/stats.module.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

import { FloatTex, Skybox, OrbitController, Entity, verifyExtension, SceneDepthRenderer, VSMShadowRenderer, SSSProfile, SSSRenderer, DepthOfFieldPass, isPlatformMobile, QueryString, debugMode, global_render_target_injector, RenderTargetInjector, key_dispose, highPerformance, HairMaterial, global_material_overrider } from "./utils.js"
import { FXAAToneMapShader } from "./shader_parameters.js"

function hello() {
    console.log("hello from sssss rendering", THREE.REVISION);
}


// const assets_profile_static = {
//     roughness_detail: "assets/juanfu/roughness-detail.jpg",
//     env_irradiance: "assets/env/lapa_4k_panorama_irradiance.hdr",
//     env_specular: "assets/env/lapa_4k_panorama_specular.hdr",
// };

const assets_profile_static = {
    roughness_detail: "/assets/juanfu/roughness-detail.jpg",
    env_irradiance: "/assets/env/lapa_4k_panorama_irradiance.hdr",
    env_specular: "/assets/env/lapa_4k_panorama_specular.hdr",
    roughness_ao_thickness: "/assets/juanfu/at.png",
};

const assets_profile_face_1 = {
    model: "assets/juanfu/exported_vs_pca_dis_vn.obj",
    diffuse: "assets/juanfu/002_diffuse_neutral.png",
    normal: "assets/juanfu/002_normal_neutral.png",
    roughness_ao_thickness: "assets/juanfu/rat.png",
};


const assets_profile_face_2 = {
    model: "assets/lhy/exported_vs_pca_dis.threejs.obj",
    diffuse: "assets/lhy/diffuse.jpg",
    normal: "assets/lhy/normal.jpg",
    roughness_ao_thickness: "assets/lhy/rat.jpg",
};


class PersistentAssetsLibrary {
    constructor() {
    }
    get(key) {
        let self = this;
        if (self[key] === void 0) {
            console.log(`[ get undefined ] ${key}`);
        }
        return self[key];
    }
    load_assets(profile, callback, project) {
        let self = this;

        function on_progress(xhr) {
            return;
            if (xhr.lengthComputable) {
                const percentComplete = xhr.loaded / xhr.total * 100;
                console.log(this + " " + Math.round(percentComplete, 2) + '% downloaded');
            }
        }

        function on_error(err) { console.log(err); }

        function on_load_obj(obj) {
            self[this.key] = obj.children[0].geometry;
            console.log(`[ loaded ] ${this.key}`);

            on_load_all(loading);
        }
        function on_load_tex(tex) {
            if (this.key == "diffuse" || this.key == "hair_diffuse") {
                tex.encoding = THREE.sRGBEncoding;
            }
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.minFilter = THREE.LinearMipMapLinearFilter;
            if (this.postfix == "hdr") {
                tex.minFilter = THREE.LinearFilter;
            }
            tex.magFilter = THREE.LinearFilter;
            highPerformance && (tex.anisotropy = 16);
            self[this.key] = tex;
            console.log(`[ loaded ] ${this.key}`);

            on_load_all(loading);
        }

        let on_load_all = function (loading) {
            loading.length_current++;
            if (loading.length_current == loading.length_target) {
                console.log(`[ loaded all ]`);
                let keys = Object.keys(profile);
                if (project) this.update_assets(project, keys);
                if (callback) callback();
            }
        }.bind(this);

        let keys = Object.keys(profile);
        let loading = {
            length_target: keys.length,
            length_current: 0
        };
        keys.forEach((key) => {
            let path = profile[key];
            let loader;
            let on_load;
            let postfix = path.split(".").pop();
            switch (key) {
                case "model":
                case "hair_mesh":
                    loader = new OBJLoader();
                    on_load = on_load_obj;
                    break;

                case "roughness_detail":
                case "diffuse":
                case "normal":
                case "roughness_ao_thickness":
                case "roughness":
                case "hair_diffuse":
                case "hair_alpha":
                case "hair_normal":
                case "hair_roughness":
                case "hair_specular":
                case "hair_scatter":
                    loader = new THREE.TextureLoader();
                    on_load = on_load_tex;
                    break;

                case "env_irradiance":
                case "env_specular":
                    loader = new RGBELoader();
                    on_load = on_load_tex;
                    break;

                default:
                    throw `${key} does not have corresponding loader`;
                    break;
            }
            loader.load(
                path,
                on_load.bind({ key: key, path: path, postfix: postfix }),
                on_progress.bind({ key: key, path: path, postfix: postfix }),
                on_error
            );
        });
    }
    update_assets(project, keys) {
        keys = keys || ["model", "diffuse", "normal", "roughness_ao_thickness", "roughness"];
        keys.forEach((key) => {
            let asset = this.get(key);
            if (asset)
                switch (key) {
                    case "model":
                        if (project.content.face_mesh.geometry) project.content.face_mesh.geometry.dispose();
                        project.content.face_mesh.geometry = asset;
                        break;
                    case "diffuse":
                        project.content.sssMaterialOptions.diffuseMap = asset;
                        project.content.skinMaterial.uniforms.diffuseMap.value = asset;
                        break;
                    case "normal":
                        project.content.sssMaterialOptions.normalMap = asset;
                        project.content.skinMaterial.uniforms.normalMap.value = asset;
                        project.content.sssRenderer._material.uniforms.normalMap.value = asset;
                        break;
                    case "roughness_ao_thickness":
                        project.content.sssMaterialOptions.roughnessAOThicknessMap = asset;
                        project.content.skinMaterial.uniforms.roughnessAOThicknessMap.value = asset;
                        break;
                    case "roughness":
                        project.content.sssMaterialOptions.roughnessMap = asset;
                        project.content.skinMaterial.uniforms.roughnessMap.value = asset;
                        break;


                    case "hair_mesh":
                        if (project.content.hair_mesh.geometry) project.content.hair_mesh.geometry.dispose();

                        asset = BufferGeometryUtils.mergeVertices(asset);
                        asset.computeTangents();

                        project.content.hair_mesh.geometry = asset;
                        break;
                    case "hair_diffuse":
                        project.content.hair_material.uniforms.diffuseMap.value = asset;
                        break;
                    case "hair_alpha":
                        project.content.hair_material.uniforms.alphaMap.value = asset;
                        project.content.depthRenderer._hair_depthMaterial.uniforms.alphaMap.value = asset;
                        project.content.shadowRenderer._hair_vsmMaterial.uniforms.alphaMap.value = asset;
                        break;
                    case "hair_normal":
                        project.content.hair_material.uniforms.normalMap.value = asset;
                        break;
                    case "hair_roughness":
                        project.content.hair_material.uniforms.roughnessMap.value = asset;
                        break;
                    case "hair_specular":
                        project.content.hair_material.uniforms.specular_map.value = asset;
                        break;
                    case "hair_scatter":
                        project.content.hair_material.uniforms.scatter_map.value = asset;
                        break;

                    default:
                        break;
                }
        })
    }
}

let assets_library = new PersistentAssetsLibrary();


// use light, beckmann
class SkinMaterial extends THREE.ShaderMaterial {

    constructor(parameters) {

        var defines = { MIN_VARIANCE: 1e-4, LIGHT_BLEED_REDUCTION: 0.1 };
        parameters.shadowRenderer.floatTexture && (defines.VSM_FLOAT = 1);
        var uniforms = {
            sssMap: { value: null },
            transmittanceColor: { value: new THREE.Color(50, 150, 250) },
            sssTopLayerColor: { value: parameters.sssProfile.getBlendColor(0) },
            diffuseMap: { value: parameters.diffuseMap },
            normalMap: { value: parameters.normalMap },
            roughnessAOThicknessMap: { value: parameters.roughnessAOThicknessMap },
            roughnessMap: { value: parameters.roughnessMap },
            irradianceMap: { value: parameters.irradianceMap },
            specularMap: { value: parameters.specularMap },
            shadowMap: { value: parameters.shadowRenderer.shadowMap },
            shadowMapMatrix: { value: parameters.shadowRenderer.shadowMapMatrix },
            probeExposure: { value: Math.pow(2, void 0 === parameters.probeExposure ? 0 : parameters.probeExposure) },
            normalSpecularReflectance: { value: 0.027 },
            thicknessRange: { value: parameters.thicknessRange || 0.1 },
            roughnessMapRange: { value: void 0 === parameters.roughnessMapRange ? 0.5 : parameters.roughnessMapRange },
            roughnessMedian: { value: void 0 === parameters.roughnessMedian ? 0.65 : parameters.roughnessMedian },
            roughnessDetailMap: { value: parameters.roughnessDetailMap },
            roughnessDetailRange: { value: 0.8 },
            specular_intensity: { value: 0.7 },

            return_stage: { value: 0 },
        };

        let uniforms_with_lights = THREE.UniformsUtils.merge([uniforms, THREE.UniformsLib.lights]);
        super({ uniforms: uniforms_with_lights, defines: defines, lights: true, vertexShader: ShaderLibrary.get("skin_vertex"), fragmentShader: ShaderLibrary.getInclude("include_beckmann") + ShaderLibrary.get("skin_fragment") });

        this.isSkinMaterial = true;
        this.type = 'SkinMaterial';

        this.uniforms.diffuseMap.value = parameters.diffuseMap;
        this.uniforms.normalMap.value = parameters.normalMap;
        this.uniforms.roughnessAOThicknessMap.value = parameters.roughnessAOThicknessMap;
        this.uniforms.roughnessMap.value = parameters.roughnessMap;
        this.uniforms.roughnessDetailMap.value = parameters.roughnessDetailMap;
        this.uniforms.irradianceMap.value = parameters.irradianceMap;
        this.uniforms.specularMap.value = parameters.specularMap;
        this.uniforms.shadowMap.value = parameters.shadowRenderer.shadowMap;

        this.uniforms.return_stage.value = 0;
        global_render_target_injector.skin_material = this;

        this.extensions.derivatives = true;
        this._shadowRenderer = parameters.shadowRenderer;
        this._shadowRenderer.onUpdate.bind(this._onShadowUpdate, this);

    }

    _onShadowUpdate() {
        this.uniforms.shadowMapMatrix.value = this._shadowRenderer.shadowMapMatrix;
        this.uniforms.shadowMap.value = this._shadowRenderer.shadowMap;
    }

}




class SimpleThreeProject {
    constructor(renderer_parameters) {
        this.timeScale = 1;
        this._time = null;
        this.is_running = false;

        // renderer
        this.renderer_parameters = renderer_parameters || {};
        this.renderer_parameters.alpha = this.renderer_parameters.alpha || false;
        this.renderer_parameters.antialias = this.renderer_parameters.antialias || false;
        this.renderer_parameters.preserveDrawingBuffer = this.renderer_parameters.preserveDrawingBuffer || false;
        this.renderer = new THREE.WebGLRenderer({ antialias: this.renderer_parameters.antialias, alpha: this.renderer_parameters.alpha, preserveDrawingBuffer: this.renderer_parameters.preserveDrawingBuffer });
        var e = window.devicePixelRatio;
        this.renderer.setPixelRatio(e);


        // container        
        this.container = document.getElementById("webglcontainer");
        this.container.appendChild(this.renderer.domElement);


        // scene
        this.scene = new THREE.Scene();


        // camera
        this.camera = new THREE.PerspectiveCamera(46.4, this.container.clientWidth / this.container.clientHeight, 1, 10000);
        this.camera.position.z = 100;
        this.camera.near = 0.001;
        this.camera.far = 100;
        this.scene.add(this.camera);


        // content
        this.content = new SSSSSContent(this);


        // resize
        let project = this;
        this.resize_handler = function () { this.need_resize = true; };
        window.addEventListener("resize", this.resize_handler);
        this._resizeCanvas();

        //解决浏览器大小改变resize问题
        this.need_resize = false;
        setInterval(() => {
            this.resize_handler();
        }, 4000);

    }
    _resizeCanvas() {
        if (this.renderer) {
            var width = this.container.clientWidth, height = this.container.clientHeight;

            if (width === 0 || height === 0) return;
            // renderer
            this.renderer.setSize(width, height);
            this.renderer.domElement.style.width = width + "px";
            this.renderer.domElement.style.height = height + "px";

            // camera
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();

            // content
            this.content && this.content.resize(width, height);
        }
    }
    stop() {
        this.is_running = false;
    }
    start() {
        this.is_running = true;
        this._requestAnimationFrame();
    }
    _render() {
        if (this.is_running) {
            if (this.need_resize) {
                this._resizeCanvas();
                this.need_resize = false;
            }

            var time_current = new Date().getTime();
            let time_delta = 0;
            null !== this._time && (time_delta = time_current - this._time);
            time_delta *= this.timeScale;
            this._time = time_current;
            this._requestAnimationFrame();
            Entity.ENGINE.update(time_delta);
            this.content && this.content.update(time_delta);

            if (global_render_target_injector.render_type.startsWith("SKIN_"))
                this.renderer.render(this.scene, this.camera);

            if (global_render_target_injector.render_type === RenderTargetInjector.Type.FINAL_COMPOSE)
                this.content && this.content.effectComposer ? this.content.effectComposer.render(time_delta / 1e3) : this.renderer.render(this.scene, this.camera);

            // this._stats && (this._renderStats.update(this.renderer), this._stats.update());
            // this._stats && (this._stats.update());

            if (window.stats) window.stats.update();


            let current_position = this.content.face_mesh.position;
            let scale = 0.5 ** (time_delta / 100);
            let next_position = new THREE.Vector3(current_position.x * scale, current_position.y * scale, current_position.z * scale);
            this.content.face_mesh.position.set(next_position.x, next_position.y, next_position.z);
        }
    }
    //在这里暂时加了一个 try catch 出现问题的时候直接刷新网页
    _requestAnimationFrame() {
        var project = this;
        requestAnimationFrame(function () {
            project._render();
        });
    }

    dispose() {
        this.container.removeChild(this.renderer.domElement);
        key_dispose(this);
    }


    hide_scene() {
        let project = this;
        project.content.face_mesh.visible = false;
        project.content.hair_mesh.visible = false;

        project.content.orbit._coords.set((Math.random() * 0.4 + 0.3) * Math.PI, (Math.random() * 0.2 + 0.3) * Math.PI, 2);

    }

    show_scene() {
        let project = this;
        project.content.face_mesh.visible = true;
        project.content.hair_mesh.visible = false;

        project.content.face_mesh.position.set(0.5, 0, 0);
        project.resize_handler();
    }

    clean_scene() {
        let project = this;
        if (project.content.face_mesh.geometry) project.content.face_mesh.geometry.dispose();
        project.content.face_mesh.geometry = new THREE.BufferGeometry();
    }

}




// init shadowRenderer
// init depthRenderer
// init sssprofile
// init camera controller
// init directional lights and add to scene
// init skybox, SkinMaterial, geometry+skinmaterial
class SSSSSContent {
    constructor(project) {
        this.animateLight = true;
        this.probeExposure = 0;
        this.time = 0;
        this.shadowsInvalid = true;
        this.renderer = project.renderer;
        this.scene = project.scene;
        this.camera = project.camera;
        this.container = project.container;

        this.render_target = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, type: FloatTex.getHalfOrFloatOrAny(this.renderer), stencilBuffer: false });
        this.effectComposer = new EffectComposer(this.renderer, this.render_target);
        this.effectComposer.addPass(new RenderPass(this.scene, this.camera));


        this.dof = new DepthOfFieldPass(this.camera, this.scene, null, FloatTex.getHalfOrFloatOrAny(this.renderer));
        this.dof.focusPosition.set(0, 0, 0);
        this.dof.enabled = false;
        // this.dof.enabled = true;
        // this.dof.focusRange = 1;
        // this.dof.focusFalloff = 0.02;
        this.effectComposer.addPass(this.dof);


        this.fxaa = new ShaderPass(FXAAToneMapShader);
        this.fxaa.uniforms.whitePoint.value = 1.7;
        this.fxaa.renderToScreen = true;
        this.effectComposer.addPass(this.fxaa);


        this.effectColor = new ShaderPass(ColorCorrectionShader);
        this.effectColor.uniforms['powRGB'].value.set(1, 1, 1);
        // this.effectColor.uniforms['mulRGB'].value.set(0.95, 0.97, 1.05);
        this.effectColor.uniforms['mulRGB'].value.set(0.95, 0.97, 1.02);
        this.effectComposer.addPass(this.effectColor);




        // sss profile
        this.sssProfile = new SSSProfile(256, 1.2);
        this.sssProfile.addLayer(0.0064, new THREE.Color(0.2405, 0.4474, 0.6157));
        this.sssProfile.addLayer(0.0452, new THREE.Color(0.1158, 0.3661, 0.3439));
        this.sssProfile.addLayer(0.2719 - 0.0516, new THREE.Color(0.1836, 0.1864, 0));
        this.sssProfile.addLayer(2.0062 - 0.2719, new THREE.Color(0.46, 0, 0.0402));
        this.sssProfile.generate();


        // orbit control
        var orbit = new OrbitController(this.container);
        orbit.lookAtTarget.z = 0.03;
        orbit.radius = 0.3;
        orbit.minRadius = 0.05;
        orbit.maxRadius = 0.3;
        orbit.zoomSpeed = 0.05;
        orbit.mouse_constant = 0.0002;
        // orbit.mouse_constant = 0.0008;
        Entity.addComponent(this.camera, orbit);
        this.orbit = orbit;


        // light
        let color = 16774638;
        color = 0xffffff;
        this.mainLight = new THREE.DirectionalLight(color);
        this.mainLight.position.set(0, 0, -1);
        // this.mainLight.intensity = 1;
        this.mainLight.intensity = 0.5;
        // this.mainLight.castShadow = true
        this.scene.add(this.mainLight);


        // shadow and depth
        this.shadowRenderer = new VSMShadowRenderer(this.scene, this.renderer, this.mainLight, 2048);
        this.depthRenderer = new SceneDepthRenderer(this.scene, this.camera, this.renderer, 0.5);
        // this.depthRenderer = new SceneDepthRenderer(this.scene, this.camera, this.renderer, 1);


        this.sssMaterialOptions = {
            diffuseMap: null,
            normalMap: null,
            roughnessAOThicknessMap: assets_library.get("roughness_ao_thickness"),
            roughnessMap: null,
            roughnessDetailMap: assets_library.get("roughness_detail"),
            irradianceMap: assets_library.get("env_irradiance"),
            specularMap: assets_library.get("env_specular"),
            sssProfile: this.sssProfile,
            probeExposure: this.probeExposure,
            shadowRenderer: this.shadowRenderer,
        };

        this.sssRenderer = new SSSRenderer(this.scene, this.camera, this.renderer, this.depthRenderer, this.sssMaterialOptions, 0.5);


        // skybox
        this.skybox = new Skybox(assets_library.get("env_specular"), 3, this.probeExposure);
        this.camera.add(this.skybox);


        // mesh
        // let face_geometry = assets_library.get("model");
        this.skinMaterial = new SkinMaterial(this.sssMaterialOptions);
        this.face_mesh = new THREE.Mesh(undefined, this.skinMaterial);
        this.face_mesh.scale.set(0.005, 0.005, 0.005);
        this.scene.add(this.face_mesh);



        // const hair_geometry = new THREE.PlaneGeometry(1, 1);
        // this.hair_material = new HairMaterial();
        // this.hair_mesh = new THREE.Mesh(hair_geometry, this.hair_material);
        // hair.scale.set(0.02, 0.02, 0.02);
        // hair.position.set(0, 0.06, 0.05);
        // this.scene.add(this.hair_mesh);

        // const hair_geometry = new THREE.PlaneGeometry(1, 1);
        this.hair_material = new HairMaterial(this.sssMaterialOptions);
        this.hair_mesh = new THREE.Mesh(undefined, this.hair_material);
        this.hair_mesh.renderOrder = 1;
        this.hair_mesh.scale.set(0.005, 0.005, 0.005);
        this.scene.add(this.hair_mesh);

        this.shadowRenderer.constrain(this.face_mesh);
        //  e.computeVertexNormals(), (e.normalsNeedUpdate = true);


        global_material_overrider.face_mesh = this.face_mesh;
        global_material_overrider.skybox_mesh = this.skybox;
        global_material_overrider.hair_mesh = this.hair_mesh;

    }
    resize(width, height) {
        this.sssRenderer.resize(width, height);
        var r = window.devicePixelRatio || 1;
        width *= r;
        height *= r;
        this.fxaa && this.fxaa.uniforms.rcpRenderTargetResolution.value.set(1 / width, 1 / height);
        this.effectComposer.setSize(width, height);
        this.depthRenderer.resize(width, height);
        this.dof.depthTexture = this.depthRenderer.texture;
    }
    update(time_delta) {
        // console.log("updating");
        if (this.animateLight) {
            this.time += time_delta;
            this.mainLight.position.set(
                // Math.cos(5e-4 * this.time), Math.sin(5e-4 * this.time), Math.sin(2e-4 * this.time)
                Math.cos(5e-4 * this.time), Math.sin(3e-4 * this.time) + 1.25, Math.sin(2e-4 * this.time) + 1.2
            );
            this.shadowsInvalid = true;
        }

        this.depthRenderer.render();


        this.skybox.visible = false;
        if (this.shadowsInvalid) {
            this.shadowRenderer.render();
            this.shadowsInvalid = false;
        }
        this.sssRenderer.render();
        this.skinMaterial.uniforms.sssMap.value = this.sssRenderer.texture;
        this.skybox.visible = true;


        // console.log(this.camera.matrix);
        // direction to the camera
        // var t = 0.055,
        var t = 0.01,
            dx = this.camera.matrix.elements[8],
            dy = this.camera.matrix.elements[9],
            dz = this.camera.matrix.elements[10];
        this.dof.focusPosition.set(dx * t, dy * t, dz * t);
        var i = this.camera.position.length();
        // this.dof.focusRange = Math.max(0.02 + 0.15 * (i - 0.361), 0.002);
        this.dof.focusRange = Math.max(0.02 + 0.15 * (i - 0.361), 0.5);
        this.dof.focusFalloff = Math.max(2 * this.dof.focusRange, 0.008);
        // this.dof.focusFalloff = 0;
    }
    dispose() {
        Entity.removeComponent(this.camera, this.orbit);
        Entity.destroy(this.camera);
        Entity.ENGINE.update(1);
        key_dispose(this.sssMaterialOptions);
        key_dispose(this);
    }
}



let static_project;

function build_project(callback) {
    assets_library.load_assets(assets_profile_static, () => {
        static_project = new SimpleThreeProject();
        static_project.start();
        window.static_project = static_project;

        if (callback) callback();
    });
}

function load_profile(profile, callback) {
    if (!static_project)
        build_project(() => { assets_library.load_assets(profile, callback, static_project); });
    else
        assets_library.load_assets(profile, callback, static_project);
}

export {
    hello,
    global_render_target_injector,
    build_project,
    load_profile,
};