import {
  Image,
  Box,
  Code,
  Heading,
  VStack,
  HStack,
  Avatar,
  Text,
  IconButton,
  Button,
  Icon,
  Editable,
  EditableTextarea,
  EditablePreview,
  LightMode,
} from '@chakra-ui/react'
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai'
import { BsLink45Deg } from 'react-icons/bs'
import * as THREE from 'three'
import React, { useEffect, useRef, useState } from 'react'
import { startUp } from '@/models/rendering/rendering'
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
import styles from '@/styles/dialogs.module.css'

interface Props {
  resourceUrl: string
  prompt: string
}

function getLikeIcon(is_liked: boolean) {
  return (
    <Icon as={is_liked ? AiFillHeart : AiOutlineHeart} m={0} boxSize={5}></Icon>
  )
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

const ModelEnvironment = () => {
  return (
    <Box className={styles['model-view-environment-box']}>
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
    </Box>
  )
}

const ModelView = (props: Props) => {
  const [isLiked, setIsLiked] = useState(false)
  const mesh_profile = {
    model: 'assets/juanfu/exported_vs_pca_dis_vn.obj',
    diffuse: 'assets/juanfu/002_diffuse_neutral.png',
    normal: 'assets/juanfu/002_normal_neutral.png',
    specular: 'assets/juanfu/002_specular_neutral.png',
    roughness_ao_thickness: 'assets/juanfu/rat.png',
    roughness_detail: 'assets/juanfu/roughness-detail.jpg',
    env_irradiance: 'assets/env/lapa_4k_panorama_irradiance.hdr',
    env_specular: 'assets/env/lapa_4k_panorama_specular.hdr',
  }

  const [localPrompt, setLocalPrompt] = useState<string>('')
  useEffect(() => {
    setLocalPrompt(props.prompt)
  }, [props.prompt])

  // startUp(mesh_profile)
  return (
    <Box>
      <HStack mb={2} justifyContent="space-between">
        <HStack>
          <Avatar
            name="Dan Abrahmov"
            src="https://bit.ly/dan-abramov"
            boxSize={8}
          />
          <Box>
            <Text className={styles['model-view-author-name']}>Clarive</Text>
            <Text color="gray.500" className={styles['model-view-status']}>
              Zhengzhou / 1 Hour Ago / 300view{' '}
            </Text>
          </Box>
        </HStack>
        <Box>
          <Button
            leftIcon={<BsLink45Deg />}
            mr={2}
            size="sm"
            className={styles['model-view-share-button']}
          >
            Share
          </Button>
          <IconButton
            size="sm"
            aria-label="like"
            color="pink.200"
            icon={getLikeIcon(isLiked)}
            onClick={() => setIsLiked(!isLiked)}
          />
        </Box>
      </HStack>
      {/* <ModelEnvironment></ModelEnvironment> */}
      <Editable
        value={localPrompt}
        onChange={(nextValue: string) => {
          setLocalPrompt(nextValue)
        }}
      >
        <EditablePreview />
        <EditableTextarea />
      </Editable>
      <Box id="info"></Box>
      <Box id="webglcontainer"></Box>
      <Box id="preloader" className="preloader">
        <Box id="preloaderBar" className="vAligned">
          Loading...
          <Box className="preloaderBorder">
            <Box
              id="preloaderProgress"
              className="preloaderProgress"
              style={{ width: '85%' }}
            ></Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default ModelView
