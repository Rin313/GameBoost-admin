<!-- @/views/bizLog/deposit/index.vue -->

<template>
  <div class="p-2">
    <!-- 搜索区域 -->
    <div v-show="showSearch" class="mb-[10px]">
      <el-card shadow="hover">
        <el-form ref="queryFormRef" :model="queryParams" :inline="true">
          <el-form-item label="业务类型" prop="bizType">
            <el-input 
              v-model="queryParams.bizType" 
              placeholder="请输入业务类型" 
              clearable 
              style="width: 200px"
              @keyup.enter="handleQuery" 
            />
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

    <!-- 表格区域 -->
    <el-card shadow="hover">
        <template #header>
        <el-row :gutter="10" class="mb8">
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>
      <el-table border :data="bizLogList" style="width: 100%">
        <el-table-column label="流水编号" align="center" prop="id" min-width="120" :show-overflow-tooltip="true" />
        <el-table-column label="业务类型" align="center" prop="bizType" min-width="120" :show-overflow-tooltip="true" />
        <el-table-column label="用户名" align="center" prop="userName" min-width="100" :show-overflow-tooltip="true" />
        <el-table-column label="真实姓名" align="center" prop="realName" min-width="100" :show-overflow-tooltip="true" />
        <el-table-column label="手机号码" align="center" prop="phonenumber" min-width="120" :show-overflow-tooltip="true" />
        <el-table-column label="变动数额" align="center" min-width="120">
          <template #default="scope">
            <template v-if="scope.row.assetLog && scope.row.assetLog.length > 0">
              <div v-for="(item, index) in scope.row.assetLog" :key="index" class="asset-item">
                {{ item.amount ?? '-' }}
              </div>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="变动前余额" align="center" min-width="120">
          <template #default="scope">
            <template v-if="scope.row.assetLog && scope.row.assetLog.length > 0">
              <div v-for="(item, index) in scope.row.assetLog" :key="index" class="asset-item">
                {{ item.before ?? '-' }}
              </div>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="变动后余额" align="center" min-width="120">
          <template #default="scope">
            <template v-if="scope.row.assetLog && scope.row.assetLog.length > 0">
              <div v-for="(item, index) in scope.row.assetLog" :key="index" class="asset-item">
                {{ item.after ?? '-' }}
              </div>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" min-width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.createTime) }}</span>
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
  </div>
</template>

<script setup lang="ts">
import { listCredit } from '@/api/bizLog';
import { listPlayers } from '@/api/system/user';
import { BizLogVO, BizLogQuery } from '@/api/bizLog/types';
import { UserVO } from '@/api/system/user/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { parseTime } = proxy;

// 列表数据
const bizLogList = ref<BizLogVO[]>([]);
const showSearch=ref(true)
const total = ref(0);

// 时间范围
const dateRange = ref<[string, string] | null>(null);

// 表单引用
const queryFormRef = ref<ElFormInstance>();

// 查询参数
const queryParams = ref<BizLogQuery>({
  pageNum: 1,
  pageSize: 10,
  bizType: undefined,
  beginTime: undefined,
  endTime: undefined
});

/**
 * 获取列表数据
 */
const getList = async () => {
  try {
    // 处理时间范围参数
    if (dateRange.value && dateRange.value.length === 2) {
      queryParams.value.beginTime = dateRange.value[0];
      queryParams.value.endTime = dateRange.value[1];
    } else {
      queryParams.value.beginTime = undefined;
      queryParams.value.endTime = undefined;
    }

    // 获取业务日志列表
    const res = await listCredit(queryParams.value);
    bizLogList.value = res.data.records || [];
    total.value = res.data.total || 0;

    // 获取用户信息并关联
    await fetchUserInfo();
  } catch (error) {
    console.error('获取列表失败:', error);
  } finally {
  }
};

/**
 * 获取用户信息并关联到列表数据
 */
const fetchUserInfo = async () => {
  if (bizLogList.value.length === 0) return;

  // 提取去重的 createBy 数组
  const userIds = [...new Set(
    bizLogList.value
      .map(item => item.createBy)
      .filter(id => id !== null && id !== undefined)
  )];

  if (userIds.length === 0) return;

  try {
    const userRes = await listPlayers({ 
      userIds: userIds,
      pageNum: 1,
      pageSize: userIds.length
    });
    
    // 构建用户ID到用户信息的映射
    const userList = userRes.data.records || [];
    const userMap = new Map<number, UserVO>();
    userList.forEach((user: UserVO) => {
      if (user.userId) {
        userMap.set(user.userId, user);
      }
    });

    // 关联用户信息到列表数据
    bizLogList.value.forEach(item => {
      const user = userMap.get(item.createBy);
      if (user) {
        item.userName = user.userName;
        item.realName = user.realName;
        item.phonenumber = user.phonenumber;
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
};

/**
 * 搜索按钮操作
 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/**
 * 重置按钮操作
 */
const resetQuery = () => {
  dateRange.value = null;
  queryFormRef.value?.resetFields();
  queryParams.value = {
    pageNum: 1,
    pageSize: 10,
    bizType: undefined,
    beginTime: undefined,
    endTime: undefined
  };
  handleQuery();
};

// 页面加载时获取数据
onMounted(() => {
  getList();
});
</script>

<style scoped lang="scss">
.asset-item {
  line-height: 1.5;
  
  &:not(:last-child) {
    border-bottom: 1px dashed #eee;
    padding-bottom: 4px;
    margin-bottom: 4px;
  }
}
</style>