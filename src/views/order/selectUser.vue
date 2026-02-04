<template>
  <el-row>
    <el-dialog v-model="visible" title="选择打手" width="800px" top="5vh" append-to-body>
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="queryParams.realName" placeholder="请输入姓名" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="手机号码" prop="phonenumber">
          <el-input v-model="queryParams.phonenumber" placeholder="请输入手机号码" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <el-row>
        <el-table ref="tableRef" border :data="userList" height="260px" @row-click="clickRow" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55"></el-table-column>
            <el-table-column key="realName" label="姓名" align="center" prop="realName" />
            <el-table-column key="phonenumber" label="手机号码" align="center" prop="phonenumber"/>
            <el-table-column key="credit" label="信誉分" align="center" prop="assets.credit"/>
            <el-table-column label="创建时间" align="center" prop="createTime"/>
        </el-table>
        <pagination v-if="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
      </el-row>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleSelectUser">确 定</el-button>
          <el-button @click="clean">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </el-row>
</template>

<script setup lang="ts">
import { listPlayers } from '@/api/system/user';
import { UserVO } from '@/api/system/user/types';

// 移除了 orderId prop，因为不再需要调用 insertTask
const { proxy } = getCurrentInstance() as any;
const userList = ref<UserVO[]>([]);
const visible = ref(false);
const total = ref(0);

// 改为直接存储 selection
const selection = ref<UserVO[]>([]);

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  phonenumber: '',
  realName: '',
  status: '0',
});

const tableRef = ref<ElTableInstance>();
const queryFormRef = ref<ElFormInstance>();

const show = (excluded) => {
  getList(excluded);
  visible.value = true;
};

const clickRow = (row: UserVO) => {
  tableRef.value?.toggleRowSelection(row, undefined);
};

// 直接存储 selection 而不是计算 userIds
const handleSelectionChange = (selected: UserVO[]) => {
  selection.value = selected;
};

const getList = async (excluded?) => {
  const res = await listPlayers({...queryParams,excluded});
  let list = res.data.records;
  userList.value = list;
  total.value = res.data.total;
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  getList();
};

// 修改 emit 类型，传递 selection
const emit = defineEmits<{
  (e: 'ok', selection: UserVO[]): void;
}>();

// 不再调用 insertTask，直接将 selection 传递给外部组件
const handleSelectUser = () => {
  if (selection.value.length <= 0) {
    proxy?.$modal.msgWarning('请至少选择一个用户');
    return;
  }
  emit('ok', selection.value);
  clean();
};

const clean = () => {
  queryParams.pageNum = 1;
  selection.value = []; // 清空选中状态
  visible.value = false;
};

defineExpose({
  show
});
</script>