import AdvanceControl from '@/components/PlayingView/AdvanceControl';
import { shallowMount } from '@vue/test-utils';
import sinon from 'sinon';


describe('AdvanceControl.vue', () => {
  it('should load correct menuStyleObject data', () => {
    const wrapper = shallowMount(AdvanceControl);
    expect(wrapper.vm.menuStyleObject.position).equal('absolute');
    expect(wrapper.vm.menuStyleObject.bottom).equal('17px');
    expect(wrapper.vm.menuStyleObject.right).equal('27px');
    expect(wrapper.vm.menuStyleObject.width).equal('45px');
    expect(wrapper.vm.menuStyleObject.height).equal('40px');
    expect(wrapper.vm.isAcitve).equal(false);
  });

  it('should load correct menuList data', () => {
    const wrapper = shallowMount(AdvanceControl);

    expect(wrapper.vm.menuList[0].title).equal('Speed');
    expect(wrapper.vm.menuList[1].title).equal('Subtitle');
    expect(wrapper.vm.menuList[2].title).equal('Audio');
    expect(wrapper.vm.menuList[3].title).equal('Media Info');

    expect(wrapper.vm.menuList[0].functionality).equal('plusMinus');
    expect(wrapper.vm.menuList[1].functionality).equal('switch');
  });

  it('should load correct settingLevel data', () => {
    const wrapper = shallowMount(AdvanceControl);

    expect(wrapper.vm.settingLevel[0].title).equal('Speed');
    expect(wrapper.vm.settingLevel[1].title).equal('Subtitle');
    expect(wrapper.vm.settingLevel[2].title).equal('Audio');
    expect(wrapper.vm.settingLevel[3].title).equal('Media Info');

    expect(wrapper.vm.settingLevel[0].functionality).equal('plusMinus');
    expect(wrapper.vm.settingLevel[1].functionality).equal('switch');
  });

  it('switchSettingMenuState method works fine - 1', () => {
    const wrapper = shallowMount(AdvanceControl);
    const spy = sinon.spy(wrapper.vm, 'closeMenuSetting');
    wrapper.setData({ isAcitve: true });
    wrapper.vm.switchSettingMenuState();
    expect(wrapper.vm.menuList).equal(wrapper.vm.settingLevel);
    expect(spy.calledOnce).equal(true);
    expect(spy.firstCall.args.length).equal(0);
    spy.restore();
  });

  it('switchSettingMenuState method works fine - 2', () => {
    const wrapper = shallowMount(AdvanceControl);
    const spy = sinon.spy(wrapper.vm, 'openMenuSetting');
    const falseSpy = sinon.spy(wrapper.vm, 'closeMenuSetting');
    wrapper.setData({
      isAcitve: false,
    });
    wrapper.vm.switchSettingMenuState();
    expect(spy.calledOnce).equal(true);
    expect(spy.firstCall.args.length).equal(0);
    expect(falseSpy.calledOnce).equal(false);
    spy.restore();
    falseSpy.restore();
  });

  it('closeMenuSetting method works fine', () => {
    const wrapper = shallowMount(AdvanceControl);
    wrapper.setData({ isAcitve: true });
    wrapper.vm.closeMenuSetting();
    expect(wrapper.vm.menuStyleObject.width).equal('45px');
    expect(wrapper.vm.menuStyleObject.height).equal('40px');
    expect(wrapper.vm.isAcitve).equal(false);
  });

  it('$_fitMenuSize method works fine', () => {
    const wrapper = shallowMount(AdvanceControl);
    wrapper.vm.$_fitMenuSize();
    expect(wrapper.vm.menuStyleObject.height).equal('208px');
  });

  it('openMenuSetting method wroks fine', () => {
    const wrapper = shallowMount(AdvanceControl);
    const spy = sinon.spy(wrapper.vm, '$_fitMenuSize');
    wrapper.setData({
      isAcitve: false,
    });
    wrapper.vm.openMenuSetting();
    expect(wrapper.vm.menuStyleObject.width).equal('208px');
    expect(spy.calledOnce).equal(true);
    expect(spy.firstCall.args.length).equal(0);
    expect(wrapper.vm.isAcitve).equal(true);
    spy.restore();
  });

  it('created hook works as expected', () => {
    const wrapper = shallowMount(AdvanceControl);
    const spy = sinon.spy();
    wrapper.vm.$bus.$emit('changeMenuList');
    const stub1 = sinon.stub(wrapper.vm.$bus, '$on');
    stub1.yields();
    stub1('changeMenuList', spy);
    expect(spy.calledOnce).equal(true);
    expect(spy.firstCall.args.length).equal(0);
    stub1.restore();
  });
});
