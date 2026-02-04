<template>
  <div class="p-2">
    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Close" @click="handleClose">关闭</el-button>
          </el-col>
          <right-toolbar @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table border :data="taskList">
        <el-table-column label="派单编号" align="center" prop="id" />
        <el-table-column label="姓名" align="center" prop="realName" :show-overflow-tooltip="true" />
        <el-table-column label="手机号" align="center" prop="phonenumber" />
        <el-table-column label="创建时间" align="center" prop="createTime" />
        <el-table-column label="状态" align="center" prop="status">
            <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                {{ getStatusLabel(scope.row.status) }}
                </el-tag>
            </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="显示详细" placement="top">
              <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" />
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
    <el-dialog v-model="detailVisible" title="任务详情" width="900px" destroy-on-close>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="派单编号">{{ currentTask?.id }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ currentTask?.realName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机号" :span="2">{{ currentTask?.phonenumber || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentTask?.createTime }}</el-descriptions-item>
        <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentTask?.status)">
                {{ getStatusLabel(currentTask?.status) }}
            </el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <el-divider content-position="left">截图信息</el-divider>
      <el-row :gutter="20">
        <el-col 
          v-for="(label, index) in screenshotLabels" 
          :key="index" 
          :span="8" 
          class="mb-4"
        >
          <el-card shadow="never" class="screenshot-card">
            <template #header>
              <span class="text-sm font-medium">{{ label }}</span>
            </template>
            <div class="screenshot-content">
              <el-image
                v-if="currentTask?.screenshots?.[label]"
                :src="getImageUrl(currentTask.screenshots[label])"
                :preview-src-list="getPreviewList()"
                :initial-index="index"
                fit="contain"
                class="screenshot-image"
              />
              <el-empty v-else description="暂无图片" :image-size="60" />
            </div>
          </el-card>
        </el-col>
      </el-row>

      <template #footer>
        <el-button @click="detailVisible = false">关 闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { listTasks } from '@/api/order';
import { listPlayers } from '@/api/system/user';
import { TaskQuery, TaskWithUser } from '@/api/order/types';
import { UserVO } from '@/api/system/user/types';
import { RouteLocationNormalized } from 'vue-router';
import { getImageUrl } from '@/utils/img';
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();

const { task_type } = toRefs<any>(proxy?.useDict('task_type'));

const ids = computed(() => String(route.params.ids));
const taskList = ref<TaskWithUser[]>([]);
const total = ref(0);

const queryParams = ref<TaskQuery>({
  pageNum: 1,
  pageSize: 10
});

// 详情弹窗相关
const detailVisible = ref(false);
const currentTask = ref<TaskWithUser | null>(null);
// 截图标签
const screenshotLabels = ['账号资产-前', '账号资产-后', '仓库对比-前', '仓库对比-后', '老板结单图'] as const;

const statusMap = computed(() => {
  const map: Record<string, { label: string; style: string }> = {};
  if (task_type.value) {
    task_type.value.forEach((item: any) => {
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

// 获取状态标签类型
const getStatusType = (status?: string | number): string => {
  if (status === undefined || status === null) return 'info';
  const statusStr = String(status);
  return statusMap.value[statusStr]?.style || 'info';
};

/**
 * 获取预览图片列表
 */
const getPreviewList = () => {
  if (!currentTask.value?.screenshots) return [];
  return screenshotLabels
    .map(label => getImageUrl(currentTask.value?.screenshots?.[label]))
    .filter(Boolean) as string[];
};

/**
 * 获取任务列表
 */
const getList = async () => {
  try {
    const res = await listTasks({
      ...queryParams.value,
      ids: ids.value
    });
    
    const tasks = res.data.records;
    total.value = res.data.total;

    if (tasks.length > 0) {
      // 提取当前页所有 createBy 组成数组（去重）
      const userIds = [...new Set(tasks.map(t => t.createBy))];
      
    
      const userRes = await listPlayers({ userIds: userIds } as any);
      
      // 构建用户映射表
      const userMap = new Map<number, UserVO>();
      userRes.data.records.forEach((user: UserVO) => {
        userMap.set(user.userId, user);
      });

      // 合并用户信息到任务列表
      taskList.value = tasks.map(task => {
        const user = userMap.get(task.createBy);
        return {
          ...task,
          realName: user?.realName,
          phonenumber: user?.phonenumber
        };
      });
    } else {
      taskList.value = [];
    }
  } catch (error) {
    console.error('获取任务列表失败:', error);
  }
};

/**
 * 显示详情
 */
const handleDetail = (row: TaskWithUser) => {
  currentTask.value = row;
  detailVisible.value = true;
};
const handleClose = () => {
  const obj: RouteLocationNormalized = {
    path: '/withdrawal',
    fullPath: '',
    hash: '',
    matched: [],
    meta: undefined,
    name: undefined,
    params: undefined,
    query: undefined,
    redirectedFrom: undefined
  };
  proxy?.$tab.closeOpenPage(obj);
};
onMounted(() => {
    getList();
});
</script>

<style lang="scss" scoped>
.screenshot-card {
  height: 200px;
  
  :deep(.el-card__header) {
    padding: 10px 15px;
  }
  
  :deep(.el-card__body) {
    padding: 10px;
    height: calc(100% - 45px);
  }
}

.screenshot-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.screenshot-image {
  max-width: 100%;
  max-height: 120px;
}
</style>