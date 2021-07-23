// // 引入echarts共用组件
// import "echarts/lib/component/tooltip";
// import "echarts/lib/component/legend";
// import "echarts/lib/component/legendScroll";
// import "echarts/lib/component/dataZoom";
// import "echarts/lib/component/geo";
// import "echarts/lib/component/visualMap";
// import "echarts/lib/component/title";

// /* 异步按需加载组件 */
// const context = require.context("@/components/WorkPlace", true, /\.vue$/);
// const contextFilter = context
//   .keys()
//   .filter(file => file.indexOf("/components") === -1);
// const componentList = {};
// contextFilter.forEach(file => {
//   const splitArr = file.split("/");
//   const len = splitArr.length;
//   const type = splitArr[len - 3].toLowerCase();
//   const name = splitArr.pop().replace(/\.vue$/, "");
//   const component = `${type}-${name}`;
//   componentList[component] = r =>
//     require.ensure([], () => r(context(file).default), "workPlace");
// });
// export const asyncComponent = {
//   components: {
//     ...componentList
//   }
// };
