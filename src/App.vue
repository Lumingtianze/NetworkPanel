<template>
  <el-container class="app-wrapper">
    <!-- 头部导航栏 -->
    <el-header class="header">
      <div class="header-content">
        <div class="header-left">
          <div class="icon-wrapper">
            <svg t="1702892592527" class="logo-svg" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M568.96 459.242667l144-189.205334A382.208 382.208 0 0 0 512 213.333333c-212.074667 0-384 171.925333-384 384a382.293333 382.293333 0 0 0 93.397333 251.008l-64.554666 55.808A467.584 467.584 0 0 1 42.666667 597.333333C42.666667 338.133333 252.8 128 512 128c93.098667 0 179.861333 27.093333 252.842667 73.856l75.882666-99.690667 67.541334 51.413334-273.28 359.04a149.333333 149.333333 0 1 1-66.048-53.376z m266.453333-69.056l54.357334-71.424A467.242667 467.242667 0 0 1 981.333333 597.333333c0 113.706667-40.64 221.226667-113.237333 305.728l-64.725333-55.616A382.272 382.272 0 0 0 896 597.333333c0-76.288-22.250667-147.370667-60.586667-207.146666zM512 661.333333a64 64 0 1 0 0-128 64 64 0 0 0 0 128z"
                fill="#ffffff"></path>
            </svg>
          </div>
          <span class="title">网络面板</span>
        </div>
        <div class="header-right">
          <el-button class="about-btn" @click="aboutVisible = true" round plain>关于</el-button>
        </div>
      </div>
    </el-header>

    <!-- 主体内容 -->
    <el-main class="main-content">
      <div class="container-inner">
        <!-- 核心流量/测速模块 -->
        <MainUI :isVisible="isVisible" />
        <div class="spacer"></div>
        <!-- IP信息检测模块 -->
        <IPinfoUI :isVisible="isVisible" />
      </div>
    </el-main>

    <!-- 关于对话框 -->
    <el-dialog 
      align-center 
      style="width: 90%; max-width: 480px; border-radius: 12px;" 
      v-model="aboutVisible" 
      title="项目概览"
    >
      <div class="about-detail">
        <h2 style="margin-top: 0; color: #409eff;">网络面板</h2>
        <p>用于网络测速与消耗定向流量的工具。</p>
        <section class="description">
          <p>所有逻辑均在本地处理，不存储、不上传任何用户信息，确保隐私安全。</p>
          <ul class="feature-list">
            <li><strong>本地执行：</strong> 核心逻辑完全由前端驱动，无需后端支撑即可运行。</li>
            <li><strong>资源友好：</strong> 采用不落盘的内存流处理技术，避免不必要的磁盘写入开销。</li>
          </ul>
        </section>
        <div class="tech-stack">
          <el-tag size="small" effect="dark" type="info">Vue 3</el-tag>
          <el-tag size="small" effect="dark" type="info">Element Plus</el-tag>
          <el-tag size="small" effect="dark" type="info">ECharts</el-tag>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="aboutVisible = false" style="width: 100px">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </el-container>
</template>

<script lang="ts" setup>

import MainUI from "./components/Main.vue"
import IPinfoUI from "./components/IPinfo.vue"
import { ref, onMounted, onUnmounted } from 'vue'

const isVisible = ref(true)
const aboutVisible = ref(false)

const handleVisibilityChange = () => {
  isVisible.value = document.visibilityState === 'visible'
}

onMounted(() => {
  document.addEventListener("visibilitychange", handleVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener("visibilitychange", handleVisibilityChange)
})
</script>

<style scoped>
/* 全局背景色 */
.app-wrapper {
  min-height: 100vh;
  background-color: #f5f7fa;
  transition: background-color 0.3s;
}

/* 头部样式：增加了毛玻璃效果 */
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 64px;
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.title {
  color: #2c3e50;
  font-size: 1.25rem;
  font-weight: 700;
  margin-left: 12px;
  letter-spacing: -0.5px;
}

.icon-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #5668EE 0%, #3e4ed0 100%);
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(86, 104, 238, 0.3);
}

.logo-svg {
  width: 24px;
  height: 24px;
}

.about-btn {
  font-weight: 500;
  transition: all 0.3s;
}

/* 主体内容布局 */
.main-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.container-inner {
  width: 100%;
  max-width: 900px; /* 限制大屏展示宽度 */
}

.spacer {
  height: 24px;
}

/* 对话框内样式 */
.about-detail {
  line-height: 1.6;
  color: #606266;
}

.description {
  margin: 15px 0;
  font-size: 14px;
}

.feature-list {
  padding-left: 18px;
  margin-top: 10px;
}

.feature-list li {
  margin-bottom: 8px;
}

.tech-stack {
  margin-top: 20px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .header-content {
    padding: 0 15px;
  }
  .title {
    font-size: 1.1rem;
  }
  .main-content {
    padding: 15px 10px;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .app-wrapper {
    background-color: #0f0f0f;
  }
  .header {
    background-color: rgba(18, 18, 18, 0.9);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  .title {
    color: #e5eaf3;
  }
  .about-detail {
    color: #a8abb2;
  }
}
</style>