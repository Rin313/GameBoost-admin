<template>
  <div class="p-2">
<div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="用户名" prop="userName">
              <el-input v-model="queryParams.userName" placeholder="请输入用户名" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="用户昵称" prop="nickName">
              <el-input v-model="queryParams.nickName" placeholder="请输入用户昵称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="手机号码" prop="phonenumber">
              <el-input v-model="queryParams.phonenumber" placeholder="请输入手机号码" clearable @keyup.enter="handleQuery" />
            </el-form-item>

            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="用户状态" clearable>
                <el-option v-for="dict in status_user" :key="dict.value" :label="dict.label" :value="dict.value" />
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
              ></el-date-picker>
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
            <el-button v-hasPermi="['system:user:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" :columns="columns" :search="true" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table border :data="userList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column v-if="columns[0].visible" key="userId" label="用户编号" align="center" prop="userId" />
        <el-table-column v-if="columns[1].visible" key="userName" label="用户名" align="center" prop="userName" :show-overflow-tooltip="true" />
        <el-table-column v-if="columns[2].visible" key="nickName" label="用户昵称" align="center" prop="nickName" :show-overflow-tooltip="true" />
        <el-table-column v-if="columns[3].visible" key="phonenumber" label="手机号码" align="center" prop="phonenumber" width="120" />
        <el-table-column v-if="columns[4].visible" prop="status" label="状态" align="center">
          <template #default="scope">
            <dict-tag :options="status_user" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column v-if="columns[5].visible" label="创建时间" align="center" prop="createTime" width="160">
          <template #default="scope">
            <span>{{ scope.row.createTime }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" fixed="right" width="180" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip v-if="scope.row.userId !== 1" content="修改" placement="top">
              <el-button v-hasPermi="['system:user:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
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
            <el-form-item label="用户昵称" prop="nickName">
              <el-input v-model="form.nickName" placeholder="请输入用户昵称" maxlength="30" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="手机号码" prop="phonenumber">
              <el-input v-model="form.phonenumber" placeholder="请输入手机号码" maxlength="11" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="50" />
            </el-form-item>
          </el-col>
        </el-row>
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
            <el-form-item label="用户性别">
              <el-select v-model="form.sex" placeholder="请选择">
                <el-option v-for="dict in user_sex" :key="dict.value" :label="dict.label" :value="dict.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio v-for="dict in status_enabled" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="form.userId == null || form.userId != useUserStore().userId">
          <el-col :span="24">
            <el-form-item label="角色" prop="userRoles">
              <div class="role-list-container">
                <div v-for="(userRole, index) in form.userRoles" :key="index" class="role-item">
                  <el-select
                    v-model="userRole.roleId"
                    filterable
                    placeholder="请选择角色"
                    style="width: 180px"
                    @change="handleRoleChange"
                  >
                    <el-option
                      v-for="item in roleOptions"
                      :key="item.roleId"
                      :label="item.roleName"
                      :value="item.roleId"
                      :disabled="item.status == '1' || isRoleSelected(item.roleId, index)"
                    ></el-option>
                  </el-select>
                  <el-date-picker
                    v-model="userRole.expireTime"
                    type="datetime"
                    placeholder="过期时间（可选）"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    style="width: 200px; margin-left: 10px"
                    :disabled-date="disabledDate"
                  />
                  <el-button
                    type="danger"
                    :icon="Delete"
                    circle
                    size="small"
                    style="margin-left: 10px"
                    @click="removeUserRole(index)"
                  />
                </div>
                <el-button type="primary" :icon="Plus" size="small" @click="addUserRole">
                  添加角色
                </el-button>
              </div>
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
  </div>
</template>

<script setup lang="ts">
import { Delete, Plus } from '@element-plus/icons-vue';
import api from '@/api/system/user';
import { UserForm, UserQuery, UserVO, UserRoleDTO } from '@/api/system/user/types';
import { listRole } from '@/api/system/role';
import { RoleVO } from '@/api/system/role/types';
import { useUserStore } from '@/store/modules/user';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { status_enabled, user_sex,status_user } = toRefs<any>(proxy?.useDict('status_enabled', 'user_sex','status_user'));
const userList = ref<UserVO[]>();
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const dateRange = ref<[DateModelType, DateModelType]>(['', '']);
const initPassword = ref<string>('');
const roleOptions = ref<RoleVO[]>([]);

// 列显隐信息
const columns = ref<FieldOption[]>([
  { key: 0, label: `用户编号`, visible: false, children: [] },
  { key: 1, label: `用户名`, visible: true, children: [] },
  { key: 2, label: `用户昵称`, visible: true, children: [] },
  { key: 3, label: `手机号码`, visible: true, children: [] },
  { key: 4, label: `状态`, visible: true, children: [] },
  { key: 5, label: `创建时间`, visible: true, children: [] }
]);

const queryFormRef = ref<ElFormInstance>();
const userFormRef = ref<ElFormInstance>();

const dialog = reactive({
  visible: false,
  title: ''
});

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
        min: 2,
        max: 20,
        message: '用户名长度必须介于 1 和 30 之间',
        trigger: 'blur'
      }
    ],
    password: [
      { required: true, message: '用户密码不能为空', trigger: 'blur' },
      {
        min: 5,
        max: 20,
        message: '用户密码长度必须介于 5 和 20 之间',
        trigger: 'blur'
      },
      { pattern: /^[^<>"'|\\]+$/, message: '不能包含非法字符：< > " \' \\ |', trigger: 'blur' }
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
    ]
  }
};

const data = reactive<PageData<UserForm, UserQuery>>(initData);
const { queryParams, form, rules } = toRefs<PageData<UserForm, UserQuery>>(data);

/** 获取角色选项列表 */
const getRoleOptions = async () => {
  const res = await listRole(null);
  roleOptions.value = res.data.records.filter(item=>item.roleId!==1);
};

/** 查询用户列表 */
const getList = async () => {
  const res = await api.listUser(proxy?.addDateRange(queryParams.value, dateRange.value));
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
  ids.value = selection.map((item) => item.userId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'system/user/export',
    {
      ...queryParams.value
    },
    `user_${new Date().getTime()}.xlsx`
  );
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
  // 使用 listRole 获取角色列表
  await getRoleOptions();
  dialog.visible = true;
  dialog.title = '新增用户';
  form.value.password = initPassword.value.toString();
  // 默认添加一个空的角色选项
  form.value.userRoles = [{ roleId: '', expireTime: null }];
};

/** 修改按钮操作 */
const handleUpdate = async (row?: UserForm) => {
  reset();
  const userId = row?.userId || ids.value[0];
  
  // 并行请求用户信息和角色列表
  const [userRes, roleRes] = await Promise.all([
    api.getUser(userId),
    listRole(null)
  ]);
  
  dialog.visible = true;
  dialog.title = '修改用户';
  
  const userData = userRes.data.user;
  Object.assign(form.value, userData);
  
  // 使用 listRole 返回的角色列表
  roleOptions.value = roleRes.data.records;

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

/** 添加角色 */
const addUserRole = () => {
  form.value.userRoles.push({
    roleId: '',
    expireTime: null
  });
};

/** 移除角色 */
const removeUserRole = (index: number) => {
  form.value.userRoles.splice(index, 1);
  // 触发表单验证
  userFormRef.value?.validateField('userRoles');
};

/** 检查角色是否已被选择（防止重复选择） */
const isRoleSelected = (roleId: string | number, currentIndex: number): boolean => {
  return form.value.userRoles.some((item, index) => index !== currentIndex && item.roleId === roleId);
};

/** 角色选择变化时触发验证 */
const handleRoleChange = () => {
  userFormRef.value?.validateField('userRoles');
};

/** 禁用过去的日期 */
const disabledDate = (time: Date) => {
  return time.getTime() < Date.now() - 8.64e7; // 禁用今天之前的日期
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
});
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