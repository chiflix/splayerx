// import Vuex from 'vuex';
// import PlaybackState from '@/store/modules/PlaybackState';
// import SubtitleControl from '@/components/PlayingView/SubtitleControl';
// import { shallowMount, createLocalVue } from '@vue/test-utils';

// const localVue = createLocalVue();
// localVue.use(Vuex);

// describe('SubtitleControl.vue', () => {
//   const testSubArr = [];
//   testSubArr[0] = { title: 'something index 0' };
//   testSubArr[1] = { title: 'something index 1' };
//   testSubArr[2] = { title: 'something index 2' };

//   let store;

//   beforeEach(() => {
//     store = new Vuex.Store({
//       modules: {
//         PlaybackState: {
//           state: PlaybackState.state,
//           mutations: PlaybackState.mutations,
//         },
//       },
//     });
//   });

//   it('should load with correct data', () => {
//     const wrapper = shallowMount(SubtitleControl, { store, localVue });
//     expect(wrapper.vm.isBtnMenuAppear).equal(false);
//     expect(wrapper.vm.isSubCtrlBtnAppear).equal(false);
//     expect(wrapper.vm.barBottom).equal(6);
//     expect(wrapper.vm.timeoutIdOfSubCtrlDisappearDelay).equal(0);
//   });

//   it('should render correct HTML elements', () => {
//     const wrapper = shallowMount(SubtitleControl, { store, localVue });
//     wrapper.setData({
//       isSubCtrlBtnAppear: true,
//       isBtnMenuAppear: true,
//     });
//     expect(wrapper.html()).contains('alt="On"');
//     expect(wrapper.html()).contains('alt="Off"');
//   });

//   it('subCtrlAppear method works fine', () => {
//     const wrapper = shallowMount(SubtitleControl, { store, localVue });
//     wrapper.setData({ isSubCtrlBtnAppear: false });
//     wrapper.vm.subCtrlAppear();
//     expect(wrapper.vm.isSubCtrlBtnAppear).equal(true);
//   });

//   it('subCtrlHide method works fine', () => {
//     const wrapper = shallowMount(SubtitleControl, { store, localVue });
//     wrapper.setData({
//       isSubCtrlBtnAppear: true,
//       isBtnMenuAppear: true,
//     });
//     wrapper.vm.subCtrlHide();
//     expect(wrapper.vm.isSubCtrlBtnAppear).equal(false);
//     expect(wrapper.vm.isBtnMenuAppear).equal(false);
//   });

//   it('firstSubtitleOn method works fine', () => {
//     const wrapper = shallowMount(SubtitleControl, { store, localVue });
//     store.state.PlaybackState.FirstSubtitleState = false;
//     store.state.PlaybackState.SecondSubtitleState = false;
//     wrapper.vm.firstSubtitleOn();
//     expect(store.state.PlaybackState.FirstSubtitleState).equal(true);
//     expect(store.state.PlaybackState.SecondSubtitleState).equal(true);
//   });

//   it('firstSubtitleOff method works fine', () => {
//     const wrapper = shallowMount(SubtitleControl, { store, localVue });
//     store.state.PlaybackState.FirstSubtitleState = true;
//     store.state.PlaybackState.SecondSubtitleState = true;
//     wrapper.vm.firstSubtitleOff();
//     expect(store.state.PlaybackState.FirstSubtitleState).equal(false);
//     expect(store.state.PlaybackState.SecondSubtitleState).equal(false);
//   });

//   it('secondSubtitleOn method works fine', () => {
//     const wrapper = shallowMount(SubtitleControl, { store, localVue });
//     store.state.PlaybackState.SecondSubtitleState = false;
//     wrapper.vm.secondSubtitleOn();
//     expect(store.state.PlaybackState.SecondSubtitleState).equal(true);
//   });

//   it('secondSubtitleOff method works fine', () => {
//     const wrapper = shallowMount(SubtitleControl, { store, localVue });
//     store.state.PlaybackState.SecondSubtitleState = true;
//     wrapper.vm.secondSubtitleOff();
//     expect(store.state.PlaybackState.SecondSubtitleState).equal(false);
//   });

//   it('toggleButtonMenu method works fine', () => {
//     const wrapper = shallowMount(SubtitleControl, { store, localVue });
//     wrapper.setData({ isBtnMenuAppear: false });
//     wrapper.vm.toggleButtonMenu();
//     expect(wrapper.vm.isBtnMenuAppear).equal(true);
//     wrapper.setData({ isBtnMenuAppear: true });
//     wrapper.vm.toggleButtonMenu();
//     expect(wrapper.vm.isBtnMenuAppear).equal(false);
//   });

//   it('subtitleNameArr computed property works fine', () => {
//     const wrapper = shallowMount(SubtitleControl, { store, localVue });
//     store.state.PlaybackState.SubtitleNameArr = testSubArr;
//     expect(wrapper.vm.subtitleNameArr).equal(testSubArr);
//   });

//   it('curSubName computed property works fine', () => {
//     const wrapper = shallowMount(SubtitleControl, { store, localVue });
//     store.state.PlaybackState.FirstSubIndex = 2;
//     store.state.PlaybackState.StartIndex = 1; // 2 - 1  = 1,
//     // therefore should return subtitleNameArr[1]
//     expect(wrapper.vm.curSubName).equal(testSubArr[1].title);
//     store.state.PlaybackState.FirstSubIndex = 20;
//     store.state.PlaybackState.StartIndex = 1; // 20 - 1  = 10,
//     // there doesnt exist an index in our testSubArr, therefore should return
//     // 'No Subtitle'
//     expect(wrapper.vm.curSubName).equal('No subtitle');
//   });

//   it('curFirstSubIndex computed property works fine', () => {
//     const wrapper = shallowMount(SubtitleControl, { store, localVue });
//     store.state.PlaybackState.FirstSubIndex = 2;
//     store.state.PlaybackState.StartIndex = 0;
//     expect(wrapper.vm.curFirstSubIndex).equal(2);
//   });

//   it('curSecondSubIndex computed property works fine', () => {
//     const wrapper = shallowMount(SubtitleControl, { store, localVue });
//     store.state.PlaybackState.SecondSubIndex = 7;
//     store.state.PlaybackState.StartIndex = 0;
//     expect(wrapper.vm.curSecondSubIndex).equal(7);
//   });

//   it('subtitleAppearFlag computed property works fine', () => {
//     const wrapper = shallowMount(SubtitleControl, { store, localVue });
//     store.state.PlaybackState.FirstSubtitleState = true;
//     expect(wrapper.vm.subtitleAppearFlag).equal(true);
//     store.state.PlaybackState.FirstSubtitleState = false;
//     expect(wrapper.vm.subtitleAppearFlag).equal(false);
//   });
//   // 测试 eventbus emit and on - 待
// });
