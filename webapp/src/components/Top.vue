<template>
  <div class="top">
    <div ref="canvasRef"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import * as THREE from 'three'
import { THREEx, ARjs } from "@ar-js-org/ar.js-threejs"

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

// 参考 サイト
// 【Three.js×AR.js】マーカーありWebARを実装する
// https://webar-lab.palanar.com/news/threejs-arjs-marker/
// 
// AR.jsとthree.jsでMarker Based AR
// https://qiita.com/aa_debdeb/items/4edf6a2e053e02305ef5
//
// AR.js Docs
// https://ar-js-org.github.io/AR.js-Docs/

export default defineComponent({
  name: 'TopComponent',
  setup() {
    console.log("THREEx", THREEx);
    console.log(" ArToolkitContext.baseURL", THREEx.ArToolkitContext.baseURL);
    console.log("ARjs", ARjs);

    const canvasRef = ref<HTMLCanvasElement | null>(null);
    // シーン
    const scene = new THREE.Scene();

    // カメラを追加 (視野角, アスペクト比, near, far)
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1, -5);
    camera.rotation.set(0, Math.PI, 0);

    var arToolkitContext: any = null;
    var arMarkerControls: any = null;

    const arToolkitSource = new THREEx.ArToolkitSource({
          // to read from the webcam
          sourceType: 'webcam',
          sourceWidth: window.innerWidth > window.innerHeight ? 640 : 480,
          sourceHeight: window.innerWidth > window.innerHeight ? 480 : 640,
    });

    const getSourceOrientation = (arToolkitSource: any) => {
      if (!arToolkitSource) return '';

      console.log(
          'actual source dimensions',
          arToolkitSource.domElement.videoWidth,
          arToolkitSource.domElement.videoHeight
      );

      if (arToolkitSource.domElement.videoWidth > arToolkitSource.domElement.videoHeight) {
          console.log('source orientation', 'landscape');
          return 'landscape';
      } else {
          console.log('source orientation', 'portrait');
          return 'portrait';
      }
    }

    const initARContext = () => {
      console.log('initARContext');
      arToolkitContext = new THREEx.ArToolkitContext({
        cameraParametersUrl: "./camera_para.dat",
        detectionMode: 'mono',
        debug: true,
      });

      // initialize it
      arToolkitContext.init(() => { // copy projection matrix to camera
          camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());

          arToolkitContext.arController.orientatio = getSourceOrientation(arToolkitSource);
          arToolkitContext.arController.options.orientation = getSourceOrientation(arToolkitSource);

          console.log('arToolkitContext', arToolkitContext);
      });

      // MARKER
      arMarkerControls = new THREEx.ArMarkerControls(arToolkitContext, camera, {
          type: 'pattern',
          patternUrl: './patt.hiro',
          changeMatrixMode: 'cameraTransformMatrix',
      });

      arMarkerControls.addEventListener("markerFound", () => {
        // マーカーが見つかっている時は毎秒呼ばれる
        console.log("marker found");
      });
    }

    const onResize = (renderer: THREE.WebGLRenderer, arToolkitSource: any, arToolkitContext: any ) => {
      console.log('onResize');
      arToolkitSource.onResizeElement();
      arToolkitSource.copyElementSizeTo(renderer.domElement);
      if (arToolkitContext.arController !== null) {
        arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
      }      
    }

    const init = () => {
      console.log('init');
      if (canvasRef.value === null) {
        return;
      }
      // three.js 初期化
      const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true
      });

      // ライトを追加
      const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
      scene.add( directionalLight );

      // AR.js 初期化
      arToolkitSource.init(
        () => {
          console.log('onReady');
          arToolkitSource.domElement.addEventListener('canplay', () => {
                console.log(
                    'canplay',
                    'actual source dimensions',
                    arToolkitSource.domElement.videoWidth,
                arToolkitSource.domElement.videoHeight,
          );
          initARContext();
          }) as unknown as HTMLVideoElement;          
        
          setTimeout(() => { 
            onResize(renderer, arToolkitSource, arToolkitContext); 
          }, 2000);
        }, 
        () => {
          console.log('error');
        }
      );
      
      createBox(scene);

      renderer.setSize(window.innerWidth, window.innerHeight);
      canvasRef.value.appendChild(renderer.domElement);

      const render = () => {
        requestAnimationFrame(render);
        renderer.render(scene, camera);
      }
      render();
    }
    
    const createBox = (scene: THREE.Scene) => {
      // ギズモを表示
      const axesBarLength = 5.0;
      const axesHelper = new THREE.AxesHelper(axesBarLength);
      scene.add(axesHelper);

      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
    }

    onMounted(() => {
      console.log('mounted!')
      init();

    })
    
    return {
      canvasRef
    }
  }
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">

</style>
