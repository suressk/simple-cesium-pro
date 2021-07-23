<template>
  <div class="progress" ref="progress">
    <div class="slider" ref="slider" :style="sliderX"></div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      sliderLeft: 0
    };
  },
  computed: {
    sliderX() {
      return `left: ${this.sliderLeft}px`;
    }
  },
  methods: {
    addDragEvent() {
      const slider = this.$refs.slider,
        progress = this.$refs.progress;
      let isClickSlider = false,
        distance = 0,
        parentWidth;

      slider.onmousedown = e => {
        // 滑块点击
        parentWidth = progress.offsetWidth;
        isClickSlider = true;
        let curX = slider.offsetLeft; // slider 相对父级的 left 值
        distance = e.pageX - curX; // 当前点击点
      };

      document.onmousemove = e => {
        if (isClickSlider) {
          if (e.pageX - distance >= 0 && e.pageX - distance < parentWidth) {
            this.sliderLeft = e.pageX - distance;
          }
        }
        return;
      };

      document.onmouseup = () => {
        isClickSlider = false;
      };
    }
  },
  mounted() {
    this.addDragEvent();
  }
};
</script>

<style lang="less" scoped>
.progress {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  border-radius: 5px;
  height: 8px;
  display: flex;
  align-items: center;
  background-color: #0cf;

  .slider {
    // 滑块儿
    width: 2px;
    height: 100%;
    background-color: #333;
    box-sizing: border-box;
    position: absolute;
    cursor: pointer;
    z-index: 9;
    left: 0;
  }

  &:hover {
    .slider {
      // 滑块儿
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background-color: #333;
      border: 1px solid #777;
      transform: translateX(-7px);
    }
  }
}
</style>
