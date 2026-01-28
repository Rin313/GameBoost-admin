<template>
  <div class="p-2">
    <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="小说标题" prop="title">
              <el-input v-model="queryParams.title" placeholder="请输入小说标题" clearable style="width: 200px" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="作者" prop="author">
              <el-input v-model="queryParams.author" placeholder="请输入作者名称" clearable style="width: 200px" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="分类" prop="category">
              <el-select v-model="queryParams.category" placeholder="请选择分类" clearable style="width: 200px">
                <el-option v-for="item in novelCategory" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 200px">
                <el-option label="正常" value="0" />
                <el-option label="停用" value="1" />
              </el-select>
            </el-form-item>
            <el-form-item label="创建时间" style="width: 308px">
              <el-date-picker
                v-model="dateRange"
                value-format="YYYY-MM-DD HH:mm:ss"
                type="daterange"
                range-separator="-"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>

    <!-- 列表区域 -->
    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button v-hasPermi="['novel:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['novel:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
        </el-row>
      </template>

      <el-table border :data="novelList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="ID" align="center" prop="id" width="80" />
        <el-table-column label="封面" align="center" prop="url" width="100">
          <template #default="{ row }">
            <el-image
              v-if="row.url"
              :src="getImageUrl(row.url)"
              :preview-src-list="[getImageUrl(row.url)]"
              fit="cover"
              style="width: 60px; height: 80px"
              preview-teleported
            />
            <span v-else>暂无封面</span>
          </template>
        </el-table-column>
        <el-table-column label="标题" align="center" prop="title" show-overflow-tooltip min-width="150" />
        <el-table-column label="作者" align="center" prop="author" width="120" show-overflow-tooltip />
        <el-table-column label="分类" align="center" prop="category" width="100" />
        <el-table-column label="简介" align="center" prop="intro" show-overflow-tooltip min-width="200" />
        <el-table-column label="浏览量" align="center" prop="viewCount" width="100" />
        <el-table-column label="状态" align="center" prop="status" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === '0' ? 'primary' : 'danger'">
              {{ row.status === '0' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
          <template #default="{ row }">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['novel:edit']" link type="primary" icon="Edit" @click="handleUpdate(row)" />
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['novel:remove']" link type="primary" icon="Delete" @click="handleDelete(row)" />
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

    <!-- 添加或修改小说对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="800px" append-to-body destroy-on-close>
      <el-form ref="novelFormRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="小说标题" prop="title">
              <el-input v-model="form.title" placeholder="请输入小说标题" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="作者" prop="author">
              <el-input v-model="form.author" placeholder="请输入作者名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-select v-model="form.category" placeholder="请选择分类" clearable style="width: 100%">
                <el-option v-for="item in novelCategory" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
                <el-option label="正常" value="0" />
                <el-option label="停用" value="1" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="浏览量" prop="viewCount">
              <el-input-number v-model="form.viewCount" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 封面上传 -->
        <el-form-item label="封面">
          <div class="cover-upload-container">
            <el-upload
              class="avatar-uploader"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleFileChange"
              accept="image/*"
            >
              <img v-if="imageUrl" :src="imageUrl" class="avatar" />
              <img v-else-if="form.url" :src="getImageUrl(form.url)" class="avatar" />
              <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
            </el-upload>
            <div class="upload-actions">
              <el-button v-if="imageUrl || form.url" type="danger" link @click="clearImage">清除图片</el-button>
              <span v-if="form.id && !imageUrl && form.url" class="upload-tip">点击上方可更换封面</span>
              <span v-else-if="!imageUrl" class="upload-tip">点击上传封面图片</span>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="简介" prop="intro">
          <el-input v-model="form.intro" type="textarea" :rows="3" placeholder="请输入小说简介" />
        </el-form-item>
        <el-form-item label="世界观设定" prop="worldSetting">
          <el-input v-model="form.worldSetting" type="textarea" :rows="4" placeholder="请输入世界观设定" />
        </el-form-item>
        <el-form-item label="主线设定" prop="mainStoryline">
          <el-input v-model="form.mainStoryline" type="textarea" :rows="4" placeholder="请输入主线设定" />
        </el-form-item>
        <el-form-item label="写作风格" prop="writingStyle">
          <el-input v-model="form.writingStyle" type="textarea" :rows="3" placeholder="请输入写作风格" />
        </el-form-item>

        <!-- 角色设定 -->
        <el-form-item label="角色设定">
          <div class="characters-container">
            <el-card v-for="(character, index) in form.characters" :key="index" class="character-card" shadow="hover">
              <template #header>
                <div class="character-header">
                  <span>角色 {{ index + 1 }}</span>
                  <el-button type="danger" link icon="Delete" @click="removeCharacter(index)">删除</el-button>
                </div>
              </template>
              <el-form-item label="角色名称" :prop="`characters.${index}.name`" label-width="80px">
                <el-input v-model="character.name" placeholder="请输入角色名称" />
              </el-form-item>
              <el-form-item label="基础描述" :prop="`characters.${index}.baseDescription`" label-width="80px">
                <el-input v-model="character.baseDescription" type="textarea" :rows="2" placeholder="请输入角色基础描述" />
              </el-form-item>
              <el-form-item label="初始属性" :prop="`characters.${index}.currentAttributes`" label-width="80px">
                <el-input v-model="character.currentAttributes" type="textarea" :rows="2" placeholder="请输入角色初始属性" />
              </el-form-item>
              <!-- 新增：付费类型 -->
              <el-form-item label="付费类型" :prop="`characters.${index}.payType`" label-width="80px">
                <el-radio-group v-model="character.payType">
                  <el-radio v-for="item in payTypeOptions" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </el-radio>
                </el-radio-group>
              </el-form-item>
              <!-- 新增：金币价格（仅付费时显示） -->
              <el-form-item
                v-if="character.payType === 'purcharse'"
                label="金币价格"
                :prop="`characters.${index}.coinAmount`"
                label-width="80px"
              >
                <el-input-number
                  v-model="character.coinAmount"
                  :min="0"
                  :precision="0"
                  controls-position="right"
                  placeholder="请输入金币数量"
                  style="width: 200px"
                />
              </el-form-item>
            </el-card>
            <el-button type="primary" plain icon="Plus" class="add-character-btn" @click="addCharacter">添加角色</el-button>
          </div>
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
import { listNovel, addNovel, updateNovel, delNovel, getNovelInfo } from '@/api/novel';
import { NovelForm, NovelQuery, NovelVO } from '@/api/novel/types';
import { Plus } from '@element-plus/icons-vue';
import type { UploadFile } from 'element-plus';
import { getImageUrl } from '@/utils/img';
import { convertImgToWebP } from '@/utils/imageCompressor';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

// ==================== 付费类型选项 ====================
const payTypeOptions = [
  { value: 'free', label: '免费' },
  { value: 'vipFree', label: 'VIP免费' },
  { value: 'purcharse', label: '付费' }
];

// ==================== 响应式数据 ====================
const novelList = ref<NovelVO[]>([]);
const novelCategory = ref<string[]>([]);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const dateRange = ref<[DateModelType, DateModelType]>(['', '']);
const imageUrl = ref('');
const uploadFile = ref<File | null>(null);

// ==================== 表单引用 ====================
const queryFormRef = ref<ElFormInstance>();
const novelFormRef = ref<ElFormInstance>();

// ==================== 对话框状态 ====================
const dialog = reactive({
  visible: false,
  title: ''
});

// ==================== 角色类型定义 ====================
interface CharacterForm {
  name: string;
  baseDescription: string;
  currentAttributes: string;
  payType: 'free' | 'vipFree' | 'purcharse';
  coinAmount?: number;
  assetsChanges?: { coin: number };
}

// ==================== 表单数据 ====================
const initFormData: NovelForm = {
  id: undefined,
  title: '',
  author: '',
  url: '',
  intro: '',
  category: '',
  status: '0',
  viewCount: 0,
  worldSetting: '',
  mainStoryline: '',
  writingStyle: '',
  characters: []
};

const data = reactive<PageData<NovelForm, NovelQuery>>({
  form: { ...initFormData, characters: [] },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    title: '',
    author: '',
    intro: '',
    category: '',
    status: ''
  },
  rules: {
    title: [{ required: true, message: '小说标题不能为空', trigger: 'blur' }],
    worldSetting: [{ required: true, message: '世界观设定不能为空', trigger: 'blur' }],
    mainStoryline: [{ required: true, message: '主线设定不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

// ==================== 列表相关方法 ====================
/** 查询小说列表 */
const getList = async () => {
  try {
    const res = await listNovel(proxy?.addDateRange(queryParams.value, dateRange.value, 'beginTime', 'endTime'));
    novelList.value = res.data.records;
    total.value = res.data.total;
  } finally {
  }
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  dateRange.value = ['', ''];
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 多选框选中数据 */
const handleSelectionChange = (selection: NovelVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length !== 1;
  multiple.value = !selection.length;
};

// ==================== 表单相关方法 ====================
/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData, characters: [] };
  imageUrl.value = '';
  uploadFile.value = null;
  novelFormRef.value?.resetFields();
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '新增小说';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: NovelVO) => {
  reset();
  const novelId = row?.id || ids.value[0];

  try {
    const { data: novelInfo } = await getNovelInfo(novelId as number);
    const characters = (novelInfo.characters || []).map((char: any) => ({
      name: char.name || '',
      baseDescription: char.baseDescription || '',
      currentAttributes: char.currentAttributes || '',
      payType: char.payType || 'free',
      coinAmount: char.coins ?? undefined//char.assetsChanges?.coin ?? undefined
    }));

    form.value = {
      id: novelInfo.id,
      title: novelInfo.title || '',
      author: novelInfo.author || '',
      url: novelInfo.url || '',
      intro: novelInfo.intro || '',
      category: novelInfo.category || '',
      status: novelInfo.status || '0',
      viewCount: novelInfo.viewCount ?? 0,
      worldSetting: novelInfo.worldSetting || '',
      mainStoryline: novelInfo.mainStoryline || '',
      writingStyle: novelInfo.writingStyle || '',
      characters
    };

    dialog.visible = true;
    dialog.title = '修改小说';
  } catch {
    proxy?.$modal.msgError('获取小说详情失败');
  } finally {
  }
};

/** 删除按钮操作 */
const handleDelete = async (row?: NovelVO) => {
  const novelIds = row?.id || ids.value;
  await proxy?.$modal.confirm(`是否确认删除小说编号为"${novelIds}"的数据项？`);
  await delNovel(novelIds);
  await getList();
  proxy?.$modal.msgSuccess('删除成功');
};

// ==================== 图片上传相关方法 ====================
/** 文件选择变化 */
const handleFileChange = async (file: UploadFile) => {
  if (!file.raw?.type.startsWith('image/')) {
    proxy?.$modal.msgWarning('请选择图片文件');
    return;
  }

  try {
    const compressedFile = await convertImgToWebP(file.raw, 0.75);
    uploadFile.value = compressedFile;
    imageUrl.value = URL.createObjectURL(compressedFile);
  } catch {
    proxy?.$modal.msgWarning('图片压缩失败，将使用原图');
    uploadFile.value = file.raw;
    imageUrl.value = URL.createObjectURL(file.raw);
  }
};

/** 清除图片 */
const clearImage = () => {
  imageUrl.value = '';
  uploadFile.value = null;
  form.value.url = '';
};

// ==================== 角色设定相关方法 ====================
/** 添加角色 */
const addCharacter = () => {
  form.value.characters ??= [];
  form.value.characters.push({
    name: '',
    baseDescription: '',
    currentAttributes: '',
    payType: 'free',
    coinAmount: undefined
  });
};

/** 删除角色 */
const removeCharacter = (index: number) => {
  form.value.characters?.splice(index, 1);
};

// ==================== 表单提交相关方法 ====================
/** 构建FormData */
const buildFormData = (): FormData => {
  const formData = new FormData();

  if (uploadFile.value) {
    formData.append('img', uploadFile.value);
  }

  if (form.value.id != null) {
    formData.append('id', String(form.value.id));
  }

  // 添加基础字段
  const fields = ['title', 'author', 'intro', 'category', 'status', 'worldSetting', 'mainStoryline', 'writingStyle'] as const;
  fields.forEach((field) => {
    const value = form.value[field];
    if (value) {
      formData.append(field, value);
    }
  });

  // 添加浏览量
  if (form.value.viewCount != null) {
    formData.append('viewCount', String(form.value.viewCount));
  }

  // 添加角色数据
  form.value.characters?.forEach((character: CharacterForm, index: number) => {
    formData.append(`characters[${index}].name`, character.name || '');
    formData.append(`characters[${index}].baseDescription`, character.baseDescription || '');
    formData.append(`characters[${index}].currentAttributes`, character.currentAttributes || '');
    formData.append(`characters[${index}].payType`, character.payType || 'free');

    if (character.payType === 'purcharse' && character.coinAmount != null) {
      //formData.append(`characters[${index}].assetsChanges`, JSON.stringify({ coin: character.coinAmount }));
       formData.append(`characters[${index}].coins`, character.coinAmount );
    }
  });

  return formData;
};

/** 提交按钮 */
const submitForm = () => {
  novelFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    try {
      const formData = buildFormData();
      await (form.value.id ? updateNovel(formData) : addNovel(formData));

      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    } finally {
    }
  });
};

// ==================== 生命周期 ====================
onMounted(async () => {
  getList();
  const response = await proxy?.getConfigKey('novel_category');
  novelCategory.value = JSON.parse(response?.data || '[]');
});
</script>

<style scoped lang="scss">
.avatar-uploader {
  :deep(.el-upload) {
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--el-transition-duration-fast);

    &:hover {
      border-color: var(--el-color-primary);
    }
  }
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  text-align: center;
  line-height: 100px;
}

.avatar {
  width: 100px;
  height: 100px;
  display: block;
  object-fit: cover;
}

.cover-upload-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.upload-actions {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
}

.characters-container {
  width: 100%;
}

.character-card {
  margin-bottom: 15px;

  .character-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  :deep(.el-card__body) {
    padding: 15px;
  }

  :deep(.el-form-item) {
    margin-bottom: 10px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.add-character-btn {
  width: 100%;
}
</style>