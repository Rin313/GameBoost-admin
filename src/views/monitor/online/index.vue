<template>
  <div class="p-2">
    <div v-show="showSearch" class="mb-[10px]">
      <el-card shadow="hover">
        <el-form ref="queryFormRef" :model="queryParams" :inline="true">
          <el-form-item label="登录地址" prop="ipaddr">
            <el-input v-model="queryParams.ipaddr" placeholder="请输入登录地址" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="用户名" prop="userName">
            <el-input v-model="queryParams.userName" placeholder="请输入用户名" clearable @keyup.enter="handleQuery" />
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
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>
      <el-table
        border
        :data="onlineList.slice((queryParams.pageNum - 1) * queryParams.pageSize, queryParams.pageNum * queryParams.pageSize)"
      >
        <el-table-column label="会话编号" align="center" prop="tokenId" :show-overflow-tooltip="true" />
        <el-table-column label="登录名称" align="center" prop="userName" :show-overflow-tooltip="true" />
        <el-table-column label="客户端" align="center" prop="clientKey" :show-overflow-tooltip="true" />
        <el-table-column label="主机" align="center" prop="ipaddr" :show-overflow-tooltip="true" />
        <el-table-column label="登录时间" align="center" prop="loginTime">
          <template #default="scope">
            <span>{{ proxy.parseTime(scope.row.loginTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="强退" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleForceLogout(scope.row)"/>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { forceLogout, list} from '@/api/monitor/online';
import { OnlineQuery, OnlineVO } from '@/api/monitor/online/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const onlineList = ref<OnlineVO[]>([]);
const total = ref(0);
const showSearch=ref(true)

const queryFormRef = ref<ElFormInstance>();

const queryParams = ref<OnlineQuery>({
  pageNum: 1,
  pageSize: 10,
  ipaddr: '',
  userName: ''
});

const getList = async () => {
  const res = await list(queryParams.value);
  onlineList.value = res.data.records;
  total.value = res.data.total;
};
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};
const handleForceLogout = async (row: OnlineVO) => {
    try{
        await proxy?.$modal.confirm('是否确认强退名称为"' + row.userName + '"的用户?');
        await forceLogout(row.tokenId);
        await getList();
        proxy?.$modal.msgSuccess('删除成功');
    }
    catch(err){}
};

onMounted(() => {
  getList();
});
</script>
