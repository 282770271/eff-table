import TableHeaderColumn from './TableHeaderColumn'
import Search from '../components/Search'
import { on, off, hasClass, onMousemove, getCell } from 'utils/dom'

export default {
  name: 'TableHeader',
  props: {
    visibleColumns: { type: Array, default: () => [] },
    bodyColumns: { type: Array, default: () => [] },
    fixed: { type: String, default: '' }
  },
  components: { TableHeaderColumn, Search },
  data() {
    return {
      dragingTarget: null,
      height: 0,
      isDraging: false,
      isColumnsChange: false,
      searchData: []
    }
  },
  watch: {
    'table.scrollLeft'(val) {
      if (this.fixed) return
      this.$el.scrollLeft = val
    },
    'table.columns'() {
      // columns 变化之后重新渲染搜索组件
      this.isColumnsChange = true
      this.$nextTick(() => {
        this.isColumnsChange = false
      })
    }
  },
  computed: {
    dragStyle() {
      const { top, left, width } = this.dragingTarget && this.dragingTarget.getBoundingClientRect() || {}
      return {
        display: this.dragingTarget ? 'block' : 'none',
        height: this.table.heights.headerHeight + 'px',
        top: top + 'px',
        left: left + width - 8 + 'px'
      }
    }
  },
  inject: ['table'],
  render(h) {
    const { rowStyle, showSpace, search, heights } = this.table
    const { visibleColumns, bodyColumns } = this
    const height = heights.headerHeight + 'px'

    return (
      <div class='eff-table__header-wrapper'>
        <div
          class={{ 'eff-table__header': true, 'is--move': this.isDraging }}
          ref= 'header'
          style={{ ...rowStyle, ...{ height }}}
          on-click={this.handleClick}
          on-mousemove={this.handleMousemove}
          on-mouseleave={this.handleMouseleave}
        >
          {
            this.renderColumns(visibleColumns)
          }
          {
            showSpace ? <div class='eff-table__column is--space' style={height} /> : ''
          }
          {
            <div
              ref='dragMove'
              class='header-drag-move'
              style={this.dragStyle}
              on-mousedown={this.moveMousedown}
            />
          }
        </div>
        {
          search && !this.isColumnsChange ? <Search
            value={this.searchData}
            styles={rowStyle}
            columns={bodyColumns}
            showSpace={showSpace}
            on-input={val => (this.searchData = val)}
            on-change={val => this.table.$emit('search-change', val)}
          /> : ''
        }
      </div>
    )
  },
  methods: {
    sortChange(sort) {
      this.$emit('sort-change', sort)
    },
    renderColumns(columns) {
      let index = 0
      const { rowHeight, spaceWidth } = this.table
      const render = (columns, colid = '') => {
        return columns.reduce((acc, column, columnIndex) => {
          const { children = [] } = column
          const parent = colid ? `${colid}-${columnIndex + 1}` : `${columnIndex + 1}`
          if (column.prop && children.length) {
            const plat = arr => {
              return arr.reduce((acc, cur) => {
                const { children = [] } = cur
                return children.length ? acc.concat(plat(children)) : acc.concat(cur)
              }, [])
            }
            const width = plat(children).reduce((acc, cur) => acc + (cur.width || spaceWidth || 40), 0)
            acc.push(<div class='eff-table__header-group' style={{ maxWidth: width + 'px', minWidth: width + 'px' }}>
              <div class='header-title' style={{ maxHeight: rowHeight + 'px' }}>
                {column.title}
              </div>
              <div class='header-children'>
                {
                  render(children, parent)
                }
              </div>
            </div>)
          } else {
            acc.push(<TableHeaderColumn {...{
              attrs: {
                colid: parent,
                column,
                columnIndex,
                bodyColumnIndex: index
              },
              on: {
                'sort-change': this.sortChange
              }
            }}
            />)
            index += 1
          }
          return acc
        }, [])
      }
      return render(columns)
    },
    handleScroll(e) {
      this.table.scrollLeft = e.target.scrollLeft
    },
    handleClick(event) {
      const { table } = this
      const cell = getCell(event)
      let column
      if (cell) {
        const columnIndex = cell.getAttribute('data-colidx')
        column = table.bodyColumns[columnIndex]
        if (column) {
          table.$emit(`header-click`, { column, columnIndex, cell, event })
        }
      }
    },
    handleMousemove(e) {
      if (!this.table.border) return
      let target = e.target
      while (target && !hasClass(target, 'eff-table__column')) {
        target = target.parentNode
      }
      if (!target) return
      const header = this.$refs.header
      const dragMove = this.$refs.dragMove
      if (target.contains(header) || target === dragMove || this.dragingTarget === target || this.isDraging) return

      this.dragingTarget = hasClass(target, 'is--space') ? null : target
    },
    handleMouseleave() {
      !this.isDraging && setTimeout(() => {
        this.dragingTarget = null
      }, 110)
    },
    moveMousedown() {
      onMousemove({
        start: this.start,
        moveing: this.moveing,
        end: this.end
      })
    },
    start(e) {
      if (!this.dragingTarget) return
      this.table.lineShow = true
      const { right: columnRight } = this.dragingTarget.getBoundingClientRect()
      this.startX = columnRight + 2
      this.moveing()
    },
    moveing(moveX = 0, moveY) {
      if (!this.dragingTarget) return
      this.isDraging = true
      this.moveX = moveX

      const { table } = this
      const line = table.$refs.line

      const tableEl = table.$refs.table
      const { left: tableLeft, height: tableHeight, top: tableTop } = tableEl.getBoundingClientRect()
      const { left: columnLeft } = this.dragingTarget.getBoundingClientRect()
      const minLeft = columnLeft + 40
      const endLeft = this.startX + this.moveX
      const left = Math.max(minLeft, endLeft, tableLeft)
      line.style.cssText = `left:${left}px;top:${tableTop}px;height:${tableHeight}px;`
    },
    end() {
      this.table.lineShow = false
      this.isDraging = false
      const { visibleColumns } = this

      const colid = this.dragingTarget.getAttribute('data-colid')
      const colidx = this.dragingTarget.getAttribute('data-colidx')
      const width = this.dragingTarget.offsetWidth + this.moveX
      let obj = {}
      const ids = colid.split('-').map(d => +d)
      const [, next] = ids
      if (next) {
        const child = ids.reduce((acc, cur, idx) => {
          const num = +cur - 1
          if (idx === 0) {
            obj = visibleColumns[num]
            return obj
          } else {
            return acc.children[num]
          }
        }, {})
        child.width = width
      } else {
        obj = visibleColumns[colidx]
        obj.width = width
      }
      this.$emit('dragend', obj)

      setTimeout(() => {
        if (this.dragingTarget) {
          const dragMove = this.$refs.dragMove
          const { right } = this.dragingTarget.getBoundingClientRect()
          dragMove.style.left = right - dragMove.offsetWidth + 'px'
          this.dragingTarget = null
        }
      }, 100)
    }
  },
  mounted() {
    this.table.headerLoad = true
    on(this.$el, 'scroll', this.handleScroll)
    this.$nextTick(() => {
      this.height = this.$refs.header.offsetHeight
    })
  },
  beforeDestroy() {
    off(this.$el, 'scroll', this.handleScroll)
  }
}

