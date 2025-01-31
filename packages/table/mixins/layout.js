import { on, off } from 'pk/utils/dom'

export default {
  data() {
    return {
      bodyWidth: 0,
      bodyWrapperWidth: 0,
      screenfullHeight: 0,
      offset: 0,
      overflowX: false,
      headerLoad: false,
      bodyLoad: false,
      toolbarHeightOffset: 0
    }
  },
  created() {
    on(window, 'resize', this.resize, { passive: true })
  },
  watch: {
    isScreenfull(val) {
      if (val) {
        this.tableMaxHeight = window.screen.height
        this.layoutTimer = setTimeout(() => {
          this.resize()
          val && this.$nextTick(() => {
            this.screenfullHeight = this.$el.getBoundingClientRect().height
          })
        }, 0)
      } else {
        this.tableMaxHeight = this.maxHeight
        this.layoutTimer = null
      }
    }
  },
  computed: {
    tableClass() {
      let tClass = 'eff-table__container'
      const { overflowX, overflowY, border, stripe, heights } = this
      const { bodyHeight, dataHeight } = heights
      overflowX && (tClass += ' is-overflow--x')
      overflowY && (tClass += ' is-overflow--y')
      border && (tClass += ' is--border')
      stripe && (tClass += ' is--stripe')
      bodyHeight === dataHeight && (tClass += ' is-bottom--coincide')
      return tClass
    },
    bodyRenderWidth() {
      const { columnIsVirtual, columnWidths, columnRenderIndex, columnRenderEndIndex, bodyWidth } = this
      return columnIsVirtual && columnRenderEndIndex ? columnWidths.slice(columnRenderIndex, columnRenderEndIndex).reduce((acc, cur) => acc + cur, 0) : bodyWidth
    },
    fixedHeight() {
      const { showSummary, heights, overflowX } = this
      if (showSummary) {
        return ''
      }
      const { headerHeight, bodyHeight, searchHeight } = heights
      let height = headerHeight + bodyHeight + searchHeight
      overflowX && (height -= 17)
      return height + 'px'
    },
    scrollYwidth() {
      return this.overflowY ? 17 : 0
    },
    scrollXwidth() {
      return this.overflowX ? 17 : 0
    },
    isScrollRightEnd() {
      const { bodyWrapperWidth, scrollLeft, bodyWidth, scrollYwidth } = this
      return bodyWrapperWidth + scrollLeft > bodyWidth + scrollYwidth
    },
    headerRanked() {
      function getDeepth(array) {
        function sum(arr, flag) {
          return arr.reduce((acc, cur) => {
            let accDeepth
            const { children } = cur
            if (Array.isArray(children)) {
              accDeepth = sum(children, flag + 1)
            }
            return accDeepth > acc ? accDeepth : acc
          }, flag)
        }
        return sum(array, 1)
      }

      return getDeepth(this.visibleColumns)
    },
    overflowY() {
      const { bodyHeight, tableMaxHeight, dataHeight } = this.heights
      const overflowXHeight = (this.overflowX ? 17 : 0)
      return bodyHeight && (tableMaxHeight ? dataHeight > tableMaxHeight : dataHeight > bodyHeight - overflowXHeight)
    },
    expandsHeight() {
      return this.expands.reduce((acc, cur) => cur.expanded ? acc + cur.height : acc, 0)
    },
    heights() {
      const { height, tableMaxHeight, isScreenfull, screenfullHeight, afterData, rowHeight, toolbarHeightOffset, headerRanked, search, headerLoad, bodyLoad, overflowX, treeNum, subtotalData, expandsHeight } = this
      const { toolbar, header, footer, footerAction } = this.$refs

      const toolbarHeight = toolbar ? rowHeight + toolbarHeightOffset : 0
      const headerHeight = headerLoad && header ? rowHeight * headerRanked : 0
      const searchHeight = search ? rowHeight : 0
      const footerHeight = footer ? rowHeight : 0
      const footerActionHeight = footerAction ? rowHeight : 0
      const dataHeight = afterData.length ? (afterData.length + treeNum + subtotalData.length) * rowHeight + expandsHeight : rowHeight
      const overflowXHeight = (overflowX ? 17 : 0)
      const tableHeight = isScreenfull ? screenfullHeight : tableMaxHeight || height || toolbarHeight + headerHeight + searchHeight + footerHeight + footerActionHeight + dataHeight
      let bodyHeight = (bodyLoad ? tableHeight - toolbarHeight - headerHeight - footerHeight - footerActionHeight - searchHeight : 0)
      if (tableMaxHeight && (dataHeight + overflowXHeight) <= bodyHeight) {
        bodyHeight = dataHeight + overflowXHeight
      }
      if (!height && !tableMaxHeight) {
        bodyHeight = dataHeight + overflowXHeight
      }
      return {
        tableHeight,
        dataHeight,
        toolbarHeight,
        headerHeight,
        searchHeight,
        footerHeight,
        footerActionHeight,
        bodyHeight: Math.max(bodyHeight, rowHeight)
      }
    },
    bodyRect() {
      const { columnIsVirtual, bodyWrapper } = this
      if (!columnIsVirtual || !bodyWrapper) return {}
      const { left, right } = bodyWrapper.getBoundingClientRect()
      const { leftWidth, rightWidth } = this
      return { bodyLeft: left + leftWidth, bodyRight: right + rightWidth }
    }
  },
  methods: {
    getBodyWidth() {
      let node = this.$el
      while (node && node.parentNode && node.getBoundingClientRect().width === 0) {
        node = node.parentNode || this.$el
      }
      return node.getBoundingClientRect().width
    },
    // 工具栏高度自适应
    setToolbarHeightOffset() {
      const { $refs, rowHeight } = this
      if (!$refs.toolbar) return
      const toolbar = $refs.toolbar.$el
      const toolbarLefts = [...toolbar.querySelector('.eff-table__toobar-left').childNodes]
      const toolbarRights = [...toolbar.querySelector('.eff-table__toobar-right').childNodes]
      const toolbarChildsHeight = toolbarLefts.concat(toolbarRights).map(d => d.offsetHeight || 0)
      const offsetHeight = rowHeight - Math.max(...toolbarChildsHeight)
      this.toolbarHeightOffset = offsetHeight < 12 ? 12 - offsetHeight : 0
    },
    resize() {
      this.$nextTick(() => {
        const { $el, setOverflowX, scrollLeftEvent } = this
        this.bodyWrapper = this.$refs.body.$el
        this.bodyWrapperWidth = this.getBodyWidth()
        setOverflowX()
        scrollLeftEvent()
        this.tableBodyEl = $el.querySelector('.eff-table__body')
        this.setToolbarHeightOffset()
      })
    },
    setOverflowX() {
      const { minWidth, bodyWrapperWidth, scrollYwidth, allMinWidth } = this
      this.bodyWidth = Math.max(bodyWrapperWidth - 2, minWidth, allMinWidth) - scrollYwidth
      this.overflowX = minWidth > (bodyWrapperWidth - 1 - scrollYwidth) || allMinWidth > minWidth && allMinWidth > (bodyWrapperWidth - 1 - scrollYwidth)
    },
    doLayout() {
      this.resize()
    }
  },
  activated() {
    this.timer = setTimeout(() => {
      this.resize()
      clearTimeout(this.timer)
    }, 300)
  },
  mounted() {
    this.resize()
    this.timer = setTimeout(() => {
      this.resize()
      clearTimeout(this.timer)
    }, 300)
  },
  beforeDestroy() {
    off(window, 'resize', this.resize, { passive: true })
    clearTimeout(this.timer)
  }
}
