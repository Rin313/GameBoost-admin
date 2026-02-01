<template>
  <div class="object-of-arrays-editor">
    <!-- 键列表 -->
    <div v-for="(items, key) in localData" :key="key" class="key-group">
      <div class="key-header">
        <div class="flex items-center gap-2">
          <el-icon class="cursor-move"><Rank /></el-icon>
          <el-input
            v-model="keyNames[key]"
            size="small"
            class="key-input"
            @blur="renameKey(key, keyNames[key])"
            @keyup.enter="renameKey(key, keyNames[key])"
          />
          <el-tag size="small" type="info">{{ items.length }} 项</el-tag>
        </div>
        <el-button type="danger" size="small" link @click="removeKey(key)">
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>

      <!-- 数组项 -->
      <div class="array-items">
        <div v-for="(item, index) in items" :key="index" class="array-item">
          <el-input v-model="items[index]" size="small" @change="emitUpdate" />
          <el-button type="danger" size="small" link @click="removeItem(key, index)">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
        <el-button size="small" text type="primary" @click="addItem(key)">
          <el-icon><Plus /></el-icon> 添加项
        </el-button>
      </div>
    </div>

    <!-- 添加新键 -->
    <div class="add-key-section">
      <el-popover :visible="showAddKey" placement="bottom" :width="250">
        <template #reference>
          <el-button type="primary" @click="showAddKey = true">
            <el-icon><Plus /></el-icon> 添加分组
          </el-button>
        </template>
        <div class="flex gap-2">
          <el-input v-model="newKeyName" placeholder="分组名称" @keyup.enter="addKey" />
          <el-button type="primary" @click="addKey">确定</el-button>
        </div>
      </el-popover>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, reactive } from 'vue';
import { Plus, Delete, Close, Rank } from '@element-plus/icons-vue';

interface Props {
  modelValue: Record<string, string[]>;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string[]>];
}>();

const localData = ref<Record<string, string[]>>({});
const keyNames = reactive<Record<string, string>>({});
const showAddKey = ref(false);
const newKeyName = ref('');

watch(
  () => props.modelValue,
  (val) => {
    if (JSON.stringify(val) !== JSON.stringify(localData.value)) {
      localData.value = JSON.parse(JSON.stringify(val || {}));
      // 初始化键名映射
      Object.keys(localData.value).forEach(key => {
        keyNames[key] = key;
      });
    }
  },
  { immediate: true, deep: true }
);

const emitUpdate = () => {
  emit('update:modelValue', JSON.parse(JSON.stringify(localData.value)));
};

const addKey = () => {
  if (!newKeyName.value.trim()) return;
  const key = newKeyName.value.trim();
  if (key in localData.value) {
    ElMessage.warning('该分组已存在');
    return;
  }
  localData.value[key] = [];
  keyNames[key] = key;
  newKeyName.value = '';
  showAddKey.value = false;
  emitUpdate();
};

const renameKey = (oldKey: string, newKey: string) => {
  if (!newKey.trim() || oldKey === newKey) {
    keyNames[oldKey] = oldKey;
    return;
  }
  if (newKey in localData.value) {
    keyNames[oldKey] = oldKey;
    ElMessage.warning('该分组名已存在');
    return;
  }
  const newData: Record<string, string[]> = {};
  Object.keys(localData.value).forEach(key => {
    if (key === oldKey) {
      newData[newKey] = localData.value[key];
      keyNames[newKey] = newKey;
      delete keyNames[oldKey];
    } else {
      newData[key] = localData.value[key];
    }
  });
  localData.value = newData;
  emitUpdate();
};

const removeKey = (key: string) => {
  delete localData.value[key];
  delete keyNames[key];
  emitUpdate();
};

const addItem = (key: string) => {
  localData.value[key].push('');
  emitUpdate();
};

const removeItem = (key: string, index: number) => {
  localData.value[key].splice(index, 1);
  emitUpdate();
};
</script>

<style scoped>
.object-of-arrays-editor {
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  padding: 12px;
  background: var(--el-fill-color-blank);
  max-height: 400px;
  overflow-y: auto;
}

.key-group {
  margin-bottom: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  overflow: hidden;
}

.key-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.key-input {
  width: 150px;
}

.array-items {
  padding: 12px;
}

.array-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.array-item .el-input {
  flex: 1;
}

.add-key-section {
  margin-top: 12px;
}
</style>