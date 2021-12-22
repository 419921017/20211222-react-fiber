import { ELEMENT_TEXT } from './constants';

/**
 * 创建React元素(VNODE)的方法
 *
 * @param {*} type      元素类型
 * @param {*} config     配置的属性
 * @param {...any} children  子元素
 */
function createReactElement(type, config, ...children) {
  delete config._self;
  delete config._source;
  return {
    type,
    props: {
      ...config,
      children: children.map((child) =>
        typeof child === 'object'
          ? child
          : { type: ELEMENT_TEXT, props: { text: child, children: [] } }
      ),
    },
  };
}

const React = {
  createReactElement,
};

export default React;
