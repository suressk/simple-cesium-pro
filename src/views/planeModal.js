import * as Cesium from "cesium";
import { ACCESS_TOKEN } from "../token";

window.CESIUM_BASE_URL = "/";

Cesium.Ion.defaultAccessToken = ACCESS_TOKEN;

let viewer = new Cesium.Viewer("cesiumContainer", {
  shouldAnimate: true,
  shadows: true
});

let scene = viewer.scene;
let model;

function getColorBlendMode(colorBlendMode) {
  return Cesium.ColorBlendMode[colorBlendMode.toUpperCase()];
}

function getColor(color) {
  return Cesium.Color[color.toUpperCase()];
}

// The viewModel tracks the state of our mini application.
let viewModel = {
  color: "White",
  colors: ["White", "Red", "Green", "Blue", "Yellow", "Gray"],
  alpha: 1.0,
  colorBlendMode: "Highlight",
  colorBlendModes: ["Highlight", "Replace", "Mix"],
  colorBlendAmount: 0.5,
  colorBlendAmountEnabled: false
};

// Convert the viewModel members into knockout observables.
Cesium.knockout.track(viewModel);

// Bind the viewModel to the DOM elements of the UI that call for it.
let toolbar = document.getElementById("toolbar");
Cesium.knockout.applyBindings(viewModel, toolbar);

Cesium.knockout.getObservable(viewModel, "color").subscribe(function (newValue) {
  model.color = Cesium.Color.fromAlpha(
    getColor(newValue),
    Number(viewModel.alpha)
  );
});

Cesium.knockout.getObservable(viewModel, "alpha").subscribe(function (newValue) {
  model.color = Cesium.Color.fromAlpha(
    getColor(viewModel.color),
    Number(newValue)
  );
});

Cesium.knockout
  .getObservable(viewModel, "colorBlendMode")
  .subscribe(function (newValue) {
    let colorBlendMode = getColorBlendMode(newValue);
    model.colorBlendMode = colorBlendMode;
    viewModel.colorBlendAmountEnabled =
      colorBlendMode === Cesium.ColorBlendMode.MIX;
  });

Cesium.knockout
  .getObservable(viewModel, "colorBlendAmount")
  .subscribe(function (newValue) {
    model.colorBlendAmount = newValue;
  });

function createModel(url, height, heading, pitch, roll) {
  height = Cesium.defaultValue(height, 0.0);
  heading = Cesium.defaultValue(heading, 0.0);
  pitch = Cesium.defaultValue(pitch, 0.0);
  roll = Cesium.defaultValue(roll, 0.0);
  let hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);

  let origin = Cesium.Cartesian3.fromDegrees(-123.0744619, 44.0503706, height);
  let modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(origin, hpr);

  scene.primitives.removeAll(); // Remove previous model
  model = scene.primitives.add(
    Cesium.Model.fromGltf({
      url: url,
      modelMatrix: modelMatrix,
      minimumPixelSize: 128
    })
  );

  model.readyPromise
    .then(function (model) {
      model.color = Cesium.Color.fromAlpha(
        getColor(viewModel.color),
        Number(viewModel.alpha)
      );
      model.colorBlendMode = getColorBlendMode(viewModel.colorBlendMode);
      model.colorBlendAmount = viewModel.colorBlendAmount;
      // Play and loop all animations at half-speed
      model.activeAnimations.addAll({
        multiplier: 0.5,
        loop: Cesium.ModelAnimationLoop.REPEAT
      });

      let camera = viewer.camera;

      // Zoom to model
      let controller = scene.screenSpaceCameraController;
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
    .otherwise(function (error) {
      window.alert(error);
    });
}

let handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
handler.setInputAction(function (movement) {
  let pick = scene.pick(movement.endPosition);
  if (
    Cesium.defined(pick) &&
    Cesium.defined(pick.node) &&
    Cesium.defined(pick.mesh)
  ) {
    // Output glTF node and mesh under the mouse.
    console.log("node: " + pick.node.name + ". mesh: " + pick.mesh.name);
  }
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

///////////////////////////////////////////////////////////////////////////

const height = 5000.0,
  heading = 0.0,
  pitch = Cesium.Math.toRadians(10.0),
  roll = Cesium.Math.toRadians(-20.0);

createModel(
  "../../SampleData/models/CesiumAir/Cesium_Air.glb",
  height,
  heading,
  pitch,
  roll
);

// let options = [
//   {
//     text: "Aircraft",
//     onselect: function() {
//       let height = 5000.0;
//       let heading = 0.0;
//       let pitch = Cesium.Math.toRadians(10.0);
//       let roll = Cesium.Math.toRadians(-20.0);
//       createModel(
//         "../../SampleData/models/CesiumAir/Cesium_Air.glb",
//         height,
//         heading,
//         pitch,
//         roll
//       );
//     }
//   },
//   {
//     text: "Ground Vehicle",
//     onselect: function() {
//       createModel("../../SampleData/models/GroundVehicle/GroundVehicle.glb");
//     }
//   },
//   {
//     text: "Milk Truck",
//     onselect: function() {
//       createModel(
//         "../../SampleData/models/CesiumMilkTruck/CesiumMilkTruck.glb"
//       );
//     }
//   },
//   {
//     text: "Skinned Character",
//     onselect: function() {
//       createModel("../../SampleData/models/CesiumMan/Cesium_Man.glb");
//     }
//   }
// ];

// Sandcastle.addToolbarMenu(options);

// Sandcastle.addToggleButton("Shadows", viewer.shadows, function(checked) {
//   viewer.shadows = checked;
// });
