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

    // レンダラー
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    // シーン
    const scene = new THREE.Scene();
    scene.visible = false;

    // カメラを追加 (視野角, アスペクト比, near, far)
    const camera = new THREE.Camera();
    scene.add(camera);

    // ARToolkit初期化
    var arToolkitContext: any;
    var arToolkitSource: any;
    var arMarkerControls: any;

    const getSourceOrientation = () => {
			if (!arToolkitSource) {
				return null;
			}

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

    const onResize = () => {
			arToolkitSource.onResizeElement()
			arToolkitSource.copyElementSizeTo(renderer.domElement)
			if (arToolkitContext.arController !== null) {
				arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas)
			}
		}

    // ARToolkitContext初期化
    const initARContext = () => {
      // create atToolkitContext
			arToolkitContext = new THREEx.ArToolkitContext({
				cameraParametersUrl: './camera_para.dat',
				detectionMode: 'mono'
			});

			// initialize it
			arToolkitContext.init(() => { // copy projection matrix to camera
				camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
				arToolkitContext.arController.orientation = getSourceOrientation();
				arToolkitContext.arController.options.orientation = getSourceOrientation();
			});

			// MARKER
			arMarkerControls = new THREEx.ArMarkerControls(arToolkitContext, camera, {
				type: 'pattern',
				patternUrl: './patt.hiro',
				changeMatrixMode: 'cameraTransformMatrix'
			});
			scene.visible = false
		}

    // ARToolkitContext初期化を実行
    arToolkitSource = new THREEx.ArToolkitSource({
        sourceType: 'webcam',
        sourceWidth: window.innerWidth > window.innerHeight ? 640 : 480,
        sourceHeight: window.innerWidth > window.innerHeight ? 480 : 640,
    });

    arToolkitSource.init(() => {
        initARContext();
        setTimeout(onResize, 2000);
      },
      (error: any) => {
        console.error(error);
      });
    
    // three.js 初期化
    const init = () => {
      console.log('init');
      if (canvasRef.value === null) {
        return;
      }
      
      renderer.setClearColor(new THREE.Color('lightgrey'), 0)
      renderer.setSize(640, 480);

      // ライトを追加
      const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
      scene.add( directionalLight );
      
      // キューブを表示
      const clock = new THREE.Clock();
      const cube = createBox(scene);
      scene.add(cube);

      canvasRef.value.appendChild(renderer.domElement);

      // 画面を更新
      const render = () => {
        requestAnimationFrame(render);
        
        if ((arToolkitSource) && (arToolkitSource.ready)) {
          arToolkitContext.update(arToolkitSource.domElement);
          scene.visible = camera.visible;
        }

        // キューブを回転させる
        const delta = clock.getDelta();
        cube.rotation.x += delta * 1.0;
        cube.rotation.y += delta * 1.5; 

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
      cube.position.y = 1.0;

      return cube;
    }

    onMounted(() => {
      console.log('mounted!')
      init();
    });
    
    return {
      canvasRef
    }
  }
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">

</style>
