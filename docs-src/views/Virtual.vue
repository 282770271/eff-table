<template>
  <div class="page-home page">
    <h2>Virtual 虚拟滚动</h2>
    <p class="hint">
      数据大于 50 行时自动开启<span class="primary"> 行 </span>虚拟滚动<br>
      展开行与树形数据存在时自动禁用展开行
    </p>
    <section class="demo">
      <div class="section-content">
        <v-form
          :data="form"
          :columns="[
            {title: '列数量',prop: 'columnNum',itemRender:{
              name: 'select',
              options: [{label: 100, value: 100},{label: 500, value: 500},{label: 1000, value: 1000},{label: 2000, value: 2000}],
              on: {change: setColumns}
            }},
            {title: '行数量',prop: 'dataNum',itemRender:{
              name: 'select',
              options: [{label: 1000, value: 1000},{label: 3000, value: 3000},{label: 5000, value: 5000}, {label: 10000, value: 10000},{label: 20000, value: 20000}],
              on: {change: setData}
            }},
          ]"
        />
        <eff-table v-bind="tableOptions" />
      </div>
    </section>

    <section class="snippets">
      <Collapse>
        <div class="section-content">
          <CodeSnippet class="html" :code="htmlCode" />
          <CodeSnippet class="javascript" :code="jsCode" />
        </div>
      </Collapse>
    </section>
  </div>
</template>

<script>
import CodeSnippet from '../components/CodeSnippet.vue'
import Collapse from '../components/Collapse.vue'
import mock from 'mockjs'

const jsCode = `
  import mock from 'mockjs'
  export default {
    data() {
      return {
        form: { dataNum: 1000, columnNum: 100 },
        tableOptions: {
          maxHeight: 400,
          border: true,
          data: [],
          columns: []
        }
      }
    },
    mounted() {
      this.setColumns(10)
      this.setData(this.form.dataNum)
    },
    methods: {
      setColumns(val) {
        let num = 1
        this.tableOptions.columns = [{ type: 'index', width: 60 }].concat(mock.mock({
          ['array|' + val]: [
            {
              show: true,
              prop: 'name',
              title: () => '列' + num++,
              width: 200
            }
          ]
        }).array)
      },
      setData(val) {
        this.tableOptions.data = mock.mock({
          ['array|' + val]: [
            {
              'name': '@name'
            }
          ]
        }).array
      }
    }
  }
  `

const htmlCode = `
  <v-form
    :data="form"
    :columns="[
      {title: '列数量',prop: 'columnNum',itemRender:{
        name: 'select',
        options: [{label: 100, value: 100},{label: 500, value: 500},{label: 1000, value: 1000},{label: 2000, value: 2000}],
        on: {change: setColumns}
      }},
      {title: '行数量',prop: 'dataNum',itemRender:{
        name: 'select',
        options: [{label: 1000, value: 1000},{label: 3000, value: 3000},{label: 5000, value: 5000}, {label: 10000, value: 10000},{label: 20000, value: 20000}],
        on: {change: setData}
      }},
    ]"
  />
  <eff-table v-bind="tableOptions" />
  `

export default {
  name: 'Virtual',
  components: {
    CodeSnippet,
    Collapse
  },

  data() {
    return {
      htmlCode,
      jsCode,
      form: { dataNum: 1000, columnNum: 100 },
      tableOptions: {
        maxHeight: 400,
        border: true,
        data: [],
        columns: []
      }
    }
  },
  mounted() {
    this.setColumns(10)
    this.setData(this.form.dataNum)
  },
  methods: {
    setColumns(val) {
      let num = 1
      this.tableOptions.columns = [{ type: 'index', width: 60 }].concat(mock.mock({
        ['array|' + val]: [
          {
            show: true,
            prop: 'name',
            title: () => '列' + num++,
            width: 200
          }
        ]
      }).array)
    },
    setData(val) {
      this.tableOptions.data = mock.mock({
        ['array|' + val]: [
          {
            'name': '@name'
          }
        ]
      }).array
    }
  }
}
</script>
