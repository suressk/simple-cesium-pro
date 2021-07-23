// // import Vue from 'vue'
// import axios from 'axios'
// // 创建 axios 实例
// const service = axios.create({
//     // baseURL: '/', // 基础地址
//     timeout: 20000 // 请求超时时间 - 20s
// });

// /**
//  * 请求拦截器,携带每个请求的token
//  */
// service.interceptors.request.use(config => {
//     // @ts-ignore
//     // const token = Vue.ls.get("Access-Token") // 获取 token
//     // if (token) {
//     //     config.headers['X-Access-Token'] = token // 让每个请求携带自定义 token
//     // }
//     return config;
// }, error => {
//     return Promise.reject(error);
// });

// /**
//  * 响应拦截器中的error错误处理
//  */
// const err = (error) => {
//     if (error.response) {
//         switch (error.response.status) {
//             case 401:
//                 console.log({
//                     message: '系统提示',
//                     description: '未授权，请重新登录',
//                     duration: 4
//                 });
//                 break;
//             case 403:
//                 console.log({
//                     message: '系统提示',
//                     description: '拒绝访问'
//                 });
//                 break;
//             case 404:
//                 console.log({
//                     message: '系统提示',
//                     description: '很抱歉，资源未找到!'
//                 });
//                 break;
//             case 500:
//                 console.log({
//                     message: '系统提示',
//                     description: '服务器内部错误！'
//                 });
//                 break;
//             case 504:
//                 console.log({
//                     message: '系统提示',
//                     description: '网络超时'
//                 });
//                 break;
//             default:
//                 console.log({
//                     message: '系统提示',
//                     description: error.response.data.message,
//                 });
//                 break;
//         }
//     }
//     return Promise.reject(error);
// };

// /**
//  * 响应拦截器,将响应中的token取出,放到state中
//  */
// service.interceptors.response.use((response) => {
//     // const token = response.headers["authorization"]
//     // if (token) {
//     //     Vue.ls.set("ACCESS_TOKEN", token) //token是放在vuex中的state中
//     // }
//     if (response.status === 200) {
//         return response.data
//     }
//     return response;
// }, err);

// export {
//     service as axios
// }
