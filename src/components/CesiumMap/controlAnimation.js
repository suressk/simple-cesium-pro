import { Notification } from "element-ui";

/**
 * 后退播放
 */
export function playReverse() {
  const { viewModel } = window.$$map;
  if (!viewModel) {
    Notify("warning", "viewModel 尚未加载完毕，请稍候！");
  }
  const command = viewModel.playReverseViewModel.command;
  if (command.canExecute) {
    command();
  }
}

// 暂停 / 播放 切换
export function playOrPause() {
  const { viewModel } = window.$$map;
  if (!viewModel) {
    Notify("warning", "viewModel 尚未加载完毕，请稍候！");
  }
  const command = viewModel.pauseViewModel.command;
  if (command.canExecute) {
    command();
  }
}

// 向前播放
export function playForward() {
  const { viewModel } = window.$$map;
  if (!viewModel) {
    Notify("warning", "viewModel 尚未加载完毕，请稍候！");
  }
  const command = viewModel.playForwardViewModel.command;
  if (command.canExecute) {
    command();
  }
}

/**
 * 提示信息
 * @param {*} type
 * @param {*} msg
 */
export function Notify(type, message) {
  Notification({
    type,
    message
  });
}

// 切换第一人称视角
export function changeFirstPerspective() {
  Notify("warning", "changeFirstPerspective");
  // window.$cesiumViewer.camera.setView({});
}
