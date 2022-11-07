package main.java.mqtt;

import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.eclipse.paho.client.mqttv3.MqttPersistenceException;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;

import main.java.debug.CLI;
import main.java.debug.CLI.Loc;
import main.java.mqtt.MQTTManager.PostTopic;

public class MQTTPoster {
	
	private MqttClient client;
	private int qos;
	
	public MQTTPoster(String clientID, int qos) throws MqttException {
		this.qos = qos;
		this.client = new MqttClient(MQTTManager.broker, clientID, new MemoryPersistence());
		MQTTUtil.connect(client);
	}
	
	public MqttClient getClient() {return this.client;}
	
	public void sendMessage(String content, PostTopic topic) {
		if (!client.isConnected()) {
			CLI.error(Loc.MQTT, topic.toString()+"Client is not connected");
			return;
		}
		
		try {
			MQTTUtil.sendMessage(client, topic.toString(), qos, content);
		} catch (MqttException e) {
			CLI.error(Loc.MQTT, "Exception: "+e);
			e.printStackTrace();
		}
	}
}
