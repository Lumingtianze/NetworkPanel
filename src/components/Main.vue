<template>
  <div class="radius card main-glass-wrapper" :style="{ borderRadius: 'var(--el-border-radius-round)' }">
    <div class="main-container">
      
      <!-- 配置区：毛玻璃 -->
      <div class="glass-bar setting-section">
        <div class="setting-item">
          <div class="label-row">
            <span class="font-background">测速地址</span>
            <div class="action-btns">
              <el-button type="primary" :icon="CopyDocument" class="large-icon-btn" link @click="copyUrl" />
              <el-button type="primary" :icon="Edit" class="large-icon-btn" link @click="EditTableVisible = true" />
            </div>
          </div>
          <el-select style="width: 100%;" v-model="runUrl" placeholder="选择测速节点">
            <el-option-group v-for="group in nodes" :key="group.label" :label="group.label">
              <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
            </el-option-group>
            <template #prefix><el-icon class="select-icon"><Link /></el-icon></template>
          </el-select>
        </div>

        <div class="setting-item">
          <span class="font-background">线程并发：{{ threadNum }}</span>
          <el-slider :show-tooltip="false" :min="1" :max='64' v-model="threadNum" />
        </div>

        <div class="switch-grid">
          <el-switch v-model="runBackground" active-text="后台运行" />
          <el-switch v-model="autoStart" active-text="自动开始" />
        </div>
      </div>

      <!-- 数据展示晶体 -->
      <div class="ItemContainer">
        <div class="showItem glass-card">
          <div class="item-header">
            <span class="card-title">累计流量</span>
            <el-button type="primary" class="card-action-icon" :icon="Edit" link @click="EditMaxVisible = true" />
          </div>
          <div class="data-content">
            <span class="font-data">{{ state.show.allUsed }}</span>
            <span class="data-limit" v-if="state.maxUse">/ {{ formatter(state.maxUse, 0, [0,0,0,0,0,0]) }}</span>
          </div>
        </div>

        <div class="showItem glass-card active-border">
          <div class="item-header">
            <span class="card-title">{{ isRunning ? '实时速率' : '平均速率' }}</span>
            <el-popover placement="top" title="用量预测" :width="160" trigger="click">
              <template #reference><el-button type="primary" class="card-action-icon" :icon="Calendar" link /></template>
              <div class="predict-content">
                <p>每分钟: {{ state.predict.min }}</p>
                <p>每小时: {{ state.predict.hour }}</p>
                <p>每天: {{ state.predict.day }}</p>
                <p>每月: {{ state.predict.mon }}</p>
              </div>
            </el-popover>
          </div>
          <div class="data-content">
            <span class="font-data speed-accent">{{ state.show.speed }}</span>
          </div>
        </div>

        <div class="showItem glass-card">
          <div class="item-header">
            <span class="card-title">带宽占用</span>
            <el-button type="primary" class="card-action-icon" :icon="Edit" link @click="EditSpeedVisible = true" />
          </div>
          <div class="data-content">
            <span class="font-data">{{ state.show.speedBit }}</span>
            <span class="data-limit" v-if="state.maxSpeed">/ {{ formatter(state.maxSpeed, 2, [0,0,0,2,2,2]) }}</span>
          </div>
        </div>
      </div>

      <!-- 核心控制按钮 -->
      <div class="control-center">
        <button class="action-circle-btn" :class="{ 'is-active': isRunning || state.isChecking }" @click="handleActionClick">
          <transition name="icon-zoom" mode="out-in">
            <el-icon v-if="state.isChecking" class="is-loading btn-icon"><Loading /></el-icon>
            <svg v-else-if="isRunning" class="btn-icon-svg" viewBox="0 0 1024 1024">
              <path d="M352 256h128v512h-128zM544 256h128v512h-128z" fill="currentColor"></path>
            </svg>
            <svg v-else class="btn-icon-svg" viewBox="0 0 1024 1024">
              <path d="M341.333 213.333v597.334L810.667 512z" fill="currentColor"></path>
            </svg>
          </transition>
        </button>
      </div>

      <!-- 工具栏 -->
      <div class="toolbar">
        <el-button type="primary" :icon="FullScreen" class="toolbar-icon-btn" link @click="isFullScreen = true" />
        <el-button type="primary" :icon="chartShow ? Hide : TrendCharts" class="toolbar-icon-btn" link @click="chartShow = !chartShow" />
      </div>
      
      <!-- ECharts 6 适配图表 -->
      <transition name="el-zoom-in-top">
        <div v-show="chartShow" ref="chartContainer" class="chart-container glass-card"></div>
      </transition>
    </div>
  </div>

  <!-- Dialogs -->
  <el-dialog v-model="EditTableVisible" title="管理测速地址" width="95%" style="max-width: 600px">
    <el-table :data="customNodes" style="width: 100%" max-height="300">
      <el-table-column prop="label" label="名称" width="120" />
      <el-table-column prop="value" label="URL" show-overflow-tooltip />
      <el-table-column fixed="right" width="50">
        <template #default="scope">
          <el-button type="danger" link :icon="Delete" @click.prevent="customNodes.splice(scope.$index, 1)" />
        </template>
      </el-table-column>
    </el-table>
    <template #footer><el-button type="primary" block @click="addTableVisible = true">新增地址</el-button></template>
  </el-dialog>

  <el-dialog v-model="addTableVisible" title="新增测速资源" width="90%" style="max-width: 450px">
    <el-form label-position="top">
      <el-form-item label="资源名称"><el-input v-model="addForm.label" placeholder="如：定向流量节点" /></el-form-item>
      <el-form-item label="测速 URL"><el-input v-model="addForm.value" placeholder="支持直接粘贴包含链接的文本" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="addTableVisible = false">取消</el-button>
      <el-button type="primary" :disabled="!addForm.label || !addForm.value" @click="addNode">确认添加</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="EditMaxVisible" title="流量上限设置" width="300px">
    <el-input type="number" v-model="maxUseInput.num">
      <template #append>
        <el-select v-model="maxUseInput.type" style="width: 70px"><el-option label="MB" value="MB" /><el-option label="GB" value="GB" /></el-select>
      </template>
    </el-input>
    <template #footer><el-button type="primary" block @click="editMaxUse">确定</el-button></template>
  </el-dialog>

  <el-dialog v-model="EditSpeedVisible" title="带宽限速 (Mbps)" width="300px">
    <el-input type="number" v-model="maxSpeedInput.num" placeholder="空则不限制" />
    <template #footer><el-button type="primary" block @click="editSpeedUse">确认</el-button></template>
  </el-dialog>

  <audio v-if="runBackground" ref="audioDom" loop style="display:none">
    <source :src="isIOS ? iosSound : andoridSound" type="audio/mpeg">
  </audio>

  <FullScreenUI v-model="isFullScreen" :isRunning="isRunning" :state="state" />
</template>

<script lang="ts" setup>
import iosSound from "../assets/ios.mp3";
import andoridSound from "../assets/android.mp3";

import type { EChartsType, ComposeOption } from "echarts/core";
import type { LineSeriesOption } from "echarts/charts";
import type { GridComponentOption, TooltipComponentOption } from "echarts/components";

type ECOption = ComposeOption<LineSeriesOption | GridComponentOption | TooltipComponentOption>;

const props = defineProps({ isVisible: Boolean });

import { ElMessage, ElMessageBox } from 'element-plus'
import nodesJson from "../assets/nodes.json"
import { Link, Edit, Delete, Loading, CopyDocument, TrendCharts, Hide, Calendar, FullScreen } from '@element-plus/icons-vue'
import { ref, watch, type Ref, reactive, onMounted, onUnmounted } from 'vue'
import { toClipboard } from '@soerenmartius/vue3-clipboard'
import FullScreenUI from './FullScreen.vue'

const fetchMode = ref<'cors' | 'no-cors'>('cors');
const isRunning = ref(false);
const customNodes = reactive(localStorage.customNodes ? JSON.parse(localStorage.customNodes) : [])
const OnlineNodes: any[] = []
for(let groupName in nodesJson) {
  const group=nodesJson[groupName as keyof typeof nodesJson]
  const temp: any ={"label":groupName,options:[]}
  for(let node in group) {
    temp.options.push({"value":group[node as keyof typeof group],"label":node})
  }
  OnlineNodes.push(temp)
}
const nodes: Ref<any[]> = ref(OnlineNodes)
if (customNodes.length) {
  nodes.value = [{ "label": "自定义", "options": customNodes}].concat(OnlineNodes)
}

const state = reactive({
  show: { allUsed: '-', speed: '-', speedBit: '-' },
  predict: { min: '-', hour: '-', day: '-', mon: '-' },
  isChecking: false,
  bytesUsed: 0,
  recordUse: 0,
  recordTime: 0,
  startUse: 0,
  startTime: 0,
  maxUse: localStorage.maxUse ? Number(localStorage.maxUse) : 0,
  maxSpeed: localStorage.maxSpeed ? Number(localStorage.maxSpeed) : 0,
})

const isFullScreen = ref(false);
const chartShow = ref(localStorage.chartShow === 'true');
const threadNum = ref(Number(localStorage.threadNum) || 8);
const runBackground = ref(localStorage.runBackground === 'true');
const autoStart = ref(localStorage.autoStart === 'true');
const runUrl = ref(localStorage.url || nodes.value[0].options[0].value);

let tasks: any[] = [];
const audioDom = ref<HTMLAudioElement | null>(null);

const handleActionClick = () => {
  if (isRunning.value) isRunning.value = false;
  else if (!state.isChecking) tryStart();
}

const tryStart = async () => {
  state.isChecking = true;
  fetchMode.value = 'cors'; 
  const urlStatus = await checkUrl(runUrl.value);
  state.isChecking = false;
  if (!urlStatus.status) {
    if (urlStatus.isCorsError) {
      ElMessageBox.confirm('检测到跨域拦截，是否进入“盲跑”模式？', '提示', {
        confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
      }).then(() => { fetchMode.value = 'no-cors'; isRunning.value = true; }).catch(() => {});
    } else ElMessage.error(urlStatus.info);
  } else isRunning.value = true;
}

const checkUrl = async (url: string) => {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(url, { cache: "no-store", mode: 'cors', signal: controller.signal });
    clearTimeout(id);
    return { status: response.ok, info: '', isCorsError: false };
  } catch (err: any) {
    return { status: false, info: err.message, isCorsError: true };
  }
}

// 如果不允许后台运行且面板隐藏，则停止。
watch(() => props.isVisible, (visible) => {
  if (!visible && !runBackground.value && isRunning.value) {
    isRunning.value = false;
    ElMessage.info('已因切换到后台而停止测速');
  }
});

watch(isRunning, (active) => {
  if (active) {
    state.startUse = state.bytesUsed;
    state.startTime = Date.now() / 1000;
    state.recordUse = state.bytesUsed;
    state.recordTime = Date.now() / 1000;
    // 初始化指定数量的线程
    for (let i = 0; i < threadNum.value; i++) startThread(i);
    tasks.push(setInterval(frameEvent, 200), setInterval(secEvent, 1000));
    if (runBackground.value) audioDom.value?.play().catch(()=>{});
  } else {
    tasks.forEach(clearInterval);
    tasks = [];
    audioDom.value?.pause();
    setSpeed(0);
    setTitle();
  }
});

async function startThread(index: number) {
  // 如果当前线程索引超过了设定的最大线程数，说明是多余线程，直接退出
  if (!isRunning.value || index >= threadNum.value) return;
  
  try {
    const response = await fetch(runUrl.value, { cache: "no-store", mode: fetchMode.value });
    if (fetchMode.value === 'no-cors') {
        await response.blob();
        if (isRunning.value) startThread(index);
        return;
    }
    const reader = response.body?.getReader();
    if (!reader) return;
    while (isRunning.value) {
      if (state.maxSpeed) await speedCtr();
      const { value, done } = await reader.read();
      if (done) break;
      state.bytesUsed += value ? value.length : 0;
      // 在读取流的过程中如果线程数被调小，则中断该线程
      if (index >= threadNum.value) {
          reader.cancel();
          return;
      }
    }
    reader.cancel();
    if (isRunning.value) startThread(index);
  } catch (err) {
    if (isRunning.value) setTimeout(() => startThread(index), 1000);
  }
}

const setSpeed = (speed: number) => {
  state.show.speed = speed > 0 ? formatter(speed, 1, [0,0,1,2,2,2]) : '-';
  state.show.speedBit = speed > 0 ? formatter(speed * 8, 2, [0,0,0,2,2,2]) : '-';
  state.predict.min = formatter(speed * 60, 0, [0,0,0,1,1,1]);
  state.predict.hour = formatter(speed * 3600, 0, [0,0,0,1,1,1]);
  state.predict.day = formatter(speed * 86400, 0, [0,0,0,1,1,1]);
  state.predict.mon = formatter(speed * 86400 * 30, 0, [0,0,0,1,1,1]);
}

const formatter = (num: number, desIndex: number, flo: number[]) => {
  const units = [['B','KB','MB','GB','TB'],['B/s','KB/s','MB/s','GB/s','TB/s'],['Bps','Kbps','Mbps','Gbps','Tbps']];
  let idx = 0;
  while (num >= 1024 && idx < units[desIndex].length - 1) { num /= 1024; idx++; }
  return num.toFixed(flo[idx]) + units[desIndex][idx];
}

const speedCtr = () => {
    // 简单的令牌桶思想，如果当前秒内消耗超过配额则延迟
    if (state.bytesUsed - state.recordUse > state.maxSpeed / 8) {
        return new Promise(r => setTimeout(r, 200));
    }
}

const frameEvent = () => {
  state.show.allUsed = formatter(state.bytesUsed, 0, [0,0,1,2,2,2]);
  if (state.maxUse && state.bytesUsed >= state.maxUse) isRunning.value = false;
}

const secEvent = () => {
  const speed = (state.bytesUsed - state.recordUse) / (Date.now() / 1000 - state.recordTime);
  updateChart(speed);
  setSpeed(speed);
  if (!props.isVisible && runBackground.value) setTitle(speed);
  state.recordUse = state.bytesUsed;
  state.recordTime = Date.now() / 1000;
}

const setTitle = (speed = 0) => {
  document.title = isRunning.value ? `${formatter(speed, 1, [0,0,0,0,0])} - 网络面板` : '网络面板';
}

// 监听线程数变化，如果在运行中增加线程，则立即补发
watch(threadNum, (newVal, oldVal) => {
    localStorage.threadNum = newVal;
    if (isRunning.value && newVal > oldVal) {
        for (let i = oldVal; i < newVal; i++) startThread(i);
    }
});
watch(runBackground, (v) => localStorage.runBackground = v);
watch(autoStart, (v) => localStorage.autoStart = v);
watch(runUrl, (v) => localStorage.url = v);
watch(chartShow, (v) => { localStorage.chartShow = v; if(v) setTimeout(()=>myChart?.resize(), 150)});

// 使用 urlParser 提取合法 URL 防止用户粘贴杂乱文本
const urlParser = (url: string) => url.match(/https?:\/\/[^\s]+/)?.[0] || '';
const copyUrl = () => { toClipboard(runUrl.value); ElMessage.success('已复制链接'); }

const addNode = () => {
  const pureUrl = urlParser(addForm.value.value);
  if (!pureUrl) {
      ElMessage.error('无法从输入中提取有效的 URL');
      return;
  }
  customNodes.push({ label: addForm.value.label, value: pureUrl });
  localStorage.customNodes = JSON.stringify(customNodes);
  addForm.value = { label: '', value: '', checking: false };
  addTableVisible.value = false;
}

const editMaxUse = () => {
  const units:any = { MB: 1024**2, GB: 1024**3 };
  state.maxUse = (maxUseInput.value.num || 0) * units[maxUseInput.value.type];
  localStorage.maxUse = state.maxUse;
  EditMaxVisible.value = false;
}

const editSpeedUse = () => {
  state.maxSpeed = (maxSpeedInput.value.num || 0) * 1024 * 1024;
  localStorage.maxSpeed = state.maxSpeed;
  EditSpeedVisible.value = false;
}

const chartContainer = ref(null);
let myChart: EChartsType;
let showArray: any[] = [];
const updateChart = (speed: number) => {
  showArray.push([Date.now(), speed]);
  if (showArray.length > 60) showArray.shift();
  myChart?.setOption({ series: [{ data: showArray }] });
}

onMounted(async () => {
  // ECharts 6 按需加载核心组件，极大程度缩减包体积
  const [core, { LineChart }, { GridComponent }, { CanvasRenderer }] = await Promise.all([
    import('echarts/core'),
    import('echarts/charts'),
    import('echarts/components'),
    import('echarts/renderers')
  ]);

  // 仅注册本项目所需的 LineChart 和 GridComponent
  core.use([LineChart, GridComponent, CanvasRenderer]);

  myChart = core.init(chartContainer.value as unknown as HTMLElement);
  
  const option: ECOption = {
    grid: { left: '3%', right: '5%', top: 20, bottom: 30, containLabel: true },
    xAxis: { 
        type: 'time', 
        splitLine: { show: false },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: 'rgba(128, 128, 128, 0.2)' } },
        axisLabel: { 
            show: true,
            fontSize: 10,
            color: '#909399',
            showMinLabel: true,
            showMaxLabel: true,
            hideOverlap: true,
            padding: [10, 0, 0, 0],
            // 使用 core 模块导出的 format 工具
            formatter: (value: any) => core.format.formatTime('hh:mm:ss', value)
        },
        splitNumber: 2
    },
    yAxis: { 
        type: 'value', 
        splitLine: { lineStyle: { type: 'dashed', color: 'rgba(128, 128, 128, 0.1)' } },
        axisLabel: { 
            formatter: (v:any) => formatter(v, 1, [0,0,0,0,0]),
            fontSize: 11,
            color: '#909399'
        }
    },
    series: [{ 
        type: 'line', 
        smooth: 0.4,
        symbol: 'none',
        lineStyle: { width: 3, color: '#409EFF' },
        areaStyle: { 
            // 使用 core 模块导出的 graphic 工具创建渐变
            color: new core.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(64, 158, 255, 0.4)' },
                { offset: 1, color: 'rgba(64, 158, 255, 0)' }
            ])
        },
        data: [] 
    }]
  };

  myChart.setOption(option);
  if (autoStart.value) tryStart();
  window.addEventListener('resize', () => myChart?.resize());
});

// 组件销毁时彻底清理
onUnmounted(() => {
    isRunning.value = false;
    tasks.forEach(clearInterval);
    myChart?.dispose();
    window.removeEventListener('resize', () => myChart?.resize());
});

const EditTableVisible = ref(false), addTableVisible = ref(false), EditMaxVisible = ref(false), EditSpeedVisible = ref(false);
const addForm = ref({ label: '', value: '', checking: false });
const maxUseInput = ref({ num: null as number|null, type: 'GB' as any });
const maxSpeedInput = ref({ num: null as number|null, type: 'Mbps' as any });
const isIOS = /iPhone|iPad|Macintosh/i.test(navigator.userAgent);
</script>

<style scoped>
.main-glass-wrapper { background: transparent !important; box-shadow: none !important; }
.main-container { display: flex; flex-direction: column; gap: 20px; }
.glass-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.4); }
.glass-bar { background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(10px); padding: 15px; border-radius: 12px; display: flex; flex-direction: column; gap: 12px; }
.large-icon-btn { font-size: 20px; }
.select-icon { font-size: 18px; }
.setting-item { display: flex; flex-direction: column; gap: 6px; }
.label-row { display: flex; justify-content: space-between; align-items: center; }
.switch-grid { display: flex; justify-content: space-between; }
.ItemContainer { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
.showItem { border-radius: 16px; padding: 16px; display: flex; flex-direction: column; justify-content: center; min-height: 100px; }
.showItem.active-border { border-color: rgba(64, 158, 255, 0.3); }
.item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.card-title { font-size: 14px; color: #344357; font-weight: 500; }
.card-action-icon { font-size: 20px !important; }
.data-content { display: flex; flex-direction: column; align-items: flex-start; }
.font-data { font-size: 22px; font-weight: 900; color: #1a1a1a; letter-spacing: -0.5px; }
.speed-accent { color: #409eff; }
.data-limit { color: #7f8c8d; font-size: 11px; margin-top: 2px; }
.control-center { display: flex; justify-content: center; padding: 10px 0; }
.action-circle-btn { width: 96px; height: 96px; border-radius: 50%; border: none; background: linear-gradient(135deg, #485bed, #6576ff); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 10px 20px rgba(72, 91, 237, 0.2); transition: all 0.3s; }
.action-circle-btn.is-active { background: linear-gradient(135deg, #f56c6c, #ff7875); }
.btn-icon-svg { width: 36px; height: 36px; fill: currentColor; }
.btn-icon { font-size: 36px; }
.toolbar { display: flex; justify-content: space-between; padding: 0 5px; }
.toolbar-icon-btn { font-size: 24px; }
.chart-container { width: 100%; height: 210px; border-radius: 16px; overflow: hidden; margin-top: 5px;}
.icon-zoom-enter-active, .icon-zoom-leave-active { transition: all 0.2s ease; }
.icon-zoom-enter-from, .icon-zoom-leave-to { opacity: 0; transform: scale(0.5); }

@media screen and (max-width: 768px) {
  .ItemContainer { grid-template-columns: 1fr; }
  .showItem { min-height: 85px; }
  .toolbar-icon-btn { font-size: 22px; }
}

@media (prefers-color-scheme: dark) {
  .glass-card { background: rgba(30, 30, 30, 0.7); border-color: rgba(255, 255, 255, 0.08); }
  .glass-bar { background: rgba(20, 20, 20, 0.6); }
  .font-data { color: #eee; }
  .card-title { color: #98a7ca; }
}
</style>
