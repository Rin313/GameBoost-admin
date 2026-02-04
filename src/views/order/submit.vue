<template>
  <div class="p-2">
    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" icon="Plus" @click="handleSubmit">提交</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain :disabled="canWithdrawal" @click="handleWithdrawal()">
              申请打款
            </el-button>
          </el-col>
          <right-toolbar @query-table="getList"></right-toolbar>
        </el-row>
      </template>
      <el-table border :data="taskList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="派单编号" align="center" prop="id" />
        <el-table-column label="订单编号" align="center" prop="orderNo" />
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
        <el-descriptions-item label="订单编号">{{ currentTask?.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentTask?.createTime }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentTask?.status)">
            {{ getStatusLabel(currentTask?.status) }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <el-divider content-position="left">截图信息</el-divider>
      <el-row :gutter="20">
        <el-col v-for="(label, index) in screenshotLabels" :key="index" :span="8" class="mb-4">
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
    </el-dialog>
    <el-dialog v-model="submitDialogVisible" title="提交任务" width="700px" destroy-on-close>
      <el-form ref="submitFormRef" :model="submitForm" :rules="submitRules" label-width="120px">
        <el-form-item label="订单编号" prop="orderNo">
          <el-input v-model="submitForm.orderNo" placeholder="请输入订单编号" clearable />
        </el-form-item>
        <el-form-item label="接单日期" prop="orderDate">
        <el-date-picker
          v-model="submitForm.orderDate"
          type="datetime"
          placeholder="请选择日期"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
        />
      </el-form-item>
        <el-form-item label="到手金额" prop="orderAmount">
            <el-input-number 
            v-model="submitForm.orderAmount" 
            :min="0"
            :precision="2"
            :step="1.00"
            placeholder="请输入到手金额" 
            style="width: 100%"
            />
        </el-form-item>
        <el-divider content-position="center">上传截图</el-divider>

        <el-row :gutter="16">
          <el-col v-for="(label, index) in screenshotLabels" :key="index" :span="8" class="mb-4">
            <el-form-item :label="label" :prop="`screenshots.${index}`" label-width="auto">
              <el-upload
                class="screenshot-uploader"
                :auto-upload="false"
                :show-file-list="false"
                :on-change="(file: any) => handleUploadChange(file, index)"
                accept="image/*"
              >
                <template v-if="previewUrls[index]">
                  <el-image :src="previewUrls[index]" class="screenshot-preview" fit="cover" />
                  <div class="screenshot-actions">
                    <el-icon @click.stop="handleRemoveScreenshot(index)"><Delete /></el-icon>
                  </div>
                </template>
                <template v-else>
                  <div class="screenshot-placeholder">
                    <el-icon class="upload-icon"><Plus /></el-icon>
                    <span class="upload-text">上传图片</span>
                  </div>
                </template>
              </el-upload>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="submitDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="confirmSubmit">
          确认提交
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { listTasksSelf, submit,withdrawal } from '@/api/order';
import { ElMessage } from 'element-plus';
import { Plus, Delete } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import { getImageUrl } from '@/utils/img';

const { proxy } = getCurrentInstance() as any;
const { task_type } = toRefs<any>(proxy?.useDict('task_type'));
const ids = ref<Array<number | string>>([]);
const selected =ref([]);
const single = ref(true);
const multiple = ref(true);
const taskList = ref<any[]>([]);
const total = ref(0);

const queryParams = ref({
  pageNum: 1,
  pageSize: 10
});
const canWithdrawal=computed(()=>{
    return selected.value.length===0 || selected.value.some(item=>item.status!=='3');
})
const detailVisible = ref(false);
const currentTask = ref<any>(null);
const screenshotLabels = ['账号资产-前', '账号资产-后', '仓库对比-前', '仓库对比-后', '老板结单图'] as const;

// ========== 提交表单相关 ==========
const submitDialogVisible = ref(false);
const submitLoading = ref(false);
const submitFormRef = ref<FormInstance>();
const submitForm = ref({
  orderNo: '',
  orderAmount: undefined,
  orderDate: undefined,
  screenshots: Array(screenshotLabels.length).fill(null)
});

const previewUrls = ref<string[]>([]);

const submitRules: FormRules = {
  orderNo: [
    { required: true, message: '请输入订单编号', trigger: 'blur' }
  ],
  orderDate: [{ required: true, message: '接单日期不能为空', trigger: 'change' }],
  orderAmount: [
        { 
            required: true, 
            message: '到手金额不能为空', 
            trigger: 'blur' 
        },
    ],
};

// ========== 状态处理 ==========
const statusMap = computed(() => {
  const map: Record<string, { label: string; style: string }> = {};
  task_type.value?.forEach((item: any) => {
    map[item.value] = {
      label: item.label,
      style: item.elTagType
    };
  });
  return map;
});
const handleSelectionChange = (selection) => {
    selected.value=selection;
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};
const getStatusLabel = (status?: string): string => {
  if (status === undefined || status === null) return '';
  return statusMap.value[status]?.label || status;
};

const getStatusType = (status?: string): string => {
  if (status === undefined || status === null) return 'info';
  return statusMap.value[status]?.style || 'info';
};

const getPreviewList = () => {
  if (!currentTask.value?.screenshots) return [];
  return screenshotLabels
    .map(label => getImageUrl(currentTask.value?.screenshots?.[label]))
    .filter(Boolean) as string[];
};

// ========== 列表操作 ==========
const getList = async () => {
  try {
    const res = await listTasksSelf({
      ...queryParams.value
    });
    taskList.value = res.data.records;
    total.value = res.data.total;
  } catch (error) {
    console.error(error);
  }
};

const handleDetail = (row: any) => {
  currentTask.value = row;
  detailVisible.value = true;
};

// ========== 提交表单操作 ==========
const handleSubmit = () => {
  // 重置表单
  submitForm.value = {
    orderNo: '',
    orderAmount: undefined,
    orderDate: undefined,
    screenshots: Array(screenshotLabels.length).fill(null)
  };
  // 清理之前的预览URL
  previewUrls.value.forEach(url => {
    if (url) URL.revokeObjectURL(url);
  });
  previewUrls.value = [];
  submitDialogVisible.value = true;
};

const handleUploadChange = (file: any, index: number) => {
  const rawFile = file.raw;
  
  // 验证文件类型
  if (!rawFile.type.startsWith('image/')) {
    ElMessage.error('只能上传图片文件');
    return;
  }
  
  // 验证文件大小（限制5MB）
  if (rawFile.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过5MB');
    return;
  }
  
  submitForm.value.screenshots[index] = rawFile;
  
  // 清理旧的预览URL
  if (previewUrls.value[index]) {
    URL.revokeObjectURL(previewUrls.value[index]);
  }
  // 创建新的预览URL
  previewUrls.value[index] = URL.createObjectURL(rawFile);
};

const handleRemoveScreenshot = (index: number) => {
  submitForm.value.screenshots[index] = null;
  if (previewUrls.value[index]) {
    URL.revokeObjectURL(previewUrls.value[index]);
    previewUrls.value[index] = '';
  }
};

const confirmSubmit = async () => {
  if (!submitFormRef.value) return;
  
  await submitFormRef.value.validate();
  
  // 检查所有截图是否都已上传
  const missingIndex = submitForm.value.screenshots.findIndex(s => !s);
  if (missingIndex !== -1) {
    ElMessage.error(`请上传「${screenshotLabels[missingIndex]}」截图`);
    return;
  }
  
  // 构建 FormData
  const formData = new FormData();
  formData.append('orderNo', submitForm.value.orderNo);
  formData.append('orderAmount', submitForm.value.orderAmount);
  formData.append('orderDate', submitForm.value.orderDate);
  
  // 添加所有截图文件
  submitForm.value.screenshots.forEach((file) => {
    if (file) {
      formData.append('screenshoots', file);
    }
  });
  
  try {
    submitLoading.value = true;
    await submit(formData);
    ElMessage.success('提交成功');
    submitDialogVisible.value = false;
    getList();
  } catch (error) {
    console.error(error);
  } finally {
    submitLoading.value = false;
  }
};
const handleWithdrawal = async (row?) => {
  const taskIds = row?.userId || ids.value;
  try{
    await proxy?.$modal.confirm('是否确认申请打款？');
    await withdrawal(taskIds);
    await getList();
    proxy?.$modal.msgSuccess('申请成功');
  }
  catch(err){}
};
onMounted(() => {
  getList();
});
</script>

<style scoped lang="scss">
.screenshot-uploader {
  :deep(.el-upload) {
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--el-transition-duration-fast);
    width: 120px;
    height: 120px;

    &:hover {
      border-color: var(--el-color-primary);
    }
  }
}

.screenshot-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  color: #8c939d;

  .upload-icon {
    font-size: 28px;
    margin-bottom: 8px;
  }

  .upload-text {
    font-size: 12px;
  }
}

.screenshot-preview {
  width: 120px;
  height: 120px;
  display: block;
}

.screenshot-actions {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.3s;

  .el-icon {
    color: #fff;
    font-size: 20px;
    cursor: pointer;

    &:hover {
      color: var(--el-color-danger);
    }
  }

  &:hover {
    opacity: 1;
  }
}

.screenshot-uploader:hover .screenshot-actions {
  opacity: 1;
}
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