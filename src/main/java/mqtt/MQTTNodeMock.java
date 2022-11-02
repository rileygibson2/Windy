package main.java.mqtt;

import java.io.File;
import java.util.Arrays;
import java.util.Date;

import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;

import main.java.DataManager;
import main.java.mqtt.MQTTManager.SubscribeTopic;

public class MQTTNodeMock extends Thread {

	MqttClient client;
	SubscribeTopic topic;
	int qos;
	boolean stop;

	public MQTTNodeMock() throws MqttException {
		this.stop = false;
		this.topic = SubscribeTopic.Log;
		this.qos = 2;
		this.client = new MqttClient(MQTTManager.broker, "MQTTNodeMock-Log", new MemoryPersistence());
		MQTTUtil.connect(client);
	}

	@Override
	public void run() {
		while (!stop) {
			long record[] = new long[4];
			record[0] = new Date().getTime(); //Timestamp
			record[1] = (int) (Math.random()*(100-1)+1); //Windspeed
			record[2] = (int) (Math.random()*(360-0)+0); //Direction
			record[3] = 1; //Alert level
			if (record[1]>DataManager.amberAlarm) record[3] = 2;
			if (record[1]>DataManager.redAlarm) record[3] = 3;
			String out = Arrays.toString(record).replace(" ", "");

			String unit = new File("units").listFiles()[0].getName();
			
			try {
				MQTTUtil.sendMessage(client, topic.toString(), qos, unit+"-"+out);
			} catch (Exception e1) {e1.printStackTrace();}

			try {Thread.sleep(5000);}
			catch (InterruptedException e) {e.printStackTrace();}
		}
	}

	public MqttClient getClient() {return this.client;}
}
