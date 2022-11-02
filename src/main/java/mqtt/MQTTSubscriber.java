package main.java.mqtt;

import java.util.Arrays;

import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken;
import org.eclipse.paho.client.mqttv3.MqttCallback;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.eclipse.paho.client.mqttv3.MqttSecurityException;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;

import main.java.UnitUtils;
import main.java.debug.CLI;
import main.java.debug.CLI.Loc;
import main.java.mqtt.MQTTManager.SubscribeTopic;

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
		CLI.debug(Loc.MQTT, "Connection Lost: " + cause.getMessage());
	}

	public void messageArrived(String top, MqttMessage payload) {
		String message = new String(payload.getPayload());
		CLI.debug(Loc.MQTT, "Message: "+message+" (Topic: "+topic+")");
		SubscribeTopic topic = null;
		for (SubscribeTopic t : SubscribeTopic.values()) {
			if (top.equals(t.toString())) topic = t;
		}
		if (topic==null||topic!=this.topic) return;
		//windy3OZI8AWQKP
		
		switch(topic) {
		case Log:
			//Split unit from log data
			String unit = message.split("-")[0];
			String log = message.split("-")[1];
			CLI.debug(Loc.MQTT, "Unit: "+unit+" log: "+log);
			UnitUtils.addLogToUnit(unit, log);
			break;
		default:
			break;
		}
		
	}

	public void deliveryComplete(IMqttDeliveryToken token) {
		System.out.println("deliveryComplete---------" + token.isComplete());
	}
}
