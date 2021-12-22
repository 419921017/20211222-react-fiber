import { TAG_ROOT } from './constants';
import { scheduleRoot } from './schedule';

function render(element, container) {
  let rootFiber = {
    tag: TAG_ROOT, // 每个fiber都有tag属性, 标识此元素类型
    stateNode: container, // 如果是原生节点, 指向真实DOM
    // props.children 里面放的是react元素(VNODE), 后面会根据VNODE创建fiber
    props: { children: [element] },
  };
  scheduleRoot(rootFiber);
}

const ReactDOM = {
  render,
};

export default ReactDOM;
