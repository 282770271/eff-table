import map from './map'
import XEUtils from 'xe-utils'
import { getOn } from 'pk/utils/render'

export function getChildren(h, opts, params, key) {
  if (opts) {
    const children = XEUtils.clone(opts)
    if (children.on) {
      children.on = getOn({}, children.on, params)
    }
    if (children.constructor.name === 'VNode') return children

    if (XEUtils.isFunction(children)) return getChildren(h, children(h, params), params)

    if (XEUtils.isArray(children)) return children.map((child, idx) => getChildren(h, child, params, idx))

    if (XEUtils.isObject(children)) {
      const { children: childs } = children
      const childrenRender = getChildren(h, childs, params)
      const opts = Object.assign({}, children, { key, children: childrenRender })
      return render(h, opts, params).render()
    }
    return children
  }

  return undefined
}

/**
 * 基础渲染函数
 */
class Render {
  constructor(h, renderOpts = {}, params = {}) {
    const { children } = renderOpts
    this.h = h
    this.params = params
    this.opts = renderOpts
    this.children = getChildren(h, children, params)
  }

  // 合并属性 外部传入属性 > 默认属性

  mergeOpts(opts) {
    for (const key in opts) {
      const opt = opts[key]
      this.opts[key] = Object.assign({}, this.opts[key], opt)
    }
    return this
  }

  // 设置opts属性
  setOpts(key, value) {
    this.opts[key] = value
    return this
  }
  // 设置opts属性
  set(key, value) {
    this[key] = value
    return this
  }

  render() {
    const { h, opts, params, children } = this
    const { name, tag, defaultSlot, disabled } = opts
    const { vue = {}} = params
    const { renderMap = {}} = vue.$EFF || {}
    // 处理禁用
    if (disabled && XEUtils.isFunction(disabled)) {
      opts.props.disabled = disabled(params)
    }
    return h(tag || renderMap[name] || map.get(name), opts, [children, defaultSlot])
  }
}

export function render(h, renderOpts, params) {
  if (params && typeof (params._beforeRender_) === 'function') {
    params._beforeRender_(renderOpts, h)
  }
  const { props } = renderOpts
  if (props && typeof props === 'function') {
    renderOpts.props = props(params)
  }
  return new Render(h, renderOpts, params)
}
