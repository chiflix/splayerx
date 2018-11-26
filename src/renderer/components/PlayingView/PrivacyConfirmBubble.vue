<template>
<transition name="">
<div
  class="confirm-bubble">
  <div class="plane-background"></div>
  <div class="plane">
    <div class="content">
      <div class="info">射手影音使用匿名信息以提供更好服务体验，<span class="underscore">禁用</span>匿名信息会导致翻译功能无法使用。</div>
      <div class="button"
        :class="{
          hover: hovered,
        }"
        @mouseover.stop="hovered = true"
        @mouseout.stop="hovered = false"
        @mouseup.stop="handleCloseMouseup">
        <div class="button-info">{{ "确定" }}</div>
      </div> 
    </div>
  </div>
</div>
</transition>
</template>
<script>
import { mapGetters } from 'vuex';
export default {
  name: 'confirm-bubble',
  components: {
  },
  data() {
    return {
      hovered: false,
    };
  },
  methods: {
    handleCloseMouseup() {
    },
  },
  watch: {
  },
  computed: {
    ...mapGetters(['nextVideo', 'finalPartTime', 'isFolderList', 'currentTime', 'duration']),
  },
};
</script>
<style lang="scss" scoped>
.notification-enter-active {
 transition: opacity 100ms;
}
.notification-leave-active {
 transition: opacity 200ms;
}
.notification-enter-to, .notification-leave {
 opacity: 1;
}
.notification-enter, .notification-leave-to {
 opacity: 0;
}
.confirm-bubble {
  .plane-background {
    position: absolute;
    
    background-color: rgba(0,0,0,0.20);
    backdrop-filter: blur(9.6px);
    clip-path: inset(0px round 8px);
    box-shadow: 0 0 2px 0 rgba(0,0,0,0.30);

    border-radius: 8px;
    @media screen and (min-width: 513px) and (max-width: 854px) {
      height: 70px;
      width: 340px;
    }
    @media screen and (min-width: 855px) and (max-width: 1920px) {
      height: 54px;
      width: 296px;
    }
    @media screen and (min-width: 1921px) {
      height: 118px;
      width: 571px;
    }
  }
  .plane {
    border-style: solid;
    border-width: 0.5px;
    border-color: rgba(255,255,255,0.2);

    clip-path: inset(0px round 8px);

    background-color: rgba(255,255,255,0.20);
    border-radius: 8px;

    @media screen and (min-width: 513px) and (max-width: 854px) {
      height: 70px;
      width: 340px;
    }
    @media screen and (min-width: 855px) and (max-width: 1920px) {
      height: 54px;
      width: 296px;
    }
    @media screen and (min-width: 1921px) {
      height: 118px;
      width: 571px;
    }
    .content {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      .info {
        opacity: 0.7;
        font-family: PingFangSC-Regular;
        font-size: 10px;
        color: #FFFFFF;
        letter-spacing: 0.2px;
        line-height: 15px;
        @media screen and (min-width: 513px) and (max-width: 854px) {
        }
        @media screen and (min-width: 855px) and (max-width: 1920px) {
          margin-left: 18px;
          width: 208px;
        }
        @media screen and (min-width: 1921px) {
        }
        .underscore {
          text-decoration: underline;
        }
      }
      .hover {
        background-image: none;
        background-color: rgba(255,255,255,0.2);
      }
      .button {
        display: flex;
        justify-content: space-evenly;
        align-items: center;
        @media screen and (min-width: 513px) and (max-width: 854px) {
        }
        @media screen and (min-width: 855px) and (max-width: 1920px) {
          width: 44px;
          height: 24px;
          margin-left: 9px;
          border-radius: 11px;
          background-image: radial-gradient(60% 134%, rgba(255,255,255,0.09) 44%, rgba(255,255,255,0.05) 100%);

          backdrop-filter: blur(3px);
          clip-path: inset(0px round 11px);
        }
        @media screen and (min-width: 1921px) {
        }
        &:active {
          background-image: none;
          background-color: rgba(0,0,0,0.2);
        }
        .button-info {
          opacity: 0.5;
          font-family: PingFangSC-Semibold;
          color: #FFFFFF;
          letter-spacing: 0.2px;
          @media screen and (min-width: 513px) and (max-width: 854px) {
          }
          @media screen and (min-width: 855px) and (max-width: 1920px) {
            line-height: 10px;
            font-size: 10px;            
          }
          @media screen and (min-width: 1921px) {
          }
        }
      }
    }
  }
}
</style>