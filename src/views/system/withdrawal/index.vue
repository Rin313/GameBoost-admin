<template>
  <div class="p-2">
    <div v-show="showSearch" class="mb-[10px]">
      <el-card shadow="hover">
        <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="姓名" prop="realName">
          <el-input v-model="queryParams.realName" placeholder="请输入姓名" clearable @keyup.enter="handleQuery" />
        </el-form-item>
          <el-form-item label="打款金额">
            <el-input-number
                v-model="queryParams.minAmount"
                placeholder="最小值"
                :precision="2"
            />
            <span style="margin: 0 8px; color: #909399;">至</span>
            <el-input-number
                v-model="queryParams.maxAmount"
                placeholder="最大值"
                :precision="2"
            />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="订单状态" clearable>
                <el-option v-for="dict in withdrawal_type" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
                <el-form-item label="创建时间">
                    <el-date-picker
                    v-model="dateRange"
                    type="datetimerange"
                    range-separator="至"
                    start-placeholder="开始时间"
                    end-placeholder="结束时间"
                    value-format="YYYY-MM-DDTHH:mm:ss"
                    :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
                    style="width: 380px"
                    />
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
            <el-button type="primary" plain :disabled="ok" @click="handleOk()">
              通过审核
            </el-button>
          </el-col>
            <el-col :span="1.5">
            <el-button type="warning" plain :disabled="canExport" @click="handleExport()">
              导出汇款表格
            </el-button>
          </el-col>
            <el-col :span="1.5">
            <el-button type="success" plain :disabled="canFinish" @click="handleFinish()">
              标记为完成
            </el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>
      <el-table border :data="withdrawalList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="申请编号" align="center" prop="id" :show-overflow-tooltip="true" />
        <el-table-column label="姓名" align="center" prop="realName" :show-overflow-tooltip="true" />
        <el-table-column label="打款金额" align="center" :show-overflow-tooltip="true" >
            <template #default="scope">
                <span>{{ formatAmount(scope.row.amount) }}</span>
            </template>
        </el-table-column>
        <el-table-column label="提交时间" align="center" prop="createTime"/>
        <el-table-column label="状态" align="center" prop="status">
            <template #default="scope">
                <el-tag v-if="scope.row.status !== '2'" :type="getStatusType(scope.row.status)">
                {{ getStatusLabel(scope.row.status) }}
                </el-tag>
                <!-- 驳回状态：Tag + Popover -->
                <el-popover
                v-else
                placement="top"
                title="驳回原因"
                :width="200"
                trigger="hover"
                :content="scope.row.remark || '暂无驳回原因'"
                >
                <template #reference>
                    <el-tag type="danger" style="cursor: pointer">
                    {{ getStatusLabel(scope.row.status) }}
                    <!-- 添加一个图标，增加视觉提示 -->
                    <el-icon class="el-icon--right"><QuestionFilled /></el-icon>
                    </el-tag>
                </template>
                </el-popover>
            </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip v-if="scope.row.status==='0'||scope.row.status==='1'" content="驳回申请" placement="top">
              <el-button link type="primary" icon="CloseBold" @click="handleReject(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="详细订单" placement="top">
              <el-button link type="primary" icon="Position" @click="handleDispatch(scope.row)"/>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { list,ook,finish,reject} from '@/api/withdrawal';
import { listPlayers } from '@/api/system/user';
import { useRouter } from 'vue-router';
const router = useRouter();
const withdrawalList = ref([]);
const ids = ref([]);
const selected =ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const showSearch=ref(true);
const dateRange = ref(['', '']);
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { withdrawal_type } = toRefs<any>(proxy?.useDict('withdrawal_type'));
const canExport=computed(()=>{
    return selected.value.length===0 || selected.value.some(item=>item.status!=='1');
})
const ok=computed(()=>{
    return selected.value.length===0 || selected.value.some(item=>item.status!=='0');
})
const canFinish=computed(()=>{
    return selected.value.length===0 || selected.value.some(item=>item.status!=='1');
})
const statusMap = computed(() => {
  const map: Record<string, { label: string; style: string }> = {};
  if (withdrawal_type.value) {
    withdrawal_type.value.forEach((item: any) => {
      map[item.value] = {
        label: item.label,
        style: item.elTagType
      };
    });
  }
  return map;
});
// 获取状态标签文本
const getStatusLabel = (status?: string | number): string => {
  if (status === undefined || status === null) return '';
  const statusStr = String(status);
  return statusMap.value[statusStr]?.label || statusStr;
};

// 获取状态标签类型（Element Plus 的 tag type）
const getStatusType = (status?: string | number): string => {
  if (status === undefined || status === null) return 'info';
  const statusStr = String(status);
  return statusMap.value[statusStr]?.style || 'info';
};
const queryFormRef = ref();

const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  minAmount:undefined,
  maxAmount:undefined,
  realName:'',
  status:'',
});

const getList = async () => {
  const res = await list(proxy?.addDateRange(queryParams.value, dateRange.value));
  withdrawalList.value = res.data.records;
  total.value = res.data.total;
    const tasks = res.data.records;

    if (tasks.length > 0) {
      // 提取当前页所有 createBy 组成数组（去重）
      const userIds = [...new Set(tasks.map(t => t.createBy))];
      
    
      const userRes = await listPlayers({ userIds: userIds } as any);
      
      // 构建用户映射表
      const userMap = new Map<any,any>();
      userRes.data.records.forEach((user) => {
        userMap.set(user.userId, user);
      });

      // 合并用户信息到任务列表
      withdrawalList.value = tasks.map(task => {
        const user = userMap.get(task.createBy);
        return {
          ...task,
          realName: user?.realName,
          phonenumber: user?.phonenumber
        };
      });
    } else {
      withdrawalList.value = [];
    }
};
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};
const resetQuery = () => {
    dateRange.value = ['', ''];
  queryFormRef.value?.resetFields();
  queryParams.value={
  pageNum: 1,
  pageSize: 10,
  minAmount:undefined,
  maxAmount:undefined,
  realName:'',
    status:'',
}
  handleQuery();
};
const formatAmount = (amount: number | string | null | undefined): string => {
    if (amount === null || amount === undefined || amount === '') {
        return '';
    }
    return '¥'+Number(amount).toFixed(2);
};
const handleDispatch = (row) => {
  router.push(`/withdrawal/dispatch/${row.extra.taskIds}`);
};
const handleExport = () => {
    proxy?.download(
        `/withdrawal/export/alipay?ids=${ids.value}`,
        {},
        `汇款_${new Date().getTime()}.xls`
    );
};
const handleOk = async() => {
  try{
    await proxy?.$modal.confirm('是否确认通过选中的打款申请？');
    await ook(ids.value);
    await getList();
    proxy?.$modal.msgSuccess('操作成功');
  }
  catch(err){}
};
const handleFinish = async() => {
try{
    await proxy?.$modal.confirm('是否将选中的申请标记为打款完成？');
    await finish(ids.value);
    await getList();
    proxy?.$modal.msgSuccess('操作成功');
  }
  catch(err){}
};
const handleSelectionChange = (selection) => {
    selected.value=selection;
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};
const handleReject = async (row) => {
    try{
        const res=await ElMessageBox.prompt('请输入驳回原因', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            closeOnClickModal: false,
        });
        await reject({
            id:row.id,
            remark:res.value
        });
        await getList();
        proxy?.$modal.msgSuccess('操作成功');
    }
    catch(err){}
};
onMounted(() => {
  getList();
});
</script>