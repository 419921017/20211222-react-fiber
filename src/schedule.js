/**
 * 从根节点开始渲染和调度
 * 2个阶段
 * 1. diff阶段, 进行增量, 更新或者创建
 *    对任务进行拆分, 拆分的维度是虚拟DOM
 *    render阶段
 *      1. 生成fiber树
 *      2. 收集effect list
 *        此阶段的成果是effect list, 此阶段需要知道: 哪些节点更新, 哪些节点删除, 哪些节点增加
 *    此阶段可以暂停
 * 2. commit阶段
 *    DOM更新阶段
 *    此阶段不可以暂停
 *
 * @export
 * @param {*} rootFiber 
 * let rootFiber = {
    tag: TAG_ROOT, // 每个fiber都有tag属性, 标识此元素类型
    stateNode: container, // 如果是原生节点, 指向真实DOM
    // props.children 里面放的是react元素(VNODE), 后面会根据VNODE创建fiber
    props: { children: [element] },
  };
 */

import {
  ELEMENT_TEXT,
  PLACEMENT,
  TAG_HOST,
  TAG_ROOT,
  TAG_TEXT,
} from './constants';
import { setProps } from './utils';

// 下一个工作单元
let nextUnitOfWork = null;

// RootFiber, 应用根
let workInProgressRoot = null;

export function scheduleRoot(rootFiber) {
  workInProgressRoot = rootFiber;
  nextUnitOfWork = rootFiber;
}

function workLoop(deadline) {
  // 是否让出时间片或控制权
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    // 执行一个任务
    performUnitOfWork(nextUnitOfWork);
    // 是否有剩余时间
    shouldYield = deadline.timeRemaining() < 1;
  }
  // 还存在任务
  if (!nextUnitOfWork) {
    console.log('render end');
    commitRoot();
  }
  // 不管有没有任务, 每帧都需要执行一次workLoop
  requestIdleCallback(workLoop, { timeout: 500 });
}
function commitRoot() {
  let currentFiber = workInProgressRoot.firstEffect;
  while (currentFiber) {
    commitWork(currentFiber);
    currentFiber = currentFiber.nextEffect;
  }
  workInProgressRoot = null;
}
function commitWork(currentFiber) {}

function performUnitOfWork(currentFiber) {
  beginWork(currentFiber);
  if (currentFiber.child) {
    return currentFiber.child;
  }
  while (currentFiber) {
    // 没有儿子, 让自己完成
    completeUnitOfWork(currentFiber);
    // 有没有兄弟, 有兄弟返回兄弟
    if (currentFiber.sibling) {
      return currentFiber.sibling;
    }
    // 找到父节点, 让父节点完成, 找到叔叔节点
    currentFiber = currentFiber.return;
  }
}

/**
 * 完成的时候需要收集有副作用的fiber, 组成effect list
 * effect 链和完成链的顺序是一致的, 但是会剔除没有effect的元素
 *
 * @param {*} currentFiber
 */
function completeUnitOfWork(currentFiber) {
  let returnFiber = currentFiber.return;
  // 从下往上归并的, 自底向上
  if (returnFiber) {
    if (!returnFiber.firstEffect) {
      returnFiber.firstEffect = currentFiber.firstEffect;
    }
    if (currentFiber.lastEffect) {
      if (returnFiber.lastEffect) {
        // 非第一次设置, lastEffect.next指向非第一个元素的firstEffect
        returnFiber.listEffect.next = currentFiber.firstEffect;
      } else {
        // 第一次设置
        returnFiber.lastEffect = currentFiber.lastEffect;
      }
    }
    const effectTag = currentFiber.effectTag;
    if (effectTag) {
      if (!!returnFiber.lastEffect) {
        returnFiber.lastEffect.next = currentFiber;
      } else {
        returnFiber.firstEffect = currentFiber;
      }
      returnFiber.lastEffect = currentFiber;
    }
  }
}

/**
 * 1. 创建真实DOM元素
 * 2. 创建子fiber
 *
 * @param {*} currentFiber
 */
function beginWork(currentFiber) {
  if (currentFiber.tag === TAG_ROOT) {
    updateHostRoot(currentFiber);
  } else if (currentFiber.tag === TAG_TEXT) {
    updateHostText(currentFiber);
  } else if (currentFiber.tag === TAG_HOST) {
    updateHost(currentFiber);
  }
}
function createDOM(currentFiber) {
  if (currentFiber.tag === TAG_TEXT) {
    return document.createTextNode(currentFiber.props.text);
  } else if (currentFiber.tag === TAG_HOST) {
    let stateNode = document.createElement(currentFiber.type);
    updateDOM(stateNode, {}, currentFiber.props);
    return stateNode;
  }
}

function updateHost(currentFiber) {
  if (!currentFiber.stateNode) {
    currentFiber.stateNode = createDOM(currentFiber);
  }
  const newChildren = currentFiber.children;
  reconcileChildren(currentFiber, newChildren);
}

function updateDOM(stateNode, oldProps, newProps) {
  setProps(stateNode, oldProps, newProps);
}

function updateHostText(currentFiber) {
  if (!currentFiber.stateNode) {
    currentFiber.stateNode = createDOM(currentFiber);
  }
}

function updateHostRoot(currentFiber) {
  let newChildren = currentFiber.props.children;
  reconcileChildren(currentFiber, newChildren);
}

function reconcileChildren(currentFiber, newChildren) {
  // 新的子节点索引
  let newChildIndex = 0;
  // 上个新的子节点的fiber
  let prevSibling;
  while (newChildIndex < newChildren.length) {
    let newChild = newChildren[newChildIndex];
    let tag;
    if (newChild.type === ELEMENT_TEXT) {
      // 文本节点
      tag = TAG_TEXT;
    } else if (typeof newChild.type === 'string') {
      // 原生节点
      tag = TAG_HOST;
    }
    let newFiber = {
      tag, // TAG_HOST
      type: newChild.type, // div
      props: newChild.props,
      stateNode: null, // 此时还没创建DOM元素
      return: currentFiber, // 父fiber
      effectTag: PLACEMENT, // 副作用标识, render阶段会收集副作用, 增加, 删除, 更新
      nextEffect: null, // effect list是一个链表, 顺序和完成顺序是一样的, 但是只放入有变化的fiber节点
    };
    if (newFiber) {
      if (newChildIndex === 0) {
        currentFiber.child = newFiber;
      } else {
        prevSibling.sibling = newFiber;
      }
      prevSibling = newFiber;
    }
    newChildIndex++;
  }
}

requestIdleCallback(workLoop, { timeout: 500 });
