import * as THREE from 'three';

// 조명, 컨트롤, gltf로더
import { RoomEnvironment } from './jsm/environments/RoomEnvironment.js';
import { OrbitControls } from './jsm/controls/OrbitControls.js';
import { GLTFLoader } from './jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from './jsm/loaders/DRACOLoader.js';
import { ViewHelper } from './jsm/helpers/ViewHelper.js';

// // Outline 관련 라이브러리
// import { EffectComposer } from '../node_modules/three/examples/jsm/postprocessing/EffectComposer.js';
// import { RenderPass } from '../node_modules/three/examples/jsm/postprocessing/RenderPass.js';
// import { OutlinePass } from '../node_modules/three/examples/jsm/postprocessing/OutlinePass.js';

// // Geometry 메쉬 단순화 라이브러리
//import { SimplifyModifier } from './jsm/modifiers/SimplifyModifier.js'


// User Components
import TextSprite from './lib/TextSprite.js';
import { OrbitControlsGizmo } from "./lib/OrbitControlsGizmo.js";
import { SimplifyModifier } from "./lib/SimplifyModifier.js";

class App {
    constructor() {
        this.init();
    }

    init() {

        this.setCreateHtml();
        this.setIconPath();

        this.renderer, this.camera, this.scene, this.sceneSub, this.controls, this.helper, this.controlsGizmo, this.axesGizmo, this.stats, this.renderTarget, this.sceneFix;
        this.sceneFirstLoad = true;
        this.cameraPosition = new THREE.Vector3();

        this.selectedObjects = [];
        this.nodeStates = {}; // 각 노드의 상태(펼쳐진 상태 또는 접힌 상태)를 저장하는 객체
        this.loadedModel = null;
        this.sidebarContainer = document.getElementById('sidebar')
        this.activeScene = this.scene;
        this.objectsToRemove = [];

        this.originalMaterials = new Map();
        this.previousMaterials = new Map();

        this.pointer = new THREE.Vector2();
        this.labelposition = new THREE.Vector3();
        this.raycaster = new THREE.Raycaster();
        this.boundingBox = new THREE.Box3();
        this.center = new THREE.Vector3();
        this.axesLength = null;
        this.ignoreClick = false;


        // 디멘젼 관련
        this.dim_select = false;
        this.first_dim = new THREE.Vector3();
        this.second_dim = new THREE.Vector3();
        this.clickedObjects = [];
        this.dimensionAxes;

        // mtp 데이타
        this.mtpDataList = [];

        // autoDimension 데이타
        this.autoDimensionData = [];
        this.autoDimLinesOfObjName = {};

        // Dimenstion 데이타
        this.DimensionData = [];
        this.DimensionPointData = [];
        this.intersectPoint = new THREE.Vector3();
        this.distancePlane = [];

        // 심볼
        this.clickableDimSymbols = [];
        this.currentHovered = null;

        this.axesPanel = document.getElementById('dimensionAxesSelectPanel');


        this.attributeZone = document.getElementById("attribute-Zone");
        this.attributeInner = document.getElementById("attribute-inner");
        this.dataList = [];
        this.dataRow = {};
        this.dataList_Block = [];

        this.partlistZone = document.getElementById("partlist-Zone");
        this.partListInner = document.getElementById("partList-inner");
        //this.partList_All = []; // 전체 partList
        //this.partList_select = []; // 선택한 object의 partList
        this.partList_SUM = {}; // 선택한 object 최종 Sum


        // New DataBase Connect 
        this.attributeDataWithObjName = [];
        this.partListDataWithObjParentName = [];

        this.sceneObjects = [];


        this.setupRenderer();
        this.setupScene();
        this.setupCamera();
        this.setupDirectionalLight();
        this.setResizerHtml();


        this.setOutlineEffect();
        this.setupControls();
        this.setupEventListeners();
        this.setupBtnClickSearch();
        this.ServerConnect();
        this.setupGrid();

        //this.setupViewHelper();
        this.Render();

    }

    async fetchWithTimeout(url, timeout = 3000) { // 30초 타임아웃
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(id);

        //console.log('완료')
        return response;
    }

    async ServerConnect() {

        try {

            // 의장 데이터
            //const siteResponse = await this.fetchWithTimeout('http://192.168.10.32:5501/src/blocks/getSiteData');
            //this.dataList = await siteResponse.json();
            //console.log(this.dataList);

            // 선체 데이터
            //const blockResponse = await this.fetchWithTimeout('http://192.168.10.32:5501/src/blocks/getBlockData');
            //this.dataList_Block = await blockResponse.json();
            //console.log(this.dataList_Block);

            // 오토 디멘젼 (4point)데이터
            const dimensionResponse = await this.fetchWithTimeout('http://43.202.236.145:5501/src/blocks/readDimension');
            this.DimensionData = await dimensionResponse.json();
            //console.log(this.DimensionData);

            // 사용자 디멘젼 (2point) 데이터
            const dimensionPointResponse = await this.fetchWithTimeout('http://43.202.236.145:5501/src/blocks/readDimensionPointList');
            this.DimensionPointData = await dimensionPointResponse.json();
            //console.log(this.DimensionPointData);

        }
        catch (error) {
            console.error("Error fetching data:", error);

        }
        // // 의장
        // fetch('http://localhost:5501/src/blocks/getSiteData')
        //     .then(data => {
        //         return data.json()
        //     })
        //     .then(res => {
        //         this.dataList = [];
        //         this.dataList = res;
        //         console.log(this.dataList);
        //     })

        //     // 선체 데이터
        // fetch('http://localhost:5501/src/blocks/getBlockData')
        // .then(data => {
        //     return data.json()
        // })
        // .then(res => {
        //     this.dataList_Block = [];
        //     this.dataList_Block = res;
        //     console.log(this.dataList_Block);
        // })

        // //서버로 파일 이름 전송
        // fetch('http://localhost:5501/src/blocks/readDmp')
        //     .then(data => {
        //         return data.json()
        //     })
        //     .then(res => {
        //         this.mtpDataList = [];
        //         this.mtpDataList = res;
        //         //console.log(this.mtpDataList);
        //     })

        // //
        // // fetch('http://localhost:5501/src/blocks/readAutoDimension')
        // //     .then(data => {
        // //         return data.json()
        // //     })
        // //     .then(res => {
        // //         this.autoDimensionData = [];
        // //         this.autoDimensionData = res;
        // //         //console.log(this.autoDimensionData);
        // //     })

        // // 디멘젼 데이타 (4포인트로 오토디멘젼 생성)
        // fetch('http://localhost:5501/src/blocks/readDimension')
        //     .then(data => {
        //         return data.json()
        //     })
        //     .then(res => {
        //         this.DimensionData = [];
        //         this.DimensionData = res;
        //         //console.log(this.DimensionData);
        //     })

        // // 디멘젼 포인트 (심볼 생성해서 찍어서 디멘젼 생성할 때)
        // fetch('http://localhost:5501/src/blocks/readDimensionPointList')
        //     .then(data => {
        //         return data.json()
        //     })
        //     .then(res => {
        //         this.DimensionPointData = [];
        //         this.DimensionPointData = res;
        //         //console.log(this.DimensionPointData);
        //     })

    }

    setCreateHtml() {

        this.setSidebarHtml();
        this.setAttributeHtml();
        this.setPartlistHtml();
        //this.setResizerHtml();
    }

    // 아이콘 경로 설정
    setIconPath() {
        this.BaseIconPath = './Resource/Image/BASE_Icon/';
        this.STIE_IconPath = './Resource/Image/LEV_Icon/LEV_SITE/';

        this.STIE_PIPE_IconPath = './Resource/Image/LEV_Icon/LEV_SITE/LEV_PIPE/';
        this.STIE_EQUIP_IconPath = './Resource/Image/LEV_Icon/LEV_SITE/LEV_EQUIP/';
        this.STIE_ELECT_IconPath = './Resource/Image/LEV_Icon/LEV_SITE/LEV_ELECT/';
        this.STIE_HVAC_IconPath = './Resource/Image/LEV_Icon/LEV_SITE/LEV_HVAC/';
        this.STIE_OUTSTL_IconPath = './Resource/Image/LEV_Icon/LEV_SITE/LEV_OUTSTL/';


        this.BLOCK_IconPath = './Resource/Image/LEV_Icon/LEV_BLOCK/';

        this.arrowImagePath = this.BaseIconPath + 'minusArrow.png';
        this.visibleImagePath = this.BaseIconPath + 'visible.png';
        this.invisibleImagePath = this.BaseIconPath + 'invisible.png';

        this.dimensionImagePath = this.BaseIconPath + 'dimension_new.png';

        //------------------------------------------------------------------
        this.WORLD_icon = this.STIE_IconPath + 'LEV_WORLD.png';

        //------------------------------------------------------------------
        this.SITE_icon = this.STIE_IconPath + 'LEV_SITE.png';
        this.ZONE_icon = this.STIE_IconPath + 'LEV_ZONE.png';

        // PIPE
        //------------------------------------------------------------------
        this.PIPE_icon = this.STIE_PIPE_IconPath + 'LEV_PIPE.png';
        this.BRANCH_icon = this.STIE_PIPE_IconPath + 'LEV_BRANCH.png';
        this.TUBI_icon = this.STIE_PIPE_IconPath + 'LEV_TUBI.png';
        this.FLANGE_icon = this.STIE_PIPE_IconPath + 'LEV_FLANGE.png';
        this.REDU_icon = this.STIE_PIPE_IconPath + 'LEV_REDUCER.png';
        this.ELBO_icon = this.STIE_PIPE_IconPath + 'LEV_ELBO.png';
        this.COUP_icon = this.STIE_PIPE_IconPath + 'LEV_COUPLING.png';
        this.VALVE_icon = this.STIE_PIPE_IconPath + 'LEV_VALVE.png';
        this.BEND_icon = this.STIE_PIPE_IconPath + 'LEV_BEND.png';
        this.TEE_icon = this.STIE_PIPE_IconPath + 'LEV_TEE.png';

        // EQUIP
        //------------------------------------------------------------------
        this.EQUIP_icon = this.STIE_EQUIP_IconPath + 'LEV_EQUIP.png';
        this.TMPLATE_icon = this.STIE_EQUIP_IconPath + 'LEV_TMPLATE.png';
        this.NOZZ_icon = this.STIE_EQUIP_IconPath + 'LEV_NOZZ.png';
        this.GENSEC_icon = this.STIE_EQUIP_IconPath + 'LEV_GENSEC.png';
        this.EXTR_icon = this.STIE_EQUIP_IconPath + 'LEV_EXTRUSION.png';
        this.ELCONN_icon = this.STIE_EQUIP_IconPath + 'LEV_ELCONN.png';
        this.DISH_icon = this.STIE_EQUIP_IconPath + 'LEV_DISH.png';
        this.CYLI_icon = this.STIE_EQUIP_IconPath + 'LEV_CYLI.png';
        this.CTOR_icon = this.STIE_EQUIP_IconPath + 'LEV_CTOR.png';
        this.CONE_icon = this.STIE_EQUIP_IconPath + 'LEV_CONE.png';
        this.BOX_icon = this.STIE_EQUIP_IconPath + 'LEV_BOX.png';
        this.SUBE_icon = this.STIE_EQUIP_IconPath + 'LEV_SUBE.png';
        this.REVOL_icon = this.STIE_EQUIP_IconPath + 'LEV_REVOLUTION.png';

        // ELECT
        //------------------------------------------------------------------
        //this.ELECT_icon = this.STIE_IconPath + 'LEV_ELECT.png';
        this.CTRAY_icon = this.STIE_ELECT_IconPath + 'LEV_CTRAY.png';
        //this.SCTN_icon = this.STIE_ELECT_IconPath + 'LEV_SCTN.png';

        // HVAC
        //------------------------------------------------------------------
        this.HVAC_icon = this.STIE_HVAC_IconPath + 'LEV_HVAC.png';
        this.BRCO_icon = this.STIE_HVAC_IconPath + 'LEV_BRCO.png';
        this.CAP_icon = this.STIE_HVAC_IconPath + 'LEV_CAP.png';
        this.IDAM_icon = this.STIE_HVAC_IconPath + 'LEV_IDAM.png';
        this.MESH_icon = this.STIE_HVAC_IconPath + 'LEV_MESH.png';
        this.OFST_icon = this.STIE_HVAC_IconPath + 'LEV_OFST.png';
        this.STIFF_icon = this.STIE_HVAC_IconPath + 'LEV_STIF.png';
        this.STRT_icon = this.STIE_HVAC_IconPath + 'LEV_STRT.png';
        this.TAPER_icon = this.STIE_HVAC_IconPath + 'LEV_TAPER.png';
        this.THREEWAY_icon = this.STIE_HVAC_IconPath + 'LEV_THRE.png';
        this.TRNS_icon = this.STIE_HVAC_IconPath + 'LEV_TRNS.png';
        this.DAMP_icon = this.STIE_HVAC_IconPath + 'LEV_DAMP.png';
        this.HFAN_icon = this.STIE_HVAC_IconPath + 'LEV_HFAN.png';



        // OUTSTEEL
        //------------------------------------------------------------------
        this.STRU_icon = this.STIE_OUTSTL_IconPath + 'LEV_STRU.png';
        this.FRMW_icon = this.STIE_OUTSTL_IconPath + 'LEV_FRMW.png';
        this.SCTN_icon = this.STIE_OUTSTL_IconPath + 'LEV_SCTN.png';
        this.PANEL_icon = this.STIE_OUTSTL_IconPath + 'LEV_PANEL.png';
        this.SBFR_icon = this.STIE_OUTSTL_IconPath + 'LEV_SBFR.png';



        // BLOCK
        //------------------------------------------------------------------
        this.BLOCK_icon = this.BLOCK_IconPath + 'LEV_BLOCK.png';

        this.CPANEL_icon = this.BLOCK_IconPath + 'LEV_CPANEL.png';
        this.CPLATE_icon = this.BLOCK_IconPath + 'LEV_CPLATE.png';
        this.HPANEL_icon = this.BLOCK_IconPath + 'LEV_HPANEL.png';
        this.HPLATE_icon = this.BLOCK_IconPath + 'LEV_HPLATE.png';
        this.HPANBO_icon = this.BLOCK_IconPath + 'LEV_HPANBO.png';
        this.HSTIFF_icon = this.BLOCK_IconPath + 'LEV_HSTIFF.png';
        this.HPREND_icon = this.BLOCK_IconPath + 'LEV_HPREND.png';
        this.HCLIP_icon = this.BLOCK_IconPath + 'LEV_HCLIP.png';
        this.HCTOUT_icon = this.BLOCK_IconPath + 'LEV_HCTOUT.png';
        this.HCURVE_icon = this.BLOCK_IconPath + 'LEV_HCURVE.png';
        this.HHOLE_icon = this.BLOCK_IconPath + 'LEV_HHOLE.png';
        this.HPRNOT_icon = this.BLOCK_IconPath + 'LEV_HPRNOT.png';
        this.HSEAM_icon = this.BLOCK_IconPath + 'LEV_HSEAM.png';
        this.HBRCKT_icon = this.BLOCK_IconPath + 'LEV_HBRCKT.png';
        this.HFLANG_icon = this.BLOCK_IconPath + 'LEV_HFLANG.png';
        this.HPILLR_icon = this.BLOCK_IconPath + 'LEV_HPILLR.png';

    }

    setSidebarHtml() {

        const searchField = document.getElementById('search');

        //-------------------------------------------------------
        const searchArea = document.createElement('div');
        searchArea.classList.add('search-area');

        const searchValue = document.createElement('input');
        searchValue.setAttribute('id', 'search-value');
        searchValue.type = 'text';
        searchValue.placeholder = '검색어를 입력하세요.';

        const searchIcon = document.createElement('span');
        searchIcon.setAttribute('id', 'search-icon');

        searchArea.appendChild(searchValue);
        searchArea.appendChild(searchIcon);

        //-------------------------------------------------------
        const btnSearchPost = document.createElement('div');
        btnSearchPost.setAttribute('id', 'btn-search-post');

        const seartButton = document.createElement('button');
        seartButton.setAttribute('id', 'search-button');
        seartButton.innerHTML = "검색";

        btnSearchPost.appendChild(seartButton);

        //-------------------------------------------------------
        searchField.appendChild(searchArea);
        searchField.appendChild(btnSearchPost);
    }

    setAttributeHtml() {
        const attributeZone = document.getElementById('attribute-Zone');

        const attributePanel = document.createElement("div");
        attributePanel.setAttribute('id', 'attribute-panel');
        attributePanel.classList.add('defalut-panel');

        const attributeTitle = document.createElement("div");
        attributeTitle.setAttribute('id', 'attribute-title');
        attributeTitle.innerHTML = "속성";

        const attributeInner = document.createElement("div");
        attributeInner.setAttribute('id', 'attribute-inner');

        attributePanel.appendChild(attributeTitle);
        attributePanel.appendChild(attributeInner);

        attributeZone.appendChild(attributePanel);
        attributeZone.style.display = 'none';
    }

    setPartlistHtml() {
        //this.partlistZone = document.getElementById('partlist-Zone');

        const partlistZone = document.getElementById('partlist-Zone');

        const partListPanel = document.createElement("div");
        partListPanel.setAttribute('id', 'partList-panel');
        //partListPanel.classList.add('defalut-panel');

        const partListTitle = document.createElement("div");
        partListTitle.setAttribute('id', 'partList-title');
        partListTitle.innerHTML = "파트리스트";

        const partListInner = document.createElement("div");
        partListInner.setAttribute('id', 'partList-inner');

        partListPanel.appendChild(partListTitle);
        partListPanel.appendChild(partListInner);

        partlistZone.appendChild(partListPanel);
        partlistZone.style.display = 'none';


        const colorPickerPanel = document.getElementById('color-picker');
        colorPickerPanel.style.display = 'none';
    }

    // Resizer 움직임에 따라 판넬 크기 조절
    setResizerHtml() {
        const resizer = document.getElementById('resizer');
        const leftSide = resizer.previousElementSibling;
        const rightSide = resizer.nextElementSibling;
        // partlistZone
        //const partlistPosition = document.getElementById('PartList')

        let x = 0;
        let y = 0;

        let leftWidth = 0;

        const mouseDownHandler = function (e) {
            // 마우스 위치값을 가져와 x, y에 할당
            x = e.clientX;
            y = e.clientY;
            // left Element에 Viewport 상 width 값을 가져와 넣음
            leftWidth = leftSide.getBoundingClientRect().width;

            // 마우스 이동과 해제 이벤트를 등록
            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', mouseUpHandler);
        };
        const mouseMoveHandler = (e) => {
            // 마우스가 움직이면 기존 초기 마우스 위치에서 현재 위치값과의 차이를 계산
            const dx = e.clientX - x;
            const dy = e.clientY - y;

            // 크기 조절 중 마우스 커서를 변경함
            // class="resizer"에 적용하면 위치가 변경되면서 커서가 해제되기 때문에 body에 적용
            document.body.style.cursor = 'col-resize';

            // 이동 중 양쪽 영역(왼쪽, 오른쪽)에서 마우스 이벤트와 텍스트 선택을 방지하기 위해 추가
            leftSide.style.userSelect = 'none';
            leftSide.style.pointerEvents = 'none';

            rightSide.style.userSelect = 'none';
            rightSide.style.pointerEvents = 'none';

            // 초기 width 값과 마우스 드래그 거리를 더한 뒤 상위요소(container)의 너비를 이용해 퍼센티지를 구함
            // 계산된 퍼센티지는 새롭게 left의 width로 적용
            const newLeftWidth = (leftWidth + dx)

            //console.log(newLeftWidth);

            if (300 <= newLeftWidth && newLeftWidth <= 600) {

                leftSide.style.width = `${newLeftWidth}px`;
                resizer.style.left = `${newLeftWidth + 10}px`;
                this.container.style.left = `${newLeftWidth + 16}px`;
                //this.partlistZone.style.left = 0;
            }


            //this.OnWindowResize();
            this.Render();
        };


        const mouseUpHandler = () => {
            // 모든 커서 관련 사항은 마우스 이동이 끝나면 제거됨
            resizer.style.removeProperty('cursor');
            document.body.style.removeProperty('cursor');

            leftSide.style.removeProperty('user-select');
            leftSide.style.removeProperty('pointer-events');

            rightSide.style.removeProperty('user-select');
            rightSide.style.removeProperty('pointer-events');

            // 등록한 마우스 이벤트를 제거
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);

            this.Render();

        };

        // 마우스 down 이벤트를 등록
        resizer.addEventListener('mousedown', mouseDownHandler);
    }

    // 렌더러
    setupRenderer() {

        this.container = document.getElementById('viewer-container');

        //this.renderTarget = new THREE.WebGLRenderTarget(this.container.clientWidth, this.container.clientHeight);

        this.renderer = new THREE.WebGLRenderer({
            powerPreference: "high-performance",
            stencil: false,
            //depth: false,
            antialias: true,
            logarithmicDepthBuffer: true
            //alpha: true 
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.toneMapping = THREE.CineonToneMapping;
        this.renderer.toneMappingExposure = 1;
        this.renderer.gammaFactor = 2.2;
        this.renderer.outputEncoding = THREE.LinearEncoding;
        //this.renderer.setViewport;
        this.renderer.clearDepth();
        //this.renderer.shadowMap.enabled = false;


        this.container.appendChild(this.renderer.domElement);

    }

    // 아웃라인 관련
    setOutlineEffect() {
        // EffectComposer 생성
        //this.composer = new EffectComposer(this.renderer);

        //         const depthPass = new DepthPass(this.scene, this.camera);
        //         depthPass.renderToScreen = false;

        //         const depthTexture = depthPass.texture;
        //         depthTexture.wrapS = THREE.RepeatWrapping;
        //         depthTexture.wrapT = THREE.RepeatWrapping;
        //         depthTexture.generateMipmaps = false;
        //         depthTexture.magFilter = THREE.NearestFilter;
        //         depthTexture.minFilter = THREE.NearestFilter;

        //         const mat = new THREE.ShaderMaterial(...);

        // mat.uniforms.tDepth = { value: depthTexture };
        // mat.uniforms.iResolution = {
        //   value: new THREE.Vector2(viz.renderer.domElement.width, viz.renderer.domElement.height),};

    }

    // 씬에 dmp Grid 추가
    async setupGrid() {

        //dmp 그리드 데이터
        const readDmpResponse = await this.fetchWithTimeout('http://43.202.236.145:5501/src/blocks/readDmp');
        this.mtpDataList = await readDmpResponse.json();
        //console.log(this.mtpDataList);

        // var xhr = new XMLHttpRequest();
        // xhr.open('GET', 'http://192.168.10.32:5501/src/blocks/readDmp', true);
        // xhr.send();

        // xhr.onload = function () {
        //     if (xhr.status >= 200 && xhr.status < 300) {
        //         this.mtpDataList = JSON.parse(xhr.responseText);
        //         // 서버에서 받은 데이터(responseData)를 처리합니다.

        //         console.log('xmlhttp', this.mtpDataList);
        //     } else {
        //         console.error('Request failed with status:', xhr.status);
        //     }
        // };
        // xhr.onerror = function () {
        //     console.error('Request failed');
        // };

    }

    setupViewHelper() {

        this.helper = new ViewHelper(this.camera, this.renderer.domElement);
        this.helper.controls = this.controls;
        this.helper.controls.center = this.controls.target;
        this.helper.update();

        this.scene.add(this.helper);

        const viewerContainer = document.getElementById('viewer-container')

        const div = document.createElement('div');
        div.id = 'viewHelper';
        div.style.position = 'absolute';
        div.style.right = 0;
        div.style.bottom = 0;
        div.style.height = '128px';
        div.style.width = '128px';
        div.style.zIndex = 1;


        viewerContainer.appendChild(div);

        div.addEventListener('pointerup', (event) => this.helper.handleClick(event));


    }

    // 씬 생성 관련
    setupScene() {
        this.scene = new THREE.Scene();

        const environment = new RoomEnvironment(this.renderer);
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        this.scene.background = new THREE.Color(0x888888);
        this.scene.environment = pmremGenerator.fromScene(environment).texture;


        this.sceneSub = new THREE.Scene();
        this.sceneSub.background = new THREE.Color(0x888888);
        this.sceneSub.environment = pmremGenerator.fromScene(environment).texture;

        pmremGenerator.dispose();

        // var canvas = document.getElementById('axespanel');
        // canvas.style.position = 'fixed'
        // canvas.style.right = '0px'
        // canvas.style.bottom = '0px'

        // var viewHelper = new ViewHelperBase(this.camera, canvas);

        // this.scene.add(viewHelper);
    }

    // 카메라 생성 관련
    setupCamera() {

        this.perspectiveCamera = new THREE.PerspectiveCamera(45, this.container.clientWidth / this.container.clientHeight, 0.01, 10000);
        //this.orthographicCamera = new THREE.OrthographicCamera(this.container.clientWidth / -2, this.container.clientWidth / 2, this.container.clientHeight / 2, this.container.clientHeight / -2, 0.01, 10000);
        this.camera = this.perspectiveCamera;
        //this.camera.updateProjectionMatrix();

        if (!this.container) {
            console.error("Container not defined.");
            return;
        }

        this.camera.position.set(32, 32, 32);
        //this.camera.up.set(0, 1, 0); // 카메라의 위쪽 방향을 Y축으로 설정

    }

    // 카메라 OrbitCOntrols 관련
    setupControls() {

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);


        this.controls.addEventListener('change', () => {
            // event.preventDefault();

            // 회전 중에는 클릭 이벤트를 무시
            this.ignoreClick = true;

            this.Render();
        });

        this.controls.addEventListener('end', () => {
            // 클릭 이벤트를 무시한 후 일정 시간이 지나면 플래그를 다시 false로 설정
            setTimeout(() => {
                this.ignoreClick = false;
            }, 50); // 적절한 시간(ms)을 설정하세요.
        });

        this.controls.zoomSpeed = 2; // 줌 속도 증가
        this.controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
        this.controls.dampingFactor = 0.1;
        this.controls.maxPolarAngle = Math.PI / 0.5;
        this.controls.target.set(0, 0, 0);
        this.controls.screenSpacePanning = true;
        this.controls.minDistance = 0;
        this.controls.maxDistance = 1000;
        this.controls.update();
        // this.controls.minDistance = 1;
        //          this.controls.maxDistance = 100;
        //console.log('control set');



        // this.Render();
        this.controlsGizmo = new OrbitControlsGizmo(this.controls, { size: 100, padding: 8 });
        this.container.appendChild(this.controlsGizmo.domElement);
        //this.controlsGizmo.update(); // Gizmo의 시각적 요소를 업데이트합니다.

        //     const axesGizmo = new DimensionAxesGizmo(this.controls, { size: 100, padding: 8, className: "dimension-Gizmo" });
        //     this.axesPanel.appendChild(axesGizmo.domElement);

        //     axesGizmo.addEventListener('axisSelected', function(event){
        //         console.log('ddd')
        //         console.log("Selected axis:", event.target);
        //         console.log("Selected axis:", event.detail.axis);

        //    });

        //console.log(axesGizmo);

        //console.log('gizmo dom 추가완료')

    }

    // 씬에 조명 추가
    setupDirectionalLight() {
        // const directionalLight = new THREE.DirectionalLight(0x000000, 100); // 흰색 빛과 강도 0.5로 설정
        // directionalLight.position.set(10, 10, 10).normalize();

        // const ambientLight = new THREE.AmbientLight(0x000000, 100); // 주변광, 어둡게 만들기 위한 회색 빛
        // this.scene.add(ambientLight);

        this.scene.add(new THREE.AmbientLight(0x222222));

        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(20, 20, 0);
        this.scene.add(light);
    }

    // 이벤트 리스닝 세팅
    setupEventListeners() {

        // 렌더링 화면에서 마우스 이벤트
        // -----------------------------------------------------------------------------------------------
        this.container.addEventListener('pointermove', this.onPointerMove.bind(this));

        this.container.addEventListener('mouseup', this.onMouseClick.bind(this));
        //this.container.addEventListener('touchstart', this.onMouseClick.bind(this));
        this.container.addEventListener('touchstart', this.onMouseClick.bind(this));



        //this.container.addEventListener('touch', this.onMouseClick.bind(this));

        this.container.addEventListener('mousemove', this.onMouseMove.bind(this))
        //this.container.addEventListener('touchmove', this.onMouseMove.bind(this));

        // -----------------------------------------------------------------------------------------------


        // 윈도우 사이즈 조절시 이벤트
        // -----------------------------------------------------------------------------------------------
        window.addEventListener('resize', this.OnWindowResize.bind(this));
        // -----------------------------------------------------------------------------------------------

        // 키보드 클릭 이벤트
        document.addEventListener('keydown', (event) => {
            // event.key를 사용하여 어떤 키가 눌렸는지 확인합니다.
            if (event.key === "Escape") { // ESC 키의 event.key 값은 "Escape"입니다.

                this.ResetDimensionSettings();
            }
        });



        //console.log('이벤트 리스너 추가완료')
        // New 버튼 클릭시 FileNewScene() 함수 실행
        // -----------------------------------------------------------------------------------------------
        const newButton = document.getElementById('new-button');
        newButton.addEventListener('click', this.FileNewScene.bind(this));
        // -----------------------------------------------------------------------------------------------


        // Import 버튼 클릭시 input 태그 통해 FileImport() 함수 실행
        // -----------------------------------------------------------------------------------------------
        // const fileInput = document.getElementById('file-input');
        // const fileButton = document.getElementById("file-button");

        // fileButton.addEventListener('click', function () {
        //     fileInput.value = '';
        //     fileInput.click();
        // });

        // fileInput.addEventListener('change', this.FileImport.bind(this));

        const gltfLoad = document.getElementById('load-gltf');
        gltfLoad.addEventListener('click', this.GltfLoad.bind(this));
        // -----------------------------------------------------------------------------------------------
        // 툴바 이벤트
        // 서버 버튼 클릭시 이벤트
        // -----------------------------------------------------------------------------------------------
        // const serverButton = document.getElementById('server-connect');
        // serverButton.addEventListener('click', this.ServerConnect.bind(this));
        // 오토디멘젼 버튼 클릭시 이벤트
        // -----------------------------------------------------------------------------------------------
        const autoDimensionButton = document.getElementById('autoDimension-button');
        autoDimensionButton.addEventListener('click', this.AutoDimensionButton.bind(this));

        // 측정 버튼 클릭시 이벤트
        // -----------------------------------------------------------------------------------------------
        const dimensionButton = document.getElementById('dimension-button');
        dimensionButton.addEventListener('click', this.DimensionButton.bind(this));

        // 노트 버튼 클릭시 이벤트
        // -----------------------------------------------------------------------------------------------
        const noteButton = document.getElementById('note-button');
        noteButton.addEventListener('click', this.AddNote.bind(this));


        // -----------------------------------------------------------------------------------------------
        // 속성 이벤트
        // 속성 버튼 클릭시 이벤트
        // -----------------------------------------------------------------------------------------------
        const attributeButton = document.getElementById('attribute-button');
        attributeButton.addEventListener('click', this.AttributePanelChk.bind(this));


        // 파트리스트 버튼 클릭시 이벤트
        // -----------------------------------------------------------------------------------------------
        // const partListButton = document.getElementById('partList-button');
        // partListButton.addEventListener('click', this.PartListPanelChk.bind(this));


        // 색상변경 버튼 클릭시 이벤트
        // -----------------------------------------------------------------------------------------------
        const colorPanelButton = document.getElementById('color-button');
        colorPanelButton.addEventListener('click', this.ColorPanelChk.bind(this));

        // 색상 선택시 이벤트
        // -----------------------------------------------------------------------------------------------
        const colorPicker = document.getElementsByClassName('color-list');
        for (let i = 0; i < colorPicker.length; i++) {
            colorPicker[i].addEventListener('click', this.ColorPicker.bind(this));
        }


        // 원근평행 버튼 클릭시 이벤트
        // -----------------------------------------------------------------------------------------------
        // const perspectiveButton = document.getElementById('perspectiveBtn-button');
        // perspectiveButton.addEventListener('click', this.CameraChange.bind(this));
        var customPanel = document.getElementById("customPanel");

        customPanel.addEventListener('click', function (event) {
            if (!customPanel.contains(event.target)) {
                customPanel.style.display = 'none';
            }
        });
    }

    resetSidebar() {
        // sidebar 초기화
        this.sidebarContainer.innerHTML = '';
        //console.log('사이드바 초기화')

        // nodeStates 초기화
        this.nodeStates = {};

        // scene의 object 담는 배열
        this.sceneObjects = [];
    }

    resetSelectObj() {

        //console.log('reset');
        this.selectedObjects = [];

    }


    // New 버튼 클릭 및 scene 초기화
    FileNewScene() {

        // 제거해야 할 요소를 추적하는 배열을 생성합니다.
        const elementsToRemove = [];

        // 로드된 모델 제거
        if (this.loadedModel) {
            elementsToRemove.push(this.loadedModel);
            this.loadedModel.traverse(child => {
                if (child.isMesh) {
                    child.geometry.dispose();
                    child.material.dispose();
                }
            });
        }

        // 로드된 모델 제거
        this.scene.children.forEach(child => {
            this.scene.remove(child);
        })



        // scene 객체 제거 --------------------------------------------------
        // 그리드 및 라인 제거
        this.scene.children.forEach(child => {
            if (child.isLine) {
                elementsToRemove.push(child);
            }
        });

        // 라벨(Label) 제거
        this.scene.children.forEach(child => {
            if (child instanceof TextSprite) {
                elementsToRemove.push(child);
            }
        });

        // AxesHelper 제거
        this.scene.children.forEach(child => {
            if (child instanceof THREE.AxesHelper) {
                elementsToRemove.push(child);
            }
        });

        // BoxHelper 제거
        this.scene.children.forEach(child => {
            if (child instanceof THREE.BoxHelper) {
                elementsToRemove.push(child);
            }
        });

        // 그리드 및 라인 제거
        this.scene.children.forEach(child => {
            if (child.name === 'arrow') {
                elementsToRemove.push(child);
            }
        });

        // sceneSub 객체 제거 --------------------------------------------------

        // 로드된 모델 제거
        this.sceneSub.children.forEach(child => {
            this.sceneSub.remove(child);
        })


        // 그리드 및 라인 제거
        this.sceneSub.children.forEach(child => {
            if (child.isLine) {
                elementsToRemove.push(child);
            }
        });

        // 라벨(Label) 제거
        this.sceneSub.children.forEach(child => {
            if (child instanceof TextSprite) {
                elementsToRemove.push(child);
            }
        });

        // AxesHelper 제거
        this.sceneSub.children.forEach(child => {
            if (child instanceof THREE.AxesHelper) {
                elementsToRemove.push(child);
            }
        });

        // BoxHelper 제거
        this.sceneSub.children.forEach(child => {
            if (child instanceof THREE.BoxHelper) {
                elementsToRemove.push(child);
            }
        });

        // 그리드 및 라인 제거
        this.sceneSub.children.forEach(child => {
            if (child.name === 'arrow') {
                elementsToRemove.push(child);
            }
        });



        // 추적한 요소들을 제거합니다.
        elementsToRemove.forEach(element => {
            this.scene.remove(element);
            this.sceneSub.remove(element);
        });

        // Sidebar 초기화 (만약 sidebar의 내용을 지우려면 해당 로직 추가)
        this.resetSidebar();

        this.sceneFirstLoad = true;


        // 렌더링
        this.Render();


    }

    // 그리드 생성
    setupMTPGrid(scene) {

        //console.log('grid생성');

        // 라인의 두 점을 정의
        const material = new THREE.LineBasicMaterial({ color: 0xD0D3D4 });
        let FR_Values = [];
        let LP_Values = [];
        let LPZ_Values = [];

        //console.log(this.mtpDataList);

        // for문 시작 this.mtpDataList;
        this.mtpDataList.forEach(gridData => {


            // 그리드 데이터가 SHIP_X이면
            if (gridData.OWNER === '/SHIP_X') {
                //console.log(gridData);

                // GRDOFF: 좌표값
                // GRDID: FR1, FR2, FR3
                const FR_GridPos = gridData.GRDOFF;
                const FR_GridPosNumber = parseInt(FR_GridPos.split('mm')[0]);
                FR_Values.push({
                    GRDOFF: FR_GridPosNumber / 1000,
                    GRDID: gridData.GRDID
                });
                //console.log(FR_Values);

            }

            // 그리드 데이터가 SHIP_Y이면
            if (gridData.OWNER === '/SHIP_Y') {
                const LP_GridPos = gridData.GRDOFF;
                const LP_GridPosNumber = parseInt(LP_GridPos.split('mm')[0]);

                LP_Values.push({
                    GRDOFF: LP_GridPosNumber / 1000,
                    GRDID: gridData.GRDID
                });
                //console.log(frAxesNumber);
            }

            // 그리드 데이터가 SHIP_Z이면
            if (gridData.OWNER === '/SHIP_Z') {
                const LPZ_GridPos = gridData.GRDOFF;
                const LPZ_GridPosNumber = parseInt(LPZ_GridPos.split('mm')[0]);

                LPZ_Values.push({
                    GRDOFF: LPZ_GridPosNumber / 1000,
                    GRDID: gridData.GRDID
                });
                //console.log(frAxesNumber);
            }
        })

        // FR ------------------------------------
        let frchild = [];

        // 현재 오픈한 모델의 Bounding BOX크기
        var boxmin_x = parseInt(this.boundingBox.min.x); // X축 박스 min
        var boxmax_x = parseInt(this.boundingBox.max.x); // X축 박스 max
        var boxmax_y = parseInt(this.boundingBox.max.y); // Z축 박스 max 
        var boxmin_z = parseInt(this.boundingBox.min.z); // Y축 박스 min
        var boxmax_z = parseInt(this.boundingBox.max.z); // Y축 박스 max

        //console.log(boxmin_z);
        //console.log(boxmax_z);

        // X축 방향으로 박스크기 만큼만 사용 (ex. 모델박스 크기가 FR150부터 FR200에 해당하면, FR150 ~ FR200만 그리도록)
        FR_Values.forEach(fr_valueIndex => {
            if (fr_valueIndex.GRDOFF <= boxmax_x + 2 && fr_valueIndex.GRDOFF >= boxmin_x) {
                frchild.push(fr_valueIndex.GRDOFF);
            }
        })

        // 그 중에서 양 끝 min.X, max.X 좌표만 사용
        const minFR_Value = Math.min(...frchild);
        const maxFR_Value = Math.max(...frchild);


        // LP-Y -----------------------------------
        let lpchild = [];

        LP_Values.forEach(lp_valueIndex => {
            //console.log(lp_valueIndex);
            //console.log(lp_valueIndex.GRDOFF);

            // Z축(실제론 Y축) 방향으로 박스크기 만큼만 사용 (보통 전체 다 사용됨)
            if (lp_valueIndex.GRDOFF <= boxmax_z && lp_valueIndex.GRDOFF >= boxmin_z) {
                lpchild.push(lp_valueIndex.GRDOFF);
            }
        })

        // 그 중에서 양 끝 min.Y, max.Y 좌표만 사용
        const minLP_Value = Math.min(...lpchild);
        const maxLP_Value = Math.max(...lpchild);

        // LP-Z -----------------------------------
        let lpzchild = [];

        // Y축(실제론 Z축) 방향으로 박스크기 만큼만 사용.
        LPZ_Values.forEach(lpz_valueIndex => {
            if (lpz_valueIndex.GRDOFF <= boxmax_y + 2) {
                lpzchild.push(lpz_valueIndex.GRDOFF);
            }
        })

        // 그 중에서 양 끝 min.Z, max.Z 좌표만 사용
        const minLPZ_Value = Math.min(...lpzchild);
        const maxLPZ_Value = Math.max(...lpzchild);


        // DrawGrid ------------------------------
        this.DrawFR_Lines(FR_Values, minLP_Value, maxLP_Value, 'X', scene);
        this.DrawLP_Lines(LP_Values, minFR_Value, maxFR_Value, 'X', scene);

        this.DrawFR_Lines(LPZ_Values, minLP_Value, maxLP_Value, 'Z', scene);
        this.DrawLP_Lines(LP_Values, minLPZ_Value, maxLPZ_Value, 'Z', scene);

    }

    // 그리드 라인 그리기 (X축)
    DrawFR_Lines(FR_Values, minLP_Value, maxLP_Value, axes, scene) {
        const material = new THREE.LineBasicMaterial({ color: 0xD0D3D4 });


        var boxmin_x = parseInt(this.boundingBox.min.x); // 120
        var boxmax_x = parseInt(this.boundingBox.max.x); // 154
        var boxmax_y = parseInt(this.boundingBox.max.y); // 154

        var boxcenter = boxmin_x + ((boxmax_x - boxmin_x) / 2)

        //console.log(boxmin);
        //console.log(boxmax);


        if (axes === 'X') {
            FR_Values.forEach((FR_GridPosNumber, index) => {

                if (FR_GridPosNumber.GRDOFF <= boxmax_x + 2 && FR_GridPosNumber.GRDOFF >= boxmin_x) {
                    //console.log(FR_GridPosNumber.GRDOFF)

                    // 라인의 두 점을 정의
                    const points = [];
                    points.push(new THREE.Vector3(FR_GridPosNumber.GRDOFF, 0, minLP_Value));  // (FR_GridOffNumber, minLP_Value)
                    points.push(new THREE.Vector3(FR_GridPosNumber.GRDOFF, 0, maxLP_Value));  // (FR_GridOffNumber, maxLP_Value)

                    const geometry = new THREE.BufferGeometry().setFromPoints(points);

                    // 라인 객체 생성 및 씬에 추가
                    const line = new THREE.Line(geometry, material);
                    scene.add(line);
                    //this.sceneSub.add(line);

                    // // 텍스트 생성 (X축 FR)
                    // const FRgrdId = new TextSprite('FR' + FR_GridPosNumber.GRDID, 'Arial', 100, 'white');
                    // FRgrdId.position.copy(this.center.clone().add(new THREE.Vector3(FR_GridPosNumber.GRDOFF, 0, maxLP_Value + 1))); // X 축에 라벨 위치 조절
                    // this.scene.add(FRgrdId);
                    // 인덱스가 5의 배수인 경우에만 텍스트 생성 (X축 FR)
                    if ((index + 1) % 5 === 0) {  // 인덱스는 0부터 시작하므로 +1을 해줍니다.

                        //console.log(this.center);
                        const FRgrdId = new TextSprite('FR' + FR_GridPosNumber.GRDID, 'Arial', 100, 'white', 'dmp');
                        FRgrdId.position.copy(new THREE.Vector3(FR_GridPosNumber.GRDOFF, 0, maxLP_Value + 1));
                        scene.add(FRgrdId);
                        //this.sceneSub.add(FRgrdId);



                    }
                    // const boxHelper = new THREE.BoxHelper(FRgrdId);
                    // boxHelper.geometry.computeBoundingBox(); // BoxHelper의 geometry를 bounding box에 맞게 업데이트합니다.
                    // this.scene.add(boxHelper);

                }
            });
        }
        else if (axes === 'Z') {
            FR_Values.forEach(FR_GridPosNumber => {

                if (FR_GridPosNumber.GRDOFF <= boxmax_y + 2) {

                    // 라인의 두 점을 정의
                    const points = [];
                    points.push(new THREE.Vector3(boxmin_x, FR_GridPosNumber.GRDOFF, minLP_Value));  // (FR_GridOffNumber, minLP_Value)
                    points.push(new THREE.Vector3(boxmin_x, FR_GridPosNumber.GRDOFF, maxLP_Value));  // (FR_GridOffNumber, maxLP_Value)

                    const geometry = new THREE.BufferGeometry().setFromPoints(points);

                    // 라인 객체 생성 및 씬에 추가
                    const line = new THREE.Line(geometry, material);
                    scene.add(line);
                    //this.sceneSub.add(line);

                    // 텍스트 생성 (Z축 LP)
                    const FRgrdId = new TextSprite('LP' + FR_GridPosNumber.GRDID, 'Arial', 100, 'white', 'dmp');
                    FRgrdId.position.copy(new THREE.Vector3(boxmin_x, FR_GridPosNumber.GRDOFF, maxLP_Value + 1)); // X 축에 라벨 위치 조절
                    scene.add(FRgrdId);
                    //this.sceneSub.add(FRgrdId);

                }


            });
        }

    }

    // 그리드 라인 그리기 (Y축)
    DrawLP_Lines(LP_Values, minFR_Value, maxFR_Value, axes, scene) {
        const defaultMaterial = new THREE.LineBasicMaterial({ color: 0xD0D3D4 });
        const centerLineMaterial = new THREE.LineBasicMaterial({ color: 0xFFFF00 }); // 센터 라인용 노란색 머티리얼

        var boxmin_x = parseInt(this.boundingBox.min.x); // 120
        var boxmax_x = parseInt(this.boundingBox.max.x); // 154

        var boxmin_z = parseInt(this.boundingBox.min.z); // 154
        var boxmax_z = parseInt(this.boundingBox.max.z); // 154

        var boxcenter = boxmin_x + ((boxmax_x - boxmin_x) / 2)
        //console.log(boxcenter);

        if (axes === 'X') {
            LP_Values.forEach(LP_GridPosNumber => {
                if (LP_GridPosNumber.GRDOFF <= boxmax_z && LP_GridPosNumber.GRDOFF >= boxmin_z) {
                    // 라인의 두 점을 정의
                    const points = [];
                    points.push(new THREE.Vector3(minFR_Value, 0, LP_GridPosNumber.GRDOFF));  // (LP_GridPosNumber, minLP_Value)
                    points.push(new THREE.Vector3(maxFR_Value, 0, LP_GridPosNumber.GRDOFF));  // (LP_GridPosNumber, maxLP_Value)

                    const geometry = new THREE.BufferGeometry().setFromPoints(points);

                    // GRDID가 0인 경우(센터 라인)와 아닌 경우를 구분하여 적절한 머티리얼 사용
                    const material = LP_GridPosNumber.GRDID === '0' ? centerLineMaterial : defaultMaterial;

                    // 라인 객체 생성 및 씬에 추가
                    const line = new THREE.Line(geometry, material);
                    scene.add(line);
                    //this.sceneSub.add(line);


                    const textColor = LP_GridPosNumber.GRDID === '0' ? 'yellow' : 'white';  // '0x' 접두사 추가

                    // 텍스트 생성 (Y축 LP)
                    const LPgrdId = new TextSprite('LP' + LP_GridPosNumber.GRDID, 'Arial', 100, textColor, 'dmp');
                    LPgrdId.position.copy(new THREE.Vector3(minFR_Value - 1, 0, LP_GridPosNumber.GRDOFF)); // Y 축에 라벨 위치 조절
                    scene.add(LPgrdId);
                    //this.sceneSub.add(LPgrdId);

                }

            });
        }
        else if (axes === 'Z') {
            LP_Values.forEach(LP_GridPosNumber => {
                if (LP_GridPosNumber.GRDOFF <= boxmax_z && LP_GridPosNumber.GRDOFF >= boxmin_z) {
                    // 라인의 두 점을 정의
                    const points = [];
                    points.push(new THREE.Vector3(boxmin_x, minFR_Value, LP_GridPosNumber.GRDOFF));  // (LP_GridPosNumber, minLP_Value)
                    points.push(new THREE.Vector3(boxmin_x, maxFR_Value, LP_GridPosNumber.GRDOFF));  // (LP_GridPosNumber, maxLP_Value)

                    const geometry = new THREE.BufferGeometry().setFromPoints(points);

                    // GRDID가 0인 경우(센터 라인)와 아닌 경우를 구분하여 적절한 머티리얼 사용
                    const material = LP_GridPosNumber.GRDID === '0' ? centerLineMaterial : defaultMaterial;

                    // 라인 객체 생성 및 씬에 추가
                    const line = new THREE.Line(geometry, material);
                    scene.add(line);
                    //this.sceneSub.add(line);

                    // const LPgrdId = new TextSprite('LP' + LP_GridPosNumber.GRDID, 'Arial', 100, 'white');
                    // LPgrdId.position.copy(this.center.clone().add(new THREE.Vector3(minFR_Value - 1,LP_GridPosNumber.GRDOFF, 0))); // X 축에 라벨 위치 조절
                    // this.scene.add(LPgrdId);
                }


            });
        }

    }

    // 버튼을 통해 파일 Import
    async GltfLoad() {



        //console.log("FileImport");
        //this.FileNewScene();

        fetch('/loadGlb')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.blob(); // 파일 데이터를 blob 형태로 받음
            })
            .then(blobData => {
                // 받은 blob 데이터를 변수에 저장
                const files = new Blob([blobData], { type: 'model/gltf-binary' });

                // 저장된 파일 변수를 사용하여 원하는 작업 수행
                console.log('GLB 파일을 변수에 저장했습니다.', files);

                // 예를 들어, 저장된 파일 변수를 사용하여 GLTFLoader를 통해 모델을 로드하거나 렌더링할 수 있음
            })
            .catch(error => {
                console.error('There has been a problem with your fetch operation:', error);
            });
        //const files = event.target.files;

        //const file = event.target.files[0];


        // 파일 크기에 따라 정렬 (가장 큰 파일이 첫 번째)
        //files.sort((a, b) => b.size - a.size);

        // 가장 큰 파일과 가장 작은 파일을 가져옴
        //const largestFile = files[0];
        //const smallestFile = files[files.length - 1];

        //console.log(files);
        //console.log(smallestFile);
        this.ShowLoading();

        // 각 파일을 해당하는 Scene에 로드
        try {
            for (const file of files) {
                await this.loadModelIntoScene(file, this.scene);
                //console.log('메인씬 로드 완료');

                await this.loadModelIntoScene(file, this.sceneSub);
                //console.log('서브씬 로드 완료');
            }

            // if(this.scene.children.name.includes('Group')){
            //     console.log(this.scene.children);
            // }

            // this.scene.traverse(child => {
            //     if(child.name.includes('rvm')){

            //         console.log(child);
            //     }
            //})

        } catch (error) {
            console.error('모델 로딩 중 오류 발생:', error);
        }

        this.HideLoading();

        // var geometry = new THREE.CylinderGeometry( 50, 50, 200, 32 ); 
        // var material = new THREE.MeshBasicMaterial( {color: 0xffff00} ); 
        // var cylinder = new THREE.Mesh( geometry, material ); 
        // cylinder.position.copy(this.center);

        // this.scene.add(cylinder);
        // this.sceneSub.add(cylinder);
        // console.log('실린더 생성')
        // 로드한 파일이 2개 이면
        //if(largestFile !== smallestFile){
        //this.loadModelIntoScene(smallestFile, this.sceneSub);// sceneSub는 미리 정의되어 있어야 함
        //}

        //console.log("원본 파일 크기:", file.size);
        //const fileName = file.name.slice(0, -4); // 파일 확장자 제거

        // // 서버로 파일 이름 전송
        // fetch('http://localhost:5501/src/blocks/getBlockData')
        //     .then(data => {
        //         return data.json()
        //     })
        //     .then(res => {
        //         this.dataList = [];
        //         this.dataList = res;
        //         //console.log(this.dataList);
        //     })

        // if (file) {

        //     const reader = new FileReader();

        //     reader.onload = (e) => {
        //         // 모델을 로드하고 씬에 추가
        //         this.loadModel(e.target.result, (gltf) => {
        //             if (gltf) {

        //                 //this.createAxesAndLabels();
        //                 //this.setupViewHelper();
        //                 // this.modelCenterPosition();
        //                 // this.modelCenterPosition();
        //                 // this.setupMTPGrid();

        //                 //console.log(this.renderer.info);
        //                 //console.log(this.renderer.info.render.calls);
        //             }
        //         });
        //     };
        //     reader.readAsArrayBuffer(file);
        // }
        // this.Render();
    }

    loadModelIntoScene(file, scene) {
        return new Promise((resolve, reject) => {

            const reader = new FileReader();
            reader.onload = (e) => {

                // 서버 연결
                //this.ServerConnect();


                if (scene === this.scene) {
                    //console.log('메인 씬')
                    // 모델을 로드하고 씬에 추가
                    this.loadModel(e.target.result, scene, (gltf) => {
                        if (gltf) {

                            //console.log(gltf);
                            //console.log(gltf.scene);
                            // scene.add(gltf.scene);
                            //     //this.createAxesAndLabels();
                            //     //this.setupViewHelper();
                            //     // this.modelCenterPosition();
                            //     // this.modelCenterPosition();
                            //     // this.setupMTPGrid();
                            this.modelCenterPosition();

                            this.CreateObjectTree(this.loadedModel, this.sidebarContainer, null);
                            this.OriginalMaterialSave();

                            // dmp 그리드 생성
                            //this.setupMTPGrid(scene);

                            if (this.sceneFirstLoad) {
                                // grid 생성
                                this.setupMTPGrid(this.scene);
                                this.setupMTPGrid(this.sceneSub);

                                this.sceneFirstLoad = false;
                            }

                            this.Render();

                            resolve(gltf);
                        }
                        else {
                            reject(new Error('모델 로딩 실패'));
                        }
                    });
                }
                else if (scene === this.sceneSub) {
                    //console.log('서브 씬')
                    // 모델을 로드하고 씬에 추가
                    this.loadModel(e.target.result, scene, (gltf) => {
                        if (gltf) {
                            this.modelCenterPosition();

                            // dmp 그리드 생성
                            //this.setupMTPGrid(scene);
                            this.Render();
                            resolve(gltf);
                        }
                        else {
                            reject(new Error('모델 로딩 실패'));
                        }
                    });
                }
            };
            reader.onerror = reject; // 파일 리더 오류 처리
            reader.readAsArrayBuffer(file);
        })
    }

    // 모델 로드 함수
    loadModel(modelData, scene, onLoadCallback) {



        // DracoLoader 드라코로더
        // 로더한 gltf의 파일 크기를 내부적으로 최적화해준다.
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('./jsm/libs/draco/');
        //'three/addons/loaders/DRACOLoader.js';


        const loader = new GLTFLoader();
        loader.setDRACOLoader(dracoLoader);

        loader.parse(modelData, '', (gltf) => {
            //let endTime = performance.now();
            //console.log(`Model loading time: ${endTime - startTime} milliseconds`);


            if (scene === this.scene) {
                if (gltf.scene && gltf.scene !== undefined && gltf.scene instanceof THREE.Object3D) {

                    //this.FileNewScene();
                    //this.resetSidebar();
                    this.loadedModel = gltf.scene;

                    //console.log(scene);
                    scene.add(this.loadedModel);
                    this.sceneObjects.push(this.loadedModel);

                    let vertexCount = 0;
                    let triangleCount = 0;
                    let objectCount = 0;


                    this.loadedModel.traverse((child) => {

                        if (child instanceof THREE.Mesh) {

                            const geometry = child.geometry;
                            // BufferGeometry인 경우에만 단순화합니다.
                            if (geometry.isBufferGeometry) {
                                // 단순화를 위해 SimplifyModifier를 생성합니다.
                                // const modifier = new SimplifyModifier();
                                // // 단순화를 수행합니다. 이 때, 단순화 수준을 조절할 수 있습니다.
                                // const simplifiedGeometry = modifier.modify(geometry, 0.01); // 0~1, 0에 가까울수록 수준 낮음
                                // // 단순화된 geometry를 적용합니다.
                                // child.geometry = simplifiedGeometry;

                                // const modifier = new SimplifyModifier();
                                // const count = Math.floor(child.geometry.attributes.position.count * 0.1);
                                // child.geometry = modifier.modify(child.geometry, count);
                                // child.material.envMap = child.texture;
                                // child.material.flatShading = true;

                                //const modifier = new SimplifyModifier();
                                //const simplifiedGeometry = modifier.modify(geometry, 0.5);

                                //child.geometry = simplifiedGeometry;

                            }

                            // 후면 컬링 활성화 (기본 재질 설정의 경우 변경할 필요 없음)
                            if (child.material) {

                                //console.log(child.material.side);
                                //child.material.side = 0;
                                //console.log(child.material.side);

                            }
                        }





                        const sliceObjectParentName = child.name.slice(-3);
                        const regex = /(PIPE|EQUIP|ELECT|HVAC|OUTSTEEL)/;

                        // 오브젝트 이름이 rvm으로 끝나면 --> WORLD
                        if (sliceObjectParentName === 'rvm') {
                            child.tag = 'WORLD';
                        }
                        else {
                            if (child.parent.tag) {
                                // WORLD 밑에 SITE, BLOCK 구분
                                if (child.parent.tag.includes('WORLD')) {

                                    if (regex.test(child.name)) {
                                        child.tag = 'SITE'
                                    }
                                    else {
                                        child.tag = 'BLOCK'
                                    }
                                }

                                // SITE 밑에 ZONE
                                if (child.parent.tag === 'SITE') {
                                    child.tag = 'ZONE';
                                }

                                if (child.parent.tag === 'BLOCK') {



                                    if (child.name.includes('CP')) {
                                        child.tag = 'CPANEL';
                                    }
                                    else {
                                        child.tag = 'HPANEL';
                                    }
                                }

                                // ZONE 종류에 따라 PIPE, EQUIP, CWAY, HVAC, STRU
                                if (child.parent.tag === 'ZONE') {

                                    if (child.parent.name.includes('PIPE')) {
                                        child.tag = 'PIPE';
                                    }
                                    if (child.parent.name.includes('EQUIP')) {
                                        child.tag = 'EQUIP';
                                    }
                                    if (child.parent.name.includes('CABLE')) {
                                        child.tag = 'CWAY';
                                    }
                                    if (child.parent.name.includes('HVAC')) {
                                        child.tag = 'HVAC';
                                    }
                                    if (child.parent.name.includes('STRCT')) {
                                        child.tag = 'STRU';
                                    }
                                }

                                // PIPE 밑에 BRANCH
                                if (child.parent.tag === 'PIPE') {
                                    child.tag = 'BRANCH';
                                }
                                if (child.parent.tag === 'CWAY') {
                                    child.tag = 'CWBRAN';
                                }
                                if (child.parent.tag === 'HVAC') {
                                    child.tag = 'BRANCH';
                                }
                                if (child.parent.tag === 'STRU') {
                                    child.tag = 'FRMW';
                                }



                                // BLOCK 관련 리네임
                                if (child.parent.tag === 'CPANEL') {
                                    child.tag = 'CPLATE';
                                }

                            }


                            // PIPE 관련 리네임
                            if (child.name.includes('Cylinder')) {
                                child.name = child.name.replace('Cylinder', 'TUBE') + '_of_' + child.parent.tag + ' ' + child.parent.name
                            }

                            if (child.name.includes('V0')) {
                                child.tag = 'VALVE';
                            }
                            if (child.name.startsWith('3-Way')) {
                                child.tag = 'VALVE';
                            }

                            // EQUIP 관련 리네임
                            if ((child.name.startsWith('SWC') && child.name.includes('N')) ||
                                (child.name.startsWith('MPS') && child.name.includes('N')) ||
                                (child.name.startsWith('LOS') && child.name.includes('N')) ||
                                child.name.startsWith('MC')) {
                                child.tag = 'NOZZ';
                            }
                            if (child.name.startsWith('SWC') && child.name.includes('E')) {
                                child.tag = 'ELCONN'
                            }
                            if (child.name.startsWith('LOS') && child.name.includes('BODY')) {
                                child.tag = 'SUBE';
                            }
                            if (child.name.startsWith('MSBD')) {
                                child.tag = 'ELCONN';
                            }

                            // HVAC 관련 리네임
                            if (child.name.includes('MCX') && child.name.includes('FD')) {
                                child.tag = 'DAMP';
                            }
                            if (child.name.includes('MCX') && child.name.includes('AF')) {
                                child.tag = 'HFAN';
                            }

                            // OUTSTEEL 관련 태그
                            // if (child.parent.tag === 'STRU' && child.name.includes('FOUNFRM')) {
                            //     child.tag = 'FRMW';
                            // }
                            // if (child.parent.tag === 'STRU' && child.name.includes('WWAYFRM')) {
                            //     child.tag = 'FRMW';
                            // }
                            if (child.parent.tag === 'FRMW' && child.name.includes('WWAY') /*&& child.name.includes('V')*/) {
                                child.tag = 'SCTN';
                            }


                            // 공통: '_' 를 ' ' 빈 공백으로 변경
                            // if (child.name.includes('_')) {
                            //     child.name = child.name.replace(/_/g, ' ');
                            // }


                        }

                        if (child.name.includes('CW') && child.parent.name.includes('CABLE')) {
                            this.objectsToRemove.push(child);
                        }

                        // if (child.name.includes('HPANBO') && child.parent.name.includes('HPANEL')) {
                        //     console.log(child.name);
                        //     this.objectsToRemove.push(child);
                        // }

                        // if (child.name.endsWith(' 1') && !child.name.startsWith('TUBE')) {
                        //     this.objectsToRemove.push(child);
                        // }
                    })

                    this.ObjectsToRemove(scene);

                    gltf.scene.traverse(child => {
                        if (child.isMesh) {
                            vertexCount += child.geometry.attributes.position.count;
                            triangleCount += child.geometry.index ? child.geometry.index.count / 3 : child.geometry.attributes.position.count / 3;
                        }
                        objectCount++;
                    })




                    //this.MaterialSelect();
                    //this.setupViewHelper();

                    // 오브젝트 수 표시
                    document.getElementById('Objects').innerHTML = objectCount.toLocaleString();
                    document.getElementById('Vertices').innerHTML = vertexCount.toLocaleString();
                    document.getElementById('Triangles').innerHTML = triangleCount.toLocaleString();
                    // Call the callback
                    if (onLoadCallback) {
                        onLoadCallback(gltf);
                    }



                } else {
                    //console.error('Loaded model is undefined or not an instance of THREE.Object3D.');
                }
            }

            else {
                if (gltf.scene && gltf.scene !== undefined && gltf.scene instanceof THREE.Object3D) {
                    //this.FileNewScene();
                    //this.resetSidebar();
                    //this.loadedModel = gltf.scene;

                    //console.log(scene);
                    scene.add(gltf.scene);

                    //this.modelCenterPosition();

                    scene.traverse((child) => {

                        if (child instanceof THREE.Mesh) {

                            const geometry = child.geometry;
                            // BufferGeometry인 경우에만 단순화합니다.
                            if (geometry.isBufferGeometry) {
                                // 단순화를 위해 SimplifyModifier를 생성합니다.
                                // const modifier = new SimplifyModifier();
                                // // 단순화를 수행합니다. 이 때, 단순화 수준을 조절할 수 있습니다.
                                // const simplifiedGeometry = modifier.modify(geometry, 0.01); // 0~1, 0에 가까울수록 수준 낮음
                                // // 단순화된 geometry를 적용합니다.
                                // child.geometry = simplifiedGeometry;

                                // const modifier = new SimplifyModifier();
                                // const count = Math.floor(child.geometry.attributes.position.count * 0.2);
                                // child.geometry = modifier.modify(child.geometry, count);
                                // child.material.envMap = child.texture;
                                // child.material.flatShading = true;


                            }
                            // 후면 컬링 활성화 (기본 재질 설정의 경우 변경할 필요 없음)
                            if (child.material) {

                                //console.log(child.material.side);
                                //child.material.side = 0;
                                //console.log(child.material.side);

                            }
                        }

                        const regex = /(PIPE|EQUIP|ELECT|HVAC|OUTSTEEL)/;


                        if (regex.test(child.name)) {
                            this.objectsToRemove.push(child);
                        }


                    })

                    this.ObjectsToRemove(scene);

                    // Call the callback
                    if (onLoadCallback) {
                        onLoadCallback(gltf);
                    }

                } else {
                    console.error('Loaded model is undefined or not an instance of THREE.Object3D.');
                }
            }



        });
    }

    // 불필요한 오브젝트 루프 삭제
    ObjectsToRemove(scene) {
        this.objectsToRemove.forEach(obj => {

            this.disposeHierarchy(obj);

            if (obj.parent) {
                obj.parent.remove(obj);
            }
            else {
                scene.remove(obj);
            }
        });

        this.objectsToRemove = [];
    }

    // 객체와 관련 리소스 해제 함수 정의
    disposeNode(obj) {
        if (obj instanceof THREE.Mesh) {
            if (obj.geometry) {
                obj.geometry.dispose();
            }

            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    // 재질이 배열인 경우 각 재질을 순회하며 해제
                    obj.material.forEach(material => material.dispose());
                } else {
                    // 단일 재질 해제
                    obj.material.dispose();
                }
            }
        }
    }

    // 객체 제거와 리소스 해제 적용
    disposeHierarchy(obj) {
        for (let i = obj.children.length - 1; i >= 0; i--) {
            this.disposeHierarchy(obj.children[i]);
        }
        this.disposeNode(obj);
    }

    // 모델 로드한 후 모델 중심으로 카메라 이동한다.
    modelCenterPosition() {
        // 모델의 bounding box를 계산하여 중심 위치를 찾습니다.
        this.boundingBox = new THREE.Box3().setFromObject(this.loadedModel);

        const boxHelper = new THREE.BoxHelper(this.loadedModel);
        boxHelper.geometry.computeBoundingBox(); // BoxHelper의 geometry를 bounding box에 맞게 업데이트합니다.
        this.scene.add(boxHelper);

        //const boundingBoxSize = boxHelper.geometry.boundingBox.getSize(new THREE.Vector3());
        //this.axesLength = Math.max(boundingBoxSize.x, boundingBoxSize.y, boundingBoxSize.z) * 0.8;


        //console.log(boundingBoxSize);
        this.center = this.boundingBox.getCenter(new THREE.Vector3());

        //console.log(center);

        // 모델을 화면 중앙에 배치하기 위해 카메라와의 거리 계산
        const boundingSphere = new THREE.Sphere();
        this.boundingBox.getBoundingSphere(boundingSphere);
        const radius = boundingSphere.radius;
        const distance = radius * 2; // 모델의 크기에 따라 조절

        //console.log(this.controls.target);
        // console.log(this.camera.position);

        // 카메라의 위치를 계산된 거리로 설정하여 모델을 화면 중앙에 배치합니다.

        this.controls.target.set(this.center.x, this.center.z, this.center.y);
        //this.controlsGizmo.target.copy(center.x, center.z, center.y);

        //this.controls.target0.set(center.x, center.z, center.y);

        //this.controls.position0.copy(center.clone().add(new THREE.Vector3(32, 32, 32)));
        this.controls.update(); // controls의 업데이트를 수행


        // if (this.cameraPosition.x === 0 && this.cameraPosition.y === 0 && this.cameraPosition.z === 0) {
        //     console.log(this.cameraPosition);
        // }

        this.camera.position.copy(this.center.clone().add(new THREE.Vector3(distance, distance, distance)));
        //this.cameraPosition.copy(this.camera.position);

        this.controlsGizmo.updateCenter(this.center, this.camera.position);// controls의 업데이트를 수행

    }

    // 검색 버튼 클릭시 노드에서 검색결과만 그려준다.
    setupBtnClickSearch() {
        // const searchValue = document.getElementById("search-value");
        // const searchButton = document.getElementById("search-button");
        // var sidebarNodes = document.getElementsByClassName("sidebar-nodes");

        // searchButton.addEventListener('click', function () {

        //     console.log(searchValue.value);

        //     for (var i = 0; sidebarNodes.length; i++) {

        //         var nodeName = sidebarNodes[i].getElementsByClassName("nodes");
        //         if (nodeName[0].innerHTML.toUpperCase().indexOf(searchValue.value.toUpperCase()) > -1) {
        //             sidebarNodes[i].style.display = 'flex';
        //         }
        //         else {
        //             sidebarNodes[i].style.display = 'none';

        //         }

        //     }

        // })


        const searchValue = document.getElementById("search-value");
        const searchButton = document.getElementById("search-button");

        searchButton.addEventListener('click', () => {
            const searchKeyword = searchValue.value.toUpperCase();
            const matchingObjects = [];

            // this.scene의 모든 object를 순환
            this.scene.traverse((child) => {
                if (child.isMesh || child.isObject3D && child.name && child.name.toUpperCase().includes(searchKeyword)) {
                    matchingObjects.push(child);
                }
            });

            // 기존의 트리를 지우고, 검색 결과에 따라 트리를 다시 그림
            const parentElement = this.sidebarContainer;  // 트리가 그려질 부모 엘리먼트 ID로 수정
            parentElement.innerHTML = '';  // 기존의 트리 지우기
            this.drawSearchTree(matchingObjects, parentElement);
        });
    }

    // 서치트리
    drawSearchTree(matchingObjects, parentElement, level = 0) {
        matchingObjects.forEach((object) => {
            this.CreateObjectTree(object, parentElement, level);
        });
    }

    // 노드 네임이 '_1'로 끝나는 노드를 재정의한다. (mesh_1_1 -> mesh_1)
    removeSuffix(name) {
        const lastIndex = name.lastIndexOf('_1');
        if (lastIndex !== -1 && lastIndex === name.length - 2) {
            return name.substring(0, lastIndex);
        }
        return name;
    }

    // 사이드바에 같은 이름으로 추가된 노드가 있는지 체크하는 함수
    isNodeNameExists(parenNodeName) {
        const nodes = document.getElementById('sidebar').getElementsByClassName('nodes'); // 이미 추가된 노드들을 가져옵니다.
        for (const node of nodes) {
            if (node.innerText === parenNodeName) {
                return true; // 이미 같은 이름이 존재하면 true 반환
            }
        }
        return false;
    }

    // sidebar Tree 생성 함수

    // object: 현재 트리 노드에 해당하는 객체
    // parentElement: DOM에 해당 노드를 추가할 부모 요소
    // parentNode: 현재 노드의 부모 노드 객체
    // level: 현재 노드의 깊이 레벨 (기본값은 0)
    CreateObjectTree(object, parentElement, level = 0) {

        // 정규식에 있는 이름 밑에는 자식노드를 달지않는다.
        const regexEndObject = /(TUBI|ELBOW|TEE_|FLANGE|REDUCER|COUPLING|BEND|VALVE|GENSEC|ELCONN|BOX|CYLINDER|DISH|CONE|CTORUS|NOZZLE|NOZZ|EXTRUSION|CTRAY|RNODE|POINTR|STRT|IDAM|MESH|TAPE|STIF|OFST|TRNS|THRE|BRCO|DAMP|HFAN|CAP|SCTN|PJOINT|PANEL|HPLATE|HSTIFF|CPLATE|FacetGroup|REVOLUTION|SHELLPLATE|MTPL)/;
        //const regexEndObject = /(FLANGE)/;

        // 접기 펼치기
        // if (object.children && object.children.length >= 0) {
        if (object.type !== 'AxesHelper' && object.name !== 'arrow') {
            const objectName = object.name ? object.name.trim() : null; // objectName 유효성 확인

            if (objectName !== null && (object.type === 'Object3D' || object.type === 'Mesh') &&
                (!regexEndObject.test(object.parent.name) || object.parent.name.startsWith('OUTSTEEL')) &&
                (!object.name.endsWith('_1') || object.name.startsWith('TUBE'))) {

                //console.log(object);

                //const isChecked = this.nodeStates[objectName] ? this.nodeStates[objectName].checked : true;

                //console.log(isChecked);
                if (!this.nodeStates[objectName]) {
                    this.nodeStates[objectName] = { expanded: false, visibleChecked: true }; // 초기값 설정
                }
                else {
                    this.nodeStates[objectName].visibleChecked
                }

                const parentItem = document.createElement('div');
                parentItem.classList.add('sidebar-nodes');
                parentItem.id = object.name;
                parentItem.style.paddingLeft = `${level * 12}px`;
                // && (!regexEndObject.test(object.name) || object.name.startsWith('OUTSTEEL'))
                // 자식 노드가 있을때만
                if (object.children.length !== 0 && (!regexEndObject.test(object.name) || object.name.startsWith('OUTSTEEL'))) {


                    // 펼치기/접기 버튼 추가
                    const toggleButton = document.createElement('span');
                    toggleButton.classList = 'toggle';

                    const imgElement = document.createElement('img');
                    imgElement.classList = 'expandArrowImg';

                    imgElement.src = this.arrowImagePath;
                    imgElement.style.transform = this.nodeStates[objectName].expanded ? 'rotate(0deg)' : 'rotate(-90deg)';

                    toggleButton.appendChild(imgElement);
                    toggleButton.addEventListener('click', () => {

                        // 현재 스크롤 위치 저장
                        const currentScrollPosition = this.sidebarContainer.scrollTop;

                        this.toggleNodeExpand(objectName);
                        imgElement.style.transform = this.nodeStates[objectName].expanded ? 'rotate(0deg)' : 'rotate(-90deg)';

                        // Expand 후 이전 스크롤 위치로 이동
                        this.sidebarContainer.scrollTop = currentScrollPosition;
                    });

                    // div 안에 span 추가
                    parentItem.appendChild(toggleButton);
                } else {
                    const emptyArea = document.createElement('span');
                    emptyArea.classList = 'emptyArea';
                    // div 안에 span 추가
                    parentItem.appendChild(emptyArea);
                }

                // LEVEL 아이콘 생성
                const levelIcon = document.createElement('img');
                levelIcon.classList = 'levelIcon';

                let iconSet = false;

                if (object.tag) {
                    if (object.tag === 'WORLD') {
                        levelIcon.src = this.WORLD_icon;
                        levelIcon.style.width = '16px';
                        levelIcon.style.height = '16px';
                        levelIcon.style.padding = '4px 6px 4px 4px';

                        // iconSet = true;
                    }

                    // SITE, ZONE 아이콘
                    if (object.tag === 'SITE') {
                        levelIcon.src = this.SITE_icon;
                        levelIcon.classList.add('siteZone');
                        //iconSet = true;
                    }
                    if (object.tag === 'ZONE') {
                        levelIcon.src = this.ZONE_icon;
                        levelIcon.classList.add('siteZone');

                        // iconSet = true;
                    }

                    // 의장 PIPE, EQUIP, ELECT, HVAC, OUTSTEEL 아이콘
                    if (object.tag === 'PIPE') {
                        levelIcon.src = this.PIPE_icon;
                        //iconSet = true;
                    }
                    if (object.tag === 'EQUIP') {
                        levelIcon.src = this.EQUIP_icon;
                        //iconSet = true;
                    }
                    if (object.tag === 'CWAY' || object.tag === 'CWBRAN') {
                        levelIcon.src = this.TUBI_icon;
                        //iconSet = true;
                    }
                    if (object.tag === 'HVAC') {
                        levelIcon.src = this.HVAC_icon;
                        //iconSet = true;
                    }
                    if (object.tag === 'STRU') {
                        //levelIcon.src = this.;
                    }

                    // PIPE 관련 아이콘
                    if (object.tag.startsWith('BRANCH')) {
                        levelIcon.src = this.BRANCH_icon;
                        //iconSet = true;
                    }
                    if (object.tag === 'VALVE') {
                        levelIcon.src = this.VALVE_icon;
                        //iconSet = true;
                    }

                    // EQUIP 관련 아이콘
                    if (object.tag === 'NOZZ') {
                        levelIcon.src = this.NOZZ_icon;
                        //iconSet = true;
                    }
                    if (object.tag === 'SUBE') {
                        levelIcon.src = this.SUBE_icon;
                        //iconSet = true;
                    }

                    // HVAC 관련 아이콘
                    if (object.tag === 'DAMP') {
                        levelIcon.src = this.DAMP_icon;
                        //iconSet = true;
                    }
                    if (object.tag === 'HFAN') {
                        levelIcon.src = this.HFAN_icon;
                        //iconSet = true;
                    }

                    // OUTSTEEL 관련 아이콘
                    if (object.tag === 'STRU') {
                        levelIcon.src = this.STRU_icon;
                        //iconSet = true;
                    }
                    if (object.tag === 'FRMW') {
                        levelIcon.src = this.FRMW_icon;
                        //iconSet = true;
                    }
                    if (object.tag === 'SCTN') {
                        levelIcon.src = this.SCTN_icon;
                        //iconSet = true;
                    }

                    // BLOCK 아이콘
                    if (object.tag === 'BLOCK') {
                        levelIcon.src = this.BLOCK_icon;
                        //iconSet = true;
                    }
                    if (object.tag === 'HPANEL') {
                        levelIcon.src = this.HPANEL_icon;
                        //iconSet = true;
                    }
                    if (object.tag === 'CPANEL') {
                        levelIcon.src = this.CPANEL_icon;
                        //iconSet = true;
                    }
                    if (object.tag === 'CPLATE') {
                        levelIcon.src = this.CPLATE_icon;
                        //iconSet = true;
                    }

                    parentItem.appendChild(levelIcon);

                }
                // tag가 없는 일반 object name으로 아이콘 지정 ---------------------------------------------------------------------
                else if (object.name !== 'Root') {

                    // PIPE 관련 아이콘
                    if (object.name.includes('TUBE') ||
                        object.name.includes('JLDATUM') ||
                        object.name.includes('PLDATUM') ||
                        object.name.includes('FIXING')
                    ) {
                        levelIcon.src = this.TUBI_icon;
                        // iconSet = true;
                    }
                    if (object.name.includes('FLANGE')) {
                        levelIcon.src = this.FLANGE_icon;
                        // iconSet = true;
                    }
                    if (object.name.includes('ELBOW')) {
                        levelIcon.src = this.ELBO_icon;
                        // iconSet = true;
                    }
                    if (object.name.includes('REDUCER')) {
                        levelIcon.src = this.REDU_icon;
                        // iconSet = true;
                    }
                    if (object.name.includes('BEND')) {
                        levelIcon.src = this.BEND_icon;
                        // iconSet = true;
                    }
                    if (object.name.includes('COUPLING')) {
                        levelIcon.src = this.COUP_icon;
                        // iconSet = true;
                    }
                    if (object.name.includes('TEE')) {
                        levelIcon.src = this.TEE_icon;
                        //  iconSet = true;
                    }
                    if (object.name.includes('VALVE')) {
                        levelIcon.src = this.VALVE_icon;
                        //  iconSet = true;
                    }
                    if (object.name.includes('FILTER')) {
                        levelIcon.src = this.VALVE_icon;
                        //   iconSet = true;
                    }


                    // EQUIP 관련 아이콘
                    if (object.name.startsWith('TMPLATE')) {
                        levelIcon.src = this.TMPLATE_icon;
                        // iconSet = true;
                    }
                    if (object.name.startsWith('ELCONN')) {
                        levelIcon.src = this.ELCONN_icon;
                        // iconSet = true;
                    }
                    if (object.name.startsWith('BOX')) {
                        levelIcon.src = this.BOX_icon;
                        //  iconSet = true;
                    }
                    if (object.name.startsWith('CONE')) {
                        levelIcon.src = this.CONE_icon;
                        //  iconSet = true;
                    }
                    if (object.name.startsWith('CTOR')) {
                        levelIcon.src = this.CTOR_icon;
                        // iconSet = true;
                    }
                    if (object.name.startsWith('CYLI')) {
                        levelIcon.src = this.CYLI_icon;
                        //  iconSet = true;
                    }
                    if (object.name.startsWith('DISH')) {
                        levelIcon.src = this.DISH_icon;
                        // iconSet = true;
                    }
                    if (object.name.startsWith('EXTRU')) {
                        levelIcon.src = this.EXTR_icon;
                        //  iconSet = true;
                    }
                    if (object.name.startsWith('GENSEC')) {
                        levelIcon.src = this.GENSEC_icon;
                        //  iconSet = true;
                    }
                    if (object.name.startsWith('NOZZ')) {
                        levelIcon.src = this.NOZZ_icon;
                        //  iconSet = true;
                    }
                    if (object.name.startsWith('REVOLUTION')) {
                        levelIcon.src = this.REVOL_icon;
                        //  iconSet = true;
                    }

                    // ELECT 관련 아이콘
                    if (object.parent.name.startsWith('CT') ||
                        object.parent.name.startsWith('Copy') ||
                        object.parent.name.startsWith('RTFEAT') ||
                        object.parent.name.startsWith('RPATH')) {
                        levelIcon.src = this.TUBI_icon;
                        //  iconSet = true;
                    }
                    if (object.name.startsWith('CTRAY')) {
                        levelIcon.src = this.CTRAY_icon;
                        //  iconSet = true;
                    }

                    // HVAC 관련 아이콘
                    if (object.name.startsWith('STRT')) {
                        levelIcon.src = this.STRT_icon;
                        // iconSet = true;
                    }
                    if (object.name.startsWith('MESH')) {
                        levelIcon.src = this.MESH_icon;
                        //  iconSet = true;
                    }
                    if (object.name.startsWith('IDAM')) {
                        levelIcon.src = this.IDAM_icon;
                        //  iconSet = true;
                    }
                    if (object.name.startsWith('STIFFENER')) {
                        levelIcon.src = this.STIFF_icon;
                        //  iconSet = true;
                    }
                    if (object.name.startsWith('BRCO')) {
                        levelIcon.src = this.BRCO_icon;
                        //  iconSet = true;
                    }
                    if (object.name.startsWith('TRNS')) {
                        levelIcon.src = this.TRNS_icon;
                        //  iconSet = true;
                    }
                    if (object.name.startsWith('TAPER')) {
                        levelIcon.src = this.TAPER_icon;
                        //  iconSet = true;
                    }
                    if (object.name.startsWith('DAMPER')) {
                        levelIcon.src = this.DAMP_icon;
                        // iconSet = true;
                    }
                    if (object.name.startsWith('CAP')) {
                        levelIcon.src = this.CAP_icon;
                        //  iconSet = true;
                    }
                    if (object.name.startsWith('OFST')) {
                        levelIcon.src = this.OFST_icon;
                        //  iconSet = true;
                    }
                    if (object.name.startsWith('THREEWAY')) {
                        levelIcon.src = this.THREEWAY_icon;
                        // iconSet = true;
                    }

                    // OUTSTEEL 관련 아이콘
                    if (object.name.startsWith('FRMWORK')) {
                        levelIcon.src = this.FRMW_icon;
                        // iconSet = true;
                    }
                    if (object.name.startsWith('PANEL')) {
                        levelIcon.src = this.PANEL_icon;
                        //iconSet = true;
                    }
                    if (object.name.startsWith('SCTN')) {
                        levelIcon.src = this.SCTN_icon;
                        // iconSet = true;
                    }
                    if (object.name.startsWith('SBFRAMEWORK')) {
                        levelIcon.src = this.SBFR_icon;
                        //iconSet = true;
                    }

                    // BLOCK 관련 아이콘
                    if (object.name.startsWith('HPLATE')) {
                        levelIcon.src = this.HPLATE_icon;
                        // iconSet = true;
                    }
                    if (object.name.startsWith('HSTIFF')) {
                        levelIcon.src = this.HSTIFF_icon;
                        // iconSet = true;
                    }
                    if (object.name.startsWith('HFLANG')) {
                        levelIcon.src = this.HFAN_icon;
                        //  iconSet = true;
                    }
                    if (object.name.startsWith('HBRCKT')) {
                        levelIcon.src = this.HBRCKT_icon;
                        //  iconSet = true;
                    }
                    if (object.name.startsWith('HCTOUT')) {
                        levelIcon.src = this.HCTOUT_icon;
                        //  iconSet = true;
                    }
                    if (object.name.startsWith('HCLIP')) {
                        levelIcon.src = this.HCLIP_icon;
                        //  iconSet = true;
                    }
                    if (object.name.startsWith('HPILLR')) {
                        levelIcon.src = this.HPILLR_icon;
                        // iconSet = true;
                    }

                    parentItem.appendChild(levelIcon);
                }


                // 노드 이름표시
                const nodeLabel = document.createElement('span');
                if (object.tag && object.tag !== 'WORLD') {
                    nodeLabel.innerText = object.tag + ' ' + objectName;
                }
                else {
                    nodeLabel.innerText = objectName;
                }

                nodeLabel.id = objectName;
                nodeLabel.classList = 'nodes';
                nodeLabel.addEventListener('click', () => {
                    this.SelectObject(object);
                });
                nodeLabel.addEventListener('dblclick', () => {
                    event.preventDefault();
                    this.DblClickObject(object);
                    this.Render();
                })

                // 마우스 우클릭 customPanel 생성
                var customPanel = document.getElementById("customPanel");
                nodeLabel.addEventListener('contextmenu', () => {

                    Array.from(customPanel.children).forEach(child => {
                        customPanel.removeChild(child);
                    });

                    // visible 이미지 div 관련
                    const visibleImage = document.createElement('img');
                    visibleImage.classList = 'visibleImage';
                    visibleImage.src = this.visibleImagePath;

                    const invisibleImage = document.createElement('img');
                    invisibleImage.classList = 'visibleImage';
                    invisibleImage.src = this.invisibleImagePath;
                    invisibleImage.style.display = 'none';

                    const visibleText = document.createElement('div');
                    visibleText.classList = 'customPanelList'

                    const imageContainer = document.createElement('div');
                    imageContainer.classList.add('checkbox-related')

                    // AutoDimension 이미지 div 관련
                    const autoDimension = document.createElement('img');
                    autoDimension.classList = 'dimensionImage';
                    autoDimension.src = this.dimensionImagePath;

                    const autoDimensionText = document.createElement('div');
                    autoDimensionText.classList = 'customPanelList'

                    const imageContainerDim = document.createElement('div');
                    imageContainerDim.classList.add('checkbox-related')

                    imageContainer.appendChild(visibleImage);
                    imageContainer.appendChild(invisibleImage);
                    imageContainer.appendChild(visibleText);

                    imageContainerDim.appendChild(autoDimension);
                    imageContainerDim.appendChild(autoDimensionText);

                    // 노드 우클릭시 판넬 위치
                    event.preventDefault();
                    customPanel.style.top = `${event.pageY - 40}px`;
                    customPanel.style.left = `${event.pageX + 0}px`;
                    customPanel.style.display = 'block';

                    // 노드 좌클릭시 함수
                    this.SelectObject(object);

                    // object visible 관련 ---------------------------------------------
                    // visible 체크박스
                    const checkbox = document.createElement('input');
                    checkbox.classList = 'visibleCheckBox';
                    checkbox.classList.add('checkbox-related')
                    checkbox.type = 'checkbox';
                    checkbox.style.display = 'none';
                    //checkbox.id = `${objectName}-checkbox`;
                    const isChecked = this.nodeStates[object.name].visibleChecked;

                    checkbox.visibleChecked = isChecked;

                    if (checkbox.visibleChecked) {
                        visibleImage.style.display = 'inline-block';
                        invisibleImage.style.display = 'none'
                        visibleText.innerHTML = '숨기기';

                    }
                    else {
                        visibleImage.style.display = 'none';
                        invisibleImage.style.display = 'inline-block'
                        visibleText.innerHTML = '보이기';

                    }

                    imageContainer.addEventListener('click', (event) => {
                        checkbox.visibleChecked = !checkbox.visibleChecked;

                        object.traverse((child) => {

                            child.visible = checkbox.visibleChecked;
                            this.nodeStates[child.name] = { visibleChecked: checkbox.visibleChecked };

                        })
                        this.nodeStates[objectName].visibleChecked = checkbox.visibleChecked;

                        console.log(object.name);
                        this.sceneSub.traverse((child) => {
                            if (child.name === object.name) {
                                child.traverse((children) => {
                                    children.visible = checkbox.visibleChecked;
                                })
                                child.visible = checkbox.visibleChecked;
                            }
                            //child.visible = checkbox.visibleChecked;
                        })

                        if (checkbox.visibleChecked) {
                            visibleImage.style.display = 'inline-block';
                            invisibleImage.style.display = 'none'
                            visibleText.innerHTML = '숨기기';

                        }
                        else {
                            visibleImage.style.display = 'none';
                            invisibleImage.style.display = 'inline-block'
                            visibleText.innerHTML = '보이기';

                        }
                        this.Render();
                    });
                    // object visible 관련 ---------------------------------------------

                    // object AutoDimension 관련 ---------------------------------------------
                    // AutoDimension 체크박스
                    // const checkboxAutoDim = document.createElement('input');
                    // checkboxAutoDim.classList = 'AutoDimensionCheckBox';
                    // checkboxAutoDim.classList.add('checkbox-related')
                    // checkboxAutoDim.type = 'checkbox';
                    // const isCheckedAutoDim = this.nodeStates[object.name].dimensionChecked;

                    // checkboxAutoDim.dimensionChecked = isCheckedAutoDim;


                    // if (checkboxAutoDim.dimensionChecked) {
                    //     //visibleImage.style.display = 'inline-block';
                    //     //invisibleImage.style.display = 'none'
                    //     autoDimensionText.innerHTML = 'Auto 삭제';

                    // }
                    // else {
                    //     //visibleImage.style.display = 'none';
                    //     //invisibleImage.style.display = 'inline-block'
                    //     autoDimensionText.innerHTML = 'Auto 측정';

                    // }

                    // imageContainerDim.addEventListener('click', (event) => {
                    //     checkboxAutoDim.dimensionChecked = !checkboxAutoDim.dimensionChecked;
                    //     this.nodeStates[objectName].dimensionChecked = checkboxAutoDim.dimensionChecked;

                    //     // object.traverse((child) => {

                    //     //     child.visible = checkboxAutoDim.checked;

                    //     // })

                    //     //this.ReadAutoDimension(object.name);



                    //     if (checkboxAutoDim.dimensionChecked) {
                    //         //visibleImage.style.display = 'inline-block';
                    //         //invisibleImage.style.display = 'none'
                    //         autoDimensionText.innerHTML = 'Auto 삭제';

                    //     }
                    //     else {
                    //         //visibleImage.style.display = 'none';
                    //         //invisibleImage.style.display = 'inline-block'
                    //         autoDimensionText.innerHTML = 'Auto 측정';

                    //     }
                    //     this.Render();
                    // });
                    // Array.from(customPanel.children).forEach(child => {
                    //     console.log(child)
                    //     if (child.classList.contains('checkbox-related')) {
                    //         customPanel.removeChild(child);
                    //     }
                    // });
                    // object visible 관련 ---------------------------------------------

                    customPanel.appendChild(imageContainer);
                    customPanel.appendChild(checkbox);

                    // customPanel.appendChild(imageContainerDim);
                    // customPanel.appendChild(checkboxAutoDim);

                });
                document.addEventListener('click', function (event) {
                    if (!customPanel.contains(event.target)) {
                        customPanel.style.display = 'none';
                    }
                });
                parentItem.appendChild(nodeLabel);

                parentElement.appendChild(parentItem);
                //}
                if (this.nodeStates[objectName].expanded) {
                    // 펼쳐진 상태일 때만 자식 노드 추가

                    object.children.forEach((child) => {
                        this.CreateObjectTree(child, parentElement, level + 1);
                    });

                }

            }
            else {
                if (object.children && object.children.length >= 0) {
                    object.children.forEach((child) => {
                        this.CreateObjectTree(child, parentElement, level);
                    });
                }
            }
        }
        //}

    }

    // 노드 Expand 토글
    toggleNodeExpand(nodeId) {
        // 노드의 상태를 토글합니다.
        const currentState = this.nodeStates[nodeId] || { expanded: false, visibleChecked: true /*, dimensionChecked: false */ }; // 기본적으로 접혀진 상태
        currentState.expanded = !currentState.expanded;
        this.nodeStates[nodeId] = { expanded: currentState.expanded, visibleChecked: currentState.visibleChecked };

        // 노드를 토글한 후 트리를 다시 렌더링합니다.
        this.UpdateTree();
    }

    UpdateTree() {
        // 노드를 토글한 후 트리를 다시 렌더링합니다.
        this.sidebarContainer.innerHTML = null;

        this.CreateObjectTree(this.scene, this.sidebarContainer);
        // this.sidebarContainer.scrollTo({
        //     top: this.scrollPosition
        // })
        this.Render();
    }

    // 마우스 이동시 포인트위치 확인 (디멘젼 포인트 호버)
    onPointerMove(event) {

        // window offset 만큼 마우스 위치 계산
        var rect = this.renderer.domElement.getBoundingClientRect();

        this.pointer.x = ((event.clientX - rect.left) / (rect.right - rect.left)) * 2 - 1;
        this.pointer.y = - ((event.clientY - rect.top) / (rect.bottom - rect.top)) * 2 + 1;

        // 레이캐스터 업데이트
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersects = this.raycaster.intersectObjects(this.clickableDimSymbols);

        if (intersects.length > 0) {
            const intersected = intersects[0].object;

            // 이전에 hover된 객체가 있고 현재와 다르면 이전 horver 객체 원래 색상으로 복원
            if (this.currentHovered && this.currentHovered !== intersected) {
                this.currentHovered.material.color.set(0xFF0000); // (빨간색)

                //this.ChangeColorSelectedObject(this.currentHovered);
            }

            // 현재 마우스 hover된 객체 색상 변경
            intersected.material.color.set(0x000000);  // 색상 변경 예시 (하얀색)
            this.currentHovered = intersected;  // 현재 hover 객체 업데이트
            this.Render();

        } else if (this.currentHovered) {
            // hover된 객체가 없고 이전에 hover된 객체가 있으면 색상 복원
            this.currentHovered.material.color.set(0xFF0000); // 빨간색

            //this.ChangeColorSelectedObject(this.currentHovered);
            this.currentHovered = null;
            this.Render();

        }

    }

    // ReadAutoDimension(objectName) {

    //     // -----------------------------------------------------
    //     if (objectName) {

    //         var objectData;
    //         this.autoDimensionData.forEach(data => {
    //             if (data.Object === objectName) {
    //                 objectData = data;
    //             }
    //         });

    //         if (objectData && objectData.Points) {
    //             // 이전에 생성된 라인이 있는지 확인하고 제거
    //             console.log(this.nodeStates[objectName].dimensionChecked);

    //             // dimensionChecked 버튼 체크상태 false 하면서 Auto디멘젼 삭제
    //             if (!this.nodeStates[objectName].dimensionChecked) {

    //                 console.log('삭제', objectName);

    //                 //if (this.autoDimLinesOfObjName[objectName]) {
    //                 console.log(this.autoDimLinesOfObjName[objectName]);

    //                 this.autoDimLinesOfObjName[objectName].forEach(line => {
    //                     this.scene.remove(line);
    //                     //console.log('삭제')
    //                 });
    //                 delete this.autoDimLinesOfObjName[objectName];
    //                 // }
    //             }
    //             // dimensionChecked 버튼 체크상태 true로 하면서 Auto디멘젼 생성
    //             else if (this.nodeStates[objectName].dimensionChecked) {
    //                 console.log('측정', objectName);

    //                 this.autoDimLinesOfObjName[objectName] = [];  // 새 라인 참조를 저장할 배열 생성

    //                 objectData.Points.forEach(points => {
    //                     if (points.length === 4) {
    //                         // THREE.Vector3 객체로 포인트 변환
    //                         const autoPoint_1 = new THREE.Vector3(points[0].x, points[0].y, points[0].z);
    //                         const autoPoint_2 = new THREE.Vector3(points[1].x, points[1].y, points[1].z);
    //                         const autoPoint_3 = new THREE.Vector3(points[2].x, points[2].y, points[2].z);
    //                         const autoPoint_4 = new THREE.Vector3(points[3].x, points[3].y, points[3].z);

    //                         // DrawAutoDimension을 호출
    //                         this.DrawAutoDimension(autoPoint_1, autoPoint_2, autoPoint_3, autoPoint_4, objectName);
    //                         //this.autoDimLinesOfObjName[object].push(...lines);  // 라인 참조 저장
    //                     }
    //                 })
    //             }
    //         }
    //     }
    // }

    // determineClickedFace(intersect) {
    //     // intersect.face.normal은 교차된 면의 법선 벡터를 제공합니다.
    //     const normal = intersect.face.normal;
    //     if (normal.x === 1 || normal.x === -1) {
    //         return 'x'; // x 면
    //     } else if (normal.y === 1 || normal.y === -1) {
    //         return 'y'; // y 면
    //     } else if (normal.z === 1 || normal.z === -1) {
    //         return 'z'; // z 면
    //     }
    // }

    // calculateFaceCenter(box, faceAxis) {
    //     let centerPoint;
    //     if (faceAxis === 'x') {
    //         centerPoint = new THREE.Vector3(box.min.x, (box.min.y + box.max.y) / 2, (box.min.z + box.max.z) / 2);
    //     } else if (faceAxis === 'y') {
    //         centerPoint = new THREE.Vector3((box.min.x + box.max.x) / 2, box.min.y, (box.min.z + box.max.z) / 2);
    //     } else if (faceAxis === 'z') {
    //         centerPoint = new THREE.Vector3((box.min.x + box.max.x) / 2, (box.min.y + box.max.y) / 2, box.min.z);
    //     }
    //     return centerPoint;
    // }
    onMouseMove(e) {
        var textbox = document.getElementById('dimensionSelectTextBox');
        // let intersects = (this.raycaster.intersectObjects(this.scene.children, true)).filter(intersect => !this.clickableDimSymbols.includes(intersect.object));

        if (this.dim_select) {
            textbox.style.left = e.pageX + 'px';
            textbox.style.top = e.pageY + 'px';
            textbox.style.display = 'block'; // 텍스트 박스 보이기



            if (this.first_dim.x === 0 && this.first_dim.y === 0 & this.first_dim.z === 0) {
                textbox.innerHTML = '첫번째 포인트 선택';
            }
            else if (this.second_dim.x === 0 && this.second_dim.y === 0 & this.second_dim.z === 0) {
                textbox.innerHTML = '두번째 포인트 선택';
            }
            else {

                let intersects = (this.raycaster.intersectObjects(this.activeScene.children, true)).filter(intersect => this.distancePlane.includes(intersect.object));

                // 광선과 교차하는 지점을 계산
                if (intersects.length > 0) {
                    this.intersectPoint = intersects[0].point;
                    //console.log(this.intersectPoint); // 교차점 출력
                } else {
                    console.log("No intersection with the plane");
                }
                //console.log(intersects);
                // 광선과 교차하는 지점을 계산
                // if (intersects) {
                //     this.intersectPoint = intersects.point;

                //     console.log(this.intersectPoint);
                // }
                textbox.innerHTML = '디멘젼 생성 축 선택';
            }
        }
    }

    // 화면에서 클릭할때
    onMouseClick() {

        // 회전 중이면 클릭 이벤트 무시
        if (this.ignoreClick) {
            return;
        }
        else {
            // BoxHelper 제거
            this.scene.children.forEach(child => {
                if (child instanceof THREE.BoxHelper) {
                    this.scene.remove(child);
                }
            });

            this.sceneSub.children.forEach(child => {
                if (child instanceof THREE.BoxHelper) {
                    this.sceneSub.remove(child);
                }
            });

            this.RestoreOriginalMaterials();


            this.raycaster.setFromCamera(this.pointer, this.camera);
            //const intersects = this.raycaster.intersectObjects(this.scene.children, true);
            // if (this.activeScene === this.scene) {
            //     console.log('scene');

            // }
            // else {
            //     console.log('scene Sub');

            // }
            //let intersects = (this.raycaster.intersectObjects(this.activeScene.children, true)).filter(intersect => !this.clickableDimSymbols.includes(intersect.object));
            let intersects = (this.raycaster.intersectObjects(this.activeScene.children, true));
            intersects = intersects.filter(intersect => intersect.object.visible && !intersect.object.isLine);

            //console.log(intersects);

            if (intersects.length > 0) {
                intersects = intersects[0];
            }

            //console.log(intersects);
            let intersectsSymbol = this.raycaster.intersectObjects(this.clickableDimSymbols);

            // AxesHelper를 무시하고 첫 번째 Mesh 또는 Object3D를 선택합니다.
            var renderSelectedObject = null;

            // 디멘젼 심볼 클릭 트리거 true
            if (this.dim_select) {

                // for (const intersect of intersectsSymbol) {
                //      if (intersect.object.isMesh) {

                if (this.first_dim.x === 0 && this.first_dim.y === 0 && this.first_dim.z === 0) {

                    this.first_dim.copy(intersectsSymbol[0].object.position);
                    //console.log('first_dim:', this.first_dim);
                    this.clickedObjects.push(intersectsSymbol[0].object);

                    // 이전(previousMaterials)에 저장해둔 메쉬로 복원하고 클리어
                    //this.RestoreOriginalMaterials();

                    // previousMaterials에 현재색상 저장후 색상변경
                    //this.ChangeColorSelectedObject(renderSelectedObject);
                }
                else if (this.second_dim.x === 0 && this.second_dim.y === 0 && this.second_dim.z === 0) {

                    this.second_dim.copy(intersectsSymbol[0].object.position);

                    // 두번째 선택한 포인트가 첫번째 포인트와 동일하면 재입력받음
                    if (this.first_dim.equals(this.second_dim)) {
                        console.log('같은 점 입니다.다시 선택해주세요.');

                        this.second_dim.set(0, 0, 0);
                        return;
                    }

                    this.clickedObjects.push(intersectsSymbol[0].object);

                    console.log('point1: ', this.first_dim);
                    console.log('point2: ', this.second_dim);
                    //console.log(this.clickedObjects);

                    //this.DrawDimensionAxesSelect();


                    // 두 포인트로 면 생성
                    // if 판넬에 distance 체크시
                    this.DrawDistancePlane();

                    // else if distance아니고 dx, dy, dz 측정하려고 할 때 함수
                }
                else {
                    // // 광선과 교차하는 지점을 계산
                    // if (intersects.length > 0) {
                    //     this.intersectPoint = intersects[0].point;

                    //     //console.log(this.intersectPoint);
                    // }


                    console.log('3포인트:', this.intersectPoint)
                    if (this.intersectPoint.x !== 0 && this.intersectPoint.y !== 0 && this.intersectPoint.z !== 0) {
                        this.DrawDimension_dxdydz(this.first_dim, this.second_dim, this.intersectPoint);
                        this.intersectPoint.set(0, 0, 0)

                        this.distancePlane.forEach(plane => {
                            this.scene.remove(plane);
                        })
                    }
                }
            }
            // 디멘젼 심볼 클릭 트리거 false
            else {
                //intersects = this.raycaster.intersectObjects(this.scene.children, true);
                //intersects = intersects.filter(intersect => !this.clickableDimSymbols.includes(intersect.object));
                //this.Render();

                if (
                    intersects.object
                    && !(intersects.object instanceof THREE.AxesHelper
                        || intersects.object instanceof THREE.GridHelper)
                    && intersects.object.isMesh
                    && (intersects.object.visible === true)
                ) {

                    //this.sidebarContainer.innerHTML = '';
                    this.resetSidebar();
                    this.resetSelectObj();

                    renderSelectedObject = intersects.object;

                    // const expanded = this.nodeStates[renderSelectedObject.name] && this.nodeStates[renderSelectedObject.name].visibleChecked;
                    // this.nodeStates[renderSelectedObject.name] = { expanded: false, visibleChecked: expanded };

                    //console.log(this.nodeStates);

                    if (renderSelectedObject) {
                        // previousMaterials에 현재 색상 저장
                        if (!this.previousMaterials.has(renderSelectedObject)) {
                            this.previousMaterials.set(renderSelectedObject, renderSelectedObject.material.clone());
                        }

                        if (renderSelectedObject.isObject3D || renderSelectedObject.isMesh) {
                            if (!this.selectedObjects.includes(renderSelectedObject)) {
                                this.selectedObjects.push(renderSelectedObject);
                            }
                            else {
                                this.selectedObjects = this.selectedObjects.filter((obj) => obj !== renderSelectedObject);
                            }
                        }

                        // 이전(previousMaterials)에 저장해둔 메쉬로 복원하고 클리어
                        this.RestoreOriginalMaterials();

                        // previousMaterials에 현재색상 저장후 색상변경
                        this.ChangeColorSelectedObject(renderSelectedObject);

                        //this.HighlightObject();

                        var currentNode = renderSelectedObject;

                        // 선택한 오브젝트 parent 끝까지 찾아서 sidebar에 expanded
                        while (currentNode.parent.type !== 'Scene') {
                            if (currentNode.parent) {
                                currentNode = currentNode.parent;

                                this.nodeStates[currentNode.name] = {
                                    expanded: true,
                                    visibleChecked: true
                                };
                            }
                        }
                        // sidebar를 다시 렌더링
                        this.CreateObjectTree(this.scene, this.sidebarContainer);

                        // 선택한 오브젝트 sidebar에서 background 설정
                        this.SetActive(renderSelectedObject, true);


                        this.Render();

                    } else {
                        this.Render();

                    }
                }
            }
            this.Render();
        }
    }



    // 트리에서 클릭
    SelectObject(object) {

        // 선택한 object 확인
        console.log(object);

        // 선택한 object 초기화
        this.resetSelectObj();

        // 현재 object의 materials 저장
        object.traverse((child) => {
            if (child.isMesh) {
                if (!this.previousMaterials.has(child)) {
                    this.previousMaterials.set(child, child.material.clone());
                }
            }
        })

        // object중 Object3D, Mesh만 선택한 Object에 push
        if (object.isObject3D || object.isMesh) {

            if (!this.selectedObjects.includes(object)) {
                this.selectedObjects.push(object);
            }
            else {
                this.selectedObjects = this.selectedObjects.filter((obj) => obj !== object);
            }
        }

        // 이전에 저장해둔 메시정보로 초기화
        this.RestoreOriginalMaterials();

        // Block Level은 BoxHelper생성, 그 이하 Level은 Color HighLight
        const obejctParentName = object.parent.name;
        const sliceObjectParentName = obejctParentName.slice(-3);

        if (sliceObjectParentName === 'rvm' || sliceObjectParentName === 'oot' || object.name === 'Root') {
            this.BoxHelperSelectedObject(object);
        }
        else {
            this.ChangeColorSelectedObject(object);
        }

        //this.HighlightObject(object);
        this.SetActive(object, false);
        this.AttributeInputWithObjectName(object);
        //this.PartListInputWithObjectParentName(object);


    }

    // 사이드바 노드 더블클릭
    DblClickObject(object) {


        this.resetSelectObj();

        object.traverse((child) => {
            if (child.isMesh) {
                if (!this.previousMaterials.has(child)) {
                    this.previousMaterials.set(child, child.material.clone());
                }
            }
        })

        //몽키.glb
        if (object.isObject3D || object.isMesh) {
            if (!this.selectedObjects.includes(object)) {
                this.selectedObjects.push(object);
            }
            else {
                this.selectedObjects = this.selectedObjects.filter((obj) => obj !== object);
            }
        }


        const obejctParentName = object.parent.name;
        const sliceObjectParentName = obejctParentName.slice(-3);

        // 노드 최상단 더블클릭시
        if (object.name.slice(-3) === 'rvm') {
            this.sceneFix = false;

            // 초기화: scene 모든 객체 가시화
            this.scene.traverse((child) => {
                if (child.type === 'Mesh' || child.type === 'Object3D' && child.name !== 'arrow') {
                    child.visible = true;
                    const expanded = this.nodeStates[child.name] && this.nodeStates[child.name].expanded;
                    this.nodeStates[child.name] = { expanded: expanded, visibleChecked: true };
                }
            });

            // 초기화: sceneSub 모든 객체 가시화
            this.sceneSub.traverse((child) => {
                child.visible = true;
            });
        }

        // site, block 단위 노드 더블클릭시
        else if (sliceObjectParentName === 'rvm' /*|| sliceObjectParentName === 'oot' || object.name === 'Root'*/) {

            // scene에 Fix. sceneSub 비활성화
            this.sceneFix = true;

            this.activeScene = this.scene;

            // 초기화: 모든 객체의 visible을 false 설정
            this.sceneSub.traverse((child) => {
                //if (child.type === 'Mesh' || child.type === 'Object3D') {  
                child.visible = false;
                //this.nodeStates[child.name] = {visibleChecked : false};
                //}
            });

            // 초기화: 모든 객체의 visible을 false 설정
            this.scene.traverse((child) => {
                if (child.type === 'Mesh' || child.type === 'Object3D' && child.name !== 'arrow') {
                    child.originalVisible = child.visible; // 현재 상태 저장
                    //console.log(child);
                    child.visible = false;
                    const expanded = this.nodeStates[child.name] && this.nodeStates[child.name].expanded;
                    this.nodeStates[child.name] = { expanded: expanded, visibleChecked: false };

                }
            });

            // 선택한 객체와 그 하위 모든 자식 객체의 visible을 true로 설정
            object.traverse((objectChild) => {
                if (objectChild.type === 'Mesh' || objectChild.type === 'Object3D' && objectChild.name !== 'arrow') {
                    objectChild.visible = true;
                    const expanded = this.nodeStates[objectChild.name] && this.nodeStates[objectChild.name].expanded;

                    this.nodeStates[objectChild.name] = { expanded: expanded, visibleChecked: true };
                }
            });
            const expanded = this.nodeStates[object.name] && this.nodeStates[object.name].expanded;

            this.nodeStates[object.name] = { expanded: expanded, visibleChecked: true };
            this.UpdateTree();

            this.currentObject = object.parent;
            while (this.currentObject) {
                if (this.currentObject.type === 'Mesh' || this.currentObject.type === 'Object3D') {
                    this.currentObject.visible = true;
                    this.currentObject.opacity = 0;
                }
                this.currentObject = this.currentObject.parent;
            }
        }
        else {
            //console.log("줌인만");
        }



        // 기존 BoxHelper 제거
        this.scene.children.forEach((child) => {
            if (child instanceof THREE.BoxHelper) {
                this.scene.remove(child);
            }
        });

        // 새로운 BoxHelper 추가
        const boxHelper = new THREE.BoxHelper(object);
        boxHelper.geometry.computeBoundingBox();
        boxHelper.material.depthTest = false;
        boxHelper.material.color.setHex(0xFF0000);


        //this.scene.add(boxHelper);

        //this.scene.add(boxHelper);

        this.boundingBox = new THREE.Box3().setFromObject(boxHelper);

        // 해당 객체를 화면 중심으로 이동하는 애니메이션 효과
        this.center = this.boundingBox.getCenter(new THREE.Vector3());

        // 오브젝트를 바라보게 설정
        //this.camera.lookAt(boxHelper);



        // 모델을 화면 중앙에 배치하기 위해 카메라와의 거리 계산
        const boundingSphere = new THREE.Sphere();
        this.boundingBox.getBoundingSphere(boundingSphere);
        const radius = boundingSphere.radius;
        const distance = radius * 2; // 모델의 크기에 따라 조절

        // 카메라의 위치를 계산된 거리로 설정하여 모델을 화면 중앙에 배치합니다.
        this.camera.position.copy(this.center.clone().add(new THREE.Vector3(distance, distance, distance)));

        //this.cameraPosition.copy(this.camera.position);
        this.controls.target.copy(this.center);
        this.controls.update(); // controls의 업데이트를 수행

        console.log(this.center);
        console.log(this.camera.position)
        this.controlsGizmo.updateCenter(this.center, this.camera.position);// controls의 업데이트를 수행

        this.Render();

    }


    // 렌더링 화면 모델 선택시 트리에서 하이라이트 하는 효과
    SetActive(object, truefalse) {

        let activeObject = object;

        // object가 존재하지 않는 경우 부모를 참조
        if (!object || !document.getElementById(object.name)) {
            //console.log(object);
            activeObject = object.parent;
        }
        const activeNodeId = activeObject.name;

        const activeNodeElement = document.getElementById(activeNodeId);

        // this.loadedModel.traverse(child => {
        //     if (child.isMesh) {
        //         if (child.uuid === activeNodeId) {
        //             //activeNodeElement = child.uuid;
        //         }
        //     }
        // });

        // 요소가 존재하는지 확인 후 클래스를 조작합니다.
        if (activeNodeElement !== null) {
            if (!activeNodeElement.classList.contains('active')) {
                // 선택한 객체의 클래스를 추가하고 이전에 활성화된 노드의 클래스를 제거
                const activeNodes = document.querySelectorAll('.active');
                activeNodes.forEach(node => {
                    node.classList.remove('active');
                });

                activeNodeElement.classList.add('active');
                if (truefalse) {
                    activeNodeElement.scrollIntoView({
                        behavior: 'auto',
                        block: 'center',
                        inline: 'center'

                    });
                }

                // 여기에서 선택한 객체에 대한 추가 동작을 수행할 수 있습니다.


            } else {
                // 이미 활성화된 객체를 선택한 경우 클래스만 제거
                activeNodeElement.classList.remove('active');

                // 여기에서 선택 취소에 대한 동작을 수행할 수 있습니다.
            }
        } else {

            //console.error(`Element with ID ${activeNodeId} not found.`);
        }
    }

    // 선택한 오브젝트가 Site, Block 단위면 박스 생성
    BoxHelperSelectedObject(renderSelectedObject) {

        //console.log(renderSelectedObject)

        if (!this.selectedObjects.includes(renderSelectedObject)) {
            this.selectedObjects.push(renderSelectedObject);
        }

        //console.log(this.selectedObjects)


        // BoxHelper 제거
        this.scene.children.forEach(child => {
            if (child instanceof THREE.BoxHelper) {
                this.scene.remove(child);
            }
        });

        this.sceneSub.children.forEach(child => {
            if (child instanceof THREE.BoxHelper) {
                this.sceneSub.remove(child);
            }
        });

        // bounding box 정보를 사용하여 Box Helper 생성
        const boxHelper = new THREE.BoxHelper(renderSelectedObject);
        boxHelper.geometry.computeBoundingBox(); // BoxHelper의 geometry를 bounding box에 맞게 업데이트합니다.
        boxHelper.material.depthTest = false; // Depth Test 비활성화
        boxHelper.material.color.setHex(0xFF0000); // BoxHelper의 색상을 설정합니다.


        // BoxHelper 추가
        this.boundingBox = new THREE.Box3().setFromObject(renderSelectedObject);
        const size = new THREE.Vector3();
        this.boundingBox.getSize(size);

        this.scene.add(boxHelper);
        this.sceneSub.add(boxHelper);

        this.Render();

    }

    // previousMaterials에 현재색상 저장후 색상변경
    ChangeColorSelectedObject(selectedObject) {

        // this.scene.children.forEach(child => {
        //     if (child instanceof THREE.BoxHelper) {
        //         this.scene.remove(child);
        //     }
        // });

        // this.sceneSub.children.forEach(child => {
        //     if (child instanceof THREE.BoxHelper) {
        //         this.sceneSub.remove(child);
        //     }
        // });

        // selectedObject.traverse((child) => {
        //     if (child.isMesh) {
        //         // 원래 색상 저장
        //         if (!this.previousMaterials.has(child)) {
        //             this.previousMaterials.set(child, child.material.clone());
        //             //console.log('previouse 저장완료')
        //         }
        //         // 색상을 빨간색으로 변경
        //         child.material.color.setHex(0xFF0000);


        //     }
        // });

        // scene에서 오브젝트 색상 변경
        this.changeObjectColor(selectedObject, 0xFF0000); // 빨간색으로 변경

        // console.log(selectedObject);
        // // sceneSub에서 동일한 이름의 오브젝트를 찾아서 색상 변경
        // const subObject = this.findObjectByName(this.activeScene, selectedObject.name);
        // if (subObject) {
        //     console.log(subObject);
        //     this.changeObjectColor(subObject, 0xFF0000); // 빨간색으로 변경
        // }

        this.Render();
    }

    // 이름으로 오브젝트 찾기
    findObjectByName(scene, name) {
        return scene.getObjectByName(name);
    }

    // 오브젝트의 색상 변경
    changeObjectColor(object, colorHex) {
        object.traverse((child) => {
            if (child.isMesh) {
                //console.log(child);

                // 원래 색상 저장
                if (!this.previousMaterials.has(child)) {
                    this.previousMaterials.set(child, child.material.clone());
                }
                // 색상 변경
                child.material.color.setHex(colorHex);
            }
        });
    }

    // 저장해둔 이전 메시 정보로 복원하고 데이터를 삭제합니다.
    RestoreOriginalMaterials() {
        this.previousMaterials.forEach((previousMaterial, object) => {
            if (object && object.isMesh) {
                object.material = previousMaterial;
            }
        });
        this.previousMaterials.clear();
    }

    // 노드 펼친후에 스크롤 포커스
    SidebarScrollFocus(object) {
        const activeNodeId = object.name;
        const activeNodeElement = document.getElementById(activeNodeId);

        if (!activeNodeElement.classList.contains('focus')) {
            // 선택한 객체의 클래스를 추가하고 이전에 활성화된 노드의 클래스를 제거
            const activeNodes = document.querySelectorAll('.focus');
            activeNodes.forEach(node => {
                node.classList.remove('focus');
            });

            activeNodeElement.classList.add('focus');

            // 여기에서 선택한 객체에 대한 추가 동작을 수행할 수 있습니다.
            activeNodeElement.focus();

        } else {
            // 이미 활성화된 객체를 선택한 경우 클래스만 제거
            activeNodeElement.classList.remove('focus');

            // 여기에서 선택 취소에 대한 동작을 수행할 수 있습니다.
        }

    }

    // 디멘젼 공통 함수 ============================================================================
    // 디멘젼, 그리드 등 라인을 그리는 함수
    DrawLinePoint(strPoint, endPoint) {
        var material = new THREE.LineBasicMaterial({ color: 0x48D1CC });

        // 라인 생성
        var points = [];
        points.push(new THREE.Vector3(strPoint.x, strPoint.y, strPoint.z));  // (FR_GridOffNumber, minLP_Value)
        points.push(new THREE.Vector3(endPoint.x, endPoint.y, endPoint.z));  // (FR_GridOffNumber, maxLP_Value)

        var geometry = new THREE.BufferGeometry().setFromPoints(points);
        //console.log(geometry.attributes.position.array);
        geometry.attributes.position.needsUpdate = true;

        // 라인 객체 생성 및 씬에 추가
        var line = new THREE.Line(geometry, material);
        this.scene.add(line);

        return [line];  // 실제 생성된 라인 객체들을 여기에 넣어 반환
    }

    // 디멘젼 치수, 그리드 라인의 FR,LP 등 센터 위치에 텍스트 생성
    DrawTextDistance(distancemilimeter, disCenter) {

        // 디멘젼 텍스트 생성 (distance)
        var distanceText = new TextSprite(distancemilimeter.toString(), 'Arial', 100, '#48D1CC', 'dimension');
        distanceText.position.copy(disCenter); // 라인의 중앙에 텍스트 위치 조절
        this.scene.add(distanceText);

        return [distanceText];
    }

    // 디멘젼 치수 입력시 3,4번 포인트 좌우에 화살표 헤드 생성
    DrawLineArrow(strPoint, endPoint, distancemilimeter) {

        // 화살표 머리의 크기 설정
        var headLength = 0.02; // 화살표 머리의 길이
        var headRadius = 0.01; // 화살표 머리의 반지름
        var arrowColor = 0x48D1CC; // 화살표의 색상

        if (distancemilimeter >= 150) {

            // 시작점에서 끝점을 향하는 방향 벡터 계산
            var direction = new THREE.Vector3().subVectors(strPoint, endPoint).normalize();

            // 시작점에 화살표 머리 생성
            var startHeadGeometry = new THREE.ConeGeometry(headRadius, headLength, 8);
            var startHeadMaterial = new THREE.MeshBasicMaterial({ color: arrowColor });
            var startHeadMesh = new THREE.Mesh(startHeadGeometry, startHeadMaterial);

            // 화살표 머리의 위치와 방향을 조정
            startHeadMesh.position.copy(new THREE.Vector3().subVectors(strPoint, direction.clone().multiplyScalar(headLength / 2)));
            startHeadMesh.lookAt(new THREE.Vector3().addVectors(startHeadMesh.position, direction));
            startHeadMesh.rotateX(Math.PI / 2); // 화살표 머리가 올바른 방향을 가리키도록 조정
            startHeadMesh.name = 'arrow';

            // 씬에 화살표 머리 추가
            this.scene.add(startHeadMesh);

            /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

            // 끝점에서 시작점을 향하는 방향 벡터 계산
            var reverseDirection = new THREE.Vector3().subVectors(endPoint, strPoint).normalize();

            // 끝점에 화살표 머리 생성
            var endHeadGeometry = new THREE.ConeGeometry(headRadius, headLength, 8);
            var endHeadMaterial = new THREE.MeshBasicMaterial({ color: arrowColor });
            var endHeadMesh = new THREE.Mesh(endHeadGeometry, endHeadMaterial);

            // 화살표 머리의 위치와 방향을 조정
            endHeadMesh.position.copy(new THREE.Vector3().subVectors(endPoint, reverseDirection.clone().multiplyScalar(headLength / 2)));
            endHeadMesh.lookAt(new THREE.Vector3().addVectors(endHeadMesh.position, reverseDirection));
            endHeadMesh.rotateX(Math.PI / 2); // 화살표 머리가 올바른 방향을 가리키도록 조정
            endHeadMesh.name = 'arrow';

            // 씬에 화살표 머리 추가
            this.scene.add(endHeadMesh);

        } else {
            // 시작점에서 끝점을 향하는 방향 벡터 계산
            var direction = new THREE.Vector3().subVectors(endPoint, strPoint).normalize();

            // 시작점에 화살표 머리 생성
            var startHeadGeometry = new THREE.ConeGeometry(headRadius, headLength, 8);
            var startHeadMaterial = new THREE.MeshBasicMaterial({ color: arrowColor });
            var startHeadMesh = new THREE.Mesh(startHeadGeometry, startHeadMaterial);

            // 화살표 머리의 위치와 방향을 조정
            startHeadMesh.position.copy(new THREE.Vector3().subVectors(strPoint, direction.clone().multiplyScalar(headLength / 2)));
            startHeadMesh.lookAt(new THREE.Vector3().addVectors(startHeadMesh.position, direction));
            startHeadMesh.rotateX(Math.PI / 2); // 화살표 머리가 올바른 방향을 가리키도록 조정
            startHeadMesh.name = 'arrow';

            // 씬에 화살표 머리 추가
            this.scene.add(startHeadMesh);

            /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

            // 끝점에서 시작점을 향하는 방향 벡터 계산
            var reverseDirection = new THREE.Vector3().subVectors(strPoint, endPoint).normalize();

            // 끝점에 화살표 머리 생성
            var endHeadGeometry = new THREE.ConeGeometry(headRadius, headLength, 8);
            var endHeadMaterial = new THREE.MeshBasicMaterial({ color: arrowColor });
            var endHeadMesh = new THREE.Mesh(endHeadGeometry, endHeadMaterial);

            // 화살표 머리의 위치와 방향을 조정
            endHeadMesh.position.copy(new THREE.Vector3().subVectors(endPoint, reverseDirection.clone().multiplyScalar(headLength / 2)));
            endHeadMesh.lookAt(new THREE.Vector3().addVectors(endHeadMesh.position, reverseDirection));
            endHeadMesh.rotateX(Math.PI / 2); // 화살표 머리가 올바른 방향을 가리키도록 조정
            endHeadMesh.name = 'arrow';

            // 씬에 화살표 머리 추가
            this.scene.add(endHeadMesh);
        }

        return [startHeadMesh, endHeadMesh];

    }
    // ================================================================================================


    // 오토 디멘젼 (4Point) ============================================================================
    // 오토디멘젼 버튼 클릭시 함수
    AutoDimensionButton() {
        console.log('오토디멘젼 클릭')
        console.log(this.DimensionData);

        const dimensionChk = 'true';

        if (this.autoDimLinesOfObjName && this.autoDimLinesOfObjName[dimensionChk]) {
            // 기존 AutoDimension 제거
            this.autoDimLinesOfObjName[dimensionChk].forEach(line => {
                this.scene.remove(line);
            });

            // 참조 삭제
            delete this.autoDimLinesOfObjName[dimensionChk];
            console.log('기존 AutoDimension 제거됨');
        }
        else {
            this.autoDimLinesOfObjName[dimensionChk] = [];  // 새 라인 참조를 저장할 배열 생성

            // 디멘젼 4Point 데이터 추출하여 디멘젼 생성 함수실행
            this.DimensionData.forEach(points => {
                if (points.length === 4) {
                    // THREE.Vector3 객체로 포인트 변환
                    const autoPoint_1 = new THREE.Vector3(points[0].x, points[0].z, -points[0].y);
                    const autoPoint_2 = new THREE.Vector3(points[1].x, points[1].z, -points[1].y);
                    const autoPoint_3 = new THREE.Vector3(points[2].x, points[2].z, -points[2].y);
                    const autoPoint_4 = new THREE.Vector3(points[3].x, points[3].z, -points[3].y);


                    console.log(autoPoint_4);


                    // DrawAutoDimension을 호출
                    this.DrawAutoDimension(autoPoint_1, autoPoint_2, autoPoint_3, autoPoint_4, dimensionChk);
                    //this.autoDimLinesOfObjName[object].push(...lines);  // 라인 참조 저장
                }
            })
        }



        this.Render();
    }

    // 입력받은 4Point 좌표 데이터 디멘젼 드로잉
    DrawAutoDimension(point_1, point_2, point_3, point_4, dimensionChk) {

        var distance;
        var disCenter;
        var distancemilimeter;

        // point_1과 point_2 사이의 3차원 거리 계산
        distance = point_1.distanceTo(point_2);

        //console.log(distance);
        disCenter = new THREE.Vector3().lerpVectors(point_3, point_4, 0.5); // 두 포인트 사이의 중앙점 계산
        distancemilimeter = Math.round((distance * 1000) / 10) * 10;
        console.log(distancemilimeter);

        //console.log(distancemilimeter)
        if (distancemilimeter > 0) {
            // 사용자가 userPoint3를 제공한 경우
            var direction3 = new THREE.Vector3().subVectors(point_3, point_1).normalize(); // 방향 벡터 계산
            var extendedUserPoint3 = point_3.clone().add(direction3.multiplyScalar(0.1)); // userPoint3에서 방향에 따라 0.2만큼 연장

            // 사용자가 userPoint4를 제공한 경우
            var direction4 = new THREE.Vector3().subVectors(point_4, point_2).normalize(); // 방향 벡터 계산
            var extendedUserPoint4 = point_4.clone().add(direction4.multiplyScalar(0.1)); // userPoint4에서 방향에 따라 0.2만큼 연장

            // 1번 3번 라인
            var lines = this.DrawLinePoint(point_1, extendedUserPoint3);
            this.autoDimLinesOfObjName[dimensionChk].push(...lines);  // 라인 참조 저장

            // 2번 4번 라인
            lines = this.DrawLinePoint(point_2, extendedUserPoint4);
            this.autoDimLinesOfObjName[dimensionChk].push(...lines);  // 라인 참조 저장

            // 3번 4번 라인
            lines = this.DrawLinePoint(point_3, point_4);
            this.autoDimLinesOfObjName[dimensionChk].push(...lines);  // 라인 참조 저장

            // 3번 4번 화살표
            lines = this.DrawLineArrow(point_3, point_4, distancemilimeter);
            this.autoDimLinesOfObjName[dimensionChk].push(...lines);  // 라인 참조 저장

            // distance 값 텍스트
            lines = this.DrawTextDistance(distancemilimeter, disCenter);
            this.autoDimLinesOfObjName[dimensionChk].push(...lines);
        }
    }
    // ==================================================================================================


    // 사용자 디멘젼 (2Point) ============================================================================
    // 사용자 디멘젼 버튼 클릭시 함수
    DimensionButton() {

        // 디멘젼 선택 트리거 true
        this.dim_select = true;

        // 마우스 포인트 crosshair
        document.body.style.cursor = 'crosshair';

        // AM에서 추출된 의미있는 포인트 위치에 심볼 생성
        this.CreateDimPointSimbol()

        console.log('디멘젼 트리거 true')

        this.Render();
    }

    // 사용자 디멘젼시 심볼 생성
    CreateDimPointSimbol() {
        //console.log(this.DimensionPointData);
        this.clickableDimSymbols = [];

        // AM 추출된 포인트 위치 정보로 심볼 생성
        this.DimensionPointData.forEach(coord => {
            //console.log(coord);

            // 심볼 크기 (구 형태)
            const geometry = new THREE.SphereGeometry(0.02, 32, 32);
            // 심볼 색상 및 깊이( false 시 오브젝트에 가려져도 투시됨)
            const material = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                depthTest: false
            });

            // geometry, material로 Mesh 생성
            const dimPointSimbol = new THREE.Mesh(geometry, material);
            dimPointSimbol.position.set(coord.x, coord.z, -coord.y);
            //dimPointSimbol.renderOrder = 1;
            dimPointSimbol.tag = 'dimPointSimbol';
            //console.log(dimPointSimbol);
            // scene에 Mesh 추가 (object)
            this.scene.add(dimPointSimbol);

            // Mesh 정보를 배열에 담은 뒤 scene에서 삭제할 때 배열에 담긴 Mesh만 삭제하려고
            this.clickableDimSymbols.push(dimPointSimbol);

            //console.log(this.clickableDimSymbols);
        })


    }

    // 심볼 삭제
    RemoveDimPointSymbols() {
        // 생성했던 Symbol(Mesh) 정보를 담아두었던 배열 반복하여 scene에서 심볼만 삭제
        this.clickableDimSymbols.forEach(symbol => {
            this.scene.remove(symbol);
        })
        this.clickableDimSymbols = [];

        this.Render();
    }

    // 디멘젼 셋팅 리셋
    ResetDimensionSettings() {

        // 사용자가 화면에서 선택한 심볼 좌표 2개 리셋
        this.first_dim.set(0, 0, 0);
        this.second_dim.set(0, 0, 0);

        // 선택한 Object Mesh 정보 삭제
        this.clickedObjects = [];

        // 트리거 false
        this.dim_select = false;

        // 커서 원래대로
        document.body.style.cursor = 'default';

        // 심볼 삭제
        this.RemoveDimPointSymbols();

        var textbox = document.getElementById('dimensionSelectTextBox');
        textbox.style.display = 'none';

        this.axesPanel.style.display = 'none';

        this.distancePlane.forEach(plane => {
            this.scene.remove(plane);
        })

        this.Render();
    }

    // 축 판넬 New ---------------------------------------------------------- LJK
    // 화면에서 사용자가 2Point 클릭시 실행되는 함수
    DrawDimensionAxesSelect() {
        //var point_3 = new THREE.Vector3();
        //var point_4 = new THREE.Vector3();

        this.axesPanel.style.display = 'block';

        this.axesPanel.addEventListener('click', (event) => {
            const clickedId = event.target.id;
            this.dimensionAxes = clickedId;

            // 2Point 선택 후 3,4번 포인트 빼는 방향 설정
            switch (clickedId) {
                case 'btnDX':
                    console.log('x축');

                    this.axesPanel.style.display = 'none';

                    break;

                case 'btnDY':
                    console.log('-x축');

                    this.axesPanel.style.display = 'none';

                    break;

                case 'btnDZ':
                    console.log('y축');

                    this.axesPanel.style.display = 'none';

                    break;
            }
        })
        this.Render();

    }

    // 축 선택 판넬 Old --------------------------------------------------LJK
    // // 화면에서 사용자가 2Point 클릭시 실행되는 함수
    // DrawDimensionAxesSelect() {
    //     //var point_3 = new THREE.Vector3();
    //     //var point_4 = new THREE.Vector3();

    //     this.axesPanel.style.display = 'block';

    //     this.axesPanel.addEventListener('click', (event) => {
    //         const clickedId = event.target.id;
    //         this.dimensionAxes = clickedId;

    //         // 2Point 선택 후 3,4번 포인트 빼는 방향 설정
    //         switch (clickedId) {
    //             case 'btnPosX':
    //                 console.log('x축');
    //                 point_3 = point_1.clone().add(new THREE.Vector3(0.5, 0, 0));
    //                 point_4 = point_2.clone().add(new THREE.Vector3(0.5, 0, 0));
    //                 this.DrawDimension(point_1, point_2, point_3, point_4, clickedId);
    //                 this.ResetDimensionSettings();

    //                 this.axesPanel.style.display = 'none';

    //                 break;

    //             case 'btnNegX':
    //                 console.log('-x축');
    //                 point_3 = point_1.clone().add(new THREE.Vector3(-0.5, 0, 0));
    //                 point_4 = point_2.clone().add(new THREE.Vector3(-0.5, 0, 0));
    //                 this.DrawDimension(point_1, point_2, point_3, point_4, clickedId);
    //                 this.ResetDimensionSettings();

    //                 this.axesPanel.style.display = 'none';

    //                 break;

    //             case 'btnPosZ':
    //                 console.log('y축');
    //                 point_3 = point_1.clone().add(new THREE.Vector3(0, 0.5, 0));
    //                 point_4 = point_2.clone().add(new THREE.Vector3(0, 0.5, 0));
    //                 this.DrawDimension(point_1, point_2, point_3, point_4, clickedId);
    //                 this.ResetDimensionSettings();

    //                 this.axesPanel.style.display = 'none';

    //                 break;

    //             case 'btnNegZ':
    //                 console.log('-y축');
    //                 point_3 = point_1.clone().add(new THREE.Vector3(0, -0.5, 0));
    //                 point_4 = point_2.clone().add(new THREE.Vector3(0, -0.5, 0));
    //                 this.DrawDimension(point_1, point_2, point_3, point_4, clickedId);
    //                 this.ResetDimensionSettings();

    //                 this.axesPanel.style.display = 'none';

    //                 break;

    //             case 'btnPosY':
    //                 console.log('z축');
    //                 point_3 = point_1.clone().add(new THREE.Vector3(0, 0, 0.5));
    //                 point_4 = point_2.clone().add(new THREE.Vector3(0, 0, 0.5));

    //                 this.DrawDimension(point_1, point_2, point_3, point_4, clickedId);
    //                 this.ResetDimensionSettings();

    //                 this.axesPanel.style.display = 'none';

    //                 break;

    //             case 'btnNegY':
    //                 console.log('-z축');
    //                 point_3 = point_1.clone().add(new THREE.Vector3(0, 0, -0.5));
    //                 point_4 = point_2.clone().add(new THREE.Vector3(0, 0, -0.5));

    //                 this.DrawDimension(point_1, point_2, point_3, point_4, clickedId);
    //                 this.ResetDimensionSettings();

    //                 this.axesPanel.style.display = 'none';

    //                 break;
    //         }
    //     })
    //     this.Render();

    // }


    DrawDistancePlane() {

        // 축 선택 뭐했는지?
        //this.dimensionAxes

        // this.first_dim 과 this.second_dim으로 면을 생성하고
        var direction = new THREE.Vector3().subVectors(this.second_dim, this.first_dim).normalize();
        var disCenter = new THREE.Vector3().lerpVectors(this.first_dim, this.second_dim, 0.5);
        var distance = this.first_dim.distanceTo(this.second_dim);

        // 임의의 수직 벡터
        var normalVector = new THREE.Vector3();

        // // x 축 이동 방향이 y축 이동 방향보다 크면
        // if (Math.abs(direction.x) > Math.abs(direction.z)) {
        //     normalVector.set(-direction.y, 0, direction.x).normalize();
        // } else {
        //     normalVector.set(0, direction.y, -direction.z).normalize();
        // }

        // x, y, z 축 중 가장 큰 값에 따라 normalVector 설정
        if (Math.abs(direction.x) > Math.abs(direction.y) && Math.abs(direction.x) > Math.abs(direction.z)) {
            // x 축이 가장 큰 경우
            normalVector.set(0, 1, 0); // y축을 normalVector로 사용
            //normalVector.set(-direction.y, 0, direction.x).normalize();
        } else if (Math.abs(direction.y) > Math.abs(direction.z)) {
            // y 축이 x 축보다 크고 z 축보다 큰 경우
            normalVector.set(1, 0, 0); // x축을 normalVector로 사용
            //normalVector.set(0, direction.y, -direction.z).normalize();
        } else {
            // z 축이 x 축과 y 축보다 큰 경우
            normalVector.set(0, 1, 0); // y축을 normalVector로 사용
            //normalVector.set(-direction.y, 0, direction.x).normalize();

        }

        normalVector.normalize();
        // 두 번째 수직 벡터 (direction_2)
        var direction_2 = new THREE.Vector3().crossVectors(direction, normalVector).normalize();
        // PlaneGeometry 생성
        var planeGeometry = new THREE.PlaneGeometry(distance, 3);  // 크기는 적절히 조절
        var planeMaterial = new THREE.MeshBasicMaterial({
            color: 0x0067a3,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        });
        var planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
        //planeMesh.visible = false;
        // PlaneGeometry를 Plane의 방향에 맞추어 회전
        planeMesh.lookAt(direction_2);

        // PlaneGeometry의 위치를 point1에 맞춤
        planeMesh.position.copy(disCenter);

        //planeMesh.rotation.x = Math.PI / 2;

        // 씬에 Plane Mesh 추가
        this.scene.add(planeMesh);

        this.distancePlane.push(planeMesh);



        // console.log(planeMesh)
    }

    // 사용자가 2Point와 축을 선택하면, 내부적으로 3,4번 포인트 좌표를 생성한다
    DrawDimension_dxdydz(point_1, point_2, intersectPoint) {

        var distance;
        var disCenter;
        var distancemilimeter;
        var point_3 = point_1.clone();
        var point_4 = point_2.clone();

        distance = point_1.distanceTo(point_2);
        disCenter = new THREE.Vector3().lerpVectors(point_1, point_2, 0.5);
        distancemilimeter = Math.round((distance * 1000) / 10) * 10;

        //this.DrawLinePoint(center, extendedPoint);
        // if (this.dimensionAxes === 'btnPosX' || 'btnNegX') {

        //     point_3.x = intersectPoint.x;
        //     point_4.x = intersectPoint.x;

        //     this.DrawLinePoint(point_1, new THREE.Vector3(point_3.x + 0.1, point_3.y, point_3.z)); 
        //     this.DrawLinePoint(point_2, new THREE.Vector3(point_4.x + 0.1, point_4.y, point_4.z));

        //     this.dimensionAxes = null;
        // }
        // else if (this.dimensionAxes === 'btnNegX') {
        //     this.DrawLinePoint(point_1, new THREE.Vector3(point_3.x - 0.1, point_3.y, point_3.z));
        //     this.DrawLinePoint(point_2, new THREE.Vector3(point_4.x - 0.1, point_4.y, point_4.z));
        // }
        // else if (this.dimensionAxes === 'btnPosZ') {
        //     this.DrawLinePoint(point_1, new THREE.Vector3(point_3.x, point_3.y + 0.1, point_3.z));
        //     this.DrawLinePoint(point_2, new THREE.Vector3(point_4.x, point_4.y + 0.1, point_4.z));
        // }
        // else if (this.dimensionAxes === 'btnNegZ') {
        //     this.DrawLinePoint(point_1, new THREE.Vector3(point_3.x, point_3.y - 0.1, point_3.z));
        //     this.DrawLinePoint(point_2, new THREE.Vector3(point_4.x, point_4.y - 0.1, point_4.z));
        // }
        // else if (this.dimensionAxes === 'btnPosY') {
        //     this.DrawLinePoint(point_1, new THREE.Vector3(point_3.x, point_3.y, point_3.z + 0.1));
        //     this.DrawLinePoint(point_2, new THREE.Vector3(point_4.x, point_4.y, point_4.z + 0.1));
        // }
        // else if (this.dimensionAxes === 'btnNegY') {
        //     this.DrawLinePoint(point_1, new THREE.Vector3(point_3.x, point_3.y, point_3.z - 0.1));
        //     this.DrawLinePoint(point_2, new THREE.Vector3(point_4.x, point_4.y, point_4.z - 0.1));
        // }

        //console.log('point_3: ', point_3)
        //console.log('point_4: ', point_4)

        // ============================================================================================ 살려
        // point_3.x = intersectPoint.x;
        // point_4.x = intersectPoint.x;

        //point_3 = intersectPoint;
        //point_4 = intersectPoint;



        // var direction = new THREE.Vector3().subVectors(this.second_dim, this.first_dim).normalize();

        // var distance = 1;
        // var point_3 = new THREE.Vector3().addVectors(intersectPoint, direction.clone().multiplyScalar(-distance));
        // var point_4 = new THREE.Vector3().addVectors(intersectPoint, direction.clone().multiplyScalar(distance));


        // point_1과 point_2를 잇는 방향 벡터
        var lineDirection = new THREE.Vector3().subVectors(point_2, point_1).normalize();

        // 면의 정규 벡터 계산
        var planeNormal = new THREE.Vector3(0, 1, 0); // 예시로 Y축을 사용
        if (planeNormal.dot(lineDirection) === 1) {
            planeNormal.set(1, 0, 0); // lineDirection과 평행한 경우, 다른 기준 벡터 사용
        }

        // disCenter에서 intersectPoint까지의 벡터 계산
        var moveVector = new THREE.Vector3().subVectors(intersectPoint, disCenter);

        // point_3과 point_4 계산
        var point_3 = new THREE.Vector3().addVectors(point_1, moveVector);
        var point_4 = new THREE.Vector3().addVectors(point_2, moveVector);

        var extendedPoint = new THREE.Vector3().lerpVectors(point_3, point_4, 0.5);

        // this.DrawLinePoint(point_1, new THREE.Vector3(point_3.x+0.1, point_3.y, point_3.z));
        // this.DrawLinePoint(point_2, new THREE.Vector3(point_4.x+0.1, point_4.y, point_4.z));

        var direction3 = new THREE.Vector3().subVectors(point_3, point_1).normalize(); // 방향 벡터 계산
        var extendedUserPoint3 = point_3.clone().add(direction3.multiplyScalar(0.1));

        var direction4 = new THREE.Vector3().subVectors(point_4, point_2).normalize(); // 방향 벡터 계산
        var extendedUserPoint4 = point_4.clone().add(direction4.multiplyScalar(0.1));

        this.DrawLinePoint(point_1, extendedUserPoint3);
        this.DrawLinePoint(point_2, extendedUserPoint4);

        this.DrawLinePoint(point_3, point_4);
        this.DrawLineArrow(point_3, point_4, distancemilimeter);
        this.DrawTextDistance(distancemilimeter, extendedPoint);

        this.ResetDimensionSettings();
        this.Render();

    }

    // 축 선택해서 디멘젼 그리는 함수 (현재 사용안함)
    DrawDimension(point_1, point_2, point_3, point_4, clickedId) {

        //console.log(this.clickedObjects);

        this.scene.children.forEach(child => {
            if (child instanceof THREE.BoxHelper) {
                this.scene.remove(child);
            }
        });

        // 첫 번째와 두 번째 객체의 경계 상자를 계산합니다.
        const box1 = new THREE.Box3().setFromObject(this.clickedObjects[0]);
        const box2 = new THREE.Box3().setFromObject(this.clickedObjects[1]);

        // 두 경계 상자를 합쳐 새로운 경계 상자를 생성합니다.
        const unionBox = box1.union(box2);

        // 합쳐진 경계 상자를 기반으로 BoxHelper를 생성하고 씬에 추가합니다.
        const boxHelper = new THREE.BoxHelper(new THREE.Mesh(new THREE.BoxGeometry()), 0xFF0000);
        boxHelper.box = unionBox; // BoxHelper에 합쳐진 경계 상자를 설정합니다.
        boxHelper.update(); // BoxHelper를 업데이트하여 새로운 상자를 반영합니다.
        this.scene.add(boxHelper);

        // boxHelper의 Box3 객체를 가져옵니다.
        const box = boxHelper.box;

        // Box3 객체의 중심점을 계산합니다.
        const center = new THREE.Vector3();

        box.getCenter(center);

        var distance;
        //var disCenter;
        var distancemilimeter;

        distance = point_1.distanceTo(point_2);
        //disCenter = new THREE.Vector3().lerpVectors(point_1, point_2, 0.5);
        distancemilimeter = Math.round((distance * 1000) / 10) * 10;

        console.log('point_3: ', point_3)
        console.log('point_4: ', point_4)

        var extendedPoint = new THREE.Vector3().lerpVectors(point_3, point_4, 0.5);

        //this.DrawLinePoint(center, extendedPoint);
        if (clickedId === 'btnPosX') {
            this.DrawLinePoint(point_1, new THREE.Vector3(point_3.x + 0.1, point_3.y, point_3.z));
            this.DrawLinePoint(point_2, new THREE.Vector3(point_4.x + 0.1, point_4.y, point_4.z));
        }
        else if (clickedId === 'btnNegX') {
            this.DrawLinePoint(point_1, new THREE.Vector3(point_3.x - 0.1, point_3.y, point_3.z));
            this.DrawLinePoint(point_2, new THREE.Vector3(point_4.x - 0.1, point_4.y, point_4.z));
        }
        else if (clickedId === 'btnPosZ') {
            this.DrawLinePoint(point_1, new THREE.Vector3(point_3.x, point_3.y + 0.1, point_3.z));
            this.DrawLinePoint(point_2, new THREE.Vector3(point_4.x, point_4.y + 0.1, point_4.z));
        }
        else if (clickedId === 'btnNegZ') {
            this.DrawLinePoint(point_1, new THREE.Vector3(point_3.x, point_3.y - 0.1, point_3.z));
            this.DrawLinePoint(point_2, new THREE.Vector3(point_4.x, point_4.y - 0.1, point_4.z));
        }
        else if (clickedId === 'btnPosY') {
            this.DrawLinePoint(point_1, new THREE.Vector3(point_3.x, point_3.y, point_3.z + 0.1));
            this.DrawLinePoint(point_2, new THREE.Vector3(point_4.x, point_4.y, point_4.z + 0.1));
        }
        else if (clickedId === 'btnNegY') {
            this.DrawLinePoint(point_1, new THREE.Vector3(point_3.x, point_3.y, point_3.z - 0.1));
            this.DrawLinePoint(point_2, new THREE.Vector3(point_4.x, point_4.y, point_4.z - 0.1));
        }

        this.DrawLinePoint(point_3, point_4);
        this.DrawLineArrow(point_3, point_4, distancemilimeter);
        this.DrawTextDistance(distancemilimeter, extendedPoint);

    }

    // 노트 관련 함수
    AddNote() {
        // const userText = prompt('텍스트를 입력해주세요');
        // if (userText) {
        //     this.container.addEventListener('click', (event) => {
        //         // 마우스 클릭 위치를 계산합니다.
        //         const rect = this.renderer.domElement.getBoundingClientRect();
        //         const mouseX = ((event.clientX - rect.left) / (rect.right - rect.left)) * 2 - 1;
        //         const mouseY = -((event.clientY - rect.top) / (rect.bottom - rect.top)) * 2 + 1;

        //         // Raycaster를 생성하여 마우스 위치로부터 광선을 쏩니다.
        //         this.raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), this.camera);

        //         // 광선이 평면과 교차하는지 확인합니다. 여기서는 z=0인 평면으로 계산합니다.
        //         //const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        //         //const intersection = new THREE.Vector3();
        //         const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        //         //this.raycaster.ray.intersectPlane(plane, intersection);
        //         // 모델 중심을 기준으로 일정 거리만큼 떨어진 위치를 계산합니다.
        //         const distanceFromCenter = 30; // 라벨이 모델 중심에서 떨어진 거리
        //         const offsetVector = new THREE.Vector3().subVectors(intersects[0].object.position, this.center).normalize().multiplyScalar(distanceFromCenter);
        //         const labelPosition = new THREE.Vector3().addVectors(this.center, offsetVector);


        //         // 라벨까지의 선을 생성합니다.
        //         // const lineGeometry = new THREE.BufferGeometry().setFromPoints([intersects.position, labelPosition]);

        //         // 레이캐스팅된 객체와 라벨 사이의 선을 그리기 위한 버퍼 지오메트리를 생성합니다.
        //         const lineGeometry = new THREE.geometry();

        //         // 시작점과 끝점의 좌표를 버퍼로 만듭니다.
        //         const positions = [];
        //         positions.push(intersects[0].point.x, intersects[0].point.y, intersects[0].point.z); // 객체의 위치
        //         positions.push(labelPosition.x, labelPosition.y, labelPosition.z); // 라벨의 위치

        //         const vertices = new Float32Array(positions);

        //         // position 속성에 버퍼를 할당합니다.
        //         lineGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

        //         const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        //         const line = new THREE.Line(lineGeometry, lineMaterial);
        //         this.scene.add(line);


        //         // TextSprite를 생성하고 마우스 클릭 위치에 라벨을 추가합니다.
        //         const textSprite = new TextSprite(userText, 'Arial', 500, 'white');
        //         textSprite.position.copy(labelPosition);
        //         this.scene.add(textSprite);

        //     }, { once: true });
        // }
    }

    // 속성 데이터 입력
    // AttributeInput(object) {

    //     // some(): foreach와 다르게 중간에 멈출 수 있음.
    //     // 필요한 값 찾으면 return true로 멈춤.
    //     this.dataList.some(datarow => {
    //         const objNameReplace = '/' + object.name;

    //         if (datarow.AM_NAME === objNameReplace) {
    //             this.dataRow = datarow;
    //             return true;
    //         }
    //         else {
    //             return false;
    //         }
    //     })
    //     this.AttributePanel();
    // }

    // 선체쪽 오브젝트인지 검사
    FindParentWithBlock(object) {
        if (!object.parent) {
            return null;
        }

        if (object.parent.tag === 'BLOCK') {
            return object
        }

        return this.FindParentWithBlock(object.parent);
    }

    // 트리에서 클릭시 DB에서 해당 Object 데이터 가져와서 출력
    AttributeInputWithObjectName(object) {

        // 선택한 오브젝트가 선체쪽인지
        const blockObject = this.FindParentWithBlock(object);

        //console.log(blockObject);

        if (blockObject) {
            // 클라이언트가 선택한 object.name 을 db상 AM_NAME과 맞춤
            const objNameAtDB = object.name;
            var key = '';
            var value = '';
            this.dataRow = {};

            //some(): foreach와 다르게 중간에 멈출 수 있음.
            // 필요한 값 찾으면 return true로 멈춤.
            this.dataList_Block.some(datarow => {

                const newDBname = datarow.Name.replace(/\//g, '');

                if (newDBname === objNameAtDB) {
                    Object.keys(datarow).forEach(index => {
                        // datarow에서 컬럼이 null이 아닌것만 찾아서 dataRow에 입력
                        if (datarow[index] !== null) {

                            key = index;
                            value = datarow[index];

                            this.dataRow[key] = value;
                        }
                    })
                    //console.log(this.dataRow);
                    return true;
                }
                else {
                    return false;
                }
            })
        }
        else {
            // 클라이언트가 선택한 object.name 을 db상 AM_NAME과 맞춤
            const objNameAtDB = object.name;
            var key = '';
            var value = '';
            this.dataRow = {};

            //some(): foreach와 다르게 중간에 멈출 수 있음.
            // 필요한 값 찾으면 return true로 멈춤.
            this.dataList.some(datarow => {

                const newDBname = datarow.Name.replace(/\//g, '');

                if (newDBname === objNameAtDB) {
                    Object.keys(datarow).forEach(index => {
                        // datarow에서 컬럼이 null이 아닌것만 찾아서 dataRow에 입력
                        if (datarow[index] !== null) {

                            key = index;
                            value = datarow[index];

                            this.dataRow[key] = value;
                        }
                    })
                    //console.log(this.dataRow);
                    return true;
                }
                else {
                    return false;
                }
            })
        }

        // 속성 판넬 DB 데이터 그리기
        this.AttributePanel();
    }

    // 속성 판넬 켜고 끄기
    AttributePanelChk() {
        if (this.attributeZone.style.display === 'none') {
            this.attributeZone.style.display = '';
            this.AttributePanel();
        }
        else {
            this.attributeZone.style.display = 'none';
        }
    }

    // 속성 판넬 안 document + DB 데이터 그리기
    AttributePanel() {

        //console.log(attributeDataRow);

        this.attributeInner.innerHTML = '';

        let attributeTable = document.createElement('table');
        let tbody = document.createElement('tbody');
        tbody.classList.add('attribute-title-border')

        attributeTable.appendChild(tbody);

        this.attributeInner.appendChild(attributeTable);

        // console.log(this.dataRow.Block);
        // console.log(this.dataRow);

        for (let key in this.dataRow) {
            if (this.dataRow.hasOwnProperty(key)) {

                // key(컬럼명)와 value(값) 구하기
                let value = this.dataRow[key];

                // 테이블 행(tr)과 셀(td) 생성
                let row = document.createElement('tr');
                let keyCell = document.createElement('td');
                let valueCell = document.createElement('td');

                // 컬럼명과 값 셀에 추가
                keyCell.textContent = key;
                valueCell.textContent = value;

                // 행에 컬럼명과 값 셀 추가
                row.appendChild(keyCell);
                row.appendChild(valueCell);

                // 행을 테이블 본문에 추가
                tbody.appendChild(row);
            }
        }
    }

    // 속성 데이터 입력
    // PartListInput(object) {

    //     this.partList_SUM = {};
    //     this.partList_select = [];

    //     const objNameReplace = '/' + object.name;

    //     var key = "";

    //     this.partList_All.filter(rowArray => {

    //         if (rowArray.PARENT === objNameReplace) {

    //             this.partList_select.push(rowArray);
    //         }
    //     })

    //     this.partList_select.map(rowMerge => {

    //         key = `${rowMerge.DESCRIPT} + ${rowMerge.SIZE} + ${rowMerge.MATERIAL} + ${rowMerge.QTY} + ${rowMerge.WEIGHT}`;

    //         if (key in this.partList_SUM) {
    //             this.partList_SUM[key].QTY += rowMerge.QTY;
    //             this.partList_SUM[key].WEIGHT += rowMerge.WEIGHT;
    //         }
    //         else {
    //             this.partList_SUM[key] = { ...rowMerge };
    //         }
    //     })

    //     this.PartListPanel(!this.isEmptyObject(this.partList_SUM));
    // }

    PartListInputWithObjectParentName(object) {
        // 클라이언트가 선택한 object.name 을 db상 AM_NAME과 맞춤
        const objNameAtDB = '/' + object.name;

        //console.log(objNameAtDB);

        // fetch 주소로 쿼리에 사용할 objectName post.
        fetch('http://43.202.236.145:5501/src/blocks/fetchPartListDataWithObjectParentName', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ objectParentName: objNameAtDB }),
        })
            .then(data => {
                return data.json()
            })
            .then(res => {
                // 객체 초기화 작업
                this.partListDataWithObjParentName = [];
                this.partList_SUM = [];
                var key = "";

                // db에서 쿼리한 데이터 리스트형태로 저장
                this.partListDataWithObjParentName = res;

                // partList rowData merge 작업
                this.partListDataWithObjParentName.map(rowMerge => {

                    // DESC, SIZE, MAT, QTY, WEIGHT 비교해서 key값 생성
                    // key가 같으면 같은 파트 로직
                    key = `${rowMerge.DESCRIPT} + ${rowMerge.SIZE} + ${rowMerge.MATERIAL} + ${rowMerge.QTY} + ${rowMerge.WEIGHT}`;

                    // key값이 같은 파트끼리 partList_SUM에 리스트 형태로 저장, QTY와 WEIGHT는 merge
                    if (key in this.partList_SUM) {
                        this.partList_SUM[key].QTY += rowMerge.QTY;
                        this.partList_SUM[key].WEIGHT += rowMerge.WEIGHT;
                    }
                    else {
                        this.partList_SUM[key] = { ...rowMerge };
                    }
                })

                this.PartListPanel();
            })
    }

    // 객체가 비어있는지 확인하는 함수, 비어있으면 true, 그렇지 않으면 false
    isEmptyObject(obj) {
        if (obj.constructor === Object
            && Object.keys(obj).length === 0) {
            return true;
        }
        return false;
    }

    // 파트리스트 버튼 클릭시 판넬 On/Off, 파트리스트 객체 체크해서 선택된게 있으면 그리면서 판넬을 On 한다.
    PartListPanelChk() {
        if (this.partlistZone.style.display === 'none') {
            this.partlistZone.style.display = '';
            //this.PartListPanel();
        }
        else {
            this.partlistZone.style.display = 'none';
        }
    }

    // 파트리스트 테이블 그리는 함수. 선택된 object의 저장된 객체가 있으면 자식을 그린다.
    PartListPanel() {

        this.partListInner.innerHTML = '';

        let partlistTable = document.createElement('table');
        let thead = document.createElement('thead');
        let tbody = document.createElement('tbody');

        partlistTable.appendChild(thead);
        partlistTable.appendChild(tbody);

        this.partListInner.appendChild(partlistTable);

        // row1 생성
        let row_1 = document.createElement('tr');
        row_1.classList.add('partlist-title-border');

        // row1_column1 생성
        let row_1_BlockNo = document.createElement('td');
        row_1_BlockNo.classList.add('attTable-title');
        row_1_BlockNo.style.width = "50px";
        row_1_BlockNo.innerHTML = "NO";

        // row1_column2 생성
        let row_1_DESC = document.createElement('td');
        row_1_DESC.classList.add('attTable-title');
        row_1_DESC.style.width = "150px";
        row_1_DESC.innerHTML = "DESC"

        // row1_column1 생성
        let row_1_SIZE = document.createElement('td');
        row_1_SIZE.classList.add('attTable-title');
        row_1_SIZE.style.width = "100px";
        row_1_SIZE.innerHTML = "SIZE";

        // row1_column2 생성
        let row_1_MATERIAL = document.createElement('td');
        row_1_MATERIAL.classList.add('attTable-title');
        row_1_MATERIAL.style.width = "100px";
        row_1_MATERIAL.innerHTML = "MAT"

        // row1_column1 생성
        let row_1_QTY = document.createElement('td');
        row_1_QTY.classList.add('attTable-title');
        row_1_QTY.style.width = "100px";
        row_1_QTY.innerHTML = "QTY";

        // row1_column2 생성
        let row_1_WEIGHT = document.createElement('td');
        row_1_WEIGHT.classList.add('attTable-title');
        row_1_WEIGHT.style.width = "100px";
        row_1_WEIGHT.innerHTML = "WEIGHT"

        row_1.appendChild(row_1_BlockNo);
        row_1.appendChild(row_1_DESC);
        row_1.appendChild(row_1_SIZE);
        row_1.appendChild(row_1_MATERIAL);
        row_1.appendChild(row_1_QTY);
        row_1.appendChild(row_1_WEIGHT);

        tbody.appendChild(row_1);

        if (!this.isEmptyObject(this.partList_SUM)) {
            let row = 0;

            Object.keys(this.partList_SUM).forEach(part_dict_key => {

                row++;

                let part_dict_row = document.createElement('tr');
                part_dict_row.classList.add('table-border-bottom');

                let td_NO = document.createElement('td');
                td_NO.innerHTML = row;

                let td_DESC = document.createElement('td');
                td_DESC.innerHTML = this.partList_SUM[part_dict_key].DESCRIPT;

                let td_SIZE = document.createElement('td');
                td_SIZE.innerHTML = this.partList_SUM[part_dict_key].SIZE;

                let td_MAT = document.createElement('td');
                td_MAT.innerHTML = this.partList_SUM[part_dict_key].MATERIAL;

                let td_QTY = document.createElement('td');
                td_QTY.innerHTML = this.partList_SUM[part_dict_key].QTY;

                let td_WEIGHT = document.createElement('td');
                td_WEIGHT.innerHTML = this.partList_SUM[part_dict_key].WEIGHT + ' KG';

                part_dict_row.appendChild(td_NO);
                part_dict_row.appendChild(td_DESC);
                part_dict_row.appendChild(td_SIZE);
                part_dict_row.appendChild(td_MAT);
                part_dict_row.appendChild(td_QTY);
                part_dict_row.appendChild(td_WEIGHT);

                tbody.appendChild(part_dict_row);
            })
        }

    }

    ColorPanelChk() {

        this.colorPicker = document.getElementById("color-picker");

        if (this.colorPicker.style.display === 'none') {
            this.colorPicker.style.display = '';
        }
        else {
            this.colorPicker.style.display = 'none';
        }
    }

    ColorPicker(event) {
        var colors = {
            'color-blue': 0x199CAA,
            'color-red': 0xB518B5,
            'color-yellow': 0xffff00,
            'color-green': 0x00ff00,
            'color-white': 0xffffff,
            'color-reset': 0x000000
        };

        this.RestoreOriginalMaterials();
        this.selectedObjects[0].traverse((child) => {
            if (child.isMesh) {

                if (event.target.id !== 'color-reset') {
                    child.material.color.setHex(colors[event.target.id]);
                }
                else {
                    child.material = this.originalMaterials.get(child);
                }
            }
        });
        this.Render();
    }

    OriginalMaterialSave() {
        this.scene.traverse((child) => {
            if (child.isMesh) {
                if (!this.originalMaterials.has(child)) {
                    this.originalMaterials.set(child, child.material.clone());
                }
            }
        })
    }

    // 음영 선택
    // MaterialSelect() {
    //     this.scene.traverse((child) => {
    //         if (child.isMesh) {
    //             child.material.wireframe = true;
    //         }
    //     })
    // }

    // 원근/평행 전환
    // CameraChange() {
    //     if (this.camera === this.perspectiveCamera) {
    //         this.camera = this.orthographicCamera;
    //     } else {
    //         this.camera = this.perspectiveCamera;
    //     }

    //     this.renderer.render(this.scene, this.camera)
    // }
    ShowLoading() {
        document.getElementById('loadingIndicator').style.display = 'block';
        document.getElementById('loadingOverlay').style.display = 'block';
    }

    HideLoading() {
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    OnWindowResize() {
        //this.camera.updateProjectionMatrix();
        //this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;

        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.camera.updateProjectionMatrix();


        this.Render();
    }

    Render = () => {

        //console.log('this.center: ',this.center);
        //console.log('this.controls.target: ',this.controls.target);

        var beginTime = (performance || Date).now(), prevTime = beginTime, frames = 0;

        frames++;

        const distance = this.camera.position.distanceTo(this.controls.target);

        //console.log(distance);

        if (distance < 20 || this.sceneFix) {
            //this.scene.visible = true;
            this.activeScene = this.scene;
            //this.sceneSub.visible = false;


        } else {
            //this.sceneSub.visible = true;
            this.activeScene = this.sceneSub;
            //this.scene.visible = false;
        }

        // 렌더링 수행

        //this.camera.position.copy(this.cameraPosition);
        this.renderer.render(this.activeScene, this.camera);
        // if(!(this.cameraPosition.x === 0 && this.cameraPosition.y === 0 && this.cameraPosition.z === 0)){
        //     this.camera.position.copy(this.cameraPosition);
        //     this.renderer.render(this.activeScene, this.camera);
        //     this.cameraPosition.copy(new THREE.Vector3());
        // }

        //console.log(this.camera.position)
        // 프레임타임 계산
        const time = (performance || Date).now();

        let msTime = Math.max(0, (time - beginTime));

        // 프레임 타임을 밀리초 단위로 변환하여 표시
        const msTimeElement = document.getElementById('Frametime');
        msTimeElement.innerHTML = `${msTime.toFixed(0)} ms`;

        //if( time >= prevTime + 1000){

        // FPS 계산 및 표시
        const fps = Math.min(1000, (frames * 1000) / (time - prevTime));
        const fpsElement = document.getElementById('FPS');
        fpsElement.innerHTML = `FPS: ${fps.toFixed(0)}`;

        //console.log('fps: ', fps);
        //console.log('ms:', msTime);

        prevTime = time;
        frames = 0;
        //}

    }

}

window.onload = function () {
    new App();
};