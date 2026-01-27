<template>
  <div class="p-2">
    <!-- 搜索区域 -->
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
          <el-form-item label="订单类型" prop="orderType">
            <el-select v-model="queryParams.orderType" placeholder="请选择订单类型" clearable>
              <el-option v-for="item in order_type" :key="item" :label="item" :value="item" />
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

      <el-table border :data="orderList">
        <el-table-column label="订单编号" align="center" prop="orderNo" :show-overflow-tooltip="true" />
        <el-table-column label="截止日期" align="center" prop="deadline" width="180" />
        <el-table-column label="订单金额" align="center" prop="amount">
            <template #default="scope">
                <span>¥{{ formatAmount(scope.row.amount) }}</span>
            </template>
        </el-table-column>
        <el-table-column label="订单状态" align="center" prop="status">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="订单类型" align="center" prop="orderType"/>
        <el-table-column label="创建时间" align="center" prop="createTime" width="180" />
        <el-table-column label="操作" align="center" width="180" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" />
            </el-tooltip>
            <el-tooltip content="派单" placement="top">
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

    <!-- 新增/修改对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item v-if="!isUpdate" label="订单编号" prop="orderNo">
          <el-input v-model="form.orderNo" placeholder="请输入订单编号" />
        </el-form-item>
        <el-form-item label="客户账号" prop="customerAccount">
          <el-input v-model="form.customerAccount" placeholder="请输入客户账号" />
        </el-form-item>
        <el-form-item label="客户密码" prop="customerPassword">
          <el-input v-model="form.customerPassword" type="password" placeholder="请输入客户密码" show-password />
        </el-form-item>
        <el-form-item label="截止日期" prop="deadline">
          <el-date-picker
            v-model="form.deadline"
            type="datetime"
            placeholder="请选择截止日期"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="订单金额" prop="amount">
            <el-input-number 
                v-model="form.amount" 
                :min="0"
                :precision="2"
                :step="1.00"
                placeholder="请输入订单金额" 
                style="width: 100%"
            />
        </el-form-item>
        <el-form-item label="订单类型" prop="orderType">
          <el-select v-model="form.orderType" placeholder="请选择订单类型" style="width: 100%">
            <el-option v-for="item in order_type" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="isUpdate" label="订单状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择订单状态" style="width: 100%">
            <el-option label="进行中" value="0" />
            <el-option label="已完成" value="1" />
            <el-option label="已取消" value="3" />
            <el-option v-hasPermi="['system:order:settle']" label="已结算" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="需求" prop="requirement">
          <el-input v-model="form.requirement" type="textarea" :rows="4" placeholder="请输入需求" />
        </el-form-item>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, FormInstance, FormRules } from 'element-plus';
import { listOrder, addOrder, updateOrder } from '@/api/order';
import { OrderQuery, OrderVO, OrderInsertForm, OrderUpdateForm } from '@/api/order/types';

const router = useRouter();

// 列表数据
const orderList = ref<OrderVO[]>([]);
const total = ref(0);
const showSearch = ref(true);
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const order_type=ref([])

// 查询参数
const queryFormRef = ref<FormInstance>();
const dateRange = ref<string[]>([]);
const queryParams = ref<OrderQuery>({
  pageNum: 1,
  pageSize: 10,
  orderNo: undefined,
  orderType: undefined,
  beginTime: undefined,
  endTime: undefined
});

// 对话框相关
const dialogVisible = ref(false);
const dialogTitle = ref('');
const isUpdate = ref(false);
const formRef = ref<FormInstance>();

// 表单数据
const initFormData: OrderUpdateForm = {
  id: undefined,
  orderNo: undefined,
  customerAccount: undefined,
  customerPassword: undefined,
  deadline: undefined,
  amount: undefined,
  requirement: undefined,
  orderType: undefined,
  status: undefined,
  remark: undefined
};
const form = ref<OrderUpdateForm>({ ...initFormData });

// 表单校验规则
const rules = reactive<FormRules>({
  orderNo: [{ required: true, message: '订单编号不能为空', trigger: 'blur' }],
  customerAccount: [{ required: true, message: '客户账号不能为空', trigger: 'blur' }],
  customerPassword: [{ required: true, message: '客户密码不能为空', trigger: 'blur' }],
  deadline: [{ required: true, message: '截止日期不能为空', trigger: 'change' }],
  amount: [
        { 
            required: true, 
            message: '订单金额不能为空', 
            trigger: 'blur' 
        },
        { 
            type: 'number', 
            message: '订单金额必须为数字', 
            trigger: 'blur' 
        },
        {
            validator: (rule, value, callback) => {
                if (value !== null && value !== undefined) {
                    if (value < 0) {
                        callback(new Error('订单金额不能为负数'));
                    } else {
                        callback();
                    }
                } else {
                    callback();
                }
            },
            trigger: 'blur'
        }
    ],
  orderType: [{ required: true, message: '订单类型不能为空', trigger: 'change' }],
  requirement: [{ required: true, message: '需求不能为空', trigger: 'blur' }]
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
const handleUpdate = (row: OrderVO) => {
  resetForm();
  isUpdate.value = true;
  dialogTitle.value = '修改订单';
  form.value = {
    id: row.id,
    orderNo: row.orderNo,
    customerAccount: row.customerAccount,
    customerPassword: row.customerPassword,
    deadline: row.deadline,
    amount: row.amount,
    requirement: row.requirement,
    orderType: row.orderType,
    status: row.status,
    remark: row.remark,
  };
  dialogVisible.value = true;
};

// 跳转派单页面
const handleDispatch = (row: OrderVO) => {
  router.push(`/dispatch/${row.id}`);
};

// 重置表单
const resetForm = () => {
  form.value = { ...initFormData };
  formRef.value?.resetFields();
};

// 提交表单
const submitForm = async () => {
  const valid = await formRef.value?.validate();
  if (!valid) return;
  try {
    if (isUpdate.value) {
      await updateOrder(form.value as OrderUpdateForm);
      ElMessage.success('操作成功');
    } else {
      const insertData: OrderInsertForm = {
        orderNo: form.value.orderNo,
        customerAccount: form.value.customerAccount,
        customerPassword: form.value.customerPassword,
        deadline: form.value.deadline,
        amount: form.value.amount,
        requirement: form.value.requirement,
        orderType: form.value.orderType,
        remark:form.value.remark,
      };
      await addOrder(insertData);
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
    '3': '已取消'
  };
  return statusMap[status] || '未知';
};

// 获取状态类型
const getStatusType = (status: string): '' | 'success' | 'warning' | 'info' | 'danger' => {
  const typeMap: Record<string, '' | 'success' | 'warning' | 'info' | 'danger'> = {
    '0': 'info',
    '1': 'warning',
    '2': 'success',
    '3': 'danger'
  };
  return typeMap[status] || 'info';
};

const formatAmount = (amount: number | string | null | undefined): string => {
    if (amount === null || amount === undefined || amount === '') {
        return '0.00';
    }
    return Number(amount).toFixed(2);
};
onMounted(() => {
  getList();
  proxy?.getConfigKey('order_type').then((response) => {
    order_type.value = JSON.parse(response?.data || '[]');
  });
});
</script>

<style scoped>
.mb8 {
  margin-bottom: 8px;
}
</style>