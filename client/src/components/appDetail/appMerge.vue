<template>
    <div class="merge">
        <div class="top">
            <i class="el-icon-setting"></i> 应用合并
        </div>
        <div class="content">
            <div class="approw">
                <div class="app">
                    <img
                        class="appicon"
                        v-lazy="{src: axios.defaults.baseURL+appInfo.icon, error: require('../../assets/app_icon.png'), loading: require('../../assets/app_icon.png')}"
                    />
                    <div>
                        <i :class="appInfo.platform === 'ios' ? 'icon-ic_ios':'icon-ic_andr'"></i>
                        {{appInfo.appName}}
                    </div>
                    <!-- <div>{{appInfo.platform}}</div> -->
                </div>
                <div>
                    <img class="link" src="../../assets/app_link.png" />
                </div>
                <div class="app" v-if="isMergedApp">
                    <img
                        class="appicon"
                        v-lazy="{src: axios.defaults.baseURL+rightApp.icon, error: require('../../assets/app_icon.png'), loading: require('../../assets/app_icon.png')}"
                    />
                    <div>
                        <i :class="rightApp.platform === 'ios' ? 'icon-ic_ios':'icon-ic_andr'"></i>
                        {{rightApp.appName}}
                    </div>
                    <!-- <div>{{rightApp.platform}}</div> -->
                </div>
                <div class="app" v-else-if="isMergedUrl">
                    <div class="appurl">{{rightApp.storeUrl}}</div>
                </div>
                <div class="app" v-else @click="onChooseClick">
                    <img class="appicon" src="../../assets/app_add.png" />
                    <div>选择需要合并的应用</div>
                </div>
            </div>
            <el-button type="primary" v-if="isMergedApp || isMergedUrl" @click="onUnmergeClick">解除合并</el-button>
            <div class="tip">温馨提示：合并后的两个应用，进入任一个应用的单页，扫描二维码，会根据你的手机系统自动帮你下载相应的版本；未发布完成的应用不支持合并。</div>
        </div>
        <el-dialog title="选择应用" :visible.sync="dialogVisible" :destroy-on-close="true">
            <div class="radios">
                <el-radio v-model="chooseType" label="内部应用">内部应用</el-radio>
                <el-radio v-model="chooseType" label="内部短链">内部短链</el-radio>
                <el-radio v-model="chooseType" label="外部链接">外部链接</el-radio>
            </div>
            <div class="dialog-content">
                <div class="choose-app" v-if="chooseType === '内部应用'">
                    <div
                        v-for="(item, index) in dataList"
                        :key="index"
                        :class="{'choose-item':true, 'choose-item--checked':chooseIndex === index}"
                        @click="onChooseItemClick(index)"
                    >
                        <img
                            class="item-appicon"
                            v-lazy="{src: axios.defaults.baseURL+item.icon, error: require('../../assets/app_icon.png'), loading: require('../../assets/app_icon.png')}"
                        />
                        <div>
                            <i :class="item.platform === 'ios' ? 'icon-ic_ios':'icon-ic_andr'"></i>
                            {{item.appName}}
                        </div>
                        <el-checkbox
                            class="item-check"
                            v-if="chooseIndex === index"
                            :checked="true"
                        ></el-checkbox>
                    </div>
                </div>
                <div v-else-if="chooseType === '内部短链'">
                    <el-input v-model="shortLink" placeholder="请输入平台内部应用短链接地址"></el-input>
                </div>
                <div v-else-if="chooseType === '外部链接'">
                    <el-input v-model="storeLink" placeholder="请输入外部链接地址，如商店下载地址"></el-input>
                </div>
            </div>
            <div slot="footer" class="dialog-footer">
                <el-button @click="dialogVisible = false">取 消</el-button>
                <el-button type="primary" @click="onChooseConfirmClick">确 定</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import * as AppResourceApi from "../../api/moudle/appResourceApi";
import { getUserTeam } from "../../mgr/userMgr";
export default {
    props: {
        appInfo: {
            type: Object
        }
    },
    data() {
        return {
            dialogVisible: false,
            chooseType: "内部应用",
            storeLink: "",
            shortLink: "",
            dataList: [],
            chooseIndex: undefined
        };
    },
    computed: {
        rightApp() {
            return this.appInfo.merge || {};
        },
        isMergedApp() {
            return this.appInfo.merge && this.appInfo.merge.bundleId;
        },
        isMergedUrl() {
            return this.appInfo.merge && this.appInfo.merge.storeUrl;
        }
    },
    created() {
        this.currentTeam = getUserTeam();
    },
    methods: {
        loadAppList() {
            AppResourceApi.getAppList(this.currentTeam._id).then(
                response => {
                    let dataList = response.data || [];
                    dataList = dataList.filter(item => {
                        return item.platform !== this.appInfo.platform;
                    });
                    this.dataList = dataList.reverse();
                },
                reject => {
                    this.$message.error(reject);
                    this.showEmpty = true;
                }
            );
        },
        onUnmergeClick() {
            Promise.all([
                this.updateAppSetting(this.currentTeam._id, this.appInfo._id, {
                    merge: {}
                }),
                this.updateAppSetting(
                    this.currentTeam._id,
                    this.appInfo.merge._id,
                    { merge: {} }
                )
            ]).then(
                ([res1, res2]) => {
                    if (res1.success && res2.success) {
                        this.$message.success(res1.message);
                        this.$emit("updateSuccess");
                    }
                },
                reject => {
                    this.$message.error(reject);
                }
            );
        },
        onChooseClick() {
            this.dialogVisible = true;
            this.loadAppList();
        },
        onChooseItemClick(index) {
            this.chooseIndex = index;
        },
        async onChooseConfirmClick() {
            let body = {};
            let _id = undefined;
            if (this.chooseType === "内部应用") {
                const app = this.dataList[this.chooseIndex];
                body.bundleId = app.bundleId;
                body.shortUrl = app.shortUrl;
                body.appName = app.appName;
                body.icon = app.icon;
                body.platform = app.platform;
                body._id = app._id;
                _id = app._id;
            } else if (this.chooseType === "内部短链") {
                //根据短链查询app信息
                try {
                    await AppResourceApi.getAppInfoByShortUrl(
                        this.shortLink
                    ).then(res => {
                        console.log("getAppInfoByShortUrl", res);
                        const app = res.data.app;
                        body.bundleId = app.bundleId;
                        body.shortUrl = app.shortUrl;
                        body.appName = app.appName;
                        body.icon = app.icon;
                        body.platform = app.platform;
                        body._id = app._id;
                        _id = app._id;
                    });
                } catch (err) {
                    this.$message.error(err);
                    return;
                }
            } else if (this.chooseType === "外部链接") {
                body.storeUrl = this.storeLink;
            } else {
                return;
            }
            Promise.all([
                this.updateAppSetting(
                    this.currentTeam._id,
                    this.appInfo._id,
                    body
                ),
                this.updateAppSetting(this.currentTeam._id, _id, undefined)
            ]).then(
                ([res1, res2]) => {
                    if (res1.success && res2.success) {
                        this.$message.success(res1.message);
                        this.$emit("updateSuccess");
                    }
                    this.dialogVisible = false;
                },
                reject => {
                    this.$message.error(reject);
                }
            );
        },
        updateAppSetting(teamId, appId, merge) {
            if (!appId) {
                return Promise.resolve({ success: true });
            }
            if (!merge) {
                merge = {};
                const app = this.appInfo;
                merge.bundleId = app.bundleId;
                merge.shortUrl = app.shortUrl;
                merge.appName = app.appName;
                merge.icon = app.icon;
                merge.platform = app.platform;
                merge._id = app._id;
            }
            return AppResourceApi.updateAppSetting(teamId, appId, { merge });
        }
    }
};
</script>

<style lang="scss" scoped>
@import "../../common/scss/base";
.merge {
    width: 100%;
    height: 48px;
    background-color: white;
    margin-top: 12px;
    line-height: 48px;
    box-sizing: border-box;

    .top {
        padding-left: 24px;
    }

    .content {
        text-align: center;
        margin-top: 1px;
        background-color: white;

        .approw {
            display: flex;
            justify-content: center;

            .link {
                margin-top: 120px;
                width: 30px;
                height: 30px;
            }

            .app {
                margin: 70px;
                display: flex;
                flex-direction: column;
                align-items: center;

                i {
                    margin-right: 2px;
                }

                .appicon {
                    width: 120px;
                    height: 120px;
                    object-fit: contain;
                }
                .platform {
                    font-size: 12px;
                    border-radius: 4px;
                    color: #fff;
                    line-height: 1;
                    padding: 4px 8px;
                    background: $mainColor;
                }
                .appurl {
                    border-radius: 5px;
                    padding: 10px;
                    border: 1px solid $mainColor;
                    line-height: 25px;
                    text-align: left;
                    width: 250px;
                    word-wrap: break-word;
                    word-break: break-all;
                }
            }
        }

        .tip {
            margin-top: 30px;
            border-top: 1px solid #f2f2f2;
            text-align: center;
            font-size: 13px;
            color: #999;
        }
    }

    .radios {
        .el-radio {
            margin-right: 20px;
        }
    }

    .dialog-content {
        padding: 20px 0;
        .choose-app {
            display: flex;
            flex-wrap: wrap;
            overflow: auto;
            .choose-item {
                border-radius: 8px;
                padding: 20px 30px;
                margin: 10px 20px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                text-align: center;
                position: relative;

                &--checked {
                    background: rgba($color: $mainColor, $alpha: 0.1);
                }

                i {
                    margin-right: 2px;
                }

                .item-appicon {
                    object-fit: contain;
                    width: 100px;
                    height: 100px;
                }

                .item-check {
                    position: absolute;
                    right: 10px;
                    top: 0px;
                }
            }
        }
    }
}
</style>