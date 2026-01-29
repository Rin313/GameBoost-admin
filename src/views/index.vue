<template>
  <div class="app-container home">
    <!-- 欢迎横幅 -->
    <el-card class="welcome-card" shadow="hover">
      <div class="welcome-header">
        <div class="welcome-text">
          <div class="greeting-box">
            <h1 class="greeting">{{ greeting }}，管理员</h1>
            <span class="weather-text">每一天都是新的开始，祝您工作愉快。</span>
          </div>
          <div class="date-info">
            <span class="date">{{ currentDate }}</span>
            <span class="time">{{ currentTime }}</span>
            <span class="week">{{ currentWeek }}</span>
          </div>
        </div>
        <div class="welcome-img">
          <svg class="bg-svg" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
             <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#ecf5ff;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#d9ecff;stop-opacity:1" />
                </linearGradient>
             </defs>
             <circle cx="350" cy="50" r="80" fill="url(#grad1)" opacity="0.6"/>
             <rect x="50" y="200" width="100" height="100" rx="20" fill="#409EFF" opacity="0.1"/>
             <path d="M200,100 Q300,50 350,200 T400,300" fill="none" stroke="#409EFF" stroke-width="2" opacity="0.2"/>
             <g transform="translate(100, 80)">
                <rect x="0" y="0" width="160" height="120" rx="10" fill="#fff" filter="url(#shadow)"/>
                <rect x="20" y="20" width="120" height="10" rx="5" fill="#e0e0e0"/>
                <rect x="20" y="45" width="80" height="10" rx="5" fill="#f0f0f0"/>
                <circle cx="130" cy="90" r="15" fill="#409EFF"/>
             </g>
          </svg>
        </div>
      </div>
    </el-card>

    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 左侧：关于系统（通用介绍） -->
      <el-col :sm="24" :lg="12">
        <el-card shadow="hover" class="info-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Monitor /></el-icon> 系统概览</span>
            </div>
          </template>
          <div class="text-content">
            <p>本系统基于 Vue 3 + TypeScript + Element Plus 构建，旨在提供稳定、高效、安全的前端解决方案。</p>
            <p>采用了模块化设计理念，界面响应式布局，完美适配各类终端设备。系统集成了统一的权限管理、路由拦截与状态管理机制，确保业务流转的顺畅与数据的安全。</p>
            <div class="feature-tags">
              <el-tag effect="plain">响应式设计</el-tag>
              <el-tag effect="plain" type="success">TypeScript</el-tag>
              <el-tag effect="plain" type="warning">模块化</el-tag>
              <el-tag effect="plain" type="info">极简交互</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：系统状态/公告（静态模拟数据） -->
      <el-col :sm="24" :lg="12">
        <el-card shadow="hover" class="info-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Bell /></el-icon> 系统动态</span>
            </div>
          </template>
          <div class="text-content">
            <div class="notice-item">
              <div class="notice-left">
                <el-tag size="small" type="success" effect="dark">运行</el-tag>
                <span class="notice-text">系统环境初始化完成，各项服务运行正常</span>
              </div>
              <span class="notice-time">刚刚</span>
            </div>
            <div class="notice-item">
              <div class="notice-left">
                <el-tag size="small" type="primary" effect="dark">安全</el-tag>
                <span class="notice-text">已通过最新的安全补丁检测，数据传输加密中</span>
              </div>
              <span class="notice-time">1小时前</span>
            </div>
            <div class="notice-item">
              <div class="notice-left">
                <el-tag size="small" type="info" effect="dark">版本</el-tag>
                <span class="notice-text">当前系统版本 v1.0.0，无需更新</span>
              </div>
              <span class="notice-time">2天前</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
// 假设已全局注册图标，如未注册请取消下方注释手动引入
// import { Monitor, Bell } from '@element-plus/icons-vue';

const greeting = ref('');
const currentDate = ref('');
const currentTime = ref('');
const currentWeek = ref('');
let timer: any = null;

// 计算问候语
const setGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 6) greeting.value = '夜深了';
  else if (hour < 9) greeting.value = '早上好';
  else if (hour < 12) greeting.value = '上午好';
  else if (hour < 14) greeting.value = '中午好';
  else if (hour < 18) greeting.value = '下午好';
  else greeting.value = '晚上好';
};

// 设置日期时间
const setDate = () => {
  const now = new Date();
  
  // 日期格式：2023年10月25日
  currentDate.value = now.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // 星期
  const weeks = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  currentWeek.value = weeks[now.getDay()];
  
  // 实时时间：12:30:45
  currentTime.value = now.toLocaleTimeString('zh-CN', { 
    hour12: false,
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
};

onMounted(() => {
  setGreeting();
  setDate();
  // 每秒刷新时间
  timer = setInterval(setDate, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style lang="scss" scoped>
.home {
  padding: 20px;
  background-color: #f5f7f9; // 整体背景微灰，突出卡片
  min-height: calc(100vh - 84px); // 适配常见layout高度

  .welcome-card {
    border: none;
    border-radius: 8px;
    // 温和的渐变背景
    background: linear-gradient(120deg, #ffffff 0%, #eef5fe 100%); 
    
    .welcome-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 10px;
      height: 160px;
      
      .welcome-text {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100%;
        z-index: 2;

        .greeting {
          font-size: 26px;
          color: #2c3e50;
          font-weight: 600;
          margin: 0 0 10px 0;
          letter-spacing: 0.5px;
        }
        
        .weather-text {
          font-size: 14px;
          color: #606266;
          margin-bottom: auto;
        }

        .date-info {
          margin-top: 20px;
          font-size: 14px;
          color: #909399;
          
          span {
            margin-right: 15px;
            &.time {
              color: #409EFF;
              font-weight: bold;
              font-family: monospace; // 等宽字体让时间跳动不抖动
              font-size: 16px;
            }
          }
        }
      }

      .welcome-img {
        width: 300px;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        
        .bg-svg {
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 0 10px rgba(64, 158, 255, 0.1));
        }
      }
    }
  }

  .info-card {
    height: 280px;
    margin-bottom: 20px;
    border-radius: 8px;
    border: none; // 去掉默认边框，使用阴影
    
    // 自定义 Card Header 样式
    :deep(.el-card__header) {
      padding: 15px 20px;
      border-bottom: 1px solid #f0f2f5;
    }

    .card-header {
      display: flex;
      align-items: center;
      font-weight: 600;
      color: #303133;
      font-size: 16px;
      .el-icon {
        margin-right: 8px;
        color: #409EFF;
      }
    }

    .text-content {
      padding: 5px 0;
      
      p {
        color: #606266;
        font-size: 14px;
        line-height: 26px;
        margin-bottom: 15px;
        text-align: justify;
      }
      
      .feature-tags {
        margin-top: 30px;
        .el-tag {
          margin-right: 10px;
          margin-bottom: 10px;
        }
      }

      .notice-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 18px;
        padding-bottom: 12px;
        border-bottom: 1px solid #f5f7fa;
        
        &:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .notice-left {
          display: flex;
          align-items: center;
          flex: 1;
          overflow: hidden;

          .notice-text {
            margin-left: 12px;
            font-size: 14px;
            color: #606266;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }

        .notice-time {
          font-size: 12px;
          color: #909399;
          margin-left: 10px;
          min-width: 60px;
          text-align: right;
        }
      }
    }
  }
}

// 响应式调整
@media (max-width: 768px) {
  .welcome-img {
    display: none !important;
  }
  .welcome-header {
    height: auto !important;
    padding: 10px 0 !important;
  }
}
</style>