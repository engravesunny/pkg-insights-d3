import { describe, expect, test } from 'vitest'
import { mount } from '@vue/test-utils' 
import ProjectDetailVue from '@/components/ProjectDetail.vue';

describe('PkgDetail test', () => {
    const data = {
        entryPackageName: '包名',
        entryVersion: '版本',
        depth: 5,
        isCircle: true,
        isMulPackage: true,
        nodeCount: 10,
        circleDepList: [['A', 'B', 'C'], ['D', 'E', 'F']],
        mulPackageList: [['链接1', '链接2'], ['链接3', '链接4']],
    };
    test('组件渲染测试', () => {
        const wrapper = mount(ProjectDetailVue, {
            props: {
                data,
                isLocalFile:false
            }
        });
        expect(wrapper.html()).toMatchSnapshot();
    })
    test('点击链接时正确触发handleClickLink方法并触发refresh事件', async () => {
    
        const wrapper = mount(ProjectDetailVue, {
            props: {
                data,
                isLocalFile:false
            },
        });
    
        // 模拟点击多版本依赖链接
        const mulPackageLink = wrapper.find('.links-box .el-link');
        await mulPackageLink.trigger('click');
    
        // 验证handleClickLink方法是否被正确触发
        expect(wrapper.emitted('searchNode')).toBeTruthy();
    
        // 验证searchNode事件是否传递了正确的参数
        expect((wrapper.emitted('searchNode') as any)[0][0]).toBe('链接1');
    
        // 模拟点击循环依赖链接
        const circleDepLink = wrapper.find('.links .el-link');
        await circleDepLink.trigger('click');
    
        // 验证handleClickLink方法是否被正确触发
        expect(wrapper.emitted('searchNode')).toBeTruthy();
    
        // 验证searchNode事件是否传递了正确的参数
        expect((wrapper.emitted('searchNode') as any)[1][0]).toBe('A');
    });
    test('点击"查看"链接时正确触发showMulPackage改变', async () => {
        const wrapper = mount(ProjectDetailVue, {
            props: {
                data,
                isLocalFile:false
            },
        });
        const vm = wrapper.vm as any;
        const flag = vm.showMulPackage
        // 模拟点击"查看"链接
        const viewMulPackageLink = wrapper.find('.el-link');
        await viewMulPackageLink.trigger('click')
        expect(vm.showMulPackage).toBe(!flag);
    });
    test('点击"查看"链接时正确触发showCirleDep改变', async () => {
        const wrapper = mount(ProjectDetailVue, {
            props: {
                data,
                isLocalFile:false
            },
        });
        const vm = wrapper.vm as any;
        const flag = vm.showCirleDep
        // 模拟点击"查看"链接
        const viewMulPackageLink = wrapper.findAll('.desc-link .el-link')[0];
        
        await viewMulPackageLink.trigger('click')
        expect(vm.showCirleDep).toBe(!flag);
    });
    test('点击"图像"链接时正确触发hilightCirleLinks事件', async () => {
        const data = {
          entryPackageName: '包名',
          entryVersion: '版本',
          depth: 5,
          isCircle: true,
          isMulPackage: true,
          nodeCount: 10,
          circleDepList: [['A', 'B', 'C'], ['D', 'E', 'F']],
          mulPackageList: [['链接1', '链接2'], ['链接3', '链接4']],
        };
    
        const wrapper = mount(ProjectDetailVue, {
          props: {
            data,
            isLocalFile: false,
          },
        });
        
        // 模拟点击"图像"链接
        const hightCirleLinksLink = wrapper.findAll('.desc-link .el-link')[1]
        
        await hightCirleLinksLink.trigger('click');
    
        // 验证handleHightCirleLinks事件是否被正确触发
        expect(wrapper.emitted('hilightCirleLinks')).toBeTruthy();
      });
})