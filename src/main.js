import Vue from "vue";
import App from "./App.vue";
import ElementUI from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
import clickOutside from "./utils/clickOutside";
import VueCompositionApi from "@vue/composition-api";

Vue.config.productionTip = false;

Vue.use(VueCompositionApi);

Vue.directive("click-outside", clickOutside);

Vue.use(ElementUI);

Vue.config.productionTip = false;

new Vue({
  render: h => h(App)
}).$mount("#app");
