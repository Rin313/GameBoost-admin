<template>
  <div class="p-2">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="参数键名" prop="configKey">
              <el-input
                v-model="queryParams.configKey"
                placeholder="请输入参数键名"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
            <el-form-item label="创建时间">
              <el-date-picker
                v-model="dateRange"
                value-format="YYYY-MM-DD HH:mm:ss"
                type="daterange"
                range-separator="-"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                :default-time="DEFAULT_TIME_RANGE"
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd">
              新增
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              type="danger"
              plain
              icon="Delete"
              :disabled="multiple"
              @click="handleDelete()"
            >
              删除
            </el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
        </el-row>
      </template>

      <el-table border :data="configList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="参数键名" align="center" prop="configKey" show-overflow-tooltip />
        <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip />
        <el-table-column label="参数键值" align="center" prop="configValue" show-overflow-tooltip />
        <el-table-column label="创建时间" align="center" prop="createTime">
          <template #default="{ row }">
            <span>{{ proxy?.parseTime(row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="{ row }">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(row)" />
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(row)" />
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
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="750px" append-to-body>
    <el-form ref="configFormRef" :model="form" :rules="rules" label-width="90px">
      <el-form-item label="参数键名" prop="configKey">
        <el-input v-model="form.configKey" placeholder="请输入参数键名" />
      </el-form-item>

      <el-form-item label="参数键值" prop="configValue">
        <div class="w-full">
          <!-- 视图模式切换 -->
          <div class="mb-3 flex items-center justify-between">
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button value="raw">
                <el-icon><EditPen /></el-icon> JSON编辑
              </el-radio-button>
              <el-radio-button value="arrayOfObjects" :disabled="!canUseMode('arrayOfObjects')">
                <el-icon><Grid /></el-icon> 列表对象
              </el-radio-button>
              <el-radio-button value="objectOfArrays" :disabled="!canUseMode('objectOfArrays')">
                <el-icon><Folder /></el-icon> 键值数组
              </el-radio-button>
            </el-radio-group>
          </div>

          <!-- 原始JSON编辑模式 -->
          <template v-if="viewMode === 'raw'">
            <el-input
              v-model="form.configValue"
              type="textarea"
              :autosize="{ minRows: 4, maxRows: 15 }"
              placeholder="请输入JSON格式的参数键值"
              @blur="onRawJsonBlur"
            />
            <div class="mt-2 flex items-center gap-2">
              <span v-if="jsonError" class="text-red-500 text-xs">{{ jsonError }}</span>
            </div>
          </template>

          <!-- 数组对象模式 [{ }, { }] -->
          <template v-else-if="viewMode === 'arrayOfObjects'">
            <ArrayOfObjectsEditor v-model="arrayOfObjectsData" />
          </template>

          <!-- 对象数组模式 { key: [] } -->
          <template v-else-if="viewMode === 'objectOfArrays'">
            <ObjectOfArraysEditor v-model="objectOfArraysData" />
          </template>
        </div>
      </el-form-item>

      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </template>
  </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { addConfig, delConfig, listConfig,updateConfig } from '@/api/system/config';
import ArrayOfObjectsEditor from './ArrayOfObjectsEditor.vue';
import ObjectOfArraysEditor from './ObjectOfArraysEditor.vue';
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const DEFAULT_TIME_RANGE: [Date, Date] = [new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)];

const INIT_FORM_DATA = {
  configId: undefined,
  configKey: '',
  configValue: '',
  remark: ''
};

const showSearch = ref(true);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const configList = ref([]);
const ids = ref<Array<number | string>>([]);
const dateRange = ref<[DateModelType, DateModelType]>(['', '']);
const jsonError = ref('');

// 表单引用
const queryFormRef = ref<ElFormInstance>();
const configFormRef = ref<ElFormInstance>();

// 对话框状态
const dialog = reactive({
  visible: false,
  title: ''
});

const isValidJson = (str: string): boolean => {
  if (!str?.trim()) return false;
  const trimmed = str.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return false;

  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
};

const compressJson = (jsonStr: string): string => {
  try {
    return JSON.stringify(JSON.parse(jsonStr));
  } catch {
    return jsonStr;
  }
};

/** 格式化 JSON 字符串 */
const formatJson = () => {
  const value = form.value.configValue;
  if (!value) return;
  try {
    form.value.configValue = JSON.stringify(JSON.parse(value), null, 2);
    jsonError.value = '';
    // 重新检测类型
    detectedMode.value = detectJsonType(form.value.configValue);
  } catch {
    jsonError.value = 'JSON格式错误，无法格式化';
    setTimeout(() => (jsonError.value = ''), 3000);
  }
};

const validateJsonFormat = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  // 如果是可视化模式，先同步数据
  if (viewMode.value !== 'raw') {
    syncVisualToJson();
    value = form.value.configValue;
  }

  if (!value?.trim()) {
    return callback(new Error('参数键值不能为空'));
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return callback(new Error('参数键值必须为JSON格式'));
  }

  try {
    JSON.parse(trimmed);
    callback();
  } catch {
    callback(new Error('JSON格式不正确，请检查语法'));
  }
};

const rules: ElFormRules = {
  configKey: [{ required: true, message: '参数键名不能为空', trigger: 'blur' }],
  configValue: [{ required: true, validator: validateJsonFormat, trigger: 'blur' }]
};

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  configKey: ''
});

const form = ref({ ...INIT_FORM_DATA });
const getList = async () => {
  try {
    const res = await listConfig(proxy?.addDateRange(queryParams, dateRange.value));
    configList.value = res.data.records;
    total.value = res.data.total;
  } finally {
  }
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  dateRange.value = ['', ''];
  queryFormRef.value?.resetFields();
  handleQuery();
};
/** 多选框选中数据处理 */
const handleSelectionChange = (selection) => {
  ids.value = selection.map((item) => item.configId);
  single.value = selection.length !== 1;
  multiple.value = selection.length === 0;
};

/** 重置表单 */
const resetForm = () => {
  form.value = { ...INIT_FORM_DATA };
  jsonError.value = '';
  viewMode.value = 'raw';
  detectedMode.value = 'raw';
  arrayOfObjectsData.value = [];
  objectOfArraysData.value = {};
  configFormRef.value?.resetFields();
};

/** 取消按钮 */
const cancel = () => {
  dialog.visible = false;
  resetForm();
};
/** 新增按钮操作 */
const handleAdd = () => {
  resetForm();
  dialog.visible = true;
  dialog.title = '添加参数';
};

/** 修改按钮操作 */
const handleUpdate = (row?: typeof INIT_FORM_DATA) => {
  resetForm();

  if (row) {
    Object.assign(form.value, row);
    if (isValidJson(form.value.configValue || '')) {
      formatJson();
      // 自动检测并切换到合适的视图模式
      const detected = detectJsonType(form.value.configValue);
      detectedMode.value = detected;
      if (detected !== 'raw') {
        viewMode.value = detected;
        parseToVisualData(form.value.configValue, detected);
      }
    }
  }

  dialog.visible = true;
  dialog.title = '修改参数';
};
/** 提交表单 */
const submitForm = async () => {
    // 确保可视化数据同步到JSON
  if (viewMode.value !== 'raw') {
    syncVisualToJson();
  }
  const valid = await configFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  // 提交前压缩 JSON
  if (form.value.configValue) {
    form.value.configValue = compressJson(form.value.configValue);
  }

  if (form.value.configId) {
    await updateConfig(form.value);
  } else {
    await addConfig(form.value);
  }

  proxy?.$modal.msgSuccess('操作成功');
  dialog.visible = false;
  getList();
};

/** 删除按钮操作 */
const handleDelete = async (row?) => {
  const configIds = row?.configId || ids.value;
  await proxy?.$modal.confirm(`是否确认删除参数编号为"${configIds}"的数据项？`);
  await delConfig(configIds);
  proxy?.$modal.msgSuccess('删除成功');
  getList();
};

type ViewMode = 'raw' | 'arrayOfObjects' | 'objectOfArrays';

const modeLabels: Record<ViewMode, string> = {
  raw: 'JSON',
  arrayOfObjects: '列表对象',
  objectOfArrays: '键值数组'
};
const viewMode = ref<ViewMode>('raw');
const detectedMode = ref<ViewMode>('raw');
// 两种可视化模式的数据
const arrayOfObjectsData = ref<Record<string, string>[]>([]);
const objectOfArraysData = ref<Record<string, string[]>>({});
const detectJsonType = (jsonStr: string): ViewMode => {
  if (!jsonStr?.trim()) return 'raw';

  try {
    const data = JSON.parse(jsonStr.trim());

    // 检查是否是数组，且每个元素都是对象（非数组）
    if (
      Array.isArray(data) &&
      data.length > 0 &&
      data.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))
    ) {
      return 'arrayOfObjects';
    }

    // 检查是否是对象，且每个值都是数组
    if (
      typeof data === 'object' &&
      data !== null &&
      !Array.isArray(data) &&
      Object.keys(data).length > 0 &&
      Object.values(data).every(val => Array.isArray(val))
    ) {
      return 'objectOfArrays';
    }

    return 'raw';
  } catch {
    return 'raw';
  }
};
const canUseMode = (mode: ViewMode): boolean => {
  if (mode === 'raw') return true;

  const value = form.value.configValue;
  if (!value?.trim()) return true; // 空值可以使用任何模式

  const detected = detectJsonType(value);
  return detected === mode || detected === 'raw';
};

// 从JSON字符串解析到可视化数据
const parseToVisualData = (jsonStr: string, mode: ViewMode) => {
  try {
    const data = JSON.parse(jsonStr.trim());

    if (mode === 'arrayOfObjects' && Array.isArray(data)) {
      arrayOfObjectsData.value = data;
    } else if (mode === 'objectOfArrays' && typeof data === 'object' && !Array.isArray(data)) {
      objectOfArraysData.value = data;
    }
  } catch {
    // 解析失败，初始化空数据
    if (mode === 'arrayOfObjects') {
      arrayOfObjectsData.value = [];
    } else if (mode === 'objectOfArrays') {
      objectOfArraysData.value = {};
    }
  }
};

// 从可视化数据同步到JSON字符串
const syncVisualToJson = () => {
  try {
    if (viewMode.value === 'arrayOfObjects') {
      form.value.configValue = JSON.stringify(arrayOfObjectsData.value, null, 2);
    } else if (viewMode.value === 'objectOfArrays') {
      form.value.configValue = JSON.stringify(objectOfArraysData.value, null, 2);
    }
  } catch (e) {
    console.error('同步数据失败', e);
  }
};

// 监听视图模式切换
watch(viewMode, (newMode, oldMode) => {
  if (oldMode !== 'raw' && newMode === 'raw') {
    // 从可视化切换到raw，同步数据
    syncVisualToJson();
  } else if (newMode !== 'raw') {
    // 切换到可视化模式，解析数据
    parseToVisualData(form.value.configValue, newMode);
  }
});
watch(
  [arrayOfObjectsData, objectOfArraysData],
  () => {
    if (viewMode.value !== 'raw') {
      syncVisualToJson();
    }
  },
  { deep: true }
);
// 原始JSON输入框失焦时检测类型
const onRawJsonBlur = () => {
  detectedMode.value = detectJsonType(form.value.configValue);
};


onMounted(() => {
  getList();
});
</script>