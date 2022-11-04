package main.java.mqtt;

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
		cause.printStackTrace();
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
		switch(topic) {
		case Log:
			/*
			 * Log format:
			 * Log epoch time [0]
			 * Wind speed at time log dispatched [1]
			 * Peak gust time (in last minute lgo represents, epoch time of highest gust) [2]
			 * Peak gust (at peak gust time) [4]
			 * Min wind speed [5]
			 * Avg wind speed [6]
			 * Direction [7]
			 */
			/*if (data.length<7) return;
			String log = "["+data[0]+","+data[1]+","+data[7];
			if (Integer.parseInt(data[1])<DataManager.amberAlarm) log += ",1]";
			if (Integer.parseInt(data[1])>DataManager.amberAlarm) log += ",2]";
			if (Integer.parseInt(data[1])>DataManager.redAlarm) log += ",3]";
			CLI.debug(Loc.MQTT, "Unit: "+unit+" log: "+log);
			UnitUtils.addLogToUnit(unit, log);*/
			break;
		case StatusUpdate:
			/*
			 *	Status format
			 *	Local ip
			 *	Epoch time of status update
			 *	Battery level
			 *	Lat
			 *	Lon
			 *	Accuracy of location 
			 */
			
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
