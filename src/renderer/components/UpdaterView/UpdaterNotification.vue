<template>
    <div class="updateContainer" ref="showWindow" :style="[containerProp, hideOrNot]">
        <div class="backGround" >
        </div>
        <div class="breathe-div" ref="breath" :style="linkProp"></div>
        <div class="overInner" >
            {{content}}
            <div class="linksInUpdater">
                <div class="clickLinks" v-for="(item) in buttons">
                <a href='#' v-on:click=item.callBack.call(item.THIS)> {{item.text}} </a>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
  import GetHelper from '../../../main/update/RendererHelper.js';
  export default {
    name: 'UpdaterNotification',
    components: {
    },
    data() {
      return {
        helper: null,
        content: '',
        buttons: [],
        position: { right: '', top: '', left: '' },
        breathType: null,
        visibility: 'hidden',
      };
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
      setPosition(position) {
        this.position = position;
      },
      setBreathType(breath) {
        this.breathType = breath;
      },
      topCenter() {
        this.position = { left: '50%', transform: 'translateX(-50%)' };
      },
      onLeftForWin() {
        this.position = { left: '18px' };
      },
      onRightForMac() {
        this.position = { right: '18px' };
      },
    },
    computed: {
      linkProp() {
        return ({ 'webkit-animation-name': this.breathType });
      },
      containerProp() {
        return (this.position);
      },
      hideOrNot() {
        return ({ visibility: this.visibility });
      },
    },
  };
</script>

<style lang="scss">
    $bs: 0.5px; //bulb shadow weight
    $bsl: 1px;  //large bulb shadow weight
    .updateContainer {
        position: fixed;
        z-index: 2;
        display: -webkit-flex;
        -webkit-flex-direction: row;
        display: flex;
        flex-direction: row;
        opacity: 1;
        transition: opacity 4s linear;
        @media screen and (max-width: 640px) {
            line-height: 30px;
            height:30px;
            font-size: 12px;
            letter-spacing: normal;
            top: 20px;
            // border-radius: 15px;
            clip-path: inset(0px round 15px);
            box-shadow: $bs $bs 0 0 rgba(255,255,255,0.15), $bs $bs 5px 0 rgba(0,0,0,0.3);
        }
        @media screen and (min-width: 640px) and (max-width: 853px) {
            height: 30px;
            color: #FFFFFF;
            font-size: 12px;
            line-height: 30px;
            letter-spacing: normal;
            top: 20px;
            // border-radius: 15px;
            clip-path: inset(0px round 15px);
            box-shadow: $bs $bs 0 0 rgba(255,255,255,0.15), $bs $bs 5px 0 rgba(0,0,0,0.3);
        }
        @media screen and (min-width: 853px) and (max-width: 1920px) {
            height: 37.5px;
            font-size: 15px;
            line-height: 37.5px;
            letter-spacing: normal;
            top: 20px;
            // border-radius: 18.75px;
            clip-path: inset(0px round 18.75px);
            box-shadow: $bs $bs 0 0 rgba(255,255,255,0.15), $bs $bs 7px 0 rgba(0,0,0,0.3);
        }
        @media screen and (min-width: 1920px) {
            height: 60px;
            font-size: 24px;
            line-height: 60px;
            letter-spacing: normal;
            top: 20px;
            // border-radius: 30px;
            clip-path: inset(0px round 30px);
            box-shadow: $bsl $bsl 0 0 rgba(255,255,255,0.15), $bsl $bsl 15px 0 rgba(0,0,0,0.3);
        }
        .backGround {

            z-index: 1;
            width: inherit;
            position: absolute;
            top: 0px;
            right: 0px;
            bottom: 0px;
            left: 0px;
            height: inherit;
            clip-path: inherit;
            // border-radius: inherit;
            background-color: rgba(0,0,0,0.6);
            // -webkit-filter: blur(10px);
            backdrop-filter: blur(10px);
        }
            .overInner {
                // font-family: "PingFang SC";
                @media screen and (max-width: 640px) {
                  padding-right: 10px;
                  padding-left: 10px;
                }
                @media screen and (min-width: 640px) and (max-width: 854px) {
                    padding-right: 10px;
                    padding-left: 10px;
                }
                @media screen and (min-width: 854px) and (max-width: 1920px) {
                    padding-right: 10px;
                    padding-left: 10px;
                }
                @media screen and (min-width: 1920px) {
                    padding-right: 15px;
                    padding-left: 10px;
                }
                position: relative;
                height: inherit;
                z-index: 3;
                // font-family: PingFang-SC-Medium;
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
                    margin-left: 10px;
                    a:active, a:visited, a:link {
                        text-decoration: none;
                        color: rgba(135, 205, 255, 0.7);
                    }
                    a:hover {
                        text-decoration: none;
                        color: rgb(255, 255, 255);
                    }
                    .clickLinks{
                        display: inline;
                        margin-right: 3px;
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
        @media screen and (max-width: 640px) {
            height: 8px;
            width: 8px;
            left: 11px;
        }
        @media screen and (min-width: 640px) and (max-width: 854px) {
            height: 8px;
            width: 8px;
            left: 11px;
        }
        @media screen and (min-width: 854px) and (max-width: 1920px) {
            height: 10px;
            width: 10px;
            left: 13.75px;
        }
        @media screen and (min-width: 1920px) {
            height: 16px;
            width: 16px;
            left: 22px;
        }
        z-index: 3;
        position: absolute;
        top: 50%;
        transform: translate(0, -50%);
        background-color: #bbb;
        border-radius: 50%;
        overflow: hidden;
        -webkit-animation-timing-function: ease-in-out;
        -webkit-animation-duration: 1500ms;
        -webkit-animation-iteration-count: infinite;
        -webkit-animation-direction: alternate;
    }
    @-webkit-keyframes breatheAlert {
        0% {
            opacity: .4;
            box-shadow: 1px 1px 2px rgba(183,255,111,0.5), 10px 10px 1px rgba(183,255,111,0.3) inset;;
        }
        100% {
            opacity: 1;
            box-shadow: 1px 1px 15px red, 10px 10px 10px red inset;
        }
    }
    @-webkit-keyframes breatheSuccess {
        0% {
            opacity: .4;
            box-shadow: 1px 1px 1px rgba(183,255,111,0.5), 10px 10px 10px rgba(183,255,111,0.3) inset;;
        }
        100% {
            opacity: 0.8;
            box-shadow: 1px 1px 1px greenyellow, 10px 10px 10px green inset;
        }
    }


</style>