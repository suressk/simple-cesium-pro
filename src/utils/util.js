/**
 * 防抖
 * @param {*} func
 * @param {*} delay
 * @param {*} immediate
 */
export function debounce(func, delay, immediate) {
  let timer;
  let debounced = function() {
    let ctx = this;
    let callNow;
    if (timer) {
      clearTimeout(timer);
    }
    if (immediate) {
      callNow = !timer;
      if (callNow) {
        func.apply(ctx, arguments);
      }
      timer = setTimeout(() => {
        timer = null;
      }, delay);
    } else {
      timer = setTimeout(() => {
        func.apply(ctx, arguments);
      }, delay);
    }
  };
  return debounced;
}

/**
 * 节流
 * @param {*} func
 * @param {*} delay
 */
export function throttle(func, delay = 3000) {
  let timer = null,
    startTime;
  return function() {
    const ctx = this,
      args = arguments,
      now = new Date().getTime();
    if (startTime && now < startTime + delay) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        startTime = now;
        func.apply(ctx, args);
      }, delay);
    } else {
      startTime = now;
      func.apply(ctx, args);
    }
  };
}

/**
 * 文件下载
 * @param {*} res
 */
export function getDownloadFile(res, baseUrl) {
  let link = document.createElement("a"),
    urlArr = res.result.url.split("/"),
    name = urlArr[urlArr.length - 1];
  link.download = name; // 下载的文件名
  link.target = "_blank"; // 新开标签页
  link.style.display = "none";
  // 下载路径
  link.href = baseUrl + res.result.url;
  document.body.appendChild(link);
  link.click(); // 手动触发点击
  document.body.removeChild(link); // 移除节点
}
