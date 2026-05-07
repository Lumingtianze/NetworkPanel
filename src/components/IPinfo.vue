<template>
    <div class="radius card" :style="{ borderRadius: `var(--el-border-radius-round)` }">
        <div style="text-align: center;">
            <transition name="el-fade-in">
                <div v-if="ipInfo.local && ipInfo.local.ip">
                    <el-tooltip class="item" effect="dark" :content="ipInfo.local.ip" placement="top">
                        <div @click.stop="onQuery(ipInfo.local.ip)">
                            <el-tag style="width: 50px;" class="ml-2" type="success">
                                {{ ipInfo.layLocal ? ipInfo.layLocal + "ms" : "-ms" }}
                            </el-tag>
                            <el-text style="cursor: pointer;margin-left: 5px;white-space:nowrap;vertical-align: -1px;"
                                class="font-background">
                                {{ ipInfo.local.displayStr }}
                            </el-text>
                        </div>
                    </el-tooltip>
                </div>
            </transition>
            <transition name="el-fade-in">
                <div v-if="!ipInfo.local" v-loading="true">
                    <el-text style="cursor: pointer;margin-left: 5px;white-space:nowrap;vertical-align: -1px;"
                        class="font-background">正在获取地理位置...</el-text>
                </div>
            </transition> 
        </div>
    </div>

    <el-dialog align-center style="width: 95vw;max-width: 600px;max-height: 85vh;" v-model="queryWindow" title="IP详细信息">
        <el-input v-model="ipInput" style="max-width: 600px" placeholder="请输入IPV4地址" clearable>
            <template #append><el-button type="primary" :icon="Search" circle @click="onQuery(ipInput)"/></template>
        </el-input>
        <table class="ip-table" v-loading="isQuerying" style="width: 100%;">
            <template v-if="ipRet.ip">
                <tr><td style="font-weight: bold; cursor: pointer;" @click="copy(ipRet.ip)">{{ ipRet.ip }}</td></tr>
                <tr><td>{{ ipRet.fullAddr }}</td></tr>
                <tr v-if="ipRet.isp"><td>运营商：{{ ipRet.isp }}</td></tr>
                <tr v-if="ipRet.coords"><td>经纬度：{{ ipRet.coords }}</td></tr>
                <tr v-if="ipRet.detail"><td>街道/商圈：{{ ipRet.detail }}</td></tr>
            </template>
        </table>
    </el-dialog>
</template>

<script lang="ts" setup>
// 1. 彻底移除 VITE_API_URL 和后端排行榜功能，保护隐私并降低非必要开销。
// 2. IP解析采用 ipip.net 获取基础信息，通过自建 CF Functions 代理美团接口获取详细位置。
// 3. 移除 IPv6 校验与解析，专注 IPv4 定向流量场景。
// 4. 保留可见性监听与定时器清理逻辑，防止后台静默消耗。

import { reactive, ref, onUnmounted, watch, onMounted, type Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { toClipboard } from '@soerenmartius/vue3-clipboard'
import { Search } from '@element-plus/icons-vue'

const props = defineProps({
    isVisible: Boolean
})

const queryWindow = ref(false)
const isQuerying = ref(false)
const ipInput = ref("")
const ipRet: Ref<any> = ref({})
const timers: any[] = []

const ipInfo: { local: any, layLocal: any } = reactive({ 
    local: null, 
    layLocal: null 
})

// IPv4 正则
const ipv4Regex = /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;

const copy = (ip: string) => {
    toClipboard(ip)
    ElMessage.success({
        dangerouslyUseHTMLString: true,
        message: `已复制IP：<strong>${ip}</strong>`,
    })
}

/**
 * 聚合 IP 查询逻辑
 * 流程：ipip.net (基础) -> Meituan Proxy (详细)
 */
async function fetchFullIpInfo(ip: string) {
    try {
        // 1. 从缓存读取
        const cacheKey = `cache_v4_${ip}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (new Date().getTime() - parsed.time < 86400000) return parsed.data;
        }

        // 2. 基础信息 (ipip.net)
        const ipipRes = await fetch(`https://myip.ipip.net/json?ip=${ip}`).catch(() => null);
        const ipipData = ipipRes ? await ipipRes.json() : null;

        // 3. 详细信息 (CF Functions 代理美团)
        const mtRes = await fetch(`/api/meituan?ip=${ip}`).catch(() => null);
        const mtData = mtRes ? await mtRes.json() : null;

        const result = {
            ip: ip,
            isp: ipipData?.data?.location?.[4] || mtData?.loc?.fromwhere || "未知运营商",
            fullAddr: mtData?.loc?.rgeo ? 
                `${mtData.loc.rgeo.country}${mtData.loc.rgeo.province}${mtData.loc.rgeo.city}${mtData.loc.rgeo.district}` : 
                (ipipData?.data?.location?.slice(0, 4).join("") || "未知位置"),
            coords: mtData?.loc ? `${mtData.loc.lat}, ${mtData.loc.lng}` : null,
            detail: mtData?.detail ? `${mtData.detail.detail || ''} ${mtData.detail.areaName || ''}` : null,
            displayStr: ""
        };

        // 构建简短展示字符串
        result.displayStr = mtData?.loc?.rgeo ? 
            `${mtData.loc.rgeo.city} ${mtData.loc.rgeo.district} ${result.isp}` : 
            `${result.fullAddr} ${result.isp}`;

        // 存入缓存
        localStorage.setItem(cacheKey, JSON.stringify({ time: new Date().getTime(), data: result }));
        return result;
    } catch (e) {
        console.error("IP解析失败", e);
        return { ip, displayStr: "解析失败", fullAddr: "无法获取位置" };
    }
}

const onQuery = async (ip: string) => {
    if (!ipv4Regex.test(ip)) {
        ElMessage.error("请输入有效的 IPv4 地址");
        return;
    }
    queryWindow.value = true;
    isQuerying.value = true;
    ipRet.value = await fetchFullIpInfo(ip);
    isQuerying.value = false;
}

// 获取本地 IP 详情
async function watchLocalIp() {
    if (!props.isVisible || document.visibilityState !== 'visible') return;
    try {
        // 先获取 IP
        const res = await fetch('https://myip.ipip.net/json');
        const data = await res.json();
        const currentIp = data.data.ip;

        if (!ipInfo.local || ipInfo.local.ip !== currentIp) {
            ipInfo.local = await fetchFullIpInfo(currentIp);
        }
    } catch (error) {
        console.log("获取本地IP失败", error);
    }
}

// 国内延迟检测 (华为节点)
async function getCNLay() {
    if (!props.isVisible || document.visibilityState !== 'visible') return;
    try {
        const start = Date.now();
        await fetch("https://connectivitycheck.platform.hicloud.com/generate_204",
            { method: "HEAD", cache: "no-store", mode: 'no-cors', referrerPolicy: 'no-referrer' });
        ipInfo.layLocal = Date.now() - start;
    } catch (error) {
        ipInfo.layLocal = 0;
    }
}

const stopTasks = () => {
    timers.forEach(timer => clearInterval(timer));
    timers.length = 0;
}

const startTasks = () => {
    if (!props.isVisible || document.visibilityState !== 'visible') return;
    stopTasks();
    
    watchLocalIp();
    timers.push(setInterval(watchLocalIp, 60000));
    
    getCNLay();
    timers.push(setInterval(getCNLay, 15000));
}

const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') startTasks();
    else stopTasks();
}

watch(() => props.isVisible, (val) => {
    if (val) startTasks();
    else stopTasks();
}, { immediate: true });

onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
    stopTasks();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
});
</script>

<style scoped>
.font-background {
    color: #344357;
    font-size: 14px;
}

.card {
    max-width: 800px;
    height: fit-content;
    display: block;
    margin: 0 auto;
    background-color: #ffffff;
    padding: 20px;
}

.ip-table {
    margin: 20px auto;
    border-collapse: collapse;
    text-align: center;
}

.ip-table td {
    padding: 10px;
    border-bottom: 1px solid #f0f0f0;
    color: #606266;
}

@media (prefers-color-scheme: dark) {
    .card { background-color: rgb(18, 18, 18); }
    .font-background { color: rgb(193, 206, 230); }
    .ip-table td { border-bottom: 1px solid #333; color: #ccc; }
}
</style>