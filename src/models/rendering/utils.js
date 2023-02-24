import * as THREE from 'three'
import { Pass } from 'three/addons/postprocessing/Pass.js'
import { CopyShader } from 'three/addons/shaders/CopyShader.js'

import { ShaderLibrary } from './shader_library.js'
import {
  VSMBlurShader,
  SSSBlurShader,
  TinyBlurHDREShader,
  DOFShader,
} from './shader_parameters.js'

function pauseEvent(e) {
  if (e.stopPropagation) e.stopPropagation()
  if (e.preventDefault) e.preventDefault()
  e.cancelBubble = true
  e.returnValue = false
  return false
}

function isPlatformMobile() {
  var e =
    /AppleWebKit/.test(navigator.userAgent) &&
    /Mobile\/\w+/.test(navigator.userAgent)
  return (
    e ||
    /Android|webOS|BlackBerry|Opera Mini|Opera Mobi|IEMobile/i.test(
      navigator.userAgent
    )
  )
}
let QueryString = (function () {
  if (typeof window === 'undefined')
    return console.log('window is undefined'), {}
  for (
    var e = {},
      t = window.location.search.substring(1),
      r = t.split('&'),
      n = 0;
    n < r.length;
    n++
  ) {
    var a = r[n].split('=')
    if ('undefined' == typeof e[a[0]]) e[a[0]] = decodeURIComponent(a[1])
    else if ('string' == typeof e[a[0]]) {
      var i = [e[a[0]], decodeURIComponent(a[1])]
      e[a[0]] = i
    } else e[a[0]].push(decodeURIComponent(a[1]))
  }
  return e
})()

let debugMode =
  QueryString.debug &&
  '0' !== QueryString.debug &&
  'false' !== QueryString.debug

class CenteredGaussianCurve {
  constructor(variance) {
    ;(this._amplitude = 1 / Math.sqrt(2 * variance * Math.PI)),
      (this._expScale = -1 / (2 * variance))
  }

  getValueAt(x) {
    return this._amplitude * Math.pow(Math.E, x * x * this._expScale)
  }

  // fromRadius(e, t) {
  //     t = t || 0.01;
  //     var r = e / Math.sqrt(-2 * Math.log(t));
  //     return new CenteredGaussianCurve(r * r);
  // }
}

// Get the data type that is supported.
var FloatTex = {
  getFloat(e) {
    if (e.extensions.get('OES_texture_float_linear')) return THREE.FloatType
    throw new Error('Float render targets are unsupported!')
  },
  getHalfOrFloat(e) {
    var t = e.extensions
    if (t.get('OES_texture_half_float_linear')) return THREE.HalfFloatType
    if (t.get('OES_texture_float_linear')) return THREE.FloatType
    throw new Error('Float render targets are unsupported!')
  },
  getHalfOrFloatOrAny(e) {
    var t = e.extensions
    return t.get('OES_texture_half_float_linear')
      ? THREE.HalfFloatType
      : t.get('OES_texture_float_linear')
      ? THREE.FloatType
      : THREE.UnsignedByteType
  },
}

// A render target that can swap
class DoubleBufferTexture {
  constructor(width, height, options) {
    ;(this._width = width),
      (this._height = height),
      (this._sourceFBO = new THREE.WebGLRenderTarget(width, height, options)),
      (this._targetFBO = new THREE.WebGLRenderTarget(width, height, options)),
      (this._sourceFBO.texture.generateMipmaps =
        options.generateMipmaps || false),
      (this._targetFBO.texture.generateMipmaps =
        options.generateMipmaps || false)
  }
  get width() {
    return this._width
  }
  get height() {
    return this._height
  }
  get source() {
    return this._sourceFBO.texture
  }
  get target() {
    return this._targetFBO
  }
  swap() {
    var e = this._sourceFBO
    ;(this._sourceFBO = this._targetFBO), (this._targetFBO = e)
  }
}

// Render a rectangle
class RectRenderer {
  constructor(renderer, mesh) {
    this._renderer = renderer
    this._scene = new THREE.Scene()
    this._camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    this._mesh = mesh || new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null)
    this._scene.add(this._mesh)
  }
  execute(material, render_target, autoclear, camera) {
    var a = this._renderer.autoClear
    this._renderer.autoClear = void 0 === autoclear || autoclear
    this._mesh.material = material
    this._renderer.setRenderTarget(render_target)
    this._renderer.render(this._scene, camera || this._camera)
    this._renderer.setRenderTarget(null)
    this._renderer.autoClear = a
  }
  // clear(render_target) {
  //     this._renderer.setRenderTarget(render_target), this._renderer.clear();
  // }
}

// Variance Shadow Mapping: enable derivatives, backside
class VSMMaterial extends THREE.ShaderMaterial {
  constructor(use_float_texture) {
    var t = ''
    use_float_texture && (t += '#define FLOAT_TEX\n')
    super({
      vertexShader: ShaderLibrary.get('shadow_vertex'),
      fragmentShader: t + ShaderLibrary.get('vsm_fragment'),
    })
    this.extensions.derivatives = true
    this.side = THREE.BackSide
  }
}

class Signal {
  constructor() {
    ;(this._listeners = []), (this._lookUp = {})
  }
  bind(e, t) {
    this._lookUp[e] = this._listeners.length
    var listener = t ? e.bind(t) : e
    this._listeners.push(listener)
  }
  unbind(e) {
    var t = this._lookUp[e]
    this._listeners.splice(t, 1), delete this._lookUp[e]
  }
  dispatch(e) {
    for (var t = this._listeners.length, r = 0; r < t; ++r)
      this._listeners[r](e)
  }
  get hasListeners() {
    return this._listeners.length > 0
  }
}

// Sky box mesh
class Skybox extends THREE.Mesh {
  constructor(env_map, width, exposure_exp, hdre) {
    width = width || 1e3
    var box = new THREE.BoxGeometry(width, width, width)
    box.scale(-1, 1, 1)
    var material = new SkyMaterial({
      envMap: env_map,
      exposure: exposure_exp || 0,
      hdre: hdre,
    })
    super(box, material)
  }
  get texture() {
    return this.material.envMap
  }
  set texture(e) {
    this.material.envMap = e
  }
}

// Panorama for background
class SkyMaterial extends THREE.ShaderMaterial {
  constructor(parameters) {
    var defines = {}
    parameters.envMap instanceof THREE.Texture && (defines.LAT_LONG = '1'),
      parameters.hdre && (defines.HDRE = '1')
    var uniforms = {
      envMap: { value: parameters.envMap },
      exposure: { value: Math.pow(2, parameters.exposure || 0) },
    }
    super({
      uniforms: uniforms,
      defines: defines,
      vertexShader: ShaderLibrary.get('sky_vertex'),
      fragmentShader: ShaderLibrary.get('sky_fragment'),
    })
    this._envMap = parameters.envMap
  }
  get envMap() {
    return this._envMap
  }
  set envMap(e) {
    ;(this._envMap = e), (this.uniforms.envMap.value = e)
  }
}

// Small class that only has a "_entity".
class Component {
  constructor() {
    this._entity = null
  }
  onAdded() {}
  onRemoved() {}
  // onUpdate: null
  get entity() {
    return this._entity
  }
}

// Visualization
class OrbitController extends Component {
  constructor(container, lookat, move_with_keys) {
    super(),
      (this._container = container),
      (this._coords = new THREE.Vector3(0.5 * Math.PI, 0.4 * Math.PI, 2)),
      (this._localAcceleration = new THREE.Vector3(0, 0, 0)),
      (this._localVelocity = new THREE.Vector3(0, 0, 0)),
      (this.lookAtTarget = lookat || new THREE.Vector3(0, 0, 0)),
      (this.zoomSpeed = 2),
      (this.maxRadius = 20),
      (this.minRadius = 0.1),
      (this.dampen = 0.9),
      (this.maxAzimuth = void 0),
      (this.minAzimuth = void 0),
      (this.minPolar = 0.1),
      (this.maxPolar = Math.PI - 0.1),
      (this.moveAcceleration = 0.02),
      (this._m = new THREE.Matrix4()),
      (this._oldMouseX = 0),
      (this._oldMouseY = 0),
      (this._moveWithKeys = move_with_keys),
      (this._moveAcceleration = new THREE.Vector3()),
      (this._moveVelocity = new THREE.Vector3()),
      (this._isDown = false),
      (this.mouse_constant = 0.0015)
    this._initListeners()
  }
  get radius() {
    return this._coords.z
  }
  set radius(e) {
    this._coords.z = e
  }
  get azimuth() {
    return this._coords.x
  }
  set azimuth(e) {
    this._coords.x = e
  }
  get polar() {
    return this._coords.y
  }
  set polar(e) {
    this._coords.y = e
  }
  onAdded() {
    this._isDown = false
    var e = /Firefox/i.test(navigator.userAgent)
      ? 'DOMMouseScroll'
      : 'mousewheel'
    this._container.addEventListener(e, this._onMouseWheel),
      this._container.addEventListener('mousemove', this._onMouseMove),
      this._container.addEventListener('touchmove', this._onTouchMove),
      this._container.addEventListener('mousedown', this._onMouseDown),
      this._container.addEventListener('touchstart', this._onTouchDown),
      this._container.addEventListener('mouseup', this._onUp),
      this._container.addEventListener('touchend', this._onUp),
      this._moveWithKeys &&
        (document.addEventListener('keyup', this._onKeyUp),
        document.addEventListener('keydown', this._onKeyDown))
  }
  onRemoved() {
    var e = /Firefox/i.test(navigator.userAgent)
      ? 'DOMMouseScroll'
      : 'mousewheel'
    this._container.removeEventListener(e, this._onMouseWheel),
      this._container.removeEventListener('mousemove', this._onMouseMove),
      this._container.removeEventListener('touchmove', this._onTouchMove),
      this._container.removeEventListener('mousedown', this._onMouseDown),
      this._container.removeEventListener('touchstart', this._onTouchDown),
      this._container.removeEventListener('mouseup', this._onUp),
      this._container.removeEventListener('touchend', this._onUp),
      this._moveWithKeys &&
        (document.removeEventListener('keyup', this._onKeyUp),
        document.removeEventListener('keydown', this._onKeyDown))
  }
  onUpdate(e) {
    if (this._moveWithKeys) {
      ;(this._moveVelocity.x *= this.dampen),
        (this._moveVelocity.y *= this.dampen),
        (this._moveVelocity.z *= this.dampen),
        (this._moveVelocity.x += this._moveAcceleration.x),
        (this._moveVelocity.y += this._moveAcceleration.y),
        (this._moveVelocity.z += this._moveAcceleration.z)
      var t = new THREE.Vector3()
      t.copy(this._moveVelocity),
        t.applyQuaternion(
          this.entity.quaternion.setFromRotationMatrix(this.entity.matrixWorld)
        ),
        (this.lookAtTarget.x += t.x),
        (this.lookAtTarget.y += this._moveVelocity.y),
        (this.lookAtTarget.z += t.z)
    }
    ;(this._localVelocity.x *= this.dampen),
      (this._localVelocity.y *= this.dampen),
      (this._localVelocity.z *= this.dampen),
      (this._localVelocity.x += this._localAcceleration.x),
      (this._localVelocity.y += this._localAcceleration.y),
      (this._localVelocity.z += this._localAcceleration.z),
      (this._localAcceleration.x = 0),
      (this._localAcceleration.y = 0),
      (this._localAcceleration.z = 0),
      this._coords.add(this._localVelocity),
      (this._coords.y = THREE.MathUtils.clamp(
        this._coords.y,
        this.minPolar,
        this.maxPolar
      )),
      (this._coords.z = THREE.MathUtils.clamp(
        this._coords.z,
        this.minRadius,
        this.maxRadius
      )),
      void 0 !== this.maxAzimuth &&
        void 0 !== this.minAzimuth &&
        (this._coords.x = THREE.MathUtils.clamp(
          this._coords.x,
          this.minAzimuth,
          this.maxAzimuth
        ))
    var r = this.entity,
      n = this._m,
      a = this._fromSphericalCoordinates(
        this._coords.z,
        this._coords.x,
        this._coords.y
      )
    a.add(this.lookAtTarget),
      n.lookAt(a, this.lookAtTarget, new THREE.Vector3(0, 1, 0)),
      n.setPosition(a),
      n.decompose(r.position, r.quaternion, r.scale)
  }
  _fromSphericalCoordinates(e, t, r) {
    var n = new THREE.Vector3()
    return (
      (n.x = e * Math.sin(r) * Math.cos(t)),
      (n.y = e * Math.cos(r)),
      (n.z = e * Math.sin(r) * Math.sin(t)),
      n
    )
  }
  setAzimuthImpulse(e) {
    this._localAcceleration.x = e
  }
  setPolarImpulse(e) {
    this._localAcceleration.y = e
  }
  setZoomImpulse(e) {
    this._localAcceleration.z = e
  }
  _updateMove(e, t) {
    if (void 0 !== this._oldMouseX) {
      var r = e - this._oldMouseX,
        n = t - this._oldMouseY
      this.setAzimuthImpulse(this.mouse_constant * r),
        this.setPolarImpulse(this.mouse_constant * -n)
    }
    ;(this._oldMouseX = e), (this._oldMouseY = t)
  }
  _initListeners() {
    var e = this
    ;(this._onMouseWheel = function (t) {
      var r = t.detail ? -120 * t.detail : t.wheelDelta
      e.setZoomImpulse(-r * e.zoomSpeed * 1e-4)
    }),
      (this._onMouseDown = function (t) {
        pauseEvent(t)
        ;(e._oldMouseX = void 0), (e._oldMouseY = void 0), (e._isDown = true)
      }),
      (this._onMouseMove = function (t) {
        pauseEvent(t)
        e._isDown && e._updateMove(t.screenX, t.screenY)
      }),
      (this._onTouchDown = function (t) {
        pauseEvent(t)
        if (
          ((e._oldMouseX = void 0),
          (e._oldMouseY = void 0),
          2 === t.touches.length)
        ) {
          var r = t.touches[0],
            n = t.touches[1],
            a = r.screenX - n.screenX,
            i = r.screenY - n.screenY
          ;(e._startPitchDistance = Math.sqrt(a * a + i * i)),
            (e._startZoom = e.radius)
        }
        e._isDown = true
      }),
      (this._onTouchMove = function (t) {
        pauseEvent(t)
        if ((t.preventDefault(), e._isDown)) {
          var r = t.touches.length
          if (1 === r) {
            var n = t.touches[0]
            e._updateMove(n.screenX, n.screenY)
          } else if (2 === r) {
            var a = t.touches[0],
              i = t.touches[1],
              o = a.screenX - i.screenX,
              s = a.screenY - i.screenY,
              l = Math.sqrt(o * o + s * s),
              h = e._startPitchDistance - l
            e.radius = e._startZoom + 0.2 * h
          }
        }
      }),
      (this._onUp = function (t) {
        e._isDown = false
      }),
      (this._onKeyUp = function (t) {
        switch (t.keyCode) {
          case 69:
          case 81:
            e._moveAcceleration.y = 0
            break
          case 37:
          case 65:
          case 39:
          case 68:
            e._moveAcceleration.x = 0
            break
          case 38:
          case 87:
          case 40:
          case 83:
            e._moveAcceleration.z = 0
        }
      }),
      (this._onKeyDown = function (t) {
        switch (t.keyCode) {
          case 81:
            e._moveAcceleration.y = -e.moveAcceleration
            break
          case 69:
            e._moveAcceleration.y = e.moveAcceleration
            break
          case 37:
          case 65:
            e._moveAcceleration.x = -e.moveAcceleration
            break
          case 38:
          case 87:
            e._moveAcceleration.z = -e.moveAcceleration
            break
          case 39:
          case 68:
            e._moveAcceleration.x = e.moveAcceleration
            break
          case 40:
          case 83:
            e._moveAcceleration.z = e.moveAcceleration
        }
      })
  }
}

class EntityEngine {
  constructor() {
    ;(this._updateableEntities = []),
      (this._updateQueue = []),
      (this._destroyQueue = [])
  }
  registerEntity(entity) {
    entity._onRequireUpdatesChange.bind(this._onEntityUpdateChange, this),
      entity._requiresUpdates && this._addUpdatableEntity(entity)
  }
  unregisterEntity(entity) {
    entity._onRequireUpdatesChange.unbind(this),
      entity._requiresUpdates && this._removeUpdatableEntity(entity)
  }
  destroyEntity(entity) {
    entity._onRequireUpdatesChange.unbind(this),
      entity._requiresUpdates && this._removeUpdatableEntity(entity),
      this._destroyQueue.push(entity)
  }
  _onEntityUpdateChange(e) {
    e._requiresUpdates
      ? this._addUpdatableEntity(e)
      : this._removeUpdatableEntity(e)
  }
  _addUpdatableEntity(e) {
    this._updateQueue.push({ entity: e, updatable: true })
  }
  _removeUpdatableEntity(e) {
    this._updateQueue.push({ entity: e, updatable: false })
  }
  _processUpdateQueue() {
    var e = this._updateQueue.length
    if (0 !== e) {
      for (var t = 0; t < e; ++t) {
        var r = this._updateQueue[t],
          n = r.entity
        if (r.updatable) this._updateableEntities.push(n)
        else {
          var a = this._updateableEntities.indexOf(n)
          this._updateableEntities.splice(a, 1)
        }
      }
      this._updateQueue = []
    }
  }
  _processDestroyQueue() {
    var e = this._destroyQueue.length
    if (0 !== e) {
      for (var t = 0; t < e; ++t) {
        var r = this._destroyQueue[t]
        delete r._components,
          delete r._requiresUpdates,
          delete r._onRequireUpdatesChange,
          delete r._update,
          delete r._updateRequiresUpdates
      }
      this._destroyQueue = []
    }
  }
  update(time_delta) {
    this._processUpdateQueue(), this._processDestroyQueue()
    for (var t = this._updateableEntities, r = t.length, n = 0; n < r; ++n)
      t[n]._update(time_delta)
  }
}
let EntityPrototype = {
  _init: function (e) {
    ;(e._components = []),
      (e._requiresUpdates = false),
      (e._onRequireUpdatesChange = new Signal()),
      (e._update = function (e) {
        var t = this._components
        if (t)
          for (var r = t.length, n = 0; n < r; ++n) {
            var a = t[n]
            a.onUpdate && a.onUpdate(e)
          }
      }),
      (e._updateRequiresUpdates = function (e) {
        e !== this._requiresUpdates &&
          ((this._requiresUpdates = e),
          this._onRequireUpdatesChange.dispatch(this))
      })
  },
}

let Entity = {
  ENGINE: new EntityEngine(),
  isEntity: function (e) {
    return !!e._components
  },
  convert: function (entity) {
    Entity.isEntity(entity) ||
      (EntityPrototype._init(entity), Entity.ENGINE.registerEntity(entity))
  },
  destroy: function (entity) {
    Entity.ENGINE.destroyEntity(entity)
  },
  addComponents: function (entity, component_list) {
    for (var r = 0; r < component_list.length; ++r)
      Entity.addComponent(entity, component_list[r])
  },
  removeComponents: function (entity, component_list) {
    for (var r = 0; r < component_list.length; ++r)
      Entity.removeComponent(entity, component_list[r])
  },
  addComponent: function (entity, component) {
    if (component._entity)
      throw new Error('Component already added to an entity!')
    Entity.convert(entity),
      entity._components.push(component),
      entity._updateRequiresUpdates(
        this._requiresUpdates || !!component.onUpdate
      ),
      (component._entity = entity),
      component.onAdded()
  },
  hasComponent: function (entity, component) {
    return entity._components && entity._components.indexOf(component) >= 0
  },
  removeComponent: function (entity, component) {
    if (!Entity.hasComponent(entity, component))
      throw new Error("Component wasn't added to this entity!")
    component.onRemoved()
    for (
      var r = false, n = entity._components.length, a = 0, i = [], o = 0;
      o < n;
      ++o
    ) {
      var s = entity._components[o]
      s !== component && ((i[a++] = s), (r = r || !!component.onUpdate))
    }
    ;(entity._components = 0 === a ? null : i),
      (component._entity = null),
      entity._updateRequiresUpdates(r)
  },
}

function verifyExtension(mainProject, extension) {
  var t = mainProject.renderer.extensions.get(extension)
  return (
    t || showError('This requires the WebGL ' + extension + ' extension!'), t
  )
}
function showError(e) {
  var e = document.getElementById('errorContainer')
  ;(e.style.display = 'block'),
    (e = document.getElementById('errorMessage')),
    (e.innerHTML = e)
}

class AssetLibrary {
  constructor(e) {
    ;(this._numLoaded = 0),
      (this._queue = []),
      (this._assets = {}),
      e && '/' != e.charAt(e.length - 1) && (e += '/'),
      (this._basePath = e || ''),
      (this._onComplete = new Signal()),
      (this._onProgress = new Signal())
  }
  static Type = {
    JSON: 0,
    MODEL: 1,
    TEXTURE_2D: 2,
    TEXTURE_CUBE: 3,
    PLAIN_TEXT: 4,
  }
  get onComplete() {
    return this._onComplete
  }
  get onProgress() {
    return this._onProgress
  }
  get basePath() {
    return this._basePath
  }
  queueAsset(e, t, r, n) {
    this._queue.push({
      id: e,
      filename: this._basePath + t,
      type: r,
      parser: n,
    })
  }
  load() {
    if (0 === this._queue.length) return void this.onComplete.dispatch()
    var e = this._queue[this._numLoaded]
    console.log('prepare to load', e.filename)
    switch (e.type) {
      case AssetLibrary.Type.JSON:
        this._json(e.filename, e.id)
        break
      case AssetLibrary.Type.MODEL:
        this._model(e.filename, e.id, e.parser)
        break
      case AssetLibrary.Type.TEXTURE_2D:
        this._texture2D(e.filename, e.id, e.parser)
        break
      case AssetLibrary.Type.TEXTURE_CUBE:
        this._textureCube(e.filename, e.id)
        break
      case AssetLibrary.Type.PLAIN_TEXT:
        this._plainText(e.filename, e.id)
    }
  }
  get(e) {
    return this._assets[e]
  }
  _json(e, t) {
    var r = this,
      n = new XMLHttpRequest()
    n.overrideMimeType('application/json'),
      n.open('GET', e, true),
      (n.onreadystatechange = function () {
        4 === n.readyState &&
          '200' == n.status &&
          ((r._assets[t] = JSON.parse(n.responseText)), r._onAssetLoaded())
      }),
      n.send(null)
  }
  _plainText(e, t) {
    var r = this,
      n = new XMLHttpRequest()
    n.overrideMimeType('application/json'),
      n.open('GET', e, true),
      (n.onreadystatechange = function () {
        4 === n.readyState &&
          '200' == n.status &&
          ((r._assets[t] = n.responseText), r._onAssetLoaded())
      }),
      n.send(null)
  }
  _textureCube(e, t) {
    var r = this,
      n = new THREE.CubeTextureLoader()
    ;(this._assets[t] = n.load(
      [
        e + 'posX.jpg',
        e + 'negX.jpg',
        e + 'posY.jpg',
        e + 'negY.jpg',
        e + 'negZ.jpg',
        e + 'posZ.jpg',
      ],
      function () {
        r._onAssetLoaded()
      }
    )),
      (this._assets[t].mapping = THREE.CubeReflectionMapping)
  }
  _texture2D(filename, name, r) {
    var n = this,
      a = new (r || THREE.TextureLoader)(),
      texture = (this._assets[name] = a.load(filename, function () {
        n._onAssetLoaded()
      }))
    if (name == 'diffuse') {
      texture.encoding = THREE.sRGBEncoding
      // console.log("diffuse");
    }
    ;(texture.wrapS = THREE.RepeatWrapping),
      (texture.wrapT = THREE.RepeatWrapping),
      (texture.minFilter = THREE.LinearMipMapLinearFilter),
      (texture.magFilter = THREE.LinearFilter),
      window.highPerformance && (texture.anisotropy = 16)
  }
  _model(e, t, r) {
    var n = this,
      a = new r()
    ;(a.options = a.options || {}),
      (a.options.convertUpAxis = true),
      a.load(e, function (e) {
        ;(n._assets[t] = e.children[0].geometry), n._onAssetLoaded()
      })
  }
  _onAssetLoaded() {
    this._onProgress.dispatch(this._numLoaded / this._queue.length),
      ++this._numLoaded === this._queue.length
        ? this._onComplete.dispatch(this)
        : this.load()
  }
}

class LinearDepthMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: { cameraNear: { value: 0 }, rcpCameraRange: { value: 0 } },
      vertexShader: ShaderLibrary.get('linear_depth_vertex'),
      fragmentShader: ShaderLibrary.get('linear_depth_fragment'),
    })
  }
  get cameraNear() {
    return this.uniforms.cameraNear.value
  }
  set cameraNear(e) {
    this.uniforms.cameraNear.value = e
  }

  get rcpCameraRange() {
    return this.uniforms.rcpCameraRange.value
  }
  set rcpCameraRange(e) {
    this.uniforms.rcpCameraRange.value = e
  }
}

// Render depth map
class SceneDepthRenderer {
  constructor(scene, camera, renderer, scale) {
    ;(this._renderer = renderer),
      (this._scene = scene),
      (this._camera = camera),
      (this._scale = scale || 1),
      (this._depthMaterial = new LinearDepthMaterial())
  }
  get texture() {
    return this._renderTarget.texture
  }
  resize(e, t) {
    ;(e = Math.ceil(e * this._scale)),
      (t = Math.ceil(t * this._scale)),
      (this._renderTarget &&
        this._renderTarget.width === e &&
        this._renderTarget.height === t) ||
        (this._renderTarget = new THREE.WebGLRenderTarget(e, t, {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          generateMipmaps: false,
          depthBuffer: true,
          stencilBuffer: false,
        }))
  }
  render() {
    this._depthMaterial.cameraNear = this._camera.near
    this._depthMaterial.rcpCameraRange =
      1 / (this._camera.far - this._camera.near)
    this._renderer.setClearColor(16777215, 1)
    this._scene.overrideMaterial = this._depthMaterial
    this._renderer.setRenderTarget(this._renderTarget)
    this._renderer.clear()
    if (
      global_render_target_injector.render_type ===
      RenderTargetInjector.Type.DEPTH_MAP
    )
      this._renderer.setRenderTarget(null)
    this._renderer.render(this._scene, this._camera)
    this._renderer.setRenderTarget(null)
    this._scene.overrideMaterial = null
    this._renderer.setClearColor(0, 1)
  }
}

class VSMShadowRenderer {
  constructor(scene, renderer, light, texture_size) {
    ;(texture_size = void 0 === texture_size ? 1024 : texture_size),
      (this.onUpdate = new Signal())
    var a = FloatTex.getHalfOrFloatOrAny(renderer)
    this._floatTexture = a !== THREE.UnsignedByteType
    this._vsmMaterial = new VSMMaterial(this._floatTexture)
    this._rectRenderer = new RectRenderer(renderer)
    this._shadowMap = new DoubleBufferTexture(texture_size, texture_size, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: a,
    })
    this._light = light
    this._renderer = renderer
    this._scene = scene
    this._lightCamera = new THREE.OrthographicCamera(
      -0.3,
      0.3,
      -0.3,
      0.3,
      -1,
      1
    )
    this._size = texture_size
    this._focusObject = scene
    this.shadowMapMatrix = new THREE.Matrix4()
    VSMBlurShader.defines = this._floatTexture ? { FLOAT_TEX: 1 } : void 0
    this.blur = new THREE.ShaderMaterial(VSMBlurShader)
    // console.log(this._renderer);
  }

  get shadowMap() {
    return this._shadowMap.source
  }
  get size() {
    return this._size
  }
  get floatTexture() {
    return this._floatTexture
  }
  constrain(e) {
    this._focusObject = e
  }
  render() {
    var light_camera = this._lightCamera
    light_camera.position.copy(this._light.position)
    light_camera.lookAt(new THREE.Vector3(0, 0, 0))
    light_camera.position.set(0, 0, 0)
    light_camera.updateMatrixWorld()
    var t = new THREE.Matrix4()
    t.copy(light_camera.matrixWorld).invert()
    var bounding_box = new THREE.Box3()
    bounding_box.setFromObject(this._focusObject)
    bounding_box.applyMatrix4(t)
    light_camera.left = bounding_box.min.x - 0.01
    light_camera.right = bounding_box.max.x + 0.01
    light_camera.top = bounding_box.min.y - 0.01
    light_camera.bottom = bounding_box.max.y + 0.01
    light_camera.near = -bounding_box.max.z - 0.01
    light_camera.far = -bounding_box.min.z + 0.01
    light_camera.updateProjectionMatrix()
    this.shadowMapMatrix.copy(light_camera.matrixWorld).invert()
    this.shadowMapMatrix.multiplyMatrices(
      light_camera.projectionMatrix,
      this.shadowMapMatrix
    )

    this._renderer.setClearColor(16777215)
    this._scene.overrideMaterial = this._vsmMaterial
    this._renderer.setRenderTarget(this._shadowMap.target)
    if (
      global_render_target_injector.render_type ===
      RenderTargetInjector.Type.SHADOW_MAP
    )
      this._renderer.setRenderTarget(null)
    this._renderer.render(this._scene, this._lightCamera)
    this._renderer.setRenderTarget(null)
    this._scene.overrideMaterial = null

    this._shadowMap.swap()
    this._renderer.setClearColor(0)
    var uniforms = this.blur.uniforms

    uniforms.step.value.set(1 / this._size, 0)
    uniforms.tDiffuse.value = this._shadowMap.source
    this._rectRenderer.execute(this.blur, this._shadowMap.target)
    this._shadowMap.swap()

    uniforms.step.value.set(0, 1 / this._size)
    uniforms.tDiffuse.value = this._shadowMap.source
    if (
      global_render_target_injector.render_type ===
      RenderTargetInjector.Type.SHADOW_MAP_BLUR
    )
      this._rectRenderer.execute(this.blur, null)
    else this._rectRenderer.execute(this.blur, this._shadowMap.target)
    this._shadowMap.swap()

    this.onUpdate.dispatch()
  }
}

// SSS curves? It is four Gaussian distributions.
class SSSProfile {
  constructor(width, range) {
    this._gaussianTexture = new THREE.DataTexture(
      null,
      width,
      1,
      THREE.RGBAFormat,
      THREE.FloatType,
      null,
      THREE.ClampToEdgeWrapping,
      THREE.ClampToEdgeWrapping,
      THREE.LinearFilter,
      THREE.LinearFilter
    )
    this.generateMipmap = false
    this._range = range
    this._layers = []
    this._width = width
  }

  get gaussianLookUp() {
    return this._gaussianTexture
  }
  get range() {
    return this._range / 1e3
  }
  get distanceMapping() {
    return 1e3 / this._range
  }
  getBlendColor(e) {
    return e >= this._layers.length ? new THREE.Color() : this._layers[e].blend
  }
  addLayer(variance, color) {
    if (4 === this._layers.length)
      throw new Error("Doesn't support more than 4 layers!")
    this._layers.push({
      gauss: new CenteredGaussianCurve(variance),
      blend: color,
    })
  }
  generate() {
    for (
      var data = [],
        step = this._range / this._width,
        num_layers = this._layers.length,
        n = 0;
      n < this._width;
      ++n
    ) {
      for (var x = n * step, l = 0; l < num_layers; ++l) {
        // for (var x = n * step, r = 0, g = 0, b = 0, l = 0; l < num_layers; ++l) {
        var curve = this._layers[l],
          pdf = curve.gauss.getValueAt(x),
          color = curve.blend
        // (r += pdf * color.r), (g += pdf * color.g), (b += pdf * color.b),
        data.push(pdf)
      }
      for (l = num_layers; l < 4; ++l) data.push(0)
    }
    ;(this._gaussianTexture.image.data = new Float32Array(data)),
      (this._gaussianTexture.needsUpdate = true)
  }
}

// only render SSS, depthMap+nearfar+unproject
class SSSRenderer {
  constructor(
    scene,
    camera,
    renderer,
    depth_renderer,
    sss_material_options,
    scale
  ) {
    this._scale = scale || 0.5
    this._camera = camera
    this._renderer = renderer
    this._scene = scene
    this.depthRenderer = depth_renderer
    this._floatTexType = FloatTex.getHalfOrFloatOrAny(renderer)
    this._rectRenderer = new RectRenderer(renderer)
    this._material = new SSSMaterial(sss_material_options)
    this._renderTarget = new DoubleBufferTexture(1, 1, {
      type: this._floatTexType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      generateMipmaps: false,
      depthBuffer: true,
      stencilBuffer: false,
    })

    // console.log(sss_material_options.sssProfile.gaussianLookUp);

    this.sssBlur = new THREE.ShaderMaterial(SSSBlurShader)
    this.sssBlur.uniforms.sssProfileMap.value =
      sss_material_options.sssProfile.gaussianLookUp
    this.sssBlur.uniforms.color1.value =
      sss_material_options.sssProfile.getBlendColor(1)
    this.sssBlur.uniforms.color2.value =
      sss_material_options.sssProfile.getBlendColor(2)
    this.sssBlur.uniforms.color3.value =
      sss_material_options.sssProfile.getBlendColor(3)
    this.sssBlur.uniforms.sssProfileScale.value =
      sss_material_options.sssProfile.distanceMapping
    this.sssBlur.uniforms.sssRange.value = sss_material_options.sssProfile.range
    this.sssBlur.depthWrite = false
    this.sssBlur.depthTest = false
  }
  get texture() {
    return this._renderTarget.source
  }
  resize(e, t) {
    var r = Math.ceil(e * this._scale),
      n = Math.ceil(t * this._scale)
    this._renderTarget = new DoubleBufferTexture(r, n, {
      type: this._floatTexType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      generateMipmaps: false,
      depthBuffer: true,
      stencilBuffer: false,
    })
  }
  render() {
    this._scene.overrideMaterial = this._material
    this._renderer.setRenderTarget(this._renderTarget.target)
    this._renderer.clear()
    if (
      global_render_target_injector.render_type ===
      RenderTargetInjector.Type.SSS
    )
      this._renderer.setRenderTarget(null)
    this._renderer.render(this._scene, this._camera)
    this._renderer.setRenderTarget(null)
    this._renderTarget.swap()
    this._scene.overrideMaterial = null

    var uniforms = this.sssBlur.uniforms
    uniforms.depthMap.value = this.depthRenderer.texture
    uniforms.cameraNear.value = this._camera.near
    uniforms.cameraRange.value = this._camera.far - this._camera.near
    uniforms.unprojectionMatrix.value
      .copy(this._camera.projectionMatrix)
      .invert()

    uniforms.tDiffuse.value = this._renderTarget.source
    uniforms.step.value.set(1 / this._renderTarget.width, 0)
    this._rectRenderer.execute(this.sssBlur, this._renderTarget.target)
    this._renderTarget.swap()

    uniforms.tDiffuse.value = this._renderTarget.source
    uniforms.step.value.set(0, 1 / this._renderTarget.height)
    if (
      global_render_target_injector.render_type ===
      RenderTargetInjector.Type.SSS_BLUR
    )
      this._rectRenderer.execute(this.sssBlur, null)
    else this._rectRenderer.execute(this.sssBlur, this._renderTarget.target)
    this._renderTarget.swap()
  }
}

// Use light, GGX BRDF, irradianceMap+normalMap+shadowMap
class SSSMaterial extends THREE.ShaderMaterial {
  constructor(parameters) {
    var defines = { MIN_VARIANCE: -1e-4, LIGHT_BLEED_REDUCTION: 0.5 }
    let uniforms = {
      irradianceMap: { value: parameters.irradianceMap },
      probeExposure: {
        value: Math.pow(
          2,
          void 0 === parameters.probeExposure ? 0 : parameters.probeExposure
        ),
      },
      normalMap: { value: parameters.normalMap },
      shadowMap: { value: parameters.shadowRenderer.shadowMap },
      shadowMapMatrix: { value: parameters.shadowRenderer.shadowMapMatrix },
    }
    let uniforms_with_lights = THREE.UniformsUtils.merge([
      uniforms,
      THREE.UniformsLib.lights,
    ])
    super({
      uniforms: uniforms_with_lights,
      defines: defines,
      lights: true,
      vertexShader: ShaderLibrary.get('sss_vertex'),
      fragmentShader:
        ShaderLibrary.getInclude('include_ggx') +
        ShaderLibrary.get('sss_fragment'),
    })
    this.uniforms.shadowMap.value = parameters.shadowRenderer.shadowMap
    this.extensions.derivatives = true
    this.uniforms.irradianceMap.value = parameters.irradianceMap
    this.uniforms.normalMap.value = parameters.normalMap
    this._shadowRenderer = parameters.shadowRenderer
    this._shadowRenderer.onUpdate.bind(this._onShadowUpdate, this)
  }
  _onShadowUpdate() {
    this.uniforms.shadowMapMatrix.value = this._shadowRenderer.shadowMapMatrix
    this.uniforms.shadowMap.value = this._shadowRenderer.shadowMap
  }
}

class DepthOfFieldPass extends Pass {
  constructor(camera, scene, r, n) {
    super()
    ;(this._depthTexture = r),
      (this._focusPosition = new THREE.Vector3()),
      (this._focusFalloff = 0.5),
      (this._focusRange = 0.5),
      (this._v = new THREE.Vector3()),
      (this._camera = camera),
      (this._scene = scene),
      (this._textureType = n),
      (this._strength = 1),
      (this.copy = new THREE.ShaderMaterial(CopyShader)),
      (this.blur = new THREE.ShaderMaterial(TinyBlurHDREShader)),
      (this.composite = new THREE.ShaderMaterial(DOFShader)),
      (this._postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)),
      (this._postScene = new THREE.Scene()),
      (this._postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null)),
      this._postScene.add(this._postQuad),
      (this.focusRange = 2),
      (this.focusFalloff = 5)
  }
  get depthTexture() {
    return this._depthTexture
  }
  set depthTexture(e) {
    this._depthTexture = e
  }
  get focusPosition() {
    return this._focusPosition
  }
  set focusPosition(e) {
    this._focusPosition = e
  }
  get focusFalloff() {
    return this._focusFalloff
  }
  set focusFalloff(e) {
    ;(this._focusFalloff = e),
      (this.composite.uniforms.focusFalloff.value =
        e / (this._camera.far - this._camera.near))
  }
  get focusRange() {
    return this._focusRange
  }
  set focusRange(e) {
    ;(this._focusRange = e),
      (this.composite.uniforms.focusRange.value =
        e / (this._camera.far - this._camera.near))
  }
  get strength() {
    return this._strength
  }
  set strength(e) {
    ;(this._strength = e),
      (this.composite.uniforms.strength.value = e),
      (this.enabled = 0 !== this._strength)
  }
  render(renderer, write_buffer, read_buffer, delta_time, mask_active) {
    this._v.copy(this._focusPosition),
      this._v.applyMatrix4(this._camera.matrixWorldInverse),
      (this.composite.uniforms.focusDepth.value =
        (-this._v.z - this._camera.near) /
        (this._camera.far - this._camera.near))
    var i = this.smallBlurRadiusTex.width,
      o = this.smallBlurRadiusTex.height
    this._postQuad.material = this.copy
    this.copy.uniforms.tDiffuse.value = read_buffer.texture
    renderer.setRenderTarget(this.smallBlurRadiusTex2)
    renderer.render(this._postScene, this._postCamera)
    renderer.setRenderTarget(null)
    this._postQuad.material = this.blur
    this.blur.uniforms.tDiffuse.value = this.smallBlurRadiusTex2.texture
    this.blur.uniforms.sampleStep.value.x = 1 / i
    this.blur.uniforms.sampleStep.value.y = 1 / o
    renderer.setRenderTarget(this.smallBlurRadiusTex)
    renderer.render(this._postScene, this._postCamera)
    renderer.setRenderTarget(null)
    this.blur.uniforms.tDiffuse.value = this.smallBlurRadiusTex.texture
    this.blur.uniforms.sampleStep.value.x = 1.5 / i
    this.blur.uniforms.sampleStep.value.y = 1.5 / o
    renderer.setRenderTarget(this.largeBlurRadiusTex)
    renderer.render(this._postScene, this._postCamera)
    renderer.setRenderTarget(null)
    this._postQuad.material = this.composite
    this.composite.uniforms.depth.value = this._depthTexture
    this.composite.uniforms.source.value = read_buffer.texture
    this.composite.uniforms.blurred1.value = this.smallBlurRadiusTex.texture
    this.composite.uniforms.blurred2.value = this.largeBlurRadiusTex.texture
    renderer.setRenderTarget(write_buffer)
    renderer.render(this._postScene, this._postCamera)
    renderer.setRenderTarget(null)
  }
  setSize(e, t) {
    if (
      ((e = Math.floor(e)),
      (t = Math.floor(t)),
      this.resolutionX !== e || this.resolutionY !== t)
    ) {
      ;(this.resolutionX = e), (this.resolutionY = t)
      var options = {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          format: THREE.RGBAFormat,
          type: this._textureType,
        },
        width = e >> 1,
        height = t >> 1
      ;(this.smallBlurRadiusTex = new THREE.WebGLRenderTarget(
        width,
        height,
        options
      )),
        (this.smallBlurRadiusTex2 = new THREE.WebGLRenderTarget(
          width,
          height,
          options
        )),
        (width = e >> 2),
        (height = t >> 2),
        (this.largeBlurRadiusTex = new THREE.WebGLRenderTarget(
          width,
          height,
          options
        )),
        (this.smallBlurRadiusTex.texture.generateMipmaps = false),
        (this.largeBlurRadiusTex.texture.generateMipmaps = false)
    }
  }
}

class RenderTargetInjector {
  constructor() {
    this.render_type = RenderTargetInjector.Type.FINAL_COMPOSE

    this.skin_material = null
    this.enabled = true
    if (typeof document !== 'undefined')
      document.addEventListener('keyup', this._onKeyUp.bind(this))
  }

  static Type = {
    FINAL_COMPOSE: 'FINAL_COMPOSE',

    DEPTH_MAP: 'DEPTH_MAP',
    SHADOW_MAP: 'SHADOW_MAP',
    SHADOW_MAP_BLUR: 'SHADOW_MAP_BLUR',
    SSS: 'SSS',
    SSS_BLUR: 'SSS_BLUR',

    SKIN_SSS: 'SKIN_SSS',
    SKIN_TRANSMISSION: 'SKIN_TRANSMISSION',
    SKIN_SHADOWDIFFUSE: 'SKIN_SHADOWDIFFUSE',

    SKIN_FINAL: 'SKIN_FINAL',
  }

  _onKeyUp(event) {
    // if (!this.enabled) return
    // switch (event.keyCode) {
    //   case 48 + 0:
    //   case 96 + 0:
    //     this.render_type = RenderTargetInjector.Type.FINAL_COMPOSE
    //     if (this.skin_material)
    //       this.skin_material.uniforms.return_stage.value = 0
    //     break
    //   case 48 + 1:
    //   case 96 + 1:
    //     this.render_type = RenderTargetInjector.Type.DEPTH_MAP
    //     break
    //   case 48 + 2:
    //   case 96 + 2:
    //     this.render_type = RenderTargetInjector.Type.SHADOW_MAP
    //     break
    //   case 48 + 3:
    //   case 96 + 3:
    //     this.render_type = RenderTargetInjector.Type.SHADOW_MAP_BLUR
    //     break
    //   case 48 + 4:
    //   case 96 + 4:
    //     this.render_type = RenderTargetInjector.Type.SSS
    //     break
    //   case 48 + 5:
    //   case 96 + 5:
    //     this.render_type = RenderTargetInjector.Type.SSS_BLUR
    //     break
    //   case 48 + 6:
    //   case 96 + 6:
    //     this.render_type = RenderTargetInjector.Type.SKIN_SSS
    //     if (this.skin_material)
    //       this.skin_material.uniforms.return_stage.value = 1
    //     break
    //   case 48 + 7:
    //   case 96 + 7:
    //     this.render_type = RenderTargetInjector.Type.SKIN_TRANSMISSION
    //     if (this.skin_material)
    //       this.skin_material.uniforms.return_stage.value = 2
    //     break
    //   case 48 + 8:
    //   case 96 + 8:
    //     this.render_type = RenderTargetInjector.Type.SKIN_SHADOWDIFFUSE
    //     if (this.skin_material)
    //       this.skin_material.uniforms.return_stage.value = 3
    //     break
    //   default:
    //     this.render_type = RenderTargetInjector.Type.SKIN_FINAL
    //     if (this.skin_material)
    //       this.skin_material.uniforms.return_stage.value = 0
    // }
    // console.log(this.render_type)
  }
}

let global_render_target_injector = new RenderTargetInjector()

export {
  CenteredGaussianCurve,
  FloatTex,
  DoubleBufferTexture,
  RectRenderer,
  Signal,
  Skybox,
  OrbitController,
  Entity,
  verifyExtension,
  VSMMaterial,
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
}
