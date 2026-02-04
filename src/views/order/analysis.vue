<!-- src/views/analysis/index.vue -->
<template>
  <div class="analysis-container">
    <!-- 筛选条件 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="时间类型">
          <el-radio-group v-model="queryParams.timeType" @change="handleTimeTypeChange">
            <el-radio-button value="day">按天</el-radio-button>
            <el-radio-button value="month">按月</el-radio-button>
            <el-radio-button value="year">按年</el-radio-button>
            <el-radio-button value="custom">自定义</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            :type="datePickerType"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            :value-format="dateFormat"
            @change="handleDateChange"
          />
        </el-form-item>
        <el-form-item label="业务类型" prop="orderType">
            <el-cascader
            v-model="orderTypeValue"
            :options="orderTypeOptions"
            :props="{ expandTrigger: 'hover' }"
            placeholder="请选择业务类型"
            clearable
            filterable
            @change="handleQueryOrderTypeChange"
            style="width: 240px"
            />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计概览卡片 -->
    <el-row :gutter="20" class="overview-cards">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #409eff;">
              <el-icon size="28"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overview.totalOrders || 0 }}</div>
              <div class="stat-label">接单总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #67c23a;">
              <el-icon size="28"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overview.completedOrders || 0 }}</div>
              <div class="stat-label">完成单数</div>
              <div class="stat-sub">完成率: {{ overview.completionRate || 0 }}%</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #e6a23c;">
              <el-icon size="28"><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ formatMoney(overview.totalSales) }}</div>
              <div class="stat-label">销售额</div>
              <div class="stat-sub">已完成: ¥{{ formatMoney(overview.completedSales) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #f56c6c;">
              <el-icon size="28"><Wallet /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ formatMoney(overview.totalTaskAmount) }}</div>
              <div class="stat-label">派单金额</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 趋势图表 -->
    <el-card class="chart-card" shadow="never">
      <template #header>
        <span>数据趋势</span>
      </template>
      <div ref="trendChartRef" class="chart-container"></div>
    </el-card>

    <!-- 分析表格区域 -->
    <el-row :gutter="20">
      <!-- 业务类型分析 -->
      <el-col :span="12">
        <el-card class="table-card" shadow="never">
          <template #header>
            <span>业务类型分析</span>
          </template>
          <el-table :data="orderTypeList" stripe max-height="400">
            <el-table-column prop="orderType" label="业务类型" min-width="100" />
            <el-table-column prop="totalOrders" label="接单数" width="80" align="center" />
            <el-table-column prop="completedOrders" label="完成数" width="80" align="center" />
            <el-table-column prop="completionRate" label="完成率" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="getCompletionRateType(row.completionRate)">
                  {{ row.completionRate }}%
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="totalSales" label="销售额" width="120" align="right">
              <template #default="{ row }">
                ¥{{ formatMoney(row.totalSales) }}
              </template>
            </el-table-column>
            <el-table-column prop="completedSales" label="已完成" width="120" align="right">
              <template #default="{ row }">
                ¥{{ formatMoney(row.completedSales) }}
              </template>
            </el-table-column>
            <el-table-column prop="totalTaskAmount" label="派单金额" width="120" align="right">
              <template #default="{ row }">
                ¥{{ formatMoney(row.totalTaskAmount) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="table-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>打手分析</span>
              <el-button type="primary" link @click="showUserDetail = true">
                查看全部
              </el-button>
            </div>
          </template>
          <el-table :data="userList" stripe max-height="400">
            <el-table-column prop="realName" label="姓名" width="100" />
            <el-table-column prop="totalOrders" label="接单数" width="80" align="center" />
            <el-table-column prop="completedOrders" label="完成数" width="80" align="center" />
            <el-table-column prop="completionRate" label="完成率" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="getCompletionRateType(row.completionRate)">
                  {{ row.completionRate }}%
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="totalTaskAmount" label="派单金额" width="120" align="right">
              <template #default="{ row }">
                ¥{{ formatMoney(row.totalTaskAmount) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="handleViewUser(row)">
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
    <el-dialog v-model="userDetailVisible" title="打手详细数据" width="800px">
      <el-descriptions :column="3" border v-if="userDetailData">
        <el-descriptions-item label="姓名">{{ userDetailData.realName }}</el-descriptions-item>
        <el-descriptions-item label="接单数">{{ userDetailData.totalOrders }}</el-descriptions-item>
        <el-descriptions-item label="完成数">{{ userDetailData.completedOrders }}</el-descriptions-item>
        <el-descriptions-item label="进行中">{{ userDetailData.processingOrders }}</el-descriptions-item>
        <el-descriptions-item label="完成率">
          <el-tag :type="getCompletionRateType(userDetailData.completionRate)">
            {{ userDetailData.completionRate }}%
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="销售额">
          ¥{{ formatMoney(userDetailData.totalSales) }}
        </el-descriptions-item>
        <el-descriptions-item label="已完成销售额">
          ¥{{ formatMoney(userDetailData.completedSales) }}
        </el-descriptions-item>
        <el-descriptions-item label="派单金额">
          ¥{{ formatMoney(userDetailData.totalTaskAmount) }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
    <el-dialog v-model="showUserDetail" title="全部打手数据" width="900px">
      <el-form :inline="true" :model="userQueryParams" style="margin-bottom: 16px;">
        <el-form-item label="姓名">
          <el-input v-model="userQueryParams.realName" placeholder="请输入打手姓名" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchAllUsers">查询</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="allUserList" stripe max-height="500" v-loading="userLoading">
        <el-table-column prop="realName" label="姓名" width="100" />
        <el-table-column prop="totalOrders" label="接单数" width="80" align="center" />
        <el-table-column prop="completedOrders" label="完成数" width="80" align="center" />
        <el-table-column prop="processingOrders" label="进行中" width="80" align="center" />
        <el-table-column prop="completionRate" label="完成率" width="100" align="center">
          <template #default="{ row }">
            <el-progress :percentage="Number(row.completionRate)" :color="getProgressColor(row.completionRate)" />
          </template>
        </el-table-column>
        <el-table-column prop="totalTaskAmount" label="派单金额" width="120" align="right">
          <template #default="{ row }">
            ¥{{ formatMoney(row.totalTaskAmount) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewUser(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { Document, CircleCheck, Money, Wallet } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getAnalysisOverview, getByUser, getUserDetail } from '@/api/order'
const { proxy } = getCurrentInstance();
const order_type = ref({})
const orderTypeValue = ref([])
const orderTypeOptions = computed(() => {
  return Object.entries(order_type.value).map(([category, items]) => ({
    value: category,
    label: category,
    children: (items || []).map(item => ({
      value: item,
      label: item
    }))
  }))
})
const handleQueryOrderTypeChange = (value) => {
  if (value && value.length === 2) {
    queryParams.orderType = `${value[0]}/${value[1]}`
  } else {
    queryParams.orderType = ''
  }
  fetchData();
}
// 查询参数
const queryParams = reactive({
  timeType: 'day',
  startTime: '',
  endTime: '',
  orderType: ''
})

const dateRange = ref([])
const userQueryParams = reactive({ userId: '',realName:'' })

// 数据
const overview = ref({})
const trendList = ref([])
const orderTypeList = ref([])
const userList = ref([])
const allUserList = ref([])
const userDetailData = ref(null)

// 状态
const loading = ref(false)
const userLoading = ref(false)
const userDetailVisible = ref(false)
const showUserDetail = ref(false)

// 图表
const trendChartRef = ref(null)
let trendChart = null
// 计算属性
const datePickerType = computed(() => {
  switch (queryParams.timeType) {
    case 'month':
      return 'monthrange'
    case 'year':
      return 'yearrange'
    default:
      return 'daterange'
  }
})

const dateFormat = computed(() => {
  switch (queryParams.timeType) {
    case 'month':
      return 'YYYY-MM'
    case 'year':
      return 'YYYY'
    default:
      return 'YYYY-MM-DD'
  }
})

// 初始化
onMounted(() => {
    proxy?.getConfigKey('order_type').then((response) => {
        order_type.value = JSON.parse(response?.data || '{}');
  });
  initDefaultDate()
  fetchData()
  initChart()
  window.addEventListener('resize', handleResize)
})

// 初始化默认日期
function initDefaultDate() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 6)
  dateRange.value = [formatDate(start), formatDate(end)]
  queryParams.startTime = formatDate(start)
  queryParams.endTime = formatDate(end)
}

// 格式化日期
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 获取数据
async function fetchData() {
  loading.value = true
  try {
    const params = {
      timeType: queryParams.timeType,
      startTime: queryParams.startTime,
      endTime: queryParams.endTime,
      orderType: queryParams.orderType || undefined
    }
    const res = (await getAnalysisOverview(params)).data
    overview.value = res.overview || {}
    trendList.value = res.trendList || []
    orderTypeList.value = res.orderTypeList || []
    userList.value = res.userList || []
    updateChart()
  } catch (error) {
    console.error('获取数据失败:', error)
  } finally {
    loading.value = false
  }
}

async function fetchAllUsers() {
  userLoading.value = true
  try {
    const params = {
      startTime: queryParams.startTime,
      endTime: queryParams.endTime
    }
    const res = (await getByUser(params)).data
    allUserList.value = res || []
    if (userQueryParams.realName) {
      allUserList.value = allUserList.value.filter(
        item => String(item.realName).includes(userQueryParams.realName)
      )
    }
  } catch (error) {
    console.error('获取打手数据失败:', error)
  } finally {
    userLoading.value = false
  }
}

async function handleViewUser(row) {
  try {
    const params = {
      startTime: queryParams.startTime,
      endTime: queryParams.endTime
    }
    const res = (await getUserDetail(row.userId, params)).data
    userDetailData.value = res
    userDetailVisible.value = true
  } catch (error) {
    console.error('获取打手详情失败:', error)
  }
}

// 时间类型变更
function handleTimeTypeChange() {
  const now = new Date()
  let start = new Date()
  
  switch (queryParams.timeType) {
    case 'month':
      start.setMonth(start.getMonth() - 11)
      break
    case 'year':
      start.setFullYear(start.getFullYear() - 4)
      break
    default:
      start.setDate(start.getDate() - 6)
  }
  
  dateRange.value = [formatDate(start), formatDate(now)]
  queryParams.startTime = formatDate(start)
  queryParams.endTime = formatDate(now)
  fetchData()
}

// 日期变更
function handleDateChange(val) {
  if (val && val.length === 2) {
    queryParams.startTime = formatDate(val[0])
    queryParams.endTime = formatDate(val[1])
  } else {
    queryParams.startTime = ''
    queryParams.endTime = ''
  }
  fetchData()
}

// 重置查询
function resetQuery() {
  queryParams.timeType = 'day'
  queryParams.orderType = ''
  initDefaultDate()
  fetchData()
}

// 初始化图表
function initChart() {
  nextTick(() => {
    if (trendChartRef.value) {
      trendChart = echarts.init(trendChartRef.value)
    }
  })
}

// 更新图表
function updateChart() {
  if (!trendChart) return

  const xData = trendList.value.map(item => item.timeLabel)
  const totalOrdersData = trendList.value.map(item => item.totalOrders)
  const completedOrdersData = trendList.value.map(item => item.completedOrders)
  const salesData = trendList.value.map(item => Number(item.totalSales) || 0)
  const taskAmountData = trendList.value.map(item => Number(item.totalTaskAmount) || 0)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['接单数', '完成数', '销售额', '派单金额']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: {
        rotate: xData.length > 10 ? 45 : 0
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '订单数',
        position: 'left'
      },
      {
        type: 'value',
        name: '金额(元)',
        position: 'right'
      }
    ],
    series: [
      {
        name: '接单数',
        type: 'bar',
        data: totalOrdersData,
        itemStyle: { color: '#409eff' }
      },
      {
        name: '完成数',
        type: 'bar',
        data: completedOrdersData,
        itemStyle: { color: '#67c23a' }
      },
      {
        name: '销售额',
        type: 'line',
        yAxisIndex: 1,
        data: salesData,
        itemStyle: { color: '#e6a23c' },
        smooth: true
      },
      {
        name: '派单金额',
        type: 'line',
        yAxisIndex: 1,
        data: taskAmountData,
        itemStyle: { color: '#f56c6c' },
        smooth: true
      }
    ]
  }

  trendChart.setOption(option)
}

// 处理窗口大小变化
function handleResize() {
  trendChart?.resize()
}

// 格式化金额
function formatMoney(value) {
  if (!value) return '0.00'
  return Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 获取完成率标签类型
function getCompletionRateType(rate) {
  if (rate >= 80) return 'success'
  if (rate >= 50) return 'warning'
  return 'danger'
}

// 获取进度条颜色
function getProgressColor(rate) {
  if (rate >= 80) return '#67c23a'
  if (rate >= 50) return '#e6a23c'
  return '#f56c6c'
}

watch(showUserDetail, (val) => {
  if (val) {
    fetchAllUsers()
  }
})
</script>

<style scoped>
.analysis-container {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.overview-cards {
  margin-bottom: 20px;
}

.stat-card {
  height: 120px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-right: 16px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.stat-sub {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 2px;
}

.chart-card {
  margin-bottom: 20px;
}

.chart-container {
  height: 400px;
}

.table-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>