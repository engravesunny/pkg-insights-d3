import { describe, expect, test } from 'vitest'
import { mount } from '@vue/test-utils' 
import PkgDetailVue from '@/components/PkgDetail.vue';
import 'element-plus/theme-chalk/base.css';

// PkgDetail组件测试
describe('PkgDetail test', () => {
    const data = {
        entryPackageName: '包名',
        entryVersion: '版本',
        isCircle: true,
        isMulPackage: false,
        mulPackageList: [['A&1', 'B&2', 'C&3'],['D&4', 'E&5', 'F&6']],
    };
    // 渲染测试
    test('组件渲染测试', () => {
        const wrapper = mount(PkgDetailVue, {
            props: {
                data
            }
        });
        
        expect(wrapper.html()).toMatchSnapshot();
    })
    // 属性渲染测试
    test('props属性是否正确渲染', () => {
        const wrapper = mount(PkgDetailVue, {
            props: {
                data,
            },
        });
        expect(wrapper.find('.el-descriptions__label').text()).toBe('包名');
        expect(wrapper.find('.el-descriptions__content').text()).toBe(data.entryPackageName);

        expect(wrapper.findAll('.el-descriptions__label')[1].text()).toBe('版本');
        expect(wrapper.findAll('.el-descriptions__content')[1].text()).toBe(data.entryVersion);

        expect(wrapper.findAll('.el-descriptions__label')[2].text()).toBe('是否有循环依赖');
        expect(wrapper.findAll('.el-tag')[0].text()).toBe(data.isCircle ? '是' : '否');

        expect(wrapper.findAll('.el-descriptions__label')[3].text()).toBe('依赖下是否多版本');
        expect(wrapper.findAll('.el-tag')[1].text()).toBe(data.isMulPackage ? '是' : '否');

        const links = wrapper.findAll('.links-box .el-link');
        let count = 0;
        for(let i in data.mulPackageList){
            for(let j in data.mulPackageList[i]){
                console.log(links[count].text());
                
                expect(links[count].text()).toBe(data.mulPackageList[i][j].split('&')[1]);
                count++;
            }
        }
        expect(links.length).toBe(count);
    })
    // 事件触发测试
    test('多版本查询 点击链接时应该触发 refresh 事件', async () => {
        const wrapper = mount(PkgDetailVue, {
            props: {
                data
            },
        });
    
        const links = wrapper.findAll('a');
        await links[0].trigger('click');
        expect(wrapper.emitted('refresh')).toBeTruthy();
        expect((wrapper.emitted('refresh') as any)[0][0]).toBe('A&1');
    
        await links[1].trigger('click');
        expect(wrapper.emitted('refresh')).toBeTruthy();
        expect((wrapper.emitted('refresh') as any)[1][0]).toBe('B&2');
    
        await links[2].trigger('click');
        expect(wrapper.emitted('refresh')).toBeTruthy();
        expect((wrapper.emitted('refresh') as any)[2][0]).toBe('C&3');
    });
    
})