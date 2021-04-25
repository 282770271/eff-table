import Table from './table/src/Table.vue'
import Popup from './popover/src/popup'
import Layout from './layout/src/layout'
import VRender from 'core/render/render'
import Styles from './styles/index.vue'

const components = [Table, Popup, Layout, VRender, Styles]

export {
  Table,
  Popup,
  Layout,
  VRender
}

const install = function(Vue, opts = {}) {
  components.forEach(component => {
    Vue.component(component.name, component)
  })

  Vue.prototype.$EFF = {
    request: opts.request
  }
}

if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue)
}

export default install
