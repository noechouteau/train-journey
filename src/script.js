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
import Stats from 'stats.js'
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { gsap} from 'gsap';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'


const ytApiLink = "https://api-yt.le-gall.info/stream/"

const params = {
    // general scene params
    blobColor: 0xffffff,
    blobNumber: 1000,
    lerpFactor: 0.2, // this param controls the speed of which the blobs move, also affects the eventual moving patterns of the blobs
    followMouse: false,
  }

let height = 4.0
let scale = 0.5
let speed = 6.0
/**
 * Base
 */
// Debug
// const gui = new dat.GUI()

const btnGroup = document.querySelector('#buttonGroup')
const loadingBarContainer = document.querySelector('.loading-bar')
const loadingBarElement = document.querySelector('.progress')
const waitText = document.querySelector('#waitText')
const launchText = document.querySelector('#launchText')
const video = document.querySelector('#video')

const loadingManager = new THREE.LoadingManager(
    () =>
    {
        console.log('loaded')
        waitText.classList.add('ended')
        gsap.delayedCall(1., () =>
        {
            waitText.style.display = 'none'
            launchText.classList.remove('ended')
            video.style.cursor = 'pointer'
            video.addEventListener('click', () =>
            {
                gsap.to(overlayMaterial.uniforms.uAlpha, { duration: 3, value: 0, delay: 1 })
                launchText.style.opacity = '0'
                loadingBarContainer.style.opacity = '0'
                video.style.opacity = '0'
                gsap.delayedCall(1, () =>
                {
                    btnGroup.style.display = 'flex'
                    btnGroup.style.opacity = 1
                    btnGroup.style.pointerEvents = 'all'
                    loadingBarContainer.style.display = 'none'
                    video.style.display = 'none'
                })
            })

        })
    },
    ( itemsUrl, itemsLoaded, itemsTotal) =>
    {
        video.style.cursor = 'wait'
        console.log(itemsLoaded, itemsTotal)
        const progressRatio = itemsLoaded / itemsTotal
        console.log(progressRatio)
        loadingBarElement.style.transform = `scaleX(${progressRatio})`
    }
)

const loader = new THREE.TextureLoader(loadingManager)
const audioListener = new THREE.AudioListener()
const gltfLoader = new GLTFLoader(loadingManager)

const tex = loader.load('./heightmap.png')

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/** 
 * Overlay
 */

const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1)
const overlayMaterial = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
        uAlpha: { value: 1 }
    },
    vertexShader: `
        void main()
        {
            gl_Position =  vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float uAlpha;

        void main()
        {
            gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
        }
    `,
})
const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
scene.add(overlay)


scene.background = new THREE.Color(0x0d00b2)
// gui.addColor(scene, 'background').onChange(() => {
//     scene.background.set(scene.background)
// }
// )

/**
 * Test mesh
 */
// Geometry
const geometry = new THREE.PlaneGeometry(700, 400, 1024, 1024)


const spherePlaneGeometry = new THREE.PlaneGeometry(150, 150, 256, 256)
const sphereGeometry = new THREE.SphereGeometry(45, 32, 32)

// Material
const material = new THREE.ShaderMaterial({
    precision: "lowp",
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

//Basic one
let sound = new THREE.Audio(audioListener)
const audioLoader = new THREE.AudioLoader()
audioLoader.load('./audio/berlioz - deep in it.mp3', function(buffer){
    sound.setBuffer(buffer)
    sound.setLoop(true)
    sound.setVolume(0.2)
})

// Play from file
let fileInput = document.querySelector( '#file' );
fileInput.addEventListener( 'change', function( event ) {

	const reader = new FileReader();
	reader.addEventListener( 'load', function ( event ) {

		const buffer = event.target.result;

		const context = THREE.AudioContext.getContext();
		context.decodeAudioData( buffer, function ( audioBuffer ) {

            sound.stop()
            material.uniforms.uMusic.value = false
            playBtn.style.filter = 'grayscale(100%)'
            playBtn.classList.remove('active')

			sound = new THREE.Audio( audioListener );
            sound.setBuffer(audioBuffer)
            sound.setLoop(true)
            sound.setVolume(0.2)
            analyser = new THREE.AudioAnalyser(sound, 256)

		} );

	} );

	const file = event.target.files[0];
	reader.readAsArrayBuffer( file );
} );


// Play from youtube
let youtubeBtn = document.querySelector( '#youtubeBtn' );
let youtubeInput = document.querySelector( '#youtube' );
youtubeBtn.addEventListener( 'click', function( event ) {

    let id = youtubeInput.value.split('v=')[1]
    loadSound(id)
})

youtubeInput.addEventListener('keyup', function(event){
    if(event.keyCode === 13){
        event.preventDefault()
        youtubeBtn.click()
    }
})

function loadSound(id) {
    let request = new XMLHttpRequest();
    request.open("GET", ytApiLink+id, true); 
    request.responseType = "arraybuffer";
    canvas.style.cursor = 'wait'
  
    // Handle network errors
    request.onerror = function() {
        console.error('Network error while loading audio.');
    };

    request.onload = function() {
        if (request.status === 200) {
          let data = request.response;
          console.log(data)
          canvas.style.cursor = 'auto'
          process(data);
        } else {
          console.error('Failed to load audio. Status code:', request.status);
        }
      };
    
      request.send();
}
  
function process(data) {
    
    const buffer = data;

    const context = THREE.AudioContext.getContext();
    context.decodeAudioData( buffer, function ( audioBuffer ) {

        sound.stop()
        material.uniforms.uMusic.value = false
        playBtn.style.filter = 'grayscale(100%)'
        playBtn.classList.remove('active')

        sound = new THREE.Audio( audioListener );
        sound.setBuffer(audioBuffer)
        sound.setLoop(true)
        sound.setVolume(0.2)
        analyser = new THREE.AudioAnalyser(sound, 256)

    } );
}



let analyser = new THREE.AudioAnalyser(sound, 256)


/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(90, sizes.width / sizes.height, 0.1, 700)


camera.position.set(0, 5.5, 25)
scene.add(camera)
// gui.add(camera.position, 'x').min(-10).max(10).step(0.01).name('Camera X')
// gui.add(camera.position, 'y').min(0).max(50).step(0.01).name('Camera Y')
// gui.add(camera.position, 'z').min(0).max(50).step(0.01).name('Camera Z')

// Controls
const controls = new OrbitControls(camera, canvas)
controls.maxPolarAngle = Math.PI/2 - 0.1;
controls.minPolarAngle = Math.PI/2 - 0.3;

controls.minAzimuthAngle = -Math.PI/2+0.9;
controls.maxAzimuthAngle = Math.PI/2-0.9;

controls.enableDamping = true
controls.dampingFactor = 0.05

controls.minDistance = 20
controls.maxDistance = 30
controls.enableZoom = false
controls.enablePan = false

const controlsZoom = new TrackballControls(camera, canvas)
controlsZoom.noPan = true
controlsZoom.noRotate = true
controlsZoom.noZoom = false
controlsZoom.minDistance = 10
controlsZoom.zoomSpeed = 0.5


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

const generateStars = (count, randX,randY,randZ) => {
    // Geometry
    const particlesGeometry = new THREE.BufferGeometry()

    const positions = new Float32Array(count * 3) // Multiply by 3 because each position is composed of 3 values (x, y, z)

    for(let i = 0; i < count; i++) // Multiply by 3 for same reason
    {

        const i3 = i * 3

        let positionX;
        if (randX == 1) {
            positionX = 500;
        } else if (randX == -1) {
            positionX = -500;
        } else {
            positionX = (Math.random() - 0.5) * randX;
        }

        positions[i3] = positionX;
        positions[i3 + 1] = randY == 1 ? 0 : (Math.random()) * randY;
        positions[i3 + 2] = randZ == 1 ? -239 : (Math.random() - 0.5) * randZ;

        if (randZ == 1) {
            while (positions[i3 + 1] > 15 && positions[i3 + 1] < 112 && positions[i3] > -47 && positions[i3] < 47) {
                positions[i3] = (Math.random() - 0.5) * randX;
                positions[i3 + 1] = (Math.random()) * randY;
            }
        }
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)) // Create the Three.js BufferAttribute and specify that each information is composed of 3 values

    // Material
    const particlesMaterial = new THREE.PointsMaterial({
        size: 1,
        sizeAttenuation: true,
        color: new THREE.Color('#ffffff')
    })

    // Points
    particles = new THREE.Points(particlesGeometry, particlesMaterial)
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

// gui.add(unrealBloomPass, 'enabled').name('Bloom')
// gui.add(unrealBloomPass, 'strength').min(-1).max(1).step(0.001).name('Bloom strength')
// gui.add(unrealBloomPass, 'radius').min(-1).max(1).step(0.001).name('Bloom radius')
// gui.add(unrealBloomPass, 'threshold').min(-1).max(1).step(0.001).name('Bloom threshold')

let mixer = null

const ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
scene.add(ambientLight)

let dirLight = new THREE.DirectionalLight(0xffffff, 0, 100)
dirLight.position.set(0, 4, 10)
dirLight.color = new THREE.Color("#79f89f")
scene.add(dirLight)
scene.add( dirLight.target )



const ktx2Loader = new KTX2Loader()
					.setTranscoderPath( 'jsm/libs/basis/' )
					.detectSupport( renderer );

gltfLoader.setKTX2Loader( ktx2Loader );
gltfLoader.setMeshoptDecoder( MeshoptDecoder );
gltfLoader.load('./train-v1.glb', function(gltf){
    gltf.scene.position.set(0, 0.2, 15)
    gltf.scene.scale.set(0.4, 0.4, 0.4)

    mixer = new THREE.AnimationMixer(gltf.scene)
    const action = mixer.clipAction(gltf.animations[0])
    action.play()

    const train = gltf.scene
    scene.add(train)
    dirLight.target = train
}
)

let smokeGeometry = new THREE.SphereGeometry(0.3, 24, 24)
let smokeMaterial = new THREE.MeshLambertMaterial({
    color: params.blobColor,
    metallic: 0.0,
    roughness: 0.61,
    })

 
let world = new THREE.Object3D();
generateWorld(world)

scene.add(world)


/**
 * Animate
 */

const clock = new THREE.Clock()

let particles = ""
generateStars(800,1000,450,1)
generateStars(400,1,450,450)
generateStars(400,-1,450,450)

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
    const target = controls.target
    controls.update()
    controlsZoom.target.set(target.x, target.y, target.z)
    controlsZoom.update()


    let first_obj = world.children[0]
    let last_obj = world.children[world.children.length - 1]
    console.log(world.children.length)
    if(last_obj.position.z > 15){
        for(let i = 0; i < world.children.length; i++){
            world.children[i].position.z = 0
        }
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
console.log(renderer.info)


const musicBtn = document.querySelector('#musicBtn')
const biomeBtn = document.querySelector('#biomeBtn')
const playBtn = document.querySelector('.botón')

musicBtn.addEventListener('click', onMusicClick)
biomeBtn.addEventListener('click', onBiomeClick)
playBtn.addEventListener('click', onPlayClick)

function onPlayClick(){
    if(material.uniforms.uMusic.value == false)
    {
        sound.play()
        material.uniforms.uMusic.value = true
        playBtn.style.filter = 'grayscale(0%)'
        return
    }
    else 
    {
        sound.pause()
        material.uniforms.uMusic.value = false
        playBtn.style.filter = 'grayscale(100%)'
        return
    }
}

//Music button
function onMusicClick(){
    let trackInfo = document.querySelector('.track-info')
    if(trackInfo.style.top == '0px')
    {
        trackInfo.style.top = '-150px'
        musicBtn.style.filter = 'grayscale(100%)'
        playBtn.style.top = '-150px'
        return
    }
    else 
    {
        trackInfo.style.top = '0px'
        musicBtn.style.filter = 'grayscale(0%)'
        playBtn.style.top = '0px'
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
        dirLight.color = new THREE.Color("#ff0000")
        smokeMaterial.color.set(0x302222)
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
        dirLight.color = new THREE.Color("#fbb6b9")
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
        dirLight.intensity = 1
        dirLight.color = new THREE.Color("#79f89f")

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
        sphere.geometry = sphereGeometry
        mesh.position.set(0, 0, -90)
        dirLight.intensity = 0


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
        dirLight.intensity = 1
        sphere.geometry = spherePlaneGeometry

        dirLight.color = new THREE.Color("#E24E1B")

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
        dirLight.intensity = 0
        smokeMaterial.color.set(params.blobColor)
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

function generateWorld(world){
    for (let i = 0; i < params.blobNumber; i++) {
        let blob = new THREE.Mesh(smokeGeometry, smokeMaterial)
    
        blob.position.x = 0 
        blob.position.z = 0
        blob.position.y = 2.3
        let blob_scale = Math.random() + 0.3
        blob.scale.set(blob_scale, blob_scale, blob_scale)
        if(i == 0){
            blob.visible = false
        }
    
    
        world.add(blob)
    }
    world.position.set(0, 0, 15)
}

canvas.addEventListener('drag', function(e) {
    canvas.style.cursor = 'grab'
}
);

let fileInp = document.querySelector( '#file' );
let fileName = document.querySelector( '#fileName' );
fileInp.addEventListener( 'change', function( event ) {
    console.log(fileInp.files[0].name)
    if(fileInp.files[0].name.length > 13){
        fileName.innerHTML = fileInp.files[0].name.substring(0, 13) + '...' + fileInp.files[0].name.substring(fileInp.files[0].name.length - 6, fileInp.files[0].name.length)
    }
    else{
        fileName.innerHTML = fileInp.files[0].name
    }
}
);