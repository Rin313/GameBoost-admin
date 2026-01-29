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
          <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
        </el-row>
      </template>
      <el-table border :data="mainNoticeList">
        <el-table-column v-if="false" label="序号" align="center" prop="noticeId" width="100" />
        <el-table-column label="标题" align="center" prop="title" :show-overflow-tooltip="true" />
        <el-table-column label="状态" align="center" prop="status" width="100">
          <template #default="scope">
            <dict-tag :options="status_handle" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="100">
          <template #default="scope">
            <span>{{ proxy?.parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="详情" placement="top">
              <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" />
            </el-tooltip>
            <el-tooltip content="处理" placement="top">
              <el-button v-hasPermi="['system:notice:handle']" link type="primary" icon="ChatLineRound" @click="handleProcess(scope.row)" />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailDialog.visible" :title="detailDialog.title" width="780px" append-to-body>
      <el-descriptions title="反馈信息" :column="1" border>
        <el-descriptions-item label="标题">{{ currentNotice?.title }}</el-descriptions-item>
        <el-descriptions-item label="内容">{{ currentNotice?.content }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentNotice?.createTime }}</el-descriptions-item>
      </el-descriptions>

      <template v-if="relatedReplies.length > 0">
        <el-divider content-position="left">回复记录</el-divider>
        <el-descriptions
          v-for="(reply, index) in relatedReplies"
          :key="reply.noticeId"
          :title="'回复 ' + (index + 1)"
          :column="1"
          border
          class="mb-4"
        >
          <el-descriptions-item label="标题">{{ reply.title }}</el-descriptions-item>
          <el-descriptions-item label="内容">{{ reply.content }}</el-descriptions-item>
          <el-descriptions-item label="回复时间">{{ reply.createTime }}</el-descriptions-item>
        </el-descriptions>
      </template>
      <template v-else>
        <el-divider content-position="left">回复记录</el-divider>
        <el-empty description="暂无回复" :image-size="80" />
      </template>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailDialog.visible = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 处理反馈对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="780px" append-to-body>
      <el-form ref="handleFormRef" :model="form" :rules="rules" label-width="80px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="标题" prop="title">
              <el-input v-model="form.title" placeholder="请输入回复标题" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="回复内容" prop="content">
              <el-input v-model="form.content" type="textarea" :rows="8" placeholder="请输入回复内容" />
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
import { listNotice, handleNotice } from '@/api/system/notice';
import type { NoticeQuery, NoticeVO } from '@/api/system/notice/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { status_handle } = toRefs<any>(proxy?.useDict('status_handle'));
const noticeList = ref<NoticeVO[]>([]);
const showSearch = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const handleFormRef = ref<ElFormInstance>();

const dialog = reactive({
  visible: false,
  title: ''
});

const detailDialog = reactive({
  visible: false,
  title: ''
});

const currentNotice = ref<NoticeVO | null>(null);
const relatedReplies = ref<NoticeVO[]>([]);

/** 计算属性：过滤出主反馈列表（conversationId 为 null 的记录） */
const mainNoticeList = computed(() => {
  return noticeList.value.filter(item => !item.conversationId);
});

// 处理表单类型
interface HandleForm {
  noticeId?: string | number;
  title: string;
  content: string;
}

const initFormData: HandleForm = {
  noticeId: undefined,
  title: '',
  content: ''
};

const data = reactive<PageData<HandleForm, NoticeQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    title: '',
    content: '',
    noticeType: '3',
    status: ''
  },
  rules: {
    title: [{ required: true, message: '标题不能为空', trigger: 'blur' }],
    content: [{ required: true, message: '回复内容不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询列表 */
const getList = async () => {
  const res = await listNotice(queryParams.value);
  noticeList.value = res.data.records;
  total.value = res.data.total;
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  handleFormRef.value?.resetFields();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 详情按钮操作 */
const handleDetail = (row: NoticeVO) => {
  currentNotice.value = row;
  // 查找关联的回复（conversationId 等于当前记录的 noticeId）并按创建时间排序
  relatedReplies.value = noticeList.value
    .filter(item => item.conversationId === row.noticeId)
    .sort((a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime());
  detailDialog.visible = true;
  detailDialog.title = '反馈详情';
};

/** 处理按钮操作 */
const handleProcess = (row: NoticeVO) => {
  reset();
  form.value.noticeId = row.noticeId;
  dialog.visible = true;
  dialog.title = '处理反馈';
};

/** 提交处理 */
const submitForm = () => {
  handleFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      await handleNotice(form.value);
      proxy?.$modal.msgSuccess('处理成功');
      dialog.visible = false;
      await getList();
    }
  });
};

onMounted(() => {
  getList();
});
</script>