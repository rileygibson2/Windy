package main.java.mqtt;

import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken;
import org.eclipse.paho.client.mqttv3.MqttCallback;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.eclipse.paho.client.mqttv3.MqttSecurityException;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;

import main.java.core.Record;
import main.java.debug.CLI;
import main.java.debug.CLI.Loc;
import main.java.mqtt.MQTTManager.SubscribeTopic;
import main.java.units.UnitUtils;

public class MQTTSubscriber {

	MqttClient client;
	SubscribeTopic topic;
	int qos;
	
	public MQTTSubscriber(String clientID, SubscribeTopic topic, int qos) throws MqttSecurityException, MqttException {
		this.client = new MqttClient(MQTTManager.broker, clientID, new MemoryPersistence());
		this.topic = topic;
		
		//Callback and connect
		client.setCallback(new MQTTSubscriberCallback(this.topic));
		MQTTUtil.connect(client);
		client.subscribe(topic.toString(), 2);
	}
	
	public MqttClient getClient() {return this.client;}
}

class MQTTSubscriberCallback implements MqttCallback {
	SubscribeTopic topic;
	
	public MQTTSubscriberCallback(SubscribeTopic topic) {
		this.topic = topic;
	}
	
	
	public void connectionLost(Throwable cause) {
		CLI.error(Loc.MQTT, "Connection Lost: " + cause.toString());
	}

	public void messageArrived(String top, MqttMessage payload) {
		String message = new String(payload.getPayload());
		SubscribeTopic topic = null;
		for (SubscribeTopic t : SubscribeTopic.values()) {
			if (top.equals(t.toString())) topic = t;
		}
		if (topic==null||topic!=this.topic) return;
		CLI.debug(Loc.MQTT, "Message: "+message+" (Topic: "+topic+")");
		
		if (!message.contains("|")) return; //Malformed or data-less message
		
		String unit = message.split("\\|")[0];
		String data[] = message.split("\\|")[1].split(",");
		if (unit==null||data==null) return;
		
		
		switch(topic) {
		case Log:
			//if (data.length!=7) return;
			//Record log = new Record(Long.parseLong(data[0].substring(0, data[0].length()-3)), ",");
			Record log = new Record(System.currentTimeMillis(), ",");
			log.setWS(Double.parseDouble(data[1]));
			log.setDir(Double.parseDouble(data[2]));
			UnitUtils.addLogToUnit(unit, log.toString());
			break;
		case StatusUpdate:
			//Split unit from log data
			if (data.length!=6) return;
			UnitUtils.updateUnitStatus(unit, data[0], Integer.parseInt(data[2]), data[3], data[4]);
			break;
		default:
			break;
		}
		
	}

	public void deliveryComplete(IMqttDeliveryToken token) {
		System.out.println("deliveryComplete---------" + token.isComplete());
	}
}
