import VCheckbox from 'pk/checkbox'
import VRadio from 'pk/radio'
import FormField from 'pk/form/src/form-field'
import { getTextWidth, eqCellValue } from 'pk/utils/dom'
import { renderer } from 'pk/utils/render'
import XEUtils from 'xe-utils'

export default {
  name: 'TableBodyColumn',
  props: {
    row: { type: Object, default: () => {} },
    rowIndex: { type: Number, default: 0 },
    column: { type: Object, default: () => {} },
    columnIndex: { type: Number, default: 0 },
    message: { type: Object, default: () => {} },
    fixed: { type: String, default: '' },
    disabled: Boolean,
    groupFloor: { type: Number, default: 0 },
    groupKey: { type: String, default: '' }
  },
  components: { VCheckbox, VRadio, FormField },
  inject: ['table'],
  data() {
    return {
      style: {},
      checked: false,
      expanded: (this.table.expands.find(d => d.rowIndex === this.rowIndex) || {}).expanded || false,
      groupStatus: 0
    }
  },
  computed: {
    columnClass() {
      let classes = `eff-table__column ` + (this.column.type === 'drag' ? '' : 'is-drag--filter')
      const { row, column, rowIndex, columnIndex, table } = this
      const { className, prop } = column
      const { cellClassName, editStore: { updateList }, rowId } = table
      const { message } = this.message || {}
      const sourceRow = updateList.find(d => {
        return d.$old[rowId] === row[rowId]
      })
      if (prop && sourceRow && !eqCellValue(sourceRow.$old, row, prop)) {
        classes += ' is--dirty'
      }
      if (className) {
        if (typeof className === 'function') {
          const c = className({ row, column, rowIndex, columnIndex })
          c && (classes += ` ${c}`)
        } else {
          classes += ` ${className}`
        }
      }
      if (message) classes += ' is--message'
      if (cellClassName) {
        if (typeof cellClassName === 'function') {
          const c = cellClassName({ row, column, rowIndex, columnIndex })
          c && (classes += ` ${c}`)
        } else {
          classes += ` ${cellClassName}`
        }
      }
      return classes
    }
  },
  methods: {
    groupClick(e) {
      const pos = this.table.columnGroupIds.indexOf(this.row[this.table.rowId])

      if (pos === -1) {
        this.table.columnGroupIds.push(this.row[this.table.rowId])
        if (!this.row.children || !this.row.children.length) {
          this.groupStatus = 3
          this.table.commitProxy('loadChildren', this.row, (arr) => {
            this.$set(this.row, 'children', arr)
            this.groupStatus = 2
          })
        }
      } else {
        this.table.columnGroupIds.splice(pos, 1)
      }
    },
    getStyle() {
      const defaultStyle = this.table.setColumnStyle(this.column, this.columnIndex, this.fixed)
      const paddingLeft = { paddingLeft: this.groupFloor * 28 + 'px' }

      if (this.row.rowIsSum) {
        this.style.backgroundColor = 'rgba(64, 184, 131, 0.18)'
      }
      return Object.assign(defaultStyle, this.style, paddingLeft)
    },
    renderSelection(h) {
      const { table, row } = this
      return <v-checkbox
        value={table.isChecked(row)}
        key={row[table.rowId]}
        on-change={selected => table.rowSelectionChange(row, selected)}
      />
    },
    renderRadio(h) {
      const { table, row } = this
      return <v-radio
        value={table.isChecked(row)}
        key={row[table.rowId]}
        on-change={selected => table.rowSelectionChange(row, selected, true)}
      />
    },
    cellRender(h) {
      const { table, row, rowIndex, column, columnIndex } = this
      const { cellRender, prop, config, type } = column
      if (typeof cellRender === 'function') {
        return cellRender(h, { row, rowIndex, column, columnIndex, prop })
      } else {
        const renderOpts = XEUtils.merge({}, config, cellRender)
        const { name, tag } = renderOpts
        const compConf = renderer.get(name) || tag && renderer.get('default')
        const sourceRow = table.tableSourceData[rowIndex]
        return compConf ? compConf.renderDefault(h, renderOpts, { root: table, vue: this, data: row, row, sourceRow, rowIndex, column, columnIndex, prop }) : type === 'index' ? rowIndex + 1 : prop ? row[prop] : ''
      }
    },
    expandRender() {
      const { expanded, disabled, expandClick } = this
      const expand = <span class={{ 'eff-icon-expand': true, 'is--expanded': expanded, 'is--disabled': disabled }} on-click={e => !disabled && expandClick(e)} />

      if (this.table.drag && this.table.rowDrag) {
        return [this.dragRender(), expand]
      }
      return expand
    },
    dragRender() {
      return <span class={{ 'eff-icon-drag': true }}>
        <span class='eff-icon-drag__stub'></span>
      </span>
    },
    handleMouseenter(event, slot) {
      if (this.$parent.summary) return
      const { row, column, rowIndex, columnIndex, table, $refs: { cell }} = this
      table.$emit('cell-mouse-enter', { row, column, rowIndex, columnIndex, cell, event, slot })
      if (!cell.classList.contains('eff-cell') && cell.childNodes.length) {
        return
      }

      const messages = []
      if (column.width && getTextWidth(cell) > Math.max(column.width, 40) || !column.width && getTextWidth(cell) > table.spaceWidth) {
        messages.push({ type: 'info', message: cell.innerText })
      }
      if (this.message && this.message.message) {
        messages.push({ type: 'error', message: this.message.message })
      }
      if (messages.length) {
        table.tipShow({ reference: cell.parentNode, message: messages })
      }
    },
    handleMouseleave(event, slot) {
      if (this.$parent.summary) return
      const { row, column, rowIndex, columnIndex, table, $refs: { cell }} = this
      table.$emit('cell-mouse-leave', { row, column, rowIndex, columnIndex, cell, event, slot })
      table.tipClose()
    },
    expandClick() {
      const { rowIndex, expanded, table } = this
      this.expanded = !expanded
      table.expandChange({ rowIndex, expanded: this.expanded })
    },

    handleMouseUp(event) {
      const { column, rowIndex, columnIndex, table, $refs: { cell }} = this
      table.$emit('cell-mouse-up', { column, columnIndex, cell, event, rowIndex })
    },
    handleMouseDown(event) {
      const { column, rowIndex, columnIndex, table, $refs: { cell }} = this
      table.$emit('cell-mouse-down', { column, columnIndex, cell, event, rowIndex })
    },
    handleMousemove(event) {
      const { column, rowIndex, columnIndex, table, $refs: { cell }} = this
      table.$emit('cell-mouse-move', { column, columnIndex, cell, event, rowIndex })
    }
  },
  render(h) {
    const { row, rowIndex, column, columnIndex, handleMouseenter, handleMouseleave, getStyle, handleMouseUp, handleMouseDown, handleMousemove } = this
    const { type } = column
    // row[columnIndex] summary合计列

    let slot
    if (type === 'expand') {
      slot = this.expandRender(h)
    } else if (type === 'drag') {
      slot = this.dragRender(h)
    } else if (row[columnIndex] !== undefined) {
      slot = row[columnIndex]
    } else if (type === 'selection') {
      slot = this.renderSelection(h)
    } else if (type === 'radio') {
      slot = this.renderRadio(h)
    } else {
      slot = this.cellRender(h)
    }

    let groupEl = ''
    if ((row.children && row.children.length || row.hasChildren) && column.prop === this.groupKey) {
      if (this.groupStatus < 3) {
        this.groupStatus = this.table.columnGroupIds.indexOf(this.row[this.table.rowId]) === -1 ? 1 : 2
      }

      groupEl = <span class={{ 'eff-icon-expand': true, 'is--expanded': this.groupStatus === 2 }} on-click={e => this.groupClick(e)} />

      if (this.groupStatus === 3) {
        groupEl = <div class='icon-loading'>
          {
            [0, 0, 0, 0, 0, 0, 0, 0].map(v => {
              return <div>
                <span class='blank'></span>
              </div>
            })
          }
        </div>
      }
    }

    return (
      <div
        class={this.columnClass}
        key={this.groupFloor + '-' + rowIndex + '-' + columnIndex}
        style={getStyle()}
        on-mouseenter={event => handleMouseenter(event, slot)}
        on-mouseleave={event => handleMouseleave(event, slot)}

        on-mouseup={event => handleMouseUp(event)}
        on-mousedown={event => handleMouseDown(event)}
        on-mousemove={event => handleMousemove(event)}
      >
        {groupEl}
        <div ref='cell' class='eff-cell'>
          {slot}
          {/* {h('form-field', { props: { row, rowIndex, prop, cascade, optionsFunc, rules }}, slot)} */}
        </div>
      </div>
    )
  }
}
