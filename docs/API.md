# NeverLand Farm Admin API 文档

## 基础信息

- 基础 URL: `http://localhost:3000` (开发环境) 或你的部署域名
- Farm ID 通过环境变量 `FARM_ID` 配置，API 中无需传递

---

## 一键操作 API

### 启动一键操作

自动执行完整的每日农场循环：收集动物产品 → 开垦土地 → 种植当季作物 → 浇水 → 收获 → 出售 → 进入下一天。

```
POST /api/proxy/autorun
Content-Type: application/json
```

**请求体（可选）：**

```json
{
  "cooldown": 1500
}
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `cooldown` | number | 1500 | 每个操作之间的等待毫秒数，最小 800ms |

**响应：** Server-Sent Events (SSE) 流

```
Content-Type: text/event-stream
```

每个事件格式为 `data: {json}\n\n`，包含以下字段：

| 字段 | 说明 |
|------|------|
| `step` | 步骤编号（`init`/`1`-`7`/`done`/`error`） |
| `action` | 操作类型 |
| `status` | `running` / `success` / `error` / `skip` |
| `message` | 中文描述信息 |
| `detail` | 附加数据（部分事件包含） |

**步骤流程：**

| Step | Action | 说明 |
|------|--------|------|
| init | status | 获取农场状态 |
| 1 | collect_products | 收集动物产品 |
| 2 | till | 开垦空地 |
| 3 | plant | 种植当季作物（春: parsnip, 夏: blueberry, 秋: cranberry, 冬: winter_seeds） |
| 4 | water | 浇水全部作物（雨天/暴风雨自动跳过） |
| 5 | harvest | 收获成熟作物 |
| 6 | sell | 出售背包中价值最高的可售物品 |
| 7 | next-day | 进入下一天 |
| done | summary | 最终汇总，包含金币变化 |

**示例 SSE 事件：**

```
data: {"step":"init","action":"status","status":"success","message":"第 5 天 | spring | sunny | 金币: 12500 | 体力: 85/100 | 配额: 3/10"}

data: {"step":1,"action":"collect_products","status":"success","message":"动物产品已收集"}

data: {"step":6,"action":"sell","status":"success","message":"出售 Blueberry x15 (单价 120G)"}

data: {"step":"done","action":"summary","status":"success","message":"完成！共执行 7 个操作，0 个错误。金币变化: 12500 → 14300 (+1800)","detail":{"initialGold":12500,"finalGold":14300,"goldChange":1800,"actionsCount":7,"errorsCount":0}}
```

### 中止一键操作

```
DELETE /api/proxy/autorun
```

发送中止信号，当前正在执行的步骤完成后停止后续步骤。

**响应：**

```json
{ "message": "中止信号已发送" }
```

---

## 调用示例

### cURL - 启动一键操作

```bash
curl -N http://localhost:3000/api/proxy/autorun \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"cooldown": 1500}'
```

`-N` 参数禁用缓冲，实时输出 SSE 事件。

### cURL - 中止

```bash
curl http://localhost:3000/api/proxy/autorun -X DELETE
```

### JavaScript (fetch)

```javascript
const res = await fetch('/api/proxy/autorun', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ cooldown: 1500 }),
});

const reader = res.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = decoder.decode(value);
  const lines = text.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const event = JSON.parse(line.slice(6));
      console.log(`[${event.step}] ${event.action}: ${event.message}`);

      if (event.step === 'done') {
        console.log('金币变化:', event.detail.goldChange);
      }
    }
  }
}
```

### Python (requests)

```python
import requests
import json

response = requests.post(
    'http://localhost:3000/api/proxy/autorun',
    json={'cooldown': 1500},
    stream=True,
)

for line in response.iter_lines():
    if line:
        line = line.decode('utf-8')
        if line.startswith('data: '):
            event = json.loads(line[6:])
            print(f"[{event['step']}] {event['action']}: {event['message']}")

            if event['step'] == 'done':
                print(f"金币变化: {event['detail']['goldChange']}")
```

### Python (httpx - 异步)

```python
import httpx
import json

async with httpx.AsyncClient() as client:
    async with client.stream('POST', 'http://localhost:3000/api/proxy/autorun', json={'cooldown': 1500}) as response:
        async for line in response.aiter_lines():
            if line.startswith('data: '):
                event = json.loads(line[6:])
                print(f"[{event['step']}] {event['message']}")
```

### Shell 脚本定时调用

```bash
#!/bin/bash
# farm-autorun.sh - 每日自动运行农场操作

LOG_FILE="farm-$(date +%Y%m%d).log"

echo "=== $(date) ===" >> "$LOG_FILE"

curl -sN http://localhost:3000/api/proxy/autorun \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"cooldown": 1200}' | \
  while IFS= read -r line; do
    if [[ "$line" == data:* ]]; then
      json="${line#data: }"
      echo "$json" | jq -r '"[\(.step)] \(.action): \(.message)"' >> "$LOG_FILE"
    fi
  done

echo "" >> "$LOG_FILE"
```

---

## 其他 API

### 获取农场状态

```
GET /api/proxy/status
```

返回当前农场的完整状态（金币、等级、作物、动物等）。

### 执行单个操作

```
POST /api/proxy/action
Content-Type: application/json

{
  "action_type": "harvest"
}
```

支持的 `action_type`：`till`、`plant`、`water`、`harvest`、`sell`、`buy`、`buy_animal`、`buy_building`、`collect_products`、`fish`

### 进入下一天

```
POST /api/proxy/next-day
```

### 获取操作日志

```
GET /api/proxy/logs?page=1&limit=20&action_type=harvest
```

### 获取统计快照

```
GET /api/proxy/snapshots?days=30
```

返回指定天数内的农场快照数据（金币、等级、作物数等随时间变化）。

### 获取排行榜

```
GET /api/proxy/leaderboard
```

### 获取市场行情

```
GET /api/proxy/prices
```

### 获取游戏配置

```
GET /api/proxy/config
```

---

## 注意事项

1. **FARM_ID** 通过环境变量配置，所有 API 共用同一个 farm_id
2. **冷却时间**：游戏操作有内置冷却，`cooldown` 参数控制客户端等待间隔，建议不低于 1200ms
3. **SSE 流**：一键操作的响应是流式的，不会一次性返回所有数据
4. **最佳实践**：每次一键操作完成后会自动保存农场快照到数据库，用于统计分析
