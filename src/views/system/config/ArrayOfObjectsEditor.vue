<template>
  <div class="array-of-objects-editor">
    <!-- 字段管理 -->
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <span class="text-sm text-gray-500">字段：</span>
      <el-tag
        v-for="field in fields"
        :key="field"
        closable
        @close="removeField(field)"
      >
        {{ field }}
      </el-tag>
      <el-popover :visible="showAddField" placement="bottom" :width="200">
        <template #reference>
          <el-button size="small" type="primary" link @click="showAddField = true">
            <el-icon><Plus /></el-icon> 添加字段
          </el-button>
        </template>
        <div class="flex gap-2">
          <el-input v-model="newFieldName" size="small" placeholder="字段名" @keyup.enter="addField" />
          <el-button size="small" type="primary" @click="addField">确定</el-button>
        </div>
      </el-popover>
    </div>

    <!-- 数据表格 -->
    <el-table :data="localData" border size="small" max-height="300">
      <el-table-column type="index" label="#" width="50" align="center" />
      <el-table-column
        v-for="field in fields"
        :key="field"
        :label="field"
        min-width="120"
      >
        <template #default="{ row }">
          <el-input v-model="row[field]" size="small" @change="emitUpdate" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80" align="center" fixed="right">
        <template #default="{ $index }">
          <el-button type="danger" size="small" link @click="removeRow($index)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加行 -->
    <div class="mt-2">
      <el-button size="small" type="primary" @click="addRow">
        <el-icon><Plus /></el-icon> 添加一行
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { Plus, Delete } from '@element-plus/icons-vue';

interface Props {
  modelValue: Record<string, string>[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string>[]];
}>();

const localData = ref<Record<string, string>[]>([]);
const showAddField = ref(false);
const newFieldName = ref('');

// 提取所有字段
const fields = computed(() => {
  const fieldSet = new Set<string>();
  localData.value.forEach(item => {
    Object.keys(item).forEach(key => fieldSet.add(key));
  });
  return Array.from(fieldSet);
});

// 初始化数据
watch(
  () => props.modelValue,
  (val) => {
    if (JSON.stringify(val) !== JSON.stringify(localData.value)) {
      localData.value = JSON.parse(JSON.stringify(val || []));
    }
  },
  { immediate: true, deep: true }
);

const emitUpdate = () => {
  emit('update:modelValue', JSON.parse(JSON.stringify(localData.value)));
};

const addField = () => {
  if (!newFieldName.value.trim()) return;
  const fieldName = newFieldName.value.trim();
  localData.value.forEach(item => {
    if (!(fieldName in item)) {
      item[fieldName] = '';
    }
  });
  newFieldName.value = '';
  showAddField.value = false;
  emitUpdate();
};

const removeField = (field: string) => {
  localData.value.forEach(item => {
    delete item[field];
  });
  emitUpdate();
};

const addRow = () => {
  const newRow: Record<string, string> = {};
  fields.value.forEach(field => {
    newRow[field] = '';
  });
  // 如果没有字段，添加默认字段
  if (fields.value.length === 0) {
    newRow['label'] = '';
    newRow['value'] = '';
  }
  localData.value.push(newRow);
  emitUpdate();
};

const removeRow = (index: number) => {
  localData.value.splice(index, 1);
  emitUpdate();
};
</script>

<style scoped>
.array-of-objects-editor {
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  padding: 12px;
  background: var(--el-fill-color-blank);
}
</style>