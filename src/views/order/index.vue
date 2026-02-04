<template>
  <div class="p-2">
    <div v-show="showSearch" class="mb-[10px]">
      <el-card shadow="hover">
        <el-form ref="queryFormRef" :model="queryParams" :inline="true">
          <el-form-item label="订单编号" prop="orderNo">
            <el-input 
              v-model="queryParams.orderNo" 
              placeholder="请输入订单编号" 
              clearable 
              @keyup.enter="handleQuery" 
            />
          </el-form-item>
          <el-form-item label="业务类型" prop="orderType">
            <el-cascader
            v-model="orderTypeValue"
            :options="orderTypeOptions"
            :props="{ expandTrigger: 'hover' }"
            placeholder="请选择业务类型"
            clearable
            filterable
            @change="handleQueryOrderTypeChange"
            style="width: 240px"
            />
        </el-form-item>
          <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="订单状态" clearable>
                <el-option v-for="dict in status_order" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
          <el-form-item label="创建时间" prop="dateRange">
            <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 表格区域 -->
    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table border :data="orderList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="接单日期" align="center" prop="orderDate"/>
        <el-table-column label="淘宝会员名" align="center" prop="taobaoUsername"/>
        <el-table-column label="订单编号" align="center" prop="orderNo" :show-overflow-tooltip="true" />
        <el-table-column label="接单金额" align="center" prop="amount">
            <template #default="scope">
                <span>¥{{ formatAmount(scope.row.amount) }}</span>
            </template>
        </el-table-column>
        <el-table-column label="业务类型" align="center" prop="orderType"/>
        <el-table-column label="订单状态" align="center" prop="status">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" />
            </el-tooltip>
            <el-tooltip content="详细订单" placement="top">
              <el-button link type="primary" icon="Position" @click="handleDispatch(scope.row)"/>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-card>
      <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" append-to-body>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="接单日期" prop="orderDate">
        <el-date-picker
          v-model="form.orderDate"
          type="datetime"
          placeholder="请选择日期"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="淘宝会员名" prop="taobaoUsername">
        <el-input v-model="form.taobaoUsername" placeholder="请输入淘宝会员号" />
      </el-form-item>
      <el-form-item v-if="!isUpdate" label="订单编号" prop="orderNo">
        <el-input v-model="form.orderNo" placeholder="请输入订单编号" />
      </el-form-item>
      <el-form-item label="接单金额" prop="amount">
        <el-input-number 
          v-model="form.amount" 
          :min="0"
          :precision="2"
          :step="1.00"
          placeholder="请输入接单金额" 
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="业务类型" prop="orderType">
        <el-cascader
        v-model="formOrderTypeValue"
        :options="orderTypeOptions"
        :props="{ expandTrigger: 'hover' }"
        placeholder="请选择业务类型"
        clearable
        filterable
        @change="handleOrderTypeChange"
        style="width: 240px"
        />
    </el-form-item>
      <el-form-item v-if="isUpdate" label="订单状态" prop="status">
        <el-select v-hasPermi="['system:order:controlStatus']" v-model="form.status" placeholder="请选择订单状态" style="width: 100%">
          <el-option label="进行中" value="0" />
          <el-option label="已完成" value="1" />
          <el-option label="已结算" value="2" />
          <el-option label="已取消" value="3" />
          <el-option label="已完成未结算" value="4" />
        </el-select>
      </el-form-item>
      
      <!-- ========== 新增 tasks 字段 ========== -->
      <el-form-item label="订单分配" prop="tasks">
        <div style="width: 100%">
          <el-button type="primary" :icon="Plus" @click="openDialog">
            添加人员
          </el-button>
          
          <!-- tasks 列表展示 -->
          <el-table 
            v-if="taskList.length > 0" 
            :data="taskList" 
            style="margin-top: 10px"
            border
            size="small"
          >
            <el-table-column prop="realName" label="姓名" min-width="120" />
            <el-table-column label="派单金额" min-width="150">
              <template #default="{ row, $index }">
                <el-input-number
                  v-model="row.taskAmount"
                  :min="0"
                  :precision="2"
                  :step="1.00"
                  size="small"
                  controls-position="right"
                  style="width: 100%"
                  @change="handleTaskAmountChange($index, $event)"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="70" align="center">
              <template #default="{ $index }">
                <el-button 
                  type="danger" 
                  :icon="Delete" 
                  size="small" 
                  circle
                  @click="removeTask($index)"
                />
              </template>
            </el-table-column>
          </el-table>
          
          <el-empty v-else description="暂无分配人员" :image-size="60" />
        </div>
      </el-form-item>
      <!-- ========== tasks 字段结束 ========== -->
      
      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </template>
  </el-dialog>
  
  <select-user ref="selectRef" @ok="handleUserSelected"/>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ElMessage, FormInstance, FormRules } from 'element-plus';
import { listOrder, addOrder, updateOrder } from '@/api/order';
import { OrderVO } from '@/api/order/types';
import SelectUser from './selectUser.vue';
import { listPlayers } from '@/api/system/user';
import { Delete, Plus } from '@element-plus/icons-vue';
const router = useRouter();
// 列表数据
const orderList = ref<OrderVO[]>([]);
const ids = ref<Array<number | string>>([]);
const selected =ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const showSearch = ref(true);
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { status_order } = toRefs<any>(proxy?.useDict('status_order'));
const order_type = ref<Record<string, string[]>>({})
// 级联选择器绑定值 [一级分类, 二级分类]
const orderTypeValue = ref<string[]>([])
const orderTypeOptions = computed(() => {
  return Object.entries(order_type.value).map(([category, items]) => ({
    value: category,
    label: category,
    children: (items || []).map(item => ({
      value: item,
      label: item
    }))
  }))
})
const handleQueryOrderTypeChange = (value: string[] | null) => {
  if (value && value.length === 2) {
    queryParams.value.orderType = `${value[0]}/${value[1]}`
  } else {
    queryParams.value.orderType = ''
  }
}
const formOrderTypeValue= ref<string[]>([])
const handleOrderTypeChange = (value: string[] | null) => {
  if (value && value.length === 2) {
    form.value.orderType = `${value[0]}/${value[1]}`
  } else {
    form.value.orderType = ''
  }
}
const selectRef = ref();
// 查询参数
const queryFormRef = ref<FormInstance>();
const dateRange = ref<string[]>([]);
const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  orderNo: undefined,
  beginTime: undefined,
  endTime: undefined,
  status:'',
    orderType: ''
});
interface Task {
  userId: string | number;
  taskAmount: number;
}

interface TaskDisplay extends Task {
  realName: string;
}
const taskList = ref<TaskDisplay[]>([]);
// 对话框相关
const dialogVisible = ref(false);
const dialogTitle = ref('');
const isUpdate = ref(false);
const formRef = ref<FormInstance>();

const form = ref();

// 表单校验规则
const rules = reactive<FormRules>({
  orderNo: [{ required: true, message: '订单编号不能为空', trigger: 'blur' }],
  taobaoUsername: [{ required: true, message: '淘宝会员名不能为空', trigger: 'blur' }],
  orderDate: [{ required: true, message: '接单日期不能为空', trigger: 'change' }],
  amount: [
        { 
            required: true, 
            message: '接单金额不能为空', 
            trigger: 'blur' 
        }
    ],
    // 修改后的角色验证规则
    tasks: [
      {
        required: true,
        validator: (rule: any, value: Task[], callback: any) => {
          if (!value || value.length === 0) {
            callback(new Error('请分配打手'));
          } else if (value.some((item) => !item.taskAmount)) {
            callback(new Error('请设置派单金额'));
          } else {
            callback();
          }
        },
        trigger: 'change'
      }
    ],
  orderType: [{ required: true, message: '业务类型不能为空', trigger: 'change' }]
});

// 获取订单列表
const getList = async () => {
  try {
    // 处理时间范围
    if (dateRange.value && dateRange.value.length === 2) {
      queryParams.value.beginTime = dateRange.value[0];
      queryParams.value.endTime = dateRange.value[1];
    } else {
      queryParams.value.beginTime = undefined;
      queryParams.value.endTime = undefined;
    }
    const res = await listOrder(queryParams.value);
    orderList.value = res.data.records;
    total.value = res.data.total;
  } finally {
  }
};

// 搜索
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

// 重置查询
const resetQuery = () => {
  dateRange.value = [];
  queryFormRef.value?.resetFields();
  queryParams.value.orderType = ''
  handleQuery();
};

// 新增
const handleAdd = () => {
  resetForm();
  isUpdate.value = false;
  dialogTitle.value = '新增订单';
  dialogVisible.value = true;
};

// 修改
const handleUpdate = async (row) => {
  resetForm();
  isUpdate.value = true;
  dialogTitle.value = '修改订单';
  form.value = {
    id: row.id,
    orderNo: row.orderNo,
    orderDate: row.orderDate,
    taobaoUsername: row.taobaoUsername,
    amount: row.amount,
    orderType: row.orderType,
    status: row.status,
    remark: row.remark,
    tasks: row.tasks,
  };
  if (row.tasks && row.tasks.length > 0) {
    taskList.value = await loadUsernames(row.tasks);
  }
  dialogVisible.value = true;
};

const handleDispatch = (row: OrderVO) => {
  router.push(`/dispatch/${row.id}`);
};

// 重置表单
const resetForm = () => {
  form.value = {
    tasks: [],
  };
  taskList.value = [];
  formRef.value?.resetFields();
};

// 提交表单
const submitForm = async () => {
  await formRef.value?.validate();
  try {
    if (isUpdate.value) {
      await updateOrder(form.value);
      ElMessage.success('操作成功');
    } else {
      await addOrder(form.value);
      ElMessage.success('操作成功');
    }
    dialogVisible.value = false;
    getList();
  } finally {
  }
};

// 获取状态标签
const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    '0': '进行中',
    '1': '已完成',
    '2': '已结算',
    '3': '已取消',
    '4': '已完成未结算'
  };
  return statusMap[status] || '未知';
};

// 获取状态类型
const getStatusType = (status: string): '' | 'success' | 'warning' | 'info' | 'danger' => {
  const typeMap: Record<string, '' | 'success' | 'warning' | 'info' | 'danger'> = {
    '0': 'info',
    '1': 'warning',
    '2': 'success',
    '3': 'danger',
    '4': 'warning'
  };
  return typeMap[status] || 'info';
};

const formatAmount = (amount: number | string | null | undefined): string => {
    if (amount === null || amount === undefined || amount === '') {
        return '0.00';
    }
    return Number(amount).toFixed(2);
};
/** 选择条数  */
const handleSelectionChange = (selection) => {
    selected.value=selection;
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};
const openDialog = () => {
    const userIds = taskList.value.map(task => task.userId);
  selectRef.value?.show(userIds);
};
// 处理用户选择回调
const handleUserSelected = async (selection: any[]) => {
  if (!selection || selection.length === 0) return;
  
  const userIds = selection.map(item => item.userId);
  
  try {
    const { data } = await listPlayers({ userIds: userIds } as any);
    
    data.records.forEach((user: any) => {
      taskList.value.push({
          userId: user.userId,
          realName: user.realName,
          taskAmount: 0,
        });
    });
    // 同步更新 form.tasks
    syncFormTasks();
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
};

// 同步 taskList 到 form.tasks
const syncFormTasks = () => {
  form.value.tasks = taskList.value.map(item => ({
    userId: item.userId,
    taskAmount: item.taskAmount,
  }));
};

// 任务金额变化处理
const handleTaskAmountChange = (index: number, value: number) => {
  taskList.value[index].taskAmount = value ?? 0;
  syncFormTasks();
};

// 删除任务
const removeTask = (index: number) => {
  taskList.value.splice(index, 1);
  syncFormTasks();
};

// 根据 userIds 加载用户名
const loadUsernames = async (tasks: Task[]): Promise<TaskDisplay[]> => {
  if (!tasks || tasks.length === 0) return [];
  
  const userIds = tasks.map(task => task.userId);
  
  try {
    const { data } = await listPlayers({ userIds: userIds } as any);
    
    // 创建 userId -> username 映射
    const userMap = new Map<string | number, string>();
    data.records.forEach((user: any) => {
      userMap.set(user.userId, user.realName);
    });
    
    // 返回带 username 的任务列表
    return tasks.map(task => ({
      userId: task.userId,
      taskAmount: task.taskAmount,
      realName: userMap.get(task.userId) || `${task.userId}`,
    }));
  } catch (error) {
    console.error('加载用户名失败:', error);
    // 失败时用 userId 作为显示
    return tasks.map(task => ({
      userId: task.userId,
      taskAmount: task.taskAmount,
      realName: `${task.userId}`,
    }));
  }
};


onMounted(() => {
  getList();
  proxy?.getConfigKey('order_type').then((response) => {
    order_type.value = JSON.parse(response?.data || '{}');
  });
});
</script>

<style scoped>
.mb8 {
  margin-bottom: 8px;
}
</style>