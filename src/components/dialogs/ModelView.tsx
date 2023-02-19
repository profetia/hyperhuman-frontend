import { Image, Box, Code, Heading, VStack } from '@chakra-ui/react'
import * as THREE from 'three'
import React, { useRef, useState } from 'react'
import { Canvas, ThreeElements, useLoader } from '@react-three/fiber'
import {
  PresentationControls,
  Environment,
  ContactShadows,
  Html,
  OrbitControls,
  useTexture,
} from '@react-three/drei'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader'

interface Props {
  resource_url: string
  prompt: string
}

const Model = (props: ThreeElements['mesh']) => {
  const mesh = useRef<THREE.Mesh>(null!)
  const [hovered, setHover] = useState(false)
  const [active, setActive] = useState(false)
  const [colorMap, normalMap] = useLoader(THREE.TextureLoader, [
    'models/model_2/064_diffuse_neutral.png',
    'models/model_2/064_normal_neutral.png',
  ])
  // const obj:THREE.Mesh = useLoader(OBJLoader, 'triangulated.obj').children[0]
  // const geometry: THREE.BufferGeometry = obj.geometry
  const geometry: THREE.BufferGeometry = useLoader(
    PLYLoader,
    'models/model_2/model_2.ply'
  )
  geometry.computeVertexNormals()

  return (
    <mesh
      {...props}
      ref={mesh}
      scale={active ? 0.15 : 0.1}
      onClick={(event) => setActive(!active)}
      onPointerOver={(event) => setHover(true)}
      onPointerOut={(event) => setHover(false)}
      geometry={geometry}
    >
      {/* <sphereGeometry args={[1, 32, 32]} /> */}
      <meshStandardMaterial
        map={colorMap}
        normalMap={normalMap}
        map-flipY={true}
      />
      <OrbitControls></OrbitControls>
    </mesh>
  )
}

const ModelView = (props: Props) => {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 4], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <spotLight
        position={[10, 10, 10]}
        angle={0.15}
        penumbra={1}
        shadow-mapSize={[512, 512]}
        castShadow
      />
      <PresentationControls
        global
        config={{ mass: 2, tension: 500 }}
        snap={{ mass: 4, tension: 1500 }}
        rotation={[0, 0.3, 0]}
        polar={[-Math.PI / 3, Math.PI / 3]}
        azimuth={[-Math.PI / 1.4, Math.PI / 2]}
      >
        <Model
          // rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.25, 0]}
          // scale={0.003}
        />
      </PresentationControls>
      <ContactShadows
        position={[0, -1.4, 0]}
        opacity={0.75}
        scale={10}
        blur={2.5}
        far={4}
      />
      <Environment preset="city" />
    </Canvas>
  )
}

export default ModelView
