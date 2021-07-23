<template>
  <div id="app">
    <CesiumMap />
  </div>
</template>

<script>
import CesiumMap from "@/components/CesiumMap";

export default {
  name: "App",
  components: { CesiumMap }
};
</script>

<style lang="less">
@import url("./assets/css/reset.less");
@import url("./assets/css/public.less");
@import url("https://at.alicdn.com/t/font_1850788_9iorusnbm9r.css");

html,
body,
#app {
  width: 100%;
  height: 100%;
}
</style>
