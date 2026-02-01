```bash
# 安装依赖
npm install --registry=https://registry.npmmirror.com

# 启动服务
npm run dev

# 构建生产环境
npm run build
```

TODO
vue-cropper


我正在开发一个使用vue3的管理端项目，我需要设计一个页面分配方案：
1. 对于不同角色（role）、不同权限（permission）的用户，显示的页面列表是不相同的
2. 我需要考虑是否添加两个directive`hasPermis`、`hasRoles`来更好地定制页面
3. 对于一个功能定位相同，但需要针对不同角色/权限进行额外处理的页面，逻辑一旦堆积太多，复杂度上升，维护起来会非常困难；
如果拆分出多个独立页面，会出现页面同名的问题，在分配时容易混淆，另外同步修改时也更麻烦。
不需要给出代码实现，请分析说明怎么设计页面分配方案比较好。

```
<el-dialog v-model="dialog.visible" :title="dialog.title" width="600px" append-to-body>
<el-form ref="configFormRef" :model="form" :rules="rules" label-width="90px">
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
/>
<div class="mt-2 flex items-center gap-2">
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
<script setup lang="ts">
const INIT_FORM_DATA = {
  configId: undefined,
  configKey: '',
  configValue: '',
  remark: ''
};
const jsonError = ref('');
const configFormRef = ref<ElFormInstance>();
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
const rules: ElFormRules = {
  configKey: [{ required: true, message: '参数键名不能为空', trigger: 'blur' }],
  configValue: [{ required: true, validator: validateJsonFormat, trigger: 'blur' }]
};
const form = ref({ ...INIT_FORM_DATA });
/** 重置表单 */
const resetForm = () => {
  form.value = { ...INIT_FORM_DATA };
  jsonError.value = '';
  configFormRef.value?.resetFields();
};

/** 新增按钮操作 */
const handleAdd = () => {
  resetForm();
  dialog.visible = true;
  dialog.title = '添加参数';
};

/** 修改按钮操作 */
const handleUpdate = (row?) => {
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
</script>
```