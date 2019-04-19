<template>
	<v-app id="app">
		<v-content fluid grid-list-md>
			<v-layout row wrap>
				<v-flex xs4 class="pr-1">
					<v-card class="pa-3" style="height:44vh">
						<v-select v-model="COM" :items="ports" label="选择串口"></v-select>
						<v-autocomplete
							v-model="BaudRate"
							:items="[300,600,1200,2400,4800,9600,19200,38400,43000,56000,57600,74880,115200,128000,230400,256000,460800]"
							label=" 波特率"
						></v-autocomplete>
						<v-btn :disabled="!port" @click="closeport" color="warning">关闭串口</v-btn>
						<v-btn @click="setPort" color="info">确认</v-btn>
					</v-card>
					<v-card class="mt-1 pa-3" style="height:55vh">
						<ExportData :stamp="dateStamp"/>
					</v-card>
				</v-flex>

				<v-flex xs8>
					<v-card flat dense style="height:100vh">
						<v-card style="height:calc(100% - 205px)" class="mb-1 pa-2">
							<p class="text-grey">
								<span>接收消息</span>
								<v-btn small class="py-0 my-0" color="warning" @click="messages=[]">清空</v-btn>
							</p>
							<div class="receive my-0">
								<p v-for="(message , i) in messages" :key="i">{{message}}</p>
								<div id="msg_end" style="height:5px; overflow:hidden"></div>
							</div>
						</v-card>
						<v-card style="height:200px" class="pa-2">
							<v-textarea class="my-0" box rows="3" label="发送消息" v-model="sendData" clearable></v-textarea>
							<v-card-actions class="py-0 my-0">
								<v-spacer></v-spacer>
								<v-menu top offset-y>
									<template v-slot:activator="{ on }">
										<v-btn
											:loading="productLoading"
											class="my-0 py-0 mx-1"
											small
											color="primary"
											outline
											v-on="on"
										>
											{{product.name}}
											<v-icon>keyboard_arrow_up</v-icon>
										</v-btn>
									</template>
									<v-list>
										<v-list-tile v-for="(item, index) in products" :key="index" @click="product = item">
											<v-list-tile-title>{{ item.name }}</v-list-tile-title>
										</v-list-tile>
									</v-list>
								</v-menu>
								<v-menu top offset-y>
									<template v-slot:activator="{ on }">
										<v-btn class="my-0 py-0 mx-1" small color="primary" outline v-on="on">
											{{sendCode}}
											<v-icon>keyboard_arrow_up</v-icon>
										</v-btn>
									</template>
									<v-list>
										<v-list-tile
											v-for="(item, index) in ['发送通常字符','发送16进制字符']"
											:key="index"
											@click="sendCode = item"
										>
											<v-list-tile-title>{{ item }}</v-list-tile-title>
										</v-list-tile>
									</v-list>
								</v-menu>
								<v-menu top offset-y>
									<template v-slot:activator="{ on }">
										<v-btn small color="primary" outline v-on="on">
											{{receiveCode}}
											<v-icon>keyboard_arrow_up</v-icon>
										</v-btn>
									</template>
									<v-list>
										<v-list-tile
											v-for="(item, index) in ['通常','16进制']"
											:key="index"
											@click="receiveCode = item"
										>
											<v-list-tile-title>{{ item }}</v-list-tile-title>
										</v-list-tile>
									</v-list>
								</v-menu>
							</v-card-actions>
							<v-card-actions class="py-1">
								<v-spacer></v-spacer>

								<!-- <v-btn
									class="my-0 py-0"
									outline
									small
									@click="sendData = sendData+`\\r\\n`"
									color="success"
								>\r\n</v-btn>-->
								<v-btn
									@click="sendTOPT"
									:disabled="readyToSend"
									:loading="TOPsending"
									class="my-0 py-0"
									small
									color="success"
								>发送TOPT</v-btn>
								<v-btn
									:disabled="!port"
									class="my-0 py-0"
									small
									color="success"
									@click="insertTimestamp"
								>输入时间戳</v-btn>
								<v-btn :disabled="!port" class="my-0 py-0" small color="success" @click="insertSID">输入SID</v-btn>

								<v-btn :disabled="!port" class="my-0 py-0" small @click="send" color="success">输入</v-btn>
							</v-card-actions>
						</v-card>
					</v-card>
				</v-flex>
			</v-layout>
		</v-content>
	</v-app>
</template>

<script>
import serialport from "serialport";
export default {
	name: "my-project",
	data: () => ({
		ports: [""],
		COM: "",
		port: null,
		BaudRate: 9600,
		sendData: "",
		messages: [],
		sendCode: "发送通常字符",
		receiveCode: "通常",
		products: [],
		product: { name: "单货道自动售货机", id: "01" },
		todayList: [],
		TOPsending: false,
		productLoading: true,
		TOPTstamp: "",
		TOPTSID: ""
	}),
	computed: {
		dateStamp() {
			let today = new Date();
			return `${today.getFullYear()}-${today.getMonth() +
				1}-${today.getDate()}`;
		},
		readyToSend() {
			if (!this.port) return true;
			if (this.product.id != "11") return true;
			return false;
		}
	},
	watch: {
		todayList() {
			this.saveToLocal();
		}
	},
	mounted() {
		serialport.list((err, ports) => {
			this.ports = Array.from(ports, el => el.comName);
		});
		if (localStorage.getItem(this.dateStamp)) {
			this.todayList = JSON.parse(localStorage.getItem(this.dateStamp));
		} else {
			localStorage.setItem(this.dateStamp, "[]");
		}
		fetch("https://api.iot.huanyuai.com/api/5cb96fccee5c0", {
			method: "GET",
			headers: {
				version: "v3.0"
			}
		}).then(e =>e.json().then(res => {
					let products = [],
						map = res.data;
					for (let i in map) {
						products.push({ name: map[i], id: i });
					}
					this.products = products;
					this.productLoading = false;
				})
			).catch(e => {
				this.products = [
					{ name: "单货道自动售货机", id: "01" },
					{ name: "多货道自动售货机", id: "02" },
					{ name: "共享充电线", id: "11" },
					{ name: "共享充电柜", id: "12" },
					{ name: "共享充电宝", id: "13" },
					{ name: "大盘纸自动厕纸机", id: "21" }
				];
				this.productLoading = false;
			});
	},
	methods: {
		setPort() {
			if (!this.COM) return;
			this.port = new serialport(this.COM, {
				baudRate: parseInt(this.BaudRate)
			});
			this.port.on("open",data=>{
				this.messages.push(`打开串口:${this.COM}，波特率:${this.BaudRate}`)	
				msg_end.scrollIntoView();
			})
			this.port.on("data", data => {
				if (this.receiveCode == "16进制") {
					this.messages.push("<- " + this.toHexString(data));
				} else {
					this.messages.push(`<- ${data}`);
				}
				msg_end.scrollIntoView();
			});
			this.port.on("error", err => {
				this.messages.push(`<- ${err}`);
				msg_end.scrollIntoView();
			});
			this.port.on("close", data => {
				this.messages.push(`已关闭串口`);				
				msg_end.scrollIntoView();
			});
		},
		closeport() {
			if(this.port){this.port.close();}
			this.port=null
		},
		send() {
			let data = this.sendData;
			this.messages.push("-> " + this.sendData);
			if (this.port != {} && this.port != null) {
				if (this.sendCode == "发送16进制字符") {
					data = Buffer.from(
						data.replace(/\s+/g, ""),
						"hex"
					).toString();
					this.port.write(data);
				} else {
					this.port.write(this.sendData);
				}
			}
		},
		toHexString(buffer) {
			var str = buffer.toString("hex");
			return str.replace(/(.{2})/g, "$1 ").toUpperCase();
		},
		insertSID() {
			const today = new Date();
			let counter = 0,
				SID = "";
			if (localStorage.getItem("counter")) {
				counter = `0000${1 +
					parseInt(localStorage.getItem("counter"))}`.slice(-4);
				localStorage.setItem("counter", counter);
			} else {
				localStorage.setItem("counter", "0000");
				counter = "0000";
			}
			SID = `HY${this.product.id}${`00${today.getMonth() + 1}`.slice(
				-2
			)}${today.getDate()}${`${today.getFullYear()}`.slice(
				-2
			)}${counter}`;
			this.sendData = `WR+SID=${SID}`;

			this.todayList.push({
				type: this.product.name,
				SID: SID
			});
			this.TOPTSID = SID;

			this.send();
		},
		insertTimestamp() {
			let stamp = `${`${new Date().getTime()}`.slice(0, 10)}`;
			this.sendData = `WR+TIME=${stamp}`;
			this.TOPTstamp = stamp;
			this.send();
		},
		saveToLocal() {
			localStorage.setItem(
				this.dateStamp,
				JSON.stringify(this.todayList)
			);
		},
		sendTOPT() {
			if (!this.TOPTstamp || !this.TOPTSID) return;
			let fd = new FormData();
			const _this = this;
			fd.append("deviceSN", this.TOPTSID);
			fd.append("timeStamp", this.TOPTstamp);
			this.TOPsending = true;
			fetch("https://api.iot.huanyuai.com/api/5cb822c03039a", {
				method: "POST",
				body: fd,
				headers: {
					version: "v3.0"
				}
			}).then(e => {
				e.json().then(res => {
					console.log(res);

					new Promise((resolve, reject) => {
						let key = res.data.key;
						if (key) resolve(key);
						else reject(res);
					})
						.then(key => {
							_this.sendData = key.join("\n");
							key.forEach((el, i) => {
								setTimeout(() => {
									_this.messages.push(`-> WR+TOPT${i}=${el}`);
									_this.port.write(`WR+TOPT${i}=${el}`);
								}, 50 + 250 * i);
							});
							_this.TOPsending = false;
						})
						.catch(res => console.log(res));
				});
			});
		}
	},
	components: {
		ExportData: () => import("./components/ExportData.vue")
	}
};
</script>
<style scoped>
.receive {
	height: calc(100% - 37px);
	width: 100%;
	border: 1px grey solid;
	padding: 10px;
	overflow-y: scroll;
}
.receive p {
	margin: 0;
	border-bottom: 1px #ddd solid;
}
</style>
