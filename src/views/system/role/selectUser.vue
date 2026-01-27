<template>
  <el-row>
    <el-dialog v-model="visible" title="选择用户" width="800px" top="5vh" append-to-body>
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="用户名" prop="userName">
          <el-input v-model="queryParams.userName" placeholder="请输入用户名" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="手机号码" prop="phonenumber">
          <el-input v-model="queryParams.phonenumber" placeholder="请输入手机号码" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <el-row>
        <el-table ref="tableRef" border :data="userList" height="260px" @row-click="clickRow" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55"></el-table-column>
          <el-table-column label="用户名" prop="userName" :show-overflow-tooltip="true" />
          <el-table-column label="用户昵称" prop="nickName" :show-overflow-tooltip="true" />
          <el-table-column label="邮箱" prop="email" :show-overflow-tooltip="true" />
          <el-table-column label="手机" prop="phonenumber" :show-overflow-tooltip="true" />
          <el-table-column label="状态" align="center" prop="status">
            <template #default="scope">
              <dict-tag :options="status_enabled" :value="scope.row.status" />
            </template>
          </el-table-column>
          <el-table-column label="创建时间" align="center" prop="createTime" width="180">
            <template #default="scope">
              <span>{{ proxy.parseTime(scope.row.createTime) }}</span>
            </template>
          </el-table-column>
        </el-table>
        <pagination v-if="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
      </el-row>
      
      <!-- 新增：过期时间选择器 -->
      <el-divider content-position="left">授权设置</el-divider>
      <el-form :model="userRoleForm" label-width="100px">
        <el-form-item label="过期时间" prop="expireTime">
          <el-date-picker
            v-model="userRoleForm.expireTime"
            type="datetime"
            placeholder="选择过期时间（可选）"
            value-format="YYYY-MM-DD HH:mm:ss"
            :disabled-date="disabledDate"
            style="width: 280px"
            clearable
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleSelectUser">确 定</el-button>
          <el-button @click="visible = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </el-row>
</template>

<script setup name="SelectUser" lang="ts">
import { authUserSelectAll, unallocatedUserList } from '@/api/system/role';
import { UserVO } from '@/api/system/user/types';
import { UserQuery } from '@/api/system/user/types';

/** 用户角色DTO类型定义 */
interface UserRoleDTO {
  roleId?: number | string;
  expireTime?: string;
}

/** 授权用户请求参数类型 */
interface AuthUserSelectAllParams {
  roleId?: number | string;
  expireTime?: string;
  userIds: string;
}

const props = defineProps({
  roleId: {
    type: [Number, String],
    required: true
  }
});

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { status_enabled } = toRefs<any>(proxy?.useDict('status_enabled'));

const userList = ref<UserVO[]>([]);
const visible = ref(false);
const total = ref(0);
const userIds = ref<Array<string | number>>([]);

const queryParams = reactive<UserQuery>({
  pageNum: 1,
  pageSize: 10,
  roleId: undefined,
  userName: undefined,
  phonenumber: undefined
});

/** 用户角色表单数据 */
const userRoleForm = reactive<UserRoleDTO>({
  roleId: undefined,
  expireTime: undefined
});

const tableRef = ref<ElTableInstance>();
const queryFormRef = ref<ElFormInstance>();

/** 禁用过去的日期 */
const disabledDate = (time: Date) => {
  return time.getTime() < Date.now() - 8.64e7; // 禁用今天之前的日期
};

const show = () => {
  queryParams.roleId = props.roleId;
  // 初始化用户角色表单
  userRoleForm.roleId = props.roleId;
  userRoleForm.expireTime = undefined;
  getList();
  visible.value = true;
};

/**
 * 选择行
 */
const clickRow = (row: any) => {
  tableRef.value?.toggleRowSelection(row, false);
};

/** 多选框选中数据 */
const handleSelectionChange = (selection: UserVO[]) => {
  userIds.value = selection.map((item: UserVO) => item.userId);
};

/** 查询数据 */
const getList = async () => {
  const res = await unallocatedUserList(queryParams);
  userList.value = res.data.records;
  total.value = res.data.total;
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  getList();
};

const emit = defineEmits(['ok']);

/** 选择授权用户操作 */
const handleSelectUser = async () => {
  const ids = userIds.value.join(',');
  if (ids === '') {
    proxy?.$modal.msgError('请选择要分配的用户');
    return;
  }
  
  // 构建请求参数，使用新的 UserRoleDTO 格式
  const params: AuthUserSelectAllParams = {
    roleId: userRoleForm.roleId,
    expireTime: userRoleForm.expireTime,
    userIds: ids
  };
  
  await authUserSelectAll(params);
  proxy?.$modal.msgSuccess('分配成功');
  emit('ok');
  visible.value = false;
};

// 暴露
defineExpose({
  show
});
</script>