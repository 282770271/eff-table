<script>
import { getTextWidth } from 'pk/utils/dom'
export default {
  name: 'Checkbox',
  props: {
    value: Boolean,
    indeterminate: Boolean,
    disabled: Boolean,
    checked: Boolean,
    label: { type: [String, Number], default: '' },
    labelWidth: { type: Number, default: 0 }
  },
  inject: {
    transferPanel: { default: null }
  },
  data() {
    return {
      isChecked: this.value
    }
  },
  watch: {
    value(val) {
      this.isChecked = val
    }
  },
  methods: {
    handleChange() {
      if (this.disabled) return
      this.isChecked = !this.isChecked
      this.$emit('input', this.isChecked)
      this.$emit('change', this.isChecked)
    },
    handleMouseenter(e) {
      const { transferPanel, label: message, labelWidth } = this
      const { target } = e
      if (target && getTextWidth(target) > labelWidth) {
        transferPanel.tipShow({ reference: target, effect: 'dark', message, isFixed: true })
      }
    },
    handleMouseleave() {
      this.transferPanel.tipClose()
    }
  },
  render(h) {
    const { disabled, isChecked, indeterminate, label, labelWidth, transferPanel, handleChange, handleMouseenter, handleMouseleave } = this
    const labelStyle = {}
    let labelOn = {}
    if (labelWidth) {
      labelStyle.width = labelWidth + 'px'
      if (transferPanel) {
        labelOn = {
          mouseenter: handleMouseenter,
          mouseleave: handleMouseleave
        }
      }
    }
    return h('div', {
      class: {
        'eff-table__checkbox': true,
        'is--disabled': disabled,
        'is-checked': isChecked,
        'is-indeterminate': indeterminate
      },
      on: { click: handleChange }
    }, [
      h('span', { class: 'eff-table__checkbox-icon' }),
      label ? h('span', { ref: 'label', class: 'eff-table__checkbox-label', style: labelStyle, on: labelOn }, label) : ''
    ])
  }
}
</script>
