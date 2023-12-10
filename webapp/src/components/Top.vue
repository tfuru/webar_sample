<template>
  <div class="top">    
    <div>
      <ol>
        <li v-for="camera in cameraList" :key="camera.deviceId">
          <p>{{ camera.label }}</p>
          <p>{{ camera.deviceId }}</p>
        </li>
      </ol>
    </div>
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
// hiroマーカー
// https://www.techpit.jp/courses/55/curriculums/58/sections/470/parts/1613

// AR.js Docs
// https://ar-js-org.github.io/AR.js-Docs/
//

// Back Camera on mobile
// https://github.com/jeromeetienne/AR.js/issues/86
// 

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

      loadCameraList();

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
      // const clock = new THREE.Clock();
      // const cube = createBox(scene, true);
      // scene.add(cube);

      // パネルを表示
      const plane = createPlane(scene, true); 
      scene.add(plane);

      canvasRef.value.appendChild(renderer.domElement);

      // 画面を更新
      const render = () => {
        requestAnimationFrame(render);
        
        if ((arToolkitSource) && (arToolkitSource.ready)) {
          arToolkitContext.update(arToolkitSource.domElement);
          scene.visible = camera.visible;
        }

        // キューブを回転させる
        // const delta = clock.getDelta();
        // cube.rotation.x += delta * 1.0;
        // cube.rotation.y += delta * 1.5; 

        renderer.render(scene, camera);
      }
      render();
    }
    
    const createBox = (scene: THREE.Scene, isAxesHelper: boolean) => {

      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.y = 1.0;
      
      // ギズモを表示
      if (isAxesHelper) {
        const axesBarLength = 5.0;
        const axesHelper = new THREE.AxesHelper(axesBarLength);
        cube.add(axesHelper);
      }
      return cube;
    }

    const createPlane = (scene: THREE.Scene, isAxesHelper: boolean) => {
      const geometry = new THREE.PlaneGeometry( 1, 1 );
      const material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );

      const plane = new THREE.Mesh( geometry, material );
      plane.rotation.x = -Math.PI / 2;

      // ギズモを表示
      if (isAxesHelper) {
        const axesBarLength = 5.0;
        const axesHelper = new THREE.AxesHelper(axesBarLength);
        plane.add(axesHelper);
      }

      return plane;
    }

    // カメラ一覧を取得
    var cameraList = ref<MediaDeviceInfo[]>([]);
    const loadCameraList = () => {
      console.log("loadCameraList");
      navigator.mediaDevices.enumerateDevices()
        .then((devices) => {
          devices.forEach((device) => {
            if (device.kind === "videoinput") {
              console.log(device.kind + ": " + device.label + " id = " + device.deviceId);
              cameraList.value.push(device);
            }
          });

          // 仮で カメラを選択
          var constraints = {
            video: {
              deviceId: { exact: cameraList.value[0].deviceId }
            }
          };
          navigator.mediaDevices
            .getUserMedia(constraints)
            .then((stream) => {
              arToolkitSource.domElement.srcObject = stream;
            })
            .catch((err) => {
              console.log(err.name + ": " + err.message);
            });
        })
        .catch((err) => {
          console.log(err.name + ": " + err.message);
        });
    }    

    onMounted(() => {
      console.log('mounted!')
      init();      
    });
    
    return {
      canvasRef,
      cameraList,
    }
  }
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">

ol {
  li {
    color: red;
  }
}
</style>
