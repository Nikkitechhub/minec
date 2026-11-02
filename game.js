
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 15, 65);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(0, 3, 8);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);

// LIGHTING
const sunlight = new THREE.DirectionalLight(0xffffff, 2);
sunlight.position.set(10, 20, 10);
sunlight.castShadow = true;
scene.add(sunlight);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));

// BLOCK MATERIALS
const materials = {
    grass: new THREE.MeshStandardMaterial({color: 0x55aa33}),
    dirt: new THREE.MeshStandardMaterial({color: 0x79502d}),
    stone: new THREE.MeshStandardMaterial({color: 0x888888}),
    wood: new THREE.MeshStandardMaterial({color: 0x80552c})
};

const geometry = new THREE.BoxGeometry(1, 1, 1);

const blocks = [];

function addBlock(x, y, z, type) {
    const block = new THREE.Mesh(
        geometry,
        materials[type]
    );

    block.position.set(x, y, z);
    block.castShadow = true;
    block.receiveShadow = true;
    block.userData.type = type;

    scene.add(block);
    blocks.push(block);
}

// GENERATE WORLD
for (let x = -15; x <= 15; x++) {
    for (let z = -15; z <= 15; z++) {
        let height = Math.floor(
            2 + Math.sin(x * 0.3) * 1.5 +
            Math.cos(z * 0.3) * 1.5
        );

        for (let y = 0; y <= height; y++) {
            let type = "stone";

            if (y === height) {
                type = "grass";
            } else if (y > height - 3) {
                type = "dirt";
            }

            addBlock(x, y, z, type);
        }
    }
}

// PLAYER CONTROLS
const keys = {};

let yaw = 0;
let pitch = 0;
let started = false;

document.addEventListener("keydown", e => {
    keys[e.code] = true;
});

document.addEventListener("keyup", e => {
    keys[e.code] = false;
});

document.getElementById("start").addEventListener("click", () => {
    document.getElementById("menu").style.display = "none";
    started = true;
    renderer.domElement.requestPointerLock();
});

document.addEventListener("mousemove", e => {
    if (!started || document.pointerLockElement !== renderer.domElement) return;

    yaw -= e.movementX * 0.002;
    pitch -= e.movementY * 0.002;

    pitch = Math.max(-1.5, Math.min(1.5, pitch));
});

// BLOCK INTERACTION
const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);

function getTargetBlock() {
    raycaster.setFromCamera(center, camera);
    const hits = raycaster.intersectObjects(blocks);

    return hits.length && hits[0].distance < 6
        ? hits[0]
        : null;
}

// BREAK BLOCK
document.addEventListener("mousedown", e => {
    if (!started || document.pointerLockElement !== renderer.domElement) return;

    const hit = getTargetBlock();

    if (!hit) return;

    if (e.button === 0) {
        const block = hit.object;

        scene.remove(block);

        blocks.splice(blocks.indexOf(block), 1);
    }

    // PLACE BLOCK
    if (e.button === 2) {
        const normal = hit.face.normal.clone();

        const position = hit.object.position.clone()
            .add(normal);

        if (blocks.some(b => b.position.equals(position))) return;

        addBlock(
            position.x,
            position.y,
            position.z,
            "grass"
        );
    }
});

document.addEventListener("contextmenu", e => e.preventDefault());

// MOVEMENT
function updatePlayer() {
    if (!started || document.pointerLockElement !== renderer.domElement) return;

    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;

    const speed = 0.12;

    const forward = new THREE.Vector3(
        -Math.sin(yaw), 0, -Math.cos(yaw)
    );

    const right = new THREE.Vector3(
        Math.cos(yaw), 0, -Math.sin(yaw)
    );

    if (keys["KeyW"]) camera.position.addScaledVector(forward, speed);
    if (keys["KeyS"]) camera.position.addScaledVector(forward, -speed);
    if (keys["KeyA"]) camera.position.addScaledVector(right, -speed);
    if (keys["KeyD"]) camera.position.addScaledVector(right, speed);

    if (keys["Space"]) camera.position.y += speed;
    if (keys["ShiftLeft"]) camera.position.y -= speed;
}

// RESIZE
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
});

// GAME LOOP
function animate() {
    requestAnimationFrame(animate);

    updatePlayer();

    renderer.render(scene, camera);
}

animate();
