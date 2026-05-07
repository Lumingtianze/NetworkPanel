export async function onRequest(context) {
    const { searchParams } = new URL(context.request.url);
    const ip = searchParams.get('ip');

    if (!ip) {
        return new Response(JSON.stringify({ error: "Missing IP" }), { status: 400 });
    }

    const headers = {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MeituanGroup/11.9.2",
        "Referer": "https://i.meituan.com/"
    };

    try {
        // 第一步：获取经纬度和初步区域信息
        const locRes = await fetch(`https://apimobile.meituan.com/locate/v2/ip/loc?rgeo=true&ip=${ip}`, { headers });
        const locData = await locRes.json();

        if (locData.data && locData.data.lat && locData.data.lng) {
            const { lat, lng } = locData.data;
            // 第二步：通过经纬度获取详细街道信息
            const detailRes = await fetch(`https://apimobile.meituan.com/group/v1/city/latlng/${lat},${lng}?tag=0`, { headers });
            const detailData = await detailRes.json();

            return new Response(JSON.stringify({
                ip: ip,
                loc: locData.data,
                detail: detailData.data
            }), {
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
        }

        return new Response(JSON.stringify({ ip, loc: locData.data }), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}