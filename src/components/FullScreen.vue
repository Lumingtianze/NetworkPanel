<template>
    <div ref="elment" v-if="modelValue" class="fullscreen-wrapper"
        @click="exitFullscreen"
        @wheel.prevent
        @touchmove.prevent
        >
        <!-- 动态背景装饰：增加深度感 -->
        <div class="bg-glow"></div>

        <div class="fullscreen-content">
            <!-- 顶部标识 -->
            <div class="header-info">
                <span class="brand">NETWORK PANEL</span>
                <div class="status-dot" :class="{ 'is-running': isRunning }"></div>
            </div>

            <!-- 中心主要区域 -->
            <div class="main-display">
                <div class="time-section">
                    <div class="time-big">{{ time }}</div>
                    <div class="date-row">{{ date }}</div>
                </div>

                <div class="speed-section">
                    <div class="speed-value">{{ state.show.speed.replace(/[a-zA-Z\/]/g, '') }}</div>
                    <div class="speed-unit">{{ state.show.speed.replace(/[0-9.]/g, '') }}</div>
                    <div class="speed-label">{{ isRunning ? 'REALTIME RATE' : 'AVERAGE RATE' }}</div>
                </div>
            </div>

            <!-- 底部详细数据：横向网格 -->
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="label">累计流量 TOTAL USED</span>
                    <span class="val">{{ state.show.allUsed }}</span>
                </div>
                <div class="stat-card">
                    <span class="label">实时带宽 BANDWIDTH</span>
                    <span class="val">{{ state.show.speedBit }}</span>
                </div>
            </div>

            <div class="exit-hint">点击任意位置退出全屏</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watchEffect, onUnmounted } from 'vue'
import NoSleep from 'nosleep.js';

const props = defineProps({
  state: { type: Object, required: true },
  isRunning: { type: Boolean, required: true },
  modelValue: { type: Boolean, required: true },
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const elment = ref<HTMLElement | null>(null)
const time = ref("")
const date = ref("")
const dayToWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

const exitFullscreen = () => {
    if (document.exitFullscreen) document.exitFullscreen()
    emit('update:modelValue', false)
}

// 监听系统全屏状态变化
document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
        emit('update:modelValue', false)
    }
})

const isMiuiBrowser = /MiuiBrowser/i.test(navigator.userAgent)
let noSleep = isMiuiBrowser ? null : new NoSleep();

watchEffect(() => {
    if (props.modelValue) {
        noSleep?.enable();
        const el = elment.value;
        if (el) {
            if (el.requestFullscreen) el.requestFullscreen();
            //@ts-ignore
            else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
            //@ts-ignore
            else if (el.msRequestFullscreen) el.msRequestFullscreen();
        }
    } else {
        noSleep?.disable();
    }
})

let timer: number;
onMounted(() => {
    timer = window.setInterval(() => {
        const now = new Date()
        time.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        date.value = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${dayToWeek[now.getDay()]}`
    }, 1000)
})

onUnmounted(() => {
    clearInterval(timer)
})
</script>

<style scoped>
/* 引入字体 */
@font-face {
    font-family: 'DingTalk';
    src: url('../assets/DingTalk-simple.ttf') format('truetype');
}

.fullscreen-wrapper {
    position: fixed;
    inset: 0;
    background-color: #050508;
    color: #ffffff;
    z-index: 9999999;
    font-family: 'DingTalk', sans-serif;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
}

/* 动态发光背景：减少 OLED 纯黑疲劳 */
.bg-glow {
    position: absolute;
    width: 100vmax;
    height: 100vmax;
    background: radial-gradient(circle at center, #1a1a2e 0%, #050508 70%);
    opacity: 0.6;
}

.fullscreen-content {
    position: relative;
    width: 100%;
    max-width: 1200px;
    height: 80vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 40px;
    box-sizing: border-box;
    /* 防烧屏动画：平滑悬浮漂移 */
    animation: drift 20s infinite alternate ease-in-out;
}

/* 顶部 */
.header-info {
    display: flex;
    align-items: center;
    gap: 12px;
    opacity: 0.4;
}

.brand {
    font-size: 14px;
    letter-spacing: 4px;
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ff4d4f;
    box-shadow: 0 0 10px #ff4d4f;
}

.status-dot.is-running {
    background: #52c41a;
    box-shadow: 0 0 10px #52c41a;
}

/* 中间主区域 */
.main-display {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
}

.time-big {
    font-size: 120px;
    line-height: 1;
    font-weight: bold;
}

.date-row {
    font-size: 24px;
    opacity: 0.6;
    margin-top: 10px;
}

.speed-section {
    text-align: right;
}

.speed-value {
    font-size: 160px;
    line-height: 0.9;
    font-weight: 900;
    color: #409eff;
    text-shadow: 0 0 30px rgba(64, 158, 255, 0.4);
}

.speed-unit {
    font-size: 40px;
    font-weight: bold;
    color: #409eff;
    opacity: 0.8;
}

.speed-label {
    font-size: 14px;
    opacity: 0.4;
    margin-top: 10px;
    letter-spacing: 2px;
}

/* 底部数据网格 */
.stats-grid {
    display: flex;
    gap: 40px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 30px;
}

.stat-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.stat-card .label {
    font-size: 12px;
    opacity: 0.4;
    letter-spacing: 1px;
}

.stat-card .val {
    font-size: 32px;
    font-weight: bold;
}

.exit-hint {
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 12px;
    opacity: 0.15;
}

/* 动画：相比原有的 standby 更加平滑 */
@keyframes drift {
    0% { transform: translate(-2%, -2%); }
    50% { transform: translate(2%, 1%); }
    100% { transform: translate(-1%, 2%); }
}

/* 手机端适配：改为垂直布局 */
@media screen and (max-width: 768px) {
    .fullscreen-content {
        height: 90vh;
        padding: 20px;
    }
    .main-display {
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 40px;
    }
    .time-big { font-size: 80px; }
    .speed-value { font-size: 100px; }
    .speed-section { text-align: center; }
    .stats-grid {
        flex-direction: column;
        gap: 20px;
        align-items: center;
    }
    .stat-card { align-items: center; }
}
</style>