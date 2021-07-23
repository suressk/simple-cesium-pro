<template>
  <div id="cesiumContainer">
    <!-- :class="{ 'full-screen': fullScreen }" -->
    <div class="tool-bar">
      <el-button size="small" @click="handlePlayForward" type="success">
        前进
      </el-button>
      <el-button size="small" @click="handlePlayOrPause" type="primary">
        播放 / 暂停
      </el-button>
      <el-button size="small" @click="handlePlayReverse" type="danger">
        后退
      </el-button>
      <!--
         <el-button size="small" @click="handleUpDown(0)" type="danger"
        >收起起落架时刻</el-button
      >
      <el-button size="small" @click="handleUpDown(1)" type="danger"
        >放下起落架时刻</el-button
      >
      -->
      <el-button size="small" @click="handleChangePerspective" type="warning">
        {{ perspectiveContent }}
      </el-button>
      <el-button size="small" @click="handleAddImagery" type="info">
        添加一张半透明图片
      </el-button>

      <el-dropdown
        type="primary"
        trigger="click"
        placement="bottom"
        @command="handleChangeSpeed"
      >
        <span class="el-dropdown-link speed-btn">
          播放倍速
          <i class="el-icon-arrow-down el-icon--right" />
          {{ animationSpeed }}
        </span>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="1">1x</el-dropdown-item>
          <el-dropdown-item command="10">10x</el-dropdown-item>
          <el-dropdown-item command="20">20x</el-dropdown-item>
          <el-dropdown-item command="50">50x</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
    <!-- 全屏切换 -->
    <!-- <el-button
      title="全屏切换"
      class="full-screen-btn"
      icon="el-icon-full-screen"
      @click="handlePlayFullscreen"
      type="info"
    /> -->
  </div>
</template>

<script>
import { ACCESS_TOKEN } from "@/token";
import { data } from "./data";
// import { jsonFlightData } from "./flightData";

import transferData from "./transferData";

import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

import {
  playForward,
  playOrPause,
  playReverse,
  Notify
} from "./controlAnimation";

export default {
  name: "CesiumMap",
  data() {
    return {
      modelUri: "/source/models/Cesium_Air.glb",
      perspectiveContent: "第一人称视角",
      firstPerspective: false,
      animationSpeed: "10x"
      // fullScreen: false,
    };
  },
  methods: {
    // 转换数据
    // transferData(data) {
    //   const flightData = [];
    //   const mp = window.$$map;
    //   // for (let i in data) {
    //   data.forEach((item, i) => {
    //     // item 依旧是数组
    //     const pre = (i > 1 && data[i - 1]) || null;
    //     let date = item[4].split("/"); // "6/16/2020" => ["6", "16", "2020"]
    //     const dateTime =
    //       date[2] + "-" + date[0] + "-" + date[1] + " " + item[2]; // "2020-6-16 14:05:39"
    //     flightData.push({
    //       longitude: Number(item[7]),
    //       latitude: Number(item[8]),
    //       altitude: Number(item[17]),
    //       dateTime,
    //       heading: Number(item[21]),
    //       pitch: Number(item[13]),
    //       roll: Number(item[15])
    //     });
    //     if (item[9] === "UP") {
    //       let time = Cesium.JulianDate.fromDate(new Date(dateTime));
    //       if (!mp.upStartTime) {
    //         mp.upStartTime = time.clone();
    //       }
    //       mp.upStopTime = time.clone(); // 最后一个 up
    //     }
    //     if (item[9] === "DOWN") {
    //       let time = Cesium.JulianDate.fromDate(new Date(dateTime));
    //       if (!mp.downStartTime && pre && pre[9] === "UP") {
    //         mp.downStartTime = time.clone();
    //       }
    //       mp.downStopTime = time.clone(); // 最后一个 down
    //     }
    //   });
    //   return flightData;
    // },
    // 跳转到收起起落架时刻
    // handleUpDown(state) {
    //   if (state === 0) {
    //     window.$$map.viewer.clock.currentTime = window.$$map.upStartTime.clone();
    //   } else {
    //     window.$$map.viewer.clock.currentTime = window.$$map.downStartTime.clone();
    //   }
    // },
    // 动画播放控制
    handlePlayForward() {
      playForward();
    },
    handlePlayOrPause() {
      playOrPause();
    },
    handlePlayReverse() {
      playReverse();
    },
    // 播放速度
    handleChangeSpeed(speed) {
      window.$$map.viewer.clock.multiplier = parseInt(speed);
      this.animationSpeed = speed + "x";
    },
    // 视角切换
    handleChangePerspective() {
      // 视角切换
      this.firstPerspective = !this.firstPerspective;
      // 再次添加同一个实体会报 entity id 重复的警告，相当于同一个模型添加了两遍
      // 因而改用操作实体的 show 属性隐藏，而不是新创建一个实例（而且创建新实例，视角跟随会失效）
      window.$$map.airplaneModel.show = !this.firstPerspective; // 隐藏 model 实例
      // 切换回第三视角
      if (!this.firstPerspective) {
        // 视角位置回缩 100m
        window.$$map.viewer.camera.zoomOut(100);
        this.perspectiveContent = "第一人称视角";
      } else {
        this.perspectiveContent = "第三人称视角";
      }
    },
    // 添加 image
    handleAddImagery() {
      if (window.$$map.imgLayer === undefined) {
        this.addImageryLayer();
        Notify("success", "图片图层创建成功，请缩小视图查看渤海附近区域");
        return;
      }
      Notify("warning", "图片图层已创建，请不要多次创建！");
    },
    /**
     * 添加图片图层
     * @params {*} west 最西经度
     * @params {*} south 最南纬度
     * @params {*} east 最东经度
     * @params {*} north 最北纬度
     */
    addImageryLayer(west = 112.0, south = 38.0, east = 120, north = 39.75) {
      const imageryLayers = window.$$map.viewer.imageryLayers;
      const imageryProvider = new Cesium.SingleTileImageryProvider({
        url: "/source/images/Cesium_Logo.jpg",
        rectangle: Cesium.Rectangle.fromDegrees(west, south, east, north)
      });
      const layer = imageryLayers.addImageryProvider(imageryProvider);
      layer.alpha = 0.5;
      layer.show = true;
      window.$$map.imgLayer = layer;
    },
    /**
     * 添加事件标识
     * @params {*} eventOption 事件配置信息
     * @params {*} longitude 经度
     * @params {*} latitude 纬度
     * @params {*} altitude 海拔
     */
    addEventPain(eventOption, longitude, latitude, altitude = 0) {
      let color;
      // 根据事件等级创建不同颜色的标识
      switch (eventOption.level) {
        case 1:
          color = Cesium.Color.GOLD;
          break;
        case 2:
          color = Cesium.Color.CORAL;
          break;
        case 3:
          color = Cesium.Color.RED;
          break;
        default:
          color = Cesium.Color.DEEPSKYBLUE;
          break;
      }
      window.$$map.viewer.entities.add({
        name: eventOption.name,
        position: Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude),
        description: eventOption.description,
        billboard: {
          image: window.$$map.pinBuilder.fromColor(color, 48).toDataURL(),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM
        }
      });
    },
    /**
     * 添加飞机实体
     * @params {*} startTime 起始时间 :JulianDate
     * @params {*} stopTime 结束时间 :JulianDate
     * @params {*} positionProperty 每个时间点的位置属性对象
     * @params {*} orientationProperty 根据每个时间点的位置属性对象计算得到的飞机姿态对象
     */
    addAirplaneEntity(
      startTime,
      stopTime,
      positionProperty,
      orientationProperty
    ) {
      // 可根据位置属性计算得到
      orientationProperty =
        orientationProperty === undefined
          ? new Cesium.VelocityOrientationProperty(positionProperty)
          : orientationProperty;
      return window.$$map.viewer.entities.add({
        availability: new Cesium.TimeIntervalCollection([
          new Cesium.TimeInterval({
            start: startTime,
            stop: stopTime
          })
        ]),
        position: positionProperty,
        orientation: orientationProperty,
        // orientation: new Cesium.VelocityOrientationProperty(
        //   orientationProperty
        // ),
        model: {
          uri: this.modelUri,
          scale: 0.00001 // 缩小自动创建的实体至肉眼不可见的状态
        }
        // loop: Cesium.ModelAnimationLoop.NONE
      });
    },
    // 添加航线实体
    addAirRouteEntity(startTime, stopTime, positionProperty) {
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
    },
    // 计算每个点的属性（时间，位置）
    computePositionProperty(startTime, records) {
      // const vm = this;
      let property = new Cesium.SampledPositionProperty();
      records.forEach(item => {
        // if (item.longitude && item.latitude) {
        // }
        const time = Cesium.JulianDate.fromDate(new Date(item.dateTime));
        const position = Cesium.Cartesian3.fromDegrees(
          item.longitude,
          item.latitude,
          item.altitude || 0
        );
        // // entities 实体（航线上的数据位置点）添加描述信息
        // window.$$map.viewer.entities.add({
        //   description: `Location: (${item.longitude}, ${item.latitude}, ${item.altitude})`,
        //   position,
        //   point: { pixelSize: 10, color: Cesium.Color.GOLD }
        // });
        property.addSample(time, position);
      });
      return property;
    },
    // 计算飞行路径
    computeOrientationProperty(startTime, records, positionProperty) {
      if (positionProperty) {
        return new Cesium.VelocityOrientationProperty(positionProperty);
      }
      let property = new Cesium.SampledPositionProperty();
      records.forEach(item => {
        // if (item.longitude && item.latitude) {
        const time = Cesium.JulianDate.fromDate(new Date(item.dateTime));
        const position = Cesium.Cartesian3.fromDegrees(
          item.longitude,
          item.latitude,
          item.altitude || 0
        );
        property.addSample(time, position);
        // }
      });
      return property;
    },
    // 计算飞机航向
    computeQuaternion(startTime, records) {
      // Cesium.Quaternion - 一组四维坐标(x, y, z , w)，表示三维空间中的旋转
      let property = new Cesium.SampledProperty(Cesium.Quaternion);
      records.forEach(item => {
        // if (item.heading && item.pitch && item.roll) {
        const time = Cesium.JulianDate.fromDate(new Date(item.dateTime));
        // 以度为单位的角度返回一个新的 HeadingPitchRoll 实例，姿态数据
        const headingPitchRoll = Cesium.HeadingPitchRoll.fromDegrees(
          item.heading,
          item.pitch,
          item.roll
        );
        // 根据给定的航向，俯仰和横滚角计算旋转角度
        const quaternion = Cesium.Quaternion.fromHeadingPitchRoll(
          headingPitchRoll
        );
        property.addSample(time, quaternion);
        // }
      });
      return property;
    },
    createViewer() {
      const vm = this;
      // 挂载地图场景
      const viewer = new Cesium.Viewer("cesiumContainer", {
        // 要使用的地形提供商 - 使用此配置，会致使地形高度海拔转换笛卡尔坐标时，
        // 出现高度基准错误（大致在地形上低 1900m 左右）
        // terrainProvider: Cesium.createWorldTerrain(),
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

      // // 自动创建视区建筑实体
      // viewer.scene.primitives.add(Cesium.createOsmBuildings());
      // 启用深度测试，地形之后的东西消失
      viewer.scene.globe.depthTestAgainstTerrain = true;

      window.$$map.viewer = viewer;

      // const flightData = vm.transferData(data);
      const flightData = transferData(data);

      // const flightData = JSON.parse(jsonFlightData);

      // console.log(flightData);

      // 相机飞至起始位置点
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          flightData[0].longitude,
          flightData[0].latitude,
          flightData[0].altitude + 100
        )
      });
      // 起始 - 结束时刻
      const startTime = Cesium.JulianDate.fromDate(
        new Date(flightData[0].dateTime)
      );
      const stopTime = Cesium.JulianDate.fromDate(
        new Date(flightData[flightData.length - 1].dateTime)
      );
      // 当前时间置于起始时间
      viewer.clock.currentTime = startTime.clone();
      viewer.clock.startTime = startTime.clone();
      viewer.clock.stopTime = stopTime.clone();
      viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; // 播放到结束停止播放
      viewer.timeline.zoomTo(startTime, stopTime); // 时间线区间
      viewer.clock.multiplier = 10; // 倍速播放动画
      // viewer.clock.shouldAnimate = false; // 加载完成自动播放动画 - 否

      // 数据位置点属性
      const positionProperty = vm.computePositionProperty(
        startTime,
        flightData
      );
      // 根据位置数据（positionProperty）计算飞机模型（Entity）在空中的姿态
      const orientationProperty = vm.computeOrientationProperty(
        startTime,
        flightData,
        positionProperty
      );

      // 飞机姿态
      const quaternionProperty = vm.computeQuaternion(startTime, flightData);
      window.$$map.quaternionProperty = quaternionProperty;
      // 添加飞机实体
      const airplaneEntity = vm.addAirplaneEntity(
        startTime,
        stopTime,
        positionProperty,
        orientationProperty
      );
      // 设置相机当前跟踪的 Entity 实例
      window.$$map.viewer.trackedEntity = airplaneEntity;
      window.$$map.airplaneEntity = airplaneEntity;

      // 添加航线实体 (为后面第一人称视角隐藏飞机模型作准备)
      const airRouteEntity = vm.addAirRouteEntity(
        startTime,
        stopTime,
        positionProperty
      );
      window.$$map.airRouteEntity = airRouteEntity;

      // 添加事件标识
      vm.addEventPain(
        { name: "事件1", level: 0, description: "无等级事件" },
        flightData[10].longitude,
        flightData[10].latitude,
        flightData[10].altitude
      );
      vm.addEventPain(
        {
          name: "事件2",
          level: 1,
          description: "事件等级为 1，这是一些事件描述内容"
        },
        flightData[500].longitude,
        flightData[500].latitude,
        flightData[500].altitude
      );
      vm.addEventPain(
        { name: "事件3", level: 3, description: "事件等级为 3" },
        flightData[1000].longitude,
        flightData[1000].latitude,
        flightData[1000].altitude
      );

      // canvas 视图区事件处理对象
      // window.$$map.cesiumHandler = new Cesium.ScreenSpaceEventHandler(
      //   viewer.scene.canvas
      // );
      // 事件监听 - 事件处理
      // 鼠标在飞机模型上移动 pick 到的节点(node)与网格(mesh) --- .gltf 文件中定义的 node 与 mesh
      // window.$$map.cesiumHandler.setInputAction(movement => {
      //   const pick = viewer.scene.pick(movement.endPosition);
      //   if (
      //     Cesium.defined(pick) &&
      //     Cesium.defined(pick.node) &&
      //     Cesium.defined(pick.mesh)
      //   ) {
      //     console.log("node: " + pick.node.name + ". mesh: " + pick.mesh.name);
      //   }
      // }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

      // 视图添加飞机模型实体
      const airplaneModel = viewer.scene.primitives.add(
        Cesium.Model.fromGltf({
          id: "plane",
          url: vm.modelUri
        })
        // clampAnimations: true, // 非关键帧上保持姿势
        // minimumPixelSize: 128, // 视角上的最小像素大小(这里未生效，应该是哪个模式存在冲突)
        // loop: Cesium.ModelAnimationLoop.NONE
      );
      window.$$map.airplaneModel = airplaneModel;

      // 飞机模型加载完成
      airplaneModel.readyPromise.then(model => {
        // 飞机模型加载完毕，保存视图 model
        // 以便控制动画播放（前进，后退，暂停/播放）
        window.$$map.viewModel = window.$$map.viewer.animation.viewModel;

        // 3D 模型所有 node 节点(这里 110 个)
        // window.$$map.airplaneNodes = Object.keys(model._runtime.nodesByName).map(
        //   nodeName => ({
        //     text: nodeName,
        //     onselect: () => {
        //       // viewModel.nodeName = nodeName;
        //       console.log(nodeName);
        //     }
        //   })
        // );

        // 添加动画
        model.activeAnimations.add({
          name: "down",
          startTime: window.$$map.downStartTime,
          delay: 0.0,
          stopTime: window.$$map.downStopTime,
          multiplier: 1.0,
          loop: Cesium.ModelAnimationLoop.NONE
        });
        model.activeAnimations.add({
          name: "up",
          startTime: window.$$map.upStartTime,
          delay: 0.0,
          stopTime: window.$$map.upStopTime,
          multiplier: 1.0,
          loop: Cesium.ModelAnimationLoop.NONE
        });
        model.activeAnimations.add({
          name: "down",
          startTime: window.$$map.downStartTime,
          delay: 0.0,
          stopTime: window.$$map.downStopTime,
          multiplier: 1.0,
          loop: Cesium.ModelAnimationLoop.NONE
        });
      });

      viewer.clock.onTick.addEventListener(clock => {
        const mapObj = window.$$map;
        // 当前时间
        let curTime = clock.currentTime;
        // 3 维矩阵
        let rotationMatrix = new Cesium.Matrix3();
        // 4 维矩阵
        let modelMatrix = new Cesium.Matrix4();
        // 跟随视角当前时间点位置中心(笛卡尔三维坐标系坐标位置点 (x, y, z))
        const position = mapObj.airplaneEntity.position.getValue(curTime);
        // 获取当前时间点四维位置(x, y, z, w)
        // 当前飞机姿态(heading, pitch, roll计算而得)
        let quaternion = Cesium.Property.getValueOrUndefined(
          mapObj.quaternionProperty,
          curTime,
          new Cesium.Quaternion()
        );
        // 具有东北向上轴的参考帧计算4x4变换矩阵以提供的原点为中心，以提供的椭球的固定参考系为中心
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
        // 将模型从模型转换为世界坐标的 4x4 转换矩阵 - 设置飞机 model 姿态及位置点
        mapObj.airplaneModel.modelMatrix = modelMatrix;
        // 根据飞机位置，姿态四维数组计算飞机姿态（heading，pitch，roll）
        const hpr = Cesium.Transforms.fixedFrameToHeadingPitchRoll(modelMatrix);

        if (vm.firstPerspective) {
          // 固定视角为第一人称视角
          mapObj.viewer.camera.setView({
            destination: position,
            orientation: hpr
          });
          // 视角偏转至看向前方
          mapObj.viewer.camera.rotateRight(Cesium.Math.toRadians(-90.0));
          mapObj.viewer.camera.moveUp(20);
          mapObj.viewer.camera.moveBackward(20);
        }
      });
    }
  },
  mounted() {
    window.CESIUM_BASE_URL = "/";
    Cesium.Ion.defaultAccessToken = ACCESS_TOKEN;
    window.$$map = {}; // 创建 $$map 对象，用于统一存储 cesium 生成的相关变量
    window.$$map.pinBuilder = new Cesium.PinBuilder(); // 事件指示器创建者
    this.createViewer();
  }
};
</script>

<style lang="less">
#cesiumContainer {
  height: 100vh;
  width: 100%;
  position: relative;

  .cesium-viewer-bottom,
  .cesium-viewer-animationContainer,
  .cesium-viewer-timelineContainer {
    display: none;
  }
  .tool-bar {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 99;
    width: 100%;
    background-color: rgba(25, 25, 25, 0.8);
    .speed-btn {
      color: #fff;
      font-size: 12px;
      padding: 9px 15px;
      margin-left: 15px;
      background-color: #409eff;
      border-color: #409eff;
      border-radius: 4px;
      cursor: pointer;
    }
  }
}
</style>
