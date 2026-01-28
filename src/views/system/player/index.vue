<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="用户名" prop="userName">
              <el-input v-model="queryParams.userName" placeholder="请输入用户名" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="姓名" prop="realName">
              <el-input v-model="queryParams.realName" placeholder="请输入姓名" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="手机号码" prop="phonenumber">
              <el-input v-model="queryParams.phonenumber" placeholder="请输入手机号码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="用户状态" clearable>
                <el-option v-for="dict in status_user" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="注册时间" style="width: 308px">
              <el-date-picker
                v-model="dateRange"
                value-format="YYYY-MM-DD HH:mm:ss"
                type="daterange"
                range-separator="-"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
              ></el-date-picker>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10">
          <el-col :span="1.5">
            <el-button v-has-permi="['system:user:add']" type="primary" plain icon="Plus" @click="handleAdd()">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-has-permi="['system:user:remove']" type="danger" plain :disabled="multiple" icon="Delete" @click="handleDelete()">
              删除
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-has-permi="['system:user:remove']" type="success" plain :disabled="canActive" icon="Delete" @click="handleActive()">
              激活
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-has-permi="['system:user:update']" type="warning" plain :disabled="multiple" @click="handleOpenDialog('deposit')">
              批量修改保证金
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-has-permi="['system:user:update']" type="warning" plain :disabled="multiple" @click="handleOpenDialog('credit')">
              批量修改信誉分
            </el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" :search="true" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table border :data="userList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column key="userName" label="用户名" align="center" prop="userName" :show-overflow-tooltip="true" />
        <el-table-column key="realName" label="姓名" align="center" prop="realName" />
        <el-table-column key="idCard" label="身份证号" align="center" prop="idCard" />
        <el-table-column key="phonenumber" label="手机号码" align="center" prop="phonenumber"/>
        <el-table-column key="deposit" label="保证金" align="center" prop="assets.deposit">
            <template #default="scope">
                <span>{{ formatAmount(scope.row.assets?.deposit) }}</span>
            </template>
        </el-table-column>
        <el-table-column key="credit" label="信誉分" align="center" prop="assets.credit"/>
        <el-table-column prop="status" label="状态" align="center">
          <template #default="scope">
            <dict-tag :options="status_user" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="注册时间" align="center" prop="createTime" width="160">
          <template #default="scope">
            <span>{{ scope.row.createTime }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" fixed="right" width="180" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip v-if="scope.row.userId !== 1" content="修改" placement="top">
              <el-button v-hasPermi="['system:user:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip v-if="scope.row.userId !== 1" content="修改信誉分" placement="top">
                <el-button 
                v-hasPermi="['system:user:edit']" 
                link 
                type="primary" 
                icon="TrendCharts" 
                @click="handleOpenDialog('credit', scope.row)"
                ></el-button>
            </el-tooltip>
            <el-tooltip v-if="scope.row.userId !== 1" content="修改保证金" placement="top">
                <el-button 
                v-hasPermi="['system:user:edit']" 
                link 
                type="primary" 
                icon="Money" 
                @click="handleOpenDialog('deposit', scope.row)"
                ></el-button>
            </el-tooltip>
            <el-tooltip v-if="scope.row.userId !== 1" content="重置密码" placement="top">
              <el-button v-hasPermi="['system:user:resetPwd']" link type="primary" icon="Key" @click="handleResetPwd(scope.row)"></el-button>
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

    <!-- 添加或修改用户配置对话框 -->
    <el-dialog ref="formDialogRef" v-model="dialog.visible" :title="dialog.title" width="700px" append-to-body @close="closeDialog">
      <el-form ref="userFormRef" :model="form" :rules="rules" label-width="80px">        
        <el-row>
          <el-col :span="12">
            <el-form-item v-if="form.userId == undefined" label="用户名" prop="userName">
              <el-input v-model="form.userName" placeholder="请输入用户名" maxlength="30" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item v-if="form.userId == undefined" label="用户密码" prop="password">
              <el-input v-model="form.password" placeholder="请输入用户密码" type="password" maxlength="20" show-password />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item v-if="form.userId == undefined" label="姓名" prop="realName">
              <el-input v-model="form.realName" placeholder="请输入姓名" maxlength="30" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item v-if="form.userId == undefined" label="身份证号" prop="idCard">
              <el-input v-model="form.idCard" placeholder="请输入身份证号" maxlength="30" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="手机号码" prop="phonenumber">
              <el-input v-model="form.phonenumber" placeholder="请输入手机号码" maxlength="11" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio v-for="dict in status_enabled" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" placeholder="请输入内容"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel()">取 消</el-button>
        </div>
      </template>
    </el-dialog>
    <el-dialog
  v-model="assetsDialog.visible"
  :title="assetsDialog.title"
  width="500px"
  append-to-body
  @close="assetsResetForm"
>
  <el-form ref="formRef" :model="assetsform" :rules="assetsRules" label-width="100px">
    <el-form-item label="业务类型" prop="bizType">
      <el-select 
        v-model="assetsform.bizType" 
        placeholder="请选择业务类型" 
        style="width: 100%"
        @change="handleBizTypeChange"
      >
        <el-option
          v-for="item in currentOptions"
          :key="item.label"
          :label="item.label"
          :value="item.label" 
        />
      </el-select>
    </el-form-item>
    <el-form-item label="操作模式" prop="force">
      <el-radio-group v-model="assetsform.force">
        <!-- false 代表增减变动，true 代表直接设置 -->
        <el-radio :value="false">增减变动</el-radio>
        <el-radio :value="true">直接设置</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item 
      :label="assetsform.force ? '设置数值' : '变动数值'" 
      prop="changes"
    >
      <el-input-number 
        v-if="assetsDialog.mode === 'credit'"
        v-model="assetsform.changes" 
        :step="1" 
        style="width: 100%" 
        :placeholder="assetsform.force ? '请输入目标数值' : '请输入变动数值'" 
      />
      <el-input-number 
          v-else
          v-model="assetsform.changes" 
          :precision="2"
          :step="1.00"
          style="width: 100%" 
          :placeholder="assetsform.force ? '请输入目标数值' : '请输入变动数值'" 
      />
    </el-form-item>

  </el-form>
  <template #footer>
    <div class="dialog-footer">
      <el-button @click="assetsDialog.visible = false">取 消</el-button>
      <el-button type="primary" @click="assetsSubmitForm">确 定</el-button>
    </div>
  </template>
</el-dialog>
  </div>
</template>

<script setup name="User" lang="ts">
import api from '@/api/system/user';
import { UserForm, UserQuery, UserVO, UserRoleDTO } from '@/api/system/user/types';
import { RoleVO } from '@/api/system/role/types';
import { useUserStore } from '@/store/modules/user';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { status_enabled,credit_type,status_user } = toRefs<any>(proxy?.useDict('status_enabled','credit_type','status_user'));
const deposit_type=ref([])

interface UserRow {
  userId: number | string;
  [key: string]: any;
}
const formRef = ref<ElFormInstance>();

const userList = ref<UserVO[]>();
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const selected=ref([]);
const total = ref(0);
const dateRange = ref<[DateModelType, DateModelType]>(['', '']);
const initPassword = ref<string>('');

const queryFormRef = ref<ElFormInstance>();
const userFormRef = ref<ElFormInstance>();
const canActive=computed(()=>{
    return selected.value.length===0 || selected.value.some(item=>item.status!=='2');
})
const dialog = reactive({
  visible: false,
  title: ''
});
// 弹窗状态
const assetsDialog = reactive({
  visible: false,
  title: '',
  mode: 'credit' as 'credit' | 'deposit', // 当前模式
});

// 表单数据
const assetsform = reactive({
  userIds: null,
  bizType: '',
  changes: 0,
  force:false,
});

// 表单校验规则
const assetsRules = reactive<ElFormRules>({
  bizType: [{ required: true, message: "请选择业务类型", trigger: "change" }],
  changes: [{ required: true, message: "请输入变动数值", trigger: "blur" }]
});
const currentOptions = computed(() => {
  if (assetsDialog.mode === 'credit') {
    return credit_type.value.map(item => ({
      label: item.label,
      defaultValue: Number(item.value) // 预解析数值
    }));
  } else {
    return deposit_type.value.map(str => ({
      label: str,
      defaultValue: 0 // 保证金默认不自动填充数值，或设为0
    }));
  }
});

// --- 方法实现 ---

/**
 * 打开弹窗
 * @param mode 'credit' | 'deposit'
 * @param row 当前行数据
 */
const handleOpenDialog = (mode: 'credit' | 'deposit', row?: UserRow) => {
  assetsDialog.mode = mode;
  assetsDialog.title = mode === 'credit' ? '修改信誉分' : '修改保证金';
  assetsDialog.visible = true;
  
  // 重置表单并赋值ID
  nextTick(() => {
    resetForm();
    assetsform.userIds = row? [row.userId] : ids.value;
  });
};
/**
 * 重置表单
 */
const assetsResetForm = () => {
  assetsform.bizType = '';
  assetsform.changes = undefined; 
  if (formRef.value) formRef.value.resetFields();
};

/**
 * 监听业务类型变化
 * 需求：如果是信誉分，且选择了特定类型，自动填充默认 changes 值
 */
const handleBizTypeChange = (val: string) => {
  if (assetsDialog.mode === 'credit') {
    const selectedOption = currentOptions.value.find(item => item.label === val);
    if (selectedOption && selectedOption.defaultValue !== undefined) {
      assetsform.changes = selectedOption.defaultValue;
    }
  } else {
    // 如果是保证金模式，切换类型时通常重置数值，或者保持不变，视需求而定
    // form.changes = 0; 
  }
};

/**
 * 提交表单
 */
const assetsSubmitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const changesVal = Number(assetsform.changes);
        if (assetsDialog.mode === 'credit') {
          await api.updateCredit(assetsform.userIds, assetsform.bizType, changesVal,assetsform.force);
          proxy?.$modal.msgSuccess('操作成功');
        } else {
          await api.updateDeposit(assetsform.userIds, assetsform.bizType, changesVal,assetsform.force);
          proxy?.$modal.msgSuccess('操作成功');
        }
        assetsDialog.visible = false;
        await getList();
      } catch (error) {} 
    }
  });
};
const initFormData: UserForm = {
  userId: undefined,
  userName: '',
  nickName: undefined,
  password: '',
  phonenumber: undefined,
  email: undefined,
  sex: undefined,
  status: '0',
  remark: '',
  userRoles: []
};

const initData: PageData<UserForm, UserQuery> = {
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    userName: '',
    phonenumber: '',
    status: '',
    roleId: ''
  },
  rules: {
    userName: [
      { required: true, message: '用户名不能为空', trigger: 'blur' },
      {
        min: 1,
        max: 30,
        message: '用户名长度必须介于 1 和 30 之间',
        trigger: 'blur'
      }
    ],
    password: [
        { required: true, trigger: 'blur', message: t('register.rule.password.required') },
        { min: 5, max: 30, message: t('register.rule.password.length', { min: 5, max: 30 }), trigger: 'blur' },
        { pattern: /^[^<>"'|\\]+$/, message: t('register.rule.password.pattern', { strings: '< > " \' \\ |' }), trigger: 'blur' }
    ],
    email: [
      {
        type: 'email',
        message: '请输入正确的邮箱地址',
        trigger: ['blur', 'change']
      }
    ],
    phonenumber: [
      {
        pattern: /^1[3456789][0-9]\d{8}$/,
        message: '请输入正确的手机号码',
        trigger: 'blur'
      }
    ],
    // 修改后的角色验证规则
    userRoles: [
      {
        required: true,
        validator: (rule: any, value: UserRoleDTO[], callback: any) => {
          if (!value || value.length === 0) {
            callback(new Error('用户角色不能为空'));
          } else if (value.some((item) => !item.roleId)) {
            callback(new Error('请选择有效的角色'));
          } else {
            callback();
          }
        },
        trigger: 'change'
      }
    ],
    realName: [
        { required: true, trigger: 'blur', message: t('register.rule.realName.required') },
    ],
    idCard: [
        { required: true, trigger: 'blur', message: t('register.rule.idCard.required') },
        { 
        // 这是一个比较严格的18位身份证校验正则，包含日期有效性校验，最后一位允许X/x
        pattern: /^[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|10|11|12)(?:0[1-9]|[1-2]\d|30|31)\d{3}[\dXx]$/,
        message: t('register.rule.idCard.pattern'),
        trigger: 'blur' 
        }
    ],
  }
};

const data = reactive<PageData<UserForm, UserQuery>>(initData);
const { queryParams, form, rules } = toRefs<PageData<UserForm, UserQuery>>(data);

/** 查询用户列表 */
const getList = async () => {
  const res = await api.listPlayers(proxy?.addDateRange(queryParams.value, dateRange.value));
  userList.value = res.data.records;
  total.value = res.data.total;
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
  queryParams.value.pageNum = 1;
  handleQuery();
};

/** 删除按钮操作 */
const handleDelete = async (row?: UserVO) => {
  const userIds = row?.userId || ids.value;
  try{
    await proxy?.$modal.confirm('是否确认删除用户编号为"' + userIds + '"的数据项？');
    await api.delUser(userIds);
    await getList();
    proxy?.$modal.msgSuccess('删除成功');
  }
  catch(err){}
};
const handleActive = async () => {
  const userIds = ids.value;
  try{
    await proxy?.$modal.confirm('是否确认激活用户编号为"' + userIds + '"的数据项？');
    await api.activeUser(userIds);
    await getList();
    proxy?.$modal.msgSuccess('激活成功');
  }
  catch(err){}
};

/** 重置密码按钮操作 */
const handleResetPwd = async (row: UserVO) => {
    try{
        const res=await ElMessageBox.prompt('请输入"' + row.userName + '"的新密码', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            closeOnClickModal: false,
            inputPattern: /^.{5,20}$/,
            inputErrorMessage: '用户密码长度必须介于 5 和 20 之间',
            inputValidator: (value) => {
                if (/<|>|"|'|\||\\/.test(value)) {
                return '不能包含非法字符：< > " \' \\ |';
                }
            }
        });
        await api.resetUserPwd(row.userId, res.value);
        proxy?.$modal.msgSuccess('修改成功，新密码是：' + res.value);
    }
    catch(err){}
};

/** 选择条数  */
const handleSelectionChange = (selection: UserVO[]) => {
    selected.value=selection;
  ids.value = selection.map((item) => item.userId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 重置操作表单 */
const reset = () => {
  form.value = { ...initFormData, userRoles: [] };
  userFormRef.value?.resetFields();
};

/** 取消按钮 */
const cancel = () => {
  dialog.visible = false;
  reset();
};

/** 新增按钮操作 */
const handleAdd = async () => {
  reset();
  dialog.visible = true;
  dialog.title = '新增用户';
  form.value.password = initPassword.value.toString();
  form.value.userRoles = [{ roleId: '3', expireTime: null }];
};

/** 修改按钮操作 */
const handleUpdate = async (row?: UserForm) => {
  reset();
  const userId = row?.userId || ids.value[0];
  
  // 并行请求用户信息和角色列表
  const [userRes] = await Promise.all([
    api.getUser(userId)
  ]);
  
  dialog.visible = true;
  dialog.title = '修改用户';
  
  const userData = userRes.data.user;
  Object.assign(form.value, userData);

  if (userData.roles && userData.roles.length > 0) {
    // 从 user.roles 获取角色信息（包含 expireTime）
    form.value.userRoles = userData.roles.map((role: RoleVO) => ({
      roleId: role.roleId,
      expireTime: role.expireTime || null
    }));
  } else {
    form.value.userRoles = [];
  }

  form.value.password = '';
};


/** 提交按钮 */
const submitForm = () => {
  userFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      // 过滤掉空的角色选项
      const validUserRoles = form.value.userRoles.filter((item) => item.roleId);

      const submitData = {
        ...form.value,
        userRoles: validUserRoles
      };

      if (form.value.userId) {
        // 自己编辑自己的情况下 不允许编辑角色
        if (form.value.userId == useUserStore().userId) {
          submitData.userRoles = [];
        }
        await api.updateUser(submitData);
      } else {
        await api.addUser(submitData);
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/**
 * 关闭用户弹窗
 */
const closeDialog = () => {
  dialog.visible = false;
  resetForm();
};

/**
 * 重置表单
 */
const resetForm = () => {
  userFormRef.value?.resetFields();
  userFormRef.value?.clearValidate();

  form.value.id = undefined;
  form.value.status = '1';
  form.value.userRoles = [];
};

onMounted(() => {
  getList();
  proxy?.getConfigKey('sys.user.initPassword').then((response) => {
    initPassword.value = response.data;
  });
  proxy?.getConfigKey('deposit_type').then((response) => {
    deposit_type.value = JSON.parse(response?.data || '[]');
  });

});
const formatAmount = (amount: number | string | null | undefined): string => {
    if (amount === null || amount === undefined || amount === '') {
        return '';
    }
    return '¥'+Number(amount).toFixed(2);
};
</script>

<style scoped lang="scss">
.role-list-container {
  width: 100%;

  .role-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;

    &:last-child {
      margin-bottom: 10px;
    }
  }
}
</style>