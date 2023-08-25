import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { VueWrapper, mount } from '@vue/test-utils'
import { server } from '../mock/server';
import AppVue from '@/App.vue';

describe('App Test', () => {
    let wrapper:VueWrapper;
    wrapper = mount(AppVue);
    const vm = wrapper.vm as any
    beforeAll(()=>{
        server.listen()
    })
    afterEach(() => server.resetHandlers());
    afterAll(()=>{
        server.close();
    })
    test('结点渲染测试', async () => {
        expect(wrapper.classes()).contain('el-container')
    })
    test('展示功能测试', async () => {
        const switchs = wrapper.findAll('.switch-box .switch');
        const switchForName = switchs[0]
        const switchForArrow = switchs[1]
        expect(switchForArrow.text()).toBe('展示箭头')
        expect(switchForName.text()).toBe('展示名字')
        const showName = vm.showName
        const showArrow = vm.showArrow

        await switchForArrow.find('.el-switch').trigger('click')
        await switchForName.find('.el-switch').trigger('click')

        expect(vm.showName).toBe(!showName)
        expect(vm.showArrow).toBe(!showArrow)
    })
    test('各项数据测试', async () => {
        console.log(vm.dependenciesList);
    })
})
