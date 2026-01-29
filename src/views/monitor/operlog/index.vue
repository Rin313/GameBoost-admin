<template>
  <div class="p-2"><div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="操作地址" prop="operIp">
              <el-input v-model="queryParams.operIp" placeholder="请输入操作地址" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="系统模块" prop="title">
              <el-input v-model="queryParams.title" placeholder="请输入系统模块" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="操作人员" prop="operName">
              <el-input v-model="queryParams.operName" placeholder="请输入操作人员" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="类型" prop="businessType">
              <el-select v-model="queryParams.businessType" placeholder="操作类型" clearable>
                <el-option v-for="dict in oper_type" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="操作状态" clearable>
                <el-option v-for="dict in status_oper" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="操作时间" style="width: 308px">
              <el-date-picker
                v-model="dateRange"
                value-format="YYYY-MM-DD HH:mm:ss"
                type="daterange"
                range-separator="-"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
              ></el-date-picker>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>

    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button v-hasPermi="['monitor:operlog:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table
        ref="operLogTableRef"
        :data="operlogList"
        border
        :default-sort="defaultSort"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="日志编号" align="center" prop="operId" />
        <el-table-column label="系统模块" align="center" prop="title" :show-overflow-tooltip="true" />
        <el-table-column label="操作类型" align="center" prop="businessType">
          <template #default="scope">
            <dict-tag :options="oper_type" :value="scope.row.businessType" />
          </template>
        </el-table-column>
        <el-table-column
          label="操作人员"
          align="center"
          width="110"
          prop="operName"
          :show-overflow-tooltip="true"
          sortable="custom"
          :sort-orders="['descending', 'ascending']"
        />
        <el-table-column label="操作地址" align="center" prop="operIp" width="130" :show-overflow-tooltip="true" />
        <el-table-column label="操作状态" align="center" prop="status">
          <template #default="scope">
            <dict-tag :options="status_oper" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="操作日期" align="center" prop="operTime" width="180" sortable="custom" :sort-orders="['descending', 'ascending']">
          <template #default="scope">
            <span>{{ proxy.parseTime(scope.row.operTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="详细" placement="top">
              <el-button v-hasPermi="['monitor:operlog:query']" link type="primary" icon="View" @click="handleView(scope.row)"> </el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
    <OperInfoDialog ref="operInfoDialogRef" />
  </div>
</template>

<script setup lang="ts">
import { list } from '@/api/monitor/operlog';
import { OperLogForm, OperLogQuery, OperLogVO } from '@/api/monitor/operlog/types';
import OperInfoDialog from './oper-info-dialog.vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { oper_type, status_oper } = toRefs<any>(proxy?.useDict('oper_type', 'status_oper'));

const operlogList = ref<OperLogVO[]>([]);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const multiple = ref(true);
const total = ref(0);
const dateRange = ref<[DateModelType, DateModelType]>(['', '']);
const defaultSort = ref<any>({ prop: 'operTime', order: 'descending' });

const operLogTableRef = ref<ElTableInstance>();
const queryFormRef = ref<ElFormInstance>();

const data = reactive<PageData<OperLogForm, OperLogQuery>>({
  form: {
    operId: undefined,
    title: '',
    businessType: 0,
    operName: '',
    operUrl: '',
    operIp: '',
    operLocation: '',
    operParam: '',
    jsonResult: '',
    status: 0,
    errorMsg: '',
    operTime: ''
  },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    operIp: '',
    title: '',
    operName: '',
    businessType: '',
    status: '',
    orderByColumn: defaultSort.value.prop,
    sortOrder: defaultSort.value.order
  },
  rules: {}
});

const { queryParams } = toRefs(data);

/** 查询登录日志 */
const getList = async () => {
  const res = await list(proxy?.addDateRange(queryParams.value, dateRange.value));
  operlogList.value = res.data.records;
  total.value = res.data.total;
};
/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};
/** 重置按钮操作 */
const resetQuery = () => {
  dateRange.value = ['', ''];
  queryFormRef.value?.resetFields();
  queryParams.value.pageNum = 1;
  operLogTableRef.value?.sort(defaultSort.value.prop, defaultSort.value.order);
};
/** 多选框选中数据 */
const handleSelectionChange = (selection: OperLogVO[]) => {
  ids.value = selection.map((item) => item.operId);
  multiple.value = !selection.length;
};
/** 排序触发事件 */
const handleSortChange = (column: any) => {
  queryParams.value.orderByColumn = column.prop;
  queryParams.value.sortOrder = column.order;
  getList();
};

const operInfoDialogRef = ref<InstanceType<typeof OperInfoDialog>>();
/** 详细按钮操作 */
const handleView = (row: OperLogVO) => {
  operInfoDialogRef.value.openDialog(row);
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'monitor/operlog/export',
    {
      ...queryParams.value
    },
    `config_${new Date().getTime()}.xlsx`
  );
};
onMounted(() => {
  getList();
});
</script>
