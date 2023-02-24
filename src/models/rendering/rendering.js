import * as THREE from 'three'
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { ShaderLibrary } from './shader_library.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { ColorCorrectionShader } from 'three/addons/shaders/ColorCorrectionShader.js'
import Stats from 'three/addons/libs/stats.module.js'

import {
  FloatTex,
  Skybox,
  OrbitController,
  Entity,
  verifyExtension,
  AssetLibrary,
  SceneDepthRenderer,
  VSMShadowRenderer,
  SSSProfile,
  SSSRenderer,
  DepthOfFieldPass,
  isPlatformMobile,
  QueryString,
  debugMode,
  global_render_target_injector,
  RenderTargetInjector,
} from './utils.js'
import { FXAAToneMapShader } from './shader_parameters.js'

function hello() {
  console.log('hello from sssss rendering', THREE.REVISION)
}

const mesh_profile_default = {
  model: 'assets/juanfu/exported_vs_pca_dis_vn.obj',
  diffuse: 'assets/juanfu/002_diffuse_neutral.png',
  normal: 'assets/juanfu/002_normal_neutral.png',
  specular: 'assets/juanfu/002_specular_neutral.png',
  roughness_ao_thickness: 'assets/juanfu/rat.png',
  roughness_detail: 'assets/juanfu/roughness-detail.jpg',
  env_irradiance: 'assets/env/lapa_4k_panorama_irradiance.hdr',
  env_specular: 'assets/env/lapa_4k_panorama_specular.hdr',
}

// use light, beckmann
class SkinMaterial extends THREE.ShaderMaterial {
  constructor(parameters) {
    var defines = { MIN_VARIANCE: 1e-4, LIGHT_BLEED_REDUCTION: 0.1 }
    parameters.shadowRenderer.floatTexture && (defines.VSM_FLOAT = 1)
    var uniforms = {
      sssMap: { value: null },
      transmittanceColor: { value: new THREE.Color(50, 150, 250) },
      sssTopLayerColor: { value: parameters.sssProfile.getBlendColor(0) },
      albedoMap: { value: parameters.map },
      normalMap: { value: parameters.normalMap },
      roughnessAOThicknessMap: { value: parameters.roughnessAOThicknessMap },
      irradianceMap: { value: parameters.irradianceMap },
      specularMap: { value: parameters.specularMap },
      shadowMap: { value: parameters.shadowRenderer.shadowMap },
      shadowMapMatrix: { value: parameters.shadowRenderer.shadowMapMatrix },
      probeExposure: {
        value: Math.pow(
          2,
          void 0 === parameters.probeExposure ? 0 : parameters.probeExposure
        ),
      },
      normalSpecularReflectance: { value: 0.027 },
      thicknessRange: { value: parameters.thicknessRange || 0.1 },
      roughnessMapRange: {
        value:
          void 0 === parameters.roughnessMapRange
            ? 0.5
            : parameters.roughnessMapRange,
      },
      roughnessMedian: {
        value:
          void 0 === parameters.roughnessMedian
            ? 0.65
            : parameters.roughnessMedian,
      },
      roughnessDetailMap: { value: parameters.roughnessDetailMap },
      roughnessDetailRange: { value: 0.8 },
      specular_intensity: { value: 0.7 },

      return_stage: { value: 0 },
    }

    let uniforms_with_lights = THREE.UniformsUtils.merge([
      uniforms,
      THREE.UniformsLib.lights,
    ])
    super({
      uniforms: uniforms_with_lights,
      defines: defines,
      lights: true,
      vertexShader: ShaderLibrary.get('skin_vertex'),
      fragmentShader:
        ShaderLibrary.getInclude('include_beckmann') +
        ShaderLibrary.get('skin_fragment'),
    })

    this.isSkinMaterial = true
    this.type = 'SkinMaterial'

    this.uniforms.albedoMap.value = parameters.map
    this.uniforms.normalMap.value = parameters.normalMap
    this.uniforms.roughnessAOThicknessMap.value =
      parameters.roughnessAOThicknessMap
    this.uniforms.roughnessDetailMap.value = parameters.roughnessDetailMap
    this.uniforms.irradianceMap.value = parameters.irradianceMap
    this.uniforms.specularMap.value = parameters.specularMap
    this.uniforms.shadowMap.value = parameters.shadowRenderer.shadowMap

    this.uniforms.return_stage.value = 0
    global_render_target_injector.skin_material = this

    this.extensions.derivatives = true
    this._shadowRenderer = parameters.shadowRenderer
    this._shadowRenderer.onUpdate.bind(this._onShadowUpdate, this)
  }

  _onShadowUpdate() {
    this.uniforms.shadowMapMatrix.value = this._shadowRenderer.shadowMapMatrix
    this.uniforms.shadowMap.value = this._shadowRenderer.shadowMap
  }
}

class SimpleThreeProject {
  constructor() {
    this.scene = null
    this.camera = null
    this.renderer = null
    this.container = null
    this.timeScale = 1
    this._content = null
    this._stats = null
    this._renderStats = null
    this._time = null
    this._isRunning = false
    this._initialized = false
  }
  init(debug_mode, asset_library, options) {
    this._options = options || {}
    this._options.alpha = this._options.alpha || false
    this._options.antialias = this._options.antialias || false
    this._options.preserveDrawingBuffer =
      this._options.preserveDrawingBuffer || false
    this.assetLibrary = asset_library
    this._initRenderer()
    this._debugMode = debug_mode
    debug_mode && this._initStats()
    var n = this
    window.addEventListener(
      'resize',
      function () {
        n._resizeCanvas()
      },
      false
    )
    this._content && this._content.init(this)
    this._initialized = true
    this._resizeCanvas()
  }
  get debugMode() {
    return this._debugMode
  }
  get content() {
    return this._content
  }
  set content(e) {
    ;(this._time = null), this._content && this._content.destroy()
    ;(this._content = e), this._initialized && this._content.init(this)
    // this._isRunning && this._content.start()
    this._resizeCanvas()
  }
  _initRenderer() {
    var e = window.devicePixelRatio
    this.renderer = new THREE.WebGLRenderer({
      antialias: this._options.antialias,
      alpha: this._options.alpha,
      preserveDrawingBuffer: this._options.preserveDrawingBuffer,
    })

    this.renderer.setPixelRatio(e)
    this.container = document.getElementById('webglcontainer')
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(
      46.4,
      this.container.clientWidth / this.container.clientWidth,
      1,
      10000
    )
    this.camera.position.z = 100
    this.camera.near = 0.001
    this.camera.far = 100
    this.scene.add(this.camera)
    this.container.innerHTML = ''
    this.container.appendChild(this.renderer.domElement)
  }
  _initStats() {
    ;(this._stats = new Stats()),
      (this._stats.domElement.style.position = 'absolute'),
      (this._stats.domElement.style.bottom = '0px'),
      (this._stats.domElement.style.right = '0px'),
      (this._stats.domElement.style.zIndex = 100),
      // this.container.appendChild(this._stats.domElement);
      document.getElementById('info1').appendChild(this._stats.domElement)
    // (this._renderStats = new THREEx.RendererStats()),
    // (this._renderStats.domElement.style.position = "absolute"),
    // (this._renderStats.domElement.style.bottom = "0px"),
    // (this._renderStats.domElement.style.zIndex = 100),
    // this.container.appendChild(this._renderStats.domElement);
  }
  _resizeCanvas() {
    if (this.renderer) {
      var e = this.container.clientWidth,
        t = this.container.clientHeight
      this.renderer.setSize(e, t),
        (this.renderer.domElement.style.width = e + 'px'),
        (this.renderer.domElement.style.height = t + 'px'),
        (this.camera.aspect = e / t),
        this.camera.updateProjectionMatrix(),
        this._content && this._content.resize(e, t)
    }
  }
  stop() {
    this._isRunning = false
  }
  start() {
    this._isRunning = true
    this._requestAnimationFrame()
  }
  _render() {
    if (this._isRunning) {
      var time_current = new Date().getTime()
      let time_delta = 0
      null !== this._time && (time_delta = time_current - this._time)
      time_delta *= this.timeScale
      this._time = time_current
      this._requestAnimationFrame()
      Entity.ENGINE.update(time_delta)
      this._content && this._content.update(time_delta)

      if (global_render_target_injector.render_type.startsWith('SKIN_'))
        this.renderer.render(this.scene, this.camera)

      if (
        global_render_target_injector.render_type ===
        RenderTargetInjector.Type.FINAL_COMPOSE
      )
        this._content && this._content.effectComposer
          ? this._content.effectComposer.render(time_delta / 1e3)
          : this.renderer.render(this.scene, this.camera)

      // this._stats && (this._renderStats.update(this.renderer), this._stats.update());
      this._stats && this._stats.update()
    }
  }
  _requestAnimationFrame() {
    var project = this
    requestAnimationFrame(function () {
      project._render()
    })
  }
}

// init shadowRenderer
// init depthRenderer
// init sssprofile
// init camera controller
// init directional lights and add to scene
// init skybox, SkinMaterial, geometry+skinmaterial
class SSSSSContent {
  init(project) {
    this.animateLight = true
    this.probeExposure = 0
    this.time = 0
    this.shadowsInvalid = true
    this.assetLibrary = project.assetLibrary
    this.renderer = project.renderer
    this.scene = project.scene
    this.camera = project.camera
    this.container = project.container

    var render_target = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: FloatTex.getHalfOrFloatOrAny(this.renderer),
      stencilBuffer: false,
    })
    this.effectComposer = new EffectComposer(this.renderer, render_target)
    this.effectComposer.addPass(new RenderPass(this.scene, this.camera))

    this.dof = new DepthOfFieldPass(
      this.camera,
      this.scene,
      null,
      FloatTex.getHalfOrFloatOrAny(this.renderer)
    )
    this.dof.focusPosition.set(0, 0, 0)
    this.dof.enabled = false
    // this.dof.enabled = true;
    // this.dof.focusRange = 1;
    // this.dof.focusFalloff = 0.02;
    this.effectComposer.addPass(this.dof)

    this.fxaa = new ShaderPass(FXAAToneMapShader)
    this.fxaa.uniforms.whitePoint.value = 1.7
    this.fxaa.renderToScreen = true
    this.effectComposer.addPass(this.fxaa)

    this.effectColor = new ShaderPass(ColorCorrectionShader)
    this.effectColor.uniforms['powRGB'].value.set(1, 1, 1)
    // this.effectColor.uniforms['mulRGB'].value.set(0.95, 0.97, 1.05);
    this.effectColor.uniforms['mulRGB'].value.set(0.95, 0.97, 1.02)
    this.effectComposer.addPass(this.effectColor)

    this.initSSSProfile()
    this.initCamera()
    this.initLights()

    this.shadowRenderer = new VSMShadowRenderer(
      this.scene,
      this.renderer,
      this.mainLight,
      2048
    )
    this.depthRenderer = new SceneDepthRenderer(
      this.scene,
      this.camera,
      this.renderer,
      0.5
    )
    this.sssMaterialOptions = {
      map: this.assetLibrary.get('diffuse'),
      normalMap: this.assetLibrary.get('normal'),
      roughnessAOThicknessMap: this.assetLibrary.get('roughness_ao_thickness'),
      roughnessDetailMap: this.assetLibrary.get('roughness_detail'),
      irradianceMap: this.assetLibrary.get('env_irradiance'),
      specularMap: this.assetLibrary.get('env_specular'),
      sssProfile: this.sssProfile,
      probeExposure: this.probeExposure,
      shadowRenderer: this.shadowRenderer,
    }

    this.sssRenderer = new SSSRenderer(
      this.scene,
      this.camera,
      this.renderer,
      this.depthRenderer,
      this.sssMaterialOptions,
      0.5
    )
    this.initScene()
  }
  initCamera() {
    var orbit = new OrbitController(this.container)
    orbit.lookAtTarget.z = 0.03
    orbit.radius = 0.3
    orbit.minRadius = 0.05
    orbit.maxRadius = 0.3
    orbit.zoomSpeed = 0.05
    orbit.mouse_constant = 0.0002
    Entity.addComponent(this.camera, orbit)
  }
  initSSSProfile() {
    this.sssProfile = new SSSProfile(256, 1.2)
    this.sssProfile.addLayer(0.0064, new THREE.Color(0.2405, 0.4474, 0.6157))
    this.sssProfile.addLayer(0.0452, new THREE.Color(0.1158, 0.3661, 0.3439))
    this.sssProfile.addLayer(
      0.2719 - 0.0516,
      new THREE.Color(0.1836, 0.1864, 0)
    )
    this.sssProfile.addLayer(2.0062 - 0.2719, new THREE.Color(0.46, 0, 0.0402))
    this.sssProfile.generate()
  }
  initLights() {
    let color = 16774638
    color = 0xffffff
    this.mainLight = new THREE.DirectionalLight(color)
    this.mainLight.position.set(0, 0, -1)
    this.mainLight.intensity = 0.5
    // this.mainLight.castShadow = true
    this.scene.add(this.mainLight)
  }
  initScene() {
    this.assetLibrary.get('env_specular').minFilter = THREE.LinearFilter
    this.assetLibrary.get('env_irradiance').minFilter = THREE.LinearFilter
    this._skybox = new Skybox(
      this.assetLibrary.get('env_specular'),
      3,
      this.probeExposure
    )

    this.camera.add(this._skybox)
    var geometry = this.assetLibrary.get('model')
    this.skinMaterial = new SkinMaterial(this.sssMaterialOptions)
    var face_mesh = new THREE.Mesh(geometry, this.skinMaterial)
    // t.scale.set(0.13, 0.13, 0.13), this.scene.add(t);
    face_mesh.scale.set(0.005, 0.005, 0.005), this.scene.add(face_mesh)
    var boundingbox = new THREE.Box3()
    boundingbox.setFromObject(face_mesh),
      this.shadowRenderer.constrain(face_mesh)
    //  e.computeVertexNormals(), (e.normalsNeedUpdate = true);
  }
  // start() { }
  // destroy() { }
  resize(e, t) {
    this.sssRenderer.resize(e, t)
    var r = window.devicePixelRatio || 1
    ;(e *= r),
      (t *= r),
      this.fxaa &&
        this.fxaa.uniforms.rcpRenderTargetResolution.value.set(1 / e, 1 / t),
      this.effectComposer.setSize(e, t),
      this.depthRenderer.resize(e, t),
      (this.dof.depthTexture = this.depthRenderer.texture)
  }
  update(time_delta) {
    // console.log("updating");
    if (this.animateLight) {
      this.time += time_delta
      this.mainLight.position.set(
        // Math.cos(5e-4 * this.time), Math.sin(5e-4 * this.time), Math.sin(2e-4 * this.time)
        Math.cos(5e-4 * this.time),
        Math.sin(3e-4 * this.time) + 1.25,
        Math.sin(2e-4 * this.time) + 1.2
      )
      this.shadowsInvalid = true
    }

    this.depthRenderer.render()

    this._skybox.visible = false
    this.shadowsInvalid &&
      (this.shadowRenderer.render(), (this.shadowsInvalid = false))
    this.sssRenderer.render()
    this.skinMaterial.uniforms.sssMap.value = this.sssRenderer.texture
    this._skybox.visible = true

    // console.log(this.camera.matrix);
    // direction to the camera
    // var t = 0.055,
    var t = 0.01,
      dx = this.camera.matrix.elements[8],
      dy = this.camera.matrix.elements[9],
      dz = this.camera.matrix.elements[10]
    this.dof.focusPosition.set(dx * t, dy * t, dz * t)
    var i = this.camera.position.length()
    // this.dof.focusRange = Math.max(0.02 + 0.15 * (i - 0.361), 0.002);
    this.dof.focusRange = Math.max(0.02 + 0.15 * (i - 0.361), 0.5)
    this.dof.focusFalloff = Math.max(2 * this.dof.focusRange, 0.008)
    // this.dof.focusFalloff = 0;
  }
}

function startUp(mesh_profile) {
  window.highPerformance = !isPlatformMobile() && !QueryString.lowPerformance
  console.log('window.highPerformance', window.highPerformance)
  let assetLibrary = new AssetLibrary('')
  assetLibrary.queueAsset(
    'model',
    mesh_profile.model,
    AssetLibrary.Type.MODEL,
    OBJLoader
  ),
    assetLibrary.queueAsset(
      'diffuse',
      mesh_profile.diffuse,
      AssetLibrary.Type.TEXTURE_2D
    ),
    assetLibrary.queueAsset(
      'normal',
      mesh_profile.normal,
      AssetLibrary.Type.TEXTURE_2D
    ),
    assetLibrary.queueAsset(
      'roughness_ao_thickness',
      mesh_profile.roughness_ao_thickness,
      AssetLibrary.Type.TEXTURE_2D
    ),
    assetLibrary.queueAsset(
      'roughness_detail',
      mesh_profile.roughness_detail,
      AssetLibrary.Type.TEXTURE_2D
    ),
    assetLibrary.queueAsset(
      'env_irradiance',
      mesh_profile.env_irradiance,
      AssetLibrary.Type.TEXTURE_2D,
      RGBELoader
    ),
    assetLibrary.queueAsset(
      'env_specular',
      mesh_profile.env_specular,
      AssetLibrary.Type.TEXTURE_2D,
      RGBELoader
    ),
    assetLibrary.onComplete.bind(onAssetsLoaded),
    assetLibrary.onProgress.bind(onAssetsProgress),
    assetLibrary.load()
}
function onAssetsProgress(e) {
  if (typeof document === 'undefined') return
  var t = document.getElementById('preloaderProgress')
  t.style.width = Math.floor(100 * e) + '%'
}

function onAssetsLoaded(e) {
  var t = document.getElementById('preloader')
  t.style.display = 'none'
  let mainProject = new SimpleThreeProject()
  window.mainProject = mainProject
  try {
    if (
      (mainProject.init(debugMode, e),
      verifyExtension(mainProject, 'OES_texture_float_linear'))
    ) {
      var r = document.getElementById('info')
      r.style.display = 'block'
      var n = document.getElementById('debugBox')
      n && (n.style.display = debugMode ? 'inline' : 'none'),
        (mainProject.content = new SSSSSContent()),
        mainProject.start()
    }
  } catch (a) {
    console.log(a)
    showError('Whoops, something went wrong. Does your browser support WebGL?')
  }
}

export { hello, mesh_profile_default, startUp, global_render_target_injector }
