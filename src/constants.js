// 文本元素
export const ELEMENT_TEXT = Symbol.for('ELEMENT_TEXT');
// 根Fiber
export const TAG_ROOT = Symbol.for('TAG_ROOT');
// 原生节点 span div p, 区别函数组件 类组件
export const TAG_HOST = Symbol.for('TAG_HOST');
// 文本节点 字符串
export const TAG_TEXT = Symbol.for('TAG_TEXT');

// 插入
export const PLACEMENT = Symbol.for('PLACEMENT');
// 更新
export const UPDATE = Symbol.for('UPDATE');
// 删除
export const DELETION = Symbol.for('DELETION');
