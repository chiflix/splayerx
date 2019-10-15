<template>
  <div
    ref="showWindow"
    :style="[containerProp, hideOrNot]"
    class="updateContainer"
  >
    <div class="backGround" />
    <div
      ref="breath"
      :style="linkProp"
      class="breathe-div"
    />
    <div class="overInner">
      {{ content }}
      <div class="linksInUpdater">
        <div
          v-for="(item, index) in buttons"
          :key="index"
          class="clickLinks"
        >
          <span :class="item.classC">
            <a
              @click="item.callBack.call(item.THIS)"
              href="#"
            > {{ item.text }} </a>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import GetHelper from '../../../main/update/RendererHelper';

export default {
  name: 'UpdaterNotification',
  components: {
  },
  data() {
    return {
      helper: null,
      content: '',
      buttons: [],
      containerStyle: {
        platform: '',
      },
      breathType: null,
      visibility: 'hidden',
    };
  },
  computed: {
    linkProp() {
      return ({ 'webkit-animation-name': this.breathType });
    },
    containerProp() {
      return (this.containerStyle);
    },
    hideOrNot() {
      return ({ visibility: this.visibility });
    },
  },
  beforeMount() {
    this.helper = new GetHelper(this);
  },
  mounted() {
  },
  updated() {
  },
  methods: {
    hide() {
      this.visibility = 'hidden';
    },
    show() {
      this.$refs.showWindow.className = 'updateContainer';
      this.visibility = 'visible';
    },
    registerCallBackButton(buttons) {
      this.buttons = buttons;
    },
    setMessage(message) {
      this.content = message.toString();
    },
    startDisappear(time = 50000) {
      setTimeout(() => {
        this.visibility = 'hidden';
        this.$refs.showWindow.className = 'updateContainerDisappear';
      }, time);
    },
    setBreathType(breath) {
      this.breathType = breath;
    },
    forWin() {
      this.containerStyle.platform = 'win32';
    },
    forMac() {
      this.containerStyle.platform = 'darwin';
    },
  },
};
</script>

<style lang="scss">
    $bs: 0.5px; //bulb shadow weight
    $bsl: 1px;  //large bulb shadow weight
    $side: ('10px', '14px', '24px');
    .updateContainer {
        position: fixed;
        z-index: 2;
        display: -webkit-flex;
        -webkit-flex-direction: row;
        display: flex;
        flex-direction: row;
        opacity: 1;
        transition: opacity 4s linear;
        @media screen and (max-width: 511px) {
            display: none;
        }
        @media screen and (min-width: 512px) and (max-width: 853px) {
            display: inline-block;
            height: 30px;
            color: #FFFFFF;
            font-size: 12px;
            line-height: 30px;
            letter-spacing: normal;
            top: 20px;
            border-radius: 15px;
            box-shadow: $bs $bs 0 0 rgba(255,255,255,0.15), $bs $bs 5px 0 rgba(0,0,0,0.3);
            @if platform = 'darwin'{
                right: 10px;
            }
            @if platform = 'win32'{
                right: 10px;
            }
        }
        @media screen and (min-width: 854px) and (max-width: 1919px) {
            height: 33px;
            font-size: 13px;
            line-height: 33px;
            letter-spacing: normal;
            top: 20px;
            border-radius: 18.75px;
            box-shadow: $bs $bs 0 0 rgba(255,255,255,0.15), $bs $bs 7px 0 rgba(0,0,0,0.3);
            @if platform = 'darwin'{
                right: 14px;
            }
            @if platform = 'win32'{
                right: 14px;
            }
        }
        @media screen and (min-width: 1920px) {
            height: 50px;
            font-size: 20px;
            line-height: 50px;
            letter-spacing: normal;
            top: 20px;
            border-radius: 30px;
            box-shadow: $bsl $bsl 0 0 rgba(255,255,255,0.15), $bsl $bsl 15px 0 rgba(0,0,0,0.3);
            @if platform = 'darwin'{
                right: 24px;
            }
            @if platform = 'win32'{
                right: 24px;
            }
        }
        backdrop-filter: blur(2px);
        .backGround {

            z-index: 1;
            width: inherit;
            position: absolute;
            top: 0px;
            right: 0px;
            bottom: 0px;
            left: 0px;
            height: inherit;
            border-radius: inherit;
            background-color: rgba(0.3,.3,0.3,0.5);
            // -webkit-filter: blur(10px);
        }
            .overInner {
                @media screen and (max-width: 511px) {
                  padding-right: 10px;
                  padding-left: 10px;
                }
                @media screen and (min-width: 512px) and (max-width: 853px) {
                    padding-right: 10px;
                    padding-left: 11px;
                }
                @media screen and (min-width: 854px) and (max-width: 1920px) {
                    padding-right: 10px;
                    padding-left: 9px;
                }
                @media screen and (min-width: 1920px) {
                    padding-right: 15px;
                    padding-left: 18px;
                }
                position: relative;
                height: inherit;
                z-index: 3;
                color: #FFFFFF;
                font-weight: lighter;
                margin-left: 25px;
                margin-right: 10px;
                /*display: -webkit-flex;*/
                /*-webkit-flex-direction: row;*/
                display: inline-block;
                .linksInUpdater {
                    position: relative;
                    display: inline-block;
                    margin-left: 19px;
                    .clickLinks {
                        display: inline;
                        margin-right: 3px;
                        .importantC {
                            a {
                                text-decoration: none;
                                color: rgba(135, 205, 255, 0.7);
                            }
                            a:hover {
                                text-decoration: none;
                                color: rgb(255, 255, 255);
                            }
                        }
                        .defaultC {
                            a {
                                text-decoration: none;
                                color: rgba(185, 185, 185, 0.4);
                            }
                            a:hover {
                                text-decoration: none;
                                color: rgb(255, 255, 255);
                            }
                        }
                    }
                }
            }
        }
    .updateContainerDisappear{
        opacity: 1;
        filter: alpha(opacity=100);
        display: none;
    }
    .breathe-div {
        @media screen and (max-width: 511px) {
            height: 8px;
            width: 8px;
            left: 11px;
        }
        @media screen and (min-width: 512px) and (max-width: 853px) {
            height: 8px;
            width: 8px;
            left: 11px;
        }
        @media screen and (min-width: 854px) and (max-width: 1920px) {
            height: 12px;
            width: 12px;
            left: 12px;
        }
        @media screen and (min-width: 1920px) {
            height: 14px;
            width: 14px;
            left: 18px;
        }
        z-index: 3;
        position: absolute;
        top: 50%;
        transform: translate(0, -50%);
        background-color: #bbb;
        border-radius: 50%;
        // overflow: hidden;
        -webkit-animation-timing-function: ease-in-out;
        -webkit-animation-duration: 1500ms;
        -webkit-animation-iteration-count: infinite;
        -webkit-animation-direction: alternate;
    }
    @keyframes breatheAlert {
        0% {
            opacity: .4;
            box-shadow:
              1px 1px 2px rgba(183,255,111,0.5),
              10px 10px 1px rgba(183,255,111,0.3) inset;;
        }
        100% {
            opacity: 1;
            box-shadow: 1px 1px 15px red, 10px 10px 10px red inset;
        }
    }
    @keyframes breatheSuccess {
        0% {
            opacity: .4;
            box-shadow:
              0.1px 0.1px 2px rgba(183,255,111,0.5),
              10px 10px 10px rgba(183,255,111,0.3) inset;;
        }
        100% {
            opacity: 1;
            box-shadow:
              0.1px 0.1px 15px green,
              10px 10px 1px green inset;
        }
    }


</style>
