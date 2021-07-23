export default function transferData(data) {
  const res = [];
  data.forEach((item, i) => {
    // item 依旧是数组
    const pre = (i > 1 && data[i - 1]) || null;
    let date = item[4].split("/"); // "6/16/2020" => ["6", "16", "2020"]
    const dateTime = date[2] + "-" + date[0] + "-" + date[1] + " " + item[2]; // "2020-6-16 14:05:39"
    // 针对经纬度完全相同的数据 (海拔高度不同)，仅保留最后一项
    // 这会导致无法正常得到起落架收起及放下的时间点 (这示例代码不需要考虑这个问题)
    if (
      i > 1 &&
      Number(item[8]) === Number(pre[8]) &&
      Number(item[7]) === Number(pre[7])
    ) {
      res.pop();
    }
    res.push({
      longitude: Number(item[7]),
      latitude: Number(item[8]),
      altitude: Number(item[17]),
      dateTime,
      heading: Number(item[21]),
      pitch: Number(item[13]),
      roll: Number(item[15])
    });
  });
  return res;
}
