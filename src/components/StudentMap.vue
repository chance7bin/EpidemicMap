<template>
  <div>

<!--    地图控件-->
    <div class="map-control-top">
      <div class="map-title map-control-item">新疆学生分布图</div>

      <div class="num-toggle map-control-item">
        <span>显示：</span>
        <el-switch
          v-model="showStudentNum"
          active-text="学生人数"
          inactive-text="行政区划">
        </el-switch>
      </div>

    </div>

    <div class="map-control-bottom">
      <div class="legend map-control-item">
<!--        <h4>风险等级 <span>(数据时间：2022-10-08 10:00:00)</span></h4>-->
        <h4>风险等级</h4>
        <h4>{{dataTime}}</h4>
        <div><span style="background-color: #ec0000"></span>高风险 (包含高、中、低风险区的地区)</div>
        <div><span style="background-color: #e88c08"></span>中风险 (包含中、低风险区的地区)</div>
        <div><span style="background-color: #35e34f"></span>常态化防控地区</div>
      </div>
    </div>

<!--    地图-->
    <div id="map"></div>

<!--    学生信息-->
    <el-drawer
      size="50%"
      :modal="isModel"
      :visible.sync="drawer"
      :direction="direction"
      :with-header="false">
      <div style="padding: 10px">
        <div style="padding: 10px 0; font-size: x-large; text-align: center;">学生信息</div>
        <div style="padding: 10px 0; font-size: large; text-align: center;">{{district}}</div>
        <div v-if="filterData.length !== 0">

          <el-table
            :data="filterData"
            stripe
            style="width: 100%">
            <el-table-column
              width="180"
              prop="姓名"
              label="姓名">
            </el-table-column>
            <el-table-column
              prop="学院"
              label="学院">
            </el-table-column>
            <el-table-column
              prop="年级"
              label="年级">
            </el-table-column>
            <el-table-column
              width="180"
              prop="学号"
              label="学号">
            </el-table-column>
            <el-table-column
              prop="性别"
              label="性别">
            </el-table-column>
            <el-table-column
              prop="族别"
              label="族别">
            </el-table-column>
<!--            <el-table-column-->
<!--              prop="生源所在地"-->
<!--              label="生源所在地">-->
<!--            </el-table-column>-->
<!--            <el-table-column-->
<!--              prop="家庭所属地（州、市）"-->
<!--              label="家庭所属地（州、市）">-->
<!--            </el-table-column>-->
<!--            <el-table-column-->
<!--              prop="家庭所属县（市、区）"-->
<!--              label="家庭所属县（市、区）">-->
<!--            </el-table-column>-->
          </el-table>


<!--          <el-collapse accordion style="margin-top: 10px">-->
<!--              <el-collapse-item-->
<!--                v-for="(item, index) in filterData"-->
<!--                :title="item['姓名']"-->
<!--                :name="index"-->
<!--                :key="index"-->
<!--              >-->
<!--                <el-card class="box-card">-->
<!--                  <div v-for="(value, key) in item" :key="key" class="text item">-->
<!--                    {{key}} : {{value}}-->
<!--                  </div>-->
<!--                </el-card>-->
<!--              </el-collapse-item>-->
<!--          </el-collapse>-->
        </div>
        <div v-else>暂无数据...</div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import mapboxgl from 'mapbox-gl'
import axios from "axios";

export default {
  name: "StudentMap",

  data() {
    return {
      map:null,
      showStudentNum: false,
      drawer: false,
      direction: 'rtl',
      //是否有遮罩
      isModel: false,
      district:"地区",
      xinjiangArea:{},
      studentData:[],
      filterData:[],
      xinjiangDistrict:[],
      //包含人数的地区数组
      xinjiangDistrictStat:[],
      // shp数据、学生信息、疫情数据关联字段
      relateProp:"name",
      studentDataRelate:"所属县市区",
      //数据更新时间
      dataTime:"",

      //加载的数据路径
      //新疆底图
      xinjiangAreaPath:"static/json/xinjiang_new2.json",
      //新疆行政区名
      xinjiangDistrictPath:"static/json/xinjiang_district2.json",
      //学生数据
      studentDataPath:"static/json/student_data.json",
      //疫情数据
      // fengxianDataPath:"/yiqingApi/http/fengxian",
      fengxianDataPath:"http://172.21.213.151/yiqingApi/http/fengxian",

      //测试匹配的学生情况
      totalNum:0

    };
  },

  mounted() {
    this.init();
  },

  watch:{
    showStudentNum(val){
      this.toggleDisplayItem(val);
    }
  },

  methods: {

    async init(){

      //构造地图前的步骤
      this.studentData = (await this.loadStudentData()).data;
      this.xinjiangArea = (await this.loadXingjiangArea()).data;
      // this.xinjiangDistrict = (await this.loadXinjiangDistrict()).data;
      //行政区名通过底图构造
      let features = this.xinjiangArea.features;
      this.xinjiangDistrict = [];
      for (let i = 0; i < features.length; i++) {
        this.xinjiangDistrict.push(features[i].properties.name)
      }

      //初始化统计的数组
      for (let i = 0; i < this.xinjiangDistrict.length; i++) {
        let o = {
          "area": this.xinjiangDistrict[i],
          "num": 0,
          "riskLevel": "常态化防控地区"
        };
        this.xinjiangDistrictStat.push(o);
      }

      this.statDistrictNum(this.xinjiangDistrict, this.studentData);
      //把属性添加到geojson中
      //添加学生数量
      for (let i = 0; i < this.xinjiangDistrict.length; i++) {
        this.xinjiangArea.features[i].properties.studentNum = this.xinjiangDistrictStat[i].num
      }

      let fengxianData = (await this.loadFengxianData()).data;
      //数据更新时间
      for (let i = 0; i < fengxianData.length; i++) {
        if (fengxianData[i].id == "tm"){
          this.dataTime = fengxianData[i].name;
        }
      }
      //添加风险等级
      this.addRiskLevel(fengxianData);
      for (let i = 0; i < this.xinjiangDistrict.length; i++) {
        this.xinjiangArea.features[i].properties.riskLevel = this.xinjiangDistrictStat[i].riskLevel
      }

      // console.log("this.xinjiangArea.features:",this.xinjiangArea.features)

      //初始化地图
      this.initMap();

      // this.loadStudentData().then((res1) => {
      //   this.studentData = res1.data;
      //
      //   this.loadXinjiangDistrict().then((res2) => {
      //
      //     this.xinjiangDistrict = res2.data;
      //
      //     this.statDistrictNum(this.xinjiangDistrict, this.studentData);
      //
      //   })
      // });

    },

    initMap() {
      mapboxgl.accessToken = 'pk.eyJ1IjoiYzdiaW4iLCJhIjoiY2w4eDUxZ3Z5MDM0ajNubnVnYTNwcW5zdyJ9.dvJBYREQx_Wtwon1GxkjUA';
      this.map = new mapboxgl.Map({
        container: 'map', // container ID
        // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
        style: 'mapbox://styles/mapbox/light-v10', // style URL
        center: [86.618115, 42.532432], // starting position
        zoom: 4.5 // starting zoom
      });

      // Create a popup, but don't add it to the map yet.
      const popup = new mapboxgl.Popup({
        closeButton: false
      });

      this.map.on('load', () => {

        this.map.addSource('esriMap', {
          type: 'raster',
          tiles: [
            'https://map.geoq.cn/arcgis/rest/services/ChinaOnlineCommunity/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256,
          style: {
            template: 'custom',
            grayFilterPerBar: [0, 0.5, 1],
            brightness: 1,
            grayFilterColorBar: [
              [43, 43, 43, 1],
              [251, 251, 251, 1],
              [26, 26, 26, 1]
            ],
            grayFilterEnable: true
          }
        })
        this.map.addLayer({
          id: 'esriMap',
          type: 'raster',
          source: 'esriMap'
        })

        // 地图数据源
        this.map.addSource('district_layer', {
          type: 'geojson',
          data: this.xinjiangArea
        })

        // 添加边框
        this.map.addLayer({
          id: 'district_layer',
          type: 'fill',
          source: 'district_layer',
          paint: {
            // 'fill-color': 'rgba(200, 100, 240, 0.4)',
            'fill-color': 'rgba(4,245,47,0.4)',
            'fill-outline-color': 'rgba(200, 100, 240, 1)'
          }
        })




        // 高亮图层
        this.map.addLayer(
          {
            'id': 'counties-highlighted',
            'type': 'fill',
            'source': 'district_layer',
            'paint': {
              'fill-outline-color': '#484896',
              'fill-color': '#6e599f',
              'fill-opacity': 0.75
            },
            'filter': ['in', this.relateProp, '']
          }
        ); // Place polygon under these labels.



        this.map.on('click', 'district_layer', (e) => {

          // 以鼠标点击的一定半径查找
          // // Set `bbox` as 5px reactangle area around clicked point.
          // const bbox = [
          //   [e.point.x - 5, e.point.y - 5],
          //   [e.point.x + 5, e.point.y + 5]
          // ];
          // // Find features intersecting the bounding box.
          // const selectedFeatures = map.queryRenderedFeatures(bbox, {
          //   layers: ['district_layer']
          // });
          // const fips = selectedFeatures.map(
          //   (feature) => feature.properties.NL_NAME_3
          // );
          // // Set a filter matching selected features by FIPS codes
          // // to activate the 'counties-highlighted' layer.
          // map.setFilter('counties-highlighted', ['in', 'NL_NAME_3', ...fips]);
          var feature = e.features[0];
          this.map.setFilter('counties-highlighted', ['in', this.relateProp, feature.properties[this.relateProp]]);


          let name = e.features[0].properties[this.relateProp];

          // popup
          //   .setLngLat(e.lngLat)
          //   .setHTML(name)
          //   .addTo(map);

          this.filterData = this.filterDistrictData(name);



          //将信息展示在侧边栏上
          this.drawer = true;
          this.district = e.features[0].properties["ext_path"];
        });



        // 高风险
        this.map.addLayer(
          {
            'id': 'highRiskLayer',
            'type': 'fill',
            'source': 'district_layer',
            'paint': {
              'fill-outline-color': '#484896',
              'fill-color': '#ec0000',
              'fill-opacity': 0.75
            },
            'filter': ['in', 'riskLevel', '高风险']
          }
        ); // Place polygon under these labels.

        //中风险
        this.map.addLayer(
          {
            'id': 'midRiskLayer',
            'type': 'fill',
            'source': 'district_layer',
            'paint': {
              'fill-outline-color': '#484896',
              'fill-color': '#e88c08',
              'fill-opacity': 0.75
            },
            'filter': ['in', 'riskLevel', '中风险']
          }
        ); // Place polygon under these labels.


        // 添加地区学生人数
        this.map.addLayer({
          id: 'student_num',
          type: 'symbol',
          source: 'district_layer',
          layout: {
            'text-field': '{studentNum}',
            'text-size': 14
          },
          paint: {
            'text-color': '#000'
          }
        })

        // 添加名字
        this.map.addLayer({
          id: 'district_name',
          type: 'symbol',
          source: 'district_layer',
          layout: {
            'text-field': '{' + this.relateProp + '}',
            'text-size': 14
          },
          paint: {
            'text-color': '#000'
          }
        })

        this.map.setLayoutProperty("district_name", 'visibility', 'visible');
        this.map.setLayoutProperty("student_num", 'visibility', 'none');

        // Change the cursor to a pointer when
        // the mouse is over the states layer.
        this.map.on('mouseenter', 'district_layer', () => {
          this.map.getCanvas().style.cursor = 'pointer';
        });

        // Change the cursor back to a pointer
        // when it leaves the states layer.
        this.map.on('mouseleave', 'district_layer', () => {
          this.map.getCanvas().style.cursor = '';
        });


        // When a click event occurs on a feature in the states layer,
        // open a popup at the location of the click, with description
        // HTML from the click event's properties.
        // map.on('click', 'district_layer', (e) => {
        //   popup
        //     .setLngLat(e.lngLat)
        //     .setHTML(e.features[0].properties.NL_NAME_3)
        //     .addTo(map);
        // });


      });
    },

    //根据点击的地区过滤studentData中的数据
    filterDistrictData(district){
      // console.log("district:",district)
      let res = this.studentData.filter(data => data[this.studentDataRelate] == district)

      return res;
    },

    //统计每个区域的人数
    statDistrictNum(district, studentData){
      // console.log("district",district)

      for (let i = 0; i < studentData.length; i++) {
        let studentHome = studentData[i][this.studentDataRelate];
        let index = district.indexOf(studentHome);
        if (district.indexOf(studentHome) !== -1){
          this.xinjiangDistrictStat[index].num += 1;
          // this.totalNum += 1;
        }
      }

      // console.log("this.xinjiangDistrictStat:", this.xinjiangDistrictStat)
      // console.log("this.totalNum:", this.totalNum)
    },

    loadXingjiangArea(){
      return axios(this.xinjiangAreaPath);
    },


    loadXinjiangDistrict(){
      // axios('/static/json/xinjiangDistrict.json').then(({data}) => {
      //   this.xinjiangDistrict = data;
      // })
      return axios(this.xinjiangDistrictPath);
    },

    loadStudentData(){
      // axios('/static/json/student_data.json').then(({data}) => {
      //   this.studentData = data;
      // })
      return axios(this.studentDataPath);
    },

    toggleDisplayItem(showStudentNum){
      if (showStudentNum){
        this.map.setLayoutProperty("district_name", 'visibility', 'none');
        this.map.setLayoutProperty("student_num", 'visibility', 'visible');
      } else {
        this.map.setLayoutProperty("district_name", 'visibility', 'visible');
        this.map.setLayoutProperty("student_num", 'visibility', 'none');
      }
    },

    loadFengxianData(){
      return axios(this.fengxianDataPath);
    },

    addRiskLevel(fengxianData) {
      //删除最后一级
      let fengxianDataSim = []
      for (let i = 0; i < fengxianData.length; i++) {
        if (fengxianData[i].isParent){
          fengxianDataSim.push(fengxianData[i])
        }
      }

      // console.log("fengxianDataSim:", fengxianDataSim)

      //删减后的风险区域
      let xjHighRiskItemId = "";
      let xjMidRiskItemId = "";
      for (let i = 0; i < fengxianDataSim.length; i++) {
        if (fengxianDataSim[i].name === "新疆维吾尔自治区" && fengxianDataSim[i].pId === "高风险"){
          xjHighRiskItemId = fengxianDataSim[i].id;
        }
      }
      for (let i = 0; i < fengxianDataSim.length; i++) {
        if (fengxianDataSim[i].name === "新疆维吾尔自治区" && fengxianDataSim[i].pId === "中风险"){
          xjMidRiskItemId = fengxianDataSim[i].id;
        }
      }

      //市级
      let highRiskCityId = [];
      let midRiskCityId = [];
      for (let i = 0; i < fengxianDataSim.length; i++) {
        if (fengxianDataSim[i].pId == xjHighRiskItemId){
          highRiskCityId.push(fengxianDataSim[i].id);
        }
      }
      for (let i = 0; i < fengxianDataSim.length; i++) {
        if (fengxianDataSim[i].pId == xjMidRiskItemId){
          midRiskCityId.push(fengxianDataSim[i].id);
        }
      }

      // console.log("highRiskCityId:", highRiskCityId)

      //区级
      let highRiskDistrict = [];
      let midRiskDistrict = [];
      for (let i = 0; i < fengxianDataSim.length; i++) {
        if (highRiskCityId.indexOf(fengxianDataSim[i].pId) !== -1){
          highRiskDistrict.push(fengxianDataSim[i].name);
        }
      }
      for (let i = 0; i < fengxianDataSim.length; i++) {
        if (midRiskCityId.indexOf(fengxianDataSim[i].pId) !== -1){
          midRiskDistrict.push(fengxianDataSim[i].name);
        }
      }
      // console.log("highRiskDistrict:", highRiskDistrict)

      // 把新增的标识去掉 头屯河区【新增】
      for (let i = 0; i < highRiskDistrict.length; i++) {
        let newAddIndex = highRiskDistrict[i].indexOf("新增")
        if (newAddIndex !== -1){
          highRiskDistrict[i] = highRiskDistrict[i].substring(0, newAddIndex - 1);
        }
      }
      for (let i = 0; i < midRiskDistrict.length; i++) {
        let newAddIndex = midRiskDistrict[i].indexOf("新增")
        if (newAddIndex !== -1){
          midRiskDistrict[i] = midRiskDistrict[i].substring(0, newAddIndex - 1);
        }
      }

      // console.log("highRiskDistrict:", highRiskDistrict)
      // console.log("midRiskDistrict:", midRiskDistrict)

      //县级
      // let highRiskArea = [];
      // let midRiskArea = [];
      // for (let i = 0; i < fengxianDataSim.length; i++) {
      //   if (highRiskDistrictId.indexOf(fengxianDataSim[i].pId) !== -1){
      //     highRiskArea.push(fengxianDataSim[i].name)
      //   }
      //   if (highRiskDistrictId.indexOf(fengxianDataSim[i].pId) !== -1){
      //     midRiskArea.push(fengxianDataSim[i].name)
      //   }
      // }

      // console.log("highRiskArea:", highRiskArea)
      // console.log("midRiskArea:", midRiskArea)

      //删除最后一级
      /*let fengxianDataSim = []
      for (let i = 0; i < fengxianData.length; i++) {
        if (fengxianData[i].isParent){
          fengxianDataSim.push(fengxianData[i])
        }
      }
      let highRiskId = "";
      let midRiskId = "";
      //区级
      let highRiskDistrict = [];
      let midRiskDistrict = [];
      //县级
      let highRiskArea = [];
      let midRiskArea = [];
      for (let i = 0; i < fengxianDataSim.length; i++) {
        if (fengxianDataSim[i].pId == "高风险"){
          highRiskId = fengxianDataSim[i].id;
        }
        if (fengxianDataSim[i].pId == "中风险"){
          midRiskId = fengxianDataSim[i].id;
        }
      }
      for (let i = 0; i < fengxianDataSim.length; i++) {
        if (fengxianDataSim[i].pId == highRiskId){
          highRiskDistrict.push(fengxianDataSim[i].id)
        }
        if (fengxianDataSim[i].pId == midRiskId){
          midRiskDistrict.push(fengxianDataSim[i].id)
        }
      }
      for (let i = 0; i < fengxianDataSim.length; i++) {
        if (highRiskDistrict.indexOf(fengxianDataSim[i].pId) !== -1){
          highRiskArea.push(fengxianDataSim[i].name)
        }
        if (midRiskDistrict.indexOf(fengxianDataSim[i].pId) !== -1){
          midRiskArea.push(fengxianDataSim[i].name)
        }
      }*/


      //设置中高风险字段
      for (let i = 0; i < midRiskDistrict.length; i++) {
        let area = midRiskDistrict[i];
        let index = this.xinjiangDistrict.indexOf(area);
        if (this.xinjiangDistrict.indexOf(area) !== -1){
          this.xinjiangDistrictStat[index].riskLevel = "中风险";
        }
      }
      for (let i = 0; i < highRiskDistrict.length; i++) {
        let area = highRiskDistrict[i];
        let index = this.xinjiangDistrict.indexOf(area);
        if (this.xinjiangDistrict.indexOf(area) !== -1){
          this.xinjiangDistrictStat[index].riskLevel = "高风险";
        }
      }
    }
  }

}
</script>

<style scoped>
body {
  margin: 0;
  padding: 0;
}

.map-control-top{
  position: absolute;
  left: 50px;
  top: 20px;
  z-index: 999;
}

.map-control-bottom{
  position: absolute;
  left: 50px;
  bottom: 50px;
  z-index: 999;
}

.map-control-item{
  background-color: white;
  border: 2px solid grey;
}

.map-title{
  padding: 10px 30px;
  font-size: xx-large;
}

.num-toggle{
  margin-top: 10px;
  padding: 10px 30px;
}

.map-legned{

}

.legend {
  background-color: #fff;
  border-radius: 3px;
  bottom: 30px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  /*font: 12px/20px 'Helvetica Neue', Arial, Helvetica, sans-serif;*/
  padding: 10px;
  right: 10px;
}

.legend h4 {
  margin: 0 0 10px;
}

.legend div span {
  border-radius: 50%;
  display: inline-block;
  height: 10px;
  margin-right: 5px;
  width: 10px;
}

#map {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100%;
}
.mapboxgl-popup {
  max-width: 400px;
  font: 12px/20px 'Helvetica Neue', Arial, Helvetica, sans-serif;
}
</style>
