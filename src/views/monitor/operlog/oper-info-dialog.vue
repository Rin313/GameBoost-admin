<template>
  <el-dialog v-model="open" title="操作日志详细" width="700px" append-to-body close-on-click-modal @closed="info = null">
    <el-descriptions v-if="info" :column="1" border>
      <el-descriptions-item label="操作状态">
        <template #default>
          <el-tag v-if="info.status === 0" type="success">正常</el-tag>
          <el-tag v-else-if="info.status === 1" type="danger">失败</el-tag>
        </template>
      </el-descriptions-item>
      <el-descriptions-item label="登录信息">
        <template #default> {{ info.operName }} / {{ info.operIp }} / {{ info.operLocation }} </template>
      </el-descriptions-item>
      <el-descriptions-item label="请求信息">
        <template #default> {{ info.operUrl }} </template>
      </el-descriptions-item>
      <el-descriptions-item label="操作模块">
        <template #default> {{ info.title }} / {{ typeFormat(info) }} </template>
      </el-descriptions-item>
<el-descriptions-item label="请求参数">
  <template #default>
    <div class="max-h-300px overflow-y-auto">
      <!-- 替换为 pre 标签 -->
      <pre class="json-display">{{ formatToJsonString(info.operParam) }}</pre>
    </div>
  </template>
</el-descriptions-item>
<el-descriptions-item label="返回参数">
  <template #default>
    <div class="max-h-300px overflow-y-auto">
      <!-- 替换为 pre 标签 -->
      <pre class="json-display">{{ formatToJsonString(info.jsonResult) }}</pre>
    </div>
  </template>
</el-descriptions-item>
      <el-descriptions-item label="操作时间">
        <template #default> {{ proxy.parseTime(info.operTime) }}</template>
      </el-descriptions-item>
      <el-descriptions-item v-if="info.status === 1" label="异常信息">
        <template #default>
          <span class="text-danger"> {{ info.errorMsg }}</span>
        </template>
      </el-descriptions-item>
    </el-descriptions>
  </el-dialog>
</template>

<script setup lang="ts">
import type { OperLogForm } from '@/api/monitor/operlog/types';
const open = ref(false);
const info = ref<OperLogForm | null>(null);
function openDialog(row: OperLogForm) {
  info.value = row;
  open.value = true;
}

function closeDialog() {
  open.value = false;
}

defineExpose({
  openDialog,
  closeDialog
});

const formattedOperParam = computed(() => formatToJsonString(info.value?.operParam || ''));
const formattedJsonResult = computed(() => formatToJsonString(info.value?.jsonResult || ''));

function formatToJsonString(data: string) {
  try {
    return JSON.stringify(JSON.parse(data), null, 2);
  } catch (e) {
    return data;
  }
}
/**
 * 字典信息
 */
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { oper_type } = toRefs<any>(proxy?.useDict('oper_type'));
const typeFormat = (row: OperLogForm) => {
  return proxy?.selectDictLabel(oper_type.value, row.businessType);
};
</script>

<style lang="scss" scoped>
/**
label宽度固定
*/
:deep(.el-descriptions__label) {
  min-width: 100px;
}
.json-display {
  margin: 0;
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace; /* 等宽字体 */
  white-space: pre-wrap; /* 允许换行，防止过长溢出 */
  word-break: break-all;
  font-size: 12px;
  color: #606266;
}
</style>