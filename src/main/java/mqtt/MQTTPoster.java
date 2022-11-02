package main.java.mqtt;

import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.eclipse.paho.client.mqttv3.MqttPersistenceException;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;

import main.java.mqtt.MQTTManager.PostTopic;

public class MQTTPoster {
	
	private MqttClient client;
	private PostTopic topic;
	private int qos;
	
	public MQTTPoster(String clientID, PostTopic topic, int qos) throws MqttException {
		this.topic = topic;
		this.qos = qos;
		this.client = new MqttClient(MQTTManager.broker, clientID, new MemoryPersistence());
		MQTTUtil.connect(client);
	}
	
	public MqttClient getClient() {return this.client;}
}
