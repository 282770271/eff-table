export default {
  name: 'popup',
  props: {
    content: { type: String, default: '' }
  },
  inject: ['table'],
  data() {
    return {
      visible: false
    }
  },
  methods: {
    focus() {
      this.visible = true
      this.table.$refs.popovers.editTipShow({ reference: this.$el, vslot: this.$slots.default, placement: 'bottom' })
    },
    close() {
      this.visible = false
      this.table.$refs.popovers.editTipClose()
    },
    blur() {
      this.close()
    }
  },
  render(h) {
    return <div class='eff-table__popup'>{this.content}</div>
  }
}
