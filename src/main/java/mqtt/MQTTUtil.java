package main.java.mqtt;

import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.eclipse.paho.client.mqttv3.MqttPersistenceException;
import org.eclipse.paho.client.mqttv3.MqttSecurityException;

import main.java.debug.CLI;
import main.java.debug.CLI.Loc;

public class MQTTUtil {

	public static void connect(MqttClient client) throws MqttSecurityException, MqttException {
		MqttConnectOptions options = new MqttConnectOptions();
		options.setCleanSession(true);
		options.setAutomaticReconnect(true);
		options.setKeepAliveInterval(60);
		//		options.setUserName(username);
		//		options.setPassword(password.toCharArray());
		client.connect(options);
		CLI.debug(Loc.MQTT, "Connected "+client.getClientId());
	}

	public static void disconnect(MqttClient client) throws MqttException {
		client.disconnect();
		CLI.debug(Loc.MQTT, "Disconnected "+client.getClientId());
	}
	
	public static void sendMessage(MqttClient client, String topic, int qos, String content) throws MqttPersistenceException, MqttException {
		if (client==null||!client.isConnected()) return;
		MqttMessage message = new MqttMessage(content.getBytes());
		message.setQos(qos);
		client.publish(topic, message);
	}
}
