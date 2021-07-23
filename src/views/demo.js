import * as Cesium from "cesium";
import { ACCESS_TOKEN } from "../token";
import { jsonFlightData } from "./flightData";

// Cesium 官网注册获取 Token
Cesium.Ion.defaultAccessToken = ACCESS_TOKEN;

// 创建 viewer 区，挂载
const viewer = new Cesium.Viewer("cesiumContainer", {
  terrainProvider: Cesium.createWorldTerrain()
});

// const osmBuildings = viewer.scene.primitives.add(Cesium.createOsmBuildings());
// viewer 区 scene.primitives 添加创建的 Cesium3DTileset 实例 =========================== ？？？？？
viewer.scene.primitives.add(Cesium.createOsmBuildings());

const flightData = JSON.parse(jsonFlightData);

/* Initialize the viewer clock:
  Assume the radar samples are 30 seconds apart, and calculate the entire flight duration based on that assumption.
  Get the start and stop date times of the flight, where the start is the known flight departure time (converted from PST 
    to UTC) and the stop is the start plus the calculated duration. (Note that Cesium uses Julian dates. See 
    https://simple.wikipedia.org/wiki/Julian_day.)
  Initialize the viewer"s clock by setting its start and stop to the flight start and stop times we just calculated. 
  Also, set the viewer"s current time to the start time and take the user to that time. 
    初始化视区时钟
    假设 30s 拍摄一张，基于此假设计算整个过程的飞行时间
    获取飞行过程的首尾时间，得知起飞时间，结束时间就是起始时间加上计算得到的时间段
    通过刚刚计算得到的时间跨度设置初始及结束时间以初始化视区的时刻表
*/
const timeStepInSeconds = 30; // 每秒时间跨度为 30s
const totalSeconds = timeStepInSeconds * (flightData.length - 1); // 总时长为每秒跨度乘以数组长度
const start = Cesium.JulianDate.fromIso8601("2020-03-09T23:10:00Z"); // 起飞时间
/* 降落时间，起始时刻 + 总时长 => 转换 */
const stop = Cesium.JulianDate.addSeconds(
  start,
  totalSeconds,
  new Cesium.JulianDate()
);
// 设置视区首尾时间，表盘当前时间一直为起始时间，时间线设置为首尾时刻区间
viewer.clock.startTime = start.clone();
viewer.clock.stopTime = stop.clone();
viewer.clock.currentTime = start.clone();
viewer.timeline.zoomTo(start, stop);
// Speed up the playback speed 50x. 播放速度置为 50倍
viewer.clock.multiplier = 50;
// Start playing the scene. 自动播放
viewer.clock.shouldAnimate = true;

// The SampledPositionedProperty stores the position and timestamp for each sample along the radar sample series.
// 创建位置属性
const positionProperty = new Cesium.SampledPositionProperty();

// 循环飞行数据
for (let i = 0; i < flightData.length; i++) {
  // 数据点
  const dataPoint = flightData[i];

  // Declare the time for this individual sample and store it in a new JulianDate instance.
  // 每个时刻点存到一个新的 JulianDate 实例中（依旧是 30s 的间隔）
  const time = Cesium.JulianDate.addSeconds(
    start,
    i * timeStepInSeconds,
    new Cesium.JulianDate()
  );
  // 每个时刻的位置点（笛卡尔坐标系记录 x, y, z，经度，纬度，离地高度）
  const position = Cesium.Cartesian3.fromDegrees(
    dataPoint.longitude,
    dataPoint.latitude,
    dataPoint.height
  );
  // Store the position along with its timestamp.
  // Here we add the positions all upfront, but these can be added at run-time as samples are received from a server.
  // 联合时间戳记录位置点
  // 在这里，我们将所有位置都预先添加，但是可以在运行时添加这些位置，因为这些示例是从服务器接收到的。
  positionProperty.addSample(time, position);

  // 将这些记录添加到视区图层中，记录每个点的位置，数据详情（描述为经纬度及离地高度）
  // 这些点绘制为 10 像素的红色圆点
  viewer.entities.add({
    description: `Location: (${dataPoint.longitude}, ${dataPoint.latitude}, ${dataPoint.height})`,
    position: position,
    point: { pixelSize: 10, color: Cesium.Color.RED }
  });
}

// // STEP 6 CODE (airplane entity)
// async function loadModel() {
//   // Load the glTF model from Cesium ion.
//   const airplaneUri = await Cesium.IonResource.fromAssetId(your_asset_id);
//   const airplaneEntity = viewer.entities.add({
//     availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({ start: start, stop: stop })]),
//     position: positionProperty,
//     // Attach the 3D model instead of the green point.
//     model: { uri: airplaneUri },
//     // Automatically compute the orientation from the position.
//     orientation: new Cesium.VelocityOrientationProperty(positionProperty),
//     path: new Cesium.PathGraphics({ width: 3 })
//   });

//   viewer.trackedEntity = airplaneEntity;
// }

// let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
//   Cesium.Cartesian3.fromDegrees(-75.62898254394531, 40.02804946899414, 0.0));
// let model = scene.primitives.add(Cesium.Model.fromGltf({
//   url : '/assets/models/Cesium_Air.glb',
//   modelMatrix : modelMatrix,
//   scale : 200.0
// }));

// 创建飞机 model
function createModel(url, option) {
  // 设置初始值，若第一个参数有值则取其值，若为 undefined 取第二个参数的值
  let height = Cesium.defaultValue(option.height, 0.0),
    heading = Cesium.defaultValue(option.heading, 0.0),
    pitch = Cesium.defaultValue(option.pitch, 0.0),
    roll = Cesium.defaultValue(option.roll, 0.0);
  // 由机头姿态（俯仰，左右偏转，自身旋转三个维度）创建
  /**
   * 旋转表示为航向，俯仰和横滚。 航向是绕负z轴的旋转。 螺距是绕负y轴的旋转。 滚动是绕正x轴的旋转。
   */
  let hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
  // 由笛卡尔坐标系坐标数据定义初始姿态
  let origin = Cesium.Cartesian3.fromDegrees(-123.0744619, 44.0503706, height);
  /** 
    计算一个4x4变换矩阵，该坐标框架具有从以提供的原点为中心的航向-俯仰-横滚角到提供的椭球的固定参考框架计算的轴。 
    航向是从局部北向旋转，其中正角向东增加。
    俯仰是从本地东西向平面的旋转。 正俯仰角在平面上方。
    负俯仰角在平面下方。 横摇是绕局部东轴应用的第一次旋转。
  */
  let modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(origin, hpr);
  // Remove previous model
  // 移除之前所有创建的 model
  viewer.scene.primitives.removeAll();
  // 创建新 model（模型源，四维矩阵初始位置，模型最小像素大小）
  let airModel = viewer.scene.primitives.add(
    Cesium.Model.fromGltf({
      url,
      modelMatrix: modelMatrix,
      minimumPixelSize: 128
    })
  );

  // 模型异步加载完成
  airModel.readyPromise
    .then(model => {
      model.color = Cesium.Color.fromAlpha("GRAY", 1);
      model.colorBlendMode = "Highlight";
      model.colorBlendAmount = 0.5;
      // Play and loop all animations at half-speed
      model.activeAnimations.addAll({
        multiplier: 0.5,
        loop: Cesium.ModelAnimationLoop.REPEAT
      });

      let camera = viewer.camera;

      // Zoom to model
      let controller = viewer.scene.screenSpaceCameraController;
      let r = 2.0 * Math.max(model.boundingSphere.radius, camera.frustum.near);
      controller.minimumZoomDistance = r * 0.5;

      let center = Cesium.Matrix4.multiplyByPoint(
        model.modelMatrix,
        model.boundingSphere.center,
        new Cesium.Cartesian3()
      );
      let heading = Cesium.Math.toRadians(230.0);
      let pitch = Cesium.Math.toRadians(-20.0);
      camera.lookAt(
        center,
        new Cesium.HeadingPitchRange(heading, pitch, r * 2.0)
      );
    })
    .otherwise(error => {
      window.alert(error);
    });
}
createModel("@/assets/models/Cesium_Air.glb", {
  height: 5000.0,
  heading: 0.0,
  pitch: Cesium.Math.toRadians(10.0),
  roll: Cesium.Math.toRadians(-20.0)
});

// loadModel();
