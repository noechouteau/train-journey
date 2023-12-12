import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import testVertexShader from './shaders/test/vertex.glsl'
import testFragmentShader from './shaders/test/fragment.glsl'
import sphereVertexShader from './shaders/sphere/vertex.glsl'
import sphereFragmentShader from './shaders/sphere/fragment.glsl'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js'
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js'
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js'
import {SMAAPass} from 'three/examples/jsm/postprocessing/SMAAPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const params = {
    // general scene params
    blobColor: 0xffffff,
    blobNumber: 10000,
    blobInitialPosMultiplier: 10,
    lerpFactor: 0.2, // this param controls the speed of which the blobs move, also affects the eventual moving patterns of the blobs
    followMouse: false,
  }

let height = 4.0
let scale = 0.3
let speed = 6.0
/**
 * Base
 */
// Debug
const gui = new dat.GUI()


const loader = new THREE.TextureLoader()
const audioListener = new THREE.AudioListener()
const gltfLoader = new GLTFLoader()

const tex = loader.load('./heightmap.png')

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()


scene.background = new THREE.Color(0x0d00b2)
gui.addColor(scene, 'background').onChange(() => {
    scene.background.set(scene.background)
}
)

/**
 * Test mesh
 */
// Geometry
const geometry = new THREE.PlaneGeometry(700, 250, 1024, 1024)


const spherePlaneGeometry = new THREE.PlaneGeometry(150, 150, 256, 256)
const sphereGeometry = new THREE.SphereGeometry(45, 32, 32)

// Material
const material = new THREE.ShaderMaterial({
    vertexShader: testVertexShader,
    fragmentShader: testFragmentShader,
    side: THREE.DoubleSide,
    transparent: true,
    uniforms: {
        uTime: { value: 0 },
        uFrequency : { value: 0 },
        uMusic: { value: false },
        uBiome: { value: 0.0 },

        uHeight: { value: height },
        uScale: { value: scale },
        uSpeed: { value: speed },
    }
})

const sphereMaterial = new THREE.ShaderMaterial({
    vertexShader: sphereVertexShader,
    fragmentShader: sphereFragmentShader,
    side: THREE.DoubleSide,
    transparent: true,
    uniforms: {
        uTime: { value: 0 },
        uFrequency : { value: 0 },
        uBiome: { value: 0.0 },

    }
})

// Mesh
const mesh = new THREE.Mesh(geometry, material)
mesh.rotation.x = -Math.PI * 0.5
mesh.position.set(0, 0, -10)

const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
sphere.position.set(0, 65, -240)

scene.add(mesh,sphere)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}


/**
 * Audio
 */

const sound = new THREE.Audio(audioListener)
const audioLoader = new THREE.AudioLoader()
audioLoader.load('./audio/berlioz - deep in it.mp3', function(buffer){
    sound.setBuffer(buffer)
    sound.setLoop(true)
    sound.setVolume(0.2)
    window.addEventListener('click', () => {
        //sound.play()
    }
    )
})

const analyser = new THREE.AudioAnalyser(sound, 256)


/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(90, sizes.width / sizes.height, 0.1, 320)
camera.position.set(0, 5.5, 25)
scene.add(camera)
gui.add(camera.position, 'x').min(-10).max(10).step(0.01).name('Camera X')
gui.add(camera.position, 'y').min(0).max(50).step(0.01).name('Camera Y')
gui.add(camera.position, 'z').min(0).max(50).step(0.01).name('Camera Z')

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    powerPreference: "high-performance",
	antialias: true,
	stencil: false,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

renderer.toneMappingExposure = 1.5
renderer.outputColorSpace = THREE.SRGBColorSpace

const generateStars = () => {
    // Geometry
    const particlesGeometry = new THREE.BufferGeometry()
    const count = 700

    const positions = new Float32Array(count * 3) // Multiply by 3 because each position is composed of 3 values (x, y, z)

    for(let i = 0; i < count; i++) // Multiply by 3 for same reason
    {

        const i3 = i * 3

        positions[i3] = (Math.random() - 0.5) * sizes.width
        positions[i3 + 1] = (Math.random()) * 170
        while(positions[i3 + 1] > 15 && positions[i3 + 1] < 112 && positions[i3] > -47 && positions[i3] < 47)
        {
            positions[i3] = (Math.random() - 0.5) * sizes.width
            positions[i3 + 1] = (Math.random()) * 170
        }
        console.log(positions[i3] + " " + positions[i3 + 1] + "   SIZE   " + sizes.width/2)
        positions[i3 + 2] = -239
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)) // Create the Three.js BufferAttribute and specify that each information is composed of 3 values

    // Material
    const particlesMaterial = new THREE.PointsMaterial({
        size: 1,
        sizeAttenuation: true,
        color: new THREE.Color('#ffffff')
    })

    // Points
    const particles = new THREE.Points(particlesGeometry, particlesMaterial)
    scene.add(particles)
}



/**
 * Post processing
 */
// Render target


// Effect composer
const effectComposer = new EffectComposer(renderer)
effectComposer.setSize(sizes.width, sizes.height)
effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))


const renderPass = new RenderPass(scene, camera)
effectComposer.addPass(renderPass)


const unrealBloomPass = new UnrealBloomPass()
unrealBloomPass.strength = 1
unrealBloomPass.radius = 0.1
unrealBloomPass.threshold = -0.1
effectComposer.addPass(unrealBloomPass)

gui.add(unrealBloomPass, 'enabled').name('Bloom')
gui.add(unrealBloomPass, 'strength').min(-1).max(1).step(0.001).name('Bloom strength')
gui.add(unrealBloomPass, 'radius').min(-1).max(1).step(0.001).name('Bloom radius')
gui.add(unrealBloomPass, 'threshold').min(-1).max(1).step(0.001).name('Bloom threshold')

let mixer = null

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
scene.add(ambientLight)

let pointLight = new THREE.PointLight(0xffffff, 1, 100)
pointLight.position.set(0, 4, 10)
pointLight.color = new THREE.Color("#79f89f")
scene.add(pointLight)

let pointLightHelper = new THREE.PointLightHelper(pointLight, 1)
scene.add(pointLightHelper)

gltfLoader.load('./train.glb', function(gltf){
    gltf.scene.position.set(0, 0.2, 15)
    gltf.scene.scale.set(0.4, 0.4, 0.4)

    mixer = new THREE.AnimationMixer(gltf.scene)
    const action = mixer.clipAction(gltf.animations[0])
    action.play()

    const train = gltf.scene
    scene.add(train)
}
)

let smokeGeometry = new THREE.SphereGeometry(0.3, 24, 24)
let smokeMaterial = new THREE.MeshStandardMaterial({
    color: params.blobColor,
    metallic: 0.0,
    roughness: 0.61,
    })

let world = new THREE.Object3D();
for (let i = 0; i < params.blobNumber; i++) {
    let blob = new THREE.Mesh(smokeGeometry, smokeMaterial)

    blob.position.x = 0 
    blob.position.z = 0
    blob.position.y = 2.3
    let blob_scale = Math.random()
    blob.scale.set(blob_scale, blob_scale, blob_scale)
    if (i == 0) {
    // first blob acts as the movement guide of all subsequent blobs and it has a regular circular path
    // better to make it invisible because it's movement does not look random
    blob.visible = false
    }

    world.add(blob)
}
world.position.set(0, 0, 15)
scene.add(world)


/**
 * Animate
 */

const clock = new THREE.Clock()

generateStars()
let previousTime = 0


const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    // Updtae material
    material.uniforms.uTime.value = elapsedTime

    let analysis = analyser.getFrequencyData()

    material.uniforms.uFrequency.value = analysis
    if(analysis[0]> 10)
    {
        console.log(analysis)
        console.log(analyser.getAverageFrequency())
    }
    material.uniforms.uHeight.value = height
    material.uniforms.uScale.value = scale
    material.uniforms.uSpeed.value = speed


    // Update controls
    controls.update()

    let first_obj = world.children[0]

    let offset = {
      x: params.followMouse ? mouseWorldSpace.x : 0,
      y: params.followMouse ? mouseWorldSpace.y : 0,
      z: params.followMouse ? mouseWorldSpace.z : 0,
    }
    // the first blob has a regular circular path (x y positions are calculated using the parametric function for a circle)
    first_obj.position.set(
      first_obj.position.x ,
      first_obj.position.y,
      first_obj.position.z +0.1
    )

    for (let i = 0, l = world.children.length; i < l; i++) {
      let object = world.children[i]
      let object_left = world.children[i - 1]
      if (i >= 1) {
        // position of each blob is calculated by the cos/sin function of its previous blob's slightly scaled up position
        // such that each blob is has x, y and z coordinates inside -1 and 1, while a pseudo-randomness of positions is achieved
        // adding in the offset in case the 'followMouse' is toggled on (it is {x: 0, y: 0} when 'followMouse' is off)
        // here I'm using the built-in lerp function with a small enough interpolation factor which is just right to help produce the pseudo-randomness
        // it involves a bit of experimentation to get the feel right
        let xAX = object_left.position.x
        if(object_left.position.z > 0.2){
            xAX = Math.sin(object_left.position.z - elapsedTime*3)
        }
        object.position.lerp(
          new THREE.Vector3(
            xAX,
            object_left.position.y,
            object_left.position.z
          ), params.lerpFactor
        )
        

      }
    }

    
    if (mixer) {
        mixer.update(deltaTime)
    }

    // Render
    //renderer.render(scene, camera)
    effectComposer.render()


    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}


tick()


const musicBtn = document.querySelector('#musicBtn')
const biomeBtn = document.querySelector('#biomeBtn')

musicBtn.addEventListener('click', onMusicClick)
biomeBtn.addEventListener('click', onBiomeClick)

//Music button
function onMusicClick(){
    if(material.uniforms.uMusic.value == true)
    {
        sound.pause()
        material.uniforms.uMusic.value = false
        musicBtn.style.filter = 'grayscale(100%)'
        return
    }
    else 
    {
        sound.play()
        material.uniforms.uMusic.value = true
        musicBtn.style.filter = 'grayscale(0%)'
        return
    }
}

function onBiomeClick(){
    if(material.uniforms.uBiome.value == 4.0)
    {
        material.uniforms.uBiome.value = 5.0
        sphereMaterial.uniforms.uBiome.value = 5.0
        scene.background = new THREE.Color(0x950000)
        height = 12.0
        scale = .1
        speed = 10.
        unrealBloomPass.enabled = false
        unrealBloomPass.threshold = -1.0
        mesh.position.set(0, 0, -90)
        return
    }
    else if(material.uniforms.uBiome.value == 3.0)
    {
        material.uniforms.uBiome.value = 4.0
        sphereMaterial.uniforms.uBiome.value = 4.0
        scene.background = new THREE.Color(0x8c9af9)
        height = 2.0
        scale = .1
        speed = 3.
        unrealBloomPass.enabled = false
        unrealBloomPass.threshold = -1.0
        mesh.position.set(0, 0, -90)
        return
    }
    else if(material.uniforms.uBiome.value == 2.0)
    {
        material.uniforms.uBiome.value = 3.0
        sphereMaterial.uniforms.uBiome.value = 3.0
        scene.background = new THREE.Color(0xf98dd8)
        height = 5.0
        scale = 0.3
        speed = 4.0
        unrealBloomPass.enabled = false
        unrealBloomPass.threshold = -1.0
        mesh.position.set(0, 0, -90)
        sphere.geometry = spherePlaneGeometry
        pointLight.intensity = 1

        return
    }
    else if(material.uniforms.uBiome.value == 1.0)
    {
        material.uniforms.uBiome.value = 2.0
        sphereMaterial.uniforms.uBiome.value = 2.0
        scene.background = new THREE.Color(0x052759)
        height = 40.0
        scale = 0.3
        speed = 4.0
        unrealBloomPass.enabled = true
        unrealBloomPass.threshold = -1.0
        mesh.position.set(0, 0, -90)
        pointLight.intensity = 0


        return
    }
    else if (material.uniforms.uBiome.value == 0.0)
    {
        material.uniforms.uBiome.value = 1.0
        sphereMaterial.uniforms.uBiome.value = 1.0
        scene.background = new THREE.Color(0xE24E1B)
        height = 3.0
        scale = 0.1
        speed = 2.5
        unrealBloomPass.enabled = false
        mesh.position.set(0, 0, -10)
        pointLight.intensity = 1

        return
    }
    else
    {
        material.uniforms.uBiome.value = 0.0
        sphereMaterial.uniforms.uBiome.value = 0.0
        scene.background = new THREE.Color(0x0d00b2)
        height = 4.0
        scale = 0.3
        speed = 6.0
        unrealBloomPass.enabled = true
        unrealBloomPass.threshold = -1.0
        mesh.position.set(0, 0, -10)
        sphere.geometry = sphereGeometry
        pointLight.intensity = 0
        
        return
    }
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    effectComposer.setSize(sizes.width, sizes.height)
})