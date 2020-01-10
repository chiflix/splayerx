<template>
  <div class="content">
    <div
      v-if="isDarwin"
      @mouseover="state = 'hover'"
      @mouseout="state = 'default'"
      class="mac-icons no-drag"
    >
      <Icon
        :state="state"
        @click.native="handleClose"
        class="title-button"
        type="titleBarClose"
      />
      <Icon
        class="title-button-disable"
        type="titleBarExitFull"
      />
      <Icon
        class="title-button-disable"
        type="titleBarFull"
      />
    </div>
    <Icon
      v-if="!isDarwin"
      @click.native="handleClose"
      class="win-title-button no-drag"
      type="titleBarWinClose"
    />
    <img
      class="winLogo"
      src="../assets/win-about-logo.png"
      draggable="false"
    >
    <div class="marquee-box">
      <div :class="`marquee-pos ${showMarquee ? 'active' : '' }`">
        <div :class="`name ${showMarquee ? 'hide' : '' }`">
          {{ name }}
        </div>
        <div :class="`version ${showMarquee ? 'hide' : '' }`">
          {{ `Version ${version}` }}
        </div>
        <div class="button-wrap">
          <div
            @click="showMarquee = !showMarquee"
            :class="`button ${ showMarquee ? 'active' : '' }`"
          >
            {{ $t('about.credits') }}
          </div>
        </div>
        <div
          :class="`marquee-wrap ${!showMarquee ? 'hide' : '' }`"
        >
          <div
            v-for="(cell, index) in list"
            :key="index"
            class="marquee"
          >
            <div>
              <p>
                <span
                  v-for="i in cell"
                  :key="`${index}-1-${i}`"
                >
                  {{ i }}
                </span>
              </p>
              <p>
                <span
                  v-for="i in cell"
                  :key="`${index}-2-${i}`"
                >
                  {{ i }}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="copyright">
      <p>© 2009-2020</p><p>Sagittarius Technology Co.,Ltd</p>
    </div>
  </div>
</template>

<script>
import electron from 'electron';
import Icon from '@/components/BaseIconContainer.vue';

export default {
  name: 'About',
  components: {
    Icon,
  },
  data() {
    return {
      state: 'default',
      showMarquee: false,
      credits: [
        'Tomasen',
        'Huuu',
        'S.',
        'Ryan Wang.Y',
        'Harry Tang',
        'Tan Yang',
        'Sam Song',
        'ymmuse',
        'lilacvapor',
        'Yvon Tre',
        'YuRi Jin',
        '陈超 CChao',
        '老徐不秃头',
        'Connie Liang',
        '槐树',
        'Zecoo',
        'Morgan Wan',
        'Lummy',
        '朱闽敏',
        '鸭鸭',
        'Beezus',
        '蒋昱风',
        'hbin123',
        '空',
        '可欣',
      ],
    };
  },
  computed: {
    name() {
      return electron.remote.app.getName();
    },
    version() {
      return electron.remote.app.getVersion();
    },
    isDarwin() {
      return process.platform === 'darwin';
    },
    list() {
      const { credits } = this;
      const tmp = this.shuffleCredits(credits);
      const result = [];
      const len = tmp.length;
      const step = Math.ceil(len / 3);
      for (let i = 0; i < len; i += step) {
        result.push(tmp.slice(i, i + step));
      }
      console.warn(result);
      return result;
    },
  },
  mounted() {
    document.title = 'About SPlayer';
    document.body.classList.add('drag');
  },
  methods: {
    shuffleCredits(list) {
      for (let i = list.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = list[i];
        list[i] = list[j];
        list[j] = temp;
      }
      return list;
    },
    handleClose() {
      electron.remote.BrowserWindow.getFocusedWindow().close();
    },
  },
};
</script>

<style scoped lang="scss">
  .content {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #434348;
    // background-image: linear-gradient(
    //   -28deg,
    //   rgba(65,65,65,0.97) 0%,
    //   rgba(84,84,84,0.97) 47%,
    //   rgba(123,123,123,0.97) 100%
    // );
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    .mac-icons {
      position: absolute;
      top: 12px;
      left: 12px;
      width: fit-content;
      display: flex;
      flex-wrap: nowrap;
      .title-button {
        width: 12px;
        height: 12px;
        margin-right: 8px;
        background-repeat: no-repeat;
        -webkit-app-region: no-drag;
        border-radius: 100%;
      }
      .title-button-disable {
        pointer-events: none;
        opacity: 0.25;
      }
    }
    .win-title-button {
      position: absolute;
      top: 0;
      right: 0;
      width: 45px;
      height: 28px;
      background-color: rgba(255,255,255,0);
      transition: background-color 200ms;
      &:hover {
        background-color: rgba(221, 221, 221, 0.2);
      }
      &:active {
        background-color: rgba(221, 221, 221, 0.5);
      }
    }
    .winLogo {
      width: 90px;
      margin: 50px auto 0 auto;
    }
    .name {
      font-size: 17px;
      color: rgba(255, 255 ,255 , 1);
      text-align: center;
      transition: opacity 100ms linear;
      &.hide {
        opacity: 0;
      }
    }
    .version {
      font-size: 11px;
      letter-spacing: 0.28px;
      margin: 3px auto 0 auto;
      color: rgba(255, 255 ,255 , 0.7);
      text-align: center;
      margin-bottom: 14px;
      transition: opacity 100ms linear;
      &.hide {
        opacity: 0;
      }
    }
    .copyright {
      font-size: 10px;
      letter-spacing: 0.5px;
      color: rgba(255, 255 ,255 , 0.3);
      margin: auto auto 14px auto;
      text-align: center;
    }
    .marquee-box {
      height: 120px;
      overflow: hidden;
      position: relative;
      top: -8px;
      .marquee-pos {
        width: 100%;
        position: absolute;
        top: 20px;
        left: 0;
        transition: top 300ms linear;
        &.active {
          top: -30px;
        }
      }
    }
    .button-wrap {
      text-align: center;
      margin-bottom: 10px;
    }
    .button {
      padding: 0 15px;
      display: inline-block;
      line-height: 22px;
      font-size: 10px;
      color: rgba(255,255,255,0.70);
      letter-spacing: -0.24px;
      text-align: center;
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 11px;
      cursor: pointer;
      -webkit-app-region: no-drag;
      transition: all 200ms ease-in-out;
      &.active, &:hover {
        background: rgba(255,255,255,0.25);
      }
    }
    .marquee-wrap {
      position: relative;
      overflow: hidden;
      transition: opacity 200ms linear;
      &.hide {
        opacity: 0;
      }
      &::before {
        content: '';
        width: 100%;
        height: 300%;
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        z-index: 1;
        background-image: radial-gradient(
          51% 50%,
          rgba(67,67,72,0.00) 49%,
          #434348 94%,
          #434348 100%
        );
        border-radius: 9px;
      }
    }
    .marquee {
      width: 100%;
      height: 19px;
      margin: 0 auto;
      overflow: hidden;
      white-space: nowrap;
      &>div {
        display: inline-block;
        animation: marquee 20s linear infinite;
      }
      p {
        line-height: 19px;
        height: 19px;
        display: inline-block;
        &:nth-child(1) {
          left: 0%;
          position: relative;
          animation: swap 20s linear infinite;
        }
      }
      span {
        display: inline-block;
        padding: 0 5px;
        font-size: 10px;
        color: rgba(255,255,255,0.70);
        letter-spacing: -0.24px;
      }
    }

    @keyframes marquee {
      from {
        transform: translateX(0%);
      }
      to {
        transform: translateX(-100%);
      }
    }
    @keyframes swap {
      0%, 50% {
        left: 0%;
      }
      50.01%,
      100% {
        left: 100%;
      }
    }
  }
</style>
