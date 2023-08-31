const aedes = require("aedes")();
const server = require("net").createServer(aedes.handle);
const httpServer = require("http").createServer();
const _ = require("lodash");
// const ws = require("websocket-stream");

//포트 설정
const port = 1883;
// const MQTTS_PORT = parseInt(process.env.MQTTS_PORT) || 8883;
// const MQTT_WS_PORT = parseInt(process.env.MQTT_WS_PORT) || 80;
const MQTT_USERNAME = "test";
const MQTT_PASSWORD = "test11";
const MQTT_SUBSCRIBER_SERVICE =
  process.env.MQTT_SUBSCRIBER_SERVICE || "telegraf";
// const MQTT_EVMON_SERVICE = process.env.MQTT_EVMON_SERVICE || "queuemaker";
// const serviceName = "mogi";

//추가 ======================================================================

// ACLs 설정
const acls = [
  {
    // 클라이언트 식별을 위한 아이디 (클라이언트 식별방법에 따라 수정)
    clientId: "client1",
    // 발행(퍼블리시) 허용할 주제
    publish: [{ topic: "topic/publish" }],
    // 구독(서브스크라이브) 허용할 주제
    subscribe: [{ topic: "topic/subscribe" }],
  },
  // 다른 클라이언트에 대한 ACLs도 추가 가능
];

// 접근 제어 설정 적용

// aedes.on("client", (client, callback) => {
//   console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
//   const acl = acls.find((item) => item.clientId === client.id);
//   console.log("acl: ", acl);

//   if (acl) {
//     console.log(">>>>>>>>>>>>>>client.acl = acl", (client.acl = acl));

//     if ((client.acl = acl)) {
//       console.log("client.acl: ", client.acl);
//       callback(null, false);
//     }
//   }
// });

aedes.on("client", (client) => {
  const acl = acls.find((item) => item.clientId === client.id);

  if (!acl) {
    console.log(`클라이언트 ${client.id}의 ACL이 없습니다.`);
    // callback(new Error("클라이언트의 접근 권한이 없습니다."), false);
    return;
  } else if ((client.acl = acl)) {
    // console.log(`클라이언트 ${client.id}의 ACL이 설정되었습니다.`)
    // client.on("error");
  }

  // callback(null, true);
});

//추가 ======================================================================

server.listen(port, () => {
  console.log("Aedes listening on port:", port);
  aedes.publish({ topic: "aedes/hello", payload: "I'm broker " + aedes.id });
});
// httpServer.listen(wsPort, function () {
//   console.log("websocket server listening on port", wsPort);
//   aedes.publish({ topic: "aedes/hello", payload: "I'm broker " + aedes.id });
// });

aedes.authenticate = (client, username, password, callback) => {
  // NOTE: Implement this
  // NOTE: This is example code. Accept all if MQTT_USERNAME not defined
  if (MQTT_USERNAME === "") {
    callback(null, true);
    return;
  }
  // check login
  if (username === MQTT_USERNAME && password.toString() === MQTT_PASSWORD) {
    callback(null, true);
  } else {
    callback(null, false);
  }
};

(aedes.authorizePublish = (client, packet, callback) => {
  // NOTE: Implement this
  // NOTE: This is example code. Distribute messages to the subscribed nodes
  let mqttSubServiceName = MQTT_SUBSCRIBER_SERVICE;
  // for bluepoint device
  if (_.startsWith(packet.topic, "s/evmon")) {
    console.log("packet.topic = " + packet.topic);
    mqttSubServiceName = MQTT_SUBSCRIBER_SERVICE;
  } else if (_.startsWith(packet.topic, "cmd/")) {
    return callback(null);
  }

  // let nodeList = etcdHelper.getServiceNodeList(mqttSubServiceName);
  nodeList = ["telegraf-dev-app1", "telegraf-dev-app3", "telegraf-dev-app2"];
  if (nodeList) {
    let rand = _.random(0, nodeList.length - 1);
    console.log(">>>>>>>>>>>>rand: ", rand);
    let node = nodeList[rand].replace(mqttSubServiceName + "-", "");
    console.log(">>>>>>>>>>>>>node1: ", node);
    if (!_.startsWith(packet.topic, "/")) {
      node += "/";
    }
    console.log(">>>>>>>>>>>>>node2: ", node);
    packet.topic = node + packet.topic;
    console.log(">>>>>>>>>>packet.topic : ", packet.topic);
  }
  callback(null);
}),
  (aedes.authorizeSubscribe = (client, sub, callback) => {
    // NOTE: Implement this

    console.log(">>>>>>>sub",sub);
    callback(null, sub);
  });

aedes.on("subscribe", (subscriptions, client) => {
  console.log(
    "MQTT client " +
      client.id +
      " subscribed to topics: " +
      subscriptions.map((s) => s.topic).join("\n"),
    "from broker",
    aedes.id
  );
});
aedes.on("unsubscribe", (subscriptions, client) => {
  console.log(
    "MQTT client " +
      (client ? client.id : client) +
      " unsubscribed to topics: " +
      subscriptions.join("\n"),
    "from broker",
    aedes.id
  );
});
// fired when a client connects
aedes.on("client", (client) => {
  console.log(
    "Client Connected: " + (client ? client.id : client),
    "to broker",
    aedes.id
  );
  let mqttSubServiceName = MQTT_SUBSCRIBER_SERVICE;
  console.log("MQTT_SUBSCRIBER_SERVICE = " + MQTT_SUBSCRIBER_SERVICE);
  // let nodeList = etcdHelper.getServiceNodeList("telegraf");
  // console.log("nodeList : " + nodeList);
});
// fired when a client disconnects
aedes.on("clientDisconnect", (client) => {
  console.log(
    "Client Disconnected: " + (client ? client.id : client),
    "to broker",
    aedes.id
  );
});
// fired when a message is published
aedes.on("publish", (packet, client) => {
  // __awaiter(this, void 0, void 0, function* () {
  //   // console.log('Client ' + (client ? client.id : 'BROKER_' + aedes.id) + ' has published', packet.payload.
  //   // toString(), 'on', packet.topic, 'to broker', aedes.id);
  // })

  if (client) {
    console.log(
      `MESSAGE_PUBLISHED : MQTT Client ${
        client ? client.id : "AEDES BROKER_" + aedes.id
      } has published message "${packet.payload}" on ${
        packet.topic
      } to aedes broker ${aedes.id}`
    );
  }
});
