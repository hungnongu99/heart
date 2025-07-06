import*as THREE from "three";
import {OrbitControls} from "https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/controls/OrbitControls.js";
import {EffectComposer} from "https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/postprocessing/EffectComposer.js";
import {RenderPass} from "https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/postprocessing/RenderPass.js";
import {AfterimagePass} from "https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/postprocessing/AfterimagePass.js";
import {makeMat} from "./materials.min.js";
let STAR_COUNT = 0
  , starAlpha = null
  , starPhase = null
  , starGeo = null;
const RingText = [...window.dataFromSubdomain && window.dataFromSubdomain.data.candyTexts ? window.dataFromSubdomain.data.candyTexts : ["我喜欢你 ❤️", "谢谢你朋友 ✨", "사랑해요 💖", "힘내요! 🌟", "あなたが好き 🥰", "元気ですか？ 🌈"]];
let bgMusic = null
  , musicStarted = !1;
if (bgMusic = new Audio(window.dataFromSubdomain && window.dataFromSubdomain.data.music ? window.dataFromSubdomain.data.music : "music.mp3"),
bgMusic.loop = !0,
bgMusic.preload = "auto",
void 0 !== window.AudioContext || void 0 !== window.webkitAudioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    window.audioContext = new AudioContext;
    const resumeAudioContext = ()=>{
        "suspended" === window.audioContext.state && window.audioContext.resume()
    }
    ;
    document.addEventListener("touchstart", resumeAudioContext, {
        once: !0
    }),
    document.addEventListener("click", resumeAudioContext, {
        once: !0
    })
}
let cameraAnimationStart = null;
const CAMERA_ANIMATION_DURATION = 5;
let CAMERA_START_POSITION = {
    x: 0,
    y: 90,
    z: 30
};
const CAMERA_END_POSITION = {
    x: 0,
    y: 25,
    z: 65
};
let userHasMovedCamera = !1
  , streamHeartStarted = !1
  , streamHeartActiveRatio = 0
  , firstResetCompleted = !1;
const scene = new THREE.Scene
  , heartScene = new THREE.Scene
  , renderer = new THREE.WebGLRenderer({
    antialias: !0,
    alpha: !0
})
  , HEART_ROTATE = !1;
let heartbeatEnabled = !1;
const fadeObjects = [];
let revealStart = null;
const REVEAL_DURATION = 1.5
  , HEARTBEAT_FREQ_HZ = .5
  , HEARTBEAT_AMPLITUDE = .05
  , STAGE = {
    RIBBON: 0,
    STREAM: 1,
    STAR: 2,
    SHOOT: 3,
    HEART: 4
}
  , STAGE_DURATION = .7;
renderer.setPixelRatio(window.devicePixelRatio),
renderer.setSize(window.innerWidth, window.innerHeight),
document.body.appendChild(renderer.domElement);
let staticBottomHeart = null
  , staticTopHeart = null;
const camera = new THREE.PerspectiveCamera(45,window.innerWidth / window.innerHeight,.1,300);
camera.position.set(0, 90, 25),
camera.lookAt(0, 0, 0);
const controls = new OrbitControls(camera,renderer.domElement);
controls.enableDamping = !0,
controls.minDistance = 5,
controls.maxDistance = 100,
controls.enableZoom = !0,
controls.minPolarAngle = THREE.MathUtils.degToRad(45),
controls.maxPolarAngle = THREE.MathUtils.degToRad(120),
controls.enablePan = !0;
const composerMain = new EffectComposer(renderer)
  , renderPassMain = new RenderPass(scene,camera);
renderPassMain.clear = !1,
composerMain.addPass(renderPassMain);
const composerHeart = new EffectComposer(renderer);
composerHeart.addPass(new RenderPass(heartScene,camera));
const afterimagePass = new AfterimagePass;
afterimagePass.uniforms.damp.value = .9,
composerHeart.addPass(afterimagePass),
scene.add(new THREE.AmbientLight(16777215,.6));
const p1 = new THREE.PointLight(16777215,1.2);
p1.position.set(10, 10, 10),
scene.add(p1);
const p2 = new THREE.PointLight(16744703,.8);
function createCircleTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 256,
    canvas.height = 256;
    const ctx = canvas.getContext("2d")
      , shadowGrad = ctx.createRadialGradient(128, 128, 127 * .4, 128, 128, 127);
    shadowGrad.addColorStop(0, "rgba(255,105,180,0.6)"),
    shadowGrad.addColorStop(1, "rgba(255,20,147,0)"),
    ctx.fillStyle = shadowGrad,
    ctx.beginPath(),
    ctx.arc(128, 128, 127, 0, 2 * Math.PI),
    ctx.closePath(),
    ctx.fill();
    const coreGrad = ctx.createRadialGradient(128, 128, 0, 128, 128, 76.2);
    coreGrad.addColorStop(0, "rgba(255,255,255,1)"),
    coreGrad.addColorStop(1, "rgba(255,255,255,0)"),
    ctx.fillStyle = coreGrad,
    ctx.beginPath(),
    ctx.arc(128, 128, 76.2, 0, 2 * Math.PI),
    ctx.closePath(),
    ctx.fill();
    const tex = new THREE.CanvasTexture(canvas);
    return tex.minFilter = THREE.LinearFilter,
    tex.magFilter = THREE.LinearFilter,
    tex.needsUpdate = !0,
    tex
}
p2.position.set(-10, -10, -10),
scene.add(p2);
const circleTexture = createCircleTexture()
  , heartShape = new THREE.Shape
  , x = 0
  , y = 0;
heartShape.moveTo(5, 5),
heartShape.bezierCurveTo(5, 5, 4, 0, 0, 0),
heartShape.bezierCurveTo(-6, 0, -6, 7, -6, 7),
heartShape.bezierCurveTo(-6, 11, -3, 15.4, 5, 19),
heartShape.bezierCurveTo(12, 15.4, 16, 11, 16, 7),
heartShape.bezierCurveTo(16, 7, 16, 0, 10, 0),
heartShape.bezierCurveTo(7, 0, 5, 5, 5, 5);
const polyPts = heartShape.getPoints(100);
function pointInPolygon(pt, poly) {
    let inside = !1;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i].x
          , yi = poly[i].y
          , xj = poly[j].x
          , yj = poly[j].y;
        yi > pt.y != yj > pt.y && pt.x < (xj - xi) * (pt.y - yi) / (yj - yi) + xi && (inside = !inside)
    }
    return inside
}
const polyShift = polyPts.map(p=>({
    x: p.x - 5,
    y: p.y - 7
}))
  , BORDER_THRESHOLD = .1 * (Math.max(...polyPts.map(p=>p.x)) - Math.min(...polyPts.map(p=>p.x)));
function minDistToBorder(px, py) {
    let minDistSq = 1 / 0;
    for (let i = 0; i < polyShift.length; i++) {
        const a = polyShift[i]
          , b = polyShift[(i + 1) % polyShift.length]
          , dx = b.x - a.x
          , dy = b.y - a.y
          , t = ((px - a.x) * dx + (py - a.y) * dy) / (dx * dx + dy * dy)
          , clamped = Math.max(0, Math.min(1, t))
          , dxi = px - (a.x + clamped * dx)
          , dyi = py - (a.y + clamped * dy)
          , distSq = dxi * dxi + dyi * dyi;
        distSq < minDistSq && (minDistSq = distSq)
    }
    return Math.sqrt(minDistSq)
}
const positions = []
  , sampleCount = 7e3
  , xs = polyPts.map(p=>p.x)
  , ys = polyPts.map(p=>p.y)
  , minX = Math.min(...xs)
  , maxX = Math.max(...xs)
  , minY = Math.min(...ys)
  , maxY = Math.max(...ys)
  , threshold = minY + (maxY - minY) / 6;
for (; positions.length / 3 < 7e3; ) {
    const px = Math.random() * (maxX - minX) + minX
      , py = Math.random() * (maxY - minY) + minY;
    if (pointInPolygon({
        x: px,
        y: py
    }, polyPts)) {
        let minDistSq = 1 / 0;
        for (let i = 0; i < polyPts.length; i++) {
            const a = polyPts[i]
              , b = polyPts[(i + 1) % polyPts.length]
              , dx = b.x - a.x
              , dy = b.y - a.y
              , t = ((px - a.x) * dx + (py - a.y) * dy) / (dx * dx + dy * dy)
              , clamped = Math.max(0, Math.min(1, t))
              , dxi = px - (a.x + clamped * dx)
              , dyi = py - (a.y + clamped * dy)
              , distSq = dxi * dxi + dyi * dyi;
            distSq < minDistSq && (minDistSq = distSq)
        }
        const keepProb = 1 / (1 + 2 * Math.sqrt(minDistSq));
        if (Math.random() < keepProb) {
            const pz = 3.6 * (Math.random() - .5);
            positions.push(px - 5, py - 7, pz)
        }
    }
}
let minZ = 1 / 0
  , maxZval = -1 / 0;
for (let i = 2; i < positions.length; i += 3) {
    const zVal = positions[i];
    zVal < minZ && (minZ = zVal),
    zVal > maxZval && (maxZval = zVal)
}
const heartDepth = maxZval - minZ
  , heartWidth = maxX - minX
  , planeXVar = 2 * heartWidth
  , rStreamStart = .8 * heartWidth
  , Rmax = rStreamStart
  , rVortex = .6 * heartWidth
  , planeZVar = 15 * heartDepth
  , planeYCenter = maxY
  , planeYVar = 1
  , riseDuration = 10
  , fallDuration = 0
  , holdDuration = 0
  , STREAM_RISE_MIN = 8
  , STREAM_RISE_MAX = 12
  , INDENT_Y = maxY - .25 * (maxY - minY)
  , INDENT_HALF_WIDTH = .35 * heartWidth
  , COS_ANGLE_THRESH = .707106
  , CLIP_FRONT_Z = .3
  , staticGeo = new THREE.BufferGeometry
  , originalPositions = positions.slice();
staticGeo.setAttribute("position", new THREE.Float32BufferAttribute(originalPositions,3));
const colors = []
  , pink = new THREE.Color(16751103);
for (let i = 0; i < positions.length; i += 3)
    colors.push(pink.r, pink.g, pink.b);
staticGeo.setAttribute("color", new THREE.Float32BufferAttribute(colors,3));
const staticSizes = new Float32Array(positions.length / 3)
  , SIZE_SCALE = 2;
for (let i = 0; i < staticSizes.length; i++)
    staticSizes[i] = 2 * (.3 * Math.random() + .2);
staticGeo.setAttribute("size", new THREE.Float32BufferAttribute(staticSizes,1));
const topIndices = [];
for (let i = 0; i < positions.length; i += 3) {
    positions[i + 1] > threshold + .1 * (Math.random() - .5) * (maxY - minY) && topIndices.push(i / 3)
}
const topSet = new Set(topIndices);
let bottomPositions = [];
const bottomColors = []
  , bottomSizes = []
  , bottomSizesBase = []
  , topPositionsArr = []
  , topColors = []
  , topSizes = []
  , topAlpha = []
  , idxToTopIdx = new Int32Array(positions.length / 3).fill(-1);
for (let i = 0, topIdx = 0; i < positions.length; i += 3) {
    const idx = i / 3
      , sizeVal = staticSizes[idx]
      , px = positions[i]
      , py = positions[i + 1]
      , pz = positions[i + 2];
    if (topSet.has(idx)) {
        topPositionsArr.push(px, py, pz),
        topColors.push(pink.r, pink.g, pink.b),
        topSizes.push(sizeVal);
        const hideIndent = Math.abs(px) < INDENT_HALF_WIDTH && py > INDENT_Y;
        topAlpha.push(hideIndent ? 0 : 1),
        idxToTopIdx[idx] = topIdx++
    } else
        bottomPositions.push(px, py, pz),
        bottomColors.push(pink.r, pink.g, pink.b),
        bottomSizes.push(sizeVal)
}
staticGeo.setAttribute("position", new THREE.Float32BufferAttribute(topPositionsArr,3)),
staticGeo.setAttribute("color", new THREE.Float32BufferAttribute(topColors,3)),
staticGeo.setAttribute("size", new THREE.Float32BufferAttribute(topSizes,1)),
staticGeo.setAttribute("alpha", new THREE.BufferAttribute(new Float32Array(topAlpha),1)),
staticGeo.attributes.position.needsUpdate = !0,
staticGeo.attributes.alpha.needsUpdate = !0;
const topCount = topPositionsArr.length / 3
  , topRadiusArr = new Float32Array(topCount)
  , topPhaseArr = new Float32Array(topCount)
  , topDelayArr = new Float32Array(topCount);
for (let i = 0; i < topCount; i++) {
    const x = topPositionsArr[3 * i]
      , z = topPositionsArr[3 * i + 2]
      , r = Math.sqrt(x * x + z * z);
    topRadiusArr[i] = r,
    topPhaseArr[i] = Math.atan2(z, x),
    topDelayArr[i] = 10 * Math.random()
}
const GLOBAL_SPIRAL_FREQ = .5
  , BASE_OMEGA = -1 * Math.PI / 10
  , GATHER_RATIO = .01
  , HOLD_RATIO = .2
  , radiusPow = 2.5
  , rCore = .25
  , rOuter = rVortex
  , vIn = .9
  , SHRINK_TO_CORE = !1
  , BURST_SPREAD = .1
  , FADE_DURATION = 2.5
  , SPAWN_DELAY_MAX = 3
  , ASCEND_DELAY_MAX = 10
  , apexY = maxY
  , LOW_REGION_FACTOR = .5;
let minBottomY = 1 / 0
  , maxBottomY = -1 / 0;
for (let i = 1; i < bottomPositions.length; i += 3) {
    const yVal = bottomPositions[i];
    yVal < minBottomY && (minBottomY = yVal),
    yVal > maxBottomY && (maxBottomY = yVal)
}
const Y_THRESHOLD = minBottomY + .5 * (maxBottomY - minBottomY)
  , HIGH_BOTTOM_MULT = 2;
{
    const extraPos = []
      , extraColor = []
      , extraSize = [];
    for (let i = 0; i < bottomPositions.length; i += 3) {
        const py = bottomPositions[i + 1];
        if (py >= Y_THRESHOLD)
            for (let k = 1; k < 2; k++)
                extraPos.push(bottomPositions[i], py, bottomPositions[i + 2]),
                extraColor.push(pink.r, pink.g, pink.b),
                extraSize.push(bottomSizes[i / 3])
    }
    bottomPositions.push(...extraPos),
    bottomColors.push(...extraColor),
    bottomSizes.push(...extraSize)
}
const BOTTOM_ROTATE_RATIO = .2
  , rotPos = []
  , rotColors = []
  , rotSizes = []
  , staticBotPos = []
  , staticBotColors = []
  , staticBotSizes = [];
for (let i = 0; i < bottomPositions.length; i += 3)
    Math.random() < .2 ? (rotPos.push(bottomPositions[i], bottomPositions[i + 1], bottomPositions[i + 2]),
    rotColors.push(pink.r, pink.g, pink.b),
    rotSizes.push(bottomSizes[i / 3])) : (staticBotPos.push(bottomPositions[i], bottomPositions[i + 1], bottomPositions[i + 2]),
    staticBotColors.push(pink.r, pink.g, pink.b),
    staticBotSizes.push(bottomSizes[i / 3]));
bottomPositions.length = 0,
bottomPositions.push(...rotPos),
bottomColors.length = 0,
bottomColors.push(...rotColors),
bottomSizes.length = 0,
bottomSizes.push(...rotSizes);
const bottomCount = bottomPositions.length / 3
  , bottomRadiusArr = new Float32Array(bottomCount)
  , bottomPhaseArr = new Float32Array(bottomCount)
  , bottomDelayArr = new Float32Array(bottomCount)
  , CLEFT_FACTOR = 2.5
  , bottomAlphaArr = new Float32Array(bottomCount).fill(1)
  , bottomIsLow = new Uint8Array(bottomCount)
  , pivotOffset = .25 * heartWidth
  , KEEP_LOW_MIN = 0
  , KEEP_LOW_MAX = .3;
for (let i = 0; i < bottomCount; i++) {
    const x = bottomPositions[3 * i]
      , y = bottomPositions[3 * i + 1]
      , z = bottomPositions[3 * i + 2]
      , isLow = y < Y_THRESHOLD;
    if (bottomIsLow[i] = isLow ? 1 : 0,
    isLow) {
        const keepProb = 0 + .3 * ((y - minBottomY) / (Y_THRESHOLD - minBottomY));
        bottomAlphaArr[i] = Math.random() < keepProb ? 1 : 0
    } else
        bottomAlphaArr[i] = 1;
    const r = Math.sqrt(x * x + z * z)
      , angle = Math.atan2(z, x)
      , distToCleft = Math.min(1, Math.abs(x) / (.25 * heartWidth))
      , cleftFactor = 1.5 * Math.pow(1 - distToCleft, 3) + 1;
    bottomRadiusArr[i] = r * cleftFactor,
    bottomPhaseArr[i] = angle,
    bottomDelayArr[i] = 10 * Math.random()
}
const bottomAlphaBase = Float32Array.from(bottomAlphaArr)
  , bottomGeo = new THREE.BufferGeometry;
bottomGeo.setAttribute("position", new THREE.Float32BufferAttribute(bottomPositions,3)),
bottomGeo.setAttribute("color", new THREE.Float32BufferAttribute(bottomColors,3).setUsage(THREE.DynamicDrawUsage)),
bottomGeo.setAttribute("size", new THREE.Float32BufferAttribute(bottomSizes,1)),
bottomGeo.setAttribute("alpha", new THREE.BufferAttribute(bottomAlphaArr,1));
const V_SLOPE = .3
  , matBottom = makeMat({
    map: circleTexture,
    alphaSupport: !0,
    vClipSlope: .3,
    clipFrontZ: .3
});
matBottom.alphaTest = .5;
const bottomHeart = new THREE.Points(bottomGeo,matBottom);
bottomHeart.rotation.z = Math.PI,
scene.add(bottomHeart);
const BOTTOM_OMEGA = BASE_OMEGA
  , topPointVisibility = new Array(topIndices.length).fill(!0);
let hiddenTopCount = 0;
const matStatic = makeMat({
    map: circleTexture,
    alphaSupport: !0
});
matStatic.alphaTest = .5;
const staticHeart = new THREE.Points(staticGeo,matStatic);
staticHeart.rotation.z = Math.PI,
scene.add(staticHeart);
const TOP_STATIC_RATIO = .5;
{
    const topStaticPos = []
      , topStaticCol = []
      , topStaticSize = [];
    for (let i = 0; i < topPositionsArr.length; i += 3) {
        const keep = minDistToBorder(topPositionsArr[i] + 5, topPositionsArr[i + 1] + 7) < BORDER_THRESHOLD || Math.random() < .3;
        Math.random() < .5 && keep && (topStaticPos.push(topPositionsArr[i], topPositionsArr[i + 1], topPositionsArr[i + 2]),
        topStaticCol.push(pink.r, pink.g, pink.b),
        topStaticSize.push(topSizes[Math.floor(i / 3)]))
    }
    if (topStaticPos.length) {
        const topStaticGeo = new THREE.BufferGeometry;
        topStaticGeo.setAttribute("position", new THREE.Float32BufferAttribute(topStaticPos,3)),
        topStaticGeo.setAttribute("color", new THREE.Float32BufferAttribute(topStaticCol,3).setUsage(THREE.DynamicDrawUsage)),
        topStaticGeo.setAttribute("size", new THREE.Float32BufferAttribute(topStaticSize,1));
        const matTopStatic = makeMat({
            map: circleTexture,
            alphaSupport: !0
        });
        matTopStatic.alphaTest = .5,
        staticTopHeart = new THREE.Points(topStaticGeo,matTopStatic),
        staticTopHeart.rotation.z = Math.PI,
        scene.add(staticTopHeart)
    }
}
if (staticBotPos.length > 0) {
    const staticBottomGeo = new THREE.BufferGeometry;
    staticBottomGeo.setAttribute("position", new THREE.Float32BufferAttribute(staticBotPos,3)),
    staticBottomGeo.setAttribute("color", new THREE.Float32BufferAttribute(staticBotColors,3).setUsage(THREE.DynamicDrawUsage)),
    staticBottomGeo.setAttribute("size", new THREE.Float32BufferAttribute(staticBotSizes,1));
    const staticBottomMat = makeMat({
        map: circleTexture,
        alphaSupport: !0
    });
    staticBottomMat.alphaTest = .5,
    staticBottomHeart = new THREE.Points(staticBottomGeo,staticBottomMat),
    staticBottomHeart.rotation.z = Math.PI,
    scene.add(staticBottomHeart)
}
const SPAWN_MULT = .2
  , rimIndices = [];
for (const idx of topIndices) {
    minDistToBorder(positions[3 * idx], positions[3 * idx + 1]) < BORDER_THRESHOLD && rimIndices.push(idx)
}
const streamSource = rimIndices.length ? rimIndices : topIndices
  , streamCount = Math.floor(.2 * streamSource.length)
  , targetIdxArr = new Uint32Array(streamCount);
for (let i = 0; i < streamCount; i++)
    targetIdxArr[i] = streamSource[i % streamSource.length];
const planeIdxForStream = new Int32Array(streamCount).fill(-1)
  , streamPositions = new Float32Array(3 * streamCount)
  , streamGeo = new THREE.BufferGeometry
  , streamAlpha = new Float32Array(streamCount).fill(1);
streamGeo.setAttribute("alpha", new THREE.BufferAttribute(streamAlpha,1)),
streamGeo.setAttribute("position", new THREE.BufferAttribute(streamPositions,3).setUsage(THREE.DynamicDrawUsage));
const streamColors = new Float32Array(3 * streamCount);
for (let i = 0; i < streamCount; i++) {
    targetIdxArr[i];
    streamColors[3 * i] = 1,
    streamColors[3 * i + 1] = 1,
    streamColors[3 * i + 2] = 1
}
streamGeo.setAttribute("color", new THREE.BufferAttribute(streamColors,3));
const streamSizes = new Float32Array(streamCount);
for (let i = 0; i < streamCount; i++)
    streamSizes[i] = 2 * (.3 * Math.random() + .2 + .1) * 1.5;
const streamSizeBase = streamSizes.slice()
  , BIG_RATIO = .1;
for (let i = 0; i < streamCount; i++)
    Math.random() < .1 && (streamSizes[i] *= 1.5,
    streamColors[3 * i] = 1,
    streamColors[3 * i + 1] = 1,
    streamColors[3 * i + 2] = 1);
streamGeo.setAttribute("size", new THREE.BufferAttribute(streamSizes,1));
const matStream = makeMat({
    map: circleTexture,
    alphaSupport: !0,
    clipBandWidth: INDENT_HALF_WIDTH,
    clipFrontZ: .3
});
matStream.alphaTest = .5;
const streamHeart = new THREE.Points(streamGeo,matStream);
streamHeart.rotation.z = Math.PI,
scene.add(streamHeart),
streamHeart.visible = !1,
fadeObjects.push(streamHeart),
streamHeart.userData.fadeStage = STAGE.STREAM;
const PLANE_COUNT = Math.floor(120 * rVortex)
  , planePositions = []
  , planeColors = []
  , planeSizes = []
  , planeAlphaArr = new Float32Array(PLANE_COUNT).fill(1);
for (let i = 0; i < PLANE_COUNT; i++) {
    const ang = Math.random() * Math.PI * 2
      , rRand = Math.sqrt(Math.random()) * rVortex;
    planePositions.push(Math.cos(ang) * rRand, planeYCenter - 7.5, Math.sin(ang) * rRand),
    planeColors.push(pink.r, pink.g, pink.b),
    planeSizes.push(1 * Math.random() + .25)
}
const planeGeo = new THREE.BufferGeometry;
planeGeo.setAttribute("position", new THREE.Float32BufferAttribute(planePositions,3)),
planeGeo.setAttribute("color", new THREE.Float32BufferAttribute(planeColors,3)),
planeGeo.setAttribute("size", new THREE.Float32BufferAttribute(planeSizes,1)),
planeGeo.setAttribute("alpha", new THREE.BufferAttribute(planeAlphaArr,1));
const matPlane = makeMat({
    map: circleTexture,
    alphaSupport: !0
});
matPlane.alphaTest = .5;
const planeLayer = new THREE.Points(planeGeo,matPlane);
planeLayer.rotation.z = Math.PI,
scene.add(planeLayer),
fadeObjects.push(planeLayer),
fadeObjects.includes(planeLayer) && fadeObjects.splice(fadeObjects.indexOf(planeLayer), 1),
planeLayer.visible = !0;
const PLANE_COLOR_CYCLE = 9
  , PLANE_COL_WHITE = new THREE.Color("rgb(255, 227, 249)")
  , PLANE_COL_LIGHT = new THREE.Color("rgb(255,192,215)")
  , PLANE_COL_DARK = new THREE.Color("rgb(241, 121, 185)");
function makeCharTexture(ch) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(0,0,0,0)",
    ctx.fillRect(0, 0, 128, 128),
    ctx.textAlign = "center",
    ctx.textBaseline = "middle",
    ctx.font = '100 70.4px "Segoe UI Emoji","Noto Color Emoji","Apple Color Emoji",sans-serif',
    ctx.lineWidth = 7.68,
    ctx.strokeStyle = "rgba(160, 30, 95, 0.9)",
    ctx.strokeText(ch, 64, 64),
    ctx.fillStyle = "#ffffff",
    ctx.fillText(ch, 64, 64);
    const tex = new THREE.CanvasTexture(canvas);
    return tex.minFilter = tex.magFilter = THREE.LinearFilter,
    tex
}
planeGeo.attributes.color.setUsage(THREE.DynamicDrawUsage);
const ringCharsFull = RingText.join("")
  , ringChars = Array.from(ringCharsFull)
  , charMatMap = {};
[...new Set(ringChars)].forEach(ch=>{
    charMatMap[ch] = new THREE.SpriteMaterial({
        map: makeCharTexture(ch),
        transparent: !0,
        depthWrite: !1
    })
}
);
const streamSprites = [];
for (let i = 0; i < streamCount; i++) {
    const ch = ringChars[i % ringChars.length]
      , sp = new THREE.Sprite(charMatMap[ch]);
    sp.scale.set(1, 1, 1),
    sp.visible = !1,
    streamHeart.add(sp),
    streamSprites.push(sp)
}
function createRingTexture(lines) {
    const canvas = document.createElement("canvas");
    canvas.width = 2048,
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(0,0,0,0)",
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '80px "Segoe UI Emoji","Noto Color Emoji","Apple Color Emoji",sans-serif',
    ctx.textAlign = "center",
    ctx.textBaseline = "middle",
    ctx.fillStyle = "#ffffff";
    const lineHeight = canvas.height / lines.length;
    lines.forEach((line,idx)=>{
        const y = (idx + .5) * lineHeight;
        ctx.fillText(line, canvas.width / 2, y)
    }
    );
    const tex = new THREE.CanvasTexture(canvas);
    return tex.needsUpdate = !0,
    tex
}
const ringTexture = createRingTexture(RingText)
  , ringMat = new THREE.MeshBasicMaterial({
    map: ringTexture,
    transparent: !0,
    side: THREE.DoubleSide,
    depthWrite: !1,
    blending: THREE.AdditiveBlending
})
  , RING_THICKNESS = 2.5
  , RING_HUE_SPEED = .05
  , RING_FADE_DIST = 1
  , RING_FADE_SPEED = 2
  , ringHeight = .6
  , RING_Y_OFFSET = 2 * -planeYCenter - .5
  , ringGeo = new THREE.CylinderGeometry(rVortex,rVortex,1,128,1,!0)
  , RING_SPACING = 1.2
  , RING_START_RADIUS = rVortex
  , RING_END_RADIUS = .25
  , RING_COUNT = Math.ceil((RING_START_RADIUS - .25) / 1.2)
  , RING_FLIP_Y = Math.PI
  , ribbon = new THREE.Group;
ribbon.position.set(0, planeYCenter + RING_Y_OFFSET, 0),
ribbon.rotation.z = Math.PI,
scene.add(ribbon),
ribbon.visible = !0;
for (let i = 0; i < RING_COUNT; i++) {
    const texLine = createRingTexture([RingText[i % RingText.length]]);
    texLine.wrapS = THREE.RepeatWrapping,
    texLine.repeat.set(2, 1),
    texLine.offset.x = 1;
    const ringMatLine = new THREE.MeshBasicMaterial({
        map: texLine,
        transparent: !0,
        side: THREE.DoubleSide,
        depthWrite: !1,
        blending: THREE.AdditiveBlending
    })
      , ringMesh = new THREE.Mesh(ringGeo,ringMatLine);
    ringMesh.rotation.x = Math.PI;
    const initRad = RING_START_RADIUS - 1.2 * i;
    ringMesh.userData.radius = initRad,
    ringMesh.userData.phase = Math.random() * Math.PI * 2;
    const scale = initRad / RING_START_RADIUS;
    ringMesh.scale.set(scale, 2.5, scale),
    ringMesh.material.opacity = 1,
    ringMesh.material.transparent = !0,
    ringMesh.material.depthWrite = !1,
    ringMesh.renderOrder = i,
    ribbon.add(ringMesh)
}
const vortexIndices = [];
for (let i = 0; i < positions.length / 3; i++)
    topIndices.includes(i) || vortexIndices.push(i);
const vortexCount = vortexIndices.length
  , vortexPositions = new Float32Array(3 * vortexCount)
  , vortexPhase = new Float32Array(vortexCount)
  , vortexRadius = new Float32Array(vortexCount);
for (let i = 0; i < vortexCount; i++) {
    vortexPhase[i] = Math.random() * Math.PI * 2;
    const rRand = Math.random() * rVortex;
    vortexRadius[i] = rRand,
    vortexPositions[3 * i] = Math.cos(vortexPhase[i]) * rRand,
    vortexPositions[3 * i + 1] = planeYCenter,
    vortexPositions[3 * i + 2] = Math.sin(vortexPhase[i]) * rRand
}
const vortexGeo = new THREE.BufferGeometry;
vortexGeo.setAttribute("position", new THREE.BufferAttribute(vortexPositions,3).setUsage(THREE.DynamicDrawUsage));
const vortexColors = new Float32Array(3 * vortexCount);
for (let i = 0; i < vortexCount; i++)
    vortexColors[3 * i] = pink.r,
    vortexColors[3 * i + 1] = pink.g,
    vortexColors[3 * i + 2] = pink.b;
vortexGeo.setAttribute("color", new THREE.BufferAttribute(vortexColors,3));
const vortexSizes = new Float32Array(vortexCount);
for (let i = 0; i < vortexCount; i++)
    vortexSizes[i] = .2 * Math.random() + .15;
vortexGeo.setAttribute("size", new THREE.BufferAttribute(vortexSizes,1));
const vortexMat = makeMat({
    map: circleTexture,
    blending: THREE.AdditiveBlending,
    opacity: .8
});
vortexMat.onBeforeCompile = function(shader) {
    shader.vertexShader = shader.vertexShader.replace("uniform float size;", "attribute float size;")
}
;
const heartLayers = [staticHeart, bottomHeart, staticBottomHeart, staticTopHeart];
heartLayers.forEach(obj=>{
    obj && (scene.remove(obj),
    heartScene.add(obj))
}
),
heartLayers.forEach(obj=>{
    obj && (obj.visible = !1,
    obj.userData.fadeStage = STAGE.HEART,
    fadeObjects.includes(obj) || fadeObjects.push(obj))
}
);
const HEART_OFFSET_Y = 10;
[staticHeart, bottomHeart, staticTopHeart, staticBottomHeart].forEach(obj=>{
    obj && (obj.position.y += 10)
}
);
const HEART_OFFSET_YY = 8;
[streamHeart, ribbon].forEach(obj=>{
    obj && (obj.position.y += 8)
}
);
const ENABLE_EXPLOSION = !1;
let expPositions, expVelocities, expBirth, expGeo, expColors, expMat, explosionPoints, MAX_EXP, expCount = 0;
const startTimes = new Float32Array(streamCount)
  , STATE_ON_DISK = 0
  , STATE_ASCEND = 1
  , streamState = new Uint8Array(streamCount)
  , curRadiusArr = new Float32Array(streamCount)
  , ascendStart = new Float32Array(streamCount)
  , spiralPhase = new Float32Array(streamCount)
  , streamRadius = new Float32Array(streamCount)
  , initialRadius = new Float32Array(streamCount)
  , spiralFrequency = new Float32Array(streamCount)
  , spiralDirection = new Float32Array(streamCount)
  , extraRotArr = new Float32Array(streamCount)
  , MAX_TOP_HIDE = Math.floor(1 * topIndices.length)
  , HIDE_DISTANCE = .25
  , TOP_ROT_SPEED = .5
  , streamRiseDuration = new Float32Array(streamCount)
  , streamOffsets = new Float32Array(3 * streamCount);
for (let i = 0; i < streamCount; i++) {
    const idx3 = 3 * i
      , theta = Math.random() * Math.PI * 2
      , phi = Math.acos(2 * Math.random() - 1)
      , r = .4;
    streamOffsets[idx3] = r * Math.sin(phi) * Math.cos(theta),
    streamOffsets[idx3 + 1] = r * Math.sin(phi) * Math.sin(theta),
    streamOffsets[idx3 + 2] = r * Math.cos(phi)
}
function resetStreamParticle(i, now) {
    const idx3 = 3 * i
      , targetIndex = targetIdxArr[i];
    let pIdx = -1;
    for (let attempt = 0; attempt < 100; attempt++) {
        const idxTry = Math.floor(Math.random() * PLANE_COUNT)
          , pxTry = planePositions[3 * idxTry]
          , pzTry = planePositions[3 * idxTry + 2];
        if (Math.hypot(pxTry, pzTry) <= .26) {
            pIdx = idxTry;
            break
        }
    }
    -1 === pIdx && (pIdx = Math.floor(Math.random() * PLANE_COUNT)),
    planeIdxForStream[i] = pIdx;
    const thetaNew = Math.random() * Math.PI * 2;
    planePositions[3 * pIdx] = Math.cos(thetaNew) * rOuter,
    planePositions[3 * pIdx + 2] = Math.sin(thetaNew) * rOuter,
    planeGeo.attributes.position.needsUpdate = !0;
    const rotY = planeLayer.rotation.y
      , cosR = Math.cos(rotY)
      , sinR = Math.sin(rotY)
      , worldX = cosR * planePositions[3 * pIdx] - sinR * planePositions[3 * pIdx + 2]
      , worldZ = sinR * planePositions[3 * pIdx] + cosR * planePositions[3 * pIdx + 2];
    streamPositions[idx3] = worldX,
    streamPositions[idx3 + 1] = planePositions[3 * pIdx + 1],
    streamPositions[idx3 + 2] = worldZ;
    const rInit = .25 + (rOuter - .25) * Math.random()
      , angStart = Math.random() * Math.PI * 2;
    streamPositions[idx3] = Math.cos(angStart) * rInit,
    streamPositions[idx3 + 1] = planeYCenter,
    streamPositions[idx3 + 2] = Math.sin(angStart) * rInit,
    curRadiusArr[i] = rInit,
    spiralPhase[i] = angStart,
    streamState[i] = 0,
    startTimes[i] = now - Math.random() * (rOuter - .25) / .9,
    ascendStart[i] = 10 * Math.random(),
    streamRiseDuration[i] = 8 + 4 * Math.random();
    const rotTurns = .5 + 1.5 * Math.random()
      , dir = Math.random() < .5 ? -1 : 1;
    extraRotArr[i] = 2 * rotTurns * Math.PI * dir;
    const mIdx = idxToTopIdx[targetIndex];
    -1 !== mIdx && (topAlpha[mIdx] = 1,
    staticGeo.attributes.alpha.needsUpdate = !0);
    const sprite = streamSprites[i];
    sprite.visible = !1,
    sprite.material.opacity = 0,
    sprite.position.set(streamPositions[idx3], streamPositions[idx3 + 1], streamPositions[idx3 + 2]),
    streamAlpha[i] = 1,
    streamGeo.attributes.alpha.needsUpdate = !0
}
const now0 = 0;
for (let i = 0; i < streamCount; i++)
    resetStreamParticle(i, 0);
streamGeo.attributes.position.needsUpdate = !0,
streamGeo.attributes.alpha.needsUpdate = !0;
const clock = new THREE.Clock;
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta()
      , now = clock.getElapsedTime();
    for (let p = 0; p < PLANE_COUNT; p++) {
        const pIdx3 = 3 * p;
        let px = planePositions[pIdx3]
          , pz = planePositions[pIdx3 + 2]
          , r = Math.hypot(px, pz);
        if (r > .25) {
            r = Math.max(.25, r - .9 * delta);
            const theta = Math.atan2(pz, px);
            planePositions[pIdx3] = Math.cos(theta) * r,
            planePositions[pIdx3 + 2] = Math.sin(theta) * r
        }
    }
    if (planeGeo.attributes.position.needsUpdate = !0,
    planeLayer.visible && (planeLayer.visible = !0),
    planeLayer.rotation.y = BASE_OMEGA * now,
    void 0 !== ribbon && (ribbon.rotation.y = planeLayer.rotation.y + RING_FLIP_Y),
    void 0 !== ribbon && ribbon.children.length) {
        const totalSpan = RING_START_RADIUS - .25;
        ribbon.children.forEach((ringMesh,idx)=>{
            ringMesh.userData.radius -= .9 * delta;
            ringMesh.userData.radius - 1.25 < .25 && (ringMesh.userData.radius += totalSpan);
            const innerRadius = ringMesh.userData.radius - 1.25;
            if (innerRadius < 1.25) {
                const t = THREE.MathUtils.clamp((innerRadius - .25) / 1, 0, 1);
                ringMesh.material.opacity = t
            }
            innerRadius < .25 && (ringMesh.userData.radius += totalSpan,
            ringMesh.material.opacity = 0),
            ringMesh.material.opacity < 1 && (ringMesh.material.opacity = Math.min(1, ringMesh.material.opacity + 2 * delta));
            const s = ringMesh.userData.radius / RING_START_RADIUS;
            ringMesh.scale.set(s, 2.5, s),
            ringMesh.material.color.set(16777215),
            ringMesh.rotation.y = ringMesh.userData.phase
        }
        )
    }
    camera.updateMatrixWorld();
    const camInvMat = camera.matrixWorldInverse;
    if (streamHeartStarted) {
        streamHeart.matrixWorld,
        new THREE.Vector3,
        new THREE.Vector3;
        for (let i = 0; i < streamCount; i++) {
            const idx3 = 3 * i
              , start = startTimes[i]
              , elapsed = now - (start + i % 5 * 1.6)
              , targetIndex = targetIdxArr[i];
            if (0 === streamState[i]) {
                const ang = spiralPhase[i] + BASE_OMEGA * (now - startTimes[i]);
                false,
                streamPositions[idx3] = Math.cos(ang) * curRadiusArr[i],
                streamPositions[idx3 + 1] = planeYCenter,
                streamPositions[idx3 + 2] = Math.sin(ang) * curRadiusArr[i];
                const sprite = streamSprites[i];
                sprite.visible = !1,
                sprite.material.opacity = 0,
                sprite.position.set(streamPositions[idx3], streamPositions[idx3 + 1], streamPositions[idx3 + 2]),
                streamAlpha[i] = 1,
                elapsed >= ascendStart[i] && (streamState[i] = 1,
                startTimes[i] = now,
                initialRadius[i] = curRadiusArr[i]);
                continue
            }
            if (elapsed < -2.5) {
                const ang0 = spiralPhase[i] + BASE_OMEGA * (now - start);
                streamPositions[idx3] = initialRadius[i] * Math.cos(ang0),
                streamPositions[idx3 + 1] = planeYCenter,
                streamPositions[idx3 + 2] = initialRadius[i] * Math.sin(ang0),
                streamAlpha[i] = 0;
                continue
            }
            if (elapsed < 0) {
                const lin = (elapsed + 2.5) / 2.5
                  , s = lin * lin * (3 - 2 * lin);
                streamAlpha[i] = s;
                const ang0 = spiralPhase[i] + BASE_OMEGA * (now - start);
                streamPositions[idx3] = initialRadius[i] * Math.cos(ang0),
                streamPositions[idx3 + 1] = planeYCenter,
                streamPositions[idx3 + 2] = initialRadius[i] * Math.sin(ang0);
                continue
            }
            const riseDur = streamRiseDuration[i];
            if (elapsed >= riseDur) {
                const k = (elapsed - riseDur) / 2.5;
                if (k < 1) {
                    const s2 = k * k * (3 - 2 * k);
                    streamAlpha[i] = 1 - s2;
                    const ang0 = spiralPhase[i] + BASE_OMEGA * (now - start);
                    streamPositions[idx3] = initialRadius[i] * Math.cos(ang0),
                    streamPositions[idx3 + 1] = planeYCenter,
                    streamPositions[idx3 + 2] = initialRadius[i] * Math.sin(ang0);
                    continue
                }
                streamAlpha[i] = 1,
                resetStreamParticle(i, now),
                firstResetCompleted || (firstResetCompleted = !0);
                continue
            }
            streamAlpha[i] = 1;
            const prog = elapsed / riseDur;
            if (prog < .01) {
                let newX, newY, newZ;
                const ang0 = spiralPhase[i] + BASE_OMEGA * (now - start);
                {
                    const currentRadius = initialRadius[i];
                    newX = Math.cos(ang0) * currentRadius,
                    newZ = Math.sin(ang0) * currentRadius;
                    const kAsc = Math.min(1, prog / .01);
                    newY = THREE.MathUtils.lerp(planeYCenter, apexY, kAsc)
                }
                streamPositions[idx3] = newX,
                streamPositions[idx3 + 1] = newY,
                streamPositions[idx3 + 2] = newZ
            } else {
                const t = (prog - .01) / .99
                  , easedT = 1 - Math.pow(1 - t, 3)
                  , angBurst = spiralPhase[i] + BASE_OMEGA * (now - start)
                  , radiusStart = initialRadius[i]
                  , startX = Math.cos(angBurst) * radiusStart
                  , startZ = Math.sin(angBurst) * radiusStart
                  , startY = apexY
                  , baseIdx3 = 3 * targetIndex
                  , targetX = positions[baseIdx3]
                  , targetY = positions[baseIdx3 + 1] - 4 + 2
                  , targetZ = positions[baseIdx3 + 2];
                let newXBurst = THREE.MathUtils.lerp(startX, targetX, easedT)
                  , newYBurst = THREE.MathUtils.lerp(startY, targetY, easedT)
                  , newZBurst = THREE.MathUtils.lerp(startZ, targetZ, easedT);
                const spreadScale = 1 + .1 * (1 - easedT);
                newXBurst *= spreadScale,
                newZBurst *= spreadScale;
                const rotExtra = (1 - easedT) * extraRotArr[i]
                  , cosE = Math.cos(rotExtra)
                  , sinE = Math.sin(rotExtra)
                  , tmpX = newXBurst * cosE - newZBurst * sinE
                  , tmpZ = newXBurst * sinE + newZBurst * cosE;
                streamPositions[idx3] = tmpX,
                streamPositions[idx3 + 1] = newYBurst,
                streamPositions[idx3 + 2] = tmpZ
            }
            const sprite = streamSprites[i];
            if (sprite.position.set(streamPositions[idx3], streamPositions[idx3 + 1], streamPositions[idx3 + 2]),
            prog < .65 ? (streamAlpha[i] = 1,
            sprite.visible = !0,
            sprite.material.opacity = 1) : (sprite.visible = !1,
            sprite.material.opacity = 0,
            streamAlpha[i] = 0),
            streamGeo.attributes.size.needsUpdate = !0,
            prog > .95) {
                const topIdxPos = topIndices.indexOf(targetIndex);
                if (topPointVisibility[topIdxPos] && hiddenTopCount < MAX_TOP_HIDE) {
                    topPointVisibility[topIdxPos] = !1;
                    const mIdx = idxToTopIdx[targetIndex];
                    -1 !== mIdx && (topAlpha[mIdx] = 0,
                    staticGeo.attributes.alpha.needsUpdate = !0),
                    hiddenTopCount++
                }
            }
        }
    } else {
        for (let i = 0; i < streamCount; i++) {
            if (streamHeartActiveRatio < 1 && i / streamCount > .1) {
                const idx3 = 3 * i
                  , ang = spiralPhase[i] + BASE_OMEGA * now;
                streamPositions[idx3] = Math.cos(ang) * curRadiusArr[i],
                streamPositions[idx3 + 1] = planeYCenter,
                streamPositions[idx3 + 2] = Math.sin(ang) * curRadiusArr[i],
                streamAlpha[i] = 0;
                continue
            }
            if (!firstResetCompleted && i / streamCount > 1e-4) {
                const idx3 = 3 * i
                  , ang = spiralPhase[i] + BASE_OMEGA * now;
                streamPositions[idx3] = Math.cos(ang) * curRadiusArr[i],
                streamPositions[idx3 + 1] = planeYCenter,
                streamPositions[idx3 + 2] = Math.sin(ang) * curRadiusArr[i],
                streamAlpha[i] = 0;
                continue
            }
            const idx3 = 3 * i
              , ang = spiralPhase[i] + BASE_OMEGA * now;
            streamPositions[idx3] = Math.cos(ang) * curRadiusArr[i],
            streamPositions[idx3 + 1] = planeYCenter,
            streamPositions[idx3 + 2] = Math.sin(ang) * curRadiusArr[i],
            streamAlpha[i] = 0
        }
        streamGeo.attributes.position.needsUpdate = !0,
        streamGeo.attributes.alpha.needsUpdate = !0
    }
    streamGeo.attributes.position.needsUpdate = !0,
    streamGeo.attributes.alpha.needsUpdate = !0;
    for (let i = 0; i < vortexCount; i++) {
        const idx3 = 3 * i
          , baseOmega = 1 * Math.PI / 10
          , rad = vortexRadius[i]
          , time = now * baseOmega
          , noise1 = .3 * Math.sin(time + vortexPhase[i])
          , noise2 = .2 * Math.cos(.7 * time + vortexPhase[i])
          , angle = time + vortexPhase[i] + noise1
          , r = rad * (1 + noise2);
        vortexPositions[idx3] = Math.cos(angle) * r,
        vortexPositions[idx3 + 1] = planeYCenter + .5 * Math.sin(time + vortexPhase[i]),
        vortexPositions[idx3 + 2] = Math.sin(angle) * r
    }
    vortexGeo.attributes.position.needsUpdate = !0;
    const bottomPosArr = bottomGeo.attributes.position.array;
    for (let i = 0; i < bottomCount; i++) {
        if (now < bottomDelayArr[i])
            continue;
        const theta = bottomPhaseArr[i]
          , r = bottomRadiusArr[i]
          , baseX = Math.cos(theta) * r;
        if (Math.abs(theta) < .25 * Math.PI) {
            const distToCleft = Math.min(1, Math.abs(baseX) / (.25 * heartWidth))
              , cleftFactor = 1.5 * Math.pow(1 - distToCleft, 3) + 1
              , sign = baseX >= 0 ? 1 : -1;
            bottomPosArr[3 * i] = baseX + sign * (Math.abs(baseX) * (cleftFactor - 1))
        } else
            bottomPosArr[3 * i] = baseX;
        bottomPosArr[3 * i + 2] = Math.sin(theta) * r;
        const xLocal = bottomPosArr[3 * i]
          , yLocal = bottomPosArr[3 * i + 1]
          , zLocal = bottomPosArr[3 * i + 2]
          , worldPos = new THREE.Vector3(xLocal,yLocal,zLocal).applyMatrix4(bottomHeart.matrixWorld);
        (new THREE.Vector3).copy(worldPos).applyMatrix4(camInvMat),
        bottomAlphaArr[i] = bottomAlphaBase[i]
    }
    bottomGeo.attributes.position.needsUpdate = !0,
    bottomGeo.attributes.alpha.needsUpdate = !0;
    const camAz = controls.getAzimuthalAngle();
    if (staticHeart && (staticHeart.rotation.y = camAz),
    bottomHeart && (bottomHeart.rotation.y = camAz),
    staticBottomHeart && (staticBottomHeart.rotation.y = camAz),
    staticTopHeart && (staticTopHeart.rotation.y = camAz),
    heartbeatEnabled) {
        const beatScale = 1 + .05 * Math.sin(.5 * now * Math.PI * 2);
        staticHeart && staticHeart.scale.set(beatScale, beatScale, beatScale),
        bottomHeart && bottomHeart.scale.set(beatScale, beatScale, beatScale),
        staticBottomHeart && staticBottomHeart.scale.set(beatScale, beatScale, beatScale),
        staticTopHeart && staticTopHeart.scale.set(beatScale, beatScale, beatScale)
    }
    if (controls.update(),
    renderer.clear(),
    composerHeart.render(),
    renderer.clearDepth(),
    renderer.autoClear = !1,
    composerMain.render(),
    renderer.autoClear = !0,
    hiddenTopCount < MAX_TOP_HIDE) {
        for (let attempt = 0; attempt < 5 && hiddenTopCount < MAX_TOP_HIDE; attempt++) {
            const rnd = Math.floor(Math.random() * topIndices.length)
              , idxTop = topIndices[rnd];
            if (topPointVisibility[rnd]) {
                topPointVisibility[rnd] = !1;
                const mIdx = idxToTopIdx[idxTop];
                -1 !== mIdx && (topAlpha[mIdx] = 0,
                hiddenTopCount++)
            }
        }
        staticGeo.attributes.position.needsUpdate = !0,
        staticGeo.attributes.alpha.needsUpdate = !0
    }
    const tCycle = now % 9 / 9;
    let colTmp = new THREE.Color;
    if (tCycle < 1 / 3) {
        const k = 3 * tCycle;
        colTmp.copy(PLANE_COL_WHITE).lerp(PLANE_COL_LIGHT, k)
    } else if (tCycle < 2 / 3) {
        const k = 3 * (tCycle - 1 / 3);
        colTmp.copy(PLANE_COL_LIGHT).lerp(PLANE_COL_DARK, k)
    } else {
        const k = 3 * (tCycle - 2 / 3);
        colTmp.copy(PLANE_COL_DARK).lerp(PLANE_COL_WHITE, k)
    }
    const pr = colTmp.r
      , pg = colTmp.g
      , pb = colTmp.b
      , pColorArr = planeGeo.attributes.color.array;
    for (let i = 0; i < PLANE_COUNT; i++) {
        const idx3 = 3 * i;
        pColorArr[idx3] = pr,
        pColorArr[idx3 + 1] = pg,
        pColorArr[idx3 + 2] = pb
    }
    function applyColor(attrArray) {
        for (let k = 0; k < attrArray.length; k += 3)
            attrArray[k] = pr,
            attrArray[k + 1] = pg,
            attrArray[k + 2] = pb
    }
    if (planeGeo.attributes.color.needsUpdate = !0,
    applyColor(staticGeo.attributes.color.array),
    staticGeo.attributes.color.needsUpdate = !0,
    applyColor(bottomGeo.attributes.color.array),
    bottomGeo.attributes.color.needsUpdate = !0,
    staticBottomHeart && (applyColor(staticBottomHeart.geometry.attributes.color.array),
    staticBottomHeart.geometry.attributes.color.needsUpdate = !0),
    staticTopHeart && (applyColor(staticTopHeart.geometry.attributes.color.array),
    staticTopHeart.geometry.attributes.color.needsUpdate = !0),
    applyColor(vortexGeo.attributes.color.array),
    vortexGeo.attributes.color.needsUpdate = !0,
    ribbon.children.forEach(ringMesh=>{
        ringMesh.material.color.setRGB(pr, pg, pb),
        ringMesh.material.needsUpdate = !0
    }
    ),
    void 0 !== starAlpha) {
        for (let s = 0; s < STAR_COUNT; s++)
            starAlpha[s] = .7 + .3 * Math.sin(2 * now + starPhase[s]);
        starGeo.attributes.alpha.needsUpdate = !0
    }
    if (now >= nextShootTime) {
        for (let s = 0; s < SHOOT_MAX; s++)
            if (shootLife[s] <= 0) {
                const idx3 = 3 * s
                  , OFFSET_X = -45;
                shootPositions[idx3] = OFFSET_X,
                shootPositions[idx3 + 1] = 15 * Math.random() - 15,
                shootPositions[idx3 + 2] = 15 * Math.random() - 35;
                const SPEED = 20 + 25 * Math.random()
                  , dirY = .6 * Math.random() - .2
                  , dirZ = .1 + .25 * Math.random()
                  , dir = new THREE.Vector3(1,dirY,dirZ).normalize();
                shootVel[idx3] = dir.x * SPEED,
                shootVel[idx3 + 1] = dir.y * SPEED,
                shootVel[idx3 + 2] = dir.z * SPEED,
                shootBirth[s] = now;
                const approxDist = SHOOT_OUT_RADIUS - 50;
                shootLife[s] = approxDist / SPEED + 1,
                shootAlpha[s] = .8 + .2 * Math.random();
                break
            }
        nextShootTime = now + 1 + 1 * Math.random()
    }
    for (let s = 0; s < SHOOT_MAX; s++)
        if (shootLife[s] > 0) {
            const idx3 = 3 * s;
            shootPositions[idx3] += shootVel[idx3] * delta,
            shootPositions[idx3 + 1] += shootVel[idx3 + 1] * delta,
            shootPositions[idx3 + 2] += shootVel[idx3 + 2] * delta;
            const headDist = Math.hypot(shootPositions[idx3], shootPositions[idx3 + 1], shootPositions[idx3 + 2]);
            shootBirth[s],
            shootLife[s];
            if (headDist > SHOOT_OUT_RADIUS)
                shootLife[s] = 0,
                shootAlpha[s] = 0;
            else {
                const fadeStart = .9
                  , progress = headDist / SHOOT_OUT_RADIUS;
                shootAlpha[s] = progress > fadeStart ? 1 - (progress - fadeStart) / (1 - fadeStart) : 1
            }
            const headIdx = s * (TAIL_SEGMENTS + 1)
              , headIdx3 = 3 * headIdx;
            tailPositions[headIdx3] = shootPositions[idx3],
            tailPositions[headIdx3 + 1] = shootPositions[idx3 + 1],
            tailPositions[headIdx3 + 2] = shootPositions[idx3 + 2],
            tailAlphas[headIdx] = shootAlpha[s];
            for (let t = 1; t <= TAIL_SEGMENTS; t++) {
                const segIdx = s * (TAIL_SEGMENTS + 1) + t
                  , segIdx3 = 3 * segIdx;
                tailPositions[segIdx3] = shootPositions[idx3] - shootVel[idx3] * t * TAIL_SPACING,
                tailPositions[segIdx3 + 1] = shootPositions[idx3 + 1] - shootVel[idx3 + 1] * t * TAIL_SPACING,
                tailPositions[segIdx3 + 2] = shootPositions[idx3 + 2] - shootVel[idx3 + 2] * t * TAIL_SPACING;
                const tailFade = 1 - t / TAIL_SEGMENTS;
                tailAlphas[segIdx] = shootAlpha[s] * tailFade
            }
        }
    if (tailGeo.attributes.position.needsUpdate = !0,
    tailGeo.attributes.alpha.needsUpdate = !0,
    heartbeatEnabled) {
        const beatScale = 1 + .05 * Math.sin(.5 * now * Math.PI * 2);
        staticHeart && staticHeart.scale.set(beatScale, beatScale, beatScale),
        bottomHeart && bottomHeart.scale.set(beatScale, beatScale, beatScale),
        staticBottomHeart && staticBottomHeart.scale.set(beatScale, beatScale, beatScale),
        staticTopHeart && staticTopHeart.scale.set(beatScale, beatScale, beatScale)
    }
    if (null !== revealStart && (fadeObjects.forEach(obj=>{
        if (!obj || obj === ribbon)
            return;
        const st = obj.userData.fadeStage ?? 0
          , lin = THREE.MathUtils.clamp((now - revealStart - .7 * st) / .7, 0, 1)
          , tFade = lin * lin * (3 - 2 * lin);
        obj.traverse?.(child=>{
            const mat = child.material;
            if (!mat)
                return;
            const base = child.userData.baseOpacity ?? 1;
            mat.opacity = base * tFade
        }
        ),
        st === STAGE.STREAM && tFade > .1 && (streamHeartStarted = !0,
        streamHeartActiveRatio = tFade)
    }
    ),
    now - revealStart > .7 * (STAGE.HEART + 1) && (revealStart = null)),
    null !== cameraAnimationStart) {
        const elapsed = now - cameraAnimationStart
          , progress = THREE.MathUtils.clamp(elapsed / 5, 0, 1)
          , t = progress * progress * (3 - 2 * progress);
        camera.position.x = THREE.MathUtils.lerp(CAMERA_START_POSITION.x, CAMERA_END_POSITION.x, t),
        camera.position.y = THREE.MathUtils.lerp(CAMERA_START_POSITION.y, CAMERA_END_POSITION.y, t),
        camera.position.z = THREE.MathUtils.lerp(CAMERA_START_POSITION.z, CAMERA_END_POSITION.z, t),
        camera.lookAt(0, 0, 0),
        progress >= 1 && (cameraAnimationStart = null)
    }
}
window.addEventListener("resize", ()=>{
    camera.aspect = window.innerWidth / window.innerHeight,
    camera.updateProjectionMatrix(),
    renderer.setSize(window.innerWidth, window.innerHeight)
}
);
const refinedBottomPos = []
  , refinedBottomColors = []
  , refinedBottomSizes = [];
for (let i = 0; i < bottomPositions.length; i += 3) {
    const px = bottomPositions[i]
      , py = bottomPositions[i + 1]
      , pz = bottomPositions[i + 2];
    (minDistToBorder(px, py) < BORDER_THRESHOLD || Math.random() < .9) && (refinedBottomPos.push(px, py, pz),
    refinedBottomColors.push(pink.r, pink.g, pink.b),
    refinedBottomSizes.push(bottomSizes[i / 3]))
}
bottomPositions = refinedBottomPos,
bottomColors.length = 0,
bottomColors.push(...refinedBottomColors),
bottomSizes.length = 0,
bottomSizes.push(...refinedBottomSizes),
STAR_COUNT = 1e4;
const starPositions = new Float32Array(3 * STAR_COUNT)
  , starColors = new Float32Array(3 * STAR_COUNT)
  , starSizes = new Float32Array(STAR_COUNT);
starAlpha = new Float32Array(STAR_COUNT),
starPhase = new Float32Array(STAR_COUNT);
const STAR_RADIUS = 200;
for (let i = 0; i < STAR_COUNT; i++) {
    const u = Math.random()
      , v = Math.random()
      , theta = 2 * u * Math.PI
      , phi = Math.acos(2 * v - 1)
      , r = 200 + 8 * (Math.random() - .5)
      , x = r * Math.sin(phi) * Math.cos(theta)
      , y = r * Math.sin(phi) * Math.sin(theta)
      , z = r * Math.cos(phi);
    0;
    const idx3 = 3 * i;
    starPositions[idx3] = x,
    starPositions[idx3 + 1] = y,
    starPositions[idx3 + 2] = z;
    const tint = .95 + .05 * Math.random();
    starColors[idx3] = tint,
    starColors[idx3 + 1] = tint,
    starColors[idx3 + 2] = 1,
    starSizes[i] = 4.5 * Math.random() + .5,
    starAlpha[i] = 1,
    starPhase[i] = Math.random() * Math.PI * 2
}
starGeo = new THREE.BufferGeometry,
starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions,3)),
starGeo.setAttribute("color", new THREE.BufferAttribute(starColors,3)),
starGeo.setAttribute("size", new THREE.BufferAttribute(starSizes,1)),
starGeo.setAttribute("alpha", new THREE.BufferAttribute(starAlpha,1).setUsage(THREE.DynamicDrawUsage));
const starMat = makeMat({
    map: circleTexture,
    blending: THREE.AdditiveBlending,
    depthWrite: !1,
    alphaSupport: !0,
    opacity: 1.2,
    sizeAttenuation: !1
});
starMat.onBeforeCompile = function(shader) {
    shader.vertexShader = shader.vertexShader.replace("uniform float size;", "attribute float size; attribute float alpha; varying float vAlpha;"),
    shader.vertexShader = shader.vertexShader.replace("#include <project_vertex>", "#include <project_vertex>\n  vAlpha = alpha;"),
    shader.fragmentShader = shader.fragmentShader.replace("void main() {", "varying float vAlpha;\nvoid main(){"),
    shader.fragmentShader = shader.fragmentShader.replace("gl_FragColor = vec4( outgoingLight, diffuseColor.a );", "gl_FragColor = vec4( outgoingLight, diffuseColor.a * vAlpha );")
}
;
const starField = new THREE.Points(starGeo,starMat);
scene.add(starField),
starField.visible = !1,
fadeObjects.push(starField),
starField.userData.fadeStage = STAGE.STAR;
const SHOOT_MAX = 10
  , TAIL_SEGMENTS = 260
  , TAIL_SPACING = .001
  , SHOOT_OUT_RADIUS = 350
  , SHOOT_POINTS = SHOOT_MAX * (1 + TAIL_SEGMENTS)
  , shootPositions = new Float32Array(3 * SHOOT_MAX)
  , shootVel = new Float32Array(3 * SHOOT_MAX)
  , shootBirth = new Float32Array(SHOOT_MAX)
  , shootLife = new Float32Array(SHOOT_MAX).fill(0)
  , shootAlpha = new Float32Array(SHOOT_MAX).fill(0)
  , shootSize = new Float32Array(SHOOT_MAX);
for (let i = 0; i < SHOOT_MAX; i++)
    shootSize[i] = 3;
const tailPositions = new Float32Array(3 * SHOOT_POINTS)
  , tailColors = new Float32Array(3 * SHOOT_POINTS)
  , tailSizes = new Float32Array(SHOOT_POINTS)
  , tailAlphas = new Float32Array(SHOOT_POINTS).fill(0);
for (let i = 0; i < SHOOT_MAX; i++) {
    tailSizes[i * (TAIL_SEGMENTS + 1)] = 6;
    for (let t = 1; t <= TAIL_SEGMENTS; t++) {
        const idx = i * (TAIL_SEGMENTS + 1) + t
          , fade = 1 - t / TAIL_SEGMENTS;
        tailSizes[idx] = 4 * fade;
        const idx3 = 3 * idx;
        tailColors[idx3] = .7 * fade,
        tailColors[idx3 + 1] = .8 * fade,
        tailColors[idx3 + 2] = 1 * fade
    }
}
for (let i = 0; i < SHOOT_MAX; i++) {
    const idx3 = i * (TAIL_SEGMENTS + 1) * 3;
    tailColors[idx3] = 1,
    tailColors[idx3 + 1] = 1,
    tailColors[idx3 + 2] = 1
}
const tailGeo = new THREE.BufferGeometry;
tailGeo.setAttribute("position", new THREE.BufferAttribute(tailPositions,3).setUsage(THREE.DynamicDrawUsage)),
tailGeo.setAttribute("color", new THREE.BufferAttribute(tailColors,3)),
tailGeo.setAttribute("size", new THREE.BufferAttribute(tailSizes,1)),
tailGeo.setAttribute("alpha", new THREE.BufferAttribute(tailAlphas,1).setUsage(THREE.DynamicDrawUsage));
const tailMat = makeMat({
    map: circleTexture,
    blending: THREE.AdditiveBlending,
    depthWrite: !1,
    alphaSupport: !0,
    vertexColors: !0,
    opacity: 2,
    sizeAttenuation: !1
});
tailMat.onBeforeCompile = function(shader) {
    shader.vertexShader = shader.vertexShader.replace("uniform float size;", "attribute float size; attribute float alpha; varying float vAlpha;"),
    shader.vertexShader = shader.vertexShader.replace("#include <project_vertex>", "#include <project_vertex>\n  vAlpha = alpha;"),
    shader.fragmentShader = shader.fragmentShader.replace("void main() {", "varying float vAlpha;\nvoid main(){"),
    shader.fragmentShader = shader.fragmentShader.replace("gl_FragColor = vec4( outgoingLight, diffuseColor.a );", "gl_FragColor = vec4( outgoingLight, diffuseColor.a * vAlpha );")
}
;
const shootingStars = new THREE.Points(tailGeo,tailMat);
scene.add(shootingStars),
shootingStars.userData.fadeStage = STAGE.SHOOT;
let nextShootTime = 0;
function activateEffects(e) {
    if (console.log("activateEffects", e && e.type, heartbeatEnabled),
    !heartbeatEnabled) {
        if (heartbeatEnabled = !0,
        !musicStarted) {
            if (void 0 !== window.AudioContext || void 0 !== window.webkitAudioContext) {
                window.AudioContext || window.webkitAudioContext;
                window.audioContext && "suspended" === window.audioContext.state && window.audioContext.resume()
            }
            bgMusic.play().catch(e=>{
                console.warn("Không thể tự động phát nhạc:", e)
            }
            ),
            musicStarted = !0
        }
        fadeObjects.forEach(obj=>{
            obj && (obj.visible = !0,
            obj.traverse?.(child=>{
                const mat = child.material;
                mat && (child.material && void 0 === child.userData.baseOpacity && (child.userData.baseOpacity = child.material.opacity ?? 1),
                mat.opacity = 0)
            }
            ))
        }
        ),
        revealStart = clock.getElapsedTime(),
        cameraAnimationStart = clock.getElapsedTime(),
        userHasMovedCamera && (CAMERA_START_POSITION = {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
        })
    }
}
fadeObjects.push(streamHeart, shootingStars),
[streamHeart, shootingStars].forEach(obj=>{
    obj && (obj.visible = !1,
    obj.traverse?.(child=>{
        child.material && void 0 === child.userData.baseOpacity && (child.userData.baseOpacity = child.material.opacity ?? 1)
    }
    ))
}
),
renderer.domElement.addEventListener("click", activateEffects, {
    capture: !0
}),
renderer.domElement.addEventListener("touchstart", activateEffects, {
    passive: !0,
    capture: !0
});
let lastTouchEnd = 0;
document.addEventListener("touchend", function(event) {
    const now = (new Date).getTime();
    now - lastTouchEnd <= 300 && event.preventDefault(),
    lastTouchEnd = now
}, !1),
document.addEventListener("gesturestart", function(e) {
    e.preventDefault()
}, {
    passive: !1
}),
document.addEventListener("gesturechange", function(e) {
    e.preventDefault()
}, {
    passive: !1
}),
document.addEventListener("gestureend", function(e) {
    e.preventDefault()
}, {
    passive: !1
}),
animate(),
scene.add(staticBottomHeart),
[staticTopHeart].forEach(obj=>{
    obj && (obj.visible = !1,
    obj.userData.fadeStage = STAGE.HEART,
    fadeObjects.push(obj))
}
),
controls.addEventListener("change", ()=>{
    userHasMovedCamera || (CAMERA_START_POSITION = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
    },
    userHasMovedCamera = !0)
}
);
