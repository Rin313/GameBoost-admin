<template>
  <div class="p-2">
<div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="标题" prop="title">
              <el-input v-model="queryParams.title" placeholder="请输入标题" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="内容" prop="content">
              <el-input v-model="queryParams.content" placeholder="请输入内容" clearable @keyup.enter="handleQuery" />
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
            <el-button v-hasPermi="['system:notice:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:notice:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">
              删除
            </el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
        </el-row>
      </template>

      <el-table border :data="noticeList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="false" label="序号" align="center" prop="noticeId" width="100" />
        <el-table-column label="标题" align="center" prop="title" :show-overflow-tooltip="true" />
        <el-table-column label="状态" align="center" prop="status" width="100">
          <template #default="scope">
            <dict-tag :options="status_enabled" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="100">
          <template #default="scope">
            <span>{{ proxy?.parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['system:notice:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)" />
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['system:notice:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)" />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 添加或修改公告对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="780px" append-to-body>
      <el-form ref="noticeFormRef" :model="form" :rules="rules" label-width="80px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="标题" prop="title">
              <el-input v-model="form.title" placeholder="请输入标题" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio v-for="dict in status_enabled" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="内容">
              <el-input v-model="form.content" type="textarea" :rows="8" placeholder="请输入内容" />
            </el-form-item>
          </el-col>
        </el-row>
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
import { addNotice, delNotice, listNotice, updateNotice } from '@/api/system/notice';
import type { NoticeForm, NoticeQuery, NoticeVO } from '@/api/system/notice/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { status_enabled } = toRefs<any>(proxy?.useDict('status_enabled'));
const noticeList = ref<NoticeVO[]>([]);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const noticeFormRef = ref<ElFormInstance>();

const dialog = reactive({
  visible: false,
  title: ''
});

const initFormData: NoticeForm = {
  noticeId: undefined,
  title: '',
  content: '',
  status: '0'
};

const data = reactive<PageData<NoticeForm, NoticeQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    title: '',
    content: '',
    noticeType: '2',
    status: ''
  },
  rules: {
    title: [{ required: true, message: '标题不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

const getList = async () => {
  const res = await listNotice(queryParams.value);
  noticeList.value = res.data.records;
  total.value = res.data.total;
};

const cancel = () => {
  reset();
  dialog.visible = false;
};

const reset = () => {
  form.value = { ...initFormData };
  noticeFormRef.value?.resetFields();
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

const handleSelectionChange = (selection: NoticeVO[]) => {
  ids.value = selection.map((item) => item.noticeId);
  single.value = selection.length !== 1;
  multiple.value = !selection.length;
};

const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加公告';
};

const handleUpdate = (row?: NoticeVO) => {
  reset();
  Object.assign(form.value, row);
  dialog.visible = true;
  dialog.title = '修改公告';
};

const submitForm = () => {
  noticeFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      form.value.noticeId ? await updateNotice(form.value) : await addNotice(form.value);
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

const handleDelete = async (row?: NoticeVO) => {
  const noticeIds = row?.noticeId || ids.value;
  await proxy?.$modal.confirm('是否确认删除公告编号为"' + noticeIds + '"的数据项？');
  await delNotice(noticeIds);
  await getList();
  proxy?.$modal.msgSuccess('删除成功');
};

onMounted(() => {
  getList();
});
</script>