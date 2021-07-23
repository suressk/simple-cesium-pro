# vue-cesium-demo

[toc]

## 环境

> @vue/cli 4.5.7
> vue 2.6.11
> Cesium.js 1.74 / 1.75

## 注意

**`先去 Cesium ion 去注册一个账号，然后获取 Token (本人的 Token 会从这个示例项目中删除)`**

## 加载

1. 资源准备

    ```js
    // 引入
    import * as Cesium from "cesium"; // cesium
    import "cesium/Build/Cesium/Widgets/widgets.css"; // 样式

    import { ACCESS_TOKEN } from "./cesium-token"; // cesium ion 注册账号 获取 AccessToken
    import { jsonFlightData } from "./flightData"; // 此 data 是 cesium 官网 3D Model 那块儿的 json 数据
    window.CESIUM_BASE_URL = "/"; // 必须，否则无法加载图源
    Cesium.Ion.defaultAccessToken = ACCESS_TOKEN; // 必须，否则无法加载图源
    const flightData = JSON.parse(jsonFlightData);
    ```

2. 初始化视图

    ```js
    // Cesium 1.74 / 1.75 版
    const viewer = new Cesium.Viewer("cesiumContainer", {
        // 要使用的地形提供商 - 使用此配置，会致使地形高度海拔转换笛卡尔坐标时，
        // 出现高度基准错误（大致在地形上低 1900m 左右）
        // terrainProvider: Cesium.createWorldTerrain(),
        animation: false, // 不会动画控制小部件（左下角圆盘控制控件）
        baseLayerPicker: false, // 不创建选择地图类型的小部件
        fullscreenButton: true, // 全屏按钮
        vrButton: false, // VR 按钮(双屏展示)
        geocoder: false, // 不创建搜索按钮
        homeButton: false, // 不创建主页按钮
        infoBox: false, // 不创建 viewer.entities 添加的描述信息 box
        sceneModePicker: false, // 不创建 3D - 2.5D - 2D 视图选择按钮
        selectionIndicator: false,
        timeline: false, // 不创建时间线控件
        navigationHelpButton: false, // 不创建导航帮助按钮
        scene3DOnly: true, // 仅展示 3D 视图; sceneModePicker 置为 true 会报错
    });
    window.$$map.viewer = viewer; // 挂载到 window 上
    ```

3. webpack 配置

    这里是 vue-cli 创建的 vue 项目，因而在项目根目录创建 `vueconfig.js` 文件，配置如下：

    ```js
    const path = require("path");
    const CopyWebpackPlugin = require("copy-webpack-plugin");
    const cesiumPath = "node_modules/cesium/Build/Cesium";

    module.exports = {
        configureWebpack: {
            resolve: {
                alias: {
                    "@": path.join(__dirname, "/src")
                }
            },
            plugins: [
                new CopyWebpackPlugin({
                    patterns: [
                        {
                            from: path.join(__dirname, cesiumPath, "Workers"),
                            to: "Workers"
                        },
                        {
                            from: path.join(__dirname, cesiumPath, "ThirdParty"),
                            to: "ThirdParty"
                        },
                        { from: path.join(__dirname, cesiumPath, "Assets"), to: "Assets" },
                        { from: path.join(__dirname, cesiumPath, "Widgets"), to: "Widgets" }
                    ]
                })
            ]
        }
    };
    ```

4. 视角位置

    ```js
    // Cesium.Cartesian3.fromDegrees() - 由经纬度、海拔生成笛卡尔坐标位置点（坐标原点在地球球心）
    // 相机飞至起始位置点
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
            flightData[0].longitude,
            flightData[0].latitude,
            flightData[0].altitude + 100
        )
    });

    // viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY); // 相机视角不跟随，变为整个地图可移动

    // 动画起始，结束时间 (type: JulianDate)
    const startTime = Cesium.JulianDate.fromDate(new Date("2020-10-08T16:40:23Z"));
    const stopTime = Cesium.JulianDate.addSeconds(
        startTime,
        totalTimeInterval, // 总时间间隔（单位：s）
        new Cesium.JulianDate() // 返回值
    );
    // 设置视图钟表起始，结束时间
    viewer.clock.startTime = startTime.clone();
    viewer.clock.stopTime = stopTime.clone();
    viewer.clock.currentTime = startTime.clone(); // 当前时间
    viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; // 播放到结束停止播放
    viewer.timeline.zoomTo(startTime, stopTime); // 时间线区间
    viewer.clock.multiplier = 50; // 倍速播放动画
    viewer.clock.shouldAnimate = false; // 加载完成自动播放动画 - 否
    ```

5. 创建 3D 模型实例

    ```js
    // computePositionProperty() 见下文 `计算位置数据，航线，飞机航向`
    const positionProperty = computePositionProperty(
        startTime,
        flightData
    );
    /**
     * 添加飞机实体
     * @params {*} startTime 起始时间 :JulianDate
     * @params {*} stopTime 结束时间 :JulianDate
     * @params {*} modelUri 飞机模型文件路径 (.gltf文件或 .glb文件)
     * @params {*} positionProperty 每个时间点的位置属性对象
     * @params {*} orientationProperty 根据每个时间点的位置属性对象计算得到的飞机姿态对象
     */
    function addAirplaneEntity(startTime, stopTime, modelUri, positionProperty, orientationProperty) {
        // 可根据位置属性计算得到
        orientationProperty =
            orientationProperty === undefined
            ? new Cesium.VelocityOrientationProperty(positionProperty)
            : orientationProperty;
        return window.$$map.viewer.entities.add({
            // 同步模型与进度条的时间
            availability: new Cesium.TimeIntervalCollection([
                new Cesium.TimeInterval({
                    start: startTime,
                    stop: stopTime
                })
            ]),
            position: positionProperty,
            orientation: orientationProperty,
            model: {
                uri: modelUri,
                scale: 1,
                loop: Cesium.ModelAnimationLoop.NONE
            }
        });
    },
    // 创建飞机模型实体
    const airplaneEntity = addAirplaneEntity(
        startTime,
        stopTime,
        positionProperty,
        new Cesium.VelocityOrientationProperty(positionProperty)
    );
    // 设置相机当前跟踪的 Entity 实例
    window.$$map.viewer.trackedEntity = airplaneEntity;
    ```

    ```js
    // 添加航线实体
    // 单独创建，是因为有第一人称视角的展示需求，否则隐藏飞机实体时，航线也会一起隐藏
    function addAirRouteEntity(startTime, stopTime, positionProperty) {
        return window.$$map.viewer.entities.add({
            availability: new Cesium.TimeIntervalCollection([
                new Cesium.TimeInterval({
                    start: startTime,
                    stop: stopTime
                })
            ]),
            position: positionProperty,
            path: new Cesium.PathGraphics({
                width: 3,
                material: Cesium.Color.GREENYELLOW
            })
        });
    }

    const airRouteEntity = addAirRouteEntity(
        startTime,
        stopTime,
        positionProperty
    );
    window.$$map.airRouteEntity = airRouteEntity;


    // 视图添加 .gltf 创建的 3D 飞机模型
    window.$airplaneModel = viewer.scene.primitives.add(
        Cesium.Model.fromGltf({
            id: "plane",
            url: "/source/models/Air_xxx.gltf",
            clampAnimations: true, // 非关键帧上保持姿势
            minimumPixelSize: 128, // 在视图区的最小像素值（若缩放地图导致其小于此值，则会将它等比放大，保持为此值大小）
            loop: Cesium.ModelAnimationLoop.NONE
        })
    );
    // 飞机模型加载完成
    window.$airplaneModel.readyPromise.then(model => {
        // 添加动画等操作
        model.activeAnimations.add({
            name: "up",
            startTime: upStartTime, // 动画开始时间，JulianDate 类型
            delay: 0.0,
            stopTime: upStopTime, // 动画结束时间，JulianDate 类型
            multiplier: 1.0,
            loop: Cesium.ModelAnimationLoop.NONE
        });
        // ... others
    });
    ```

6. 根据浏览器刷新频率，此事件会在满足刷新的条件下不断触发

    ```js
    // requestAnimationFragment 刷新页面时不断触发
    viewer.clock.onTick.addEventListener(clock => {
        // 因为目前有第一视角的需求
        // 因而我的初步想法是可以在此回调函数中设置 camera.setView()，从而不断去更新视角位置

        // 后来因为从官网拿到的数据，计算 heading，pitch，roll 有点阻碍
        // 所以换用 viewer.camera.lookAtTransform(); 来跟随实体更新视角位置实现
        // 此功能完整代码放在 ·第一人称视角实现· 部分书写
    });
    ```

7. 计算位置数据，航线，飞机航向

    ```js
    /**
     * 计算航线数据（时间点对应的位置点数据）
     * @params {*} startTime 起始时间 :Cesium.JulianDate
     * @params {*} records 飞行数据 :Array
    *  {dateTime, longitude, latitude, height}
    */
    function computePositionProperty(startTime, records) {
        const vm = this;
        let property = new Cesium.SampledPositionProperty();
        records.forEach((item, i) => {
            const time = Cesium.JulianDate.fromDate(new Date(item.dateTime));
            const position = Cesium.Cartesian3.fromDegrees(
                item.longitude,
                item.latitude,
                item.height || 0
            );
            property.addSample(time, position);
        });
        return property;
    }

    /**
     * 计算航向（飞机姿态数据）根据已有的 heading, pitch, roll 数据
     * @params {*} startTime 起始时间 :Cesium.JulianDate
     * @params {*} records 飞行数据 :Array
     * {dateTime, heading, pitch, roll}
    */
    function computeQuaternion(startTime, records) {
        // Cesium.Quaternion - 一组四维坐标(x, y, z , w)，表示三维空间中的旋转
        let property = new Cesium.SampledProperty(Cesium.Quaternion);
        records.forEach(item => {
            const time = Cesium.JulianDate.fromDate(new Date(item.dateTime));
            // 以度为单位的角度返回一个新的 HeadingPitchRoll 实例 - 飞机姿态数据
            const headingPitchRoll = Cesium.HeadingPitchRoll.fromDegrees(
                item.heading,
                item.pitch,
                item.roll
            );
            // 根据给定的航向，俯仰和横滚角计算旋转角度
            const quaternion = Cesium.Quaternion.fromHeadingPitchRoll(headingPitchRoll);
            property.addSample(time, quaternion);
        });
        return property;
    }
    ```

8. 辅助功能

    ```js
    // 可视区范围内根据实际地形添加简易的建筑物实体
    viewer.scene.primitives.add(Cesium.createOsmBuildings()); // Cesium 1.70 版新增
    // 启用深度测试，地形遮挡到的东西（航线、建筑等）隐藏在地形之后
    viewer.scene.globe.depthTestAgainstTerrain = true;
    ```

## 播放控制

1. 播放动画倍速：`window.$$map.iewer.clock.multiplier = 50;`
2. 当前播放动画是否暂停: `window.$$map.iewer.clock.shouldAnimate = false;` —— 暂停（false） ←→ 继续（true）
3. 动画前进、后退、暂停：

    ```js
    const viewModel = window.$$map.iewer.animation.viewModel;
    let command;
    if ("后退") {
        command = viewModel.playReverseViewModel.command;
    } else if ("暂停/播放"){
        command = viewModel.pauseViewModel.command;
    } else if("前进") {
        command = viewModel.playForwardViewModel.command;
    }
    // 命令可执行
    if (command.canExecute) {
        command();
    }
    ```

## 第一人称视角实现

1. 实现思路：

    到这里的话，说明前面创建 `飞机模型`，创建 `航线`等这些基本功能都已实现，而且一句 `viewer.trackedEntity = airplaneEntity;` 就实现了相机跟随当前飞机实体的功能；
    那么，我们已经有了视角跟随，根据位置数据计算得到的飞机姿态，飞行速度等，剩下的问题就是：

    - `①视角位置不符合我们的期望`
    - `②视角还是可以通过鼠标转动及缩放`
    - `③可能想要把飞机模型隐藏`

2. 解决代码如下，分两种情况：

    - 如果是默认跟随 Entity，`不需要` 在固定时间点去触发 `.gltf 文件自带的动画`，如下代码所示：

    ```js
    // 以 vue 2.6+ options Api 为例
    <template>
        <div id="cesiumContainer">
            <div class="tool-bar">
                <a-button @click="handleChangePerspective">切换视角</a-button>
            </div>
        </div>
    </template>

    <script>
    export default {
        data() {
            return {
                firstPerspective: false // 是否第一人称
            }
        },
        methods: {
            init() {
                const vm = this;
                const viewer = new Cesium.Viewer("cesiumContainer", {
                    geocoder: false,
                    homeButton: false,
                    baseLayerPicker: false,
                    selectionIndicator: false,
                    animation: true,
                    timeline: true,
                    navigationHelpButton: false,
                    scene3DOnly: true,
                    fullscreenButton: false
                });
                window.$$map.viewer = viewer;
                // ======================================================================
                // 其他初始化操作，如创建 3D 模型实体等，可看上面内容或去官网查看
                // ...
                // 对了，将航线实体与飞机实体分开创建并添加到 entities 中，否则隐藏飞机实体时，航线也会隐藏
                // ======================================================================
                // 添加事件监听 
                viewer.clock.onTick.addEventListener(clock => {
                    const mapObj = window.$$map;
                    // 当前时间点
                    const curTime = clock.currentTime;
                    // 当前时间位置点
                    const position = mapObj.airplaneEntity.position.getValue(curTime);
                    /*
                    mapObj.orientationProperty 为创建 Entity 时的 orientation 配置项，上面有写到。在创建时存到 $$map 种备用。
                    const curOrientation = Cesium.Property.getValueOrUndefined(mapObj.orientationProperty, curTime);
                    */
                    // 通过实体获取当前时间点的四元数，它基于提供的 PositionProperty 的速度
                    const curOrientation = mapObj.airplaneEntity.orientation.getValue(curTime);
                    let transform = Cesium.Transforms.eastNorthUpToFixedFrame(position);
                    transform = Cesium.Matrix4.fromRotationTranslation(
                        Cesium.Matrix3.fromQuaternion(curOrientation),
                        position
                    );
                    if (vm.firstPerspective) {
                        // 固定视角为第一人称视角，笛卡尔坐标相对于当前位置的偏移
                        // 从当前视角跟随点往后，往上偏移一点，使第一人称是正常的视角方向
                        mapObj.viewer.camera.lookAtTransform(
                            transform,
                            new Cesium.Cartesian3(0.0, 5, 0.2)
                        );
                    }
                    /*
                    已经设置了视角跟随，切变换第一人称时，并未更改此值；所以就变换为第一人称视角时，操作相机即可
                    因为之前在切换视角按钮处理事件里面将 trackedEntity 置为了 undefined
                    这里可以不用这步操作，lookAtTransform 会覆盖
                    else {
                        if (
                            mapObj.viewer.trackedEntity === mapObj.airplaneEntity
                        ) {
                            return;
                        }
                        mapObj.viewer.trackedEntity = mapObj.airplaneEntity;
                    }
                    */
                });
            },
            handleChangePerspective() {
                this.firstPerspective = !this.firstPerspective;
                // 无需关心自带动画播放的情况下，直接隐藏 Entity 即可
                window.$$map.airplaneEntity.show = !this.firstPerspective;
                if (!this.firstPerspective) {
                    // 切换回第三人称，视角位置往回缩放 50m，避免回归第三视角时，距离模型太近甚至是在模型内部
                    window.$$map.viewer.camera.zoomOut(50);
                }
            }
        },
        mounted() {
            // cesium ion 官网的 Token，否则可能无法正常加载地图资源
            Cesium.Ion.defaultAccessToken = ACCESS_TOKEN;
            window.CESIUM_BASE_URL = ""; // 或 "/"。若 vue 项目中不设置此属性，将无法渲染
            window.$$map = {}; // 存储相关数据的对象
            this.init();
        }
    }
    </script>
    ```

    - 若需要在固定时间点触发 .gltf 文件内的动画，如下：

    ```js
    /*
    因为创建 Entity 时，它会自动循环播放其自带的全部动画；
    如果将 airplaneEntity.model.runAnimations = false; 置为 false，将会阻止其自带动画；
    但是你创建的 model 通过 add 方法添加的动画一样不会播放。
    所以使用下面的方法（这都还在如上例的 init 方法中）：
    */
    cosnt vm = this; // 以免可能出现 this 指向出错，你如果确信每步的 this 都是当前 vue 实例，此句请忽略
    // 创建 Entity 时，将其 scale 属性设置极小到看不见的效果
    const airplaneEntity = viewer.entities.add({
        availability: new Cesium.TimeIntervalCollection([
            new Cesium.TimeInterval({
                start: startTime,
                stop: stopTime
            })
        ]),
        position: positionProperty,
        // orientation: orientationProperty,
        orientation: new Cesium.VelocityOrientationProperty(positionProperty),
        model: {
            uri: vm.modelUri, // vue 实例 data 中存的 .gltf 文件路径
            scale: 0.00001 // 缩小自动创建的实体至不可见的状态
        }
    });
    window.$$map.viewer.trackedEntity = airplaneEntity; // 相机跟随
    window.$$map.airplaneEntity = airplaneEntity;

    // 创建 model，并在 viewer.clock.onTick 事件中，根据时间设置 model 的位置
    // model 的动画就会按你添加的时间点去触发了

    const airplaneModel = viewer.scene.primitives.add(
        Cesium.Model.fromGltf({
            id: "plane",
            url: vm.modelUri
            // clampAnimations: true, // 非关键帧上保持姿势
            // minimumPixelSize: 128, // 视角上的最小像素大小(这里未生效，应该是哪个模式存在冲突)
            // loop: Cesium.ModelAnimationLoop.NONE
        })
    );
    window.$$map.airplaneModel = airplaneModel;
    // 飞机模型加载完成
    airplaneModel.readyPromise.then(model => {
         // 添加动画 - 如下，添加了两个内部定义过的动画
        model.activeAnimations.add({
            name: "down", // .gltf 文件中定义的动画名
            startTime: window.$$map.downStartTime, // 动画起始时间
            delay: 0.0, // 相对于触发时间点的延迟
            stopTime: window.$$map.downStopTime, // 动画结束时间
            multiplier: 1.0, // 播放倍速
            loop: Cesium.ModelAnimationLoop.NONE // 循环播放设置
        });
        model.activeAnimations.add({
            name: "up",
            startTime: window.$$map.upStartTime,
            delay: 0.0,
            stopTime: window.$$map.upStopTime,
            multiplier: 1.0,
            loop: Cesium.ModelAnimationLoop.NONE
        });
    });

    viewer.clock.onTick.addEventListener(clock => {
        const mp = window.$$map; // 纯粹为了偷懒
        // 当前时间
        const curTime = clock.currentTime;
        // 3 维旋转姿态矩阵
        let rotationMatrix = new Cesium.Matrix3();
        // 4 维矩阵
        let modelMatrix = new Cesium.Matrix4();
        /* 也可用 Cesium.Property.getValueOrUndefined() */
        const position = mp.airplaneEntity.position.getValue(curTime);

        // 获取当前时间点四维位置(x, y, z, w)
        /*
        mapObj.quaternionProperty 由上面的方法 computeQuaternion()
        根据飞机航向(heading)，俯仰(pitch)，偏转(roll) 计算而得
        这里用的 data 就不是 Cesium 官网提供的数据了（因为他只有经纬度及海拔，没有姿态数据）
        */
        let quaternion = Cesium.Property.getValueOrUndefined(
            mp.quaternionProperty,
            curTime,
            new Cesium.Quaternion()
        );
        // 具有东北向上轴的参考帧计算 4x4 变换矩阵
        // 以提供的椭球的固定参考系为中心
        modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
            position,
            undefined,
            modelMatrix
        );
        // 计算表示围绕轴旋转的四元数
        let quaternion2 = Cesium.Quaternion.fromAxisAngle(
            Cesium.Cartesian3.UNIT_Z,
            Cesium.Math.toRadians(90),
            new Cesium.Quaternion()
        );
        // 计算两个四元数的乘积，存到 quaternion 中
        Cesium.Quaternion.multiply(quaternion, quaternion2, quaternion);
        // 根据提供的四元数计算 3x3 旋转矩阵
        rotationMatrix = Cesium.Matrix3.fromQuaternion(
            quaternion,
            rotationMatrix
        );
        // 乘以一个转换矩阵（底行为 [0.0，0.0，0.0，1.0]）由3x3旋转矩阵组成
        Cesium.Matrix4.multiplyByMatrix3(
            modelMatrix,
            rotationMatrix,
            modelMatrix
        );
        // 时刻设置飞机 model 姿态及位置点 ===============================
        mp.airplaneModel.modelMatrix = modelMatrix;

        // 根据飞机位置及姿态四维数组计算飞机姿态 HeadingPicthRoll -（heading，pitch，roll）
        const hpr = Cesium.Transforms.fixedFrameToHeadingPitchRoll(modelMatrix);

        // 第一视角
        if (this.firstPerspective) {
            mp.viewer.camera.setView({
                destination: position,
                orientation: hpr
            });
            // 视角偏转至看向前方
            mp.viewer.camera.rotateRight(Cesium.Math.toRadians(-90.0));
            // 视角向后上方平移各20m
            mp.viewer.camera.moveUp(20);
            mp.viewer.camera.moveBackward(20);
        }
    });

    // 另外在切换视角按钮点击事件中，隐藏 model 即可
    // 因为 Entity 缩小到非常小了（可认为是不可见状态）
    window.$$map.airplaneModel.show = false;
    ```
