<script setup lang="ts">
import { onMounted } from "vue";
import * as d3 from "d3";
import d3tip from "d3-tip";
import { ref, watch } from "vue";
import screenfull from "screenfull";
import html2canvas from "html2canvas";
import { getDepGraph, getNodeDetail } from "@/api";
import PkgDetail from "./components/PkgDetail.vue";
import { ElMessage, type UploadFiles, type UploadUserFile } from "element-plus";
import ProjectDetail from "./components/ProjectDetail.vue";

interface Node {
  name: string;
  coount: number;
}
interface Link {
  source: string;
  target: string;
}

interface GraphData {
  entryPackageName: string;
  entryVersion: string;
  nodes: Array<Node>;
  links: Array<Link>;
}

interface NodeDetail {
  entryPackageName: string;
  entryVersion: string;
  // depth: number;
  isCircle: boolean;
  isMulPackage: boolean;
  mulPackageList: [];
}

interface ProjectDetail {
  entryPackageName: string;
  entryVersion: string;
  depth: number;
  isCircle: boolean;
  isMulPackage: boolean;
  nodeCount: number;
  circleDepList: [string[]];
  mulPackageList: [string[]];
}
const searchKeyWords = ref<string>("");
const showName = ref(true);
const showArrow = ref(true);
// 是否定位中心点
const isCenter = ref(false);
const loading = ref(true);

const isLocalFile = ref(false);

const nodeDetail = ref<NodeDetail>({
  entryPackageName: "",
  entryVersion: "",
  isCircle: false,
  isMulPackage: false,
  mulPackageList: [],
});

const projectDetail = ref<ProjectDetail>({
  entryPackageName: "",
  entryVersion: "",
  depth: 0,
  isCircle: false,
  isMulPackage: false,
  nodeCount: 0,
  circleDepList: [[]],
  mulPackageList: [[]],
});
const dependenciesList = ref<Array<{ value: unknown }>>([]);
// 获取依赖图的数据
let data: GraphData = {
  entryPackageName: "",
  entryVersion: "",
  nodes: [],
  links: [],
};

let graph: any;
onMounted(async () => {
  const resp = await getDepGraph("default", 10) as any
  
  // 自动补全列表
  dependenciesList.value = resp.nodes.map((node: Node) => {
    return { value: node.name };
  });
  data = { ...resp };
  // 获取项目详情
  projectDetail.value = { ...resp };
  graph = render(data);
  loading.value = false;
});

// 初始化依赖图页面
function render(data: GraphData) {
  const svg = d3.select("svg");
  const container = svg.append("g");
  const width = parseInt(window.getComputedStyle(mainSvgRef.value).width)
  const height = parseInt(window.getComputedStyle(mainSvgRef.value).height)
  container.attr("viewBox", `0 0 ${width} ${height}`);
  // const nodes = Array.from(
  //   data.nodes.map((name: string) => {
  //     return { name };
  //   })
  // );
  const nodes = data.nodes;
  const links = data.links;

  const color = d3
    .scaleSequential(d3.interpolateRainbow)
    .domain([0, 100]);
  const simulation = d3.forceSimulation(nodes);

  simulation
    .force(
      "link",
      d3.forceLink(links).id((d: { name: string }) => d.name)
    )
    .force("charge", d3.forceManyBody().strength(50))
    .force("manyBody", d3.forceManyBody().strength(-600))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX())
    .force("y", d3.forceY());

  const tipStyle = `display: inline-block;background-color: white;padding: 5px 10px;border: 1px solid #ccc;
      border-radius: 5px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      font-size: 14px;`;
  const tip = d3tip()
    .attr("class", "d3-tip")
    .html(
      (event: Event, d: any) => `<span style="${tipStyle}">${d.name}</span>`
    );

  // tip提示
  svg.call(tip);

  const link = container
    .append("g")
    .attr("fill", "none")
    .attr("stroke-width", 1)
    .selectAll("path")
    .data(links)
    .join("path")
    .attr("stroke", "gray")
    .attr("marker-end", "url(#triangle-gray)");

  const node = container
    .append("g")
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .call(drag(simulation));

  // 节点点击
  const handleClickNode = (event: Event) => {
    const sourceName = d3.select(event.currentTarget)["_groups"][0][0][
      "__data__"
    ].name;
    // 因为选择器中不能出现 & . 需要处理
    const _name = "#" + sourceName.replace(/[^a-zA-Z0-9]/g, "");
    const circle = d3.select(_name);
    const r = circle.attr("r");
    circle
      .transition()
      .duration(100)
      .attr("r", 4)
      .transition()
      .duration(100)
      .attr("r", r);
    // 获取节点信息
    getNodeDetail(sourceName).then((resp: any) => {
      nodeDetail.value = { ...resp };
    });
    hightlightLinks(sourceName);
  };

  // 高亮从某一节点出发的边
  function hightlightLinks(sourceName: string) {
    const linksArray = link["_groups"][0];
    for (let i = 0; i < linksArray.length; i++) {
      // 恢复边的颜色
      linksArray[i].setAttribute("stroke", "gray");
      if (showArrow.value) {
        linksArray[i].setAttribute("marker-end", "url(#triangle-gray)");
      }
      if (linksArray[i]["__data__"]["source"]["name"] === sourceName) {
        linksArray[i].setAttribute("stroke", "red");
        if (showArrow.value) {
          linksArray[i].setAttribute("marker-end", "url(#triangle-red)");
        }
      }
    }
  }

  // 渲染循环依赖的边, targetLinks:[['a','b'],['b','a],...]
  function hightlightCircleLinks(targetLinks: Array<string[]>) {
    const linksArray = link["_groups"][0];
    for (let i = 0; i < linksArray.length; i++) {
      // 恢复边的颜色
      linksArray[i].setAttribute("stroke", "gray");
      if (showArrow.value) {
        linksArray[i].setAttribute("marker-end", "url(#triangle-gray)");
      }
      const sourceAndTarget =
        linksArray[i]["__data__"]["source"]["name"] +
        linksArray[i]["__data__"]["target"]["name"];
      if (targetLinks.includes(sourceAndTarget)) {
        linksArray[i].setAttribute("stroke", "red");
        if (showArrow.value) {
          linksArray[i].setAttribute("marker-end", "url(#triangle-red)");
        }
      }
    }
  }
  node
    .append("circle")
    .attr("stroke", "white")
    .attr("stroke-width", 1.5)
    .attr("r", (d: any) => 6 + (d.count % 10))
    .attr("fill", (d: any) => color(Math.random() * 100))
    // 防止id中出现特殊字符导致无法使用选择器
    .attr("id", (d: any) => d.name.replace(/[^a-zA-Z0-9]/g, ""))
    .on("click", handleClickNode)
    .on("contextmenu", (e: Event) => {
      e.preventDefault();
      container
        .append("polygon ")
        .attr("points", "65,5 100,35 85,75 35,75 20,35")
        .attr("fill", "red");
    })
    .on("mouseover", tip.show)
    .on("mouseout", tip.hide);

  // 节点标签名字展示
  node
    .append("text")
    .attr("x", (d: { name: string }) => -d.name.length * 3)
    .attr("y", 15)
    .text((d: { name: string }) => d.name)
    .attr("font-size", 10)
    .clone(true)
    .lower()
    .attr("fill", "none");
  // 缩放
  let zoom = d3
    .zoom()
    .scaleExtent([0.1, 10]) // 鼠标缩放的距离, 范围
    .on("zoom", (e: any) => {
      container.attr("transform", e.transform);
    });
  svg.call(zoom).call(zoom.transform, d3.zoomIdentity.scale(1));

  simulation.on("tick", () => {
    link.attr("d", linkArc);
    node.attr(
      "transform",
      (d: { x: any; y: any }) => `translate(${d.x},${d.y})`
    );
  });

  function linkArc(d: any) {
    // const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y);
    //   return `
    //   M${d.source.x},${d.source.y}
    //   A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
    // `;
    return `
    M${d.source.x},${d.source.y}
     ${d.target.x},${d.target.y}
  `;
  }
  function drag(simulation: any) {
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.05).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  function getNodePositionByName(nodeName: string) {
    // 因为选择器中不能出现 & . 需要处理
    const name = "#" + nodeName.replace(/[^a-zA-Z0-9]/g, "");
    const selectResult = d3.select(name)["_groups"][0];
    if (selectResult.length > 0) {
      const node = selectResult[0]["__data__"];
      // 获取节点x, y坐标
      const { x, y } = node;
      return { x, y };
    }
  }
  function scaleAndCenterNode(packageName: string, x: number, y: number) {
    // 因为选择器中不能出现 & . 需要处理
    const name = "#" + packageName.replace(/[^a-zA-Z0-9]/g, "");
    const circle = svg.select(name);
    const r = circle.attr("r");
    if (isCenter.value) {
      // 定位中心点
      container
        .transition()
        .duration(1000)
        .attr(
          "transform",
          `translate(${width / 2 - x}, ${height / 2 - y}) scale(1)`
        );
    }
    // 放大中心点
    circle
      .transition()
      .duration(500)
      .attr("r", 30)
      .transition()
      .duration(500)
      .attr("r", r);
  }

  return {
    simulation,
    hightlightLinks,
    getNodePositionByName,
    scaleAndCenterNode,
    hightlightCircleLinks,
  };
}

function search(packageName: string) {
  if (!(packageName.length > 0)) return;
  if (!dependenciesList.value.find((obj) => obj.value === packageName)) {
    ElMessage({
      message: "查询的依赖不存在该项目, 或检查版本是否正确",
      type: "error",
      offset: 50,
    });
    return;
  }
  graph.hightlightLinks(packageName);
  // 节点坐标
  const { x, y } = graph.getNodePositionByName(packageName);
  graph.scaleAndCenterNode(packageName, x, y);
  // 获取节点信息
  getNodeDetail(packageName).then((resp: any) => {
    nodeDetail.value = { ...resp };
  });
}

// 自动补全
const querySearch = (queryString: string, cb: any) => {
  const results = queryString
    ? dependenciesList.value.filter(createFilter(queryString))
    : dependenciesList.value;
  // call callback function to return suggestions
  cb(results);
};
const createFilter = (queryString: string) => {
  return (item: any) => {
    return item.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0;
  };
};

const handleSelect = (item: { value: string }) => {
  search(item.value);
};

// 控制是否显示标签名字
watch(showName, (newValue, oldValue) => {
  d3.selectAll("text").attr(
    "display",
    `${newValue === true ? "inherit" : "none"}`
  );
});

// 控制是否显示连线箭头
watch(showArrow, (newValue, oldValue) => {
  d3.selectAll("path").attr(
    "marker-end",
    `${newValue === true ? "url(#triangle-gray)" : "none"}`
  );
});

const toggleFullscreen = () => {
  const ele: any = document.getElementById("mainsvg"); //指定全屏区域元素
  if (screenfull.isEnabled) {
    screenfull.request(ele);
  }
};

// 修改图的渲染层数
const changeDepth = (depth: number) => {
  // 重置组件的内容
  reLoad()

  const pkg = data.entryPackageName+'&'+data.entryVersion
  getDepGraph(pkg, depth).then((resp: any) => {
    // 自动补全列表
    dependenciesList.value = resp.nodes.map((node: Node) => {
      return { value: node.name };
    });
    data = { ...resp };
    // 获取项目详情
    projectDetail.value = { ...resp };
    graph = render(data);
    loading.value = false;
  });
};

const handleViewCircleDep = () => {
  // 将循环依赖节点circleDepList:[['a','b','c','a'], ['a','b','d','a']]处理成边['ab'],'bc'...](需去重)
  const circleDepLinks: Array<string> = [];
  const map = new Map();
  projectDetail.value.circleDepList
    .map((circleArr) => {
      const results = [];
      for (let i = 0; i < circleArr.length - 1; i++) {
        const node1 = circleArr[i];
        const node2 = circleArr[i + 1];
        const key = "" + node1 + node2;
        if (!map.has(key)) {
          map.set(key, true);
          circleDepLinks.push(key);
        }
      }
    })
    .flat(1);
  graph.hightlightCircleLinks(circleDepLinks);
};

const uploadRef = ref();
const renderFile = (uploadFile: any) => {
  isLocalFile.value = true;
  try {
    const reader = new FileReader();
    reader.onload = function () {
      if (reader.result) {
        // 重置组件内容
        reLoad()
        const data = JSON.parse(reader.result.toString());

        // 自动补全列表
        dependenciesList.value = data.nodes.map((node: Node) => {
          return { value: node.name };
        });
        // 获取项目详情
        projectDetail.value = { ...data };
        graph = render(data);
        loading.value = false;
      }
    };
    reader.readAsText(uploadFile.raw);
  } catch (err) {
    console.log(err);
    ElMessage({
      message: "文件错误",
      type: "error",
      offset: 50,
    });
  }
};
const handleUpdloadSuccess = (uploadFile: any, uploadFiles: UploadFiles) => {
  renderFile(uploadFile);
  uploadRef.value.clearFiles();
};

const handleExceed = (files: File[], uploadFiles: UploadUserFile[]) => {
  ElMessage({
    message: "文件数量不能多于1个",
    type: "error",
    offset: 50,
  });
  uploadRef.value.clearFiles();
};

// 下载图片
const mainSvgRef = ref();
const downloadSvg = () => {
  html2canvas(mainSvgRef.value).then((canvas) => {
    // 将画布转换为图像的URL
    var imageURL = canvas.toDataURL("image/png");

    // 创建一个下载链接并模拟点击操作
    var link = document.createElement("a");
    link.href = imageURL;

    link.download = `${data.entryPackageName}Graph.png`;
    link.click();
  });
};

// 重新加载时删除原数据, 取消依赖详情组件可见性
const reLoad = ()=>{
  d3.selectAll("g").remove();
  loading.value = true;
  // entryPackageName置空使组件不可见
  nodeDetail.value.entryPackageName = ''
}
</script>

<template>
  <el-container>
    <el-header>
      <h2>Pkg Insights</h2>
    </el-header>
    <el-container>
      <el-main>
        <el-row>
          <el-col :span="8"></el-col>
          <el-col :span="8">
            <div class="search-box">
              <el-autocomplete
                v-model="searchKeyWords"
                :fetch-suggestions="querySearch"
                clearable
                style="width: 100%"
                placeholder="Please Input"
                @select="handleSelect"
              />
              <el-button type="primary" @click="search(searchKeyWords)"
                >查找</el-button
              >
            </div>
          </el-col>
          <el-col :span="8">
            <div class="switch-box">
              <div class="switch">
                <span>展示名字</span
                ><el-switch size="small" v-model="showName" />
              </div>
              <div class="switch">
                <span>展示箭头</span
                ><el-switch size="small" v-model="showArrow" />
              </div>
              <div class="switch">
                <span>定位中心点(实验性)</span
                ><el-switch size="small" v-model="isCenter" />
              </div>
              <div class="upload-btn">
                <el-upload
                  ref="uploadRef"
                  action="#"
                  accept="application/json"
                  :on-change="handleUpdloadSuccess"
                  :show-file-list="false"
                  :auto-upload="false"
                  :on-exceed="handleExceed"
                  :limit="1"
                >
                  <template #trigger>
                    <el-button size="small" type="success">上传</el-button>
                  </template>
                </el-upload>
              </div>
            </div>
          </el-col>
        </el-row>
        <div class="container" v-loading="loading">
          <div class="svg-box">
            <div class="svg-tools-box">
              <!-- 全屏按钮, 使用图标导致图像不显示, 暂不使用 -->
              <!-- <el-button class="fullscreen-btn" @click="toggleFullscreen" :icon="FullScreen" circle /> -->
              <el-button @click="toggleFullscreen" title="全屏">全屏</el-button>
              <el-button @click="downloadSvg" title="下载">下载</el-button>
            </div>
            <div ref="mainSvgRef">
              <svg
                id="mainsvg"
                class="svg"
                width="75vw"
                height="78vh"
              >
                <defs>
                  <marker
                    id="triangle-gray"
                    viewBox="0 0 10 20"
                    refX="17"
                    refY="5"
                    markerUnits="strokeWidth"
                    markerWidth="10"
                    markerHeight="20"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="gray" />
                  </marker>
                  <marker
                    id="triangle-red"
                    viewBox="0 0 10 20"
                    refX="17"
                    refY="5"
                    markerUnits="strokeWidth"
                    markerWidth="10"
                    markerHeight="20"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="red" />
                  </marker>
                </defs>
              </svg>
            </div>
          </div>
          <el-aside width="20vw">
            <div class="detail-box">
              <ProjectDetail
                :data="projectDetail"
                :isLocalFile="isLocalFile"
                @refresh="changeDepth"
                @hilight-cirle-links="handleViewCircleDep"
                @search-node="search"
              />
              <!-- 本地文件缺乏具体节点数据, 所以不展示 -->
              <div v-show="nodeDetail.entryPackageName && !isLocalFile">
                <PkgDetail
                :data="nodeDetail"
                @refresh="search"
              />
              </div>
            </div>
          </el-aside>
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.search-box {
  display: flex;
  gap: 1em;
  margin: 1em;
}
.switch-box {
  margin: 1em;
  display: flex;
}
.switch > span {
  display: inline-block;
  margin: 0 0.5em;
}
.upload-btn {
  margin: 0 0 0 5px;
}
.el-main {
  padding-top: 0;
}
.container {
  display: flex;
  gap: 1em;
}
.svg-box {
  position: relative;
}
.svg {
  position: relative;
  transform: translate(10, 10);
  border: 1px solid #eee;
  background-color: white;
  min-width: 1200px;
  min-height: 600px;
}
.svg-tools-box {
  position: absolute;
  top: 1em;
  right: 1em;
  z-index: 2;
  display: flex;
  gap: 0.1em;
}
.detail-box {
  display: flex;
  flex-direction: column;
  gap: 1em;
}
</style>
