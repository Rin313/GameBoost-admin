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
            <el-form-item label="创建时间" style="width: 308px">
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
            <el-button v-hasPermi="['system:config:add']" type="primary" plain icon="Plus" @click="handleAdd">
              新增
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              v-hasPermi="['system:config:remove']"
              type="danger"
              plain
              icon="Delete"
              :disabled="multiple"
              @click="handleDelete()"
            >
              删除
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:config:remove']" type="danger" plain icon="Refresh" @click="handleRefreshCache">
              刷新缓存
            </el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
        </el-row>
      </template>

      <el-table border :data="configList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="参数键名" align="center" prop="configKey" show-overflow-tooltip />
        <el-table-column label="参数键值" align="center" prop="configValue" show-overflow-tooltip />
        <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip />
        <el-table-column label="创建时间" align="center" prop="createTime" width="180">
          <template #default="{ row }">
            <span>{{ proxy?.parseTime(row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
          <template #default="{ row }">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['system:config:edit']" link type="primary" icon="Edit" @click="handleUpdate(row)" />
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['system:config:remove']" link type="primary" icon="Delete" @click="handleDelete(row)" />
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

    <!-- 添加或修改参数配置对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="600px" append-to-body>
      <el-form ref="configFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="参数键名" prop="configKey">
          <el-input v-model="form.configKey" placeholder="请输入参数键名" />
        </el-form-item>
        <el-form-item label="参数键值" prop="configValue">
          <div class="w-full">
            <el-input
              v-model="form.configValue"
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 15 }"
              placeholder="请输入JSON格式的参数键值"
              style="font-family: Consolas, Monaco, 'Courier New', monospace"
            />
            <div class="mt-2 flex items-center gap-2">
              <el-button size="small" @click="formatJson">格式化JSON</el-button>
              <span v-if="jsonError" class="text-red-500 text-xs">{{ jsonError }}</span>
            </div>
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
import { addConfig, delConfig, listConfig, refreshCache, updateConfig } from '@/api/system/config';
import type { ConfigForm, ConfigQuery, ConfigVO } from '@/api/system/config/types';
import type { FormRules } from 'element-plus';

defineOptions({ name: 'Config' });

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

// ===================== 常量定义 =====================
const DEFAULT_TIME_RANGE: [Date, Date] = [new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)];

const INIT_FORM_DATA: ConfigForm = {
  configId: undefined,
  configKey: '',
  configValue: '',
  remark: ''
};

// ===================== 响应式状态 =====================
const showSearch = ref(true);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const configList = ref<ConfigVO[]>([]);
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

// ===================== JSON 工具函数 =====================
/** 检测字符串是否为有效的 JSON 格式 */
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

/** 压缩 JSON 字符串（移除格式化空白） */
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
  } catch {
    jsonError.value = 'JSON格式错误，无法格式化';
    setTimeout(() => (jsonError.value = ''), 3000);
  }
};

// ===================== 表单验证规则 =====================
/** JSON 格式自定义验证器 */
const validateJsonFormat = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
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

const rules: FormRules<ConfigForm> = {
  configKey: [{ required: true, message: '参数键名不能为空', trigger: 'blur' }],
  configValue: [{ required: true, validator: validateJsonFormat, trigger: 'blur' }]
};

// ===================== 表单数据 =====================
const queryParams = reactive<ConfigQuery>({
  pageNum: 1,
  pageSize: 10,
  configKey: ''
});

const form = ref<ConfigForm>({ ...INIT_FORM_DATA });

// ===================== 数据查询方法 =====================
/** 查询参数列表 */
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

// ===================== 表格操作方法 =====================
/** 多选框选中数据处理 */
const handleSelectionChange = (selection: ConfigVO[]) => {
  ids.value = selection.map((item) => item.configId);
  single.value = selection.length !== 1;
  multiple.value = selection.length === 0;
};

// ===================== 表单操作方法 =====================
/** 重置表单 */
const resetForm = () => {
  form.value = { ...INIT_FORM_DATA };
  jsonError.value = '';
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
const handleUpdate = (row?: ConfigVO) => {
  resetForm();

  if (row) {
    Object.assign(form.value, row);
    // 自动格式化 JSON 便于编辑
    if (isValidJson(form.value.configValue || '')) {
      formatJson();
    }
  }

  dialog.visible = true;
  dialog.title = '修改参数';
};

/** 提交表单 */
const submitForm = async () => {
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
const handleDelete = async (row?: ConfigVO) => {
  const configIds = row?.configId || ids.value;
  await proxy?.$modal.confirm(`是否确认删除参数编号为"${configIds}"的数据项？`);
  await delConfig(configIds);
  proxy?.$modal.msgSuccess('删除成功');
  getList();
};

/** 刷新缓存按钮操作 */
const handleRefreshCache = async () => {
  await refreshCache();
  proxy?.$modal.msgSuccess('刷新缓存成功');
};

// ===================== 生命周期 =====================
onMounted(() => {
  getList();
});
</script>